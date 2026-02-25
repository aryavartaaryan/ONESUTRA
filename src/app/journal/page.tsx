'use client';
import React from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function JournalPage() {
    return (
        <main className={styles.container}>
            <div className={styles.bg} />
            <div className={styles.sacredGrid} />

            <div className={styles.content}>
                <div className={styles.iconWrap}>
                    <span className={styles.icon}>📔</span>
                    <div className={styles.iconRing} />
                    <div className={styles.iconRing2} />
                </div>

                <div className={styles.badge}>Coming Soon</div>

                <h1 className={styles.title}>Sacred Journal</h1>
                <p className={styles.subtitle}>आत्मा डायरी</p>

                <p className={styles.desc}>
                    Your personal space for inner reflection is being crafted.
                    <br />
                    Daily sadhana logs, gratitude practices, dream records,
                    and Vedic self-inquiry prompts will arrive here soon.
                </p>

                <div className={styles.features}>
                    {[
                        { icon: '✨', label: 'Daily Sadhana Log' },
                        { icon: '🙏', label: 'Gratitude Practice' },
                        { icon: '🌙', label: 'Dream Journal' },
                        { icon: '🔍', label: 'Self-Inquiry' },
                    ].map(f => (
                        <div key={f.label} className={styles.featureChip}>
                            <span>{f.icon}</span>
                            <span>{f.label}</span>
                        </div>
                    ))}
                </div>

                <Link href="/" className={styles.backBtn}>
                    ← Return Home
                </Link>
            </div>
        </main>
    );
}
