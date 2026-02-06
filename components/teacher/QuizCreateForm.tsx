
import React, { useState, useEffect } from 'react';
import { Quiz, QuizMode, PracticeType, Question, ScoreType } from '../../types';
import { parseWordFile } from '../../services/parserService';
import { storageService } from '../../services/storageService';
import { QuestionEditor } from './QuestionEditor';

interface QuizCreateFormProps {
  onSuccess: () => void;
  quizToEdit?: Quiz;
}

export const QuizCreateForm: React.FC<QuizCreateFormProps> = ({ onSuccess, quizToEdit }) => {
  const [isParsing, setIsParsing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const [formData, setFormData] = useState<Partial<Quiz>>({
    mode: QuizMode.TEST,
    practiceType: PracticeType.REVIEW_END,
    timeLimit: 0,
    shuffleQuestions: true,
    scoreType: ScoreType.EVEN,
    totalScore: 10,
    questions: []
  });

  useEffect(() => {
    if (quizToEdit) {
      setFormData(quizToEdit);
    }
  }, [quizToEdit]);

  // Tự động tính lại điểm khi thay đổi số câu hỏi hoặc tổng điểm trong chế độ EVEN
  useEffect(() => {
    if (formData.scoreType === ScoreType.EVEN && formData.questions?.length) {
      const questionsCount = formData.questions.length;
      const pointPerQuestion = parseFloat((formData.totalScore! / questionsCount).toFixed(2));
      
      const updatedQuestions = formData.questions.map((q, idx) => ({
        ...q,
        // Câu cuối gánh phần dư để tổng khớp chính xác
        points: idx === questionsCount - 1 
          ? parseFloat((formData.totalScore! - (pointPerQuestion * (questionsCount - 1))).toFixed(2))
          : pointPerQuestion
      }));
      
      // Chỉ cập nhật nếu có sự thay đổi thực sự để tránh loop vô tận
      const hasChanged = JSON.stringify(updatedQuestions.map(q => q.points)) !== JSON.stringify(formData.questions.map(q => q.points));
      if (hasChanged) {
        setFormData(prev => ({ ...prev, questions: updatedQuestions }));
      }
    }
  }, [formData.scoreType, formData.totalScore, formData.questions?.length]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const result = await parseWordFile(file);
      const newQuestions = result.questions.map(q => ({ ...q, points: 0 }));
      setFormData(prev => ({
        ...prev,
        title: prev.title || result.title,
        questions: [...(prev.questions || []), ...newQuestions]
      }));
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveQuestion = (q: Question) => {
    const updated = [...(formData.questions || [])];
    if (editingIndex !== null) {
      updated[editingIndex] = q;
    } else {
      updated.push(q);
    }
    setFormData({ ...formData, questions: updated });
    setEditingIndex(null);
    setIsAddingNew(false);
  };

  const deleteQuestion = (idx: number) => {
    if (confirm('Xóa câu hỏi này?')) {
      const updated = [...(formData.questions || [])];
      updated.splice(idx, 1);
      setFormData({ ...formData, questions: updated });
    }
  };

  const saveQuiz = () => {
    if (!formData.title || !formData.classId || !formData.questions?.length) {
      alert("Vui lòng nhập đủ tên đề, lớp và có ít nhất 1 câu hỏi!");
      return;
    }
    
    // Nếu là thủ công, tính lại tổng điểm
    let finalTotalScore = formData.totalScore || 10;
    if (formData.scoreType === ScoreType.MANUAL) {
      finalTotalScore = formData.questions.reduce((acc, q) => acc + (q.points || 0), 0);
    }

    const finalQuiz: Quiz = {
      ...formData,
      id: formData.id || `q-${Date.now()}`,
      createdAt: formData.createdAt || Date.now(),
      totalScore: finalTotalScore
    } as Quiz;
    
    storageService.saveQuiz(finalQuiz);
    onSuccess();
  };

  return (
    <div className="bg-white p-10 rounded-[3rem] border shadow-2xl space-y-8 fade-in">
      <div className="flex justify-between items-center border-b pb-6">
        <h3 className="text-2xl font-black text-indigo-600 tracking-tight">
          {quizToEdit ? 'CHỈNH SỬA ĐỀ THI' : 'THIẾT LẬP ĐỀ THI MỚI'}
        </h3>
        <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase">v2.5 Config</div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Tên đề thi / Môn học</label>
          <input 
            type="text" 
            value={formData.title || ''} 
            onChange={e => setFormData({...formData, title: e.target.value})}
            className="w-full border-2 p-4 rounded-2xl focus:border-indigo-600 outline-none transition-all font-bold bg-slate-50 focus:bg-white"
            placeholder="Ví dụ: Kiểm tra Giải tích Chương 1"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Mã lớp</label>
          <input 
            type="text" 
            value={formData.classId || ''} 
            onChange={e => setFormData({...formData, classId: e.target.value})}
            className="w-full border-2 p-4 rounded-2xl focus:border-indigo-600 outline-none transition-all font-bold bg-slate-50 focus:bg-white"
            placeholder="Ví dụ: 12A3"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Chế độ</label>
          <select 
            className="w-full border-2 p-4 rounded-2xl font-bold outline-none focus:border-indigo-600 bg-slate-50 focus:bg-white appearance-none"
            value={formData.mode}
            onChange={e => setFormData({...formData, mode: e.target.value as QuizMode})}
          >
            <option value={QuizMode.TEST}>Kỳ thi (Tập trung)</option>
            <option value={QuizMode.PRACTICE}>Luyện tập (Tự do)</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Thời gian (Phút)</label>
          <input 
            type="number" 
            value={formData.timeLimit || 0} 
            onChange={e => setFormData({...formData, timeLimit: parseInt(e.target.value) || 0})}
            className="w-full border-2 p-4 rounded-2xl focus:border-indigo-600 outline-none font-bold bg-slate-50 focus:bg-white"
            placeholder="0 = Không giới hạn"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Đảo câu hỏi</label>
          <div className="flex items-center h-[58px] bg-slate-50 rounded-2xl px-4 border-2 border-transparent">
             <input 
              type="checkbox" 
              checked={formData.shuffleQuestions} 
              onChange={e => setFormData({...formData, shuffleQuestions: e.target.checked})}
              className="w-5 h-5 accent-indigo-600"
              id="shuffle-toggle"
            />
            <label htmlFor="shuffle-toggle" className="ml-3 font-bold text-slate-600 cursor-pointer">Kích hoạt xáo trộn</label>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 space-y-6">
        <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest">Cấu hình điểm số</h4>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-3">Phương thức</label>
            <div className="flex bg-white p-1 rounded-xl border border-indigo-200">
              <button 
                onClick={() => setFormData({...formData, scoreType: ScoreType.EVEN})}
                className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${formData.scoreType === ScoreType.EVEN ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-400'}`}
              >
                Chia đều
              </button>
              <button 
                onClick={() => setFormData({...formData, scoreType: ScoreType.MANUAL})}
                className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${formData.scoreType === ScoreType.MANUAL ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-400'}`}
              >
                Tùy chỉnh
              </button>
            </div>
          </div>
          {formData.scoreType === ScoreType.EVEN && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-3">Tổng điểm mong muốn</label>
              <input 
                type="number" 
                value={formData.totalScore || 10} 
                onChange={e => setFormData({...formData, totalScore: parseFloat(e.target.value) || 0})}
                className="w-full border-2 p-3 rounded-xl focus:border-indigo-600 outline-none font-bold bg-white"
              />
            </div>
          )}
          {formData.scoreType === ScoreType.MANUAL && (
            <div className="flex items-center pt-6 px-4">
              <div className="text-indigo-900 font-bold">
                Tự động tính tổng: <span className="text-2xl font-black">{(formData.questions || []).reduce((acc, q) => acc + (q.points || 0), 0).toFixed(1)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-black text-slate-700 uppercase tracking-widest text-[10px]">Quản lý câu hỏi ({formData.questions?.length || 0})</h4>
          <div className="flex gap-2">
            <label className="cursor-pointer bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-tighter hover:bg-slate-200 transition-all flex items-center gap-2">
              <span>{isParsing ? 'ĐANG XỬ LÝ...' : '📂 TỪ FILE WORD'}</span>
              <input type="file" accept=".docx" className="hidden" onChange={handleFileUpload} />
            </label>
            <button 
              onClick={() => setIsAddingNew(true)}
              className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-tighter hover:bg-indigo-100 transition-all"
            >
              + THỦ CÔNG
            </button>
          </div>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
          {formData.questions?.length === 0 ? (
            <div className="bg-slate-50 border-2 border-dashed rounded-[2rem] p-12 text-center text-slate-400 font-medium italic">
              Danh sách câu hỏi đang trống...
            </div>
          ) : (
            formData.questions?.map((q, idx) => (
              <div key={idx} className="bg-white border-2 border-slate-50 p-5 rounded-2xl flex justify-between items-start group hover:border-indigo-100 transition-all shadow-sm">
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="bg-indigo-600 text-white font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-widest">Câu {idx + 1}</span>
                    <span className="bg-emerald-50 text-emerald-600 font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-widest">ĐÁP ÁN: {String.fromCharCode(65 + q.correctAnswer)}</span>
                    <span className="bg-amber-100 text-amber-600 font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-widest">Điểm: {q.points}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-600 truncate prose-sm" dangerouslySetInnerHTML={{ __html: q.text }} />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditingIndex(idx)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.6} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => deleteQuestion(idx)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.6} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <button 
        onClick={saveQuiz}
        className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xl shadow-xl hover:shadow-2xl hover:bg-indigo-700 transition-all active:scale-[0.98] uppercase tracking-tighter"
      >
        {quizToEdit ? 'CẬP NHẬT ĐỀ THI' : 'LƯU VÀ PHÁT HÀNH ĐỀ THI'}
      </button>

      {(editingIndex !== null || isAddingNew) && (
        <QuestionEditor 
          question={editingIndex !== null ? formData.questions![editingIndex] : { id: `q-${Date.now()}`, points: formData.scoreType === ScoreType.EVEN ? 0 : 1 }}
          onSave={handleSaveQuestion}
          onCancel={() => { setEditingIndex(null); setIsAddingNew(false); }}
          isManualScore={formData.scoreType === ScoreType.MANUAL}
        />
      )}
    </div>
  );
};
