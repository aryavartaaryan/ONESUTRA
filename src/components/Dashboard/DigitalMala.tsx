'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLifestyleStore, getLevelFromXP, LEVELS, getNextLevel } from '@/stores/lifestyleStore';

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_BEADS = 108;
const GURU_BEAD_POSITIONS_PCT = [0, 27, 54, 81]; // every 27th

// Ashrama colors
const ASHRAMA_COLORS: Record<string, string> = {
    brahmacharya: '#a78bfa',
    grihastha: '#fbbf24',
    vanaprastha: '#4ade80',
    sannyasa: '#f472b6',
};

const ASHRAMA_LABELS: Record<string, { short: string; description: string }> = {
    brahmacharya: { short: 'Student', description: 'Learning the foundations of conscious living' },
    grihastha: { short: 'Householder', description: 'Balancing dharma with daily responsibilities' },
    vanaprastha: { short: 'Forest Dweller', description: 'Turning inward, deepening wisdom' },
    sannyasa: { short: 'Renunciate', description: 'Touched by the infinite — beyond all stages' },
};

// ─── Mala SVG ─────────────────────────────────────────────────────────────────

function MalaSVG({ litCount, ashrama, color }: { litCount: number; ashrama: string; color: string }) {
    const cx = 120, cy = 115, r = 90;
    const beadR = 5.2;

    const beads = Array.from({ length: TOTAL_BEADS }, (_, i) => {
        const angle = ((i / TOTAL_BEADS) * 2 * Math.PI) - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        const isLit = i < litCount;
        const isGuru = GURU_BEAD_POSITIONS_PCT.some(p => i === Math.floor((p / 100) * TOTAL_BEADS));
        return { x, y, isLit, isGuru, i };
    });

    return (
        <svg width={240} height={230} viewBox="0 0 240 230" style={{ display: 'block', margin: '0 auto' }}>
            <defs>
                <radialGradient id={`beadGlow_${ashrama}`} cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.8" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </radialGradient>
                <filter id="beadBloom">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Connecting cord */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />

            {/* Beads */}
            {beads.map(({ x, y, isLit, isGuru, i }) => (
                <g key={i}>
                    {isLit && (
                        <circle cx={x} cy={y} r={isGuru ? 10 : beadR + 3} fill={color} opacity={0.18} />
                    )}
                    <motion.circle
                        cx={x} cy={y}
                        r={isGuru ? beadR + 2 : beadR}
                        fill={isLit
                            ? (isGuru ? color : `${color}cc`)
                            : 'rgba(255,255,255,0.07)'}
                        stroke={isGuru ? color : (isLit ? `${color}60` : 'rgba(255,255,255,0.1)')}
                        strokeWidth={isGuru ? 1.5 : 0.8}
                        initial={false}
                        animate={isLit ? { opacity: 1 } : { opacity: 0.5 }}
                        style={isLit && isGuru ? { filter: `drop-shadow(0 0 4px ${color})` } : {}}
                    />
                    {/* Guru bead marker */}
                    {isGuru && isLit && (
                        <text x={x} y={y + 3.5} textAnchor="middle" fontSize={5.5} fill="#fff" fontFamily="'Outfit', sans-serif">✦</text>
                    )}
                </g>
            ))}

            {/* Center Meru (guru bead at top) */}
            <motion.circle
                cx={cx} cy={cy - r - 0}
                r={0}
                fill="transparent"
            />

            {/* Center count */}
            <text x={cx} y={cy - 12} textAnchor="middle" fontSize={26} fontWeight={900} fill="#fff" fontFamily="'Outfit', sans-serif">
                {litCount}
            </text>
            <text x={cx} y={cy + 8} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.4)" fontFamily="'Outfit', sans-serif">
                of 108
            </text>
            <text x={cx} y={cy + 22} textAnchor="middle" fontSize={8} fill={color} fontFamily="'Outfit', sans-serif" fontWeight={700}>
                beads lit
            </text>
        </svg>
    );
}

// ─── Main DigitalMala Component ───────────────────────────────────────────────

interface DigitalMalaProps {
    compact?: boolean;
}

