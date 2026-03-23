'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import SakhaBodhiOrb from '@/components/Dashboard/SakhaBodhiOrb';
import { useDailyTasks, type TaskItem } from '@/hooks/useDailyTasks';
import { useOneSutraAuth } from '@/hooks/useOneSutraAuth';
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

// ─── Dosha Time Logic ─────────────────────────────────────────────────────────

type DoshaType = 'pitta' | 'kapha' | 'vata' | 'rest';

function getCurrentDosha(hour: number): DoshaType {
    if (hour >= 6 && hour < 14) return 'pitta';
    if (hour >= 14 && hour < 18) return 'kapha';
    if (hour >= 18 && hour < 22) return 'vata';
    return 'rest';
}

function getTaskDosha(task: TaskItem): DoshaType {
    const text = task.text.toLowerCase();
    // Meditation tasks always go to Vata/evening
    if (text.includes('meditation') || text.includes('centering') || text.includes('peace integration') ||
        text.includes('dhyan') || text.includes('morning mindful') || text.includes('evening peace')) {
        return 'vata';
    }
    const cat = (task.category || '').toLowerCase();
    if (cat === 'health' || cat === 'fitness' || cat === 'wellness') return 'pitta';
    if (cat === 'learning' || cat === 'creative' || cat === 'journal') return 'vata';
    if (cat === 'admin' || cat === 'errands' || cat === 'social') return 'kapha';

    // By start time
    if (task.startTime) {
        const t = task.startTime.toLowerCase();
        if (t.includes('6') || t.includes('7') || t.includes('8') || t.includes('9') || t.includes('10') || t.includes('11') || t.includes('12') || t.includes('13')) return 'pitta';
        if (t.includes('14') || t.includes('15') || t.includes('16') || t.includes('17') || t.includes('2 pm') || t.includes('3 pm') || t.includes('4 pm') || t.includes('5 pm')) return 'kapha';
        if (t.includes('18') || t.includes('19') || t.includes('20') || t.includes('21') || t.includes('6 pm') || t.includes('7 pm') || t.includes('8 pm')) return 'vata';
    }
    // Default by category
    if (cat === 'focus' || cat === 'work' || cat === 'study') return 'pitta';
    return 'pitta'; // Most tasks default to Pitta (deep work)
}

