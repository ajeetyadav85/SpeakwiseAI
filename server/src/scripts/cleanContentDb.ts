import mongoose from 'mongoose';
import { ContentModel } from '../models/Content.model.js';
import { TopicModel } from '../models/Topic.model.js';

export function cleanTitleString(rawTitle: string): string {
  if (!rawTitle) return '';
  let cleaned = rawTitle.trim();

  // Pattern 1: Word_12345 -> Word (e.g. Perspicacity_64965 -> Perspicacity)
  cleaned = cleaned.replace(/_+\d+$/g, '');

  // Pattern 2: Phrase #12345 -> Phrase (e.g. Bite the bullet #12345 -> Bite the bullet)
  cleaned = cleaned.replace(/\s*#\d+$/g, '');

  // Pattern 3: Keynote #12345: Scaling Leadership -> Keynote: Scaling Leadership
  cleaned = cleaned.replace(/\s*#\d+:/g, ':');

  // Pattern 4: challenge #12345 in category -> challenge in category
  cleaned = cleaned.replace(/\s*#\d+\s*/g, ' ');

  // Pattern 5: Any remaining #\d+ anywhere in the title
  cleaned = cleaned.replace(/#\d+/g, '');

  // Normalize spaces and underscores
  cleaned = cleaned.replace(/_+/g, ' ').replace(/\s{2,}/g, ' ').trim();

  return cleaned;
}

async function runCleanup() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/speakwise_db';
  console.log(`\n======================================================`);
  console.log(`🧹 SPEAKWISE DB CLEANUP: REMOVE NUMBERS & DUPLICATES`);
  console.log(`Connecting to: ${mongoUri}...`);
  console.log(`======================================================\n`);

  await mongoose.connect(mongoUri);

  // 1. CLEAN CONTENTSMONGOOSE COLLECTION
  const allContents = await ContentModel.find({}).sort({ createdAt: 1, _id: 1 });
  console.log(`Found ${allContents.length} total documents in 'contents' collection.`);

  const seenMap = new Map<string, any>();
  const duplicateIdsToDelete: mongoose.Types.ObjectId[] = [];
  const updatesToApply: { id: mongoose.Types.ObjectId; title: string }[] = [];

  let titlesModifiedCount = 0;

  for (const doc of allContents) {
    const rawTitle = doc.title || '';
    const cleaned = cleanTitleString(rawTitle);

    if (cleaned !== rawTitle) {
      titlesModifiedCount++;
    }

    // Unique identity key based on type, normalized category, and normalized cleaned title
    const normKey = `${doc.type}__${(doc.category || '').toLowerCase().trim()}__${cleaned.toLowerCase().trim()}`;

    if (seenMap.has(normKey)) {
      // It's a duplicate! Mark for deletion
      duplicateIdsToDelete.push(doc._id as mongoose.Types.ObjectId);
    } else {
      // First occurrence - keep it
      seenMap.set(normKey, doc);
      if (cleaned !== rawTitle) {
        updatesToApply.push({ id: doc._id as mongoose.Types.ObjectId, title: cleaned });
      }
    }
  }

  console.log(`\n--- ANALYSIS RESULTS ---`);
  console.log(`Documents with number suffixes / formatting issues: ${titlesModifiedCount}`);
  console.log(`Duplicate documents identified for removal: ${duplicateIdsToDelete.length}`);
  console.log(`Unique documents to keep: ${seenMap.size}`);

  // 2. DELETE DUPLICATES
  if (duplicateIdsToDelete.length > 0) {
    const deleteResult = await ContentModel.deleteMany({ _id: { $in: duplicateIdsToDelete } });
    console.log(`\n🗑️ Deleted ${deleteResult.deletedCount} duplicate documents.`);
  }

  // 3. APPLY TITLE UPDATES (STRIP NUMBERS)
  if (updatesToApply.length > 0) {
    let updateCount = 0;
    for (const u of updatesToApply) {
      await ContentModel.updateOne({ _id: u.id }, { $set: { title: u.title } });
      updateCount++;
    }
    console.log(`✏️ Updated ${updateCount} documents to remove trailing numbers (e.g. Perspicacity_64965 -> Perspicacity).`);
  }

  // 4. CLEAN TOPICS COLLECTION (IF ANY)
  const allTopics = await TopicModel.find({}).sort({ _id: 1 });
  if (allTopics.length > 0) {
    console.log(`\nChecking ${allTopics.length} documents in 'topics' collection...`);
    const seenTopicMap = new Map<string, any>();
    const dupTopicIds: mongoose.Types.ObjectId[] = [];

    for (const t of allTopics) {
      const cleaned = cleanTitleString(t.title);
      const normKey = `${(t.category || '').toLowerCase().trim()}__${cleaned.toLowerCase().trim()}`;
      if (seenTopicMap.has(normKey)) {
        dupTopicIds.push(t._id as mongoose.Types.ObjectId);
      } else {
        seenTopicMap.set(normKey, t);
        if (cleaned !== t.title) {
          await TopicModel.updateOne({ _id: t._id }, { $set: { title: cleaned } });
        }
      }
    }
    if (dupTopicIds.length > 0) {
      const res = await TopicModel.deleteMany({ _id: { $in: dupTopicIds } });
      console.log(`🗑️ Deleted ${res.deletedCount} duplicate topics in 'topics' collection.`);
    }
  }

  // 5. POST-CLEANUP VERIFICATION
  const remainingCount = await ContentModel.countDocuments();
  console.log(`\n======================================================`);
  console.log(`✅ CLEANUP COMPLETED! Remaining docs in DB: ${remainingCount}`);
  console.log(`======================================================\n`);

  // Verify no numbers remain in WORD titles
  const sampleWords = await ContentModel.find({ type: 'WORD' }).limit(20);
  console.log(`Sample WORD titles in DB after cleanup:`);
  sampleWords.forEach((w) => console.log(`  - [${w.category}] "${w.title}"`));

  // Verify no numbers remain in TOPIC titles
  const sampleTopics = await ContentModel.find({ type: 'TOPIC' }).limit(10);
  console.log(`\nSample TOPIC titles in DB after cleanup:`);
  sampleTopics.forEach((t) => console.log(`  - [${t.category}] "${t.title}"`));

  // Check if any numbers remain in any title in the entire DB
  const lingeringNumberDocs = await ContentModel.find({
    $or: [
      { title: { $regex: /_\d+/ } },
      { title: { $regex: /#\d+/ } },
    ],
  });
  console.log(`\nLingering titles with _digits or #digits: ${lingeringNumberDocs.length}`);
  if (lingeringNumberDocs.length > 0) {
    lingeringNumberDocs.forEach((d) => console.log(`  Lingering: "${d.title}"`));
  } else {
    console.log(`🎉 100% clean! Zero titles contain number suffixes.`);
  }

  await mongoose.disconnect();
}

runCleanup().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
