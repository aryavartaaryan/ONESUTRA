'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';

// Sanskrit affirmations that rotate with the period
const AFFIRMATIONS: Record<string, string[]> = {
    morning: ['शुभोदय — Rise with the Sun', 'Let your light precede you.', 'A new cycle begins.'],
    noon: ['शुभ मध्याह्न — Sustain your fire', 'Channel the midday sun.', 'Flow with intention.'],
    evening: ['शुभ सन्ध्या — Ease into stillness', 'Let the day dissolve.', 'The dusk is yours.'],
    night: ['शुभ रात्रि — The sacred dark', 'Rest is not surrender — it is wisdom.', 'Stars hold space for you.'],
};

interface Props {
    displayName?: string;
}

export default function EphemeralGreeting({ displayName = 'Seeker' }: Props) {
    const [isVisible, setIsVisible] = useState(true);
    const tod = useTimeOfDay();

    const affirmations = AFFIRMATIONS[tod.period];
    // Pick a stable affirmation for this session
    const affirmation = affirmations[Math.floor(Date.now() / 86400000) % affirmations.length];

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    key="ephemeral-greeting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.05, filter: 'blur(12px)' }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        textAlign: 'center', gap: '1.5rem',
                        background: 'rgba(6,4,18,0.96)',
                        backdropFilter: 'blur(32px)',
                        WebkitBackdropFilter: 'blur(32px)',
                        padding: '2rem',
                    }}
                    aria-live="polite"
                >
                    {/* Period emoji pulse */}
                    <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.15, duration: 1.0, ease: 'easeOut' }}
                        style={{ fontSize: '3rem', lineHeight: 1 }}
                    >
                        {tod.emoji}
                    </motion.div>

                    {/* Main greeting */}
                    <motion.h1
                        initial={{ y: 24, opacity: 0, filter: 'blur(6px)' }}
                        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                        transition={{ delay: 0.3, duration: 1.5, ease: 'easeOut' }}
                        style={{
                            margin: 0,
                            fontFamily: "'Playfair Display', Georgia, serif",
                            fontSize: 'clamp(2rem, 6vw, 3.5rem)',
                            fontWeight: 700,
                            letterSpacing: '-0.01em',
                            lineHeight: 1.15,
                            // Gold-to-white gradient text
                            background: 'linear-gradient(135deg, #D4AF37 0%, rgba(255,255,255,0.95) 60%, #D4AF37 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        {tod.label}, {displayName}.
                    </motion.h1>

                    {/* Sanskrit / affirmation subtext */}
                    <motion.p
                        initial={{ y: 16, opacity: 0, filter: 'blur(4px)' }}
                        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                        transition={{ delay: 0.7, duration: 1.2, ease: 'easeOut' }}
                        style={{
                            margin: 0,
                            fontSize: 'clamp(0.85rem, 2.5vw, 1.1rem)',
                            color: 'rgba(255,255,255,0.48)',
                            fontStyle: 'italic',
                            letterSpacing: '0.06em',
                            maxWidth: '32rem',
                        }}
                    >
                        {affirmation}
                    </motion.p>

                    {/* Dissolve countdown bar */}
                    <motion.div
                        initial={{ width: '6rem', opacity: 0 }}
                        animate={{ width: '0rem', opacity: [0, 0.45, 0.45, 0] }}
                        transition={{ delay: 0.8, duration: 2.2, ease: 'linear' }}
                        style={{
                            height: 1,
                            background: `linear-gradient(90deg, transparent, ${tod.accent}, transparent)`,
                            borderRadius: 999,
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
