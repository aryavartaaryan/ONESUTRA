'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, MessageCircle, Zap, Home } from 'lucide-react';
import { Tab } from './ResonanceTypes';

export default function ResonanceNavBar({ activeTab, setActiveTab, badgeCount = 0 }: {
    activeTab: Tab;
    setActiveTab: (t: Tab) => void;
    badgeCount?: number;
}) {
    const navItems = [
        { id: 'home' as Tab, icon: Home, label: 'Home', color: '#f472b6' },
        { id: 'map' as Tab, icon: MapPin, label: 'Map', color: '#fbbf24' },
        { id: 'chat' as Tab, icon: MessageCircle, label: 'Chat', color: '#4ade80', badge: badgeCount },
        { id: 'story' as Tab, icon: Zap, label: 'Energy Feeds', color: '#a78bfa' },
    ];

    return (
        <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(5,8,16,0.95)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderTop: '1px solid rgba(139,92,246,0.15)', display: 'flex', paddingBottom: 'env(safe-area-inset-bottom,0px)' }}>
            {navItems.map(({ id, icon: Icon, label, color, badge }) => {
                const active = activeTab === id;
                return (
                    <motion.button key={id} whileTap={{ scale: 0.9 }} onClick={() => setActiveTab(id)}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '0.75rem 0', background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
                        {active && <motion.div layoutId="nav-pill" style={{ position: 'absolute', inset: '4px 10px', borderRadius: 12, background: `${color}10`, border: `1px solid ${color}22` }} transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <Icon size={21} style={{ color: active ? color : 'rgba(255,255,255,0.28)', filter: active ? `drop-shadow(0 0 6px ${color}80)` : 'none', transition: 'all 0.18s' }} />
                            {badge !== undefined && badge > 0 && (
                                <div style={{ position: 'absolute', top: -4, right: -5, minWidth: 13, height: 13, borderRadius: 99, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.42rem', fontWeight: 800, color: '#fff', border: '1.5px solid #050810', padding: '0 2px' }}>{badge}</div>
                            )}
                        </div>
                        <span style={{ fontSize: '0.62rem', fontWeight: active ? 700 : 500, color: active ? color : 'rgba(255,255,255,0.28)', letterSpacing: '0.05em', transition: 'all 0.18s', zIndex: 1 }}>{label}</span>
                    </motion.button>
                );
            })}
        </nav>
    );
}
