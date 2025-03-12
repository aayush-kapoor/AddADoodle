import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface HelpPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

interface VideoPlayerProps {
  src: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { theme } = useStore();

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="relative rounded-xl bg-white/5 overflow-hidden group">
      <video 
        ref={videoRef}
        className="w-full aspect-video object-cover cursor-pointer"
        autoPlay 
        loop 
        muted 
        playsInline
        onClick={togglePlayPause}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <button
        onClick={togglePlayPause}
        className={`absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors ${
          !isPlaying ? 'bg-black/20' : ''
        }`}
      >
        {!isPlaying && (
          <div className={`p-3 rounded-full ${
            theme === 'dark' ? 'bg-white/20' : 'bg-black/20'
          }`}>
            <Play size={24} className="text-white" />
          </div>
        )}
      </button>
    </div>
  );
};

export const HelpPopup: React.FC<HelpPopupProps> = ({ isOpen, onClose }) => {
  const { theme } = useStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-lg"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl ${
              theme === 'dark' ? 'glass-morphism-dark' : 'glass-morphism'
            }`}
          >
            <div className="p-6 sm:p-8">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="space-y-8">
                <h2 className="text-2xl font-bold tracking-tight">How to play</h2>

                <div className="space-y-8">
                  <div className="space-y-3">
                    <p className="text-base leading-relaxed">
                      The objective of this game is to draw (doodle) the shape of the day on the grid!
                    </p>
                  </div>

                  <div className="space-y-4">
                    <p className="text-base leading-relaxed">
                      As you doodle over the grid and submit an attempt, the lines which were correctly drawn in the same place as the doodle of the day, will be highlighted as green <span className="inline-block w-4 h-4 bg-emerald-500/30 rounded align-text-bottom"></span>. All the other (wrong) lines will be highlighted as red <span className="inline-block w-4 h-4 bg-red-500/30 rounded align-text-bottom"></span>. Use this as a visual indicator to see how you're performing.
                    </p>

                    <VideoPlayer src="/media/correct_wrong_lines.mp4" />
                  </div>

                  <div className="space-y-4">
                    <p className="text-base leading-relaxed">
                      You'll get 5 attempts to doodle the shape of the day. If you run out of attempts before guessing the correct shape, you lose.
                    </p>

                    <VideoPlayer src="/media/attempts.mp4" />
                  </div>

                  <div className="space-y-3">
                    <p className="text-base leading-relaxed">
                      The <span className="px-2 py-1 rounded-md bg-white/10">Lines:</span> section denotes the number of lines you have currently drawn on the grid versus the number of lines the doodle of the day has.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <p className="text-base leading-relaxed">
                      <span className="px-2 py-1 rounded-md bg-white/10">Total lines drawn</span> section keeps a check for how many lines you've used in order to guess the doodle. Your <span className="px-2 py-1 rounded-md bg-white/10">Total lines drawn</span> shouldn't exceed the <span className="px-2 py-1 rounded-md bg-white/10">Max lines you can draw</span>. If you go over the max, you lose.
                    </p>

                    <VideoPlayer src="/media/total_lines.mp4" />
                  </div>

                  <div className="space-y-4">
                    <p className="text-base leading-relaxed">
                      In order to win, you must draw the exact shape of the doodle on the grid, within the limited number of attempts, and the limited amount of total lines allowed to be drawn.
                    </p>

                    <VideoPlayer src="/media/win_condition.mp4" />
                  </div>

                  <div className="pt-4">
                    <p className="text-lg font-semibold text-center">
                        Happy doodling!
                        <br/><br/>
                        <span className="text-sm font-normal">p.s. clideo did not sponsor me</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};