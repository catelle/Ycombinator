import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { MATCH_REQUEST_EXPIRATION_MS, MATCH_LIMIT_PRICE_XAF, resolveMatchLimit } from '@/lib/match-utils';
import type { Match, MatchRequest } from '@/types';

const RespondSchema = z.object({
  requestId: z.string().min(1),
  decision: z.enum(['accepted', 'declined'])
});

interface DbMatchRequest extends Omit<MatchRequest, 'id'> {
  _id: string;
}

interface DbMatch extends Omit<Match, 'id'> {
  _id: string;
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = await request.json();
    const { requestId, decision } = RespondSchema.parse(body);

    const requests = await getCollection<DbMatchRequest>('matchRequests');
    const matches = await getCollection<DbMatch>('matches');

    const doc = await requests.findOne({ _id: requestId, recipientId: user.id });
    if (!doc) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const expiresAt = doc.expiresAt || new Date(doc.createdAt.getTime() + MATCH_REQUEST_EXPIRATION_MS);
    if (doc.status === 'pending' && expiresAt.getTime() < Date.now()) {
      await requests.updateOne({ _id: doc._id }, { $set: { status: 'expired', updatedAt: new Date() } });
      return NextResponse.json({ error: 'Request expired', code: 'EXPIRED' }, { status: 410 });
    }

    if (doc.status !== 'pending') {
      return NextResponse.json({ error: 'Request already handled' }, { status: 400 });
    }

    if (decision === 'accepted') {
      const matchCount = await matches.countDocuments({
        userId: user.id,
        state: { $in: ['UNLOCKED', 'LOCKED', 'VERIFIED'] }
      });
      const matchLimit = resolveMatchLimit(user.matchLimit);
      if (matchCount >= matchLimit) {
        return NextResponse.json(
          { error: 'Match limit reached', code: 'MATCH_LIMIT', upgradePrice: MATCH_LIMIT_PRICE_XAF },
          { status: 403 }
        );
      }

      await requests.updateOne(
        { _id: doc._id },
        { $set: { status: 'accepted', acceptedAt: new Date(), updatedAt: new Date() } }
      );
    } else {
      await requests.updateOne(
        { _id: doc._id },
        { $set: { status: 'declined', updatedAt: new Date() } }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to respond to request' }, { status: 400 });
  }
}
