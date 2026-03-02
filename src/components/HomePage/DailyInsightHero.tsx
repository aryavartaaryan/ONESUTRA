'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';
import { useLanguage } from '@/context/LanguageContext';
import RaagMiniDash from '@/components/Dashboard/RaagMiniDash';
import CelestialHeaderIcon from '@/components/Dashboard/CelestialHeaderIcon';

// ── Circadian image pools (local fallbacks keyed by period) ──────────────────
const BG_IMAGES: Record<string, string[]> = {
    morning: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
        'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1200&q=80',
    ],
    noon: [
        'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&q=80',
        'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=1200&q=80',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80',
    ],
    evening: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80',
        'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=1200&q=80',
        'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&q=80',
    ],
    night: [
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80',
        'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=1200&q=80',
        'https://images.unsplash.com/photo-1475274047050-1d0c0975f9f1?w=1200&q=80',
    ],
};

// Pick image by 30-min slot so it changes every half hour
function getSlotImage(period: string): string {
    const slot = Math.floor(Date.now() / (30 * 60_000));
    const pool = BG_IMAGES[period] ?? BG_IMAGES.morning;
    return pool[slot % pool.length];
}

// ── Minimal search bar ────────────────────────────────────────────────────────
function SearchBar() {
    const [open, setOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <motion.div
                animate={{ width: open ? 180 : 36 }}
                transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                style={{
                    height: 36, borderRadius: 999,
                    background: open ? 'rgba(255,255,255,0.12)' : 'transparent',
                    border: open ? '1px solid rgba(255,255,255,0.18)' : '1px solid transparent',
                    display: 'flex', alignItems: 'center',
                    overflow: 'hidden', backdropFilter: open ? 'blur(12px)' : 'none',
                }}
            >
                <button
                    onClick={() => setOpen(o => !o)}
                    style={{
                        flexShrink: 0, width: 34, height: 34,
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'rgba(255,255,255,0.75)',
                    }}
                    aria-label="Search"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                </button>
                {open && (
                    <input
                        ref={inputRef}
                        placeholder="Search…"
                        style={{
                            flex: 1, background: 'none', border: 'none', outline: 'none',
                            color: 'white', fontSize: 13, paddingRight: 12,
                            caretColor: 'rgba(255,255,255,0.7)',
                        }}
                    />
                )}
            </motion.div>
        </div>
    );
}

// ── Embedded nav icons ────────────────────────────────────────────────────────
const NAV_LINKS = [
    {
        href: '/profile', label: 'Profile', icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <circle cx="12" cy="8" r="5" /><path d="M3 21c0-4 4-7 9-7s9 3 9 7" />
            </svg>
        )
    },
    {
        href: '/dhyan-kshetra', label: 'Meditation', icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M12 2L8 8H4l4 4-2 6 6-3 6 3-2-6 4-4h-4z" />
            </svg>
        )
    },
    {
        href: '/project-leela', label: 'Leela', icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 0 20M2 12h20" /><path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10M12 2a15 15 0 0 0-4 10 15 15 0 0 0 4 10" />
            </svg>
        )
    },
];

interface Props {
    displayName?: string;
    greeting?: { emoji: string; text: string; period: string } | null;
}

