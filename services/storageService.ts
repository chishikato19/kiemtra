
import { Quiz, QuizMode, PracticeType, StudentSubmission, ScoreType, AppConfig, Folder } from "../types";

const KEY_QUIZZES = 'qm_quizzes';
const KEY_SUBMISSIONS = 'qm_submissions';
const KEY_CONFIG = 'qm_global_config';
const KEY_FOLDERS = 'qm_folders';

export const storageService = {
  getQuizzes: (): Quiz[] => {
    const data = localStorage.getItem(KEY_QUIZZES);
    return data ? JSON.parse(data) : [];
  },

  getFolders: (): Folder[] => {
    const data = localStorage.getItem(KEY_FOLDERS);
    return data ? JSON.parse(data) : [];
  },

  saveFolder: (folder: Folder) => {
    const folders = storageService.getFolders();
    folders.push(folder);
    localStorage.setItem(KEY_FOLDERS, JSON.stringify(folders));
  },

  deleteFolder: (id: string) => {
    const folders = storageService.getFolders().filter(f => f.id !== id);
    localStorage.setItem(KEY_FOLDERS, JSON.stringify(folders));
    // Move quizzes in this folder to root
    const quizzes = storageService.getQuizzes().map(q => q.folderId === id ? { ...q, folderId: undefined } : q);
    localStorage.setItem(KEY_QUIZZES, JSON.stringify(quizzes));
  },

  getQuizById: (id: string): Quiz | undefined => {
    return storageService.getQuizzes().find(q => String(q.id) === String(id));
  },

  async getQuizFromCloud(quizId: string): Promise<Quiz | null> {
    const config = storageService.getAppConfig();
    if (!config.globalWebhookUrl) return null;

    try {
      const url = `${config.globalWebhookUrl}?action=getQuiz&quizId=${quizId}`;
      const response = await fetch(url);
      if (!response.ok) return null;
      
      const result = await response.json();
      if (result && result.id) {
        storageService.saveQuiz(result);
        return result;
      }
    } catch (err) {
      console.error("Lỗi tải đề từ Cloud Vault:", err);
    }
    return null;
  },

  async syncAllQuizzesFromCloud(): Promise<number> {
    const config = storageService.getAppConfig();
    if (!config.globalWebhookUrl) return 0;
    try {
      const url = `${config.globalWebhookUrl}?action=listQuizzes`;
      const response = await fetch(url);
      const cloudQuizzes: any[] = await response.json();
      
      let count = 0;
      const localQuizzes = storageService.getQuizzes();

      for (const mq of cloudQuizzes) {
        if (!localQuizzes.find(lq => String(lq.id) === String(mq.id))) {
           const fullQuiz = await storageService.getQuizFromCloud(mq.id);
           if (fullQuiz) count++;
        }
      }
      return count;
    } catch (err) {
      console.error("Lỗi đồng bộ danh mục đề từ Drive:", err);
      return 0;
    }
  },

  async syncResultsFromCloud(quizId: string): Promise<number> {
    const config = storageService.getAppConfig();
    if (!config.globalWebhookUrl) return 0;
    try {
      const url = `${config.globalWebhookUrl}?action=getResults&quizId=${quizId}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Cloud response error");
      
      const cloudResults: StudentSubmission[] = await response.json();
      if (!Array.isArray(cloudResults)) return 0;
      
      const localSubmissions = storageService.getSubmissions();
      let newCount = 0;
      
      cloudResults.forEach(cs => {
        // So khớp ID bài nộp để không lưu trùng
        if (!localSubmissions.find(ls => String(ls.id) === String(cs.id))) {
          localSubmissions.push(cs);
          newCount++;
        }
      });
      
      localStorage.setItem(KEY_SUBMISSIONS, JSON.stringify(localSubmissions));
      return newCount;
    } catch (err) {
      console.error("Lỗi đồng bộ bài làm từ Drive Vault:", err);
      return 0;
    }
  },

  saveQuiz: (quiz: Quiz) => {
    const quizzes = storageService.getQuizzes();
    const index = quizzes.findIndex(q => String(q.id) === String(quiz.id));
    if (index > -1) quizzes[index] = quiz;
    else quizzes.push(quiz);
    localStorage.setItem(KEY_QUIZZES, JSON.stringify(quizzes));
  },

  deleteQuiz: (id: string) => {
    const quizzes = storageService.getQuizzes().filter(q => String(q.id) !== String(id));
    const submissions = storageService.getSubmissions().filter(s => String(s.quizId) !== String(id));
    localStorage.setItem(KEY_SUBMISSIONS, JSON.stringify(submissions));
    localStorage.setItem(KEY_QUIZZES, JSON.stringify(quizzes));
  },

  getSubmissions: (quizId?: string): StudentSubmission[] => {
    const data = localStorage.getItem(KEY_SUBMISSIONS);
    const all: StudentSubmission[] = data ? JSON.parse(data) : [];
    return quizId ? all.filter(s => String(s.quizId) === String(quizId)) : all;
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
  }
};
