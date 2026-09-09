import { ContentModel, ContentType, DifficultyLevel } from '../models/Content.model.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

/**
 * Dynamic Threshold Matrix (Per Combination of Type, Category, Difficulty)
 * - Topics: 100 for each of 15 categories per difficulty = 4,500 total topics
 * - Words: 1,000 per difficulty for single words (3,000 total) & 200 per difficulty for phrases (600 total)
 * - Questions: 500 per difficulty for General (1,500 total) & 100 per difficulty for Interview (300 total)
 * - Corporate Talks: 50 per difficulty per type (600 total) & ~67 per difficulty for Meeting Conversation (200 total)
 */
export function getContentThreshold(
  type: ContentType,
  category: string,
  difficulty: DifficultyLevel
): number {
  const normCategory = (category || '').trim().toLowerCase();

  switch (type) {
    case 'TOPIC':
      return 100; // 100 per difficulty for each of the 15 categories

    case 'WORD':
      if (normCategory.includes('phrase') || normCategory.includes('idiom')) {
        return 200; // 200 per difficulty for phrases/idioms
      }
      return 1000; // 1,000 per difficulty for single words

    case 'QUESTION':
      if (normCategory.includes('interview')) {
        return 100; // 100 per difficulty for interview questions
      }
      return 500; // 500 per difficulty for general questions

    case 'CORPORATE_TALK':
      if (normCategory.includes('meeting')) {
        return 67; // ~200 total across 3 difficulties
      }
      return 50; // 50 per difficulty for specific corporate talk categories

    default:
      return 100;
  }
}

// Tracks active background auto-fill jobs per combo (type_category_difficulty)
const activeAutoFillTasks = new Set<string>();

export class AutoFillContentService {
  private static getGroqApiKey(): string | null {
    const key = process.env.GROQ_API_KEY || env.GROQ_API_KEY || '';
    return key && key.trim().length > 5 ? key.trim() : null;
  }

  private static getGeminiApiKey(): string | null {
    const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '';
    return key && key.trim().length > 10 ? key.trim() : null;
  }

  public static async checkAndAutoFill(
    type: ContentType,
    category: string,
    difficulty: DifficultyLevel
  ): Promise<void> {
    const taskKey = `${type}_${category}_${difficulty}`;

    if (activeAutoFillTasks.has(taskKey)) {
      logger.info(`⏳ [Auto-Fill] Task (${taskKey}) is already running in background.`);
      return;
    }

    const threshold = getContentThreshold(type, category, difficulty);
    const categoryRegex = new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    const currentCount = await ContentModel.countDocuments({
      type,
      category: { $regex: categoryRegex },
      difficulty,
    });

    if (currentCount >= threshold) {
      logger.info(`🎯 [Auto-Fill Threshold Reached] Combo: (${taskKey}) Current: ${currentCount}/${threshold} docs in DB. Skipping auto-fill.`);
      return; // Threshold reached!
    }

    // Launch non-blocking background auto-fill process
    activeAutoFillTasks.add(taskKey);

    setImmediate(async () => {
      try {
        logger.info(`🚀 [Groq Background Auto-Fill Started] Combo: (${taskKey}) Current: ${currentCount}/${threshold}`);
        await this.runAutoFillLoop(type, category, difficulty, threshold);
      } catch (err) {
        logger.warn(`Background Auto-Fill error for ${taskKey}:`, err);
      } finally {
        activeAutoFillTasks.delete(taskKey);
      }
    });
  }

  public static async generateInitialBatch(
    type: ContentType,
    category: string,
    difficulty: DifficultyLevel,
    count: number = 10
  ): Promise<any[]> {
    logger.info(`Generating initial batch of ${count} records via AI Engine for (${type}/${category}/${difficulty})...`);
    const batch = await this.generateBatchWithAI(type, category, difficulty, count);

    // Deduplicate against existing MongoDB entries (case-insensitive)
    const categoryRegex = new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    const existingTitles = await ContentModel.distinct('title', { type, category: { $regex: categoryRegex } });
    const existingSet = new Set(existingTitles.map((t) => (t || '').toLowerCase().trim()));

    const uniqueBatch = batch.filter(
      (item) => item.title && !existingSet.has(item.title.toLowerCase().trim())
    );

    if (uniqueBatch.length > 0) {
      try {
        await ContentModel.insertMany(uniqueBatch, { ordered: false });
        logger.info(`Saved ${uniqueBatch.length} initial records into MongoDB for (${type}/${category}/${difficulty}).`);
      } catch (err) {
        logger.warn('Initial batch insert error:', err);
      }
    }

    return uniqueBatch.length > 0 ? uniqueBatch : batch;
  }

