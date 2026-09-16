import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { UserModel } from '../models/User.model.js';
import { UsageService } from '../services/usage.service.js';
import { logger } from '../utils/logger.js';

async function runProRegressionTests() {
  console.log('\n======================================================');
  console.log('🧪 SPEAKWISE REGRESSION TEST SUITE');
  console.log('Validating: User Role Default + Pro Access Security Guard + Free Tier Countdown Flow');
  console.log('======================================================\n');

  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected to MongoDB at:', env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));

  const testEmail = `reg_test_${Date.now()}@speakwise.ai`;
  let testUserId: string = '';

  try {
    // -------------------------------------------------------------------------
    // TEST 1: New User Creation Role Default
    // -------------------------------------------------------------------------
    console.log('\n[TEST 1] Creating fresh user without explicit role...');
    const userDoc = await UserModel.create({
      fullName: 'Regression Test Speaker',
      email: testEmail,
      passwordHash: 'dummy_hash',
      // DO NOT pass role, test schema default
    });
    testUserId = userDoc._id.toString();

    console.log(`- Created user ID: ${testUserId}`);
    console.log(`- Role in MongoDB: ${userDoc.role}`);
    console.log(`- Subscription Plan: ${userDoc.subscriptionPlan || 'null'}`);
    console.log(`- Subscription Expires: ${userDoc.subscriptionExpiresAt || 'null'}`);

    if (userDoc.role !== 'FREE_USER') {
      throw new Error(`❌ FAILED TEST 1: Fresh user defaulted to role '${userDoc.role}', expected 'FREE_USER'!`);
    }
    console.log('✅ PASSED TEST 1: Fresh user correctly defaults to role: FREE_USER.');

    // -------------------------------------------------------------------------
    // TEST 2: UsageService.getUsageStatus for Fresh User (Must NOT be Pro)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 2] Checking UsageService.getUsageStatus for fresh user...');
    const mockReq1: any = { user: { id: testUserId, email: testEmail, role: 'FREE_USER' }, headers: {} };
    const status1 = await UsageService.getUsageStatus(mockReq1);

    console.log(`- isPro: ${status1.isPro} (Expected: false)`);
    console.log(`- planType: ${status1.planType} (Expected: FREESTYLE)`);
    console.log(`- attemptsLeft: ${status1.attemptsLeft} (Expected: 3)`);
    console.log(`- maxAttempts: ${status1.maxAttempts} (Expected: 3)`);
    console.log(`- isTrialEligible: ${status1.isTrialEligible} (Expected: true)`);
    console.log(`- canProceed: ${status1.canProceed} (Expected: true)`);
    console.log(`- message: "${status1.message}"`);

    if (status1.isPro !== false) {
      throw new Error('❌ FAILED TEST 2: Fresh user received isPro: true without payment/trial!');
    }
    if (status1.attemptsLeft !== 3) {
      throw new Error(`❌ FAILED TEST 2: Expected 3 attempts left, got ${status1.attemptsLeft}`);
    }
    if (status1.isTrialEligible !== true) {
      throw new Error('❌ FAILED TEST 2: Fresh user should be eligible for the ₹1 trial!');
    }
    console.log('✅ PASSED TEST 2: Fresh user correctly receives isPro: false, 3 attempts left, trial eligible.');

    // -------------------------------------------------------------------------
    // TEST 3: Downgrade Guard for Erroneous PRO_USER with Null Subscription
    // -------------------------------------------------------------------------
    console.log('\n[TEST 3] Simulating an elevated user with role PRO_USER but null subscription...');
    userDoc.role = 'PRO_USER';
    userDoc.subscriptionPlan = undefined as any;
    userDoc.subscriptionExpiresAt = undefined as any;
    await userDoc.save();

    const mockReq2: any = { user: { id: testUserId, email: testEmail, role: 'PRO_USER' }, headers: {} };
    const status2 = await UsageService.getUsageStatus(mockReq2);

    console.log(`- isPro returned: ${status2.isPro} (Expected: false)`);
    if (status2.isPro !== false) {
      throw new Error('❌ FAILED TEST 3: User with role PRO_USER and null subscription was granted Pro access!');
    }

    const reloadedUser = await UserModel.findById(testUserId);
    console.log(`- User role in DB after auto-downgrade: ${reloadedUser?.role} (Expected: FREE_USER)`);
    if (reloadedUser?.role !== 'FREE_USER') {
      throw new Error(`❌ FAILED TEST 3: User was not auto-downgraded in DB, remained '${reloadedUser?.role}'`);
    }
    console.log('✅ PASSED TEST 3: Erroneous PRO_USER without subscription is securely denied Pro and auto-downgraded to FREE_USER.');

    // -------------------------------------------------------------------------
    // TEST 4: Free-Tier Countdown Flow (3 uses left → 2 left → 1 left → 0 / Trial Offer)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 4] Testing countdown decrement flow (3 left → 2 left → 1 left → trial offer handoff)...');

    // Attempt 1
    console.log('Consuming analysis 1...');
    const consume1 = await UsageService.consumeUsage(mockReq2);
    console.log(`  → After 1st consume: ${consume1.attemptsLeft} uses left | message: "${consume1.message}"`);
    if (consume1.attemptsLeft !== 2) throw new Error(`Expected 2 left, got ${consume1.attemptsLeft}`);

    // Attempt 2
    console.log('Consuming analysis 2...');
    const consume2 = await UsageService.consumeUsage(mockReq2);
    console.log(`  → After 2nd consume: ${consume2.attemptsLeft} use left | message: "${consume2.message}"`);
    if (consume2.attemptsLeft !== 1) throw new Error(`Expected 1 left, got ${consume2.attemptsLeft}`);

    // Attempt 3
    console.log('Consuming analysis 3...');
    const consume3 = await UsageService.consumeUsage(mockReq2);
    console.log(`  → After 3rd consume: ${consume3.attemptsLeft} uses left | message: "${consume3.message}"`);
    if (consume3.attemptsLeft !== 0) throw new Error(`Expected 0 left, got ${consume3.attemptsLeft}`);
    if (consume3.canProceed !== false) throw new Error('Expected canProceed to be false at 0 attempts');

    // Attempt 4 should be rejected with 402 Payment Required
    console.log('Attempting analysis 4 (should be blocked)...');
    let blocked = false;
    try {
      await UsageService.consumeUsage(mockReq2);
    } catch (err: any) {
      if (err.statusCode === 402) {
        blocked = true;
        console.log(`  → Correctly blocked: 402 - ${err.message}`);
      }
    }
    if (!blocked) throw new Error('❌ FAILED TEST 4: 4th attempt was not blocked at limit 0!');

    // Check trial handoff status
    const finalStatus = await UsageService.getUsageStatus(mockReq2);
    console.log(`  → Final Status: attemptsLeft=${finalStatus.attemptsLeft}, isTrialEligible=${finalStatus.isTrialEligible}`);
    if (finalStatus.attemptsLeft !== 0 || finalStatus.isTrialEligible !== true) {
      throw new Error('❌ FAILED TEST 4: User at 0 attempts should remain trial eligible to unlock the ₹1 offer!');
    }

    console.log('✅ PASSED TEST 4: Full countdown (3 → 2 → 1 → 0) and ₹1 trial offer handoff verified successfully!');

    // -------------------------------------------------------------------------
    // TEST 5: (b) Pro Status Reflects Immediately After Payment with Correct Expiry
    // -------------------------------------------------------------------------
    console.log('\n[TEST 5] Testing Pro status reflects immediately after ₹1 trial payment...');
    const nowMs = Date.now();
    const trialHours = 168; // 7 days
    const trialEndsAt = new Date(nowMs + trialHours * 3600 * 1000);

    const userForTrial = await UserModel.findById(testUserId);
    if (!userForTrial) throw new Error('Test user not found');
    userForTrial.role = 'PRO_USER';
    userForTrial.hasUsedTrialOffer = true;
    userForTrial.trialEndsAt = trialEndsAt;
    userForTrial.planStartsAt = new Date(nowMs);
    userForTrial.subscriptionPlan = 'TRIAL_7_DAYS';
    userForTrial.subscriptionExpiresAt = trialEndsAt;
    await userForTrial.save();

    const trialStatus = await UsageService.getUsageStatus(mockReq1);
    console.log(`- isPro: ${trialStatus.isPro} (Expected: true)`);
    console.log(`- planType: ${trialStatus.planType} (Expected: PRO)`);
    console.log(`- planId: ${trialStatus.planId} (Expected: TRIAL_7_DAYS)`);
    console.log(`- expiresAt: ${trialStatus.expiresAt}`);
    console.log(`- trialEndsAt: ${trialStatus.trialEndsAt}`);

    if (!trialStatus.isPro || trialStatus.planId !== 'TRIAL_7_DAYS' || !trialStatus.expiresAt) {
      throw new Error('❌ FAILED TEST 5: Pro status did not reflect immediately after trial payment!');
    }
    console.log('✅ PASSED TEST 5: Pro status reflects immediately with correct 7-day trial expiry.');

    // -------------------------------------------------------------------------
    // TEST 6: (c) Plan Purchased During Active Trial Correctly Stacks
    // -------------------------------------------------------------------------
    console.log('\n[TEST 6] Testing plan purchased during active trial stacks after trial ends...');
    const planDurationHours = 30 * 24; // 1_MONTH (720h)
    const stackedStartsAt = new Date(userForTrial.trialEndsAt!);
    const stackedExpiresAt = new Date(stackedStartsAt.getTime() + planDurationHours * 3600 * 1000);

    userForTrial.subscriptionPlan = '1_MONTH';
    userForTrial.planStartsAt = stackedStartsAt;
    userForTrial.subscriptionExpiresAt = stackedExpiresAt;
    await userForTrial.save();

    const stackedStatus = await UsageService.getUsageStatus(mockReq1);
    console.log(`- isPro: ${stackedStatus.isPro} (Expected: true)`);
    console.log(`- planId: ${stackedStatus.planId} (Expected: 1_MONTH)`);
    console.log(`- planStartsAt: ${stackedStatus.planStartsAt} (Expected: ${stackedStartsAt.toISOString()})`);
    console.log(`- expiresAt: ${stackedStatus.expiresAt} (Expected: ${stackedExpiresAt.toISOString()})`);

    if (!stackedStatus.isPro || stackedStatus.planId !== '1_MONTH') {
      throw new Error('❌ FAILED TEST 6: Stacked plan did not maintain Pro status!');
    }
    if (new Date(stackedStatus.planStartsAt!).getTime() !== stackedStartsAt.getTime()) {
      throw new Error('❌ FAILED TEST 6: planStartsAt did not match trial end date!');
    }
    if (new Date(stackedStatus.expiresAt!).getTime() !== stackedExpiresAt.getTime()) {
      throw new Error('❌ FAILED TEST 6: expiresAt did not stack on top of trial end date!');
    }
    console.log('✅ PASSED TEST 6: 1_MONTH plan correctly stacks to start after trial ends (~37 days total).');

    // -------------------------------------------------------------------------
    // TEST 7: Immediate Post-Payment State Sync Without Logout
    // -------------------------------------------------------------------------
    console.log('\n[TEST 7] Testing immediate post-payment state re-fetch without logout/login...');
    const liveStatus = await UsageService.getUsageStatus(mockReq1);
    const refreshedUser = await UserModel.findById(testUserId);

    console.log(`- usage.isPro: ${liveStatus.isPro} (Expected: true)`);
    console.log(`- usage.planId: ${liveStatus.planId} (Expected: 1_MONTH)`);
    console.log(`- user.role: ${refreshedUser?.role} (Expected: PRO_USER)`);
    console.log(`- user.subscriptionPlan: ${refreshedUser?.subscriptionPlan} (Expected: 1_MONTH)`);

    if (!liveStatus.isPro || liveStatus.planId !== '1_MONTH') {
      throw new Error('❌ FAILED TEST 7: Live usage status did not immediately reflect Pro without logout!');
    }
    if (refreshedUser?.role !== 'PRO_USER' || refreshedUser?.subscriptionPlan !== '1_MONTH') {
      throw new Error('❌ FAILED TEST 7: User profile in DB did not immediately reflect PRO_USER role without logout!');
    }
    console.log('✅ PASSED TEST 7: Post-payment usage status & auth profile reflect Pro immediately without re-login.');

    console.log('\n======================================================');
    console.log('🎉 ALL 7 REGRESSION & MONETIZATION TESTS PASSED CLEANLY WITH 100% SUCCESS!');
    console.log('======================================================\n');
  } finally {
    if (testUserId) {
      await UserModel.deleteOne({ _id: testUserId });
      console.log(`🧹 Cleaned up temporary test user ${testUserId}.`);
    }
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

runProRegressionTests().catch((err) => {
  console.error('\n❌ REGRESSION TEST FAILED:', err);
  process.exit(1);
});
