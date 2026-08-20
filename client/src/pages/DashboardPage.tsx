import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import { mockSessions, mockDailyChallenge, mockAchievements } from '../services/api';
import {
  Mic,
  TrendingUp,
  Flame,
  Clock,
  Award,
  ArrowRight,
  Play,
  CheckCircle2,
  BarChart2,
  Zap,
  Crown,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { freeAttemptsLeft, isPro, openSubscriptionModal } = useSubscriptionStore();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Trial Status Banner */}
      {!isPro && (
        <div className="p-5 rounded-3xl neu-flat flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl neu-button text-amber-500 flex items-center justify-center font-bold">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                {freeAttemptsLeft > 0
                  ? `Free Trial Active — ${freeAttemptsLeft} of 3 Speech Analyses Remaining`
                  : 'Free Trial Expired (0/3 Remaining)'}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                {freeAttemptsLeft > 0
                  ? 'Upgrade to SpeakWise Pro for unlimited AI speech analysis and PDF exports.'
                  : 'Subscribe to Pro to unlock unlimited speech practice and full report analysis.'}
              </div>
            </div>
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={openSubscriptionModal}
            className="rounded-full px-6 py-2.5 text-xs font-extrabold flex-shrink-0"
            leftIcon={<Crown className="w-4 h-4 text-amber-300" />}
          >
            Upgrade to Pro (₹499/mo)
          </Button>
        </div>
      )}

      {/* Main Welcome Hero Header */}
      <div className="relative overflow-hidden rounded-3xl neu-flat p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Public Speaking & AI Speech Workspace
              </span>
              {isPro ? (
                <Badge variant="indigo">✨ Pro Member</Badge>
              ) : (
                <Badge variant="amber">⚡ Free Trial ({freeAttemptsLeft}/3)</Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Welcome back, {user?.fullName.split(' ')[0]} 👋
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xl font-medium">
              Focus on your public speaking practice today. You are on a <strong className="text-amber-600 dark:text-amber-400 font-extrabold">{user?.streakDays}-day practice streak</strong>!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <Link to="/practice" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="rounded-full w-full justify-center">
                Practice Topics
              </Button>
            </Link>
            <Link to="/practice/studio" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="rounded-full w-full justify-center" leftIcon={<Mic className="w-4 h-4" />}>
                Launch Studio HUD
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card hoverGlow className="flex items-center gap-4 neu-flat">
          <div className="w-12 h-12 rounded-2xl neu-button flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Average Score</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{user?.averageScore}<span className="text-xs text-slate-400">/100</span></div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
              <span>+4 pts from last week</span>
            </div>
          </div>
        </Card>

        <Card hoverGlow className="flex items-center gap-4 neu-flat">
          <div className="w-12 h-12 rounded-2xl neu-button flex items-center justify-center text-amber-500 font-bold">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Practice Streak</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{user?.streakDays} <span className="text-xs text-slate-400">Days</span></div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">Active streak</div>
          </div>
        </Card>

        <Card hoverGlow className="flex items-center gap-4 neu-flat">
          <div className="w-12 h-12 rounded-2xl neu-button flex items-center justify-center text-cyan-500 font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Practice Time</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{user?.totalPracticeMinutes} <span className="text-xs text-slate-400">mins</span></div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Across 18 sessions</div>
          </div>
        </Card>

        <Card hoverGlow className="flex items-center gap-4 neu-flat">
          <div className="w-12 h-12 rounded-2xl neu-button flex items-center justify-center text-violet-500 font-bold">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Target Pacing</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{user?.targetWpm} <span className="text-xs text-slate-400">WPM</span></div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Gold standard pace</div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Sessions */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="neu-flat">
            <div className="flex items-center justify-between pb-4 border-b border-white/20 dark:border-white/5">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Recent Speech Sessions</h3>
              </div>
              <Link to="/sessions" className="text-xs text-indigo-600 dark:text-indigo-400 font-extrabold hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800 mt-2">
              {mockSessions.map((session) => (
                <div key={session.id} className="py-4 flex items-center justify-between gap-4 group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl neu-button flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Mic className="w-5 h-5" />
                    </div>
                    <div>
                      <Link to={`/reports/${session.reportId}`} className="font-extrabold text-sm text-slate-900 dark:text-slate-100 hover:text-indigo-600 transition-colors">
                        {session.title}
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                        <span>{session.date}</span>
                        <span>•</span>
                        <span>{Math.floor(session.durationSeconds / 60)}m {session.durationSeconds % 60}s</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={session.overallScore >= 90 ? 'emerald' : session.overallScore >= 80 ? 'indigo' : 'amber'}>
                      Score: {session.overallScore}/100
                    </Badge>
                    <Link to={`/reports/${session.reportId}`}>
                      <Button size="sm" variant="ghost">Report</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Col: Daily Challenge & Achievements */}
        <div className="space-y-8">
          <Card className="neu-flat">
            <div className="flex items-center justify-between pb-3">
              <Badge variant="violet" size="sm">Daily Challenge</Badge>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-mono font-bold">+{mockDailyChallenge.rewardExp} EXP</span>
            </div>
            <h4 className="font-extrabold text-base text-slate-900 dark:text-white">{mockDailyChallenge.title}</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed font-medium">{mockDailyChallenge.description}</p>

            <div className="mt-4 pt-3 border-t border-white/20 dark:border-white/5 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">Category: {mockDailyChallenge.category}</span>
              <Link to="/practice/studio">
                <Button size="sm" variant="primary" className="rounded-full" rightIcon={<Play className="w-3 h-3" />}>
                  Start
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="neu-flat">
            <div className="flex items-center justify-between pb-4 border-b border-white/20 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Achievements</h3>
              </div>
              <Link to="/achievements" className="text-xs text-indigo-600 dark:text-indigo-400 font-extrabold hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3 mt-4">
              {mockAchievements.map((ach) => (
                <div key={ach.id} className="p-3 rounded-2xl neu-pressed flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${ach.unlocked ? 'neu-button text-amber-500' : 'text-slate-400'}`}>
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-extrabold text-slate-900 dark:text-slate-200">{ach.title}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{ach.description}</div>
                  </div>
                  {ach.unlocked && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
