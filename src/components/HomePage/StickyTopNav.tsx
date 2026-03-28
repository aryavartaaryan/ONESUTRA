'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, X, Play, Pause, Clapperboard, Gamepad2, Radio, Leaf } from 'lucide-react';
import { useDailyTasks, type TaskItem } from '@/hooks/useDailyTasks';

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
        ring: 'conic-gradient(from 0deg, #38bdf8, #0ea5e9, #7dd3fc, #38bdf8)',
        color: '#fbbf24',
    },
    {
        id: 'acharya-consultation',
        type: 'awareness' as const,
        label: 'Acharya',
        sublabel: 'Free Consult',
        preview: '🩺',
        ring: 'conic-gradient(from 0deg, #22c55e, #4ade80, #86efac, #22c55e)',
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
        ring: 'conic-gradient(from 0deg, #38bdf8, #0ea5e9, #7dd3fc, #38bdf8)',
        color: '#a78bfa',
    },
    {
        id: 'meditation-dhyan',
        type: 'awareness' as const,
        label: 'Meditation',
        sublabel: 'Dhyan',
        preview: '🧘',
        ring: 'conic-gradient(from 0deg, #0ea5e9, #38bdf8, #7dd3fc, #0ea5e9)',
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
        ring: 'conic-gradient(from 0deg, #0ea5e9, #38bdf8, #7dd3fc, #0ea5e9)',
        color: '#34d399',
    },
    {
        id: 'task-planner',
        type: 'awareness' as const,
        label: 'Task',
        sublabel: 'Planner',
        preview: '📋',
        ring: 'conic-gradient(from 0deg, #38bdf8, #0ea5e9, #7dd3fc, #38bdf8)',
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
        ring: 'conic-gradient(from 0deg, #38bdf8, #0ea5e9, #7dd3fc, #38bdf8)',
        color: '#fb923c',
    },
    {
        id: 'swadeshi-marketplace',
        type: 'awareness' as const,
        label: 'Swadeshi',
        sublabel: 'Market',
        preview: '🛍️',
        ring: 'conic-gradient(from 0deg, #38bdf8, #0ea5e9, #7dd3fc, #38bdf8)',
        color: '#f59e0b',
        headline: 'Swadeshi Marketplace',
        description: 'Discover authentic handcrafted products from verified Indian sellers — Ayurvedic remedies, Khadi fabrics, organic foods, pooja essentials & more. Support local artisans. Choose Swadeshi.',
        cta: 'Explore Marketplace →',
        destination: '/swadesi-product',
        bgGradient: 'linear-gradient(160deg, #1a0800 0%, #3d1800 45%, #120400 100%)',
        accentColor: '#f59e0b',
    },
] as const;

// ── User Story Types (Tasks / Challenges / Ideas) ──────────────────────────────
type UserStoryCategory = 'task' | 'challenge' | 'idea' | 'issue';

interface UserStory {
    id: string;
    type: 'user';
    category: UserStoryCategory;
    taskId: string;
    label: string;
    sublabel: string;
    emoji: string;
    ring: string;
    color: string;
    accentColor: string;
    bgGradient: string;
    text: string;
    startTime?: string;
    aiAdvice?: string;
}

