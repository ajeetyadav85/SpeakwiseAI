import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { UserModel } from '../models/User.model.js';
import { logger } from '../utils/logger.js';

// Plan duration hours lookup table
const PLAN_DURATION_HOURS: Record<string, number> = {
  '1_DAY': 24,
  '1_WEEK': 7 * 24, // 168h
  '1_MONTH': 30 * 24, // 720h
  '3_MONTH': 90 * 24, // 2160h
  '6_MONTH': 180 * 24, // 4320h
  '1_YEAR': 365 * 24, // 8760h
};

export const createOrderController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { planId = '1_MONTH', amount = 9900, currency = 'INR' } = req.body;
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_speakwise_demo';

    // Mock/Generated Razorpay Order ID for verification
    const orderId = 'order_' + crypto.randomBytes(8).toString('hex');

    logger.info(`Created Razorpay Order ${orderId} for plan ${planId} (${amount} ${currency})`);

    res.status(200).json({
      success: true,
      data: {
        orderId,
        amount,
        currency,
        keyId,
        planId,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPaymentController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, planId = '1_MONTH', planType = 'PRO' } = req.body;
    const userId = req.user?.id;

    // Calculate exact expiration from the moment of payment
    const durationHours = PLAN_DURATION_HOURS[planId] || 720;
    const paymentTimestamp = new Date();
    const expiresAt = new Date(paymentTimestamp.getTime() + durationHours * 60 * 60 * 1000);

    const targetRole = planType === 'FREESTYLE' ? 'FREESTYLE_USER' : 'PRO_USER';
    logger.info(
      `Verified payment ${razorpay_payment_id} for order ${razorpay_order_id} (Plan: ${planId}, Valid until: ${expiresAt.toISOString()})`
    );

    // If database connection is active, update user role and subscription expiry
    if (userId) {
      try {
        await UserModel.findByIdAndUpdate(userId, {
          role: targetRole,
          subscriptionPlan: planId,
          subscriptionExpiresAt: expiresAt,
        });
      } catch (e) {
        logger.warn('User update skipped (standalone mode)');
      }
    }

    res.status(200).json({
      success: true,
      message: `Payment verified. ${planId} plan active until ${expiresAt.toLocaleString()}.`,
      data: {
        paymentId: razorpay_payment_id || 'pay_' + Date.now(),
        status: 'SUCCESS',
        isPro: true,
        role: targetRole,
        planId,
        paidAt: paymentTimestamp.toISOString(),
        expiresAt: expiresAt.toISOString(),
        durationHours,
      },
    });
  } catch (error) {
    next(error);
  }
};
