import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resetPasswordWithCode } from '@/lib/auth';

const ResetSchema = z.object({
  email: z.string().email(),
  code: z.string().min(4),
  password: z.string().min(8)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, code, password } = ResetSchema.parse(body);

    const ok = await resetPasswordWithCode(email, code, password);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 400 });
  }
}
