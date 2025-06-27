export type Color = 'red-400' | 'blue-400' | 'white';
export type Cell = {
  val: number;
  color: Color;
};
export type Direction = 'up' | 'down' | 'left' | 'right';
export type BurstDotStructure = {
  id: number;
  direction: Direction;
  color: Exclude<Color, 'white'>;
};

export type Room = {
  id: string;
  players: string[];
  grid: Cell[][];
  turn: number;
  createdAt: Date;
}