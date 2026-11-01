import React from 'react';
import { Sun, Moon, Sparkles, BookOpen, Upload, History, LayoutDashboard, Play } from 'lucide-react';

interface TopNavProps {
  currentView: 'dashboard' | 'bank' | 'upload' | 'history' | 'quiz' | 'results' | 'review';
  onNavigate: (view: 'dashboard' | 'bank' | 'upload' | 'history') => void;
  onStartQuizClick: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentView,
  onNavigate,
  onStartQuizClick,
  isDarkMode,
  onToggleDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Single element brand wordmark */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 text-left focus:outline-none group shrink-0"
        >
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:bg-indigo-700 transition-colors">
            SQ
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              SmartQuiz
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 -mt-0.5 whitespace-nowrap">
              RRB & Govt. Exam Practice
            </span>
          </div>
        </button>

        {/* Zone 2: 4 single-line text navigation links with subtle underline/active state */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'dashboard'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onNavigate('bank')}
            className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'bank'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Question Bank</span>
          </button>

          <button
            onClick={() => onNavigate('upload')}
            className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'upload'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Questions</span>
          </button>

          <button
            onClick={() => onNavigate('history')}
            className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'history'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Past Quizzes</span>
          </button>
        </nav>

        {/* Zone 3: Primary action + Theme Switch */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleDarkMode}
            aria-label="Toggle color theme"
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onStartQuizClick}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-all whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Quiz</span>
          </button>
        </div>
      </div>
    </header>
  );
};
