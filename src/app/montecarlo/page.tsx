/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import { useEffect, useState } from 'react';
import { BurstDotStructure, Cell, Color, Direction } from '@/interfaces/Types';
import { Dots } from '@/components/Dots'; 
import { checkWinner, downloadCSV, findBestMove, sleep } from '@/utils/FunctionUtils';
import Modal from '@/components/Modal';
import { Navigation } from '@/components/Navigation';
import { BurstDot } from '@/utils/Animation';
import { useTailwindBreakpoint } from '@/hooks/Breakpoint';
import ColorBar from '@/components/ColorBar';
import { motion } from "framer-motion";

const rowsCount: number = 6;
const colsCount: number = 6;

// Main Component
export default function MonteCarloSimulation() {
  const [cells, setCells] = useState<Cell[][]>(Array.from({ length: rowsCount }, () => Array.from({ length: colsCount }, () => ({ val: 0, color: 'N' }))));
  const [turn, setTurn] = useState(0);
  const [winner, setWinner] = useState<Color | null>(null);
  const [displayedTurn, setDisplayedTurn] = useState(0);
  const [burstDots, setBurstDots] = useState<{ row: number; col: number; dot: BurstDotStructure }[]>([]);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [depth, setDepth] = useState<number>(3);
  const [firstMoves, setFirstMoves] = useState<{row: number[]; col: number[]}>({row: [], col: []});
  const [seqWinners, setSeqWinners] = useState<("Blue" | "Red")[]>([]);

  const [colorCount, setColorCount] = useState<{ [key in Color]: number }>({
    'N': rowsCount * colsCount,
    'B': 0,
    'R': 0,
  });
  const [winnerCount, setWinnerCount] = useState<{ [key in Color]: number }>({
    'B': 0,
    'R': 0,
    'N': 0,
  });

  const [n_iter, setNIter] = useState<number>(1000);
  const [turns, setTurns] = useState<number[]>([]);
  const [currentRound, setCurrentRound] = useState<number>(1);

  const [isProcessing, setIsProcessing] = useState(false);
  const breakpoint = useTailwindBreakpoint();

  useEffect(() => {
    if (isProcessing) return;
    if (!gameStarted) return;
    const win = checkWinner(turn, colorCount);
    setWinner(win);
    if (win) {
      setTurns((prev) => [...prev, turn]);
      if (win === 'B') {
        setWinnerCount((prev) => ({ ...prev, 'B': prev['B'] + 1 }));
        setSeqWinners((prev) => [...prev, "Blue"]);
      }
      else if (win === 'R') {
        setWinnerCount((prev) => ({ ...prev, 'R': prev['R'] + 1 }));
        setSeqWinners((prev) => [...prev, "Red"]);
      }
      if (currentRound == n_iter) {
        return;
      }
      resetGame();
      setCurrentRound((prev) => prev + 1);
      return;
    }
    setDisplayedTurn(turn);
    setTimeout(() => {
      const { row, col } = findBestMove(cells, depth, turn, colorCount, (turn % 2 === 0 ? 'B' : 'R'), false);
      if (turn === 0) {
        setFirstMoves((prev) => ({
          row: [...prev.row, row],
          col: [...prev.col, col],
        }));
      }
      handleClick(row, col);
    }, 1);
  }, [isProcessing, gameStarted]);

  const resetGame = () => {
    const newCells: Cell[][] = Array.from({ length: rowsCount }, () => Array.from({ length: colsCount }, () => ({ val: 0, color: 'N' })));
    setCells(newCells);
    setTurn(0);
    colorCount['B'] = 0;
    colorCount['R'] = 0;
    colorCount['N'] = rowsCount * colsCount;
    setColorCount({ ...colorCount });
    setDisplayedTurn(0);
    // setGameStarted(false);
    setWinner(null);
    setBurstDots([]);
    setIsProcessing(true);
    setTimeout(() => {
      const { row, col } = findBestMove(newCells, depth, 0, {'B': 0, 'R': 0, 'N': rowsCount * colsCount}, 'B', false);
      handleClick(row, col);
      setIsProcessing(false);
    }, 1);
  }

  const handleClick = async (row: number, col: number) => {
    if (isProcessing) return; // Prevent user action while processing

    const color: Color = turn % 2 === 0 ? 'B' : 'R';
    const cell = cells[row][col];

    if (cell.color === 'N' && turn > 1) return;
    if (cell.color !== 'N' && cell.color !== color) return;
    // const audio = new Audio('/tap.aac');
    // audio.play();
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
    setIsProcessing(true); // start processing
    setTurn((prev) => prev + 1);
    await recursiveFill(row, col, color, 50, true);
    setIsProcessing(false);
  };

  const constructCSVData = () => {
    const csvData = {
      iter: [] as number[],
      first_x: [] as number[],
      first_y: [] as number[],
      depth: [] as number[],
      n_turn: [] as number[],
      winner: [] as ("Blue" | "Red")[],
    }
    csvData.iter = Array.from({ length: seqWinners.length }, (_, i) => i + 1);
    csvData.first_x = firstMoves.col;
    csvData.first_y = firstMoves.row;
    csvData.depth = Array.from({ length: seqWinners.length }, () => depth);
    csvData.n_turn = turns;
    csvData.winner = seqWinners;
    downloadCSV(csvData);
  }

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
      // const audio = new Audio('/break.aac');
      // console.log("Audio played");
      // audio.play();
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
    <main className="flex justify-center text-primary">
      <button 
        className="fixed landscape:top-4 landscape:right-4 portrait:bottom-2 portrait:right-2 z-10 px-4 hover:cursor-pointer py-2 w-fit transition duration-300 disabled:hover:cursor-default bg-fifth disabled:bg-gray-400 text-white font-medium rounded-md shadow-sm hover:opacity-75 focus:outline-none focus:ring-2" 
        onClick={() => constructCSVData()}
      >
        Export data to CSV
      </button>
      {!gameStarted && (
        <Modal  
          title="Welcome to Monte Carlo Simulation Mode"
          body="In this mode, we are simulating Monte Carlo Simulation to see if first move advantage exists."
          buttonLabel="Start Match"
          isLoading={false}
          setState={() => setGameStarted(true)}
        />
      )}
      <div className={`z-1 transition duration-300 ease-in-out`}>
        <Navigation currentPage='montecarlo' />
        <div className="flex flex-col pb-3 pt-2">
          <div className="flex flex-row landscape:font-semibold text-xs sm:text-sm md:text-md lg:text-lg justify-between items-center">
            <p>
              Run: {currentRound} / {n_iter}
            </p>
            <motion.p>
              Blue: {(winnerCount['B'] / (currentRound - 1 || 1) * 100).toFixed(1)}%
              ({winnerCount['B']})
            </motion.p>

            <motion.p>
              Red: {(winnerCount['R'] / (currentRound - 1 || 1) * 100).toFixed(1)}%
              ({winnerCount['R']})
            </motion.p>
          </div>
          <div className={`grid mt-4 sm:mt-5 grid-cols-6 gap-2 [@media(min-width:400px)_and_(max-width:639px)]:portrait:gap-2.5 md:gap-3 lg:gap-4`}>
            {cells.map((row, rowIndex) => row.map((cell, colIndex) => (
              <button
                aria-label={`Cell ${rowIndex}, ${colIndex}`}
                disabled
                key={rowIndex * rowsCount + colIndex}
                className={`p-1 [@media(min-width:400px)_and_(max-width:639px)]:portrait:p-1.25 md:p-1.5 lg:p-2 cursor-pointer rounded-xl bg-primary justify-center items-center h-12 w-12 [@media(min-width:400px)_and_(max-width:639px)]:portrait:h-14 [@media(min-width:400px)_and_(max-width:639px)]:portrait:w-14 xs:h-16 xs:w-16 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-24 lg:w-24`}
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
                        animationDuration={0}
                      />
                    ))
                  }
                </div>
              </button>
              ))
            )}
          </div>
        </div>
        <ColorBar turn={displayedTurn} colorCount={colorCount} />
        <div>
          <p className={`text-center ${displayedTurn % 2 === 0 ? 'text-blue-400' : 'text-red-400'} text-lg md:text-xl font-semibold mt-4`}>
            {displayedTurn % 2 === 0 ? 'BLUE\'s Turn' : `RED\'s Turn`}
          </p>
        </div>
      </div>
    </main>
  );
}