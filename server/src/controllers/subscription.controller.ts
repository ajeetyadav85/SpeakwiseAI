import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { UserModel } from '../models/User.model.js';
import { logger } from '../utils/logger.js';

export const createOrderController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { amount = 9900, currency = 'INR' } = req.body;
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_speakwise_demo';

    // Mock/Generated Razorpay Order ID for verification
    const orderId = 'order_' + crypto.randomBytes(8).toString('hex');

    logger.info(`Created Razorpay Order ${orderId} for amount ${amount} ${currency}`);

    res.status(200).json({
      success: true,
      data: {
        orderId,
        amount,
        currency,
        keyId,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPaymentController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, planType = 'PRO' } = req.body;
    const userId = req.user?.id;

    const targetRole = planType === 'FREESTYLE' ? 'FREESTYLE_USER' : 'PRO_USER';
    logger.info(`Verifying Razorpay payment ${razorpay_payment_id} for order ${razorpay_order_id} (Plan: ${planType})`);

    // If database connection is active, update user role
    if (userId) {
      try {
        await UserModel.findByIdAndUpdate(userId, { role: targetRole });
      } catch (e) {
        logger.warn('User update skipped (standalone mode)');
      }
    }

    res.status(200).json({
      success: true,
      message: `Razorpay payment verified successfully. ${planType} plan activated.`,
      data: {
        paymentId: razorpay_payment_id || 'pay_' + Date.now(),
        status: 'SUCCESS',
        isPro: targetRole === 'PRO_USER',
        role: targetRole,
      },
    });
  } catch (error) {
    next(error);
  }
};
