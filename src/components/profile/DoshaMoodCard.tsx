'use client';
import React from 'react';
import { motion } from 'framer-motion';

export type DominantDosha = 'vata' | 'pitta' | 'kapha';

export interface DoshaMoodProps {
    prakriti?: string;
    vikriti?: string;
    sleepQuality?: number;
    dominantDosha?: DominantDosha;
}

const DOSHA_COLORS: Record<string, string> = {
    Vata:  '#a78bfa',
    Pitta: '#fb923c',
    Kapha: '#4ade80',
};

const SLEEP_RECS: Record<DominantDosha, string> = {
    vata:  'Your Vata is elevated due to low sleep. Recommend warming foods (ghee, sesame), Abhyanga oil massage, and sleeping before 10 PM for grounding.',
    pitta: 'Your Pitta is elevated due to low sleep. Recommend cooling foods (coconut, mint, cucumber) and Sheetali pranayama before bed tonight.',
    kapha: 'Your Kapha is elevated. Light meals, dry ginger tea in the morning, and a vigorous Surya Namaskar will help restore your vitality.',
};

const BALANCED_MSG: Record<DominantDosha, string> = {
    vata:  'Your Vata is balanced. Maintain your sleep and grounding practices.',
    pitta: 'Your Pitta is in harmony. Continue your cooling diet and mindful schedule.',
    kapha: 'Your Kapha is flowing well. Keep your active morning routine.',
};

export default function DoshaMoodCard({
    prakriti      = 'Vata-Pitta',
    vikriti,
    sleepQuality  = 0.75,
    dominantDosha = 'vata',
}: DoshaMoodProps) {
    const isImbalanced = sleepQuality < 0.65;
    const recommendation = isImbalanced ? SLEEP_RECS[dominantDosha] : BALANCED_MSG[dominantDosha];

    const parts = prakriti.split(/[-/]/).slice(0, 3).map(p => p.trim()).filter(Boolean);
    const doshaComparison = ['Vata', 'Pitta', 'Kapha'].map((name, i) => {
        const inPrakriti = parts.indexOf(name);
        const birthPct = inPrakriti === 0 ? 65 : inPrakriti === 1 ? 25 : inPrakriti >= 0 ? 10 : (i === 0 ? 15 : i === 1 ? 55 : 30);
        const elevated = name.toLowerCase() === dominantDosha && isImbalanced;
        const currentPct = elevated ? Math.min(birthPct + 12, 95) : birthPct;
        const color = DOSHA_COLORS[name] || '#a78bfa';
        return { name, birthPct, currentPct, color, elevated };
    });

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(251,146,60,0.07) 0%, rgba(167,139,250,0.08) 100%)',
            border: '1px solid rgba(251,146,60,0.20)',
            borderRadius: 24,
            padding: '1.4rem 1.2rem',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            boxShadow: '0 8px 32px rgba(251,146,60,0.08), inset 0 1px 0 rgba(255,255,255,0.07)',
            marginBottom: '0.75rem',
        }}>
            {/* Header */}
            <div style={{ marginBottom: '1.1rem' }}>
                <span style={{ fontSize: '0.42rem', color: 'rgba(253,186,116,0.70)', letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'monospace', display: 'block', marginBottom: 3 }}>DOSHA · PRAKRITI vs VIKRITI</span>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'rgba(255,255,255,0.95)', fontFamily: "'Outfit',sans-serif" }}>Current State Analysis</h3>
            </div>

            {/* Side-by-side comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.6rem', alignItems: 'start', marginBottom: '1rem' }}>

                {/* Birth State (Prakriti) */}
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '0.8rem' }}>
                    <div style={{ fontSize: '0.46rem', color: 'rgba(255,255,255,0.36)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'monospace', marginBottom: '0.6rem' }}>Prakriti</div>
                    {doshaComparison.map(d => (
                        <div key={d.name} style={{ marginBottom: '0.45rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                <span style={{ fontSize: '0.60rem', color: d.color, fontWeight: 700 }}>{d.name}</span>
                                <span style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.38)' }}>{d.birthPct}%</span>
                            </div>
                            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${d.birthPct}%`, background: d.color, borderRadius: 99, opacity: 0.65 }} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Divider */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBlock: '0.4rem', gap: 4 }}>
                    <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.10)' }} />
                    <span style={{ fontSize: '0.85rem' }}>⚖️</span>
                    <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.10)' }} />
                </div>

                {/* Current State (Vikriti) */}
                <div style={{
                    background: isImbalanced ? 'rgba(251,146,60,0.07)' : 'rgba(74,222,128,0.05)',
                    border: `1px solid ${isImbalanced ? 'rgba(251,146,60,0.18)' : 'rgba(74,222,128,0.15)'}`,
                    borderRadius: 16,
                    padding: '0.8rem',
                }}>
                    <div style={{ fontSize: '0.46rem', color: isImbalanced ? 'rgba(251,146,60,0.70)' : 'rgba(74,222,128,0.70)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'monospace', marginBottom: '0.6rem' }}>Vikriti</div>
                    {doshaComparison.map(d => (
                        <div key={d.name} style={{ marginBottom: '0.45rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                <span style={{ fontSize: '0.60rem', color: d.color, fontWeight: 700 }}>{d.name}</span>
                                <span style={{ fontSize: '0.52rem', color: d.elevated ? '#fb923c' : d.currentPct < d.birthPct ? '#4ade80' : 'rgba(255,255,255,0.40)' }}>
                                    {d.currentPct}% {d.elevated ? '↑' : d.currentPct < d.birthPct ? '↓' : '='}
                                </span>
                            </div>
                            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${d.currentPct}%` }}
                                    transition={{ duration: 1.1, ease: 'easeOut', delay: 0.25 }}
                                    style={{ height: '100%', background: d.color, borderRadius: 99, boxShadow: d.elevated ? `0 0 6px ${d.color}77` : 'none' }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Status badge */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.65rem 0.9rem',
                background: isImbalanced ? 'rgba(251,146,60,0.10)' : 'rgba(74,222,128,0.08)',
                border: `1px solid ${isImbalanced ? 'rgba(251,146,60,0.24)' : 'rgba(74,222,128,0.20)'}`,
                borderRadius: 12,
                marginBottom: '0.65rem',
            }}>
                <span style={{ fontSize: '1rem' }}>{isImbalanced ? '⚡' : '✅'}</span>
                <p style={{ margin: 0, fontSize: '0.66rem', color: isImbalanced ? 'rgba(253,186,116,0.90)' : 'rgba(167,243,208,0.90)', lineHeight: 1.5 }}>
                    {isImbalanced
                        ? `Your ${dominantDosha.charAt(0).toUpperCase() + dominantDosha.slice(1)} is elevated. Low sleep is the likely cause.`
                        : 'Your doshas are in balance. Keep up your wellness routine!'}
                </p>
            </div>

            {/* Recommendation */}
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{
                    padding: '0.75rem 0.9rem',
                    background: 'rgba(167,139,250,0.09)',
                    border: '1px solid rgba(167,139,250,0.20)',
                    borderRadius: 12,
                }}
            >
                <div style={{ fontSize: '0.46rem', fontWeight: 700, color: 'rgba(196,181,253,0.80)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 5 }}>🌿 Today&apos;s Recommendation</div>
                <p style={{ margin: 0, fontSize: '0.66rem', color: 'rgba(221,214,254,0.82)', lineHeight: 1.65 }}>{recommendation}</p>
            </motion.div>
        </div>
    );
}
