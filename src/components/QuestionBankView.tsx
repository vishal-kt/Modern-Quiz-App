import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Play, 
  Download, 
  BookOpen, 
  FolderOpen, 
  Sparkles, 
  Calendar, 
  FileText,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { QuestionSet, Question, CorrectOption } from '../types/quiz';
import { generateId, generateSetId } from '../utils/parser';
import { saveQuestionSet, deleteQuestionSet, updateQuestionSet } from '../utils/storage';

interface QuestionBankViewProps {
  questionSets: QuestionSet[];
  onStartQuiz: (setId: string) => void;
  onNavigateUpload: () => void;
  onSetsUpdated: (updatedSets: QuestionSet[]) => void;
  onLoadAttachmentSet: () => void;
  isLoadingAttachment: boolean;
}

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  questionSets,
  onStartQuiz,
  onNavigateUpload,
  onSetsUpdated,
  onLoadAttachmentSet,
  isLoadingAttachment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Set being edited (metadata)
  const [editingSet, setEditingSet] = useState<QuestionSet | null>(null);

  // Set expanded to view/edit individual questions
  const [expandedSetId, setExpandedSetId] = useState<string | null>(null);

  // Question being edited in modal
  const [editingQuestion, setEditingQuestion] = useState<{
    setId: string;
    question: Question;
    index: number;
  } | null>(null);

  // Filter sets
  const filteredSets = questionSets.filter(set => {
    const matchesQuery = set.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      set.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      set.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || set.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(questionSets.map(s => s.category)))];

  // Delete Set
  const handleDeleteSet = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      const updated = deleteQuestionSet(id);
      onSetsUpdated(updated);
      if (expandedSetId === id) setExpandedSetId(null);
    }
  };

  // Save Set Metadata Changes
  const handleSaveSetMetadata = () => {
    if (!editingSet) return;
    const updated = updateQuestionSet(editingSet.id, {
      title: editingSet.title,
      description: editingSet.description,
      category: editingSet.category,
    });
    onSetsUpdated(updated);
    setEditingSet(null);
  };

  // Delete individual question from a set
  const handleDeleteQuestion = (setId: string, qId: string) => {
    const targetSet = questionSets.find(s => s.id === setId);
    if (!targetSet) return;
    const newQuestions = targetSet.questions.filter(q => q.id !== qId);
    const updated = updateQuestionSet(setId, { questions: newQuestions });
    onSetsUpdated(updated);
  };

  // Add question to set
  const handleAddQuestionToSet = (setId: string) => {
    const targetSet = questionSets.find(s => s.id === setId);
    if (!targetSet) return;

    const newQ: Question = {
      id: generateId(),
      question_text: 'New question title',
      option_a: 'Option A',
      option_b: 'Option B',
      option_c: 'Option C',
      option_d: 'Option D',
      correct_answer: 'A',
      explanation: '',
    };

    const newQuestions = [newQ, ...targetSet.questions];
    const updated = updateQuestionSet(setId, { questions: newQuestions });
    onSetsUpdated(updated);

    setEditingQuestion({
      setId,
      question: newQ,
      index: 0,
    });
  };

  // Save edited question
  const handleSaveQuestion = () => {
    if (!editingQuestion) return;
    const { setId, question, index } = editingQuestion;
    const targetSet = questionSets.find(s => s.id === setId);
    if (!targetSet) return;

    const newQuestions = [...targetSet.questions];
    newQuestions[index] = question;
    const updated = updateQuestionSet(setId, { questions: newQuestions });
    onSetsUpdated(updated);
    setEditingQuestion(null);
  };

  // Export set as JSON
  const handleExportJson = (set: QuestionSet) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(set, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${set.title.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export set as Markdown
  const handleExportMarkdown = (set: QuestionSet) => {
    let md = `# ${set.title}\n\n`;
    md += `> ${set.description}\n\n`;
    set.questions.forEach((q, i) => {
      md += `## Question ${i + 1}\n${q.question_text}\n\n`;
      md += `A. ${q.option_a}\n`;
      md += `B. ${q.option_b}\n`;
      md += `C. ${q.option_c}\n`;
      md += `D. ${q.option_d}\n\n`;
      md += `Answer: ${q.correct_answer}\n`;
      if (q.explanation) {
        md += `Explanation: ${q.explanation}\n`;
      }
      md += '\n---\n\n';
    });

    const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(md);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${set.title.replace(/\s+/g, '_')}.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Question Bank Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse, edit, search, and manage your complete examination library.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onLoadAttachmentSet}
            disabled={isLoadingAttachment}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Load Railway Paper</span>
          </button>

          <button
            onClick={onNavigateUpload}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload New File</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search questions or sets by title..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Question Sets List */}
      <div className="space-y-4">
        {filteredSets.map(set => {
          const isExpanded = expandedSetId === set.id;

          return (
            <div
              key={set.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all shadow-xs"
            >
              {/* Card Header */}
              <div className="p-5 sm:p-6 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {set.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums font-bold text-slate-700 dark:text-slate-300">
                        {set.total_questions} Questions
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Source: {set.source_filename}</span>
                      <span aria-hidden="true">·</span>
                      <span>{new Date(set.created_at).toLocaleDateString()}</span>
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {set.title}
                    </h2>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {set.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => onStartQuiz(set.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Take Quiz</span>
                    </button>

                    <button
                      onClick={() => setEditingSet({ ...set })}
                      className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Rename / Edit Set Details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleExportMarkdown(set)}
                      className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Export as Markdown"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteSet(set.id, set.title)}
                      className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Delete Question Set"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setExpandedSetId(isExpanded ? null : set.id)}
                      className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide Questions' : 'View Questions'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Question Explorer & Sub-editor */}
              {isExpanded && (
                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Questions in this Bank ({set.questions?.length || 0})
                    </span>

                    <button
                      onClick={() => handleAddQuestionToSet(set.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Question</span>
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {set.questions.map((q, idx) => (
                      <div
                        key={q.id || idx}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="font-semibold text-slate-900 dark:text-white text-sm">
                            <span className="font-mono text-slate-400 mr-2">#{idx + 1}</span>
                            {q.question_text}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => setEditingQuestion({ setId: set.id, question: { ...q }, index: idx })}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(set.id, q.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 pt-1">
                          <div className={q.correct_answer === 'A' ? 'font-bold text-emerald-600 dark:text-emerald-400' : ''}>
                            A. {q.option_a}
                          </div>
                          <div className={q.correct_answer === 'B' ? 'font-bold text-emerald-600 dark:text-emerald-400' : ''}>
                            B. {q.option_b}
                          </div>
                          <div className={q.correct_answer === 'C' ? 'font-bold text-emerald-600 dark:text-emerald-400' : ''}>
                            C. {q.option_c}
                          </div>
                          <div className={q.correct_answer === 'D' ? 'font-bold text-emerald-600 dark:text-emerald-400' : ''}>
                            D. {q.option_d}
                          </div>
                        </div>

                        {q.explanation && (
                          <div className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg mt-1">
                            <strong>Ans ({q.correct_answer}):</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredSets.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-8">
            <FolderOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
              No Question Sets Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Try adjusting your search terms or upload a new exam file.
            </p>
            <button
              onClick={onNavigateUpload}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg"
            >
              Upload Questions
            </button>
          </div>
        )}
      </div>

      {/* Edit Set Metadata Modal */}
      {editingSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Question Set Details
              </h3>
              <button
                onClick={() => setEditingSet(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Title</label>
                <input
                  type="text"
                  value={editingSet.title}
                  onChange={e => setEditingSet({ ...editingSet, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Category</label>
                <input
                  type="text"
                  value={editingSet.category}
                  onChange={e => setEditingSet({ ...editingSet, category: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  value={editingSet.description}
                  onChange={e => setEditingSet({ ...editingSet, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setEditingSet(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSetMetadata}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Single Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Question #{editingQuestion.index + 1}
              </h3>
              <button
                onClick={() => setEditingQuestion(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Question Text</label>
                <textarea
                  value={editingQuestion.question.question_text}
                  onChange={e => setEditingQuestion({
                    ...editingQuestion,
                    question: { ...editingQuestion.question, question_text: e.target.value }
                  })}
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Option A</label>
                  <input
                    type="text"
                    value={editingQuestion.question.option_a}
                    onChange={e => setEditingQuestion({
                      ...editingQuestion,
                      question: { ...editingQuestion.question, option_a: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Option B</label>
                  <input
                    type="text"
                    value={editingQuestion.question.option_b}
                    onChange={e => setEditingQuestion({
                      ...editingQuestion,
                      question: { ...editingQuestion.question, option_b: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Option C</label>
                  <input
                    type="text"
                    value={editingQuestion.question.option_c}
                    onChange={e => setEditingQuestion({
                      ...editingQuestion,
                      question: { ...editingQuestion.question, option_c: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Option D</label>
                  <input
                    type="text"
                    value={editingQuestion.question.option_d}
                    onChange={e => setEditingQuestion({
                      ...editingQuestion,
                      question: { ...editingQuestion.question, option_d: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Correct Answer</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['A', 'B', 'C', 'D'] as CorrectOption[]).map(key => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEditingQuestion({
                        ...editingQuestion,
                        question: { ...editingQuestion.question, correct_answer: key }
                      })}
                      className={`py-2 text-xs font-bold rounded-lg border transition-colors ${
                        editingQuestion.question.correct_answer === key
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Option {key}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Explanation</label>
                <textarea
                  value={editingQuestion.question.explanation || ''}
                  onChange={e => setEditingQuestion({
                    ...editingQuestion,
                    question: { ...editingQuestion.question, explanation: e.target.value }
                  })}
                  rows={2}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuestion}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
              >
                Save Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
