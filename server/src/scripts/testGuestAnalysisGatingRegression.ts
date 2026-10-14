import mongoose from 'mongoose';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { UserModel } from '../models/User.model.js';
import { GuestUsageModel } from '../models/GuestUsage.model.js';
import { UsageService } from '../services/usage.service.js';

async function runGuestGatingRegressionTests() {
  console.log('\n======================================================');
  console.log('🧪 GUEST ANALYSIS GATING & USAGE REGRESSION TEST');
  console.log('Validating:');
  console.log(' 1. New guest ID with no token cannot receive analysis');
  console.log(' 2. Logged-in user who used 3 analyses stays blocked after clearing storage');
  console.log(' 3. Soft IP-based cap backup (10 attempts / 24h) and hashed IP storage');
  console.log('======================================================\n');

  let isLiveDb = false;
  try {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    console.log('✅ Connected to Live MongoDB');
    isLiveDb = true;
  } catch (err: any) {
    console.log(`⚠️ Live MongoDB DNS/network unavailable (${err.message || err.code}). Running with mock DB layer.`);
  }

  // In-memory mock store if live DB is unreachable
  const mockUsers = new Map<string, any>();
  const mockGuests = new Map<string, any>();

  if (!isLiveDb) {
    // Mock UserModel
    (UserModel as any).findById = async (id: string) => mockUsers.get(id?.toString()) || null;
    (UserModel as any).findOne = async (query: any) => {
      if (query._id) return mockUsers.get(query._id?.toString()) || null;
      if (query.email) {
        for (const u of mockUsers.values()) {
          if (u.email === query.email) return u;
        }
      }
      return null;
    };
    (UserModel as any).create = async (doc: any) => {
      const objId = new mongoose.Types.ObjectId();
      const id = objId.toString();
      const user = {
        _id: objId,
        id,
        ...doc,
        save: async () => user,
      };
      mockUsers.set(id, user);
      return user;
    };

    // Mock PaymentTransactionModel
    const { PaymentTransactionModel } = await import('../models/PaymentTransaction.model.js');
    (PaymentTransactionModel as any).findOne = () => ({
      sort: () => null,
    });

    // Mock GuestUsageModel
    (GuestUsageModel as any).findOne = async (query: any) => {
      if (query.guestId) return mockGuests.get(query.guestId) || null;
      return null;
    };
    (GuestUsageModel as any).find = async (query: any) => {
      const list = [];
      for (const g of mockGuests.values()) {
        if (query.hashedIp && g.hashedIp === query.hashedIp) {
          list.push(g);
        }
      }
      return list;
    };
    (GuestUsageModel as any).create = async (doc: any) => {
      const g = {
        ...doc,
        updatedAt: new Date(),
        createdAt: new Date(),
        save: async () => g,
      };
      mockGuests.set(doc.guestId, g);
      return g;
    };
  }

  const timestamp = Date.now();
  const testEmail = `gating_test_${timestamp}@speakwise.ai`;
  let testUserId: string = '';

  try {
    // -------------------------------------------------------------------------
    // TEST 1: New guest ID with no token cannot receive an analysis
    // -------------------------------------------------------------------------
    console.log('\n[TEST 1] A new guest ID with no token cannot receive an analysis...');
    const guestId1 = `gst_regression_test_${timestamp}`;
    const mockGuestReq: any = {
      headers: {
        'x-guest-id': guestId1,
        'x-forwarded-for': '198.51.100.42',
      },
      cookies: {},
      ip: '198.51.100.42',
    };

    // Guests can query usage status to see that signing in is required for analysis
    const guestStatus = await UsageService.getUsageStatus(mockGuestReq);
    console.log(`- Guest status planType: ${guestStatus.planType} (Expected: GUEST)`);
    console.log(`- Guest status message: "${guestStatus.message}"`);
    if (guestStatus.planType !== 'GUEST') {
      throw new Error(`Expected planType GUEST, got ${guestStatus.planType}`);
    }

    // Guest tries to consume an analysis without a valid auth token
    let guestBlocked = false;
    let guestErrorCode = 0;
    let guestErrorMessage = '';

    try {
      await UsageService.consumeUsage(mockGuestReq);
    } catch (err: any) {
      guestBlocked = true;
      guestErrorCode = err.statusCode;
      guestErrorMessage = err.message;
    }

    console.log(`- Guest consume blocked: ${guestBlocked} (Status: ${guestErrorCode}, Msg: "${guestErrorMessage}")`);
    if (!guestBlocked || guestErrorCode !== 401) {
      throw new Error(`❌ FAILED TEST 1: Guest with no token was NOT blocked with 401! Blocked: ${guestBlocked}, Code: ${guestErrorCode}`);
    }
    if (!guestErrorMessage.includes('Sign in with Google to get your 3 free analyses')) {
      throw new Error(`❌ FAILED TEST 1: Unexpected error message for guest: ${guestErrorMessage}`);
    }

    // Verify no guest attempt was consumed in database
    const guestDoc = await GuestUsageModel.findOne({ guestId: guestId1 });
    const consumedAttempts = guestDoc ? (guestDoc.totalAttemptsUsed || 0) : 0;
    console.log(`- Guest attempts consumed in DB: ${consumedAttempts} (Expected: 0)`);
    if (consumedAttempts !== 0) {
      throw new Error(`❌ FAILED TEST 1: Guest attempt was consumed in DB! Got: ${consumedAttempts}`);
    }
    console.log('✅ PASSED TEST 1: Guest with no token is cleanly denied analysis and consumes 0 attempts.');

    // -------------------------------------------------------------------------
    // TEST 2: Logged-in user who used 3 analyses stays blocked after clearing storage
    // -------------------------------------------------------------------------
    console.log('\n[TEST 2] Logged-in user who used 3 analyses stays blocked after clearing browser storage...');
    
    // Create user and record 3 used analyses in their lifetime counter
    const userDoc = await UserModel.create({
      fullName: 'Gating Test Speaker',
      email: testEmail,
      passwordHash: 'dummy_hash',
      role: 'FREE_USER',
      freestyleAttemptsUsed: 3,
      guestAttemptsConsumed: 0,
    });
    testUserId = userDoc._id ? userDoc._id.toString() : userDoc.id;
    console.log(`- Created user ID ${testUserId} with 3 freestyle attempts already used`);

    // Simulate clearing browser storage: new guest ID generated by client
    const clearedStorageGuestId = `gst_cleared_storage_${timestamp}`;
    console.log(`- Simulating browser storage clear (new guest ID: ${clearedStorageGuestId})`);

    // User logs back in (request has new guest ID in header from fresh localStorage, but valid user token)
    const mockLoggedInReqAfterClear: any = {
      user: { id: testUserId, email: testEmail, role: 'FREE_USER' },
      headers: {
        'x-guest-id': clearedStorageGuestId,
        'x-forwarded-for': '203.0.113.19',
      },
      cookies: {},
      ip: '203.0.113.19',
    };

    // Check status after clearing browser storage & re-authenticating
    const statusAfterClear = await UsageService.getUsageStatus(mockLoggedInReqAfterClear);
    console.log(`- Status attemptsLeft: ${statusAfterClear.attemptsLeft} (Expected: 0)`);
    console.log(`- Status canProceed: ${statusAfterClear.canProceed} (Expected: false)`);
    console.log(`- Status message: "${statusAfterClear.message}"`);

    if (statusAfterClear.attemptsLeft !== 0 || statusAfterClear.canProceed !== false) {
      throw new Error(`❌ FAILED TEST 2: User has ${statusAfterClear.attemptsLeft} attemptsLeft after clearing storage! Expected: 0`);
    }

    // Attempt to consume analysis 4
    let userBlocked = false;
    let userErrorCode = 0;
    try {
      await UsageService.consumeUsage(mockLoggedInReqAfterClear);
    } catch (err: any) {
      userBlocked = true;
      userErrorCode = err.statusCode;
    }

    console.log(`- Consume attempt blocked: ${userBlocked} (Status: ${userErrorCode})`);
    if (!userBlocked || userErrorCode !== 402) {
      throw new Error(`❌ FAILED TEST 2: User at limit was NOT blocked with 402! Blocked: ${userBlocked}, Code: ${userErrorCode}`);
    }
    console.log('✅ PASSED TEST 2: User who used 3 analyses stays blocked even after clearing browser storage.');

    // -------------------------------------------------------------------------
    // TEST 3: Soft IP-based cap backup (10 attempts / 24h) and hashed IP privacy
    // -------------------------------------------------------------------------
    console.log('\n[TEST 3] Soft IP-based cap backup (10 attempts per 24h per hashed IP)...');
    const rawTestIp = '198.51.100.99';
    const hashedIp = crypto.createHash('sha256').update(rawTestIp).digest('hex');

    // Verify raw IP is never equal to hashed IP
    if (hashedIp === rawTestIp || hashedIp.length !== 64) {
      throw new Error('❌ FAILED TEST 3: IP hashing did not produce 64-char SHA-256 hash');
    }

    // Create 10 guest usage attempts under this hashed IP
    await GuestUsageModel.create({
      guestId: `gst_ip_test_${timestamp}`,
      dailyAttemptsUsed: 10,
      totalAttemptsUsed: 10,
      hashedIp,
      lastResetDate: new Date(),
    });

    // Check rate limit check helper
    const isLimited = await UsageService.isGuestIpRateLimited(hashedIp);
    console.log(`- IP rate limit detected for hashed IP: ${isLimited} (Expected: true)`);
    if (!isLimited) {
      throw new Error('❌ FAILED TEST 3: IP soft cap did not trigger at 10 attempts');
    }

    // Verify request from this IP is rejected by soft IP cap
    const mockRateLimitedReq: any = {
      headers: {
        'x-guest-id': `gst_another_ip_guest_${timestamp}`,
        'x-forwarded-for': rawTestIp,
      },
      cookies: {},
      ip: rawTestIp,
    };

    let ipCapBlocked = false;
    let ipCapErrorCode = 0;
    try {
      await UsageService.consumeUsage(mockRateLimitedReq);
    } catch (err: any) {
      ipCapBlocked = true;
      ipCapErrorCode = err.statusCode;
    }

    console.log(`- Request beyond 10 attempts per IP blocked: ${ipCapBlocked} (Status: ${ipCapErrorCode})`);
    if (!ipCapBlocked || ipCapErrorCode !== 429) {
      throw new Error(`❌ FAILED TEST 3: Soft IP cap did not block with 429! Blocked: ${ipCapBlocked}, Code: ${ipCapErrorCode}`);
    }
    console.log('✅ PASSED TEST 3: Soft IP cap cleanly blocks guest analysis attempts beyond 10 per 24h.');

    console.log('\n======================================================');
    console.log('🎉 ALL REGRESSION TESTS PASSED SUCCESSFULLY!');
    console.log('======================================================\n');
  } finally {
    if (isLiveDb) {
      if (testUserId) {
        await UserModel.findByIdAndDelete(testUserId).catch(() => {});
      }
      await GuestUsageModel.deleteMany({
        guestId: new RegExp(`(regression_test|cleared_storage|ip_test)_${timestamp}`),
      }).catch(() => {});
      await mongoose.disconnect();
    }
  }
}

runGuestGatingRegressionTests().catch((err) => {
  console.error('\n❌ REGRESSION TEST RUNNER FAILED:', err);
  process.exit(1);
});
