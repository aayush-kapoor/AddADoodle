import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface SuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
  stats: {
    attempts: number;
    linesUsed: number;
    totalLinesLimit: number;
  };
}

export const SuccessPopup: React.FC<SuccessPopupProps> = ({ isOpen, onClose, stats }) => {
  const { theme } = useStore();

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

              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Trophy size={28} className="text-yellow-500" />
                  <h2 className="text-lg font-semibold tracking-tight">Congratulations!</h2>
                  <p className="text-sm opacity-60">
                    You've successfully completed today's challenge!
                  </p>
                </div>

                <div className="w-full p-3 rounded-xl bg-white/5">
                  <h3 className="text-sm font-medium mb-2">Your Stats</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-lg font-bold">{stats.attempts}</span>
                      <span className="text-[10px] opacity-60">Attempts</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-lg font-bold">{stats.linesUsed}</span>
                      <span className="text-[10px] opacity-60">Lines Used</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-lg font-bold">{stats.totalLinesLimit}</span>
                      <span className="text-[10px] opacity-60">Max Lines</span>
                    </div>
                  </div>
                </div>

                <div className="w-full p-3 rounded-xl bg-white/5">
                  <h3 className="text-sm font-medium mb-2">Efficiency</h3>
                  <div className="flex flex-col gap-1">
                    <span className="text-lg font-bold">
                      {Math.round((stats.linesUsed / stats.totalLinesLimit) * 100)}%
                    </span>
                    <span className="text-[10px] opacity-60">Lines Used vs Max</span>
                  </div>
                </div>

                <p className="text-xs opacity-60 mt-2">
                  Come back tomorrow for a new challenge!
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};