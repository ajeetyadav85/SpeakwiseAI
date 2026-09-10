import axios from 'axios';
import { SpeechReport, PracticeSession, Topic, Achievement, DailyChallenge, AppNotification, LeaderboardUser } from '../types';

const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined') {
    // Relative path ensures mobile devices on Wi-Fi/LAN route correctly through the server proxy
    return '/api/v1';
  }
  return 'http://localhost:5000/api/v1';
};

const API_BASE = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('speakwise_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const guestId = localStorage.getItem('speakwise_guest_id');
    if (guestId) {
      config.headers['x-guest-id'] = guestId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


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
  pronunciationAnalysis: {
    overallPronunciationScore: 89,
    phonemicAccuracyScore: 91,
    intonationScore: 86,
    rhythmScore: 90,
    mispronouncedWords: [
      {
        word: 'revolutionizing',
        ipaExpected: '/ˌrev.əˈluː.ʃən.aɪ.zɪŋ/',
        ipaDetected: '/ˌrev.əˈluː.ʃən.eɪ.zɪŋ/',
        syllableBreakdown: 'rev-o-LU-tion-i-zing',
        stressPattern: 'Primary stress on 3rd syllable "LU"',
        issueType: 'Vowel diphthong shift (/aɪ/ vs /eɪ/)',
        phoneticTip: 'Open your jaw slightly more and glide smoothly from the open /a/ vowel towards /ɪ/. Avoid flattening the sound into a rigid "ay".',
        practiceExercise: 'Repeat smoothly: "Revolutionize -> Revolutionizing -> Revolutionized"',
        audioWord: 'revolutionizing',
      },
      {
        word: 'instantaneously',
        ipaExpected: '/ˌɪn.stənˈteɪ.ni.əs.li/',
        ipaDetected: '/ˌɪn.stənˈtiː.ni.əs.li/',
        syllableBreakdown: 'in-stan-TA-ne-ous-ly',
        stressPattern: 'Primary stress on 3rd syllable "TA"',
        issueType: 'Syllable vowel compression',
        phoneticTip: 'Give full vocal weight and length to the stressed "TA" /teɪ/ syllable before resolving into "-ne-ous-ly".',
        practiceExercise: 'Rhythmic tap drill: in-stan-[TAP]-ne-ous-ly.',
        audioWord: 'instantaneously',
      },
      {
        word: 'multimodal',
        ipaExpected: '/ˌmʌl.tiˈmoʊ.dəl/',
        ipaDetected: '/ˌmʊl.tiˈmɒ.dəl/',
        syllableBreakdown: 'mul-ti-MO-dal',
        stressPattern: 'Primary stress on 3rd syllable "MO"',
        issueType: 'Vowel rounding (/oʊ/)',
        phoneticTip: 'Maintain a relaxed central /ʌ/ in "mul-", then round your lips firmly to form the /oʊ/ sound in "-modal".',
        practiceExercise: 'Minimal pair contrast: "Multiple" -> "Modal" -> "Multimodal".',
        audioWord: 'multimodal',
      },
    ],
    phoneticExercises: [
      {
        title: 'The /aɪ/ vs /eɪ/ Vowel Clarity Matrix',
        targetSound: 'Long /aɪ/ diphthong precision',
        phoneticSymbol: '/aɪ/',
        instructions: 'Focus on jaw drop when transitioning into the glide. Keep tongue high on the end sound.',
        sampleSentences: [
          'SpeakWise AI identifies dynamic real-time pacing metrics.',
          'The enterprise pricing model provides high return on investment.',
          'We utilize multi-variable acoustic scoring for executive speeches.',
        ],
        difficulty: 'Intermediate',
      },
      {
        title: 'Polysyllabic Stress & Cadence Drill',
        targetSound: 'Multi-syllable word stress',
        phoneticSymbol: 'ˈ primary stress',
        instructions: 'Pronounce the stressed syllable with 15% higher volume and longer duration than surrounding unstressed syllables.',
        sampleSentences: [
          'We instantaneously process proprietary acoustic telemetry.',
          'Multimodal feedback enhances executive communication confidence.',
        ],
        difficulty: 'Advanced',
      },
      {
        title: 'Consonant Cluster Articulation Drill',
        targetSound: '/st/ and /tr/ clean separation',
        phoneticSymbol: '/st/ /tr/',
        instructions: 'Avoid inserting a neutral schwa /ə/ sound between the consonant pair. Release air crisply.',
        sampleSentences: [
          'Strong strategic structures support strategic success.',
          'Crisp transcription tracks trust and transparency.',
        ],
        difficulty: 'Beginner',
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
    description: 'Complete your first public speaking rehearsal session',
    icon: 'Mic',
    unlocked: true,
    unlockedAt: '2026-07-20',
    progress: 100,
    category: 'MILESTONE',
    expReward: 100,
  },
  {
    id: 'ach_2',
    title: '7-Day Speaking Streak',
    description: 'Practice public speaking 7 days in a row',
    icon: 'Flame',
    unlocked: true,
    unlockedAt: '2026-08-03',
    progress: 100,
    category: 'STREAK',
    expReward: 250,
  },
  {
    id: 'ach_3',
    title: 'Filler Word Assassin',
    description: 'Achieve a speech session with zero filler disfluencies',
    icon: 'Zap',
    unlocked: false,
    progress: 80,
    category: 'PRECISION',
    expReward: 200,
  },
  {
    id: 'ach_4',
    title: 'Master Orator',
    description: 'Score 90+ overall across consecutive public speaking rehearsals',
    icon: 'Award',
    unlocked: false,
    progress: 40,
    category: 'PRECISION',
    expReward: 350,
  },
  {
    id: 'ach_5',
    title: 'Crisp Articulator',
    description: 'Achieve 90+ pronunciation accuracy score on phonetic evaluation',
    icon: 'Sparkles',
    unlocked: true,
    unlockedAt: '2026-08-02',
    progress: 100,
    category: 'PRONUNCIATION',
    expReward: 300,
  },
  {
    id: 'ach_6',
    title: '14-Day Unstoppable Flame',
    description: 'Maintain a 14-day continuous speaking practice streak',
    icon: 'Flame',
    unlocked: false,
    progress: 50,
    category: 'STREAK',
    expReward: 500,
  },
  {
    id: 'ach_7',
    title: 'Daily Drill Champion',
    description: 'Complete 5 targeted public speaking acoustic drills',
    icon: 'Target',
    unlocked: true,
    unlockedAt: '2026-07-28',
    progress: 100,
    category: 'CHALLENGE',
    expReward: 200,
  },
  {
    id: 'ach_8',
    title: 'Century Keynote Speaker',
    description: 'Log over 100 total minutes of live public speaking practice',
    icon: 'Crown',
    unlocked: true,
    unlockedAt: '2026-08-01',
    progress: 100,
    category: 'MILESTONE',
    expReward: 400,
  },
];

export const mockLeaderboardData: LeaderboardUser[] = [
  {
    rank: 1,
    userId: 'usr_top1',
    fullName: 'Elena Rostova',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    role: 'PRO_USER',
    exp: 4850,
    level: 9,
    streakDays: 24,
    averageScore: 95,
    totalPracticeMinutes: 380,
    badgeCount: 8,
  },
  {
    rank: 2,
    userId: 'usr_top2',
    fullName: 'Marcus Vance',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    role: 'PRO_USER',
    exp: 4200,
    level: 8,
    streakDays: 19,
    averageScore: 93,
    totalPracticeMinutes: 310,
    badgeCount: 7,
  },
  {
    rank: 3,
    userId: 'usr_top3',
    fullName: 'Jordan Reed',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    role: 'PRO_USER',
    exp: 3650,
    level: 7,
    streakDays: 14,
    averageScore: 91,
    totalPracticeMinutes: 245,
    badgeCount: 6,
  },

  {
    rank: 4,
    userId: 'usr_top4',
    fullName: 'Sophia Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
    role: 'PRO_USER',
    exp: 3200,
    level: 6,
    streakDays: 12,
    averageScore: 89,
    totalPracticeMinutes: 210,
    badgeCount: 5,
  },
  {
    rank: 5,
    userId: 'usr_top5',
    fullName: 'David Kalu',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    role: 'PRO_USER',
    exp: 2900,
    level: 5,
    streakDays: 10,
    averageScore: 88,
    totalPracticeMinutes: 185,
    badgeCount: 5,
  },
  {
    rank: 6,
    userId: 'usr_top6',
    fullName: 'Ananya Sharma',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
    role: 'PRO_USER',
    exp: 2450,
    level: 5,
    streakDays: 8,
    averageScore: 87,
    totalPracticeMinutes: 160,
    badgeCount: 4,
  },
  {
    rank: 7,
    userId: 'usr_top7',
    fullName: 'Liam O’Connor',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80',
    role: 'FREE_USER',
    exp: 1950,
    level: 4,
    streakDays: 7,
    averageScore: 85,
    totalPracticeMinutes: 140,
    badgeCount: 3,
  },
];

export const fetchBadgesApi = async (): Promise<Achievement[]> => {
  try {
    const res = await apiClient.get('/gamification/badges');
    return res.data.data;
  } catch (e) {
    return mockAchievements;
  }
};

export const fetchLeaderboardApi = async (
  category = 'EXP',
  timeframe = 'ALL_TIME'
): Promise<LeaderboardUser[]> => {
  try {
    const res = await apiClient.get(`/gamification/leaderboard?category=${category}&timeframe=${timeframe}`);
    return res.data.data;
  } catch (e) {
    if (category === 'SCORE') {
      return [...mockLeaderboardData].sort((a, b) => b.averageScore - a.averageScore).map((u, i) => ({ ...u, rank: i + 1 }));
    }
    if (category === 'STREAK') {
      return [...mockLeaderboardData].sort((a, b) => b.streakDays - a.streakDays).map((u, i) => ({ ...u, rank: i + 1 }));
    }
    return mockLeaderboardData;
  }
};


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
