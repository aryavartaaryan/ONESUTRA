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

// ─── Daily Log Entry ──────────────────────────────────────────────────────────

interface DailyLogEntry {
    id: string;
    timestamp: number;
    emoji: string;
    category: string;
    detail: string;
    color: string;
}

const LOG_QUICK_PRESETS = [
    { emoji: '💧', label: 'Hydrated', color: '#60a5fa', category: 'Wellness' },
    { emoji: '🧘', label: 'Meditated', color: '#a78bfa', category: 'Wellness' },
    { emoji: '🏃', label: 'Worked out', color: '#f87171', category: 'Fitness' },
    { emoji: '📖', label: 'Read', color: '#34d399', category: 'Learning' },
    { emoji: '🍱', label: 'Healthy meal', color: '#fbbf24', category: 'Nutrition' },
    { emoji: '😴', label: 'Rested', color: '#818cf8', category: 'Wellness' },
    { emoji: '🎯', label: 'Deep work', color: '#4ade80', category: 'Focus' },
    { emoji: '🙏', label: 'Gratitude', color: '#fde047', category: 'Spiritual' },
];

function getDailyLogsFromStorage(): DailyLogEntry[] {
    if (typeof window === 'undefined') return [];
    try {
        const today = new Date().toISOString().split('T')[0];
        const raw = localStorage.getItem(`pranav_daily_logs_${today}`);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function persistDailyLog(entry: Omit<DailyLogEntry, 'id' | 'timestamp'>): DailyLogEntry {
    const today = new Date().toISOString().split('T')[0];
    const newEntry: DailyLogEntry = { ...entry, id: `log_${Date.now()}`, timestamp: Date.now() };
    try {
        const existing = getDailyLogsFromStorage();
        localStorage.setItem(`pranav_daily_logs_${today}`, JSON.stringify([newEntry, ...existing]));
    } catch { }
    return newEntry;
}

function computeSmartScore(done: number, total: number, logCount: number): number {
    const completionPct = total > 0 ? (done / total) * 55 : 0;
    const logPct = Math.min(logCount * 6, 35);
    return Math.min(Math.round(completionPct + logPct + 10), 100);
}

function fmtTime(ts: number): string {
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

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

    // Smart logs + quick-add state
    const [dailyLogs, setDailyLogs] = useState<DailyLogEntry[]>([]);
    const [showLogs, setShowLogs] = useState(false);
    const [quickAddText, setQuickAddText] = useState('');
    const [quickAddCategory, setQuickAddCategory] = useState('Task');
    const [quickAddTime, setQuickAddTime] = useState('');
    const [isQuickAdding, setIsQuickAdding] = useState(false);

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
        setDailyLogs(getDailyLogsFromStorage());

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
        setIsSakhaActive(false);
    }, []);

    const handleQuickAdd = useCallback(async () => {
        const text = quickAddText.trim();
        if (!text) return;
        setIsQuickAdding(true);
        const catEmoji: Record<string, string> = { Task: '✅', Idea: '💡', Challenge: '⚡', Issue: '🔥', Wellness: '🧘', Focus: '🎯' };
        const catAccent: Record<string, string> = { Task: '251,191,36', Idea: '45,212,191', Challenge: '251,146,60', Issue: '248,113,113', Wellness: '167,139,250', Focus: '74,222,128' };
        const newTask: TaskItem = {
            id: `quick_${Date.now()}`,
            text,
            icon: catEmoji[quickAddCategory] || '✅',
            category: quickAddCategory,
            colorClass: 'amber',
            accentColor: catAccent[quickAddCategory] || '251,191,36',
            done: false,
            startTime: quickAddTime || undefined,
            createdAt: Date.now(),
            scheduledDate: new Date().toISOString().split('T')[0],
        };
        await addTask(newTask);
        setQuickAddText('');
        setQuickAddTime('');
        setIsQuickAdding(false);
    }, [quickAddText, quickAddCategory, quickAddTime, addTask]);

    const handleLogPreset = useCallback((preset: typeof LOG_QUICK_PRESETS[0]) => {
        const entry = persistDailyLog({ emoji: preset.emoji, category: preset.category, detail: preset.label, color: preset.color });
        setDailyLogs(prev => [entry, ...prev]);
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
    const smartScore = useMemo(() => computeSmartScore(completed, total, dailyLogs.length), [completed, total, dailyLogs.length]);
    const focusMinutes = useMemo(() => tasks.filter(t => t.done && t.allocatedMinutes).reduce((s, t) => s + (t.allocatedMinutes || 0), 0), [tasks]);

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

                {/* ── Smart Analytics Strip ── */}
                {isMounted && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1.2rem' }}
                    >
                        {[
                            { label: 'Smart Score', value: `${smartScore}`, unit: '/100', color: '#fde047', emoji: '⚡', bg: 'rgba(253,224,71,0.08)', border: 'rgba(253,224,71,0.20)' },
                            { label: 'Tasks Done', value: `${completed}`, unit: `/ ${total}`, color: '#4ade80', emoji: '✅', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.20)' },
                            { label: 'Focus Time', value: focusMinutes >= 60 ? `${Math.floor(focusMinutes / 60)}h ${focusMinutes % 60}m` : `${focusMinutes}m`, unit: '', color: '#67e8f9', emoji: '🎯', bg: 'rgba(103,232,249,0.08)', border: 'rgba(103,232,249,0.20)' },
                            { label: 'Logs Today', value: `${dailyLogs.length}`, unit: 'entries', color: '#a78bfa', emoji: '📝', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.20)' },
                        ].map(stat => (
                            <div key={stat.label} style={{ background: stat.bg, border: `1px solid ${stat.border}`, borderRadius: 14, padding: '0.65rem 0.6rem', display: 'flex', flexDirection: 'column', gap: 2, backdropFilter: 'blur(12px)' }}>
                                <span style={{ fontSize: '0.85rem' }}>{stat.emoji}</span>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</span>
                                    {stat.unit && <span style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.40)', fontWeight: 500 }}>{stat.unit}</span>}
                                </div>
                                <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.38)', letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 600 }}>{stat.label}</span>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* ── Progress Bar ── */}
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

                {/* ── Quick Add Task Bar ── */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{ marginBottom: '1.2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: '0.85rem 1rem', backdropFilter: 'blur(16px)' }}
                >
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: '0.65rem' }}>
                        ✦ Quick Add
                    </div>
                    {/* Category pills */}
                    <div style={{ display: 'flex', gap: '0.38rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
                        {[
                            { key: 'Task', emoji: '✅', color: '#fbbf24' },
                            { key: 'Focus', emoji: '🎯', color: '#4ade80' },
                            { key: 'Wellness', emoji: '🧘', color: '#a78bfa' },
                            { key: 'Idea', emoji: '💡', color: '#2dd4bf' },
                            { key: 'Challenge', emoji: '⚡', color: '#fb923c' },
                            { key: 'Issue', emoji: '🔥', color: '#f87171' },
                        ].map(cat => (
                            <button
                                key={cat.key}
                                onClick={() => setQuickAddCategory(cat.key)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 4,
                                    padding: '0.24rem 0.65rem', borderRadius: 999, cursor: 'pointer',
                                    border: `1px solid ${quickAddCategory === cat.key ? cat.color : 'rgba(255,255,255,0.12)'}`,
                                    background: quickAddCategory === cat.key ? `${cat.color}22` : 'transparent',
                                    color: quickAddCategory === cat.key ? cat.color : 'rgba(255,255,255,0.45)',
                                    fontSize: '0.68rem', fontWeight: 600, fontFamily: 'inherit',
                                    transition: 'all 0.18s',
                                }}
                            >
                                <span style={{ fontSize: '0.78rem' }}>{cat.emoji}</span> {cat.key}
                            </button>
                        ))}
                    </div>
                    {/* Input row */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                            type="text"
                            value={quickAddText}
                            onChange={e => setQuickAddText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleQuickAdd(); }}
                            placeholder={`Add a ${quickAddCategory.toLowerCase()}…`}
                            style={{
                                flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.16)',
                                borderRadius: 12, padding: '0.55rem 0.85rem', color: '#fff', fontSize: '0.82rem',
                                fontFamily: "'Outfit', sans-serif", outline: 'none',
                            }}
                        />
                        <input
                            type="time"
                            value={quickAddTime}
                            onChange={e => setQuickAddTime(e.target.value)}
                            style={{
                                width: 90, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.16)',
                                borderRadius: 12, padding: '0.55rem 0.5rem', color: 'rgba(255,255,255,0.65)',
                                fontSize: '0.75rem', fontFamily: 'inherit', outline: 'none',
                            }}
                        />
                        <button
                            onClick={handleQuickAdd}
                            disabled={!quickAddText.trim() || isQuickAdding}
                            style={{
                                padding: '0.55rem 1rem', borderRadius: 12, cursor: 'pointer',
                                background: quickAddText.trim() ? 'linear-gradient(135deg,#fde047,#fb923c)' : 'rgba(255,255,255,0.08)',
                                border: 'none', color: quickAddText.trim() ? '#0a0a14' : 'rgba(255,255,255,0.35)',
                                fontWeight: 700, fontSize: '0.78rem', fontFamily: 'inherit',
                                transition: 'all 0.2s',
                            }}
                        >
                            {isQuickAdding ? '…' : '+ Add'}
                        </button>
                    </div>
                </motion.div>

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

                {/* ── Daily Activity Logs ── */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    style={{ marginBottom: '1.5rem' }}
                >
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '1rem' }}>📋</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a78bfa' }}>Activity Logs</span>
                        <span style={{ fontSize: '0.58rem', background: 'rgba(167,139,250,0.18)', color: '#c4b5fd', border: '1px solid rgba(167,139,250,0.30)', borderRadius: 999, padding: '0.08rem 0.45rem', fontWeight: 700 }}>
                            {dailyLogs.length} today
                        </span>
                        <div style={{ flex: 1 }} />
                        <button
                            onClick={() => setShowLogs(v => !v)}
                            style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 8, padding: '0.22rem 0.65rem', cursor: 'pointer', color: '#c4b5fd', fontSize: '0.62rem', fontWeight: 700, fontFamily: 'inherit' }}
                        >
                            {showLogs ? 'Hide' : 'View all'}
                        </button>
                    </div>

                    {/* Quick log preset chips */}
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                        {LOG_QUICK_PRESETS.map(preset => (
                            <motion.button
                                key={preset.label}
                                whileTap={{ scale: 0.90 }}
                                onClick={() => handleLogPreset(preset)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    padding: '0.32rem 0.72rem', borderRadius: 999, cursor: 'pointer',
                                    background: `${preset.color}14`,
                                    border: `1px solid ${preset.color}35`,
                                    color: preset.color,
                                    fontSize: '0.70rem', fontWeight: 600, fontFamily: 'inherit',
                                    transition: 'all 0.15s',
                                }}
                            >
                                <span style={{ fontSize: '0.90rem' }}>{preset.emoji}</span>
                                {preset.label}
                            </motion.button>
                        ))}
                    </div>

                    {/* Log timeline */}
                    <AnimatePresence>
                        {(showLogs ? dailyLogs : dailyLogs.slice(0, 4)).map((entry, i) => (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ delay: i * 0.04 }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.65rem',
                                    padding: '0.55rem 0.75rem', borderRadius: 12, marginBottom: '0.35rem',
                                    background: `${entry.color}0d`,
                                    border: `1px solid ${entry.color}22`,
                                }}
                            >
                                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{entry.emoji}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: '0.76rem', color: 'rgba(255,255,255,0.88)', fontWeight: 600 }}>{entry.detail}</p>
                                    <p style={{ margin: 0, fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{entry.category} · {fmtTime(entry.timestamp)}</p>
                                </div>
                                <span style={{ fontSize: '0.55rem', color: entry.color, background: `${entry.color}18`, border: `1px solid ${entry.color}28`, borderRadius: 6, padding: '0.1rem 0.38rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                    ✓ Logged
                                </span>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {dailyLogs.length === 0 && isMounted && (
                        <div style={{ textAlign: 'center', padding: '1.2rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.10)', borderRadius: 14 }}>
                            <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.30)', fontStyle: 'italic' }}>
                                Tap a preset above to log your first activity today ✦
                            </p>
                        </div>
                    )}
                </motion.div>

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
                                position: 'absolute', bottom: '108%', left: '50%',
                                transform: 'translateX(-50%)', marginBottom: 4,
                                fontSize: 8, fontWeight: 800, letterSpacing: '0.18em',
                                textTransform: 'uppercase',
                                background: 'linear-gradient(90deg, #22d3ee, #a78bfa, #22d3ee)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                fontFamily: 'system-ui, sans-serif', whiteSpace: 'nowrap',
                                pointerEvents: 'none',
                                filter: 'drop-shadow(0 1px 4px rgba(34,211,238,0.55))',
                            }}>Sakha Bodhi</span>

                            {/* Outer cosmic radiation */}
                            <motion.div
                                animate={{ scale: [1, 1.32, 1], opacity: [0.28, 0.10, 0.28] }}
                                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                                style={{
                                    position: 'absolute', inset: -20, borderRadius: '50%',
                                    background: 'radial-gradient(circle, rgba(34,211,238,0.38) 0%, rgba(139,92,246,0.20) 50%, transparent 78%)',
                                    filter: 'blur(12px)', pointerEvents: 'none',
                                }}
                            />

                            {/* Mid rotating sacred geometry ring */}
                            <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                                style={{
                                    position: 'absolute', inset: -7, borderRadius: '50%',
                                    border: '1px dashed rgba(251,191,36,0.5)', pointerEvents: 'none',
                                }}
                            />

                            {/* Inner soft violet-teal aura */}
                            <motion.div
                                animate={{ scale: [1, 1.10, 1], opacity: [0.7, 0.28, 0.7] }}
                                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                                style={{
                                    position: 'absolute', inset: -4, borderRadius: '50%',
                                    background: 'radial-gradient(circle, rgba(139,92,246,0.30) 0%, rgba(34,211,238,0.22) 60%, transparent 85%)',
                                    filter: 'blur(5px)', pointerEvents: 'none',
                                }}
                            />

                            {/* Three orbiting energy particles */}
                            {([0, 120, 240] as number[]).map((deg, i) => (
                                <motion.div
                                    key={i}
                                    animate={{ rotate: [deg, deg + 360] }}
                                    transition={{ duration: 5 + i * 0.7, repeat: Infinity, ease: 'linear' }}
                                    style={{ position: 'absolute', inset: -14, borderRadius: '50%', pointerEvents: 'none' }}
                                >
                                    <div style={{
                                        position: 'absolute', top: '50%', left: '50%',
                                        width: 4, height: 4, borderRadius: '50%',
                                        background: i === 0 ? '#fbbf24' : i === 1 ? '#22d3ee' : '#a78bfa',
                                        boxShadow: `0 0 7px ${i === 0 ? '#fbbf24' : i === 1 ? '#22d3ee' : '#a78bfa'}`,
                                        transform: 'translate(-50%, -50%) translateX(34px)',
                                    }} />
                                </motion.div>
                            ))}

                            {/* Core button — Sakha Bodhi as meditating cosmic figure */}
                            <motion.button
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
                                onClick={() => { unlockAudio(); setIsSakhaActive(true); }}
                                aria-label="Open Bodhi on Planner"
                                style={{
                                    width: 62, height: 62, borderRadius: '50%',
                                    border: '1.5px solid rgba(34,211,238,0.52)',
                                    background: 'radial-gradient(circle at 38% 30%, rgba(120,200,255,0.22) 0%, rgba(18,28,95,0.92) 45%, rgba(4,7,38,0.97) 100%)',
                                    boxShadow: '0 0 0 1px rgba(34,211,238,0.18), 0 6px 28px rgba(14,116,144,0.55), 0 0 48px rgba(34,211,238,0.20), inset 0 1px 0 rgba(255,255,255,0.18)',
                                    cursor: 'pointer', position: 'relative',
                                    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                                }}
                            >
                                {/* Inner radiance pulse */}
                                <motion.div
                                    animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.7, 1.1, 0.7] }}
                                    transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                                    style={{
                                        position: 'absolute', inset: 0, borderRadius: '50%',
                                        background: 'radial-gradient(circle at center, rgba(139,92,246,0.45) 0%, rgba(34,211,238,0.18) 55%, transparent 80%)',
                                        pointerEvents: 'none',
                                    }}
                                />
                                {/* Meditating Sakha Bodhi — SVG yogi figure */}
                                <svg width="38" height="42" viewBox="0 0 40 44" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'relative', zIndex: 2 }}>
                                    <circle cx="20" cy="12" r="9.5" fill="rgba(255,215,0,0.07)" />
                                    <circle cx="20" cy="12" r="7.5" fill="none" stroke="rgba(255,215,0,0.38)" strokeWidth="0.7" strokeDasharray="2.5 1.5" />
                                    <circle cx="20" cy="12" r="5" fill="rgba(220,245,255,0.95)" />
                                    <ellipse cx="20" cy="10.8" rx="1.5" ry="0.9" fill="#FFD700" />
                                    <circle cx="20" cy="10.8" r="0.55" fill="rgba(255,255,255,0.95)" />
                                    <rect x="17.8" y="17" width="4.4" height="2.8" rx="1.5" fill="rgba(210,240,255,0.88)" />
                                    <path d="M 14 30 L 15.5 20 Q 20 18.5 24.5 20 L 26 30 Z" fill="rgba(190,230,255,0.88)" />
                                    <path d="M 15.5 24 Q 12 26.5 11 30" stroke="rgba(190,230,255,0.88)" strokeWidth="2.8" strokeLinecap="round" fill="none" />
                                    <circle cx="11" cy="30" r="2.3" fill="rgba(190,230,255,0.78)" />
                                    <path d="M 24.5 24 Q 28 26.5 29 30" stroke="rgba(190,230,255,0.88)" strokeWidth="2.8" strokeLinecap="round" fill="none" />
                                    <circle cx="29" cy="30" r="2.3" fill="rgba(190,230,255,0.78)" />
                                    <path d="M 7 37 Q 13 32.5 20 33.5 Q 27 32.5 33 37 Q 30 41.5 20 42 Q 10 41.5 7 37 Z" fill="rgba(170,220,255,0.82)" />
                                    <line x1="20" y1="19.5" x2="20" y2="30" stroke="rgba(100,220,255,0.45)" strokeWidth="0.7" />
                                    <circle cx="20" cy="23.5" r="1.1" fill="rgba(100,220,255,0.9)" />
                                    <circle cx="20" cy="7" r="1.8" fill="rgba(167,139,250,0.55)" />
                                </svg>
                            </motion.button>

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
