import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { createId } from '@/lib/ids';
import { initCinetPayPayment } from '@/lib/cinetpay';
import { MATCH_LIMIT_PRICE_XAF, MATCH_LIMIT_INCREMENT } from '@/lib/match-utils';
import type { Payment } from '@/types';

interface DbPayment extends Omit<Payment, 'id'> {
  _id: string;
}

export async function POST() {
  try {
    const user = await requireSessionUser();
    const payments = await getCollection<DbPayment>('payments');

    const transactionId = `limit-${createId()}`;
    const charge = await initCinetPayPayment({
      transactionId,
      amount: MATCH_LIMIT_PRICE_XAF,
      description: 'Match limit upgrade',
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.phone,
      metadata: { userId: user.id, increment: MATCH_LIMIT_INCREMENT }
    });

    if (!charge.success || !charge.paymentUrl) {
      return NextResponse.json({ error: charge.error || 'Payment failed' }, { status: 402 });
    }

    await payments.insertOne({
      _id: createId(),
      userId: user.id,
      amount: MATCH_LIMIT_PRICE_XAF,
      currency: 'FCFA',
      type: 'match_limit',
      status: 'pending',
      provider: 'cinetpay',
      reference: transactionId,
      createdAt: new Date(),
      metadata: { increment: MATCH_LIMIT_INCREMENT }
    });

    return NextResponse.json({ paymentUrl: charge.paymentUrl });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to start upgrade payment' }, { status: 400 });
  }
}
