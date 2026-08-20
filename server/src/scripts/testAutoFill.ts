import mongoose from 'mongoose';
import { AutoFillContentService } from '../services/autoFillContent.service.js';
import { ContentModel } from '../models/Content.model.js';

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/speakwise_db');
  console.log('Testing generateInitialBatch for TOPIC / Sports / Easy...');
  
  const beforeCount = await ContentModel.countDocuments({ type: 'TOPIC', category: 'Sports', difficulty: 'Easy' });
  console.log('Before count:', beforeCount);

  const res = await AutoFillContentService.generateInitialBatch('TOPIC', 'Sports', 'Easy', 10);
  console.log('Generated batch items:', res.length);
  if (res.length > 0) {
    console.log('First item title:', res[0].title);
  }

  const afterCount = await ContentModel.countDocuments({ type: 'TOPIC', category: 'Sports', difficulty: 'Easy' });
  console.log('After count:', afterCount);

  await mongoose.disconnect();
}

test();
