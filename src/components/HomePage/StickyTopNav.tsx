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
            style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '0 0.35rem', position: 'relative' }}
        >
            <span style={{
                width: 30, height: 30, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
                background: hovered ? 'rgba(212,175,55,0.14)' : 'rgba(255,255,255,0.05)',
                border: hovered ? '1px solid rgba(212,175,55,0.32)' : '1px solid rgba(255,255,255,0.07)',
                color: hovered ? 'rgba(212,175,55,0.95)' : 'rgba(255,255,255,0.58)',
                filter: hovered ? 'drop-shadow(0 0 7px rgba(212,175,55,0.45))' : 'none',
                transition: 'all 0.22s ease',
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
                fontSize: 8.5, letterSpacing: '0.08em', textTransform: 'uppercase',
                fontFamily: 'system-ui, sans-serif',
                color: hovered ? 'rgba(212,175,55,0.80)' : 'rgba(255,255,255,0.32)',
                transition: 'color 0.22s', whiteSpace: 'nowrap',
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
            // ── STRICTLY FIXED — never scrolls away ──────────────────────────
            position: 'fixed', top: 0, left: 0, right: 0,
            zIndex: 1000,
            padding: '0.5rem 1rem',
            background: 'rgba(6,4,18,0.60)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
        }}>
            {/* Wordmark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <span style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '1rem', fontWeight: 700, color: 'rgba(255,255,255,0.90)',
                }}>OneSUTRA</span>
                <span style={{
                    fontSize: '0.44rem', letterSpacing: '0.2em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.28)', fontFamily: 'monospace',
                }}>Pranav.AI</span>
            </div>

            {/* Nav links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <NavLink href="/profile" icon={<User size={12} strokeWidth={1.7} />} label="Profile" />
                <NavLink href="/outplugs" icon={<Radio size={12} strokeWidth={1.7} />} label="outPLUGS" />
                <NavLink href="/dhyan-kshetra" icon={<Flame size={12} strokeWidth={1.7} />} label="Meditate" />
                <NavLink href="/onesutra" icon={<MessageCircle size={12} strokeWidth={1.7} />} label="Messages" badge={totalUnread} />
                <NavLink href="/project-leela" icon={<Globe size={12} strokeWidth={1.7} />} label="Leela" />
            </div>
        </header>
    );
}
