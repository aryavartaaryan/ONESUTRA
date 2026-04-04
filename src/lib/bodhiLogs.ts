// ════════════════════════════════════════════════════════
//  BODHI LOGS — Types, Categories, Firebase CRUD & Streak
// ════════════════════════════════════════════════════════

// ─── Log Categories ─────────────────────────────────────
export type LogCategory =
    | 'dhyana'        // Meditation / Breathwork
    | 'aahar'         // Meals / Dietary
    | 'nidra'         // Sleep
    | 'nidra_wake'    // Morning wake-up time
    | 'nidra_sleep'   // Night sleeping time
    | 'swadhyaya'     // Journaling / Learning / Custom
    | 'ekagra'        // Deep Work focus blocks
    | 'sankalpa'      // Challenge overcome
    | 'spurana'       // Idea / creative spark
    | 'upavasa'       // Intermittent fasting
    | 'vyayama'       // Physical training / gym
    | 'arogya'        // Not feeling well — Ayurvedic check
    | 'bhava'         // Mood & energy check-in
    | 'pratyahara'    // Digital detox
    | 'kritagyata'    // Gratitude
    | 'hydration'     // Water / fluids
    | 'custom';       // Anything else

export interface LogCategoryMeta {
    id: LogCategory;
    emoji: string;
    label: string;
    sublabel: string;
    color: string;
    quickPrompt: string;  // Pre-fill for quick tap
}

export const LOG_CATEGORIES: LogCategoryMeta[] = [
    { id: 'dhyana', emoji: '🧘', label: 'Dhyana', sublabel: 'Meditation & Breathwork', color: '#a78bfa', quickPrompt: 'I did meditation/breathwork for ' },
    { id: 'aahar', emoji: '🥗', label: 'Aahar', sublabel: 'Meals & Diet', color: '#4ade80', quickPrompt: 'I ate ' },
    { id: 'nidra_wake', emoji: '🌅', label: 'Wake Up', sublabel: 'Morning rise time', color: '#fbbf24', quickPrompt: 'I woke up at ' },
    { id: 'nidra_sleep', emoji: '🌙', label: 'Sleep', sublabel: 'Bedtime & quality', color: '#818cf8', quickPrompt: 'I slept at ' },
    { id: 'swadhyaya', emoji: '📖', label: 'Swadhyaya', sublabel: 'Journal & Learning', color: '#f472b6', quickPrompt: 'Today I learned/journaled about ' },
    { id: 'ekagra', emoji: '🧠', label: 'Deep Work', sublabel: 'Focused work blocks', color: '#22d3ee', quickPrompt: 'I did deep focused work for ' },
    { id: 'sankalpa', emoji: '🚀', label: 'Challenge', sublabel: 'Problem solved today', color: '#f97316', quickPrompt: 'I overcame a challenge: ' },
    { id: 'spurana', emoji: '💡', label: 'Idea Drop', sublabel: 'Creative spark', color: '#fde68a', quickPrompt: 'I had an idea: ' },
    { id: 'upavasa', emoji: '⏳', label: 'Fasting', sublabel: 'Intermittent fasting', color: '#c084fc', quickPrompt: 'I started/completed a fast — ' },
    { id: 'vyayama', emoji: '🏋️', label: 'Vyayama', sublabel: 'Physical training', color: '#34d399', quickPrompt: 'I did physical exercise: ' },
    { id: 'arogya', emoji: '🌿', label: 'Wellness', sublabel: 'Not feeling well?', color: '#fb923c', quickPrompt: 'I am not feeling well — ' },
    { id: 'bhava', emoji: '🎭', label: 'Mood', sublabel: 'Energy & emotions', color: '#e879f9', quickPrompt: 'My mood/energy right now is ' },
    { id: 'pratyahara', emoji: '📵', label: 'Detox', sublabel: 'Digital detox time', color: '#94a3b8', quickPrompt: 'I spent time away from screens for ' },
    { id: 'kritagyata', emoji: '🙏', label: 'Gratitude', sublabel: 'One thing thankful for', color: '#fbbf24', quickPrompt: 'I am grateful for ' },
];

// ─── Parsed Log Entry ───────────────────────────────────
export interface ParsedLogEntry {
    category: LogCategory;
    action: string;
    duration?: string;
    quality?: string;
    details?: string;
    time?: string;
}

