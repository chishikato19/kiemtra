
import React, { useState, useEffect, useRef } from 'react';
import { Quiz, QuizMode, PracticeType, StudentSubmission, Question } from '../../types';
import { storageService } from '../../services/storageService';

export const StudentQuizArea: React.FC<{ quizId: string }> = ({ quizId }) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [stage, setStage] = useState<'loading' | 'login' | 'running' | 'submitting' | 'result'>('loading');
  const [studentInfo, setStudentInfo] = useState({ name: '', class: '' });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [timeLeft, setTimeLeft] = useState<number | null>(null); 
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmittingInternal, setIsSubmittingInternal] = useState(false);
  
  const hasSubmitted = useRef(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const initQuiz = async () => {
      setStage('loading');
      let q = storageService.getQuizById(quizId);
      if (!q) {
        q = await storageService.getQuizFromCloud(quizId);
      }

      if (q) {
        setQuiz(q);
        
        // Logic xáo trộn: Cả câu hỏi và đáp án
        let questionsToProcess = [...q.questions];
        
        // 1. Xáo trộn đáp án bên trong từng câu hỏi
        const processedQuestions = questionsToProcess.map(question => {
          // Tạo mảng các option kèm index gốc
          const indexedOptions = question.options.map((text, idx) => ({ text, originalIdx: idx }));
          // Xáo trộn options
          const shuffledOptions = indexedOptions.sort(() => Math.random() - 0.5);
          // Tìm index mới của đáp án đúng
          const newCorrectAnswer = shuffledOptions.findIndex(o => o.originalIdx === question.correctAnswer);
          
          return {
            ...question,
            options: shuffledOptions.map(o => o.text),
            correctAnswer: newCorrectAnswer
          };
        });

        // 2. Xáo trộn thứ tự các câu hỏi (nếu cấu hình cho phép)
        if (q.shuffleQuestions) {
          processedQuestions.sort(() => Math.random() - 0.5);
        }

        setShuffledQuestions(processedQuestions);
        setUserAnswers(new Array(q.questions.length).fill(null));
        setStage('login');
      } else {
        setStage('login');
      }
    };
    initQuiz();
  }, [quizId]);

  useEffect(() => {
    if (stage === 'running' && timeLeft !== null) {
      if (timeLeft <= 0) {
        finalizeQuiz();
        return;
      }
      const timer = setInterval(() => {
        setTimeLeft(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [stage, timeLeft]);

  if (stage === 'loading') return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-indigo-600 uppercase tracking-widest text-[10px]">Đang kết nối Cloud Vault...</p>
    </div>
  );

  if (stage === 'submitting') return (
    <div className="flex flex-col items-center justify-center p-20 space-y-6 fade-in">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-8 border-indigo-100 rounded-full"></div>
        <div className="absolute inset-0 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div className="text-center space-y-2">
        <p className="font-black text-slate-800 uppercase tracking-tighter text-2xl italic">Đang nộp bài...</p>
        <p className="text-slate-400 font-bold text-xs">Vui lòng không thoát trình duyệt, kết quả đang được lưu trữ an toàn.</p>
      </div>
    </div>
  );

  if (!quiz) return (
    <div className="max-w-md mx-auto bg-white p-12 rounded-[3rem] shadow-2xl text-center space-y-6 mt-10 border-2 border-red-50">
      <div className="text-6xl">🔍</div>
      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Không tìm thấy đề thi</h3>
      <p className="text-sm text-slate-400 leading-relaxed font-medium">Đề thi không tồn tại hoặc link không chính xác.</p>
      <button onClick={() => window.location.hash = ''} className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs">Quay lại</button>
    </div>
  );

  const startQuiz = () => {
    if (quiz.isLocked) { alert("Đề thi đang bị khóa."); return; }
    if (!studentInfo.name || !studentInfo.class) { alert("Vui lòng nhập tên và lớp!"); return; }
    setStartTime(Date.now());
    if (quiz.timeLimit) setTimeLeft(quiz.timeLimit * 60);
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
            finalizeQuiz();
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
    }
  };

  const finalizeQuiz = async () => {
    // Chặn nộp bài nhiều lần
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;
    
    setIsSubmittingInternal(true);
    setStage('submitting');

    const finalAnswers = userAnswers.map(a => a === null ? -1 : a);
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
    
    // Lưu cục bộ trước
    storageService.saveSubmission(submission);
    
    const config = storageService.getAppConfig();
    if (config.globalWebhookUrl) {
      try {
        await fetch(config.globalWebhookUrl, {
          method: 'POST',
          mode: 'no-cors', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SUBMIT_RESULT',
            timestamp: new Date().toLocaleString('vi-VN'),
            quizTitle: quiz.title,
            ...submission
          })
        });
      } catch (err) {
        console.error("Gửi dữ liệu Cloud thất bại:", err);
      }
    }

    // Delay nhẹ để tạo cảm giác hệ thống đang xử lý thực sự
    setTimeout(() => {
      setStage('result');
      setShowConfirmModal(false);
      setIsSubmittingInternal(false);
    }, 1200);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const answeredCount = userAnswers.filter(a => a !== null).length;

  if (stage === 'login') return (
    <div className="max-w-md mx-auto bg-white p-10 rounded-[3rem] shadow-2xl space-y-8 border-t-[12px] border-indigo-600 mt-10 relative">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-slate-800 uppercase leading-tight">{quiz.title}</h2>
        <div className="flex flex-wrap justify-center gap-2">
           <span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-500 uppercase">Lớp: {quiz.classId}</span>
           <span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-500 uppercase">{shuffledQuestions.length} câu</span>
           {quiz.timeLimit ? <span className="bg-indigo-100 px-3 py-1 rounded-full text-[10px] font-black text-indigo-500 uppercase">⏱️ {quiz.timeLimit} Phút</span> : null}
        </div>
      </div>
      <div className="space-y-4">
        <input 
          type="text" placeholder="Họ và Tên học sinh" 
          className="w-full border-2 p-4 rounded-2xl font-bold outline-none focus:border-indigo-600 transition-all bg-slate-50"
          value={studentInfo.name}
          onChange={e => setStudentInfo({...studentInfo, name: e.target.value})}
        />
        <input 
          type="text" placeholder="Lớp (VD: 12A1)" 
          className="w-full border-2 p-4 rounded-2xl font-bold outline-none focus:border-indigo-600 transition-all bg-slate-50"
          value={studentInfo.class}
          onChange={e => setStudentInfo({...studentInfo, class: e.target.value})}
        />
      </div>
      <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
         <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">🔐 Bảo mật bài thi</p>
         <p className="text-[11px] text-indigo-400 font-medium italic leading-tight">Thứ tự câu hỏi và đáp án đã được xáo trộn tự động cho mỗi học sinh.</p>
      </div>
      <button onClick={startQuiz} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xl shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-tighter">Bắt đầu làm bài</button>
    </div>
  );

  if (stage === 'running') {
    const q = shuffledQuestions[currentIndex];
    const progress = (answeredCount / shuffledQuestions.length) * 100;

    return (
      <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr_300px] gap-6 mt-6 pb-20 fade-in">
        <div className="space-y-6">
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border-2 border-transparent transition-all min-h-[450px] flex flex-col justify-between relative">
            {feedback !== 'none' && (
              <div className={`absolute inset-0 z-50 rounded-[3rem] flex items-center justify-center backdrop-blur-sm ${feedback === 'correct' ? 'bg-emerald-500/20' : 'bg-red-500/20 animate-shake'}`}>
                <span className={`text-5xl font-black uppercase ${feedback === 'correct' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {feedback === 'correct' ? 'Đúng rồi!' : 'Sai rồi!'}
                </span>
              </div>
            )}
            
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">Câu hỏi {currentIndex + 1}</span>
                <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Điểm: {q.points}</span>
              </div>
              <div className="prose prose-indigo max-w-none mb-10 text-xl font-bold text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: q.text }} />
            </div>
            
            <div className="grid gap-3">
              {q.options.map((opt, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`group flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left shadow-sm ${userAnswers[currentIndex] === idx ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-50 hover:border-indigo-200 hover:bg-slate-50'}`}
                >
                  <span className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl transition-all shadow-inner ${userAnswers[currentIndex] === idx ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100'}`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className={`flex-1 font-bold ${userAnswers[currentIndex] === idx ? 'text-indigo-900' : 'text-slate-600'}`} dangerouslySetInnerHTML={{ __html: opt }} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button 
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-8 py-3 bg-white border-2 border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all disabled:opacity-30 disabled:pointer-events-none shadow-sm"
            >
              ← Câu trước
            </button>
            <button 
              onClick={() => setCurrentIndex(prev => Math.min(shuffledQuestions.length - 1, prev + 1))}
              disabled={currentIndex === shuffledQuestions.length - 1}
              className="px-8 py-3 bg-white border-2 border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all disabled:opacity-30 disabled:pointer-events-none shadow-sm"
            >
              Câu sau →
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6 sticky top-24">
            <div className="text-center space-y-1 pb-4 border-b">
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Thời gian còn lại</p>
               {timeLeft !== null ? (
                 <p className={`text-4xl font-black tracking-tighter ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>
                   {formatTime(timeLeft)}
                 </p>
               ) : (
                 <p className="text-2xl font-black text-slate-800 italic uppercase">Không giới hạn</p>
               )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiến độ bài làm</p>
                <p className="text-xs font-black text-indigo-600">{answeredCount}/{shuffledQuestions.length}</p>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${progress}%` }}></div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Bảng điều hướng</p>
              <div className="grid grid-cols-5 gap-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                {shuffledQuestions.map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-10 w-10 rounded-xl font-black text-xs transition-all border-2 ${currentIndex === i ? 'border-indigo-600 ring-2 ring-indigo-50 scale-110 z-10' : 'border-transparent'} ${userAnswers[i] !== null ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setShowConfirmModal(true)}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-[0.98] transition-all"
            >
              🚀 Nộp bài thi
            </button>
          </div>
        </div>

        {showConfirmModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm fade-in">
            <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-4xl">🏁</div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tight">Xác nhận nộp bài?</h3>
                <p className="text-slate-500 font-medium">Bạn đã làm <b className="text-indigo-600">{answeredCount}</b> trên tổng số <b className="text-slate-800">{shuffledQuestions.length}</b> câu hỏi.</p>
                {answeredCount < shuffledQuestions.length && (
                  <div className="p-3 bg-red-50 text-red-500 rounded-2xl text-[11px] font-black uppercase flex items-center justify-center gap-2">
                    ⚠️ Bạn chưa hoàn thành tất cả câu hỏi!
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                 <button 
                  disabled={isSubmittingInternal}
                  onClick={finalizeQuiz}
                  className={`w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all ${isSubmittingInternal ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
                >
                  {isSubmittingInternal ? 'Đang xử lý...' : 'Xác nhận nộp bài'}
                </button>
                <button 
                  disabled={isSubmittingInternal}
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest"
                >
                  Quay lại làm tiếp
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (stage === 'result') {
    const allResults = storageService.getSubmissions(quizId);
    const sub = allResults.find(s => s.studentName === studentInfo.name) || { score: 0, timeTaken: 0 };
    const rankings = allResults
      .sort((a,b) => b.score - a.score || a.timeTaken - b.timeTaken)
      .slice(0, 10);

    return (
      <div className="max-w-2xl mx-auto space-y-8 mt-6 fade-in">
        <div className="bg-white p-12 rounded-[4rem] shadow-2xl text-center border-t-[12px] border-indigo-600 relative overflow-hidden">
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic">HOÀN THÀNH</h2>
          <div className="my-10 relative">
            <div className="text-[10rem] leading-none font-black text-indigo-600 inline-block relative italic tracking-tighter">
              {sub.score.toFixed(1)}
              <span className="text-2xl text-slate-400 absolute -right-16 bottom-10 font-black not-italic">/{quiz.totalScore}</span>
            </div>
          </div>
          <p className="text-xl text-slate-500 font-medium">Bạn đã hoàn thành bài thi, <b className="text-slate-800">{studentInfo.name}</b>!</p>
          <div className="flex justify-center gap-6 mt-6">
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
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tighter italic">
            🏆 Bảng vàng Lớp {studentInfo.class}
          </h3>
          <div className="space-y-3">
            {rankings.map((r, i) => (
              <div key={r.id} className={`flex items-center justify-between p-5 rounded-[2rem] transition-all ${r.studentName === studentInfo.name ? 'bg-indigo-600 text-white shadow-xl scale-[1.05]' : 'bg-slate-50 border border-slate-100'}`}>
                <div className="flex items-center gap-4">
                  <span className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-slate-300 text-slate-700' : i === 2 ? 'bg-orange-300 text-orange-900' : 'bg-slate-200 text-slate-500'}`}>
                    {i+1}
                  </span>
                  <span className="font-black tracking-tight">{r.studentName}</span>
                </div>
                <span className="text-xl font-black tracking-tighter">{r.score.toFixed(1)}đ</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => window.location.hash = ''} className="w-full text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-indigo-600 transition-colors py-10">
          Quay lại Trang chủ QuizMaster
        </button>
      </div>
    );
  }

  return null;
};
