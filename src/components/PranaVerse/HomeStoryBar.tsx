'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useDailyTasks, type TaskItem } from '@/hooks/useDailyTasks';
import { BODHI_DEFAULT_STORIES } from '@/components/HomePage/StickyTopNav';

// ── User story types (mirroring StickyTopNav) ─────────────────────────
type UserStoryCategory = 'task' | 'challenge' | 'idea' | 'issue' | 'wellness';

interface UserTaskStory {
    id: string;
    taskId: string;
    category: UserStoryCategory;
    label: string;
    text: string;
    emoji: string;
    color: string;
    accentColor: string;
    bgGradient: string;
    ringColors: [string, string];
    sublabel: string;
    startTime?: string;
    aiAdvice?: string;
}

function buildUserTaskStories(tasks: TaskItem[]): UserTaskStory[] {
    const activeTasks = tasks.filter(t => !t.done && ['Task', 'Challenge', 'Idea', 'Wellness', 'Issue'].includes(t.category));
    const source = activeTasks.length > 0 ? activeTasks : BODHI_DEFAULT_STORIES.filter(t => !t.done);
    const counters: Record<string, number> = {};
    return source.map(t => {
        const cat = t.category.toLowerCase() as UserStoryCategory;
        counters[cat] = (counters[cat] || 0) + 1;
        const num = counters[cat];
        const cfg: Record<string, { emoji: string; color: string; accentColor: string; bgGradient: string; ringColors: [string, string]; sublabel: string }> = {
            task: { emoji: t.icon || '✅', color: '#4ade80', accentColor: '#22c55e', bgGradient: 'linear-gradient(135deg,#001a08,#003818)', ringColors: ['#4ade80', '#86efac'], sublabel: `Task ${num}` },
            idea: { emoji: t.icon || '💡', color: '#fbbf24', accentColor: '#f59e0b', bgGradient: 'linear-gradient(135deg,#1a1000,#3d2800)', ringColors: ['#fbbf24', '#fde68a'], sublabel: `Idea ${num}` },
            challenge: { emoji: t.icon || '⚡', color: '#fb923c', accentColor: '#f97316', bgGradient: 'linear-gradient(135deg,#1a0500,#3d0f00)', ringColors: ['#fb923c', '#fed7aa'], sublabel: `Challenge ${num}` },
            wellness: { emoji: t.icon || '🌿', color: '#34d399', accentColor: '#10b981', bgGradient: 'linear-gradient(135deg,#001a0f,#003d20)', ringColors: ['#34d399', '#6ee7b7'], sublabel: `Wellness ${num}` },
            issue: { emoji: t.icon || '🔥', color: '#f87171', accentColor: '#ef4444', bgGradient: 'linear-gradient(135deg,#1a0000,#3d0000)', ringColors: ['#f87171', '#fca5a5'], sublabel: `Issue ${num}` },
        };
        const c = cfg[cat] ?? cfg.task;
        return {
            id: `utask-${t.id}`,
            taskId: t.id,
            category: cat,
            label: t.text.length > 12 ? t.text.slice(0, 11) + '…' : t.text,
            text: t.text,
            emoji: c.emoji,
            color: c.color,
            accentColor: c.accentColor,
            bgGradient: c.bgGradient,
            ringColors: c.ringColors,
            sublabel: c.sublabel,
            startTime: t.startTime,
            aiAdvice: t.aiAdvice,
        };
    });
}

// ── User Task Circular Bubble (matches PranaVerse circular style) ──────────
function UserTaskBubble({ story, isViewed, onClick, idx }: { story: UserTaskStory; isViewed: boolean; onClick: () => void; idx: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: idx * 0.04, type: 'spring', stiffness: 280, damping: 20 }}
            whileTap={{ scale: 0.91 }}
            onClick={onClick}
            style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
                flexShrink: 0, cursor: 'pointer',
                animation: isViewed ? 'none' : `storyBubbleFloat ${3.5 + idx * 0.4}s ease-in-out ${idx * 0.15}s infinite`,
            }}
        >
            {/* Conic gradient ring */}
            <div style={{
                width: 68, height: 68, borderRadius: '50%', padding: 3,
                background: isViewed
                    ? 'rgba(255,255,255,0.08)'
                    : `conic-gradient(${story.ringColors[0]} 0deg, ${story.ringColors[1]} 90deg, ${story.ringColors[0]} 180deg, ${story.ringColors[1]} 270deg, ${story.ringColors[0]} 360deg)`,
                animation: isViewed ? 'none' : `videoRingPulse ${2.6 + idx * 0.28}s ease-in-out ${idx * 0.22}s infinite`,
                flexShrink: 0, position: 'relative',
            }}>
                <div style={{
                    width: '100%', height: '100%', borderRadius: '50%',
                    border: '2.5px solid #000', overflow: 'hidden', position: 'relative',
                    background: story.bgGradient,
                    filter: isViewed ? 'grayscale(0.6) brightness(0.55)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {/* Glow tint */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: `radial-gradient(circle at 50% 40%, ${story.color}44 0%, transparent 72%)`,
                    }} />
                    {/* Emoji */}
                    <span style={{
                        fontSize: '1.4rem',
                        filter: `drop-shadow(0 0 10px ${story.color}) drop-shadow(0 0 5px ${story.color}cc)`,
                        opacity: isViewed ? 0.5 : 1,
                        position: 'relative', zIndex: 1,
                    }}>{story.emoji}</span>
                </div>
                {/* Category badge */}
                {!isViewed && (
                    <div style={{
                        position: 'absolute', bottom: -1, right: -1,
                        background: `linear-gradient(135deg,${story.color},${story.accentColor})`,
                        borderRadius: '50%', width: 16, height: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid #000',
                        boxShadow: `0 0 8px ${story.color}80`,
                        fontSize: '0.5rem',
                    }}>
                        <span style={{ fontSize: '0.45rem' }}>{story.category === 'task' ? '✓' : story.category === 'idea' ? '★' : story.category === 'challenge' ? '⚡' : '⚠'}</span>
                    </div>
                )}
            </div>
            <span style={{
                fontSize: '0.48rem', fontFamily: "'Inter',sans-serif", fontWeight: 700,
                color: isViewed ? 'rgba(255,255,255,0.28)' : story.color,
                letterSpacing: '0.04em', textAlign: 'center',
                maxWidth: 66, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                textShadow: isViewed ? 'none' : `0 0 8px ${story.color}80`,
            }}>{story.label}</span>
        </motion.div>
    );
}

// ── User Task Full-Screen Viewer ───────────────────────────────────────
const BG_TASK_IMAGES: Record<string, string[]> = {
    task: [
        'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=600&fit=crop&q=80',
    ],
    idea: [
        'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&h=600&fit=crop&q=80',
    ],
    challenge: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1484627147104-f5197bcd6651?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1455156218388-5e61b526818b?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1475274047050-1d0c0975f9f1?w=400&h=600&fit=crop&q=80',
    ],
    issue: [
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1484627147104-f5197bcd6651?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1475274047050-1d0c0975f9f1?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1455156218388-5e61b526818b?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=600&fit=crop&q=80',
    ],
    wellness: [
        'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=400&h=600&fit=crop&q=80',
    ],
};

function UserTaskViewer({ stories, currentIdx, onClose, onNext, onPrev, onRemove }: {
    stories: UserTaskStory[];
    currentIdx: number;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
    onRemove: (taskId: string) => void;
}) {
    const story = stories[currentIdx];
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        setProgress(0);
        let elapsed = 0;
        const duration = 10000;
        const step = 80;
        const timer = setInterval(() => {
            elapsed += step;
            const pct = Math.min((elapsed / duration) * 100, 100);
            setProgress(pct);
            if (pct >= 100) { clearInterval(timer); onNext(); }
        }, step);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [story?.id]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    if (!story) return null;
    const bgArr = BG_TASK_IMAGES[story.category] || BG_TASK_IMAGES.task;
    const bgImg = bgArr[currentIdx % bgArr.length];

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 10002, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={onClose}
        >
            <motion.div
                onClick={e => e.stopPropagation()}
                initial={{ scale: 0.94 }} animate={{ scale: 1 }} exit={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                style={{ position: 'relative', width: '100%', maxWidth: 480, height: '100dvh', overflow: 'hidden', background: '#000' }}
            >
                {/* BG Image */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.82)' }} />
                {/* Color mood overlay */}
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg, ${story.accentColor}28 0%, transparent 40%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.65) 100%)` }} />

                {/* Progress bars */}
                <div style={{ position: 'absolute', top: 14, left: 12, right: 12, display: 'flex', gap: 4, zIndex: 20 }}>
                    {stories.map((_, i) => (
                        <div key={i} style={{ flex: 1, height: 2.5, borderRadius: 2, background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: `linear-gradient(90deg,${story.color},#fbbf24)`, width: i < currentIdx ? '100%' : i === currentIdx ? `${progress}%` : '0%', borderRadius: 2 }} />
                        </div>
                    ))}
                </div>

                {/* Close */}
                <button onClick={e => { e.stopPropagation(); onClose(); }} style={{
                    position: 'absolute', top: 30, right: 12,
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#fff', zIndex: 20,
                }}><X size={15} /></button>

                {/* Ambient glow */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', width: 380, height: 380, background: `radial-gradient(circle, ${story.accentColor}38, transparent 70%)`, top: '-10%', left: '50%', transform: 'translateX(-50%)', filter: 'blur(60px)' }} />
                </div>

                {/* Content */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 2rem 7rem', textAlign: 'center', zIndex: 1 }}>
                    {/* Category badge */}
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.28rem 0.9rem', borderRadius: 999, background: `${story.accentColor}20`, border: `1px solid ${story.accentColor}50`, marginBottom: '1.2rem' }}
                    >
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: story.accentColor, fontFamily: "'Inter',sans-serif" }}>{story.sublabel}</span>
                    </motion.div>

                    {/* Floating emoji */}
                    <motion.div animate={{ scale: [1, 1.12, 1], y: [0, -10, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ fontSize: 'clamp(3rem,12vw,4.5rem)', marginBottom: '1.2rem', filter: `drop-shadow(0 0 24px ${story.accentColor}80)` }}
                    >{story.emoji}</motion.div>

                    {/* Task text */}
                    <motion.h2 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        style={{ fontSize: 'clamp(1.25rem,5vw,1.9rem)', fontWeight: 800, color: '#fff', margin: '0 0 0.6rem', fontFamily: "'Playfair Display',Georgia,serif", lineHeight: 1.3, textShadow: `0 0 40px ${story.accentColor}50` }}
                    >{story.text}</motion.h2>

                    {/* Divider */}
                    <div style={{ width: 40, height: 2, borderRadius: 2, background: story.accentColor, marginBottom: '1rem', boxShadow: `0 0 10px ${story.accentColor}80` }} />

                    {/* Bodhi Advice */}
                    {story.aiAdvice && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(16px)', border: `1px solid ${story.accentColor}30`, borderRadius: 16, padding: '1rem 1.25rem', maxWidth: 320, marginBottom: '1.5rem' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '1rem' }}>🤖</span>
                                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: story.accentColor, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Inter',sans-serif" }}>Bodhi’s Guidance</span>
                            </div>
                            <p style={{ fontSize: '0.82rem', color: `${story.accentColor}cc`, fontStyle: 'italic', lineHeight: 1.65, margin: 0, fontFamily: "'Inter',sans-serif", fontWeight: 300 }}>“{story.aiAdvice}”</p>
                        </motion.div>
                    )}

                    {/* Action */}
                    {story.category !== 'idea' && (
                        <motion.button
                            onClick={e => { e.stopPropagation(); onRemove(story.taskId); onNext(); }}
                            whileHover={{ scale: 1.06, boxShadow: `0 8px 40px ${story.accentColor}60` }}
                            whileTap={{ scale: 0.96 }}
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                            style={{
                                padding: '0.9rem 2.2rem',
                                background: `linear-gradient(135deg, ${story.accentColor}ee 0%, ${story.accentColor}99 100%)`,
                                border: `1.5px solid ${story.accentColor}`,
                                borderRadius: 50, color: '#fff',
                                fontSize: '0.95rem', fontWeight: 700,
                                cursor: 'pointer', backdropFilter: 'blur(14px)',
                                boxShadow: `0 6px 32px ${story.accentColor}44`,
                                fontFamily: "'Inter',sans-serif",
                            }}
                        >
                            {story.category === 'challenge' ? '⚡ Overcame It' : story.category === 'issue' ? '✓ Resolved' : '✓ Done'}
                        </motion.button>
                    )}
                </div>

                {/* Tap zones */}
                <div onClick={e => { e.stopPropagation(); onPrev(); }} style={{ position: 'absolute', left: 0, top: 60, bottom: 60, width: '28%', zIndex: 15, cursor: 'pointer' }} />
                <div onClick={e => { e.stopPropagation(); onNext(); }} style={{ position: 'absolute', right: 0, top: 60, bottom: 60, width: '28%', zIndex: 15, cursor: 'pointer' }} />
            </motion.div>
        </motion.div>
    );
}

