'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';
import styles from './PranaField.module.css';

// ── Particle orb data ─────────────────────────────────────────────────────────
const VIBES = [
    { color: '#FFD700', label: 'Meditating', shadow: 'rgba(255,215,0,0.6)' },
    { color: '#60A5FA', label: 'Chanting', shadow: 'rgba(96,165,250,0.6)' },
    { color: '#34D399', label: 'Learning', shadow: 'rgba(52,211,153,0.6)' },
    { color: '#F472B6', label: 'Journaling', shadow: 'rgba(244,114,182,0.6)' },
    { color: '#A78BFA', label: 'Pranayama', shadow: 'rgba(167,139,250,0.6)' },
];

const ORBS = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    vibe: VIBES[i % VIBES.length],
    x: 5 + Math.random() * 90,
    y: 8 + Math.random() * 84,
    size: 6 + Math.random() * 10,
    delay: Math.random() * 4,
    dur: 8 + Math.random() * 10,
}));

// ── Ticker messages ────────────────────────────────────────────────────────────
const TICKER = [
    '🌅 Someone in Pune just started Surya Namaskar...',
    '🎵 A seeker in London completed 108 chants...',
    '🌿 New Sankalpa set in Toronto — "Be fully present."',
    '🧘 3 souls in Mumbai entered deep meditation...',
    '✨ Arjun in Delhi just finished 25-min Pomodoro...',
    '🙏 Collective gratitude from Bengaluru circle...',
    '🌊 Someone in Bali completed Pranayama cycle...',
    '📿 New chant circle opened in Singapore...',
];

// ── Tribe tags ─────────────────────────────────────────────────────────────────
const TRIBES = [
    { id: 'all', label: 'All Seekers 🌐', count: 1248 },
    { id: 'risers', label: 'Early Risers 🌅', count: 341 },
    { id: 'coders', label: 'Vedic Coders 💻', count: 218 },
    { id: 'hustlers', label: 'Dharma Hustlers 🚀', count: 189 },
    { id: 'silent', label: 'Silent Meditators 🧘', count: 500 },
];

// ── Aura story avatars ─────────────────────────────────────────────────────────
const AURAS = [
    { name: 'Arya', initials: 'AR', color: '#FFD700', note: 'In deep focus flow...' },
    { name: 'Siddha', initials: 'SI', color: '#60A5FA', note: 'Completed 108 Gayatri chants' },
    { name: 'Veda', initials: 'VE', color: '#34D399', note: 'Morning yoga complete ✨' },
    { name: 'Rishi', initials: 'RI', color: '#F472B6', note: 'Journaled for 15 mins today' },
    { name: 'Dhruv', initials: 'DH', color: '#A78BFA', note: 'Pranayama done, feeling clear' },
    { name: 'Kavya', initials: 'KA', color: '#FB923C', note: 'Set morning sankalpa 🌅' },
];

