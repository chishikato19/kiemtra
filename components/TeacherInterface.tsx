
import React, { useState, useEffect } from 'react';
import { Quiz, QuizMode, PracticeType } from '../types';
import { storageService } from '../services/storageService';
import { parseWordFile } from '../services/parserService';

export const TeacherInterface: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [view, setView] = useState<'list' | 'create' | 'stats'>('list');
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  
  const [newQuiz, setNewQuiz] = useState<Partial<Quiz>>({
    mode: QuizMode.TEST,
    practiceType: PracticeType.REVIEW_END
  });
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => {
    setQuizzes(storageService.getQuizzes());
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const result = await parseWordFile(file);
      setNewQuiz(prev => ({
        ...prev,
        title: result.title,
        questions: result.questions
      }));
    } catch (err) {
      alert("Lỗi đọc file: " + err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSave = () => {
    if (!newQuiz.title || !newQuiz.questions || !newQuiz.classId) {
      alert("Vui lòng nhập đủ thông tin và tải đề!");
      return;
    }
    const fullQuiz = {
      ...newQuiz,
      id: `q-${Date.now()}`,
      createdAt: Date.now()
    } as Quiz;
    storageService.saveQuiz(fullQuiz);
    setQuizzes(storageService.getQuizzes());
    setView('list');
  };

  const copyLink = (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}#/quiz/${id}`;
    navigator.clipboard.writeText(url);
    alert("Đã sao chép link phòng thi!");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quản lý Đề thi</h2>
        <button 
          onClick={() => setView(view === 'create' ? 'list' : 'create')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold"
        >
          {view === 'create' ? 'Hủy' : '+ Tạo đề mới'}
        </button>
      </div>

      {view === 'list' && (
        <div className="grid gap-4">
          {quizzes.map(q => (
            <div key={q.id} className="bg-white p-5 rounded-xl border flex justify-between items-center shadow-sm">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{q.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${q.mode === QuizMode.TEST ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {q.mode === QuizMode.TEST ? 'Kiểm tra' : 'Luyện tập'}
                  </span>
                </div>
                <p className="text-sm text-slate-500">Lớp: {q.classId} • {q.questions.length} câu hỏi</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => copyLink(q.id)} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200">
                  🔗 Link
                </button>
                <button onClick={() => { storageService.deleteQuiz(q.id); setQuizzes(storageService.getQuizzes()); }} className="p-2 bg-red-50 text-red-600 rounded-lg">
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'create' && (
        <div className="bg-white p-6 rounded-xl border space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold">Tên đề thi</label>
              <input 
                type="text" 
                value={newQuiz.title || ''} 
                onChange={e => setNewQuiz({...newQuiz, title: e.target.value})}
                className="w-full border p-2 rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold">Lớp</label>
              <input 
                type="text" 
                placeholder="VD: 10A1"
                onChange={e => setNewQuiz({...newQuiz, classId: e.target.value})}
                className="w-full border p-2 rounded-lg"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold">Chế độ</label>
              <select 
                value={newQuiz.mode}
                onChange={e => setNewQuiz({...newQuiz, mode: e.target.value as QuizMode})}
                className="w-full border p-2 rounded-lg"
              >
                <option value={QuizMode.TEST}>Kiểm tra (Tính điểm, không hiện đáp án)</option>
                <option value={QuizMode.PRACTICE}>Luyện tập (Có giải thích/làm lại)</option>
              </select>
            </div>
            {newQuiz.mode === QuizMode.PRACTICE && (
              <div className="space-y-2">
                <label className="text-sm font-bold">Cách luyện tập</label>
                <select 
                  value={newQuiz.practiceType}
                  onChange={e => setNewQuiz({...newQuiz, practiceType: e.target.value as PracticeType})}
                  className="w-full border p-2 rounded-lg"
                >
                  <option value={PracticeType.STEP_BY_STEP}>Đúng mới cho qua câu tiếp</option>
                  <option value={PracticeType.REVIEW_END}>Làm hết mới biết đáp án</option>
                </select>
              </div>
            )}
          </div>

          <div className="border-2 border-dashed border-slate-200 p-8 text-center rounded-xl">
            {newQuiz.questions ? (
              <p className="text-green-600 font-bold">✓ Đã nhận {newQuiz.questions.length} câu hỏi từ file.</p>
            ) : (
              <div>
                <input type="file" accept=".docx" onChange={handleFileUpload} className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="cursor-pointer bg-indigo-50 text-indigo-600 px-6 py-3 rounded-xl font-bold inline-block hover:bg-indigo-100 transition-all">
                  {isParsing ? 'Đang đọc file...' : 'Tải file Word (.docx) lên'}
                </label>
                <p className="text-xs text-slate-400 mt-2 italic">Hỗ trợ đọc hình ảnh và công thức toán học.</p>
              </div>
            )}
          </div>

          <button onClick={handleSave} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg">
            Lưu và Phát hành
          </button>
        </div>
      )}
    </div>
  );
};
