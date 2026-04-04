'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LOG_CATEGORIES,
    type LogCategoryMeta,
    type ParsedLogEntry,
    type AkhandaStreak,
    type BodhiLog,
    saveMultipleBodhiLogs,
    getTodayLogs,
    loadStreak,
    getLogGreeting,
} from '@/lib/bodhiLogs';

// ─── Props ──────────────────────────────────────────────
interface BodhiLogsCarouselProps {
    userId: string | null;
    onLogSubmit: (text: string, entries: ParsedLogEntry[]) => void;
    onChipTap: (prompt: string) => void;
    visible: boolean;
}

// ─── Component ──────────────────────────────────────────
export default function BodhiLogsCarousel({
    userId,
    onLogSubmit,
    onChipTap,
    visible,
}: BodhiLogsCarouselProps) {
    const [streak, setStreak] = useState<AkhandaStreak>({ currentStreak: 0, longestStreak: 0, lastLogDate: '', graceUsedToday: false });
    const [todayCount, setTodayCount] = useState(0);
    const [todayCategories, setTodayCategories] = useState<Set<string>>(new Set());
    const scrollRef = useRef<HTMLDivElement>(null);

    // Load streak & today's logs
    useEffect(() => {
        if (!userId) return;
        loadStreak(userId).then(setStreak).catch(() => {});
        getTodayLogs(userId).then(logs => {
            setTodayCount(logs.length);
            const cats = new Set(logs.map(l => l.log_category));
            setTodayCategories(cats);
        }).catch(() => {});
    }, [userId]);

    if (!visible) return null;

    const streakEmoji = streak.currentStreak >= 30 ? '🔥' : streak.currentStreak >= 7 ? '✨' : streak.currentStreak >= 3 ? '⚡' : '🌱';
    const streakLabel = streak.currentStreak > 0 ? `${streak.currentStreak}-day Akhanda` : 'Start your streak';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            style={{ width: '100%', boxSizing: 'border-box' }}
        >
            {/* ── Streak + Today's Progress Bar ── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.35rem 0.85rem 0.25rem',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <motion.span
                        animate={streak.currentStreak > 0 ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{ fontSize: '0.9rem' }}
                    >{streakEmoji}</motion.span>
                    <span style={{
                        fontSize: '0.50rem', fontWeight: 800, letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: streak.currentStreak > 0 ? '#fbbf24' : 'rgba(255,255,255,0.35)',
                        fontFamily: "'Outfit',sans-serif",
                    }}>{streakLabel}</span>
                    {streak.currentStreak >= 7 && (
                        <span style={{
                            padding: '1px 6px', borderRadius: 99,
                            background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.35)',
                            fontSize: '0.36rem', fontWeight: 800, color: '#fbbf24',
                            letterSpacing: '0.06em',
                        }}>AKHANDA PRANA</span>
                    )}
                </div>
                <span style={{
                    fontSize: '0.42rem', fontWeight: 700,
                    color: 'rgba(255,255,255,0.28)', fontFamily: 'monospace',
                }}>{todayCount} logged today</span>
            </div>

            {/* ── Section Label ── */}
            <div style={{
                padding: '0.15rem 0.85rem 0.3rem',
                display: 'flex', alignItems: 'center', gap: 5,
            }}>
                <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ width: 4, height: 4, borderRadius: '50%', background: '#a78bfa', boxShadow: '0 0 6px rgba(167,139,250,0.8)' }}
                />
                <span style={{
                    fontSize: '0.40rem', fontWeight: 800, color: 'rgba(167,139,250,0.60)',
                    letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'monospace',
                }}>✦ Daily Sadhana Log</span>
            </div>

            {/* ── Chip Carousel ── */}
            <div
                ref={scrollRef}
                style={{
                    display: 'flex', gap: '0.4rem',
                    overflowX: 'auto', overflowY: 'hidden',
                    padding: '0.15rem 0.85rem 0.5rem',
                    WebkitOverflowScrolling: 'touch' as any,
                    scrollbarWidth: 'none' as any,
                    msOverflowStyle: 'none' as any,
                }}
            >
                <style>{`.logs-carousel::-webkit-scrollbar{display:none}`}</style>
                {LOG_CATEGORIES.map(cat => {
                    const isDone = todayCategories.has(cat.id);
                    return (
                        <motion.button
                            key={cat.id}
                            whileTap={{ scale: 0.92 }}
                            whileHover={{ scale: 1.04 }}
                            onClick={() => onChipTap(cat.quickPrompt)}
                            style={{
                                flexShrink: 0,
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '0.38rem 0.72rem',
                                borderRadius: 999,
                                background: isDone
                                    ? `${cat.color}18`
                                    : 'rgba(255,255,255,0.04)',
                                border: `1.5px solid ${isDone ? `${cat.color}55` : 'rgba(255,255,255,0.10)'}`,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            {isDone && (
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    background: `radial-gradient(ellipse at 30% 50%, ${cat.color}15 0%, transparent 70%)`,
                                    pointerEvents: 'none',
                                }} />
                            )}
                            <span style={{ fontSize: '0.82rem', position: 'relative', zIndex: 1 }}>{cat.emoji}</span>
                            <div style={{ position: 'relative', zIndex: 1, textAlign: 'left' }}>
                                <span style={{
                                    display: 'block',
                                    fontSize: '0.52rem', fontWeight: 700,
                                    color: isDone ? cat.color : 'rgba(255,255,255,0.75)',
                                    fontFamily: "'Outfit',sans-serif",
                                    lineHeight: 1.1,
                                    whiteSpace: 'nowrap',
                                }}>{cat.label}</span>
                                <span style={{
                                    display: 'block',
                                    fontSize: '0.34rem',
                                    color: isDone ? `${cat.color}88` : 'rgba(255,255,255,0.28)',
                                    fontFamily: "'Outfit',sans-serif",
                                    whiteSpace: 'nowrap',
                                }}>{isDone ? '✓ Logged' : cat.sublabel}</span>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </motion.div>
    );
}
