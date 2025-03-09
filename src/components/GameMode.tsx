import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, RotateCcw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { GameCanvas } from './GameCanvas';
import { GameHeader } from './game/GameHeader';
import { ShapeLine } from '../types/game';
import { supabase } from '../lib/supabase';

export const GameMode: React.FC = () => {
  const { theme, setGameMode, gameState, setGameState } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        setGameState({
          isActive: true,
          currentAttempt: 1,
          maxAttempts: 3,
          minLinesRequired: shape.min_lines_required,
          drawnLines: [],
          correctLines: [],
          connectedButWrongLines: [],
          wrongLines: []
        });

      } catch (err) {
        console.error('Error loading daily shape:', err);
        setError('Failed to load today\'s challenge');
      } finally {
        setIsLoading(false);
      }
    };

    loadDailyShape();
  }, [setGameState]);

  const handleLineDrawn = (line: ShapeLine) => {
    if (!gameState) return;

    setGameState({
      ...gameState,
      drawnLines: [...gameState.drawnLines, line]
    });
  };

  const handleReset = () => {
    if (!gameState) return;

    setGameState({
      ...gameState,
      drawnLines: []
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-lg"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`relative w-full h-full overflow-hidden rounded-3xl shadow-2xl ${
          theme === 'dark' ? 'glass-morphism-dark' : 'glass-morphism'
        }`}
      >
        <div className="relative h-full">
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <RotateCcw size={20} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setGameMode(false)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </motion.button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/20"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-center">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <>
              <GameHeader />
              <GameCanvas onLineDrawn={handleLineDrawn} />
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};