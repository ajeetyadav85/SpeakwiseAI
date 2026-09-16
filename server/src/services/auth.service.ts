import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UserModel, IUser, UserRole } from '../models/User.model.js';
import { PaymentTransactionModel } from '../models/PaymentTransaction.model.js';
import { BadRequestError, UnauthorizedError } from '../utils/errors.js';

export class AuthService {
  static async reconcileActivePayment(user: IUser) {
    if (!user || user.role === 'SUPER_ADMIN' || user.role === 'ORG_ADMIN') return;
    const now = new Date();
    const activeTx = await PaymentTransactionModel.findOne({
      $or: [
        { userId: user._id },
        { userEmail: user.email.toLowerCase().trim() },
      ],
      status: 'SUCCESS',
      expiresAt: { $gt: now },
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
    }
  }

  static generateTokens(userId: string, email: string, role: UserRole) {
    const accessToken = jwt.sign({ id: userId, email, role }, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
    });

    const refreshToken = jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    });

    return { accessToken, refreshToken };
  }

  static async register(fullName: string, email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await UserModel.findOne({ email: normalizedEmail });

    if (existingUser) {
      throw new BadRequestError('User already exists with this email');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      fullName,
      email: normalizedEmail,
      passwordHash,
      role: 'FREE_USER',
      authProvider: 'email',
    });

    await this.reconcileActivePayment(user);

    const tokens = this.generateTokens(user._id.toString(), user.email, user.role);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    return { user, tokens };
  }

  static async login(email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.passwordHash === 'GOOGLE_OAUTH_USER' && user.authProvider === 'google') {
      throw new BadRequestError('This account was created using Google Sign-In. Please sign in with Google.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    await this.reconcileActivePayment(user);

    const tokens = this.generateTokens(user._id.toString(), user.email, user.role);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    return { user, tokens };
  }

  static async googleLogin(email: string, fullName: string, googleId: string, avatarUrl?: string) {
    const normalizedEmail = email.toLowerCase().trim();
    let user = await UserModel.findOne({ email: normalizedEmail });

    if (!user) {
      user = await UserModel.create({
        fullName: fullName || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        passwordHash: 'GOOGLE_OAUTH_USER',
        role: 'FREE_USER',
        authProvider: 'google',
        googleId: googleId || undefined,
        avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      });
    } else {
      if (!user.googleId && googleId) {
        user.googleId = googleId;
      }
      if (avatarUrl && (!user.avatarUrl || user.avatarUrl.includes('unsplash'))) {
        user.avatarUrl = avatarUrl;
      }
    }

    await this.reconcileActivePayment(user);

    const tokens = this.generateTokens(user._id.toString(), user.email, user.role);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    return { user, tokens };
  }

  /**
   * =========================================================================
   * CRITICAL AUTH REFRESH FLOW (REGRESSION GUARD):
   * When an access token expires (15m lifetime), the client uses this method
   * via /auth/refresh to exchange a valid refresh token for a brand-new
   * access token and rotated refresh token, preserving authenticated Pro state
   * without disrupting active sessions or forcing manual logouts.
   * =========================================================================
   */
  static async refreshTokens(incomingRefreshToken: string) {
    if (!incomingRefreshToken) {
      throw new UnauthorizedError('Refresh token is required');
    }

    let payload: any;
    try {
      payload = jwt.verify(incomingRefreshToken, env.JWT_REFRESH_SECRET);
    } catch (err: any) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const userId = payload.id;
    const user = await UserModel.findById(userId).select('+refreshTokenHash');
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (!user.refreshTokenHash) {
      throw new UnauthorizedError('No active session found. Please log in again.');
    }

    const isMatch = await bcrypt.compare(incomingRefreshToken, user.refreshTokenHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Generate fresh tokens and rotate refresh token hash in DB
    const tokens = this.generateTokens(user._id.toString(), user.email, user.role);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    return { user, tokens };
  }
}
