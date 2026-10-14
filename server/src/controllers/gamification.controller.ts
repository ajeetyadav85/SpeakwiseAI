import { Request, Response } from 'express';
import { GamificationService } from '../services/gamification.service.js';
import { logger } from '../utils/logger.js';

export class GamificationController {
  public static async getBadges(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req.query.userId as string);
      const badges = await GamificationService.getUserBadges(userId);
      res.status(200).json({ success: true, data: badges });
    } catch (error) {
      logger.error('Error in GamificationController.getBadges:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch badges' });
    }
  }

  public static async getLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const rawPeriod = (req.query.period as string) || (req.query.timeframe as string) || 'alltime';
      const period = rawPeriod.toLowerCase() === 'weekly' ? 'weekly' : 'alltime';
      const currentUserId = (req as any).user?.id || (req.query.userId as string);

      const result = await GamificationService.getLeaderboardData(period, currentUserId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error in GamificationController.getLeaderboard:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
    }
  }
}
