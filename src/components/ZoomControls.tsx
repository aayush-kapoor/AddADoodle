import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, Search, Hand, Target } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ZoomLevel } from '../types';

const ZOOM_LEVELS: ZoomLevel[] = [
  { value: 0.5, label: '50%' },
  { value: 0.75, label: '75%' },
  { value: 1, label: '100%' },
  { value: 1.5, label: '150%' },
  { value: 2, label: '200%' },
];

export const ZoomControls: React.FC = () => {
  const { theme, zoomLevel, setZoomLevel, tool, setTool, centerOnLastActive, lastActivePosition } = useStore();
  const [isExpanded, setIsExpanded] = useState(true);

  const currentZoomLabel = `${Math.round(zoomLevel * 100)}%`;
  
  const handleZoomIn = () => {
    const currentIndex = ZOOM_LEVELS.findIndex(level => level.value === zoomLevel);
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      setZoomLevel(ZOOM_LEVELS[currentIndex + 1].value);
    }
  };

  const handleZoomOut = () => {
    const currentIndex = ZOOM_LEVELS.findIndex(level => level.value === zoomLevel);
    if (currentIndex > 0) {
      setZoomLevel(ZOOM_LEVELS[currentIndex - 1].value);
    }
  };

  return (
    <motion.div
      className="fixed bottom-4 right-4 z-10 flex items-center gap-2 bg-white/10 backdrop-blur-lg p-2 rounded-full pointer-events-auto"
      initial={{ y: 50 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setTool(tool === 'hand' ? 'line' : 'hand')}
        className={`p-2 rounded-full transition-colors ${
          tool === 'hand' 
            ? theme === 'dark'
              ? 'bg-white/20 shadow-lg shadow-white/10'
              : 'bg-black/20 shadow-lg shadow-black/10'
            : 'hover:bg-white/10'
        }`}
      >
        <Hand size={16} />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={centerOnLastActive}
        disabled={!lastActivePosition}
        className={`p-2 rounded-full transition-colors ${
          !lastActivePosition ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
        }`}
      >
        <Target size={16} />
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <>
            <motion.button
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleZoomOut}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              disabled={zoomLevel === ZOOM_LEVELS[0].value}
            >
              <ZoomOut size={16} className={zoomLevel === ZOOM_LEVELS[0].value ? 'opacity-50' : ''} />
            </motion.button>

            <motion.span
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className={`px-2 py-1 min-w-[60px] text-center text-sm ${
                theme === 'dark' ? 'text-white' : 'text-black'
              }`}
            >
              {currentZoomLabel}
            </motion.span>

            <motion.button
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleZoomIn}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              disabled={zoomLevel === ZOOM_LEVELS[ZOOM_LEVELS.length - 1].value}
            >
              <ZoomIn size={16} className={zoomLevel === ZOOM_LEVELS[ZOOM_LEVELS.length - 1].value ? 'opacity-50' : ''} />
            </motion.button>
          </>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-2 rounded-full hover:bg-white/10 transition-colors"
      >
        <Search size={16} />
      </motion.button>
    </motion.div>
  );
};