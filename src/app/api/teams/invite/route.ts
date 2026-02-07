import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import type { Match, Team } from '@/types';

const InviteSchema = z.object({
  matchId: z.string().min(1)
});

interface DbMatch extends Omit<Match, 'id'> {
  _id: string;
}

interface DbTeam extends Omit<Team, 'id'> {
  _id: string;
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = await request.json();
    const { matchId } = InviteSchema.parse(body);

    const matches = await getCollection<DbMatch>('matches');
    const teams = await getCollection<DbTeam>('teams');

    const match = await matches.findOne({ _id: matchId, userId: user.id });
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.state !== 'UNLOCKED' && match.state !== 'VERIFIED') {
      return NextResponse.json({ error: 'Match must be unlocked to invite' }, { status: 400 });
    }

    const team = await teams.findOne({ memberIds: user.id });
    if (!team) {
      return NextResponse.json({ error: 'Create a team first' }, { status: 400 });
    }

    if (team.status === 'locked') {
      return NextResponse.json({ error: 'Team already locked' }, { status: 400 });
    }

    if (team.memberIds.length >= team.maxMembers) {
      return NextResponse.json({ error: 'Team is full' }, { status: 400 });
    }

    const memberIds = Array.from(new Set([...team.memberIds, match.matchedUserId]));
    await teams.updateOne(
      { _id: team._id },
      { $set: { memberIds, updatedAt: new Date() } }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to invite match' }, { status: 400 });
  }
}
