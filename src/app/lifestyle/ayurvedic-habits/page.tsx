'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Circle, Plus, Flame, Wind, Leaf, Sparkles } from 'lucide-react';
import { useDoshaEngine } from '@/hooks/useDoshaEngine';
import { DOSHA_INFO, type Dosha } from '@/lib/doshaService';
import DoshaBalanceMeter from '@/components/Dashboard/DoshaBalanceMeter';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DoshaEffect {
  vata: -2 | -1 | 0 | 1 | 2;
  pitta: -2 | -1 | 0 | 1 | 2;
  kapha: -2 | -1 | 0 | 1 | 2;
}

interface AyurvedicHabit {
  id: string;
  name: string;
  nameHi?: string;
  emoji: string;
  category: 'morning' | 'midday' | 'evening' | 'anytime';
  targetMin: number;
  description: string;
  doshaEffect: DoshaEffect;
  bestFor: Dosha[];
  tags: string[];
  isBuiltIn: boolean;
}

interface HabitLogEntry {
  date: string;
  completedIds: string[];
}

// ─── Built-in Ayurvedic Habits Library ────────────────────────────────────────

const AYURVEDIC_HABITS: AyurvedicHabit[] = [
  {
    id: 'warm_water_morning',
    name: 'Warm Water on Rising',
    nameHi: 'उष्ण जल',
    emoji: '🫗',
    category: 'morning',
    targetMin: 3,
    description: 'Warm water upon waking kindles Agni and begins the morning cleanse.',
    doshaEffect: { vata: -1, pitta: 0, kapha: -1 },
    bestFor: ['vata', 'kapha'],
    tags: ['agni', 'cleansing', 'morning'],
    isBuiltIn: true,
  },
  {
    id: 'tongue_scraping',
    name: 'Tongue Scraping',
    nameHi: 'जिह्वा निर्लेखन',
    emoji: '🪥',
    category: 'morning',
    targetMin: 2,
    description: '7–14 copper scraper strokes removes overnight Ama and stimulates organ meridians.',
    doshaEffect: { vata: 0, pitta: 0, kapha: -2 },
    bestFor: ['kapha', 'pitta'],
    tags: ['ama', 'oral-care', 'morning'],
    isBuiltIn: true,
  },
  {
    id: 'abhyanga',
    name: 'Abhyanga (Oil Massage)',
    nameHi: 'अभ्यङ्ग',
    emoji: '🫙',
    category: 'morning',
    targetMin: 15,
    description: 'Self-oil massage calms Vata, improves circulation and nourishes the nervous system.',
    doshaEffect: { vata: -2, pitta: -1, kapha: 0 },
    bestFor: ['vata', 'pitta'],
    tags: ['vata', 'self-care', 'nervous-system'],
    isBuiltIn: true,
  },
  {
    id: 'anulom_vilom',
    name: 'Anulom Vilom',
    nameHi: 'अनुलोम विलोम',
    emoji: '🌬️',
    category: 'morning',
    targetMin: 10,
    description: 'Alternate nostril breathing balances prana, calms anxiety and cleanses nadis.',
    doshaEffect: { vata: -2, pitta: -1, kapha: 0 },
    bestFor: ['vata', 'pitta'],
    tags: ['pranayama', 'vata', 'nervous-system'],
    isBuiltIn: true,
  },
  {
    id: 'kapalabhati',
    name: 'Kapalabhati',
    nameHi: 'कपालभाति',
    emoji: '💨',
    category: 'morning',
    targetMin: 5,
    description: 'Rapid bellows breathing clears Kapha, strengthens Agni and energises the system.',
    doshaEffect: { vata: 1, pitta: 0, kapha: -2 },
    bestFor: ['kapha'],
    tags: ['pranayama', 'kapha', 'agni'],
    isBuiltIn: true,
  },
  {
    id: 'meditation',
    name: 'Silent Meditation',
    nameHi: 'ध्यान',
    emoji: '🧘',
    category: 'morning',
    targetMin: 15,
    description: 'Morning meditation — ideally in Brahma Muhurta — reduces all three doshas and builds Ojas.',
    doshaEffect: { vata: -1, pitta: -1, kapha: -1 },
    bestFor: ['vata', 'pitta', 'kapha'],
    tags: ['ojas', 'sattva', 'morning'],
    isBuiltIn: true,
  },
  {
    id: 'sunlight_morning',
    name: 'Morning Sunlight',
    nameHi: 'सूर्य दर्शन',
    emoji: '🌅',
    category: 'morning',
    targetMin: 5,
    description: 'Natural morning light synchronises your circadian rhythm with the Ayurvedic clock.',
    doshaEffect: { vata: -1, pitta: 0, kapha: -1 },
    bestFor: ['vata', 'kapha'],
    tags: ['circadian', 'kapha', 'morning'],
    isBuiltIn: true,
  },
  {
    id: 'main_meal_noon',
    name: 'Eat Main Meal at Noon',
    nameHi: 'मध्याह्न भोजन',
    emoji: '🍛',
    category: 'midday',
    targetMin: 30,
    description: 'Largest meal between 12–1 PM when Agni is strongest. The foundation of Ayurvedic diet.',
    doshaEffect: { vata: -1, pitta: -2, kapha: 0 },
    bestFor: ['pitta', 'vata'],
    tags: ['ahara', 'agni', 'timing'],
    isBuiltIn: true,
  },
  {
    id: 'shatapavali',
    name: 'Post-Meal Walk (100 steps)',
    nameHi: 'शतपावली',
    emoji: '🚶',
    category: 'midday',
    targetMin: 10,
    description: '100 gentle steps after the main meal — aids digestion without straining Agni.',
    doshaEffect: { vata: 0, pitta: -1, kapha: -1 },
    bestFor: ['pitta', 'kapha'],
    tags: ['digestion', 'movement', 'pitta'],
    isBuiltIn: true,
  },
  {
    id: 'herbal_tea',
    name: 'CCF Herbal Tea',
    nameHi: 'त्रिकटु चाय',
    emoji: '🍵',
    category: 'anytime',
    targetMin: 5,
    description: 'Cumin-Coriander-Fennel tea — tri-doshic digestive, reduces Ama and supports all three doshas.',
    doshaEffect: { vata: -1, pitta: -1, kapha: -1 },
    bestFor: ['vata', 'pitta', 'kapha'],
    tags: ['herbs', 'digestion', 'tridoshic'],
    isBuiltIn: true,
  },
  {
    id: 'light_dinner_early',
    name: 'Light Early Dinner',
    nameHi: 'सायं भोजन',
    emoji: '🥣',
    category: 'evening',
    targetMin: 20,
    description: 'Light dinner by 7 PM gives the body 12+ hours of rest before breakfast — crucial for Ojas.',
    doshaEffect: { vata: -1, pitta: 0, kapha: -2 },
    bestFor: ['kapha', 'vata'],
    tags: ['ahara', 'ojas', 'timing'],
    isBuiltIn: true,
  },
  {
    id: 'evening_walk',
    name: 'Evening Walk',
    nameHi: 'संध्या भ्रमण',
    emoji: '🌙',
    category: 'evening',
    targetMin: 20,
    description: 'Gentle evening walk under open sky aids digestion and transitions the body to rest.',
    doshaEffect: { vata: -1, pitta: -1, kapha: -1 },
    bestFor: ['vata', 'pitta', 'kapha'],
    tags: ['movement', 'digestion', 'evening'],
    isBuiltIn: true,
  },
  {
    id: 'screen_free_hour',
    name: 'Screen-Free Hour',
    nameHi: 'विराम',
    emoji: '📴',
    category: 'evening',
    targetMin: 60,
    description: 'No screens 1 hour before sleep. Blue light agitates Vata and disrupts melatonin.',
    doshaEffect: { vata: -2, pitta: -1, kapha: 0 },
    bestFor: ['vata', 'pitta'],
    tags: ['sleep', 'vata', 'digital-detox'],
    isBuiltIn: true,
  },
  {
    id: 'padabhyanga',
    name: 'Padabhyanga (Foot Oil)',
    nameHi: 'पादाभ्यङ्ग',
    emoji: '🦶',
    category: 'evening',
    targetMin: 8,
    description: 'Warm oil on the feet before sleep — the single most powerful Vata-pacifying practice.',
    doshaEffect: { vata: -2, pitta: -1, kapha: 0 },
    bestFor: ['vata', 'pitta'],
    tags: ['sleep', 'vata', 'self-care'],
    isBuiltIn: true,
  },
  {
    id: 'sleep_by_10',
    name: 'Sleep by 10 PM',
    nameHi: 'शयन',
    emoji: '😴',
    category: 'evening',
    targetMin: 0,
    description: 'Before the Pitta night cycle begins — the liver cleanses between 10 PM–2 AM. Be asleep.',
    doshaEffect: { vata: -1, pitta: -2, kapha: 0 },
    bestFor: ['pitta', 'vata'],
    tags: ['sleep', 'ojas', 'pitta'],
    isBuiltIn: true,
  },
  {
    id: 'journaling',
    name: 'Evening Journal',
    nameHi: 'दिनान्त लेखन',
    emoji: '📓',
    category: 'evening',
    targetMin: 10,
    description: 'Reflection before sleep clears mental Ama (toxic thoughts), improves sleep quality.',
    doshaEffect: { vata: -1, pitta: -1, kapha: 0 },
    bestFor: ['vata', 'pitta'],
    tags: ['journaling', 'sleep', 'mental-ama'],
    isBuiltIn: true,
  },
];

