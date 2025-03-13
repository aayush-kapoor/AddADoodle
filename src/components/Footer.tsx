import React from 'react';
import { motion } from 'framer-motion';
import { Instagram, Twitter } from 'lucide-react';
import { useStore } from '../store/useStore';

export const Footer: React.FC = () => {
  const { theme } = useStore();
  
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={`
        fixed bottom-0 left-0 right-0 z-10
        h-10 py-2 px-4 md:px-6
        backdrop-blur-lg
        ${theme === 'dark' ? 'bg-black/30' : 'bg-white/30'}
        border-t ${theme === 'dark' ? 'border-white/10' : 'border-black/10'}
        text-[#666666]
      `}
    >
      <div className="max-w-screen-xl mx-auto flex items-center justify-center gap-2 h-full text-xs sm:text-sm">
        <span>thank you for playing! follow me on</span>
        
        <div className="flex items-center gap-2">
          <motion.a
            href="https://x.com/aayushkapoor_"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-1 rounded-full transition-colors hover:text-current"
          >
            <Twitter size={16} />
          </motion.a>
          
          <motion.a
            href="https://www.instagram.com/aayushkapoor_/"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-1 rounded-full transition-colors hover:text-current"
          >
            <Instagram size={16} />
          </motion.a>
        </div>
      </div>
    </motion.footer>
  );
};