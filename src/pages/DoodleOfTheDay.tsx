import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GameCanvas } from '../components/GameCanvas';
import { motion } from 'framer-motion';
import { ArrowLeft, Sun, Moon } from 'lucide-react';
import { useStore } from '../store/useStore';

export const DoodleOfTheDay: React.FC = () => {
  const { theme } = useStore();
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen ${
      theme === 'dark' ? 'bg-black text-white theme-dark' : 'bg-white text-black theme-light'
    }`}>
      {/* Back Button */}
      <motion.div
        className="fixed top-4 left-4 z-10 pointer-events-none"
        initial={{ x: -50 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className={`pointer-events-auto inline-block bg-white/10 backdrop-blur-lg p-4 rounded-full transition-colors ${
            theme === 'dark'
              ? 'hover:bg-white/20'
              : 'hover:bg-black/20'
          }`}
        >
          <ArrowLeft size={20} />
        </motion.button>
      </motion.div>

      {/* Theme Toggle - centered at top */}
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
            onClick={() => useStore.getState().toggleTheme()}
            className="relative p-2 rounded-full hover:bg-white/10 transition-colors group"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </motion.button>
        </motion.div>
      </div>

      <GameCanvas />
    </div>
  );
};