
import React, { useMemo, useState } from 'react';
import { storageService } from '../../services/storageService';

export const QuizStatsView: React.FC<{ quizId: string, onBack: () => void }> = ({ quizId, onBack }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const quiz = useMemo(() => storageService.getQuizById(quizId), [quizId]);
  
  // Sử dụng state để force re-render khi sync xong
  const [submissions, setSubmissions] = useState(() => storageService.getSubmissions(quizId));

  const stats = useMemo(() => {
    if (submissions.length === 0) return null;
    const scores = submissions.map(s => s.score);
    return {
      avg: scores.reduce((a, b) => a + b, 0) / scores.length,
      max: Math.max(...scores),
      min: Math.min(...scores),
      count: submissions.length
    };
  }, [submissions]);

  const handleSyncFromCloud = async () => {
    setIsSyncing(true);
    const count = await storageService.syncResultsFromCloud(quizId);
    setSubmissions(storageService.getSubmissions(quizId));
    setIsSyncing(false);
    alert(`Đã cập nhật thêm ${count} bài làm mới từ Cloud.`);
  };

  const exportCSV = () => {
    if (submissions.length === 0) return;
    const headers = ["STT", "Họ tên", "Lớp", "Điểm số", "Thời gian làm bài (s)", "Thời điểm nộp"];
    const rows = submissions.sort((a,b) => b.score - a.score).map((s, idx) => [
      idx + 1, s.studentName, s.studentClass, s.score.toFixed(1),
      s.timeTaken, new Date(s.submittedAt).toLocaleString('vi-VN')
    ]);
    const csvContent = "\ufeff" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Ket-qua-${quiz?.title || 'quiz'}-${quiz?.classId || ''}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <button onClick={onBack} className="text-slate-500 font-bold hover:text-indigo-600 flex items-center gap-1 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Quay lại danh sách
        </button>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
            onClick={handleSyncFromCloud}
            disabled={isSyncing}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isSyncing ? 'bg-slate-100 text-slate-400 animate-pulse' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
          >
            {isSyncing ? 'Đang đồng bộ...' : '🔄 Cập nhật bài làm từ Cloud'}
          </button>
          {submissions.length > 0 && (
            <button 
              onClick={exportCSV}
              className="flex-1 md:flex-none bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all"
            >
              📥 Xuất CSV (Sheets)
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border shadow-lg space-y-6">
        <div className="flex justify-between items-start border-b pb-6">
          <div>
            <h3 className="text-2xl font-black text-slate-800">{quiz?.title}</h3>
            <p className="text-slate-500 italic font-medium uppercase text-xs">Kết quả lớp {quiz?.classId}</p>
          </div>
          {stats && (
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Điểm TB</p>
              <p className="text-4xl font-black text-indigo-600">{stats.avg.toFixed(1)}</p>
            </div>
          )}
        </div>

        {!stats ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-3xl opacity-50 grayscale">📊</div>
            <p className="text-slate-400 font-medium">Chưa có kết quả bài làm. Hãy nhấn "Cập nhật từ Cloud" nếu bạn đã chia sẻ đề.</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-6 rounded-[2rem] text-center border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Số lượng tham gia</p>
                <p className="text-3xl font-black text-slate-700">{stats.count}</p>
              </div>
              <div className="bg-emerald-50 p-6 rounded-[2rem] text-center border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Điểm cao nhất</p>
                <p className="text-3xl font-black text-emerald-700">{stats.max.toFixed(1)}</p>
              </div>
              <div className="bg-rose-50 p-6 rounded-[2rem] text-center border border-rose-100">
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">Điểm thấp nhất</p>
                <p className="text-3xl font-black text-rose-700">{stats.min.toFixed(1)}</p>
              </div>
            </div>

            <div className="overflow-hidden border border-slate-100 rounded-[2rem] shadow-sm bg-slate-50/30">
              <table className="w-full text-left">
                <thead className="bg-white/80 border-b border-slate-100">
                  <tr>
                    <th className="p-5 font-black text-slate-400 text-[10px] uppercase tracking-widest">Thứ hạng</th>
                    <th className="p-5 font-black text-slate-400 text-[10px] uppercase tracking-widest">Học sinh</th>
                    <th className="p-5 font-black text-slate-400 text-[10px] uppercase tracking-widest">Lớp</th>
                    <th className="p-5 font-black text-slate-400 text-[10px] uppercase tracking-widest text-center">Điểm số</th>
                    <th className="p-5 font-black text-slate-400 text-[10px] uppercase tracking-widest text-right">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white/40">
                  {submissions.sort((a,b) => b.score - a.score || a.timeTaken - b.timeTaken).map((s, idx) => (
                    <tr key={s.id} className="hover:bg-indigo-50/50 transition-colors group">
                      <td className="p-5">
                         <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-yellow-400 text-yellow-900 shadow-md' : idx === 1 ? 'bg-slate-300 text-slate-700' : idx === 2 ? 'bg-orange-300 text-orange-900' : 'bg-slate-100 text-slate-400'}`}>
                            {idx + 1}
                         </span>
                      </td>
                      <td className="p-5 font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{s.studentName}</td>
                      <td className="p-5 text-slate-500 font-medium uppercase text-xs">{s.studentClass}</td>
                      <td className="p-5 text-center">
                        <span className={`font-black px-4 py-1.5 rounded-xl text-sm shadow-sm ${s.score >= 8 ? 'bg-emerald-500 text-white' : s.score >= 5 ? 'bg-indigo-600 text-white' : 'bg-rose-500 text-white'}`}>
                          {s.score.toFixed(1)}
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <span className="text-slate-400 text-xs font-black uppercase">{s.timeTaken}s</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
