'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useBodhiChatStore } from '@/stores/bodhiChatStore';

// ─── Types ────────────────────────────────────────────────────────────────────
type SubOption = { icon: string; label: string; detail: string };
type LogBubble = {
    id: string;
    icon: string;
    label: string;
    sublabel: string;
    color: string;
    logMessage: string;
    subOptions: SubOption[];
};

// ─── Time-contextual bubble data ──────────────────────────────────────────────
const MORNING_BUBBLES: LogBubble[] = [
    {
        id: 'wake', icon: '🌅', label: 'Rise & Shine!', sublabel: 'Log wake-up', color: '#fbbf24',
        logMessage: 'I woke up this morning [UI_EVENT: MORNING_LOGS_CLICKED]',
        subOptions: [
            { icon: '⚡', label: '5 AM warrior', detail: 'woke up at 5 AM sharp' },
            { icon: '�', label: '6–7 AM', detail: 'woke up around 6–7 AM' },
            { icon: '☀️', label: 'Around 8 AM', detail: 'woke up around 8 AM' },
            { icon: '😅', label: 'A bit late', detail: 'woke up a bit late today' },
        ],
    },
    {
        id: 'breakfast', icon: '🥣', label: 'Breakfast done?', sublabel: 'What did you eat?', color: '#34d399',
        logMessage: 'I had breakfast today [UI_EVENT: MORNING_LOGS_CLICKED]',
        subOptions: [
            { icon: '🥣', label: 'Oats & fruits', detail: 'had oats with fruits' },
            { icon: '🫓', label: 'Parathas', detail: 'had parathas this morning' },
            { icon: '🍳', label: 'Eggs', detail: 'had eggs for breakfast' },
            { icon: '🍵', label: 'Just chai', detail: 'just had chai, light start today' },
        ],
    },
    {
        id: 'breathwork', icon: '🧘', label: 'Morning breathwork?', sublabel: 'Breathing reset', color: '#818cf8',
        logMessage: 'I did morning breathwork today [UI_EVENT: MORNING_LOGS_CLICKED]',
        subOptions: [
            { icon: '⏱️', label: '5 min reset', detail: '5 minute breathing reset done' },
            { icon: '🕐', label: '10 min flow', detail: '10 minute pranayama flow done' },
            { icon: '✨', label: '20+ min deep', detail: 'full 20+ minute breathwork session' },
            { icon: '📅', label: 'Will do later', detail: 'planning breathwork later today' },
        ],
    },
    {
        id: 'morning_light', icon: '☀️', label: 'Caught morning sun?', sublabel: 'Solar activation', color: '#fb923c',
        logMessage: 'I got morning sunlight exposure [UI_EVENT: MORNING_LOGS_CLICKED]',
        subOptions: [
            { icon: '👁️', label: 'Sun gazing', detail: 'did morning sun gazing ritual' },
            { icon: '🚶', label: 'Morning walk', detail: 'took a morning walk in sunlight' },
            { icon: '☕', label: 'Chai outside', detail: 'had chai outside in morning sun' },
            { icon: '🪟', label: 'Near window', detail: 'sat near window with morning light' },
        ],
    },
];

