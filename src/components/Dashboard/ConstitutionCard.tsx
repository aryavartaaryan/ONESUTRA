'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { useDoshaEngine } from '@/hooks/useDoshaEngine';
import { DOSHA_INFO } from '@/lib/doshaService';

// ─── Dosha Pie chart ──────────────────────────────────────────────────────────

const DOSHA_COLORS = { vata: '#a78bfa', pitta: '#fb923c', kapha: '#4ade80' };
const DOSHA_EMOJIS = { vata: '🌬️', pitta: '🔥', kapha: '🌿' };

function DoshaPie({ vata, pitta, kapha, label }: { vata: number; pitta: number; kapha: number; label: string }) {
    const total = vata + pitta + kapha || 1;
    const vP = vata / total, pP = pitta / total, kP = kapha / total;
    const cx = 55, cy = 55, r = 44;

    // Pie slices via SVG arc paths
    function describeArc(start: number, end: number) {
        const s = (start * 2 * Math.PI) - Math.PI / 2;
        const e = (end * 2 * Math.PI) - Math.PI / 2;
        const large = end - start > 0.5 ? 1 : 0;
        const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
        const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
        if (start === end) return '';
        return end - start >= 0.9999
            ? `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy}`
            : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    }

    const slices = [
        { path: describeArc(0, vP), color: DOSHA_COLORS.vata, label: 'V', pct: Math.round(vP * 100) },
        { path: describeArc(vP, vP + pP), color: DOSHA_COLORS.pitta, label: 'P', pct: Math.round(pP * 100) },
        { path: describeArc(vP + pP, 1), color: DOSHA_COLORS.kapha, label: 'K', pct: Math.round(kP * 100) },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg width={110} height={110} viewBox="0 0 110 110">
                <circle cx={cx} cy={cy} r={r + 2} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
                {slices.map((s, i) => s.path ? (
                    <motion.path key={i} d={s.path} fill={s.color} opacity={0.85}
                        initial={{ opacity: 0 }} animate={{ opacity: 0.85 }} transition={{ delay: i * 0.1 + 0.2 }}
                        style={{ filter: `drop-shadow(0 0 4px ${s.color}60)` }}
                    />
                ) : null)}
                <circle cx={cx} cy={cy} r={22} fill="#050210" />
                <text x={cx} y={cy + 5} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.5)" fontFamily="'Outfit', sans-serif" fontWeight={700}>{label}</text>
            </svg>
            {/* Legend */}
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: 4 }}>
                {slices.map((s, i) => (
                    <span key={i} style={{ fontSize: '0.55rem', fontFamily: "'Outfit', sans-serif", color: s.color, fontWeight: 700 }}>
                        {['V', 'P', 'K'][i]} {s.pct}%
                    </span>
                ))}
            </div>
        </div>
    );
}

// ─── Constitution Card ────────────────────────────────────────────────────────

export default function ConstitutionCard() {
    const router = useRouter();
    const { prakriti, vikriti, doshaOnboardingComplete, currentSeason } = useDoshaEngine();

    const primaryColor = prakriti ? (DOSHA_COLORS[prakriti.primary as keyof typeof DOSHA_COLORS] ?? '#fb923c') : '#a78bfa';
    const doshaInfo = prakriti ? DOSHA_INFO[prakriti.primary] : null;

    const prakritiScores = useMemo(() => {
        if (!prakriti) return { vata: 33, pitta: 33, kapha: 34 };
        const primary = prakriti.primary, secondary = prakriti.secondary;
        const base = { vata: 20, pitta: 20, kapha: 20 };
        base[primary as keyof typeof base] = 55;
        if (secondary && secondary !== primary) base[secondary as keyof typeof base] = 35;
        return base;
    }, [prakriti]);

    const vikrButtons = useMemo(() => {
        if (!vikriti) return { vata: 33, pitta: 33, kapha: 34 };
        const primary = (vikriti as any).primary;
        const secondary = (vikriti as any).secondary;
        const base = { vata: 20, pitta: 20, kapha: 20 };
        if (primary) base[primary as keyof typeof base] = 55;
        if (secondary && secondary !== primary) base[secondary as keyof typeof base] = 35;
        return base;
    }, [vikriti]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => router.push('/lifestyle/prakriti')}
            style={{
                borderRadius: 22, padding: '1rem 1.1rem', cursor: 'pointer',
                background: `linear-gradient(135deg, ${primaryColor}12, rgba(0,0,0,0.28))`,
                border: `1.5px solid ${primaryColor}30`,
                backdropFilter: 'blur(20px)',
                boxShadow: `0 8px 32px ${primaryColor}10`,
                fontFamily: "'Outfit', sans-serif",
                position: 'relative', overflow: 'hidden',
            }}
        >
            {/* Background glow */}
            <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: `${primaryColor}18`, filter: 'blur(30px)', pointerEvents: 'none' }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem', position: 'relative' }}>
                <div>
                    <p style={{ margin: '0 0 1px', fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Ayurvedic Constitution</p>
                    <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 900, color: '#fff' }}>
                        {doshaOnboardingComplete && prakriti ? `${prakriti.combo.toUpperCase()} Prakriti` : 'Your Constitution'}
                    </h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    {prakriti && <span style={{ fontSize: '1.5rem' }}>{DOSHA_EMOJIS[prakriti.primary as keyof typeof DOSHA_EMOJIS]}</span>}
                    <ChevronRight size={15} style={{ color: primaryColor, opacity: 0.6 }} />
                </div>
            </div>

            {doshaOnboardingComplete && prakriti ? (
                <>
                    {/* Pie charts side by side */}
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '0.85rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <DoshaPie vata={prakritiScores.vata} pitta={prakritiScores.pitta} kapha={prakritiScores.kapha} label="Prakriti" />
                            <p style={{ margin: '4px 0 0', fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>Nature</p>
                        </div>
                        {vikriti && (
                            <div style={{ textAlign: 'center' }}>
                                <DoshaPie vata={vikrButtons.vata} pitta={vikrButtons.pitta} kapha={vikrButtons.kapha} label="Vikriti" />
                                <p style={{ margin: '4px 0 0', fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>Current</p>
                            </div>
                        )}
                    </div>

                    {/* Imbalance note */}
                    {vikriti && vikriti.imbalanceLevel !== 'balanced' && (
                        <div style={{ padding: '0.5rem 0.7rem', borderRadius: 10, background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', marginBottom: '0.5rem' }}>
                            <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)' }}>
                                🌿 {vikriti.primary} elevated · {vikriti.imbalanceLevel} imbalance detected
                            </p>
                        </div>
                    )}

                    {/* Essence */}
                    {doshaInfo && (
                        <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.42)', lineHeight: 1.5 }}>
                            {((doshaInfo as any).essence ?? (doshaInfo as any).description)?.slice(0, 90)}…
                        </p>
                    )}
                </>
            ) : (
                <div style={{ textAlign: 'center', padding: '0.75rem 0' }}>
                    <p style={{ margin: '0 0 0.35rem', fontSize: '2rem' }}>🪷</p>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>Discover Your Prakriti</p>
                    <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
                        Take the 20-question Ayurvedic assessment to unlock personalised wisdom
                    </p>
                </div>
            )}
        </motion.div>
    );
}
