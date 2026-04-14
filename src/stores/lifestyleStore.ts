import { create } from 'zustand';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type LifeArea = 'mental' | 'physical' | 'social' | 'professional' | 'financial' | 'spiritual' | 'creative';
export type HabitCategory = 'morning' | 'evening' | 'midday' | 'night' | 'anytime' | 'sacred';
export type TrackingType = 'checkbox' | 'counter' | 'duration' | 'numeric';
export type BuddyPersonality = 'gentle_coach' | 'tough_love' | 'wise_friend' | 'hype_person' | 'calm_monk' | 'nerdy_analyst' | 'devotional_guide';

export interface HabitItem {
    id: string;
    name: string;
    icon: string;
    category: HabitCategory;
    lifeArea: LifeArea;
    trackingType: TrackingType;
    targetValue?: number;
    color: string;
    scheduledTime?: string;
    frequency: 'daily' | 'weekdays' | 'weekends' | 'custom';
    customDays?: number[];
    isActive: boolean;
    createdAt: number;
    isTemplate?: boolean;
    description?: string;
}

export interface HabitLog {
    habitId: string;
    date: string;
    completed: boolean;
    value?: number;
    skippedReason?: string;
    note?: string;
    loggedAt: number;
}

export interface StreakData {
    habitId: string;
    currentStreak: number;
    longestStreak: number;
    lastCompletedDate: string | null;
    startDate: string | null;
    totalCompletions: number;
}

export interface MoodLog {
    date: string;
    mood: number;
    energy: number;
    tags: string[];
    note?: string;
    loggedAt: number;
}

export interface LifestyleProfile {
    lifeAreas: string[];
    painPoints: string[];
    personality: {
        circadian: 'morning' | 'night';
        style: 'planner' | 'spontaneous';
        social: 'solo' | 'accountability';
    };
    motivation: string;
    availableMinutes: number;
    spiritualBackground?: string;
    existingTools: string[];
    buddyName: string;
    buddyPersonality: BuddyPersonality;
    onboardingComplete: boolean;
    onboardingCompletedAt?: number;
    activeMantraPractices?: string[];
    wakeTime?: string;
    sleepTime?: string;
}

export interface MantraSession {
    id: string;
    mantraId: string;
    mantraName: string;
    date: string;
    malaCount: number;
    repetitionCount: number;
    durationMinutes: number;
    intention?: string;
    moodAfter?: number;
    loggedAt: number;
}

export interface MantraStreak {
    mantraId: string;
    currentStreak: number;
    longestStreak: number;
    lastCompletedDate: string | null;
    totalSessions: number;
    totalRepetitions: number;
    challengeActive?: boolean;
    challengeStartDate?: string;
    challengeDays?: 40 | 48 | 100;
}

export interface BreathingSession {
    id: string;
    techniqueId: string;
    techniqueName: string;
    date: string;
    durationMinutes: number;
    moodBefore?: number;
    moodAfter?: number;
    loggedAt: number;
}

export interface MeditationSession {
    id: string;
    style: string;
    date: string;
    durationMinutes: number;
    guided: boolean;
    note?: string;
    moodAfter?: number;
    loggedAt: number;
}

export interface JournalEntry {
    id: string;
    date: string;
    type: 'morning' | 'evening' | 'free';
    prompts?: string[];
    content: string;
    mood?: number;
    tags?: string[];
    isStarred?: boolean;
    loggedAt: number;
}

export interface GunaLog {
    date: string;
    sattva: number;  // 0-100
    rajas: number;   // 0-100
    tamas: number;   // 0-100
    dominantEmotion?: string;
    note?: string;
    loggedAt: number;
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: number;
    category: 'streak' | 'milestone' | 'sacred' | 'social' | 'special';
}

export interface XPRecord {
    total: number;
    level: number;
    history: Array<{ action: string; xp: number; date: string }>;
}

// ─── Store Interface ────────────────────────────────────────────────────────────

