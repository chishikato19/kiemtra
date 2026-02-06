
import React, { useState, useEffect } from 'react';
import { Question, QuestionType, MatchingPair } from '../../types';

interface QuestionEditorProps {
  question: Partial<Question>;
  onSave: (q: Question) => void;
  onCancel: () => void;
  isManualScore?: boolean;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({ question, onSave, onCancel, isManualScore }) => {
  const [edited, setEdited] = useState<Partial<Question>>({
    type: QuestionType.MULTIPLE_CHOICE,
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    points: 1,
    isFixed: false,
    matchingPairs: [{ left: '', right: '' }],
    trueFalseAnswer: true,
    ...question
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const imgTag = `<img src="${base64}" alt="quiz-img" class="max-w-full h-auto my-2 rounded-lg shadow-sm" />`;
      setEdited({ ...edited, text: (edited.text || '') + imgTag });
    };
    reader.readAsDataURL(file);
  };

  const addMatchingPair = () => {
    setEdited({
      ...edited,
      matchingPairs: [...(edited.matchingPairs || []), { left: '', right: '' }]
    });
  };

  const removeMatchingPair = (index: number) => {
    const pairs = [...(edited.matchingPairs || [])];
    pairs.splice(index, 1);
    setEdited({ ...edited, matchingPairs: pairs });
  };

  const updateMatchingPair = (index: number, field: 'left' | 'right', value: string) => {
    const pairs = [...(edited.matchingPairs || [])];
    pairs[index] = { ...pairs[index], [field]: value };
    setEdited({ ...edited, matchingPairs: pairs });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden fade-in">
        <div className="p-6 border-b flex justify-between items-center bg-indigo-50">
          <h3 className="text-xl font-black text-indigo-600 uppercase tracking-tight">Biên tập câu hỏi</h3>
          <div className="flex bg-white p-1 rounded-2xl border gap-1">
            {(Object.values(QuestionType) as QuestionType[]).map(t => (
              <button 
                key={t}
                onClick={() => setEdited({...edited, type: t})}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${edited.type === t ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                {t === QuestionType.MULTIPLE_CHOICE ? 'Trắc nghiệm' : 
                 t === QuestionType.TRUE_FALSE ? 'Đúng/Sai' : 
                 t === QuestionType.MATCHING ? 'Ghép nối' : 'Trả lời ngắn'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Nội dung câu hỏi</label>
                  <label className="cursor-pointer text-[10px] bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full font-black uppercase hover:bg-indigo-200">
                    + Thêm ảnh
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
                <textarea 
                  className="w-full border-2 p-4 rounded-2xl min-h-[120px] font-bold text-sm outline-none focus:border-indigo-600 transition-all bg-slate-50"
                  value={edited.text}
                  onChange={e => setEdited({...edited, text: e.target.value})}
                  placeholder="Nhập nội dung câu hỏi..."
                />
              </div>

              {/* Dạng TRẮC NGHIỆM */}
              {edited.type === QuestionType.MULTIPLE_CHOICE && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Các lựa chọn</label>
                  {edited.options?.map((opt, idx) => (
                    <div key={idx} className="flex gap-2 items-center group">
                      <button 
                        onClick={() => setEdited({...edited, correctAnswer: idx})}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all ${edited.correctAnswer === idx ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </button>
                      <input 
                        type="text"
                        className="flex-1 border-2 p-3 rounded-xl text-sm font-bold bg-slate-50 focus:bg-white"
                        value={opt}
                        onChange={e => {
                          const newOpts = [...(edited.options || [])];
                          newOpts[idx] = e.target.value;
                          setEdited({...edited, options: newOpts});
                        }}
                        placeholder={`Lựa chọn ${String.fromCharCode(65 + idx)}`}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Dạng ĐÚNG / SAI */}
              {edited.type === QuestionType.TRUE_FALSE && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Đáp án đúng</label>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setEdited({...edited, trueFalseAnswer: true})}
                      className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest border-2 transition-all ${edited.trueFalseAnswer === true ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg' : 'bg-slate-50 text-slate-400 border-transparent'}`}
                    >
                      ĐÚNG (TRUE)
                    </button>
                    <button 
                      onClick={() => setEdited({...edited, trueFalseAnswer: false})}
                      className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest border-2 transition-all ${edited.trueFalseAnswer === false ? 'bg-rose-500 text-white border-rose-500 shadow-lg' : 'bg-slate-50 text-slate-400 border-transparent'}`}
                    >
                      SAI (FALSE)
                    </button>
                  </div>
                </div>
              )}

              {/* Dạng TRẢ LỜI NGẮN */}
              {edited.type === QuestionType.SHORT_ANSWER && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Đáp án chuẩn (Chấp nhận viết thường/hoa)</label>
                  <input 
                    type="text"
                    className="w-full border-2 p-4 rounded-2xl font-bold bg-slate-50"
                    value={edited.shortAnswerText || ''}
                    onChange={e => setEdited({...edited, shortAnswerText: e.target.value})}
                    placeholder="Nhập từ khóa đáp án..."
                  />
                </div>
              )}

              {/* Dạng GHÉP NỐI */}
              {edited.type === QuestionType.MATCHING && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Các cặp ghép nối</label>
                    <button onClick={addMatchingPair} className="text-[10px] font-black text-indigo-600 uppercase">+ Thêm cặp</button>
                  </div>
                  <div className="space-y-3">
                    {edited.matchingPairs?.map((pair, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="w-8 font-black text-slate-300 text-xs">{idx + 1}.</span>
                        <input 
                          type="text"
                          className="flex-1 border-2 p-3 rounded-xl text-xs font-bold bg-slate-50"
                          value={pair.left}
                          onChange={e => updateMatchingPair(idx, 'left', e.target.value)}
                          placeholder="Vế A"
                        />
                        <span className="text-slate-300">↔</span>
                        <input 
                          type="text"
                          className="flex-1 border-2 p-3 rounded-xl text-xs font-bold bg-slate-50"
                          value={pair.right}
                          onChange={e => updateMatchingPair(idx, 'right', e.target.value)}
                          placeholder="Vế B"
                        />
                        <button onClick={() => removeMatchingPair(idx)} className="p-2 text-rose-400">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
                <input 
                  type="checkbox" 
                  id="fixed-toggle"
                  checked={edited.isFixed} 
                  onChange={e => setEdited({...edited, isFixed: e.target.checked})}
                  className="w-4 h-4 accent-amber-600"
                />
                <label htmlFor="fixed-toggle" className="ml-3 font-bold text-amber-700 text-xs cursor-pointer uppercase tracking-tight">Cố định vị trí câu hỏi này</label>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Preview giao diện</label>
              <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 min-h-[400px] flex flex-col justify-center">
                <div className="prose prose-sm max-w-none mb-6" dangerouslySetInnerHTML={{ __html: edited.text || '<p class="text-slate-300 italic text-center">Nội dung câu hỏi sẽ hiển thị ở đây...</p>' }} />
                
                {edited.type === QuestionType.MULTIPLE_CHOICE && (
                  <div className="grid gap-2">
                    {edited.options?.map((opt, idx) => (
                      <div key={idx} className={`p-4 rounded-2xl border-2 flex items-center gap-4 ${edited.correctAnswer === idx ? 'border-emerald-500 bg-white' : 'border-transparent bg-slate-100/50'}`}>
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${edited.correctAnswer === idx ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-sm font-bold text-slate-600">{opt || '...'}</span>
                      </div>
                    ))}
                  </div>
                )}

                {edited.type === QuestionType.TRUE_FALSE && (
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 rounded-3xl bg-white border-2 border-slate-100 text-center font-black text-slate-300 uppercase">Đúng</div>
                      <div className="p-6 rounded-3xl bg-white border-2 border-slate-100 text-center font-black text-slate-300 uppercase">Sai</div>
                   </div>
                )}

                {edited.type === QuestionType.MATCHING && (
                  <div className="space-y-2">
                    {edited.matchingPairs?.map((p, idx) => (
                       <div key={idx} className="flex gap-2">
                          <div className="flex-1 bg-white p-3 rounded-xl border text-[10px] font-bold">{p.left || '?'}</div>
                          <div className="flex-1 bg-white p-3 rounded-xl border text-[10px] font-bold flex justify-between items-center">
                             <span className="text-slate-300 italic">Chọn cặp...</span>
                             <span className="text-indigo-400">▼</span>
                          </div>
                       </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
          <button onClick={onCancel} className="px-8 py-3 rounded-2xl font-black text-slate-400 uppercase text-xs">Hủy</button>
          <button onClick={() => onSave(edited as Question)} className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-xl uppercase text-xs">Lưu câu hỏi</button>
        </div>
      </div>
    </div>
  );
};
