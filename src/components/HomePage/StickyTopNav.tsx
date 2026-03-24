'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, X, Play, Pause, Music, Gamepad2 } from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────
function videoUrl(filename: string) {
    return `/Slide%20Videos/${encodeURIComponent(filename)}`;
}

// ── Story data ────────────────────────────────────────────────────────────────
const STORIES = [
    {
        id: 'sunset',
        type: 'video' as const,
        label: 'Sunset',
        sublabel: 'Sandhyā',
        videoSrc: videoUrl('sunset.mp4'),
        ring: 'conic-gradient(from 0deg, #f59e0b, #fb923c, #fbbf24, #f59e0b)',
        color: '#fbbf24',
    },
    {
        id: 'acharya-consultation',
        type: 'awareness' as const,
        label: 'Acharya',
        sublabel: 'Free Consult',
        preview: '🩺',
        ring: 'conic-gradient(from 0deg, #22c55e, #84cc16, #4ade80, #22c55e)',
        color: '#4ade80',
        headline: 'Free Ayurvedic Consultation',
        description: 'Consult Acharya Pranav for a free, personalised Ayurvedic health assessment. Ancient wisdom meets modern science — heal your body, mind & spirit the natural way.',
        cta: 'Consult Acharya Now →',
        destination: '/acharya-samvad',
        bgGradient: 'linear-gradient(160deg, #001a08 0%, #003818 45%, #000e05 100%)',
        accentColor: '#4ade80',
    },
    {
        id: 'mantra',
        type: 'video' as const,
        label: 'भूरग्नये',
        sublabel: 'स्वाहा',
        videoSrc: videoUrl('भूरग्नये स्वाहा.mp4'),
        ring: 'conic-gradient(from 0deg, #818cf8, #a78bfa, #38bdf8, #818cf8)',
        color: '#a78bfa',
    },
    {
        id: 'meditation-dhyan',
        type: 'awareness' as const,
        label: 'Meditation',
        sublabel: 'Dhyan',
        preview: '🧘',
        ring: 'conic-gradient(from 0deg, #14b8a6, #06b6d4, #67e8f9, #14b8a6)',
        color: '#22d3ee',
        headline: 'Dhyan Kshetra',
        description: 'Reclaim your inner silence in a world of algorithmic noise. Science-backed meditation sessions, guided breathwork, and ancient Vedic Dhyan practices — available to you every moment.',
        cta: 'Begin Meditation →',
        destination: '/dhyan-kshetra',
        bgGradient: 'linear-gradient(160deg, #001518 0%, #003038 45%, #000810 100%)',
        accentColor: '#22d3ee',
    },
    {
        id: 'dhyan11',
        type: 'video' as const,
        label: 'Dhyan',
        sublabel: '11',
        videoSrc: videoUrl('Dhyan11.mp4'),
        ring: 'conic-gradient(from 0deg, #10b981, #34d399, #6ee7b7, #10b981)',
        color: '#34d399',
    },
    {
        id: 'task-planner',
        type: 'awareness' as const,
        label: 'Task',
        sublabel: 'Planner',
        preview: '📋',
        ring: 'conic-gradient(from 0deg, #6366f1, #8b5cf6, #a78bfa, #6366f1)',
        color: '#8b5cf6',
        headline: 'Advanced Task Planner',
        description: "Stop losing the battle against your own to-do list. OneSUTRA's research-backed planner aligns your tasks with your body's natural energy cycles — Dosha-aware scheduling that actually works.",
        cta: 'Open Planner →',
        destination: '/vedic-planner',
        bgGradient: 'linear-gradient(160deg, #080010 0%, #180038 45%, #040010 100%)',
        accentColor: '#8b5cf6',
    },
    {
        id: 'sandhya-mantra',
        type: 'video' as const,
        label: 'Sandhya',
        sublabel: 'Mantra',
        videoSrc: videoUrl('SandhyaMantra.mp4'),
        ring: 'conic-gradient(from 0deg, #f97316, #fb923c, #fed7aa, #f97316)',
        color: '#fb923c',
    },
    {
        id: 'swadeshi-marketplace',
        type: 'awareness' as const,
        label: 'Swadeshi',
        sublabel: 'Market',
        preview: '🛍️',
        ring: 'conic-gradient(from 0deg, #f97316, #f59e0b, #fbbf24, #f97316)',
        color: '#f59e0b',
        headline: 'Swadeshi Marketplace',
        description: 'Discover authentic handcrafted products from verified Indian sellers — Ayurvedic remedies, Khadi fabrics, organic foods, pooja essentials & more. Support local artisans. Choose Swadeshi.',
        cta: 'Explore Marketplace →',
        destination: '/swadesi-product',
        bgGradient: 'linear-gradient(160deg, #1a0800 0%, #3d1800 45%, #120400 100%)',
        accentColor: '#f59e0b',
    },
] as const;

