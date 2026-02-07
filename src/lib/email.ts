interface EmailPayload {
  toEmail: string;
  name: string;
  code: string;
}

const EMAILJS_ENDPOINT = 'https://api.emailjs.com/api/v1.0/email/send';

export async function sendVerificationEmail(payload: EmailPayload): Promise<void> {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.info('[EMAILJS] Missing configuration. Verification code:', payload.code);
    return;
  }

  const body: Record<string, unknown> = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: {
      to_email: payload.toEmail,
      to_name: payload.name,
      verification_code: payload.code
    }
  };

  if (privateKey) {
    body.accessToken = privateKey;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.info('[EMAILJS] Sending verification code:', payload.code);
  }

  const response = await fetch(EMAILJS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: process.env.EMAILJS_ORIGIN || 'http://localhost'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[EMAILJS] Failed to send email', text);
    throw new Error('Email delivery failed');
  }
}
