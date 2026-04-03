'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, X, Play, Pause, User } from 'lucide-react';
import { useDailyTasks, type TaskItem } from '@/hooks/useDailyTasks';
import { useOneSutraAuth } from '@/hooks/useOneSutraAuth';

// ── Default Bodhi stories (shown when user has no tasks/ideas/etc.) ──────────
export const BODHI_DEFAULT_STORIES: TaskItem[] = [
    {
        id: 'bodhi-default-task-1',
        text: 'Meditate 10 minutes at sunrise',
        icon: '🧘',
        colorClass: 'green',
        accentColor: '#4ade80',
        category: 'Task',
        done: false,
        aiAdvice: 'Begin with Anulom Vilom pranayama for 3 minutes before sitting still. The pre-dawn hours are the most sacred time for sadhana. Even 10 minutes can transform your entire day.',
        createdAt: Date.now() - 1000,
    },
    {
        id: 'bodhi-default-task-2',
        text: 'Drink warm water with lemon & honey',
        icon: '🍋',
        colorClass: 'yellow',
        accentColor: '#fbbf24',
        category: 'Task',
        done: false,
        aiAdvice: 'This Ayurvedic practice stimulates Agni (digestive fire) and flushes toxins accumulated during sleep. Do this before any food or coffee for maximum benefit.',
        createdAt: Date.now() - 900,
    },
    {
        id: 'bodhi-default-idea-1',
        text: 'Start a gratitude journal',
        icon: '📝',
        colorClass: 'amber',
        accentColor: '#f59e0b',
        category: 'Idea',
        done: false,
        aiAdvice: 'Write 3 things you\'re grateful for each evening — this simple practice rewires neural pathways toward positivity within 21 days. The Vedas call this practice "Dhanyata Bhavana."',
        createdAt: Date.now() - 800,
    },
    {
        id: 'bodhi-default-idea-2',
        text: 'Learn one Sanskrit shloka this week',
        icon: '🕉️',
        colorClass: 'purple',
        accentColor: '#a78bfa',
        category: 'Idea',
        done: false,
        aiAdvice: 'Sanskrit is not just a language — it is a technology of consciousness. Memorizing even one shloka a week creates a deep reservoir of wisdom accessible in moments of crisis.',
        createdAt: Date.now() - 700,
    },
    {
        id: 'bodhi-default-challenge-1',
        text: 'No social media before 10am',
        icon: '📵',
        colorClass: 'orange',
        accentColor: '#fb923c',
        category: 'Challenge',
        done: false,
        aiAdvice: 'Your morning mind is your most creative and sacred. The first 90 minutes after waking shape the neural architecture of your entire day. Guard this window fiercely.',
        createdAt: Date.now() - 600,
    },
    {
        id: 'bodhi-default-challenge-2',
        text: 'Walk barefoot on earth for 5 minutes',
        icon: '🌱',
        colorClass: 'green',
        accentColor: '#34d399',
        category: 'Challenge',
        done: false,
        aiAdvice: 'Earthing or "grounding" directly neutralizes free radicals, reduces cortisol, and brings the body\'s electromagnetic field into harmony with the Earth\'s Schumann resonance — ancient Vedic wisdom now validated by modern biophysics.',
        createdAt: Date.now() - 500,
    },
    {
        id: 'bodhi-default-issue-1',
        text: 'Feeling scattered and unfocused',
        icon: '🌀',
        colorClass: 'red',
        accentColor: '#f87171',
        category: 'Issue',
        done: false,
        aiAdvice: 'Ground yourself immediately: 5 deep belly breaths, drink warm water, then write your top 3 priorities on paper. Vata imbalance (air element excess) causes this scattered feeling — warming routines restore focus.',
        createdAt: Date.now() - 400,
    },
    {
        id: 'bodhi-default-issue-2',
        text: 'Low energy throughout the day',
        icon: '⚡',
        colorClass: 'red',
        accentColor: '#ef4444',
        category: 'Issue',
        done: false,
        aiAdvice: 'Low Ojas (vital essence) is the root cause. Sleep before 10pm for 3 nights, reduce cold foods, add ghee to your diet, and practice Bhramari pranayama for 5 minutes each morning.',
        createdAt: Date.now() - 300,
    },
];

// ── helpers ──────────────────────────────────────────────────────────────────
function videoUrl(filename: string) {
    return `/Slide%20Videos/${encodeURIComponent(filename)}`;
}
function getTimeSlot() {
    if (typeof window === 'undefined') return 'morning';
    const h = new Date().getHours();
    if (h >= 5 && h < 11) return 'morning';
    if (h >= 11 && h < 17) return 'day';
    if (h >= 17 && h < 21) return 'evening';
    return 'night';
}
const PRANA_LABEL: Record<string, string> = {
    morning: '🌅 Morning Prana',
    day: '☀️ Noon Prana',
    evening: '🪔 Sandhya Prana',
    night: '🌙 Night Prana',
};

