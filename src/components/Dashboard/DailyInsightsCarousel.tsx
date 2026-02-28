'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './DailyInsightsCarousel.module.css';

// Rotating daily insight cards. Seeded by day-of-year so they are consistent
// across sessions on the same day.
const INSIGHTS = [
    {
        sanskrit: 'सर्वे भवन्तु सुखिनः',
        transliteration: 'Sarve Bhavantu Sukhinah',
        meaning: 'May all beings be happy. May all beings be free from illness.',
        icon: '🪷',
        accent: 'rgba(214, 141, 58, 0.18)',
    },
    {
        sanskrit: 'तत् त्वम् असि',
        transliteration: 'Tat Tvam Asi',
        meaning: 'Thou art That. Your true self is one with the universal consciousness.',
        icon: '🌅',
        accent: 'rgba(100, 216, 203, 0.15)',
    },
    {
        sanskrit: 'अहं ब्रह्मास्मि',
        transliteration: 'Aham Brahmasmi',
        meaning: 'I am Brahman — the infinite, the light, the divine itself.',
        icon: '✨',
        accent: 'rgba(155, 140, 255, 0.15)',
    },
    {
        sanskrit: 'योगः कर्मसु कौशलम्',
        transliteration: 'Yogaḥ Karmasu Kauśalam',
        meaning: 'Excellence in action is yoga. Do every task with your whole being.',
        icon: '🌿',
        accent: 'rgba(90, 200, 130, 0.15)',
    },
    {
        sanskrit: 'ॐ शान्तिः शान्तिः शान्तिः',
        transliteration: 'Om Shanti Shanti Shantih',
        meaning: 'Peace in body, peace in mind, peace in spirit.',
        icon: '🕊️',
        accent: 'rgba(255, 255, 255, 0.12)',
    },
    {
        sanskrit: 'प्राणायामो हि परमो धर्मः',
        transliteration: 'Prāṇāyāmo hi Paramo Dharmaḥ',
        meaning: 'Breath regulation is the highest virtue. Your breath is your anchor.',
        icon: '🌬️',
        accent: 'rgba(214, 141, 58, 0.16)',
    },
];

// Stable daily seed — same card appears all day, shifts at midnight
function getTodaySeed() {
    const now = new Date();
    return now.getFullYear() * 1000 + Math.floor(
        (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
            Date.UTC(now.getFullYear(), 0, 0)) /
        86400000
    );
}

export default function DailyInsightsCarousel() {
    const seed = getTodaySeed();
    // Show today's card first, then the rest in order
    const ordered = [
        ...INSIGHTS.slice(seed % INSIGHTS.length),
        ...INSIGHTS.slice(0, seed % INSIGHTS.length),
    ];

    return (
        <section className={styles.section} aria-label="Daily Insights">
            <h2 className={styles.sectionLabel}>Daily Insights</h2>

            <div className={styles.track}>
                {ordered.map((card, i) => (
                    <motion.article
                        key={card.transliteration}
                        className={styles.card}
                        style={{ background: card.accent } as React.CSSProperties}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06, duration: 0.5, ease: 'easeOut' }}
                    >
                        <span className={styles.icon}>{card.icon}</span>
                        <p className={styles.sanskrit}>{card.sanskrit}</p>
                        <p className={styles.transliteration}>{card.transliteration}</p>
                        <p className={styles.meaning}>{card.meaning}</p>
                    </motion.article>
                ))}
            </div>
        </section>
    );
}
