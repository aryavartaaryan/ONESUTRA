'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

// ── Hover wrapper shared by all 4 portals ────────────────────────────────────
function PortalSlot({
    href,
    children,
    style,
    className,
}: {
    href: string;
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
}) {
    return (
        <Link href={href} style={{ textDecoration: 'none', display: 'contents' }}>
            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                className={className}
                style={{
                    cursor: 'pointer',
                    borderRadius: '1.5rem',
                    overflow: 'hidden',
                    position: 'relative',
                    ...style,
                }}
            >
                {children}
            </motion.div>
        </Link>
    );
}

// ── 1. PranaVerse — Immersive Dimension Card (col-span-2) ─────────────────────
function PranaVerseCard() {
    return (
        <PortalSlot
            href="/pranaverse"
            style={{
                gridColumn: 'span 2',
                gridRow: 'span 1',
                height: 180,
                background: 'linear-gradient(135deg, rgba(2,6,23,0.92) 0%, rgba(15,23,42,0.85) 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '1.25rem 1.5rem',
            }}
        >
            {/* Soft nature video bg */}
            <video
                autoPlay muted loop playsInline
                style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    objectFit: 'cover', zIndex: 0,
                    opacity: 0.35,
                    filter: 'blur(1px)',
                }}
            >
                <source src="/videos/nature-loop.mp4" type="video/mp4" />
            </video>
            {/* Dark overlay */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(2,6,23,0.88) 0%, rgba(2,6,23,0.25) 100%)',
                zIndex: 1,
            }} />
            {/* Content */}
            <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    marginBottom: '0.4rem',
                }}>
                    <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.12)',
                        border: '1px solid rgba(255,255,255,0.20)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.8rem',
                    }}>▶</div>
                    <span style={{
                        fontSize: '0.62rem', letterSpacing: '0.22em',
                        textTransform: 'uppercase', color: 'rgba(20,184,166,0.85)',
                        fontFamily: 'monospace',
                    }}>Holistic Feed</span>
                </div>
                <h3 style={{
                    margin: 0,
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '1.55rem', fontWeight: 700,
                    color: 'rgba(255,255,255,0.95)',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.15,
                    textShadow: '0 2px 20px rgba(0,0,0,0.6)',
                }}>
                    Enter The PranaVerse
                </h3>
                <p style={{
                    margin: '0.25rem 0 0',
                    fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)',
                    letterSpacing: '0.04em',
                }}>Scroll through peace, not noise</p>
            </div>
            {/* Teal glow line */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: 2, zIndex: 2,
                background: 'linear-gradient(90deg, transparent, rgba(20,184,166,0.5), transparent)',
            }} />
        </PortalSlot>
    );
}

// ── 2. SUTRA — Portal Ring Style (col-span-1 square) ─────────────────────────
function SutraCard() {
    return (
        <PortalSlot
            href="/sutra"
            style={{
                gridColumn: 'span 1',
                gridRow: 'span 1',
                aspectRatio: '1 / 1',
                background: 'rgba(109,40,217,0.08)',
                border: '1px solid rgba(192,132,252,0.15)',
                backdropFilter: 'blur(16px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                padding: '1rem',
            }}
        >
            {/* Pulsing amethyst ring */}
            <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
                {[0, 1, 2].map(i => (
                    <motion.div
                        key={i}
                        style={{
                            position: 'absolute', inset: 0, borderRadius: '50%',
                            border: '1px solid rgba(192,132,252,0.35)',
                        }}
                        animate={{
                            scale: [1, 1.5 + i * 0.3, 1],
                            opacity: [0.7, 0, 0.7],
                        }}
                        transition={{
                            duration: 2.4,
                            repeat: Infinity,
                            ease: 'easeOut',
                            delay: i * 0.6,
                        }}
                    />
                ))}
                <div style={{
                    position: 'absolute', inset: 0,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(192,132,252,0.28) 0%, rgba(109,40,217,0.12) 70%)',
                    border: '1.5px solid rgba(192,132,252,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.4rem',
                    boxShadow: '0 0 30px rgba(192,132,252,0.30)',
                }}>
                    🪷
                </div>
            </div>
            <div style={{ textAlign: 'center' }}>
                <p style={{
                    margin: 0,
                    fontSize: '0.6rem',
                    letterSpacing: '0.35em',
                    textTransform: 'uppercase',
                    color: 'rgba(192,132,252,0.9)',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                }}>
                    S U T R A
                </p>
                <p style={{
                    margin: '0.2rem 0 0',
                    fontSize: '0.6rem',
                    color: 'rgba(255,255,255,0.38)',
                    letterSpacing: '0.05em',
                }}>
                    Conscious Connect
                </p>
            </div>
        </PortalSlot>
    );
}

