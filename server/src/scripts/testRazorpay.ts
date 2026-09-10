import crypto from 'crypto';

import { env } from '../config/env.js';

const RAZORPAY_KEY_SECRET = env.RAZORPAY_KEY_SECRET || 'Myvp7zXzgAwvoiV7O16C1Yrh';
const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('\n==================================================');
  console.log('🧪 TESTING RAZORPAY STANDARD WEB CHECKOUT ENDPOINTS');
  console.log('==================================================\n');

  // Test 1: Minimum amount validation (< 100 paise)
  console.log('Test 1: Create order with invalid amount (50 paise < 100 paise)...');
  try {
    const res1 = await fetch(`${BASE_URL}/api/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 50, currency: 'INR' }),
    });
    const data1: any = await res1.json();
    console.log(`Status: ${res1.status} | Response:`, data1);
    if (res1.status === 400 && data1.error?.includes('100 paise')) {
      console.log('✅ Test 1 Passed: Correctly returned 400 for amount < 100 paise.\n');
    } else {
      console.log('❌ Test 1 Failed!\n');
    }
  } catch (err: any) {
    console.error('Test 1 error:', err.message);
  }

  // Test 2: Create real order with Razorpay API (₹500.00 = 50000 paise)
  console.log('Test 2: Create real order via Razorpay API (50000 paise)...');
  let realOrderId = '';
  try {
    const res2 = await fetch(`${BASE_URL}/api/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 50000,
        currency: 'INR',
        receipt: `test_rcpt_${Date.now()}`,
      }),
    });
    const data2: any = await res2.json();
    console.log(`Status: ${res2.status} | Response:`, data2);
    if (res2.status === 200 && data2.order_id && data2.order_id.startsWith('order_')) {
      realOrderId = data2.order_id;
      console.log(`✅ Test 2 Passed: Successfully created Razorpay Order: ${realOrderId}!\n`);
    } else {
      console.log('❌ Test 2 Failed!\n');
    }
  } catch (err: any) {
    console.error('Test 2 error:', err.message);
  }

  // Test 3: Verify Payment - Missing fields validation
  console.log('Test 3: Verify payment with missing fields...');
  try {
    const res3 = await fetch(`${BASE_URL}/api/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: realOrderId || 'order_test_123',
        // razorpay_payment_id and razorpay_signature missing
      }),
    });
    const data3: any = await res3.json();
    console.log(`Status: ${res3.status} | Response:`, data3);
    if (res3.status === 400) {
      console.log('✅ Test 3 Passed: Correctly returned 400 for missing fields.\n');
    } else {
      console.log('❌ Test 3 Failed!\n');
    }
  } catch (err: any) {
    console.error('Test 3 error:', err.message);
  }

  // Test 4: Verify Payment - Invalid signature mismatch
  console.log('Test 4: Verify payment with signature mismatch...');
  const dummyPaymentId = 'pay_test_' + Date.now();
  try {
    const res4 = await fetch(`${BASE_URL}/api/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: realOrderId || 'order_test_123',
        razorpay_payment_id: dummyPaymentId,
        razorpay_signature: 'invalid_signature_hex_code_1234567890abcdef',
      }),
    });
    const data4: any = await res4.json();
    console.log(`Status: ${res4.status} | Response:`, data4);
    if (res4.status === 400 && data4.error?.includes('Invalid')) {
      console.log('✅ Test 4 Passed: Correctly returned 400 for signature mismatch.\n');
    } else {
      console.log('❌ Test 4 Failed!\n');
    }
  } catch (err: any) {
    console.error('Test 4 error:', err.message);
  }

  // Test 5: Verify Payment - Valid HMAC-SHA256 signature
  console.log('Test 5: Verify payment with valid HMAC-SHA256 signature...');
  const validOrderId = realOrderId || 'order_test_valid_123';
  const validPaymentId = 'pay_test_valid_' + Date.now();
  const generatedValidSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${validOrderId}|${validPaymentId}`)
    .digest('hex');

  try {
    const res5 = await fetch(`${BASE_URL}/api/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: validOrderId,
        razorpay_payment_id: validPaymentId,
        razorpay_signature: generatedValidSignature,
        planId: '1_MONTH',
        userEmail: 'test_speaker@speakwise.ai',
        userName: 'Test Speaker',
      }),
    });
    const data5: any = await res5.json();
    console.log(`Status: ${res5.status} | Response:`, data5);
    if (res5.status === 200 && data5.success && data5.data?.isSignatureVerified) {
      console.log('✅ Test 5 Passed: Successfully verified HMAC-SHA256 signature & recorded transaction!\n');
    } else {
      console.log('❌ Test 5 Failed!\n');
    }
  } catch (err: any) {
    console.error('Test 5 error:', err.message);
  }

  console.log('==================================================');
  console.log('🎉 ALL RAZORPAY ENDPOINT TESTS COMPLETE');
  console.log('==================================================\n');
}

runTests();
