'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import SakhaBodhiOrb from '@/components/Dashboard/SakhaBodhiOrb';
import { useDailyTasks, type TaskItem } from '@/hooks/useDailyTasks';
import { useOneSutraAuth } from '@/hooks/useOneSutraAuth';
import { useBrahmastraState } from '@/hooks/useBrahmastraState';
import BrahmastraFocusCard from '@/components/Dashboard/BrahmastraFocusCard';
import styles from './page.module.css';

// ─── Background pools (serene nature, circadian) ─────────────────────────────

const BG_POOLS: Record<string, string[]> = {
    morning: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=85',   // misty mountain lake at dawn
        'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1600&q=85',   // sunrise forest mist
    ],
    midday: [
        'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=85',   // calm alpine meadow
        'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1600&q=85',   // sunlit forest stream
    ],
    evening: [
        'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=1600&q=85',   // golden sunset coast
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&q=85',   // mountain silhouette dusk
    ],
    night: [
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&q=85',   // milky way mountain lake
        'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=1600&q=85',   // starry night sky
    ],
};

// ─── Guna Time Logic (Satva, Rajas, Tamas) ───────────────────────────────────

type GunaType = 'rajas' | 'tamas' | 'satva' | 'rest';

function getCurrentGuna(hour: number): GunaType {
    if (hour >= 6 && hour < 14) return 'rajas';   // 6 AM – 2 PM: Activity/Work
    if (hour >= 14 && hour < 18) return 'tamas';  // 2 PM – 6 PM: Inertia/Light tasks
    if (hour >= 18 && hour < 22) return 'satva';  // 6 PM – 10 PM: Harmony/Spiritual
    return 'rest';                                // 10 PM – 6 AM: Deep rest
}

function getTaskGuna(task: TaskItem): GunaType {
    const text = task.text.toLowerCase();
    // Meditation tasks always go to Satva/evening
    if (text.includes('meditation') || text.includes('centering') || text.includes('peace integration') ||
        text.includes('dhyan') || text.includes('morning mindful') || text.includes('evening peace')) {
        return 'satva';
    }
    const cat = (task.category || '').toLowerCase();
    if (cat === 'health' || cat === 'fitness' || cat === 'wellness') return 'rajas';
    if (cat === 'learning' || cat === 'creative' || cat === 'journal') return 'satva';
    if (cat === 'admin' || cat === 'errands' || cat === 'social') return 'tamas';

    // By start time
    if (task.startTime) {
        const t = task.startTime.toLowerCase();
        if (t.includes('6') || t.includes('7') || t.includes('8') || t.includes('9') || t.includes('10') || t.includes('11') || t.includes('12') || t.includes('13')) return 'rajas';
        if (t.includes('14') || t.includes('15') || t.includes('16') || t.includes('17') || t.includes('2 pm') || t.includes('3 pm') || t.includes('4 pm') || t.includes('5 pm')) return 'tamas';
        if (t.includes('18') || t.includes('19') || t.includes('20') || t.includes('21') || t.includes('6 pm') || t.includes('7 pm') || t.includes('8 pm')) return 'satva';
    }
    // Default by category
    if (cat === 'focus' || cat === 'work' || cat === 'study') return 'rajas';
    return 'rajas'; // Most tasks default to Rajas (work/action)
}

const GUNA_META = {
    rajas: { emoji: '⚡', label: 'Rajas Period', sublabel: '6 AM – 2 PM · Activity & Work', headerClass: 'rajasHeader', badgeClass: 'gunaLabelRajas', color: '#fb923c' },
    tamas: { emoji: '🌑', label: 'Tamas Period', sublabel: '2 PM – 6 PM · Light Tasks', headerClass: 'tamasHeader', badgeClass: 'gunaLabelTamas', color: '#4ade80' },
    satva: { emoji: '☀️', label: 'Satva Period', sublabel: '6 PM – 10 PM · Harmony & Spirit', headerClass: 'satvaHeader', badgeClass: 'gunaLabelSatva', color: '#a78bfa' },
    rest: { emoji: '🌙', label: 'Rest Period', sublabel: '10 PM – 6 AM · Deep Rest', headerClass: 'restHeader', badgeClass: 'gunaLabelRest', color: '#94a3b8' },
};

// Meditation detection
function isMeditationTask(task: TaskItem): boolean {
    const text = task.text.toLowerCase();
    return text.includes('morning mindful') || text.includes('evening peace') ||
        text.includes('meditation') || text.includes('meditat') ||
        text.includes('dhyan') || text.includes('centering') ||
        text.includes('🌅') || text.includes('🌇');
}

