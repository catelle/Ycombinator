import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { createId } from '@/lib/ids';
import { createNotification } from '@/lib/notifications';
import { sendNotificationEmail } from '@/lib/email';
import { logAudit } from '@/lib/audit';
import type { Match, MatchCancellationRequest, Profile, PublicProfile, User } from '@/types';

const CreateSchema = z.object({
  matchId: z.string().min(1),
  reason: z.string().min(6)
});

interface DbMatchCancellation extends Omit<MatchCancellationRequest, 'id'> {
  _id: string;
}

interface DbMatch extends Omit<Match, 'id'> {
  _id: string;
}

interface DbProfile extends Omit<Profile, 'id'> {
  _id: string;
}

interface DbUser extends Omit<User, 'id'> {
  _id: string;
}

export async function GET() {
  try {
    const user = await requireSessionUser();
    const requests = await getCollection<DbMatchCancellation>('matchCancellationRequests');
    const profiles = await getCollection<DbProfile>('profiles');

    const docs = await requests
      .find({ $or: [{ requesterId: user.id }, { recipientId: user.id }] })
      .sort({ createdAt: -1 })
      .toArray();

    const otherIds = Array.from(
      new Set(
        docs.map(doc => (doc.requesterId === user.id ? doc.recipientId : doc.requesterId))
      )
    );

    const otherProfiles = await profiles.find({ userId: { $in: otherIds } }).toArray();
    const profileMap = new Map(otherProfiles.map(profile => [profile.userId, profile]));

    const incoming = [] as Array<{
      id: string;
      status: MatchCancellationRequest['status'];
      createdAt: Date;
      matchId: string;
      reason: string;
      response?: string;
      profile: PublicProfile;
    }>;
    const outgoing = [] as Array<{
      id: string;
      status: MatchCancellationRequest['status'];
      createdAt: Date;
      matchId: string;
      reason: string;
      response?: string;
      profile: PublicProfile;
    }>;

    for (const doc of docs) {
      const otherId = doc.requesterId === user.id ? doc.recipientId : doc.requesterId;
      const otherProfile = profileMap.get(otherId);
      if (!otherProfile) continue;

      const view = {
        id: doc._id,
        status: doc.status,
        createdAt: doc.createdAt,
        matchId: doc.matchId,
        reason: doc.requesterReason,
        response: doc.recipientResponse,
        profile: mapPublicProfile(otherProfile)
      };

      if (doc.requesterId === user.id) {
        outgoing.push(view);
      } else {
        incoming.push(view);
      }
    }

    return NextResponse.json({ incoming, outgoing });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load cancellation requests' }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = await request.json();
    const { matchId, reason } = CreateSchema.parse(body);

    const matches = await getCollection<DbMatch>('matches');
    const requests = await getCollection<DbMatchCancellation>('matchCancellationRequests');
    const profiles = await getCollection<DbProfile>('profiles');
    const users = await getCollection<DbUser>('users');

    const match = await matches.findOne({ _id: matchId, userId: user.id });
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.state !== 'LOCKED' && match.state !== 'VERIFIED') {
      return NextResponse.json({ error: 'Match must be locked before requesting cancellation' }, { status: 400 });
    }

    const existing = await requests.findOne({
      matchId,
      status: { $in: ['pending', 'accepted'] }
    });
    if (existing) {
      return NextResponse.json({ error: 'Cancellation already requested' }, { status: 409 });
    }

    const recipientId = match.matchedUserId;
    const now = new Date();
    const doc: DbMatchCancellation = {
      _id: createId(),
      matchId,
      requesterId: user.id,
      recipientId,
      status: 'pending',
      requesterReason: reason,
      createdAt: now,
      updatedAt: now
    };

    await requests.insertOne(doc);

    try {
      const requesterProfile = await profiles.findOne({ userId: user.id });
      const requesterDisplay = requesterProfile?.alias?.trim() || requesterProfile?.name || 'Founder';

      await createNotification({
        userId: recipientId,
        type: 'match_cancellation',
        title: 'Cancellation requested',
        message: `${requesterDisplay} requested to cancel a locked match.`,
        actionUrl: '/requests'
      });

      const recipientUser = await users.findOne({ _id: recipientId });
      if (recipientUser?.email) {
        await sendNotificationEmail({
          toEmail: recipientUser.email,
          name: recipientUser.name || 'Founder',
          subject: 'Match cancellation requested',
          message: `${requesterDisplay} requested to cancel a locked match.`,
          actionUrl: `${process.env.EMAILJS_ORIGIN || 'http://localhost:3000'}/requests`
        });
      }
    } catch (notifyError) {
      console.error('Failed to send cancellation notification', notifyError);
    }

    await logAudit({
      actorId: user.id,
      action: 'match_cancel_request',
      metadata: { matchId, requestId: doc._id }
    });

    return NextResponse.json({ requestId: doc._id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create cancellation request' }, { status: 400 });
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
