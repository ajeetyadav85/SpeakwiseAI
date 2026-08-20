import { Request, Response, NextFunction } from 'express';

export const getAdminTelemetryController = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      data: {
        activeUsers: 1420,
        totalSessionsStreamed: 14890,
        averageAsrLatencyMs: 245,
        systemStatus: 'HEALTHY',
        usersList: [
          { id: '1', name: 'Executive Elena', email: 'elena@enterprise.com', role: 'ORG_ADMIN', sessions: 42, lastActive: '2 mins ago' },
          { id: '2', name: 'Sales Rep Sam', email: 'sam@techsales.io', role: 'PRO_USER', sessions: 28, lastActive: '1 hour ago' },
          { id: '3', name: 'ESL Learner Lin', email: 'lin@global.org', role: 'PRO_USER', sessions: 19, lastActive: '3 hours ago' },
          { id: '4', name: 'Campus Chris', email: 'chris@edu.ac', role: 'FREE_USER', sessions: 5, lastActive: '1 day ago' },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
};
