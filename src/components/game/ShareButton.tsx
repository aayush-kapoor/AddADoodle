import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Check, X } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface ShareButtonProps {
  stats: {
    attempts: number;
    linesUsed: number;
  };
  isSuccess: boolean;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ stats, isSuccess }) => {
  const { theme, gameState } = useStore();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const today = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const resultEmoji = isSuccess ? '✅' : '❌';
    const shareText = `DoodleOfTheDay ${today} ${resultEmoji}\n${stats.attempts} / 5\n${stats.linesUsed} / ${gameState?.totalLinesLimit || 30}\n\naddadoodle.com/doodleoftheday`;

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleShare}
      className={`
        w-full px-4 py-3 rounded-xl
        flex items-center justify-center gap-2
        font-medium transition-colors
        ${theme === 'dark'
          ? 'bg-white/10 hover:bg-white/15'
          : 'bg-black/5 hover:bg-black/10'
        }
      `}
    >
      {copied ? (
        <>
          <Check size={18} className="text-emerald-500" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Share2 size={18} />
          <span>Share Result</span>
        </>
      )}
    </motion.button>
  );
};