import React from 'react';
import { mockAchievements } from '../services/api';
import { Award } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const AchievementsPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Public Speaking Badges & Achievements</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-medium">Unlock badges by hitting public speaking consistency milestones</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockAchievements.map((ach) => (
          <Card key={ach.id} className="neu-flat p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${ach.unlocked ? 'neu-button text-amber-500 shadow-neu-glow' : 'neu-pressed text-slate-400'}`}>
                  <Award className="w-6 h-6" />
                </div>
                {ach.unlocked ? (
                  <Badge variant="emerald">Unlocked</Badge>
                ) : (
                  <Badge variant="slate">{ach.progress}% Progress</Badge>
                )}
              </div>

              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{ach.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed font-medium">{ach.description}</p>
            </div>

            {!ach.unlocked && (
              <div className="w-full neu-pressed rounded-full h-2 mt-4 overflow-hidden p-0.5">
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 h-full rounded-full" style={{ width: `${ach.progress}%` }} />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
