import { cookies } from 'next/headers';
import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import type { User } from '@/types';
import { getCollection } from './db';
import { createId } from './ids';

const SESSION_COOKIE_NAME = 'nm_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 14; // 14 days
const VERIFICATION_EXPIRATION_MS = 1000 * 60 * 10; // 10 minutes
const DEFAULT_MATCH_LIMIT = Number(process.env.MATCH_BASE_LIMIT || '5');

interface DbUser {
  _id: string;
  email: string;
  name: string;
  phone: string;
  passwordHash: string;
  emailVerified: boolean;
  role: User['role'];
  createdAt: Date;
  updatedAt: Date;
  verified?: boolean;
  suspended?: boolean;
  matchLimit?: number;
}

interface DbSession {
  _id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

interface DbEmailVerification {
  _id: string;
  userId: string;
  email: string;
  codeHash: string;
  expiresAt: Date;
  createdAt: Date;
  attempts: number;
  usedAt?: Date;
}

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

export function createVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createUser(payload: { name: string; email: string; phone: string; password: string }): Promise<User> {
  const users = await getCollection<DbUser>('users');
  const passwordHash = await bcrypt.hash(payload.password, 10);
  const user: DbUser = {
    _id: createId(),
    email: payload.email.toLowerCase(),
    name: payload.name,
    phone: payload.phone,
    passwordHash,
    emailVerified: false,
    role: 'member',
    matchLimit: DEFAULT_MATCH_LIMIT,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await users.insertOne(user);
  return mapUser(user);
}

export async function updateUserVerification(email: string): Promise<void> {
  const users = await getCollection<DbUser>('users');
  await users.updateOne(
    { email: email.toLowerCase() },
    { $set: { emailVerified: true, updatedAt: new Date() } }
  );
}

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const users = await getCollection<DbUser>('users');
  return users.findOne({ email: email.toLowerCase() });
}

export async function updateUserPassword(email: string, password: string): Promise<void> {
  const users = await getCollection<DbUser>('users');
  const passwordHash = await bcrypt.hash(password, 10);
  await users.updateOne(
    { email: email.toLowerCase() },
    { $set: { passwordHash, updatedAt: new Date() } }
  );
}

export async function updateUserBasics(email: string, payload: { name: string; phone: string }): Promise<void> {
  const users = await getCollection<DbUser>('users');
  await users.updateOne(
    { email: email.toLowerCase() },
    { $set: { name: payload.name, phone: payload.phone, updatedAt: new Date() } }
  );
}

export async function authenticateUser(email: string, password: string): Promise<User> {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }
  if (user.suspended || user.role === 'suspended') {
    throw new Error('Account suspended');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  if (!user.emailVerified) {
    const error = new Error('Email not verified') as Error & { requiresVerification?: boolean };
    error.requiresVerification = true;
    throw error;
  }

  return mapUser(user);
}

export async function storeEmailVerification(userId: string, email: string, code: string): Promise<void> {
  const verifications = await getCollection<DbEmailVerification>('emailVerifications');
  await verifications.updateMany(
    { email: email.toLowerCase(), usedAt: { $exists: false } },
    { $set: { usedAt: new Date() } }
  );

  const token: DbEmailVerification = {
    _id: createId(),
    userId,
    email: email.toLowerCase(),
    codeHash: hashCode(code),
    expiresAt: new Date(Date.now() + VERIFICATION_EXPIRATION_MS),
    createdAt: new Date(),
    attempts: 0
  };

  await verifications.insertOne(token);
}

export async function verifyEmailCode(email: string, code: string): Promise<boolean> {
  const verifications = await getCollection<DbEmailVerification>('emailVerifications');
  const token = await verifications.findOne(
    { email: email.toLowerCase(), usedAt: { $exists: false } },
    { sort: { createdAt: -1 } }
  );

  if (!token) return false;
  if (token.expiresAt.getTime() < Date.now()) return false;

  const isMatch = token.codeHash === hashCode(code);
  const update: Partial<DbEmailVerification> = { attempts: token.attempts + 1 };
  if (isMatch) {
    update.usedAt = new Date();
  }
  await verifications.updateOne({ _id: token._id }, { $set: update });

  if (isMatch) {
    await updateUserVerification(email);
  }

  return isMatch;
}

export async function createSession(userId: string): Promise<string> {
  const sessions = await getCollection<DbSession>('sessions');
  const token = createId();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await sessions.insertOne({
    _id: token,
    userId,
    expiresAt,
    createdAt: new Date()
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/'
  });

  return token;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (sessionToken) {
    const sessions = await getCollection<DbSession>('sessions');
    await sessions.deleteOne({ _id: sessionToken });
  }
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
    path: '/'
  });
}

export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionToken) return null;

  const sessions = await getCollection<DbSession>('sessions');
  const session = await sessions.findOne({ _id: sessionToken });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await sessions.deleteOne({ _id: sessionToken });
    return null;
  }

  const users = await getCollection<DbUser>('users');
  const user = await users.findOne({ _id: session.userId });
  if (!user || user.suspended || user.role === 'suspended') return null;
  return mapUser(user);
}

export async function requireSessionUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export function mapUser(user: DbUser): User {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
    verified: user.verified,
    suspended: user.suspended,
    emailVerified: user.emailVerified,
    matchLimit: user.matchLimit ?? DEFAULT_MATCH_LIMIT
  };
}
