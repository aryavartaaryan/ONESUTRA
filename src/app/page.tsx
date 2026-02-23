'use client';

import { useState } from 'react';
// Navbar removed — bottom VahanaBar handles navigation
import HeroSection from '@/components/HomePage/HeroSection';
import AuthModal from '@/components/HomePage/AuthModal';
import homeStyles from './vedic-home.module.css';
import styles from './page.module.css';

export default function Home() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <main className={`${homeStyles.sacredPage} ${styles.main}`}>

      {/* Full-screen splash — the only thing on the landing page */}
      <HeroSection onOpenAuth={() => setIsAuthOpen(true)} />

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </main>
  );
}
