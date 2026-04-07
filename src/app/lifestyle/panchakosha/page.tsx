'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, Leaf, Wind, Brain, Eye, Heart, Plus } from 'lucide-react';
import { useLifestyleStore } from '@/stores/lifestyleStore';
import { useDoshaEngine } from '@/hooks/useDoshaEngine';
import { getToday } from '@/stores/lifestyleStore';

// ─── Kosha Data ──────────────────────────────────────────────────────────────

interface KoshaConfig {
    id: string;
    name: string;
    sanskrit: string;
    element: string;
    color: string;
    gradient: string;
    icon: React.ReactNode;
    description: string;
    practices: string[];
    questions: string[];
}

const KOSHAS: KoshaConfig[] = [
    {
        id: 'annamaya',
        name: 'Physical Body',
        sanskrit: 'Annamaya Kosha',
        element: '🌍 Earth',
        color: '#4ade80',
        gradient: 'linear-gradient(135deg, rgba(74,222,128,0.2), rgba(16,185,129,0.08))',
        icon: <Leaf size={22} />,
        description: 'The food body — nourished by what you eat, how you move, and how you rest.',
        practices: ['Mindful eating', 'Yoga asanas', 'Pranayama', 'Adequate sleep', 'Abhyanga'],
        questions: ['Did I eat mindfully today?', 'Did I move my body?', 'Did I sleep 7–8 hours?'],
    },
    {
        id: 'pranamaya',
        name: 'Energy Body',
        sanskrit: 'Pranamaya Kosha',
        element: '💨 Air',
        color: '#22d3ee',
        gradient: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(6,182,212,0.08))',
        icon: <Wind size={22} />,
        description: 'The breath body — the bridge between physical and mental. Prana flows through 72,000 nadis.',
        practices: ['Pranayama', 'Nadi Shodhana', 'Kapalabhati', 'Nature walks', 'Sunlight'],
        questions: ['Did I practise breathwork today?', 'Is my energy stable or erratic?', 'Did I spend time outdoors?'],
    },
    {
        id: 'manomaya',
        name: 'Mental Body',
        sanskrit: 'Manomaya Kosha',
        element: '🌊 Water',
        color: '#a78bfa',
        gradient: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(139,92,246,0.08))',
        icon: <Brain size={22} />,
        description: 'The mind body — thoughts, emotions, memories. Governed by the three Gunas.',
        practices: ['Meditation', 'Journaling', 'Guna tracking', 'Mantra japa', 'Sattvic diet'],
        questions: ['Was my mind predominantly Sattvic?', 'Did I respond or react today?', 'Did I journal?'],
    },
    {
        id: 'vijnanamaya',
        name: 'Wisdom Body',
        sanskrit: 'Vijnanamaya Kosha',
        element: '🔥 Fire',
        color: '#fbbf24',
        gradient: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.08))',
        icon: <Eye size={22} />,
        description: 'The intellect body — discernment, intuition, and the wisdom to see beyond appearances.',
        practices: ['Svadhyaya (self-study)', 'Sutra study', 'Evening reflection', 'Silent contemplation'],
        questions: ['Did I align with my Dharma today?', 'Did I read or study wisdom?', 'Was I the observer?'],
    },
    {
        id: 'anandamaya',
        name: 'Bliss Body',
        sanskrit: 'Anandamaya Kosha',
        element: '✨ Space',
        color: '#f472b6',
        gradient: 'linear-gradient(135deg, rgba(244,114,182,0.2), rgba(236,72,153,0.08))',
        icon: <Heart size={22} />,
        description: 'The causal body — the seat of Ananda (bliss), beyond individual identity.',
        practices: ['Deep meditation', 'Gratitude', 'Flow states', 'Service (Seva)', 'Silence'],
        questions: ['Did I experience joy without reason?', 'Did I express gratitude?', 'Did I meditate deeply?'],
    },
];

// ─── Kosha Score Calculator ───────────────────────────────────────────────────

