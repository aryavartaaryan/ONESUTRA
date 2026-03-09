'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './SakhaBodhiOrb.module.css';

// ─── Phase meta (Simplified for Onboarding) ──────────────────────────────────

const PHASE_CONFIG = {
    sanctum: { label: 'Awakening · Bodhi', emoji: '✨' },
};

// ─── Geometric 4-point clarity star ───────────────────────────────────────────

function ClarityStar() {
    return (
        <svg
            className={styles.starGeo}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
        >
            <path
                d="M20 2 L21.4 18.6 L38 20 L21.4 21.4 L20 38 L18.6 21.4 L2 20 L18.6 18.6 Z"
                fill="rgba(255,255,255,0.55)"
            />
            <circle cx="20" cy="20" r="1.5" fill="rgba(255,255,255,0.85)" />
        </svg>
    );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export type OnboardingOrbState = 'idle' | 'listening' | 'speaking' | 'processing';

interface OnboardingBodhiOrbProps {
    orbState: OnboardingOrbState;
    micVolume: number; // 0 to 1
    sizePx?: number;
    zenMode?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingBodhiOrb({
    orbState,
    micVolume,
    sizePx = 160,
    zenMode = true,
}: OnboardingBodhiOrbProps) {
    const phaseInfo = PHASE_CONFIG.sanctum;

    // ── Blob scale driven by mic volume while listening ───────────────────────
    const listenBlobScale = orbState === 'listening' ? 1 + micVolume * 0.22 : 1;

    // ── Breathing rhythm (idle / between turns) ───────────────────────────────
    const breathTransition = {
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut' as const,
        times: [0, 0.44, 0.55, 1],
    };

    // ── Central blob common props ─────────────────────────────────────────────
    const mainBlobVariants = {
        idle: {
            scale: [1, 1.04, 1.04, 1],
            y: [0, -10, -10, 0],
            transition: breathTransition,
        },
        listening: {
            scale: listenBlobScale,
            transition: { duration: 0.12, ease: 'linear' as const },
        },
        processing: { // 'thinking' equivalent
            scale: [1, 1.02, 1, 0.98, 1],
            transition: {
                duration: 2.8,
                repeat: Infinity,
                ease: 'easeInOut' as const,
            },
        },
        speaking: {
            scale: [1, 1.07, 0.96, 1.05, 1],
            transition: {
                duration: 1.6,
                repeat: Infinity,
                ease: 'easeInOut' as const,
            },
        },
    };

    return (
        <AnimatePresence>
            <motion.div
                className={styles.backdrop}
                style={{
                    position: 'relative',
                    width: sizePx,
                    height: sizePx,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    backdropFilter: 'none',
                    pointerEvents: 'none'
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45 }}
            >
                {/* ── HIDDEN SVG — Goo filter definition ────────────────────── */}
                <svg
                    style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
                    aria-hidden
                >
                    <defs>
                        <filter id="sakha-goo" x="-30%" y="-30%" width="160%" height="160%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
                            <feColorMatrix
                                in="blur"
                                mode="matrix"
                                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8"
                                result="goo"
                            />
                            <feBlend in="SourceGraphic" in2="goo" />
                        </filter>
                    </defs>
                </svg>

                {/* ── Aura stage ────────────────────────────────────────────── */}
                <motion.div
                    className={styles.auraStage}
                    style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 180, damping: 22, duration: 0.7 }}
                >
                    {/* ── Cymatic soundwave rings (speaking state) ──────────── */}
                    {orbState === 'speaking' && (
                        <>
                            <div className={styles.soundRing} style={{ width: '120%', height: '120%' }} />
                            <div className={styles.soundRing} style={{ width: '140%', height: '140%' }} />
                            <div className={styles.soundRing} style={{ width: '160%', height: '160%' }} />
                            <div className={styles.soundRing} style={{ width: '180%', height: '180%' }} />
                        </>
                    )}

                    {/* ── Liquid "Goo" blob container ───────────────────────── */}
                    <motion.div
                        className={styles.gooContainer}
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        animate={
                            orbState === 'idle'
                                ? { y: [0, -10, -10, 0], transition: breathTransition }
                                : { y: 0 }
                        }
                    >
                        {/* Core blob — indigo base */}
                        <motion.div
                            className={`${styles.blob} ${styles.blobCore}`}
                            style={{ width: '60%', height: '60%' }}
                            animate={mainBlobVariants[orbState]}
                        />

                        {/* Satellite blob A — champagne gold tint, orbits top-left */}
                        <motion.div
                            className={`${styles.blob} ${styles.blobA}`}
                            style={{ width: '35%', height: '35%' }}
                            animate={{
                                x: [0, 14, -8, 14, 0],
                                y: [0, -10, 6, -6, 0],
                                scale:
                                    orbState === 'speaking'
                                        ? [1, 1.3, 0.85, 1.2, 1]
                                        : orbState === 'listening'
                                            ? [1, 1 + micVolume * 0.5, 1]
                                            : [1, 1.08, 1],
                            }}
                            transition={{
                                duration: orbState === 'speaking' ? 1.8 : 9,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        />

                        {/* Satellite blob B — lavender tint, orbits bottom-right */}
                        <motion.div
                            className={`${styles.blob} ${styles.blobB}`}
                            style={{ width: '40%', height: '40%' }}
                            animate={{
                                x: [0, -12, 10, -10, 0],
                                y: [0, 10, -8, 8, 0],
                                scale:
                                    orbState === 'speaking'
                                        ? [1, 0.75, 1.25, 0.9, 1]
                                        : [1, 1.06, 1],
                            }}
                            transition={{
                                duration: orbState === 'speaking' ? 2.1 : 11,
                                repeat: Infinity,
                                ease: 'easeInOut',
                                delay: 0.5,
                            }}
                        />

                        {/* Satellite blob C — pearl tint, top-right */}
                        <motion.div
                            className={`${styles.blob} ${styles.blobC}`}
                            style={{ width: '30%', height: '30%' }}
                            animate={{
                                x: [0, 8, -12, 6, 0],
                                y: [0, -8, 4, -10, 0],
                                scale: orbState === 'speaking' ? [1, 1.2, 0.8, 1] : [1, 1.04, 1],
                            }}
                            transition={{
                                duration: orbState === 'speaking' ? 1.5 : 13,
                                repeat: Infinity,
                                ease: 'easeInOut',
                                delay: 1.2,
                            }}
                        />

                        {/* Satellite blob D — soft lavender, bottom-left */}
                        <motion.div
                            className={`${styles.blob} ${styles.blobD}`}
                            style={{ width: '38%', height: '38%' }}
                            animate={{
                                x: [0, -10, 8, -6, 0],
                                y: [0, 12, -6, 10, 0],
                                scale: orbState === 'speaking' ? [1, 1.15, 0.85, 1] : [1, 1.05, 1],
                            }}
                            transition={{
                                duration: orbState === 'speaking' ? 2.4 : 10,
                                repeat: Infinity,
                                ease: 'easeInOut',
                                delay: 1.8,
                            }}
                        />
                    </motion.div>

                    {/* ── Bindu + 4-point star overlay (above the goo filter) ── */}
                    <div className={styles.bindusWrap} style={{ position: 'absolute' }}>
                        <motion.div
                            animate={{
                                rotate: orbState === 'processing' ? 360 : [0, 5, -5, 0],
                            }}
                            transition={
                                orbState === 'processing'
                                    ? { duration: 6, repeat: Infinity, ease: 'linear' }
                                    : { duration: 12, repeat: Infinity, ease: 'easeInOut' }
                            }
                            style={{ position: 'relative', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <ClarityStar />
                        </motion.div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