  private static async runAutoFillLoop(
    type: ContentType,
    category: string,
    difficulty: DifficultyLevel,
    threshold: number
  ): Promise<void> {
    const categoryRegex = new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    let currentCount = await ContentModel.countDocuments({ type, category: { $regex: categoryRegex }, difficulty });

    logger.info(`🚀 [Auto-Fill Triggered] Target threshold: ${threshold} | Current count in DB: ${currentCount} | Combo: (${type}/${category}/${difficulty})`);

    // Run 2 batches per trigger to rapidly populate DB without hitting rate limits
    let batchesToRun = 2;

    while (currentCount < threshold && batchesToRun > 0) {
      batchesToRun--;

      // 1. Fetch existing titles for deduplication & prompt exclusion
      const existingDocTitles = await ContentModel.distinct('title', { type, category: { $regex: categoryRegex }, difficulty });

      // 2. Call AI Engine with existing titles exclusion list
      const newBatch = await this.generateBatchWithAI(type, category, difficulty, 10, existingDocTitles);

      if (!newBatch || newBatch.length === 0) {
        logger.warn(`⚠️ [Auto-Fill Note] AI Engine returned 0 items for (${type}/${category}/${difficulty}).`);
        break;
      }

      // 3. Filter duplicates against existing MongoDB titles
      const existingSet = new Set(existingDocTitles.map((t) => (t || '').toLowerCase().trim()));
      const uniqueRecords = newBatch.filter(
        (item) => item.title && !existingSet.has(item.title.toLowerCase().trim())
      );

      if (uniqueRecords.length > 0) {
        try {
          await ContentModel.insertMany(uniqueRecords, { ordered: false });
        } catch (err: any) {
          logger.warn(`⚠️ [MongoDB Insert Note] Bulk insert result: ${err.message}`);
        }
        currentCount = await ContentModel.countDocuments({ type, category: { $regex: categoryRegex }, difficulty });
        logger.info(`✨ [Auto-Fill Success] Saved ${uniqueRecords.length} new unique items to MongoDB (${type}/${category}/${difficulty}) -> New DB Total: ${currentCount}/${threshold}`);
      } else {
        logger.warn(`⚠️ [Auto-Fill Warning] Generated items overlapped with existing titles.`);
      }
    }
  }

  private static async generateBatchWithAI(
    type: ContentType,
    category: string,
    difficulty: DifficultyLevel,
    batchSize: number,
    existingTitles: string[] = []
  ): Promise<any[]> {
    const groqKey = this.getGroqApiKey();
    if (groqKey) {
      logger.info(`🤖 [AI Engine] Attempting prompt generation via Groq API (Key: ${groqKey.substring(0, 8)}...)...`);
      const groqBatch = await this.generateBatchWithGroq(groqKey, type, category, difficulty, batchSize, existingTitles);
      if (groqBatch && groqBatch.length > 0) {
        return groqBatch;
      }
      logger.warn(`⚠️ [AI Engine] Groq API returned empty batch. Falling back to Gemini API...`);
    } else {
      logger.info(`ℹ️ [AI Engine] No GROQ_API_KEY found in env.`);
    }

    const geminiKey = this.getGeminiApiKey();
    if (geminiKey) {
      logger.info(`🤖 [AI Engine] Attempting prompt generation via Gemini API (Key: ${geminiKey.substring(0, 8)}...)...`);
      const geminiBatch = await this.generateBatchWithGemini(geminiKey, type, category, difficulty, batchSize, existingTitles);
      if (geminiBatch && geminiBatch.length > 0) {
        return geminiBatch;
      }
      logger.warn(`⚠️ [AI Engine] Gemini API returned empty batch. Falling back to Algorithmic Batch Generator...`);
    } else {
      logger.info(`ℹ️ [AI Engine] No GEMINI_API_KEY found in env.`);
    }

    logger.info(`⚡ [AI Engine] Using Algorithmic Batch Generator fallback...`);
    return this.generateAlgorithmicBatch(type, category, difficulty, batchSize, existingTitles);
  }

