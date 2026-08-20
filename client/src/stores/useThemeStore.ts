import { create } from 'zustand';

type ThemeMode = 'dark' | 'light';

interface ThemeState {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const getInitialTheme = (): ThemeMode => {
  const saved = localStorage.getItem('speakwise_theme') as ThemeMode | null;
  if (saved === 'dark' || saved === 'light') return saved;
  return 'light';
};

const applyThemeToDocument = (theme: ThemeMode) => {
  if (typeof document !== 'undefined') {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};

const initialTheme = getInitialTheme();
applyThemeToDocument(initialTheme);

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initialTheme,
  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('speakwise_theme', nextTheme);
      applyThemeToDocument(nextTheme);
      return { theme: nextTheme };
    }),
  setTheme: (theme) => {
    localStorage.setItem('speakwise_theme', theme);
    applyThemeToDocument(theme);
    set({ theme });
  },
}));

