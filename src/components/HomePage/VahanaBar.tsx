'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, MessageCircle, UserCircle, X, Zap } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './VahanaBar.module.css';

export default function VahanaBar() {
    const { lang } = useLanguage();
    const pathname = usePathname();
    const [explorerOpen, setExplorerOpen] = useState(false);

    const toggleExplorer = useCallback(() => setExplorerOpen(p => !p), []);
    const closeExplorer = useCallback(() => setExplorerOpen(false), []);

    const NAV = [
        { id: 'home', href: '/', Icon: Home, label: lang === 'hi' ? 'गृह' : 'Home', type: 'link' as const },
        { id: 'pranaverse', href: '/pranaverse', Icon: Zap, label: lang === 'hi' ? 'प्राणवर्स' : 'PranaVerse', type: 'link' as const },
        { id: 'ask-guru', href: '/acharya-samvad', Icon: MessageCircle, label: lang === 'hi' ? 'आचार्य प्रणव' : 'Ask Acharya\nPranav', type: 'link' as const },
        { id: 'profile', href: '/profile', Icon: UserCircle, label: lang === 'hi' ? 'प्रोफ़ाइल' : 'Profile', type: 'link' as const },
    ];

    const handleClick = (id: string) => {
        if (id === 'explore') toggleExplorer();
    };

    return (
        <>
            {explorerOpen && <div className={styles.explorerOverlay} onClick={closeExplorer} />}

            {/* Explorer panel */}
            <div className={`${styles.explorerPanel} ${explorerOpen ? styles.explorerPanelOpen : ''}`}>
                <div className={styles.explorerHeader}>
                    <span className={styles.explorerTitle}>🧭 {lang === 'hi' ? 'अन्वेषण' : 'Explore'}</span>
                    <button className={styles.explorerClose} onClick={closeExplorer}><X size={18} /></button>
                </div>
                <div className={styles.explorerEmpty}>
                    <span className={styles.explorerEmptyIcon}>🏠</span>
                    <p className={styles.explorerEmptyText}>
                        {lang === 'hi' ? 'सभी सुविधाएँ मुख्य पृष्ठ पर उपलब्ध हैं।' : 'All features are on the Home page.'}
                    </p>
                    <Link href="/" className={styles.explorerHomeLink} onClick={closeExplorer}>
                        {lang === 'hi' ? 'मुख्य पृष्ठ पर जाएं →' : 'Go to Home →'}
                    </Link>
                </div>
            </div>

            {/* ── Floating dock ── */}
            <nav className={styles.vahanaBar}>
                {NAV.map(({ id, href, Icon, label, type }) => {
                    const isActive = (id === 'home' && pathname === '/')
                        || (id === 'explore' && explorerOpen)
                        || (href && pathname === href && id !== 'home');
                    const cls = `${styles.navItem} ${isActive ? styles.navItemActive : ''}`;

                    return type === 'link' && href ? (
                        <Link key={id} href={href} className={cls}>
                            <Icon size={19} strokeWidth={1.7} />
                            <span className={styles.navLabel} style={label.includes('\n') ? { lineHeight: 1.1 } : {}}>
                                {label.includes('\n')
                                    ? label.split('\n').map((l, i) => <span key={i} style={{ display: 'block', fontSize: i === 1 ? '0.55rem' : undefined }}>{l}</span>)
                                    : label}
                            </span>
                        </Link>
                    ) : (
                        <button key={id} className={cls} onClick={() => handleClick(id)}>
                            <Icon size={19} strokeWidth={1.7} />
                            <span className={styles.navLabel}>{label}</span>
                        </button>
                    );
                })}
            </nav>
        </>
    );
}
