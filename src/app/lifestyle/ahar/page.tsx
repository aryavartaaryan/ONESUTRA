'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { useDoshaEngine } from '@/hooks/useDoshaEngine';

// ─── The 6 Rasas ─────────────────────────────────────────────────────────────

const RASAS = [
    {
        id: 'madhura', name: 'Madhura', english: 'Sweet', emoji: '🍯',
        color: '#fbbf24', element: 'Earth + Water',
        dosha: 'Pacifies Vata + Pitta', aggravates: 'Kapha',
        foods: ['Rice', 'Milk', 'Ghee', 'Dates', 'Sweet potato', 'Wheat'],
        quality: 'Nourishing, building, grounding — the foundation of Ojas',
    },
    {
        id: 'amla', name: 'Amla', english: 'Sour', emoji: '🍋',
        color: '#a3e635', element: 'Earth + Fire',
        dosha: 'Pacifies Vata', aggravates: 'Pitta + Kapha',
        foods: ['Lemon', 'Tamarind', 'Yogurt', 'Amla', 'Fermented foods'],
        quality: 'Stimulates Agni, improves taste, increases salivation',
    },
    {
        id: 'lavana', name: 'Lavana', english: 'Salty', emoji: '🧂',
        color: '#60a5fa', element: 'Water + Fire',
        dosha: 'Pacifies Vata', aggravates: 'Pitta + Kapha',
        foods: ['Rock salt', 'Sea vegetables', 'Pickles', 'Salted nuts'],
        quality: 'Retains water, lubricates tissues, softens body',
    },
    {
        id: 'katu', name: 'Katu', english: 'Pungent', emoji: '🌶️',
        color: '#f87171', element: 'Fire + Air',
        dosha: 'Pacifies Kapha', aggravates: 'Vata + Pitta',
        foods: ['Ginger', 'Black pepper', 'Chili', 'Mustard', 'Onion', 'Garlic'],
        quality: 'Stimulates digestion, breaks congestion, clears channels',
    },
    {
        id: 'tikta', name: 'Tikta', english: 'Bitter', emoji: '🌿',
        color: '#4ade80', element: 'Air + Space',
        dosha: 'Pacifies Pitta + Kapha', aggravates: 'Vata',
        foods: ['Neem', 'Bitter gourd', 'Turmeric', 'Fenugreek', 'Green tea'],
        quality: 'Detoxifying, cooling, reduces fat and fever',
    },
    {
        id: 'kashaya', name: 'Kashaya', english: 'Astringent', emoji: '🍵',
        color: '#a78bfa', element: 'Air + Earth',
        dosha: 'Pacifies Pitta + Kapha', aggravates: 'Vata',
        foods: ['Pomegranate', 'Unripe banana', 'Lentils', 'Triphala', 'Cranberries'],
        quality: 'Binding, drying, tones tissues, reduces inflammation',
    },
];

// ─── Hexagon SVG ──────────────────────────────────────────────────────────────

function RasaHexagon({ counts }: { counts: Record<string, number> }) {
    const cx = 120, cy = 115, maxR = 80;
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;

    const points = RASAS.map((rasa, i) => {
        const angle = (i / 6) * 2 * Math.PI - Math.PI / 2;
        const pct = (counts[rasa.id] ?? 0) / total;
        const r = 20 + pct * (maxR - 20); // min radius 20
        return {
            x: cx + r * Math.cos(angle),
            y: cy + r * Math.sin(angle),
            labelX: cx + (maxR + 18) * Math.cos(angle),
            labelY: cy + (maxR + 18) * Math.sin(angle),
            rasa,
        };
    });

    const polyPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';

    return (
        <svg width={240} height={230} viewBox="0 0 240 230" style={{ display: 'block', margin: '0 auto' }}>
            {/* Background hexagon grid */}
            {[0.25, 0.5, 0.75, 1].map(scale => {
                const bg = RASAS.map((_, i) => {
                    const angle = (i / 6) * 2 * Math.PI - Math.PI / 2;
                    return `${(cx + maxR * scale * Math.cos(angle)).toFixed(1)},${(cy + maxR * scale * Math.sin(angle)).toFixed(1)}`;
                }).join(' ');
                return <polygon key={scale} points={bg} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={scale === 1 ? 1.5 : 1} />;
            })}

            {/* Spokes */}
            {RASAS.map((_, i) => {
                const angle = (i / 6) * 2 * Math.PI - Math.PI / 2;
                return (
                    <line key={i}
                        x1={cx} y1={cy}
                        x2={cx + maxR * Math.cos(angle)} y2={cy + maxR * Math.sin(angle)}
                        stroke="rgba(255,255,255,0.05)" strokeWidth={1}
                    />
                );
            })}

            {/* Data polygon */}
            <motion.path
                d={polyPath}
                fill="rgba(251,191,36,0.12)"
                stroke="#fbbf24"
                strokeWidth={2}
                strokeLinejoin="round"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ transformOrigin: `${cx}px ${cy}px`, filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.4))' }}
            />

            {/* Data points */}
            {points.map(({ x, y, rasa }) => (
                <circle key={rasa.id} cx={x} cy={y} r={4} fill={rasa.color} style={{ filter: `drop-shadow(0 0 4px ${rasa.color})` }} />
            ))}

            {/* Labels */}
            {points.map(({ labelX, labelY, rasa }) => (
                <g key={`label-${rasa.id}`}>
                    <text x={labelX} y={labelY - 4} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={rasa.color} fontFamily="'Outfit', sans-serif">{rasa.emoji}</text>
                    <text x={labelX} y={labelY + 8} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.5)" fontFamily="'Outfit', sans-serif">{rasa.english}</text>
                </g>
            ))}

            {/* Center */}
            <circle cx={cx} cy={cy} r={6} fill="rgba(251,191,36,0.3)" stroke="#fbbf24" strokeWidth={1.5} />
        </svg>
    );
}