function buildUserStories(tasks: TaskItem[]): UserStory[] {
    const counters: Record<string, number> = {};
    return tasks
        .filter(t => !t.done && ['Task', 'Challenge', 'Idea', 'Wellness', 'Issue'].includes(t.category))
        .map(t => {
            const cat = t.category.toLowerCase() as UserStoryCategory;
            counters[cat] = (counters[cat] || 0) + 1;
            const num = counters[cat];
            const cfg: Record<string, { emoji: string; ring: string; color: string; accentColor: string; bgGradient: string; sublabel: string }> = {
                challenge: {
                    emoji: t.icon || '⚡',
                    ring: 'conic-gradient(from 0deg, #38bdf8, #0ea5e9, #7dd3fc, #38bdf8)',
                    color: '#fb923c', accentColor: '#f97316',
                    bgGradient: 'linear-gradient(160deg, #1a0500 0%, #3d0f00 45%, #120200 100%)',
                    sublabel: `Challenge ${num}`,
                },
                idea: {
                    emoji: t.icon || '💡',
                    ring: 'conic-gradient(from 0deg, #38bdf8, #0ea5e9, #7dd3fc, #38bdf8)',
                    color: '#fbbf24', accentColor: '#f59e0b',
                    bgGradient: 'linear-gradient(160deg, #1a1000 0%, #3d2800 45%, #120900 100%)',
                    sublabel: `Idea ${num}`,
                },
                task: {
                    emoji: t.icon || '✅',
                    ring: 'conic-gradient(from 0deg, #38bdf8, #0ea5e9, #7dd3fc, #38bdf8)',
                    color: '#4ade80', accentColor: '#22c55e',
                    bgGradient: 'linear-gradient(160deg, #001a08 0%, #003818 45%, #000e05 100%)',
                    sublabel: `Task ${num}`,
                },
                wellness: {
                    emoji: t.icon || '🌿',
                    ring: 'conic-gradient(from 0deg, #38bdf8, #0ea5e9, #7dd3fc, #38bdf8)',
                    color: '#34d399', accentColor: '#10b981',
                    bgGradient: 'linear-gradient(160deg, #001a0f 0%, #003d20 45%, #000d08 100%)',
                    sublabel: `Wellness ${num}`,
                },
                issue: {
                    emoji: t.icon || '🔥',
                    ring: 'conic-gradient(from 0deg, #f87171, #ef4444, #fca5a5, #f87171)',
                    color: '#f87171', accentColor: '#ef4444',
                    bgGradient: 'linear-gradient(160deg, #1a0000 0%, #3d0000 45%, #120000 100%)',
                    sublabel: `Issue ${num}`,
                },
            };
            const selected = cfg[cat] ?? cfg.task;
            return {
                id: `user-${t.id}`,
                type: 'user' as const,
                category: cat,
                taskId: t.id,
                label: t.text.length > 12 ? t.text.slice(0, 11) + '…' : t.text,
                ...selected,
                text: t.text,
                startTime: t.startTime,
                aiAdvice: t.aiAdvice,
            };
        });
}

// ── Nature images for UserStory bubbles by category ─────────────────────
const NATURE_IMAGES: Record<string, string[]> = {
    task: [
        'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=600&fit=crop&q=80',
    ],
    challenge: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1484627147104-f5197bcd6651?w=400&h=600&fit=crop&q=80',
    ],
    idea: [
        'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&h=600&fit=crop&q=80',
    ],
    wellness: [
        'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=600&fit=crop&q=80',
    ],
};
function getCategoryImage(category: string, seed: number): string {
    const arr = NATURE_IMAGES[category] || NATURE_IMAGES.task;
    return arr[seed % arr.length];
}

