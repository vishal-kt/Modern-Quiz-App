import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Trash2, 
  Edit3, 
  Plus, 
  Save, 
  FileCheck, 
  Sparkles,
  HelpCircle,
  X,
  FileUp,
  RefreshCw
} from 'lucide-react';
import { Question, QuestionSet, CorrectOption, ParseIssue } from '../types/quiz';
import { parseMarkdownQuestions, extractTextFromPdf, generateId, generateSetId } from '../utils/parser';
import { saveQuestionSet } from '../utils/storage';

interface UploadViewProps {
  onSavedSet: (newSet: QuestionSet) => void;
  onCancel: () => void;
  onLoadAttachment: () => void;
  isLoadingAttachment: boolean;
}

export const UploadView: React.FC<UploadViewProps> = ({
  onSavedSet,
  onCancel,
  onLoadAttachment,
  isLoadingAttachment,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Parsed state
  const [setTitle, setSetTitle] = useState<string>('');
  const [setDescription, setSetDescription] = useState<string>('');
  const [setCategory, setSetCategory] = useState<string>('General Examination');
  const [extractedQuestions, setExtractedQuestions] = useState<Question[]>([]);
  const [parseIssues, setParseIssues] = useState<ParseIssue[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'issues' | 'valid'>('all');

  // Interactive Question Editor modal/state
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = async (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setFileName(file.name);

    try {
      let rawText = '';
      if (file.name.endsWith('.pdf')) {
        rawText = await extractTextFromPdf(file);
      } else {
        rawText = await file.text();
      }

      const defaultTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      const result = parseMarkdownQuestions(rawText, defaultTitle);

      setSetTitle(result.title || defaultTitle);
      setSetDescription(`Question set extracted from ${file.name}. Contains ${result.questions.length} questions.`);
      setExtractedQuestions(result.questions);
      setParseIssues(result.issues);

      if (result.questions.length === 0) {
        setErrorMessage('No valid questions could be detected. Please ensure questions contain text, options (A, B, C, D) and answers.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to parse file.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Paste raw text fallback
  const handleLoadSampleText = () => {
    const sample = `# Indian History & Railway Exam Quiz

## Question 1
Who founded the Mauryan Empire in ancient India?
A. Ashoka
B. Chandragupta Maurya
C. Bindusara
D. Bimbisara
Answer: B
Explanation: Chandragupta Maurya established the Mauryan dynasty in 322 BCE with the guidance of Chanakya.

## Question 2
The famous Jallianwala Bagh massacre occurred on which historic date?
A. 15 August 1919
B. 26 January 1920
C. 13 April 1919
D. 2 October 1918
Answer: C
Explanation: On 13 April 1919, Brigadier-General Dyer ordered troops to fire upon unarmed people gathered at Jallianwala Bagh on Baisakhi day.

## Question 3
Which of the following is the oldest of the four Vedas?
A. Samaveda
B. Yajurveda
C. Atharvaveda
D. Rigveda
Answer: D
Explanation: Rigveda is the oldest known Indo-Aryan text, consisting of 1,028 hymns arranged in 10 Mandalas.
`;
    setFileName('sample_quiz.md');
    const result = parseMarkdownQuestions(sample, 'Indian History & Railway Exam Quiz');
    setSetTitle(result.title);
    setSetDescription('Sample structured question set demonstrating format.');
    setExtractedQuestions(result.questions);
    setParseIssues(result.issues);
  };

  // Remove question
  const handleDeleteQuestion = (id: string) => {
    setExtractedQuestions(prev => prev.filter(q => q.id !== id));
  };

  // Start editing question
  const handleStartEdit = (question: Question, index: number) => {
    setEditingQuestion({ ...question });
    setEditingIndex(index);
  };

  // Save edited question
  const handleSaveEdit = () => {
    if (!editingQuestion || editingIndex === null) return;
    setExtractedQuestions(prev => {
      const copy = [...prev];
      copy[editingIndex] = editingQuestion;
      return copy;
    });
    setEditingQuestion(null);
    setEditingIndex(null);
  };

  // Add brand new question
  const handleAddNewQuestion = () => {
    const newQ: Question = {
      id: generateId(),
      question_text: 'New Question Text',
      option_a: 'Option A',
      option_b: 'Option B',
      option_c: 'Option C',
      option_d: 'Option D',
      correct_answer: 'A',
      explanation: '',
    };
    setExtractedQuestions(prev => [newQ, ...prev]);
    setEditingQuestion(newQ);
    setEditingIndex(0);
  };

  // Save to question bank
  const handleSaveToBank = () => {
    if (extractedQuestions.length === 0) {
      setErrorMessage('Cannot save an empty question set. Please add or extract at least one question.');
      return;
    }

    const newSet: QuestionSet = {
      id: generateSetId(),
      title: setTitle.trim() || 'Untitled Question Set',
      description: setDescription.trim() || `Extracted on ${new Date().toLocaleDateString()}`,
      category: setCategory,
      source_filename: fileName || 'uploaded_document',
      total_questions: extractedQuestions.length,
      questions: extractedQuestions,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveQuestionSet(newSet);
    onSavedSet(newSet);
  };

  // Filter questions for review
  const filteredQuestions = extractedQuestions.filter((q, idx) => {
    const hasIssue = parseIssues.some(issue => issue.index === idx + 1);
    if (filterMode === 'issues') return hasIssue;
    if (filterMode === 'valid') return !hasIssue;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Upload Question Files
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Supports Markdown (.md) and PDF (.pdf) with automatic extraction and validation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onLoadAttachment}
            disabled={isLoadingAttachment}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Load Railway History Attachment</span>
          </button>

          <button
            onClick={onCancel}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Upload Drag & Drop Area */}
      {extractedQuestions.length === 0 ? (
        <div className="space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-700'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt,.pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                {isProcessing ? (
                  <RefreshCw className="w-7 h-7 animate-spin" />
                ) : (
                  <FileUp className="w-7 h-7" />
                )}
              </div>

              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {isProcessing ? 'Extracting and validating questions...' : 'Click to select or drag & drop files here'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Markdown (.md, .txt) or PDF documents up to 50MB
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Handles Hindi & English text</span>
                <span aria-hidden="true">·</span>
                <span>Math symbols preserved</span>
                <span aria-hidden="true">·</span>
                <span>Auto-validation</span>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Parsing Notice</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Fallback & Quick Test */}
          <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Want to see how questions are extracted? Try our sample exam format.
            </div>
            <button
              onClick={handleLoadSampleText}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>Load Sample Markdown</span>
            </button>
          </div>
        </div>
      ) : (
        /* Preview & Validation Screen */
        <div className="space-y-6">
          {/* Metadata & Controls Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Question Set Title
                </label>
                <input
                  type="text"
                  value={setTitle}
                  onChange={e => setSetTitle(e.target.value)}
                  placeholder="e.g. RRB NTPC Ancient History Paper"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Exam Category
                </label>
                <select
                  value={setCategory}
                  onChange={e => setSetCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Indian History">Indian History</option>
                  <option value="Railway NTPC & Group-D">Railway NTPC & Group-D</option>
                  <option value="General Science">General Science</option>
                  <option value="General Knowledge">General Knowledge</option>
                  <option value="Geography & Polity">Geography & Polity</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Description
              </label>
              <textarea
                value={setDescription}
                onChange={e => setSetDescription(e.target.value)}
                rows={2}
                placeholder="Brief description of this test set..."
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Validation Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-900 dark:text-white">
                  Extracted {extractedQuestions.length} Questions
                </span>
                <span aria-hidden="true">·</span>
                {parseIssues.length === 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    All questions validated successfully
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {parseIssues.length} questions require review
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddNewQuestion}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Question</span>
                </button>

                <button
                  onClick={handleSaveToBank}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save to Question Bank ({extractedQuestions.length})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filter Pills for Question Preview */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800/60 rounded-lg w-fit">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filterMode === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Questions ({extractedQuestions.length})
            </button>
            <button
              onClick={() => setFilterMode('issues')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filterMode === 'issues'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Needs Attention ({parseIssues.length})
            </button>
            <button
              onClick={() => setFilterMode('valid')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filterMode === 'valid'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Fully Validated ({extractedQuestions.length - parseIssues.length})
            </button>
          </div>

          {/* Questions List */}
          <div className="space-y-3">
            {filteredQuestions.map((q, idx) => {
              const issue = parseIssues.find(iss => iss.index === idx + 1);
              return (
                <div
                  key={q.id}
                  className={`bg-white dark:bg-slate-900 border rounded-xl p-4 sm:p-5 transition-all ${
                    issue
                      ? 'border-amber-300 dark:border-amber-700/80 bg-amber-50/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400">
                        #{idx + 1}
                      </span>
                      {q.exam_reference && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {q.exam_reference}
                        </span>
                      )}
                      {issue && (
                        <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {issue.message}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartEdit(q, idx)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit question"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Delete question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                    {q.question_text}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                    <div className={`p-2.5 rounded-lg border ${
                      q.correct_answer === 'A'
                        ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-medium'
                        : 'border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      <span className="font-bold mr-1.5">A.</span> {q.option_a || <span className="text-rose-500 italic">Missing Option</span>}
                    </div>

                    <div className={`p-2.5 rounded-lg border ${
                      q.correct_answer === 'B'
                        ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-medium'
                        : 'border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      <span className="font-bold mr-1.5">B.</span> {q.option_b || <span className="text-rose-500 italic">Missing Option</span>}
                    </div>

                    <div className={`p-2.5 rounded-lg border ${
                      q.correct_answer === 'C'
                        ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-medium'
                        : 'border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      <span className="font-bold mr-1.5">C.</span> {q.option_c || <span className="text-rose-500 italic">Missing Option</span>}
                    </div>

                    <div className={`p-2.5 rounded-lg border ${
                      q.correct_answer === 'D'
                        ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-medium'
                        : 'border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      <span className="font-bold mr-1.5">D.</span> {q.option_d || <span className="text-rose-500 italic">Missing Option</span>}
                    </div>
                  </div>

                  {q.explanation && (
                    <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 mr-1">Explanation:</span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Question #{editingIndex !== null ? editingIndex + 1 : ''}
              </h2>
              <button
                onClick={() => setEditingQuestion(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Question Text
                </label>
                <textarea
                  value={editingQuestion.question_text}
                  onChange={e => setEditingQuestion({ ...editingQuestion, question_text: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Option A</label>
                  <input
                    type="text"
                    value={editingQuestion.option_a}
                    onChange={e => setEditingQuestion({ ...editingQuestion, option_a: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Option B</label>
                  <input
                    type="text"
                    value={editingQuestion.option_b}
                    onChange={e => setEditingQuestion({ ...editingQuestion, option_b: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Option C</label>
                  <input
                    type="text"
                    value={editingQuestion.option_c}
                    onChange={e => setEditingQuestion({ ...editingQuestion, option_c: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Option D</label>
                  <input
                    type="text"
                    value={editingQuestion.option_d}
                    onChange={e => setEditingQuestion({ ...editingQuestion, option_d: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Correct Answer
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['A', 'B', 'C', 'D'] as CorrectOption[]).map(key => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setEditingQuestion({ ...editingQuestion, correct_answer: key })}
                        className={`py-2 text-xs font-bold rounded-lg border transition-colors ${
                          editingQuestion.correct_answer === key
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Option {key}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Exam Reference / Source
                  </label>
                  <input
                    type="text"
                    value={editingQuestion.exam_reference || ''}
                    onChange={e => setEditingQuestion({ ...editingQuestion, exam_reference: e.target.value })}
                    placeholder="e.g. RRB NTPC 2021 Stage Ist"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Explanation / Solution Notes
                </label>
                <textarea
                  value={editingQuestion.explanation || ''}
                  onChange={e => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  rows={2}
                  placeholder="Why is this answer correct? Historical or conceptual context..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
