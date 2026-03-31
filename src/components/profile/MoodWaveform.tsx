'use client';
import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export type MoodLabel = 'Calm' | 'Focused' | 'Anxious' | 'Joyful' | 'Tired';

export interface MoodEntry {
    day: string;
    mood: MoodLabel;
    energy: number;
}

export interface MoodWaveformProps {
    data?: MoodEntry[];
    insight?: string;
}

const MOOD_COLORS: Record<MoodLabel, string> = {
    Calm:    '#60a5fa',
    Focused: '#fbbf24',
    Anxious: '#f87171',
    Joyful:  '#fde68a',
    Tired:   '#9ca3af',
};

const MOOD_EMOJI: Record<MoodLabel, string> = {
    Calm: '🌊', Focused: '⚡', Anxious: '🌀', Joyful: '☀️', Tired: '🌫️',
};

const DEFAULT_DATA: MoodEntry[] = [
    { day: 'Mon', mood: 'Calm',    energy: 65 },
    { day: 'Tue', mood: 'Focused', energy: 82 },
    { day: 'Wed', mood: 'Anxious', energy: 45 },
    { day: 'Thu', mood: 'Focused', energy: 88 },
    { day: 'Fri', mood: 'Joyful',  energy: 91 },
    { day: 'Sat', mood: 'Calm',    energy: 74 },
    { day: 'Sun', mood: 'Tired',   energy: 52 },
];

function PranaWaveCanvas({ data }: { data: MoodEntry[] }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef    = useRef<number>(0);
    const tRef      = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const setSize = () => {
            canvas.width  = canvas.offsetWidth  * window.devicePixelRatio;
            canvas.height = canvas.offsetHeight * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };
        setSize();

        const W = canvas.offsetWidth;
        const H = canvas.offsetHeight;

        const points = data.map((d, i) => ({
            x:     (i / (data.length - 1)) * W,
            y:     H - (d.energy / 100) * H * 0.78 - H * 0.11,
            color: MOOD_COLORS[d.mood] || '#60a5fa',
        }));

        const draw = () => {
            tRef.current += 0.018;
            ctx.clearRect(0, 0, W, H);

            const grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0,   'rgba(99,102,241,0.22)');
            grad.addColorStop(1,   'rgba(99,102,241,0.02)');

            ctx.beginPath();
            ctx.moveTo(0, H);
            points.forEach((p, i) => {
                const wave = Math.sin(tRef.current + i * 0.9) * 2.5;
                if (i === 0) {
                    ctx.lineTo(p.x, p.y + wave);
                } else {
                    const prev = points[i - 1];
                    const cpx  = (prev.x + p.x) / 2;
                    ctx.bezierCurveTo(cpx, prev.y + Math.sin(tRef.current + (i-1) * 0.9) * 2.5, cpx, p.y + wave, p.x, p.y + wave);
                }
            });
            ctx.lineTo(W, H);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();

            ctx.beginPath();
            points.forEach((p, i) => {
                const wave = Math.sin(tRef.current + i * 0.9) * 2.5;
                if (i === 0) {
                    ctx.moveTo(p.x, p.y + wave);
                } else {
                    const prev = points[i - 1];
                    const cpx  = (prev.x + p.x) / 2;
                    ctx.bezierCurveTo(cpx, prev.y + Math.sin(tRef.current + (i-1) * 0.9) * 2.5, cpx, p.y + wave, p.x, p.y + wave);
                }
            });
            ctx.strokeStyle = '#818cf8';
            ctx.lineWidth   = 2;
            ctx.stroke();

            points.forEach((p, i) => {
                const wave = Math.sin(tRef.current + i * 0.9) * 2.5;
                ctx.beginPath();
                ctx.arc(p.x, p.y + wave, 4, 0, Math.PI * 2);
                ctx.fillStyle   = p.color;
                ctx.fill();
                ctx.strokeStyle = 'rgba(0,0,0,0.45)';
                ctx.lineWidth   = 1.5;
                ctx.stroke();
            });

            rafRef.current = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(rafRef.current);
    }, [data]);

    return (
        <canvas
            ref={canvasRef}
            style={{ width: '100%', height: 90, borderRadius: 10, display: 'block' }}
        />
    );
}

export default function MoodWaveform({ data = DEFAULT_DATA, insight }: MoodWaveformProps) {
    const defaultInsight = "You feel 20% more 'Focused' on days you complete 15 mins of Pranayama.";
    const todayMood = data[data.length - 1];

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.09) 0%, rgba(139,92,246,0.07) 100%)',
            border: '1px solid rgba(139,92,246,0.22)',
            borderRadius: 24,
            padding: '1.4rem 1.2rem',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            boxShadow: '0 8px 32px rgba(139,92,246,0.10), inset 0 1px 0 rgba(255,255,255,0.07)',
            marginBottom: '0.75rem',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
                <div>
                    <span style={{ fontSize: '0.42rem', color: 'rgba(196,181,253,0.70)', letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'monospace', display: 'block', marginBottom: 3 }}>BHAVANA · MOOD MIRROR</span>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'rgba(255,255,255,0.95)', fontFamily: "'Outfit',sans-serif" }}>Prana Wave</h3>
                </div>
                {todayMood && (
                    <div style={{
                        padding: '0.35rem 0.8rem',
                        background: `${MOOD_COLORS[todayMood.mood]}22`,
                        border: `1px solid ${MOOD_COLORS[todayMood.mood]}44`,
                        borderRadius: 99,
                        fontSize: '0.60rem',
                        color: MOOD_COLORS[todayMood.mood],
                        fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                        <span>{MOOD_EMOJI[todayMood.mood]}</span>
                        <span>Today: {todayMood.mood}</span>
                    </div>
                )}
            </div>

            {/* Animated wave canvas */}
            <PranaWaveCanvas data={data} />

            {/* Day labels + mood dots */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7, marginBottom: '0.85rem', paddingInline: 2 }}>
                {data.map(d => (
                    <div key={d.day} style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: MOOD_COLORS[d.mood] || '#60a5fa', margin: '0 auto 3px' }} />
                        <span style={{ fontSize: '0.40rem', color: 'rgba(255,255,255,0.36)', fontFamily: 'monospace' }}>{d.day}</span>
                    </div>
                ))}
            </div>

            {/* Insight callout */}
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{
                    padding: '0.75rem 0.9rem',
                    background: 'rgba(139,92,246,0.10)',
                    border: '1px solid rgba(139,92,246,0.24)',
                    borderRadius: 12,
                    display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
                }}
            >
                <span style={{ fontSize: '0.85rem', flexShrink: 0, color: '#a78bfa' }}>✦</span>
                <p style={{ margin: 0, fontSize: '0.66rem', color: 'rgba(221,214,254,0.84)', lineHeight: 1.65, fontStyle: 'italic' }}>
                    {insight || defaultInsight}
                </p>
            </motion.div>
        </div>
    );
}
