import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { env } from '../config/env.js';
import { UserModel } from '../models/User.model.js';
import { PaymentTransactionModel } from '../models/PaymentTransaction.model.js';
import { logger } from '../utils/logger.js';

// =========================================================================
// CRITICAL MONETIZATION RULE (REGRESSION GUARD):
// 'TRIAL_7_DAYS' MUST be explicitly mapped (168 hours). Missing it defaults
// to 720h (30 days), breaking trial validity calculations!
// =========================================================================
const PLAN_DURATION_HOURS: Record<string, number> = {
  'TRIAL_7_DAYS': 7 * 24, // 168h
  '1_DAY': 24,
  '1_WEEK': 7 * 24, // 168h
  '1_MONTH': 30 * 24, // 720h
  '3_MONTH': 90 * 24, // 2160h
  '6_MONTH': 180 * 24, // 4320h
  '1_YEAR': 365 * 24, // 8760h
  'PRO_MONTHLY': 720,
};

// Plan price in INR rupees
const PLAN_PRICES_INR: Record<string, number> = {
  'TRIAL_7_DAYS': 1,
  '1_DAY': 9,
  '1_WEEK': 49,
  '1_MONTH': 99,
  '3_MONTH': 199,
  '6_MONTH': 299,
  '1_YEAR': 599,
  'PRO_MONTHLY': 99,
};

const getRazorpayInstance = (): Razorpay | null => {
  const keyId = env.RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;

  if (keyId && keySecret) {
    try {
      return new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    } catch (e: any) {
      logger.warn(`[PAYMENT] Failed to initialize Razorpay SDK: ${e?.message}`);
    }
  }
  return null;
};

/**
 * 1. Create Razorpay Order
 * Route: POST /api/create-order or /api/v1/subscription/create-order
 * Request: { amount (paise), currency, receipt, planId }
 * Return: { order_id, amount, currency, ... }
 */
