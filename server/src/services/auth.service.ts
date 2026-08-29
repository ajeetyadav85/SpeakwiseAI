import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UserModel, IUser, UserRole } from '../models/User.model.js';
import { BadRequestError, UnauthorizedError } from '../utils/errors.js';

export class AuthService {
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
    const existing = await UserModel.findOne({ email: normalizedEmail });
    if (existing) {
      throw new BadRequestError('Email address is already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      fullName,
      email: normalizedEmail,
      passwordHash,
      role: 'PRO_USER',
      authProvider: 'email',
    });

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
        role: 'PRO_USER',
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

    const tokens = this.generateTokens(user._id.toString(), user.email, user.role);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    return { user, tokens };
  }
}
