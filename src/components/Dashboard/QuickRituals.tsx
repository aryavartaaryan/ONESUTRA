'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Flame, BookOpen, Music, Wind, Heart } from 'lucide-react';
import styles from './QuickRituals.module.css';

const RITUALS = [
    { id: 'meditate', icon: <Flame size={20} />, label: 'Meditate' },
    { id: 'journal', icon: <BookOpen size={20} />, label: 'Journal' },
    { id: 'chant', icon: <Music size={20} />, label: 'Chant' },
    { id: 'breathe', icon: <Wind size={20} />, label: 'Breathe' },
    { id: 'gratitude', icon: <Heart size={20} />, label: 'Gratitude' },
];

export default function QuickRituals() {
    return (
        <section className={styles.ritualSection}>
            <h3 className={styles.sectionTitle}>QUICK RITUALS</h3>
            <div className={styles.iconsGrid}>
                {RITUALS.map((ritual, idx) => (
                    <motion.div
                        key={ritual.id}
                        className={styles.ritualItem}
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <div className={styles.iconCircle}>
                            {ritual.icon}
                        </div>
                        <span className={styles.label}>{ritual.label}</span>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