interface LifestyleState {
    profile: LifestyleProfile | null;
    habits: HabitItem[];
    habitLogs: HabitLog[];
    streaks: Record<string, StreakData>;
    moodLogs: MoodLog[];
    gunaLogs: GunaLog[];
    mantraSessions: MantraSession[];
    mantraStreaks: Record<string, MantraStreak>;
    breathingSessions: BreathingSession[];
    meditationSessions: MeditationSession[];
    journalEntries: JournalEntry[];
    badges: Badge[];
    xp: XPRecord;
    adhdMode: boolean;

    setProfile: (profile: LifestyleProfile) => void;
    updateProfile: (updates: Partial<LifestyleProfile>) => void;
    addHabit: (habit: HabitItem) => void;
    updateHabit: (id: string, updates: Partial<HabitItem>) => void;
    removeHabit: (id: string) => void;
    logHabit: (log: HabitLog) => void;
    logMood: (log: MoodLog) => void;
    logGuna: (log: GunaLog) => void;
    logMantraSession: (session: MantraSession) => void;
    updateMantraStreak: (streak: MantraStreak) => void;
    logBreathingSession: (session: BreathingSession) => void;
    logMeditationSession: (session: MeditationSession) => void;
    saveJournalEntry: (entry: JournalEntry) => void;
    updateStreak: (streakData: StreakData) => void;
    earnBadge: (badge: Badge) => void;
    addXP: (action: string, amount: number) => void;
    toggleAdhdMode: () => void;
    getTodayHabitLogs: () => HabitLog[];
    getTodayCompletionRate: () => number;
    getConsistencyScore: () => number;
    resetHabitData: () => void;
    resetAll: () => void;
}

// ─── Storage ────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'onesutra_lifestyle_v2';

