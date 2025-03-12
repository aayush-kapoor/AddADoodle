import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sun, Moon, RotateCcw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { GameCanvas } from '../components/GameCanvas';
import { GameHeader } from '../components/game/GameHeader';
import { GameToolbar } from '../components/GameToolbar';
import { GameUndoRedo } from '../components/GameUndoRedo';
import { GameSubmitButton } from '../components/GameSubmitButton';
import { HelpButton } from '../components/game/HelpButton';
import { HelpPopup } from '../components/game/HelpPopup';
import { supabase } from '../lib/supabase';

export const DoodleOfTheDay: React.FC = () => {
  const { theme, toggleTheme, gameState, setGameState, gameLines, gameUndoStack, clearGameLines, setGameLines } = useStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    const loadDailyShape = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data: shape, error } = await supabase
          .from('shapes')
          .select('*')
          .eq('active_date', today)
          .single();

        if (error) throw error;

        if (!shape) {
          setError('No shape available for today');
          return;
        }

        // Get current attempt number from session storage
        const attemptsKey = `doodle_attempts_${today}`;
        const currentAttempts = parseInt(sessionStorage.getItem(attemptsKey) || '0');

        // Load saved lines from session storage
        const linesKey = `doodle_current_lines_${today}`;
        const savedLines = JSON.parse(sessionStorage.getItem(linesKey) || '[]');
        setGameLines(savedLines);

        // Load total lines used from session storage
        const totalLinesKey = `doodle_total_lines_${today}`;
        const totalLinesUsed = parseInt(sessionStorage.getItem(totalLinesKey) || '0');

        // Load disabled segments from session storage
        const disabledSegmentsKey = `doodle_disabled_segments_${today}`;
        const savedDisabledSegments = new Set(JSON.parse(sessionStorage.getItem(disabledSegmentsKey) || '[]'));

        // Load correct segments from session storage
        const correctSegmentsKey = `doodle_correct_segments_${today}`;
        const savedCorrectSegments = JSON.parse(sessionStorage.getItem(correctSegmentsKey) || '[]');

        setGameState({
          isActive: true,
          currentAttempt: currentAttempts + 1,
          maxAttempts: 5,
          minLinesRequired: shape.min_lines_required,
          totalLinesLimit: shape.total_lines_limit,
          totalLinesUsed: totalLinesUsed,
          drawnLines: [],
          correctLines: [],
          wrongLines: [],
          disabledSegments: savedDisabledSegments,
          correctSegments: savedCorrectSegments,
          gridData: shape.grid_data
        });

        // Show help popup on first visit
        const hasSeenHelp = sessionStorage.getItem('has_seen_help');
        if (!hasSeenHelp) {
          setIsHelpOpen(true);
          sessionStorage.setItem('has_seen_help', 'true');
        }

      } catch (err) {
        console.error('Error loading daily shape:', err);
        setError('Failed to load today\'s challenge');
      } finally {
        setIsLoading(false);
      }
    };

    loadDailyShape();
  }, [setGameState, setGameLines]);

  // Save current lines to session storage whenever they change
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const linesKey = `doodle_current_lines_${today}`;
    sessionStorage.setItem(linesKey, JSON.stringify(gameLines));
  }, [gameLines]);

  // Save game state changes to session storage
  useEffect(() => {
    if (!gameState) return;

    const today = new Date().toISOString().split('T')[0];
    
    // Save disabled segments
    const disabledSegmentsKey = `doodle_disabled_segments_${today}`;
    sessionStorage.setItem(disabledSegmentsKey, JSON.stringify(Array.from(gameState.disabledSegments)));

    // Save correct segments
    const correctSegmentsKey = `doodle_correct_segments_${today}`;
    sessionStorage.setItem(correctSegmentsKey, JSON.stringify(gameState.correctSegments));
  }, [gameState]);

  const handleReset = () => {
    if (!gameState || gameLines.length === 0) return;
    
    // Clear current lines from session storage
    const today = new Date().toISOString().split('T')[0];
    const linesKey = `doodle_current_lines_${today}`;
    sessionStorage.setItem(linesKey, JSON.stringify([]));
    
    clearGameLines();
  };

  return (
    <div className={`min-h-screen ${
      theme === 'dark' ? 'bg-black text-white theme-dark' : 'bg-white text-black theme-light'
    }`}>
      {/* Back Button */}
      <motion.div
        className="fixed top-4 left-4 z-20 pointer-events-none"
        initial={{ x: -50 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className={`pointer-events-auto inline-block bg-white/10 backdrop-blur-lg p-4 rounded-full transition-colors ${
            theme === 'dark'
              ? 'hover:bg-white/20'
              : 'hover:bg-black/20'
          }`}
        >
          <ArrowLeft size={20} />
        </motion.button>
      </motion.div>

      {/* Theme Toggle and Reset */}
      <div className="fixed top-0 left-0 w-full flex justify-center items-center pt-4 z-20 pointer-events-none">
        <motion.div 
          className="pointer-events-auto inline-flex items-center gap-2 bg-white/10 backdrop-blur-lg p-2 rounded-full"
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="relative p-2 rounded-full hover:bg-white/10 transition-colors group"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </motion.button>

          <div className="w-px h-4 bg-current opacity-20" />

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className={`relative p-2 rounded-full hover:bg-white/10 transition-colors group ${
              gameLines.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={gameLines.length === 0}
          >
            <RotateCcw size={20} />
          </motion.button>
        </motion.div>
      </div>

      {/* Help Button */}
      <HelpButton onClick={() => setIsHelpOpen(true)} />

      {/* Help Popup */}
      <HelpPopup isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {isLoading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/20"></div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-screen text-center">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <>
          <GameHeader />
          <GameCanvas />
          <GameToolbar />
          <GameUndoRedo />
          <GameSubmitButton />
        </>
      )}
    </div>
  );
};