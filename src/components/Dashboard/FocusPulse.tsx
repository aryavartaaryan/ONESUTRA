'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import styles from './FocusPulse.module.css';

const PRESETS = [
    { label: 'Sprint', focus: 15, rest: 3 },
    { label: 'Deep Work', focus: 25, rest: 5 },
    { label: 'Flow', focus: 50, rest: 10 },
];

export default function FocusPulse() {
    const [preset, setPreset] = useState(1);          // default: Deep Work
    const [phase, setPhase] = useState<'idle' | 'focus' | 'rest'>('idle');
    const [remaining, setRemaining] = useState(PRESETS[1].focus * 60); // seconds
    const [running, setRunning] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const totalSecs = phase === 'rest'
        ? PRESETS[preset].rest * 60
        : PRESETS[preset].focus * 60;

    // Compute on preset change when idle
    useEffect(() => {
        if (phase === 'idle') setRemaining(PRESETS[preset].focus * 60);
    }, [preset, phase]);

    const start = useCallback(() => {
        if (phase === 'idle') setPhase('focus');
        setRunning(true);
    }, [phase]);

    const pause = () => setRunning(false);
    const reset = () => {
        setRunning(false);
        setPhase('idle');
        setRemaining(PRESETS[preset].focus * 60);
    };

    useEffect(() => {
        if (!running) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
        intervalRef.current = setInterval(() => {
            setRemaining(r => {
                if (r <= 1) {
                    // Switch phase
                    if (phase === 'focus') {
                        setPhase('rest');
                        return PRESETS[preset].rest * 60;
                    } else {
                        setPhase('idle');
                        setRunning(false);
                        return PRESETS[preset].focus * 60;
                    }
                }
                return r - 1;
            });
        }, 1000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [running, phase, preset]);

    const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
    const secs = String(remaining % 60).padStart(2, '0');
    const frac = 1 - remaining / totalSecs;

    // SVG ring
    const R = 40, C = 2 * Math.PI * R;
    const dashOffset = C * (1 - frac);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={styles.emoji}>⏱</span>
                <div>
                    <h2 className={styles.title}>Focus Pulse</h2>
                    <p className={styles.subtitle}>
                        {phase === 'rest' ? '🌿 Rest — breathe in...' : phase === 'focus' ? '🎯 Deep focus mode' : 'Set your session'}
                    </p>
                </div>
            </div>

            {/* Preset selector */}
            <div className={styles.presets}>
                {PRESETS.map((p, i) => (
                    <button
                        key={p.label}
                        className={`${styles.presetBtn} ${preset === i ? styles.presetActive : ''}`}
                        onClick={() => { if (phase === 'idle') { setPreset(i); } }}
                        disabled={phase !== 'idle'}
                    >
                        {p.label}<br />
                        <span className={styles.presetMins}>{p.focus}m</span>
                    </button>
                ))}
            </div>

            {/* Ring timer */}
            <div className={styles.ringWrap}>
                <svg viewBox="0 0 100 100" className={styles.ring}>
                    <circle cx="50" cy="50" r={R} className={styles.ringTrack} />
                    <motion.circle
                        cx="50" cy="50" r={R}
                        className={`${styles.ringFill} ${phase === 'rest' ? styles.ringRest : ''}`}
                        strokeDasharray={C}
                        strokeDashoffset={dashOffset}
                        transform="rotate(-90 50 50)"
                        animate={{ strokeDashoffset: dashOffset }}
                        transition={{ duration: 0.8, ease: 'linear' }}
                    />
                </svg>
                <div className={styles.ringCenter}>
                    {phase === 'rest' ? (
                        <motion.span
                            className={styles.omRest}
                            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        >ॐ</motion.span>
                    ) : (
                        <span className={styles.timeDisplay}>{mins}:{secs}</span>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className={styles.controls}>
                {!running ? (
                    <button className={`${styles.ctrlBtn} ${styles.ctrlStart}`} onClick={start}>▶ {phase === 'idle' ? 'Start' : 'Resume'}</button>
                ) : (
                    <button className={styles.ctrlBtn} onClick={pause}>⏸ Pause</button>
                )}
                <button className={`${styles.ctrlBtn} ${styles.ctrlReset}`} onClick={reset}>↺ Reset</button>
            </div>
        </div>
    );
}
