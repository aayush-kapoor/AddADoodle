import React from 'react';
import { motion } from 'framer-motion';
import { Pencil, Eraser } from 'lucide-react';
import { useStore } from '../store/useStore';

export const GameToolbar: React.FC = () => {
  const { theme, tool, setTool } = useStore();

  const tools = [
    { id: 'line' as const, icon: <Pencil size={20} /> },
    { id: 'eraser' as const, icon: <Eraser size={20} /> },
  ];

  return (
    <motion.div
      className="fixed bottom-4 right-4 z-10 flex items-center gap-2 bg-white/10 backdrop-blur-lg p-2 rounded-full"
      initial={{ y: 50 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {tools.map(({ id, icon }) => (
        <motion.button
          key={id}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setTool(id)}
          className={`relative p-2 rounded-full transition-all ${
            tool === id 
              ? theme === 'dark'
                ? 'bg-white/20 shadow-lg shadow-white/10'
                : 'bg-black/20 shadow-lg shadow-black/10'
              : 'hover:bg-white/10'
          }`}
        >
          {icon}
        </motion.button>
      ))}
    </motion.div>
  );
};