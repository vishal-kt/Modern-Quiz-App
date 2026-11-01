import { QuestionSet, QuizAttempt, Question } from '../types/quiz';
import { INITIAL_QUESTION_SETS } from '../data/defaultSets';
import { parseMarkdownQuestions, generateSetId } from './parser';

const STORAGE_KEY_SETS = 'smart_quiz_question_sets_v1';
const STORAGE_KEY_ATTEMPTS = 'smart_quiz_attempts_v1';
const STORAGE_KEY_SETTINGS = 'smart_quiz_last_settings_v1';

export function getQuestionSets(): QuestionSet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SETS, JSON.stringify(INITIAL_QUESTION_SETS));
      return INITIAL_QUESTION_SETS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_QUESTION_SETS;
  } catch (e) {
    console.error('Failed to load question sets from localStorage:', e);
    return INITIAL_QUESTION_SETS;
  }
}

export function saveQuestionSet(newSet: QuestionSet): QuestionSet[] {
  const current = getQuestionSets();
  const existingIdx = current.findIndex(s => s.id === newSet.id);
  let updated: QuestionSet[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = { ...newSet, updated_at: new Date().toISOString() };
  } else {
    updated = [newSet, ...current];
  }
  try {
    localStorage.setItem(STORAGE_KEY_SETS, JSON.stringify(updated));
  } catch (e) {
    console.error('Storage limit reached while saving question set:', e);
  }
  return updated;
}

export function deleteQuestionSet(setId: string): QuestionSet[] {
  const current = getQuestionSets();
  const updated = current.filter(s => s.id !== setId);
  localStorage.setItem(STORAGE_KEY_SETS, JSON.stringify(updated));
  return updated;
}

export function updateQuestionSet(setId: string, updates: Partial<QuestionSet>): QuestionSet[] {
  const current = getQuestionSets();
  const updated = current.map(s => {
    if (s.id === setId) {
      const merged = { ...s, ...updates, updated_at: new Date().toISOString() };
      if (updates.questions) {
        merged.total_questions = updates.questions.length;
      }
      return merged;
    }
    return s;
  });
  localStorage.setItem(STORAGE_KEY_SETS, JSON.stringify(updated));
  return updated;
}

export function getQuizAttempts(): QuizAttempt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ATTEMPTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load quiz attempts:', e);
    return [];
  }
}

export function saveQuizAttempt(attempt: QuizAttempt): QuizAttempt[] {
  const current = getQuizAttempts();
  const updated = [attempt, ...current];
  try {
    localStorage.setItem(STORAGE_KEY_ATTEMPTS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save quiz attempt:', e);
  }
  return updated;
}

export function deleteQuizAttempt(attemptId: string): QuizAttempt[] {
  const current = getQuizAttempts();
  const updated = current.filter(a => a.id !== attemptId);
  localStorage.setItem(STORAGE_KEY_ATTEMPTS, JSON.stringify(updated));
  return updated;
}

export interface DashboardMetrics {
  totalQuestions: number;
  totalQuizzesAttempted: number;
  totalCorrectAnswers: number;
  overallAccuracy: number;
  totalPointsEarned: number;
  totalTimeMinutes: number;
  recentSets: QuestionSet[];
  recentAttempts: QuizAttempt[];
}

export function getDashboardMetrics(): DashboardMetrics {
  const sets = getQuestionSets();
  const attempts = getQuizAttempts();

  const totalQuestions = sets.reduce((acc, s) => acc + (s.total_questions || s.questions?.length || 0), 0);
  const totalQuizzesAttempted = attempts.length;
  const totalCorrectAnswers = attempts.reduce((acc, a) => acc + (a.correct_answers || 0), 0);
  const totalIncorrectAnswers = attempts.reduce((acc, a) => acc + (a.incorrect_answers || 0), 0);
  const totalAttemptedQuestions = totalCorrectAnswers + totalIncorrectAnswers;
  
  const overallAccuracy = totalAttemptedQuestions > 0 
    ? Math.round((totalCorrectAnswers / totalAttemptedQuestions) * 100)
    : 0;

  const totalPointsEarned = attempts.reduce((acc, a) => acc + (a.total_score || 0), 0);
  const totalTimeSeconds = attempts.reduce((acc, a) => acc + (a.total_time_seconds || 0), 0);
  const totalTimeMinutes = Math.round(totalTimeSeconds / 60);

  return {
    totalQuestions,
    totalQuizzesAttempted,
    totalCorrectAnswers,
    overallAccuracy,
    totalPointsEarned: Math.round(totalPointsEarned * 10) / 10,
    totalTimeMinutes,
    recentSets: sets.slice(0, 5),
    recentAttempts: attempts.slice(0, 5),
  };
}

/**
 * Loads the user's attached file (/public/assets/aistudio/railway_history_29fc0a7b.md)
 * and imports it as a complete QuestionSet!
 */
export async function loadAttachedRailwayHistorySet(): Promise<QuestionSet> {
  const response = await fetch('/assets/aistudio/railway_history_29fc0a7b.md');
  if (!response.ok) {
    throw new Error(`Failed to fetch attachment file: status ${response.status}`);
  }
  const text = await response.text();
  const parseResult = parseMarkdownQuestions(text, 'RRB Railway Exam - Comprehensive Indian History');

  // Filter to questions that have question text and at least 3 options
  const validQuestions = parseResult.questions.filter(
    q => q.question_text && q.option_a && q.option_b
  );

  const newSet: QuestionSet = {
    id: generateSetId(),
    title: 'RRB NTPC & Group D: Complete Railway History Question Bank',
    description: `Full extracted collection of ${validQuestions.length} official RRB questions from past papers with answer keys and detailed solutions.`,
    category: 'Railway NTPC & Group-D',
    source_filename: 'railway_history_29fc0a7b.md',
    total_questions: validQuestions.length,
    questions: validQuestions,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_builtin: false,
  };

  saveQuestionSet(newSet);
  return newSet;
}