// ── Category Group Bubble for PranaVerse (ONE card per category) ────────────
function UserCategoryGroupBubble({ category, stories, onOpen, isViewed, idx }: {
    category: UserStoryCategory; stories: UserTaskStory[];
    onOpen: () => void; isViewed: boolean; idx: number;
}) {
    const count = stories.length;
    const catMeta: Record<UserStoryCategory, { emoji: string; label: string; color: string; accentColor: string; ringColors: [string, string] }> = {
        task: { emoji: '✅', label: 'Tasks', color: '#4ade80', accentColor: '#22c55e', ringColors: ['#4ade80', '#86efac'] },
        challenge: { emoji: '⚡', label: 'Challenges', color: '#fb923c', accentColor: '#f97316', ringColors: ['#fb923c', '#fed7aa'] },
        idea: { emoji: '💡', label: 'Ideas', color: '#fbbf24', accentColor: '#f59e0b', ringColors: ['#fbbf24', '#fde68a'] },
        issue: { emoji: '🔥', label: 'Issues', color: '#f87171', accentColor: '#ef4444', ringColors: ['#f87171', '#fca5a5'] },
        wellness: { emoji: '🌿', label: 'Wellness', color: '#34d399', accentColor: '#10b981', ringColors: ['#34d399', '#6ee7b7'] },
    };
    const meta = catMeta[category];
    const bgImg = BG_TASK_IMAGES[category]?.[0] ?? BG_TASK_IMAGES.task[0];
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: idx * 0.05, type: 'spring', stiffness: 280, damping: 20 }}
            whileTap={{ scale: 0.91 }}
            onClick={onOpen}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', flexShrink: 0, cursor: 'pointer' }}
        >
            {/* Conic ring */}
            <div style={{
                width: 68, height: 68, borderRadius: '50%', padding: 3,
                background: isViewed ? 'rgba(255,255,255,0.08)' : `conic-gradient(${meta.ringColors[0]} 0deg,${meta.ringColors[1]} 90deg,${meta.ringColors[0]} 180deg,${meta.ringColors[1]} 270deg,${meta.ringColors[0]} 360deg)`,
                animation: isViewed ? 'none' : `videoRingPulse ${2.6 + idx * 0.28}s ease-in-out ${idx * 0.22}s infinite`,
                flexShrink: 0, position: 'relative',
            }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2.5px solid #000', overflow: 'hidden', position: 'relative', filter: isViewed ? 'grayscale(0.6) brightness(0.55)' : 'none' }}>
                    <img src={bgImg} alt={meta.label} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', filter: 'brightness(0.75) saturate(1.3)' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 20%,rgba(0,0,0,0.55) 100%)' }} />
                    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 40%,${meta.color}44 0%,transparent 72%)` }} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '1.35rem', filter: `drop-shadow(0 0 10px ${meta.color}) drop-shadow(0 0 5px ${meta.color}cc)`, opacity: isViewed ? 0.5 : 1 }}>{meta.emoji}</span>
                    </div>
                </div>
                {/* Count badge */}
                {!isViewed && (
                    <div style={{ position: 'absolute', top: 0, right: 0, background: `linear-gradient(135deg,${meta.color},${meta.accentColor})`, borderRadius: '50%', minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #000', boxShadow: `0 0 8px ${meta.color}80`, fontSize: '0.44rem', fontWeight: 800, color: '#000', paddingInline: 2, fontFamily: "'Inter',system-ui,sans-serif", zIndex: 2 }}>
                        {count}
                    </div>
                )}
            </div>
            <span style={{ fontSize: '0.46rem', fontFamily: "'Inter',sans-serif", fontWeight: 700, color: isViewed ? 'rgba(255,255,255,0.28)' : meta.color, letterSpacing: '0.05em', textAlign: 'center', maxWidth: 66, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textShadow: isViewed ? 'none' : `0 0 8px ${meta.color}80` }}>{meta.label}</span>
        </motion.div>
    );
}

// ── Time helpers ───────────────────────────────────────────────────────────────
function getTimeSlot() {
    const h = new Date().getHours();
    if (h >= 5 && h < 11) return 'morning';
    if (h >= 11 && h < 17) return 'day';
    if (h >= 17 && h < 21) return 'evening';
    return 'night';
}

const BG_IMAGES: Record<string, string[]> = {
    morning: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1400&fit=crop&q=85',
        'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&h=1400&fit=crop&q=85',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=1400&fit=crop&q=85',
        'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=800&h=1400&fit=crop&q=85',
    ],
    day: [
        'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&h=1400&fit=crop&q=85',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=1400&fit=crop&q=85',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=1400&fit=crop&q=85',
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=1400&fit=crop&q=85',
    ],
    evening: [
        'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=800&h=1400&fit=crop&q=85',
        'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&h=1400&fit=crop&q=85',
        'https://images.unsplash.com/photo-1419833173245-f59e1b93f9ee?w=800&h=1400&fit=crop&q=85',
        'https://images.unsplash.com/photo-1472120435266-53107fd0c44a?w=800&h=1400&fit=crop&q=85',
    ],
    night: [
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=1400&fit=crop&q=85',
        'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=800&h=1400&fit=crop&q=85',
        'https://images.unsplash.com/photo-1532978379173-523e16f371f2?w=800&h=1400&fit=crop&q=85',
        'https://images.unsplash.com/photo-1475274047050-1d0c0975f9f1?w=800&h=1400&fit=crop&q=85',
    ],
};

// ── Video Story definitions ─────────────────────────────────────────────────
interface VideoStory {
    id: string;
    label: string;
    icon: string;
    color: string;
    gradient: string;
    ringColors: [string, string];
    videoSrc: string;
    thumbBg: string;
    description: string;
    isVideo: true;
}

interface StorySlide {
    id: string;
    bg: string;
    accent: string;
    content: React.ReactNode;
}

interface StoryGroup {
    id: string;
    label: string;
    icon: string;
    color: string;
    gradient: string;
    ringColors: [string, string];
    slides: StorySlide[];
    isVideo?: false;
}

type AnyGroup = StoryGroup | VideoStory;

// ── Video Story Data — ALL files from /Slide Videos/ ─────────────────────────
const VIDEO_STORIES: VideoStory[] = [
    {
        id: 'v-dhyan2', label: 'Dhyan', icon: '🧘', isVideo: true,
        color: '#818cf8', gradient: 'linear-gradient(135deg,#6366f1,#4f46e5)',
        ringColors: ['#fbbf24', '#fde68a'],
        videoSrc: '/Slide%20Videos/Dhyan2.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=200&h=200&fit=crop&q=80',
        description: 'Sacred Meditation',
    },
    {
        id: 'v-dhyan4', label: 'Praana', icon: '🌸', isVideo: true,
        color: '#f472b6', gradient: 'linear-gradient(135deg,#ec4899,#be185d)',
        ringColors: ['#fbbf24', '#f472b6'],
        videoSrc: '/Slide%20Videos/Dhyan4.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&h=200&fit=crop&q=80',
        description: 'Pranic Healing',
    },
    {
        id: 'v-dhyan5', label: 'Shakti', icon: '⚡', isVideo: true,
        color: '#fbbf24', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)',
        ringColors: ['#fbbf24', '#fde68a'],
        videoSrc: '/Slide%20Videos/Dhyan5.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&q=80',
        description: 'Divine Energy',
    },
    {
        id: 'v-dhyan7', label: 'Vayuu', icon: '🌀', isVideo: true,
        color: '#a78bfa', gradient: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
        ringColors: ['#fbbf24', '#a78bfa'],
        videoSrc: '/Slide%20Videos/Dhyan7.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&q=80',
        description: 'Breath & Flow',
    },
    {
        id: 'v-dhyan10', label: 'Bodhi', icon: '🌿', isVideo: true,
        color: '#4ade80', gradient: 'linear-gradient(135deg,#22c55e,#16a34a)',
        ringColors: ['#fbbf24', '#4ade80'],
        videoSrc: '/Slide%20Videos/Dhyan10.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=200&fit=crop&q=80',
        description: 'Awakening',
    },
    {
        id: 'v-dhyan11', label: 'Ananda', icon: '✨', isVideo: true,
        color: '#e879f9', gradient: 'linear-gradient(135deg,#d946ef,#a21caf)',
        ringColors: ['#fbbf24', '#e879f9'],
        videoSrc: '/Slide%20Videos/Dhyan11.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=200&h=200&fit=crop&q=80',
        description: 'Pure Bliss',
    },
    {
        id: 'v-kedar', label: 'Kedar', icon: '🏔️', isVideo: true,
        color: '#60a5fa', gradient: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
        ringColors: ['#fbbf24', '#60a5fa'],
        videoSrc: '/Slide%20Videos/Kedar.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1455156218388-5e61b526818b?w=200&h=200&fit=crop&q=80',
        description: 'Kedarnath Yatra',
    },
    {
        id: 'v-shiva', label: 'Shiva', icon: '🔱', isVideo: true,
        color: '#c084fc', gradient: 'linear-gradient(135deg,#9333ea,#7c3aed)',
        ringColors: ['#fbbf24', '#c084fc'],
        videoSrc: '/Slide%20Videos/Shiva.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=200&h=200&fit=crop&q=80',
        description: 'Mahadev Darshan',
    },
    {
        id: 'v-om-namah', label: 'Om Shiva', icon: '🛕', isVideo: true,
        color: '#f9a8d4', gradient: 'linear-gradient(135deg,#db2777,#be185d)',
        ringColors: ['#fbbf24', '#f9a8d4'],
        videoSrc: '/Slide%20Videos/Om%20Namah%20Shivaay%F0%9F%99%8F%F0%9F%8F%BB%F0%9F%9B%95...%F0%9F%93%8D%F0%9F%93%8C%20Timbersaim%20Mahadev%20(%20Chota%20Kailash%20)%20..%23temple%20%23shiv%20%23shiva%20%23mahad.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=200&h=200&fit=crop&q=80',
        description: 'Chota Kailash',
    },
    {
        id: 'v-sandhya', label: 'Sandhya', icon: '🌅', isVideo: true,
        color: '#fb923c', gradient: 'linear-gradient(135deg,#f97316,#ea580c)',
        ringColors: ['#fbbf24', '#fb923c'],
        videoSrc: '/Slide%20Videos/SandhyaMantra.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=200&h=200&fit=crop&q=80',
        description: 'Evening Mantra',
    },
    {
        id: 'v-sacred1', label: 'Sacred', icon: '🌺', isVideo: true,
        color: '#34d399', gradient: 'linear-gradient(135deg,#10b981,#059669)',
        ringColors: ['#fbbf24', '#34d399'],
        videoSrc: '/Slide%20Videos/SaveClip.App_AQNNfA3VTBjMRS0DKZ2tv3-vhevWxwrMPZKhPI1H9xoLpaHrHIJx3ci5R1abFzFby8aZYL9-YQ5vxtaHUmwHUzuh.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=200&h=200&fit=crop&q=80',
        description: 'Sacred Moment',
    },
    {
        id: 'v-sacred2', label: 'Darshan', icon: '🔮', isVideo: true,
        color: '#818cf8', gradient: 'linear-gradient(135deg,#6366f1,#4f46e5)',
        ringColors: ['#fbbf24', '#818cf8'],
        videoSrc: '/Slide%20Videos/SaveClip.App_AQO00LBqdJg_L4Nm4P8HiJPBZYaOlGFEgj32vsgzjb3hcuQ0xDkNYBSDdt7nymEfx9ATsU9C-A_Dcr0eSO5ZVDT0g9jiaWlZ3OpxDAI.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=200&h=200&fit=crop&q=80',
        description: 'Divine Darshan',
    },
    {
        id: 'v-sacred3', label: 'Bhakti', icon: '🙏', isVideo: true,
        color: '#fde68a', gradient: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
        ringColors: ['#fbbf24', '#fde68a'],
        videoSrc: '/Slide%20Videos/SaveClip.App_AQP8N4Skw0SXoFQ7nc9oyvI7KrnvzlivBE6xiEhoNFv-pNRCjmdED51KsXE3jxoDmGBwhbCCd-jS16GMLLWwlHBi.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=200&h=200&fit=crop&q=80',
        description: 'Devotion',
    },
    {
        id: 'v-sacred4', label: 'Aarti', icon: '🪔', isVideo: true,
        color: '#f97316', gradient: 'linear-gradient(135deg,#ea580c,#c2410c)',
        ringColors: ['#fbbf24', '#f97316'],
        videoSrc: '/Slide%20Videos/SaveClip.App_AQP9f7S1Rp42JmgD6FCdl2L7_ym9OeWZ8FJt6Qc0fjXcyoCNqU6QxXZzLiTjT-5v2-16R1mzx0VAsRzyVhf-vfybov5XARoPy6RCRP4.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=200&h=200&fit=crop&q=80',
        description: 'Sacred Aarti',
    },
    {
        id: 'v-kailash10', label: 'Kailash', icon: '🏔', isVideo: true,
        color: '#93c5fd', gradient: 'linear-gradient(135deg,#60a5fa,#3b82f6)',
        ringColors: ['#fbbf24', '#93c5fd'],
        videoSrc: '/Slide%20Videos/kailash10.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1455156218388-5e61b526818b?w=200&h=200&fit=crop&q=80',
        description: 'Sacred Peaks',
    },
    {
        id: 'v-kailash11', label: 'Himalaya', icon: '❄️', isVideo: true,
        color: '#bae6fd', gradient: 'linear-gradient(135deg,#0284c7,#0369a1)',
        ringColors: ['#fbbf24', '#bae6fd'],
        videoSrc: '/Slide%20Videos/kailash11.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=200&h=200&fit=crop&q=80',
        description: 'Himalayan Peaks',
    },
    {
        id: 'v-kailash2', label: 'Mansarovar', icon: '🌊', isVideo: true,
        color: '#38bdf8', gradient: 'linear-gradient(135deg,#0ea5e9,#0284c7)',
        ringColors: ['#fbbf24', '#38bdf8'],
        videoSrc: '/Slide%20Videos/kailash2.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=200&h=200&fit=crop&q=80',
        description: 'Sacred Lake',
    },
    {
        id: 'v-kaolash12', label: 'Shivling', icon: '⛰️', isVideo: true,
        color: '#c084fc', gradient: 'linear-gradient(135deg,#9333ea,#7c3aed)',
        ringColors: ['#fbbf24', '#c084fc'],
        videoSrc: '/Slide%20Videos/kaolash12.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=200&h=200&fit=crop&q=80',
        description: 'Shiv Dham',
    },
    {
        id: 'v-sunset', label: 'Sandhya', icon: '🌇', isVideo: true,
        color: '#fb923c', gradient: 'linear-gradient(135deg,#f97316,#ea580c)',
        ringColors: ['#fbbf24', '#fb923c'],
        videoSrc: '/Slide%20Videos/sunset.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=200&h=200&fit=crop&q=80',
        description: 'Sacred Sunset',
    },
    {
        id: 'v-bhuragni', label: 'Agni', icon: '🔥', isVideo: true,
        color: '#ef4444', gradient: 'linear-gradient(135deg,#dc2626,#b91c1c)',
        ringColors: ['#fbbf24', '#ef4444'],
        videoSrc: '/Slide%20Videos/%E0%A4%AD%E0%A5%82%E0%A4%B0%E0%A4%97%E0%A5%8D%E0%A4%A8%E0%A4%AF%E0%A5%87%20%E0%A4%B8%E0%A5%8D%E0%A4%B5%E0%A4%BE%E0%A4%B9%E0%A4%BE.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&h=200&fit=crop&q=80',
        description: 'Agni Mantra',
    },
    {
        id: 'v-sriyantra', label: 'Sri Yantra', icon: '🔺', isVideo: true,
        color: '#fbbf24', gradient: 'linear-gradient(135deg,#d97706,#b45309)',
        ringColors: ['#fbbf24', '#fde68a'],
        videoSrc: '/Slide%20Videos/%F0%9F%94%B1%20%E0%A4%B6%E0%A5%8D%E0%A4%B0%E0%A5%80%20%E0%A4%AF%E0%A4%82%E0%A4%A4%E0%A5%8D%E0%A4%B0%20%E2%80%94%20%E0%A4%B8%E0%A4%BF%E0%A4%B0%E0%A5%8D%E0%A4%AB%20%E0%A4%8F%E0%A4%95%20%E0%A4%AA%E0%A5%8D%E0%A4%B0%E0%A4%A4%E0%A5%80%E0%A4%95%20%E0%A4%A8%E0%A4%B9%E0%A5%80%E0%A4%82%E2%80%A6%E0%A4%AF%E0%A5%87%20%E0%A4%B9%E0%A5%88%20%E0%A4%9A%E0%A5%87%E0%A4%A4%E0%A4%A8%E0%A4%BE%20%E0%A4%95%E0%A4%BE%20Blueprint%E0%A5%A14%20%E0%A4%A4%E0%A5%8D%E0%A4%B0%E0%A4%BF%E0%A4%95%E0%A5%8B%E0%A4%A3%20%E2%80%94%20%E0%A4%B6%E0%A4%BF%E0%A4%B5%E0%A5%A45%20%E0%A4%A4%E0%A5%8D%E0%A4%B0%E0%A4%BF%E0%A4%95%E0%A5%8B%E0%A4%A3%20%E2%80%94%20%E0%A4%B6%E0%A4%95%E0%A5%8D%E0%A4%A4%E0%A4%BF%E0%A5%A4.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=200&h=200&fit=crop&q=80',
        description: 'Sacred Geometry',
    },
];

// ── Story content helpers ────────────────────────────────────────────────────
const MANTRA_DATA = [
    { sanskrit: 'ॐ नमः शिवाय', roman: 'Om Namah Shivaya', meaning: 'I bow to Shiva — the inner self', color: '#c084fc' },
    { sanskrit: 'गायत्री मन्त्र', roman: 'Om Bhur Bhuva Swah…', meaning: 'We meditate on the divine light of the sun', color: '#fbbf24' },
    { sanskrit: 'ॐ मणि पद्मे हूँ', roman: 'Om Mani Padme Hum', meaning: 'The jewel in the lotus — compassion', color: '#a78bfa' },
    { sanskrit: 'असतो मा सद्गमय', roman: 'Asato Ma Sadgamaya', meaning: 'Lead me from untruth to truth', color: '#34d399' },
    { sanskrit: 'सर्वे भवन्तु सुखिनः', roman: 'Sarve Bhavantu Sukhinah', meaning: 'May all beings be happy', color: '#86efac' },
];
const PORTAL_DATA = [
    { title: 'AyurHealth', icon: '🌿', color: '#10b981', href: '/acharya-samvad', desc: 'AI Ayurvedacharya Pranav — your personal Vedic health guide. Prakruti analysis, Ayurvedic remedies & sacred healing wisdom available 24/7.' },
    { title: 'Meditate', icon: '🧘', color: '#3b82f6', href: '/dhyan-kshetra', desc: 'Energy Mantras & Stotras — immerse in curated sacred mantras & guided meditations for deep inner stillness and healing frequencies.' },
    { title: 'Inshorts', icon: '📰', color: '#d946ef', href: '/outplugs', desc: 'Distraction-free mindful news through a conscious lens — stay informed without noise or negativity.' },
    { title: 'Raag Music', icon: '🎵', color: '#38bdf8', href: '/project-leela', desc: 'Classical ragas matched to exact time of day — healing frequencies for every moment of your sacred journey.' },
    { title: 'Swadeshi', icon: '🛍️', color: '#f97316', href: '/swadesi-product', desc: 'Pure Organics — authentic Indian artisan products, sacred commerce that honors tradition & empowers craftsmen.' },
    { title: 'Skills', icon: '🎯', color: '#22d3ee', href: '/skills', desc: 'Upgrade & Transform — curated skill tracks from ancient Vedic arts to modern tech. Learn, grow, and evolve with expert-guided paths.' },
    { title: 'Games', icon: '🎲', color: '#ec4899', href: '/vedic-games', desc: 'Productive Play — Vedic-inspired mindful games that sharpen your mind while connecting with ancient Indian wisdom & culture.' },
    { title: 'PranaVerse', icon: '✦', color: '#a78bfa', href: '/pranaverse', desc: 'Resonance Feeds & Network — the sacred conscious social network. Share your Prana, discover wisdom reels & raise collective vibration.' },
    { title: 'Gurukul', icon: '🪔', color: '#f59e0b', href: '/vedic-sangrah', desc: "World-Class Wisdom — World's Premier Gurukul blending AI, Mathematics & Modern Sciences with Bhagavat Gita, Upanishads & Vedic wisdom." },
];


// ── Gurukul curriculum data for stories ───────────────────────────────────────
const GURUKUL_MODERN = [
    { icon: '🤖', title: 'Artificial Intelligence', sub: 'Machine Learning & Neural Networks', color: '#60a5fa' },
    { icon: '🧮', title: 'Vedic Mathematics', sub: 'Ancient Sutras meet Modern Math', color: '#34d399' },
    { icon: '💻', title: 'Programming & Coding', sub: 'Building the Digital Future', color: '#a78bfa' },
    { icon: '🔬', title: 'Modern Sciences', sub: 'Physics, Chemistry, Biology', color: '#22d3ee' },
];
const GURUKUL_ANCIENT = [
    { icon: '📖', title: 'Bhagavat Gita', sub: 'Divine Song of Eternal Dharma', color: '#fbbf24' },
    { icon: '🕉️', title: 'Upanishads', sub: 'Supreme Vedantic Philosophy', color: '#f97316' },
    { icon: '🪷', title: 'Sanskrit Vyakaran', sub: 'Language of the Gods — Panini Grammar', color: '#c084fc' },
    { icon: '🧿', title: 'Darshan Shastra', sub: 'Six Schools of Indian Philosophy', color: '#f472b6' },
    { icon: '🌿', title: 'Ayurveda & Yoga', sub: 'Science of Life & Union', color: '#4ade80' },
];

// ── GurukuklSlideContent — beautiful curriculum showcase ──────────────────────
function GurululModernSlide() {
    return (
        <div style={{ padding: '0 1.4rem', textAlign: 'center', width: '100%' }}>
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: 'spring' }}
                style={{ fontSize: '3rem', marginBottom: '0.6rem' }}>🤖</motion.div>
            <motion.h2 initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                style={{ fontFamily: "'Inter',sans-serif", fontSize: '1.05rem', fontWeight: 800, color: '#60a5fa', letterSpacing: '0.1em', textTransform: 'uppercase', textShadow: '0 0 20px rgba(96,165,250,0.7)', marginBottom: '0.3rem' }}
            >Modern Knowledge</motion.h2>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', marginBottom: '0.9rem' }}
            >Skills for the future, rooted in Bharat</motion.p>
            <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {GURUKUL_MODERN.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: `rgba(${item.color === '#60a5fa' ? '96,165,250' : item.color === '#34d399' ? '52,211,153' : item.color === '#a78bfa' ? '167,139,250' : '34,211,238'},0.08)`, border: `1px solid ${item.color}28`, borderRadius: 12, padding: '0.5rem 0.75rem', backdropFilter: 'blur(8px)' }}>
                        <span style={{ fontSize: '1.4rem', filter: `drop-shadow(0 0 8px ${item.color}88)` }}>{item.icon}</span>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: item.color, fontFamily: "'Inter',sans-serif" }}>{item.title}</div>
                            <div style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.45)', fontFamily: "'Inter',sans-serif", marginTop: 1 }}>{item.sub}</div>
                        </div>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
function GurululAncientSlide() {
    return (
        <div style={{ padding: '0 1.4rem', textAlign: 'center', width: '100%' }}>
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: 'spring' }}
                style={{ fontSize: '3rem', marginBottom: '0.6rem' }}>🕉️</motion.div>
            <motion.h2 initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.2rem', fontWeight: 700, color: '#fbbf24', letterSpacing: '0.06em', textShadow: '0 0 24px rgba(251,191,36,0.7)', marginBottom: '0.3rem' }}
            >Ancient Wisdom</motion.h2>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', fontStyle: 'italic', marginBottom: '0.9rem' }}
            >ज्ञान यज्ञ — The sacred fire of Vedic knowledge</motion.p>
            <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {GURUKUL_ANCIENT.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', background: 'rgba(251,191,36,0.06)', border: `1px solid ${item.color}22`, borderRadius: 12, padding: '0.45rem 0.7rem', backdropFilter: 'blur(8px)' }}>
                        <span style={{ fontSize: '1.3rem', filter: `drop-shadow(0 0 8px ${item.color}88)` }}>{item.icon}</span>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: item.color, fontFamily: "'Cormorant Garamond',serif" }}>{item.title}</div>
                            <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.42)', fontFamily: "'Inter',sans-serif", marginTop: 1 }}>{item.sub}</div>
                        </div>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
function GurululVisionSlide({ getImg }: { getImg: (n: number) => string }) {
    return (
        <div style={{ padding: '0 1.5rem', textAlign: 'center' }}>
            <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
                style={{ width: 88, height: 88, borderRadius: '50%', margin: '0 auto 1rem', background: 'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.35) 0%, rgba(245,158,11,0.7) 50%, rgba(245,158,11,0.35) 100%)', border: '2px solid rgba(251,191,36,0.6)', boxShadow: '0 0 48px rgba(251,191,36,0.6), 0 0 80px rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.8rem' }}
            >🏛️</motion.div>
            <motion.h2 initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.5rem', fontWeight: 700, color: '#fbbf24', textShadow: '0 0 28px rgba(251,191,36,0.8)', marginBottom: '0.5rem', lineHeight: 1.2 }}
            >World's Premier Gurukul</motion.h2>
            <motion.p initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
                style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.72)', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '1rem', padding: '0 0.5rem' }}
            >Where the wisdom of Rishi meets the intelligence of the future. The top product of conscious civilization.</motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
                style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' as const }}>
                {['AI', 'Vedas', 'Math', 'Gita', 'Startup', 'Sanskrit'].map((tag, i) => (
                    <span key={i} style={{ fontSize: '0.55rem', padding: '0.2rem 0.55rem', borderRadius: 99, background: i % 2 === 0 ? 'rgba(96,165,250,0.12)' : 'rgba(251,191,36,0.12)', border: i % 2 === 0 ? '1px solid rgba(96,165,250,0.35)' : '1px solid rgba(251,191,36,0.35)', color: i % 2 === 0 ? '#93c5fd' : '#fde68a', fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>{tag}</span>
                ))}
            </motion.div>
        </div>
    );
}
function GurululStartupSlide() {
    return (
        <div style={{ padding: '0 1.4rem', textAlign: 'center', width: '100%' }}>
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: 'spring' }}
                style={{ fontSize: '3rem', marginBottom: '0.6rem' }}>🚀</motion.div>
            <motion.h2 initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                style={{ fontFamily: "'Inter',sans-serif", fontSize: '1.05rem', fontWeight: 800, color: '#4ade80', letterSpacing: '0.1em', textTransform: 'uppercase', textShadow: '0 0 20px rgba(74,222,128,0.7)', marginBottom: '0.3rem' }}
            >Startup Support</motion.h2>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', marginBottom: '0.9rem', fontStyle: 'italic' }}
            >🌱 From idea to launch — we guide every step</motion.p>
            <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {[
                    { e: '💡', t: 'Idea Generation', d: 'Conscious-tech ideas rooted in Dharma' },
                    { e: '🛠️', t: 'Product Development', d: 'AI-powered  build & MVP creation' },
                    { e: '🚀', t: 'Launch Strategy', d: 'Go-to-market & growth strategy' },
                    { e: '🌱', t: 'Vedic Business Values', d: 'Dharmic entrepreneurship principles' },
                ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 12, padding: '0.5rem 0.75rem', backdropFilter: 'blur(8px)' }}>
                        <span style={{ fontSize: '1.2rem' }}>{item.e}</span>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#4ade80', fontFamily: "'Inter',sans-serif" }}>{item.t}</div>
                            <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.42)', fontFamily: "'Inter',sans-serif", marginTop: 1 }}>{item.d}</div>
                        </div>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
const WISDOM_QUOTES = [
    { text: '"The quiet mind is not empty — it is full of the universe."', source: 'Vedic Sutra' },
    { text: '"Yesterday I was clever. Today I am wise, I am changing myself."', source: 'Rumi' },
    { text: '"Let your actions be your temple. Let stillness be your prayer."', source: 'Bhagavad Gita' },
    { text: '"Rise before the sun, and the day belongs entirely to you."', source: 'Charaka Samhita' },
    { text: '"The moon does not fight. It waits. Patience is its mastery."', source: 'Vedic Wisdom' },
];

// ── Panchang Data ─────────────────────────────────────────────────────────────
const TITHI_NAMES = [
    'प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पंचमी',
    'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी',
    'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'पूर्णिमा',
    'प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पंचमी',
    'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी',
    'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'अमावस्या',
];
const NAKSHATRA_NAMES = [
    'अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा', 'पुनर्वसु',
    'पुष्य', 'आश्लेषा', 'मघा', 'पूर्वफाल्गुनी', 'उत्तरफाल्गुनी', 'हस्त',
    'चित्रा', 'स्वाति', 'विशाखा', 'अनुराधा', 'ज्येष्ठा', 'मूल',
    'पूर्वाषाढ़ा', 'उत्तराषाढ़ा', 'श्रवण', 'धनिष्ठा', 'शतभिषा',
    'पूर्वभाद्रपद', 'उत्तरभाद्रपद', 'रेवती',
];
const YOGA_NAMES = [
    'विष्कुंभ', 'प्रीति', 'आयुष्मान', 'सौभाग्य', 'शोभन', 'अतिगण्ड', 'सुकर्मा',
    'धृति', 'शूल', 'गण्ड', 'वृद्धि', 'ध्रुव', 'व्याघात', 'हर्षण', 'वज्र',
    'सिद्धि', 'व्यतीपात', 'वरीयान', 'परिघ', 'शिव', 'सिद्ध', 'साध्य', 'शुभ',
    'शुक्ल', 'ब्रह्म', 'इन्द्र', 'वैधृति',
];
const VAAR_NAMES = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
const VAAR_ICONS = ['☀️', '🌙', '🔴', '☿', '🪐', '⭐', '🪐'];
const VAAR_DEVATA = ['सूर्य', 'चंद्र', 'मंगल', 'बुध', 'बृहस्पति', 'शुक्र', 'शनि'];

const HINDU_FESTIVALS: Record<string, string> = {
    '2025-01-14': 'मकर संक्रांति', '2025-01-29': 'मौनी अमावस्या',
    '2025-02-02': 'बसंत पंचमी', '2025-02-12': 'माघ पूर्णिमा', '2025-02-26': 'महाशिवरात्रि',
    '2025-03-13': 'होलिका दहन', '2025-03-14': 'होली',
    '2025-03-30': 'गुड़ी पड़वा • चैत्र नवरात्रि',
    '2025-04-06': 'राम नवमी', '2025-04-12': 'हनुमान जयंती', '2025-04-13': 'चैत्र पूर्णिमा',
    '2025-04-30': 'अक्षय तृतीया',
    '2025-05-12': 'बुद्ध पूर्णिमा',
    '2025-06-11': 'गंगा दशहरा',
    '2025-07-10': 'गुरु पूर्णिमा',
    '2025-08-01': 'हरियाली तीज', '2025-08-05': 'नाग पंचमी',
    '2025-08-09': 'रक्षा बंधन', '2025-08-16': 'जन्माष्टमी', '2025-08-27': 'गणेश चतुर्थी',
    '2025-09-29': 'शारदीय नवरात्रि',
    '2025-10-02': 'दशहरा', '2025-10-20': 'दीपावली',
    '2025-10-22': 'गोवर्धन पूजा', '2025-10-23': 'भाई दूज', '2025-10-28': 'छठ पूजा',
    '2025-11-05': 'देव दीपावली', '2025-11-15': 'कार्तिक पूर्णिमा',
    '2026-02-15': 'महाशिवरात्रि', '2026-03-03': 'होलिका दहन', '2026-03-04': 'होली',
    '2026-04-19': 'अक्षय तृतीया', '2026-05-01': 'बुद्ध पूर्णिमा',
    '2026-07-29': 'गुरु पूर्णिमा', '2026-08-05': 'जन्माष्टमी',
};
const ANNUAL_FESTIVALS: Record<string, string> = {
    '01-14': 'मकर संक्रांति', '01-26': 'गणतंत्र दिवस',
    '08-15': 'स्वतंत्रता दिवस', '10-02': 'गांधी जयंती',
};

function toJulianDay(d: Date): number {
    const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1;
    const day = d.getUTCDate() + d.getUTCHours() / 24;
    const A = Math.floor((14 - m) / 12);
    const Y = y + 4800 - A, M = m + 12 * A - 3;
    return day + Math.floor((153 * M + 2) / 5) + 365 * Y +
        Math.floor(Y / 4) - Math.floor(Y / 100) + Math.floor(Y / 400) - 32045;
}

function computeDailyPanchang(date: Date) {
    const jd = toJulianDay(date);
    const T = (jd - 2451545.0) / 36525.0;
    // Sun & Moon mean longitudes
    let sunLon = ((280.46646 + 36000.76983 * T) % 360 + 360) % 360;
    let moonLon = ((218.3165 + 481267.8813 * T) % 360 + 360) % 360;
    // Tithi from elongation (each tithi = 12°)
    const elongation = ((moonLon - sunLon) % 360 + 360) % 360;
    const tithiIdx = Math.floor(elongation / 12) % 30;
    const tithi = TITHI_NAMES[tithiIdx];
    const paksha = tithiIdx < 15 ? 'शुक्ल पक्ष ☽' : 'कृष्ण पक्ष 🌑';
    // Nakshatra (each = 360/27°)
    const nakIdx = Math.floor(((moonLon % 360 + 360) % 360) / (360 / 27)) % 27;
    const nakshatra = NAKSHATRA_NAMES[nakIdx];
    // Yoga ((sun+moon) / (360/27))
    const yogaLon = ((sunLon + moonLon) % 360 + 360) % 360;
    const yoga = YOGA_NAMES[Math.floor(yogaLon / (360 / 27)) % 27];
    // Vaar
    const dow = date.getDay();
    const vaar = VAAR_NAMES[dow], vaarIcon = VAAR_ICONS[dow], vaarDevata = VAAR_DEVATA[dow];
    // Vikram Samvat (new year ~Chaitra = April)
    const y = date.getFullYear(), mo = date.getMonth(), dy = date.getDate();
    const samvat = (mo > 3 || (mo === 3 && dy >= 1)) ? y + 57 : y + 56;
    // Festival
    const mmdd = `${String(mo + 1).padStart(2, '0')}-${String(dy).padStart(2, '0')}`;
    const festival = HINDU_FESTIVALS[`${y}-${mmdd}`] || ANNUAL_FESTIVALS[mmdd] || null;
    return { tithi, paksha, nakshatra, yoga, vaar, vaarIcon, vaarDevata, samvat, festival };
}

function useTimeImages() {
    const slot = getTimeSlot();
    const imgs = BG_IMAGES[slot];
    const day = new Date().getDate();
    return (offset = 0) => imgs[(day + offset) % imgs.length];
}

// ── Slide content components ─────────────────────────────────────────────────
function MantraSlideContent({ m }: { m: typeof MANTRA_DATA[0] }) {
    return (
        <div style={{ padding: '0 2rem', textAlign: 'center' }}>
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                style={{ fontSize: '4.5rem', marginBottom: '1.2rem', filter: `drop-shadow(0 0 30px ${m.color})` }}>🪔</motion.div>
            <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
                style={{ fontFamily: "'Cormorant Garamond','Noto Serif Devanagari',serif", fontSize: 'clamp(1.6rem,6vw,2.2rem)', fontWeight: 600, color: m.color, textShadow: `0 0 30px ${m.color}88`, lineHeight: 1.3, marginBottom: '0.8rem' }}
            >{m.sanskrit}</motion.p>
            <motion.p initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
                style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', fontStyle: 'italic', letterSpacing: '0.04em', marginBottom: '0.5rem' }}
            >{m.roman}</motion.p>
            <motion.p initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
                style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)' }}
            >{m.meaning}</motion.p>
        </div>
    );
}
function WisdomSlideContent({ q }: { q: typeof WISDOM_QUOTES[0] }) {
    return (
        <div style={{ padding: '0 1.5rem', textAlign: 'center' }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring' }}
                style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>✦</motion.div>
            <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(1.2rem,4.5vw,1.5rem)', fontWeight: 500, color: 'rgba(255,255,255,0.92)', textShadow: '0 0 30px rgba(251,191,36,0.3)', lineHeight: 1.55, marginBottom: '1rem', fontStyle: 'italic' }}
            >{q.text}</motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
                style={{ fontSize: '0.7rem', color: 'rgba(251,191,36,0.65)', letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >— {q.source}</motion.p>
        </div>
    );
}
function PortalSlideContent({ p }: { p: typeof PORTAL_DATA[0] }) {
    return (
        <div style={{ padding: '0 1.5rem', textAlign: 'center', width: '100%' }}>
            <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
                style={{ width: 90, height: 90, borderRadius: '50%', margin: '0 auto 1.2rem', background: `radial-gradient(circle at 38% 32%, rgba(255,255,255,0.35) 0%, ${p.color}88 50%, ${p.color}44 100%)`, border: `2px solid ${p.color}66`, boxShadow: `0 0 40px ${p.color}66, 0 0 80px ${p.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}
            >{p.icon}</motion.div>
            <h3 style={{ color: p.color, fontFamily: "'Inter',sans-serif", fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.12em', textShadow: `0 0 20px ${p.color}88`, marginBottom: '0.5rem' }}>{p.title}</h3>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: '1.5rem', padding: '0 0.5rem' }}>{p.desc}</p>
            <Link href={p.href} style={{ textDecoration: 'none' }}>
                <motion.div whileTap={{ scale: 0.96 }} style={{ display: 'inline-block', padding: '0.65rem 2rem', borderRadius: 99, background: `linear-gradient(135deg, ${p.color}, ${p.color}bb)`, color: '#fff', fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.06em', textTransform: 'uppercase', boxShadow: `0 6px 24px ${p.color}55` }}>Enter Portal →</motion.div>
            </Link>
        </div>
    );
}

// ── Panchang Slide Content ──────────────────────────────────────────────────
function PanchangSlideContent({ panchang }: { panchang: ReturnType<typeof computeDailyPanchang> }) {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const rows = [
        { label: 'तिथि', value: panchang.tithi, icon: '🌙', color: '#a78bfa' },
        { label: 'पक्ष', value: panchang.paksha, icon: '☽', color: '#93c5fd' },
        { label: 'नक्षत्र', value: panchang.nakshatra, icon: '⭐', color: '#34d399' },
        { label: 'योग', value: panchang.yoga, icon: '✦', color: '#f472b6' },
    ];
    return (
        <div style={{ padding: '0 1.4rem', textAlign: 'center', width: '100%' }}>
            {/* Festival banner */}
            {panchang.festival && (
                <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.08 }}
                    style={{ background: 'linear-gradient(135deg,rgba(251,191,36,0.22),rgba(245,158,11,0.12))', border: '1px solid rgba(251,191,36,0.50)', borderRadius: 12, padding: '0.4rem 0.9rem', marginBottom: '0.75rem', display: 'inline-block' }}>
                    <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700, letterSpacing: '0.04em', fontFamily: "'Noto Serif Devanagari',serif" }}>🪔 {panchang.festival}</span>
                </motion.div>
            )}
            {/* Vaar */}
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.12, type: 'spring', stiffness: 220 }}
                style={{ fontSize: '2.2rem', marginBottom: '0.1rem' }}>{panchang.vaarIcon}</motion.div>
            <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                style={{ fontFamily: "'Noto Serif Devanagari','Cormorant Garamond',serif", fontSize: '1.65rem', fontWeight: 700, color: '#fbbf24', textShadow: '0 0 28px rgba(251,191,36,0.65)', marginBottom: '0.1rem', lineHeight: 1.2 }}>
                {panchang.vaar}
            </motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }}
                style={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginBottom: '0.85rem', fontFamily: "'Inter',sans-serif" }}>
                {dateStr}
            </motion.p>
            {/* Panchang grid */}
            <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.32 }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '0.8rem' }}>
                {rows.map(({ label, value, icon, color }) => (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.055)', border: `1px solid ${color}28`, borderRadius: 12, padding: '0.45rem 0.35rem', backdropFilter: 'blur(10px)' }}>
                        <div style={{ fontSize: '0.78rem', marginBottom: '0.1rem' }}>{icon}</div>
                        <div style={{ fontSize: '0.44rem', color: 'rgba(255,255,255,0.38)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Inter',sans-serif", marginBottom: '0.18rem' }}>{label}</div>
                        <div style={{ fontFamily: "'Noto Serif Devanagari',serif", fontSize: '0.76rem', fontWeight: 700, color, lineHeight: 1.25 }}>{value}</div>
                    </div>
                ))}
            </motion.div>
            {/* Devata + Samvat */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.52 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap' as const }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 99, padding: '0.28rem 0.8rem' }}>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.50)', fontFamily: "'Noto Serif Devanagari',serif" }}>देवता: {panchang.vaarDevata}</span>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.22)', borderRadius: 99, padding: '0.28rem 0.8rem' }}>
                    <span style={{ fontSize: '0.62rem' }}>🕉️</span>
                    <span style={{ fontFamily: "'Noto Serif Devanagari',serif", fontSize: '0.65rem', color: 'rgba(251,191,36,0.85)', fontWeight: 600 }}>वि. सं. {panchang.samvat}</span>
                </div>
            </motion.div>
        </div>
    );
}

