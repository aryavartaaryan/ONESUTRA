'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import styles from './ReelPlayer.module.css';
import WaterWaveVisualizer from './WaterWaveVisualizer';
import OmInfinityLogo from '../OmInfinityLogo';

// ── Types ────────────────────────────────────────────────────────────────────
interface PanchangData {
    time: string;
    period: string;
    vara: string;
    paksha: string;
    tithi: string;
    dateStr: string;
}

interface Sankalp { id: string; text: string; done: boolean; }

interface ReelPlayerProps {
    greeting: { emoji: string; text: string; period: string } | null;
    displayName: string;
    panchangData: PanchangData;
    sankalpaItems: Sankalp[];
    onSankalpaToggle: (id: string) => void;
    onSankalpaRemove: (id: string) => void;
    onSankalpaAdd: (text: string) => void;
}

// ── Time-based background config ─────────────────────────────────────────────
function getTimeScene(h: number) {
    if (h >= 4 && h < 6) return {
        bg: 'linear-gradient(180deg, #0d0820 0%, #1a0a3d 35%, #2d1b69 70%, #4a2c8a 100%)',
        accent: '#b388ff', celestial: '🌙',
        raagLine: 'Brahma Muhurta · The Sacred Dawn Hour',
        raagSub: 'Silence before creation · Ancient rising',
    };
    if (h >= 6 && h < 12) return {
        bg: 'linear-gradient(180deg, #0a0400 0%, #5B2000 25%, #C4580E 55%, #F5A623 80%, #FFD580 100%)',
        accent: '#FFD580', celestial: '🌅',
        raagLine: 'Morning Raag · Awakening & Clarity',
        raagSub: 'Prabhata · Sacred energy · Divine morning',
    };
    if (h >= 12 && h < 15) return {
        bg: 'linear-gradient(180deg, #001020 0%, #002B6B 30%, #0055B8 65%, #1a78c2 100%)',
        accent: '#64C8FF', celestial: '☀️',
        raagLine: 'Noon Raag · Focus & midday clarity',
        raagSub: 'Madhyana · Full power · Divine Light',
    };
    if (h >= 15 && h < 18) return {
        bg: 'linear-gradient(180deg, #100500 0%, #5C1800 25%, #B04000 55%, #E88030 80%, #FFB060 100%)',
        accent: '#FFAA58', celestial: '🌤',
        raagLine: 'Afternoon Raag · Creative Flow',
        raagSub: 'Apraahna · Sacred creativity · Soft light',
    };
    if (h >= 18 && h < 20) return {
        bg: 'linear-gradient(180deg, #050010 0%, #1a0535 25%, #4a0d5c 50%, #8B2070 75%, #C8507C 100%)',
        accent: '#E8A0FF', celestial: '🪔',
        raagLine: 'Sandhya Raag · Evening Calm',
        raagSub: 'Dusk · Peace · Sacred settling',
    };
    if (h >= 20 && h < 23) return {
        bg: 'linear-gradient(180deg, #000208 0%, #030a20 30%, #081530 60%, #0f2050 100%)',
        accent: '#88AAFF', celestial: '🌙',
        raagLine: 'Night Raag for Deep Sleep',
        raagSub: 'Ratri · Stillness · Rest & restore',
    };
    return {
        bg: 'linear-gradient(180deg, #000005 0%, #010310 40%, #020820 100%)',
        accent: '#6677cc', celestial: '✨',
        raagLine: 'Midnight Raag · Deep stillness',
        raagSub: 'Nisha · Sacred dark · Dreamscape',
    };
}

// ── Tracks ───────────────────────────────────────────────────────────────────
const TRACKS = [
    {
        id: 'fusion', title: 'SuperFusion', likes: 1008,
        src: 'https://ik.imagekit.io/rcsesr4xf/flute.mp3?updatedAt=1771983487495',
        dualSrc: 'https://ik.imagekit.io/rcsesr4xf/sitar.mp3?updatedAt=1771983562343'
    },
    { id: 'gayatri', title: 'Gayatri Ghanpaath', likes: 248, src: 'https://ik.imagekit.io/rcsesr4xf/gayatri-mantra-ghanpaath.mp3', dualSrc: '' },
    { id: 'lalitha', title: 'Lalitha Sahasranamam', likes: 312, src: 'https://ik.imagekit.io/rcsesr4xf/Lalitha-Sahasranamam.mp3', dualSrc: '' },
    { id: 'shiva', title: 'Shiva Tandava Stotram', likes: 521, src: 'https://ik.imagekit.io/rcsesr4xf/Shiva-Tandav.mp3', dualSrc: '' },
    { id: 'brahma', title: 'Brahma Yagya', likes: 189, src: 'https://ik.imagekit.io/aup4wh6lq/BrahmaYagya.mp3', dualSrc: '' },
    { id: 'shanti', title: 'Shanti Path', likes: 403, src: 'https://ik.imagekit.io/rcsesr4xf/shanti-path.mp3', dualSrc: '' },
    { id: 'dainik', title: 'Dainik Agnihotra', likes: 167, src: 'https://ik.imagekit.io/aup4wh6lq/DainikAgnihotra.mp3?updatedAt=1771246817070', dualSrc: '' },
];