export default function DigitalMala({ compact = false }: DigitalMalaProps) {
    const xp = useLifestyleStore(s => s.xp);
    const levelInfo = useMemo(() => getLevelFromXP(xp.total), [xp.total]);
    const nextLevel = useMemo(() => getNextLevel(xp.total), [xp.total]);

    // Cast ashrama safely
    const ashrama = (levelInfo as any).ashrama ?? 'brahmacharya';
    const color = ASHRAMA_COLORS[ashrama] ?? '#a78bfa';
    const ashrLabel = ASHRAMA_LABELS[ashrama] ?? ASHRAMA_LABELS.brahmacharya;

    // Map XP to bead count: each complete mala = 108 beads × a milestone XP step
    // We want a full mala at Sannyasa (9000 XP)
    const litCount = Math.min(TOTAL_BEADS, Math.round((xp.total / 9000) * TOTAL_BEADS));

    // XP progress within current level
    const xpPct = nextLevel
        ? Math.min(100, Math.round(((xp.total - levelInfo.minXP) / (nextLevel.minXP - levelInfo.minXP)) * 100))
        : 100;

    if (compact) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.9rem', borderRadius: 14, background: `${color}08`, border: `1px solid ${color}22` }}>
                <span style={{ fontSize: '1.4rem' }}>{levelInfo.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 1px', fontSize: '0.75rem', fontWeight: 800, color, fontFamily: "'Outfit', sans-serif" }}>{levelInfo.name}</p>
                    <p style={{ margin: 0, fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>{ashrLabel.description.slice(0, 45)}…</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ margin: '0 0 1px', fontSize: '0.68rem', fontWeight: 900, color: '#fbbf24', fontFamily: "'Outfit', sans-serif" }}>{xp.total} XP</p>
                    <p style={{ margin: 0, fontSize: '0.52rem', color: 'rgba(255,255,255,0.28)', fontFamily: "'Outfit', sans-serif" }}>{litCount}/108 beads</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                borderRadius: 22,
                background: 'rgba(0,0,0,0.3)',
                border: `1.5px solid ${color}28`,
                padding: '1.25rem 1rem',
                backdropFilter: 'blur(20px)',
                boxShadow: `0 8px 40px ${color}10`,
                fontFamily: "'Outfit', sans-serif",
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <div>
                    <p style={{ margin: '0 0 1px', fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Tapas · Ashrama Path</p>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#fff' }}>Digital Japa Mala</h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.5rem' }}>{levelInfo.icon}</span>
                </div>
            </div>

            {/* Mala SVG */}
            <MalaSVG litCount={litCount} ashrama={ashrama} color={color} />

            {/* Ashrama stage */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.6rem 0.8rem', borderRadius: 12, marginBottom: '0.85rem',
                background: `${color}10`, border: `1px solid ${color}25`,
            }}>
                <span style={{ fontSize: '1.3rem' }}>{levelInfo.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color }}>
                        {levelInfo.name} <span style={{ fontSize: '0.6rem', color: `${color}80`, fontWeight: 600 }}>({ashrLabel.short})</span>
                    </p>
                    <p style={{ margin: '1px 0 0', fontSize: '0.62rem', color: 'rgba(255,255,255,0.38)' }}>{ashrLabel.description}</p>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#fbbf24', flexShrink: 0 }}>{xp.total} XP</span>
            </div>

            {/* XP progress bar */}
            {nextLevel && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>Progress to {nextLevel.name}</span>
                        <span style={{ fontSize: '0.58rem', color: color, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>{xpPct}%</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${xpPct}%` }}
                            transition={{ duration: 1.4, ease: 'easeOut' }}
                            style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${color}, #fbbf24)`, boxShadow: `0 0 8px ${color}88` }}
                        />
                    </div>
                </div>
            )}

            {/* Milestones */}
            <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.85rem' }}>
                {LEVELS.filter((_, i) => i % 3 === 0).map(level => {
                    const achieved = xp.total >= level.minXP;
                    const lvlAshrama = (level as any).ashrama ?? 'brahmacharya';
                    const lvlColor = ASHRAMA_COLORS[lvlAshrama] ?? '#a78bfa';
                    return (
                        <div key={level.name} style={{
                            flex: 1, textAlign: 'center', padding: '0.3rem 0.1rem', borderRadius: 8,
                            background: achieved ? `${lvlColor}15` : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${achieved ? lvlColor + '35' : 'rgba(255,255,255,0.07)'}`,
                            opacity: achieved ? 1 : 0.45,
                        }}>
                            <p style={{ margin: 0, fontSize: '1rem' }}>{level.icon}</p>
                            <p style={{ margin: 0, fontSize: '0.45rem', color: achieved ? lvlColor : 'rgba(255,255,255,0.3)', fontWeight: 700, fontFamily: "'Outfit', sans-serif", lineHeight: 1.3 }}>
                                {level.minXP}XP
                            </p>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}
