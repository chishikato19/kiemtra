
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
      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Đáp án của bạn:</label>
        <input 
          type="text" 
          className="w-full border-4 p-6 rounded-3xl font-black text-2xl outline-none focus:border-indigo-600 transition-all bg-slate-50 focus:bg-white"
          placeholder="Nhập câu trả lời..."
          value={String(currentAns || "")}
          onChange={(e) => onSelect(e.target.value)}
        />
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
