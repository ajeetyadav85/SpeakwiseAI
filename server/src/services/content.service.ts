import { ContentModel, ContentType, DifficultyLevel, IContent } from '../models/Content.model.js';
import { seedContentDatabase } from './seedContent.service.js';
import { AutoFillContentService, getContentThreshold } from './autoFillContent.service.js';
import { logger } from '../utils/logger.js';

const ALL_TOPIC_CATEGORIES = [
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

const ALL_WORD_CATEGORIES = ['Words', 'Phrases', 'Idioms', 'Vocabulary'];
const ALL_QUESTION_CATEGORIES = ['General', 'Interview', 'Leadership', 'Behavioral'];
const ALL_CORPORATE_TALK_CATEGORIES = [
  'Executive Pitch',
  'Townhall Address',
  'Product Launch',
  'Crisis Management',
  'Meeting Conversation',
];

export class ContentService {
  public static async getRandomContent(
    rawType?: string,
    rawCategory?: string,
    rawDifficulty?: string
  ): Promise<IContent | any> {
    await seedContentDatabase();

    const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    // 1. Resolve Content Type (Support Freestyle / Random)
    let type: ContentType = 'TOPIC';
    const normType = (rawType || '').trim().toUpperCase();
    if (normType === 'FREESTYLE' || normType === 'RANDOM' || !normType) {
      type = pickRandom(['TOPIC', 'QUESTION', 'WORD', 'CORPORATE_TALK']);
    } else if (['TOPIC', 'QUESTION', 'WORD', 'CORPORATE_TALK'].includes(normType)) {
      type = normType as ContentType;
    }

    // 2. Resolve Difficulty (Support Random)
    const difficulties: DifficultyLevel[] = ['Easy', 'Medium', 'Hard'];
    let difficulty: DifficultyLevel = 'Medium';
    if (!rawDifficulty || rawDifficulty === 'Random' || rawDifficulty === 'All') {
      difficulty = pickRandom(difficulties);
    } else if (['Easy', 'Medium', 'Hard'].includes(rawDifficulty)) {
      difficulty = rawDifficulty as DifficultyLevel;
    }

    // 3. Resolve Category (Support Random / Freestyle)
    let category = rawCategory ? rawCategory.trim() : '';
    if (!category || category === 'Random' || category === 'All' || category === 'Freestyle') {
      switch (type) {
        case 'WORD':
          category = pickRandom(ALL_WORD_CATEGORIES);
          break;
        case 'QUESTION':
          category = pickRandom(ALL_QUESTION_CATEGORIES);
          break;
        case 'CORPORATE_TALK':
          category = pickRandom(ALL_CORPORATE_TALK_CATEGORIES);
          break;
        default:
          category = pickRandom(ALL_TOPIC_CATEGORIES);
          break;
      }
    }

    const threshold = getContentThreshold(type, category, difficulty);
    const matchFilter: any = {
      type,
      category: { $regex: new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      difficulty,
    };

    // Step 1: Count Matching Records in MongoDB
    const count = await ContentModel.countDocuments(matchFilter);
    logger.info(`MongoDB Count Check (${type}/${category}/${difficulty}): ${count} docs (Threshold: ${threshold})`);

    // ==================== CASE 3: Count >= Threshold ====================
    if (count >= threshold) {
      try {
        const sample = await ContentModel.aggregate([
          { $match: matchFilter },
          { $sample: { size: 1 } },
        ]);

        if (sample && sample.length > 0) {
          logger.info(`⚡ [Case 3: Count >= Threshold] Instant DB Response: "${sample[0].title}"`);
          return sample[0];
        }
      } catch (e) {
        logger.warn('MongoDB aggregation sampling error in Case 3:', e);
      }
    }

    // ==================== CASE 2: Count >= 5 & Count < Threshold ====================
    if (count >= 5) {
      try {
        const sample = await ContentModel.aggregate([
          { $match: matchFilter },
          { $sample: { size: 1 } },
        ]);

        if (sample && sample.length > 0) {
          logger.info(`⚡ [Case 2: Count (${count}) >= 5] Instant DB Response: "${sample[0].title}". Triggering Background Auto-Fill...`);
          AutoFillContentService.checkAndAutoFill(type, category, difficulty);
          return sample[0];
        }
      } catch (e) {
        logger.warn('MongoDB aggregation sampling error in Case 2:', e);
      }
    }

    // ==================== CASE 1: Count < 5 (Need Fresh AI Batch) ====================
    logger.info(`🚨 [Case 1: Count (${count}) < 5] Generating Fresh AI Batch for (${type}/${category}/${difficulty})...`);
    const initialBatch = await AutoFillContentService.generateInitialBatch(type, category, difficulty, 10);

    // Launch background process to continue auto-filling up to threshold
    AutoFillContentService.checkAndAutoFill(type, category, difficulty);

    if (initialBatch && initialBatch.length > 0) {
      const selectedItem = initialBatch[Math.floor(Math.random() * initialBatch.length)];
      logger.info(`✨ Returned fresh item from new AI API batch: "${selectedItem.title}"`);
      return selectedItem;
    }

    // Fallback if initial batch returns empty
    const fallbackItem = this.generateDynamicPrompt(type, category, difficulty);
    await ContentModel.create({
      type,
      category,
      difficulty,
      title: fallbackItem.title,
      meaning: fallbackItem.meaning,
      contentOverview: fallbackItem.contentOverview,
      hint: fallbackItem.hint,
      suggestedDurationSeconds: fallbackItem.suggestedDurationSeconds || 150,
    }).catch(() => {});

    return fallbackItem;
  }

  public static async getCategories(type: ContentType): Promise<string[]> {
    await seedContentDatabase();

    try {
      const categories = await ContentModel.distinct('category', { type });
      if (categories && categories.length > 0) {
        return categories;
      }
    } catch (e) {
      logger.warn('Error fetching distinct categories from MongoDB:', e);
    }

    switch (type) {
      case 'WORD':
        return ALL_WORD_CATEGORIES;
      case 'QUESTION':
        return ALL_QUESTION_CATEGORIES;
      case 'CORPORATE_TALK':
        return ALL_CORPORATE_TALK_CATEGORIES;
      default:
        return ALL_TOPIC_CATEGORIES;
    }
  }

  private static generateDynamicPrompt(
    type: ContentType,
    category: string,
    difficulty: DifficultyLevel
  ): {
    title: string;
    meaning: string;
    contentOverview: string;
    hint: string;
    suggestedDurationSeconds: number;
  } {
    const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    if (type === 'WORD') {
      if (category.toLowerCase().includes('phrase') || category.toLowerCase().includes('idiom')) {
        const idiomsBank = [
          { title: 'Bite the Bullet', meaning: 'To face a difficult situation with courage and get it over with, despite reluctance.', hint: 'Share a story about tackling a tough task procrastination only made worse.', suggestedDurationSeconds: 120 },
          { title: 'Steal Someone’s Thunder', meaning: 'To take credit for someone else’s ideas or overshadow their accomplishment prematurely.', hint: 'Discuss workplace recognition integrity and giving team members credit.', suggestedDurationSeconds: 120 },
          { title: 'Burn the Midnight Oil', meaning: 'To work late into the night with extreme dedication and intense focus.', hint: 'Contrast short-term hard work sprints with sustainable long-term pacing.', suggestedDurationSeconds: 120 },
        ];
        const selectedIdiom = pickRandom(idiomsBank);
        return {
          title: selectedIdiom.title,
          meaning: selectedIdiom.meaning,
          contentOverview: `The idiom "${selectedIdiom.title}" is widely used in executive communication.`,
          hint: selectedIdiom.hint,
          suggestedDurationSeconds: selectedIdiom.suggestedDurationSeconds,
        };
      } else {
        const singleWordsBank = [
          { title: 'Perseverance', meaning: 'Persistence in doing something despite difficulty or delay.', hint: 'Share a story of a personal project where perseverance yielded success.', suggestedDurationSeconds: 90 },
          { title: 'Serendipity', meaning: 'The occurrence of beneficial events by chance.', hint: 'Tell a story about an unexpected discovery that unlocked massive value.', suggestedDurationSeconds: 90 },
          { title: 'Equanimity', meaning: 'Mental calmness and composure in difficult situations.', hint: 'Explain maintaining emotional composure during high-stakes executive crisis.', suggestedDurationSeconds: 120 },
        ];
        const selectedWord = pickRandom(singleWordsBank);
        return {
          title: selectedWord.title,
          meaning: selectedWord.meaning,
          contentOverview: `The word "${selectedWord.title}" is a key vocabulary term in professional communication.`,
          hint: selectedWord.hint,
          suggestedDurationSeconds: selectedWord.suggestedDurationSeconds,
        };
      }
    }

    const topicAngles = [
      'The Unintended Consequences of',
      'Navigating Strategic Dilemmas in',
      'Rethinking Traditional Models of',
      'How Modern Leaders Are Adapting to',
    ];

    const chosenAngle = pickRandom(topicAngles);
    const dynamicTitle = `${chosenAngle} ${category} Innovations`;

    return {
      title: dynamicTitle,
      meaning: `Analyzing how ${category.toLowerCase()} reshapes industry dynamics and executive decision-making.`,
      contentOverview: `As global complexity accelerates, understanding ${category.toLowerCase()} provides a strategic advantage.`,
      hint: `Structure your talk into 3 key pillars: 1. Context, 2. Challenge, 3. Actionable Recommendations.`,
      suggestedDurationSeconds: 150,
    };
  }
}
