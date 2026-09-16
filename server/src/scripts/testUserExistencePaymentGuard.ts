import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { UserModel } from '../models/User.model.js';
import { PaymentTransactionModel } from '../models/PaymentTransaction.model.js';

const BASE_URL = 'http://localhost:5000/api/v1';
const RAZORPAY_KEY_SECRET = env.RAZORPAY_KEY_SECRET || 'Myvp7zXzgAwvoiV7O16C1Yrh';

async function runGuardTests() {
  console.log('\n=============================================================');
  console.log('🛡️  TESTING USER EXISTENCE & PAYMENT SEQUENCING GUARDS');
  console.log('=============================================================\n');

  await mongoose.connect(env.MONGODB_URI);

  // -------------------------------------------------------------
  // TEST 1: Block order creation when no auth token is provided
  // -------------------------------------------------------------
  console.log('[TEST 1] Testing /create-order without authentication token...');
  const res1 = await fetch(`${BASE_URL}/subscription/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId: '1_MONTH' }),
  });
  const data1: any = await res1.json();
  console.log(`- Status: ${res1.status}, Code: ${data1.code}, Error: ${data1.error}`);
  if (res1.status === 401 && data1.code === 'AUTH_REQUIRED') {
    console.log('✅ TEST 1 PASSED: Order creation strictly blocked for unauthenticated requests!\n');
  } else {
    throw new Error(`❌ TEST 1 FAILED: Expected 401 AUTH_REQUIRED, got status ${res1.status}: ${JSON.stringify(data1)}`);
  }

  // -------------------------------------------------------------
  // TEST 2: Block order creation when user does NOT exist in MongoDB
  // -------------------------------------------------------------
  console.log('[TEST 2] Testing /create-order with valid JWT but NON-EXISTENT user in DB...');
  const ghostUserId = '666666666666666666666666';
  const ghostToken = jwt.sign(
    { id: ghostUserId, email: 'ghost.user@speakwise.ai', role: 'FREE_USER' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '1h' }
  );

  const res2 = await fetch(`${BASE_URL}/subscription/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ghostToken}`,
    },
    body: JSON.stringify({ planId: '1_MONTH' }),
  });
  const data2: any = await res2.json();
  console.log(`- Status: ${res2.status}, Code: ${data2.code}, Error: ${data2.error}`);
  if (res2.status === 401 && data2.code === 'USER_NOT_FOUND') {
    console.log('✅ TEST 2 PASSED: Order creation strictly blocked for non-existent database record!\n');
  } else {
    throw new Error(`❌ TEST 2 FAILED: Expected 401 USER_NOT_FOUND, got status ${res2.status}: ${JSON.stringify(data2)}`);
  }

  // -------------------------------------------------------------
  // TEST 3: Block payment verification for non-existent user in DB
  // -------------------------------------------------------------
  console.log('[TEST 3] Testing /verify-payment for non-existent user in DB...');
  const dummyOrderId = 'order_ghost_12345';
  const dummyPaymentId = 'pay_ghost_12345';
  const signature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${dummyOrderId}|${dummyPaymentId}`)
    .digest('hex');

  const res3 = await fetch(`${BASE_URL}/subscription/verify-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ghostToken}`,
    },
    body: JSON.stringify({
      razorpay_order_id: dummyOrderId,
      razorpay_payment_id: dummyPaymentId,
      razorpay_signature: signature,
      planId: '1_MONTH',
      userEmail: 'ghost.user@speakwise.ai',
    }),
  });
  const data3: any = await res3.json();
  console.log(`- Status: ${res3.status}, Code: ${data3.code}, Error: ${data3.error}`);
  if (res3.status === 401 && data3.code === 'USER_NOT_FOUND') {
    console.log('✅ TEST 3 PASSED: Payment verification strictly blocked for non-existent database record!\n');
  } else {
    throw new Error(`❌ TEST 3 FAILED: Expected 401 USER_NOT_FOUND, got status ${res3.status}: ${JSON.stringify(data3)}`);
  }

  // -------------------------------------------------------------
  // TEST 4: Legitimate registered user creates order & upgrades to Pro
  // -------------------------------------------------------------
  console.log('[TEST 4] Testing payment flow with a GENUINE registered user in MongoDB...');
  const testEmail = `genuine_buyer_${Date.now()}@speakwise.ai`;
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Genuine Buyer',
      email: testEmail,
      password: 'StrongPassword123!',
    }),
  });
  const regData: any = await regRes.json();
  const legitimateUser = regData.data.user;
  const legitimateUserId = legitimateUser._id || legitimateUser.id;
  const legitimateToken = regData.data.accessToken;
  console.log(`- Registered user ID: ${legitimateUserId}, initial role: ${legitimateUser.role}`);

  // Create order
  const res4 = await fetch(`${BASE_URL}/subscription/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${legitimateToken}`,
    },
    body: JSON.stringify({ planId: 'TRIAL_7_DAYS' }),
  });
  const data4: any = await res4.json();
  if (res4.status !== 200 || !data4.success || !data4.order_id) {
    throw new Error(`❌ TEST 4 FAILED: Genuine user order creation failed: ${JSON.stringify(data4)}`);
  }
  const realOrderId = data4.order_id;
  console.log(`- Created order for genuine user: ${realOrderId}`);

  // Verify payment
  const legitimatePaymentId = 'pay_legit_' + Date.now();
  const legitimateSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${realOrderId}|${legitimatePaymentId}`)
    .digest('hex');

  const res5 = await fetch(`${BASE_URL}/subscription/verify-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${legitimateToken}`,
    },
    body: JSON.stringify({
      razorpay_order_id: realOrderId,
      razorpay_payment_id: legitimatePaymentId,
      razorpay_signature: legitimateSignature,
      planId: 'TRIAL_7_DAYS',
      userEmail: testEmail,
      userName: 'Genuine Buyer',
    }),
  });
  const data5: any = await res5.json();
  if (res5.status !== 200 || !data5.success) {
    throw new Error(`❌ TEST 4 FAILED: Payment verification failed for genuine user: ${JSON.stringify(data5)}`);
  }
  console.log(`- Verified payment for genuine user: ${legitimatePaymentId}`);

  // Confirm user in DB has been updated to PRO_USER
  const updatedDbUser = await UserModel.findOne({ email: testEmail });
  if (!updatedDbUser || updatedDbUser.role !== 'PRO_USER') {
    throw new Error(`❌ TEST 4 FAILED: User was not updated to PRO_USER in MongoDB! Got: ${updatedDbUser?.role}`);
  }
  console.log(`- Confirmed MongoDB user ${updatedDbUser._id} is now ${updatedDbUser.role} until ${updatedDbUser.subscriptionExpiresAt}`);

  // Clean up test data
  await UserModel.deleteMany({ email: testEmail });
  await PaymentTransactionModel.deleteMany({ userEmail: testEmail });
  console.log('✅ TEST 4 PASSED: Genuine registered user payment flow completed and mapped successfully!\n');

  console.log('=============================================================');
  console.log('🎉 ALL 4 USER EXISTENCE & PAYMENT SEQUENCING TESTS PASSED!');
  console.log('=============================================================\n');
  process.exit(0);
}

runGuardTests().catch((err) => {
  console.error('\n❌ TEST RUNNER ERROR:', err.message);
  process.exit(1);
});
