'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, CheckCircle2, Circle, Plus, Sparkles, X, Trash2,
  Search
} from 'lucide-react';
import { useDoshaEngine } from '@/hooks/useDoshaEngine';
import { useLifestyleEngine, logHabitAndSync } from '@/hooks/useLifestyleEngine';
import { useOneSutraAuth } from '@/hooks/useOneSutraAuth';
import { DOSHA_INFO, type Dosha } from '@/lib/doshaService';
import DoshaBalanceMeter from '@/components/Dashboard/DoshaBalanceMeter';
import type { HabitItem, LifeArea, HabitCategory, TrackingType } from '@/stores/lifestyleStore';
import { useLifestyleStore } from '@/stores/lifestyleStore';
import {
  findHabitWindow, getTimingStatus, getISTTimeStr, getISODateIST,
  updateLateStreak,
  type TimingStatus,
} from '@/lib/habitWindows';
import { getMorningMood } from '@/components/MoodGarden/MorningMoodCards';
import { saveToDailyLogStory } from '@/components/Dashboard/SmartLogBubbles';

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
  { id: 'dant_manjan_bath', name: 'Dantanmanjan, Tongue Scrapping & Natural Bath', nameHi: 'दंत मंजन एवं स्नान', emoji: '🌿', category: 'morning', targetMin: 20, description: 'A complete oral and body purification set — Tongue Scrapping removes overnight Ama, Dant Manjan activates oral energy centres and improves gut health, Natural water bath for Bhoota Shuddhi (five-element purification). A scientific way to remove Amas and recharge body and mind.', doshaEffect: { vata: -2, pitta: -1, kapha: -2 }, bestFor: ['vata', 'kapha', 'pitta'], tags: ['oral', 'tongue', 'ama', 'bhoota-shuddhi', 'snana', 'morning'] },
  { id: 'abhyanga', name: 'Abhyanga (Oil Massage)', nameHi: 'अभ्यङ्ग', emoji: '🫙', category: 'morning', targetMin: 15, description: 'Self-oil massage calms Vata, improves circulation and nourishes the nervous system.', doshaEffect: { vata: -2, pitta: -1, kapha: 0 }, bestFor: ['vata', 'pitta'], tags: ['vata', 'self-care', 'nervous-system'] },
  { id: 'kapalabhati', name: 'Kapalabhati', nameHi: 'कपालभाति', emoji: '💨', category: 'morning', targetMin: 5, description: 'Rapid bellows breathing clears Kapha, strengthens Agni and energises the system.', doshaEffect: { vata: 1, pitta: 0, kapha: -2 }, bestFor: ['kapha'], tags: ['pranayama', 'kapha', 'agni'] },
  { id: 'meditation', name: 'Silent Meditation', nameHi: 'ध्यान', emoji: '🧘', category: 'morning', targetMin: 15, description: 'Morning meditation — ideally in Brahma Muhurta — reduces all three doshas and builds Ojas.', doshaEffect: { vata: -1, pitta: -1, kapha: -1 }, bestFor: ['vata', 'pitta', 'kapha'], tags: ['ojas', 'sattva', 'morning'] },
  { id: 'sunlight_morning', name: 'Morning Sunlight', nameHi: 'सूर्य दर्शन', emoji: '🌅', category: 'morning', targetMin: 5, description: 'Natural morning light synchronises your circadian rhythm with the Ayurvedic clock.', doshaEffect: { vata: -1, pitta: 0, kapha: -1 }, bestFor: ['vata', 'kapha'], tags: ['circadian', 'kapha', 'morning'] },
  { id: 'main_meal_noon', name: 'Eat Main Meal at Noon', nameHi: 'मध्याह्न भोजन', emoji: '🍛', category: 'midday', targetMin: 30, description: 'Largest meal between 12–1 PM when Agni is strongest. The foundation of Ayurvedic diet.', doshaEffect: { vata: -1, pitta: -2, kapha: 0 }, bestFor: ['pitta', 'vata'], tags: ['ahara', 'agni', 'timing'] },
  { id: 'deep_work_afternoon', name: 'Deep Work', nameHi: 'गहन कार्य', emoji: '🎯', category: 'midday', targetMin: 90, description: 'Focused, undistracted work during the Pitta peak — when mental clarity and concentration are highest. Channel the fire.', doshaEffect: { vata: 0, pitta: -1, kapha: -2 }, bestFor: ['kapha', 'pitta'], tags: ['productivity', 'focus', 'pitta'] },
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
  { id: 'h_wake_early', name: 'Rise and Shine', icon: '🌅', category: 'morning', lifeArea: 'mental', trackingType: 'checkbox', color: '#fbbf24', description: 'Rise in Brahma Muhurta — the sacred window of clarity before sunrise', frequency: 'daily' },
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

