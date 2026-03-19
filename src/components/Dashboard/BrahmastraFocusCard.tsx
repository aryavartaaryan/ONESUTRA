'use client';

import { motion } from 'framer-motion';
import styles from './BrahmastraFocusCard.module.css';

interface BrahmastraFocusCardProps {
    active: boolean;
    focusWindowMinutes?: number;
    impactedMeetings?: number;
    subtitle?: string;
}

export default function BrahmastraFocusCard({
    active,
    focusWindowMinutes = 120,
    impactedMeetings = 0,
    subtitle = 'Silence the noise. Guard the inner fire.',
}: BrahmastraFocusCardProps) {
    return (
        <motion.section
            className={styles.card}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
        >
            <motion.div
                className={styles.ring}
                animate={{ rotate: active ? 360 : 0 }}
                transition={{ duration: 22, repeat: active ? Infinity : 0, ease: 'linear' }}
            />

            <div className={styles.label}>Brahmastra Protocol</div>
            <h3 className={styles.title}>{active ? 'Deep Focus is Live' : 'Deep Focus is Resting'}</h3>
            <p>{subtitle}</p>

            <div className={`${styles.status} ${active ? styles.statusActive : styles.statusIdle}`}>
                <span className={styles.dot} />
                {active ? 'Interruption Shield Enabled' : 'Ready to Activate'}
            </div>

            <div className={styles.meta}>
                <span className={styles.chip}>Window: {focusWindowMinutes} min</span>
                <span className={styles.chip}>Meetings shifted: {impactedMeetings}</span>
            </div>
        </motion.section>
    );
}
