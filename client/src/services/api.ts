import axios from 'axios';
import { SpeechReport, PracticeSession, Topic, Achievement, DailyChallenge, AppNotification } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mock Datasets for Standalone Demo Mode
export const mockTopics: Topic[] = [
  {
    id: 'top_101',
    title: 'The Role of Artificial Intelligence in Modern Healthcare',
    category: 'Tech',
    difficulty: 'Intermediate',
    suggestedDurationSeconds: 120,
    bulletPoints: [
      'Highlight AI diagnostic accuracy versus traditional methods',
      'Address patient privacy and HIPAA compliance concerns',
      'Conclude with a visionary statement on future longevity',
    ],
  },
  {
    id: 'top_102',
    title: 'Pitching a Series A Tech Startup to Top VC Partners',
    category: 'Business',
    difficulty: 'Advanced',
    suggestedDurationSeconds: 180,
    bulletPoints: [
      'Present explosive MOM ARR growth figures clearly',
      'Explain customer retention cohort retention strength',
      'Outline capital deployment strategy for global scaling',
    ],
  },
  {
    id: 'top_103',
    title: 'Overcoming Failure & Building Resilience as a Leader',
    category: 'Public Speaking',
    difficulty: 'Beginner',
    suggestedDurationSeconds: 90,
    bulletPoints: [
      'Share a vulnerable personal anecdote early on',
      'Pause intentionally after key emotional turnarounds',
      'End with an empowering call to action for the audience',
    ],
  },
  {
    id: 'top_104',
    title: 'Behavioral Interview: Resolving Conflict in High-Pressure Teams',
    category: 'Interviews',
    difficulty: 'Intermediate',
    suggestedDurationSeconds: 150,
    bulletPoints: [
      'Use the STAR method (Situation, Task, Action, Result)',
      'Emphasize active listening and empathetic dialogue',
      'Quantify the team outcome post-resolution',
    ],
  },
];

export const mockSampleReport: SpeechReport = {
  id: 'rep_88491',
  sessionId: 'sess_1001',
  sessionTitle: 'Series A Investor Pitch Rehearsal',
  date: '2026-08-03',
  durationSeconds: 145,
  overallScore: 89,
  scoreBreakdown: {
    pacingScore: 92,
    clarityScore: 88,
    pitchVarietyScore: 84,
    fillerScore: 95,
    persuasivenessScore: 87,
  },
  acousticMetrics: {
    averageWpm: 142,
    wpmVariance: 14.2,
    pitchMinHz: 110,
    pitchMaxHz: 245,
    pitchMeanHz: 168,
    pauseCount: 6,
    totalPauseDurationSeconds: 8.4,
    averageVolumeDecibels: -18.5,
  },
  fillerWords: [
    { word: 'um', timestampStart: 12.4, timestampEnd: 12.9 },
    { word: 'like', timestampStart: 45.1, timestampEnd: 45.6 },
    { word: 'you know', timestampStart: 92.0, timestampEnd: 92.8 },
  ],
  transcript: `Good afternoon partners. I'm thrilled to present SpeakWise AI—the enterprise intelligence platform revolutionizing executive communication. Over the past quarter, we grew monthly active users by 340% while maintaining a 94% net revenue retention. Um, notice how our dual-track audio engine processes real-time acoustic modulation while running LLM structural evaluation under 300 milliseconds. Like, this enables actionable pacing cues directly during live practice. You know, with this round of Series A funding, we will expand our enterprise sales team and roll out multimodal camera posture coaching.`,
  transcriptSegments: [
    {
      id: 'seg_1',
      speaker: 'Speaker 1',
      text: "Good afternoon partners. I'm thrilled to present SpeakWise AI—the enterprise intelligence platform revolutionizing executive communication.",
      start: 0,
      end: 11.2,
    },
    {
      id: 'seg_2',
      speaker: 'Speaker 1',
      text: 'Over the past quarter, we grew monthly active users by 340% while maintaining a 94% net revenue retention. Um, notice how our dual-track audio engine processes real-time acoustic modulation.',
      start: 11.5,
      end: 32.0,
    },
    {
      id: 'seg_3',
      speaker: 'Speaker 1',
      text: 'Like, this enables actionable pacing cues directly during live practice. You know, with this round of Series A funding, we will expand our enterprise sales team.',
      start: 32.5,
      end: 58.0,
    },
  ],
  llmAnalysis: {
    executiveSummary:
      'Outstanding overall executive delivery! Your pacing was exceptionally steady at 142 WPM, within the gold standard range (130-150 WPM). Filler word usage was minimal (3 disfluencies across 145 seconds). Vocal variety could be heightened during financial metrics emphasis.',
    strengths: [
      'Superb pacing control without rushing through complex technical definitions.',
      'Extremely crisp diction and clear articulation on high-value terms (ARR, Retention, Dual-track).',
      'Effective strategic pauses before opening key thesis statements.',
    ],
    areasForImprovement: [
      'Incorporate pitch modulation when announcing the 340% growth metric to convey high enthusiasm.',
      'Eliminate conversational qualifiers ("like", "you know") during transition sentences.',
      'Extend final call to action by 3 seconds for powerful emotional resonance.',
    ],
    rephrasedSuggestions: [
      {
        originalText: 'Um, notice how our dual-track audio engine processes real-time acoustic modulation.',
        improvedText: 'Notice how our proprietary dual-track audio engine processes real-time acoustic modulation instantaneously.',
        reasoning: 'Removes the disfluency "Um" and introduces strong action verbs ("proprietary", "instantaneously").',
      },
      {
        originalText: 'Like, this enables actionable pacing cues directly during live practice.',
        improvedText: 'This delivers real-time, actionable pacing cues directly to the speaker in live practice.',
        reasoning: 'Replaces colloquial "Like" with authoritative pitch delivery.',
      },
    ],
    actionableExercises: [
      {
        title: 'Pitch Peak Dynamic Drill',
        instructions: 'Practice repeating your financial metric slide while raising vocal pitch by 15% on key numbers.',
        category: 'Vocal Variety',
      },
      {
        title: '2-Second Pause Mastery',
        instructions: 'Insert a deliberate 2-second silent breath every time you transition between slides or major ideas.',
        category: 'Pause Control',
      },
    ],
  },
};

