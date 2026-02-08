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

    const docs = await notifications
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .toArray();

    const unreadCount = docs.filter(doc => !doc.readAt).length;

    return NextResponse.json({
      notifications: docs.map(mapNotification),
      unreadCount
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 400 });
  }
}

function mapNotification(doc: DbNotification): Notification {
  return {
    id: doc._id,
    userId: doc.userId,
    type: doc.type,
    title: doc.title,
    message: doc.message,
    actionUrl: doc.actionUrl,
    readAt: doc.readAt,
    createdAt: doc.createdAt
  };
}
