import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createVerificationCode, findUserByEmail, storePasswordReset } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email';

const RequestSchema = z.object({
  email: z.string().email()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = RequestSchema.parse(body);

    const user = await findUserByEmail(email);
    if (!user || user.suspended || user.role === 'suspended') {
      return NextResponse.json({ ok: true });
    }

    const code = createVerificationCode();
    await storePasswordReset(user._id, user.email, code);

    let emailSent = true;
    try {
      await sendPasswordResetEmail({ toEmail: user.email, name: user.name, code });
    } catch (error) {
      emailSent = false;
      console.error('Password reset email failed:', error);
    }

    return NextResponse.json({ ok: true, emailSent });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to request password reset' }, { status: 400 });
  }
}
