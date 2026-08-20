export interface ScoreMatrix {
  overallScore: number;
  grammarScore: number;
  vocabularyScore: number;
  pronunciationScore: number;
  confidenceScore: number;
  fluencyScore: number;
  communicationScore: number;
}

export class ScoreMatrixCalculator {
  public static calculate(params: {
    averageWpm: number;
    fillerCount: number;
    totalWords: number;
    ttr: number;
    pauseCount: number;
  }): ScoreMatrix {
    const { averageWpm, fillerCount, totalWords, ttr, pauseCount } = params;

    // 1. Fluency Score (Pacing efficiency & disfluencies penalty)
    let fluencyScore = 95;
    if (averageWpm < 120) fluencyScore -= (120 - averageWpm) * 0.5;
    else if (averageWpm > 160) fluencyScore -= (averageWpm - 160) * 0.6;
    fluencyScore -= fillerCount * 3;
    fluencyScore = Math.max(50, Math.min(100, Math.round(fluencyScore)));

    // 2. Vocabulary Score (Lexical diversity TTR + sophistication)
    let vocabularyScore = Math.round(ttr * 115);
    vocabularyScore = Math.max(60, Math.min(98, vocabularyScore));

    // 3. Grammar Score
    const grammarScore = Math.max(75, Math.min(98, 92 - Math.floor(fillerCount * 1.5)));

    // 4. Pronunciation Score
    const pronunciationScore = Math.max(70, Math.min(98, 88 + Math.floor(ttr * 10)));

    // 5. Confidence Score (Steadiness of pace & pause intervals)
    let confidenceScore = 90;
    if (fillerCount > 5) confidenceScore -= (fillerCount - 5) * 2;
    if (pauseCount > 10) confidenceScore -= 5;
    confidenceScore = Math.max(60, Math.min(100, Math.round(confidenceScore)));

    // 6. Communication Score
    const communicationScore = Math.round(
      fluencyScore * 0.35 + vocabularyScore * 0.3 + confidenceScore * 0.35
    );

    // 7. Overall Score (Weighted combination of all metrics)
    const overallScore = Math.round(
      fluencyScore * 0.25 +
        grammarScore * 0.15 +
        vocabularyScore * 0.15 +
        pronunciationScore * 0.15 +
        confidenceScore * 0.15 +
        communicationScore * 0.15
    );

    return {
      overallScore,
      grammarScore,
      vocabularyScore,
      pronunciationScore,
      confidenceScore,
      fluencyScore,
      communicationScore,
    };
  }
}
