
import { Quiz, StudentSubmission, QuestionType } from "../types";

export const pdfService = {
  generateReport: (quiz: Quiz, subs: StudentSubmission[], includeSignature: boolean) => {
    if (!quiz || subs.length === 0) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const reportHtml = `
      <html>
        <head>
          <title>Báo cáo - ${quiz.title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 0; margin: 0; color: #1e293b; line-height: 1.4; background: #fff; }
            .page { padding: 40px; page-break-after: always; min-height: 100vh; position: relative; }
            .header { border-bottom: 2px solid #4f46e5; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .student-info { display: grid; grid-template-cols: repeat(2, 1fr); gap: 10px; background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0; font-size: 11px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #f1f5f9; text-align: left; padding: 10px; font-size: 9px; text-transform: uppercase; font-weight: 900; color: #475569; border: 1px solid #e2e8f0; }
            td { padding: 10px; font-size: 11px; border: 1px solid #e2e8f0; vertical-align: top; }
            .status-badge { font-weight: 900; font-size: 9px; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; }
            .status-ok { color: #166534; background: #dcfce7; }
            .status-no { color: #991b1b; background: #fee2e2; }
            .signature-area { margin-top: 40px; display: flex; justify-content: space-between; }
            .sig-line { margin-top: 50px; border-top: 1px dotted #94a3b8; padding-top: 5px; font-size: 10px; font-weight: 700; text-align: center; width: 180px; }
          </style>
        </head>
        <body>
          ${subs.map(sub => `
            <div class="page">
              <div class="header">
                <div><h1 style="font-size: 18px; margin:0">${quiz.title}</h1><p style="margin:0; font-size:10px; color:#64748b">BÁO CÁO KẾT QUẢ CÁ NHÂN</p></div>
                <div style="background:#4f46e5; color:white; padding:10px 20px; border-radius:8px; text-align:center">
                  <span style="font-size:20px; font-weight:900">${sub.score.toFixed(1)}</span><br><span style="font-size:8px">ĐIỂM</span>
                </div>
              </div>
              <div class="student-info">
                <div><b>Học sinh:</b> ${sub.studentName}</div>
                <div><b>Lớp:</b> ${sub.studentClass}</div>
                <div><b>Thời gian nộp:</b> ${new Date(sub.submittedAt).toLocaleString('vi-VN')}</div>
                <div><b>Làm trong:</b> ${sub.timeTaken} giây</div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th style="width:30px">#</th>
                    <th>Dạng</th>
                    <th>Đáp án học sinh</th>
                    <th>Đáp án đúng</th>
                    <th style="width:50px">KQ</th>
                  </tr>
                </thead>
                <tbody>
                  ${quiz.questions.map((q, idx) => {
                    const ans = sub.answers[idx];
                    let isCorrect = false;
                    let displayAns = "";
                    let displayCorrect = "";
                    let typeLabel = "";

                    if (q.type === QuestionType.MULTIPLE_CHOICE) {
                      typeLabel = "Trắc nghiệm";
                      isCorrect = ans === q.correctAnswer;
                      displayAns = q.options[ans] || "Chưa chọn";
                      displayCorrect = q.options[q.correctAnswer];
                    } else if (q.type === QuestionType.TRUE_FALSE) {
                      typeLabel = "Đúng/Sai";
                      isCorrect = ans === q.trueFalseAnswer;
                      displayAns = ans === true ? "Đúng" : ans === false ? "Sai" : "Chưa chọn";
                      displayCorrect = q.trueFalseAnswer ? "Đúng" : "Sai";
                    } else if (q.type === QuestionType.SHORT_ANSWER) {
                      typeLabel = "Trả lời ngắn";
                      isCorrect = String(ans).trim().toLowerCase() === String(q.shortAnswerText).trim().toLowerCase();
                      displayAns = ans || "Trống";
                      displayCorrect = q.shortAnswerText || "";
                    } else if (q.type === QuestionType.MATCHING) {
                      typeLabel = "Ghép nối";
                      const correctPairs = (ans as number[] || []).filter((v, i) => v === i).length;
                      isCorrect = correctPairs === (q.matchingPairs?.length || 0);
                      displayAns = `${correctPairs}/${q.matchingPairs?.length} cặp đúng`;
                      displayCorrect = "Khớp 100%";
                    }

                    return `
                      <tr>
                        <td style="font-weight:900">${idx + 1}</td>
                        <td style="font-size:9px; color:#64748b">${typeLabel}</td>
                        <td>${displayAns}</td>
                        <td>${isCorrect ? '' : displayCorrect}</td>
                        <td style="text-align:center">
                          <span class="status-badge ${isCorrect ? 'status-ok' : 'status-no'}">${isCorrect ? 'Đúng' : 'Sai'}</span>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
              ${includeSignature ? `
                <div class="signature-area">
                  <div class="sig-line">Chữ ký Phụ huynh</div>
                  <div class="sig-line">Chữ ký Giáo viên</div>
                </div>
              ` : ''}
            </div>
          `).join('')}
          <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 1000); };</script>
        </body>
      </html>
    `;
    printWindow.document.write(reportHtml);
    printWindow.document.close();
  }
};