// ─── Skeleton Task Card ───────────────────────────────────────────────────────

function TaskCard({
    task,
    onToggle,
    onRemove,
    onMeditationTap,
}: {
    task: TaskItem;
    onToggle: (id: string) => void;
    onRemove: (id: string) => void;
    onMeditationTap: () => void;
}) {
    const guna = getTaskGuna(task);
    const meta = GUNA_META[guna];
    const isMed = isMeditationTask(task);

    const handleClick = () => {
        if (isMed && !task.done) {
            onMeditationTap();
        }
    };

    return (
        <motion.div
            className={`${styles.taskCard} ${task.done ? styles.taskCardDone : ''} ${isMed ? styles.taskCardMeditation : ''}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden', marginBottom: 0 }}
            layout
            onClick={handleClick}
        >
            <div className={styles.taskCardTop}>
                <button
                    className={`${styles.taskCheckBtn} ${task.done ? styles.taskCheckBtnDone : ''}`}
                    onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
                    aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}
                >
                    {task.done && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    )}
                </button>
                <span className={styles.taskText}>
                    {task.icon && task.icon !== '✨' ? `${task.icon} ` : ''}{task.text}
                </span>
                <button
                    className={styles.addTaskBtn}
                    style={{ width: 22, height: 22, minWidth: 22, padding: 0, flexShrink: 0, marginTop: 0, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)' }}
                    onClick={(e) => { e.stopPropagation(); onRemove(task.id); }}
                    aria-label="Remove task"
                >
                    ✕
                </button>
            </div>
            <div className={styles.taskMeta}>
                {task.startTime && (
                    <span className={styles.taskTime}>⏰ {task.startTime}</span>
                )}
                {task.allocatedMinutes && (
                    <span className={styles.taskDuration}>{task.allocatedMinutes}m</span>
                )}
                <span
                    className={`${styles.taskGunaBadge} ${styles[meta.badgeClass]}`}
                    style={{ color: meta.color, background: `${meta.color}18`, border: `1px solid ${meta.color}30` }}
                >
                    {meta.emoji} {meta.label.split(' ')[0]}
                </span>
                {isMed && !task.done && (
                    <span style={{ fontSize: '0.6rem', color: '#fde047', background: 'rgba(253,224,71,0.12)', borderRadius: 6, padding: '0.1rem 0.4rem', border: '1px solid rgba(253,224,71,0.25)' }}>
                        ✦ Tap to enter
                    </span>
                )}
            </div>
        </motion.div>
    );
}

// ─── Integration Break Card ───────────────────────────────────────────────────

function BreakCard({ label }: { label: string }) {
    return (
        <div className={styles.breakCard}>
            <span>🫁</span>
            <span>{label}</span>
        </div>
    );
}

// ─── Timeline Slot ────────────────────────────────────────────────────────────

function TimelineSlot({
    hour,
    tasks,
    isCurrent,
    onToggle,
    onRemove,
    onMeditationTap,
}: {
    hour: number;
    tasks: TaskItem[];
    isCurrent: boolean;
    onToggle: (id: string) => void;
    onRemove: (id: string) => void;
    onMeditationTap: () => void;
}) {
    const label = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
    const guna = getCurrentGuna(hour);
    const meta = GUNA_META[guna];

    return (
        <div className={styles.timelineSlot}>
            <div className={styles.timelineHour} style={isCurrent ? { color: '#fde047', fontWeight: 700 } : {}}>
                {label}
            </div>
            <div className={styles.timelineLine}>
                <div className={`${styles.timelineDot} ${isCurrent ? styles.timelineCurrentDot : ''}`} />
            </div>
            <div className={styles.timelineContent}>
                {tasks.length === 0 ? (
                    <div className={styles.timelineBlockEmpty} style={{ borderLeftColor: `${meta.color}20` }}>
                        {meta.emoji} {meta.sublabel.split('·')[1]?.trim()} time
                    </div>
                ) : (
                    tasks.map((task) => (
                        <TaskCard key={task.id} task={task} onToggle={onToggle} onRemove={onRemove} onMeditationTap={onMeditationTap} />
                    ))
                )}
            </div>
        </div>
    );
}

// ─── Main Planner Page ────────────────────────────────────────────────────────

export default function VedicPlannerPage() {
    const router = useRouter();
    const { user } = useOneSutraAuth();
    const userName = user?.name || 'Traveller';
    const [userId, setUserId] = useState<string | null>(null);
    const [isSakhaActive, setIsSakhaActive] = useState(false);
    const [view, setView] = useState<'kanban' | 'timeline' | 'board'>('board');
    const [currentHour, setCurrentHour] = useState(new Date().getHours());
    const [isMounted, setIsMounted] = useState(false);
    const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

    const { tasks, addTask, toggleTaskDone, removeTask } = useDailyTasks();
    const brahmastraState = useBrahmastraState(userId);

    // Background selection
    const getBgPeriod = (h: number) => {
        if (h >= 5 && h < 11) return 'morning';
        if (h >= 11 && h < 17) return 'midday';
        if (h >= 17 && h < 21) return 'evening';
        return 'night';
    };

    const bgPeriod = getBgPeriod(currentHour);
    const bgPool = BG_POOLS[bgPeriod];
    const bgSlot = Math.floor(Date.now() / (30 * 60_000));
    const bgUrl = bgPool[bgSlot % bgPool.length];

    const currentGuna = getCurrentGuna(currentHour);
    const gunaMeta = GUNA_META[currentGuna];

    // Mount
    useEffect(() => {
        setIsMounted(true);
        setCurrentHour(new Date().getHours());

        // Get Firebase UID
        Promise.all([import('@/lib/firebase'), import('firebase/auth')]).then(([{ getFirebaseAuth }, { onAuthStateChanged }]) => {
            getFirebaseAuth().then(auth => {
                onAuthStateChanged(auth, (u) => { if (u) setUserId(u.uid); });
            });
        }).catch(() => { });
    }, []);

    // Auto-seed daily meditation tasks
    useEffect(() => {
        if (!isMounted || tasks === undefined) return;
        const today = new Date().toISOString().split('T')[0];

        const hasMorning = tasks.some(t => t.text.toLowerCase().includes('morning mindful'));
        const hasEvening = tasks.some(t => t.text.toLowerCase().includes('evening peace'));

        if (!hasMorning) {
            const morningTask: TaskItem = {
                id: `med-morning-${today}`,
                text: '🌅 Morning Mindful Centering',
                icon: '🌅',
                category: 'Wellness',
                colorClass: 'amber',
                accentColor: '251,191,36',
                done: false,
                startTime: '6:00 AM',
                allocatedMinutes: 20,
                createdAt: Date.now() - 2000,
                scheduledDate: today,
            };
            addTask(morningTask).catch(() => { });
        }

        if (!hasEvening) {
            const eveningTask: TaskItem = {
                id: `med-evening-${today}`,
                text: '🌇 Evening Peace Integration',
                icon: '🌇',
                category: 'Wellness',
                colorClass: 'violet',
                accentColor: '167,139,250',
                done: false,
                startTime: '6:00 PM',
                allocatedMinutes: 20,
                createdAt: Date.now() - 1000,
                scheduledDate: today,
            };
            addTask(eveningTask).catch(() => { });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMounted]);

    // Audio unlock
    const unlockAudio = () => {
        if (isAudioUnlocked || typeof window === 'undefined') return;
        try {
            const u = new SpeechSynthesisUtterance('');
            u.volume = 0;
            window.speechSynthesis.speak(u);
        } catch { }
        setIsAudioUnlocked(true);
    };

    // Navigation handlers
    const handleMeditationTap = useCallback(() => {
        router.push('/dhyan-kshetra');
    }, [router]);

    const handleTriggerMeditationScreen = useCallback(() => {
        router.push('/dhyan-kshetra');
    }, [router]);

    const handleNavigateToPlanner = useCallback(() => {
        // Already on planner page — no-op or just close Bodhi
        setIsSakhaActive(false);
    }, []);

    // Categorise tasks by Guna
    const rajasTasks = useMemo(() => tasks.filter(t => getTaskGuna(t) === 'rajas' && t.category !== 'Challenge' && t.category !== 'Issue' && t.category !== 'Idea'), [tasks]);
    const tamasTasks = useMemo(() => tasks.filter(t => getTaskGuna(t) === 'tamas' && t.category !== 'Challenge' && t.category !== 'Issue' && t.category !== 'Idea'), [tasks]);
    const satvaTasks = useMemo(() => tasks.filter(t => (getTaskGuna(t) === 'satva' || getTaskGuna(t) === 'rest') && t.category !== 'Challenge' && t.category !== 'Issue' && t.category !== 'Idea'), [tasks]);

    // Challenges, Issues, Ideas — shown in dedicated sections
    const challengeTasks = useMemo(() => tasks.filter(t => t.category === 'Challenge' && !t.done), [tasks]);
    const issueTasks = useMemo(() => tasks.filter(t => t.category === 'Issue' && !t.done), [tasks]);
    const ideaTasks = useMemo(() => tasks.filter(t => t.category === 'Idea' && !t.done), [tasks]);

    // Timeline: group tasks by start hour
    const tasksByHour = useMemo(() => {
        const map: Record<number, TaskItem[]> = {};
        tasks.forEach(task => {
            let hour = 9; // default
            if (task.startTime) {
                const m = task.startTime.match(/(\d+)(?::(\d+))?\s*(am|pm)?/i);
                if (m) {
                    hour = parseInt(m[1]);
                    const ampm = (m[3] || '').toLowerCase();
                    if (ampm === 'pm' && hour !== 12) hour += 12;
                    if (ampm === 'am' && hour === 12) hour = 0;
                }
            }
            if (!map[hour]) map[hour] = [];
            map[hour].push(task);
        });
        return map;
    }, [tasks]);

    const completed = tasks.filter(t => t.done).length;
    const total = tasks.length;
    const progress = total > 0 ? (completed / total) * 100 : 0;

    // Date display
    const dateStr = isMounted ? new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) : '';

    // Timeline hours to show
    const timelineHours = Array.from({ length: 17 }, (_, i) => i + 5); // 5 AM to 10 PM

    return (
        <div className={styles.container}>
            {/* Background */}
            <div className={styles.bg} style={{ backgroundImage: `url(${bgUrl})` }} aria-hidden />
            <div className={styles.bgOverlay} aria-hidden />

            {/* Header Nav */}
            <nav className={styles.headerNav}>
                <button className={styles.backBtn} onClick={() => router.push('/')}>
                    ← Home
                </button>
                <div className={styles.datePill} style={{ margin: 0 }}>
                    <span className={`${styles.gunaLabel} ${styles[gunaMeta.badgeClass]}`} style={{ color: gunaMeta.color, background: `${gunaMeta.color}18`, border: `1px solid ${gunaMeta.color}30` }}>
                        {gunaMeta.emoji}
                    </span>
                    <span>{isMounted ? dateStr : ''}</span>
                </div>
            </nav>

            {/* Content */}
            <div className={styles.content}>
                {/* Header */}
                <div className={styles.header}>
                    <h1 className={styles.title}>Advance Personal Manager</h1>
                    <p className={styles.subtitle}>योजना · Yojana — Logical Schedule Planning</p>
                </div>

                {/* Current Phase Banner */}
                <div className={styles.phaseBanner}>
                    <p className={styles.phaseBannerTitle}>Current Guna Window</p>
                    <p className={styles.phaseBannerText}>
                        {gunaMeta.emoji} <strong>{gunaMeta.label}</strong> · {gunaMeta.sublabel.split('·')[1]?.trim()} — {
                            currentGuna === 'rajas' ? 'Ideal for work & action: coding, meetings, strategic tasks.' :
                                currentGuna === 'tamas' ? 'Best for admin, errands, emails & light tasks.' :
                                    currentGuna === 'satva' ? 'Perfect for spiritual work, reflection & meditation.' :
                                        'Rest and restore. Minimal screens, early sleep.'
                        }
                    </p>
                </div>

                {/* Advanced Protocol Section */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        marginBottom: '1.5rem',
                        ...(brahmastraState.active ? {
                            background: 'linear-gradient(180deg,rgba(255,80,10,0.06) 0%,transparent 40%)',
                            borderRadius: '1.4rem',
                            border: '1px solid rgba(255,100,30,0.15)',
                            padding: '0.5rem 0 0.5rem',
                            boxShadow: '0 0 40px rgba(255,80,10,0.08)',
                        } : {}),
                    }}
                >
                    <BrahmastraFocusCard
                        active={brahmastraState.active}
                        focusWindowMinutes={brahmastraState.focusWindowMinutes}
                        impactedMeetings={brahmastraState.impactedMeetings}
                        subtitle={
                            brahmastraState.reason
                                ? `Current mantra: ${brahmastraState.reason}`
                                : 'Silence the noise. Guard the inner fire.'
                        }
                    />
                </motion.div>

                {/* Progress */}
                {isMounted && total > 0 && (
                    <div className={styles.progressBar}>
                        <div className={styles.progressFlex}>
                            <p className={styles.progressTitle}>Today's Sankalpa Progress</p>
                            <div className={styles.progressTrack}>
                                <motion.div
                                    className={styles.progressFill}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                />
                            </div>
                        </div>
                        <div className={styles.progressStats}>
                            <div className={styles.progressStat}>
                                <span className={styles.progressStatNumber}>{completed}</span>
                                <span className={styles.progressStatLabel}>Done</span>
                            </div>
                            <div className={styles.progressStat}>
                                <span className={styles.progressStatNumber}>{total - completed}</span>
                                <span className={styles.progressStatLabel}>Pending</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* View Toggle */}
                <div className={styles.viewToggle}>
                    <button
                        className={`${styles.viewBtn} ${view === 'board' ? styles.viewBtnActive : ''}`}
                        onClick={() => setView('board')}
                    >
                        ✦ Board
                    </button>
                    <button
                        className={`${styles.viewBtn} ${view === 'kanban' ? styles.viewBtnActive : ''}`}
                        onClick={() => setView('kanban')}
                    >
                        ⊞ Kanban
                    </button>
                    <button
                        className={`${styles.viewBtn} ${view === 'timeline' ? styles.viewBtnActive : ''}`}
                        onClick={() => setView('timeline')}
                    >
                        ⏱ Timeline
                    </button>
                </div>

                {/* ── Board View (Tasks | Ideas | Challenges) ── */}
                <AnimatePresence mode="wait">
                    {view === 'board' && (() => {
                        const boardTasks = tasks.filter(t => !t.done && t.category !== 'Challenge' && t.category !== 'Issue' && t.category !== 'Idea');
                        const boardIdeas = tasks.filter(t => t.category === 'Idea' && !t.done);
                        const boardChallenges = tasks.filter(t => (t.category === 'Challenge' || t.category === 'Issue') && !t.done);
                        const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
                        const boardCols = [
                            { key: 'tasks', label: 'Tasks', icon: '✅', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.22)', items: boardTasks },
                            { key: 'ideas', label: 'Ideas', icon: '💡', color: '#2dd4bf', bg: 'rgba(45,212,191,0.08)', border: 'rgba(45,212,191,0.22)', items: boardIdeas },
                            { key: 'challenges', label: 'Challenges', icon: '⚡', color: '#fb923c', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.22)', items: boardChallenges },
                        ];
                        return (
                            <motion.div
                                key="board"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.3 }}
                                style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}
                            >
                                {boardCols.map(col => (
                                    <div key={col.key} style={{ background: col.bg, border: `1px solid ${col.border}`, borderRadius: 16, padding: '0.75rem 0.65rem', minHeight: 180, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {/* Column header */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem' }}>
                                            <span style={{ fontSize: '0.85rem' }}>{col.icon}</span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '0.60rem', fontWeight: 800, color: col.color, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{col.label}</div>
                                                <div style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.38)', marginTop: 1 }}>{col.items.length} item{col.items.length !== 1 ? 's' : ''}</div>
                                            </div>
                                        </div>
                                        {/* Items */}
                                        {isMounted && col.items.length === 0 && (
                                            <div style={{ fontSize: '0.60rem', color: 'rgba(255,255,255,0.25)', textAlign: 'center', paddingTop: '0.75rem', fontStyle: 'italic', lineHeight: 1.5 }}>No {col.label.toLowerCase()}\nsaved yet</div>
                                        )}
                                        {isMounted && col.items.map(task => (
                                            <motion.div
                                                key={task.id}
                                                initial={{ opacity: 0, scale: 0.96 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${col.border}`, borderRadius: 10, padding: '0.55rem 0.60rem', position: 'relative' }}
                                            >
                                                <p style={{ margin: 0, fontSize: '0.68rem', color: 'rgba(255,255,255,0.86)', lineHeight: 1.4, fontFamily: "'Outfit', sans-serif", wordBreak: 'break-word' }}>
                                                    {task.text.replace(/^[\s✅💡⚡🔥↳]+/, '')}
                                                </p>
                                                {/* Date + time pills */}
                                                {(task.scheduledDate || task.startTime || task.scheduledTime) && (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.35rem' }}>
                                                        {task.scheduledDate && (
                                                            <span style={{ fontSize: '0.46rem', fontWeight: 700, color: col.color, background: `${col.color}18`, border: `1px solid ${col.color}28`, borderRadius: 999, padding: '0.12rem 0.38rem', fontFamily: 'monospace' }}>
                                                                📅 {fmtDate(task.scheduledDate)}
                                                            </span>
                                                        )}
                                                        {(task.startTime || task.scheduledTime) && (
                                                            <span style={{ fontSize: '0.46rem', fontWeight: 700, color: col.color, background: `${col.color}18`, border: `1px solid ${col.color}28`, borderRadius: 999, padding: '0.12rem 0.38rem', fontFamily: 'monospace' }}>
                                                                🕐 {task.startTime || task.scheduledTime}
                                                            </span>
                                                        )}
                                                        {task.allocatedMinutes && (
                                                            <span style={{ fontSize: '0.46rem', fontWeight: 700, color: 'rgba(255,255,255,0.38)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 999, padding: '0.12rem 0.38rem', fontFamily: 'monospace' }}>
                                                                ⏱ {task.allocatedMinutes}m
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {/* Bodhi advice snippet */}
                                                {task.aiAdvice && (
                                                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.55rem', color: `${col.color}99`, fontStyle: 'italic', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                        {task.aiAdvice}
                                                    </p>
                                                )}
                                                {/* Done button */}
                                                <button
                                                    onClick={() => toggleTaskDone(task.id)}
                                                    style={{ position: 'absolute', top: '0.4rem', right: '0.4rem', background: 'rgba(255,255,255,0.07)', border: `1px solid ${col.border}`, borderRadius: 6, padding: '0.14rem 0.35rem', cursor: 'pointer', color: col.color, fontSize: '0.46rem', fontWeight: 700, fontFamily: 'inherit', letterSpacing: '0.06em' }}
                                                >
                                                    ✓
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                ))}
                            </motion.div>
                        );
                    })()}

                {/* Kanban View */}
                    {view === 'kanban' && (
                        <motion.div
                            key="kanban"
                            className={styles.kanbanGrid}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Rajas Column */}
                            <div className={styles.gunaColumn}>
                                <div className={`${styles.gunaColumnHeader} ${styles.rajasHeader}`}>
                                    ⚡
                                    <div>
                                        <div>Rajas</div>
                                        <div className={styles.gunaSubtext}>6AM–2PM · Activity</div>
                                    </div>
                                </div>
                                <AnimatePresence>
                                    {isMounted && rajasTasks.map((task, i) => (
                                        <React.Fragment key={task.id}>
                                            {i > 0 && i % 3 === 0 && (
                                                <BreakCard label="5 min Integration Break" />
                                            )}
                                            <TaskCard task={task} onToggle={toggleTaskDone} onRemove={removeTask} onMeditationTap={handleMeditationTap} />
                                        </React.Fragment>
                                    ))}
                                </AnimatePresence>
                                {isMounted && rajasTasks.length === 0 && (
                                    <div className={styles.emptyColumn}>
                                        ⚡ Add work tasks here<br />
                                        <span style={{ fontSize: '0.68rem', opacity: 0.6 }}>coding, meetings, action</span>
                                    </div>
                                )}
                            </div>

                            {/* Tamas Column */}
                            <div className={styles.gunaColumn}>
                                <div className={`${styles.gunaColumnHeader} ${styles.tamasHeader}`}>
                                    🌑
                                    <div>
                                        <div>Tamas</div>
                                        <div className={styles.gunaSubtext}>2PM–6PM · Light</div>
                                    </div>
                                </div>
                                <AnimatePresence>
                                    {isMounted && tamasTasks.map(task => (
                                        <TaskCard key={task.id} task={task} onToggle={toggleTaskDone} onRemove={removeTask} onMeditationTap={handleMeditationTap} />
                                    ))}
                                </AnimatePresence>
                                {isMounted && tamasTasks.length === 0 && (
                                    <div className={styles.emptyColumn}>
                                        🌑 Light tasks for afternoon<br />
                                        <span style={{ fontSize: '0.68rem', opacity: 0.6 }}>emails, errands, admin</span>
                                    </div>
                                )}
                            </div>

                            {/* Satva Column */}
                            <div className={styles.gunaColumn}>
                                <div className={`${styles.gunaColumnHeader} ${styles.satvaHeader}`}>
                                    ☀️
                                    <div>
                                        <div>Satva</div>
                                        <div className={styles.gunaSubtext}>6PM–10PM · Spirit</div>
                                    </div>
                                </div>
                                <AnimatePresence>
                                    {isMounted && satvaTasks.map(task => (
                                        <TaskCard key={task.id} task={task} onToggle={toggleTaskDone} onRemove={removeTask} onMeditationTap={handleMeditationTap} />
                                    ))}
                                </AnimatePresence>
                                {isMounted && satvaTasks.length === 0 && (
                                    <div className={styles.emptyColumn}>
                                        ☀️ Evening flow here<br />
                                        <span style={{ fontSize: '0.68rem', opacity: 0.6 }}>meditation, spiritual work</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Timeline View */}
                    {view === 'timeline' && (
                        <motion.div
                            key="timeline"
                            className={styles.timeline}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.3 }}
                        >
                            {isMounted && timelineHours.map(hour => (
                                <TimelineSlot
                                    key={hour}
                                    hour={hour}
                                    tasks={tasksByHour[hour] || []}
                                    isCurrent={hour === currentHour}
                                    onToggle={toggleTaskDone}
                                    onRemove={removeTask}
                                    onMeditationTap={handleMeditationTap}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Challenges Section ── */}
                {isMounted && challengeTasks.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            marginBottom: '1.2rem',
                            background: 'linear-gradient(135deg,rgba(251,146,60,0.10),rgba(217,70,6,0.07))',
                            border: '1px solid rgba(251,146,60,0.22)',
                            borderRadius: 18,
                            padding: '0.9rem 1rem',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                            <span style={{ fontSize: '1rem' }}>⚡</span>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fb923c' }}>Active Challenges</span>
                            <span style={{ fontSize: '0.58rem', background: 'rgba(251,146,60,0.18)', color: '#fdba74', border: '1px solid rgba(251,146,60,0.30)', borderRadius: 999, padding: '0.08rem 0.45rem', fontWeight: 700 }}>{challengeTasks.length}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                            {challengeTasks.map(task => (
                                <div key={task.id} style={{
                                    display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                                    background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.18)',
                                    borderRadius: 12, padding: '0.55rem 0.75rem',
                                }}>
                                    <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>{task.icon || '⚡'}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ margin: 0, fontSize: '0.76rem', color: 'rgba(255,255,255,0.88)', lineHeight: 1.4 }}>{task.text}</p>
                                        {task.aiAdvice && <p style={{ margin: '0.2rem 0 0', fontSize: '0.60rem', color: 'rgba(251,146,60,0.70)', fontStyle: 'italic', lineHeight: 1.4 }}>{task.aiAdvice}</p>}
                                    </div>
                                    <button onClick={() => toggleTaskDone(task.id)} style={{ flexShrink: 0, background: 'rgba(251,146,60,0.14)', border: '1px solid rgba(251,146,60,0.28)', borderRadius: 8, padding: '0.22rem 0.5rem', cursor: 'pointer', color: '#fdba74', fontSize: '0.52rem', fontWeight: 700, fontFamily: 'inherit', letterSpacing: '0.08em' }}>DONE</button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── Issues Section ── */}
                {isMounted && issueTasks.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.08 }}
                        style={{
                            marginBottom: '1.2rem',
                            background: 'linear-gradient(135deg,rgba(248,113,113,0.10),rgba(220,38,38,0.06))',
                            border: '1px solid rgba(248,113,113,0.22)',
                            borderRadius: 18,
                            padding: '0.9rem 1rem',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                            <span style={{ fontSize: '1rem' }}>🔥</span>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#f87171' }}>Open Issues</span>
                            <span style={{ fontSize: '0.58rem', background: 'rgba(248,113,113,0.18)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.30)', borderRadius: 999, padding: '0.08rem 0.45rem', fontWeight: 700 }}>{issueTasks.length}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                            {issueTasks.map(task => (
                                <div key={task.id} style={{
                                    display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                                    background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)',
                                    borderRadius: 12, padding: '0.55rem 0.75rem',
                                }}>
                                    <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>{task.icon || '🔥'}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ margin: 0, fontSize: '0.76rem', color: 'rgba(255,255,255,0.88)', lineHeight: 1.4 }}>{task.text}</p>
                                        {task.aiAdvice && <p style={{ margin: '0.2rem 0 0', fontSize: '0.60rem', color: 'rgba(248,113,113,0.70)', fontStyle: 'italic', lineHeight: 1.4 }}>{task.aiAdvice}</p>}
                                    </div>
                                    <button onClick={() => toggleTaskDone(task.id)} style={{ flexShrink: 0, background: 'rgba(248,113,113,0.14)', border: '1px solid rgba(248,113,113,0.28)', borderRadius: 8, padding: '0.22rem 0.5rem', cursor: 'pointer', color: '#fca5a5', fontSize: '0.52rem', fontWeight: 700, fontFamily: 'inherit', letterSpacing: '0.08em' }}>RESOLVED</button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── Ideas Section ── */}
                {isMounted && ideaTasks.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.14 }}
                        style={{
                            marginBottom: '1.2rem',
                            background: 'linear-gradient(135deg,rgba(251,191,36,0.10),rgba(180,130,0,0.06))',
                            border: '1px solid rgba(251,191,36,0.20)',
                            borderRadius: 18,
                            padding: '0.9rem 1rem',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                            <span style={{ fontSize: '1rem' }}>💡</span>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fbbf24' }}>Ideas Captured</span>
                            <span style={{ fontSize: '0.58rem', background: 'rgba(251,191,36,0.18)', color: '#fde68a', border: '1px solid rgba(251,191,36,0.28)', borderRadius: 999, padding: '0.08rem 0.45rem', fontWeight: 700 }}>{ideaTasks.length}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                            {ideaTasks.map(task => (
                                <div key={task.id} style={{
                                    display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                                    background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.16)',
                                    borderRadius: 12, padding: '0.55rem 0.75rem',
                                }}>
                                    <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>{task.icon || '💡'}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ margin: 0, fontSize: '0.76rem', color: 'rgba(255,255,255,0.88)', lineHeight: 1.4 }}>{task.text}</p>
                                        {task.aiAdvice && <p style={{ margin: '0.2rem 0 0', fontSize: '0.60rem', color: 'rgba(251,191,36,0.65)', fontStyle: 'italic', lineHeight: 1.4 }}>{task.aiAdvice}</p>}
                                    </div>
                                    <button onClick={() => toggleTaskDone(task.id)} style={{ flexShrink: 0, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.26)', borderRadius: 8, padding: '0.22rem 0.5rem', cursor: 'pointer', color: '#fde68a', fontSize: '0.52rem', fontWeight: 700, fontFamily: 'inherit', letterSpacing: '0.08em' }}>DONE</button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Wisdom Footer */}
                <div className={styles.wisdomBanner}>
                    <p className={styles.wisdomText}>
                        "योगः कर्मसु कौशलम्" — Yoga is excellence in action.<br />
                        <span style={{ fontSize: '0.68rem' }}>Bhagavad Gita 2.50</span>
                    </p>
                </div>
            </div>

            {/* ── Floating Bodhi Orb Trigger ── */}
            <div className={styles.orbArea}>
                <AnimatePresence>
                    {!isSakhaActive && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.4 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.3 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                            style={{ position: 'relative' }}
                        >
                            <span style={{
                                position: 'absolute', bottom: '100%', left: '50%',
                                transform: 'translateX(-50%)', marginBottom: 8,
                                fontSize: 9, fontWeight: 700, letterSpacing: '0.16em',
                                textTransform: 'uppercase', color: 'rgba(45,212,191,0.72)',
                                fontFamily: 'system-ui, sans-serif', whiteSpace: 'nowrap',
                                textShadow: '0 1px 6px rgba(0,0,0,0.7)', pointerEvents: 'none',
                            }}>Bodhi</span>

                            {/* Glow rings */}
                            <motion.div
                                animate={{ scale: [1, 1.12, 1], opacity: [0.45, 0.25, 0.45] }}
                                transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
                                style={{
                                    position: 'absolute', inset: -14, borderRadius: '50%',
                                    background: 'radial-gradient(circle, rgba(20,184,166,0.35) 0%, rgba(253,224,71,0.18) 55%, transparent 75%)',
                                    filter: 'blur(10px)', pointerEvents: 'none',
                                }}
                            />
                            <motion.button
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                onClick={() => { unlockAudio(); setIsSakhaActive(true); }}
                                aria-label="Open Bodhi on Planner"
                                style={{
                                    width: 52, height: 52, borderRadius: '50%',
                                    border: '1px solid rgba(255,255,255,0.20)',
                                    background: 'radial-gradient(circle at 38% 32%, rgba(253,224,71,0.55) 0%, rgba(20,184,166,0.80) 45%, rgba(15,118,110,0.92) 100%)',
                                    boxShadow: '0 4px 24px rgba(20,184,166,0.45), 0 0 0 1px rgba(255,255,255,0.08)',
                                    cursor: 'pointer', backdropFilter: 'blur(8px)',
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Bodhi Orb Overlay ── */}
            <AnimatePresence>
                {isSakhaActive && (
                    <SakhaBodhiOrb
                        key="planner-sakha-orb"
                        userName={userName || 'Mitra'}
                        userId={userId}
                        sankalpaItems={tasks}
                        onSankalpaUpdate={() => { }}
                        onAddTask={addTask}
                        onRemoveTask={removeTask}
                        onDismiss={() => setIsSakhaActive(false)}
                        onTriggerMeditationScreen={handleTriggerMeditationScreen}
                        onNavigateToPlanner={handleNavigateToPlanner}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
