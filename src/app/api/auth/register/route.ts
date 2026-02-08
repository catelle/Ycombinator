import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createUser,
  findUserByEmail,
  findUserByEmailIncludingDeleted,
  findUserByPhone,
  findUserByPhoneIncludingDeleted,
  storeEmailVerification,
  updateUserPassword,
  updateUserBasics
} from '@/lib/auth';
import { createVerificationCode } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  password: z.string().min(8)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = RegisterSchema.parse(body);
    const normalizedPhone = payload.phone.trim();

    const existing = await findUserByEmail(payload.email);
    const existingByPhone = await findUserByPhone(normalizedPhone);
    let userId = existing?._id;

    const deletedByEmail = await findUserByEmailIncludingDeleted(payload.email);
    if (deletedByEmail?.deletedAt) {
      return NextResponse.json({ error: 'Account unavailable' }, { status: 409 });
    }

    const deletedByPhone = await findUserByPhoneIncludingDeleted(normalizedPhone);
    if (deletedByPhone?.deletedAt) {
      return NextResponse.json({ error: 'Account unavailable' }, { status: 409 });
    }

    if (existing?.emailVerified) {
      return NextResponse.json({ error: 'Account already exists' }, { status: 409 });
    }
    if (existing?.suspended || existing?.role === 'suspended') {
      return NextResponse.json({ error: 'Account suspended' }, { status: 403 });
    }
    if (existingByPhone && (!existing || existingByPhone._id !== existing._id)) {
      return NextResponse.json({ error: 'Phone already in use' }, { status: 409 });
    }

    if (!existing) {
      const newUser = await createUser({ ...payload, phone: normalizedPhone });
      userId = newUser.id;
    } else {
      await updateUserPassword(payload.email, payload.password);
      await updateUserBasics(payload.email, { name: payload.name, phone: normalizedPhone });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unable to create user' }, { status: 400 });
    }

    const code = createVerificationCode();
    await storeEmailVerification(userId, payload.email, code);
    let emailSent = true;
    try {
      await sendVerificationEmail({ toEmail: payload.email, name: payload.name, code });
    } catch (emailError) {
      emailSent = false;
      console.error('Verification email failed:', emailError);
    }

    return NextResponse.json({ ok: true, requiresVerification: true, emailSent });
  } catch (error) {
    console.error('Register failed:', error);
    const message = error instanceof Error ? error.message : 'Failed to register';
    if (message.includes('E11000')) {
      return NextResponse.json({ error: 'Email or phone already in use' }, { status: 409 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'production' ? 'Failed to register' : message },
      { status: 400 }
    );
  }
}
