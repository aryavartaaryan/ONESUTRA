'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';

// ── Rich time-of-day thoughts ─────────────────────────────────────────────────
const THOUGHTS: Record<string, { greeting: string; thought: string; sub: string }[]> = {
    morning: [
        {
            greeting: 'Shubh Prabhat',
            thought: 'The morning is not just a time — it is a rebirth.',
            sub: 'Cortisol peaks at dawn to energise you. Ride it with intention.',
        },
        {
            greeting: 'Shubh Prabhat',
            thought: 'What you do in the first hour sets the tone for the next 23.',
            sub: 'Ancient rishis called the Brahma Muhurta — 4 to 6 AM — the hour of creation.',
        },
        {
            greeting: 'Shubh Prabhat',
            thought: 'Serotonin rises with sunlight. Let it fill your mind before screens do.',
            sub: 'Your dopamine is at full capacity. Spend it on what matters most.',
        },
    ],
    noon: [
        {
            greeting: 'Good Afternoon',
            thought: 'The sun is at its apex. So is your capacity for deep work.',
            sub: 'Peak cortisol has passed — your prefrontal cortex is now at maximum clarity.',
        },
        {
            greeting: 'Shubh Madhyahna',
            thought: 'Midday is not a pause — it is the culmination of your morning intention.',
            sub: 'Rāga frequencies now can sustain your alpha waves and keep you in flow.',
        },
        {
            greeting: 'Channel the Day',
            thought: 'Every great civilisation honoured the midday hour. Be productive. Be present.',
            sub: 'This is the optimal window for problem-solving and creative output.',
        },
    ],
    evening: [
        {
            greeting: 'Shubh Sandhya',
            thought: 'Sunsets are reminders that endings can be extraordinarily beautiful.',
            sub: 'Serotonin prepares to become melatonin. Let your body move toward rest and reflection.',
        },
        {
            greeting: 'Shubh Sandhya',
            thought: 'The Sandhya hour — twilight — was always considered sacred. Pause. Reflect.',
            sub: 'Evening Rāgas trigger theta brainwaves linked to creativity, insight, and emotional healing.',
        },
        {
            greeting: 'Shubh Sandhya',
            thought: 'You have done enough today. Now let ancient sound dissolve the stress you carried.',
            sub: 'Rāga Yaman has calmed the minds of warriors, artists and scholars for 5,000 years.',
        },
    ],
    night: [
        {
            greeting: 'Shubh Ratri',
            thought: 'Sleep is not downtime — it is the most productive thing you will do today.',
            sub: 'Growth hormone surges during deep sleep. Your body rebuilds. Your mind consolidates.',
        },
        {
            greeting: 'Shubh Ratri',
            thought: 'The stars are the oldest teachers. They do their greatest work in silence.',
            sub: 'Delta brainwaves during sleep repair neural pathways. Tomorrow\'s genius is built tonight.',
        },
        {
            greeting: 'Shubh Ratri',
            thought: 'Every master in history protected their sleep. Rest is not weakness — it is strategy.',
            sub: 'Cortisol drops, melatonin rises, and ancient Rāgas can deepen your journey into delta.',
        },
    ],
};

interface Props { displayName?: string; userId?: string | null; }

