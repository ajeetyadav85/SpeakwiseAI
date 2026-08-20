import mongoose, { Schema, Document } from 'mongoose';

export interface IGuestUsage extends Document {
  guestId: string;
  dailyAttemptsUsed: number;
  totalAttemptsUsed: number;
  lastResetDate: Date;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GuestUsageSchema: Schema = new Schema(
  {
    guestId: { type: String, required: true, unique: true, index: true },
    dailyAttemptsUsed: { type: Number, default: 0 },
    totalAttemptsUsed: { type: Number, default: 0 },
    lastResetDate: { type: Date, default: Date.now },
    ipAddress: { type: String, default: '' },
  },
  { timestamps: true }
);

export const GuestUsageModel = mongoose.model<IGuestUsage>('GuestUsage', GuestUsageSchema);
