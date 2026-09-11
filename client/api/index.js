// ==============================================================================
// SpeakWise AI — Consolidated Vercel Serverless Express API Entrypoint
// Single Serverless Function replacing all separate files in /api
// ==============================================================================

const crypto = require('crypto');

// Resilient Express module loader (works in Vercel root and local development)
let express;
try {
  express = require('express');
} catch (e1) {
  try {
    express = require('../server/node_modules/express');
  } catch (e2) {
    express = require('express');
  }
}

// Resilient CORS module loader
let cors;
try {
  cors = require('cors');
} catch (e1) {
  try {
    cors = require('../server/node_modules/cors');
  } catch (e2) {
    cors = () => (req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-guest-id, x-razorpay-signature'
      );
      if (req.method === 'OPTIONS') return res.status(200).end();
      next();
    };
  }
}

// Resilient Mongoose loader
let mongoose = null;
try {
  mongoose = require('mongoose');
} catch (e1) {
  try {
    mongoose = require('../server/node_modules/mongoose');
  } catch (e2) {
    mongoose = null;
  }
}

// ==============================================================================
// 1. Database Connection & Models
// ==============================================================================
let cachedConn = null;
let cachedPromise = null;

async function connectDB() {
  if (!mongoose) return null;
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  if (cachedConn && mongoose.connection.readyState === 1) {
    return cachedConn;
  }

  if (!cachedPromise) {
    cachedPromise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    }).then((m) => m);
  }

  try {
    cachedConn = await cachedPromise;
    return cachedConn;
  } catch (e) {
    cachedPromise = null;
    console.warn('[VERCEL MONGODB] Connection failed, running in fallback mode:', e.message);
    return null;
  }
}

let UserModel = null;
if (mongoose) {
  const userSchema = new mongoose.Schema(
    {
      email: { type: String, required: true, unique: true, index: true, lowercase: true },
      passwordHash: { type: String, required: true },
      fullName: { type: String, required: true },
      role: { type: String, default: 'PRO_USER' },
      authProvider: { type: String, default: 'email' },
      googleId: { type: String, default: null },
      avatarUrl: {
        type: String,
        default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      },
      streakDays: { type: Number, default: 7 },
      totalPracticeMinutes: { type: Number, default: 142 },
      averageScore: { type: Number, default: 88 },
      targetWpm: { type: Number, default: 145 },
      exp: { type: Number, default: 1850 },
      level: { type: Number, default: 4 },
      subscriptionPlan: { type: String, default: null },
      subscriptionExpiresAt: { type: Date, default: null },
      guestAttemptsConsumed: { type: Number, default: 0 },
    },
    { timestamps: true }
  );

  UserModel = mongoose.models.User || mongoose.model('User', userSchema);
}

// ==============================================================================
// 2. Authentication Helpers
// ==============================================================================
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'speakwise_jwt_access_secret_key_32chars_min';
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80';

