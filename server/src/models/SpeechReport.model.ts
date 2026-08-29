import mongoose, { Schema, Document } from 'mongoose';

export interface ISpeechReport extends Document {
  sessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  sessionTitle: string;
  overallScore: number;
  scoreBreakdown: {
    pacingScore: number;
    clarityScore: number;
    pitchVarietyScore: number;
    fillerScore: number;
    persuasivenessScore: number;
  };
  acousticMetrics: {
    averageWpm: number;
    wpmVariance: number;
    pitchMinHz: number;
    pitchMaxHz: number;
    pitchMeanHz: number;
    pauseCount: number;
    totalPauseDurationSeconds: number;
    averageVolumeDecibels: number;
  };
  fillerWords: Array<{ word: string; timestampStart: number; timestampEnd: number }>;
  transcript: string;
  llmAnalysis: {
    executiveSummary: string;
    strengths: string[];
    areasForImprovement: string[];
    rephrasedSuggestions: Array<{ originalText: string; improvedText: string; reasoning: string }>;
    actionableExercises: Array<{ title: string; instructions: string; category: string }>;
  };
  pronunciationAnalysis?: {
    overallPronunciationScore: number;
    phonemicAccuracyScore: number;
    intonationScore: number;
    rhythmScore: number;
    mispronouncedWords: Array<{
      word: string;
      ipaExpected: string;
      ipaDetected: string;
      syllableBreakdown: string;
      stressPattern: string;
      issueType: string;
      phoneticTip: string;
      practiceExercise: string;
      audioWord?: string;
    }>;
    phoneticExercises: Array<{
      title: string;
      targetSound: string;
      phoneticSymbol: string;
      instructions: string;
      sampleSentences: string[];
      difficulty: string;
    }>;
  };
  createdAt: Date;
}

const SpeechReportSchema: Schema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'SpeechSession', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionTitle: { type: String, required: true },
    overallScore: { type: Number, required: true },
    scoreBreakdown: {
      pacingScore: Number,
      clarityScore: Number,
      pitchVarietyScore: Number,
      fillerScore: Number,
      persuasivenessScore: Number,
    },
    acousticMetrics: {
      averageWpm: Number,
      wpmVariance: Number,
      pitchMinHz: Number,
      pitchMaxHz: Number,
      pitchMeanHz: Number,
      pauseCount: Number,
      totalPauseDurationSeconds: Number,
      averageVolumeDecibels: Number,
    },
    fillerWords: [{ word: String, timestampStart: Number, timestampEnd: Number }],
    transcript: { type: String, required: true },
    llmAnalysis: {
      executiveSummary: String,
      strengths: [String],
      areasForImprovement: [String],
      rephrasedSuggestions: [{ originalText: String, improvedText: String, reasoning: String }],
      actionableExercises: [{ title: String, instructions: String, category: String }],
    },
    pronunciationAnalysis: {
      overallPronunciationScore: { type: Number, default: 86 },
      phonemicAccuracyScore: { type: Number, default: 88 },
      intonationScore: { type: Number, default: 84 },
      rhythmScore: { type: Number, default: 87 },
      mispronouncedWords: [
        {
          word: String,
          ipaExpected: String,
          ipaDetected: String,
          syllableBreakdown: String,
          stressPattern: String,
          issueType: String,
          phoneticTip: String,
          practiceExercise: String,
          audioWord: String,
        },
      ],
      phoneticExercises: [
        {
          title: String,
          targetSound: String,
          phoneticSymbol: String,
          instructions: String,
          sampleSentences: [String],
          difficulty: String,
        },
      ],
    },
  },
  { timestamps: true }
);

export const SpeechReportModel = mongoose.model<ISpeechReport>('SpeechReport', SpeechReportSchema);

