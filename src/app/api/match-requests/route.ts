import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { createId } from '@/lib/ids';
import { calculateCompatibility } from '@/lib/matching';
import { MATCH_REQUEST_EXPIRATION_MS, MATCH_SCORE_THRESHOLD, MATCH_LIMIT_PRICE_XAF, resolveMatchLimit } from '@/lib/match-utils';
import { isProfileComplete } from '@/lib/profile-utils';
import { createNotification } from '@/lib/notifications';
import { sendNotificationEmail } from '@/lib/email';
import { logAudit } from '@/lib/audit';
import type { Match, MatchRequest, Profile, PublicProfile, User } from '@/types';

const CreateRequestSchema = z.object({
  profileId: z.string().min(1)
});

interface DbMatchRequest extends Omit<MatchRequest, 'id'> {
  _id: string;
}

interface DbProfile extends Omit<Profile, 'id'> {
  _id: string;
}

interface DbMatch extends Omit<Match, 'id'> {
  _id: string;
}

interface DbUser extends Omit<User, 'id'> {
  _id: string;
}

export async function GET() {
  try {
    const user = await requireSessionUser();
    const requests = await getCollection<DbMatchRequest>('matchRequests');
    const profiles = await getCollection<DbProfile>('profiles');

    const docs = await requests
      .find({ $or: [{ requesterId: user.id }, { recipientId: user.id }] })
      .sort({ createdAt: -1 })
      .toArray();

    const now = Date.now();
    const otherIds = Array.from(
      new Set(
        docs.map(doc => (doc.requesterId === user.id ? doc.recipientId : doc.requesterId))
      )
    );

    const otherProfiles = await profiles.find({ userId: { $in: otherIds } }).toArray();
    const profileMap = new Map(otherProfiles.map(profile => [profile.userId, profile]));

    const incoming = [] as Array<{
      id: string;
      status: MatchRequest['status'];
      score: number;
      createdAt: Date;
      expiresAt: Date;
      profile: PublicProfile;
      currentUserPaid: boolean;
      otherUserPaid: boolean;
    }>;
    const outgoing = [] as Array<{
      id: string;
      status: MatchRequest['status'];
      score: number;
      createdAt: Date;
      expiresAt: Date;
      profile: PublicProfile;
      currentUserPaid: boolean;
      otherUserPaid: boolean;
    }>;

    for (const doc of docs) {
      const expiresAt = doc.expiresAt || new Date(doc.createdAt.getTime() + MATCH_REQUEST_EXPIRATION_MS);
      let status = doc.status;

      if (status === 'pending' && expiresAt.getTime() < now) {
        status = 'expired';
        await requests.updateOne({ _id: doc._id }, { $set: { status: 'expired', updatedAt: new Date() } });
      }

      const otherId = doc.requesterId === user.id ? doc.recipientId : doc.requesterId;
      const otherProfile = profileMap.get(otherId);
      if (!otherProfile) continue;

      if (status === 'declined') {
        continue;
      }

      const view = {
        id: doc._id,
        status,
        score: doc.score,
        createdAt: doc.createdAt,
        expiresAt,
        profile: mapPublicProfile(otherProfile),
        currentUserPaid: doc.requesterId === user.id ? doc.requesterPaid : doc.recipientPaid,
        otherUserPaid: doc.requesterId === user.id ? doc.recipientPaid : doc.requesterPaid
      };

      if (doc.requesterId === user.id) {
        outgoing.push(view);
      } else {
        incoming.push(view);
      }
    }

    return NextResponse.json({ incoming, outgoing });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load match requests' }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = await request.json();
    const { profileId } = CreateRequestSchema.parse(body);

    const profiles = await getCollection<DbProfile>('profiles');
    const requests = await getCollection<DbMatchRequest>('matchRequests');
    const matches = await getCollection<DbMatch>('matches');

    const requesterProfile = await profiles.findOne({ userId: user.id });
    if (!requesterProfile || !isProfileComplete(requesterProfile)) {
      return NextResponse.json({ error: 'Profile required' }, { status: 400 });
    }

    const candidateProfile = await profiles.findOne({ _id: profileId });
    if (!candidateProfile || candidateProfile.userId === user.id || !isProfileComplete(candidateProfile)) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const existing = await requests.findOne({
      $or: [
        { requesterId: user.id, recipientId: candidateProfile.userId },
        { requesterId: candidateProfile.userId, recipientId: user.id }
      ],
      status: { $in: ['pending', 'accepted', 'matched'] }
    });

    if (existing) {
      return NextResponse.json({ error: 'Request already exists', code: 'REQUEST_EXISTS' }, { status: 409 });
    }

    const dayAgo = new Date(Date.now() - 1000 * 60 * 60 * 24);
    const dailyCount = await requests.countDocuments({
      requesterId: user.id,
      createdAt: { $gte: dayAgo }
    });
    if (dailyCount >= 2) {
      return NextResponse.json(
        { error: 'Daily request limit reached', code: 'DAILY_LIMIT', limit: 2 },
        { status: 429 }
      );
    }

    const matchCount = await matches.countDocuments({
      userId: user.id,
      state: { $in: ['UNLOCKED', 'LOCKED', 'VERIFIED'] }
    });
    const matchLimit = resolveMatchLimit(user.matchLimit);
    if (matchCount >= matchLimit) {
      return NextResponse.json(
        { error: 'Match limit reached', code: 'MATCH_LIMIT', upgradePrice: MATCH_LIMIT_PRICE_XAF },
        { status: 403 }
      );
    }

    const score = calculateCompatibility(mapProfile(requesterProfile), mapProfile(candidateProfile)).total;
    if (score < MATCH_SCORE_THRESHOLD) {
      return NextResponse.json(
        { error: 'Score below threshold', code: 'LOW_SCORE', threshold: MATCH_SCORE_THRESHOLD },
        { status: 403 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + MATCH_REQUEST_EXPIRATION_MS);

    const doc: DbMatchRequest = {
      _id: createId(),
      requesterId: user.id,
      recipientId: candidateProfile.userId,
      status: 'pending',
      score,
      requesterPaid: false,
      recipientPaid: false,
      source: 'user',
      createdAt: now,
      updatedAt: now,
      expiresAt
    };

    await requests.insertOne(doc);

    await logAudit({
      actorId: user.id,
      action: 'match_request',
      metadata: { requestId: doc._id, recipientId: candidateProfile.userId, score }
    });

    try {
      const users = await getCollection<DbUser>('users');
      const recipientUser = await users.findOne({ _id: candidateProfile.userId });
      const requesterDisplay = requesterProfile.alias?.trim() || 'Anonymous founder';

      await createNotification({
        userId: candidateProfile.userId,
        type: 'match_request',
        title: 'New match request',
        message: `You received a match request from ${requesterDisplay}.`,
        actionUrl: '/requests'
      });

      if (recipientUser?.email) {
        await sendNotificationEmail({
          toEmail: recipientUser.email,
          name: recipientUser.name || 'Founder',
          subject: 'New match request',
          message: `You received a match request from ${requesterDisplay}.`,
          actionUrl: `${process.env.EMAILJS_ORIGIN || 'http://localhost:3000'}/requests`
        });
      }
    } catch (notifyError) {
      console.error('Failed to send match request notification', notifyError);
    }

    return NextResponse.json({ requestId: doc._id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create match request' }, { status: 400 });
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