// ── Story Bubble — Instagram-scale circle ─────────────────────────────────────
function StoryBubble({ story, onClick }: { story: typeof STORIES[number]; onClick: () => void }) {
    const vidRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const v = vidRef.current;
        if (!v || !('videoSrc' in story)) return;
        v.currentTime = 0.5;
    }, [story]);

    return (
        <motion.button
            onClick={onClick}
            whileTap={{ scale: 0.90 }}
            whileHover={{ scale: 1.06 }}
            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
            style={{
                width: '100%', background: 'none', border: 'none',
                padding: 0, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
        >
            {/* Outer gradient ring — fills grid cell, capped at 62px */}
            <div style={{
                width: 'min(100%, 62px)', aspectRatio: '1', borderRadius: '50%',
                background: story.ring,
                padding: '4.5%',
                boxShadow: `0 0 18px ${story.color}65, 0 3px 12px rgba(0,0,0,0.4)`,
                animation: 'ring-spin 6s linear infinite',
                position: 'relative',
            }}>
                {/* Dark gap ring */}
                <div style={{
                    width: '100%', height: '100%', borderRadius: '50%',
                    background: 'rgba(5,3,16,0.92)', padding: '3.5%',
                }}>
                    {/* Content circle */}
                    <div style={{
                        width: '100%', height: '100%', borderRadius: '50%',
                        overflow: 'hidden', position: 'relative',
                    }}>
                        {'videoSrc' in story ? (
                            <video
                                ref={vidRef}
                                src={story.videoSrc}
                                muted playsInline preload="metadata"
                                style={{
                                    width: '100%', height: '100%',
                                    objectFit: 'cover', display: 'block',
                                    pointerEvents: 'none',
                                }}
                            />
                        ) : (
                            <div style={{
                                width: '100%', height: '100%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: `radial-gradient(circle at 40% 35%, ${story.color}28, rgba(6,4,20,0.96))`,
                                fontSize: 26,
                            }}>
                                {story.preview}
                            </div>
                        )}
                        {/* Specular highlight */}
                        <div style={{
                            position: 'absolute', inset: 0, borderRadius: '50%',
                            background: `radial-gradient(ellipse at 32% 22%, rgba(255,255,255,0.18) 0%, transparent 55%)`,
                            pointerEvents: 'none',
                        }} />
                        {/* Color tint */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: `radial-gradient(circle at 70% 75%, ${story.color}18, transparent 60%)`,
                            pointerEvents: 'none',
                        }} />
                    </div>
                </div>
            </div>
        </motion.button>
    );
}


