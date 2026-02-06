
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

export interface Question {
  id: string;
  text: string; 
  options: string[];
  correctAnswer: number; 
  points: number; 
}

export interface AppConfig {
  globalWebhookUrl: string; // Link duy nhất cho toàn bộ ứng dụng
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
  isLocked?: boolean; 
  scoreType: ScoreType; 
  totalScore: number; 
}

export interface StudentSubmission {
  id: string;
  quizId: string;
  studentName: string;
  studentClass: string;
  score: number;
  totalQuestions: number;
  answers: number[];
  submittedAt: number;
  timeTaken: number; 
}
