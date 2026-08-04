import React from 'react';
import { Search, Bell, Sparkles, Moon, Sun, Layers, HelpCircle } from 'lucide-react';

interface HeaderProps {
  onOpenCommandPalette: () => void;
  onToggleAIAssistant: () => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  activeTabTitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCommandPalette,
  onToggleAIAssistant,
  darkMode,
  setDarkMode,
  activeTabTitle
}) => {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Title Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
          <Layers className="w-4 h-4 text-indigo-500" />
          <span>Ethara HQ</span>
          <span>/</span>
        </div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tight">
          {activeTabTitle}
        </h1>
      </div>

      {/* Center Floating Command Palette Trigger */}
      <div className="flex-1 max-w-xl mx-8 hidden sm:block">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-4 py-2 text-sm text-slate-400 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400" />
            <span className="truncate">Search employees, seats, projects, floors, zones...</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </button>
      </div>

      {/* Right Controls & AI Trigger */}
      <div className="flex items-center gap-3">
        {/* Mobile Search Button */}
        <button
          onClick={onOpenCommandPalette}
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg sm:hidden"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* AI Assistant Button */}
        <button
          onClick={onToggleAIAssistant}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 hover:opacity-95 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span className="hidden md:inline">Ask Ethara AI</span>
        </button>
      </div>
    </header>
  );
};
