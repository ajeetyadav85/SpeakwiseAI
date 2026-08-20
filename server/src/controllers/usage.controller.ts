import { Request, Response, NextFunction } from 'express';
import { UsageService } from '../services/usage.service.js';

export const getUsageStatusController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const status = await UsageService.getUsageStatus(req, res);
    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

export const consumeUsageController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const status = await UsageService.consumeUsage(req, res);
    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};
