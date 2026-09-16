import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { UsageService } from '../services/usage.service.js';
import { UserModel } from '../models/User.model.js';
import { PaymentTransactionModel } from '../models/PaymentTransaction.model.js';
import { UnauthorizedError } from '../utils/errors.js';

export const registerController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { fullName, email, password } = req.body;
    const guestId = UsageService.getOrCreateGuestId(req, res);
    const { user, tokens } = await AuthService.register(fullName, email, password);

    if (user && (user.id || (user as any)._id)) {
      await UsageService.transferGuestUsageToUser(guestId, user.id || (user as any)._id);
    }

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(201).json({
      success: true,
      data: { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
    });
  } catch (error) {
    next(error);
  }
};

export const loginController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const guestId = UsageService.getOrCreateGuestId(req, res);
    const { user, tokens } = await AuthService.login(email, password);

    if (user && (user.id || (user as any)._id)) {
      await UsageService.transferGuestUsageToUser(guestId, user.id || (user as any)._id);
    }

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({
      success: true,
      data: { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
    });
  } catch (error) {
    next(error);
  }
};

export const getMeController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;
    if (!userId && !userEmail) {
      throw new UnauthorizedError('User authentication required');
    }

    // Always fetch fresh from database by ID with fallback by email
    let dbUser = userId ? await UserModel.findById(userId) : null;
    if (!dbUser && userEmail) {
      dbUser = await UserModel.findOne({ email: userEmail.toLowerCase().trim() });
    }

    if (!dbUser) {
      throw new UnauthorizedError('User not found');
    }

    // =========================================================================
    // CRITICAL PRO STATUS RECONCILIATION (REGRESSION GUARD):
    // Never trust stale claims baked into the JWT access token at login time.
    // Dynamically reconcile user role against verified database subscription
    // expiry (subscriptionExpiresAt) or trial expiry (trialEndsAt).
    // If the user has an active paid plan or trial in MongoDB, their effective
    // role is strictly PRO_USER, even if their login token was issued as FREE_USER.
    // =========================================================================
    const now = Date.now();
    const isAdmin = dbUser.role === 'SUPER_ADMIN' || dbUser.role === 'ORG_ADMIN';
    const hasActiveSub = Boolean(
      dbUser.subscriptionExpiresAt && new Date(dbUser.subscriptionExpiresAt).getTime() > now
    );
    const hasActiveTrial = Boolean(
      dbUser.trialEndsAt && new Date(dbUser.trialEndsAt).getTime() > now
    );

    let effectiveRole: string = dbUser.role;
    if (!isAdmin) {
      if (hasActiveSub || hasActiveTrial) {
        effectiveRole = 'PRO_USER';
      } else {
        // Check for active paid transaction before marking as FREE_USER
        const activeTx = await PaymentTransactionModel.findOne({
          $or: [
            { userId: dbUser._id },
            { userEmail: dbUser.email.toLowerCase().trim() },
          ],
          status: 'SUCCESS',
          expiresAt: { $gt: new Date() },
        }).sort({ expiresAt: -1 });

        if (activeTx) {
          effectiveRole = 'PRO_USER';
          dbUser.role = 'PRO_USER';
          dbUser.subscriptionPlan = activeTx.planId;
          dbUser.subscriptionExpiresAt = activeTx.expiresAt;
          if (activeTx.notes?.trialEndsAt) {
            dbUser.trialEndsAt = new Date(activeTx.notes.trialEndsAt);
            dbUser.hasUsedTrialOffer = true;
          }
          if (activeTx.notes?.planStartsAt) {
            dbUser.planStartsAt = new Date(activeTx.notes.planStartsAt);
          }
          if (!activeTx.userId) {
            activeTx.userId = dbUser._id;
            await activeTx.save().catch(() => {});
          }
          await dbUser.save().catch(() => {});
        } else {
          effectiveRole = 'FREE_USER';
        }
      }
      if (dbUser.role !== effectiveRole) {
        dbUser.role = effectiveRole as any;
        await dbUser.save().catch(() => {});
      }
    }

    res.status(200).json({
      success: true,
      data: {
        id: dbUser._id.toString(),
        email: dbUser.email,
        role: effectiveRole,
        fullName: dbUser.fullName,
        avatarUrl: dbUser.avatarUrl,
        authProvider: dbUser.authProvider || 'email',
        streakDays: dbUser.streakDays ?? 7,
        totalPracticeMinutes: dbUser.totalPracticeMinutes ?? 142,
        averageScore: dbUser.averageScore ?? 88,
        targetWpm: dbUser.targetWpm ?? 145,
        subscriptionPlan: dbUser.subscriptionPlan || (hasActiveTrial ? 'TRIAL_7_DAYS' : undefined),
        subscriptionExpiresAt: dbUser.subscriptionExpiresAt ? dbUser.subscriptionExpiresAt.toISOString() : undefined,
        hasUsedTrialOffer: dbUser.hasUsedTrialOffer || false,
        trialEndsAt: dbUser.trialEndsAt ? dbUser.trialEndsAt.toISOString() : undefined,
        planStartsAt: dbUser.planStartsAt ? dbUser.planStartsAt.toISOString() : undefined,
        createdAt: dbUser.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const googleLoginController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, fullName, googleId, avatarUrl } = req.body;
    const guestId = UsageService.getOrCreateGuestId(req, res);
    const { user, tokens } = await AuthService.googleLogin(email, fullName, googleId, avatarUrl);

    if (user && (user.id || (user as any)._id)) {
      await UsageService.transferGuestUsageToUser(guestId, user.id || (user as any)._id);
    }

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({
      success: true,
      data: { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================================================
 * POST /api/v1/auth/refresh
 * Exchanges a valid refresh token for a fresh access token & rotated refresh token.
 * Enables seamless background auto-refresh on the frontend when access token expires.
 * =========================================================================
 */
export const refreshTokenController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const incomingRefreshToken = req.body?.refreshToken || req.cookies?.refreshToken;
    if (!incomingRefreshToken) {
      res.status(401).json({
        success: false,
        error: 'Refresh token required',
        code: 'REFRESH_TOKEN_MISSING',
      });
      return;
    }

    const { user, tokens } = await AuthService.refreshTokens(incomingRefreshToken);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user,
      },
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message || 'Invalid or expired refresh token',
      code: 'REFRESH_TOKEN_INVALID',
    });
  }
};
