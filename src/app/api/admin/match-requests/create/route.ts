import { NextResponse } from 'next/server';
import type { Collection } from 'mongodb';
import { z } from 'zod';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { createId } from '@/lib/ids';
import { calculateCompatibility } from '@/lib/matching';
import { MATCH_REQUEST_EXPIRATION_MS } from '@/lib/match-utils';
import { isProfileComplete } from '@/lib/profile-utils';
import { createNotification } from '@/lib/notifications';
import { sendNotificationEmail } from '@/lib/email';
import { logAudit } from '@/lib/audit';
import type { MatchRequest, Profile, User } from '@/types';

const CreateSchema = z.object({
  requester: z.string().min(2),
  recipient: z.string().min(2)
});

interface DbMatchRequest extends Omit<MatchRequest, 'id'> {
  _id: string;
}

interface DbProfile extends Omit<Profile, 'id'> {
  _id: string;
}

interface DbUser extends Omit<User, 'id'> {
  _id: string;
}

export async function POST(request: Request) {
  try {
    const admin = await requireSessionUser();
    if (admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { requester, recipient } = CreateSchema.parse(body);

    const users = await getCollection<DbUser>('users');
    const profiles = await getCollection<DbProfile>('profiles');
    const requests = await getCollection<DbMatchRequest>('matchRequests');

    const requesterId = await resolveUserId(requester, users, profiles);
    const recipientId = await resolveUserId(recipient, users, profiles);

    if (!requesterId || !recipientId) {
      return NextResponse.json({ error: 'Unable to resolve users' }, { status: 404 });
    }
    if (requesterId === recipientId) {
      return NextResponse.json({ error: 'Users must be different' }, { status: 400 });
    }

    const existing = await requests.findOne({
      $or: [
        { requesterId, recipientId },
        { requesterId: recipientId, recipientId: requesterId }
      ],
      status: { $in: ['pending', 'accepted', 'matched'] }
    });
    if (existing) {
      return NextResponse.json({ error: 'Request already exists' }, { status: 409 });
    }

    const requesterProfile = await profiles.findOne({ userId: requesterId });
    const recipientProfile = await profiles.findOne({ userId: recipientId });
    if (!requesterProfile || !recipientProfile || !isProfileComplete(requesterProfile) || !isProfileComplete(recipientProfile)) {
      return NextResponse.json({ error: 'Both profiles must be completed' }, { status: 400 });
    }

    const score = calculateCompatibility(mapProfile(requesterProfile), mapProfile(recipientProfile)).total;
    const now = new Date();
    const doc: DbMatchRequest = {
      _id: createId(),
      requesterId,
      recipientId,
      status: 'pending',
      score,
      requesterPaid: false,
      recipientPaid: false,
      source: 'admin',
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + MATCH_REQUEST_EXPIRATION_MS)
    };

    await requests.insertOne(doc);

    const requesterDisplay = requesterProfile.alias?.trim() || requesterProfile.name || 'Founder';
    const recipientDisplay = recipientProfile.alias?.trim() || recipientProfile.name || 'Founder';

    await Promise.all([
      createNotification({
        userId: recipientId,
        type: 'match_request',
        title: 'Admin suggested a match',
        message: `Admin suggested a match with ${requesterDisplay}.`,
        actionUrl: '/requests'
      }),
      createNotification({
        userId: requesterId,
        type: 'match_request',
        title: 'Admin suggested a match',
        message: `Admin suggested a match with ${recipientDisplay}.`,
        actionUrl: '/requests'
      })
    ]);

    const requesterUser = await users.findOne({ _id: requesterId });
    const recipientUser = await users.findOne({ _id: recipientId });
    if (requesterUser?.email) {
      await sendNotificationEmail({
        toEmail: requesterUser.email,
        name: requesterUser.name || 'Founder',
        subject: 'Admin suggested a match',
        message: `Admin suggested a match with ${recipientDisplay}.`,
        actionUrl: `${process.env.EMAILJS_ORIGIN || 'http://localhost:3000'}/requests`
      });
    }
    if (recipientUser?.email) {
      await sendNotificationEmail({
        toEmail: recipientUser.email,
        name: recipientUser.name || 'Founder',
        subject: 'Admin suggested a match',
        message: `Admin suggested a match with ${requesterDisplay}.`,
        actionUrl: `${process.env.EMAILJS_ORIGIN || 'http://localhost:3000'}/requests`
      });
    }

    await logAudit({
      actorId: admin.id,
      action: 'admin_action',
      metadata: { requestId: doc._id, requesterId, recipientId, score }
    });

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

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function resolveUserId(
  query: string,
  users: Collection<DbUser>,
  profiles: Collection<DbProfile>
) {
  const normalized = query.trim();
  if (!normalized) return null;

  const direct = await users.findOne({ _id: normalized });
  if (direct) return direct._id;

  const byEmail = await users.findOne({ email: normalized.toLowerCase() });
  if (byEmail) return byEmail._id;

  const byPhone = await users.findOne({ phone: normalized });
  if (byPhone) return byPhone._id;

  const nameMatch = await users.findOne({ name: new RegExp(escapeRegex(normalized), 'i') });
  if (nameMatch) return nameMatch._id;

  const aliasMatch = await profiles.findOne({ alias: new RegExp(escapeRegex(normalized), 'i') });
  if (aliasMatch) return aliasMatch.userId;

  return null;
}
