'use client';

import React from 'react';
import { motion } from 'framer-motion';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.3, delayChildren: 0.2 },
    },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const itemVariants: any = {
    hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
    visible: {
        opacity: 1, y: 0, filter: 'blur(0px)',
        transition: { duration: 1, ease: 'easeOut' }
    },
};

export default function ConsciousManifesto() {
    return (
        <section style={{
            position: 'relative',
            width: '100%',
            maxWidth: '56rem',       // max-w-4xl
            margin: '0 auto',
            padding: '7rem 1.5rem', // py-28 px-6
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
        }}>
            {/* ── Manifesto Text ── */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-100px' }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
                {/* Eyebrow */}
                <motion.span
                    variants={itemVariants}
                    style={{
                        fontSize: 11,
                        letterSpacing: '0.40em',
                        textTransform: 'uppercase',
                        color: 'rgba(253,186,116,0.80)',  // orange-300/80
                        fontWeight: 600,
                        marginBottom: '1.5rem',
                        fontFamily: 'system-ui, sans-serif',
                    }}
                >
                    The Conscious OS
                </motion.span>

                {/* Hero Headline */}
                <motion.h2
                    variants={itemVariants}
                    style={{
                        margin: '0 0 2rem',
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: 'clamp(2.4rem, 6vw, 4.5rem)',
                        fontWeight: 700,
                        color: 'rgba(255,255,255,0.96)',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.08,
                        textShadow: '0 4px 48px rgba(0,0,0,0.5)',
                    }}
                >
                    High Signal.{' '}
                    <span style={{ color: 'rgba(253,186,116,0.92)' }}>Zero Noise.</span>
                </motion.h2>

                {/* Body */}
                <motion.p
                    variants={itemVariants}
                    style={{
                        margin: 0,
                        maxWidth: '38rem',
                        fontSize: 'clamp(1rem, 2.2vw, 1.15rem)',
                        color: 'rgba(255,255,255,0.55)',
                        fontWeight: 300,
                        lineHeight: 1.85,
                        letterSpacing: '0.015em',
                    }}
                >
                    While the modern web is designed to fragment your attention,{' '}
                    <strong style={{ color: 'rgba(255,255,255,0.78)', fontWeight: 500 }}>ReZo</strong>{' '}
                    is engineered to unify your mind. We absorb the friction of your daily tasks
                    and align your routine with your natural rhythms.{' '}
                    <em style={{ color: 'rgba(253,186,116,0.70)', fontStyle: 'normal' }}>
                        Surrender the digital chaos. Step into your flow.
                    </em>
                </motion.p>
            </motion.div>

            {/* ── Prana Thread — draws downward after text reveals ── */}
            <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'center', width: '100%' }}>
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    whileInView={{ height: 120, opacity: 1 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 1.5, delay: 1.2, ease: 'easeInOut' }}
                    style={{
                        width: 1,
                        background: 'linear-gradient(to bottom, rgba(251,146,60,0.60), rgba(251,146,60,0.18), transparent)',
                    }}
                />
            </div>
        </section>
    );
}
