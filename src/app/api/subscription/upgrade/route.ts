import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { createId } from '@/lib/ids';
import type { Subscription } from '@/types';
import { initPayunitPayment } from '@/lib/payunit';
import type { Payment } from '@/types';

interface DbSubscription extends Omit<Subscription, 'id'> {
  _id: string;
}

interface DbPayment extends Omit<Payment, 'id'> {
  _id: string;
}

export async function POST() {
  try {
    const user = await requireSessionUser();
    const subscriptions = await getCollection<DbSubscription>('subscriptions');
    const payments = await getCollection<DbPayment>('payments');

    const existingPremium = await subscriptions.findOne({ userId: user.id, status: 'active', type: 'premium' });
    if (existingPremium && existingPremium.endDate.getTime() > Date.now()) {
      return NextResponse.json({ ok: true, alreadyActive: true });
    }

    const transactionId = `sub${createId().replace(/-/g, '')}`;
    const charge = await initPayunitPayment({
      transactionId,
      amount: 5000
    });

    if (!charge.success || !charge.paymentUrl) {
      return NextResponse.json({ error: charge.error || 'Payment failed' }, { status: 402 });
    }

    await payments.insertOne({
      _id: createId(),
      userId: user.id,
      amount: 5000,
      currency: 'XAF',
      type: 'subscription',
      status: 'pending',
      provider: 'payunit',
      reference: transactionId,
      createdAt: new Date(),
      metadata: { plan: 'premium', durationMonths: 1 }
    });

    return NextResponse.json({ paymentUrl: charge.paymentUrl });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to upgrade subscription' }, { status: 400 });
  }
}
