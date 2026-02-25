'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import styles from './DailyInsight.module.css';

const INSIGHTS = [
    {
        id: '1',
        category: 'Vedic Sutra',
        categoryHi: 'वैदिक सूत्र',
        text: '"The quiet mind is not empty; it is full of the universe."',
        textHi: '"शांत मन रिक्त नहीं है; यह ब्रह्मांड से भरा है।"',
    },
    {
        id: '2',
        category: 'Proverb',
        categoryHi: 'कहावत',
        text: '"Happiness is when what you think, what you say, and what you do are in harmony."',
        textHi: '"सुख तब होता है जब आप जो सोचते हैं, जो कहते हैं और जो करते हैं वह सामंजस्य में हो।"',
    },
];

const fadeUp = {
    hidden: { opacity: 0, y: 22 },
    visible: (i: number) => ({
        opacity: 1, y: 0,
        transition: { delay: 0.6 + i * 0.18, duration: 0.7, ease: 'easeInOut' as const },
    }),
};

export default function DailyInsight() {
    const { lang } = useLanguage();
    return (
        <section className={styles.insightSection}>
            <span className={styles.sectionLabel}>
                {lang === 'hi' ? 'दैनिक अंतर्दृष्टि' : 'Daily Insight'}
            </span>

            {/* River flow — single column */}
            <div className={styles.riverFlow}>
                {INSIGHTS.map((insight, idx) => (
                    <motion.div
                        key={insight.id}
                        className={styles.insightCard}
                        custom={idx}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-40px' }}
                        variants={fadeUp}
                    >
                        {/* Category pill */}
                        <span className={styles.categoryTag}>
                            {lang === 'hi' ? insight.categoryHi : insight.category}
                        </span>

                        {/* Quote text */}
                        <p className={styles.insightText}>
                            {lang === 'hi' ? insight.textHi : insight.text}
                        </p>

                        {/* Lotus action button — bottom right */}
                        <div className={styles.cardFooter}>
                            <button className={styles.lotusBtn} aria-label="Reflect">
                                ✿
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
