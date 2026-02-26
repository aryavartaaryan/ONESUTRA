'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import styles from './DailyInsights.module.css';

// ── Pool of 12 high-quality quotes ──────────────────────────────────────────
const POOL = [
    { icon: '✦', quote: '"The quiet mind is not empty; it is full of the universe."', source: 'Vedic Sutra', cta: 'Reflect' },
    { icon: '☆', quote: '"Happiness is not something you find — it is something you create within."', source: 'Upanishad', cta: 'Reflect' },
    { icon: '◈', quote: '"Let your actions be your temple. Let stillness be your prayer."', source: 'Bhagavad Gita', cta: 'Contemplate' },
    { icon: '✧', quote: '"Rise before the sun, and the day belongs entirely to you."', source: 'Charaka Samhita', cta: 'Practice' },
    { icon: '⊕', quote: '"Yoga is not about touching your toes. It is about what you learn on the way down."', source: 'Proverb', cta: 'Reflect' },
    { icon: '◉', quote: '"Your mind is a garden. Your thoughts are the seeds. Tend them wisely."', source: 'Vedanta', cta: 'Journal' },
    { icon: '✦', quote: '"From food all creatures are born; by food they live and into food they return."', source: 'Taittiriya Upanishad', cta: 'Nourish' },
    { icon: '☽', quote: '"The moon does not fight. It waits. Patience is its mastery."', source: 'Vedic Wisdom', cta: 'Observe' },
    { icon: '◈', quote: '"Speak truth, but speak it pleasantly. Truth that wounds is not dharma."', source: 'Manusmriti', cta: 'Practice' },
    { icon: '✧', quote: '"When the mind is pure, joy follows like a shadow that never leaves."', source: 'Dhammapada', cta: 'Meditate' },
    { icon: '⊕', quote: '"The soul that sees beauty may sometimes walk alone."', source: 'Rumi / Sufi', cta: 'Reflect' },
    { icon: '◉', quote: '"Serve, love, give, purify, meditate, realise."', source: 'Swami Sivananda', cta: 'Serve' },
];

function getCards(): typeof POOL {
    const d = new Date();
    const offset = (d.getDate() * 3 + d.getMonth()) % POOL.length;
    // Return 4 cards starting from offset (for the sliding carousel)
    return Array.from({ length: 4 }, (_, i) => POOL[(offset + i) % POOL.length]);
}

export default function DailyInsights() {
    // Memoize cards so they don't change between renders and ruin active index
    const cards = React.useMemo(() => {
        const d = new Date();
        const offset = (d.getDate() * 3 + d.getMonth()) % POOL.length;
        return Array.from({ length: 4 }, (_, i) => POOL[(offset + i) % POOL.length]);
    }, []);

    const [active, setActive] = useState(0);
    const trackRef = useRef<HTMLDivElement>(null);
    const startX = useRef(0);
    const isDrag = useRef(false);

    const handleSwipe = (dx: number) => {
        if (dx < -30 && active < cards.length - 1) setActive(a => a + 1);
        if (dx > 30 && active > 0) setActive(a => a - 1);
    };

    const onTouchStart = useCallback((e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
    }, []);

    const onTouchEnd = useCallback((e: React.TouchEvent) => {
        handleSwipe(e.changedTouches[0].clientX - startX.current);
    }, [active, cards.length]);

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        startX.current = e.clientX;
        isDrag.current = true;
    }, []);

    const onMouseUp = useCallback((e: React.MouseEvent) => {
        if (!isDrag.current) return;
        isDrag.current = false;
        handleSwipe(e.clientX - startX.current);
    }, [active, cards.length]);

    return (
        <div className={styles.wrapper}>
            {/* Header row */}
            <div className={styles.header}>
                <span className={styles.label}>DAILY INSIGHT</span>
                <span className={styles.time}>
                    {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>


            {/* Sliding cards track */}
            <div
                className={styles.track}
                ref={trackRef}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
            >
                <motion.div
                    className={styles.rail}
                    animate={{ x: `calc(-${active} * (var(--card-w) + 0.75rem))` }}
                    transition={{ type: 'spring', stiffness: 280, damping: 30 }}
                >
                    {cards.map((c, i) => (
                        <div key={i} className={`${styles.card} ${i === active ? styles.cardActive : ''}`}>
                            <span className={styles.icon}>{c.icon}</span>
                            <p className={styles.quote}>{c.quote}</p>
                            <div className={styles.cardFooter}>
                                <span className={styles.source}>{c.source}</span>
                                <button className={styles.cta} onClick={() => { }}>
                                    {c.cta} →
                                </button>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Dot indicators */}
            <div className={styles.dots}>
                {cards.map((_, i) => (
                    <button
                        key={i}
                        className={`${styles.dot} ${i === active ? styles.dotActive : ''}`}
                        onClick={() => setActive(i)}
                    />
                ))}
            </div>
        </div>
    );
}
