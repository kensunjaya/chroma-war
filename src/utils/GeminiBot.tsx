'use server';
import { Cell } from "@/interfaces/Types";
import { GoogleGenAI } from "@google/genai";
import { buildFewShotPrompt, convertColorFormat } from "./FunctionUtils";

const ai = new GoogleGenAI({ apiKey: process.env.GENAI_KEY });

const rule = `
  You are an expert Chroma War player. Chroma War is a 6x6 chain reaction strategy game between two players: Blue (B) and Red (R). Each cell contains a value from 0 to 4 and a color: B (blue), R (red), or N (neutral). The grid is represented as (value,color), such as (2,B) or (0,N).

  Game Rules:
  1. You can only tap on R. N can only be tapped on your first move.
  2. Tapping a cell increases its value by 1 and sets its color to the player's color.
  3. If a cell reaches 4, it explodes:
    - The cell becomes (0,N) and cannot be tapped again.
    - Its 4 neighbors (up, down, left, right) each increment by 1 and change to the exploding player's color.
    - This can cause chain reactions.
  5. Avoid tapping on column 0 or row 0 for the first move as the spread will be limited to 2 or 3 cells instead of 4.
  6. Prioritize tapping cells that will cause chain reactions, especially those with a value of 3 as this will lead to closer to winning.

  Your task is to analyze the current grid and respond with the best move in format: \`row,col\`. Rows and columns are 0-indexed (0 to 5). You are playing as R.
  `;

const training_dataset = [
  [rule, 'sure'],
  ["You are playing as R.\nGrid:\n(0,N) (1,R) (2,R) (1,N) (0,N) (0,N)\n(0,N) (3,R) (2,R) (0,N) (0,N) (0,N)\n(0,N) (1,N) (1,B) (0,N) (0,N) (0,N)\n(0,N) (0,N) (0,N) (0,N) (0,N) (0,N)\n(0,N) (0,N) (0,N) (0,N) (0,N) (0,N)\n(0,N) (0,N) (0,N) (0,N) (0,N) (0,N)", "1,2"]
]

export async function promptToGemini(cells: Cell[][], isFirstTurn: boolean): Promise<string> {
  try {
    const grid = cells.map(row =>
      row.map(cell => `(${cell.val},${convertColorFormat(cell.color)})`).join(' ')
    ).join('\n');

    const prompt = buildFewShotPrompt(training_dataset, (isFirstTurn? "This is your first turn. " : "") + "You are playing as R.\nGrid:\n" + grid);

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ text: prompt }],
    });
    console.log("Gemini Response:", response.text);
    return response.text ?? "";
  } catch (error) {
    console.error("Unexpected Error:", error);
    return error instanceof Error ? error.message : "An unexpected error occurred.";
  }
}

