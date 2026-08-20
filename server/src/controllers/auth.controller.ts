import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { UsageService } from '../services/usage.service.js';

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
    res.status(200).json({
      success: true,
      data: {
        id: req.user?.id,
        email: req.user?.email,
        role: req.user?.role,
        fullName: 'Alex Morgan',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        streakDays: 7,
        totalPracticeMinutes: 142,
        averageScore: 88,
        targetWpm: 145,
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
