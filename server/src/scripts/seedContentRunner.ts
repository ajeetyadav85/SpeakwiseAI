import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ContentModel } from '../models/Content.model.js';
import { SEED_CONTENT_ITEMS } from '../services/seedContent.service.js';

async function runSeed() {
  try {
    const mongoUri = env.MONGODB_URI || 'mongodb://localhost:27017/speakwise_db';
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('Connected! Inserting initial content items into "contents" collection...');
    await ContentModel.deleteMany({});
    const inserted = await ContentModel.insertMany(SEED_CONTENT_ITEMS);

    console.log(`✅ Successfully inserted ${inserted.length} documents into speakwise_db.contents collection!`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

runSeed();
