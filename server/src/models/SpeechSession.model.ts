import mongoose, { Schema, Document } from 'mongoose';

export type SessionMode = 'FREE_PRACTICE' | 'ELEVATOR_PITCH' | 'KEYNOTE_PREP' | 'INTERVIEW_DRILL';

export interface ISpeechSession extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  mode: SessionMode;
  durationSeconds: number;
  overallScore: number;
  audioUrl?: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
}

const SpeechSessionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    mode: {
      type: String,
      enum: ['FREE_PRACTICE', 'ELEVATOR_PITCH', 'KEYNOTE_PREP', 'INTERVIEW_DRILL'],
      default: 'FREE_PRACTICE',
    },
    durationSeconds: { type: Number, default: 0 },
    overallScore: { type: Number, default: 85 },
    audioUrl: { type: String, default: '' },
    status: { type: String, enum: ['PROCESSING', 'COMPLETED', 'FAILED'], default: 'COMPLETED' },
  },
  { timestamps: true }
);

export const SpeechSessionModel = mongoose.model<ISpeechSession>('SpeechSession', SpeechSessionSchema);
