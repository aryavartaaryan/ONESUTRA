'use client';

/**
 * useLifestyleEngine — Core hook for the ONESUTRA Lifestyle Module
 * Bridges local Zustand store with Firebase for persistence + real-time sync.
 */

import { useEffect, useCallback } from 'react';
import {
    useLifestyleStore,
    getToday,
    computeNewStreak,
    DEFAULT_STARTER_HABITS,
    type HabitItem,
    type HabitLog,
    type MantraSession,
    type BreathingSession,
    type MeditationSession,
    type MoodLog,
    type JournalEntry,
    type LifestyleProfile,
} from '@/stores/lifestyleStore';
import { useOneSutraAuth } from './useOneSutraAuth';

// ─── XP values per action ──────────────────────────────────────────────────────
const XP_TABLE: Record<string, number> = {
    habit_complete: 10,
    mantra_session: 25,
    breathing_session: 15,
    meditation_session: 20,
    journal_entry: 12,
    mood_log: 5,
    streak_3: 20,
    streak_7: 50,
    streak_14: 80,
    streak_21: 100,
    streak_30: 150,
    streak_40: 200,
    streak_66: 300,
    streak_100: 500,
};

// ─── Streak milestone badges ───────────────────────────────────────────────────
const STREAK_MILESTONES = [3, 7, 14, 21, 30, 40, 48, 66, 100];

