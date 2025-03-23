import React from 'react';
import { motion } from 'framer-motion';
import { Undo2, Redo2 } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const SubmitUndoRedo: React.FC = () => {
  const { theme, submitUndo, submitRedo, submitUndoStack, submitRedoStack } = useStore();

  return (
    <motion.div
      className="fixed bottom-4 left-4 z-10 flex items-center gap-2 bg-white/10 backdrop-blur-lg p-2 rounded-full"
      initial={{ y: 50 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={submitUndo}
        className={`p-2 rounded-full transition-colors ${
          submitUndoStack.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
        }`}
        disabled={submitUndoStack.length === 0}
      >
        <Undo2 size={20} />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={submitRedo}
        className={`p-2 rounded-full transition-colors ${
          submitRedoStack.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
        }`}
        disabled={submitRedoStack.length === 0}
      >
        <Redo2 size={20} />
      </motion.button>
    </motion.div>
  );
};