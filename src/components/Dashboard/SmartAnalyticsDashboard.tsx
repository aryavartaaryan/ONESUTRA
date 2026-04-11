'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sunrise, Sun, Sunset, Moon, Sparkles, Plus, CheckCircle2, Bell, Zap, Flame } from 'lucide-react';
import { getTodayLogStory, saveToDailyLogStory, type DailyLogEntry } from '@/components/Dashboard/SmartLogBubbles';
import { bodhiSpeakLog } from '@/lib/bodhiVoice';
import { useLifestyleEngine } from '@/hooks/useLifestyleEngine';
import { getLevelFromXP, getNextLevel, getToday, type HabitItem, type HabitCategory } from '@/stores/lifestyleStore';

// ─── Constants ────────────────────────────────────────────────────────────────
const LIFE_AREA_COLORS: Record<string, string> = {
  mental: '#22d3ee', physical: '#4ade80', social: '#fb923c',
  professional: '#fbbf24', financial: '#a78bfa', spiritual: '#c084fc', creative: '#f472b6',
};
const CAT_CFG: Record<HabitCategory, { emoji: string; label: string; color: string }> = {
  morning: { emoji: '🌅', label: 'Morning', color: '#fbbf24' },
  midday:  { emoji: '☀️', label: 'Afternoon', color: '#fb923c' },
  evening: { emoji: '🌆', label: 'Evening', color: '#a78bfa' },
  night:   { emoji: '🌙', label: 'Night', color: '#60a5fa' },
  anytime: { emoji: '✦',  label: 'Anytime', color: '#4ade80' },
  sacred:  { emoji: '🔱', label: 'Sacred', color: '#c084fc' },
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
  { key: 'complete',   label: 'COMPLETE',   sub: 'done today', icon: '✅' },
  { key: 'earned',     label: 'EARNED',     sub: 'energy pts', icon: '⚡' },
];

const MEAL_SUBOPTIONS: Record<string, Array<{icon:string; label:string}>> = {
  breakfast: [
    {icon:'🥣',label:'Oats & fruits'},{icon:'🫓',label:'Parathas'},
    {icon:'🍳',label:'Eggs'},{icon:'🍵',label:'Just chai'},{icon:'🥛',label:'Smoothie'},
  ],
  lunch: [
    {icon:'🍚',label:'Dal rice'},{icon:'🫓',label:'Roti sabzi'},
    {icon:'🥗',label:'Light salad'},{icon:'🍕',label:'Outside food'},{icon:'⏭️',label:'Skipped'},
  ],
  dinner: [
    {icon:'🥗',label:'Light & clean'},{icon:'🍚',label:'Full meal'},
    {icon:'🫓',label:'Roti sabzi'},{icon:'🍕',label:'Cheat meal'},{icon:'⏭️',label:'Skipping'},
  ],
};

