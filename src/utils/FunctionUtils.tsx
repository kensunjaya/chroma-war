import { Cell, Color, MiniMaxOutput } from "@/interfaces/Types";

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

export const moveFistTurn = (cells: Cell[][]): string => {
  const row = Math.floor(Math.random() * 4) + 1;
  const col = Math.floor(Math.random() * 4) + 1;
  const isValid = validateFirstMove(cells, row, col);
  if (isValid) {
    return `${row},${col},unknown`; // Return unknown model since it's the first turn
  } else {
    return moveFistTurn(cells); // Retry if invalid
  }
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

export const checkWinner = (turn: number, colorCount: {[key in Color]: number}) => {
  if (turn < 2) {
    return null;
  }
  if (colorCount['B'] === 0) {
    return 'R';
  }
  else if (colorCount['R'] === 0) {
    return 'B';
  }
  return null;
}


const minimax = (cells: Cell[][], depth: number, isMaximizing: boolean, alpha: number, beta: number, turn: number, colorCount: {[key in Color]: number}): number => {
  const winner = checkWinner(turn, colorCount);
  if (winner === 'B') return -Infinity;
  if (winner === 'R') return Infinity;
  if (depth === 0) {
    return evaluateBoard(colorCount);
  }

  const color: Color = isMaximizing ? 'R' : 'B';
  let bestScore = isMaximizing ? -Infinity : Infinity;

  for (let row = 0; row < cells.length; row++) {
    for (let col = 0; col < cells[row].length; col++) {
      const cell = cells[row][col];
      if (cell.color === 'N' || cell.color !== color) continue;

      // Simulate move
      const newCells = JSON.parse(JSON.stringify(cells));
      newCells[row][col].color = color;
      const newColorCount = { ...colorCount };
      recursiveFill(newCells, row, col, color, newColorCount);

      const score = minimax(newCells, depth - 1, !isMaximizing, alpha, beta, turn + 1, newColorCount);

      if (isMaximizing) {
        bestScore = Math.max(bestScore, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break; // Beta prune
      } else {
        bestScore = Math.min(bestScore, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) break; // Alpha prune
      }
    }
  }
  
  return bestScore;
}


export const findBestMove = (cells: Cell[][], depth: number, turn: number, colorCount: {[key in Color]: number}): MiniMaxOutput => {
  if (turn < 2) {
    return minimaxFirstTurn(cells); // No valid moves on first turn
  }

  let bestScore = -Infinity;
  let bestMove = { row: -1, col: -1 };

  for (let row = 0; row < cells.length; row++) {
    for (let col = 0; col < cells[row].length; col++) {
      const cell = cells[row][col];
      if (cell.color === 'N' || cell.color !== 'R') continue;

      // Simulate move
      const cloneCells = (cells: Cell[][]): Cell[][] => cells.map(row => row.map(cell => ({ ...cell })));
      const newCells = cloneCells(cells);
      newCells[row][col].color = 'R';
      const newColorCount = { ...colorCount };
      recursiveFill(newCells, row, col, 'R', newColorCount);

      const score = minimax(newCells, depth - 1, false, -Infinity, Infinity, turn + 1, newColorCount);

      if (score > bestScore) {
        bestScore = score;
        bestMove = { row, col };
      }
    }
  }

  // If no valid moves found, fallback to any first occurence of R cell
  if (bestMove.row === -1 || bestMove.col === -1) {
    for (let row = 0; row < cells.length; row++) {
      for (let col = 0; col < cells[row].length; col++) {
        const cell = cells[row][col];
        if (cell.color === 'R') {
          bestMove = { row, col };
          break;
        }
      }
    }
  }

  return { row: bestMove.row, col: bestMove.col, score: bestScore };
}

const evaluateBoard = (colorCount: { [key in Color]: number }): number => {
  const r = colorCount['R'];
  const b = colorCount['B'];

  if (r + b === 0) return 0; // avoid division by zero

  return ((r - b) / (r + b)) * 100;
}

export const minimaxFirstTurn = (cells: Cell[][]): MiniMaxOutput => {
  const row = Math.floor(Math.random() * 4) + 1;
  const col = Math.floor(Math.random() * 4) + 1;
  const isValid = validateFirstMove(cells, row, col);
  if (isValid) {
    return { row, col, score: 0 }; // Return score 0 since it's the first turn
  } else {
    return minimaxFirstTurn(cells); // Retry if invalid
  }
}

const recursiveFill = (cells: Cell[][], row: number, col: number, color: Color, colorCount: {[key in Color]: number}) => {
  cells[row][col].val += 1;
  cells[row][col].color = color;
  colorCount[color] += 1;
  if (cells[row][col].val >= 4) {
    cells[row][col].val = 0;
    cells[row][col].color = "N";
    colorCount.N += 1;
    colorCount[color] -= 1;
    if (row > 0) recursiveFill(cells, row - 1, col, color, colorCount); // Up
    if (row < 5) recursiveFill(cells, row + 1, col, color, colorCount); // Down
    if (col > 0) recursiveFill(cells, row, col - 1, color, colorCount); // Left
    if (col < 5) recursiveFill(cells, row, col + 1, color, colorCount); // Right
  }
}