// Vercel Serverless Function entry point for SpeakWise AI API
const {
  handleCreateOrder,
  handleVerifyPayment,
  handleUsageStatus,
  handleUsageConsume,
  setCorsHeaders,
} = require('./_razorpay');

const {
  handleGoogleLogin,
  handleLogin,
  handleRegister,
  handleGetMe,
} = require('./_auth');

module.exports = async (req, res) => {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const host = req.headers.host || 'localhost';

  // Extract true request path across Vercel rewrite headers
  let rawPath = req.headers['x-forwarded-uri'] || req.url || '';
  if (
    rawPath.includes('/api/index.js') &&
    req.headers['x-invoke-path'] &&
    !req.headers['x-invoke-path'].includes('index.js')
  ) {
    rawPath = req.headers['x-invoke-path'];
  }

  const parsed = new URL(rawPath, `http://${host}`);
  const pathname = parsed.pathname.toLowerCase().replace(/\/$/, '');

  // 1. Authentication Endpoints
  if (pathname.endsWith('auth/google') || pathname.endsWith('auth/google.js')) {
    return handleGoogleLogin(req, res);
  }
  if (pathname.endsWith('auth/login') || pathname.endsWith('auth/login.js')) {
    return handleLogin(req, res);
  }
  if (pathname.endsWith('auth/register') || pathname.endsWith('auth/register.js')) {
    return handleRegister(req, res);
  }
  if (pathname.endsWith('auth/me') || pathname.endsWith('auth/me.js')) {
    return handleGetMe(req, res);
  }

  // 2. Razorpay Payment Endpoints
  if (pathname.includes('create-order')) {
    return handleCreateOrder(req, res);
  }
  if (pathname.includes('verify-payment')) {
    return handleVerifyPayment(req, res);
  }

  // 3. Usage & Limit Endpoints
  if (pathname.includes('usage/status')) {
    return handleUsageStatus(req, res);
  }
  if (pathname.includes('usage/consume')) {
    return handleUsageConsume(req, res);
  }

  // 4. Content Generator Endpoints
  if (pathname.includes('content/random')) {
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
  }
  if (pathname.includes('content/categories')) {
    return res.status(200).json({
      success: true,
      data: ['Leadership', 'Business', 'Tech', 'Interviews', 'Public Speaking', 'Impromptu'],
    });
  }

  // 5. Health Check Endpoints
  if (
    pathname === '/api/health' ||
    pathname === '/api/v1/health' ||
    pathname === '/health' ||
    pathname === '/api' ||
    pathname === '/api/v1' ||
    pathname === ''
  ) {
    return res.status(200).json({
      status: 'UP',
      service: 'SpeakWise AI Vercel Serverless API',
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(404).json({
    success: false,
    error: `Endpoint '${parsed.pathname}' not found on Vercel Serverless API.`,
  });
};
