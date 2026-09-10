const crypto = require('crypto');
const { setCorsHeaders, getParsedBody } = require('./_razorpay');

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

  const user = {
    id: userId,
    _id: userId,
    email: normalizedEmail,
    fullName: normalizedName,
    avatarUrl: effectiveAvatar,
    role: 'PRO_USER',
    authProvider: 'google',
    googleId: googleId || undefined,
    streakDays: 7,
    totalPracticeMinutes: 142,
    averageScore: 88,
    targetWpm: 145,
    exp: 1850,
    level: 4,
    createdAt: new Date().toISOString(),
  };

  const accessToken = generateToken({ id: userId, email: normalizedEmail, role: 'PRO_USER' });

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
  const { email, password } = body;

  const normalizedEmail = (email || '').toLowerCase().trim();
  if (!normalizedEmail) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  const userId = 'usr_' + Buffer.from(normalizedEmail).toString('hex').slice(0, 16);
  const normalizedName = normalizedEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const user = {
    id: userId,
    _id: userId,
    email: normalizedEmail,
    fullName: normalizedName,
    avatarUrl: DEFAULT_AVATAR,
    role: 'PRO_USER',
    authProvider: 'email',
    streakDays: 7,
    totalPracticeMinutes: 142,
    averageScore: 88,
    targetWpm: 145,
    exp: 1850,
    level: 4,
    createdAt: new Date().toISOString(),
  };

  const accessToken = generateToken({ id: userId, email: normalizedEmail, role: 'PRO_USER' });

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
  const { fullName, email, password } = body;

  const normalizedEmail = (email || '').toLowerCase().trim();
  if (!normalizedEmail) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  const userId = 'usr_' + Buffer.from(normalizedEmail).toString('hex').slice(0, 16);
  const normalizedName = fullName || normalizedEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const user = {
    id: userId,
    _id: userId,
    email: normalizedEmail,
    fullName: normalizedName,
    avatarUrl: DEFAULT_AVATAR,
    role: 'PRO_USER',
    authProvider: 'email',
    streakDays: 1,
    totalPracticeMinutes: 0,
    averageScore: 85,
    targetWpm: 145,
    exp: 250,
    level: 1,
    createdAt: new Date().toISOString(),
  };

  const accessToken = generateToken({ id: userId, email: normalizedEmail, role: 'PRO_USER' });

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
  const fullName = email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return res.status(200).json({
    success: true,
    data: {
      id: userId,
      _id: userId,
      email,
      fullName,
      role: payload?.role || 'PRO_USER',
      avatarUrl: DEFAULT_AVATAR,
      authProvider: 'email',
      streakDays: 7,
      totalPracticeMinutes: 142,
      averageScore: 88,
      targetWpm: 145,
      createdAt: new Date().toISOString(),
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
