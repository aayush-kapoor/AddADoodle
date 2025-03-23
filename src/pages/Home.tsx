import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '../components/Canvas';
import { Toolbar } from '../components/Toolbar';
import { ZoomControls } from '../components/ZoomControls';
import { UndoRedo } from '../components/UndoRedo';
import { motion } from 'framer-motion';
import { Gamepad2, Upload } from 'lucide-react';
import { useStore } from '../store/useStore';

export const Home: React.FC = () => {
  const { theme } = useStore();
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen ${
      theme === 'dark' ? 'bg-black text-white theme-dark' : 'bg-white text-black theme-light'
    }`}>
      <Canvas />
      <Toolbar />
      <ZoomControls />
      <UndoRedo />
      
      {/* Top Navigation Buttons */}
      <div className="fixed top-4 right-4 z-10 flex items-center gap-2 pointer-events-none">
        {/* Submit Button */}
        <motion.div
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/submitdoodle')}
            className={`pointer-events-auto inline-block bg-white/10 backdrop-blur-lg p-4 rounded-full transition-colors ${
              theme === 'dark'
                ? 'hover:bg-white/20'
                : 'hover:bg-black/20'
            }`}
          >
            <Upload size={20} />
          </motion.button>
        </motion.div>

        {/* Game Button */}
        <motion.div
          initial={{ y: -50 }}
          animate={{ y: 0 }}
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
            <Gamepad2 size={20} />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};