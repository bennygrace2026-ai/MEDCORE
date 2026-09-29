import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useSettingsStore, ThemeMode } from '../../store/settingsStore';
import { clsx } from 'clsx';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'button' | 'switch' | 'segmented';
  size?: 'sm' | 'md' | 'lg';
}

export default function ThemeToggle({
  className = '',
  showLabel = false,
  variant = 'button',
  size = 'md'
}: ThemeToggleProps) {
  const { theme, toggleTheme, setTheme } = useSettingsStore();
  const isDark = theme === 'dark';

  if (variant === 'segmented') {
    return (
      <div 
        className={clsx(
          "inline-flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-colors",
          className
        )}
        role="group"
        aria-label="Theme selector"
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={clsx(
            "flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
            !isDark 
              ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/60" 
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          )}
          aria-pressed={!isDark}
        >
          <Sun className="h-3.5 w-3.5 text-amber-500" />
          <span>Light</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={clsx(
            "flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
            isDark 
              ? "bg-zinc-900 text-white shadow-xs border border-zinc-700" 
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          )}
          aria-pressed={isDark}
        >
          <Moon className="h-3.5 w-3.5 text-sky-400" />
          <span>Dark</span>
        </button>
      </div>
    );
  }

  if (variant === 'switch') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={clsx(
          "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900",
          isDark ? "bg-zinc-700" : "bg-zinc-200",
          className
        )}
        role="switch"
        aria-checked={isDark}
        aria-label="Toggle dark mode"
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        <span
          className={clsx(
            "pointer-events-none relative inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out flex items-center justify-center",
            isDark ? "translate-x-5 bg-zinc-900" : "translate-x-0 bg-white"
          )}
        >
          {isDark ? (
            <Moon className="h-3.5 w-3.5 text-sky-400" />
          ) : (
            <Sun className="h-3.5 w-3.5 text-amber-500" />
          )}
        </span>
      </button>
    );
  }

  // Default 'button' variant
  const sizeClasses = {
    sm: "p-1.5 text-xs min-w-[32px] min-h-[32px]",
    md: "p-2 text-sm min-w-[38px] min-h-[38px]",
    lg: "p-2.5 text-base min-w-[44px] min-h-[44px]"
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-4.5 w-4.5",
    lg: "h-5 w-5"
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={clsx(
        "relative inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 select-none",
        "border border-zinc-200/80 bg-zinc-100/80 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900",
        "dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
        "focus:outline-hidden focus:ring-2 focus:ring-red-500/40",
        sizeClasses[size],
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="relative flex items-center justify-center">
        {isDark ? (
          <Sun className={clsx(iconSizes[size], "text-amber-400 transition-transform duration-300 rotate-0 scale-100")} />
        ) : (
          <Moon className={clsx(iconSizes[size], "text-zinc-700 hover:text-zinc-900 transition-transform duration-300 rotate-0 scale-100")} />
        )}
      </div>
      {showLabel && (
        <span className="ml-2 text-xs font-semibold">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}
