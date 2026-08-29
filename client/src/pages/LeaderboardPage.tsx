import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { fetchLeaderboardApi, mockLeaderboardData } from '../services/api';
import { LeaderboardUser } from '../types';
import {
  Trophy,
  Flame,
  Zap,
  TrendingUp,
  Award,
  Crown,
  Search,
  ArrowUp,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<LeaderboardUser[]>(mockLeaderboardData);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<'EXP' | 'SCORE' | 'STREAK'>('EXP');
  const [timeframe, setTimeframe] = useState<'WEEKLY' | 'MONTHLY' | 'ALL_TIME'>('ALL_TIME');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true);
      try {
        const data = await fetchLeaderboardApi(category, timeframe);
        setUsers(data);
      } catch (err) {
        console.error('Failed to load leaderboard', err);
      } finally {
        setLoading(false);
      }
    };
    loadLeaderboard();
  }, [category, timeframe]);

  const filteredUsers = users.filter((u) =>
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const top3 = users.slice(0, 3);
  const firstPlace = top3[0];
  const secondPlace = top3[1];
  const thirdPlace = top3[2];

  const currentUserRank = users.find(
    (u) => u.userId === user?.id || (user && u.fullName === user.fullName)
  ) || {
    rank: 3,
    userId: user?.id || 'usr_guest',
    fullName: user?.fullName || 'Your Account',
    avatarUrl: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    role: user?.role || 'FREE_USER',
    exp: user?.exp || 250,
    level: user?.level || 1,
    streakDays: user?.streakDays || 1,
    averageScore: user?.averageScore || 85,
    totalPracticeMinutes: user?.totalPracticeMinutes || 0,
    badgeCount: 1,
    isCurrentUser: true,
  };


  const getTierName = (level: number) => {
    if (level >= 10) return 'Legendary Keynote Master';
    if (level >= 7) return 'Gold Executive Speaker';
    if (level >= 4) return 'Silver Orator';
    return 'Bronze Speaker';
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
            <Badge variant="amber">Season 3 Live</Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Leaderboard & Public Speaking Rankings
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-medium">
            Compete with top public speakers globally, earn EXP from rehearsals, and rise up the ranks.
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
        {/* Category tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl neu-pressed overflow-x-auto">
          {[
            { id: 'EXP', label: 'Overall EXP Points', icon: <Zap className="w-3.5 h-3.5" /> },
            { id: 'SCORE', label: 'Speech Quality Score', icon: <TrendingUp className="w-3.5 h-3.5" /> },
            { id: 'STREAK', label: 'Practice Streak', icon: <Flame className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategory(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap ${
                category === tab.id
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Timeframe selector & Search */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-2xl neu-pressed">
            {[
              { id: 'WEEKLY', label: 'Weekly' },
              { id: 'MONTHLY', label: 'Monthly' },
              { id: 'ALL_TIME', label: 'All-Time' },
            ].map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  timeframe === tf.id
                    ? 'neu-button text-indigo-600 dark:text-indigo-400 font-black'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

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
      </div>

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
                  src={secondPlace.avatarUrl}
                  alt={secondPlace.fullName}
                  className="w-20 h-20 rounded-full object-cover neu-button p-1"
                />
                <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-slate-400 text-slate-900 font-black text-xs flex items-center justify-center">
                  2
                </span>
              </div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">{secondPlace.fullName}</h3>
              <span className="text-xs text-slate-500 font-semibold">{getTierName(secondPlace.level)}</span>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 w-full flex items-center justify-around text-xs">
                <div>
                  <div className="font-mono font-bold text-amber-500">{secondPlace.exp.toLocaleString()} EXP</div>
                  <div className="text-[10px] text-slate-400">Total Points</div>
                </div>
                <div>
                  <div className="font-mono font-bold text-emerald-500">{secondPlace.averageScore}/100</div>
                  <div className="text-[10px] text-slate-400">Avg Score</div>
                </div>
                <div>
                  <div className="font-mono font-bold text-cyan-500">🔥 {secondPlace.streakDays}d</div>
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
                  src={firstPlace.avatarUrl}
                  alt={firstPlace.fullName}
                  className="w-24 h-24 rounded-full object-cover neu-button p-1.5 ring-4 ring-amber-400/40"
                />
                <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                  👑
                </span>
              </div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white">{firstPlace.fullName}</h3>
              <Badge variant="amber" size="sm">{getTierName(firstPlace.level)}</Badge>

              <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 w-full flex items-center justify-around text-xs">
                <div>
                  <div className="font-mono font-black text-amber-500 text-sm">{firstPlace.exp.toLocaleString()} EXP</div>
                  <div className="text-[10px] text-slate-400 font-bold">Total Points</div>
                </div>
                <div>
                  <div className="font-mono font-black text-emerald-500 text-sm">{firstPlace.averageScore}/100</div>
                  <div className="text-[10px] text-slate-400 font-bold">Avg Score</div>
                </div>
                <div>
                  <div className="font-mono font-black text-cyan-500 text-sm">🔥 {firstPlace.streakDays}d</div>
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
                  src={thirdPlace.avatarUrl}
                  alt={thirdPlace.fullName}
                  className="w-20 h-20 rounded-full object-cover neu-button p-1"
                />
                <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center">
                  3
                </span>
              </div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">{thirdPlace.fullName}</h3>
              <span className="text-xs text-slate-500 font-semibold">{getTierName(thirdPlace.level)}</span>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 w-full flex items-center justify-around text-xs">
                <div>
                  <div className="font-mono font-bold text-amber-500">{thirdPlace.exp.toLocaleString()} EXP</div>
                  <div className="text-[10px] text-slate-400">Total Points</div>
                </div>
                <div>
                  <div className="font-mono font-bold text-emerald-500">{thirdPlace.averageScore}/100</div>
                  <div className="text-[10px] text-slate-400">Avg Score</div>
                </div>
                <div>
                  <div className="font-mono font-bold text-cyan-500">🔥 {thirdPlace.streakDays}d</div>
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
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Rankings Table</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">Updated 5 mins ago</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4 text-center w-16">Rank</th>
                <th className="py-3.5 px-4">Public Speaker</th>
                <th className="py-3.5 px-4">Tier & Badges</th>
                <th className="py-3.5 px-4 text-center">Avg Score</th>
                <th className="py-3.5 px-4 text-center">Streak</th>
                <th className="py-3.5 px-4 text-right">EXP Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredUsers.map((item) => {
                const isMe = item.userId === user?.id || item.isCurrentUser;

                return (
                  <tr
                    key={item.userId}
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
                          src={item.avatarUrl}
                          alt={item.fullName}
                          className="w-9 h-9 rounded-full object-cover neu-button p-0.5"
                        />
                        <div>
                          <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{item.fullName}</span>
                            {isMe && <Badge variant="indigo" size="sm">You</Badge>}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            Level {item.level} • {item.totalPracticeMinutes} mins rehearsed
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {getTierName(item.level)}
                        </span>
                        <span className="text-[10px] neu-pressed px-2 py-0.5 rounded-full text-slate-400 font-mono">
                          🏆 {item.badgeCount} Badges
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                      {item.averageScore}
                    </td>

                    <td className="py-4 px-4 text-center font-mono font-extrabold text-amber-500">
                      🔥 {item.streakDays}d
                    </td>

                    <td className="py-4 px-4 text-right font-mono font-black text-indigo-600 dark:text-indigo-400">
                      {item.exp.toLocaleString()} EXP
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Sticky Bottom Bar: Current User Standing */}
      <div className="fixed bottom-4 left-4 right-4 max-w-5xl mx-auto z-30">
        <div className="neu-flat p-4 rounded-2xl shadow-2xl border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-lg bg-slate-900/90 text-white">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-neu-glow">
              #{currentUserRank.rank}
            </div>
            <div>
              <div className="font-black text-sm flex items-center gap-2">
                <span>{currentUserRank.fullName}</span>
                <span className="text-xs text-amber-400 font-mono">Level {currentUserRank.level} ({getTierName(currentUserRank.level)})</span>
              </div>
              <div className="text-xs text-slate-300 font-medium">
                {currentUserRank.exp.toLocaleString()} EXP • {currentUserRank.averageScore}/100 Avg • {currentUserRank.streakDays}-Day Streak
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right text-xs">
              <span className="text-slate-400">Next Rank in: </span>
              <strong className="text-emerald-400 font-mono">+550 EXP</strong>
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
