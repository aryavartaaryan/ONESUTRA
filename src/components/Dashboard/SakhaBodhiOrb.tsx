'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSakhaConversation, type DayPhase } from '@/hooks/useSakhaConversation';
import { useLanguage } from '@/context/LanguageContext';
import { type TaskItem } from '@/hooks/useDailyTasks';
import { Sparkles, Calendar, Focus, Moon, Wind, Lightbulb } from 'lucide-react';
import styles from './SakhaBodhiOrb.module.css';

// ─── Mood data ───────────────────────────────────────────────────────────────
const MOOD_EMOJIS_ORB = [
    { emoji: '😊', label: 'Happy', mood: 'HAPPY/JOYFUL', color: '#fbbf24' },
    { emoji: '😔', label: 'Sad', mood: 'SAD/LOW', color: '#818cf8' },
    { emoji: '😤', label: 'Stressed', mood: 'STRESSED/ANXIOUS', color: '#f87171' },
    { emoji: '🤩', label: 'Excited', mood: 'EXCITED/ENERGIZED', color: '#2dd4bf' },
    { emoji: '😴', label: 'Tired', mood: 'TIRED/DRAINED', color: '#94a3b8' },
    { emoji: '🎯', label: 'Focused', mood: 'FOCUSED/PRODUCTIVE', color: '#4ade80' },
    { emoji: '😕', label: 'Confused', mood: 'CONFUSED/STUCK', color: '#fb923c' },
    { emoji: '🙏', label: 'Grateful', mood: 'GRATEFUL/PEACEFUL', color: '#c4b5fd' },
];

// ─── Phase meta ───────────────────────────────────────────────────────────────

const PHASE_CONFIG: Record<DayPhase, { label: string; emoji: string; wisdom: string }> = {
    morning: {
        label: 'Brahma Muhurta · Morning',
        emoji: '🌄',
        wisdom: 'The morning breeze carries the wisdom of a thousand sages. Begin with intention.'
    },
    midday: {
        label: 'Deep Work · Mid-Day',
        emoji: '☀️',
        wisdom: 'Like the sun at its zenith, let your focus burn bright and true.'
    },
    evening: {
        label: 'Sandhya · Evening',
        emoji: '🌇',
        wisdom: 'Shaam ka yeh waqt mann ko shaant karta hai — Ishwar aur swayam se jodne ka sabse uttam samay. ✨'
    },
    night: {
        label: 'Nisha · Late Night',
        emoji: '🌙',
        wisdom: 'In the silence of night, the universe whispers its deepest truths.'
    },
};

// ─── Geometric 4-point clarity star (SVG, no religious meaning) ───────────────

