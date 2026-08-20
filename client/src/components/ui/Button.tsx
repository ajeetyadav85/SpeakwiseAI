import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-2xl transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none active:neu-pressed';

  const variants = {
    primary: 'bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-neu-glow border border-indigo-400/30 neu-button',
    secondary: 'neu-button text-slate-800 dark:text-slate-100 font-semibold',
    outline: 'neu-pressed text-slate-700 dark:text-slate-200 hover:neu-button',
    ghost: 'bg-transparent hover:neu-button text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400',
    danger: 'bg-gradient-to-br from-rose-600 to-red-600 text-white shadow-lg shadow-rose-600/30 border border-rose-400/30 neu-button',
    glass: 'neu-button text-slate-800 dark:text-white',
  };

  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs gap-1.5 rounded-xl',
    md: 'px-5 py-2.5 text-sm gap-2 rounded-2xl',
    lg: 'px-7 py-3.5 text-base gap-2.5 rounded-3xl',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : leftIcon}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
