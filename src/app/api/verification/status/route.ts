import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import type { VerificationRequest, User } from '@/types';

interface DbVerificationRequest extends Omit<VerificationRequest, 'id'> {
  _id: string;
}

interface DbUser extends Omit<User, 'id'> {
  _id: string;
}

export async function GET() {
  try {
    const user = await requireSessionUser();
    const users = await getCollection<DbUser>('users');
    const requests = await getCollection<DbVerificationRequest>('verificationRequests');

    const account = await users.findOne({ _id: user.id });
    const latestRequest = await requests.findOne({ userId: user.id }, { sort: { createdAt: -1 } });

    return NextResponse.json({
      verified: account?.verified || false,
      requestStatus: latestRequest?.status || null
    });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
