
import { Question } from "../types";

/**
 * Hàm bóc tách nội dung từ file Word (.docx)
 * Định dạng: "Câu X: ...", "A. ...", "B. ...", "C. ...", "D. ..."
 * Đáp án lấy từ "BẢNG ĐÁP ÁN" ở cuối file.
 */
export const parseWordFile = async (file: File): Promise<{questions: Question[], title: string}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      try {
        // Chuyển đổi DOCX sang HTML để giữ lại <img> (base64) và các định dạng cơ bản
        const result = await (window as any).mammoth.convertToHtml({ arrayBuffer });
        const html = result.value;
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const paragraphs = Array.from(doc.querySelectorAll('p, li, table'));
        
        let questions: Question[] = [];
        let currentQuestion: Partial<Question> | null = null;
        let answerTable: Record<number, number> = {};

        // 1. Tìm bảng đáp án ở cuối văn bản trước
        // Định dạng kỳ vọng: "BẢNG ĐÁP ÁN: 1.A 2.B 3.C..."
        // Fix: Use textContent or cast doc.body to HTMLElement safely
        const fullText = doc.body ? (doc.body as HTMLElement).innerText : "";
        const tableHeaderIndex = fullText.lastIndexOf("BẢNG ĐÁP ÁN");
        if (tableHeaderIndex !== -1) {
          const tableText = fullText.substring(tableHeaderIndex);
          const pairs = tableText.matchAll(/(\d+)[\s.-]+([A-D])/gi);
          for (const match of pairs) {
            const qNum = parseInt(match[1]);
            const ansChar = match[2].toUpperCase();
            answerTable[qNum] = ansChar.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
          }
        }

        // 2. Duyệt qua các thành phần HTML để bóc tách Câu hỏi và Đáp án
        paragraphs.forEach((p) => {
          // Fix: Cast p to HTMLElement to access innerText property
          const text = (p as HTMLElement).innerText.trim();
          
          // Kiểm tra xem có phải bắt đầu một câu hỏi mới không
          const qMatch = text.match(/^Câu\s*(\d+)\s*[:.]/i);
          
          if (qMatch) {
            // Lưu câu hỏi trước đó nếu có
            if (currentQuestion && currentQuestion.text && currentQuestion.options?.length === 4) {
              questions.push(currentQuestion as Question);
            }

            const qNum = parseInt(qMatch[1]);
            currentQuestion = {
              id: `q-${Date.now()}-${questions.length}`,
              text: p.innerHTML.replace(/^Câu\s*\d+\s*[:.]/i, '').trim(),
              options: [],
              correctAnswer: answerTable[qNum] ?? 0 // Mặc định là A nếu không tìm thấy trong bảng
            };
          } else if (currentQuestion) {
            // Kiểm tra xem có phải là lựa chọn A, B, C, D không
            const optMatch = text.match(/^([A-D])\s*[:.]\s*(.*)/i);
            if (optMatch) {
              currentQuestion.options?.push(optMatch[2] || p.innerHTML.replace(/^[A-D]\s*[:.]/i, '').trim());
            } else if (text.length > 0 && !text.includes("BẢNG ĐÁP ÁN")) {
              // Nếu là text bình thường hoặc ảnh, cộng dồn vào nội dung câu hỏi
              currentQuestion.text += p.innerHTML;
            }
          }
        });

        // Lưu câu cuối cùng
        if (currentQuestion && currentQuestion.text && currentQuestion.options?.length === 4) {
          questions.push(currentQuestion as Question);
        }

        if (questions.length === 0) {
          throw new Error("Không tìm thấy câu hỏi nào đúng định dạng (Câu X:, A., B., C., D.)");
        }

        resolve({
          questions,
          title: file.name.replace(/\.[^/.]+$/, "")
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};
