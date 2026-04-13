'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Sunrise, Sun, Sunset, Moon, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { bodhiSpeakLog, bodhiSpeakAllDone } from '@/lib/bodhiVoice';
import type { TimeSlot } from '@/lib/bodhiVoice';
import {
  findHabitWindow,
  getTimingStatus as getHabitWindowTimingStatus,
  getISTTimeStr, getISODateIST, updateLateStreak,
} from '@/lib/habitWindows';
import { getMorningMood } from '@/components/MoodGarden/MorningMoodCards';
import { useOneSutraAuth } from '@/hooks/useOneSutraAuth';
import { useLifestyleStore } from '@/stores/lifestyleStore';
import { logHabitAndSync } from '@/hooks/useLifestyleEngine';

// ─── Read Ayurvedic context from localStorage ────────────────────────────────
function getLocalContext(habitId: string): { prakriti: string; vikriti: string; habitStreak: number } {
  try {
    const dosha = JSON.parse(localStorage.getItem('onesutra_dosha_v1') ?? '{}');
    const prakriti: string =
      dosha?.prakritiAssessment?.prakriti?.combo ??
      dosha?.prakritiAssessment?.prakriti?.primary ?? '';
    const vikriti: string = dosha?.vikritiiAssessment?.vikriti?.primary ?? '';
    const lifestyle = JSON.parse(localStorage.getItem('onesutra_lifestyle_v2') ?? '{}');
    const habitStreak: number = lifestyle?.streaks?.[habitId]?.currentStreak ?? 0;
    return { prakriti, vikriti, habitStreak };
  } catch { return { prakriti: '', vikriti: '', habitStreak: 0 }; }
}

function getLocalUserName(): string {
  try {
    const auth = JSON.parse(localStorage.getItem('onesutra_auth_v1') ?? '{}');
    if (auth?.name && auth.name !== 'Traveller') return auth.name.split(' ')[0];
  } catch { /* */ }
  return (typeof localStorage !== 'undefined' ? localStorage.getItem('vedic_user_name') : null) ?? 'friend';
}

// ─── Static bubble ID → lifestyle-store h_* habit ID ────────────────────────
// Used bidirectionally: hide bubble when h_* is done; write h_* when bubble tapped
const SMARTLOG_TO_H_ID: Record<string, string> = {
    wake:                 'h_wake_early',
    warm_water:           'h_warm_water',
    tongue_scrape:        'h_tongue_scraping',
    breathwork:           'h_pranayama',
    bath:                 'h_bathing',
    morning_light:        'h_morning_sunlight',
    breakfast:            'h_breakfast',
    sleep:                'h_sleep_early',
    gratitude:            'h_gratitude',
    hydration:            'h_water',
    h_walk:               'h_walk',
    h_evening_meditation: 'h_evening_meditation',
    h_digital_sunset:     'h_digital_sunset',
    h_brain_dump:         'h_brain_dump',
    dinner:               'h_sleep_early',
    lunch:                'h_breakfast',
};
// Reverse map: lifestyle-store h_* ID → static bubble ID
// Used to sync loggedToday when the store is updated from Firestore
const H_ID_TO_SMARTLOG: Record<string, string> = {
    h_wake_early: 'wake', h_warm_water: 'warm_water', h_tongue_scraping: 'tongue_scrape',
    h_pranayama: 'breathwork', h_bathing: 'bath', h_morning_sunlight: 'morning_light',
    h_breakfast: 'breakfast', h_sleep_early: 'sleep', h_gratitude: 'gratitude',
    h_water: 'hydration', h_walk: 'h_walk', h_evening_meditation: 'h_evening_meditation',
    h_digital_sunset: 'h_digital_sunset', h_brain_dump: 'h_brain_dump',
};

// ─── Order Enforcement ────────────────────────────────────────────────────────
const MORNING_ORDER = ['wake', 'warm_water', 'tongue_scrape', 'breathwork', 'bath', 'morning_light', 'breakfast'];
const LOG_STORE_KEY = 'onesutra_smartlog_v2';
const LIFESTYLE_STORE_KEY = 'onesutra_lifestyle_v2';

function getTodayStr() { return new Date().toISOString().split('T')[0]; }

function getLoggedToday(): Set<string> {
    try {
        const raw = JSON.parse(localStorage.getItem(LOG_STORE_KEY) ?? '{}');
        return new Set(raw[getTodayStr()] ?? []);
    } catch { return new Set(); }
}

function saveLoggedToday(ids: Set<string>) {
    try {
        const raw = JSON.parse(localStorage.getItem(LOG_STORE_KEY) ?? '{}');
        raw[getTodayStr()] = [...ids];
        localStorage.setItem(LOG_STORE_KEY, JSON.stringify(raw));
    } catch { /* ignore */ }
}

// ─── Daily Log Story store ────────────────────────────────────────────────────
const DAILY_LOG_STORY_KEY = 'onesutra_daily_log_story_v1';

export interface DailyLogEntry {
    id: string;
    icon: string;
    label: string;
    color: string;
    loggedAt: number; // unix ms
    date: string;     // YYYY-MM-DD
}

export function saveToDailyLogStory(id: string, icon: string, label: string, color: string): void {
    try {
        const today = getTodayStr();
        const raw: DailyLogEntry[] = JSON.parse(localStorage.getItem(DAILY_LOG_STORY_KEY) ?? '[]');
        const filtered = raw.filter(e => e.date === today && e.id !== id);
        filtered.push({ id, icon, label, color, loggedAt: Date.now(), date: today });
        localStorage.setItem(DAILY_LOG_STORY_KEY, JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent('daily-log-story-updated'));
    } catch { /* ignore */ }
}

export function getTodayLogStory(): DailyLogEntry[] {
    try {
        const today = getTodayStr();
        const raw: DailyLogEntry[] = JSON.parse(localStorage.getItem(DAILY_LOG_STORY_KEY) ?? '[]');
        return raw.filter(e => e.date === today).sort((a, b) => a.loggedAt - b.loggedAt);
    } catch { return []; }
}

// ─── Pull completed habit IDs from the lifestyle store ───────────────────────
function getCompletedHabitIds(): Set<string> {
    try {
        const raw = JSON.parse(localStorage.getItem(LIFESTYLE_STORE_KEY) ?? '{}');
        const today = getTodayStr();
        const logs: Array<{ habitId: string; date: string; completed: boolean }> = raw.habitLogs ?? [];
        return new Set(
            logs.filter(l => l.date === today && l.completed).map(l => l.habitId)
        );
    } catch { return new Set(); }
}

// ─── Read active habits from the lifestyle store ─────────────────────────────
interface StoredHabit {
    id: string;
    name: string;
    icon: string;
    category?: string;
    lifeArea?: string;
    scheduledTime?: string;
}

function getActiveHabits(): StoredHabit[] {
    try {
        const raw = JSON.parse(localStorage.getItem(LIFESTYLE_STORE_KEY) ?? '{}');
        return (raw.habits ?? []).filter((h: StoredHabit & { isActive?: boolean }) => h.isActive !== false);
    } catch { return []; }
}

