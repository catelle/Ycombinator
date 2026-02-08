import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import type { Notification } from '@/types';

const ReadSchema = z.object({
  id: z.string().optional(),
  all: z.boolean().optional()
});

interface DbNotification extends Omit<Notification, 'id'> {
  _id: string;
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = await request.json();
    const { id, all } = ReadSchema.parse(body);

    const notifications = await getCollection<DbNotification>('notifications');
    const now = new Date();

    if (all) {
      await notifications.updateMany({ userId: user.id, readAt: { $exists: false } }, { $set: { readAt: now } });
      return NextResponse.json({ ok: true });
    }

    if (!id) {
      return NextResponse.json({ error: 'Notification id required' }, { status: 400 });
    }

    await notifications.updateOne(
      { _id: id, userId: user.id },
      { $set: { readAt: now } }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 400 });
  }
}
