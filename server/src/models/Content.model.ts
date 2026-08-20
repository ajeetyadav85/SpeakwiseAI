import mongoose, { Schema, Document } from 'mongoose';

export type ContentType = 'TOPIC' | 'QUESTION' | 'WORD' | 'CORPORATE_TALK';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface IContent extends Document {
  type: ContentType;
  category: string;
  difficulty: DifficultyLevel;
  title: string;
  meaning: string;
  contentOverview: string;
  hint: string;
  suggestedDurationSeconds: number;
  createdAt: Date;
  updatedAt: Date;
}

const ContentSchema: Schema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['TOPIC', 'QUESTION', 'WORD', 'CORPORATE_TALK'],
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['Easy', 'Medium', 'Hard'],
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    meaning: {
      type: String,
      required: true,
    },
    contentOverview: {
      type: String,
      required: true,
    },
    hint: {
      type: String,
      required: true,
    },
    suggestedDurationSeconds: {
      type: Number,
      default: 150,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Index for lightning-fast random aggregation sampling
ContentSchema.index({ type: 1, category: 1, difficulty: 1 });

export const ContentModel = mongoose.model<IContent>('Content', ContentSchema);
