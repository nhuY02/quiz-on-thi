export interface QuizQuestion {
  id: string;
  section: string;
  topic: string;
  question: string;
  options: [string, string, string, string] | string[];
  correctIndex: number;
  explanation: string;
  sourceRef: string;
  keyConcepts?: string[];
}

export interface DocumentSection {
  id: string;
  index: number;
  title: string;
  content: string;
  wordCount: number;
  pageRange?: string;
  keyConcepts: string[];
  coveredConcepts: string[];
  status: 'pending' | 'processing' | 'verifying' | 'completed' | 'error';
  error?: string;
  questions: QuizQuestion[];
}

export interface CoverageReport {
  totalConcepts: number;
  coveredConcepts: number;
  coveragePercentage: number;
  missingConcepts: { section: string; concept: string }[];
  allConcepts: { section: string; concept: string; covered: boolean }[];
}

export interface QuizConfig {
  mode: 'practice' | 'exam'; // 'practice' (Luyện tập - xem đáp án ngay) | 'exam' (Thi thử - nộp bài mới xem)
  selectedSectionIds: string[];
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
}

export interface SavedQuizBank {
  id: string;
  title: string;
  createdAt: string;
  fileName: string;
  fileSize: number;
  sections: DocumentSection[];
  questions: QuizQuestion[];
  coverageReport: CoverageReport;
}

export interface QuizSession {
  id: string;
  quizBankId: string;
  title: string;
  createdAt: string;
  config: QuizConfig;
  questions: QuizQuestion[];
  userAnswers: Record<string, number>; // questionId -> selectedIndex
  flaggedQuestions: Record<string, boolean>; // questionId -> boolean
  submitted: boolean;
  score?: number;
  timeSpentSeconds: number;
}

export type LLMProvider = 'gemini' | 'openai' | 'groq' | 'custom';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  customBaseUrl?: string;
}
