'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────
interface SutraLayer {
    simpleWords: string;
    historicalContext: string;
    impact: string;
}

interface NewsAction {
    type: 'petition' | 'share' | 'donate';
    label: string;
    link: string;
}

interface Article {
    id: string;
    headline: string;
    summary60Words: string;
    energyTag: 'Tamasic' | 'Rajasic' | 'Sattvic';
    category: string;
    source: string;
    link?: string;
    imageUrl?: string;
    timeAgo?: string;
    sutraLayer: SutraLayer;
    action?: NewsAction | null;
}

// ── Brand accent ─────────────────────────────────────────────────────────────
const ACCENT = '#ff8c52';

// ── Card transition variants ──────────────────────────────────────────────────
function cardVariants(dir: 'up' | 'down') {
    return {
        enter: {
            y: dir === 'up' ? '100%' : '-100%',
            opacity: 0,
        },
        center: {
            y: 0, opacity: 1,
            transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
        },
        exit: {
            y: dir === 'up' ? '-100%' : '100%',
            opacity: 0,
            transition: { duration: 0.32, ease: 'easeIn' as const },
        },
    };
}

// ── Sutra Chip ────────────────────────────────────────────────────────────────
type ChipKey = 'simpleWords' | 'historicalContext' | 'impact';
const CHIPS: { key: ChipKey; label: string; emoji: string }[] = [
    { key: 'simpleWords', label: 'Explain Simply', emoji: '💡' },
    { key: 'historicalContext', label: 'History', emoji: '📜' },
    { key: 'impact', label: 'Impact on Me', emoji: '🎯' },
];

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OutPlugsPage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [idx, setIdx] = useState(0);
    const [dir, setDir] = useState<'up' | 'down'>('up');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<number>(0);
    const [activeChip, setActiveChip] = useState<ChipKey | null>(null);
    const [newBadgeCount, setNewBadgeCount] = useState(0);
    const wheelLock = useRef(false);

    // ── Fetch / refresh news ──────────────────────────────────────────────────
    const fetchNews = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const res = await fetch('/api/outplugs-feed', { cache: 'no-store' });
            const data = await res.json();
            if (data.articles?.length) {
                if (silent && articles.length > 0) {
                    setNewBadgeCount(data.articles.length);
                } else {
                    setArticles(data.articles);
                    setIdx(0);
                    setNewBadgeCount(0);
                }
                setLastRefresh(Date.now());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [articles.length]);

    // Initial load
    useEffect(() => {
        fetchNews(false);
    }, []);

    // ── Poll every 10 minutes ────────────────────────────────────────────────
    useEffect(() => {
        const interval = setInterval(() => fetchNews(true), 10 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchNews]);

    // ── Navigation ───────────────────────────────────────────────────────────
    const goNext = useCallback(() => {
        if (articles.length <= 1) return;
        setDir('up');
        setActiveChip(null);
        setIdx(i => (i + 1) % articles.length);
    }, [articles.length]);

    const goPrev = useCallback(() => {
        if (articles.length <= 1) return;
        setDir('down');
        setActiveChip(null);
        setIdx(i => (i - 1 + articles.length) % articles.length);
    }, [articles.length]);

    // Wheel
    useEffect(() => {
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            if (wheelLock.current) return;
            wheelLock.current = true;
            if (e.deltaY > 30) goNext();
            else if (e.deltaY < -30) goPrev();
            setTimeout(() => { wheelLock.current = false; }, 600);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') goPrev();
        };
        window.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('wheel', onWheel);
            window.removeEventListener('keydown', onKey);
        };
    }, [goNext, goPrev]);

    // Touch/drag
    const handleDragEnd = (_: never, info: PanInfo) => {
        if (info.offset.y < -60) goNext();
        else if (info.offset.y > 60) goPrev();
    };

    const article = articles[idx];
    const fallbackBg = 'linear-gradient(160deg,#0a0a1a,#050a30)';

    // ── Loading screen ───────────────────────────────────────────────────────
    if (loading) {
        return (
            <div style={{
                minHeight: '100dvh', background: '#050a30',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '1rem',
            }}>
                <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ fontSize: '3rem', textShadow: '0 0 24px rgba(255,140,82,0.6)', color: '#ff8c52' }}
                >✧</motion.div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                    Fetching live news…
                </p>
            </div>
        );
    }

    if (!article) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0,
            overflow: 'hidden',
            background: '#000',
            fontFamily: 'var(--font-body, Inter, sans-serif)',
            userSelect: 'none',
        }}>
            {/* ── BACK BUTTON — floating top-left ─────────────────────────────── */}
            <Link href="/" style={{
                position: 'fixed', top: 'max(14px, env(safe-area-inset-top))', left: 14,
                zIndex: 200, textDecoration: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.85)', fontSize: '1rem',
            }}>←</Link>

            {/* ── WORDMARK — top-center, minimal ──────────────────────────────── */}
            <div style={{
                position: 'fixed', top: 'max(16px, env(safe-area-inset-top))', left: '50%',
                transform: 'translateX(-50%)', zIndex: 200, textAlign: 'center',
                pointerEvents: 'none',
            }}>
                <span style={{
                    fontSize: '0.55rem', letterSpacing: '0.25em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.55)', fontFamily: 'monospace', fontWeight: 700,
                    textShadow: '0 1px 8px rgba(0,0,0,0.8)',
                }}>outPLUGS</span>
            </div>

            {/* ── COUNTER — top-right ──────────────────────────────────────────── */}
            <div style={{
                position: 'fixed', top: 'max(16px, env(safe-area-inset-top))', right: 14,
                zIndex: 200,
                display: 'flex', alignItems: 'center', gap: '0.35rem',
            }}>
                {/* Refresh badge */}
                {newBadgeCount > 0 && (
                    <motion.button
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        onClick={() => { setArticles(prev => prev); fetchNews(false); setNewBadgeCount(0); }}
                        style={{
                            background: 'rgba(85,239,196,0.85)', border: 'none',
                            borderRadius: 999, padding: '0.2rem 0.55rem',
                            fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.08em',
                            color: '#000', cursor: 'pointer', fontFamily: 'monospace',
                        }}
                    >↑ {newBadgeCount} new</motion.button>
                )}
                {/* Refresh spinner */}
                {refreshing && (
                    <motion.span
                        animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}
                    >⟳</motion.span>
                )}
                <span style={{
                    fontSize: '0.6rem', fontFamily: 'monospace',
                    color: 'rgba(255,255,255,0.35)',
                    textShadow: '0 1px 6px rgba(0,0,0,0.9)',
                }}>{idx + 1}/{articles.length}</span>
            </div>

            {/* ── CARD STACK ───────────────────────────────────────────────────── */}
            <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                    key={`${idx}-${article.id}`}
                    variants={cardVariants(dir)}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0.15}
                    onDragEnd={handleDragEnd}
                    style={{
                        position: 'absolute', inset: 0,
                        cursor: 'grab',
                    }}
                >
                    {/* ── Full-bleed background photo ──────────────────────────────── */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: article.imageUrl ? `url(${article.imageUrl})` : undefined,
                        background: article.imageUrl ? undefined : fallbackBg,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }} />

                    {/* ── Scrim gradient — full screen dim ──────────────────────────────── */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'radial-gradient(circle at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.85) 100%)',
                        backdropFilter: article.imageUrl ? 'blur(4px)' : 'none',
                        WebkitBackdropFilter: article.imageUrl ? 'blur(4px)' : 'none',
                    }} />

                    {/* ── CONTENT — vertically centered ──────────────────────────────── */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        padding: 'max(4rem, env(safe-area-inset-top)) 1.5rem max(2rem, env(safe-area-inset-bottom))',
                        zIndex: 10,
                        display: 'flex', flexDirection: 'column',
                        justifyContent: 'center',
                    }}>
                        {/* Category + Source + Time row */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            marginBottom: '0.6rem', flexWrap: 'wrap',
                        }}>
                            <span style={{
                                padding: '0.18rem 0.55rem', borderRadius: 9999,
                                background: 'rgba(255,255,255,0.12)',
                                border: '1px solid rgba(255,255,255,0.20)',
                                fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.08em',
                                color: 'rgba(255,255,255,0.80)', fontFamily: 'monospace', textTransform: 'uppercase',
                            }}>
                                {article.category}
                            </span>
                            <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.42)', letterSpacing: '0.04em' }}>
                                {article.source}
                            </span>
                            <span style={{ marginLeft: 'auto', fontSize: '0.55rem', color: 'rgba(255,255,255,0.32)', fontFamily: 'monospace' }}>
                                {article.timeAgo}
                            </span>
                        </div>

                        {/* Headline */}
                        <h1 style={{
                            margin: '0 0 1rem',
                            fontFamily: "'Playfair Display', Georgia, serif",
                            fontSize: 'clamp(1.4rem, 6vw, 2rem)',
                            fontWeight: 700, lineHeight: 1.25,
                            color: '#fff',
                            letterSpacing: '-0.015em',
                            textShadow: '0 4px 20px rgba(0,0,0,0.6)',
                        }}>
                            {article.headline}
                        </h1>

                        {/* 60-word summary */}
                        <p style={{
                            margin: '0 0 1.5rem',
                            fontSize: 'clamp(0.85rem, 3.5vw, 1rem)',
                            lineHeight: 1.7,
                            color: 'rgba(255,255,255,0.85)',
                            fontWeight: 400,
                        }}>
                            {article.summary60Words}
                        </p>

                        {/* ── READ MORE BUTTON ──────────────────────────────────────────── */}
                        {article.link && (
                            <a
                                href={article.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onPointerDown={e => e.stopPropagation()}
                                onClick={e => e.stopPropagation()}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                    padding: '0.5rem 0.8rem', borderRadius: 9999,
                                    background: 'rgba(255,255,255,0.1)',
                                    border: `1px solid ${ACCENT}55`,
                                    marginBottom: '1rem',
                                    fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em',
                                    color: ACCENT, textDecoration: 'none',
                                    fontFamily: 'var(--font-header)',
                                    backdropFilter: 'blur(8px)',
                                    WebkitBackdropFilter: 'blur(8px)',
                                    alignSelf: 'flex-start',
                                }}
                            >
                                Read full story ↗
                            </a>
                        )}

                        {/* ── SUTRA CHIPS ─────────────────────────────────────────────── */}
                        <div style={{
                            display: 'flex', gap: '0.5rem',
                            overflowX: 'auto', scrollbarWidth: 'none',
                            marginBottom: activeChip ? '0.75rem' : '0.5rem',
                        }}>
                            {CHIPS.map(chip => {
                                const isActive = activeChip === chip.key;
                                return (
                                    <motion.button
                                        key={chip.key}
                                        onClick={e => { e.stopPropagation(); setActiveChip(prev => prev === chip.key ? null : chip.key); }}
                                        whileTap={{ scale: 0.93 }}
                                        style={{
                                            flexShrink: 0,
                                            display: 'flex', alignItems: 'center', gap: '0.28rem',
                                            padding: '0.38rem 0.8rem', borderRadius: 9999,
                                            border: `1px solid ${isActive ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.18)'}`,
                                            background: isActive
                                                ? 'rgba(255,255,255,0.18)'
                                                : 'rgba(0,0,0,0.40)',
                                            backdropFilter: 'blur(16px)',
                                            WebkitBackdropFilter: 'blur(16px)',
                                            cursor: 'pointer', whiteSpace: 'nowrap',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <span style={{ fontSize: '0.78rem' }}>{chip.emoji}</span>
                                        <span style={{
                                            fontSize: '0.68rem', fontWeight: 500,
                                            color: isActive ? '#fff' : 'rgba(255,255,255,0.70)',
                                            fontFamily: 'var(--font-header)',
                                        }}>{chip.label}</span>
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* ── SUTRA CONTEXT PANEL (slides up) ─────────────────────────── */}
                        <AnimatePresence mode="wait">
                            {activeChip && (
                                <motion.div
                                    key={activeChip}
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1, transition: { height: { duration: 0.28, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.2 } } }}
                                    exit={{ height: 0, opacity: 0, transition: { height: { duration: 0.2, ease: 'easeIn' }, opacity: { duration: 0.15 } } }}
                                    style={{ overflow: 'hidden', marginBottom: '0.5rem' }}
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div style={{
                                        padding: '0.85rem 1rem',
                                        background: 'rgba(5,10,40,0.82)',
                                        backdropFilter: 'blur(24px)',
                                        WebkitBackdropFilter: 'blur(24px)',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        borderRadius: 16,
                                    }}>
                                        {/* Label */}
                                        <p style={{
                                            margin: '0 0 0.5rem', fontSize: '0.55rem',
                                            letterSpacing: '0.15em', textTransform: 'uppercase',
                                            color: 'rgba(255,255,255,0.38)', fontFamily: 'monospace',
                                        }}>
                                            {CHIPS.find(c => c.key === activeChip)?.emoji} {CHIPS.find(c => c.key === activeChip)?.label}
                                        </p>
                                        <p style={{
                                            margin: 0,
                                            fontSize: 'clamp(0.78rem, 2.5vw, 0.88rem)',
                                            lineHeight: 1.65,
                                            color: 'rgba(255,255,255,0.85)',
                                            fontFamily: "'Playfair Display', Georgia, serif",
                                        }}>
                                            {article.sutraLayer[activeChip]}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── ACTION BUTTON (conditional) ─────────────────────────────── */}
                        {article.action && (
                            <motion.a
                                href={article.action.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                whileTap={{ scale: 0.96 }}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: '0.4rem', padding: '0.6rem 1rem',
                                    borderRadius: 9999, textDecoration: 'none',
                                    background: article.action.type === 'petition'
                                        ? 'rgba(232,93,4,0.20)'
                                        : 'rgba(85,239,196,0.15)',
                                    border: `1.5px solid ${article.action.type === 'petition' ? 'rgba(232,93,4,0.50)' : 'rgba(85,239,196,0.40)'}`,
                                    color: article.action.type === 'petition' ? '#ff8c52' : '#55efc4',
                                    fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em',
                                    fontFamily: 'var(--font-header)',
                                }}
                            >
                                {article.action.type === 'petition' ? '✍️' : '✧'} {article.action.label}
                            </motion.a>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* ── VERTICAL PROGRESS DOTS — right edge, minimal ────────────────── */}
            <div style={{
                position: 'fixed', right: 8, top: '50%', transform: 'translateY(-50%)',
                zIndex: 100,
                display: 'flex', flexDirection: 'column', gap: 5,
            }}>
                {articles.slice(0, Math.min(articles.length, 8)).map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            height: i === idx ? 20 : 4,
                            opacity: i === idx ? 1 : 0.28,
                            background: i === idx ? ACCENT : 'rgba(255,255,255,0.5)',
                        }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        onClick={() => { setDir(i > idx ? 'up' : 'down'); setIdx(i); setActiveChip(null); }}
                        style={{ width: 3, borderRadius: 9999, cursor: 'pointer' }}
                    />
                ))}
            </div>

            {/* ── SWIPE HINT (fades after first scroll) ───────────────────────── */}
            {idx === 0 && (
                <motion.div
                    initial={{ opacity: 0.7 }} animate={{ opacity: [0.7, 0] }}
                    transition={{ delay: 2.5, duration: 1.5 }}
                    style={{
                        position: 'fixed', bottom: 'max(5.5rem, calc(5rem + env(safe-area-inset-bottom)))',
                        left: '50%', transform: 'translateX(-50%)',
                        zIndex: 100, pointerEvents: 'none',
                        fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace',
                    }}
                >
                    ↑ swipe for next ↑
                </motion.div>
            )}
        </div>
    );
}
