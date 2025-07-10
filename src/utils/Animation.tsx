import { motion } from 'framer-motion';
import { Breakpoint, Color, ColorMap, Direction } from "@/interfaces/Types";

export const BurstDot = ({ direction, color, onComplete, breakpoint }: {
  direction: Direction;
  color: Color;
  onComplete: () => void;
  breakpoint: Breakpoint;
}) => {
  const displacement = breakpoint === 'xs' ? 50 : breakpoint === 'sm' ? 55 : breakpoint === 'md' ? 70 : breakpoint === 'lg' ? 80 : 100;
  const scale = breakpoint === 'xs' ? 3 : breakpoint === 'sm' ? 4 : breakpoint === 'md' ? 5 : breakpoint === 'lg' ? 5 : 6;
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
      initial={{ x: 0, y: 0, opacity: 1, scale: scale }}
      animate={{ ...getCoords(direction), opacity: 0.75, scale: scale }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onAnimationComplete={onComplete}
      className={`absolute w-3 h-3 z-[5] rounded-full bg-${ColorMap[color]} pointer-events-none`}
    />
  );
};