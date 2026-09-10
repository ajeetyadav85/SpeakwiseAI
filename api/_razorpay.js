const crypto = require('crypto');

const PLAN_PRICES_INR = {
  '1_DAY': 9,
  '1_WEEK': 49,
  '1_MONTH': 99,
  '3_MONTH': 199,
  '6_MONTH': 299,
  '1_YEAR': 599,
  'PRO_MONTHLY': 99,
};

const PLAN_DURATION_HOURS = {
  '1_DAY': 24,
  '1_WEEK': 7 * 24,
  '1_MONTH': 30 * 24,
  '3_MONTH': 90 * 24,
  '6_MONTH': 180 * 24,
  '1_YEAR': 365 * 24,
  'PRO_MONTHLY': 720,
};

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TaDSoq9X70XrEX';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'Myvp7zXzgAwvoiV7O16C1Yrh';

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-guest-id, x-razorpay-signature'
  );
}

function getParsedBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  try {
    return JSON.parse(req.body);
  } catch (e) {
    return {};
  }
}

async function handleCreateOrder(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const body = getParsedBody(req);
  const { planId = '1_MONTH', currency = 'INR', receipt, amount } = body;

  let amountInPaise;
  let planPriceInr;

  if (amount !== undefined && amount !== null) {
    amountInPaise = Number(amount);
    planPriceInr = Math.round(amountInPaise / 100);
  } else {
    planPriceInr = PLAN_PRICES_INR[planId] || 99;
    amountInPaise = planPriceInr * 100;
  }

  if (!amountInPaise || isNaN(amountInPaise) || amountInPaise < 100) {
    return res.status(400).json({
      success: false,
      error: 'Amount must be at least 100 paise (₹1.00)',
    });
  }

  const keyId = RAZORPAY_KEY_ID;
  const keySecret = RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return res.status(500).json({
      success: false,
      error: 'Razorpay API credentials not configured',
    });
  }

  const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const orderReceipt = receipt || `rcpt_${(planId || 'sub').toLowerCase()}_${Date.now().toString().slice(-8)}`;

  try {
    const rzRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: currency || 'INR',
        receipt: orderReceipt,
        notes: {
          planId: planId || '1_MONTH',
          platform: 'speakwise_web_prod',
        },
      }),
    });

    const order = await rzRes.json();
    if (!rzRes.ok) {
      return res.status(rzRes.status || 500).json({
        success: false,
        error: order.error?.description || order.message || 'Failed to create Razorpay order',
      });
    }

    const orderId = order.id;

    return res.status(200).json({
      success: true,
      order_id: orderId,
      orderId: orderId,
      id: orderId,
      amount: order.amount || amountInPaise,
      currency: order.currency || currency || 'INR',
      key_id: keyId,
      keyId: keyId,
      receipt: orderReceipt,
      data: {
        order_id: orderId,
        orderId: orderId,
        id: orderId,
        amount: order.amount || amountInPaise,
        amountInr: planPriceInr,
        currency: order.currency || currency || 'INR',
        keyId: keyId,
        planId: planId,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Error communicating with Razorpay API',
    });
  }
}

async function handleVerifyPayment(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const body = getParsedBody(req);
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    planId = '1_MONTH',
    currentExpiresAt,
  } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({
      success: false,
      error: 'Missing required payment verification fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.',
    });
  }

  const keySecret = RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return res.status(500).json({
      success: false,
      error: 'Razorpay secret key is not configured on the server',
    });
  }

  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  let isMatch = false;
  if (expectedSignature.length === razorpay_signature.length) {
    isMatch = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(razorpay_signature, 'utf-8')
    );
  }

  if (!isMatch) {
    return res.status(400).json({
      success: false,
      error: 'Payment verification failed: Invalid signature',
    });
  }

  const durationHours = PLAN_DURATION_HOURS[planId] || 720;
  const planPriceInr = PLAN_PRICES_INR[planId] || 99;
  const nowMs = Date.now();
  let baseTimeMs = nowMs;

  if (currentExpiresAt) {
    const clientExpiryMs = new Date(currentExpiresAt).getTime();
    if (!isNaN(clientExpiryMs) && clientExpiryMs > nowMs) {
      baseTimeMs = clientExpiryMs;
    }
  }

  const expiresAt = new Date(baseTimeMs + durationHours * 3600 * 1000);

  return res.status(200).json({
    success: true,
    message: 'Payment verified successfully',
    data: {
      transactionId: razorpay_payment_id,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: 'SUCCESS',
      isSignatureVerified: true,
      isPro: true,
      planId: planId,
      paidAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      durationHours: durationHours,
      amountInr: planPriceInr,
    },
  });
}

function handleUsageStatus(req, res) {
  setCorsHeaders(res);
  return res.status(200).json({
    success: true,
    data: {
      isPro: false,
      attemptsLeft: 3,
      maxAttempts: 3,
      attemptsUsed: 0,
      canProceed: true,
      planType: 'GUEST',
    },
  });
}

function handleUsageConsume(req, res) {
  setCorsHeaders(res);
  return res.status(200).json({
    success: true,
    data: {
      isPro: false,
      attemptsLeft: 2,
      maxAttempts: 3,
      attemptsUsed: 1,
      canProceed: true,
      planType: 'GUEST',
    },
  });
}

module.exports = {
  setCorsHeaders,
  getParsedBody,
  handleCreateOrder,
  handleVerifyPayment,
  handleUsageStatus,
  handleUsageConsume,
  PLAN_PRICES_INR,
  PLAN_DURATION_HOURS,
};
