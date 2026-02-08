import { NextResponse } from 'next/server';
import type { Profile, MatchState, Match, Subscription } from '@/types';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { createId } from '@/lib/ids';
import { calculateCompatibility, getPublicProfile } from '@/lib/matching';
import { isProfileComplete } from '@/lib/profile-utils';

interface DbProfile extends Omit<Profile, 'id'> {
  _id: string;
}

interface DbMatch extends Omit<Match, 'id'> {
  _id: string;
}

interface DbSubscription extends Omit<Subscription, 'id'> {
  _id: string;
}

interface DbBlock {
  _id: string;
  blockerId: string;
  blockedUserId: string;
}

interface DbUser {
  _id: string;
  suspended?: boolean;
  emailVerified?: boolean;
}

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const url = new URL(request.url);
    const matchType = (url.searchParams.get('type') as Match['matchType']) || 'cofounder';
    const profiles = await getCollection<DbProfile>('profiles');
    const matchesCollection = await getCollection<DbMatch>('matches');
    const subscriptions = await getCollection<DbSubscription>('subscriptions');
    const blocks = await getCollection<DbBlock>('blocks');
    const users = await getCollection<DbUser>('users');
    const teams = await getCollection<{ _id: string; memberIds: string[]; status: 'forming' | 'locked' }>('teams');

    const lockedTeam = await teams.findOne({ memberIds: user.id, status: 'locked' });
    if (lockedTeam) {
      return NextResponse.json({ suggestions: [], premiumOnly: false, locked: true });
    }

    const lockedTeams = await teams.find({ status: 'locked' }).toArray();
    const lockedMembers = new Set(lockedTeams.flatMap(team => team.memberIds));

    const currentProfile = await profiles.findOne({ userId: user.id });
    if (!currentProfile || !isProfileComplete(currentProfile)) {
      return NextResponse.json({ error: 'Profile required' }, { status: 400 });
    }

    const subscription = await subscriptions.findOne({ userId: user.id, status: 'active', type: 'premium' });
    const isPremium = Boolean(subscription);

    const blockedRelations = await blocks
      .find({ $or: [{ blockerId: user.id }, { blockedUserId: user.id }] })
      .toArray();
    const blockedIds = new Set(
      blockedRelations.map(block => (block.blockerId === user.id ? block.blockedUserId : block.blockerId))
    );

    const existingMatches = await matchesCollection.find({ userId: user.id }).toArray();
    const matchMap = new Map(existingMatches.map(match => [match.matchedUserId, match]));

    const candidates = await profiles.find({ userId: { $ne: user.id } }).toArray();

    const suggestions = [] as Array<{
      matchId: string;
      score: number;
      state: MatchState;
      profile: Profile;
      reasons: string[];
      decision?: Match['decision'];
    }>;

    for (const candidate of candidates) {
      if (!isProfileComplete(candidate)) continue;
      if (blockedIds.has(candidate.userId)) continue;
      if (lockedMembers.has(candidate.userId)) continue;

      const candidateUser = await users.findOne({ _id: candidate.userId });
      if (candidateUser?.suspended) continue;
      if (candidateUser && candidateUser.emailVerified === false) continue;

      const matchScore = calculateCompatibility(mapProfile(currentProfile), mapProfile(candidate));
      if (isPremium && matchScore.total < 80) continue;

      const existingMatch = matchMap.get(candidate.userId);
      if (existingMatch?.state === 'CANCELLED') continue;
      if (existingMatch?.decision === 'rejected') continue;
      if (existingMatch?.state === 'LOCKED') continue;

      const matchId = existingMatch?._id || createId();
      const matchState = (existingMatch?.state || 'OPEN') as MatchState;

      if (!existingMatch) {
        await matchesCollection.insertOne({
          _id: matchId,
          userId: user.id,
          matchedUserId: candidate.userId,
          score: matchScore.total,
          state: matchState,
          matchType,
          decision: existingMatch?.decision,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else if (existingMatch.score !== matchScore.total) {
        await matchesCollection.updateOne(
          { _id: existingMatch._id },
          { $set: { score: matchScore.total, updatedAt: new Date() } }
        );
      }

      const profileForView = matchState === 'UNLOCKED' || matchState === 'VERIFIED'
        ? mapProfile(candidate)
        : getPublicProfile(mapProfile(candidate));

      suggestions.push({
        matchId,
        score: matchScore.total,
        state: matchState,
        profile: profileForView,
        reasons: matchScore.reasons,
        decision: existingMatch?.decision
      });
    }

    suggestions.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      suggestions,
      premiumOnly: isPremium
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load suggestions' }, { status: 400 });
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
