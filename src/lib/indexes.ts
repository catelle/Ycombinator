import type { Collection } from 'mongodb';
import { getCollection } from './db';
import type { User } from '@/types';

interface DbUser extends Omit<User, 'id'> {
  _id: string;
  phone?: string;
}

let usersIndexesEnsured = false;

async function safeCreateIndex(collection: Collection, keys: Record<string, 1>, options: Record<string, unknown>) {
  try {
    await collection.createIndex(keys, options);
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code === 11000) {
      console.warn('Duplicate key prevented index creation', error);
      return;
    }
    if (code !== 85) {
      console.warn('Failed to create index', error);
    }
  }
}

export async function ensureUserIndexes() {
  if (usersIndexesEnsured) return;
  const users = await getCollection<DbUser>('users');
  await safeCreateIndex(users, { email: 1 }, { unique: true, name: 'uniq_users_email' });
  await safeCreateIndex(users, { phone: 1 }, {
    unique: true,
    name: 'uniq_users_phone',
    partialFilterExpression: { phone: { $type: 'string' } }
  });
  usersIndexesEnsured = true;
}