  private static async generateBatchWithGroq(
    apiKey: string,
    type: ContentType,
    category: string,
    difficulty: DifficultyLevel,
    batchSize: number,
    existingTitles: string[] = []
  ): Promise<any[]> {
    const randomSeed = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const excludeText = existingTitles.length > 0
      ? `\nCRITICAL REQUIREMENT: Do NOT generate any of these existing titles (already in DB):\n${existingTitles.slice(0, 25).map(t => `- "${t}"`).join('\n')}\n`
      : '';

    const promptText = `Generate a JSON array of ${batchSize} 100% unique, highly creative, non-repetitive items for a public speaking application.
Type: ${type}
Category: ${category}
Difficulty: ${difficulty}
Seed: ${randomSeed}
${excludeText}
Requirements:
- If type is WORD and category is Word/Words/Vocabulary: title MUST strictly be a single word (e.g. "Perspicacity", "Resilience").
- If type is WORD and category is Phrases/Idioms: title MUST strictly be a multi-word idiom or common phrase (e.g. "Bite the Bullet", "Break the Ice").
- If type is TOPIC: title MUST be a specific, thought-provoking public speaking topic.
- If type is QUESTION and category is General: title MUST be a broad reflective question.
- If type is QUESTION and category is Interview: title MUST be a realistic behavioral or technical job interview question.
- If type is CORPORATE_TALK: title MUST be a realistic executive pitch, keynote, townhall, or crisis talk title.

Respond strictly with valid JSON only (no markdown fences, no text before or after):
[
  {
    "type": "${type}",
    "category": "${category}",
    "difficulty": "${difficulty}",
    "title": "Title or Word or Question",
    "meaning": "Clear concise meaning, definition, or goal of the prompt",
    "contentOverview": "A brief background narrative or contextual summary (2-3 sentences)",
    "hint": "Practical public speaking advice or speech outline hint",
    "suggestedDurationSeconds": 150
  }
]`;

    const groqModels = [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
    ];

    for (const model of groqModels) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: 'You are a public speaking content generator. Output strictly valid JSON arrays only without any formatting text or markdown codeblocks.',
              },
              {
                role: 'user',
                content: promptText,
              },
            ],
            temperature: 0.7,
            max_tokens: 4096,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          logger.warn(`⚠️ Groq model ${model} HTTP ${response.status} Error: ${errorText.substring(0, 200)}`);
          continue;
        }

        const data: any = await response.json();
        const rawText = data?.choices?.[0]?.message?.content;
        if (!rawText) continue;

        let cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstBracket = cleanJson.indexOf('[');
        const lastBracket = cleanJson.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
          cleanJson = cleanJson.substring(firstBracket, lastBracket + 1);
        }

        const parsed = JSON.parse(cleanJson);

        if (Array.isArray(parsed) && parsed.length > 0) {
          logger.info(`⚡ [Groq API Success] Generated ${parsed.length} items using model ${model}`);
          return parsed.map((item) => ({
            type,
            category,
            difficulty,
            title: (item.title || '').trim(),
            meaning: item.meaning || 'Detailed definition and speaking breakdown.',
            contentOverview: item.contentOverview || 'Structured context for practice delivery.',
            hint: item.hint || 'Focus on vocal clarity, posture, and pacing.',
            suggestedDurationSeconds: item.suggestedDurationSeconds || 150,
          }));
        }
      } catch (err: any) {
        logger.warn(`⚠️ Groq API model ${model} exception: ${err.message}`);
      }
    }

    return [];
  }

  private static async generateBatchWithGemini(
    apiKey: string,
    type: ContentType,
    category: string,
    difficulty: DifficultyLevel,
    batchSize: number,
    existingTitles: string[] = []
  ): Promise<any[]> {
    const randomSeed = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const excludeText = existingTitles.length > 0
      ? `\nCRITICAL: Do NOT generate any of these existing titles (already in DB):\n${existingTitles.slice(0, 25).map(t => `- "${t}"`).join('\n')}\n`
      : '';

    const promptText = `Generate a JSON array of ${batchSize} 100% unique ${type} items for a public speaking app.
Category: ${category}
Difficulty: ${difficulty}
Seed: ${randomSeed}
${excludeText}
Format strictly as JSON array with fields: type, category, difficulty, title, meaning, contentOverview, hint, suggestedDurationSeconds.`;

    const modelEndpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
    ];

    for (const endpoint of modelEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
          }),
        });

        const data: any = await response.json();
        if (!response.ok || data.error) {
          logger.warn(`⚠️ Gemini Endpoint Error (${response.status}): ${JSON.stringify(data.error || 'Unknown error')}`);
          continue;
        }

        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) continue;

        let cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstBracket = cleanJson.indexOf('[');
        const lastBracket = cleanJson.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
          cleanJson = cleanJson.substring(firstBracket, lastBracket + 1);
        }

        const parsed = JSON.parse(cleanJson);

        if (Array.isArray(parsed) && parsed.length > 0) {
          logger.info(`✨ [Gemini API Success] Generated ${parsed.length} items via Gemini API`);
          return parsed.map((item) => ({
            type,
            category,
            difficulty,
            title: (item.title || '').trim(),
            meaning: item.meaning || 'Explanation generated via Gemini AI.',
            contentOverview: item.contentOverview || 'Structured narrative summary.',
            hint: item.hint || 'Focus on pacing and executive presence.',
            suggestedDurationSeconds: item.suggestedDurationSeconds || 150,
          }));
        }
      } catch (err: any) {
        logger.warn(`⚠️ Gemini batch generator endpoint exception: ${err.message}`);
      }
    }

    return [];
  }

  private static readonly VOCABULARY_WORDS = [
    'Perspicacity', 'Equanimity', 'Serendipity', 'Magnanimous', 'Alacrity', 'Ubiquitous',
    'Ineffable', 'Obfuscate', 'Pernicious', 'Ephemeral', 'Verisimilitude', 'Vicarious',
    'Fastidious', 'Tenacious', 'Eloquence', 'Resilience', 'Perseverance', 'Pragmatism',
    'Sagacity', 'Mellifluous', 'Altruism', 'Assiduous', 'Capitulate', 'Circumspect',
    'Clandestine', 'Cogent', 'Complaisant', 'Concomitant', 'Conflagration', 'Connoisseur',
    'Convivial', 'Corpulence', 'Deference', 'Demagogue', 'Despot', 'Diaphanous',
    'Diffident', 'Discomfit', 'Disparate', 'Dissemble', 'Duplicity', 'Ebony',
    'Ebullient', 'Eclectic', 'Efficacious', 'Effrontery', 'Egregious', 'Enervate',
    'Engender', 'Ennui', 'Equivocal', 'Evanescent', 'Exculpate', 'Exigent',
    'Expiate', 'Expunge', 'Extant', 'Extol', 'Fallacious', 'Fatuous',
    'Fervent', 'Florid', 'Fractious', 'Garrulous', 'Grandiloquent', 'Gregarious',
    'Hackneyed', 'Hapless', 'Harangue', 'Hegemony', 'Heterogeneous', 'Iconoclast',
    'Idiosyncratic', 'Ignominious', 'Impassive', 'Imperious', 'Impertinent', 'Impervious',
    'Impetuous', 'Impinge', 'Implacable', 'Impudent', 'Inchoate', 'Incontrovertible',
    'Indefatigable', 'Indolent', 'Ineluctable', 'Inert', 'Ingenuous', 'Inimical',
    'Iniquity', 'Insidious', 'Intransigent', 'Inure', 'Invective', 'Inveterate',
    'Jubilant', 'Juxtaposition', 'Laconic', 'Languid', 'Largesse', 'Latent',
    'Legerdemain', 'Licentious', 'Limpid', 'Litigant', 'Lucid', 'Luminescence',
    'Machination', 'Maelstrom', 'Malevolent', 'Malleable', 'Maverick', 'Mendacious',
    'Mercurial', 'Modicum', 'Morass', 'Munificent', 'Myriad', 'Nadir',
    'Nascent', 'Nebulous', 'Nefarious', 'Neophyte', 'Nexus', 'Nocturnal',
    'Nonchalant', 'Noxious', 'Nuance', 'Obdurate', 'Obsequious', 'Obstreperous',
    'Officious', 'Onerous', 'Opulent', 'Ostensible', 'Ostentatious', 'Palliate',
    'Pallid', 'Panacea', 'Paradigm', 'Paragon', 'Pariah', 'Parsimony',
    'Pathos', 'Paucity', 'Pejorative', 'Pellucid', 'Penchant', 'Penurious',
    'Perfidious', 'Perfunctory', 'Petulance', 'Placate', 'Platitude', 'Plethora',
    'Poignant', 'Polemic', 'Portentous', 'Precocious', 'Predilection', 'Prescience',
    'Proclivity', 'Prodigal', 'Profligate', 'Profuse', 'Promulgate', 'Propensity',
    'Propitious', 'Prurient', 'Puerile', 'Pugnacious', 'Pulchritude', 'Punctilious',
    'Quagmire', 'Querulous', 'Quixotic', 'Rancor', 'Rebuke', 'Recalcitrant',
    'Redoubtable', 'Relegate', 'Remiss', 'Replete', 'Reprobate', 'Repudiate',
    'Rescind', 'Restitution', 'Reticent', 'Revere', 'Ribald', 'Rife',
    'Ruse', 'Sacrosanct', 'Salient', 'Sanctimonious', 'Sanguine', 'Scurrilous',
    'Sedulous', 'Seminal', 'Sobriety', 'Solipsism', 'Spurious', 'Staid',
    'Stoic', 'Stratagem', 'Strident', 'Stupefy', 'Surfeit', 'Surreptitious',
    'Sycophant', 'Tacit', 'Taciturn', 'Tantamount', 'Temerity', 'Tenuous',
    'Timorous', 'Torpid', 'Tractable', 'Transient', 'Transmute', 'Tremulous',
    'Trenchant', 'Trite', 'Truncate', 'Turgid', 'Turpitude', 'Umbrage',
    'Unctuous', 'Undulate', 'Upbraid', 'Usurp', 'Vacillate', 'Variegated',
    'Venerable', 'Veracity', 'Verbose', 'Verdant', 'Vestige', 'Vex',
    'Vicissitude', 'Vilify', 'Vindicate', 'Virulent', 'Viscous', 'Vitiate',
    'Vituperate', 'Vivacious', 'Voluble', 'Voracious', 'Wane', 'Wanton',
    'Whimsical', 'Wily', 'Winsome', 'Wistful', 'Zealot', 'Zenith', 'Zephyr'
  ];

  private static readonly PHRASES_AND_IDIOMS = [
    'Bite the bullet', 'Burn the midnight oil', 'Hit the nail on the head',
    'Steal someone’s thunder', 'Break the ice', 'Add fuel to the fire',
    'Ball is in your court', 'Barking up the wrong tree', 'Blessing in disguise',
    'Call it a day', 'Cut corners', 'Cutting-edge', 'Devil’s advocate',
    'Elephant in the room', 'Fit as a fiddle', 'Getting a second wind',
    'Give someone the benefit of the doubt', 'Go back to the drawing board',
    'Good things come to those who wait', 'Hear through the grapevine',
    'Hit the sack', 'In the heat of the moment', 'Keep something at bay',
    'Kill two birds with one stone', 'Last straw', 'Let sleeping dogs lie',
    'Let the cat out of the bag', 'Make a long story short', 'Method to the madness',
    'Miss the boat', 'No pain no gain', 'Off the hook', 'On the fence',
    'Piece of cake', 'Pull someone’s leg', 'Pull yourself together',
    'Rain on someone’s parade', 'See eye to eye', 'Spill the beans',
    'Take with a grain of salt', 'Taste of your own medicine',
    'The best of both worlds', 'Through thick and thin', 'Time flies when you’re having fun',
    'To cut a long story short', 'Under the weather', 'Up in the air',
    'Wrap your head around something', 'You can say that again',
    'Your guess is as good as mine', 'A bird in the hand', 'Back to square one'
  ];

  private static readonly TOPIC_ANGLES = [
    'The Unintended Consequences of Rapid Digital Transformation',
    'Navigating Ethical Dilemmas in Emerging Technology',
    'Rethinking Traditional Leadership Frameworks in Remote Work',
    'How Modern Organizations Adapt to Economic Uncertainty',
    'The Psychological Foundation Behind High-Performing Teams',
    'Balancing Innovation Velocity with Enterprise Security',
    'The Future of Sustainable Urban Infrastructure',
    'Democratizing AI Access while Protecting Data Privacy',
    'Cross-Cultural Communication in Global Corporate Environments',
    'Building Anti-Fragile Systems in Times of Crisis',
    'The Power of Active Listening in Executive Negotiations',
    'Fostering Psychological Safety in Fast-Paced Engineering Teams',
    'Strategic Storytelling as a Competitive Advantage for Founders',
    'Managing Burnout and Cognitive Overload in the Modern Workplace',
    'The Transition from Individual Contributor to Strategic Leader'
  ];

  private static readonly INTERVIEW_QUESTIONS = [
    'Describe a situation where you had to lead a project through significant ambiguity.',
    'How do you handle conflicting priorities between short-term targets and long-term vision?',
    'Tell me about a time you persuaded executive stakeholders to change an entrenched strategy.',
    'Describe how you managed a critical outage or crisis under intense deadline pressure.',
    'How do you foster diversity of thought and constructive dissent within your teams?',
    'Tell me about a mistake you made early in your career and what you fundamentally learned from it.',
    'How do you align technical engineering decisions with high-level business goals?',
    'Describe your philosophy for giving difficult feedback to a high-performing colleague.'
  ];

  private static readonly CORPORATE_TALKS = [
    'Executive Townhall: Navigating Industry Headwinds with Strategic Resilience',
    'Keynote Address: Scaling Enterprise Agility Across Global Geographies',
    'All-Hands Briefing: Aligning Product Velocity with Customer Obsession',
    'Leadership Summit: Transforming Organizational Culture Through Radical Candor',
    'Strategic Pitch: Unlocking Long-Term Shareholder Value Through AI Automation',
    'Crisis Management Briefing: Restoring Stakeholder Trust Following Operational Disruption'
  ];

  private static generateAlgorithmicBatch(
    type: ContentType,
    category: string,
    difficulty: DifficultyLevel,
    batchSize: number,
    existingTitles: string[] = []
  ): any[] {
    const existingSet = new Set((existingTitles || []).map((t) => (t || '').toLowerCase().trim()));
    const normCat = (category || '').toLowerCase();
    const results: any[] = [];

    // Select candidate pool based on type and category
    let pool: string[] = [];

    if (type === 'WORD') {
      if (normCat.includes('phrase') || normCat.includes('idiom')) {
        pool = this.PHRASES_AND_IDIOMS;
      } else {
        pool = this.VOCABULARY_WORDS;
      }
    } else if (type === 'QUESTION') {
      pool = this.INTERVIEW_QUESTIONS;
    } else if (type === 'CORPORATE_TALK') {
      pool = this.CORPORATE_TALKS;
    } else {
      pool = this.TOPIC_ANGLES;
    }

    // Filter candidate pool to exclude any titles already existing in DB or batch
    const available = pool.filter((title) => !existingSet.has(title.toLowerCase().trim()));

    // Shuffle available items
    const shuffled = [...available].sort(() => 0.5 - Math.random());

    for (let i = 0; i < Math.min(batchSize, shuffled.length); i++) {
      const cleanTitle = shuffled[i].trim();
      existingSet.add(cleanTitle.toLowerCase());

      results.push({
        type,
        category,
        difficulty,
        title: cleanTitle, // Clean title with ZERO numbers or suffix codes
        meaning: `Analyzing strategic implications and linguistic depth of "${cleanTitle}".`,
        contentOverview: `Structured narrative overview analyzing communication concepts surrounding "${cleanTitle}".`,
        hint: 'Structure your speech into 3 pillars: 1. Context, 2. Challenge, 3. Actionable Conclusion.',
        suggestedDurationSeconds: type === 'WORD' ? 90 : 150,
      });
    }

    return results;
  }
}
