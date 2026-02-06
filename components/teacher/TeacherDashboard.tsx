
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
    try {
      const count = await storageService.syncAllQuizzesFromCloud();
      setQuizzes(storageService.getQuizzes());
      alert(`Đã đồng bộ ${count} đề thi từ kho lưu trữ Cloud.`);
    } catch (e) {
      alert("Lỗi khi tải đề: " + e);
    } finally {
      setIsPulling(false);
    }
  };

  const syncQuizToCloud = async (quiz: Quiz) => {
    if (!appConfig.globalWebhookUrl) {
      alert("Vui lòng cài đặt cấu hình Cloud trước!");
      setActiveTab('config');
      return;
    }

    setSyncingId(quiz.id);
    try {
      // Gửi toàn bộ dữ liệu đề lên Cloud
      // Script v4.0 sẽ tự tạo folder trên Drive để chứa JSON này
      await fetch(appConfig.globalWebhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_QUIZ',
          quiz: quiz
        })
      });
      alert(`Đã lưu đề "${quiz.title}" vào thư mục riêng trên Cloud Drive!`);
    } catch (err) {
      alert("Lỗi đồng bộ: " + err);
    } finally {
      setSyncingId(null);
    }
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
 * Phiên bản: 4.0 (Kiến trúc Folder-per-Quiz & Drive Storage)
 * Giúp vượt giới hạn 50.000 ký tự của Google Sheets.
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var rootFolderName = "QuizMaster_Data_Vault";
    
    // 1. Khởi tạo/Tìm thư mục gốc
    var rootFolder = getOrCreateFolder(DriveApp.getRootFolder(), rootFolderName);
    
    if (data.action === "SAVE_QUIZ") {
      var quizFolder = getOrCreateFolder(rootFolder, "Quiz_" + data.quiz.id);
      
      // Lưu nội dung đề thi vào file JSON trong thư mục riêng
      var fileName = "quiz_data.json";
      var files = quizFolder.getFilesByName(fileName);
      if (files.hasNext()) {
        files.next().setContent(JSON.stringify(data.quiz));
      } else {
        quizFolder.createFile(fileName, JSON.stringify(data.quiz), MimeType.PLAIN_TEXT);
      }
      
      // Cập nhật Index vào Sheet để quản lý danh sách
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName("QUIZ_INDEX") || ss.insertSheet("QUIZ_INDEX");
      if (sheet.getLastRow() === 0) sheet.appendRow(["ID", "Title", "Class", "FolderID", "CreatedAt"]);
      
      var rows = sheet.getDataRange().getValues();
      var found = false;
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] === data.quiz.id) {
          sheet.getRange(i + 1, 2).setValue(data.quiz.title);
          sheet.getRange(i + 1, 3).setValue(data.quiz.classId);
          sheet.getRange(i + 1, 4).setValue(quizFolder.getId());
          found = true; break;
        }
      }
      if (!found) sheet.appendRow([data.quiz.id, data.quiz.title, data.quiz.classId, quizFolder.getId(), new Date()]);
      
      return ContentService.createTextOutput("SUCCESS");
    }
    
    if (data.action === "SUBMIT_RESULT") {
      var quizFolder = getOrCreateFolder(rootFolder, "Quiz_" + data.quizId);
      var subFolder = getOrCreateFolder(quizFolder, "submissions");
      
      // Mỗi bài làm là một file JSON riêng biệt
      var submissionFileName = "result_" + data.id + ".json";
      subFolder.createFile(submissionFileName, JSON.stringify(data), MimeType.PLAIN_TEXT);
      
      // Ghi log vào Sheet kết quả chung để giáo viên xem nhanh
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var resultSheet = ss.getSheetByName("RESULTS_LOG") || ss.insertSheet("RESULTS_LOG");
      if (resultSheet.getLastRow() === 0) resultSheet.appendRow(["ID", "QuizID", "Học tên", "Lớp", "Điểm", "Thời gian(s)", "Thời điểm"]);
      resultSheet.appendRow([data.id, data.quizId, data.studentName, data.studentClass, data.score, data.timeTaken, data.timestamp]);
      
      return ContentService.createTextOutput("SUCCESS");
    }
  } catch (err) {
    return ContentService.createTextOutput("ERROR: " + err.toString());
  }
}

