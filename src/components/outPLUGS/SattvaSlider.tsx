'use client';

import { motion } from 'framer-motion';

export type EnergyTag = 'Tamasic' | 'Rajasic' | 'Sattvic';

interface SattvaSliderProps {
    value: EnergyTag;
    onChange: (tag: EnergyTag) => void;
}

const STATES: { tag: EnergyTag; label: string; emoji: string; color: string; glow: string }[] = [
    { tag: 'Tamasic', label: 'Raw', emoji: '🌑', color: '#e85d04', glow: 'rgba(232,93,4,0.45)' },
    { tag: 'Rajasic', label: 'Active', emoji: '⚡', color: '#f7b731', glow: 'rgba(247,183,49,0.45)' },
    { tag: 'Sattvic', label: 'Uplift', emoji: '✨', color: '#55efc4', glow: 'rgba(85,239,196,0.45)' },
];

export default function SattvaSlider({ value, onChange }: SattvaSliderProps) {
    const activeIdx = STATES.findIndex(s => s.tag === value);
    const active = STATES[activeIdx];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{
                fontSize: '0.55rem', letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-header)',
            }}>
                Prakriti · Energy Filter
            </span>

            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.25rem',
                background: 'rgba(255,255,255,0.07)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 9999,
                padding: '0.25rem',
                position: 'relative',
            }}>
                {STATES.map((s, i) => {
                    const isActive = s.tag === value;
                    return (
                        <motion.button
                            key={s.tag}
                            onClick={() => onChange(s.tag)}
                            whileTap={{ scale: 0.93 }}
                            style={{
                                position: 'relative', zIndex: 1,
                                display: 'flex', alignItems: 'center', gap: '0.3rem',
                                padding: '0.3rem 0.75rem',
                                borderRadius: 9999,
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-header)',
                                transition: 'all 0.25s ease',
                            }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="sattva-pill"
                                    style={{
                                        position: 'absolute', inset: 0, borderRadius: 9999,
                                        background: `${s.color}22`,
                                        border: `1px solid ${s.color}55`,
                                        boxShadow: `0 0 12px ${s.glow}`,
                                    }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                />
                            )}
                            <span style={{ fontSize: '0.85rem' }}>{s.emoji}</span>
                            <span style={{
                                fontSize: '0.72rem', fontWeight: 500,
                                color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                                letterSpacing: '0.04em',
                                transition: 'color 0.25s ease',
                            }}>
                                {s.label}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
