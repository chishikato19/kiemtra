
import { Question } from "../types";

/**
 * Hàm bóc tách nội dung từ file Word (.docx)
 * Hỗ trợ các định dạng: "Câu X:", "Câu X.", "A.", "B.", "C.", "D."
 */
export const parseWordFile = async (file: File): Promise<{questions: Question[], title: string}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      try {
        // Chuyển đổi DOCX sang HTML
        const result = await (window as any).mammoth.convertToHtml({ arrayBuffer });
        const html = result.value;
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const paragraphs = Array.from(doc.querySelectorAll('p, li, tr, td'));
        
        let questions: Question[] = [];
        let currentQuestion: Partial<Question> | null = null;
        let answerTable: Record<number, number> = {};

        // 1. Tìm bảng đáp án ở cuối văn bản
        const fullText = doc.body ? (doc.body as HTMLElement).innerText : "";
        const tableHeaderIndex = fullText.search(/BẢNG ĐÁP ÁN|ĐÁP ÁN/i);
        if (tableHeaderIndex !== -1) {
          const tableText = fullText.substring(tableHeaderIndex);
          const pairs = tableText.matchAll(/(\d+)[\s.-]*([A-D])/gi);
          for (const match of pairs) {
            const qNum = parseInt(match[1]);
            const ansChar = match[2].toUpperCase();
            answerTable[qNum] = ansChar.charCodeAt(0) - 65; 
          }
        }

        // 2. Duyệt qua các thành phần HTML
        paragraphs.forEach((p) => {
          const text = (p as HTMLElement).innerText.trim();
          if (!text) return;

          // Nhận diện câu hỏi: "Câu 1:", "Câu 1.", "Câu 1 -"
          const qMatch = text.match(/^(?:Câu|Câu hỏi|Question)\s*(\d+)\s*[:.-]/i);
          
          if (qMatch) {
            if (currentQuestion && currentQuestion.text && currentQuestion.options?.length === 4) {
              questions.push(currentQuestion as Question);
            }

            const qNum = parseInt(qMatch[1]);
            currentQuestion = {
              id: `q-${Date.now()}-${questions.length}`,
              text: p.innerHTML.replace(/^(?:Câu|Câu hỏi|Question)\s*\d+\s*[:.-]/i, '').trim(),
              options: [],
              correctAnswer: answerTable[qNum] ?? 0
            };
          } else if (currentQuestion) {
            // Nhận diện lựa chọn: "A.", "B.", "C.", "D." hoặc "A:"...
            const optMatch = text.match(/^([A-D])\s*[:.-]\s*(.*)/i);
            if (optMatch) {
              const optText = optMatch[2] || p.innerHTML.replace(/^[A-D]\s*[:.-]/i, '').trim();
              if (currentQuestion.options!.length < 4) {
                currentQuestion.options!.push(optText);
              }
            } else if (!text.match(/BẢNG ĐÁP ÁN|ĐÁP ÁN/i)) {
              // Nội dung bổ sung cho câu hỏi (hình ảnh, công thức giữa dòng)
              currentQuestion.text += " " + p.innerHTML;
            }
          }
        });

        // Lưu câu cuối cùng
        if (currentQuestion && currentQuestion.text && currentQuestion.options?.length === 4) {
          questions.push(currentQuestion as Question);
        }

        if (questions.length === 0) {
          throw new Error("Không tìm thấy câu hỏi nào. Hãy chắc chắn file Word có định dạng 'Câu 1: ...' và các đáp án 'A.', 'B.', 'C.', 'D.'");
        }

        resolve({
          questions,
          title: file.name.replace(/\.[^/.]+$/, "")
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Không thể đọc file."));
    reader.readAsArrayBuffer(file);
  });
};
