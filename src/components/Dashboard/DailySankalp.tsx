'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './DailySankalp.module.css';

interface Sankalp {
    id: string;
    text: string;
    done: boolean;
}

const DEFAULT_SANKALPS: Sankalp[] = [
    { id: '1', text: 'Morning System reboot (15 mins mediation)', done: false },
    { id: '2', text: 'Enter Deep Work 9 pm', done: false },
    { id: '3', text: 'Unproductive apps disconnection', done: false },
    { id: '4', text: 'Listen ragas at least one time morning,evening & Noon to improve productivity', done: false },
];

export default function DailySankalp() {
    const [items, setItems] = useState<Sankalp[]>(DEFAULT_SANKALPS);
    const [draft, setDraft] = useState('');
    const [adding, setAdding] = useState(false);

    const toggle = (id: string) =>
        setItems((prev) => prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s)));

    const addItem = () => {
        if (!draft.trim()) return;
        setItems((prev) => [...prev, { id: Date.now().toString(), text: draft.trim(), done: false }]);
        setDraft('');
        setAdding(false);
    };

    const done = items.filter((s) => s.done).length;

    return (
        <section className={styles.wrapper}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <span className={styles.flame}>🪔</span>
                    <div>
                        <span className={styles.title}>Daily Sankalp</span>
                        <span className={styles.sub}>Your sacred intentions for today</span>
                    </div>
                </div>

                {/* Advanced Task Manager Button */}
                <Link href="/vedic-planner" style={{ textDecoration: 'none' }}>
                    <motion.div
                        whileHover={{ scale: 1.06, boxShadow: '0 0 18px rgba(251,191,36,0.6)' }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '5px 12px',
                            borderRadius: '20px',
                            background: 'linear-gradient(135deg, rgba(251,191,36,0.18), rgba(234,179,8,0.10))',
                            border: '1px solid rgba(251,191,36,0.45)',
                            color: '#fbbf24',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        <span style={{ fontSize: '0.85rem' }}>🗂️</span>
                        Advanced Planner
                        <span style={{ fontSize: '0.7rem', opacity: 0.75 }}>↗</span>
                    </motion.div>
                </Link>

                <div className={styles.progress}>
                    <span className={styles.progressText}>{done}/{items.length}</span>
                    <div className={styles.progressTrack}>
                        <motion.div
                            className={styles.progressFill}
                            animate={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                    </div>
                </div>
            </div>

            {/* Horizontal scroll strip */}
            <div className={styles.strip}>
                <AnimatePresence initial={false}>
                    {items.map((s) => (
                        <motion.button
                            key={s.id}
                            className={`${styles.pill} ${s.done ? styles.pillDone : ''}`}
                            onClick={() => toggle(s.id)}
                            initial={{ opacity: 0, scale: 0.85, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            layout
                        >
                            <span className={styles.check}>{s.done ? '✓' : '○'}</span>
                            <span className={styles.pillText}>{s.text}</span>
                        </motion.button>
                    ))}
                </AnimatePresence>

                {/* Add new sankalp */}
                <AnimatePresence>
                    {adding ? (
                        <motion.div
                            className={styles.addInputWrap}
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                        >
                            <input
                                className={styles.addInput}
                                autoFocus
                                placeholder="Set an intention…"
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') addItem();
                                    if (e.key === 'Escape') setAdding(false);
                                }}
                            />
                            <button className={styles.confirmBtn} onClick={addItem}>+</button>
                        </motion.div>
                    ) : (
                        <motion.button
                            className={styles.addPill}
                            onClick={() => setAdding(true)}
                            whileHover={{ y: -2, scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            + Add Sankalp
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
