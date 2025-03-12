import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { GameLine, GridPoint, Shape } from '../types/game';
import { FailurePopup } from './game/FailurePopup';
import { SuccessPopup } from './game/SuccessPopup';
import { supabase } from '../lib/supabase';

const generateLineKey = (start: GridPoint, end: GridPoint): string => {
  // Sort points to ensure consistent key regardless of direction
  if (start.x < end.x || (start.x === end.x && start.y < end.y)) {
    return `${start.x},${start.y}-${end.x},${end.y}`;
  }
  return `${end.x},${end.y}-${start.x},${start.y}`;
};

const getLineSegments = (line: GameLine): { id: string, start: GridPoint, end: GridPoint }[] => {
  const segments: { id: string, start: GridPoint, end: GridPoint }[] = [];
  
  for (let i = 0; i < line.points.length - 1; i++) {
    const start = line.points[i];
    const end = line.points[i + 1];
    const segmentId = `${line.id}-${i}`;
    segments.push({ id: segmentId, start, end });
  }
  
  return segments;
};

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

const validateLines = (drawnLines: GameLine[], solution: Shape) => {
  const correctSegments: string[] = [];
  const wrongSegments: string[] = [];
  const uniqueDrawnLines = new Set<string>();
  const solutionLines = new Set<string>(solution.line_keys || []);

  // Check each drawn line's segments
  for (const line of drawnLines) {
    if (line.points.length < 2) continue;

    const segments = getLineSegments(line);
    
    for (const segment of segments) {
      const lineKey = generateLineKey(segment.start, segment.end);
      
      if (!uniqueDrawnLines.has(lineKey)) {
        uniqueDrawnLines.add(lineKey);
        if (solutionLines.has(lineKey)) {
          correctSegments.push(segment.id);
        } else {
          wrongSegments.push(segment.id);
        }
      }
    }
  }

  return { 
    correctLines: correctSegments, 
    wrongLines: wrongSegments, 
    uniqueLineCount: uniqueDrawnLines.size 
  };
};

export const GameSubmitButton: React.FC = () => {
  const { theme, gameState, setGameState, gameLines } = useStore();
  const [isFailurePopupOpen, setIsFailurePopupOpen] = useState(false);
  const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false);
  const [stats, setStats] = useState({
    attempts: 0,
    linesUsed: 0
  });
  const [solution, setSolution] = useState<Shape | null>(null);
  const lineCount = countUniqueGridLines(gameLines);
  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  // Check if user has exceeded attempts for today
  const [hasExceededAttempts, setHasExceededAttempts] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);

  useEffect(() => {
    const fetchSolution = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('shapes')
          .select('*')
          .eq('active_date', today)
          .single();

        if (error) throw error;
        setSolution(data);
      } catch (err) {
        console.error('Error fetching solution:', err);
      }
    };

    fetchSolution();

    // Check for existing game result
    const today = new Date().toISOString().split('T')[0];
    const gameResultKey = `doodle_result_${today}`;
    const savedResult = sessionStorage.getItem(gameResultKey);
    const savedStats = JSON.parse(sessionStorage.getItem(`doodle_stats_${today}`) || '{}');

    if (savedResult) {
      setGameCompleted(true);
      setStats(savedStats);
      if (savedResult === 'success') {
        setIsSuccessPopupOpen(true);
      } else if (savedResult === 'failure') {
        setIsFailurePopupOpen(true);
      }
    }
  }, []);

  const handleSubmit = async () => {
    if (!gameState || !solution) return;

    // If game is already completed for today, just show the appropriate popup
    if (gameCompleted) {
      const today = new Date().toISOString().split('T')[0];
      const gameResultKey = `doodle_result_${today}`;
      const savedResult = sessionStorage.getItem(gameResultKey);
      if (savedResult === 'success') {
        setIsSuccessPopupOpen(true);
      } else {
        setIsFailurePopupOpen(true);
      }
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const attemptsKey = `doodle_attempts_${today}`;
    const totalLinesKey = `doodle_total_lines_${today}`;
    const currentAttempts = parseInt(sessionStorage.getItem(attemptsKey) || '0');

    // Check if total lines limit is exceeded
    const totalLinesUsed = gameState.totalLinesUsed + lineCount;
    if (totalLinesUsed > (solution.total_lines_limit || 30)) {
      const currentStats = {
        attempts: currentAttempts + 1,
        linesUsed: totalLinesUsed
      };
      setStats(currentStats);
      sessionStorage.setItem(`doodle_stats_${today}`, JSON.stringify(currentStats));
      sessionStorage.setItem(`doodle_result_${today}`, 'failure');
      setGameCompleted(true);
      setIsFailurePopupOpen(true);
      return;
    }

    if (currentAttempts >= 5) {
      const currentStats = {
        attempts: currentAttempts,
        linesUsed: totalLinesUsed
      };
      setStats(currentStats);
      sessionStorage.setItem(`doodle_stats_${today}`, JSON.stringify(currentStats));
      sessionStorage.setItem(`doodle_result_${today}`, 'failure');
      setGameCompleted(true);
      setIsFailurePopupOpen(true);
      return;
    }

    // Increment attempts in session storage
    sessionStorage.setItem(attemptsKey, (currentAttempts + 1).toString());

    // Update total lines used in session storage
    sessionStorage.setItem(totalLinesKey, totalLinesUsed.toString());

    // Validate the drawn lines against the solution
    const { correctLines, wrongLines, uniqueLineCount } = validateLines(gameLines, solution);

    // Check for win condition
    const hasWon = correctLines.length === solution.min_lines_required && wrongLines.length === 0;

    if (hasWon) {
      const currentStats = {
        attempts: currentAttempts + 1,
        linesUsed: totalLinesUsed
      };
      setStats(currentStats);
      sessionStorage.setItem(`doodle_stats_${today}`, JSON.stringify(currentStats));
      sessionStorage.setItem(`doodle_result_${today}`, 'success');
      setGameCompleted(true);
      setIsSuccessPopupOpen(true);
      return;
    }

    // Update the game state with the results
    setGameState({
      ...gameState,
      currentAttempt: Math.min(gameState.currentAttempt + 1, gameState.maxAttempts),
      correctLines,
      wrongLines,
      drawnLines: [...gameState.drawnLines, ...gameLines],
      totalLinesUsed
    });

    // Check if this was the last attempt
    if (currentAttempts + 1 >= 5) {
      setHasExceededAttempts(true);
      if (correctLines.length < solution.min_lines_required) {
        const currentStats = {
          attempts: currentAttempts + 1,
          linesUsed: totalLinesUsed
        };
        setStats(currentStats);
        sessionStorage.setItem(`doodle_stats_${today}`, JSON.stringify(currentStats));
        sessionStorage.setItem(`doodle_result_${today}`, 'failure');
        setGameCompleted(true);
        setIsFailurePopupOpen(true);
      }
    }
  };

  const isDisabled = !gameState || !solution || lineCount === 0 || 
    (solution.min_lines_required && lineCount < solution.min_lines_required);

  return (
    <>
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

      <FailurePopup
        isOpen={isFailurePopupOpen}
        onClose={() => setIsFailurePopupOpen(false)}
        stats={stats}
      />

      <SuccessPopup
        isOpen={isSuccessPopupOpen}
        onClose={() => setIsSuccessPopupOpen(false)}
        stats={stats}
      />
    </>
  );
};