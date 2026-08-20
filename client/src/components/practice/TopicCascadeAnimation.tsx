import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PracticePromptItem } from '../../data/practicePromptsData';
import { ContentApiService } from '../../services/contentApi.service';
import { Sparkles, RefreshCw, Trophy, Target } from 'lucide-react';
import { Button } from '../ui/Button';

interface TopicCascadeAnimationProps {
  promptList: PracticePromptItem[];
  onSelectPrompt: (prompt: PracticePromptItem) => void;
  activeTabLabel?: string;
  categoryFilter?: string;
  difficultyFilter?: string;
  activeType?: 'TOPIC' | 'QUESTION' | 'WORD' | 'CORPORATE_TALK';
}

export const TopicCascadeAnimation: React.FC<TopicCascadeAnimationProps> = ({
  promptList,
  onSelectPrompt,
  activeTabLabel = 'Topics',
  categoryFilter = 'General',
  difficultyFilter = 'Medium',
  activeType = 'TOPIC',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<PracticePromptItem | null>(null);

  const handleStartCascade = async () => {
    if (isLoading) return;

    setIsLoading(true);

    // 1. Call Backend API (MongoDB Cache -> Gemini AI -> Auto Save MongoDB)
    const apiPromise = ContentApiService.getRandomContent(
      activeType,
      categoryFilter,
      difficultyFilter
    );

    // 2. Play animation stream for 2.2 seconds minimum for dramatic effect
    const animationDelay = new Promise((resolve) => setTimeout(resolve, 2200));

    const [resultPrompt] = await Promise.all([apiPromise, animationDelay]);

    setIsLoading(false);

    const finalPrompt = resultPrompt || promptList[0];
    setSelectedPrompt(finalPrompt);
    onSelectPrompt(finalPrompt);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center space-y-4 sm:space-y-6 py-2 sm:py-4">
      {/* Framer Motion Interactive Stage Box */}
      <motion.div
        animate={
          isLoading
            ? { scale: [1, 1.03, 1.02], transition: { repeat: Infinity, duration: 1.2 } }
            : { scale: 1 }
        }
        className="relative w-full max-w-lg h-64 sm:h-72 rounded-3xl bg-[#fcfbdf] dark:bg-slate-950 border border-[#eeeab3] dark:border-slate-800 p-4 sm:p-6 overflow-hidden flex flex-col items-center justify-center shadow-inner"
      >
        {/* Animated Rotating Gradient Glow Overlay during Loading */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, rotate: 360 }}
              exit={{ opacity: 0 }}
              transition={{ rotate: { repeat: Infinity, duration: 3, ease: 'linear' }, opacity: { duration: 0.3 } }}
              className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0_300deg,#6366f1_360deg)] opacity-30 pointer-events-none rounded-full blur-xl"
            />
          )}
        </AnimatePresence>

        {/* Interior Stage Content */}
        <div className="w-full space-y-3 z-10 flex flex-col items-center justify-center relative text-center">
          {isLoading ? (
            /* Framer Motion Rotating Border & Loading Dots */
            <div className="flex flex-col items-center justify-center space-y-3 py-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 flex items-center justify-center shadow-lg"
              >
                <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-500 animate-pulse" />
              </motion.div>

              <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                <span>Generating AI {activeTabLabel} Prompt</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          ) : selectedPrompt ? (
            /* Revealed Content with Scale + Fade + Bounce Animation */
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 15 }}
              animate={{ scale: [0.7, 1.05, 1], opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.175, 0.885, 0.32, 1.275] }}
              className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500 shadow-xl text-center space-y-2 sm:space-y-2.5 w-full max-w-md"
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] sm:text-xs font-black">
                <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                <span>
                  {selectedPrompt.id.length >= 20 || selectedPrompt.id.startsWith('gemini') || selectedPrompt.id.startsWith('cnt') || selectedPrompt.id.startsWith('gen') || selectedPrompt.id.startsWith('w_')
                    ? '✨ AI Prompt Generated & Loaded!'
                    : '🎯 Selected Topic!'}
                </span>
              </div>
              <h3 className="text-sm sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-3">
                "{selectedPrompt.title}"
              </h3>
              <div className="text-[10px] sm:text-[11px] text-slate-500 font-mono">
                Category: {selectedPrompt.category} • Difficulty: {selectedPrompt.difficulty}
              </div>
            </motion.div>
          ) : (
            /* Clean Initial Screen Invitation State */
            <div className="p-4 sm:p-6 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-[#eeeab3] dark:border-slate-800 shadow-sm text-center space-y-2.5 sm:space-y-3 w-full max-w-md">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <Target className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                  Choose {activeTabLabel} Category & Difficulty
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Select your dropdown filters above, then click <strong>'Start Selection'</strong> below to generate a prompt.
                </p>
              </div>
              <div className="pt-0.5 flex items-center justify-center gap-2 text-[10px] sm:text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold font-mono">
                <span>Selected: [{categoryFilter} / {difficultyFilter}]</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Start Selection Action Button */}
      <Button
        size="lg"
        variant="primary"
        onClick={handleStartCascade}
        isLoading={isLoading}
        leftIcon={<RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />}
        className="w-full sm:w-auto px-8 py-3.5 text-sm font-extrabold rounded-full shadow-xl shadow-indigo-600/30 transition-transform active:scale-95"
      >
        {isLoading ? `Generating AI ${activeTabLabel}...` : 'Start Selection'}
      </Button>
    </div>
  );
};
