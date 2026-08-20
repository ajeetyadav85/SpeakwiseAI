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