export const mockSessions: PracticeSession[] = [
  {
    id: 'sess_1001',
    userId: 'usr_99812',
    title: 'Series A Investor Pitch Rehearsal',
    mode: 'ELEVATOR_PITCH',
    date: '2026-08-03',
    durationSeconds: 145,
    overallScore: 89,
    status: 'COMPLETED',
    reportId: 'rep_88491',
    tags: ['Pitch', 'Fundraising', 'VC'],
  },
  {
    id: 'sess_1002',
    userId: 'usr_99812',
    title: 'Keynote Rehearsal: AI in Healthcare',
    mode: 'KEYNOTE_PREP',
    date: '2026-08-01',
    durationSeconds: 320,
    overallScore: 84,
    status: 'COMPLETED',
    reportId: 'rep_88491',
    tags: ['Keynote', 'Healthcare'],
  },
  {
    id: 'sess_1003',
    userId: 'usr_99812',
    title: 'System Design Interview Intro',
    mode: 'INTERVIEW_DRILL',
    date: '2026-07-29',
    durationSeconds: 210,
    overallScore: 92,
    status: 'COMPLETED',
    reportId: 'rep_88491',
    tags: ['Interview', 'Engineering'],
  },
  {
    id: 'sess_1004',
    userId: 'usr_99812',
    title: 'Impromptu Debate: Remote vs Hybrid Work',
    mode: 'FREE_PRACTICE',
    date: '2026-07-25',
    durationSeconds: 180,
    overallScore: 78,
    status: 'COMPLETED',
    reportId: 'rep_88491',
    tags: ['Impromptu', 'Debate'],
  },
];

export const mockAchievements: Achievement[] = [
  {
    id: 'ach_1',
    title: 'Voice Pioneer',
    description: 'Complete your first practice rehearsal session',
    icon: 'Mic',
    unlocked: true,
    unlockedAt: '2026-07-20',
    progress: 100,
  },
  {
    id: 'ach_2',
    title: '7-Day Speaking Streak',
    description: 'Practice public speaking 7 days in a row',
    icon: 'Flame',
    unlocked: true,
    unlockedAt: '2026-08-03',
    progress: 100,
  },
  {
    id: 'ach_3',
    title: 'Filler Word Assassin',
    description: 'Achieve a speech session with zero filler words',
    icon: 'Zap',
    unlocked: false,
    progress: 80,
  },
  {
    id: 'ach_4',
    title: 'Master Orator',
    description: 'Score 90+ overall across 10 consecutive rehearsals',
    icon: 'Award',
    unlocked: false,
    progress: 40,
  },
];

export const mockDailyChallenge: DailyChallenge = {
  id: 'daily_20260803',
  date: '2026-08-03',
  title: 'Pacing Mastery Challenge',
  description: 'Deliver a 2-minute impromptu speech maintaining steady pace between 135 and 145 WPM with under 2 filler words.',
  category: 'Pacing & Cadence',
  targetWpmRange: [135, 145],
  maxFillerWords: 2,
  rewardExp: 250,
  completed: false,
};

export const mockNotifications: AppNotification[] = [
  {
    id: 'notif_1',
    title: 'Speech Report Ready',
    message: 'Your Series A Investor Pitch Rehearsal report has been processed with an 89 overall score.',
    timestamp: '10 minutes ago',
    read: false,
    type: 'REPORT_READY',
  },
  {
    id: 'notif_2',
    title: 'Streak Unlocked! 🔥',
    message: 'Congratulations! You reached a 7-day speaking practice streak.',
    timestamp: '2 hours ago',
    read: false,
    type: 'ACHIEVEMENT',
  },
  {
    id: 'notif_3',
    title: 'Daily Challenge Available',
    message: 'Complete the Pacing Mastery Challenge today to earn 250 EXP.',
    timestamp: '5 hours ago',
    read: true,
    type: 'SYSTEM',
  },
];
