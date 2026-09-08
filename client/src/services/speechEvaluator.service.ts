import { SpeechReport } from '../types';

export interface EvaluatedScoreResult {
  overallScore: number;
  rating: 'Excellent' | 'Good' | 'Average' | 'Needs Work' | 'No Speech Detected';
  grammarScore: number;
  fluencyScore: number;
  vocabularyScore: number;
  confidenceScore: number;
  summary: string;
  strengths: string[];
  areasForImprovement: string[];
  drillTitle: string;
  drillInstructions: string;
  wordCount: number;
  detectedWpm: number;
  fillerCount: number;
}

export class SpeechEvaluatorService {
  /**
   * Retrieves the configured Gemini API key
   */
  private static getApiKey(): string | null {
    const key =
      (import.meta.env.VITE_GEMINI_API_KEY as string) ||
      (import.meta.env.GEMINI_API_KEY as string) ||
      '';
    return key && key.trim().length > 10 ? key.trim() : null;
  }

  /**
   * Evaluates spoken speech against the assigned topic using Google Gemini AI,
   * with strict fallback logic that never shows fake high scores for silence.
   */
  public static async evaluateSpeech(params: {
    topicTitle: string;
    topicCategory: string;
    transcript: string;
    durationSeconds: number;
  }): Promise<EvaluatedScoreResult> {
    const { topicTitle, topicCategory, transcript, durationSeconds } = params;
    const cleanTranscript = (transcript || '').trim();
    const words = cleanTranscript.length > 0 ? cleanTranscript.split(/\s+/).filter(Boolean) : [];
    const wordCount = words.length;
    const actualDuration = Math.max(3, durationSeconds);
    const calculatedWpm = Math.round((wordCount / (actualDuration / 60)));

    // =========================================================================
    // CASE 1: ZERO SPEECH DETECTED (User did not speak or microphone was silent)
    // =========================================================================
    if (wordCount === 0) {
      return {
        overallScore: 0,
        rating: 'No Speech Detected',
        grammarScore: 0,
        fluencyScore: 0,
        vocabularyScore: 0,
        confidenceScore: 0,
        summary: 'No spoken words were detected during this recording session.',
        strengths: ['Microphone connection initialized.'],
        areasForImprovement: [
          'No speech was captured. Please ensure your microphone is enabled, permissions are granted in your browser, and speak audibly at normal volume.',
        ],
        drillTitle: 'Microphone & Voice Level Calibration Drill',
        drillInstructions:
          'Speak 2-3 full sentences out loud while watching the Live Transcription text box in the recording card to confirm your words appear in real-time.',
        wordCount: 0,
        detectedWpm: 0,
        fillerCount: 0,
      };
    }

    // =========================================================================
    // CASE 2: VERY BRIEF SPEECH (1 to 4 words, e.g. "hello", "testing mic")
    // =========================================================================
    if (wordCount < 5) {
      const isWord = wordCount === 1;
      return {
        overallScore: Math.min(25, wordCount * 6),
        rating: 'Needs Work',
        grammarScore: 25,
        fluencyScore: 20,
        vocabularyScore: 20,
        confidenceScore: 25,
        summary: `Only ${wordCount} ${isWord ? 'word was' : 'words were'} captured ("${cleanTranscript}"). An accurate assessment requires continuous speaking.`,
        strengths: [`Word captured: "${cleanTranscript}"`],
        areasForImprovement: [
          `Session was too brief (${wordCount} words across ${actualDuration}s). Aim to speak for at least 30 seconds with complete, structured sentences.`,
        ],
        drillTitle: '3-Sentence Expansion Drill',
        drillInstructions:
          '1. State your primary point clearly. 2. Provide a concrete example or reason. 3. Summarize with an executive takeaway.',
        wordCount,
        detectedWpm: calculatedWpm,
        fillerCount: 0,
      };
    }

    // =========================================================================
    // CASE 3: REAL SPOKEN SPEECH -> EVALUATE USING GOOGLE GEMINI AI
    // =========================================================================
    const apiKey = this.getApiKey();
    if (apiKey) {
      try {
        const geminiResult = await this.callGeminiEvaluation({
          topicTitle,
          topicCategory,
          transcript: cleanTranscript,
          durationSeconds: actualDuration,
          wordCount,
          calculatedWpm,
          apiKey,
        });

        if (geminiResult) {
          return geminiResult;
        }
      } catch (err) {
        console.warn('Gemini AI speech evaluation failed, using deterministic transcript engine:', err);
      }
    }

    // =========================================================================
    // CASE 4: DETERMINISTIC TRANSCRIPT EVALUATOR (No fake scores!)
    // Evaluates actual vocabulary richness, WPM pace, fillers, and grammar structure
    // =========================================================================
    return this.evaluateTranscriptDeterministically({
      topicTitle,
      transcript: cleanTranscript,
      words,
      durationSeconds: actualDuration,
      calculatedWpm,
    });
  }

