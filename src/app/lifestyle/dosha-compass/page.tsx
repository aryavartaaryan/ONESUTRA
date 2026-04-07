'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import DoshaCompass from '@/components/Dashboard/DoshaCompass';
import { useDoshaEngine } from '@/hooks/useDoshaEngine';

// Time-based nature backgrounds (same pools as main homepage)
const BG_POOLS: Record<string, string[]> = {
    morning: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=80',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1400&q=80',
    ],
    noon: [
        'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1400&q=80',
        'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=1400&q=80',
    ],
    evening: [
        'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=1400&q=80',
        'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1400&q=80',
    ],
    night: [
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1400&q=80',
        'https://images.unsplash.com/photo-1475274047050-1d0c0975f9f1?w=1400&q=80',
    ],
};

function getTimeOfDay(): string {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'morning';
    if (h >= 12 && h < 17) return 'noon';
    if (h >= 17 && h < 21) return 'evening';
    return 'night';
}

const DOSHA_WISDOM = [
    { guna: 'Sattva', text: 'Clarity is the doorway to right action.', emoji: '☀️' },
    { guna: 'Vata', text: 'Ground yourself in routine. Warmth is your medicine.', emoji: '🌬️' },
    { guna: 'Pitta', text: 'Channel fire into service, not control.', emoji: '🔥' },
    { guna: 'Kapha', text: 'Move. You are earth — steady and capable of anything.', emoji: '🌿' },
];

export default function DoshaCompassPage() {
    const router = useRouter();
    const { prakriti, doshaOnboardingComplete } = useDoshaEngine();
    const tod = getTimeOfDay();
    const pool = BG_POOLS[tod] ?? BG_POOLS.morning;
    const bgImage = pool[Math.floor(Date.now() / (30 * 60_000)) % pool.length];

    const wisdom = prakriti
        ? DOSHA_WISDOM.find(w => w.guna.toLowerCase() === prakriti.primary) ?? DOSHA_WISDOM[0]
        : DOSHA_WISDOM[0];

    return (
        <>
            {/* Full-page nature background */}
            <div
                style={{
                    position: 'fixed', inset: 0, zIndex: -10,
                    backgroundImage: `url(${bgImage})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    animation: 'bgIn 1.8s ease forwards',
                }}
                aria-hidden
            />
            <div style={{
                position: 'fixed', inset: 0, zIndex: -9,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.22) 40%, rgba(0,0,0,0.55) 100%)',
                pointerEvents: 'none',
            }} aria-hidden />
            <style>{`
        @keyframes bgIn { from { opacity:0; transform:scale(1.04); } to { opacity:1; transform:scale(1); } }
      `}</style>

            <main style={{
                minHeight: '100dvh',
                padding: '0 0 4rem',
                fontFamily: "'Outfit', sans-serif",
                color: '#fff',
                overflowY: 'auto',
            }}>

                {/* ── Top nav bar ── */}
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '1.1rem 1.1rem 0.6rem',
                        background: 'rgba(0,0,0,0.18)',
                        backdropFilter: 'blur(20px)',
                        borderBottom: '1px solid rgba(255,255,255,0.07)',
                    }}
                >
                    <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={() => router.back()}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 36, height: 36, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)',
                            cursor: 'pointer', color: 'rgba(255,255,255,0.75)', flexShrink: 0,
                        }}
                    >
                        <ArrowLeft size={16} />
                    </motion.button>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>
                            Dosha Compass
                        </p>
                        <p style={{ margin: 0, fontSize: '0.62rem', color: 'rgba(255,255,255,0.38)' }}>
                            Your living Prakriti map
                        </p>
                    </div>
                </motion.div>

                {/* ── Hero wisdom strip ── */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{
                        margin: '1rem 0.8rem 0',
                        padding: '0.8rem 1rem',
                        borderRadius: 16,
                        background: 'rgba(0,0,0,0.18)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.09)',
                        display: 'flex', alignItems: 'center', gap: '0.85rem',
                    }}
                >
                    <motion.span
                        animate={{ scale: [1, 1.18, 1] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ fontSize: '2rem', flexShrink: 0 }}
                    >
                        {wisdom.emoji}
                    </motion.span>
                    <div>
                        <p style={{ margin: '0 0 2px', fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            {doshaOnboardingComplete && prakriti ? `${prakriti.combo.toUpperCase()} Prakriti` : 'Ayurvedic Wisdom'}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.78)', fontStyle: 'italic', fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.5 }}>
                            &ldquo;{wisdom.text}&rdquo;
                        </p>
                    </div>
                </motion.div>

                {/* ── Main Dosha Compass ── */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 }}
                    style={{ marginTop: '0.8rem' }}
                >
                    <DoshaCompass />
                </motion.div>

                {/* ── Ayurvedic Clock strip ── */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.28 }}
                    style={{
                        margin: '0.4rem 0.8rem 0',
                        padding: '0.85rem 1rem',
                        borderRadius: 16,
                        background: 'rgba(0,0,0,0.18)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.09)',
                    }}
                >
                    <p style={{ margin: '0 0 0.6rem', fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Ayurvedic Clock
                    </p>
                    {[
                        { time: '2–6 AM', dosha: 'Vāta', label: 'Brahma Muhūrta', color: '#a78bfa', emoji: '🌙', tip: 'Meditation · Pranayama · Silence' },
                        { time: '6–10 AM', dosha: 'Kapha', label: 'Kapha Morning', color: '#4ade80', emoji: '🌅', tip: 'Movement · Exercise · Cleansing' },
                        { time: '10–2 PM', dosha: 'Pitta', label: 'Pitta Midday', color: '#fb923c', emoji: '☀️', tip: 'Main meal · Deep work · Focus' },
                        { time: '2–6 PM', dosha: 'Vāta', label: 'Vāta Afternoon', color: '#a78bfa', emoji: '⚡', tip: 'Creative work · Communication' },
                        { time: '6–10 PM', dosha: 'Kapha', label: 'Kapha Evening', color: '#4ade80', emoji: '🌆', tip: 'Wind down · Light dinner · Rest' },
                        { time: '10 PM–2 AM', dosha: 'Pitta', label: 'Pitta Night', color: '#fb923c', emoji: '🌑', tip: 'Deep sleep · Cellular repair' },
                    ].map((slot, i) => {
                        const h = new Date().getHours();
                        const slotRanges = [[2, 6], [6, 10], [10, 14], [14, 18], [18, 22], [22, 26]];
                        const [s, e] = slotRanges[i];
                        const isNow = h >= s && h < e || (i === 5 && (h >= 22 || h < 2));
                        return (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: '0.7rem',
                                padding: '0.45rem 0.6rem', borderRadius: 10, marginBottom: '0.3rem',
                                background: isNow ? `rgba(255,255,255,0.06)` : 'transparent',
                                border: isNow ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                            }}>
                                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{slot.emoji}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, color: isNow ? '#fff' : 'rgba(255,255,255,0.55)' }}>
                                        {slot.label} <span style={{ color: slot.color, fontWeight: 500 }}>· {slot.dosha}</span>
                                    </p>
                                    <p style={{ margin: 0, fontSize: '0.58rem', color: 'rgba(255,255,255,0.32)' }}>{slot.tip}</p>
                                </div>
                                <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.28)', flexShrink: 0 }}>{slot.time}</span>
                                {isNow && (
                                    <span style={{
                                        width: 6, height: 6, borderRadius: '50%', background: slot.color,
                                        boxShadow: `0 0 8px ${slot.color}`, flexShrink: 0,
                                    }} />
                                )}
                            </div>
                        );
                    })}
                </motion.div>

            </main>
        </>
    );
}
