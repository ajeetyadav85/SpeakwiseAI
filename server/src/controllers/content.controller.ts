import { Request, Response, NextFunction } from 'express';
import { ContentService } from '../services/content.service.js';
import { ContentModel, ContentType, DifficultyLevel } from '../models/Content.model.js';
import { logger } from '../utils/logger.js';

export const getRandomContentController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type = 'TOPIC', category = 'General', difficulty = 'Medium' } = req.query;

    const content = await ContentService.getRandomContent(
      type as ContentType,
      category as string,
      difficulty as DifficultyLevel
    );

    res.status(200).json({
      success: true,
      data: content,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoriesController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type = 'TOPIC' } = req.query;
    const categories = await ContentService.getCategories(type as ContentType);

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const createContentController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, category, difficulty, title, meaning, contentOverview, hint, suggestedDurationSeconds } = req.body;

    const newContent = await ContentModel.create({
      type,
      category,
      difficulty,
      title,
      meaning,
      contentOverview,
      hint,
      suggestedDurationSeconds: suggestedDurationSeconds || 150,
    });

    res.status(201).json({
      success: true,
      message: 'Content created successfully',
      data: newContent,
    });
  } catch (error) {
    next(error);
  }
};
