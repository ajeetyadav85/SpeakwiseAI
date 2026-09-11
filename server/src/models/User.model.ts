import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'PRO_USER' | 'FREESTYLE_USER' | 'FREE_USER';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  avatarUrl: string;
  authProvider?: 'email' | 'google';
  googleId?: string;
  teamId?: mongoose.Types.ObjectId;
  streakDays: number;
  totalPracticeMinutes: number;
  averageScore: number;
  targetWpm: number;
  exp: number;
  level: number;
  badges: Array<{ badgeId: string; unlockedAt: Date }>;
  guestId?: string;
  guestAttemptsConsumed: number;
  freestyleAttemptsUsed: number;
  subscriptionPlan?: string;
  subscriptionExpiresAt?: Date;
  hasUsedTrialOffer?: boolean;
  trialEndsAt?: Date;
  planStartsAt?: Date;
  refreshTokenHash?: string;
  createdAt: Date;
  updatedAt: Date;
}


const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'ORG_ADMIN', 'PRO_USER', 'FREESTYLE_USER', 'FREE_USER'],
      default: 'PRO_USER',
    },
    authProvider: {
      type: String,
      enum: ['email', 'google'],
      default: 'email',
    },
    googleId: { type: String, default: null },
    avatarUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
    streakDays: { type: Number, default: 7 },
    totalPracticeMinutes: { type: Number, default: 142 },
    averageScore: { type: Number, default: 88 },
    targetWpm: { type: Number, default: 145 },
    exp: { type: Number, default: 1850 },
    level: { type: Number, default: 4 },
    badges: [
      {
        badgeId: { type: String, required: true },
        unlockedAt: { type: Date, default: Date.now },
      },
    ],
    guestId: { type: String, default: '' },
    guestAttemptsConsumed: { type: Number, default: 0 },
    freestyleAttemptsUsed: { type: Number, default: 0 },
    subscriptionPlan: { type: String, default: null },
    subscriptionExpiresAt: { type: Date, default: null },
    hasUsedTrialOffer: { type: Boolean, default: false },
    trialEndsAt: { type: Date, default: null },
    planStartsAt: { type: Date, default: null },
    refreshTokenHash: { type: String, select: false },
  },
  { timestamps: true }
);


export const UserModel = mongoose.model<IUser>('User', UserSchema);