export default function DailyInsightHero({ displayName = 'Traveller', greeting }: Props) {
    const tod = useTimeOfDay();
    const { lang } = useLanguage();

    const [bgUrl, setBgUrl] = useState('');
    const [nextBgUrl, setNextBgUrl] = useState('');
    const [showNext, setShowNext] = useState(false);

    // Load initial bg image on mount
    useEffect(() => {
        const url = getSlotImage(tod.period);
        setBgUrl(url);
        // Preload + crossfade every 30 min
        const SLOT_MS = 30 * 60_000;
        const msToNext = SLOT_MS - (Date.now() % SLOT_MS);
        const timeout = setTimeout(() => {
            const next = getSlotImage(tod.period);
            setNextBgUrl(next);
            setShowNext(true);
            setTimeout(() => { setBgUrl(next); setShowNext(false); }, 2200);
        }, msToNext);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tod.period]);

    const greetText = greeting?.text ?? tod.label;
    const greetSub = greeting?.period ?? (lang === 'hi' ? tod.sanskrit : tod.raagTitle);

    return (
        <motion.section
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{
                position: 'relative',
                width: '100%',
                minHeight: '92dvh',
                borderRadius: '0 0 2.5rem 2.5rem',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                marginBottom: '1rem',
            }}
        >
            {/* ── Circadian nature background ── */}
            {bgUrl && (
                <div
                    style={{
                        position: 'absolute', inset: 0, zIndex: 0,
                        backgroundImage: `url(${bgUrl})`,
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        transition: 'opacity 2s ease',
                    }}
                    aria-hidden
                />
            )}
            {/* Crossfade to next slot image */}
            {showNext && nextBgUrl && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                    style={{ position: 'absolute', inset: 0, zIndex: 1, backgroundImage: `url(${nextBgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    aria-hidden
                />
            )}
            {/* Dark frosted overlay — ensures text legibility at all times */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 2,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.28) 40%, rgba(0,0,0,0.72) 100%)',
                backdropFilter: 'blur(0px)',
            }} aria-hidden />

            {/* ── Content layer ── */}
            <div style={{ position: 'relative', zIndex: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>

                {/* ── Embedded frameless nav (top row) ── */}
                <header style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.25rem 0',
                }}>
                    {/* Left: wordmark */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                            fontFamily: "'Playfair Display', Georgia, serif",
                            fontSize: '1.2rem', fontWeight: 700,
                            color: 'rgba(255,255,255,0.92)',
                            letterSpacing: '-0.01em',
                        }}>ReZo</span>
                        <span style={{
                            fontSize: '0.52rem', letterSpacing: '0.22em',
                            textTransform: 'uppercase', color: 'rgba(255,255,255,0.40)',
                            fontFamily: 'monospace',
                        }}>Pranav.AI</span>
                    </div>

                    {/* Right: search + icon links */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <SearchBar />
                        {NAV_LINKS.map(link => (
                            <Link
                                key={link.href}
                                href={link.href}
                                aria-label={link.label}
                                style={{
                                    width: 36, height: 36, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'rgba(255,255,255,0.72)',
                                    transition: 'color 0.2s, background 0.2s',
                                    background: 'rgba(255,255,255,0.06)',
                                }}
                            >
                                {link.icon}
                            </Link>
                        ))}
                    </div>
                </header>

                {/* ── Greeting block (centered, top 45%) ── */}
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    padding: '1.5rem 1.25rem 0',
                    textAlign: 'center', gap: '0.5rem',
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            marginBottom: '0.25rem',
                        }}
                    >
                        <CelestialHeaderIcon />
                        <span style={{
                            fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase',
                            color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace',
                        }}>{tod.period}</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={greetText}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                        style={{
                            margin: 0,
                            fontFamily: "'Playfair Display', Georgia, serif",
                            fontSize: 'clamp(2rem, 7vw, 3.6rem)',
                            fontWeight: 700, lineHeight: 1.1,
                            color: 'rgba(255,255,255,0.96)',
                            textShadow: '0 2px 32px rgba(0,0,0,0.6)',
                            letterSpacing: '-0.02em',
                        }}
                    >
                        {greetText}{' '}
                        <span style={{ color: tod.accent, filter: `drop-shadow(0 0 20px ${tod.accent}90)` }}>
                            {displayName}
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.6 }}
                        style={{
                            margin: '0.25rem 0 0',
                            fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)',
                            letterSpacing: '0.06em', fontStyle: 'italic',
                        }}
                    >
                        {greetSub}
                    </motion.p>
                </div>

                {/* ── Raag Player — frosted card at the bottom of the hero ── */}
                <div style={{ padding: '0 0.75rem 1.5rem' }}>
                    <div style={{
                        borderRadius: '1.75rem',
                        overflow: 'hidden',
                        background: 'rgba(10,10,20,0.55)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255,255,255,0.10)',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.45)',
                    }}>
                        <RaagMiniDash />
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
