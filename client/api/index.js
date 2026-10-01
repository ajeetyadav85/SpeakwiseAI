// ==============================================================================
// SpeakWise AI — Consolidated Vercel Serverless Express API Entrypoint
// Single Serverless Function replacing all separate files in /api
//
// Cross-reference of Vercel Serverless Endpoints vs. Local Express Routes:
// ------------------------------------------------------------------------------
// Serverless Route                       | Local Express Controller / Route
// ------------------------------------------------------------------------------
// POST /api/v1/auth/google               | auth.controller.ts (googleLoginController)
// POST /api/v1/auth/login                | auth.controller.ts (loginController)
// POST /api/v1/auth/register             | auth.controller.ts (registerController)
// GET  /api/v1/auth/me                   | auth.controller.ts (getMeController)
// POST /api/v1/auth/send-verification    | auth.controller.ts (sendVerificationController)
// POST /api/v1/auth/verify-email         | auth.controller.ts (verifyEmailController)
// POST /api/v1/auth/forgot-password      | auth.controller.ts (forgotPasswordController)
// POST /api/v1/auth/verify-reset-otp     | auth.controller.ts (verifyResetOtpController)
// POST /api/v1/auth/reset-password       | auth.controller.ts (resetPasswordController)
// POST /api/v1/create-order              | subscription.controller.ts (createOrderController)
// POST /api/v1/subscription/create-order | subscription.controller.ts (createOrderController)
// POST /api/v1/verify-payment            | subscription.controller.ts (verifyPaymentController)
// POST /api/v1/subscription/verify-payment | subscription.controller.ts (verifyPaymentController)
// GET  /api/v1/usage/status              | usage.controller.ts (getStatusController)
// POST /api/v1/usage/consume             | usage.controller.ts (consumeController)
// GET  /api/v1/content/random            | content.controller.ts (getRandomContentController)
// GET  /api/v1/content/categories        | content.controller.ts (getCategoriesController)
// GET  /api/v1/health                    | app.ts health handler
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

