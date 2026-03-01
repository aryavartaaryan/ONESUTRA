'use client';

import React from 'react';
import { motion, AnimatePresence, type Easing } from 'framer-motion';

export type OrbStatus = 'idle' | 'listening' | 'speaking' | 'processing';

interface AcharyaGuruOrbProps {
    status?: OrbStatus;
    /** When true, orb expands 1.8× to Zen Mode center */
    zenMode?: boolean;
    /** Size: defaults to 128 (w-32 h-32) */
    sizePx?: number;
}

// ── Split animate and transition (Framer Motion TS2322 fix) ──────────────────

const orbAnimate = {
    idle: {
        scale: [1, 1.05, 1] as number[],
        boxShadow: [
            'inset 0px 0px 40px rgba(224,231,255,0.10), 0px 0px 60px rgba(67,56,202,0.30)',
            'inset 0px 0px 55px rgba(224,231,255,0.18), 0px 0px 90px rgba(67,56,202,0.45)',
            'inset 0px 0px 40px rgba(224,231,255,0.10), 0px 0px 60px rgba(67,56,202,0.30)',
        ],
    },
    listening: {
        scale: [1.05, 1.08, 1.05] as number[],
        boxShadow: [
            'inset 0px 0px 60px rgba(224,231,255,0.30), 0px 0px 100px rgba(99,102,241,0.60)',
            'inset 0px 0px 80px rgba(224,231,255,0.45), 0px 0px 130px rgba(99,102,241,0.75)',
            'inset 0px 0px 60px rgba(224,231,255,0.30), 0px 0px 100px rgba(99,102,241,0.60)',
        ],
    },
    speaking: {
        scale: [1.10, 1.15, 1.12, 1.18, 1.10] as number[],
        boxShadow: [
            'inset 0px 0px 80px rgba(255,255,255,0.50), 0px 0px 120px rgba(79,70,229,0.80), 0px 0px 200px rgba(224,231,255,0.20)',
            'inset 0px 0px 60px rgba(255,255,255,0.35), 0px 0px 90px rgba(79,70,229,0.60), 0px 0px 160px rgba(224,231,255,0.12)',
            'inset 0px 0px 100px rgba(255,255,255,0.60), 0px 0px 150px rgba(79,70,229,0.90), 0px 0px 240px rgba(224,231,255,0.28)',
        ],
    },
    processing: {
        scale: [1.06, 1.02, 1.08, 1.02, 1.06] as number[],
        boxShadow: [
            'inset 0px 0px 60px rgba(217,119,6,0.45), 0px 0px 100px rgba(88,28,135,0.65)',
            'inset 0px 0px 100px rgba(217,119,6,0.65), 0px 0px 150px rgba(88,28,135,0.80)',
            'inset 0px 0px 60px rgba(217,119,6,0.45), 0px 0px 100px rgba(88,28,135,0.65)',
        ],
    },
};

const orbTransition = {
    idle: { duration: 8, repeat: Infinity, repeatType: 'reverse' as const, ease: 'easeInOut' as Easing },
    listening: { duration: 0.8, repeat: Infinity, repeatType: 'reverse' as const, ease: 'easeInOut' as Easing },
    speaking: { duration: 0.5, repeat: Infinity, repeatType: 'mirror' as const, ease: 'circOut' as Easing },
    processing: { duration: 3, repeat: Infinity, repeatType: 'reverse' as const, ease: 'easeInOut' as Easing },
};

// ── Spandana Rings (Cymatic Voice Visualization) ──────────────────────────────

function SpandanaRings({ isSpeaking }: { isSpeaking: boolean }) {
    return (
        <>
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    style={{
                        position: 'absolute', inset: 0,
                        borderRadius: '50%',
                        border: '1px solid rgba(165,180,252,0.28)',
                        pointerEvents: 'none',
                    }}
                    initial={{ scale: 1, opacity: 0 }}
                    animate={isSpeaking
                        ? { scale: 2.8 + i * 0.4, opacity: [0.7, 0] }
                        : { scale: 1, opacity: 0 }
                    }
                    transition={{
                        duration: 2.2,
                        repeat: isSpeaking ? Infinity : 0,
                        ease: 'easeOut',
                        delay: i * 0.55,
                    }}
                />
            ))}
        </>
    );
}

// ── Main Orb Component ────────────────────────────────────────────────────────

