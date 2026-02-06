
import React, { useState, useEffect, useMemo } from 'react';
import { Quiz, QuizMode, PracticeType, StudentSubmission, Question } from '../../types';
import { storageService } from '../../services/storageService';

export const StudentQuizArea: React.FC<{ quizId: string }> = ({ quizId }) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [stage, setStage] = useState<'login' | 'running' | 'result'>('login');
  const [studentInfo, setStudentInfo] = useState({ name: '', class: '' });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [timeLeft, setTimeLeft] = useState<number | null>(null); 
  const [isSyncing, setIsSyncing] = useState(false);

  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const q = storageService.getQuizById(quizId);
    if (q) {
      setQuiz(q);
      if (q.shuffleQuestions) {
        const shuffled = [...q.questions].sort(() => Math.random() - 0.5);
        setShuffledQuestions(shuffled);
      } else {
        setShuffledQuestions(q.questions);
      }
    }
  }, [quizId]);

  useEffect(() => {
    if (stage === 'running' && timeLeft !== null) {
      if (timeLeft <= 0) {
        finalizeQuiz(userAnswers);
        return;
      }
      const timer = setInterval(() => {
        setTimeLeft(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [stage, timeLeft, userAnswers]);

  if (!quiz) return <div className="text-center p-20 font-bold text-slate-400">Đề thi không tồn tại hoặc đã bị gỡ.</div>;

  const startQuiz = () => {
    if (quiz.isLocked) {
      alert("Đề thi này hiện đang bị khóa bởi Giáo viên.");
      return;
    }
    if (!studentInfo.name || !studentInfo.class) {
      alert("Bạn chưa nhập đầy đủ Họ tên và Lớp!");
      return;
    }
    setStartTime(Date.now());
    if (quiz.timeLimit) {
      setTimeLeft(quiz.timeLimit * 60);
    }
    setStage('running');
  };

  const handleSelectOption = (idx: number) => {
    const currentQ = shuffledQuestions[currentIndex];
    const isStepByStep = quiz.mode === QuizMode.PRACTICE && quiz.practiceType === PracticeType.STEP_BY_STEP;

    if (isStepByStep) {
      if (idx === currentQ.correctAnswer) {
        setFeedback('correct');
        const updated = [...userAnswers];
        updated[currentIndex] = idx;
        setUserAnswers(updated);
        setTimeout(() => {
          setFeedback('none');
          if (currentIndex < shuffledQuestions.length - 1) {
            setCurrentIndex(currentIndex + 1);
          } else {
            finalizeQuiz(updated);
          }
        }, 800);
      } else {
        setFeedback('wrong');
        setTimeout(() => setFeedback('none'), 500);
      }
    } else {
      const updated = [...userAnswers];
      updated[currentIndex] = idx;
      setUserAnswers(updated);
      if (currentIndex < shuffledQuestions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        finalizeQuiz(updated);
      }
    }
  };

  const finalizeQuiz = async (finalAnswers: number[]) => {
    const totalAchievedScore = finalAnswers.reduce((acc, val, idx) => {
      const isCorrect = val === shuffledQuestions[idx].correctAnswer;
      return acc + (isCorrect ? (shuffledQuestions[idx].points || 0) : 0);
    }, 0);
    
    const submission: StudentSubmission = {
      id: `s-${Date.now()}`,
      quizId: quiz.id,
      studentName: studentInfo.name,
      studentClass: studentInfo.class,
      score: parseFloat(totalAchievedScore.toFixed(2)),
      totalQuestions: shuffledQuestions.length,
      answers: finalAnswers,
      submittedAt: Date.now(),
      timeTaken: Math.floor((Date.now() - startTime) / 1000)
    };
    
    storageService.saveSubmission(submission);

    // Lấy Link Webhook toàn cục
    const config = storageService.getAppConfig();
    if (config.globalWebhookUrl) {
      setIsSyncing(true);
      try {
        await fetch(config.globalWebhookUrl, {
          method: 'POST',
          mode: 'no-cors', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: new Date().toLocaleString('vi-VN'),
            quizTitle: quiz.title,
            ...submission
          })
        });
      } catch (err) {
        console.error("Gửi dữ liệu lên Sheets thất bại:", err);
      } finally {
        setIsSyncing(false);
      }
    }

    setStage('result');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (stage === 'login') return (
    <div className="max-w-md mx-auto bg-white p-10 rounded-[3rem] shadow-2xl space-y-8 border-t-[12px] border-indigo-600 mt-10 relative overflow-hidden">
      {quiz.isLocked && (
        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] z-10 flex items-center justify-center p-8 text-center">
          <div className="bg-white p-6 rounded-3xl shadow-2xl border-2 border-red-100">
             <div className="text-4xl mb-2">🔒</div>
             <h3 className="text-xl font-black text-slate-800 uppercase">Phòng thi đang đóng</h3>
             <p className="text-sm text-slate-500 font-medium">Giáo viên đã tạm khóa truy cập vào đề thi này. Vui lòng quay lại sau.</p>
          </div>
        </div>
      )}

      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight leading-tight">{quiz.title}</h2>
        <div className="flex justify-center gap-3">
           <span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-500 uppercase">Lớp: {quiz.classId}</span>
           <span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-500 uppercase">{shuffledQuestions.length} câu hỏi</span>
           {quiz.timeLimit ? <span className="bg-indigo-100 px-3 py-1 rounded-full text-[10px] font-black text-indigo-500 uppercase">⏱️ {quiz.timeLimit} Phút</span> : null}
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-3 tracking-widest">Họ và Tên</label>
          <input 
            type="text" 
            placeholder="VD: Nguyễn Văn A" 
            className="w-full border-2 p-4 rounded-2xl font-bold outline-none focus:border-indigo-600 transition-all shadow-sm bg-slate-50 focus:bg-white"
            value={studentInfo.name}
            onChange={e => setStudentInfo({...studentInfo, name: e.target.value})}
            disabled={quiz.isLocked}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-3 tracking-widest">Lớp</label>
          <input 
            type="text" 
            placeholder="VD: 12C" 
            className="w-full border-2 p-4 rounded-2xl font-bold outline-none focus:border-indigo-600 transition-all shadow-sm bg-slate-50 focus:bg-white"
            value={studentInfo.class}
            onChange={e => setStudentInfo({...studentInfo, class: e.target.value})}
            disabled={quiz.isLocked}
          />
        </div>
      </div>
      <button 
        onClick={startQuiz}
        className={`w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xl shadow-xl hover:bg-indigo-700 active:scale-[0.98] transition-all uppercase tracking-tighter ${quiz.isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={quiz.isLocked}
      >
        BẮT ĐẦU LÀM BÀI
      </button>
    </div>
  );

  if (stage === 'running') {
    const q = shuffledQuestions[currentIndex];
    const progress = ((currentIndex + 1) / shuffledQuestions.length) * 100;

    return (
      <div className="max-w-3xl mx-auto space-y-6 mt-6 pb-20">
        <div className="flex justify-between items-end px-2">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Câu hỏi {currentIndex + 1}/{shuffledQuestions.length}</p>
            <h3 className="text-lg font-black text-slate-800 leading-tight">{quiz.title}</h3>
          </div>
          <div className="text-right space-y-1">
            {timeLeft !== null && (
              <div className={`text-2xl font-black ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>
                ⏱️ {formatTime(timeLeft)}
              </div>
            )}
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiến trình {Math.round(progress)}%</p>
          </div>
        </div>
        
        <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
          <div className="h-full bg-indigo-600 transition-all duration-500 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>

        <div className={`bg-white p-10 rounded-[3rem] shadow-xl border-2 transition-all min-h-[400px] flex flex-col justify-between ${feedback === 'correct' ? 'border-emerald-400 correct-answer' : feedback === 'wrong' ? 'border-red-400 animate-shake' : 'border-transparent'}`}>
          <div>
            <div className="flex justify-end mb-4">
              <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Điểm: {q.points}</span>
            </div>
            <div className="prose prose-indigo max-w-none mb-10 text-xl font-bold text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: q.text }} />
          </div>
          
          <div className="grid gap-3">
            {q.options.map((opt, idx) => (
              <button 
                key={idx}
                onClick={() => handleSelectOption(idx)}
                className="group flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-50 hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left shadow-sm hover:shadow-md"
              >
                <span className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center font-black text-xl transition-all shadow-inner">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1 font-bold text-slate-600 group-hover:text-indigo-900" dangerouslySetInnerHTML={{ __html: opt }} />
              </button>
            ))}
          </div>
        </div>

        {feedback !== 'none' && (
          <div className={`fixed inset-0 pointer-events-none flex items-center justify-center z-[100] bg-white/10 backdrop-blur-[2px]`}>
            <div className={`text-7xl font-black uppercase tracking-tighter ${feedback === 'correct' ? 'text-emerald-500' : 'text-red-500'}`}>
              {feedback === 'correct' ? 'Tuyệt vời!' : 'Sai rồi!'}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (stage === 'result') {
    const sub = storageService.getSubmissions(quizId).find(s => s.studentName === studentInfo.name) || { score: 0, timeTaken: 0 };
    const rankings = storageService.getSubmissions(quizId)
      .sort((a,b) => b.score - a.score || a.timeTaken - b.timeTaken)
      .slice(0, 10);

    return (
      <div className="max-w-2xl mx-auto space-y-8 mt-6">
        {isSyncing && (
          <div className="bg-emerald-600 text-white p-3 rounded-2xl text-center text-xs font-black animate-pulse flex items-center justify-center gap-2">
             <span>Đang tự động đồng bộ lên Google Sheets...</span>
          </div>
        )}
        <div className="bg-white p-12 rounded-[4rem] shadow-2xl text-center border-t-[12px] border-indigo-600 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">HOÀN THÀNH</h2>
          <div className="my-10 relative">
            <div className="text-[10rem] leading-none font-black text-indigo-600 inline-block relative italic">
              {sub.score.toFixed(1)}
              <span className="text-2xl text-slate-400 absolute -right-16 bottom-10 font-black not-italic">/{quiz.totalScore}</span>
            </div>
          </div>
          <p className="text-xl text-slate-500 font-medium">Bạn đã rất nỗ lực, <b className="text-slate-800">{studentInfo.name}</b>!</p>
          <div className="flex justify-center gap-6 mt-4">
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-300 uppercase">Lớp</p>
              <p className="font-bold text-slate-600">{studentInfo.class}</p>
            </div>
            <div className="w-[1px] bg-slate-100 h-8 self-center"></div>
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-300 uppercase">Thời gian</p>
              <p className="font-bold text-slate-600">{sub.timeTaken}s</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-xl space-y-6 border border-slate-100">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tighter">
            <span className="text-3xl">🏆</span> Bảng vàng lớp {studentInfo.class}
          </h3>
          <div className="space-y-3">
            {rankings.map((r, i) => (
              <div key={r.id} className={`flex items-center justify-between p-5 rounded-[2rem] transition-all ${r.studentName === studentInfo.name ? 'bg-indigo-600 text-white shadow-xl scale-[1.05]' : 'bg-slate-50 border border-slate-100'}`}>
                <div className="flex items-center gap-4">
                  <span className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-yellow-400 text-yellow-900 ring-4 ring-yellow-100' : i === 1 ? 'bg-slate-300 text-slate-700' : i === 2 ? 'bg-orange-300 text-orange-900' : 'bg-slate-200 text-slate-500'}`}>
                    {i+1}
                  </span>
                  <span className="font-black tracking-tight">{r.studentName}</span>
                </div>
                <div className="flex gap-4 font-black">
                  <span className="text-xl tracking-tighter">{r.score.toFixed(1)}đ</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => window.location.hash = ''} className="w-full text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-indigo-600 transition-colors py-10">
          QUAY LẠI TRANG CHỦ QUIZMASTER
        </button>
      </div>
    );
  }

  return null;
};
