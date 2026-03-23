'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Plug, Flower2, Aperture, MessageCircle } from 'lucide-react';

type GlowTheme = 'gold' | 'blue' | 'green' | 'violet';

const glowStyles = {
    gold: {
        bg: 'linear-gradient(145deg, rgba(255, 214, 130, 0.22), rgba(255, 140, 66, 0.15))',
        border: 'rgba(255, 204, 112, 0.5)',
        text: 'rgba(255, 236, 186, 0.98)',
        shadow: '0 10px 24px rgba(245, 158, 11, 0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
    },
    blue: {
        bg: 'linear-gradient(145deg, rgba(130, 214, 255, 0.22), rgba(66, 140, 255, 0.15))',
        border: 'rgba(112, 204, 255, 0.5)',
        text: 'rgba(186, 236, 255, 0.98)',
        shadow: '0 10px 24px rgba(11, 158, 245, 0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
    },
    green: {
        bg: 'linear-gradient(145deg, rgba(130, 255, 150, 0.22), rgba(66, 255, 100, 0.15))',
        border: 'rgba(112, 255, 150, 0.5)',
        text: 'rgba(186, 255, 200, 0.98)',
        shadow: '0 10px 24px rgba(11, 245, 100, 0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
    },
    violet: {
        bg: 'linear-gradient(145deg, rgba(180, 130, 255, 0.22), rgba(120, 66, 255, 0.15))',
        border: 'rgba(180, 112, 255, 0.5)',
        text: 'rgba(230, 186, 255, 0.98)',
        shadow: '0 10px 24px rgba(140, 11, 245, 0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
    }
};

// ── Single nav link: icon + label with specific theme hover glow ────────────────────────
function NavLink({ href, icon, label, badge, className, theme = 'gold' }: { href: string; icon: React.ReactNode; label: string; badge?: number; className?: string; theme?: GlowTheme }) {
    const [hovered, setHovered] = useState(false);
    const activeStyles = glowStyles[theme];

    return (
        <Link
            href={href}
            className={className ? `${className} nav-item` : "nav-item"}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '0 0.36rem', position: 'relative' }}
        >
            <span style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
                background: hovered ? activeStyles.bg : 'rgba(255,255,255,0.045)',
                border: hovered ? `1px solid ${activeStyles.border}` : '1px solid rgba(255,255,255,0.1)',
                color: hovered ? activeStyles.text : 'rgba(255,255,255,0.66)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                boxShadow: hovered ? activeStyles.shadow : 'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 6px rgba(0,0,0,0.2)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: hovered ? 'scale(1.05)' : 'scale(1)',
            }}>
                {icon}
                {/* Unread badge */}
                <AnimatePresence>
                    {badge != null && badge > 0 && (
                        <motion.div
                            key="badge"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            style={{
                                position: 'absolute',
                                top: -5, right: -5,
                                minWidth: 16, height: 16,
                                borderRadius: 999,
                                background: '#25D366',
                                border: '1.5px solid rgba(6,4,18,0.9)',
                                boxShadow: '0 0 8px rgba(37,211,102,0.7)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.52rem', fontWeight: 800, color: '#fff',
                                padding: '0 3px',
                                letterSpacing: '-0.01em',
                                fontFamily: 'system-ui, sans-serif',
                            }}
                        >
                            {badge > 99 ? '99+' : badge}
                        </motion.div>
                    )}
                </AnimatePresence>
            </span>
            <span style={{
                fontSize: 8.5, letterSpacing: '0.09em', textTransform: 'uppercase',
                fontFamily: 'system-ui, sans-serif',
                color: hovered ? 'rgba(255, 220, 153, 0.92)' : 'rgba(255,255,255,0.46)',
                fontWeight: hovered ? 600 : 500,
                transition: 'color 0.22s, transform 0.22s', whiteSpace: 'nowrap',
                transform: hovered ? 'translateY(-1px)' : 'translateY(0px)',
            }}>{label}</span>
        </Link>
    );
}

