
import React from 'react';

export const InstructionGuide: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[350] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] fade-in border-4 border-indigo-600">
        <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-3xl">📖</span>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight italic">Cẩm nang QuizMaster Pro</h3>
              <p className="text-[10px] font-bold opacity-80 uppercase">Hướng dẫn vận hành và soạn đề mẫu</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
          <section className="space-y-6">
            <h4 className="text-lg font-black text-indigo-600 uppercase tracking-tighter border-b-2 border-indigo-100 pb-2">1. Quy trình 3 bước chuẩn</h4>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: "01", title: "Soạn Thảo", desc: "Soạn đề trên Word theo cấu trúc định sẵn, đặt bảng đáp án ở cuối trang." },
                { step: "02", title: "Phát Hành", desc: "Nạp file vào hệ thống, kiểm tra lại nội dung và bấm Lưu để lấy link." },
                { step: "03", title: "Báo Cáo", desc: "Học sinh nộp bài, hệ thống tự thống kê và cho phép in PDF kết quả." }
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-50 p-6 rounded-[2.5rem] relative">
                  <span className="absolute top-4 right-6 text-4xl font-black text-indigo-100">{item.step}</span>
                  <h5 className="font-black text-slate-800 uppercase text-xs mb-2 relative">{item.title}</h5>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <h4 className="text-lg font-black text-indigo-600 uppercase tracking-tighter border-b-2 border-indigo-100 pb-2">2. Định dạng Đề mẫu (Chuẩn Word)</h4>
            <div className="bg-slate-900 p-8 rounded-[3rem] font-mono text-xs leading-relaxed text-indigo-300 shadow-2xl relative">
              <div className="absolute top-4 right-8 bg-white/10 px-3 py-1 rounded-full text-[9px] font-black uppercase text-indigo-100">Cấu trúc mẫu</div>
              <p className="text-white font-bold mb-4">// Nội dung đề thi</p>
              Câu 1: Chiến thắng Điện Biên Phủ diễn ra năm nào?<br/>
              A. 1945<br/>
              B. 1954<br/>
              C. 1975<br/>
              D. 1930<br/><br/>
              Câu 2: Việt Nam nằm ở khu vực Đông Nam Á, đúng hay sai?<br/><br/>
              Câu 3: Thủ đô của Pháp là gì?<br/><br/>
              <p className="text-white font-bold my-4 uppercase">// Bảng đáp án cuối file (Bắt buộc)</p>
              ĐÁP ÁN<br/>
              1-B, 2-Đ, 3-Paris
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-lg font-black text-indigo-600 uppercase tracking-tighter border-b-2 border-indigo-100 pb-2">3. Ký hiệu nhận diện đáp án</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border-2 border-slate-100 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Trắc nghiệm</p>
                <p className="text-[11px] font-bold text-slate-500 italic">Dùng chữ cái: A, B, C, D</p>
              </div>
              <div className="border-2 border-slate-100 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Đúng | Sai</p>
                <p className="text-[11px] font-bold text-slate-500 italic">Dùng chữ: Đ hoặc S</p>
              </div>
              <div className="border-2 border-slate-100 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Trả lời ngắn</p>
                <p className="text-[11px] font-bold text-slate-500 italic">Ghi trực tiếp từ khóa</p>
              </div>
              <div className="border-2 border-slate-100 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Nối cặp</p>
                <p className="text-[11px] font-bold text-slate-500 italic">Dạng: (1-a, 2-b)</p>
              </div>
            </div>
          </section>
        </div>
        
        <div className="p-8 bg-slate-50 border-t flex justify-center">
          <button onClick={onClose} className="px-16 py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-sm shadow-2xl hover:scale-105 transition-all">Đã rõ quy trình</button>
        </div>
      </div>
    </div>
  );
};