// ─── Stored Log (Firebase doc) ──────────────────────────
export interface BodhiLog {
    id?: string;
    userId: string;
    timestamp_utc: number;
    log_category: LogCategory;
    user_input_raw: string;
    ai_parsed_data: ParsedLogEntry;
    date_key: string;   // YYYY-MM-DD for daily aggregation
}

// ─── Streak Data ────────────────────────────────────────
export interface AkhandaStreak {
    currentStreak: number;
    longestStreak: number;
    lastLogDate: string;   // YYYY-MM-DD
    graceUsedToday: boolean;
}

// ─── Helpers ────────────────────────────────────────────
function getDateKey(ts?: number): string {
    const d = ts ? new Date(ts) : new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getYesterdayKey(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getDateKey(d.getTime());
}

// ─── Firebase: Save a log ───────────────────────────────
export async function saveBodhiLog(
    userId: string,
    rawInput: string,
    parsed: ParsedLogEntry,
): Promise<void> {
    try {
        const { getFirebaseFirestore } = await import('@/lib/firebase');
        const { collection, addDoc } = await import('firebase/firestore');
        const db = await getFirebaseFirestore();

        const log: Omit<BodhiLog, 'id'> = {
            userId,
            timestamp_utc: Date.now(),
            log_category: parsed.category,
            user_input_raw: rawInput,
            ai_parsed_data: parsed,
            date_key: getDateKey(),
        };

        await addDoc(collection(db, 'users', userId, 'bodhi_logs'), log);
        // Also update streak
        await updateStreak(userId);
    } catch (e) {
        console.warn('[BodhiLogs] Could not save log:', e);
    }
}

// ─── Firebase: Save multiple parsed logs at once ────────
export async function saveMultipleBodhiLogs(
    userId: string,
    rawInput: string,
    entries: ParsedLogEntry[],
): Promise<void> {
    for (const entry of entries) {
        await saveBodhiLog(userId, rawInput, entry);
    }
}

// ─── Firebase: Get today's logs ─────────────────────────
export async function getTodayLogs(userId: string): Promise<BodhiLog[]> {
    try {
        const { getFirebaseFirestore } = await import('@/lib/firebase');
        const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore');
        const db = await getFirebaseFirestore();

        const todayKey = getDateKey();
        const q = query(
            collection(db, 'users', userId, 'bodhi_logs'),
            where('date_key', '==', todayKey),
            orderBy('timestamp_utc', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as BodhiLog));
    } catch (e) {
        console.warn('[BodhiLogs] Could not fetch today logs:', e);
        return [];
    }
}

// ─── Firebase: Get logs for a date range (weekly) ───────
export async function getWeekLogs(userId: string): Promise<BodhiLog[]> {
    try {
        const { getFirebaseFirestore } = await import('@/lib/firebase');
        const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore');
        const db = await getFirebaseFirestore();

        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 86400000);
        const startKey = getDateKey(weekAgo.getTime());

        const q = query(
            collection(db, 'users', userId, 'bodhi_logs'),
            where('date_key', '>=', startKey),
            orderBy('date_key', 'desc'),
            orderBy('timestamp_utc', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as BodhiLog));
    } catch (e) {
        console.warn('[BodhiLogs] Could not fetch week logs:', e);
        return [];
    }
}

// ─── Firebase: Load Akhanda Streak ──────────────────────
export async function loadStreak(userId: string): Promise<AkhandaStreak> {
    const defaultStreak: AkhandaStreak = { currentStreak: 0, longestStreak: 0, lastLogDate: '', graceUsedToday: false };
    try {
        const { getFirebaseFirestore } = await import('@/lib/firebase');
        const { doc, getDoc } = await import('firebase/firestore');
        const db = await getFirebaseFirestore();

        const snap = await getDoc(doc(db, 'users', userId));
        if (!snap.exists()) return defaultStreak;
        const data = snap.data()?.akhanda_streak;
        if (!data) return defaultStreak;
        return data as AkhandaStreak;
    } catch {
        return defaultStreak;
    }
}

