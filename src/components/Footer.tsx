'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Sparkles, Heart } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
    const { lang } = useLanguage();
    const [userName, setUserName] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('vedic_user_name');
        if (stored) setUserName(stored);
    }, []);

    const t = {
        hi: {
            greeting: "नमस्ते,",
            prakrti: "आपकी प्रकृति",
            dosha: "वात-पित्त",
            brand: "आर्टिफिशियल इंटेलिजेंस और ऋषियों के महान ज्ञान का संगम",
            translation: "सभी सुखी रहें, सभी रोग मुक्त रहें।",
            copyright: "Crafted with devotion by",
        },
        en: {
            greeting: "Namaste,",
            prakrti: "Your Prakṛti",
            dosha: "Vata-Pitta",
            brand: "A Fusion of Artificial Intelligence and the Wisdom of Rishis",
            translation: "May all beings be happy, may all be free from disease.",
            copyright: "Crafted with devotion by",
        }
    }[lang] || {
        greeting: "Namaste,",
        prakrti: "Your Prakṛti",
        dosha: "Vata-Pitta",
        brand: "A Fusion of Artificial Intelligence and the Wisdom of Rishis",
        translation: "May all beings be happy, may all be free from disease.",
        copyright: "Crafted with devotion by",
    };

    return (
        <footer className={styles.footer}>
            <div className={styles.sacredDivider} />

            <div className={styles.container}>
                {/* 1. User Identity Card */}
                <div className={styles.identityCard}>
                    <div className={styles.userGreeting}>
                        <span className={styles.namaste}>{t.greeting}</span>
                        <span className={styles.userName}>{userName || (lang === 'hi' ? 'यात्री' : 'Traveller')}</span>
                    </div>

                    <div className={styles.prakrtiBadge}>
                        <div className={styles.badgeLabel}>
                            <Sparkles size={14} className={styles.sparkle} />
                            {t.prakrti}
                        </div>
                        <div className={styles.doshaName}>{t.dosha}</div>
                    </div>
                </div>

                {/* 2. Brand Vision */}
                <div className={styles.visionSection}>
                    <h2 className={styles.brandText}>
                        {t.brand}
                    </h2>
                </div>

                {/* 3. Eternal Mantra */}
                <div className={styles.mantraSection}>
                    <p className={styles.sanskritMantra}>
                        &ldquo;ॐ सह नाववतु। सह नौ भुनक्तु। सह वीर्यं करवावहै। तेजस्वि नावधीतमस्तु मा विद्विषावहै॥ ॐ शान्तिः शान्तिः शान्तिः॥&rdquo;
                    </p>
                    <p className={styles.mantraTranslation}>
                        {t.translation}
                    </p>
                </div>

                {/* 4. Bottom Credits */}
                <div className={styles.credits}>
                    <div className={styles.copyrightText}>
                        {t.copyright} <span className={styles.pranavBrand}>Pranav.AI</span>
                    </div>
                    <div className={styles.madeWith}>
                        <Heart size={14} className={styles.heartIcon} />
                        <span>Research & Development</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
