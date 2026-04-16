'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Briefcase, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

// ── Elegant PranaVerse SVG Icon ─────────────────────────────────
function PranaVerseIcon({ size = 22, active = false }: { size?: number; active?: boolean }) {
    const col = active ? '#a78bfa' : 'rgba(255,255,255,0.55)';
    const glowCol = '#7c3aed';
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none"
            style={{
                filter: active
                    ? `drop-shadow(0 0 ${size * 0.32}px ${glowCol}bb) drop-shadow(0 0 ${size * 0.14}px ${glowCol}66)`
                    : 'none',
                transition: 'all 0.3s ease',
            }}>
            {/* Outer dashed orbit ring */}
            <circle cx="24" cy="24" r="21" stroke={col} strokeWidth="0.65" strokeOpacity={active ? 0.55 : 0.3} strokeDasharray="3 2.2" />
            {/* Mid solid ring */}
            <circle cx="24" cy="24" r="14.5" stroke={col} strokeWidth="0.95" strokeOpacity={active ? 0.8 : 0.4} />
            {/* Inner filled core */}
            <circle cx="24" cy="24" r="5.8" fill={active ? '#a78bfa88' : 'rgba(167,139,250,0.22)'} />
            <circle cx="24" cy="24" r="3.8" fill={active ? '#a78bfacc' : 'rgba(167,139,250,0.5)'} />
            {/* 8 radiating spokes */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, k) => {
                const rad = deg * Math.PI / 180;
                const x1 = 24 + Math.cos(rad) * 7.5;
                const y1 = 24 + Math.sin(rad) * 7.5;
                const x2 = 24 + Math.cos(rad) * (k % 2 === 0 ? 19 : 13.5);
                const y2 = 24 + Math.sin(rad) * (k % 2 === 0 ? 19 : 13.5);
                return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={col} strokeWidth={k % 2 === 0 ? '1.3' : '0.75'}
                    strokeOpacity={k % 2 === 0 ? (active ? 1 : 0.55) : (active ? 0.65 : 0.35)}
                    strokeLinecap="round" />;
            })}
            {/* 4 cardinal star-tip dots */}
            {[0, 90, 180, 270].map((deg, k) => {
                const rad = deg * Math.PI / 180;
                return <circle key={k}
                    cx={24 + Math.cos(rad) * 21.5}
                    cy={24 + Math.sin(rad) * 21.5}
                    r="1.6" fill={col} fillOpacity={active ? 0.9 : 0.45} />;
            })}
            {/* Center star */}
            <circle cx="24" cy="24" r="1.5" fill="#fff" fillOpacity={active ? 0.98 : 0.55} />
        </svg>
    );
}

