
import React, { useState, useEffect } from 'react';
import { Quiz, QuizMode, PracticeType, StudentSubmission } from '../types';
import { storageService } from '../services/storageService';

export const StudentInterface: React.FC<{quizId: string}> = ({ quizId }) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [studentInfo, setStudentInfo] = useState({ name: '', class: '' });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [startTime, setStartTime] = useState(0);

  useEffect(() => {
    const q = storageService.getQuizzes().find(item => item.id === quizId);
    if (q) setQuiz(q);
  }, [quizId]);

  if (!quiz) return <div className="text-center p-20">Đề thi không tồn tại hoặc đã bị xóa.</div>;

  const handleStart = () => {
    if (!studentInfo.name || !studentInfo.class) {
      alert("Vui lòng nhập tên và lớp!");
      return;
    }
    setStartTime(Date.now());
    setIsStarted(true);
  };

  const handleAnswer = (optionIdx: number) => {
    const currentQ = quiz.questions[currentIndex];
    
    // Logic cho chế độ Luyện tập - Đúng mới qua
    if (quiz.mode === QuizMode.PRACTICE && quiz.practiceType === PracticeType.STEP_BY_STEP) {
      if (optionIdx === currentQ.correctAnswer) {
        setFeedback('correct');
        setTimeout(() => {
          setAnswers([...answers, optionIdx]);
          setFeedback('none');
          if (currentIndex < quiz.questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
          } else {
            finishQuiz();
          }
        }, 800);
      } else {
        setFeedback('wrong');
        setTimeout(() => setFeedback('none'), 500);
      }
      return;
    }

    // Các chế độ khác
    const newAnswers = [...answers];
    newAnswers[currentIndex] = optionIdx;
    setAnswers(newAnswers);
    
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishQuiz(newAnswers);
    }
  };

  const finishQuiz = (finalAnswers = answers) => {
    const score = finalAnswers.reduce((acc, ans, idx) => {
      return acc + (ans === quiz.questions[idx].correctAnswer ? 1 : 0);
    }, 0);
    
    const submission: StudentSubmission = {
      id: `s-${Date.now()}`,
      quizId: quiz.id,
      studentName: studentInfo.name,
      studentClass: studentInfo.class,
      score: (score / quiz.questions.length) * 10,
      totalQuestions: quiz.questions.length,
      answers: finalAnswers,
      submittedAt: Date.now(),
      timeTaken: Math.floor((Date.now() - startTime) / 1000)
    };
    
    storageService.saveSubmission(submission);
    setIsFinished(true);
  };

  if (isFinished) {
    const score = (answers.reduce((acc, ans, idx) => acc + (ans === quiz.questions[idx].correctAnswer ? 1 : 0), 0) / quiz.questions.length) * 10;
    const rankings = storageService.getSubmissions()
      .filter(s => s.quizId === quizId)
      .sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken)
      .slice(0, 5);

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white p-10 rounded-3xl shadow-xl text-center border-t-8 border-indigo-600">
          <h2 className="text-3xl font-black text-slate-800">KẾT QUẢ</h2>
          <div className="my-8">
            <span className="text-7xl font-black text-indigo-600">{score.toFixed(1)}</span>
            <span className="text-2xl text-slate-400">/10</span>
          </div>
          <p className="text-slate-500 italic">Chúc mừng {studentInfo.name} đã hoàn thành bài thi!</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-lg">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            🏆 Bảng xếp hạng Lớp {studentInfo.class}
          </h3>
          <div className="space-y-2">
            {rankings.map((r, i) => (
              <div key={r.id} className={`flex justify-between p-3 rounded-xl ${r.studentName === studentInfo.name ? 'bg-indigo-50 border border-indigo-200' : 'bg-slate-50'}`}>
                <div className="flex gap-3 items-center">
                  <span className="font-black text-slate-400 w-6">#{i+1}</span>
                  <span className="font-bold">{r.studentName}</span>
                </div>
                <div className="flex gap-4 text-sm font-bold">
                  <span className="text-indigo-600">{r.score.toFixed(1)}đ</span>
                  <span className="text-slate-400">{r.timeTaken}s</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <button onClick={() => window.location.hash = ''} className="w-full py-4 text-slate-400 font-medium">
          Quay lại Trang chủ
        </button>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-black text-indigo-600 mb-2 uppercase">{quiz.title}</h2>
          <p className="text-sm text-slate-400">Chào mừng bạn đến với phòng thi trực tuyến</p>
        </div>
        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="Họ và Tên học sinh" 
            className="w-full border-2 p-4 rounded-2xl outline-none focus:border-indigo-600 transition-all font-bold"
            value={studentInfo.name}
            onChange={e => setStudentInfo({...studentInfo, name: e.target.value})}
          />
          <input 
            type="text" 
            placeholder="Lớp (VD: 10A1)" 
            className="w-full border-2 p-4 rounded-2xl outline-none focus:border-indigo-600 transition-all font-bold"
            value={studentInfo.class}
            onChange={e => setStudentInfo({...studentInfo, class: e.target.value})}
          />
        </div>
        <div className="bg-indigo-50 p-4 rounded-2xl text-sm text-indigo-700">
          <p><strong>Lưu ý:</strong></p>
          <ul className="list-disc ml-4 mt-1 opacity-80">
            <li>Số câu hỏi: {quiz.questions.length}</li>
            <li>Chế độ: {quiz.mode === QuizMode.TEST ? 'Kiểm tra tập trung' : 'Luyện tập'}</li>
          </ul>
        </div>
        {/* Fix: use handleStart function instead of boolean value for onClick event */}
        <button onClick={handleStart} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xl shadow-lg">
          BẮT ĐẦU LÀM BÀI
        </button>
      </div>
    );
  }

  const q = quiz.questions[currentIndex];
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-10 rounded-3xl shadow-xl space-y-8">
        <div className="flex justify-between items-center border-b pb-4">
          <span className="font-bold text-slate-400 uppercase tracking-widest text-xs">Câu hỏi {currentIndex + 1} / {quiz.questions.length}</span>
          {feedback !== 'none' && (
            <span className={`font-black uppercase tracking-widest text-xs ${feedback === 'correct' ? 'text-emerald-500' : 'text-red-500'}`}>
              {feedback === 'correct' ? 'Chính xác' : 'Sai rồi'}
            </span>
          )}
        </div>
        <div className="text-xl font-bold text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: q.text }} />
        <div className="grid gap-3">
          {q.options.map((opt, idx) => (
            <button 
              key={idx}
              onClick={() => handleAnswer(idx)}
              className="flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-50 hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left group"
            >
              <span className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="font-bold text-slate-600" dangerouslySetInnerHTML={{ __html: opt }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
