
import React, { useState, useEffect, useRef } from 'react';
import { Quiz, StudentSubmission, Question, QuestionType } from '../../types';
import { storageService } from '../../services/storageService';
import { QuestionRenderer } from './QuestionRenderer';

export const StudentQuizArea: React.FC<{ quizId: string }> = ({ quizId }) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [stage, setStage] = useState<'loading' | 'login' | 'running' | 'submitting' | 'result'>('loading');
  const [studentInfo, setStudentInfo] = useState({ name: '', class: '' });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null); 
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [rankings, setRankings] = useState<StudentSubmission[]>([]);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const hasSubmitted = useRef(false);

  useEffect(() => {
    const initQuiz = async () => {
      setStage('loading');
      let q = storageService.getQuizById(quizId);
      if (!q) q = await storageService.getQuizFromCloud(quizId);

      if (q) {
        setQuiz(q);
        
        // 1. Logic Đảo câu hỏi (v4.5)
        const finalProcessed: Question[] = [];
        const partsMap = new Map<string, Question[]>();
        q.questions.forEach(question => {
          const pid = question.partId || "default";
          if (!partsMap.has(pid)) partsMap.set(pid, []);
          partsMap.get(pid)!.push(question);
        });

        Array.from(partsMap.keys()).sort().forEach(pid => {
          const originalList = [...partsMap.get(pid)!];
          const resultInPart: (Question | null)[] = new Array(originalList.length).fill(null);
          const fixedQuestions: { index: number, question: Question }[] = [];
          const nonFixedQuestions: Question[] = [];
          
          originalList.forEach((question, idx) => {
            if (question.isFixed) fixedQuestions.push({ index: idx, question });
            else nonFixedQuestions.push(question);
          });

          if (q.shuffleQuestions) nonFixedQuestions.sort(() => Math.random() - 0.5);
          fixedQuestions.forEach(f => { resultInPart[f.index] = f.question; });
          let poolIdx = 0;
          for (let i = 0; i < resultInPart.length; i++) {
            if (resultInPart[i] === null) resultInPart[i] = nonFixedQuestions[poolIdx++];
          }
          finalProcessed.push(...(resultInPart as Question[]));
        });

        // 2. Logic Đảo đáp án (MCQ)
        const finalWithShuffledOptions = finalProcessed.map(question => {
          if (q?.shuffleOptions && question.type === QuestionType.MULTIPLE_CHOICE && question.options.length > 0) {
            const originalOptions = question.options.map((text, index) => ({ text, index }));
            const shuffled = [...originalOptions].sort(() => Math.random() - 0.5);
            
            const newCorrectAnswer = shuffled.findIndex(opt => opt.index === question.correctAnswer);
            return {
              ...question,
              options: shuffled.map(opt => opt.text),
              correctAnswer: newCorrectAnswer
            };
          }
          return question;
        });

        setShuffledQuestions(finalWithShuffledOptions);
        setUserAnswers(finalWithShuffledOptions.map(q => q.type === QuestionType.MATCHING ? new Array(q.matchingPairs?.length).fill(-1) : null));
        setStage('login');
      }
    };
    initQuiz();
  }, [quizId]);

  useEffect(() => {
    if (stage === 'running' && timeLeft !== null) {
      if (timeLeft <= 0) { finalizeQuiz(); return; }
      const timer = setInterval(() => setTimeLeft(prev => prev! - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [stage, timeLeft]);

  const finalizeQuiz = async () => {
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;
    setStage('submitting');

    const calculatedScore = userAnswers.reduce((acc: number, val, idx) => {
      const q = shuffledQuestions[idx];
      let isCorrect = false;
      if (q.type === QuestionType.MULTIPLE_CHOICE) isCorrect = val === q.correctAnswer;
      else if (q.type === QuestionType.TRUE_FALSE) isCorrect = val === q.trueFalseAnswer;
      else if (q.type === QuestionType.SHORT_ANSWER) isCorrect = String(val).trim().toLowerCase() === String(q.shortAnswerText).trim().toLowerCase();
      else if (q.type === QuestionType.MATCHING) {
        const correctCount = (val as number[] || []).filter((v, i) => v === i).length;
        return acc + ((correctCount / (q.matchingPairs?.length || 1)) * q.points);
      }
      return acc + (isCorrect ? q.points : 0);
    }, 0);
    
    const scoreVal = parseFloat(calculatedScore.toFixed(2));
    setFinalScore(scoreVal);

    const submission: StudentSubmission = {
      id: `s-${Date.now()}`,
      quizId: quiz!.id,
      studentName: studentInfo.name,
      studentClass: studentInfo.class,
      score: scoreVal,
      totalQuestions: shuffledQuestions.length,
      answers: userAnswers,
      submittedAt: Date.now(),
      startTime,
      timeTaken: Math.floor((Date.now() - startTime) / 1000)
    };
    
    storageService.saveSubmission(submission);
    
    // Tải bảng xếp hạng từ bộ nhớ cục bộ
    const allSubs = storageService.getSubmissions(quiz!.id);
    const sorted = allSubs.sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken);
    setRankings(sorted);

    const config = storageService.getAppConfig();
    if (config.globalWebhookUrl) {
       const payload = JSON.stringify({ action: 'SUBMIT_RESULT', ...submission, quizTitle: quiz!.title });
       fetch(config.globalWebhookUrl, { 
         method: 'POST', 
         mode: 'no-cors', 
         headers: { 'Content-Type': 'text/plain' },
         body: payload
       }).catch((e) => console.error("Cloud Submit Error:", e));
    }

    setTimeout(() => setStage('result'), 1000);
  };

  const handleClose = () => {
    window.location.hash = '';
  };

  if (stage === 'loading') return <div className="p-20 text-center font-black text-indigo-600 animate-pulse">ĐANG TẢI...</div>;

  if (stage === 'login') return (
    <div className="max-w-md mx-auto bg-white p-10 rounded-[3rem] shadow-2xl space-y-8 border-t-[12px] border-indigo-600 mt-10">
      <h2 className="text-3xl font-black text-slate-800 uppercase italic text-center">{quiz?.title}</h2>
      <div className="space-y-4">
        <input type="text" placeholder="Họ và Tên" className="w-full border-2 p-4 rounded-2xl font-bold bg-slate-50 focus:border-indigo-600 outline-none" value={studentInfo.name} onChange={e => setStudentInfo({...studentInfo, name: e.target.value})} />
        <input type="text" placeholder="Lớp" className="w-full border-2 p-4 rounded-2xl font-bold bg-slate-50 focus:border-indigo-600 outline-none" value={studentInfo.class} onChange={e => setStudentInfo({...studentInfo, class: e.target.value})} />
      </div>
      <button 
        disabled={!studentInfo.name || !studentInfo.class}
        onClick={() => { setStartTime(Date.now()); if(quiz?.timeLimit) setTimeLeft(quiz.timeLimit*60); setStage('running'); }} 
        className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xl shadow-xl uppercase disabled:opacity-50"
      >
        Vào thi ngay
      </button>
    </div>
  );

  if (stage === 'running') {
    const q = shuffledQuestions[currentIndex];
    return (
      <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr_320px] gap-6 mt-6 pb-20">
        <div className="space-y-6">
          <div className="bg-white p-10 rounded-[3rem] shadow-xl min-h-[480px] flex flex-col justify-between border border-slate-100">
            <div>
              <div className="flex justify-between items-center mb-8">
                <span className="bg-indigo-600 text-white px-5 py-2 rounded-2xl text-xs font-black uppercase">Câu {currentIndex + 1}</span>
                <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Điểm: {q.points}</span>
              </div>
              <div className="prose prose-indigo max-w-none mb-10 text-xl font-bold text-slate-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: q.text }} />
              <QuestionRenderer 
                question={q} 
                userAnswer={userAnswers[currentIndex]} 
                onSelect={(val) => { const u = [...userAnswers]; u[currentIndex] = val; setUserAnswers(u); }} 
              />
            </div>
          </div>
          <div className="flex justify-between">
            <button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} className="px-10 py-4 bg-white border-2 rounded-2xl font-black text-xs uppercase text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all">← Trước</button>
            <button onClick={() => setCurrentIndex(Math.min(shuffledQuestions.length - 1, currentIndex + 1))} className="px-10 py-4 bg-white border-2 rounded-2xl font-black text-xs uppercase text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all">Sau →</button>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[3rem] shadow-xl border sticky top-24">
            <div className="text-center pb-6 border-b">
               <p className="text-[10px] font-black text-slate-300 uppercase">Còn lại</p>
               <p className={`text-5xl font-black ${timeLeft && timeLeft < 60 ? 'text-rose-600 animate-pulse' : 'text-slate-800'}`}>
                {timeLeft !== null ? `${Math.floor(timeLeft/60)}:${(timeLeft%60).toString().padStart(2,'0')}` : '∞'}
               </p>
            </div>
            <div className="grid grid-cols-5 gap-2 my-6 overflow-y-auto max-h-48 pr-1 custom-scrollbar">
              {shuffledQuestions.map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrentIndex(i)} 
                  className={`h-11 w-11 rounded-xl font-black text-xs transition-all ${currentIndex === i ? 'ring-4 ring-indigo-100 border-indigo-600 border-2' : ''} ${userAnswers[i] !== null && userAnswers[i] !== "" && (Array.isArray(userAnswers[i]) ? userAnswers[i].some((v:any) => v !== -1) : true) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button onClick={() => setShowConfirmModal(true)} className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-sm uppercase shadow-xl hover:bg-emerald-700 transition-all">Nộp bài 🚀</button>
          </div>
        </div>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-[4rem] p-12 text-center space-y-8 fade-in">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter">Nộp bài ngay?</h3>
              <p className="text-slate-500 font-medium">Bạn đã hoàn thành {userAnswers.filter(a => a !== null && a !== "").length}/{shuffledQuestions.length} câu hỏi.</p>
              <div className="flex flex-col gap-3">
                 <button onClick={finalizeQuiz} className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs shadow-lg hover:bg-indigo-700">Xác nhận nộp bài</button>
                 <button onClick={() => setShowConfirmModal(false)} className="w-full py-5 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase text-xs hover:bg-slate-200">Tiếp tục làm bài</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (stage === 'result') {
    const studentRank = rankings.findIndex(r => r.studentName === studentInfo.name && r.score === finalScore) + 1;
    return (
      <div className="max-w-2xl mx-auto space-y-8 mt-10 text-center pb-20 fade-in">
        <div className="bg-white p-12 rounded-[4rem] shadow-2xl border-t-[16px] border-indigo-600 relative overflow-hidden">
          {/* Hiệu ứng nền */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full translate-x-1/2 -translate-y-1/2 opacity-50"></div>
          
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner animate-bounce">🏆</div>
          <h2 className="text-4xl font-black uppercase italic mb-2 text-slate-800 tracking-tighter">KẾT QUẢ CỦA BẠN</h2>
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] mb-8">Chúc mừng {studentInfo.name}!</p>
          
          <div className="flex justify-center items-end gap-2 mb-10">
            <span className="text-8xl font-black text-indigo-600 leading-none">{finalScore}</span>
            <span className="text-2xl font-black text-slate-300 mb-2">/ {quiz?.totalScore || 10}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Xếp hạng lớp</p>
                <p className="text-2xl font-black text-indigo-600 italic">#{studentRank}</p>
             </div>
             <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Thời gian làm</p>
                <p className="text-2xl font-black text-slate-700">{Math.floor((Date.now() - startTime) / 60000)}p {Math.floor(((Date.now() - startTime) / 1000) % 60)}s</p>
             </div>
          </div>
        </div>

        {rankings.length > 0 && (
          <div className="bg-white p-10 rounded-[4rem] shadow-xl border border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Bảng vàng lớp {studentInfo.class}</h3>
            <div className="space-y-3">
              {rankings.slice(0, 5).map((r, i) => (
                <div key={i} className={`flex justify-between items-center p-5 rounded-3xl transition-all ${r.studentName === studentInfo.name ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-yellow-400 text-white' : r.studentName === studentInfo.name ? 'bg-white/20' : 'bg-slate-200 text-slate-500'}`}>
                      {i + 1}
                    </span>
                    <span className="font-bold text-sm">{r.studentName}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-sm">{r.score}đ</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4">
          <button onClick={handleClose} className="px-16 py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase text-xs shadow-2xl hover:bg-slate-800 hover:scale-105 transition-all tracking-widest">Quay lại trang chính</button>
        </div>
      </div>
    );
  }

  return null;
};
