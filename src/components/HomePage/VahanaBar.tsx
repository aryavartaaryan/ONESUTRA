'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users } from 'lucide-react';
import { motion } from 'framer-motion';

// ── Sacred Atom / PranaVerse Icon ─────────────────────────────────────────
function PranaVerseIcon({ size = 20, active = false, color = '#a78bfa' }: { size?: number; active?: boolean; color?: string }) {
    const col = active ? color : 'rgba(255,255,255,0.28)';
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none"
            style={{ filter: active ? `drop-shadow(0 0 ${size * 0.28}px ${color}cc)` : 'none', transition: 'all 0.28s ease' }}>
            <circle cx="24" cy="24" r="21" stroke={col} strokeWidth="0.65" strokeDasharray="3 2.2" strokeOpacity={active ? 0.55 : 0.28} />
            <circle cx="24" cy="24" r="14.5" stroke={col} strokeWidth="0.95" strokeOpacity={active ? 0.82 : 0.32} />
            <circle cx="24" cy="24" r="5.8" fill={active ? `${color}55` : 'rgba(255,255,255,0.10)'} />
            <circle cx="24" cy="24" r="3.8" fill={active ? `${color}cc` : 'rgba(255,255,255,0.32)'} />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, k) => {
                const rad = deg * Math.PI / 180;
                const x1 = 24 + Math.cos(rad) * 7.5;
                const y1 = 24 + Math.sin(rad) * 7.5;
                const x2 = 24 + Math.cos(rad) * (k % 2 === 0 ? 19 : 13.5);
                const y2 = 24 + Math.sin(rad) * (k % 2 === 0 ? 19 : 13.5);
                return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke={col}
                    strokeWidth={k % 2 === 0 ? '1.3' : '0.75'}
                    strokeOpacity={k % 2 === 0 ? (active ? 1 : 0.42) : (active ? 0.65 : 0.25)}
                    strokeLinecap="round" />;
            })}
            {[0, 90, 180, 270].map((deg, k) => {
                const rad = deg * Math.PI / 180;
                return <circle key={k} cx={24 + Math.cos(rad) * 21.5} cy={24 + Math.sin(rad) * 21.5}
                    r="1.6" fill={col} fillOpacity={active ? 0.92 : 0.35} />;
            })}
            <circle cx="24" cy="24" r="1.5" fill="#fff" fillOpacity={active ? 1 : 0.45} />
        </svg>
    );
}

// ── Gurukul Open Book Icon ─────────────────────────────────────────────────
function GurukulIcon({ size = 19, active = false, color = '#fbbf24' }: { size?: number; active?: boolean; color?: string }) {
    const col = active ? color : 'rgba(255,255,255,0.28)';
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
            style={{ filter: active ? `drop-shadow(0 0 5px ${color}99)` : 'none', transition: 'all 0.25s ease' }}>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke={col} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke={col} strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M9 7h6M9 11h4" stroke={col} strokeWidth="1.55" strokeLinecap="round" />
        </svg>
    );
}

// ── Nav item config ───────────────────────────────────────────────────────
const NAV_ITEMS = [
    { id: 'gurukul',    href: '/vedic-sangrah',   label: 'Gurukul',    color: '#fbbf24' },
    { id: 'home',       href: '/',                 label: 'Home',       color: '#60a5fa' },
    { id: 'pranaverse', href: '/pranaverse',       label: 'PranaVerse', color: '#a78bfa' },
    { id: 'friends',    href: '/pranaverse-chat',  label: 'Friends',    color: '#f472b6' },
] as const;

