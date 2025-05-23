// import React from 'react';
// import { motion } from 'framer-motion';
// import { useStore } from '../../store/useStore';
// import { Line } from '../../types';

// const countUniqueGridLines = (lines: Line[]): number => {

//   const uniqueLines = new Set<string>();
  
//   for (const line of lines) {
//     if (line.points.length < 2) continue;
    
//     for (let i = 0; i < line.points.length - 1; i++) {
//       const current = line.points[i];
//       const next = line.points[i + 1];
      
//       // Only count if both points are on grid intersections
//       // if (
//       //   current.x === current.snapX && 
//       //   current.y === current.snapY &&
//       //   next.x === next.snapX && 
//       //   next.y === next.snapY
//       // ) {
//         // Create a unique key for this line segment
//         // Sort the points so (0,0)-(1,1) is the same as (1,1)-(0,0)
//       const x1 = Math.min(current.snapX, next.snapX);
//       const y1 = Math.min(current.snapY, next.snapY);
//       const x2 = Math.max(current.snapX, next.snapX);
//       const y2 = Math.max(current.snapY, next.snapY);
      
//       const lineKey = `${x1},${y1}-${x2},${y2}`;
//       uniqueLines.add(lineKey);
//     // }
//     }
//   }
  
//   return uniqueLines.size;
// };
import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { GameLine } from '../../types/game';

const countUniqueGridLines = (lines: GameLine[]): number => {
  const uniqueLines = new Set<string>();
  
  for (const line of lines) {
    if (line.points.length < 2) continue;
    
    for (let i = 0; i < line.points.length - 1; i++) {
      const current = line.points[i];
      const next = line.points[i + 1];
      
      // Create a unique key by sorting the points as tuples
      const points = [
        { x: current.x, y: current.y },
        { x: next.x, y: next.y }
      ].sort((a, b) => a.x - b.x || a.y - b.y); // Sort by x, then y if x is equal
      
      // Generate the key using the sorted points
      const lineKey = `${points[0].x},${points[0].y}-${points[1].x},${points[1].y}`;
      uniqueLines.add(lineKey);
    }
  }
  
  return uniqueLines.size;
};

export const GameHeader: React.FC = () => {
  const { gameState, gameLines, theme } = useStore();

  if (!gameState) return null;

  const lineCount = countUniqueGridLines(gameLines);
  const displayAttempt = Math.min(gameState.currentAttempt, gameState.maxAttempts);
  const isLineCountCorrect = lineCount === gameState.minLinesRequired;
  const totalLinesLimit = gameState.totalLinesLimit || 30;
  const totalLinesUsed = gameState.totalLinesUsed + lineCount;

  // Determine screen size for conditional rendering
  const isMobile = window.innerWidth < 640; // sm breakpoint
  const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024; // md breakpoint

  return (
    <div className="fixed top-0 left-0 w-full flex justify-center items-center pt-20 sm:pt-20 md:pt-20 z-20 pointer-events-none">
      <motion.div
        className="pointer-events-auto w-full max-w-screen-sm px-4 sm:px-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className={`
          flex flex-col gap-3
          ${isMobile ? 'text-xs' : isTablet ? 'text-sm' : 'text-base'}
          font-medium text-center
          ${theme === 'dark' 
            ? 'text-[rgba(255,255,255,0.3)]' 
            : 'text-[rgba(0,0,0,0.3)]'
          }
        `}>
          {/* First Row */}
          <div className="flex items-center justify-center gap-2">
            <span>Attempt {displayAttempt} of {gameState.maxAttempts}</span>
            <span className={`${
              theme === 'dark' 
                ? 'text-[rgba(255,255,255,0.2)]' 
                : 'text-[rgba(0,0,0,0.2)]'
            }`}>|</span>
            <span className={isLineCountCorrect ? 'text-emerald-500' : 'text-red-500'}>
              Lines: {lineCount}/{gameState.minLinesRequired}
            </span>
          </div>

          {/* Second Row */}
          <div className="flex items-center justify-center gap-2">
            <span>Max lines you can draw: {totalLinesLimit}</span>
            <span className={`${
              theme === 'dark' 
                ? 'text-[rgba(255,255,255,0.2)]' 
                : 'text-[rgba(0,0,0,0.2)]'
            }`}>|</span>
            <span className={totalLinesUsed >= totalLinesLimit ? 'text-red-500' : ''}>
              Total lines drawn: {totalLinesUsed}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};