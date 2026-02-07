
import { Question, QuestionType, MatchingPair } from "../types";

export const parseWordFile = async (file: File): Promise<{questions: Question[], title: string}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      try {
        const result = await (window as any).mammoth.convertToHtml({ arrayBuffer });
        const html = result.value;
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const paragraphs = Array.from(doc.querySelectorAll('p, li, tr, td'));
        
        let questions: Question[] = [];
        let currentQuestion: Partial<Question> | null = null;
        let currentPartId = "part-1";
        let currentPartTitle = "Phần 1";
        let answerTable: Record<number, any> = {};

        // 1. Phân tích Bảng đáp án để xác định loại câu hỏi
        const fullText = (doc.body as HTMLElement).innerText;
        const stopIndex = fullText.search(/BẢNG ĐÁP ÁN|ĐÁP ÁN/i);
        
        if (stopIndex !== -1) {
          const tableText = fullText.substring(stopIndex);
          // Tách linh hoạt hơn với nhiều loại dấu phân cách
          const answerSegments = tableText.split(/[\n,;|\t]/);
          
          answerSegments.forEach(seg => {
            const trimmedSeg = seg.trim();
            if (!trimmedSeg) return;

            // Cấu trúc: số câu - đáp án (ví dụ: 1-A, 2.Paris, 3:Đ)
            const match = trimmedSeg.match(/^(\d+)\s*[:.-]\s*(.*)$/i);
            if (match) {
              const qNum = parseInt(match[1]);
              const val = match[2].trim();

              // Kiểm tra Trắc nghiệm
              if (val.match(/^[A-D]$/i)) {
                answerTable[qNum] = { type: QuestionType.MULTIPLE_CHOICE, val: val.toUpperCase() };
              }
              // Kiểm tra Đúng/Sai
              else if (val.match(/^(Đ|S|T|F|True|False)$/i)) {
                const indicator = val.toUpperCase()[0];
                const isTrue = indicator === 'Đ' || indicator === 'T';
                answerTable[qNum] = { type: QuestionType.TRUE_FALSE, val: isTrue };
              }
              // Kiểm tra Ghép nối
              else if (val.match(/^\(.*\)$/)) {
                answerTable[qNum] = { type: QuestionType.MATCHING, val: val.replace(/[()]/g, '') };
              }
              // Mặc định là Trả lời ngắn
              else if (val.length > 0) {
                answerTable[qNum] = { type: QuestionType.SHORT_ANSWER, val: val };
              }
            }
          });
        }

        // 2. Duyệt Paragraphs để lấy nội dung câu hỏi
        for (const p of paragraphs) {
          const htmlContent = p.innerHTML;
          const text = (p as HTMLElement).innerText.trim();
          if (!text) continue;

          // Dừng khi gặp bảng đáp án
          if (text.match(/^(BẢNG ĐÁP ÁN|ĐÁP ÁN)/i)) break;

          // Phát hiện Phần
          const partMatch = text.match(/^(Phần|PHẦN)\s*(\d+|[IVXLC]+)[:.-]?\s*(.*)/i);
          if (partMatch) {
            currentPartId = `part-${partMatch[2]}`;
            currentPartTitle = text;
            continue;
          }

          // Phát hiện Câu hỏi
          const qMatch = text.match(/^(?:Câu|Câu hỏi|Question)\s*(\d+)\s*[:.-]/i);
          if (qMatch) {
            if (currentQuestion && currentQuestion.text) {
              questions.push(currentQuestion as Question);
            }

            const qNum = parseInt(qMatch[1]);
            const ansInfo = answerTable[qNum] || { type: QuestionType.SHORT_ANSWER, val: "" };

            currentQuestion = {
              id: `q-${Date.now()}-${questions.length}`,
              type: ansInfo.type,
              partId: currentPartId,
              partTitle: currentPartTitle,
              text: htmlContent.replace(/^(?:Câu|Câu hỏi|Question)\s*\d+\s*[:.-]/i, '').trim(),
              options: [],
              points: 0,
              isFixed: false
            };

            if (ansInfo.type === QuestionType.MULTIPLE_CHOICE) {
              currentQuestion.correctAnswer = ansInfo.val.charCodeAt(0) - 65;
            } else if (ansInfo.type === QuestionType.TRUE_FALSE) {
              currentQuestion.trueFalseAnswer = ansInfo.val;
            } else if (ansInfo.type === QuestionType.SHORT_ANSWER) {
              currentQuestion.shortAnswerText = ansInfo.val;
            } else if (ansInfo.type === QuestionType.MATCHING) {
              currentQuestion.matchingPairs = [{ left: 'Vế 1', right: 'Vế A' }]; 
            }
          } else if (currentQuestion) {
            // PHÁT HIỆN LỰA CHỌN A, B, C, D
            const optMatch = text.match(/^([A-D]|[a-d])\s*[:.)-]\s*(.*)/i);
            
            if (optMatch) {
              // NÂNG CẤP LOẠI CÂU HỎI: Nếu thấy A/B/C/D mà đang là SHORT_ANSWER -> Chuyển thành MCQ ngay
              if (currentQuestion.type === QuestionType.SHORT_ANSWER) {
                currentQuestion.type = QuestionType.MULTIPLE_CHOICE;
                currentQuestion.options = [];
                // Nếu có đáp án ở bảng đáp án nhưng lúc đầu chưa nhận diện đúng MCQ
                if (currentQuestion.shortAnswerText && currentQuestion.shortAnswerText.match(/^[A-D]$/i)) {
                   currentQuestion.correctAnswer = currentQuestion.shortAnswerText.toUpperCase().charCodeAt(0) - 65;
                }
              }

              if (currentQuestion.type === QuestionType.MULTIPLE_CHOICE) {
                const optText = optMatch[2] || htmlContent.replace(/^[A-Da-d]\s*[:.)-]/i, '').trim();
                if (currentQuestion.options!.length < 4) {
                  currentQuestion.options!.push(optText);
                }
                continue; // Đã xử lý xong hàng này là option
              }
            }
            
            // Nếu không phải option hoặc không phải MCQ, gộp vào text câu hỏi
            currentQuestion.text += " " + htmlContent;
          }
        }

        if (currentQuestion && currentQuestion.text) {
          questions.push(currentQuestion as Question);
        }

        if (questions.length === 0) throw new Error("Không tìm thấy câu hỏi hợp lệ trong file.");

        resolve({ questions, title: file.name.replace(/\.[^/.]+$/, "") });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Lỗi đọc file."));
    reader.readAsArrayBuffer(file);
  });
};
