import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const DailyDrillsPage: React.FC = () => {
  const drills = [
    {
      id: 'd1',
      title: 'Pause Mastery Drill',
      category: 'Pause Control',
      duration: '3 Mins',
      exp: 150,
      desc: 'Deliver a short elevator pitch while holding a 2-second silent pause after every key assertion.',
    },
    {
      id: 'd2',
      title: 'Pitch Modulation Peak',
      category: 'Vocal Variety',
      duration: '5 Mins',
      exp: 200,
      desc: 'Practice altering vocal pitch by 20% when emphasizing numerical growth metrics.',
    },
    {
      id: 'd3',
      title: 'Zero Disfluency Challenge',
      category: 'Filler Control',
      duration: '2 Mins',
      exp: 250,
      desc: 'Speak continuously for 120 seconds without uttering "um", "ah", or "like".',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Targeted Practice Drills</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-medium">Short micro-exercises tailored to refine specific acoustic speaking dimensions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {drills.map((drill) => (
          <Card key={drill.id} hoverGlow className="neu-flat flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Badge variant="indigo">{drill.category}</Badge>
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">+{drill.exp} EXP</span>
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">{drill.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed font-medium">{drill.desc}</p>
            </div>

            <div className="pt-3 border-t border-white/20 dark:border-white/5 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono font-medium">Time: {drill.duration}</span>
              <Link to="/practice/studio">
                <Button size="sm" variant="primary" rightIcon={<Play className="w-3.5 h-3.5" />}>
                  Start Drill
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
