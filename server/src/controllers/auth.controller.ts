import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { UsageService } from '../services/usage.service.js';
import { UserModel } from '../models/User.model.js';
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
      data: { user, accessToken: tokens.accessToken },
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
      data: { user, accessToken: tokens.accessToken },
    });
  } catch (error) {
    next(error);
  }
};

export const getMeController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User authentication required');
    }

    const dbUser = await UserModel.findById(userId);
    if (!dbUser) {
      throw new UnauthorizedError('User not found');
    }

    res.status(200).json({
      success: true,
      data: {
        id: dbUser._id.toString(),
        email: dbUser.email,
        role: dbUser.role,
        fullName: dbUser.fullName,
        avatarUrl: dbUser.avatarUrl,
        authProvider: dbUser.authProvider || 'email',
        streakDays: dbUser.streakDays ?? 7,
        totalPracticeMinutes: dbUser.totalPracticeMinutes ?? 142,
        averageScore: dbUser.averageScore ?? 88,
        targetWpm: dbUser.targetWpm ?? 145,
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
      data: { user, accessToken: tokens.accessToken },
    });
  } catch (error) {
    next(error);
  }
};