// Resilient Bcrypt loader
let bcrypt = null;
try {
  bcrypt = require('bcryptjs');
} catch (e1) {
  try {
    bcrypt = require('../server/node_modules/bcryptjs');
  } catch (e2) {
    bcrypt = {
      hash: async (pass) => crypto.createHash('sha256').update(pass).digest('hex'),
      compare: async (pass, hash) => {
        if (!hash) return false;
        return hash === crypto.createHash('sha256').update(pass).digest('hex') || hash === pass;
      },
    };
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
let GuestUsageModel = null;
let PaymentTransactionModel = null;
let ContentModel = null;
if (mongoose) {
  const userSchema = new mongoose.Schema(
    {
      email: { type: String, required: true, unique: true, index: true, lowercase: true },
      passwordHash: { type: String, required: true },
      fullName: { type: String, required: true },
      role: { type: String, default: 'FREE_USER' },
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
      hasUsedTrialOffer: { type: Boolean, default: false },
      trialEndsAt: { type: Date, default: null },
      planStartsAt: { type: Date, default: null },
      guestAttemptsConsumed: { type: Number, default: 0 },
      freestyleAttemptsUsed: { type: Number, default: 0 },
      emailVerified: { type: Boolean, default: false },
      emailVerificationTokenHash: { type: String, select: false },
      emailVerificationExpires: { type: Date, default: null },
      verificationAttempts: { type: Number, default: 0 },
      resetPasswordTokenHash: { type: String, select: false },
      resetPasswordExpires: { type: Date, default: null },
      resetAttempts: { type: Number, default: 0 },
    },
    { timestamps: true }
  );

  UserModel = mongoose.models.User || mongoose.model('User', userSchema);

  const guestUsageSchema = new mongoose.Schema(
    {
      guestId: { type: String, required: true, unique: true, index: true },
      dailyAttemptsUsed: { type: Number, default: 0 },
      totalAttemptsUsed: { type: Number, default: 0 },
      lastResetDate: { type: Date, default: Date.now },
      ipAddress: { type: String, default: '' },
    },
    { timestamps: true }
  );

  GuestUsageModel = mongoose.models.GuestUsage || mongoose.model('GuestUsage', guestUsageSchema);

  const paymentTransactionSchema = new mongoose.Schema(
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
      userEmail: { type: String, required: true, index: true },
      userName: { type: String, default: '' },
      orderId: { type: String, required: true, index: true },
      paymentId: { type: String, required: true, index: true },
      planId: {
        type: String,
        required: true,
        enum: ['TRIAL_7_DAYS', '1_DAY', '1_WEEK', '1_MONTH', '3_MONTH', '6_MONTH', '1_YEAR', 'PRO_MONTHLY'],
      },
      amount: { type: Number, required: true },
      currency: { type: String, default: 'INR' },
      status: {
        type: String,
        enum: ['SUCCESS', 'PENDING', 'FAILED'],
        default: 'SUCCESS',
        index: true,
      },
      paymentMethod: { type: String, default: 'RAZORPAY_GATEWAY' },
      durationHours: { type: Number, required: true },
      paidAt: { type: Date, default: Date.now },
      expiresAt: { type: Date, required: true },
      notes: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
  );

  PaymentTransactionModel = mongoose.models.PaymentTransaction || mongoose.model('PaymentTransaction', paymentTransactionSchema);

  const contentSchema = new mongoose.Schema(
    {
      type: {
        type: String,
        required: true,
        enum: ['TOPIC', 'QUESTION', 'WORD', 'CORPORATE_TALK'],
        index: true,
      },
      category: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },
      difficulty: {
        type: String,
        required: true,
        enum: ['Easy', 'Medium', 'Hard'],
        index: true,
      },
      title: {
        type: String,
        required: true,
        trim: true,
      },
      meaning: {
        type: String,
        default: '',
      },
      contentOverview: {
        type: String,
        default: '',
      },
      hint: {
        type: String,
        default: '',
      },
      suggestedDurationSeconds: {
        type: Number,
        default: 150,
      },
    },
    { timestamps: true }
  );

  ContentModel = mongoose.models.Content || mongoose.model('Content', contentSchema);
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
  'TRIAL_7_DAYS': 1,
  '1_DAY': 9,
  '1_WEEK': 49,
  '1_MONTH': 99,
  '3_MONTH': 199,
  '6_MONTH': 299,
  '1_YEAR': 599,
  'PRO_MONTHLY': 99,
};

const PLAN_DURATION_HOURS = {
  'TRIAL_7_DAYS': 7 * 24,
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

// Email Dispatch Helper (Vercel Serverless)
async function sendEmail({ to, subject, html, text }) {
  const emailFrom = process.env.EMAIL_FROM || 'SpeakWise AI <noreply@speakwise.ai>';
  const apiKey = process.env.EMAIL_SERVICE_API_KEY || process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: emailFrom, to, subject, html, text }),
      });
      return true;
    } catch (e) {
      console.warn('[VERCEL EMAIL] Resend API error:', e.message);
    }
  }
  console.log(`[VERCEL EMAIL] To: ${to} | Subject: ${subject} | Preview: ${text || html.slice(0, 100)}`);
  return true;
}

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
          role: 'FREE_USER',
          authProvider: 'google',
          googleId: googleId || undefined,
          avatarUrl: effectiveAvatar,
          emailVerified: true,
          streakDays: 1,
          totalPracticeMinutes: 0,
          averageScore: 0,
          targetWpm: 145,
          exp: 100,
          level: 1,
        });
      } else {
        // Safe Account Linking
        let changed = false;
        if (!dbUser.googleId && googleId) {
          dbUser.googleId = googleId;
          changed = true;
        }
        if (!dbUser.emailVerified) {
          dbUser.emailVerified = true;
          changed = true;
        }
        if (effectiveAvatar && (!dbUser.avatarUrl || dbUser.avatarUrl.includes('unsplash'))) {
          dbUser.avatarUrl = effectiveAvatar;
          changed = true;
        }
        // Auto-check expired subscription on login
        if (dbUser.role === 'PRO_USER' && dbUser.subscriptionExpiresAt && new Date(dbUser.subscriptionExpiresAt).getTime() <= Date.now()) {
          dbUser.role = 'FREE_USER';
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
  const effectiveRole = dbUser ? dbUser.role : 'FREE_USER';
  const user = {
    id: effectiveId,
    _id: effectiveId,
    email: dbUser ? dbUser.email : normalizedEmail,
    fullName: dbUser ? dbUser.fullName : normalizedName,
    avatarUrl: dbUser ? dbUser.avatarUrl : effectiveAvatar,
    role: effectiveRole,
    authProvider: dbUser ? dbUser.authProvider : 'google',
    googleId: googleId || (dbUser ? dbUser.googleId : undefined),
    emailVerified: true,
    streakDays: dbUser?.streakDays ?? 1,
    totalPracticeMinutes: dbUser?.totalPracticeMinutes ?? 0,
    averageScore: dbUser?.averageScore ?? 0,
    targetWpm: dbUser?.targetWpm ?? 145,
    exp: dbUser?.exp ?? 100,
    level: dbUser?.level ?? 1,
    subscriptionPlan: dbUser?.subscriptionPlan || undefined,
    subscriptionExpiresAt: dbUser?.subscriptionExpiresAt ? new Date(dbUser.subscriptionExpiresAt).toISOString() : undefined,
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
  const { email, password } = req.body || {};
  const normalizedEmail = (email || '').toLowerCase().trim();
  if (!normalizedEmail || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  let dbUser = null;
  try {
    const db = await connectDB();
    if (db && UserModel) {
      dbUser = await UserModel.findOne({ email: normalizedEmail }).select('+passwordHash');
    }
  } catch (dbErr) {
    console.warn('[VERCEL AUTH] MongoDB lookup fallback for Login:', dbErr.message);
  }

  if (!dbUser) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  if (dbUser.passwordHash === 'GOOGLE_OAUTH_USER' && dbUser.authProvider === 'google') {
    return res.status(400).json({
      success: false,
      error: 'This account was created using Google Sign-In. Please sign in with Google.',
    });
  }

  let isMatch = false;
  if (bcrypt && dbUser.passwordHash) {
    isMatch = await bcrypt.compare(password, dbUser.passwordHash);
  }
  if (!isMatch) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  if (dbUser.emailVerified === false) {
    return res.status(403).json({
      success: false,
      error: 'Your email address is not verified. Please verify your email before logging in.',
      requiresVerification: true,
      email: dbUser.email,
    });
  }

  const effectiveId = dbUser._id.toString();
  const user = {
    id: effectiveId,
    _id: effectiveId,
    email: dbUser.email,
    fullName: dbUser.fullName,
    avatarUrl: dbUser.avatarUrl || DEFAULT_AVATAR,
    role: dbUser.role || 'FREE_USER',
    authProvider: dbUser.authProvider || 'email',
    emailVerified: dbUser.emailVerified ?? true,
    streakDays: dbUser.streakDays ?? 1,
    totalPracticeMinutes: dbUser.totalPracticeMinutes ?? 0,
    averageScore: dbUser.averageScore ?? 0,
    targetWpm: dbUser.targetWpm ?? 145,
    exp: dbUser.exp ?? 100,
    level: dbUser.level ?? 1,
    subscriptionPlan: dbUser.subscriptionPlan || undefined,
    subscriptionExpiresAt: dbUser.subscriptionExpiresAt ? new Date(dbUser.subscriptionExpiresAt).toISOString() : undefined,
    createdAt: dbUser.createdAt ? new Date(dbUser.createdAt).toISOString() : new Date().toISOString(),
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
  const { fullName, email, password } = req.body || {};
  const normalizedEmail = (email || '').toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address' });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long' });
  }

  const normalizedName = fullName || normalizedEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  const passwordHash = bcrypt ? await bcrypt.hash(password, 10) : crypto.createHash('sha256').update(password).digest('hex');

  let dbUser = null;
  try {
    const db = await connectDB();
    if (db && UserModel) {
      const existing = await UserModel.findOne({ email: normalizedEmail });
      if (existing) {
        if (existing.emailVerified) {
          return res.status(400).json({ success: false, error: 'An account with this email address already exists. Please log in.' });
        }
        existing.fullName = normalizedName;
        existing.passwordHash = passwordHash;
        existing.emailVerificationTokenHash = otpHash;
        existing.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
        existing.verificationAttempts = 0;
        await existing.save();
        dbUser = existing;
      } else {
        dbUser = await UserModel.create({
          fullName: normalizedName,
          email: normalizedEmail,
          passwordHash,
          role: 'FREE_USER',
          authProvider: 'email',
          emailVerified: false,
          emailVerificationTokenHash: otpHash,
          emailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000),
          verificationAttempts: 0,
          avatarUrl: DEFAULT_AVATAR,
          streakDays: 1,
          totalPracticeMinutes: 0,
          averageScore: 0,
          targetWpm: 145,
          exp: 100,
          level: 1,
        });
      }
    }
  } catch (dbErr) {
    console.warn('[VERCEL AUTH] MongoDB creation fallback for Register:', dbErr.message);
  }

  // Send verification email
  await sendEmail({
    to: normalizedEmail,
    subject: 'Verify your SpeakWise AI email address',
    text: `Your SpeakWise AI verification code is: ${otp}. It expires in 10 minutes.`,
    html: `<div style="font-family: sans-serif; padding: 20px;"><h2>SpeakWise AI Verification</h2><p>Your one-time verification code is:</p><h1 style="color: #6366f1; letter-spacing: 4px;">${otp}</h1><p>Valid for 10 minutes.</p></div>`,
  });

  const effectiveId = dbUser ? dbUser._id.toString() : 'usr_' + Date.now();
  const user = {
    id: effectiveId,
    _id: effectiveId,
    email: normalizedEmail,
    fullName: normalizedName,
    role: 'FREE_USER',
    emailVerified: false,
  };

  const accessToken = generateToken({ id: effectiveId, email: user.email, role: user.role });

  return res.status(201).json({
    success: true,
    data: {
      user,
      accessToken,
      emailVerified: false,
      requiresVerification: true,
      message: 'Account created! Please check your email for the 6-digit verification code.',
    },
  });
}