// ── Video Bubble — shows live video preview through circular window ───────────
function VideoBubble({ story, isViewed, idx }: { story: VideoStory; isViewed: boolean; idx: number }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        v.muted = true;
        v.playsInline = true;
        // Start playing from a random time for visual variety
        v.currentTime = (idx * 7) % 30;
        v.play().catch(() => { });
    }, [idx]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
            {/* Live video preview */}
            <video
                ref={videoRef}
                src={story.videoSrc}
                style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: 'cover', objectPosition: 'center',
                    filter: isViewed ? 'grayscale(0.6) brightness(0.55)' : 'brightness(0.88) saturate(1.1)',
                }}
                muted playsInline loop autoPlay
            />
            {/* Subtle dark gradient from bottom */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.55) 100%)',
                borderRadius: '50%',
            }} />
            {/* Icon overlay center  */}
            <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 2,
            }}>
                <span style={{ fontSize: '1.1rem', filter: `drop-shadow(0 0 8px ${story.color})`, opacity: isViewed ? 0.5 : 1 }}>{story.icon}</span>
            </div>
            {/* Small play badge */}
            {!isViewed && (
                <div style={{
                    position: 'absolute', bottom: 2, right: 2,
                    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
                    borderRadius: '50%', width: 14, height: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.3)',
                }}>
                    <span style={{ fontSize: '0.35rem', marginLeft: 1, color: '#fff' }}>▶</span>
                </div>
            )}
        </div>
    );
}

