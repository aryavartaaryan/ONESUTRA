'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, CheckCircle2, Circle, Plus, Sparkles, X, Trash2,
  ToggleLeft, ToggleRight, Search
} from 'lucide-react';
import { useDoshaEngine } from '@/hooks/useDoshaEngine';
import { useLifestyleEngine } from '@/hooks/useLifestyleEngine';
import { DOSHA_INFO, type Dosha } from '@/lib/doshaService';
import DoshaBalanceMeter from '@/components/Dashboard/DoshaBalanceMeter';
import type { HabitItem, LifeArea, HabitCategory, TrackingType } from '@/stores/lifestyleStore';
import { useLifestyleStore } from '@/stores/lifestyleStore';

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
}

interface HabitLogEntry {
  date: string;
  completedIds: string[];
}

// ─── Ayurvedic Habits Library ─────────────────────────────────────────────────

const AYURVEDIC_HABITS: AyurvedicHabit[] = [
  { id: 'warm_water_morning', name: 'Warm Water on Rising', nameHi: 'उष्ण जल', emoji: '🫗', category: 'morning', targetMin: 3, description: 'Warm water upon waking kindles Agni and begins the morning cleanse.', doshaEffect: { vata: -1, pitta: 0, kapha: -1 }, bestFor: ['vata', 'kapha'], tags: ['agni', 'cleansing', 'morning'] },
  { id: 'tongue_scraping', name: 'Tongue Scraping', nameHi: 'जिह्वा निर्लेखन', emoji: '🪥', category: 'morning', targetMin: 2, description: '7–14 copper scraper strokes removes overnight Ama and stimulates organ meridians.', doshaEffect: { vata: 0, pitta: 0, kapha: -2 }, bestFor: ['kapha', 'pitta'], tags: ['ama', 'oral-care', 'morning'] },
  { id: 'abhyanga', name: 'Abhyanga (Oil Massage)', nameHi: 'अभ्यङ्ग', emoji: '🫙', category: 'morning', targetMin: 15, description: 'Self-oil massage calms Vata, improves circulation and nourishes the nervous system.', doshaEffect: { vata: -2, pitta: -1, kapha: 0 }, bestFor: ['vata', 'pitta'], tags: ['vata', 'self-care', 'nervous-system'] },
  { id: 'anulom_vilom', name: 'Anulom Vilom', nameHi: 'अनुलोम विलोम', emoji: '🌬️', category: 'morning', targetMin: 10, description: 'Alternate nostril breathing balances prana, calms anxiety and cleanses nadis.', doshaEffect: { vata: -2, pitta: -1, kapha: 0 }, bestFor: ['vata', 'pitta'], tags: ['pranayama', 'vata', 'nervous-system'] },
  { id: 'kapalabhati', name: 'Kapalabhati', nameHi: 'कपालभाति', emoji: '💨', category: 'morning', targetMin: 5, description: 'Rapid bellows breathing clears Kapha, strengthens Agni and energises the system.', doshaEffect: { vata: 1, pitta: 0, kapha: -2 }, bestFor: ['kapha'], tags: ['pranayama', 'kapha', 'agni'] },
  { id: 'meditation', name: 'Silent Meditation', nameHi: 'ध्यान', emoji: '🧘', category: 'morning', targetMin: 15, description: 'Morning meditation — ideally in Brahma Muhurta — reduces all three doshas and builds Ojas.', doshaEffect: { vata: -1, pitta: -1, kapha: -1 }, bestFor: ['vata', 'pitta', 'kapha'], tags: ['ojas', 'sattva', 'morning'] },
  { id: 'sunlight_morning', name: 'Morning Sunlight', nameHi: 'सूर्य दर्शन', emoji: '🌅', category: 'morning', targetMin: 5, description: 'Natural morning light synchronises your circadian rhythm with the Ayurvedic clock.', doshaEffect: { vata: -1, pitta: 0, kapha: -1 }, bestFor: ['vata', 'kapha'], tags: ['circadian', 'kapha', 'morning'] },
  { id: 'main_meal_noon', name: 'Eat Main Meal at Noon', nameHi: 'मध्याह्न भोजन', emoji: '🍛', category: 'midday', targetMin: 30, description: 'Largest meal between 12–1 PM when Agni is strongest. The foundation of Ayurvedic diet.', doshaEffect: { vata: -1, pitta: -2, kapha: 0 }, bestFor: ['pitta', 'vata'], tags: ['ahara', 'agni', 'timing'] },
  { id: 'shatapavali', name: 'Post-Meal Walk (100 steps)', nameHi: 'शतपावली', emoji: '🚶', category: 'midday', targetMin: 10, description: '100 gentle steps after the main meal — aids digestion without straining Agni.', doshaEffect: { vata: 0, pitta: -1, kapha: -1 }, bestFor: ['pitta', 'kapha'], tags: ['digestion', 'movement', 'pitta'] },
  { id: 'herbal_tea', name: 'CCF Herbal Tea', nameHi: 'त्रिकटु चाय', emoji: '🍵', category: 'anytime', targetMin: 5, description: 'Cumin-Coriander-Fennel tea — tri-doshic digestive, reduces Ama and supports all three doshas.', doshaEffect: { vata: -1, pitta: -1, kapha: -1 }, bestFor: ['vata', 'pitta', 'kapha'], tags: ['herbs', 'digestion', 'tridoshic'] },
  { id: 'light_dinner_early', name: 'Light Early Dinner', nameHi: 'सायं भोजन', emoji: '🥣', category: 'evening', targetMin: 20, description: 'Light dinner by 7 PM gives the body 12+ hours rest before breakfast — crucial for Ojas.', doshaEffect: { vata: -1, pitta: 0, kapha: -2 }, bestFor: ['kapha', 'vata'], tags: ['ahara', 'ojas', 'timing'] },
  { id: 'evening_walk', name: 'Evening Walk', nameHi: 'संध्या भ्रमण', emoji: '🌙', category: 'evening', targetMin: 20, description: 'Gentle evening walk under open sky aids digestion and transitions the body to rest.', doshaEffect: { vata: -1, pitta: -1, kapha: -1 }, bestFor: ['vata', 'pitta', 'kapha'], tags: ['movement', 'digestion', 'evening'] },
  { id: 'screen_free_hour', name: 'Screen-Free Hour', nameHi: 'विराम', emoji: '📴', category: 'evening', targetMin: 60, description: 'No screens 1 hour before sleep. Blue light agitates Vata and disrupts melatonin.', doshaEffect: { vata: -2, pitta: -1, kapha: 0 }, bestFor: ['vata', 'pitta'], tags: ['sleep', 'vata', 'digital-detox'] },
  { id: 'padabhyanga', name: 'Padabhyanga (Foot Oil)', nameHi: 'पादाभ्यङ्ग', emoji: '🦶', category: 'evening', targetMin: 8, description: 'Warm oil on the feet before sleep — the single most powerful Vata-pacifying practice.', doshaEffect: { vata: -2, pitta: -1, kapha: 0 }, bestFor: ['vata', 'pitta'], tags: ['sleep', 'vata', 'self-care'] },
  { id: 'sleep_by_10', name: 'Sleep by 10 PM', nameHi: 'शयन', emoji: '😴', category: 'evening', targetMin: 0, description: 'Before the Pitta night cycle begins — the liver cleanses between 10 PM–2 AM. Be asleep.', doshaEffect: { vata: -1, pitta: -2, kapha: 0 }, bestFor: ['pitta', 'vata'], tags: ['sleep', 'ojas', 'pitta'] },
  { id: 'journaling', name: 'Evening Journal', nameHi: 'दिनान्त लेखन', emoji: '📓', category: 'evening', targetMin: 10, description: 'Reflection before sleep clears mental Ama (toxic thoughts), improves sleep quality.', doshaEffect: { vata: -1, pitta: -1, kapha: 0 }, bestFor: ['vata', 'pitta'], tags: ['journaling', 'sleep', 'mental-ama'] },
];

