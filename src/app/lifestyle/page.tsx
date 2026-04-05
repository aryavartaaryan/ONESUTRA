'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    Flame, CheckCircle2, Circle, SkipForward, Sparkles, Wind,
    BookOpen, BarChart2, Plus, ArrowLeft, Moon, Sun, Zap,
    Heart, Brain, Dumbbell, Star, TrendingUp, Bell, Target,
    ChevronRight, Award, RefreshCw, MessageCircle,
} from 'lucide-react';
import { useLifestyleEngine } from '@/hooks/useLifestyleEngine';
import { useOneSutraAuth } from '@/hooks/useOneSutraAuth';
import { LEVELS, getLevelFromXP, getNextLevel, getToday, type HabitItem } from '@/stores/lifestyleStore';
import { useDoshaEngine } from '@/hooks/useDoshaEngine';
import { DOSHA_INFO } from '@/lib/doshaService';

// ─── Constants ─────────────────────────────────────────────────────────────────

const DAILY_INTENTIONS = [
    'Let today be a gentle unfolding — one step, one breath, one moment at a time.',
    'You are not behind. You are exactly where you need to be.',
    'Begin with stillness. Everything flows from here.',
    'Today, your only practice is showing up — fully, as you are.',
    'What you water, grows. Water what matters today.',
    'The path is not outside you. It was never outside you.',
    'Progress, not perfection. Presence, not pressure.',
    'Each completed practice is a gift to your future self.',
    'Let your morning rituals be a love letter to the day ahead.',
    'You hold within you the capacity for extraordinary transformation.',
];

const MOOD_OPTIONS = [
    { value: 5, emoji: '🌟', label: 'Radiant', color: '#fbbf24' },
    { value: 4, emoji: '😊', label: 'Good', color: '#4ade80' },
    { value: 3, emoji: '😌', label: 'Okay', color: '#60a5fa' },
    { value: 2, emoji: '😔', label: 'Low', color: '#a78bfa' },
    { value: 1, emoji: '🌧️', label: 'Hard', color: '#f87171' },
];

const ENERGY_OPTIONS = [
    { value: 5, emoji: '⚡', label: 'Electric' },
    { value: 4, emoji: '☀️', label: 'High' },
    { value: 3, emoji: '🌤️', label: 'Medium' },
    { value: 2, emoji: '🌙', label: 'Low' },
    { value: 1, emoji: '💤', label: 'Drained' },
];

const LIFE_AREA_COLORS: Record<string, string> = {
    mental: '#22d3ee',
    physical: '#4ade80',
    social: '#fb923c',
    professional: '#fbbf24',
    financial: '#a78bfa',
    spiritual: '#c084fc',
    creative: '#f472b6',
    sacred: '#fde68a',
};

// ─── Smart contextual cards data ───────────────────────────────────────────────
function getSmartCards(
    completionRate: number,
    streak: number,
    adhdMode: boolean,
    todayMood: { mood: number; energy: number } | null,
    habitCount: number,
): Array<{ icon: string; text: string; cta?: string; ctaHref?: string; color: string }> {
    const cards = [];
    if (completionRate >= 80) cards.push({ icon: '🔥', text: `Incredible — ${completionRate}% of today's practices done. You're building something real.`, color: '#fbbf24' });
    else if (completionRate >= 50) cards.push({ icon: '🌱', text: `Over halfway there. Each check feels better than the last — keep going.`, color: '#4ade80' });
    else if (habitCount === 0) cards.push({ icon: '✨', text: 'Your lifestyle canvas is blank — a beautiful beginning. Add your first practice.', cta: 'Add habits →', ctaHref: '/lifestyle/habits', color: '#a78bfa' });
    else cards.push({ icon: '🌅', text: 'The day is young. Even one practice changes the energy of everything that follows.', color: '#60a5fa' });

    if (streak >= 7) cards.push({ icon: '🔱', text: `${streak}-day streak. You've broken through the hardest part — consistency is now your nature.`, color: '#c084fc' });
    else if (streak >= 3) cards.push({ icon: '💫', text: `${streak} days in a row. You promised yourself something and you're keeping it.`, color: '#fbbf24' });

    if (todayMood && todayMood.mood <= 2) cards.push({ icon: '🌿', text: 'A breathing practice on hard days creates more change than ten practices on easy ones.', cta: 'Breathe →', ctaHref: '/pranayama', color: '#22d3ee' });
    if (todayMood && todayMood.energy >= 4) cards.push({ icon: '⚡', text: `High energy today — this is your window for your deepest practice.`, cta: 'Open Sadhana →', ctaHref: '/sadhana', color: '#4ade80' });

    if (adhdMode) cards.push({ icon: '🎯', text: 'ADHD Mode: One thing at a time. Complete this — then the next. You\'ve got this.', color: '#fb923c' });

    return cards.slice(0, 3);
}

