'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sunrise, Sun, Sunset, Moon, Sparkles, Plus, CheckCircle2, Bell, Zap, Flame } from 'lucide-react';
import { getTodayLogStory, saveToDailyLogStory, getSubOptionsForHabit, type DailyLogEntry, type SubOption } from '@/components/Dashboard/SmartLogBubbles';
import { bodhiSpeakLog } from '@/lib/bodhiVoice';
import { useLifestyleEngine, logHabitAndSync } from '@/hooks/useLifestyleEngine';
import { useOneSutraAuth } from '@/hooks/useOneSutraAuth';
import { getLevelFromXP, getNextLevel, getToday, type HabitItem, type HabitCategory } from '@/stores/lifestyleStore';
import {
  findHabitWindow,
  getTimingStatus as getHabitWindowTimingStatus,
  getISTTimeStr, getISODateIST, updateLateStreak,
} from '@/lib/habitWindows';
import { getMorningMood } from '@/components/MoodGarden/MorningMoodCards';
import {
  AYURVEDIC_HABITS, AYUR_TO_H_ID, H_ID_TO_AYUR,
  getHabitsForSlot, getTodayAyurCompletedIds, setAyurHabitCompleted,
  HABIT_DISPLAY_OVERRIDES,
  type TimeSlot as AyurTimeSlot,
} from '@/lib/ayurvedicHabitsData';

function getLocalDoshaContext(habitId: string, currentStreak: number) {
  try {
    const dosha = JSON.parse(localStorage.getItem('onesutra_dosha_v1') ?? '{}');
    const prakriti: string =
      dosha?.prakritiAssessment?.prakriti?.combo ??
      dosha?.prakritiAssessment?.prakriti?.primary ?? '';
    const vikriti: string = dosha?.vikritiiAssessment?.vikriti?.primary ?? '';
    return { prakriti, vikriti, habitStreak: currentStreak };
  } catch { return { prakriti: '', vikriti: '', habitStreak: currentStreak }; }
}

function getLocalUserNameSAD(): string {
  try {
    const auth = JSON.parse(localStorage.getItem('onesutra_auth_v1') ?? '{}');
    if (auth?.name && auth.name !== 'Traveller') return auth.name.split(' ')[0];
  } catch { /* */ }
  return (typeof localStorage !== 'undefined' ? localStorage.getItem('vedic_user_name') : null) ?? 'friend';
}

// ─── Constants ────────────────────────────────────────────────────────────────
const LIFE_AREA_COLORS: Record<string, string> = {
  mental: '#22d3ee', physical: '#4ade80', social: '#fb923c',
  professional: '#fbbf24', financial: '#a78bfa', spiritual: '#c084fc', creative: '#f472b6',
};
const CAT_CFG: Record<HabitCategory, { emoji: string; label: string; color: string }> = {
  morning: { emoji: '🌅', label: 'Morning', color: '#fbbf24' },
  midday: { emoji: '☀️', label: 'Afternoon', color: '#fb923c' },
  evening: { emoji: '🌆', label: 'Evening', color: '#a78bfa' },
  night: { emoji: '🌙', label: 'Night', color: '#60a5fa' },
  anytime: { emoji: '✦', label: 'Anytime', color: '#4ade80' },
  sacred: { emoji: '🔱', label: 'Sacred', color: '#c084fc' },
};
// ─── Ayurvedic canonical order ──────────────────────────────────────────────
const MORNING_PRACTICE_ORDER_SAD: Record<string, number> = {
  h_wake_early: 0, h_warm_water: 1, h_tongue_scraping: 2,
  h_pranayama: 3, h_morning_meditation: 4, h_bathing: 5,
  h_morning_sunlight: 6, h_gratitude: 7, h_breakfast: 8,
};
// SmartLog bubble ID → lifestyle-store h_* ID (for cross-section sync)
const SMARTLOG_TO_H_ID_SAD: Record<string, string> = {
  wake: 'h_wake_early', warm_water: 'h_warm_water',
  tongue_scrape: 'h_tongue_scraping', breathwork: 'h_pranayama',
  bath: 'h_bathing', morning_light: 'h_morning_sunlight',
  breakfast: 'h_breakfast', sleep: 'h_sleep_early',
  gratitude: 'h_gratitude', hydration: 'h_water',
};
const SANSKRIT_SLOTS: Record<string, string> = {
  'Brahma Muhurta': 'ब्रह्म मुहूर्त',
  'Morning Focus': 'प्रातःकाल',
  'Midday Focus': 'मध्याह्न',
  'Evening Focus': 'सायंकाल',
  'Night Focus': 'रात्रि',
};
const AYUR_STAT_LABELS = [
  { key: 'activities', label: 'ACTIVITIES', sub: 'practices', icon: '✦' },
  { key: 'complete', label: 'COMPLETE', sub: 'done today', icon: '✅' },
  { key: 'earned', label: 'EARNED', sub: 'energy pts', icon: '⚡' },
];