const INSIGHTS = [
    { icon: '✦', quote: '"The quiet mind is not empty — it is full of the universe."', source: 'Vedic Sutra' },
    { icon: '☽', quote: '"The moon does not fight. It waits. Patience is its mastery."', source: 'Vedic Wisdom' },
    { icon: '◈', quote: '"Let your actions be your temple. Let stillness be your prayer."', source: 'Bhagavad Gita' },
    { icon: '✧', quote: '"Rise before the sun, and the day belongs entirely to you."', source: 'Charaka Samhita' },
    { icon: '◉', quote: '"When the mind is pure, joy follows like a shadow that never leaves."', source: 'Dhammapada' },
    { icon: '⊕', quote: '"Serve, love, give, purify, meditate, realise."', source: 'Swami Sivananda' },
];

function getDailyInsight() {
    const d = new Date();
    return INSIGHTS[(d.getDate() * 3 + d.getMonth()) % INSIGHTS.length];
}

// ── Sankalpa Slide (first reel) ───────────────────────────────────────────────
interface SankalpaSlideProps {
    items: Sankalp[];
    scene: ReturnType<typeof getTimeScene>;
    onToggle: (id: string) => void;
    onRemove: (id: string) => void;
    onAdd: (text: string) => void;
    isFullScreen: boolean;
    onExpand: () => void;
}

