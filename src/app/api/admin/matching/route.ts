import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import type { Match, VerificationRequest, User } from '@/types';

interface DbMatch extends Omit<Match, 'id'> {
  _id: string;
}

interface DbVerificationRequest extends Omit<VerificationRequest, 'id'> {
  _id: string;
}

interface DbUser extends Omit<User, 'id'> {
  _id: string;
  suspended?: boolean;
  phone?: string;
  emailVerified?: boolean;
}

export async function GET() {
  try {
    const user = await requireSessionUser();
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const usersCollection = await getCollection<DbUser>('users');
    const matchesCollection = await getCollection<DbMatch>('matches');
    const requestsCollection = await getCollection<DbVerificationRequest>('verificationRequests');

    const users = (await usersCollection.find({}).toArray()).map(mapUser);
    const matches = (await matchesCollection.find({}).toArray()).map(mapMatch);
    const verificationRequests = (await requestsCollection.find({}).toArray()).map(mapRequest);

    return NextResponse.json({ users, matches, verificationRequests });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load admin data' }, { status: 400 });
  }
}

function mapUser(user: DbUser): User {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
    verified: user.verified,
    suspended: user.suspended,
    emailVerified: user.emailVerified
  };
}

function mapMatch(match: DbMatch): Match {
  return {
    id: match._id,
    userId: match.userId,
    matchedUserId: match.matchedUserId,
    score: match.score,
    state: match.state,
    matchType: match.matchType,
    decision: match.decision,
    unlockPaymentId: match.unlockPaymentId,
    createdAt: match.createdAt,
    updatedAt: match.updatedAt
  };
}

function mapRequest(request: DbVerificationRequest): VerificationRequest {
  return {
    id: request._id,
    userId: request.userId,
    status: request.status,
    amount: request.amount,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    reviewedBy: request.reviewedBy
  };
}
