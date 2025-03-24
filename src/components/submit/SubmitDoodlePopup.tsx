import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Instagram, Twitter } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { SubmitPreviewCanvas } from './SubmitPreviewCanvas';
import html2canvas from 'html2canvas';
import { supabase } from '../../lib/supabase';
import { Alert } from '../ui/Alert';

interface SubmitDoodlePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

type SocialPlatform = 'twitter' | 'instagram';

export const SubmitDoodlePopup: React.FC<SubmitDoodlePopupProps> = ({ isOpen, onClose }) => {
  const { theme, submitLines, setModalOpen } = useStore();
  const [socialHandle, setSocialHandle] = useState('');
  const [platform, setPlatform] = useState<SocialPlatform>('twitter');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async () => {
    if (!socialHandle.trim()) {
      setError('Please enter your social media handle');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Generate line keys for submission
      const lineKeys = submitLines.flatMap(line => 
        line.points.slice(0, -1).map((start, i) => {
          const end = line.points[i + 1];
          return `${start.x},${start.y}-${end.x},${end.y}`;
        })
      );
    //   console.log('Generated line keys:', lineKeys);

      // Generate preview image
    //   console.log('Attempting to generate preview image...');
      if (!previewRef.current) throw new Error('Preview ref not found');
      
      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
        scale: 2
      });
    //   console.log('Preview image generated successfully');

      // Convert canvas to blob
    //   console.log('Converting canvas to blob...');
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/png');
      });
    //   console.log('Blob created successfully:', blob);

      // Generate unique filename
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
    //   console.log('Uploading to storage:', { fileName });

      // Upload to storage bucket
      const { data: storageData, error: storageError } = await supabase.storage
        .from('doodle-submissions')
        .upload(fileName, blob, {
          contentType: 'image/png',
          cacheControl: '3600'
        });

      if (storageError) {
        // console.error('Storage upload error:', storageError);
        throw storageError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('doodle-submissions')
        .getPublicUrl(fileName);

      // Submit to database
    //   console.log('Submitting to database:', {
    //     socialHandle: `${platform === 'twitter' ? '@' : ''}${socialHandle}`,
    //     lineKeysCount: lineKeys.length,
    //     imageUrl: publicUrl
    //   });
      
      const { error: submitError } = await supabase
        .from('doodle_submissions')
        .insert({
          social_handle: `${platform === 'twitter' ? '@' : ''}${socialHandle}`,
          line_keys: lineKeys,
          image_url: publicUrl,
          ip_hash: 'anonymous',
          browser_id: 'anonymous'
        });

      if (submitError) {
        // console.error('Database submission error:', submitError);
        throw submitError;
      }

    //   console.log('Submission successful!');
      setShowSuccess(true);
      onClose();
    } catch (err) {
    //   console.error('Submission error:', err);
      setError('Failed to submit doodle. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <Alert
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        type="success"
        message="Your doodle has been submitted successfully! We'll reach out if it's selected."
      />
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
            className={`relative w-full max-w-sm rounded-3xl shadow-2xl ${
              theme === 'dark' ? 'glass-morphism-dark' : 'glass-morphism'
            }`}
          >
            <div className="p-6">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>

              <h2 className="text-2xl font-semibold mb-4 tracking-tight">Submit Doodle</h2>

              <div className="space-y-4">
                <div
                  ref={previewRef}
                  className="w-48 h-48 mx-auto rounded-xl overflow-hidden shadow-lg bg-transparent"
                >
                  <SubmitPreviewCanvas
                    selectedLines={submitLines}
                    theme={theme}
                  />
                </div>

                <p className={`text-sm text-center leading-relaxed ${
                  theme === 'dark' ? 'text-white/60' : 'text-black/60'
                }`}>
                  We use your social media handle to give you a shoutout when your doodle is featured!
                </p>


                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPlatform('twitter')}
                      className={`flex-1 p-3 rounded-xl flex items-center justify-center gap-2 transition-colors ${
                        platform === 'twitter'
                          ? theme === 'dark'
                            ? 'bg-white/20'
                            : 'bg-black/20'
                          : theme === 'dark'
                            ? 'bg-white/10 hover:bg-white/15'
                            : 'bg-black/10 hover:bg-black/15'
                      }`}
                    >
                      <Twitter size={18} />
                      <span className="text-sm font-medium">Twitter</span>
                    </button>

                    <button
                      onClick={() => setPlatform('instagram')}
                      className={`flex-1 p-3 rounded-xl flex items-center justify-center gap-2 transition-colors ${
                        platform === 'instagram'
                          ? theme === 'dark'
                            ? 'bg-white/20'
                            : 'bg-black/20'
                          : theme === 'dark'
                            ? 'bg-white/10 hover:bg-white/15'
                            : 'bg-black/10 hover:bg-black/15'
                      }`}
                    >
                      <Instagram size={18} />
                      <span className="text-sm font-medium">Instagram</span>
                    </button>
                  </div>

                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                    theme === 'dark'
                      ? 'bg-white/10'
                      : 'bg-black/5'
                  }`}>
                    {platform === 'twitter' ? <Twitter size={16} /> : <Instagram size={16} />}
                    <input
                      type="text"
                      value={socialHandle}
                      onChange={(e) => setSocialHandle(e.target.value.trim())}
                      placeholder={`Enter your ${platform} handle`}
                      className={`flex-1 bg-transparent text-sm font-medium outline-none placeholder-opacity-50 ${
                        theme === 'dark'
                          ? 'text-white placeholder-white'
                          : 'text-black placeholder-black'
                      }`}
                    />
                  </div>
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/10 text-red-500 text-sm">
                    {error}
                  </div>
                )}
                
{/*                 
                <p className={`text-sm text-center leading-relaxed ${
                  theme === 'dark' ? 'text-white/60' : 'text-black/60'
                }`}>
                  We will reach out to you first to let you know if your doodle was selected!
                </p> */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={isSubmitting || !socialHandle.trim()}
                  className={`w-full px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors ${
                    isSubmitting || !socialHandle.trim()
                      ? 'opacity-50 cursor-not-allowed bg-emerald-500/30'
                      : theme === 'dark'
                        ? 'bg-emerald-500/30 hover:bg-emerald-500/40'
                        : 'bg-emerald-600/30 hover:bg-emerald-600/40'
                  }`}
                >
                  <span className="text-emerald-400">
                    {isSubmitting ? 'Submitting...' : 'Submit Doodle'}
                  </span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};