export default function VahanaBar() {
    const { lang } = useLanguage();
    const pathname = usePathname();

    const NAV = [
        {
            id: 'gurukul', href: '/vedic-sangrah',
            label: 'Gurukul',
            icon: 'briefcase' as const,
        },
        {
            id: 'home', href: '/',
            label: 'Home',
            icon: 'home' as const,
        },
        {
            id: 'pranaverse', href: '/pranaverse',
            label: 'PranaVerse',
            icon: 'pranaverse' as const,
        },
        {
            id: 'friends', href: '/pranaverse-chat',
            label: 'Friends',
            icon: 'friends' as const,
        },
    ] as const;

    return (
        <>
            <style>{`
                @keyframes vahana-prana-pulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(167,139,250,0), 0 0 16px rgba(167,139,250,0.3); }
                    50%       { box-shadow: 0 0 0 6px rgba(167,139,250,0.08), 0 0 28px rgba(167,139,250,0.55); }
                }
                @keyframes vahana-home-pulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(251,191,36,0), 0 0 14px rgba(251,191,36,0.3); }
                    50%       { box-shadow: 0 0 0 5px rgba(251,191,36,0.07), 0 0 22px rgba(251,191,36,0.5); }
                }
            `}</style>
            <nav style={{
                position: 'fixed',
                bottom: 12, left: 12, right: 12,
                zIndex: 9000,
                padding: '0.55rem 0.6rem calc(0.55rem + env(safe-area-inset-bottom))',
                background: 'rgba(18, 16, 28, 0.45)',
                backdropFilter: 'blur(22px) saturate(150%)',
                WebkitBackdropFilter: 'blur(22px) saturate(150%)',
                border: '1px solid rgba(167, 139, 250, 0.20)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                borderRadius: 24,
            }}>
                {/* Subtle violet ambient glow */}
                <div aria-hidden style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 24,
                    background: 'radial-gradient(ellipse at 75% 100%, rgba(167, 139, 250, 0.10) 0%, transparent 60%)',
                }} />

                {NAV.map(({ id, href, label, icon }) => {
                    const isActive = (id === 'home' && pathname === '/') ||
                        (id !== 'home' && pathname.startsWith(href));
                    const isPrana = id === 'pranaverse';
                    const isHome = id === 'home';
                    const isElevated = (isPrana && isActive) || (isHome && isActive && !pathname.startsWith('/pranaverse'));

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
                                {/* PranaVerse — elevated floated circle */}
                                {isPrana && isActive ? (
                                    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        {/* Faint gold top line above the active icon */}
                                        <div style={{
                                            position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                                            width: 32, height: 2,
                                            background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.72) 30%, rgba(251,191,36,0.85) 50%, rgba(251,191,36,0.72) 70%, transparent)',
                                            borderRadius: 99,
                                        }} />
                                        <div style={{
                                            width: 50, height: 50,
                                            borderRadius: '50%',
                                            background: 'linear-gradient(145deg, #0f0a1e, #1a0f2e)',
                                            border: '1.8px solid rgba(167,139,250,0.78)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            animation: 'vahana-prana-pulse 2.8s ease-in-out infinite',
                                            marginTop: '-20px',
                                            position: 'relative', zIndex: 2,
                                        }}>
                                            <PranaVerseIcon size={22} active />
                                        </div>
                                    </div>
                                ) : isHome && isActive ? (
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
                                        <Home size={20} strokeWidth={2}
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
                                        {icon === 'pranaverse' ? (
                                            <PranaVerseIcon size={18} active={isActive} />
                                        ) : icon === 'home' ? (
                                            <Home size={17} strokeWidth={isActive ? 2.1 : 1.6}
                                                style={{ color: isActive ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.38)', transition: 'all 0.25s ease' }} />
                                        ) : icon === 'briefcase' ? (
                                            <Briefcase size={17} strokeWidth={isActive ? 2.1 : 1.6}
                                                style={{ color: isActive ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.38)', transition: 'all 0.25s ease' }} />
                                        ) : icon === 'friends' ? (
                                            <Users size={17} strokeWidth={isActive ? 2.1 : 1.6}
                                                style={{ color: isActive ? '#f472b6' : 'rgba(255,255,255,0.38)', transition: 'all 0.25s ease' }} />
                                        ) : (
                                            <Home size={17} strokeWidth={isActive ? 2.1 : 1.6}
                                                style={{ color: isActive ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.38)', transition: 'all 0.25s ease' }} />
                                        )}
                                    </div>
                                )}

                                {/* Active indicator dot for non-elevated items */}
                                {isActive && !isPrana && !isHome && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 1,
                                        width: 3, height: 3,
                                        borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.7)',
                                    }} />
                                )}

                                <span style={{
                                    fontSize: (isPrana && isActive) || (isHome && isActive) ? 9.5 : 9,
                                    fontWeight: isActive ? 600 : 400,
                                    fontFamily: "'Inter', system-ui, sans-serif",
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                    color: isActive
                                        ? (isPrana && isActive ? 'rgba(167,139,250,0.95)' : isHome && isActive ? 'rgba(251,191,36,0.9)' : 'rgba(255,255,255,0.88)')
                                        : 'rgba(255,255,255,0.30)',
                                    transition: 'all 0.25s ease',
                                    marginTop: isActive && (isPrana || isHome) ? 2 : 0,
                                }}>{label}</span>
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
