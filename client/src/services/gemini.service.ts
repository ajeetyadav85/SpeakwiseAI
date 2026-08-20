import { PracticePromptItem } from '../data/practicePromptsData';

export class GeminiService {
  public static getApiKey(): string | null {
    const key =
      (import.meta.env.VITE_GEMINI_API_KEY as string) ||
      (import.meta.env.GEMINI_API_KEY as string) ||
      '';

    return key && key.trim().length > 10 ? key.trim() : null;
  }

  public static isKeyValidFormat(): boolean {
    const key = this.getApiKey();
    return !!key && key.startsWith('AIzaSy');
  }

  public static async generatePracticeTopic(
    category: string,
    difficulty: string,
    type: 'TOPIC' | 'QUESTION' | 'WORD' | 'CORPORATE_TALK'
  ): Promise<PracticePromptItem | null> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is missing. Using local topic library fallback.');
      return null;
    }

    // Dynamic session seed ensures 100% fresh, unique content on every single click!
    const randomSeed = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const promptText = `Generate a 100% unique, highly creative, non-repetitive ${type} prompt for a public speaking app.
Category: ${category}
Difficulty: ${difficulty}
Unique Session Seed: ${randomSeed}

Instructions:
- Create a brand new, highly engaging title or question or word that has NOT been generated before.
- Ensure the title is specific, thought-provoking, and tailored to ${category} (${difficulty} difficulty).

Respond strictly with valid JSON only in the following format (no markdown fences, no text before or after):
{
  "title": "Topic or Question or Word Title",
  "meaning": "Clear, concise meaning or brief explanation",
  "contentOverview": "A small background content overview (2-3 sentences)",
  "hint": "Pro speaking hint or key outline points"
}`;

    const modelEndpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
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

        const data = await response.json();

        if (!response.ok || data.error) {
          console.warn('Google Gemini API response error:', data.error?.message || response.statusText);
          continue;
        }

        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) continue;

        // Clean JSON formatting
        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        console.log('Gemini AI successfully generated fresh prompt:', parsed.title);

        return {
          id: 'gemini_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          title: parsed.title || 'Dynamic Gemini Topic',
          category: category || 'General',
          difficulty: (difficulty as any) || 'Medium',
          type: type,
          meaning: parsed.meaning || 'Explanation generated via Gemini AI',
          contentOverview: parsed.contentOverview || 'Comprehensive background summary.',
          hint: parsed.hint || 'Focus on pacing and executive presence.',
          suggestedDurationSeconds: 150,
        };
      } catch (err) {
        console.warn('Gemini endpoint attempt failed:', err);
      }
    }

    return null;
  }
}
