import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUser, clearUserSessions } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import type { User } from '@/types';

const DeleteSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().min(2).optional()
});

interface DbUser extends Omit<User, 'id'> {
  _id: string;
  suspended?: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}

export async function POST(request: Request) {
  try {
    const admin = await requireSessionUser();
    if (admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, reason } = DeleteSchema.parse(body);

    const users = await getCollection<DbUser>('users');
    await users.updateOne(
      { _id: userId },
      {
        $set: {
          deletedAt: new Date(),
          deletedBy: admin.id,
          suspended: true,
          role: 'suspended',
          updatedAt: new Date()
        }
      }
    );

    await clearUserSessions(userId);

    await createNotification({
      userId,
      type: 'system',
      title: 'Account removed',
      message: reason ? `Your account was removed. Reason: ${reason}` : 'Your account was removed by an administrator.',
      actionUrl: '/auth'
    });

    await logAudit({
      actorId: admin.id,
      action: 'user_soft_delete',
      metadata: { userId, reason: reason || 'not_provided' }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 400 });
  }
}
