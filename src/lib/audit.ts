import { createId } from './ids';
import { getCollection } from './db';
import type { AuditLog } from '@/types';

interface DbAuditLog extends Omit<AuditLog, 'id'> {
  _id: string;
}

export async function logAudit(entry: Omit<AuditLog, 'id' | 'createdAt'> & { createdAt?: Date }) {
  const logs = await getCollection<DbAuditLog>('auditLogs');
  await logs.insertOne({
    _id: createId(),
    actorId: entry.actorId,
    action: entry.action,
    metadata: entry.metadata,
    createdAt: entry.createdAt ?? new Date()
  });
}
