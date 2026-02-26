'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from './PranaVerseMini.module.css';

// Mini feed posts with updated JustVibe terminology
const MINI_POSTS = [
    {
        id: 1,
        type: 'dristi',
        emoji: '🌅',
        bg: 'linear-gradient(135deg, #2d1a06 0%, #4a2c0a 100%)',
        handle: '@Aryan.Creates',
        badge: 'Founder · Vibe Coder',
        ringColor: '#ffd060',
        excerpt: 'Watched the sun paint the whole sky. 90-min golden hour time-lapse.',
        tag: '📸 Dristi',
        tagColor: '#ffd060',
        vibed: '1.2k',
    },
    {
        id: 2,
        type: 'raag',
        emoji: '🎵',
        bg: 'linear-gradient(135deg, #050e05 0%, #0b1a0a 100%)',
        handle: '@Lakshmi.Flow',
        badge: 'Designer · Builder',
        ringColor: '#52e89a',
        excerpt: '\"…the creative downloads come not when you chase them, but when you become very still.\"',
        tag: '🎵 Visual Raag',
        tagColor: '#80e4b0',
        vibed: '892',
    },
    {
        id: 3,
        type: 'reflect',
        emoji: '🪐',
        bg: 'linear-gradient(135deg, #05020f 0%, #0e0820 100%)',
        handle: '@Rishi.Dharma',
        badge: 'Professional',
        ringColor: '#c77dff',
        excerpt: '\"Yesterday I was clever. Today I am wise — I am changing myself.\" — Rumi',
        tag: '✦ Reflection',
        tagColor: '#b4aaff',
        vibed: '3.4k',
    },
];

export default function PranaVerseMini() {
    return (
        <section className={styles.wrapper}>
            {/* Header — now JustVibe */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <span className={styles.liveDot} />
                    <span className={styles.title}>JustVibe</span>
                    <span className={styles.sub}>The Vibe Feed</span>
                </div>
                <Link href="/pranaverse" className={styles.seeAll}>
                    See All →
                </Link>
            </div>

            {/* Horizontal scroll cards */}
            <div className={styles.scroll}>
                {MINI_POSTS.map((p, i) => (
                    <motion.div
                        key={p.id}
                        className={styles.card}
                        style={{ background: p.bg }}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08 }}
                        whileHover={{ y: -3 }}
                    >
                        {/* Post type tag */}
                        <span className={styles.typeTag} style={{ color: p.tagColor, borderColor: `${p.tagColor}33`, background: `${p.tagColor}12` }}>
                            {p.tag}
                        </span>

                        {/* Big emoji / thumbnail */}
                        <div className={styles.thumbArea}>
                            <span className={styles.thumbEmoji}>{p.emoji}</span>
                        </div>

                        {/* Excerpt */}
                        <p className={styles.excerpt}>{p.excerpt}</p>

                        {/* Footer row */}
                        <div className={styles.cardFooter}>
                            <div className={styles.miniProfile}>
                                <span
                                    className={styles.miniRing}
                                    style={{ boxShadow: `0 0 0 2px ${p.ringColor}` }}
                                >
                                    {p.emoji}
                                </span>
                                <div>
                                    <span className={styles.miniHandle}>{p.handle}</span>
                                    <span className={styles.miniBadge}>{p.badge}</span>
                                </div>
                            </div>
                            {/* "Vibed" count (replaces Likes) */}
                            <span className={styles.miniLikes}>✨ {p.vibed} Vibed</span>
                        </div>
                    </motion.div>
                ))}

                {/* CTA card */}
                <Link href="/pranaverse" className={styles.ctaCard}>
                    <span className={styles.ctaEmoji}>⚡</span>
                    <span className={styles.ctaText}>Enter<br />JustVibe</span>
                </Link>
            </div>
        </section>
    );
}
