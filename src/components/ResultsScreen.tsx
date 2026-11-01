import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Clock, 
  Target, 
  RotateCcw, 
  BookOpen, 
  LayoutDashboard, 
  Award,
  Zap,
  BarChart3
} from 'lucide-react';
import { QuizAttempt } from '../types/quiz';

interface ResultsScreenProps {
  attempt: QuizAttempt;
  onReviewAnswers: () => void;
  onRetakeQuiz: () => void;
  onReturnDashboard: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  attempt,
  onReviewAnswers,
  onRetakeQuiz,
  onReturnDashboard,
}) => {
  useEffect(() => {
    // Fire confetti if accuracy >= 60%
    if (attempt.accuracy >= 60) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [attempt.accuracy]);

  const minutes = Math.floor(attempt.total_time_seconds / 60);
  const seconds = attempt.total_time_seconds % 60;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Hero Performance Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="space-y-2 max-w-lg">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-200 tracking-wider uppercase">
              <span>{attempt.mode === 'practice' ? 'Practice Complete' : 'Official CBT Exam Submitted'}</span>
              <span aria-hidden="true">·</span>
              <span>{attempt.question_set_title}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {attempt.accuracy >= 80 ? 'Outstanding Performance!' : attempt.accuracy >= 60 ? 'Great Job! Solid Foundation' : 'Quiz Completed - Keep Practicing!'}
            </h1>

            <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
              You scored <span className="font-bold text-white font-mono tabular-nums">{attempt.total_score} points</span> out of <span className="font-bold text-white font-mono tabular-nums">{attempt.max_score}</span> with an accuracy of <span className="font-bold text-emerald-300 font-mono tabular-nums">{attempt.accuracy}%</span>.
            </p>
          </div>

          {/* Large Accuracy Radial Badge */}
          <div className="flex flex-col items-center justify-center p-6 bg-white/10 backdrop-blur rounded-2xl border border-white/15 shrink-0 w-44">
            <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white tabular-nums">
              {attempt.accuracy}%
            </div>
            <div className="text-xs text-indigo-200 font-medium mt-1">Accuracy</div>
            <div className="text-[11px] text-indigo-300/80 font-mono mt-0.5 tabular-nums">
              {attempt.correct_answers} of {attempt.total_questions} Correct
            </div>
          </div>
        </div>

        {/* Ambient glow */}
        <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* 8 Detailed Score KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Questions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            Total Questions
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {attempt.total_questions}
          </div>
        </div>

        {/* Correct Answers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Correct</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            {attempt.correct_answers}
          </div>
        </div>

        {/* Incorrect Answers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>Incorrect</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
            {attempt.incorrect_answers}
          </div>
        </div>

        {/* Unanswered */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Unanswered</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-700 dark:text-slate-300 tabular-nums">
            {attempt.unanswered}
          </div>
        </div>

        {/* Total Points */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-violet-500" />
            <span>Final Score</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-violet-600 dark:text-violet-400 tabular-nums">
            {attempt.total_score}
          </div>
        </div>

        {/* Accuracy */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-amber-500" />
            <span>Accuracy</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
            {attempt.accuracy}%
          </div>
        </div>

        {/* Total Time */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>Total Time</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`}
          </div>
        </div>

        {/* Avg Time / Question */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-cyan-500" />
            <span>Avg / Question</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {attempt.average_time_per_question}s
          </div>
        </div>
      </div>

      {/* Visual Question Distribution Progress Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between text-xs">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            <span>Performance Distribution Breakdown</span>
          </h3>
          <span className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            {attempt.total_questions} Questions Evaluated
          </span>
        </div>

        {/* Multi-segmented distribution bar */}
        <div className="w-full h-4 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
          <div
            style={{ width: `${(attempt.correct_answers / attempt.total_questions) * 100}%` }}
            className="bg-emerald-500 h-full transition-all"
            title={`Correct: ${attempt.correct_answers}`}
          />
          <div
            style={{ width: `${(attempt.incorrect_answers / attempt.total_questions) * 100}%` }}
            className="bg-rose-500 h-full transition-all"
            title={`Incorrect: ${attempt.incorrect_answers}`}
          />
          <div
            style={{ width: `${(attempt.unanswered / attempt.total_questions) * 100}%` }}
            className="bg-slate-300 dark:bg-slate-600 h-full transition-all"
            title={`Unanswered: ${attempt.unanswered}`}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs pt-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              Correct: <strong className="font-mono tabular-nums">{attempt.correct_answers}</strong> ({Math.round((attempt.correct_answers / attempt.total_questions) * 100)}%)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-rose-500" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              Incorrect: <strong className="font-mono tabular-nums">{attempt.incorrect_answers}</strong> ({Math.round((attempt.incorrect_answers / attempt.total_questions) * 100)}%)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-slate-300 dark:bg-slate-600" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              Unanswered: <strong className="font-mono tabular-nums">{attempt.unanswered}</strong> ({Math.round((attempt.unanswered / attempt.total_questions) * 100)}%)
            </span>
          </div>
        </div>
      </div>

      {/* 3 Prominent Required Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <button
          onClick={onReviewAnswers}
          className="flex items-center justify-center gap-2 py-3 px-5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm transition-all cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
          <span>Review Answers</span>
        </button>

        <button
          onClick={onRetakeQuiz}
          className="flex items-center justify-center gap-2 py-3 px-5 text-sm font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-indigo-500" />
          <span>Retake Quiz</span>
        </button>

        <button
          onClick={onReturnDashboard}
          className="flex items-center justify-center gap-2 py-3 px-5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
};
