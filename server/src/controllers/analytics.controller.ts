import { Request, Response, NextFunction } from 'express';

export const getAnalyticsOverviewController = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      data: {
        totalSessions: 18,
        practiceMinutes: 142,
        averageScore: 88,
        disfluencyReductionPercent: 75,
        trendData: [
          { week: 'Week 1', score: 72, fillers: 12, wpm: 165 },
          { week: 'Week 2', score: 78, fillers: 8, wpm: 155 },
          { week: 'Week 3', score: 83, fillers: 5, wpm: 148 },
          { week: 'Week 4', score: 89, fillers: 3, wpm: 142 },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
};
