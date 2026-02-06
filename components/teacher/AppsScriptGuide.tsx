
import React from 'react';

export const AppsScriptGuide: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const scriptCode = `// QuizMaster Pro - Apps Script Cloud Vault v4.5
function doGet(e) {
  var action = e.parameter.action;
  var props = PropertiesService.getScriptProperties();
  
  // 1. Lấy nội dung chi tiết một đề thi
  if (action == "getQuiz") {
    var data = props.getProperty("quiz_" + e.parameter.quizId);
    return ContentService.createTextOutput(data || "{}").setMimeType(ContentService.MimeType.JSON);
  }
  
  // 2. Liệt kê danh sách tất cả đề thi có trên Cloud
  if (action == "listQuizzes") {
    var allKeys = props.getKeys();
    var quizzes = [];
    allKeys.forEach(function(k) {
      if (k.indexOf("quiz_") === 0) {
        var q = JSON.parse(props.getProperty(k));
        quizzes.push({id: q.id, title: q.title});
      }
    });
    return ContentService.createTextOutput(JSON.stringify(quizzes)).setMimeType(ContentService.MimeType.JSON);
  }
  
  // 3. Tải danh sách kết quả bài làm của học sinh
  if (action == "getResults") {
    var sheet = getOrCreateSheet("Results");
    var rows = sheet.getDataRange().getValues();
    var results = [];
    for (var i = 1; i < rows.length; i++) {
      var res = JSON.parse(rows[i][3]); // Dữ liệu JSON nằm ở cột D
      if (res.quizId == e.parameter.quizId) results.push(res);
    }
    return ContentService.createTextOutput(JSON.stringify(results)).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput("Invalid Action");
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var props = PropertiesService.getScriptProperties();
  
  // 4. Lưu đề thi từ máy giáo viên lên Cloud
  if (data.action == "SAVE_QUIZ") {
    props.setProperty("quiz_" + data.quiz.id, JSON.stringify(data.quiz));
    return ContentService.createTextOutput("Success");
  }
  
  // 5. Học sinh nộp bài thi về Cloud
  if (data.action == "SUBMIT_RESULT") {
    var sheet = getOrCreateSheet("Results");
    sheet.appendRow([new Date(), data.studentName, data.score, JSON.stringify(data)]);
    return ContentService.createTextOutput("Success");
  }
}

function getOrCreateSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name == "Results") sheet.appendRow(["Thời gian", "Học sinh", "Điểm", "Dữ liệu gốc"]);
  }
  return sheet;
}`;

  return (
    <div className="fixed inset-0 z-[350] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] fade-in">
        <div className="p-8 bg-emerald-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-3xl">☁️</span>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Cấu hình Cloud Vault Pro</h3>
              <p className="text-[10px] font-bold opacity-80 uppercase">Đồng bộ đề thi và bảng điểm vĩnh viễn</p>
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
                  Truy cập script.google.com | Tạo dự án mới gắn với 1 file Google Sheet | Dán đoạn mã bên cạnh vào.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="font-black text-emerald-600 text-xs uppercase tracking-widest border-l-4 border-emerald-600 pl-3">Bước 2: Triển khai</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Chọn "Triển khai" | "Triển khai mới" | Loại "Ứng dụng Web" | Mục truy cập chọn "Bất kỳ ai".
                </p>
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                  <p className="text-[10px] font-black text-amber-700 uppercase mb-1">⚠️ Lưu ý</p>
                  <p className="text-[10px] text-amber-600 font-bold">Khi Google hỏi quyền truy cập, hãy bấm "Advanced" và "Go to QuizMaster (unsafe)" để cấp quyền ghi vào Sheet.</p>
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="font-black text-emerald-600 text-xs uppercase tracking-widest border-l-4 border-emerald-600 pl-3">Bước 3: Kết nối</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Sao chép URL Web App vừa tạo | Quay lại mục "Cloud" trong Dashboard và dán vào.
                </p>
              </section>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Mã nguồn đồng bộ</label>
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
