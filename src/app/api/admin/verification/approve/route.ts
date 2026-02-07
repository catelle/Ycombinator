import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import type { VerificationRequest, User, Profile, Match } from '@/types';

const ApproveSchema = z.object({
  requestId: z.string().min(1)
});

interface DbVerificationRequest extends Omit<VerificationRequest, 'id'> {
  _id: string;
}

interface DbUser extends Omit<User, 'id'> {
  _id: string;
  suspended?: boolean;
}

interface DbProfile extends Omit<Profile, 'id'> {
  _id: string;
}

interface DbMatch extends Omit<Match, 'id'> {
  _id: string;
}

export async function POST(request: Request) {
  try {
    const admin = await requireSessionUser();
    if (admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { requestId } = ApproveSchema.parse(body);

    const requests = await getCollection<DbVerificationRequest>('verificationRequests');
    const users = await getCollection<DbUser>('users');
    const profiles = await getCollection<DbProfile>('profiles');
    const matches = await getCollection<DbMatch>('matches');

    const verification = await requests.findOne({ _id: requestId });
    if (!verification) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    await requests.updateOne(
      { _id: requestId },
      { $set: { status: 'approved', reviewedBy: admin.id, updatedAt: new Date() } }
    );

    await users.updateOne(
      { _id: verification.userId },
      { $set: { verified: true } }
    );

    await profiles.updateOne(
      { userId: verification.userId },
      { $set: { verified: true, updatedAt: new Date() } }
    );

    await matches.updateMany(
      { $or: [{ userId: verification.userId }, { matchedUserId: verification.userId }] },
      { $set: { state: 'VERIFIED', updatedAt: new Date() } }
    );

    await logAudit({
      actorId: admin.id,
      action: 'verification',
      metadata: { requestId, userId: verification.userId }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to approve verification' }, { status: 400 });
  }
}