// ── Full-screen Story Viewer (video + awareness) ──────────────────────────────
function StoryViewer({ story, allStories, currentIndex, onClose, onPrev, onNext }: {
    story: typeof STORIES[number];
    allStories: typeof STORIES;
    currentIndex: number;
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
}) {
    const router = useRouter();
    const vidRef = useRef<HTMLVideoElement>(null);
    const [progress, setProgress] = useState(0);
    const [muted, setMuted] = useState(false);
    const [paused, setPaused] = useState(false);

    // restart when story changes
    useEffect(() => {
        setProgress(0);
        setPaused(false);
        if (story.type === 'video') {
            const v = vidRef.current;
            if (!v) return;
            v.currentTime = 0;
            v.muted = muted;
            v.play().catch(() => { });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [story.id]);

    // sync muted (video only)
    useEffect(() => {
        if (vidRef.current) vidRef.current.muted = muted;
    }, [muted]);

    // auto-advance timer for awareness stories (8 seconds)
    useEffect(() => {
        if (story.type !== 'awareness') return;
        let elapsed = 0;
        const total = 8000;
        const step = 80;
        const timer = setInterval(() => {
            elapsed += step;
            const pct = Math.min((elapsed / total) * 100, 100);
            setProgress(pct);
            if (pct >= 100) { clearInterval(timer); onNext(); }
        }, step);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [story.id]);

    const onTimeUpdate = useCallback(() => {
        const v = vidRef.current;
        if (!v || !v.duration) return;
        setProgress((v.currentTime / v.duration) * 100);
    }, []);

    const togglePause = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (story.type !== 'video') return;
        const v = vidRef.current;
        if (!v) return;
        if (v.paused) { v.play(); setPaused(false); }
        else { v.pause(); setPaused(true); }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 99999,
                background: '#000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
        >
            <motion.div
                onClick={e => e.stopPropagation()}
                initial={{ scale: 0.94 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                style={{
                    position: 'relative',
                    width: '100%', height: '100dvh',
                    maxWidth: 430,
                    overflow: 'hidden',
                    background: '#000',
                }}
            >
                {/* ── VIDEO or AWARENESS CARD ── */}
                {story.type === 'video' ? (
                    <>
                        <video
                            ref={vidRef}
                            src={story.videoSrc}
                            playsInline autoPlay loop={false} muted={muted}
                            onTimeUpdate={onTimeUpdate}
                            onEnded={onNext}
                            style={{
                                position: 'absolute', inset: 0,
                                width: '100%', height: '100%',
                                objectFit: 'cover', display: 'block',
                            }}
                        />
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 18%, transparent 75%, rgba(0,0,0,0.4) 100%)',
                            pointerEvents: 'none',
                        }} />
                        {/* Bottom label */}
                        <div style={{
                            position: 'absolute', bottom: 40, left: 0, right: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 20, pointerEvents: 'none',
                        }}>
                            <span style={{
                                fontSize: '1.15rem', fontWeight: 700,
                                fontFamily: "'Inter', system-ui, sans-serif",
                                color: '#fff',
                                textShadow: '0 2px 16px rgba(0,0,0,0.6)',
                                letterSpacing: '0.02em',
                            }}>{story.label} {story.sublabel}</span>
                        </div>
                    </>
                ) : (
                    /* ── AWARENESS CARD ── */
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: story.bgGradient,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        padding: '5rem 2rem 3rem', textAlign: 'center',
                        overflow: 'hidden',
                    }}>
                        {/* Ambient glow blobs */}
                        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                            <div style={{
                                position: 'absolute', width: 340, height: 340,
                                background: `radial-gradient(circle, ${story.accentColor}22, transparent 70%)`,
                                top: '5%', left: '50%', transform: 'translateX(-50%)',
                                filter: 'blur(55px)',
                            }} />
                            <div style={{
                                position: 'absolute', width: 240, height: 240,
                                background: `radial-gradient(circle, ${story.accentColor}18, transparent 70%)`,
                                bottom: '10%', left: '10%', filter: 'blur(40px)',
                            }} />
                            <div style={{
                                position: 'absolute', width: 180, height: 180,
                                background: `radial-gradient(circle, ${story.accentColor}12, transparent 70%)`,
                                bottom: '20%', right: '8%', filter: 'blur(30px)',
                            }} />
                        </div>

                        {/* Floating emoji icon */}
                        <motion.div
                            animate={{ scale: [1, 1.1, 1], y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                            style={{
                                fontSize: 'clamp(3.5rem, 10vw, 5rem)',
                                marginBottom: '1.6rem',
                                position: 'relative', zIndex: 1,
                                filter: `drop-shadow(0 0 24px ${story.accentColor}80)`,
                            }}
                        >
                            {story.preview}
                        </motion.div>

                        {/* Headline */}
                        <h2 style={{
                            fontSize: 'clamp(1.7rem, 6vw, 2.8rem)', fontWeight: 800,
                            color: '#fff', margin: '0 0 1rem',
                            fontFamily: "'Playfair Display', Georgia, serif",
                            lineHeight: 1.12, position: 'relative', zIndex: 1,
                            textShadow: `0 0 48px ${story.accentColor}60`,
                            letterSpacing: '-0.01em',
                        }}>{story.headline}</h2>

                        {/* Thin accent divider */}
                        <div style={{
                            width: 48, height: 2, borderRadius: 2,
                            background: story.accentColor,
                            marginBottom: '1.2rem',
                            boxShadow: `0 0 12px ${story.accentColor}80`,
                            position: 'relative', zIndex: 1,
                        }} />

                        {/* Description */}
                        <p style={{
                            fontSize: 'clamp(0.9rem, 2.8vw, 1.05rem)',
                            color: 'rgba(255,255,255,0.68)',
                            lineHeight: 1.8, maxWidth: '300px',
                            margin: '0 0 2.8rem',
                            position: 'relative', zIndex: 1,
                            fontWeight: 300, letterSpacing: '0.012em',
                        }}>{story.description}</p>

                        {/* ── Elegant CTA Button ── */}
                        <motion.button
                            onClick={e => { e.stopPropagation(); router.push(story.destination); onClose(); }}
                            whileHover={{ scale: 1.06, boxShadow: `0 8px 40px ${story.accentColor}60` }}
                            whileTap={{ scale: 0.96 }}
                            style={{
                                padding: '0.95rem 2.4rem',
                                background: `linear-gradient(135deg, ${story.accentColor}ee 0%, ${story.accentColor}99 100%)`,
                                border: `1.5px solid ${story.accentColor}`,
                                borderRadius: 50,
                                color: '#fff', fontSize: '1rem', fontWeight: 700,
                                cursor: 'pointer', position: 'relative', zIndex: 10,
                                backdropFilter: 'blur(14px)',
                                boxShadow: `0 6px 32px ${story.accentColor}44, inset 0 1px 0 rgba(255,255,255,0.24)`,
                                letterSpacing: '0.04em',
                                fontFamily: "'Inter', system-ui, sans-serif",
                                textShadow: '0 1px 4px rgba(0,0,0,0.3)',
                            }}
                        >{story.cta}</motion.button>
                    </div>
                )}

                {/* ── Progress bars ── */}
                <div style={{
                    position: 'absolute', top: 14, left: 12, right: 12,
                    display: 'flex', gap: 4, zIndex: 20,
                }}>
                    {allStories.map((s, i) => (
                        <div key={s.id} style={{
                            flex: 1, height: 2.5, borderRadius: 2,
                            background: 'rgba(255,255,255,0.25)', overflow: 'hidden',
                        }}>
                            <div style={{
                                height: '100%', background: '#fff',
                                width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
                                transition: i === currentIndex ? 'none' : undefined,
                            }} />
                        </div>
                    ))}
                </div>

                {/* ── Top-right controls ── */}
                <div style={{
                    position: 'absolute', top: 30, right: 12,
                    display: 'flex', gap: 8, zIndex: 20,
                }}>
                    {story.type === 'video' && (
                        <motion.button whileTap={{ scale: 0.88 }} onClick={e => { e.stopPropagation(); setMuted(m => !m); }} style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.18)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#fff',
                        }}>
                            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                        </motion.button>
                    )}
                    <motion.button whileTap={{ scale: 0.88 }} onClick={e => { e.stopPropagation(); onClose(); }} style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.18)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#fff',
                    }}>
                        <X size={15} />
                    </motion.button>
                </div>

                {/* ── Center tap-to-pause (video only) ── */}
                {story.type === 'video' && (
                    <div onClick={togglePause} style={{ position: 'absolute', inset: 0, zIndex: 10 }} />
                )}

                {/* ── Pause icon flash ── */}
                <AnimatePresence>
                    {paused && story.type === 'video' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            style={{
                                position: 'absolute', top: '50%', left: '50%',
                                transform: 'translate(-50%,-50%)',
                                zIndex: 30, pointerEvents: 'none',
                                width: 64, height: 64, borderRadius: '50%',
                                background: 'rgba(0,0,0,0.5)',
                                backdropFilter: 'blur(8px)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <Pause size={28} fill="#fff" color="#fff" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Tap zones: prev (left) / next (right) ── */}
                <div onClick={e => { e.stopPropagation(); onPrev(); }} style={{
                    position: 'absolute', left: 0, top: 60, bottom: 60,
                    width: '28%', zIndex: 15, cursor: 'pointer',
                }} />
                <div onClick={e => { e.stopPropagation(); onNext(); }} style={{
                    position: 'absolute', right: 0, top: 60, bottom: 60,
                    width: '28%', zIndex: 15, cursor: 'pointer',
                }} />
            </motion.div>
        </motion.div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function StickyTopNav() {
    const [activeIdx, setActiveIdx] = useState<number | null>(null);

    const openStory = (i: number) => setActiveIdx(i);
    const closeStory = () => setActiveIdx(null);
    const nextStory = () => {
        if (activeIdx === null) return;
        activeIdx < STORIES.length - 1 ? setActiveIdx(activeIdx + 1) : closeStory();
    };
    const prevStory = () => {
        if (activeIdx === null) return;
        activeIdx > 0 ? setActiveIdx(activeIdx - 1) : undefined;
    };

    return (
        <>
            <style>{`
                @keyframes ring-spin {
                    from { filter: hue-rotate(0deg); }
                    to   { filter: hue-rotate(360deg); }
                }
                @keyframes logo-pulse {
                    0%, 100% { box-shadow: 0 0 18px rgba(251,191,36,0.30), 0 0 6px rgba(251,191,36,0.15); }
                    50%      { box-shadow: 0 0 32px rgba(251,191,36,0.55), 0 0 12px rgba(251,191,36,0.28); }
                }
                .os-stories-row::-webkit-scrollbar { display: none; }
                .os-stories-row { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <header style={{
                position: 'fixed',
                top: 0, left: 0, right: 0,
                zIndex: 1000,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.0) 0%, rgba(6,3,14,0.30) 40%, rgba(8,4,18,0.55) 75%, rgba(8,4,18,0.70) 100%)',
                backdropFilter: 'blur(28px) saturate(180%)',
                WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                boxShadow: '0 4px 32px rgba(0,0,0,0.12)',
                overflow: 'hidden',
            }}>
                {/* Subtle water-bubble specular at top */}
                <div aria-hidden style={{
                    position: 'absolute', top: 0, left: '10%', right: '10%', height: '50%', pointerEvents: 'none',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)',
                    borderRadius: '0 0 50% 50%',
                }} />

                {/* ── ROW 1: Brand bar ── */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 18px 6px',
                    position: 'relative', zIndex: 2,
                }}>
                    {/* Logo + wordmark */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Sacred geometry badge */}
                        <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            background: 'linear-gradient(145deg, #080d1f, #111827)',
                            border: '2px solid rgba(251,191,36,0.70)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                            animation: 'logo-pulse 3.5s ease-in-out infinite',
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="rgba(251,191,36,0.55)" strokeWidth="0.8" />
                                <circle cx="12" cy="12" r="6.5" stroke="rgba(251,191,36,0.35)" strokeWidth="0.7" />
                                <path d="M12 3 L12 21 M3 12 L21 12 M5.6 5.6 L18.4 18.4 M18.4 5.6 L5.6 18.4"
                                    stroke="rgba(251,191,36,0.22)" strokeWidth="0.6" />
                                <path d="M 8 9.5 Q 12 7, 16 9.5 T 16 14 Q 13 16.5, 10 15 T 8 12 Q 9.5 11, 12 11"
                                    stroke="rgba(255,255,255,0.92)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
                                <circle cx="12" cy="12" r="1.6" fill="#fbbf24" />
                            </svg>
                        </div>
                        {/* Wordmark + tagline */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <span style={{
                                fontFamily: "'Inter', system-ui, sans-serif",
                                fontSize: '1.15rem', fontWeight: 800,
                                letterSpacing: '0.10em', textTransform: 'uppercase',
                                background: 'linear-gradient(120deg, #ffffff 0%, #fde68a 40%, #bae6fd 100%)',
                                WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                                lineHeight: 1,
                            }}>OneSUTRA</span>
                            <span style={{
                                fontSize: '8px', fontWeight: 600,
                                letterSpacing: '0.22em', textTransform: 'uppercase',
                                color: 'rgba(251,191,36,0.55)',
                                fontFamily: "'Inter', system-ui, sans-serif",
                                lineHeight: 1,
                            }}>Conscious OS</span>
                        </div>
                    </div>

                    {/* Right: story colour dots + PranaVibes & Games icons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            {[STORIES[0].color, STORIES[2].color, STORIES[4].color, STORIES[6].color].map((c, i) => (
                                <div key={i} style={{
                                    width: 5, height: 5, borderRadius: '50%',
                                    background: c, opacity: 0.45,
                                }} />
                            ))}
                        </div>

                        {/* Interactive Icons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 12 }}>
                            <Link href="/pranavibes" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                                <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                                    <Music size={18} style={{ color: 'rgba(255,255,255,0.7)' }} />
                                </motion.div>
                            </Link>
                            <Link href="/games" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                                <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                                    <Gamepad2 size={19} style={{ color: 'rgba(255,255,255,0.7)' }} />
                                </motion.div>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ── ROW 2: Story bubbles — CSS grid, always fits, never cuts ── */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${STORIES.length}, 1fr)`,
                        alignItems: 'center',
                        gap: 'clamp(4px, 1vw, 10px)',
                        padding: '2px 14px 12px',
                        position: 'relative', zIndex: 2,
                    }}
                >
                    {STORIES.map((story, i) => (
                        <StoryBubble key={story.id} story={story} onClick={() => openStory(i)} />
                    ))}
                </div>
            </header>

            {/* ── Full-screen Story Viewer ── */}
            <AnimatePresence>
                {activeIdx !== null && (
                    <StoryViewer
                        story={STORIES[activeIdx]}
                        allStories={STORIES}
                        currentIndex={activeIdx}
                        onClose={closeStory}
                        onNext={nextStory}
                        onPrev={prevStory}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
