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
            className={`flex border text-white dark:text-black bg-${cell.color} rounded-xl justify-center hover:cursor-pointer items-center h-[2.6rem] w-[2.6rem] xs:h-14 xs:w-14 sm:h-14 sm:w-14 md:h-16 md:w-16 xl:h-18 xl:w-18 m-2 select-none`}
          >
            {cell.val === 0 ? "" : cell.val}
          </div>
        ))}
      </div>
    </div>
  );
}
