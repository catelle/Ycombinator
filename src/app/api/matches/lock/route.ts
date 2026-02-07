import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Match, Team } from '@/types';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { createId } from '@/lib/ids';
import { logAudit } from '@/lib/audit';

const LockSchema = z.object({
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
    const { matchId } = LockSchema.parse(body);

    const matches = await getCollection<DbMatch>('matches');
    const teams = await getCollection<DbTeam>('teams');

    const match = await matches.findOne({ _id: matchId, userId: user.id });
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.state !== 'UNLOCKED' && match.state !== 'VERIFIED') {
      return NextResponse.json({ error: 'Match must be unlocked before locking' }, { status: 400 });
    }

    const existingTeam = await teams.findOne({ memberIds: user.id });
    if (existingTeam && existingTeam.status === 'locked') {
      return NextResponse.json({ error: 'You already have a locked team' }, { status: 400 });
    }

    if (existingTeam) {
      if (existingTeam.memberIds.length >= existingTeam.maxMembers) {
        return NextResponse.json({ error: 'Team is full' }, { status: 400 });
      }

      const updatedMembers = Array.from(new Set([...existingTeam.memberIds, match.matchedUserId]));
      await teams.updateOne(
        { _id: existingTeam._id },
        { $set: { memberIds: updatedMembers, status: 'locked', updatedAt: new Date() } }
      );
    } else {
      await teams.insertOne({
        _id: createId(),
        ownerId: user.id,
        memberIds: [user.id, match.matchedUserId],
        status: 'locked',
        maxMembers: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await matches.updateOne(
      { _id: matchId },
      { $set: { state: 'LOCKED', updatedAt: new Date() } }
    );

    await logAudit({
      actorId: user.id,
      action: 'lock',
      metadata: { matchId }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to lock match' }, { status: 400 });
  }
}
