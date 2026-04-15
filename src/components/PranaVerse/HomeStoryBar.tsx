'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useDailyTasks, type TaskItem } from '@/hooks/useDailyTasks';
import { BODHI_DEFAULT_STORIES } from '@/components/HomePage/StickyTopNav';
import { MANTRA_REELS } from '@/components/PranaVerse/MantraReelFeed';
import { useDoshaEngine } from '@/hooks/useDoshaEngine';
import { useLifestyleEngine } from '@/hooks/useLifestyleEngine';

// ── User story types (mirroring StickyTopNav) ─────────────────────────
type UserStoryCategory = 'task' | 'challenge' | 'idea' | 'issue' | 'wellness' | 'log';

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
            log: { emoji: t.icon || '📓', color: '#60a5fa', accentColor: '#3b82f6', bgGradient: 'linear-gradient(135deg,#001020,#002040)', ringColors: ['#60a5fa', '#93c5fd'], sublabel: `Log ${num}` },
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
                width: 86, height: 86, borderRadius: '50%', padding: 3,
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
                        fontSize: '1.55rem',
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
                        borderRadius: '50%', width: 20, height: 20,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid #000',
                        boxShadow: `0 0 8px ${story.color}80`,
                        fontSize: '0.55rem',
                    }}>
                        <span style={{ fontSize: '0.45rem' }}>{story.category === 'task' ? '✓' : story.category === 'idea' ? '★' : story.category === 'challenge' ? '⚡' : '⚠'}</span>
                    </div>
                )}
            </div>
            <span style={{
                fontSize: '0.58rem', fontFamily: "'Inter',sans-serif", fontWeight: 700,
                color: isViewed ? 'rgba(255,255,255,0.28)' : story.color,
                letterSpacing: '0.04em', textAlign: 'center',
                maxWidth: 86, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
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
    log: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&h=600&fit=crop&q=80',
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
            <style>{`
                @keyframes storyFill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
            `}</style>
            <motion.div
                onClick={e => e.stopPropagation()}
                initial={{ scale: 0.94 }} animate={{ scale: 1 }} exit={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                style={{ position: 'relative', width: '100%', maxWidth: 480, height: '100dvh', overflow: 'hidden', background: '#000' }}
            >
                {/* BG Image — crossfade on story change */}
                <AnimatePresence initial={false}>
                    <motion.div
                        key={bgImg}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.82)' }}
                    />
                </AnimatePresence>
                {/* Color mood overlay */}
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg, ${story.accentColor}28 0%, transparent 40%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.65) 100%)` }} />

                {/* Progress bars — CSS animation: zero re-renders */}
                <div style={{ position: 'absolute', top: 14, left: 12, right: 12, display: 'flex', gap: 4, zIndex: 20 }}>
                    {stories.map((_, i) => (
                        <div key={i} style={{ flex: 1, height: 2.5, borderRadius: 2, background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
                            <div
                                key={`${i}-${story.id}`}
                                onAnimationEnd={i === currentIdx ? onNext : undefined}
                                style={{
                                    height: '100%',
                                    background: `linear-gradient(90deg,${story.color},#fbbf24)`,
                                    borderRadius: 2,
                                    transformOrigin: 'left center',
                                    transform: i < currentIdx ? 'scaleX(1)' : i === currentIdx ? undefined : 'scaleX(0)',
                                    animation: i === currentIdx ? 'storyFill 10s linear forwards' : 'none',
                                }}
                            />
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
                            onClick={e => { e.stopPropagation(); if (story.category !== 'log') onRemove(story.taskId); onNext(); }}
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
                            {story.category === 'log' ? '✨ Beautiful Practice!' : story.category === 'challenge' ? '⚡ Overcame It' : story.category === 'issue' ? '✓ Resolved' : '✓ Done'}
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
        log: { emoji: '📓', label: 'Logs', color: '#60a5fa', accentColor: '#3b82f6', ringColors: ['#60a5fa', '#93c5fd'] },
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
                width: 86, height: 86, borderRadius: '50%', padding: 3,
                background: isViewed ? 'rgba(255,255,255,0.08)' : `conic-gradient(${meta.ringColors[0]} 0deg,${meta.ringColors[1]} 90deg,${meta.ringColors[0]} 180deg,${meta.ringColors[1]} 270deg,${meta.ringColors[0]} 360deg)`,
                animation: isViewed ? 'none' : `videoRingPulse ${2.6 + idx * 0.28}s ease-in-out ${idx * 0.22}s infinite`,
                flexShrink: 0, position: 'relative',
            }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2.5px solid #000', overflow: 'hidden', position: 'relative', filter: isViewed ? 'grayscale(0.6) brightness(0.55)' : 'none' }}>
                    <img src={bgImg} alt={meta.label} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', filter: 'brightness(0.75) saturate(1.3)' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 20%,rgba(0,0,0,0.55) 100%)' }} />
                    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 40%,${meta.color}44 0%,transparent 72%)` }} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '1.55rem', filter: `drop-shadow(0 0 10px ${meta.color}) drop-shadow(0 0 5px ${meta.color}cc)`, opacity: isViewed ? 0.5 : 1 }}>{meta.emoji}</span>
                    </div>
                </div>
                {/* Count badge */}
                {!isViewed && (
                    <div style={{ position: 'absolute', top: 0, right: 0, background: `linear-gradient(135deg,${meta.color},${meta.accentColor})`, borderRadius: '50%', minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #000', boxShadow: `0 0 8px ${meta.color}80`, fontSize: '0.44rem', fontWeight: 800, color: '#000', paddingInline: 2, fontFamily: "'Inter',system-ui,sans-serif", zIndex: 2 }}>
                        {count}
                    </div>
                )}
            </div>
            <span style={{ fontSize: '0.52rem', fontFamily: "'Inter',sans-serif", fontWeight: 700, color: isViewed ? 'rgba(255,255,255,0.28)' : meta.color, letterSpacing: '0.04em', textAlign: 'center', maxWidth: 86, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textShadow: isViewed ? 'none' : `0 0 8px ${meta.color}80` }}>{meta.label}</span>
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

// ── Prakriti Story Slide ──────────────────────────────────────────────────────
const PRAKRITI_INFO: Record<string, {
    emoji: string; color: string; secondColor: string; gradient: string;
    essence: string; tagline: string; qualities: string[];
}> = {
    Vata: {
        emoji: '🌬️', color: '#a78bfa', secondColor: '#c084fc',
        gradient: 'linear-gradient(135deg,#4c1d95,#7c3aed)',
        essence: 'Swift · Creative · Luminous',
        tagline: 'Woven from the forces of Air & Space',
        qualities: ['Extraordinary intuition', 'Artistic vision', 'Effortless grace', 'Rapid thought', 'Sensitive spirit'],
    },
    Pitta: {
        emoji: '🔥', color: '#fb923c', secondColor: '#fbbf24',
        gradient: 'linear-gradient(135deg,#7c2d12,#c2410c)',
        essence: 'Sharp · Focused · Radiant',
        tagline: 'Forged from the forces of Fire & Water',
        qualities: ['Natural leader', 'Precise intellect', 'Fierce determination', 'Transformative power', 'Magnetic presence'],
    },
    Kapha: {
        emoji: '🌿', color: '#34d399', secondColor: '#6ee7b7',
        gradient: 'linear-gradient(135deg,#064e3b,#065f46)',
        essence: 'Steady · Nurturing · Eternal',
        tagline: 'Rooted in the forces of Earth & Water',
        qualities: ['Deep compassion', 'Unshakeable stability', 'Boundless endurance', 'Loyal heart', 'Sacred patience'],
    },
};

function PrakritiSlideContent({ prakriti, userName }: { prakriti: string; userName: string }) {
    const info = PRAKRITI_INFO[prakriti] ?? PRAKRITI_INFO.Vata;
    return (
        <div style={{ padding: '0 1.5rem', textAlign: 'center', width: '100%' }}>
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 220 }}
                style={{ fontSize: '3.5rem', marginBottom: '0.5rem', filter: `drop-shadow(0 0 28px ${info.color}99)` }}>
                {info.emoji}
            </motion.div>
            <motion.p initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '0.58rem', fontWeight: 700, color: info.color, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.2rem', textShadow: `0 0 16px ${info.color}88` }}>
                Your Prakriti
            </motion.p>
            <motion.h2 initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.28 }}
                style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(1.6rem,6vw,2.1rem)', fontWeight: 700, color: '#fff', textShadow: `0 0 32px ${info.color}66, 0 2px 12px rgba(0,0,0,0.8)`, marginBottom: '0.15rem', lineHeight: 1.15 }}>
                {prakriti} Prakriti
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.38 }}
                style={{ fontSize: '0.72rem', color: info.color, fontStyle: 'italic', letterSpacing: '0.04em', marginBottom: '0.18rem', textShadow: `0 0 12px ${info.color}66` }}>
                {info.essence}
            </motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.44 }}
                style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.42)', letterSpacing: '0.06em', marginBottom: '0.85rem', fontStyle: 'italic' }}>
                {info.tagline}
            </motion.p>
            <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.52 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {info.qualities.map((q, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: `${info.color}0d`, border: `1px solid ${info.color}28`, borderRadius: 10, padding: '0.35rem 0.75rem', backdropFilter: 'blur(8px)' }}>
                        <span style={{ fontSize: '0.55rem', color: info.color, fontWeight: 800, letterSpacing: '0.04em', fontFamily: "'Inter',sans-serif" }}>✦</span>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.82)', fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic' }}>{q}</span>
                    </div>
                ))}
            </motion.div>
            {userName && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                    style={{ marginTop: '0.75rem', fontSize: '0.56rem', color: 'rgba(255,255,255,0.28)', fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', letterSpacing: '0.06em' }}>
                    — For {userName}, with love ✦
                </motion.p>
            )}
        </div>
    );
}

// ── Discover Prakriti Fallback Slide ─────────────────────────────────────────
function DiscoverPrakritiContent({ userName }: { userName: string }) {
    return (
        <div style={{ padding: '0 1.5rem', textAlign: 'center', width: '100%' }}>
            <motion.div animate={{ scale: [1, 1.15, 1], rotate: [0, 8, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: '3.8rem', marginBottom: '0.5rem', filter: 'drop-shadow(0 0 32px #a78bfa99)' }}>
                🌿
            </motion.div>
            <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
                style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '0.56rem', fontWeight: 700, color: '#a78bfa', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '0.25rem', textShadow: '0 0 16px #a78bfa88' }}>
                Ayurvedic Identity
            </motion.p>
            <motion.h2 initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
                style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(1.5rem,5.5vw,2rem)', fontWeight: 700, color: '#fff', textShadow: '0 0 32px #a78bfa66, 0 2px 12px rgba(0,0,0,0.8)', marginBottom: '0.35rem', lineHeight: 1.2 }}>
                Discover Your Prakriti
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.38 }}
                style={{ fontSize: '0.72rem', color: '#a78bfa', fontStyle: 'italic', letterSpacing: '0.04em', marginBottom: '0.9rem' }}>
                Vata · Pitta · Kapha — your cosmic blueprint
            </motion.p>
            <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.48 }}
                style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 14, padding: '0.8rem 1rem', backdropFilter: 'blur(8px)', marginBottom: '1rem' }}>
                <p style={{ margin: 0, fontFamily: "'Cormorant Garamond',serif", fontSize: '0.85rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.78)', lineHeight: 1.65, textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
                    &ldquo;The knowledge of Prakriti is the mirror through which you see your truest self — your elemental nature, your gifts, your sacred path.&rdquo;
                </p>
            </motion.div>
            <motion.a href="/lifestyle/prakriti" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                style={{ display: 'inline-block', padding: '0.75rem 2rem', borderRadius: 50, background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', border: 'none', color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'none', fontFamily: "'Inter',sans-serif", boxShadow: '0 6px 28px rgba(124,58,237,0.45)' }}>
                Begin Your Quiz ✦
            </motion.a>
            {userName && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}
                    style={{ marginTop: '0.65rem', fontSize: '0.54rem', color: 'rgba(255,255,255,0.25)', fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic' }}>
                    — A sacred gift for {userName}
                </motion.p>
            )}
        </div>
    );
}

// ── Mood Story Slide ──────────────────────────────────────────────────────────
const MOOD_STORY_INFO: Record<string, { emoji: string; color: string; gradient: string; message: string; affirmation: string }> = {
    great: { emoji: '😄', color: '#fbbf24', gradient: 'linear-gradient(135deg,#78350f,#d97706)', message: 'You are vibrating high today!', affirmation: 'Your radiance is contagious. Channel this golden energy into creation and watch the universe mirror it back.' },
    good: { emoji: '🙂', color: '#4ade80', gradient: 'linear-gradient(135deg,#064e3b,#059669)', message: 'A steady, grounded day', affirmation: 'Balance is your superpower. You are exactly where you need to be — rooted, present, and whole.' },
    okay: { emoji: '😐', color: '#60a5fa', gradient: 'linear-gradient(135deg,#1e3a5f,#2563eb)', message: 'Neutral is wisdom', affirmation: 'The still lake reflects the stars most clearly. Your quiet calm is itself a profound form of strength.' },
    low: { emoji: '😔', color: '#a78bfa', gradient: 'linear-gradient(135deg,#2e1065,#7c3aed)', message: 'Be gentle with yourself', affirmation: 'Even the moon wanes before it shines again. Honor your shadows — they carry seeds of your next blossoming.' },
    stressed: { emoji: '😤', color: '#f87171', gradient: 'linear-gradient(135deg,#450a0a,#b91c1c)', message: 'Your nervous system needs care', affirmation: 'Breathe deep into your belly. Every exhale releases what no longer serves you. You are safe. You are held.' },
};

function MoodStoryContent({ mood, energy, userName }: { mood: string; energy: number; userName: string }) {
    const info = MOOD_STORY_INFO[mood] ?? MOOD_STORY_INFO.okay;
    const energyBars = Math.min(5, Math.max(1, energy));
    return (
        <div style={{ padding: '0 1.5rem', textAlign: 'center', width: '100%' }}>
            <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 4, -4, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: '3.8rem', marginBottom: '0.6rem', filter: `drop-shadow(0 0 28px ${info.color}99)` }}>
                {info.emoji}
            </motion.div>
            <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.18 }}
                style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '0.58rem', fontWeight: 700, color: info.color, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.2rem', textShadow: `0 0 14px ${info.color}88` }}>
                Today&rsquo;s Mood
            </motion.p>
            <motion.h2 initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.26 }}
                style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(1.4rem,5.5vw,1.9rem)', fontWeight: 700, color: '#fff', textShadow: `0 0 28px ${info.color}55, 0 2px 12px rgba(0,0,0,0.8)`, marginBottom: '0.4rem', lineHeight: 1.2 }}>
                {info.message}
            </motion.h2>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.34 }}
                style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: '0.9rem' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} style={{ width: 22, height: 6, borderRadius: 3, background: i < energyBars ? info.color : 'rgba(255,255,255,0.12)', boxShadow: i < energyBars ? `0 0 8px ${info.color}88` : 'none', transition: 'all 0.3s' }} />
                ))}
                <span style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter',sans-serif", marginLeft: 4, alignSelf: 'center' }}>Energy</span>
            </motion.div>
            <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.42 }}
                style={{ background: `${info.color}0d`, border: `1px solid ${info.color}28`, borderRadius: 14, padding: '0.8rem 1rem', backdropFilter: 'blur(8px)' }}>
                <p style={{ margin: 0, fontFamily: "'Cormorant Garamond',serif", fontSize: '0.88rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.82)', lineHeight: 1.65, textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
                    &ldquo;{info.affirmation}&rdquo;
                </p>
            </motion.div>
            {userName && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.62 }}
                    style={{ marginTop: '0.65rem', fontSize: '0.54rem', color: 'rgba(255,255,255,0.28)', fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', letterSpacing: '0.06em' }}>
                    — For {userName} ✦ PranaVerse
                </motion.p>
            )}
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
    const scrollerRef = useRef<HTMLDivElement>(null);
    const [currentIdx, setCurrentIdx] = useState(startIdx);
    const [progress, setProgress] = useState(0);
    const [muted, setMuted] = useState(false);
    const [heartActive, setHeartActive] = useState(false);
    const [loveActive, setLoveActive] = useState(false);
    const [heartCount, setHeartCount] = useState(842);
    const [loveCount, setLoveCount] = useState(315);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const progressRef = useRef(0);
    const VIDEO_DURATION = 30000;

    const current = allVideoStories[currentIdx];
    const pranaLabel = { morning: '🌅 Morning Prana', day: '☀️ Noon Prana', evening: '🪔 Sandhya Prana', night: '🌙 Night Prana' }[getTimeSlot()];

    const clearTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

    // Initialize scroll position on mount safely after render
    useEffect(() => {
        if (scrollerRef.current && startIdx > 0) {
            scrollerRef.current.scrollTop = startIdx * scrollerRef.current.clientHeight;
        }
    }, [startIdx]);

    const handleScroll = () => {
        if (!scrollerRef.current) return;
        const center = scrollerRef.current.scrollTop + scrollerRef.current.clientHeight / 2;
        const idx = Math.floor(center / scrollerRef.current.clientHeight);
        if (idx !== currentIdx && idx >= 0 && idx < allVideoStories.length) {
            setCurrentIdx(idx);
        }
    };

    const goNext = useCallback(() => {
        if (currentIdx < allVideoStories.length - 1) {
            if (scrollerRef.current) scrollerRef.current.scrollTo({ top: (currentIdx + 1) * scrollerRef.current.clientHeight, behavior: 'instant' as ScrollBehavior });
        } else {
            if (onFinished) onFinished(); else onClose();
        }
    }, [currentIdx, allVideoStories.length, onClose, onFinished]);

    const goPrev = useCallback(() => {
        if (currentIdx > 0) {
            if (scrollerRef.current) scrollerRef.current.scrollTo({ top: (currentIdx - 1) * scrollerRef.current.clientHeight, behavior: 'instant' as ScrollBehavior });
        }
    }, [currentIdx]);

    useEffect(() => {
        clearTimer(); progressRef.current = 0; setProgress(0);
        const tick = 100;
        timerRef.current = setInterval(() => {
            const v = videoRefs.current[currentIdx];
            if (v && v.duration) {
                const pct = (v.currentTime / v.duration) * 100;
                progressRef.current = pct; setProgress(pct);
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
        videoRefs.current.forEach((v, i) => {
            if (!v) return;
            v.muted = muted;
            if (i === currentIdx) { v.currentTime = 0; v.play().catch(() => { }); }
            else { v.pause(); v.currentTime = 0; }
        });
    }, [currentIdx, muted]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') goPrev();
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose, goNext, goPrev]);

    if (!current) return null;
    const fmtCount = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '')}k` : String(n);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 10001, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <style>{`
                @keyframes goldPulse{0%,100%{opacity:0.7}50%{opacity:1}}
                @keyframes shimmerRing{0%{filter:hue-rotate(0deg) brightness(1.1)}100%{filter:hue-rotate(30deg) brightness(1.3)}}
                @keyframes reactionPop{0%{transform:scale(1)}40%{transform:scale(1.45)}70%{transform:scale(0.9)}100%{transform:scale(1)}}
            `}</style>

            <div ref={scrollerRef} onScroll={handleScroll} style={{
                position: 'absolute', inset: 0,
                width: '100vw', height: '100svh',
                overflowY: 'scroll',
                scrollSnapType: 'y mandatory',
                WebkitOverflowScrolling: 'touch',
                /* Only handle vertical pan — horizontal taps are for prev/next, not page nav */
                touchAction: 'pan-y',
                /* No rubber-band at top/bottom — eliminates edge flicker */
                overscrollBehavior: 'contain',
                scrollbarWidth: 'none',
                display: 'flex', flexDirection: 'column',
                /* GPU compositing on the scroll container */
                transform: 'translateZ(0)',
                willChange: 'scroll-position',
                WebkitTapHighlightColor: 'transparent',
            }}>
                {allVideoStories.map((s, idx) => {
                    const isActiveOrNear = Math.abs(idx - currentIdx) <= 1;
                    return (
                        <div key={s.id} style={{
                            position: 'relative', width: '100%', height: '100svh',
                            flexShrink: 0, scrollSnapAlign: 'start', scrollSnapStop: 'always',
                            display: 'flex', justifyContent: 'center', background: '#000',
                            /* Per-slide GPU layer — no paint on scroll */
                            transform: 'translateZ(0)',
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            willChange: 'transform',
                        }}>
                            <div style={{ position: 'relative', width: '100%', maxWidth: 480, height: '100%' }}>
                                {/* Skeleton placeholder — always rendered to preserve scroll width */}
                                {!isActiveOrNear && (
                                    <div style={{ position: 'absolute', inset: 0, background: s.gradient }} />
                                )}
                                {isActiveOrNear && (
                                    <>
                                        {/* ── Video: active=auto, adjacent=metadata for fast preload ── */}
                                        <video
                                            ref={el => { videoRefs.current[idx] = el; }}
                                            src={s.videoSrc}
                                            preload={idx === currentIdx ? 'auto' : 'metadata'}
                                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'translateZ(0)', willChange: 'transform' }}
                                            muted={muted}
                                            playsInline
                                            loop
                                        />
                                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.75) 0%, transparent 28%, transparent 60%, rgba(0,0,0,0.82) 100%)', pointerEvents: 'none' }} />
                                        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center 65%, ${s.color}18 0%, transparent 65%)`, pointerEvents: 'none' }} />

                                        {/* ── Overlay UI (only on active slide to avoid multiple overlapping UIs) ── */}
                                        {idx === currentIdx && (
                                            <>
                                                <div style={{ position: 'absolute', top: 26, left: 14, right: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <div style={{ width: 42, height: 42, borderRadius: '50%', background: s.gradient, border: `2px solid ${s.color}88`, boxShadow: `0 0 16px ${s.color}88`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', overflow: 'hidden', position: 'relative' }}>
                                                            <span style={{ position: 'relative', zIndex: 1 }}>{s.icon}</span>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', fontFamily: "'Inter',sans-serif", textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}>{s.label}</div>
                                                            <div style={{ fontSize: '0.58rem', color: `${s.color}cc`, letterSpacing: '0.06em', fontFamily: "'Inter',sans-serif" }}>{s.description} · PranaVerse</div>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <button onClick={() => setMuted(m => !m)} style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 36, height: 36, color: '#fff', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{muted ? '🔇' : '🔊'}</button>
                                                        <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 36, height: 36, color: '#fff', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                                                    </div>
                                                </div>

                                                <div style={{ position: 'absolute', bottom: '10%', left: '1rem', right: '5.5rem', zIndex: 20, pointerEvents: 'none' }}>
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', border: `1px solid ${s.color}44`, borderRadius: 99, padding: '0.2rem 0.7rem', marginBottom: '0.6rem' }}>
                                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
                                                        <span style={{ fontSize: '0.52rem', color: s.color, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Inter',sans-serif" }}>⚡ {pranaLabel} · PranaVerse</span>
                                                    </div>
                                                    <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(1.6rem,6vw,2.2rem)', fontWeight: 600, color: '#fff', textShadow: '0 2px 20px rgba(0,0,0,0.8)', marginBottom: '0.3rem', lineHeight: 1.2 }}>{s.label}</h2>
                                                    <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.72)', fontStyle: 'italic', letterSpacing: '0.03em' }}>{s.description}</p>
                                                </div>

                                                <div style={{ position: 'absolute', right: '0.75rem', bottom: '14%', display: 'flex', flexDirection: 'column', gap: '1.1rem', alignItems: 'center', zIndex: 20 }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                                                        <motion.button whileTap={{ scale: 0.82 }} onClick={() => { setHeartActive(a => !a); setHeartCount(c => heartActive ? c - 1 : c + 1); }} style={{ background: heartActive ? 'rgba(239,68,68,0.25)' : 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)', border: heartActive ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.15)', borderRadius: 16, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.35rem', animation: heartActive ? 'reactionPop 0.4s ease' : 'none' }}>{heartActive ? '❤️' : '🤍'}</motion.button>
                                                        <span style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.65)', fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>{fmtCount(heartCount)}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                                                        <motion.button whileTap={{ scale: 0.82 }} onClick={() => { setLoveActive(a => !a); setLoveCount(c => loveActive ? c - 1 : c + 1); }} style={{ background: loveActive ? 'rgba(251,191,36,0.22)' : 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)', border: loveActive ? '1px solid rgba(251,191,36,0.55)' : '1px solid rgba(255,255,255,0.15)', borderRadius: 16, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.35rem', animation: loveActive ? 'reactionPop 0.4s ease' : 'none' }}>{loveActive ? '😍' : '🤩'}</motion.button>
                                                        <span style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.65)', fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>{fmtCount(loveCount)}</span>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                                {/* ── Tap zones: left=prev, right=next (mirrors image StoryViewer) ── */}
                                <div onClick={(e) => { e.stopPropagation(); goPrev(); }} style={{ position: 'absolute', left: 0, top: 60, bottom: 80, width: '30%', zIndex: 19, cursor: 'pointer' }} />
                                <div onClick={(e) => { e.stopPropagation(); goNext(); }} style={{ position: 'absolute', right: 0, top: 60, bottom: 80, width: '30%', zIndex: 19, cursor: 'pointer' }} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Global Top Progress Bar outside scroll container ── */}
            <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, display: 'flex', gap: 3, zIndex: 100, padding: '0 12px', boxSizing: 'border-box', pointerEvents: 'none' }}>
                {allVideoStories.map((_, i) => (
                    <div key={i} style={{ flex: 1, height: 2.5, background: 'rgba(255,255,255,0.22)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            background: `linear-gradient(90deg, ${current.color}, #fbbf24)`,
                            width: i < currentIdx ? '100%' : i === currentIdx ? `${Math.min(progress, 100)}%` : '0%',
                            borderRadius: 2,
                            transition: i === currentIdx ? 'none' : undefined,
                        }} />
                    </div>
                ))}
            </div>

            <div style={{ position: 'absolute', bottom: '5%', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4, zIndex: 100, maxWidth: '80vw', flexWrap: 'nowrap', overflow: 'hidden' }}>
                {allVideoStories.slice(Math.max(0, currentIdx - 4), currentIdx + 5).map((s, i) => {
                    const realIdx = i + Math.max(0, currentIdx - 4);
                    return (
                        <button key={s.id} onClick={() => { if (scrollerRef.current) scrollerRef.current.scrollTo({ top: realIdx * scrollerRef.current.clientHeight, behavior: 'smooth' }); }} style={{ width: realIdx === currentIdx ? 18 : 5, height: 5, borderRadius: 3, background: realIdx === currentIdx ? '#fbbf24' : 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer', transition: 'all 0.25s', padding: 0, flexShrink: 0 }} />
                    );
                })}
            </div>
        </motion.div>
    );
}