// ─── Current time slot ────────────────────────────────────────────────────────
function getCurrentTimeSlot(): TimeSlot {
    const h = new Date().getHours();
    if (h >= 2 && h < 6) return 'pre-dawn';
    if (h >= 6 && h < 11) return 'morning';
    if (h >= 11 && h < 15) return 'midday';
    if (h >= 15 && h < 18) return 'afternoon';
    if (h >= 18 && h < 22) return 'evening';
    return 'night';
}

// ─── Check if log is in its ideal time slot ───────────────────────────────────
function isOnTimeForSlot(bubbleId: string, slot: TimeSlot): boolean {
    const morningIds = new Set(['wake', 'warm_water', 'tongue_scrape', 'bath', 'breakfast', 'breathwork', 'morning_light']);
    const middayIds = new Set(['lunch', 'deep_work', 'screen_break', 'hydration']);
    const eveningIds = new Set(['h_walk', 'h_evening_meditation', 'dinner', 'h_digital_sunset', 'h_brain_dump']);
    const nightIds = new Set(['sleep', 'gratitude', 'dinner_night', 'read']);
    if (slot === 'morning' || slot === 'pre-dawn') return morningIds.has(bubbleId);
    if (slot === 'midday') return middayIds.has(bubbleId);
    if (slot === 'evening' || slot === 'afternoon') return eveningIds.has(bubbleId);
    if (slot === 'night') return nightIds.has(bubbleId);
    return true;
}

// ─── Timing Status Engine ─────────────────────────────────────────────────────
export type TimingStatus = 'ON_TIME' | 'ACCEPTABLE' | 'LATE' | 'VERY_LATE';

const TIMING_WINDOWS: Record<string, { ideal: [number, number]; late: [number, number] }> = {
    warm_water: { ideal: [4, 7], late: [7, 9] },
    tongue_scrape: { ideal: [4, 8], late: [8, 10] },
    breathwork: { ideal: [4, 8], late: [8, 10] },
    bath: { ideal: [4, 8], late: [8, 10] },
    morning_light: { ideal: [6, 8], late: [8, 10] },
    breakfast: { ideal: [7, 9], late: [9, 11] },
    lunch: { ideal: [12, 13], late: [13, 15] },
    h_walk: { ideal: [17, 19], late: [19, 21] },
    h_evening_meditation: { ideal: [18, 20], late: [20, 22] },
    dinner: { ideal: [18, 20], late: [20, 22] },
    dinner_night: { ideal: [18, 20], late: [20, 22] },
    h_digital_sunset: { ideal: [20, 21], late: [21, 23] },
    h_brain_dump: { ideal: [19, 21], late: [21, 23] },
    sleep: { ideal: [21, 22], late: [22, 24] },
    gratitude: { ideal: [20, 22], late: [22, 24] },
    read: { ideal: [20, 22], late: [22, 24] },
};

export function getTimingStatus(bubbleId: string): TimingStatus {
    const now = new Date();
    const hDec = now.getHours() + now.getMinutes() / 60;
    const w = TIMING_WINDOWS[bubbleId];
    if (!w) return 'ON_TIME';
    const [is, ie] = w.ideal;
    const [, le] = w.late;
    if (hDec >= is && hDec <= ie + 1) return 'ON_TIME';
    const diff = hDec - ie;
    if (diff <= 1) return 'ACCEPTABLE';
    if (hDec <= le) return 'LATE';
    return 'VERY_LATE';
}

// ─── Inline Insight Snippets ──────────────────────────────────────────────────
export const INSIGHT_SNIPPETS: Record<string, string> = {
    wake: 'Circadian rhythm set — aligned with Brahma Muhurta.',
    warm_water: 'Agni kindled — overnight Ama moving out.',
    tongue_scrape: 'Ama from last night — gone. Organ reflex points activated.',
    breathwork: 'Prana calibrated. Nervous system got its morning reset.',
    bath: 'Tamas lifted before the world asks anything of you.',
    morning_light: 'Surya Shakti absorbed — circadian rhythm anchored.',
    breakfast: 'Agni fed at the right time — energy has a foundation.',
    lunch: 'Pitta peak honoured — food converts to Ojas now.',
    deep_work: 'Pitta intellect harnessed — sharpest focus window.',
    screen_break: 'Alochaka Pitta rested — eye prana restored.',
    hydration: 'Prana flows with water — every cell grateful.',
    h_walk: 'Sandhya walk done — Vata grounded, digestion aided, Ojas building.',
    h_evening_meditation: 'Sandhya complete — day released into stillness, mind prepared for rest.',
    dinner: 'Light evening meal — Ojas protected for deep sleep.',
    dinner_night: 'Sattvic dinner — final act of self-love tonight.',
    h_digital_sunset: 'Melatonin protected — sleep architecture intact.',
    h_brain_dump: 'Svadhyaya complete — mind emptied, tomorrow clearer.',
    sleep: 'Pitta gets its full repair window. Cellular clock grateful.',
    gratitude: 'Santosha practice — gratitude rewires the brain toward joy.',
    read: 'Dreaming mind integrates wisdom — feed it light.',
};

const TIMING_NUDGES: Record<string, string> = {
    warm_water: 'First sip within 5 min of waking tomorrow.',
    tongue_scrape: 'Before any food or water tomorrow keeps Ama clear.',
    breathwork: 'Before 8 AM tomorrow — Prana sets the whole day.',
    bath: 'Earlier tomorrow shifts the whole morning. 🙏',
    morning_light: 'Within 1 hr of sunrise tomorrow — circadian magic.',
    breakfast: '7–9 AM tomorrow — Agni peak honoured.',
    sleep: 'Before 10 PM tonight — Pitta repair window open. 🙏',
    lunch: '12–1 PM tomorrow — Pitta peak for best digestion.',
};

function getTimingAck(status: TimingStatus, label: string): string {
    if (status === 'ON_TIME') return `${label} ✅`;
    if (status === 'ACCEPTABLE') return `${label} done`;
    if (status === 'LATE') return `${label} done`;
    return `Better late —`;
}

function getInsight(id: string): string {
    return INSIGHT_SNIPPETS[id] ?? 'Every act of self-care is a vote for who you are becoming.';
}

function getNudge(id: string): string | null {
    return TIMING_NUDGES[id] ?? null;
}

// ─── IDs that are already in the static bubble lists (don't duplicate) ───────
// Includes both the static bubble IDs AND the matching lifestyle-store habit IDs
// so that dynamic habit bubbles never repeat what static bubbles already show.
const STATIC_BUBBLE_IDS = new Set([
    // Static bubble IDs
    'wake', 'warm_water', 'tongue_scrape', 'bath', 'breakfast', 'breathwork', 'morning_light',
    'lunch', 'deep_work', 'screen_break', 'hydration',
    'h_walk', 'h_evening_meditation', 'dinner', 'h_digital_sunset', 'h_brain_dump',
    'sleep', 'gratitude', 'dinner_night', 'read',
    // Lifestyle-store habit IDs that duplicate the above static bubbles
    'h_wake_early',          // = 'wake'       Rise & Shine
    'h_warm_water',          // = 'warm_water'  Warm Water Ritual
    'h_tongue_scraping',     // = 'tongue_scrape' Tongue Clean
    'h_pranayama',           // = 'breathwork'  Pranayama
    'h_morning_meditation',  // = 'breathwork'  Morning Meditation
    'h_bathing',             // = 'bath'        Morning Bath / Bath & Recharge
    'h_morning_sunlight',    // = 'morning_light' Morning Sun
    'h_breakfast',           // = 'breakfast'   Mindful Breakfast
    'h_sleep_early',         // = 'sleep'       Sleep by 10 PM
    'h_digital_detox',       // = 'h_digital_sunset' Screen Detox
    'h_water',               // = 'hydration'   Hydration
    'h_gratitude',           // = 'gratitude'   Gratitude Log
    'h_noon_checkin',        // = 'screen_break' Noon Mindfulness
]);

