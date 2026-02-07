import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { createId } from '@/lib/ids';
import type { AccompanimentRequest, Team } from '@/types';

const RequestSchema = z.object({
  type: z.enum(['incubator', 'accelerator', 'platform']),
  providerName: z.string().optional()
});

interface DbTeam extends Omit<Team, 'id'> {
  _id: string;
}

interface DbRequest extends Omit<AccompanimentRequest, 'id'> {
  _id: string;
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = await request.json();
    const payload = RequestSchema.parse(body);

    const teams = await getCollection<DbTeam>('teams');
    const team = await teams.findOne({ memberIds: user.id, status: 'locked' });

    if (!team) {
      return NextResponse.json({ error: 'Team must be locked first' }, { status: 400 });
    }

    const requests = await getCollection<DbRequest>('accompanimentRequests');
    await requests.insertOne({
      _id: createId(),
      teamId: team._id,
      userId: user.id,
      type: payload.type,
      providerName: payload.providerName,
      createdAt: new Date()
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit accompaniment request' }, { status: 400 });
  }
}
