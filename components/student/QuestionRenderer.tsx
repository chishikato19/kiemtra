
import React from 'react';
import { Question, QuestionType } from '../../types';

interface QuestionRendererProps {
  question: Question;
  userAnswer: any;
  onSelect: (val: any) => void;
  disabled?: boolean; 
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({ question, userAnswer, onSelect, disabled = false }) => {
  const q = question;
  const currentAns = userAnswer;

  // 1. TRẮC NGHIỆM: Hiện nút chọn A, B, C, D
  if (q.type === QuestionType.MULTIPLE_CHOICE) {
    return (
      <div className="grid gap-3">
        {q.options.map((opt, idx) => (
          <button 
            key={idx} 
            disabled={disabled}
            onClick={() => onSelect(idx)} 
            className={`group flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${currentAns === idx ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-50 hover:bg-slate-50'} ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <span className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl transition-all ${currentAns === idx ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {String.fromCharCode(65 + idx)}
            </span>
            <span className={`flex-1 font-bold ${currentAns === idx ? 'text-indigo-900' : 'text-slate-600'}`} dangerouslySetInnerHTML={{ __html: opt }} />
          </button>
        ))}
      </div>
    );
  }

  // 2. ĐÚNG / SAI: Hiện 2 nút lớn Đúng và Sai
  if (q.type === QuestionType.TRUE_FALSE) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <button 
          disabled={disabled}
          onClick={() => onSelect(true)}
          className={`p-8 rounded-[2rem] border-4 flex flex-col items-center gap-2 transition-all ${currentAns === true ? 'border-emerald-500 bg-emerald-50 shadow-xl' : 'border-slate-100 bg-white hover:bg-slate-50'} ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <span className="text-4xl mb-2">{currentAns === true ? '✅' : '⚪'}</span>
          <span className={`font-black uppercase tracking-widest ${currentAns === true ? 'text-emerald-600' : 'text-slate-300'}`}>ĐÚNG</span>
        </button>
        <button 
          disabled={disabled}
          onClick={() => onSelect(false)}
          className={`p-8 rounded-[2rem] border-4 flex flex-col items-center gap-2 transition-all ${currentAns === false ? 'border-rose-500 bg-rose-50 shadow-xl' : 'border-slate-100 bg-white hover:bg-slate-50'} ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <span className="text-4xl mb-2">{currentAns === false ? '❌' : '⚪'}</span>
          <span className={`font-black uppercase tracking-widest ${currentAns === false ? 'text-rose-600' : 'text-slate-300'}`}>SAI</span>
        </button>
      </div>
    );
  }

  // 3. TRẢ LỜI NGẮN: CHỈ DUY NHẤT DẠNG NÀY MỚI HIỆN KHUNG NHẬP
  if (q.type === QuestionType.SHORT_ANSWER) {
    return (
      <div className="space-y-4 animate-fadeIn py-4">
        {!disabled && (
          <div className="flex items-center gap-2 ml-4">
            <span className="bg-indigo-600 w-2 h-2 rounded-full animate-pulse"></span>
            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Vui lòng nhập câu trả lời của bạn</label>
          </div>
        )}
        <div className="relative group">
          <input 
            type="text" 
            disabled={disabled}
            className={`w-full border-4 p-7 rounded-[2.5rem] font-bold text-2xl outline-none transition-all shadow-inner ${disabled ? 'bg-slate-100 border-slate-200 text-slate-500' : 'border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-600'}`}
            placeholder={disabled ? "" : "Nhập nội dung tại đây..."}
            value={String(currentAns !== null && currentAns !== undefined ? currentAns : "")}
            onChange={(e) => onSelect(e.target.value)}
          />
          {!disabled && (
            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2.5 2.5 0 113.536 3.536L12 17.207l-4 1 1-4 9.414-9.414z" />
              </svg>
            </div>
          )}
        </div>
        {!disabled && <p className="text-[10px] text-slate-400 italic ml-6 font-medium">Lưu ý: Hệ thống tự động so khớp đáp án (không phân biệt chữ HOA hay thường).</p>}
      </div>
    );
  }

  // 4. GHÉP NỐI: Hiện các select box
  if (q.type === QuestionType.MATCHING) {
    const handleMatchingSelect = (pairIdx: number, selectionIdx: number) => {
      if (disabled) return;
      const newMatchingAns = [...(currentAns || new Array(q.matchingPairs?.length).fill(-1))];
      newMatchingAns[pairIdx] = selectionIdx;
      onSelect(newMatchingAns);
    };

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-[1fr_1.2fr] gap-4 mb-2 px-4">
          <span className="text-[10px] font-black text-slate-400 uppercase">Cột A</span>
          <span className="text-[10px] font-black text-slate-400 uppercase">Chọn vế khớp ở Cột B</span>
        </div>
        {q.matchingPairs?.map((pair, pIdx) => (
          <div key={pIdx} className="flex gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex-1 font-bold text-slate-700 text-sm">{pair.left}</div>
            <div className="flex-1">
              <select 
                disabled={disabled}
                className={`w-full p-3 rounded-xl border-2 font-black text-xs appearance-none outline-none transition-all ${currentAns && currentAns[pIdx] !== -1 ? 'border-indigo-600 bg-white text-indigo-600' : 'border-transparent bg-slate-200 text-slate-400'}`}
                value={currentAns ? currentAns[pIdx] : -1}
                onChange={(e) => handleMatchingSelect(pIdx, parseInt(e.target.value))}
              >
                <option value="-1">-- Chọn --</option>
                {q.matchingPairs?.map((opt, oIdx) => (
                  <option key={oIdx} value={oIdx}>{opt.right}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
};
