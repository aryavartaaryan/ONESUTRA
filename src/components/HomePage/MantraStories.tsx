'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, ChevronLeft, ChevronRight, Sparkles, Check, Zap, Lightbulb, AlertCircle } from 'lucide-react';

// ── Time-based Unsplash image collections ───────────────────────────────────
const UNSPLASH_COLLECTIONS = {
  morning: [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&h=1200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&h=1200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507041957456-9c397ce39c7f?w=800&h=1200&fit=crop&q=80',
  ],
  day: [
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=1200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=1200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=1200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&h=1200&fit=crop&q=80',
  ],
  evening: [
    'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&h=1200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=800&h=1200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1419833173245-f59e1b93f9ee?w=800&h=1200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1472120435266-53107fd0c44a?w=800&h=1200&fit=crop&q=80',
  ],
  night: [
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=1200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=800&h=1200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&h=1200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1532978379173-523e16f371f2?w=800&h=1200&fit=crop&q=80',
  ],
};

interface Story {
  id: string;
  label: string;
  type: 'task' | 'idea' | 'challenge' | 'issue';
  number: number;
  color: string;
  bgGradient: string;
  imageUrl: string;
  duration: number;
  icon: React.ReactNode;
  description: string;
}

function getTimeOfDay(): 'morning' | 'day' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'day';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function getRandomImage(timeOfDay: 'morning' | 'day' | 'evening' | 'night'): string {
  const images = UNSPLASH_COLLECTIONS[timeOfDay];
  const dayOfMonth = new Date().getDate();
  return images[dayOfMonth % images.length];
}

