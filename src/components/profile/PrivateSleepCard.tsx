'use client';
import React from 'react';
import { motion } from 'framer-motion';

export interface SleepData {
    totalRest?: string;
    deepSleepPct?: number;
    regularityScore?: number;
    quality?: number;
    prakriti?: string;
}

const AYURVEDIC_TIPS: Record<string, string> = {
    vata:  'Vata type: Ensure you sleep before 10:00 PM for better grounding. Warm sesame oil massage on feet helps.',
    pitta: 'Pitta type: Avoid screens 1 hr before bed. Cool the mind with Sheetali pranayama and rose water on the pillow.',
    kapha: 'Kapha type: Rise before 6 AM with the sunrise. Avoid oversleeping — it increases heaviness and lethargy.',
};

function ChandraMoon({ quality, size = 56 }: { quality: number; size?: number }) {
    const fill = Math.max(0.1, Math.min(1, quality));
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.42;
    const shift = (1 - fill) * r * 0.9;

    return (
        <motion.div
            animate={{ filter: ['drop-shadow(0 0 7px rgba(147,197,253,0.4))', 'drop-shadow(0 0 16px rgba(147,197,253,0.75))', 'drop-shadow(0 0 7px rgba(147,197,253,0.4))'] }}
            transition={{ duration: 3, repeat: Infinity }}
        >
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <defs>
                    <radialGradient id="moonFill" cx="35%" cy="30%" r="70%">
                        <stop offset="0%"   stopColor="#e0e7ff" stopOpacity={fill * 0.95} />
                        <stop offset="55%"  stopColor="#93c5fd" stopOpacity={fill * 0.75} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={fill * 0.35} />
                    </radialGradient>
                    <clipPath id={`moonClip-${size}`}>
                        <circle cx={cx} cy={cy} r={r} />
                    </clipPath>
                </defs>
                <circle cx={cx} cy={cy} r={r} fill="rgba(20,30,70,0.55)" stroke="rgba(147,197,253,0.30)" strokeWidth="1.5" />
                <ellipse cx={cx - shift} cy={cy} rx={r * fill} ry={r} fill="url(#moonFill)" clipPath={`url(#moonClip-${size})`} />
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(147,197,253,0.28)" strokeWidth="1" />
            </svg>
        </motion.div>
    );
}

export default function PrivateSleepCard({ data }: { data?: SleepData }) {
    const totalRest      = data?.totalRest      ?? '7h 20m';
    const deepSleepPct   = data?.deepSleepPct   ?? 34;
    const regularityScore = data?.regularityScore ?? 72;
    const quality        = data?.quality        ?? 0.75;
    const prakriti       = data?.prakriti       ?? 'Vata-Pitta';

    const prakritiKey = prakriti.toLowerCase().includes('pitta') && !prakriti.toLowerCase().startsWith('vata')
        ? 'pitta'
        : prakriti.toLowerCase().includes('kapha')
            ? 'kapha'
            : 'vata';

    const ayurvedicTip = AYURVEDIC_TIPS[prakritiKey];

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.11) 0%, rgba(59,130,246,0.07) 100%)',
            border: '1px solid rgba(99,102,241,0.24)',
            borderRadius: 24,
            padding: '1.4rem 1.2rem',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            boxShadow: '0 8px 32px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.07)',
            marginBottom: '0.75rem',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
                <div>
                    <span style={{ fontSize: '0.42rem', color: 'rgba(147,197,253,0.70)', letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'monospace', display: 'block', marginBottom: 3 }}>CHANDRA · SLEEP MIRROR</span>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'rgba(255,255,255,0.95)', fontFamily: "'Outfit',sans-serif" }}>Sleep Quality</h3>
                </div>
                <ChandraMoon quality={quality} size={58} />
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
                {[
                    { label: 'Total Rest',  value: totalRest,             color: '#93c5fd' },
                    { label: 'Deep Sleep',  value: `${deepSleepPct}%`,    color: '#a78bfa' },
                    { label: 'Regularity',  value: `${regularityScore}`,  color: '#6ee7b7' },
                ].map(m => (
                    <div key={m.label} style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.09)',
                        borderRadius: 14, padding: '0.65rem 0.4rem', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: m.color, fontFamily: "'Outfit',sans-serif", lineHeight: 1.1 }}>{m.value}</div>
                        <div style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>{m.label}</div>
                    </div>
                ))}
            </div>

            {/* Quality bar */}
            <div style={{ marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: '0.50rem', color: 'rgba(255,255,255,0.40)', fontFamily: 'monospace' }}>Sleep Quality</span>
                    <span style={{ fontSize: '0.50rem', color: '#93c5fd', fontWeight: 700 }}>{Math.round(quality * 100)}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${quality * 100}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                        style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #93c5fd)', borderRadius: 99 }}
                    />
                </div>
            </div>

            {/* Ayurvedic tip */}
            <div style={{
                padding: '0.7rem 0.9rem',
                background: 'rgba(99,102,241,0.10)',
                border: '1px solid rgba(99,102,241,0.22)',
                borderRadius: 12,
                fontSize: '0.66rem',
                color: 'rgba(224,231,255,0.78)',
                lineHeight: 1.65,
                fontStyle: 'italic',
            }}>
                🌙 {ayurvedicTip}
            </div>
        </div>
    );
}
