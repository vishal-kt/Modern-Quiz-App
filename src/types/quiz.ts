export type CorrectOption = 'A' | 'B' | 'C' | 'D';

export interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: CorrectOption;
  explanation?: string;
  exam_reference?: string;
  category?: string;
}

export interface QuestionSet {
  id: string;
  title: string;
  description: string;
  category: string;
  source_filename: string;
  total_questions: number;
  questions: Question[];
  created_at: string;
  updated_at: string;
  is_builtin?: boolean;
}

export interface QuizSettings {
  question_set_id: string;
  question_count: number | 'all';
  timer_duration: number; // in seconds, default 45
  shuffle_questions: boolean;
  shuffle_options: boolean;
  mode: 'practice' | 'exam';
  negative_marking: boolean;
  negative_mark_value: number; // default 0.25
}

export interface ShuffledQuestion {
  originalQuestion: Question;
  displayQuestionText: string;
  displayOptions: {
    key: CorrectOption;
    text: string;
    originalKey: CorrectOption;
  }[];
  correctDisplayKey: CorrectOption;
}

export interface QuestionResponse {
  question_id: string;
  selected_answer: CorrectOption | null; // based on original keys
  selected_display_key: CorrectOption | null;
  correct_answer: CorrectOption;
  is_correct: boolean;
  time_taken_seconds: number;
  marked_for_review?: boolean;
  is_answered: boolean;
}

export interface QuizAttempt {
  id: string;
  question_set_id: string;
  question_set_title: string;
  mode: 'practice' | 'exam';
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  unanswered: number;
  total_score: number;
  max_score: number;
  accuracy: number;
  total_time_seconds: number;
  average_time_per_question: number;
  created_at: string;
  negative_marking: boolean;
  responses: QuestionResponse[];
}

export interface ParseIssue {
  index: number;
  type: 'error' | 'warning';
  message: string;
  rawText?: string;
}

export interface ParseResult {
  title: string;
  questions: Question[];
  issues: ParseIssue[];
  totalParsed: number;
  validCount: number;
}
