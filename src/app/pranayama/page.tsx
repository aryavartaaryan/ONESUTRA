'use client';
import React from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function PranayamaPage() {
    return (
        <main className={styles.container}>
            {/* Ambient background */}
            <div className={styles.bg} />
            <div className={styles.sacredGrid} />

            <div className={styles.content}>
                {/* Glowing icon */}
                <div className={styles.iconWrap}>
                    <span className={styles.icon}>🌬️</span>
                    <div className={styles.iconRing} />
                    <div className={styles.iconRing2} />
                </div>

                <div className={styles.badge}>Coming Soon</div>

                <h1 className={styles.title}>Pranayama</h1>
                <p className={styles.subtitle}>प्राणायाम</p>

                <p className={styles.desc}>
                    A sacred breath-work sanctuary is being prepared for you.
                    <br />
                    Guided Vedic breathing practices, retention techniques, and
                    pranic energy flows will be available here soon.
                </p>

                <div className={styles.features}>
                    {[
                        { icon: '🌀', label: 'Nadi Shodhana' },
                        { icon: '🔥', label: 'Kapalabhati' },
                        { icon: '🌊', label: 'Ujjayi' },
                        { icon: '☀️', label: 'Anulom Vilom' },
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