// ─── Ayurvedic habit ID → lifestyle-store h_* habit ID (shared source bridge) ───────
const AYUR_TO_H_ID: Record<string, string> = {
  warm_water_morning: 'h_warm_water',
  dant_manjan_bath: 'h_bathing',
  abhyanga: 'h_bathing',
  kapalabhati: 'h_pranayama',
  meditation: 'h_morning_meditation',
  sunlight_morning: 'h_morning_sunlight',
  main_meal_noon: 'h_breakfast',
  deep_work_afternoon: 't_deep_work',
  shatapavali: 'h_walk',
  herbal_tea: 'h_water',
  evening_walk: 'h_walk',
  screen_free_hour: 'h_digital_sunset',
  sleep_by_10: 'h_sleep_early',
  journaling: 'h_brain_dump',
};

// ─── Reverse: lifestyle-store h_* ID → Ayurvedic habit ID ───────────────────
// Used to mark ayurvedic habits as done when logged from SmartLogBubbles / LifestylePanel
const H_ID_TO_AYUR: Record<string, string> = {
  h_warm_water: 'warm_water_morning',
  h_bathing: 'dant_manjan_bath',
  h_pranayama: 'kapalabhati',
  h_morning_meditation: 'meditation',
  h_morning_sunlight: 'sunlight_morning',
  h_breakfast: 'main_meal_noon',
  t_deep_work: 'deep_work_afternoon',
  h_walk: 'shatapavali',
  h_water: 'herbal_tea',
  h_digital_sunset: 'screen_free_hour',
  h_sleep_early: 'sleep_by_10',
  h_brain_dump: 'journaling',
};

// ─── Storage helpers (for Ayurvedic tab) ─────────────────────────────────────────────────

const HABIT_LOG_KEY = 'onesutra_ayur_habits_v1';
function loadHabitLogs(): HabitLogEntry[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(HABIT_LOG_KEY) ?? '[]'); } catch { return []; }
}
function saveHabitLogs(logs: HabitLogEntry[]) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(HABIT_LOG_KEY, JSON.stringify(logs.slice(0, 90))); } catch { /* */ }
}
function getToday(): string { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()); }
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

