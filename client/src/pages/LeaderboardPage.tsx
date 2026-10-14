import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { fetchLeaderboardApi } from '../services/api';
import { LeaderboardUser } from '../types';
import {
  Trophy,
  Flame,
  Zap,
  Award,
  Crown,
  Search,
  Loader2,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'WEEKLY' | 'ALL_TIME'>('ALL_TIME');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    const loadLeaderboard = async () => {
      setLoading(true);
      try {
        const period = timeframe === 'WEEKLY' ? 'weekly' : 'alltime';
        const res = await fetchLeaderboardApi(period);
        if (isMounted) {
          setUsers(res.leaderboard || []);
          setUserRank(res.userRank || null);
        }
      } catch (err) {
        console.error('Failed to load leaderboard', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    loadLeaderboard();
    return () => {
      isMounted = false;
    };
  }, [timeframe]);

  const filteredUsers = users.filter((u) => {
    const name = u.displayName || u.fullName || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const top3 = users.slice(0, 3);
  const firstPlace = top3[0];
  const secondPlace = top3[1];
  const thirdPlace = top3[2];

  // Requesting user's effective rank and metrics
  const activeUserRank = userRank || users.find((u) => u.isCurrentUser);

  const getTierName = (level: number) => {
    if (level >= 10) return 'Legendary Keynote Master';
    if (level >= 7) return 'Gold Executive Speaker';
    if (level >= 4) return 'Silver Orator';
    return 'Bronze Speaker';
  };

  // Compute "Next Rank in" from user immediately above
  const renderNextRankIn = () => {
    if (!activeUserRank || !activeUserRank.rank) {
      if (users.length > 0) {
        const threshold = users[users.length - 1].xp || 1;
        return <strong className="text-emerald-400 font-mono">+{threshold} EXP to enter</strong>;
      }
      return <strong className="text-emerald-400 font-mono">Practice to enter</strong>;
    }

    if (activeUserRank.rank === 1) {
      return <strong className="text-amber-400 font-mono">#1 Champion 👑</strong>;
    }

    const currentRankIdx = activeUserRank.rank - 1;
    const userAbove = users[currentRankIdx - 1];
    if (userAbove) {
      const diff = Math.max(1, (userAbove.xp || 0) - (activeUserRank.xp || 0) + 1);
      return <strong className="text-emerald-400 font-mono">+{diff.toLocaleString()} EXP to #{activeUserRank.rank - 1}</strong>;
    }

    return <strong className="text-emerald-400 font-mono">Practice to rank up</strong>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-28">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Trophy className="w-4 h-4" />
              Global Speaking Championship
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Leaderboard & Public Speaking Rankings
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-medium">
            Earn EXP from real speaking sessions, build your daily streak, and rise up the ranks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/achievements">
            <Button variant="outline" size="sm" leftIcon={<Award className="w-4 h-4 text-indigo-500" />}>
              View Badges
            </Button>
          </Link>
          <Link to="/practice/studio">
            <Button variant="primary" size="sm" leftIcon={<Zap className="w-4 h-4 text-amber-300" />}>
              Practice & Earn +EXP
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Timeframe selector (Weekly and All-Time only) */}
        <div className="flex items-center gap-1 p-1 rounded-2xl neu-pressed">
          {[
            { id: 'WEEKLY', label: 'Weekly' },
            { id: 'ALL_TIME', label: 'All-Time' },
          ].map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                timeframe === tf.id
                  ? 'neu-button text-indigo-600 dark:text-indigo-400 font-black shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search speaker..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs rounded-xl neu-pressed bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Loading Spinner */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium">Loading rankings...</p>
        </div>
      ) : users.length === 0 ? (
        /* Empty State */
        <Card className="neu-flat p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Trophy className="w-8 h-8" />
          </div>
          <div className="max-w-md">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              No ranked speakers yet {timeframe === 'WEEKLY' ? 'this week' : ''}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Complete a public speaking rehearsal of at least 20 seconds to earn your first EXP and claim the #1 spot on the leaderboard!
            </p>
          </div>
          <Link to="/practice/studio">
            <Button variant="primary" size="sm" leftIcon={<Zap className="w-4 h-4 text-amber-300" />}>
              Start Practicing Now
            </Button>
          </Link>
        </Card>
      ) : (
        <>
          {/* Top 3 Visual Podium */}
          {top3.length >= 3 && !searchQuery && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 items-end">
              {/* 2nd Place */}
              {secondPlace && (
                <Card className="neu-flat p-6 flex flex-col items-center text-center relative border-t-4 border-slate-400 order-2 md:order-1">
                  <div className="absolute -top-4 px-3 py-1 rounded-full neu-button text-slate-400 text-xs font-black flex items-center gap-1 shadow-neu-glow">
                    🥈 Rank #2
                  </div>
                  <div className="relative my-4">
                    <img
                      src={secondPlace.avatar || secondPlace.avatarUrl}
                      alt={secondPlace.displayName || secondPlace.fullName}
                      className="w-20 h-20 rounded-full object-cover neu-button p-1"
                    />
                    <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-slate-400 text-slate-900 font-black text-xs flex items-center justify-center">
                      2
                    </span>
                  </div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    {secondPlace.displayName || secondPlace.fullName}
                  </h3>
                  <span className="text-xs text-slate-500 font-semibold">{secondPlace.tier || getTierName(secondPlace.level)}</span>

                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 w-full flex items-center justify-around text-xs">
                    <div>
                      <div className="font-mono font-bold text-amber-500">{(secondPlace.xp ?? secondPlace.exp ?? 0).toLocaleString()} EXP</div>
                      <div className="text-[10px] text-slate-400">Total Points</div>
                    </div>
                    <div>
                      <div className="font-mono font-bold text-emerald-500">{secondPlace.averageScore}/100</div>
                      <div className="text-[10px] text-slate-400">Avg Score</div>
                    </div>
                    <div>
                      <div className="font-mono font-bold text-cyan-500">🔥 {secondPlace.streak ?? secondPlace.streakDays ?? 0}d</div>
                      <div className="text-[10px] text-slate-400">Streak</div>
                    </div>
                  </div>
                </Card>
              )}

              {/* 1st Place (Center Champion Podium) */}
              {firstPlace && (
                <Card className="neu-flat p-8 flex flex-col items-center text-center relative border-t-4 border-amber-400 shadow-neu-glow order-1 md:order-2 md:-translate-y-4">
                  <div className="absolute -top-5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/30">
                    <Crown className="w-4 h-4 text-slate-950" />
                    <span>Champion #1</span>
                  </div>
                  <div className="relative my-4">
                    <img
                      src={firstPlace.avatar || firstPlace.avatarUrl}
                      alt={firstPlace.displayName || firstPlace.fullName}
                      className="w-24 h-24 rounded-full object-cover neu-button p-1.5 ring-4 ring-amber-400/40"
                    />
                    <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                      👑
                    </span>
                  </div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white">
                    {firstPlace.displayName || firstPlace.fullName}
                  </h3>
                  <Badge variant="amber" size="sm">{firstPlace.tier || getTierName(firstPlace.level)}</Badge>

                  <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 w-full flex items-center justify-around text-xs">
                    <div>
                      <div className="font-mono font-black text-amber-500 text-sm">{(firstPlace.xp ?? firstPlace.exp ?? 0).toLocaleString()} EXP</div>
                      <div className="text-[10px] text-slate-400 font-bold">Total Points</div>
                    </div>
                    <div>
                      <div className="font-mono font-black text-emerald-500 text-sm">{firstPlace.averageScore}/100</div>
                      <div className="text-[10px] text-slate-400 font-bold">Avg Score</div>
                    </div>
                    <div>
                      <div className="font-mono font-black text-cyan-500 text-sm">🔥 {firstPlace.streak ?? firstPlace.streakDays ?? 0}d</div>
                      <div className="text-[10px] text-slate-400 font-bold">Streak</div>
                    </div>
                  </div>
                </Card>
              )}

              {/* 3rd Place */}
              {thirdPlace && (
                <Card className="neu-flat p-6 flex flex-col items-center text-center relative border-t-4 border-amber-700 order-3">
                  <div className="absolute -top-4 px-3 py-1 rounded-full neu-button text-amber-600 text-xs font-black flex items-center gap-1 shadow-neu-glow">
                    🥉 Rank #3
                  </div>
                  <div className="relative my-4">
                    <img
                      src={thirdPlace.avatar || thirdPlace.avatarUrl}
                      alt={thirdPlace.displayName || thirdPlace.fullName}
                      className="w-20 h-20 rounded-full object-cover neu-button p-1"
                    />
                    <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center">
                      3
                    </span>
                  </div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    {thirdPlace.displayName || thirdPlace.fullName}
                  </h3>
                  <span className="text-xs text-slate-500 font-semibold">{thirdPlace.tier || getTierName(thirdPlace.level)}</span>

                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 w-full flex items-center justify-around text-xs">
                    <div>
                      <div className="font-mono font-bold text-amber-500">{(thirdPlace.xp ?? thirdPlace.exp ?? 0).toLocaleString()} EXP</div>
                      <div className="text-[10px] text-slate-400">Total Points</div>
                    </div>
                    <div>
                      <div className="font-mono font-bold text-emerald-500">{thirdPlace.averageScore}/100</div>
                      <div className="text-[10px] text-slate-400">Avg Score</div>
                    </div>
                    <div>
                      <div className="font-mono font-bold text-cyan-500">🔥 {thirdPlace.streak ?? thirdPlace.streakDays ?? 0}d</div>
                      <div className="text-[10px] text-slate-400">Streak</div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Full Leaderboard Table */}
          <Card className="neu-flat p-0 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-indigo-500" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Top Speakers</h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">Live IST Rankings (Cached 60s)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 text-center w-16">Rank</th>
                    <th className="py-3.5 px-4">Speaker</th>
                    <th className="py-3.5 px-4">Tier</th>
                    <th className="py-3.5 px-4 text-center">Avg Score</th>
                    <th className="py-3.5 px-4 text-center">Streak</th>
                    <th className="py-3.5 px-4 text-right">EXP Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredUsers.map((item) => {
                    const isMe = item.isCurrentUser;

                    return (
                      <tr
                        key={item.rank}
                        className={`transition-colors ${
                          isMe
                            ? 'bg-indigo-500/10 dark:bg-indigo-950/40 font-bold border-l-4 border-indigo-600'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-900/40'
                        }`}
                      >
                        <td className="py-4 px-4 text-center">
                          {item.rank === 1 ? (
                            <span className="w-7 h-7 rounded-full bg-amber-400/20 text-amber-500 font-black text-xs inline-flex items-center justify-center">
                              🥇 1
                            </span>
                          ) : item.rank === 2 ? (
                            <span className="w-7 h-7 rounded-full bg-slate-400/20 text-slate-400 font-black text-xs inline-flex items-center justify-center">
                              🥈 2
                            </span>
                          ) : item.rank === 3 ? (
                            <span className="w-7 h-7 rounded-full bg-amber-700/20 text-amber-600 font-black text-xs inline-flex items-center justify-center">
                              🥉 3
                            </span>
                          ) : (
                            <span className="font-mono font-bold text-slate-500">#{item.rank}</span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.avatar || item.avatarUrl}
                              alt={item.displayName || item.fullName}
                              className="w-9 h-9 rounded-full object-cover neu-button p-0.5"
                            />
                            <div>
                              <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{item.displayName || item.fullName}</span>
                                {isMe && <Badge variant="indigo" size="sm">You</Badge>}
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium">
                                Level {item.level}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {item.tier || getTierName(item.level)}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                          {item.averageScore || 0}
                        </td>

                        <td className="py-4 px-4 text-center font-mono font-extrabold text-amber-500">
                          🔥 {item.streak ?? item.streakDays ?? 0}d
                        </td>

                        <td className="py-4 px-4 text-right font-mono font-black text-indigo-600 dark:text-indigo-400">
                          {(item.xp ?? item.exp ?? 0).toLocaleString()} EXP
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Sticky Bottom Bar: Current User Standing */}
      <div className="fixed bottom-4 left-4 right-4 max-w-5xl mx-auto z-30">
        <div className="neu-flat p-4 rounded-2xl shadow-2xl border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-lg bg-slate-900/90 text-white">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-neu-glow">
              {activeUserRank?.rank ? `#${activeUserRank.rank}` : '—'}
            </div>
            <div>
              <div className="font-black text-sm flex items-center gap-2">
                <span>{activeUserRank?.displayName || activeUserRank?.fullName || user?.fullName || 'Your Standing'}</span>
                <span className="text-xs text-amber-400 font-mono">
                  Level {activeUserRank?.level || user?.level || 1} ({activeUserRank?.tier || getTierName(activeUserRank?.level || user?.level || 1)})
                </span>
              </div>
              <div className="text-xs text-slate-300 font-medium">
                {(activeUserRank?.xp ?? activeUserRank?.exp ?? user?.exp ?? 0).toLocaleString()} EXP • {activeUserRank?.averageScore || user?.averageScore || 0}/100 Avg • {activeUserRank?.streak ?? activeUserRank?.streakDays ?? user?.streakDays ?? 0}-Day Streak
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right text-xs">
              <span className="text-slate-400">Next Rank in: </span>
              {renderNextRankIn()}
            </div>
            <Link to="/practice/studio">
              <Button size="sm" variant="primary" className="rounded-full px-5 py-2 font-extrabold" leftIcon={<Zap className="w-4 h-4 text-amber-300" />}>
                Practice to Rank Up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

