import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function runBackfill() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI not found in .env');
  }

  console.log('Connecting to MongoDB for gamification backfill...');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

  const usersCollection = mongoose.connection.collection('users');

  const beforeUsers = await usersCollection.find({}, {
    projection: { email: 1, role: 1, exp: 1, streakDays: 1, averageScore: 1, level: 1 }
  }).toArray();

  console.log(`Found ${beforeUsers.length} users in database before backfill:`);
  console.table(beforeUsers.map(u => ({
    email: u.email,
    role: u.role,
    exp: u.exp,
    streak: u.streakDays,
    score: u.averageScore,
    level: u.level,
  })));

  const result = await usersCollection.updateMany(
    {},
    {
      $set: {
        exp: 0,
        weeklyExp: 0,
        streakDays: 0,
        totalPracticeMinutes: 0,
        averageScore: 0,
        level: 1,
        dailyExpAwarded: 0,
        dailyExpDateIST: '',
        weeklyExpResetAtIST: '',
        lastPracticeDateIST: '',
        totalSessionsCount: 0,
      },
    }
  );

  console.log(`\n✅ Backfill completed. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

  const afterUsers = await usersCollection.find({}, {
    projection: { email: 1, role: 1, exp: 1, streakDays: 1, averageScore: 1, level: 1 }
  }).toArray();

  console.log('\nUsers after backfill:');
  console.table(afterUsers.map(u => ({
    email: u.email,
    role: u.role,
    exp: u.exp,
    streak: u.streakDays,
    score: u.averageScore,
    level: u.level,
  })));

  await mongoose.disconnect();
}

runBackfill().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
