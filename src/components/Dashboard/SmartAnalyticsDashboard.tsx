'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sunrise, Sun, Sunset, Moon, Sparkles, Plus, CheckCircle2, Bell, Zap, Flame } from 'lucide-react';
import { saveToDailyLogStory, getTodayLogStory, syncActivityEntryToFirestore, subscribeToActivityLog, clearLogStoryForOtherUsers, getSubOptionsForHabit, type DailyLogEntry, type SubOption } from './SmartLogBubbles';
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
import WellnessStoryCreator from './WellnessStoryCreator';
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

// ─── Complete reverse map: h_* ID → ALL matching Ayurvedic habit IDs ─────────
// H_ID_TO_AYUR only stores one entry per h_* ID but AYUR_TO_H_ID can map
// multiple Ayurvedic IDs to the same h_* (e.g. both 'evening_walk' and
// 'shatapavali' map to 'h_walk'). Build the full reverse here once.
const H_ID_TO_ALL_AYUR: Record<string, string[]> = {};
Object.entries(AYUR_TO_H_ID).forEach(([ayurId, hId]) => {
  if (!H_ID_TO_ALL_AYUR[hId]) H_ID_TO_ALL_AYUR[hId] = [];
  H_ID_TO_ALL_AYUR[hId].push(ayurId);
});

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
  h_wake_early: 0, h_warm_water: 1, h_bathing: 2,
  h_pranayama: 3, h_morning_meditation: 4,
  h_morning_sunlight: 5, h_gratitude: 6, h_breakfast: 7,
};
// SmartLog bubble ID → lifestyle-store h_* ID (for cross-section sync)
const SMARTLOG_TO_H_ID_SAD: Record<string, string> = {
  wake: 'h_wake_early', warm_water: 'h_warm_water',
  dant_manjan_bath: 'h_bathing', breathwork: 'h_pranayama',
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

// ─── Personalized To-Do subtitles for each Ayurvedic activity ────────────────
const TODO_SUBTITLES: Record<string, (name: string) => { headline: string; body: string }> = {
  h_wake_early: (n) => ({ headline: `Rise & Shine, ${n}!`, body: `It is wake up time. Rise, pay gratitude to God and start your sacred day. Tap to log once you've awakened.` }),
  warm_water_morning: (n) => ({ headline: `Ushapana time, ${n}!`, body: `It is Ushapana time — drink 2–4 glasses of warm water to flush overnight Ama and kindle your Agni. Just do it and log here.` }),
  dant_manjan_bath: (n) => ({ headline: `Purify & Recharge, ${n}!`, body: `Time to remove all Amas and do Bhoota Shuddhi. Use Ayurvedic Dant Manjan — it activates mouth energy centres and improves gut health too. Bathe with fresh natural water for five-element purification. These are not just habits but a scientific way to recharge body and mind. Do them and log here.` }),
  anulom_vilom: (n) => ({ headline: `Meditation & Workout, ${n}!`, body: `Time for morning breathwork, meditation and workout. Meditate using our Meditation section, then complete your workout — a complete recharge ritual for body and mind. Log here after.` }),
  kapalabhati: (n) => ({ headline: `Kapalabhati time, ${n}!`, body: `Skull-shining breath — powerful Kapha reducer and mind energiser. Purifies the lungs and ignites your Agni for the day ahead. Log after completing.` }),
  meditation: (n) => ({ headline: `Meditation & Workout, ${n}!`, body: `Time for morning meditation and workout. Meditate using our Meditation section, then do your workout. These recharge and rejuvenate your body and mind completely. Log here after both.` }),
  sunlight_morning: (n) => ({ headline: `Surya Darshana, ${n}!`, body: `Step outside and absorb Surya Shakti. Just 10+ minutes of morning light synchronises your circadian rhythm with the Ayurvedic clock. Log after absorbing the light.` }),
  gratitude_practice: (n) => ({ headline: `Gratitude time, ${n}!`, body: `Name 3 genuine moments of gratitude. This sacred practice programs Sattva into your nervous system and rewires the brain toward joy every single day. Log after reflecting.` }),
  morning_meal: (n) => ({ headline: `Breakfast time, ${n}!`, body: `It is time for a warm, nourishing breakfast. Try a healthy meal with seasonal foods — mindful nourishment 1–2 hours after waking to kindle Agni before the Pitta peak. Log after eating.` }),
  main_meal_noon: (n) => ({ headline: `Main Meal time, ${n}!`, body: `Your largest meal of the day. Between 12–1 PM your Agni is strongest — the very foundation of Ayurvedic diet and health. Eat with gratitude and mindfulness. Log after your meal.` }),
  shatapavali: (n) => ({ headline: `Post-Meal Walk, ${n}!`, body: `100 gentle steps after lunch — Shatapavali. It aids digestion without straining Agni. A simple 10-minute walk that transforms your health. Log after your walk.` }),
  deep_work_afternoon: (n) => ({ headline: `Deep Work time, ${n}!`, body: `Enter flow state during the Pitta peak — your sharpest mental clarity window. Channel the fire for undistracted, meaningful work. Log your session.` }),
  herbal_tea: (n) => ({ headline: `Herbal Tea time, ${n}!`, body: `Cumin-Coriander-Fennel tea — a tri-doshic digestive that reduces Ama and supports all three doshas. A simple, profound daily ritual. Log after sipping.` }),
  evening_walk: (n) => ({ headline: `Evening Walk, ${n}!`, body: `A gentle 20-minute Sandhya walk reduces Pitta and Kapha, grounds Vata and builds Ojas. Step outside into the evening light and log after returning.` }),
  light_dinner_early: (n) => ({ headline: `Dinner time, ${n}!`, body: `Light dinner by 7 PM gives your body 12+ hours to restore Ojas and repair cells before breakfast. Eat light, eat early. Log after dinner.` }),
  screen_free_hour: (n) => ({ headline: `Digital Sunset, ${n}!`, body: `No screens 1 hour before bed. This single habit preserves your Ojas and ensures deep, restorative Kapha-dominant sleep. Log after switching off screens.` }),
  journaling: (n) => ({ headline: `Reflection time, ${n}!`, body: `Evening Svadhyaya — process the day's experiences and release mental Ama through writing. A clear mind before sleep means deeper rest and a brighter tomorrow. Log after writing.` }),
  sleep_by_10: (n) => ({ headline: `Sleep time, ${n}!`, body: `Sleep by 10 PM in the Kapha hours — the sacred window for maximum Ojas restoration and deep cellular repair. Your most powerful wellness investment. Log before sleeping.` }),
};

function getActivitySubtitle(id: string, name: string, userName: string): { headline: string; body: string } {
  const fn = TODO_SUBTITLES[id];
  if (fn) return fn(userName);
  return {
    headline: `${name}, ${userName}!`,
    body: `It is time for ${name}. Complete this practice and log here to nurture your wellness journey.`,
  };
}


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
        display: 'flex', alignItems: 'center', gap: 0, borderRadius: 16, marginBottom: '0.36rem', position: 'relative', overflow: 'hidden',
        background: isCompleted
          ? `linear-gradient(135deg, ${color}28 0%, rgba(0,0,0,0.55) 100%)`
          : `linear-gradient(135deg, ${color}16 0%, rgba(6,4,22,0.7) 100%)`,
        border: `2px solid ${isCompleted ? color + '66' : color + '40'}`,
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
        width: 4, alignSelf: 'stretch', flexShrink: 0,
        background: isCompleted ? `linear-gradient(180deg, ${color}, ${color}88)` : `linear-gradient(180deg, ${color}cc, ${color}44)`,
        borderRadius: '18px 0 0 18px', boxShadow: isCompleted ? `2px 0 14px ${color}70` : `2px 0 10px ${color}40`
      }} />
      {/* Icon badge */}
      <div style={{
        margin: '0.52rem 0.48rem 0.52rem 0.62rem', width: 38, height: 38, borderRadius: 12, flexShrink: 0,
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
          margin: 0, fontSize: '0.84rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif",
          color: isCompleted ? color : 'rgba(255,255,255,0.92)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          textShadow: isCompleted ? `0 0 16px ${color}60` : 'none'
        }}>{habit.name}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.28rem', marginTop: 3 }}>
          <span style={{
            fontSize: '0.63rem', padding: '0.09rem 0.4rem', borderRadius: 99,
            background: `linear-gradient(90deg, ${cat.color}22, ${cat.color}0c)`,
            border: `1px solid ${cat.color}40`, color: cat.color,
            fontFamily: "'Outfit', sans-serif", fontWeight: 800, letterSpacing: '0.04em'
          }}>{cat.emoji} {cat.label}</span>
          {streak > 0 && (
            <span style={{
              fontSize: '0.63rem', color: streak >= 7 ? '#fbbf24' : '#fb923c', fontWeight: 800,
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

// ─── ToDo Duo Grid ─────────────────────────────────────────────────────────────
function TodoDuoGrid({
  current,
  next,
  slotColor,
  onLogCurrent,
  currentNum = 1,
  nextNum = 2,
  isLoggable = true,
}: {
  current: HabitItem;
  next: HabitItem | null;
  slotColor: string;
  onLogCurrent: (id: string) => void;
  currentNum?: number;
  nextNum?: number;
  isLoggable?: boolean;
}) {
  const userName = typeof window !== 'undefined' ? getLocalUserNameSAD() : 'friend';
  const curSub = getActivitySubtitle(current.id, current.name, userName);
  const nextSub = next ? getActivitySubtitle(next.id, next.name, userName) : null;
  const curColor = current.color ?? slotColor;
  const nxtColor = next ? (next.color ?? slotColor) : slotColor;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: next ? '1fr 1fr' : '1fr', gap: '0.5rem', marginBottom: '0.65rem' }}>
      {/* ── Current Activity Card ── */}
      <div
        onClick={isLoggable ? () => onLogCurrent(current.id) : undefined}
        style={{
          borderRadius: 22, padding: '0.9rem 0.78rem',
          background: isLoggable
            ? `linear-gradient(145deg, ${curColor}28 0%, rgba(4,2,18,0.9) 100%)`
            : `linear-gradient(145deg, ${curColor}12 0%, rgba(4,2,18,0.82) 100%)`,
          border: isLoggable ? `2px solid ${curColor}70` : `1.5px solid ${curColor}30`,
          boxShadow: isLoggable ? `0 8px 36px ${curColor}28, 0 2px 0 ${curColor}18 inset` : 'none',
          cursor: isLoggable ? 'pointer' : 'default', position: 'relative', overflow: 'hidden',
          minHeight: 170, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
        }}
      >
        {/* number badge top-left */}
        <div style={{
          position: 'absolute', top: 8, left: 9, zIndex: 2,
          width: 18, height: 18, borderRadius: '50%',
          background: isLoggable ? curColor : `${curColor}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.46rem', fontWeight: 900, color: isLoggable ? '#000' : `${curColor}cc`,
          fontFamily: "'Outfit',sans-serif",
        }}>{currentNum}</div>
        {/* ambient glow pulse */}
        {isLoggable && <motion.div
          animate={{ opacity: [0.15, 0.4, 0.15] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 0%, ${curColor}44 0%, transparent 72%)`, pointerEvents: 'none', zIndex: 0 }}
        />}
        {/* NOW / LOCKED badge top-right */}
        {isLoggable
          ? <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
              style={{ position: 'absolute', top: 9, right: 9, zIndex: 2, fontSize: '0.38rem', padding: '0.12rem 0.38rem', borderRadius: 99, background: `${curColor}28`, border: `1px solid ${curColor}68`, color: curColor, fontWeight: 900, fontFamily: "'Outfit',sans-serif", letterSpacing: '0.1em' }}>● NOW</motion.div>
          : <div style={{ position: 'absolute', top: 9, right: 9, zIndex: 2, fontSize: '0.38rem', padding: '0.12rem 0.38rem', borderRadius: 99, background: `${curColor}14`, border: `1px solid ${curColor}30`, color: `${curColor}88`, fontWeight: 900, fontFamily: "'Outfit',sans-serif", letterSpacing: '0.1em' }}>🔒</div>
        }
        {/* Card content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.span
            animate={{ filter: [`drop-shadow(0 0 6px ${curColor}60)`, `drop-shadow(0 0 14px ${curColor}90)`, `drop-shadow(0 0 6px ${curColor}60)`] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            style={{ fontSize: '1.9rem', lineHeight: 1, display: 'block', marginBottom: '0.45rem' }}
          >{current.icon}</motion.span>
          <p style={{ margin: '0 0 0.3rem', fontSize: '0.73rem', fontWeight: 900, color: curColor, fontFamily: "'Outfit',sans-serif", lineHeight: 1.22, paddingRight: '1.4rem', textShadow: `0 0 20px ${curColor}50` }}>
            {curSub.headline}
          </p>
          <p style={{ margin: 0, fontSize: '0.54rem', color: 'rgba(255,255,255,0.68)', fontFamily: "'Outfit',sans-serif", lineHeight: 1.55, fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {curSub.body}
          </p>
        </div>
        {isLoggable
          ? <div style={{ marginTop: '0.65rem', position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '0.48rem 0.6rem', borderRadius: 13, background: `linear-gradient(135deg,${curColor}3a,${curColor}18)`, border: `1.5px solid ${curColor}55`, boxShadow: `0 4px 18px ${curColor}28`, touchAction: 'manipulation' }}>
              <CheckCircle2 size={13} style={{ color: curColor }} />
              <span style={{ fontSize: '0.64rem', fontWeight: 900, color: curColor, fontFamily: "'Outfit',sans-serif" }}>Tap to Log ✦</span>
            </div>
          : <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '0.42rem 0.6rem', borderRadius: 13, background: `${curColor}08`, border: `1px solid ${curColor}22` }}>
              <span style={{ fontSize: '0.68rem' }}>🔒</span>
              <span style={{ fontSize: '0.58rem', fontWeight: 700, color: `${curColor}88`, fontFamily: "'Outfit',sans-serif" }}>Locked · Log #1 first</span>
            </div>
        }
      </div>

      {/* ── Next Activity Card — locked, fully visible, no blur ── */}
      {next && nextSub && (
        <div style={{
          borderRadius: 22, padding: '0.9rem 0.78rem',
          background: `linear-gradient(145deg, ${nxtColor}12 0%, rgba(4,2,18,0.82) 100%)`,
          border: `1.5px solid ${nxtColor}30`,
          minHeight: 170, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* number badge */}
          <div style={{ position: 'absolute', top: 8, left: 9, zIndex: 2, width: 18, height: 18, borderRadius: '50%', background: `${nxtColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.46rem', fontWeight: 900, color: `${nxtColor}cc`, fontFamily: "'Outfit',sans-serif" }}>{nextNum}</div>
          {/* locked badge */}
          <div style={{ position: 'absolute', top: 9, right: 9, fontSize: '0.38rem', padding: '0.12rem 0.38rem', borderRadius: 99, background: `${nxtColor}14`, border: `1px solid ${nxtColor}35`, color: `${nxtColor}88`, fontWeight: 900, fontFamily: "'Outfit',sans-serif" }}>🔒</div>
          {/* Card content — no filter, no grayscale, fully readable */}
          <div>
            <span style={{ fontSize: '1.9rem', lineHeight: 1, display: 'block', marginBottom: '0.45rem' }}>{next.icon}</span>
            <p style={{ margin: '0 0 0.3rem', fontSize: '0.73rem', fontWeight: 900, color: `${nxtColor}cc`, fontFamily: "'Outfit',sans-serif", lineHeight: 1.22, paddingRight: '1.4rem' }}>
              {next.name}
            </p>
            <p style={{ margin: 0, fontSize: '0.54rem', color: 'rgba(255,255,255,0.56)', fontFamily: "'Outfit',sans-serif", lineHeight: 1.55, fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {nextSub.body}
            </p>
          </div>
          {/* Lock indicator — shows locked state without dimming the card */}
          <div style={{
            marginTop: '0.65rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            padding: '0.42rem 0.6rem', borderRadius: 13,
            background: `${nxtColor}08`, border: `1px solid ${nxtColor}22`,
          }}>
            <span style={{ fontSize: '0.68rem' }}>🔒</span>
            <span style={{ fontSize: '0.58rem', fontWeight: 700, color: `${nxtColor}88`, fontFamily: "'Outfit',sans-serif" }}>
              Locked · Log current first
            </span>
          </div>
        </div>
      )}
    </div>
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
  const [storyTrigger, setStoryTrigger] = useState<{ id: string; name: string; emoji: string } | null>(null);
  const pendingScrollRef = useRef<HTMLDivElement>(null);
  const [pendingSlide, setPendingSlide] = useState(0);
  const autoSlideUserTouchedRef = useRef(false);

  // Auto-slide: advances every 3.5 s, pauses 7 s after user manually swipes
  useEffect(() => {
    const timer = setInterval(() => {
      if (autoSlideUserTouchedRef.current) return;
      const el = pendingScrollRef.current;
      if (!el || el.scrollWidth <= el.clientWidth + 4) return; // single slide — skip
      const nextLeft = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
        ? 0
        : el.scrollLeft + el.clientWidth;
      el.scrollTo({ left: nextLeft, behavior: 'smooth' });
    }, 3500);
    return () => clearInterval(timer);
  }, []);
  const [expandedSlots, setExpandedSlots] = useState<Record<string, boolean>>({});
  const [progressOpen, setProgressOpen] = useState(false);
  const [loggedOpen, setLoggedOpen] = useState(false);
  // Ayurvedic completion state: shared localStorage + Firestore
  const [ayurCompletedIds, setAyurCompletedIds] = useState<Set<string>>(() => getTodayAyurCompletedIds());
  const engine = useLifestyleEngine();
  const { user } = useOneSutraAuth();
  const router = useRouter();
  const goAddHabit = useCallback(() => router.push('/lifestyle/ayurvedic-habits'), [router]);

  // Clear stale log entries when a different account logs in
  useEffect(() => {
    if (!user?.uid) return;
    clearLogStoryForOtherUsers(user.uid);
    setLogStory(getTodayLogStory(user.uid));
  }, [user?.uid]);

  useEffect(() => {
    setMounted(true);
    setLogStory(getTodayLogStory(user?.uid));
    setSmartLoggedToday(getSmartLoggedToday());
    setAyurCompletedIds(getTodayAyurCompletedIds());
    // Sync expanded slots with current time on mount (fixes stale state from earlier sessions)
    const h = new Date().getHours();
    setExpandedSlots({ morning: h >= 4 && h < 12, noon: h >= 12 && h < 17, evening: h >= 17 });
    const refresh = () => {
      setLogStory(getTodayLogStory(user?.uid));
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
      saveToDailyLogStory(id, ayurHabit.emoji, ayurHabit.name, slotCfgColor, user?.uid);
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
    // Trigger story sharing after the celebration toast
    setTimeout(() => setStoryTrigger({ id, name: ayurHabit.name, emoji: ayurHabit.emoji }), 1600);
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
    const _cfg = getTimeSlotConfig();
    const _ts = (_cfg.slotKey === 'morning' ? 'morning' : _cfg.slotKey === 'midday' ? 'midday' : _cfg.slotKey === 'evening' ? 'evening' : 'night') as import('@/lib/bodhiVoice').TimeSlot;
    bodhiSpeakLog({ habitIcon: ayurHabit.emoji, habitName: ayurHabit.name, isLocked: false, timeSlot: _ts });
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
  // Always surface core meal habits for their slot — even if not in user’s habit store
  const MEAL_DEFAULTS: Partial<Record<typeof ayurSlot, string[]>> = {
    midday: ['main_meal_noon'],
    evening: ['light_dinner_early'],
  };
  const mealDefaultIds = MEAL_DEFAULTS[ayurSlot] ?? [];
  const slotAyurHabitsAll = [
    ...slotAyurHabits,
    ...AYURVEDIC_HABITS.filter(h => mealDefaultIds.includes(h.id) && !slotAyurHabits.some(s => s.id === h.id)),
  ].sort((a, b) => AYURVEDIC_HABITS.findIndex(h => h.id === a.id) - AYURVEDIC_HABITS.findIndex(h => h.id === b.id));

  // ── Merged completion: localStorage ayur + Firestore habit_logs ──
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  // firestoreAyurDone covers two cases so cross-device sync works for all habits:
  //   1. h_* alias logged → map via H_ID_TO_AYUR (e.g. h_walk → shatapavali)
  //   2. Direct ayurvedic ID logged (e.g. main_meal_noon — has no h_* alias)
  const firestoreAyurDone = new Set<string>();
  engine.habitLogs
    .filter(l => l.date === todayStr && l.completed)
    .forEach(l => {
      // Map h_* → ALL Ayurvedic IDs that alias to it (not just the canonical one)
      (H_ID_TO_ALL_AYUR[l.habitId] ?? []).forEach(aId => firestoreAyurDone.add(aId));
      // Also the singular H_ID_TO_AYUR entry for safety
      const aId = H_ID_TO_AYUR[l.habitId];
      if (aId) firestoreAyurDone.add(aId);
      // If the logged ID itself is a direct Ayurvedic ID (e.g. 'main_meal_noon', 'evening_walk')
      if (ayurvedic_ids_set.has(l.habitId)) firestoreAyurDone.add(l.habitId);
    });
  // SmartLog bubbles also count (e.g. legacy 'h_walk' bubble → all matching Ayurvedic IDs)
  const smartLogAyurDone = new Set<string>();
  smartLoggedToday.forEach(slId => {
    // slId can be a legacy bubble ID, an h_* ID, or a direct Ayurvedic ID
    const hId = SMARTLOG_TO_H_ID_SAD[slId] ?? slId;
    (H_ID_TO_ALL_AYUR[hId] ?? []).forEach(aId => smartLogAyurDone.add(aId));
    const aId = H_ID_TO_AYUR[hId];
    if (aId) smartLogAyurDone.add(aId);
    if (ayurvedic_ids_set.has(slId)) smartLogAyurDone.add(slId);
    if (ayurvedic_ids_set.has(hId)) smartLogAyurDone.add(hId);
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

  const pendingAyurItems = slotAyurHabitsAll.filter(h => !mergedAyurDone.has(h.id)).map(toHabitItem);
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

  const EVENING_ORDER: Record<string, number> = {
    h_evening_meditation: 1, evening_meditation: 1,
    light_dinner_early: 2,
    evening_walk: 3, h_walk: 3,
    screen_free_hour: 4, h_digital_sunset: 4,
    journaling: 5, h_brain_dump: 5,
  };
  const pendingHabits = slotCfg.slotKey === 'morning'
    ? [...pendingAyurItems, ...extraPending].sort((a, b) => (MORNING_PRACTICE_ORDER_SAD[AYUR_TO_H_ID[a.id] ?? a.id] ?? 99) - (MORNING_PRACTICE_ORDER_SAD[AYUR_TO_H_ID[b.id] ?? b.id] ?? 99))
    : slotCfg.slotKey === 'evening'
      ? [...pendingAyurItems, ...extraPending].sort((a, b) => (EVENING_ORDER[a.id] ?? EVENING_ORDER[AYUR_TO_H_ID[a.id] ?? ''] ?? 99) - (EVENING_ORDER[b.id] ?? EVENING_ORDER[AYUR_TO_H_ID[b.id] ?? ''] ?? 99))
      : [...pendingAyurItems, ...extraPending];
  const doneHabits = [...doneAyurItems, ...extraDone];

  const completedCount = slotAyurHabitsAll.filter(h => mergedAyurDone.has(h.id)).length + extraDone.length;
  const totalHabits = slotAyurHabitsAll.length + extraHabits.length;
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
    <>
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.55 }}
      style={{ margin: '0 0.5rem 1rem', borderRadius: 26, overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 24px 72px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
      {globalBg && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url('${globalBg}')`, backgroundSize: 'cover', backgroundPosition: 'center', transform: 'scale(1.08)', filter: 'blur(2px) brightness(0.55) saturate(1.2)', zIndex: 0 }} />}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 10% 0%,${slotCfg.color}22 0%,transparent 55%),radial-gradient(ellipse at 90% 100%,rgba(139,92,246,0.14) 0%,transparent 55%),linear-gradient(180deg,rgba(4,2,18,0.04) 0%,rgba(4,2,18,0.68) 100%)`, zIndex: 1 }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '16rem', opacity: 0.016, zIndex: 1, pointerEvents: 'none', lineHeight: 1, color: slotCfg.color }}>ॐ</div>
      <div style={{ position: 'relative', zIndex: 2, padding: '0.85rem 0.9rem 0.8rem' }}>
        {/* Header — compact & sleek */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.44rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <p style={{ margin: 0, fontSize: '0.5rem', fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: "'Outfit',sans-serif" }}>Daily Wins · दिनचर्या</p>
              {sanskrit && <span style={{ fontSize: '0.44rem', color: `${slotCfg.color}70`, fontFamily: 'serif', fontStyle: 'italic' }}>{sanskrit}</span>}
            </div>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => { if (typeof window !== 'undefined') window.location.href = '/pranaverse-chat'; }}
              animate={{ opacity: [0.88, 1, 0.88] }}
              transition={{ duration: 2.2, repeat: Infinity }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 5, padding: '0.26rem 0.68rem', borderRadius: 99, background: 'linear-gradient(90deg,#f472b622,#a78bfa18,#f472b614)', border: '1.5px solid #f472b650', cursor: 'pointer' }}
            >
              <span style={{ fontSize: '0.76rem' }}>👥</span>
              <span style={{ fontSize: '0.54rem', fontWeight: 900, color: '#f472b6', fontFamily: "'Outfit',sans-serif", letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Log · Share with Friends</span>
              <motion.span animate={{ x: [0, 3, 0] }} transition={{ duration: 1.4, repeat: Infinity }} style={{ fontSize: '0.54rem', color: '#f472b6' }}>→</motion.span>
            </motion.button>
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
        {/* ═══ SEE TODAY'S PROGRESS — TOP ══════════════════════════════════ */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setProgressOpen(o => !o)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.48rem 0.72rem', borderRadius: 14, marginBottom: '0.4rem', background: progressOpen ? `${slotCfg.color}14` : 'rgba(255,255,255,0.04)', border: `1.5px solid ${progressOpen ? slotCfg.color + '40' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.38rem' }}>
            <motion.span animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2.8, repeat: Infinity }} style={{ fontSize: '0.85rem' }}>📊</motion.span>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: progressOpen ? slotCfg.color : 'rgba(255,255,255,0.55)', fontFamily: "'Outfit',sans-serif" }}>See Today&#39;s Progress</span>
            <span style={{ fontSize: '0.44rem', padding: '0.04rem 0.28rem', borderRadius: 99, background: `${ringColor}18`, border: `1px solid ${ringColor}30`, color: ringColor, fontFamily: "'Outfit',sans-serif", fontWeight: 700 }}>{Math.round(completionRate)}% done</span>
          </div>
          <motion.span animate={{ rotate: progressOpen ? 180 : 0 }} transition={{ duration: 0.25 }} style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)' }}>▼</motion.span>
        </motion.button>
        <AnimatePresence initial={false}>
          {progressOpen && (
            <motion.div key="prog-panel" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} style={{ overflow: 'hidden', marginBottom: '0.5rem' }}>
              <div style={{ paddingBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.55rem' }}>
                  <span style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.34)', fontFamily: "'Outfit',sans-serif", fontStyle: 'italic' }}>{statusText}</span>
                  <span style={{ fontSize: '0.46rem', color: 'rgba(255,255,255,0.17)', fontFamily: "'Outfit',sans-serif" }}>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.6rem' }}>
                  <div style={{ position: 'relative', flexShrink: 0, width: 92, height: 92 }}>
                    <motion.div animate={{ opacity: [0.35, 0.65, 0.35] }} transition={{ duration: 3, repeat: Infinity }} style={{ position: 'absolute', inset: -5, borderRadius: '50%', background: `conic-gradient(${ringColor}28 ${completionRate * 3.6}deg,transparent ${completionRate * 3.6}deg)`, filter: 'blur(5px)' }} />
                    <ProgressRing pct={completionRate} size={92} stroke={8} color={ringColor} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '1.35rem', fontWeight: 900, color: ringColor, fontFamily: "'Outfit',sans-serif", lineHeight: 1, textShadow: `0 0 20px ${ringColor}90` }}>{Math.round(completionRate)}%</span>
                      <span style={{ fontSize: '0.36rem', color: 'rgba(255,255,255,0.28)', fontFamily: 'serif', fontStyle: 'italic', marginTop: 2 }}>सिद्धि</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.32rem', marginBottom: '0.48rem' }}>
                      {statVals.map((s, i) => (
                        <div key={i} style={{ textAlign: 'center', padding: '0.35rem 0.1rem', borderRadius: 12, background: `linear-gradient(135deg,${s.bg},rgba(0,0,0,0.2))`, border: `1px solid ${s.border}` }}>
                          <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 900, color: s.col, fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>{s.val}</p>
                          <p style={{ margin: '2px 0 0', fontSize: '0.39rem', color: s.col, opacity: 0.65, fontFamily: "'Outfit',sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'flex-end' }}>
                      {weekDays.map((day, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <div style={{ width: '100%', height: 20, borderRadius: 4, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', position: 'relative' }}>
                            <motion.div initial={{ height: 0 }} animate={{ height: `${day.pct}%` }} transition={{ duration: 0.9, delay: i * 0.07, ease: 'easeOut' }} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: day.pct >= 80 ? 'linear-gradient(180deg,#4ade80,#22d3ee)' : day.pct >= 40 ? 'linear-gradient(180deg,#fbbf24,#fb923c)' : day.pct > 0 ? 'rgba(255,255,255,0.18)' : 'transparent', borderRadius: 4, boxShadow: day.pct >= 80 ? '0 0 8px rgba(74,222,128,0.6)' : 'none' }} />
                          </div>
                          <span style={{ fontSize: '0.35rem', color: 'rgba(255,255,255,0.26)', fontFamily: "'Outfit',sans-serif", fontWeight: 700, textTransform: 'uppercase' }}>{day.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.38rem', padding: '0.38rem 0.6rem', borderRadius: 12, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.14)' }}>
                  <span style={{ fontSize: '0.82rem', flexShrink: 0 }}>{levelInfo.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.26rem' }}>
                        <span style={{ fontSize: '0.6rem', color: '#fbbf24', fontWeight: 900, fontFamily: "'Outfit',sans-serif" }}>{levelInfo.name}</span>
                        <span style={{ fontSize: '0.44rem', color: 'rgba(251,191,36,0.42)', fontFamily: 'serif', fontStyle: 'italic' }}>Tapas Level</span>
                      </div>
                      <span style={{ fontSize: '0.46rem', color: 'rgba(255,255,255,0.2)', fontFamily: "'Outfit',sans-serif" }}>{engine.xp.total} XP · {maxStreak > 0 ? `${maxStreak}🔥` : '—'}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 1.2, ease: 'easeOut' }} style={{ height: '100%', background: 'linear-gradient(90deg,#fbbf24,#f97316,#ef4444)', borderRadius: 3, boxShadow: '0 0 10px rgba(251,191,36,0.6)' }} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ SECTION A — TO DO (always visible) ══════════════════════════ */}
        <div style={{ marginBottom: '0.72rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.48rem' }}>
            <span style={{ fontSize: '0.85rem' }}>{slotCfg.emoji}</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#fff', fontFamily: "'Outfit',sans-serif", letterSpacing: '-0.01em' }}>
              {slotCfg.label}&nbsp;·&nbsp;<span style={{ color: slotCfg.color }}>To Do</span>
            </span>
            {pendingHabits.length > 0 ? (
              <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }}
                style={{ fontSize: '0.56rem', padding: '0.05rem 0.38rem', borderRadius: 99, background: `${slotCfg.color}18`, border: `1px solid ${slotCfg.color}38`, color: slotCfg.color, fontFamily: "'Outfit',sans-serif", fontWeight: 800 }}>
                {pendingHabits.length} pending ✦
              </motion.span>
            ) : totalHabits > 0 ? (
              <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}
                style={{ fontSize: '0.54rem', padding: '0.05rem 0.36rem', borderRadius: 99, background: 'rgba(74,222,128,0.14)', border: '1px solid rgba(74,222,128,0.28)', color: '#4ade80', fontFamily: "'Outfit',sans-serif", fontWeight: 800 }}>
                All done 🪔
              </motion.span>
            ) : null}
          </div>
          {totalHabits === 0 && logStory.length === 0 ? (
            <motion.div whileTap={{ scale: 0.97 }} onClick={goAddHabit}
              style={{ textAlign: 'center', padding: '1.2rem 1rem', border: '1.5px dashed rgba(167,139,250,0.24)', borderRadius: 16, cursor: 'pointer', background: 'rgba(167,139,250,0.04)' }}>
              <p style={{ margin: '0 0 0.3rem', fontSize: '1.8rem' }}>🌱</p>
              <p style={{ margin: '0 0 0.5rem', color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem', fontFamily: "'Outfit',sans-serif" }}>No habits yet — start your Ayurvedic journey!</p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.3rem 0.9rem', borderRadius: 99, background: 'rgba(139,92,246,0.22)', border: '1px solid rgba(167,139,250,0.38)', color: '#c4b5fd', fontSize: '0.7rem', fontWeight: 800, fontFamily: "'Outfit',sans-serif" }}><Plus size={10} /> Add Habits</span>
            </motion.div>
          ) : pendingHabits.length > 0 ? (
            <div>
              <style>{`.sad-pending::-webkit-scrollbar{display:none}`}</style>
              <div
                ref={pendingScrollRef}
                className="sad-pending"
                onScroll={() => {
                  if (!pendingScrollRef.current) return;
                  const el = pendingScrollRef.current;
                  const slide = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
                  setPendingSlide(slide);
                  // Pause auto-slide for 7 s after user manually swipes
                  autoSlideUserTouchedRef.current = true;
                  clearTimeout((pendingScrollRef.current as HTMLDivElement & { _pauseTimer?: ReturnType<typeof setTimeout> })._pauseTimer);
                  (pendingScrollRef.current as HTMLDivElement & { _pauseTimer?: ReturnType<typeof setTimeout> })._pauseTimer =
                    setTimeout(() => { autoSlideUserTouchedRef.current = false; }, 7000);
                }}
                style={{
                  display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory',
                  scrollbarWidth: 'none', gap: '0.45rem',
                }}
              >
                {Array.from({ length: Math.ceil(pendingHabits.length / 2) }, (_, i) => {
                  const curr = pendingHabits[i * 2];
                  const next = pendingHabits[i * 2 + 1] ?? null;
                  return (
                    <div key={i} style={{ flexShrink: 0, width: '100%', scrollSnapAlign: 'start' }}>
                      <TodoDuoGrid
                        current={curr}
                        next={next}
                        slotColor={slotCfgColor}
                        onLogCurrent={(hab) => { playConfirmChime(); setActiveSubHabitId(hab); }}
                        currentNum={i * 2 + 1}
                        nextNum={i * 2 + 2}
                        isLoggable={i === 0}
                      />
                    </div>
                  );
                })}
              </div>
              {Math.ceil(pendingHabits.length / 2) > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.3rem', marginTop: '0.3rem', marginBottom: '0.1rem' }}>
                  {Array.from({ length: Math.ceil(pendingHabits.length / 2) }, (_, i) => (
                    <motion.div
                      key={i}
                      animate={{ width: i === pendingSlide ? 18 : 5, background: i === pendingSlide ? slotCfgColor : 'rgba(255,255,255,0.18)' }}
                      transition={{ duration: 0.25 }}
                      style={{ height: 4, borderRadius: 99 }}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : totalHabits > 0 ? (
            <div style={{ textAlign: 'center', padding: '0.55rem', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 12, background: 'rgba(74,222,128,0.04)' }}>
              <motion.p animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ margin: '0 0 0.1rem', fontSize: '1.1rem' }}>🪔</motion.p>
              <p style={{ margin: 0, color: '#4ade80', fontSize: '0.72rem', fontWeight: 800, fontFamily: "'Outfit',sans-serif" }}>All {slotCfg.label} practices complete!</p>
            </div>
          ) : null}
        </div>

        {/* ── Divider ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.3rem 0 0.5rem' }}>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,transparent,${slotCfg.color}40)` }} />
          <span style={{ fontSize: '0.88rem', color: `${slotCfg.color}80`, fontFamily: 'serif' }}>✦ ॐ ✦</span>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,${slotCfg.color}40,transparent)` }} />
        </div>

        {/* ═══ "LOGGED TODAY" EXPAND BUTTON ════════════════════════════════ */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setLoggedOpen(o => !o)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.48rem 0.72rem', borderRadius: 14, marginBottom: '0.3rem',
            background: loggedOpen ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)',
            border: `1.5px solid ${loggedOpen ? 'rgba(74,222,128,0.38)' : 'rgba(255,255,255,0.08)'}`,
            cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.38rem' }}>
            <span style={{ fontSize: '0.85rem' }}>🌿</span>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: loggedOpen ? '#4ade80' : 'rgba(255,255,255,0.55)', fontFamily: "'Outfit',sans-serif" }}>Logged Today</span>
            {logStory.length > 0 && (
              <motion.span animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
                style={{ fontSize: '0.46rem', padding: '0.03rem 0.32rem', borderRadius: 99, background: 'rgba(74,222,128,0.18)', border: '1px solid rgba(74,222,128,0.35)', color: '#4ade80', fontWeight: 800, fontFamily: "'Outfit',sans-serif" }}>
                {logStory.length} ✦
              </motion.span>
            )}
          </div>
          <motion.span animate={{ rotate: loggedOpen ? 180 : 0 }} transition={{ duration: 0.25 }} style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)' }}>▼</motion.span>
        </motion.button>

        {/* ═══ SECTION B — LOGGED TODAY (collapsible) ══════════════════════ */}
        <AnimatePresence initial={false}>
          {loggedOpen && (
            <motion.div
              key="logged-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{ overflow: 'hidden' }}
            >
        <div style={{ marginBottom: '0.65rem', paddingTop: '0.2rem' }}>
          {/* Per-slot accordion — logged + missed only */}
          {(['morning', 'noon', 'evening'] as const).map((slotKey) => {
            const sCfg = {
              morning: { label: 'Morning', emoji: '🌅', color: '#fbbf24', startH: 4,  endH: 12 },
              noon:    { label: 'Noon',    emoji: '☀️', color: '#fb923c', startH: 12, endH: 17 },
              evening: { label: 'Evening', emoji: '🪔', color: '#a78bfa', startH: 17, endH: 24 },
            }[slotKey];
            const curH = new Date().getHours();
            const isCurrent = curH >= sCfg.startH && curH < sCfg.endH;
            if (curH < sCfg.startH) return null;
            const sLogs = logStory.filter(e => {
              const h = new Date(e.loggedAt).getHours();
              return h >= sCfg.startH && h < sCfg.endH;
            });
            const pastAyurKey = slotKey === 'morning' ? 'morning' : slotKey === 'noon' ? 'midday' : 'evening';
            const pastBase = getHabitsForSlot(pastAyurKey as AyurTimeSlot).filter(h => _storeAyurIds.has(h.id));
            const extraIds = (MEAL_DEFAULTS as Record<string, string[]>)[pastAyurKey] ?? [];
            const allSlotH = [...pastBase, ...AYURVEDIC_HABITS.filter(h => extraIds.includes(h.id) && !pastBase.some(p => p.id === h.id))];
            const missedH = !isCurrent ? allSlotH.filter(h => !mergedAyurDone.has(h.id)) : [];
            const isExp = expandedSlots[slotKey];
            return (
              <div key={slotKey} style={{ marginBottom: '0.28rem' }}>
                <button onClick={() => setExpandedSlots(prev => ({ ...prev, [slotKey]: !prev[slotKey] }))}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.42rem 0.68rem', borderRadius: 12, marginBottom: isExp ? '0.2rem' : 0, background: isCurrent ? `${sCfg.color}14` : 'rgba(255,255,255,0.04)', border: `1.5px solid ${isCurrent ? sCfg.color + '35' : 'rgba(255,255,255,0.09)'}`, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ fontSize: '0.78rem' }}>{sCfg.emoji}</span>
                    <span style={{ fontSize: '0.66rem', fontWeight: 800, color: sCfg.color, fontFamily: "'Outfit',sans-serif" }}>{sCfg.label}</span>
                    {isCurrent && <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ fontSize: '0.44rem', padding: '0.04rem 0.26rem', borderRadius: 99, background: `${sCfg.color}28`, color: sCfg.color, fontWeight: 800, fontFamily: "'Outfit',sans-serif" }}>● LIVE</motion.span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.32rem' }}>
                    {sLogs.length > 0 && <span style={{ fontSize: '0.52rem', color: sCfg.color, fontFamily: "'Outfit',sans-serif", fontWeight: 700 }}>{sLogs.length} ✓</span>}
                    {missedH.length > 0 && <span style={{ fontSize: '0.52rem', color: 'rgba(255,180,0,0.55)', fontFamily: "'Outfit',sans-serif", fontWeight: 700 }}>{missedH.length} missed</span>}
                    {sLogs.length === 0 && missedH.length === 0 && <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)', fontFamily: "'Outfit',sans-serif" }}>none</span>}
                    <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.28)' }}>{isExp ? '▲' : '▼'}</span>
                  </div>
                </button>
                {isExp && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.13rem' }}>
                    {sLogs.map((entry, i) => {
                      const t = new Date(entry.loggedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                      const lH = new Date(entry.loggedAt).getHours();
                      const ayurH = AYURVEDIC_HABITS.find(h => h.id === entry.id);
                      const expCat = ayurH?.category ?? slotKey;
                      const logCat = lH >= 4 && lH < 12 ? 'morning' : lH >= 12 && lH < 17 ? 'midday' : 'evening';
                      const onTime = expCat === logCat || (expCat as string) === 'anytime';
                      return (
                        <motion.div key={`${entry.id}_${i}`} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.38rem 0.58rem', borderRadius: 11, background: `${entry.color}0d`, border: `1.5px solid ${entry.color}25`, boxShadow: `0 2px 8px ${entry.color}0a` }}>
                          <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>{entry.icon}</span>
                          <p style={{ flex: 1, margin: 0, fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.88)', fontFamily: "'Outfit',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.label}</p>
                          <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit',sans-serif", flexShrink: 0 }}>{t}</span>
                          <span style={{ fontSize: '0.46rem', padding: '0.04rem 0.24rem', borderRadius: 99, background: onTime ? 'rgba(74,222,128,0.14)' : 'rgba(251,191,36,0.14)', color: onTime ? '#4ade80' : '#fbbf24', fontFamily: "'Outfit',sans-serif", fontWeight: 800, flexShrink: 0, border: onTime ? '1px solid rgba(74,222,128,0.28)' : '1px solid rgba(251,191,36,0.28)' }}>
                            {onTime ? '✅' : '⏰'}
                          </span>
                        </motion.div>
                      );
                    })}
                    {missedH.length > 0 && (
                      <div style={{ marginTop: sLogs.length > 0 ? '0.15rem' : 0 }}>
                        <p style={{ margin: '0 0 0.12rem 0.08rem', fontSize: '0.48rem', color: 'rgba(255,180,0,0.4)', fontFamily: "'Outfit',sans-serif", letterSpacing: '0.06em' }}>📌 Not logged</p>
                        {missedH.map(h => (
                          <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '0.36rem', padding: '0.26rem 0.5rem', borderRadius: 9, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.09)', marginBottom: '0.1rem', opacity: 0.5 }}>
                            <span style={{ fontSize: '0.78rem', flexShrink: 0 }}>{h.emoji}</span>
                            <span style={{ flex: 1, fontSize: '0.64rem', color: 'rgba(255,255,255,0.38)', fontFamily: "'Outfit',sans-serif", fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</span>
                            <span style={{ fontSize: '0.42rem', color: 'rgba(255,180,0,0.3)', fontFamily: "'Outfit',sans-serif", flexShrink: 0 }}>missed</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {sLogs.length === 0 && missedH.length === 0 && (
                      <p style={{ margin: 0, padding: '0.28rem 0.48rem', fontSize: '0.52rem', color: 'rgba(255,255,255,0.15)', fontFamily: "'Outfit',sans-serif", fontStyle: 'italic' }}>No activities here yet</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>{/* end SECTION B inner */}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Celebration toast */}
        <AnimatePresence>
          {celebrateId && (
            <motion.div initial={{ opacity: 0, scale: 0.88, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.88 }}
              style={{ marginBottom: '0.55rem', textAlign: 'center', padding: '0.48rem', borderRadius: 14, background: 'linear-gradient(135deg,rgba(74,222,128,0.1),rgba(34,211,238,0.06))', border: '1px solid rgba(74,222,128,0.22)' }}>
              <span style={{ fontSize: '0.72rem', color: '#4ade80', fontWeight: 800, fontFamily: "'Outfit',sans-serif" }}>🎉 संकल्प पूर्ण — Bodhi is proud of you!</span>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Add Habit CTA */}
        <motion.button whileTap={{ scale: 0.95 }} onClick={goAddHabit}
          style={{ width: '100%', padding: '0.56rem 1rem', borderRadius: 14, background: 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(168,85,247,0.12),rgba(236,72,153,0.1))', border: '1px solid rgba(167,139,250,0.28)', color: '#c4b5fd', fontSize: '0.66rem', fontWeight: 800, fontFamily: "'Outfit',sans-serif", cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          <Plus size={11} /><span>Add a Habit — Level Up Your Routine</span>
          <motion.span animate={{ x: [0, 3, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>→</motion.span>
        </motion.button>
      </div>
    </motion.div>

    {/* ── Wellness Story Creator (triggered after SmartAnalytics log) ── */}
    {mounted && storyTrigger && (
      <WellnessStoryCreator
        habitId={storyTrigger.id}
        habitName={storyTrigger.name}
        habitEmoji={storyTrigger.emoji}
        userName={getLocalUserNameSAD()}
        userId={user?.uid}
        onClose={() => setStoryTrigger(null)}
      />
    )}

    {/* ── Sub-option sheet via portal so it escapes overflow:hidden ── */}
    {mounted && activeSubHabitId && createPortal(
      <AnimatePresence>
        {activeSubHabitId && (() => {
          const habit = AYURVEDIC_HABITS.find(h => h.id === activeSubHabitId);
          const subs = getSubOptionsForHabit(activeSubHabitId, habit?.name ?? '');
          return (
            <motion.div key="sub-sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setActiveSubHabitId(null)}
              style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
              <motion.div key="sub-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 350, damping: 34 }}
                onClick={e => e.stopPropagation()}
                style={{ width: '100%', maxWidth: 520, maxHeight: '76vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg,rgba(10,6,36,0.99) 0%,rgba(4,2,18,1) 100%)', borderRadius: '26px 26px 0 0', border: '1px solid rgba(139,92,246,0.28)', borderBottom: 'none', boxShadow: '0 -12px 60px rgba(0,0,0,0.7), 0 -4px 24px rgba(139,92,246,0.12)' }}>
                <div style={{ flexShrink: 0, padding: '0.75rem 1.1rem 0' }}>
                  <div style={{ width: 38, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.16)', margin: '0 auto 0.75rem' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.7rem' }}>
                    <span style={{ fontSize: '1.65rem', lineHeight: 1 }}>{habit?.emoji ?? '✦'}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'rgba(255,255,255,0.94)', fontFamily: "'Outfit',sans-serif" }}>{habit?.name ?? activeSubHabitId}</p>
                      <p style={{ margin: '1px 0 0', fontSize: '0.58rem', color: 'rgba(255,255,255,0.32)', fontFamily: "'Outfit',sans-serif" }}>How did you do it today?</p>
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.1rem', paddingBottom: 'env(safe-area-inset-bottom, 1.6rem)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.38rem', paddingBottom: '0.6rem' }}>
                    {subs.map(sub => (
                      <motion.button key={sub.label} whileTap={{ scale: 0.97 }} onClick={() => handleComplete(activeSubHabitId, sub)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', width: '100%', padding: '0.6rem 0.85rem', borderRadius: 14, background: 'rgba(139,92,246,0.09)', border: '1px solid rgba(139,92,246,0.22)', cursor: 'pointer', textAlign: 'left' }}>
                        <span style={{ fontSize: '1.15rem', flexShrink: 0 }}>{sub.icon}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.86)', fontFamily: "'Outfit',sans-serif" }}>{sub.label}</span>
                      </motion.button>
                    ))}
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleComplete(activeSubHabitId)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '0.6rem', borderRadius: 14, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.24)', cursor: 'pointer', marginTop: '0.1rem' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#4ade80', fontFamily: "'Outfit',sans-serif" }}>✓ Quick Log</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>,
      document.body
    )}
    </>
  );
}
