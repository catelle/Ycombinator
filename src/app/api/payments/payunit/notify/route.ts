import { NextResponse } from 'next/server';
import type { Collection } from 'mongodb';
import { checkPayunitPayment, extractPayunitTransactionId } from '@/lib/payunit';
import { getCollection } from '@/lib/db';
import { createId } from '@/lib/ids';
import { MATCH_BASE_LIMIT, MATCH_LIMIT_INCREMENT } from '@/lib/match-utils';
import { logAudit } from '@/lib/audit';
import type { Match, MatchRequest, Payment, Subscription, User, VerificationRequest } from '@/types';

interface DbPayment extends Omit<Payment, 'id'> {
  _id: string;
}

interface DbMatchRequest extends Omit<MatchRequest, 'id'> {
  _id: string;
}

interface DbMatch extends Omit<Match, 'id'> {
  _id: string;
}

interface DbUser extends Omit<User, 'id'> {
  _id: string;
}

interface DbSubscription extends Omit<Subscription, 'id'> {
  _id: string;
}

interface DbVerificationRequest extends Omit<VerificationRequest, 'id'> {
  _id: string;
}

export async function POST(request: Request) {
  try {
    const text = await request.text();
    let payload: unknown = {};

    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        const params = new URLSearchParams(text);
        payload = Object.fromEntries(params.entries());
      }
    }

    const url = new URL(request.url);
    const transactionId =
      extractPayunitTransactionId(payload) ||
      url.searchParams.get('transaction_id') ||
      url.searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json({ error: 'Missing transaction id' }, { status: 400 });
    }

    const check = await checkPayunitPayment(transactionId);

    const payments = await getCollection<DbPayment>('payments');
    const payment = await payments.findOne({ reference: transactionId });
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const alreadyProcessed = payment.metadata?.processed === true;
    if (payment.status === 'succeeded' && alreadyProcessed) {
      return NextResponse.json({ received: true, processed: true });
    }

    if (check.pending) {
      await payments.updateOne({ _id: payment._id }, { $set: { status: 'pending' } });
      return NextResponse.json({ received: true, pending: true });
    }

    if (!check.success) {
      await payments.updateOne({ _id: payment._id }, { $set: { status: 'failed' } });
      return NextResponse.json({ received: true, failed: true });
    }

    if (!alreadyProcessed) {
      await applyPaymentEffects(payment);
      await payments.updateOne(
        { _id: payment._id },
        { $set: { status: 'succeeded', metadata: { ...(payment.metadata || {}), processed: true } } }
      );
    } else {
      await payments.updateOne({ _id: payment._id }, { $set: { status: 'succeeded' } });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 400 });
  }
}

async function applyPaymentEffects(payment: DbPayment) {
  await logAudit({
    actorId: payment.userId,
    action: 'payment',
    metadata: { type: payment.type, amount: payment.amount, reference: payment.reference }
  });

  if (payment.type === 'match') {
    await handleMatchPayment(payment);
    return;
  }

  if (payment.type === 'match_limit') {
    const users = await getCollection<DbUser>('users');
    const userDoc = await users.findOne({ _id: payment.userId });
    const currentLimit = userDoc?.matchLimit ?? MATCH_BASE_LIMIT;
    const incrementRaw = payment.metadata?.increment;
    const increment = typeof incrementRaw === 'number' ? incrementRaw : MATCH_LIMIT_INCREMENT;
    await users.updateOne(
      { _id: payment.userId },
      { $set: { matchLimit: currentLimit + increment, updatedAt: new Date() } }
    );
    return;
  }

  if (payment.type === 'unlock') {
    const matches = await getCollection<DbMatch>('matches');
    const matchId = payment.metadata?.matchId as string | undefined;
    if (!matchId) return;

    const match = await matches.findOne({ _id: matchId });
    if (!match) return;
    if (match.state === 'CANCELLED') return;

    if (match.state !== 'UNLOCKED' && match.state !== 'LOCKED' && match.state !== 'VERIFIED') {
      await matches.updateOne(
        { _id: matchId },
        { $set: { state: 'UNLOCKED', unlockPaymentId: payment._id, updatedAt: new Date() } }
      );

      await logAudit({
        actorId: payment.userId,
        action: 'unlock',
        metadata: { matchId, paymentId: payment._id }
      });
    }

    return;
  }

  if (payment.type === 'verification') {
    const requests = await getCollection<DbVerificationRequest>('verificationRequests');
    const existing = await requests.findOne({ paymentId: payment._id });
    if (!existing) {
      await requests.insertOne({
        _id: createId(),
        userId: payment.userId,
        status: 'pending',
        amount: payment.amount,
        paymentId: payment._id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await logAudit({
      actorId: payment.userId,
      action: 'verification',
      metadata: { paymentId: payment._id }
    });

    return;
  }

  if (payment.type === 'subscription') {
    const subscriptions = await getCollection<DbSubscription>('subscriptions');
    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const existing = await subscriptions.findOne({ userId: payment.userId, status: 'active' });
    if (existing) {
      await subscriptions.updateOne(
        { _id: existing._id },
        { $set: { type: 'premium', startDate: now, endDate, price: payment.amount } }
      );
    } else {
      await subscriptions.insertOne({
        _id: createId(),
        userId: payment.userId,
        type: 'premium',
        status: 'active',
        startDate: now,
        endDate,
        price: payment.amount
      });
    }
  }
}

async function handleMatchPayment(payment: DbPayment) {
  const requests = await getCollection<DbMatchRequest>('matchRequests');
  const matches = await getCollection<DbMatch>('matches');

  const requestId = payment.metadata?.requestId as string | undefined;
  const payerId = payment.metadata?.payerId as string | undefined;
  if (!requestId || !payerId) return;

  const requestDoc = await requests.findOne({ _id: requestId });
  if (!requestDoc) return;

  const requesterPaid = payerId === requestDoc.requesterId ? true : requestDoc.requesterPaid;
  const recipientPaid = payerId === requestDoc.recipientId ? true : requestDoc.recipientPaid;

  await requests.updateOne(
    { _id: requestDoc._id },
    {
      $set: {
        requesterPaid,
        recipientPaid,
        requesterPaymentId: payerId === requestDoc.requesterId ? payment._id : requestDoc.requesterPaymentId,
        recipientPaymentId: payerId === requestDoc.recipientId ? payment._id : requestDoc.recipientPaymentId,
        updatedAt: new Date()
      }
    }
  );

  if (requesterPaid && recipientPaid && requestDoc.status !== 'matched') {
    const now = new Date();
    const score = requestDoc.score;

    await upsertMatch(matches, requestDoc.requesterId, requestDoc.recipientId, score, now);
    await upsertMatch(matches, requestDoc.recipientId, requestDoc.requesterId, score, now);

    await requests.updateOne(
      { _id: requestDoc._id },
      { $set: { status: 'matched', matchedAt: now, updatedAt: now } }
    );
  }
}

async function upsertMatch(
  matches: Collection<DbMatch>,
  userId: string,
  matchedUserId: string,
  score: number,
  now: Date
) {
  const existing = await matches.findOne({ userId, matchedUserId });
  if (existing) {
    if (existing.state === 'CANCELLED') {
      return;
    }
    await matches.updateOne(
      { _id: existing._id },
      { $set: { state: 'UNLOCKED', score, updatedAt: now } }
    );
    return;
  }

  await matches.insertOne({
    _id: createId(),
    userId,
    matchedUserId,
    score,
    state: 'UNLOCKED',
    matchType: 'cofounder',
    decision: 'accepted',
    createdAt: now,
    updatedAt: now
  });
}
