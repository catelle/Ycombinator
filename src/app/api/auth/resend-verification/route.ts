import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createVerificationCode, findUserByEmail, storeEmailVerification } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';

const ResendSchema = z.object({
  email: z.string().email()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = ResendSchema.parse(body);

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
    }

    const code = createVerificationCode();
    await storeEmailVerification(user._id, user.email, code);
    await sendVerificationEmail({ toEmail: user.email, name: user.name, code });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to resend verification' }, { status: 400 });
  }
}