export function useLifestyleEngine() {
    const { user } = useOneSutraAuth();
    const store = useLifestyleStore();

    // ── Sync profile to Firestore ──────────────────────────────────────────────
    const syncProfileToFirestore = useCallback(async (profile: LifestyleProfile) => {
        if (!user?.uid) return;
        try {
            const { getFirebaseFirestore } = await import('@/lib/firebase');
            const { doc, setDoc } = await import('firebase/firestore');
            const db = await getFirebaseFirestore();
            await setDoc(doc(db, 'users', user.uid), {
                lifestyle_profile: profile,
                lifestyle_profile_updatedAt: Date.now(),
            }, { merge: true });
        } catch { /* offline — ok */ }
    }, [user?.uid]);

    // ── Load profile from Firestore on mount ──────────────────────────────────
    useEffect(() => {
        if (!user?.uid || store.profile?.onboardingComplete) return;
        (async () => {
            try {
                const { getFirebaseFirestore } = await import('@/lib/firebase');
                const { doc, getDoc } = await import('firebase/firestore');
                const db = await getFirebaseFirestore();
                const snap = await getDoc(doc(db, 'users', user.uid));
                if (!snap.exists()) return;
                const data = snap.data();
                if (data?.lifestyle_profile?.onboardingComplete) {
                    store.setProfile(data.lifestyle_profile);
                }
            } catch { /* offline */ }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.uid]);

    // ── Seed starter habits if user has none ──────────────────────────────────
    const seedStarterHabits = useCallback(() => {
        if (store.habits.length === 0) {
            DEFAULT_STARTER_HABITS.forEach(h => store.addHabit({ ...h, createdAt: Date.now() }));
        }
    }, [store]);

    // ── Complete a habit for today ─────────────────────────────────────────────
    const completeHabit = useCallback(async (habitId: string, value?: number) => {
        const today = getToday();
        const log: HabitLog = {
            habitId,
            date: today,
            completed: true,
            value,
            loggedAt: Date.now(),
        };
        store.logHabit(log);
        store.addXP('habit_complete', XP_TABLE.habit_complete);

        // Check streak milestones
        const existing = store.streaks[habitId];
        const newStreak = computeNewStreak({ ...existing, habitId }, today);
        if (STREAK_MILESTONES.includes(newStreak.currentStreak)) {
            store.addXP(`streak_${newStreak.currentStreak}`, XP_TABLE[`streak_${newStreak.currentStreak}`] ?? 50);
            // Check for badge
            checkAndAwardStreakBadge(habitId, newStreak.currentStreak);
        }

        // Persist to Firestore async
        if (user?.uid) {
            try {
                const { getFirebaseFirestore } = await import('@/lib/firebase');
                const { doc, setDoc } = await import('firebase/firestore');
                const db = await getFirebaseFirestore();
                await setDoc(doc(db, 'users', user.uid, 'habit_logs', `${habitId}_${today}`), {
                    ...log, uid: user.uid,
                }, { merge: true });
            } catch { /* offline */ }
        }
    }, [store, user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Skip a habit for today ─────────────────────────────────────────────────
    const skipHabit = useCallback((habitId: string, reason?: string) => {
        const today = getToday();
        store.logHabit({
            habitId,
            date: today,
            completed: false,
            skippedReason: reason ?? 'skipped',
            loggedAt: Date.now(),
        });
    }, [store]);

    // ── Log mantra session ─────────────────────────────────────────────────────
    const logMantraSession = useCallback(async (session: Omit<MantraSession, 'id' | 'date' | 'loggedAt'>) => {
        const full: MantraSession = {
            ...session,
            id: `ms_${Date.now()}`,
            date: getToday(),
            loggedAt: Date.now(),
        };
        store.logMantraSession(full);
        store.addXP('mantra_session', XP_TABLE.mantra_session);

        if (user?.uid) {
            try {
                const { getFirebaseFirestore } = await import('@/lib/firebase');
                const { collection, addDoc } = await import('firebase/firestore');
                const db = await getFirebaseFirestore();
                await addDoc(collection(db, 'users', user.uid, 'mantra_sessions'), { ...full, uid: user.uid });
            } catch { /* offline */ }
        }
    }, [store, user?.uid]);

    // ── Log breathing session ──────────────────────────────────────────────────
    const logBreathingSession = useCallback(async (session: Omit<BreathingSession, 'id' | 'date' | 'loggedAt'>) => {
        const full: BreathingSession = {
            ...session,
            id: `bs_${Date.now()}`,
            date: getToday(),
            loggedAt: Date.now(),
        };
        store.logBreathingSession(full);
        store.addXP('breathing_session', XP_TABLE.breathing_session);

        if (user?.uid) {
            try {
                const { getFirebaseFirestore } = await import('@/lib/firebase');
                const { collection, addDoc } = await import('firebase/firestore');
                const db = await getFirebaseFirestore();
                await addDoc(collection(db, 'users', user.uid, 'breathing_sessions'), { ...full, uid: user.uid });
            } catch { /* offline */ }
        }
    }, [store, user?.uid]);

    // ── Log meditation session ─────────────────────────────────────────────────
    const logMeditationSession = useCallback(async (session: Omit<MeditationSession, 'id' | 'date' | 'loggedAt'>) => {
        const full: MeditationSession = {
            ...session,
            id: `med_${Date.now()}`,
            date: getToday(),
            loggedAt: Date.now(),
        };
        store.logMeditationSession(full);
        store.addXP('meditation_session', XP_TABLE.meditation_session);
    }, [store]);

    // ── Log mood ───────────────────────────────────────────────────────────────
    const logMood = useCallback((mood: number, energy: number, tags: string[], note?: string) => {
        const log: MoodLog = {
            date: getToday(),
            mood,
            energy,
            tags,
            note,
            loggedAt: Date.now(),
        };
        store.logMood(log);
        store.addXP('mood_log', XP_TABLE.mood_log);
    }, [store]);

    // ── Save journal entry ─────────────────────────────────────────────────────
    const saveJournalEntry = useCallback((entry: Omit<JournalEntry, 'id' | 'date' | 'loggedAt'>) => {
        const full: JournalEntry = {
            ...entry,
            id: `je_${Date.now()}`,
            date: getToday(),
            loggedAt: Date.now(),
        };
        store.saveJournalEntry(full);
        store.addXP('journal_entry', XP_TABLE.journal_entry);
    }, [store]);

    // ── Complete onboarding ────────────────────────────────────────────────────
    const completeOnboarding = useCallback(async (profile: LifestyleProfile) => {
        const finalProfile: LifestyleProfile = {
            ...profile,
            onboardingComplete: true,
            onboardingCompletedAt: Date.now(),
        };
        store.setProfile(finalProfile);
        seedStarterHabits();
        await syncProfileToFirestore(finalProfile);
    }, [store, seedStarterHabits, syncProfileToFirestore]);

    // ── Check and award streak badge ───────────────────────────────────────────
    const checkAndAwardStreakBadge = useCallback((habitId: string, streak: number) => {
        const BADGE_MAP: Record<number, { name: string; description: string; icon: string }> = {
            3: { name: 'First Flame', description: '3-day streak — the fire begins', icon: '🔥' },
            7: { name: 'Still Waters', description: '7-day streak — one full week', icon: '💧' },
            14: { name: 'Fortnight Warrior', description: '14-day streak — two steady weeks', icon: '⚔️' },
            21: { name: 'Habit Formed', description: '21-day streak — a habit is born', icon: '🌱' },
            30: { name: 'Month Master', description: '30-day streak — a full month of practice', icon: '🌙' },
            40: { name: 'The Sadhaka', description: '40-day sadhana complete', icon: '🕉️' },
            66: { name: 'Deep Root', description: '66 days — science says this is permanence', icon: '🌳' },
            100: { name: 'Centurion', description: '100-day streak — a true transformation', icon: '💎' },
        };
        const meta = BADGE_MAP[streak];
        if (!meta) return;
        store.earnBadge({
            id: `streak_${habitId}_${streak}`,
            ...meta,
            earnedAt: Date.now(),
            category: 'streak',
        });
    }, [store]);

    // ── Get today's habit completion status ───────────────────────────────────
    const getTodayStatus = useCallback(() => {
        const today = getToday();
        const todayLogs = store.habitLogs.filter(l => l.date === today);
        const completedIds = new Set(todayLogs.filter(l => l.completed).map(l => l.habitId));
        const skippedIds = new Set(todayLogs.filter(l => !l.completed).map(l => l.habitId));
        return { completedIds, skippedIds };
    }, [store.habitLogs]);

    // ── Get habit streak display ───────────────────────────────────────────────
    const getHabitStreak = useCallback((habitId: string): number => {
        return store.streaks[habitId]?.currentStreak ?? 0;
    }, [store.streaks]);

    // ── Today's mood ──────────────────────────────────────────────────────────
    const todayMood = store.moodLogs.find(m => m.date === getToday()) ?? null;

    // ── Today's mantra sessions ───────────────────────────────────────────────
    const todayMantraSessions = store.mantraSessions.filter(s => s.date === getToday());

    // ── Recent journal entry ──────────────────────────────────────────────────
    const todayJournalEntries = store.journalEntries.filter(e => e.date === getToday());

    return {
        // State
        profile: store.profile,
        habits: store.habits,
        habitLogs: store.habitLogs,
        streaks: store.streaks,
        mantraStreaks: store.mantraStreaks,
        moodLogs: store.moodLogs,
        mantraSessions: store.mantraSessions,
        breathingSessions: store.breathingSessions,
        meditationSessions: store.meditationSessions,
        journalEntries: store.journalEntries,
        badges: store.badges,
        xp: store.xp,
        adhdMode: store.adhdMode,
        todayMood,
        todayMantraSessions,
        todayJournalEntries,

        // Derived
        todayCompletionRate: store.getTodayCompletionRate(),
        consistencyScore: store.getConsistencyScore(),
        activeHabits: store.habits.filter(h => h.isActive),

        // Actions
        completeHabit,
        skipHabit,
        logMantraSession,
        logBreathingSession,
        logMeditationSession,
        logMood,
        saveJournalEntry,
        completeOnboarding,
        addHabit: store.addHabit,
        updateHabit: store.updateHabit,
        removeHabit: store.removeHabit,
        updateMantraStreak: store.updateMantraStreak,
        toggleAdhdMode: store.toggleAdhdMode,
        getTodayStatus,
        getHabitStreak,
        seedStarterHabits,
    };
}