// ── User Story Bubble — Nature Image Story Card ────────────────────────────
function UserStoryBubble({ story, onClick, index = 0 }: { story: UserStory; onClick: () => void; index?: number }) {
    const imgUrl = getCategoryImage(story.category, index);
    return (
        <motion.button
            onClick={onClick}
            whileTap={{ scale: 0.93 }}
            whileHover={{ scale: 1.07, y: -5, transition: { duration: 0.22 } }}
            initial={{ opacity: 0, scale: 0.7, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22, delay: index * 0.07 }}
            style={{
                flexShrink: 0,
                width: 82, height: 112,
                background: 'none', border: 'none',
                padding: 0, cursor: 'pointer',
                position: 'relative',
                borderRadius: 20,
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center',
            }}
        >
            {/* ── Full nature image background ── */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${imgUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: 20,
            }} />

            {/* ── Gradient overlay — strong at bottom for text, subtle at top ── */}
            <div style={{
                position: 'absolute', inset: 0,
                borderRadius: 20,
                background: `linear-gradient(
                    180deg,
                    rgba(0,0,0,0.08) 0%,
                    rgba(0,0,0,0.05) 35%,
                    rgba(0,0,0,0.18) 55%,
                    rgba(0,0,0,0.55) 75%,
                    rgba(0,0,0,0.72) 100%
                )`,
            }} />

            {/* ── Color tint overlay (category color) ── */}
            <div style={{
                position: 'absolute', inset: 0,
                borderRadius: 20,
                background: `linear-gradient(160deg, ${story.color}18 0%, transparent 60%)`,
                mixBlendMode: 'overlay',
            }} />

            {/* ── Animated glow ring ── */}
            <motion.div
                animate={{ opacity: [0.65, 1, 0.65], scale: [1, 1.02, 1] }}
                transition={{ duration: 2.5 + index * 0.3, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute', inset: 0,
                    borderRadius: 20,
                    boxShadow: `inset 0 0 0 2px rgba(255,255,255,0.55), 0 0 0 2.5px ${story.color}60, 0 10px 35px ${story.color}50, 0 4px 16px rgba(0,0,0,0.5)`,
                    pointerEvents: 'none',
                }}
            />

            {/* ── Prismatic top glare ── */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: '30%', borderRadius: '20px 20px 50% 50%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.06) 60%, transparent 100%)',
                pointerEvents: 'none',
            }} />

            {/* ── Top: emoji in frosted holoball ── */}
            <div style={{
                position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
                width: 32, height: 32, borderRadius: '50%',
                background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55) 0%, ${story.color}50 60%, rgba(0,0,0,0.1) 100%)`,
                backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 3px 12px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.55), 0 0 12px ${story.color}60`,
                border: '1.5px solid rgba(255,255,255,0.45)',
                fontSize: 14, lineHeight: 1,
                zIndex: 2,
            }}>
                {story.emoji}
            </div>

            {/* ── Bottom: frosted glass text panel ── */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '6px 7px 8px',
                background: 'rgba(0,0,0,0.28)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderTop: '1px solid rgba(255,255,255,0.14)',
                zIndex: 2,
            }}>
                {/* Category */}
                <div style={{
                    fontSize: '0.42rem', fontWeight: 700,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    color: story.color,
                    fontFamily: "'Inter', system-ui, sans-serif",
                    textShadow: `0 0 8px ${story.color}80`,
                    lineHeight: 1.2, marginBottom: 2,
                }}>{story.sublabel}</div>
                {/* Task text (truncated) */}
                <div style={{
                    fontSize: '0.48rem', fontWeight: 600,
                    color: 'rgba(255,255,255,0.92)',
                    fontFamily: "'Inter', system-ui, sans-serif",
                    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' as const,
                    overflow: 'hidden',
                }}>{story.label}</div>
                {/* Date/time if scheduled */}
                {story.startTime && (
                    <div style={{
                        fontSize: '0.38rem', fontWeight: 600,
                        color: story.color,
                        fontFamily: "'Inter', system-ui, sans-serif",
                        marginTop: 2,
                        letterSpacing: '0.06em',
                        opacity: 0.85,
                        display: 'flex', alignItems: 'center', gap: 2,
                    }}>
                        📅 {story.startTime}
                    </div>
                )}
            </div>
        </motion.button>
    );
}