function useKoshaScores() {
    const store = useLifestyleStore();
    const today = getToday();
    const { metrics } = useDoshaEngine();

    const todayHabitLogs = store.habitLogs.filter(l => l.date === today && l.completed);
    const todayHabitIds = new Set(todayHabitLogs.map(l => l.habitId));
    const activeHabits = store.habits.filter(h => h.isActive);

    const physicalHabits = activeHabits.filter(h => h.lifeArea === 'physical');
    const spiritualHabits = activeHabits.filter(h => h.lifeArea === 'spiritual');
    const mentalHabits = activeHabits.filter(h => h.lifeArea === 'mental');

    const completedPhysical = physicalHabits.filter(h => todayHabitIds.has(h.id)).length;
    const completedSpiritual = spiritualHabits.filter(h => todayHabitIds.has(h.id)).length;
    const completedMental = mentalHabits.filter(h => todayHabitIds.has(h.id)).length;

    const physScore = physicalHabits.length ? Math.round((completedPhysical / physicalHabits.length) * 100) : 0;
    const spirScore = spiritualHabits.length ? Math.round((completedSpiritual / spiritualHabits.length) * 100) : 0;
    const mentScore = mentalHabits.length ? Math.round((completedMental / mentalHabits.length) * 100) : 0;

    const todayMood = store.moodLogs.find(l => l.date === today);
    const todayGuna = store.gunaLogs.find(l => l.date === today);
    const todayJournal = store.journalEntries.find(e => e.date === today);
    const todayBreath = store.breathingSessions.filter(s => s.date === today).length;
    const todayMedit = store.meditationSessions.filter(s => s.date === today).length;

    return {
        annamaya: physScore,
        pranamaya: Math.min(100, (todayBreath > 0 ? 50 : 0) + ((metrics as any)?.agniStrength ?? 0) * 0.5),
        manomaya: Math.round(
            (todayMood ? 30 : 0) +
            (todayGuna ? 40 : 0) +
            (mentScore * 0.3)
        ),
        vijnanamaya: Math.round(
            (todayJournal ? 60 : 0) +
            (spirScore * 0.4)
        ),
        anandamaya: Math.round(
            (todayMedit > 0 ? 50 : 0) +
            (todayMood?.mood != null && todayMood.mood >= 4 ? 30 : 0) +
            ((todayGuna?.sattva ?? 0) * 0.2)
        ),
    };
}

// ─── Kosha Arc Visual ─────────────────────────────────────────────────────────

function KoshaArc({ score, color, size = 56 }: { score: number; color: string; size?: number }) {
    const r = size / 2 - 5;
    const circ = 2 * Math.PI * r;
    const offset = circ - (score / 100) * circ;
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4.5} />
            <motion.circle
                cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={color} strokeWidth={4.5} strokeLinecap="round"
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.4, ease: 'easeOut' }}
                style={{ filter: `drop-shadow(0 0 5px ${color}88)` }}
            />
        </svg>
    );
}

// ─── Kosha Card ───────────────────────────────────────────────────────────────