// ─── Habit Template Library (from habits page) ─────────────────────────────────

interface HabitTemplate {
  id: string; name: string; icon: string; category: HabitCategory; lifeArea: LifeArea;
  trackingType: TrackingType; targetValue?: number; color: string; description: string;
  frequency: 'daily' | 'weekdays' | 'weekends';
}

const HABIT_LIBRARY: HabitTemplate[] = [
  { id: 't_wake_early', name: 'Wake Before 6am', icon: '🌅', category: 'morning', lifeArea: 'mental', trackingType: 'checkbox', color: '#fbbf24', description: 'Start the day with Brahma muhurta', frequency: 'daily' },
  { id: 't_oil_pull', name: 'Oil Pulling', icon: '💛', category: 'morning', lifeArea: 'physical', trackingType: 'duration', targetValue: 15, color: '#fde68a', description: '15 min Ayurvedic oral detox with sesame oil', frequency: 'daily' },
  { id: 't_cold_shower', name: 'Cold Shower', icon: '🚿', category: 'morning', lifeArea: 'physical', trackingType: 'checkbox', color: '#22d3ee', description: 'Activate the nervous system with cold water', frequency: 'daily' },
  { id: 't_lemon_water', name: 'Warm Lemon Water', icon: '🍋', category: 'morning', lifeArea: 'physical', trackingType: 'checkbox', color: '#fde68a', description: 'Alkalise and hydrate upon waking', frequency: 'daily' },
  { id: 't_gratitude', name: 'Gratitude Practice', icon: '🙏', category: 'morning', lifeArea: 'spiritual', trackingType: 'counter', targetValue: 3, color: '#fb923c', description: 'Write 3 genuine things you\'re grateful for', frequency: 'daily' },
  { id: 't_stretch', name: 'Morning Stretch', icon: '🌸', category: 'morning', lifeArea: 'physical', trackingType: 'duration', targetValue: 10, color: '#f472b6', description: '10 min gentle stretching to wake the body', frequency: 'daily' },
  { id: 't_mantra', name: 'Mantra Japa', icon: '🕉️', category: 'sacred', lifeArea: 'spiritual', trackingType: 'counter', targetValue: 108, color: '#c084fc', description: 'Daily mantra repetition — 108 times', frequency: 'daily' },
  { id: 't_pranayama', name: 'Pranayama', icon: '🌬️', category: 'sacred', lifeArea: 'spiritual', trackingType: 'duration', targetValue: 10, color: '#22d3ee', description: 'Conscious breathing practice', frequency: 'daily' },
  { id: 't_nature', name: 'Time in Nature', icon: '🌳', category: 'anytime', lifeArea: 'spiritual', trackingType: 'duration', targetValue: 20, color: '#4ade80', description: 'Mindful time outdoors — barefoot if possible', frequency: 'daily' },
  { id: 't_exercise', name: 'Exercise', icon: '💪', category: 'anytime', lifeArea: 'physical', trackingType: 'duration', targetValue: 30, color: '#4ade80', description: 'Any form of physical movement', frequency: 'daily' },
  { id: 't_yoga', name: 'Yoga Asanas', icon: '🌺', category: 'morning', lifeArea: 'physical', trackingType: 'duration', targetValue: 20, color: '#f472b6', description: 'Daily yoga practice', frequency: 'daily' },
  { id: 't_walk', name: 'Walk 10,000 Steps', icon: '🚶', category: 'anytime', lifeArea: 'physical', trackingType: 'numeric', targetValue: 10000, color: '#4ade80', description: 'Hit your daily step goal', frequency: 'daily' },
  { id: 't_water', name: 'Drink 2L Water', icon: '💧', category: 'anytime', lifeArea: 'physical', trackingType: 'numeric', targetValue: 8, color: '#60a5fa', description: 'Track glasses of water throughout the day', frequency: 'daily' },
  { id: 't_read', name: 'Read 30 Minutes', icon: '📚', category: 'anytime', lifeArea: 'mental', trackingType: 'duration', targetValue: 30, color: '#60a5fa', description: 'Daily reading — books, not feeds', frequency: 'daily' },
  { id: 't_deep_work', name: 'Deep Work Block', icon: '🎯', category: 'midday', lifeArea: 'professional', trackingType: 'duration', targetValue: 90, color: '#fbbf24', description: 'Focused, undistracted work session', frequency: 'weekdays' },
  { id: 't_no_social', name: 'Social Media Fast', icon: '🔕', category: 'anytime', lifeArea: 'mental', trackingType: 'checkbox', color: '#f87171', description: 'No social media scrolling today', frequency: 'daily' },
  { id: 't_learning', name: 'Learn Something New', icon: '🧠', category: 'anytime', lifeArea: 'mental', trackingType: 'duration', targetValue: 20, color: '#22d3ee', description: 'Study, course, or skill-building', frequency: 'daily' },
  { id: 't_review_day', name: 'Evening Review', icon: '🔍', category: 'evening', lifeArea: 'mental', trackingType: 'checkbox', color: '#a78bfa', description: 'Review what went well and what to improve', frequency: 'daily' },
  { id: 't_connect', name: 'Connect with Someone', icon: '🤝', category: 'anytime', lifeArea: 'social', trackingType: 'checkbox', color: '#fb923c', description: 'Reach out to a friend or family member', frequency: 'daily' },
  { id: 't_expenses', name: 'Track Expenses', icon: '💰', category: 'evening', lifeArea: 'financial', trackingType: 'checkbox', color: '#4ade80', description: 'Log all spending for today', frequency: 'daily' },
  { id: 't_create', name: 'Create Something', icon: '🎨', category: 'anytime', lifeArea: 'creative', trackingType: 'duration', targetValue: 20, color: '#f472b6', description: 'Draw, write, make music, or build', frequency: 'daily' },
  { id: 't_wind_down', name: 'Wind-Down Ritual', icon: '🕯️', category: 'evening', lifeArea: 'mental', trackingType: 'duration', targetValue: 15, color: '#818cf8', description: 'Prepare body and mind for sleep', frequency: 'daily' },
];

