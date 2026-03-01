'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageSquare, MessageCircle, UserCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './VahanaBar.module.css';

export default function VahanaBar() {
    const { lang } = useLanguage();
    const pathname = usePathname();

    const NAV = [
        { id: 'home', href: '/', Icon: Home, label: lang === 'hi' ? 'गृह' : 'Home' },
        { id: 'sutra', href: '/sutra', Icon: MessageSquare, label: lang === 'hi' ? 'सूत्र' : 'SUTRA' },
        { id: 'acharya', href: '/acharya-samvad', Icon: MessageCircle, label: lang === 'hi' ? 'आचार्य' : 'Acharya' },
        { id: 'profile', href: '/profile', Icon: UserCircle, label: lang === 'hi' ? 'प्रोफ़ाइल' : 'Profile' },
    ];

    return (
        <nav className={styles.vahanaBar}>
            {NAV.map(({ id, href, Icon, label }) => {
                const isActive = (id === 'home' && pathname === '/') || (href && pathname === href && id !== 'home');
                const cls = `${styles.navItem} ${isActive ? styles.navItemActive : ''}`;

                return (
                    <Link key={id} href={href} className={cls}>
                        <Icon size={19} strokeWidth={1.7} />
                        <span className={styles.navLabel}>{label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
