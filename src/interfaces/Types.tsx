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
  id: string;
  players: string[];
  grid: Cell[][];
  turn: number;
  createdAt: Date;
}