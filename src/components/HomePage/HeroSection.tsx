'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, LogIn, UserPlus } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './HeroSection.module.css';

// ── Time-of-day greeting ────────────────────────────────────────────────────
function getTimeGreeting(lang: 'en' | 'hi') {
    const h = new Date().getHours();
    const greetEn = h < 12 ? { emoji: '🙏', text: 'Shubhodaya', period: 'Morning Blessings' }
        : h < 17 ? { emoji: '☀️', text: 'Shubh Madhyahna', period: 'Midday Blessings' }
            : h < 21 ? { emoji: '🪔', text: 'Shubh Sandhya', period: 'Evening Blessings' }
                : { emoji: '🌙', text: 'Shubh Ratri', period: 'Night Blessings' };
    const greetHi = h < 12 ? { emoji: '🙏', text: 'शुभोदय', period: 'शुभ प्रभात' }
        : h < 17 ? { emoji: '☀️', text: 'शुभ मध्याह्न', period: 'मध्याह्न वंदना' }
            : h < 21 ? { emoji: '🪔', text: 'शुभ सन्ध्या', period: 'सन्ध्या वंदना' }
                : { emoji: '🌙', text: 'शुभ रात्रि', period: 'रात्रि विश्राम' };
    return lang === 'hi' ? greetHi : greetEn;
}

interface HeroSectionProps {
    onOpenAuth: () => void;
    onBegin?: () => void;
}

export default function HeroSection({ onOpenAuth, onBegin }: HeroSectionProps) {
    const { lang, toggleLanguage } = useLanguage();
    const [greeting, setGreeting] = useState(() => getTimeGreeting(lang));

    // Refresh greeting when lang changes
    useEffect(() => {
        setGreeting(getTimeGreeting(lang));
    }, [lang]);

    const t = lang === 'hi' ? {
        subtitle: 'कृत्रिम बुद्धिमत्ता और ऋषियों के ज्ञान का संगम — आपके शरीर, मन और आत्मा के उपचार के लिए',
        cta: 'अपनी समाधान यात्रा आरम्भ करें',
        signIn: 'साइन इन',
        signUp: 'साइन अप',
        langToggle: 'EN',
    } : {
        subtitle: 'A sacred fusion of Artificial Intelligence & Wisdom of the Rishis — healing your body, mind & spirit',
        cta: 'JustVibe and Transform',
        signIn: 'Sign In',
        signUp: 'Sign Up',
        langToggle: 'हिं',
    };

    return (
        <section className={styles.heroContainer}>
            {/* Background Sri Yantra */}
            <div className={styles.heroBgYantra}>
                <img src="/sri-yantra-authentic.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>

            {/* Ambient orb */}
            <div className={styles.ambientOrb} />

            {/* ── Language Toggle ─────────────────────────── */}
            <motion.button
                className={styles.langToggle}
                onClick={toggleLanguage}
                whileTap={{ scale: 0.92 }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8, duration: 0.5 }}
                title={lang === 'hi' ? 'Switch to English' : 'हिन्दी में बदलें'}
            >
                <span className={styles.langToggleInner}>{t.langToggle}</span>
            </motion.button>

            {/* ── Main Content ─────────────────────────────── */}
            <motion.div
                className={styles.heroContent}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
            >
                <motion.div
                    className={styles.timeIcon}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                    {greeting.emoji}
                </motion.div>

                <h1 className={styles.greeting}>
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={lang + greeting.text}
                            className={styles.greetingHighlight}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.4 }}
                        >
                            {greeting.text}
                        </motion.span>
                    </AnimatePresence>
                </h1>
                <p className={styles.greetingPeriod}>{greeting.period}</p>

                <motion.p
                    className={styles.heroSubtitle}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                >
                    {t.subtitle}
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                >
                    <button className={styles.heroCta} onClick={onBegin}>
                        <Sparkles size={18} />
                        {t.cta}
                    </button>
                </motion.div>

                <motion.div
                    className={styles.authRow}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.6 }}
                >
                    <button className={styles.authTrigger} onClick={onOpenAuth}>
                        <LogIn size={16} />
                        {t.signIn}
                    </button>
                    <button className={styles.signUpTrigger} onClick={onOpenAuth}>
                        <UserPlus size={16} />
                        {t.signUp}
                    </button>
                </motion.div>

                <motion.div
                    className={styles.brandLine}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                >
                    A Product Crafted by <span>PRANAV.AI</span>
                </motion.div>
            </motion.div>
        </section>
    );
}
