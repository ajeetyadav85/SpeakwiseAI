import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { mockAchievements, fetchBadgesApi } from '../services/api';
import { Achievement } from '../types';
import {
  Award,
  Flame,
  Zap,
  Sparkles,
  Crown,
  Target,
  Trophy,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const AchievementsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [achievements, setAchievements] = useState<Achievement[]>(mockAchievements);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchBadgesApi();
        setAchievements(data);
      } catch (e) {}
    };
    load();
  }, []);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const currentExp = user?.exp || 1850;
  const currentLevel = user?.level || 4;
  const nextLevelExp = (currentLevel + 1) * 500;
  const levelProgress = Math.min(100, Math.round(((currentExp % 500) / 500) * 100));

  const filteredBadges = achievements.filter((b) => {
    if (selectedCategory === 'ALL') return true;
    return b.category === selectedCategory;
  });

  const getIcon = (iconName: string, unlocked: boolean) => {
    const cls = `w-6 h-6 ${unlocked ? 'text-amber-500' : 'text-slate-400'}`;
    switch (iconName) {
      case 'Flame':
        return <Flame className={cls} />;
      case 'Zap':
        return <Zap className={cls} />;
      case 'Sparkles':
        return <Sparkles className={cls} />;
      case 'Crown':
        return <Crown className={cls} />;
      case 'Target':
        return <Target className={cls} />;
      default:
        return <Award className={cls} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Gamification & Skill Badges
            </span>
            <Badge variant="emerald">{unlockedCount}/{achievements.length} Unlocked</Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Public Speaking Badges & Milestones
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-medium">
            Unlock achievements by hitting public speaking consistency, pronunciation, and pacing milestones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/leaderboard">
            <Button variant="primary" size="sm" leftIcon={<Trophy className="w-4 h-4 text-amber-300" />}>
              View Global Leaderboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Level Progression Banner */}
      <Card className="neu-flat p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl neu-button flex flex-col items-center justify-center text-amber-500 font-black shadow-neu-glow">
              <span className="text-2xl font-black">Lvl {currentLevel}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Silver Public Speaking Orator
                </h3>
                <Badge variant="indigo">Tier 2 Speaker</Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                {currentExp.toLocaleString()} Total EXP Points • Next Level in {500 - (currentExp % 500)} EXP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/practice/studio">
              <Button size="sm" variant="primary" className="rounded-full" leftIcon={<Zap className="w-4 h-4 text-amber-300" />}>
                Earn +100 EXP in Studio
              </Button>
            </Link>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            <span className="text-slate-500">Level {currentLevel}</span>
            <span className="text-indigo-600 dark:text-indigo-400">{levelProgress}% to Level {currentLevel + 1}</span>
            <span className="text-slate-500">Level {currentLevel + 1}</span>
          </div>
          <div className="w-full neu-pressed rounded-full h-3 p-0.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-600 via-violet-600 to-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl neu-pressed overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Badges' },
          { id: 'STREAK', label: 'Streaks & Consistency' },
          { id: 'PRECISION', label: 'Score & Precision' },
          { id: 'PRONUNCIATION', label: 'Phonetics & Pronunciation' },
          { id: 'MILESTONE', label: 'Practice Milestones' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
              selectedCategory === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredBadges.map((ach) => (
          <Card key={ach.id} className="neu-flat p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    ach.unlocked
                      ? 'neu-button shadow-neu-glow'
                      : 'neu-pressed opacity-60'
                  }`}
                >
                  {getIcon(ach.icon, ach.unlocked)}
                </div>

                {ach.unlocked ? (
                  <Badge variant="emerald">Unlocked</Badge>
                ) : (
                  <Badge variant="slate">{ach.progress}% Progress</Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {ach.title}
                </h3>
                {ach.expReward && (
                  <span className="text-[11px] font-mono font-bold text-amber-500">
                    +{ach.expReward} EXP
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed font-medium">
                {ach.description}
              </p>
            </div>

            <div>
              {ach.unlocked ? (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Unlocked on {ach.unlockedAt || 'Recent Session'}</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Progress</span>
                    <span>{ach.progress}%</span>
                  </div>
                  <div className="w-full neu-pressed rounded-full h-2 overflow-hidden p-0.5">
                    <div
                      className="bg-gradient-to-r from-indigo-600 to-violet-600 h-full rounded-full"
                      style={{ width: `${ach.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

