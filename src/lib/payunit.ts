const BASE_URL = process.env.PAYUNIT_BASE_URL || 'https://gateway.payunit.net';
const API_USER = process.env.PAYUNIT_API_USER || '';
const API_PASSWORD = process.env.PAYUNIT_API_PASSWORD || '';
const MODE = process.env.PAYUNIT_MODE || 'test';
const CURRENCY = process.env.PAYUNIT_CURRENCY || 'XAF';
const RETURN_URL = process.env.PAYUNIT_RETURN_URL || '';
const NOTIFY_URL = process.env.PAYUNIT_NOTIFY_URL || '';
const PAYMENT_COUNTRY = process.env.PAYUNIT_PAYMENT_COUNTRY || 'CM';

export interface PayunitInitRequest {
  transactionId: string;
  amount: number;
  currency?: string;
  returnUrl?: string;
  notifyUrl?: string;
  paymentCountry?: string;
}

export interface PayunitInitResult {
  success: boolean;
  transactionId: string;
  paymentUrl?: string;
  error?: string;
  raw?: unknown;
}

export interface PayunitCheckResult {
  success: boolean;
  pending: boolean;
  status?: string;
  amount?: number;
  currency?: string;
  raw?: unknown;
}

function isConfigured() {
  return Boolean(API_USER && API_PASSWORD);
}

function getHeaders(): HeadersInit {
  const auth = Buffer.from(`${API_USER}:${API_PASSWORD}`).toString('base64');
  return {
    Authorization: `Basic ${auth}`,
    'Content-Type': 'application/json',
    mode: MODE
  };
}

export async function initPayunitPayment(payload: PayunitInitRequest): Promise<PayunitInitResult> {
  if (!isConfigured()) {
    return { success: false, transactionId: payload.transactionId, error: 'Payunit config missing' };
  }

  const body: Record<string, string | number> = {
    total_amount: Math.round(payload.amount),
    currency: payload.currency || CURRENCY,
    transaction_id: payload.transactionId,
    payment_country: payload.paymentCountry || PAYMENT_COUNTRY
  };

  const returnUrl = payload.returnUrl || RETURN_URL;
  if (returnUrl) body.return_url = returnUrl;

  const notifyUrl = payload.notifyUrl || NOTIFY_URL;
  if (notifyUrl) body.notify_url = notifyUrl;

  const response = await fetch(`${BASE_URL}/api/gateway/initialize`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body)
  });

  const data = (await response.json()) as { message?: string; data?: { transaction_url?: string } };
  const paymentUrl = data?.data?.transaction_url;

  if (!response.ok || !paymentUrl) {
    return {
      success: false,
      transactionId: payload.transactionId,
      error: data?.message || 'Payunit payment init failed',
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

export async function checkPayunitPayment(transactionId: string): Promise<PayunitCheckResult> {
  if (!isConfigured()) {
    return { success: false, pending: true, status: 'CONFIG_MISSING' };
  }

  const response = await fetch(`${BASE_URL}/api/gateway/paymentstatus/${transactionId}`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = (await response.json()) as {
    message?: string;
    data?: { transaction_status?: string; transaction_amount?: number; transaction_currency?: string };
  };

  const status = data?.data?.transaction_status || data?.message;
  const normalized = status ? status.toUpperCase() : '';
  const success = response.ok && normalized === 'SUCCESS';
  const pending = !response.ok || !normalized || normalized === 'PENDING' || normalized === 'INITIATED';

  return {
    success,
    pending,
    status,
    amount: data?.data?.transaction_amount,
    currency: data?.data?.transaction_currency,
    raw: data
  };
}

export function extractPayunitTransactionId(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const data = payload as Record<string, unknown>;

  const direct =
    (typeof data.transaction_id === 'string' && data.transaction_id) ||
    (typeof data.transactionId === 'string' && data.transactionId) ||
    (typeof data.trans_id === 'string' && data.trans_id) ||
    (typeof data.transId === 'string' && data.transId);

  if (direct) return direct.trim();

  const nested = data.data && typeof data.data === 'object' ? (data.data as Record<string, unknown>) : null;
  const nestedId =
    (nested && typeof nested.transaction_id === 'string' && nested.transaction_id) ||
    (nested && typeof nested.transactionId === 'string' && nested.transactionId);

  return nestedId ? nestedId.trim() : null;
}
