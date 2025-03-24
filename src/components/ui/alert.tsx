import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface AlertProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error';
  message: string;
  duration?: number;
}

export const Alert: React.FC<AlertProps> = ({
  isOpen,
  onClose,
  type,
  message,
  duration = 5000
}) => {
  const { theme } = useStore();

  React.useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-0 right-0 mx-auto z-50 pointer-events-none px-4 flex justify-center"
        >
          <div className={`
            pointer-events-auto
            flex items-center gap-3
            px-4 py-3 rounded-xl
            shadow-lg
            backdrop-blur-lg
            max-w-md w-full
            ${type === 'success'
              ? theme === 'dark'
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-emerald-500/20 text-emerald-700'
              : theme === 'dark'
                ? 'bg-red-500/20 text-red-300'
                : 'bg-red-500/20 text-red-700'
            }
          `}>
            {type === 'success' ? (
              <CheckCircle2 size={20} className="shrink-0" />
            ) : (
              <XCircle size={20} className="shrink-0" />
            )}
            <span className="text-sm sm:text-base font-medium flex-1 text-center">{message}</span>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-full transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};