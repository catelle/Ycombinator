import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import type { Match, MatchCancellationRequest, Profile, VerificationRequest, User } from '@/types';

interface DbMatch extends Omit<Match, 'id'> {
  _id: string;
}

interface DbVerificationRequest extends Omit<VerificationRequest, 'id'> {
  _id: string;
}

interface DbCancellationRequest extends Omit<MatchCancellationRequest, 'id'> {
  _id: string;
}

interface DbProfile extends Omit<Profile, 'id'> {
  _id: string;
}

interface DbUser extends Omit<User, 'id'> {
  _id: string;
  suspended?: boolean;
  phone?: string;
  emailVerified?: boolean;
  deletedAt?: Date;
  deletedBy?: string;
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
    const cancellationsCollection = await getCollection<DbCancellationRequest>('matchCancellationRequests');
    const profilesCollection = await getCollection<DbProfile>('profiles');

    const users = (await usersCollection.find({}).toArray()).map(mapUser);
    const matchesRaw = await matchesCollection.find({}).toArray();
    const verificationRequests = (await requestsCollection.find({}).toArray()).map(mapRequest);
    const cancellations = await cancellationsCollection.find({}).sort({ createdAt: -1 }).toArray();

    const profileDocs = await profilesCollection.find({
      userId: {
        $in: Array.from(
          new Set([
            ...matchesRaw.flatMap(match => [match.userId, match.matchedUserId]),
            ...cancellations.flatMap(request => [request.requesterId, request.recipientId])
          ])
        )
      }
    }).toArray();
    const profileMap = new Map(profileDocs.map(profile => [profile.userId, profile]));
    const userMap = new Map(users.map(user => [user.id, user]));

    const matches = matchesRaw.map(match => mapMatchView(match, userMap, profileMap));

    const cancellationPayload = cancellations.map(doc => {
      const requesterProfile = profileMap.get(doc.requesterId);
      const recipientProfile = profileMap.get(doc.recipientId);
      const requesterUser = userMap.get(doc.requesterId);
      const recipientUser = userMap.get(doc.recipientId);

      return ({
        id: doc._id,
        matchId: doc.matchId,
        status: doc.status,
        requesterId: doc.requesterId,
        recipientId: doc.recipientId,
        requesterReason: doc.requesterReason,
        recipientResponse: doc.recipientResponse,
        adminDecisionNote: doc.adminDecisionNote,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        requesterAlias: requesterProfile?.alias || requesterUser?.name || 'Founder',
        recipientAlias: recipientProfile?.alias || recipientUser?.name || 'Founder'
      });
    });

    return NextResponse.json({ users, matches, verificationRequests, cancellationRequests: cancellationPayload });
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
    emailVerified: user.emailVerified,
    deletedAt: user.deletedAt,
    deletedBy: user.deletedBy
  };
}

function mapMatchView(
  match: DbMatch,
  userMap: Map<string, User>,
  profileMap: Map<string, DbProfile>
): Match & { userA: { id: string; name: string; email: string; alias?: string }; userB: { id: string; name: string; email: string; alias?: string } } {
  const userA = userMap.get(match.userId);
  const userB = userMap.get(match.matchedUserId);
  const profileA = profileMap.get(match.userId);
  const profileB = profileMap.get(match.matchedUserId);

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
    updatedAt: match.updatedAt,
    cancelledAt: match.cancelledAt,
    cancelledBy: match.cancelledBy,
    cancellationReason: match.cancellationReason,
    cancellationRequestId: match.cancellationRequestId,
    userA: {
      id: match.userId,
      name: userA?.name || 'Unknown',
      email: userA?.email || '',
      alias: profileA?.alias
    },
    userB: {
      id: match.matchedUserId,
      name: userB?.name || 'Unknown',
      email: userB?.email || '',
      alias: profileB?.alias
    }
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
