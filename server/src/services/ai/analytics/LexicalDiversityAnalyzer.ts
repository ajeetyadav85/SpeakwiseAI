export class LexicalDiversityAnalyzer {
  public static calculateTTR(transcript: string): { ttr: number; totalWords: number; uniqueWords: number } {
    const tokens = transcript
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(Boolean);

    if (tokens.length === 0) {
      return { ttr: 0, totalWords: 0, uniqueWords: 0 };
    }

    const uniqueSet = new Set(tokens);
    const ttr = uniqueSet.size / tokens.length;

    return {
      ttr: parseFloat(ttr.toFixed(3)),
      totalWords: tokens.length,
      uniqueWords: uniqueSet.size,
    };
  }
}