// ── Full-Screen VIDEO Story Viewer ────────────────────────────────────────────
function VideoStoryViewer({ story, allVideoStories, startIdx, onClose, onFinished }: {
    story: VideoStory; allVideoStories: VideoStory[]; startIdx: number;
    onClose: () => void;
    onFinished?: () => void; // called after last video — to chain into image stories
}) {
    const [currentIdx, setCurrentIdx] = useState(startIdx);
    const [direction, setDirection] = useState(1);
    const [progress, setProgress] = useState(0);
    const [muted, setMuted] = useState(false);
    const [heartActive, setHeartActive] = useState(false);
    const [loveActive, setLoveActive] = useState(false);
    const [heartCount, setHeartCount] = useState(842);
    const [loveCount, setLoveCount] = useState(315);
    const videoRef = useRef<HTMLVideoElement>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const progressRef = useRef(0);
    const VIDEO_DURATION = 30000;

    const current = allVideoStories[currentIdx];
    const pranaLabel = { morning: '🌅 Morning Prana', day: '☀️ Noon Prana', evening: '🪔 Sandhya Prana', night: '🌙 Night Prana' }[getTimeSlot()];

    const clearTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

    const goNext = useCallback(() => {
        clearTimer(); setProgress(0); progressRef.current = 0; setDirection(1);
        if (currentIdx < allVideoStories.length - 1) {
            setCurrentIdx(i => i + 1);
        } else {
            // After last video — chain into image stories if handler provided, else close
            if (onFinished) onFinished();
            else onClose();
        }
    }, [currentIdx, allVideoStories.length, onClose, onFinished]);

    const goPrev = useCallback(() => {
        clearTimer(); setProgress(0); progressRef.current = 0; setDirection(-1);
        if (currentIdx > 0) setCurrentIdx(i => i - 1);
    }, [currentIdx]);

    useEffect(() => {
        clearTimer();
        progressRef.current = 0;
        setProgress(0);
        const tick = 100;
        timerRef.current = setInterval(() => {
            const v = videoRef.current;
            if (v && v.duration) {
                const pct = (v.currentTime / v.duration) * 100;
                progressRef.current = pct;
                setProgress(pct);
                if (pct >= 99) goNext();
            } else {
                progressRef.current += (tick / VIDEO_DURATION) * 100;
                setProgress(progressRef.current);
                if (progressRef.current >= 100) goNext();
            }
        }, tick);
        return clearTimer;
    }, [currentIdx, goNext]);

    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        v.muted = muted;
        v.currentTime = 0;
        v.play().catch(() => { });
    }, [currentIdx, muted]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose, goNext, goPrev]);

    if (!current) return null;

    const fmtCount = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '')}k` : String(n);

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 10001, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
            <style>{`
                @keyframes goldPulse{0%,100%{opacity:0.7}50%{opacity:1}}
                @keyframes shimmerRing{0%{filter:hue-rotate(0deg) brightness(1.1)}100%{filter:hue-rotate(30deg) brightness(1.3)}}
                @keyframes reactionPop{0%{transform:scale(1)}40%{transform:scale(1.45)}70%{transform:scale(0.9)}100%{transform:scale(1)}}
            `}</style>
            <div style={{ position: 'relative', width: '100%', maxWidth: 480, height: '100vh', overflow: 'hidden' }}>
            <AnimatePresence initial={false} mode="sync">
            <motion.div
                key={currentIdx}
                initial={{ y: direction >= 0 ? '100%' : '-100%' }}
                animate={{ y: 0 }}
                exit={{ y: direction >= 0 ? '-100%' : '100%' }}
                transition={{ duration: 0.32, ease: [0.25, 0.8, 0.25, 1] }}
                style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
            >
                <video
                    ref={videoRef}
                    src={current.videoSrc}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    muted={muted} playsInline autoPlay loop
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.75) 0%, transparent 28%, transparent 60%, rgba(0,0,0,0.82) 100%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center 65%, ${current.color}18 0%, transparent 65%)`, pointerEvents: 'none' }} />

                {/* ── Progress bars ── */}
                <div style={{ position: 'absolute', top: 14, left: 12, right: 12, display: 'flex', gap: 3, zIndex: 20 }}>
                    {allVideoStories.map((_, i) => (
                        <div key={i} style={{ flex: 1, height: 2.5, background: 'rgba(255,255,255,0.22)', borderRadius: 2, overflow: 'hidden' }}>
                            <motion.div style={{
                                height: '100%',
                                background: `linear-gradient(90deg, ${current.color}, #fbbf24)`,
                                width: i < currentIdx ? '100%' : i === currentIdx ? `${Math.min(progress, 100)}%` : '0%',
                                borderRadius: 2,
                            }} />
                        </div>
                    ))}
                </div>

                {/* ── Header ── */}
                <div style={{ position: 'absolute', top: 26, left: 14, right: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 42, height: 42, borderRadius: '50%',
                            background: current.gradient,
                            border: `2px solid ${current.color}88`,
                            boxShadow: `0 0 16px ${current.color}88`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.2rem', overflow: 'hidden', position: 'relative',
                        }}>
                            <video src={current.videoSrc} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} muted playsInline autoPlay loop />
                            <span style={{ position: 'relative', zIndex: 1 }}>{current.icon}</span>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', fontFamily: "'Inter',sans-serif", textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}>{current.label}</div>
                            <div style={{ fontSize: '0.58rem', color: `${current.color}cc`, letterSpacing: '0.06em', fontFamily: "'Inter',sans-serif" }}>{current.description} · PranaVerse</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setMuted(m => !m)} style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 36, height: 36, color: '#fff', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{muted ? '🔇' : '🔊'}</button>
                        <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 36, height: 36, color: '#fff', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>
                </div>

                {/* ── Bottom info overlay ── */}
                <div style={{ position: 'absolute', bottom: '10%', left: '1rem', right: '5.5rem', zIndex: 20 }}>
                    <motion.div key={`info-${currentIdx}`} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', border: `1px solid ${current.color}44`, borderRadius: 99, padding: '0.2rem 0.7rem', marginBottom: '0.6rem' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: current.color, boxShadow: `0 0 8px ${current.color}` }} />
                            <span style={{ fontSize: '0.52rem', color: current.color, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Inter',sans-serif" }}>⚡ {pranaLabel} · PranaVerse</span>
                        </div>
                        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(1.6rem,6vw,2.2rem)', fontWeight: 600, color: '#fff', textShadow: '0 2px 20px rgba(0,0,0,0.8)', marginBottom: '0.3rem', lineHeight: 1.2 }}>{current.label}</h2>
                        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.72)', fontStyle: 'italic', letterSpacing: '0.03em' }}>{current.description}</p>
                    </motion.div>
                </div>

                {/* ── Right action bar — ❤️ and 😍 only ── */}
                <div style={{ position: 'absolute', right: '0.75rem', bottom: '14%', display: 'flex', flexDirection: 'column', gap: '1.1rem', alignItems: 'center', zIndex: 20 }}>
                    {/* Heart reaction */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <motion.button
                            whileTap={{ scale: 0.82 }}
                            onClick={() => {
                                setHeartActive(a => !a);
                                setHeartCount(c => heartActive ? c - 1 : c + 1);
                            }}
                            style={{
                                background: heartActive ? 'rgba(239,68,68,0.25)' : 'rgba(0,0,0,0.45)',
                                backdropFilter: 'blur(12px)',
                                border: heartActive ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.15)',
                                borderRadius: 16, width: 48, height: 48,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', fontSize: '1.35rem',
                                animation: heartActive ? 'reactionPop 0.4s ease' : 'none',
                            }}
                        >
                            {heartActive ? '❤️' : '🤍'}
                        </motion.button>
                        <span style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.65)', fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>{fmtCount(heartCount)}</span>
                    </div>
                    {/* Love / Adore reaction */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <motion.button
                            whileTap={{ scale: 0.82 }}
                            onClick={() => {
                                setLoveActive(a => !a);
                                setLoveCount(c => loveActive ? c - 1 : c + 1);
                            }}
                            style={{
                                background: loveActive ? 'rgba(251,191,36,0.22)' : 'rgba(0,0,0,0.45)',
                                backdropFilter: 'blur(12px)',
                                border: loveActive ? '1px solid rgba(251,191,36,0.55)' : '1px solid rgba(255,255,255,0.15)',
                                borderRadius: 16, width: 48, height: 48,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', fontSize: '1.35rem',
                                animation: loveActive ? 'reactionPop 0.4s ease' : 'none',
                            }}
                        >
                            {loveActive ? '😍' : '🤩'}
                        </motion.button>
                        <span style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.65)', fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>{fmtCount(loveCount)}</span>
                    </div>
                </div>

                {/* ── Tap zones ── */}
                <div onClick={goPrev} style={{ position: 'absolute', left: 0, top: 0, width: '38%', height: '100%', zIndex: 15, cursor: 'pointer' }} />
                <div onClick={goNext} style={{ position: 'absolute', right: 0, top: 0, width: '38%', height: '100%', zIndex: 15, cursor: 'pointer' }} />

                {/* ── Story dots ── */}
                <div style={{ position: 'absolute', bottom: '5%', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4, zIndex: 20, maxWidth: '80vw', flexWrap: 'nowrap', overflow: 'hidden' }}>
                    {allVideoStories.slice(Math.max(0, currentIdx - 4), currentIdx + 5).map((s, i) => {
                        const realIdx = i + Math.max(0, currentIdx - 4);
                        return (
                            <button key={s.id} onClick={() => { setCurrentIdx(realIdx); setProgress(0); progressRef.current = 0; }} style={{ width: realIdx === currentIdx ? 18 : 5, height: 5, borderRadius: 3, background: realIdx === currentIdx ? '#fbbf24' : 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer', transition: 'all 0.25s', padding: 0, flexShrink: 0 }} />
                        );
                    })}
                </div>
            </motion.div>
            </AnimatePresence>
            </div>
        </motion.div>
    );
}

