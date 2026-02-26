'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './VedicClock.module.css';

const VARA_EN = ['Ravivāra', 'Somavāra', 'Maṅgalavāra', 'Budhavāra', 'Guruvāra', 'Śukravāra', 'Śanivāra'];
const VARA_HI = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
const PAKSHA_EN = ['Śukla Pakṣa', 'Kṛṣṇa Pakṣa'];
const PAKSHA_HI = ['शुक्ल पक्ष', 'कृष्ण पक्ष'];

// Tithi names (Sanskrit / English)
const TITHI_EN = [
    'Pratipada', 'Dvitīyā', 'Tṛtīyā', 'Caturthī', 'Pañcamī',
    'Ṣaṣṭhī', 'Saptamī', 'Aṣṭamī', 'Navamī', 'Daśamī',
    'Ekādaśī', 'Dvādaśī', 'Trayodaśī', 'Caturdaśī', 'Pūrṇimā / Amāvāsyā',
];
const TITHI_HI = [
    'प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पञ्चमी',
    'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी',
    'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'पूर्णिमा / अमावस्या',
];

function getLunarInfo(date: Date): { paksha: number; tithi: number } {
    const newMoon = new Date('2000-01-06T18:14:00Z').getTime();
    const lunation = 29.53058867 * 86400000;
    const age = ((date.getTime() - newMoon) % lunation + lunation) % lunation;
    const tithiIndex = Math.floor((age / lunation) * 30); // 0–29
    const paksha = tithiIndex >= 15 ? 1 : 0;
    const tithi = tithiIndex % 15; // 0–14
    return { paksha, tithi };
}

function formatTime12h(h: number, m: number) {
    const p = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return { time: `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')}`, period: p };
}

function getDateStr(date: Date) {
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function VedicClock({ compact }: { compact?: boolean }) {
    const { lang } = useLanguage();
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(id);
    }, []);

    const { time, period } = formatTime12h(now.getHours(), now.getMinutes());
    const vara = (lang === 'hi' ? VARA_HI : VARA_EN)[now.getDay()];
    const { paksha: pakshaIdx, tithi: tithiIdx } = getLunarInfo(now);
    const paksha = (lang === 'hi' ? PAKSHA_HI : PAKSHA_EN)[pakshaIdx];
    const tithi = (lang === 'hi' ? TITHI_HI : TITHI_EN)[tithiIdx];
    const dateStr = getDateStr(now);

    // ── Compact inline mode (inside greeting header) ────────────────────────
    if (compact) {
        return (
            <div className={styles.compactRow}>
                <span className={styles.compactTime}>{time} <span className={styles.compactPeriod}>{period}</span></span>
                <span className={styles.compactDot}>·</span>
                <span className={styles.compactDate}>{dateStr}</span>
                <span className={styles.compactDot}>·</span>
                <span className={styles.compactPaksha}>{paksha}</span>
                <span className={styles.compactDot}>·</span>
                <span className={styles.compactTithi}>{tithi}</span>
            </div>
        );
    }

    return (
        <div className={styles.yantra}>
            {/* Left tag */}
            <div className={styles.sideTag}>{vara}</div>

            {/* Center: time */}
            <div className={styles.timeCenter}>
                <div className={styles.timeRow}>
                    <span className={styles.timeDigits}>{time}</span>
                    <span className={styles.timePeriod}>{period}</span>
                </div>
                <span className={styles.dateStr}>{dateStr}</span>
            </div>

            {/* Right tag */}
            <div className={styles.sideTag}>{paksha}</div>
        </div>
    );
}