// ─── Map lifestyle category → time slot ──────────────────────────────────────
function habitTimeSlot(category?: string): 'morning' | 'midday' | 'evening' | 'night' | 'anytime' {
    if (!category || category === 'anytime') return 'anytime';
    if (category === 'morning' || category === 'sacred') return 'morning';
    if (category === 'midday') return 'midday';
    if (category === 'evening') return 'evening';
    if (category === 'night') return 'night';
    return 'anytime';
}

// ─── Accent colors for dynamic habit bubbles ─────────────────────────────────
const LIFE_AREA_COLORS: Record<string, string> = {
    mental: '#22d3ee', physical: '#4ade80', social: '#fb923c',
    professional: '#fbbf24', financial: '#a78bfa', spiritual: '#c084fc',
    creative: '#f472b6', sacred: '#fde68a',
};

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
    isDynamic?: boolean;
    isAnytime?: boolean;
};

// ─── Time-contextual bubble data ──────────────────────────────────────────────
const MORNING_BUBBLES: LogBubble[] = [
    {
        id: 'wake', icon: '🌅', label: 'Wake Before 6am', sublabel: 'Wake-up ritual', color: '#fbbf24',
        logMessage: 'I woke up this morning [UI_EVENT: MORNING_LOGS_CLICKED]',
        subOptions: [
            { icon: '⚡', label: 'Energized & fresh', detail: 'woke up feeling energized and completely fresh' },
            { icon: '😌', label: 'Calm & rested', detail: 'woke up calm and well-rested today' },
            { icon: '🌿', label: 'Slow & gentle', detail: 'woke up slowly, easing into the morning' },
            { icon: '😴', label: 'Groggy but up', detail: 'woke up groggy but got myself out of bed' },
        ],
    },
    {
        id: 'warm_water', icon: '🫗', label: 'Warm Water Ritual', sublabel: 'Ushapana · First sip', color: '#7dd3fc',
        logMessage: 'I drank warm water first thing this morning [UI_EVENT: MORNING_LOGS_CLICKED]',
        subOptions: [
            { icon: '🍋', label: 'Warm lemon water', detail: 'had warm lemon water to activate digestion' },
            { icon: '💧', label: 'Plain warm water', detail: 'drank a glass of plain warm water' },
            { icon: '🌿', label: 'Herbal infusion', detail: 'had warm herbal or tulsi infused water' },
            { icon: '�', label: 'Honey & ginger', detail: 'had warm water with honey and ginger' },
        ],
    },
    {
        id: 'tongue_scrape', icon: '✨', label: 'Tongue Scraping', sublabel: 'Jihwa prakshalana', color: '#86efac',
        logMessage: 'I did tongue scraping this morning [UI_EVENT: MORNING_LOGS_CLICKED]',
        subOptions: [
            { icon: '🥈', label: 'Silver scraper', detail: 'used a silver tongue scraper this morning' },
            { icon: '🥇', label: 'Copper scraper', detail: 'used a copper tongue scraper as Ayurveda recommends' },
            { icon: '✅', label: 'Done & fresh', detail: 'tongue scraped — mouth feels fresh and clean' },
            { icon: '🌊', label: 'Oil pulling too', detail: 'did tongue scraping and oil pulling (gandusha)' },
        ],
    },
    {
        id: 'breathwork', icon: '🧘', label: 'Pranayama', sublabel: 'Breathing reset', color: '#818cf8',
        logMessage: 'I did morning breathwork today [UI_EVENT: MORNING_LOGS_CLICKED]',
        subOptions: [
            { icon: '⏱️', label: '5 min reset', detail: '5 minute breathing reset done' },
            { icon: '🕐', label: '10 min flow', detail: '10 minute pranayama flow done' },
            { icon: '✨', label: '20+ min deep', detail: 'full 20+ minute breathwork session' },
            { icon: '📅', label: 'Will do later', detail: 'planning breathwork later today' },
        ],
    },
    {
        id: 'bath', icon: '🚿', label: 'Morning Bath', sublabel: 'Snana · Cleanse ritual', color: '#38bdf8',
        logMessage: 'I took a bath and recharged this morning [UI_EVENT: MORNING_LOGS_CLICKED]',
        subOptions: [
            { icon: '�', label: 'Cold shower', detail: 'took an invigorating cold shower' },
            { icon: '♨️', label: 'Warm bath', detail: 'had a warm, relaxing bath' },
            { icon: '�', label: 'Herbal & mindful', detail: 'mindful bath with herbal oils or scrub' },
            { icon: '⚡', label: 'Quick refresh', detail: 'quick fresh shower, ready to go' },
        ],
    },
    {
        id: 'morning_light', icon: '☀️', label: 'Morning Sunlight', sublabel: 'Surya darshana', color: '#fb923c',
        logMessage: 'I got morning sunlight exposure [UI_EVENT: MORNING_LOGS_CLICKED]',
        subOptions: [
            { icon: '👁️', label: 'Sun gazing', detail: 'did morning sun gazing ritual' },
            { icon: '🚶', label: 'Morning walk', detail: 'took a morning walk in sunlight' },
            { icon: '☕', label: 'Chai outside', detail: 'had chai outside in morning sun' },
            { icon: '🪟', label: 'Near window', detail: 'sat near window with morning light' },
        ],
    },
    {
        id: 'breakfast', icon: '🥣', label: 'Mindful Breakfast', sublabel: 'Ahara · First meal', color: '#34d399',
        logMessage: 'I had breakfast today [UI_EVENT: MORNING_LOGS_CLICKED]',
        subOptions: [
            { icon: '🥣', label: 'Oats & fruits', detail: 'had oats with fruits' },
            { icon: '🫓', label: 'Parathas', detail: 'had parathas this morning' },
            { icon: '🍳', label: 'Eggs', detail: 'had eggs for breakfast' },
            { icon: '🍵', label: 'Just chai', detail: 'just had chai, light start today' },
        ],
    },
];

