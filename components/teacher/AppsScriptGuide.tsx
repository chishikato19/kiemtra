
import React from 'react';

export const AppsScriptGuide: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const scriptCode = `// QuizMaster Pro - Apps Script Cloud Vault v4.6 (Stable Sync)
function doGet(e) {
  var action = e.parameter.action;
  var props = PropertiesService.getScriptProperties();
  
  // 1. Lấy nội dung chi tiết một đề thi
  if (action == "getQuiz") {
    var data = props.getProperty("quiz_" + e.parameter.quizId);
    return ContentService.createTextOutput(data || "{}").setMimeType(ContentService.MimeType.JSON);
  }
  
  // 2. Liệt kê danh sách đề thi
  if (action == "listQuizzes") {
    var allKeys = props.getKeys();
    var quizzes = [];
    allKeys.forEach(function(k) {
      if (k.indexOf("quiz_") === 0) {
        try {
          var q = JSON.parse(props.getProperty(k));
          quizzes.push({id: q.id, title: q.title});
        } catch(e) {}
      }
    });
    return ContentService.createTextOutput(JSON.stringify(quizzes)).setMimeType(ContentService.MimeType.JSON);
  }
  
  // 3. Tải danh sách kết quả (Đã fix lọc ID)
  if (action == "getResults") {
    var sheet = getOrCreateSheet("Results");
    var rows = sheet.getDataRange().getValues();
    var results = [];
    var targetId = String(e.parameter.quizId);
    
    for (var i = 1; i < rows.length; i++) {
      try {
        var res = JSON.parse(rows[i][3]); 
        if (String(res.quizId) === targetId) {
          results.push(res);
        }
      } catch(err) {}
    }
    return ContentService.createTextOutput(JSON.stringify(results)).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput("Invalid Action");
}

function doPost(e) {
  var data;
  try {
    // Thử giải mã JSON từ nội dung POST trực tiếp
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    // Nếu thất bại, thử giải mã từ tham số (trường hợp no-cors đóng gói khác)
    try {
      var keys = Object.keys(e.parameter);
      if (keys.length > 0) {
        data = JSON.parse(keys[0]);
      }
    } catch(err2) {
      return ContentService.createTextOutput("Parse Error");
    }
  }

  var props = PropertiesService.getScriptProperties();
  
  if (data.action == "SAVE_QUIZ") {
    props.setProperty("quiz_" + data.quiz.id, JSON.stringify(data.quiz));
    return ContentService.createTextOutput("Success");
  }
  
  if (data.action == "SUBMIT_RESULT") {
    var sheet = getOrCreateSheet("Results");
    // Lưu: Thời gian | Tên | Điểm | JSON gốc
    sheet.appendRow([new Date(), data.studentName, data.score, JSON.stringify(data)]);
    return ContentService.createTextOutput("Success");
  }
  
  return ContentService.createTextOutput("Action Not Found");
}

function getOrCreateSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name == "Results") {
      sheet.appendRow(["Thời gian", "Học sinh", "Điểm", "Dữ liệu JSON"]);
      sheet.setFrozenRows(1);
    }
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
              <h3 className="text-xl font-black uppercase tracking-tight">Cấu hình Cloud Vault v4.6</h3>
              <p className="text-[10px] font-bold opacity-80 uppercase">Đã khắc phục lỗi đồng bộ bài làm</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
          <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 flex items-start gap-4">
            <span className="text-2xl">⚡</span>
            <div className="space-y-1">
              <p className="font-black text-rose-700 text-xs uppercase">Quan trọng cho bản v4.6</p>
              <p className="text-[11px] text-rose-600 font-medium">Nếu bạn gặp lỗi học sinh nộp bài nhưng không thấy trên bảng điểm, vui lòng <b>Copy lại mã nguồn dưới đây</b> và <b>Triển khai phiên bản mới</b> trên Google Apps Script.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <section className="space-y-3">
                <h4 className="font-black text-emerald-600 text-xs uppercase tracking-widest border-l-4 border-emerald-600 pl-3">Các bước cập nhật</h4>
                <ol className="text-xs text-slate-600 leading-relaxed font-medium list-decimal ml-4 space-y-2">
                  <li>Mở dự án Apps Script hiện tại của bạn.</li>
                  <li>Xóa sạch mã cũ và dán mã mới bên cạnh vào.</li>
                  <li>Bấm <b>Triển khai</b> {'>'} <b>Quản lý việc triển khai</b>.</li>
                  <li>Chọn icon bút chì {'>'} Phiên bản: <b>Phiên bản mới</b>.</li>
                  <li>Bấm <b>Triển khai</b> để áp dụng thay đổi.</li>
                </ol>
              </section>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Mã nguồn (v4.6 Stable)</label>
                <button 
                  onClick={() => { navigator.clipboard.writeText(scriptCode); alert("Đã sao chép mã v4.6!"); }}
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
          <button onClick={onClose} className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-emerald-100 hover:scale-105 transition-all">Đã cập nhật mã nguồn</button>
        </div>
      </div>
    </div>
  );
};
