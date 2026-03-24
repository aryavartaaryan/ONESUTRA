'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';

interface Story {
  id: string;
  mantra: string;
  translation: string;
  color: string;
  audioUrl?: string;
  duration: number; // in seconds
}

const stories: Story[] = [
  {
    id: '1',
    mantra: 'भूर्ग्नये स्वाहा',
    translation: 'Om, offering to the Divine',
    color: '#fbbf24',
    duration: 8,
  },
  {
    id: '2', 
    mantra: 'भूर्ग्नये स्वाहा',
    translation: 'Om, surrender to the Supreme',
    color: '#60a5fa',
    duration: 8,
  },
];

export default function MantraStories() {
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (activeStoryIndex === null) {
      setProgress(0);
      return;
    }

    const story = stories[activeStoryIndex];
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Auto-advance to next story
          if (activeStoryIndex < stories.length - 1) {
            setActiveStoryIndex(activeStoryIndex + 1);
            return 0;
          } else {
            // Close stories when reaching the end
            setActiveStoryIndex(null);
            return 0;
          }
        }
        return prev + (100 / (story.duration * 10)); // Update every 100ms
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStoryIndex]);

  const openStory = (index: number) => {
    setActiveStoryIndex(index);
    setProgress(0);
  };

  const closeStories = () => {
    setActiveStoryIndex(null);
    setProgress(0);
  };

  const nextStory = () => {
    if (activeStoryIndex !== null && activeStoryIndex < stories.length - 1) {
      setActiveStoryIndex(activeStoryIndex + 1);
      setProgress(0);
    }
  };

  const prevStory = () => {
    if (activeStoryIndex !== null && activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
      setProgress(0);
    }
  };

  return (
    <>
      {/* Stories Bar */}
      <div style={{
        display: 'flex',
        gap: '12px',
        padding: '16px 20px',
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '16px',
        margin: '20px auto',
        maxWidth: '600px',
        overflowX: 'auto',
      }}>
        {stories.map((story, index) => (
          <motion.div
            key={story.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openStory(index)}
            style={{
              position: 'relative',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${story.color}, ${story.color}dd)`,
              padding: '2px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {/* Story ring */}
            <div style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: '#000',
              padding: '2px',
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${story.color}22, ${story.color}44)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Mantra text */}
                <div style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#fff',
                  textAlign: 'center',
                  lineHeight: 1.2,
                  textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                  padding: '4px',
                }}>
                  {story.mantra.split(' ').map((word, i) => (
                    <div key={i}>{word}</div>
                  ))}
                </div>
                
                {/* Glow effect */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 60%)`,
                }} />
              </div>
            </div>
            
            {/* Seen indicator */}
            <div style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#25D366',
              border: '2px solid #fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Sparkles size={10} fill="#fff" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Story Viewer Modal */}
      <AnimatePresence>
        {activeStoryIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeStories}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.95)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '400px',
                height: '80vh',
                maxHeight: '700px',
                position: 'relative',
              }}
            >
              {/* Progress Bar */}
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                right: '20px',
                display: 'flex',
                gap: '4px',
                zIndex: 10,
              }}>
                {stories.map((_, index) => (
                  <div
                    key={index}
                    style={{
                      flex: 1,
                      height: '3px',
                      background: index === activeStoryIndex 
                        ? '#fff' 
                        : index < activeStoryIndex 
                          ? '#fff' 
                          : 'rgba(255, 255, 255, 0.3)',
                      borderRadius: '2px',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {index === activeStoryIndex && (
                      <motion.div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: '#fff',
                        }}
                        initial={{ width: '0%' }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Story Content */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: `linear-gradient(135deg, ${stories[activeStoryIndex].color}, ${stories[activeStoryIndex].color}dd)`,
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Background pattern */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%), 
                                   radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
                }} />

                {/* Mantra Display */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  style={{
                    textAlign: 'center',
                    color: '#fff',
                    padding: '20px',
                    zIndex: 2,
                  }}
                >
                  <motion.h2
                    style={{
                      fontSize: '2.5rem',
                      fontWeight: 800,
                      marginBottom: '16px',
                      textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                      fontFamily: "'Playfair Display', serif",
                      lineHeight: 1.2,
                    }}
                  >
                    {stories[activeStoryIndex].mantra}
                  </motion.h2>
                  <motion.p
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 400,
                      opacity: 0.9,
                      textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {stories[activeStoryIndex].translation}
                  </motion.p>
                </motion.div>

                {/* Navigation Areas */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '30%',
                    cursor: 'pointer',
                    zIndex: 3,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    prevStory();
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '30%',
                    cursor: 'pointer',
                    zIndex: 3,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    nextStory();
                  }}
                />

                {/* Controls */}
                <div
                  style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    display: 'flex',
                    gap: '12px',
                    zIndex: 10,
                  }}
                >
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMuted(!isMuted);
                    }}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    {isMuted ? (
                      <VolumeX size={18} fill="#fff" />
                    ) : (
                      <Volume2 size={18} fill="#fff" />
                    )}
                  </motion.button>
                </div>

                {/* Close Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeStories}
                  style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    fontSize: '20px',
                    color: '#fff',
                    fontWeight: 'bold',
                  }}
                >
                  ×
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