// ─── SmartLog store helpers ───────────────────────────────────────────────────
function getSmartLoggedToday(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem('onesutra_smartlog_v2') ?? '{}');
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    return new Set(raw[today] ?? []);
  } catch { return new Set(); }
}
function saveToSmartLog(id: string) {
  try {
    const raw = JSON.parse(localStorage.getItem('onesutra_smartlog_v2') ?? '{}');
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    const s = new Set(raw[today] ?? []);
    s.add(id);
    raw[today] = [...s];
    localStorage.setItem('onesutra_smartlog_v2', JSON.stringify(raw));
  } catch { /* ignore */ }
}

// ─── SVG Progress Ring ────────────────────────────────────────────────────────
function ProgressRing({ pct, size, stroke, color }: { pct: number; size: number; stroke: number; color: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
        style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
      />
    </svg>
  );
}

// ─── Time-slot config ─────────────────────────────────────────────────────────
function getTimeSlotConfig() {
  const h = new Date().getHours();
  if (h >= 2 && h < 6) return { label: 'Brahma Muhurta', slotKey: 'morning' as HabitCategory, emoji: '🌟', color: '#fbbf24', Icon: Sparkles };
  if (h >= 6 && h < 11) return { label: 'Morning Focus', slotKey: 'morning' as HabitCategory, emoji: '🌅', color: '#fbbf24', Icon: Sunrise };
  if (h >= 11 && h < 15) return { label: 'Midday Focus', slotKey: 'midday' as HabitCategory, emoji: '☀️', color: '#fb923c', Icon: Sun };
  if (h >= 15 && h < 18) return { label: 'Evening Focus', slotKey: 'evening' as HabitCategory, emoji: '�', color: '#f97316', Icon: Sunset };
  if (h >= 18 && h < 22) return { label: 'Evening Focus', slotKey: 'evening' as HabitCategory, emoji: '🌆', color: '#a78bfa', Icon: Sunset };
  return { label: 'Night Focus', slotKey: 'night' as HabitCategory, emoji: '🌙', color: '#60a5fa', Icon: Moon };
}

