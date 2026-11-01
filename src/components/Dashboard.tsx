import React from 'react';
import { 
  Play, 
  Upload, 
  CheckCircle2, 
  Target, 
  Award, 
  Clock, 
  FileText, 
  ArrowRight, 
  Sparkles, 
  BarChart3, 
  ChevronRight,
  HelpCircle,
  TrendingUp,
  FolderOpen
} from 'lucide-react';
import { DashboardMetrics } from '../utils/storage';
import { QuestionSet, QuizAttempt } from '../types/quiz';

interface DashboardProps {
  metrics: DashboardMetrics;
  onStartQuiz: (setId?: string) => void;
  onNavigateUpload: () => void;
  onNavigateBank: () => void;
  onNavigateHistory: () => void;
  onViewAttempt: (attempt: QuizAttempt) => void;
  onLoadAttachmentSet: () => void;
  isLoadingAttachment: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  metrics,
  onStartQuiz,
  onNavigateUpload,
  onNavigateBank,
  onNavigateHistory,
  onViewAttempt,
  onLoadAttachmentSet,
  isLoadingAttachment,
}) => {
  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-indigo-200 mb-3 tracking-wide">
            <span>Competitive Exam Engine</span>
            <span aria-hidden="true">·</span>
            <span>RRB NTPC, Group-D, SSC & Railways</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3 text-balance">
            Master Timed Examination Quizzes with 45-Second Precision
          </h1>

          <p className="text-sm sm:text-base text-indigo-100/90 mb-6 leading-relaxed">
            Extract questions from Markdown and PDF exam papers automatically. Test yourself under authentic timed conditions with instant answer keys, detailed explanations, and accuracy tracking.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onStartQuiz()}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-indigo-900 bg-white hover:bg-indigo-50 active:bg-indigo-100 rounded-lg shadow transition-all whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current text-indigo-700" />
              <span>Start Timed Quiz</span>
            </button>

            <button
              onClick={onNavigateUpload}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-700/60 hover:bg-indigo-700 active:bg-indigo-800 border border-indigo-400/30 rounded-lg transition-colors whitespace-nowrap"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Questions (.md / .pdf)</span>
            </button>

            <button
              onClick={onLoadAttachmentSet}
              disabled={isLoadingAttachment}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-indigo-200 hover:text-white bg-indigo-950/40 hover:bg-indigo-950/70 border border-indigo-500/30 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isLoadingAttachment ? 'Importing Railway Paper...' : 'Import Railway Paper Attachment'}</span>
            </button>
          </div>
        </div>

        {/* Subtle decorative background graphic */}
        <div className="absolute -right-8 -bottom-12 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-12 top-10 opacity-10 hidden lg:block pointer-events-none">
          <Clock className="w-64 h-64 text-white" />
        </div>
      </section>

      {/* KPI Cards Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Questions Uploaded */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Question Bank</span>
            <HelpCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-mono tabular-nums">
            {metrics.totalQuestions}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Questions ready to test
          </div>
        </div>

        {/* Quizzes Attempted */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Quizzes Taken</span>
            <BarChart3 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-mono tabular-nums">
            {metrics.totalQuizzesAttempted}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Completed attempts
          </div>
        </div>

        {/* Total Correct Answers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Correct Answers</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
            {metrics.totalCorrectAnswers}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Across all tests
          </div>
        </div>

        {/* Overall Accuracy */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Overall Accuracy</span>
            <Target className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-mono tabular-nums">
            {metrics.overallAccuracy}%
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Target benchmark: &gt;75%
          </div>
        </div>

        {/* Total Points Earned */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Points Earned</span>
            <Award className="w-4 h-4 text-violet-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-violet-600 dark:text-violet-400 font-mono tabular-nums">
            {metrics.totalPointsEarned}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Total cumulative score
          </div>
        </div>
      </section>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2/3): Question Sets Ready for Quiz */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Available Question Sets
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose a question bank to start practicing immediately
              </p>
            </div>
            <button
              onClick={onNavigateBank}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <span>View All ({metrics.recentSets.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {metrics.recentSets.map(set => (
              <div
                key={set.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60 rounded-xl p-5 transition-all shadow-xs group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-medium text-indigo-600 dark:text-indigo-400">{set.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{set.total_questions} Questions</span>
                      <span aria-hidden="true">·</span>
                      <span>Source: {set.source_filename}</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {set.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {set.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onStartQuiz(set.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors whitespace-nowrap"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Take Quiz</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {metrics.recentSets.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-8">
                <FolderOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  No Question Sets Uploaded Yet
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Upload your first Markdown or PDF exam paper to start practicing.
                </p>
                <button
                  onClick={onNavigateUpload}
                  className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg"
                >
                  Upload Questions Now
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Right Column (1/3): Recent Performance & Quick Tips */}
        <section className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                  Recent Quiz History
                </h2>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Performance on latest tests
                </span>
              </div>
              <button
                onClick={onNavigateHistory}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                All Attempts
              </button>
            </div>

            <div className="space-y-3">
              {metrics.recentAttempts.map(attempt => (
                <button
                  key={attempt.id}
                  onClick={() => onViewAttempt(attempt)}
                  className="w-full text-left p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {attempt.question_set_title}
                    </span>
                    <span className={`text-xs font-bold font-mono tabular-nums ${
                      attempt.accuracy >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {attempt.accuracy}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="capitalize">{attempt.mode} Mode</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{attempt.correct_answers}/{attempt.total_questions} Correct</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{Math.round(attempt.total_time_seconds)}s</span>
                  </div>
                </button>
              ))}

              {metrics.recentAttempts.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400">
                  No tests attempted yet. Start your first 45-second quiz!
                </div>
              )}
            </div>
          </div>

          {/* Exam Rules & Time Discipline Box */}
          <div className="bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <span>Exam Simulation Standards</span>
            </div>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span><strong>45s Countdown:</strong> Automatically advances to the next question when time expires.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span><strong>Practice Mode:</strong> Provides instant answer feedback and historical reference solutions.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span><strong>Exam Mode:</strong> Emulates government CBT exams without hints; complete review after final submit.</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};
