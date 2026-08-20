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
  },
  { timestamps: true }
);

export const SpeechReportModel = mongoose.model<ISpeechReport>('SpeechReport', SpeechReportSchema);
