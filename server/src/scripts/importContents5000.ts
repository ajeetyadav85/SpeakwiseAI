import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import dns from 'dns';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

// Use public DNS to ensure Atlas SRV records resolve smoothly on Windows
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // Ignore if not supported
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env');
  process.exit(1);
}

async function runImport() {
  console.log('====================================================');
  console.log('🚀 SPEAKWISE AI: 5,000 PROMPTS BULK IMPORT');
  console.log('====================================================');
  console.log(`Connecting to MongoDB Atlas...`);

  await mongoose.connect(MONGODB_URI!);
  console.log('✅ Connected to MongoDB Atlas successfully.\n');

  const contentsCollection = mongoose.connection.db!.collection('contents');

  // 1. Initial count
  const initialCount = await contentsCollection.countDocuments();
  console.log(`📊 Initial documents count in 'contents' collection: ${initialCount}`);

  // 2. Read JSON file
  const jsonPath = path.resolve(__dirname, '../../../speakwise_contents_5000.json');
  console.log(`📖 Reading JSON file from: ${jsonPath}`);
  
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`File not found at: ${jsonPath}`);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const items: any[] = JSON.parse(rawData);
  console.log(`📦 Loaded ${items.length} items from JSON file.`);

  // 3. Prepare documents
  const docsToInsert = items.map((item) => {
    const doc: any = {
      type: item.type,
      category: item.category,
      difficulty: item.difficulty,
      title: item.title,
      meaning: item.meaning,
      contentOverview: item.contentOverview,
      hint: item.hint,
      suggestedDurationSeconds: item.suggestedDurationSeconds || 150,
      createdAt: item.createdAt?.$date ? new Date(item.createdAt.$date) : (item.createdAt ? new Date(item.createdAt) : new Date()),
      updatedAt: item.updatedAt?.$date ? new Date(item.updatedAt.$date) : (item.updatedAt ? new Date(item.updatedAt) : new Date()),
    };

    // Ensure _id is never present so MongoDB auto-generates it
    delete doc._id;

    return doc;
  });

  // 4. Bulk insert in batches of 1,000
  const BATCH_SIZE = 1000;
  let totalInserted = 0;
  const insertedIds: any[] = [];

  for (let i = 0; i < docsToInsert.length; i += BATCH_SIZE) {
    const batch = docsToInsert.slice(i, i + BATCH_SIZE);
    const result = await contentsCollection.insertMany(batch, { ordered: false });
    totalInserted += result.insertedCount;
    // Keep some inserted IDs for sampling
    if (insertedIds.length < 5) {
      insertedIds.push(...Object.values(result.insertedIds).slice(0, 5 - insertedIds.length));
    }
    console.log(`➡️  Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(docsToInsert.length / BATCH_SIZE)} (${totalInserted}/${docsToInsert.length})`);
  }

  console.log(`\n🎉 Bulk import complete! Total inserted: ${totalInserted}`);

  // 5. Verification
  const finalCount = await contentsCollection.countDocuments();
  console.log(`\n====================================================`);
  console.log(`📊 FINAL VERIFICATION:`);
  console.log(`   Initial count: ${initialCount}`);
  console.log(`   Documents added: ${totalInserted}`);
  console.log(`   Final count in collection: ${finalCount}`);
  console.log(`   Expected count: ${initialCount + 5000}`);
  console.log(`   Match: ${finalCount === initialCount + 5000 ? '✅ YES' : '❌ NO'}`);
  console.log(`====================================================\n`);

  // 6. Fetch sample inserted documents
  console.log('🔍 SAMPLE INSERTED DOCUMENTS (Auto-generated _id & fields):');
  const samples = await contentsCollection.find({ _id: { $in: insertedIds.slice(0, 3) } }).toArray();
  samples.forEach((sample, idx) => {
    console.log(`\n--- Sample Document #${idx + 1} ---`);
    console.log(JSON.stringify(sample, null, 2));
  });

  await mongoose.disconnect();
  console.log('\n🔌 Disconnected from MongoDB Atlas.');
}

runImport().catch((err) => {
  console.error('❌ Import failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
