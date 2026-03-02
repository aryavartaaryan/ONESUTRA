'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageSquare, MessageCircle, UserCircle, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

export default function VahanaBar() {
    const { lang } = useLanguage();
    const pathname = usePathname();

    const NAV = [
        {
            id: 'home', href: '/', Icon: Home,
            label: lang === 'hi' ? 'गृह' : 'Home',
        },
        {
            id: 'pranaverse', href: '/pranaverse', Icon: Globe,
            label: lang === 'hi' ? 'ReZo' : '+VeFeeds',
            accent: true, // glowing accent tab
        },
        {
            id: 'sutra', href: '/sutra', Icon: MessageSquare,
            label: lang === 'hi' ? 'सूत्र' : 'SUTRA',
        },
        {
            id: 'acharya', href: '/acharya-samvad', Icon: MessageCircle,
            label: lang === 'hi' ? 'आचार्य' : 'Acharya',
        },
        {
            id: 'profile', href: '/profile', Icon: UserCircle,
            label: lang === 'hi' ? 'प्रोफ़ाइल' : 'Profile',
        },
    ] as const;

    return (
        <nav style={{
            position: 'fixed', bottom: 12, left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9000,
            // Apple-style floating island
            width: 'min(94vw, 420px)',
            padding: '0.45rem 0.75rem',
            borderRadius: '2rem',
            background: 'rgba(10,10,18,0.68)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        }}>
            {NAV.map(({ id, href, Icon, label, ...rest }) => {
                const isActive = (id === 'home' && pathname === '/') ||
                    (id !== 'home' && pathname.startsWith(href));
                const isAccent = ('accent' in rest) && rest.accent;

                return (
                    <Link
                        key={id}
                        href={href}
                        style={{ textDecoration: 'none', flex: 1 }}
                    >
                        <motion.div
                            whileTap={{ scale: 0.88 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                            style={{
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                gap: 3, paddingBlock: '0.35rem',
                                borderRadius: '1.25rem',
                                position: 'relative',
                            }}
                        >
                            {/* Active pill indicator */}
                            {isActive && (
                                <motion.div
                                    layoutId="vahana-active"
                                    style={{
                                        position: 'absolute', inset: 0,
                                        borderRadius: '1.25rem',
                                        background: 'rgba(255,255,255,0.08)',
                                    }}
                                    transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                                />
                            )}

                            {/* +VeFeeds accent: glowing ring */}
                            {isAccent && (
                                <motion.div
                                    animate={{ boxShadow: ['0 0 0 0 rgba(251,146,60,0)', '0 0 0 5px rgba(251,146,60,0.25)', '0 0 0 0 rgba(251,146,60,0)'] }}
                                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                                    style={{
                                        position: 'absolute',
                                        width: 38, height: 38, borderRadius: '50%',
                                        border: '1.5px solid rgba(251,146,60,0.55)',
                                    }}
                                />
                            )}

                            <Icon
                                size={19}
                                strokeWidth={isActive ? 2.2 : 1.6}
                                style={{
                                    color: isActive
                                        ? 'rgba(255,255,255,0.95)'
                                        : isAccent
                                            ? 'rgba(251,146,60,0.88)'
                                            : 'rgba(255,255,255,0.42)',
                                    transition: 'color 0.25s',
                                    position: 'relative', zIndex: 1,
                                }}
                            />
                            <span style={{
                                fontSize: 9.5,
                                fontWeight: isActive ? 600 : 400,
                                fontFamily: 'system-ui, sans-serif',
                                letterSpacing: isAccent ? '0.04em' : '0.01em',
                                color: isActive
                                    ? 'rgba(255,255,255,0.88)'
                                    : isAccent
                                        ? 'rgba(251,146,60,0.80)'
                                        : 'rgba(255,255,255,0.36)',
                                transition: 'color 0.25s',
                                position: 'relative', zIndex: 1,
                            }}>
                                {label}
                            </span>
                        </motion.div>
                    </Link>
                );
            })}
        </nav>
    );
}
