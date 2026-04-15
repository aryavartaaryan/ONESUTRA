'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sunrise, Sun, Sunset, Moon, Sparkles, Plus, CheckCircle2, Bell, Zap, Flame } from 'lucide-react';
import { getTodayLogStory, saveToDailyLogStory, syncActivityEntryToFirestore, subscribeToActivityLog, getSubOptionsForHabit, type DailyLogEntry, type SubOption } from '@/components/Dashboard/SmartLogBubbles';
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

function playConfirmChime() {
  if (typeof window === 'undefined') return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx() as AudioContext;
    void ctx.resume().then(() => {
      ([[528, 0.2], [792, 0.1], [1056, 0.05]] as [number, number][]).forEach(([freq, vol], i) => {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.018;
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(t); osc.stop(t + 1.5);
      });
    });
  } catch { /* ignore */ }
}

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

// ─── Mini Habit Card (tappable to complete) ───────────────────────────────────
function MiniHabitCard({ habit, isCompleted, streak, onComplete }: {
  habit: HabitItem; isCompleted: boolean; streak: number; onComplete: (id: string) => void;
}) {
  const [flash, setFlash] = useState(false);
  const color = LIFE_AREA_COLORS[habit.lifeArea] ?? '#a78bfa';
  const cat = CAT_CFG[habit.category ?? 'anytime'];
  const handleTap = useCallback(() => {
    if (isCompleted) return;
    setFlash(true); onComplete(habit.id); setTimeout(() => setFlash(false), 700);
  }, [isCompleted, habit.id, onComplete]);
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      whileTap={!isCompleted ? { scale: 0.965 } : {}} onClick={handleTap}
      style={{
        display: 'flex', alignItems: 'center', gap: 0, borderRadius: 14, marginBottom: '0.28rem', position: 'relative', overflow: 'hidden',
        background: isCompleted
          ? `linear-gradient(135deg, ${color}28 0%, rgba(0,0,0,0.55) 100%)`
          : `linear-gradient(135deg, ${color}16 0%, rgba(6,4,22,0.7) 100%)`,
        border: `1.5px solid ${isCompleted ? color + '55' : color + '32'}`,
        boxShadow: isCompleted
          ? `0 6px 28px ${color}22, inset 0 1px 0 rgba(255,255,255,0.07)`
          : `0 3px 18px ${color}12, inset 0 1px 0 rgba(255,255,255,0.04)`,
        cursor: isCompleted ? 'default' : 'pointer'
      }}>
      {/* Shimmer flash on complete */}
      <AnimatePresence>
        {flash && <motion.div initial={{ opacity: 0.8, x: '-100%' }} animate={{ opacity: 0, x: '100%' }} exit={{ opacity: 0 }} transition={{ duration: 0.55 }}
          style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, transparent, ${color}45, transparent)`, zIndex: 5, pointerEvents: 'none' }} />}
      </AnimatePresence>
      {/* Vivid left accent */}
      <div style={{
        width: 3, alignSelf: 'stretch', flexShrink: 0,
        background: isCompleted ? `linear-gradient(180deg, ${color}, ${color}88)` : `linear-gradient(180deg, ${color}cc, ${color}44)`,
        borderRadius: '18px 0 0 18px', boxShadow: isCompleted ? `2px 0 12px ${color}60` : `2px 0 8px ${color}30`
      }} />
      {/* Icon badge */}
      <div style={{
        margin: '0.48rem 0.44rem 0.48rem 0.58rem', width: 34, height: 34, borderRadius: 11, flexShrink: 0,
        background: `linear-gradient(135deg, ${color}28, ${color}10)`,
        border: `1.5px solid ${color}38`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem', position: 'relative',
        boxShadow: `0 4px 16px ${color}22`
      }}>
        {habit.icon}
        {isCompleted && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            style={{ position: 'absolute', inset: 0, borderRadius: 14, background: `${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={20} style={{ color }} />
          </motion.div>
        )}
        {!isCompleted && (
          <motion.div animate={{ scale: [1, 1.6, 1], opacity: [0.35, 0, 0.35] }} transition={{ duration: 2.8, repeat: Infinity }}
            style={{ position: 'absolute', inset: -3, borderRadius: 17, border: `1.5px solid ${color}40`, pointerEvents: 'none' }} />
        )}
      </div>
      {/* Name + tags */}
      <div style={{ flex: 1, minWidth: 0, paddingRight: '0.3rem' }}>
        <p style={{
          margin: 0, fontSize: '0.74rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif",
          color: isCompleted ? color : 'rgba(255,255,255,0.92)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          textShadow: isCompleted ? `0 0 16px ${color}60` : 'none'
        }}>{habit.name}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.28rem', marginTop: 3 }}>
          <span style={{
            fontSize: '0.55rem', padding: '0.07rem 0.35rem', borderRadius: 99,
            background: `linear-gradient(90deg, ${cat.color}18, ${cat.color}08)`,
            border: `1px solid ${cat.color}30`, color: cat.color,
            fontFamily: "'Outfit', sans-serif", fontWeight: 800, letterSpacing: '0.04em'
          }}>{cat.emoji} {cat.label}</span>
          {streak > 0 && (
            <span style={{
              fontSize: '0.55rem', color: streak >= 7 ? '#fbbf24' : '#fb923c', fontWeight: 800,
              fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: 2
            }}>
              {streak >= 21 ? '🔱' : '🔥'}{streak}
            </span>
          )}
        </div>
      </div>
      {/* Right action */}
      <div style={{ paddingRight: '0.65rem', flexShrink: 0 }}>
        {isCompleted
          ? <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}
            style={{
              fontSize: '0.55rem', padding: '0.18rem 0.5rem', borderRadius: 99,
              background: `linear-gradient(135deg, ${color}28, ${color}14)`,
              border: `1px solid ${color}45`, color,
              fontFamily: "'Outfit', sans-serif", fontWeight: 800
            }}>✓ Done</motion.span>
          : <motion.div whileTap={{ scale: 0.82 }}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: `radial-gradient(circle, ${color}25, ${color}10)`,
              border: `2px solid ${color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 12px ${color}30`
            }}>
            <CheckCircle2 size={16} style={{ color: `${color}bb` }} />
          </motion.div>
        }
      </div>
    </motion.div>
  );
}

