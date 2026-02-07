import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateUser, createSession, createVerificationCode, findUserByEmail, storeEmailVerification } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';
import { getCollection } from '@/lib/db';
import { createId } from '@/lib/ids';
import type { Profile, User } from '@/types';

interface DbProfile extends Omit<Profile, 'id'> {
  _id: string;
}

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  let email = '';
  try {
    const body = await request.json();
    const parsed = LoginSchema.parse(body);
    email = parsed.email;

    const user = await authenticateUser(parsed.email, parsed.password);
    await createSession(user.id);
    await ensureBaseProfile(user);

    return NextResponse.json({ user });
  } catch (error: any) {
    if (error?.requiresVerification) {
      const user = email ? await findUserByEmail(email) : null;
      if (user && !user.emailVerified) {
        try {
          const code = createVerificationCode();
          await storeEmailVerification(user._id, user.email, code);
          await sendVerificationEmail({ toEmail: user.email, name: user.name, code });
        } catch (sendError) {
          console.error('Failed to send verification email', sendError);
        }
      }
      return NextResponse.json({ error: 'Email not verified', requiresVerification: true }, { status: 403 });
    }
    if (error instanceof Error && error.message === 'Account suspended') {
      return NextResponse.json({ error: 'Account suspended' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }
}

async function ensureBaseProfile(user: User) {
  const profiles = await getCollection<DbProfile>('profiles');
  const existing = await profiles.findOne({ userId: user.id });
  if (existing) return;

  const profile: DbProfile = {
    _id: createId(),
    userId: user.id,
    name: user.name,
    alias: undefined,
    role: 'other',
    skills: [],
    languages: [],
    achievements: [],
    interests: 'Exploring new ideas',
    commitment: 'exploring',
    location: 'Remote',
    contactEmail: user.email,
    contactPhone: user.phone,
    photoUrl: undefined,
    verified: false,
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await profiles.insertOne(profile);
}
