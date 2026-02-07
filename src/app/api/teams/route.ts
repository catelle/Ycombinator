import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { createId } from '@/lib/ids';
import type { Team } from '@/types';

interface DbTeam extends Omit<Team, 'id'> {
  _id: string;
}

export async function GET() {
  try {
    const user = await requireSessionUser();
    const teams = await getCollection<DbTeam>('teams');
    const team = await teams.findOne({ memberIds: user.id });

    if (!team) {
      return NextResponse.json({ team: null });
    }

    return NextResponse.json({ team: mapTeam(team) });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST() {
  try {
    const user = await requireSessionUser();
    const teams = await getCollection<DbTeam>('teams');

    const existing = await teams.findOne({ memberIds: user.id });
    if (existing) {
      return NextResponse.json({ team: mapTeam(existing) });
    }

    const team: DbTeam = {
      _id: createId(),
      ownerId: user.id,
      memberIds: [user.id],
      status: 'forming',
      maxMembers: 5,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await teams.insertOne(team);
    return NextResponse.json({ team: mapTeam(team) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create team' }, { status: 400 });
  }
}

function mapTeam(team: DbTeam): Team {
  return {
    id: team._id,
    ownerId: team.ownerId,
    memberIds: team.memberIds,
    status: team.status,
    maxMembers: team.maxMembers,
    createdAt: team.createdAt,
    updatedAt: team.updatedAt
  };
}
