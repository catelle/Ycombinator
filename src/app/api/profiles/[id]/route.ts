import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { isProfileComplete } from '@/lib/profile-utils';
import type { Profile, PublicProfile } from '@/types';

interface DbProfile extends Omit<Profile, 'id'> {
  _id: string;
}

export async function GET(_request: Request, context: { params: { id: string } }) {
  try {
    const { id } = await context.params;
    const profiles = await getCollection<DbProfile>('profiles');
    const profile = await profiles.findOne({ _id: id });

    if (!profile || !isProfileComplete(profile)) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile: mapPublicProfile(profile) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 400 });
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
