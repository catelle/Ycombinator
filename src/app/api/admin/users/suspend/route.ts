import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import type { User } from '@/types';

const SuspendSchema = z.object({
  userId: z.string().min(1),
  suspended: z.boolean()
});

interface DbUser extends Omit<User, 'id'> {
  _id: string;
  suspended?: boolean;
}

export async function POST(request: Request) {
  try {
    const admin = await requireSessionUser();
    if (admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, suspended } = SuspendSchema.parse(body);

    const users = await getCollection<DbUser>('users');
    await users.updateOne(
      { _id: userId },
      { $set: { suspended } }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 400 });
  }
}
