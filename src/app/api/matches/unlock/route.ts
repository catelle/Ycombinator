import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Match, Payment, Profile } from '@/types';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { createId } from '@/lib/ids';
import { initPayunitPayment } from '@/lib/payunit';

const UnlockSchema = z.object({
  matchId: z.string().min(1)
});

interface DbMatch extends Omit<Match, 'id'> {
  _id: string;
}

interface DbProfile extends Omit<Profile, 'id'> {
  _id: string;
}

interface DbPayment extends Omit<Payment, 'id'> {
  _id: string;
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = await request.json();
    const { matchId } = UnlockSchema.parse(body);

    const matches = await getCollection<DbMatch>('matches');
    const profiles = await getCollection<DbProfile>('profiles');
    const payments = await getCollection<DbPayment>('payments');

    const match = await matches.findOne({ _id: matchId, userId: user.id });
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.state === 'LOCKED') {
      return NextResponse.json({ error: 'Match is already locked' }, { status: 400 });
    }
    if (match.state === 'CANCELLED') {
      return NextResponse.json({ error: 'Match has been cancelled' }, { status: 400 });
    }

    if (match.state === 'UNLOCKED' || match.state === 'VERIFIED') {
      const profile = await profiles.findOne({ userId: match.matchedUserId });
      return NextResponse.json({
        matchState: match.state,
        profile: profile ? mapProfile(profile) : null
      });
    }

    const transactionId = `unlock${createId().replace(/-/g, '')}`;
    const charge = await initPayunitPayment({
      transactionId,
      amount: 500
    });

    if (!charge.success || !charge.paymentUrl) {
      return NextResponse.json({ error: charge.error || 'Payment failed' }, { status: 402 });
    }

    const paymentId = createId();
    await payments.insertOne({
      _id: paymentId,
      userId: user.id,
      amount: 500,
      currency: 'XAF',
      type: 'unlock',
      status: 'pending',
      provider: 'payunit',
      reference: transactionId,
      createdAt: new Date(),
      metadata: { matchId }
    });

    return NextResponse.json({ paymentUrl: charge.paymentUrl });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to unlock match' }, { status: 400 });
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
