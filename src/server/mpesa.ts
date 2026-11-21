import { BUSINESS_CONFIG } from '../config/constants.js';
import { repository } from './repository.js';

function cleanEnv(value?: string): string {
  return (value || '').trim().replace(/^['"]|['"]$/g, '');
}

export function getMpesaConfig() {
  const env = cleanEnv(process.env.MPESA_ENV).toLowerCase() === 'sandbox' ? 'sandbox' : 'production';
  const consumerKey = cleanEnv(process.env.MPESA_CONSUMER_KEY);
  const consumerSecret = cleanEnv(process.env.MPESA_CONSUMER_SECRET);
  const shortCode = cleanEnv(process.env.MPESA_SHORTCODE);
  const saved = repository.getPaymentSettings();
  const till = cleanEnv(process.env.MPESA_TILL) || saved.mpesaTill || '';
  const storeName =
    cleanEnv(process.env.MPESA_STORE_NAME) || saved.mpesaStoreName || BUSINESS_CONFIG.mpesaStoreName;
  const passkey = cleanEnv(process.env.MPESA_PASSKEY);
  const transactionType =
    cleanEnv(process.env.MPESA_TRANSACTION_TYPE) === 'CustomerPayBillOnline'
      ? 'CustomerPayBillOnline'
      : 'CustomerBuyGoodsOnline';
  const callbackUrlOverride = cleanEnv(process.env.MPESA_CALLBACK_URL);
  const callbackToken = cleanEnv(process.env.MPESA_CALLBACK_TOKEN);

  const baseUrl =
    env === 'sandbox' ? 'https://sandbox.safaricom.co.ke' : 'https://api.safaricom.co.ke';

  const hasDestinationCode =
    transactionType === 'CustomerPayBillOnline' ? Boolean(shortCode) : Boolean(till);

  return {
    env,
    baseUrl,
    consumerKey,
    consumerSecret,
    shortCode,
    till,
    storeName,
    passkey,
    transactionType: transactionType as 'CustomerBuyGoodsOnline' | 'CustomerPayBillOnline',
    callbackUrlOverride,
    callbackToken,
    enabled: Boolean(consumerKey && consumerSecret && shortCode && passkey && hasDestinationCode),
  };
}

export function isMpesaConfigured(): boolean {
  return getMpesaConfig().enabled;
}

export function formatMpesaPhone(phone: string): string {
  const digits = (phone || '').replace(/[^0-9]/g, '');
  if (digits.startsWith('254') && digits.length === 12) {
    return digits;
  }
  if (digits.startsWith('0') && digits.length === 10 && /^0[71]\d{8}$/.test(digits)) {
    return '254' + digits.slice(1);
  }
  if (/^[71]\d{8}$/.test(digits)) {
    return '254' + digits;
  }
  throw new Error('Please enter a valid Kenyan Safaricom phone number (e.g. 07XX XXX XXX or 01XX XXX XXX).');
}

function getEatTimestamp(): string {
  // Safaricom Daraja expects YYYYMMDDHHmmss in East Africa Time (UTC+3)
  const now = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    String(now.getUTCFullYear()) +
    pad(now.getUTCMonth() + 1) +
    pad(now.getUTCDate()) +
    pad(now.getUTCHours()) +
    pad(now.getUTCMinutes()) +
    pad(now.getUTCSeconds())
  );
}

let cachedToken: { token: string; expiresAt: number; envKey: string } | null = null;

async function getAccessToken(): Promise<string> {
  const cfg = getMpesaConfig();
  if (!cfg.enabled) {
    throw new Error('M-Pesa Daraja API is not configured yet.');
  }

  const envKey = `${cfg.env}:${cfg.consumerKey}:${cfg.shortCode}`;
  if (cachedToken && cachedToken.envKey === envKey && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const auth = Buffer.from(`${cfg.consumerKey}:${cfg.consumerSecret}`).toString('base64');
  const res = await fetch(`${cfg.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(data.errorMessage || data.error_description || 'Failed to authenticate with Safaricom M-Pesa.');
  }

  const expiresInSec = Number(data.expires_in) || 3599;
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(60, expiresInSec - 90) * 1000,
    envKey,
  };
  return cachedToken.token;
}

export async function initiateStkPush(params: {
  orderId: string;
  phone: string;
  amount: number;
  requestOrigin: string;
}): Promise<{
  checkoutRequestId: string;
  merchantRequestId: string;
  customerMessage: string;
  formattedPhone: string;
}> {
  const cfg = getMpesaConfig();
  if (!cfg.enabled) {
    throw new Error(
      cfg.till
        ? `M-Pesa prompt is not active yet. Please use Buy Goods Till ${cfg.till}.`
        : `M-Pesa prompt is not active yet. Please complete payment confirmation via WhatsApp (${BUSINESS_CONFIG.phoneDisplay}).`
    );
  }
  if (cfg.transactionType === 'CustomerBuyGoodsOnline' && !cfg.till) {
    throw new Error('M-Pesa Buy Goods Till number is not configured yet.');
  }

  const formattedPhone = formatMpesaPhone(params.phone);
  const chargeAmount = Math.max(1, Math.ceil(Number(params.amount)));
  const timestamp = getEatTimestamp();
  const password = Buffer.from(`${cfg.shortCode}${cfg.passkey}${timestamp}`).toString('base64');
  const token = await getAccessToken();

  let callbackUrl =
    cfg.callbackUrlOverride ||
    `${(process.env.APP_URL || params.requestOrigin).replace(/\/$/, '')}/api/mpesa/callback`;

  if (cfg.callbackToken && !callbackUrl.includes('token=')) {
    const sep = callbackUrl.includes('?') ? '&' : '?';
    callbackUrl = `${callbackUrl}${sep}token=${encodeURIComponent(cfg.callbackToken)}`;
  }

  const partyB = cfg.transactionType === 'CustomerBuyGoodsOnline' ? cfg.till : cfg.shortCode;

  const payload = {
    BusinessShortCode: cfg.shortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: cfg.transactionType,
    Amount: chargeAmount,
    PartyA: formattedPhone,
    PartyB: partyB,
    PhoneNumber: formattedPhone,
    CallBackURL: callbackUrl,
    AccountReference: params.orderId.slice(0, 12),
    TransactionDesc: `Order ${params.orderId}`.slice(0, 13),
  };

  const res = await fetch(`${cfg.baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || data.ResponseCode !== '0' || !data.CheckoutRequestID) {
    const fallbackHint = cfg.till
      ? `pay via Till ${cfg.till}.`
      : `confirm payment via WhatsApp (${BUSINESS_CONFIG.phoneDisplay}).`;
    throw new Error(
      data.errorMessage ||
        data.ResponseDescription ||
        `Safaricom could not send the M-Pesa prompt. Please confirm your phone number or ${fallbackHint}`
    );
  }

  return {
    checkoutRequestId: data.CheckoutRequestID,
    merchantRequestId: data.MerchantRequestID || '',
    customerMessage: data.CustomerMessage || 'Check your phone and enter your M-Pesa PIN to complete payment.',
    formattedPhone,
  };
}

export async function queryStkPushStatus(checkoutRequestId: string): Promise<{
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  resultDesc: string;
}> {
  const cfg = getMpesaConfig();
  if (!cfg.enabled || !checkoutRequestId) {
    return { status: 'PENDING', resultDesc: 'M-Pesa status check unavailable.' };
  }

  const timestamp = getEatTimestamp();
  const password = Buffer.from(`${cfg.shortCode}${cfg.passkey}${timestamp}`).toString('base64');
  const token = await getAccessToken();

  const res = await fetch(`${cfg.baseUrl}/mpesa/stkpushquery/v1/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      BusinessShortCode: cfg.shortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
  });

  const data: any = await res.json().catch(() => ({}));
  // If Safaricom says transaction is still being processed (errorCode 500.001.1001)
  if (!res.ok) {
    return { status: 'PENDING', resultDesc: data.errorMessage || 'Awaiting M-Pesa PIN confirmation.' };
  }

  const resultCode = data.ResultCode !== undefined ? String(data.ResultCode) : '';
  if (resultCode === '0') {
    return { status: 'CONFIRMED', resultDesc: data.ResultDesc || 'Payment confirmed.' };
  }
  if (resultCode !== '') {
    return { status: 'FAILED', resultDesc: data.ResultDesc || 'Payment was not completed.' };
  }

  return { status: 'PENDING', resultDesc: 'Awaiting M-Pesa PIN confirmation.' };
}