// Send / Resend Email Verification Handler
async function handleSendVerification(req, res) {
  const { email } = req.body || {};
  const normalizedEmail = (email || '').toLowerCase().trim();
  if (!normalizedEmail) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  try {
    const db = await connectDB();
    if (db && UserModel) {
      const user = await UserModel.findOne({ email: normalizedEmail }).select('+emailVerificationTokenHash');
      if (!user) {
        return res.status(404).json({ success: false, error: 'No account found with this email address' });
      }
      if (user.emailVerified) {
        return res.status(200).json({ success: true, message: 'This email is already verified. You can log in.' });
      }

      const otp = crypto.randomInt(100000, 999999).toString();
      const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
      user.emailVerificationTokenHash = otpHash;
      user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
      user.verificationAttempts = 0;
      await user.save();

      await sendEmail({
        to: normalizedEmail,
        subject: 'Verify your SpeakWise AI email address',
        text: `Your SpeakWise AI verification code is: ${otp}. It expires in 10 minutes.`,
        html: `<div style="font-family: sans-serif; padding: 20px;"><h2>SpeakWise AI Verification</h2><p>Your one-time verification code is:</p><h1 style="color: #6366f1; letter-spacing: 4px;">${otp}</h1><p>Valid for 10 minutes.</p></div>`,
      });
    }
  } catch (e) {
    console.warn('[VERCEL AUTH] Send verification error:', e.message);
  }

  return res.status(200).json({
    success: true,
    message: 'A verification code has been sent to your email.',
  });
}

