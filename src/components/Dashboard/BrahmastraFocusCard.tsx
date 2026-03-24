'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './BrahmastraFocusCard.module.css';

interface BrahmastraFocusCardProps {
    active: boolean;
    focusWindowMinutes?: number;
    impactedMeetings?: number;
    subtitle?: string;
}

export default function BrahmastraFocusCard({
    active: remoteActive,
    focusWindowMinutes = 120,
    impactedMeetings = 0,
    subtitle = 'Silence the noise. Guard the inner fire.',
}: BrahmastraFocusCardProps) {
    const [localActive, setLocalActive] = useState(false);
    const active = remoteActive || localActive;

    // ── INACTIVE: compact one-line strip ─────────────────────────────────────────
    if (!active) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    width: '100%',
                    maxWidth: 700,
                    margin: '0 auto',
                    padding: '0 0.8rem',
                }}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 14,
                    padding: '0.55rem 1rem',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                }}>
                    {/* Left: label */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <motion.span
                            animate={{ opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ fontSize: '0.80rem' }}
                        >
                            ⚡
                        </motion.span>
                        <div>
                            <span style={{
                                fontSize: '0.52rem',
                                fontWeight: 700,
                                letterSpacing: '0.18em',
                                textTransform: 'uppercase',
                                fontFamily: 'monospace',
                                color: 'rgba(255,255,255,0.45)',
                            }}>
                                Advanced Protocol
                            </span>
                            <span style={{
                                display: 'block',
                                fontSize: '0.44rem',
                                color: 'rgba(255,255,255,0.22)',
                                fontFamily: 'monospace',
                                letterSpacing: '0.08em',
                            }}>
                                Deep Focus · Interruption Shield
                            </span>
                        </div>
                    </div>

                    {/* Right: Activate button */}
                    <motion.button
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => setLocalActive(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                            padding: '0.35rem 0.90rem',
                            background: 'linear-gradient(135deg,rgba(255,119,34,0.22),rgba(255,80,10,0.12))',
                            border: '1px solid rgba(255,119,34,0.45)',
                            borderRadius: 999,
                            cursor: 'pointer',
                            color: 'rgba(255,140,60,0.95)',
                            fontSize: '0.52rem',
                            fontWeight: 800,
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            fontFamily: 'monospace',
                            boxShadow: '0 0 12px rgba(255,119,34,0.18)',
                            transition: 'all 0.3s',
                        }}
                    >
                        ⚡ Activate
                    </motion.button>
                </div>
            </motion.div>
        );
    }

    // ── ACTIVE: full expanded card ────────────────────────────────────────────────
    return (
        <AnimatePresence>
            <motion.section
                className={styles.card}
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: -10 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    paddingBottom: '1.5rem',
                    border: '1px solid rgba(255,119,34,0.30)',
                    boxShadow: '0 0 30px rgba(255,119,34,0.12), 0 8px 24px rgba(0,0,0,0.30)',
                    borderRadius: '1.2rem',
                    background: 'linear-gradient(160deg,rgba(255,80,10,0.08),rgba(0,0,0,0.55))',
                    backdropFilter: 'blur(18px)',
                    WebkitBackdropFilter: 'blur(18px)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Animated fire glow */}
                <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.08, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        position: 'absolute', top: -40, right: -40, width: 140, height: 140,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle,rgba(255,100,20,0.35) 0%,transparent 70%)',
                        filter: 'blur(20px)', pointerEvents: 'none',
                    }}
                />

                <motion.div
                    className={styles.ring}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
                />

                <div className={styles.label} style={{ color: 'var(--accent-saffron)' }}>
                    ⚡ Advanced Protocol — LIVE
                </div>
                <h3 className={styles.title}>Deep Focus is Live 🔥</h3>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem', margin: '0 0 0.8rem', padding: '0 1.2rem' }}>
                    {subtitle}
                </p>

                <div className={`${styles.status} ${styles.statusActive}`}>
                    <span className={styles.dot} />
                    Interruption Shield Enabled
                </div>

                <div className={styles.meta} style={{ marginBottom: '1.2rem' }}>
                    <span className={styles.chip}>Window: {focusWindowMinutes} min</span>
                    <span className={styles.chip}>Meetings shifted: {impactedMeetings}</span>
                </div>

                {/* Connector visual — merges with Samkalp below */}
                <div style={{
                    position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                    width: 2, height: 20,
                    background: 'linear-gradient(to bottom,rgba(255,119,34,0.60),transparent)',
                    zIndex: 5,
                }} />

                <button
                    onClick={() => setLocalActive(false)}
                    style={{
                        width: 'calc(100% - 2.4rem)',
                        margin: '0 1.2rem',
                        padding: '0.6rem',
                        background: 'rgba(255,119,34,0.10)',
                        color: 'var(--accent-saffron)',
                        border: '1px solid var(--accent-saffron)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.3s',
                        fontSize: '0.72rem',
                    }}
                >
                    Deactivate Shield
                </button>
            </motion.section>
        </AnimatePresence>
    );
}
