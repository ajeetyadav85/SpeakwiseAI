import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UserModel, IUser, UserRole } from '../models/User.model.js';
import { PaymentTransactionModel } from '../models/PaymentTransaction.model.js';
import { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError } from '../utils/errors.js';
import { emailService } from './email.service.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  /**
   * 1. Register with Email + Password
   * Enforces email format, password >= 8 characters, creates user with emailVerified = false,
   * hashes a 6-digit verification OTP and dispatches verification email.
   */
  static async register(fullName: string, email: string, password: string) {
    const normalizedEmail = (email || '').toLowerCase().trim();
    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      throw new BadRequestError('Please provide a valid email address');
    }

    if (!password || password.length < 8) {
      throw new BadRequestError('Password must be at least 8 characters long');
    }

    const trimmedName = (fullName || normalizedEmail.split('@')[0]).trim();
    let existingUser = await UserModel.findOne({ email: normalizedEmail }).select('+emailVerificationTokenHash');

    // If user already exists
    if (existingUser) {
      if (existingUser.emailVerified) {
        throw new BadRequestError('An account with this email address already exists. Please log in.');
      }
      // If user exists but is unverified, refresh their password and re-issue a verification code
      const passwordHash = await bcrypt.hash(password, 10);
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

      existingUser.fullName = trimmedName;
      existingUser.passwordHash = passwordHash;
      existingUser.emailVerificationTokenHash = otpHash;
      existingUser.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      existingUser.verificationAttempts = 0;
      const tokens = this.generateTokens(existingUser._id.toString(), existingUser.email, existingUser.role);
      const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
      existingUser.refreshTokenHash = refreshTokenHash;
      await existingUser.save();

      await emailService.sendVerificationEmail(normalizedEmail, otp);

      return {
        user: existingUser,
        tokens,
        emailVerified: false,
        requiresVerification: true,
        message: 'Account created. We sent a 6-digit verification code to your email.',
      };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await UserModel.create({
      fullName: trimmedName,
      email: normalizedEmail,
      passwordHash,
      role: 'FREE_USER',
      authProvider: 'email',
      emailVerified: false,
      emailVerificationTokenHash: otpHash,
      emailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      verificationAttempts: 0,
    });

    await this.reconcileActivePayment(user);

    const tokens = this.generateTokens(user._id.toString(), user.email, user.role);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    await emailService.sendVerificationEmail(normalizedEmail, otp);

    return {
      user,
      tokens,
      emailVerified: false,
      requiresVerification: true,
      message: 'Account created successfully. We sent a 6-digit verification code to your email.',
    };
  }

  /**
   * 2. Send / Resend Email Verification OTP
   */
  static async sendVerificationEmail(email: string) {
    const normalizedEmail = (email || '').toLowerCase().trim();
    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      throw new BadRequestError('Please provide a valid email address');
    }

    const user = await UserModel.findOne({ email: normalizedEmail }).select('+emailVerificationTokenHash');
    if (!user) {
      throw new NotFoundError('No account found with this email address');
    }

    if (user.emailVerified) {
      return { success: true, message: 'This email is already verified. You can log in.' };
    }

    // Rate limiting: 60-second cooldown between resend requests
    if (user.emailVerificationExpires) {
      const msLeft = new Date(user.emailVerificationExpires).getTime() - Date.now();
      // If code was created < 60s ago (msLeft between 9m and 10m)
      if (msLeft > 9 * 60 * 1000) {
        throw new BadRequestError('Please wait at least 60 seconds before requesting another code.');
      }
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    user.emailVerificationTokenHash = otpHash;
    user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.verificationAttempts = 0;
    await user.save();

    await emailService.sendVerificationEmail(normalizedEmail, otp);

    return { success: true, message: 'A new verification code has been sent to your email.' };
  }

  /**
   * 3. Verify Email with OTP
   */
  static async verifyEmail(email: string, otp: string) {
    const normalizedEmail = (email || '').toLowerCase().trim();
    const cleanOtp = (otp || '').trim();

    if (!normalizedEmail || !cleanOtp) {
      throw new BadRequestError('Email and verification code are required');
    }

    const user = await UserModel.findOne({ email: normalizedEmail }).select('+emailVerificationTokenHash');
    if (!user) {
      throw new NotFoundError('Account not found');
    }

    if (user.emailVerified) {
      const tokens = this.generateTokens(user._id.toString(), user.email, user.role);
      return { user, tokens, message: 'Email is already verified.' };
    }

    // Check maximum attempts
    if ((user.verificationAttempts || 0) >= 5) {
      throw new BadRequestError('Too many failed attempts. Please request a new verification code.');
    }

    // Check expiry
    if (!user.emailVerificationExpires || new Date() > user.emailVerificationExpires) {
      throw new BadRequestError('Verification code has expired. Please request a new code.');
    }

    // Check hash match
    const incomingHash = crypto.createHash('sha256').update(cleanOtp).digest('hex');
    if (incomingHash !== user.emailVerificationTokenHash) {
      user.verificationAttempts = (user.verificationAttempts || 0) + 1;
      await user.save();
      const remaining = 5 - user.verificationAttempts;
      throw new BadRequestError(`Invalid verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Please request a new code.'}`);
    }

    // Mark verified
    user.emailVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpires = undefined;
    user.verificationAttempts = 0;

    await this.reconcileActivePayment(user);

    const tokens = this.generateTokens(user._id.toString(), user.email, user.role);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    return {
      user: {
        id: user._id.toString(),
        _id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        emailVerified: true,
        avatarUrl: user.avatarUrl,
        streakDays: user.streakDays,
        totalPracticeMinutes: user.totalPracticeMinutes,
        averageScore: user.averageScore,
        targetWpm: user.targetWpm,
        exp: user.exp,
        level: user.level,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        createdAt: user.createdAt,
      },
      tokens,
      message: 'Email verified successfully!',
    };
  }

  /**
   * 4. Login with Email + Password
   */
  static async login(email: string, password: string) {
    const normalizedEmail = (email || '').toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail }).select('+passwordHash +refreshTokenHash');
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if Google-only account
    if (user.passwordHash === 'GOOGLE_OAUTH_USER' && user.authProvider === 'google') {
      throw new BadRequestError('This account was created using Google Sign-In. Please sign in with Google.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Legacy migration: If user was created before email verification existed, treat as verified
    if (user.emailVerified === undefined) {
      user.emailVerified = true;
      await user.save();
    } else if (user.emailVerified === false) {
      // User has not verified their email yet. Return actionable error so frontend prompts for OTP.
      throw new ForbiddenError('Your email address is not verified. Please verify your email before logging in.');
    }

    await this.reconcileActivePayment(user);

    const tokens = this.generateTokens(user._id.toString(), user.email, user.role);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    return { user, tokens };
  }

  /**
   * 5. Google Sign-In & Safe Account Linking
   * Preserves existing passwordHash if the user previously registered via email+password.
   * Links Google identity seamlessly without creating duplicates.
   */
  static async googleLogin(email: string, fullName: string, googleId: string, avatarUrl?: string) {
    const normalizedEmail = (email || '').toLowerCase().trim();
    let user = await UserModel.findOne({ email: normalizedEmail });

    if (!user) {
      user = await UserModel.create({
        fullName: fullName || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        passwordHash: 'GOOGLE_OAUTH_USER',
        role: 'FREE_USER',
        authProvider: 'google',
        emailVerified: true, // Google accounts come with pre-verified email addresses
        googleId: googleId || undefined,
        avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      });
    } else {
      // Safe Account Linking
      if (!user.googleId && googleId) {
        user.googleId = googleId;
      }
      // Google confirms verified email
      user.emailVerified = true;

      if (avatarUrl && (!user.avatarUrl || user.avatarUrl.includes('unsplash'))) {
        user.avatarUrl = avatarUrl;
      }
      if (fullName && (!user.fullName || user.fullName === normalizedEmail.split('@')[0])) {
        user.fullName = fullName;
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
   * 6. Forgot Password Request
   * CRITICAL SECURITY REQUIREMENT: Never reveal whether an email exists!
   * Always returns the same generic message.
   */
  static async forgotPassword(email: string) {
    const genericResponse = {
      success: true,
      message: 'If an account exists for this email, password reset instructions have been sent.',
    };

    const normalizedEmail = (email || '').toLowerCase().trim();
    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      return genericResponse;
    }

    const user = await UserModel.findOne({ email: normalizedEmail }).select('+resetPasswordTokenHash');
    if (!user) {
      return genericResponse;
    }

    // If account was created strictly with Google
    if (user.authProvider === 'google' && user.passwordHash === 'GOOGLE_OAUTH_USER') {
      await emailService.sendGoogleAccountNotice(normalizedEmail);
      return genericResponse;
    }

    // Rate-limit reset requests: 60s cooldown
    if (user.resetPasswordExpires) {
      const msLeft = new Date(user.resetPasswordExpires).getTime() - Date.now();
      if (msLeft > 14 * 60 * 1000) {
        // Requested less than 60 seconds ago
        return genericResponse;
      }
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    user.resetPasswordTokenHash = otpHash;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    user.resetAttempts = 0;
    await user.save();

    await emailService.sendPasswordResetEmail(normalizedEmail, otp);

    return genericResponse;
  }

  /**
   * 7. Verify Reset OTP
   */
  static async verifyResetOtp(email: string, otp: string) {
    const normalizedEmail = (email || '').toLowerCase().trim();
    const cleanOtp = (otp || '').trim();

    if (!normalizedEmail || !cleanOtp) {
      throw new BadRequestError('Email and reset code are required');
    }

    const user = await UserModel.findOne({ email: normalizedEmail }).select('+resetPasswordTokenHash');
    if (!user || (user.authProvider === 'google' && user.passwordHash === 'GOOGLE_OAUTH_USER')) {
      throw new BadRequestError('This account uses Google Sign-In. Please continue with Google.');
    }

    if ((user.resetAttempts || 0) >= 5) {
      throw new BadRequestError('Too many failed attempts. Please request a new password reset code.');
    }

    if (!user.resetPasswordExpires || new Date() > user.resetPasswordExpires || !user.resetPasswordTokenHash) {
      throw new BadRequestError('Password reset code has expired. Please request a new code.');
    }

    const incomingHash = crypto.createHash('sha256').update(cleanOtp).digest('hex');
    if (incomingHash !== user.resetPasswordTokenHash) {
      user.resetAttempts = (user.resetAttempts || 0) + 1;
      await user.save();
      const remaining = 5 - user.resetAttempts;
      throw new BadRequestError(`Invalid reset code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Please request a new code.'}`);
    }

    return { success: true, message: 'Reset code verified successfully. Please enter your new password.' };
  }

  /**
   * 8. Reset Password
   */
  static async resetPassword(email: string, otp: string, newPassword: string) {
    const normalizedEmail = (email || '').toLowerCase().trim();
    const cleanOtp = (otp || '').trim();

    if (!normalizedEmail || !cleanOtp) {
      throw new BadRequestError('Email and reset code are required');
    }

    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestError('New password must be at least 8 characters long');
    }

    const user = await UserModel.findOne({ email: normalizedEmail }).select('+resetPasswordTokenHash');
    if (!user || (user.authProvider === 'google' && user.passwordHash === 'GOOGLE_OAUTH_USER')) {
      throw new BadRequestError('This account uses Google Sign-In. Please continue with Google.');
    }

    if ((user.resetAttempts || 0) >= 5) {
      throw new BadRequestError('Too many failed attempts. Please request a new password reset code.');
    }

    if (!user.resetPasswordExpires || new Date() > user.resetPasswordExpires || !user.resetPasswordTokenHash) {
      throw new BadRequestError('Password reset code has expired. Please request a new code.');
    }

    const incomingHash = crypto.createHash('sha256').update(cleanOtp).digest('hex');
    if (incomingHash !== user.resetPasswordTokenHash) {
      user.resetAttempts = (user.resetAttempts || 0) + 1;
      await user.save();
      throw new BadRequestError('Invalid reset code. Please check and try again.');
    }

    // Hash new password securely
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = newPasswordHash;

    // Clear reset tokens
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpires = undefined;
    user.resetAttempts = 0;

    // Invalidate existing sessions for security
    user.refreshTokenHash = undefined;

    // Reset password also proves email ownership
    user.emailVerified = true;

    await user.save();

    return {
      success: true,
      message: 'Password successfully changed. You can now log in with your new password.',
    };
  }

  /**
   * Refresh Token exchange
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

    const tokens = this.generateTokens(user._id.toString(), user.email, user.role);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    return { user, tokens };
  }
}
