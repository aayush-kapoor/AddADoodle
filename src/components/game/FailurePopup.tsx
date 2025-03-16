import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Frown } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ShapeImage } from './ShapeImage';
import { ShareButton } from './ShareButton';
import { submitGameResult } from '../../lib/supabase';

interface FailurePopupProps {
  isOpen: boolean;
  onClose: () => void;
  stats: {
    attempts: number;
    linesUsed: number;
  };
}

export const FailurePopup: React.FC<FailurePopupProps> = ({ isOpen, onClose, stats }) => {
  const { theme, gameState } = useStore();

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      const resultSubmitted = sessionStorage.getItem(`result_submitted_${today}`);
      
      if (!resultSubmitted) {
        submitGameResult(false, stats.attempts, stats.linesUsed);
        sessionStorage.setItem(`result_submitted_${today}`, 'true');
      }
    }
  }, [isOpen, stats]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-lg"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`relative w-full max-w-sm rounded-3xl shadow-2xl ${
              theme === 'dark' ? 'glass-morphism-dark' : 'glass-morphism'
            }`}
          >
            <div className="p-4">
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center gap-6 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Frown size={28} className="text-red-500" />
                  <h2 className="text-lg font-semibold tracking-tight">Better Luck Tomorrow!</h2>
                  <p className="text-sm opacity-60">
                    You've used all your attempts for today.
                  </p>
                </div>

                <div className="w-full p-3 rounded-xl bg-white/5">
                  <h3 className="text-sm font-medium mb-2">Today's Stats</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-lg font-bold">{stats.attempts}</span>
                      <span className="text-[10px] opacity-60">Attempts</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-lg font-bold">{stats.linesUsed}</span>
                      <span className="text-[10px] opacity-60">Total Lines Used</span>
                    </div>
                  </div>
                </div>

                {gameState?.imageUrl ? (
                  <ShapeImage
                    imageUrl={gameState.imageUrl}
                    imageAlt={gameState.imageAlt}
                  />
                ) : (
                  <div className="w-full aspect-video rounded-xl bg-white/5 flex items-center justify-center">
                    <p className="text-xs opacity-60">No solution preview available</p>
                  </div>
                )}

                <ShareButton stats={stats} isSuccess={false} />

                <p className="text-xs opacity-60">
                  Come back tomorrow for a new challenge!
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}