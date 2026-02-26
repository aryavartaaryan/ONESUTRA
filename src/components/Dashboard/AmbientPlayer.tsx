'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './AmbientPlayer.module.css';

const RAAGS = [
    { id: 1, title: 'Raag Yaman', mood: 'Evening • Peace', emoji: '🌙' },
    { id: 2, title: 'Raag Bhairav', mood: 'Dawn • Awakening', emoji: '🌅' },
    { id: 3, title: 'Raag Desh', mood: 'Monsoon • Longing', emoji: '🌧️' },
    { id: 4, title: 'Raag Bhimpalasi', mood: 'Midday • Focus', emoji: '☀️' },
    { id: 5, title: 'Raag Bairagi', mood: 'Night • Contemplation', emoji: '✨' },
];

// Beautiful static waveform heights
const WAVE = [0.3, 0.55, 0.8, 0.5, 1, 0.65, 0.4, 0.75, 0.9, 0.45, 0.6, 0.85, 0.35, 0.7, 0.55];

export default function AmbientPlayer() {
    const [playing, setPlaying] = useState(false);
    const [track, setTrack] = useState(0);
    const [expanded, setExpanded] = useState(false);

    const current = RAAGS[track];

    const next = () => setTrack((t) => (t + 1) % RAAGS.length);
    const prev = () => setTrack((t) => (t - 1 + RAAGS.length) % RAAGS.length);

    return (
        <motion.div
            className={styles.pill}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
        >
            {/* Collapsed: single pill row */}
            <div className={styles.row} onClick={() => setExpanded((e) => !e)}>
                {/* Track info */}
                <span className={styles.trackEmoji}>{current.emoji}</span>
                <div className={styles.trackInfo}>
                    <span className={styles.trackTitle}>{current.title}</span>
                    <span className={styles.trackMood}>{current.mood}</span>
                </div>

                {/* Mini waveform */}
                <div className={styles.waveRow} aria-hidden>
                    {WAVE.map((h, i) => (
                        <div
                            key={i}
                            className={`${styles.waveBar} ${playing ? styles.waveBarPlaying : ''}`}
                            style={{
                                height: `${h * 18}px`,
                                animationDelay: `${i * 0.07}s`,
                                animationDuration: `${0.7 + h * 0.5}s`,
                            }}
                        />
                    ))}
                </div>

                {/* Play/Pause */}
                <motion.button
                    className={`${styles.playBtn} ${playing ? styles.playBtnActive : ''}`}
                    onClick={(e) => { e.stopPropagation(); setPlaying((p) => !p); }}
                    whileTap={{ scale: 0.9 }}
                    aria-label={playing ? 'Pause' : 'Play'}
                >
                    {playing ? '⏸' : '▶'}
                </motion.button>
            </div>

            {/* Expanded track list */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        className={styles.expandedPanel}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        <div className={styles.expandedHeader}>
                            <span className={styles.expandedLabel}>🎵 Raag Ambient — Flow Mode</span>
                            <div className={styles.navBtns}>
                                <button className={styles.navBtn} onClick={prev}>‹</button>
                                <button className={styles.navBtn} onClick={next}>›</button>
                            </div>
                        </div>
                        {RAAGS.map((r, i) => (
                            <button
                                key={r.id}
                                className={`${styles.trackRow} ${i === track ? styles.trackRowActive : ''}`}
                                onClick={() => { setTrack(i); setExpanded(false); }}
                            >
                                <span>{r.emoji} {r.title}</span>
                                <span className={styles.trackRowMood}>{r.mood}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
