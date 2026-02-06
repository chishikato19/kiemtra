
import React, { useState, useEffect } from 'react';
/* Added QuestionType to the import list from types.ts */
import { Quiz, QuizMode, PracticeType, Question, ScoreType, QuestionType } from '../../types';
import { parseWordFile } from '../../services/parserService';
import { storageService } from '../../services/storageService';
import { QuestionEditor } from './QuestionEditor';

interface QuizCreateFormProps {
  onSuccess: () => void;
  quizToEdit?: Quiz;
}

export const QuizCreateForm: React.FC<QuizCreateFormProps> = ({ onSuccess, quizToEdit }) => {
  const [isParsing, setIsParsing] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [parseStatus, setParseStatus] = useState<{ type: 'idle' | 'success' | 'error', message?: string }>({ type: 'idle' });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const [formData, setFormData] = useState<Partial<Quiz>>({
    mode: QuizMode.TEST,
    practiceType: PracticeType.REVIEW_END,
    timeLimit: 0,
    shuffleQuestions: true,
    shuffleOptions: true,
    scoreType: ScoreType.EVEN,
    totalScore: 10,
    questions: []
  });

  useEffect(() => {
    if (quizToEdit) setFormData(quizToEdit);
  }, [quizToEdit]);

  useEffect(() => {
    if (formData.scoreType === ScoreType.EVEN && formData.questions?.length) {
      const questionsCount = formData.questions.length;
      const pointPerQuestion = parseFloat((formData.totalScore! / questionsCount).toFixed(2));
      const updatedQuestions = formData.questions.map((q, idx) => ({
        ...q,
        points: idx === questionsCount - 1 
          ? parseFloat((formData.totalScore! - (pointPerQuestion * (questionsCount - 1))).toFixed(2))
          : pointPerQuestion
      }));
      if (JSON.stringify(updatedQuestions.map(q => q.points)) !== JSON.stringify(formData.questions.map(q => q.points))) {
        setFormData(prev => ({ ...prev, questions: updatedQuestions }));
      }
    }
  }, [formData.scoreType, formData.totalScore, formData.questions?.length]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    setParseStatus({ type: 'idle' });
    try {
      const result = await parseWordFile(file);
      setFormData(prev => ({
        ...prev,
        title: prev.title || result.title,
        questions: [...(prev.questions || []), ...result.questions]
      }));
      setParseStatus({ type: 'success', message: `Đã nạp ${result.questions.length} câu hỏi thành công!` });
    } catch (err: any) {
      setParseStatus({ type: 'error', message: err.message || "Lỗi định dạng file hoặc nội dung." });
    } finally {
      setIsParsing(false);
      e.target.value = '';
    }
  };

  const handleSaveQuestion = (q: Question) => {
    const updated = [...(formData.questions || [])];
    if (editingIndex !== null) updated[editingIndex] = q;
    else updated.push(q);
    setFormData({ ...formData, questions: updated });
    setEditingIndex(null);
    setIsAddingNew(false);
  };

  const saveQuiz = () => {
    if (!formData.title || !formData.classId || !formData.questions?.length) {
      alert("Vui lòng nhập đủ thông tin và có ít nhất 1 câu hỏi!");
      return;
    }
    const finalQuiz: Quiz = {
      ...formData,
      id: formData.id || `q-${Date.now()}`,
      createdAt: formData.createdAt || Date.now(),
      totalScore: formData.scoreType === ScoreType.EVEN ? formData.totalScore! : formData.questions.reduce((a, q) => a + (q.points || 0), 0)
    } as Quiz;
    storageService.saveQuiz(finalQuiz);
    onSuccess();
  };

  return (
    <div className="bg-white p-10 rounded-[3rem] border shadow-2xl space-y-8 fade-in relative">
      {isParsing && (
        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-black text-indigo-600 uppercase tracking-widest">Đang bóc tách đề thi...</p>
        </div>
      )}

      <div className="flex justify-between items-center border-b pb-6">
        <h3 className="text-2xl font-black text-indigo-600 tracking-tight uppercase">THIẾT LẬP ĐỀ THI</h3>
        <button onClick={() => setShowHelp(true)} className="text-[10px] font-black text-indigo-600 border-2 border-indigo-100 px-5 py-2 rounded-full uppercase hover:bg-indigo-50 transition-all">📘 Hướng dẫn soạn File Word</button>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Tên đề thi</label>
          <input type="text" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border-2 p-4 rounded-2xl font-bold bg-slate-50 focus:bg-white outline-none focus:border-indigo-600 transition-all" placeholder="Tên đề thi" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Mã lớp</label>
          <input type="text" value={formData.classId || ''} onChange={e => setFormData({...formData, classId: e.target.value})} className="w-full border-2 p-4 rounded-2xl font-bold bg-slate-50 focus:bg-white outline-none focus:border-indigo-600 transition-all" placeholder="Lớp (VD: 12A1)" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Chế độ</label>
          <select className="w-full border-2 p-4 rounded-2xl font-bold bg-slate-50" value={formData.mode} onChange={e => setFormData({...formData, mode: e.target.value as QuizMode})}>
            <option value={QuizMode.TEST}>Kỳ thi (Tập trung)</option>
            <option value={QuizMode.PRACTICE}>Luyện tập (Tự do)</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Thời gian (Phút)</label>
          <input type="number" value={formData.timeLimit || 0} onChange={e => setFormData({...formData, timeLimit: parseInt(e.target.value) || 0})} className="w-full border-2 p-4 rounded-2xl font-bold bg-slate-50" placeholder="0 = Vô hạn" />
        </div>
        <div className="flex items-center h-[60px] bg-slate-50 rounded-2xl px-4 border-2 border-transparent mt-5">
          <input type="checkbox" checked={formData.shuffleQuestions} onChange={e => setFormData({...formData, shuffleQuestions: e.target.checked})} className="w-5 h-5 accent-indigo-600" id="shuffle-q" />
          <label htmlFor="shuffle-q" className="ml-3 font-bold text-slate-600 text-xs cursor-pointer">Đảo câu hỏi (Trừ 📌)</label>
        </div>
        <div className="flex items-center h-[60px] bg-slate-50 rounded-2xl px-4 border-2 border-transparent mt-5">
          <input type="checkbox" checked={formData.shuffleOptions} onChange={e => setFormData({...formData, shuffleOptions: e.target.checked})} className="w-5 h-5 accent-indigo-600" id="shuffle-opt" />
          <label htmlFor="shuffle-opt" className="ml-3 font-bold text-slate-600 text-xs cursor-pointer">Đảo đáp án (MCQ)</label>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-black text-slate-700 uppercase tracking-widest text-[10px]">Câu hỏi trong đề ({formData.questions?.length || 0})</h4>
          <div className="flex gap-2">
            <label className="cursor-pointer bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              NẠP TỪ FILE WORD
              <input type="file" accept=".docx" className="hidden" onChange={handleFileUpload} />
            </label>
            <button onClick={() => setIsAddingNew(true)} className="bg-slate-100 text-slate-600 px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all">+ THÊM CÂU THỦ CÔNG</button>
          </div>
        </div>

        {parseStatus.type !== 'idle' && (
          <div className={`p-5 rounded-2xl text-[10px] font-black uppercase flex items-center gap-3 animate-bounce ${parseStatus.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
            <span className="text-xl">{parseStatus.type === 'success' ? '✓' : '⚠️'}</span>
            {parseStatus.message}
          </div>
        )}

        <div className="space-y-3 max-h-[450px] overflow-y-auto pr-3 custom-scrollbar">
          {formData.questions?.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed rounded-[2.5rem] bg-slate-50/50">
               <p className="text-slate-400 font-bold italic">Chưa có câu hỏi nào. Hãy nạp file Word hoặc thêm mới.</p>
            </div>
          ) : formData.questions?.map((q, idx) => (
            <div key={idx} className="bg-white border-2 border-slate-50 p-5 rounded-2xl flex justify-between items-start hover:border-indigo-100 transition-all group shadow-sm">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-indigo-600 text-white font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-tighter">Câu {idx + 1}</span>
                  <span className="bg-slate-100 text-slate-400 font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-tighter">{q.partId}</span>
                  {q.isFixed && <span className="bg-amber-100 text-amber-600 font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-tighter">📌 CỐ ĐỊNH</span>}
                  <span className={`font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-tighter ${
                    q.type === 'MULTIPLE_CHOICE' ? 'bg-indigo-50 text-indigo-600' :
                    q.type === 'TRUE_FALSE' ? 'bg-emerald-50 text-emerald-600' :
                    q.type === 'MATCHING' ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {q.type === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm' : 
                     q.type === 'TRUE_FALSE' ? 'Đúng/Sai' : 
                     q.type === 'MATCHING' ? 'Ghép nối' : 'Trả lời ngắn'}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-600 line-clamp-2" dangerouslySetInnerHTML={{ __html: q.text }} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditingIndex(idx)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl" title="Chỉnh sửa">✏️</button>
                <button onClick={() => { const u = [...formData.questions!]; u.splice(idx,1); setFormData({...formData, questions:u}); }} className="p-2 text-red-400 hover:bg-red-50 rounded-xl" title="Xóa">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={saveQuiz} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xl shadow-xl hover:bg-indigo-700 uppercase tracking-tighter transition-all hover:scale-[1.01] active:scale-95">Lưu và Phát hành Đề thi ngay</button>

      {showHelp && (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
               <h3 className="text-2xl font-black uppercase italic tracking-tighter">Hướng dẫn chuẩn hóa File Word</h3>
               <button onClick={() => setShowHelp(false)} className="p-2 bg-white/20 rounded-full hover:bg-white/40">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
              <section className="space-y-4">
                <h4 className="font-black text-indigo-600 uppercase text-xs tracking-widest border-l-4 border-indigo-600 pl-3">1. Cấu trúc câu hỏi</h4>
                <div className="bg-slate-900 p-6 rounded-3xl font-mono text-xs leading-relaxed text-emerald-400 shadow-inner">
                  Câu 1: Thủ đô của Việt Nam là gì?<br/>
                  A. Hà Nội<br/>
                  B. Đà Nẵng<br/>
                  C. TP.HCM<br/>
                  D. Cần Thơ<br/><br/>
                  Câu 2: Năm 2024 là năm nhuận, đúng hay sai?<br/>
                  Câu 3: Ai là người phát minh ra bóng đèn?
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="font-black text-indigo-600 uppercase text-xs tracking-widest border-l-4 border-indigo-600 pl-3">2. Bảng đáp án (Đặt ở cuối file)</h4>
                <p className="text-xs text-slate-500 font-medium">Hệ thống dựa vào đây để phân loại câu hỏi tự động:</p>
                <div className="bg-indigo-50 p-6 rounded-3xl font-mono text-xs leading-relaxed text-indigo-600 border border-indigo-100">
                  <b className="uppercase">ĐÁP ÁN</b><br/>
                  1-A, 2-Đ, 3-Edison, 4-S, 15-(1-a, 2-c, 3-b)
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white border p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Trắc nghiệm</p>
                      <p className="text-xs font-bold text-slate-700">Ghi A, B, C hoặc D</p>
                   </div>
                   <div className="bg-white border p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Đúng / Sai</p>
                      <p className="text-xs font-bold text-slate-700">Ghi Đ (hoặc T) / S (hoặc F)</p>
                   </div>
                   <div className="bg-white border p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Trả lời ngắn</p>
                      <p className="text-xs font-bold text-slate-700">Ghi nội dung đáp án cụ thể</p>
                   </div>
                   <div className="bg-white border p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Ghép nối</p>
                      <p className="text-xs font-bold text-slate-700">Ghi cặp trong ngoặc (1-a, 2-b)</p>
                   </div>
                </div>
              </section>
            </div>
            <div className="p-8 bg-slate-50 border-t flex justify-center">
              <button onClick={() => setShowHelp(false)} className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl">Đã hiểu quy tắc</button>
            </div>
          </div>
        </div>
      )}

      {(editingIndex !== null || isAddingNew) && (
        <QuestionEditor 
          question={editingIndex !== null ? formData.questions![editingIndex] : { id: `q-${Date.now()}`, points: 0, partId: 'part-1', isFixed: false, type: QuestionType.MULTIPLE_CHOICE }}
          onSave={handleSaveQuestion}
          onCancel={() => { setEditingIndex(null); setIsAddingNew(false); }}
          isManualScore={formData.scoreType === ScoreType.MANUAL}
        />
      )}
    </div>
  );
};
