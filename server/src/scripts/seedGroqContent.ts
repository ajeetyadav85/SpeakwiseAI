import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ContentModel, ContentType, DifficultyLevel } from '../models/Content.model.js';
import { AutoFillContentService, getContentThreshold } from '../services/autoFillContent.service.js';

const TOPIC_CATEGORIES = [
  'General',
  'Sports',
  'Education',
  'History',
  'Geography',
  'Technology & AI',
  'Business & Entrepreneurship',
  'Science & Space',
  'Philosophy & Ethics',
  'Environment & Climate',
  'Psychology & Mindset',
  'Art & Literature',
  'Entertainment & Pop Culture',
  'Health & Wellness',
  'Politics & Civics',
];

const DIFFICULTIES: DifficultyLevel[] = ['Easy', 'Medium', 'Hard'];

async function runGroqBulkSeeding() {
  try {
    const mongoUri = env.MONGODB_URI || 'mongodb://127.0.0.1:27017/speakwise_db';
    console.log(`\n======================================================`);
    console.log(`🚀 Starting SpeakWise AI Groq Content Seeder...`);
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    console.log(`======================================================\n`);

    await mongoose.connect(mongoUri);

    const initialTotalCount = await ContentModel.countDocuments();
    console.log(`Current Total Content Documents in DB: ${initialTotalCount}\n`);

    // Matrix of work to seed
    const tasks: Array<{ type: ContentType; category: string; difficulty: DifficultyLevel }> = [];

    // 1. Topics (15 categories * 3 difficulties = 45 combos)
    for (const category of TOPIC_CATEGORIES) {
      for (const difficulty of DIFFICULTIES) {
        tasks.push({ type: 'TOPIC', category, difficulty });
      }
    }

    // 2. Words & Phrases (2 categories * 3 difficulties = 6 combos)
    for (const category of ['Words', 'Phrases']) {
      for (const difficulty of DIFFICULTIES) {
        tasks.push({ type: 'WORD', category, difficulty });
      }
    }

    // 3. Questions (2 categories * 3 difficulties = 6 combos)
    for (const category of ['General', 'Interview']) {
      for (const difficulty of DIFFICULTIES) {
        tasks.push({ type: 'QUESTION', category, difficulty });
      }
    }

    // 4. Corporate Talks (5 categories * 3 difficulties = 15 combos)
    for (const category of ['Executive Pitch', 'Townhall Address', 'Product Launch', 'Crisis Management', 'Meeting Conversation']) {
      for (const difficulty of DIFFICULTIES) {
        tasks.push({ type: 'CORPORATE_TALK', category, difficulty });
      }
    }

    console.log(`Total Combination Tasks to Process: ${tasks.length}`);

    let completedTasks = 0;
    for (const task of tasks) {
      const { type, category, difficulty } = task;
      const targetThreshold = getContentThreshold(type, category, difficulty);
      const currentCount = await ContentModel.countDocuments({ type, category, difficulty });

      if (currentCount >= targetThreshold) {
        completedTasks++;
        console.log(`[${completedTasks}/${tasks.length}] 🎯 (${type} / ${category} / ${difficulty}) -> Threshold Met (${currentCount}/${targetThreshold})`);
        continue;
      }

      console.log(`[${completedTasks + 1}/${tasks.length}] ⏳ Seeding (${type} / ${category} / ${difficulty}) -> Current: ${currentCount}/${targetThreshold}...`);

      let count = currentCount;
      let batchAttempts = 0;
      while (count < targetThreshold && batchAttempts < 20) {
        batchAttempts++;
        const batch = await AutoFillContentService.generateInitialBatch(type, category, difficulty, 15);
        count = await ContentModel.countDocuments({ type, category, difficulty });
        console.log(`   └─ Batch #${batchAttempts}: Added items, progress now ${count}/${targetThreshold}`);
      }

      completedTasks++;
    }

    const finalTotalCount = await ContentModel.countDocuments();
    console.log(`\n======================================================`);
    console.log(`🎉 Content Seeding Completed Successfully!`);
    console.log(`Total Documents in MongoDB: ${finalTotalCount} (Added: ${finalTotalCount - initialTotalCount})`);
    console.log(`======================================================\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed with error:', err);
    process.exit(1);
  }
}

runGroqBulkSeeding();
