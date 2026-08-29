import React, { useState, useEffect, useRef } from 'react';
import { useThemeStore } from '../../stores/useThemeStore';
import { Sun, Moon } from 'lucide-react';

export const FloatingThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();
  const [isVisible, setIsVisible] = useState(true);
  const idleTimerRef = useRef<any>(null);

  const resetIdleTimer = () => {
    setIsVisible(true);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    // Vanish after 3.5 seconds of inactivity
    idleTimerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 3500);
  };

  useEffect(() => {
    // Initial timer on load
    resetIdleTimer();

    const activityEvents = ['mousemove', 'mousedown', 'touchstart', 'touchmove', 'scroll', 'keydown'];
    
    const handleActivity = () => {
      resetIdleTimer();
    };

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleActivity, { passive: true });
    });

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleActivity);
      });
    };
  }, []);

  return (
    <div
      className={`fixed bottom-6 left-6 z-40 transition-all duration-500 transform ${
        isVisible
          ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 scale-90 translate-y-3 pointer-events-none'
      }`}
    >
      <button
        onClick={toggleTheme}
        className="p-3.5 rounded-full neu-button text-slate-700 dark:text-slate-200 hover:scale-110 active:scale-95 transition-transform shadow-xl shadow-indigo-600/10 border border-white/20 dark:border-white/10 backdrop-blur-md"
        title="Toggle Light / Dark Mode"
        aria-label="Toggle Light / Dark Mode"
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 text-amber-400 animate-in spin-in-90 duration-300" />
        ) : (
          <Moon className="w-5 h-5 text-indigo-600 animate-in spin-in-90 duration-300" />
        )}
      </button>
    </div>
  );
};
