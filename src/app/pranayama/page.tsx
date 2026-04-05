'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Play, Pause, RotateCcw, CheckCircle2, Volume2, VolumeX } from 'lucide-react';
import { useLifestyleEngine } from '@/hooks/useLifestyleEngine';

// ─── Breathing Techniques Library ──────────────────────────────────────────────

interface BreathTechnique {
    id: string;
    name: string;
    subtitle: string;
    icon: string;
    color: string;
    description: string;
    benefit: string;
    phases: Array<{ label: string; duration: number; color: string }>;
    defaultDuration: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    guidance: string[];
}

const TECHNIQUES: BreathTechnique[] = [
    {
        id: 'deep_breathing',
        name: 'Simple Deep Breathing',
        subtitle: 'Foundational belly breathing',
        icon: '🌬️',
        color: '#22d3ee',
        description: 'The foundation of all breathing practice. Activates the parasympathetic nervous system, reduces cortisol, and brings you into the present moment.',
        benefit: 'Calm & Centre',
        phases: [
            { label: 'Inhale', duration: 4, color: '#22d3ee' },
            { label: 'Exhale', duration: 6, color: '#60a5fa' },
        ],
        defaultDuration: 5,
        difficulty: 'beginner',
        guidance: [
            'Sit comfortably with your spine long and shoulders soft',
            'Place one hand on your belly',
            'Breathe in slowly through your nose — feel your belly expand',
            'Exhale gently through your nose or mouth — belly falls',
            'Let each breath be slower and deeper than the last',
        ],
    },
    {
        id: 'box_breathing',
        name: 'Box Breathing',
        subtitle: 'Inhale · Hold · Exhale · Hold',
        icon: '⬜',
        color: '#a78bfa',
        description: 'Used by Navy SEALs and elite performers. Equal-count breathing that creates mental clarity, reduces stress, and resets the nervous system rapidly.',
        benefit: 'Focus & Stress Relief',
        phases: [
            { label: 'Inhale', duration: 4, color: '#a78bfa' },
            { label: 'Hold', duration: 4, color: '#c084fc' },
            { label: 'Exhale', duration: 4, color: '#818cf8' },
            { label: 'Hold', duration: 4, color: '#7c3aed' },
        ],
        defaultDuration: 5,
        difficulty: 'beginner',
        guidance: [
            'Sit upright — spine tall, jaw relaxed',
            'Inhale through your nose for 4 counts',
            'Hold your breath — chest and belly still — for 4 counts',
            'Exhale completely through your mouth for 4 counts',
            'Hold empty — no air — for 4 counts',
            'This is one complete cycle. Repeat.',
        ],
    },
    {
        id: '478_breathing',
        name: '4-7-8 Breathing',
        subtitle: 'For deep sleep and anxiety relief',
        icon: '🌙',
        color: '#818cf8',
        description: 'Dr. Andrew Weil\'s technique often called a "natural tranquilizer." Highly effective for falling asleep, managing anxiety, and calming intense emotions.',
        benefit: 'Sleep & Anxiety',
        phases: [
            { label: 'Inhale', duration: 4, color: '#818cf8' },
            { label: 'Hold', duration: 7, color: '#6d28d9' },
            { label: 'Exhale', duration: 8, color: '#4c1d95' },
        ],
        defaultDuration: 5,
        difficulty: 'beginner',
        guidance: [
            'Place the tip of your tongue on the ridge behind your upper front teeth',
            'Exhale completely through your mouth first',
            'Close your mouth and inhale through your nose for 4 counts',
            'Hold your breath for 7 counts',
            'Exhale completely through your mouth making a whoosh sound for 8 counts',
            'Repeat 4 cycles to start. Increase gradually.',
        ],
    },
    {
        id: 'alternate_nostril',
        name: 'Alternate Nostril Breathing',
        subtitle: 'For balance and calm',
        icon: '🌀',
        color: '#4ade80',
        description: 'A foundational yogic breath practice that balances the left and right hemispheres of the brain, cleanses the energy channels (nadis), and creates profound inner harmony.',
        benefit: 'Balance & Clarity',
        phases: [
            { label: 'Inhale Left', duration: 4, color: '#4ade80' },
            { label: 'Hold', duration: 4, color: '#22d3ee' },
            { label: 'Exhale Right', duration: 4, color: '#34d399' },
            { label: 'Inhale Right', duration: 4, color: '#4ade80' },
            { label: 'Hold', duration: 4, color: '#22d3ee' },
            { label: 'Exhale Left', duration: 4, color: '#34d399' },
        ],
        defaultDuration: 10,
        difficulty: 'intermediate',
        guidance: [
            'Sit comfortably. Raise your right hand to your nose.',
            'Use your thumb to close the right nostril. Inhale through the left for 4 counts.',
            'Close both nostrils. Hold for 4 counts.',
            'Release the right nostril. Exhale through the right for 4 counts.',
            'Inhale through the right nostril for 4 counts.',
            'Close both. Hold for 4 counts.',
            'Exhale through the left. This completes one cycle.',
        ],
    },
    {
        id: 'energising_breath',
        name: 'Energising Breath',
        subtitle: 'Rapid rhythmic breathing for energy',
        icon: '⚡',
        color: '#fbbf24',
        description: 'A rhythmic, dynamic nasal breathing practice that oxygenates the blood, stimulates the digestive fire, clears mental fog, and generates energetic vitality.',
        benefit: 'Energy & Mental Clarity',
        phases: [
            { label: 'Pump', duration: 0.5, color: '#fbbf24' },
            { label: 'Rest', duration: 0.5, color: '#f97316' },
        ],
        defaultDuration: 5,
        difficulty: 'intermediate',
        guidance: [
            'Sit with spine tall and core gently engaged',
            'Take a full deep breath in to prepare',
            'Begin sharp, rhythmic exhales through your nose — one per second',
            'The inhale is passive — it happens naturally between each exhale',
            'Start with 30 pumps, then rest and breathe naturally',
            'Build to 60-120 pumps per round over time',
            'If you feel dizzy at any point, stop and breathe normally',
        ],
    },
    {
        id: 'extended_exhale',
        name: 'Extended Exhale Breathing',
        subtitle: 'Nervous system downregulation',
        icon: '🌊',
        color: '#60a5fa',
        description: 'When your exhale is longer than your inhale, you activate the parasympathetic (rest-and-digest) nervous system. Ideal after stressful events, before bed, or during anxiety.',
        benefit: 'Relaxation & Recovery',
        phases: [
            { label: 'Inhale', duration: 4, color: '#60a5fa' },
            { label: 'Exhale', duration: 8, color: '#3b82f6' },
        ],
        defaultDuration: 5,
        difficulty: 'beginner',
        guidance: [
            'Settle into a comfortable seated or lying position',
            'Breathe in through your nose for 4 counts',
            'Let the exhale out slowly through your nose or pursed lips for 8 counts',
            'Feel your body soften with each long exhale',
            'You do not need to fill your lungs completely — a medium breath is fine',
        ],
    },
    {
        id: 'breath_of_fire',
        name: 'Breath of Fire',
        subtitle: 'Warming and activating practice',
        icon: '🔥',
        color: '#f97316',
        description: 'A powerful Kundalini yoga breath that strengthens the navel centre, detoxifies the blood, stimulates the immune system, and builds inner fire and focus.',
        benefit: 'Activation & Detox',
        phases: [
            { label: 'Exhale', duration: 0.5, color: '#f97316' },
            { label: 'Inhale', duration: 0.5, color: '#fb923c' },
        ],
        defaultDuration: 3,
        difficulty: 'advanced',
        guidance: [
            'Sit in easy pose with spine straight and hands on knees',
            'Begin with deep inhale and forceful exhale through the nose',
            'Both inhale and exhale are equal — rapid and rhythmic through the nose',
            'The navel pumps in on each exhale and releases on each inhale',
            'Keep your chest, shoulders, and face relaxed',
            'Start with 30 seconds. Rest, then increase over weeks.',
            'Not recommended if pregnant, menstruating, or with high blood pressure',
        ],
    },
    {
        id: 'humming_breath',
        name: 'Humming Breath',
        subtitle: 'The calming bee breath',
        icon: '🐝',
        color: '#fde68a',
        description: 'By covering the ears and creating an inner humming sound on the exhale, you stimulate the vagus nerve directly — one of the fastest routes to inner calm and nervous system reset.',
        benefit: 'Deep Calm & Inner Stillness',
        phases: [
            { label: 'Inhale', duration: 4, color: '#fde68a' },
            { label: 'Hum exhale', duration: 6, color: '#fbbf24' },
        ],
        defaultDuration: 5,
        difficulty: 'beginner',
        guidance: [
            'Sit comfortably. Close your eyes.',
            'Gently cover your ears with your thumbs and rest fingertips on your face',
            'Inhale deeply through your nose for 4 counts',
            'On the exhale, make a gentle humming sound — "hmmmm" — until breath is empty',
            'Feel the vibration in your head, face, and chest',
            'This vibration is the healing mechanism — let it resonate',
            'Begin with 5 rounds, increase to 10-15',
        ],
    },
];

