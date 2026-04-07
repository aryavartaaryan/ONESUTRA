'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLifestyleStore } from '@/stores/lifestyleStore';
import { getToday } from '@/stores/lifestyleStore';
import type { GunaLog } from '@/stores/lifestyleStore';

// ─── Guna Definitions ─────────────────────────────────────────────────────────

const GUNA_INFO = {
    sattva: {
        name: 'Sattva',
        color: '#fbbf24',
        emoji: '☀️',
        quality: 'Clarity · Harmony · Wisdom',
        description: 'Purity, light, and balanced awareness. The sattvic mind is clear, compassionate, and present.',
        emotions: ['Peace', 'Gratitude', 'Clarity', 'Inspiration', 'Devotion'],
    },
    rajas: {
        name: 'Rajas',
        color: '#fb923c',
        emoji: '🔥',
        quality: 'Activity · Passion · Desire',
        description: 'Dynamic energy, ambition, and action. Excess Rajas leads to restlessness and agitation.',
        emotions: ['Ambition', 'Restlessness', 'Desire', 'Anxiety', 'Urgency'],
    },
    tamas: {
        name: 'Tamas',
        color: '#818cf8',
        emoji: '🌑',
        quality: 'Inertia · Lethargy · Darkness',
        description: 'Stability when balanced; dullness and ignorance when excess. Grounds the nervous system.',
        emotions: ['Fatigue', 'Attachment', 'Resistance', 'Dullness', 'Grounding'],
    },
};

const DOMINANT_EMOTIONS = [
    { label: 'Peace', guna: 'sattva' },
    { label: 'Gratitude', guna: 'sattva' },
    { label: 'Clarity', guna: 'sattva' },
    { label: 'Joy', guna: 'sattva' },
    { label: 'Ambition', guna: 'rajas' },
    { label: 'Restless', guna: 'rajas' },
    { label: 'Anxious', guna: 'rajas' },
    { label: 'Anger', guna: 'rajas' },
    { label: 'Fatigue', guna: 'tamas' },
    { label: 'Dull', guna: 'tamas' },
    { label: 'Withdrawn', guna: 'tamas' },
    { label: 'Attached', guna: 'tamas' },
];

// DOSHA correlations from emotional state
const DOSHA_FROM_EMOTION: Record<string, { dosha: string; color: string; remedy: string }> = {
    Anxious: { dosha: 'Vata', color: '#a78bfa', remedy: 'Warm sesame oil, grounding foods, gentle yoga' },
    Restless: { dosha: 'Vata', color: '#a78bfa', remedy: 'Root vegetables, routine, Nadi Shodhana' },
    Anger: { dosha: 'Pitta', color: '#fb923c', remedy: 'Cooling foods, coconut oil, Sheetali pranayama' },
    Ambition: { dosha: 'Pitta', color: '#fb923c', remedy: 'Rest, Santosha practice, cooling walks' },
    Fatigue: { dosha: 'Kapha', color: '#4ade80', remedy: 'Light foods, Kapalabhati, stimulating asanas' },
    Dull: { dosha: 'Kapha', color: '#4ade80', remedy: 'Ginger tea, vigorous movement, social connection' },
    Withdrawn: { dosha: 'Kapha', color: '#4ade80', remedy: 'Invigorating pranayama, spicy foods, variety' },
};

// ─── Triangle SVG ─────────────────────────────────────────────────────────────

