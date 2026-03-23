'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import styles from './AboutModal.module.css';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
    // Close on Escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className={styles.backdrop}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                        onClick={onClose}
                    />

                    {/* Bottom sheet */}
                    <motion.div
                        className={styles.sheet}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                        drag="y"
                        dragConstraints={{ top: 0 }}
                        dragElastic={0.1}
                        onDragEnd={(_, info) => { if (info.offset.y > 120) onClose(); }}
                    >
                        {/* Drag handle */}
                        <div className={styles.handle} />

                        {/* Close button */}
                        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                            <X size={18} />
                        </button>

                        {/* Content */}
                        <div className={styles.content}>
                            {/* OM watermark */}
                            <span className={styles.omWatermark}>ॐ</span>

                            <motion.span
                                className={styles.eyebrow}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15, duration: 0.6, ease: 'easeInOut' }}
                            >
                                हमारे बारे में
                            </motion.span>

                            <motion.h2
                                className={styles.title}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.7, ease: 'easeInOut' }}
                                style={{ fontSize: '1.4rem' }}
                            >
                                भारतीय संस्कृति और वैदिक परंपरा का नवजागरण
                            </motion.h2>

                            <motion.div
                                className={styles.body}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.7, ease: 'easeInOut' }}
                            >
                                <div>
                                    <h3 style={{ fontSize: '1.05rem', color: '#8B6914', marginBottom: '0.3rem', fontFamily: "'Noto Serif Devanagari', serif" }}>प्रस्तावना:</h3>
                                    <p>
                                        नमस्कार! <strong>OneSHUTRA</strong> केवल एक डिजिटल मंच नहीं, बल्कि एक संकल्प है। इस पहल की शुरुआत हम दो साथियों—<strong>आर्यावर्त आर्यन</strong> और <strong>आर्य सुमन्त</strong>—ने एक पवित्र उद्देश्य के साथ की है: अपनी महान भारतीय संस्कृति और वैदिक परंपराओं को आज के आधुनिक युग में पुनर्स्थापित करना।
                                    </p>
                                </div>
                                <div style={{ marginTop: '0.5rem' }}>
                                    <h3 style={{ fontSize: '1.05rem', color: '#8B6914', marginBottom: '0.3rem', fontFamily: "'Noto Serif Devanagari', serif" }}>हमारा दृष्टिकोण:</h3>
                                    <p>
                                        आज के इस तीव्र तकनीकी युग में, हमारा दृढ़ विश्वास है कि समाज की वास्तविक शक्ति हमारी जड़ों में ही निहित है। उन्नत तकनीक के माध्यम से हम वेदों के ज्ञान, संस्कारों और हमारी सनातन धरोहर को एक नए, सुलभ और प्रभावशाली रूप में प्रस्तुत कर रहे हैं। हमारा उद्देश्य इस ऑनलाइन माध्यम से प्राचीन वैदिक ज्ञान को आज की पीढ़ी तक पहुँचाना है, ताकि वे अपनी संस्कृति पर गर्व कर सकें और उसे अपने जीवन में अपना सकें।
                                    </p>
                                </div>
                                <div style={{ marginTop: '0.5rem' }}>
                                    <h3 style={{ fontSize: '1.05rem', color: '#8B6914', marginBottom: '0.3rem', fontFamily: "'Noto Serif Devanagari', serif" }}>आपसे हमारा निवेदन:</h3>
                                    <p>
                                        हमारा यह तकनीकी और सांस्कृतिक प्रयास समाज के बड़ों, दानदाताओं और संस्कृति-प्रेमियों के सहयोग व आशीर्वाद के बिना अधूरा है। हम आपसे विनम्र आग्रह करते हैं कि आप इस सांस्कृतिक महायज्ञ में हमारा साथ दें, हमारा मार्गदर्शन करें और हमारा संबल बनें। आपके बहुमूल्य समर्थन से ही हम अपने इस डिजिटल संकल्प को एक जन-आंदोलन में बदल सकते हैं।
                                    </p>
                                </div>
                                <div className={styles.divider} />
                                <p className={styles.creator} style={{ fontStyle: 'italic', fontWeight: '500', color: '#6B4C2A', marginTop: '0.5rem' }}>
                                    आइए, मिलकर अपनी सांस्कृतिक धरोहर को सहेजें और <strong>'कृण्वन्तो विश्वमार्यम्'</strong> (हम विश्व को श्रेष्ठ बनाएँ) के वैदिक संदेश को सार्थक करें।
                                </p>
                            </motion.div>
                        </div>

                        {/* Footer */}
                        <div className={styles.footer}>
                            Made with Love &amp; Code in India &nbsp;🇮🇳
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
