import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpToLine } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { SubmitDoodlePopup } from './SubmitDoodlePopup';

export const SubmitButton: React.FC = () => {
  const { theme, submitLines } = useStore();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  // Only disable submit button when there are no lines drawn
  const isDisabled = submitLines.length === 0;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 flex justify-center items-center pb-14 z-10 pointer-events-none">
        <motion.div
          className="pointer-events-auto"
          initial={{ y: 50 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsPopupOpen(true)}
            disabled={isDisabled}
            className={`
              flex items-center justify-center
              backdrop-blur-lg
              rounded-full
              shadow-lg
              transition-all
              ${isDisabled
                ? 'opacity-50 cursor-not-allowed bg-emerald-500/30'
                : theme === 'dark'
                  ? 'bg-emerald-500/30 hover:bg-emerald-500/40 shadow-emerald-500/20'
                  : 'bg-emerald-600/30 hover:bg-emerald-600/40 shadow-emerald-600/20'
              }
              ${isMobile ? 'w-12 h-12' : 'px-6 py-3 min-w-[140px]'}
            `}
          >
            {isMobile ? (
              <ArrowUpToLine 
                size={24} 
                className={`${isDisabled ? 'opacity-50' : 'text-emerald-400'}`}
              />
            ) : (
              <span className={`font-medium ${isDisabled ? 'opacity-50' : 'text-emerald-400'}`}>
                Submit Doodle
              </span>
            )}
          </motion.button>
        </motion.div>
      </div>

      <SubmitDoodlePopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
      />
    </>
  );
};