// ── Full-Screen IMAGE Story Viewer (existing groups) ──────────────────────────
const SLIDE_DURATION = 7000;
function StoryViewer({ groups, startGroupIdx, onClose, onFinished }: { groups: StoryGroup[]; startGroupIdx: number; onClose: () => void; onFinished?: () => void }) {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const flatSlides = useMemo(() => {
        const arr: { group: StoryGroup, slide: typeof groups[0]['slides'][0], gIdx: number, sIdx: number }[] = [];
        groups.forEach((g, gIdx) => g.slides.forEach((s, sIdx) => arr.push({ group: g, slide: s, gIdx, sIdx })));
        return arr;
    }, [groups]);

    const initialIdx = useMemo(() => flatSlides.findIndex(f => f.gIdx === startGroupIdx && f.sIdx === 0), [flatSlides, startGroupIdx]);
    const [currentIdx, setCurrentIdx] = useState(initialIdx !== -1 ? initialIdx : 0);
    const [progress, setProgress] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const progressRef = useRef(0);

    const currentFlat = flatSlides[currentIdx];
    const { group, slide, gIdx, sIdx } = currentFlat || { group: groups[0], slide: groups[0]?.slides[0], gIdx: 0, sIdx: 0 };
    const totalSlidesForGroup = group?.slides.length ?? 1;

    // Initialize scroll position on mount (once only — don't re-run on each currentIdx change
    // as it fights user swipe events and causes jitter)
    useEffect(() => {
        if (scrollerRef.current && initialIdx > 0) {
            requestAnimationFrame(() => {
                if (scrollerRef.current) {
                    scrollerRef.current.scrollLeft = initialIdx * scrollerRef.current.clientWidth;
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleScroll = () => {
        if (!scrollerRef.current) return;
        const W = scrollerRef.current.clientWidth;
        const center = scrollerRef.current.scrollLeft + W / 2;
        const idx = Math.floor(center / W);
        if (idx !== currentIdx && idx >= 0 && idx < flatSlides.length) {
            setCurrentIdx(idx);
            setProgress(0); progressRef.current = 0;
        }
    };

    const clearTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

    const goNext = useCallback(() => {
        if (currentIdx < flatSlides.length - 1) {
            const W = scrollerRef.current?.clientWidth ?? window.innerWidth;
            if (scrollerRef.current) scrollerRef.current.scrollTo({ left: (currentIdx + 1) * W, behavior: 'instant' as ScrollBehavior });
        } else {
            if (onFinished) onFinished(); else onClose();
        }
    }, [currentIdx, flatSlides.length, onClose, onFinished]);

    const goPrev = useCallback(() => {
        if (currentIdx > 0) {
            const W = scrollerRef.current?.clientWidth ?? window.innerWidth;
            if (scrollerRef.current) scrollerRef.current.scrollTo({ left: (currentIdx - 1) * W, behavior: 'instant' as ScrollBehavior });
        }
    }, [currentIdx]);

    const handleTapPrev = (e: React.MouseEvent) => { e.stopPropagation(); goPrev(); };
    const handleTapNext = (e: React.MouseEvent) => { e.stopPropagation(); goNext(); };

    useEffect(() => {
        clearTimer(); progressRef.current = 0; setProgress(0);
        const tick = 80;
        timerRef.current = setInterval(() => {
            progressRef.current += (tick / SLIDE_DURATION) * 100;
            setProgress(progressRef.current);
            if (progressRef.current >= 100) goNext();
        }, tick);
        return clearTimer;
    }, [currentIdx, goNext]);

    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose, goNext, goPrev]);

    useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);

    if (!group || !slide) return null;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            {/* Native Scroll Container (Horizontal) */}
            <div
                ref={scrollerRef}
                onScroll={handleScroll}
                style={{
                    position: 'absolute', inset: 0, width: '100vw', height: '100svh',
                    display: 'flex', overflowX: 'scroll', scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
                    /* GPU compositing — eliminates paint on scroll, same as video viewer */
                    transform: 'translateZ(0)', willChange: 'scroll-position',
                }}
            >
                {flatSlides.map((f, idx) => (
                    <div key={`${f.gIdx}-${f.sIdx}`} style={{ position: 'relative', width: '100vw', height: '100svh', scrollSnapAlign: 'start', scrollSnapStop: 'always', flexShrink: 0, overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
                        <div style={{ position: 'relative', width: '100%', maxWidth: 480, height: '100%' }}>
                            {(Math.abs(idx - currentIdx) <= 1) && (
                                <>
                                    <img src={f.slide.bg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.45) 70%, rgba(0,0,0,0.88) 100%)', pointerEvents: 'none' }} />
                                    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center 65%, ${f.slide.accent}22 0%, transparent 65%)`, pointerEvents: 'none' }} />

                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
                                        <div style={{ width: '100%', marginTop: '3rem', pointerEvents: 'auto' }}>
                                            {f.slide.content}
                                        </div>
                                    </div>
                                </>
                            )}
                            <div onClick={handleTapPrev} style={{ position: 'absolute', left: 0, top: 0, width: '35%', height: '100%', zIndex: 15, cursor: 'pointer' }} />
                            <div onClick={handleTapNext} style={{ position: 'absolute', right: 0, top: 0, width: '35%', height: '100%', zIndex: 15, cursor: 'pointer' }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Fixed global UI on top of horizontal scroller ── */}
            <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, display: 'flex', gap: 4, zIndex: 100, padding: '0 12px', boxSizing: 'border-box', pointerEvents: 'none' }}>
                {group.slides.map((_, i) => (
                    <div key={i} style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.25)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: `linear-gradient(90deg,${group.color},#fbbf24)`, width: i < sIdx ? '100%' : i === sIdx ? `${Math.min(progress, 100)}%` : '0%', borderRadius: 2, transition: i === sIdx ? 'none' : undefined }} />
                    </div>
                ))}
            </div>

            <div style={{ position: 'absolute', top: 28, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 100, padding: '0 14px', boxSizing: 'border-box', pointerEvents: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: group.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', boxShadow: `0 0 16px ${group.color}66`, border: '2px solid rgba(255,255,255,0.35)' }}>{group.icon}</div>
                    <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', fontFamily: "'Inter',sans-serif", textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>{group.label}</div>
                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.55)' }}>{sIdx + 1} of {totalSlidesForGroup}</div>
                    </div>
                </div>
                <button onClick={onClose} style={{ pointerEvents: 'auto', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 36, height: 36, color: '#fff', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>

            <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 100, pointerEvents: 'none', maxWidth: 480, flexWrap: 'nowrap' }}>
                {groups.map((g, i) => {
                    const targetIdx = flatSlides.findIndex(f => f.gIdx === i && f.sIdx === 0);
                    return (
                        <button key={g.id} onClick={(e) => { e.stopPropagation(); if (scrollerRef.current && targetIdx !== -1) scrollerRef.current.scrollTo({ left: targetIdx * window.innerWidth, behavior: 'instant' as ScrollBehavior }); }} style={{ pointerEvents: 'auto', width: i === gIdx ? 20 : 6, height: 6, borderRadius: 3, background: i === gIdx ? '#fff' : 'rgba(255,255,255,0.35)', border: 'none', cursor: 'pointer', transition: 'all 0.25s', padding: 0 }} />
                    );
                })}
            </div>

        </motion.div>
    );
}

// ── MantraStoryViewer — Full-screen mantra player fused with image/video ───────
import type { MantraReel } from '@/components/PranaVerse/MantraReelFeed';

function MantraStoryViewer({
    mantras,
    startIdx,
    onClose,
    onViewed,
}: {
    mantras: MantraReel[];
    startIdx: number;
    onClose: () => void;
    onViewed: (id: string) => void;
}) {
    const [idx, setIdx] = useState(startIdx);
    const audioRef = useRef<HTMLAudioElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const reel = mantras[idx];
    const hasVideo = !!reel.videoSrc;

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    // Keyboard navigation
    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') setIdx(i => Math.min(mantras.length - 1, i + 1));
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') setIdx(i => Math.max(0, i - 1));
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [mantras.length, onClose]);

    // Auto-play when reel changes
    useEffect(() => {
        onViewed(reel.id);
        setCurrentTime(0);
        const audio = audioRef.current;
        const video = videoRef.current;
        if (audio) {
            audio.currentTime = 0;
            audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
        }
        if (video) {
            video.muted = true;
            video.currentTime = 0;
            video.play().catch(() => { });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idx, reel.id]);

    const togglePlay = () => {
        const audio = audioRef.current;
        const video = videoRef.current;
        if (!audio) return;
        // Check actual DOM state to avoid React state desync
        const actuallyPlaying = !audio.paused;
        if (actuallyPlaying) {
            audio.pause();
            video?.pause();
            setPlaying(false);
        } else {
            audio.play().then(() => { setPlaying(true); video?.play().catch(() => { }); }).catch(() => { });
        }
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{
                position: 'fixed', inset: 0, zIndex: 10003,
                background: '#000', overflow: 'hidden',
            }}
        >
            {/* Background */}
            {hasVideo ? (
                <video
                    ref={videoRef}
                    src={reel.videoSrc}
                    muted loop playsInline autoPlay
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.55) saturate(1.2)' }}
                />
            ) : (
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url(${reel.imageBg})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    filter: 'brightness(0.5) saturate(1.25)',
                    animation: 'reelBgScale 30s ease-in-out infinite alternate',
                }} />
            )}

            {/* Gradient */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 30%, transparent 55%, rgba(0,0,0,0.95) 100%)',
                pointerEvents: 'none',
            }} />

            {/* Accent glow */}
            <div style={{
                position: 'absolute', inset: 0,
                background: `radial-gradient(ellipse at 50% 30%, ${reel.color}20 0%, transparent 62%)`,
                pointerEvents: 'none',
            }} />

            {/* Top bar */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
                padding: 'calc(0.8rem + env(safe-area-inset-top)) 1rem 0.6rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.75) 0%, transparent 100%)',
            }}>
                <div>
                    <div style={{ fontSize: '0.48rem', color: reel.color, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Inter',sans-serif", textShadow: `0 0 12px ${reel.color}` }}>{reel.emoji} {reel.category}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.15rem', fontWeight: 700, color: '#fff', lineHeight: 1.2, textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}>{reel.nameHi}</div>
                </div>
                <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', width: 36, height: 36, color: '#fff', fontSize: '1.15rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>×</button>
            </div>

            {/* Slide indicators */}
            <div style={{
                position: 'absolute', top: 'calc(0.5rem + env(safe-area-inset-top))', left: '1rem', right: '1rem', zIndex: 11,
                display: 'flex', gap: 3,
            }}>
                {mantras.map((_, i) => (
                    <div key={i} onClick={() => setIdx(i)} style={{
                        flex: 1, height: 2.5, borderRadius: 99, cursor: 'pointer',
                        background: i < idx ? '#fff' : i === idx ? reel.color : 'rgba(255,255,255,0.22)',
                        boxShadow: i === idx ? `0 0 6px ${reel.color}` : 'none',
                        transition: 'all 0.25s ease',
                    }} />
                ))}
            </div>

            {/* Sanskrit text */}
            <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center', padding: '0 1.8rem', width: '100%',
                    pointerEvents: 'none',
                }}
            >
                <p style={{
                    fontFamily: "'Noto Serif Devanagari', 'Mangal', serif",
                    fontSize: 'clamp(1.1rem, 4vw, 1.5rem)',
                    fontWeight: 700, lineHeight: 1.75,
                    color: '#fff', whiteSpace: 'pre-line', margin: 0,
                    textShadow: `0 0 40px ${reel.color}88, 0 2px 12px rgba(0,0,0,0.95)`,
                }}>{reel.mantraText}</p>
                <p style={{
                    fontFamily: "'Inter',sans-serif", fontSize: '0.55rem',
                    color: 'rgba(255,255,255,0.85)', fontStyle: 'italic', marginTop: '0.7rem',
                    letterSpacing: '0.04em', textShadow: '0 1px 8px rgba(0,0,0,0.8)',
                }}>{reel.transliteration}</p>
            </motion.div>

            {/* Bottom info — meaning text + reel name */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '0 1.4rem calc(2.2rem + env(safe-area-inset-bottom))',
                background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 55%, transparent 100%)',
                pointerEvents: 'none',
            }}>
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '0.6rem', color: 'rgba(255,255,255,0.62)', fontStyle: 'italic', lineHeight: 1.65, marginBottom: '0.55rem', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
                    ✦ {reel.meaning}
                </p>
            </div>

            {/* Full-screen tap to play/pause */}
            <button onClick={togglePlay} style={{
                position: 'absolute', inset: 0, background: 'none', border: 'none', cursor: 'pointer', zIndex: 4,
            }} />

            {/* Reel progress bar — pinned to very bottom */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: 3, background: 'rgba(255,255,255,0.12)', zIndex: 8,
            }}>
                <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${reel.color}, ${reel.secondColor})`, boxShadow: `0 0 8px ${reel.color}cc`, transition: 'width 0.5s linear' }} />
            </div>

            {/* Hidden audio */}
            <audio
                ref={audioRef}
                src={reel.audioSrc}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
                onDurationChange={() => setDuration(audioRef.current?.duration || 0)}
                onEnded={() => { setPlaying(false); if (idx < mantras.length - 1) setIdx(i => i + 1); }}
            />

            {/* Swipe areas */}
            <button onClick={() => setIdx(i => Math.max(0, i - 1))} style={{ position: 'absolute', top: '20%', left: 0, width: '30%', height: '60%', background: 'none', border: 'none', cursor: 'pointer', zIndex: 5 }} />
            <button onClick={() => setIdx(i => Math.min(mantras.length - 1, i + 1))} style={{ position: 'absolute', top: '20%', right: 0, width: '30%', height: '60%', background: 'none', border: 'none', cursor: 'pointer', zIndex: 5 }} />

            <style>{`
                @keyframes reelBgScale { 0% { transform: scale(1.0); } 100% { transform: scale(1.06); } }
                @keyframes mantraGlow { 0%,100% { box-shadow: 0 0 28px var(--mc,#fbbf24)66, 0 6px 20px rgba(0,0,0,0.5); } 50% { box-shadow: 0 0 48px var(--mc,#fbbf24)aa, 0 6px 24px rgba(0,0,0,0.5); } }
            `}</style>
        </motion.div>
    );
}

// ── RectStoryCard — portrait 124×156 card for home-page rectangular story bar ──────────────
function RectStoryCard({
    icon, label, sublabel, color, ring, thumbBg, videoSrc, index = 0, isViewed, onClick,
}: {
    icon: string; label: string; sublabel: string; color: string; ring: string;
    thumbBg: string; videoSrc?: string; index?: number; isViewed?: boolean; onClick: () => void;
}) {
    const vidRef = React.useRef<HTMLVideoElement>(null);
    React.useEffect(() => { const v = vidRef.current; if (v && videoSrc) { v.currentTime = 0.5; } }, [videoSrc]);

    return (
        <motion.button
            onClick={onClick}
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.05, y: -6, transition: { duration: 0.18 } }}
            initial={{ opacity: 0, scale: 0.72, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: index * 0.04 }}
            style={{
                flexShrink: 0, width: 114, height: 148,
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                position: 'relative', borderRadius: 18, overflow: 'hidden',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                scrollSnapAlign: 'start', transform: 'translateZ(0)', willChange: 'transform',
                filter: isViewed ? 'brightness(0.55) saturate(0.5)' : 'none',
            }}
        >
            {/* Background image */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${thumbBg})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 18 }} />
            {/* Video overlay */}
            {videoSrc && (
                <video ref={vidRef} src={videoSrc} muted playsInline preload="metadata" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 18 }} />
            )}
            {/* Dark gradient */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: `linear-gradient(180deg,${color}22 0%,rgba(0,0,0,0) 28%,rgba(0,0,0,0.12) 52%,rgba(0,0,0,0.65) 80%,rgba(0,0,0,0.90) 100%)` }} />
            {/* Pulsing ring glow */}
            <motion.div
                animate={{ opacity: isViewed ? [0.2] : [0.4, 0.9, 0.4] }}
                transition={{ duration: 2.8 + index * 0.22, repeat: Infinity }}
                style={{ position: 'absolute', inset: -2, borderRadius: 20, boxShadow: `0 0 0 2px ${color}88, 0 0 28px ${color}60`, pointerEvents: 'none' }}
            />
            {/* Glass inner ring */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: 18, boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.44)', pointerEvents: 'none' }} />
            {/* Top glare */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '32%', borderRadius: '18px 18px 60% 60%', background: 'linear-gradient(180deg,rgba(255,255,255,0.28) 0%,rgba(255,255,255,0.06) 55%,transparent 100%)', pointerEvents: 'none' }} />
            {/* Icon badge */}
            <motion.div
                animate={{ scale: [1, 1.1, 1], y: [0, -2, 0] }}
                transition={{ duration: 3.2 + index * 0.35, repeat: Infinity }}
                style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: videoSrc ? 0 : 13, boxShadow: `0 0 12px ${color}70`, border: '1.5px solid rgba(255,255,255,0.44)', zIndex: 2 }}
            >
                {videoSrc ? <span style={{ fontSize: 11, color: '#fff' }}>▶</span> : icon}
            </motion.div>
            {/* Label */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 6px 9px', background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderTop: `1px solid ${color}35`, zIndex: 3 }}>
                <div style={{ fontSize: '0.43rem', fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase', color, textShadow: `0 0 8px ${color}90`, lineHeight: 1.2, marginBottom: 2 }}>{sublabel}</div>
                <div style={{ fontSize: '0.50rem', fontWeight: 600, color: 'rgba(255,255,255,0.92)', lineHeight: 1.25, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{label}</div>
            </div>
        </motion.button>
    );
}

// ── Main HomeStoryBar ─────────────────────────────────────────────────────────
export default function HomeStoryBar({ rectangular }: { rectangular?: boolean } = {}) {

    const getImg = useTimeImages();
    const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
    const [activeGroupIdx, setActiveGroupIdx] = useState<number | null>(null);
    const [activeVideoIdx, setActiveVideoIdx] = useState<number | null>(null);
    const [activeUserTaskIdx, setActiveUserTaskIdx] = useState<number | null>(null);
    const [activeMantraIdx, setActiveMantraIdx] = useState<number | null>(null);
    const { tasks, removeTask } = useDailyTasks();
    const { prakriti } = useDoshaEngine();
    const { todayMood, activeHabits, getTodayStatus, seedStarterHabits } = useLifestyleEngine();
    const [activeLogIdx, setActiveLogIdx] = useState<number | null>(null);

    useEffect(() => { if (activeHabits.length === 0) seedStarterHabits(); }, []);  // seed once on mount

    const userName = React.useMemo(() => {
        if (typeof window === 'undefined') return '';
        try {
            const cached = localStorage.getItem('onesutra_auth_v1');
            if (cached) { const p = JSON.parse(cached); if (p?.name && p.name !== 'Traveller') return p.name; }
        } catch { }
        return localStorage.getItem('vedic_user_name') || '';
    }, []);

    const userTaskStories = React.useMemo(() => buildUserTaskStories(tasks), [tasks]);

    // Build log stories from ALL active habits (completed = green, pending = blue)
    const logStories: UserTaskStory[] = React.useMemo(() => {
        const { completedIds } = getTodayStatus();
        return activeHabits.map((h) => {
            const done = completedIds.has(h.id);
            return {
                id: `log-${h.id}`,
                taskId: h.id,
                category: 'log' as UserStoryCategory,
                label: h.name.length > 12 ? h.name.slice(0, 11) + '…' : h.name,
                text: h.name,
                emoji: h.icon,
                color: done ? '#4ade80' : '#60a5fa',
                accentColor: done ? '#22c55e' : '#3b82f6',
                bgGradient: done ? 'linear-gradient(135deg,#001a0e,#002a18)' : 'linear-gradient(135deg,#001428,#002855)',
                ringColors: done ? ['#4ade80', '#86efac'] as [string, string] : ['#60a5fa', '#93c5fd'] as [string, string],
                sublabel: done ? 'Done ✔' : 'Pending',
                aiAdvice: h.description,
            };
        });
    }, [activeHabits, getTodayStatus]);

    // Build image story groups
    const todayPanchang = computeDailyPanchang(new Date());
    const prakritiKey = prakriti ? (prakriti.primary.charAt(0).toUpperCase() + prakriti.primary.slice(1)) : null;
    const prakritiInfo = prakritiKey ? (PRAKRITI_INFO[prakritiKey] ?? PRAKRITI_INFO.Vata) : null;
    const moodMap: Record<number, string> = { 5: 'great', 4: 'good', 3: 'okay', 2: 'low', 1: 'stressed' };
    const moodKey = todayMood ? moodMap[todayMood.mood] ?? 'okay' : null;
    const moodInfo = moodKey ? (MOOD_STORY_INFO[moodKey] ?? MOOD_STORY_INFO.okay) : null;

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
            id: 'prakriti',
            label: prakritiKey ? `${prakritiKey} Prakriti` : 'Prakriti',
            icon: prakritiInfo?.emoji ?? '🌿',
            color: prakritiInfo?.color ?? '#a78bfa',
            gradient: prakritiInfo?.gradient ?? 'linear-gradient(135deg,#3b0764,#7c3aed)',
            ringColors: [prakritiInfo?.color ?? '#a78bfa', prakritiInfo?.secondColor ?? '#c084fc'] as [string, string],
            slides: [
                {
                    id: 'pk1', bg: getImg(2), accent: prakritiInfo?.color ?? '#a78bfa',
                    content: prakritiKey
                        ? <PrakritiSlideContent prakriti={prakritiKey} userName={userName} />
                        : <DiscoverPrakritiContent userName={userName} />,
                },
            ],
        },
        ...(todayMood && moodInfo ? [{
            id: 'mood-today', label: 'My Mood', icon: moodInfo.emoji, color: moodInfo.color,
            gradient: moodInfo.gradient,
            ringColors: [moodInfo.color, '#fbbf24'] as [string, string],
            slides: [
                { id: 'md1', bg: getImg(3), accent: moodInfo.color, content: <MoodStoryContent mood={moodKey as string} energy={todayMood.energy} userName={userName} /> },
            ],
        }] : []),
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
        window.history.pushState({ pvStory: true }, '');
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
        const isAnyOpen = activeGroupIdx !== null || activeVideoIdx !== null || activeUserTaskIdx !== null || activeMantraIdx !== null || activeLogIdx !== null;
        if (!isAnyOpen) return;
        const handler = () => {
            setActiveGroupIdx(null);
            setActiveVideoIdx(null);
            setActiveUserTaskIdx(null);
            setActiveMantraIdx(null);
            setActiveLogIdx(null);
        };
        window.addEventListener('popstate', handler);
        return () => window.removeEventListener('popstate', handler);
    }, [activeGroupIdx, activeVideoIdx, activeUserTaskIdx, activeMantraIdx, activeLogIdx]);

    const isAnyViewerOpen = activeGroupIdx !== null || activeVideoIdx !== null || activeUserTaskIdx !== null || activeMantraIdx !== null || activeLogIdx !== null;
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);

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
                display: 'flex', gap: rectangular ? '8px' : '0.65rem',
                padding: rectangular ? '4px 0.85rem 6px' : '0.75rem 0.85rem 0.65rem',
                overflowX: 'auto', scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
                scrollSnapType: 'x mandatory',
                transform: 'translateZ(0)',
                willChange: 'scroll-position',
                touchAction: 'pan-x',
                overscrollBehaviorX: 'contain',
                WebkitTapHighlightColor: 'transparent',
                background: rectangular ? 'transparent' : 'linear-gradient(180deg,rgba(0,0,0,0.94) 0%,rgba(0,0,0,0.6) 100%)',
                backdropFilter: rectangular ? 'none' : 'blur(20px)',
                borderBottom: rectangular ? 'none' : '1px solid rgba(251,191,36,0.06)',
                flexShrink: 0, alignItems: 'flex-start',
                visibility: 'visible',
                pointerEvents: isAnyViewerOpen ? 'none' : 'auto',
                scrollBehavior: 'smooth',
            }}>
                {/* "Add Story" button — only shown in circular mode */}
                {!rectangular && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', flexShrink: 0, scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
                        <div style={{ width: 86, height: 86, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1.5px dashed rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', cursor: 'pointer' }}>+</div>
                        <span style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em' }}>Your Story</span>
                    </div>
                )}

                {/* ── USER TASK STORIES: ONE grouped card per category ── */}
                {(['task', 'challenge', 'idea', 'issue', 'wellness'] as const).map((cat, i) => {
                    const catStories = userTaskStories.filter(s => s.category === cat);
                    if (catStories.length === 0) return null;
                    const catInfo: Record<string, { icon: string; color: string; label: string; thumb: string }> = {
                        task: { icon: '📋', color: '#60a5fa', label: 'Tasks', thumb: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=450&fit=crop&q=80' },
                        challenge: { icon: '⚡', color: '#fbbf24', label: 'Challenges', thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=300&h=450&fit=crop&q=80' },
                        idea: { icon: '💡', color: '#e879f9', label: 'Ideas', thumb: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=300&h=450&fit=crop&q=80' },
                        issue: { icon: '🔧', color: '#f87171', label: 'Issues', thumb: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=300&h=450&fit=crop&q=80' },
                        wellness: { icon: '🌿', color: '#4ade80', label: 'Wellness', thumb: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=450&fit=crop&q=80' },
                    };
                    const inf = catInfo[cat];
                    return rectangular ? (
                        <RectStoryCard key={cat} icon={inf.icon} label={`${catStories.length} ${inf.label}`} sublabel="My Story" color={inf.color} ring={`conic-gradient(${inf.color},#fbbf24,${inf.color})`} thumbBg={inf.thumb} index={i} isViewed={catStories.every(s => viewedIds.has(s.id))} onClick={() => openUserTask(userTaskStories.findIndex(s => s.category === cat))} />
                    ) : (
                        <div key={cat} style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                            <UserCategoryGroupBubble category={cat} stories={catStories} onOpen={() => openUserTask(userTaskStories.findIndex(s => s.category === cat))} isViewed={catStories.every(s => viewedIds.has(s.id))} idx={i} />
                        </div>
                    );
                })}

                {/* ── LOG STORIES: completed habits today ── */}
                {logStories.length > 0 && (
                    rectangular ? (
                        <RectStoryCard icon="📓" label={`${logStories.length} Logged`} sublabel="Today's Log" color="#4ade80" ring="conic-gradient(#4ade80,#fbbf24,#4ade80)" thumbBg="https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=300&h=450&fit=crop&q=80" index={99} isViewed={logStories.every(s => viewedIds.has(s.id))} onClick={() => { setActiveLogIdx(0); setViewedIds(v => new Set([...v, logStories[0]?.id ?? ''])); window.history.pushState({ pvStory: true }, ''); }} />
                    ) : (
                        <>
                            {userTaskStories.length > 0 && <div style={{ width: 1, height: 48, background: 'rgba(96,165,250,0.2)', flexShrink: 0, alignSelf: 'center' }} />}
                            <div style={{ scrollSnapAlign: 'start', flexShrink: 0 }}>
                                <UserCategoryGroupBubble category="log" stories={logStories} onOpen={() => { setActiveLogIdx(0); setViewedIds(v => new Set([...v, logStories[0]?.id ?? ''])); window.history.pushState({ pvStory: true }, ''); }} isViewed={logStories.every(s => viewedIds.has(s.id))} idx={99} />
                            </div>
                        </>
                    )
                )}

                {/* Divider between user/log stories and cosmic/mantra stories — circles only */}
                {!rectangular && (userTaskStories.length > 0 || logStories.length > 0) && (
                    <div style={{ width: 1, height: 58, background: 'rgba(251,191,36,0.18)', flexShrink: 0, alignSelf: 'center' }} />
                )}

                {/* ── IMAGE STORY BUBBLES (Cosmic Date, Prakriti, Mood, Wisdom, Portals, Gurukul) ── */}
                {imageGroups.map((group, idx) => {
                    const isViewed = viewedIds.has(group.id);
                    const bgImg = group.slides[0]?.bg ?? '';
                    return rectangular ? (
                        <RectStoryCard key={group.id} icon={group.icon} label={group.label} sublabel={group.slides.length > 1 ? `${group.slides.length} slides` : 'Story'} color={group.color} ring={`conic-gradient(${group.ringColors[0]},#fde68a,${group.ringColors[1]})`} thumbBg={bgImg} index={idx} isViewed={isViewed} onClick={() => openImageGroup(idx)} />
                    ) : (
                        <motion.div
                            key={group.id}
                            initial={{ opacity: 0, scale: 0.7, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: idx * 0.04, type: 'spring', stiffness: 280, damping: 20 }}
                            whileTap={{ scale: 0.91 }}
                            onClick={() => openImageGroup(idx)}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', flexShrink: 0, cursor: 'pointer', scrollSnapAlign: 'start', scrollSnapStop: 'always', animation: isViewed ? 'none' : `storyBubbleFloat ${3.5 + idx * 0.4}s ease-in-out ${idx * 0.15}s infinite` }}
                        >
                            <div style={{ width: 86, height: 86, borderRadius: '50%', padding: 3, background: isViewed ? 'rgba(255,255,255,0.08)' : `conic-gradient(${group.ringColors[0]} 0deg, #fde68a 90deg, ${group.ringColors[1]} 180deg, #fde68a 270deg, ${group.ringColors[0]} 360deg)`, animation: isViewed ? 'none' : `videoRingPulse ${2.6 + idx * 0.28}s ease-in-out ${idx * 0.22}s infinite, videoShimmer ${3.2 + idx * 0.2}s ease-in-out ${idx * 0.18}s infinite`, flexShrink: 0, position: 'relative' }}>
                                <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2.5px solid #000', overflow: 'hidden', position: 'relative', filter: isViewed ? 'grayscale(0.6) brightness(0.55)' : 'none' }}>
                                    <img src={bgImg} alt={group.label} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', filter: 'brightness(0.78) saturate(1.3)' }} />
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 25%, rgba(0,0,0,0.58) 100%)' }} />
                                    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 40%, ${group.color}44 0%, transparent 72%)` }} />
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontSize: '1.25rem', filter: `drop-shadow(0 0 10px ${group.color}) drop-shadow(0 0 5px ${group.color}cc)`, opacity: isViewed ? 0.5 : 1 }}>{group.icon}</span>
                                    </div>
                                </div>
                            </div>
                            <span style={{ fontSize: '0.52rem', fontFamily: "'Inter',sans-serif", fontWeight: 700, color: isViewed ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.88)', letterSpacing: '0.04em', textAlign: 'center', maxWidth: 86, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.label}</span>
                        </motion.div>
                    );
                })}

                {/* Divider between image stories and mantra stories — circles only */}
                {!rectangular && <div style={{ width: 1, height: 58, background: 'rgba(192,132,252,0.22)', flexShrink: 0, alignSelf: 'center' }} />}

                {/* ── MANTRA STORY BUBBLES — Fused with sacred images ───────────────── */}
                {MANTRA_REELS.map((reel, idx) => {
                    const isViewed = viewedIds.has(`mantra-${reel.id}`);
                    return rectangular ? (
                        <RectStoryCard key={reel.id} icon={reel.emoji} label={reel.name.split(' ').slice(0, 3).join(' ')} sublabel="Mantra" color={reel.color} ring={`conic-gradient(${reel.color},${reel.secondColor},${reel.color})`} thumbBg={reel.imageBg} index={idx} isViewed={isViewed} onClick={() => { setActiveMantraIdx(idx); window.history.pushState({ pvStory: true }, ''); }} />
                    ) : (
                        <motion.div
                            key={reel.id}
                            initial={{ opacity: 0, scale: 0.7, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: idx * 0.035, type: 'spring', stiffness: 280, damping: 20 }}
                            whileTap={{ scale: 0.91 }}
                            onClick={() => { setActiveMantraIdx(idx); window.history.pushState({ pvStory: true }, ''); }}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
                                flexShrink: 0, cursor: 'pointer', scrollSnapAlign: 'start', scrollSnapStop: 'always',
                                animation: isViewed ? 'none' : `storyBubbleFloat ${3.5 + idx * 0.4}s ease-in-out ${idx * 0.15}s infinite`,
                            }}
                        >
                            <div style={{
                                width: 86, height: 86, borderRadius: '50%', padding: 3,
                                background: isViewed
                                    ? 'rgba(255,255,255,0.08)'
                                    : `conic-gradient(${reel.color} 0deg, ${reel.secondColor} 90deg, ${reel.color} 180deg, ${reel.secondColor} 270deg, ${reel.color} 360deg)`,
                                animation: isViewed ? 'none' : `videoRingPulse ${2.6 + idx * 0.28}s ease-in-out ${idx * 0.22}s infinite`,
                                flexShrink: 0, position: 'relative',
                            }}>
                                <div style={{
                                    width: '100%', height: '100%', borderRadius: '50%',
                                    border: '2.5px solid #000', overflow: 'hidden', position: 'relative',
                                    filter: isViewed ? 'grayscale(0.6) brightness(0.55)' : 'none',
                                }}>
                                    <img
                                        src={reel.imageBg}
                                        alt={reel.name}
                                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', filter: 'brightness(0.75) saturate(1.3)' }}
                                    />
                                    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 40%, ${reel.color}55 0%, transparent 72%)` }} />
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontSize: '1.2rem', filter: `drop-shadow(0 0 10px ${reel.color}) drop-shadow(0 0 5px ${reel.color}cc)`, opacity: isViewed ? 0.5 : 1 }}>{reel.emoji}</span>
                                    </div>
                                </div>
                                {/* Mantra badge */}
                                {!isViewed && (
                                    <div style={{
                                        position: 'absolute', bottom: -1, right: -1,
                                        background: `linear-gradient(135deg, ${reel.color}, ${reel.secondColor})`,
                                        borderRadius: '50%', width: 16, height: 16,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '2px solid #000',
                                        boxShadow: `0 0 8px ${reel.color}80`,
                                        fontSize: '0.35rem', fontWeight: 800, color: '#fff',
                                    }}>🎵</div>
                                )}
                            </div>
                            <span style={{
                                fontSize: '0.52rem', fontFamily: "'Inter',sans-serif", fontWeight: 700,
                                color: isViewed ? 'rgba(255,255,255,0.28)' : reel.color,
                                letterSpacing: '0.04em', textAlign: 'center',
                                maxWidth: 86, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                textShadow: isViewed ? 'none' : `0 0 8px ${reel.color}80`,
                            }}>{reel.name.split(' ').slice(0, 2).join(' ')}</span>
                        </motion.div>
                    );
                })}

                {/* Divider between mantra stories and video stories — circles only */}
                {!rectangular && <div style={{ width: 1, height: 58, background: 'rgba(251,191,36,0.12)', flexShrink: 0, alignSelf: 'center' }} />}

                {/* ── VIDEO STORY BUBBLES (after non-video) ── */}
                {VIDEO_STORIES.map((story, idx) => {
                    const isViewed = viewedIds.has(story.id);
                    return rectangular ? (
                        <RectStoryCard key={story.id} icon="▶" label={story.label} sublabel={story.description ?? 'Video'} color={story.color} ring={`conic-gradient(#fbbf24,${story.color},#fbbf24)`} thumbBg={story.thumbBg} videoSrc={story.videoSrc} index={idx} isViewed={isViewed} onClick={() => openVideoStory(idx)} />
                    ) : (
                        <motion.div
                            key={story.id}
                            className="pvVideoRingWrapper"
                            initial={{ opacity: 0, scale: 0.7, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: idx * 0.04, type: 'spring', stiffness: 300, damping: 22 }}
                            onClick={() => openVideoStory(idx)}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', flexShrink: 0, cursor: 'pointer', scrollSnapAlign: 'start', scrollSnapStop: 'always', animation: isViewed ? 'none' : `storyBubbleFloat ${3.8 + idx * 0.35}s ease-in-out ${idx * 0.12}s infinite` }}
                        >
                            <div style={{ width: 86, height: 86, borderRadius: '50%', padding: 3, background: isViewed ? 'rgba(255,255,255,0.08)' : `conic-gradient(#fbbf24 0deg, #fde68a 90deg, ${story.color} 180deg, #fde68a 270deg, #fbbf24 360deg)`, animation: isViewed ? 'none' : `videoRingPulse 2.4s ease-in-out ${idx * 0.22}s infinite, videoShimmer 3s ease-in-out ${idx * 0.18}s infinite`, flexShrink: 0, position: 'relative' }}>
                                <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2.5px solid #000', overflow: 'hidden', filter: isViewed ? 'grayscale(0.6) brightness(0.55)' : 'none' }}>
                                    <VideoBubble story={story} isViewed={isViewed} idx={idx} />
                                </div>
                                {!isViewed && <div style={{ position: 'absolute', bottom: -1, right: -1, background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #000', boxShadow: '0 0 8px rgba(251,191,36,0.8)' }}><span style={{ fontSize: '0.35rem', color: '#000', fontWeight: 800, marginLeft: 1 }}>▶</span></div>}
                            </div>
                            <span style={{ fontSize: '0.52rem', fontFamily: "'Inter',sans-serif", fontWeight: 700, color: isViewed ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.88)', letterSpacing: '0.04em', textAlign: 'center', maxWidth: 86, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{story.label}</span>
                        </motion.div>
                    );
                })}

            </div>

            {/* All viewers rendered via portal to document.body — escapes stacking context */}
            {isMounted && createPortal(
                <>
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

                    {/* Completed log story viewer */}
                    <AnimatePresence>
                        {activeLogIdx !== null && logStories.length > 0 && (
                            <UserTaskViewer
                                stories={logStories}
                                currentIdx={activeLogIdx}
                                onClose={() => setActiveLogIdx(null)}
                                onNext={() => {
                                    if (activeLogIdx < logStories.length - 1) setActiveLogIdx(i => i! + 1);
                                    else { setActiveLogIdx(null); openImageGroup(0); }
                                }}
                                onPrev={() => { if (activeLogIdx > 0) setActiveLogIdx(i => i! - 1); }}
                                onRemove={() => { }}
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

                    {/* Full-screen MANTRA story viewer */}
                    <AnimatePresence>
                        {activeMantraIdx !== null && (
                            <MantraStoryViewer
                                mantras={MANTRA_REELS}
                                startIdx={activeMantraIdx}
                                onClose={() => setActiveMantraIdx(null)}
                                onViewed={(id) => setViewedIds(prev => new Set([...prev, `mantra-${id}`]))}
                            />
                        )}
                    </AnimatePresence>
                </>,
                document.body
            )}
        </>
    );
}
