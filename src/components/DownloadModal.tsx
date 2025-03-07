import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Image } from 'lucide-react';
import { useStore } from '../store/useStore';
import html2canvas from 'html2canvas';
import { PreviewCanvas } from './PreviewCanvas';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose }) => {
  const { theme, selectedLines, lines, setModalOpen } = useStore();
  const [showGrid, setShowGrid] = useState(false);
  const [fileName, setFileName] = useState('doodle');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setModalOpen(true);
      setFileName(selectedLines.length > 1 ? 'doodles' : 'doodle');
      const savedShowGrid = localStorage.getItem('preferredShowGrid');
      if (savedShowGrid) {
        setShowGrid(savedShowGrid === 'true');
      }
    }
    return () => setModalOpen(false);
  }, [isOpen, selectedLines.length, setModalOpen]);

  const handleClose = () => {
    setModalOpen(false);
    setError(null);
    onClose();
  };

  const handleDownload = async () => {
    if (!previewRef.current) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Wait for any animations to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(previewRef.current, {
        scale: window.devicePixelRatio,
        useCORS: true,
        backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
        logging: false,
        removeContainer: true,
        allowTaint: true
      });

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas to Blob conversion failed'));
            }
          },
          'image/png',
          1.0
        );
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      localStorage.setItem('preferredShowGrid', String(showGrid));
      handleClose();
    } catch (err) {
      console.error('Error generating image:', err);
      setError('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedDoodles = lines.filter(line => selectedLines.includes(line.id));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-lg"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
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
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>

              <h2 className="text-2xl font-semibold mb-6 tracking-tight">Download Doodle</h2>

              <div className="space-y-6">
                <div
                  ref={previewRef}
                  className="w-full aspect-video rounded-2xl overflow-hidden shadow-lg bg-transparent"
                >
                  <PreviewCanvas
                    showGrid={showGrid}
                    selectedLines={selectedDoodles}
                    theme={theme}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg transition-colors">
                    <span className="text-sm font-medium opacity-90">Show grid in export</span>
                    <div
                      className="toggle-switch"
                      data-checked={showGrid}
                      onClick={() => setShowGrid(!showGrid)}
                    />
                  </div>

                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                    theme === 'dark'
                      ? 'bg-white/10'
                      : 'bg-black/5'
                  } transition-colors`}>
                    <Image size={16} className="opacity-70" />
                    <input
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder="File name"
                      className={`flex-1 bg-transparent text-sm font-medium outline-none placeholder-opacity-50 rounded-lg ${
                        theme === 'dark'
                          ? 'text-white caret-white'
                          : 'text-black caret-black'
                      }`}
                    />
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-white/50' : 'text-black/50'
                    }`}>.png</span>
                  </div>

                  {error && (
                    <div className="px-4 py-3 rounded-xl bg-red-500/10 text-red-500 text-sm">
                      {error}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDownload}
                    disabled={isGenerating}
                    className={`px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors ${
                      isGenerating
                        ? 'opacity-50 cursor-not-allowed'
                        : theme === 'dark'
                        ? 'bg-white/10 hover:bg-white/15'
                        : 'bg-black/5 hover:bg-black/10'
                    }`}
                  >
                    <Download size={18} className={isGenerating ? 'animate-pulse' : ''} />
                    {isGenerating ? 'Generating...' : 'Download'}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};