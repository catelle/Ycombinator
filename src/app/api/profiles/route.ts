import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { isProfileComplete } from '@/lib/profile-utils';
import type { Profile, PublicProfile } from '@/types';

interface DbProfile extends Omit<Profile, 'id'> {
  _id: string;
}

export async function GET() {
  try {
    const user = await getSessionUser();
    const profiles = await getCollection<DbProfile>('profiles');
    const filter = user ? { userId: { $ne: user.id } } : {};
    const docs = await profiles.find(filter).toArray();
    const publicProfiles = docs.filter(isProfileComplete).map(mapPublicProfile);
    return NextResponse.json({ profiles: publicProfiles });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load profiles' }, { status: 400 });
  }
}

function mapPublicProfile(profile: DbProfile): PublicProfile {
  return {
    id: profile._id,
    alias: profile.alias,
    role: profile.role,
    skills: profile.skills || [],
    languages: profile.languages || [],
    achievements: profile.achievements || [],
    interests: profile.interests,
    commitment: profile.commitment,
    location: 'Location hidden'
  };
}