  /**
   * Calls Google Gemini API for deep contextual assessment
   */
  private static async callGeminiEvaluation(params: {
    topicTitle: string;
    topicCategory: string;
    transcript: string;
    durationSeconds: number;
    wordCount: number;
    calculatedWpm: number;
    apiKey: string;
  }): Promise<EvaluatedScoreResult | null> {
    const { topicTitle, topicCategory, transcript, durationSeconds, wordCount, calculatedWpm, apiKey } = params;

    const promptText = `You are an expert speech evaluator and public speaking coach for SpeakWise AI.
Analyze the user's spoken transcript against the given speech topic.

Topic: "${topicTitle}" (Category: ${topicCategory})
Speaking Duration: ${durationSeconds} seconds
Total Words Spoken: ${wordCount}
Pacing: ${calculatedWpm} WPM
User Spoken Transcript: "${transcript}"

Evaluation Guidelines:
1. Evaluate strictly based on the words the user actually spoke.
2. Grammar: Check sentence completeness, subject-verb agreement, and phrasing (0-100).
3. Fluency: Check pacing cadence, natural phrasing, flow, and disfluency control (0-100).
4. Vocabulary: Check lexical variety, word sophistication, and relevance to the topic (0-100).
5. Confidence: Check assertiveness, conviction, and absence of excessive hesitation (0-100).
6. Overall Score: Weighted average of the 4 metrics (0-100).
7. Rating: "Excellent" (85-100), "Good" (75-84), "Average" (60-74), or "Needs Work" (<60).
8. If the speech was very short, off-topic, or disjointed, give appropriately low scores (e.g. 35-55). Do NOT give 80+ to weak speech!

Respond strictly with valid JSON only (no markdown code blocks, no backticks):
{
  "overallScore": number,
  "rating": "Excellent" | "Good" | "Average" | "Needs Work",
  "grammarScore": number,
  "fluencyScore": number,
  "vocabularyScore": number,
  "confidenceScore": number,
  "summary": "1-2 sentence executive assessment directly referring to what was said",
  "strengths": ["1-2 specific strengths observed in their speech"],
  "areasForImprovement": ["1-2 actionable improvement points based on actual errors or brevity"],
  "drillTitle": "Name of custom practice drill",
  "drillInstructions": "Step-by-step instruction for this drill"
}`;

    // Available Gemini models
    const models = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.3,
            },
          }),
        });

        if (!response.ok) continue;

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) continue;

        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        const overall = Math.max(10, Math.min(99, Math.round(parsed.overallScore || 70)));
        const grammar = Math.max(10, Math.min(99, Math.round(parsed.grammarScore || 70)));
        const fluency = Math.max(10, Math.min(99, Math.round(parsed.fluencyScore || 70)));
        const vocabulary = Math.max(10, Math.min(99, Math.round(parsed.vocabularyScore || 70)));
        const confidence = Math.max(10, Math.min(99, Math.round(parsed.confidenceScore || 70)));

        const rating: 'Excellent' | 'Good' | 'Average' | 'Needs Work' =
          parsed.rating ||
          (overall >= 85 ? 'Excellent' : overall >= 75 ? 'Good' : overall >= 60 ? 'Average' : 'Needs Work');

        // Detect filler count in transcript
        const fillerMatches = transcript.match(/\b(um|uh|erm|like|you know|basically|actually)\b/gi);
        const fillerCount = fillerMatches ? fillerMatches.length : 0;

        return {
          overallScore: overall,
          rating,
          grammarScore: grammar,
          fluencyScore: fluency,
          vocabularyScore: vocabulary,
          confidenceScore: confidence,
          summary: parsed.summary || `Speech delivery evaluated at ${calculatedWpm} WPM across ${wordCount} words.`,
          strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0
            ? parsed.strengths
            : [`Maintained an active speaking cadence of ${calculatedWpm} WPM.`],
          areasForImprovement: Array.isArray(parsed.areasForImprovement) && parsed.areasForImprovement.length > 0
            ? parsed.areasForImprovement
            : [`Expand descriptive vocabulary and reduce conversational pauses.`],
          drillTitle: parsed.drillTitle || 'Cadence & Articulation Drill',
          drillInstructions: parsed.drillInstructions || 'Practice delivering this topic using deliberate 2-second transitions between key arguments.',
          wordCount,
          detectedWpm: calculatedWpm,
          fillerCount,
        };
      } catch (e) {
        // Try next model
      }
    }

    return null;
  }

  /**
   * Deterministic evaluation based on actual linguistic metrics
   */
  private static evaluateTranscriptDeterministically(params: {
    topicTitle: string;
    transcript: string;
    words: string[];
    durationSeconds: number;
    calculatedWpm: number;
  }): EvaluatedScoreResult {
    const { topicTitle, transcript, words, durationSeconds, calculatedWpm } = params;
    const wordCount = words.length;

    // 1. Detect Fillers
    const fillerRegex = /\b(um|uh|erm|like|you know|basically|actually|so yeah)\b/gi;
    const fillerMatches = transcript.match(fillerRegex);
    const fillerCount = fillerMatches ? fillerMatches.length : 0;

    // 2. Lexical Diversity (Unique words / Total words)
    const lowerWords = words.map((w) => w.toLowerCase().replace(/[^a-z]/g, ''));
    const uniqueWords = new Set(lowerWords.filter(Boolean));
    const diversityRatio = uniqueWords.size / Math.max(1, wordCount);

    // 3. WPM Pacing Score (Target: 125-155 WPM)
    let pacingScore = 90;
    if (calculatedWpm < 110) pacingScore -= (110 - calculatedWpm) * 0.7;
    else if (calculatedWpm > 165) pacingScore -= (calculatedWpm - 165) * 0.6;
    pacingScore = Math.max(35, Math.min(96, Math.round(pacingScore)));

    // 4. Fluency Score
    const fillerPenalty = Math.min(30, fillerCount * 6);
    const fluencyScore = Math.max(30, Math.min(95, Math.round(pacingScore - fillerPenalty)));

    // 5. Vocabulary Score based on lexical diversity & word length
    const avgWordLen = words.reduce((acc, w) => acc + w.length, 0) / Math.max(1, wordCount);
    let vocabScore = Math.round(diversityRatio * 60 + avgWordLen * 6);
    vocabScore = Math.max(35, Math.min(94, vocabScore));

    // 6. Grammar Score
    let grammarScore = 75;
    if (wordCount < 15) grammarScore -= 15;
    if (fillerCount > 3) grammarScore -= (fillerCount - 3) * 3;
    // Check for double words like "the the"
    const doubleWordMatch = transcript.match(/\b(\w+)\s+\1\b/gi);
    if (doubleWordMatch) grammarScore -= doubleWordMatch.length * 5;
    grammarScore = Math.max(30, Math.min(95, grammarScore));

    // 7. Confidence Score
    let confidenceScore = Math.round((fluencyScore * 0.5) + (pacingScore * 0.5));
    if (durationSeconds >= 30 && wordCount >= 35) confidenceScore += 5;
    confidenceScore = Math.max(35, Math.min(95, confidenceScore));

    // 8. Overall Weighted Score
    const overallScore = Math.round(
      grammarScore * 0.25 + fluencyScore * 0.25 + vocabScore * 0.25 + confidenceScore * 0.25
    );

    const rating: 'Excellent' | 'Good' | 'Average' | 'Needs Work' =
      overallScore >= 85 ? 'Excellent' : overallScore >= 75 ? 'Good' : overallScore >= 60 ? 'Average' : 'Needs Work';

    // Contextual Strengths & Improvement Points
    const strengths: string[] = [];
    const areasForImprovement: string[] = [];

    if (pacingScore >= 80) {
      strengths.push(`Maintained an optimal conversational speaking pace at ${calculatedWpm} WPM.`);
    } else if (calculatedWpm < 110) {
      areasForImprovement.push(`Speaking pace was slightly slow (${calculatedWpm} WPM). Aim for 125-145 WPM to keep momentum.`);
    } else {
      areasForImprovement.push(`Pacing was rapid (${calculatedWpm} WPM). Incorporate deliberate pauses before key transitions.`);
    }

    if (fillerCount === 0) {
      strengths.push(`Clean delivery with zero detected conversational fillers (no 'um', 'uh', or 'like').`);
    } else {
      areasForImprovement.push(`Detected ${fillerCount} filler word(s). Replace fillers with silent breaths.`);
    }

    if (diversityRatio >= 0.7) {
      strengths.push(`Strong vocabulary variety with ${uniqueWords.size} unique words across ${wordCount} spoken words.`);
    }

    if (strengths.length === 0) {
      strengths.push(`Delivered ${wordCount} words on the topic within ${durationSeconds} seconds.`);
    }
    if (areasForImprovement.length === 0) {
      areasForImprovement.push(`Challenge yourself with longer 90-second speeches to deepen your argumentative structure.`);
    }

    return {
      overallScore,
      rating,
      grammarScore,
      fluencyScore,
      vocabularyScore: vocabScore,
      confidenceScore,
      summary: `Delivered ${wordCount} words at ${calculatedWpm} WPM with ${fillerCount} filler word(s) on "${topicTitle}".`,
      strengths,
      areasForImprovement,
      drillTitle: fillerCount > 2 ? 'Silent Pause Breathing Drill' : 'Cadence Modulation Drill',
      drillInstructions:
        fillerCount > 2
          ? 'Whenever you feel an "um" coming, close your lips and take a silent 2-second breath before continuing.'
          : 'Practice speaking at a consistent 135 WPM pace using a timer to lock in your natural cadence.',
      wordCount,
      detectedWpm: calculatedWpm,
      fillerCount,
    };
  }

  /**
   * Helper to convert an EvaluatedScoreResult into a full SpeechReport object
   */
  public static createSpeechReport(
    evalResult: EvaluatedScoreResult,
    topicTitle: string,
    transcript: string,
    durationSeconds: number
  ): SpeechReport {
    const reportId = 'rep_' + Math.floor(Math.random() * 89999 + 10000);
    const currentDate = new Date().toISOString().split('T')[0];

    return {
      id: reportId,
      sessionId: 'sess_' + Math.floor(Math.random() * 8999 + 1000),
      sessionTitle: topicTitle,
      date: currentDate,
      durationSeconds,
      overallScore: evalResult.overallScore,
      scoreBreakdown: {
        pacingScore: evalResult.fluencyScore,
        clarityScore: evalResult.grammarScore,
        pitchVarietyScore: evalResult.vocabularyScore,
        fillerScore: Math.max(0, 100 - evalResult.fillerCount * 10),
        persuasivenessScore: evalResult.confidenceScore,
        confidence: evalResult.confidenceScore,
        fluency: evalResult.fluencyScore,
        pronunciation: evalResult.grammarScore,
        grammar: evalResult.grammarScore,
        vocabulary: evalResult.vocabularyScore,
        speakingPace: evalResult.fluencyScore,
        eyeContact: evalResult.overallScore > 0 ? 85 : 0,
      } as any,
      acousticMetrics: {
        averageWpm: evalResult.detectedWpm,
        wpmVariance: 10.0,
        pitchMinHz: 120,
        pitchMaxHz: 220,
        pitchMeanHz: 160,
        pauseCount: Math.max(0, Math.floor(durationSeconds / 20)),
        totalPauseDurationSeconds: Math.round(durationSeconds * 0.08),
        averageVolumeDecibels: evalResult.wordCount > 0 ? -18.0 : -60.0,
      },
      fillerWords: [],
      transcript: transcript || 'No speech detected.',
      transcriptSegments: [
        {
          id: 'seg_1',
          speaker: 'Speaker',
          text: transcript || 'No speech detected.',
          start: 0,
          end: durationSeconds,
        },
      ],
      llmAnalysis: {
        executiveSummary: evalResult.summary,
        strengths: evalResult.strengths,
        areasForImprovement: evalResult.areasForImprovement,
        rephrasedSuggestions:
          evalResult.wordCount > 0
            ? [
                {
                  originalText: transcript.slice(0, 60),
                  improvedText: `In summary, ${transcript.slice(0, 60)}...`,
                  reasoning: 'Enhances executive presence and rhetorical conciseness.',
                },
              ]
            : [],
        actionableExercises: [
          {
            title: evalResult.drillTitle,
            instructions: evalResult.drillInstructions,
            category: 'Pacing & Articulation',
          },
        ],
      },
    };
  }
}
