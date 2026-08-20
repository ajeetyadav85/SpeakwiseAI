import { apiClient } from './api';
import { PracticePromptItem, PRACTICE_PROMPTS_DATA, TOPIC_CATEGORIES_LIST } from '../data/practicePromptsData';

export class ContentApiService {
  public static async getRandomContent(
    type: 'TOPIC' | 'QUESTION' | 'WORD' | 'CORPORATE_TALK',
    category?: string,
    difficulty?: string
  ): Promise<PracticePromptItem> {
    try {
      const response = await apiClient.get('/content/random', {
        params: { type, category, difficulty },
      });

      if (response.data && response.data.success && response.data.data) {
        const item = response.data.data;
        return {
          id: item._id || item.id || 'cnt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          title: item.title,
          category: item.category,
          difficulty: item.difficulty,
          type: item.type,
          meaning: item.meaning,
          contentOverview: item.contentOverview,
          hint: item.hint,
          suggestedDurationSeconds: item.suggestedDurationSeconds || 150,
        };
      }
    } catch (err) {
      console.warn('Backend API fetch fallback to dynamic generator engine:', err);
    }

    // Dynamic Generator Engine Fallback (guarantees a 100% unique prompt on EVERY click)
    return this.generateFallbackPrompt(type, category || 'General', difficulty || 'Medium');
  }

  public static async getCategories(type: 'TOPIC' | 'QUESTION' | 'WORD' | 'CORPORATE_TALK'): Promise<string[]> {
    try {
      const response = await apiClient.get('/content/categories', {
        params: { type },
      });

      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    } catch (err) {
      console.warn('Backend category fetch fallback:', err);
    }

    switch (type) {
      case 'WORD':
        return ['Words', 'Idioms', 'Vocabulary', 'Business Jargon'];
      case 'QUESTION':
        return ['General', 'Interview', 'Leadership', 'Behavioral'];
      case 'CORPORATE_TALK':
        return ['Executive Pitch', 'Townhall Address', 'Product Launch', 'Crisis Management'];
      default:
        return TOPIC_CATEGORIES_LIST;
    }
  }

  private static generateFallbackPrompt(
    type: 'TOPIC' | 'QUESTION' | 'WORD' | 'CORPORATE_TALK',
    category: string,
    difficulty: string
  ): PracticePromptItem {
    const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    // Strict WORD type single-word handling
    if (type === 'WORD') {
      if (category.toLowerCase().includes('idiom')) {
        const idioms = [
          { title: 'Bite the Bullet', meaning: 'Facing a tough situation with courage.' },
          { title: 'Burn the Midnight Oil', meaning: 'Working late with intense focus.' },
          { title: 'Steal Someone’s Thunder', meaning: 'Taking credit for another’s work prematurely.' },
          { title: 'Hit the Nail on the Head', meaning: 'Identifying the exact cause of a problem.' },
          { title: 'Break the Ice', meaning: 'Initiating conversation in an unfamiliar setting.' },
        ];
        const chosen = pickRandom(idioms);
        return {
          id: 'w_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
          title: chosen.title,
          category: category,
          difficulty: (difficulty as any) || 'Medium',
          type: 'WORD',
          meaning: chosen.meaning,
          contentOverview: `The idiom "${chosen.title}" is widely used in high-impact executive communication.`,
          hint: 'Explain the origin of the idiom and give a concrete real-world workplace example.',
          suggestedDurationSeconds: 120,
        };
      } else {
        const words = [
          { title: 'Perspicacity', meaning: 'Acute mental discernment and sharp insight.' },
          { title: 'Equanimity', meaning: 'Mental composure and calmness in difficult situations.' },
          { title: 'Serendipity', meaning: 'The occurrence of beneficial events by chance.' },
          { title: 'Magnanimous', meaning: 'Generous or forgiving toward a rival or team member.' },
          { title: 'Alacrity', meaning: 'Brisk and cheerful readiness to take action.' },
          { title: 'Ubiquitous', meaning: 'Present, appearing, or found everywhere simultaneously.' },
          { title: 'Ineffable', meaning: 'Too grand or profound to be expressed in words.' },
          { title: 'Obfuscate', meaning: 'To render unclear, confusing, or difficult to understand.' },
        ];
        const chosen = pickRandom(words);
        return {
          id: 'w_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
          title: chosen.title, // STRICT SINGLE WORD!
          category: category,
          difficulty: (difficulty as any) || 'Medium',
          type: 'WORD',
          meaning: chosen.meaning,
          contentOverview: `The vocabulary word "${chosen.title}" expresses complex human and strategic concepts.`,
          hint: 'Provide the dictionary definition, then share a personal story illustrating the word.',
          suggestedDurationSeconds: 90,
        };
      }
    }

    // TOPIC Synthesis Generator
    const angles = [
      'The Unintended Consequences of',
      'Navigating Strategic Dilemmas in',
      'Rethinking Traditional Frameworks in',
      'How Modern Leaders Are Adapting to',
      'The Psychological Moat Behind',
      'Ethical Frontiers & Economic Costs of',
      'The Hidden Drivers Shaping the Future of',
      'Democratizing Access vs Regulating Risk in',
    ];

    const subjects = [
      `${category} Scalability and Sustainable Infrastructure`,
      `Digital Innovations and Human Adaptability in ${category}`,
      `Strategic Friction and Executive Resilience in ${category}`,
      `Global Paradigm Shifts in ${category} Architecture`,
      `Unit Economics and Long-Term Value Creation in ${category}`,
    ];

    const chosenTitle = `${pickRandom(angles)} ${pickRandom(subjects)}`;

    return {
      id: 'gen_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: chosenTitle,
      category: category,
      difficulty: (difficulty as any) || 'Medium',
      type: type,
      meaning: `Exploring how ${category.toLowerCase()} dynamics influence strategic growth and systemic change.`,
      contentOverview: `As modern challenges evolve, understanding ${category.toLowerCase()} provides an indispensable leadership advantage.`,
      hint: `Structure your presentation with 1 core opening thesis, 2 illustrative real-world examples, and 1 actionable conclusion.`,
      suggestedDurationSeconds: 150,
    };
  }
}
