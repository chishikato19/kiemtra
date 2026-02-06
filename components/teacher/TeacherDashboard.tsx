
import React, { useState, useEffect } from 'react';
import { Quiz, QuizMode } from '../../types';
import { storageService } from '../../services/storageService';
import { QuizCreateForm } from './QuizCreateForm';
import { QuizStatsView } from './QuizStatsView';

export const TeacherDashboard: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'stats' | 'edit'>('list');
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizToEdit, setQuizToEdit] = useState<Quiz | undefined>(undefined);
  const [showHelp, setShowHelp] = useState(false);
  
  const [shareModal, setShareModal] = useState<{ isOpen: boolean, url: string, title: string }>({
    isOpen: false,
    url: '',
    title: ''
  });

  useEffect(() => {
    setQuizzes(storageService.getQuizzes());
  }, [activeTab]);

  const handleSeed = () => {
    if (storageService.seedSampleData()) {
      setQuizzes(storageService.getQuizzes());
      alert("Đã tạo đề thi mẫu thành công!");
    } else {
      alert("Đề thi mẫu đã tồn tại.");
    }
  };

  const toggleLock = (quiz: Quiz) => {
    const updatedQuiz = { ...quiz, isLocked: !quiz.isLocked };
    storageService.saveQuiz(updatedQuiz);
    setQuizzes(storageService.getQuizzes());
  };

  const handleEdit = (quiz: Quiz) => {
    setQuizToEdit(quiz);
    setActiveTab('edit');
  };

  const openShareModal = (quiz: Quiz) => {
    const url = `${window.location.origin}${window.location.pathname}#/quiz/${quiz.id}`;
    setShareModal({ isOpen: true, url, title: quiz.title });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Đã sao chép đường dẫn!");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Bảng điều khiển</h2>
          <p className="text-slate-500 font-medium">Phiên bản Evolution Edition v2.5</p>
        </div>
        <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-2xl shadow-sm border items-center">
          <button 
            onClick={() => { setActiveTab('list'); setQuizToEdit(undefined); }}
            className={`px-4 py-2 rounded-xl font-bold transition-all text-sm ${activeTab === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Danh sách đề
          </button>
          <button 
            onClick={() => { setActiveTab('create'); setQuizToEdit(undefined); }}
            className={`px-4 py-2 rounded-xl font-bold transition-all text-sm ${activeTab === 'create' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            + Tạo đề mới
          </button>
          <button 
            onClick={() => setShowHelp(true)}
            className="px-4 py-2 rounded-xl font-bold text-emerald-600 hover:bg-emerald-50 text-sm flex items-center gap-1"
          >
            📊 HD Google Sheets
          </button>
        </div>
      </div>

      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
             <button 
              onClick={handleSeed}
              className="text-xs font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-tighter flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100"
            >
              <span>✨ Tạo dữ liệu mẫu</span>
            </button>
          </div>
          
          <div className="grid gap-4">
            {quizzes.length === 0 ? (
              <div className="bg-white p-20 text-center rounded-[2rem] border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-medium mb-4">Chưa có đề thi nào trong hệ thống.</p>
                <button onClick={handleSeed} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg">Thử dữ liệu mẫu</button>
              </div>
            ) : (
              quizzes.sort((a,b) => b.createdAt - a.createdAt).map(q => (
                <div key={q.id} className={`bg-white p-6 rounded-[2rem] border shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group ${q.isLocked ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-xl text-slate-800 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                        {q.isLocked && <span title="Đang khóa">🔒</span>}
                        {q.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${q.mode === QuizMode.TEST ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {q.mode === QuizMode.TEST ? 'Kiểm tra' : 'Luyện tập'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500 font-medium">
                      <span className="flex items-center gap-1">🏫 Lớp: <b>{q.classId}</b></span>
                      <span className="flex items-center gap-1">📝 <b>{q.questions.length}</b> câu hỏi</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => toggleLock(q)}
                      className={`p-2.5 rounded-2xl transition-all ${q.isLocked ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                      title={q.isLocked ? "Mở khóa đề" : "Khóa đề"}
                    >
                      {q.isLocked ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                      ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      )}
                    </button>
                    <button 
                      onClick={() => handleEdit(q)}
                      className="p-2.5 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all"
                      title="Chỉnh sửa đề"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button 
                      onClick={() => openShareModal(q)} 
                      className="flex-1 md:flex-none px-5 py-2.5 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-100"
                    >
                      <span>🚀 CHIA SẺ</span>
                    </button>
                    <button 
                      onClick={() => { setSelectedQuizId(q.id); setActiveTab('stats'); }}
                      className="flex-1 md:flex-none px-5 py-2.5 bg-slate-100 text-slate-700 rounded-2xl font-black hover:bg-slate-200 transition-colors"
                    >
                      📊 THỐNG KÊ
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {(activeTab === 'create' || activeTab === 'edit') && (
        <QuizCreateForm 
          quizToEdit={quizToEdit} 
          onSuccess={() => { setActiveTab('list'); setQuizToEdit(undefined); }} 
        />
      )}

      {activeTab === 'stats' && selectedQuizId && (
        <QuizStatsView quizId={selectedQuizId} onBack={() => setActiveTab('list')} />
      )}

      {/* Modal Hướng dẫn Google Sheets */}
      {showHelp && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden fade-in flex flex-col max-h-[90vh]">
            <div className="p-8 bg-emerald-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Hướng dẫn Google Sheets</h3>
                <p className="opacity-80 text-sm font-medium">Đưa dữ liệu trắc nghiệm lên bảng tính chuyên nghiệp</p>
              </div>
              <button onClick={() => setShowHelp(false)} className="bg-white/20 p-2 rounded-full hover:bg-white/40 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <section className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black">1</span>
                  <h4 className="font-black text-slate-800 uppercase tracking-wider">Cách đơn giản: Xuất file CSV</h4>
                </div>
                <div className="ml-11 text-slate-600 space-y-2 text-sm leading-relaxed">
                  <p>Đây là cách nhanh nhất để lấy điểm học sinh về máy tính:</p>
                  <ul className="list-disc ml-4 space-y-1 font-medium">
                    <li>Vào mục <b>Thống kê</b> của một đề thi cụ thể.</li>
                    <li>Nhấn nút <b>"Xuất CSV"</b> để tải file dữ liệu về máy.</li>
                    <li>Mở <a href="https://sheets.new" target="_blank" className="text-emerald-600 underline">Google Sheets</a>, vào <b>Tệp > Nhập > Tải lên</b> và chọn file vừa tải.</li>
                    <li>Google Sheets sẽ tự động chia cột: Tên, Lớp, Điểm, Thời gian...</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black">2</span>
                  <h4 className="font-black text-slate-800 uppercase tracking-wider">Cách nâng cao: Dùng Apps Script</h4>
                </div>
                <div className="ml-11 text-slate-600 space-y-3 text-sm leading-relaxed">
                  <p>Nếu bạn muốn dữ liệu tự động đổ về Sheets mỗi khi học sinh nộp bài (cần có server trung gian), bạn có thể thiết lập như sau:</p>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-mono text-[11px] leading-tight">
                    <p className="text-indigo-600 mb-2">// Ví dụ mã script cho Google Apps Script:</p>
                    <p>function doPost(e) &#123;</p>
                    <p>&nbsp;&nbsp;var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();</p>
                    <p>&nbsp;&nbsp;var data = JSON.parse(e.postData.contents);</p>
                    <p>&nbsp;&nbsp;sheet.appendRow([new Date(), data.studentName, data.studentClass, data.score]);</p>
                    <p>&nbsp;&nbsp;return ContentService.createTextOutput("Success");</p>
                    <p>&#125;</p>
                  </div>
                  <p className="font-medium">Lưu ý: Tính năng kết nối Webhook tự động sẽ được cập nhật trong phiên bản v3.0 tới.</p>
                </div>
              </section>

              <section className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100">
                <h4 className="font-black text-indigo-900 uppercase text-xs mb-2">Mẹo quản lý</h4>
                <p className="text-indigo-700/80 text-xs italic">Sử dụng hàm <code>=VLOOKUP</code> trong Google Sheets để đối chiếu điểm số với danh sách lớp chính thức của bạn một cách tự động.</p>
              </section>
            </div>
            <div className="p-6 bg-slate-50 border-t flex justify-center">
              <button onClick={() => setShowHelp(false)} className="px-10 py-3 bg-emerald-600 text-white rounded-2xl font-black shadow-xl hover:bg-emerald-700 transition-all uppercase text-xs">Đã rõ, cảm ơn!</button>
            </div>
          </div>
        </div>
      )}

      {shareModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden fade-in border-t-[10px] border-indigo-600">
            <div className="p-8 text-center space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Chia sẻ đề thi</h3>
                <p className="text-slate-500 font-medium text-sm">{shareModal.title}</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-[2.5rem] inline-block border-2 border-slate-100 shadow-inner">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareModal.url)}`} 
                  alt="QR Code"
                  className="w-44 h-44 mx-auto"
                />
              </div>

              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Sao chép đường dẫn</p>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={shareModal.url}
                  className="flex-1 bg-slate-50 border-2 border-slate-100 p-3 rounded-xl text-[10px] font-mono text-slate-500 outline-none"
                />
                <button 
                  onClick={() => copyToClipboard(shareModal.url)}
                  className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                </button>
              </div>

              <button 
                onClick={() => setShareModal({ ...shareModal, isOpen: false })}
                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-colors uppercase tracking-widest text-xs"
              >
                ĐÓNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
