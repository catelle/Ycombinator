import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { sendNotificationEmail } from '@/lib/email';
import type { Match, Team, User } from '@/types';

const CancelSchema = z.object({
  matchId: z.string().min(1),
  reason: z.string().min(4).optional()
});

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
    const { matchId, reason } = CancelSchema.parse(body);

    const matches = await getCollection<DbMatch>('matches');
    const users = await getCollection<DbUser>('users');
    const teams = await getCollection<DbTeam>('teams');

    const match = await matches.findOne({ _id: matchId });
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.state !== 'LOCKED' && match.state !== 'VERIFIED') {
      return NextResponse.json({ error: 'Only locked matches can be cancelled' }, { status: 400 });
    }

    const now = new Date();
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
          cancellationReason: reason || 'Admin cancellation',
          updatedAt: now
        }
      }
    );

    await teams.updateMany(
      { status: 'locked', memberIds: { $all: [match.userId, match.matchedUserId] } },
      { $set: { status: 'forming', updatedAt: now } }
    );

    const [userA, userB] = await Promise.all([
      users.findOne({ _id: match.userId }),
      users.findOne({ _id: match.matchedUserId })
    ]);

    await Promise.all([
      createNotification({
        userId: match.userId,
        type: 'match_cancellation',
        title: 'Match cancelled by admin',
        message: reason ? `Admin cancelled a match. Reason: ${reason}` : 'Admin cancelled a match.',
        actionUrl: '/matches'
      }),
      createNotification({
        userId: match.matchedUserId,
        type: 'match_cancellation',
        title: 'Match cancelled by admin',
        message: reason ? `Admin cancelled a match. Reason: ${reason}` : 'Admin cancelled a match.',
        actionUrl: '/matches'
      })
    ]);

    if (userA?.email) {
      await sendNotificationEmail({
        toEmail: userA.email,
        name: userA.name || 'Founder',
        subject: 'Match cancelled by admin',
        message: reason ? `Admin cancelled a match. Reason: ${reason}` : 'Admin cancelled a match.',
        actionUrl: `${process.env.EMAILJS_ORIGIN || 'http://localhost:3000'}/matches`
      });
    }
    if (userB?.email) {
      await sendNotificationEmail({
        toEmail: userB.email,
        name: userB.name || 'Founder',
        subject: 'Match cancelled by admin',
        message: reason ? `Admin cancelled a match. Reason: ${reason}` : 'Admin cancelled a match.',
        actionUrl: `${process.env.EMAILJS_ORIGIN || 'http://localhost:3000'}/matches`
      });
    }

    await logAudit({
      actorId: admin.id,
      action: 'match_cancel',
      metadata: { matchId, reason: reason || 'not_provided' }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to cancel match' }, { status: 400 });
  }
}
