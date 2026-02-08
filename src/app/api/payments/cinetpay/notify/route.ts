import { NextResponse } from 'next/server';
import type { Collection } from 'mongodb';
import { checkCinetPayPayment, verifyCinetPayWebhook } from '@/lib/cinetpay';
import { getCollection } from '@/lib/db';
import { createId } from '@/lib/ids';
import { MATCH_BASE_LIMIT, MATCH_LIMIT_INCREMENT } from '@/lib/match-utils';
import type { Match, MatchRequest, Payment, User } from '@/types';

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

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let payload: Record<string, string> = {};

    if (contentType.includes('application/json')) {
      const json = (await request.json()) as Record<string, string | number | boolean | null>;
      payload = Object.fromEntries(Object.entries(json).map(([key, value]) => [key, String(value ?? '')]));
    } else {
      const text = await request.text();
      const params = new URLSearchParams(text);
      payload = Object.fromEntries(params.entries());
    }

    const token = request.headers.get('x-token');
    if (!verifyCinetPayWebhook(payload, token)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const transactionId = payload.cpm_trans_id || payload.transaction_id;
    if (!transactionId) {
      return NextResponse.json({ error: 'Missing transaction id' }, { status: 400 });
    }

    const check = await checkCinetPayPayment(transactionId);

    const payments = await getCollection<DbPayment>('payments');
    const payment = await payments.findOne({ reference: transactionId });
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const newStatus = check.success ? 'succeeded' : 'failed';
    await payments.updateOne(
      { _id: payment._id },
      { $set: { status: newStatus } }
    );

    if (check.success && payment.type === 'match') {
      const requests = await getCollection<DbMatchRequest>('matchRequests');
      const matches = await getCollection<DbMatch>('matches');

      const requestId = payment.metadata?.requestId as string | undefined;
      const payerId = payment.metadata?.payerId as string | undefined;
      if (!requestId || !payerId) {
        return NextResponse.json({ ok: true });
      }

      const requestDoc = await requests.findOne({ _id: requestId });
      if (!requestDoc) {
        return NextResponse.json({ ok: true });
      }

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

    if (check.success && payment.type === 'match_limit') {
      const users = await getCollection<DbUser>('users');
      const userDoc = await users.findOne({ _id: payment.userId });
      const currentLimit = userDoc?.matchLimit ?? MATCH_BASE_LIMIT;
      await users.updateOne(
        { _id: payment.userId },
        { $set: { matchLimit: currentLimit + MATCH_LIMIT_INCREMENT, updatedAt: new Date() } }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 400 });
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
