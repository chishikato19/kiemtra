
import React from 'react';
import { Quiz, StudentSubmission, QuestionType } from '../../types';
import { QuestionRenderer } from '../student/QuestionRenderer';

interface SubmissionDetailModalProps {
  submission: StudentSubmission;
  quiz: Quiz;
  onClose: () => void;
  onPrint: () => void;
}

export const SubmissionDetailModal: React.FC<SubmissionDetailModalProps> = ({ submission, quiz, onClose, onPrint }) => {
  const checkAnswer = (qIdx: number) => {
    const q = quiz.questions[qIdx];
    const ans = submission.answers[qIdx];
    
    if (q.type === QuestionType.MULTIPLE_CHOICE) return ans === q.correctAnswer;
    if (q.type === QuestionType.TRUE_FALSE) return ans === q.trueFalseAnswer;
    if (q.type === QuestionType.SHORT_ANSWER) return String(ans).trim().toLowerCase() === String(q.shortAnswerText).trim().toLowerCase();
    if (q.type === QuestionType.MATCHING) {
       return (ans as number[] || []).filter((v, i) => v === i).length === (q.matchingPairs?.length || 0);
    }
    return false;
  };

  const getCorrectAnswerText = (qIdx: number) => {
    const q = quiz.questions[qIdx];
    if (q.type === QuestionType.MULTIPLE_CHOICE) return `Đáp án đúng: ${String.fromCharCode(65 + q.correctAnswer)} - ${q.options[q.correctAnswer]}`;
    if (q.type === QuestionType.TRUE_FALSE) return `Đáp án đúng: ${q.trueFalseAnswer ? 'ĐÚNG' : 'SAI'}`;
    if (q.type === QuestionType.SHORT_ANSWER) return `Đáp án đúng: ${q.shortAnswerText}`;
    if (q.type === QuestionType.MATCHING) return "Đáp án đúng: Khớp toàn bộ các cặp vế tương ứng.";
    return "";
  };

  return (
    <div className="fixed inset-0 z-[400] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden fade-in border-4 border-indigo-600">
        <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">📝</div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight italic">Bài làm của {submission.studentName}</h3>
              <p className="text-[10px] font-bold opacity-80 uppercase">Lớp: {submission.studentClass} • Điểm: {submission.score.toFixed(1)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onPrint} className="px-6 py-2 bg-white text-indigo-600 rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-slate-100 transition-all flex items-center gap-2">
              🖨️ In PDF
            </button>
            <button onClick={onClose} className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-slate-50">
          <div className="grid md:grid-cols-3 gap-6">
             <div className="bg-white p-6 rounded-3xl border shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Thời gian thi</p>
                <p className="font-bold text-slate-700">{submission.timeTaken} giây</p>
             </div>
             <div className="bg-white p-6 rounded-3xl border shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Nộp lúc</p>
                <p className="font-bold text-slate-700">{new Date(submission.submittedAt).toLocaleString('vi-VN')}</p>
             </div>
             <div className="bg-white p-6 rounded-3xl border shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Xếp hạng</p>
                <p className="font-bold text-indigo-600 italic">Đã lưu trữ</p>
             </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-4">Chi tiết từng câu hỏi</h4>
            {quiz.questions.map((q, idx) => {
              const isCorrect = checkAnswer(idx);
              return (
                <div key={idx} className={`bg-white p-8 rounded-[2.5rem] border-2 transition-all ${isCorrect ? 'border-emerald-100 bg-emerald-50/10' : 'border-rose-100 bg-rose-50/10'}`}>
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-1.5 rounded-xl font-black text-[10px] uppercase ${isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                        Câu {idx + 1}: {isCorrect ? 'ĐÚNG' : 'SAI'}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 uppercase">{q.points} điểm</span>
                    </div>
                  </div>
                  
                  <div className="prose prose-indigo max-w-none mb-8 text-lg font-bold text-slate-800" dangerouslySetInnerHTML={{ __html: q.text }} />
                  
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-inner mb-4">
                    <p className="text-[10px] font-black text-slate-300 uppercase mb-4 tracking-widest">Học sinh đã chọn/nhập:</p>
                    <QuestionRenderer 
                      question={q} 
                      userAnswer={submission.answers[idx]} 
                      onSelect={() => {}} 
                      disabled={true} 
                    />
                  </div>

                  {!isCorrect && (
                    <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <p className="text-xs font-black text-emerald-700 italic">💡 {getCorrectAnswerText(idx)}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-8 bg-white border-t flex justify-center">
          <button onClick={onClose} className="px-16 py-5 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase text-sm hover:bg-slate-200 transition-all">Đóng bảng chi tiết</button>
        </div>
      </div>
    </div>
  );
};