const NOON_BUBBLES: LogBubble[] = [
    {
        id: 'lunch', icon: '🍱', label: 'Lunch o\'clock! 🍴', sublabel: 'What did you eat?', color: '#f59e0b',
        logMessage: 'I had lunch today [UI_EVENT: NOON_LOGS_CLICKED]',
        subOptions: [
            { icon: '🍚', label: 'Dal rice', detail: 'had dal rice for lunch' },
            { icon: '🫓', label: 'Roti sabzi', detail: 'had roti and sabzi' },
            { icon: '🥗', label: 'Light salad', detail: 'had a light salad bowl' },
            { icon: '🍕', label: 'Outside food', detail: 'ate outside or ordered in' },
            { icon: '⏭️', label: 'Skipped', detail: 'skipped lunch today' },
        ],
    },
    {
        id: 'deep_work', icon: '🎯', label: 'Deep work sprint?', sublabel: 'Flow session done', color: '#4ade80',
        logMessage: 'I completed a deep work session [UI_EVENT: NOON_LOGS_CLICKED]',
        subOptions: [
            { icon: '⏰', label: '1 hour sprint', detail: '1 hour focused deep work sprint' },
            { icon: '🕑', label: '2 hour block', detail: '2 hour deep work block done' },
            { icon: '🔥', label: 'Still going!', detail: 'still in flow, logging mid-sprint' },
            { icon: '😵', label: 'Struggled today', detail: 'struggled to focus today' },
        ],
    },
    {
        id: 'screen_break', icon: '👁️', label: 'Eye reset taken?', sublabel: 'Sense reset', color: '#22d3ee',
        logMessage: 'I took a screen break [UI_EVENT: NOON_LOGS_CLICKED]',
        subOptions: [
            { icon: '🚶', label: '5 min walk', detail: '5 minute screen-free walk taken' },
            { icon: '😌', label: 'Eyes closed', detail: 'closed eyes and rested them' },
            { icon: '🌿', label: 'Looked outside', detail: 'looked at greenery for eye reset' },
            { icon: '🧘', label: 'Quick breathe', detail: '2 minute breathing break taken' },
        ],
    },
    {
        id: 'hydration', icon: '💧', label: 'Stayed hydrated?', sublabel: 'Water intake', color: '#60a5fa',
        logMessage: 'I drank water and stayed hydrated [UI_EVENT: NOON_LOGS_CLICKED]',
        subOptions: [
            { icon: '🥛', label: '2+ glasses', detail: 'had 2 or more glasses of water' },
            { icon: '🍵', label: 'Chai & water', detail: 'chai and water through the day' },
            { icon: '💧', label: 'Just a sip', detail: 'barely drank — need to hydrate more' },
            { icon: '🍹', label: 'Coconut water', detail: 'had coconut water today' },
        ],
    },
];

const EVENING_BUBBLES: LogBubble[] = [
    {
        id: 'workout', icon: '💪', label: 'Physicals & Games', sublabel: 'Movement logged', color: '#f87171',
        logMessage: 'I worked out today [UI_EVENT: EVENING_LOGS_CLICKED]',
        subOptions: [
            { icon: '🏋️', label: 'Gym session', detail: 'full gym session completed' },
            { icon: '🏃', label: 'Evening run', detail: 'went for an evening run' },
            { icon: '🧘', label: 'Yoga flow', detail: 'yoga flow session done' },
            { icon: '🚶', label: 'Evening walk', detail: 'took an evening walk' },
            { icon: '🏠', label: 'Home workout', detail: 'home workout session done' },
        ],
    },
    {
        id: 'dinner', icon: '🥗', label: 'Dinner served! 🍽️', sublabel: 'What did you eat?', color: '#a78bfa',
        logMessage: 'I had dinner tonight [UI_EVENT: EVENING_LOGS_CLICKED]',
        subOptions: [
            { icon: '🥗', label: 'Light & clean', detail: 'had a light, clean dinner' },
            { icon: '🍚', label: 'Full meal', detail: 'had a full dinner meal' },
            { icon: '🫓', label: 'Roti sabzi', detail: 'had roti and sabzi for dinner' },
            { icon: '🍕', label: 'Cheat meal', detail: 'had a cheat or comfort meal tonight' },
            { icon: '⏭️', label: 'Skipping tonight', detail: 'skipping dinner for intermittent fast' },
        ],
    },
    {
        id: 'digital_sunset', icon: '📵', label: 'Digital sunset mode?', sublabel: 'Screens off ritual', color: '#fb923c',
        logMessage: 'Setting digital sunset — screens going off for the night [UI_EVENT: EVENING_LOGS_CLICKED]',
        subOptions: [
            { icon: '✅', label: 'Done! Screens off', detail: 'put all screens away for the night' },
            { icon: '📵', label: 'Almost there', detail: 'winding down screens gradually' },
            { icon: '📖', label: 'Switched to book', detail: 'swapped screen for a book tonight' },
            { icon: '🎵', label: 'Just music now', detail: 'screens off, playing calm music' },
        ],
    },
    {
        id: 'brain_dump', icon: '📓', label: 'Evening brain dump?', sublabel: 'Self-audit done', color: '#2dd4bf',
        logMessage: 'I did an evening brain dump and reflection [UI_EVENT: EVENING_LOGS_CLICKED]',
        subOptions: [
            { icon: '📝', label: 'Thoughts dump', detail: 'dumped all thoughts on paper' },
            { icon: '📅', label: 'Planned tomorrow', detail: 'planned tasks for tomorrow' },
            { icon: '💭', label: 'Reflected on day', detail: 'reflected on how today went' },
            { icon: '✍️', label: 'Full journal', detail: 'wrote a full journal entry' },
        ],
    },
];

