import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PracticePromptItem } from '../../data/practicePromptsData';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface SpinWheelProps {
  promptList: PracticePromptItem[];
  onSelectPrompt: (prompt: PracticePromptItem) => void;
  activeTabLabel?: string;
}

const PALETTE_COLORS = [
  '#6366f1', '#4f46e5',
  '#06b6d4', '#0891b2',
  '#10b981', '#059669',
  '#f59e0b', '#d97706',
  '#ec4899', '#db2777',
  '#8b5cf6', '#7c3aed',
];

export const SpinWheel: React.FC<SpinWheelProps> = ({
  promptList,
  onSelectPrompt,
  activeTabLabel = 'Topic',
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedPrompt, setSelectedPrompt] = useState<PracticePromptItem | null>(null);

  const displayList = promptList.length > 0 ? promptList : [];
  const numSlices = Math.max(displayList.length, 1);
  const sliceAngle = 360 / numSlices;

  const handleSpin = () => {
    if (isSpinning || displayList.length === 0) return;

    setIsSpinning(true);
    setSelectedPrompt(null);

    // Pick random index 0..(numSlices - 1)
    const randomIndex = Math.floor(Math.random() * displayList.length);

    // Extra full rotations (5-8 rounds) + angle offset to center slice at top pointer
    const extraRotations = (5 + Math.floor(Math.random() * 3)) * 360;
    const targetSliceAngle = randomIndex * sliceAngle + sliceAngle / 2;
    const finalRotation = rotation + extraRotations + (360 - (targetSliceAngle % 360));

    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const chosenPrompt = displayList[randomIndex];
      setSelectedPrompt(chosenPrompt);
      onSelectPrompt(chosenPrompt);
    }, 3800);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center space-y-5">
      {/* Large SVG Wheel Container (~60% width target) */}
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 flex items-center justify-center">
        {/* Top Pointer Needle */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 drop-shadow-xl">
          <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[28px] border-t-rose-500 animate-bounce" />
        </div>

        {/* Outer Glowing Ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-violet-500 to-amber-400 p-2 shadow-2xl shadow-indigo-500/25">
          <div className="w-full h-full rounded-full bg-slate-950 p-2 relative overflow-hidden flex items-center justify-center">
            {/* SVG Wheel */}
            <motion.svg
              viewBox="0 0 300 300"
              className="w-full h-full rounded-full"
              animate={{ rotate: rotation }}
              transition={{ duration: 3.8, ease: [0.15, 0.85, 0.35, 1.0] }}
            >
              {displayList.map((item, index) => {
                const startAngle = index * sliceAngle;
                const endAngle = (index + 1) * sliceAngle;

                const startRad = (Math.PI * (startAngle - 90)) / 180;
                const endRad = (Math.PI * (endAngle - 90)) / 180;

                const x1 = 150 + 145 * Math.cos(startRad);
                const y1 = 150 + 145 * Math.sin(startRad);
                const x2 = 150 + 145 * Math.cos(endRad);
                const y2 = 150 + 145 * Math.sin(endRad);

                const pathData = `M 150 150 L ${x1} ${y1} A 145 145 0 0 1 ${x2} ${y2} Z`;

                const color = PALETTE_COLORS[index % PALETTE_COLORS.length];

                // Text position angle center
                const midAngleRad = (Math.PI * (startAngle + sliceAngle / 2 - 90)) / 180;
                const textX = 150 + 100 * Math.cos(midAngleRad);
                const textY = 150 + 100 * Math.sin(midAngleRad);

                const truncatedTitle = item.title.length > 18 ? item.title.slice(0, 15) + '...' : item.title;

                return (
                  <g key={item.id}>
                    <path
                      d={pathData}
                      fill={color}
                      stroke="#0f172a"
                      strokeWidth="2"
                    />
                    <text
                      x={textX}
                      y={textY}
                      fontSize="10"
                      fontWeight="bold"
                      fill="#ffffff"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${startAngle + sliceAngle / 2}, ${textX}, ${textY})`}
                    >
                      {truncatedTitle}
                    </text>
                  </g>
                );
              })}
            </motion.svg>

            {/* Center Cap Button */}
            <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-slate-900 border-4 border-slate-700 flex items-center justify-center shadow-inner z-20">
              <Sparkles className={`w-6 h-6 ${isSpinning ? 'text-amber-400 animate-spin' : 'text-indigo-400'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Start Spin Action Button */}
      <Button
        size="lg"
        variant="primary"
        onClick={handleSpin}
        isLoading={isSpinning}
        leftIcon={<RefreshCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />}
        className="px-8 py-3.5 text-sm font-extrabold rounded-full shadow-xl shadow-indigo-600/30"
      >
        {isSpinning ? `Spinning ${activeTabLabel} Wheel...` : 'Start Spin'}
      </Button>

      {/* Selected Indicator */}
      {selectedPrompt && !isSpinning && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center gap-2"
        >
          <span>🎯</span>
          <span>Selected <strong>{selectedPrompt.title}</strong>! View details on the left.</span>
        </motion.div>
      )}
    </div>
  );
};
