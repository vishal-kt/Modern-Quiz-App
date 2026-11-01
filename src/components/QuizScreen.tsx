import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Clock, 
  Pause, 
  Play, 
  ChevronRight, 
  ChevronLeft, 
  Bookmark, 
  BookmarkCheck, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  AlertCircle, 
  Send,
  RotateCcw,
  Menu,
  X
} from 'lucide-react';
import { Question, QuestionSet, QuizSettings, CorrectOption, QuestionResponse, QuizAttempt, ShuffledQuestion } from '../types/quiz';

interface QuizScreenProps {
  questionSet: QuestionSet;
  settings: QuizSettings;
  onFinishQuiz: (attempt: QuizAttempt) => void;
  onExitQuiz: () => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({
  questionSet,
  settings,
  onFinishQuiz,
  onExitQuiz,
}) => {
  // 1. Prepare questions (slice, shuffle questions & options)
  const [shuffledList, setShuffledList] = useState<ShuffledQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  
  // Timer state
  const timerDurationSec = settings.timer_duration; // e.g. 45
  const [timeLeft, setTimeLeft] = useState<number>(timerDurationSec);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const timerDeadlineRef = useRef<number>(Date.now() + timerDurationSec * 1000);
  const questionStartTimeRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<any>(null);

  // Overall quiz timer
  const quizStartTimeRef = useRef<number>(Date.now());
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState<number>(0);

  // Practice mode instant feedback state for current question
  const [practiceAnswerRevealed, setPracticeAnswerRevealed] = useState<boolean>(false);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<any>(null);

  // Question navigation palette drawer (for mobile/tablet)
  const [paletteOpen, setPaletteOpen] = useState<boolean>(false);

  // Confirmation modal for submission
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);

