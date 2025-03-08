import React from 'react';
import { motion } from 'framer-motion';
import { PuzzleIcon } from 'lucide-react';
import { useStore } from '../store/useStore';

export const GameButton: React.FC = () => {
  const { theme, setGameMode } = useStore();

  return (
    <motion.div
      className="fixed top-4 right-4 z-10 pointer-events-none"
      initial={{ y: -50 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setGameMode(true)}
        className={`pointer-events-auto inline-block bg-white/10 backdrop-blur-lg p-4 rounded-full transition-colors ${
          theme === 'dark'
            ? 'hover:bg-white/20'
            : 'hover:bg-black/20'
        }`}
      >
        <PuzzleIcon size={20} />
      </motion.button>
    </motion.div>
  );
};