const NIGHT_BUBBLES: LogBubble[] = [
    {
        id: 'sleep', icon: '💤', label: 'Heading to sleep?', sublabel: 'Rest mode on', color: '#818cf8',
        logMessage: 'Going to sleep now, goodnight [UI_EVENT: NIGHT_LOGS]',
        subOptions: [
            { icon: '🌙', label: 'Before 10 PM', detail: 'early sleep — before 10 PM tonight' },
            { icon: '🕙', label: '10–11 PM', detail: 'sleeping around 10–11 PM' },
            { icon: '🌃', label: '11 PM–midnight', detail: 'sleeping around 11 PM to midnight' },
            { icon: '🦉', label: 'Night owl mode', detail: 'late night — past midnight as usual' },
        ],
    },
    {
        id: 'gratitude', icon: '🙏', label: 'Gratitude moment?', sublabel: 'Count your wins', color: '#fbbf24',
        logMessage: 'I am feeling grateful today [UI_EVENT: NIGHT_LOGS]',
        subOptions: [
            { icon: '✨', label: '3 good things', detail: 'named 3 things I am grateful for today' },
            { icon: '🙏', label: 'Short prayer', detail: 'said a short prayer of gratitude' },
            { icon: '💛', label: 'Just felt it', detail: 'sat with deep gratitude in my heart' },
            { icon: '📓', label: 'Wrote it down', detail: 'wrote gratitude in my journal' },
        ],
    },
    {
        id: 'dinner_night', icon: '🌙', label: 'Had dinner yet?', sublabel: 'Evening fuel', color: '#a78bfa',
        logMessage: 'I had dinner tonight [UI_EVENT: NIGHT_LOGS]',
        subOptions: [
            { icon: '🥗', label: 'Light meal', detail: 'had a light dinner tonight' },
            { icon: '🍚', label: 'Full dinner', detail: 'had a full dinner meal' },
            { icon: '⏭️', label: 'Skipping tonight', detail: 'skipping dinner tonight' },
        ],
    },
    {
        id: 'read', icon: '📚', label: 'Read before bed?', sublabel: 'Screen-free wind down', color: '#34d399',
        logMessage: 'I read before bed tonight [UI_EVENT: NIGHT_LOGS]',
        subOptions: [
            { icon: '⏱️', label: '10 minutes', detail: '10 minute read before sleep' },
            { icon: '📖', label: '30 minutes', detail: '30 minute reading session tonight' },
            { icon: '📚', label: 'Long session', detail: 'long reading session tonight' },
            { icon: '🎵', label: 'Audiobook', detail: 'listened to an audiobook instead' },
        ],
    },
];

export function getTimedBubbles(): LogBubble[] {
    const h = new Date().getHours();
    if (h >= 3 && h < 11) return MORNING_BUBBLES;
    if (h >= 11 && h < 15) return NOON_BUBBLES;
    if (h >= 15 && h < 21) return EVENING_BUBBLES;
    return NIGHT_BUBBLES;
}

