import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { createId } from '@/lib/ids';
import type { Block } from '@/types';

const BlockSchema = z.object({
  blockedUserId: z.string().min(1)
});

interface DbBlock extends Omit<Block, 'id'> {
  _id: string;
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = await request.json();
    const { blockedUserId } = BlockSchema.parse(body);

    const blocks = await getCollection<DbBlock>('blocks');
    await blocks.insertOne({
      _id: createId(),
      blockerId: user.id,
      blockedUserId,
      createdAt: new Date()
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to block user' }, { status: 400 });
  }
}
