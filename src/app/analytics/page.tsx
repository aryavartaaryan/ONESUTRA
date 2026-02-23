'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, TrendingUp, Award, Calendar } from 'lucide-react';
import styles from './analytics.module.css';

export default function AnalyticsPage() {
    return (
        <div className={styles.container}>
            <motion.div
                className={styles.header}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className={styles.title}>प्रगति विश्लेषण (Progress Analytics)</h1>
                <p className={styles.subtitle}>Track your journey towards Vedic wellness</p>
            </motion.div>

            <div className={styles.grid}>
                <motion.div
                    className={styles.card}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className={styles.iconWrapper}>
                        <TrendingUp size={24} />
                    </div>
                    <h3>Ojas Index</h3>
                    <p className={styles.value}>84%</p>
                    <p className={styles.trend}>+5% this week</p>
                </motion.div>

                <motion.div
                    className={styles.card}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className={styles.iconWrapper}>
                        <Award size={24} />
                    </div>
                    <h3>Sadhana Streak</h3>
                    <p className={styles.value}>12 Days</p>
                    <p className={styles.trend}>Personal Best!</p>
                </motion.div>

                <motion.div
                    className={styles.card}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className={styles.iconWrapper}>
                        <Calendar size={24} />
                    </div>
                    <h3>Meditations</h3>
                    <p className={styles.value}>24</p>
                    <p className={styles.trend}>Total sessions completed</p>
                </motion.div>

                <motion.div
                    className={styles.card}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className={styles.iconWrapper}>
                        <PieChart size={24} />
                    </div>
                    <h3>Focus Distribution</h3>
                    <p className={styles.value}>Balanced</p>
                    <p className={styles.trend}>Prana, Tejas, and Ojas</p>
                </motion.div>
            </div>

            <div className={styles.placeholder}>
                <p>Detailed analytics charts and historical data coming soon...</p>
                <div className={styles.waveEffect}></div>
            </div>
        </div>
    );
}
