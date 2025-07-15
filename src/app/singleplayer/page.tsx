/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { BurstDotStructure, Cell, Color, Direction } from '@/interfaces/Types';
import { Dots } from '@/components/Dots'; 
import { checkWinner, findBestMove, sleep } from '@/utils/FunctionUtils';
import Modal from '@/components/Modal';
import { Navigation } from '@/components/Navigation';
import { BurstDot } from '@/utils/Animation';
import { useTailwindBreakpoint } from '@/hooks/Breakpoint';
import { HiOutlineSelector } from "react-icons/hi";
import RuleModal from '@/components/RuleModal';
import DifficultyModal from '@/components/DifficultyModal';

const rowsCount: number = 6;
const colsCount: number = 6;

// Main Component
export default function MiniMax() {
  const [cells, setCells] = useState<Cell[][]>(Array.from({ length: rowsCount }, () => Array.from({ length: colsCount }, () => ({ val: 0, color: 'N' }))));
  const [userId, setUserId] = useState<string | null>("123");
  const [showDifficultyModal, setShowDifficultyModal] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<number>(-1);
  const [turn, setTurn] = useState(0);
  const [winner, setWinner] = useState<Color | null>(null);
  const [displayedTurn, setDisplayedTurn] = useState(0);
  const [burstDots, setBurstDots] = useState<{ row: number; col: number; dot: BurstDotStructure }[]>([]);
  const [colorCount, setColorCount] = useState<{ [key in Color]: number }>({
    'N': rowsCount * colsCount,
    'B': 0,
    'R': 0,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const breakpoint = useTailwindBreakpoint();

  useEffect(() => {
    if (!localStorage.getItem('difficulty')) {
      setShowDifficultyModal(true);
      setDifficulty(0);
    } else {
      const storedDifficulty = parseInt(localStorage.getItem('difficulty') || '1');
      setDifficulty(storedDifficulty);
    }
    const storedUserId = localStorage.getItem('userId');
    setTimeout(() => {
      if (storedUserId) {
        setUserId(storedUserId);
      } else {
        setUserId(null);
      }
    }, 500);
  }, []);

  useEffect(() => {
    if (difficulty > 0) {
      localStorage.setItem('difficulty', difficulty.toString());
      resetGame();
    }
  }, [difficulty]);

  useEffect(() => {
    if (isProcessing) return;
    const win = checkWinner(turn, colorCount);
    setWinner(win);
    if (win) return;
    setDisplayedTurn(turn);
    if (turn % 2 !== 0) {
      setTimeout(() => {
        const { row, col } = findBestMove(cells, difficulty, turn, colorCount);
        handleClick(row, col);
      }, 1);
    }
  }, [isProcessing]);

  const closeRuleModal = () => {
    const newUserId = uuidv4();
    localStorage.setItem('userId', newUserId);
    setUserId(newUserId);
    if (!localStorage.getItem('difficulty')) {
      setShowDifficultyModal(true);
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

    const color: Color = turn % 2 === 0 ? 'B' : 'R';
    const cell = cells[row][col];

    if (cell.color === 'N' && turn > 1) return;
    if (cell.color !== 'N' && cell.color !== color) return;
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
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
        navigator.vibrate(20);
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
    <main className="flex justify-center font-primary text-primary">
      {winner && (
        <Modal 
          title={winner === 'B' ? '🎉 You Win!' : 'You Lose!'}
          body={"Press the button below to play again."}
          buttonLabel="Play Again"
          isLoading={false}
          setState={() => resetGame()}
        />
      )}
      {!userId && (
        <RuleModal setState={() => closeRuleModal()}/>
      )}
      {
        (showDifficultyModal && userId && userId !== "123") && (
          <DifficultyModal 
            setState={() => setShowDifficultyModal(false)} 
            setDifficulty={(difficulty) => {
              setDifficulty(difficulty);
              localStorage.setItem('difficulty', difficulty.toString());
            }}
            difficulty={difficulty}
          />
        )
      }
      <div className={`z-1 transition duration-300 ease-in-out`}>
        <Navigation currentPage='minimax' />
        <div className="flex flex-col pb-3 sm:pb-4 font-primary">
          <div className="flex flex-row items-center space-x-2 cursor-pointer min-h-6" onClick={() => setShowDifficultyModal(true)}>
            <HiOutlineSelector />
            <div className="font-medium">{difficulty === 1 ? "Easy" : difficulty === 3 ? "Medium" : difficulty === 5 ? "Hard" : difficulty === 0 ? "Select Difficulty" : ""}</div>
          </div>
          
          <div className={`grid mt-4 sm:mt-5 grid-cols-6 gap-2 md:gap-3 lg:gap-4`}>
            {cells.map((row, rowIndex) => row.map((cell, colIndex) => (
              <button
                onClick={() => handleClick(rowIndex, colIndex, true)}
                key={rowIndex * rowsCount + colIndex}
                className={`p-1 md:p-1.5 lg:p-2 cursor-pointer rounded-xl bg-primary justify-center items-center h-12 w-12 xs:h-16 xs:w-16 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-24 lg:w-24`}
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
                        breakpoint={breakpoint}
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
          <p className={`text-center ${displayedTurn % 2 === 0 ? 'text-fourth' : 'text-red-400'} text-lg md:text-xl font-semibold mt-4`}>
            {displayedTurn % 2 === 0 ? 'Your Turn' : `RED\'s Turn (MiniMax)`}
          </p>
        </div>
      </div>
    </main>
  );
}