'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';
import { useLanguage } from '@/context/LanguageContext';
import CelestialHeaderIcon from '@/components/Dashboard/CelestialHeaderIcon';

interface Props {
    displayName?: string;
    greeting?: { emoji: string; text: string; period: string } | null;
    /** Compact = morning/evening meditation hour — shorter height */
    isCompact?: boolean;
}

export default function DailyInsightHero({ displayName = 'Seeker', greeting, isCompact = false }: Props) {
    const tod = useTimeOfDay();
    const { lang } = useLanguage();

    const greetText = greeting?.text ?? tod.label;
    const greetSub = greeting?.period ?? (lang === 'hi' ? tod.sanskrit : 'Your Conscious OS');

    return (
        <motion.section
            // Height glides smoothly: compact (meditation hours) ↔ full (work/rest hours)
            animate={{ minHeight: isCompact ? '38vh' : '52vh' }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: isCompact ? '2.5rem 1.5rem 2rem' : '4rem 1.5rem 3rem',
                transition: 'padding 1.2s cubic-bezier(0.22,1,0.36,1)',
            }}
        >
            {/* Period badge */}
            <motion.div
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.6rem' }}
            >
                <CelestialHeaderIcon />
                <span style={{
                    fontSize: '0.52rem', letterSpacing: '0.32em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.32)', fontFamily: 'monospace',
                }}>{tod.period}</span>
            </motion.div>

            {/* Main greeting */}
            <motion.h1
                key={greetText}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
                style={{
                    margin: 0,
                    fontFamily: "'Playfair Display', Georgia, serif",
                    // Compact = whisper small; full = more presence
                    fontSize: isCompact
                        ? 'clamp(1.3rem, 4vw, 1.9rem)'
                        : 'clamp(1.7rem, 5vw, 2.6rem)',
                    fontWeight: 600, lineHeight: 1.18,
                    color: 'rgba(255,255,255,0.92)',
                    letterSpacing: '-0.01em',
                    textShadow: '0 2px 24px rgba(0,0,0,0.55)',
                    transition: 'font-size 1s ease',
                }}
            >
                {greetText},{' '}
                <span style={{
                    color: tod.accent,
                    filter: `drop-shadow(0 0 12px ${tod.accent}80)`,
                }}>
                    {displayName}
                </span>
            </motion.h1>

            {/* Subtext */}
            {!isCompact && (
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
                    style={{
                        margin: '0.6rem 0 0', fontSize: '0.72rem',
                        color: 'rgba(255,255,255,0.35)',
                        letterSpacing: '0.07em', fontStyle: 'italic',
                    }}
                >
                    {greetSub} · {tod.sanskrit}
                </motion.p>
            )}
        </motion.section>
    );
}
