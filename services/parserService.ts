
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
          
          // Quét toàn bộ dòng đáp án
          const lines = tableText.split('\n');
          lines.forEach(line => {
            // Regex cho MCQ: 1-A
            const mcqMatches = line.matchAll(/(\d+)[\s.-]*([A-D])/gi);
            for (const match of mcqMatches) {
              answerTable[parseInt(match[1])] = { type: QuestionType.MULTIPLE_CHOICE, val: match[2].toUpperCase() };
            }

            // Regex cho Đúng/Sai: 1-Đ, 1-S, 1-T, 1-F
            const tfMatches = line.matchAll(/(\d+)[\s.-]*([ĐSTF]|True|False)/gi);
            for (const match of tfMatches) {
              const indicator = match[2].toUpperCase()[0];
              const isTrue = indicator === 'Đ' || indicator === 'T';
              answerTable[parseInt(match[1])] = { type: QuestionType.TRUE_FALSE, val: isTrue };
            }

            // Regex cho Ghép nối: 15- (1-a, 2-c, 3-b)
            const matchingMatches = line.matchAll(/(\d+)[\s.-]*\(([^)]+)\)/gi);
            for (const match of matchingMatches) {
              answerTable[parseInt(match[1])] = { type: QuestionType.MATCHING, val: match[2] };
            }

            // Các trường hợp còn lại là Trả lời ngắn (nếu chưa có trong table)
            const saMatches = line.matchAll(/(\d+)[\s.-]+([^A-DĐSTF\s\n(][^\n,]*)/gi);
            for (const match of saMatches) {
              const qNum = parseInt(match[1]);
              if (!answerTable[qNum]) {
                answerTable[qNum] = { type: QuestionType.SHORT_ANSWER, val: match[2].trim() };
              }
            }
          });
        }

        // 2. Duyệt Paragraphs để lấy nội dung câu hỏi
        for (const p of paragraphs) {
          const htmlContent = p.innerHTML;
          const text = (p as HTMLElement).innerText.trim();
          if (!text) continue;

          if (text.match(/^(BẢNG ĐÁP ÁN|ĐÁP ÁN)/i)) break;

          const partMatch = text.match(/^(Phần|PHẦN)\s*(\d+|[IVXLC]+)[:.-]?\s*(.*)/i);
          if (partMatch) {
            currentPartId = `part-${partMatch[2]}`;
            currentPartTitle = text;
            continue;
          }

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
              // Tạm thời khởi tạo mảng rỗng cho Ghép nối, giáo viên sẽ điền vế trong editor hoặc parse thêm list
              currentQuestion.matchingPairs = [{ left: 'Vế 1', right: 'Vế A' }]; 
            }
          } else if (currentQuestion) {
            const optMatch = text.match(/^([A-D]|[a-d])\s*[:.)-]\s*(.*)/i);
            if (optMatch && currentQuestion.type === QuestionType.MULTIPLE_CHOICE) {
              const optText = optMatch[2] || htmlContent.replace(/^[A-Da-d]\s*[:.)-]/i, '').trim();
              if (currentQuestion.options!.length < 4) {
                currentQuestion.options!.push(optText);
              }
            } else {
              currentQuestion.text += " " + htmlContent;
            }
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
