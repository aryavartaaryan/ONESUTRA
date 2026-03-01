'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import styles from './JustVibePortals.module.css';

// ── Unified ReZo Dimensions — merges all portals + bento dimensions ──────────
const DIMENSIONS = [
    {
        id: 'pranaverse',
        href: '/pranaverse',
        gradient: 'linear-gradient(135deg, #001535 0%, #0a244e 100%)',
        accent: '#82cfff',
        emoji: '〰️',
        label: 'PranaVerse',
        desc: 'Sacred reels — mantras, wisdom, and circadian nature.',
        badge: 'Reels · Feed',
    },
    {
        id: 'sutra',
        href: '/sutra',
        gradient: 'linear-gradient(135deg, rgba(13,8,32,0.95) 0%, rgba(76,29,149,0.85) 100%)',
        accent: '#c084fc',
        emoji: '💬',
        label: 'SUTRA',
        desc: 'Intentional Chat_SUTRA — the anti-anxiety messenger.',
        badge: 'Conscious Chat',
    },
    {
        id: 'acharya',
        href: '/acharya-samvad',
        gradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        accent: '#a5b4fc',
        emoji: 'ॐ',
        label: 'Acharya Samvaad',
        desc: 'Deep wisdom & Ayurvedic guidance from your AI Guru.',
        badge: 'Guru · Wisdom',
    },
    {
        id: 'meditate',
        href: '/dhyan-kshetra',
        gradient: 'linear-gradient(135deg, #0d001a 0%, #1a0840 100%)',
        accent: '#b388ff',
        emoji: '🧘',
        label: 'Dhyan Kshetra',
        desc: 'Sacred space of stillness, mantra and inner light.',
        badge: 'Sacred RezoVibe',
    },
    {
        id: 'leela',
        href: '/project-leela',
        gradient: 'linear-gradient(135deg, #001408 0%, #003d2c 100%)',
        accent: '#69ffba',
        emoji: '🌀',
        label: 'Leela',
        desc: 'The divine illusion. Cosmic play of consciousness.',
        badge: 'Divine Play',
    },
    {
        id: 'journal',
        href: '/journal',
        gradient: 'linear-gradient(135deg, #1a0a00 0%, #4a2200 100%)',
        accent: '#ffd580',
        emoji: '📖',
        label: 'Sacred Journal',
        desc: 'Reflect, write and witness the mind in silence.',
        badge: 'Reflection',
    },
    {
        id: 'ayurveda',
        href: '/dhyan-kshetra',
        gradient: 'linear-gradient(135deg, rgba(6,78,59,0.95) 0%, rgba(20,83,45,0.90) 100%)',
        accent: '#86efac',
        emoji: '🌿',
        label: 'Vedic Wisdom',
        desc: 'Holistic health, Dosha analysis, and Ayurvedic counsel.',
        badge: 'Ayurveda · Health',
    },
    {
        id: 'pranayama',
        href: '/pranayama',
        gradient: 'linear-gradient(135deg, rgba(120,53,15,0.92) 0%, rgba(180,83,9,0.85) 100%)',
        accent: '#fde68a',
        emoji: '🌬️',
        label: 'Pranayama',
        desc: 'Sacred breath-work and yogic breathing practices.',
        badge: 'Breath · Yoga',
    },
];

export default function JustVibePortals() {
    const { lang } = useLanguage();

    return (
        <div className={styles.wrapper}>
            {/* ── Header ── */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2.4, repeat: Infinity }}
                        className={styles.liveDot}
                    />
                    <span className={styles.title}>
                        {lang === 'hi' ? 'ReZo आयाम' : 'ReZo Dimensions'}
                    </span>
                </div>
                <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em' }}>
                    {DIMENSIONS.length} portals
                </span>
            </div>

            {/* ── Horizontal scroll cards ── */}
            <div className={styles.scroll}>
                {DIMENSIONS.map((d, i) => (
                    <motion.div
                        key={d.id}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.07 }}
                        whileHover={{ y: -4 }}
                        style={{ flexShrink: 0 }}
                    >
                        <Link href={d.href} className={styles.cardLink}>
                            <div className={styles.card} style={{ background: d.gradient }}>
                                {/* Accent label chip */}
                                <span
                                    className={styles.typeTag}
                                    style={{ color: d.accent, borderColor: `${d.accent}44`, background: `${d.accent}14` }}
                                >
                                    {d.badge}
                                </span>

                                {/* Emoji */}
                                <div className={styles.thumbArea}>
                                    <motion.span
                                        className={styles.thumbEmoji}
                                        animate={{
                                            y: [0, -5, 0],
                                            filter: [
                                                `drop-shadow(0 0 10px ${d.accent}66)`,
                                                `drop-shadow(0 0 22px ${d.accent}aa)`,
                                                `drop-shadow(0 0 10px ${d.accent}66)`,
                                            ],
                                        }}
                                        transition={{ duration: 3 + i * 0.25, repeat: Infinity, ease: 'easeInOut' }}
                                    >
                                        {d.emoji}
                                    </motion.span>
                                </div>

                                {/* Description */}
                                <p className={styles.excerpt}>{d.desc}</p>

                                {/* Footer */}
                                <div className={styles.cardFooter}>
                                    <div className={styles.miniProfile}>
                                        <span className={styles.miniRing} style={{ boxShadow: `0 0 0 2px ${d.accent}` }}>
                                            {d.emoji}
                                        </span>
                                        <div>
                                            <span className={styles.miniHandle}>{d.label}</span>
                                            <span className={styles.miniBadge}>{d.badge}</span>
                                        </div>
                                    </div>
                                    <span
                                        style={{ fontSize: '0.6rem', color: d.accent, opacity: 0.7 }}
                                    >
                                        Enter →
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
