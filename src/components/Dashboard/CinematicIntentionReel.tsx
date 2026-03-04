'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCircadianBackground } from '@/hooks/useCircadianBackground';

export interface Sankalp { id: string; text: string; done: boolean; }

interface CinematicIntentionReelProps {
    items: Sankalp[];
    onToggle: (id: string) => void;
    onExpand?: () => void;
    isFullScreen?: boolean;
}

export default function CinematicIntentionReel({
    items,
    onToggle,
    onExpand,
    isFullScreen = false,
}: CinematicIntentionReelProps) {
    const [localItems, setLocalItems] = useState(items);
    const [isComplete, setIsComplete] = useState(false);
    const { phase, imageUrl, loaded } = useCircadianBackground();

    // Keep local copy synced
    useEffect(() => { setLocalItems(items); }, [items]);

    // Find the next pending intention
    const pending = localItems.filter(s => !s.done);
    const currentTask = pending[0] ?? null;
    const completedCount = localItems.length - pending.length;

    const handleTap = () => {
        if (!currentTask) return;

        // Haptic pulse
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(55);

        // Immediately mark done on parent
        onToggle(currentTask.id);

        // Update local state for instant animation
        const updated = localItems.map(s => s.id === currentTask.id ? { ...s, done: true } : s);
        setLocalItems(updated);

        // If no more pending, show completion state
        if (pending.length <= 1) {
            setTimeout(() => setIsComplete(true), 700);
        }
    };

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                height: isFullScreen ? '100dvh' : 'calc(100dvh - 5rem)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                userSelect: 'none',
            }}
            onClick={!isFullScreen ? onExpand : handleTap}
        >
            {/* ── Circadian nature background ── */}
            <div suppressHydrationWarning style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                opacity: loaded ? 1 : 0,
                transition: 'opacity 1.5s ease',
            }} />
            {/* Cinematic dark scrim — heavier than normal */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.72) 100%)',
            }} />

            {/* ── MICRO-HEADER ─────────────────────────────── */}
            <div style={{
                position: 'absolute', top: '5rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem',
                zIndex: 10, opacity: 0.75,
            }}>
                <motion.span
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.7 }}
                    style={{
                        fontSize: '0.6rem', fontWeight: 700,
                        letterSpacing: '0.28em', textTransform: 'uppercase',
                        color: 'rgba(255,212,128,0.85)',
                    }}
                >
                    Current Alignment
                </motion.span>
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    suppressHydrationWarning
                    style={{
                        fontSize: '0.62rem', color: 'rgba(255,255,255,0.38)',
                        fontVariantNumeric: 'tabular-nums', letterSpacing: '0.1em',
                    }}
                >
                    {!isComplete
                        ? `${completedCount} / ${localItems.length} intentions aligned`
                        : '✓ Complete'
                    }
                </motion.span>
            </div>

            {/* ── CINEMATIC TEXT ENGINE ──────────────────────── */}
            <div style={{
                position: 'relative', zIndex: 20,
                padding: '0 2rem',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '16rem',
            }}
                onClick={e => { if (isFullScreen) { e.stopPropagation(); handleTap(); } }}
            >
                <AnimatePresence mode="wait">
                    {!isComplete && currentTask ? (
                        <motion.div
                            key={currentTask.id}
                            initial={{ opacity: 0, scale: 0.94, filter: 'blur(14px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 1.06, filter: 'blur(22px)', transition: { duration: 0.6, ease: 'easeOut' } }}
                            transition={{ duration: 0.85, ease: 'easeOut' }}
                            style={{
                                textAlign: 'center',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem',
                            }}
                        >
                            {/* Main cinematic intention text */}
                            <motion.h1
                                suppressHydrationWarning
                                style={{
                                    fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif",
                                    fontSize: 'clamp(1.8rem, 6vw, 3.2rem)',
                                    fontWeight: 300,
                                    color: 'rgba(255,255,255,0.96)',
                                    lineHeight: 1.3,
                                    letterSpacing: '-0.01em',
                                    textShadow: '0 2px 32px rgba(0,0,0,0.6), 0 0 80px rgba(251,191,36,0.08)',
                                    margin: 0,
                                    maxWidth: 560,
                                }}
                            >
                                {currentTask.text}
                            </motion.h1>

                            {/* Tap hint — only in fullscreen */}
                            {isFullScreen && (
                                <motion.span
                                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                                    style={{
                                        fontSize: '0.65rem', color: 'rgba(255,255,255,0.42)',
                                        letterSpacing: '0.18em', textTransform: 'uppercase',
                                        fontWeight: 500,
                                    }}
                                >
                                    Tap to complete this intention
                                </motion.span>
                            )}
                        </motion.div>
                    ) : isComplete ? (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0, filter: 'blur(12px)' }}
                            animate={{ opacity: 1, filter: 'blur(0px)' }}
                            transition={{ duration: 1.4, delay: 0.3, ease: 'easeOut' }}
                            style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
                        >
                            <motion.span
                                animate={{ scale: [1, 1.12, 1] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                                style={{ fontSize: '3.5rem' }}
                            >
                                ✨
                            </motion.span>
                            <h1 style={{
                                fontFamily: "'Playfair Display', Georgia, serif",
                                fontSize: 'clamp(1.5rem, 5vw, 2.4rem)',
                                fontWeight: 300,
                                fontStyle: 'italic',
                                color: 'rgba(255,212,128,0.95)',
                                margin: 0,
                                textShadow: '0 2px 24px rgba(251,191,36,0.25)',
                            }}>
                                Your Sankalpa is clear.
                            </h1>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, filter: 'blur(12px)' }}
                            animate={{ opacity: 1, filter: 'blur(0px)' }}
                            transition={{ duration: 0.9, ease: 'easeOut' }}
                            style={{ textAlign: 'center' }}
                        >
                            <h2 style={{
                                fontFamily: "'Playfair Display', Georgia, serif",
                                fontSize: 'clamp(1.4rem, 5vw, 2.2rem)',
                                fontWeight: 300,
                                fontStyle: 'italic',
                                color: 'rgba(255,255,255,0.55)',
                                margin: 0,
                            }}>
                                Add your first intention above
                            </h2>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── FOOTER CTA ─────────────────────────────────── */}
            <motion.div
                style={{
                    position: 'absolute', bottom: '5.5rem',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                    zIndex: 10, opacity: 0.62,
                }}
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            >
                <motion.span
                    animate={{ opacity: [0.5, 0.9, 0.5] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.1rem' }}
                >
                    ↑
                </motion.span>
                <span style={{
                    fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.55)', fontWeight: 600,
                }}>
                    Swipe up to raise your vibration
                </span>
            </motion.div>

            {/* ── Close button when fullscreen ───────────────── */}
            {isFullScreen && onExpand && (
                <button
                    onClick={e => { e.stopPropagation(); onExpand(); }}
                    style={{
                        position: 'absolute', top: '1.2rem', right: '1.2rem', zIndex: 30,
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.10)',
                        border: '1px solid rgba(255,255,255,0.18)',
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: '0.9rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    ✕
                </button>
            )}
        </div>
    );
}
