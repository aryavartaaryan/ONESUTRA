/**
 * doshaStore.ts — Zustand store for all Ayurvedic user data
 * Persists Prakriti, Vikriti, daily logs, and dosha metrics.
 */

import { create } from 'zustand';
import type {
  Prakriti,
  Vikriti,
  DoshaScore,
  Guna,
} from '@/lib/doshaService';

// ─── Log Types ─────────────────────────────────────────────────────────────────

export type TongueCoating = 'clean' | 'slight' | 'heavy';
export type DoshaEmotionalState = 'anxious' | 'scattered' | 'irritable' | 'intense' | 'sluggish' | 'heavy' | 'content' | 'balanced';
export type DigestiveState = 'irregular' | 'sharp' | 'slow' | 'normal';
export type SleepQuality = 'restless' | 'medium' | 'deep';
export type DreamQuality = 'anxious' | 'intense' | 'heavy' | 'peaceful' | 'none';
export type WakeFeeling = 'refreshed' | 'groggy' | 'anxious' | 'neutral';

export interface DailyDoshaLog {
  date: string;
  tongueCoating?: TongueCoating;
  energyLevel?: number;
  emotionalState?: DoshaEmotionalState;
  digestiveState?: DigestiveState;
  sleepQuality?: SleepQuality;
  dreamQuality?: DreamQuality;
  wakeFeeling?: WakeFeeling;
  dominantGuna?: Guna;
  mealTiming?: number;
  loggedAt: number;
}

export interface LifestyleSnapshot {
  wakeTime: string;
  sleepTime: string;
  workType: 'desk' | 'physical' | 'irregular' | 'homemaker' | 'student';
  dietaryPreference: 'vegetarian' | 'vegan' | 'omnivore';
  location: string;
  hemisphere: 'north' | 'south';
  healthConcerns: string[];
}

export interface PraktitiAssessment {
  completedAt: number;
  answers: Record<string, string>;
  scores: DoshaScore;
  prakriti: Prakriti;
}

export interface VikritiiAssessment {
  completedAt: number;
  answers: Record<string, string>;
  scores: DoshaScore;
  vikriti: Vikriti;
}

// ─── Store Interface ────────────────────────────────────────────────────────────

interface DoshaState {
  prakritiAssessment: PraktitiAssessment | null;
  vikritiiAssessment: VikritiiAssessment | null;
  lifestyleSnapshot: LifestyleSnapshot | null;
  dailyLogs: DailyDoshaLog[];
  doshaOnboardingComplete: boolean;

  setPrakritiAssessment: (assessment: PraktitiAssessment) => void;
  setVikritiiAssessment: (assessment: VikritiiAssessment) => void;
  setLifestyleSnapshot: (snapshot: LifestyleSnapshot) => void;
  logDailyDosha: (log: DailyDoshaLog) => void;
  updateDailyLog: (date: string, updates: Partial<DailyDoshaLog>) => void;
  getTodayLog: () => DailyDoshaLog | null;
  getRecentLogs: (days: number) => DailyDoshaLog[];
  getRollingDoshaBalance: (days?: number) => DoshaScore;
  resetDoshaOnboarding: () => void;
}

// ─── Persistence ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'onesutra_dosha_v1';

