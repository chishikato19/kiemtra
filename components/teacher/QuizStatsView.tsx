
import React, { useMemo } from 'react';
import { storageService } from '../../services/storageService';

export const QuizStatsView: React.FC<{ quizId: string, onBack: () => void }> = ({ quizId, onBack }) => {
  const quiz = useMemo(() => storageService.getQuizById(quizId), [quizId]);
  const submissions = useMemo(() => storageService.getSubmissions(quizId), [quizId]);

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

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-slate-500 font-bold hover:text-indigo-600 flex items-center gap-1">
        ← Quay lại danh sách
      </button>

      <div className="bg-white p-8 rounded-3xl border shadow-lg space-y-6">
        <div className="flex justify-between items-start border-b pb-6">
          <div>
            <h3 className="text-2xl font-black text-slate-800">{quiz?.title}</h3>
            <p className="text-slate-500 italic">Báo cáo kết quả lớp {quiz?.classId}</p>
          </div>
          {stats && (
            <div className="text-right">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Trung bình</p>
              <p className="text-4xl font-black text-indigo-600">{stats.avg.toFixed(1)}</p>
            </div>
          )}
        </div>

        {!stats ? (
          <div className="py-20 text-center text-slate-400">Chưa có lượt nộp bài nào.</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Sĩ số thi</p>
                <p className="text-2xl font-black text-slate-700">{stats.count}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-emerald-400 uppercase">Cao nhất</p>
                <p className="text-2xl font-black text-emerald-700">{stats.max.toFixed(1)}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-red-400 uppercase">Thấp nhất</p>
                <p className="text-2xl font-black text-red-700">{stats.min.toFixed(1)}</p>
              </div>
            </div>

            <div className="overflow-hidden border rounded-2xl">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-4 font-bold text-slate-600">Học sinh</th>
                    <th className="p-4 font-bold text-slate-600">Lớp</th>
                    <th className="p-4 font-bold text-slate-600 text-center">Điểm</th>
                    <th className="p-4 font-bold text-slate-600 text-right">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {submissions.sort((a,b) => b.score - a.score).map(s => (
                    <tr key={s.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="p-4 font-bold text-slate-800">{s.studentName}</td>
                      <td className="p-4 text-slate-500">{s.studentClass}</td>
                      <td className="p-4 text-center">
                        <span className={`font-black px-3 py-1 rounded-lg ${s.score >= 8 ? 'bg-emerald-100 text-emerald-700' : s.score >= 5 ? 'bg-indigo-100 text-indigo-700' : 'bg-red-100 text-red-700'}`}>
                          {s.score.toFixed(1)}
                        </span>
                      </td>
                      <td className="p-4 text-right text-slate-400 text-sm font-medium">{s.timeTaken}s</td>
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
