import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useThemeStore } from '../stores/useThemeStore';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import { useAuthStore } from '../stores/useAuthStore';
import {
  Sparkles,
  Zap,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  Moon,
  Sun,
  Lock,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { isAuthenticated } = useAuthStore();
  const { freeAttemptsLeft, maxAttempts, planType, isPro, canProceed, openUpgradeLimitModal } =
    useSubscriptionStore();

  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const samplePrompts = [
    'Will Artificial Intelligence replace traditional education in the next decade?',
    'Pitching a high-growth SaaS startup to tier-1 venture capital partners',
    'Overcoming imposter syndrome and owning your executive voice',
    'How circular economy principles eliminate industrial waste',
    'The psychology of peak performance during high-stakes keynote speeches',
  ];

  const handleNextPrompt = () => {
    setCurrentPromptIndex((prev) => (prev + 1) % samplePrompts.length);
  };

  const handleStartPractice = () => {
    if (!canProceed && !isPro) {
      openUpgradeLimitModal();
      return;
    }
    navigate('/practice/studio');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-200 relative overflow-hidden flex flex-col justify-between p-4 sm:p-6">
      {/* Background Soft Glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[850px] h-[400px] bg-gradient-to-tr from-indigo-500/10 via-violet-500/10 to-cyan-500/10 blur-[140px] pointer-events-none rounded-full" />

      {/* Main Single-Screen Hero Section */}
      <div className="max-w-7xl mx-auto w-full my-auto py-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Focused Value Proposition */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full neu-pressed text-indigo-700 dark:text-indigo-400 text-xs font-extrabold"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Public Speaking Practice & AI Speech Analysis</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]"
            >
              Impromptu Speaking
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-base text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-lg"
            >
              Generate a random prompt, set the 1-minute timer, and speak. Receive instant AI feedback on pacing, filler words, pitch modulation, and confidence. 🎙️
            </motion.p>

            {/* Action Pills */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap items-center gap-3 pt-2"
            >
              <Button
                variant="outline"
                className="rounded-full neu-button text-xs font-extrabold py-2.5 px-5"
                onClick={() => navigate('/practice')}
                leftIcon={<Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
              >
                💡 Structure with PREP
              </Button>

              <Button
                variant="outline"
                className="rounded-full neu-button text-xs font-extrabold py-2.5 px-5"
                onClick={handleStartPractice}
                leftIcon={<Zap className="w-4 h-4 text-amber-500" />}
              >
                ✨ AI Analysis <span className="badge-new ml-1 font-mono">{freeAttemptsLeft}/{maxAttempts}</span>
              </Button>
            </motion.div>
          </div>

          {/* Right Column: Prompt Spin Card */}
          <div className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="p-8 sm:p-10 rounded-3xl neu-flat text-center relative overflow-hidden flex flex-col justify-between min-h-[340px]">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold border-b border-white/20 dark:border-white/5 pb-4">
                  <span className="flex items-center gap-2 font-extrabold text-slate-700 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    RANDOM PROMPT GENERATOR
                  </span>
                  <button
                    onClick={handleNextPrompt}
                    className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-extrabold hover:underline"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Spin Next Topic</span>
                  </button>
                </div>

                {/* Prompt Text */}
                <div className="py-6 my-auto">
                  <h3 className="text-2xl sm:text-3xl font-serif italic text-slate-900 dark:text-slate-100 font-medium leading-relaxed">
                    "{samplePrompts[currentPromptIndex]}"
                  </h3>
                </div>

                {/* Action Button & Subtle Usage Counter Indicator */}
                <div className="pt-4 border-t border-white/20 dark:border-white/5 flex flex-col items-center gap-2">
                  <Button
                    size="lg"
                    variant="primary"
                    className="rounded-full px-8 py-3.5 text-xs font-extrabold shadow-neu-glow w-full sm:w-auto"
                    onClick={handleStartPractice}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Start 1-Min Speech Practice
                  </Button>

                  {/* Subtle Usage Counter Pill */}
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-mono">
                    {isPro ? (
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">✨ Pro Member • Unlimited Practice</span>
                    ) : planType === 'FREESTYLE' ? (
                      <span>Freestyle: <strong className="text-amber-600 dark:text-amber-400">{freeAttemptsLeft}/10 uses remaining</strong></span>
                    ) : (
                      <span>Free uses remaining today: <strong className="text-amber-600 dark:text-amber-400">{freeAttemptsLeft}/3</strong></span>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Left Controls */}
      <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-3">
        <button
          onClick={toggleTheme}
          className="p-3.5 rounded-full neu-button text-slate-700 dark:text-slate-300 hover:scale-110 transition-transform"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
        </button>
        <button
          onClick={() => navigate('/practice')}
          className="p-3.5 rounded-full neu-button text-slate-700 dark:text-slate-300 hover:scale-110 transition-transform"
          title="Help & Guidelines"
        >
          <HelpCircle className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
      </div>
    </div>
  );
};
