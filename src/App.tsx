import React, { useState, useEffect } from 'react';
import {
  SavedQuizBank,
  QuizConfig,
  QuizQuestion,
  LLMConfig,
} from './types/quiz';
import {
  getSavedQuizBanks,
  saveQuizBank,
  deleteQuizBank,
  getSavedLLMConfig,
  saveLLMConfig,
} from './services/storage';
import {
  logQuizSubmissionEvent,
  getActiveGroupId,
  setActiveGroupId,
} from './services/firebaseService';
import { Navbar } from './components/Navbar';
import { SettingsModal } from './components/SettingsModal';
import { SavedBanksModal } from './components/SavedBanksModal';
import { CoverageModal } from './components/CoverageModal';
import { AdminModal } from './components/AdminModal';
import { StudyGroupModal } from './components/StudyGroupModal';
import { UploadView } from './components/UploadView';
import { ConfigView } from './components/ConfigView';
import { QuizView } from './components/QuizView';
import { ResultView } from './components/ResultView';
import { CustomAlertDialog, AlertData } from './components/CustomAlertDialog';
import './App.css';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<'upload' | 'config' | 'quiz' | 'result'>('upload');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSavedBanksOpen, setIsSavedBanksOpen] = useState(false);
  const [isCoverageOpen, setIsCoverageOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isStudyGroupOpen, setIsStudyGroupOpen] = useState(false);

  // Group state
  const [activeGroupId, setActiveGroupState] = useState<string | null>(getActiveGroupId());

  // Core quiz state
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(getSavedLLMConfig());
  const [savedBanks, setSavedBanks] = useState<SavedQuizBank[]>(getSavedQuizBanks());
  const [activeQuizBank, setActiveQuizBank] = useState<SavedQuizBank | null>(null);
  const [activeConfig, setActiveConfig] = useState<QuizConfig | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [activeUserAnswers, setActiveUserAnswers] = useState<Record<string, number>>({});
  const [activeFlagged, setActiveFlagged] = useState<Record<string, boolean>>({});

  // Custom alert dialog state
  const [alertDialog, setAlertDialog] = useState<AlertData | null>(null);

  // Initialize theme, detect group link & override alert
  useEffect(() => {
    // Override browser window.alert with modern CustomAlertDialog
    window.alert = (message: unknown) => {
      setAlertDialog({ message: String(message) });
    };

    const savedTheme = localStorage.getItem('quiz_on_thi_theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);

    // Detect study group query parameter ?group=ABC
    const params = new URLSearchParams(window.location.search);
    const gParam = params.get('group');
    if (gParam) {
      setActiveGroupId(gParam);
      setActiveGroupState(gParam.trim().toUpperCase());
      setIsStudyGroupOpen(true);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('quiz_on_thi_theme', next);
  };

  const handleSaveLLMConfig = (newConfig: LLMConfig) => {
    setLlmConfig(newConfig);
    saveLLMConfig(newConfig);
  };

  const handleQuizReady = (bank: SavedQuizBank) => {
    setActiveQuizBank(bank);
    setSavedBanks(getSavedQuizBanks());
    setCurrentScreen('config');
  };

  const handleSelectSavedBank = (bank: SavedQuizBank) => {
    setActiveQuizBank(bank);
    setCurrentScreen('config');
  };

  const handleDeleteBank = (id: string) => {
    const updated = deleteQuizBank(id);
    setSavedBanks(updated);
    if (activeQuizBank?.id === id) {
      setActiveQuizBank(null);
      setCurrentScreen('upload');
    }
  };

  const handleBankImported = (bank: SavedQuizBank) => {
    setSavedBanks(getSavedQuizBanks());
    setActiveQuizBank(bank);
    setCurrentScreen('config');
  };

  const handleStartQuiz = (config: QuizConfig, excludeQuestionIds?: string[]) => {
    if (!activeQuizBank) return;

    setActiveConfig(config);

    // 1. Filter questions by selected sections
    let questionsToUse = activeQuizBank.sections
      .filter((s) => config.selectedSectionIds.includes(s.id))
      .flatMap((s) => s.questions);

    // If Exam mode with custom question count limit (e.g., 40-50 questions)
    if (config.mode === 'exam' && config.examQuestionCount && config.examQuestionCount < questionsToUse.length) {
      if (excludeQuestionIds && excludeQuestionIds.length > 0) {
        // Try picking fresh questions that were not in the previous exam run
        const freshPool = questionsToUse.filter((q) => !excludeQuestionIds.includes(q.id));
        if (freshPool.length >= config.examQuestionCount) {
          questionsToUse = [...freshPool].sort(() => Math.random() - 0.5).slice(0, config.examQuestionCount);
        } else {
          // Take all fresh questions, fill remainder with randomly sampled questions from old pool
          const remainderCount = config.examQuestionCount - freshPool.length;
          const oldPool = questionsToUse
            .filter((q) => excludeQuestionIds.includes(q.id))
            .sort(() => Math.random() - 0.5)
            .slice(0, remainderCount);
          questionsToUse = [...freshPool, ...oldPool].sort(() => Math.random() - 0.5);
        }
      } else {
        questionsToUse = [...questionsToUse].sort(() => Math.random() - 0.5).slice(0, config.examQuestionCount);
      }
    }

    // 2. Clone to avoid mutating bank directly
    questionsToUse = questionsToUse.map((q) => ({
      ...q,
      options: [...q.options],
    }));

    // 3. Optional shuffle options
    if (config.shuffleOptions) {
      questionsToUse = questionsToUse.map((q) => {
        const correctText = q.options[q.correctIndex];
        const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
        const newCorrectIndex = shuffledOptions.indexOf(correctText);
        return {
          ...q,
          options: shuffledOptions,
          correctIndex: newCorrectIndex,
        };
      });
    }

    // 4. Optional shuffle questions
    if (config.shuffleQuestions) {
      questionsToUse = [...questionsToUse].sort(() => Math.random() - 0.5);
    }

    setActiveQuestions(questionsToUse);
    setActiveUserAnswers({});
    setActiveFlagged({});
    setCurrentScreen('quiz');
  };

  const handleFinishQuiz = (
    userAnswers: Record<string, number>,
    flagged: Record<string, boolean>
  ) => {
    setActiveUserAnswers(userAnswers);
    setActiveFlagged(flagged);

    // Log quiz submission event to Firebase for Admin
    if (activeQuizBank) {
      let correct = 0;
      activeQuestions.forEach((q) => {
        if (userAnswers[q.id] === q.correctIndex) correct++;
      });
      const pct = activeQuestions.length === 0 ? 0 : Math.round((correct / activeQuestions.length) * 100);
      logQuizSubmissionEvent({
        quizTitle: activeQuizBank.title,
        score: correct,
        total: activeQuestions.length,
        percentage: pct,
        mode: activeConfig?.mode || 'practice',
      });
    }

    setCurrentScreen('result');
  };

  const handleRetryIncorrectOnly = (incorrectQuestions: QuizQuestion[]) => {
    setActiveQuestions(incorrectQuestions);
    setActiveUserAnswers({});
    setActiveFlagged({});
    setCurrentScreen('quiz');
  };

  const handleRetryAll = () => {
    if (activeConfig) {
      handleStartQuiz(activeConfig);
    } else {
      setActiveUserAnswers({});
      setActiveFlagged({});
      setCurrentScreen('quiz');
    }
  };

  const handleRefreshExam = () => {
    if (activeConfig && activeQuizBank) {
      const currentIds = activeQuestions.map((q) => q.id);
      handleStartQuiz(activeConfig, currentIds);
    }
  };

  const handleNewQuiz = () => {
    setActiveQuizBank(null);
    setCurrentScreen('upload');
  };

  return (
    <div className="app-container">
      <Navbar
        currentScreen={currentScreen}
        onNavigateHome={() => setCurrentScreen('upload')}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSavedBanks={() => setIsSavedBanksOpen(true)}
        onOpenStudyGroup={() => setIsStudyGroupOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        activeGroupId={activeGroupId}
        theme={theme}
        onToggleTheme={toggleTheme}
        savedCount={savedBanks.length}
      />

      <main className="main-content">
        {currentScreen === 'upload' && (
          <UploadView
            llmConfig={llmConfig}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onQuizReady={handleQuizReady}
          />
        )}

        {currentScreen === 'config' && activeQuizBank && (
          <ConfigView
            quizBank={activeQuizBank}
            onStartQuiz={handleStartQuiz}
            onBack={() => setCurrentScreen('upload')}
            onViewCoverage={() => setIsCoverageOpen(true)}
          />
        )}

        {currentScreen === 'quiz' && activeConfig && (
          <QuizView
            questions={activeQuestions}
            config={activeConfig}
            onFinishQuiz={handleFinishQuiz}
            onExit={() => setCurrentScreen('config')}
          />
        )}

        {currentScreen === 'result' && activeQuizBank && (
          <ResultView
            quizBank={activeQuizBank}
            questions={activeQuestions}
            userAnswers={activeUserAnswers}
            flaggedQuestions={activeFlagged}
            onRetryIncorrectOnly={handleRetryIncorrectOnly}
            onRetryAll={handleRetryAll}
            onRefreshExam={handleRefreshExam}
            onNewQuiz={handleNewQuiz}
            onViewCoverage={() => setIsCoverageOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={llmConfig}
        onSave={handleSaveLLMConfig}
      />

      <SavedBanksModal
        isOpen={isSavedBanksOpen}
        onClose={() => setIsSavedBanksOpen(false)}
        banks={savedBanks}
        onSelectBank={handleSelectSavedBank}
        onDeleteBank={handleDeleteBank}
        onBankImported={handleBankImported}
      />

      {activeQuizBank && (
        <CoverageModal
          isOpen={isCoverageOpen}
          onClose={() => setIsCoverageOpen(false)}
          report={activeQuizBank.coverageReport}
        />
      )}

      {/* Study Group Modal */}
      <StudyGroupModal
        isOpen={isStudyGroupOpen}
        onClose={() => {
          setIsStudyGroupOpen(false);
          setActiveGroupState(getActiveGroupId());
        }}
        savedBanks={savedBanks}
        onSelectQuiz={handleQuizReady}
        onBankSaved={(bank) => setSavedBanks(getSavedQuizBanks())}
      />

      {/* Admin Dashboard Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      {/* Modern Custom Alert Dialog ("Ô OK") */}
      <CustomAlertDialog
        data={alertDialog}
        onClose={() => setAlertDialog(null)}
      />
    </div>
  );
}

export default App;
