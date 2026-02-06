
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
  const [isPulling, setIsPulling] = useState(false);
  
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

  const handlePullQuizzes = async () => {
    if (!appConfig.globalWebhookUrl) {
      alert("Vui lòng cấu hình Cloud trước!");
      setActiveTab('config');
      return;
    }
    setIsPulling(true);
    const count = await storageService.syncAllQuizzesFromCloud();
    setQuizzes(storageService.getQuizzes());
    setIsPulling(false);
    alert(`Đã tải về ${count} đề thi từ Cloud.`);
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
      alert(`Đã đồng bộ đề "${quiz.title}" lên Cloud!`);
    } catch (err) {
      alert("Lỗi đồng bộ: " + err);
    } finally {
      setSyncingId(null);
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
    const encodedW = btoa(appConfig.globalWebhookUrl).replace(/=/g, '');
    const url = `${window.location.origin}${window.location.pathname}#/quiz/${quiz.id}?w=${encodedW}`;
    setShareModal({ isOpen: true, url, title: quiz.title, id: quiz.id });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Đã sao chép!");
  };

  const appsScriptCode = `/**
 * GOOGLE APPS SCRIPT: HỆ THỐNG CLOUD QUIZMASTER PRO
 * Phiên bản: 3.2 (Hỗ trợ Tải đề & Tải kết quả bài làm)
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (data.action === "SAVE_QUIZ") {
      var quizSheet = ss.getSheetByName("CLOUD_QUIZZES") || ss.insertSheet("CLOUD_QUIZZES");
      if (quizSheet.getLastRow() === 0) quizSheet.appendRow(["ID", "DataJSON", "CreatedAt"]);
      
      var rows = quizSheet.getDataRange().getValues();
      var foundIndex = -1;
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] === data.quiz.id) { foundIndex = i + 1; break; }
      }
      
      if (foundIndex > -1) {
        quizSheet.getRange(foundIndex, 2).setValue(JSON.stringify(data.quiz));
        quizSheet.getRange(foundIndex, 3).setValue(new Date());
      } else {
        quizSheet.appendRow([data.quiz.id, JSON.stringify(data.quiz), new Date()]);
      }
      return ContentService.createTextOutput("QUIZ_SAVED");
    }
    
    if (data.action === "SUBMIT_RESULT") {
      var sheet = ss.getSheetByName("RESULTS") || ss.insertSheet("RESULTS");
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["ID", "QuizID", "Họ tên", "Lớp", "Điểm", "Thời gian(s)", "Thời điểm nộp", "QuizTitle"]);
      }
      sheet.appendRow([
        data.id, data.quizId, data.studentName, data.studentClass, 
        data.score, data.timeTaken, data.timestamp, data.quizTitle
      ]);
      return ContentService.createTextOutput("RESULT_SAVED");
    }
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
    if (!quizSheet) return ContentService.createTextOutput("NOT_FOUND");
    var rows = quizSheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === quizId) return ContentService.createTextOutput(rows[i][1]).setMimeType(ContentService.MimeType.JSON);
    }
  }

  if (action === "listQuizzes") {
    var quizSheet = ss.getSheetByName("CLOUD_QUIZZES");
    if (!quizSheet) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
    var rows = quizSheet.getDataRange().getValues();
    var list = [];
    for (var i = 1; i < rows.length; i++) {
      list.push(JSON.parse(rows[i][1]));
    }
    return ContentService.createTextOutput(JSON.stringify(list)).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "getResults") {
    var quizId = e.parameter.quizId;
    var resultSheet = ss.getSheetByName("RESULTS");
    if (!resultSheet) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
    var rows = resultSheet.getDataRange().getValues();
    var results = [];
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][1] === quizId) {
        results.push({
          id: rows[i][0], quizId: rows[i][1], studentName: rows[i][2],
          studentClass: rows[i][3], score: rows[i][4], timeTaken: rows[i][5],
          submittedAt: new Date(rows[i][6]).getTime()
        });
      }
    }
    return ContentService.createTextOutput(JSON.stringify(results)).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput("INVALID_ACTION");
}`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Bảng điều khiển</h2>
          <p className="text-slate-500 font-medium">Smart Sync v3.2</p>
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
          <div className="flex justify-between items-center bg-white p-4 rounded-3xl border shadow-sm">
             <p className="text-sm font-bold text-slate-500 px-2">Quản lý các đề thi của bạn</p>
             <button 
                onClick={handlePullQuizzes}
                disabled={isPulling}
                className={`px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all ${isPulling ? 'bg-slate-100 text-slate-400 animate-pulse' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
             >
               {isPulling ? 'Đang tải...' : '📥 Tải đề từ Cloud'}
             </button>
          </div>
          
          <div className="grid gap-4">
            {quizzes.length === 0 ? (
              <div className="bg-white p-20 text-center rounded-[2rem] border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-medium mb-4">Chưa có đề thi nào. Hãy tạo mới hoặc tải từ Cloud.</p>
                <button onClick={() => setActiveTab('create')} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg">Bắt đầu tạo đề</button>
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
                    <p className="text-sm text-slate-500 font-medium">🏫 Lớp: <b>{q.classId}</b> • 📝 <b>{q.questions.length}</b> câu hỏi</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => syncQuizToCloud(q)}
                      className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${syncingId === q.id ? 'bg-slate-100 text-slate-400 animate-pulse' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                      disabled={syncingId === q.id}
                    >
                      {syncingId === q.id ? 'Đang đẩy...' : '☁️ Đẩy lên Cloud'}
                    </button>
                    <button 
                      onClick={() => { setSelectedQuizId(q.id); setActiveTab('stats'); }}
                      className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-2xl font-black hover:bg-slate-200 transition-colors uppercase text-[10px] tracking-widest"
                    >
                      📊 Thống kê
                    </button>
                    <button 
                      onClick={() => openShareModal(q)} 
                      className="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-lg shadow-indigo-100 uppercase text-[10px] tracking-widest"
                    >
                      🚀 Chia sẻ
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
            <p className="text-slate-500 font-medium">Link Webhook v3.2 giúp đồng bộ toàn bộ dữ liệu Đề thi và Kết quả học sinh.</p>
          </div>
          <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-3">Apps Script URL</label>
              <input 
                type="url" 
                value={appConfig.globalWebhookUrl} 
                onChange={e => setAppConfig({...appConfig, globalWebhookUrl: e.target.value})}
                className="w-full border-2 p-4 rounded-2xl focus:border-emerald-600 outline-none transition-all font-bold bg-white"
                placeholder="https://script.google.com/macros/s/.../exec"
              />
            </div>
            <button 
              onClick={() => setShowHelp(true)}
              className="text-xs font-black text-emerald-600 underline hover:text-emerald-800"
            >
              Lấy mã Apps Script v3.2
            </button>
          </div>
          <button onClick={handleSaveConfig} className="w-full py-4 bg-emerald-600 text-white rounded-[2rem] font-black shadow-xl uppercase tracking-widest text-xs">Cập nhật cấu hình</button>
        </div>
      )}

      {(activeTab === 'create' || activeTab === 'edit') && (
        <QuizCreateForm quizToEdit={quizToEdit} onSuccess={() => setActiveTab('list')} />
      )}

      {activeTab === 'stats' && selectedQuizId && (
        <QuizStatsView quizId={selectedQuizId} onBack={() => setActiveTab('list')} />
      )}

      {showHelp && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase">Apps Script v3.2 Cloud Sync</h3>
              <button onClick={() => setShowHelp(false)} className="bg-white/20 p-2 rounded-full">X</button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <pre className="bg-slate-900 text-emerald-400 p-6 rounded-2xl overflow-x-auto text-[11px] font-mono leading-relaxed shadow-inner mb-6">
                {appsScriptCode}
              </pre>
              <button onClick={() => copyToClipboard(appsScriptCode)} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-xs">Sao chép mã v3.2</button>
            </div>
          </div>
        </div>
      )}

      {shareModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-8 text-center space-y-6">
            <h3 className="text-2xl font-black uppercase">{shareModal.title}</h3>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareModal.url)}`} className="w-44 h-44 mx-auto" alt="QR" />
            <div className="flex gap-2">
              <input readOnly value={shareModal.url} className="flex-1 bg-slate-50 border p-3 rounded-xl text-[10px] font-mono" />
              <button onClick={() => copyToClipboard(shareModal.url)} className="bg-indigo-600 text-white p-3 rounded-xl">Copy</button>
            </div>
            <button onClick={() => setShareModal({ ...shareModal, isOpen: false, id: '' })} className="w-full py-3 bg-slate-100 rounded-xl font-black uppercase text-xs">Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
};
