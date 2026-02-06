
import { Quiz, QuizMode, PracticeType, StudentSubmission, ScoreType, AppConfig } from "../types";

const KEY_QUIZZES = 'qm_quizzes';
const KEY_SUBMISSIONS = 'qm_submissions';
const KEY_CONFIG = 'qm_global_config';

export const storageService = {
  getQuizzes: (): Quiz[] => {
    const data = localStorage.getItem(KEY_QUIZZES);
    return data ? JSON.parse(data) : [];
  },

  getQuizById: (id: string): Quiz | undefined => {
    return storageService.getQuizzes().find(q => q.id === id);
  },

  saveQuiz: (quiz: Quiz) => {
    const quizzes = storageService.getQuizzes();
    const index = quizzes.findIndex(q => q.id === quiz.id);
    if (index > -1) quizzes[index] = quiz;
    else quizzes.push(quiz);
    localStorage.setItem(KEY_QUIZZES, JSON.stringify(quizzes));
  },

  deleteQuiz: (id: string) => {
    const quizzes = storageService.getQuizzes().filter(q => q.id !== id);
    const submissions = storageService.getSubmissions().filter(s => s.quizId !== id);
    localStorage.setItem(KEY_SUBMISSIONS, JSON.stringify(submissions));
    localStorage.setItem(KEY_QUIZZES, JSON.stringify(quizzes));
  },

  getSubmissions: (quizId?: string): StudentSubmission[] => {
    const data = localStorage.getItem(KEY_SUBMISSIONS);
    const all: StudentSubmission[] = data ? JSON.parse(data) : [];
    return quizId ? all.filter(s => s.quizId === quizId) : all;
  },

  saveSubmission: (submission: StudentSubmission) => {
    const all = storageService.getSubmissions();
    all.push(submission);
    localStorage.setItem(KEY_SUBMISSIONS, JSON.stringify(all));
  },

  getAppConfig: (): AppConfig => {
    const data = localStorage.getItem(KEY_CONFIG);
    return data ? JSON.parse(data) : { globalWebhookUrl: '' };
  },

  saveAppConfig: (config: AppConfig) => {
    localStorage.setItem(KEY_CONFIG, JSON.stringify(config));
  },

  seedSampleData: () => {
    const sampleQuiz: Quiz = {
      id: 'sample-math-101',
      title: 'Đề thi mẫu: Toán học & Logic',
      classId: 'DEMO-101',
      mode: QuizMode.TEST,
      timeLimit: 15,
      shuffleQuestions: true,
      scoreType: ScoreType.EVEN,
      totalScore: 10,
      createdAt: Date.now(),
      questions: [
        {
          id: 'q-sample-1',
          text: '<p>Giải phương trình bậc hai sau: $x^2 - 5x + 6 = 0$. Giá trị của $x$ là:</p>',
          options: ['$x=1, x=6$', '$x=2, x=3$', '$x=-2, x=-3$', '$x=5, x=1$'],
          correctAnswer: 1,
          points: 3.33
        },
        {
          id: 'q-sample-2',
          text: '<p>Đạo hàm của hàm số $y = \sin(x)$ là gì?</p>',
          options: ['$\cos(x)$', '$-\cos(x)$', '$\tan(x)$', '$\sin^2(x)$'],
          correctAnswer: 0,
          points: 3.33
        },
        {
          id: 'q-sample-3',
          text: '<p>Ai là tác giả của thuyết tương đối?</p><img src="https://upload.wikimedia.org/wikipedia/commons/d/d3/Albert_Einstein_Head.jpg" class="w-32 h-auto my-2 rounded-lg" />',
          options: ['Isaac Newton', 'Marie Curie', 'Albert Einstein', 'Nikola Tesla'],
          correctAnswer: 2,
          points: 3.34
        }
      ]
    };
    
    const quizzes = storageService.getQuizzes();
    if (!quizzes.find(q => q.id === sampleQuiz.id)) {
      quizzes.push(sampleQuiz);
      localStorage.setItem(KEY_QUIZZES, JSON.stringify(quizzes));
      return true;
    }
    return false;
  }
};
