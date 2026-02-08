import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { createNotification } from '@/lib/notifications';
import { sendNotificationEmail } from '@/lib/email';
import { logAudit } from '@/lib/audit';
import type { MatchCancellationRequest, Profile, User } from '@/types';

const RespondSchema = z.object({
  requestId: z.string().min(1),
  decision: z.enum(['accepted', 'declined']),
  response: z.string().min(4)
});

interface DbMatchCancellation extends Omit<MatchCancellationRequest, 'id'> {
  _id: string;
}

interface DbProfile extends Omit<Profile, 'id'> {
  _id: string;
}

interface DbUser extends Omit<User, 'id'> {
  _id: string;
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = await request.json();
    const { requestId, decision, response } = RespondSchema.parse(body);

    const requests = await getCollection<DbMatchCancellation>('matchCancellationRequests');
    const profiles = await getCollection<DbProfile>('profiles');
    const users = await getCollection<DbUser>('users');

    const doc = await requests.findOne({ _id: requestId, recipientId: user.id });
    if (!doc) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (doc.status !== 'pending') {
      return NextResponse.json({ error: 'Request already handled' }, { status: 400 });
    }

    const nextStatus = decision === 'accepted' ? 'accepted' : 'declined';
    await requests.updateOne(
      { _id: doc._id },
      { $set: { status: nextStatus, recipientResponse: response, updatedAt: new Date() } }
    );

    const recipientProfile = await profiles.findOne({ userId: user.id });
    const recipientDisplay = recipientProfile?.alias?.trim() || recipientProfile?.name || 'Founder';

    try {
      await createNotification({
        userId: doc.requesterId,
        type: 'match_cancellation',
        title: `Cancellation ${nextStatus}`,
        message: `${recipientDisplay} has ${nextStatus} your cancellation request.`,
        actionUrl: '/requests'
      });

      const requesterUser = await users.findOne({ _id: doc.requesterId });
      if (requesterUser?.email) {
        await sendNotificationEmail({
          toEmail: requesterUser.email,
          name: requesterUser.name || 'Founder',
          subject: `Cancellation ${nextStatus}`,
          message: `${recipientDisplay} has ${nextStatus} your cancellation request.`,
          actionUrl: `${process.env.EMAILJS_ORIGIN || 'http://localhost:3000'}/requests`
        });
      }
    } catch (notifyError) {
      console.error('Failed to send cancellation response notification', notifyError);
    }

    if (decision === 'accepted') {
      const admins = await users.find({ role: 'admin' }).toArray();
      await Promise.all(admins.map(admin => createNotification({
        userId: admin._id,
        type: 'system',
        title: 'Cancellation request accepted',
        message: `A cancellation request is ready for review.`,
        actionUrl: '/admin/matching'
      })));
    }

    await logAudit({
      actorId: user.id,
      action: 'match_cancel_request',
      metadata: { requestId: doc._id, decision }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to respond to cancellation request' }, { status: 400 });
  }
}
