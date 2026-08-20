import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  inset?: boolean;
  hoverGlow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  glass = true,
  inset = false,
  hoverGlow = false,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'rounded-3xl p-6 transition-all duration-300',
          inset
            ? 'neu-pressed'
            : 'neu-flat',
          hoverGlow && 'hover:neu-glow hover:-translate-y-1',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
