'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCircadianBackground } from '@/hooks/useCircadianBackground';

export default function PranaVersePortalCard() {
    const { imageUrl, loaded } = useCircadianBackground('nature');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
                position: 'relative',
                width: '100%',
                borderRadius: 24,
                overflow: 'hidden',
                minHeight: 220,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {/* Dynamic circadian nature background */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                opacity: loaded ? 1 : 0,
                transition: 'opacity 1.5s ease',
            }} />

            {/* Animated CSS mesh gradient overlay (always visible, even while image loads) */}
            <motion.div
                animate={{
                    backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                }}
                transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(135deg, rgba(49,46,129,0.55) 0%, rgba(88,28,135,0.42) 35%, rgba(120,53,15,0.38) 65%, rgba(30,27,75,0.55) 100%)',
                    backgroundSize: '200% 200%',
                    mixBlendMode: 'multiply',
                }}
            />

            {/* Dark scrim */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.58) 100%)',
                backdropFilter: 'blur(1px)',
                WebkitBackdropFilter: 'blur(1px)',
            }} />

            {/* Content */}
            <div style={{
                position: 'relative', zIndex: 5,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '0.8rem',
                padding: '2.2rem 1.5rem',
                textAlign: 'center',
            }}>
                {/* Eyebrow */}
                <motion.span
                    animate={{ opacity: [0.55, 0.9, 0.55] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.26em',
                        textTransform: 'uppercase', color: 'rgba(253,230,138,0.82)',
                    }}
                >
                    ✦ The Conscious Social Network ✦
                </motion.span>

                {/* Main heading */}
                <h2 style={{
                    fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif",
                    fontSize: 'clamp(1.6rem, 6vw, 2.4rem)',
                    fontWeight: 700, margin: 0,
                    background: 'linear-gradient(135deg, #c4b5fd 0%, #a78bfa 45%, #818cf8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '0.02em',
                    lineHeight: 1.15,
                    textShadow: 'none',
                }}>
                    Enter PranaVerse
                </h2>

                {/* Subtext */}
                <p style={{
                    fontSize: '0.8rem', color: 'rgba(255,255,255,0.68)',
                    letterSpacing: '0.06em', margin: 0,
                    fontFamily: 'inherit',
                }}>
                    Where Consciousness Meets Community ✦ Sacred Social Network
                </p>

                {/* Portal button with pulsing glow */}
                <div style={{ position: 'relative', marginTop: '0.4rem' }}>
                    {/* Glow pulse */}
                    <motion.div
                        animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0.12, 0.4] }}
                        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            position: 'absolute', inset: -12, borderRadius: 999,
                            background: 'radial-gradient(ellipse, rgba(251,191,36,0.5) 0%, transparent 70%)',
                            filter: 'blur(8px)',
                            pointerEvents: 'none',
                        }}
                    />
                    <Link href="/pranaverse" style={{ textDecoration: 'none' }}>
                        <motion.div
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                                position: 'relative',
                                display: 'inline-flex', alignItems: 'center', gap: '0.55rem',
                                padding: '0.65rem 1.8rem',
                                background: 'rgba(255,255,255,0.10)',
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                border: '1px solid rgba(251,191,36,0.35)',
                                borderRadius: 999,
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                            }}
                        >
                            <span style={{ fontSize: '1.1rem' }}>▶</span>
                            <span style={{
                                fontFamily: "'Cinzel', serif",
                                fontSize: '0.82rem', fontWeight: 700,
                                letterSpacing: '0.12em',
                                background: 'linear-gradient(90deg, #fb923c, #fde047)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}>
                                ENTER PORTAL
                            </span>
                        </motion.div>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
