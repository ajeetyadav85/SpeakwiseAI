import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service.js';
import { AIEnginePipeline } from '../services/ai/AIEnginePipeline.js';

export const getReportController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reportId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const report = await ReportService.getReportById(reportId);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

import { UserModel } from '../models/User.model.js';
import { applyPracticeSessionGamification } from '../utils/gamificationUtils.js';

export const analyzeSpeechSessionController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id || 'usr_demo99';
    const { sessionId, sessionTitle, transcript, durationSeconds } = req.body;

    const report = await AIEnginePipeline.processSpeechSession({
      sessionId: sessionId || 'sess_1001',
      userId,
      sessionTitle: sessionTitle || 'Series A Pitch Rehearsal',
      providedTranscript: transcript,
    });

    // Award XP and update streak for authenticated user on successful analysis
    if (userId && !userId.startsWith('usr_')) {
      try {
        const user = await UserModel.findById(userId);
        if (user) {
          const rep = report as any;
          const validDuration = Number(durationSeconds) || rep?.durationSeconds || rep?.metrics?.durationSeconds || 0;
          applyPracticeSessionGamification(user, validDuration, rep?.overallScore || rep?.metrics?.overallScore);
          await user.save();
        }
      } catch (userErr: any) {
        console.warn('[ANALYZE CONTROLLER] Could not update user gamification stats:', userErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'AI Speech Analysis completed successfully',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};
