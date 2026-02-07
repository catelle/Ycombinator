import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import type { Team, Match } from '@/types';
import { logAudit } from '@/lib/audit';

interface DbTeam extends Omit<Team, 'id'> {
  _id: string;
}

interface DbMatch extends Omit<Match, 'id'> {
  _id: string;
}

export async function POST() {
  try {
    const user = await requireSessionUser();
    const teams = await getCollection<DbTeam>('teams');
    const matches = await getCollection<DbMatch>('matches');

    const team = await teams.findOne({ memberIds: user.id });
    if (!team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    if (team.memberIds.length < 2) {
      return NextResponse.json({ error: 'Add at least one member before locking' }, { status: 400 });
    }

    await teams.updateOne(
      { _id: team._id },
      { $set: { status: 'locked', updatedAt: new Date() } }
    );

    await matches.updateMany(
      { userId: user.id, matchedUserId: { $in: team.memberIds } },
      { $set: { state: 'LOCKED', updatedAt: new Date() } }
    );

    await logAudit({
      actorId: user.id,
      action: 'lock',
      metadata: { teamId: team._id }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to lock team' }, { status: 400 });
  }
}
