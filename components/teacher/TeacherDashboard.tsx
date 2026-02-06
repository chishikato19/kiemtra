
import React, { useState, useEffect } from 'react';
import { Quiz, QuizMode, AppConfig } from '../../types';
import { storageService } from '../../services/storageService';
import { QuizCreateForm } from './QuizCreateForm';
import { QuizStatsView } from './QuizStatsView';

export const TeacherDashboard: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'stats' | 'edit' | 'config'>('list');
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizToEdit, setQuizToEdit] = useState<Quiz | undefined>(undefined);
  const [showHelp, setShowHelp] = useState(false);
  const [appConfig, setAppConfig] = useState<AppConfig>({ globalWebhookUrl: '' });
  const [syncingId, setSyncingId] = useState<string | null>(null);
  
  const [shareModal, setShareModal] = useState<{ isOpen: boolean, url: string, title: string, id: string }>({
    isOpen: false,
    url: '',
    title: '',
    id: ''
  });

  useEffect(() => {
    setQuizzes(storageService.getQuizzes());
    setAppConfig(storageService.getAppConfig());
  }, [activeTab]);

  const handleSaveConfig = () => {
    storageService.saveAppConfig(appConfig);
    alert("Đã lưu cấu hình hệ thống!");
    setActiveTab('list');
  };

  const syncQuizToCloud = async (quiz: Quiz) => {
    if (!appConfig.globalWebhookUrl) {
      alert("Vui lòng cài đặt cấu hình Cloud trước!");
      setActiveTab('config');
      return;
    }

    setSyncingId(quiz.id);
    try {
      await fetch(appConfig.globalWebhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_QUIZ',
          quiz: quiz
        })
      });
      alert(`Đã đồng bộ đề "${quiz.title}" lên Cloud thành công! Bây giờ bạn có thể chia sẻ link cho bất kỳ ai.`);
    } catch (err) {
      alert("Lỗi đồng bộ: " + err);
    } finally {
      setSyncingId(null);
    }
  };

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
    setShareModal({ isOpen: true, url, title: quiz.title, id: quiz.id });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Đã sao chép!");
  };

  const appsScriptCode = `/**
 * GOOGLE APPS SCRIPT: HỆ THỐNG CLOUD QUIZMASTER PRO
 * Phiên bản: 3.0 (Hỗ trợ Lưu Đề, Tải Đề, Lưu Kết Quả)
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Lưu nội dung ĐỀ THI
    if (data.action === "SAVE_QUIZ") {
      var quizSheet = ss.getSheetByName("CLOUD_QUIZZES") || ss.insertSheet("CLOUD_QUIZZES");
      if (quizSheet.getLastRow() === 0) {
        quizSheet.appendRow(["ID", "DataJSON", "CreatedAt"]);
      }
      
      // Xóa bản cũ nếu có để cập nhật
      var rows = quizSheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] === data.quiz.id) {
          quizSheet.deleteRow(i + 1);
          break;
        }
      }
      
      quizSheet.appendRow([data.quiz.id, JSON.stringify(data.quiz), new Date()]);
      return ContentService.createTextOutput("QUIZ_SAVED");
    }
    
    // 2. Lưu KẾT QUẢ bài làm học sinh
    var sheet = ss.getSheetByName("RESULTS") || ss.insertSheet("RESULTS");
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Thời gian", "Đề thi", "Họ tên", "Lớp", "Điểm", "Tổng câu", "Thời gian làm(s)"]);
    }
    
    sheet.appendRow([
      data.timestamp || new Date().toLocaleString(),
      data.quizTitle,
      data.studentName,
      data.studentClass,
      data.score,
      data.totalQuestions,
      data.timeTaken
    ]);
    
    return ContentService.createTextOutput("RESULT_SAVED");
  } catch (err) {
    return ContentService.createTextOutput("ERROR: " + err.toString());
  }
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var action = e.parameter.action;
  
  if (action === "getQuiz") {
    var quizId = e.parameter.quizId;
    var quizSheet = ss.getSheetByName("CLOUD_QUIZZES");
    if (!quizSheet) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
    
    var rows = quizSheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === quizId) {
        return ContentService.createTextOutput(rows[i][1]).setMimeType(ContentService.MimeType.JSON);
      }
    }
  }
  return ContentService.createTextOutput("NOT_FOUND");
}`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Bảng điều khiển</h2>
          <p className="text-slate-500 font-medium">Phiên bản Cloud Sync v3.0</p>
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
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded-xl font-bold transition-all text-sm flex items-center gap-1 ${activeTab === 'config' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-600 hover:bg-emerald-50'}`}
          >
            ⚙️ Cấu hình Cloud
          </button>
        </div>
      </div>

      {activeTab === 'list' && (
        <div className="space-y-4">
          {!appConfig.globalWebhookUrl && (
            <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl flex items-center justify-between gap-4 animate-pulse">
               <div className="flex items-center gap-3">
                 <span className="text-2xl">⚡</span>
                 <p className="text-sm font-bold text-amber-800">Bạn chưa cài đặt link Google Sheets. Hãy cài đặt để học sinh có thể thấy đề thi!</p>
               </div>
               <button onClick={() => setActiveTab('config')} className="bg-amber-600 text-white px-4 py-2 rounded-xl font-black text-xs uppercase">Cài đặt ngay</button>
            </div>
          )}

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
                <button onClick={() => setActiveTab('create')} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg">Bắt đầu tạo đề đầu tiên</button>
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
                      onClick={() => syncQuizToCloud(q)}
                      className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${syncingId === q.id ? 'bg-slate-100 text-slate-400 animate-pulse' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                      disabled={syncingId === q.id}
                      title="Đẩy đề thi lên máy chủ"
                    >
                      {syncingId === q.id ? 'Đang đẩy...' : '☁️ Đồng bộ Cloud'}
                    </button>
                    <button 
                      onClick={() => toggleLock(q)}
                      className={`p-2.5 rounded-2xl transition-all ${q.isLocked ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
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

      {activeTab === 'config' && (
        <div className="bg-white p-10 rounded-[3rem] border shadow-2xl space-y-8 fade-in">
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-emerald-600 uppercase tracking-tight">Cấu hình Hệ thống Cloud</h3>
            <p className="text-slate-500 font-medium">Bạn cần cập nhật Apps Script lên phiên bản 3.0 để hỗ trợ tải đề thi xuyên trình duyệt.</p>
          </div>

          <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-3">Google Apps Script Web App URL</label>
              <input 
                type="url" 
                value={appConfig.globalWebhookUrl} 
                onChange={e => setAppConfig({...appConfig, globalWebhookUrl: e.target.value})}
                className="w-full border-2 p-4 rounded-2xl focus:border-emerald-600 outline-none transition-all font-bold bg-white"
                placeholder="https://script.google.com/macros/s/.../exec"
              />
            </div>
            
            <div className="pt-4 border-t border-emerald-100">
               <button 
                onClick={() => setShowHelp(true)}
                className="text-xs font-black text-emerald-600 underline hover:text-emerald-800"
               >
                 Lấy mã Apps Script v3.0 (Quan trọng!)
               </button>
            </div>
          </div>

          <div className="flex gap-3">
             <button 
              onClick={() => setActiveTab('list')}
              className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-[2rem] font-black uppercase tracking-widest text-xs"
            >
              Hủy
            </button>
            <button 
              onClick={handleSaveConfig}
              className="flex-[2] py-4 bg-emerald-600 text-white rounded-[2rem] font-black shadow-xl hover:bg-emerald-700 transition-all uppercase tracking-widest text-xs"
            >
              Cập nhật cấu hình
            </button>
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

      {showHelp && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden fade-in flex flex-col max-h-[90vh]">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">🚀 Apps Script v3.0: Cloud Sync</h3>
                <p className="opacity-80 text-sm font-medium">Học sinh có thể thi ở bất kỳ đâu, bất kỳ máy nào</p>
              </div>
              <button onClick={() => setShowHelp(false)} className="bg-white/20 p-2 rounded-full hover:bg-white/40 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-3xl">
                <p className="text-amber-900 font-bold mb-2 uppercase text-xs tracking-widest">Tại sao phải cập nhật?</p>
                <p className="text-sm text-amber-700 leading-relaxed">
                  Phiên bản này hỗ trợ <b>Lưu trữ đề thi trực tiếp lên Sheet</b>. Nếu không cập nhật, học sinh sẽ nhận báo lỗi "Đề không tồn tại" vì máy của họ không có dữ liệu đề thi mà bạn đã tạo.
                </p>
              </div>

              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black">1</span>
                  <h4 className="font-black text-slate-800 uppercase tracking-wider">Mã Apps Script v3.0</h4>
                </div>
                <div className="ml-11 text-slate-600 space-y-3 text-sm leading-relaxed">
                  <div className="relative group">
                    <pre className="bg-slate-900 text-emerald-400 p-6 rounded-2xl overflow-x-auto text-[11px] font-mono leading-relaxed shadow-inner">
                      {appsScriptCode}
                    </pre>
                    <button 
                      onClick={() => copyToClipboard(appsScriptCode)}
                      className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all"
                    >
                      Sao chép mã
                    </button>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black">2</span>
                  <h4 className="font-black text-slate-800 uppercase tracking-wider">Lưu ý quan trọng sau khi dán mã</h4>
                </div>
                <div className="ml-11 text-slate-600 space-y-2 text-sm leading-relaxed">
                  <ul className="list-disc ml-4 space-y-2 font-medium">
                    <li>Nhấn <b>Triển khai (Deploy) - Triển khai mới</b>.</li>
                    <li>Sau khi cập nhật link vào App, hãy nhấn nút <b>☁️ Đồng bộ Cloud</b> cho từng đề thi.</li>
                    <li>Khi nút chuyển sang màu xanh lá cây, đề thi đã sẵn sàng để học sinh truy cập.</li>
                  </ul>
                </div>
              </section>
            </div>
            <div className="p-6 bg-slate-50 border-t flex justify-center">
              <button onClick={() => setShowHelp(false)} className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all uppercase text-xs">Đã hiểu quy trình</button>
            </div>
          </div>
        </div>
      )}

      {shareModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-sm:w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden fade-in border-t-[10px] border-indigo-600">
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

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                <p className="text-[9px] text-amber-700 font-bold uppercase">Mẹo nhỏ</p>
                <p className="text-[10px] text-amber-600">Hãy đảm bảo bạn đã nhấn nút "Đồng bộ Cloud" trước khi gửi link này!</p>
              </div>

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
                onClick={() => setShareModal({ ...shareModal, isOpen: false, url: '', title: '', id: '' })}
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
