'use client';

import { useState } from 'react';
import Link from 'next/link';
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

      <PranicPathSection />

      {/* Daily Wisdom Section: Immersive Gayatri Mantra */}
      <div className={styles.fadeSeparator}></div>
      <GayatriMantraSection />

      {/* Voice Call Modal */}
      <VoiceCallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
      />

    </main>
  );
}