export default function MantraStories() {
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay());

  // Update time of day every hour
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOfDay(getTimeOfDay());
    }, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Generate stories based on time of day
  const stories: Story[] = useMemo(() => {
    const baseImage = getRandomImage(timeOfDay);
    return [
      {
        id: '1',
        label: 'TASKS',
        type: 'task',
        number: 1,
        color: '#4ade80',
        bgGradient: 'linear-gradient(135deg, rgba(74, 222, 128, 0.9), rgba(34, 197, 94, 0.95))',
        imageUrl: baseImage,
        duration: 8,
        icon: <Check size={24} />,
        description: 'Your daily tasks await',
      },
      {
        id: '2',
        label: 'CHALLENGES',
        type: 'challenge',
        number: 2,
        color: '#fb923c',
        bgGradient: 'linear-gradient(135deg, rgba(251, 146, 60, 0.9), rgba(234, 88, 12, 0.95))',
        imageUrl: getRandomImage(timeOfDay),
        duration: 8,
        icon: <Zap size={24} />,
        description: 'Face your challenges',
      },
      {
        id: '3',
        label: 'IDEAS',
        type: 'idea',
        number: 3,
        color: '#fbbf24',
        bgGradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.9), rgba(217, 119, 6, 0.95))',
        imageUrl: getRandomImage(timeOfDay),
        duration: 8,
        icon: <Lightbulb size={24} />,
        description: 'Spark your creativity',
      },
      {
        id: '4',
        label: 'ISSUES',
        type: 'issue',
        number: 4,
        color: '#f87171',
        bgGradient: 'linear-gradient(135deg, rgba(248, 113, 113, 0.9), rgba(220, 38, 38, 0.95))',
        imageUrl: getRandomImage(timeOfDay),
        duration: 8,
        icon: <AlertCircle size={24} />,
        description: 'Resolve what blocks you',
      },
    ];
  }, [timeOfDay]);

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
      {/* ═══════════════════════════════════════════════════
          PREMIUM NATURE STORY BUBBLES  — OneSUTRA USP
      ═══════════════════════════════════════════════════ */}
      <style>{`
        @keyframes storyFloat0{0%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}80%{transform:translateY(-3px)}}
        @keyframes storyFloat1{0%,100%{transform:translateY(0)}30%{transform:translateY(-8px)}70%{transform:translateY(-4px)}}
        @keyframes storyFloat2{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}85%{transform:translateY(-7px)}}
        @keyframes storyFloat3{0%,100%{transform:translateY(0)}45%{transform:translateY(-7px)}75%{transform:translateY(-3px)}}
        @keyframes storyShimmer{0%,100%{opacity:0;transform:translateX(-100%) rotate(-15deg)}45%,55%{opacity:0.55}50%{transform:translateX(220%) rotate(-15deg)}}
        @keyframes storyRing{0%,100%{opacity:0.7;transform:scale(1)}50%{opacity:1;transform:scale(1.02)}}
        @keyframes storyGlare{0%,100%{opacity:0.6}50%{opacity:0.9}}
      `}</style>
      <div style={{
        display: 'flex',
        gap: '14px',
        padding: '16px 20px 20px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
        justifyContent: 'center',
      }}>
        {stories.map((story, index) => (
          <motion.div
            key={story.id}
            initial={{ opacity: 0, scale: 0.75, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 280, damping: 22 }}
            whileHover={{ scale: 1.07, y: -8, transition: { duration: 0.25 } }}
            whileTap={{ scale: 0.96 }}
            onClick={() => openStory(index)}
            style={{
              position: 'relative',
              width: '120px',
              height: '170px',
              borderRadius: '24px',
              overflow: 'hidden',
              cursor: 'pointer',
              flexShrink: 0,
              animation: `storyFloat${index} ${3.8 + index * 0.5}s ease-in-out infinite`,
            }}
          >
            {/* ── Full natural background image ── */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${story.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }} />

            {/* ── Deep gradient overlay for premium look ── */}
            <div style={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(
                180deg,
                rgba(0,0,0,0.15) 0%,
                rgba(0,0,0,0.05) 30%,
                rgba(0,0,0,0.12) 55%,
                ${story.bgGradient.replace('linear-gradient(135deg, ', '').split(',')[0].replace('0.9)', '0.75)')} 75%,
                ${story.bgGradient.replace('linear-gradient(135deg, ', '').split(',')[0].replace('0.9)', '0.92)')} 100%
              )`,
            }} />

            {/* ── Prismatic shimmer ── */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.35) 48%, rgba(255,255,255,0.1) 55%, transparent 75%)',
              animation: `storyShimmer ${5 + index * 0.8}s ease-in-out infinite`,
              pointerEvents: 'none',
            }} />

            {/* ── Top glass glare strip ── */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: '32%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.08) 60%, transparent 100%)',
              borderRadius: '24px 24px 50% 50%',
              pointerEvents: 'none',
              animation: `storyGlare ${2.8 + index * 0.4}s ease-in-out infinite`,
            }} />

            {/* ── Glowing colored ring (outer glow effect) ── */}
            <div style={{
              position: 'absolute', inset: 0,
              borderRadius: '24px',
              boxShadow: `inset 0 0 0 2px rgba(255,255,255,0.55), 0 0 0 3px ${story.color}70, 0 12px 40px ${story.color}60, 0 4px 16px rgba(0,0,0,0.5)`,
              animation: `storyRing ${2.5 + index * 0.35}s ease-in-out infinite`,
              pointerEvents: 'none',
            }} />

            {/* ── Content ── */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 10px 12px',
            }}>
              {/* Top icon in frosted holoball */}
              <div style={{
                width: '42px', height: '42px',
                borderRadius: '50%',
                background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55) 0%, ${story.color}60 55%, rgba(0,0,0,0.1) 100%)`,
                backdropFilter: 'blur(12px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 16px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.6), 0 0 16px ${story.color}70`,
                border: '1.5px solid rgba(255,255,255,0.5)',
              }}>
                {React.cloneElement(story.icon as React.ReactElement, { size: 20, color: '#fff' })}
              </div>

              {/* Bottom: label + description */}
              <div style={{ textAlign: 'center', width: '100%' }}>
                {/* Frosted glass text backdrop */}
                <div style={{
                  background: 'rgba(0,0,0,0.28)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  borderRadius: '14px',
                  padding: '6px 8px',
                  border: '1px solid rgba(255,255,255,0.20)',
                }}>
                  <div style={{
                    fontSize: '0.65rem', fontWeight: 800,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    color: '#fff',
                    fontFamily: "'Inter', system-ui, sans-serif",
                    textShadow: `0 0 12px ${story.color}, 0 1px 4px rgba(0,0,0,0.8)`,
                    lineHeight: 1.2,
                    marginBottom: '3px',
                  }}>{story.label}</div>
                  <div style={{
                    fontSize: '0.45rem', fontWeight: 500,
                    color: 'rgba(255,255,255,0.82)',
                    fontFamily: "'Inter', system-ui, sans-serif",
                    textShadow: '0 1px 4px rgba(0,0,0,0.7)',
                    lineHeight: 1.3,
                    letterSpacing: '0.02em',
                  }}>{story.description}</div>
                </div>
              </div>
            </div>

            {/* ── Sparkle indicator at top-right ── */}
            <div style={{
              position: 'absolute', top: '10px', right: '10px',
              width: '22px', height: '22px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.20)',
              backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 2px 8px rgba(0,0,0,0.3), 0 0 8px ${story.color}60`,
              border: '1px solid rgba(255,255,255,0.35)',
            }}>
              <Sparkles size={11} color={story.color} fill={story.color} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Story Viewer Modal - Full screen Instagram style */}

      <AnimatePresence>
        {
          activeStoryIndex !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeStories}
              style={{
                position: 'fixed',
                inset: 0,
                background: '#000',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  maxWidth: '480px',
                  height: '100vh',
                  maxHeight: '850px',
                  position: 'relative',
                  background: '#000',
                }}
              >
                {/* Full background image */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url(${stories[activeStoryIndex].imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }} />

                {/* Dark gradient overlay from top */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '200px',
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
                  zIndex: 5,
                }} />

                {/* Progress Bars */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  right: '12px',
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
                        background: 'rgba(255,255,255,0.3)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}
                    >
                      {index === activeStoryIndex && (
                        <motion.div
                          style={{
                            height: '100%',
                            background: '#fff',
                          }}
                          initial={{ width: '0%' }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.1 }}
                        />
                      )}
                      {index < activeStoryIndex && (
                        <div style={{ width: '100%', height: '100%', background: '#fff' }} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Header with story info */}
                <div style={{
                  position: 'absolute',
                  top: '28px',
                  left: '16px',
                  right: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  zIndex: 10,
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}>
                    {/* Avatar circle with icon */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: stories[activeStoryIndex].bgGradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #fff',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
                    }}>
                      {React.cloneElement(stories[activeStoryIndex].icon as React.ReactElement, {
                        size: 18,
                        color: '#fff'
                      })}
                    </div>
                    <div>
                      <div style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: '#fff',
                        textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                        fontFamily: "'Inter', system-ui, sans-serif",
                      }}>
                        {stories[activeStoryIndex].label}
                      </div>
                      <div style={{
                        fontSize: '0.7rem',
                        color: 'rgba(255,255,255,0.8)',
                        textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                      }}>
                        {stories[activeStoryIndex].description}
                      </div>
                    </div>
                  </div>

                  {/* Close button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={closeStories}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.4)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#fff',
                      fontSize: '20px',
                    }}
                  >
                    ×
                  </motion.button>
                </div>

                {/* Center Content */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    zIndex: 5,
                    padding: '24px',
                  }}
                >
                  {/* Large Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      background: stories[activeStoryIndex].bgGradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px',
                      border: '4px solid rgba(255,255,255,0.3)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    }}
                  >
                    {React.cloneElement(stories[activeStoryIndex].icon as React.ReactElement, {
                      size: 48,
                      color: '#fff'
                    })}
                  </motion.div>

                  <h2 style={{
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    color: '#fff',
                    textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    fontFamily: "'Inter', system-ui, sans-serif",
                    marginBottom: '12px',
                    letterSpacing: '0.05em',
                  }}>
                    {stories[activeStoryIndex].label}
                  </h2>
                  <p style={{
                    fontSize: '1.1rem',
                    color: 'rgba(255,255,255,0.9)',
                    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                    fontFamily: "'Inter', system-ui, sans-serif",
                  }}>
                    {stories[activeStoryIndex].description}
                  </p>
                </motion.div>

                {/* Bottom gradient */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '150px',
                  background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
                  zIndex: 5,
                }} />

                {/* Navigation arrows */}
                {activeStoryIndex > 0 && (
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      prevStory();
                    }}
                    style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.4)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 10,
                    }}
                  >
                    <ChevronLeft size={24} color="#fff" />
                  </motion.button>
                )}
                {activeStoryIndex < stories.length - 1 && (
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      nextStory();
                    }}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.4)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 10,
                    }}
                  >
                    <ChevronRight size={24} color="#fff" />
                  </motion.button>
                )}

                {/* Bottom action bar */}
                <div style={{
                  position: 'absolute',
                  bottom: '24px',
                  left: '16px',
                  right: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  zIndex: 10,
                }}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      flex: 1,
                      padding: '14px 24px',
                      borderRadius: '30px',
                      background: stories[activeStoryIndex].bgGradient,
                      border: '1px solid rgba(255,255,255,0.3)',
                      color: '#fff',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                      fontFamily: "'Inter', system-ui, sans-serif",
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    }}
                  >
                    View {stories[activeStoryIndex].label}
                  </motion.button>

                  {/* Mute button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMuted(!isMuted);
                    }}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.4)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      marginLeft: '12px',
                    }}
                  >
                    {isMuted ? (
                      <VolumeX size={20} color="#fff" />
                    ) : (
                      <Volume2 size={20} color="#fff" />
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )
        }
      </AnimatePresence >
    </>
  );
}