// ── 3. Acharya — Mini Cosmic Orb Portal (col-span-1 square) ──────────────────
function AcharyaCard() {
    return (
        <PortalSlot
            href="/acharya-samvad"
            style={{
                gridColumn: 'span 1',
                gridRow: 'span 1',
                aspectRatio: '1 / 1',
                background: 'rgba(30,27,75,0.18)',
                border: '1px solid rgba(99,102,241,0.15)',
                backdropFilter: 'blur(16px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                padding: '1rem',
            }}
        >
            {/* Mini cosmic orb */}
            <motion.div
                animate={{
                    boxShadow: [
                        '0 0 30px rgba(67,56,202,0.35), inset 0 0 20px rgba(224,231,255,0.08)',
                        '0 0 55px rgba(67,56,202,0.55), inset 0 0 35px rgba(224,231,255,0.16)',
                        '0 0 30px rgba(67,56,202,0.35), inset 0 0 20px rgba(224,231,255,0.08)',
                    ],
                    scale: [1, 1.05, 1],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    width: 64, height: 64,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 32% 32%, #4338ca 0%, #1e1b4b 50%, #020617 100%)',
                    border: '1px solid rgba(165,180,252,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    flexShrink: 0,
                }}
            >
                {/* Specular highlight */}
                <div style={{
                    position: 'absolute', top: '10%', left: '14%',
                    width: '28%', height: '16%',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.18)',
                    filter: 'blur(4px)',
                    transform: 'rotate(-20deg)',
                }} />
                <span style={{
                    fontSize: '1.2rem',
                    filter: 'drop-shadow(0 0 8px rgba(165,180,252,0.6))',
                    userSelect: 'none',
                }}>ॐ</span>
            </motion.div>
            <div style={{ textAlign: 'center' }}>
                <p style={{
                    margin: 0,
                    fontSize: '0.6rem',
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: 'rgba(165,180,252,0.9)',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                }}>
                    Acharya
                </p>
                <p style={{
                    margin: '0.2rem 0 0',
                    fontSize: '0.6rem',
                    color: 'rgba(255,255,255,0.38)',
                    letterSpacing: '0.05em',
                }}>
                    Awaken Guidance
                </p>
            </div>
        </PortalSlot>
    );
}

// ── 4. Sync Engine / Sankalpa — Productivity Pill (col-span-2) ────────────────
function SyncEngineCard() {
    return (
        <PortalSlot
            href="/"
            style={{
                gridColumn: 'span 2',
                gridRow: 'span 1',
                height: 96,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0 1.4rem',
            }}
        >
            {/* Icon */}
            <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(239,68,68,0.15))',
                border: '1px solid rgba(245,158,11,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem',
            }}>⚡</div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    margin: 0,
                    fontSize: '0.82rem', fontWeight: 600,
                    color: 'rgba(255,255,255,0.88)',
                    letterSpacing: '0.02em',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>Synchronize Your Day</p>
                <p style={{
                    margin: '0.15rem 0 0',
                    fontSize: '0.65rem', color: 'rgba(255,255,255,0.40)',
                    letterSpacing: '0.04em',
                }}>Sankalpa · Daily Intention Engine</p>
            </div>
            {/* Badge */}
            <div style={{
                flexShrink: 0, padding: '0.3rem 0.8rem', borderRadius: 999,
                background: 'rgba(245,158,11,0.13)',
                border: '1px solid rgba(245,158,11,0.28)',
                fontSize: '0.6rem', letterSpacing: '0.12em',
                color: 'rgba(251,191,36,0.80)', textTransform: 'uppercase',
                fontFamily: 'monospace',
            }}>Active</div>
        </PortalSlot>
    );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function SacredPortalGrid() {
    const { lang } = useLanguage();

    return (
        <section style={{
            marginTop: '3.5rem',
            marginBottom: '6rem',
            padding: '0 1rem',
        }}>
            {/* Section title */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{ marginBottom: '1rem', paddingLeft: '0.25rem' }}
            >
                <span style={{
                    fontSize: '0.58rem', letterSpacing: '0.28em',
                    textTransform: 'uppercase', color: 'rgba(245,158,11,0.65)',
                    fontFamily: 'monospace',
                }}>✦ Sacred Portals</span>
                <h2 style={{
                    margin: '0.15rem 0 0',
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '1.4rem', fontWeight: 700,
                    color: 'rgba(255,255,255,0.92)',
                    letterSpacing: '-0.01em',
                }}>
                    {lang === 'hi' ? 'आपका चेतन OS' : 'Your Sacred Portals'}
                </h2>
            </motion.div>

            {/* Hybrid 2-column grid */}
            <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                }}
            >
                {/* Row 1: PranaVerse wide card */}
                <PranaVerseCard />
                {/* Row 2: SUTRA ring + Acharya orb */}
                <SutraCard />
                <AcharyaCard />
                {/* Row 3: Sync Engine wide pill */}
                <SyncEngineCard />
            </motion.div>
        </section>
    );
}