// ─── Breath Circle Animation ───────────────────────────────────────────────────

function BreathCircle({ phase, progress, color, label }: { phase: string; progress: number; color: string; label: string }) {
    const isHold = phase.toLowerCase().includes('hold');
    const isExhale = phase.toLowerCase().includes('exhale') || phase.toLowerCase().includes('hum');
    const scale = isHold ? 1.0 : isExhale ? 1 - progress * 0.35 : 0.65 + progress * 0.35;

    return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Outer ripple rings */}
            {!isHold && [0, 1, 2].map(i => (
                <motion.div key={i}
                    animate={{ scale: [1, 1.5 + i * 0.3], opacity: [0.3, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.7, ease: 'easeOut' }}
                    style={{
                        position: 'absolute',
                        width: 180, height: 180, borderRadius: '50%',
                        border: `1.5px solid ${color}55`,
                        pointerEvents: 'none',
                    }}
                />
            ))}

            {/* Main breath circle */}
            <motion.div
                animate={{ scale }}
                transition={{ duration: 0.1, ease: 'linear' }}
                style={{
                    width: 180, height: 180, borderRadius: '50%',
                    background: `radial-gradient(circle at 38% 32%, ${color}44 0%, ${color}18 50%, transparent 80%)`,
                    border: `2px solid ${color}66`,
                    boxShadow: `0 0 40px ${color}33, inset 0 0 30px ${color}18`,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                }}
            >
                {/* Inner glow */}
                <motion.div
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                        position: 'absolute', inset: '20%', borderRadius: '50%',
                        background: `radial-gradient(circle, ${color}44 0%, transparent 70%)`,
                        pointerEvents: 'none',
                    }}
                />
                <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color, fontFamily: "'Outfit', sans-serif", position: 'relative', zIndex: 1, textShadow: `0 0 10px ${color}88` }}>{label}</p>
            </motion.div>
        </div>
    );
}

