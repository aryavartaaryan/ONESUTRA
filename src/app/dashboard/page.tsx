'use client';

import { useState, useEffect } from 'react';
import OjasTracker from '@/components/HomePage/OjasTracker';
import PillarGrid from '@/components/HomePage/PillarGrid';
import SadhanaTimeline from '@/components/HomePage/SadhanaTimeline';
import GayatriMantraSection from '@/components/GayatriMantraSection/GayatriMantraSection';
import VahanaBar from '@/components/HomePage/VahanaBar';
import VoiceCallModal from '@/components/VoiceCallModal';
import DailyInsight from '@/components/Dashboard/DailyInsight';
import QuickRituals from '@/components/Dashboard/QuickRituals';
import TodayJourney from '@/components/Dashboard/TodayJourney';
import styles from './dashboard.module.css';

export default function DashboardPage() {
    const [isCallModalOpen, setIsCallModalOpen] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);

    useEffect(() => {
        // Read user name from localStorage if set during sign-in
        const stored = localStorage.getItem('vedic_user_name');
        if (stored) setUserName(stored);
    }, []);

    const greetingPrefix = 'Namaste, ';
    const displayName = userName || 'Traveller';

    return (
        <main className={styles.dashboardPage}>

            {/* Top Right Om Button */}
            <div className={styles.topRightActions}>
                <button className={styles.omButton}>ॐ</button>
            </div>

            {/* Greeting Header */}
            <header className={styles.greetingHeader}>
                <h1 className={styles.greetingTitle}>
                    {greetingPrefix}
                    <span className={styles.greetingName}>{displayName}.</span>
                </h1>
                <p className={styles.greetingSubtitle}>The energy is grounding today.</p>
            </header>

            {/* Daily Insight Section */}
            <DailyInsight />

            {/* Quick Rituals Section */}
            <QuickRituals />

            {/* Today's Journey Section */}
            <TodayJourney />

            {/* Divider */}
            <div className={styles.sectionDivider} />

            {/* 1. Ojas & Prakṛti Tracker */}
            <OjasTracker />

            {/* Divider */}
            <div className={styles.sectionDivider} />

            {/* 2. Five Pillars Grid */}
            <PillarGrid />

            {/* Divider */}
            <div className={styles.sectionDivider} />

            {/* 3. Daily Sadhana "Path of Light" */}
            <SadhanaTimeline />

            {/* Divider */}
            <div className={styles.sectionDivider} />

            {/* 4. Gayatri Mantra */}
            <GayatriMantraSection />

            {/* Floating bottom nav (mobile only) */}
            <VahanaBar />

            {/* Voice Call Modal */}
            <VoiceCallModal
                isOpen={isCallModalOpen}
                onClose={() => setIsCallModalOpen(false)}
            />
        </main>
    );
}
