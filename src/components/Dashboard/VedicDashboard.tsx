'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './VedicDashboard.module.css';

// ── Panchang helpers ─────────────────────────────────────────────────────────
const PAKSHA_EN = ['Śukla Pakṣa', 'Kṛṣṇa Pakṣa'];
const TITHI_EN = [
    'Pratipada', 'Dvitīyā', 'Tṛtīyā', 'Caturthī', 'Pañcamī', 'Ṣaṣṭhī', 'Saptamī',
    'Aṣṭamī', 'Navamī', 'Daśamī', 'Ekādaśī', 'Dvādaśī', 'Trayodaśī', 'Caturdaśī', 'Pūrṇimā',
];
const NAKSHATRA_EN = [
    'Ashvinī', 'Bharaṇī', 'Kṛttikā', 'Rohiṇī', 'Mṛgaśīrṣā', 'Ārdrā', 'Punarvasu',
    'Puṣya', 'Āśleṣā', 'Maghā', 'Pūrva Phālgunī', 'Uttara Phālgunī', 'Hasta', 'Citrā',
    'Svātī', 'Viśākhā', 'Anurādhā', 'Jyeṣṭhā', 'Mūla', 'Pūrvāṣāḍhā', 'Uttarāṣāḍhā',
    'Śravaṇa', 'Dhaniṣṭhā', 'Śatabhiṣā', 'Pūrva Bhādrapadā', 'Uttara Bhādrapadā', 'Revatī',
];
const MAAS_EN = [
    'Caitra', 'Vaiśākha', 'Jyeṣṭha', 'Āṣāḍha', 'Śrāvaṇa', 'Bhādrapada',
    'Āśvina', 'Kārtika', 'Mārgaśīrṣa', 'Pauṣa', 'Māgha', 'Phālguna',
];

function getLunarInfo(date: Date) {
    const newMoon = new Date('2000-01-06T18:14:00Z').getTime();
    const lunation = 29.53058867 * 86400000;
    const age = ((date.getTime() - newMoon) % lunation + lunation) % lunation;
    const dayFraction = age / lunation;
    const tithiIdx = Math.floor(dayFraction * 30);
    const nakshatraIdx = Math.floor(dayFraction * 27) % 27;
    const maasIdx = Math.floor((date.getMonth() + (dayFraction > 0.5 ? 1 : 0) + 10) % 12);
    return { paksha: tithiIdx >= 15 ? 1 : 0, tithi: tithiIdx % 15, nakshatra: nakshatraIdx, maas: maasIdx };
}

function fmt12h(h: number, m: number) {
    const p = h >= 12 ? 'PM' : 'AM';
    return { time: `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')}`, period: p };
}

interface Props {
    displayName: string;
    greeting: { emoji: string; text: string; period: string } | null;
}

export default function VedicDashboard({ displayName, greeting }: Props) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(id);
    }, []);

    const { time, period } = fmt12h(now.getHours(), now.getMinutes());
    const lunar = getLunarInfo(now);
    const tithi = TITHI_EN[lunar.tithi];
    const paksha = PAKSHA_EN[lunar.paksha];
    const nakshatra = NAKSHATRA_EN[lunar.nakshatra];
    const maas = MAAS_EN[lunar.maas];
    const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <motion.div
            className={styles.dashboard}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
            {/* ── ROW 1: Greeting + Clock ─────────────────────────────────── */}
            <div className={styles.topRow}>
                <div className={styles.greetBlock}>
                    <div>
                        <div className={styles.greetLine}>
                            <h1 className={styles.greetTitle}>
                                {greeting?.text ?? 'Namaste'} <span className={styles.greetName}>{displayName}</span>
                            </h1>
                        </div>
                        <p className={styles.greetSub}>{greeting?.period ?? ''}</p>
                    </div>
                </div>

                <div className={styles.clockBlock}>
                    <div className={styles.clockPill}>
                        <span className={styles.clockDigits}>{time}</span>
                        <span className={styles.clockAmPm}>{period}</span>
                    </div>
                </div>
            </div>

            {/* ── ROW 2: Vedic Panchang ───────────────────────────────────── */}
            <div className={styles.panchaangRow}>
                <div className={styles.panchCard}>
                    <span className={styles.panchIcon}>🌙</span>
                    <div>
                        <span className={styles.panchLabel}>Tithi</span>
                        <span className={styles.panchValue}>{tithi}</span>
                    </div>
                </div>
                <div className={styles.panchDivider} />
                <div className={styles.panchCard}>
                    <span className={styles.panchIcon}>✦</span>
                    <div>
                        <span className={styles.panchLabel}>Nakshatra</span>
                        <span className={styles.panchValue}>{nakshatra}</span>
                    </div>
                </div>
                <div className={styles.panchDivider} />
                <div className={styles.panchCard}>
                    <span className={styles.panchIcon}>📅</span>
                    <div>
                        <span className={styles.panchLabel}>Māsa · {paksha}</span>
                        <span className={styles.panchValue}>{maas}</span>
                    </div>
                </div>
                <div className={styles.panchDivider} />
                <div className={styles.panchCard}>
                    <span className={styles.panchIcon}>🗓</span>
                    <div>
                        <span className={styles.panchLabel}>Today</span>
                        <span className={styles.panchValue} style={{ fontSize: '0.6rem' }}>{dateStr}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