export default function PranaField() {
    const [synced, setSynced] = useState(false);
    const [syncPct, setSyncPct] = useState(0);
    const [activeTribe, setActiveTribe] = useState('all');
    const [tickerIdx, setTickerIdx] = useState(0);
    const [ripple, setRipple] = useState(false);
    const [auraOpen, setAuraOpen] = useState<number | null>(null);
    const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const mouseX = useMotionValue(50);
    const mouseY = useMotionValue(50);
    const cloudX = useSpring(mouseX, { stiffness: 30, damping: 20 });
    const cloudY = useSpring(mouseY, { stiffness: 30, damping: 20 });

    // Ticker cycling
    useEffect(() => {
        const t = setInterval(() => setTickerIdx(i => (i + 1) % TICKER.length), 3200);
        return () => clearInterval(t);
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        mouseX.set(((e.clientX - r.left) / r.width) * 100);
        mouseY.set(((e.clientY - r.top) / r.height) * 100);
    }, [mouseX, mouseY]);

    // Long-press sync
    const startSync = () => {
        if (synced) return;
        let pct = 0;
        holdTimer.current = setInterval(() => {
            pct += 2;
            setSyncPct(pct);
            if (pct >= 100) {
                clearInterval(holdTimer.current!);
                setSynced(true);
                setRipple(true);
                setTimeout(() => setRipple(false), 1400);
            }
        }, 30);
    };
    const endSync = () => {
        if (holdTimer.current) clearInterval(holdTimer.current);
        if (!synced) setSyncPct(0);
    };

    const tribeCount = TRIBES.find(t => t.id === activeTribe)?.count ?? 1248;

    return (
        <div className={styles.wrapper}>
            {/* ── Header ── */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <span className={styles.liveDot} />
                    <span className={styles.headline}>PranaVerse · Live Stream</span>
                </div>
                <span className={styles.soulCount}>{tribeCount.toLocaleString()} souls</span>
            </div>

            <p className={styles.subline}>Don&apos;t just scroll. <em>Resonate.</em></p>

            {/* ── Particle cloud ── */}
            <div className={styles.cloudWrap} onMouseMove={handleMouseMove}>
                {/* Orb field */}
                <div className={styles.orbField}>
                    {ORBS.map(orb => (
                        <motion.div
                            key={orb.id}
                            className={styles.orb}
                            style={{
                                left: `${orb.x}%`,
                                top: `${orb.y}%`,
                                width: `${orb.size}px`,
                                height: `${orb.size}px`,
                                background: orb.vibe.color,
                                boxShadow: `0 0 ${orb.size * 2}px ${orb.vibe.shadow}`,
                            }}
                            animate={{
                                x: [0, (Math.random() - 0.5) * 26, (Math.random() - 0.5) * 20, 0],
                                y: [0, (Math.random() - 0.5) * 24, (Math.random() - 0.5) * 18, 0],
                                opacity: [0.6, 0.9, 0.7, 0.6],
                            }}
                            transition={{
                                duration: orb.dur, delay: orb.delay,
                                repeat: Infinity, ease: 'easeInOut',
                            }}
                        />
                    ))}
                </div>

                {/* Sync Prana Button — center */}
                <div className={styles.syncCenter}>
                    {ripple && (
                        <>
                            {[0, 0.15, 0.3].map(d => (
                                <motion.div key={d} className={styles.rippleRing}
                                    initial={{ scale: 0.5, opacity: 0.8 }}
                                    animate={{ scale: 3.5, opacity: 0 }}
                                    transition={{ duration: 1.4, delay: d, ease: 'easeOut' }}
                                />
                            ))}
                        </>
                    )}
                    <motion.button
                        className={`${styles.syncBtn} ${synced ? styles.syncBtnDone : ''}`}
                        onMouseDown={startSync} onMouseUp={endSync} onMouseLeave={endSync}
                        onTouchStart={startSync} onTouchEnd={endSync}
                        whileTap={{ scale: 0.92 }}
                    >
                        {/* Progress ring */}
                        <svg className={styles.syncRing} viewBox="0 0 52 52">
                            <circle cx="26" cy="26" r="23" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2.5" />
                            <circle cx="26" cy="26" r="23" fill="none" stroke="#FFD700" strokeWidth="2.5"
                                strokeDasharray={`${(syncPct / 100) * 144.5} 144.5`}
                                strokeDashoffset="36.125"
                                strokeLinecap="round"
                            />
                        </svg>
                        <span className={styles.syncIcon}>
                            {synced ? '✦' : '🪷'}
                        </span>
                        <span className={styles.syncLabel}>
                            {synced ? 'Connected' : syncPct > 0 ? 'Hold...' : 'Sync Energy'}
                        </span>
                    </motion.button>
                </div>

                {/* Vibe ticker */}
                <div className={styles.tickerWrap}>
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={tickerIdx}
                            className={styles.tickerText}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.5 }}
                        >
                            {TICKER[tickerIdx]}
                        </motion.p>
                    </AnimatePresence>
                </div>
            </div>

            {/* ── Tribe Tags ── */}
            <div className={styles.tribesRow}>
                {TRIBES.map(t => (
                    <button
                        key={t.id}
                        className={`${styles.tribeTag} ${activeTribe === t.id ? styles.tribeTagActive : ''}`}
                        onClick={() => setActiveTribe(t.id)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── Aura Stories ── */}
            <div className={styles.auraRow}>
                <span className={styles.auraLabel}>Aura Stories</span>
                <div className={styles.auraScroll}>
                    {AURAS.map((a, i) => (
                        <div key={i} className={styles.auraItem} onClick={() => setAuraOpen(auraOpen === i ? null : i)}>
                            <div className={styles.auraRing} style={{ '--ring-color': a.color } as React.CSSProperties}>
                                <div className={styles.auraAvatar} style={{ background: a.color }}>
                                    <span className={styles.auraInitials}>{a.initials}</span>
                                </div>
                            </div>
                            <span className={styles.auraName}>{a.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Aura Story open ── */}
            <AnimatePresence>
                {auraOpen !== null && (
                    <motion.div
                        className={styles.auraCard}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35 }}
                    >
                        <div className={styles.auraCardInner}>
                            <div className={styles.auraCardAvatar}
                                style={{ background: AURAS[auraOpen].color }}>
                                {AURAS[auraOpen].initials}
                            </div>
                            <div>
                                <p className={styles.auraCardName}>{AURAS[auraOpen].name}</p>
                                <p className={styles.auraCardNote}>{AURAS[auraOpen].note}</p>
                                <p className={styles.aiNote}>✦ AI Guru: {AURAS[auraOpen].name} is in a high-energy state. Send positive prana?</p>
                            </div>
                        </div>
                        <button className={styles.sendPranaBtn}>🙏 Send Prana</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Footer ── */}
            <p className={styles.footer}>
                {synced
                    ? `✦ You are synced with ${tribeCount.toLocaleString()} PranaVerse souls.`
                    : `${tribeCount.toLocaleString()} seekers are raising the vibration on PranaVerse right now.`}
            </p>
        </div>
    );
}