function loadFromStorage(): Partial<DoshaState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function persist(state: DoshaState) {
  if (typeof window === 'undefined') return;
  try {
    const toSave = {
      prakritiAssessment: state.prakritiAssessment,
      vikritiiAssessment: state.vikritiiAssessment,
      lifestyleSnapshot: state.lifestyleSnapshot,
      dailyLogs: state.dailyLogs.slice(0, 365),
      doshaOnboardingComplete: state.doshaOnboardingComplete,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch { /* ignore */ }
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Store ─────────────────────────────────────────────────────────────────────

const saved = loadFromStorage();

export const useDoshaStore = create<DoshaState>((set, get) => ({
  prakritiAssessment: (saved as any).prakritiAssessment ?? null,
  vikritiiAssessment: (saved as any).vikritiiAssessment ?? null,
  lifestyleSnapshot: (saved as any).lifestyleSnapshot ?? null,
  dailyLogs: (saved as any).dailyLogs ?? [],
  doshaOnboardingComplete: (saved as any).doshaOnboardingComplete ?? false,

  setPrakritiAssessment: (assessment) => set((s) => {
    const n = { ...s, prakritiAssessment: assessment };
    persist(n as DoshaState);
    return n;
  }),

  setVikritiiAssessment: (assessment) => set((s) => {
    const n = { ...s, vikritiiAssessment: assessment, doshaOnboardingComplete: true };
    persist(n as DoshaState);
    return n;
  }),

  setLifestyleSnapshot: (snapshot) => set((s) => {
    const n = { ...s, lifestyleSnapshot: snapshot };
    persist(n as DoshaState);
    return n;
  }),

  logDailyDosha: (log) => set((s) => {
    const dailyLogs = [log, ...s.dailyLogs.filter(l => l.date !== log.date)];
    const n = { ...s, dailyLogs };
    persist(n as DoshaState);
    return n;
  }),

  updateDailyLog: (date, updates) => set((s) => {
    const existing = s.dailyLogs.find(l => l.date === date);
    if (existing) {
      const dailyLogs = s.dailyLogs.map(l =>
        l.date === date ? { ...l, ...updates, loggedAt: Date.now() } : l
      );
      const n = { ...s, dailyLogs };
      persist(n as DoshaState);
      return n;
    } else {
      const newLog: DailyDoshaLog = { date, ...updates, loggedAt: Date.now() };
      const dailyLogs = [newLog, ...s.dailyLogs];
      const n = { ...s, dailyLogs };
      persist(n as DoshaState);
      return n;
    }
  }),

  getTodayLog: () => {
    const today = getToday();
    return get().dailyLogs.find(l => l.date === today) ?? null;
  },

  getRecentLogs: (days = 7) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return get().dailyLogs.filter(l => new Date(l.date) >= cutoff);
  },

  getRollingDoshaBalance: (days = 7) => {
    const recent = get().getRecentLogs(days);
    if (!recent.length) return { vata: 33, pitta: 33, kapha: 34 };

    const counts: DoshaScore = { vata: 0, pitta: 0, kapha: 0 };
    let total = 0;

    recent.forEach(log => {
      if (log.emotionalState) {
        if (['anxious', 'scattered'].includes(log.emotionalState)) { counts.vata += 2; total += 2; }
        else if (['irritable', 'intense'].includes(log.emotionalState)) { counts.pitta += 2; total += 2; }
        else if (['sluggish', 'heavy'].includes(log.emotionalState)) { counts.kapha += 2; total += 2; }
        else { counts.vata += 1; counts.pitta += 1; counts.kapha += 1; total += 3; }
      }
      if (log.tongueCoating) {
        if (log.tongueCoating === 'heavy') { counts.kapha += 1; total += 1; }
        else if (log.tongueCoating === 'slight') { counts.vata += 1; total += 1; }
      }
      if (log.sleepQuality) {
        if (log.sleepQuality === 'restless') { counts.vata += 1; total += 1; }
        else if (log.sleepQuality === 'deep') { counts.kapha += 1; total += 1; }
      }
    });

    if (total === 0) return { vata: 33, pitta: 33, kapha: 34 };

    return {
      vata: Math.round((counts.vata / total) * 100),
      pitta: Math.round((counts.pitta / total) * 100),
      kapha: Math.round((counts.kapha / total) * 100),
    };
  },

  resetDoshaOnboarding: () => set((s) => {
    const n = {
      ...s,
      prakritiAssessment: null,
      vikritiiAssessment: null,
      doshaOnboardingComplete: false,
    };
    persist(n as DoshaState);
    return n;
  }),
}));
