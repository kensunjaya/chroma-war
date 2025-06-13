'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { BurstDotStructure, Cell, Color, Direction } from '@/interfaces/Types';

// BurstDot component
const BurstDot = ({ direction, color, onComplete }: {
  direction: Direction;
  color: Color;
  onComplete: () => void;
}) => {
  const getCoords = (dir: Direction) => {
    switch (dir) {
      case 'up': return { x: 0, y: -40 };
      case 'down': return { x: 0, y: 40 };
      case 'left': return { x: -40, y: 0 };
      case 'right': return { x: 40, y: 0 };
    }
  };

  return (
    <motion.div
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{ ...getCoords(direction), opacity: 0, scale: 1.2 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      onAnimationComplete={onComplete}
      className={`absolute w-2.5 h-2.5 rounded-full bg-${color} pointer-events-none`}
    />
  );
};

const rowsCount = 6;
const colsCount = 6;

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

  const addBurst = (row: number, col: number, color: Exclude<Color, 'white'>) => {
    ['up', 'down', 'left', 'right'].forEach((dir) => {
      setBurstDots((prev) => [
        ...prev,
        {
          row,
          col,
          dot: {
            id: Date.now() + Math.random(),
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
        addBurst(row, col, color as Exclude<Color, 'white'>);
        newCells[row][col].val = 0;
        newCells[row][col].color = 'white';

        if (row > 0) recursiveFill(row - 1, col, color, delay);
        if (row < rowsCount - 1) recursiveFill(row + 1, col, color, delay);
        if (col > 0) recursiveFill(row, col - 1, color, delay);
        if (col < colsCount - 1) recursiveFill(row, col + 1, color, delay);
      }
    }, delay);
  };

  const renderDots = (val: number) => {
    const dotClass = `w-2 h-2 sm:h-3.5 sm:w-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-full bg-white`;
    const dotWrapper = 'absolute w-full h-full flex items-center justify-center';
    const dots = {
      1: [<div key="1" className={dotWrapper}><div className={dotClass} /></div>],
      2: [<div key="2a" className="absolute left-1.5 top-1.5 md:left-2 md:top-2"><div className={dotClass} /></div>,<div key="2b" className="absolute right-1.5 md:right-2 bottom-1.5 md:bottom-2"><div className={dotClass} /></div>],
      3: [<div key="3a" className="absolute top-1.5 md:top-2"><div className={dotClass} /></div>,<div key="3b" className="absolute left-1.5 md:left-2 bottom-1.5 md:bottom-2"><div className={dotClass} /></div>,<div key="3c" className="absolute right-1.5 md:right-2 bottom-1.5 md:bottom-2"><div className={dotClass} /></div>],
      4: [<div key="4a" className="absolute left-1.5 top-1.5 md:left-2 md:top-2"><div className={dotClass} /></div>,<div key="4b" className="absolute right-1.5 top-1.5 md:right-2 md:top-2"><div className={dotClass} /></div>,<div key="4c" className="absolute left-1.5 md:left-2 bottom-1.5 md:bottom-2"><div className={dotClass} /></div>,<div key="4d" className="absolute right-1.5 md:right-2 bottom-1.5 md:bottom-2"><div className={dotClass} /></div>],
    };
    return dots[val as keyof typeof dots] || null;
  };

  return (
    <main className="font-sans">
      <div className="flex flex-row text-3xl xs:text-3xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-4xl text-center justify-center items-center pt-5">
        <h1 className="text-center hover:cursor-default font-bold">{"Chr⦿ma War"}</h1>
      </div>
      <div className="flex flex-col items-center min-h-screen py-3 sm:py-4 font-sans">
        <div className={`grid mt-4 sm:mt-5 grid-cols-6 gap-3 sm:gap-4 md:gap-5`}>
          {cells.map((row, rowIndex) => row.map((cell, colIndex) => (
            <div
              onClick={() => handleClick(rowIndex, colIndex)}
              key={rowIndex * rowsCount + colIndex}
              className={`relative flex border-4 xs:border-6 s:border-6 sm:border-8 md:border-8 lg:border-10 xl:border-10 transition-all duration-200 cursor-pointer border-white
                ${cell.color === 'blue-400' ? 'bg-blue-400' : cell.color === 'red-400' ? 'bg-red-400' : 'bg-white'}
                rounded-xl justify-center items-center h-12 w-12 xs:h-16 xs:w-16 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-24 lg:w-24`}
            >
              {cell.val !== 0 && renderDots(cell.val)}
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
            ))
          )}
        </div>
      </div>
    </main>
  );
}