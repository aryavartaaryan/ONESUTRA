'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './WisdomTicker.module.css';

const QUOTES = [
    '"The quiet mind is not empty; it is full of the universe."',
    '"Within you is the light of a thousand suns — be still and let it shine."',
    '"He who knows others is wise; he who knows himself is enlightened."',
    '"Yoga is the journey of the self, through the self, to the self."',
    '"In the depth of winter, I finally learned there was in me an invincible summer."',
];

export default function WisdomTicker() {
    const [idx, setIdx] = useState(0);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const cycle = () => {
            setVisible(false);
            setTimeout(() => {
                setIdx(i => (i + 1) % QUOTES.length);
                setVisible(true);
            }, 700);
        };
        const id = setInterval(cycle, 6000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className={styles.strip}>
            <span className={styles.leaf}>❧</span>
            <div className={styles.textWrap}>
                <AnimatePresence mode="wait">
                    {visible && (
                        <motion.p
                            key={idx}
                            className={styles.quote}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                            transition={{ duration: 0.55, ease: 'easeInOut' }}
                        >
                            {QUOTES[idx]}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
            <span className={styles.leaf}>❧</span>
        </div>
    );
}
