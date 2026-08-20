import React from 'react';
import { Users } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const AdminDashboardPage: React.FC = () => {
  const usersList = [
    { id: '1', name: 'Executive Elena', email: 'elena@enterprise.com', role: 'ORG_ADMIN', sessions: 42, lastActive: '2 mins ago' },
    { id: '2', name: 'Sales Rep Sam', email: 'sam@techsales.io', role: 'PRO_USER', sessions: 28, lastActive: '1 hour ago' },
    { id: '3', name: 'ESL Learner Lin', email: 'lin@global.org', role: 'PRO_USER', sessions: 19, lastActive: '3 hours ago' },
    { id: '4', name: 'Campus Chris', email: 'chris@edu.ac', role: 'FREE_USER', sessions: 5, lastActive: '1 day ago' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">System Admin & Telemetry</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-medium">Platform management, AI API quota usage, and user roles</p>
        </div>
        <Badge variant="emerald">All Systems Operational</Badge>
      </div>

      {/* Metric Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card hoverGlow className="neu-flat p-6">
          <div className="text-xs font-extrabold text-slate-500 uppercase">Active Users</div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">1,420</div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">+12% this month</div>
        </Card>

        <Card hoverGlow className="neu-flat p-6">
          <div className="text-xs font-extrabold text-slate-500 uppercase">Total Sessions Streamed</div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">14,890</div>
          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-1">4,200 Audio Hours</div>
        </Card>

        <Card hoverGlow className="neu-flat p-6">
          <div className="text-xs font-extrabold text-slate-500 uppercase">Avg ASR Stream Latency</div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">245ms</div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">Deepgram Nova-2 Engine</div>
        </Card>
      </div>

      {/* User Management Table */}
      <Card className="neu-flat p-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/20 dark:border-white/5">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            <span>Registered Organization Users</span>
          </h3>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead className="neu-pressed text-slate-700 dark:text-slate-300 uppercase font-mono border-b border-white/20 dark:border-white/5">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Sessions</th>
                <th className="p-3">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-slate-800 dark:text-slate-300">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:neu-pressed">
                  <td className="p-3 font-bold text-slate-900 dark:text-white">{u.name}</td>
                  <td className="p-3 text-slate-500">{u.email}</td>
                  <td className="p-3">
                    <Badge variant={u.role === 'ORG_ADMIN' ? 'violet' : u.role === 'PRO_USER' ? 'indigo' : 'slate'}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="p-3 font-bold">{u.sessions}</td>
                  <td className="p-3 text-slate-500">{u.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
