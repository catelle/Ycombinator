import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import type { Match } from '@/types';

const DecisionSchema = z.object({
  matchId: z.string().min(1),
  decision: z.enum(['accepted', 'rejected'])
});

interface DbMatch extends Omit<Match, 'id'> {
  _id: string;
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = await request.json();
    const { matchId, decision } = DecisionSchema.parse(body);

    const matches = await getCollection<DbMatch>('matches');
    const match = await matches.findOne({ _id: matchId, userId: user.id });
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    await matches.updateOne(
      { _id: matchId },
      { $set: { decision, updatedAt: new Date() } }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update decision' }, { status: 400 });
  }
}