const LIFE_AREA_COLORS: Record<string, string> = {
  mental: '#22d3ee', physical: '#4ade80', social: '#fb923c',
  professional: '#fbbf24', financial: '#4ade80',
  spiritual: '#c084fc', creative: '#f472b6', sacred: '#fde68a',
};

// ─── Storage helpers (for Ayurvedic tab) ──────────────────────────────────────

const HABIT_LOG_KEY = 'onesutra_ayur_habits_v1';
function loadHabitLogs(): HabitLogEntry[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(HABIT_LOG_KEY) ?? '[]'); } catch { return []; }
}
function saveHabitLogs(logs: HabitLogEntry[]) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(HABIT_LOG_KEY, JSON.stringify(logs.slice(0, 90))); } catch { /* */ }
}
function getToday(): string { return new Date().toISOString().split('T')[0]; }
function computeStreaks(habitId: string, logs: HabitLogEntry[]): number {
  const today = getToday();
  let streak = 0;
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  let expectedDate = today;
  for (const log of sorted) {
    if (log.date !== expectedDate) break;
    if (log.completedIds.includes(habitId)) {
      streak++;
      const d = new Date(expectedDate); d.setDate(d.getDate() - 1);
      expectedDate = d.toISOString().split('T')[0];
    } else break;
  }
  return streak;
}

