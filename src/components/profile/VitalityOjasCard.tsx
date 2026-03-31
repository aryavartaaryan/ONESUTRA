'use client';
import React from 'react';
import { motion } from 'framer-motion';

export interface VitalityData {
    waterIntake?: number;
    waterTarget?: number;
    hrv?: number;
    stepCount?: number;
    stepTarget?: number;
    overallPct?: number;
}

function ProgressRing({
    pct, color, size = 70, label, value,
}: {
    pct: number; color: string; size?: number; label: string; value: string;
}) {
    const r    = (size - 12) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - Math.min(100, pct) / 100);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ position: 'relative', width: size, height: size }}>
                <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
                    <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={8} />
                    <motion.circle
                        cx={size / 2} cy={size / 2} r={r}
                        fill="none"
                        stroke={color}
                        strokeWidth={8}
                        strokeLinecap="round"
                        strokeDasharray={circ}
                        initial={{ strokeDashoffset: circ }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.3, ease: 'easeOut', delay: 0.2 }}
                        style={{ filter: `drop-shadow(0 0 5px ${color}77)` }}
                    />
                </svg>
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                    <span style={{ fontSize: '0.70rem', fontWeight: 800, color: 'rgba(255,255,255,0.92)', lineHeight: 1 }}>{value}</span>
                </div>
            </div>
            <span style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.09em', textAlign: 'center' }}>{label}</span>
        </div>
    );
}

export default function VitalityOjasCard({ data }: { data?: VitalityData }) {
    const waterIntake    = data?.waterIntake  ?? 1800;
    const waterTarget    = data?.waterTarget  ?? 2500;
    const hrv            = data?.hrv          ?? 48;
    const stepCount      = data?.stepCount    ?? 7200;
    const stepTarget     = data?.stepTarget   ?? 10000;
    const overallPct     = data?.overallPct   ?? 68;

    const waterPct  = Math.min(100, Math.round((waterIntake / waterTarget) * 100));
    const stepPct   = Math.min(100, Math.round((stepCount   / stepTarget)  * 100));
    const hrvScore  = Math.min(100, Math.round((hrv / 80)                  * 100));

    const ovCirc   = 2 * Math.PI * 20;
    const ovOffset = ovCirc * (1 - overallPct / 100);

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.09) 0%, rgba(5,150,105,0.06) 100%)',
            border: '1px solid rgba(16,185,129,0.22)',
            borderRadius: 24,
            padding: '1.4rem 1.2rem',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            boxShadow: '0 8px 32px rgba(16,185,129,0.10), inset 0 1px 0 rgba(255,255,255,0.07)',
            marginBottom: '0.75rem',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
                <div>
                    <span style={{ fontSize: '0.42rem', color: 'rgba(110,231,183,0.70)', letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'monospace', display: 'block', marginBottom: 3 }}>OJAS · VITALITY FORCE</span>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'rgba(255,255,255,0.95)', fontFamily: "'Outfit',sans-serif" }}>Daily Vitality</h3>
                </div>
                {/* Overall goal ring */}
                <div style={{ position: 'relative', width: 52, height: 52 }}>
                    <svg width="52" height="52" style={{ transform: 'rotate(-90deg)', display: 'block' }}>
                        <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={6} />
                        <motion.circle
                            cx="26" cy="26" r="20"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth={6}
                            strokeLinecap="round"
                            strokeDasharray={ovCirc}
                            initial={{ strokeDashoffset: ovCirc }}
                            animate={{ strokeDashoffset: ovOffset }}
                            transition={{ duration: 1.4, ease: 'easeOut', delay: 0.1 }}
                            style={{ filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.60))' }}
                        />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '0.60rem', fontWeight: 800, color: '#6ee7b7' }}>{overallPct}%</span>
                    </div>
                </div>
            </div>

            {/* Three progress rings */}
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '1.1rem' }}>
                <ProgressRing pct={waterPct} color="#38bdf8" size={72} label="Water" value={`${(waterIntake / 1000).toFixed(1)}L`} />
                <ProgressRing pct={hrvScore}  color="#a78bfa" size={72} label="HRV"   value={`${hrv}ms`} />
                <ProgressRing pct={stepPct}   color="#10b981" size={72} label="Steps" value={`${(stepCount / 1000).toFixed(1)}k`} />
            </div>

            {/* Goal bar */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: '0.50rem', color: 'rgba(255,255,255,0.40)', fontFamily: 'monospace' }}>Daily Vitality Goal</span>
                    <span style={{ fontSize: '0.50rem', color: '#6ee7b7', fontWeight: 700 }}>{overallPct}% Complete</span>
                </div>
                <div style={{ height: 7, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${overallPct}%` }}
                        transition={{ duration: 1.3, ease: 'easeOut', delay: 0.4 }}
                        style={{
                            height: '100%',
                            background: 'linear-gradient(90deg, #34d399, #10b981)',
                            borderRadius: 99,
                            boxShadow: '0 0 10px rgba(16,185,129,0.40)',
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
