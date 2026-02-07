import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { calculateCompatibility } from '@/lib/matching';
import { MATCH_SCORE_THRESHOLD } from '@/lib/match-utils';
import { isProfileComplete } from '@/lib/profile-utils';
import type { Profile } from '@/types';

const TestSchema = z.object({
  profileId: z.string().min(1)
});

interface DbProfile extends Omit<Profile, 'id'> {
  _id: string;
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = await request.json();
    const { profileId } = TestSchema.parse(body);

    const profiles = await getCollection<DbProfile>('profiles');
    const requesterProfile = await profiles.findOne({ userId: user.id });
    const candidateProfile = await profiles.findOne({ _id: profileId });

    if (!requesterProfile || !isProfileComplete(requesterProfile)) {
      return NextResponse.json({ error: 'Profile incomplete', code: 'PROFILE_INCOMPLETE' }, { status: 400 });
    }

    if (!candidateProfile || !isProfileComplete(candidateProfile)) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const result = calculateCompatibility(mapProfile(requesterProfile), mapProfile(candidateProfile));

    return NextResponse.json({
      score: result.total,
      reasons: result.reasons,
      meetsThreshold: result.total >= MATCH_SCORE_THRESHOLD
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to test match' }, { status: 400 });
  }
}

function mapProfile(profile: DbProfile): Profile {
  return {
    id: profile._id,
    userId: profile.userId,
    name: profile.name,
    alias: profile.alias,
    role: profile.role,
    skills: profile.skills || [],
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
