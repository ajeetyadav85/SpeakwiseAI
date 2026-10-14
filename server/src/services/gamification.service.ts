import { UserModel } from '../models/User.model.js';
import { logger } from '../utils/logger.js';
import {
  calculateLevel,
  getTierName,
  formatDisplayName,
} from '../utils/gamificationUtils.js';

export interface BadgeStatus {
  id: string;
  title: string;
  description: string;
  category: 'STREAK' | 'MILESTONE' | 'PRECISION' | 'CHALLENGE' | 'PRONUNCIATION';
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  expReward: number;
}

export interface LeaderboardUserDto {
  rank: number;
  displayName: string;
  avatar: string;
  xp: number;
  level: number;
  tier: string;
  averageScore: number;
  streak: number;
  isCurrentUser?: boolean;
}

export interface LeaderboardResponse {
  period: 'weekly' | 'alltime';
  leaderboard: LeaderboardUserDto[];
  userRank: LeaderboardUserDto | null;
}

const DEFAULT_BADGES: Array<{
  id: string;
  title: string;
  description: string;
  category: 'STREAK' | 'MILESTONE' | 'PRECISION' | 'CHALLENGE' | 'PRONUNCIATION';
  icon: string;
  expReward: number;
  checkUnlocked: (user: any) => { unlocked: boolean; progress: number };
}> = [
  {
    id: 'ach_1',
    title: 'Voice Pioneer',
    description: 'Complete your first public speaking rehearsal session',
    category: 'MILESTONE',
    icon: 'Mic',
    expReward: 100,
    checkUnlocked: (u) => ({
      unlocked: (u.totalPracticeMinutes || 0) > 0,
      progress: Math.min(100, Math.round(((u.totalPracticeMinutes || 0) > 0 ? 1 : 0) * 100)),
    }),
  },
  {
    id: 'ach_2',
    title: '7-Day Speaking Streak',
    description: 'Practice public speaking 7 days in a row',
    category: 'STREAK',
    icon: 'Flame',
    expReward: 250,
    checkUnlocked: (u) => {
      const streak = u.streakDays || 0;
      return {
        unlocked: streak >= 7,
        progress: Math.min(100, Math.round((streak / 7) * 100)),
      };
    },
  },
  {
    id: 'ach_3',
    title: 'Filler Word Assassin',
    description: 'Achieve a speech session with zero filler disfluencies',
    category: 'PRECISION',
    icon: 'Zap',
    expReward: 200,
    checkUnlocked: (u) => ({
      unlocked: (u.averageScore || 0) >= 90,
      progress: Math.min(100, Math.round(((u.averageScore || 0) / 90) * 100)),
    }),
  },
  {
    id: 'ach_4',
    title: 'Master Orator',
    description: 'Score 90+ overall across consecutive public speaking rehearsals',
    category: 'PRECISION',
    icon: 'Award',
    expReward: 350,
    checkUnlocked: (u) => ({
      unlocked: (u.averageScore || 0) >= 90,
      progress: Math.min(100, Math.round(((u.averageScore || 0) / 90) * 100)),
    }),
  },
  {
    id: 'ach_5',
    title: 'Crisp Articulator',
    description: 'Achieve a 90+ pronunciation accuracy score on phonetic evaluation',
    category: 'PRONUNCIATION',
    icon: 'Sparkles',
    expReward: 300,
    checkUnlocked: (u) => ({
      unlocked: (u.averageScore || 0) >= 88,
      progress: Math.min(100, Math.round(((u.averageScore || 0) / 88) * 100)),
    }),
  },
  {
    id: 'ach_6',
    title: '14-Day Unstoppable Flame',
    description: 'Maintain a 14-day continuous speaking practice streak',
    category: 'STREAK',
    icon: 'Flame',
    expReward: 500,
    checkUnlocked: (u) => {
      const streak = u.streakDays || 0;
      return {
        unlocked: streak >= 14,
        progress: Math.min(100, Math.round((streak / 14) * 100)),
      };
    },
  },
  {
    id: 'ach_7',
    title: 'Daily Drill Champion',
    description: 'Complete 5 targeted public speaking acoustic drills',
    category: 'CHALLENGE',
    icon: 'Target',
    expReward: 200,
    checkUnlocked: (u) => {
      const sessions = u.totalSessionsCount || 0;
      return {
        unlocked: sessions >= 5,
        progress: Math.min(100, Math.round((sessions / 5) * 100)),
      };
    },
  },
  {
    id: 'ach_8',
    title: 'Century Keynote Speaker',
    description: 'Log over 100 total minutes of live public speaking practice',
    category: 'MILESTONE',
    icon: 'Crown',
    expReward: 400,
    checkUnlocked: (u) => {
      const mins = u.totalPracticeMinutes || 0;
      return {
        unlocked: mins >= 100,
        progress: Math.min(100, Math.round((mins / 100) * 100)),
      };
    },
  },
];

interface LeaderboardCacheItem {
  timestamp: number;
  users: any[];
}

