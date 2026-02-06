
import React from 'react';
import { Question, QuestionType } from '../../types';

interface QuestionRendererProps {
  question: Question;
  userAnswer: any;
  onSelect: (val: any) => void;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({ question, userAnswer, onSelect }) => {
  const q = question;
  const currentAns = userAnswer;

  if (q.type === QuestionType.MULTIPLE_CHOICE) {
    return (
      <div className="grid gap-3">
        {q.options.map((opt, idx) => (
          <button 
            key={idx} 
            onClick={() => onSelect(idx)} 
            className={`group flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${currentAns === idx ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-50 hover:bg-slate-50'}`}
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

  if (q.type === QuestionType.TRUE_FALSE) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => onSelect(true)}
          className={`p-8 rounded-[2rem] border-4 flex flex-col items-center gap-2 transition-all ${currentAns === true ? 'border-emerald-500 bg-emerald-50 shadow-xl' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
        >
          <span className="text-4xl mb-2">{currentAns === true ? '✅' : '⚪'}</span>
          <span className={`font-black uppercase tracking-widest ${currentAns === true ? 'text-emerald-600' : 'text-slate-300'}`}>ĐÚNG</span>
        </button>
        <button 
          onClick={() => onSelect(false)}
          className={`p-8 rounded-[2rem] border-4 flex flex-col items-center gap-2 transition-all ${currentAns === false ? 'border-rose-500 bg-rose-50 shadow-xl' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
        >
          <span className="text-4xl mb-2">{currentAns === false ? '❌' : '⚪'}</span>
          <span className={`font-black uppercase tracking-widest ${currentAns === false ? 'text-rose-600' : 'text-slate-300'}`}>SAI</span>
        </button>
      </div>
    );
  }

  if (q.type === QuestionType.SHORT_ANSWER) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-4 bg-indigo-50 px-3 py-1 rounded-full">Đáp án của bạn</label>
        <div className="relative">
          <input 
            type="text" 
            className="w-full border-4 border-slate-100 p-6 rounded-3xl font-bold text-xl outline-none focus:border-indigo-600 transition-all bg-slate-50 focus:bg-white shadow-inner"
            placeholder="Nhập nội dung trả lời tại đây..."
            value={String(currentAns || "")}
            onChange={(e) => onSelect(e.target.value)}
            autoFocus
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 italic ml-4">* Hệ thống sẽ tự động so khớp đáp án (không phân biệt hoa/thường).</p>
      </div>
    );
  }

  if (q.type === QuestionType.MATCHING) {
    const handleMatchingSelect = (pairIdx: number, selectionIdx: number) => {
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
