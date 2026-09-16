import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { UserModel } from '../models/User.model.js';
import { PaymentTransactionModel } from '../models/PaymentTransaction.model.js';
import { AuthService } from '../services/auth.service.js';
import { UsageService } from '../services/usage.service.js';

async function testSelfHealing() {
  await mongoose.connect(env.MONGODB_URI);
  const testEmail = 'orphan_payment_test@speakwise.ai';

  console.log('\n======================================================');
  console.log('🧪 TESTING SELF-HEALING & ORPHANED PAYMENT RECONCILIATION');
  console.log('======================================================\n');

  // 1. Create orphaned successful transaction (simulating payment before user exists)
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  await PaymentTransactionModel.create({
    userEmail: testEmail,
    userName: 'Orphan Tester',
    orderId: 'order_test_orphan_123',
    paymentId: 'pay_test_orphan_123',
    signature: 'sig_test_123',
    planId: 'TRIAL_7_DAYS',
    amount: 1,
    currency: 'INR',
    status: 'SUCCESS',
    paymentMethod: 'RAZORPAY_CHECKOUT',
    durationHours: 168,
    paidAt: new Date(),
    expiresAt,
    notes: {
      planType: 'PRO',
      verifiedAt: new Date().toISOString(),
      isSignatureVerified: true,
      trialEndsAt: expiresAt.toISOString(),
    },
  });
  console.log('[STEP 1] Created orphaned payment transaction for', testEmail);

  // 2. User signs in with Google OAuth for the first time AFTER payment has already completed
  const { user } = await AuthService.googleLogin(testEmail, 'Orphan Tester', 'google_id_9999');
  console.log('[STEP 2] User signed in via Google OAuth. Auto-reconciled role:', user.role);

  // 3. Check /usage/status
  const usage = await UsageService.getUsageStatus({ user: { id: user._id.toString(), email: testEmail } } as any);
  console.log('[STEP 3] Usage status returned: isPro =', usage.isPro, '| planId =', usage.planId);

  // Clean up
  await UserModel.deleteOne({ email: testEmail });
  await PaymentTransactionModel.deleteMany({ userEmail: testEmail });
  await mongoose.disconnect();

  if (user.role === 'PRO_USER' && usage.isPro === true) {
    console.log('\n🎉 SUCCESS: Orphaned payment was automatically reconciled into the user document!');
    console.log('User role is PRO_USER and isPro is true immediately upon Google login!\n');
  } else {
    console.error('\n❌ FAILED: User was not upgraded to Pro!\n');
    process.exit(1);
  }
}

testSelfHealing().catch((e) => {
  console.error(e);
  process.exit(1);
});
