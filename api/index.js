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

  // Parse path
  const host = req.headers.host || 'localhost';
  const url = new URL(req.url, `http://${host}`);
  const pathname = url.pathname.toLowerCase().replace(/\/$/, '');

  // If an external backend is configured via environment variable, proxy to it
  const backendUrl = process.env.BACKEND_URL;
  if (backendUrl && !pathname.includes('create-order') && !pathname.includes('verify-payment')) {
    try {
      const targetUrl = `${backendUrl.replace(/\/$/, '')}${url.pathname}${url.search}`;
      const headers = { ...req.headers, host: new URL(backendUrl).host };
      delete headers['content-length'];

      const proxyRes = await fetch(targetUrl, {
        method: req.method,
        headers,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
      });

      res.status(proxyRes.status);
      proxyRes.headers.forEach((val, key) => {
        if (!key.toLowerCase().startsWith('content-encoding')) {
          res.setHeader(key, val);
        }
      });
      const data = await proxyRes.text();
      return res.send(data);
    } catch (proxyErr) {
      console.warn('[VERCEL PROXY] Backend proxy failed:', proxyErr.message);
    }
  }

  // ==========================================
  // Authentication Endpoints
  // ==========================================
  if (pathname.endsWith('auth/google')) {
    return handleGoogleLogin(req, res);
  }

  if (pathname.endsWith('auth/login')) {
    return handleLogin(req, res);
  }

  if (pathname.endsWith('auth/register')) {
    return handleRegister(req, res);
  }

  if (pathname.endsWith('auth/me')) {
    return handleGetMe(req, res);
  }

  // ==========================================
  // Razorpay Order Creation
  // ==========================================
  if (
    pathname.endsWith('create-order') ||
    pathname.endsWith('subscription/create-order') ||
    pathname === '/api/create-order' ||
    pathname === '/api/v1/create-order'
  ) {
    return handleCreateOrder(req, res);
  }

  // ==========================================
  // Razorpay Payment Verification
  // ==========================================
  if (
    pathname.endsWith('verify-payment') ||
    pathname.endsWith('subscription/verify-payment') ||
    pathname === '/api/verify-payment' ||
    pathname === '/api/v1/verify-payment'
  ) {
    return handleVerifyPayment(req, res);
  }

  // ==========================================
  // Usage Status & Limit Endpoints
  // ==========================================
  if (pathname.endsWith('usage/status')) {
    return handleUsageStatus(req, res);
  }

  if (pathname.endsWith('usage/consume')) {
    return handleUsageConsume(req, res);
  }

  // ==========================================
  // Health check
  // ==========================================
  if (pathname === '/api/health' || pathname === '/api/v1/health' || pathname === '/api' || pathname === '') {
    return res.status(200).json({
      status: 'UP',
      service: 'SpeakWise AI Vercel Serverless API',
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(404).json({
    success: false,
    error: `Endpoint '${url.pathname}' not found on Vercel Serverless API.`,
  });
};
