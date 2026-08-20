import mongoose, { Schema, Document } from 'mongoose';

export interface ITopic extends Document {
  title: string;
  category: 'Business' | 'Tech' | 'Public Speaking' | 'Interviews' | 'Debate' | 'Impromptu';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  suggestedDurationSeconds: number;
  bulletPoints: string[];
}

const TopicSchema: Schema = new Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  difficulty: { type: String, required: true },
  suggestedDurationSeconds: { type: Number, default: 120 },
  bulletPoints: [{ type: String }],
});

export const TopicModel = mongoose.model<ITopic>('Topic', TopicSchema);