  // Initialize questions on mount
  useEffect(() => {
    let rawQuestions = [...questionSet.questions];

    // Shuffle questions if requested
    if (settings.shuffle_questions) {
      for (let i = rawQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rawQuestions[i], rawQuestions[j]] = [rawQuestions[j], rawQuestions[i]];
      }
    }

    // Limit count if requested
    if (typeof settings.question_count === 'number') {
      rawQuestions = rawQuestions.slice(0, settings.question_count);
    }

    // Prepare options with shuffling if enabled
    const prepared: ShuffledQuestion[] = rawQuestions.map(q => {
      const originalOptions: { originalKey: CorrectOption; text: string }[] = [
        { originalKey: 'A', text: q.option_a },
        { originalKey: 'B', text: q.option_b },
        { originalKey: 'C', text: q.option_c },
        { originalKey: 'D', text: q.option_d },
      ];

      if (settings.shuffle_options) {
        for (let i = originalOptions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [originalOptions[i], originalOptions[j]] = [originalOptions[j], originalOptions[i]];
        }
      }

      const displayKeys: CorrectOption[] = ['A', 'B', 'C', 'D'];
      const displayOptions = originalOptions.map((opt, i) => ({
        key: displayKeys[i],
        text: opt.text,
        originalKey: opt.originalKey,
      }));

      // Find which display key corresponds to original correct answer
      const correctOpt = displayOptions.find(opt => opt.originalKey === q.correct_answer);
      const correctDisplayKey = correctOpt ? correctOpt.key : 'A';

      return {
        originalQuestion: q,
        displayQuestionText: q.question_text,
        displayOptions,
        correctDisplayKey,
      };
    });

    setShuffledList(prepared);

    // Initial empty responses for all questions
    const initialResponses: QuestionResponse[] = prepared.map(item => ({
      question_id: item.originalQuestion.id,
      selected_answer: null,
      selected_display_key: null,
      correct_answer: item.originalQuestion.correct_answer,
      is_correct: false,
      time_taken_seconds: 0,
      is_answered: false,
      marked_for_review: false,
    }));

    setResponses(initialResponses);
    quizStartTimeRef.current = Date.now();
  }, [questionSet, settings]);

  const currentQ = shuffledList[currentIndex];
  const currentResp = responses[currentIndex];

  // Helper to handle timer expiry (automatically mark as unanswered and advance)
  const handleTimeExpired = useCallback(() => {
    if (!currentQ || !currentResp) return;

    // If question wasn't answered, mark response with time spent
    const timeSpent = timerDurationSec;
    setResponses(prev => {
      const copy = [...prev];
      if (!copy[currentIndex].is_answered) {
        copy[currentIndex] = {
          ...copy[currentIndex],
          time_taken_seconds: timeSpent,
          is_answered: false,
        };
      }
      return copy;
    });

    // Move to next question or end
    if (currentIndex < shuffledList.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Last question finished
      completeQuiz();
    }
  }, [currentIndex, currentQ, currentResp, shuffledList.length, timerDurationSec]);

  // Reset timer on question change
  useEffect(() => {
    if (timerDurationSec === 0 || isPaused) return;

    setTimeLeft(timerDurationSec);
    timerDeadlineRef.current = Date.now() + timerDurationSec * 1000;
    questionStartTimeRef.current = Date.now();
    setPracticeAnswerRevealed(false);

    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      setAutoAdvanceTimer(null);
    }

    clearInterval(timerIntervalRef.current);

    timerIntervalRef.current = setInterval(() => {
      const remainingMs = timerDeadlineRef.current - Date.now();
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
      setTimeLeft(remainingSec);

      if (remainingSec <= 0) {
        clearInterval(timerIntervalRef.current);
        handleTimeExpired();
      }
    }, 200);

    return () => {
      clearInterval(timerIntervalRef.current);
    };
  }, [currentIndex, timerDurationSec, isPaused, handleTimeExpired]);

  // Overall timer tracking
  useEffect(() => {
    const elapsedInterval = setInterval(() => {
      if (!isPaused) {
        setTotalElapsedSeconds(Math.floor((Date.now() - quizStartTimeRef.current) / 1000));
      }
    }, 1000);

    return () => clearInterval(elapsedInterval);
  }, [isPaused]);

  // Handle Pause / Resume
  const togglePause = () => {
    if (isPaused) {
      // Resume
      timerDeadlineRef.current = Date.now() + timeLeft * 1000;
      setIsPaused(false);
    } else {
      // Pause
      clearInterval(timerIntervalRef.current);
      setIsPaused(true);
    }
  };

  // Option selection
  const handleSelectOption = (displayKey: CorrectOption) => {
    if (!currentQ || isPaused) return;

    // In practice mode, if already revealed, prevent re-selection
    if (settings.mode === 'practice' && practiceAnswerRevealed) return;

    const chosenOption = currentQ.displayOptions.find(o => o.key === displayKey);
    if (!chosenOption) return;

    const originalKey = chosenOption.originalKey;
    const isCorrect = originalKey === currentQ.originalQuestion.correct_answer;
    const timeSpent = Math.max(1, Math.min(timerDurationSec, Math.round((Date.now() - questionStartTimeRef.current) / 1000)));

    setResponses(prev => {
      const copy = [...prev];
      copy[currentIndex] = {
        ...copy[currentIndex],
        selected_answer: originalKey,
        selected_display_key: displayKey,
        is_correct: isCorrect,
        time_taken_seconds: timeSpent,
        is_answered: true,
      };
      return copy;
    });

    if (settings.mode === 'practice') {
      setPracticeAnswerRevealed(true);
      // Stop timer for current question
      clearInterval(timerIntervalRef.current);
    }
  };

  // Toggle Mark for Review
  const toggleMarkForReview = () => {
    setResponses(prev => {
      const copy = [...prev];
      copy[currentIndex] = {
        ...copy[currentIndex],
        marked_for_review: !copy[currentIndex].marked_for_review,
      };
      return copy;
    });
  };

  // Navigation: Next / Prev
  const goToNext = () => {
    if (currentIndex < shuffledList.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setShowSubmitModal(true);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const jumpToQuestion = (idx: number) => {
    setCurrentIndex(idx);
    setPaletteOpen(false);
  };

  // Complete Quiz & Compute Final Attempt
  const completeQuiz = () => {
    clearInterval(timerIntervalRef.current);

    const totalQuestions = responses.length;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    responses.forEach(r => {
      if (!r.is_answered || r.selected_answer === null) {
        unansweredCount++;
      } else if (r.is_correct) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    // Score calculation
    let totalScore = correctCount;
    if (settings.mode === 'exam' && settings.negative_marking) {
      totalScore -= incorrectCount * settings.negative_mark_value;
    }
    // Floor score to 0 or allow negative? Standard exams allow negative or round to 2 decimals
    const roundedScore = Math.max(0, Math.round(totalScore * 100) / 100);
    const attemptedCount = correctCount + incorrectCount;
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const totalTimeSec = totalElapsedSeconds || Math.floor((Date.now() - quizStartTimeRef.current) / 1000);
    const avgTime = totalQuestions > 0 ? Math.round((totalTimeSec / totalQuestions) * 10) / 10 : 0;

    const attempt: QuizAttempt = {
      id: 'att_' + Date.now().toString(36),
      question_set_id: questionSet.id,
      question_set_title: questionSet.title,
      mode: settings.mode,
      total_questions: totalQuestions,
      correct_answers: correctCount,
      incorrect_answers: incorrectCount,
      unanswered: unansweredCount,
      total_score: roundedScore,
      max_score: totalQuestions,
      accuracy,
      total_time_seconds: totalTimeSec,
      average_time_per_question: avgTime,
      created_at: new Date().toISOString(),
      negative_marking: settings.mode === 'exam' ? settings.negative_marking : false,
      responses,
    };

    onFinishQuiz(attempt);
  };

  if (!currentQ || !currentResp) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        Preparing examination engine...
      </div>
    );
  }

  // Calculate live stats
  const answeredCount = responses.filter(r => r.is_answered).length;
  const currentLiveScore = responses.filter(r => r.is_correct).length;
  const progressPercent = Math.round(((currentIndex + 1) / shuffledList.length) * 100);

  // Timer urgency style
  const isTimerUrgent = timeLeft <= 10 && timeLeft > 0;
  const isTimerCritical = timeLeft <= 5 && timeLeft > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-12 select-none">
      {/* Top Distraction-Free Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-sm">
                {questionSet.title}
              </span>
              <span aria-hidden="true">·</span>
              <span className="capitalize font-medium text-indigo-600 dark:text-indigo-400">
                {settings.mode} Mode
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                Question {currentIndex + 1} of {shuffledList.length}
              </span>
            </div>
          </div>
        </div>

        {/* Live Metrics: Timer + Score + Controls */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Prominent Question Timer */}
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border transition-colors ${
            isTimerCritical
              ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 animate-pulse'
              : isTimerUrgent
              ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
          }`}>
            <Clock className={`w-4 h-4 ${isTimerCritical ? 'text-rose-600' : 'text-slate-500 dark:text-slate-400'}`} />
            <div className="text-right">
              <div className="text-xs sm:text-sm font-bold font-mono tabular-nums">
                00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
              </div>
            </div>
          </div>

          {/* Current Score Pill */}
          <div className="hidden sm:flex flex-col text-right px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Score</span>
            <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              +{currentLiveScore} pts
            </span>
          </div>

          {/* Pause Button */}
          <button
            onClick={togglePause}
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title={isPaused ? 'Resume Quiz' : 'Pause Quiz'}
          >
            {isPaused ? <Play className="w-4 h-4 fill-current text-emerald-600" /> : <Pause className="w-4 h-4" />}
          </button>

          {/* Question Palette Toggle */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Menu className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Grid</span>
            <span className="font-mono tabular-nums">({answeredCount}/{shuffledList.length})</span>
          </button>

          {/* End Test Button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900 transition-colors whitespace-nowrap"
          >
            Submit
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-indigo-600 h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Question Workspace Card */}
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* Pause Overlay */}
        {isPaused && (
          <div className="absolute inset-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Pause className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quiz Paused</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                The timer is halted. Take a breath and click resume when ready.
              </p>
            </div>
            <button
              onClick={togglePause}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume Quiz</span>
            </button>
          </div>
        )}

        {/* Question Header & Meta */}
        <div className="flex items-center justify-between gap-4 mb-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            {currentQ.originalQuestion.exam_reference ? (
              <span className="font-medium text-slate-600 dark:text-slate-300">
                {currentQ.originalQuestion.exam_reference}
              </span>
            ) : (
              <span>Single Choice Question</span>
            )}
            <span aria-hidden="true">·</span>
            <span>+1 mark</span>
            {settings.mode === 'exam' && settings.negative_marking && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-rose-500">-0.25 negative</span>
              </>
            )}
          </div>

          <button
            onClick={toggleMarkForReview}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors ${
              currentResp.marked_for_review
                ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {currentResp.marked_for_review ? (
              <BookmarkCheck className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <Bookmark className="w-3.5 h-3.5" />
            )}
            <span>{currentResp.marked_for_review ? 'Marked for Review' : 'Mark for Review'}</span>
          </button>
        </div>

        {/* Question Text */}
        <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed mb-8">
          {currentQ.displayQuestionText}
        </div>

        {/* 4 Options Grid */}
        <div className="space-y-3 mb-8">
          {currentQ.displayOptions.map(option => {
            const isSelected = currentResp.selected_display_key === option.key;
            const isOptionCorrect = option.key === currentQ.correctDisplayKey;

            // In Practice Mode styling
            let optionStyle = 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200';
            let badgeStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';

            if (settings.mode === 'practice' && practiceAnswerRevealed) {
              if (isOptionCorrect) {
                // Correct answer (green)
                optionStyle = 'border-emerald-500 dark:border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 font-medium ring-1 ring-emerald-500';
                badgeStyle = 'bg-emerald-600 text-white';
              } else if (isSelected && !isOptionCorrect) {
                // Wrong selection (red)
                optionStyle = 'border-rose-500 dark:border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 font-medium ring-1 ring-rose-500';
                badgeStyle = 'bg-rose-600 text-white';
              } else {
                optionStyle = 'opacity-60 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50';
              }
            } else if (isSelected) {
              // Exam mode selection
              optionStyle = 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 font-semibold ring-2 ring-indigo-500/20';
              badgeStyle = 'bg-indigo-600 text-white';
            }

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => handleSelectOption(option.key)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 group cursor-pointer ${optionStyle}`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${badgeStyle}`}>
                  {option.key}
                </div>

                <div className="flex-1 text-sm sm:text-base pt-0.5 leading-snug">
                  {option.text}
                </div>

                {/* Practice Mode Feedback Glyphs */}
                {settings.mode === 'practice' && practiceAnswerRevealed && (
                  <div className="shrink-0 mt-0.5">
                    {isOptionCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    )}
                    {isSelected && !isOptionCorrect && (
                      <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Practice Mode Immediate Feedback & Explanation Card */}
        {settings.mode === 'practice' && practiceAnswerRevealed && (
          <div className={`p-5 rounded-xl border mb-8 transition-all ${
            currentResp.is_correct
              ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
          }`}>
            <div className="flex items-center gap-2 mb-2 font-bold text-sm">
              {currentResp.is_correct ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-800 dark:text-emerald-300">Correct Answer (+1 Point)</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span className="text-rose-800 dark:text-rose-300">
                    Incorrect. The correct answer is Option {currentQ.correctDisplayKey}
                  </span>
                </>
              )}
            </div>

            {currentQ.originalQuestion.explanation ? (
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <span className="font-semibold text-slate-900 dark:text-white mr-1">Explanation:</span>
                {currentQ.originalQuestion.explanation}
              </p>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Correct answer is Option {currentQ.correctDisplayKey}.
              </p>
            )}
          </div>
        )}

        {/* Bottom Navigation Toolbar */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span>{currentIndex + 1}</span>
            <span>/</span>
            <span>{shuffledList.length}</span>
          </div>

          <button
            onClick={goToNext}
            className="flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-all whitespace-nowrap"
          >
            <span>{currentIndex === shuffledList.length - 1 ? 'Finish & Submit' : 'Next Question'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Question Palette Drawer Modal */}
      {paletteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Question Navigator</h3>
                <p className="text-xs text-slate-500">Jump to any question instantly</p>
              </div>
              <button
                onClick={() => setPaletteOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-indigo-600" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber-500" />
                <span>Review</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-700" />
                <span>Unattempted</span>
              </div>
            </div>

            {/* Questions Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto p-1">
              {shuffledList.map((_, i) => {
                const resp = responses[i];
                const isCur = i === currentIndex;
                const isAns = resp?.is_answered;
                const isRev = resp?.marked_for_review;

                let gridBg = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
                if (isRev) {
                  gridBg = 'bg-amber-500 text-white border-amber-600';
                } else if (isAns) {
                  gridBg = 'bg-indigo-600 text-white border-indigo-700';
                }

                return (
                  <button
                    key={i}
                    onClick={() => jumpToQuestion(i)}
                    className={`h-10 rounded-lg text-xs font-bold font-mono flex items-center justify-center border transition-all ${gridBg} ${
                      isCur ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 font-extrabold' : ''
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <button
                onClick={() => setPaletteOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setPaletteOpen(false);
                  setShowSubmitModal(true);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg"
              >
                Submit Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-slate-900 dark:text-white">
              <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Submit Your Test?</h3>
                <p className="text-xs text-slate-500">Review your final response summary</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Total Questions:</span>
                <span className="font-bold font-mono">{shuffledList.length}</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Answered:</span>
                <span className="font-bold font-mono">{answeredCount}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Unattempted:</span>
                <span className="font-bold font-mono">{shuffledList.length - answeredCount}</span>
              </div>
              <div className="flex justify-between text-amber-500">
                <span>Marked for Review:</span>
                <span className="font-bold font-mono">
                  {responses.filter(r => r.marked_for_review).length}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Continue Quiz
              </button>
              <button
                onClick={completeQuiz}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                Yes, Final Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
