import { create } from 'zustand';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type LifeArea = 'mental' | 'physical' | 'social' | 'professional' | 'financial' | 'spiritual' | 'creative';
export type HabitCategory = 'morning' | 'evening' | 'midday' | 'anytime' | 'sacred';
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
    spiritualBackground: string;
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
}

// ─── Storage ────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'onesutra_lifestyle_v2';

function loadFromStorage(): Partial<LifestyleState> {
    if (typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
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

export const LEVELS = [
    { name: 'Seedling', minXP: 0, icon: '🌱' },
    { name: 'Sprout', minXP: 100, icon: '🌿' },
    { name: 'Bloom', minXP: 300, icon: '🌸' },
    { name: 'Flourish', minXP: 700, icon: '🌺' },
    { name: 'Radiant', minXP: 1500, icon: '✨' },
    { name: 'Sage', minXP: 3000, icon: '🧘' },
    { name: 'Siddha', minXP: 7000, icon: '🔱' },
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
    return new Date().toISOString().split('T')[0];
}

// ─── Default onboarding habits by life area ────────────────────────────────────

export const DEFAULT_STARTER_HABITS: HabitItem[] = [
    { id: 'h_breathing', name: 'Breathing Practice', icon: '🌬️', category: 'morning', lifeArea: 'mental', trackingType: 'duration', targetValue: 5, color: '#22d3ee', frequency: 'daily', isActive: true, createdAt: Date.now(), description: '5 min mindful breathing to start your day' },
    { id: 'h_gratitude', name: 'Gratitude Log', icon: '🙏', category: 'morning', lifeArea: 'mental', trackingType: 'counter', targetValue: 3, color: '#fbbf24', frequency: 'daily', isActive: true, createdAt: Date.now(), description: 'Write 3 things you are grateful for' },
    { id: 'h_water', name: 'Hydration', icon: '💧', category: 'anytime', lifeArea: 'physical', trackingType: 'counter', targetValue: 8, color: '#60a5fa', frequency: 'daily', isActive: true, createdAt: Date.now(), description: 'Drink 8 glasses of water' },
    { id: 'h_walk', name: 'Evening Walk', icon: '🚶', category: 'evening', lifeArea: 'physical', trackingType: 'duration', targetValue: 20, color: '#4ade80', frequency: 'daily', isActive: true, createdAt: Date.now(), description: '20 min mindful evening walk' },
    { id: 'h_meditation', name: 'Meditation', icon: '🧘', category: 'morning', lifeArea: 'spiritual', trackingType: 'duration', targetValue: 10, color: '#a78bfa', frequency: 'daily', isActive: true, createdAt: Date.now(), description: '10 min meditation session' },
];

// ─── Store ─────────────────────────────────────────────────────────────────────

const saved = loadFromStorage();

export const useLifestyleStore = create<LifestyleState>((set, get) => ({
    profile: (saved as any).profile ?? null,
    habits: (saved as any).habits ?? [],
    habitLogs: (saved as any).habitLogs ?? [],
    streaks: (saved as any).streaks ?? {},
    moodLogs: (saved as any).moodLogs ?? [],
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