function loadFromStorage(): Partial<LifestyleState> {
    if (typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const data = JSON.parse(raw);
        // ── One-time habit reset (version gate) ─────────────────────────────
        // Any saved data without _resetVersion >= 1 is test data — wipe it.
        // Profile/Prakriti onboarding is preserved (it lives in doshaStore).
        if (!data._resetVersion || data._resetVersion < 1) {
            data.habits = [];
            data.habitLogs = [];
            data.streaks = {};
            data.badges = [];
            data.xp = { total: 0, level: 0, history: [] };
            data.moodLogs = [];
            data._resetVersion = 1;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
        // ── Morning habit merge (v2) ─────────────────────────────────────────
        // Consolidate all breathing / mantra / meditation morning habits into
        // the single 'Morning Meditation' entry. v2 expands keyword list.
        if (!data._habitMergeV2 && Array.isArray(data.habits)) {
            const MERGE_IDS = new Set(['h_breathing', 'h_meditation', 'h_morning_breathing', 'h_morning_mantra', 'h_mantra']);
            const MERGE_KEYWORDS = ['breathing', 'breath', 'pranayam', 'mantra', 'meditation', 'dhyan', 'japa', 'chanting'];
            const isMorningDuplicate = (h: HabitItem) =>
                (MERGE_IDS.has(h.id) || MERGE_KEYWORDS.some(kw => h.name.toLowerCase().includes(kw))) &&
                h.id !== 'h_morning_meditation';
            const hasMerged = data.habits.some((h: HabitItem) => h.id === 'h_morning_meditation');
            data.habits = data.habits.filter((h: HabitItem) => !isMorningDuplicate(h));
            if (!hasMerged) {
                data.habits = [{ ...MORNING_MEDITATION_HABIT, createdAt: Date.now() }, ...data.habits];
            }
            data._habitMergeV1 = true;
            data._habitMergeV2 = true;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
        // ── Starter habits v3: auto-populate full morning & evening suite ────
        // Adds any missing default habits by ID — non-destructive, runs once.
        if (!data._starterHabitsV3 && Array.isArray(data.habits)) {
            const existingIds = new Set(data.habits.map((h: HabitItem) => h.id));
            const toAdd = DEFAULT_STARTER_HABITS.filter(h => !existingIds.has(h.id));
            if (toAdd.length > 0) {
                data.habits = [...data.habits, ...toAdd.map(h => ({ ...h, createdAt: Date.now() }))];
            }
            data._starterHabitsV3 = true;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
        // ── Starter habits v4: bathing, breakfast, noon, evening, night slots ──
        if (!data._starterHabitsV4 && Array.isArray(data.habits)) {
            const V4_NEW_IDS = ['h_bathing', 'h_breakfast', 'h_noon_checkin', 'h_evening_meditation', 'h_digital_detox'];
            const existingIds = new Set(data.habits.map((h: HabitItem) => h.id));
            const toAdd = DEFAULT_STARTER_HABITS.filter(h => V4_NEW_IDS.includes(h.id) && !existingIds.has(h.id));
            if (toAdd.length > 0) {
                data.habits = [...data.habits, ...toAdd.map(h => ({ ...h, createdAt: Date.now() }))];
            }
            // Fix h_sleep_early to night category for existing users
            data.habits = data.habits.map((h: HabitItem) =>
                h.id === 'h_sleep_early' ? { ...h, category: 'night' } : h
            );
            data._starterHabitsV4 = true;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
        // ── Starter habits v6: Wake Before 6am as first morning habit ───────
        if (!data._starterHabitsV6 && Array.isArray(data.habits)) {
            const existingIds = new Set(data.habits.map((h: HabitItem) => h.id));
            if (!existingIds.has('h_wake_early')) {
                const wakeHabit = DEFAULT_STARTER_HABITS.find(h => h.id === 'h_wake_early');
                if (wakeHabit) data.habits = [{ ...wakeHabit, createdAt: Date.now() }, ...data.habits];
            }
            data._starterHabitsV6 = true;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
        // ── Starter habits v7: force h_wake_early isActive:true + rename to Rise and Shine ──
        if (!data._starterHabitsV7 && Array.isArray(data.habits)) {
            data.habits = data.habits.map((h: HabitItem) =>
                h.id === 'h_wake_early'
                    ? { ...h, isActive: true, name: 'Rise and Shine' }
                    : h
            );
            // Also add it if completely missing
            if (!data.habits.some((h: HabitItem) => h.id === 'h_wake_early')) {
                const wakeHabit = DEFAULT_STARTER_HABITS.find(h => h.id === 'h_wake_early');
                if (wakeHabit) data.habits = [{ ...wakeHabit, createdAt: Date.now() }, ...data.habits];
            }
            data._starterHabitsV7 = true;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
        // ── Starter habits v5: digital sunset + brain dump as evening habits ──
        if (!data._starterHabitsV5 && Array.isArray(data.habits)) {
            const V5_NEW_IDS = ['h_digital_sunset', 'h_brain_dump'];
            const existingIds = new Set(data.habits.map((h: HabitItem) => h.id));
            const toAdd = DEFAULT_STARTER_HABITS.filter(h => V5_NEW_IDS.includes(h.id) && !existingIds.has(h.id));
            if (toAdd.length > 0) {
                data.habits = [...data.habits, ...toAdd.map(h => ({ ...h, createdAt: Date.now() }))];
            }
            data._starterHabitsV5 = true;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
        return data;
    } catch { return {}; }
}

function persistState(state: LifestyleState) {
    if (typeof window === 'undefined') return;
    try {
        const toSave = {
            profile: state.profile,
            habits: state.habits,
            habitLogs: state.habitLogs.slice(0, 1000),
            streaks: state.streaks,
            moodLogs: state.moodLogs.slice(0, 365),
            gunaLogs: state.gunaLogs.slice(0, 365),
            mantraSessions: state.mantraSessions.slice(0, 500),
            mantraStreaks: state.mantraStreaks,
            breathingSessions: state.breathingSessions.slice(0, 200),
            meditationSessions: state.meditationSessions.slice(0, 200),
            journalEntries: state.journalEntries.slice(0, 200),
            badges: state.badges,
            xp: state.xp,
            adhdMode: state.adhdMode,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch { /* ignore */ }
}

// ─── XP / Level thresholds ─────────────────────────────────────────────────────

// ─── Ashrama Progression System ───────────────────────────────────────────────
// Based on the four stages of life from ancient Vedic wisdom.
// Each stage has sub-levels within it for granular progression.
export const LEVELS = [
    // Brahmacharya — The Student Stage
    { name: 'Brahmacharya I', minXP: 0, icon: '📿', ashrama: 'brahmacharya', subtitle: 'Sowing the seeds of practice' },
    { name: 'Brahmacharya II', minXP: 150, icon: '📿', ashrama: 'brahmacharya', subtitle: 'Daily rhythm is forming' },
    { name: 'Brahmacharya III', minXP: 350, icon: '📿', ashrama: 'brahmacharya', subtitle: 'Foundation of discipline' },
    // Grihastha — The Householder Stage
    { name: 'Grihastha I', minXP: 700, icon: '🏡', ashrama: 'grihastha', subtitle: 'Balancing dharma and life' },
    { name: 'Grihastha II', minXP: 1400, icon: '🏡', ashrama: 'grihastha', subtitle: 'Embodied conscious living' },
    { name: 'Grihastha III', minXP: 2500, icon: '🏡', ashrama: 'grihastha', subtitle: 'Mastery in the household' },
    // Vanaprastha — The Forest Dweller
    { name: 'Vanaprastha I', minXP: 4000, icon: '🌳', ashrama: 'vanaprastha', subtitle: 'Turning inward with wisdom' },
    { name: 'Vanaprastha II', minXP: 6000, icon: '🌳', ashrama: 'vanaprastha', subtitle: 'Deepening spiritual vision' },
    // Sannyasa — The Renunciate
    { name: 'Sannyasa', minXP: 9000, icon: '🔱', ashrama: 'sannyasa', subtitle: 'Touched by the infinite' },
];

export function getLevelFromXP(xp: number) {
    let level = LEVELS[0];
    for (const l of LEVELS) {
        if (xp >= l.minXP) level = l;
    }
    return level;
}

export function getNextLevel(xp: number) {
    for (let i = 0; i < LEVELS.length - 1; i++) {
        if (xp < LEVELS[i + 1].minXP) return LEVELS[i + 1];
    }
    return null;
}

// ─── Streak helpers ────────────────────────────────────────────────────────────

export function computeNewStreak(existing: StreakData | undefined, today: string): StreakData {
    const base: StreakData = existing ?? {
        habitId: '',
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: null,
        startDate: null,
        totalCompletions: 0,
    };

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newCurrent: number;
    if (base.lastCompletedDate === today) {
        newCurrent = base.currentStreak;
    } else if (base.lastCompletedDate === yesterdayStr) {
        newCurrent = base.currentStreak + 1;
    } else {
        newCurrent = 1;
    }

    return {
        ...base,
        currentStreak: newCurrent,
        longestStreak: Math.max(base.longestStreak, newCurrent),
        lastCompletedDate: today,
        startDate: base.startDate ?? today,
        totalCompletions: base.totalCompletions + (base.lastCompletedDate === today ? 0 : 1),
    };
}

export function getToday(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

// ─── Default onboarding habits by life area ────────────────────────────────────

export const MORNING_MEDITATION_HABIT: HabitItem = { id: 'h_morning_meditation', name: 'Morning Meditation', icon: '🧘', category: 'morning', lifeArea: 'spiritual', trackingType: 'duration', targetValue: 20, color: '#a78bfa', frequency: 'daily', isActive: true, createdAt: Date.now(), description: 'Breathing · Mantra · Dhyan — your sacred morning trinity' };

export const DEFAULT_STARTER_HABITS: HabitItem[] = [
    { id: 'h_wake_early', name: 'Rise and Shine', icon: '🌅', category: 'morning', lifeArea: 'mental', trackingType: 'checkbox', color: '#fbbf24', frequency: 'daily', isActive: true, createdAt: Date.now(), description: 'Rise in Brahma Muhurta — the sacred window of clarity, 2 hours before sunrise' },
    MORNING_MEDITATION_HABIT,
    { id: 'h_pranayama', name: 'Pranayama', icon: '🌬️', category: 'morning', lifeArea: 'spiritual', trackingType: 'duration', targetValue: 10, color: '#22d3ee', frequency: 'daily', isActive: true, createdAt: Date.now(), description: 'Alternate nostril breathing — calms Vata, balances prana, clears nadis' },
    { id: 'h_tongue_scraping', name: 'Tongue Scraping', icon: '✨', category: 'morning', lifeArea: 'physical', trackingType: 'checkbox', color: '#4ade80', frequency: 'daily', isActive: true, createdAt: Date.now(), description: 'Ayurvedic oral detox — 7–14 copper scraper strokes removes overnight Ama' },
    { id: 'h_bathing', name: 'Morning Bath', icon: '🚿', category: 'morning', lifeArea: 'physical', trackingType: 'checkbox', color: '#38bdf8', frequency: 'daily', isActive: true, createdAt: Date.now(), description: 'Ayurvedic snana — purifies body, activates prana and awakens all senses' },
    { id: 'h_warm_water', name: 'Warm Water Ritual', icon: '🫗', category: 'morning', lifeArea: 'physical', trackingType: 'checkbox', color: '#fde68a', frequency: 'daily', isActive: true, createdAt: Date.now(), description: 'Warm water upon waking kindles Agni and begins morning cleansing' },
    { id: 'h_morning_sunlight', name: 'Morning Sunlight', icon: '🌅', category: 'morning', lifeArea: 'physical', trackingType: 'duration', targetValue: 5, color: '#fb923c', frequency: 'daily', isActive: true, createdAt: Date.now(), description: 'First light — 5 min to sync your circadian rhythm with the natural cycle' },
    { id: 'h_gratitude', name: 'Gratitude Log', icon: '🙏', category: 'morning', lifeArea: 'mental', trackingType: 'counter', targetValue: 3, color: '#fbbf24', frequency: 'daily', isActive: true, createdAt: Date.now(), description: 'Write 3 things you are genuinely grateful for' },
    { id: 'h_breakfast', name: 'Mindful Breakfast', icon: '🥣', category: 'morning', lifeArea: 'physical', trackingType: 'checkbox', color: '#86efac', frequency: 'daily', isActive: true, createdAt: Date.now(), description: 'First meal — eat with awareness, no screens, honour your Agni' },
    { id: 'h_water', name: 'Hydration', icon: '💧', category: 'anytime', lifeArea: 'physical', trackingType: 'counter', targetValue: 8, color: '#60a5fa', frequency: 'daily', isActive: true, createdAt: Date.now(), description: 'Drink 8 glasses of water throughout the day' },
    { id: 'h_noon_checkin', name: 'Noon Mindfulness', icon: '☀️', category: 'midday', lifeArea: 'mental', trackingType: 'checkbox', color: '#fb923c', frequency: 'daily', isActive: true, createdAt: Date.now(), description: 'Midday pause — 5 min breath awareness, observe your pitta energy' },
    { id: 'h_walk', name: 'Evening Walk', icon: '🚶', category: 'evening', lifeArea: 'physical', trackingType: 'duration', targetValue: 20, color: '#4ade80', frequency: 'daily', isActive: true, createdAt: Date.now(), description: '20 min mindful evening walk — aids digestion and grounds Vata' },
    { id: 'h_evening_meditation', name: 'Evening Meditation', icon: '🕯️', category: 'evening', lifeArea: 'spiritual', trackingType: 'duration', targetValue: 10, color: '#a78bfa', frequency: 'daily', isActive: true, createdAt: Date.now(), description: 'Sandhya — evening transition ritual, release the day with stillness' },
    { id: 'h_sleep_early', name: 'Sleep by 10 PM', icon: '🌙', category: 'night', lifeArea: 'physical', trackingType: 'checkbox', color: '#818cf8', frequency: 'daily', isActive: true, createdAt: Date.now(), description: 'Honour the Pitta night cycle — restore Ojas before midnight' },
    { id: 'h_digital_detox', name: 'Screen Detox', icon: '📵', category: 'night', lifeArea: 'mental', trackingType: 'checkbox', color: '#c084fc', frequency: 'daily', isActive: true, createdAt: Date.now(), description: 'No screens 1 hour before sleep — protect melatonin and Ojas' },
    { id: 'h_digital_sunset', name: 'Digital Sunset', icon: '📵', category: 'evening', lifeArea: 'mental', trackingType: 'checkbox', color: '#fb923c', frequency: 'daily', isActive: true, createdAt: Date.now(), description: 'Screens off by evening — protect melatonin, honour the body\'s natural wind-down cycle' },
    { id: 'h_brain_dump', name: 'Brain Dump', icon: '📓', category: 'evening', lifeArea: 'mental', trackingType: 'checkbox', color: '#2dd4bf', frequency: 'daily', isActive: true, createdAt: Date.now(), description: 'Evening reflection — empty the mind on paper, plan tomorrow, release the day' },
];

// ─── Store ─────────────────────────────────────────────────────────────────────

const saved = loadFromStorage();

export const useLifestyleStore = create<LifestyleState>((set, get) => ({
    profile: (saved as any).profile ?? null,
    habits: (saved as any).habits ?? [],
    habitLogs: (saved as any).habitLogs ?? [],
    streaks: (saved as any).streaks ?? {},
    moodLogs: (saved as any).moodLogs ?? [],
    gunaLogs: (saved as any).gunaLogs ?? [],
    mantraSessions: (saved as any).mantraSessions ?? [],
    mantraStreaks: (saved as any).mantraStreaks ?? {},
    breathingSessions: (saved as any).breathingSessions ?? [],
    meditationSessions: (saved as any).meditationSessions ?? [],
    journalEntries: (saved as any).journalEntries ?? [],
    badges: (saved as any).badges ?? [],
    xp: (saved as any).xp ?? { total: 0, level: 0, history: [] },
    adhdMode: (saved as any).adhdMode ?? false,

    setProfile: (profile) => set((s) => { const n = { ...s, profile }; persistState(n as LifestyleState); return n; }),
    updateProfile: (updates) => set((s) => {
        const profile = s.profile ? { ...s.profile, ...updates } : null;
        const n = { ...s, profile };
        persistState(n as LifestyleState);
        return n;
    }),

    addHabit: (habit) => set((s) => {
        const habits = [habit, ...s.habits.filter(h => h.id !== habit.id)];
        const n = { ...s, habits };
        persistState(n as LifestyleState);
        return n;
    }),

    updateHabit: (id, updates) => set((s) => {
        const habits = s.habits.map(h => h.id === id ? { ...h, ...updates } : h);
        const n = { ...s, habits };
        persistState(n as LifestyleState);
        return n;
    }),

    removeHabit: (id) => set((s) => {
        const habits = s.habits.filter(h => h.id !== id);
        const n = { ...s, habits };
        persistState(n as LifestyleState);
        return n;
    }),

    logHabit: (log) => set((s) => {
        const habitLogs = [log, ...s.habitLogs.filter(l => !(l.habitId === log.habitId && l.date === log.date))];
        const existingStreak = s.streaks[log.habitId];
        const newStreak = log.completed ? computeNewStreak({ ...existingStreak, habitId: log.habitId }, log.date) : existingStreak;
        const streaks = log.completed ? { ...s.streaks, [log.habitId]: newStreak } : s.streaks;
        const n = { ...s, habitLogs, streaks };
        persistState(n as LifestyleState);
        return n;
    }),

    logMood: (log) => set((s) => {
        const moodLogs = [log, ...s.moodLogs.filter(l => l.date !== log.date)];
        const n = { ...s, moodLogs };
        persistState(n as LifestyleState);
        return n;
    }),

    logGuna: (log) => set((s) => {
        const gunaLogs = [log, ...s.gunaLogs.filter(l => l.date !== log.date)];
        const n = { ...s, gunaLogs };
        persistState(n as LifestyleState);
        return n;
    }),

    logMantraSession: (session) => set((s) => {
        const mantraSessions = [session, ...s.mantraSessions];
        const existing = s.mantraStreaks[session.mantraId];
        const today = session.date;
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().split('T')[0];
        let cur = existing?.currentStreak ?? 0;
        if (existing?.lastCompletedDate === today) { /* same day — no change */ }
        else if (existing?.lastCompletedDate === yStr) { cur += 1; }
        else { cur = 1; }
        const mantraStreaks = {
            ...s.mantraStreaks,
            [session.mantraId]: {
                mantraId: session.mantraId,
                currentStreak: cur,
                longestStreak: Math.max(existing?.longestStreak ?? 0, cur),
                lastCompletedDate: today,
                totalSessions: (existing?.totalSessions ?? 0) + 1,
                totalRepetitions: (existing?.totalRepetitions ?? 0) + session.repetitionCount,
                challengeActive: existing?.challengeActive,
                challengeStartDate: existing?.challengeStartDate,
                challengeDays: existing?.challengeDays,
            },
        };
        const n = { ...s, mantraSessions, mantraStreaks };
        persistState(n as LifestyleState);
        return n;
    }),

    updateMantraStreak: (streak) => set((s) => {
        const mantraStreaks = { ...s.mantraStreaks, [streak.mantraId]: streak };
        const n = { ...s, mantraStreaks };
        persistState(n as LifestyleState);
        return n;
    }),

    logBreathingSession: (session) => set((s) => {
        const breathingSessions = [session, ...s.breathingSessions];
        const n = { ...s, breathingSessions };
        persistState(n as LifestyleState);
        return n;
    }),

    logMeditationSession: (session) => set((s) => {
        const meditationSessions = [session, ...s.meditationSessions];
        const n = { ...s, meditationSessions };
        persistState(n as LifestyleState);
        return n;
    }),

    saveJournalEntry: (entry) => set((s) => {
        const journalEntries = [entry, ...s.journalEntries.filter(e => e.id !== entry.id)];
        const n = { ...s, journalEntries };
        persistState(n as LifestyleState);
        return n;
    }),

    updateStreak: (streakData) => set((s) => {
        const streaks = { ...s.streaks, [streakData.habitId]: streakData };
        const n = { ...s, streaks };
        persistState(n as LifestyleState);
        return n;
    }),

    earnBadge: (badge) => set((s) => {
        if (s.badges.some(b => b.id === badge.id)) return s;
        const badges = [...s.badges, badge];
        const n = { ...s, badges };
        persistState(n as LifestyleState);
        return n;
    }),

    addXP: (action, amount) => set((s) => {
        const today = getToday();
        const newTotal = s.xp.total + amount;
        const level = LEVELS.reduce((acc, l, i) => newTotal >= l.minXP ? i : acc, 0);
        const xp: XPRecord = {
            total: newTotal,
            level,
            history: [{ action, xp: amount, date: today }, ...s.xp.history.slice(0, 99)],
        };
        const n = { ...s, xp };
        persistState(n as LifestyleState);
        return n;
    }),

    toggleAdhdMode: () => set((s) => {
        const n = { ...s, adhdMode: !s.adhdMode };
        persistState(n as LifestyleState);
        return n;
    }),

    getTodayHabitLogs: () => {
        const today = getToday();
        return get().habitLogs.filter(l => l.date === today);
    },

    resetAll: () => set(() => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
        }
        return {
            profile: null,
            habits: [],
            habitLogs: [],
            streaks: {},
            moodLogs: [],
            gunaLogs: [],
            mantraSessions: [],
            mantraStreaks: {},
            breathingSessions: [],
            meditationSessions: [],
            journalEntries: [],
            badges: [],
            xp: { total: 0, level: 0, history: [] },
            adhdMode: false,
        };
    }),

    resetHabitData: () => set((s) => {
        const n = {
            ...s,
            habits: [],
            habitLogs: [],
            streaks: {},
            badges: [],
            xp: { total: 0, level: 0, history: [] },
            moodLogs: [],
        };
        if (typeof window !== 'undefined') {
            const toSave = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
            toSave.habits = [];
            toSave.habitLogs = [];
            toSave.streaks = {};
            toSave.badges = [];
            toSave.xp = { total: 0, level: 0, history: [] };
            toSave.moodLogs = [];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        }
        return n;
    }),

    getTodayCompletionRate: () => {
        const today = getToday();
        const { habits, habitLogs } = get();
        const activeHabits = habits.filter(h => h.isActive);
        if (!activeHabits.length) return 0;
        const todayLogs = habitLogs.filter(l => l.date === today && l.completed);
        const completedIds = new Set(todayLogs.map(l => l.habitId));
        const completed = activeHabits.filter(h => completedIds.has(h.id)).length;
        return Math.round((completed / activeHabits.length) * 100);
    },

    getConsistencyScore: () => {
        const { habits, habitLogs } = get();
        const activeHabits = habits.filter(h => h.isActive);
        if (!activeHabits.length) return 0;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        const recent = habitLogs.filter(l => l.completed && new Date(l.date) >= cutoff);
        const possible = activeHabits.length * 7;
        return Math.min(100, Math.round((recent.length / possible) * 100));
    },
}));