// ─── DoshaEffectTag ────────────────────────────────────────────────────────────

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

// ─── AyurvedicHabitCard ────────────────────────────────────────────────────────

function AyurvedicHabitCard({ habit, isCompleted, streak, prakritiDosha, onToggle, isInRoutine, onAddToRoutine }: {
  habit: AyurvedicHabit; isCompleted: boolean; streak: number;
  prakritiDosha: Dosha | null; onToggle: () => void;
  isInRoutine: boolean; onAddToRoutine: () => void;
}) {
  const isBestFor = prakritiDosha && habit.bestFor.includes(prakritiDosha);
  return (
    <motion.div layout whileTap={{ scale: 0.98 }} onClick={onToggle} style={{
      padding: '0.9rem', borderRadius: 16, marginBottom: '0.55rem', cursor: 'pointer',
      background: isCompleted ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${isCompleted ? 'rgba(251,191,36,0.35)' : isBestFor ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.07)'}`,
      boxShadow: isCompleted ? '0 0 20px rgba(251,191,36,0.08)' : 'none',
      transition: 'all 0.25s', position: 'relative', overflow: 'hidden',
    }}>
      {isBestFor && !isCompleted && (
        <div style={{ position: 'absolute', top: 0, right: 0, padding: '0.2rem 0.5rem', borderRadius: '0 16px 0 10px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
          <span style={{ fontSize: '0.58rem', color: 'rgba(251,191,36,0.75)', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>Rec.</span>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          {isCompleted ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
              <CheckCircle2 size={20} style={{ color: '#fbbf24' }} />
            </motion.div>
          ) : <Circle size={20} style={{ color: 'rgba(255,255,255,0.22)' }} />}
        </div>
        <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{habit.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: isCompleted ? '#fbbf24' : 'rgba(255,255,255,0.88)', fontFamily: "'Outfit', sans-serif" }}>{habit.name}</p>
            {habit.nameHi && <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)', fontFamily: "'Outfit', sans-serif" }}>{habit.nameHi}</span>}
          </div>
          {!isCompleted && <p style={{ margin: '0.2rem 0 0.5rem', fontSize: '0.73rem', color: 'rgba(255,255,255,0.42)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.4 }}>{habit.description}</p>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center' }}>
            {(['vata', 'pitta', 'kapha'] as Dosha[]).map(d => <DoshaEffectTag key={d} dosha={d} value={habit.doshaEffect[d]} />)}
            {habit.targetMin > 0 && <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.28)', fontFamily: "'Outfit', sans-serif" }}>{habit.targetMin} min</span>}
          </div>
          {/* Add to Routine row */}
          <div style={{ marginTop: '0.45rem' }} onClick={e => e.stopPropagation()}>
            {isInRoutine ? (
              <span style={{ fontSize: '0.6rem', color: 'rgba(74,222,128,0.75)', fontFamily: "'Outfit', sans-serif", fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <CheckCircle2 size={10} style={{ color: '#4ade80' }} /> In My Routine
              </span>
            ) : (
              <motion.button whileTap={{ scale: 0.9 }} onClick={onAddToRoutine}
                style={{ padding: '0.18rem 0.55rem', borderRadius: 8, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', color: '#c084fc', fontSize: '0.6rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <Plus size={9} /> Add to Routine
              </motion.button>
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

// ─── LibraryHabitCard ────────────────────────────────────────────────────────────

function LibraryHabitCard({ habit, onAdd }: { habit: HabitTemplate; onAdd: () => void }) {
  return (
    <motion.div layout whileTap={{ scale: 0.98 }} onClick={onAdd} style={{
      padding: '0.9rem', borderRadius: 16, marginBottom: '0.55rem', cursor: 'pointer',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.07)',
      transition: 'all 0.25s', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          <Plus size={20} style={{ color: 'rgba(255,255,255,0.18)' }} />
        </div>
        <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{habit.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: 'rgba(255,255,255,0.88)', fontFamily: "'Outfit', sans-serif" }}>{habit.name}</p>
          <p style={{ margin: '0.2rem 0 0.5rem', fontSize: '0.73rem', color: 'rgba(255,255,255,0.42)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.4 }}>{habit.description}</p>
          <span style={{ fontSize: '0.62rem', padding: '0.15rem 0.45rem', borderRadius: 99, background: `${habit.color}15`, border: `1px solid ${habit.color}30`, color: habit.color, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{habit.lifeArea}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Custom Habit Form ─────────────────────────────────────────────────────────

const ICON_OPTIONS = ['🌅', '🧘', '💪', '📚', '🙏', '💧', '🌿', '🔥', '⚡', '🎯', '🎨', '🌸', '✍️', '🌬️', '🕉️', '🏃', '🍎', '💡', '🌙', '⭐', '🌊', '🎵', '🔱', '📿', '🕯️', '🌺', '🦋', '💫', '🌟', '🫗'];

function CustomHabitSheet({ onClose, onSave }: { onClose: () => void; onSave: (habit: HabitItem) => void }) {
  const [form, setForm] = useState({ name: '', icon: '⭐', category: 'morning' as HabitCategory, lifeArea: 'mental' as LifeArea, trackingType: 'checkbox' as TrackingType, color: '#a78bfa', frequency: 'daily' as 'daily' | 'weekdays' | 'weekends' });
  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({
      id: `custom_${Date.now()}`, name: form.name.trim(), icon: form.icon,
      category: form.category, lifeArea: form.lifeArea, trackingType: form.trackingType,
      color: LIFE_AREA_COLORS[form.lifeArea] ?? '#a78bfa',
      frequency: form.frequency, isActive: true, createdAt: Date.now(),
    });
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(2,1,10,0.95)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(20px)' }}>
      <motion.div onClick={e => e.stopPropagation()} initial={{ y: 80 }} animate={{ y: 0 }}
        style={{ width: '100%', maxWidth: 480, background: 'linear-gradient(160deg, rgba(168,85,247,0.1), rgba(6,3,18,0.98))', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '28px 28px 0 0', padding: '1.75rem 1.5rem 2.5rem', maxHeight: '88vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>Create Custom Habit</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        {/* Name */}
        <p style={{ margin: '0 0 0.4rem', fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Habit Name</p>
        <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Neem face wash"
          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.9rem', fontFamily: "'Outfit', sans-serif", outline: 'none', boxSizing: 'border-box', marginBottom: '1rem' }} />
        {/* Icon picker */}
        <p style={{ margin: '0 0 0.4rem', fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Icon</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
          {ICON_OPTIONS.map(ic => (
            <button key={ic} onClick={() => update('icon', ic)}
              style={{ width: 42, height: 42, borderRadius: 10, fontSize: '1.3rem', cursor: 'pointer', background: form.icon === ic ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.05)', border: `1.5px solid ${form.icon === ic ? 'rgba(168,85,247,0.6)' : 'rgba(255,255,255,0.08)'}` }}>
              {ic}
            </button>
          ))}
        </div>
        {/* Category */}
        <p style={{ margin: '0 0 0.4rem', fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Time of Day</p>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {(['morning', 'midday', 'evening', 'anytime', 'sacred'] as HabitCategory[]).map(c => (
            <button key={c} onClick={() => update('category', c)}
              style={{ padding: '0.35rem 0.75rem', borderRadius: 20, fontSize: '0.74rem', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontWeight: 600, background: form.category === c ? 'rgba(168,85,247,0.22)' : 'rgba(255,255,255,0.05)', border: `1px solid ${form.category === c ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.09)'}`, color: form.category === c ? '#c084fc' : 'rgba(255,255,255,0.5)' }}>
              {c}
            </button>
          ))}
        </div>
        {/* Life Area */}
        <p style={{ margin: '0 0 0.4rem', fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Life Area</p>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {(['physical', 'mental', 'spiritual', 'social', 'financial', 'creative', 'professional'] as LifeArea[]).map(a => (
            <button key={a} onClick={() => update('lifeArea', a)}
              style={{ padding: '0.35rem 0.75rem', borderRadius: 20, fontSize: '0.74rem', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontWeight: 600, background: form.lifeArea === a ? `${LIFE_AREA_COLORS[a]}22` : 'rgba(255,255,255,0.05)', border: `1px solid ${form.lifeArea === a ? LIFE_AREA_COLORS[a] + '55' : 'rgba(255,255,255,0.09)'}`, color: form.lifeArea === a ? LIFE_AREA_COLORS[a] : 'rgba(255,255,255,0.5)' }}>
              {a}
            </button>
          ))}
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={!form.name.trim()}
          style={{ width: '100%', padding: '0.9rem', borderRadius: 14, border: 'none', cursor: form.name.trim() ? 'pointer' : 'not-allowed', background: form.name.trim() ? 'linear-gradient(135deg, #7c3aed, #a78bfa)' : 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.9rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif", opacity: form.name.trim() ? 1 : 0.4 }}>
          + Add Habit
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ─── Category tabs ─────────────────────────────────────────────────────────────

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
  const { prakriti, doshaOnboardingComplete } = useDoshaEngine();
  const engine = useLifestyleEngine();
  const store = useLifestyleStore();

  // Ayurvedic tab state
  const [logs, setLogs] = useState<HabitLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showMeter, setShowMeter] = useState(false);
  const today = getToday();

  // Top-level tab: ayurvedic | library | minehabits
  const [mainTab, setMainTab] = useState<'library' | 'myhabits'>('library');
  const [search, setSearch] = useState('');
  const [showCustomSheet, setShowCustomSheet] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { setLogs(loadHabitLogs()); }, []);

  // Ayurvedic habits logic
  const todayLog = useMemo(() => logs.find(l => l.date === today), [logs, today]);
  const completedToday = useMemo(() => new Set(todayLog?.completedIds ?? []), [todayLog]);

  const toggleHabit = useCallback((habitId: string) => {
    setLogs(prev => {
      const existing = prev.find(l => l.date === today);
      let updated: HabitLogEntry[];
      if (existing) {
        const wasCompleted = existing.completedIds.includes(habitId);
        updated = prev.map(l => l.date === today ? { ...l, completedIds: wasCompleted ? l.completedIds.filter(id => id !== habitId) : [...l.completedIds, habitId] } : l);
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

  const inRoutineIds = useMemo(() => new Set(store.habits.map(h => h.id)), [store.habits]);

  const filteredAyurvedicHabits = useMemo(() => {
    let habits = AYURVEDIC_HABITS;
    if (activeTab !== 'all') habits = habits.filter(h => h.category === activeTab);
    if (search.trim()) habits = habits.filter(h => h.name.toLowerCase().includes(search.toLowerCase()) || (h.nameHi && h.nameHi.includes(search)));
    if (prakriti) return [...habits].sort((a, b) => (a.bestFor.includes(prakriti.primary) ? -1 : 0) - (b.bestFor.includes(prakriti.primary) ? -1 : 0));
    return habits;
  }, [activeTab, prakriti, search]);

  const completionPct = Math.round((completedToday.size / AYURVEDIC_HABITS.length) * 100);

  // Library tab
  const filteredLibrary = useMemo(() => {
    const existingIds = new Set(store.habits.map(h => h.id));
    let lib = HABIT_LIBRARY.filter(h => !existingIds.has(h.id));
    if (activeTab !== 'all') lib = lib.filter(h => h.category === activeTab);
    if (search.trim()) lib = lib.filter(h => h.name.toLowerCase().includes(search.toLowerCase()));
    return lib;
  }, [store.habits, search, activeTab]);

  const unifiedList = useMemo(() => [
    ...filteredAyurvedicHabits.map(h => ({ type: 'ayurvedic' as const, data: h })),
    ...filteredLibrary.map(h => ({ type: 'library' as const, data: h })),
  ], [filteredAyurvedicHabits, filteredLibrary]);

  const addAyurvedicToRoutine = (h: AyurvedicHabit) => {
    store.addHabit({
      id: h.id, name: h.name, icon: h.emoji, category: h.category,
      lifeArea: 'spiritual', trackingType: 'duration', targetValue: h.targetMin,
      color: '#c084fc', frequency: 'daily', isActive: true,
      createdAt: Date.now(), description: h.description,
    });
    setToast('✅ Added to your routine!');
    setTimeout(() => setToast(null), 2500);
  };

  const addFromLibrary = (t: HabitTemplate) => {
    store.addHabit({ id: t.id, name: t.name, icon: t.icon, category: t.category, lifeArea: t.lifeArea, trackingType: t.trackingType, targetValue: t.targetValue, color: t.color, frequency: t.frequency, isActive: true, createdAt: Date.now() });
    setToast('✅ Habit added!');
    setTimeout(() => setToast(null), 2500);
    setMainTab('myhabits');
  };

  const saveCustomHabit = (habit: HabitItem) => {
    store.addHabit(habit);
    setShowCustomSheet(false);
    setMainTab('myhabits');
  };

  const s = { fontFamily: "'Outfit', sans-serif" };

  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #0a0a0f 0%, #0f0a1a 50%, #050d08 100%)', display: 'flex', flexDirection: 'column' }}>

      {/* Sticky Header */}
      <div style={{ padding: '1rem 1.2rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 10, background: 'rgba(10,10,15,0.96)', backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '0.25rem' }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', ...s }}>Āyurvedic Habits</p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowCustomSheet(true)}
            style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(168,85,247,0.18)', border: '1px solid rgba(168,85,247,0.35)', cursor: 'pointer' }}>
            <Plus size={16} style={{ color: '#c084fc' }} />
          </motion.button>
        </div>

        {/* 2-Tab strip */}
        <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.85rem' }}>
          {([
            { key: 'library', label: '📚 Library', sub: `${completedToday.size}/${AYURVEDIC_HABITS.length} niyamas` },
            { key: 'myhabits', label: '⚙️ My Habits', sub: `${store.habits.length} active` },
          ] as const).map(t => (
            <motion.button key={t.key} whileTap={{ scale: 0.96 }} onClick={() => setMainTab(t.key)}
              style={{ flex: 1, padding: '0.5rem 0.4rem', borderRadius: 12, cursor: 'pointer', background: mainTab === t.key ? 'rgba(168,85,247,0.18)' : 'rgba(255,255,255,0.04)', border: `1px solid ${mainTab === t.key ? 'rgba(168,85,247,0.45)' : 'rgba(255,255,255,0.07)'}`, color: mainTab === t.key ? '#c084fc' : 'rgba(255,255,255,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, ...s }}>{t.label}</span>
              <span style={{ fontSize: '0.56rem', color: mainTab === t.key ? 'rgba(192,132,252,0.7)' : 'rgba(255,255,255,0.25)', ...s }}>{t.sub}</span>
            </motion.button>
          ))}
        </div>

        {/* Library: search + category tabs */}
        {mainTab === 'library' && (
          <>
            <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
              <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search all habits…"
                style={{ width: '100%', padding: '0.55rem 1rem 0.55rem 2.1rem', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.82rem', ...s, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.65rem', scrollbarWidth: 'none' }}>
              {CATEGORY_TABS.map(tab => (
                <motion.button key={tab.key} whileTap={{ scale: 0.94 }} onClick={() => setActiveTab(tab.key)}
                  style={{ padding: '0.28rem 0.65rem', borderRadius: 20, cursor: 'pointer', flexShrink: 0, background: activeTab === tab.key ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${activeTab === tab.key ? 'rgba(168,85,247,0.45)' : 'rgba(255,255,255,0.08)'}`, fontSize: '0.72rem', ...s, color: activeTab === tab.key ? '#c084fc' : 'rgba(255,255,255,0.45)', fontWeight: activeTab === tab.key ? 700 : 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {tab.emoji} {tab.label}
                </motion.button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.1rem 5rem' }}>

        {/* ── LIBRARY TAB ── */}
        {mainTab === 'library' && (
          <>
            {/* Progress bar */}
            <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden', marginBottom: '0.55rem' }}>
              <motion.div animate={{ width: `${completionPct}%` }} transition={{ duration: 0.8 }}
                style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #7c3aed, #fb923c, #4ade80)' }} />
            </div>
            {/* Dosha meter toggle */}
            <div style={{ marginBottom: '0.9rem' }}>
              <button onClick={() => setShowMeter(prev => !prev)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', ...s, padding: 0 }}>
                <Sparkles size={12} /> {showMeter ? 'Hide' : 'Show'} Dosha Balance Meter
              </button>
              <AnimatePresence>
                {showMeter && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: '0.5rem' }}>
                    <DoshaBalanceMeter />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {!doshaOnboardingComplete && (
              <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', borderRadius: 14, background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.2)' }}>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', fontWeight: 700, color: '#c084fc', ...s }}>Unlock Personalised Habits</p>
                <p style={{ margin: '0 0 0.6rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', ...s, lineHeight: 1.5 }}>Take the Prakriti quiz to see which habits are most recommended for your constitution.</p>
                <button onClick={() => router.push('/lifestyle/prakriti')} style={{ padding: '0.4rem 0.85rem', borderRadius: 10, background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)', color: '#c084fc', fontSize: '0.72rem', cursor: 'pointer', ...s, fontWeight: 700 }}>
                  Begin Prakriti Discovery →
                </button>
              </div>
            )}

            {/* ── Unified single list ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em', ...s }}>Add to Your Routine</p>
              <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', ...s }}>{completedToday.size}/{AYURVEDIC_HABITS.length} niyamas today</span>
            </div>
            <AnimatePresence mode="popLayout">
              {unifiedList.map(item =>
                item.type === 'ayurvedic'
                  ? <AyurvedicHabitCard key={item.data.id} habit={item.data} isCompleted={completedToday.has(item.data.id)}
                      streak={streaks[item.data.id] ?? 0} prakritiDosha={prakriti?.primary ?? null}
                      onToggle={() => toggleHabit(item.data.id)} isInRoutine={inRoutineIds.has(item.data.id)}
                      onAddToRoutine={() => addAyurvedicToRoutine(item.data)} />
                  : <LibraryHabitCard key={item.data.id} habit={item.data} onAdd={() => addFromLibrary(item.data)} />
              )}
            </AnimatePresence>
            {unifiedList.length === 0 && (
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '0.82rem', marginTop: '1.5rem', ...s }}>All habits added to your routine ✦</p>
            )}
            <div style={{ marginTop: '1rem', marginBottom: '0.5rem', padding: '0.6rem 1rem', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ margin: 0, fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', ...s }}>Dosha tags (on Āyurvedic habits): ↓ Pacifies · ↑ Increases · ● mild · ●● strong</p>
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowCustomSheet(true)}
              style={{ width: '100%', marginTop: '0.75rem', padding: '0.9rem', borderRadius: 14, border: '1.5px dashed rgba(168,85,247,0.35)', background: 'rgba(168,85,247,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Plus size={16} style={{ color: '#c084fc' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c084fc', ...s }}>Create Custom Habit</span>
            </motion.button>
          </>
        )}

        {/* ── MY HABITS TAB ── */}
        {mainTab === 'myhabits' && (
          <>
            {store.habits.length === 0 && (
              <div style={{ textAlign: 'center', paddingTop: '2rem' }}>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌱</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', ...s, marginBottom: '0.5rem' }}>No habits yet.</p>
                <button onClick={() => setMainTab('library')} style={{ padding: '0.55rem 1.2rem', borderRadius: 12, background: 'rgba(168,85,247,0.18)', border: '1px solid rgba(168,85,247,0.35)', color: '#c084fc', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 700, ...s }}>
                  Browse Library →
                </button>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {store.habits.map(habit => (
                <motion.div key={habit.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ padding: '0.8rem 1rem', borderRadius: 14, background: habit.isActive ? `${habit.color}0a` : 'rgba(255,255,255,0.03)', border: `1px solid ${habit.isActive ? habit.color + '28' : 'rgba(255,255,255,0.07)'}`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.3rem', flexShrink: 0, opacity: habit.isActive ? 1 : 0.4 }}>{habit.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.87rem', fontWeight: 700, color: habit.isActive ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)', ...s }}>{habit.name}</p>
                    <p style={{ margin: '1px 0 0', fontSize: '0.62rem', color: habit.color, opacity: 0.7, ...s }}>{habit.lifeArea} · {habit.frequency}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexShrink: 0 }}>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => store.updateHabit(habit.id, { isActive: !habit.isActive })}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                      {habit.isActive
                        ? <ToggleRight size={22} style={{ color: habit.color }} />
                        : <ToggleLeft size={22} style={{ color: 'rgba(255,255,255,0.2)' }} />}
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => store.removeHabit(habit.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                      <Trash2 size={15} style={{ color: 'rgba(255,100,100,0.45)' }} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
            {store.habits.length > 0 && (
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowCustomSheet(true)}
                style={{ width: '100%', marginTop: '1rem', padding: '0.9rem', borderRadius: 14, border: '1.5px dashed rgba(168,85,247,0.35)', background: 'rgba(168,85,247,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Plus size={16} style={{ color: '#c084fc' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c084fc', ...s }}>Create Custom Habit</span>
              </motion.button>
            )}
          </>
        )}
      </div>

      {/* Custom habit sheet */}
      <AnimatePresence>
        {showCustomSheet && <CustomHabitSheet onClose={() => setShowCustomSheet(false)} onSave={saveCustomHabit} />}
      </AnimatePresence>

      {/* Floating toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
              padding: '0.65rem 1.2rem', borderRadius: 99, background: 'rgba(16,185,129,0.92)', border: '1px solid rgba(16,185,129,0.4)', boxShadow: '0 4px 16px rgba(16,185,129,0.25)' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
