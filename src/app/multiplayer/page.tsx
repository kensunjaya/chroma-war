'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BurstDotStructure, Cell, Color, Direction, Room } from '@/interfaces/Types';
import { sleep } from '@/utils/FunctionUtils';
import Modal from '@/components/Modal';
import { Dots } from '@/components/Dots';
import { Navigation } from '@/components/Navigation';
import socket from '@/utils/socket';
import { IoMdRefresh } from 'react-icons/io';
import { FaDotCircle } from 'react-icons/fa';

const rowsCount: number = 6;
const colsCount: number = 6;

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
  const [isAllPlayersReady, setIsAllPlayersReady] = useState(false);
  const [playerColor, setPlayerColor] = useState<Color>('white');
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
        setPlayerColor('blue-400');
      }
      else {
        setPlayerColor('red-400');
      }
      setStatus("Player joined the room!");
      if (room.players.length >= 2) {
        setIsAllPlayersReady(true);
        setStatus("Both players are ready! Game starting...");
        setCells(Array.from({ length: rowsCount }, () => Array.from({ length: colsCount }, () => ({ val: 0, color: 'white' }))));
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
      burstSeqHandler(burstSeq, grid, 750, turn - 1).then(() => {
        setTurn(turn);
        setTimeout(() => {
          socket.emit("done-processing", roomId);
          setIsProcessing(false);
          setWinner(winner);
        }, 750);
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
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    const color: Color = turn % 2 === 0 ? 'blue-400' : 'red-400';
    if (color !== playerColor) return;
    const cell = cells[row][col];
    if (cell.color === 'white' && turn > 1) return;
    if (cell.color !== 'white' && cell.color !== color) return;
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

  const burstSeqHandler = async (
    bursts: { row: number; col: number }[][],
    gridAfterBurst: Cell[][],
    delayMs: number = 750,
    turn: number
  ): Promise<void> => {
    
    const color = turn % 2 === 0 ? 'blue-400' : 'red-400';
    for (const seqs of bursts) {
      if (!Array.isArray(seqs)) continue;
      await sleep(delayMs);
      setCells((prev) => {
      const tempCells = [...prev];
      for (const { row, col } of seqs) {
        if (navigator.vibrate) navigator.vibrate(30);
          
          tempCells[row][col].val = 0;
          tempCells[row][col].color = 'white';
          
          if (row === 0 && col === 0) {
            tempCells[row+1][col].val += 1;
            tempCells[row+1][col].color = color;
            tempCells[row][col+1].val += 1;
            tempCells[row][col+1].color = color;
            addBurst(row, col, ['down', 'right'], color as Exclude<Color, 'white'>);
          }
          else if (row === 0 && col === colsCount - 1) {
            tempCells[row+1][col].val += 1;
            tempCells[row+1][col].color = color;
            tempCells[row][col-1].val += 1;
            tempCells[row][col-1].color = color;
            addBurst(row, col, ['down', 'left'], color as Exclude<Color, 'white'>);
          }
          else if (row === rowsCount - 1 && col === 0) {
            tempCells[row-1][col].val += 1;
            tempCells[row-1][col].color = color;
            tempCells[row][col+1].val += 1;
            tempCells[row][col+1].color = color;
            addBurst(row, col, ['up', 'right'], color as Exclude<Color, 'white'>);
          }
          else if (row === rowsCount - 1 && col === colsCount - 1) {
            tempCells[row-1][col].val += 1;
            tempCells[row-1][col].color = color;
            tempCells[row][col-1].val += 1;
            tempCells[row][col-1].color = color;
            addBurst(row, col, ['up', 'left'], color as Exclude<Color, 'white'>);
          }
          else if (row === 0) {
            tempCells[row+1][col].val += 1;
            tempCells[row+1][col].color = color;
            tempCells[row][col-1].val += 1;
            tempCells[row][col-1].color = color;
            tempCells[row][col+1].val += 1;
            tempCells[row][col+1].color = color;
            addBurst(row, col, ['down', 'left', 'right'], color as Exclude<Color, 'white'>);
          }
          else if (row === rowsCount - 1) {
            tempCells[row-1][col].val += 1;
            tempCells[row-1][col].color = color;
            tempCells[row][col-1].val += 1;
            tempCells[row][col-1].color = color;
            tempCells[row][col+1].val += 1;
            tempCells[row][col+1].color = color;
            addBurst(row, col, ['up', 'left', 'right'], color as Exclude<Color, 'white'>);
          }
          else if (col === 0) {
            tempCells[row-1][col].val += 1;
            tempCells[row-1][col].color = color;
            tempCells[row+1][col].val += 1;
            tempCells[row+1][col].color = color;
            tempCells[row][col+1].val += 1;
            tempCells[row][col+1].color = color;
            addBurst(row, col, ['up', 'down', 'right'], color as Exclude<Color, 'white'>);
          }
          else if (col === colsCount - 1) {
            tempCells[row-1][col].val += 1;
            tempCells[row-1][col].color = color;
            tempCells[row+1][col].val += 1;
            tempCells[row+1][col].color = color;
            tempCells[row][col-1].val += 1;
            tempCells[row][col-1].color = color;
            addBurst(row, col, ['up', 'down', 'left'], color as Exclude<Color, 'white'>);
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
            addBurst(row, col, ['up', 'down', 'left', 'right'], color as Exclude<Color, 'white'>);
          }
        }
         return tempCells;
      })
    }
    
    console.log("Grid after burst:", gridAfterBurst);
    setCells(gridAfterBurst);
  };


  // const recursiveFill = async (row: number, col: number, color: Color, delayMs: number, isUserAction: boolean = false): Promise<void> => {
  //   const newCells = [...cells];
  //   if (turn > 1) {
  //     newCells[row][col].val += 1;
  //   }
  //   else {
  //     newCells[row][col].val = 3;
  //   }

  //   if (newCells[row][col].color === 'white') {
  //     colorCount[color] += 1;
  //   }
  //   else if (newCells[row][col].color !== color) {
  //     colorCount[newCells[row][col].color] -= 1;
  //     colorCount[color] += 1;
  //   }
  //   setColorCount({ ...colorCount });

  //   newCells[row][col].color = color;
  //   if (isUserAction) {
  //     setCells([...newCells]);
  //   }

  //   await sleep(delayMs);
  //   setCells([...newCells]);
  //   if (newCells[row][col].val >= 4) {
  //     newCells[row][col].val = 0;
  //     colorCount[newCells[row][col].color] -= 1;
  //     setColorCount({ ...colorCount });
  //     newCells[row][col].color = 'white';
  //     if (navigator.vibrate) {
  //       navigator.vibrate(50);
  //     }

  //     // draw burst animation
  //     if (row === 0 && col === 0) {
  //       addBurst(row, col, ['down', 'right'], color as Exclude<Color, 'white'>);
  //     }
  //     else if (row === 0 && col === colsCount - 1) {
  //       addBurst(row, col, ['down', 'left'], color as Exclude<Color, 'white'>);
  //     }
  //     else if (row === rowsCount - 1 && col === 0) {
  //       addBurst(row, col, ['up', 'right'], color as Exclude<Color, 'white'>);
  //     }
  //     else if (row === rowsCount - 1 && col === colsCount - 1) {
  //       addBurst(row, col, ['up', 'left'], color as Exclude<Color, 'white'>);
  //     }
  //     else if (row === 0) {
  //       addBurst(row, col, ['down', 'left', 'right'], color as Exclude<Color, 'white'>);
  //     }
  //     else if (row === rowsCount - 1) {
  //       addBurst(row, col, ['up', 'left', 'right'], color as Exclude<Color, 'white'>);
  //     }
  //     else if (col === 0) {
  //       addBurst(row, col, ['up', 'down', 'right'], color as Exclude<Color, 'white'>);
  //     }
  //     else if (col === colsCount - 1) {
  //       addBurst(row, col, ['up', 'down', 'left'], color as Exclude<Color, 'white'>);
  //     }
  //     else {
  //       addBurst(row, col, ['up', 'down', 'left', 'right'], color as Exclude<Color, 'white'>);
  //     }

  //     const promises = [];

  //     if (row > 0) {
  //       promises.push(recursiveFill(row - 1, col, color, delayMs));
  //     }
  //     if (row < rowsCount - 1) {
  //       promises.push(recursiveFill(row + 1, col, color, delayMs));
  //     } 
  //     if (col > 0) {
  //       promises.push(recursiveFill(row, col - 1, color, delayMs));
  //     }
  //     if (col < colsCount - 1) {
  //       promises.push(recursiveFill(row, col + 1, color, delayMs));
  //     }
  //     await Promise.all(promises); // wait for all bursts to finish
  //   }
  // };

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
      <main className="flex justify-center bg-black font-sans w-screen min-h-screen">
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
        <div className={`flex flex-col z-10 bg-black ${!playerName && 'blur-[0.1rem] opacity-30k transition duration-300 ease-in-out'} items-center`}>
          <Navigation currentPage='multiplayer' />
          
          <h1 className="text-xl font-semibold mb-4">{status}</h1>
          <div className="flex space-x-4 mb-4">
            <button 
              onClick={() => handleCreateRoom()} 
              disabled={roomId !== ""}
              className="px-3 py-2 md:px-4 border-2 border-blue-300 text-blue-300 hover:border-blue-400 hover:text-blue-400 rounded transition duration-300 hover:cursor-pointer disabled:border-gray-500 disabled:text-gray-500 disabled:hover:border-gray-500 disabled:hover:text-gray-500"
            >
              Host Room
            </button>
            <input
              type="text"
              placeholder="Room ID ..."
              className="px-2 py-2 md:px-4 border border-gray-300 rounded w-32 md:w-48"
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
              className="px-3 py-2 md:px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300 hover:cursor-pointer"
            >
              Join
            </button>
          </div>
          
          {status !== "Waiting for player to join..." ? (
            <div className="flex flex-col mt-4 items-center text-white">
              <div className="space-x-4 flex flex-row mb-5 items-center">
                <div className="text-xl font-semibold text-center">{`Available Rooms (${roomIds.length})`}</div>
                <IoMdRefresh
                  onClick={() => socket.emit("get-rooms")} 
                  className="text-white text-2xl hover:scale-110 hover:cursor-pointer transition duration-300"
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
              className="flex flex-col items-center mt-4 hover:cursor-pointer text-white"
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
    <main className="bg-black flex justify-center font-sans min-h-screen w-screen">
      {winner && (
        <Modal 
          title={winner === playerColor ? '🎉 You Win!' : 'You Lose!'}
          body={"Press the button below to play again."}
          buttonLabel={isWaitingForPlayer ? "Waiting for opponent ..." : "Play Again"}
          isLoading={isWaitingForPlayer}
          setState={() => resetGame()}
        />
      )}
      <div className={`z-10 bg-black ${winner && 'blur-[0.1rem] opacity-30k transition duration-300 ease-in-out'}`}>
        <Navigation currentPage='multiplayer' />
        <div>
          { playerColor !== 'white' && (
            <p className={`text-center ${playerColor === 'blue-400' ? 'text-blue-400' : 'text-red-400'} text-lg font-semibold mt-4`}>
              {`You are playing as ${playerColor === 'blue-400' ? 'Blue' : 'Red'}`}
            </p>
          )}
        </div>
        <div className="flex flex-col items-center py-3 sm:py-4 font-sans">
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
        <div>
          <p className={`text-center ${turn % 2 === 0 ? 'text-blue-400' : 'text-red-400'} text-lg font-semibold mt-4`}>
            {turn % 2 === 0 ? 'Blue\'s turn' : `Red\'s turn`}
          </p>
        </div>
      </div>
    </main>
  );
}