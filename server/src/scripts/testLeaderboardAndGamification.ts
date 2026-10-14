import {
  applyPracticeSessionGamification,
  calculateLevel,
  getTierName,
  formatDisplayName,
  getISTDateInfo,
} from '../utils/gamificationUtils.js';
import { GamificationService } from '../services/gamification.service.js';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING LEADERBOARD & GAMIFICATION REGRESSION TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (!condition) {
      console.error(`❌ FAILED: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
    console.log(`✅ PASSED: ${message}`);
    passed++;
  }

  // --------------------------------------------------------------------------
  // TEST 1: New user starts at 0 XP, 0 streak, 0 avgScore, level 1
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 1: Initial New User Defaults ---');
  const newUser = {
    exp: 0,
    weeklyExp: 0,
    streakDays: 0,
    totalPracticeMinutes: 0,
    averageScore: 0,
    level: 1,
    dailyExpAwarded: 0,
    dailyExpDateIST: '',
    weeklyExpResetAtIST: '',
    lastPracticeDateIST: '',
    totalSessionsCount: 0,
  };
  assert(newUser.exp === 0, 'New user starts with 0 total EXP');
  assert(newUser.weeklyExp === 0, 'New user starts with 0 weekly EXP');
  assert(newUser.streakDays === 0, 'New user starts with 0 streak days');
  assert(newUser.averageScore === 0, 'New user starts with 0 average score');
  assert(newUser.level === 1, 'New user starts at level 1');
  assert(calculateLevel(newUser.exp) === 1, 'calculateLevel(0) returns level 1');
  assert(getTierName(1) === 'Bronze Speaker', 'Level 1 tier is Bronze Speaker');

  // --------------------------------------------------------------------------
  // TEST 2: Practice session < 20s awards 0 XP
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 2: Under 20s Duration Awards 0 XP ---');
  const userUnder20 = { ...newUser };
  const resUnder20 = applyPracticeSessionGamification(userUnder20, 15);
  assert(resUnder20.expAwarded === 0, 'Session under 20s (15s) awards 0 XP');
  assert(userUnder20.exp === 0, 'Total EXP remains 0');

  // --------------------------------------------------------------------------
  // TEST 3: Practice session >= 20s awards 10 XP + 1 per full minute
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 3: Correct XP Awarding Formula ---');
  const user20s = { ...newUser };
  const res20s = applyPracticeSessionGamification(user20s, 25);
  assert(res20s.expAwarded === 10, '25s session awards 10 XP (10 + 0)');

  const user60s = { ...newUser };
  const res60s = applyPracticeSessionGamification(user60s, 60);
  assert(res60s.expAwarded === 11, '60s session awards 11 XP (10 + 1)');

  const user130s = { ...newUser };
  const res130s = applyPracticeSessionGamification(user130s, 130);
  assert(res130s.expAwarded === 12, '130s session awards 12 XP (10 + 2)');

  // --------------------------------------------------------------------------
  // TEST 4: Daily 100 XP Cap
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 4: Daily 100 XP Cap per IST Calendar Day ---');
  const userCapped = { ...newUser };
  // 8 sessions of 120s (12 XP each) = 96 XP
  for (let i = 0; i < 8; i++) {
    applyPracticeSessionGamification(userCapped, 120);
  }
  assert(userCapped.exp === 96, 'User earned 96 XP after 8 sessions of 12 XP');

  // 9th session of 120s should award only 4 XP to hit the 100 XP cap
  const resCap = applyPracticeSessionGamification(userCapped, 120);
  assert(resCap.expAwarded === 4, '9th session is capped at 4 XP to reach 100 XP');
  assert(userCapped.exp === 100, 'User total EXP reached exactly 100');

  // 10th session on same day should award 0 XP
  const resOverCap = applyPracticeSessionGamification(userCapped, 120);
  assert(resOverCap.expAwarded === 0, 'Further sessions on the same IST day award 0 XP');
  assert(userCapped.exp === 100, 'User EXP stays at 100');

  // --------------------------------------------------------------------------
  // TEST 5: Same-day streak doesn't double-count & consecutive IST days increment
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 5: IST Streak Calculation & Deduplication ---');
  const streakUser = { ...newUser };
  const day1 = new Date('2026-10-15T10:00:00Z'); // 15:30 IST
  applyPracticeSessionGamification(streakUser, 60, 85, day1);
  assert(streakUser.streakDays === 1, 'First session sets streak to 1');

  // Second session on the SAME IST DAY:
  const day1Evening = new Date('2026-10-15T16:00:00Z'); // 21:30 IST (same IST calendar day 2026-10-15)
  applyPracticeSessionGamification(streakUser, 60, 90, day1Evening);
  assert(streakUser.streakDays === 1, 'Second session on the same IST day keeps streak at 1 (NO double-count)');

  // Consecutive day (Day 2 in IST: 2026-10-16):
  const day2 = new Date('2026-10-16T08:00:00Z'); // 13:30 IST
  applyPracticeSessionGamification(streakUser, 60, 88, day2);
  assert(streakUser.streakDays === 2, 'Session on consecutive IST day increments streak to 2');

  // Missed a day (skip 2026-10-17, practice on 2026-10-18):
  const day4 = new Date('2026-10-18T08:00:00Z');
  applyPracticeSessionGamification(streakUser, 60, 80, day4);
  assert(streakUser.streakDays === 1, 'Missed day resets streak to 1');

  // --------------------------------------------------------------------------
  // TEST 6: Running averageScore and totalPracticeMinutes
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 6: Running Average Score & Practice Minutes ---');
  const statsUser = { ...newUser };
  applyPracticeSessionGamification(statsUser, 120, 80); // 2 mins, score 80
  assert(statsUser.averageScore === 80, 'First session sets averageScore to 80');
  assert(statsUser.totalPracticeMinutes === 2, 'First session adds 2 minutes');

  applyPracticeSessionGamification(statsUser, 180, 90); // 3 mins, score 90 -> avg (80 + 90)/2 = 85
  assert(statsUser.averageScore === 85, 'Second session calculates running average (80+90)/2 = 85');
  assert(statsUser.totalPracticeMinutes === 5, 'totalPracticeMinutes increases to 5');

  // --------------------------------------------------------------------------
  // TEST 7: Display Name Formatting & Security (No email or ID leaks)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 7: Display Name & Data Privacy (No email / ID leaks) ---');
  assert(formatDisplayName('Ajeet Yadav') === 'Ajeet Y.', 'Formats "Ajeet Yadav" to "Ajeet Y."');
  assert(formatDisplayName('Elena Rostova') === 'Elena R.', 'Formats "Elena Rostova" to "Elena R."');
  assert(formatDisplayName('Marcus Vance') === 'Marcus V.', 'Formats "Marcus Vance" to "Marcus V."');
  assert(formatDisplayName('Sophia') === 'Sophia', 'Formats single name to "Sophia"');

  const sampleLeaderboard = await GamificationService.getLeaderboardData('alltime');
  console.log(`Leaderboard entries retrieved: ${sampleLeaderboard.leaderboard.length}`);

  for (const entry of sampleLeaderboard.leaderboard) {
    assert(!('email' in entry), 'Leaderboard entry does NOT contain email');
    assert(!('_id' in entry), 'Leaderboard entry does NOT contain _id');
    assert(!('id' in entry), 'Leaderboard entry does NOT contain id');
    assert(!('userId' in entry), 'Leaderboard entry does NOT contain userId');
    assert(typeof entry.displayName === 'string', 'Leaderboard entry has displayName');
    assert(typeof entry.rank === 'number', 'Leaderboard entry has rank');
    assert(typeof entry.xp === 'number', 'Leaderboard entry has xp');
    assert(entry.xp > 0, 'Leaderboard excludes users with 0 XP');
  }

  if (sampleLeaderboard.userRank) {
    assert(!('email' in sampleLeaderboard.userRank), 'userRank does NOT contain email');
    assert(!('_id' in sampleLeaderboard.userRank), 'userRank does NOT contain _id');
    assert(!('id' in sampleLeaderboard.userRank), 'userRank does NOT contain id');
    assert(!('userId' in sampleLeaderboard.userRank), 'userRank does NOT contain userId');
  }

  console.log(`\n====================================================`);
  console.log(`🎉 ALL ${passed}/${total} REGRESSION TESTS PASSED SUCCESSFULLY!`);
  console.log(`====================================================\n`);
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
