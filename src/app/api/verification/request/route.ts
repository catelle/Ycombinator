import { NextResponse } from 'next/server';
import type { Payment, VerificationRequest, Team } from '@/types';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { createId } from '@/lib/ids';
import { chargeMobileMoney } from '@/lib/payments';
import { logAudit } from '@/lib/audit';

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

    const charge = await chargeMobileMoney({
      userId: user.id,
      amount: 2000,
      currency: 'FCFA',
      type: 'verification'
    });

    if (!charge.success) {
      return NextResponse.json({ error: 'Payment failed' }, { status: 402 });
    }

    const payments = await getCollection<DbPayment>('payments');
    const paymentId = createId();
    await payments.insertOne({
      _id: paymentId,
      userId: user.id,
      amount: 2000,
      currency: 'FCFA',
      type: 'verification',
      status: 'succeeded',
      provider: charge.provider,
      reference: charge.reference,
      createdAt: new Date()
    });

    await logAudit({
      actorId: user.id,
      action: 'payment',
      metadata: { type: 'verification', amount: 2000, reference: charge.reference }
    });

    const requests = await getCollection<DbVerificationRequest>('verificationRequests');
    const requestId = createId();
    await requests.insertOne({
      _id: requestId,
      userId: user.id,
      status: 'pending',
      amount: 2000,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await logAudit({
      actorId: user.id,
      action: 'verification',
      metadata: { requestId, paymentId }
    });

    return NextResponse.json({ ok: true, requestId });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to request verification' }, { status: 400 });
  }
}
