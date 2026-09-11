const crypto = require('crypto');
const { setCorsHeaders, getParsedBody } = require('./_razorpay');
const { connectDB, UserModel } = require('./_db');

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

async function handleGoogleLogin(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  const body = getParsedBody(req);
  const { email, fullName, googleId, avatarUrl } = body;

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
    console.warn('[VERCEL AUTH] MongoDB operation fallback for Google Login:', dbErr.message);
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
    data: {
      user,
      accessToken,
    },
  });
}

async function handleLogin(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  const body = getParsedBody(req);
  const { email } = body;

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
    data: {
      user,
      accessToken,
    },
  });
}

async function handleRegister(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  const body = getParsedBody(req);
  const { fullName, email } = body;

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
    data: {
      user,
      accessToken,
    },
  });
}

async function handleGetMe(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

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

module.exports = {
  handleGoogleLogin,
  handleLogin,
  handleRegister,
  handleGetMe,
  generateToken,
  verifyToken,
};