// ─── Meal Log State ────────────────────────────────────────────────────────────

const AHAR_LOG_KEY = 'onesutra_ahar_v1';

function loadAharLog(): Record<string, Record<string, number>> {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem(AHAR_LOG_KEY) ?? '{}'); } catch { return {}; }
}

function saveAharLog(data: Record<string, Record<string, number>>) {
    localStorage.setItem(AHAR_LOG_KEY, JSON.stringify(data));
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AharPage() {
    const router = useRouter();
    const { prakriti } = useDoshaEngine();
    const [isMounted, setIsMounted] = useState(false);
    const [allLogs, setAllLogs] = useState<Record<string, Record<string, number>>>({});
    const [showAdd, setShowAdd] = useState(false);
    const [mealCounts, setMealCounts] = useState<Record<string, number>>({});
    const [expandedRasa, setExpandedRasa] = useState<string | null>(null);

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const logs = loadAharLog();
        setAllLogs(logs);
        setMealCounts(logs[today] ?? {});
        setIsMounted(true);
    }, [today]);

    const incrementRasa = useCallback((rasaId: string) => {
        setMealCounts(prev => {
            const updated = { ...prev, [rasaId]: (prev[rasaId] ?? 0) + 1 };
            const newLogs = { ...allLogs, [today]: updated };
            saveAharLog(newLogs);
            setAllLogs(newLogs);
            return updated;
        });
    }, [allLogs, today]);

    const decrementRasa = useCallback((rasaId: string) => {
        setMealCounts(prev => {
            const updated = { ...prev, [rasaId]: Math.max(0, (prev[rasaId] ?? 0) - 1) };
            const newLogs = { ...allLogs, [today]: updated };
            saveAharLog(newLogs);
            setAllLogs(newLogs);
            return updated;
        });
    }, [allLogs, today]);

    // Which rasas to emphasize for this prakriti
    const recommended: string[] = prakriti
        ? ({ vata: ['madhura', 'amla', 'lavana'], pitta: ['madhura', 'tikta', 'kashaya'], kapha: ['katu', 'tikta', 'kashaya'] }[prakriti.primary] ?? [])
        : [];

    const total = Object.values(mealCounts).reduce((a, b) => a + b, 0);

    if (!isMounted) return null;

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(ellipse at 20% 0%, rgba(74,222,128,0.1) 0%, transparent 55%), #030110',
            paddingBottom: '5rem', fontFamily: "'Outfit', sans-serif",
        }}>
            {/* Header */}
            <div style={{ padding: '1.25rem 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>Ahar Vigyan</h1>
                    <p style={{ margin: 0, fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)' }}>The Science of Sacred Eating · 6 Rasas</p>
                </div>
            </div>

            <div style={{ padding: '1rem 1.1rem' }}>

                {/* Wisdom */}
                <div style={{ padding: '0.7rem 1rem', borderRadius: 14, marginBottom: '1rem', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
                    <p style={{ margin: '0 0 0.2rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)', fontStyle: 'italic' }}>
                        "Āhāra's six rasas should be present in every proper meal — each taste nourishes a different layer of the body."
                    </p>
                    <p style={{ margin: 0, fontSize: '0.58rem', color: 'rgba(251,191,36,0.6)', fontWeight: 700 }}>— Charaka Samhita, Sutrasthana</p>
                </div>

                {/* Hexagon chart */}
                <div style={{ marginBottom: '0.5rem' }}>
                    <RasaHexagon counts={mealCounts} />
                </div>

                {/* Total count */}
                <p style={{ textAlign: 'center', margin: '0 0 1rem', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>
                    {total > 0 ? `${total} servings logged today` : 'Log your meals by tapping a Rasa below'}
                </p>

                {/* Prakriti recommendation */}
                {prakriti && recommended.length > 0 && (
                    <div style={{ padding: '0.6rem 0.85rem', borderRadius: 12, marginBottom: '0.85rem', background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.2)' }}>
                        <p style={{ margin: '0 0 0.2rem', fontSize: '0.6rem', fontWeight: 800, color: '#fb923c', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            For Your {prakriti.primary.charAt(0).toUpperCase() + prakriti.primary.slice(1)} Constitution
                        </p>
                        <p style={{ margin: 0, fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)' }}>
                            Emphasize: {recommended.map(id => RASAS.find(r => r.id === id)?.english).filter(Boolean).join(' · ')}
                        </p>
                    </div>
                )}

                {/* Rasa cards */}
                {RASAS.map(rasa => {
                    const count = mealCounts[rasa.id] ?? 0;
                    const isRecommended = recommended.includes(rasa.id);
                    const isExpanded = expandedRasa === rasa.id;
                    return (
                        <motion.div key={rasa.id} layout style={{ marginBottom: '0.55rem' }}>
                            <div
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    padding: '0.75rem 0.9rem', borderRadius: 16,
                                    background: count > 0 ? `${rasa.color}10` : 'rgba(255,255,255,0.03)',
                                    border: `1.5px solid ${count > 0 ? rasa.color + '35' : 'rgba(255,255,255,0.07)'}`,
                                    cursor: 'pointer',
                                }}
                                onClick={() => setExpandedRasa(isExpanded ? null : rasa.id)}
                            >
                                <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{rasa.emoji}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: 2 }}>
                                        <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#fff' }}>{rasa.name}</p>
                                        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>· {rasa.english}</span>
                                        {isRecommended && <span style={{ fontSize: '0.55rem', padding: '0.08rem 0.4rem', borderRadius: 999, background: `${rasa.color}20`, border: `1px solid ${rasa.color}40`, color: rasa.color, fontWeight: 700 }}>Rec.</span>}
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.6rem', color: 'rgba(255,255,255,0.32)' }}>{rasa.element} · {rasa.dosha}</p>
                                </div>
                                {/* Counter */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                                    <motion.button whileTap={{ scale: 0.85 }} onClick={() => decrementRasa(rasa.id)} disabled={count === 0}
                                        style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${rasa.color}40`, background: 'rgba(255,255,255,0.04)', color: rasa.color, cursor: count > 0 ? 'pointer' : 'default', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: count > 0 ? 1 : 0.3 }}>−</motion.button>
                                    <span style={{ minWidth: 20, textAlign: 'center', fontSize: '0.88rem', fontWeight: 900, color: count > 0 ? rasa.color : 'rgba(255,255,255,0.2)', fontFamily: "'Outfit', sans-serif" }}>{count}</span>
                                    <motion.button whileTap={{ scale: 0.85 }} onClick={() => incrementRasa(rasa.id)}
                                        style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${rasa.color}40`, background: `${rasa.color}12`, color: rasa.color, cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</motion.button>
                                </div>
                            </div>

                            {/* Expanded detail */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                        style={{ overflow: 'hidden', paddingLeft: '0.5rem' }}
                                    >
                                        <div style={{ padding: '0.65rem 0.85rem', borderRadius: '0 0 14px 14px', background: `${rasa.color}07`, border: `1px solid ${rasa.color}20`, borderTop: 'none', marginTop: -4 }}>
                                            <p style={{ margin: '0 0 0.4rem', fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{rasa.quality}</p>
                                            <p style={{ margin: '0 0 0.3rem', fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Foods</p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                                {rasa.foods.map(f => (
                                                    <span key={f} style={{ padding: '0.15rem 0.45rem', borderRadius: 999, fontSize: '0.6rem', background: `${rasa.color}12`, border: `1px solid ${rasa.color}25`, color: rasa.color, fontWeight: 600 }}>{f}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}

                {/* Week history */}
                <div style={{ marginTop: '1.5rem' }}>
                    <p style={{ margin: '0 0 0.6rem', fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>7-day Rasa Balance</p>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {Array.from({ length: 7 }, (_, i) => {
                            const d = new Date(); d.setDate(d.getDate() - (6 - i));
                            const dStr = d.toISOString().split('T')[0];
                            const dayLog = allLogs[dStr] ?? {};
                            const dayTotal = Object.values(dayLog).reduce((a, b) => a + b, 0);
                            const isToday = dStr === today;
                            return (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                                    <div style={{ width: '100%', height: 42, borderRadius: 6, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', position: 'relative' }}>
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${Math.min(100, dayTotal * 10)}%` }}
                                            transition={{ duration: 0.8, delay: i * 0.06 }}
                                            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: isToday ? '#fbbf24' : 'rgba(251,191,36,0.35)', borderRadius: 6 }}
                                        />
                                    </div>
                                    <span style={{ fontSize: '0.42rem', color: isToday ? '#fbbf24' : 'rgba(255,255,255,0.25)', fontFamily: "'Outfit', sans-serif", fontWeight: isToday ? 800 : 400 }}>
                                        {d.toLocaleDateString('en', { weekday: 'narrow' })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
