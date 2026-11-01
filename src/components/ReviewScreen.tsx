import React, { useState } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Clock, 
  Filter, 
  RotateCcw,
  LayoutDashboard
} from 'lucide-react';
import { QuizAttempt, CorrectOption, Question } from '../types/quiz';

interface ReviewScreenProps {
  attempt: QuizAttempt;
  questions: Question[];
  onBackToResults: () => void;
  onRetakeQuiz: () => void;
  onReturnDashboard: () => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({
  attempt,
  questions,
  onBackToResults,
  onRetakeQuiz,
  onReturnDashboard,
}) => {
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'unanswered'>('all');

  // Match each response to its full Question definition
  const reviewItems = attempt.responses.map((resp, index) => {
    const question = questions.find(q => q.id === resp.question_id) || {
      id: resp.question_id,
      question_text: `Question #${index + 1}`,
      option_a: 'Option A',
      option_b: 'Option B',
      option_c: 'Option C',
      option_d: 'Option D',
      correct_answer: resp.correct_answer,
    };

    const isUnanswered = !resp.is_answered || resp.selected_answer === null;
    const isCorrect = !isUnanswered && resp.is_correct;
    const isIncorrect = !isUnanswered && !resp.is_correct;

    return {
      index: index + 1,
      response: resp,
      question,
      isUnanswered,
      isCorrect,
      isIncorrect,
    };
  });

  const filteredItems = reviewItems.filter(item => {
    if (filter === 'correct') return item.isCorrect;
    if (filter === 'incorrect') return item.isIncorrect;
    if (filter === 'unanswered') return item.isUnanswered;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <button
            onClick={onBackToResults}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Scorecard</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Detailed Answer Review
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {attempt.question_set_title} · {attempt.correct_answers} correct out of {attempt.total_questions}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRetakeQuiz}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
            <span>Retake</span>
          </button>
          <button
            onClick={onReturnDashboard}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs (Interactive Segmented Control) */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          All Questions ({reviewItems.length})
        </button>

        <button
          onClick={() => setFilter('correct')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            filter === 'correct'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Correct ({attempt.correct_answers})</span>
        </button>

        <button
          onClick={() => setFilter('incorrect')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            filter === 'incorrect'
              ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-500" />
          <span>Incorrect ({attempt.incorrect_answers})</span>
        </button>

        <button
          onClick={() => setFilter('unanswered')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            filter === 'unanswered'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>Unanswered ({attempt.unanswered})</span>
        </button>
      </div>

      {/* Review Cards List */}
      <div className="space-y-4">
        {filteredItems.map(item => {
          const { index, response, question, isUnanswered, isCorrect, isIncorrect } = item;

          const options: { key: CorrectOption; text: string }[] = [
            { key: 'A', text: question.option_a },
            { key: 'B', text: question.option_b },
            { key: 'C', text: question.option_c },
            { key: 'D', text: question.option_d },
          ];

          return (
            <div
              key={question.id || index}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 sm:p-6 transition-all ${
                isCorrect
                  ? 'border-emerald-200 dark:border-emerald-900/60'
                  : isIncorrect
                  ? 'border-rose-200 dark:border-rose-900/60'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Top row: Status indicator + time taken */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-slate-400">
                    Q{index}
                  </span>

                  {isCorrect && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Correct (+1 pt)</span>
                    </span>
                  )}

                  {isIncorrect && (
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      <span>Incorrect (Selected: Option {response.selected_answer})</span>
                    </span>
                  )}

                  {isUnanswered && (
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <HelpCircle className="w-4 h-4" />
                      <span>Unanswered / Time Expired</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono tabular-nums">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{response.time_taken_seconds}s spent</span>
                </div>
              </div>

              {/* Question Text */}
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed mb-4">
                {question.question_text}
              </h2>

              {/* 4 Options Grid with Correct vs User-Selected Visual Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                {options.map(opt => {
                  const isUserSelection = response.selected_answer === opt.key;
                  const isActualAnswer = question.correct_answer === opt.key;

                  let optCardStyle = 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300';
                  let keyBadgeStyle = 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400';

                  if (isActualAnswer) {
                    // Correct Answer
                    optCardStyle = 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 font-semibold ring-1 ring-emerald-500';
                    keyBadgeStyle = 'bg-emerald-600 text-white';
                  } else if (isUserSelection && !isActualAnswer) {
                    // Wrong User Selection
                    optCardStyle = 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 font-semibold ring-1 ring-rose-500';
                    keyBadgeStyle = 'bg-rose-600 text-white';
                  }

                  return (
                    <div
                      key={opt.key}
                      className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${optCardStyle}`}
                    >
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${keyBadgeStyle}`}>
                        {opt.key}
                      </div>

                      <div className="flex-1 text-xs sm:text-sm pt-0.5 leading-snug">
                        {opt.text}
                      </div>

                      {/* State Tags */}
                      {isActualAnswer && (
                        <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                          Correct
                        </span>
                      )}
                      {isUserSelection && !isActualAnswer && (
                        <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-300 shrink-0">
                          Your Choice
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation & Source reference */}
              {(question.explanation || question.exam_reference) && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  {question.exam_reference && (
                    <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                      Exam Source: {question.exam_reference}
                    </div>
                  )}
                  {question.explanation && (
                    <p className="leading-relaxed">
                      <strong className="text-slate-800 dark:text-slate-100 mr-1">Explanation:</strong>
                      {question.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-6 text-slate-500">
            No questions match the filter "{filter}".
          </div>
        )}
      </div>
    </div>
  );
};
