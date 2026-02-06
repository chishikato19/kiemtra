
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
  points: number; // Điểm số cho từng câu hỏi
}

export interface Quiz {
  id: string;
  title: string;
  classId: string;
  mode: QuizMode;
  practiceType?: PracticeType;
  questions: Question[];
  createdAt: number;
  timeLimit?: number; // Phút, 0 là không giới hạn
  shuffleQuestions?: boolean;
  isLocked?: boolean; // Khóa/Mở khóa đề thi
  scoreType: ScoreType; // Kiểu tính điểm
  totalScore: number; // Tổng điểm kỳ vọng (thường là 10 hoặc 100)
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
