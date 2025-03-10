import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { GameLine, GridPoint } from '../types/game';

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
      // console.log(`Generated key for (${current.x},${current.y}) to (${next.x},${next.y}): ${lineKey}`);
      uniqueLines.add(lineKey);
    }
  }
  
  return uniqueLines.size;
};


const validateLines = (drawnLines: GameLine[], solutionData: any) => {
  const uniqueDrawnLines = new Set<string>();
  const correctLines: string[] = [];
  const wrongLines: string[] = [];

  // Create a set of solution lines using grid coordinates
  const solutionLines = new Set<string>();
  solutionData.lines.forEach((line: any) => {
    const points = [
      { x: line.start.x, y: line.start.y },
      { x: line.end.x, y: line.end.y }
    ].sort((a, b) => a.x - b.x || a.y - b.y); // Sort by x, then y if x is equal
    
    // Generate the key using the sorted points
    const lineKey = `${points[0].x},${points[0].y}-${points[1].x},${points[1].y}`;
    solutionLines.add(lineKey);
  });

  // Check each drawn line
  for (const line of drawnLines) {
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
      
      if (!uniqueDrawnLines.has(lineKey)) {
        uniqueDrawnLines.add(lineKey);
        if (solutionLines.has(lineKey)) {
          correctLines.push(line.id);
        } else {
          wrongLines.push(line.id);
        }
      }
    }
  }

  return { correctLines, wrongLines, uniqueLineCount: uniqueDrawnLines.size
  };
};


export const GameSubmitButton: React.FC = () => {
  const { theme, gameState, setGameState, gameLines } = useStore();
  const lineCount = countUniqueGridLines(gameLines);
  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  const handleSubmit = () => {
    if (!gameState) return;

    // Validate the drawn lines against the solution
    const { correctLines, wrongLines, uniqueLineCount } = validateLines(gameLines, gameState.gridData);

    // Update the game state with the results
    setGameState({
      ...gameState,
      currentAttempt: gameState.currentAttempt + 1,
      correctLines: [...gameState.correctLines, ...correctLines],
      wrongLines: [...gameState.wrongLines, ...wrongLines],
      drawnLines: [...gameState.drawnLines, ...gameLines]
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