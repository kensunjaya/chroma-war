'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { BurstDotStructure, Cell, Color, Direction } from '@/interfaces/Types';
import { Dots } from './components/Dots';

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

const rowsCount: number = 6;
const colsCount: number = 6;

// Main Component
export default function Home() {
  const [cells, setCells] = useState<Cell[][]>(Array.from({ length: rowsCount }, () => Array.from({ length: colsCount }, () => ({ val: 0, color: 'white' }))));
  const [turn, setTurn] = useState(0);
  const [burstDots, setBurstDots] = useState<{ row: number; col: number; dot: BurstDotStructure }[]>([]);

  const handleClick = (row: number, col: number) => {
    const color: Color = turn % 2 === 0 ? 'blue-400' : 'red-400';
    const cell = cells[row][col];

    if (cell.color === 'white' && turn > 1) return;
    if (cell.color !== 'white' && cell.color !== color) return;
    setTurn(turn + 1);
    recursiveFill(row, col, color, 1000, true); // use the originally calculated `color`
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

  const recursiveFill = (row: number, col: number, color: Color, delay: number, isUserAction: boolean = false) => {
    const newCells = [...cells];
    if (turn > 1) {
      newCells[row][col].val += 1;
    }
    else {
      newCells[row][col].val = 3;
    }
    newCells[row][col].color = color;
    if (isUserAction) {
      setCells([...newCells]);
    }
    setTimeout(() => {
      setCells([...newCells]);
      if (newCells[row][col].val >= 4) {
        newCells[row][col].val = 0;
        newCells[row][col].color = 'white';

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

        // now recursively fill adjacent cells
        if (row > 0) {
          recursiveFill(row - 1, col, color, delay);
        }
        if (row < rowsCount - 1) {
          recursiveFill(row + 1, col, color, delay);
        } 
        if (col > 0) {
          recursiveFill(row, col - 1, color, delay);
        }
        if (col < colsCount - 1) {
          recursiveFill(row, col + 1, color, delay);
        }
      }
    }, delay);
  };

  return (
    <main className="font-sans">
      <div className="flex flex-row text-3xl xs:text-3xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-4xl text-center justify-center items-center pt-5">
        <h1 className="text-center hover:cursor-default font-bold">{"Chr⦿ma War"}</h1>
      </div>
      <div className="flex flex-col items-center min-h-screen py-3 sm:py-4 font-sans">
        <div className={`grid mt-4 sm:mt-5 grid-cols-6 gap-2 md:gap-3 lg:gap-4`}>
          {cells.map((row, rowIndex) => row.map((cell, colIndex) => (
            <button
              onClick={() => handleClick(rowIndex, colIndex)}
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
    </main>
  );
}