// ── Full-Screen IMAGE Story Viewer (existing groups) ──────────────────────────
const SLIDE_DURATION = 7000;
function StoryViewer({ groups, startGroupIdx, onClose, onFinished }: { groups: StoryGroup[]; startGroupIdx: number; onClose: () => void; onFinished?: () => void }) {
    const [gIdx, setGIdx] = useState(startGroupIdx);
    const [sIdx, setSIdx] = useState(0);
    const [direction, setDirection] = useState(1);
    const [progress, setProgress] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const progressRef = useRef(0);
    const group = groups[gIdx];
    const slide = group?.slides[sIdx];
    const totalSlides = group?.slides.length ?? 1;

    const clearTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };
    const goNext = useCallback(() => {
        clearTimer(); setProgress(0); progressRef.current = 0; setDirection(1);
        if (sIdx < totalSlides - 1) setSIdx(s => s + 1);
        else if (gIdx < groups.length - 1) { setGIdx(g => g + 1); setSIdx(0); }
        else { if (onFinished) onFinished(); else onClose(); }
    }, [sIdx, totalSlides, gIdx, groups.length, onClose]);
    const goPrev = useCallback(() => {
        clearTimer(); setProgress(0); progressRef.current = 0; setDirection(-1);
        if (sIdx > 0) setSIdx(s => s - 1);
        else if (gIdx > 0) { setGIdx(g => g - 1); setSIdx(0); }
    }, [sIdx, gIdx]);

    useEffect(() => {
        clearTimer(); progressRef.current = 0; setProgress(0);
        const tick = 80;
        timerRef.current = setInterval(() => {
            progressRef.current += (tick / SLIDE_DURATION) * 100;
            setProgress(progressRef.current);
            if (progressRef.current >= 100) goNext();
        }, tick);
        return clearTimer;
    }, [gIdx, sIdx, goNext]);

    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose, goNext, goPrev]);

    useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);

    if (!group || !slide) return null;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 480, height: '100vh', overflow: 'hidden' }}>
            <AnimatePresence initial={false} mode="sync">
                <motion.div key={`${gIdx}-${sIdx}`}
                    initial={{ x: direction >= 0 ? '100%' : '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: direction >= 0 ? '-100%' : '100%' }}
                    transition={{ duration: 0.28, ease: [0.25, 0.8, 0.25, 1] }}
                    style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                    <img src={slide.bg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.45) 70%, rgba(0,0,0,0.88) 100%)' }} />
                    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center 65%, ${slide.accent}22 0%, transparent 65%)` }} />
                    {/* Progress bars */}
                    <div style={{ position: 'absolute', top: 14, left: 12, right: 12, display: 'flex', gap: 4, zIndex: 20 }}>
                        {group.slides.map((_, i) => (
                            <div key={i} style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.25)', borderRadius: 2, overflow: 'hidden' }}>
                                <motion.div style={{ height: '100%', background: `linear-gradient(90deg,${group.color},#fbbf24)`, width: i < sIdx ? '100%' : i === sIdx ? `${Math.min(progress, 100)}%` : '0%', borderRadius: 2 }} />
                            </div>
                        ))}
                    </div>
                    {/* Header */}
                    <div style={{ position: 'absolute', top: 28, left: 14, right: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: group.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', boxShadow: `0 0 16px ${group.color}66`, border: '2px solid rgba(255,255,255,0.35)' }}>{group.icon}</div>
                            <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', fontFamily: "'Inter',sans-serif" }}>{group.label}</div>
                                <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.55)' }}>{sIdx + 1} of {totalSlides}</div>
                            </div>
                        </div>
                        <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 36, height: 36, color: '#fff', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>
                    {/* Content */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                        <div style={{ width: '100%', marginTop: '3rem' }}>
                            {slide.content}
                        </div>
                    </div>
                    {/* Group dots */}
                    <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 20 }}>
                        {groups.map((g, i) => (
                            <button key={g.id} onClick={() => { setGIdx(i); setSIdx(0); }} style={{ width: i === gIdx ? 20 : 6, height: 6, borderRadius: 3, background: i === gIdx ? '#fff' : 'rgba(255,255,255,0.35)', border: 'none', cursor: 'pointer', transition: 'all 0.25s', padding: 0 }} />
                        ))}
                    </div>
                    <div onClick={e => { e.stopPropagation(); goPrev(); }} style={{ position: 'absolute', left: 0, top: 0, width: '40%', height: '100%', zIndex: 15, cursor: 'pointer' }} />
                    <div onClick={e => { e.stopPropagation(); goNext(); }} style={{ position: 'absolute', right: 0, top: 0, width: '40%', height: '100%', zIndex: 15, cursor: 'pointer' }} />
                </motion.div>
            </AnimatePresence>
            </div>
        </motion.div>
    );
}

