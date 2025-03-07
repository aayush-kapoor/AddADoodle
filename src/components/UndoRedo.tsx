import React from 'react';
import { motion } from 'framer-motion';
import { Undo2, Redo2 } from 'lucide-react';
import { useStore } from '../store/useStore';

export const UndoRedo: React.FC = () => {
  const { theme, undo, redo, undoStack, redoStack } = useStore();

  return (
    <motion.div
      className="fixed bottom-4 left-4 z-10 flex items-center gap-2 bg-white/10 backdrop-blur-lg p-2 rounded-full ui-element no-select no-callout"
      initial={{ y: 50 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={undo}
        className={`p-2 rounded-full transition-colors ui-element ${
          undoStack.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
        }`}
        disabled={undoStack.length === 0}
      >
        <Undo2 size={20} />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={redo}
        className={`p-2 rounded-full transition-colors ui-element ${
          redoStack.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
        }`}
        disabled={redoStack.length === 0}
      >
        <Redo2 size={20} />
      </motion.button>
    </motion.div>
  );
};