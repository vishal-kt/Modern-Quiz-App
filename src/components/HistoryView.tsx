import React from 'react';
import { History, Award, CheckCircle2, XCircle, Clock, Trash2, BookOpen, RotateCcw, ArrowRight } from 'lucide-react';
import { QuizAttempt } from '../types/quiz';

interface HistoryViewProps {
  attempts: QuizAttempt[];
  onViewAttempt: (attempt: QuizAttempt) => void;
  onRetakeQuiz: (setId: string) => void;
  onDeleteAttempt: (id: string) => void;
  onStartQuiz: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  attempts,
  onViewAttempt,
  onRetakeQuiz,
  onDeleteAttempt,
  onStartQuiz,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Past Quiz Attempts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete log of your timed tests, accuracy scores, and performance history.
          </p>
        </div>

        <button
          onClick={onStartQuiz}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm whitespace-nowrap"
        >
          Take New Quiz
        </button>
      </div>

      <div className="space-y-3">
        {attempts.map(attempt => {
          const minutes = Math.floor(attempt.total_time_seconds / 60);
          const seconds = attempt.total_time_seconds % 60;

          return (
            <div
              key={attempt.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="capitalize font-semibold text-indigo-600 dark:text-indigo-400">
                    {attempt.mode} Mode
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{new Date(attempt.created_at).toLocaleString()}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {attempt.question_set_title}
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400 pt-0.5">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="font-mono tabular-nums">{attempt.correct_answers}</span> Correct
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                    <XCircle className="w-3.5 h-3.5" />
                    <span className="font-mono tabular-nums">{attempt.incorrect_answers}</span> Incorrect
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    <strong className="font-mono text-slate-800 dark:text-slate-200 tabular-nums">
                      {attempt.total_score}
                    </strong> / {attempt.max_score} pts
                  </span>
                </div>
              </div>

              {/* Accuracy Badge & Actions */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className={`text-xl sm:text-2xl font-extrabold font-mono tabular-nums ${
                    attempt.accuracy >= 75
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : attempt.accuracy >= 50
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {attempt.accuracy}%
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Accuracy
                  </div>
                </div>

                <div className="flex items-center gap-1.5 border-l border-slate-100 dark:border-slate-800 pl-3">
                  <button
                    onClick={() => onViewAttempt(attempt)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg transition-colors"
                    title="Review Answers"
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onRetakeQuiz(attempt.question_set_id)}
                    className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Retake Quiz"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteAttempt(attempt.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Delete Attempt Log"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {attempts.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-8">
            <History className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
              No Quiz History Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Take your first timed test to start analyzing your scores and accuracy over time.
            </p>
            <button
              onClick={onStartQuiz}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg"
            >
              Start Practice Test
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
