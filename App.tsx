
import React, { useState, useEffect } from 'react';
import { UserRole } from './types';
import { Layout } from './components/Layout';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { StudentQuizArea } from './components/student/StudentQuizArea';

const App: React.FC = () => {
  const [route, setRoute] = useState<{ role: UserRole | null, quizId: string | null }>({
    role: null,
    quizId: null
  });

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/quiz/')) {
        setRoute({ role: UserRole.STUDENT, quizId: hash.replace('#/quiz/', '') });
      } else if (hash === '#/teacher') {
        setRoute({ role: UserRole.TEACHER, quizId: null });
      } else {
        setRoute({ role: null, quizId: null });
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  if (!route.role) {
    return (
      <div className="min-h-screen bg-indigo-900 flex items-center justify-center p-6 overflow-hidden relative">
        {/* Background Decor */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-800 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-700 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl opacity-50"></div>

        <div className="bg-white/95 backdrop-blur-sm p-12 rounded-[3rem] shadow-2xl max-w-xl w-full text-center space-y-10 relative z-10 border border-white/20">
          <div className="space-y-4">
            <h1 className="text-6xl font-black text-indigo-600 tracking-tighter italic">QUIZMASTER</h1>
            <p className="text-xl text-slate-500 font-medium">Nâng tầm trải nghiệm trắc nghiệm số.</p>
          </div>

          <div className="grid gap-6">
            <button 
              onClick={() => window.location.hash = '#/teacher'}
              className="group relative py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-2xl shadow-[0_15px_30px_-10px_rgba(79,70,229,0.5)] hover:shadow-[0_25px_50px_-12px_rgba(79,70,229,0.6)] hover:-translate-y-1 transition-all"
            >
              DÀNH CHO GIÁO VIÊN
              <div className="absolute inset-0 rounded-[2rem] bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
            
            <div className="flex items-center gap-4 text-slate-300">
              <div className="h-[1px] bg-slate-200 flex-1"></div>
              <span className="text-xs font-bold tracking-widest uppercase">Học sinh</span>
              <div className="h-[1px] bg-slate-200 flex-1"></div>
            </div>

            <p className="text-slate-400 font-medium italic">
              Học sinh vui lòng truy cập qua đường link <br/>hoặc quét mã QR được giáo viên cung cấp.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout title={route.role === UserRole.TEACHER ? "QUIZMASTER GIÁO VIÊN" : "PHÒNG THI TRỰC TUYẾN"}>
      {route.role === UserRole.TEACHER ? (
        <TeacherDashboard />
      ) : (
        <StudentQuizArea quizId={route.quizId!} />
      )}
    </Layout>
  );
};

export default App;
