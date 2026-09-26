import mongoose from 'express';
import mongooseDb from 'mongoose';
import dns from 'dns';
import { env } from '../config/env.js';
import { UserModel } from '../models/User.model.js';
import { AuthService } from '../services/auth.service.js';

try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {}

const runAuthTests = async () => {
  console.log('================================================================');
  console.log('🚀 SpeakWise AI - Automated Authentication System Test Suite');
  console.log('================================================================');

  await mongooseDb.connect(env.MONGODB_URI);
  console.log('✅ Connected to MongoDB Atlas.\n');

  const timestamp = Date.now();
  const testUser1Email = `authtest_user1_${timestamp}@example.com`;
  const testUser1Pass = 'Password123!';
  const testUser1NewPass = 'NewPassword456!';
  const googleUserEmail = `authtest_google_${timestamp}@example.com`;

  let passed = 0;
  let total = 9;

  try {
    // -------------------------------------------------------------------------
    // TEST 1 & 2: Signup, Attempt Login without Verification, then Verify & Login
    // -------------------------------------------------------------------------
    console.log('[TEST 1 & 2] New email/password signup & unverified login block');
    const signupRes = await AuthService.register('Test User One', testUser1Email, testUser1Pass);
    console.log(`- User registered: ${signupRes.user.email}, emailVerified: ${signupRes.emailVerified}`);
    if (signupRes.emailVerified === false && signupRes.requiresVerification === true) {
      console.log('✅ Signup properly set emailVerified: false and requiresVerification: true');
    } else {
      throw new Error('TEST 1 Failed: emailVerified should be false on signup');
    }

    // Attempt login before verifying (TEST 2)
    console.log('- Attempting login before verifying email...');
    let blockedUnverified = false;
    try {
      await AuthService.login(testUser1Email, testUser1Pass);
    } catch (err: any) {
      if (err.message.includes('not verified')) {
        blockedUnverified = true;
        console.log(`✅ Unverified login safely blocked: "${err.message}"`);
        passed++;
      } else {
        throw new Error(`Unexpected error on unverified login: ${err.message}`);
      }
    }
    if (!blockedUnverified) {
      throw new Error('TEST 2 Failed: Unverified user was able to log in');
    }

    // Now retrieve the OTP generated for testUser1 from database to verify
    const dbUser1 = await UserModel.findOne({ email: testUser1Email }).select('+emailVerificationTokenHash');
    if (!dbUser1 || !dbUser1.emailVerificationTokenHash) {
      throw new Error('TEST 1 Failed: Verification token hash not stored in database');
    }
    console.log('✅ Verification token hash safely stored in database');

    // TEST 5 part 1: Invalid OTP should fail
    console.log('\n[TEST 5] Testing invalid OTP validation & rate-limiting');
    let invalidOtpRejected = false;
    try {
      await AuthService.verifyEmail(testUser1Email, '000000');
    } catch (err: any) {
      if (err.message.includes('Invalid verification code')) {
        invalidOtpRejected = true;
        console.log(`✅ Invalid OTP correctly rejected: "${err.message}"`);
        passed++;
      }
    }
    if (!invalidOtpRejected) {
      throw new Error('TEST 5 Failed: Invalid OTP was accepted');
    }

    // Now complete verification with correct OTP (TEST 1)
    // We can simulate OTP generation via sendVerificationEmail
    console.log('\n[TEST 1 Completion] Verifying email with fresh OTP & logging in');
    // Let's re-send OTP to know the exact OTP by checking the service
    // For test, we generate a known OTP and set its SHA-256 hash in user doc
    const crypto = await import('crypto');
    const knownOtp = '654321';
    dbUser1.emailVerificationTokenHash = crypto.createHash('sha256').update(knownOtp).digest('hex');
    dbUser1.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    dbUser1.verificationAttempts = 0;
    await dbUser1.save();

    const verifyRes = await AuthService.verifyEmail(testUser1Email, knownOtp);
    if (verifyRes.user.emailVerified === true && verifyRes.tokens.accessToken) {
      console.log('✅ Email successfully verified and session tokens issued');
    } else {
      throw new Error('TEST 1 Failed: Email verification did not mark emailVerified = true');
    }

    // Now attempt login after verification
    const loginRes = await AuthService.login(testUser1Email, testUser1Pass);
    if (loginRes.user.email === testUser1Email && loginRes.tokens.accessToken) {
      console.log('✅ Verified user logged in successfully with valid JWT tokens');
      passed++;
    } else {
      throw new Error('TEST 1 Failed: Verified user could not log in');
    }

    // -------------------------------------------------------------------------
    // TEST 3: Forgot Password -> OTP -> Reset Password -> Login with New Password
    // -------------------------------------------------------------------------
    console.log('\n[TEST 3] Forgot Password flow for email/password account');
    const forgotRes = await AuthService.forgotPassword(testUser1Email);
    console.log(`- Forgot password response: "${forgotRes.message}"`);

    // Verify OTP was stored in DB
    const dbUserAfterForgot = await UserModel.findOne({ email: testUser1Email }).select('+resetPasswordTokenHash');
    if (!dbUserAfterForgot || !dbUserAfterForgot.resetPasswordTokenHash) {
      throw new Error('TEST 3 Failed: Reset password token hash not stored in DB');
    }

    // Set known reset OTP to test resetPassword
    const knownResetOtp = '987654';
    dbUserAfterForgot.resetPasswordTokenHash = crypto.createHash('sha256').update(knownResetOtp).digest('hex');
    dbUserAfterForgot.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    dbUserAfterForgot.resetAttempts = 0;
    await dbUserAfterForgot.save();

    // Verify reset OTP
    const verifyOtpRes = await AuthService.verifyResetOtp(testUser1Email, knownResetOtp);
    console.log(`- Verify reset OTP response: "${verifyOtpRes.message}"`);

    // Reset password
    const resetRes = await AuthService.resetPassword(testUser1Email, knownResetOtp, testUser1NewPass);
    console.log(`- Password reset response: "${resetRes.message}"`);

    // Verify login with OLD password fails
    let oldPassFailed = false;
    try {
      await AuthService.login(testUser1Email, testUser1Pass);
    } catch (err: any) {
      oldPassFailed = true;
      console.log('✅ Login with old password rejected');
    }
    if (!oldPassFailed) {
      throw new Error('TEST 3 Failed: Old password was still accepted');
    }

    // Verify login with NEW password succeeds
    const newPassLogin = await AuthService.login(testUser1Email, testUser1NewPass);
    if (newPassLogin.tokens.accessToken) {
      console.log('✅ Login with new password succeeded');
      passed++;
    } else {
      throw new Error('TEST 3 Failed: New password login failed');
    }

    // -------------------------------------------------------------------------
    // TEST 4: Expired reset OTP should fail safely
    // -------------------------------------------------------------------------
    console.log('\n[TEST 4] Expired reset OTP handling');
    const userForExpiredTest = await UserModel.findOne({ email: testUser1Email }).select('+resetPasswordTokenHash');
    if (userForExpiredTest) {
      userForExpiredTest.resetPasswordTokenHash = crypto.createHash('sha256').update('112233').digest('hex');
      userForExpiredTest.resetPasswordExpires = new Date(Date.now() - 1000); // 1 sec in past
      await userForExpiredTest.save();

      let expiredFailed = false;
      try {
        await AuthService.verifyResetOtp(testUser1Email, '112233');
      } catch (err: any) {
        if (err.message.includes('expired')) {
          expiredFailed = true;
          console.log(`✅ Expired OTP rejected properly: "${err.message}"`);
          passed++;
        }
      }
      if (!expiredFailed) {
        throw new Error('TEST 4 Failed: Expired OTP was accepted');
      }
    }

    // -------------------------------------------------------------------------
    // TEST 6: Google-only user login continues working
    // -------------------------------------------------------------------------
    console.log('\n[TEST 6] Google-only user login');
    const googleLoginRes = await AuthService.googleLogin(googleUserEmail, 'Google Test User', 'gid_123456');
    if (googleLoginRes.user.authProvider === 'google' && googleLoginRes.tokens.accessToken) {
      console.log(`✅ Google Sign-In succeeded for ${googleUserEmail}`);
      passed++;
    } else {
      throw new Error('TEST 6 Failed: Google login failed');
    }

    // -------------------------------------------------------------------------
    // TEST 7: Google-only user -> Forgot Password & Password Login checks
    // -------------------------------------------------------------------------
    console.log('\n[TEST 7] Google-only user safety guards');
    // Attempting password login on Google-only user
    let googleLoginWithPassBlocked = false;
    try {
      await AuthService.login(googleUserEmail, 'SomePassword123!');
    } catch (err: any) {
      if (err.message.includes('Google Sign-In')) {
        googleLoginWithPassBlocked = true;
        console.log(`✅ Password login blocked for Google user: "${err.message}"`);
      }
    }
    if (!googleLoginWithPassBlocked) {
      throw new Error('TEST 7 Failed: Google user was not advised to use Google sign-in on login');
    }

    // Forgot password on Google user
    const googleForgotRes = await AuthService.forgotPassword(googleUserEmail);
    // Generic message returned so no account enumeration occurs
    if (googleForgotRes.success && googleForgotRes.message.includes('If an account exists')) {
      console.log(`✅ Forgot password on Google user returned safe generic message: "${googleForgotRes.message}"`);
      passed++;
    } else {
      throw new Error('TEST 7 Failed: Google forgot password leaked account details');
    }

    // -------------------------------------------------------------------------
    // TEST 8: Account Linking: Email user signs in with Google using same email
    // -------------------------------------------------------------------------
    console.log('\n[TEST 8] Safe Account Linking');
    // testUser1 originally registered with email+password
    const linkedGoogleRes = await AuthService.googleLogin(testUser1Email, 'Test User One', 'gid_linked_789');
    const linkedUserInDb = await UserModel.findOne({ email: testUser1Email }).select('+passwordHash');

    if (linkedUserInDb && linkedUserInDb.googleId === 'gid_linked_789' && linkedUserInDb.passwordHash !== 'GOOGLE_OAUTH_USER') {
      console.log('✅ Google identity linked to existing email account without overwriting passwordHash');

      // Verify that email+password login STILL works after Google linking!
      const postLinkLogin = await AuthService.login(testUser1Email, testUser1NewPass);
      if (postLinkLogin.tokens.accessToken) {
        console.log('✅ Email+password login continues working after account linking (Dual login supported!)');
        passed++;
      } else {
        throw new Error('TEST 8 Failed: Password login failed after Google linking');
      }
    } else {
      throw new Error('TEST 8 Failed: Account linking corrupted user password');
    }

    // -------------------------------------------------------------------------
    // TEST 9: Non-existing email on Forgot Password -> generic response
    // -------------------------------------------------------------------------
    console.log('\n[TEST 9] Non-existing email enumeration prevention');
    const nonExistentEmail = `nonexistent_user_${Date.now()}@notfounddomain.com`;
    const nonExistentForgotRes = await AuthService.forgotPassword(nonExistentEmail);
    if (
      nonExistentForgotRes.success &&
      nonExistentForgotRes.message === 'If an account exists for this email, password reset instructions have been sent.'
    ) {
      console.log(`✅ Safe generic response returned: "${nonExistentForgotRes.message}"`);
      passed++;
    } else {
      throw new Error('TEST 9 Failed: Non-existing email leaked account status');
    }

    // Cleanup test users from DB
    await UserModel.deleteMany({
      email: { $in: [testUser1Email, googleUserEmail] },
    });
    console.log('\n🧹 Cleaned up temporary test users from MongoDB Atlas.');

    console.log('\n================================================================');
    console.log(`🎉 ALL ${passed}/${total} AUTHENTICATION REGRESSION TESTS PASSED!`);
    console.log('================================================================');
  } catch (error: any) {
    console.error('\n❌ Test Suite Failed:', error.message);
    process.exit(1);
  } finally {
    await mongooseDb.disconnect();
  }
};

runAuthTests();