function KoshaCard({ kosha, score, index }: { kosha: KoshaConfig; score: number; index: number }) {
    const [expanded, setExpanded] = useState(false);
    const label = score >= 80 ? 'Thriving' : score >= 50 ? 'Nourished' : score >= 20 ? 'Needs care' : 'Dormant';
    const labelColor = score >= 80 ? '#4ade80' : score >= 50 ? '#fbbf24' : score >= 20 ? '#fb923c' : '#f87171';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            onClick={() => setExpanded(e => !e)}
            style={{
                borderRadius: 20,
                background: expanded ? kosha.gradient : 'rgba(0,0,0,0.3)',
                border: `1.5px solid ${expanded ? kosha.color + '45' : 'rgba(255,255,255,0.08)'}`,
                marginBottom: '0.75rem',
                overflow: 'hidden',
                cursor: 'pointer',
                backdropFilter: 'blur(16px)',
                transition: 'background 0.35s, border 0.35s',
                boxShadow: expanded ? `0 8px 32px ${kosha.color}18` : 'none',
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.9rem 1rem' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    <KoshaArc score={score} color={kosha.color} size={56} />
                    <div style={{
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: kosha.color,
                    }}>
                        {kosha.icon}
                    </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 1px', fontSize: '0.68rem', color: kosha.color, fontWeight: 800, fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {kosha.element}
                    </p>
                    <p style={{ margin: '0 0 2px', fontSize: '0.95rem', fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>
                        {kosha.sanskrit}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif" }}>
                        {kosha.name}
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 900, color: kosha.color, fontFamily: "'Outfit', sans-serif" }}>{score}%</span>
                    <span style={{ fontSize: '0.55rem', color: labelColor, fontWeight: 700, fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
                </div>
            </div>

            {/* Expanded content */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{ padding: '0 1rem 1rem', borderTop: `1px solid ${kosha.color}20` }}>
                            <p style={{ margin: '0.75rem 0 0.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.6 }}>
                                {kosha.description}
                            </p>

                            {/* Evening questions */}
                            <div style={{ marginBottom: '0.75rem' }}>
                                <p style={{ margin: '0.6rem 0 0.35rem', fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: "'Outfit', sans-serif" }}>Evening reflection</p>
                                {kosha.questions.map((q, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginBottom: '0.3rem' }}>
                                        <span style={{ color: kosha.color, fontSize: '0.6rem', marginTop: 3 }}>◆</span>
                                        <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}>{q}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Practices */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                {kosha.practices.map((p, i) => (
                                    <span key={i} style={{
                                        padding: '0.2rem 0.55rem', borderRadius: 999, fontSize: '0.6rem',
                                        background: `${kosha.color}15`, border: `1px solid ${kosha.color}30`,
                                        color: kosha.color, fontFamily: "'Outfit', sans-serif", fontWeight: 600,
                                    }}>{p}</span>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─── Overall Radiance Score ────────────────────────────────────────────────────

function RadianceOrb({ scores }: { scores: Record<string, number> }) {
    const vals = Object.values(scores);
    const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    const label = avg >= 80 ? 'Radiant' : avg >= 60 ? 'Flourishing' : avg >= 40 ? 'Awakening' : 'Dormant';
    const color = avg >= 80 ? '#4ade80' : avg >= 60 ? '#fbbf24' : avg >= 40 ? '#fb923c' : '#a78bfa';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '1.5rem 1rem', marginBottom: '1.5rem',
            }}
        >
            <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                {/* Outer glow rings */}
                {[...Array(3)].map((_, i) => (
                    <motion.div key={i}
                        animate={{ scale: [1, 1.15 + i * 0.1, 1], opacity: [0.15, 0.05, 0.15] }}
                        transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.6 }}
                        style={{
                            position: 'absolute', inset: -(i * 14 + 12), borderRadius: '50%',
                            border: `1px solid ${color}`, pointerEvents: 'none',
                        }}
                    />
                ))}

                <svg width={130} height={130} style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx={65} cy={65} r={55} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8} />
                    <motion.circle
                        cx={65} cy={65} r={55} fill="none"
                        stroke={`url(#radianceGrad)`} strokeWidth={8} strokeLinecap="round"
                        strokeDasharray={345.4}
                        initial={{ strokeDashoffset: 345.4 }}
                        animate={{ strokeDashoffset: 345.4 - (avg / 100) * 345.4 }}
                        transition={{ duration: 1.8, ease: 'easeOut' }}
                        style={{ filter: `drop-shadow(0 0 10px ${color}88)` }}
                    />
                    <defs>
                        <linearGradient id="radianceGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f472b6" />
                            <stop offset="50%" stopColor="#fbbf24" />
                            <stop offset="100%" stopColor="#4ade80" />
                        </linearGradient>
                    </defs>
                </svg>

                <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                }}>
                    <span style={{ fontSize: '2rem', fontWeight: 900, color, fontFamily: "'Outfit', sans-serif", lineHeight: 1, textShadow: `0 0 20px ${color}88` }}>{avg}%</span>
                    <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase', letterSpacing: '0.12em' }}>Radiance</span>
                </div>
            </div>

            <p style={{ margin: '0 0 0.25rem', fontSize: '1.15rem', fontWeight: 900, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>{label}</p>
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", textAlign: 'center', maxWidth: 240, lineHeight: 1.5 }}>
                Your five-layer well-being score for today
            </p>

            {/* Mini kosha bars */}
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '1rem', alignItems: 'flex-end' }}>
                {KOSHAS.map(k => {
                    const s = scores[k.id] ?? 0;
                    return (
                        <div key={k.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                            <div style={{ width: 28, height: 46, borderRadius: 6, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', position: 'relative' }}>
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${s}%` }}
                                    transition={{ duration: 1.2, delay: 0.3 }}
                                    style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: k.color, borderRadius: 6, boxShadow: `0 0 8px ${k.color}55` }}
                                />
                            </div>
                            <span style={{ fontSize: '0.42rem', color: k.color, fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>{k.name.split(' ')[0]}</span>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PanchakoshaPage() {
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const scores = useKoshaScores();

    useEffect(() => { setIsMounted(true); }, []);
    if (!isMounted) return null;

    const scoreMap: Record<string, number> = {
        annamaya: scores.annamaya,
        pranamaya: scores.pranamaya,
        manomaya: scores.manomaya,
        vijnanamaya: scores.vijnanamaya,
        anandamaya: scores.anandamaya,
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(ellipse at 30% 0%, rgba(244,114,182,0.1) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(34,211,238,0.07) 0%, transparent 55%), #030110',
            paddingBottom: '5rem',
            fontFamily: "'Outfit', sans-serif",
        }}>

            {/* Header */}
            <div style={{ padding: '1.25rem 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>Panchakosha</h1>
                    <p style={{ margin: 0, fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>Five layers of your Being</p>
                </div>
            </div>

            <div style={{ padding: '1rem 1.1rem' }}>

                {/* Radiance orb */}
                <RadianceOrb scores={scoreMap} />

                {/* Wisdom insert */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                    style={{
                        padding: '0.75rem 1rem', borderRadius: 14, marginBottom: '1rem',
                        background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)',
                    }}
                >
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.6, fontStyle: 'italic' }}>
                        "The five koshas are like sheaths covering the Atman — as each layer is purified and nourished, the inner light shines brighter."
                    </p>
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.58rem', color: 'rgba(251,191,36,0.6)', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>— Taittiriya Upanishad</p>
                </motion.div>

                {/* Kosha cards */}
                {KOSHAS.map((kosha, i) => (
                    <KoshaCard
                        key={kosha.id}
                        kosha={kosha}
                        score={scoreMap[kosha.id] ?? 0}
                        index={i}
                    />
                ))}

                {/* Navigation buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {[
                        { label: 'Track Gunas (Mental Field)', href: '/lifestyle/panchakosha', desc: 'Log Sattva · Rajas · Tamas', color: '#a78bfa' },
                        { label: 'Ahar Vigyan — Food Science', href: '/lifestyle/ahar', desc: 'Track the 6 Rasas', color: '#4ade80' },
                        { label: 'Pranayama Practice', href: '/pranayama', desc: 'Energize the Pranamaya Kosha', color: '#22d3ee' },
                        { label: 'Evening Journal', href: '/journal', desc: 'Nourish the Vijnanamaya Kosha', color: '#fbbf24' },
                    ].map((item) => (
                        <motion.button
                            key={item.href}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => router.push(item.href)}
                            style={{
                                width: '100%', padding: '0.8rem 1rem', borderRadius: 14, cursor: 'pointer',
                                background: `${item.color}08`, border: `1px solid ${item.color}25`,
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}
                        >
                            <div style={{ textAlign: 'left' }}>
                                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontFamily: "'Outfit', sans-serif" }}>{item.label}</p>
                                <p style={{ margin: '1px 0 0', fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>{item.desc}</p>
                            </div>
                            <ChevronRight size={16} style={{ color: item.color, flexShrink: 0 }} />
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
}
