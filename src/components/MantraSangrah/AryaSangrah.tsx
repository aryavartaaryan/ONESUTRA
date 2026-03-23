'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Search, Filter, Feather, ArrowLeft, Sun, Flame, MapPin, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { VEDIC_MANTRAS, Mantra } from './mantraData';
import styles from './MantraSangrah.module.css';

export default function AryaSangrah() {
  const [showMantras, setShowMantras] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedMantra, setSelectedMantra] = useState<Mantra | null>(null);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(VEDIC_MANTRAS.map((m) => m.category)));
    return ['All', ...cats];
  }, []);

  const filteredMantras = useMemo(() => {
    return VEDIC_MANTRAS.filter((mantra) => {
      const matchSearch =
        mantra.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mantra.text.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory =
        activeCategory === 'All' || mantra.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [searchQuery, activeCategory]);

  if (!showMantras) {
    return (
      <div className={styles.sangrahContainer}>
        <div className={styles.landingWrapper}>
          <Link href="/guru-gurukul" className={styles.backButton} style={{position: 'absolute', top: '0', left: '0'}}>
            <ArrowLeft size={24} />
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <BookOpen size={64} color="#ff9a44" style={{ marginBottom: '1rem' }} />
            <h1 className={styles.landingTitle}>वैदिक संग्रह</h1>
            <p className={styles.landingSubtitle}>पवित्र वैदिक मन्त्रों एवं विधियों का संग्रह</p>
            
            <div className={styles.landingGrid}>
              <Link href="/laghu-sandhya" style={{ textDecoration: 'none' }} className={styles.premiumCard}>
                  <Sparkles size={36} className={styles.premiumCardIcon} />
                  <h3 className={styles.premiumCardTitle}>लघु वैदिक संध्या</h3>
                  <p className={styles.premiumCardDesc}>(Voice Guru AI) आचार्य प्रणव के साथ लाइव संध्या वंदन</p>
              </Link>
              <div onClick={() => setShowMantras(true)} className={styles.premiumCard}>
                  <Flame size={36} className={styles.premiumCardIcon} />
                  <h3 className={styles.premiumCardTitle}>वैदिक संध्या एवं अग्निहोत्र</h3>
                  <p className={styles.premiumCardDesc}>स्वयं संध्या और अग्निहोत्र करने के लिए मंत्र एवं विधियाँ</p>
              </div>
              <Link href="/jyotirlinga" style={{ textDecoration: 'none' }} className={styles.premiumCard}>
                  <Sun size={36} className={styles.premiumCardIcon} />
                  <h3 className={styles.premiumCardTitle}>१२ ज्योतिर्लिंग</h3>
                  <p className={styles.premiumCardDesc}>भगवान शिव के 12 ज्योतिर्लिंगों के दर्शन एवं महिमा</p>
              </Link>
              <Link href="/ancient-temples" style={{ textDecoration: 'none' }} className={styles.premiumCard}>
                  <MapPin size={36} className={styles.premiumCardIcon} />
                  <h3 className={styles.premiumCardTitle}>प्राचीन हिन्दू मंदिर</h3>
                  <p className={styles.premiumCardDesc}>भारत के भव्य और प्राचीन मंदिरों की जानकारी</p>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sangrahContainer}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <button onClick={() => setShowMantras(false)} className={styles.backButton}>
            <ArrowLeft size={24} />
          </button>
          <h1 className={styles.title}>
            <BookOpen className={styles.titleIcon} size={32} />
            वैदिक संध्या एवं अग्निहोत्र मन्त्र
          </h1>
          <div className={styles.placeholder}></div>
        </div>
      </header>

      <main className={styles.fullMantraContainer}>
        {categories.filter(c => c !== 'All').map(category => {
          const catMantras = VEDIC_MANTRAS.filter(m => m.category === category);
          if (catMantras.length === 0) return null;
          
          return (
            <div key={category} className={styles.categorySection}>
              <h2 className={styles.categoryHeading}>
                <Feather size={24} className={styles.categoryIcon} />
                {category}
              </h2>
              
              <div className={styles.mantraList}>
                {catMantras.map(mantra => (
                  <div key={mantra.id} className={styles.fullMantraCard}>
                    <h3 className={styles.mantraTitle}>{mantra.title}</h3>
                    <div className={styles.mantraText}>
                      {mantra.text.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                    {mantra.meaning && (
                      <div className={styles.mantraMeaning}>
                        <h4>अर्थ (Meaning):</h4>
                        <p>{mantra.meaning}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
