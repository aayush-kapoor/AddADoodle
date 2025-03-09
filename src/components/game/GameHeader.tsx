import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { Line } from '../../types';

const countGridLines = (lines: Line[]): number => {
  let count = 0;
  
  for (const line of lines) {
    if (line.points.length < 2) continue;
    
    // Count segments between consecutive grid points
    for (let i = 0; i < line.points.length - 1; i++) {
      const current = line.points[i];
      const next = line.points[i + 1];
      
      // Only count if both points are on grid intersections
      if (
        current.x === current.snapX && 
        current.y === current.snapY &&
        next.x === next.snapX && 
        next.y === next.snapY
      ) {
        count++;
      }
    }
  }
  
  return count;
};

export const GameHeader: React.FC = () => {
  const { gameState, gameLines, theme } = useStore();

  if (!gameState) return null;

  const lineCount = countGridLines(gameLines);

  return (
    <div className="fixed top-0 left-0 w-full flex justify-center items-center pt-20 sm:pt-20 z-20 pointer-events-none">
      <motion.div
        className="pointer-events-auto"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className={`
          text-base sm:text-lg font-medium
          ${theme === 'dark' 
            ? 'text-[rgba(255,255,255,0.3)]' 
            : 'text-[rgba(0,0,0,0.3)]'
          }
        `}>
          <span>Attempt {gameState.currentAttempt} of {gameState.maxAttempts}</span>
          <span className={`mx-2 ${
            theme === 'dark' 
              ? 'text-[rgba(255,255,255,0.2)]' 
              : 'text-[rgba(0,0,0,0.2)]'
          }`}>|</span>
          <span>Lines: {lineCount}/{gameState.minLinesRequired}</span>
        </div>
      </motion.div>
    </div>
  );
};