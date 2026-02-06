
import React, { useState, useEffect } from 'react';
import { Quiz, AppConfig, Folder } from '../../types';
import { storageService } from '../../services/storageService';
import { QuizCreateForm } from './QuizCreateForm';
import { QuizStatsView } from './QuizStatsView';
import { QuizListItem } from './QuizListItem';
import { AppsScriptGuide } from './AppsScriptGuide';
import { InstructionGuide } from './InstructionGuide';

export const TeacherDashboard: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'stats' | 'edit' | 'config'>('list');
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizToEdit, setQuizToEdit] = useState<Quiz | undefined>(undefined);
  const [appConfig, setAppConfig] = useState<AppConfig>({ globalWebhookUrl: '' });
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showScriptGuide, setShowScriptGuide] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [shareModal, setShareModal] = useState<{ isOpen: boolean, url: string, title: string, id: string }>({ isOpen: false, url: '', title: '', id: '' });

  useEffect(() => {
    setQuizzes(storageService.getQuizzes());
    setFolders(storageService.getFolders());
    setAppConfig(storageService.getAppConfig());
  }, [activeTab]);

  const syncQuizToCloud = async (quiz: Quiz) => {
    if (!appConfig.globalWebhookUrl) { alert("Vui lòng cấu hình Cloud!"); setActiveTab('config'); return; }
    setSyncingId(quiz.id);
    try {
      await fetch(appConfig.globalWebhookUrl, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'SAVE_QUIZ', quiz }) });
      alert(`Đã lưu "${quiz.title}"!`);
    } catch (err) { alert("Lỗi kết nối Cloud: " + err); }
    finally { setSyncingId(null); }
  };

  const openShareModal = (quiz: Quiz) => {
    const encodedW = btoa(appConfig.globalWebhookUrl).replace(/=/g, '');
    const url = `${window.location.origin}${window.location.pathname}#/quiz/${quiz.id}?w=${encodedW}`;
    setShareModal({ isOpen: true, url, title: quiz.title, id: quiz.id });
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setQuizToEdit(quiz);
    setActiveTab('edit');
  };

  const filteredQuizzes = quizzes.filter(q => currentFolderId ? q.folderId === currentFolderId : !q.folderId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter italic">Bảng quản trị</h2>
          <div className="flex gap-3 mt-1">
            <button onClick={() => setShowUserGuide(true)} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Hướng dẫn sử dụng</button>
            <span className="text-slate-300">|</span>
            <button onClick={() => setShowScriptGuide(true)} className="text-[10px] font-black text-emerald-600 uppercase hover:underline">Thiết lập Cloud</button>
          </div>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border shadow-sm items-center">
          <button onClick={() => { setQuizToEdit(undefined); setActiveTab('list'); }} className={`px-4 py-2 rounded-xl font-bold transition-all text-sm ${activeTab === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>Danh sách</button>
          <button onClick={() => { setQuizToEdit(undefined); setActiveTab('create'); }} className={`px-4 py-2 rounded-xl font-bold transition-all text-sm ${activeTab === 'create' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>+ Tạo đề</button>
          <button onClick={() => setActiveTab('config')} className={`px-4 py-2 rounded-xl font-bold transition-all text-sm ${activeTab === 'config' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-600'}`}>⚙️ Cloud</button>
        </div>
      </div>

      {activeTab === 'list' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2.5rem] border shadow-sm">
             <div>
                {currentFolderId ? (
                   <button onClick={() => setCurrentFolderId(null)} className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase transition-all hover:translate-x-1">- Quay lại thư mục gốc</button>
                ) : ( <p className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Kho đề thi cục bộ</p> )}
             </div>
             <div className="flex gap-2">
                <button onClick={() => setShowNewFolderModal(true)} className="px-6 py-3 bg-white border rounded-2xl font-black text-[10px] uppercase text-indigo-600 hover:bg-slate-50 transition-all">📁 Thư mục mới</button>
                <button 
                  onClick={async () => { setIsPulling(true); const count = await storageService.syncAllQuizzesFromCloud(); setQuizzes(storageService.getQuizzes()); setIsPulling(false); alert(`Đã tải thêm ${count} đề từ Cloud!`); }} 
                  disabled={isPulling}
                  className={`px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase transition-all ${isPulling ? 'opacity-50 animate-pulse' : 'hover:bg-indigo-700 shadow-lg shadow-indigo-100'}`}
                >
                  {isPulling ? 'Đang đồng bộ...' : '📥 Sync Cloud'}
                </button>
             </div>
          </div>

          {!currentFolderId && folders.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {folders.map(f => (
                <div key={f.id} className="relative group">
                  <button onClick={() => setCurrentFolderId(f.id)} className="w-full bg-white p-6 rounded-[2.5rem] border hover:shadow-xl hover:border-indigo-100 transition-all text-center">
                    <div className="text-4xl mb-3">📁</div>
                    <p className="font-black text-xs text-slate-700 truncate">{f.name}</p>
                  </button>
                  <button onClick={() => { if(confirm('Xóa thư mục này?')) { storageService.deleteFolder(f.id); setFolders(storageService.getFolders()); } }} className="absolute top-2 right-2 p-2 bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all">✕</button>
                </div>
              ))}
            </div>
          )}
          
          <div className="grid gap-4">
            {filteredQuizzes.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                <p className="text-slate-400 font-bold italic">Chưa có đề thi nào trong mục này.</p>
              </div>
            ) : filteredQuizzes.map(q => (
              <QuizListItem 
                key={q.id} quiz={q} folders={folders} syncingId={syncingId} 
                onSync={syncQuizToCloud} 
                onStats={(id) => { setSelectedQuizId(id); setActiveTab('stats'); }} 
                onEdit={handleEditQuiz}
                onShare={openShareModal} onDelete={(id) => { storageService.deleteQuiz(id); setQuizzes(storageService.getQuizzes()); }}
                onMove={(qid, fid) => { const quiz = storageService.getQuizById(qid); if(quiz) storageService.saveQuiz({...quiz, folderId: fid}); setQuizzes(storageService.getQuizzes()); }}
              />
            ))}
          </div>
        </div>
      )}

      {showNewFolderModal && (
        <div className="fixed inset-0 z-[250] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white max-w-sm w-full rounded-[3rem] p-10 space-y-6 shadow-2xl fade-in border-t-[10px] border-indigo-600">
              <h3 className="text-2xl font-black uppercase italic text-center">Thư mục mới</h3>
              <input type="text" className="w-full border-2 p-4 rounded-2xl font-bold bg-slate-50 focus:bg-white outline-none focus:border-indigo-600 transition-all" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Tên thư mục..." autoFocus />
              <div className="flex gap-2">
                 <button onClick={() => setShowNewFolderModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs">Hủy</button>
                 <button onClick={() => { if(newFolderName.trim()) storageService.saveFolder({id:`f-${Date.now()}`, name:newFolderName, createdAt:Date.now()}); setFolders(storageService.getFolders()); setShowNewFolderModal(false); setNewFolderName(''); }} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg">Tạo mới</button>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="bg-white p-10 rounded-[3rem] border shadow-2xl space-y-8 fade-in">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black uppercase text-emerald-600">Cấu hình Cloud Vault</h3>
            <p className="text-xs text-slate-400 font-medium italic">Kết nối máy chủ lưu trữ cá nhân của bạn</p>
          </div>
          <div className="space-y-4">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Đường dẫn Apps Script (Web App URL)</label>
             <input type="url" value={appConfig.globalWebhookUrl} onChange={e => setAppConfig({...appConfig, globalWebhookUrl: e.target.value})} className="w-full border-2 p-5 rounded-[2rem] font-bold outline-none focus:border-emerald-600 transition-all bg-slate-50 focus:bg-white" placeholder="https://script.google.com/macros/s/.../exec" />
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={() => { storageService.saveAppConfig(appConfig); alert("Cấu hình đã được lưu!"); setActiveTab('list'); }} className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all">Lưu cấu hình ngay</button>
            <button onClick={() => setShowScriptGuide(true)} className="text-[10px] font-black text-slate-400 uppercase hover:text-indigo-600 transition-all">Bạn chưa có link? Xem hướng dẫn tạo tại đây</button>
          </div>
        </div>
      )}

      {activeTab === 'stats' && selectedQuizId && <QuizStatsView quizId={selectedQuizId} onBack={() => setActiveTab('list')} />}
      {(activeTab === 'create' || activeTab === 'edit') && <QuizCreateForm quizToEdit={quizToEdit} onSuccess={() => { setQuizToEdit(undefined); setActiveTab('list'); }} />}

      {shareModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[300] backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-sm w-full rounded-[4rem] shadow-2xl p-10 text-center space-y-8 border-t-[12px] border-indigo-600 fade-in">
            <h3 className="text-2xl font-black uppercase leading-tight italic">{shareModal.title}</h3>
            <div className="bg-indigo-50 p-6 rounded-[3.5rem] border-2 border-dashed border-indigo-200 inline-block">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareModal.url)}`} className="w-48 h-48 mx-auto mix-blend-multiply" alt="QR" />
            </div>
            <div className="space-y-3">
               <button onClick={() => { navigator.clipboard.writeText(shareModal.url); alert("Đã copy link!"); }} className="w-full py-4 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs shadow-lg">Sao chép Link</button>
               <button onClick={() => setShareModal({ ...shareModal, isOpen: false, id: '' })} className="w-full py-4 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase text-xs">Đóng lại</button>
            </div>
          </div>
        </div>
      )}

      {showScriptGuide && <AppsScriptGuide onClose={() => setShowScriptGuide(false)} />}
      {showUserGuide && <InstructionGuide onClose={() => setShowUserGuide(false)} />}
    </div>
  );
};
