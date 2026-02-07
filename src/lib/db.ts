import type { Collection, Db } from 'mongodb';
import clientPromise from './mongodb';

const DEFAULT_DB = 'nappymine';

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  const dbName = process.env.MONGODB_DB || DEFAULT_DB;
  return client.db(dbName);
}

export async function getCollection<T>(name: string): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(name);
}