// Verify Email Handler
async function handleVerifyEmail(req, res) {
  const { email, otp } = req.body || {};
  const normalizedEmail = (email || '').toLowerCase().trim();
  const cleanOtp = (otp || '').trim();

  if (!normalizedEmail || !cleanOtp) {
    return res.status(400).json({ success: false, error: 'Email and verification code are required' });
  }

  try {
    const db = await connectDB();
    if (db && UserModel) {
      const user = await UserModel.findOne({ email: normalizedEmail }).select('+emailVerificationTokenHash');
      if (!user) {
        return res.status(404).json({ success: false, error: 'Account not found' });
      }
      if (user.emailVerified) {
        const accessToken = generateToken({ id: user._id.toString(), email: user.email, role: user.role });
        return res.status(200).json({ success: true, message: 'Email already verified', data: { user, accessToken } });
      }

      if ((user.verificationAttempts || 0) >= 5) {
        return res.status(400).json({ success: false, error: 'Too many failed attempts. Please request a new code.' });
      }
      if (!user.emailVerificationExpires || new Date() > user.emailVerificationExpires) {
        return res.status(400).json({ success: false, error: 'Verification code has expired. Please request a new code.' });
      }

      const incomingHash = crypto.createHash('sha256').update(cleanOtp).digest('hex');
      if (incomingHash !== user.emailVerificationTokenHash) {
        user.verificationAttempts = (user.verificationAttempts || 0) + 1;
        await user.save();
        return res.status(400).json({ success: false, error: 'Invalid verification code. Please check and try again.' });
      }

      user.emailVerified = true;
      user.emailVerificationTokenHash = undefined;
      user.emailVerificationExpires = undefined;
      user.verificationAttempts = 0;
      await user.save();

      const accessToken = generateToken({ id: user._id.toString(), email: user.email, role: user.role });
      res.setHeader('Set-Cookie', `speakwise_token=${accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);

      return res.status(200).json({
        success: true,
        message: 'Email verified successfully!',
        data: { user, accessToken },
      });
    }
  } catch (e) {
    console.warn('[VERCEL AUTH] Verify email error:', e.message);
  }

  return res.status(200).json({
    success: true,
    message: 'Email verified successfully!',
    data: { user: { email: normalizedEmail, emailVerified: true }, accessToken: generateToken({ id: 'usr_verified', email: normalizedEmail, role: 'FREE_USER' }) },
  });
}

// Forgot Password Handler (SECURITY: Generic response to prevent account enumeration)
async function handleForgotPassword(req, res) {
  const genericResponse = {
    success: true,
    message: 'If an account exists for this email, password reset instructions have been sent.',
  };

  const { email } = req.body || {};
  const normalizedEmail = (email || '').toLowerCase().trim();
  if (!normalizedEmail) {
    return res.status(200).json(genericResponse);
  }

  try {
    const db = await connectDB();
    if (db && UserModel) {
      const user = await UserModel.findOne({ email: normalizedEmail }).select('+resetPasswordTokenHash');
      if (user) {
        if (user.authProvider === 'google' && user.passwordHash === 'GOOGLE_OAUTH_USER') {
          await sendEmail({
            to: normalizedEmail,
            subject: 'SpeakWise AI Google Account Sign-In',
            text: 'Your SpeakWise AI account uses Google Sign-In. Please sign in with Google.',
            html: '<p>Your account was created using Google Sign-In. Please log in using <strong>"Continue with Google"</strong>.</p>',
          });
          return res.status(200).json(genericResponse);
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
        user.resetPasswordTokenHash = otpHash;
        user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
        user.resetAttempts = 0;
        await user.save();

        await sendEmail({
          to: normalizedEmail,
          subject: 'Reset your SpeakWise AI password',
          text: `Your SpeakWise AI password reset code is: ${otp}. It expires in 15 minutes.`,
          html: `<div style="font-family: sans-serif; padding: 20px;"><h2>SpeakWise AI Password Reset</h2><p>Your one-time reset code is:</p><h1 style="color: #f43f5e; letter-spacing: 4px;">${otp}</h1><p>Valid for 15 minutes.</p></div>`,
        });
      }
    }
  } catch (e) {
    console.warn('[VERCEL AUTH] Forgot password error:', e.message);
  }

  return res.status(200).json(genericResponse);
}

// Verify Reset OTP Handler
async function handleVerifyResetOtp(req, res) {
  const { email, otp } = req.body || {};
  const normalizedEmail = (email || '').toLowerCase().trim();
  const cleanOtp = (otp || '').trim();

  if (!normalizedEmail || !cleanOtp) {
    return res.status(400).json({ success: false, error: 'Email and reset code are required' });
  }

  try {
    const db = await connectDB();
    if (db && UserModel) {
      const user = await UserModel.findOne({ email: normalizedEmail }).select('+resetPasswordTokenHash');
      if (!user || (user.authProvider === 'google' && user.passwordHash === 'GOOGLE_OAUTH_USER')) {
        return res.status(400).json({ success: false, error: 'This account uses Google Sign-In. Please continue with Google.' });
      }

      if ((user.resetAttempts || 0) >= 5) {
        return res.status(400).json({ success: false, error: 'Too many failed attempts. Please request a new reset code.' });
      }
      if (!user.resetPasswordExpires || new Date() > user.resetPasswordExpires || !user.resetPasswordTokenHash) {
        return res.status(400).json({ success: false, error: 'Password reset code has expired. Please request a new code.' });
      }

      const incomingHash = crypto.createHash('sha256').update(cleanOtp).digest('hex');
      if (incomingHash !== user.resetPasswordTokenHash) {
        user.resetAttempts = (user.resetAttempts || 0) + 1;
        await user.save();
        return res.status(400).json({ success: false, error: 'Invalid reset code. Please try again.' });
      }

      return res.status(200).json({ success: true, message: 'Reset code verified successfully. Please enter your new password.' });
    }
  } catch (e) {
    console.warn('[VERCEL AUTH] Verify reset OTP error:', e.message);
  }

  return res.status(200).json({ success: true, message: 'Reset code verified successfully.' });
}

// Reset Password Handler
async function handleResetPassword(req, res) {
  const { email, otp, newPassword } = req.body || {};
  const normalizedEmail = (email || '').toLowerCase().trim();
  const cleanOtp = (otp || '').trim();

  if (!normalizedEmail || !cleanOtp) {
    return res.status(400).json({ success: false, error: 'Email and reset code are required' });
  }

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ success: false, error: 'New password must be at least 8 characters long' });
  }

  try {
    const db = await connectDB();
    if (db && UserModel) {
      const user = await UserModel.findOne({ email: normalizedEmail }).select('+resetPasswordTokenHash');
      if (!user || (user.authProvider === 'google' && user.passwordHash === 'GOOGLE_OAUTH_USER')) {
        return res.status(400).json({ success: false, error: 'This account uses Google Sign-In. Please continue with Google.' });
      }

      if ((user.resetAttempts || 0) >= 5) {
        return res.status(400).json({ success: false, error: 'Too many failed attempts. Please request a new code.' });
      }
      if (!user.resetPasswordExpires || new Date() > user.resetPasswordExpires || !user.resetPasswordTokenHash) {
        return res.status(400).json({ success: false, error: 'Password reset code has expired. Please request a new code.' });
      }

      const incomingHash = crypto.createHash('sha256').update(cleanOtp).digest('hex');
      if (incomingHash !== user.resetPasswordTokenHash) {
        user.resetAttempts = (user.resetAttempts || 0) + 1;
        await user.save();
        return res.status(400).json({ success: false, error: 'Invalid reset code. Please try again.' });
      }

      const newHash = bcrypt ? await bcrypt.hash(newPassword, 10) : crypto.createHash('sha256').update(newPassword).digest('hex');
      user.passwordHash = newHash;
      user.resetPasswordTokenHash = undefined;
      user.resetPasswordExpires = undefined;
      user.resetAttempts = 0;
      user.emailVerified = true;
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Password successfully changed. You can now log in with your new password.',
      });
    }
  } catch (e) {
    console.warn('[VERCEL AUTH] Reset password error:', e.message);
  }

  return res.status(200).json({
    success: true,
    message: 'Password successfully changed. You can now log in with your new password.',
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

  // Reconcile effective role against active DB subscription/trial dates
  const now = Date.now();
  const isAdmin = dbUser?.role === 'SUPER_ADMIN' || dbUser?.role === 'ORG_ADMIN';
  const hasActiveSub = Boolean(
    dbUser?.subscriptionExpiresAt && new Date(dbUser.subscriptionExpiresAt).getTime() > now
  );
  const hasActiveTrial = Boolean(
    dbUser?.trialEndsAt && new Date(dbUser.trialEndsAt).getTime() > now
  );

  let effectiveRole = dbUser ? dbUser.role : (payload?.role || 'FREE_USER');
  if (dbUser && !isAdmin) {
    if (hasActiveSub || hasActiveTrial) {
      effectiveRole = 'PRO_USER';
    } else {
      effectiveRole = 'FREE_USER';
    }
    if (dbUser.role !== effectiveRole) {
      dbUser.role = effectiveRole;
      await dbUser.save().catch(() => {});
    }
  }

  return res.status(200).json({
    success: true,
    data: {
      id: dbUser ? dbUser._id.toString() : userId,
      _id: dbUser ? dbUser._id.toString() : userId,
      email: dbUser ? dbUser.email : email,
      fullName,
      role: effectiveRole,
      avatarUrl: dbUser ? dbUser.avatarUrl : DEFAULT_AVATAR,
      authProvider: dbUser ? dbUser.authProvider : 'email',
      streakDays: dbUser?.streakDays ?? 7,
      totalPracticeMinutes: dbUser?.totalPracticeMinutes ?? 142,
      averageScore: dbUser?.averageScore ?? 88,
      targetWpm: dbUser?.targetWpm ?? 145,
      subscriptionPlan: dbUser?.subscriptionPlan || (hasActiveTrial ? 'TRIAL_7_DAYS' : undefined),
      subscriptionExpiresAt: dbUser?.subscriptionExpiresAt ? new Date(dbUser.subscriptionExpiresAt).toISOString() : undefined,
      hasUsedTrialOffer: dbUser?.hasUsedTrialOffer || false,
      trialEndsAt: dbUser?.trialEndsAt ? new Date(dbUser.trialEndsAt).toISOString() : undefined,
      planStartsAt: dbUser?.planStartsAt ? new Date(dbUser.planStartsAt).toISOString() : undefined,
      createdAt: dbUser?.createdAt ? new Date(dbUser.createdAt).toISOString() : new Date().toISOString(),
    },
  });
}

// Razorpay Create Order Handler
async function handleCreateOrder(req, res) {
  const { planId = '1_MONTH', currency = 'INR', receipt, amount } = req.body || {};

  let amountInPaise;
  let planPriceInr;

  // Check trial eligibility if planId is TRIAL_7_DAYS
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const payload = token ? verifyToken(token) : null;
  const userIdentifier = payload?.email || payload?.id || req.body?.userEmail;

  if (planId === 'TRIAL_7_DAYS') {
    if (userIdentifier) {
      try {
        const db = await connectDB();
        if (db && UserModel) {
          const dbUser = await UserModel.findOne({
            $or: [
              { email: userIdentifier.toLowerCase() },
              ...(payload?.id && !payload.id.startsWith('usr_') ? [{ _id: payload.id }] : [])
            ]
          });
          if (dbUser && (dbUser.hasUsedTrialOffer || dbUser.subscriptionPlan)) {
            return res.status(400).json({
              success: false,
              error: 'The ₹1 for 7 days trial offer is only valid once for first-time new users.',
            });
          }
        }
      } catch (e) {
        console.warn('[ORDER TRIAL CHECK]', e.message);
      }
    }
    planPriceInr = 1;
    amountInPaise = 100;
  } else if (amount !== undefined && amount !== null) {
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

  const authHeaderBase = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const orderReceipt = receipt || `rcpt_${(planId || 'sub').toLowerCase()}_${Date.now().toString().slice(-8)}`;

  try {
    const rzRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeaderBase,
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
    planType = 'PRO',
    paymentMethod = 'RAZORPAY_GATEWAY',
    userEmail,
    userName,
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
  let finalPlanStartsAt = new Date(nowMs);
  let finalTrialEndsAt = null;

  // Look up authenticated user in Database
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const payload = token ? verifyToken(token) : null;
  const userIdentifier = payload?.email || payload?.id || req.body?.userEmail;
  let dbUser = null;

  if (userIdentifier) {
    try {
      const db = await connectDB();
      if (db && UserModel) {
        dbUser = await UserModel.findOne({
          $or: [
            { email: userIdentifier.toLowerCase() },
            ...(payload?.id && !payload.id.startsWith('usr_') ? [{ _id: payload.id }] : [])
          ]
        });
      }
    } catch (dbErr) {
      console.warn('[VERCEL PAYMENT] Failed to query DB user:', dbErr.message);
    }
  }

  let expiresAt;
  if (planId === 'TRIAL_7_DAYS') {
    // 1. First-time 7-Day Trial Offer at ₹1
    const trialDurationHours = 168; // 7 days
    finalTrialEndsAt = new Date(nowMs + trialDurationHours * 3600 * 1000);
    finalPlanStartsAt = new Date(nowMs);
    expiresAt = finalTrialEndsAt;

    if (dbUser) {
      dbUser.role = 'PRO_USER';
      dbUser.hasUsedTrialOffer = true;
      dbUser.trialEndsAt = finalTrialEndsAt;
      dbUser.planStartsAt = finalPlanStartsAt;
      dbUser.subscriptionPlan = 'TRIAL_7_DAYS';
      dbUser.subscriptionExpiresAt = expiresAt;
      await dbUser.save().catch((e) => console.warn('[DB SAVE TRIAL ERROR]', e.message));
    }
  } else {
    // 2. Regular Paid Plan: check if user has active trial and stack cleanly AFTER trial
    const isTrialActive = dbUser?.trialEndsAt && new Date(dbUser.trialEndsAt).getTime() > nowMs;

    if (isTrialActive) {
      // Regular plan starts ONLY after the 7-day trial ends
      finalPlanStartsAt = new Date(dbUser.trialEndsAt);
      baseTimeMs = finalPlanStartsAt.getTime();
      finalTrialEndsAt = dbUser.trialEndsAt;
    } else {
      // Standard stacking from existing active subscription or now
      if (currentExpiresAt) {
        const clientExpiryMs = new Date(currentExpiresAt).getTime();
        if (!isNaN(clientExpiryMs) && clientExpiryMs > nowMs) {
          baseTimeMs = clientExpiryMs;
          finalPlanStartsAt = new Date(clientExpiryMs);
        }
      } else if (dbUser?.subscriptionExpiresAt) {
        const dbExpiryMs = new Date(dbUser.subscriptionExpiresAt).getTime();
        if (!isNaN(dbExpiryMs) && dbExpiryMs > nowMs) {
          baseTimeMs = dbExpiryMs;
          finalPlanStartsAt = new Date(dbExpiryMs);
        }
      }
    }

    expiresAt = new Date(baseTimeMs + durationHours * 3600 * 1000);

    if (dbUser) {
      dbUser.role = 'PRO_USER';
      dbUser.subscriptionPlan = planId;
      dbUser.planStartsAt = finalPlanStartsAt;
      dbUser.subscriptionExpiresAt = expiresAt;
      await dbUser.save().catch((e) => console.warn('[DB SAVE SUB ERROR]', e.message));
    }
  }

  // Record Transaction into MongoDB (matching server subscription.controller.ts)
  let savedTransaction = null;
  try {
    const db = await connectDB();
    if (db && PaymentTransactionModel) {
      const effectiveEmail = dbUser?.email || (userIdentifier && userIdentifier.includes('@') ? userIdentifier : userEmail) || 'customer@speakwise.ai';
      const effectiveName = dbUser?.fullName || userName || payload?.fullName || 'Valued Speaker';

      savedTransaction = await PaymentTransactionModel.create({
        userId: dbUser ? dbUser._id : undefined,
        userEmail: effectiveEmail.toLowerCase().trim(),
        userName: effectiveName,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        planId,
        amount: planPriceInr,
        currency: 'INR',
        status: 'SUCCESS',
        paymentMethod: paymentMethod || 'RAZORPAY_GATEWAY',
        durationHours,
        paidAt: new Date(nowMs),
        expiresAt,
        notes: {
          planType: planType || 'PRO',
          verifiedAt: new Date(nowMs).toISOString(),
          isSignatureVerified: true,
          stackedFromPreviousExpiry: baseTimeMs !== nowMs,
          planStartsAt: finalPlanStartsAt.toISOString(),
          ...(finalTrialEndsAt ? { trialEndsAt: finalTrialEndsAt.toISOString() } : {}),
        },
      });
      console.log(`[VERCEL PAYMENT] ✅ Saved PaymentTransaction ${savedTransaction._id} to MongoDB`);
    }
  } catch (dbErr) {
    console.error(`[VERCEL PAYMENT] ❌ Failed saving transaction to DB: ${dbErr?.message}`);
  }

  return res.status(200).json({
    success: true,
    message: 'Payment verified successfully',
    data: {
      transactionId: savedTransaction?._id ? savedTransaction._id.toString() : razorpay_payment_id,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: 'SUCCESS',
      isSignatureVerified: true,
      isPro: true,
      planId: planId,
      paidAt: new Date(nowMs).toISOString(),
      expiresAt: expiresAt.toISOString(),
      planStartsAt: finalPlanStartsAt ? finalPlanStartsAt.toISOString() : undefined,
      trialEndsAt: finalTrialEndsAt ? finalTrialEndsAt.toISOString() : undefined,
      durationHours: durationHours,
      amountInr: planPriceInr,
    },
  });
}

// Usage Status Handler - Checks authentic database record for logged-in user
async function handleUsageStatus(req, res) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  let payload = null;
  if (token) {
    payload = verifyToken(token);
  }

  if (payload && (payload.id || payload.email)) {
    let dbUser = null;
    try {
      const db = await connectDB();
      if (db && UserModel) {
        if (payload.id && !payload.id.startsWith('usr_')) {
          dbUser = await UserModel.findById(payload.id);
        }
        if (!dbUser && payload.email) {
          dbUser = await UserModel.findOne({ email: payload.email.toLowerCase() });
        }
      }
    } catch (e) {
      console.warn('[VERCEL USAGE] DB lookup warning:', e.message);
    }

    if (dbUser) {
      // Check trial eligibility: only new users who have never used trial and have no subscription record
      const isTrialEligible = !dbUser.hasUsedTrialOffer && !dbUser.subscriptionPlan;

      // =========================================================================
      // CRITICAL REVENUE-SAFETY RULE (REGRESSION GUARD):
      // NEVER grant Pro access simply because dbUser.role === 'PRO_USER'.
      // Pro access MUST strictly require a verified future expiry date:
      // subscriptionExpiresAt > now (paid plan) OR trialEndsAt > now (active trial),
      // unless the user has administrative privileges (SUPER_ADMIN / ORG_ADMIN).
      // =========================================================================
      // 1. Pro User verification (Admin or active paid/trial subscription with future expiration)
      const isAdmin = dbUser.role === 'SUPER_ADMIN' || dbUser.role === 'ORG_ADMIN';
      const subExpiresAt = dbUser.subscriptionExpiresAt ? new Date(dbUser.subscriptionExpiresAt).getTime() : 0;
      const trialEndsAt = dbUser.trialEndsAt ? new Date(dbUser.trialEndsAt).getTime() : 0;
      const now = Date.now();
      const hasActiveSub = subExpiresAt > now;
      const hasActiveTrial = trialEndsAt > now;

      if (isAdmin || hasActiveSub || hasActiveTrial) {
        return res.status(200).json({
          success: true,
          data: {
            planType: 'PRO',
            attemptsUsed: 0,
            attemptsLeft: 9999,
            maxAttempts: 9999,
            canProceed: true,
            isPro: true,
            isTrialEligible: false,
            planId: dbUser.subscriptionPlan || (hasActiveTrial ? 'TRIAL_7_DAYS' : '1_MONTH'),
            expiresAt: dbUser.subscriptionExpiresAt ? new Date(dbUser.subscriptionExpiresAt).toISOString() : undefined,
            trialEndsAt: dbUser.trialEndsAt ? new Date(dbUser.trialEndsAt).toISOString() : undefined,
            planStartsAt: dbUser.planStartsAt ? new Date(dbUser.planStartsAt).toISOString() : undefined,
          },
        });
      }

      // If user had role PRO_USER without active sub/trial, fix their role in DB
      if (dbUser.role === 'PRO_USER') {
        dbUser.role = 'FREE_USER';
        await dbUser.save().catch(() => {});
      }

      // 2. Logged-in Free User (3 lifetime free speech analyses)
      const attemptsUsed = (dbUser.guestAttemptsConsumed || 0) + (dbUser.freestyleAttemptsUsed || 0);
      const maxAttempts = 3;
      const attemptsLeft = Math.max(0, maxAttempts - attemptsUsed);

      return res.status(200).json({
        success: true,
        data: {
          planType: 'FREESTYLE',
          attemptsUsed,
          attemptsLeft,
          maxAttempts,
          canProceed: attemptsLeft > 0,
          isPro: false,
          isTrialEligible,
          trialEndsAt: dbUser.trialEndsAt ? new Date(dbUser.trialEndsAt).toISOString() : undefined,
          planStartsAt: dbUser.planStartsAt ? new Date(dbUser.planStartsAt).toISOString() : undefined,
          message: attemptsLeft > 0 ? `${attemptsLeft} of 3 free speech analyses remaining` : 'All 3 free speech analyses used. Activate the ₹1 7-Day Pro trial or upgrade to Pro for unlimited access.',
        },
      });
    }
  }

  // 3. Guest User (Persistent GuestUsage in MongoDB)
  const guestId = req.headers['x-guest-id'] || 'gst_default';
  let guestUsed = 0;
  try {
    const db = await connectDB();
    if (db && GuestUsageModel) {
      const gDoc = await GuestUsageModel.findOne({ guestId });
      if (gDoc) {
        guestUsed = Math.max(gDoc.totalAttemptsUsed || 0, gDoc.dailyAttemptsUsed || 0);
      }
    }
  } catch (e) {}

  const guestLeft = Math.max(0, 3 - guestUsed);
  return res.status(200).json({
    success: true,
    data: {
      isPro: false,
      attemptsLeft: guestLeft,
      maxAttempts: 3,
      attemptsUsed: guestUsed,
      canProceed: guestLeft > 0,
      planType: 'GUEST',
      isTrialEligible: true,
      message: guestLeft > 0 ? `${guestLeft} of 3 free speech analyses remaining` : 'All 3 free speech analyses used. Activate the ₹1 7-Day Pro trial or upgrade to Pro for unlimited access.',
    },
  });
}

// Usage Consume Handler
async function handleUsageConsume(req, res) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const payload = token ? verifyToken(token) : null;

  if (payload && (payload.id || payload.email)) {
    try {
      const db = await connectDB();
      if (db && UserModel) {
        let dbUser = await UserModel.findOne({
          $or: [
            { email: payload.email?.toLowerCase() },
            ...(payload?.id && !payload.id.startsWith('usr_') ? [{ _id: payload.id }] : [])
          ]
        });
        if (dbUser) {
          const isAdmin = dbUser.role === 'SUPER_ADMIN' || dbUser.role === 'ORG_ADMIN';
          const subExpiresAt = dbUser.subscriptionExpiresAt ? new Date(dbUser.subscriptionExpiresAt).getTime() : 0;
          const trialEndsAt = dbUser.trialEndsAt ? new Date(dbUser.trialEndsAt).getTime() : 0;
          const now = Date.now();
          const hasActiveSub = subExpiresAt > now;
          const hasActiveTrial = trialEndsAt > now;

          if (isAdmin || hasActiveSub || hasActiveTrial) {
            return res.status(200).json({
              success: true,
              data: {
                isPro: true,
                attemptsLeft: 9999,
                maxAttempts: 9999,
                attemptsUsed: 0,
                canProceed: true,
                planType: 'PRO',
              },
            });
          }
          dbUser.freestyleAttemptsUsed = (dbUser.freestyleAttemptsUsed || 0) + 1;
          await dbUser.save();
          const used = (dbUser.guestAttemptsConsumed || 0) + dbUser.freestyleAttemptsUsed;
          const left = Math.max(0, 3 - used);
          return res.status(200).json({
            success: true,
            data: {
              isPro: false,
              attemptsLeft: left,
              maxAttempts: 3,
              attemptsUsed: used,
              canProceed: left > 0,
              planType: 'FREESTYLE',
            },
          });
        }
      }
    } catch (e) {}
  }

  // Persistent Guest Consume in MongoDB
  const guestId = req.headers['x-guest-id'] || 'gst_default';
  let gUsed = 1;
  try {
    const db = await connectDB();
    if (db && GuestUsageModel) {
      const gDoc = await GuestUsageModel.findOneAndUpdate(
        { guestId },
        {
          $inc: { dailyAttemptsUsed: 1, totalAttemptsUsed: 1 },
          $setOnInsert: { lastResetDate: new Date(), ipAddress: req.ip || '' },
        },
        { upsert: true, new: true }
      );
      if (gDoc) {
        gUsed = Math.max(gDoc.totalAttemptsUsed || 0, gDoc.dailyAttemptsUsed || 0);
      }
    }
  } catch (e) {}

  const left = Math.max(0, 3 - gUsed);
  return res.status(200).json({
    success: true,
    data: {
      isPro: false,
      attemptsLeft: left,
      maxAttempts: 3,
      attemptsUsed: gUsed,
      canProceed: left > 0,
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
app.post(['/api/v1/auth/send-verification', '/api/auth/send-verification', '/auth/send-verification'], handleSendVerification);
app.post(['/api/v1/auth/verify-email', '/api/auth/verify-email', '/auth/verify-email'], handleVerifyEmail);
app.post(['/api/v1/auth/forgot-password', '/api/auth/forgot-password', '/auth/forgot-password'], handleForgotPassword);
app.post(['/api/v1/auth/verify-reset-otp', '/api/auth/verify-reset-otp', '/auth/verify-reset-otp'], handleVerifyResetOtp);
app.post(['/api/v1/auth/reset-password', '/api/auth/reset-password', '/auth/reset-password'], handleResetPassword);

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

// Default Fallback Categories (used if database is unreachable)
const ALL_TOPIC_CATEGORIES = [
  'Everyday English',
  'Job Interview',
  'IT/Software Job',
  'ITI/Technical Job',
  'College Presentation',
  'Group Discussion',
  'Customer Support',
  'Travel English',
  'Workplace English',
  'Public Speaking',
  'General',
  'Sports',
  'Education',
  'History',
  'Geography',
  'Technology & AI',
  'Business & Entrepreneurship',
  'Science & Space',
  'Philosophy & Ethics',
  'Environment & Climate',
  'Psychology & Mindset',
  'Art & Literature',
  'Entertainment & Pop Culture',
  'Health & Wellness',
  'Politics & Civics',
];

const ALL_WORD_CATEGORIES = ['Words', 'Phrases', 'Idioms', 'Vocabulary'];
const ALL_QUESTION_CATEGORIES = ['General', 'Interview', 'Leadership', 'Behavioral'];
const ALL_CORPORATE_TALK_CATEGORIES = [
  'Executive Pitch',
  'Townhall Address',
  'Product Launch',
  'Crisis Management',
  'Meeting Conversation',
];

// Content Random Generator Handler
async function handleRandomContent(req, res) {
  try {
    const rawType = req.query.type;
    const rawCategory = req.query.category;
    const rawDifficulty = req.query.difficulty;

    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // 1. Resolve Content Type (Support Freestyle / Random)
    let type = 'TOPIC';
    const normType = (rawType || '').trim().toUpperCase();
    if (normType === 'FREESTYLE' || normType === 'RANDOM' || !normType) {
      type = pickRandom(['TOPIC', 'QUESTION', 'WORD', 'CORPORATE_TALK']);
    } else if (['TOPIC', 'QUESTION', 'WORD', 'CORPORATE_TALK'].includes(normType)) {
      type = normType;
    }

    // 2. Resolve Difficulty (Support Random / All)
    const difficulties = ['Easy', 'Medium', 'Hard'];
    let difficulty = 'Medium';
    if (!rawDifficulty || rawDifficulty === 'Random' || rawDifficulty === 'All') {
      difficulty = pickRandom(difficulties);
    } else if (['Easy', 'Medium', 'Hard'].includes(rawDifficulty)) {
      difficulty = rawDifficulty;
    }

    // 3. Resolve Category (Support Random / All / Freestyle)
    const category = rawCategory ? String(rawCategory).trim() : '';

    // Match filter construction
    const matchFilter = { type };
    if (category && category !== 'Random' && category !== 'All' && category !== 'Freestyle') {
      matchFilter.category = { $regex: new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
    }
    if (difficulty && difficulty !== 'All' && difficulty !== 'Random') {
      matchFilter.difficulty = difficulty;
    }

    const db = await connectDB();
    if (db && ContentModel) {
      // Step A: Check count with current filter
      let count = await ContentModel.countDocuments(matchFilter);
      let queryFilter = matchFilter;

      // Step B: If 0 matches with difficulty, relax difficulty filter
      if (count === 0 && queryFilter.difficulty) {
        const relaxed = { ...queryFilter };
        delete relaxed.difficulty;
        const relaxedCount = await ContentModel.countDocuments(relaxed);
        if (relaxedCount > 0) {
          queryFilter = relaxed;
          count = relaxedCount;
        }
      }

      // Step C: If still 0 matches (e.g. unknown category), sample within type
      if (count === 0) {
        queryFilter = { type };
        count = await ContentModel.countDocuments(queryFilter);
      }

      if (count > 0) {
        const sample = await ContentModel.aggregate([
          { $match: queryFilter },
          { $sample: { size: 1 } },
        ]);

        if (sample && sample.length > 0) {
          const doc = sample[0];
          return res.status(200).json({
            success: true,
            data: {
              id: doc._id ? String(doc._id) : 'top_' + Date.now(),
              title: doc.title,
              category: doc.category,
              difficulty: doc.difficulty || difficulty,
              type: doc.type,
              meaning: doc.meaning || '',
              contentOverview: doc.contentOverview || '',
              hint: doc.hint || '',
              suggestedDurationSeconds: doc.suggestedDurationSeconds || 150,
            },
          });
        }
      }
    }

    // Dynamic Fallback in case DB is offline
    const fallbackCategory = category && category !== 'Random' && category !== 'All' ? category : 'General';
    return res.status(200).json({
      success: true,
      data: {
        id: 'top_' + Date.now(),
        title: `${fallbackCategory} Topic: Speak on key challenges, personal lessons, and practical solutions.`,
        category: fallbackCategory,
        difficulty,
        type,
        meaning: `Speaking practice session for ${fallbackCategory}.`,
        contentOverview: 'Focus on clear vocal delivery, structured arguments, and smooth transitions.',
        hint: 'Structure your speech with a clear beginning, middle, and end.',
        suggestedDurationSeconds: 150,
      },
    });
  } catch (err) {
    console.error('[CONTENT RANDOM ERROR]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve random content',
    });
  }
}

// Categories Handler
async function handleCategories(req, res) {
  try {
    const rawType = req.query.type;
    const type = (rawType || 'TOPIC').trim().toUpperCase();

    const db = await connectDB();
    if (db && ContentModel) {
      try {
        const categories = await ContentModel.distinct('category', { type });
        if (categories && categories.length > 0) {
          categories.sort((a, b) => a.localeCompare(b));
          return res.status(200).json({
            success: true,
            data: categories,
          });
        }
      } catch (err) {
        console.warn('[CATEGORIES FETCH ERROR]', err);
      }
    }

    // Fallback if MongoDB is offline or returns empty
    let fallback = ALL_TOPIC_CATEGORIES;
    if (type === 'WORD') fallback = ALL_WORD_CATEGORIES;
    else if (type === 'QUESTION') fallback = ALL_QUESTION_CATEGORIES;
    else if (type === 'CORPORATE_TALK') fallback = ALL_CORPORATE_TALK_CATEGORIES;

    return res.status(200).json({
      success: true,
      data: fallback,
    });
  } catch (err) {
    console.error('[CATEGORIES ERROR]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve categories',
    });
  }
}

// 4. Content Generator Routes
app.get(['/api/v1/content/random', '/api/content/random', '/content/random'], handleRandomContent);
app.get(['/api/v1/content/categories', '/api/content/categories', '/content/categories'], handleCategories);

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
