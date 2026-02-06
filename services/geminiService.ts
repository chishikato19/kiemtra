
import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseQuizFromText = async (rawText: string, title: string): Promise<Question[]> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Parse the following quiz content from a Word document export into a JSON array of questions. 
    Content:
    ${rawText}`,
    config: {
      systemInstruction: "You are a professional quiz parser. Extract questions, multiple choice options (usually A, B, C, D), and identify the correct answer. Output strictly as JSON. Each question object should have 'text', 'options' (array of strings), and 'correctAnswer' (index 0-3).",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            correctAnswer: { type: Type.INTEGER }
          },
          required: ["text", "options", "correctAnswer"]
        }
      }
    },
  });

  try {
    const json = JSON.parse(response.text || "[]");
    return json.map((q: any, idx: number) => ({
      ...q,
      id: `q-${Date.now()}-${idx}`
    }));
  } catch (error) {
    console.error("Failed to parse Gemini response", error);
    return [];
  }
};
