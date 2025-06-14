'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BurstDotStructure, Cell, Color, Direction } from '@/interfaces/Types';
import { Dots } from '../components/Dots';
import { sleep } from '@/utils/FunctionUtils';
import Modal from '@/components/Modal';
import { promptToGemini } from '@/utils/GeminiBot';

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
  const [cells, setCells] = useState<Cell[][]>(Array.from({ length: rowsCount }, () => Array.from({ length: colsCount }, () => ({ val: 0, color: 'white' }))));
  const [turn, setTurn] = useState(0);
  const [winner, setWinner] = useState<Color | null>(null);
  const [displayedTurn, setDisplayedTurn] = useState(0);
  const [burstDots, setBurstDots] = useState<{ row: number; col: number; dot: BurstDotStructure }[]>([]);
  const [colorCount, setColorCount] = useState<{ [key in Color]: number }>({
    'white': rowsCount * colsCount,
    'blue-400': 0,
    'red-400': 0,
  });

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isProcessing) return;
    checkWinner();
    setDisplayedTurn(turn);
    if (turn % 2 !== 0) {
      promptToGemini(cells).then(response => {
        translateGeminiResponse(response);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProcessing]);

  const translateGeminiResponse = (response: string) => {
    const match = response.match(/(\d+),(\d+)/);
    if (match) {
      const row = parseInt(match[1], 10);
      const col = parseInt(match[2], 10);
      if (row >= 0 && row < rowsCount && col >= 0 && col < colsCount) {
        handleClick(row, col);
      }
    }
    else {
      // random coordinates but red
      console.log("Invalid response, choosing random cell");
      const randomRow = Math.floor(Math.random() * rowsCount);
      const randomCol = Math.floor(Math.random() * colsCount);
      if (cells[randomRow][randomCol].color === 'red-400') {
        handleClick(randomRow, randomCol);
      }
      else {
        if (cells[randomRow][randomCol].color === 'white' && turn < 2) {
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
      return;
    }
    if (colorCount['blue-400'] === 0) {
      setWinner('red-400');
    }
    else if (colorCount['red-400'] === 0) {
      setWinner('blue-400');
    }
  }

  const resetGame = () => {
    setCells(Array.from({ length: rowsCount }, () => Array.from({ length: colsCount }, () => ({ val: 0, color: 'white' }))));
    setTurn(0);
    colorCount['blue-400'] = 0;
    colorCount['red-400'] = 0;
    colorCount['white'] = rowsCount * colsCount;
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
    const color: Color = turn % 2 === 0 ? 'blue-400' : 'red-400';
    const cell = cells[row][col];

    if (cell.color === 'white' && turn > 1) return;
    if (cell.color !== 'white' && cell.color !== color) return;
    setIsProcessing(true); // start processing
    setTurn((prev) => prev + 1);
    await recursiveFill(row, col, color, 750, true); // use the originally calculated `color`
    setIsProcessing(false);
  };

  const addBurst = (row: number, col: number, directions: Direction[], color: Exclude<Color, 'white'>) => {
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

    if (newCells[row][col].color === 'white') {
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
      newCells[row][col].color = 'white';
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      // draw burst animation
      if (row === 0 && col === 0) {
        addBurst(row, col, ['down', 'right'], color as Exclude<Color, 'white'>);
      }
      else if (row === 0 && col === colsCount - 1) {
        addBurst(row, col, ['down', 'left'], color as Exclude<Color, 'white'>);
      }
      else if (row === rowsCount - 1 && col === 0) {
        addBurst(row, col, ['up', 'right'], color as Exclude<Color, 'white'>);
      }
      else if (row === rowsCount - 1 && col === colsCount - 1) {
        addBurst(row, col, ['up', 'left'], color as Exclude<Color, 'white'>);
      }
      else if (row === 0) {
        addBurst(row, col, ['down', 'left', 'right'], color as Exclude<Color, 'white'>);
      }
      else if (row === rowsCount - 1) {
        addBurst(row, col, ['up', 'left', 'right'], color as Exclude<Color, 'white'>);
      }
      else if (col === 0) {
        addBurst(row, col, ['up', 'down', 'right'], color as Exclude<Color, 'white'>);
      }
      else if (col === colsCount - 1) {
        addBurst(row, col, ['up', 'down', 'left'], color as Exclude<Color, 'white'>);
      }
      else {
        addBurst(row, col, ['up', 'down', 'left', 'right'], color as Exclude<Color, 'white'>);
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
    <main className="font-sans min-h-screen w-screen">
      {winner && (
        <Modal 
          title={winner === 'blue-400' ? 'Blue Wins!' : 'Red Wins!'}
          body={"Press the button below to play again."}
          buttonLabel="Play Again"
          isLoading={false}
          setState={() => resetGame()}
        />
      )}
      <div className={`z-10 ${winner && 'blur-[0.1rem] opacity-30 transition duration-300 ease-in-out'}`}>
        <div className="flex flex-row text-3xl xs:text-3xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-4xl text-center justify-center items-center pt-5">
          <h1 className="text-center hover:cursor-default font-bold">{"Chr⦿ma War"}</h1>
        </div>
        <div className="flex flex-row font-semibold text-md xs:text-md sm:text-md md:text-lg lg:text-lg xl:text-lg text-center justify-center items-center pt-2">
          {"Versus AI"}
        </div>
        <div className="flex flex-col items-center py-3 sm:py-4 font-sans">
          <div className={`grid mt-4 sm:mt-5 grid-cols-6 gap-2 md:gap-3 lg:gap-4`}>
            {cells.map((row, rowIndex) => row.map((cell, colIndex) => (
              <button
                onClick={() => handleClick(rowIndex, colIndex, true)}
                key={rowIndex * rowsCount + colIndex}
                className={`p-1 md:p-2 cursor-pointer rounded-xl bg-white justify-center items-center h-12 w-12 xs:h-16 xs:w-16 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-24 lg:w-24`}
              >
                <div
                  className={`relative flex justify-center items-center w-full h-full`}
                >
                  <div className={`transition-all duration-200 absolute inset-0 rounded-full ${cell.color === 'blue-400' ? 'bg-blue-400' : cell.color === 'red-400' ? 'bg-red-400' : 'bg-white'}`} />
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
          <p className={`text-center ${displayedTurn % 2 === 0 ? 'text-blue-400' : 'text-red-400'} text-lg font-semibold mt-4`}>
            {displayedTurn % 2 === 0 ? 'Blue\'s turn' : 'Red\'s turn (AI)'}
          </p>
        </div>
      </div>
    </main>
  );
}