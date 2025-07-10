import { Cell } from "@/interfaces/Types";

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const buildFewShotPrompt = (dataset: any, task: any) => {
  let prompt = "";
  for (const [input, output] of dataset) {
    prompt += `Q: ${input}\nA: ${output}\n`;
  }
  prompt += `Q: ${task}\nA:`;
  return prompt;
}

export const validateFirstMove = (cells: Cell[][], row: number, col: number): boolean => {
  if (row === 0 || col === 0) {
    return false; // not a good first move as it limits the spread to 2 or 3 cells
  }

  if (cells[row][col+1].color === 'B' || cells[row+1][col].color === 'B' || cells[row][col-1].color === 'B' || cells[row-1][col].color === 'B') {
    return false; // invalid as the blue will instantly win on the next turn
  }

  // Check if the cell is R or N
  const cell = cells[row][col];
  if (cell.color !== 'R' && cell.color !== 'N') {
    return false; // Cannot tap on B cells
  }

  return true; // Valid first move
}
