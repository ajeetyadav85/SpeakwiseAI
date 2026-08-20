import { Request, Response, NextFunction } from 'express';
import { TopicService } from '../services/topic.service.js';

export const getTopicsController = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const topics = TopicService.getTopics();
    res.status(200).json({ success: true, data: topics });
  } catch (error) {
    next(error);
  }
};

export const generateAITopicController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { prompt } = req.body;
    const topic = TopicService.generateAITopic(prompt || 'Executive Leadership');
    res.status(200).json({ success: true, data: topic });
  } catch (error) {
    next(error);
  }
};
