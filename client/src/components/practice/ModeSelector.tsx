import React from 'react';
import { PracticeMode } from '../../types';
import { Zap, Target, FileText, Mic, Check } from 'lucide-react';

export interface PracticeModeOption {
  id: PracticeMode;
  title: string;
  shortDesc: string;
  durationLabel: string;
  icon: any;
}

export const PRACTICE_MODES_LIST: PracticeModeOption[] = [
  {
    id: 'ELEVATOR_PITCH',
    title: 'Elevator Pitch',
    shortDesc: 'Concise summary for investors',
    durationLabel: '60-90s',
    icon: Zap,
  },
  {
    id: 'KEYNOTE_PREP',
    title: 'Keynote & Presentation',
    shortDesc: 'Long format presentation',
    durationLabel: '180s',
    icon: Target,
  },
  {
    id: 'INTERVIEW_DRILL',
    title: 'Behavioral Interview',
    shortDesc: 'STAR technique practice',
    durationLabel: '120s',
    icon: FileText,
  },
  {
    id: 'FREE_PRACTICE',
    title: 'Free Practice',
    shortDesc: 'Unscripted rehearsal',
    durationLabel: 'Open',
    icon: Mic,
  },
];

interface ModeSelectorProps {
  selectedMode: PracticeMode;
  onSelectMode: (mode: PracticeMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ selectedMode, onSelectMode }) => {
  return (
    <div className="w-full p-1.5 rounded-full bg-white/90 dark:bg-slate-900 border border-[#eeeab3] dark:border-slate-800 shadow-sm flex items-center justify-between gap-1 overflow-x-auto scrollbar-none">
      {PRACTICE_MODES_LIST.map((m) => {
        const Icon = m.icon;
        const isSelected = selectedMode === m.id;
        return (
          <button
            key={m.id}
            onClick={() => onSelectMode(m.id)}
            className={`flex-1 min-w-[130px] px-3.5 py-2 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              isSelected
                ? 'bg-slate-900 text-white dark:bg-indigo-600 shadow-md scale-[1.02]'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`} />
            <span className="whitespace-nowrap">{m.title}</span>
            {isSelected && <span className="text-[10px] opacity-75 font-mono">({m.durationLabel})</span>}
          </button>
        );
      })}
    </div>
  );
};
