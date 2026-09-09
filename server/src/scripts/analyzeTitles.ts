import mongoose from 'mongoose';
import { ContentModel } from '../models/Content.model.js';
import { TopicModel } from '../models/Topic.model.js';

function cleanTitle(rawTitle: string): string {
  if (!rawTitle) return '';
  let cleaned = rawTitle.trim();

  // Pattern 1: Word_12345 -> Word (e.g. Perspicacity_64965 -> Perspicacity)
  cleaned = cleaned.replace(/_+\d+$/g, '');

  // Pattern 2: Phrase #12345 -> Phrase
  cleaned = cleaned.replace(/\s*#\d+$/g, '');

  // Pattern 3: "challenge #12345 in category" -> "challenge in category"
  cleaned = cleaned.replace(/\s*#\d+\s*/g, ' ');

  // Pattern 4: "Keynote #12345: Scaling Leadership" -> "Keynote: Scaling Leadership"
  cleaned = cleaned.replace(/\s*#\d+:/g, ':');

  // Pattern 5: Any trailing numbers like "Topic 12345" if generated
  // But be careful with genuine topics that might have numbers like "Web 3.0"
  cleaned = cleaned.replace(/_+/g, ' ').replace(/\s{2,}/g, ' ').trim();

  return cleaned;
}

async function analyze() {
  await mongoose.connect('mongodb://127.0.0.1:27017/speakwise_db');

  const allContents = await ContentModel.find({});
  console.log(`Total contents: ${allContents.length}`);

  let contentsWithNumbers = 0;
  const sampleCleaned: { original: string; cleaned: string }[] = [];

  for (const doc of allContents) {
    const cleaned = cleanTitle(doc.title);
    if (cleaned !== doc.title) {
      contentsWithNumbers++;
      if (sampleCleaned.length < 25) {
        sampleCleaned.push({ original: doc.title, cleaned });
      }
    }
  }

  console.log(`\nContents with generated numbers: ${contentsWithNumbers} / ${allContents.length}`);
  console.log('Samples:');
  sampleCleaned.forEach((s) => console.log(`  "${s.original}" => "${s.cleaned}"`));

  // Check Topics collection
  const allTopics = await TopicModel.find({});
  console.log(`\nTotal topics in TopicModel: ${allTopics.length}`);
  let topicsWithNumbers = 0;
  for (const doc of allTopics) {
    const cleaned = cleanTitle(doc.title);
    if (cleaned !== doc.title) {
      topicsWithNumbers++;
      console.log(`  Topic: "${doc.title}" => "${cleaned}"`);
    }
  }

  // Duplicate check on contents after cleaning
  const seenMap = new Map<string, string[]>();
  let duplicateCount = 0;

  for (const doc of allContents) {
    const cleaned = cleanTitle(doc.title).toLowerCase();
    const key = `${doc.type}__${(doc.category || '').toLowerCase()}__${cleaned}`;
    if (seenMap.has(key)) {
      duplicateCount++;
      seenMap.get(key)!.push(doc._id.toString());
    } else {
      seenMap.set(key, [doc._id.toString()]);
    }
  }

  console.log(`\nDuplicate documents that will be merged/removed: ${duplicateCount}`);
  console.log(`Unique items remaining after cleaning and deduplication: ${seenMap.size}`);

  await mongoose.disconnect();
}

analyze().catch(console.error);
