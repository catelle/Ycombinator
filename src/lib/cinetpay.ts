import crypto from 'crypto';

const API_KEY = process.env.CINETPAY_API_KEY || '';
const SITE_ID = process.env.CINETPAY_SITE_ID || '';
const SECRET_KEY = process.env.CINETPAY_SECRET_KEY || '';
const NOTIFY_URL = process.env.CINETPAY_NOTIFY_URL || '';
const RETURN_URL = process.env.CINETPAY_RETURN_URL || '';
const CANCEL_URL = process.env.CINETPAY_CANCEL_URL || '';
const CHANNELS = process.env.CINETPAY_CHANNELS || 'MOBILE_MONEY';
const CURRENCY = process.env.CINETPAY_CURRENCY || 'XAF';
const PAYMENT_ENDPOINT = 'https://api-checkout.cinetpay.com/v2/payment';
const CHECK_ENDPOINT = 'https://api-checkout.cinetpay.com/v2/payment/check';

export interface CinetPayInitRequest {
  transactionId: string;
  amount: number;
  description: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface CinetPayInitResult {
  success: boolean;
  paymentUrl?: string;
  transactionId: string;
  error?: string;
  raw?: unknown;
}

export async function initCinetPayPayment(payload: CinetPayInitRequest): Promise<CinetPayInitResult> {
  if (!API_KEY || !SITE_ID) {
    return { success: false, transactionId: payload.transactionId, error: 'CinetPay config missing' };
  }

  const body = {
    apikey: API_KEY,
    site_id: SITE_ID,
    transaction_id: payload.transactionId,
    amount: payload.amount,
    currency: CURRENCY,
    description: payload.description,
    notify_url: NOTIFY_URL,
    return_url: RETURN_URL,
    cancel_url: CANCEL_URL,
    channels: CHANNELS,
    customer_name: payload.customerName,
    customer_email: payload.customerEmail,
    customer_phone_number: payload.customerPhone,
    metadata: payload.metadata ? JSON.stringify(payload.metadata) : undefined
  };

  const response = await fetch(PAYMENT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = (await response.json()) as { code?: string; message?: string; data?: { payment_url?: string } };
  const paymentUrl = data?.data?.payment_url;

  if (!response.ok || !paymentUrl) {
    return {
      success: false,
      transactionId: payload.transactionId,
      error: data?.message || 'CinetPay payment init failed',
      raw: data
    };
  }

  return {
    success: true,
    transactionId: payload.transactionId,
    paymentUrl,
    raw: data
  };
}

export interface CinetPayCheckResult {
  success: boolean;
  status?: string;
  amount?: number;
  currency?: string;
  raw?: unknown;
}

export async function checkCinetPayPayment(transactionId: string): Promise<CinetPayCheckResult> {
  if (!API_KEY || !SITE_ID) {
    return { success: false, status: 'CONFIG_MISSING' };
  }

  const response = await fetch(CHECK_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apikey: API_KEY, site_id: SITE_ID, transaction_id: transactionId })
  });

  const data = (await response.json()) as {
    code?: string;
    message?: string;
    data?: { status?: string; payment_status?: string; amount?: number; currency?: string };
  };

  const status = data?.data?.status || data?.data?.payment_status || data?.code;
  const success = status === 'ACCEPTED' || status === 'SUCCESS' || status === '00';

  return {
    success,
    status,
    amount: data?.data?.amount,
    currency: data?.data?.currency,
    raw: data
  };
}

export function verifyCinetPayWebhook(payload: Record<string, string>, token: string | null): boolean {
  if (!SECRET_KEY || !token) return false;

  const fields = [
    'cpm_site_id',
    'cpm_trans_id',
    'cpm_trans_date',
    'cpm_amount',
    'cpm_currency',
    'signature',
    'payment_method',
    'cel_phone_num',
    'cpm_phone_prefixe',
    'cpm_language',
    'cpm_version',
    'cpm_payment_config',
    'cpm_page_action',
    'cpm_custom',
    'cpm_designation',
    'cpm_error_message'
  ];

  const data = fields.map(field => payload[field] ?? '').join('');
  const digest = crypto.createHmac('sha256', SECRET_KEY).update(data).digest('hex');
  const digestBuffer = Buffer.from(digest, 'utf-8');
  const tokenBuffer = Buffer.from(token, 'utf-8');
  if (digestBuffer.length !== tokenBuffer.length) return false;
  return crypto.timingSafeEqual(digestBuffer, tokenBuffer);
}
