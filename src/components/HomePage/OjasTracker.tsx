'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import styles from './OjasTracker.module.css';

interface RingData {
    id: string;
    titleHi: string;
    titleEn: string;
    subtitleHi: string;
    subtitleEn: string;
    value: number;
    max: number;
    unit: string;
    color: string;
}

const TRACKER_DATA: RingData[] = [
    {
        id: 'sleep',
        titleHi: 'निद्रा',
        titleEn: 'Sleep',
        subtitleHi: 'विश्राम',
        subtitleEn: 'Rest',
        value: 7,
        max: 8,
        unit: 'hrs',
        color: '#2E473B',
    },
    {
        id: 'ojas',
        titleHi: 'ओजस',
        titleEn: 'Ojas',
        subtitleHi: 'प्राणशक्ति',
        subtitleEn: 'Vitality',
        value: 78,
        max: 100,
        unit: '%',
        color: '#FF9933',
    },
];

const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ProgressRing({ data, lang }: { data: RingData; lang: 'hi' | 'en' }) {
    const [animatedOffset, setAnimatedOffset] = useState(CIRCUMFERENCE);
    const progress = data.value / data.max;
    const targetOffset = CIRCUMFERENCE * (1 - progress);

    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedOffset(targetOffset);
        }, 300);
        return () => clearTimeout(timer);
    }, [targetOffset]);

    return (
        <motion.div
            className={styles.ringCard}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.6 }}
        >
            <div className={styles.ringContainer}>
                <svg className={styles.ringSvg} viewBox="0 0 100 100">
                    <circle className={styles.ringBg} cx="50" cy="50" r={RADIUS} />
                    <circle
                        className={styles.ringProgress}
                        cx="50"
                        cy="50"
                        r={RADIUS}
                        stroke={data.color}
                        strokeDasharray={CIRCUMFERENCE}
                        strokeDashoffset={animatedOffset}
                    />
                </svg>
                <div className={styles.ringLabel}>
                    <span className={styles.ringValue}>{data.value}</span>
                    <span className={styles.ringUnit}>{data.unit}</span>
                </div>
            </div>
            <div className={styles.ringTitle}>
                {lang === 'hi' ? data.titleHi : data.titleEn}
            </div>
            <div className={styles.ringSubtitle}>
                {lang === 'hi' ? data.subtitleHi : data.subtitleEn}
            </div>
        </motion.div>
    );
}

export default function OjasTracker() {
    const { lang } = useLanguage();

    const t = {
        hi: {
            title: 'आपका',
            accent: 'ओजस',
            titleEnd: 'स्नैपशॉट',
            prakrti: 'प्रकृति',
            dosha: 'वात-पित्त',
        },
        en: {
            title: 'Your',
            accent: 'Ojas',
            titleEnd: 'Snapshot',
            prakrti: 'Prakṛti',
            dosha: 'Vata-Pitta',
        },
    }[lang] || {
        title: 'Your',
        accent: 'Ojas',
        titleEnd: 'Snapshot',
        prakrti: 'Prakṛti',
        dosha: 'Vata-Pitta',
    };

    return (
        <section className={styles.trackerSection}>
            <motion.h2
                className={styles.sectionTitle}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
            >
                {t.title}{' '}
                <span className={styles.sectionTitleAccent}>{t.accent}</span>{' '}
                {t.titleEnd}
            </motion.h2>

            <motion.div
                className={styles.prakrtiBadge}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.6 }}
            >
                <span className={styles.doshaIcon}>🍃</span>
                <span>{t.prakrti}: </span>
                <span className={styles.doshaName}>{t.dosha}</span>
            </motion.div>

            <div className={styles.ringsGrid}>
                {TRACKER_DATA.map((data, i) => (
                    <ProgressRing key={data.id} data={data} lang={lang} />
                ))}
            </div>
        </section>
    );
}
