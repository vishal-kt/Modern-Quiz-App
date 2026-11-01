import React, { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { Dashboard } from './components/Dashboard';
import { UploadView } from './components/UploadView';
import { QuestionBankView } from './components/QuestionBankView';
import { HistoryView } from './components/HistoryView';
import { QuizConfigModal } from './components/QuizConfigModal';
import { QuizScreen } from './components/QuizScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { ReviewScreen } from './components/ReviewScreen';
import { 
  getQuestionSets, 
  getQuizAttempts, 
  getDashboardMetrics, 
  saveQuizAttempt, 
  deleteQuizAttempt, 
  loadAttachedRailwayHistorySet 
} from './utils/storage';
import { QuestionSet, QuizAttempt, QuizSettings } from './types/quiz';

export default function App() {
  const [currentView, setCurrentView] = useState<
    'dashboard' | 'bank' | 'upload' | 'history' | 'quiz' | 'results' | 'review'
  >('dashboard');

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
      );
    }
    return false;
  });

  // Data state
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>(() => getQuestionSets());
  const [attempts, setAttempts] = useState<QuizAttempt[]>(() => getQuizAttempts());
  const [metrics, setMetrics] = useState(() => getDashboardMetrics());

  // Quiz execution state
  const [configModalOpen, setConfigModalOpen] = useState<boolean>(false);
  const [targetSetForConfig, setTargetSetForConfig] = useState<string | undefined>(undefined);
  const [activeQuizSettings, setActiveQuizSettings] = useState<QuizSettings | null>(null);
  const [activeQuestionSet, setActiveQuestionSet] = useState<QuestionSet | null>(null);
  const [latestAttempt, setLatestAttempt] = useState<QuizAttempt | null>(null);

  // Attachment loading status
  const [isLoadingAttachment, setIsLoadingAttachment] = useState<boolean>(false);

  // Apply dark mode class to root HTML
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Refresh metrics whenever sets or attempts change
  const refreshMetrics = () => {
    setMetrics(getDashboardMetrics());
  };

  const handleToggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // Open Quiz Config Modal
  const handleOpenQuizConfig = (setId?: string) => {
    setTargetSetForConfig(setId);
    setConfigModalOpen(true);
  };

  // Start Quiz from Config Modal
  const handleStartQuizFromConfig = (settings: QuizSettings) => {
    const chosenSet = questionSets.find(s => s.id === settings.question_set_id) || questionSets[0];
    if (!chosenSet || chosenSet.questions.length === 0) {
      alert('Selected question set contains no questions.');
      return;
    }
    setActiveQuizSettings(settings);
    setActiveQuestionSet(chosenSet);
    setConfigModalOpen(false);
    setCurrentView('quiz');
  };

  // Finish Quiz
  const handleFinishQuiz = (attempt: QuizAttempt) => {
    const updatedAttempts = saveQuizAttempt(attempt);
    setAttempts(updatedAttempts);
    setLatestAttempt(attempt);
    refreshMetrics();
    setCurrentView('results');
  };

  // View past attempt results
  const handleViewAttempt = (attempt: QuizAttempt) => {
    setLatestAttempt(attempt);
    const set = questionSets.find(s => s.id === attempt.question_set_id);
    if (set) {
      setActiveQuestionSet(set);
    }
    setCurrentView('results');
  };

  // Retake quiz
  const handleRetakeQuiz = (setId?: string) => {
    const targetId = setId || latestAttempt?.question_set_id || questionSets[0]?.id;
    handleOpenQuizConfig(targetId);
  };

  // Delete attempt
  const handleDeleteAttempt = (attemptId: string) => {
    const updated = deleteQuizAttempt(attemptId);
    setAttempts(updated);
    refreshMetrics();
  };

  // When sets are updated via bank
  const handleSetsUpdated = (updatedSets: QuestionSet[]) => {
    setQuestionSets(updatedSets);
    refreshMetrics();
  };

  // When a set is saved from upload
  const handleSetSavedFromUpload = (newSet: QuestionSet) => {
    setQuestionSets(getQuestionSets());
    refreshMetrics();
    // Offer to start quiz directly
    handleOpenQuizConfig(newSet.id);
  };

  // 1-Click Load attached railway history set
  const handleLoadAttachment = async () => {
    setIsLoadingAttachment(true);
    try {
      const newSet = await loadAttachedRailwayHistorySet();
      setQuestionSets(getQuestionSets());
      refreshMetrics();
      alert(`Successfully imported "${newSet.title}" with ${newSet.total_questions} questions!`);
      handleOpenQuizConfig(newSet.id);
    } catch (err) {
      console.error(err);
      alert('Failed to import railway history attachment: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsLoadingAttachment(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation Bar (Hidden during active quiz for maximum distraction-free focus) */}
      {currentView !== 'quiz' && (
        <TopNav
          currentView={currentView}
          onNavigate={(view) => setCurrentView(view)}
          onStartQuizClick={() => handleOpenQuizConfig()}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />
      )}

      {/* Main Container */}
      <main className={`flex-1 ${currentView === 'quiz' ? 'pt-4 px-4' : 'max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6'}`}>
        {currentView === 'dashboard' && (
          <Dashboard
            metrics={metrics}
            onStartQuiz={(setId) => handleOpenQuizConfig(setId)}
            onNavigateUpload={() => setCurrentView('upload')}
            onNavigateBank={() => setCurrentView('bank')}
            onNavigateHistory={() => setCurrentView('history')}
            onViewAttempt={handleViewAttempt}
            onLoadAttachmentSet={handleLoadAttachment}
            isLoadingAttachment={isLoadingAttachment}
          />
        )}

        {currentView === 'upload' && (
          <UploadView
            onSavedSet={handleSetSavedFromUpload}
            onCancel={() => setCurrentView('dashboard')}
            onLoadAttachment={handleLoadAttachment}
            isLoadingAttachment={isLoadingAttachment}
          />
        )}

        {currentView === 'bank' && (
          <QuestionBankView
            questionSets={questionSets}
            onStartQuiz={(setId) => handleOpenQuizConfig(setId)}
            onNavigateUpload={() => setCurrentView('upload')}
            onSetsUpdated={handleSetsUpdated}
            onLoadAttachmentSet={handleLoadAttachment}
            isLoadingAttachment={isLoadingAttachment}
          />
        )}

        {currentView === 'history' && (
          <HistoryView
            attempts={attempts}
            onViewAttempt={handleViewAttempt}
            onRetakeQuiz={handleRetakeQuiz}
            onDeleteAttempt={handleDeleteAttempt}
            onStartQuiz={() => handleOpenQuizConfig()}
          />
        )}

        {currentView === 'quiz' && activeQuestionSet && activeQuizSettings && (
          <QuizScreen
            questionSet={activeQuestionSet}
            settings={activeQuizSettings}
            onFinishQuiz={handleFinishQuiz}
            onExitQuiz={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'results' && latestAttempt && (
          <ResultsScreen
            attempt={latestAttempt}
            onReviewAnswers={() => setCurrentView('review')}
            onRetakeQuiz={() => handleRetakeQuiz(latestAttempt.question_set_id)}
            onReturnDashboard={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'review' && latestAttempt && (
          <ReviewScreen
            attempt={latestAttempt}
            questions={
              activeQuestionSet?.questions ||
              questionSets.find(s => s.id === latestAttempt.question_set_id)?.questions ||
              []
            }
            onBackToResults={() => setCurrentView('results')}
            onRetakeQuiz={() => handleRetakeQuiz(latestAttempt.question_set_id)}
            onReturnDashboard={() => setCurrentView('dashboard')}
          />
        )}
      </main>

      {/* Quiz Configuration Modal */}
      <QuizConfigModal
        questionSets={questionSets}
        defaultSetId={targetSetForConfig}
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        onStartQuiz={handleStartQuizFromConfig}
      />
    </div>
  );
}
