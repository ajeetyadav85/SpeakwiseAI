import { Request, Response, NextFunction } from 'express';
import { SessionService } from '../services/session.service.js';

export const listSessionsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id || 'usr_demo99';
    const sessions = await SessionService.listUserSessions(userId);
    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
};

export const createSessionController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id || 'usr_demo99';
    const { title, mode } = req.body;
    const session = await SessionService.createSession(userId, title, mode);
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

export const uploadAudioController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const file = req.file;
    res.status(200).json({
      success: true,
      data: {
        audioUrl: `https://storage.cloudinary.com/speakwise/${file?.originalname || 'audio.webm'}`,
        sizeBytes: file?.size || 1024500,
        status: 'UPLOADED',
      },
    });
  } catch (error) {
    next(error);
  }
};

import { UserModel } from '../models/User.model.js';
import { applyPracticeSessionGamification } from '../utils/gamificationUtils.js';

export const completePracticeSessionController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { durationSeconds, sessionTitle, mode, overallScore } = req.body || {};
    const validDuration = Math.max(0, Math.floor(Number(durationSeconds) || 0));

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const gamificationResult = applyPracticeSessionGamification(
      user,
      validDuration,
      typeof overallScore === 'number' ? overallScore : undefined
    );
    await user.save();

    // Create a record of practice session in DB
    const session = await SessionService.createSession(userId, sessionTitle || 'Practice Session', mode || 'ELEVATOR_PITCH');
    if (session) {
      session.durationSeconds = validDuration;
      if (typeof overallScore === 'number') session.overallScore = overallScore;
      session.status = 'COMPLETED';
      await session.save().catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: gamificationResult.expAwarded > 0 ? `Earned ${gamificationResult.expAwarded} XP!` : 'Practice session recorded',
      data: {
        sessionId: session?._id,
        ...gamificationResult,
      },
    });
  } catch (error) {
    next(error);
  }
};