function generateToken(payload, secret = JWT_SECRET, expiresInSec = 604800) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expiresInSec;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token, secret = JWT_SECRET) {
  try {
    const [header, body, signature] = token.split('.');
    if (!header || !body || !signature) return null;
    const expectedSig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

// ==============================================================================
// 3. Razorpay Constants & Pricing
// ==============================================================================
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

// ==============================================================================
// 4. Controller Route Handlers
// ==============================================================================

// Google Login Handler
async function handleGoogleLogin(req, res) {
  const { email, fullName, googleId, avatarUrl } = req.body || {};

  const normalizedEmail = (email || 'user@speakwise.ai').toLowerCase().trim();
  const normalizedName = fullName || normalizedEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const userId = 'usr_g_' + (googleId || Date.now().toString(36) + Math.random().toString(36).substring(2, 6));
  const effectiveAvatar = avatarUrl || DEFAULT_AVATAR;

  let dbUser = null;
  try {
    const db = await connectDB();
    if (db && UserModel) {
      dbUser = await UserModel.findOne({ email: normalizedEmail });
      if (!dbUser) {
        dbUser = await UserModel.create({
          fullName: normalizedName,
          email: normalizedEmail,
          passwordHash: 'GOOGLE_OAUTH_USER',
          role: 'PRO_USER',
          authProvider: 'google',
          googleId: googleId || undefined,
          avatarUrl: effectiveAvatar,
          streakDays: 7,
          totalPracticeMinutes: 142,
          averageScore: 88,
          targetWpm: 145,
          exp: 1850,
          level: 4,
        });
      } else {
        let changed = false;
        if (!dbUser.googleId && googleId) {
          dbUser.googleId = googleId;
          changed = true;
        }
        if (effectiveAvatar && (!dbUser.avatarUrl || dbUser.avatarUrl.includes('unsplash'))) {
          dbUser.avatarUrl = effectiveAvatar;
          changed = true;
        }
        if (changed) {
          await dbUser.save();
        }
      }
    }
  } catch (dbErr) {
    console.warn('[VERCEL AUTH] MongoDB fallback for Google Login:', dbErr.message);
  }

  const effectiveId = dbUser ? dbUser._id.toString() : userId;
  const user = {
    id: effectiveId,
    _id: effectiveId,
    email: dbUser ? dbUser.email : normalizedEmail,
    fullName: dbUser ? dbUser.fullName : normalizedName,
    avatarUrl: dbUser ? dbUser.avatarUrl : effectiveAvatar,
    role: dbUser ? dbUser.role : 'PRO_USER',
    authProvider: 'google',
    googleId: googleId || (dbUser ? dbUser.googleId : undefined),
    streakDays: dbUser?.streakDays ?? 7,
    totalPracticeMinutes: dbUser?.totalPracticeMinutes ?? 142,
    averageScore: dbUser?.averageScore ?? 88,
    targetWpm: dbUser?.targetWpm ?? 145,
    exp: dbUser?.exp ?? 1850,
    level: dbUser?.level ?? 4,
    createdAt: dbUser?.createdAt ? new Date(dbUser.createdAt).toISOString() : new Date().toISOString(),
  };

  const accessToken = generateToken({ id: effectiveId, email: user.email, role: user.role });
  res.setHeader('Set-Cookie', `speakwise_token=${accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);

  return res.status(200).json({
    success: true,
    data: { user, accessToken },
  });
}

// Email Login Handler
async function handleLogin(req, res) {
  const { email } = req.body || {};
  const normalizedEmail = (email || '').toLowerCase().trim();
  if (!normalizedEmail) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  let dbUser = null;
  try {
    const db = await connectDB();
    if (db && UserModel) {
      dbUser = await UserModel.findOne({ email: normalizedEmail });
    }
  } catch (dbErr) {
    console.warn('[VERCEL AUTH] MongoDB lookup fallback for Login:', dbErr.message);
  }

  const fallbackId = 'usr_' + Buffer.from(normalizedEmail).toString('hex').slice(0, 16);
  const normalizedName = normalizedEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const effectiveId = dbUser ? dbUser._id.toString() : fallbackId;

  const user = {
    id: effectiveId,
    _id: effectiveId,
    email: dbUser ? dbUser.email : normalizedEmail,
    fullName: dbUser ? dbUser.fullName : normalizedName,
    avatarUrl: dbUser ? dbUser.avatarUrl : DEFAULT_AVATAR,
    role: dbUser ? dbUser.role : 'PRO_USER',
    authProvider: dbUser ? dbUser.authProvider : 'email',
    streakDays: dbUser?.streakDays ?? 7,
    totalPracticeMinutes: dbUser?.totalPracticeMinutes ?? 142,
    averageScore: dbUser?.averageScore ?? 88,
    targetWpm: dbUser?.targetWpm ?? 145,
    exp: dbUser?.exp ?? 1850,
    level: dbUser?.level ?? 4,
    createdAt: dbUser?.createdAt ? new Date(dbUser.createdAt).toISOString() : new Date().toISOString(),
  };

  const accessToken = generateToken({ id: effectiveId, email: user.email, role: user.role });
  res.setHeader('Set-Cookie', `speakwise_token=${accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);

  return res.status(200).json({
    success: true,
    data: { user, accessToken },
  });
}

// Registration Handler
async function handleRegister(req, res) {
  const { fullName, email } = req.body || {};
  const normalizedEmail = (email || '').toLowerCase().trim();
  if (!normalizedEmail) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  const normalizedName = fullName || normalizedEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const fallbackId = 'usr_' + Buffer.from(normalizedEmail).toString('hex').slice(0, 16);

  let dbUser = null;
  try {
    const db = await connectDB();
    if (db && UserModel) {
      const existing = await UserModel.findOne({ email: normalizedEmail });
      if (existing) {
        dbUser = existing;
      } else {
        dbUser = await UserModel.create({
          fullName: normalizedName,
          email: normalizedEmail,
          passwordHash: 'EMAIL_PASSWORD_HASH',
          role: 'PRO_USER',
          authProvider: 'email',
          avatarUrl: DEFAULT_AVATAR,
          streakDays: 1,
          totalPracticeMinutes: 0,
          averageScore: 85,
          targetWpm: 145,
          exp: 250,
          level: 1,
        });
      }
    }
  } catch (dbErr) {
    console.warn('[VERCEL AUTH] MongoDB creation fallback for Register:', dbErr.message);
  }

  const effectiveId = dbUser ? dbUser._id.toString() : fallbackId;
  const user = {
    id: effectiveId,
    _id: effectiveId,
    email: dbUser ? dbUser.email : normalizedEmail,
    fullName: dbUser ? dbUser.fullName : normalizedName,
    avatarUrl: dbUser ? dbUser.avatarUrl : DEFAULT_AVATAR,
    role: dbUser ? dbUser.role : 'PRO_USER',
    authProvider: 'email',
    streakDays: dbUser?.streakDays ?? 1,
    totalPracticeMinutes: dbUser?.totalPracticeMinutes ?? 0,
    averageScore: dbUser?.averageScore ?? 85,
    targetWpm: dbUser?.targetWpm ?? 145,
    exp: dbUser?.exp ?? 250,
    level: dbUser?.level ?? 1,
    createdAt: dbUser?.createdAt ? new Date(dbUser.createdAt).toISOString() : new Date().toISOString(),
  };

  const accessToken = generateToken({ id: effectiveId, email: user.email, role: user.role });
  res.setHeader('Set-Cookie', `speakwise_token=${accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);

  return res.status(201).json({
    success: true,
    data: { user, accessToken },
  });
}

// User Profile Handler
async function handleGetMe(req, res) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  let payload = null;
  if (token) {
    payload = verifyToken(token);
  }

  const email = payload?.email || 'speaker@speakwise.ai';
  const userId = payload?.id || 'usr_default';

  let dbUser = null;
  try {
    const db = await connectDB();
    if (db && UserModel) {
      if (userId && !userId.startsWith('usr_')) {
        dbUser = await UserModel.findById(userId);
      }
      if (!dbUser && email) {
        dbUser = await UserModel.findOne({ email: email.toLowerCase() });
      }
    }
  } catch (dbErr) {
    console.warn('[VERCEL AUTH] MongoDB lookup fallback for GetMe:', dbErr.message);
  }

  const fullName = dbUser ? dbUser.fullName : email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return res.status(200).json({
    success: true,
    data: {
      id: dbUser ? dbUser._id.toString() : userId,
      _id: dbUser ? dbUser._id.toString() : userId,
      email: dbUser ? dbUser.email : email,
      fullName,
      role: dbUser ? dbUser.role : (payload?.role || 'PRO_USER'),
      avatarUrl: dbUser ? dbUser.avatarUrl : DEFAULT_AVATAR,
      authProvider: dbUser ? dbUser.authProvider : 'email',
      streakDays: dbUser?.streakDays ?? 7,
      totalPracticeMinutes: dbUser?.totalPracticeMinutes ?? 142,
      averageScore: dbUser?.averageScore ?? 88,
      targetWpm: dbUser?.targetWpm ?? 145,
      createdAt: dbUser?.createdAt ? new Date(dbUser.createdAt).toISOString() : new Date().toISOString(),
    },
  });
}

// Razorpay Create Order Handler
async function handleCreateOrder(req, res) {
  const { planId = '1_MONTH', currency = 'INR', receipt, amount } = req.body || {};

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

// Razorpay Verify Payment Handler
async function handleVerifyPayment(req, res) {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    planId = '1_MONTH',
    currentExpiresAt,
  } = req.body || {};

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

// Usage Status Handler
function handleUsageStatus(req, res) {
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

// Usage Consume Handler
function handleUsageConsume(req, res) {
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

// ==============================================================================
// 5. Express Application Initialization & Route Mounting
// ==============================================================================
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 1. Authentication Routes
app.post(['/api/v1/auth/google', '/api/auth/google', '/auth/google'], handleGoogleLogin);
app.post(['/api/v1/auth/login', '/api/auth/login', '/auth/login'], handleLogin);
app.post(['/api/v1/auth/register', '/api/auth/register', '/auth/register'], handleRegister);
app.get(['/api/v1/auth/me', '/api/auth/me', '/auth/me'], handleGetMe);

// 2. Razorpay Payment Routes
app.post(
  [
    '/api/v1/create-order',
    '/api/create-order',
    '/create-order',
    '/api/v1/subscription/create-order',
    '/api/subscription/create-order',
    '/subscription/create-order',
  ],
  handleCreateOrder
);

app.post(
  [
    '/api/v1/verify-payment',
    '/api/verify-payment',
    '/verify-payment',
    '/api/v1/subscription/verify-payment',
    '/api/subscription/verify-payment',
    '/subscription/verify-payment',
  ],
  handleVerifyPayment
);

// 3. Usage & Trial Limit Routes
app.get(['/api/v1/usage/status', '/api/usage/status', '/usage/status'], handleUsageStatus);
app.post(['/api/v1/usage/consume', '/api/usage/consume', '/usage/consume'], handleUsageConsume);

// 4. Content Generator Routes
app.get(['/api/v1/content/random', '/api/content/random', '/content/random'], (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      id: 'top_' + Date.now(),
      title: 'Navigating Pitch Deck Objections in High-Stakes Fundraising',
      category: 'Business',
      difficulty: 'Advanced',
      type: 'TOPIC',
      meaning: 'Mastering investor questions with clear unit economics.',
      contentOverview: 'Focus on strategic pauses, vocal variety, and structured arguments.',
      hint: 'Articulate unit economics and CAC payback period clearly.',
      suggestedDurationSeconds: 150,
    },
  });
});

app.get(['/api/v1/content/categories', '/api/content/categories', '/content/categories'], (req, res) => {
  return res.status(200).json({
    success: true,
    data: ['Leadership', 'Business', 'Tech', 'Interviews', 'Public Speaking', 'Impromptu'],
  });
});

// 5. System Health Check Routes
app.get(
  ['/api/v1/health', '/api/health', '/health', '/api', '/api/v1', '/'],
  (req, res) => {
    return res.status(200).json({
      status: 'UP',
      service: 'SpeakWise AI Vercel Serverless API',
      timestamp: new Date().toISOString(),
    });
  }
);

// 6. Catch-all 404 Handler
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    error: `Endpoint '${req.originalUrl || req.url}' not found on Vercel Serverless API.`,
  });
});

module.exports = app;
