'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import styles from './page.module.css';

const PROFILE = {
    name: 'Yogi Aryan',
    title: 'Sattvik Seeker',
    joined: 'Feb 2025',
    prakriti: 'Vata-Pitta',
    doshas: [
        { name: 'Vāta', value: 55, color: '#7E57C2', element: 'Space & Air', trait: 'Creative, Quick, Inspired' },
        { name: 'Pitta', value: 35, color: '#FF8A65', element: 'Fire & Water', trait: 'Focused, Passionate, Leader' },
        { name: 'Kapha', value: 10, color: '#66BB6A', element: 'Earth & Water', trait: 'Stable, Nurturing, Patient' },
    ],
    personality: 'Your dominant Vāta gives you bursts of creative inspiration and quick thinking. Channel it with routine and grounding practices. Your Pitta fire drives ambition — balance it with cooling foods and evening walks.',
    badges: [
        { id: 'riser', label: 'Early Riser', emoji: '🌅', earned: true },
        { id: 'sattvik', label: 'Sattvik', emoji: '🌿', earned: true },
        { id: 'calm', label: 'Calm Mind', emoji: '🪷', earned: true },
        { id: 'decision', label: 'Decision Maker', emoji: '⚡', earned: true },
        { id: 'mindful', label: 'Mindful', emoji: '🧘', earned: true },
        { id: 'streak7', label: '7-Day Streak', emoji: '🔥', earned: true },
        { id: 'scholar', label: 'Vedic Scholar', emoji: '📜', earned: false },
        { id: 'sangha', label: 'Sangha Builder', emoji: '🤝', earned: false },
    ],
    stats: [
        { label: 'Days Active', value: '14', unit: 'days' },
        { label: 'Meditations', value: '22', unit: 'sessions' },
        { label: 'Habits Completed', value: '68', unit: '%' },
        { label: 'Focus Hours', value: '31', unit: 'hrs' },
    ],
    weekProgress: [60, 80, 45, 90, 70, 55, 85],
};

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function ProfilePage() {
    const [tab, setTab] = useState<'dosha' | 'badges' | 'progress'>('dosha');

    return (
        <main className={styles.page}>
            {/* Back nav */}
            <div className={styles.topBar}>
                <Link href="/" className={styles.backBtn}>
                    <ArrowLeft size={16} strokeWidth={1.8} />
                    <span>Home</span>
                </Link>
                <span className={styles.topTitle}>My Profile</span>
                <div style={{ width: 60 }} />
            </div>

            <div className={styles.content}>
                {/* ── Hero ── */}
                <motion.div
                    className={styles.hero}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                    <div className={styles.avatar}>
                        <span className={styles.avatarOm}>ॐ</span>
                    </div>
                    <div className={styles.heroInfo}>
                        <h1 className={styles.heroName}>{PROFILE.name}</h1>
                        <span className={styles.heroTitle}>{PROFILE.title}</span>
                        <span className={styles.heroPrakriti}>Prakriti: {PROFILE.prakriti}</span>
                        <span className={styles.heroJoined}>Member since {PROFILE.joined}</span>
                    </div>
                </motion.div>

                {/* ── Stats row ── */}
                <motion.div
                    className={styles.statsRow}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                >
                    {PROFILE.stats.map(s => (
                        <div key={s.label} className={styles.statCard}>
                            <span className={styles.statValue}>{s.value}</span>
                            <span className={styles.statUnit}>{s.unit}</span>
                            <span className={styles.statLabel}>{s.label}</span>
                        </div>
                    ))}
                </motion.div>

                {/* ── Tabs ── */}
                <motion.div
                    className={styles.tabs}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    {(['dosha', 'badges', 'progress'] as const).map(t => (
                        <button
                            key={t}
                            className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
                            onClick={() => setTab(t)}
                        >
                            {t === 'dosha' ? '🧬 Dosha' : t === 'badges' ? '🏅 Badges' : '📊 Progress'}
                        </button>
                    ))}
                </motion.div>

                {/* ── Dosha tab ── */}
                {tab === 'dosha' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.tabContent}>
                        <p className={styles.doshaIntro}>Your Tridosha constitution — the ancient map of your being</p>
                        {PROFILE.doshas.map(d => (
                            <div key={d.name} className={styles.doshaRow}>
                                <div className={styles.doshaLabel}>
                                    <span className={styles.doshaName}>{d.name}</span>
                                    <span className={styles.doshaElement}>{d.element}</span>
                                </div>
                                <div className={styles.doshaBarTrack}>
                                    <motion.div
                                        className={styles.doshaBarFill}
                                        style={{ background: d.color }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${d.value}%` }}
                                        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
                                    />
                                </div>
                                <span className={styles.doshaPct}>{d.value}%</span>
                                <p className={styles.doshaTrait}>{d.trait}</p>
                            </div>
                        ))}
                        <div className={styles.personalityBox}>
                            <span className={styles.personalityLabel}>Your Prakriti Insight</span>
                            <p className={styles.personalityText}>{PROFILE.personality}</p>
                        </div>
                    </motion.div>
                )}

                {/* ── Badges tab ── */}
                {tab === 'badges' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.tabContent}>
                        <p className={styles.doshaIntro}>Badges earned through your conscious living journey</p>
                        <div className={styles.badgeGrid}>
                            {PROFILE.badges.map(b => (
                                <div key={b.id} className={`${styles.badge} ${!b.earned ? styles.badgeLocked : ''}`}>
                                    <span className={styles.badgeEmoji}>{b.emoji}</span>
                                    <span className={styles.badgeLabel}>{b.label}</span>
                                    {!b.earned && <span className={styles.badgeLock}>🔒</span>}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── Progress tab ── */}
                {tab === 'progress' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.tabContent}>
                        <div className={styles.chartSection}>
                            <p className={styles.chartTitle}>This Week's Wellness Score</p>
                            <div className={styles.chart}>
                                {PROFILE.weekProgress.map((pct, i) => (
                                    <div key={i} className={styles.chartCol}>
                                        <div className={styles.chartBarTrack}>
                                            <motion.div
                                                className={styles.chartBar}
                                                initial={{ height: 0 }}
                                                animate={{ height: `${pct}%` }}
                                                transition={{ delay: i * 0.07, duration: 0.6, ease: 'easeOut' }}
                                            />
                                        </div>
                                        <span className={styles.chartDay}>{DAYS[i]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </main>
    );
}
