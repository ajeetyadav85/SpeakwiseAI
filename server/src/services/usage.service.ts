import { Request, Response } from 'express';
import crypto from 'crypto';
import { GuestUsageModel, IGuestUsage } from '../models/GuestUsage.model.js';
import { UserModel, IUser } from '../models/User.model.js';
import { logger } from '../utils/logger.js';

export interface UsageStatusResult {
  planType: 'GUEST' | 'FREESTYLE' | 'PRO';
  attemptsUsed: number;
  attemptsLeft: number;
  maxAttempts: number;
  canProceed: boolean;
  isPro: boolean;
  message?: string;
  planId?: string;
  expiresAt?: string;
}

export class UsageService {
  /**
   * Get or set persistent guest cookie ID
   */
  static getOrCreateGuestId(req: Request, res?: Response): string {
    let guestId = req.cookies?.speakwise_guest_id || (req.headers['x-guest-id'] as string);
    if (!guestId) {
      guestId = 'gst_' + crypto.randomBytes(12).toString('hex');
      if (res) {
        res.cookie('speakwise_guest_id', guestId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
          sameSite: 'lax',
        });
      }
    }
    return guestId;
  }

  /**
   * Calculate usage status for a guest or authenticated user
   */
  static async getUsageStatus(req: Request, res?: Response): Promise<UsageStatusResult> {
    const userId = req.user?.id;
    let user: IUser | null = null;

    if (userId) {
      try {
        user = await UserModel.findById(userId);
      } catch (e) {
        logger.warn('Error fetching user for usage check', e);
      }
    }

    // 1. Pro User (Unlimited)
    if (user && (user.role === 'PRO_USER' || user.role === 'SUPER_ADMIN' || user.role === 'ORG_ADMIN')) {
      if (user.role === 'PRO_USER' && user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt).getTime() <= Date.now()) {
        logger.info(`[USAGE] Pro subscription expired for user ${user._id} on ${user.subscriptionExpiresAt.toISOString()}. Downgrading to FREESTYLE_USER.`);
        user.role = 'FREESTYLE_USER';
        await user.save().catch((err) => logger.error('Error auto-downgrading expired user', err));
      } else {
        return {
          planType: 'PRO',
          attemptsUsed: 0,
          attemptsLeft: 9999,
          maxAttempts: 9999,
          canProceed: true,
          isPro: true,
          planId: user.subscriptionPlan,
          expiresAt: user.subscriptionExpiresAt ? user.subscriptionExpiresAt.toISOString() : undefined,
        };
      }
    }

    // 2. Logged-In User (Freestyle Plan - 10 Total Free Uses including Guest Uses)
    if (user) {
      const guestUsed = user.guestAttemptsConsumed || 0;
      const freestyleUsed = user.freestyleAttemptsUsed || 0;
      const totalUsed = guestUsed + freestyleUsed;
      const maxAttempts = 10;
      const attemptsLeft = Math.max(0, maxAttempts - totalUsed);

      return {
        planType: 'FREESTYLE',
        attemptsUsed: totalUsed,
        attemptsLeft,
        maxAttempts,
        canProceed: attemptsLeft > 0,
        isPro: false,
        message: attemptsLeft > 0 
          ? `Freestyle: ${attemptsLeft} uses remaining`
          : "You've reached your 10 Free Freestyle uses limit. Upgrade to Pro Plan starting at ₹99 for Unlimited access!",
      };
    }

    // 3. Guest / Free Visitor (3 Attempts per day)
    const guestId = this.getOrCreateGuestId(req, res);
    let guestDoc: IGuestUsage | null = null;

    try {
      guestDoc = await GuestUsageModel.findOne({ guestId });
    } catch (e) {
      logger.warn('MongoDB not available for guest usage check, fallback to memory state');
    }

    const today = new Date().toISOString().split('T')[0];
    let dailyUsed = 0;

    if (guestDoc) {
      const lastReset = new Date(guestDoc.lastResetDate).toISOString().split('T')[0];
      if (lastReset !== today) {
        // Daily reset
        dailyUsed = 0;
        try {
          guestDoc.dailyAttemptsUsed = 0;
          guestDoc.lastResetDate = new Date();
          await guestDoc.save();
        } catch (e) {}
      } else {
        dailyUsed = guestDoc.dailyAttemptsUsed || 0;
      }
    }

    const maxAttempts = 3;
    const attemptsLeft = Math.max(0, maxAttempts - dailyUsed);

    return {
      planType: 'GUEST',
      attemptsUsed: dailyUsed,
      attemptsLeft,
      maxAttempts,
      canProceed: attemptsLeft > 0,
      isPro: false,
      message: attemptsLeft > 0
        ? `Free uses remaining today: ${attemptsLeft}/${maxAttempts}`
        : "You've used your 3 free guest uses. Sign Up or Log In to get 10 Free Freestyle uses!",
    };
  }

  /**
   * Consume 1 attempt for guest or user. Throws error if limit reached.
   */
  static async consumeUsage(req: Request, res?: Response): Promise<UsageStatusResult> {
    const status = await this.getUsageStatus(req, res);

    if (!status.canProceed) {
      const err: any = new Error(
        status.planType === 'GUEST'
          ? "You've used your 3 free guest uses. Sign Up or Log In to get 10 Free Freestyle uses!"
          : "You've reached your 10 Free Freestyle uses limit. Upgrade to Pro Plan starting at ₹99 for Unlimited access!"
      );
      err.statusCode = 402;
      throw err;
    }

    const userId = req.user?.id;
    if (userId) {
      try {
        const user = await UserModel.findById(userId);
        if (user) {
          user.freestyleAttemptsUsed = (user.freestyleAttemptsUsed || 0) + 1;
          await user.save();
        }
      } catch (e) {}
    } else {
      const guestId = this.getOrCreateGuestId(req, res);
      try {
        await GuestUsageModel.findOneAndUpdate(
          { guestId },
          {
            $inc: { dailyAttemptsUsed: 1, totalAttemptsUsed: 1 },
            $setOnInsert: { lastResetDate: new Date(), ipAddress: req.ip || '' },
          },
          { upsert: true, new: true }
        );
      } catch (e) {}
    }

    return await this.getUsageStatus(req, res);
  }

  /**
   * Transfer guest attempt count to newly created or logged-in user account
   */
  static async transferGuestUsageToUser(guestId: string, userId: string): Promise<void> {
    if (!guestId || !userId) return;
    try {
      const guestDoc = await GuestUsageModel.findOne({ guestId });
      if (guestDoc && guestDoc.totalAttemptsUsed > 0) {
        const user = await UserModel.findById(userId);
        if (user && (!user.guestAttemptsConsumed || user.guestAttemptsConsumed < guestDoc.totalAttemptsUsed)) {
          user.guestId = guestId;
          user.guestAttemptsConsumed = guestDoc.totalAttemptsUsed;
          await user.save();
          logger.info(`Transferred ${guestDoc.totalAttemptsUsed} guest attempts from ${guestId} to User ${userId}`);
        }
      }
    } catch (e) {
      logger.warn('Failed to transfer guest usage to user', e);
    }
  }
}