// ── Main HomeStoryBar ─────────────────────────────────────────────────────────
export default function HomeStoryBar() {
    const getImg = useTimeImages();
    const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
    const [activeGroupIdx, setActiveGroupIdx] = useState<number | null>(null);
    const [activeVideoIdx, setActiveVideoIdx] = useState<number | null>(null);
    const [activeUserTaskIdx, setActiveUserTaskIdx] = useState<number | null>(null);
    const { tasks, removeTask } = useDailyTasks();

    const userTaskStories = React.useMemo(() => buildUserTaskStories(tasks), [tasks]);

    // Build image story groups
    const todayPanchang = computeDailyPanchang(new Date());
    const imageGroups: StoryGroup[] = [
        {
            id: 'panchang', label: 'Cosmic Date', icon: '☀️', color: '#fbbf24',
            gradient: 'linear-gradient(135deg,#f59e0b,#d97706)',
            ringColors: ['#fbbf24', '#fde68a'],
            slides: [
                { id: 'p1', bg: getImg(0), accent: '#fbbf24', content: <PanchangSlideContent panchang={todayPanchang} /> },
                { id: 'p2', bg: getImg(1), accent: '#fde68a', content: <WisdomSlideContent q={WISDOM_QUOTES[0]} /> },
            ],
        },
        {
            id: 'mantras', label: 'Mantras', icon: '🪔', color: '#c084fc',
            gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)',
            ringColors: ['#fbbf24', '#e879f9'],
            slides: MANTRA_DATA.map((m, i) => ({ id: `m${i}`, bg: getImg(i), accent: m.color, content: <MantraSlideContent m={m} /> })),
        },
        {
            id: 'wisdom', label: 'Wisdom', icon: '📿', color: '#f472b6',
            gradient: 'linear-gradient(135deg,#ec4899,#be185d)',
            ringColors: ['#fbbf24', '#fbcfe8'],
            slides: WISDOM_QUOTES.map((q, i) => ({ id: `w${i}`, bg: getImg(i % 4), accent: '#f472b6', content: <WisdomSlideContent q={q} /> })),
        },
        ...PORTAL_DATA.map((portal, pi) => ({
            id: `portal-${portal.title}`, label: portal.title, icon: portal.icon, color: portal.color,
            gradient: `linear-gradient(135deg,${portal.color},${portal.color}99)`,
            ringColors: [portal.color, '#fbbf24'] as [string, string],
            slides: [{ id: `portal-${pi}-s1`, bg: getImg(pi % 4), accent: portal.color, content: <PortalSlideContent p={portal} /> }],
        })),
        // ── Gurukul — 3-slide story: Vision + Modern + Ancient ──
        {
            id: 'gurukul', label: 'Gurukul', icon: '🪔', color: '#f59e0b',
            gradient: 'linear-gradient(135deg,#f59e0b,#d97706)',
            ringColors: ['#fbbf24', '#fb923c'] as [string, string],
            slides: [
                { id: 'gk-vision', bg: getImg(1), accent: '#fbbf24', content: <GurululVisionSlide getImg={getImg} /> },
                { id: 'gk-modern', bg: getImg(2), accent: '#60a5fa', content: <GurululModernSlide /> },
                { id: 'gk-startup', bg: getImg(3), accent: '#4ade80', content: <GurululStartupSlide /> },
                { id: 'gk-ancient', bg: getImg(0), accent: '#fbbf24', content: <GurululAncientSlide /> },
            ],
        },
    ];

    const openImageGroup = (idx: number) => {
        setActiveGroupIdx(idx);
        setViewedIds(v => new Set([...v, imageGroups[idx].id]));
        window.history.pushState({ pvStory: true }, '');
    };
    const openVideoStory = (idx: number) => {
        setActiveVideoIdx(idx);
        setViewedIds(v => new Set([...v, VIDEO_STORIES[idx].id]));
        window.history.pushState({ pvStory: true }, '');
    };

    const openUserTask = (idx: number) => {
        setActiveUserTaskIdx(idx);
        setViewedIds(v => new Set([...v, userTaskStories[idx].id]));
    };
    const closeUserTask = () => setActiveUserTaskIdx(null);
    const nextUserTask = () => {
        if (activeUserTaskIdx === null) return;
        if (activeUserTaskIdx < userTaskStories.length - 1) setActiveUserTaskIdx(i => i! + 1);
        else { closeUserTask(); openImageGroup(0); }
    };
    const prevUserTask = () => {
        if (activeUserTaskIdx === null) return;
        if (activeUserTaskIdx > 0) setActiveUserTaskIdx(i => i! - 1);
    };

    useEffect(() => {
        if (activeGroupIdx === null && activeVideoIdx === null && activeUserTaskIdx === null) return;
        const handler = () => { setActiveGroupIdx(null); setActiveVideoIdx(null); setActiveUserTaskIdx(null); };
        window.addEventListener('popstate', handler);
        return () => window.removeEventListener('popstate', handler);
    }, [activeGroupIdx, activeVideoIdx, activeUserTaskIdx]);

    return (
        <>
            <style>{`
                @keyframes goldenRingPulse{
                    0%,100%{box-shadow:0 0 0 0px rgba(251,191,36,0),0 0 16px 3px rgba(251,191,36,0.35);}
                    50%{box-shadow:0 0 0 2.5px rgba(251,191,36,0.9),0 0 28px 6px rgba(251,191,36,0.5);}
                }
                @keyframes videoRingPulse{
                    0%,100%{box-shadow:0 0 0 0px rgba(251,191,36,0),0 0 20px 4px rgba(251,191,36,0.4);}
                    50%{box-shadow:0 0 0 3px rgba(251,191,36,1),0 0 36px 8px rgba(251,191,36,0.65);}
                }
                @keyframes storyBubbleFloat{0%,100%{transform:translateY(0);}50%{transform:translateY(-4px);}}
                @keyframes videoShimmer{
                    0%,100%{opacity:0.85}50%{opacity:1}
                }
                .pvStoryBarScroll::-webkit-scrollbar{display:none;}
                .pvVideoRingWrapper{transition:transform 0.18s ease;}
                .pvVideoRingWrapper:active{transform:scale(0.91)!important;}
            `}</style>

            <div className="pvStoryBarScroll" style={{
                display: 'flex', gap: '0.65rem',
                padding: '0.75rem 0.85rem 0.65rem',
                overflowX: 'auto', scrollbarWidth: 'none',
                background: 'linear-gradient(180deg,rgba(0,0,0,0.94) 0%,rgba(0,0,0,0.6) 100%)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(251,191,36,0.06)',
                flexShrink: 0, alignItems: 'flex-start',
            }}>
                {/* "Add Story" */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                    <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1.5px dashed rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', cursor: 'pointer' }}>+</div>
                    <span style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em' }}>Your Story</span>
                </div>

                {/* ── USER TASK STORIES: ONE grouped card per category ── */}
                {(['task', 'challenge', 'idea', 'issue', 'wellness'] as const).map((cat, i) => {
                    const catStories = userTaskStories.filter(s => s.category === cat);
                    if (catStories.length === 0) return null;
                    return (
                        <UserCategoryGroupBubble
                            key={cat}
                            category={cat}
                            stories={catStories}
                            onOpen={() => openUserTask(userTaskStories.findIndex(s => s.category === cat))}
                            isViewed={catStories.every(s => viewedIds.has(s.id))}
                            idx={i}
                        />
                    );
                })}

                {/* Divider between user stories and cosmic/mantra stories */}
                {userTaskStories.length > 0 && (
                    <div style={{ width: 1, height: 58, background: 'rgba(251,191,36,0.18)', flexShrink: 0, alignSelf: 'center' }} />
                )}

                {/* ── IMAGE STORY BUBBLES (Cosmic Date, Mantras, Wisdom, Portals) ── */}
                {imageGroups.map((group, idx) => {
                    const isViewed = viewedIds.has(group.id);
                    const bgImg = group.slides[0]?.bg ?? '';
                    return (
                        <motion.div
                            key={group.id}
                            initial={{ opacity: 0, scale: 0.7, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: idx * 0.04, type: 'spring', stiffness: 280, damping: 20 }}
                            whileTap={{ scale: 0.91 }}
                            onClick={() => openImageGroup(idx)}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
                                flexShrink: 0, cursor: 'pointer',
                                animation: isViewed ? 'none' : `storyBubbleFloat ${3.5 + idx * 0.4}s ease-in-out ${idx * 0.15}s infinite`,
                            }}
                        >
                            <div style={{
                                width: 68, height: 68, borderRadius: '50%', padding: 3,
                                background: isViewed
                                    ? 'rgba(255,255,255,0.08)'
                                    : `conic-gradient(${group.ringColors[0]} 0deg, #fde68a 90deg, ${group.ringColors[1]} 180deg, #fde68a 270deg, ${group.ringColors[0]} 360deg)`,
                                animation: isViewed ? 'none' : `videoRingPulse ${2.6 + idx * 0.28}s ease-in-out ${idx * 0.22}s infinite, videoShimmer ${3.2 + idx * 0.2}s ease-in-out ${idx * 0.18}s infinite`,
                                flexShrink: 0, position: 'relative',
                            }}>
                                <div style={{
                                    width: '100%', height: '100%', borderRadius: '50%',
                                    border: '2.5px solid #000', overflow: 'hidden', position: 'relative',
                                    filter: isViewed ? 'grayscale(0.6) brightness(0.55)' : 'none',
                                }}>
                                    <img src={bgImg} alt={group.label} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', filter: 'brightness(0.78) saturate(1.3)' }} />
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 25%, rgba(0,0,0,0.58) 100%)' }} />
                                    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 40%, ${group.color}44 0%, transparent 72%)` }} />
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontSize: '1.25rem', filter: `drop-shadow(0 0 10px ${group.color}) drop-shadow(0 0 5px ${group.color}cc)`, opacity: isViewed ? 0.5 : 1 }}>{group.icon}</span>
                                    </div>
                                </div>
                            </div>
                            <span style={{ fontSize: '0.48rem', fontFamily: "'Inter',sans-serif", fontWeight: 700, color: isViewed ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.88)', letterSpacing: '0.04em', textAlign: 'center', maxWidth: 66, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.label}</span>
                        </motion.div>
                    );
                })}

                {/* Divider between non-video and video stories */}
                <div style={{ width: 1, height: 58, background: 'rgba(251,191,36,0.12)', flexShrink: 0, alignSelf: 'center' }} />

                {/* ── VIDEO STORY BUBBLES (after non-video) ── */}
                {VIDEO_STORIES.map((story, idx) => {
                    const isViewed = viewedIds.has(story.id);
                    return (
                        <motion.div
                            key={story.id}
                            className="pvVideoRingWrapper"
                            initial={{ opacity: 0, scale: 0.7, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: idx * 0.04, type: 'spring', stiffness: 300, damping: 22 }}
                            onClick={() => openVideoStory(idx)}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', flexShrink: 0, cursor: 'pointer', animation: isViewed ? 'none' : `storyBubbleFloat ${3.8 + idx * 0.35}s ease-in-out ${idx * 0.12}s infinite` }}
                        >
                            <div style={{
                                width: 68, height: 68, borderRadius: '50%',
                                padding: 3,
                                background: isViewed ? 'rgba(255,255,255,0.08)' : `conic-gradient(#fbbf24 0deg, #fde68a 90deg, ${story.color} 180deg, #fde68a 270deg, #fbbf24 360deg)`,
                                animation: isViewed ? 'none' : `videoRingPulse 2.4s ease-in-out ${idx * 0.22}s infinite, videoShimmer 3s ease-in-out ${idx * 0.18}s infinite`,
                                flexShrink: 0, position: 'relative',
                            }}>
                                <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2.5px solid #000', overflow: 'hidden', filter: isViewed ? 'grayscale(0.6) brightness(0.55)' : 'none' }}>
                                    <VideoBubble story={story} isViewed={isViewed} idx={idx} />
                                </div>
                                {!isViewed && (
                                    <div style={{ position: 'absolute', bottom: -1, right: -1, background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #000', boxShadow: '0 0 8px rgba(251,191,36,0.8)' }}>
                                        <span style={{ fontSize: '0.35rem', color: '#000', fontWeight: 800, marginLeft: 1 }}>▶</span>
                                    </div>
                                )}
                            </div>
                            <span style={{ fontSize: '0.48rem', fontFamily: "'Inter',sans-serif", fontWeight: 700, color: isViewed ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.88)', letterSpacing: '0.04em', textAlign: 'center', maxWidth: 66, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{story.label}</span>
                        </motion.div>
                    );
                })}

            </div>

            {/* User task story viewer */}
            <AnimatePresence>
                {activeUserTaskIdx !== null && userTaskStories.length > 0 && (
                    <UserTaskViewer
                        stories={userTaskStories}
                        currentIdx={activeUserTaskIdx}
                        onClose={closeUserTask}
                        onNext={nextUserTask}
                        onPrev={prevUserTask}
                        onRemove={removeTask}
                    />
                )}
            </AnimatePresence>

            {/* Full-screen video viewer */}
            <AnimatePresence>
                {activeVideoIdx !== null && (
                    <VideoStoryViewer
                        story={VIDEO_STORIES[activeVideoIdx]}
                        allVideoStories={VIDEO_STORIES}
                        startIdx={activeVideoIdx}
                        onClose={() => setActiveVideoIdx(null)}
                        onFinished={() => { setActiveVideoIdx(null); openImageGroup(0); }}
                    />
                )}
            </AnimatePresence>

            {/* Full-screen image story viewer */}
            <AnimatePresence>
                {activeGroupIdx !== null && (
                    <StoryViewer
                        groups={imageGroups}
                        startGroupIdx={activeGroupIdx}
                        onClose={() => setActiveGroupIdx(null)}
                        onFinished={() => { setActiveGroupIdx(null); openVideoStory(0); }}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
