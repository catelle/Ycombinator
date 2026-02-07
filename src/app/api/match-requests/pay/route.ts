import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { createId } from '@/lib/ids';
import { initCinetPayPayment } from '@/lib/cinetpay';
import { MATCH_REQUEST_EXPIRATION_MS, MATCH_UNLOCK_PRICE_XAF, MATCH_LIMIT_PRICE_XAF, resolveMatchLimit } from '@/lib/match-utils';
import type { Match, MatchRequest, Payment } from '@/types';

const PaySchema = z.object({
  requestId: z.string().min(1)
});

interface DbMatchRequest extends Omit<MatchRequest, 'id'> {
  _id: string;
}

interface DbMatch extends Omit<Match, 'id'> {
  _id: string;
}

interface DbPayment extends Omit<Payment, 'id'> {
  _id: string;
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = await request.json();
    const { requestId } = PaySchema.parse(body);

    const requests = await getCollection<DbMatchRequest>('matchRequests');
    const payments = await getCollection<DbPayment>('payments');
    const matches = await getCollection<DbMatch>('matches');

    const doc = await requests.findOne({ _id: requestId });
    if (!doc) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const expiresAt = doc.expiresAt || new Date(doc.createdAt.getTime() + MATCH_REQUEST_EXPIRATION_MS);
    if (doc.status === 'pending' && expiresAt.getTime() < Date.now()) {
      await requests.updateOne({ _id: doc._id }, { $set: { status: 'expired', updatedAt: new Date() } });
      return NextResponse.json({ error: 'Request expired', code: 'EXPIRED' }, { status: 410 });
    }

    if (doc.status !== 'accepted' && doc.status !== 'matched') {
      return NextResponse.json({ error: 'Request not accepted yet' }, { status: 400 });
    }

    const isRequester = doc.requesterId === user.id;
    const isRecipient = doc.recipientId === user.id;
    if (!isRequester && !isRecipient) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const alreadyPaid = isRequester ? doc.requesterPaid : doc.recipientPaid;
    if (alreadyPaid) {
      return NextResponse.json({ error: 'Payment already recorded' }, { status: 400 });
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

    const transactionId = `match-${createId()}`;
    const charge = await initCinetPayPayment({
      transactionId,
      amount: MATCH_UNLOCK_PRICE_XAF,
      description: 'Unlock match payment',
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.phone,
      metadata: { requestId: doc._id, payerId: user.id }
    });

    if (!charge.success || !charge.paymentUrl) {
      return NextResponse.json({ error: charge.error || 'Payment failed' }, { status: 402 });
    }

    const paymentId = createId();
    await payments.insertOne({
      _id: paymentId,
      userId: user.id,
      amount: MATCH_UNLOCK_PRICE_XAF,
      currency: 'FCFA',
      type: 'match',
      status: 'pending',
      provider: 'cinetpay',
      reference: transactionId,
      createdAt: new Date(),
      metadata: { requestId: doc._id, payerId: user.id }
    });

    await requests.updateOne(
      { _id: doc._id },
      {
        $set: {
          requesterPaymentId: isRequester ? paymentId : doc.requesterPaymentId,
          recipientPaymentId: isRecipient ? paymentId : doc.recipientPaymentId,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({ paymentUrl: charge.paymentUrl });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to start payment' }, { status: 400 });
  }
}
