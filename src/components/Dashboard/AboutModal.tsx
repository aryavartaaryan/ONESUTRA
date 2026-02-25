'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import styles from './AboutModal.module.css';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
    // Close on Escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className={styles.backdrop}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                        onClick={onClose}
                    />

                    {/* Bottom sheet */}
                    <motion.div
                        className={styles.sheet}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                        drag="y"
                        dragConstraints={{ top: 0 }}
                        dragElastic={0.1}
                        onDragEnd={(_, info) => { if (info.offset.y > 120) onClose(); }}
                    >
                        {/* Drag handle */}
                        <div className={styles.handle} />

                        {/* Close button */}
                        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                            <X size={18} />
                        </button>

                        {/* Content */}
                        <div className={styles.content}>
                            {/* OM watermark */}
                            <span className={styles.omWatermark}>ॐ</span>

                            <motion.span
                                className={styles.eyebrow}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15, duration: 0.6, ease: 'easeInOut' }}
                            >
                                हमारा धर्म
                            </motion.span>

                            <motion.h2
                                className={styles.title}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.7, ease: 'easeInOut' }}
                            >
                                Our Dharma
                            </motion.h2>

                            <motion.div
                                className={styles.body}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.7, ease: 'easeInOut' }}
                            >
                                <p>
                                    Welcome to <strong>Pranav Samdhaan</strong>. We are on a mission to harmonize the
                                    ancient wisdom of the great Rishis with the limitless potential of modern
                                    Artificial Intelligence.
                                </p>
                                <p>
                                    Our objective is simple yet profound: <em>to create a digital sanctuary that heals.</em>{' '}
                                    By fusing Vedic traditions with technology, we aim to build a society that is not
                                    just smarter, but more grounded, conscious, and spiritually aligned.
                                </p>
                                <div className={styles.divider} />
                                <p className={styles.creator}>
                                    Created by <strong>Aryan Choudhary</strong>
                                </p>
                            </motion.div>
                        </div>

                        {/* Footer */}
                        <div className={styles.footer}>
                            Made with Love &amp; Code in India &nbsp;🇮🇳
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
