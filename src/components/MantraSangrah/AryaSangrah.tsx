'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Search, Filter, Feather, ArrowLeft } from 'lucide-react';
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
            <h1 className={styles.landingTitle}>आर्य संग्रह</h1>
            <p className={styles.landingSubtitle}>पवित्र वैदिक मन्त्रों एवं विधियों का संग्रह</p>
            
            <div className={styles.actionGrid}>
              <Link href="/laghu-sandhya" style={{ textDecoration: 'none' }}>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={styles.secondaryActionBtn}
                >
                  <BookOpen size={28} />
                  लघु वैदिक संध्या (Voice Guru)
                </motion.button>
              </Link>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={styles.primaryActionBtn}
                onClick={() => setShowMantras(true)}
              >
                <BookOpen size={28} />
                वैदिक संध्या एवं अग्निहोत्र 
              </motion.button>
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
            आर्य संग्रह
          </h1>
          <div className={styles.placeholder}></div>
        </div>
        <p className={styles.subtitle}>वैदिक संध्या एवं अग्निहोत्र मन्त्र</p>

        <div className={styles.controls}>
          <div className={styles.searchBar}>
            <Search size={20} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="खोजें (Search mantras)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.categoryTabs}>
            <Filter size={18} className={styles.filterIcon} />
            {categories.map((cat) => (
              <button
                key={cat}
                className={`${styles.tabBtn} ${
                  activeCategory === cat ? styles.activeTab : ''
                }`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className={styles.gridContainer}>
        <AnimatePresence mode="popLayout">
          {filteredMantras.map((mantra) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={mantra.id}
              className={styles.mantraCard}
              onClick={() => setSelectedMantra(mantra)}
            >
              <div className={styles.cardHeader}>
                <span className={styles.categoryTag}>{mantra.category}</span>
                <Feather size={16} className={styles.quillIcon} />
              </div>
              <h3 className={styles.cardTitle}>{mantra.title}</h3>
              <p className={styles.cardPreview}>
                {mantra.text.substring(0, 60)}...
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredMantras.length === 0 && (
          <div className={styles.noResults}>
            <p>कोई मन्त्र नहीं मिला (No mantras found)</p>
          </div>
        )}
      </main>

      {/* Modal View for Full Mantra */}
      <AnimatePresence>
        {selectedMantra && (
          <div className={styles.modalOverlay} onClick={() => setSelectedMantra(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles.closeButton}
                onClick={() => setSelectedMantra(null)}
              >
                ×
              </button>
              
              <div className={styles.modalHeader}>
                <span className={styles.modalCategory}>{selectedMantra.category}</span>
                <h2 className={styles.modalTitle}>{selectedMantra.title}</h2>
              </div>
              
              <div className={styles.modalBody}>
                <div className={styles.sanskritText}>
                  {selectedMantra.text.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
                
                {selectedMantra.meaning && (
                  <div className={styles.meaningSection}>
                    <h4>अर्थ (Meaning)</h4>
                    <p>{selectedMantra.meaning}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
