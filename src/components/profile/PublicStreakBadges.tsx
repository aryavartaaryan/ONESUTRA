'use client';
import React from 'react';
import { motion } from 'framer-motion';

export type WeeklyMood = 'joy' | 'peace' | 'healing';

export interface KarmicBadge {
    id: string;
    label: string;
    emoji: string;
    earned: boolean;
    desc: string;
}

export interface PublicStreakData {
    satyaStreak?: number;
    weeklyMoodAvg?: WeeklyMood;
    karmicBadges?: KarmicBadge[];
}

const AURA_COLORS: Record<WeeklyMood, { glow: string; border: string; label: string; bg: string }> = {
    joy:     { glow: 'rgba(251,191,36,0.55)',  border: '#fbbf24', label: 'Ananda · Joy',      bg: 'rgba(251,191,36,0.10)'  },
    peace:   { glow: 'rgba(96,165,250,0.45)',  border: '#60a5fa', label: 'Shanti · Peace',    bg: 'rgba(96,165,250,0.08)'  },
    healing: { glow: 'rgba(74,222,128,0.45)',  border: '#4ade80', label: 'Swastha · Healing', bg: 'rgba(74,222,128,0.08)'  },
};

const MOOD_EMOJI: Record<WeeklyMood, string> = { joy: '☀️', peace: '🌊', healing: '🌿' };

const DEFAULT_BADGES: KarmicBadge[] = [
    { id: 'seva',    label: 'Seva',        emoji: '🙏', earned: true,  desc: 'Helped 3 community members'   },
    { id: 'gyaan',   label: 'Gyaan Daan',  emoji: '📚', earned: true,  desc: 'Shared wisdom in community'   },
    { id: 'satya',   label: 'Satya',       emoji: '✦',  earned: false, desc: '21-day ritual streak needed'  },
    { id: 'ahimsa',  label: 'Ahimsa',      emoji: '🕊️', earned: false, desc: 'Complete compassion challenge' },
];

export default function PublicStreakBadges({ data }: { data?: PublicStreakData }) {
    const satyaStreak   = data?.satyaStreak   ?? 14;
    const weeklyMoodAvg = data?.weeklyMoodAvg ?? 'joy';
    const karmicBadges  = data?.karmicBadges  ?? DEFAULT_BADGES;
    const aura = AURA_COLORS[weeklyMoodAvg];

    return (
        <>
            {/* ── Vibe Aura Indicator ── */}
            <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
                style={{
                    background: aura.bg,
                    border: `1px solid ${aura.border}33`,
                    borderRadius: 24,
                    padding: '1rem 1.2rem',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                }}
            >
                <motion.div
                    animate={{ boxShadow: [`0 0 16px ${aura.glow}`, `0 0 30px ${aura.glow}`, `0 0 16px ${aura.glow}`] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    style={{
                        width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                        background: `radial-gradient(circle, ${aura.border}44 0%, transparent 70%)`,
                        border: `2px solid ${aura.border}66`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.4rem',
                    }}
                >
                    {MOOD_EMOJI[weeklyMoodAvg]}
                </motion.div>
                <div>
                    <div style={{ fontSize: '0.42rem', color: `${aura.border}bb`, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: 2 }}>WEEKLY VIBE</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: aura.border, fontFamily: "'Outfit',sans-serif" }}>{aura.label}</div>
                    <div style={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.40)', marginTop: 1 }}>Based on your 7-day mood average</div>
                </div>
            </motion.div>

            {/* ── Satya Streak ── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                    background: 'rgba(251,191,36,0.07)',
                    border: '1px solid rgba(251,191,36,0.20)',
                    borderRadius: 24,
                    padding: '1.1rem 1.2rem',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <span style={{ fontSize: '1.8rem', filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.5))' }}>🔥</span>
                    <div>
                        <div style={{ fontSize: '0.42rem', color: 'rgba(251,191,36,0.65)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: 2 }}>SATYA STREAK</div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.58)' }}>Morning ritual completion</div>
                    </div>
                </div>
                <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fbbf24', lineHeight: 1, fontFamily: "'Outfit',sans-serif" }}>{satyaStreak}</div>
                    <div style={{ fontSize: '0.42rem', color: 'rgba(251,191,36,0.52)', textTransform: 'uppercase', letterSpacing: '0.10em' }}>days in a row</div>
                </motion.div>
            </motion.div>

            {/* ── Karmic Contributions ── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                    background: 'rgba(167,139,250,0.06)',
                    border: '1px solid rgba(167,139,250,0.16)',
                    borderRadius: 24,
                    padding: '1.1rem 1.2rem',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    marginBottom: '0.75rem',
                }}
            >
                <div style={{ fontSize: '0.42rem', color: 'rgba(196,181,253,0.65)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: '0.85rem' }}>🏆 KARMIC CONTRIBUTIONS</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {karmicBadges.map(badge => (
                        <div
                            key={badge.id}
                            style={{
                                background: badge.earned ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${badge.earned ? 'rgba(167,139,250,0.28)' : 'rgba(255,255,255,0.07)'}`,
                                borderRadius: 16,
                                padding: '0.7rem 0.75rem',
                                opacity: badge.earned ? 1 : 0.5,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.55rem',
                            }}
                        >
                            <span style={{ fontSize: '1.2rem', filter: badge.earned ? 'none' : 'grayscale(1)', flexShrink: 0 }}>{badge.emoji}</span>
                            <div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: badge.earned ? 'rgba(221,214,254,0.95)' : 'rgba(255,255,255,0.38)', fontFamily: "'Outfit',sans-serif" }}>{badge.label}</div>
                                <div style={{ fontSize: '0.46rem', color: 'rgba(255,255,255,0.30)', lineHeight: 1.4 }}>{badge.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </>
    );
}
