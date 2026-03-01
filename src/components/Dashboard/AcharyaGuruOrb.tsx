'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AcharyaGuruOrbProps {
    status?: 'idle' | 'processing' | 'speaking';
}

export default function AcharyaGuruOrb({ status = 'idle' }: AcharyaGuruOrbProps) {
    const isActive = status === 'processing' || status === 'speaking';

    // Physics: 8-second Guru Pranayama breath (4s inhale, 4s exhale)
    const idleAnim = {
        scale: [1, 1.08, 1],
        boxShadow: [
            '0px 0px 30px 4px rgba(49,46,129,0.45)',
            '0px 0px 80px 18px rgba(109,40,217,0.38)',
            '0px 0px 30px 4px rgba(49,46,129,0.45)',
        ],
        transition: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
    };

    const processingAnim = {
        scale: [1.06, 1.02, 1.08, 1.02, 1.06],
        boxShadow: [
            '0px 0px 60px 10px rgba(217,119,6,0.55)',
            '0px 0px 110px 24px rgba(88,28,135,0.72)',
            '0px 0px 60px 10px rgba(217,119,6,0.55)',
        ],
        transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
    };

    return (
        <div style={{
            width: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            paddingTop: '2rem', paddingBottom: '1.5rem',
            position: 'relative',
        }}>
            {/* Ambient background glow */}
            <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 240, height: 240,
                background: 'rgba(49,46,129,0.15)',
                filter: 'blur(70px)',
                borderRadius: '50%',
                pointerEvents: 'none',
            }} />

            {/* Main orb — Guru Breath physics */}
            <motion.div
                animate={isActive
                    ? { scale: [1.06, 1.02, 1.08, 1.02, 1.06], boxShadow: ['0px 0px 60px 10px rgba(217,119,6,0.55)', '0px 0px 110px 24px rgba(88,28,135,0.72)', '0px 0px 60px 10px rgba(217,119,6,0.55)'] }
                    : { scale: [1, 1.08, 1], boxShadow: ['0px 0px 30px 4px rgba(49,46,129,0.45)', '0px 0px 80px 18px rgba(109,40,217,0.38)', '0px 0px 30px 4px rgba(49,46,129,0.45)'] }
                }
                transition={{ duration: isActive ? 3 : 8, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'relative',
                    width: 112, height: 112,
                    borderRadius: '50%',
                    zIndex: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
            >
                {/* Layer 1: Outer Amethyst Nebula */}
                <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    background: 'radial-gradient(circle at 40% 35%, #4c1d95 0%, #1e1b4b 55%, transparent 90%)',
                    opacity: 0.92,
                }} />

                {/* Layer 2: Inner Sapphire Depth */}
                <div style={{
                    position: 'absolute', inset: 8, borderRadius: '50%',
                    background: 'linear-gradient(to top-left, #0f172a, #1e1b4b)',
                    opacity: 0.85,
                }} />

                {/* Layer 3: Rotating Golden Core (Prana flame) — 40s slow rotation */}
                <motion.div
                    animate={{
                        rotate: [0, 360],
                        scale: isActive ? [1, 1.22, 1] : 1,
                    }}
                    transition={{
                        rotate: { duration: 40, repeat: Infinity, ease: 'linear' },
                        scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                    }}
                    style={{
                        position: 'absolute', inset: 24, borderRadius: '50%',
                        background: 'conic-gradient(from 0deg, #d97706, #f59e0b, #fbbf24, #b45309, #d97706)',
                        filter: 'blur(3px)',
                        opacity: 0.85,
                        mixBlendMode: 'screen',
                    }}
                />

                {/* Layer 4: Soft Om center glyph */}
                <span style={{
                    position: 'relative', zIndex: 5,
                    fontFamily: "'Noto Serif Devanagari', serif",
                    fontSize: '1.6rem',
                    color: 'rgba(253,230,138,0.88)',
                    filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.6))',
                    userSelect: 'none',
                }}>ॐ</span>

                {/* Layer 5: Glass sheen */}
                <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.12)',
                    boxShadow: 'inset 0 4px 12px rgba(255,255,255,0.18)',
                }} />
            </motion.div>

            {/* Title + status */}
            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                <h2 style={{
                    fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif",
                    fontSize: '1.15rem', fontWeight: 600,
                    color: 'rgba(255,255,255,0.92)',
                    letterSpacing: '0.03em', margin: 0,
                    textShadow: '0 2px 12px rgba(109,40,217,0.4)',
                }}>
                    Acharya Pranav
                </h2>
                <motion.span
                    animate={{ opacity: [0.45, 0.9, 0.45] }}
                    transition={{ duration: isActive ? 2 : 4, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase',
                        color: 'rgba(196,181,253,0.72)', fontFamily: 'monospace',
                    }}
                >
                    {status === 'idle' ? 'Present · Listening' : 'Contemplating...'}
                </motion.span>
            </div>
        </div>
    );
}