function AyurvedicHabitCard({ habit, isCompleted, streak, prakritiDosha, onToggle, onAdd, isInRoutine }: {
  habit: AyurvedicHabit; isCompleted: boolean; streak: number;
  prakritiDosha: Dosha | null; onToggle: () => void; onAdd?: () => void;
  isInRoutine: boolean;
}) {
  const isBestFor = prakritiDosha && habit.bestFor.includes(prakritiDosha);
  return (
    <motion.div layout whileTap={{ scale: 0.98 }} onClick={!isInRoutine ? (onAdd ?? onToggle) : onToggle} style={{
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
          {!isInRoutine
            ? <Plus size={20} style={{ color: '#c084fc' }} />
            : isCompleted
              ? <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}><CheckCircle2 size={20} style={{ color: '#fbbf24' }} /></motion.div>
              : <Circle size={20} style={{ color: 'rgba(255,255,255,0.22)' }} />}
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
          {isInRoutine && (
            <div style={{ marginTop: '0.38rem' }}>
              <span style={{ fontSize: '0.62rem', padding: '0.16rem 0.5rem', borderRadius: 99, background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', fontWeight: 700, fontFamily: "'Outfit', sans-serif", display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={10} style={{ color: '#4ade80' }} /> Added to My Habits
              </span>
            </div>
          )}
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

function LibraryHabitCard({ habit, onAdd, isAdded }: { habit: HabitTemplate; onAdd: () => void; isAdded: boolean }) {
  return (
    <motion.div layout whileTap={!isAdded ? { scale: 0.98 } : {}} onClick={!isAdded ? onAdd : undefined} style={{
      padding: '0.9rem', borderRadius: 16, marginBottom: '0.55rem', cursor: isAdded ? 'default' : 'pointer',
      background: isAdded ? 'rgba(74,222,128,0.05)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${isAdded ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.07)'}`,
      transition: 'all 0.25s', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          {isAdded
            ? <CheckCircle2 size={20} style={{ color: '#4ade80' }} />
            : <Plus size={20} style={{ color: '#c084fc' }} />}
        </div>
        <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{habit.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: isAdded ? 'rgba(74,222,128,0.85)' : 'rgba(255,255,255,0.88)', fontFamily: "'Outfit', sans-serif" }}>{habit.name}</p>
          <p style={{ margin: '0.2rem 0 0.5rem', fontSize: '0.73rem', color: 'rgba(255,255,255,0.42)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.4 }}>{habit.description}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.62rem', padding: '0.15rem 0.45rem', borderRadius: 99, background: `${habit.color}15`, border: `1px solid ${habit.color}30`, color: habit.color, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{habit.lifeArea}</span>
            {isAdded && (
              <span style={{ fontSize: '0.6rem', padding: '0.15rem 0.5rem', borderRadius: 99, background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>✅ Added to My Habits</span>
            )}
          </div>
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
          style={{ width: '100%', padding: '0.9rem', borderRadius: 14, border: 'none', cursor: 'pointer', background: form.name.trim() ? 'linear-gradient(135deg, #7c3aed, #a78bfa)' : 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.9rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif", opacity: form.name.trim() ? 1 : 0.4 }}>
          + Add Habit
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ─── Bodhi Habit Toast ────────────────────────────────────────────────────────

function BodhiHabitToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 7000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 64, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 64, scale: 0.96 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: 9990, width: 'calc(100% - 2.4rem)', maxWidth: 420,
        padding: '0.95rem 1.1rem', borderRadius: 20,
        background: 'linear-gradient(135deg, rgba(16,12,38,0.98), rgba(10,8,28,0.98))',
        border: '1px solid rgba(167,139,250,0.28)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(167,139,250,0.08)',
        backdropFilter: 'blur(20px)', fontFamily: "'Outfit', sans-serif",
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.7rem' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, rgba(167,139,250,0.25), rgba(251,146,60,0.15))', border: '1px solid rgba(167,139,250,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>🌿</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: '0 0 0.15rem', fontSize: '0.6rem', fontWeight: 700, color: 'rgba(167,139,250,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Bodhi</p>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.88)', lineHeight: 1.55, fontStyle: 'italic' }}>{message}</p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', padding: '2px', flexShrink: 0 }}>
          <X size={14} />
        </button>
      </div>
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
  const { user } = useOneSutraAuth();
  const { prakriti, vikriti, doshaOnboardingComplete } = useDoshaEngine();
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
  const [bodhiToast, setBodhiToast] = useState<string | null>(null);

  useEffect(() => { setLogs(loadHabitLogs()); }, []);

  // Ayurvedic habits logic
  const todayLog = useMemo(() => logs.find(l => l.date === today), [logs, today]);

  // Merge local ayurvedic log IDs with lifestyle-store completed IDs (from Firestore onSnapshot)
  // This ensures habits logged from SmartLogBubbles or LifestylePanel also appear as done here
  const completedToday = useMemo(() => {
    const localIds = new Set(todayLog?.completedIds ?? []);
    const storeIds = new Set(
      engine.habitLogs
        .filter(l => l.date === today && l.completed)
        .map(l => H_ID_TO_AYUR[l.habitId])
        .filter(Boolean)
    );
    return new Set([...localIds, ...storeIds]);
  }, [todayLog, engine.habitLogs, today]);

  const toggleHabit = useCallback((habitId: string) => {
    // Auto-add to lifestyle routine on first toggle if not already there
    const alreadyInRoutine = store.habits.some(h => h.id === habitId);
    if (!alreadyInRoutine) {
      const habit = AYURVEDIC_HABITS.find(h => h.id === habitId);
      if (habit) {
        store.addHabit({
          id: habit.id, name: habit.name, icon: habit.emoji, category: habit.category,
          lifeArea: 'spiritual', trackingType: 'duration', targetValue: habit.targetMin,
          color: '#c084fc', frequency: 'daily', isActive: true,
          createdAt: Date.now(), description: habit.description,
        });
      }
    }
    setLogs(prev => {
      const existing = prev.find(l => l.date === today);
      const wasCompleted = existing?.completedIds.includes(habitId) ?? false;
      const nowCompleted = !wasCompleted;
      // Mirror completion into lifestyle store AND Firestore for full cross-device sync
      const hId = AYUR_TO_H_ID[habitId];
      if (nowCompleted) {
        const targetId = hId ?? habitId;
        // Write to Firestore habit_logs (single source of truth for persistence + real-time sync)
        logHabitAndSync(user?.uid, targetId, undefined);
        // Also update local Zustand store instantly (optimistic)
        if (hId) {
          store.logHabit({ habitId: hId, date: today, completed: true, loggedAt: Date.now() });
        }
        // Save to daily log story for the home page story strip
        const habit = AYURVEDIC_HABITS.find(h => h.id === habitId);
        if (habit) saveToDailyLogStory(habitId, habit.emoji, habit.name, '#c084fc');
      }
      let updated: HabitLogEntry[];
      if (existing) {
        updated = prev.map(l => l.date === today ? { ...l, completedIds: wasCompleted ? l.completedIds.filter(id => id !== habitId) : [...l.completedIds, habitId] } : l);
      } else {
        updated = [{ date: today, completedIds: [habitId] }, ...prev];
      }
      saveHabitLogs(updated);

      // ── Bodhi contextual response on mark-complete (not uncheck) ──
      if (nowCompleted) {
        const habit = AYURVEDIC_HABITS.find(h => h.id === habitId);
        if (habit) {
          const loggedAtMs = Date.now();
          const logTime = getISTTimeStr(loggedAtMs);
          const todayISO = getISODateIST(loggedAtMs);
          const win = findHabitWindow(habitId) ?? findHabitWindow(habit.name);
          const timingStatus: TimingStatus = win ? getTimingStatus(win, loggedAtMs) : 'ideal';
          const lateStreak = win ? updateLateStreak(habitId, timingStatus, todayISO) : 0;
          // Compute streak from logs
          const habitStreak = (() => {
            let s = 0;
            const d = new Date(todayISO);
            for (let i = 0; i < 90; i++) {
              const k = d.toISOString().split('T')[0];
              const dayLog = updated.find(l => l.date === k);
              if (dayLog?.completedIds.includes(habitId)) { s++; d.setDate(d.getDate() - 1); }
              else break;
            }
            return s;
          })();
          const morningMood = getMorningMood();
          const doshaEffectStr = (['vata', 'pitta', 'kapha'] as const)
            .map(d => `${d.charAt(0).toUpperCase() + d.slice(1)} ${habit.doshaEffect[d] < 0 ? '↓' : habit.doshaEffect[d] > 0 ? '↑' : '●'}`)
            .join(', ');

          fetch('/api/bodhi/habit-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_name: 'friend',
              prakriti: prakriti?.combo ?? prakriti?.primary ?? '',
              vikruti: vikriti?.primary ?? '',
              mood: morningMood?.mood ?? '',
              habit_name: habit.name,
              log_time: logTime,
              ideal_start: win?.idealStart ?? '',
              ideal_end: win?.idealEnd ?? '',
              timing_status: timingStatus,
              late_streak: lateStreak,
              habit_streak: habitStreak,
              dosha_effect: win?.doshaEffect ?? doshaEffectStr,
              habit_benefit: win?.benefit ?? habit.description,
              duration_minutes: habit.targetMin,
              time_section: win?.timeSection ?? habit.category,
            }),
          })
            .then(r => r.json())
            .then(d => { if (d.response) setBodhiToast(d.response); })
            .catch(() => { /* silent */ });
        }
      }

      return updated;
    });
  }, [today, prakriti, vikriti]);

  const streaks = useMemo(() => {
    const result: Record<string, number> = {};
    AYURVEDIC_HABITS.forEach(h => { result[h.id] = computeStreaks(h.id, logs); });
    return result;
  }, [logs]);

  const inRoutineIds = useMemo(() => new Set(store.habits.map(h => h.id)), [store.habits]);

  const filteredAyurvedicHabits = useMemo(() => {
    let habits = [...AYURVEDIC_HABITS];
    if (activeTab !== 'all') habits = habits.filter(h => h.category === activeTab);
    if (search.trim()) habits = habits.filter(h => h.name.toLowerCase().includes(search.toLowerCase()) || (h.nameHi && h.nameHi.includes(search)));
    if (prakriti) return [...habits].sort((a, b) => (b.bestFor.includes(prakriti.primary) ? 1 : 0) - (a.bestFor.includes(prakriti.primary) ? 1 : 0));
    return habits;
  }, [activeTab, prakriti, search]);

  const completionPct = Math.round((completedToday.size / AYURVEDIC_HABITS.length) * 100);

  // Library tab
  const filteredLibrary = useMemo(() => {
    let lib = [...HABIT_LIBRARY];
    if (activeTab !== 'all') lib = lib.filter(h => h.category === activeTab);
    if (search.trim()) lib = lib.filter(h => h.name.toLowerCase().includes(search.toLowerCase()));
    return lib;
  }, [search, activeTab]);

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
    try { window.dispatchEvent(new CustomEvent('habit-logged')); } catch { }
    setMainTab('myhabits');
    setToast('✅ Added to your routine!');
    setTimeout(() => setToast(null), 2500);
  };

  const addFromLibrary = (t: HabitTemplate) => {
    store.addHabit({ id: t.id, name: t.name, icon: t.icon, category: t.category, lifeArea: t.lifeArea, trackingType: t.trackingType, targetValue: t.targetValue, color: t.color, frequency: t.frequency, isActive: true, createdAt: Date.now() });
    try { window.dispatchEvent(new CustomEvent('habit-logged')); } catch { }
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
              <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em', ...s }}>Habit Library · Tap to Add</p>
              <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', ...s }}>{completedToday.size}/{AYURVEDIC_HABITS.length} niyamas today</span>
            </div>
            <AnimatePresence mode="popLayout">
              {unifiedList.map(item =>
                item.type === 'ayurvedic'
                  ? <AyurvedicHabitCard key={item.data.id} habit={item.data} isCompleted={completedToday.has(item.data.id)}
                    streak={streaks[item.data.id] ?? 0} prakritiDosha={prakriti?.primary ?? null}
                    onToggle={() => toggleHabit(item.data.id)}
                    onAdd={() => addAyurvedicToRoutine(item.data)}
                    isInRoutine={inRoutineIds.has(item.data.id)} />
                  : <LibraryHabitCard key={item.data.id} habit={item.data} onAdd={() => addFromLibrary(item.data)} isAdded={inRoutineIds.has(item.data.id)} />
              )}
            </AnimatePresence>
            {unifiedList.length === 0 && (
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '0.82rem', marginTop: '1.5rem', ...s }}>No habits match your search ✦</p>
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
                  style={{ padding: '0.8rem 1rem', borderRadius: 14, background: `${habit.color}0a`, border: `1px solid ${habit.color}28`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{habit.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.87rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', ...s }}>{habit.name}</p>
                    <p style={{ margin: '1px 0 0', fontSize: '0.62rem', color: habit.color, opacity: 0.7, ...s }}>{habit.lifeArea} · {habit.frequency}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexShrink: 0 }}>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => store.removeHabit(habit.id)}
                      style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.18)', cursor: 'pointer', padding: '0.28rem 0.6rem', borderRadius: 8 }}>
                      <Trash2 size={14} style={{ color: 'rgba(255,100,100,0.65)' }} />
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

      {/* Floating action toast (add to routine, etc.) */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            style={{
              position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
              padding: '0.65rem 1.2rem', borderRadius: 99, background: 'rgba(16,185,129,0.92)', border: '1px solid rgba(16,185,129,0.4)', boxShadow: '0 4px 16px rgba(16,185,129,0.25)'
            }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bodhi habit-log toast */}
      <AnimatePresence>
        {bodhiToast && (
          <BodhiHabitToast
            message={bodhiToast}
            onClose={() => setBodhiToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
