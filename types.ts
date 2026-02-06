
export enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export enum QuizMode {
  TEST = 'TEST',
  PRACTICE = 'PRACTICE'
}

export enum PracticeType {
  STEP_BY_STEP = 'STEP_BY_STEP', 
  REVIEW_END = 'REVIEW_END'      
}

export enum ScoreType {
  EVEN = 'EVEN',
  MANUAL = 'MANUAL'
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  SHORT_ANSWER = 'SHORT_ANSWER',
  TRUE_FALSE = 'TRUE_FALSE',
  MATCHING = 'MATCHING'
}

export interface MatchingPair {
  left: string;
  right: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  partId: string; 
  partTitle?: string;
  text: string; 
  options: string[]; // Dùng cho MCQ
  correctAnswer: number; // Dùng cho MCQ (index)
  trueFalseAnswer?: boolean; // Dùng cho TRUE_FALSE
  shortAnswerText?: string; // Dùng cho SHORT_ANSWER
  matchingPairs?: MatchingPair[]; // Dùng cho MATCHING
  points: number; 
  isFixed?: boolean; 
}

export interface AppConfig {
  globalWebhookUrl: string;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

export interface Quiz {
  id: string;
  title: string;
  classId: string;
  mode: QuizMode;
  practiceType?: PracticeType;
  questions: Question[];
  createdAt: number;
  timeLimit?: number; 
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean; 
  isLocked?: boolean; 
  scoreType: ScoreType; 
  totalScore: number; 
  folderId?: string;
}

export interface StudentSubmission {
  id: string;
  quizId: string;
  studentName: string;
  studentClass: string;
  score: number;
  totalQuestions: number;
  answers: any[]; // Có thể là number, string hoặc array (cho matching)
  submittedAt: number;
  startTime: number;
  timeTaken: number; 
}
