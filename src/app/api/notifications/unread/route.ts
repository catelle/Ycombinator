import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import type { Notification } from '@/types';

interface DbNotification extends Omit<Notification, 'id'> {
  _id: string;
}

export async function GET() {
  try {
    const user = await requireSessionUser();
    const notifications = await getCollection<DbNotification>('notifications');
    const unreadCount = await notifications.countDocuments({ userId: user.id, readAt: { $exists: false } });
    return NextResponse.json({ unreadCount });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load unread count' }, { status: 400 });
  }
}
