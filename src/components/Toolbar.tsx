import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MousePointer2, 
  Pencil, 
  Eraser, 
  Sun, 
  Moon,
  Minus,
  Plus,
  Download
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { Tool } from '../types';
import { DownloadModal } from './DownloadModal';

export const Toolbar: React.FC = () => {
  const { 
    tool, 
    theme, 
    lineThickness, 
    setTool, 
    toggleTheme, 
    setLineThickness,
    selectedLines,
    lines,
    updateLineThickness,
    deleteSelectedLines
  } = useStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  const handleToolClick = (toolId: Tool) => {
    if (toolId === 'eraser' && selectedLines.length > 0) {
      deleteSelectedLines();
    }
    setTool(toolId);
    // On mobile, show thickness controls when selecting line or select tool
    if ((toolId === 'line' || toolId === 'select') && window.matchMedia('(pointer: coarse)').matches) {
      setIsExpanded(true);
    }
  };

  const tools: { id: Tool; icon: React.ReactNode; tooltip: string }[] = [
    { id: 'select', icon: <MousePointer2 size={20} />, tooltip: 'Select' },
    { id: 'line', icon: <Pencil size={20} />, tooltip: 'Draw' },
    { id: 'eraser', icon: <Eraser size={20} />, tooltip: selectedLines.length > 0 ? 'Delete Selected' : 'Erase' },
  ];

  const showThicknessControls = (tool === 'line' || (tool === 'select' && selectedLines.length > 0)) && isExpanded;
  
  const selectedLinesThickness = selectedLines.length > 0
    ? lines
        .filter(line => selectedLines.includes(line.id))
        .map(line => line.thickness)
    : [];
  
  const hasUniformThickness = selectedLinesThickness.length > 0 && 
    selectedLinesThickness.every(t => t === selectedLinesThickness[0]);
  
  const displayThickness = tool === 'line' ? lineThickness : (hasUniformThickness ? selectedLinesThickness[0] : '');

  const handleThicknessChange = (increase: boolean) => {
    const newThickness = increase 
      ? Math.min(displayThickness + 1, 10)
      : Math.max(displayThickness - 1, 1);

    if (tool === 'line') {
      setLineThickness(newThickness);
    } else if (selectedLines.length > 0) {
      updateLineThickness(selectedLines, newThickness);
    }
  };

  return (
    <>
      {/* Theme toggle - centered at top */}
      <div className="fixed top-0 left-0 w-full flex justify-center items-center pt-4 z-10 pointer-events-none">
        <motion.div 
          className="pointer-events-auto inline-block bg-white/10 backdrop-blur-lg p-2 rounded-full"
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
        </motion.div>
      </div>

      {/* Tools - always at left center */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
        <motion.div
          className="pointer-events-auto inline-block bg-white/10 backdrop-blur-lg p-2 rounded-full relative"
          initial={{ x: -50 }}
          animate={{ x: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onMouseEnter={() => setIsExpanded(true)}
          onMouseLeave={() => setIsExpanded(false)}
          onClick={() => {
            // Toggle expansion on touch devices
            if (window.matchMedia('(pointer: coarse)').matches) {
              setIsExpanded(!isExpanded);
            }
          }}
        >
          <div className="flex flex-col gap-2">
            {tools.map(({ id, icon, tooltip }) => (
              <motion.button
                key={id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering the parent's onClick
                  handleToolClick(id);
                }}
                className={`relative p-2 rounded-full transition-all group ${
                  tool === id 
                    ? theme === 'dark'
                      ? 'bg-white/20 shadow-lg shadow-white/10'
                      : 'bg-black/20 shadow-lg shadow-black/10'
                    : 'hover:bg-white/10'
                }`}
              >
                {icon}
                <span className={`pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 px-2 py-1 text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity delay-1000 whitespace-nowrap ${
                  theme === 'dark' ? 'bg-white/10 text-white' : 'bg-black/10 text-black'
                }`}>
                  {tooltip}
                </span>
              </motion.button>
            ))}

            {selectedLines.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDownloadOpen(true);
                }}
                className="relative p-2 rounded-full hover:bg-white/10 transition-all group"
              >
                <Download size={20} />
                <span className={`pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 px-2 py-1 text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity delay-1000 whitespace-nowrap ${
                  theme === 'dark' ? 'bg-white/10 text-white' : 'bg-black/10 text-black'
                }`}>
                  Download
                </span>
              </motion.button>
            )}
          </div>

          <AnimatePresence>
            {showThicknessControls && (
              <motion.div 
                className="absolute left-0 top-full mt-2 flex flex-col items-center gap-2 bg-white/10 backdrop-blur-lg p-2 rounded-full"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()} // Prevent closing when interacting with controls
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleThicknessChange(true)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <Plus size={16} />
                </motion.button>
                <div className="h-6 flex items-center justify-center">
                  <span className="text-sm min-w-[1ch] text-center">
                    {displayThickness}
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleThicknessChange(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <Minus size={16} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
      />
    </>
  );
};