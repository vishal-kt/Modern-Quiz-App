import React, { useState } from 'react';
import { X, Play, Clock, Shuffle, ShieldCheck, Zap, BookOpen, AlertCircle } from 'lucide-react';
import { QuestionSet, QuizSettings } from '../types/quiz';

interface QuizConfigModalProps {
  questionSets: QuestionSet[];
  defaultSetId?: string;
  isOpen: boolean;
  onClose: () => void;
  onStartQuiz: (settings: QuizSettings) => void;
}

export const QuizConfigModal: React.FC<QuizConfigModalProps> = ({
  questionSets,
  defaultSetId,
  isOpen,
  onClose,
  onStartQuiz,
}) => {
  const initialSetId = defaultSetId || (questionSets[0]?.id ?? '');

  const [selectedSetId, setSelectedSetId] = useState<string>(initialSetId);
  const [questionCount, setQuestionCount] = useState<number | 'all'>(20);
  const [timerDuration, setTimerDuration] = useState<number>(45); // default 45s per question
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(true);
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(false);
  const [mode, setMode] = useState<'practice' | 'exam'>('practice');
  const [negativeMarking, setNegativeMarking] = useState<boolean>(true);

  if (!isOpen) return null;

  const activeSet = questionSets.find(s => s.id === selectedSetId) || questionSets[0];
  const maxAvailable = activeSet?.total_questions || activeSet?.questions?.length || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSet) return;

    onStartQuiz({
      question_set_id: activeSet.id,
      question_count: questionCount === 'all' ? 'all' : Math.min(questionCount, maxAvailable),
      timer_duration: timerDuration,
      shuffle_questions: shuffleQuestions,
      shuffle_options: shuffleOptions,
      mode: mode,
      negative_marking: mode === 'exam' ? negativeMarking : false,
      negative_mark_value: 0.25,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Configure Quiz & Practice Session
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customize timing, question pool, and examination rules
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Question Set Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Select Question Bank
            </label>
            <select
              value={selectedSetId}
              onChange={e => setSelectedSetId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {questionSets.map(s => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.total_questions} Questions - {s.category})
                </option>
              ))}
            </select>
          </div>

          {/* Mode Selection: Practice vs Exam Mode */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Quiz Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('practice')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  mode === 'practice'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Zap className={`w-4 h-4 ${mode === 'practice' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Practice Mode</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Immediate feedback on every answer, detailed historical explanations, and learning guides.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('exam')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  mode === 'exam'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className={`w-4 h-4 ${mode === 'exam' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Exam Simulation</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Official CBT style. No hints or answers during test. Full answer key & score breakdown at finish.
                </p>
              </button>
            </div>
          </div>

          {/* Number of Questions */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-800 dark:text-slate-200">
                Number of Questions
              </label>
              <span className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                Available in pool: {maxAvailable}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[10, 20, 30, 'all'].map(val => {
                const isSelected = questionCount === val;
                const isOver = typeof val === 'number' && val > maxAvailable;
                return (
                  <button
                    key={String(val)}
                    type="button"
                    disabled={isOver}
                    onClick={() => setQuestionCount(val as number | 'all')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : isOver
                        ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-400'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {val === 'all' ? `All (${maxAvailable})` : `${val} Questions`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Countdown Timer Duration per Question */}
          <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>Timer Per Question</span>
              </label>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                {timerDuration === 0 ? 'Untimed (No limit)' : `${timerDuration} seconds (Standard)`}
              </span>
            </div>

            <input
              type="range"
              min="15"
              max="90"
              step="5"
              value={timerDuration}
              onChange={e => setTimerDuration(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />

            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>15s (Sprint)</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">45s (Default Exam)</span>
              <span>90s (Relaxed)</span>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2.5 pt-1 text-xs">
            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5">
                <Shuffle className="w-3.5 h-3.5 text-slate-400" />
                <span>Shuffle Question Order</span>
              </span>
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={e => setShuffleQuestions(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded-sm focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5">
                <Shuffle className="w-3.5 h-3.5 text-slate-400" />
                <span>Shuffle Answer Options (A, B, C, D)</span>
              </span>
              <input
                type="checkbox"
                checked={shuffleOptions}
                onChange={e => setShuffleOptions(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded-sm focus:ring-indigo-500"
              />
            </label>

            {mode === 'exam' && (
              <label className="flex items-center justify-between cursor-pointer py-1 border-t border-slate-100 dark:border-slate-800 pt-2">
                <div>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Apply Negative Marking (-0.25)
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Standard for RRB & SSC Government tests (0 for unanswered)
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={negativeMarking}
                  onChange={e => setNegativeMarking(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded-sm focus:ring-indigo-500"
                />
              </label>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-all whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start {mode === 'practice' ? 'Practice' : 'Exam'} Now</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
