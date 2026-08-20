import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { TrendingUp, Zap } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const AnalyticsPage: React.FC = () => {
  const trendData = [
    { week: 'Week 1', score: 72, fillers: 12, wpm: 165 },
    { week: 'Week 2', score: 78, fillers: 8, wpm: 155 },
    { week: 'Week 3', score: 83, fillers: 5, wpm: 148 },
    { week: 'Week 4', score: 89, fillers: 3, wpm: 142 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Speech Analytics & Trends</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-medium">Track long-term rhetorical improvement, pacing consistency, and disfluency reduction</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="space-y-4 neu-flat p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <span>Overall Score Progression</span>
            </h3>
            <Badge variant="emerald">+17% Improvement</Badge>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
                <XAxis dataKey="week" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[60, 100]} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '16px', color: 'var(--text-primary)' }} />
                <Area type="monotone" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="space-y-4 neu-flat p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-rose-500" />
              <span>Filler Word Reduction</span>
            </h3>
            <Badge variant="indigo">-75% Disfluency</Badge>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
                <XAxis dataKey="week" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '16px', color: 'var(--text-primary)' }} />
                <Bar dataKey="fillers" fill="#f43f5e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
