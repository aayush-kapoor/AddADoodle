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
            className={`pointer-events-auto inline-block bg-gradient-to-r from-white via-pink-300 via-pink-500 to-purple-500 p-4 rounded-full transition-colors relative overflow-hidden ${
              theme === 'dark'
                ? 'hover:brightness-110'
                : 'hover:brightness-90'
            }`}
          >
            <Upload size={20} className="text-black relative z-10" />
            <span 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 50%)',
                animation: 'sparkle 2s infinite'
              }}
            />
            <style>
              {`
                @keyframes sparkle {
                  0% { transform: translate(0, 0); opacity: 0.8; }
                  50% { transform: translate(2px, 2px); opacity: 0.4; }
                  100% { transform: translate(0, 0); opacity: 0.8; }
                }
              `}
            </style>
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