import mongoose from 'mongoose';
import { ContentModel } from '../models/Content.model.js';

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/speakwise_db');
  const counts = await ContentModel.aggregate([
    {
      $group: {
        _id: { type: '$type', category: '$category', difficulty: '$difficulty' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.type': 1, '_id.category': 1, '_id.difficulty': 1 } }
  ]);
  console.log('--- DB SUMMARY BY TYPE/CATEGORY/DIFFICULTY ---');
  counts.forEach((c) => {
    console.log(`${c._id.type} | ${c._id.category} | ${c._id.difficulty} -> ${c.count}`);
  });
  const total = await ContentModel.countDocuments();
  console.log('\nTOTAL DB DOCUMENTS:', total);
  await mongoose.disconnect();
}

check();
