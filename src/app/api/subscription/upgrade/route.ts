import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { createId } from '@/lib/ids';
import type { Subscription } from '@/types';
import { chargeMobileMoney } from '@/lib/payments';
import { logAudit } from '@/lib/audit';
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

    const charge = await chargeMobileMoney({
      userId: user.id,
      amount: 5000,
      currency: 'FCFA',
      type: 'subscription'
    });

    if (!charge.success) {
      return NextResponse.json({ error: 'Payment failed' }, { status: 402 });
    }

    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    await payments.insertOne({
      _id: createId(),
      userId: user.id,
      amount: 5000,
      currency: 'FCFA',
      type: 'subscription',
      status: 'succeeded',
      provider: charge.provider,
      reference: charge.reference,
      createdAt: new Date()
    });

    const existing = await subscriptions.findOne({ userId: user.id, status: 'active' });
    if (existing) {
      await subscriptions.updateOne(
        { _id: existing._id },
        { $set: { type: 'premium', startDate: now, endDate, price: 5000 } }
      );
    } else {
      await subscriptions.insertOne({
        _id: createId(),
        userId: user.id,
        type: 'premium',
        status: 'active',
        startDate: now,
        endDate,
        price: 5000
      });
    }

    await logAudit({
      actorId: user.id,
      action: 'payment',
      metadata: { type: 'subscription', amount: 5000, reference: charge.reference }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to upgrade subscription' }, { status: 400 });
  }
}
