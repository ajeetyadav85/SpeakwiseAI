import { Request, Response } from 'express';
import crypto from 'crypto';
import { GuestUsageModel, IGuestUsage } from '../models/GuestUsage.model.js';
import { UserModel, IUser } from '../models/User.model.js';
import { PaymentTransactionModel } from '../models/PaymentTransaction.model.js';
import { UnauthorizedError } from '../utils/errors.js';
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
  isTrialEligible?: boolean;
  trialEndsAt?: string;
  planStartsAt?: string;
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
      user = await UserModel.findById(userId);
      if (!user && req.user?.email) {
        user = await UserModel.findOne({ email: req.user.email.toLowerCase().trim() });
      }
      if (!user && !req.headers['x-demo-user-id']) {
        throw new UnauthorizedError('User account not found. Session expired.');
      }
    }

    // =========================================================================
    // CRITICAL REVENUE-SAFETY RULE (REGRESSION GUARD):
    // NEVER grant Pro access simply because user.role === 'PRO_USER'.
    // Pro access MUST strictly require a verified future expiry date:
    // subscriptionExpiresAt > now (paid plan) OR trialEndsAt > now (active trial),
    // unless the user has administrative privileges (SUPER_ADMIN / ORG_ADMIN).
    // Users with role 'PRO_USER' but null/expired dates must be downgraded to 'FREE_USER'.
    // =========================================================================
    // 1. Pro User Verification (Admin or active paid/trial subscription with future expiration)
    if (user) {
      const now = Date.now();
      const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ORG_ADMIN';
      const hasActiveSub = Boolean(
        user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt).getTime() > now
      );
      const hasActiveTrial = Boolean(
        user.trialEndsAt && new Date(user.trialEndsAt).getTime() > now
      );

      if (isAdmin || hasActiveSub || hasActiveTrial) {
        return {
          planType: 'PRO',
          attemptsUsed: 0,
          attemptsLeft: 9999,
          maxAttempts: 9999,
          canProceed: true,
          isPro: true,
          planId: user.subscriptionPlan || (hasActiveTrial ? 'TRIAL_7_DAYS' : undefined),
          expiresAt: user.subscriptionExpiresAt ? user.subscriptionExpiresAt.toISOString() : undefined,
          trialEndsAt: user.trialEndsAt ? user.trialEndsAt.toISOString() : undefined,
          planStartsAt: user.planStartsAt ? user.planStartsAt.toISOString() : undefined,
          isTrialEligible: false,
        };
      }

      // Auto-reconcile with active PaymentTransaction in case user was recreated or payment arrived before user doc
      const activeTx = await PaymentTransactionModel.findOne({
        $or: [
          { userId: user._id },
          { userEmail: user.email.toLowerCase().trim() },
        ],
        status: 'SUCCESS',
        expiresAt: { $gt: new Date() },
      }).sort({ expiresAt: -1 });

      if (activeTx) {
        user.role = 'PRO_USER';
        user.subscriptionPlan = activeTx.planId;
        user.subscriptionExpiresAt = activeTx.expiresAt;
        if (activeTx.notes?.trialEndsAt) {
          user.trialEndsAt = new Date(activeTx.notes.trialEndsAt);
          user.hasUsedTrialOffer = true;
        }
        if (activeTx.notes?.planStartsAt) {
          user.planStartsAt = new Date(activeTx.notes.planStartsAt);
        }
        if (!activeTx.userId) {
          activeTx.userId = user._id;
          await activeTx.save().catch(() => {});
        }
        await user.save().catch(() => {});

        return {
          planType: 'PRO',
          attemptsUsed: 0,
          attemptsLeft: 9999,
          maxAttempts: 9999,
          canProceed: true,
          isPro: true,
          planId: user.subscriptionPlan,
          expiresAt: user.subscriptionExpiresAt?.toISOString(),
          trialEndsAt: user.trialEndsAt?.toISOString(),
          planStartsAt: user.planStartsAt?.toISOString(),
          isTrialEligible: false,
        };
      }

      // If user had role PRO_USER but has no active subscription or trial, fix their role in DB
      if (user.role === 'PRO_USER') {
        logger.info(`[USAGE] User ${user._id} (${user.email}) has role PRO_USER without active subscription/trial. Downgrading to FREE_USER.`);
        user.role = 'FREE_USER';
        await user.save().catch((err) => logger.error('Error auto-downgrading user without active sub', err));
      }
    }

    // 2. Logged-In User (Free Plan - 3 Total Lifetime Free Uses including Guest Uses)
    if (user) {
      const guestUsed = user.guestAttemptsConsumed || 0;
      const freestyleUsed = user.freestyleAttemptsUsed || 0;
      const totalUsed = guestUsed + freestyleUsed;
      const maxAttempts = 3;
      const attemptsLeft = Math.max(0, maxAttempts - totalUsed);

      return {
        planType: 'FREESTYLE',
        attemptsUsed: totalUsed,
        attemptsLeft,
        maxAttempts,
        canProceed: attemptsLeft > 0,
        isPro: false,
        isTrialEligible: !user.hasUsedTrialOffer && !user.subscriptionPlan,
        message: attemptsLeft > 0 
          ? `${attemptsLeft} of 3 free speech analyses remaining`
          : "All 3 free speech analyses used. Activate the ₹1 7-Day Pro trial or upgrade to Pro for unlimited access!",
      };
    }

    // 3. Guest / Free Visitor (3 Lifetime Free Attempts)
    const guestId = this.getOrCreateGuestId(req, res);
    let guestDoc: IGuestUsage | null = null;

    try {
      guestDoc = await GuestUsageModel.findOne({ guestId });
    } catch (e) {
      logger.warn('MongoDB not available for guest usage check, fallback to memory state');
    }

    const guestUsed = guestDoc ? Math.max(guestDoc.totalAttemptsUsed || 0, guestDoc.dailyAttemptsUsed || 0) : 0;
    const maxAttempts = 3;
    const attemptsLeft = Math.max(0, maxAttempts - guestUsed);

    return {
      planType: 'GUEST',
      attemptsUsed: guestUsed,
      attemptsLeft,
      maxAttempts,
      canProceed: attemptsLeft > 0,
      isPro: false,
      isTrialEligible: true,
      message: attemptsLeft > 0
        ? `${attemptsLeft} of 3 free speech analyses remaining`
        : "All 3 free speech analyses used. Activate the ₹1 7-Day Pro trial or upgrade to Pro for unlimited access!",
    };
  }

  /**
   * Consume 1 attempt for guest or user. Throws error if limit reached.
   */
  static async consumeUsage(req: Request, res?: Response): Promise<UsageStatusResult> {
    const status = await this.getUsageStatus(req, res);

    if (status.isPro) {
      return status;
    }

    if (!status.canProceed) {
      const err: any = new Error(
        "All 3 free speech analyses used. Activate the ₹1 7-Day Pro trial or upgrade to Pro for unlimited access!"
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
      if (guestDoc) {
        const attemptsToTransfer = Math.max(guestDoc.totalAttemptsUsed || 0, guestDoc.dailyAttemptsUsed || 0);
        if (attemptsToTransfer > 0) {
          const user = await UserModel.findById(userId);
          if (user && (!user.guestAttemptsConsumed || user.guestAttemptsConsumed < attemptsToTransfer)) {
            user.guestId = guestId;
            user.guestAttemptsConsumed = attemptsToTransfer;
            await user.save();
            logger.info(`Transferred ${attemptsToTransfer} guest attempts from ${guestId} to User ${userId}`);
          }
        }
      }
    } catch (e) {
      logger.warn('Failed to transfer guest usage to user', e);
    }
  }
}
