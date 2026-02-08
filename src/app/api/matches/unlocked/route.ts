import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import type { Match, Profile } from '@/types';

interface DbMatch extends Omit<Match, 'id'> {
  _id: string;
}

interface DbProfile extends Omit<Profile, 'id'> {
  _id: string;
}

export async function GET() {
  try {
    const user = await requireSessionUser();
    const matches = await getCollection<DbMatch>('matches');
    const profiles = await getCollection<DbProfile>('profiles');

    const unlocked = await matches.find({ userId: user.id, state: { $in: ['UNLOCKED', 'VERIFIED'] } }).toArray();
    const profileMap = new Map<string, Profile>();

    const results = [] as Array<{ matchId: string; state: Match['state']; profile: Profile | null }>;

    for (const match of unlocked) {
      let profile = profileMap.get(match.matchedUserId);
      if (!profile) {
        const doc = await profiles.findOne({ userId: match.matchedUserId });
        profile = doc ? mapProfile(doc) : null;
        if (profile) profileMap.set(match.matchedUserId, profile);
      }
      results.push({ matchId: match._id, state: match.state, profile: profile || null });
    }

    return NextResponse.json({ matches: results });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load unlocked matches' }, { status: 400 });
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
    verificationDocs: profile.verificationDocs || [],
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
