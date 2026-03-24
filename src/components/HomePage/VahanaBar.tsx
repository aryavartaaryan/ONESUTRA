'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, Briefcase, Mic, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

export default function VahanaBar() {
    const { lang } = useLanguage();
    const pathname = usePathname();

    const NAV = [
        {
            id: 'onesutra', href: '/onesutra', Icon: MessageCircle,
            label: lang === 'hi' ? 'सूत्र' : 'Connect',
        },
        {
            id: 'jobs', href: '/jobs-skills', Icon: Briefcase,
            label: lang === 'hi' ? 'कौशल' : 'Skills',
        },
        {
            id: 'home', href: '/', Icon: Home,
            label: lang === 'hi' ? 'होम' : 'Home',
        },
        {
            id: 'acharya', href: '/acharya-samvad', Icon: Mic,
            label: lang === 'hi' ? 'आचार्य' : 'Acharya',
        },
        {
            id: 'profile', href: '/profile', Icon: User,
            label: lang === 'hi' ? 'प्रोफाइल' : 'Profile',
        },
    ] as const;

    return (
        <>
            <style>{`
                @keyframes vahana-home-pulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(251,191,36,0), 0 0 16px rgba(251,191,36,0.35); }
                    50%       { box-shadow: 0 0 0 6px rgba(251,191,36,0.08), 0 0 28px rgba(251,191,36,0.55); }
                }
            `}</style>
            <nav style={{
                position: 'fixed',
                bottom: 10,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9000,
                width: 'min(96vw, 480px)',
                padding: '0.55rem 0.8rem',
                borderRadius: 20,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
                backdropFilter: 'blur(28px) saturate(180%)',
                WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                border: '1px solid rgba(255,255,255,0.11)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
            }}>
                {/* Ambient gradient overlay */}
                <div aria-hidden style={{
                    position: 'absolute', inset: 0, borderRadius: 'inherit',
                    background: 'radial-gradient(100% 80% at 50% 100%, rgba(251,191,36,0.06), transparent 60%)',
                    pointerEvents: 'none',
                }} />

                {NAV.map(({ id, href, Icon, label }) => {
                    const isActive = (id === 'home' && pathname === '/') ||
                        (id !== 'home' && pathname.startsWith(href));
                    const isHome = id === 'home';
                    const isHomeActive = isHome && isActive;

                    return (
                        <Link key={id} href={href} style={{ textDecoration: 'none', flex: 1 }}>
                            <motion.div
                                whileTap={{ scale: 0.82 }}
                                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 3,
                                    padding: '0.3rem 0.1rem',
                                    position: 'relative',
                                }}
                            >
                                {/* Home button — floated circle */}
                                {isHomeActive ? (
                                    <div style={{
                                        width: 48, height: 48,
                                        borderRadius: '50%',
                                        background: 'linear-gradient(145deg, #0f172a, #1e293b)',
                                        border: '1.8px solid rgba(251,191,36,0.75)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        animation: 'vahana-home-pulse 2.5s ease-in-out infinite',
                                        marginTop: '-18px',
                                        position: 'relative', zIndex: 2,
                                    }}>
                                        <Icon size={20} strokeWidth={2}
                                            style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.7))' }} />
                                    </div>
                                ) : (
                                    <div style={{
                                        width: 34, height: 34,
                                        borderRadius: '50%',
                                        background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                                        border: isActive ? '1px solid rgba(255,255,255,0.18)' : '1px solid transparent',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.25s ease',
                                    }}>
                                        <Icon
                                            size={17} strokeWidth={isActive ? 2.1 : 1.6}
                                            style={{
                                                color: isActive ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.38)',
                                                transition: 'all 0.25s ease',
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Active indicator dot for non-home */}
                                {isActive && !isHome && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 1,
                                        width: 3, height: 3,
                                        borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.7)',
                                    }} />
                                )}

                                <span style={{
                                    fontSize: isHomeActive ? 9.5 : 9,
                                    fontWeight: isActive ? 600 : 400,
                                    fontFamily: "'Inter', system-ui, sans-serif",
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                    color: isActive
                                        ? (isHomeActive ? 'rgba(251,191,36,0.9)' : 'rgba(255,255,255,0.88)')
                                        : 'rgba(255,255,255,0.30)',
                                    transition: 'all 0.25s ease',
                                    marginTop: isHomeActive ? 2 : 0,
                                }}>{label}</span>
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
