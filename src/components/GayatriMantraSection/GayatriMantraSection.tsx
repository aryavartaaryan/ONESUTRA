'use client';

import React, { useEffect, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import styles from './GayatriMantraSection.module.css';

const mantraLines = [
    "ॐ भूर्भुवः स्वः",
    "तत् सवितुर्वरेण्यं",
    "भर्गो देवस्य धीमहि",
    "धियो यो नः प्रचोदयात्"
];

const meaning = "हम उस परमात्मा के तेज का ध्यान करते हैं, जिसने इस संसार को उत्पन्न किया है; वह हमारी बुद्धि को सत्-मार्ग की ओर प्रेरित करे।";

export default function GayatriMantraSection() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Split mantra into Grapheme Clusters (Aksharas) or Words to preserve Devanagari rendering
    const getSegments = (text: string) => {
        if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
            const segmenter = new Intl.Segmenter("hi", { granularity: "word" });
            return [...segmenter.segment(text)].map(s => s.segment);
        }
        // Fallback to words if Segmenter is not available to avoid broken characters
        return text.split(" ");
    };

    // Loop Animation Logic
    const [animationKey, setAnimationKey] = useState(0);

    useEffect(() => {
        if (!isClient) return;

        // Cycle duration: Appear (staggered ~2s) + Stay (3s) + Disappear (1s) = ~6s
        const interval = setInterval(() => {
            setAnimationKey(prev => prev + 1);
        }, 7000); // 7 seconds per cycle to be safe

        return () => clearInterval(interval);
    }, [isClient]);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15, // Slowed down for grandeur
                delayChildren: 0.2
            }
        },
        exit: {
            opacity: 0,
            transition: {
                duration: 1,
                ease: "easeInOut"
            }
        }
    };

    const charVariants: Variants = {
        hidden: { opacity: 0, y: 10, textShadow: "0 0 0 rgba(212, 175, 55, 0)" },
        visible: {
            opacity: 1,
            y: 0,
            textShadow: "0 0 20px rgba(212, 175, 55, 0.8)",
            transition: {
                duration: 0.8,
                ease: "easeOut"
            }
        }
    };

    if (!isClient) return null;

    return (
        <section className={styles.sectionner}>
            {/* ... Background elements ... */}
            <div className={styles.solarOrb}></div>
            <div className={styles.mandalaBg}>
                <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                    <circle cx="50" cy="50" r="45" stroke="#D4AF37" strokeWidth="0.2" fill="none" strokeDasharray="1 1" />
                    <circle cx="50" cy="50" r="35" stroke="#D4AF37" strokeWidth="0.5" fill="none" opacity="0.3" />
                    <path d="M50 5 L60 30 L90 30 L65 50 L75 80 L50 65 L25 80 L35 50 L10 30 L40 30 Z" stroke="#D4AF37" strokeWidth="0.3" fill="none" opacity="0.5" />
                </svg>
            </div>

            <div className={styles.particleContainer}>
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className={styles.particle}
                        style={{
                            left: `${Math.random() * 100}%`,
                            width: `${Math.random() * 3 + 1}px`,
                            height: `${Math.random() * 3 + 1}px`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${10 + Math.random() * 10}s`
                        }}
                    />
                ))}
            </div>

            {/* --- CONTENT CARD --- */}
            <motion.div
                className={styles.card}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeOut" }}
            >
                <div className={styles.sanskritText}>
                    {/* Re-mount on key change to trigger animation from scratch */}
                    <motion.div
                        key={animationKey}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        style={{ width: '100%' }}
                    >
                        {mantraLines.map((line, lineIndex) => (
                            <div
                                key={lineIndex}
                                style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', width: '100%', marginBottom: '1rem' }}
                            >
                                {getSegments(line).map((char, charIndex) => (
                                    <motion.span
                                        key={charIndex}
                                        variants={charVariants}
                                        className={styles.char}
                                        style={{ display: 'inline-block', marginRight: '0.25rem' }} // Ensure words don't break
                                    >
                                        {char}
                                    </motion.span>
                                ))}
                            </div>
                        ))}
                    </motion.div>
                </div>

                <motion.p
                    className={styles.meaningText}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 0.9, y: 0 }}
                    transition={{ delay: 3, duration: 2 }} // Wait for mantra to finish
                >
                    {meaning}
                </motion.p>
            </motion.div>
        </section>
    );
}