// ── User Story Viewer ─────────────────────────────────────────────────────────
function UserStoryViewer({
    story, totalStoryCount, globalIndex, onClose, onPrev, onNext, onRemove,
}: {
    story: UserStory;
    totalStoryCount: number;
    globalIndex: number;
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
    onRemove: (taskId: string) => void;
}) {
    const [progress, setProgress] = useState(0);
    const duration = story.category === 'idea' ? 12000 : 10000;

    useEffect(() => {
        setProgress(0);
        let elapsed = 0;
        const step = 80;
        const timer = setInterval(() => {
            elapsed += step;
            const pct = Math.min((elapsed / duration) * 100, 100);
            setProgress(pct);
            if (pct >= 100) { clearInterval(timer); onNext(); }
        }, step);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [story.id]);

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRemove(story.taskId);
        onNext();
    };

    const getMidnightCountdown = () => {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const diff = midnight.getTime() - now.getTime();
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        return `${h}h ${m}m`;
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
                    maxWidth: 430, overflow: 'hidden',
                    background: '#000',
                }}
            >
                {/* ── Full-screen nature image background ── */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url(${getCategoryImage(story.category, globalIndex)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'brightness(0.85)',
                }} />
                {/* ── Color mood overlay ── */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: `linear-gradient(160deg, ${story.accentColor}25 0%, transparent 40%, rgba(0,0,0,0.22) 70%, rgba(0,0,0,0.55) 100%)`,
                }} />

                {/* Progress bars */}
                <div style={{
                    position: 'absolute', top: 14, left: 12, right: 12,
                    display: 'flex', gap: 4, zIndex: 20,
                }}>
                    {Array.from({ length: totalStoryCount }).map((_, i) => (
                        <div key={i} style={{
                            flex: 1, height: 2.5, borderRadius: 2,
                            background: 'rgba(255,255,255,0.25)', overflow: 'hidden',
                        }}>
                            <div style={{
                                height: '100%', background: '#fff',
                                width: i < globalIndex ? '100%' : i === globalIndex ? `${progress}%` : '0%',
                            }} />
                        </div>
                    ))}
                </div>

                {/* Close button */}
                <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={e => { e.stopPropagation(); onClose(); }}
                    style={{
                        position: 'absolute', top: 30, right: 12,
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.18)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#fff', zIndex: 20,
                    }}
                >
                    <X size={15} />
                </motion.button>

                {/* Ambient glow blobs */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                    <div style={{
                        position: 'absolute', width: 420, height: 420,
                        background: `radial-gradient(circle, ${story.accentColor}35, transparent 70%)`,
                        top: '-10%', left: '50%', transform: 'translateX(-50%)',
                        filter: 'blur(65px)',
                    }} />
                    <div style={{
                        position: 'absolute', width: 260, height: 260,
                        background: `radial-gradient(circle, ${story.accentColor}20, transparent 70%)`,
                        bottom: '8%', right: '5%', filter: 'blur(45px)',
                    }} />
                </div>

                {/* Content */}
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    padding: '5rem 2rem 7rem', textAlign: 'center',
                    zIndex: 1,
                }}>
                    {/* Category badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '0.28rem 0.9rem', borderRadius: 999,
                            background: `${story.accentColor}20`,
                            border: `1px solid ${story.accentColor}50`,
                            marginBottom: '1.5rem',
                        }}
                    >
                        <span style={{
                            fontSize: '0.65rem', fontWeight: 700,
                            letterSpacing: '0.14em', textTransform: 'uppercase',
                            color: story.accentColor,
                            fontFamily: "'Inter', system-ui, sans-serif",
                        }}>{story.sublabel}</span>
                    </motion.div>

                    {/* Floating emoji */}
                    <motion.div
                        animate={{ scale: [1, 1.12, 1], y: [0, -10, 0] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            fontSize: 'clamp(3rem, 12vw, 4.5rem)',
                            marginBottom: '1.4rem',
                            filter: `drop-shadow(0 0 24px ${story.accentColor}80)`,
                        }}
                    >
                        {story.emoji}
                    </motion.div>

                    {/* Task text */}
                    <motion.h2
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{
                            fontSize: 'clamp(1.25rem, 5vw, 1.9rem)', fontWeight: 800,
                            color: '#fff', margin: '0 0 1rem',
                            fontFamily: "'Playfair Display', Georgia, serif",
                            lineHeight: 1.3,
                            textShadow: `0 0 40px ${story.accentColor}50`,
                            letterSpacing: '-0.01em',
                        }}
                    >{story.text}</motion.h2>

                    {/* Thin accent divider */}
                    <div style={{
                        width: 40, height: 2, borderRadius: 2,
                        background: story.accentColor,
                        marginBottom: '1.2rem',
                        boxShadow: `0 0 10px ${story.accentColor}80`,
                    }} />

                    {/* AI Advice */}
                    {story.aiAdvice && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            style={{
                                fontSize: '0.88rem',
                                color: `${story.accentColor}cc`,
                                fontStyle: 'italic',
                                maxWidth: 290, lineHeight: 1.65,
                                margin: '0 0 2rem',
                                fontFamily: "'Inter', system-ui, sans-serif",
                                fontWeight: 300,
                            }}
                        >&ldquo;{story.aiAdvice}&rdquo;</motion.p>
                    )}

                    {/* Action area */}
                    {story.category === 'idea' ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                                padding: '0.85rem 1.6rem', borderRadius: 50,
                                background: `${story.accentColor}15`,
                                border: `1px solid ${story.accentColor}40`,
                            }}
                        >
                            <span style={{
                                fontSize: '0.82rem', fontWeight: 600,
                                color: story.accentColor,
                                letterSpacing: '0.03em',
                                fontFamily: "'Inter', system-ui, sans-serif",
                            }}>🌙 Dissolves at midnight</span>
                            <span style={{
                                fontSize: '0.72rem', color: `${story.accentColor}99`,
                                fontFamily: "'Inter', system-ui, sans-serif",
                            }}>{getMidnightCountdown()} remaining</span>
                        </motion.div>
                    ) : (
                        <motion.button
                            onClick={handleRemove}
                            whileHover={{
                                scale: 1.06,
                                boxShadow: `0 8px 40px ${story.accentColor}60`,
                            }}
                            whileTap={{ scale: 0.96 }}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            style={{
                                padding: '0.95rem 2.4rem',
                                background: `linear-gradient(135deg, ${story.accentColor}ee 0%, ${story.accentColor}99 100%)`,
                                border: `1.5px solid ${story.accentColor}`,
                                borderRadius: 50, color: '#fff',
                                fontSize: '1rem', fontWeight: 700,
                                cursor: 'pointer',
                                backdropFilter: 'blur(14px)',
                                boxShadow: `0 6px 32px ${story.accentColor}44, inset 0 1px 0 rgba(255,255,255,0.24)`,
                                letterSpacing: '0.04em',
                                fontFamily: "'Inter', system-ui, sans-serif",
                                textShadow: '0 1px 4px rgba(0,0,0,0.3)',
                            }}
                        >
                            {story.category === 'challenge' ? '⚡ Overcame It — Remove' : '✓ Done — Remove'}
                        </motion.button>
                    )}
                </div>

                {/* Tap zones: prev / next */}
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

