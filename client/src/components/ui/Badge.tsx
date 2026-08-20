import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'violet' | 'slate';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'indigo',
  size = 'md',
  className,
  ...props
}) => {
  const base = 'inline-flex items-center font-extrabold rounded-full neu-flat-sm border border-white/20 dark:border-white/5 shadow-sm';

  const variants = {
    indigo: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    rose: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    violet: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30',
    slate: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-3 py-1 text-xs gap-1.5',
  };

  return (
    <span className={twMerge(clsx(base, variants[variant], sizes[size], className))} {...props}>
      {children}
    </span>
  );
};
