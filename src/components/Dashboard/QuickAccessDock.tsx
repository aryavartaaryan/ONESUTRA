'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from './QuickAccessDock.module.css';

const DOCK_ITEMS = [
    { id: 'meditation', href: '/dhyan-kshetra', emoji: '🧘', label: 'Meditation\nRoom', color: '#1E3A5F' },
    { id: 'reading', href: '/journal', emoji: '📖', label: 'Reading\nRoom', color: '#5a3e8a' },
    { id: 'leela', href: '/project-leela', emoji: '🎮', label: 'Leela', color: '#2a6b2a' },
    { id: 'acharya', href: '/acharya-samvad', emoji: '🕉️', label: 'Ask Acharya', color: '#8B4513' },
];

export default function QuickAccessDock() {
    return (
        <section className={styles.wrapper}>
            <div className={styles.title}>Quick Access</div>
            <div className={styles.dock}>
                {DOCK_ITEMS.map((item, i) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 + i * 0.08, duration: 0.5, ease: 'easeOut' }}
                    >
                        <Link href={item.href} className={styles.item}>
                            <motion.div
                                className={styles.iconWrap}
                                style={{ '--dock-color': item.color } as React.CSSProperties}
                                whileHover={{ y: -4, scale: 1.08 }}
                                whileTap={{ scale: 0.94 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            >
                                <span className={styles.emoji}>{item.emoji}</span>
                                {/* Glow ring */}
                                <span className={styles.glow} />
                            </motion.div>
                            <span className={styles.label}>
                                {item.label.split('\n').map((l, idx) => (
                                    <span key={idx} style={{ display: 'block' }}>{l}</span>
                                ))}
                            </span>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
