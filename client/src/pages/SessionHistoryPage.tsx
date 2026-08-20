import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockSessions } from '../services/api';
import { Mic, Search, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const SessionHistoryPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const filteredSessions = mockSessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Practice History</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-medium">Review and compare your past speech rehearsal reports</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sessions..."
              className="pl-10 pr-4 py-2.5 rounded-2xl text-xs font-medium focus:outline-none"
            />
          </div>
        </div>
      </div>

      <Card className="neu-flat p-6 divide-y divide-slate-200 dark:divide-slate-800">
        {filteredSessions.map((session) => (
          <div key={session.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl neu-button flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">{session.title}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-1">
                  <span>{session.date}</span>
                  <span>•</span>
                  <span>{session.mode}</span>
                  <span>•</span>
                  <span>{Math.floor(session.durationSeconds / 60)}m {session.durationSeconds % 60}s</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant={session.overallScore >= 90 ? 'emerald' : session.overallScore >= 80 ? 'indigo' : 'amber'}>
                Score: {session.overallScore}/100
              </Badge>
              <Link to={`/reports/${session.reportId}`}>
                <Button size="sm" variant="outline" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  View Analysis
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};