// ── Nature images for awareness story cards ────────────────────────────────
const AWARENESS_IMAGES: Record<string, string> = {
    'acharya-consultation': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop&q=80',
    'meditation-dhyan': 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=400&h=600&fit=crop&q=80',
    'task-planner': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=600&fit=crop&q=80',
    'swadeshi-marketplace': 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&h=600&fit=crop&q=80',
};
const VIDEO_THUMBS: Record<string, string> = {
    'sunset': 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400&h=600&fit=crop&q=80',
    'mantra': 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&h=600&fit=crop&q=80',
    'dhyan11': 'https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?w=400&h=600&fit=crop&q=80',
    'sandhya-mantra': 'https://images.unsplash.com/photo-1484627147104-f5197bcd6651?w=400&h=600&fit=crop&q=80',
};

// ── Story Bubble — Rectangular Card (unified with UserStoryBubble) ───────────
function StoryBubble({ story, onClick, index = 0 }: { story: typeof STORIES[number]; onClick: () => void; index?: number }) {
    const vidRef = useRef<HTMLVideoElement>(null);
    const isVideo = 'videoSrc' in story;
    const bgImg = isVideo
        ? VIDEO_THUMBS[story.id] || 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400&h=600&fit=crop&q=80'
        : AWARENESS_IMAGES[story.id] || 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400&h=600&fit=crop&q=80';

    useEffect(() => {
        const v = vidRef.current;
        if (!v || !isVideo) return;
        v.currentTime = 0.5;
    }, [story, isVideo]);

    return (
        <motion.button
            onClick={onClick}
            whileTap={{ scale: 0.93 }}
            whileHover={{ scale: 1.07, y: -5, transition: { duration: 0.22 } }}
            initial={{ opacity: 0, scale: 0.75, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22, delay: index * 0.06 }}
            style={{
                flexShrink: 0,
                width: 82, height: 112,
                background: 'none', border: 'none',
                padding: 0, cursor: 'pointer',
                position: 'relative',
                borderRadius: 20,
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center',
            }}
        >
            {/* ── Nature / video thumbnail background ── */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${bgImg})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                borderRadius: 20,
            }} />

            {/* ── Video layer on top (muted thumbnail frame) ── */}
            {isVideo && (
                <video
                    ref={vidRef}
                    src={story.videoSrc}
                    muted playsInline preload="metadata"
                    style={{
                        position: 'absolute', inset: 0,
                        width: '100%', height: '100%',
                        objectFit: 'cover', display: 'block',
                        borderRadius: 20,
                    }}
                />
            )}

            {/* ── Gradient overlay ── */}
            <div style={{
                position: 'absolute', inset: 0, borderRadius: 20,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.04) 35%, rgba(0,0,0,0.18) 55%, rgba(0,0,0,0.58) 80%, rgba(0,0,0,0.74) 100%)',
            }} />

            {/* ── Glow ring ── */}
            <motion.div
                animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.02, 1] }}
                transition={{ duration: 2.8 + index * 0.3, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute', inset: 0, borderRadius: 20,
                    boxShadow: `inset 0 0 0 2px rgba(255,255,255,0.50), 0 0 0 2.5px ${story.color}55, 0 10px 32px ${story.color}40, 0 4px 16px rgba(0,0,0,0.45)`,
                    pointerEvents: 'none',
                }}
            />

            {/* ── Top glass glare ── */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: '30%', borderRadius: '20px 20px 50% 50%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.06) 60%, transparent 100%)',
                pointerEvents: 'none',
            }} />

            {/* ── Play badge only for video ── */}
            {isVideo && (
                <div style={{
                    position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.35)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                    border: '1.5px solid rgba(255,255,255,0.40)',
                    zIndex: 2,
                }}>
                    <Play size={12} color="#fff" fill="#fff" />
                </div>
            )}

            {/* ── Bottom frosted text panel ── */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '6px 7px 8px',
                background: 'rgba(0,0,0,0.30)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderTop: '1px solid rgba(255,255,255,0.12)',
                zIndex: 3,
            }}>
                <div style={{
                    fontSize: '0.42rem', fontWeight: 700,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    color: story.color,
                    fontFamily: "'Inter', system-ui, sans-serif",
                    textShadow: `0 0 8px ${story.color}80`,
                    lineHeight: 1.2, marginBottom: 2,
                }}>{story.sublabel}</div>
                <div style={{
                    fontSize: '0.48rem', fontWeight: 600,
                    color: 'rgba(255,255,255,0.90)',
                    fontFamily: "'Inter', system-ui, sans-serif",
                    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' as const,
                }}>{story.label}</div>
            </div>
        </motion.button>
    );
}


