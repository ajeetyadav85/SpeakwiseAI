import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { env } from '../config/env.js';
import { UserModel } from '../models/User.model.js';
import { AuthService } from '../services/auth.service.js';

const API_BASE = `http://localhost:5000/api/v1`;

async function runTokenRefreshRegressionTest() {
  console.log('\n======================================================');
  console.log('🧪 SPEAKWISE AUTH REFRESH & TOKEN EXPIRY REGRESSION TEST');
  console.log('Validating: Expired Token Detection -> Auto-Refresh Flow -> Pro Access Preservation');
  console.log('======================================================\n');

  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected to MongoDB.');

  const testEmail = `token_refresh_test_${Date.now()}@speakwise.ai`;
  const testPassword = 'Password123!';
  let userId = '';

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Register and Login User
    // -------------------------------------------------------------------------
    console.log('\n[STEP 1] Registering and authenticating test user...');
    const authRes = await AuthService.register('Refresh Test Speaker', testEmail, testPassword);
    userId = authRes.user._id.toString();
    const initialAccessToken = authRes.tokens.accessToken;
    let currentRefreshToken = authRes.tokens.refreshToken;

    console.log(`- Created user ID: ${userId} (${testEmail})`);
    console.log(`- Initial Access Token snippet: ${initialAccessToken.slice(0, 20)}...`);
    console.log(`- Initial Refresh Token snippet: ${currentRefreshToken.slice(0, 20)}...`);

    // -------------------------------------------------------------------------
    // STEP 2: Upgrade User to Pro (7-Day Trial)
    // -------------------------------------------------------------------------
    console.log('\n[STEP 2] Activating ₹1 7-Day Pro Trial for user in DB...');
    const trialEndsAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    await UserModel.findByIdAndUpdate(userId, {
      role: 'PRO_USER',
      hasUsedTrialOffer: true,
      trialEndsAt,
      planStartsAt: new Date(),
      subscriptionPlan: 'TRIAL_7_DAYS',
      subscriptionExpiresAt: trialEndsAt,
    });
    console.log(`✅ Trial activated until: ${trialEndsAt.toISOString()}`);

    // -------------------------------------------------------------------------
    // STEP 3: Verify Pro Status with Valid Access Token
    // -------------------------------------------------------------------------
    console.log('\n[STEP 3] Calling /usage/status with valid access token...');
    const validRes = await axios.get(`${API_BASE}/usage/status`, {
      headers: { Authorization: `Bearer ${initialAccessToken}` },
    });
    console.log(`- Response status: ${validRes.status}`);
    console.log(`- isPro: ${validRes.data?.data?.isPro} (Expected: true)`);
    console.log(`- planType: ${validRes.data?.data?.planType} (Expected: PRO)`);

    if (!validRes.data?.data?.isPro || validRes.data?.data?.planType !== 'PRO') {
      throw new Error(`❌ FAILED STEP 3: Expected isPro: true and planType: 'PRO', got: ${JSON.stringify(validRes.data)}`);
    }
    console.log('✅ PASSED STEP 3: Valid access token returns Pro status.');

    // -------------------------------------------------------------------------
    // STEP 4: Test Expired Token Detection in optionalJWT Middleware
    // -------------------------------------------------------------------------
    console.log('\n[STEP 4] Calling /usage/status with an EXPIRED access token...');
    // Create an expired access token (-10s expiry)
    const expiredAccessToken = jwt.sign(
      { id: userId, email: testEmail, role: 'PRO_USER' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '-10s' }
    );

    let expiredTokenRejected = false;
    try {
      await axios.get(`${API_BASE}/usage/status`, {
        headers: { Authorization: `Bearer ${expiredAccessToken}` },
      });
      // If it doesn't throw, it returned 200 (silent fallback to guest bug!)
    } catch (err: any) {
      if (err.response?.status === 401) {
        expiredTokenRejected = true;
        console.log(`- Server returned HTTP 401 as expected!`);
        console.log(`- Response payload:`, err.response?.data);
        if (err.response?.data?.code !== 'TOKEN_EXPIRED') {
          throw new Error(`❌ FAILED STEP 4: Expected code 'TOKEN_EXPIRED', got '${err.response?.data?.code}'`);
        }
      } else {
        throw new Error(`❌ FAILED STEP 4: Expected 401, got ${err.response?.status}`);
      }
    }

    if (!expiredTokenRejected) {
      throw new Error('❌ FAILED STEP 4: optionalJWT silently accepted expired token and fell back to guest instead of returning 401!');
    }
    console.log('✅ PASSED STEP 4: optionalJWT correctly rejected expired token with HTTP 401 (code: TOKEN_EXPIRED).');

    // -------------------------------------------------------------------------
    // STEP 5: Test /auth/refresh Endpoint
    // -------------------------------------------------------------------------
    console.log('\n[STEP 5] Calling POST /auth/refresh to renew access token...');
    const refreshRes = await axios.post(`${API_BASE}/auth/refresh`, {
      refreshToken: currentRefreshToken,
    });
    console.log(`- Refresh response status: ${refreshRes.status}`);
    const newAccessToken = refreshRes.data?.data?.accessToken;
    const newRefreshToken = refreshRes.data?.data?.refreshToken;

    if (!newAccessToken || !newRefreshToken) {
      throw new Error(`❌ FAILED STEP 5: /auth/refresh did not return new tokens: ${JSON.stringify(refreshRes.data)}`);
    }
    console.log(`- New Access Token: ${newAccessToken.slice(0, 20)}...`);
    console.log(`- Rotated Refresh Token: ${newRefreshToken.slice(0, 20)}...`);

    // Verify the new access token is valid
    const decodedNew: any = jwt.verify(newAccessToken, env.JWT_ACCESS_SECRET);
    console.log(`- Verified new token for: ${decodedNew.email} (${decodedNew.id})`);
    currentRefreshToken = newRefreshToken;
    console.log('✅ PASSED STEP 5: /auth/refresh successfully issued new tokens.');

    // -------------------------------------------------------------------------
    // STEP 6: Call /usage/status with Refreshed Access Token
    // -------------------------------------------------------------------------
    console.log('\n[STEP 6] Calling /usage/status with newly refreshed access token...');
    const refreshedUsageRes = await axios.get(`${API_BASE}/usage/status`, {
      headers: { Authorization: `Bearer ${newAccessToken}` },
    });
    console.log(`- Response status: ${refreshedUsageRes.status}`);
    console.log(`- isPro: ${refreshedUsageRes.data?.data?.isPro} (Expected: true)`);
    console.log(`- planType: ${refreshedUsageRes.data?.data?.planType} (Expected: PRO)`);

    if (!refreshedUsageRes.data?.data?.isPro || refreshedUsageRes.data?.data?.planType !== 'PRO') {
      throw new Error(`❌ FAILED STEP 6: Expected isPro: true after refresh, got: ${JSON.stringify(refreshedUsageRes.data)}`);
    }
    console.log('✅ PASSED STEP 6: Refreshed token seamlessly preserves Pro status.');

    // -------------------------------------------------------------------------
    // STEP 7: Simulated Axios Interceptor Flow (End-to-End Automatic Retry)
    // -------------------------------------------------------------------------
    console.log('\n[STEP 7] Testing simulated Axios client with automatic 401 refresh interceptor...');
    const simulatedClient = axios.create({ baseURL: API_BASE });
    let activeToken = jwt.sign(
      { id: userId, email: testEmail, role: 'PRO_USER' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '-5s' } // Expired token
    );
    let activeRefreshToken = currentRefreshToken;

    simulatedClient.interceptors.request.use((cfg) => {
      cfg.headers.Authorization = `Bearer ${activeToken}`;
      return cfg;
    });

    simulatedClient.interceptors.response.use(
      (res) => res,
      async (err) => {
        const orig = err.config;
        if (err.response?.status === 401 && err.response?.data?.code === 'TOKEN_EXPIRED' && !orig._retry) {
          orig._retry = true;
          console.log('  [Interceptor] 401 TOKEN_EXPIRED intercepted! Calling /auth/refresh automatically...');
          const refRes = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken: activeRefreshToken });
          activeToken = refRes.data?.data?.accessToken;
          activeRefreshToken = refRes.data?.data?.refreshToken;
          console.log('  [Interceptor] ✅ Token refreshed! Retrying original request...');
          orig.headers.Authorization = `Bearer ${activeToken}`;
          return simulatedClient(orig);
        }
        return Promise.reject(err);
      }
    );

    const autoRetryRes = await simulatedClient.get('/usage/status');
    console.log(`- Final resolved status: ${autoRetryRes.status}`);
    console.log(`- isPro: ${autoRetryRes.data?.data?.isPro}`);
    console.log(`- planType: ${autoRetryRes.data?.data?.planType}`);

    if (!autoRetryRes.data?.data?.isPro || autoRetryRes.data?.data?.planType !== 'PRO') {
      throw new Error(`❌ FAILED STEP 7: Auto-retry did not return Pro status!`);
    }
    console.log('✅ PASSED STEP 7: Interceptor auto-refreshes expired token and resolves request with PRO status seamlessly!');

    // -------------------------------------------------------------------------
    // STEP 8: Post-Payment /auth/me with UNREFRESHED (Original FREE_USER) Token
    // -------------------------------------------------------------------------
    console.log('\n[STEP 8] Calling /auth/me with UNREFRESHED access token issued at login (baked-in role: FREE_USER)...');
    // Issue an active token with role: FREE_USER explicitly baked into the payload
    const unrefreshedFreeToken = jwt.sign(
      { id: userId, email: testEmail, role: 'FREE_USER' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
    const meRes = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${unrefreshedFreeToken}` },
    });
    console.log(`- /auth/me response status: ${meRes.status}`);
    console.log(`- /auth/me returned role: ${meRes.data?.data?.role} (Expected: PRO_USER)`);
    console.log(`- /auth/me subscriptionPlan: ${meRes.data?.data?.subscriptionPlan}`);
    console.log(`- /auth/me subscriptionExpiresAt: ${meRes.data?.data?.subscriptionExpiresAt}`);

    if (meRes.data?.data?.role !== 'PRO_USER') {
      throw new Error(`❌ FAILED STEP 8: /auth/me returned stale role '${meRes.data?.data?.role}' from JWT instead of fresh PRO_USER from DB!`);
    }
    console.log('✅ PASSED STEP 8: /auth/me correctly ignores stale JWT claims and returns fresh PRO_USER role from MongoDB!');

    console.log('\n======================================================');
    console.log('🎉 ALL TOKEN REFRESH & ME REGRESSION TESTS PASSED (8/8)!');
    console.log('======================================================\n');
  } finally {
    if (userId) {
      await UserModel.findByIdAndDelete(userId);
      console.log(`🧹 Cleaned up test user ${userId}`);
    }
    await mongoose.disconnect();
  }
}

runTokenRefreshRegressionTest().catch((e) => {
  console.error('\n❌ TEST RUNNER FAILURE:', e.message || e);
  process.exit(1);
});
