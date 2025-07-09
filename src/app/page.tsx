'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BurstDotStructure, Cell, Color, Direction } from '@/interfaces/Types';
import { Dots } from '../components/Dots';
import { sleep } from '@/utils/FunctionUtils';
import Modal from '@/components/Modal';
import { promptToGemini } from '@/utils/GeminiBot';
import { Navigation } from '@/components/Navigation';

const rowsCount: number = 6;
const colsCount: number = 6;

// BurstDot component
const BurstDot = ({ direction, color, onComplete }: {
  direction: Direction;
  color: Color;
  onComplete: () => void;
}) => {
  const displacement: number = 50;
  const getCoords = (dir: Direction) => {
    switch (dir) {
      case 'up': return { x: 0, y: -displacement };
      case 'down': return { x: 0, y: displacement };
      case 'left': return { x: -displacement, y: 0 };
      case 'right': return { x: displacement, y: 0 };
    }
  };

  return (
    <motion.div
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{ ...getCoords(direction), opacity: 0.5, scale: 3 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      onAnimationComplete={onComplete}
      className={`absolute w-3 h-3 rounded-full bg-${color} pointer-events-none`}
    />
  );
};

// Main Component
export default function Home() {
  const [cells, setCells] = useState<Cell[][]>(Array.from({ length: rowsCount }, () => Array.from({ length: colsCount }, () => ({ val: 0, color: 'N' }))));
  const [turn, setTurn] = useState(0);
  const [winner, setWinner] = useState<Color | null>(null);
  const [aiModel, setAiModel] = useState<string>('unknown');
  const [displayedTurn, setDisplayedTurn] = useState(0);
  const [burstDots, setBurstDots] = useState<{ row: number; col: number; dot: BurstDotStructure }[]>([]);
  const [colorCount, setColorCount] = useState<{ [key in Color]: number }>({
    'N': rowsCount * colsCount,
    'B': 0,
    'R': 0,
  });

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isProcessing) return;
    const win = checkWinner();
    if (win) return;
    setDisplayedTurn(turn);
    if (turn % 2 !== 0) {
      if (turn < 2) {
        promptToGemini(cells, true).then(response => {
          translateGeminiResponse(response);
        });
      }
      else {
        promptToGemini(cells, false).then(response => {
          translateGeminiResponse(response);
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProcessing]);

  const translateGeminiResponse = (response: string) => {
    const match = response.match(/^\s*(\d+),\s*(\d+),\s*([^\s,]+)\s*$/);
    if (winner) return;
    if (match) {
      const row = parseInt(match[1], 10);
      const col = parseInt(match[2], 10);
      setAiModel(match[3] || 'unknown');
      if (row >= 0 && row < rowsCount && col >= 0 && col < colsCount) {
        if (cells[row][col].color === 'N' && turn > 1 || cells[row][col].color === 'B') {
          translateGeminiResponse("Invalid move. Random move will be made.");
        }
        else {
          handleClick(row, col);
        }
      }
      else {
        translateGeminiResponse("Invalid coordinates. Random move will be made.");
      }
    }
    else {
      // random coordinates but red
      console.log(response);
      const randomRow = Math.floor(Math.random() * rowsCount);
      const randomCol = Math.floor(Math.random() * colsCount);
      if (cells[randomRow][randomCol].color === 'R') {
        handleClick(randomRow, randomCol);
      }
      else {
        // first move
        if (cells[randomRow][randomCol].color === 'N' && turn < 2) {
          handleClick(randomRow, randomCol);
        }
        else {
          translateGeminiResponse(response);
        }
      }
    }
  }

  const checkWinner = () => {
    if (turn < 2) {
      return false;
    }
    if (colorCount['B'] === 0) {
      setWinner('R');
      return true;
    }
    else if (colorCount['R'] === 0) {
      setWinner('B');
      return true;
    }
  }

  const resetGame = () => {
    setCells(Array.from({ length: rowsCount }, () => Array.from({ length: colsCount }, () => ({ val: 0, color: 'N' }))));
    setTurn(0);
    colorCount['B'] = 0;
    colorCount['R'] = 0;
    colorCount['N'] = rowsCount * colsCount;
    setColorCount({ ...colorCount });
    setDisplayedTurn(0);
    setIsProcessing(false);
    setWinner(null);
    setBurstDots([]);
  }

  const handleClick = async (row: number, col: number, isUserAction: boolean = false) => {
    if (isUserAction && turn % 2 !== 0) {
      return; // Prevent user action if it's not their turn
    }
    if (isProcessing) return; // Prevent user action while processing
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    const color: Color = turn % 2 === 0 ? 'B' : 'R';
    const cell = cells[row][col];

    if (cell.color === 'N' && turn > 1) return;
    if (cell.color !== 'N' && cell.color !== color) return;
    setIsProcessing(true); // start processing
    setTurn((prev) => prev + 1);
    await recursiveFill(row, col, color, 600, true);
    setIsProcessing(false);
  };

  const addBurst = (row: number, col: number, directions: Direction[], color: Exclude<Color, 'N'>) => {
    directions.forEach((dir) => {
      setBurstDots((prev) => [
        ...prev,
        {
          row,
          col,
          dot: {
            id: performance.now() - Math.random(),
            direction: dir as Direction,
            color,
          },
        },
      ]);
    });
  };

  const recursiveFill = async (row: number, col: number, color: Color, delayMs: number, isUserAction: boolean = false): Promise<void> => {
    const newCells = [...cells];
    if (turn > 1) {
      newCells[row][col].val += 1;
    }
    else {
      newCells[row][col].val = 3;
    }

    if (newCells[row][col].color === 'N') {
      colorCount[color] += 1;
    }
    else if (newCells[row][col].color !== color) {
      colorCount[newCells[row][col].color] -= 1;
      colorCount[color] += 1;
    }
    setColorCount({ ...colorCount });

    newCells[row][col].color = color;
    if (isUserAction) {
      setCells([...newCells]);
    }

    await sleep(delayMs);
    setCells([...newCells]);
    if (newCells[row][col].val >= 4) {
      newCells[row][col].val = 0;
      colorCount[newCells[row][col].color] -= 1;
      setColorCount({ ...colorCount });
      newCells[row][col].color = 'N';
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      // draw burst animation
      if (row === 0 && col === 0) {
        addBurst(row, col, ['down', 'right'], color as Exclude<Color, 'N'>);
      }
      else if (row === 0 && col === colsCount - 1) {
        addBurst(row, col, ['down', 'left'], color as Exclude<Color, 'N'>);
      }
      else if (row === rowsCount - 1 && col === 0) {
        addBurst(row, col, ['up', 'right'], color as Exclude<Color, 'N'>);
      }
      else if (row === rowsCount - 1 && col === colsCount - 1) {
        addBurst(row, col, ['up', 'left'], color as Exclude<Color, 'N'>);
      }
      else if (row === 0) {
        addBurst(row, col, ['down', 'left', 'right'], color as Exclude<Color, 'N'>);
      }
      else if (row === rowsCount - 1) {
        addBurst(row, col, ['up', 'left', 'right'], color as Exclude<Color, 'N'>);
      }
      else if (col === 0) {
        addBurst(row, col, ['up', 'down', 'right'], color as Exclude<Color, 'N'>);
      }
      else if (col === colsCount - 1) {
        addBurst(row, col, ['up', 'down', 'left'], color as Exclude<Color, 'N'>);
      }
      else {
        addBurst(row, col, ['up', 'down', 'left', 'right'], color as Exclude<Color, 'N'>);
      }

      const promises = [];
      // now recursively fill adjacent cells
      if (row > 0) {
        promises.push(recursiveFill(row - 1, col, color, delayMs));
      }
      if (row < rowsCount - 1) {
        promises.push(recursiveFill(row + 1, col, color, delayMs));
      } 
      if (col > 0) {
        promises.push(recursiveFill(row, col - 1, color, delayMs));
      }
      if (col < colsCount - 1) {
        promises.push(recursiveFill(row, col + 1, color, delayMs));
      }
      await Promise.all(promises); // wait for all bursts to finish
    }
  };

  return (
    <main className="flex justify-center min-h-screen w-screen font-primary bg-secondary text-primary">
      {winner && (
        <Modal 
          title={winner === 'B' ? 'Blue Wins!' : 'Red Wins!'}
          body={"Press the button below to play again."}
          buttonLabel="Play Again"
          isLoading={false}
          setState={() => resetGame()}
        />
      )}
      <div className={`z-1 transition duration-300 ease-in-out`}>
        <Navigation currentPage='ai' />
        <div className="flex flex-col items-center py-3 sm:py-4 font-primary">
          <div className={`grid mt-4 sm:mt-5 grid-cols-6 gap-2 md:gap-3 lg:gap-4`}>
            {cells.map((row, rowIndex) => row.map((cell, colIndex) => (
              <button
                onClick={() => handleClick(rowIndex, colIndex, true)}
                key={rowIndex * rowsCount + colIndex}
                className={`p-1 md:p-2 cursor-pointer rounded-xl bg-primary justify-center items-center h-12 w-12 xs:h-16 xs:w-16 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-24 lg:w-24`}
              >
                <div
                  className={`relative flex justify-center items-center w-full h-full`}
                >
                  <div className={`transition-all duration-200 absolute inset-0 rounded-full ${cell.color === 'B' ? 'bg-blue-500' : cell.color === 'R' ? 'bg-red-500' : 'bg-primary'}`} />
                  {cell.val !== 0 && Dots(cell.val)}
                  {burstDots
                    .filter((b) => b.row === rowIndex && b.col === colIndex)
                    .map((b) => (
                      <BurstDot
                        key={b.dot.id}
                        direction={b.dot.direction}
                        color={b.dot.color}
                        onComplete={() =>
                          setBurstDots((prev) => prev.filter((x) => x.dot.id !== b.dot.id))
                        }
                      />
                    ))
                  }
                </div>
              </button>
              ))
            )}
          </div>
        </div>
        <div>
          <p className={`text-center ${displayedTurn % 2 === 0 ? 'text-blue-400' : 'text-red-400'} text-lg md:text-xl font-semibold mt-4`}>
            {displayedTurn % 2 === 0 ? 'BLUE\'s Turn' : `RED\'s Turn${aiModel === 'unknown' ? '' : ` (${aiModel.replace('gemini-', '')})`}`}
          </p>
        </div>
      </div>
    </main>
  );
}