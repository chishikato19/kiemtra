
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
  const [isSubmittingInternal, setIsSubmittingInternal] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const hasSubmitted = useRef(false);

  useEffect(() => {
    const initQuiz = async () => {
      setStage('loading');
      let q = storageService.getQuizById(quizId);
      if (!q) q = await storageService.getQuizFromCloud(quizId);

      if (q) {
        setQuiz(q);
        // Smart Shuffling Logic v4.5
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

        setShuffledQuestions(finalProcessed);
        setUserAnswers(finalProcessed.map(q => q.type === QuestionType.MATCHING ? new Array(q.matchingPairs?.length).fill(-1) : null));
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
    setIsSubmittingInternal(true);
    setStage('submitting');

    const totalScore = userAnswers.reduce((acc: number, val, idx) => {
      const q = shuffledQuestions[idx];
      let isCorrect = false;
      if (q.type === QuestionType.MULTIPLE_CHOICE) isCorrect = val === q.correctAnswer;
      else if (q.type === QuestionType.TRUE_FALSE) isCorrect = val === q.trueFalseAnswer;
      else if (q.type === QuestionType.SHORT_ANSWER) isCorrect = String(val).trim().toLowerCase() === String(q.shortAnswerText).trim().toLowerCase();
      else if (q.type === QuestionType.MATCHING) {
        const correct = (val as number[]).filter((v, i) => v === i).length;
        return acc + ((correct / q.matchingPairs!.length) * q.points);
      }
      return acc + (isCorrect ? q.points : 0);
    }, 0);
    
    const submission: StudentSubmission = {
      id: `s-${Date.now()}`,
      quizId: quiz!.id,
      studentName: studentInfo.name,
      studentClass: studentInfo.class,
      score: parseFloat(totalScore.toFixed(2)),
      totalQuestions: shuffledQuestions.length,
      answers: userAnswers,
      submittedAt: Date.now(),
      startTime,
      timeTaken: Math.floor((Date.now() - startTime) / 1000)
    };
    
    storageService.saveSubmission(submission);
    const config = storageService.getAppConfig();
    if (config.globalWebhookUrl) {
       fetch(config.globalWebhookUrl, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'SUBMIT_RESULT', ...submission, quizTitle: quiz!.title }) }).catch(() => {});
    }

    setTimeout(() => setStage('result'), 1000);
  };

  if (stage === 'loading') return <div className="p-20 text-center font-black text-indigo-600 animate-pulse">ĐANG TẢI...</div>;

  if (stage === 'login') return (
    <div className="max-w-md mx-auto bg-white p-10 rounded-[3rem] shadow-2xl space-y-8 border-t-[12px] border-indigo-600 mt-10">
      <h2 className="text-3xl font-black text-slate-800 uppercase italic text-center">{quiz?.title}</h2>
      <div className="space-y-4">
        <input type="text" placeholder="Họ và Tên" className="w-full border-2 p-4 rounded-2xl font-bold bg-slate-50" value={studentInfo.name} onChange={e => setStudentInfo({...studentInfo, name: e.target.value})} />
        <input type="text" placeholder="Lớp" className="w-full border-2 p-4 rounded-2xl font-bold bg-slate-50" value={studentInfo.class} onChange={e => setStudentInfo({...studentInfo, class: e.target.value})} />
      </div>
      <button onClick={() => { setStartTime(Date.now()); if(quiz?.timeLimit) setTimeLeft(quiz.timeLimit*60); setStage('running'); }} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xl shadow-xl uppercase">Vào thi ngay</button>
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
            <button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} className="px-10 py-4 bg-white border-2 rounded-2xl font-black text-xs uppercase text-slate-400">← Trước</button>
            <button onClick={() => setCurrentIndex(Math.min(shuffledQuestions.length - 1, currentIndex + 1))} className="px-10 py-4 bg-white border-2 rounded-2xl font-black text-xs uppercase text-slate-400">Sau →</button>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[3rem] shadow-xl border sticky top-24">
            <div className="text-center pb-6 border-b">
               <p className="text-[10px] font-black text-slate-300 uppercase">Còn lại</p>
               <p className="text-5xl font-black text-slate-800">{timeLeft !== null ? `${Math.floor(timeLeft/60)}:${(timeLeft%60).toString().padStart(2,'0')}` : '∞'}</p>
            </div>
            <div className="grid grid-cols-5 gap-2 my-6 overflow-y-auto max-h-48 pr-1 custom-scrollbar">
              {shuffledQuestions.map((_, i) => (
                <button key={i} onClick={() => setCurrentIndex(i)} className={`h-11 w-11 rounded-xl font-black text-xs ${currentIndex === i ? 'border-indigo-600 border-2' : ''} ${userAnswers[i] !== null && userAnswers[i] !== "" ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{i + 1}</button>
              ))}
            </div>
            <button onClick={() => setShowConfirmModal(true)} className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-sm uppercase shadow-xl">Nộp bài 🚀</button>
          </div>
        </div>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-[4rem] p-12 text-center space-y-8">
              <h3 className="text-3xl font-black uppercase italic">Nộp bài ngay?</h3>
              <div className="flex flex-col gap-3">
                 <button onClick={finalizeQuiz} className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs">Xác nhận</button>
                 <button onClick={() => setShowConfirmModal(false)} className="w-full py-5 bg-slate-100 rounded-3xl font-black uppercase text-xs">Quay lại</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (stage === 'result') {
    const sub = storageService.getSubmissions(quizId).find(s => s.studentName === studentInfo.name) || { score: 0 };
    return (
      <div className="max-w-2xl mx-auto space-y-8 mt-10 text-center pb-20">
        <div className="bg-white p-16 rounded-[5rem] shadow-2xl border-t-[16px] border-indigo-600">
          <h2 className="text-4xl font-black uppercase italic mb-10">KẾT QUẢ</h2>
          <div className="text-[12rem] font-black text-indigo-600 italic leading-none">{sub.score.toFixed(1)}</div>
          <p className="text-xl text-slate-500 font-medium mt-16">Chúc mừng học sinh đã hoàn thành!</p>
        </div>
        <button onClick={() => window.location.hash = ''} className="px-12 py-5 bg-slate-200 text-slate-500 rounded-3xl font-black uppercase text-xs">Về trang chủ</button>
      </div>
    );
  }

  return null;
};
