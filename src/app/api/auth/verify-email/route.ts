import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyEmailCode } from '@/lib/auth';

const VerifySchema = z.object({
  email: z.string().email(),
  code: z.string().min(4)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, code } = VerifySchema.parse(body);
    const ok = await verifyEmailCode(email, code);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
  }
}
