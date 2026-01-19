'use server';

import { Cell } from "@/interfaces/Types";
import { GoogleGenAI } from "@google/genai";
import { buildFewShotPrompt, moveFistTurn } from "./FunctionUtils";

const ai = new GoogleGenAI({ apiKey: process.env.GENAI_KEY });

const rule = `
You are an expert Chroma War player. It is a 6x6 chain reaction strategy game between two players: Red (R) and Blue (B). Each cell contains a value from 0 to 4 and a color: B (blue), R (red), or N (neutral). The grid is represented as (value,color), such as (2,R) or (0,N).

Game Rules:
1. YOU CAN'T CHOOSE B AND N. YOU CAN ONLY CHOOSE R.
2. Tapping a cell R increases R value by 1. YOU CAN'T CHOOSE B OR N CELLS.
3. If a cell reaches 4, it explodes:
   - Its 4 neighbors (up, down, left, right) each increment by 1 and replaces color to R. This causes chain reactions if the neighbor's value is 3, so your task is to choose R coordinate that will eliminate B cells. BUT YOU CAN'T CHOOSE B CELLS.
4. Maintain as much R as possible. Eliminate B cells by causing chain reactions. BUT YOU CAN'T CHOOSE B CELLS OR N CELLS.
6. Prioritize choosing R with value 3 that causes many chain reactions to enemy's cells. YOU CAN'T CHOOSE B OR N CELLS.
7. Set up future chain reactions by choosing R cells that will lead to more explosions in the next turns. YOU CAN'T CHOOSE B OR N CELLS.

Respond with the best move in the exact format: \`row,col\` (e.g., 1,2). Do not add explanations or extra text. Rows and columns are 0-indexed (0 to 5). You are playing as R, you cannot choose B AND N. You can only choose R.
`;

const training_dataset = [
  [rule, 'Okay, from now I will be only choosing R cells.'],
  [
    "You are playing as R.\nGrid:\n(1,B) (3,R) (2,R) (1,N) (0,N) (0,N)\n(0,N) (3,R) (3,R) (3,B) (0,N) (0,N)\n(0,N) (1,N) (1,B) (0,N) (0,N) (0,N)\n(0,N) (0,N) (0,N) (0,N) (0,N) (0,N)\n(0,N) (0,N) (0,N) (0,N) (0,N) (0,N)\n(0,N) (0,N) (0,N) (0,N) (0,N) (0,N)", 
    "1,2"
  ],
  [
    "You are playing as R.\nGrid:\n(0,N) (0,N) (0,N) (0,N) (0,N) (0,N)\n(0,N) (0,N) (3,R) (2,B) (0,N) (0,N)\n(0,N) (0,N) (2,R) (3,B) (0,N) (0,N)\n(0,N) (0,N) (0,N) (0,N) (0,N) (0,N)\n(0,N) (0,N) (0,N) (0,N) (0,N) (0,N)\n(0,N) (0,N) (0,N) (0,N) (0,N) (0,N)",
    "2,2"
  ],
  [
    "You are playing as R.\nGrid:\n(0,N) (0,N) (0,N) (0,N) (0,N) (0,N)\n(0,N) (0,N) (0,N) (0,N) (0,N) (0,N)\n(0,N) (3,R) (3,B) (0,N) (0,N) (0,N)\n(0,N) (3,R) (1,B) (0,N) (0,N) (0,N)\n(0,N) (0,N) (0,N) (0,N) (0,N) (0,N)\n(0,N) (0,N) (0,N) (0,N) (0,N) (0,N)",
    "3,1"
  ],
];

const fallbackModels = ["gemini-2.5-flash-lite", "gemini-3.0-flash-preview", "gemini-2.5-flash", "gemini-2.0-flash-lite"];

export async function promptToGemini(cells: Cell[][], isFirstTurn: boolean): Promise<string> {

  if (isFirstTurn) {
    return moveFistTurn(cells);
  }
  const grid = cells.map(row =>
    row.map(cell => `(${cell.val},${cell.color})`).join(' ')
  ).join('\n');

  const task = "You are playing as R.\nGrid:\n" + grid;
  const prompt = buildFewShotPrompt(training_dataset, task);

  for (const modelName of fallbackModels) {
    try {
      const response = await ai.models.generateContent({
        config: {
          temperature: 0.2,
          topK: 1,
          topP: 0.8,
        },
        model: modelName,
        contents: [{ text: prompt }],
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      const finalText = text + "," + modelName;
      console.log(`(${modelName}):`, finalText);
      return finalText;

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isRateLimit = message.includes("429") || message.toLowerCase().includes("rate limit");
      console.warn(`Model ${modelName} failed: ${message}${isRateLimit ? " (rate-limited)" : ""}`);
    }
  }
  return "All Gemini models failed or are rate-limited.";
}