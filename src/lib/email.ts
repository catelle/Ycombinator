interface EmailPayload {
  toEmail: string;
  name: string;
  code: string;
}
interface NotificationPayload {
  toEmail: string;
  name: string;
  subject: string;
  message: string;
  actionUrl?: string;
}

const EMAILJS_ENDPOINT = 'https://api.emailjs.com/api/v1.0/email/send';

async function sendEmail(payload: EmailPayload, purpose: 'verification' | 'password_reset', templateOverride?: string): Promise<void> {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = templateOverride || process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.info('[EMAILJS] Missing configuration. Code:', payload.code);
    return;
  }

  const body: Record<string, unknown> = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: {
      to_email: payload.toEmail,
      to_name: payload.name,
      verification_code: payload.code,
      purpose
    }
  };

  if (privateKey) {
    body.accessToken = privateKey;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.info('[EMAILJS] Sending code:', payload.code, 'purpose:', purpose);
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

export async function sendVerificationEmail(payload: EmailPayload): Promise<void> {
  return sendEmail(payload, 'verification');
}

export async function sendPasswordResetEmail(payload: EmailPayload): Promise<void> {
  return sendEmail(payload, 'password_reset');
}

export async function sendNotificationEmail(payload: NotificationPayload): Promise<void> {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_NOTIFICATION_TEMPLATE_ID || process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.info('[EMAILJS] Missing configuration. Notification:', payload.subject);
    return;
  }

  const body: Record<string, unknown> = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: {
      to_email: payload.toEmail,
      to_name: payload.name,
      subject: payload.subject,
      message: payload.message,
      action_url: payload.actionUrl,
      purpose: 'notification'
    }
  };

  if (privateKey) {
    body.accessToken = privateKey;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.info('[EMAILJS] Sending notification:', payload.subject);
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
    console.error('[EMAILJS] Failed to send notification email', text);
    throw new Error('Email delivery failed');
  }
}
