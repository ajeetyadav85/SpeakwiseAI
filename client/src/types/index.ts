export type UserRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'PRO_USER' | 'FREESTYLE_USER' | 'FREE_USER';

export type SubscriptionPlanId = '1_DAY' | '1_WEEK' | '1_MONTH' | '3_MONTH' | '6_MONTH' | '1_YEAR';

export interface SubscriptionPlanOption {
  id: SubscriptionPlanId;
  name: string;
  durationLabel: string;
  validityText: string;
  durationHours: number;
  priceInr: number;
  badge?: string;
  popular?: boolean;
  savings?: string;
  description: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  teamName?: string;
  streakDays: number;
  totalPracticeMinutes: number;
  averageScore: number;
  targetWpm: number;
  exp?: number;
  level?: number;
  subscriptionPlan?: SubscriptionPlanId;
  subscriptionExpiresAt?: string;
  createdAt: string;
}


export type PracticeMode = 'FREE_PRACTICE' | 'ELEVATOR_PITCH' | 'KEYNOTE_PREP' | 'INTERVIEW_DRILL' | 'DAILY_CHALLENGE';

export interface Topic {
  id: string;
  title: string;
  category: 'Business' | 'Tech' | 'Public Speaking' | 'Interviews' | 'Debate' | 'Impromptu' | 'Technology' | 'Education' | 'Current Affairs' | 'Motivation' | 'Environment' | 'Sports' | 'Entertainment' | 'Random' | 'AI Generated' | 'Custom' | string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  suggestedDurationSeconds: number;
  bulletPoints: string[];
}

export interface FillerWordOccurrence {
  word: string;
  timestampStart: number; // Seconds
  timestampEnd: number;
}

export interface AcousticMetrics {
  averageWpm: number;
  wpmVariance: number;
  pitchMinHz: number;
  pitchMaxHz: number;
  pitchMeanHz: number;
  pauseCount: number;
  totalPauseDurationSeconds: number;
  averageVolumeDecibels: number;
}

export interface SentenceImprovement {
  originalText: string;
  improvedText: string;
  reasoning: string;
}

export interface MispronouncedWord {
  word: string;
  ipaExpected: string;
  ipaDetected: string;
  syllableBreakdown: string;
  stressPattern: string;
  issueType: string;
  phoneticTip: string;
  practiceExercise: string;
  audioWord?: string;
}

export interface PhoneticExercise {
  title: string;
  targetSound: string;
  phoneticSymbol: string;
  instructions: string;
  sampleSentences: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | string;
}

export interface PronunciationAnalysis {
  overallPronunciationScore: number;
  phonemicAccuracyScore: number;
  intonationScore: number;
  rhythmScore: number;
  mispronouncedWords: MispronouncedWord[];
  phoneticExercises: PhoneticExercise[];
}

export interface SpeechReport {
  id: string;
  sessionId: string;
  sessionTitle: string;
  date: string;
  durationSeconds: number;
  overallScore: number;
  scoreBreakdown: {
    pacingScore: number;
    clarityScore: number;
    pitchVarietyScore: number;
    fillerScore: number;
    persuasivenessScore: number;
    confidence?: number;
    fluency?: number;
    pronunciation?: number;
    grammar?: number;
    vocabulary?: number;
    speakingPace?: number;
    eyeContact?: number;
  };
  acousticMetrics: AcousticMetrics;
  fillerWords: FillerWordOccurrence[];
  transcript: string;
  transcriptSegments: {
    id: string;
    speaker: string;
    text: string;
    start: number;
    end: number;
  }[];
  llmAnalysis: {
    executiveSummary: string;
    strengths: string[];
    areasForImprovement: string[];
    rephrasedSuggestions: SentenceImprovement[];
    actionableExercises: {
      title: string;
      instructions: string;
      category: string;
    }[];
  };
  pronunciationAnalysis?: PronunciationAnalysis;
}

export interface PracticeSession {
  id: string;
  userId: string;
  title: string;
  mode: PracticeMode;
  date: string;
  durationSeconds: number;
  overallScore: number;
  status: 'COMPLETED' | 'PROCESSING' | 'FAILED';
  reportId?: string;
  tags: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number; // 0 - 100
  category?: 'STREAK' | 'MILESTONE' | 'PRECISION' | 'CHALLENGE' | 'PRONUNCIATION' | string;
  expReward?: number;
}

export interface LeaderboardUser {
  rank: number;
  userId: string;
  fullName: string;
  avatarUrl: string;
  role: string;
  exp: number;
  level: number;
  streakDays: number;
  averageScore: number;
  totalPracticeMinutes: number;
  badgeCount: number;
  isCurrentUser?: boolean;
}

export interface DailyChallenge {
  id: string;
  date: string;
  title: string;
  description: string;
  category: string;
  targetWpmRange: [number, number];
  maxFillerWords: number;
  rewardExp: number;
  completed: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'ACHIEVEMENT' | 'REPORT_READY' | 'STREAK_REMINDER' | 'SYSTEM';
}

