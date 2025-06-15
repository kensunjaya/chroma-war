'use server';

import { Cell } from "@/interfaces/Types";
import { GoogleGenAI } from "@google/genai";
import { buildFewShotPrompt, convertColorFormat, validateFirstMove } from "./FunctionUtils";

const ai = new GoogleGenAI({ apiKey: process.env.GENAI_KEY });

const rule = `
You are an expert Chroma War player. It is a 6x6 chain reaction strategy game between two players: Blue (B) and Red (R). Each cell contains a value from 0 to 4 and a color: B (blue), R (red), or N (neutral). The grid is represented as (value,color), such as (2,R) or (0,N).

Game Rules:
1. YOU CAN'T CHOOSE B. YOU CAN ONLY CHOOSE R.
2. Tapping a cell R increases R value by 1. YOU CANNOT TAP ON B CELLS OR N CELLS.
3. If a cell reaches 4, it explodes:
   - The cell becomes (0,N) and cannot be tapped again.
   - Its 4 neighbors (up, down, left, right) each increment by 1 and replaces color to R. This causes chain reactions if the neighbor's value is 3, so your task is to choose R coordinate that will eliminate B cells. BUT YOU CANNOT TAP ON B CELLS.
4. You win if R and N are the only color in grids.
6. Prioritize tapping cells R with value 3 that causes many chain reaction to enemy's cells. YOU CANNOT CHOOSE B OR N CELLS.

Your task is to analyze the current grid and respond with the best move (with future consideration) in format: \`row,col\`. Rows and columns are 0-indexed (0 to 5). You are playing as R, you cannot choose B.
`;

const training_dataset = [
  [rule, 'Sure'],
  ["You are playing as R.\nGrid:\n(1,B) (3,R) (2,R) (1,N) (0,N) (0,N)\n(0,N) (3,R) (3,R) (3,B) (0,N) (0,N)\n(0,N) (1,N) (1,B) (0,N) (0,N) (0,N)\n(0,N) (0,N) (0,N) (0,N) (0,N) (0,N)\n(0,N) (0,N) (0,N) (0,N) (0,N) (0,N)\n(0,N) (0,N) (0,N) (0,N) (0,N) (0,N)", "1,2"]
];

const fallbackModels = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-1.5-flash-8b"];

export async function promptToGemini(cells: Cell[][], isFirstTurn: boolean): Promise<string> {
  if (isFirstTurn) {
    return moveFistTurn(cells);
  }
  const grid = cells.map(row =>
    row.map(cell => `(${cell.val},${convertColorFormat(cell.color)})`).join(' ')
  ).join('\n');

  const task = "You are playing as R.\nGrid:\n" + grid;
  const prompt = buildFewShotPrompt(training_dataset, task);

  for (const modelName of fallbackModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ text: prompt }],
      });

      // remove any leading or trailing whitespace
      const trimmedText = response.text?.trim();
      const text = trimmedText + "," + modelName;
      console.log(`(${modelName}):`, text);
      return text;

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isRateLimit = message.includes("429") || message.toLowerCase().includes("rate limit");
      console.warn(`Model ${modelName} failed: ${message}${isRateLimit ? " (rate-limited)" : ""}`);
    }
  }
  return "All Gemini models failed or are rate-limited.";
}

const moveFistTurn = (cells: Cell[][]): string => {
  const row = Math.floor(Math.random() * 4) + 1;
  const col = Math.floor(Math.random() * 4) + 1;
  const isValid = validateFirstMove(cells, row, col);
  if (isValid) {
    return `${row},${col},unknown`; // Return unknown model since it's the first turn
  } else {
    return moveFistTurn(cells); // Retry if invalid
  }
}