// ─── Firebase: Update Akhanda Streak ────────────────────
// Rules: +1 daily if at least one log exists. Grace until 10 AM next morning.
export async function updateStreak(userId: string): Promise<AkhandaStreak> {
    try {
        const { getFirebaseFirestore } = await import('@/lib/firebase');
        const { doc, getDoc, setDoc } = await import('firebase/firestore');
        const db = await getFirebaseFirestore();

        const snap = await getDoc(doc(db, 'users', userId));
        const existing: AkhandaStreak = snap.exists()
            ? (snap.data()?.akhanda_streak ?? { currentStreak: 0, longestStreak: 0, lastLogDate: '', graceUsedToday: false })
            : { currentStreak: 0, longestStreak: 0, lastLogDate: '', graceUsedToday: false };

        const todayKey = getDateKey();
        const yesterdayKey = getYesterdayKey();

        // Already logged today — no change
        if (existing.lastLogDate === todayKey) return existing;

        const now = new Date();
        const hour = now.getHours();

        let newStreak = existing.currentStreak;

        if (existing.lastLogDate === yesterdayKey) {
            // Consecutive day — increment
            newStreak = existing.currentStreak + 1;
        } else if (existing.lastLogDate && existing.lastLogDate < yesterdayKey) {
            // Missed more than 1 day — check 10 AM grace for yesterday
            // Grace: if it's before 10 AM today, treat as backlogging yesterday
            if (hour < 10) {
                newStreak = existing.currentStreak + 1;
            } else {
                // Streak broken
                newStreak = 1;
            }
        } else {
            // First ever log
            newStreak = 1;
        }

        const updated: AkhandaStreak = {
            currentStreak: newStreak,
            longestStreak: Math.max(existing.longestStreak, newStreak),
            lastLogDate: todayKey,
            graceUsedToday: false,
        };

        await setDoc(doc(db, 'users', userId), { akhanda_streak: updated }, { merge: true });
        return updated;
    } catch (e) {
        console.warn('[BodhiLogs] Could not update streak:', e);
        return { currentStreak: 0, longestStreak: 0, lastLogDate: '', graceUsedToday: false };
    }
}

// ─── Weekly Analytics Summary Builder ───────────────────
export interface WeeklySummary {
    totalLogs: number;
    avgSleepMentions: number;
    dominantCategory: string;
    mostConsistentHabit: string;
    streakCount: number;
    moodTrend: string;
    dayBreakdown: Record<string, number>;
}

export function buildWeeklySummary(logs: BodhiLog[], streak: AkhandaStreak): WeeklySummary {
    const catCounts: Record<string, number> = {};
    const dayCounts: Record<string, number> = {};
    let sleepMentions = 0;

    for (const log of logs) {
        catCounts[log.log_category] = (catCounts[log.log_category] || 0) + 1;
        dayCounts[log.date_key] = (dayCounts[log.date_key] || 0) + 1;
        if (log.log_category === 'nidra' || log.log_category === 'nidra_wake' || log.log_category === 'nidra_sleep') {
            sleepMentions++;
        }
    }

    const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
    const dominantCategory = sortedCats[0]?.[0] || 'none';

    // Most consistent = category logged on most unique days
    const catDays: Record<string, Set<string>> = {};
    for (const log of logs) {
        if (!catDays[log.log_category]) catDays[log.log_category] = new Set();
        catDays[log.log_category].add(log.date_key);
    }
    const consistentCat = Object.entries(catDays)
        .sort((a, b) => b[1].size - a[1].size)[0]?.[0] || 'none';

    const catMeta = LOG_CATEGORIES.find(c => c.id === consistentCat);
    const dominantMeta = LOG_CATEGORIES.find(c => c.id === dominantCategory);

    return {
        totalLogs: logs.length,
        avgSleepMentions: Object.keys(dayCounts).length > 0 ? Math.round(sleepMentions / Object.keys(dayCounts).length * 10) / 10 : 0,
        dominantCategory: dominantMeta?.label || dominantCategory,
        mostConsistentHabit: catMeta?.label || consistentCat,
        streakCount: streak.currentStreak,
        moodTrend: 'balanced',
        dayBreakdown: dayCounts,
    };
}

// ─── Context-aware greeting for log mode ────────────────
export function getLogGreeting(): string {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Namaskaram. Ready to align your energies today? Select a quick log above, or simply tell me what you\'ve completed.';
    if (h >= 12 && h < 17) return 'Namaskar. Dopahar ki shakti ko track karein. Upar se koi log chunein ya batayein kya complete hua.';
    if (h >= 17 && h < 21) return 'Shubh Sandhya. Din bhar ki sadhana ko record karein. Quick log chunein ya freely likein.';
    return 'Shubh Ratri. Din ki sadhana log karein, neend se pehle. Quick log ya apne shabdon mein batayein.';
}