// ─── Circular Progress Ring ────────────────────────────────────────────────────
function ProgressRing({ pct, size = 120, stroke = 8, color = '#fbbf24' }: { pct: number; size?: number; stroke?: number; color?: string }) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
            <motion.circle
                cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={color} strokeWidth={stroke} strokeLinecap="round"
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
            />
        </svg>
    );
}

// ─── Streak Flame ──────────────────────────────────────────────────────────────
function StreakFlame({ count }: { count: number }) {
    if (count === 0) return <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>—</span>;
    const size = count >= 30 ? '1.1rem' : count >= 7 ? '0.95rem' : '0.82rem';
    const color = count >= 30 ? '#f97316' : count >= 7 ? '#fbbf24' : '#fb923c';
    return (
        <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.65rem', color, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
            <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} style={{ fontSize: size, filter: `drop-shadow(0 0 4px ${color}88)` }}>🔥</motion.span>
            {count}
        </span>
    );
}

// ─── Habit Row ─────────────────────────────────────────────────────────────────
function HabitRow({
    habit, isCompleted, isSkipped, streak, adhdMode, onComplete, onSkip,
}: {
    habit: HabitItem; isCompleted: boolean; isSkipped: boolean; streak: number;
    adhdMode: boolean; onComplete: () => void; onSkip: () => void;
}) {
    const [pressed, setPressed] = useState(false);
    const color = LIFE_AREA_COLORS[habit.lifeArea] ?? '#a78bfa';

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            layout
            style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: adhdMode ? '1rem 1rem' : '0.75rem 0.9rem',
                borderRadius: 16,
                background: isCompleted
                    ? `linear-gradient(120deg, ${color}18, rgba(255,255,255,0.04))`
                    : isSkipped
                        ? 'rgba(255,255,255,0.02)'
                        : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isCompleted ? color + '44' : 'rgba(255,255,255,0.08)'}`,
                marginBottom: '0.5rem',
                opacity: isSkipped ? 0.45 : 1,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
            }}
            onTapStart={() => setPressed(true)}
            onTap={() => { setPressed(false); if (!isCompleted && !isSkipped) onComplete(); }}
            onTapCancel={() => setPressed(false)}
            whileTap={{ scale: 0.97 }}
        >
            {/* Check circle */}
            <motion.div
                animate={pressed ? { scale: 1.3 } : { scale: 1 }}
                style={{ flexShrink: 0 }}
            >
                {isCompleted ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                        <CheckCircle2 size={adhdMode ? 28 : 22} style={{ color }} />
                    </motion.div>
                ) : (
                    <Circle size={adhdMode ? 28 : 22} style={{ color: 'rgba(255,255,255,0.25)' }} />
                )}
            </motion.div>

            {/* Icon */}
            <span style={{ fontSize: adhdMode ? '1.4rem' : '1.15rem', flexShrink: 0 }}>{habit.icon}</span>

            {/* Name + category */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    margin: 0, fontSize: adhdMode ? '1rem' : '0.88rem',
                    fontWeight: 600, fontFamily: "'Outfit', sans-serif",
                    color: isCompleted ? color : 'rgba(255,255,255,0.85)',
                    textDecoration: isSkipped ? 'line-through' : 'none',
                }}>{habit.name}</p>
                {!adhdMode && (
                    <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>
                        {habit.scheduledTime ?? habit.category}
                        {habit.targetValue ? ` · ${habit.targetValue}${habit.trackingType === 'duration' ? 'min' : habit.trackingType === 'counter' ? 'x' : ''}` : ''}
                    </p>
                )}
            </div>

            {/* Streak */}
            <StreakFlame count={streak} />

            {/* Skip */}
            {!isCompleted && !isSkipped && (
                <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={(e) => { e.stopPropagation(); onSkip(); }}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'rgba(255,255,255,0.25)', padding: '4px',
                        flexShrink: 0,
                    }}
                    title="Skip for today"
                >
                    <SkipForward size={14} />
                </motion.button>
            )}
        </motion.div>
    );
}

// ─── Mood Log Panel ────────────────────────────────────────────────────────────
function MoodLogPanel({ onClose, onLog }: { onClose: () => void; onLog: (mood: number, energy: number, tags: string[], note?: string) => void }) {
    const [mood, setMood] = useState<number | null>(null);
    const [energy, setEnergy] = useState<number | null>(null);
    const [note, setNote] = useState('');
    const TAGS = ['grateful', 'anxious', 'focused', 'calm', 'distracted', 'energised', 'tired', 'hopeful'];
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(2,1,10,0.96)',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                backdropFilter: 'blur(20px)',
            }}
            onClick={onClose}
        >
            <motion.div
                onClick={e => e.stopPropagation()}
                initial={{ y: 60 }} animate={{ y: 0 }}
                style={{
                    width: '100%', maxWidth: 480,
                    background: 'linear-gradient(160deg, rgba(168,85,247,0.12), rgba(6,3,18,0.98))',
                    border: '1px solid rgba(168,85,247,0.25)',
                    borderRadius: '28px 28px 0 0',
                    padding: '2rem 1.5rem 2.5rem',
                }}
            >
                <h3 style={{ margin: '0 0 0.25rem', color: '#fff', fontSize: '1.1rem', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>How are you right now?</h3>
                <p style={{ margin: '0 0 1.25rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', fontFamily: "'Outfit', sans-serif" }}>A moment of honest self-check.</p>

                <p style={{ margin: '0 0 0.6rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>Mood</p>
                <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem' }}>
                    {MOOD_OPTIONS.map(m => (
                        <motion.button key={m.value} whileTap={{ scale: 0.88 }} onClick={() => setMood(m.value)}
                            style={{
                                flex: 1, padding: '0.6rem 0', borderRadius: 12, cursor: 'pointer',
                                background: mood === m.value ? `${m.color}22` : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${mood === m.value ? m.color + '88' : 'rgba(255,255,255,0.08)'}`,
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                            }}>
                            <span style={{ fontSize: '1.3rem' }}>{m.emoji}</span>
                            <span style={{ fontSize: '0.55rem', color: mood === m.value ? m.color : 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>{m.label}</span>
                        </motion.button>
                    ))}
                </div>

                <p style={{ margin: '0 0 0.6rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>Energy</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    {ENERGY_OPTIONS.map(e => (
                        <motion.button key={e.value} whileTap={{ scale: 0.88 }} onClick={() => setEnergy(e.value)}
                            style={{
                                flex: 1, padding: '0.5rem 0', borderRadius: 10, cursor: 'pointer',
                                background: energy === e.value ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${energy === e.value ? 'rgba(251,191,36,0.55)' : 'rgba(255,255,255,0.08)'}`,
                                fontSize: '1.1rem',
                            }}>{e.emoji}</motion.button>
                    ))}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                    {TAGS.map(t => (
                        <motion.button key={t} whileTap={{ scale: 0.9 }} onClick={() => setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                            style={{
                                padding: '0.3rem 0.7rem', borderRadius: 999, cursor: 'pointer', fontSize: '0.72rem',
                                fontFamily: "'Outfit', sans-serif", fontWeight: 600,
                                background: selectedTags.includes(t) ? 'rgba(168,85,247,0.22)' : 'rgba(255,255,255,0.05)',
                                border: `1px solid ${selectedTags.includes(t) ? 'rgba(168,85,247,0.55)' : 'rgba(255,255,255,0.1)'}`,
                                color: selectedTags.includes(t) ? '#c084fc' : 'rgba(255,255,255,0.5)',
                            }}>{t}</motion.button>
                    ))}
                </div>

                <input
                    placeholder="Any note for today... (optional)"
                    value={note} onChange={e => setNote(e.target.value)}
                    style={{
                        width: '100%', padding: '0.7rem 0.9rem', borderRadius: 12, marginBottom: '1rem',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff', fontSize: '0.85rem', fontFamily: "'Outfit', sans-serif",
                        outline: 'none', boxSizing: 'border-box',
                    }}
                />

                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { if (mood && energy) { onLog(mood, energy, selectedTags, note || undefined); onClose(); } }}
                    disabled={!mood || !energy}
                    style={{
                        width: '100%', padding: '0.85rem', borderRadius: 14,
                        background: mood && energy ? 'linear-gradient(135deg, #a855f7, #7c3aed)' : 'rgba(255,255,255,0.08)',
                        border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                        fontFamily: "'Outfit', sans-serif", cursor: mood && energy ? 'pointer' : 'default',
                        transition: 'all 0.2s',
                    }}
                >Log Check-in</motion.button>
            </motion.div>
        </motion.div>
    );
}

// ─── Ayurvedic Hub Section ────────────────────────────────────────────────────
function AyurvedicHub() {
    const router = useRouter();
    const { prakriti, vikriti, currentPhase, doshaOnboardingComplete, inBrahmaMuhurta } = useDoshaEngine();

    const AYUR_LINKS = [
        { href: '/lifestyle/prakriti', icon: '🪷', label: doshaOnboardingComplete ? 'Prakriti' : 'Discover Prakriti', color: '#a78bfa', desc: doshaOnboardingComplete && prakriti ? `${prakriti.combo.toUpperCase()} constitution` : 'Know your nature' },
        { href: '/lifestyle/dinacharya', icon: '🕐', label: 'Dinacharya', color: '#fbbf24', desc: `${currentPhase.label} · ${currentPhase.timeRange}` },
        { href: '/lifestyle/bodhi-ayurveda', icon: '✦', label: 'Bodhi Vaidya', color: '#fb923c', desc: 'Ayurvedic wisdom chat' },
        { href: '/lifestyle/ayurvedic-habits', icon: '🌿', label: 'Niyama Habits', color: '#4ade80', desc: 'Dosha-tagged practices' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ marginBottom: '0.9rem' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <h2 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>
                    Ayurveda
                </h2>
                {inBrahmaMuhurta && (
                    <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }}
                        style={{ fontSize: '0.62rem', padding: '0.15rem 0.5rem', borderRadius: 99, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: 'rgba(251,191,36,0.8)', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                        ✦ Brahma Muhurta
                    </motion.span>
                )}
                {!inBrahmaMuhurta && prakriti && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.5rem', borderRadius: 99, background: `${DOSHA_INFO[prakriti.primary].color}18`, border: `1px solid ${DOSHA_INFO[prakriti.primary].color}35` }}>
                        <span style={{ fontSize: '0.75rem' }}>{DOSHA_INFO[prakriti.primary].emoji}</span>
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: DOSHA_INFO[prakriti.primary].accentColor, fontFamily: "'Outfit', sans-serif" }}>{prakriti.combo.toUpperCase()}</span>
                    </div>
                )}
            </div>

            {/* Dosha clock strip */}
            <div style={{ padding: '0.65rem 0.9rem', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: '0.55rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: currentPhase.phase === 'brahma-muhurta' ? '#fbbf24' : currentPhase.phase.includes('kapha') ? '#4ade80' : currentPhase.phase.includes('pitta') ? '#fb923c' : '#a78bfa', flexShrink: 0, boxShadow: '0 0 6px currentColor' }} />
                <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily: "'Outfit', sans-serif" }}>{currentPhase.label}</p>
                    <p style={{ margin: 0, fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>{currentPhase.quality}</p>
                </div>
                {vikriti?.primary && vikriti.imbalanceLevel !== 'balanced' && (
                    <span style={{ fontSize: '0.62rem', padding: '0.15rem 0.45rem', borderRadius: 99, background: `${DOSHA_INFO[vikriti.primary].color}18`, border: `1px solid ${DOSHA_INFO[vikriti.primary].color}30`, color: DOSHA_INFO[vikriti.primary].accentColor, fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                        {DOSHA_INFO[vikriti.primary].emoji} elevated
                    </span>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {AYUR_LINKS.map(link => (
                    <motion.button key={link.href} whileTap={{ scale: 0.96 }} onClick={() => router.push(link.href)}
                        style={{
                            padding: '0.8rem 0.9rem', borderRadius: 16, cursor: 'pointer', textAlign: 'left',
                            background: `${link.color}0e`, border: `1px solid ${link.color}28`,
                            display: 'flex', flexDirection: 'column', gap: '0.25rem',
                        }}>
                        <span style={{ fontSize: '1.2rem' }}>{link.icon}</span>
                        <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, color: link.color, fontFamily: "'Outfit', sans-serif" }}>{link.label}</p>
                        <p style={{ margin: 0, fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.3 }}>{link.desc}</p>
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
}

// ─── Section Quick Links ───────────────────────────────────────────────────────
const QUICK_LINKS = [
    { href: '/pranayama', icon: '🌬️', label: 'Breathe', color: '#22d3ee', glow: '#0891b2' },
    { href: '/sadhana', icon: '🕉️', label: 'Mantra', color: '#c084fc', glow: '#7c3aed' },
    { href: '/dhyan-kshetra', icon: '🧘', label: 'Meditate', color: '#a78bfa', glow: '#6d28d9' },
    { href: '/lifestyle/journal', icon: '📖', label: 'Journal', color: '#34d399', glow: '#059669' },
    { href: '/lifestyle/habits', icon: '✦', label: 'Habits', color: '#fbbf24', glow: '#d97706' },
    { href: '/lifestyle/insights', icon: '📊', label: 'Insights', color: '#fb923c', glow: '#ea580c' },
];

// ─── Badge Pill ────────────────────────────────────────────────────────────────
function BadgePill({ icon, name }: { icon: string; name: string }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.28rem 0.65rem', borderRadius: 999,
            background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)',
            flexShrink: 0,
        }}>
            <span style={{ fontSize: '0.9rem' }}>{icon}</span>
            <span style={{ fontSize: '0.62rem', color: '#fbbf24', fontWeight: 700, fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap' }}>{name}</span>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function LifestylePage() {
    const router = useRouter();
    const { user, loading: authLoading } = useOneSutraAuth();
    const engine = useLifestyleEngine();
    const [showMoodLog, setShowMoodLog] = useState(false);
    const [completedFlash, setCompletedFlash] = useState<string | null>(null);
    const [intentionIdx] = useState(() => Math.floor(Math.random() * DAILY_INTENTIONS.length));
    const [showAllHabits, setShowAllHabits] = useState(false);
    const confettiRef = useRef<number | null>(null);

    // ── Redirect to onboarding if not set up ─────────────────────────────────
    useEffect(() => {
        if (!authLoading && !engine.profile?.onboardingComplete) {
            router.replace('/lifestyle/onboarding');
        }
    }, [authLoading, engine.profile, router]);

    // ── Seed habits on mount ──────────────────────────────────────────────────
    useEffect(() => {
        if (engine.profile?.onboardingComplete && engine.activeHabits.length === 0) {
            engine.seedStarterHabits();
        }
    }, [engine.profile]); // eslint-disable-line react-hooks/exhaustive-deps

    const { completedIds, skippedIds } = engine.getTodayStatus();
    const today = getToday();
    const buddyName = engine.profile?.buddyName ?? 'Bodhi';
    const completionRate = engine.todayCompletionRate;
    const maxHabitsAdhd = 3;
    const displayHabits = engine.adhdMode && !showAllHabits
        ? engine.activeHabits.filter(h => !completedIds.has(h.id) && !skippedIds.has(h.id)).slice(0, maxHabitsAdhd)
        : engine.activeHabits;

    const smartCards = getSmartCards(completionRate, Math.max(...Object.values(engine.streaks).map(s => s.currentStreak), 0), engine.adhdMode, engine.todayMood, engine.activeHabits.length);
    const levelInfo = getLevelFromXP(engine.xp.total);
    const nextLevel = getNextLevel(engine.xp.total);

    const handleComplete = useCallback((habitId: string) => {
        engine.completeHabit(habitId);
        setCompletedFlash(habitId);
        setTimeout(() => setCompletedFlash(null), 1000);
    }, [engine]);

    const ringColor = completionRate >= 80 ? '#4ade80' : completionRate >= 50 ? '#fbbf24' : '#60a5fa';
    const formattedDate = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

    if (authLoading || !engine.profile?.onboardingComplete) {
        return (
            <div style={{ minHeight: '100vh', background: '#030110', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                    <Sparkles size={32} style={{ color: '#a78bfa' }} />
                </motion.div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(ellipse at 20% 0%, rgba(139,92,246,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(251,191,36,0.06) 0%, transparent 60%), #030110',
            paddingBottom: '6rem',
            fontFamily: "'Outfit', sans-serif",
        }}>
            {/* ── Completion flash ─────────────────────────────────────────── */}
            <AnimatePresence>
                {completedFlash && (
                    <motion.div
                        key="flash"
                        initial={{ opacity: 0, scale: 0.5, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -30 }}
                        style={{
                            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                            zIndex: 9999, pointerEvents: 'none',
                            fontSize: '3rem', filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.8))',
                        }}
                    >✨</motion.div>
                )}
            </AnimatePresence>

            {/* ── Mood Log Modal ────────────────────────────────────────────── */}
            <AnimatePresence>
                {showMoodLog && (
                    <MoodLogPanel
                        onClose={() => setShowMoodLog(false)}
                        onLog={(mood, energy, tags, note) => engine.logMood(mood, energy, tags, note)}
                    />
                )}
            </AnimatePresence>

            {/* ── Header ───────────────────────────────────────────────────── */}
            <div style={{
                padding: '1.25rem 1.25rem 0.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 5, padding: 0, fontSize: '0.8rem', fontFamily: "'Outfit', sans-serif" }}>
                    <ArrowLeft size={16} /> Home
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {/* ADHD mode toggle */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={engine.toggleAdhdMode}
                        title={engine.adhdMode ? 'ADHD Mode ON — tap to disable' : 'Enable ADHD Mode'}
                        style={{
                            padding: '0.3rem 0.7rem', borderRadius: 999,
                            background: engine.adhdMode ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${engine.adhdMode ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.12)'}`,
                            color: engine.adhdMode ? '#fbbf24' : 'rgba(255,255,255,0.4)',
                            fontSize: '0.65rem', fontWeight: 700,
                            cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                            letterSpacing: '0.08em',
                        }}
                    >{engine.adhdMode ? '⚡ Focus Mode' : '⚡ Focus'}</motion.button>
                    {/* Mood button */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowMoodLog(true)}
                        style={{
                            padding: '0.3rem 0.7rem', borderRadius: 999,
                            background: engine.todayMood ? 'rgba(168,85,247,0.18)' : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${engine.todayMood ? 'rgba(168,85,247,0.45)' : 'rgba(255,255,255,0.12)'}`,
                            color: engine.todayMood ? '#c084fc' : 'rgba(255,255,255,0.4)',
                            fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                            fontFamily: "'Outfit', sans-serif", letterSpacing: '0.08em',
                            display: 'flex', alignItems: 'center', gap: 4,
                        }}
                    >
                        <Heart size={11} />
                        {engine.todayMood ? MOOD_OPTIONS.find(m => m.value === engine.todayMood!.mood)?.emoji ?? '😊' : 'Mood'}
                    </motion.button>
                </div>
            </div>

            <div style={{ padding: '0 1.25rem' }}>
                {/* ── Date + buddy greeting ───────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <p style={{ margin: '0.5rem 0 0.1rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>{formattedDate}</p>
                    <p style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontFamily: "'Outfit', sans-serif" }}>
                        {user?.name?.split(' ')[0] ? `Namaste, ${user.name.split(' ')[0]}` : `Namaste`} 🙏
                    </p>
                </motion.div>

                {/* ── Daily Intention ─────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{
                        margin: '0.75rem 0',
                        padding: '0.9rem 1rem',
                        borderRadius: 16,
                        background: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(168,85,247,0.06))',
                        border: '1px solid rgba(251,191,36,0.18)',
                        borderLeft: '3px solid rgba(251,191,36,0.6)',
                    }}
                >
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.6, fontStyle: 'italic' }}>
                        &ldquo;{DAILY_INTENTIONS[intentionIdx]}&rdquo;
                    </p>
                </motion.div>

                {/* ── Progress ring + stats row ───────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        padding: '1.25rem', borderRadius: 20,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        marginBottom: '0.75rem',
                    }}
                >
                    {/* Progress ring */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <ProgressRing pct={completionRate} size={90} stroke={7} color={ringColor} />
                        <div style={{
                            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', lineHeight: 1, fontFamily: "'Outfit', sans-serif" }}>{completionRate}%</span>
                            <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.08em' }}>TODAY</span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <div>
                                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>{completedIds.size}/{engine.activeHabits.length}</p>
                                <p style={{ margin: 0, fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.08em', textTransform: 'uppercase' }}>Practices</p>
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: ringColor, fontFamily: "'Outfit', sans-serif" }}>{engine.consistencyScore}</p>
                                <p style={{ margin: 0, fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.08em', textTransform: 'uppercase' }}>7-day Score</p>
                            </div>
                        </div>

                        {/* XP Level */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.9rem' }}>{levelInfo.icon}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                    <span style={{ fontSize: '0.6rem', color: '#fbbf24', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{levelInfo.name}</span>
                                    <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>{engine.xp.total} XP</span>
                                </div>
                                {nextLevel && (
                                    <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.round(((engine.xp.total - levelInfo.minXP) / (nextLevel.minXP - levelInfo.minXP)) * 100)}%` }}
                                            transition={{ duration: 1, ease: 'easeOut' }}
                                            style={{ height: '100%', background: 'linear-gradient(90deg, #fbbf24, #f97316)', borderRadius: 2 }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── Quick Links ─────────────────────────────────────────── */}
                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem', marginBottom: '0.75rem', scrollbarWidth: 'none' }}>
                    {QUICK_LINKS.map(link => (
                        <motion.button
                            key={link.href}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => router.push(link.href)}
                            style={{
                                flexShrink: 0, padding: '0.55rem 0.75rem',
                                borderRadius: 14,
                                background: `${link.color}12`,
                                border: `1px solid ${link.color}30`,
                                cursor: 'pointer',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                                minWidth: 62,
                            }}
                        >
                            <span style={{ fontSize: '1.2rem' }}>{link.icon}</span>
                            <span style={{ fontSize: '0.6rem', color: link.color, fontWeight: 700, fontFamily: "'Outfit', sans-serif' " }}>{link.label}</span>
                        </motion.button>
                    ))}
                </div>

                {/* ── Today's Habits ──────────────────────────────────────── */}
                <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <h2 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>
                            Today&rsquo;s Practices
                        </h2>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {engine.adhdMode && engine.activeHabits.filter(h => !completedIds.has(h.id) && !skippedIds.has(h.id)).length > maxHabitsAdhd && (
                                <button onClick={() => setShowAllHabits(!showAllHabits)}
                                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
                                    {showAllHabits ? 'Show less' : `+${engine.activeHabits.length - maxHabitsAdhd} more`}
                                </button>
                            )}
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.push('/lifestyle/habits')}
                                style={{
                                    background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)',
                                    borderRadius: 999, padding: '0.25rem 0.65rem',
                                    color: '#fbbf24', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Outfit', sans-serif",
                                }}>
                                <Plus size={11} /> Add
                            </motion.button>
                        </div>
                    </div>

                    {displayHabits.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{
                                textAlign: 'center', padding: '2.5rem 1rem',
                                border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 16,
                            }}
                        >
                            <p style={{ margin: '0 0 0.5rem', fontSize: '2rem' }}>🌱</p>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', fontFamily: "'Outfit', sans-serif" }}>All practices complete — beautiful day.</p>
                        </motion.div>
                    ) : (
                        <div>
                            {displayHabits.map(habit => (
                                <HabitRow
                                    key={habit.id}
                                    habit={habit}
                                    isCompleted={completedIds.has(habit.id)}
                                    isSkipped={skippedIds.has(habit.id)}
                                    streak={engine.getHabitStreak(habit.id)}
                                    adhdMode={engine.adhdMode}
                                    onComplete={() => handleComplete(habit.id)}
                                    onSkip={() => engine.skipHabit(habit.id, 'skipped for today')}
                                />
                            ))}
                            {engine.adhdMode && completedIds.size > 0 && (
                                <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>✦ {completedIds.size} complete today</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Ayurvedic Hub ───────────────────────────────────────── */}
                <AyurvedicHub />

                {/* ── Smart AI Contextual Cards ────────────────────────────── */}
                {smartCards.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                        <h2 style={{ margin: '0 0 0.65rem', fontSize: '0.85rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>
                            {buddyName} says
                        </h2>
                        {smartCards.map((card, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.05 * i }}
                                style={{
                                    padding: '0.85rem 1rem',
                                    borderRadius: 14,
                                    background: `${card.color}0c`,
                                    border: `1px solid ${card.color}22`,
                                    borderLeft: `3px solid ${card.color}66`,
                                    marginBottom: '0.5rem',
                                }}
                            >
                                <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.55 }}>
                                    <span style={{ marginRight: 6 }}>{card.icon}</span>{card.text}
                                </p>
                                {card.cta && (
                                    <button onClick={() => card.ctaHref && router.push(card.ctaHref)}
                                        style={{ background: 'none', border: 'none', color: card.color, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', padding: '0.3rem 0 0', fontFamily: "'Outfit', sans-serif" }}>
                                        {card.cta}
                                    </button>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* ── Recent Badges ────────────────────────────────────────── */}
                {engine.badges.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                        <h2 style={{ margin: '0 0 0.65rem', fontSize: '0.85rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>Recent Achievements</h2>
                        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem', scrollbarWidth: 'none' }}>
                            {engine.badges.slice(0, 6).map(b => (
                                <BadgePill key={b.id} icon={b.icon} name={b.name} />
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Talk to Buddy ─────────────────────────────────────────── */}
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => router.push('/bodhi-chat')}
                    style={{
                        width: '100%', padding: '1rem',
                        borderRadius: 18,
                        background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(251,191,36,0.08))',
                        border: '1px solid rgba(139,92,246,0.25)',
                        display: 'flex', alignItems: 'center', gap: '0.85rem',
                        cursor: 'pointer', textAlign: 'left',
                        boxSizing: 'border-box',
                    }}
                >
                    <div style={{
                        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                        background: 'radial-gradient(circle at 35% 30%, rgba(251,191,36,0.35) 0%, rgba(139,92,246,0.25) 60%, transparent 100%)',
                        border: '1px solid rgba(251,191,36,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                    }}>✦</div>
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontFamily: "'Outfit', sans-serif" }}>Talk to {buddyName}</p>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>Check in · Plan your day · Ask anything</p>
                    </div>
                    <MessageCircle size={18} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
                </motion.button>
            </div>
        </div>
    );
}