function GunaTriangle({ sattva, rajas, tamas }: { sattva: number; rajas: number; tamas: number }) {
    const total = sattva + rajas + tamas || 1;
    const sP = sattva / total;
    const rP = rajas / total;
    const tP = tamas / total;

    // Triangle vertices: Sattva top-center, Rajas bottom-left, Tamas bottom-right
    const cx = 120, cy = 120;
    const R = 90;
    const vS = { x: cx + R * Math.cos(-Math.PI / 2), y: cy + R * Math.sin(-Math.PI / 2) };       // top
    const vR = { x: cx + R * Math.cos(-Math.PI / 2 + (2 * Math.PI / 3)), y: cy + R * Math.sin(-Math.PI / 2 + (2 * Math.PI / 3)) }; // bottom-left
    const vT = { x: cx + R * Math.cos(-Math.PI / 2 + (4 * Math.PI / 3)), y: cy + R * Math.sin(-Math.PI / 2 + (4 * Math.PI / 3)) }; // bottom-right

    // Barycentric → Cartesian: point = sP*vS + rP*vR + tP*vT
    const px = sP * vS.x + rP * vR.x + tP * vT.x;
    const py = sP * vS.y + rP * vR.y + tP * vT.y;

    return (
        <svg width={240} height={240} viewBox="0 0 240 240" style={{ display: 'block', margin: '0 auto' }}>
            <defs>
                <radialGradient id="triGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* Background triangle fill */}
            <polygon
                points={`${vS.x},${vS.y} ${vR.x},${vR.y} ${vT.x},${vT.y}`}
                fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth={1.5}
            />

            {/* Gradient colored triangles from centroid */}
            {/* Sattva zone */}
            <polygon points={`${cx},${cy} ${vS.x},${vS.y} ${vR.x},${vR.y}`} fill="rgba(251,191,36,0.08)" />
            <polygon points={`${cx},${cy} ${vS.x},${vS.y} ${vT.x},${vT.y}`} fill="rgba(251,191,36,0.08)" />
            {/* Rajas zone */}
            <polygon points={`${cx},${cy} ${vR.x},${vR.y} ${vT.x},${vT.y}`} fill="rgba(251,146,60,0.08)" />

            {/* Spine lines from centroid */}
            {[vS, vR, vT].map((v, i) => (
                <line key={i} x1={cx} y1={cy} x2={v.x} y2={v.y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="3 3" />
            ))}

            {/* Glow pulse */}
            <circle cx={px} cy={py} r={22} fill="url(#triGlow)" />

            {/* Moving dot */}
            <motion.circle
                cx={px} cy={py} r={10}
                animate={{ cx: px, cy: py }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                fill="rgba(255,255,255,0.95)"
                style={{ filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.9))' }}
            />
            <motion.circle
                cx={px} cy={py} r={4}
                animate={{ cx: px, cy: py }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                fill="#fbbf24"
            />

            {/* Vertex labels */}
            <text x={vS.x} y={vS.y - 14} textAnchor="middle" fontSize={11} fill="#fbbf24" fontFamily="'Outfit', sans-serif" fontWeight={800}>☀️ Sattva</text>
            <text x={vR.x - 6} y={vR.y + 18} textAnchor="middle" fontSize={11} fill="#fb923c" fontFamily="'Outfit', sans-serif" fontWeight={800}>🔥 Rajas</text>
            <text x={vT.x + 6} y={vT.y + 18} textAnchor="middle" fontSize={11} fill="#818cf8" fontFamily="'Outfit', sans-serif" fontWeight={800}>🌑 Tamas</text>

            {/* Percentage labels near vertices */}
            <text x={vS.x} y={vS.y + 14} textAnchor="middle" fontSize={9} fill="rgba(251,191,36,0.7)" fontFamily="'Outfit', sans-serif">{Math.round(sP * 100)}%</text>
            <text x={vR.x} y={vR.y - 6} textAnchor="middle" fontSize={9} fill="rgba(251,146,60,0.7)" fontFamily="'Outfit', sans-serif">{Math.round(rP * 100)}%</text>
            <text x={vT.x} y={vT.y - 6} textAnchor="middle" fontSize={9} fill="rgba(129,140,248,0.7)" fontFamily="'Outfit', sans-serif">{Math.round(tP * 100)}%</text>
        </svg>
    );
}

// ─── Guna Slider ──────────────────────────────────────────────────────────────

function GunaSlider({ guna, value, onChange }: {
    guna: 'sattva' | 'rajas' | 'tamas';
    value: number;
    onChange: (v: number) => void;
}) {
    const info = GUNA_INFO[guna];
    return (
        <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>{info.emoji}</span> {info.name}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: info.color, fontFamily: "'Outfit', sans-serif" }}>{value}</span>
            </div>
            <p style={{ margin: '0 0 0.4rem', fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>{info.quality}</p>
            <input
                type="range" min={0} max={100} step={5} value={value}
                onChange={e => onChange(Number(e.target.value))}
                style={{
                    width: '100%', appearance: 'none', height: 5, borderRadius: 3,
                    background: `linear-gradient(90deg, ${info.color} ${value}%, rgba(255,255,255,0.1) ${value}%)`,
                    outline: 'none', cursor: 'pointer',
                }}
            />
        </div>
    );
}

// ─── Main GunaTracker Component ───────────────────────────────────────────────

interface GunaTrackerProps {
    onClose?: () => void;
    minimal?: boolean;
}

export default function GunaTracker({ onClose, minimal = false }: GunaTrackerProps) {
    const logGuna = useLifestyleStore(s => s.logGuna);
    const gunaLogs = useLifestyleStore(s => s.gunaLogs);
    const today = getToday();
    const existingLog = gunaLogs.find(l => l.date === today);

    const [sattva, setSattva] = useState(existingLog?.sattva ?? 50);
    const [rajas, setRajas] = useState(existingLog?.rajas ?? 30);
    const [tamas, setTamas] = useState(existingLog?.tamas ?? 20);
    const [selectedEmotion, setSelectedEmotion] = useState(existingLog?.dominantEmotion ?? '');
    const [note, setNote] = useState('');
    const [saved, setSaved] = useState(false);

    const dominant = sattva >= rajas && sattva >= tamas ? 'sattva' : rajas >= tamas ? 'rajas' : 'tamas';
    const dominantInfo = GUNA_INFO[dominant];
    const doshaLink = DOSHA_FROM_EMOTION[selectedEmotion];

    const handleSave = useCallback(() => {
        const log: GunaLog = {
            date: today,
            sattva,
            rajas,
            tamas,
            dominantEmotion: selectedEmotion || undefined,
            note: note || undefined,
            loggedAt: Date.now(),
        };
        logGuna(log);
        setSaved(true);
        setTimeout(() => { setSaved(false); onClose?.(); }, 1200);
    }, [sattva, rajas, tamas, selectedEmotion, note, today, logGuna, onClose]);

    return (
        <div style={{ fontFamily: "'Outfit', sans-serif" }}>
            {!minimal && (
                <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{ margin: '0 0 0.15rem', fontSize: '1rem', fontWeight: 900, color: '#fff' }}>Guna Tracker</h3>
                    <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.38)' }}>Where is your mental field today?</p>
                </div>
            )}

            {/* Triangle */}
            <div style={{ marginBottom: '0.5rem' }}>
                <GunaTriangle sattva={sattva} rajas={rajas} tamas={tamas} />
            </div>

            {/* Dominant state badge */}
            <motion.div
                key={dominant}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 0.75rem', borderRadius: 10, marginBottom: '1.1rem',
                    background: `${dominantInfo.color}12`, border: `1px solid ${dominantInfo.color}30`,
                }}
            >
                <span style={{ fontSize: '1rem' }}>{dominantInfo.emoji}</span>
                <div>
                    <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 800, color: dominantInfo.color }}>{dominantInfo.name} dominant</p>
                    <p style={{ margin: 0, fontSize: '0.6rem', color: 'rgba(255,255,255,0.38)' }}>{dominantInfo.description.slice(0, 70)}…</p>
                </div>
            </motion.div>

            {/* Sliders */}
            <GunaSlider guna="sattva" value={sattva} onChange={setSattva} />
            <GunaSlider guna="rajas" value={rajas} onChange={setRajas} />
            <GunaSlider guna="tamas" value={tamas} onChange={setTamas} />

            {/* Emotion tags */}
            <p style={{ margin: '0.5rem 0 0.4rem', fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Dominant emotion today</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.85rem' }}>
                {DOMINANT_EMOTIONS.map(e => (
                    <motion.button key={e.label} whileTap={{ scale: 0.88 }}
                        onClick={() => setSelectedEmotion(prev => prev === e.label ? '' : e.label)}
                        style={{
                            padding: '0.22rem 0.6rem', borderRadius: 999, cursor: 'pointer', fontSize: '0.65rem',
                            fontFamily: "'Outfit', sans-serif", fontWeight: 600,
                            background: selectedEmotion === e.label
                                ? `${GUNA_INFO[e.guna as keyof typeof GUNA_INFO].color}25`
                                : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${selectedEmotion === e.label
                                ? GUNA_INFO[e.guna as keyof typeof GUNA_INFO].color + '55'
                                : 'rgba(255,255,255,0.08)'}`,
                            color: selectedEmotion === e.label
                                ? GUNA_INFO[e.guna as keyof typeof GUNA_INFO].color
                                : 'rgba(255,255,255,0.42)',
                        }}>
                        {e.label}
                    </motion.button>
                ))}
            </div>

            {/* Dosha link */}
            <AnimatePresence>
                {doshaLink && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        style={{
                            padding: '0.6rem 0.8rem', borderRadius: 10, marginBottom: '0.85rem',
                            background: `${doshaLink.color}10`, border: `1px solid ${doshaLink.color}28`,
                        }}
                    >
                        <p style={{ margin: '0 0 0.2rem', fontSize: '0.65rem', fontWeight: 700, color: doshaLink.color }}>
                            🌿 {selectedEmotion} → elevated {doshaLink.dosha}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.6rem', color: 'rgba(255,255,255,0.45)' }}>{doshaLink.remedy}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Note */}
            <textarea
                value={note} onChange={e => setNote(e.target.value)}
                placeholder="Any reflection on the quality of your mind today… (optional)"
                rows={2}
                style={{
                    width: '100%', padding: '0.65rem', borderRadius: 10, marginBottom: '0.85rem',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                    color: '#fff', fontSize: '0.75rem', fontFamily: "'Outfit', sans-serif",
                    outline: 'none', resize: 'none', boxSizing: 'border-box',
                }}
            />

            {/* Save button */}
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
                style={{
                    width: '100%', padding: '0.9rem', borderRadius: 14, border: 'none',
                    background: saved
                        ? 'linear-gradient(135deg, #4ade80, #22d3ee)'
                        : 'linear-gradient(135deg, #fbbf24, #f97316)',
                    color: '#000', fontWeight: 900, fontSize: '0.88rem',
                    fontFamily: "'Outfit', sans-serif", cursor: 'pointer',
                }}>
                {saved ? '✓ Guna log saved' : 'Save Guna Log'}
            </motion.button>
        </div>
    );
}
