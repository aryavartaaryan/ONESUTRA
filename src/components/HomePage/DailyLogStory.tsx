'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTodayLogStory, type DailyLogEntry } from '@/components/Dashboard/SmartLogBubbles';

// ─── Bodhi wisdom per habit ID ─────────────────────────────────────────────────
const HABIT_WISDOM: Record<string, string> = {
    wake: '🌅 Rising with the sun aligns your circadian rhythm with the Brahmamuhurta — the most sacred hour of creation.',
    bath: '💧 Every bath is a mini rebirth. Water purifies not just the body but the subtle energy field.',
    breakfast: '🥣 Eating at sunrise activates Agni — your digestive fire — when it is strongest and most receptive.',
    breathwork: '🧘 Pranayama is the bridge between body and mind. Each conscious breath reprograms your nervous system.',
    morning_light: '☀️ Morning sunlight is Surya Upasana — solar prayer. Your body is a solar-powered being.',
    lunch: '🍱 Midday Pitta peaks — this is your ideal time for the most nourishing meal of the day.',
    deep_work: '🎯 Flow in Pitta hours = sharpest intellect. The Rishis called this Brahmacharya of the mind.',
    screen_break: '👁️ Alochaka Pitta governs the eyes. Rest is not a break — it is the foundation of sustained focus.',
    hydration: '💧 Water carries Prana. You are nourishing your life force, drop by drop.',
    workout: '💪 Vyayama — movement — brings lightness, energy, and endurance. Your body is a sacred instrument.',
    dinner: '🌙 Light meals before sunset preserve Ojas — your vital essence. Sleep will be deep and restorative.',
    digital_sunset: '📵 Protecting your melatonin is an act of self-love. Darkness is sacred preparation for sleep.',
    brain_dump: '📓 Svadhyaya — self-study. What you reflect on today, you master tomorrow.',
    sleep: '💤 Sleeping before 10 PM enters the Vata repair phase — deepest cellular regeneration.',
    gratitude: '🙏 Dhanyata Bhavana — the thankful heart. Three gratitudes daily rewire the amygdala toward joy.',
    dinner_night: '🌙 A light Sattvic dinner is the final act of self-love before the night\'s sacred rest.',
    read: '📚 Your dreaming mind integrates what you read before sleep. Feed it wisdom.',
};

function getWisdom(id: string): string {
    return HABIT_WISDOM[id] ?? '✨ Every consistent act of self-care is a vote for the person you are becoming.';
}

function formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ─── Story Viewer ─────────────────────────────────────────────────────────────
function StoryViewer({ entries, startIdx, onClose }: {
    entries: DailyLogEntry[];
    startIdx: number;
    onClose: () => void;
}) {
    const [idx, setIdx] = useState(startIdx);
    const [progress, setProgress] = useState(0);

    const current = entries[idx];
    const DURATION = 5000;

    useEffect(() => {
        setProgress(0);
        const start = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - start;
            const pct = Math.min((elapsed / DURATION) * 100, 100);
            setProgress(pct);
            if (pct >= 100) {
                clearInterval(interval);
                if (idx < entries.length - 1) setIdx(i => i + 1);
                else onClose();
            }
        }, 50);
        return () => clearInterval(interval);
    }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!current) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.25 }}
            style={{
                position: 'fixed', inset: 0, zIndex: 2000,
                background: `radial-gradient(ellipse at 30% 20%, ${current.color}55 0%, rgba(4,2,18,0.97) 65%)`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
            }}
            onClick={e => {
                // Tap right half → next, left half → prev
                const x = (e as unknown as React.MouseEvent).clientX;
                if (x > window.innerWidth / 2) {
                    if (idx < entries.length - 1) setIdx(i => i + 1); else onClose();
                } else {
                    if (idx > 0) setIdx(i => i - 1);
                }
            }}
        >
            {/* Progress bars */}
            <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', gap: 4 }}>
                {entries.map((_, i) => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', borderRadius: 99,
                            background: i < idx ? '#fbbf24' : i === idx ? `${current.color}` : 'transparent',
                            width: i === idx ? `${progress}%` : i < idx ? '100%' : '0%',
                            transition: i === idx ? 'none' : 'none',
                        }} />
                    </div>
                ))}
            </div>

            {/* Close */}
            <button
                onClick={e => { e.stopPropagation(); onClose(); }}
                style={{ position: 'absolute', top: 36, right: 18, background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', fontSize: '1.5rem', cursor: 'pointer', zIndex: 10 }}
            >×</button>

            {/* Content */}
            <div style={{ textAlign: 'center', padding: '0 2rem', maxWidth: 360 }}>
                <motion.div
                    key={current.id}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    style={{ fontSize: '4.5rem', marginBottom: '1.2rem', filter: `drop-shadow(0 0 24px ${current.color}99)` }}
                >
                    {current.icon}
                </motion.div>
                <p style={{ margin: '0 0 0.35rem', fontSize: '1.3rem', fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>
                    {current.label}
                </p>
                <p style={{ margin: '0 0 1.4rem', fontSize: '0.72rem', color: current.color, fontFamily: "'Outfit', sans-serif", fontWeight: 600, letterSpacing: '0.08em' }}>
                    ✓ Logged at {formatTime(current.loggedAt)}
                </p>
                <motion.p
                    key={current.id + '_wisdom'}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(255,255,255,0.75)', fontFamily: "'Georgia', serif", lineHeight: 1.65, fontStyle: 'italic' }}
                >
                    {getWisdom(current.id)}
                </motion.p>

                {/* Bodhi badge */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.55 }}
                    style={{
                        marginTop: '2rem', display: 'inline-flex', alignItems: 'center', gap: 7,
                        padding: '0.35rem 0.9rem', borderRadius: 99, border: `1px solid ${current.color}40`,
                        background: `${current.color}12`, fontSize: '0.67rem', color: current.color,
                        fontFamily: "'Outfit', sans-serif", fontWeight: 700, letterSpacing: '0.1em'
                    }}
                >
                    🪷 Bodhi knows · Your journey today
                </motion.div>
            </div>

            {/* Counter */}
            <p style={{ position: 'absolute', bottom: 40, fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.1em' }}>
                {idx + 1} / {entries.length}  ·  Tap to navigate
            </p>
        </motion.div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function DailyLogStory() {
    const [entries, setEntries] = useState<DailyLogEntry[]>([]);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerStartIdx, setViewerStartIdx] = useState(0);

    const refresh = useCallback(() => setEntries(getTodayLogStory()), []);

    useEffect(() => {
        refresh();
        window.addEventListener('daily-log-story-updated', refresh);
        window.addEventListener('focus', refresh);

        // Midnight reset
        const now = new Date();
        const midnight = new Date(now);
        midnight.setDate(midnight.getDate() + 1);
        midnight.setHours(0, 0, 0, 0);
        const timer = setTimeout(() => { setEntries([]); }, midnight.getTime() - now.getTime());

        return () => {
            window.removeEventListener('daily-log-story-updated', refresh);
            window.removeEventListener('focus', refresh);
            clearTimeout(timer);
        };
    }, [refresh]);

    if (entries.length === 0) return null;

    return (
        <>
            {/* Story strip */}
            <div style={{ padding: '0.55rem 0.75rem 0.4rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.45rem' }}>
                    <motion.span
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                        style={{ fontSize: '0.72rem' }}
                    >✨</motion.span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.13em', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>
                        Today's Journey
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(251,191,36,0.30), transparent)' }} />
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', fontFamily: "'Outfit', sans-serif" }}>
                        resets at midnight ·
                    </span>
                </div>

                {/* Bubble row */}
                <div style={{ display: 'flex', gap: '0.85rem', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '0.2rem' }}>
                    <style>{`.daily-story-row::-webkit-scrollbar{display:none}`}</style>
                    <div className="daily-story-row" style={{ display: 'flex', gap: '0.85rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
                        {entries.map((entry, i) => (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, scale: 0.6 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.06, type: 'spring', stiffness: 320, damping: 24 }}
                                onClick={() => { setViewerStartIdx(i); setViewerOpen(true); }}
                                style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer' }}
                            >
                                {/* Ring + circle */}
                                <div style={{
                                    padding: 2.5,
                                    borderRadius: '50%',
                                    background: `conic-gradient(${entry.color}, ${entry.color}88, ${entry.color})`,
                                    boxShadow: `0 0 14px ${entry.color}55`,
                                }}>
                                    <div style={{
                                        width: 54, height: 54, borderRadius: '50%',
                                        background: `radial-gradient(circle at 38% 28%, ${entry.color}22 0%, rgba(4,2,18,0.88) 75%)`,
                                        border: '2px solid rgba(4,2,18,0.9)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.7rem',
                                        backdropFilter: 'blur(12px)',
                                    }}>
                                        {entry.icon}
                                    </div>
                                </div>

                                {/* Time badge */}
                                <span style={{
                                    fontSize: '0.58rem', fontWeight: 700, color: entry.color,
                                    fontFamily: "'Outfit', sans-serif", letterSpacing: '0.04em',
                                    background: `${entry.color}18`, borderRadius: 99,
                                    padding: '1px 5px', border: `1px solid ${entry.color}30`,
                                }}>
                                    {formatTime(entry.loggedAt)}
                                </span>

                                {/* Label */}
                                <span style={{
                                    fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)',
                                    fontFamily: "'Outfit', sans-serif", textAlign: 'center',
                                    maxWidth: 62, lineHeight: 1.2, whiteSpace: 'nowrap',
                                    overflow: 'hidden', textOverflow: 'ellipsis',
                                }}>
                                    {entry.label}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Story viewer */}
            <AnimatePresence>
                {viewerOpen && (
                    <StoryViewer
                        entries={entries}
                        startIdx={viewerStartIdx}
                        onClose={() => setViewerOpen(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
