// src/components/ui/ThemeToggle.tsx
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

/** A universal button component that toggles the global application theme between light and dark modes. */
export default function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`group flex items-center gap-2 rounded-xl p-2 text-xs font-semibold transition-all cursor-pointer ${
        theme === 'dark'
          ? 'bg-white/[0.06] hover:bg-white/[0.12] text-amber-300 border border-white/10'
          : 'bg-slate-100 hover:bg-slate-200 text-blue-600 border border-slate-300'
      } ${className}`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
    >
      {theme === 'light' ? (
        <Moon className="w-4 h-4 transition-transform group-hover:-rotate-12 text-slate-700" />
      ) : (
        <Sun className="w-4 h-4 transition-transform group-hover:rotate-45 text-amber-400" />
      )}
      {showLabel && (
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
          {theme === 'light' ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
}