// ── Story data ────────────────────────────────────────────────────────────────
const STORIES = [
    {
        id: 'task-planner',
        type: 'awareness' as const,
        label: 'Smart',
        sublabel: 'Planner',
        preview: '🗓️',
        ring: 'conic-gradient(from 0deg, #a78bfa, #c4b5fd, #7c3aed, #a78bfa)',
        color: '#a78bfa',
        headline: 'Smart Task Planner',
        description: "OneSUTRA's AI-powered planner aligns your tasks with your body's energy cycles — Dosha-aware scheduling that actually works.",
        cta: 'Open Planner →',
        destination: '/vedic-planner',
        bgGradient: 'linear-gradient(160deg, #080010 0%, #180038 45%, #040010 100%)',
        accentColor: '#a78bfa',
    },
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
        label: 'Gurukul',
        sublabel: 'Find Guru',
        preview: '🎓',
        ring: 'conic-gradient(from 0deg, #22c55e, #4ade80, #86efac, #22c55e)',
        color: '#4ade80',
        headline: 'Gurukul — AI + Vedas + Startup',
        description: 'World\'s Premier Gurukul — teaching AI, Mathematics & Modern Sciences alongside Bhagavat Gita, Upanishads, Sanskrit Vyakaran & Darshan. We also provide Startup Support: ideas, product development & launch.',
        cta: 'Enter Gurukul →',
        destination: '/vedic-sangrah',
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
type UserStoryCategory = 'task' | 'challenge' | 'idea' | 'issue' | 'wellness' | 'log';

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

function buildUserStories(tasks: TaskItem[], useDefaults = false): UserStory[] {
    const source = useDefaults ? BODHI_DEFAULT_STORIES : tasks.filter(t => !t.done && ['Log', 'Task', 'Challenge', 'Idea', 'Wellness', 'Issue'].includes(t.category));
    if (source.length === 0 && !useDefaults) return buildUserStories([], true);
    const counters: Record<string, number> = {};
    return source
        .filter(t => !t.done)
        .map(t => {
            const cat = t.category.toLowerCase() as UserStoryCategory;
            counters[cat] = (counters[cat] || 0) + 1;
            const num = counters[cat];
            const cfg: Record<string, { emoji: string; ring: string; color: string; accentColor: string; bgGradient: string; sublabel: string }> = {
                log: {
                    emoji: t.icon || '📓',
                    ring: 'conic-gradient(from 0deg, #ec4899, #f472b6, #fbcfe8, #ec4899)',
                    color: '#f472b6', accentColor: '#ec4899',
                    bgGradient: 'linear-gradient(160deg, #1a0010 0%, #3d002a 45%, #12000c 100%)',
                    sublabel: `Life Log ${num}`,
                },
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
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=600&fit=crop&q=80',
    ],
    challenge: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1484627147104-f5197bcd6651?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1455156218388-5e61b526818b?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1475274047050-1d0c0975f9f1?w=400&h=600&fit=crop&q=80',
    ],
    idea: [
        'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&h=600&fit=crop&q=80',
    ],
    wellness: [
        'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=400&h=600&fit=crop&q=80',
    ],
    issue: [
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1484627147104-f5197bcd6651?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1475274047050-1d0c0975f9f1?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1455156218388-5e61b526818b?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=400&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop&q=80',
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
                animate={{ opacity: [0.65, 1, 0.65] }}
                transition={{ duration: 2.5 + index * 0.3, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute', inset: 0,
                    borderRadius: 20,
                    boxShadow: `inset 0 0 0 2px rgba(255,255,255,0.55), 0 0 0 2.5px ${story.color}60, 0 10px 35px ${story.color}50, 0 4px 16px rgba(0,0,0,0.5)`,
                    pointerEvents: 'none', willChange: 'opacity',
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

// ── Category Group Bubble — ONE packed card per category ──────────────────
function CategoryGroupBubble({ category, stories, onOpen, index = 0 }: {
    category: UserStoryCategory;
    stories: UserStory[];
    onOpen: () => void;
    index?: number;
}) {
    const count = stories.length;
    if (count === 0) return null;
    const catMeta: Record<UserStoryCategory, { emoji: string; label: string; color: string; accentColor: string }> = {
        task: { emoji: '✅', label: 'Tasks', color: '#4ade80', accentColor: '#22c55e' },
        challenge: { emoji: '⚡', label: 'Challenges', color: '#fb923c', accentColor: '#f97316' },
        idea: { emoji: '💡', label: 'Ideas', color: '#fbbf24', accentColor: '#f59e0b' },
        issue: { emoji: '🔥', label: 'Issues', color: '#f87171', accentColor: '#ef4444' },
        wellness: { emoji: '🌿', label: 'Wellness', color: '#34d399', accentColor: '#10b981' },
        log: { emoji: '📓', label: 'Logs', color: '#60a5fa', accentColor: '#3b82f6' },
    };
    const meta = catMeta[category];
    const bgImg = getCategoryImage(category, 0);
    return (
        <motion.button
            onClick={onOpen}
            whileTap={{ scale: 0.93 }}
            whileHover={{ scale: 1.07, y: -5, transition: { duration: 0.22 } }}
            initial={{ opacity: 0, scale: 0.7, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22, delay: index * 0.09 }}
            style={{
                flexShrink: 0, width: 106, height: 154,
                background: 'none', border: 'none',
                padding: 0, cursor: 'pointer',
                position: 'relative', borderRadius: 22,
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                scrollSnapAlign: 'start', transform: 'translateZ(0)', willChange: 'transform',
            }}
        >
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 22 }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: 22, background: 'linear-gradient(180deg,rgba(0,0,0,0.08) 0%,rgba(0,0,0,0.06) 35%,rgba(0,0,0,0.22) 55%,rgba(0,0,0,0.68) 75%,rgba(0,0,0,0.82) 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: 16, background: `linear-gradient(160deg,${meta.color}22 0%,transparent 60%)`, mixBlendMode: 'overlay' }} />
            <motion.div
                animate={{ opacity: [0.65, 1, 0.65] }}
                transition={{ duration: 2.5 + index * 0.3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute', inset: 0, borderRadius: 16, boxShadow: `inset 0 0 0 2px rgba(255,255,255,0.60),0 0 0 2.5px ${meta.color}70,0 8px 24px ${meta.color}55,0 3px 12px rgba(0,0,0,0.5)`, pointerEvents: 'none', willChange: 'opacity' }}
            />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '30%', borderRadius: '16px 16px 50% 50%', background: 'linear-gradient(180deg,rgba(255,255,255,0.28) 0%,rgba(255,255,255,0.06) 60%,transparent 100%)', pointerEvents: 'none' }} />
            {/* Emoji holoball */}
            <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 32, height: 32, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%,rgba(255,255,255,0.55) 0%,${meta.color}50 60%,rgba(0,0,0,0.1) 100%)`, backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 3px 10px rgba(0,0,0,0.4),inset 0 1px 2px rgba(255,255,255,0.55),0 0 12px ${meta.color}70`, border: '1.5px solid rgba(255,255,255,0.45)', fontSize: 12, zIndex: 2 }}>
                {meta.emoji}
            </div>
            {/* Count badge */}
            <div style={{ position: 'absolute', top: 5, right: 5, minWidth: 17, height: 17, background: `linear-gradient(135deg,${meta.color},${meta.accentColor})`, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #000', boxShadow: `0 0 8px ${meta.color}80`, fontSize: '0.46rem', fontWeight: 800, color: '#000', zIndex: 3, paddingInline: 3, fontFamily: "'Inter',system-ui,sans-serif" }}>
                {count}
            </div>
            {/* Bottom frosted panel */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '5px 6px 7px', background: 'rgba(0,0,0,0.34)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderTop: '1px solid rgba(255,255,255,0.14)', zIndex: 2 }}>
                <div style={{ fontSize: '0.46rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: meta.color, fontFamily: "'Inter',system-ui,sans-serif", textShadow: `0 0 10px ${meta.color}90`, lineHeight: 1.2, marginBottom: 3 }}>{meta.label}</div>
                {stories.slice(0, 2).map((s, i) => (
                    <div key={s.id} style={{ fontSize: '0.44rem', fontWeight: 500, color: `rgba(255,255,255,${0.82 - i * 0.2})`, fontFamily: "'Inter',system-ui,sans-serif", overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', lineHeight: 1.3 }}>{s.text}</div>
                ))}
                {count > 2 && (
                    <div style={{ fontSize: '0.36rem', fontWeight: 600, color: meta.color, opacity: 0.75, fontFamily: "'Inter',system-ui,sans-serif" }}>+{count - 2} more</div>
                )}
            </div>
        </motion.button>
    );
}

// ── User Story Viewer ─────────────────────────────────────────────────────────
function UserStoryViewer({
    story, totalStoryCount, globalIndex, onClose, onPrev, onNext, onRemove, direction = 1,
}: {
    story: UserStory;
    totalStoryCount: number;
    globalIndex: number;
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
    onRemove: (taskId: string) => void;
    direction?: number;
}) {
    const durationSec = story.category === 'idea' ? 12 : 10;

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
            initial={{ x: direction > 0 ? '100%' : '-100%', opacity: 0.7 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction > 0 ? '-100%' : '100%', opacity: 0 }}
            transition={{ x: { type: 'spring', stiffness: 420, damping: 38 }, opacity: { duration: 0.14 } }}
            onClick={e => e.stopPropagation()}
            style={{
                position: 'relative',
                width: '100%', height: '100dvh',
                maxWidth: '100vw', overflow: 'hidden',
                background: 'transparent',
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
                        <div
                            key={i === globalIndex ? story.id : i}
                            onAnimationEnd={i === globalIndex ? onNext : undefined}
                            style={{
                                height: '100%', background: '#fff',
                                transformOrigin: 'left center',
                                transform: i < globalIndex ? 'scaleX(1)' : i > globalIndex ? 'scaleX(0)' : undefined,
                                animation: i === globalIndex ? `storyFill ${durationSec}s linear forwards` : 'none',
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Close button */}
            <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={e => { e.stopPropagation(); onClose(); }}
                style={{
                    position: 'absolute', top: 'calc(env(safe-area-inset-top) + 20px)', right: 16,
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#fff', zIndex: 9999,
                }}
            >
                <X size={18} />
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

            {/* ── Emoji Reaction Bar ── */}
            <FloatingReactionBar />

            {/* Tap zones: prev / next */}
            <div onClick={e => { e.stopPropagation(); onPrev(); }} style={{
                position: 'absolute', left: 0, top: 90, bottom: 90,
                width: '30%', zIndex: 15, cursor: 'pointer',
            }} />
            <div onClick={e => { e.stopPropagation(); onNext(); }} style={{
                position: 'absolute', right: 0, top: 90, bottom: 90,
                width: '30%', zIndex: 15, cursor: 'pointer',
            }} />
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

// ── Floating Emoji Reaction Bar (Facebook-style — tap for burst) ─────────────
interface FloatingEmoji {
    id: number; emoji: string; x: number;
}
const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '🔥', '🙏'];

function FloatingReactionBar() {
    const [floaters, setFloaters] = useState<FloatingEmoji[]>([]);
    const [counts, setCounts] = useState<Record<string, number>>({});
    const uidRef = useRef(0);

    const handleReact = useCallback((emoji: string) => {
        const id = ++uidRef.current;
        const x = Math.random() * 40 - 20; // ±20px horizontal drift
        setFloaters(f => [...f, { id, emoji, x }]);
        setCounts(c => ({ ...c, [emoji]: (c[emoji] || 0) + 1 }));
        setTimeout(() => setFloaters(f => f.filter(e => e.id !== id)), 1200);
    }, []);

    return (
        <div style={{
            position: 'absolute',
            bottom: 'calc(env(safe-area-inset-bottom) + 28px)',
            left: 0, right: 0,
            zIndex: 25,
            pointerEvents: 'none',
        }}>
            {/* Floating burst emojis */}
            <AnimatePresence>
                {floaters.map(f => (
                    <motion.div
                        key={f.id}
                        initial={{ opacity: 1, y: 0, scale: 0.6, x: f.x }}
                        animate={{ opacity: 0, y: -120, scale: 1.4, x: f.x + (Math.random() * 20 - 10) }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.1, ease: 'easeOut' }}
                        style={{
                            position: 'absolute',
                            bottom: 54,
                            left: '50%',
                            fontSize: '2rem',
                            pointerEvents: 'none',
                            userSelect: 'none',
                        }}
                    >
                        {f.emoji}
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Reaction pill bar */}
            <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                pointerEvents: 'all',
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 340, damping: 26 }}
                    style={{
                        display: 'flex', gap: 6,
                        background: 'rgba(0,0,0,0.52)',
                        backdropFilter: 'blur(18px)',
                        WebkitBackdropFilter: 'blur(18px)',
                        borderRadius: 999,
                        padding: '0.38rem 0.75rem',
                        border: '1px solid rgba(255,255,255,0.14)',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                    }}
                >
                    {REACTION_EMOJIS.map(emoji => (
                        <motion.button
                            key={emoji}
                            onClick={() => handleReact(emoji)}
                            whileTap={{ scale: 1.5, rotate: -15 }}
                            whileHover={{ scale: 1.3 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: '1.35rem', lineHeight: 1,
                                padding: '0.1rem 0.15rem',
                                position: 'relative',
                            }}
                        >
                            {emoji}
                            {counts[emoji] > 0 && (
                                <span style={{
                                    position: 'absolute', top: -6, right: -4,
                                    fontSize: '0.36rem', fontWeight: 800,
                                    color: '#fff',
                                    background: 'rgba(139,92,246,0.85)',
                                    borderRadius: 999,
                                    padding: '0.05rem 0.22rem',
                                    pointerEvents: 'none',
                                    lineHeight: 1.4,
                                    fontFamily: "'Inter',system-ui,sans-serif",
                                }}>{counts[emoji] > 99 ? '99+' : counts[emoji]}</span>
                            )}
                        </motion.button>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}

// ── Story Bubble — Large Cinematic Portrait Card ─────────────────────────────
function StoryBubble({ story, onClick, index = 0 }: { story: typeof STORIES[number]; onClick: () => void; index?: number }) {
    const vidRef = useRef<HTMLVideoElement>(null);
    const isVideo = 'videoSrc' in story;
    const bgImg = isVideo
        ? VIDEO_THUMBS[story.id] || 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400&h=700&fit=crop&q=80'
        : AWARENESS_IMAGES[story.id] || 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400&h=700&fit=crop&q=80';

    useEffect(() => {
        const v = vidRef.current;
        if (!v || !isVideo) return;
        v.currentTime = 0.5;
    }, [story, isVideo]);

    return (
        <motion.button
            onClick={onClick}
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.05, y: -7, transition: { duration: 0.20, ease: [0.22, 1, 0.36, 1] } }}
            initial={{ opacity: 0, scale: 0.72, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: index * 0.055 }}
            style={{
                flexShrink: 0,
                width: 106, height: 154,
                background: 'none', border: 'none',
                padding: 0, cursor: 'pointer',
                position: 'relative',
                borderRadius: 22,
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center',
                scrollSnapAlign: 'start',
                transform: 'translateZ(0)',
                willChange: 'transform',
            }}
        >
            {/* Full-bleed background image */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${bgImg})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                borderRadius: 22,
            }} />

            {/* Video thumbnail layer */}
            {isVideo && (
                <video
                    ref={vidRef}
                    src={story.videoSrc}
                    muted playsInline preload="metadata"
                    style={{
                        position: 'absolute', inset: 0,
                        width: '100%', height: '100%',
                        objectFit: 'cover', display: 'block',
                        borderRadius: 22,
                    }}
                />
            )}

            {/* Cinematic gradient: color-matched top + dark bottom */}
            <div style={{
                position: 'absolute', inset: 0, borderRadius: 22,
                background: `linear-gradient(180deg, ${story.color}22 0%, rgba(0,0,0,0.02) 28%, rgba(0,0,0,0.12) 52%, rgba(0,0,0,0.62) 75%, rgba(0,0,0,0.88) 100%)`,
            }} />

            {/* Pulsing outer glow ring */}
            <motion.div
                animate={{ opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 2.6 + index * 0.22, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute', inset: -2, borderRadius: 24,
                    boxShadow: `0 0 0 2px ${story.color}88, 0 0 32px ${story.color}60, 0 14px 44px ${story.color}35`,
                    pointerEvents: 'none', willChange: 'opacity',
                }}
            />

            {/* Inner glass highlight ring */}
            <div style={{
                position: 'absolute', inset: 0, borderRadius: 22,
                boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.44)',
                pointerEvents: 'none',
            }} />

            {/* Top glass glare */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: '34%', borderRadius: '22px 22px 60% 60%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.08) 55%, transparent 100%)',
                pointerEvents: 'none',
            }} />

            {/* Icon badge (top-center) */}
            <motion.div
                animate={{ scale: [1, 1.10, 1], y: [0, -2, 0] }}
                transition={{ duration: 3.2 + index * 0.35, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
                    width: 32, height: 32, borderRadius: '50%',
                    background: isVideo
                        ? 'rgba(0,0,0,0.42)'
                        : `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55) 0%, ${story.color}55 60%, rgba(0,0,0,0.1) 100%)`,
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 3px 14px rgba(0,0,0,0.45), inset 0 1px 2px rgba(255,255,255,0.55), 0 0 14px ${story.color}70`,
                    border: '1.5px solid rgba(255,255,255,0.50)',
                    fontSize: isVideo ? 0 : 14, zIndex: 2,
                }}
            >
                {isVideo ? <Play size={13} color="#fff" fill="#fff" /> : story.preview}
            </motion.div>

            {/* Bottom frosted-glass label */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '7px 7px 10px',
                background: 'rgba(0,0,0,0.40)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderTop: `1px solid ${story.color}35`,
                zIndex: 3,
            }}>
                <div style={{
                    fontSize: '0.45rem', fontWeight: 800,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    color: story.color,
                    fontFamily: "'Inter', system-ui, sans-serif",
                    textShadow: `0 0 10px ${story.color}90`,
                    lineHeight: 1.2, marginBottom: 2,
                }}>{story.sublabel}</div>
                <div style={{
                    fontSize: '0.52rem', fontWeight: 600,
                    color: 'rgba(255,255,255,0.92)',
                    fontFamily: "'Inter', system-ui, sans-serif",
                    textShadow: '0 1px 6px rgba(0,0,0,0.9)',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                }}>{story.label}</div>
            </div>
        </motion.button>
    );
}

// ── Cosmic Date Bubble — first story in the bar ────────────────────────────
const COSMIC_BG = 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=600&fit=crop&q=80';
function CosmicDateBubble({ onClick }: { onClick: () => void }) {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleString('en-IN', { month: 'short' });
    return (
        <motion.button
            onClick={onClick}
            whileTap={{ scale: 0.93 }}
            whileHover={{ scale: 1.07, y: -5, transition: { duration: 0.22 } }}
            initial={{ opacity: 0, scale: 0.7, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0 }}
            style={{ flexShrink: 0, width: 106, height: 154, background: 'none', border: 'none', padding: 0, cursor: 'pointer', position: 'relative', borderRadius: 22, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${COSMIC_BG})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 22 }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: 22, background: 'linear-gradient(180deg,rgba(10,0,40,0.35) 0%,rgba(30,0,80,0.22) 35%,rgba(0,0,0,0.25) 55%,rgba(0,0,0,0.70) 80%,rgba(0,0,0,0.88) 100%)' }} />
            <motion.div animate={{ opacity: [0.65, 1, 0.65], scale: [1, 1.03, 1] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }} style={{ position: 'absolute', inset: 0, borderRadius: 22, boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.60),0 0 0 2.5px #fbbf2470,0 10px 36px #fbbf2455,0 4px 16px rgba(0,0,0,0.5)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '30%', borderRadius: '20px 20px 50% 50%', background: 'linear-gradient(180deg,rgba(255,255,255,0.28) 0%,rgba(255,255,255,0.06) 60%,transparent 100%)', pointerEvents: 'none' }} />
            {/* OM holoball */}
            <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 34, height: 34, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%,rgba(255,255,255,0.55) 0%,#fbbf2450 60%,rgba(0,0,0,0.1) 100%)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 12px rgba(0,0,0,0.4),inset 0 1px 2px rgba(255,255,255,0.55),0 0 14px #fbbf2470', border: '1.5px solid rgba(255,255,255,0.45)', fontSize: 16, zIndex: 2 }}>
                ☀️
            </div>
            {/* Bottom frosted panel */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '5px 6px 7px', background: 'rgba(10,0,30,0.42)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderTop: '1px solid rgba(255,215,0,0.22)', zIndex: 2 }}>
                <div style={{ fontSize: '0.43rem', fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: '#fbbf24', fontFamily: "'Inter',system-ui,sans-serif", textShadow: '0 0 8px #fbbf2480', lineHeight: 1.2, marginBottom: 2 }}>Cosmic Date</div>
                <div style={{ fontSize: '0.56rem', fontWeight: 800, color: '#fff', fontFamily: "'Inter',system-ui,sans-serif", lineHeight: 1.2 }}>{day} {month}</div>
                <div style={{ fontSize: '0.44rem', color: 'rgba(255,215,0,0.75)', fontFamily: "'Inter',system-ui,sans-serif" }}>Cosmic Date ✦</div>
            </div>
        </motion.button>
    );
}

interface PanchangData {
    vaar: string; tithi: string; paksha: string; nakshatra: string;
    yoga: string; sunrise: string; sunset: string; festival: string;
    masa: string; samvat: string;
}

// ── Pure-JS Panchang calculator (no API needed) ────────────────────────────
function fmtTime(h: number): string {
    const hh = Math.floor(((h % 24) + 24) % 24);
    const mm = Math.floor(((h % 24) + 24) % 24 * 60) % 60;
    const period = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
    return `${h12}:${String(mm).padStart(2, '0')} ${period}`;
}
function calcSunriseSunset(year: number, month: number, day: number): { sunrise: string; sunset: string } {
    const lat = 23.5, lng = 79.0; // geographic center of India
    const N1 = Math.floor(275 * month / 9);
    const N2 = Math.floor((month + 9) / 12);
    const N3 = 1 + Math.floor((year - 4 * Math.floor(year / 4) + 2) / 3);
    const N = N1 - N2 * N3 + day - 30;
    const Lsun = (280.461 + 0.9856474 * N) % 360;
    const Msun = ((357.528 + 0.9856003 * N) % 360) * Math.PI / 180;
    const lam = (Lsun + 1.915 * Math.sin(Msun) + 0.02 * Math.sin(2 * Msun)) * Math.PI / 180;
    const eps = 23.439 * Math.PI / 180;
    const dec = Math.asin(Math.sin(eps) * Math.sin(lam));
    const latR = lat * Math.PI / 180;
    const cosH = (Math.cos(90.833 * Math.PI / 180) - Math.sin(latR) * Math.sin(dec)) / (Math.cos(latR) * Math.cos(dec));
    if (Math.abs(cosH) > 1) return { sunrise: '6:00 AM', sunset: '6:30 PM' };
    const H = Math.acos(cosH) * 180 / Math.PI;
    const RA = (Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)) * 180 / Math.PI) / 15;
    const lngH = lng / 15;
    const riseUT = ((RA - H / 15 - lngH) + 24) % 24;
    const setUT = ((RA + H / 15 - lngH) + 24) % 24;
    return { sunrise: fmtTime(riseUT + 5.5), sunset: fmtTime(setUT + 5.5) };
}
function calculatePanchang(): PanchangData {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
    const a = Math.floor((14 - m) / 12);
    const yt = y + 4800 - a, mt = m + 12 * a - 3;
    const jd = d + Math.floor((153 * mt + 2) / 5) + 365 * yt + Math.floor(yt / 4) - Math.floor(yt / 100) + Math.floor(yt / 400) - 32045;
    const D = jd - 2451545.0 + (now.getHours() + now.getMinutes() / 60) / 24.0;
    const sunL = ((280.46646 + 0.9856474 * D) % 360 + 360) % 360;
    const moonL = ((218.3165 + 13.17639648 * D) % 360 + 360) % 360;
    const VAARS = ['Ravivaar', 'Somvaar', 'Mangalvaar', 'Budhvaar', 'Guruvaar', 'Shukravaar', 'Shanivaar'];
    const TITHIS = ['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima', 'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya'];
    const NAKSHATRAS = ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'];
    const YOGAS = ['Vishkumbha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarman', 'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyana', 'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti'];
    const MASAS = ['Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada', 'Ashwin', 'Kartika', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna'];
    let diff = moonL - sunL; if (diff < 0) diff += 360;
    const tithiNum = Math.floor(diff / 12); // 0-29
    const tithi = TITHIS[Math.min(tithiNum, 29)];
    const paksha = tithiNum < 15 ? 'Shukla Paksha' : 'Krishna Paksha';
    const nakshatra = NAKSHATRAS[Math.floor(moonL / (360 / 27)) % 27];
    const yoga = YOGAS[Math.floor(((sunL + moonL) % 360) / (360 / 27)) % 27];
    const masa = MASAS[Math.floor(((sunL + 360) % 360) / 30) % 12];
    const samvat = String(y + 57);
    const { sunrise, sunset } = calcSunriseSunset(y, m, d);
    // Festival lookup
    const fixedFestivals: Record<string, string> = { '1-1': 'New Year', '1-14': 'Makar Sankranti', '1-26': 'Republic Day', '3-8': 'Holi', '8-15': 'Independence Day', '10-2': 'Gandhi Jayanti', '10-24': 'Diwali' };
    const vaarFestivals: Record<number, string> = { 1: 'Somvar — Lord Shiva', 6: 'Shanivaar Upas', 0: 'Ravivaar — Sun worship' };
    const festival = fixedFestivals[`${m}-${d}`]
        ?? (tithiNum === 10 || tithiNum === 25 ? 'Ekadashi Vrat'
            : tithiNum === 14 ? 'Purnima'
                : tithiNum === 29 ? 'Amavasya'
                    : tithiNum === 3 || tithiNum === 18 ? 'Chaturthi — Ganesh Vrat'
                        : vaarFestivals[now.getDay()] ?? 'None');
    return { vaar: VAARS[now.getDay()], tithi, paksha, nakshatra, yoga, sunrise, sunset, festival, masa, samvat };
}

function CosmicDateViewer({ totalStoryCount, globalIndex, onClose, onNext, onPrev, direction = 1 }: {
    totalStoryCount: number; globalIndex: number; onClose: () => void; onNext: () => void; onPrev: () => void;
    direction?: number;
}) {
    const panchang = useMemo(() => calculatePanchang(), []);
    const now = useMemo(() => new Date(), []);
    const modernDate = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const modernTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    const fields = [
        { icon: '🌤️', label: 'Vaar', value: panchang.vaar },
        { icon: '🌙', label: 'Tithi', value: panchang.tithi },
        { icon: '☯️', label: 'Paksha', value: panchang.paksha },
        { icon: '⭐', label: 'Nakshatra', value: panchang.nakshatra },
        { icon: '🔱', label: 'Yoga', value: panchang.yoga },
        { icon: '🌅', label: 'Sunrise', value: panchang.sunrise },
        { icon: '🌇', label: 'Sunset', value: panchang.sunset },
        { icon: '🏺', label: 'Masa', value: panchang.masa },
    ];
    const festival = panchang.festival !== 'None' ? panchang.festival : null;

    return (
        <motion.div
            initial={{ x: direction > 0 ? '100%' : '-100%', opacity: 0.7 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction > 0 ? '-100%' : '100%', opacity: 0 }}
            transition={{ x: { type: 'spring', stiffness: 420, damping: 38 }, opacity: { duration: 0.14 } }}
            onClick={e => e.stopPropagation()}
            style={{ position: 'relative', width: '100%', height: '100dvh', maxWidth: '100vw', overflow: 'hidden', background: 'transparent' }}
        >
            {/* Starfield bg */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${COSMIC_BG})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.4) saturate(1.4)', opacity: 0.7 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(10,0,50,0.7) 0%,rgba(5,0,25,0.5) 40%,rgba(0,0,0,0.6) 100%)' }} />
            {/* Ambient glows */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', width: 400, height: 400, background: 'radial-gradient(circle,#fbbf2420,transparent 70%)', top: '-10%', left: '50%', transform: 'translateX(-50%)', filter: 'blur(60px)' }} />
                <div style={{ position: 'absolute', width: 260, height: 260, background: 'radial-gradient(circle,#a78bfa18,transparent 70%)', bottom: '10%', right: '5%', filter: 'blur(45px)' }} />
            </div>
            {/* Progress bars */}
            <div style={{ position: 'absolute', top: 14, left: 12, right: 12, display: 'flex', gap: 4, zIndex: 20 }}>
                {Array.from({ length: totalStoryCount }).map((_, i) => (
                    <div key={i} style={{ flex: 1, height: 2.5, borderRadius: 2, background: 'rgba(255,255,255,0.20)', overflow: 'hidden' }}>
                        <div
                            key={i === globalIndex ? 'cosmic' : i}
                            onAnimationEnd={i === globalIndex ? onNext : undefined}
                            style={{
                                height: '100%', background: '#fbbf24',
                                transformOrigin: 'left center',
                                transform: i < globalIndex ? 'scaleX(1)' : i > globalIndex ? 'scaleX(0)' : undefined,
                                animation: i === globalIndex ? 'storyFill 16s linear forwards' : 'none',
                            }}
                        />
                    </div>
                ))}
            </div>
            {/* Close */}
            <motion.button whileTap={{ scale: 0.88 }} onClick={e => { e.stopPropagation(); onClose(); }}
                style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 20px)', right: 16, width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', zIndex: 9999 }}>
                <X size={18} />
            </motion.button>
            {/* Content */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4.5rem 1.5rem 2rem', overflowY: 'auto', zIndex: 1 }}>
                {/* Modern Date Header */}
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                    style={{ textAlign: 'center', marginBottom: '1.4rem', width: '100%' }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#fbbf24', fontFamily: "'Inter',system-ui,sans-serif", marginBottom: 6, textShadow: '0 0 12px #fbbf2480' }}>✦ Cosmic Date ✦</div>
                    <div style={{ fontSize: 'clamp(1.6rem,6vw,2.2rem)', fontWeight: 800, color: '#fff', fontFamily: "'Playfair Display',Georgia,serif", lineHeight: 1.15, textShadow: '0 0 40px #fbbf2450', letterSpacing: '-0.01em' }}>{now.getDate()} {now.toLocaleString('en-IN', { month: 'long' })}</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', fontFamily: "'Inter',system-ui,sans-serif", marginTop: 4, letterSpacing: '0.04em' }}>{modernDate}</div>
                    <div style={{ fontSize: '0.72rem', color: '#fbbf2499', fontFamily: "'Inter',system-ui,sans-serif", marginTop: 2 }}>{modernTime} IST</div>
                    {panchang && <div style={{ fontSize: '0.72rem', color: 'rgba(167,139,250,0.85)', fontFamily: "'Inter',system-ui,sans-serif", marginTop: 4, fontWeight: 600 }}>Vikram Samvat {panchang.samvat}</div>}
                </motion.div>
                {/* Divider */}
                <div style={{ width: 48, height: 1.5, background: 'linear-gradient(90deg,transparent,#fbbf24,transparent)', marginBottom: '1.4rem', boxShadow: '0 0 10px #fbbf2480' }} />
                {/* ── Emoji Reaction Bar ── */}
                <FloatingReactionBar />
                {/* Festival Banner */}
                {festival && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                        style={{ width: '100%', padding: '0.7rem 1rem', background: 'linear-gradient(135deg,#fbbf2420,#f59e0b15)', border: '1px solid #fbbf2450', borderRadius: 14, marginBottom: '1.2rem', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
                        <div style={{ fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fbbf24', fontFamily: "'Inter',system-ui,sans-serif", marginBottom: 3 }}>🎉 Today's Festival</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display',Georgia,serif" }}>{festival}</div>
                    </motion.div>
                )}
                {/* Cosmic Date grid */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', width: '100%' }}>
                    {fields.map((f, i) => (
                        <motion.div key={f.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 + i * 0.06 }}
                            style={{ padding: '0.7rem 0.8rem', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 14 }}>
                            <div style={{ fontSize: '0.52rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fbbf2488', fontFamily: "'Inter',system-ui,sans-serif", marginBottom: 4 }}>{f.icon} {f.label}</div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display',Georgia,serif", lineHeight: 1.25 }}>{f.value}</div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
            <div onClick={e => { e.stopPropagation(); onPrev(); }} style={{ position: 'absolute', left: 0, top: 90, bottom: 90, width: '30%', zIndex: 15, cursor: 'pointer' }} />
            <div onClick={e => { e.stopPropagation(); onNext(); }} style={{ position: 'absolute', right: 0, top: 90, bottom: 90, width: '30%', zIndex: 15, cursor: 'pointer' }} />
        </motion.div>
    );
}

// ── Full-screen Story Viewer (video + awareness) ──────────────────────────────
function StoryViewer({ story, totalStoryCount, globalIndex, onClose, onPrev, onNext, direction = 1 }: {
    story: typeof STORIES[number];
    totalStoryCount: number;
    globalIndex: number;
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
    direction?: number;
}) {
    const router = useRouter();
    const vidRef = useRef<HTMLVideoElement>(null);
    const [progress, setProgress] = useState(0);
    const [muted, setMuted] = useState(false);
    const [paused, setPaused] = useState(false);
    const lastVideoProgressRef = useRef(0);

    // restart when story changes
    useEffect(() => {
        setProgress(0);
        lastVideoProgressRef.current = 0;
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

    // throttled video progress — only update state when position changes by ≥1%
    const onTimeUpdate = useCallback(() => {
        const v = vidRef.current;
        if (!v || !v.duration) return;
        const pct = (v.currentTime / v.duration) * 100;
        if (Math.abs(pct - lastVideoProgressRef.current) >= 1) {
            lastVideoProgressRef.current = pct;
            setProgress(pct);
        }
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
            initial={{ x: direction > 0 ? '100%' : '-100%', opacity: 0.7 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction > 0 ? '-100%' : '100%', opacity: 0 }}
            transition={{ x: { type: 'spring', stiffness: 420, damping: 38 }, opacity: { duration: 0.14 } }}
            onClick={e => e.stopPropagation()}
            style={{
                position: 'relative',
                width: '100%', height: '100dvh',
                maxWidth: '100vw',
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
                        {story.type === 'video' ? (
                            <div style={{
                                height: '100%', background: '#fff',
                                width: i < globalIndex ? '100%' : i === globalIndex ? `${progress}%` : '0%',
                            }} />
                        ) : (
                            <div
                                key={i === globalIndex ? story.id : i}
                                onAnimationEnd={i === globalIndex ? onNext : undefined}
                                style={{
                                    height: '100%', background: '#fff',
                                    transformOrigin: 'left center',
                                    transform: i < globalIndex ? 'scaleX(1)' : i > globalIndex ? 'scaleX(0)' : undefined,
                                    animation: i === globalIndex ? 'storyFill 8s linear forwards' : 'none',
                                }}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* ── Top-right controls ── */}
            <div style={{
                position: 'absolute', top: 'calc(env(safe-area-inset-top) + 20px)', right: 16,
                display: 'flex', gap: 12, zIndex: 9999,
            }}>
                {story.type === 'video' && (
                    <motion.button whileTap={{ scale: 0.88 }} onClick={e => { e.stopPropagation(); setMuted(m => !m); }} style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#fff',
                    }}>
                        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </motion.button>
                )}
                <motion.button whileTap={{ scale: 0.88 }} onClick={e => { e.stopPropagation(); onClose(); }} style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#fff',
                }}>
                    <X size={18} />
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

            {/* ── Emoji Reaction Bar ── */}
            <FloatingReactionBar />

            {/* ── Tap zones: prev (left) / next (right) ── */}
            <div onClick={e => { e.stopPropagation(); onPrev(); }} style={{
                position: 'absolute', left: 0, top: 90, bottom: 90,
                width: '30%', zIndex: 15, cursor: 'pointer',
            }} />
            <div onClick={e => { e.stopPropagation(); onNext(); }} style={{
                position: 'absolute', right: 0, top: 90, bottom: 90,
                width: '30%', zIndex: 15, cursor: 'pointer',
            }} />
        </motion.div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function StickyTopNav() {
    const { user } = useOneSutraAuth();
    const [dailyLogs, setDailyLogs] = useState<any[]>([]);
    const [activeIdx, setActiveIdx] = useState<number | null>(null);
    const [activeUserIdx, setActiveUserIdx] = useState<number | null>(null);
    const [cosmicOpen, setCosmicOpen] = useState(false);
    const [headerVisible, setHeaderVisible] = useState(true);
    const lastScrollY = useRef(0);
    const swipeDir = useRef<1 | -1>(1);
    const { tasks, removeTask } = useDailyTasks();

    useEffect(() => {
        if (!user?.uid) return;
        let unsub = () => { };
        (async () => {
            const { getFirebaseFirestore } = await import('@/lib/firebase');
            const { collection, onSnapshot, query } = await import('firebase/firestore');
            const db = await getFirebaseFirestore();

            const q = query(collection(db, 'users', user.uid, 'logs_daily'));

            unsub = onSnapshot(q, (snap) => {
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);

                const logsContext = snap.docs.map(d => d.data())
                    .filter(l => l.createdAt >= startOfDay.getTime())
                    .sort((a, b) => a.createdAt - b.createdAt);

                setDailyLogs(logsContext);
            });
        })();
        return () => unsub();
    }, [user?.uid]);

    const userStories = useMemo(() => {
        const mappedLogs: TaskItem[] = dailyLogs.map(l => ({
            id: `log-${l.id}`,
            text: l.text + (l.context ? ` ✦ ${l.context}` : ''),
            category: 'Log' as any,
            done: false,
            createdAt: l.createdAt,
            icon: '📓',
            colorClass: 'bg-white/10 text-white',
            accentColor: '#ffffff',
        }));
        return buildUserStories([...mappedLogs, ...tasks]);
    }, [tasks, dailyLogs]);
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);

    // Groups: one entry per category that has items
    const CATS = ['log', 'task', 'challenge', 'idea', 'issue', 'wellness'] as const;
    const groupedCategories = useMemo(() =>
        CATS.filter(c => userStories.some(s => s.category === c)),
        [userStories]
    );

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

    // ── Scroll-direction auto-hide (Instagram-style) ──────────────────────────
    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY;
            if (y > lastScrollY.current + 24 && y > 90) setHeaderVisible(false);
            else if (y < lastScrollY.current - 8) setHeaderVisible(true);
            lastScrollY.current = y;
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Emit event so parent page can hide Bodhi while stories are open
    const isStoryViewerOpen = cosmicOpen || activeUserIdx !== null || activeIdx !== null;
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('story-viewer-change', { detail: { open: isStoryViewerOpen } }));
        }
        if (isStoryViewerOpen) setHeaderVisible(true);
    }, [isStoryViewerOpen]);

    // Navigation: cosmic → userStories (flat) → STORIES
    const closeAll = () => { setCosmicOpen(false); setActiveIdx(null); setActiveUserIdx(null); };

    const openCosmicStory = () => { setCosmicOpen(true); setActiveIdx(null); setActiveUserIdx(null); };
    const nextCosmicStory = () => {
        swipeDir.current = 1;
        setCosmicOpen(false);
        if (userStories.length > 0) setActiveUserIdx(0);
        else if (STORIES.length > 0) setActiveIdx(0);
    };
    const prevCosmicStory = () => { }; // first story, nowhere to go back

    const openStory = (i: number) => { swipeDir.current = 1; setActiveIdx(i); setActiveUserIdx(null); setCosmicOpen(false); };
    const closeStory = () => closeAll();
    const nextStory = () => {
        swipeDir.current = 1;
        if (activeIdx === null) return;
        activeIdx < STORIES.length - 1 ? setActiveIdx(activeIdx + 1) : closeAll();
    };
    const prevStory = () => {
        swipeDir.current = -1;
        if (activeIdx === null) return;
        if (activeIdx > 0) setActiveIdx(activeIdx - 1);
        else if (userStories.length > 0) { setActiveIdx(null); setActiveUserIdx(userStories.length - 1); }
        else openCosmicStory();
    };

    const openUserStory = (i: number) => { swipeDir.current = 1; setActiveUserIdx(i); setActiveIdx(null); setCosmicOpen(false); };
    const nextUserStory = () => {
        swipeDir.current = 1;
        if (activeUserIdx === null) return;
        if (activeUserIdx < userStories.length - 1) setActiveUserIdx(activeUserIdx + 1);
        else if (STORIES.length > 0) { setActiveUserIdx(null); setActiveIdx(0); }
        else closeAll();
    };
    const prevUserStory = () => {
        swipeDir.current = -1;
        if (activeUserIdx === null) return;
        if (activeUserIdx > 0) setActiveUserIdx(activeUserIdx - 1);
        else openCosmicStory();
    };

    // total story count for progress bar: 1 (cosmic) + userStories + STORIES
    const totalCount = 1 + userStories.length + STORIES.length;
    const cosmicGlobalIdx = 0;

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
                @keyframes storyFill {
                    from { transform: scaleX(0); }
                    to   { transform: scaleX(1); }
                }
                .os-stories-row::-webkit-scrollbar { display: none; }
                .os-stories-row { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <header style={{
                position: 'fixed',
                top: 0, left: 0, right: 0,
                zIndex: 1000,
                background: 'rgba(12, 12, 22, 0.72)',
                backdropFilter: 'blur(24px) saturate(160%)',
                WebkitBackdropFilter: 'blur(24px) saturate(160%)',
                borderBottom: '1px solid rgba(251, 191, 36, 0.20)',
                boxShadow: '0 8px 40px rgba(0, 0, 0, 0.55)',
                /* No overflow:hidden — story cards at 154px need full vertical space */
                borderRadius: '0 0 28px 28px',
                transform: headerVisible ? 'translateY(0)' : 'translateY(-110%)',
                transition: 'transform 0.48s cubic-bezier(0.4,0,0.2,1)',
                willChange: 'transform',
            }}>
                {/* Golden ambient glow */}
                <div aria-hidden style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: 'radial-gradient(ellipse at 50% 0%, rgba(251, 191, 36, 0.12) 0%, transparent 60%)',
                }} />

                {/* ── Top row: Logo (left) + nav icons (right) ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.85rem 0.2rem', willChange: 'transform', transform: 'translateZ(0)' }}>
                    {/* Logo + wordmark */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'linear-gradient(145deg, #080d1f, #111827)',
                            border: '2px solid rgba(251,191,36,0.70)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                            animation: 'logo-pulse 3.5s ease-in-out infinite',
                        }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="rgba(251,191,36,0.55)" strokeWidth="0.8" />
                                <circle cx="12" cy="12" r="6.5" stroke="rgba(251,191,36,0.35)" strokeWidth="0.7" />
                                <path d="M12 3 L12 21 M3 12 L21 12 M5.6 5.6 L18.4 18.4 M18.4 5.6 L5.6 18.4"
                                    stroke="rgba(251,191,36,0.22)" strokeWidth="0.6" />
                                <path d="M 8 9.5 Q 12 7, 16 9.5 T 16 14 Q 13 16.5, 10 15 T 8 12 Q 9.5 11, 12 11"
                                    stroke="rgba(255,255,255,0.92)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
                                <circle cx="12" cy="12" r="1.6" fill="#fbbf24" />
                            </svg>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <span style={{
                                fontFamily: "'Inter', system-ui, sans-serif",
                                fontSize: '1rem', fontWeight: 800,
                                letterSpacing: '0.10em',
                                background: 'linear-gradient(120deg, #ffffff 0%, #fde68a 40%, #bae6fd 100%)',
                                WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                                lineHeight: 1,
                            }}>OneSUTRA</span>
                            <span style={{
                                fontSize: '7px', fontWeight: 600,
                                letterSpacing: '0.20em', textTransform: 'uppercase',
                                color: 'rgba(251,191,36,0.55)',
                                fontFamily: "'Inter', system-ui, sans-serif",
                                lineHeight: 1,
                            }}>Conscious OS</span>
                        </div>
                    </div>

                    {/* Nav icons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {[
                            { href: '/project-leela', emoji: '🎵', color: '#fbbf24', label: 'Raag' },
                            { href: '/vedic-games', emoji: '🎲', color: '#4ade80', label: 'Games' },
                        ].map(({ href, emoji, color, label }) => (
                            <Link key={href} href={href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textDecoration: 'none' }}>
                                <motion.div whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.90 }}
                                    style={{
                                        width: 32, height: 32, borderRadius: '50%',
                                        background: `radial-gradient(circle at 36% 26%, rgba(255,255,255,0.30) 0%, ${color}22 26%, ${color}2a 52%, ${color}1a 76%, ${color}0c 100%)`,
                                        backdropFilter: 'blur(10px) saturate(180%)',
                                        WebkitBackdropFilter: 'blur(10px) saturate(180%)',
                                        border: '1.2px solid rgba(255,255,255,0.24)',
                                        boxShadow: `0 0 12px ${color}44, 0 2px 8px rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.24), inset 0 -2px 6px ${color}18`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        position: 'relative', overflow: 'hidden',
                                    }}>
                                    <div style={{
                                        position: 'absolute', top: '6%', left: '10%', width: '52%', height: '35%',
                                        background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.22) 40%, transparent 100%)',
                                        borderRadius: '50%', transform: 'rotate(-25deg)', filter: 'blur(2px)',
                                    }} />
                                    <span style={{
                                        fontSize: '0.95rem',
                                        position: 'relative', zIndex: 2,
                                        filter: `drop-shadow(0 0 5px ${color}88)`,
                                        fontWeight: 900, lineHeight: 1,
                                    }}>{emoji}</span>
                                </motion.div>
                                <span style={{ fontSize: '6px', fontWeight: 600, color: `${color}99`, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'Inter', system-ui, sans-serif", lineHeight: 1 }}>{label}</span>
                            </Link>
                        ))}
                        {/* Profile button — navigates to /profile page */}
                        <Link href="/profile" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textDecoration: 'none' }}>
                            <motion.div whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.90 }}
                                style={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    background: 'radial-gradient(circle at 36% 26%, rgba(255,255,255,0.30) 0%, rgba(167,139,250,0.22) 52%, rgba(167,139,250,0.08) 100%)',
                                    backdropFilter: 'blur(10px) saturate(180%)',
                                    WebkitBackdropFilter: 'blur(10px) saturate(180%)',
                                    border: '1.2px solid rgba(255,255,255,0.24)',
                                    boxShadow: '0 0 12px rgba(167,139,250,0.44), 0 2px 8px rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.24)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    position: 'relative', overflow: 'hidden',
                                }}>
                                <div style={{
                                    position: 'absolute', top: '6%', left: '10%', width: '52%', height: '35%',
                                    background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.22) 40%, transparent 100%)',
                                    borderRadius: '50%', transform: 'rotate(-25deg)', filter: 'blur(2px)',
                                }} />
                                <User size={15} style={{ position: 'relative', zIndex: 2, color: '#a78bfa', filter: 'drop-shadow(0 0 5px rgba(167,139,250,0.88))' }} />
                            </motion.div>
                            <span style={{ fontSize: '6px', fontWeight: 600, color: 'rgba(167,139,250,0.60)', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'Inter', system-ui, sans-serif", lineHeight: 1 }}>Profile</span>
                        </Link>
                    </div>
                </div>

                {/* ── Prana Time Label ── */}
                {(() => {
                    const slot = getTimeSlot();
                    const label = PRANA_LABEL[slot];
                    const colors: Record<string, string> = { morning: '#fbbf24', day: '#f97316', evening: '#c084fc', night: '#818cf8' };
                    const col = colors[slot];
                    return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 0.85rem 0.15rem', flexShrink: 0 }}>
                            <span style={{
                                fontSize: '0.38rem', fontWeight: 700, letterSpacing: '0.12em',
                                textTransform: 'uppercase', color: col,
                                fontFamily: "'Inter', system-ui, sans-serif",
                                background: `${col}18`, border: `1px solid ${col}33`,
                                borderRadius: 99, padding: '0.14rem 0.45rem',
                                whiteSpace: 'nowrap',
                            }}>{label}</span>
                            <div style={{ flex: 1, height: '0.5px', background: `linear-gradient(90deg, ${col}44, transparent)` }} />
                        </div>
                    );
                })()}

            </header>

            {/* ── STORY BAR TITLE ── */}
            <div style={{
                padding: '0.85rem 0.85rem 0.35rem',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)',
            }}>
                <h2 style={{
                    margin: 0,
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: 'rgba(255, 255, 255, 0.95)',
                    fontFamily: "'Playfair Display', Georgia, serif",
                    letterSpacing: '-0.01em',
                    textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                }}>
                    Watch the stories and plan your life.✨
                </h2>
            </div>
            {/* ── STORY BAR: in page flow — renders below the unified glass card — scrolls naturally ── */}
            <div
                className="os-stories-row"
                style={{
                    display: 'flex', flexDirection: 'row', alignItems: 'flex-start',
                    gap: 8, padding: '8px 0.85rem 14px',
                    overflowX: 'auto', overflowY: 'visible',
                    scrollbarWidth: 'none',
                    WebkitOverflowScrolling: 'touch',
                    scrollSnapType: 'x proximity',
                    overscrollBehaviorX: 'contain',
                    touchAction: 'pan-x',
                    WebkitTapHighlightColor: 'transparent',
                    transform: 'translateZ(0)',
                    willChange: 'scroll-position',
                    background: 'linear-gradient(180deg,rgba(0,0,0,0.38) 0%,rgba(0,0,0,0.16) 100%)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderBottom: '1px solid rgba(251,191,36,0.08)',
                    boxShadow: '0 6px 24px rgba(0,0,0,0.22)',
                }}
            >
                <CosmicDateBubble onClick={openCosmicStory} />
                <div style={{ width: 1, height: 80, background: 'rgba(251,191,36,0.22)', alignSelf: 'center', flexShrink: 0, borderRadius: 1 }} />
                {groupedCategories.map((cat, i) => (
                    <CategoryGroupBubble
                        key={cat}
                        category={cat}
                        stories={userStories.filter(s => s.category === cat)}
                        onOpen={() => openUserStory(userStories.findIndex(s => s.category === cat))}
                        index={i}
                    />
                ))}
                {groupedCategories.length > 0 && (
                    <div style={{ width: 1, height: 80, background: 'rgba(255,255,255,0.10)', alignSelf: 'center', flexShrink: 0, borderRadius: 1 }} />
                )}
                {STORIES.map((story, i) => (
                    <StoryBubble key={story.id} story={story} index={i} onClick={() => openStory(i)} />
                ))}
            </div>


            {isMounted && createPortal(
                <AnimatePresence mode="wait">
                    {(cosmicOpen || activeUserIdx !== null || activeIdx !== null) && (
                        <motion.div
                            key="story-overlay"
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.22, ease: 'easeInOut' }}
                            style={{
                                position: 'fixed', inset: 0, zIndex: 99999,
                                background: 'rgba(0,0,0,0.15)',
                                backdropFilter: 'blur(0px)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                isolation: 'isolate',
                                overflow: 'hidden',
                            }}
                            onClick={closeAll}
                        >
                            {/* Horizontal slide between stories — no black gap */}
                            <AnimatePresence>
                                {cosmicOpen && (
                                    <CosmicDateViewer
                                        key="cosmic"
                                        totalStoryCount={totalCount}
                                        globalIndex={cosmicGlobalIdx}
                                        onClose={closeAll}
                                        onNext={nextCosmicStory}
                                        onPrev={prevCosmicStory}
                                        direction={swipeDir.current}
                                    />
                                )}
                                {!cosmicOpen && activeUserIdx !== null && userStories[activeUserIdx] && (
                                    <UserStoryViewer
                                        key={`user-${activeUserIdx}`}
                                        story={userStories[activeUserIdx]}
                                        totalStoryCount={totalCount}
                                        globalIndex={1 + activeUserIdx}
                                        onClose={closeAll}
                                        onNext={nextUserStory}
                                        onPrev={prevUserStory}
                                        onRemove={removeTask}
                                        direction={swipeDir.current}
                                    />
                                )}
                                {!cosmicOpen && activeUserIdx === null && activeIdx !== null && (
                                    <StoryViewer
                                        key={`story-${activeIdx}`}
                                        story={STORIES[activeIdx]}
                                        totalStoryCount={totalCount}
                                        globalIndex={1 + userStories.length + activeIdx}
                                        onClose={closeStory}
                                        onNext={nextStory}
                                        onPrev={prevStory}
                                        direction={swipeDir.current}
                                    />
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
