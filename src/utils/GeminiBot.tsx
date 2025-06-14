'use server';

import { Cell } from "@/interfaces/Types";
import { GoogleGenAI } from "@google/genai";
import { buildFewShotPrompt, convertColorFormat } from "./FunctionUtils";

const ai = new GoogleGenAI({ apiKey: process.env.GENAI_KEY });

const rule = `
You are an expert Chroma War player. Chroma War is a 6x6 chain reaction strategy game between two players: Blue (B) and Red (R). Each cell contains a value from 0 to 4 and a color: B (blue), R (red), or N (neutral). The grid is represented as (value,color), such as (2,B) or (0,N).

Game Rules:
1. You can only tap on R. You cannot tap on B. N can only be tapped on your first move.
2. Tapping a cell R increases its value by 1 and sets its color to the player's color. YOU CANNOT TAP ON B CELLS OR N CELLS.
3. If a cell reaches 4, it explodes:
   - The cell becomes (0,N) and cannot be tapped again.
   - Its 4 neighbors (up, down, left, right) each increment by 1 and change to color R.
   - This can cause chain reactions.
4. You win if R and N are the only color in grids.
5. Avoid tapping on column 0 or row 0 for the first move as the spread will be limited to 2 or 3 cells instead of 4.
6. Prioritize tapping cells R with value 3 that causes chain reaction as this will lead to closer to victory. YOU CANNOT TAP ON B CELLS OR N CELLS.

Your task is to analyze the current grid and respond with the best move in format: \`row,col\`. Rows and columns are 0-indexed (0 to 5). You are playing as R.
`;

const training_dataset = [
  [rule, 'Sure'],
  ["You are playing as R.\nGrid:\n(0,N) (1,R) (2,R) (1,N) (0,N) (0,N)\n(0,N) (3,R) (3,R) (3,B) (0,N) (0,N)\n(0,N) (1,N) (1,B) (0,N) (0,N) (0,N)\n(0,N) (0,N) (0,N) (0,N) (0,N) (0,N)\n(0,N) (0,N) (0,N) (0,N) (0,N) (0,N)\n(0,N) (0,N) (0,N) (0,N) (0,N) (0,N)", "1,2"]
];

const fallbackModels = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-1.5-flash-8b"];

export async function promptToGemini(cells: Cell[][], isFirstTurn: boolean): Promise<string> {
  const grid = cells.map(row =>
    row.map(cell => `(${cell.val},${convertColorFormat(cell.color)})`).join(' ')
  ).join('\n');

  const task = (isFirstTurn ? "This is your first turn. " : "") + "You are playing as R.\nGrid:\n" + grid;
  const prompt = buildFewShotPrompt(training_dataset, task);

  for (const modelName of fallbackModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ text: prompt }],
      });

      const text = response.text;
      console.log(`Gemini (${modelName}) response:`, text);
      if (text?.match(/^\d,\d$/) || text?.includes(',')) {
        return text;
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isRateLimit = message.includes("429") || message.toLowerCase().includes("rate limit");
      console.warn(`Model ${modelName} failed: ${message}${isRateLimit ? " (rate-limited)" : ""}`);
    }
  }

  return "All Gemini models failed or are rate-limited.";
}