export default function VahanaBar() {
    const pathname = usePathname();

    return (
        <>
            <style>{`
                @keyframes vahana-line-pulse {
                    0%, 100% { opacity: 0.75; }
                    50% { opacity: 1; }
                }
            `}</style>

            <nav style={{
                position: 'fixed',
                bottom: 0, left: 0, right: 0,
                zIndex: 9000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                padding: '0.50rem 0.2rem calc(0.52rem + env(safe-area-inset-bottom))',
                background: 'rgba(4, 2, 20, 0.97)',
                backdropFilter: 'blur(32px) saturate(200%)',
                WebkitBackdropFilter: 'blur(32px) saturate(200%)',
                borderTop: '1px solid rgba(255,255,255,0.09)',
                borderLeft: 'none', borderRight: 'none', borderBottom: 'none',
                boxShadow: '0 -4px 28px rgba(0,0,0,0.55), 0 -1px 0 rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05)',
                borderRadius: '18px 18px 0 0',
            }}>
                {/* Ambient violet glow */}
                <div aria-hidden style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 22,
                    background: 'radial-gradient(ellipse at 50% 120%, rgba(167,139,250,0.07) 0%, transparent 65%)',
                }} />

                {NAV_ITEMS.map(({ id, href, label, color }) => {
                    const isActive = (id === 'home' && pathname === '/') ||
                        (id !== 'home' && pathname.startsWith(href));

                    return (
                        <Link key={id} href={href} style={{ textDecoration: 'none', flex: 1, display: 'flex', justifyContent: 'center' }}>
                            <motion.div
                                whileTap={{ scale: 0.83 }}
                                transition={{ type: 'spring', stiffness: 440, damping: 26 }}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                                    padding: '0.18rem 0.35rem', position: 'relative', minWidth: 50,
                                }}
                            >
                                {/* Colored top indicator line — PranaVerse style */}
                                {isActive && (
                                    <motion.div
                                        initial={{ scaleX: 0, opacity: 0 }}
                                        animate={{ scaleX: 1, opacity: 1 }}
                                        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                                        style={{
                                            position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)',
                                            width: 28, height: 2.5, borderRadius: 999,
                                            background: `linear-gradient(90deg, ${color}99, ${color}, ${color}99)`,
                                            boxShadow: `0 0 10px ${color}cc, 0 0 22px ${color}55`,
                                            animation: 'vahana-line-pulse 2.4s ease-in-out infinite',
                                        }}
                                    />
                                )}

                                {/* Glassmorphic icon circle */}
                                <motion.div
                                    whileHover={{ scale: 1.09 }}
                                    transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                                    style={{
                                        width: 40, height: 40, borderRadius: '50%', position: 'relative',
                                        background: isActive
                                            ? `radial-gradient(circle at 34% 26%, rgba(255,255,255,0.24) 0%, ${color}2e 44%, ${color}10 100%)`
                                            : 'rgba(255,255,255,0.04)',
                                        border: isActive
                                            ? `1.5px solid ${color}55`
                                            : '1.5px solid rgba(255,255,255,0.07)',
                                        boxShadow: isActive
                                            ? `0 0 20px ${color}44, 0 0 6px ${color}22, inset 0 1px 0 rgba(255,255,255,0.22)`
                                            : 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.26s ease',
                                        overflow: 'hidden',
                                        flexShrink: 0,
                                    }}
                                >
                                    {/* Inner specular highlight */}
                                    {isActive && (
                                        <div style={{
                                            position: 'absolute', top: '7%', left: '11%',
                                            width: '46%', height: '30%',
                                            background: 'radial-gradient(ellipse, rgba(255,255,255,0.32) 0%, transparent 100%)',
                                            borderRadius: '50%', transform: 'rotate(-22deg)', filter: 'blur(1.5px)',
                                            pointerEvents: 'none',
                                        }} />
                                    )}

                                    {id === 'pranaverse' && <PranaVerseIcon size={20} active={isActive} color={color} />}
                                    {id === 'gurukul' && <GurukulIcon size={19} active={isActive} color={color} />}
                                    {id === 'home' && (
                                        <Home size={18} strokeWidth={isActive ? 2.2 : 1.55}
                                            style={{
                                                color: isActive ? color : 'rgba(255,255,255,0.26)',
                                                filter: isActive ? `drop-shadow(0 0 5px ${color}99)` : 'none',
                                                transition: 'all 0.25s ease',
                                            }} />
                                    )}
                                    {id === 'friends' && (
                                        <Users size={18} strokeWidth={isActive ? 2.2 : 1.55}
                                            style={{
                                                color: isActive ? color : 'rgba(255,255,255,0.26)',
                                                filter: isActive ? `drop-shadow(0 0 5px ${color}99)` : 'none',
                                                transition: 'all 0.25s ease',
                                            }} />
                                    )}
                                </motion.div>

                                {/* Label */}
                                <span style={{
                                    fontSize: '0.40rem', fontWeight: 700,
                                    fontFamily: "'Outfit', system-ui, sans-serif",
                                    letterSpacing: '0.10em', textTransform: 'uppercase', lineHeight: 1,
                                    color: isActive ? color : 'rgba(255,255,255,0.22)',
                                    textShadow: isActive ? `0 0 10px ${color}77` : 'none',
                                    transition: 'all 0.25s ease',
                                }}>
                                    {label}
                                </span>
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
