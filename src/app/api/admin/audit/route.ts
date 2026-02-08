import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import type { AuditLog, User } from '@/types';

interface DbAuditLog extends Omit<AuditLog, 'id'> {
  _id: string;
}

interface DbUser extends Omit<User, 'id'> {
  _id: string;
}

export async function GET(request: Request) {
  try {
    const admin = await requireSessionUser();
    if (admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get('limit') || '50'), 200);

    const logs = await getCollection<DbAuditLog>('auditLogs');
    const users = await getCollection<DbUser>('users');

    const entries = await logs.find({}).sort({ createdAt: -1 }).limit(limit).toArray();
    const actorIds = Array.from(new Set(entries.map(entry => entry.actorId)));
    const actors = await users.find({ _id: { $in: actorIds } }).toArray();
    const actorMap = new Map(actors.map(actor => [actor._id, actor]));

    const payload = entries.map(entry => {
      const actor = actorMap.get(entry.actorId);
      return {
        id: entry._id,
        actorId: entry.actorId,
        actorName: actor?.name || 'Unknown',
        actorEmail: actor?.email,
        action: entry.action,
        metadata: entry.metadata,
        createdAt: entry.createdAt
      };
    });

    return NextResponse.json({ logs: payload });
  } catch (error: any) {
    console.error('Admin audit error:', error);
    if (error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to load audit logs' }, { status: 500 });
  }
}
