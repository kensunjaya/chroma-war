export type Color = 'R' | 'B' | 'N';
export type Cell = {
  val: number;
  color: Color;
};
export type Direction = 'up' | 'down' | 'left' | 'right';
export type BurstDotStructure = {
  id: number;
  direction: Direction;
  color: Exclude<Color, 'N'>;
};

export type Room = {
  roomId: string;
  host: string;
  players: ServerSidePlayer[];
  grid: Cell[][];
  turn: number;
  createdAt: Date;
}

type ServerSidePlayer = {
  playerName: string;
  socketId: string;
  color: Color;
}

export const ColorMap = {
  'B': 'blue-500',
  'R': 'red-500',
  'N': 'white',
}

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type MiniMaxOutput = {
  row: number;
  col: number;
  score: number;
}