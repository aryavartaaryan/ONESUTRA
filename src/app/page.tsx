'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import GayatriMantraSection from '@/components/GayatriMantraSection/GayatriMantraSection';
import PranicPathSection from '@/components/PranicPathSection/PranicPathSection';
import VoiceCallModal from '@/components/VoiceCallModal';
import styles from './page.module.css';

export default function Home() {
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  const handleTalkToUs = () => {
    setIsCallModalOpen(true);
  };

  return (
    <main className={styles.main}>
      <div className={styles.mandalaBg}></div>

      {/* Immersive Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Vedic Vibes</h1>
          <p className={styles.heroSubtitle}>Unlock the Ancient Wisdom for Modern Harmony & Inner Peace</p>
          <div className={styles.ctaGroup}>
            <Link href="/dhyan-kshetra" className="btn-primary">
              <Sparkles size={20} />
              Enter Divine Zone
            </Link>
            <button onClick={handleTalkToUs} className="btn-secondary">
              Talk to Acharya
            </button>
          </div>
        </div>
      </section>

      <div className={styles.fadeSeparator}></div>

      <PranicPathSection />

      {/* Daily Wisdom Section: Immersive Gayatri Mantra */}
      <div className={styles.fadeSeparator} style={{ transform: 'rotate(180deg)' }}></div>
      <GayatriMantraSection />

      {/* Voice Call Modal */}
      <VoiceCallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
      />

    </main>
  );
}
