import { NextResponse } from 'next/server';
import type { Payment, VerificationRequest, Team } from '@/types';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { createId } from '@/lib/ids';
import { initPayunitPayment } from '@/lib/payunit';

interface DbPayment extends Omit<Payment, 'id'> {
  _id: string;
}

interface DbVerificationRequest extends Omit<VerificationRequest, 'id'> {
  _id: string;
}

interface DbTeam extends Omit<Team, 'id'> {
  _id: string;
}

export async function POST() {
  try {
    const user = await requireSessionUser();
    const teams = await getCollection<DbTeam>('teams');
    const users = await getCollection<{ _id: string; verified?: boolean }>('users');
    const account = await users.findOne({ _id: user.id });
    if (account?.verified) {
      return NextResponse.json({ error: 'Already verified' }, { status: 400 });
    }
    const team = await teams.findOne({ memberIds: user.id, status: 'locked' });

    if (!team) {
      return NextResponse.json({ error: 'Team must be locked before verification' }, { status: 400 });
    }

    const requests = await getCollection<DbVerificationRequest>('verificationRequests');
    const existingRequest = await requests.findOne({ userId: user.id, status: 'pending' });
    if (existingRequest) {
      return NextResponse.json({ error: 'Verification already requested' }, { status: 400 });
    }

    const transactionId = `verify${createId().replace(/-/g, '')}`;
    const charge = await initPayunitPayment({
      transactionId,
      amount: 2000
    });

    if (!charge.success || !charge.paymentUrl) {
      return NextResponse.json({ error: charge.error || 'Payment failed' }, { status: 402 });
    }

    const payments = await getCollection<DbPayment>('payments');
    const paymentId = createId();
    await payments.insertOne({
      _id: paymentId,
      userId: user.id,
      amount: 2000,
      currency: 'XAF',
      type: 'verification',
      status: 'pending',
      provider: 'payunit',
      reference: transactionId,
      createdAt: new Date(),
      metadata: { paymentId }
    });

    return NextResponse.json({ paymentUrl: charge.paymentUrl });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to request verification' }, { status: 400 });
  }
}
