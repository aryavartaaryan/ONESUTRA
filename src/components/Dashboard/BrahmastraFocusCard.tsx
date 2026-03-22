'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import styles from './BrahmastraFocusCard.module.css';

interface BrahmastraFocusCardProps {
    active: boolean;
    focusWindowMinutes?: number;
    impactedMeetings?: number;
    subtitle?: string;
}

export default function BrahmastraFocusCard({
    active: remoteActive,
    focusWindowMinutes = 120,
    impactedMeetings = 0,
    subtitle = 'Silence the noise. Guard the inner fire.',
}: BrahmastraFocusCardProps) {
    const [localActive, setLocalActive] = useState(false);
    
    const active = remoteActive || localActive;

    return (
        <motion.section
            className={styles.card}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            style={{ paddingBottom: '1.5rem' }}
        >
            <motion.div
                className={styles.ring}
                animate={{ rotate: active ? 360 : 0 }}
                transition={{ duration: 22, repeat: active ? Infinity : 0, ease: 'linear' }}
            />

            <div className={styles.label} style={{ color: active ? 'var(--accent-saffron)' : undefined }}>Brahmastra Protocol</div>
            <h3 className={styles.title}>{active ? 'Deep Focus is Live 🔥' : 'Deep Focus is Resting'}</h3>
            <p>{subtitle}</p>

            <div className={`${styles.status} ${active ? styles.statusActive : styles.statusIdle}`}>
                <span className={styles.dot} />
                {active ? 'Interruption Shield Enabled' : 'Ready to Activate'}
            </div>

            <div className={styles.meta} style={{ marginBottom: '1.2rem' }}>
                <span className={styles.chip}>Window: {focusWindowMinutes} min</span>
                <span className={styles.chip}>Meetings shifted: {impactedMeetings}</span>
            </div>

            <button 
                onClick={() => setLocalActive(!localActive)}
                style={{
                    width: '100%',
                    padding: '0.6rem',
                    background: active ? 'rgba(255,119,34,0.1)' : 'rgba(255,255,255,0.05)',
                    color: active ? 'var(--accent-saffron)' : 'var(--text-main)',
                    border: active ? '1px solid var(--accent-saffron)' : '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'all 0.3s'
                }}
            >
                {active ? 'Deactivate Shield' : '⚡ Activate Protocol'}
            </button>
        </motion.section>
    );
}