const NOON_BUBBLES: LogBubble[] = [
    {
        id: 'lunch', icon: '🍱', label: 'Lunch', sublabel: 'Midday nourishment', color: '#f59e0b',
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
        id: 'deep_work', icon: '🎯', label: 'Deep Work', sublabel: 'Flow session', color: '#4ade80',
        logMessage: 'I completed a deep work session [UI_EVENT: NOON_LOGS_CLICKED]',
        subOptions: [
            { icon: '⏰', label: '1 hour sprint', detail: '1 hour focused deep work sprint' },
            { icon: '🕑', label: '2 hour block', detail: '2 hour deep work block done' },
            { icon: '🔥', label: 'Still going!', detail: 'still in flow, logging mid-sprint' },
            { icon: '😵', label: 'Struggled today', detail: 'struggled to focus today' },
        ],
    },
    {
        id: 'screen_break', icon: '👁️', label: 'Eye Reset', sublabel: 'Sense restoration', color: '#22d3ee',
        logMessage: 'I took a screen break [UI_EVENT: NOON_LOGS_CLICKED]',
        subOptions: [
            { icon: '🚶', label: '5 min walk', detail: '5 minute screen-free walk taken' },
            { icon: '😌', label: 'Eyes closed', detail: 'closed eyes and rested them' },
            { icon: '🌿', label: 'Looked outside', detail: 'looked at greenery for eye reset' },
            { icon: '🧘', label: 'Quick breathe', detail: '2 minute breathing break taken' },
        ],
    },
    {
        id: 'hydration', icon: '💧', label: 'Hydration', sublabel: 'Water intake', color: '#60a5fa',
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
        id: 'h_walk', icon: '🚶', label: 'Evening Walk', sublabel: 'Sandhya bhramaṇa', color: '#4ade80',
        logMessage: 'I went for an evening walk — Sandhya Bhramana [UI_EVENT: EVENING_LOGS_CLICKED]',
        subOptions: [
            { icon: '🚶', label: '20 min walk', detail: 'took a 20 minute mindful evening walk' },
            { icon: '🏃', label: 'Brisk walk', detail: 'went for a brisk evening walk' },
            { icon: '🌿', label: 'Nature walk', detail: 'walked in nature or a park' },
            { icon: '🧘', label: 'Mindful walk', detail: 'walked slowly and mindfully in the evening' },
            { icon: '💪', label: 'Workout instead', detail: 'did a full workout session tonight' },
        ],
    },
    {
        id: 'dinner', icon: '🌙', label: 'Dinner', sublabel: 'Evening nourishment', color: '#a78bfa',
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
        id: 'h_evening_meditation', icon: '🕯️', label: 'Eve. Meditation', sublabel: 'Sandhya · Stillness', color: '#a78bfa',
        logMessage: 'I did evening meditation — Sandhya Vandana [UI_EVENT: EVENING_LOGS_CLICKED]',
        subOptions: [
            { icon: '⏱️', label: '5 min stillness', detail: '5 minute evening stillness done' },
            { icon: '🕐', label: '10 min dhyan', detail: '10 minute evening dhyan complete' },
            { icon: '🙏', label: 'Sandhya prayer', detail: 'sandhya prayer and mantra recitation' },
            { icon: '🧘', label: 'Full meditation', detail: 'full evening meditation session done' },
        ],
    },
    {
        id: 'h_digital_sunset', icon: '📵', label: 'Digital Sunset', sublabel: 'Screens off', color: '#fb923c',
        logMessage: 'Setting digital sunset — screens going off for the night [UI_EVENT: EVENING_LOGS_CLICKED]',
        subOptions: [
            { icon: '✅', label: 'Done! Screens off', detail: 'put all screens away for the night' },
            { icon: '📵', label: 'Almost there', detail: 'winding down screens gradually' },
            { icon: '📖', label: 'Switched to book', detail: 'swapped screen for a book tonight' },
            { icon: '🎵', label: 'Just music now', detail: 'screens off, playing calm music' },
        ],
    },
    {
        id: 'h_brain_dump', icon: '📓', label: 'Brain Dump', sublabel: 'Evening reflection', color: '#2dd4bf',
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
        id: 'sleep', icon: '💤', label: 'Sleep Ritual', sublabel: 'Rest mode', color: '#818cf8',
        logMessage: 'Going to sleep now, goodnight [UI_EVENT: NIGHT_LOGS]',
        subOptions: [
            { icon: '🌙', label: 'Before 10 PM', detail: 'early sleep — before 10 PM tonight' },
            { icon: '🕙', label: '10–11 PM', detail: 'sleeping around 10–11 PM' },
            { icon: '🌃', label: '11 PM–midnight', detail: 'sleeping around 11 PM to midnight' },
            { icon: '🦉', label: 'Night owl mode', detail: 'late night — past midnight as usual' },
        ],
    },
    {
        id: 'gratitude', icon: '🙏', label: 'Gratitude', sublabel: 'Count your wins', color: '#fbbf24',
        logMessage: 'I am feeling grateful today [UI_EVENT: NIGHT_LOGS]',
        subOptions: [
            { icon: '✨', label: '3 good things', detail: 'named 3 things I am grateful for today' },
            { icon: '🙏', label: 'Short prayer', detail: 'said a short prayer of gratitude' },
            { icon: '💛', label: 'Just felt it', detail: 'sat with deep gratitude in my heart' },
            { icon: '📓', label: 'Wrote it down', detail: 'wrote gratitude in my journal' },
        ],
    },
    {
        id: 'dinner_night', icon: '🌙', label: 'Dinner', sublabel: 'Light dinner', color: '#a78bfa',
        logMessage: 'I had dinner tonight [UI_EVENT: NIGHT_LOGS]',
        subOptions: [
            { icon: '🥗', label: 'Light meal', detail: 'had a light dinner tonight' },
            { icon: '🍚', label: 'Full dinner', detail: 'had a full dinner meal' },
            { icon: '⏭️', label: 'Skipping tonight', detail: 'skipping dinner tonight' },
        ],
    },
    {
        id: 'read', icon: '📚', label: 'Bedtime Read', sublabel: 'Screen-free wind down', color: '#34d399',
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
    if (h >= 2 && h < 11) return MORNING_BUBBLES;
    if (h >= 11 && h < 15) return NOON_BUBBLES;
    if (h >= 15 && h < 22) return h < 18
        ? EVENING_BUBBLES.filter(b => b.id !== 'dinner')
        : EVENING_BUBBLES;
    return NIGHT_BUBBLES;
}

export function getTimeLabel(): { label: string; color: string; Icon: LucideIcon; sublabel: string } {
    const h = new Date().getHours();
    if (h >= 2 && h < 6) return { label: 'Brahma Muhurta', color: '#fbbf24', Icon: Sparkles, sublabel: 'Sacred window open' };
    if (h >= 6 && h < 11) return { label: 'Morning Log', color: '#fbbf24', Icon: Sunrise, sublabel: 'Kapha window • Agni activation' };
    if (h >= 11 && h < 15) return { label: 'Midday Log', color: '#fb923c', Icon: Sun, sublabel: 'Pitta window • Peak energy' };
    if (h >= 15 && h < 18) return { label: 'Evening Log', color: '#f97316', Icon: Sunset, sublabel: 'Vata-Kapha transition • Wind down begins' };
    if (h >= 18 && h < 22) return { label: 'Evening Log', color: '#a78bfa', Icon: Sunset, sublabel: 'Kapha wind-down • Wind down ritual' };
    return { label: 'Night Log', color: '#818cf8', Icon: Moon, sublabel: 'Late Pitta • Sleep ritual' };
}

// ─── Semantic ordering heuristic (strict Ayurvedic dinacharya sequence) ──────
function getSortIndex(label: string, id: string): number {
    const text = (label + ' ' + id).toLowerCase();
    if (text.includes('wake') || text.includes('rise')) return 10;
    if (id === 'warm_water' || text.includes('ushapana') || (text.includes('warm') && text.includes('water'))) return 15;
    if (text.includes('water') || text.includes('hydrat')) return 20;
    if (text.includes('teeth') || text.includes('tongue') || text.includes('scrap') || text.includes('oil pull')) return 25;
    if (text.includes('meditat') || text.includes('pranayama') || text.includes('breath') || text.includes('yoga') || text.includes('stretch')) return 35;
    if (text.includes('bath') || text.includes('shower') || text.includes('snana') || text.includes('clean')) return 45;
    if (text.includes('sun') || text.includes('light') || text.includes('surya')) return 60;
    if (text.includes('breakfast') || text.includes('ahara') || text.includes('food') || text.includes('eat') || text.includes('meal')) return 70;
    return 100;
}

// ─── Build dynamic habit bubbles ──────────────────────────────────────────────
function buildDynamicHabitBubbles(
    loggedToday: Set<string>,
    completedHabitIds: Set<string>
): { timed: LogBubble[]; anytime: LogBubble[] } {
    const habits = getActiveHabits();
    const currentSlot = getCurrentTimeSlot();
    const timed: LogBubble[] = [];
    const anytime: LogBubble[] = [];

    for (const habit of habits) {
        if (STATIC_BUBBLE_IDS.has(habit.id)) continue;
        if (loggedToday.has(habit.id) || completedHabitIds.has(habit.id)) continue;

        const slot = habitTimeSlot(habit.category);
        const color = LIFE_AREA_COLORS[habit.lifeArea ?? ''] ?? '#a78bfa';
        const bubble: LogBubble = {
            id: habit.id,
            icon: habit.icon,
            label: habit.name,
            sublabel: habit.scheduledTime ? `Due ${habit.scheduledTime}` : 'Tap to log',
            color,
            logMessage: `I completed my habit: ${habit.icon} ${habit.name} [UI_EVENT: HABIT_AS_LOG]`,
            isDynamic: true,
            subOptions: [
                { icon: '✅', label: 'Done fully', detail: `completed ${habit.name} fully today` },
                { icon: '⚡', label: 'Done quickly', detail: `did a quick ${habit.name} today` },
                { icon: '🌱', label: 'Partial but done', detail: `partially completed ${habit.name} — still counts` },
                { icon: '📅', label: 'Will do later', detail: `planning to do ${habit.name} later today` },
            ],
        };

        if (slot === 'anytime') {
            bubble.isAnytime = true;
            anytime.push(bubble);
        } else if (slot === currentSlot || (currentSlot === 'pre-dawn' && slot === 'morning') || (currentSlot === 'afternoon' && slot === 'evening')) {
            timed.push(bubble);
        }
    }
    return { timed, anytime };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SmartLogBubbles() {
    const { user } = useOneSutraAuth();
    const lifestyleStore = useLifestyleStore();
    const [activeBubble, setActiveBubble] = useState<string | null>(null);
    const [loggedToday, setLoggedToday] = useState<Set<string>>(() => getLoggedToday());
    const [completedHabitIds, setCompletedHabitIds] = useState<Set<string>>(() => getCompletedHabitIds());
    const [orderToast, setOrderToast] = useState<string | null>(null);

    const staticBubbles = useMemo(() => getTimedBubbles(), []);
    const timeLabel = useMemo(() => getTimeLabel(), []);
    const TimeLabelIcon = timeLabel.Icon;

    // Refresh on mount, periodically, and when any log event fires
    useEffect(() => {
        const refresh = () => {
            setLoggedToday(getLoggedToday());
            setCompletedHabitIds(getCompletedHabitIds());
        };
        refresh();
        window.addEventListener('focus', refresh);
        window.addEventListener('daily-log-story-updated', refresh);
        window.addEventListener('storage', refresh);
        const timer = setInterval(refresh, 20_000);
        return () => {
            window.removeEventListener('focus', refresh);
            window.removeEventListener('daily-log-story-updated', refresh);
            window.removeEventListener('storage', refresh);
            clearInterval(timer);
        };
    }, []);

    // Sync loggedToday from lifestyle store — kept fresh by useLifestyleEngine's onSnapshot
    // on habit_logs collection. Covers re-login persistence and cross-device real-time sync.
    useEffect(() => {
        const today = getTodayStr();
        const storeIds = new Set(
            lifestyleStore.habitLogs
                .filter(l => l.date === today && l.completed)
                .map(l => l.habitId)
        );
        if (storeIds.size === 0) return;
        setLoggedToday(prev => {
            const combined = new Set(prev);
            storeIds.forEach(hId => {
                combined.add(hId); // dynamic h_* IDs
                const staticId = H_ID_TO_SMARTLOG[hId];
                if (staticId) combined.add(staticId); // static bubble IDs
            });
            return combined;
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lifestyleStore.habitLogs]);

    // Dynamic habit bubbles
    const { timed: dynamicTimed, anytime: dynamicAnytime } = useMemo(
        () => buildDynamicHabitBubbles(loggedToday, completedHabitIds),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [loggedToday.size, completedHabitIds.size]
    );

    // Pending static bubbles for this time slot
    // Hide if already logged via SmartLog OR already marked done in lifestyle store
    const pendingStaticBubbles = useMemo(() => {
        const today = getTodayStr();
        const lifestyleDone = new Set(
            lifestyleStore.habitLogs
                .filter(l => l.date === today && l.completed)
                .map(l => l.habitId)
        );
        return staticBubbles.filter(b => {
            if (loggedToday.has(b.id)) return false;
            const hId = SMARTLOG_TO_H_ID[b.id];
            if (hId && lifestyleDone.has(hId)) return false;
            return true;
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [staticBubbles, loggedToday.size, lifestyleStore.habitLogs]);

    // Timed section: static + user lifestyle habits for the current time slot
    const timedBubbles = useMemo(() => {
        const sorted = [...pendingStaticBubbles, ...dynamicTimed];
        sorted.sort((a, b) => getSortIndex(a.label, a.id) - getSortIndex(b.label, b.id));
        return sorted;
    }, [pendingStaticBubbles, dynamicTimed]);

    // Anytime section: always-visible personal habits
    const anytimeBubbles = useMemo(
        () => dynamicAnytime,
        [dynamicAnytime]
    );

    const allLogged = timedBubbles.length === 0 && anytimeBubbles.length === 0;

    const getBlockReason = useCallback((id: string): string | null => {
        const orderIdx = MORNING_ORDER.indexOf(id);
        if (orderIdx <= 0) return null;
        const prereq = MORNING_ORDER[orderIdx - 1];
        if (!loggedToday.has(prereq)) {
            const names: Record<string, string> = { wake: 'Wake Before 6am', warm_water: 'Warm Water Ritual', tongue_scrape: 'Tongue Scraping', breathwork: 'Pranayama', bath: 'Morning Bath', morning_light: 'Morning Sunlight', breakfast: 'Mindful Breakfast' };
            return `Log "${names[prereq] ?? prereq}" first ✦`;
        }
        return null;
    }, [loggedToday]);

    // ── Bodhi background voice bubble ────────────────────────────────────────
    const [bodhiSpeaking, setBodhiSpeaking] = useState(false);
    const [bodhiBubbleLabel, setBodhiBubbleLabel] = useState('');
    const audioUnlocked = useRef(false);
    const unlockAudio = useCallback(() => {
        if (audioUnlocked.current) return;
        audioUnlocked.current = true;
        try {
            const ac = new AudioContext();
            ac.resume().then(() => ac.close()).catch(() => { /* ignore */ });
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        const handler = (e: Event) => {
            const { speaking } = (e as CustomEvent<{ speaking: boolean }>).detail;
            setBodhiSpeaking(speaking);
            if (speaking) {
                try { setBodhiBubbleLabel(sessionStorage.getItem('bodhi_pending_inject') ?? ''); } catch { /* ignore */ }
            }
        };
        window.addEventListener('bodhi-log-speaking', handler);
        return () => window.removeEventListener('bodhi-log-speaking', handler);
    }, []);

    const toggleBubble = (bubble: LogBubble) => {
        if (loggedToday.has(bubble.id)) {
            setOrderToast('Already logged today ✓');
            setTimeout(() => setOrderToast(null), 2200);
            return;
        }
        const block = getBlockReason(bubble.id);
        if (block) {
            setOrderToast(block);
            setTimeout(() => setOrderToast(null), 2500);
            const prereqMatch = block.match(/Log "([^"]+)"/);
            const prereqName = prereqMatch ? prereqMatch[1] : undefined;
            bodhiSpeakLog({
                habitName: bubble.label,
                isLocked: true,
                lockReason: block,
                prereqName,
                timeSlot: getCurrentTimeSlot(),
            });
            return;
        }
        setActiveBubble(prev => prev === bubble.id ? null : bubble.id);
    };

    const logAndNavigate = async (bubble: LogBubble, sub?: SubOption) => {
        unlockAudio();
        const updated = new Set(loggedToday).add(bubble.id);
        setLoggedToday(updated);
        saveLoggedToday(updated);
        saveToDailyLogStory(bubble.id, bubble.icon, bubble.label, bubble.color);
        setActiveBubble(null);
        // ── Route through engine.completeHabit() → writes to habit_logs Firestore ──
        // This is the single source of truth. Powers:
        //   • re-login persistence (onSnapshot reloads habit_logs on next login)
        //   • same-user cross-device real-time sync via onSnapshot listener in useLifestyleEngine
        //   • LifestylePanel + SmartAnalyticsDashboard both read from the same store
        const hId = SMARTLOG_TO_H_ID[bubble.id];
        const targetId = hId ?? (bubble.isDynamic ? bubble.id : null);
        if (targetId) {
            // Fire-and-forget: updates local Zustand store instantly + writes to
            // habit_logs Firestore. onSnapshot on all logged-in devices picks this
            // up in milliseconds without any additional listener in this component.
            logHabitAndSync(user?.uid, targetId, sub?.detail);
        }

        const slot = getCurrentTimeSlot();
        const onTime = isOnTimeForSlot(bubble.id, slot);

        // ── Bodhi contextual habit-log response (new Master Prompt) ──────────
        try {
            const loggedAtMs = Date.now();
            const logTime = getISTTimeStr(loggedAtMs);
            const todayISO = getISODateIST(loggedAtMs);
            const win = findHabitWindow(bubble.id) ?? findHabitWindow(bubble.label);
            const timingStatus = win ? getHabitWindowTimingStatus(win, loggedAtMs) : 'ideal';
            const lateStreak = win ? updateLateStreak(bubble.id, timingStatus, todayISO) : 0;
            const morningMood = getMorningMood();
            const { prakriti, vikriti, habitStreak } = getLocalContext(bubble.id);

            const res = await fetch('/api/bodhi/habit-log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_name: getLocalUserName(),
                    prakriti,
                    vikruti: vikriti,
                    mood: morningMood?.mood ?? '',
                    habit_name: bubble.label,
                    log_time: logTime,
                    ideal_start: win?.idealStart ?? '',
                    ideal_end: win?.idealEnd ?? '',
                    timing_status: timingStatus,
                    late_streak: lateStreak,
                    habit_streak: habitStreak,
                    dosha_effect: win?.doshaEffect ?? '',
                    habit_benefit: win?.benefit ?? '',
                    duration_minutes: 0,
                    time_section: win?.timeSection ?? (bubble.isDynamic ? 'flexible' : slot),
                }),
            });
            if (res.ok) {
                const data = await res.json();
                const voiceMessage: string = data.response ?? '';
                if (voiceMessage.length > 10) {
                    try { sessionStorage.setItem('bodhi_pending_inject', bubble.label); } catch { /* ignore */ }
                    const { speakBodhiRaw } = await import('@/lib/bodhiVoice');
                    speakBodhiRaw(voiceMessage);
                    return;
                }
            }
        } catch { /* fall through to template */ }

        // Fallback: template-based Gemini Live voice
        bodhiSpeakLog({
            habitIcon: bubble.icon,
            habitName: bubble.label,
            isLocked: false,
            timeSlot: slot,
            isOnTime: onTime,
        });
    };

    const active = [...timedBubbles, ...anytimeBubbles].find(b => b.id === activeBubble) ?? null;

    // Speak when all done (once per session)
    useEffect(() => {
        if (allLogged) {
            const timer = setTimeout(() => bodhiSpeakAllDone(getCurrentTimeSlot()), 800);
            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allLogged]);

    // ── Render a logged done-card (inline timing response) ───────────────────
    const renderDoneCard = (bubble: LogBubble, loggedAtMs?: number) => {
        const status = getTimingStatus(bubble.id);
        const ack = getTimingAck(status, bubble.label);
        const insight = getInsight(bubble.id);
        const nudge = (status === 'LATE' || status === 'VERY_LATE') ? getNudge(bubble.id) : null;
        const statusColor = status === 'ON_TIME' ? '#4ade80' : status === 'ACCEPTABLE' ? '#a3e635' : status === 'LATE' ? '#fbbf24' : '#f87171';
        const timeStr = loggedAtMs ? new Date(loggedAtMs).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
        return (
            <motion.div
                key={bubble.id + '_done'}
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.65rem',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 14,
                    background: `linear-gradient(135deg, ${statusColor}0D 0%, rgba(4,2,18,0.0) 100%)`,
                    border: `1px solid ${statusColor}28`,
                    marginBottom: '0.35rem',
                }}
            >
                <div style={{ fontSize: '1.35rem', flexShrink: 0, lineHeight: 1, paddingTop: 2 }}>{bubble.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: statusColor, fontFamily: "'Outfit', sans-serif", lineHeight: 1.2 }}>{ack}</span>
                        {timeStr && <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.28)', fontFamily: "'Outfit', sans-serif", fontWeight: 500 }}>{timeStr}</span>}
                    </div>
                    <p style={{ margin: '0.18rem 0 0', fontSize: '0.68rem', color: 'rgba(255,255,255,0.52)', fontFamily: "'Outfit', sans-serif", fontStyle: 'italic', lineHeight: 1.4 }}>{insight}</p>
                    {nudge && <p style={{ margin: '0.18rem 0 0', fontSize: '0.62rem', color: '#fbbf24', fontFamily: "'Outfit', sans-serif", fontWeight: 600, lineHeight: 1.3 }}>↑ {nudge}</p>}
                </div>
            </motion.div>
        );
    };

    // ── Render a single bubble ───────────────────────────────────────────────
    const renderBubble = (bubble: LogBubble, i: number) => {
        const isActive = activeBubble === bubble.id;
        const isDone = loggedToday.has(bubble.id);
        if (isDone) return null;
        const isLocked = !isDone && getBlockReason(bubble.id) !== null;
        const isDynamic = !!bubble.isDynamic;

        return (
            <motion.div
                key={bubble.id}
                initial={{ opacity: 0, y: 16, scale: 0.9 }}
                animate={{ opacity: isDone ? 0.38 : 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.06, type: 'spring', stiffness: 340, damping: 26 }}
                style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: isLocked || isDone ? 'default' : 'pointer', opacity: isLocked ? 0.45 : undefined }}
                onClick={() => !isDone && toggleBubble(bubble)}
            >
                {/* Bubble circle */}
                <motion.div
                    animate={isDone ? {
                        boxShadow: '0 0 0 1.5px rgba(74,222,128,0.45), 0 4px 12px rgba(0,0,0,0.35)',
                        scale: 1, y: 0,
                    } : isActive ? {
                        // plain string — no array for active state (avoids framer-motion interpolation crash)
                        boxShadow: `0 0 0 2.5px ${bubble.color}90, 0 0 32px ${bubble.color}55, inset 0 0 24px ${bubble.color}20`,
                        scale: 1.12,
                        y: -5,
                    } : {
                        // 3-element array = valid breathing keyframe animation
                        boxShadow: [
                            `0 0 0 1.5px ${bubble.color}${isDynamic ? '60' : '30'}, 0 6px 20px rgba(0,0,0,0.4)`,
                            `0 0 0 1.5px ${bubble.color}${isDynamic ? '85' : '55'}, 0 6px 28px ${bubble.color}28`,
                            `0 0 0 1.5px ${bubble.color}${isDynamic ? '60' : '30'}, 0 6px 20px rgba(0,0,0,0.4)`,
                        ],
                        scale: [1, 1.04, 1],
                        y: [0, -5, 0],
                    }}
                    transition={isDone
                        ? { duration: 0.3 }
                        : isActive
                            ? { type: 'spring', stiffness: 380, damping: 24 }
                            : { duration: 3.5 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.35 }}

                    style={{
                        width: 'min(88px, 17vw)',
                        height: 'min(88px, 17vw)',
                        minWidth: 68,
                        minHeight: 68,
                        borderRadius: '50%',
                        background: isDone
                            ? 'rgba(74,222,128,0.12)'
                            : isDynamic
                                ? `radial-gradient(circle at 32% 26%, ${bubble.color}35 0%, ${bubble.color}12 45%, rgba(4,2,18,0.22) 80%)`
                                : `radial-gradient(circle at 32% 26%, ${bubble.color}25 0%, ${bubble.color}08 50%, rgba(4,2,18,0.18) 80%)`,
                        border: isDone
                            ? '1.5px solid rgba(74,222,128,0.45)'
                            : isDynamic
                                ? `2px solid ${bubble.color}${isActive ? 'ee' : '70'}`
                                : `1.5px solid ${bubble.color}${isActive ? 'aa' : '45'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'clamp(1.55rem, 4.2vw, 2rem)',
                        backdropFilter: 'blur(18px)',
                        WebkitBackdropFilter: 'blur(18px)',
                        position: 'relative',
                        transition: 'border-color 0.25s, background 0.25s',
                    }}
                >
                    {/* Active pulse ring */}
                    <AnimatePresence>
                        {isActive && !isDone && (
                            <motion.div
                                initial={{ scale: 1, opacity: 0.7 }}
                                animate={{ scale: 1.6, opacity: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.95, repeat: Infinity, ease: 'easeOut' }}
                                style={{ position: 'absolute', inset: -5, borderRadius: '50%', border: `2px solid ${bubble.color}55`, pointerEvents: 'none' }}
                            />
                        )}
                    </AnimatePresence>
                    {/* Dynamic badge */}
                    {isDynamic && !isDone && (
                        <motion.div
                            animate={{ scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{ position: 'absolute', top: -3, right: -3, width: 13, height: 13, borderRadius: '50%', background: bubble.color, border: '2px solid rgba(0,0,0,0.6)', boxShadow: `0 0 8px ${bubble.color}` }}
                        />
                    )}
                    {/* Done checkmark */}
                    {isDone ? <span style={{ fontSize: '1.4rem' }}>✓</span> : bubble.icon}
                </motion.div>

                {/* Label */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <span style={{
                        fontSize: '0.76rem', fontWeight: isDone ? 600 : 800,
                        color: isDone ? 'rgba(74,222,128,0.55)' : isActive ? bubble.color : 'rgba(255,255,255,0.78)',
                        letterSpacing: '0.02em', textAlign: 'center', maxWidth: 160,
                        lineHeight: 1.25, fontFamily: "'Outfit', sans-serif",
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        filter: isActive && !isDone ? `drop-shadow(0 0 6px ${bubble.color}80)` : 'none',
                        transition: 'color 0.2s', padding: '0 4px',
                    }}>
                        {bubble.label}
                    </span>
                </div>
            </motion.div>
        );
    };

    return (
        <div style={{ padding: '0.4rem 0.75rem 0.2rem' }} onClick={unlockAudio}>

            {/* ── Bodhi speaking floating bubble ──────────────────────────── */}
            <AnimatePresence>
                {bodhiSpeaking && (
                    <motion.div
                        key="bodhi-log-bubble"
                        initial={{ opacity: 0, y: 50, scale: 0.93 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                        style={{
                            position: 'fixed', bottom: 88, left: '50%', transform: 'translateX(-50%)',
                            zIndex: 9998, width: 'calc(100vw - 1.8rem)', maxWidth: 470,
                            background: 'linear-gradient(135deg, rgba(4,2,20,0.97), rgba(18,8,36,0.99))',
                            border: '1.5px solid rgba(251,191,36,0.5)',
                            borderRadius: 22, padding: '0.9rem 1rem',
                            backdropFilter: 'blur(28px)',
                            boxShadow: '0 12px 48px rgba(0,0,0,0.8), 0 0 60px rgba(251,191,36,0.1)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <motion.div
                                animate={{ boxShadow: ['0 0 0 2px rgba(251,191,36,0.35)', '0 0 0 7px rgba(251,191,36,0.13)', '0 0 0 2px rgba(251,191,36,0.35)'] }}
                                transition={{ duration: 0.9, repeat: Infinity }}
                                style={{
                                    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                                    background: 'radial-gradient(circle at 35% 30%, rgba(251,191,36,0.5) 0%, rgba(139,92,246,0.3) 65%, transparent 100%)',
                                    border: '2px solid rgba(251,191,36,0.65)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem',
                                }}
                            >✦</motion.div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.22rem' }}>
                                    <span style={{ fontSize: '0.52rem', padding: '0.08rem 0.38rem', borderRadius: 99, background: 'rgba(74,222,128,0.18)', border: '1px solid rgba(74,222,128,0.4)', color: '#4ade80', fontWeight: 800, fontFamily: "'Outfit', sans-serif", letterSpacing: '0.08em' }}>✓ LOGGED</span>
                                    {bodhiBubbleLabel && (
                                        <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif", fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 140 }}>{bodhiBubbleLabel}</span>
                                    )}
                                </div>
                                <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)', fontFamily: "'Outfit', sans-serif", fontStyle: 'italic', lineHeight: 1.45 }}>
                                    {(typeof localStorage !== 'undefined' && localStorage.getItem('site-lang') === 'en') ? 'Bodhi is speaking…' : 'बोधि बोल रहा है…'}
                                </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                                {[0, 1, 2].map(i => (
                                    <motion.div
                                        key={i}
                                        animate={{ scaleY: [0.35, 1.25, 0.35] }}
                                        transition={{ duration: 0.75, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
                                        style={{ width: 3, height: 18, borderRadius: 3, background: '#fbbf24', transformOrigin: 'center', flexShrink: 0 }}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Order toast ── */}
            <AnimatePresence>
                {orderToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        style={{ marginBottom: '0.5rem', padding: '0.4rem 1rem', borderRadius: 99, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.38)', fontSize: '0.72rem', fontWeight: 700, color: '#fbbf24', fontFamily: "'Outfit', sans-serif", textAlign: 'center' }}
                    >
                        {orderToast}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ══ PREMIUM HEADER ══════════════════════════════════════════════ */}
            <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    marginBottom: '0.7rem',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 18,
                    background: `linear-gradient(135deg, ${timeLabel.color}14 0%, rgba(4,2,20,0.0) 100%)`,
                    border: `1.5px solid ${timeLabel.color}28`,
                    display: 'flex', alignItems: 'center', gap: '0.65rem',
                    position: 'relative', overflow: 'hidden',
                }}
            >
                {/* Ambient glow */}
                <div style={{ position: 'absolute', right: -20, top: -20, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${timeLabel.color}18, transparent 70%)`, pointerEvents: 'none' }} />

                <motion.div
                    animate={{ filter: [`drop-shadow(0 0 6px ${timeLabel.color}60)`, `drop-shadow(0 0 16px ${timeLabel.color}cc)`, `drop-shadow(0 0 6px ${timeLabel.color}60)`] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <TimeLabelIcon size={22} strokeWidth={2} style={{ color: timeLabel.color, display: 'block' }} />
                </motion.div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 900, color: timeLabel.color, fontFamily: "'Outfit', sans-serif", letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1 }}>
                        {timeLabel.label}
                    </p>
                    <p style={{ margin: '0.22rem 0 0', fontSize: '0.6rem', color: 'rgba(255,255,255,0.38)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.06em' }}>
                        {timeLabel.sublabel}
                    </p>
                </div>

                {!allLogged && (
                    <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2.2, repeat: Infinity }}
                        style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                        <Flame size={11} style={{ color: timeLabel.color }} />
                        <span style={{ fontSize: '0.62rem', color: timeLabel.color, fontFamily: "'Outfit', sans-serif", fontWeight: 700, whiteSpace: 'nowrap' }}>
                            Tap to log
                        </span>
                    </motion.div>
                )}
            </motion.div>

            {/* ══ ALL-DONE STATE ═══════════════════════════════════════════════ */}
            {allLogged ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ textAlign: 'center', padding: '1.2rem 1rem', borderRadius: 20, background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.28)' }}
                >
                    <motion.span animate={{ scale: [1, 1.22, 1], rotate: [0, 10, -10, 0] }} transition={{ duration: 2.5, repeat: Infinity }} style={{ fontSize: '1.8rem', display: 'block', marginBottom: 6 }}>✨</motion.span>
                    <p style={{ margin: '0 0 0.2rem', fontSize: '0.88rem', fontWeight: 800, color: '#4ade80', fontFamily: "'Outfit', sans-serif" }}>
                        All {timeLabel.label.toLowerCase()} logged — incredible!
                    </p>
                    <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.32)', fontFamily: "'Outfit', sans-serif" }}>
                        Bodhi sees your discipline ✦ Keep this momentum
                    </p>
                </motion.div>
            ) : (
                <>
                    {/* ── SINGLE UNIFIED SCROLL ROW ───────────────────────── */}
                    <div
                        className="smart-log-row"
                        style={{
                            display: 'flex',
                            gap: '1rem',
                            overflowX: 'auto',
                            scrollbarWidth: 'none',
                            padding: '1.4rem 1rem 1.4rem',
                            alignItems: 'flex-start',
                        }}
                    >
                        <style>{`.smart-log-row::-webkit-scrollbar{display:none}`}</style>
                        {timedBubbles.map((bubble, i) => renderBubble(bubble, i))}
                        {timedBubbles.length > 0 && anytimeBubbles.length > 0 && (
                            <div style={{
                                flexShrink: 0,
                                width: 1,
                                height: 64,
                                alignSelf: 'center',
                                background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.10), transparent)',
                                margin: '0 0.1rem',
                            }} />
                        )}
                        {anytimeBubbles.map((bubble, i) => renderBubble(bubble, timedBubbles.length + i))}
                    </div>

                    {/* ── Sub-option pills ────────────────────────────────── */}
                    <AnimatePresence>
                        {active && (
                            <motion.div
                                key={active.id + '_sub'}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                style={{ overflow: 'hidden' }}
                            >
                                <div style={{ paddingTop: '0.5rem' }}>
                                    <p style={{ margin: '0 0 0.32rem', fontSize: '0.68rem', color: active.color, fontFamily: "'Outfit', sans-serif", letterSpacing: '0.05em', fontWeight: 700 }}>
                                        {active.icon} {active.sublabel} →
                                    </p>
                                    <div className="sub-option-pills" style={{ display: 'flex', gap: '0.28rem', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 6 }}>
                                        <style>{`.sub-option-pills::-webkit-scrollbar{display:none}`}</style>
                                        {active.subOptions.map((sub, i) => (
                                            <motion.button
                                                key={sub.label}
                                                initial={{ opacity: 0, x: -12 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.045, type: 'spring', stiffness: 420, damping: 28 }}
                                                whileTap={{ scale: 0.84 }}
                                                onClick={() => logAndNavigate(active, sub)}
                                                style={{
                                                    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
                                                    background: `radial-gradient(circle at 28% 28%, ${active.color}22, rgba(8,4,30,0.90))`,
                                                    border: `1px solid ${active.color}50`, borderRadius: 999,
                                                    padding: '0.35rem 0.8rem 0.35rem 0.55rem', cursor: 'pointer',
                                                    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                                                    boxShadow: `0 2px 12px ${active.color}18`,
                                                }}
                                            >
                                                <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{sub.icon}</span>
                                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.82)', letterSpacing: '0.03em', whiteSpace: 'nowrap', fontFamily: "'Outfit', sans-serif" }}>{sub.label}</span>
                                            </motion.button>
                                        ))}
                                        {/* Quick log pill */}
                                        <motion.button
                                            initial={{ opacity: 0, x: -12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: active.subOptions.length * 0.045 + 0.04 }}
                                            whileTap={{ scale: 0.84 }}
                                            onClick={() => logAndNavigate(active)}
                                            style={{
                                                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
                                                background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.18)',
                                                borderRadius: 999, padding: '0.3rem 0.7rem 0.3rem 0.45rem', cursor: 'pointer',
                                            }}
                                        >
                                            <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>✏️</span>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.03em', whiteSpace: 'nowrap', fontFamily: "'Outfit', sans-serif" }}>Tell Bodhi…</span>
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </div>
    );
}
