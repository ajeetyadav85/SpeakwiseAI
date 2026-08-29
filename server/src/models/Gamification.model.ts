import mongoose, { Schema, Document } from 'mongoose';

export interface IBadgeDefinition extends Document {
  badgeId: string;
  title: string;
  description: string;
  category: 'STREAK' | 'MILESTONE' | 'PRECISION' | 'CHALLENGE' | 'PRONUNCIATION';
  icon: string;
  expReward: number;
  criteria: {
    type: 'STREAK_DAYS' | 'SESSION_COUNT' | 'SCORE_THRESHOLD' | 'ZERO_FILLERS' | 'PRONUNCIATION_SCORE' | 'DRILLS_COMPLETED';
    targetValue: number;
  };
}

const BadgeDefinitionSchema: Schema = new Schema(
  {
    badgeId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['STREAK', 'MILESTONE', 'PRECISION', 'CHALLENGE', 'PRONUNCIATION'],
      required: true,
    },
    icon: { type: String, required: true },
    expReward: { type: Number, default: 100 },
    criteria: {
      type: { type: String, required: true },
      targetValue: { type: Number, required: true },
    },
  },
  { timestamps: true }
);

export const BadgeDefinitionModel = mongoose.model<IBadgeDefinition>('BadgeDefinition', BadgeDefinitionSchema);