function SankalpaSlide({ items, scene, onToggle, onRemove, onAdd, isFullScreen, onExpand }: SankalpaSlideProps) {
    const [draft, setDraft] = useState('');
    const [adding, setAdding] = useState(false);
    const done = items.filter(s => s.done).length;

    const add = () => {
        if (!draft.trim()) return;
        onAdd(draft.trim());
        setDraft('');
        setAdding(false);
    };

    return (
        <div
            className={`${styles.reelSlide} ${isFullScreen ? styles.reelSlideFull : ''}`}
            style={{ '--reel-bg': scene.bg, '--reel-accent': scene.accent } as React.CSSProperties}
            onClick={!isFullScreen ? onExpand : undefined}
        >
            <div className={styles.reelBg} />

            {/* Celestial glow overlay */}
            <div className={styles.sankalpaBg}>
                <motion.div
                    className={styles.celestialOrb}
                    animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ color: scene.accent }}
                >
                    {scene.celestial}
                </motion.div>
            </div>

            {/* Dismiss button in full screen */}
            {isFullScreen && (
                <button className={styles.dismissBtn} onClick={onExpand} aria-label="Exit full screen">✕</button>
            )}

            {/* Content */}
            <div className={styles.sankalpaContent} onClick={e => e.stopPropagation()}>
                <div className={styles.sankalpaTitleRow}>
                    <span className={styles.sankalpaLabel} style={{ color: scene.accent }}>🪔 The Mission</span>
                    <span className={styles.sankalpaProgress}>{done}/{items.length}</span>
                </div>
                <div className={styles.progressBar}>
                    <motion.div
                        className={styles.progressFill}
                        animate={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>

                <div className={styles.sankalpaList}>
                    <AnimatePresence initial={false}>
                        {items.map(item => (
                            <motion.div
                                key={item.id}
                                className={`${styles.sankalpaItem} ${item.done ? styles.sankalpaItemDone : ''}`}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 12, height: 0 }}
                                transition={{ duration: 0.22 }}
                                layout
                            >
                                <button className={styles.sankalpaCheck} onClick={() => onToggle(item.id)}>
                                    {item.done ? '✓' : ''}
                                </button>
                                <span className={styles.sankalpaText}>{item.text}</span>
                                <button className={styles.sankalpaRemove} onClick={() => onRemove(item.id)}>×</button>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    <AnimatePresence>
                        {adding ? (
                            <motion.div className={styles.sankalpaAddRow}
                                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                                <input
                                    className={styles.sankalpaInput}
                                    placeholder="Add a sacred intention…"
                                    value={draft}
                                    onChange={e => setDraft(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') add(); if (e.key === 'Escape') setAdding(false); }}
                                    autoFocus
                                />
                                <button className={styles.sankalpaConfirm} onClick={add}>+</button>
                                <button className={styles.sankalpaCancel} onClick={() => { setAdding(false); setDraft(''); }}>✕</button>
                            </motion.div>
                        ) : (
                            <motion.button
                                className={styles.sankalpaAddBtn}
                                style={{ borderColor: `${scene.accent}44`, color: scene.accent }}
                                onClick={() => setAdding(true)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                layout
                            >
                                + Add Saṅkalpa
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>

                {!isFullScreen && (
                    <div className={styles.tapHint}>
                        <span style={{ color: `${scene.accent}88` }}>↑ Swipe up for mantras</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Mantra Reel Slide ─────────────────────────────────────────────────────────
interface ReelSlideProps {
    track: typeof TRACKS[0];
    scene: ReturnType<typeof getTimeScene>;
    isActive: boolean;
    isFullScreen: boolean;
    onActivate: () => void;
}

function ReelSlide({ track, scene, isActive, isFullScreen, onActivate }: ReelSlideProps) {
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showInsight, setShowInsight] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const dualRef = useRef<HTMLAudioElement | null>(null);
    const insight = getDailyInsight();

    useEffect(() => {
        const a = new Audio(track.src);
        a.preload = 'metadata';
        audioRef.current = a;

        if (track.dualSrc) {
            const d = new Audio(track.dualSrc);
            d.preload = 'metadata';
            dualRef.current = d;
        }

        a.addEventListener('timeupdate', () => {
            if (a.duration) setProgress(a.currentTime / a.duration);
        });
        a.addEventListener('ended', () => { a.currentTime = 0; setPlaying(false); setProgress(0); });

        return () => { a.pause(); a.src = ''; dualRef.current?.pause(); };
    }, [track]);

    useEffect(() => {
        if (!isActive && playing) {
            audioRef.current?.pause();
            dualRef.current?.pause();
            setPlaying(false);
        }
    }, [isActive]);

    const toggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        const a = audioRef.current;
        const d = dualRef.current;
        if (!a) return;
        if (playing) {
            a.pause(); d?.pause(); setPlaying(false);
        } else {
            if (a.ended || a.currentTime >= a.duration - 0.1) { a.currentTime = 0; if (d) d.currentTime = 0; }
            a.play().catch(console.error);
            if (track.dualSrc && d) d.play().catch(console.error);
            setPlaying(true);
        }
    }, [playing, track]);

    return (
        <div
            className={`${styles.reelSlide} ${isFullScreen ? styles.reelSlideFull : ''}`}
            style={{ '--reel-bg': scene.bg, '--reel-accent': scene.accent } as React.CSSProperties}
            onClick={!isFullScreen ? onActivate : undefined}
        >
            <div className={styles.reelBg} />
            <div className={styles.vizWrap}>
                <WaterWaveVisualizer audioRef={audioRef} playing={playing} height={600} accentColor={scene.accent} />
            </div>

            {/* Top scene label */}
            <div className={styles.slideTopLabel}>
                <span style={{ color: scene.accent }}>{scene.celestial}</span>
                <span className={styles.slideRaagLine}>{scene.raagLine}</span>
            </div>

            {/* Center play button */}
            <div className={styles.centerArea} onClick={e => e.stopPropagation()}>
                <motion.button
                    className={`${styles.playBtn} ${playing ? styles.playBtnActive : ''}`}
                    onClick={toggle}
                    whileTap={{ scale: 0.88 }}
                    aria-label={playing ? 'Pause' : 'Play'}
                >
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={playing ? 'pause' : 'play'}
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.6, opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className={styles.playIcon}
                        >
                            {playing ? '⏸' : '▶'}
                        </motion.span>
                    </AnimatePresence>
                    {playing && (
                        <motion.span
                            className={styles.pulseRing}
                            animate={{ scale: [1, 1.9], opacity: [0.6, 0] }}
                            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                        />
                    )}
                </motion.button>
            </div>

            {/* Bottom panel — hides in full screen while playing */}
            <AnimatePresence>
                {(!isFullScreen || !playing) && (
                    <motion.div
                        className={styles.bottomPanel}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.35 }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className={styles.trackInfo}>
                            <span className={styles.trackBadge}>AUDIO NECTAR · PROJECT LEELA</span>
                            <div className={styles.trackTitleRow}>
                                <span className={styles.trackTitle}>{track.title}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button className={styles.linkBtn}
                                        onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(track.src); }}
                                        title="Share">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                        </svg>
                                    </button>
                                    <span className={styles.trackLikes}>🔥 {track.likes}</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.progressBar}>
                            <motion.div className={styles.progressFill} style={{ width: `${progress * 100}%` }} transition={{ duration: 0.1 }} />
                        </div>

                        <AnimatePresence>
                            {showInsight && (
                                <motion.div className={styles.insightCard}
                                    initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 14 }} transition={{ duration: 0.5 }}>
                                    <button className={styles.insightClose} onClick={() => setShowInsight(false)}>×</button>
                                    <span className={styles.insightIcon}>{insight.icon}</span>
                                    <p className={styles.insightQuote}>{insight.quote}</p>
                                    <span className={styles.insightSource}>{insight.source}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Link href="/dhyan-kshetra" className={styles.leelaLink}>
                            <OmInfinityLogo size={16} className={styles.leelaIcon} />
                            Open in Leela
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Full screen dismiss button */}
            {isFullScreen && (
                <button className={styles.dismissBtn} onClick={e => { e.stopPropagation(); onActivate(); }}>✕</button>
            )}
        </div>
    );
}

// ── Main ReelPlayer ───────────────────────────────────────────────────────────
export default function ReelPlayer({ greeting: _greeting, displayName: _displayName, panchangData: _panchangData, sankalpaItems, onSankalpaToggle, onSankalpaRemove, onSankalpaAdd }: ReelPlayerProps) {
    const [activeIdx, setActiveIdx] = useState(0);
    const [fullScreenIdx, setFullScreenIdx] = useState<number | null>(null);
    const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
    const scene = getTimeScene(new Date().getHours());

    // Total slides = sankalpa (index 0) + 7 tracks (indices 1–7)
    const totalCount = TRACKS.length + 1;

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
                        const idx = slideRefs.current.findIndex(el => el === entry.target);
                        if (idx !== -1) setActiveIdx(idx);
                    }
                });
            },
            { threshold: 0.6, root: null }
        );
        slideRefs.current.forEach(el => { if (el) observer.observe(el); });
        return () => observer.disconnect();
    }, []);

    const handleTap = useCallback((idx: number) => {
        setFullScreenIdx(prev => (prev === idx ? null : idx));
    }, []);

    return (
        <div className={styles.reelWrapper}>
            {/* Snap scroll container — shows exactly 1 reel at a time */}
            <div className={styles.reelScroller}>
                {/* Slide 0: Sankalpa / Mission */}
                <div
                    className={styles.reelSlideWrapper}
                    ref={el => { slideRefs.current[0] = el; }}
                >
                    <SankalpaSlide
                        items={sankalpaItems}
                        scene={scene}
                        onToggle={onSankalpaToggle}
                        onRemove={onSankalpaRemove}
                        onAdd={onSankalpaAdd}
                        isFullScreen={fullScreenIdx === 0}
                        onExpand={() => handleTap(0)}
                    />
                </div>

                {/* Slides 1–N: Mantra Reels */}
                {TRACKS.map((track, i) => {
                    const realIdx = i + 1;
                    return (
                        <div
                            key={track.id}
                            className={styles.reelSlideWrapper}
                            ref={el => { slideRefs.current[realIdx] = el; }}
                        >
                            <ReelSlide
                                track={track}
                                scene={scene}
                                isActive={activeIdx === realIdx}
                                isFullScreen={fullScreenIdx === realIdx}
                                onActivate={() => handleTap(realIdx)}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Dot indicators */}
            <div className={styles.dots}>
                {Array.from({ length: totalCount }).map((_, i) => (
                    <button
                        key={i}
                        className={`${styles.dot} ${i === activeIdx ? styles.dotOn : ''}`}
                        style={{ '--reel-accent': scene.accent } as React.CSSProperties}
                        onClick={() => {
                            slideRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            setActiveIdx(i);
                        }}
                        aria-label={i === 0 ? 'Mission' : TRACKS[i - 1].title}
                    />
                ))}
            </div>
        </div>
    );
}