// QuickAddModal removed — Add Habit navigates to /lifestyle/ayurvedic-habits

export default function SmartAnalyticsDashboard({ globalBg }: { globalBg?: string }) {
  const [logStory, setLogStory] = useState<DailyLogEntry[]>([]);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending'>('pending');
  const [celebrateId, setCelebrateId] = useState<string | null>(null);
  const [smartLoggedToday, setSmartLoggedToday] = useState<Set<string>>(new Set());
  const [activeSubHabitId, setActiveSubHabitId] = useState<string | null>(null);
  const [expandedSlots, setExpandedSlots] = useState<Record<string, boolean>>(() => {
    const h = new Date().getHours();
    return { morning: h >= 4 && h < 12, noon: h >= 12 && h < 17, evening: h >= 17 };
  });
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

  // ── Firestore real-time listener: merges activity logs from all logged-in devices ──
  useEffect(() => {
    if (!user?.uid) return;
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    const unsub = subscribeToActivityLog(user.uid, today, (remoteEntries) => {
      setLogStory(prev => {
        const byId = new Map<string, DailyLogEntry>();
        prev.forEach(e => byId.set(e.id, e));
        remoteEntries.forEach(e => {
          if (!byId.has(e.id) || e.loggedAt > (byId.get(e.id)?.loggedAt ?? 0)) {
            byId.set(e.id, e);
          }
        });
        const merged = Array.from(byId.values()).sort((a, b) => a.loggedAt - b.loggedAt);
        try {
          const all: DailyLogEntry[] = JSON.parse(localStorage.getItem('onesutra_daily_log_story_v1') ?? '[]');
          const other = all.filter(e => e.date !== today);
          localStorage.setItem('onesutra_daily_log_story_v1', JSON.stringify([...merged, ...other]));
        } catch { /* ignore */ }
        return merged;
      });
    });
    return unsub;
  }, [user?.uid]);

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
    playConfirmChime();
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
    if (ayurHabit) {
      saveToDailyLogStory(id, ayurHabit.emoji, ayurHabit.name, slotCfgColor);
      syncActivityEntryToFirestore(user?.uid, {
        id, icon: ayurHabit.emoji, label: ayurHabit.name, color: slotCfgColor,
        loggedAt: Date.now(),
        date: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()),
      });
    }
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

  // ── Ayurvedic habits for current time slot (same source as SmartLogBubbles) ──
  const ayurSlot = (slotCfg.slotKey === 'morning' ? 'morning'
    : slotCfg.slotKey === 'midday' ? 'midday'
      : slotCfg.slotKey === 'evening' ? 'evening' : 'night') as AyurTimeSlot;
  // ── Filter Ayurvedic habits to only user's My Habits ──
  const ayurvedic_ids_set = new Set(AYURVEDIC_HABITS.map(h => h.id));
  const _storeAyurIds = new Set<string>();
  for (const sh of engine.activeHabits) {
    if (ayurvedic_ids_set.has(sh.id)) _storeAyurIds.add(sh.id);
    const _aId = H_ID_TO_AYUR[sh.id]; if (_aId) _storeAyurIds.add(_aId);
  }
  const slotAyurHabits = getHabitsForSlot(ayurSlot).filter(h => _storeAyurIds.has(h.id));

  // ── Merged completion: localStorage ayur + Firestore habit_logs ──
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  // firestoreAyurDone covers two cases so cross-device sync works for all habits:
  //   1. h_* alias logged → map via H_ID_TO_AYUR (e.g. h_walk → shatapavali)
  //   2. Direct ayurvedic ID logged (e.g. main_meal_noon — has no h_* alias)
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
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.55 }}
      style={{ margin: '0 0.5rem 1rem', borderRadius: 24, overflow: 'hidden', position: 'relative', border: `1.5px solid ${slotCfg.color}28`, boxShadow: `0 16px 48px rgba(0,0,0,0.45),inset 0 1px 0 rgba(255,255,255,0.07),0 0 40px ${slotCfg.color}08` }}>
      {globalBg && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url('${globalBg}')`, backgroundSize: 'cover', backgroundPosition: 'center', transform: 'scale(1.08)', filter: 'blur(3px) brightness(0.35) saturate(1.2)', zIndex: 0 }} />}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 10% 0%,${slotCfg.color}18 0%,transparent 55%),radial-gradient(ellipse at 90% 100%,rgba(139,92,246,0.14) 0%,transparent 55%),linear-gradient(180deg,rgba(4,2,18,0.15) 0%,rgba(4,2,18,0.9) 100%)`, zIndex: 1 }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '16rem', opacity: 0.016, zIndex: 1, pointerEvents: 'none', lineHeight: 1, color: slotCfg.color }}>ॐ</div>
      <div style={{ position: 'relative', zIndex: 2, padding: '0.85rem 0.9rem 0.8rem' }}>
        {/* Header — compact & sleek */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.44rem' }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '0.46rem', fontWeight: 700, color: 'rgba(255,255,255,0.26)', letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: "'Outfit',sans-serif" }}>Sadhana · दिनचर्या</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.24rem' }}>
              <motion.span animate={{ opacity: [0.45, 1, 0.45] }} transition={{ duration: 3.5, repeat: Infinity }} style={{ fontSize: '0.62rem', color: slotCfg.color }}>✦</motion.span>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#fff', fontFamily: "'Outfit',sans-serif", letterSpacing: '-0.01em' }}>Today&#39;s Progress</span>
              {sanskrit && <span style={{ fontSize: '0.48rem', color: `${slotCfg.color}70`, fontFamily: 'serif', fontStyle: 'italic' }}> · {sanskrit}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.24rem' }}>
            {engine.todayMood && <span style={{ fontSize: '0.88rem' }}>{['😢', '😔', '😐', '😊', '🤩'][engine.todayMood.mood - 1]}</span>}
            <motion.div animate={{ boxShadow: [`0 0 0 0 ${slotCfg.color}38`, `0 0 0 4px ${slotCfg.color}00`] }} transition={{ duration: 2.2, repeat: Infinity }}
              style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '0.14rem 0.36rem', borderRadius: 99, background: `linear-gradient(135deg,${slotCfg.color}1c,${slotCfg.color}08)`, border: `1px solid ${slotCfg.color}36` }}>
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }} style={{ width: 5, height: 5, borderRadius: '50%', background: slotCfg.color, boxShadow: `0 0 5px ${slotCfg.color}` }} />
              <slotCfg.Icon size={9} style={{ color: slotCfg.color }} />
              <span style={{ fontSize: '0.46rem', fontWeight: 800, color: slotCfg.color, fontFamily: "'Outfit',sans-serif", letterSpacing: '0.07em', textTransform: 'uppercase' }}>{slotCfg.label}</span>
            </motion.div>
          </div>
        </div>
        {/* Status row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.58rem' }}>
          <span style={{ fontSize: '0.54rem', color: 'rgba(255,255,255,0.34)', fontFamily: "'Outfit',sans-serif", fontStyle: 'italic' }}>{statusText}</span>
          <span style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.17)', fontFamily: "'Outfit',sans-serif" }}>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        </div>
        {/* Ring + Ayurvedic Stats + Week bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.65rem' }}>
          <div style={{ position: 'relative', flexShrink: 0, width: 100, height: 100 }}>
            <motion.div animate={{ opacity: [0.35, 0.65, 0.35] }} transition={{ duration: 3, repeat: Infinity }}
              style={{ position: 'absolute', inset: -5, borderRadius: '50%', background: `conic-gradient(${ringColor}28 ${completionRate * 3.6}deg,transparent ${completionRate * 3.6}deg)`, filter: 'blur(5px)' }} />
            <ProgressRing pct={completionRate} size={100} stroke={9} color={ringColor} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.45rem', fontWeight: 900, color: ringColor, fontFamily: "'Outfit',sans-serif", lineHeight: 1, textShadow: `0 0 20px ${ringColor}90` }}>{Math.round(completionRate)}%</span>
              <span style={{ fontSize: '0.38rem', color: 'rgba(255,255,255,0.28)', fontFamily: 'serif', fontStyle: 'italic', marginTop: 2 }}>सिद्धि</span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.35rem', marginBottom: '0.52rem' }}>
              {statVals.map((s, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '0.38rem 0.1rem', borderRadius: 13, background: `linear-gradient(135deg,${s.bg},rgba(0,0,0,0.2))`, border: `1px solid ${s.border}` }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, color: s.col, fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>{s.val}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.41rem', color: s.col, opacity: 0.65, fontFamily: "'Outfit',sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>{s.label}</p>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'flex-end' }}>
              {weekDays.map((day, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ width: '100%', height: 22, borderRadius: 4, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', position: 'relative' }}>
                    <motion.div initial={{ height: 0 }} animate={{ height: `${day.pct}%` }} transition={{ duration: 0.9, delay: i * 0.07, ease: 'easeOut' }}
                      style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: day.pct >= 80 ? 'linear-gradient(180deg,#4ade80,#22d3ee)' : day.pct >= 40 ? 'linear-gradient(180deg,#fbbf24,#fb923c)' : day.pct > 0 ? 'rgba(255,255,255,0.18)' : 'transparent', borderRadius: 4, boxShadow: day.pct >= 80 ? '0 0 8px rgba(74,222,128,0.6)' : 'none' }} />
                  </div>
                  <span style={{ fontSize: '0.37rem', color: 'rgba(255,255,255,0.26)', fontFamily: "'Outfit',sans-serif", fontWeight: 700, textTransform: 'uppercase' }}>{day.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Tapas Level bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.38rem', marginBottom: '0.65rem', padding: '0.42rem 0.65rem', borderRadius: 12, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.14)' }}>
          <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>{levelInfo.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.28rem' }}>
                <span style={{ fontSize: '0.62rem', color: '#fbbf24', fontWeight: 900, fontFamily: "'Outfit',sans-serif" }}>{levelInfo.name}</span>
                <span style={{ fontSize: '0.48rem', color: 'rgba(251,191,36,0.42)', fontFamily: 'serif', fontStyle: 'italic' }}>Tapas Level</span>
              </div>
              <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)', fontFamily: "'Outfit',sans-serif" }}>{engine.xp.total} XP · {maxStreak > 0 ? `${maxStreak}🔥` : '—'}</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
                style={{ height: '100%', background: 'linear-gradient(90deg,#fbbf24,#f97316,#ef4444)', borderRadius: 3, boxShadow: '0 0 10px rgba(251,191,36,0.6)' }} />
            </div>
          </div>
        </div>
        {/* OM Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.88rem' }}>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,transparent,${slotCfg.color}40)` }} />
          <span style={{ fontSize: '0.8rem', color: `${slotCfg.color}80`, fontFamily: 'serif' }}>✦ ॐ ✦</span>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,${slotCfg.color}40,transparent)` }} />
        </div>
        {/* Sadhana Section Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.52rem', flexWrap: 'wrap', gap: '0.38rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.38rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#fff', fontFamily: "'Outfit',sans-serif" }}>{slotCfg.emoji} {slotCfg.label} Activities</span>
            {pendingHabits.length > 0 && (
              <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }}
                style={{ fontSize: '0.57rem', padding: '0.06rem 0.4rem', borderRadius: 99, background: 'rgba(251,191,36,0.14)', border: '1px solid rgba(251,191,36,0.32)', color: '#fbbf24', fontFamily: "'Outfit',sans-serif", fontWeight: 700 }}>
                {pendingHabits.length} pending
              </motion.span>
            )}
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={goAddHabit}
            style={{ position: 'relative', background: 'linear-gradient(135deg,#7c3aed,#a855f7,#ec4899)', border: 'none', borderRadius: 999, padding: '0.32rem 0.72rem', color: '#fff', fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Outfit',sans-serif", boxShadow: '0 4px 18px rgba(124,58,237,0.45)', flexShrink: 0 }}>
            <motion.span style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, borderRadius: '50%', background: '#f97316', border: '1.5px solid rgba(0,0,0,0.4)' }} animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
            <Bell size={10} fill="white" /> + Add Habit
          </motion.button>
        </div>
        {/* Tap hint */}
        {pendingHabits.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.28rem', marginBottom: '0.38rem', padding: '0.28rem 0.6rem', borderRadius: 10, background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.12)' }}>
            <motion.span animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.8, repeat: Infinity }} style={{ fontSize: '0.68rem' }}>👆</motion.span>
            <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.36)', fontFamily: "'Outfit',sans-serif", fontStyle: 'italic' }}>Tap to log · Bodhi celebrates with you</span>
          </div>
        )}
        {/* Crystal Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.68rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.38rem', padding: '0.3rem 0.5rem', borderRadius: 14, border: `1.5px solid ${slotCfg.color}40`, background: `linear-gradient(135deg,${slotCfg.color}10,${slotCfg.color}05)` }}>
            <span style={{ fontSize: '0.72rem' }}>📊</span>
            <span style={{ fontSize: '0.58rem', fontWeight: 800, color: slotCfg.color, fontFamily: "'Outfit',sans-serif", letterSpacing: '0.04em' }}>Activity Logs</span>
            {(pendingHabits.length + logStory.length) > 0 && <span style={{ fontSize: '0.46rem', padding: '0.03rem 0.28rem', borderRadius: 99, background: `${slotCfg.color}28`, color: slotCfg.color, fontFamily: "'Outfit',sans-serif", fontWeight: 700 }}>{pendingHabits.length + logStory.length}</span>}
          </div>
        </div>
        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'pending' && (
            <motion.div key="pending" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>
              {totalHabits === 0 && logStory.length === 0 ? (
                <motion.div whileTap={{ scale: 0.97 }} onClick={goAddHabit}
                  style={{ textAlign: 'center', padding: '1.5rem 1rem', border: '1.5px dashed rgba(167,139,250,0.24)', borderRadius: 18, cursor: 'pointer', background: 'rgba(167,139,250,0.04)' }}>
                  <p style={{ margin: '0 0 0.4rem', fontSize: '2rem' }}>🌱</p>
                  <p style={{ margin: '0 0 0.65rem', color: 'rgba(255,255,255,0.38)', fontSize: '0.84rem', fontFamily: "'Outfit',sans-serif" }}>No sadhana yet — begin your Ayurvedic practice</p>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.36rem 1rem', borderRadius: 99, background: 'rgba(139,92,246,0.22)', border: '1px solid rgba(167,139,250,0.38)', color: '#c4b5fd', fontSize: '0.74rem', fontWeight: 800, fontFamily: "'Outfit',sans-serif" }}><Plus size={11} /> Add Ayurvedic Habits</span>
                </motion.div>
              ) : (
                <>
                  {(['morning', 'noon', 'evening'] as const).map((slotKey) => {
                    const cfg = {
                      morning: { label: 'Morning', emoji: '🌅', color: '#fbbf24', startH: 4,  endH: 12 },
                      noon:    { label: 'Noon',    emoji: '☀️', color: '#fb923c', startH: 12, endH: 17 },
                      evening: { label: 'Evening', emoji: '🪔', color: '#a78bfa', startH: 17, endH: 24 },
                    }[slotKey];
                    const curH = new Date().getHours();
                    const isCurrent = curH >= cfg.startH && curH < cfg.endH;
                    if (curH < cfg.startH) return null;
                    const slotLogs = logStory.filter(e => {
                      const h = new Date(e.loggedAt).getHours();
                      return h >= cfg.startH && h < cfg.endH;
                    });
                    const isExp = expandedSlots[slotKey];
                    return (
                      <div key={slotKey} style={{ marginBottom: '0.36rem' }}>
                        <button
                          onClick={() => setExpandedSlots(prev => ({ ...prev, [slotKey]: !prev[slotKey] }))}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0.38rem 0.6rem', borderRadius: 12, marginBottom: isExp ? '0.22rem' : 0,
                            background: isCurrent ? `${cfg.color}14` : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${isCurrent ? cfg.color + '30' : 'rgba(255,255,255,0.07)'}`,
                            cursor: 'pointer',
                          }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.34rem' }}>
                            <span style={{ fontSize: '0.72rem' }}>{cfg.emoji}</span>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: cfg.color, fontFamily: "'Outfit',sans-serif" }}>{cfg.label}</span>
                            {isCurrent && <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                              style={{ fontSize: '0.42rem', padding: '0.04rem 0.26rem', borderRadius: 99, background: `${cfg.color}22`, color: cfg.color, fontWeight: 800, letterSpacing: '0.05em', fontFamily: "'Outfit',sans-serif" }}>● LIVE</motion.span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.44rem' }}>
                            <span style={{ fontSize: '0.5rem', color: slotLogs.length > 0 ? cfg.color : 'rgba(255,255,255,0.2)', fontFamily: "'Outfit',sans-serif", fontWeight: 700 }}>
                              {slotLogs.length > 0 ? `${slotLogs.length} logged` : 'none'}
                            </span>
                            <span style={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.28)' }}>{isExp ? '▲' : '▼'}</span>
                          </div>
                        </button>
                        {isExp && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.18rem' }}>
                            {slotLogs.map((entry, i) => {
                              const t = new Date(entry.loggedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                              const loggedH = new Date(entry.loggedAt).getHours();
                              const ayurHabit = AYURVEDIC_HABITS.find(h => h.id === entry.id);
                              const expCat = ayurHabit?.category ?? slotKey;
                              const logCat = loggedH >= 4 && loggedH < 12 ? 'morning' : loggedH >= 12 && loggedH < 17 ? 'midday' : 'evening';
                              const onTime = expCat === logCat || (expCat as string) === 'anytime';
                              return (
                                <motion.div key={`${entry.id}_${i}`} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.32rem 0.54rem', borderRadius: 11, background: `${entry.color}0c`, border: `1px solid ${entry.color}1c` }}>
                                  <span style={{ fontSize: '0.88rem', flexShrink: 0 }}>{entry.icon}</span>
                                  <p style={{ flex: 1, margin: 0, fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.82)', fontFamily: "'Outfit',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.label}</p>
                                  <span style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.26)', fontFamily: "'Outfit',sans-serif", flexShrink: 0 }}>{t}</span>
                                  <span style={{ fontSize: '0.44rem', padding: '0.03rem 0.22rem', borderRadius: 99, background: onTime ? 'rgba(74,222,128,0.12)' : 'rgba(251,191,36,0.12)', color: onTime ? '#4ade80' : '#fbbf24', fontFamily: "'Outfit',sans-serif", fontWeight: 800, flexShrink: 0, whiteSpace: 'nowrap' }}>
                                    {onTime ? '✅ On Time' : '⏰ Late'}
                                  </span>
                                </motion.div>
                              );
                            })}
                            {slotLogs.length === 0 && !isCurrent && (
                              <p style={{ margin: 0, padding: '0.34rem 0.54rem', fontSize: '0.58rem', color: 'rgba(255,255,255,0.18)', fontFamily: "'Outfit',sans-serif", fontStyle: 'italic' }}>No activities logged in this slot</p>
                            )}
                            {isCurrent && pendingHabits.length > 0 && (
                              <div style={{ marginTop: '0.12rem' }}>
                                <motion.div initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }}
                                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.26rem 0.54rem', borderRadius: 9, marginBottom: '0.28rem', background: 'linear-gradient(135deg,rgba(251,191,36,0.06),rgba(139,92,246,0.04))', border: '1px solid rgba(251,191,36,0.13)' }}>
                                  <span style={{ fontSize: '0.76rem' }}>🔥</span>
                                  <p style={{ margin: 0, fontSize: '0.58rem', color: 'rgba(255,255,255,0.38)', fontFamily: "'Outfit',sans-serif" }}><span style={{ color: '#fbbf24', fontWeight: 800 }}>Tap to log</span> — Bodhi celebrates with you</p>
                                </motion.div>
                                {pendingHabits.map(h => <MiniHabitCard key={h.id} habit={h} isCompleted={false} streak={engine.getHabitStreak(h.id)} onComplete={setActiveSubHabitId} />)}
                              </div>
                            )}
                            {isCurrent && pendingHabits.length === 0 && totalHabits > 0 && (
                              <div style={{ textAlign: 'center', padding: '0.5rem', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 11, background: 'rgba(74,222,128,0.04)' }}>
                                <motion.p animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ margin: '0 0 0.1rem', fontSize: '1.1rem' }}>🪔</motion.p>
                                <p style={{ margin: 0, color: '#4ade80', fontSize: '0.74rem', fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>All practices complete!</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        {/* Celebration toast */}
        <AnimatePresence>
          {celebrateId && (
            <motion.div initial={{ opacity: 0, scale: 0.88, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.88 }}
              style={{ marginTop: '0.6rem', textAlign: 'center', padding: '0.52rem', borderRadius: 16, background: 'linear-gradient(135deg,rgba(74,222,128,0.1),rgba(34,211,238,0.06))', border: '1px solid rgba(74,222,128,0.22)' }}>
              <span style={{ fontSize: '0.74rem', color: '#4ade80', fontWeight: 800, fontFamily: "'Outfit',sans-serif" }}>🎉 संकल्प पूर्ण — Bodhi is proud of you!</span>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Quick actions */}
        <div style={{ display: 'flex', gap: '0.42rem', marginTop: '0.85rem' }}>
          <motion.button whileTap={{ scale: 0.93 }} onClick={goAddHabit}
            style={{ flex: 1, padding: '0.55rem 0.4rem', borderRadius: 13, background: 'linear-gradient(135deg,rgba(124,58,237,0.18),rgba(168,85,247,0.1))', border: '1px solid rgba(139,92,246,0.32)', color: '#c4b5fd', fontSize: '0.63rem', fontWeight: 800, fontFamily: "'Outfit',sans-serif", cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Plus size={11} /> New Habit
          </motion.button>
          <div style={{ flex: 1, padding: '0.55rem 0.4rem', borderRadius: 13, background: pendingHabits.length > 0 ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${pendingHabits.length > 0 ? 'rgba(251,191,36,0.22)' : 'rgba(255,255,255,0.07)'}`, color: pendingHabits.length > 0 ? '#fbbf24' : 'rgba(255,255,255,0.22)', fontSize: '0.63rem', fontWeight: 800, fontFamily: "'Outfit',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Zap size={11} /> {pendingHabits.length > 0 ? `${pendingHabits.length} Pending` : 'All Done ✓'}
          </div>
          <div style={{ flex: 1, padding: '0.55rem 0.4rem', borderRadius: 13, background: logStory.length > 0 ? 'rgba(34,211,238,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${logStory.length > 0 ? 'rgba(34,211,238,0.22)' : 'rgba(255,255,255,0.07)'}`, color: logStory.length > 0 ? '#22d3ee' : 'rgba(255,255,255,0.22)', fontSize: '0.63rem', fontWeight: 800, fontFamily: "'Outfit',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Flame size={11} /> {logStory.length > 0 ? `${logStory.length} Logged` : 'Log Now'}
          </div>
        </div>
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
