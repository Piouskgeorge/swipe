export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  position?: string;
  resumeText?: string;
  resumeFile?: File;
  resumeData?: any;
  score?: number;
  summary?: string;
  status: 'pending' | 'uploading' | 'interviewing' | 'completed' | 'paused' | 'terminated';
  createdAt: Date;
  startedAt: Date; // For compatibility with existing components
  completedAt?: Date;
  finalScore?: number;
  finalReport?: any;
  responses?: any[];
  questions?: any[];
  violations?: any[];
}

export interface Question {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number; // in seconds
  category: string;
}

export interface Answer {
  questionId: string;
  answer: string;
  timeSpent: number;
  score?: number;
  feedback?: string;
  timestamp: Date;
}

export interface Interview {
  id: string;
  candidateId: string;
  questions: Question[];
  answers: Answer[];
  currentQuestionIndex: number;
  startTime?: Date;
  endTime?: Date;
  isPaused: boolean;
  pausedAt?: Date;
  totalScore?: number;
  finalSummary?: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  questionId?: string;
  isQuestion?: boolean;
}

export interface InterviewSession {
  candidate: Candidate;
  interview: Interview;
  chatHistory: ChatMessage[];
  isActive: boolean;
}

export type TimerStatus = 'running' | 'paused' | 'stopped' | 'completed';

export interface AppState {
  candidates: Candidate[];
  interviews: { [candidateId: string]: Interview };
  currentSession: InterviewSession | null;
  chatHistories: { [candidateId: string]: ChatMessage[] };
  activeTab: 'interviewee' | 'interviewer';
  isLoading: boolean;
  error: string | null;
}