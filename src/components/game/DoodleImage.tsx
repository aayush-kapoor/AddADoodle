import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageOff } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface ShapeImageProps {
  imageUrl: string;
  imageAlt?: string;
}

export const ShapeImage: React.FC<ShapeImageProps> = ({ imageUrl, imageAlt }) => {
  const { theme } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`
          relative w-full aspect-video rounded-xl overflow-hidden
          ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'}
        `}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current opacity-50" />
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <ImageOff size={24} className="opacity-50" />
            <p className="text-xs opacity-50">Failed to load image</p>
          </div>
        )}

        {/* Image */}
        <img
          src={imageUrl}
          alt={imageAlt || 'Shape reference image'}
          className={`
            w-full h-full object-contain
            transition-opacity duration-300
            ${isLoading || hasError ? 'opacity-0' : 'opacity-100'}
          `}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      </motion.div>
    </AnimatePresence>
  );
};