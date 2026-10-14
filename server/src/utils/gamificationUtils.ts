export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 19,800,000 ms

export function getISTDateInfo(date = new Date()) {
  const istTime = new Date(date.getTime() + IST_OFFSET_MS);
  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istTime.getUTCDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  const dayOfWeek = istTime.getUTCDay(); // 0 = Sun, 1 = Mon... 6 = Sat

  // Monday of the current week in IST
  // Days since Monday: Sunday (0) -> 6 days, Monday (1) -> 0 days, Tuesday (2) -> 1 day...
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const mondayTime = new Date(istTime.getTime() - (daysSinceMonday * 24 * 60 * 60 * 1000));
  const mYear = mondayTime.getUTCFullYear();
  const mMonth = String(mondayTime.getUTCMonth() + 1).padStart(2, '0');
  const mDay = String(mondayTime.getUTCDate()).padStart(2, '0');
  const mondayDateStr = `${mYear}-${mMonth}-${mDay}`;

  return {
    dateStr,
    dayOfWeek,
    mondayDateStr,
  };
}

export function calculateLevel(exp: number): number {
  if (!exp || exp <= 0) return 1;
  return Math.max(1, Math.floor(exp / 450) + 1);
}

export function getTierName(level: number): string {
  if (level >= 10) return 'Legendary Keynote Master';
  if (level >= 7) return 'Gold Executive Speaker';
  if (level >= 4) return 'Silver Orator';
  return 'Bronze Speaker';
}

export function formatDisplayName(fullName?: string): string {
  if (!fullName || !fullName.trim()) return 'Anonymous';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase() || '';
  return lastInitial ? `${firstName} ${lastInitial}.` : firstName;
}

export interface GamificationUpdateResult {
  expAwarded: number;
  exp: number;
  weeklyExp: number;
  streakDays: number;
  level: number;
  tier: string;
  averageScore: number;
  totalPracticeMinutes: number;
}

export function applyPracticeSessionGamification(
  user: any,
  durationSeconds: number,
  overallScore?: number,
  date = new Date()
): GamificationUpdateResult {
  const { dateStr, mondayDateStr } = getISTDateInfo(date);
  const duration = Math.max(0, Math.floor(durationSeconds || 0));

  let rawXp = 0;
  if (duration >= 20) {
    // 10 XP base + 1 XP per full minute spoken
    rawXp = 10 + Math.floor(duration / 60) * 1;
  }

  // Daily XP cap (100 XP per IST calendar day)
  if (user.dailyExpDateIST !== dateStr) {
    user.dailyExpDateIST = dateStr;
    user.dailyExpAwarded = 0;
  }

  const availableToday = Math.max(0, 100 - (user.dailyExpAwarded || 0));
  const expAwarded = Math.min(rawXp, availableToday);

  // Weekly XP reset on Monday (IST)
  if (user.weeklyExpResetAtIST !== mondayDateStr) {
    user.weeklyExp = 0;
    user.weeklyExpResetAtIST = mondayDateStr;
  }

  user.exp = (user.exp || 0) + expAwarded;
  user.weeklyExp = (user.weeklyExp || 0) + expAwarded;
  user.dailyExpAwarded = (user.dailyExpAwarded || 0) + expAwarded;
  user.level = calculateLevel(user.exp);

  // Practice minutes: add full minutes spoken
  const minutesSpoken = Math.floor(duration / 60);
  if (minutesSpoken > 0) {
    user.totalPracticeMinutes = (user.totalPracticeMinutes || 0) + minutesSpoken;
  }

  // Streak calculation (IST calendar day)
  if (user.lastPracticeDateIST === dateStr) {
    // Same day session: count once (do not increment streak)
    user.streakDays = Math.max(1, user.streakDays || 1);
  } else if (user.lastPracticeDateIST) {
    const prevTime = Date.parse(user.lastPracticeDateIST + 'T00:00:00Z');
    const currTime = Date.parse(dateStr + 'T00:00:00Z');
    const diffDays = Math.round((currTime - prevTime) / (24 * 60 * 60 * 1000));
    if (diffDays === 1) {
      // Consecutive IST day
      user.streakDays = (user.streakDays || 0) + 1;
    } else if (diffDays > 1) {
      // Missed at least 1 calendar day -> reset to 1
      user.streakDays = 1;
    } else {
      user.streakDays = Math.max(1, user.streakDays || 1);
    }
    user.lastPracticeDateIST = dateStr;
  } else {
    // First practice session ever
    user.streakDays = 1;
    user.lastPracticeDateIST = dateStr;
  }

  // Running average score
  if (typeof overallScore === 'number' && overallScore > 0) {
    const prevSessions = user.totalSessionsCount || 0;
    const newSessions = prevSessions + 1;
    const prevAvg = user.averageScore || 0;
    user.averageScore = Math.round(((prevAvg * prevSessions) + overallScore) / newSessions);
    user.totalSessionsCount = newSessions;
  }

  return {
    expAwarded,
    exp: user.exp,
    weeklyExp: user.weeklyExp,
    streakDays: user.streakDays,
    level: user.level,
    tier: getTierName(user.level),
    averageScore: user.averageScore,
    totalPracticeMinutes: user.totalPracticeMinutes,
  };
}