export default function AcharyaGuruOrb({
    status = 'idle',
    zenMode = false,
    sizePx = 128,
}: AcharyaGuruOrbProps) {
    const isSpeaking = status === 'speaking';
    const isListening = status === 'listening';

    const stateKey = status as keyof typeof orbAnimate;
    const currentAnim = orbAnimate[stateKey];
    const currentTransition = orbTransition[stateKey];

    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '1.25rem',
            position: 'relative',
        }}>
            {/* ── Ambient Background Nebula ── */}
            <div style={{
                position: 'absolute',
                width: sizePx * 2.5, height: sizePx * 2.5,
                background: 'radial-gradient(ellipse, rgba(67,56,202,0.18) 0%, transparent 70%)',
                filter: 'blur(60px)',
                borderRadius: '50%',
                pointerEvents: 'none',
            }} />

            {/* ── Zen Mode Wrapper: scales 1.8× and shifts up ── */}
            <motion.div
                animate={zenMode
                    ? { scale: 1.8, y: -40 }
                    : { scale: 1, y: 0 }
                }
                transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                style={{ position: 'relative', zIndex: 20 }}
            >
                {/* Spandana rings — behind the orb */}
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: -1,
                }}>
                    <div style={{ position: 'relative', width: sizePx, height: sizePx }}>
                        <SpandanaRings isSpeaking={isSpeaking} />
                    </div>
                </div>

                {/* ── The Cosmic Orb ── */}
                <motion.div
                    animate={currentAnim}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    transition={currentTransition as any}
                    style={{
                        width: sizePx, height: sizePx,
                        borderRadius: '50%',
                        position: 'relative',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        // 3D base gradient — deep space center, illuminated edge
                        background: 'radial-gradient(circle at 30% 30%, #4338ca 0%, #1e1b4b 50%, #020617 100%)',
                        overflow: 'hidden',
                        cursor: 'default',
                    }}
                >
                    {/* Inner nebula layer */}
                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        background: 'radial-gradient(circle at 40% 35%, rgba(99,102,241,0.55) 0%, rgba(30,27,75,0.85) 55%, transparent 90%)',
                    }} />

                    {/* Rotating golden Prana core — 40s slow burn */}
                    <motion.div
                        animate={{
                            rotate: [0, 360],
                            scale: isSpeaking ? [1, 1.25, 1] : isListening ? [1, 1.12, 1] : 1,
                        }}
                        transition={{
                            rotate: { duration: 40, repeat: Infinity, ease: 'linear' },
                            scale: { duration: isSpeaking ? 0.5 : 3, repeat: Infinity, ease: 'easeInOut' },
                        }}
                        style={{
                            position: 'absolute',
                            width: '45%', height: '45%',
                            borderRadius: '50%',
                            background: 'conic-gradient(from 0deg, #d97706, #f59e0b, #fbbf24, #b45309, #d97706)',
                            filter: 'blur(4px)',
                            opacity: isSpeaking ? 0.95 : 0.75,
                            mixBlendMode: 'screen',
                        }}
                    />

                    {/* Om glyph */}
                    <motion.span
                        animate={{ opacity: isSpeaking ? [0.7, 1, 0.7] : 0.82 }}
                        transition={{ duration: isSpeaking ? 0.5 : 1, repeat: Infinity }}
                        style={{
                            position: 'relative', zIndex: 5,
                            fontFamily: "'Noto Serif Devanagari', serif",
                            fontSize: sizePx * 0.3 + 'px',
                            color: 'rgba(224,231,255,0.90)',
                            filter: 'drop-shadow(0 0 12px rgba(224,231,255,0.6))',
                            userSelect: 'none',
                        }}
                    >ॐ</motion.span>

                    {/* Glass sheen */}
                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        border: '1px solid rgba(224,231,255,0.15)',
                        boxShadow: 'inset 0 4px 16px rgba(255,255,255,0.20)',
                    }} />

                    {/* Specular highlight (top-left light bounce) */}
                    <div style={{
                        position: 'absolute',
                        top: '12%', left: '15%',
                        width: '28%', height: '18%',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.18)',
                        filter: 'blur(6px)',
                        transform: 'rotate(-20deg)',
                    }} />
                </motion.div>
            </motion.div>

            {/* ── Title + Status (hidden in zenMode) ── */}
            <AnimatePresence>
                {!zenMode && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -6 }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}
                    >
                        <h2 style={{
                            fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif",
                            fontSize: '1.15rem', fontWeight: 600, margin: 0,
                            color: 'rgba(255,255,255,0.90)',
                            letterSpacing: '0.03em',
                            textShadow: '0 2px 12px rgba(67,56,202,0.4)',
                        }}>
                            Acharya Pranav
                        </h2>
                        <motion.span
                            animate={{ opacity: [0.45, 0.9, 0.45] }}
                            transition={{ duration: status === 'idle' ? 4 : 1.5, repeat: Infinity, ease: 'easeInOut' }}
                            style={{
                                fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase',
                                color: 'rgba(165,180,252,0.72)', fontFamily: 'monospace',
                            }}
                        >
                            {status === 'idle' ? 'Present · Listening'
                                : status === 'listening' ? 'Shravana · जाग्रत'
                                    : status === 'speaking' ? 'Vani · बोल रहे हैं'
                                        : 'Contemplating...'}
                        </motion.span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