// ─── Dosha Effect Tags ────────────────────────────────────────────────────────

function DoshaEffectTag({ dosha, value }: { dosha: Dosha; value: number }) {
  if (value === 0) return null;
  const colors: Record<Dosha, string> = { vata: '#a78bfa', pitta: '#fb923c', kapha: '#4ade80' };
  const color = colors[dosha];
  const sign = value < 0 ? '↓' : '↑';
  const intensity = Math.abs(value) > 1 ? '●●' : '●';
  return (
    <span style={{
      padding: '0.15rem 0.45rem', borderRadius: 99,
      background: value < 0 ? `${color}15` : 'rgba(255,100,100,0.1)',
      border: `1px solid ${value < 0 ? color + '35' : 'rgba(255,100,100,0.25)'}`,
      fontSize: '0.62rem', fontFamily: "'Outfit', sans-serif",
      color: value < 0 ? color : 'rgba(255,140,140,0.9)',
      fontWeight: 600, lineHeight: 1,
    }}>
      {DOSHA_INFO[dosha].emoji} {sign}{intensity}
    </span>
  );
}

// ─── Habit Card ───────────────────────────────────────────────────────────────

function HabitCard({ habit, isCompleted, streak, prakritiDosha, onToggle }: {
  habit: AyurvedicHabit;
  isCompleted: boolean;
  streak: number;
  prakritiDosha: Dosha | null;
  onToggle: () => void;
}) {
  const isBestFor = prakritiDosha && habit.bestFor.includes(prakritiDosha);
  const primaryEffect = prakritiDosha ? habit.doshaEffect[prakritiDosha] : 0;

  return (
    <motion.div
      layout
      whileTap={{ scale: 0.98 }}
      onClick={onToggle}
      style={{
        padding: '0.9rem', borderRadius: 16, marginBottom: '0.55rem', cursor: 'pointer',
        background: isCompleted ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isCompleted ? 'rgba(251,191,36,0.35)' : isBestFor ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: isCompleted ? '0 0 20px rgba(251,191,36,0.08)' : 'none',
        transition: 'all 0.25s',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {isBestFor && !isCompleted && (
        <div style={{ position: 'absolute', top: 0, right: 0, padding: '0.2rem 0.5rem', borderRadius: '0 16px 0 10px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
          <span style={{ fontSize: '0.58rem', color: 'rgba(251,191,36,0.75)', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
            Rec.
          </span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          {isCompleted ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
              <CheckCircle2 size={20} style={{ color: '#fbbf24' }} />
            </motion.div>
          ) : (
            <Circle size={20} style={{ color: 'rgba(255,255,255,0.22)' }} />
          )}
        </div>
        <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{habit.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: isCompleted ? '#fbbf24' : 'rgba(255,255,255,0.88)', fontFamily: "'Outfit', sans-serif" }}>
              {habit.name}
            </p>
            {habit.nameHi && <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)', fontFamily: "'Outfit', sans-serif" }}>{habit.nameHi}</span>}
          </div>
          {!isCompleted && (
            <p style={{ margin: '0.2rem 0 0.5rem', fontSize: '0.73rem', color: 'rgba(255,255,255,0.42)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.4 }}>
              {habit.description}
            </p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center' }}>
            {(['vata', 'pitta', 'kapha'] as Dosha[]).map(d => (
              <DoshaEffectTag key={d} dosha={d} value={habit.doshaEffect[d]} />
            ))}
            {habit.targetMin > 0 && (
              <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.28)', fontFamily: "'Outfit', sans-serif" }}>
                {habit.targetMin} min
              </span>
            )}
          </div>
        </div>
        {streak > 0 && (
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem' }}>
            <motion.span animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ fontSize: '0.9rem', filter: streak >= 7 ? 'drop-shadow(0 0 4px #fb923c88)' : 'none' }}>🔥</motion.span>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: streak >= 7 ? '#fb923c' : 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif" }}>{streak}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Storage Helpers ───────────────────────────────────────────────────────────

const HABIT_LOG_KEY = 'onesutra_ayur_habits_v1';

function loadHabitLogs(): HabitLogEntry[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(HABIT_LOG_KEY) ?? '[]'); }
  catch { return []; }
}

function saveHabitLogs(logs: HabitLogEntry[]) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(HABIT_LOG_KEY, JSON.stringify(logs.slice(0, 90))); }
  catch { /* ignore */ }
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function computeStreaks(habitId: string, logs: HabitLogEntry[]): number {
  const today = getToday();
  let streak = 0;
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  let expectedDate = today;
  for (const log of sorted) {
    if (log.date !== expectedDate) break;
    if (log.completedIds.includes(habitId)) {
      streak++;
      const d = new Date(expectedDate);
      d.setDate(d.getDate() - 1);
      expectedDate = d.toISOString().split('T')[0];
    } else if (log.date === today) {
      break;
    } else {
      break;
    }
  }
  return streak;
}

// ─── Category Tab ─────────────────────────────────────────────────────────────

const CATEGORY_TABS = [
  { key: 'all', label: 'All', emoji: '✦' },
  { key: 'morning', label: 'Morning', emoji: '🌅' },
  { key: 'midday', label: 'Midday', emoji: '☀️' },
  { key: 'evening', label: 'Evening', emoji: '🌙' },
  { key: 'anytime', label: 'Anytime', emoji: '🌿' },
];

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AyurvedicHabitsPage() {
  const router = useRouter();
  const { prakriti, vikriti, doshaOnboardingComplete } = useDoshaEngine();

  const [logs, setLogs] = useState<HabitLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showMeter, setShowMeter] = useState(true);
  const today = getToday();

  useEffect(() => {
    setLogs(loadHabitLogs());
  }, []);

  const todayLog = useMemo(() => logs.find(l => l.date === today), [logs, today]);
  const completedToday = useMemo(() => new Set(todayLog?.completedIds ?? []), [todayLog]);

  const toggleHabit = useCallback((habitId: string) => {
    setLogs(prev => {
      const existing = prev.find(l => l.date === today);
      let updated: HabitLogEntry[];
      if (existing) {
        const wasCompleted = existing.completedIds.includes(habitId);
        updated = prev.map(l =>
          l.date === today
            ? { ...l, completedIds: wasCompleted ? l.completedIds.filter(id => id !== habitId) : [...l.completedIds, habitId] }
            : l
        );
      } else {
        updated = [{ date: today, completedIds: [habitId] }, ...prev];
      }
      saveHabitLogs(updated);
      return updated;
    });
  }, [today]);

  const streaks = useMemo(() => {
    const result: Record<string, number> = {};
    AYURVEDIC_HABITS.forEach(h => { result[h.id] = computeStreaks(h.id, logs); });
    return result;
  }, [logs]);

  const filteredHabits = useMemo(() => {
    let habits = AYURVEDIC_HABITS;
    if (activeTab !== 'all') habits = habits.filter(h => h.category === activeTab);
    if (prakriti) {
      return [...habits].sort((a, b) => {
        const aRec = a.bestFor.includes(prakriti.primary) ? -1 : 0;
        const bRec = b.bestFor.includes(prakriti.primary) ? -1 : 0;
        return aRec - bRec;
      });
    }
    return habits;
  }, [activeTab, prakriti]);

  const completionPct = Math.round((completedToday.size / AYURVEDIC_HABITS.length) * 100);
  const totalToday = filteredHabits.length;
  const completedInView = filteredHabits.filter(h => completedToday.has(h.id)).length;

  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #0a0a0f 0%, #0f0a1a 50%, #050d08 100%)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ padding: '1rem 1.2rem 0.8rem', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 10, background: 'rgba(10,10,15,0.96)', backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '0.25rem' }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>Niyama Habits</p>
            <p style={{ margin: 0, fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', fontFamily: "'Outfit', sans-serif" }}>Dosha-Aware Daily Practice</p>
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: completionPct === 100 ? '#fbbf24' : 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif" }}>
            {completionPct}%
          </div>
        </div>

        {/* Progress */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden', marginBottom: '0.8rem' }}>
          <motion.div animate={{ width: `${completionPct}%` }} transition={{ duration: 0.8 }}
            style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #7c3aed, #fb923c, #4ade80)' }} />
        </div>

        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.1rem' }}>
          {CATEGORY_TABS.map(tab => (
            <motion.button key={tab.key} whileTap={{ scale: 0.94 }} onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '0.3rem 0.65rem', borderRadius: 20, cursor: 'pointer', flexShrink: 0,
                background: activeTab === tab.key ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${activeTab === tab.key ? 'rgba(168,85,247,0.45)' : 'rgba(255,255,255,0.08)'}`,
                fontSize: '0.72rem', fontFamily: "'Outfit', sans-serif",
                color: activeTab === tab.key ? '#c084fc' : 'rgba(255,255,255,0.45)',
                fontWeight: activeTab === tab.key ? 700 : 500,
                display: 'flex', alignItems: 'center', gap: '0.25rem',
              }}>
              {tab.emoji} {tab.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.1rem 4rem' }}>

        {/* Dosha Balance Meter toggle */}
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={() => setShowMeter(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', fontFamily: "'Outfit', sans-serif", padding: 0, marginBottom: '0.5rem' }}>
            <Sparkles size={12} /> {showMeter ? 'Hide' : 'Show'} Dosha Balance Meter
          </button>
          <AnimatePresence>
            {showMeter && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <DoshaBalanceMeter />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Prakriti prompt */}
        {!doshaOnboardingComplete && (
          <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', borderRadius: 14, background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.2)' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', fontWeight: 700, color: '#c084fc', fontFamily: "'Outfit', sans-serif" }}>Unlock Dosha-Personalised Habits</p>
            <p style={{ margin: '0 0 0.6rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}>Take the Prakriti quiz to see which habits are most recommended for your constitution.</p>
            <button onClick={() => router.push('/lifestyle/prakriti')} style={{ padding: '0.4rem 0.85rem', borderRadius: 10, background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)', color: '#c084fc', fontSize: '0.72rem', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
              Begin Prakriti Discovery →
            </button>
          </div>
        )}

        {/* Section summary */}
        {activeTab !== 'all' && (
          <p style={{ margin: '0 0 0.8rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>
            {completedInView} of {totalToday} {activeTab} habits completed
          </p>
        )}

        {/* Habits list */}
        <AnimatePresence mode="popLayout">
          {filteredHabits.map(habit => (
            <HabitCard
              key={habit.id}
              habit={habit}
              isCompleted={completedToday.has(habit.id)}
              streak={streaks[habit.id] ?? 0}
              prakritiDosha={prakriti?.primary ?? null}
              onToggle={() => toggleHabit(habit.id)}
            />
          ))}
        </AnimatePresence>

        {/* Legend */}
        <div style={{ marginTop: '1.5rem', padding: '0.9rem 1rem', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ margin: '0 0 0.6rem', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', fontFamily: "'Outfit', sans-serif" }}>Reading Dosha Effect Tags</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif" }}>↓ = Pacifies (reduces) · ↑ = Increases</p>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif" }}>●  = mild effect · ●● = strong effect</p>
          </div>
        </div>

        {/* All-complete celebration */}
        <AnimatePresence>
          {completionPct === 100 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ marginTop: '1rem', padding: '1.5rem', borderRadius: 20, background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(168,85,247,0.07))', border: '1px solid rgba(251,191,36,0.25)', textAlign: 'center' }}>
              <p style={{ margin: '0 0 0.4rem', fontSize: '2rem' }}>✦</p>
              <h3 style={{ margin: '0 0 0.3rem', fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24', fontFamily: "'Outfit', sans-serif" }}>Niyama Complete</h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.6 }}>
                All Ayurvedic niyamas observed today. Your Ojas grows. Your Agni is bright.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