const DOSHA_META = {
    pitta: { emoji: '🔥', label: 'Pitta Time', sublabel: '6 AM – 2 PM · Deep Focus', headerClass: 'pittaHeader', badgeClass: 'doshaLabelPitta', color: '#fb923c' },
    kapha: { emoji: '🌿', label: 'Kapha Time', sublabel: '2 PM – 6 PM · Admin & Light', headerClass: 'kaphaHeader', badgeClass: 'doshaLabelKapha', color: '#4ade80' },
    vata: { emoji: '🌬️', label: 'Vata Time', sublabel: '6 PM – 10 PM · Creative & Reflect', headerClass: 'vataHeader', badgeClass: 'doshaLabelVata', color: '#a78bfa' },
    rest: { emoji: '🌙', label: 'Rest Time', sublabel: '10 PM – 6 AM · Nisha Kaal', headerClass: 'vataHeader', badgeClass: 'doshaLabelRest', color: '#94a3b8' },
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
    const dosha = getTaskDosha(task);
    const meta = DOSHA_META[dosha];
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
                    className={`${styles.taskDoshaBadge} ${styles[meta.badgeClass]}`}
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
    const dosha = getCurrentDosha(hour);
    const meta = DOSHA_META[dosha];

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
    const [view, setView] = useState<'kanban' | 'timeline'>('kanban');
    const [currentHour, setCurrentHour] = useState(new Date().getHours());
    const [isMounted, setIsMounted] = useState(false);
    const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

    const { tasks, addTask, toggleTaskDone, removeTask } = useDailyTasks();

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

    const currentDosha = getCurrentDosha(currentHour);
    const doshaMeta = DOSHA_META[currentDosha];

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

    // Categorise tasks by Dosha
    const pittaTasks = useMemo(() => tasks.filter(t => getTaskDosha(t) === 'pitta'), [tasks]);
    const kaphaTasks = useMemo(() => tasks.filter(t => getTaskDosha(t) === 'kapha'), [tasks]);
    const vataTasks = useMemo(() => tasks.filter(t => getTaskDosha(t) === 'vata' || getTaskDosha(t) === 'rest'), [tasks]);

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
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.14em' }}>
                    VEDIC PLANNER
                </span>
                <div className={styles.datePill} style={{ margin: 0 }}>
                    <span className={`${styles.doshaLabel} ${styles[doshaMeta.badgeClass]}`} style={{ color: doshaMeta.color, background: `${doshaMeta.color}18`, border: `1px solid ${doshaMeta.color}30` }}>
                        {doshaMeta.emoji}
                    </span>
                    <span>{isMounted ? dateStr : ''}</span>
                </div>
            </nav>

            {/* Content */}
            <div className={styles.content}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerIcon}>🪷</div>
                    <h1 className={styles.title}>Vedic Planner</h1>
                    <p className={styles.subtitle}>योजना · Yojana — Sacred Planning</p>
                </div>

                {/* Current Phase Banner */}
                <div className={styles.phaseBanner}>
                    <p className={styles.phaseBannerTitle}>Current Dosha Window</p>
                    <p className={styles.phaseBannerText}>
                        {doshaMeta.emoji} <strong>{doshaMeta.label}</strong> · {doshaMeta.sublabel.split('·')[1]?.trim()} — {
                            currentDosha === 'pitta' ? 'Ideal for deep focus: coding, writing, strategic work.' :
                                currentDosha === 'kapha' ? 'Best for admin, errands, emails & light tasks.' :
                                    currentDosha === 'vata' ? 'Perfect for creative work, reflection & meditation.' :
                                        'Rest and restore. Minimal screens, early sleep.'
                        }
                    </p>
                </div>

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

                {/* Kanban View */}
                <AnimatePresence mode="wait">
                    {view === 'kanban' && (
                        <motion.div
                            key="kanban"
                            className={styles.kanbanGrid}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Pitta Column */}
                            <div className={styles.doshaColumn}>
                                <div className={`${styles.doshaColumnHeader} ${styles.pittaHeader}`}>
                                    🔥
                                    <div>
                                        <div>Pitta</div>
                                        <div className={styles.doshaSubtext}>6AM–2PM · Deep Focus</div>
                                    </div>
                                </div>
                                <AnimatePresence>
                                    {isMounted && pittaTasks.map((task, i) => (
                                        <React.Fragment key={task.id}>
                                            {i > 0 && i % 3 === 0 && (
                                                <BreakCard label="5 min Integration Break" />
                                            )}
                                            <TaskCard task={task} onToggle={toggleTaskDone} onRemove={removeTask} onMeditationTap={handleMeditationTap} />
                                        </React.Fragment>
                                    ))}
                                </AnimatePresence>
                                {isMounted && pittaTasks.length === 0 && (
                                    <div className={styles.emptyColumn}>
                                        🔥 Add deep focus tasks here<br />
                                        <span style={{ fontSize: '0.68rem', opacity: 0.6 }}>coding, writing, study</span>
                                    </div>
                                )}
                            </div>

                            {/* Kapha Column */}
                            <div className={styles.doshaColumn}>
                                <div className={`${styles.doshaColumnHeader} ${styles.kaphaHeader}`}>
                                    🌿
                                    <div>
                                        <div>Kapha</div>
                                        <div className={styles.doshaSubtext}>2PM–6PM · Admin</div>
                                    </div>
                                </div>
                                <AnimatePresence>
                                    {isMounted && kaphaTasks.map(task => (
                                        <TaskCard key={task.id} task={task} onToggle={toggleTaskDone} onRemove={removeTask} onMeditationTap={handleMeditationTap} />
                                    ))}
                                </AnimatePresence>
                                {isMounted && kaphaTasks.length === 0 && (
                                    <div className={styles.emptyColumn}>
                                        🌿 Light tasks for afternoon<br />
                                        <span style={{ fontSize: '0.68rem', opacity: 0.6 }}>emails, errands, meetings</span>
                                    </div>
                                )}
                            </div>

                            {/* Vata Column */}
                            <div className={styles.doshaColumn}>
                                <div className={`${styles.doshaColumnHeader} ${styles.vataHeader}`}>
                                    🌬️
                                    <div>
                                        <div>Vata</div>
                                        <div className={styles.doshaSubtext}>6PM–10PM · Reflect</div>
                                    </div>
                                </div>
                                <AnimatePresence>
                                    {isMounted && vataTasks.map(task => (
                                        <TaskCard key={task.id} task={task} onToggle={toggleTaskDone} onRemove={removeTask} onMeditationTap={handleMeditationTap} />
                                    ))}
                                </AnimatePresence>
                                {isMounted && vataTasks.length === 0 && (
                                    <div className={styles.emptyColumn}>
                                        🌬️ Evening flow here<br />
                                        <span style={{ fontSize: '0.68rem', opacity: 0.6 }}>meditation, creative work</span>
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
