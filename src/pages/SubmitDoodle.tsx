import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sun, Moon, RotateCcw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SubmitCanvas } from '../components/submit/SubmitCanvas';
import { SubmitToolbar } from '../components/submit/SubmitToolbar';
import { SubmitUndoRedo } from '../components/submit/SubmitUndoRedo';
import { SubmitButton } from '../components/submit/SubmitButton';

export const SubmitDoodle: React.FC = () => {
  const { theme, toggleTheme, submitLines, clearSubmitLines } = useStore();
  const navigate = useNavigate();

  const handleReset = () => {
    if (submitLines.length === 0) return;
    clearSubmitLines();
  };

  return (
    <div className={`min-h-screen ${
      theme === 'dark' ? 'bg-black text-white theme-dark' : 'bg-white text-black theme-light'
    }`}>
      {/* Back Button */}
      <motion.div
        className="fixed top-4 left-4 z-20 pointer-events-none"
        initial={{ x: -50 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/doodleoftheday')}
          className={`pointer-events-auto inline-block bg-white/10 backdrop-blur-lg p-4 rounded-full transition-colors ${
            theme === 'dark'
              ? 'hover:bg-white/20'
              : 'hover:bg-black/20'
          }`}
        >
          <ArrowLeft size={20} />
        </motion.button>
      </motion.div>

      {/* Context Text */}
      <motion.div
        className="fixed top-0 left-0 w-full flex justify-center items-center px-6 pt-20 z-20 pointer-events-none"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
      >
        <p className={`
          text-center
          text-xs sm:text-sm md:text-base
          font-medium
          max-w-[280px] sm:max-w-none
          leading-relaxed
          ${theme === 'dark' 
            ? 'text-[rgba(255,255,255,0.3)]' 
            : 'text-[rgba(0,0,0,0.3)]'
          }
        `}>
          Submit your doodle for it to be featured as DoodleOfTheDay!
        </p>
      </motion.div>

      {/* Theme Toggle and Reset */}
      <div className="fixed top-0 left-0 w-full flex justify-center items-center pt-4 z-20 pointer-events-none">
        <motion.div 
          className="pointer-events-auto inline-flex items-center gap-2 bg-white/10 backdrop-blur-lg p-2 rounded-full"
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

          <div className="w-px h-4 bg-current opacity-20" />

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className={`relative p-2 rounded-full hover:bg-white/10 transition-colors group ${
              submitLines.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={submitLines.length === 0}
          >
            <RotateCcw size={20} />
          </motion.button>
        </motion.div>
      </div>

      <SubmitCanvas />
      <SubmitToolbar />
      <SubmitUndoRedo />
      <SubmitButton />
    </div>
  );
};