// ─── Mini Habit Card — ultra-compact single-row style ────────────────────────
function MiniHabitCard({ habit, isCompleted, streak, onComplete }: {
  habit: HabitItem; isCompleted: boolean; streak: number; onComplete: (id: string) => void;
}) {
  const [flash, setFlash] = useState(false);
  const color = LIFE_AREA_COLORS[habit.lifeArea] ?? '#a78bfa';
  const handleTap = useCallback(() => {
    if (isCompleted) return;
    setFlash(true); onComplete(habit.id); setTimeout(() => setFlash(false), 550);
  }, [isCompleted, habit.id, onComplete]);
  return (
    <motion.div layout initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
      whileTap={!isCompleted ? { scale: 0.97 } : {}} onClick={handleTap}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.48rem',
        padding: '0.35rem 0.55rem 0.35rem 0', marginBottom: '0.18rem',
        borderRadius: 10, position: 'relative', overflow: 'hidden',
        background: isCompleted ? `${color}0d` : 'transparent',
        borderBottom: `1px solid rgba(255,255,255,0.045)`,
        cursor: isCompleted ? 'default' : 'pointer',
      }}>
      <AnimatePresence>
        {flash && <motion.div initial={{ opacity: 0.7, x: '-100%' }} animate={{ opacity: 0, x: '100%' }} exit={{ opacity: 0 }}
          transition={{ duration: 0.48 }}
          style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg,transparent,${color}38,transparent)`, zIndex: 5, pointerEvents: 'none' }} />}
      </AnimatePresence>
      <div style={{ width: 3, height: 22, borderRadius: 2, flexShrink: 0, marginLeft: 3, background: color, opacity: isCompleted ? 0.75 : 0.38, boxShadow: isCompleted ? `0 0 6px ${color}80` : 'none' }} />
      <span style={{ fontSize: '1rem', flexShrink: 0, lineHeight: 1, opacity: isCompleted ? 0.7 : 1 }}>{habit.icon}</span>
      <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: 700, color: isCompleted ? color : 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Outfit',sans-serif", opacity: isCompleted ? 0.82 : 1 }}>{habit.name}</span>
      {streak > 0 && <span style={{ fontSize: '0.56rem', color: streak >= 7 ? '#fbbf24' : '#fb923c', fontWeight: 800, flexShrink: 0, fontFamily: "'Outfit',sans-serif" }}>{streak >= 21 ? '🔱' : '🔥'}{streak}</span>}
      {isCompleted
        ? <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
            <CheckCircle2 size={14} style={{ color, flexShrink: 0, opacity: 0.85 }} />
          </motion.div>
        : <motion.div animate={{ opacity: [0.28, 0.5, 0.28] }} transition={{ duration: 2.2, repeat: Infinity }}
            style={{ width: 17, height: 17, borderRadius: '50%', border: `1.5px solid rgba(255,255,255,0.2)`, flexShrink: 0 }} />
      }
    </motion.div>
  );
}

// QuickAddModal removed — Add Habit navigates to /lifestyle/ayurvedic-habits

export default function SmartAnalyticsDashboard({ globalBg }: { globalBg?: string }) {
  const [logStory, setLogStory] = useState<DailyLogEntry[]>([]);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'done' | 'activity'>('pending');
  const [celebrateId, setCelebrateId] = useState<string | null>(null);
  const [smartLoggedToday, setSmartLoggedToday] = useState<Set<string>>(new Set());
  const [activeSubHabitId, setActiveSubHabitId] = useState<string | null>(null);
  // Ayurvedic completion state: shared localStorage + Firestore
  const [ayurCompletedIds, setAyurCompletedIds] = useState<Set<string>>(() => getTodayAyurCompletedIds());
  const engine = useLifestyleEngine();
  const { user } = useOneSutraAuth();
  const router = useRouter();
  const goAddHabit = useCallback(() => router.push('/lifestyle/ayurvedic-habits'), [router]);

  useEffect(() => {
    setMounted(true);
    setLogStory(getTodayLogStory());
    setSmartLoggedToday(getSmartLoggedToday());
    setAyurCompletedIds(getTodayAyurCompletedIds());
    const refresh = () => {
      setLogStory(getTodayLogStory());
      setSmartLoggedToday(getSmartLoggedToday());
      setAyurCompletedIds(getTodayAyurCompletedIds());
    };
    window.addEventListener('focus', refresh);
    window.addEventListener('daily-log-story-updated', refresh);
    window.addEventListener('habit-logged', refresh);
    window.addEventListener('storage', refresh);
    const t = setInterval(refresh, 15_000);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('daily-log-story-updated', refresh);
      window.removeEventListener('habit-logged', refresh);
      window.removeEventListener('storage', refresh);
      clearInterval(t);
    };
  }, []);

  const weekDays = useMemo(() => {
    const days: { label: string; pct: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const lbl = d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2).toUpperCase();
      const logs = engine.habitLogs.filter(l => l.date === ds && l.completed);
      const pct = engine.activeHabits.length > 0 ? Math.round((logs.length / engine.activeHabits.length) * 100) : 0;
      days.push({ label: lbl, pct: Math.min(100, pct) });
    }
    return days;
  }, [engine.habitLogs, engine.activeHabits.length]);

  const handleComplete = useCallback(async (id: string, sub?: SubOption) => {
    // id is an Ayurvedic habit ID (e.g. 'evening_walk', 'main_meal_noon')
    // Map to the lifestyle-store h_* ID for streak tracking / engine
    const hId = AYUR_TO_H_ID[id] ?? id;
    const ayurHabit = AYURVEDIC_HABITS.find(h => h.id === id);
    // 1. Close sub-option sheet + mark local state immediately
    setActiveSubHabitId(null);
    setAyurHabitCompleted(id);
    setAyurCompletedIds(prev => new Set([...prev, id]));
    // 2. Write to Firestore — same pattern as SmartLogBubbles logAndNavigate:
    //    Write the h_* alias (for streak/engine data) and ALSO the raw ayurvedic ID
    //    if it differs, so onSnapshot can restore it exactly after logout+login.
    logHabitAndSync(user?.uid, hId, sub?.detail);
    if (id !== hId) logHabitAndSync(user?.uid, id, sub?.detail);
    saveToSmartLog(id);
    saveToSmartLog(hId);
    if (ayurHabit) saveToDailyLogStory(id, ayurHabit.emoji, ayurHabit.name, slotCfgColor);
    try { window.dispatchEvent(new CustomEvent('habit-logged')); } catch { }
    try { window.dispatchEvent(new CustomEvent('daily-log-story-updated')); } catch { }
    setSmartLoggedToday(getSmartLoggedToday());
    setCelebrateId(id);
    setTimeout(() => setCelebrateId(null), 1800);
    if (!ayurHabit) return;
    try {
      const loggedAtMs = Date.now();
      const logTime = getISTTimeStr(loggedAtMs);
      const todayISO = getISODateIST(loggedAtMs);
      const win = findHabitWindow(hId) ?? findHabitWindow(ayurHabit.name);
      const timingStatus = win ? getHabitWindowTimingStatus(win, loggedAtMs) : 'ideal';
      const lateStreak = win ? updateLateStreak(hId, timingStatus, todayISO) : 0;
      const morningMood = getMorningMood();
      const currentStreak = engine.streaks[hId]?.currentStreak ?? 0;
      const { prakriti, vikriti } = getLocalDoshaContext(hId, currentStreak);

      const res = await fetch('/api/bodhi/habit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: getLocalUserNameSAD(),
          prakriti,
          vikruti: vikriti,
          mood: morningMood?.mood ?? '',
          habit_name: ayurHabit.name,
          log_time: logTime,
          ideal_start: win?.idealStart ?? '',
          ideal_end: win?.idealEnd ?? '',
          timing_status: timingStatus,
          late_streak: lateStreak,
          habit_streak: currentStreak,
          dosha_effect: win?.doshaEffect ?? '',
          habit_benefit: ayurHabit.description ?? '',
          duration_minutes: ayurHabit.targetMin ?? 0,
          time_section: ayurHabit.category,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const voiceMessage: string = data.response ?? '';
        if (voiceMessage.length > 10) {
          try { sessionStorage.setItem('bodhi_pending_inject', ayurHabit.name); } catch { /* ignore */ }
          const { speakBodhiRaw } = await import('@/lib/bodhiVoice');
          speakBodhiRaw(voiceMessage);
          return;
        }
      }
    } catch { /* fallback */ }
    bodhiSpeakLog({ habitIcon: ayurHabit.emoji, habitName: ayurHabit.name, isLocked: false, timeSlot: 'morning' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!mounted) return null;

  const slotCfg = getTimeSlotConfig();
  const slotCfgColor = slotCfg.color;

  // ── Ayurvedic habits for current time slot — filtered to My Habits only ──────
  const ayurSlot = (slotCfg.slotKey === 'morning' ? 'morning'
    : slotCfg.slotKey === 'midday' ? 'midday'
      : slotCfg.slotKey === 'evening' ? 'evening' : 'night') as AyurTimeSlot;
  // Build set of Ayurvedic IDs in user's My Habits (direct + h_* aliases)
  const _allAyurIds = new Set(AYURVEDIC_HABITS.map(h => h.id));
  const _userAyurIds = new Set<string>();
  engine.activeHabits.forEach(sh => {
    if (_allAyurIds.has(sh.id)) _userAyurIds.add(sh.id);
    const aId = H_ID_TO_AYUR[sh.id]; if (aId) _userAyurIds.add(aId);
  });
  const slotAyurHabits = getHabitsForSlot(ayurSlot).filter(h => _userAyurIds.has(h.id));

  // ── Merged completion: localStorage ayur + Firestore habit_logs ──
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  // firestoreAyurDone covers two cases so cross-device sync works for all habits:
  //   1. h_* alias logged → map via H_ID_TO_AYUR (e.g. h_walk → shatapavali)
  //   2. Direct ayurvedic ID logged (e.g. main_meal_noon — has no h_* alias)
  const ayurvedic_ids_set = new Set(AYURVEDIC_HABITS.map(h => h.id));
  const firestoreAyurDone = new Set<string>();
  engine.habitLogs
    .filter(l => l.date === todayStr && l.completed)
    .forEach(l => {
      const aId = H_ID_TO_AYUR[l.habitId];
      if (aId) firestoreAyurDone.add(aId);
      if (ayurvedic_ids_set.has(l.habitId)) firestoreAyurDone.add(l.habitId);
    });
  // SmartLog bubbles also count (e.g. 'lunch' bubble → 'main_meal_noon')
  const smartLogAyurDone = new Set<string>();
  smartLoggedToday.forEach(slId => {
    const hId = SMARTLOG_TO_H_ID_SAD[slId] ?? slId;
    const aId = H_ID_TO_AYUR[hId];
    if (aId) smartLogAyurDone.add(aId);
    if (ayurvedic_ids_set.has(slId)) smartLogAyurDone.add(slId);
  });
  const mergedAyurDone = new Set([...ayurCompletedIds, ...firestoreAyurDone, ...smartLogAyurDone]);

  // Convert AyurvedicHabit → HabitItem for MiniHabitCard
  const toHabitItem = (ah: (typeof slotAyurHabits)[0]): HabitItem => ({
    id: ah.id,
    name: ah.name,
    icon: ah.emoji,
    category: ah.category as HabitCategory,
    lifeArea: ah.category === 'midday' ? 'professional' : ah.category === 'morning' ? 'spiritual' : 'physical',
    description: ah.description,
    trackingType: 'checkbox' as const,
    color: ah.category === 'morning' ? '#fbbf24' : ah.category === 'midday' ? '#fb923c' : ah.category === 'evening' ? '#a78bfa' : '#60a5fa',
    targetValue: ah.targetMin,
    frequency: 'daily' as const,
    isActive: true,
    createdAt: 0,
    scheduledTime: '',
  });

  const pendingAyurItems = slotAyurHabits.filter(h => !mergedAyurDone.has(h.id)).map(toHabitItem);
  const doneAyurItems = AYURVEDIC_HABITS.filter(h => mergedAyurDone.has(h.id)).map(toHabitItem);

  // Include HABIT_LIBRARY habits from lifestyle store that aren't already in AYURVEDIC_HABITS
  // e.g. h_wake_early (Wake Before 6am), t_yoga, t_stretch, t_deep_work, etc.
  const extraHabits = engine.activeHabits.map(h => ({ ...h, name: HABIT_DISPLAY_OVERRIDES[h.id] ?? h.name })).filter(h => {
    if (ayurvedic_ids_set.has(h.id)) return false; // already shown via Ayurvedic list
    const aId = H_ID_TO_AYUR[h.id];
    if (aId && ayurvedic_ids_set.has(aId)) return false; // h_* alias of an Ayurvedic habit
    // Time-slot filter: anytime always shows; others must match current slot
    const cat = h.category ?? 'anytime';
    if (cat === 'anytime' || cat === null) return true;
    const slotForCat = (cat === 'morning' || cat === 'sacred') ? 'morning'
      : cat === 'midday' ? 'midday'
      : cat === 'evening' ? 'evening'
      : cat === 'night' ? 'night' : 'anytime';
    return slotForCat === ayurSlot || slotForCat === 'anytime';
  });
  const firestoreDoneIdsForExtra = new Set(
    engine.habitLogs.filter(l => l.date === todayStr && l.completed).map(l => l.habitId)
  );
  const extraPending = extraHabits.filter(h => !firestoreDoneIdsForExtra.has(h.id) && !ayurCompletedIds.has(h.id));
  const extraDone = extraHabits.filter(h => firestoreDoneIdsForExtra.has(h.id) || ayurCompletedIds.has(h.id));

  const pendingHabits = slotCfg.slotKey === 'morning'
    ? [...pendingAyurItems, ...extraPending].sort((a, b) => (MORNING_PRACTICE_ORDER_SAD[AYUR_TO_H_ID[a.id] ?? a.id] ?? 99) - (MORNING_PRACTICE_ORDER_SAD[AYUR_TO_H_ID[b.id] ?? b.id] ?? 99))
    : [...pendingAyurItems, ...extraPending];
  const doneHabits = [...doneAyurItems, ...extraDone];

  const completedCount = slotAyurHabits.filter(h => mergedAyurDone.has(h.id)).length + extraDone.length;
  const totalHabits = slotAyurHabits.length + extraHabits.length;
  const completionRate = AYURVEDIC_HABITS.length > 0 ? Math.round((AYURVEDIC_HABITS.filter(h => mergedAyurDone.has(h.id)).length / AYURVEDIC_HABITS.length) * 100) : 0;
  const levelInfo = getLevelFromXP(engine.xp.total);
  const nextLevel = getNextLevel(engine.xp.total);
  const today = getToday();
  const todayXP = engine.xp.history.filter(h => h.date === today).reduce((s, h) => s + h.xp, 0);
  const maxStreak = engine.activeHabits.length > 0 ? Math.max(0, ...engine.activeHabits.map(h => engine.getHabitStreak(h.id))) : 0;
  const ringColor = completionRate >= 80 ? '#4ade80' : completionRate >= 50 ? '#fbbf24' : '#60a5fa';
  const xpPct = nextLevel ? Math.min(100, Math.round(((engine.xp.total - levelInfo.minXP) / (nextLevel.minXP - levelInfo.minXP)) * 100)) : 100;
  const remaining = pendingHabits.length;
  const statusText = completionRate >= 100 ? 'Perfect day 🏆' : completionRate >= 75 ? 'Almost there 🔥' : remaining > 0 ? `${remaining} left 🌱` : totalHabits > 0 ? 'All done ✦' : 'Add activities ✦';
  const sanskrit = SANSKRIT_SLOTS[slotCfg.label] ?? '';
  const statVals = [
    { ...AYUR_STAT_LABELS[0], val: `${completedCount}/${totalHabits}`, bg: `${ringColor}12`, border: `${ringColor}28`, col: '#fff' },
    { ...AYUR_STAT_LABELS[1], val: `${engine.consistencyScore}%`, bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.22)', col: '#c084fc' },
    { ...AYUR_STAT_LABELS[2], val: `+${todayXP}`, bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.22)', col: '#fbbf24' },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.45 }}
      style={{ margin: '0 0.5rem 0.85rem', borderRadius: 20, overflow: 'hidden', position: 'relative', border: `1px solid ${slotCfg.color}20`, boxShadow: `0 12px 36px rgba(0,0,0,0.42),0 0 28px ${slotCfg.color}06` }}>
      {globalBg && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url('${globalBg}')`, backgroundSize: 'cover', backgroundPosition: 'center', transform: 'scale(1.06)', filter: 'blur(3px) brightness(0.3) saturate(1.1)', zIndex: 0 }} />}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 15% 0%,${slotCfg.color}14 0%,transparent 50%),linear-gradient(180deg,rgba(4,2,18,0.05) 0%,rgba(4,2,18,0.92) 100%)`, zIndex: 1 }} />
      <div style={{ position: 'relative', zIndex: 2, padding: '0.7rem 0.82rem 0.75rem' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.38rem', marginBottom: '0.58rem' }}>
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
            style={{ width: 5, height: 5, borderRadius: '50%', background: slotCfg.color, boxShadow: `0 0 7px ${slotCfg.color}`, flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: '0.66rem', fontWeight: 900, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Outfit',sans-serif" }}>Sadhana Progress</span>
          {engine.todayMood && <span style={{ fontSize: '0.9rem' }}>{['😢','😔','😐','😊','🤩'][engine.todayMood.mood-1]}</span>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '0.14rem 0.42rem', borderRadius: 99, background: `${slotCfg.color}14`, border: `1px solid ${slotCfg.color}28` }}>
            <slotCfg.Icon size={9} style={{ color: slotCfg.color }} />
            <span style={{ fontSize: '0.5rem', fontWeight: 800, color: slotCfg.color, fontFamily: "'Outfit',sans-serif", letterSpacing: '0.07em', textTransform: 'uppercase' }}>{slotCfg.label}</span>
          </div>
        </div>

        {/* ── Ring + Stats + Week bars ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          {/* Progress ring */}
          <div style={{ position: 'relative', flexShrink: 0, width: 74, height: 74 }}>
            <motion.div animate={{ opacity: [0.3, 0.55, 0.3] }} transition={{ duration: 3, repeat: Infinity }}
              style={{ position: 'absolute', inset: -4, borderRadius: '50%', background: `conic-gradient(${ringColor}22 ${completionRate * 3.6}deg,transparent ${completionRate * 3.6}deg)`, filter: 'blur(4px)' }} />
            <ProgressRing pct={completionRate} size={74} stroke={7} color={ringColor} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 900, color: ringColor, fontFamily: "'Outfit',sans-serif", lineHeight: 1, textShadow: `0 0 14px ${ringColor}80` }}>{Math.round(completionRate)}%</span>
              <span style={{ fontSize: '0.33rem', color: 'rgba(255,255,255,0.22)', fontFamily: 'serif', fontStyle: 'italic', marginTop: 1 }}>सिद्धि</span>
            </div>
          </div>
          {/* Stats + week */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.26rem' }}>
              {[
                { val: `${completedCount}/${totalHabits}`, label: 'DONE', col: '#fff', bg: `${ringColor}10`, border: `${ringColor}1e` },
                { val: `${engine.consistencyScore}%`, label: 'STREAK', col: '#c084fc', bg: 'rgba(192,132,252,0.08)', border: 'rgba(192,132,252,0.16)' },
                { val: `+${todayXP}`, label: 'XP', col: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.16)' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '0.2rem 0.08rem', borderRadius: 8, background: s.bg, border: `1px solid ${s.border}` }}>
                  <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 900, color: s.col, fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>{s.val}</p>
                  <p style={{ margin: '1px 0 0', fontSize: '0.34rem', color: s.col, opacity: 0.55, fontFamily: "'Outfit',sans-serif", textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 800 }}>{s.label}</p>
                </div>
              ))}
            </div>
            {/* Mini week bars */}
            <div style={{ display: 'flex', gap: '0.14rem', alignItems: 'flex-end' }}>
              {weekDays.map((day, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ width: '100%', height: 14, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', position: 'relative' }}>
                    <motion.div initial={{ height: 0 }} animate={{ height: `${day.pct}%` }} transition={{ duration: 0.85, delay: i * 0.06, ease: 'easeOut' }}
                      style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: day.pct >= 80 ? 'linear-gradient(180deg,#4ade80,#22d3ee)' : day.pct >= 40 ? 'linear-gradient(180deg,#fbbf24,#fb923c)' : day.pct > 0 ? 'rgba(255,255,255,0.16)' : 'transparent', borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: '0.3rem', color: 'rgba(255,255,255,0.2)', fontFamily: "'Outfit',sans-serif", fontWeight: 700, textTransform: 'uppercase' }}>{day.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Thin slot divider ── */}
        <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${slotCfg.color}28,transparent)`, marginBottom: '0.48rem' }} />

        {/* ── Section header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.38rem', marginBottom: '0.42rem' }}>
          <span style={{ flex: 1, fontSize: '0.7rem', fontWeight: 900, color: 'rgba(255,255,255,0.72)', fontFamily: "'Outfit',sans-serif" }}>{slotCfg.emoji} {slotCfg.label} Sadhana</span>
          {pendingHabits.length > 0 && (
            <motion.span animate={{ opacity: [1, 0.55, 1] }} transition={{ duration: 2.2, repeat: Infinity }}
              style={{ fontSize: '0.5rem', padding: '0.03rem 0.33rem', borderRadius: 99, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24', fontFamily: "'Outfit',sans-serif", fontWeight: 700 }}>
              {pendingHabits.length} pending
            </motion.span>
          )}
          <motion.button whileTap={{ scale: 0.9 }} onClick={goAddHabit}
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none', borderRadius: 99, padding: '0.2rem 0.52rem', color: '#fff', fontSize: '0.58rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontFamily: "'Outfit',sans-serif" }}>
            <Plus size={9} /> Add
          </motion.button>
        </div>

        {/* ── Pill tabs ── */}
        <div style={{ display: 'flex', gap: '0.18rem', marginBottom: '0.48rem', padding: '0.1rem', borderRadius: 11, background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.05)' }}>
          {([{ key: 'pending', label: 'To Do', count: pendingHabits.length }, { key: 'done', label: 'Done', count: doneHabits.length }, { key: 'activity', label: 'Activity', count: logStory.length }] as const).map(tab => {
            const active = activeTab === tab.key;
            return (
              <motion.button key={tab.key} whileTap={{ scale: 0.95 }} onClick={() => setActiveTab(tab.key)}
                style={{ flex: 1, padding: '0.3rem 0.1rem', borderRadius: 9, border: 'none', background: active ? `linear-gradient(135deg,${slotCfg.color}1e,${slotCfg.color}0c)` : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, outline: active ? `1px solid ${slotCfg.color}30` : 'none', outlineOffset: 0 }}>
                <span style={{ fontSize: '0.56rem', fontWeight: 800, color: active ? slotCfg.color : 'rgba(255,255,255,0.28)', fontFamily: "'Outfit',sans-serif", letterSpacing: '0.03em' }}>{tab.label}</span>
                {tab.count > 0 && <span style={{ fontSize: '0.42rem', padding: '0.02rem 0.2rem', borderRadius: 99, background: active ? `${slotCfg.color}22` : 'rgba(255,255,255,0.06)', color: active ? slotCfg.color : 'rgba(255,255,255,0.22)', fontFamily: "'Outfit',sans-serif", fontWeight: 700 }}>{tab.count}</span>}
              </motion.button>
            );
          })}
        </div>

        {/* ── Tab content ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'pending' && (
            <motion.div key="pending" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.16 }}>
              {totalHabits === 0 ? (
                <motion.div whileTap={{ scale: 0.97 }} onClick={goAddHabit}
                  style={{ textAlign: 'center', padding: '1.1rem 0.8rem', border: '1px dashed rgba(167,139,250,0.2)', borderRadius: 13, cursor: 'pointer' }}>
                  <p style={{ margin: '0 0 0.3rem', fontSize: '1.6rem' }}>🌱</p>
                  <p style={{ margin: '0 0 0.5rem', color: 'rgba(255,255,255,0.32)', fontSize: '0.76rem', fontFamily: "'Outfit',sans-serif" }}>Begin your Ayurvedic sadhana</p>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.28rem 0.8rem', borderRadius: 99, background: 'rgba(139,92,246,0.16)', border: '1px solid rgba(167,139,250,0.28)', color: '#c4b5fd', fontSize: '0.66rem', fontWeight: 800, fontFamily: "'Outfit',sans-serif" }}><Plus size={10} /> Add Habits</span>
                </motion.div>
              ) : pendingHabits.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '0.9rem', border: `1px solid rgba(74,222,128,0.16)`, borderRadius: 13, background: 'rgba(74,222,128,0.03)' }}>
                  <motion.p animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ margin: '0 0 0.16rem', fontSize: '1.2rem' }}>🪔</motion.p>
                  <p style={{ margin: 0, color: '#4ade80', fontSize: '0.78rem', fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>All {slotCfg.label.toLowerCase()} practices complete!</p>
                </div>
              ) : (
                <div>{pendingHabits.map(h => <MiniHabitCard key={h.id} habit={h} isCompleted={false} streak={engine.getHabitStreak(h.id)} onComplete={setActiveSubHabitId} />)}</div>
              )}
            </motion.div>
          )}
          {activeTab === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.16 }}>
              {doneHabits.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '0.9rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 13 }}>
                  <p style={{ margin: '0 0 0.14rem', fontSize: '1.2rem' }}>🌅</p>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.28)', fontSize: '0.74rem', fontFamily: "'Outfit',sans-serif" }}>First practice awaits.</p>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.32rem' }}>
                    <CheckCircle2 size={9} style={{ color: '#4ade80' }} />
                    <span style={{ fontSize: '0.48rem', color: '#4ade80', fontWeight: 800, fontFamily: "'Outfit',sans-serif", letterSpacing: '0.07em' }}>{doneHabits.length} COMPLETED</span>
                  </div>
                  {doneHabits.map(h => <MiniHabitCard key={h.id} habit={h} isCompleted={true} streak={engine.getHabitStreak(h.id)} onComplete={handleComplete} />)}
                </div>
              )}
            </motion.div>
          )}
          {activeTab === 'activity' && (
            <motion.div key="activity" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.16 }}>
              {logStory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '0.9rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 13 }}>
                  <p style={{ margin: '0 0 0.14rem', fontSize: '1.2rem' }}>⚡</p>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.28)', fontSize: '0.74rem', fontFamily: "'Outfit',sans-serif" }}>No logs yet today.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.18rem' }}>
                  {[...logStory].reverse().map((entry, i) => {
                    const t = new Date(entry.loggedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                    return (
                      <motion.div key={`${entry.id}_tl`} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.38rem', padding: '0.28rem 0.48rem', borderRadius: 9, background: `${entry.color}0a`, border: `1px solid ${entry.color}16` }}>
                        <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{entry.icon}</span>
                        <p style={{ flex: 1, margin: 0, fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', fontFamily: "'Outfit',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.label}</p>
                        <span style={{ fontSize: '0.46rem', color: 'rgba(255,255,255,0.2)', fontFamily: "'Outfit',sans-serif", flexShrink: 0 }}>{t}</span>
                        <span style={{ fontSize: '0.42rem', padding: '0.02rem 0.2rem', borderRadius: 99, background: `${entry.color}1a`, color: entry.color, fontFamily: "'Outfit',sans-serif", fontWeight: 800, flexShrink: 0 }}>✓</span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Celebration toast ── */}
        <AnimatePresence>
          {celebrateId && (
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
              style={{ marginTop: '0.45rem', textAlign: 'center', padding: '0.38rem', borderRadius: 11, background: 'linear-gradient(135deg,rgba(74,222,128,0.08),rgba(34,211,238,0.04))', border: '1px solid rgba(74,222,128,0.16)' }}>
              <span style={{ fontSize: '0.68rem', color: '#4ade80', fontWeight: 800, fontFamily: "'Outfit',sans-serif" }}>🎉 संकल्प पूर्ण — Bodhi is proud of you!</span>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Sub-option bottom sheet — same picker as SmartLogBubbles */}
      <AnimatePresence>
        {activeSubHabitId && (() => {
          const habit = AYURVEDIC_HABITS.find(h => h.id === activeSubHabitId);
          const subs = getSubOptionsForHabit(activeSubHabitId, habit?.name ?? '');
          return (
            <motion.div
              key="sub-sheet-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setActiveSubHabitId(null)}
              style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)' }}
            >
              <motion.div
                key="sub-sheet"
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 340, damping: 32 }}
                onClick={e => e.stopPropagation()}
                style={{ width: '100%', maxWidth: 480, maxHeight: '72vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg,rgba(14,9,46,0.99) 0%,rgba(6,4,22,1) 100%)', borderRadius: '22px 22px 0 0', border: '1px solid rgba(139,92,246,0.22)', borderBottom: 'none', boxShadow: '0 -8px 40px rgba(0,0,0,0.6)' }}
              >
                {/* Drag handle */}
                <div style={{ flexShrink: 0, padding: '0.7rem 1rem 0' }}>
                  <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.14)', margin: '0 auto 0.7rem' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.65rem' }}>
                    <span style={{ fontSize: '1.55rem', lineHeight: 1 }}>{habit?.emoji ?? '\u2726'}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.86rem', fontWeight: 800, color: 'rgba(255,255,255,0.92)', fontFamily: "'Outfit',sans-serif" }}>{habit?.name ?? activeSubHabitId}</p>
                      <p style={{ margin: 0, fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit',sans-serif" }}>How did you do it?</p>
                    </div>
                  </div>
                </div>
                {/* Scrollable options list */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem', paddingBottom: 'env(safe-area-inset-bottom, 1.4rem)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.36rem', paddingBottom: '0.5rem' }}>
                    {subs.map(sub => (
                      <motion.button
                        key={sub.label}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleComplete(activeSubHabitId, sub)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', width: '100%', padding: '0.55rem 0.75rem', borderRadius: 13, background: 'rgba(139,92,246,0.09)', border: '1px solid rgba(139,92,246,0.2)', cursor: 'pointer', textAlign: 'left' }}
                      >
                        <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{sub.icon}</span>
                        <span style={{ fontSize: '0.77rem', fontWeight: 700, color: 'rgba(255,255,255,0.84)', fontFamily: "'Outfit',sans-serif" }}>{sub.label}</span>
                      </motion.button>
                    ))}
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleComplete(activeSubHabitId)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '0.55rem', borderRadius: 13, background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.22)', cursor: 'pointer', marginTop: '0.18rem' }}
                    >
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#4ade80', fontFamily: "'Outfit',sans-serif" }}>&#10003; Quick Log</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </motion.div>
  );
}