// ─── Session Timer ─────────────────────────────────────────────────────────────

function SessionTimer({
    technique, duration, onComplete,
}: {
    technique: BreathTechnique; duration: number; onComplete: () => void;
}) {
    const [running, setRunning] = useState(false);
    const [phaseIdx, setPhaseIdx] = useState(0);
    const [phaseProgress, setPhaseProgress] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [moodBefore, setMoodBefore] = useState<number | null>(null);
    const [done, setDone] = useState(false);
    const [moodAfter, setMoodAfter] = useState<number | null>(null);
    const frameRef = useRef<number>(0);
    const lastRef = useRef<number>(0);
    const phaseTimeRef = useRef<number>(0);

    const totalSeconds = duration * 60;
    const currentPhase = technique.phases[phaseIdx % technique.phases.length];

    const tick = useCallback((ts: number) => {
        if (!lastRef.current) { lastRef.current = ts; }
        const dt = (ts - lastRef.current) / 1000;
        lastRef.current = ts;

        phaseTimeRef.current += dt;
        setElapsed(e => {
            const ne = e + dt;
            if (ne >= totalSeconds) {
                setDone(true);
                setRunning(false);
                return totalSeconds;
            }
            return ne;
        });

        const phaseDur = currentPhase.duration;
        const prog = Math.min(phaseTimeRef.current / phaseDur, 1);
        setPhaseProgress(prog);

        if (phaseTimeRef.current >= phaseDur) {
            phaseTimeRef.current = 0;
            setPhaseIdx(i => i + 1);
        }

        frameRef.current = requestAnimationFrame(tick);
    }, [currentPhase.duration, totalSeconds]);

    useEffect(() => {
        if (running) {
            lastRef.current = 0;
            frameRef.current = requestAnimationFrame(tick);
        } else {
            cancelAnimationFrame(frameRef.current);
        }
        return () => cancelAnimationFrame(frameRef.current);
    }, [running, tick]);

    const reset = () => {
        setRunning(false); setPhaseIdx(0); setPhaseProgress(0);
        setElapsed(0); setDone(false); phaseTimeRef.current = 0;
    };

    const remaining = Math.max(0, Math.floor(totalSeconds - elapsed));
    const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
    const ss = String(remaining % 60).padStart(2, '0');
    const overallPct = (elapsed / totalSeconds) * 100;

    if (done) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6 }}
                    style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✨</motion.div>
                <h3 style={{ margin: '0 0 0.4rem', color: '#fff', fontSize: '1.2rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>Session Complete</h3>
                <p style={{ margin: '0 0 1.5rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', fontFamily: "'Outfit', sans-serif" }}>{duration} minutes of {technique.name}</p>
                <p style={{ margin: '0 0 0.75rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>How do you feel now?</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                    {[['😔', 1], ['😌', 2], ['🙂', 3], ['😊', 4], ['🌟', 5]].map(([e, v]) => (
                        <motion.button key={v as number} whileTap={{ scale: 0.88 }}
                            onClick={() => setMoodAfter(v as number)}
                            style={{
                                width: 46, height: 46, borderRadius: '50%', border: `1.5px solid ${moodAfter === v ? technique.color + 'aa' : 'rgba(255,255,255,0.12)'}`,
                                background: moodAfter === v ? `${technique.color}22` : 'rgba(255,255,255,0.04)',
                                cursor: 'pointer', fontSize: '1.4rem',
                            }}>{e}</motion.button>
                    ))}
                </div>
                <motion.button whileTap={{ scale: 0.96 }}
                    onClick={() => onComplete()}
                    style={{
                        width: '100%', padding: '0.9rem', borderRadius: 14,
                        background: `linear-gradient(135deg, ${technique.color}, ${technique.color}99)`,
                        border: 'none', color: '#000', fontWeight: 800, fontSize: '0.88rem',
                        fontFamily: "'Outfit', sans-serif", cursor: 'pointer',
                        boxShadow: `0 4px 20px ${technique.color}44`,
                    }}>
                    Save Session ✓
                </motion.button>
            </motion.div>
        );
    }

    if (!moodBefore && !running) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '1rem 0' }}>
                <p style={{ margin: '0 0 1rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>How are you feeling right now?</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                    {[['😔', 1], ['😌', 2], ['🙂', 3], ['😊', 4], ['🌟', 5]].map(([e, v]) => (
                        <motion.button key={v as number} whileTap={{ scale: 0.88 }}
                            onClick={() => { setMoodBefore(v as number); setRunning(true); }}
                            style={{
                                width: 52, height: 52, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)',
                                background: 'rgba(255,255,255,0.05)', cursor: 'pointer', fontSize: '1.5rem',
                            }}>{e}</motion.button>
                    ))}
                </div>
                <motion.button whileTap={{ scale: 0.96 }}
                    onClick={() => { setMoodBefore(3); setRunning(true); }}
                    style={{
                        padding: '0.7rem 1.5rem', borderRadius: 12,
                        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                        color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', fontFamily: "'Outfit', sans-serif", cursor: 'pointer',
                    }}>Skip & Begin</motion.button>
            </motion.div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            {/* Breath circle */}
            <BreathCircle
                phase={currentPhase.label}
                progress={phaseProgress}
                color={currentPhase.color}
                label={currentPhase.label}
            />

            {/* Timer */}
            <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.05em' }}>{mm}:{ss}</p>
                <div style={{ width: 200, height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, margin: '0.5rem auto 0', overflow: 'hidden' }}>
                    <motion.div
                        animate={{ width: `${overallPct}%` }}
                        style={{ height: '100%', background: currentPhase.color, borderRadius: 2 }}
                    />
                </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '1rem' }}>
                <motion.button whileTap={{ scale: 0.88 }} onClick={reset}
                    style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
                    <RotateCcw size={16} />
                </motion.button>
                <motion.button whileTap={{ scale: 0.88 }} onClick={() => setRunning(!running)}
                    style={{
                        width: 64, height: 64, borderRadius: '50%',
                        background: `linear-gradient(135deg, ${currentPhase.color}, ${currentPhase.color}88)`,
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 0 24px ${currentPhase.color}55`,
                        color: '#000',
                    }}>
                    {running ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: 3 }} />}
                </motion.button>
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function PranayamaPage() {
    const router = useRouter();
    const { logBreathingSession, breathingSessions } = useLifestyleEngine();
    const [selected, setSelected] = useState<BreathTechnique | null>(null);
    const [duration, setDuration] = useState(5);
    const [sessionActive, setSessionActive] = useState(false);
    const [justCompleted, setJustCompleted] = useState(false);

    const todaySessions = breathingSessions.filter(s => s.date === new Date().toISOString().split('T')[0]);

    const handleComplete = useCallback(() => {
        if (!selected) return;
        logBreathingSession({
            techniqueId: selected.id,
            techniqueName: selected.name,
            durationMinutes: duration,
        });
        setJustCompleted(true);
        setSessionActive(false);
        setTimeout(() => { setJustCompleted(false); setSelected(null); }, 3000);
    }, [selected, duration, logBreathingSession]);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(ellipse at 20% 0%, rgba(34,211,238,0.1) 0%, transparent 55%), radial-gradient(ellipse at 80% 100%, rgba(139,92,246,0.08) 0%, transparent 55%), #030110',
            paddingBottom: '4rem',
            fontFamily: "'Outfit', sans-serif",
        }}>
            {/* Header */}
            <div style={{ padding: '1.25rem 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button onClick={() => selected ? (sessionActive ? null : setSelected(null)) : router.back()}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, padding: 0 }}>
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>Breathing Practices</h1>
                    <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.08em' }}>
                        {todaySessions.length > 0 ? `${todaySessions.length} session${todaySessions.length > 1 ? 's' : ''} today` : 'Sacred breath sanctuary'}
                    </p>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {/* ── Success toast ───────────────────────────────────────── */}
                {justCompleted && (
                    <motion.div key="toast"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{
                            margin: '1rem 1.25rem 0',
                            padding: '0.85rem 1rem',
                            borderRadius: 14,
                            background: 'rgba(74,222,128,0.12)',
                            border: '1px solid rgba(74,222,128,0.3)',
                            display: 'flex', alignItems: 'center', gap: '0.65rem',
                        }}>
                        <CheckCircle2 size={18} style={{ color: '#4ade80', flexShrink: 0 }} />
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', fontFamily: "'Outfit', sans-serif" }}>Session logged. Beautiful practice. 🙏</p>
                    </motion.div>
                )}

                {/* ── Active session ──────────────────────────────────────── */}
                {selected && sessionActive && (
                    <motion.div key="session"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ padding: '1.5rem 1.25rem' }}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <span style={{ fontSize: '1.8rem' }}>{selected.icon}</span>
                            <h2 style={{ margin: '0.4rem 0 0.15rem', fontSize: '1.1rem', fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>{selected.name}</h2>
                            <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.08em' }}>{duration} minutes · Follow the circle</p>
                        </div>
                        <SessionTimer technique={selected} duration={duration} onComplete={handleComplete} />
                    </motion.div>
                )}

                {/* ── Technique detail ─────────────────────────────────────── */}
                {selected && !sessionActive && (
                    <motion.div key="detail"
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        style={{ padding: '1.5rem 1.25rem' }}>

                        <div style={{
                            padding: '1.25rem',
                            borderRadius: 20,
                            background: `${selected.color}10`,
                            border: `1px solid ${selected.color}30`,
                            marginBottom: '1rem',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.85rem' }}>
                                <span style={{ fontSize: '2rem' }}>{selected.icon}</span>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>{selected.name}</h2>
                                    <p style={{ margin: 0, fontSize: '0.72rem', color: selected.color, fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>{selected.benefit}</p>
                                </div>
                            </div>
                            <p style={{ margin: '0 0 0.85rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.6 }}>{selected.description}</p>
                        </div>

                        {/* Guidance steps */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <p style={{ margin: '0 0 0.65rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.12em', textTransform: 'uppercase' }}>Step-by-step guidance</p>
                            {selected.guidance.map((g, i) => (
                                <div key={i} style={{ display: 'flex', gap: '0.65rem', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: '0.68rem', color: selected.color, fontWeight: 800, fontFamily: "'Outfit', sans-serif", minWidth: 18, marginTop: 2 }}>{i + 1}.</span>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.55 }}>{g}</p>
                                </div>
                            ))}
                        </div>

                        {/* Duration selector */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <p style={{ margin: '0 0 0.65rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.12em', textTransform: 'uppercase' }}>Session duration</p>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {[3, 5, 10, 20].map(d => (
                                    <motion.button key={d} whileTap={{ scale: 0.9 }}
                                        onClick={() => setDuration(d)}
                                        style={{
                                            flex: 1, padding: '0.55rem 0', borderRadius: 12, cursor: 'pointer',
                                            background: duration === d ? `${selected.color}22` : 'rgba(255,255,255,0.05)',
                                            border: `1px solid ${duration === d ? selected.color + '66' : 'rgba(255,255,255,0.1)'}`,
                                            color: duration === d ? selected.color : 'rgba(255,255,255,0.5)',
                                            fontSize: '0.8rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif",
                                        }}>{d}m</motion.button>
                                ))}
                            </div>
                        </div>

                        <motion.button whileTap={{ scale: 0.97 }}
                            onClick={() => setSessionActive(true)}
                            style={{
                                width: '100%', padding: '1rem', borderRadius: 16,
                                background: `linear-gradient(135deg, ${selected.color}, ${selected.color}88)`,
                                border: 'none', color: '#000', fontWeight: 800, fontSize: '0.95rem',
                                fontFamily: "'Outfit', sans-serif", cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                boxShadow: `0 4px 24px ${selected.color}44`,
                            }}>
                            <Play size={18} style={{ marginLeft: 2 }} /> Begin Practice
                        </motion.button>
                    </motion.div>
                )}

                {/* ── Technique list ───────────────────────────────────────── */}
                {!selected && (
                    <motion.div key="list"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ padding: '1.25rem' }}>

                        {/* Today's count */}
                        {todaySessions.length > 0 && (
                            <div style={{
                                padding: '0.75rem 1rem', borderRadius: 14, marginBottom: '1rem',
                                background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)',
                                display: 'flex', alignItems: 'center', gap: '0.65rem',
                            }}>
                                <span style={{ fontSize: '1.1rem' }}>🌬️</span>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontFamily: "'Outfit', sans-serif" }}>
                                    {todaySessions.length} session{todaySessions.length > 1 ? 's' : ''} done today · Total: {todaySessions.reduce((a, s) => a + s.durationMinutes, 0)} min
                                </p>
                            </div>
                        )}

                        <p style={{ margin: '0 0 0.85rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.12em', textTransform: 'uppercase' }}>Choose a practice</p>

                        {TECHNIQUES.map((tech, i) => (
                            <motion.div key={tech.id}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setSelected(tech)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.85rem',
                                    padding: '0.9rem 1rem', borderRadius: 16,
                                    background: 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${tech.color}25`,
                                    marginBottom: '0.6rem', cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}>
                                <div style={{
                                    width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                                    background: `${tech.color}18`,
                                    border: `1px solid ${tech.color}35`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.3rem',
                                }}>{tech.icon}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontFamily: "'Outfit', sans-serif" }}>{tech.name}</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '0.68rem', color: 'rgba(255,255,255,0.38)', fontFamily: "'Outfit', sans-serif" }}>{tech.subtitle}</p>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <p style={{ margin: 0, fontSize: '0.62rem', color: tech.color, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{tech.benefit}</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '0.58rem', color: 'rgba(255,255,255,0.25)', fontFamily: "'Outfit', sans-serif", textTransform: 'capitalize' }}>{tech.difficulty}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
