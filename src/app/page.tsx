'use client';
import { useState } from "react";

type Cell = {
  val: number;
  color: Color;
}

type Color = "red-400" | "blue-400" | "white";


export default function Home() {
  const [cells, setCells] = useState<Cell[][]>(Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => ({ val: 0, wrong: false, color: "white" }))));
  const [turn, setTurn] = useState<number>(0);

  const renderDots = (val: number) => {
    const dotClass = `w-3 h-3 rounded-full bg-white`;
    const dotWrapper = "absolute w-full h-full flex items-center justify-center";

    const dots = {
      1: [
        <div key="1" className={dotWrapper}><div className={dotClass} /></div>
      ],
      2: [
        <div key="2a" className="absolute left-2 top-2"><div className={dotClass} /></div>,
        <div key="2b" className="absolute right-2 bottom-2"><div className={dotClass} /></div>,
      ],
      3: [
        <div key="3a" className="absolute top-2"><div className={dotClass} /></div>,
        <div key="3b" className="absolute left-2 bottom-2"><div className={dotClass} /></div>,
        <div key="3c" className="absolute right-2 bottom-2"><div className={dotClass} /></div>,
      ],
      4: [
        <div key="4a" className="absolute left-2 top-2"><div className={dotClass} /></div>,
        <div key="4b" className="absolute right-2 top-2"><div className={dotClass} /></div>,
        <div key="4c" className="absolute left-2 bottom-2"><div className={dotClass} /></div>,
        <div key="4d" className="absolute right-2 bottom-2"><div className={dotClass} /></div>,
      ]
    };

    return dots[val as keyof typeof dots] || null;
  };


  

  const handleClick = (row: number, col: number, turn: number) => {
    let color: Color = turn % 2 === 0 ? "blue-400" : "red-400";
    if (cells[row][col].val === 0) {
      if (turn > 1) {
        return;
      }
    }
    if (cells[row][col].color !== "white" && color !== cells[row][col].color) {
      return;
    }

    setTurn(turn + 1);
    color = turn % 2 === 0 ? "blue-400" : "red-400";
    recursiveFill(row, col, color);
  }
  const recursiveFill = (row: number, col: number, color: Color) => {
    cells[row][col].val += 1;
    cells[row][col].color = color;
    setCells([...cells]);
    if (cells[row][col].val === 4) {
      cells[row][col].val = 0;
      cells[row][col].color = "white";
      setCells([...cells]);
      if (row > 0) recursiveFill(row - 1, col, color); // Up
      if (row < 8) recursiveFill(row + 1, col, color); // Down
      if (col > 0) recursiveFill(row, col - 1, color); // Left
      if (col < 8) recursiveFill(row, col + 1, color); // Right
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen py-3 sm:py-4 font-sans">
      <div className="grid mt-4 sm:mt-5 grid-cols-9 text-3xl xs:text-3xl sm:text-3xl md:text-5xl lg:text-5xl xl:text-5xl">
        {cells.map((row, rowIndex) => row.map((cell, colIndex) =>
          <div
            onClick={() => { handleClick(rowIndex, colIndex, turn) }}
            // onKeyDown={(event) => handleKeyDown(event, rowIndex, colIndex)}
            tabIndex={0}
            key={rowIndex * 9 + colIndex}
            className={`relative flex border-8
              ${cell.color === "blue-400" ? "bg-blue-400" : cell.color === "red-400" ? "bg-red-400" : "bg-white"} 
              rounded-xl justify-center hover:cursor-pointer items-center h-[2.6rem] w-[2.6rem] xs:h-14 xs:w-14 sm:h-14 sm:w-14 md:h-16 md:w-16 xl:h-18 xl:w-18 m-2 select-none`}
          >
            {cell.val !== 0 && renderDots(cell.val)}
          </div>
        ))}
      </div>
    </div>
  );
}
