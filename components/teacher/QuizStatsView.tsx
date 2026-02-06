
import React, { useMemo, useState, useEffect } from 'react';
import { storageService } from '../../services/storageService';
import { pdfService } from '../../services/pdfService';
import { StudentSubmission } from '../../types';

export const QuizStatsView: React.FC<{ quizId: string, onBack: () => void }> = ({ quizId, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'score' | 'time' | 'submittedAt'>('score');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [includeSignature, setIncludeSignature] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  
  const quiz = useMemo(() => storageService.getQuizById(quizId), [quizId]);

  // Khởi tạo danh sách bài làm từ local
  useEffect(() => {
    setSubmissions(storageService.getSubmissions(quizId));
  }, [quizId]);

  const uniqueClasses = useMemo(() => {
    const classes = new Set(submissions.map(s => s.studentClass));
    return Array.from(classes).sort();
  }, [submissions]);

  const filteredAndSortedSubmissions = useMemo(() => {
    let result = [...submissions].filter(s => {
      const matchesSearch = s.studentName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass = !classFilter || s.studentClass === classFilter;
      return matchesSearch && matchesClass;
    });

    result.sort((a, b) => {
      let comparison = 0;
      if (sortKey === 'name') comparison = a.studentName.localeCompare(b.studentName);
      else if (sortKey === 'score') comparison = a.score - b.score;
      else if (sortKey === 'time') comparison = a.timeTaken - b.timeTaken;
      else if (sortKey === 'submittedAt') comparison = a.submittedAt - b.submittedAt;
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [submissions, searchQuery, classFilter, sortKey, sortOrder]);

  const handlePrint = (subs: StudentSubmission[]) => {
    if (quiz) pdfService.generateReport(quiz, subs, includeSignature);
  };

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortOrder('desc'); }
  };

  const syncFromCloud = async () => {
    const config = storageService.getAppConfig();
    if (!config.globalWebhookUrl) {
      alert("Vui lòng cấu hình Cloud Vault trước!");
      return;
    }

    setIsSyncing(true);
    try {
      const newCount = await storageService.syncResultsFromCloud(quizId);
      if (newCount > 0) {
        // Cập nhật lại state để UI render ngay
        setSubmissions(storageService.getSubmissions(quizId));
        alert(`Đã tải thành công ${newCount} bài làm mới từ Cloud!`);
      } else {
        alert("Không có bài làm mới nào trên Cloud.");
      }
    } catch (err) {
      alert("Lỗi khi đồng bộ: " + err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <button onClick={onBack} className="text-slate-500 font-bold hover:text-indigo-600 flex items-center gap-1 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Quay lại danh sách
        </button>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border">
            <input type="checkbox" id="sig-toggle" checked={includeSignature} onChange={e => setIncludeSignature(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
            <label htmlFor="sig-toggle" className="text-[10px] font-black text-slate-500 uppercase cursor-pointer">Kèm chữ ký</label>
          </div>
          
          <button 
            onClick={syncFromCloud} 
            disabled={isSyncing}
            className={`px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2 ${isSyncing ? 'opacity-50 animate-pulse' : ''}`}
          >
            {isSyncing ? 'Đang tải...' : '📥 Tải từ Cloud'}
          </button>

          <button 
            onClick={() => handlePrint(filteredAndSortedSubmissions)} 
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700"
          >
            📋 In toàn bộ (PDF)
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border shadow-lg space-y-6">
        <div className="flex flex-col md:flex-row justify-between border-b pb-6 gap-4">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tighter italic uppercase">{quiz?.title}</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Thống kê: {submissions.length} bài làm đã nộp
            </p>
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder="Tìm tên..." className="bg-slate-50 border p-2 rounded-xl text-xs font-bold outline-none focus:border-indigo-600" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <select className="bg-slate-50 border p-2 rounded-xl text-xs font-bold outline-none" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
               <option value="">Tất cả lớp</option>
               {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border rounded-2xl">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-4 cursor-pointer text-[10px] font-black uppercase text-slate-400" onClick={() => handleSort('name')}>
                  Học sinh {sortKey==='name'?(sortOrder==='asc'?'↑':'↓'):''}
                </th>
                <th className="p-4 text-center text-[10px] font-black uppercase text-slate-400">Lớp</th>
                <th className="p-4 text-center cursor-pointer text-[10px] font-black uppercase text-slate-400" onClick={() => handleSort('score')}>
                  Điểm {sortKey==='score'?(sortOrder==='asc'?'↑':'↓'):''}
                </th>
                <th className="p-4 text-right text-[10px] font-black uppercase text-slate-400">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredAndSortedSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-slate-400 italic font-medium">
                    Chưa có bài làm nào được tìm thấy. Hãy bấm "Tải từ Cloud" để cập nhật.
                  </td>
                </tr>
              ) : filteredAndSortedSubmissions.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4">
                    <div className="font-bold text-slate-700">{s.studentName}</div>
                    <div className="text-[9px] text-slate-300 font-bold uppercase">{new Date(s.submittedAt).toLocaleString('vi-VN')}</div>
                  </td>
                  <td className="p-4 text-center font-black text-slate-400">{s.studentClass}</td>
                  <td className="p-4 text-center">
                    <span className={`font-black px-4 py-1.5 rounded-xl text-sm ${s.score >= 5 ? 'text-indigo-600 bg-indigo-50 shadow-inner shadow-indigo-100' : 'text-rose-600 bg-rose-50 shadow-inner shadow-rose-100'}`}>
                      {s.score.toFixed(1)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handlePrint([s])} className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-[9px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all">📄 Xem bài</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
