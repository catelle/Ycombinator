import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import type { Match, MatchRequest, Payment, Profile, User } from '@/types';

interface DbUser extends Omit<User, 'id'> {
  _id: string;
  deletedAt?: Date;
  suspended?: boolean;
}

interface DbProfile extends Omit<Profile, 'id'> {
  _id: string;
}

interface DbMatch extends Omit<Match, 'id'> {
  _id: string;
}

interface DbMatchRequest extends Omit<MatchRequest, 'id'> {
  _id: string;
}

interface DbPayment extends Omit<Payment, 'id'> {
  _id: string;
}

interface DbAuditLog {
  _id: string;
}

export async function GET() {
  try {
    const admin = await requireSessionUser();
    if (admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await getCollection<DbUser>('users');
    const profiles = await getCollection<DbProfile>('profiles');
    const matches = await getCollection<DbMatch>('matches');
    const requests = await getCollection<DbMatchRequest>('matchRequests');
    const payments = await getCollection<DbPayment>('payments');
    const auditLogs = await getCollection<DbAuditLog>('auditLogs');

    const [
      usersTotal,
      usersDeleted,
      usersSuspended,
      profilesTotal,
      profilesCompleted,
      matchesTotal,
      matchesLocked,
      matchesCancelled,
      requestsPending,
      paymentsTotal,
      paymentsSucceeded,
      auditCount
    ] = await Promise.all([
      users.countDocuments({}),
      users.countDocuments({ deletedAt: { $exists: true } }),
      users.countDocuments({ suspended: true }),
      profiles.countDocuments({}),
      profiles.countDocuments({ completed: true }),
      matches.countDocuments({}),
      matches.countDocuments({ state: 'LOCKED' }),
      matches.countDocuments({ state: 'CANCELLED' }),
      requests.countDocuments({ status: 'pending' }),
      payments.countDocuments({}),
      payments.countDocuments({ status: 'succeeded' }),
      auditLogs.countDocuments({})
    ]);

    const revenueAgg = await payments.aggregate([
      { $match: { status: 'succeeded' } },
      { $group: { _id: '$currency', total: { $sum: '$amount' } } }
    ]).toArray();

    const revenue = revenueAgg.reduce<Record<string, number>>((acc, entry) => {
      acc[entry._id as string] = entry.total as number;
      return acc;
    }, {});

    const usersActive = usersTotal - usersDeleted - usersSuspended;

    return NextResponse.json({
      users: {
        total: usersTotal,
        active: usersActive,
        deleted: usersDeleted,
        suspended: usersSuspended
      },
      profiles: {
        total: profilesTotal,
        completed: profilesCompleted
      },
      matches: {
        total: matchesTotal,
        locked: matchesLocked,
        cancelled: matchesCancelled
      },
      requests: {
        pending: requestsPending
      },
      payments: {
        total: paymentsTotal,
        succeeded: paymentsSucceeded,
        revenue
      },
      auditLogs: {
        total: auditCount
      }
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    if (error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to load admin stats' }, { status: 500 });
  }
}
