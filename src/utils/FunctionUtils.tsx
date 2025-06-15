import { Cell } from "@/interfaces/Types";

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const convertColorFormat = (color: string): string => {
  switch (color) {
    case 'blue-400':
      return 'B';
    case 'red-400':
      return 'R';
    default:
      return 'N';
  }
}

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

  if (cells[row][col+1].color === 'blue-400' || cells[row+1][col].color === 'blue-400' || cells[row][col-1].color === 'blue-400' || cells[row-1][col].color === 'blue-400') {
    return false; // invalid as the blue will instantly win on the next turn
  }

  // Check if the cell is R or N
  const cell = cells[row][col];
  if (cell.color !== 'red-400' && cell.color !== 'white') {
    return false; // Cannot tap on B cells
  }

  return true; // Valid first move
}