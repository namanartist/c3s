// src/store/themeStore.ts
import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('c3s-theme');
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  // Default to system preference, or dark if unspecified
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
};

const applyThemeToDOM = (theme: ThemeMode) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }
  try {
    localStorage.setItem('c3s-theme', theme);
  } catch {
    // ignore local storage restrictions
  }
};

export const useThemeStore = create<ThemeState>((set, get) => {
  const initial = getInitialTheme();
  // Apply immediately on store creation
  applyThemeToDOM(initial);

  return {
    theme: initial,
    toggleTheme: () => {
      const next: ThemeMode = get().theme === 'dark' ? 'light' : 'dark';
      applyThemeToDOM(next);
      set({ theme: next });
    },
    setTheme: (theme: ThemeMode) => {
      applyThemeToDOM(theme);
      set({ theme });
    }
  };
});

