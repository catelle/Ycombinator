import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { sendNotificationEmail } from '@/lib/email';
import type { Match, MatchCancellationRequest, Team, User } from '@/types';

const DecisionSchema = z.object({
  requestId: z.string().min(1),
  decision: z.enum(['approved', 'rejected']),
  note: z.string().min(4).optional()
});

interface DbMatchCancellation extends Omit<MatchCancellationRequest, 'id'> {
  _id: string;
}

interface DbMatch extends Omit<Match, 'id'> {
  _id: string;
}

interface DbUser extends Omit<User, 'id'> {
  _id: string;
}

interface DbTeam extends Omit<Team, 'id'> {
  _id: string;
}

export async function POST(request: Request) {
  try {
    const admin = await requireSessionUser();
    if (admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { requestId, decision, note } = DecisionSchema.parse(body);

    const requests = await getCollection<DbMatchCancellation>('matchCancellationRequests');
    const matches = await getCollection<DbMatch>('matches');
    const users = await getCollection<DbUser>('users');
    const teams = await getCollection<DbTeam>('teams');

    const doc = await requests.findOne({ _id: requestId });
    if (!doc) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (doc.status !== 'accepted') {
      return NextResponse.json({ error: 'Request not ready for admin decision' }, { status: 400 });
    }

    const now = new Date();
    const status = decision === 'approved' ? 'approved' : 'rejected';
    await requests.updateOne(
      { _id: doc._id },
      {
        $set: {
          status,
          adminId: admin.id,
          adminDecisionNote: note,
          decidedAt: now,
          updatedAt: now
        }
      }
    );

    if (decision === 'approved') {
      const match = await matches.findOne({ _id: doc.matchId });
      if (match) {
        await matches.updateMany(
          {
            $or: [
              { userId: match.userId, matchedUserId: match.matchedUserId },
              { userId: match.matchedUserId, matchedUserId: match.userId }
            ]
          },
          {
            $set: {
              state: 'CANCELLED',
              cancelledAt: now,
              cancelledBy: admin.id,
              cancellationReason: note || doc.requesterReason,
              cancellationRequestId: doc._id,
              updatedAt: now
            }
          }
        );

        await teams.updateMany(
          { status: 'locked', memberIds: { $all: [match.userId, match.matchedUserId] } },
          { $set: { status: 'forming', updatedAt: now } }
        );
      }
    }

    const requester = await users.findOne({ _id: doc.requesterId });
    const recipient = await users.findOne({ _id: doc.recipientId });
    const statusLabel = decision === 'approved' ? 'approved' : 'rejected';

    await Promise.all([
      createNotification({
        userId: doc.requesterId,
        type: 'match_cancellation',
        title: `Cancellation ${statusLabel}`,
        message: `Your cancellation request was ${statusLabel} by admin.`,
        actionUrl: '/matches'
      }),
      createNotification({
        userId: doc.recipientId,
        type: 'match_cancellation',
        title: `Cancellation ${statusLabel}`,
        message: `A cancellation request was ${statusLabel} by admin.`,
        actionUrl: '/matches'
      })
    ]);

    if (requester?.email) {
      await sendNotificationEmail({
        toEmail: requester.email,
        name: requester.name || 'Founder',
        subject: `Cancellation ${statusLabel}`,
        message: `Your cancellation request was ${statusLabel} by admin.`,
        actionUrl: `${process.env.EMAILJS_ORIGIN || 'http://localhost:3000'}/matches`
      });
    }
    if (recipient?.email) {
      await sendNotificationEmail({
        toEmail: recipient.email,
        name: recipient.name || 'Founder',
        subject: `Cancellation ${statusLabel}`,
        message: `A cancellation request was ${statusLabel} by admin.`,
        actionUrl: `${process.env.EMAILJS_ORIGIN || 'http://localhost:3000'}/matches`
      });
    }

    await logAudit({
      actorId: admin.id,
      action: 'match_cancel',
      metadata: { requestId: doc._id, matchId: doc.matchId, decision }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to decide cancellation request' }, { status: 400 });
  }
}
