import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { createId } from '@/lib/ids';
import { initPayunitPayment } from '@/lib/payunit';
import { MATCH_LIMIT_PRICE_XAF, MATCH_LIMIT_INCREMENT } from '@/lib/match-utils';
import type { Payment } from '@/types';

interface DbPayment extends Omit<Payment, 'id'> {
  _id: string;
}

export async function POST() {
  try {
    const user = await requireSessionUser();
    const payments = await getCollection<DbPayment>('payments');

    const transactionId = `limit${createId().replace(/-/g, '')}`;
    const charge = await initPayunitPayment({
      transactionId,
      amount: MATCH_LIMIT_PRICE_XAF
    });

    if (!charge.success || !charge.paymentUrl) {
      return NextResponse.json({ error: charge.error || 'Payment failed' }, { status: 402 });
    }

    await payments.insertOne({
      _id: createId(),
      userId: user.id,
      amount: MATCH_LIMIT_PRICE_XAF,
      currency: 'XAF',
      type: 'match_limit',
      status: 'pending',
      provider: 'payunit',
      reference: transactionId,
      createdAt: new Date(),
      metadata: { increment: MATCH_LIMIT_INCREMENT }
    });

    return NextResponse.json({ paymentUrl: charge.paymentUrl });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to start upgrade payment' }, { status: 400 });
  }
}
