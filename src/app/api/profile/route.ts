import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCollection } from '@/lib/db';
import { createId } from '@/lib/ids';
import { requireSessionUser } from '@/lib/auth';
import type { CommitmentLevel, Profile, ProfileRole } from '@/types';

const ProfileSchema = z.object({
  name: z.string().min(1),
  alias: z.string().optional(),
  role: z.enum(['technical', 'business', 'product', 'design', 'marketing', 'operations', 'other']),
  skills: z.array(z.string().min(1)),
  languages: z.array(z.string().min(1)).optional(),
  achievements: z.array(z.string().min(1)).optional(),
  interests: z.string().min(1),
  commitment: z.enum(['exploring', 'part-time', 'full-time', 'weekends']),
  location: z.string().min(1),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional().or(z.literal('')),
  photoUrl: z.string().url().optional().or(z.literal(''))
});

interface DbProfile extends Omit<Profile, 'id'> {
  _id: string;
}

export async function GET() {
  try {
    const user = await requireSessionUser();
    const profiles = await getCollection<DbProfile>('profiles');
    const profile = await profiles.findOne({ userId: user.id });
    if (!profile) {
      return NextResponse.json({ profile: null });
    }
    return NextResponse.json({ profile: mapProfile(profile) });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = await request.json();
    const payload = ProfileSchema.parse(body);

    const profiles = await getCollection<DbProfile>('profiles');
    const existing = await profiles.findOne({ userId: user.id });

    const profile: DbProfile = {
      _id: existing?._id || createId(),
      userId: user.id,
      name: payload.name,
      alias: payload.alias || undefined,
      role: payload.role as ProfileRole,
      skills: payload.skills,
      languages: payload.languages || [],
      achievements: payload.achievements || [],
      interests: payload.interests,
      commitment: payload.commitment as CommitmentLevel,
      location: payload.location,
      contactEmail: payload.contactEmail || undefined,
      contactPhone: payload.contactPhone || undefined,
      photoUrl: payload.photoUrl || undefined,
      verified: existing?.verified,
      completed: true,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date()
    };

    await profiles.updateOne(
      { _id: profile._id },
      { $set: profile },
      { upsert: true }
    );

    return NextResponse.json({ profile: mapProfile(profile) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 400 });
  }
}

function mapProfile(profile: DbProfile): Profile {
  return {
    id: profile._id,
    userId: profile.userId,
    name: profile.name,
    alias: profile.alias,
    role: profile.role,
    skills: profile.skills,
    languages: profile.languages || [],
    achievements: profile.achievements || [],
    interests: profile.interests,
    commitment: profile.commitment,
    location: profile.location,
    contactEmail: profile.contactEmail,
    contactPhone: profile.contactPhone,
    photoUrl: profile.photoUrl,
    verified: profile.verified,
    completed: profile.completed,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt
  };
}