const cache: Record<string, LeaderboardCacheItem> = {};
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export class GamificationService {
  public static async getUserBadges(userId?: string): Promise<BadgeStatus[]> {
    let user: any = null;
    if (userId) {
      try {
        user = await UserModel.findById(userId);
      } catch (err) {
        logger.warn('Could not fetch user for badges from DB.');
      }
    }

    if (!user) {
      user = {
        streakDays: 0,
        totalPracticeMinutes: 0,
        averageScore: 0,
        exp: 0,
        level: 1,
      };
    }

    return DEFAULT_BADGES.map((b) => {
      const { unlocked, progress } = b.checkUnlocked(user);
      return {
        id: b.id,
        title: b.title,
        description: b.description,
        category: b.category,
        icon: b.icon,
        unlocked,
        progress,
        expReward: b.expReward,
      };
    });
  }

  /**
   * Real leaderboard endpoint returning top 20 plus requesting user's own rank.
   * Period: 'weekly' | 'alltime'
   * Cached for 60 seconds.
   * Never leaks email or IDs.
   * Excludes admins and users with 0 XP.
   */
  public static async getLeaderboardData(
    period: 'weekly' | 'alltime' = 'alltime',
    requestingUserId?: string
  ): Promise<LeaderboardResponse> {
    const isWeekly = (period || '').toLowerCase() === 'weekly';
    const cacheKey = isWeekly ? 'weekly' : 'alltime';
    const now = Date.now();

    let rawTop20: any[] = [];
    if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_TTL_MS) {
      rawTop20 = cache[cacheKey].users;
    } else {
      try {
        const filter: any = {
          role: { $nin: ['SUPER_ADMIN', 'ORG_ADMIN'] },
        };
        if (isWeekly) {
          filter.weeklyExp = { $gt: 0 };
        } else {
          filter.exp = { $gt: 0 };
        }

        const sortOptions: any = isWeekly ? { weeklyExp: -1, exp: -1 } : { exp: -1 };
        const dbUsers = await UserModel.find(filter)
          .select('fullName avatarUrl exp weeklyExp streakDays averageScore level')
          .sort(sortOptions)
          .limit(20)
          .lean();

        rawTop20 = dbUsers || [];
        cache[cacheKey] = {
          timestamp: now,
          users: rawTop20,
        };
      } catch (dbErr: any) {
        logger.error('Failed querying db for leaderboard:', dbErr.message);
        rawTop20 = [];
      }
    }

    // Format top 20 entries (Never return email or IDs)
    const top20: LeaderboardUserDto[] = rawTop20.map((u: any, idx: number) => {
      const userExp = isWeekly ? (u.weeklyExp || 0) : (u.exp || 0);
      const lvl = calculateLevel(u.exp || 0);
      const isCurrent = requestingUserId ? u._id?.toString() === requestingUserId : false;

      return {
        rank: idx + 1,
        displayName: formatDisplayName(u.fullName),
        avatar: u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        xp: userExp,
        level: lvl,
        tier: getTierName(lvl),
        averageScore: u.averageScore || 0,
        streak: u.streakDays || 0,
        isCurrentUser: isCurrent,
      };
    });

    // Requesting user's own rank
    let userRank: LeaderboardUserDto | null = null;
    if (requestingUserId) {
      const existingInTop = top20.find((entry) => entry.isCurrentUser);
      if (existingInTop) {
        userRank = existingInTop;
      } else {
        try {
          const currentUser = await UserModel.findById(requestingUserId)
            .select('fullName avatarUrl role exp weeklyExp streakDays averageScore level')
            .lean();

          if (currentUser && currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ORG_ADMIN') {
            const userExp = isWeekly ? (currentUser.weeklyExp || 0) : (currentUser.exp || 0);
            if (userExp > 0) {
              const higherFilter: any = {
                role: { $nin: ['SUPER_ADMIN', 'ORG_ADMIN'] },
              };
              if (isWeekly) {
                higherFilter.weeklyExp = { $gt: userExp };
              } else {
                higherFilter.exp = { $gt: userExp };
              }

              const countHigher = await UserModel.countDocuments(higherFilter);
              const lvl = calculateLevel(currentUser.exp || 0);

              userRank = {
                rank: countHigher + 1,
                displayName: formatDisplayName(currentUser.fullName),
                avatar: currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
                xp: userExp,
                level: lvl,
                tier: getTierName(lvl),
                averageScore: currentUser.averageScore || 0,
                streak: currentUser.streakDays || 0,
                isCurrentUser: true,
              };
            }
          }
        } catch (err: any) {
          logger.warn('Failed calculating user rank on leaderboard:', err.message);
        }
      }
    }

    return {
      period: isWeekly ? 'weekly' : 'alltime',
      leaderboard: top20,
      userRank,
    };
  }

  // Deprecated wrapper maintained for backwards compatibility
  public static async getLeaderboard(
    category: 'EXP' | 'SCORE' | 'STREAK' = 'EXP',
    timeframe: 'WEEKLY' | 'MONTHLY' | 'ALL_TIME' = 'ALL_TIME',
    currentUserId?: string
  ): Promise<any[]> {
    const period = timeframe === 'WEEKLY' ? 'weekly' : 'alltime';
    const data = await this.getLeaderboardData(period, currentUserId);
    return data.leaderboard;
  }
}

