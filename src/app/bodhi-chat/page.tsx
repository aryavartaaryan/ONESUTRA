'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, CheckCircle2, Mic, MicOff, Clock, Sparkles, MoreHorizontal } from 'lucide-react';
import { useDailyTasks } from '@/hooks/useDailyTasks';
import { useOneSutraAuth } from '@/hooks/useOneSutraAuth';
import { useBodhiChatStore } from '@/stores/bodhiChatStore';
import { useBodhiChatVoice } from '@/hooks/useBodhiChatVoice';
import { useLanguage } from '@/context/LanguageContext';
import { useLifestyleEngine } from '@/hooks/useLifestyleEngine';
import { getToday } from '@/stores/lifestyleStore';

// ─── Unified Log Bridge (shared between Practice section and Bodhi chat) ────
const UNIFIED_LOG_KEY = 'onesutra_unified_log_v1';

function saveUnifiedLog(activity: string, verdict: string): void {
    if (typeof window === 'undefined') return;
    try {
        const today = new Date().toISOString().split('T')[0];
        const raw = JSON.parse(localStorage.getItem(UNIFIED_LOG_KEY) ?? '{}');
        const todayLogs: Array<{ activity: string; verdict: string; timestamp: number }> = raw[today] ?? [];
        if (!todayLogs.some(l => l.activity.toLowerCase() === activity.toLowerCase())) {
            todayLogs.push({ activity, verdict, timestamp: Date.now() });
        }
        raw[today] = todayLogs;
        localStorage.setItem(UNIFIED_LOG_KEY, JSON.stringify(raw));
    } catch { }
}

const ACTIVITY_TO_HABIT_MAP: Record<string, string[]> = {
    'h_bathing':             ['bath', 'shower', 'cold shower', 'snaan'],
    'h_tongue_scraping':     ['tongue', 'tongue scraping', 'tongue scrape', 'jihva'],
    'h_morning_water':       ['morning water', 'warm water', 'ushna jal'],
    'h_morning_meditation':  ['meditat', 'dhyan', 'mindful', 'meditation'],
    'h_morning_sunlight':    ['sunlight', 'sun gazing', 'morning light', 'solar', 'morning sun'],
    'h_pranayama':           ['pranayam', 'breathwork', 'breathing'],
    'h_exercise':            ['workout', 'exercise', 'gym', 'yoga', 'walk', 'run'],
    'h_gratitude':           ['gratitud', 'grateful'],
    'h_breakfast':           ['breakfast', 'nashta'],
};

function matchActivityToHabitId(activity: string): string | null {
    const actLower = activity.toLowerCase();
    for (const [habitId, keywords] of Object.entries(ACTIVITY_TO_HABIT_MAP)) {
        if (keywords.some(k => actLower.includes(k))) return habitId;
    }
    return null;
}

// ─── Mood data ───────────────────────────────────────────────────────────────
const MOOD_EMOJIS = [
    { emoji: '😊', label: 'Happy', mood: 'HAPPY/JOYFUL', color: '#fbbf24' },
    { emoji: '😔', label: 'Sad', mood: 'SAD/LOW', color: '#818cf8' },
    { emoji: '😤', label: 'Stressed', mood: 'STRESSED/ANXIOUS', color: '#f87171' },
    { emoji: '🤩', label: 'Excited', mood: 'EXCITED/ENERGIZED', color: '#2dd4bf' },
    { emoji: '😴', label: 'Tired', mood: 'TIRED/DRAINED', color: '#94a3b8' },
    { emoji: '🎯', label: 'Focused', mood: 'FOCUSED/PRODUCTIVE', color: '#4ade80' },
    { emoji: '😕', label: 'Confused', mood: 'CONFUSED/STUCK', color: '#fb923c' },
    { emoji: '🙏', label: 'Grateful', mood: 'GRATEFUL/PEACEFUL', color: '#c4b5fd' },
];

async function saveMoodToFirebase(uid: string, emoji: string, mood: string): Promise<void> {
    try {
        const { getFirebaseFirestore } = await import('@/lib/firebase');
        const { doc, setDoc } = await import('firebase/firestore');
        const db = await getFirebaseFirestore();
        await setDoc(doc(db, 'users', uid), { current_mood: { emoji, mood, updatedAt: Date.now() } }, { merge: true });
    } catch { /* silent */ }
}

async function loadMoodFromFirebase(uid: string): Promise<{ emoji: string; mood: string } | null> {
    try {
        const { getFirebaseFirestore } = await import('@/lib/firebase');
        const { doc, getDoc } = await import('firebase/firestore');
        const db = await getFirebaseFirestore();
        const snap = await getDoc(doc(db, 'users', uid));
        if (!snap.exists()) return null;
        const m = snap.data()?.current_mood;
        if (m && Date.now() - m.updatedAt < 6 * 60 * 60 * 1000) return { emoji: m.emoji, mood: m.mood };
        return null;
    } catch { return null; }
}

// ─── Types ───────────────────────────────────────────────────────────────────
type IntentType = 'task' | 'idea' | 'challenge' | 'issue' | 'general';

interface ChatMessage {
    id: string;
    role: 'user' | 'bodhi';
    text: string;
    intent?: IntentType;
    savedItem?: { type: IntentType; text: string };
    timestamp: number;
}

// ─── Utils ────────────────────────────────────────────────────────────────────
function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
}

function getTimeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return 'earlier';
}


// ─── Parse log messages from dashboard UI events ────────────────────────────
interface ParsedLog {
    activityKey: string;
    icon: string;
    color: string;
    label: string;
    detail?: string;
}

function parseLogMessage(text: string): ParsedLog | null {
    if (!/\[UI_EVENT:/.test(text)) return null;
    const withoutTag = text.replace(/\s*\[UI_EVENT:[^\]]+\]/, '').trim();
    const dashIdx = withoutTag.indexOf(' \u2014 ');
    const activityText = (dashIdx >= 0 ? withoutTag.slice(0, dashIdx) : withoutTag).trim();
    const detail = dashIdx >= 0 ? withoutTag.slice(dashIdx + 3).trim() : undefined;
    const lc = (activityText + ' ' + (detail ?? '')).toLowerCase();
    if (/\blunch\b|dopahar/.test(lc)) return { activityKey: 'lunch', icon: '\uD83C\uDF71', color: '#f59e0b', label: 'LUNCH', detail };
    if (/breakfast|nashta/.test(lc)) return { activityKey: 'breakfast', icon: '\uD83E\uDD63', color: '#34d399', label: 'BREAKFAST', detail };
    if (/\bdinner\b|raat ka/.test(lc)) return { activityKey: 'dinner', icon: '\uD83C\uDF19', color: '#a78bfa', label: 'DINNER', detail };
    if (/workout|gym|\brun\b|yoga|exercise|fitness|cardio/.test(lc)) return { activityKey: 'workout', icon: '\uD83D\uDCAA', color: '#f87171', label: 'WORKOUT', detail };
    if (/\bwake\b|\bwoke\b|rise/.test(lc)) return { activityKey: 'wake_up', icon: '\uD83C\uDF05', color: '#fbbf24', label: 'RISE & SHINE', detail };
    if (/bath|shower|cleanse|snaan/.test(lc)) return { activityKey: 'bath', icon: '\uD83D\uDEBF', color: '#38bdf8', label: 'BATH & RECHARGE', detail };
    if (/sleep|goodnight/.test(lc)) return { activityKey: 'sleep', icon: '\uD83D\uDCA4', color: '#818cf8', label: 'SLEEP', detail };
    if (/meditat|breathwork|pranayam/.test(lc)) return { activityKey: 'mindfulness', icon: '\uD83E\uDDD8', color: '#818cf8', label: 'MINDFULNESS', detail };
    if (/hydrat|\bwater\b|paani/.test(lc)) return { activityKey: 'hydration', icon: '\uD83D\uDCA7', color: '#60a5fa', label: 'HYDRATED', detail };
    if (/grateful|gratitud/.test(lc)) return { activityKey: 'gratitude', icon: '\uD83D\uDE4F', color: '#fbbf24', label: 'GRATITUDE', detail };
    if (/deep work|focus sprint/.test(lc)) return { activityKey: 'deep_work', icon: '\uD83C\uDFAF', color: '#4ade80', label: 'DEEP WORK', detail };
    if (/sunlight|morning sun|morning light|solar/.test(lc)) return { activityKey: 'morning_light', icon: '\u2600\uFE0F', color: '#fb923c', label: 'MORNING LIGHT', detail };
    if (/screen break|eye reset/.test(lc)) return { activityKey: 'screen_break', icon: '\uD83D\uDC41\uFE0F', color: '#22d3ee', label: 'SCREEN BREAK', detail };
    if (/digital sunset/.test(lc)) return { activityKey: 'digital_sunset', icon: '\uD83D\uDCF5', color: '#fb923c', label: 'DIGITAL SUNSET', detail };
    if (/brain dump|journa|reflect/.test(lc)) return { activityKey: 'brain_dump', icon: '\uD83D\uDCD3', color: '#2dd4bf', label: 'BRAIN DUMP', detail };
    if (/read.*bed|book.*night/.test(lc)) return { activityKey: 'read', icon: '\uD83D\uDCDA', color: '#34d399', label: 'READING', detail };
    if (/\bwalk\b/.test(lc)) return { activityKey: 'walk', icon: '\uD83D\uDEB6', color: '#22d3ee', label: 'WALK', detail };
    if (/daily habit|HABIT_LOGGED/.test(text)) {
        const habitMatch = text.match(/daily habit:\s*\S*\s+([^!(\n]+)/);
        const habitName = habitMatch ? habitMatch[1].trim() : 'Practice';
        return { activityKey: 'habit_logged', icon: '\u2705', color: '#4ade80', label: habitName.slice(0, 20).toUpperCase(), detail };
    }
    return { activityKey: 'general', icon: '\u2726', color: '#4ade80', label: activityText.replace(/^I (had|did|went|took|got|am|woke|going|setting|heading|starting)\s+/i, '').slice(0, 18).toUpperCase(), detail };
}

// ─── Activity-specific smart chips after logging (Ayurvedic sequence order) ───
function getActivitySpecificChips(key: string): Array<{ icon: string; label: string; message: string }> {
    switch (key) {
        case 'wake_up': return [
            { icon: '💧', label: 'Warm water', message: 'I drank warm water after waking up' },
            { icon: '🪥', label: 'Tongue scrape', message: 'I did tongue scraping this morning' },
            { icon: '🚿', label: 'Bath', message: 'I took a bath and recharged this morning' },
            { icon: '🧘', label: 'Breathwork', message: 'I did morning breathwork today' },
        ];
        case 'bath': return [
            { icon: '☀️', label: 'Morning sun', message: 'I got morning sunlight exposure' },
            { icon: '🧘', label: 'Breathwork', message: 'I did morning breathwork today' },
            { icon: '🕊️', label: 'Meditate', message: 'I meditated this morning' },
            { icon: '🥣', label: 'Breakfast', message: 'I had breakfast' },
        ];
        case 'morning_light': return [
            { icon: '🧘', label: 'Breathwork', message: 'I did morning breathwork today' },
            { icon: '🕊️', label: 'Meditate', message: 'I meditated this morning' },
            { icon: '🙏', label: 'Gratitude', message: 'I am feeling grateful today' },
            { icon: '🥣', label: 'Breakfast', message: 'I had breakfast' },
        ];
        case 'mindfulness': return [
            { icon: '🙏', label: 'Gratitude', message: 'I am feeling grateful today' },
            { icon: '🥣', label: 'Breakfast', message: 'I had breakfast' },
            { icon: '🎯', label: 'Plan today', message: "Help me plan today's priorities" },
            { icon: '💧', label: 'Hydrate', message: 'I drank water after meditation' },
        ];
        case 'gratitude': return [
            { icon: '🥣', label: 'Breakfast', message: 'I had breakfast' },
            { icon: '🎯', label: 'Plan today', message: "Help me plan today's priorities" },
            { icon: '💤', label: 'Sleep', message: 'Going to sleep now, goodnight [UI_EVENT: NIGHT_LOGS]' },
            { icon: '🌙', label: 'Goodnight', message: 'Goodnight Bodhi, see you tomorrow' },
        ];
        case 'breakfast': return [
            { icon: '🎯', label: 'Plan today', message: "Help me plan today's priorities" },
            { icon: '💧', label: 'Hydrate', message: 'I drank water after breakfast' },
            { icon: '🧘', label: 'Meditate', message: 'I meditated this morning' },
            { icon: '☀️', label: 'Morning sun', message: 'I got morning sunlight exposure' },
        ];
        case 'lunch': return [
            { icon: '🚶', label: 'Post-lunch walk', message: 'I went for a short walk after lunch' },
            { icon: '💧', label: 'Drink water', message: 'I drank water after lunch' },
            { icon: '🎯', label: 'Focus sprint', message: 'Starting a deep work sprint now' },
            { icon: '⏰', label: 'Dinner later', message: 'Remind me for dinner at 8 PM' },
        ];
        case 'workout': return [
            { icon: '💧', label: 'Hydrate', message: 'I drank water after my workout' },
            { icon: '🥗', label: 'Recovery meal', message: 'Had a recovery meal after workout' },
            { icon: '🙌', label: 'How I felt', message: 'Let me tell you how my workout felt today' },
            { icon: '🧘', label: 'Cool down', message: 'Doing a cool down stretch after workout' },
        ];
        case 'dinner': return [
            { icon: '🚶', label: 'Evening walk', message: 'Going for a post-dinner walk' },
            { icon: '📵', label: 'Screens off', message: 'Setting digital sunset \u2014 screens going off for the night [UI_EVENT: EVENING_LOGS_CLICKED]' },
            { icon: '📓', label: 'Brain dump', message: 'I did an evening brain dump and reflection [UI_EVENT: EVENING_LOGS_CLICKED]' },
            { icon: '💤', label: 'Sleep soon', message: 'Going to sleep now, goodnight [UI_EVENT: NIGHT_LOGS]' },
        ];
        case 'sleep': return [
            { icon: '🙏', label: 'Gratitude', message: 'I am feeling grateful today' },
            { icon: '📖', label: 'Read first', message: 'I read before bed tonight' },
            { icon: '🌙', label: 'Goodnight', message: 'Goodnight Bodhi, see you tomorrow' },
        ];
        case 'hydration': return [
            { icon: '🧘', label: 'Meditate', message: 'I meditated today' },
            { icon: '🎯', label: 'Focus sprint', message: 'Starting a deep work sprint now' },
            { icon: '🚶', label: 'Walk', message: 'Going for a short walk' },
            { icon: '🙏', label: 'Grateful', message: 'I am feeling grateful today' },
        ];
        case 'deep_work': return [
            { icon: '💧', label: 'Hydrate', message: 'I drank water' },
            { icon: '👁️', label: 'Eye break', message: 'I took a screen break' },
            { icon: '🍱', label: 'Log lunch', message: 'I had lunch' },
            { icon: '🙏', label: 'Grateful', message: 'I am feeling grateful today' },
        ];
        case 'digital_sunset': return [
            { icon: '🙏', label: 'Gratitude', message: 'I am feeling grateful today' },
            { icon: '📖', label: 'Read', message: 'I read before bed tonight' },
            { icon: '💤', label: 'Sleep', message: 'Going to sleep now, goodnight' },
        ];
        case 'brain_dump': return [
            { icon: '💤', label: 'Sleep', message: 'Going to sleep now, goodnight' },
            { icon: '🙏', label: 'Gratitude', message: 'I am feeling grateful today' },
            { icon: '💧', label: 'Hydrate', message: 'I drank water' },
        ];
        default: return [
            { icon: '💧', label: 'Hydrate', message: 'I drank water' },
            { icon: '🙏', label: 'Grateful', message: 'I am feeling grateful today' },
            { icon: '🎯', label: 'Focus', message: 'Starting a deep work sprint now' },
            { icon: '💬', label: 'Check in', message: 'Let me tell you how I am feeling right now' },
        ];
    }
}

// ─── Direct-log helpers (bypass Bodhi tool for homepage UI events) ─────────────
function extractActivityName(msg: string): string {
    const habitMatch = msg.match(/completed my [\w\s]+ habit:\s*(.+?)(?:\s*\(|\. )/i);
    if (habitMatch) return habitMatch[1].trim();
    const withoutTag = msg.replace(/\s*\[UI_EVENT:[^\]]+\]/gi, '').trim();
    const dashIdx = withoutTag.indexOf(' \u2014 ');
    const actPart = (dashIdx >= 0 ? withoutTag.slice(0, dashIdx) : withoutTag).trim();
    const parsed = parseLogMessage(msg);
    if (parsed && parsed.activityKey !== 'general') {
        const lbl = parsed.label;
        return lbl.charAt(0) + lbl.slice(1).toLowerCase();
    }
    return actPart
        .replace(/^i (just |had |took |did |woke |completed |got |am |going |setting |heading |starting )/i, '')
        .replace(/\s+(today|tonight|this morning|this evening|now).*$/i, '')
        .trim()
        .slice(0, 40) || 'activity';
}

function getIstTimeStr(): string {
    return new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
}

function getSimpleLogVerdict(activityName: string): LogVerdict {
    const h = parseInt(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false }), 10) % 24;
    const act = activityName.toLowerCase();
    if (/wake|woke|rise|ris(e|ing)|good morning|subah/.test(act)) return h < 9 ? 'on_time' : h < 11 ? 'late' : 'very_late';
    if (/\blunch\b|dopahar/.test(act)) return h < 12 ? 'early' : h <= 14 ? 'on_time' : h <= 16 ? 'late' : 'very_late';
    if (/\bdinner\b|raat/.test(act)) return h < 19 ? 'early' : h <= 21 ? 'on_time' : h <= 22 ? 'late' : 'very_late';
    if (/breakfast|nashta/.test(act)) return h <= 9 ? 'on_time' : h <= 11 ? 'late' : 'very_late';
    if (/sleep|goodnight|neend/.test(act)) return (h >= 21 || h < 2) ? 'on_time' : h < 23 ? 'late' : 'very_late';
    return 'on_time';
}

