'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Radio, Flame, Globe, MessageCircle } from 'lucide-react';

// ── Single nav link: icon + label with gold hover glow ────────────────────────
function NavLink({ href, icon, label, badge }: { href: string; icon: React.ReactNode; label: string; badge?: number }) {
    const [hovered, setHovered] = useState(false);
    return (
        <Link
            href={href}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '0 0.36rem', position: 'relative' }}
        >
            <span style={{
                width: 31, height: 31, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
                background: hovered ? 'linear-gradient(145deg, rgba(255, 214, 130, 0.2), rgba(255, 140, 66, 0.12))' : 'rgba(255,255,255,0.045)',
                border: hovered ? '1px solid rgba(255, 204, 112, 0.45)' : '1px solid rgba(255,255,255,0.1)',
                color: hovered ? 'rgba(255,236,186,0.98)' : 'rgba(255,255,255,0.66)',
                boxShadow: hovered ? '0 10px 24px rgba(245, 158, 11, 0.28), inset 0 1px 0 rgba(255,255,255,0.22)' : 'inset 0 1px 0 rgba(255,255,255,0.08)',
                transition: 'all 0.25s ease',
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
        <header style={{
            position: 'fixed',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            width: 'min(96vw, 1040px)',
            padding: '0.62rem 0.9rem',
            background: 'linear-gradient(120deg, rgba(9, 15, 24, 0.56), rgba(14, 22, 36, 0.38))',
            backdropFilter: 'blur(22px) saturate(145%)',
            WebkitBackdropFilter: 'blur(22px) saturate(145%)',
            border: '1px solid rgba(255,255,255,0.16)',
            borderRadius: 18,
            boxShadow: '0 14px 44px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            overflow: 'hidden',
        }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, position: 'relative', zIndex: 1 }}>
                <span style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.94)',
                    textShadow: '0 2px 12px rgba(0,0,0,0.32)',
                }}>OneSUTRA</span>
                <span style={{
                    fontSize: '0.45rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'rgba(255, 228, 163, 0.72)',
                    fontFamily: 'monospace',
                    padding: '0.16rem 0.36rem',
                    borderRadius: 999,
                    border: '1px solid rgba(255, 214, 130, 0.34)',
                    background: 'rgba(255, 206, 107, 0.1)',
                }}>Pranav.AI</span>
            </div>

            {/* Nav links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', position: 'relative', zIndex: 1 }}>
                <NavLink href="/profile" icon={<User size={12} strokeWidth={1.7} />} label="Profile" />
                <NavLink href="/outplugs" icon={<Radio size={12} strokeWidth={1.7} />} label="outPLUGS" />
                <NavLink href="/dhyan-kshetra" icon={<Flame size={12} strokeWidth={1.7} />} label="Meditate" />
                <NavLink href="/onesutra" icon={<MessageCircle size={12} strokeWidth={1.7} />} label="Messages" badge={totalUnread} />
                <NavLink href="/project-leela" icon={<Globe size={12} strokeWidth={1.7} />} label="Leela" />
            </div>
        </header>
    );
}