export function getTimeLabel(): { prefix: string; color: string } {
    const h = new Date().getHours();
    if (h >= 3 && h < 11) return { prefix: '🌅 Morning Logs', color: '#fbbf24' };
    if (h >= 11 && h < 15) return { prefix: '☀️ Midday Logs', color: '#f59e0b' };
    if (h >= 15 && h < 21) return { prefix: '🪔 Evening Logs', color: '#fb923c' };
    return { prefix: '🌙 Night Logs', color: '#818cf8' };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SmartLogBubbles() {
    const router = useRouter();
    const setPendingMessage = useBodhiChatStore(s => s.setPendingMessage);
    const [activeBubble, setActiveBubble] = useState<string | null>(null);
    const bubbles = useMemo(() => getTimedBubbles(), []);
    const timeLabel = useMemo(() => getTimeLabel(), []);

    const toggleBubble = (bubble: LogBubble) => {
        setActiveBubble(prev => prev === bubble.id ? null : bubble.id);
    };

    const logAndNavigate = (bubble: LogBubble, sub?: SubOption) => {
        const msg = sub
            ? `${bubble.logMessage} — ${sub.detail}`
            : bubble.logMessage;
        setPendingMessage(msg);
        router.push('/bodhi-chat');
    };

    const active = bubbles.find(b => b.id === activeBubble) ?? null;

    return (
        <div style={{ padding: '0.55rem 0.75rem 0.2rem' }}>
            {/* ── Section header ── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                marginBottom: '0.45rem',
            }}>
                <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: timeLabel.color,
                    letterSpacing: '0.13em',
                    textTransform: 'uppercase',
                    fontFamily: "'Outfit', sans-serif",
                    filter: `drop-shadow(0 0 6px ${timeLabel.color}70)`,
                }}>
                    {timeLabel.prefix}
                </span>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${timeLabel.color}30, transparent)` }} />
                <span style={{
                    fontSize: '0.65rem',
                    color: 'rgba(255,255,255,0.28)',
                    fontFamily: "'Outfit', sans-serif",
                    letterSpacing: '0.08em',
                }}>tap to log ✦</span>
            </div>

            {/* ── Bubble row ── */}
            <div
                className="smart-log-bubbles"
                style={{
                    display: 'flex',
                    gap: '0.75rem',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    paddingBottom: '0.3rem',
                }}
            >
                <style>{`.smart-log-bubbles::-webkit-scrollbar{display:none}`}</style>
                {bubbles.map((bubble, i) => {
                    const isActive = activeBubble === bubble.id;
                    return (
                        <motion.div
                            key={bubble.id}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07, type: 'spring', stiffness: 320, damping: 26 }}
                            style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer' }}
                            onClick={() => toggleBubble(bubble)}
                        >
                            {/* Bubble circle */}
                            <motion.div
                                animate={{
                                    boxShadow: isActive
                                        ? `0 0 0 2px ${bubble.color}80, 0 0 24px ${bubble.color}55`
                                        : `0 0 0 1px ${bubble.color}28, 0 4px 18px rgba(0,0,0,0.35)`,
                                    scale: isActive ? 1.10 : [1, 1.03, 1],
                                    y: isActive ? -4 : [0, -4, 0],
                                }}
                                transition={
                                    isActive
                                        ? { type: 'spring', stiffness: 360, damping: 26 }
                                        : { duration: 4 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }
                                }
                                style={{
                                    width: 84,
                                    height: 84,
                                    borderRadius: '50%',
                                    background: `radial-gradient(circle at 36% 28%, ${bubble.color}18 0%, rgba(4,2,18,0.15) 75%)`,
                                    border: `1.2px solid ${bubble.color}${isActive ? '88' : '38'}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.95rem',
                                    backdropFilter: 'blur(14px)',
                                    WebkitBackdropFilter: 'blur(14px)',
                                    position: 'relative',
                                    transition: 'border-color 0.2s',
                                }}
                            >
                                {/* Outer pulse ring when active */}
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            initial={{ scale: 1, opacity: 0.6 }}
                                            animate={{ scale: 1.55, opacity: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.9, repeat: Infinity, ease: 'easeOut' }}
                                            style={{
                                                position: 'absolute',
                                                inset: -4,
                                                borderRadius: '50%',
                                                border: `1.5px solid ${bubble.color}55`,
                                                pointerEvents: 'none',
                                            }}
                                        />
                                    )}
                                </AnimatePresence>
                                {bubble.icon}
                            </motion.div>

                            {/* Catchy label */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <span style={{
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    color: isActive ? bubble.color : 'rgba(255,255,255,0.65)',
                                    letterSpacing: '0.03em',
                                    textAlign: 'center',
                                    maxWidth: 100,
                                    lineHeight: 1.3,
                                    fontFamily: "'Outfit', sans-serif",
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    transition: 'color 0.2s',
                                    filter: isActive ? `drop-shadow(0 0 5px ${bubble.color}80)` : 'none',
                                }}>
                                    {bubble.label}
                                </span>
                                <span style={{
                                    fontSize: '0.66rem',
                                    color: 'rgba(255,255,255,0.28)',
                                    fontFamily: "'Outfit', sans-serif",
                                    letterSpacing: '0.04em',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {bubble.sublabel}
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* ── Sub-option pills (expand on bubble tap) ── */}
            <AnimatePresence>
                {active && (
                    <motion.div
                        key={active.id + '_sub'}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.20, ease: [0.22, 1, 0.36, 1] }}
                        style={{ overflow: 'hidden' }}
                    >
                        {/* Context hint */}
                        <p style={{
                            margin: '0.4rem 0 0.25rem',
                            fontSize: '0.72rem',
                            color: active.color,
                            fontFamily: "'Outfit', sans-serif",
                            letterSpacing: '0.06em',
                            opacity: 0.82,
                        }}>
                            {active.sublabel} →
                        </p>

                        <div
                            className="sub-option-pills"
                            style={{ display: 'flex', gap: '0.28rem', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 6 }}
                        >
                            <style>{`.sub-option-pills::-webkit-scrollbar{display:none}`}</style>

                            {/* Sub-option pills */}
                            {active.subOptions.map((sub, i) => (
                                <motion.button
                                    key={sub.label}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.045, type: 'spring', stiffness: 420, damping: 28 }}
                                    whileTap={{ scale: 0.86 }}
                                    onClick={() => logAndNavigate(active, sub)}
                                    style={{
                                        flexShrink: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 5,
                                        background: `radial-gradient(circle at 28% 28%, ${active.color}1e, rgba(8,4,30,0.90))`,
                                        border: `1px solid ${active.color}48`,
                                        borderRadius: 999,
                                        padding: '0.32rem 0.75rem 0.32rem 0.50rem',
                                        cursor: 'pointer',
                                        backdropFilter: 'blur(10px)',
                                        WebkitBackdropFilter: 'blur(10px)',
                                        boxShadow: `0 2px 10px ${active.color}14`,
                                    }}
                                >
                                    <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{sub.icon}</span>
                                    <span style={{
                                        fontSize: '0.72rem',
                                        fontWeight: 600,
                                        color: 'rgba(255,255,255,0.78)',
                                        letterSpacing: '0.03em',
                                        whiteSpace: 'nowrap',
                                        fontFamily: "'Outfit', sans-serif",
                                    }}>
                                        {sub.label}
                                    </span>
                                </motion.button>
                            ))}

                            {/* Manual entry pill */}
                            <motion.button
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: active.subOptions.length * 0.045 + 0.04 }}
                                whileTap={{ scale: 0.86 }}
                                onClick={() => logAndNavigate(active)}
                                style={{
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px dashed rgba(255,255,255,0.20)',
                                    borderRadius: 999,
                                    padding: '0.28rem 0.65rem 0.28rem 0.42rem',
                                    cursor: 'pointer',
                                }}
                            >
                                <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>✏️</span>
                                <span style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    color: 'rgba(255,255,255,0.40)',
                                    letterSpacing: '0.03em',
                                    whiteSpace: 'nowrap',
                                    fontFamily: "'Outfit', sans-serif",
                                }}>
                                    Tell Bodhi...
                                </span>
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