export default function EphemeralGreeting({ displayName = 'Seeker', userId }: Props) {
    const tod = useTimeOfDay();
    const thoughtPool = THOUGHTS[tod.period] ?? THOUGHTS.morning;
    const thought = thoughtPool[Math.floor(Date.now() / 86400000) % thoughtPool.length];

    // ── Once-per-user-per-day guard ──────────────────────────────────────────
    // CRITICAL: userId starts null (Firebase resolves async). Recomputing
    // greetingKey on every render causes useEffect to reset the 4500ms timer
    // each time userId changes null→uid, blocking the screen indefinitely.
    // Fix: pin the key in a ref at first render — never recomputed.
    const greetingKeyRef = useRef<string>('');
    if (!greetingKeyRef.current && typeof window !== 'undefined') {
        const todayStr = new Date().toISOString().slice(0, 10);
        greetingKeyRef.current = `greeting_seen_${userId ?? 'anon'}_${todayStr}`;
    }
    const greetingKey = greetingKeyRef.current;

    const [isVisible, setIsVisible] = useState(() => {
        if (typeof window === 'undefined' || !greetingKey) return false;
        return !localStorage.getItem(greetingKey);
    });

    // Empty deps — fires exactly once at mount. Never resets on userId change.
    useEffect(() => {
        if (!isVisible || !greetingKey) return;
        const timer = setTimeout(() => {
            setIsVisible(false);
            try { localStorage.setItem(greetingKey, '1'); } catch { /**/ }
        }, 4500);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    key="ephemeral-greeting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.04, filter: 'blur(14px)' }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        textAlign: 'center', gap: '1.2rem',
                        background: 'rgba(4,2,14,0.97)',
                        backdropFilter: 'blur(32px)',
                        WebkitBackdropFilter: 'blur(32px)',
                        padding: '2rem',
                    }}
                    aria-live="polite"
                >
                    {/* Emoji */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.9, ease: 'easeOut' }}
                        style={{ fontSize: '3.2rem', lineHeight: 1 }}
                    >
                        {tod.emoji}
                    </motion.div>

                    {/* Time-of-day greeting + name */}
                    <motion.h1
                        initial={{ y: 22, opacity: 0, filter: 'blur(8px)' }}
                        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                        transition={{ delay: 0.28, duration: 1.4, ease: 'easeOut' }}
                        style={{
                            margin: 0,
                            fontFamily: "'Playfair Display', Georgia, serif",
                            fontSize: 'clamp(1.9rem, 5.5vw, 3.2rem)',
                            fontWeight: 700,
                            letterSpacing: '-0.02em',
                            lineHeight: 1.15,
                            background: `linear-gradient(135deg, ${tod.accent} 0%, rgba(255,255,255,0.95) 55%, ${tod.accent} 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        {thought.greeting}, {displayName}.
                    </motion.h1>

                    {/* Main thought — prominent */}
                    <motion.p
                        initial={{ y: 16, opacity: 0, filter: 'blur(5px)' }}
                        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                        transition={{ delay: 0.55, duration: 1.2, ease: 'easeOut' }}
                        style={{
                            margin: 0,
                            fontFamily: "'Playfair Display', Georgia, serif",
                            fontSize: 'clamp(1.0rem, 2.8vw, 1.4rem)',
                            fontWeight: 400,
                            fontStyle: 'italic',
                            color: 'rgba(255,255,255,0.82)',
                            letterSpacing: '0.01em',
                            maxWidth: '36rem',
                            lineHeight: 1.6,
                        }}
                    >
                        &ldquo;{thought.thought}&rdquo;
                    </motion.p>

                    {/* Science sub-line */}
                    <motion.p
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.90, duration: 1.0, ease: 'easeOut' }}
                        style={{
                            margin: 0,
                            fontSize: 'clamp(0.64rem, 1.8vw, 0.80rem)',
                            color: 'rgba(255,255,255,0.38)',
                            letterSpacing: '0.06em',
                            maxWidth: '30rem',
                            lineHeight: 1.65,
                            fontStyle: 'italic',
                        }}
                    >
                        {thought.sub}
                    </motion.p>

                    {/* Dissolve bar */}
                    <motion.div
                        initial={{ width: '8rem', opacity: 0 }}
                        animate={{ width: '0rem', opacity: [0, 0.50, 0.50, 0] }}
                        transition={{ delay: 0.9, duration: 3.6, ease: 'linear' }}
                        style={{
                            height: 1,
                            background: `linear-gradient(90deg, transparent, ${tod.accent}, transparent)`,
                            borderRadius: 999,
                        }}
                    />

                    {/* Brand whisper */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.22 }}
                        transition={{ delay: 1.2, duration: 1.0 }}
                        style={{ margin: 0, fontSize: '0.50rem', letterSpacing: '0.28em', fontFamily: 'monospace', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}
                    >
                        Pranav Samādhān · Ancient Wisdom · Modern Life
                    </motion.p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
