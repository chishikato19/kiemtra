
import React from 'react';
import { Quiz, Folder } from '../../types';

interface QuizListItemProps {
  quiz: Quiz;
  folders: Folder[];
  syncingId: string | null;
  onSync: (q: Quiz) => void;
  onStats: (id: string) => void;
  onEdit: (q: Quiz) => void;
  onShare: (q: Quiz) => void;
  onDelete: (id: string) => void;
  onMove: (quizId: string, folderId: string | undefined) => void;
}

export const QuizListItem: React.FC<QuizListItemProps> = ({ 
  quiz, folders, syncingId, onSync, onStats, onEdit, onShare, onDelete, onMove 
}) => {
  const q = quiz;
  return (
    <div className={`bg-white p-6 rounded-[2.5rem] border shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group ${q.isLocked ? 'opacity-75 grayscale-[0.5]' : ''}`}>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="font-black text-xl text-slate-800 group-hover:text-indigo-600 transition-colors">
            {q.title}
          </h3>
          <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-black uppercase">LỚP: {q.classId}</span>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-slate-400 font-medium italic">ID: {q.id}</p>
          <select 
            className="text-[10px] font-black uppercase text-slate-300 bg-transparent outline-none focus:text-indigo-500"
            value={q.folderId || ''}
            onChange={(e) => onMove(q.id, e.target.value || undefined)}
          >
            <option value="">Di chuyển vào...</option>
            {folders.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
            {q.folderId && <option value="">Rời thư mục</option>}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button 
          onClick={() => onSync(q)}
          className={`px-4 py-3 rounded-2xl transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${syncingId === q.id ? 'bg-slate-100 text-slate-400 animate-pulse' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
          disabled={syncingId === q.id}
        >
          {syncingId === q.id ? 'Đang lưu...' : '☁️ Cloud'}
        </button>
        <button 
          onClick={() => onEdit(q)}
          className="px-5 py-3 bg-amber-50 text-amber-600 rounded-2xl font-black hover:bg-amber-100 uppercase text-[10px] tracking-widest"
        >
          ✏️ Sửa
        </button>
        <button 
          onClick={() => onStats(q.id)}
          className="px-5 py-3 bg-slate-100 text-slate-700 rounded-2xl font-black hover:bg-slate-200 uppercase text-[10px] tracking-widest"
        >
          📊 Báo cáo
        </button>
        <button 
          onClick={() => onShare(q)} 
          className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-lg uppercase text-[10px] tracking-widest"
        >
          🚀 Link Thi
        </button>
        <button 
          onClick={() => { if(confirm('Xóa đề này khỏi máy?')) onDelete(q.id); }}
          className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    </div>
  );
};
