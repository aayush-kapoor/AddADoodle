import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Line } from '../types';

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

export const GameSubmitButton: React.FC = () => {
  const { theme, gameState, setGameState, gameLines } = useStore();
  const lineCount = countGridLines(gameLines);
  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  const handleSubmit = () => {
    if (!gameState) return;

    // TODO: Add logic to check the drawn lines against the solution
    const isCorrect = false; // This will be replaced with actual validation logic
    
    setGameState({
      ...gameState,
      currentAttempt: gameState.currentAttempt + 1,
      drawnLines: [],
      correctLines: isCorrect ? [...gameState.correctLines, ...gameLines.map(l => l.id)] : gameState.correctLines,
      wrongLines: !isCorrect ? [...gameState.wrongLines, ...gameLines.map(l => l.id)] : gameState.wrongLines
    });
  };

  const isDisabled = !gameState || lineCount === 0 || 
    (gameState.minLinesRequired && lineCount < gameState.minLinesRequired);

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center items-center pb-4 z-10 pointer-events-none">
      <motion.div
        className="pointer-events-auto"
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={isDisabled}
          className={`
            flex items-center justify-center
            backdrop-blur-lg
            rounded-full
            shadow-lg
            transition-all
            ${isDisabled
              ? 'opacity-50 cursor-not-allowed bg-emerald-500/30'
              : theme === 'dark'
                ? 'bg-emerald-500/30 hover:bg-emerald-500/40 shadow-emerald-500/20'
                : 'bg-emerald-600/30 hover:bg-emerald-600/40 shadow-emerald-600/20'
            }
            ${isMobile ? 'w-12 h-12' : 'px-6 py-3 min-w-[140px]'}
          `}
        >
          {isMobile ? (
            <CheckCircle2 
              size={24} 
              className={`${isDisabled ? 'opacity-50' : 'text-emerald-400'}`}
            />
          ) : (
            <span className={`font-medium ${isDisabled ? 'opacity-50' : 'text-emerald-400'}`}>
              Submit Attempt
            </span>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
};