// ─── Ayurvedic morning sequence: what comes NEXT after each practice ──────────
const AYURVEDIC_SEQUENCE: Array<{ match: RegExp; next: string; emoji: string }> = [
    { match: /wake|woke|ris(e|ing)|uthna|jaag|good morning/i,     emoji: '💧', next: 'Warm water — pehla kadam! Ek bada glass pi lo abhi.' },
    { match: /warm water|morning water|paani/i,                     emoji: '🪥', next: 'Tongue scraping (jihva shodhana) — 30 seconds, toxins bahar!' },
    { match: /tongue|jihva|scraping/i,                              emoji: '🚿', next: 'Bath & snana — body ko activate karo.' },
    { match: /bath|shower|snaan|snana/i,                            emoji: '☀️', next: 'Morning sunlight — 5 min bahar niklo, solar activation complete.' },
    { match: /sunlight|morning sun|solar|sun gaz/i,                 emoji: '🧘', next: 'Pranayama / breathwork — sirf 5 minute, din ka trajectory set ho jaayega.' },
    { match: /pranayama|breathwork|breathing|breath/i,              emoji: '🕊️', next: 'Morning meditation (dhyan) — 10 minutes, fir poora din focused.' },
    { match: /meditat|dhyan|mindful/i,                              emoji: '🙏', next: 'Gratitude practice — 3 achi cheezein yaad karo aaj ki.' },
    { match: /gratitude|grateful|shukriya/i,                        emoji: '🥣', next: 'Nourishing breakfast — pitta ko fuel do, subah ka sabse important meal.' },
    { match: /breakfast|nashta|nasta/i,                             emoji: '🎯', next: 'Deep work sprint — 2 hour focus block, morning energy peak pe hai.' },
    { match: /\blunch\b|dopahar|din ka khana/i,                     emoji: '🚶', next: 'Post-lunch walk — sirf 10 min, digestion 2x better ho jaayegi.' },
    { match: /workout|exercise|gym|yoga|run/i,                      emoji: '💧', next: 'Protein + hydration — recovery ke liye zaruri hai abhi.' },
    { match: /\bwalk\b|evening walk/i,                              emoji: '🌙', next: 'Light dinner plan karo — sunset ke 2 ghante ke andar best hai.' },
    { match: /\bdinner\b|raat ka khana|supper/i,                    emoji: '📵', next: 'Digital sunset — screens band karo, neend ki quality double hogi.' },
    { match: /digital sunset|screen off|screens/i,                  emoji: '📖', next: 'Light reading or journaling — 15 min, mind ko settle karo.' },
    { match: /read|journal|brain dump/i,                            emoji: '💤', next: 'Sleep — body ko deep repair mode mein jaane do. Shubh Ratri!' },
];

function getAyurvedicNext(activityName: string): string | null {
    const act = activityName.toLowerCase();
    for (const item of AYURVEDIC_SEQUENCE) {
        if (item.match.test(act)) return `${item.emoji} ${item.next}`;
    }
    return null;
}

async function directSaveActivityToFirestore(uid: string, activityName: string, verdict: LogVerdict): Promise<void> {
    try {
        const { getFirebaseFirestore } = await import('@/lib/firebase');
        const { doc, setDoc } = await import('firebase/firestore');
        const db = await getFirebaseFirestore();
        const logId = Date.now().toString();
        const istHour = parseInt(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false }), 10) % 24;
        await setDoc(doc(db, 'users', uid, 'logs_daily', logId), {
            id: logId,
            text: activityName,
            category: 'lifestyle',
            timing_verdict: verdict,
            ist_hour: istHour,
            createdAt: Date.now(),
            uid,
        });
        console.log(`[Direct Log] ✅ Saved: "${activityName}" [${verdict}]`);
    } catch (e) {
        console.warn('[Direct Log] Firestore save failed', e);
    }
}

