// Vercel Serverless Function entry point wrapping the existing Express application
let appPromise = null;

async function getExpressApp() {
  if (!appPromise) {
    process.env.VERCEL = '1';
    appPromise = (async () => {
      try {
        const mod = await import('../server/dist/app.js');
        return mod.default || mod;
      } catch (err) {
        console.error('[VERCEL SERVERLESS] Error importing server/dist/app.js:', err);
        return null;
      }
    })();
  }
  return appPromise;
}

// Fallback handlers for extreme resiliency
const { handleCreateOrder, handleVerifyPayment, handleUsageStatus, handleUsageConsume, setCorsHeaders } = require('./_razorpay');
const { handleGoogleLogin, handleLogin, handleRegister, handleGetMe } = require('./_auth');

module.exports = async (req, res) => {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Restore the original incoming request URL if Vercel's rewrite modified it
  const matchedPath = req.headers['x-matched-path'] || req.headers['x-invoke-path'];
  if (matchedPath && (matchedPath.startsWith('/api') || matchedPath.startsWith('/health'))) {
    const urlObj = new URL(req.url, 'http://localhost');
    req.url = matchedPath + (urlObj.search || '');
  }

  // 1. Primary: Forward directly to your existing Express app instance
  try {
    const expressApp = await getExpressApp();
    if (expressApp && typeof expressApp === 'function') {
      return expressApp(req, res);
    }
  } catch (expressErr) {
    console.warn('[VERCEL SERVERLESS] Express app dispatch error, engaging fallback handler:', expressErr.message);
  }

  // 2. Fallback: Self-contained routes in case database or server build is unreachable
  const host = req.headers.host || 'localhost';
  const url = new URL(req.url, `http://${host}`);
  const pathname = url.pathname.toLowerCase().replace(/\/$/, '');

  if (pathname.endsWith('auth/google')) return handleGoogleLogin(req, res);
  if (pathname.endsWith('auth/login')) return handleLogin(req, res);
  if (pathname.endsWith('auth/register')) return handleRegister(req, res);
  if (pathname.endsWith('auth/me')) return handleGetMe(req, res);
  if (pathname.endsWith('create-order')) return handleCreateOrder(req, res);
  if (pathname.endsWith('verify-payment')) return handleVerifyPayment(req, res);
  if (pathname.endsWith('usage/status')) return handleUsageStatus(req, res);
  if (pathname.endsWith('usage/consume')) return handleUsageConsume(req, res);

  if (pathname === '/api/health' || pathname === '/api/v1/health' || pathname === '/health' || pathname === '/api') {
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
