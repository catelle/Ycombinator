import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUser } from '@/lib/auth';
import { getCollection } from '@/lib/db';
import { createId } from '@/lib/ids';
import type { Report } from '@/types';

const ReportSchema = z.object({
  reportedUserId: z.string().min(1),
  reason: z.string().min(3)
});

interface DbReport extends Omit<Report, 'id'> {
  _id: string;
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = await request.json();
    const { reportedUserId, reason } = ReportSchema.parse(body);

    const reports = await getCollection<DbReport>('reports');
    await reports.insertOne({
      _id: createId(),
      reporterId: user.id,
      reportedUserId,
      reason,
      createdAt: new Date()
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 400 });
  }
}
