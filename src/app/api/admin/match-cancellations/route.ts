import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import type { MatchCancellationRequest, Match, Profile } from '@/types';

interface DbMatchCancellation extends Omit<MatchCancellationRequest, 'id'> {
  _id: string;
}

interface DbMatch extends Omit<Match, 'id'> {
  _id: string;
}

interface DbProfile extends Omit<Profile, 'id'> {
  _id: string;
}

export async function GET() {
  try {
    const admin = await requireSessionUser();
    if (admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const requests = await getCollection<DbMatchCancellation>('matchCancellationRequests');
    const matches = await getCollection<DbMatch>('matches');
    const profiles = await getCollection<DbProfile>('profiles');

    const docs = await requests.find({}).sort({ createdAt: -1 }).toArray();
    const matchIds = Array.from(new Set(docs.map(doc => doc.matchId)));
    const matchDocs = await matches.find({ _id: { $in: matchIds } }).toArray();
    const matchMap = new Map(matchDocs.map(match => [match._id, match]));

    const userIds = Array.from(
      new Set(docs.flatMap(doc => [doc.requesterId, doc.recipientId]))
    );
    const profileDocs = await profiles.find({ userId: { $in: userIds } }).toArray();
    const profileMap = new Map(profileDocs.map(profile => [profile.userId, profile]));

    const payload = docs.map(doc => {
      const match = matchMap.get(doc.matchId);
      const requesterProfile = profileMap.get(doc.requesterId);
      const recipientProfile = profileMap.get(doc.recipientId);

      return {
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
        matchState: match?.state,
        matchScore: match?.score,
        requesterAlias: requesterProfile?.alias || requesterProfile?.name || 'Founder',
        recipientAlias: recipientProfile?.alias || recipientProfile?.name || 'Founder'
      };
    });

    return NextResponse.json({ requests: payload });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load cancellation requests' }, { status: 400 });
  }
}
