import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface HelpButtonProps {
  onClick: () => void;
}

export const HelpButton: React.FC<HelpButtonProps> = ({ onClick }) => {
  const { theme } = useStore();

  return (
    <motion.div
      className="fixed top-4 right-4 z-20 pointer-events-none"
      initial={{ y: -50 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`pointer-events-auto inline-block bg-white/10 backdrop-blur-lg p-4 rounded-full transition-colors ${
          theme === 'dark'
            ? 'hover:bg-white/20'
            : 'hover:bg-black/20'
        }`}
      >
        <HelpCircle size={20} />
      </motion.button>
    </motion.div>
  );
};