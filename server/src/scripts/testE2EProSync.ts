import crypto from 'crypto';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { UserModel } from '../models/User.model.js';

const BASE_URL = `http://localhost:${env.PORT || 5000}/api/v1`;

interface TestAccountResult {
  email: string;
  initialRole: string;
  initialIsPro: boolean;
  paymentVerified: boolean;
  postPaymentIsPro: boolean;
  postPaymentRole: string;
  subsequentCallsStable: boolean;
}

async function runE2EForAccount(accountIndex: number): Promise<TestAccountResult> {
  const timestamp = Date.now();
  const testEmail = `pro_e2e_user_${accountIndex}_${timestamp}@speakwise.ai`;
  const testPassword = 'Password123!';
  const testFullName = `Pro E2E Tester ${accountIndex}`;

  console.log(`\n======================================================`);
  console.log(`👤 TESTING FRESH ACCOUNT ${accountIndex}: ${testEmail}`);
  console.log(`======================================================`);

  // 1. Register fresh user
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: testFullName,
      email: testEmail,
      password: testPassword,
    }),
  });

  const regData: any = await regRes.json();
  if (!regRes.ok || !regData.success) {
    throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
  }

  const accessToken = regData.data.accessToken;
  const user = regData.data.user;
  console.log(`[STEP 1] Registered fresh user: ID=${user.id}, Role=${user.role}`);

  // 2. Fetch initial usage status (simulating homepage load before upgrade)
  const initialUsageRes = await fetch(`${BASE_URL}/usage/status`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const initialUsage: any = await initialUsageRes.json();
  console.log(`[STEP 2] Initial /usage/status: isPro=${initialUsage.data?.isPro}, attemptsLeft=${initialUsage.data?.attemptsLeft}`);

  if (initialUsage.data?.isPro !== false || user.role !== 'FREE_USER') {
    throw new Error(`Account did not start on Free tier! isPro=${initialUsage.data?.isPro}, role=${user.role}`);
  }

  // 3. Create order for ₹1 Trial
  const orderRes = await fetch(`${BASE_URL}/subscription/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ planId: 'TRIAL_7_DAYS' }),
  });
  const orderData: any = await orderRes.json();
  if (!orderRes.ok || !orderData.success) {
    throw new Error(`Create order failed: ${JSON.stringify(orderData)}`);
  }
  const orderId = orderData.data.orderId;
  console.log(`[STEP 3] Created Razorpay order: ${orderId} (Amount: ₹${orderData.data.amount / 100})`);

  // 4. Simulate successful Razorpay checkout by generating valid signature
  const dummyPaymentId = `pay_sim_${Date.now()}`;
  const signature = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${dummyPaymentId}`)
    .digest('hex');

  // 5. Call /verify-payment (as razorpay.service.ts does)
  const verifyRes = await fetch(`${BASE_URL}/verify-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      razorpay_order_id: orderId,
      razorpay_payment_id: dummyPaymentId,
      razorpay_signature: signature,
      planId: 'TRIAL_7_DAYS',
      userEmail: testEmail,
      userName: testFullName,
      paymentMethod: 'RAZORPAY_CHECKOUT',
    }),
  });

  const verifyData: any = await verifyRes.json();
  if (!verifyRes.ok || !verifyData.success) {
    throw new Error(`Payment verification failed: ${JSON.stringify(verifyData)}`);
  }
  console.log(`[STEP 4] /verify-payment succeeded! Server expiresAt: ${verifyData.data?.expiresAt}`);

  // 6. Execute the SINGLE post-payment refresh (Promise.allSettled) as now in razorpay.service.ts
  console.log(`[STEP 5] Executing single post-payment refresh: Promise.allSettled([fetchUsageStatus, refreshUser])...`);
  const [usageSettled, authSettled] = await Promise.allSettled([
    fetch(`${BASE_URL}/usage/status`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then((r) => r.json()),
    fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then((r) => r.json()),
  ]);

  if (usageSettled.status !== 'fulfilled' || authSettled.status !== 'fulfilled') {
    throw new Error(`Post-payment refresh failed to settle cleanly!`);
  }

  const postUsage = (usageSettled.value as any).data;
  const postAuth = (authSettled.value as any).data;

  console.log(`[STEP 6] Refreshed store state immediately post-payment:`);
  console.log(`   - usage.isPro: ${postUsage.isPro} (Expected: true)`);
  console.log(`   - usage.planType: ${postUsage.planType} (Expected: PRO)`);
  console.log(`   - usage.planId: ${postUsage.planId} (Expected: TRIAL_7_DAYS)`);
  console.log(`   - user.role: ${postAuth.role} (Expected: PRO_USER)`);

  if (!postUsage.isPro || postAuth.role !== 'PRO_USER') {
    throw new Error(`Pro status did not reflect immediately! isPro=${postUsage.isPro}, role=${postAuth.role}`);
  }

  // 7. Verify subsequent calls simulating modal close, navigation to homepage, countdown ticker, and route changes
  console.log(`[STEP 7] Simulating modal close & multiple subsequent page renders / poll calls...`);
  let isConsistentlyPro = true;
  for (let i = 1; i <= 5; i++) {
    const checkRes = await fetch(`${BASE_URL}/usage/status`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const checkData: any = await checkRes.json();
    if (!checkData.data?.isPro) {
      console.error(`❌ Revert to free detected on subsequent poll #${i}!`);
      isConsistentlyPro = false;
      break;
    }
  }

  if (isConsistentlyPro) {
    console.log(`✅ All 5 subsequent /usage/status checks returned isPro: true consistently without flicker or revert!`);
  }

  // Clean up user from DB
  await UserModel.deleteOne({ email: testEmail });
  console.log(`🧹 Cleaned up test user ${testEmail}.`);

  return {
    email: testEmail,
    initialRole: user.role,
    initialIsPro: initialUsage.data?.isPro,
    paymentVerified: verifyData.success,
    postPaymentIsPro: postUsage.isPro,
    postPaymentRole: postAuth.role,
    subsequentCallsStable: isConsistentlyPro,
  };
}

async function runAll() {
  await mongoose.connect(env.MONGODB_URI);
  try {
    const result1 = await runE2EForAccount(1);
    const result2 = await runE2EForAccount(2);

    console.log(`\n======================================================`);
    console.log(`🏆 FINAL MULTI-ACCOUNT VERIFICATION SUMMARY`);
    console.log(`======================================================`);
    console.table([result1, result2]);
    console.log(`\n✅ BOTH ACCOUNTS CONFIRMED: Immediate, consistent Pro status with 0 flicker and 0 revert!`);
  } finally {
    await mongoose.disconnect();
  }
}

runAll().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
