import React, { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { User, Sliders, CreditCard, Save } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [targetWpm, setTargetWpm] = useState(user?.targetWpm || 145);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ fullName, targetWpm });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Account & Studio Settings</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-medium">Manage profile information, voice acoustic parameters, and billing plan</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Settings */}
        <Card className="space-y-4 neu-flat p-6">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-white/20 dark:border-white/5 pb-3">
            <User className="w-5 h-5 text-indigo-500" />
            <span>Profile Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-sm font-medium focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-2">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-4 py-3 rounded-2xl text-sm font-medium opacity-60 cursor-not-allowed"
              />
            </div>
          </div>
        </Card>

        {/* Acoustic & Speech Preferences */}
        <Card className="space-y-4 neu-flat p-6">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-white/20 dark:border-white/5 pb-3">
            <Sliders className="w-5 h-5 text-violet-500" />
            <span>Acoustic & Speech Preferences</span>
          </h3>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase">Target Speaking Cadence (WPM)</label>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">{targetWpm} WPM</span>
            </div>
            <input
              type="range"
              min="110"
              max="180"
              value={targetWpm}
              onChange={(e) => setTargetWpm(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-xs text-slate-500 font-medium mt-1">Gold standard executive public speaking pace is 130 - 150 WPM.</p>
          </div>
        </Card>

        {/* Plan & Billing */}
        <Card className="space-y-4 neu-flat p-6">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-white/20 dark:border-white/5 pb-3">
            <CreditCard className="w-5 h-5 text-emerald-500" />
            <span>Subscription & Workspace Plan</span>
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-extrabold text-slate-900 dark:text-white text-base">Pro Member Tier</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Unlimited rehearsal sessions, sub-300ms live ASR & LLM coaching.</div>
            </div>
            <Badge variant="emerald">Active</Badge>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />}>
            {isSaved ? 'Settings Saved!' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};
