
import React from 'react';

export const AppsScriptGuide: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const scriptCode = `function doGet(e) {
  var action = e.parameter.action;
  if (action == "getQuiz") {
    var quizId = e.parameter.quizId;
    var data = CacheService.getScriptCache().get("quiz_" + quizId);
    return ContentService.createTextOutput(data).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput("Invalid Action");
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var cache = CacheService.getScriptCache();
  if (data.action == "SAVE_QUIZ") {
    cache.put("quiz_" + data.quiz.id, JSON.stringify(data.quiz), 21600);
    return ContentService.createTextOutput("Success");
  }
  return ContentService.createTextOutput("Error");
}`;

  return (
    <div className="fixed inset-0 z-[350] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] fade-in">
        <div className="p-8 bg-emerald-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-3xl">☁️</span>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Cấu hình Cloud Vault</h3>
              <p className="text-[10px] font-bold opacity-80 uppercase">Kết nối Google Apps Script để lưu trữ đề thi</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <section className="space-y-3">
                <h4 className="font-black text-emerald-600 text-xs uppercase tracking-widest border-l-4 border-emerald-600 pl-3">Bước 1: Tạo Script</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Truy cập script.google.com | Chọn "Dự án mới" | Xóa hết code cũ và dán đoạn mã bên cạnh vào.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="font-black text-emerald-600 text-xs uppercase tracking-widest border-l-4 border-emerald-600 pl-3">Bước 2: Triển khai</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Chọn "Triển khai" (Deploy) | "Triển khai mới" | Chọn loại là "Ứng dụng Web" (Web App).
                </p>
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                  <p className="text-[10px] font-black text-amber-700 uppercase mb-1">⚠️ Quan trọng</p>
                  <p className="text-[10px] text-amber-600 font-bold">Mục "Ai có quyền truy cập" hãy chọn là "Bất kỳ ai" (Anyone).</p>
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="font-black text-emerald-600 text-xs uppercase tracking-widest border-l-4 border-emerald-600 pl-3">Bước 3: Kết nối</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Sao chép "URL ứng dụng Web" | Quay lại Dashboard | Vào tab "Cloud" | Dán link vào và lưu lại.
                </p>
              </section>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Mã nguồn tham khảo</label>
                <button 
                  onClick={() => { navigator.clipboard.writeText(scriptCode); alert("Đã copy!"); }}
                  className="text-[10px] font-black text-emerald-600 hover:underline uppercase"
                >
                  Sao chép mã
                </button>
              </div>
              <pre className="bg-slate-900 text-emerald-400 p-6 rounded-[2rem] text-[10px] font-mono leading-relaxed overflow-x-auto shadow-inner border-2 border-slate-800 h-[300px] custom-scrollbar">
                {scriptCode}
              </pre>
            </div>
          </div>
        </div>
        
        <div className="p-8 bg-slate-50 border-t flex justify-center">
          <button onClick={onClose} className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-emerald-100 hover:scale-105 transition-all">Đã hoàn thành thiết lập</button>
        </div>
      </div>
    </div>
  );
};
