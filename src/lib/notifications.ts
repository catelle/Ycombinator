import { getCollection } from './db';
import { createId } from './ids';
import type { Notification } from '@/types';

interface DbNotification extends Omit<Notification, 'id'> {
  _id: string;
}

export async function createNotification(payload: Omit<Notification, 'id' | 'createdAt'>) {
  const notifications = await getCollection<DbNotification>('notifications');
  await notifications.insertOne({
    _id: createId(),
    ...payload,
    createdAt: new Date()
  });
}
