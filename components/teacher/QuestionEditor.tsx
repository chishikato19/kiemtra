
import React, { useState, useEffect } from 'react';
import { Question } from '../../types';

interface QuestionEditorProps {
  question: Partial<Question>;
  onSave: (q: Question) => void;
  onCancel: () => void;
  isManualScore?: boolean;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({ question, onSave, onCancel, isManualScore }) => {
  const [edited, setEdited] = useState<Partial<Question>>({
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    points: 1,
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

  const renderPreview = (content: string) => {
    return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden fade-in">
        <div className="p-6 border-b flex justify-between items-center bg-indigo-50">
          <h3 className="text-xl font-black text-indigo-600">CHỈNH SỬA CÂU HỎI</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-red-500 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Nội dung câu hỏi</label>
                  <label className="cursor-pointer text-[10px] bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full font-black uppercase hover:bg-indigo-200 transition-all">
                    + Thêm ảnh
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
                <textarea 
                  className="w-full border-2 p-4 rounded-2xl min-h-[150px] font-bold text-sm outline-none focus:border-indigo-600 transition-all bg-slate-50 focus:bg-white"
                  value={edited.text}
                  onChange={e => setEdited({...edited, text: e.target.value})}
                  placeholder="Nhập nội dung câu hỏi (hỗ trợ HTML & KaTeX)..."
                />
                <p className="text-[10px] text-slate-400 italic">Dùng &lt;b&gt;đậm&lt;/b&gt;, &lt;i&gt;nghiêng&lt;/i&gt; hoặc mã KaTeX giữa dấu $$.</p>
              </div>

              {isManualScore && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Điểm số cho câu này</label>
                  <input 
                    type="number"
                    step="0.1"
                    className="w-full border-2 p-3 rounded-xl font-black outline-none focus:border-indigo-600 bg-slate-50 focus:bg-white"
                    value={edited.points}
                    onChange={e => setEdited({...edited, points: parseFloat(e.target.value) || 0})}
                  />
                </div>
              )}

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Các lựa chọn</label>
                {edited.options?.map((opt, idx) => (
                  <div key={idx} className="flex gap-2 items-center group">
                    <button 
                      onClick={() => setEdited({...edited, correctAnswer: idx})}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all shadow-sm ${edited.correctAnswer === idx ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </button>
                    <input 
                      type="text"
                      className="flex-1 border-2 p-3 rounded-xl text-sm font-bold outline-none focus:border-indigo-600 bg-slate-50 focus:bg-white transition-all"
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
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Xem trước hiển thị</label>
              <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 min-h-[350px] shadow-inner">
                {renderPreview(edited.text || '')}
                <div className="mt-8 grid gap-2">
                  {edited.options?.map((opt, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${edited.correctAnswer === idx ? 'border-emerald-500 bg-white shadow-md' : 'border-transparent bg-slate-100/50'}`}>
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${edited.correctAnswer === idx ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-sm font-bold text-slate-600">{opt}</span>
                    </div>
                  ))}
                </div>
                {isManualScore && (
                  <div className="mt-6 text-right">
                    <span className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Điểm: {edited.points}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
          <button onClick={onCancel} className="px-8 py-3 rounded-2xl font-black text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all uppercase text-xs tracking-widest">Hủy bỏ</button>
          <button 
            onClick={() => onSave(edited as Question)} 
            className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 hover:-translate-y-0.5 transition-all uppercase text-xs tracking-widest"
          >
            LƯU CÂU HỎI
          </button>
        </div>
      </div>
    </div>
  );
};
