/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { BurstDotStructure, Cell, Color, Direction, Room, ToastProps } from '@/interfaces/Types';
import { sleep } from '@/utils/FunctionUtils';
import Modal from '@/components/Modal';
import { Dots } from '@/components/Dots';
import { Navigation } from '@/components/Navigation';
import socket from '@/utils/socket';
import { IoMdRefresh } from 'react-icons/io';
import { FaDotCircle } from 'react-icons/fa';
import { BurstDot } from '@/utils/Animation';
import { useTailwindBreakpoint } from '@/hooks/Breakpoint';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import ColorBar from '@/components/ColorBar';

const rowsCount: number = 6;
const colsCount: number = 6;

// Main Component
export default function Multiplayer() {
  const [cells, setCells] = useState<Cell[][]>(Array.from({ length: rowsCount }, () => Array.from({ length: colsCount }, () => ({ val: 0, color: 'N' }))));
  const [turn, setTurn] = useState(0);
  const [isAllPlayersReady, setIsAllPlayersReady] = useState(false);
  const [playerColor, setPlayerColor] = useState<Color>('N');
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [playerName, setPlayerName] = useState<string | null>("Chroma Player");
  const [tempName, setTempName] = useState<string>("");
  const [textField, setTextField] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [winner, setWinner] = useState<Color | null>(null);
  const [colorCount, setColorCount] = useState<{ [key in Color]: number }>({
    'N': rowsCount * colsCount,
    'B': 1,
    'R': 1,
  });
  const [isWaitingForPlayer, setIsWaitingForPlayer] = useState(false);
  const [burstDots, setBurstDots] = useState<{ row: number; col: number; dot: BurstDotStructure }[]>([]);
  const [status, setStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const breakpoint = useTailwindBreakpoint();

  const winnerRef = useRef(winner);
  const playerNameRef = useRef(playerName);
  const roomIdRef = useRef(roomId);

  const resetMultiplayer = () => {
    setCells(Array.from({ length: rowsCount }, () => Array.from({ length: colsCount }, () => ({ val: 0, color: 'N' }))));
    setTurn(0);
    setIsAllPlayersReady(false);
    setPlayerColor('N');
    setTextField("");
    setRoomId("");
    setAvailableRooms([]);
    setWinner(null);
    setOpponentDisconnected(false);
    setColorCount({
      'N': rowsCount * colsCount,
      'B': 2,
      'R': 2,
    });
    setIsWaitingForPlayer(false);
    setBurstDots([]);
    setStatus("");
    setIsProcessing(false);
    setCopied(false);
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteRoom = (roomId: string) => {
    socket.emit('delete-room', roomId);
    resetMultiplayer();
  }
  
  const savePlayerName = () => {
    localStorage.setItem("username", tempName);
    setPlayerName(tempName);
  }
  
  const handleCreateRoom = () => {
    socket.emit("create-room", playerName, (newRoomId: string) => {
      console.log("Created Room:", newRoomId);
      setRoomId(newRoomId);
      setStatus("Waiting for a player to join...");
      toast.info("Successfully created room! Waiting for a player to join...", ToastProps);
    });
  };
  
  useEffect(() => {
    winnerRef.current = winner;
    playerNameRef.current = playerName;
    roomIdRef.current = roomId;
  }, [winner, playerName, roomId]);

  useEffect(() => {
    try {
      if (!socket.connected) {
        socket.connect();
      }
    } catch (error) {
      toast.error("Failed to connect to the multiplayer server. Please try again later.", ToastProps);
      console.error(error);
    }
    const name = localStorage.getItem("username");
    if (name) {
      setPlayerName(name);
    } else {
      setPlayerName(null);
    }
    // subscribe to socket events
    socket.on("rooms-list", (rooms: Room[]) => {
      console.log("There are", rooms.length, "rooms available.");
      setAvailableRooms(rooms);
    });
    socket.on("connect", () => {
      console.log("Connected to game server!", socket.id);
      const lastRoomId = localStorage.getItem('lastRoomId');
      if (lastRoomId) {
        socket.emit("rejoin", { roomId: lastRoomId, playerName: playerNameRef.current || "Chroma Player" });
      } else {
        console.log("No lastRoomId found");
      }
    });

    socket.on("connect_error", (err) => {
      console.error("Connection error:", err.message);
      toast.error("Failed to connect to the server. Try again later.", ToastProps);
    });

    socket.on("rejoin-success", (room) => {
      console.log("Rejoined room:", room);
      toast.success("Successfully rejoined the last session.", ToastProps);
      setRoomId(room.roomId);
      setCells(room.grid);
      setTurn(room.turn);
      setPlayerColor(room.players.find((player: {socketId: string, color: Color}) => player.socketId === socket.id)?.color || 'N');
      setIsAllPlayersReady(true);
    });

    socket.on("rejoin-failed", ({ error }) => {
      console.error("Rejoin failed:", error);
      toast.error(`Failed to rejoin the last session: ${error}`, ToastProps);
      localStorage.removeItem("lastRoomId");
    });

    socket.on("player-joined", (room: Room) => {
      console.log("Player joined room:", room);
      const pColor = room.players.find(player => player.socketId === socket.id)?.color || 'N';
      setPlayerColor(pColor);
      setStatus("Player joined the room!");
      // if (room.isGameStarted) {
      //   toast.info(`${room.players.find(player => player.socketId !== socket.id)?.playerName || "Anonymous"} has reconnected!`, ToastProps);
      // }
    });

    socket.on("player-reconnected", (room: Room, playerName: string) => {
      console.log("Player reconnected:", room);
      setOpponentDisconnected(false);
      toast.info(`${playerName || "Anonymous"} has reconnected!`, ToastProps);
    });

    socket.on("game-start", (room: Room) => {
      console.log("Game started in room:", room.roomId);
      toast.info(`You are playing vs ${room.players.find(player => player.socketId !== socket.id)?.playerName || "Anonymous"}, good luck!`, ToastProps);
      localStorage.setItem("lastRoomId", room.roomId);
      setIsAllPlayersReady(true);
      setIsWaitingForPlayer(false);
      setCells(Array.from({ length: rowsCount }, () => Array.from({ length: colsCount }, () => ({ val: 0, color: 'N' }))));
    });

    socket.on("restart-requested", ({nRestartRequest, pName}: {nRestartRequest: number, pName: string}) => {
      console.log("Restart requested:", nRestartRequest, pName);
      if (nRestartRequest === 1 && pName !== playerNameRef.current) toast.info("Opponent wants to rematch.", ToastProps);
    });

    socket.on("player-left", (room: Room, playerName: string) => {
      console.log("Player left room:", room);
      if (winnerRef.current) {
        resetMultiplayer();
        toast.warn(`${playerName || "Anonymous"} has left the session.`, ToastProps);
        socket.emit('delete-room', roomIdRef.current);
        socket.emit("get-rooms");
      } else {
        setOpponentDisconnected(true);
        toast.warn(`${playerName || "Anonymous"} disconnected. Waiting for them to rejoin`, ToastProps);
      }
      setStatus("Opponent left the room.");
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

    socket.on("game-restarted", (room) => {
      setIsWaitingForPlayer(false);
      setCells(room.grid);
      setTurn(0);
      setIsProcessing(false);
      setWinner(null);
      setBurstDots([]);
      localStorage.setItem("lastRoomId", room.roomId);
    });

    // setTimeout(() => {
    //   socket.emit("get-rooms");
    // }, 100);

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

  useEffect(() => {
    if (winner) {
      localStorage.removeItem("lastRoomId");
    }
  }, [winner]);

  const rematch = () => {
    socket.emit("restart-game", { roomId: roomId, playerName: playerName });
    setIsWaitingForPlayer(true);
  }

  const handleClick = async (row: number, col: number) => {
    if (isProcessing) return; // Prevent user action while processing
    setIsProcessing(true);
    const color: Color = turn % 2 === 0 ? 'B' : 'R';
    if (color !== playerColor) {
      setIsProcessing(false);
      return;
    }
    const cell = cells[row][col];
    if (cell.color === 'N' && turn > 1) {
      setIsProcessing(false);
      return;
    }
    if (cell.color !== 'N' && cell.color !== color) {
      setIsProcessing(false);
      return;
    }
    if (navigator.vibrate) {
      navigator.vibrate(20);
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
      roomId: roomId,
      row: row,
      col: col,
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
          if (navigator.vibrate) navigator.vibrate(20);
            
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
          const tempColorCount: { [key in Color]: number } = { R: 0, B: 0, N: 0 };
          for (const row of tempCells) {
            for (const cell of row) {
              tempColorCount[cell.color] += 1;
            }
          }
          setColorCount(tempColorCount);
          console.log(tempColorCount);
         return tempCells;
        }
      )
    }
    
    console.log("Grid after burst:", gridAfterBurst);
    setCells(gridAfterBurst);
  };


  const handleJoinRoom = (roomId: string) => {
    interface JoinRoomResponse {
      error?: string;
      grid?: Cell[][];
    }

    socket.emit("join-room", roomId, playerName, (response: JoinRoomResponse) => {
      if (response.error) {
        toast.error(response.error, ToastProps);
        console.error("Failed to join room:", response.error);
      } else {
        setStatus("Joined room!");
        setRoomId(roomId)
        console.log("Joined Room:", roomId);
      }
    });
  };

  if (!isAllPlayersReady) {
    return (
      <main className="flex justify-center text-primary">
        {!playerName && (
          <Modal 
            title="Enter username"
            body="Other players will see your username."
            buttonLabel="Save"
            isLoading={false}
            setInput={(val) => {
              setTempName(val);
            }}
            input={tempName}
            setState={savePlayerName}
          />
        )}
        <div className={`flex flex-col z-10 ${!playerName && 'blur-[0.1rem] opacity-30k transition duration-300 ease-in-out'} items-center`}>
          <Navigation currentPage='multiplayer' />
          <h1 className="text-lg mb-4">{status}</h1>
          <div className="flex gap-4 mb-4">
            <motion.button 
              onClick={() => roomId ? handleDeleteRoom(roomId) : handleCreateRoom()} 
              className={`px-3 py-2 md:px-4 outline-2 border-fourth text-fourth rounded transition duration-300 hover:cursor-pointer ${roomId && 'outline-red-400 text-red-400'}`}
              whileTap={{ scale: 0.9 }}
              whileHover={{ opacity: 0.7 }}
            >
              {roomId ? "Delete Room" : "Host Room"}
            </motion.button>
              { !roomId && (
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Room ID ..."
                    className="px-2 py-2 md:px-4 border-b-2 text-primary outline-0 w-32 md:w-48"
                    value={textField.toUpperCase()}
                    onChange={(e) => setTextField(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (textField.trim() === "") {
                          toast.error("Please enter a valid Room ID.", ToastProps);
                        } else {
                          handleJoinRoom(textField);
                        }
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      if (textField.trim() === "") {
                        toast.error("Please enter a valid Room ID.", ToastProps);
                      } else {
                        handleJoinRoom(textField);
                      }
                    }} 
                    className="px-4 hover:cursor-pointer py-2 w-fit transition duration-300 disabled:hover:cursor-default bg-fourth disabled:bg-gray-400 text-white font-medium rounded-md shadow-sm hover:opacity-75 disabled:hover:opacity-100 focus:outline-none focus:ring-2"
                    disabled={textField.trim().length !== 5}
                  >
                    Join
                  </button>
                </div>
              )
            }
          </div>
          
          {roomId === "" ? (
            <div className="flex flex-col mt-4 items-center text-primary w-full">
              <div className="space-x-4 flex flex-row mb-5 items-center">
                <div className="text-xl font-medium text-center">{`Available Rooms (${availableRooms.length})`}</div>
                <motion.div whileHover={{ scale: 1.1, rotate: 45 }} whileTap={{ scale: 0.9 }}>
                  <IoMdRefresh
                    onClick={() => socket.emit("get-rooms")} 
                    className="text-primary text-2xl hover:cursor-pointer transition duration-300"
                  />
                </motion.div>
              </div>
              <div className="flex flex-col items-center w-full space-y-2">
                {availableRooms?.map((room) => (
                  <button 
                    onClick={() => handleJoinRoom(room.roomId)} 
                    className="hover:cursor-pointer hover:outline-3 transition duration-300 border py-4 px-7 rounded-lg w-full"
                    key={room.roomId ? room.roomId : uuidv4()}
                  >
                    <div className="flex items-center text-lg space-x-3">
                      <FaDotCircle className={`${room.isGameStarted ? 'text-red-400' : room.players.length < 2 ? 'text-green-400' : 'text-yellow-400'}`} />
                      <div className="mr-auto font-semibold">{room.roomId}</div>
                      <div>Host: {room.host}</div>
                    </div>
                  </button>
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
    <main className="flex justify-center">
      {winner && (
        <Modal 
          title={winner === playerColor ? '🎉 You Win!' : 'You Lose!'}
          body={`The game has ended after ${turn} turns.`}
          buttonLabel={isWaitingForPlayer ? "Waiting for opponent ..." : "Rematch"}
          isLoading={isWaitingForPlayer}
          setState={() => rematch()}
          setOnBackgroundClick={() => {
            resetMultiplayer();
            setStatus("You left the room.");
            socket.emit('leave-room', { roomId: roomId, playerName: playerName });
          }}
        />
      )}
      <div className={`z-10 transition duration-300 ease-in-out`}>
        <Navigation currentPage='multiplayer' />
        <div className="text-center text-md md:text-lg mt-4">
          <span className="text-primary font-medium">You are playing as </span>
          { playerColor !== 'N' && (
            <span className={playerColor === 'B' ? 'text-blue-400 font-semibold' : 'text-red-400 font-semibold'}>
              {playerColor === 'B' ? 'Blue' : 'Red'}
            </span>
          )}
        </div>
        <div className="flex flex-col items-center py-3 sm:py-4">
          <div className={`grid mt-4 sm:mt-5 grid-cols-6 gap-2 [@media(min-width:400px)_and_(max-width:639px)]:portrait:gap-2.5 md:gap-3 lg:gap-4 ${opponentDisconnected ? 'opacity-40' : ''}`}>
            {cells.map((row, rowIndex) => row.map((cell, colIndex) => (
              <button
                aria-label={`Cell ${rowIndex}, ${colIndex}`}
                onClick={() => handleClick(rowIndex, colIndex)}
                key={rowIndex * rowsCount + colIndex}
                disabled={opponentDisconnected}
                className={`${opponentDisconnected ? 'cursor-not-allowed' : 'cursor-pointer'} p-1 [@media(min-width:400px)_and_(max-width:639px)]:portrait:p-1.25 md:p-1.5 lg:p-2 rounded-xl bg-primary justify-center items-center h-12 w-12 [@media(min-width:400px)_and_(max-width:639px)]:portrait:h-14 [@media(min-width:400px)_and_(max-width:639px)]:portrait:w-14 xs:h-16 xs:w-16 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-24 lg:w-24`}
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
        <ColorBar turn={turn} colorCount={colorCount} />
        <div>
          <p className={`text-center ${turn % 2 === 0 ? (playerColor === 'B' ? 'text-fourth' : 'text-blue-400') : (playerColor === 'R' ? 'text-fourth' : 'text-red-400')} text-lg md:text-xl font-semibold mt-4`}>
            {turn % 2 === 0 ? (playerColor === 'B' ? 'Your Turn' : 'BLUE\'s Turn') : (playerColor === 'R' ? 'Your Turn' : `RED\'s Turn`)}
          </p>
        </div>
      </div>
    </main>
  );
}