// ── Full-screen Story Viewer (video + awareness) ──────────────────────────────
function StoryViewer({ story, totalStoryCount, globalIndex, onClose, onPrev, onNext }: {
    story: typeof STORIES[number];
    totalStoryCount: number;
    globalIndex: number;
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
                    {Array.from({ length: totalStoryCount }).map((_, i) => (
                        <div key={i} style={{
                            flex: 1, height: 2.5, borderRadius: 2,
                            background: 'rgba(255,255,255,0.25)', overflow: 'hidden',
                        }}>
                            <div style={{
                                height: '100%', background: '#fff',
                                width: i < globalIndex ? '100%' : i === globalIndex ? `${progress}%` : '0%',
                                transition: i === globalIndex ? 'none' : undefined,
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
    const [activeUserIdx, setActiveUserIdx] = useState<number | null>(null);
    const { tasks, removeTask } = useDailyTasks();

    const userStories = useMemo(() => buildUserStories(tasks), [tasks]);

    // Auto-delete all idea tasks at midnight
    useEffect(() => {
        const ideaTasks = tasks.filter(t => t.category === 'Idea' && !t.done);
        if (!ideaTasks.length) return;
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const ms = midnight.getTime() - now.getTime();
        const timer = setTimeout(() => { ideaTasks.forEach(t => removeTask(t.id)); }, ms);
        return () => clearTimeout(timer);
    }, [tasks, removeTask]);

    const openStory = (i: number) => { setActiveIdx(i); setActiveUserIdx(null); };
    const closeStory = () => { setActiveIdx(null); setActiveUserIdx(null); };
    const nextStory = () => {
        if (activeIdx === null) return;
        activeIdx < STORIES.length - 1 ? setActiveIdx(activeIdx + 1) : closeStory();
    };
    const prevStory = () => {
        if (activeIdx === null) return;
        if (activeIdx > 0) {
            setActiveIdx(activeIdx - 1);
        } else {
            if (userStories.length > 0) {
                setActiveIdx(null);
                setActiveUserIdx(userStories.length - 1);
            }
        }
    };

    const openUserStory = (i: number) => { setActiveUserIdx(i); setActiveIdx(null); };
    const closeUserStory = () => { setActiveUserIdx(null); setActiveIdx(null); };
    // When user stories finish, seamlessly transition into regular stories
    const nextUserStory = () => {
        if (activeUserIdx === null) return;
        if (activeUserIdx < userStories.length - 1) {
            setActiveUserIdx(activeUserIdx + 1);
        } else {
            if (STORIES.length > 0) {
                setActiveUserIdx(null);
                setActiveIdx(0);
            } else {
                closeStory();
            }
        }
    };
    const prevUserStory = () => {
        if (activeUserIdx === null) return;
        if (activeUserIdx > 0) setActiveUserIdx(activeUserIdx - 1);
    };

    const totalCount = userStories.length + STORIES.length;

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
                background: 'rgba(20, 20, 30, 0.40)',
                backdropFilter: 'blur(20px) saturate(140%)',
                WebkitBackdropFilter: 'blur(20px) saturate(140%)',
                borderBottom: '1px solid rgba(251, 191, 36, 0.25)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                overflow: 'hidden',
                borderRadius: '0 0 24px 24px',
            }}>
                {/* Golden ambient glow */}
                <div aria-hidden style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: 'radial-gradient(ellipse at 50% 0%, rgba(251, 191, 36, 0.12) 0%, transparent 60%)',
                }} />

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

                    {/* Interactive Icons — 4 destinations with labels */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 12 }}>
                        {[
                            { href: '/pranaverse', Icon: Clapperboard, color: '#a78bfa', label: 'PranaVibes', useBubbleStyle: false },
                            { href: '/project-leela', Icon: Radio, color: '#fbbf24', label: 'Raag', useBubbleStyle: true },
                            { href: '/vedic-games', Icon: Gamepad2, color: '#4ade80', label: 'Games', useBubbleStyle: false },
                            { href: '/acharya-samvad', Icon: Leaf, color: '#22d3ee', label: 'Acharya', useBubbleStyle: false },
                        ].map(({ href, Icon, color, label, useBubbleStyle }) => (
                            <Link key={href} href={href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
                                {useBubbleStyle ? (
                                    <motion.div whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.90 }}
                                        style={{
                                            width: 40, height: 40, borderRadius: '50%',
                                            background: `radial-gradient(circle at 36% 26%, rgba(255,255,255,0.30) 0%, ${color}22 26%, ${color}2a 52%, ${color}1a 76%, ${color}0c 100%)`,
                                            backdropFilter: 'blur(10px) saturate(180%)',
                                            WebkitBackdropFilter: 'blur(10px) saturate(180%)',
                                            border: '1.2px solid rgba(255,255,255,0.24)',
                                            boxShadow: `0 0 16px ${color}44, 0 3px 10px rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.24), inset 0 -2px 6px ${color}18`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            position: 'relative', overflow: 'hidden',
                                        }}>
                                        <div style={{
                                            position: 'absolute', top: '6%', left: '10%', width: '52%', height: '35%',
                                            background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.22) 40%, transparent 100%)',
                                            borderRadius: '50%', transform: 'rotate(-25deg)', filter: 'blur(2px)',
                                        }} />
                                        <Icon size={16} style={{ color, position: 'relative', zIndex: 2, filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.35))` }} />
                                    </motion.div>
                                ) : (
                                    <motion.div whileHover={{ scale: 1.18 }} whileTap={{ scale: 0.88 }}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: '50%', background: `${color}18`, border: `1px solid ${color}30` }}>
                                        <Icon size={15} style={{ color }} />
                                    </motion.div>
                                )}
                                <span style={{ fontSize: '7px', fontWeight: 600, color: `${color}99`, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'Inter', system-ui, sans-serif", lineHeight: 1 }}>{label}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* ── ROW 2: Story bubbles — horizontal scroll, Instagram-style ── */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        gap: 8,
                        padding: '2px 14px 12px',
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        scrollbarWidth: 'none',
                        WebkitOverflowScrolling: 'touch',
                        position: 'relative', zIndex: 2,
                    }}
                >
                    <style>{`div::-webkit-scrollbar{display:none}`}</style>
                    {userStories.map((us, i) => (
                        <UserStoryBubble key={us.id} story={us} index={i} onClick={() => openUserStory(i)} />
                    ))}
                    {userStories.length > 0 && (
                        <div style={{
                            width: 1, height: 52, background: 'rgba(255,255,255,0.10)',
                            alignSelf: 'center', flexShrink: 0, borderRadius: 1, marginRight: 2,
                        }} />
                    )}
                    {STORIES.map((story, i) => (
                        <StoryBubble key={story.id} story={story} index={i} onClick={() => openStory(i)} />
                    ))}
                </div>
            </header>

            {/* ── Full-screen Story Viewer ── */}
            <AnimatePresence>
                {activeIdx !== null && (
                    <StoryViewer
                        story={STORIES[activeIdx]}
                        totalStoryCount={totalCount}
                        globalIndex={userStories.length + activeIdx}
                        onClose={closeStory}
                        onNext={nextStory}
                        onPrev={prevStory}
                    />
                )}
            </AnimatePresence>

            {/* ── User Story Viewer (tasks / challenges / ideas) ── */}
            <AnimatePresence>
                {activeUserIdx !== null && userStories[activeUserIdx] && (
                    <UserStoryViewer
                        story={userStories[activeUserIdx]}
                        totalStoryCount={totalCount}
                        globalIndex={activeUserIdx}
                        onClose={closeUserStory}
                        onNext={nextUserStory}
                        onPrev={prevUserStory}
                        onRemove={removeTask}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
