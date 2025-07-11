/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import { useEffect, useState } from 'react';
import { BurstDotStructure, Cell, Color, Direction, Room } from '@/interfaces/Types';
import { sleep } from '@/utils/FunctionUtils';
import Modal from '@/components/Modal';
import { Dots } from '@/components/Dots';
import { Navigation } from '@/components/Navigation';
import socket from '@/utils/socket';
import { IoMdRefresh } from 'react-icons/io';
import { FaDotCircle } from 'react-icons/fa';
import { BurstDot } from '@/utils/Animation';
import { useTailwindBreakpoint } from '@/hooks/Breakpoint';

const rowsCount: number = 6;
const colsCount: number = 6;

// Main Component
export default function Multiplayer() {
  const [cells, setCells] = useState<Cell[][]>(Array.from({ length: rowsCount }, () => Array.from({ length: colsCount }, () => ({ val: 0, color: 'N' }))));
  const [turn, setTurn] = useState(0);
  const [isAllPlayersReady, setIsAllPlayersReady] = useState(false);
  const [playerColor, setPlayerColor] = useState<Color>('N');
  const [playerName, setPlayerName] = useState<string | null>("Chroma Player");
  const [tempName, setTempName] = useState<string>("");
  const [textField, setTextField] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [roomIds, setRoomIds] = useState<string[]>([]);
  const [winner, setWinner] = useState<Color | null>(null);
  const [isWaitingForPlayer, setIsWaitingForPlayer] = useState(false);
  const [burstDots, setBurstDots] = useState<{ row: number; col: number; dot: BurstDotStructure }[]>([]);
  const [status, setStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const breakpoint = useTailwindBreakpoint();

  const handleCopy = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const savePlayerName = () => {
    localStorage.setItem("username", tempName);
    setPlayerName(tempName);
  }

  const handleCreateRoom = () => {
    socket.emit("create-room", null, (newRoomId: string) => {
      console.log("Created Room:", newRoomId);
      setRoomId(newRoomId);
      setStatus("Waiting for player to join...")
    });
  };

  useEffect(() => {
    socket.connect();
    const name = localStorage.getItem("username");
    if (name) {
      setPlayerName(name);
    } else {
      setPlayerName(null);
    }
    // subscribe to socket events
    socket.on("rooms-list", (rooms: string[]) => {
      console.log("Available rooms:", rooms);
      setRoomIds(rooms);
    });
    socket.on("connect", () => {
      console.log("Connected to game server!", socket.id);
    });

    socket.on("player-joined", (room: Room) => {
      console.log("Player joined room:", room);
      const playerIndex = socket.id ? room.players.indexOf(socket.id) : -1;
      console.log("Player index:", playerIndex);
      if (playerIndex % 2 === 0) {
        setPlayerColor('B');
      }
      else {
        setPlayerColor('R');
      }
      setStatus("Player joined the room!");
      if (room.players.length >= 2) {
        setIsAllPlayersReady(true);
        setStatus("Both players are ready! Game starting...");
        setCells(Array.from({ length: rowsCount }, () => Array.from({ length: colsCount }, () => ({ val: 0, color: 'N' }))));
      }
    });

    socket.on("player-left", (room: Room) => {
      console.log("Player left room:", room);
      setStatus("Player left the room.");
    });

    socket.on("state-update", ({ grid, turn, burstSeq, roomId, winner }) => {
      console.log("BurstSeq", burstSeq);
      socket.emit("animation-started", roomId);
      if (burstSeq.length === 1 && burstSeq[0].length === 0) {
        setCells(grid);
      } 
      else {
        const row = burstSeq[0][0].row;
        const col = burstSeq[0][0].col;
        setCells((prev) => {
          const newCells = [...prev];
          newCells[row][col].val = 4;
          return newCells;
        });
      }
      burstSeqHandler(burstSeq, grid, 600, turn - 1).then(() => {
        setTurn(turn);
        socket.emit("done-processing", roomId);
        setTimeout(() => {
          setIsProcessing(false);
          setWinner(winner);
        }, 600);
      });

    });

    socket.on("animation-complete", () => {
      console.log("Animation complete");
      setIsProcessing(false);
    });

    socket.on("game-restarted", (grid) => {
      setIsWaitingForPlayer(false);
      setCells(grid);
      setTurn(0);
      setIsProcessing(false);
      setWinner(null);
      setBurstDots([]);
    });

    setTimeout(() => {
      socket.emit("get-rooms");
    }, 500);

    return () => {
      socket.off("rooms-list");
      socket.off("connect");
      socket.off("player-joined");
      socket.off("player-left");
      socket.off("state-update");
      socket.off("animation-complete");
      socket.off("game-restarted");
      socket.disconnect();
    };
  }, []);

  const resetGame = () => {
    socket.emit("restart-game", roomId);
    setIsWaitingForPlayer(true);
  }

  const handleClick = async (row: number, col: number) => {
    if (isProcessing) return; // Prevent user action while processing

    const color: Color = turn % 2 === 0 ? 'B' : 'R';
    if (color !== playerColor) return;
    const cell = cells[row][col];
    if (cell.color === 'N' && turn > 1) return;
    if (cell.color !== 'N' && cell.color !== color) return;
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    setIsProcessing(true);
    if (cells[row][col].val === 3) {
      setCells((prev) => {
        const newCells = [...prev];
        newCells[row][col].val = 4;
        return newCells;
      });
    }

    socket.emit("make-move", {
      roomId,
      row,
      col,
    });
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

  const burstSeqHandler = async (
    bursts: { row: number; col: number }[][],
    gridAfterBurst: Cell[][],
    delayMs: number = 600,
    turn: number
  ): Promise<void> => {
    
    const color = turn % 2 === 0 ? 'B' : 'R';
    for (const seqs of bursts) {
      if (!Array.isArray(seqs)) continue;
      await sleep(delayMs);
      setCells((prev) => {
      const tempCells = [...prev];
      for (const { row, col } of seqs) {
        if (navigator.vibrate) navigator.vibrate(30);
          
          tempCells[row][col].val = 0;
          tempCells[row][col].color = 'N';
          
          if (row === 0 && col === 0) {
            tempCells[row+1][col].val += 1;
            tempCells[row+1][col].color = color;
            tempCells[row][col+1].val += 1;
            tempCells[row][col+1].color = color;
            addBurst(row, col, ['down', 'right'], color as Exclude<Color, 'N'>);
          }
          else if (row === 0 && col === colsCount - 1) {
            tempCells[row+1][col].val += 1;
            tempCells[row+1][col].color = color;
            tempCells[row][col-1].val += 1;
            tempCells[row][col-1].color = color;
            addBurst(row, col, ['down', 'left'], color as Exclude<Color, 'N'>);
          }
          else if (row === rowsCount - 1 && col === 0) {
            tempCells[row-1][col].val += 1;
            tempCells[row-1][col].color = color;
            tempCells[row][col+1].val += 1;
            tempCells[row][col+1].color = color;
            addBurst(row, col, ['up', 'right'], color as Exclude<Color, 'N'>);
          }
          else if (row === rowsCount - 1 && col === colsCount - 1) {
            tempCells[row-1][col].val += 1;
            tempCells[row-1][col].color = color;
            tempCells[row][col-1].val += 1;
            tempCells[row][col-1].color = color;
            addBurst(row, col, ['up', 'left'], color as Exclude<Color, 'N'>);
          }
          else if (row === 0) {
            tempCells[row+1][col].val += 1;
            tempCells[row+1][col].color = color;
            tempCells[row][col-1].val += 1;
            tempCells[row][col-1].color = color;
            tempCells[row][col+1].val += 1;
            tempCells[row][col+1].color = color;
            addBurst(row, col, ['down', 'left', 'right'], color as Exclude<Color, 'N'>);
          }
          else if (row === rowsCount - 1) {
            tempCells[row-1][col].val += 1;
            tempCells[row-1][col].color = color;
            tempCells[row][col-1].val += 1;
            tempCells[row][col-1].color = color;
            tempCells[row][col+1].val += 1;
            tempCells[row][col+1].color = color;
            addBurst(row, col, ['up', 'left', 'right'], color as Exclude<Color, 'N'>);
          }
          else if (col === 0) {
            tempCells[row-1][col].val += 1;
            tempCells[row-1][col].color = color;
            tempCells[row+1][col].val += 1;
            tempCells[row+1][col].color = color;
            tempCells[row][col+1].val += 1;
            tempCells[row][col+1].color = color;
            addBurst(row, col, ['up', 'down', 'right'], color as Exclude<Color, 'N'>);
          }
          else if (col === colsCount - 1) {
            tempCells[row-1][col].val += 1;
            tempCells[row-1][col].color = color;
            tempCells[row+1][col].val += 1;
            tempCells[row+1][col].color = color;
            tempCells[row][col-1].val += 1;
            tempCells[row][col-1].color = color;
            addBurst(row, col, ['up', 'down', 'left'], color as Exclude<Color, 'N'>);
          }
          else {
            tempCells[row-1][col].val += 1;
            tempCells[row-1][col].color = color;
            tempCells[row+1][col].val += 1;
            tempCells[row+1][col].color = color;
            tempCells[row][col-1].val += 1;
            tempCells[row][col-1].color = color;
            tempCells[row][col+1].val += 1;
            tempCells[row][col+1].color = color;
            addBurst(row, col, ['up', 'down', 'left', 'right'], color as Exclude<Color, 'N'>);
          }
        }
         return tempCells;
      })
    }
    
    console.log("Grid after burst:", gridAfterBurst);
    setCells(gridAfterBurst);
  };


  const handleJoinRoom = (roomId: string) => {
    interface JoinRoomResponse {
      error?: string;
      grid?: Cell[][];
    }

    socket.emit("join-room", roomId, (response: JoinRoomResponse) => {
      if (response.error) {
      setStatus("❌ " + response.error);
      } else {
        setStatus("✅ Joined room!");
        setRoomId(roomId)
        console.log("Joined Room:", roomId);
        console.log("Initial game grid:", response.grid);
        setIsAllPlayersReady(true);
      }
    });
  };

  if (!isAllPlayersReady) {
    return (
      <main className="flex select-none justify-center bg-secondary text-primary font-primary w-screen min-h-screen">
        {!playerName && (
          <Modal 
            title={"Fill username"}
            body={"Other players will see your username."}
            buttonLabel="Save"
            isLoading={false}
            setInput={(val) => {
              setTempName(val);
            }}
            input={tempName}
            setState={savePlayerName}
          />
        )}
        <div className={`flex flex-col z-10 bg-secondary ${!playerName && 'blur-[0.1rem] opacity-30k transition duration-300 ease-in-out'} items-center`}>
          <Navigation currentPage='multiplayer' />
          
          <h1 className="text-xl font-medium mb-4">{status}</h1>
          <div className="flex space-x-4 mb-4">
            <button 
              onClick={() => handleCreateRoom()} 
              disabled={roomId !== ""}
              className="px-3 py-2 md:px-4 border-2 border-fourth text-fourth hover:opacity-75 rounded transition duration-300 hover:cursor-pointer disabled:border-gray-500 disabled:text-gray-500 disabled:hover:opacity-100"
            >
              Host Room
            </button>
            <input
              type="text"
              placeholder="Room ID ..."
              className="px-2 py-2 md:px-4 border border-primary text-primary rounded w-32 md:w-48"
              value={textField}
              onChange={(e) => setTextField(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (textField.trim() === "") {
                    setStatus("Please enter a valid Room ID.");
                  } else {
                    handleJoinRoom(textField);
                  }
                }
              }}
            />
            <button 
              onClick={() => {
                if (textField.trim() === "") {
                  setStatus("Please enter a valid Room ID.");
                } else {
                  handleJoinRoom(textField);
                }
              }} 
              className="px-3 py-2 md:px-4 bg-fourth text-white rounded hover:bg-fourth hover:opacity-75 transition duration-300 hover:cursor-pointer"
            >
              Join
            </button>
          </div>
          
          {status !== "Waiting for player to join..." ? (
            <div className="flex flex-col mt-4 items-center text-primary">
              <div className="space-x-4 flex flex-row mb-5 items-center">
                <div className="text-xl font-semibold text-center">{`Available Rooms (${roomIds.length})`}</div>
                <IoMdRefresh
                  onClick={() => socket.emit("get-rooms")} 
                  className="text-primary text-2xl hover:scale-110 hover:cursor-pointer transition duration-300"
                />
              </div>
              <div className="flex flex-wrap w-full justify-around px-50">
                {roomIds.map((id) => (
                  <div key={id}>
                    <button 
                      onClick={() => handleJoinRoom(id)} 
                      className="hover:cursor-pointer hover:bg-gray-900 transition duration-300 border py-4 px-7 m-2 rounded-lg min-w-[150px]"
                    >
                      <div className="flex items-center justify-center font-semibold text-lg">
                        <FaDotCircle className="mr-auto text-green-400" />
                        {id}
                      </div>
                    </button>
                  </div>
                ))}
              </div> 
            </div>
          ) : (
            <div
              className="flex flex-col items-center mt-4 hover:cursor-pointer text-primary"
              onClick={handleCopy}
              title="Click to copy"
            >
              <div>Your Room ID</div>
              <div className="font-mono text-3xl">{roomId}</div>
              {copied && <span className="text-green-400 text-md mt-2">Copied to Clipboard!</span>}
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="bg-secondary flex select-none justify-center font-primary min-h-screen w-screen">
      {winner && (
        <Modal 
          title={winner === playerColor ? '🎉 You Win!' : 'You Lose!'}
          body={"Press the button below to play again."}
          buttonLabel={isWaitingForPlayer ? "Waiting for opponent ..." : "Play Again"}
          isLoading={isWaitingForPlayer}
          setState={() => resetGame()}
        />
      )}
      <div className={`z-10 transition duration-300 ease-in-out`}>
        <Navigation currentPage='multiplayer' />
        <div>
          { playerColor !== 'N' && (
            <p className={`text-center ${playerColor === 'B' ? 'text-blue-400' : 'text-red-400'} text-lg font-semibold mt-4`}>
              {`You are playing as ${playerColor === 'B' ? 'Blue' : 'Red'}`}
            </p>
          )}
        </div>
        <div className="flex flex-col items-center py-3 sm:py-4 font-primary">
          <div className={`grid mt-4 sm:mt-5 grid-cols-6 gap-2 md:gap-3 lg:gap-4`}>
            {cells.map((row, rowIndex) => row.map((cell, colIndex) => (
              <button
                onClick={() => handleClick(rowIndex, colIndex)}
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
          <p className={`text-center ${turn % 2 === 0 ? 'text-blue-400' : 'text-red-400'} text-lg md:text-xl font-semibold mt-4`}>
            {turn % 2 === 0 ? 'BLUE\'s Turn' : `RED\'s Turn`}
          </p>
        </div>
      </div>
    </main>
  );
}