// ─── SmartLog store helpers ───────────────────────────────────────────────────
function getSmartLoggedToday(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem('onesutra_smartlog_v2') ?? '{}');
    const today = new Date().toISOString().split('T')[0];
    return new Set(raw[today] ?? []);
  } catch { return new Set(); }
}
function saveToSmartLog(id: string) {
  try {
    const raw = JSON.parse(localStorage.getItem('onesutra_smartlog_v2') ?? '{}');
    const today = new Date().toISOString().split('T')[0];
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
  if (h >= 2 && h < 6)  return { label: 'Brahma Muhurta', slotKey: 'morning' as HabitCategory, emoji: '🌟', color: '#fbbf24', Icon: Sparkles };
  if (h >= 6 && h < 11) return { label: 'Morning Focus',  slotKey: 'morning' as HabitCategory, emoji: '🌅', color: '#fbbf24', Icon: Sunrise };
  if (h >= 11 && h < 15) return { label: 'Midday Focus',  slotKey: 'midday'  as HabitCategory, emoji: '☀️', color: '#fb923c', Icon: Sun };
  if (h >= 15 && h < 18) return { label: 'Evening Focus',   slotKey: 'evening' as HabitCategory, emoji: '�', color: '#f97316', Icon: Sunset };
  if (h >= 18 && h < 22) return { label: 'Evening Focus',   slotKey: 'evening' as HabitCategory, emoji: '🌆', color: '#a78bfa', Icon: Sunset };
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
      style={{ display: 'flex', alignItems: 'center', gap: 0, borderRadius: 18, marginBottom: '0.45rem', position: 'relative', overflow: 'hidden',
        background: isCompleted
          ? `linear-gradient(135deg, ${color}28 0%, rgba(0,0,0,0.55) 100%)`
          : `linear-gradient(135deg, ${color}16 0%, rgba(6,4,22,0.7) 100%)`,
        border: `1.5px solid ${isCompleted ? color + '55' : color + '32'}`,
        boxShadow: isCompleted
          ? `0 6px 28px ${color}22, inset 0 1px 0 rgba(255,255,255,0.07)`
          : `0 3px 18px ${color}12, inset 0 1px 0 rgba(255,255,255,0.04)`,
        cursor: isCompleted ? 'default' : 'pointer' }}>
      {/* Shimmer flash on complete */}
      <AnimatePresence>
        {flash && <motion.div initial={{ opacity: 0.8, x: '-100%' }} animate={{ opacity: 0, x: '100%' }} exit={{ opacity: 0 }} transition={{ duration: 0.55 }}
          style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, transparent, ${color}45, transparent)`, zIndex: 5, pointerEvents: 'none' }} />}
      </AnimatePresence>
      {/* Vivid left accent */}
      <div style={{ width: 5, alignSelf: 'stretch', flexShrink: 0,
        background: isCompleted ? `linear-gradient(180deg, ${color}, ${color}88)` : `linear-gradient(180deg, ${color}cc, ${color}44)`,
        borderRadius: '18px 0 0 18px', boxShadow: isCompleted ? `2px 0 12px ${color}60` : `2px 0 8px ${color}30` }} />
      {/* Icon badge */}
      <div style={{ margin: '0.65rem 0.6rem 0.65rem 0.72rem', width: 42, height: 42, borderRadius: 14, flexShrink: 0,
        background: `linear-gradient(135deg, ${color}28, ${color}10)`,
        border: `1.5px solid ${color}38`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', position: 'relative',
        boxShadow: `0 4px 16px ${color}22` }}>
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
        <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif",
          color: isCompleted ? color : 'rgba(255,255,255,0.92)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          textShadow: isCompleted ? `0 0 16px ${color}60` : 'none' }}>{habit.name}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.28rem', marginTop: 3 }}>
          <span style={{ fontSize: '0.55rem', padding: '0.07rem 0.35rem', borderRadius: 99,
            background: `linear-gradient(90deg, ${cat.color}18, ${cat.color}08)`,
            border: `1px solid ${cat.color}30`, color: cat.color,
            fontFamily: "'Outfit', sans-serif", fontWeight: 800, letterSpacing: '0.04em' }}>{cat.emoji} {cat.label}</span>
          {streak > 0 && (
            <span style={{ fontSize: '0.55rem', color: streak >= 7 ? '#fbbf24' : '#fb923c', fontWeight: 800,
              fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: 2 }}>
              {streak >= 21 ? '🔱' : '🔥'}{streak}
            </span>
          )}
        </div>
      </div>
      {/* Right action */}
      <div style={{ paddingRight: '0.65rem', flexShrink: 0 }}>
        {isCompleted
          ? <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}
              style={{ fontSize: '0.55rem', padding: '0.18rem 0.5rem', borderRadius: 99,
                background: `linear-gradient(135deg, ${color}28, ${color}14)`,
                border: `1px solid ${color}45`, color,
                fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>✓ Done</motion.span>
          : <motion.div whileTap={{ scale: 0.82 }}
              style={{ width: 32, height: 32, borderRadius: '50%',
                background: `radial-gradient(circle, ${color}25, ${color}10)`,
                border: `2px solid ${color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 12px ${color}30` }}>
              <CheckCircle2 size={16} style={{ color: `${color}bb` }} />
            </motion.div>
        }
      </div>
    </motion.div>
  );
}

function MealLoggingSection({ smartLoggedToday, onLogged, slotKey }: {
  smartLoggedToday: Set<string>; onLogged: () => void; slotKey: HabitCategory;
}) {
  const [expanded, setExpanded] = useState(false);
  const MEAL_BY_SLOT: Record<string, { id: string; icon: string; label: string; time: string; color: string } | null> = {
    morning: { id: 'breakfast', icon: '🥣', label: 'Breakfast', time: '7–9 AM', color: '#34d399' },
    midday:  { id: 'lunch',     icon: '🍱', label: 'Lunch',     time: '12–1 PM', color: '#f59e0b' },
    evening: { id: 'dinner',    icon: '🌙', label: 'Dinner',    time: '6–8 PM',  color: '#a78bfa' },
    night:   { id: 'dinner',    icon: '🌙', label: 'Dinner',    time: '6–8 PM',  color: '#a78bfa' },
    sacred:  null,
    anytime: null,
  };
  const meal = MEAL_BY_SLOT[slotKey] ?? null;
  if (!meal) return null;

  const isDone = smartLoggedToday.has(meal.id);
  const subs = MEAL_SUBOPTIONS[meal.id] ?? [];
  const color = meal.color;

  const logMeal = () => {
    try {
      const raw = JSON.parse(localStorage.getItem('onesutra_smartlog_v2') ?? '{}');
      const today = new Date().toISOString().split('T')[0];
      const s = new Set<string>(raw[today] ?? []);
      s.add(meal.id); raw[today] = [...s];
      localStorage.setItem('onesutra_smartlog_v2', JSON.stringify(raw));
    } catch { /* ignore */ }
    saveToDailyLogStory(meal.id, meal.icon, meal.label, color);
    window.dispatchEvent(new CustomEvent('daily-log-story-updated'));
    setExpanded(false);
    onLogged();
  };

  return (
    <motion.div layout style={{
      borderRadius: 18, marginBottom: '0.45rem', position: 'relative', overflow: 'hidden',
      background: isDone
        ? `linear-gradient(135deg, ${color}28 0%, rgba(0,0,0,0.55) 100%)`
        : expanded
          ? `linear-gradient(135deg, ${color}1e 0%, rgba(6,4,22,0.7) 100%)`
          : `linear-gradient(135deg, ${color}16 0%, rgba(6,4,22,0.7) 100%)`,
      border: `1.5px solid ${isDone ? color + '55' : expanded ? color + '48' : color + '32'}`,
      boxShadow: isDone ? `0 6px 28px ${color}22` : `0 3px 18px ${color}12`,
    }}>
      {/* Left accent bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5,
        background: isDone ? `linear-gradient(180deg, ${color}, ${color}88)` : `linear-gradient(180deg, ${color}cc, ${color}44)`,
        borderRadius: '18px 0 0 18px', boxShadow: isDone ? `2px 0 12px ${color}60` : `2px 0 8px ${color}30` }} />
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, paddingLeft: 5, cursor: isDone ? 'default' : 'pointer' }}
        onClick={() => { if (!isDone) setExpanded(p => !p); }}>
        {/* Icon badge */}
        <div style={{ margin: '0.65rem 0.6rem 0.65rem 0.72rem', width: 42, height: 42, borderRadius: 14, flexShrink: 0,
          background: `linear-gradient(135deg, ${color}28, ${color}10)`, border: `1.5px solid ${color}38`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', position: 'relative',
          boxShadow: `0 4px 16px ${color}22` }}>
          {meal.icon}
          {isDone && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              style={{ position: 'absolute', inset: 0, borderRadius: 14, background: `${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={20} style={{ color }} />
            </motion.div>
          )}
          {!isDone && (
            <motion.div animate={{ scale: [1, 1.6, 1], opacity: [0.35, 0, 0.35] }} transition={{ duration: 2.8, repeat: Infinity }}
              style={{ position: 'absolute', inset: -3, borderRadius: 17, border: `1.5px solid ${color}40`, pointerEvents: 'none' }} />
          )}
        </div>
        {/* Name + tag */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: '0.3rem' }}>
          <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif",
            color: isDone ? color : 'rgba(255,255,255,0.92)',
            textShadow: isDone ? `0 0 16px ${color}60` : 'none' }}>{meal.label}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.28rem', marginTop: 3 }}>
            <span style={{ fontSize: '0.55rem', padding: '0.07rem 0.35rem', borderRadius: 99,
              background: `linear-gradient(90deg, ${color}18, ${color}08)`, border: `1px solid ${color}30`, color,
              fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>🍽 {meal.time}</span>
            {!isDone && !expanded && <span style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.28)', fontFamily: "'Outfit', sans-serif" }}>tap to log</span>}
          </div>
        </div>
        {/* Right action */}
        <div style={{ paddingRight: '0.65rem', flexShrink: 0 }}>
          {isDone
            ? <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}
                style={{ fontSize: '0.55rem', padding: '0.18rem 0.5rem', borderRadius: 99,
                  background: `linear-gradient(135deg, ${color}28, ${color}14)`,
                  border: `1px solid ${color}45`, color, fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>✓ Done</motion.span>
            : <motion.div whileTap={{ scale: 0.82 }}
                style={{ width: 32, height: 32, borderRadius: '50%',
                  background: `radial-gradient(circle, ${color}25, ${color}10)`,
                  border: `2px solid ${expanded ? color + '90' : color + '50'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 12px ${color}30` }}>
                <CheckCircle2 size={16} style={{ color: `${color}bb` }} />
              </motion.div>
          }
        </div>
      </div>
      {/* Expandable sub-option pills */}
      <AnimatePresence>
        {expanded && !isDone && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 0.75rem 0.65rem', display: 'flex', flexDirection: 'column', gap: '0.18rem' }}>
              <p style={{ margin: '0 0 0.28rem', fontSize: '0.6rem', color, fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                {meal.icon} What did you have? →
              </p>
              <div className="meal-pill-row" style={{ display: 'flex', gap: '0.26rem', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
                <style>{`.meal-pill-row::-webkit-scrollbar{display:none}`}</style>
                {subs.map(sub => (
                  <motion.button key={sub.label} whileTap={{ scale: 0.88 }} onClick={logMeal}
                    style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
                      background: `radial-gradient(circle at 28% 28%, ${color}22, rgba(8,4,30,0.9))`,
                      border: `1px solid ${color}50`, borderRadius: 999,
                      padding: '0.32rem 0.75rem 0.32rem 0.5rem', cursor: 'pointer' }}>
                    <span style={{ fontSize: '1rem' }}>{sub.icon}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.82)', fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap' }}>{sub.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
  const engine = useLifestyleEngine();
  const router = useRouter();
  const goAddHabit = useCallback(() => router.push('/lifestyle/ayurvedic-habits'), [router]);

  useEffect(() => {
    setMounted(true);
    setLogStory(getTodayLogStory());
    setSmartLoggedToday(getSmartLoggedToday());
    const refresh = () => { setLogStory(getTodayLogStory()); setSmartLoggedToday(getSmartLoggedToday()); };
    window.addEventListener('focus', refresh);
    window.addEventListener('daily-log-story-updated', refresh);
    window.addEventListener('storage', refresh);
    const t = setInterval(refresh, 15_000);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('daily-log-story-updated', refresh);
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

  const handleComplete = useCallback(async (id: string) => {
    const habit = engine.activeHabits.find(h => h.id === id);
    engine.completeHabit(id);
    saveToSmartLog(id);
    if (habit) saveToDailyLogStory(id, habit.icon, habit.name, LIFE_AREA_COLORS[habit.lifeArea] ?? '#a78bfa');
    setSmartLoggedToday(getSmartLoggedToday());
    setCelebrateId(id);
    setTimeout(() => setCelebrateId(null), 1800);
    if (!habit) return;
    const siteLang = (typeof localStorage !== 'undefined' ? localStorage.getItem('site-lang') : null) ?? 'hi';
    try {
      const res = await fetch('/api/bodhi/habit-voice-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitName: habit.name, habitIcon: habit.icon, habitCategory: habit.category, habitLifeArea: habit.lifeArea, completedCount: 1, totalHabits: engine.activeHabits.length, currentTimeOfDay: habit.category, isFirstHabitToday: false, language: siteLang }),
      });
      if (res.ok) {
        const { voiceMessage } = await res.json();
        if (voiceMessage?.length > 10) {
          try { sessionStorage.setItem('bodhi_pending_inject', habit.name); } catch { /* ignore */ }
          const { speakBodhiRaw } = await import('@/lib/bodhiVoice');
          speakBodhiRaw(voiceMessage);
          return;
        }
      }
    } catch { /* fallback */ }
    bodhiSpeakLog({ habitIcon: habit.icon, habitName: habit.name, isLocked: false, timeSlot: 'morning' });
  }, [engine]);

  if (!mounted) return null;

  const slotCfg = getTimeSlotConfig();
  const SlotIcon = slotCfg.Icon;
  const { completedIds, skippedIds } = engine.getTodayStatus();
  const allCompletedIds = new Set([...completedIds, ...smartLoggedToday]);
  const slotsNow = slotCfg.slotKey === 'morning' ? ['morning','sacred','anytime'] : slotCfg.slotKey === 'midday' ? ['midday','anytime'] : slotCfg.slotKey === 'evening' ? ['evening','anytime'] : ['night','anytime'];
  const relevantHabits = engine.activeHabits.filter(h => slotsNow.includes(h.category ?? 'anytime'));
  const pendingHabits = relevantHabits.filter(h => !allCompletedIds.has(h.id) && !skippedIds.has(h.id));
  const doneHabits = engine.activeHabits.filter(h => allCompletedIds.has(h.id));
  const completedCount = engine.activeHabits.filter(h => allCompletedIds.has(h.id)).length;
  const totalHabits = engine.activeHabits.length;
  const completionRate = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;
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
    { ...AYUR_STAT_LABELS[0], val:`${completedCount}/${totalHabits}`, bg:`${ringColor}12`, border:`${ringColor}28`, col:'#fff' },
    { ...AYUR_STAT_LABELS[1], val:`${engine.consistencyScore}%`, bg:'rgba(192,132,252,0.1)', border:'rgba(192,132,252,0.22)', col:'#c084fc' },
    { ...AYUR_STAT_LABELS[2], val:`+${todayXP}`, bg:'rgba(251,191,36,0.1)', border:'rgba(251,191,36,0.22)', col:'#fbbf24' },
  ];
  return (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.2,duration:0.55}}
      style={{margin:'0 0.5rem 1rem',borderRadius:24,overflow:'hidden',position:'relative',border:`1.5px solid ${slotCfg.color}28`,boxShadow:`0 16px 48px rgba(0,0,0,0.45),inset 0 1px 0 rgba(255,255,255,0.07),0 0 40px ${slotCfg.color}08`}}>
      {globalBg&&<div style={{position:'absolute',inset:0,backgroundImage:`url('${globalBg}')`,backgroundSize:'cover',backgroundPosition:'center',transform:'scale(1.08)',filter:'blur(3px) brightness(0.35) saturate(1.2)',zIndex:0}}/>}
      <div style={{position:'absolute',inset:0,background:`radial-gradient(ellipse at 10% 0%,${slotCfg.color}18 0%,transparent 55%),radial-gradient(ellipse at 90% 100%,rgba(139,92,246,0.14) 0%,transparent 55%),linear-gradient(180deg,rgba(4,2,18,0.15) 0%,rgba(4,2,18,0.9) 100%)`,zIndex:1}}/>
      <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',fontSize:'16rem',opacity:0.016,zIndex:1,pointerEvents:'none',lineHeight:1,color:slotCfg.color}}>ॐ</div>
      <div style={{position:'relative',zIndex:2,padding:'0.85rem 0.9rem 0.8rem'}}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'flex-start',gap:'0.5rem',marginBottom:'0.6rem'}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',gap:'0.4rem'}}>
              <motion.span animate={{rotate:[0,14,-14,0],opacity:[0.7,1,0.7]}} transition={{duration:4,repeat:Infinity}} style={{fontSize:'1rem',flexShrink:0}}>✨</motion.span>
              <span style={{fontSize:'0.78rem',fontWeight:900,color:'#fbbf24',letterSpacing:'0.1em',textTransform:'uppercase',fontFamily:"'Outfit',sans-serif",textShadow:'0 0 24px rgba(251,191,36,0.45)'}}>Your Logging Progress Today</span>
            </div>
            {sanskrit&&<p style={{margin:'2px 0 0 1.5rem',fontSize:'0.7rem',color:`${slotCfg.color}aa`,fontFamily:'serif',fontStyle:'italic',letterSpacing:'0.04em'}}>{sanskrit} — दिनचर्या प्रगति</p>}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'0.35rem',flexShrink:0}}>
            {engine.todayMood&&<span style={{fontSize:'1.1rem'}}>{['😢','😔','😐','😊','🤩'][engine.todayMood.mood-1]}</span>}
            <motion.div animate={{boxShadow:[`0 0 0 0 ${slotCfg.color}40`,`0 0 0 5px ${slotCfg.color}00`]}} transition={{duration:2.2,repeat:Infinity}}
              style={{display:'flex',alignItems:'center',gap:4,padding:'0.2rem 0.55rem',borderRadius:99,background:`linear-gradient(135deg,${slotCfg.color}1e,${slotCfg.color}0a)`,border:`1px solid ${slotCfg.color}3e`}}>
              <motion.div animate={{opacity:[1,0.3,1]}} transition={{duration:1.8,repeat:Infinity}} style={{width:6,height:6,borderRadius:'50%',background:slotCfg.color,boxShadow:`0 0 8px ${slotCfg.color}`}}/>
              <slotCfg.Icon size={11} style={{color:slotCfg.color}}/>
              <span style={{fontSize:'0.57rem',fontWeight:800,color:slotCfg.color,fontFamily:"'Outfit',sans-serif",letterSpacing:'0.07em',textTransform:'uppercase'}}>{slotCfg.label}</span>
            </motion.div>
          </div>
        </div>
        {/* Status row */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.75rem'}}>
          <span style={{fontSize:'0.62rem',color:'rgba(255,255,255,0.4)',fontFamily:"'Outfit',sans-serif",fontStyle:'italic'}}>{statusText}</span>
          <span style={{fontSize:'0.58rem',color:'rgba(255,255,255,0.2)',fontFamily:"'Outfit',sans-serif"}}>{new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</span>
        </div>
        {/* Ring + Ayurvedic Stats + Week bar */}
        <div style={{display:'flex',alignItems:'center',gap:'1rem',marginBottom:'0.65rem'}}>
          <div style={{position:'relative',flexShrink:0,width:100,height:100}}>
            <motion.div animate={{opacity:[0.35,0.65,0.35]}} transition={{duration:3,repeat:Infinity}}
              style={{position:'absolute',inset:-5,borderRadius:'50%',background:`conic-gradient(${ringColor}28 ${completionRate*3.6}deg,transparent ${completionRate*3.6}deg)`,filter:'blur(5px)'}}/>
            <ProgressRing pct={completionRate} size={100} stroke={9} color={ringColor}/>
            <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
              <span style={{fontSize:'1.45rem',fontWeight:900,color:ringColor,fontFamily:"'Outfit',sans-serif",lineHeight:1,textShadow:`0 0 20px ${ringColor}90`}}>{Math.round(completionRate)}%</span>
              <span style={{fontSize:'0.38rem',color:'rgba(255,255,255,0.28)',fontFamily:'serif',fontStyle:'italic',marginTop:2}}>सिद्धि</span>
            </div>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.35rem',marginBottom:'0.52rem'}}>
              {statVals.map((s,i)=>(
                <div key={i} style={{textAlign:'center',padding:'0.38rem 0.1rem',borderRadius:13,background:`linear-gradient(135deg,${s.bg},rgba(0,0,0,0.2))`,border:`1px solid ${s.border}`}}>
                  <p style={{margin:0,fontSize:'0.9rem',fontWeight:900,color:s.col,fontFamily:"'Outfit',sans-serif",lineHeight:1}}>{s.val}</p>
                  <p style={{margin:'2px 0 0',fontSize:'0.41rem',color:s.col,opacity:0.65,fontFamily:"'Outfit',sans-serif",textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:800}}>{s.label}</p>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:'0.2rem',alignItems:'flex-end'}}>
              {weekDays.map((day,i)=>(
                <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                  <div style={{width:'100%',height:22,borderRadius:4,background:'rgba(255,255,255,0.05)',overflow:'hidden',position:'relative'}}>
                    <motion.div initial={{height:0}} animate={{height:`${day.pct}%`}} transition={{duration:0.9,delay:i*0.07,ease:'easeOut'}}
                      style={{position:'absolute',bottom:0,left:0,right:0,background:day.pct>=80?'linear-gradient(180deg,#4ade80,#22d3ee)':day.pct>=40?'linear-gradient(180deg,#fbbf24,#fb923c)':day.pct>0?'rgba(255,255,255,0.18)':'transparent',borderRadius:4,boxShadow:day.pct>=80?'0 0 8px rgba(74,222,128,0.6)':'none'}}/>
                  </div>
                  <span style={{fontSize:'0.37rem',color:'rgba(255,255,255,0.26)',fontFamily:"'Outfit',sans-serif",fontWeight:700,textTransform:'uppercase'}}>{day.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Tapas Level bar */}
        <div style={{display:'flex',alignItems:'center',gap:'0.38rem',marginBottom:'0.65rem',padding:'0.42rem 0.65rem',borderRadius:12,background:'rgba(251,191,36,0.06)',border:'1px solid rgba(251,191,36,0.14)'}}>
          <span style={{fontSize:'0.85rem',flexShrink:0}}>{levelInfo.icon}</span>
          <div style={{flex:1}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
              <div style={{display:'flex',alignItems:'center',gap:'0.28rem'}}>
                <span style={{fontSize:'0.62rem',color:'#fbbf24',fontWeight:900,fontFamily:"'Outfit',sans-serif"}}>{levelInfo.name}</span>
                <span style={{fontSize:'0.48rem',color:'rgba(251,191,36,0.42)',fontFamily:'serif',fontStyle:'italic'}}>Tapas Level</span>
              </div>
              <span style={{fontSize:'0.5rem',color:'rgba(255,255,255,0.2)',fontFamily:"'Outfit',sans-serif"}}>{engine.xp.total} XP · {maxStreak>0?`${maxStreak}🔥`:'—'}</span>
            </div>
            <div style={{height:5,borderRadius:3,background:'rgba(255,255,255,0.07)',overflow:'hidden'}}>
              <motion.div initial={{width:0}} animate={{width:`${xpPct}%`}} transition={{duration:1.2,ease:'easeOut'}}
                style={{height:'100%',background:'linear-gradient(90deg,#fbbf24,#f97316,#ef4444)',borderRadius:3,boxShadow:'0 0 10px rgba(251,191,36,0.6)'}}/>
            </div>
          </div>
        </div>
        {/* OM Divider */}
        <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.88rem'}}>
          <div style={{flex:1,height:1,background:`linear-gradient(90deg,transparent,${slotCfg.color}40)`}}/>
          <span style={{fontSize:'0.8rem',color:`${slotCfg.color}80`,fontFamily:'serif'}}>✦ ॐ ✦</span>
          <div style={{flex:1,height:1,background:`linear-gradient(90deg,${slotCfg.color}40,transparent)`}}/>
        </div>
        {/* Sadhana Section Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.52rem',flexWrap:'wrap',gap:'0.38rem'}}>
          <div style={{display:'flex',alignItems:'center',gap:'0.38rem',flexWrap:'wrap'}}>
            <span style={{fontSize:'0.82rem',fontWeight:900,color:'#fff',fontFamily:"'Outfit',sans-serif"}}>{slotCfg.emoji} {slotCfg.label} Activities</span>
            {pendingHabits.length>0&&(
              <motion.span animate={{opacity:[1,0.5,1]}} transition={{duration:2,repeat:Infinity}}
                style={{fontSize:'0.57rem',padding:'0.06rem 0.4rem',borderRadius:99,background:'rgba(251,191,36,0.14)',border:'1px solid rgba(251,191,36,0.32)',color:'#fbbf24',fontFamily:"'Outfit',sans-serif",fontWeight:700}}>
                {pendingHabits.length} pending
              </motion.span>
            )}
          </div>
          <motion.button whileTap={{scale:0.9}} onClick={goAddHabit}
            style={{position:'relative',background:'linear-gradient(135deg,#7c3aed,#a855f7,#ec4899)',border:'none',borderRadius:999,padding:'0.32rem 0.72rem',color:'#fff',fontSize:'0.68rem',fontWeight:800,cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontFamily:"'Outfit',sans-serif",boxShadow:'0 4px 18px rgba(124,58,237,0.45)',flexShrink:0}}>
            <motion.span style={{position:'absolute',top:-3,right:-3,width:8,height:8,borderRadius:'50%',background:'#f97316',border:'1.5px solid rgba(0,0,0,0.4)'}} animate={{scale:[1,1.5,1],opacity:[1,0.5,1]}} transition={{duration:1.8,repeat:Infinity}}/>
            <Bell size={10} fill="white"/> + Add Habit
          </motion.button>
        </div>
        {/* Tap hint */}
        {pendingHabits.length>0&&(
          <div style={{display:'flex',alignItems:'center',gap:'0.28rem',marginBottom:'0.38rem',padding:'0.28rem 0.6rem',borderRadius:10,background:'rgba(251,191,36,0.05)',border:'1px solid rgba(251,191,36,0.12)'}}>
            <motion.span animate={{scale:[1,1.3,1],opacity:[0.5,1,0.5]}} transition={{duration:1.8,repeat:Infinity}} style={{fontSize:'0.68rem'}}>👆</motion.span>
            <span style={{fontSize:'0.62rem',color:'rgba(255,255,255,0.36)',fontFamily:"'Outfit',sans-serif",fontStyle:'italic'}}>Tap to log · Bodhi celebrates with you</span>
          </div>
        )}
        {/* Crystal Tabs */}
        <div style={{display:'flex',gap:'0.25rem',marginBottom:'0.68rem'}}>
          {([{key:'pending',label:'To Do',emoji:'📋',count:pendingHabits.length},{key:'done',label:'Done',emoji:'✅',count:doneHabits.length},{key:'activity',label:'Activity',emoji:'⚡',count:logStory.length}] as const).map(tab=>{
            const active=activeTab===tab.key;
            return(
              <motion.button key={tab.key} whileTap={{scale:0.93}} onClick={()=>setActiveTab(tab.key)}
                style={{flex:1,padding:'0.45rem 0.2rem',borderRadius:14,border:`1.5px solid ${active?slotCfg.color+'58':'rgba(255,255,255,0.07)'}`,background:active?`linear-gradient(135deg,${slotCfg.color}1c,${slotCfg.color}08)`:'rgba(255,255,255,0.03)',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:2,boxShadow:active?`0 4px 18px ${slotCfg.color}22,inset 0 1px 0 ${slotCfg.color}18`:'none'}}>
                <span style={{fontSize:'0.65rem'}}>{tab.emoji}</span>
                <span style={{fontSize:'0.54rem',fontWeight:800,color:active?slotCfg.color:'rgba(255,255,255,0.3)',fontFamily:"'Outfit',sans-serif",letterSpacing:'0.04em'}}>{tab.label}</span>
                {tab.count>0&&<span style={{fontSize:'0.46rem',padding:'0.03rem 0.28rem',borderRadius:99,background:active?`${slotCfg.color}28`:'rgba(255,255,255,0.06)',color:active?slotCfg.color:'rgba(255,255,255,0.26)',fontFamily:"'Outfit',sans-serif",fontWeight:700}}>{tab.count}</span>}
              </motion.button>
            );
          })}
        </div>
        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab==='pending'&&(
            <motion.div key="pending" initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}} transition={{duration:0.2}}>
              <MealLoggingSection smartLoggedToday={smartLoggedToday} onLogged={() => setSmartLoggedToday(getSmartLoggedToday())} slotKey={slotCfg.slotKey} />
              {totalHabits===0?(
                <motion.div whileTap={{scale:0.97}} onClick={goAddHabit}
                  style={{textAlign:'center',padding:'1.5rem 1rem',border:'1.5px dashed rgba(167,139,250,0.24)',borderRadius:18,cursor:'pointer',background:'rgba(167,139,250,0.04)'}}>
                  <p style={{margin:'0 0 0.4rem',fontSize:'2rem'}}>🌱</p>
                  <p style={{margin:'0 0 0.65rem',color:'rgba(255,255,255,0.38)',fontSize:'0.84rem',fontFamily:"'Outfit',sans-serif"}}>No sadhana yet — begin your Ayurvedic practice</p>
                  <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'0.36rem 1rem',borderRadius:99,background:'rgba(139,92,246,0.22)',border:'1px solid rgba(167,139,250,0.38)',color:'#c4b5fd',fontSize:'0.74rem',fontWeight:800,fontFamily:"'Outfit',sans-serif"}}><Plus size={11}/> Add Ayurvedic Habits</span>
                </motion.div>
              ):pendingHabits.length===0?(
                <div style={{textAlign:'center',padding:'1.2rem 1rem',border:'1px solid rgba(74,222,128,0.22)',borderRadius:18,background:'rgba(74,222,128,0.04)'}}>
                  <motion.p animate={{scale:[1,1.15,1]}} transition={{duration:2,repeat:Infinity}} style={{margin:'0 0 0.25rem',fontSize:'1.5rem'}}>🪔</motion.p>
                  <p style={{margin:'0 0 0.12rem',color:'#4ade80',fontSize:'0.88rem',fontWeight:700,fontFamily:"'Outfit',sans-serif"}}>All {slotCfg.label.toLowerCase()} practices complete!</p>
                  <p style={{margin:0,color:'rgba(255,255,255,0.26)',fontSize:'0.62rem',fontFamily:'serif',fontStyle:'italic'}}>सिद्धि — Mastery achieved</p>
                </div>
              ):(
                <>
                  {pendingHabits.length>0&&(
                    <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}}
                      style={{display:'flex',alignItems:'center',gap:6,padding:'0.32rem 0.6rem',borderRadius:10,marginBottom:'0.42rem',background:'linear-gradient(135deg,rgba(251,191,36,0.06),rgba(139,92,246,0.04))',border:'1px solid rgba(251,191,36,0.14)'}}>
                      <span style={{fontSize:'0.82rem',flexShrink:0}}>🔥</span>
                      <p style={{margin:0,fontSize:'0.64rem',color:'rgba(255,255,255,0.42)',fontFamily:"'Outfit',sans-serif",lineHeight:1.3}}><span style={{color:'#fbbf24',fontWeight:800}}>Tap to log</span> — Bodhi speaks on every activity</p>
                    </motion.div>
                  )}
                  {pendingHabits.map(h=><MiniHabitCard key={h.id} habit={h} isCompleted={false} streak={engine.getHabitStreak(h.id)} onComplete={handleComplete}/>)}
                </>
              )}
            </motion.div>
          )}
          {activeTab==='done'&&(
            <motion.div key="done" initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}} transition={{duration:0.2}}>
              {doneHabits.length===0?(
                <div style={{textAlign:'center',padding:'1.3rem 1rem',border:'1px solid rgba(255,255,255,0.06)',borderRadius:18,background:'rgba(255,255,255,0.02)'}}>
                  <p style={{margin:'0 0 0.22rem',fontSize:'1.4rem'}}>🌅</p>
                  <p style={{margin:0,color:'rgba(255,255,255,0.3)',fontSize:'0.82rem',fontFamily:"'Outfit',sans-serif"}}>Nothing logged yet — your first practice awaits.</p>
                </div>
              ):(
                <>
                  <div style={{display:'flex',alignItems:'center',gap:'0.38rem',marginBottom:'0.45rem'}}>
                    <div style={{flex:1,height:1,background:'linear-gradient(90deg,transparent,rgba(74,222,128,0.32))'}}/>
                    <div style={{display:'flex',alignItems:'center',gap:'0.22rem'}}><CheckCircle2 size={11} style={{color:'#4ade80'}}/><span style={{fontSize:'0.52rem',color:'#4ade80',fontWeight:800,fontFamily:"'Outfit',sans-serif",letterSpacing:'0.07em'}}>{doneHabits.length} DONE TODAY</span></div>
                    <div style={{flex:1,height:1,background:'linear-gradient(90deg,rgba(74,222,128,0.32),transparent)'}}/>
                  </div>
                  {doneHabits.map(h=><MiniHabitCard key={h.id} habit={h} isCompleted={true} streak={engine.getHabitStreak(h.id)} onComplete={handleComplete}/>)}
                </>
              )}
            </motion.div>
          )}
          {activeTab==='activity'&&(
            <motion.div key="activity" initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}} transition={{duration:0.2}}>
              {logStory.length===0?(
                <div style={{textAlign:'center',padding:'1.3rem 1rem',border:'1px solid rgba(255,255,255,0.06)',borderRadius:18,background:'rgba(255,255,255,0.02)'}}>
                  <p style={{margin:'0 0 0.22rem',fontSize:'1.4rem'}}>⚡</p>
                  <p style={{margin:0,color:'rgba(255,255,255,0.3)',fontSize:'0.82rem',fontFamily:"'Outfit',sans-serif"}}>No Smart Log activities yet today.</p>
                </div>
              ):(
                <>
                  <p style={{margin:'0 0 0.32rem',fontSize:'0.52rem',fontWeight:800,color:'rgba(255,255,255,0.28)',letterSpacing:'0.12em',textTransform:'uppercase',fontFamily:"'Outfit',sans-serif"}}>⚡ Logged Today · Newest First</p>
                  <div style={{display:'flex',flexDirection:'column',gap:'0.25rem'}}>
                    {[...logStory].reverse().map((entry,i)=>{
                      const t=new Date(entry.loggedAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true});
                      return(
                        <motion.div key={`${entry.id}_tl`} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}
                          style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.38rem 0.6rem',borderRadius:12,background:`${entry.color}0d`,border:`1px solid ${entry.color}1e`}}>
                          <span style={{fontSize:'1rem',flexShrink:0}}>{entry.icon}</span>
                          <p style={{flex:1,margin:0,fontSize:'0.78rem',fontWeight:700,color:'rgba(255,255,255,0.85)',fontFamily:"'Outfit',sans-serif",overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{entry.label}</p>
                          <span style={{fontSize:'0.52rem',color:'rgba(255,255,255,0.25)',fontFamily:"'Outfit',sans-serif",flexShrink:0}}>{t}</span>
                          <span style={{fontSize:'0.48rem',padding:'0.04rem 0.26rem',borderRadius:99,background:`${entry.color}20`,color:entry.color,fontFamily:"'Outfit',sans-serif",fontWeight:800,flexShrink:0}}>✓</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        {/* Celebration toast */}
        <AnimatePresence>
          {celebrateId&&(
            <motion.div initial={{opacity:0,scale:0.88,y:8}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.88}}
              style={{marginTop:'0.6rem',textAlign:'center',padding:'0.52rem',borderRadius:16,background:'linear-gradient(135deg,rgba(74,222,128,0.1),rgba(34,211,238,0.06))',border:'1px solid rgba(74,222,128,0.22)'}}>
              <span style={{fontSize:'0.74rem',color:'#4ade80',fontWeight:800,fontFamily:"'Outfit',sans-serif"}}>🎉 संकल्प पूर्ण — Bodhi is proud of you!</span>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Quick actions */}
        <div style={{display:'flex',gap:'0.42rem',marginTop:'0.85rem'}}>
          <motion.button whileTap={{scale:0.93}} onClick={goAddHabit}
            style={{flex:1,padding:'0.55rem 0.4rem',borderRadius:13,background:'linear-gradient(135deg,rgba(124,58,237,0.18),rgba(168,85,247,0.1))',border:'1px solid rgba(139,92,246,0.32)',color:'#c4b5fd',fontSize:'0.63rem',fontWeight:800,fontFamily:"'Outfit',sans-serif",cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
            <Plus size={11}/> New Habit
          </motion.button>
          <motion.button whileTap={{scale:0.93}} onClick={()=>setActiveTab('pending')}
            style={{flex:1,padding:'0.55rem 0.4rem',borderRadius:13,background:pendingHabits.length>0?'rgba(251,191,36,0.1)':'rgba(255,255,255,0.03)',border:`1px solid ${pendingHabits.length>0?'rgba(251,191,36,0.28)':'rgba(255,255,255,0.07)'}`,color:pendingHabits.length>0?'#fbbf24':'rgba(255,255,255,0.22)',fontSize:'0.63rem',fontWeight:800,fontFamily:"'Outfit',sans-serif",cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
            <Zap size={11}/> {pendingHabits.length>0?`${pendingHabits.length} Pending`:'All Done ✓'}
          </motion.button>
          <motion.button whileTap={{scale:0.93}} onClick={()=>setActiveTab('activity')}
            style={{flex:1,padding:'0.55rem 0.4rem',borderRadius:13,background:logStory.length>0?'rgba(34,211,238,0.08)':'rgba(255,255,255,0.03)',border:`1px solid ${logStory.length>0?'rgba(34,211,238,0.24)':'rgba(255,255,255,0.07)'}`,color:logStory.length>0?'#22d3ee':'rgba(255,255,255,0.22)',fontSize:'0.63rem',fontWeight:800,fontFamily:"'Outfit',sans-serif",cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
            <Flame size={11}/> {logStory.length>0?`${logStory.length} Logged`:'Log Now'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