function ClarityStar() {
    return (
        <svg
            className={styles.starGeo}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
        >
            {/* Four slim elongated diamond points — a pure geometric form */}
            <path
                d="M20 2 L21.4 18.6 L38 20 L21.4 21.4 L20 38 L18.6 21.4 L2 20 L18.6 18.6 Z"
                fill="rgba(255,255,255,0.55)"
            />
            <circle cx="20" cy="20" r="1.5" fill="rgba(255,255,255,0.85)" />
        </svg>
    );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SakhaBodhiOrbProps {
    sankalpaItems: TaskItem[];
    onSankalpaUpdate: (items: TaskItem[]) => void;
    onDismiss: () => void;
    userName?: string;
    userId?: string | null;
    /** Persists new Bodhi-added tasks to Firestore */
    onAddTask?: (task: TaskItem) => Promise<void>;
    /** Persists Bodhi-removed tasks to Firestore */
    onRemoveTask?: (taskId: string) => Promise<void>;
    onTriggerMeditationScreen?: () => void;
    onNavigateToPlanner?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SakhaBodhiOrb({
    sankalpaItems,
    onSankalpaUpdate,
    onDismiss,
    userName = 'Aryan',
    userId = null,
    onAddTask,
    onRemoveTask,
    onTriggerMeditationScreen,
    onNavigateToPlanner,
}: SakhaBodhiOrbProps) {
    const { lang } = useLanguage();

    const [breathingMode, setBreathingMode] = useState(false);
    const [showWisdom, setShowWisdom] = useState(true);
    const [orbMoodEmoji, setOrbMoodEmoji] = useState('');
    const [orbMoodLabel, setOrbMoodLabel] = useState('');
    const [floatingEmojis, setFloatingEmojis] = useState<Array<{ id: string; emoji: string }>>([]);

    const {
        sakhaState,
        phase,
        micVolume,
        activate,
        deactivate,
    } = useSakhaConversation({
        userName,
        preferredLanguage: lang,
        sankalpaItems,
        onSankalpaUpdate,
        onDismiss,
        userId,
        onAddTask,
        onRemoveTask,
        onTriggerMeditationScreen,
        onNavigateToPlanner,
        userMood: orbMoodEmoji ? `${orbMoodEmoji} ${orbMoodLabel}` : '',
    });

    useEffect(() => {
        let mounted = true;
        const play = setTimeout(() => {
            if (mounted) activate();
        }, 100);

        // Load saved mood from Firebase
        if (userId) {
            (async () => {
                try {
                    const { getFirebaseFirestore } = await import('@/lib/firebase');
                    const { doc, getDoc } = await import('firebase/firestore');
                    const db = await getFirebaseFirestore();
                    const snap = await getDoc(doc(db, 'users', userId));
                    if (!mounted || !snap.exists()) return;
                    const m = snap.data()?.current_mood;
                    if (m?.emoji && Date.now() - m.updatedAt < 6 * 60 * 60 * 1000) {
                        setOrbMoodEmoji(m.emoji);
                        const found = MOOD_EMOJIS_ORB.find(x => x.mood === m.mood);
                        setOrbMoodLabel(found?.label ?? '');
                    }
                } catch { /* silent */ }
            })();
        }

        return () => {
            mounted = false;
            clearTimeout(play);
            deactivate();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const handleOrbMoodSelect = useCallback((emoji: string, label: string, mood: string) => {
        // Always save mood to Firebase
        if (userId) {
            import('@/lib/firebase').then(({ getFirebaseFirestore }) =>
                import('firebase/firestore').then(({ doc, setDoc }) =>
                    getFirebaseFirestore().then(db =>
                        setDoc(doc(db, 'users', userId), { current_mood: { emoji, mood, updatedAt: Date.now() } }, { merge: true })
                    )
                )
            ).catch(() => { });
        }

        // Float-up animation fires at ANY time (not just when speaking)
        const floatId = `float_${Date.now()}_${Math.random()}`;
        setFloatingEmojis(prev => [...prev, { id: floatId, emoji }]);
        setTimeout(() => setFloatingEmojis(prev => prev.filter(e => e.id !== floatId)), 1600);

        // Toggle selected mood
        if (orbMoodEmoji === emoji) {
            setOrbMoodEmoji('');
            setOrbMoodLabel('');
        } else {
            setOrbMoodEmoji(emoji);
            setOrbMoodLabel(label);
        }
    }, [orbMoodEmoji, userId]);

    // ── Quick Action Handlers ────────────────────────────────────────────────
    const handleMeditate = () => {
        onTriggerMeditationScreen?.();
    };

    const handlePlan = () => {
        onNavigateToPlanner?.();
    };

    const handleFocus = () => {
        // Activate Brahmastra focus mode via custom event
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('activateBrahmastra', { detail: { reason: 'Deep focus with Sakha' } }));
        }
    };

    const handleRest = () => {
        setBreathingMode(true);
    };

    // ── Phase info ────────────────────────────────────────────────────────────
    const phaseInfo = PHASE_CONFIG[phase];

    // ── State label content ───────────────────────────────────────────────────
    const stateLabel =
        sakhaState === 'listening' ? 'Listening' :
            sakhaState === 'thinking' ? 'Thinking' :
                sakhaState === 'speaking' ? 'Speaking' : '';

    const showLiveDot = sakhaState === 'listening' || sakhaState === 'speaking';

    const handleDismiss = () => {
        deactivate();
        onDismiss();
    };

    // ── Blob scale driven by mic volume while listening ───────────────────────
    const listenBlobScale = sakhaState === 'listening' ? 1 + micVolume * 0.22 : 1;

    // ── Breathing rhythm (idle / between turns) ───────────────────────────────
    // 4-7-8 inspired: subtle slow expansion
    const breathTransition = {
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut' as const,
        times: [0, 0.44, 0.55, 1],
    };

    // ── Central blob common props ─────────────────────────────────────────────
    const mainBlobVariants = {
        idle: {
            scale: [1, 1.04, 1.04, 1],
            y: [0, -10, -10, 0],
            transition: breathTransition,
        },
        listening: {
            scale: listenBlobScale,
            transition: { duration: 0.12, ease: 'linear' as const },
        },
        thinking: {
            scale: [1, 1.02, 1, 0.98, 1],
            transition: {
                duration: 2.8,
                repeat: Infinity,
                ease: 'easeInOut' as const,
            },
        },
        speaking: {
            scale: [1, 1.07, 0.96, 1.05, 1],
            transition: {
                duration: 1.6,
                repeat: Infinity,
                ease: 'easeInOut' as const,
            },
        },
        dismissed: { scale: 0, opacity: 0 },
    };

    // Map sakhaState to a blob animation key
    const blobAnimKey =
        sakhaState === 'idle' ? 'idle' :
            sakhaState === 'listening' ? 'listening' :
                sakhaState === 'thinking' ? 'thinking' :
                    sakhaState === 'speaking' ? 'speaking' : 'idle';

    return (
        <>
            <AnimatePresence>
                {sakhaState !== 'dismissed' && (
                    <motion.div
                        className={styles.backdrop}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.45 }}
                    >
                        {/* ── HIDDEN SVG — Goo filter definition ────────────────────── */}
                        <svg
                            style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
                            aria-hidden
                        >
                            <defs>
                                <filter id="sakha-goo" x="-30%" y="-30%" width="160%" height="160%">
                                    <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
                                    <feColorMatrix
                                        in="blur"
                                        mode="matrix"
                                        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8"
                                        result="goo"
                                    />
                                    <feBlend in="SourceGraphic" in2="goo" />
                                </filter>
                            </defs>
                        </svg>

                        {/* ── Phase badge ────────────────────────────────────────────── */}
                        <motion.div
                            className={styles.phaseBadge}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35, duration: 0.5 }}
                        >
                            {phaseInfo.emoji} {phaseInfo.label}
                        </motion.div>

                        {/* ── Aura stage ────────────────────────────────────────────── */}
                        <motion.div
                            className={styles.auraStage}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 180, damping: 22, duration: 0.7 }}
                        >
                            {/* ── Cymatic soundwave rings (always in DOM, opacity-toggled to avoid repaint on mount) ── */}
                            <div style={{ opacity: sakhaState === 'speaking' ? 1 : 0, transition: 'opacity 0.3s ease', willChange: 'opacity' }}>
                                <div className={styles.soundRing} />
                                <div className={styles.soundRing} />
                                <div className={styles.soundRing} />
                                <div className={styles.soundRing} />
                            </div>

                            {/* ── Warm human-aura ambient glow — always visible, pulsing ── */}
                            <div
                                style={{
                                    position: 'absolute',
                                    width: '340px',
                                    height: '340px',
                                    borderRadius: '50%',
                                    background: 'radial-gradient(circle, rgba(251,176,59,0.18) 0%, rgba(234,88,12,0.10) 45%, transparent 70%)',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    animation: 'none',
                                    pointerEvents: 'none',
                                    zIndex: 0,
                                }}
                            />

                            {/* ── Liquid "Goo" blob container ───────────────────────── */}
                            <motion.div
                                className={styles.gooContainer}
                                animate={
                                    blobAnimKey === 'idle'
                                        ? { y: [0, -10, -10, 0], transition: breathTransition }
                                        : { y: 0 }
                                }
                            >
                                {/* Core blob — indigo base */}
                                <motion.div
                                    className={`${styles.blob} ${styles.blobCore}`}
                                    animate={mainBlobVariants[blobAnimKey]}
                                />

                                {/* Satellite blob A — champagne gold tint, orbits top-left */}
                                <motion.div
                                    className={`${styles.blob} ${styles.blobA}`}
                                    animate={{
                                        x: [0, 14, -8, 14, 0],
                                        y: [0, -10, 6, -6, 0],
                                        scale:
                                            sakhaState === 'speaking'
                                                ? [1, 1.15, 0.95, 1.1, 1]
                                                : sakhaState === 'listening'
                                                    ? [1, 1 + micVolume * 0.3, 1]
                                                    : [1, 1.04, 1],
                                    }}
                                    transition={{
                                        duration: sakhaState === 'speaking' ? 1.8 : 9,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                    }}
                                />

                                {/* Satellite blob B — lavender tint, orbits bottom-right */}
                                <motion.div
                                    className={`${styles.blob} ${styles.blobB}`}
                                    animate={{
                                        x: [0, -12, 10, -10, 0],
                                        y: [0, 10, -8, 8, 0],
                                        scale:
                                            sakhaState === 'speaking'
                                                ? [1, 0.85, 1.15, 0.95, 1]
                                                : [1, 1.03, 1],
                                    }}
                                    transition={{
                                        duration: sakhaState === 'speaking' ? 2.1 : 11,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                        delay: 0.5,
                                    }}
                                />

                                {/* Satellite blob C — pearl tint, top-right */}
                                <motion.div
                                    className={`${styles.blob} ${styles.blobC}`}
                                    animate={{
                                        x: [0, 8, -12, 6, 0],
                                        y: [0, -8, 4, -10, 0],
                                        scale: sakhaState === 'speaking' ? [1, 1.1, 0.9, 1] : [1, 1.02, 1],
                                    }}
                                    transition={{
                                        duration: sakhaState === 'speaking' ? 1.5 : 13,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                        delay: 1.2,
                                    }}
                                />

                                {/* Satellite blob D — soft lavender, bottom-left */}
                                <motion.div
                                    className={`${styles.blob} ${styles.blobD}`}
                                    animate={{
                                        x: [0, -10, 8, -6, 0],
                                        y: [0, 12, -6, 10, 0],
                                        scale: sakhaState === 'speaking' ? [1, 1.08, 0.92, 1] : [1, 1.02, 1],
                                    }}
                                    transition={{
                                        duration: sakhaState === 'speaking' ? 2.4 : 10,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                        delay: 1.8,
                                    }}
                                />
                            </motion.div>

                            {/* ── Bindu + 4-point star overlay (above the goo filter) ── */}
                            <div className={styles.bindusWrap}>
                                <motion.div
                                    animate={{
                                        rotate: sakhaState === 'thinking' ? 360 : [0, 5, -5, 0],
                                    }}
                                    transition={
                                        sakhaState === 'thinking'
                                            ? { duration: 6, repeat: Infinity, ease: 'linear' }
                                            : { duration: 12, repeat: Infinity, ease: 'easeInOut' }
                                    }
                                    style={{ position: 'relative', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <ClarityStar />
                                </motion.div>
                                <div className={styles.bindu} />
                            </div>
                        </motion.div>

                        {/* ── Quick Action Buttons ─────────────────────────────────── */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                            style={{
                                position: 'fixed',
                                top: 100,
                                right: 24,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 12,
                                zIndex: 100,
                            }}
                        >
                            {[
                                { icon: Sparkles, label: 'Meditate', onClick: handleMeditate, color: '#fde68a' },
                                { icon: Calendar, label: 'Plan', onClick: handlePlan, color: '#fdba74' },
                                { icon: Focus, label: 'Focus', onClick: handleFocus, color: '#6ee7b7' },
                                { icon: Wind, label: 'Breathe', onClick: handleRest, color: '#fcd34d' },
                            ].map((action, i) => (
                                <motion.button
                                    key={action.label}
                                    whileHover={{ scale: 1.05, x: -4 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={action.onClick}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.7 + i * 0.1 }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        padding: '10px 16px',
                                        background: 'rgba(255,255,255,0.06)',
                                        backdropFilter: 'blur(12px)',
                                        border: `1px solid ${action.color}30`,
                                        borderRadius: 999,
                                        cursor: 'pointer',
                                        color: action.color,
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                        letterSpacing: '0.08em',
                                        textTransform: 'uppercase',
                                        fontFamily: 'system-ui, sans-serif',
                                        boxShadow: `0 4px 20px ${action.color}15`,
                                    }}
                                >
                                    <action.icon size={14} />
                                    {action.label}
                                </motion.button>
                            ))}
                        </motion.div>

                        {/* ── Daily Wisdom Card ────────────────────────────────────── */}
                        <AnimatePresence>
                            {showWisdom && sakhaState === 'idle' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ delay: 0.8, duration: 0.5 }}
                                    style={{
                                        position: 'fixed',
                                        bottom: 140,
                                        left: 24,
                                        maxWidth: 280,
                                        padding: '16px 20px',
                                        background: 'rgba(255,255,255,0.04)',
                                        backdropFilter: 'blur(20px)',
                                        border: '1px solid rgba(255,255,255,0.10)',
                                        borderRadius: 16,
                                        borderLeft: '3px solid rgba(251,191,36,0.50)',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <Lightbulb size={14} style={{ color: '#fbbf24' }} />
                                        <span style={{ fontSize: '0.55rem', color: 'rgba(251,191,36,0.80)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                                            Daily Wisdom
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, fontStyle: 'italic', fontFamily: "'Georgia', serif" }}>
                                        {phaseInfo.wisdom}
                                    </p>
                                    <button
                                        onClick={() => setShowWisdom(false)}
                                        style={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            width: 20,
                                            height: 20,
                                            borderRadius: '50%',
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'rgba(255,255,255,0.30)',
                                            cursor: 'pointer',
                                            fontSize: '0.70rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        ×
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── Floating emoji animation (when Bodhi is speaking) ── */}
                        <AnimatePresence>
                            {floatingEmojis.map(fe => (
                                <motion.div
                                    key={fe.id}
                                    initial={{ opacity: 1, y: 0, scale: 1 }}
                                    animate={{ opacity: 0, y: -220, scale: 1.8 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 1.4, ease: 'easeOut' }}
                                    style={{
                                        position: 'fixed',
                                        bottom: 160,
                                        left: 0,
                                        right: 0,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        zIndex: 300,
                                        fontSize: '2.2rem',
                                        pointerEvents: 'none',
                                    }}
                                >
                                    {fe.emoji}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* ── Mood Emoji Picker (always visible, react at ANY time) ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.4 }}
                            style={{
                                position: 'fixed',
                                bottom: 108,
                                left: 0,
                                right: 0,
                                zIndex: 200,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 5,
                                pointerEvents: 'none',
                            }}
                        >
                            <div style={{
                                fontSize: '0.48rem',
                                color: 'rgba(255,255,255,0.35)',
                                letterSpacing: '0.10em',
                                textTransform: 'uppercase',
                                fontFamily: 'system-ui, sans-serif',
                                fontWeight: 600,
                                pointerEvents: 'none',
                            }}>
                                {orbMoodEmoji
                                    ? `${orbMoodEmoji} ${orbMoodLabel} — Bodhi knows`
                                    : 'React anytime ↓'}
                            </div>
                            {/* Compact emoji grid — 4+4 in two rows on mobile */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxWidth: 280, pointerEvents: 'auto' }}>
                                {MOOD_EMOJIS_ORB.map(m => (
                                    <motion.button
                                        key={m.emoji}
                                        whileTap={{ scale: 0.78 }}
                                        whileHover={{ scale: 1.18 }}
                                        onClick={(e) => { e.stopPropagation(); handleOrbMoodSelect(m.emoji, m.label, m.mood); }}
                                        title={m.label}
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: '50%',
                                            background: orbMoodEmoji === m.emoji ? `${m.color}35` : 'rgba(255,255,255,0.07)',
                                            border: orbMoodEmoji === m.emoji
                                                ? `2px solid ${m.color}99`
                                                : '1px solid rgba(255,255,255,0.13)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            fontSize: '1.0rem',
                                            backdropFilter: 'blur(10px)',
                                            boxShadow: orbMoodEmoji === m.emoji
                                                ? `0 0 10px ${m.color}55, inset 0 1px 0 rgba(255,255,255,0.18)`
                                                : '0 1px 6px rgba(0,0,0,0.18)',
                                            transition: 'background 0.18s, border 0.18s, box-shadow 0.18s',
                                        }}
                                    >
                                        {m.emoji}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>

                        {/* ── Breathing Mode Overlay ───────────────────────────────── */}
                        <AnimatePresence>
                            {breathingMode && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    style={{
                                        position: 'fixed',
                                        inset: 0,
                                        zIndex: 50,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'rgba(0,0,0,0.85)',
                                        backdropFilter: 'blur(20px)',
                                    }}
                                >
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.5, 1.5, 1],
                                            opacity: [0.3, 0.6, 0.6, 0.3],
                                        }}
                                        transition={{
                                            duration: 8,
                                            repeat: Infinity,
                                            ease: 'easeInOut',
                                            times: [0, 0.4, 0.6, 1],
                                        }}
                                        style={{
                                            width: 200,
                                            height: 200,
                                            borderRadius: '50%',
                                            background: 'radial-gradient(circle, rgba(45,212,191,0.40) 0%, transparent 70%)',
                                            position: 'absolute',
                                        }}
                                    />
                                    <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
                                        <motion.p
                                            animate={{ opacity: [0.5, 1, 1, 0.5] }}
                                            transition={{ duration: 8, repeat: Infinity, times: [0, 0.4, 0.6, 1] }}
                                            style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.90)', marginBottom: 8 }}
                                        >
                                            Breathe
                                        </motion.p>
                                        <p style={{ fontSize: '0.70rem', color: 'rgba(255,255,255,0.50)', letterSpacing: '0.1em' }}>
                                            Inhale · Hold · Exhale
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setBreathingMode(false)}
                                        style={{
                                            position: 'absolute',
                                            bottom: 60,
                                            padding: '12px 24px',
                                            background: 'rgba(255,255,255,0.08)',
                                            border: '1px solid rgba(255,255,255,0.20)',
                                            borderRadius: 999,
                                            color: 'rgba(255,255,255,0.70)',
                                            cursor: 'pointer',
                                            fontSize: '0.65rem',
                                            letterSpacing: '0.1em',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        Exit Breathing
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── Glass pill state indicator ────────────────────────────── */}
                        <AnimatePresence mode="wait">
                            {stateLabel && (
                                <motion.div
                                    key={stateLabel}
                                    className={styles.glassIndicator}
                                    initial={{ opacity: 0, y: 8, scale: 0.92 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.92 }}
                                    transition={{ duration: 0.28 }}
                                >
                                    {showLiveDot && <span className={styles.liveDot} />}
                                    {stateLabel}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Subtitles intentional hidden from UI */}

                        {/* ── Dismiss button ───────────────────────────────────────────────── */}
                        <button
                            className={styles.dismissBtn}
                            onClick={handleDismiss}
                        >
                            Dismiss Sakha
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

        </>
    );
}