function doGet(e) {
  try {
    var action = e.parameter.action;
    var rootFolderName = "QuizMaster_Data_Vault";
    var rootFolder = getOrCreateFolder(DriveApp.getRootFolder(), rootFolderName);

    if (action === "getQuiz") {
      var quizFolder = getOrCreateFolder(rootFolder, "Quiz_" + e.parameter.quizId);
      var files = quizFolder.getFilesByName("quiz_data.json");
      if (files.hasNext()) {
        var content = files.next().getBlob().getDataAsString();
        return ContentService.createTextOutput(content).setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput("NOT_FOUND");
    }

    if (action === "listQuizzes") {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName("QUIZ_INDEX");
      if (!sheet) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
      
      var rows = sheet.getDataRange().getValues();
      var list = [];
      // Chúng ta chỉ list metadata từ Sheet, nội dung chi tiết sẽ tải sau qua getQuiz
      for (var i = 1; i < rows.length; i++) {
        list.push({ id: rows[i][0], title: rows[i][1], classId: rows[i][2], createdAt: rows[i][4] });
      }
      return ContentService.createTextOutput(JSON.stringify(list)).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "getResults") {
      var quizFolder = getOrCreateFolder(rootFolder, "Quiz_" + e.parameter.quizId);
      var subFolder = getOrCreateFolder(quizFolder, "submissions");
      var files = subFolder.getFiles();
      var results = [];
      while (files.hasNext()) {
        var file = files.next();
        results.push(JSON.parse(file.getBlob().getDataAsString()));
      }
      return ContentService.createTextOutput(JSON.stringify(results)).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput("ERROR: " + err.toString());
  }
}

function getOrCreateFolder(parent, name) {
  var folders = parent.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parent.createFolder(name);
}`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Bảng điều khiển</h2>
          <p className="text-slate-500 font-medium italic">Drive Storage Architecture v4.0</p>
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
          <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border shadow-sm">
             <div>
                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Kho lưu trữ Cloud Drive</p>
                <p className="text-[10px] font-bold text-slate-400">Dữ liệu được lưu an toàn trong thư mục "QuizMaster_Data_Vault" của bạn.</p>
             </div>
             <button 
                onClick={handlePullQuizzes}
                disabled={isPulling}
                className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg ${isPulling ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
             >
               {isPulling ? 'Đang quét Drive...' : '📥 Đồng bộ từ Drive'}
             </button>
          </div>
          
          <div className="grid gap-4">
            {quizzes.length === 0 ? (
              <div className="bg-white p-20 text-center rounded-[3rem] border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-medium mb-4">Chưa có đề thi nào. Hãy tạo mới hoặc đồng bộ từ Google Drive.</p>
              </div>
            ) : (
              quizzes.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0)).map(q => (
                <div key={q.id} className={`bg-white p-6 rounded-[2.5rem] border shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group ${q.isLocked ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-black text-xl text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {q.title}
                      </h3>
                      <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-black uppercase">LỚP: {q.classId}</span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium italic">ID: {q.id}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => syncQuizToCloud(q)}
                      className={`px-4 py-3 rounded-2xl transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${syncingId === q.id ? 'bg-slate-100 text-slate-400 animate-pulse' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                      disabled={syncingId === q.id}
                    >
                      {syncingId === q.id ? 'Đang lưu...' : '☁️ Đẩy lên Drive'}
                    </button>
                    <button 
                      onClick={() => { setSelectedQuizId(q.id); setActiveTab('stats'); }}
                      className="px-5 py-3 bg-slate-100 text-slate-700 rounded-2xl font-black hover:bg-slate-200 uppercase text-[10px] tracking-widest"
                    >
                      📊 Bài làm
                    </button>
                    <button 
                      onClick={() => openShareModal(q)} 
                      className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-lg uppercase text-[10px] tracking-widest"
                    >
                      🚀 Link Thi
                    </button>
                    <button 
                      onClick={() => { if(confirm('Xóa đề này khỏi danh sách máy?')) { storageService.deleteQuiz(q.id); setQuizzes(storageService.getQuizzes()); } }}
                      className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
          <div className="space-y-2 text-center">
            <h3 className="text-3xl font-black text-emerald-600 uppercase tracking-tight">Cấu hình Hệ thống Drive v4.0</h3>
            <p className="text-slate-500 font-medium">Hệ thống sẽ tự động quản lý thư mục và file đề thi cho bạn.</p>
          </div>
          <div className="bg-emerald-50 p-8 rounded-[3rem] border border-emerald-100 space-y-6">
             <div className="space-y-2">
              <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-3">Google Apps Script Web App URL</label>
              <input 
                type="url" 
                value={appConfig.globalWebhookUrl} 
                onChange={e => setAppConfig({...appConfig, globalWebhookUrl: e.target.value})}
                className="w-full border-2 p-5 rounded-[2rem] focus:border-emerald-600 outline-none transition-all font-bold bg-white shadow-inner"
                placeholder="Dán link Apps Script vào đây..."
              />
            </div>
            <div className="bg-white/50 p-4 rounded-2xl border border-emerald-200">
               <p className="text-xs text-emerald-800 font-bold mb-2 uppercase">Lưu ý nâng cấp:</p>
               <ul className="text-[11px] text-emerald-700 list-disc ml-4 space-y-1 font-medium">
                 <li>Phiên bản 4.0 yêu cầu mã Apps Script mới nhất (nhấn nút "Lấy mã" bên dưới).</li>
                 <li>Dữ liệu được lưu thành file .json trong thư mục <b>QuizMaster_Data_Vault</b> trên Drive.</li>
                 <li>Vượt giới hạn ký tự của Google Sheets (thoải mái lưu ảnh Base64).</li>
               </ul>
            </div>
            <button 
              onClick={() => setShowHelp(true)}
              className="w-full py-3 text-sm font-black text-emerald-600 underline hover:text-emerald-800"
            >
              Lấy mã Apps Script v4.0 (Drive Support)
            </button>
          </div>
          <div className="flex gap-4">
             <button onClick={() => setActiveTab('list')} className="flex-1 py-4 bg-slate-100 rounded-3xl font-black uppercase text-xs">Hủy</button>
             <button onClick={handleSaveConfig} className="flex-[2] py-4 bg-emerald-600 text-white rounded-3xl font-black shadow-xl shadow-emerald-100 uppercase text-xs">Lưu cấu hình Cloud</button>
          </div>
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
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black uppercase italic">Apps Script v4.0 - Drive Vault</h3>
                <p className="text-xs opacity-80 font-bold">Hỗ trợ lưu trữ file JSON không giới hạn dung lượng</p>
              </div>
              <button onClick={() => setShowHelp(false)} className="bg-white/20 p-2 rounded-full hover:bg-white/40 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50">
              <pre className="bg-slate-900 text-emerald-400 p-8 rounded-[2rem] overflow-x-auto text-[11px] font-mono leading-relaxed shadow-2xl mb-6">
                {appsScriptCode}
              </pre>
              <button 
                onClick={() => copyToClipboard(appsScriptCode)} 
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 uppercase text-xs tracking-widest"
              >
                Sao chép mã nguồn v4.0
              </button>
            </div>
          </div>
        </div>
      )}

      {shareModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[4rem] shadow-2xl p-10 text-center space-y-8 border-t-[10px] border-indigo-600">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{shareModal.title}</h3>
              <p className="text-xs font-bold text-slate-400">Quét mã QR để bắt đầu thi</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-[3rem] border-2 border-slate-100 shadow-inner inline-block">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareModal.url)}`} className="w-48 h-48 mx-auto" alt="QR" />
            </div>
            <div className="flex gap-2">
              <input readOnly value={shareModal.url} className="flex-1 bg-slate-50 border p-3 rounded-2xl text-[10px] font-mono text-slate-400 truncate" />
              <button onClick={() => copyToClipboard(shareModal.url)} className="bg-indigo-600 text-white px-4 rounded-2xl">Copy</button>
            </div>
            <button onClick={() => setShareModal({ ...shareModal, isOpen: false, id: '' })} className="w-full py-4 bg-slate-100 rounded-3xl font-black uppercase text-xs">Đóng lại</button>
          </div>
        </div>
      )}
    </div>
  );
};
