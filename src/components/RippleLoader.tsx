'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface RippleLoaderProps {
    /** Size of the central origin point in px */
    size?: number;
    /** Optional label text below the ripples */
    label?: string;
}

/**
 * RippleLoader — concentric water-ripple rings expanding outward.
 * Top-down view of gentle water disturbance on an alabaster background.
 * Used as the global loading/fetching state (no spinning wheels).
 */
export default function RippleLoader({ size = 120, label }: RippleLoaderProps) {
    const rings = [0, 1, 2, 3];

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.2rem',
                padding: '2.5rem',
                background: 'var(--jv-alabaster, #F5F3EE)',
                borderRadius: '24px',
                minWidth: size * 3,
                minHeight: size * 2.5,
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Ripple ring container */}
            <div
                style={{
                    position: 'relative',
                    width: size,
                    height: size,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {rings.map((i) => (
                    <motion.div
                        key={i}
                        style={{
                            position: 'absolute',
                            borderRadius: '50%',
                            border: '1.5px solid var(--jv-blue, #1E3A5F)',
                            width: size * 0.3,
                            height: size * 0.3,
                            opacity: 0,
                        }}
                        animate={{
                            scale: [0.3, 3.5],
                            opacity: [0.65, 0],
                        }}
                        transition={{
                            duration: 2.8,
                            delay: i * 0.65,
                            repeat: Infinity,
                            ease: 'easeOut',
                        }}
                    />
                ))}

                {/* Center origin droplet */}
                <motion.div
                    style={{
                        width: size * 0.12,
                        height: size * 0.12,
                        borderRadius: '50%',
                        background: 'var(--jv-blue, #1E3A5F)',
                        opacity: 0.6,
                        position: 'relative',
                        zIndex: 10,
                    }}
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {label && (
                <p
                    style={{
                        fontFamily: 'var(--font-body, Inter, sans-serif)',
                        fontSize: '0.8rem',
                        color: 'rgba(30, 58, 95, 0.55)',
                        letterSpacing: '0.06em',
                        margin: 0,
                        textTransform: 'uppercase',
                    }}
                >
                    {label}
                </p>
            )}
        </div>
    );
}

/**
 * Full-screen ripple loading overlay.
 */
export function RippleLoaderOverlay({ label = 'Tuning the Vibe…' }: { label?: string }) {
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'var(--jv-alabaster, #F5F3EE)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
            }}
        >
            <RippleLoader size={130} label={label} />
        </div>
    );
}
