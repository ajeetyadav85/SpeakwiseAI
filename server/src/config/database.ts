import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';
import { seedContentDatabase } from '../services/seedContent.service.js';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    await seedContentDatabase();
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error);
    // In dev mode, fallback gracefully if local mongo is offline
    logger.warn('Running with degraded DB storage mode if MongoDB is unavailable.');
  }
};
