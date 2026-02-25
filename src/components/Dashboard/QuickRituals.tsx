'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Flame, BookOpen, Zap, Users, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import styles from './QuickRituals.module.css';

// Home page quick-access grid:
const RITUALS = [
    { id: 'meditate', icon: <Flame size={20} />, label: 'Meditate', href: '/dhyan-kshetra' },
    { id: 'journal', icon: <BookOpen size={20} />, label: 'Journal', href: '/journal' },
    { id: 'leela', icon: <Zap size={20} />, label: 'Project Leela', href: '/project-leela' },
    { id: 'community', icon: <Users size={20} />, label: 'Community', href: '#' },
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
                        <Link href={ritual.href} className={styles.ritualLink}>
                            <div className={styles.iconCircle}>
                                {ritual.icon}
                            </div>
                            <span className={styles.label}>{ritual.label}</span>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
