'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './DailyInsight.module.css';

interface InsightCard {
    id: string;
    category: string;
    text: string;
    categoryHi: string;
    textHi: string;
    timestamp: string;
}

const INSIGHTS: InsightCard[] = [
    {
        id: '1',
        category: 'VEDIC SUTRA',
        text: '"The quiet mind is not empty; it is full of the universe."',
        categoryHi: 'वैदिक सूत्र',
        textHi: '"शांत मन रिक्त नहीं है; यह ब्रह्मांड से भरा है।"',
        timestamp: '09:46 PM',
    },
    {
        id: '2',
        category: 'PROVERB',
        text: '"Happiness is when what you think, what you say, and what you do are in harmony."',
        categoryHi: 'कहावत',
        textHi: '"सुख तब होता है जब आप जो सोचते हैं, जो कहते हैं और जो करते हैं वह सामंजस्य में हो।"',
        timestamp: '10:00 PM',
    }
];

export default function DailyInsight() {
    return (
        <section className={styles.insightSection}>
            <div className={styles.sectionHeader}>
                <span className={styles.sectionLabel}>DAILY INSIGHT</span>
                <span className={styles.timestamp}>{INSIGHTS[0].timestamp}</span>
            </div>

            <div className={styles.carouselContainer}>
                {INSIGHTS.map((insight, idx) => (
                    <motion.div
                        key={insight.id}
                        className={styles.insightCard}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.2 }}
                    >
                        <div className={styles.dotIcon}>🔆</div>
                        <p className={styles.insightText}>{insight.text}</p>
                        <div className={styles.cardFooter}>
                            <span className={styles.category}>{insight.category}</span>
                            <button className={styles.reflectBtn}>Reflect →</button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
