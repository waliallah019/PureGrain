// lib/services/paypalService.ts
//
// Minimal server-side PayPal REST client. We avoid the official SDK so
// nothing leaks to the browser bundle and we keep the dependency surface
// small. All calls are made from API routes only.

import logger from '@/lib/config/logger';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
const PAYPAL_SECRET = process.env.PAYPAL_SECRET_KEY || '';
const PAYPAL_ENV = (process.env.PAYPAL_ENV || 'sandbox').toLowerCase();

interface PaypalApiErrorDetails {
  issue?: string;
  description?: string;
  field?: string;
}

export class PaypalApiError extends Error {
  statusCode: number;
  details?: PaypalApiErrorDetails[];
  debugId?: string;

  constructor(message: string, statusCode: number, details?: PaypalApiErrorDetails[], debugId?: string) {
    super(message);
    this.name = 'PaypalApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.debugId = debugId;
  }
}

function buildPaypalApiError(payload: any, fallbackMessage: string, statusCode: number): PaypalApiError {
  const details = Array.isArray(payload?.details) ? payload.details : undefined;
  const message = details?.[0]?.description || payload?.message || fallbackMessage;
  return new PaypalApiError(message, statusCode, details, payload?.debug_id);
}

export const PAYPAL_BASE_URL =
  PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

export function isPaypalConfigured(): boolean {
  return Boolean(PAYPAL_CLIENT_ID && PAYPAL_SECRET);
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getPaypalAccessToken(): Promise<string> {
  if (!isPaypalConfigured()) {
    throw new Error('PayPal is not configured. Set NEXT_PUBLIC_PAYPAL_CLIENT_ID and PAYPAL_SECRET_KEY.');
  }
  // Reuse access token until ~30s before expiry
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error('[paypal] token request failed', { status: res.status, body: text });
    throw new PaypalApiError(`PayPal token request failed (${res.status}).`, res.status);
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return cachedToken.token;
}

export interface CreateOrderInput {
  amount: number;            // dollars, validated server-side
  currency?: string;         // default USD
  description?: string;
  customId?: string;         // our internal reference (e.g. tmp request id)
}

export interface PaypalOrder {
  id: string;
  status: string;
  links?: Array<{ href: string; rel: string; method: string }>;
}

export async function createPaypalOrder(input: CreateOrderInput): Promise<PaypalOrder> {
  const token = await getPaypalAccessToken();
  const amountStr = input.amount.toFixed(2);

  const res = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: input.customId || 'sample-shipping',
          description: input.description || 'PureGrain leather sample shipping fee',
          amount: {
            currency_code: input.currency || 'USD',
            value: amountStr,
          },
          custom_id: input.customId || undefined,
        },
      ],
      application_context: {
        brand_name: 'Pure Grain Exports',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
      },
    }),
    cache: 'no-store',
  });

  const json = await res.json();
  if (!res.ok) {
    logger.error('[paypal] create order failed', { status: res.status, body: json });
    throw buildPaypalApiError(json, 'Failed to create PayPal order.', res.status);
  }
  return json as PaypalOrder;
}

export interface PaypalCapture {
  id: string;
  status: string;
  payer?: { email_address?: string; payer_id?: string; name?: { given_name?: string; surname?: string } };
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: { currency_code: string; value: string };
      }>;
    };
  }>;
}

export async function capturePaypalOrder(orderId: string): Promise<PaypalCapture> {
  const token = await getPaypalAccessToken();
  const res = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  const json = await res.json();
  if (!res.ok) {
    logger.error('[paypal] capture failed', { status: res.status, orderId, body: json });
    throw buildPaypalApiError(json, 'Failed to capture PayPal order.', res.status);
  }
  return json as PaypalCapture;
}

export async function getPaypalOrder(orderId: string): Promise<any> {
  const token = await getPaypalAccessToken();
  const res = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) {
    logger.error('[paypal] get order failed', { status: res.status, orderId, body: json });
    throw buildPaypalApiError(json, 'Failed to fetch PayPal order.', res.status);
  }
  return json;
}

/**
 * Verifies a PayPal webhook signature. Returns true only when PayPal confirms
 * the event is authentic. Requires PAYPAL_WEBHOOK_ID to be configured.
 */
export async function verifyPaypalWebhookSignature(args: {
  headers: Headers;
  body: string;
}): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    logger.warn('[paypal] PAYPAL_WEBHOOK_ID not configured — refusing to trust webhook.');
    return false;
  }

  const transmissionId = args.headers.get('paypal-transmission-id');
  const transmissionTime = args.headers.get('paypal-transmission-time');
  const certUrl = args.headers.get('paypal-cert-url');
  const authAlgo = args.headers.get('paypal-auth-algo');
  const transmissionSig = args.headers.get('paypal-transmission-sig');

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return false;
  }

  let webhookEvent: any;
  try {
    webhookEvent = JSON.parse(args.body);
  } catch {
    return false;
  }

  const token = await getPaypalAccessToken();
  const res = await fetch(`${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transmission_id: transmissionId,
      transmission_time: transmissionTime,
      cert_url: certUrl,
      auth_algo: authAlgo,
      transmission_sig: transmissionSig,
      webhook_id: webhookId,
      webhook_event: webhookEvent,
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    logger.error('[paypal] webhook verify request failed', { status: res.status });
    return false;
  }
  const json = (await res.json()) as { verification_status?: string };
  return json.verification_status === 'SUCCESS';
}