interface StickyTopNavProps {
    totalUnread?: number;
}

export default function StickyTopNav({ totalUnread = 0 }: StickyTopNavProps) {
    return (
        <header className="mobile-header" style={{
            position: 'fixed',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            width: 'min(98vw, 1040px)',
            padding: '0.62rem 0.9rem',
            background: 'linear-gradient(120deg, rgba(9, 15, 24, 0.56), rgba(14, 22, 36, 0.38))',
            backdropFilter: 'blur(22px) saturate(145%)',
            WebkitBackdropFilter: 'blur(22px) saturate(145%)',
            border: '1px solid rgba(255,255,255,0.16)',
            borderRadius: 18,
            animation: 'header-glow-pulse 3s infinite ease-in-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.2rem',
        }}>
            <style>{`
                @media (max-width: 768px) {
                    .desktop-only-link {
                        display: none !important;
                    }
                    .mobile-header {
                        padding: 0.4rem 0.2rem !important;
                        width: 100vw !important;
                        border-radius: 12px !important;
                        top: 5px !important;
                    }
                    .mobile-nav-container {
                        gap: 0 !important;
                    }
                    .nav-item {
                        padding: 0 0.15rem !important;
                    }
                    .brand-text {
                        font-size: 1.15rem !important;
                        letter-spacing: 0.02em !important;
                    }
                    .brand-logo-container {
                        width: 34px !important;
                        height: 34px !important;
                    }
                }
                @media (max-width: 380px) {
                    .nav-item {
                        padding: 0 0.05rem !important;
                    }
                    .nav-item span:last-child {
                        font-size: 7.5px !important;
                    }
                }
            `}</style>
            <div
                aria-hidden
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(120% 80% at 0% 0%, rgba(251, 191, 36, 0.16), transparent 48%), radial-gradient(120% 80% at 100% 100%, rgba(56, 189, 248, 0.12), transparent 56%)',
                    pointerEvents: 'none',
                }}
            />
            {/* Wordmark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, position: 'relative', zIndex: 1 }}>
                <span
                    className="brand-logo-container"
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        border: '1.5px solid rgba(255, 214, 130, 0.65)',
                        background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.4), rgba(255,206,107,0.15))',
                        boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4), inset 0 2px 6px rgba(255,255,255,0.6), inset 0 -4px 8px rgba(0,0,0,0.5)',
                        zIndex: 2,
                    }}
                >
                    <img
                        src="/images/pranav.png"
                        alt="Pranav"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </span>
                <span className="brand-text" style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    background: 'linear-gradient(135deg, #ffffff 0%, #ffe9a6 40%, #ffc640 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                    filter: 'drop-shadow(0px 8px 12px rgba(0,0,0,0.8)) drop-shadow(0px 4px 20px rgba(245, 158, 11, 0.5)) drop-shadow(0px 2px 4px rgba(255, 214, 130, 0.6))',
                    marginLeft: '6px',
                    zIndex: 1,
                }}>OneSUTRA</span>
            </div>

            {/* Nav links */}
            <div className="mobile-nav-container" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', position: 'relative', zIndex: 1, flexWrap: 'nowrap' }}>
                <NavLink href="/profile" theme="gold" icon={<User size={14} strokeWidth={1.8} />} label="Profile" />
                <NavLink href="/outplugs" theme="blue" icon={<Plug size={14} strokeWidth={1.8} />} label="outPLUGS" />
                <NavLink href="/dhyan-kshetra" theme="green" icon={<Flower2 size={14} strokeWidth={1.8} />} label="Meditate" />
                <NavLink href="/onesutra" theme="gold" icon={<MessageCircle size={14} strokeWidth={1.8} />} label="Messages" badge={totalUnread} className="desktop-only-link" />
                <NavLink href="/project-leela" theme="violet" icon={<Aperture size={14} strokeWidth={1.8} />} label="Leela" />
            </div>
        </header>
    );
}