export const createOrderController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { planId = '1_MONTH', currency = 'INR', receipt, amount } = req.body;

    // =========================================================================
    // CRITICAL USER EXISTENCE GUARD (PAYMENT SEQUENCING):
    // A subscription order can NEVER be created unless the user is authenticated
    // and their user record genuinely exists in MongoDB.
    // =========================================================================
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!userId && !userEmail) {
      res.status(401).json({
        success: false,
        code: 'AUTH_REQUIRED',
        error: 'Please log in or register before purchasing a subscription.',
      });
      return;
    }

    let dbUser = userId ? await UserModel.findById(userId) : null;
    if (!dbUser && userEmail) {
      dbUser = await UserModel.findOne({ email: userEmail.toLowerCase().trim() });
    }

    if (!dbUser) {
      logger.warn(`[PAYMENT] createOrder rejected: User record not found in MongoDB for userId: ${userId}, email: ${userEmail}`);
      res.status(401).json({
        success: false,
        code: 'USER_NOT_FOUND',
        error: 'User account not found in database. Please log in before purchasing a subscription.',
      });
      return;
    }

    // Determine amount in paise (minimum 100 paise = ₹1.00)
    let amountInPaise: number;
    let planPriceInr: number;

    if (planId === 'TRIAL_7_DAYS') {
      if (dbUser.hasUsedTrialOffer || dbUser.subscriptionPlan) {
        res.status(400).json({
          success: false,
          error: 'The ₹1 for 7 days trial offer is only valid once for first-time new users.',
        });
        return;
      }
      planPriceInr = 1;
      amountInPaise = 100;
    } else if (amount !== undefined && amount !== null) {
      amountInPaise = Number(amount);
      planPriceInr = Math.round(amountInPaise / 100);
    } else {
      planPriceInr = PLAN_PRICES_INR[planId] || 99;
      amountInPaise = planPriceInr * 100;
    }

    // Minimum amount validation
    if (!amountInPaise || isNaN(amountInPaise) || amountInPaise < 100) {
      res.status(400).json({
        success: false,
        error: 'Amount must be at least 100 paise (₹1.00)',
      });
      return;
    }

    const keyId = env.RAZORPAY_KEY_ID;
    const razorpay = getRazorpayInstance();

    if (!razorpay) {
      logger.error('[PAYMENT] Razorpay SDK is not initialized. Verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
      res.status(500).json({
        success: false,
        error: 'Payment gateway configuration error: Razorpay SDK not initialized',
      });
      return;
    }

    try {
      const orderReceipt = receipt || `rcpt_${planId.toLowerCase()}_${Date.now().toString().slice(-8)}`;
      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: currency || 'INR',
        receipt: orderReceipt,
        notes: {
          planId,
          userId: dbUser._id.toString(),
          userEmail: dbUser.email,
        },
      });

      const orderId = order.id;
      logger.info(`[PAYMENT] Created Razorpay order: ${orderId} for amount ${amountInPaise} paise (${currency}) bound to user ${dbUser._id}`);

      res.status(200).json({
        success: true,
        order_id: orderId,
        orderId: orderId,
        id: orderId,
        amount: order.amount || amountInPaise,
        currency: order.currency || currency || 'INR',
        key_id: keyId,
        keyId: keyId,
        receipt: orderReceipt,
        data: {
          order_id: orderId,
          orderId: orderId,
          id: orderId,
          amount: order.amount || amountInPaise,
          amountInr: planPriceInr,
          currency: order.currency || currency || 'INR',
          keyId,
          planId,
        },
      });
    } catch (razorpayErr: any) {
      logger.error(`[PAYMENT] Razorpay orders.create API error: ${razorpayErr?.message || razorpayErr}`);
      res.status(razorpayErr?.statusCode || 500).json({
        success: false,
        error: razorpayErr?.error?.description || razorpayErr?.message || 'Failed to create Razorpay order',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Verify Payment Signature & Upgrade Subscription
 * Route: POST /api/verify-payment or /api/v1/subscription/verify-payment
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 * Compare generated signature with razorpay_signature
 * Return success only if signatures match
 */
export const verifyPaymentController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      planId = '1_MONTH',
      planType = 'PRO',
      paymentMethod = 'RAZORPAY_GATEWAY',
      userEmail,
      userName,
      currentExpiresAt,
    } = req.body;

    // 1. Missing fields check: return 400
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({
        success: false,
        error: 'Missing required payment verification fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.',
      });
      return;
    }

    const keySecret = env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      res.status(500).json({
        success: false,
        error: 'Razorpay secret key is not configured on the server',
      });
      return;
    }

    // 2. Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    // Compare generated signature with razorpay_signature
    let isMatch = false;
    if (expectedSignature.length === razorpay_signature.length) {
      isMatch = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf-8'),
        Buffer.from(razorpay_signature, 'utf-8')
      );
    }

    // Signature mismatch: return 400, do NOT mark as paid
    if (!isMatch) {
      logger.warn(`[PAYMENT] ❌ Signature verification failed for order ${razorpay_order_id}`);
      res.status(400).json({
        success: false,
        error: 'Payment verification failed: Invalid signature',
      });
      return;
    }

    logger.info(`[PAYMENT] ✅ HMAC-SHA256 Signature verified for order ${razorpay_order_id}`);

    // 3. Mark as paid in database & stack subscription onto existing expiry
    const userId = req.user?.id;
    const effectiveEmail = req.user?.email || userEmail;
    const effectiveName = req.user?.fullName || userName || 'Valued Speaker';

    if (!userId && !effectiveEmail) {
      res.status(401).json({
        success: false,
        code: 'AUTH_REQUIRED',
        error: 'User authentication required to verify payment.',
      });
      return;
    }

    // Fetch existing user from MongoDB - user MUST genuinely exist!
    let existingUser: any = null;
    if (userId) {
      existingUser = await UserModel.findById(userId);
    }
    if (!existingUser && effectiveEmail) {
      existingUser = await UserModel.findOne({ email: effectiveEmail.toLowerCase().trim() });
    }

    // =========================================================================
    // CRITICAL USER EXISTENCE GUARD:
    // A subscription payment can NEVER be mapped or verified against a non-existent
    // or deleted database record.
    // =========================================================================
    if (!existingUser) {
      logger.warn(`[PAYMENT] Payment verification rejected: user record not found in MongoDB for userId: ${userId}, email: ${effectiveEmail}`);
      res.status(401).json({
        success: false,
        code: 'USER_NOT_FOUND',
        error: 'User account not found in database. Cannot map subscription to a non-existent user. Please log in or sign up.',
      });
      return;
    }

    const durationHours = PLAN_DURATION_HOURS[planId] || 720;
    const planPriceInr = PLAN_PRICES_INR[planId] || 99;
    const paymentTimestamp = new Date();
    const nowMs = paymentTimestamp.getTime();
    let baseTimeMs = nowMs;

    let expiresAt: Date;
    let finalPlanStartsAt: Date = paymentTimestamp;
    let finalTrialEndsAt: Date | null = null;

    if (planId === 'TRIAL_7_DAYS') {
      const trialHours = 168;
      finalTrialEndsAt = new Date(nowMs + trialHours * 3600 * 1000);
      expiresAt = finalTrialEndsAt;

      existingUser.role = 'PRO_USER';
      existingUser.hasUsedTrialOffer = true;
      existingUser.trialEndsAt = finalTrialEndsAt;
      existingUser.planStartsAt = paymentTimestamp;
      existingUser.subscriptionPlan = 'TRIAL_7_DAYS';
      existingUser.subscriptionExpiresAt = expiresAt;
      await existingUser.save();
      logger.info(`[PAYMENT] Activated ₹1 7-Day trial for user ${existingUser._id} until ${expiresAt.toISOString()}`);
    } else {
      const isTrialActive = existingUser?.trialEndsAt && new Date(existingUser.trialEndsAt).getTime() > nowMs;
      if (isTrialActive) {
        finalPlanStartsAt = new Date(existingUser.trialEndsAt);
        baseTimeMs = finalPlanStartsAt.getTime();
        finalTrialEndsAt = existingUser.trialEndsAt;
        logger.info(`[PAYMENT] ⏱️ User has active trial ending ${existingUser.trialEndsAt.toISOString()}. Stacking plan ${planId} to start on ${finalPlanStartsAt.toISOString()}`);
      } else if (existingUser?.subscriptionExpiresAt) {
        const currentExpiryMs = new Date(existingUser.subscriptionExpiresAt).getTime();
        if (currentExpiryMs > nowMs) {
          baseTimeMs = currentExpiryMs;
          finalPlanStartsAt = new Date(currentExpiryMs);
        }
      } else if (currentExpiresAt) {
        const clientExpiryMs = new Date(currentExpiresAt).getTime();
        if (!isNaN(clientExpiryMs) && clientExpiryMs > nowMs) {
          baseTimeMs = clientExpiryMs;
          finalPlanStartsAt = new Date(clientExpiryMs);
        }
      }

      expiresAt = new Date(baseTimeMs + durationHours * 3600 * 1000);

      existingUser.role = 'PRO_USER';
      existingUser.subscriptionPlan = planId;
      existingUser.planStartsAt = finalPlanStartsAt;
      existingUser.subscriptionExpiresAt = expiresAt;
      await existingUser.save();
      logger.info(`[PAYMENT] Upgraded user ${existingUser._id} to plan ${planId}, active until ${expiresAt.toISOString()}`);
    }

    // Record Transaction into MongoDB
    let savedTransaction: any = null;
    try {
      savedTransaction = await PaymentTransactionModel.create({
        userId: existingUser._id,
        userEmail: existingUser.email,
        userName: existingUser.fullName || effectiveName,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        planId,
        amount: planPriceInr,
        currency: 'INR',
        status: 'SUCCESS',
        paymentMethod: paymentMethod || 'RAZORPAY_GATEWAY',
        durationHours,
        paidAt: paymentTimestamp,
        expiresAt,
        notes: {
          planType,
          verifiedAt: paymentTimestamp.toISOString(),
          isSignatureVerified: true,
          stackedFromPreviousExpiry: baseTimeMs !== nowMs,
          planStartsAt: finalPlanStartsAt.toISOString(),
          ...(finalTrialEndsAt ? { trialEndsAt: finalTrialEndsAt.toISOString() } : {}),
        },
      });
      logger.info(`[PAYMENT] Saved PaymentTransaction ${savedTransaction._id} to MongoDB`);
    } catch (dbErr: any) {
      logger.error(`[PAYMENT] Failed saving transaction to DB: ${dbErr?.message}`);
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        transactionId: savedTransaction?._id || razorpay_payment_id,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        status: 'SUCCESS',
        isSignatureVerified: true,
        isPro: true,
        planId,
        paidAt: paymentTimestamp.toISOString(),
        expiresAt: expiresAt.toISOString(),
        trialEndsAt: finalTrialEndsAt ? finalTrialEndsAt.toISOString() : undefined,
        planStartsAt: finalPlanStartsAt ? finalPlanStartsAt.toISOString() : undefined,
        durationHours,
        amountInr: planPriceInr,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Razorpay Asynchronous Webhook Endpoint
 * Route: POST /api/v1/subscription/webhook
 */
export const razorpayWebhookController = async (req: Request, res: Response): Promise<void> => {
  try {
    const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'] as string;

    console.log(`\n======================================================`);
    console.log(`[RAZORPAY WEBHOOK] Received Webhook Event`);

    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    if (signature && webhookSecret) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        console.warn(`[RAZORPAY WEBHOOK] ❌ Webhook signature verification failed!`);
        res.status(400).json({ status: 'signature_verification_failed' });
        return;
      }
      console.log(`[RAZORPAY WEBHOOK] ✅ Webhook Signature Verified.`);
    }

    const event = req.body?.event;
    const payload = req.body?.payload;

    console.log(`[RAZORPAY WEBHOOK] Event: ${event}`);

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload?.payment?.entity || {};
      const paymentId = paymentEntity.id;
      const orderId = paymentEntity.order_id;
      const amountInInr = (paymentEntity.amount || 9900) / 100;
      const email = paymentEntity.email || 'user@speakwise.ai';
      const notes = paymentEntity.notes || {};
      const planId = notes.planId || '1_MONTH';
      const durationHours = PLAN_DURATION_HOURS[planId] || 720;
      const paymentTimestamp = new Date();
      const nowMs = paymentTimestamp.getTime();
      let baseTimeMs = nowMs;

      // Check if existing user has active subscription to stack
      let existingUser: any = null;
      if (notes.userId && notes.userId !== 'guest') {
        existingUser = await UserModel.findById(notes.userId).catch(() => null);
      }
      if (!existingUser && email) {
        existingUser = await UserModel.findOne({ email: email.toLowerCase().trim() }).catch(() => null);
      }

      let expiresAt: Date;
      let finalPlanStartsAt: Date = paymentTimestamp;
      let finalTrialEndsAt: Date | null = null;

      // =========================================================================
      // CRITICAL MONETIZATION RULE (REGRESSION GUARD):
      // Stacking logic in Webhook MUST match verifyPaymentController:
      // (1) TRIAL_7_DAYS must set hasUsedTrialOffer and trialEndsAt.
      // (2) If a user buys a regular plan during active trial, planStartsAt = trialEndsAt
      //     and duration stacks onto trial end, NOT starting immediately.
      // =========================================================================
      if (planId === 'TRIAL_7_DAYS') {
        const trialHours = 168;
        finalTrialEndsAt = new Date(nowMs + trialHours * 3600 * 1000);
        expiresAt = finalTrialEndsAt;

        if (existingUser) {
          try {
            existingUser.role = 'PRO_USER';
            existingUser.hasUsedTrialOffer = true;
            existingUser.trialEndsAt = finalTrialEndsAt;
            existingUser.planStartsAt = paymentTimestamp;
            existingUser.subscriptionPlan = 'TRIAL_7_DAYS';
            existingUser.subscriptionExpiresAt = expiresAt;
            await existingUser.save();
            console.log(`[RAZORPAY WEBHOOK] ✅ Activated trial for user ${existingUser._id} until ${expiresAt.toISOString()}`);
          } catch (uErr: any) {
            console.error(`[RAZORPAY WEBHOOK] Failed to update user trial in DB: ${uErr?.message}`);
          }
        }
      } else {
        const isTrialActive = existingUser?.trialEndsAt && new Date(existingUser.trialEndsAt).getTime() > nowMs;
        if (isTrialActive) {
          finalPlanStartsAt = new Date(existingUser.trialEndsAt);
          baseTimeMs = finalPlanStartsAt.getTime();
          finalTrialEndsAt = existingUser.trialEndsAt;
          console.log(`[RAZORPAY WEBHOOK] ⏱️ User has active trial ending ${existingUser.trialEndsAt.toISOString()}. Stacking plan ${planId} to start on ${finalPlanStartsAt.toISOString()}`);
        } else if (existingUser?.subscriptionExpiresAt) {
          const currentExpiryMs = new Date(existingUser.subscriptionExpiresAt).getTime();
          if (currentExpiryMs > nowMs) {
            baseTimeMs = currentExpiryMs;
            finalPlanStartsAt = new Date(currentExpiryMs);
            console.log(`[RAZORPAY WEBHOOK] ⏱️ Stacking subscription for user ${existingUser._id}: adding ${durationHours}h onto existing expiry`);
          }
        }

        expiresAt = new Date(baseTimeMs + durationHours * 3600 * 1000);

        if (existingUser) {
          try {
            existingUser.role = 'PRO_USER';
            existingUser.subscriptionPlan = planId;
            existingUser.planStartsAt = finalPlanStartsAt;
            existingUser.subscriptionExpiresAt = expiresAt;
            await existingUser.save();
            console.log(`[RAZORPAY WEBHOOK] ✅ Extended user ${existingUser._id} to PRO_USER until ${expiresAt.toISOString()}`);
          } catch (uErr: any) {
            console.error(`[RAZORPAY WEBHOOK] Failed to update user in DB: ${uErr?.message}`);
          }
        }
      }

      // Record in MongoDB
      try {
        await PaymentTransactionModel.findOneAndUpdate(
          { paymentId },
          {
            userId: existingUser?._id,
            userEmail: email,
            orderId: orderId || `order_${Date.now()}`,
            paymentId,
            planId,
            amount: amountInInr,
            currency: 'INR',
            status: 'SUCCESS',
            paymentMethod: paymentEntity.method || 'RAZORPAY_WEBHOOK',
            durationHours,
            paidAt: paymentTimestamp,
            expiresAt,
            notes: { event, webhookReceived: true, stacked: baseTimeMs !== nowMs },
          },
          { upsert: true, new: true }
        );
        console.log(`[RAZORPAY WEBHOOK] ✅ Transaction recorded in MongoDB for ${email}`);
      } catch (err: any) {
        console.error(`[RAZORPAY WEBHOOK DB ERROR] ${err?.message}`);
      }
    }

    console.log(`======================================================\n`);
    res.status(200).json({ status: 'ok' });
  } catch (error: any) {
    console.error(`[RAZORPAY WEBHOOK ERROR] ${error?.message}`);
    res.status(500).json({ error: error?.message });
  }
};

/**
 * 4. Get Payment History
 * Route: GET /api/v1/subscription/history
 */
export const getPaymentHistoryController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    const query: any = {};
    if (userId) query.userId = userId;
    else if (userEmail) query.userEmail = userEmail;

    const transactions = await PaymentTransactionModel.find(query).sort({ createdAt: -1 }).limit(20);

    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};
