
import React, { useMemo, useState } from 'react';
import { storageService } from '../../services/storageService';
import { pdfService } from '../../services/pdfService';
import { StudentSubmission } from '../../types';

export const QuizStatsView: React.FC<{ quizId: string, onBack: () => void }> = ({ quizId, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'score' | 'time' | 'submittedAt'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [includeSignature, setIncludeSignature] = useState(true);
  
  const quiz = useMemo(() => storageService.getQuizById(quizId), [quizId]);
  const submissions = useMemo(() => storageService.getSubmissions(quizId), [quizId]);

  const uniqueClasses = useMemo(() => {
    const classes = new Set(submissions.map(s => s.studentClass));
    return Array.from(classes).sort();
  }, [submissions]);

  const filteredAndSortedSubmissions = useMemo(() => {
    let result = submissions.filter(s => {
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

  return (
    <div className="space-y-6">
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
          <button onClick={() => handlePrint(filteredAndSortedSubmissions)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700">📋 In toàn bộ (PDF)</button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border shadow-lg space-y-6">
        <div className="flex flex-col md:flex-row justify-between border-b pb-6 gap-4">
          <div><h3 className="text-2xl font-black text-slate-800">{quiz?.title}</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thống kê học sinh</p></div>
          <div className="flex gap-2">
            <input type="text" placeholder="Tìm tên..." className="bg-slate-50 border p-2 rounded-xl text-xs font-bold outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <select className="bg-slate-50 border p-2 rounded-xl text-xs font-bold" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
               <option value="">Tất cả lớp</option>
               {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border rounded-2xl">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-4 cursor-pointer" onClick={() => handleSort('name')}>Học sinh {sortKey==='name'?(sortOrder==='asc'?'↑':'↓'):''}</th>
                <th className="p-4 text-center">Lớp</th>
                <th className="p-4 text-center cursor-pointer" onClick={() => handleSort('score')}>Điểm {sortKey==='score'?(sortOrder==='asc'?'↑':'↓'):''}</th>
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredAndSortedSubmissions.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-700">{s.studentName}</td>
                  <td className="p-4 text-center font-bold text-slate-400">{s.studentClass}</td>
                  <td className="p-4 text-center">
                    <span className={`font-black px-3 py-1 rounded-lg ${s.score >= 5 ? 'text-indigo-600 bg-indigo-50' : 'text-rose-600 bg-rose-50'}`}>
                      {s.score.toFixed(1)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handlePrint([s])} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white">📄 In bài</button>
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