// ─── Log Card ─────────────────────────────────────────────────────────────────
function LogCard({ parsed, timestamp, uid, userName }: { parsed: ParsedLog; timestamp: number; uid?: string | null; userName?: string }) {
    const timeStr = new Date(timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
    const [isPublic, setIsPublic] = React.useState(false);
    const [publishing, setPublishing] = React.useState(false);

    const togglePublic = React.useCallback(async () => {
        if (!uid || publishing) return;
        const next = !isPublic;
        setIsPublic(next);
        setPublishing(true);
        try {
            const { getFirebaseFirestore } = await import('@/lib/firebase');
            const { collection, addDoc, query, where, getDocs, deleteDoc } = await import('firebase/firestore');
            const db = await getFirebaseFirestore();
            if (next) {
                await addDoc(collection(db, 'public_logs'), {
                    uid,
                    userName: userName || 'Seeker',
                    icon: parsed.icon,
                    label: parsed.label,
                    detail: parsed.detail || null,
                    color: parsed.color,
                    activityKey: parsed.activityKey,
                    createdAt: timestamp,
                    isPublic: true,
                });
            } else {
                const snap = await getDocs(query(collection(db, 'public_logs'), where('uid', '==', uid), where('createdAt', '==', timestamp)));
                await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
            }
        } catch { /* offline */ }
        setPublishing(false);
    }, [uid, isPublic, publishing, parsed, timestamp, userName]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.93 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem', padding: '0 0.25rem' }}
        >
            <div style={{
                maxWidth: '82%',
                background: `radial-gradient(135deg at 15% 10%, ${parsed.color}28 0%, rgba(6,3,18,0.97) 72%)`,
                backdropFilter: 'blur(32px) saturate(200%)',
                WebkitBackdropFilter: 'blur(32px) saturate(200%)',
                border: `1px solid ${isPublic ? '#4ade8088' : parsed.color + '55'}`,
                borderRadius: '18px 4px 18px 18px',
                padding: '0.80rem 1rem 0.65rem',
                boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.18), 0 6px 30px rgba(0,0,0,0.30), 0 0 28px ${parsed.color}22`,
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Top shimmer */}
                <div aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '48%', background: 'linear-gradient(180deg, rgba(255,255,255,0.09) 0%, transparent 100%)', pointerEvents: 'none', borderRadius: '18px 4px 0 0' }} />
                {/* Color accent bar */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: `linear-gradient(180deg, ${parsed.color} 0%, ${parsed.color}44 100%)`, borderRadius: '3px 0 0 3px' }} />
                {/* Main row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.62rem', paddingLeft: '0.55rem', position: 'relative', zIndex: 1 }}>
                    {/* Icon with colored halo circle */}
                    <div style={{ flexShrink: 0, marginTop: 2, position: 'relative' }}>
                        <motion.div
                            animate={{ scale: [1, 1.08, 1], opacity: [0.55, 0.80, 0.55] }}
                            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                            style={{
                                position: 'absolute', inset: -5, borderRadius: '50%',
                                background: `radial-gradient(circle, ${parsed.color}35 0%, transparent 75%)`,
                                pointerEvents: 'none',
                            }}
                        />
                        <motion.span
                            animate={{ scale: [1, 1.14, 1] }}
                            transition={{ duration: 3.0, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ fontSize: '1.75rem', lineHeight: 1, filter: `drop-shadow(0 0 12px ${parsed.color}99)`, display: 'block' }}
                        >
                            {parsed.icon}
                        </motion.span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.40rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                            <span style={{
                                fontSize: '0.60rem', fontWeight: 900, color: parsed.color,
                                letterSpacing: '0.18em', textTransform: 'uppercase',
                                fontFamily: "'Outfit', sans-serif",
                                filter: `drop-shadow(0 0 8px ${parsed.color}80)`,
                            }}>
                                {parsed.label}
                            </span>
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.30, type: 'spring', stiffness: 420, damping: 18 }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 4,
                                    background: `${parsed.color}20`, border: `1px solid ${parsed.color}55`,
                                    borderRadius: 999, padding: '0.12rem 0.42rem',
                                    boxShadow: `0 0 8px ${parsed.color}22`,
                                }}
                            >
                                <CheckCircle2 size={9} style={{ color: parsed.color }} />
                                <span style={{ fontSize: '0.40rem', color: parsed.color, fontWeight: 800, letterSpacing: '0.12em', fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase' }}>Logged</span>
                            </motion.div>
                            <span style={{ fontSize: '0.42rem', color: `${parsed.color}88`, fontFamily: 'monospace', letterSpacing: '0.06em' }}>{timeStr}</span>
                        </div>
                        {parsed.detail ? (
                            <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.55, color: 'rgba(255,255,255,0.90)', fontFamily: "'Outfit', sans-serif", fontWeight: 400 }}>
                                {parsed.detail}
                            </p>
                        ) : (
                            <p style={{ margin: 0, fontSize: '0.76rem', color: 'rgba(255,255,255,0.42)', fontFamily: "'Outfit', sans-serif", fontStyle: 'italic' }}>
                                ✦ Saved to daily story
                            </p>
                        )}
                        {/* Public / Private toggle */}
                        {uid && (
                            <motion.button
                                whileTap={{ scale: 0.88 }}
                                onClick={togglePublic}
                                disabled={publishing}
                                style={{
                                    marginTop: '0.55rem',
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    padding: '0.28rem 0.70rem',
                                    borderRadius: 999,
                                    background: isPublic ? 'rgba(74,222,128,0.18)' : 'rgba(255,255,255,0.06)',
                                    border: `1px solid ${isPublic ? 'rgba(74,222,128,0.55)' : 'rgba(255,255,255,0.14)'}`,
                                    color: isPublic ? '#4ade80' : 'rgba(255,255,255,0.45)',
                                    fontSize: '0.42rem', fontWeight: 700,
                                    fontFamily: "'Outfit', sans-serif",
                                    letterSpacing: '0.10em', textTransform: 'uppercase',
                                    cursor: 'pointer', transition: 'all 0.22s',
                                    boxShadow: isPublic ? '0 0 10px rgba(74,222,128,0.22)' : 'none',
                                }}
                            >
                                <span style={{ fontSize: '0.62rem' }}>{publishing ? '…' : isPublic ? '🌐' : '🔒'}</span>
                                {isPublic ? 'Public · Friends can see' : 'Private · Make public'}
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Chat bubble ──────────────────────────────────────────────────────────────
const INTENT_META: Record<IntentType, { icon: string; color: string; label: string } | null> = {
    task: { icon: '✅', color: '#fbbf24', label: 'Task saved' },
    idea: { icon: '💡', color: '#2dd4bf', label: 'Idea saved' },
    challenge: { icon: '⚡', color: '#fb923c', label: 'Challenge saved' },
    issue: { icon: '🔥', color: '#f87171', label: 'Issue saved' },
    general: null,
};

function ChatBubble({ msg, isLive = false, showTimestamp = true, uid, userName }: { msg: ChatMessage; isLive?: boolean; showTimestamp?: boolean; uid?: string | null; userName?: string }) {
    const parsed = parseLogMessage(msg.text);
    if (msg.role === 'user' && parsed) return <LogCard parsed={parsed} timestamp={msg.timestamp} uid={uid} userName={userName} />;
    const isUser = msg.role === 'user';
    const meta = msg.intent ? INTENT_META[msg.intent] : null;
    const [showFullTime, setShowFullTime] = useState(false);
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '0.65rem', padding: '0 0.25rem' }}
        >
            {!isUser && (
                <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginRight: 8, marginTop: 2,
                    background: 'radial-gradient(circle at 35% 30%, rgba(251,191,36,0.45) 0%, rgba(129,140,248,0.30) 60%, transparent 100%)',
                    border: '1px solid rgba(255,255,255,0.20)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem',
                }}>✦</div>
            )}
            <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', gap: '0.22rem', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                {/* Intent tag */}
                {!isUser && meta && (
                    <span style={{ fontSize: '0.48rem', fontWeight: 700, color: meta.color, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'monospace', marginLeft: 2 }}>
                        {meta.icon} {meta.label} detected
                    </span>
                )}
                <div style={{
                    background: isUser
                        ? 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.14) 0%, rgba(251,191,36,0.09) 50%, transparent 100%)'
                        : 'radial-gradient(ellipse at 25% 20%, rgba(255,255,255,0.11) 0%, rgba(129,140,248,0.07) 55%, transparent 100%)',
                    backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    border: isUser ? '1px solid rgba(251,191,36,0.22)' : '1px solid rgba(255,255,255,0.12)',
                    borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                    padding: '0.70rem 0.90rem',
                    boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.18), 0 4px 18px rgba(0,0,0,0.18)',
                    position: 'relative', overflow: 'hidden',
                }}>
                    <div aria-hidden style={{ position: 'absolute', top: '3%', left: '6%', width: '50%', height: '28%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.28) 0%, transparent 80%)', borderRadius: '50%', transform: 'rotate(-18deg)', filter: 'blur(2px)', pointerEvents: 'none' }} />
                    <p style={{ margin: 0, fontSize: '0.84rem', lineHeight: 1.6, color: isUser ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.88)', fontFamily: "'Outfit', sans-serif", fontWeight: 400, position: 'relative', zIndex: 1, whiteSpace: 'pre-wrap' }}>
                        {msg.text}
                        {isLive && <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.9, repeat: Infinity }} style={{ color: 'rgba(251,191,36,0.85)', marginLeft: 3 }}>▋</motion.span>}
                    </p>
                </div>
                {/* Saved badge */}
                {msg.savedItem && (
                    <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'flex', alignItems: 'center', gap: '0.22rem', marginLeft: 2 }}>
                        <CheckCircle2 size={10} style={{ color: '#4ade80' }} />
                        <span style={{ fontSize: '0.44rem', color: 'rgba(74,222,128,0.75)', letterSpacing: '0.10em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                            Saved to Planner as {msg.savedItem.type}
                        </span>
                    </motion.div>
                )}

                {/* Timestamp */}
                {showTimestamp && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        onClick={() => setShowFullTime(!showFullTime)}
                        style={{
                            fontSize: '0.40rem',
                            color: 'rgba(255,255,255,0.35)',
                            letterSpacing: '0.06em',
                            fontFamily: 'monospace',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                        }}
                    >
                        <Clock size={8} />
                        {showFullTime ? formatTime(msg.timestamp) : getTimeAgo(msg.timestamp)}
                    </motion.span>
                )}
            </div>
        </motion.div>
    );
}

// ─── Bodhi Orb ────────────────────────────────────────────────────────────────
function BodhiMiniOrb({ thinking, speaking }: { thinking: boolean; speaking: boolean }) {
    const isActive = thinking || speaking;
    const orbAnim = thinking
        ? { scale: [1, 1.02, 0.98, 1], transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' as const } }
        : speaking
            ? { scale: [1, 1.09, 0.94, 1.06, 1], transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' as const } }
            : { scale: [1, 1.04, 1], transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' as const } };

    return (
        <div style={{ position: 'relative', width: 62, height: 62 }}>
            {/* Speaking aura rings */}
            {speaking && [0, 1, 2].map(i => (
                <motion.div key={i}
                    animate={{ scale: [1, 1.9 + i * 0.3], opacity: [0.38, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.4, ease: 'easeOut' }}
                    style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid rgba(251,191,36,0.50)' }}
                />
            ))}
            {/* Thinking rings */}
            {thinking && [0, 1].map(i => (
                <motion.div key={i}
                    animate={{ scale: [1, 1.55 + i * 0.2], opacity: [0.28, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.55, ease: 'easeOut' }}
                    style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(34,211,238,0.45)' }}
                />
            ))}
            {/* Rotating dashed ring when active */}
            {isActive && (
                <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    style={{
                        position: 'absolute', inset: -6, borderRadius: '50%',
                        border: '1px dashed rgba(251,191,36,0.55)',
                        pointerEvents: 'none',
                    }}
                />
            )}
            <motion.div animate={orbAnim} style={{
                width: 62, height: 62, borderRadius: '50%', position: 'relative',
                background: isActive
                    ? 'radial-gradient(circle at 38% 30%, rgba(120,200,255,0.28) 0%, rgba(18,28,95,0.94) 45%, rgba(4,7,38,0.97) 100%)'
                    : 'radial-gradient(circle at 38% 30%, rgba(120,200,255,0.18) 0%, rgba(18,28,95,0.88) 45%, rgba(4,7,38,0.95) 100%)',
                backdropFilter: 'blur(12px) saturate(180%)', WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                border: `1.5px solid ${speaking ? 'rgba(251,191,36,0.55)' : thinking ? 'rgba(34,211,238,0.55)' : 'rgba(34,211,238,0.42)'}`,
                boxShadow: speaking
                    ? '0 0 0 1px rgba(251,191,36,0.18), 0 6px 28px rgba(251,191,36,0.30), 0 0 48px rgba(251,191,36,0.15)'
                    : thinking
                        ? '0 0 0 1px rgba(34,211,238,0.18), 0 6px 28px rgba(34,211,238,0.25), 0 0 48px rgba(34,211,238,0.12)'
                        : '0 0 0 1px rgba(34,211,238,0.14), 0 6px 24px rgba(14,116,144,0.40)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
                {/* Inner glow pulse */}
                <motion.div
                    animate={{ opacity: [0.3, 0.65, 0.3], scale: [0.7, 1.1, 0.7] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        background: speaking
                            ? 'radial-gradient(circle at center, rgba(251,191,36,0.45) 0%, rgba(34,211,238,0.18) 55%, transparent 80%)'
                            : 'radial-gradient(circle at center, rgba(139,92,246,0.45) 0%, rgba(34,211,238,0.18) 55%, transparent 80%)',
                        pointerEvents: 'none',
                    }}
                />
                {/* Yogi SVG — eyes open when active, closed when idle */}
                <svg width="36" height="40" viewBox="0 0 40 44" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'relative', zIndex: 2 }}>
                    <circle cx="20" cy="12" r="9.5" fill={isActive ? 'rgba(255,215,0,0.18)' : 'rgba(255,215,0,0.05)'} />
                    <circle cx="20" cy="12" r="7.5" fill="none" stroke={isActive ? 'rgba(255,215,0,0.75)' : 'rgba(255,215,0,0.32)'} strokeWidth={isActive ? '1' : '0.7'} strokeDasharray={isActive ? '3 1.2' : '2.5 1.5'} />
                    <circle cx="20" cy="12" r="5" fill={isActive ? 'rgba(255,255,255,0.98)' : 'rgba(220,245,255,0.92)'} />
                    {isActive ? (
                        <>
                            <ellipse cx="18" cy="11.8" rx="1.2" ry="1.0" fill="#0f172a" />
                            <circle cx="18" cy="11.8" r="0.45" fill={speaking ? '#fbbf24' : '#22d3ee'} />
                            <ellipse cx="22" cy="11.8" rx="1.2" ry="1.0" fill="#0f172a" />
                            <circle cx="22" cy="11.8" r="0.45" fill={speaking ? '#fbbf24' : '#22d3ee'} />
                            <ellipse cx="20" cy="10.2" rx="1.6" ry="1.0" fill="#FFD700" opacity="0.95" />
                            <circle cx="20" cy="10.2" r="0.65" fill="#fff" />
                        </>
                    ) : (
                        <>
                            <path d="M17 12 Q18 11 19 12" stroke="rgba(80,120,160,0.65)" strokeWidth="0.7" fill="none" strokeLinecap="round" />
                            <path d="M21 12 Q22 11 23 12" stroke="rgba(80,120,160,0.65)" strokeWidth="0.7" fill="none" strokeLinecap="round" />
                            <ellipse cx="20" cy="10.8" rx="1.4" ry="0.85" fill="#FFD700" />
                            <circle cx="20" cy="10.8" r="0.5" fill="rgba(255,255,255,0.9)" />
                        </>
                    )}
                    <rect x="17.8" y="17" width="4.4" height="2.8" rx="1.5" fill="rgba(210,240,255,0.85)" />
                    <path d="M 14 30 L 15.5 20 Q 20 18.5 24.5 20 L 26 30 Z" fill="rgba(190,230,255,0.85)" />
                    <path d="M 15.5 24 Q 12 26.5 11 30" stroke="rgba(190,230,255,0.85)" strokeWidth="2.6" strokeLinecap="round" fill="none" />
                    <circle cx="11" cy="30" r="2.2" fill="rgba(190,230,255,0.75)" />
                    <path d="M 24.5 24 Q 28 26.5 29 30" stroke="rgba(190,230,255,0.85)" strokeWidth="2.6" strokeLinecap="round" fill="none" />
                    <circle cx="29" cy="30" r="2.2" fill="rgba(190,230,255,0.75)" />
                    <path d="M 7 37 Q 13 32.5 20 33.5 Q 27 32.5 33 37 Q 30 41.5 20 42 Q 10 41.5 7 37 Z" fill="rgba(170,220,255,0.80)" />
                    <line x1="20" y1="19.5" x2="20" y2="30" stroke={isActive ? 'rgba(34,211,238,0.7)' : 'rgba(100,220,255,0.4)'} strokeWidth={isActive ? '1' : '0.7'} />
                    <circle cx="20" cy="23.5" r="1.0" fill={speaking ? '#fbbf24' : isActive ? '#22d3ee' : 'rgba(100,220,255,0.85)'} />
                    <circle cx="20" cy="7" r={isActive ? '2.2' : '1.7'} fill={isActive ? 'rgba(167,139,250,0.8)' : 'rgba(167,139,250,0.50)'} />
                </svg>
            </motion.div>
        </div>
    );
}

// ─── Voice Input Button ───────────────────────────────────────────────────────
function VoiceInputButton({
    isListening,
    onStart,
    onStop,
    disabled
}: {
    isListening: boolean;
    onStart: () => void;
    onStop: () => void;
    disabled?: boolean;
}) {
    return (
        <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={isListening ? onStop : onStart}
            disabled={disabled}
            animate={isListening ? {
                scale: [1, 1.1, 1],
                boxShadow: [
                    '0 0 0 0 rgba(248,113,113,0.4)',
                    '0 0 0 8px rgba(248,113,113,0)',
                    '0 0 0 0 rgba(248,113,113,0)'
                ]
            } : {}}
            transition={isListening ? { duration: 1.2, repeat: Infinity } : {}}
            style={{
                flexShrink: 0,
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: isListening
                    ? 'linear-gradient(135deg, rgba(248,113,113,0.35), rgba(239,68,68,0.25))'
                    : 'rgba(255,255,255,0.06)',
                border: isListening
                    ? '1px solid rgba(248,113,113,0.50)'
                    : '1px solid rgba(255,255,255,0.10)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: disabled ? 'default' : 'pointer',
                color: isListening ? '#f87171' : 'rgba(255,255,255,0.50)',
                transition: 'all 0.25s',
                position: 'relative',
            }}
        >
            {isListening ? <MicOff size={15} /> : <Mic size={15} />}
            {isListening && (
                <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    style={{
                        position: 'absolute',
                        inset: -4,
                        borderRadius: '50%',
                        border: '2px solid rgba(248,113,113,0.3)',
                    }}
                />
            )}
        </motion.button>
    );
}

// ─── Log Story Toast ──────────────────────────────────────────────────────────
type LogVerdict = 'early' | 'on_time' | 'late' | 'very_late';

const VERDICT_META: Record<LogVerdict, { icon: string; color: string; label: string }> = {
    early:     { icon: '⚡', color: '#22d3ee', label: 'Early Bird' },
    on_time:   { icon: '✦', color: '#4ade80', label: 'Perfect Timing' },
    late:      { icon: '🌙', color: '#fb923c', label: 'Logged' },
    very_late: { icon: '💧', color: '#f87171', label: 'Better Late Than Never' },
};

function LogStoryToast({
    activity,
    verdict,
    onDone,
}: {
    activity: string;
    verdict: LogVerdict;
    onDone: () => void;
}) {
    const meta = VERDICT_META[verdict];
    useEffect(() => {
        const t = setTimeout(onDone, 3800);
        return () => clearTimeout(t);
    }, [onDone]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            style={{
                position: 'fixed',
                bottom: 160,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9000,
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                background: 'radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.13) 0%, rgba(8,4,28,0.97) 100%)',
                backdropFilter: 'blur(32px) saturate(200%)',
                WebkitBackdropFilter: 'blur(32px) saturate(200%)',
                border: `1px solid ${meta.color}44`,
                borderRadius: 999,
                padding: '0.55rem 1.1rem 0.55rem 0.65rem',
                boxShadow: `0 0 0 1px ${meta.color}22, 0 8px 36px rgba(0,0,0,0.45), 0 0 32px ${meta.color}28`,
                minWidth: 220,
                maxWidth: 340,
                pointerEvents: 'none',
            }}
        >
            {/* Glowing ring */}
            <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.7, 0.2, 0.7] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: `radial-gradient(circle at center, ${meta.color}55 0%, transparent 72%)`,
                    border: `1.5px solid ${meta.color}80`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem',
                }}
            >
                {meta.icon}
            </motion.div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.12rem' }}>
                    <span style={{ fontSize: '0.46rem', fontWeight: 800, color: meta.color, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                        ◎ Story Updated
                    </span>
                    <span style={{ fontSize: '0.40rem', color: `${meta.color}88`, fontFamily: 'monospace', letterSpacing: '0.08em' }}>
                        · {meta.label}
                    </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.90)', fontFamily: "'Outfit', sans-serif", fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activity}
                </p>
            </div>
            {/* Shimmer sweep */}
            <motion.div
                animate={{ x: ['-120%', '220%'] }}
                transition={{ duration: 1.6, delay: 0.3, ease: 'easeInOut' }}
                style={{
                    position: 'absolute', inset: 0, borderRadius: 999,
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
                    pointerEvents: 'none',
                    overflow: 'hidden',
                }}
            />
        </motion.div>
    );
}

// ─── Animated Background ────────────────────────────────────────────────────
function AnimatedBackground({ chatState }: { chatState: string }) {
    const getGradient = () => {
        switch (chatState) {
            case 'connecting':
                return 'radial-gradient(ellipse at 20% 10%, rgba(129,140,248,0.12) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(99,102,241,0.15) 0%, transparent 55%)';
            case 'thinking':
                return 'radial-gradient(ellipse at 50% 30%, rgba(129,140,248,0.15) 0%, transparent 60%), radial-gradient(ellipse at 20% 70%, rgba(174,175,255,0.10) 0%, transparent 50%)';
            case 'speaking':
                return 'radial-gradient(ellipse at 30% 20%, rgba(251,191,36,0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(253,224,71,0.10) 0%, transparent 55%)';
            case 'error':
                return 'radial-gradient(ellipse at 50% 50%, rgba(248,113,113,0.08) 0%, transparent 60%)';
            default:
                return 'radial-gradient(ellipse at 20% 10%, rgba(251,191,36,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(99,102,241,0.08) 0%, transparent 55%)';
        }
    };

    return (
        <motion.div
            initial={false}
            animate={{ background: getGradient() }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 0,
            }}
        />
    );
}

// ─── Activity emoji map ─────────────────────────────────────────────────────────────────────────────
function getActivityEmoji(name: string): string {
    const n = name.toLowerCase();
    if (/wake|woke|subah|uthna/.test(n)) return '🌅';
    if (/breakfast|nashta|nasta/.test(n)) return '🥣';
    if (/\blunch\b|dopahar/.test(n)) return '🍱';
    if (/\bdinner\b|raat ka khana/.test(n)) return '🌙';
    if (/\bsleep\b|neend|sona|goodnight/.test(n)) return '💤';
    if (/meditat|dhyan|breath|pranayam/.test(n)) return '🧘';
    if (/workout|gym|run|yoga|fitness|cardio/.test(n)) return '💪';
    if (/\bwalk\b/.test(n)) return '🚶';
    if (/water|paani|hydrat/.test(n)) return '💧';
    if (/gratit|grateful/.test(n)) return '🙏';
    if (/fast|fasting|upvaas/.test(n)) return '⏳';
    if (/deep work|focus|study/.test(n)) return '🎯';
    return '✶';
}

// ─── Daily Story Strip (logged activities for today) ──────────────────────────────────────────────────
function DailyStoryStrip({ activities }: { activities: Array<{ name: string; verdict: LogVerdict; timestamp: number }> }) {
    if (activities.length === 0) return null;
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="story-strip"
            style={{ display: 'flex', gap: '0.32rem', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 3, marginBottom: '0.30rem' }}
        >
            <style>{`.story-strip::-webkit-scrollbar{display:none}`}</style>
            <span style={{ flexShrink: 0, fontSize: '0.38rem', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'monospace', alignSelf: 'center', marginRight: 2 }}>Today</span>
            {activities.map((a, i) => {
                const meta = VERDICT_META[a.verdict];
                const emoji = getActivityEmoji(a.name);
                const timeStr = new Date(a.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
                return (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.78 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05, type: 'spring', stiffness: 380, damping: 24 }}
                        title={`${a.name} — ${meta.label} @ ${timeStr}`}
                        style={{
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            background: `radial-gradient(circle at 30% 30%, ${meta.color}1a 0%, rgba(4,2,16,0.88) 100%)`,
                            border: `1px solid ${meta.color}44`,
                            borderRadius: 999,
                            padding: '0.20rem 0.48rem 0.20rem 0.30rem',
                            boxShadow: `0 0 8px ${meta.color}18`,
                        }}
                    >
                        <span style={{ fontSize: '0.72rem', lineHeight: 1 }}>{emoji}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <span style={{ fontSize: '0.40rem', fontWeight: 700, color: meta.color, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                                {meta.icon} {a.name.length > 11 ? a.name.slice(0, 11) + '…' : a.name}
                            </span>
                            <span style={{ fontSize: '0.35rem', color: 'rgba(255,255,255,0.32)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                                {timeStr}
                            </span>
                        </div>
                    </motion.div>
                );
            })}
        </motion.div>
    );
}

// ─── Contextual quick-log chips (time-aware) ─────────────────────────────────────────────────────────
function getContextualLogChips(): Array<{ icon: string; label: string; message: string }> {
    const istH = parseInt(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false }), 10) % 24;
    if (istH >= 3 && istH < 11) return [
        { icon: '🌅', label: 'Wake Up', message: 'I just woke up' },
        { icon: '🥣', label: 'Breakfast', message: 'I had breakfast' },
        { icon: '🧘', label: 'Meditate', message: 'I meditated today' },
        { icon: '💧', label: 'Hydrate', message: 'I drank water' },
    ];
    if (istH >= 11 && istH < 15) return [
        { icon: '🍱', label: 'Lunch', message: 'I had lunch' },
        { icon: '💧', label: 'Hydrate', message: 'I drank water' },
        { icon: '🎯', label: 'Deep Work', message: 'Starting a deep work session now' },
        { icon: '🚶', label: 'Walk', message: 'I went for a post-lunch walk' },
    ];
    if (istH >= 15 && istH < 21) return [
        { icon: '💪', label: 'Workout', message: 'I worked out today' },
        { icon: '🌙', label: 'Dinner', message: 'I had dinner' },
        { icon: '🙏', label: 'Grateful', message: 'I am feeling grateful today' },
        { icon: '💧', label: 'Hydrate', message: 'I drank water' },
    ];
    return [
        { icon: '💤', label: 'Sleep', message: 'Going to sleep now, goodnight' },
        { icon: '🌙', label: 'Dinner', message: 'I had dinner' },
        { icon: '🙏', label: 'Grateful', message: 'I am feeling grateful today' },
        { icon: '📖', label: 'Read', message: 'I read before bed' },
    ];
}

// ─── Follow-up chip helper (shown when UI_EVENT msg has no pre-selected detail) ──────────────
type FollowUpChip = { icon: string; label: string; reply: string };

function getFollowUpChips(msg: string): FollowUpChip[] | null {
    if (msg.includes(' — ')) return null; // detail already chosen via sub-option panel
    const m = msg.toLowerCase();
    if (/\blunch\b|dopahar/.test(m)) return [
        { icon: '🍚', label: 'Dal rice', reply: 'Had dal rice for lunch' },
        { icon: '🫓', label: 'Roti sabzi', reply: 'Had roti and sabzi' },
        { icon: '🥗', label: 'Light salad', reply: 'Had a light salad' },
        { icon: '🍕', label: 'Outside food', reply: 'Ate outside / ordered in' },
        { icon: '⏭️', label: 'Skipped', reply: 'Skipped lunch today' },
    ];
    if (/breakfast|nashta/.test(m)) return [
        { icon: '🥣', label: 'Oats & fruits', reply: 'Had oats with fruits for breakfast' },
        { icon: '🫓', label: 'Parathas', reply: 'Had parathas this morning' },
        { icon: '🍳', label: 'Eggs', reply: 'Had eggs for breakfast' },
        { icon: '🍵', label: 'Just chai', reply: 'Just had chai, light start today' },
    ];
    if (/\bdinner\b|raat ka/.test(m)) return [
        { icon: '🥗', label: 'Light & clean', reply: 'Had a light clean dinner' },
        { icon: '🍚', label: 'Full meal', reply: 'Had a full dinner meal' },
        { icon: '🫓', label: 'Roti sabzi', reply: 'Had roti sabzi for dinner' },
        { icon: '⏭️', label: 'Skipped', reply: 'Skipping dinner tonight' },
    ];
    if (/workout|gym|exercise/.test(m)) return [
        { icon: '🏋️', label: 'Gym session', reply: 'Full gym session done' },
        { icon: '🏃', label: 'Evening run', reply: 'Went for an evening run' },
        { icon: '🧘', label: 'Yoga', reply: 'Did a yoga flow session' },
        { icon: '🚶', label: 'Walk', reply: 'Took an evening walk' },
    ];
    if (/wake|woke|morning/.test(m)) return [
        { icon: '⚡', label: '5 AM sharp', reply: 'Woke up at 5 AM' },
        { icon: '🌄', label: '6–7 AM', reply: 'Woke up around 6–7 AM' },
        { icon: '☀️', label: 'Around 8 AM', reply: 'Woke up around 8 AM' },
        { icon: '😅', label: 'A bit late', reply: 'Woke up a bit late today' },
    ];
    if (/sleep|goodnight/.test(m)) return [
        { icon: '🌙', label: 'Before 10 PM', reply: 'Sleeping before 10 PM tonight' },
        { icon: '🕙', label: '10–11 PM', reply: 'Sleeping around 10–11 PM' },
        { icon: '🌃', label: '11 PM–midnight', reply: 'Sleeping around midnight' },
        { icon: '🦉', label: 'Night owl', reply: 'Late night — past midnight' },
    ];
    if (/breathwork|pranayam/.test(m)) return [
        { icon: '⏱️', label: '5 min reset', reply: '5 minute breathing session done' },
        { icon: '🕐', label: '10 min flow', reply: '10 minute pranayama flow done' },
        { icon: '✨', label: '20+ min deep', reply: 'Full 20+ minute breathwork session' },
    ];
    if (/sunlight|morning light|sun/.test(m)) return [
        { icon: '👁️', label: 'Sun gazing', reply: 'Did morning sun gazing ritual' },
        { icon: '🚶', label: 'Morning walk', reply: 'Took a morning walk in sunlight' },
        { icon: '☕', label: 'Chai outside', reply: 'Had chai in the morning sun' },
    ];
    return null;
}

// ─── Main Page ────────────────────────────────────────────────────────────────────────────────
export default function BodhiChatPage() {
    const router = useRouter();
    const { user } = useOneSutraAuth();
    const { lang } = useLanguage();
    const { tasks, addTask, removeTask } = useDailyTasks();
    const { pendingMessage, clearPendingMessage } = useBodhiChatStore();
    const lifestyle = useLifestyleEngine();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isTypingFocus, setIsTypingFocus] = useState(false);
    const [uid, setUid] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [keyboardHint, setKeyboardHint] = useState(false);
    const [selectedMoodEmoji, setSelectedMoodEmoji] = useState<string>('');
    const [selectedMoodLabel, setSelectedMoodLabel] = useState<string>('');
    const [showMoodPicker, setShowMoodPicker] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [logToast, setLogToast] = useState<{ id: string; activity: string; verdict: LogVerdict } | null>(null);
    const [loggedActivities, setLoggedActivities] = useState<Array<{ name: string; verdict: LogVerdict; timestamp: number }>>([]);
    const [sessionLoggedActivities, setSessionLoggedActivities] = useState<Array<{ name: string; verdict: LogVerdict; timestamp: number }>>([]);
    const [followUpChips, setFollowUpChips] = useState<FollowUpChip[] | null>(null);
    const [lastLoggedActivity, setLastLoggedActivity] = useState<string | null>(null);
    const [activeQuickChip, setActiveQuickChip] = useState<string | null>(null);
    const [showQuickActions, setShowQuickActions] = useState(true);

    const inputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const pendingSentRef = useRef(false);
    const uidRef = useRef<string | null>(null);
    const greetedRef = useRef(false);
    const connectCalledRef = useRef(false);
    const recognitionRef = useRef<any>(null);
    const proactiveSentRef = useRef(false);
    const lastSendTimeRef = useRef<number>(0);

    const displayName = user?.name || 'Mitra';
    const pendingCount = tasks.filter(t => !t.done && t.category !== 'Idea' && t.category !== 'Challenge').length;

    // ── Build lifestyle context for Bodhi ─────────────────────────────────────
    const today = getToday();
    const todayHabitLogs = lifestyle.habitLogs.filter(l => l.date === today && l.completed);
    const todayMantra = lifestyle.mantraSessions.some(s => s.date === today);
    const todayBreathing = lifestyle.breathingSessions.some(s => s.date === today);
    const todayJournal = lifestyle.journalEntries.some(e => e.date === today);
    const bestStreak = Object.values(lifestyle.streaks).reduce((m, s) => Math.max(m, s.currentStreak ?? 0), 0);
    const longestEver = Object.values(lifestyle.streaks).reduce((m, s) => Math.max(m, s.longestStreak ?? 0), 0);
    const activeChallenge = lifestyle.profile?.activeMantraPractices?.[0]
        ? lifestyle.mantraStreaks[lifestyle.profile.activeMantraPractices[0]] : null;

    // Compute the next pending habit in Ayurvedic morning order
    const MORNING_HABIT_ORDER: Record<string, number> = {
        h_morning_water: 1, h_tongue_scraping: 2, h_bathing: 3,
        h_morning_sunlight: 4, h_pranayama: 5, h_morning_meditation: 6,
        h_gratitude: 7, h_breakfast: 8,
    };
    const pendingHabitsToday = lifestyle.activeHabits.filter(h =>
        !todayHabitLogs.some(l => l.habitId === h.id)
    );
    const nextPendingHabit = pendingHabitsToday
        .filter(h => h.category === 'morning' || h.category === 'sacred')
        .sort((a, b) => (MORNING_HABIT_ORDER[a.id] ?? 99) - (MORNING_HABIT_ORDER[b.id] ?? 99))[0]
        ?? pendingHabitsToday[0];

    const bodhiLifestyleCtx = lifestyle.profile?.onboardingComplete ? {
        buddyName: lifestyle.profile.buddyName,
        buddyPersonality: lifestyle.profile.buddyPersonality,
        habitsCompletedToday: todayHabitLogs.length,
        totalHabitsToday: lifestyle.activeHabits.length,
        currentStreak: bestStreak,
        longestStreak: longestEver,
        todayMood: lifestyle.todayMood?.mood,
        todayMoodLabel: lifestyle.todayMood?.mood ? ['', 'Very Low', 'Low', 'Okay', 'Good', 'Great'][lifestyle.todayMood.mood] : undefined,
        lastMoodNote: lifestyle.todayMood?.note,
        mantraPracticeToday: todayMantra,
        breathingPracticeToday: todayBreathing,
        activeChallengeName: activeChallenge?.mantraId,
        activeChallengeDay: activeChallenge?.currentStreak,
        activeChallengeDays: activeChallenge?.challengeDays,
        journaledToday: todayJournal,
        xpLevel: lifestyle.xp.level,
        totalXP: lifestyle.xp.total,
        recentBadges: lifestyle.badges.slice(-3).map(b => b.name),
        lifeAreas: lifestyle.profile.lifeAreas,
        primaryMotivation: lifestyle.profile.motivation,
        spiritualBackground: lifestyle.profile.spiritualBackground,
        onboardingComplete: true,
        adhdMode: lifestyle.adhdMode,
        nextPendingHabit: nextPendingHabit ? `${nextPendingHabit.icon} ${nextPendingHabit.name}` : undefined,
    } : undefined;

    // ── Bodhi Chat Voice (Gemini Live) ────────────────────────────────────────
    const { chatState, isSpeaking, isConnected, connect, disconnect, sendMessage: bodhiSend } = useBodhiChatVoice({
        userName: displayName,
        preferredLanguage: lang,
        pendingTasks: tasks.map(t => ({ id: t.id, text: t.text, done: t.done, category: t.category, startTime: t.startTime })),
        userId: uid,
        userMood: selectedMoodEmoji ? `${selectedMoodEmoji} ${selectedMoodLabel}` : '',
        lifestyleContext: bodhiLifestyleCtx,
        onAddTask: async (task) => { await addTask(task as unknown as Parameters<typeof addTask>[0]); },
        onRemoveTask: async (taskId) => { await removeTask(taskId); },
        onLogActivity: (activity, verdict, _reaction) => {
            setLogToast({ id: `${Date.now()}`, activity, verdict });
            const newEntry = { name: activity, verdict, timestamp: Date.now() };
            setSessionLoggedActivities(prev => {
                if (prev.some(a => a.name.toLowerCase() === activity.toLowerCase())) return prev;
                return [...prev, newEntry];
            });
            setLoggedActivities(prev => {
                if (prev.some(a => a.name.toLowerCase() === activity.toLowerCase())) return prev;
                return [...prev, newEntry];
            });
            // Save to unified log bridge so Practice section stays in sync
            saveUnifiedLog(activity, verdict);
            // Sync to lifestyle store — mark matching habit as complete
            const habitId = matchActivityToHabitId(activity);
            if (habitId) {
                const matched = lifestyle.activeHabits.find(h => h.id === habitId);
                const alreadyDone = todayHabitLogs.some(l => l.habitId === habitId);
                if (matched && !alreadyDone) {
                    lifestyle.completeHabit(habitId);
                }
            }
        },
        onMessage: (text) => {
            setMessages(prev => {
                // Dedup: skip if identical or fully contained in the last Bodhi message
                const lastBodhi = [...prev].reverse().find(m => m.role === 'bodhi');
                if (lastBodhi) {
                    const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
                    const n = norm(text), ln = norm(lastBodhi.text);
                    if (n === ln || (n.length > 20 && (ln.includes(n) || n.includes(ln)))) return prev;
                }
                const bodhiMsg: ChatMessage = { id: `b_${Date.now()}`, role: 'bodhi', text, timestamp: Date.now() };
                return [...prev, bodhiMsg];
            });
        },
    });

    const isThinking = chatState === 'thinking' || chatState === 'connecting';

    // Core send function - 2s debounce lock prevents double-fire from React re-renders
    const sendMessage = useCallback((text: string) => {
        if (!text.trim() || isThinking) return;
        const now = Date.now();
        if (now - lastSendTimeRef.current < 2000) return;
        lastSendTimeRef.current = now;
        const userMsg: ChatMessage = { id: `u_${Date.now()}`, role: 'user', text: text.trim(), timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setFollowUpChips(getFollowUpChips(text.trim()));
        bodhiSend(text.trim());
    }, [isThinking, bodhiSend]);

    // Voice input handlers
    const startVoiceInput = useCallback(() => {
        if (typeof window === 'undefined') return;
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) {
            alert('Speech recognition not supported in this browser');
            return;
        }
        const rec = new SR();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
        rec.onresult = (e: any) => {
            const transcript = Array.from(e.results as any[]).map((r: any) => r[0].transcript).join('');
            setInputValue(transcript);
            if (e.results[e.results.length - 1].isFinal) {
                setIsListening(false);
                setTimeout(() => sendMessage(transcript), 200);
            }
        };
        rec.onerror = () => setIsListening(false);
        rec.onend = () => setIsListening(false);
        rec.start();
        recognitionRef.current = rec;
        setIsListening(true);
    }, [lang, sendMessage]);

    const stopVoiceInput = useCallback(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
    }, []);

    // handleSubmit must be defined before keyboard shortcuts useEffect
    const handleSubmit = useCallback(() => {
        const t = inputValue.trim();
        if (!t || isThinking) return;
        sendMessage(t);
    }, [inputValue, isThinking, sendMessage]);

    // Get UID + load mood
    useEffect(() => {
        Promise.all([import('@/lib/firebase'), import('firebase/auth')]).then(
            ([{ getFirebaseAuth }, { onAuthStateChanged }]) => {
                getFirebaseAuth().then(auth => {
                    onAuthStateChanged(auth, async (u) => {
                        if (u) {
                            setUid(u.uid);
                            uidRef.current = u.uid;
                            const saved = await loadMoodFromFirebase(u.uid);
                            if (saved) {
                                setSelectedMoodEmoji(saved.emoji);
                                const found = MOOD_EMOJIS.find(m => m.mood === saved.mood);
                                setSelectedMoodLabel(found?.label ?? '');
                            }
                        }
                    });
                });
            }
        ).catch(() => { });
    }, []);

    // Load historical bodhi chat messages from Firebase
    useEffect(() => {
        if (!uid || historyLoaded) return;
        (async () => {
            try {
                const { getFirebaseFirestore } = await import('@/lib/firebase');
                const { doc, getDoc } = await import('firebase/firestore');
                const db = await getFirebaseFirestore();
                const snap = await getDoc(doc(db, 'users', uid));
                if (!snap.exists()) { setHistoryLoaded(true); return; }
                const history: Array<{ role: string; text: string; timestamp: number }> = snap.data()?.bodhi_history ?? [];
                if (history.length > 0) {
                    const historicalMsgs: ChatMessage[] = history.map((m, i) => ({
                        id: `hist_${m.timestamp}_${i}`,
                        role: m.role === 'bodhi' ? 'bodhi' : 'user',
                        text: m.text,
                        timestamp: m.timestamp,
                    }));
                    // Prepend history without overwriting any messages already added this session
                    setMessages(prev => {
                        const histIds = new Set(historicalMsgs.map(m => m.id));
                        const sessionMsgs = prev.filter(m => !histIds.has(m.id));
                        return [...historicalMsgs, ...sessionMsgs];
                    });
                }
                setHistoryLoaded(true);
            } catch { setHistoryLoaded(true); }
        })();
    }, [uid, historyLoaded]);

    // Handle mood selection — emoji appears in chat and is sent to Bodhi
    const handleMoodSelect = useCallback((emoji: string, label: string, mood: string) => {
        if (selectedMoodEmoji === emoji) {
            // Deselect — just clear state, no new message
            setSelectedMoodEmoji('');
            setSelectedMoodLabel('');
            if (uid) saveMoodToFirebase(uid, '', '');
        } else {
            setSelectedMoodEmoji(emoji);
            setSelectedMoodLabel(label);
            if (uid) saveMoodToFirebase(uid, emoji, mood);
            // Add emoji as a user chat bubble
            const moodMsg: ChatMessage = {
                id: `mood_${Date.now()}`,
                role: 'user',
                text: emoji,
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, moodMsg]);
            // Send to Bodhi with mood context so it can respond
            bodhiSend(`${emoji} (I am feeling ${label})`);
        }
    }, [selectedMoodEmoji, uid, bodhiSend]);

    // Connect to Gemini Live on mount (once)
    useEffect(() => {
        if (connectCalledRef.current) return;
        connectCalledRef.current = true;
        connect();
    }, [connect]);

    // Proactive wellness check-ins — injected directly as Bodhi messages once per session
    useEffect(() => {
        if (proactiveSentRef.current) return;
        const istNow = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
        const [istH, istM] = istNow.split(':').map(Number);
        const todayKey = `bodhi_proactive_${new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}`;
        const h = istH % 24;
        const m = istM;
        const isLunch = h === 13 && m <= 30;
        const isRest = h === 22 && m >= 30;
        if (!isLunch && !isRest) return;
        const msgKey = isLunch ? `${todayKey}_lunch` : `${todayKey}_rest`;
        if (typeof window !== 'undefined' && localStorage.getItem(msgKey)) return;
        proactiveSentRef.current = true;
        const text = isLunch
            ? 'Hey my friend, just checking in! 🍽️ Make sure you step away for a good lunch. Your body is your temple — nourish it with love. A rested mind creates magic. 💫'
            : "It's getting late, Sakha. 🌙 Time to rest those eyes and recharge that beautiful mind. Your dreams carry tomorrow's wisdom. Goodnight! ✨🙏";
        const proactiveMsg: ChatMessage = { id: `proactive_${Date.now()}`, role: 'bodhi', text, timestamp: Date.now() };
        setMessages(prev => [...prev, proactiveMsg]);
        if (typeof window !== 'undefined') localStorage.setItem(msgKey, '1');
    }, []);

    // Populate loggedActivities strip from lifestyle habits completed today (one-shot sync on mount)
    useEffect(() => {
        // If there's a pending habit message coming, skip here — the message handler will add it
        if (pendingMessage && /\[UI_EVENT:\s*HABIT_LOGGED\]/i.test(pendingMessage)) return;
        const completedToday = lifestyle.activeHabits.filter(h =>
            lifestyle.habitLogs.some(l => l.habitId === h.id && l.date === today && l.completed)
        );
        if (completedToday.length === 0) return;
        setLoggedActivities(prev => {
            const existingNames = new Set(prev.map(a => a.name.toLowerCase()));
            const newActs = completedToday
                .filter(h => !existingNames.has(h.name.toLowerCase()))
                .map(h => {
                    const logEntry = lifestyle.habitLogs.find(l => l.habitId === h.id && l.date === today);
                    return { name: `${h.icon} ${h.name}`, verdict: 'on_time' as const, timestamp: logEntry?.loggedAt ?? Date.now() };
                })
                .sort((a, b) => a.timestamp - b.timestamp);
            return newActs.length > 0 ? [...newActs, ...prev] : prev;
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount only

    // Auto-collapse quick-action chips when user is in logging mode
    useEffect(() => {
        if (lastLoggedActivity) setShowQuickActions(false);
    }, [lastLoggedActivity]);

    // Send pending message from homepage once connected
    useEffect(() => {
        if (!pendingMessage || pendingSentRef.current || chatState !== 'ready') return;
        pendingSentRef.current = true;
        const msg = pendingMessage;
        clearPendingMessage();
        const logInfo = parseLogMessage(msg);
        const isUIEvent = /\[UI_EVENT:/i.test(msg);

        if (logInfo) setLastLoggedActivity(logInfo.activityKey);

        // Add LogCard to chat immediately — visible the moment user lands
        const ts = Date.now();
        const immediateMsg: ChatMessage = {
            id: `pending_${ts}`,
            role: 'user',
            text: msg.trim(),
            timestamp: ts,
        };
        setMessages(prev => [...prev, immediateMsg]);
        setFollowUpChips(getFollowUpChips(msg.trim()));

        if (isUIEvent && logInfo) {
            // ── DIRECT LOG PATH: save immediately, skip Bodhi tool roundtrip ──
            const activityName = extractActivityName(msg);
            const verdict = getSimpleLogVerdict(activityName);
            const istTime = getIstTimeStr();

            // Instant toast + session strip update
            setLogToast({ id: `direct_${ts}`, activity: activityName, verdict });
            const entry = { name: activityName, verdict, timestamp: ts };
            setSessionLoggedActivities(prev => [...prev, entry]);
            setLoggedActivities(prev => {
                if (prev.some(a => a.name.toLowerCase() === activityName.toLowerCase())) return prev;
                return [...prev, entry];
            });

            // Persist to localStorage immediately (sync)
            saveUnifiedLog(activityName, verdict);

            // Best-effort Firestore save (non-blocking, uses uidRef to avoid race)
            if (uidRef.current) {
                directSaveActivityToFirestore(uidRef.current, activityName, verdict);
            }

            // Tell Bodhi it's already saved — skip tool, just react warmly
            const verdictCtx: Record<LogVerdict, string> = {
                early:     'logged EARLY — celebrate this discipline with high energy',
                on_time:   'logged on time — affirm the perfect flow with warm energy',
                late:      'logged a bit late — warm non-judgmental acknowledgment + gentle nudge',
                very_late: 'logged very late — warm concern + 1-line micro fix, never lecture',
            };
            const nextPractice = getAyurvedicNext(activityName);
            const nextLine = nextPractice
                ? `SENTENCE 2 MUST be: invite them to do the EXACT next Ayurvedic practice — "${nextPractice}" — right now. Do NOT make up a different next step.`
                : 'Sentence 2: give one specific micro-action relevant to what they just did.';
            const bodhiMsg = `SYSTEM_LOG_CONFIRMED: "${activityName}" has been automatically saved at ${istTime}. DO NOT call log_activity — already done. IMMEDIATELY give exactly 2 warm Hinglish sentences. Timing context: ${verdictCtx[verdict]}. ${nextLine} Sound like their brilliant best friend, not a system.`;
            setTimeout(() => bodhiSend(bodhiMsg), 350);
        } else {
            // Regular message (non-log event): send to Bodhi as-is
            setTimeout(() => bodhiSend(msg), 600);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingMessage, chatState]);

    // Instant scroll when history first loads (no visible scroll animation)
    useEffect(() => {
        if (historyLoaded) {
            chatEndRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
        }
    }, [historyLoaded]);

    // Smooth scroll for new messages only
    useEffect(() => {
        if (!historyLoaded) return;
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]); // eslint-disable-line react-hooks/exhaustive-deps

    // Cleanup on unmount
    useEffect(() => () => { disconnect(); stopVoiceInput(); }, [disconnect, stopVoiceInput]);

    // Keyboard shortcuts - handleSubmit logic inlined to avoid dependency cycle
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                const t = inputValue.trim();
                if (t && !isThinking) {
                    const userMsg: ChatMessage = { id: `u_${Date.now()}`, role: 'user', text: t, timestamp: Date.now() };
                    setMessages(prev => [...prev, userMsg]);
                    setInputValue('');
                    bodhiSend(t);
                }
            }
            if (e.key === 'Escape') {
                if (inputValue) { setInputValue(''); inputRef.current?.focus(); }
                else if (isListening) stopVoiceInput();
            }
            if (e.ctrlKey || e.metaKey) setKeyboardHint(true);
        };
        const handleKeyUp = (e: KeyboardEvent) => { if (!e.ctrlKey && !e.metaKey) setKeyboardHint(false); };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
    }, [inputValue, isThinking, isListening, bodhiSend]);

    // State labels and constants (moved after all hook definitions)
    const stateLabel = chatState === 'connecting' ? '◎ Connecting…' : isThinking ? '◎ Thinking…' : isSpeaking ? '♪ Speaking' : isConnected ? '● Ready' : '○ Offline';
    const stateColor = chatState === 'connecting' ? '#818cf8' : isThinking ? '#818cf8' : isSpeaking ? '#fbbf24' : isConnected ? '#4ade80' : 'rgba(255,255,255,0.35)';
    const bottomNavClearance = 72;

    return (
        <>
            {/* Log Story Toast — fires when Bodhi logs an activity */}
            <AnimatePresence>
                {logToast && (
                    <LogStoryToast
                        key={logToast.id}
                        activity={logToast.activity}
                        verdict={logToast.verdict}
                        onDone={() => setLogToast(null)}
                    />
                )}
            </AnimatePresence>

            <div style={{
                position: 'fixed',
                inset: 0,
                zIndex: -1,
                background: 'linear-gradient(160deg, rgba(4,2,16,0.98) 0%, rgba(8,4,24,0.97) 40%, rgba(6,3,18,0.98) 100%)'
            }} />
            <AnimatedBackground chatState={chatState} />

            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '100dvh', zIndex: 1, display: 'flex', flexDirection: 'column', maxWidth: 700, margin: '0 auto' }}>

                {/* Header */}
                <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                    style={{ flexShrink: 0, display: 'flex', alignItems: 'center', padding: 'max(44px, calc(env(safe-area-inset-top) + 10px)) 12px 10px', gap: '0.5rem', background: 'linear-gradient(180deg, rgba(4,2,16,0.95) 0%, rgba(6,3,18,0.65) 70%, transparent 100%)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', position: 'relative', zIndex: 10 }}>
                    <motion.button whileTap={{ scale: 0.88 }} onClick={() => { disconnect(); router.push('/'); }}
                        style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.75)' }}>
                        <ArrowLeft size={16} />
                    </motion.button>
                    <BodhiMiniOrb thinking={isThinking} speaking={isSpeaking} />
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        <span style={{ fontSize: 'clamp(0.9rem, 4vw, 1.05rem)', fontWeight: 800, fontFamily: "'Outfit', sans-serif", background: 'linear-gradient(120deg, #ffffff 0%, #fde68a 50%, #c4b5fd 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Sakha Bodhi</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.06rem' }}>
                            <span style={{ fontSize: 'clamp(0.42rem, 1.8vw, 0.50rem)', color: stateColor, fontWeight: 700, letterSpacing: '0.06em', transition: 'color 0.3s', whiteSpace: 'nowrap' }}>{stateLabel}</span>
                            <span style={{ fontSize: 'clamp(0.38rem, 1.6vw, 0.45rem)', color: 'rgba(167,139,250,0.65)', whiteSpace: 'nowrap' }}>Always here to enhance your life ✦</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                        {pendingCount > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.18rem', background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.22)', borderRadius: 999, padding: '0.20rem 0.4rem' }}>
                                <CheckCircle2 size={9} style={{ color: '#fbbf24' }} />
                                <span style={{ fontSize: 'clamp(0.38rem, 1.5vw, 0.46rem)', color: 'rgba(251,191,36,0.85)', fontWeight: 700, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{pendingCount}</span>
                            </div>
                        )}
                        <motion.button whileTap={{ scale: 0.90 }} onClick={() => router.push('/vedic-planner')}
                            style={{ fontSize: '0.46rem', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', background: 'rgba(129,140,248,0.10)', border: '1px solid rgba(129,140,248,0.24)', borderRadius: 999, padding: '0.28rem 0.60rem', color: 'rgba(129,140,248,0.85)', cursor: 'pointer', fontFamily: 'inherit' }}>
                            Planner ↗
                        </motion.button>
                    </div>
                </motion.header>

                {/* Chat area */}
                <div className="bodhi-chat-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0.5rem 0.75rem 0.65rem', scrollbarWidth: 'none' }}>
                    <style>{`.bodhi-chat-scroll::-webkit-scrollbar{display:none}`}</style>

                    {messages.length === 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 240, gap: '0.8rem', textAlign: 'center', padding: '2rem' }}>
                            <motion.div animate={{ scale: [1, 1.07, 1], opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 3, repeat: Infinity }}>
                                <BodhiMiniOrb thinking={false} speaking={false} />
                            </motion.div>
                            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.32)', fontStyle: 'italic', fontFamily: "'Outfit', sans-serif", lineHeight: 1.6 }}>
                                {chatState === 'connecting' ? 'Bodhi se jud raha hoon…' : chatState === 'error' ? 'Connection mein takleef — retry karein' : 'बोधि सुनने के लिए तैयार है…'}
                            </p>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                <Sparkles size={12} style={{ color: 'rgba(251,191,36,0.50)' }} />
                                <span style={{ fontSize: '0.60rem', color: 'rgba(255,255,255,0.40)', fontFamily: "'Outfit', sans-serif" }}>
                                    Try: Voice input, Ctrl+Enter to send, Esc to clear
                                </span>
                            </motion.div>
                        </motion.div>
                    )}

                    <AnimatePresence initial={false}>
                        {messages.map(msg => <ChatBubble key={msg.id} msg={msg} uid={uid} userName={displayName} />)}
                    </AnimatePresence>

                    <AnimatePresence>
                        {isThinking && (
                            <motion.div key="thinking" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '0.55rem', padding: '0 0.25rem' }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginRight: 8, marginTop: 2, background: 'radial-gradient(circle at 35% 30%, rgba(251,191,36,0.35) 0%, rgba(129,140,248,0.25) 60%, transparent 100%)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>✦</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(129,140,248,0.07)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(129,140,248,0.18)', borderRadius: '4px 18px 18px 18px', padding: '0.60rem 1rem' }}>
                                    {[0, 0.18, 0.36].map((d, i) => (
                                        <motion.div key={i} animate={{ y: [0, -5, 0] }} transition={{ duration: 0.7, repeat: Infinity, delay: d }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8' }} />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div ref={chatEndRef} style={{ height: 8 }} />
                </div>

                {/* Input bar */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
                    style={{ flexShrink: 0, padding: `0.6rem 0.75rem calc(${bottomNavClearance}px + 0.75rem + env(safe-area-inset-bottom))`, background: 'linear-gradient(0deg, rgba(4,2,16,0.96) 0%, rgba(6,3,18,0.72) 70%, transparent 100%)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>

                    {/* Keyboard shortcut hint */}
                    <AnimatePresence>
                        {keyboardHint && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                style={{
                                    position: 'absolute',
                                    top: -24,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: 999,
                                    padding: '4px 12px',
                                    fontSize: '0.40rem',
                                    color: 'rgba(255,255,255,0.50)',
                                    fontFamily: 'monospace',
                                    letterSpacing: '0.05em',
                                    zIndex: 20,
                                }}
                            >
                                Ctrl+Enter to send • Esc to clear
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Emoji picker panel */}
                    <AnimatePresence>
                        {showEmoji && (
                            <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }} transition={{ duration: 0.18 }}
                                style={{ marginBottom: '0.45rem', padding: '0.55rem 0.65rem', background: 'rgba(8,4,24,0.96)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 16, backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', display: 'flex', flexWrap: 'wrap' as const, gap: '0.3rem', maxHeight: 140, overflowY: 'auto' as const }}>
                                {['😊', '😄', '🙏', '❤️', '🔥', '✨', '💫', '🌟', '🌙', '☀️', '🎯', '💡', '⚡', '🧘', '🕉️', '🪷', '🌸', '🌺', '🍃', '🌿', '🌊', '🏔️', '🦋', '🦚', '💎', '👑', '🎵', '🎶', '🤩', '😍', '😂', '😭', '🥰', '😎', '🤔', '🙌', '👏', '💪', '🤝', '🫂', '🌈', '🎊', '🎉', '🥳', '💯', '✅', '🚀', '🌏', '🕊️', '🐉', '🦁'].map(em => (
                                    <motion.button key={em} whileTap={{ scale: 0.80 }} onClick={() => { setInputValue(p => p + em); setShowEmoji(false); inputRef.current?.focus(); }}
                                        style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1rem' }}>
                                        {em}
                                    </motion.button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(28px) saturate(180%)', WebkitBackdropFilter: 'blur(28px) saturate(180%)', border: isTypingFocus ? '1px solid rgba(251,191,36,0.38)' : '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '0.38rem 0.55rem 0.38rem 1rem', boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.18), 0 4px 24px rgba(0,0,0,0.22)', transition: 'border-color 0.3s', overflow: 'visible' }}>
                        {/* Emoji toggle */}
                        <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowEmoji(v => !v)}
                            style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', background: showEmoji ? 'rgba(251,191,36,0.14)' : 'transparent', border: showEmoji ? '1px solid rgba(251,191,36,0.30)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: showEmoji ? '#fbbf24' : 'rgba(255,255,255,0.38)', transition: 'all 0.2s', fontSize: '1rem' }}>
                            😊
                        </motion.button>
                        {/* Voice input button */}
                        <VoiceInputButton
                            isListening={isListening}
                            onStart={startVoiceInput}
                            onStop={stopVoiceInput}
                            disabled={isThinking}
                        />

                        <input ref={inputRef} type="text" value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey && !isThinking) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                            onFocus={() => setIsTypingFocus(true)}
                            onBlur={() => setIsTypingFocus(false)}
                            disabled={isThinking || isListening}
                            placeholder={
                                isListening
                                    ? (lang === 'en' ? 'Listening... speak now' : 'सुन रहा हूँ... बोलिए') :
                                    chatState === 'connecting' ? 'Bodhi jud raha hai…' :
                                        isThinking ? 'Bodhi soch raha hai…' :
                                            isSpeaking ? 'Bodhi bol raha hai…' :
                                                (lang === 'en' ? 'Task, idea, challenge, or anything…' : 'कार्य, विचार, चुनौती या कुछ भी लिखें…')
                            }
                            style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: isListening ? '#fbbf24' : 'rgba(255,255,255,0.90)', fontSize: '0.88rem', fontWeight: 300, fontFamily: "'Outfit', sans-serif", letterSpacing: '0.01em' }}
                        />
                        <motion.button whileTap={{ scale: 0.88 }} onClick={handleSubmit} disabled={!inputValue.trim() || isThinking || isListening}
                            style={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', background: inputValue.trim() && !isThinking && !isListening ? 'linear-gradient(135deg, rgba(251,191,36,0.32), rgba(217,119,6,0.22))' : 'rgba(255,255,255,0.09)', border: inputValue.trim() && !isThinking && !isListening ? '1px solid rgba(251,191,36,0.42)' : '1px solid rgba(255,255,255,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: inputValue.trim() && !isThinking && !isListening ? 'pointer' : 'default', color: inputValue.trim() && !isThinking && !isListening ? '#fbbf24' : 'rgba(255,255,255,0.50)', transition: 'all 0.25s' }}>
                            <Send size={15} />
                        </motion.button>
                    </div>

                    {/* Bodhi follow-up chips — appear when a UI_EVENT log needs detail */}
                    <AnimatePresence>
                        {followUpChips && followUpChips.length > 0 && (
                            <motion.div
                                key="follow-up-chips"
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                transition={{ duration: 0.18 }}
                                style={{ marginBottom: '0.35rem' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.28rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <motion.span animate={{ scale: [1, 1.18, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} style={{ fontSize: '0.82rem', lineHeight: 1 }}>🤔</motion.span>
                                        <span style={{ fontSize: '0.44rem', color: 'rgba(251,191,36,0.92)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif", textShadow: '0 0 10px rgba(251,191,36,0.35)' }}>Bodhi asks</span>
                                    </div>
                                    <motion.button whileTap={{ scale: 0.82 }} onClick={() => setFollowUpChips(null)} style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.40)', fontSize: '0.55rem', flexShrink: 0 }}>✕</motion.button>
                                </div>
                                <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
                                    <style>{`.followchips::-webkit-scrollbar{display:none}`}</style>
                                    {followUpChips.map((chip, i) => (
                                        <motion.button
                                            key={chip.label}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.04 }}
                                            whileTap={{ scale: 0.86 }}
                                            onClick={() => { setFollowUpChips(null); sendMessage(chip.reply); }}
                                            disabled={isThinking}
                                            style={{
                                                flexShrink: 0,
                                                display: 'flex', alignItems: 'center', gap: 4,
                                                background: 'rgba(251,191,36,0.08)',
                                                border: '1px solid rgba(251,191,36,0.25)',
                                                borderRadius: 999,
                                                padding: '0.25rem 0.55rem 0.25rem 0.38rem',
                                                cursor: isThinking ? 'default' : 'pointer',
                                                opacity: isThinking ? 0.45 : 1,
                                                backdropFilter: 'blur(8px)',
                                            }}
                                        >
                                            <span style={{ fontSize: '0.76rem' }}>{chip.icon}</span>
                                            <span style={{ fontSize: '0.43rem', color: 'rgba(255,255,255,0.72)', fontWeight: 600, letterSpacing: '0.04em', whiteSpace: 'nowrap', fontFamily: "'Outfit', sans-serif" }}>{chip.label}</span>
                                        </motion.button>
                                    ))}
                                    <motion.button
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: followUpChips.length * 0.04 }}
                                        whileTap={{ scale: 0.86 }}
                                        onClick={() => setFollowUpChips(null)}
                                        style={{
                                            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
                                            background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.16)',
                                            borderRadius: 999, padding: '0.25rem 0.50rem',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <span style={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.32)', lineHeight: 1 }}>✏️</span>
                                        <span style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.32)', fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>type freely</span>
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Daily Story Strip — only this session's logged activities */}
                    <DailyStoryStrip activities={sessionLoggedActivities} />

                    {/* Smart context-aware chips — activity-specific after logging, time-based otherwise */}
                    <AnimatePresence mode="wait">
                        {lastLoggedActivity ? (
                            <motion.div
                                key={`activity_${lastLoggedActivity}`}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.20 }}
                                style={{ marginBottom: '0.30rem' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.22rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}>
                                            <Sparkles size={12} style={{ color: '#fbbf24', flexShrink: 0, filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.6))' }} />
                                        </motion.div>
                                        <span style={{ fontSize: '0.45rem', color: 'rgba(251,191,36,0.95)', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif", textShadow: '0 0 12px rgba(251,191,36,0.40)' }}>What&apos;s next?</span>
                                    </div>
                                    <motion.button whileTap={{ scale: 0.82 }} onClick={() => setLastLoggedActivity(null)} style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.40)', fontSize: '0.55rem', flexShrink: 0 }}>✕</motion.button>
                                </div>
                                <div style={{ display: 'flex', gap: '0.28rem', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
                                    {getActivitySpecificChips(lastLoggedActivity).map((chip, i) => (
                                        <motion.button
                                            key={chip.label}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            whileTap={{ scale: 0.86 }}
                                            onClick={() => { setLastLoggedActivity(null); sendMessage(chip.message); }}
                                            disabled={isThinking}
                                            style={{
                                                flexShrink: 0,
                                                display: 'flex', alignItems: 'center', gap: 5,
                                                background: 'rgba(251,191,36,0.09)',
                                                border: '1px solid rgba(251,191,36,0.28)',
                                                borderRadius: 999,
                                                padding: '0.25rem 0.60rem 0.25rem 0.40rem',
                                                cursor: isThinking ? 'default' : 'pointer',
                                                opacity: isThinking ? 0.45 : 1,
                                                backdropFilter: 'blur(8px)',
                                            }}
                                        >
                                            <span style={{ fontSize: '0.80rem' }}>{chip.icon}</span>
                                            <span style={{ fontSize: '0.43rem', color: 'rgba(255,255,255,0.80)', fontWeight: 600, letterSpacing: '0.04em', whiteSpace: 'nowrap', fontFamily: "'Outfit', sans-serif" }}>{chip.label}</span>
                                        </motion.button>
                                    ))}
                                    <motion.button
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.22 }}
                                        whileTap={{ scale: 0.86 }}
                                        onClick={() => setLastLoggedActivity(null)}
                                        style={{
                                            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3,
                                            background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)',
                                            borderRadius: 999, padding: '0.25rem 0.48rem',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <span style={{ fontSize: '0.50rem', color: 'rgba(255,255,255,0.28)', lineHeight: 1 }}>✕</span>
                                        <span style={{ fontSize: '0.40rem', color: 'rgba(255,255,255,0.28)', fontFamily: "'Outfit', sans-serif" }}>close</span>
                                    </motion.button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="contextual_chips"
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.18 }}
                                style={{ display: 'flex', gap: '0.28rem', overflowX: 'auto', scrollbarWidth: 'none', marginBottom: '0.30rem', paddingBottom: 2 }}
                            >
                                {getContextualLogChips().map((chip, idx) => {
                                    const CHIP_PALETTES = [
                                        { bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.28)', text: 'rgba(251,191,36,0.88)', glow: 'rgba(251,191,36,0.20)' },
                                        { bg: 'rgba(34,211,238,0.10)', border: 'rgba(34,211,238,0.28)', text: 'rgba(34,211,238,0.88)', glow: 'rgba(34,211,238,0.20)' },
                                        { bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.28)', text: 'rgba(167,139,250,0.88)', glow: 'rgba(167,139,250,0.20)' },
                                        { bg: 'rgba(74,222,128,0.10)', border: 'rgba(74,222,128,0.28)', text: 'rgba(74,222,128,0.88)', glow: 'rgba(74,222,128,0.20)' },
                                    ];
                                    const p = CHIP_PALETTES[idx % 4];
                                    return (
                                        <motion.button
                                            key={chip.label}
                                            initial={{ opacity: 0, x: -6 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05, type: 'spring', stiffness: 320, damping: 24 }}
                                            whileTap={{ scale: 0.86 }}
                                            onClick={() => sendMessage(chip.message)}
                                            disabled={isThinking}
                                            title={`Log: ${chip.label}`}
                                            style={{
                                                flexShrink: 0,
                                                display: 'flex', alignItems: 'center', gap: 5,
                                                background: p.bg,
                                                border: `1px solid ${p.border}`,
                                                borderRadius: 999,
                                                padding: '0.24rem 0.58rem 0.24rem 0.40rem',
                                                cursor: isThinking ? 'default' : 'pointer',
                                                opacity: isThinking ? 0.45 : 1,
                                                transition: 'all 0.2s',
                                                boxShadow: `0 0 10px ${p.glow}`,
                                            }}
                                        >
                                            <span style={{ fontSize: '0.82rem', filter: `drop-shadow(0 0 4px ${p.glow})` }}>{chip.icon}</span>
                                            <span style={{ fontSize: '0.43rem', color: p.text, fontWeight: 700, letterSpacing: '0.06em', whiteSpace: 'nowrap', fontFamily: "'Outfit', sans-serif" }}>{chip.label}</span>
                                        </motion.button>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── Quick Actions Row — collapses to icon in logging mode ── */}
                    <AnimatePresence mode="wait">
                        {showQuickActions ? (
                            <motion.div
                                key="quick-expanded"
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                transition={{ duration: 0.18 }}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.28rem', marginTop: '0.12rem', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}
                            >
                                <style>{`.qrow::-webkit-scrollbar{display:none}`}</style>
                                {([
                                    { icon: '✅', prompt: 'I need to ', title: 'Task', color: '#4ade80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.38)', glow: 'rgba(74,222,128,0.22)' },
                                    { icon: '💡', prompt: 'I have an idea: ', title: 'Idea', color: '#22d3ee', bg: 'rgba(34,211,238,0.12)', border: 'rgba(34,211,238,0.38)', glow: 'rgba(34,211,238,0.22)' },
                                    { icon: '⚡', prompt: "I'm facing: ", title: 'Challenge', color: '#fb923c', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.38)', glow: 'rgba(251,146,60,0.22)' },
                                    { icon: '🔥', prompt: "There's an issue: ", title: 'Issue', color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.38)', glow: 'rgba(248,113,113,0.22)' },
                                    { icon: '📋', prompt: 'What are my pending tasks?', title: 'Tasks', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.38)', glow: 'rgba(167,139,250,0.22)' },
                                ] as const).map((chip, idx) => {
                                    const isActive = activeQuickChip === chip.title;
                                    return (
                                        <motion.button
                                            key={chip.title}
                                            initial={{ opacity: 0, x: -6 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.04, type: 'spring', stiffness: 340, damping: 24 }}
                                            whileTap={{ scale: 0.84 }}
                                            onClick={() => {
                                                if (isActive) { setActiveQuickChip(null); setInputValue(''); }
                                                else { setActiveQuickChip(chip.title); setInputValue(chip.prompt); inputRef.current?.focus(); }
                                            }}
                                            title={chip.title}
                                            style={{
                                                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
                                                background: isActive ? chip.bg : 'rgba(255,255,255,0.05)',
                                                border: `1px solid ${isActive ? chip.border : 'rgba(255,255,255,0.10)'}`,
                                                borderRadius: 999,
                                                padding: '0.24rem 0.52rem 0.24rem 0.36rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.22s ease',
                                                boxShadow: isActive ? `0 0 16px ${chip.glow}, inset 0 1px 0 rgba(255,255,255,0.10)` : 'none',
                                            }}
                                        >
                                            <span style={{ fontSize: '0.84rem', filter: isActive ? `drop-shadow(0 0 5px ${chip.color}99)` : 'none', transition: 'filter 0.2s', lineHeight: 1 }}>{chip.icon}</span>
                                            <span style={{ fontSize: '0.43rem', color: isActive ? chip.color : 'rgba(255,255,255,0.52)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', whiteSpace: 'nowrap', fontFamily: "'Outfit', sans-serif", transition: 'color 0.22s' }}>{chip.title}</span>
                                            <AnimatePresence>
                                                {isActive && (
                                                    <motion.span initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.15 }} style={{ fontSize: '0.52rem', color: chip.color, lineHeight: 1, marginLeft: 1 }}>✕</motion.span>
                                                )}
                                            </AnimatePresence>
                                        </motion.button>
                                    );
                                })}
                                <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.10)', flexShrink: 0, margin: '0 0.08rem' }} />
                                <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowMoodPicker(p => !p)}
                                    style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, background: showMoodPicker || selectedMoodEmoji ? 'rgba(167,139,250,0.10)' : 'rgba(255,255,255,0.05)', border: `1px solid ${showMoodPicker || selectedMoodEmoji ? 'rgba(167,139,250,0.35)' : 'rgba(255,255,255,0.09)'}`, borderRadius: 999, padding: '0.24rem 0.55rem', cursor: 'pointer', transition: 'all 0.22s', boxShadow: showMoodPicker ? '0 0 14px rgba(167,139,250,0.28)' : 'none' }}>
                                    <span style={{ fontSize: '0.84rem', lineHeight: 1 }}>{selectedMoodEmoji || '😊'}</span>
                                    <span style={{ fontSize: '0.43rem', color: showMoodPicker || selectedMoodEmoji ? 'rgba(167,139,250,0.92)' : 'rgba(255,255,255,0.50)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', whiteSpace: 'nowrap', fontFamily: "'Outfit', sans-serif", transition: 'color 0.22s' }}>{selectedMoodLabel || 'Mood'}</span>
                                    <motion.span animate={{ rotate: showMoodPicker ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ fontSize: '0.44rem', color: showMoodPicker ? 'rgba(167,139,250,0.72)' : 'rgba(255,255,255,0.32)', display: 'inline-block' }}>▾</motion.span>
                                </motion.button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="quick-collapsed"
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                transition={{ duration: 0.18 }}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.28rem', marginTop: '0.12rem', paddingBottom: 2 }}
                            >
                                <motion.button
                                    whileTap={{ scale: 0.88 }}
                                    onClick={() => setShowQuickActions(true)}
                                    title="Show task actions"
                                    style={{
                                        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        borderRadius: 999,
                                        padding: '0.24rem 0.55rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <MoreHorizontal size={13} style={{ color: 'rgba(255,255,255,0.40)' }} />
                                    <span style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.40)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', whiteSpace: 'nowrap', fontFamily: "'Outfit', sans-serif" }}>Tasks & Actions</span>
                                </motion.button>
                                <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowMoodPicker(p => !p)}
                                    style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, background: showMoodPicker || selectedMoodEmoji ? 'rgba(167,139,250,0.10)' : 'rgba(255,255,255,0.05)', border: `1px solid ${showMoodPicker || selectedMoodEmoji ? 'rgba(167,139,250,0.35)' : 'rgba(255,255,255,0.09)'}`, borderRadius: 999, padding: '0.24rem 0.55rem', cursor: 'pointer', transition: 'all 0.22s', boxShadow: showMoodPicker ? '0 0 14px rgba(167,139,250,0.28)' : 'none' }}>
                                    <span style={{ fontSize: '0.84rem', lineHeight: 1 }}>{selectedMoodEmoji || '😊'}</span>
                                    <span style={{ fontSize: '0.43rem', color: showMoodPicker || selectedMoodEmoji ? 'rgba(167,139,250,0.92)' : 'rgba(255,255,255,0.50)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', whiteSpace: 'nowrap', fontFamily: "'Outfit', sans-serif", transition: 'color 0.22s' }}>{selectedMoodLabel || 'Mood'}</span>
                                    <motion.span animate={{ rotate: showMoodPicker ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ fontSize: '0.44rem', color: showMoodPicker ? 'rgba(167,139,250,0.72)' : 'rgba(255,255,255,0.32)', display: 'inline-block' }}>▾</motion.span>
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Expandable mood picker */}
                    <AnimatePresence>
                        {showMoodPicker && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
                                <div style={{ display: 'flex', gap: '0.28rem', paddingTop: '0.40rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
                                    {MOOD_EMOJIS.map(m => (
                                        <motion.button key={m.emoji} whileTap={{ scale: 0.82 }}
                                            animate={{ scale: selectedMoodEmoji === m.emoji ? 1.14 : 1 }}
                                            transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                                            onClick={(e) => { e.stopPropagation(); handleMoodSelect(m.emoji, m.label, m.mood); setShowMoodPicker(false); }}
                                            title={m.label}
                                            style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: selectedMoodEmoji === m.emoji ? `${m.color}28` : 'rgba(255,255,255,0.05)', border: selectedMoodEmoji === m.emoji ? `1.5px solid ${m.color}80` : '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.05rem', boxShadow: selectedMoodEmoji === m.emoji ? `0 0 10px ${m.color}55` : 'none' }}>
                                            {m.emoji}
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <p style={{ textAlign: 'center', margin: '0.32rem 0 0', fontSize: '0.43rem', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>
                        ✦ Bodhi · Gemini Live Audio · Text + Voice ✦
                    </p>
                </motion.div>
            </div>
        </>
    );
}
