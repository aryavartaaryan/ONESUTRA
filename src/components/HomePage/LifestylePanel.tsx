'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, SkipForward, Plus,
  ChevronRight, Zap, RotateCcw, Heart, TrendingUp, Bell, MessageCircle,
  Sunrise, Sun, Sunset, Moon, Clock, Infinity as InfinityIcon, Star,
  ChevronDown, Target, Layers, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLifestyleEngine, logHabitAndSync } from '@/hooks/useLifestyleEngine';
import { useOneSutraAuth } from '@/hooks/useOneSutraAuth';
import {
  AYURVEDIC_HABITS, AYUR_TO_H_ID, H_ID_TO_AYUR,
  getCurrentTimeSlot as getAyurTimeSlot,
  getHabitsForSlot,
  getTodayAyurCompletedIds, setAyurHabitCompleted,
} from '@/lib/ayurvedicHabitsData';
import { useDoshaEngine } from '@/hooks/useDoshaEngine';
import { DOSHA_INFO } from '@/lib/doshaService';
import { getLevelFromXP, getNextLevel, getToday, type HabitItem } from '@/stores/lifestyleStore';
import {
  findHabitWindow, getTimingStatus, getISTTimeStr, getISODateIST, updateLateStreak,
} from '@/lib/habitWindows';
import { getMorningMood } from '@/components/MoodGarden/MorningMoodCards';
import { saveToDailyLogStory } from '@/components/Dashboard/SmartLogBubbles';
import { useBodhiChatStore } from '@/stores/bodhiChatStore';
import { useDailyTasks } from '@/hooks/useDailyTasks';
import { useLanguage } from '@/context/LanguageContext';
import dynamic from 'next/dynamic';

const GunaTracker = dynamic(() => import('@/components/Dashboard/GunaTracker'), { ssr: false });
const DoshaCompass = dynamic(() => import('@/components/Dashboard/DoshaCompass'), { ssr: false });
const SutraOfDay = dynamic(() => import('@/components/Dashboard/SutraOfDay'), { ssr: false });
const DigitalMala = dynamic(() => import('@/components/Dashboard/DigitalMala'), { ssr: false });

// ─── Constants ──────────────────────────────────────────────────────────────
const LIFE_AREA_COLORS: Record<string, string> = {
  mental: '#22d3ee', physical: '#4ade80', social: '#fb923c',
  professional: '#fbbf24', financial: '#a78bfa', spiritual: '#c084fc',
  creative: '#f472b6', sacred: '#fde68a',
};

const MOOD_OPTIONS = [
  { value: 5, emoji: '🤩', label: 'Radiant', color: '#fbbf24' },
  { value: 4, emoji: '😊', label: 'Good', color: '#4ade80' },
  { value: 3, emoji: '😐', label: 'Okay', color: '#60a5fa' },
  { value: 2, emoji: '😔', label: 'Low', color: '#a78bfa' },
  { value: 1, emoji: '😢', label: 'Hard', color: '#f87171' },
];

const ENERGY_OPTIONS = [
  { value: 5, emoji: '⚡', label: 'Electric' },
  { value: 4, emoji: '☀️', label: 'High' },
  { value: 3, emoji: '🌤️', label: 'Medium' },
  { value: 2, emoji: '🌙', label: 'Low' },
  { value: 1, emoji: '💤', label: 'Drained' },
];


// ─── Prakriti Wisdom ────────────────────────────────────────────────────────
const PRAKRITI_INFO: Record<string, { icon: string; essence: string; strengths: string[] }> = {
  vata: {
    icon: '🌬️',
    essence: 'Your Vata Prakriti — swift, creative, luminous — is woven from the forces of Air and Space. You are gifted with extraordinary intuition, artistic vision, and the rare ability to transmit ideas with effortless grace.',
    strengths: ['Creative Thinking', 'Artistic Expression', 'Teaching & Writing', 'Inspired Movement', 'Rapid Learning'],
  },
  pitta: {
    icon: '🔥',
    essence: 'Your Pitta Prakriti — fierce, focused, brilliant — blazes with the intelligence of Fire and the depth of Water. You possess surgical clarity of mind and an unmatched capacity for disciplined, purposeful achievement.',
    strengths: ['Strategic Leadership', 'Analytical Thinking', 'Goal Achievement', 'Research & Mastery', 'Decisive Action'],
  },
  kapha: {
    icon: '🌿',
    essence: 'Your Kapha Prakriti — steady, nurturing, enduring — is rooted in the strength of Earth and the nourishment of Water. You build what lasts — with patience, loyalty, and a depth of devotion that is truly rare.',
    strengths: ['Long-Term Projects', 'Nurturing Relationships', 'Physical Endurance', 'Devotional Practice', 'Creative Crafts'],
  },
};

// ─── Prakriti Work Map ──────────────────────────────────────────────────────
const PRAKRITI_WORK_MAP: Record<string, { ideal: string[]; bestHours: string; story: string }> = {
  vata: { ideal: ['Creative writing', 'Design & art', 'Brainstorming', 'Music', 'Research'], bestHours: '10 AM – 2 PM', story: 'Your Vata mind sparks brilliance in creative and expressive work. Anchor your day with routine to harness your gift fully.' },
  pitta: { ideal: ['Leadership', 'Problem-solving', 'Analysis', 'Teaching', 'Strategy'], bestHours: '6 AM – 12 PM', story: 'Your Pitta fire makes you a natural leader. Thrive under purposeful challenge — rest your sharp intellect with cooling breaks.' },
  kapha: { ideal: ['Nurturing', 'Long-term projects', 'Finance', 'Community', 'Building'], bestHours: '2 PM – 6 PM', story: 'Your Kapha constitution gives you enduring stamina. You build things that last — warm up in the morning to let your power shine.' },
};
function getPrakritiWork(combo: string) {
  const lc = combo.toLowerCase();
  if (lc.includes('pitta') && lc.includes('vata')) return { ...PRAKRITI_WORK_MAP.pitta, ideal: ['Strategic creativity', 'Design-led leadership', 'Goal achievement', 'Analytical art', 'Research'] };
  if (lc.includes('vata') && lc.includes('kapha')) return { ...PRAKRITI_WORK_MAP.vata, ideal: ['Creative long-form', 'Artistic production', 'Devotional craft', 'Music & writing', 'Inspired movement'] };
  if (lc.includes('kapha') && lc.includes('pitta')) return { ...PRAKRITI_WORK_MAP.kapha, ideal: ['Systems leadership', 'Executive management', 'Community building', 'Finance', 'Operations'] };
  if (lc.includes('pitta')) return PRAKRITI_WORK_MAP.pitta;
  if (lc.includes('kapha')) return PRAKRITI_WORK_MAP.kapha;
  return PRAKRITI_WORK_MAP.vata;
}

const TIME_SLOT_CONFIG: Record<string, { emoji: string; label: string; color: string; Icon: LucideIcon }> = {
  morning: { emoji: '🌅', label: 'Morning', color: '#fbbf24', Icon: Sunrise },
  midday: { emoji: '☀️', label: 'Afternoon', color: '#fb923c', Icon: Sun },
  evening: { emoji: '🌆', label: 'Evening', color: '#a78bfa', Icon: Sunset },
  night: { emoji: '🌙', label: 'Night', color: '#60a5fa', Icon: Moon },
  sacred: { emoji: '🔱', label: 'Sacred', color: '#c084fc', Icon: Star },
  anytime: { emoji: '✦', label: 'Anytime', color: '#4ade80', Icon: InfinityIcon },
};

const DAILY_INTENTIONS = [
  'Let today be a gentle unfolding — one step, one breath, one moment at a time.',
  'Begin with stillness. Everything flows from here.',
  'Progress, not perfection. Presence, not pressure.',
  'Each completed practice is a gift to your future self.',
  'What you water, grows. Water what matters today.',
  'You hold within you the capacity for extraordinary transformation.',
];

// ─── Unified Log Bridge (keeps Practice section & Bodhi story strip in sync) ───
function getISTDate(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

const UNIFIED_LOG_KEY = 'onesutra_unified_log_v1';
function saveToUnifiedLog(habitIcon: string, habitName: string): void {
  if (typeof window === 'undefined') return;
  try {
    const today = getISTDate();
    const raw = JSON.parse(localStorage.getItem(UNIFIED_LOG_KEY) ?? '{}');
    const todayLogs: Array<{ activity: string; verdict: string; timestamp: number }> = raw[today] ?? [];
    const activityName = `${habitIcon} ${habitName}`;
    if (!todayLogs.some(l => l.activity.toLowerCase() === activityName.toLowerCase())) {
      todayLogs.push({ activity: activityName, verdict: 'on_time', timestamp: Date.now() });
    }
    raw[today] = todayLogs;
    localStorage.setItem(UNIFIED_LOG_KEY, JSON.stringify(raw));
  } catch { }
}

// ─── Write to shared smartlog key (same key used by SmartAnalyticsDashboard) ──
const SHARED_SMARTLOG_KEY = 'onesutra_smartlog_v2';
function writeToSharedSmartLog(habitId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const today = getISTDate();
    const raw = JSON.parse(localStorage.getItem(SHARED_SMARTLOG_KEY) ?? '{}');
    const ids: Set<string> = new Set(raw[today] ?? []);
    ids.add(habitId);
    raw[today] = [...ids];
    localStorage.setItem(SHARED_SMARTLOG_KEY, JSON.stringify(raw));
  } catch { }
}

// ─── SmartLog sync: Morning Logs → Practices ────────────────────────────────────────────
const SMART_LOG_KEY = 'onesutra_smartlog_v2';
const SMART_LOG_TO_HABIT: Record<string, string[]> = {
  wake: ['h_wake_early'],
  warm_water: ['h_warm_water'],
  tongue_scrape: ['h_tongue_scraping'],
  breathwork: ['h_pranayama', 'h_morning_meditation'],
  bath: ['h_bathing'],
  morning_light: ['h_morning_sunlight'],
  breakfast: ['h_breakfast'],
  sleep: ['h_sleep_early'],
  gratitude: ['h_gratitude'],
  hydration: ['h_water'],
};
function readSmartLogDoneHabitIds(): Set<string> {
  try {
    if (typeof window === 'undefined') return new Set();
    const today = getISTDate();
    const raw = JSON.parse(localStorage.getItem(SMART_LOG_KEY) ?? '{}');
    const todayIds: string[] = raw[today] ?? [];
    const ids = new Set<string>();
    todayIds.forEach(id => (SMART_LOG_TO_HABIT[id] ?? []).forEach(hid => ids.add(hid)));
    return ids;
  } catch { return new Set(); }
}

// ─── Ayurvedic morning practice sequence ─────────────────────────────────────
const MORNING_PRACTICE_ORDER: Record<string, number> = {
  h_wake_early: 0,           // Rise before sunrise — first act
  h_warm_water: 1,           // Warm water (Ushapana) — before anything else
  h_tongue_scraping: 2,      // Oral hygiene — MUST come before bath
  h_pranayama: 3,            // Pranayama / breathwork after oral hygiene
  h_morning_meditation: 4,   // Meditation after pranayama
  h_bathing: 5,              // Snana — bath after meditation
  h_morning_sunlight: 6,     // Surya darshana — after bath
  h_gratitude: 7,            // Gratitude log
  h_breakfast: 8,            // Mindful breakfast — ONLY after sadhana
};

// ─── OneSutra Streak Tier Helper ────────────────────────────────────────────
function getStreakTier(days: number): string {
  if (days >= 180) return 'Ancient Grove';
  if (days >= 84) return 'Forest';
  if (days >= 21) return 'Tree';
  if (days >= 7) return 'Sapling';
  return 'Seed';
}
const TIER_EMOJI: Record<string, string> = {
  'Seed': '🌱', 'Sapling': '🌿', 'Tree': '🌳', 'Forest': '🌾', 'Ancient Grove': '🌄',
};
const MILESTONE_DAYS = [7, 21, 84, 180];
const MILESTONE_LABEL: Record<number, { title: string; subtitle: string; color: string; emoji: string }> = {
  7: { title: 'Sapling Reached 🌿', subtitle: 'One Ayurvedic dhatu (tissue) cycle complete. Your cells have been touched by this routine.', color: '#4ade80', emoji: '🌿' },
  21: { title: 'Tree Achieved 🌳', subtitle: '21 days forms a new samskara — a groove in mind and body. What felt like effort is becoming your nature.', color: '#fbbf24', emoji: '🌳' },
  84: { title: 'Forest Unlocked 🌾', subtitle: 'One full Ritucharya (seasonal) cycle complete. This is no longer a habit — this is who you are.', color: '#c084fc', emoji: '🏕️' },
  180: { title: 'Ancient Grove 🌄', subtitle: '6 months of sustained sadhana. The shastras say this reshapes the very fabric of your being.', color: '#f97316', emoji: '🌄' },
};

// ─── Real Sun SVG ────────────────────────────────────────────────────────────
function RealSunSVG({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sunCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff7aa" />
          <stop offset="40%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#f97316" />
        </radialGradient>
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#sunGlow)" />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
        <line key={i}
          x1={24 + 13 * Math.cos((deg * Math.PI) / 180)}
          y1={24 + 13 * Math.sin((deg * Math.PI) / 180)}
          x2={24 + 20 * Math.cos((deg * Math.PI) / 180)}
          y2={24 + 20 * Math.sin((deg * Math.PI) / 180)}
          stroke={i % 2 === 0 ? '#fbbf24' : '#fde68a'}
          strokeWidth={i % 2 === 0 ? 2.2 : 1.4}
          strokeLinecap="round"
        />
      ))}
      <circle cx="24" cy="24" r="11" fill="url(#sunCore)" />
      <circle cx="20" cy="20" r="3" fill="#fff" fillOpacity="0.45" />
    </svg>
  );
}

// ─── Real Moon SVG ────────────────────────────────────────────────────────────
function RealMoonSVG({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="moonBody" cx="38%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="40%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#92400e" stopOpacity="0.9" />
        </radialGradient>
        <radialGradient id="moonGlowHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Outer halo glow */}
      <circle cx="24" cy="24" r="23" fill="url(#moonGlowHalo)" />
      {/* Crescent body — warm golden moon */}
      <path d="M31 9.5C22.4 9.5 15.5 16 15.5 24s6.9 14.5 15.5 14.5c1.6 0 3.2-0.25 4.6-0.72-2.8 1.8-6.1 2.8-9.6 2.8C17.1 40.1 8.9 32.3 8.9 24S17.1 7.9 26 7.9c1.8 0 3.6 0.28 5.2 0.8-0.1 0.26-0.2 0.52-0.2 0.8z" fill="url(#moonBody)" />
      {/* Crater highlights */}
      <circle cx="22" cy="20" r="2.1" fill="#92400e" fillOpacity="0.22" />
      <circle cx="27" cy="31" r="1.4" fill="#78350f" fillOpacity="0.18" />
      <circle cx="19" cy="28" r="0.9" fill="#92400e" fillOpacity="0.16" />
      {/* Top shine */}
      <path d="M19 14C22 12.2 26.5 12 29.5 13.5" stroke="#fef3c7" strokeWidth="1.3" strokeLinecap="round" opacity="0.45" />
      {/* Stars */}
      <circle cx="38" cy="10" r="1.3" fill="#fde68a" fillOpacity="0.9" />
      <circle cx="41" cy="27" r="0.85" fill="#fbbf24" fillOpacity="0.7" />
      <circle cx="36" cy="39" r="1.0" fill="#fde68a" fillOpacity="0.6" />
      <circle cx="9" cy="13" r="0.7" fill="#fde68a" fillOpacity="0.5" />
      <circle cx="6" cy="32" r="0.6" fill="#fbbf24" fillOpacity="0.4" />
    </svg>
  );
}

// ─── Sunrise SVG ─────────────────────────────────────────────────────────────
function RisingSunSVG({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="riseGlow" cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor="#fb923c" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="4" y="34" width="40" height="1.5" rx="0.75" fill="#fb923c" fillOpacity="0.4" />
      <path d="M24 34 C24 34 14 34 8 28 C12 22 17 18 24 18 C31 18 36 22 40 28 C34 34 24 34 24 34Z" fill="url(#riseGlow)" />
      {[-60, -40, -20, 0, 20, 40, 60].map((deg, i) => (
        <line key={i}
          x1={24 + 12 * Math.cos(((90 + deg) * Math.PI) / 180)}
          y1={34 + 12 * Math.sin(((90 + deg) * Math.PI) / 180)}
          x2={24 + 20 * Math.cos(((90 + deg) * Math.PI) / 180)}
          y2={34 + 20 * Math.sin(((90 + deg) * Math.PI) / 180)}
          stroke={i % 2 === 0 ? '#fb923c' : '#fde68a'}
          strokeWidth={i === 3 ? 2.5 : 1.6}
          strokeLinecap="round"
          opacity={0.8}
        />
      ))}
      <circle cx="24" cy="34" r="8" fill="#fb923c" />
      <circle cx="24" cy="34" r="6" fill="#fde047" />
      <circle cx="21" cy="31" r="2" fill="#fff" fillOpacity="0.4" />
    </svg>
  );
}

// ─── Sunset SVG ──────────────────────────────────────────────────────────────
function SunsetSVG({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="setGlow" cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="4" y="34" width="40" height="1.5" rx="0.75" fill="#f97316" fillOpacity="0.4" />
      {[-50, -30, 0, 30, 50].map((deg, i) => (
        <line key={i}
          x1={24 + 12 * Math.cos(((90 + deg) * Math.PI) / 180)}
          y1={34 + 12 * Math.sin(((90 + deg) * Math.PI) / 180)}
          x2={24 + 18 * Math.cos(((90 + deg) * Math.PI) / 180)}
          y2={34 + 18 * Math.sin(((90 + deg) * Math.PI) / 180)}
          stroke="#f97316" strokeWidth="1.6" strokeLinecap="round" opacity="0.7"
        />
      ))}
      <circle cx="24" cy="34" r="8" fill="#f97316" />
      <circle cx="24" cy="34" r="5.5" fill="#fb923c" />
      <path d="M4 34 Q8 30 12 34" stroke="#a855f7" strokeWidth="1.2" fill="none" opacity="0.5" />
      <path d="M36 34 Q40 30 44 34" stroke="#a855f7" strokeWidth="1.2" fill="none" opacity="0.5" />
    </svg>
  );
}

// ─── Progress Ring ───────────────────────────────────────────────────────────
function ProgressRing({ pct, size = 88, stroke = 7, color = '#fbbf24' }: {
  pct: number; size?: number; stroke?: number; color?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
      />
    </svg>
  );
}

// ─── Unified Progress Hub ─────────────────────────────────────────────────────
function UnifiedProgressHub({ completionRate, completedCount, totalHabits, consistencyScore, todayXP, xpTotal, levelInfo, nextLevel, ringColor, weekDays, currentFocusLabel, currentFocusColor }: {
  completionRate: number; completedCount: number; totalHabits: number;
  consistencyScore: number; todayXP: number; xpTotal: number;
  levelInfo: { name: string; icon: string; minXP: number };
  nextLevel: { minXP: number } | null;
  ringColor: string;
  weekDays: { label: string; pct: number }[];
  currentFocusLabel: string;
  currentFocusColor: string;
}) {
  const xpPct = nextLevel ? Math.min(100, Math.round(((xpTotal - levelInfo.minXP) / (nextLevel.minXP - levelInfo.minXP)) * 100)) : 100;
  const remaining = totalHabits - completedCount;
  const statusEmoji = completionRate >= 100 ? '🏆' : completionRate >= 75 ? '🔥' : completionRate >= 40 ? '🌱' : '✦';
  const statusText = completionRate >= 100 ? 'Perfect day — all done!' : completionRate >= 75 ? 'Almost there — keep going' : completionRate >= 40 ? `${remaining} habits left` : `${remaining} habits to begin`;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
      style={{ marginBottom: '1rem', background: 'rgba(0,0,0,0.26)', borderRadius: 22, border: `1px solid ${ringColor}22`, padding: '1rem 1rem 0.85rem', backdropFilter: 'blur(18px)', boxShadow: `0 4px 32px ${ringColor}10` }}>

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
            style={{ width: 7, height: 7, borderRadius: '50%', background: currentFocusColor, flexShrink: 0, boxShadow: `0 0 8px ${currentFocusColor}` }} />
          <span style={{ fontSize: '0.62rem', fontWeight: 800, color: currentFocusColor, fontFamily: "'Outfit', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>{currentFocusLabel}</span>
        </div>
        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>{statusEmoji} {statusText}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Big Progress Ring */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <ProgressRing pct={completionRate} size={92} stroke={7} color={ringColor} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 900, color: ringColor, fontFamily: "'Outfit', sans-serif", lineHeight: 1, textShadow: `0 0 14px ${ringColor}88` }}>{completionRate}%</span>
            <span style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.32)', fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 1 }}>today</span>
          </div>
        </div>

        {/* Right column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* 3 stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.38rem', marginBottom: '0.62rem' }}>
            <div style={{ textAlign: 'center', padding: '0.38rem 0.2rem', borderRadius: 12, background: `${ringColor}10`, border: `1px solid ${ringColor}22` }}>
              <p style={{ margin: 0, fontSize: '1.0rem', fontWeight: 900, color: '#fff', fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>{completedCount}<span style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.35)' }}>/{totalHabits}</span></p>
              <p style={{ margin: '2px 0 0', fontSize: '0.46rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>habits</p>
            </div>
            <div style={{ textAlign: 'center', padding: '0.38rem 0.2rem', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p style={{ margin: 0, fontSize: '1.0rem', fontWeight: 900, color: ringColor, fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>{consistencyScore}<span style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.28)' }}>%</span></p>
              <p style={{ margin: '2px 0 0', fontSize: '0.46rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>7-day</p>
            </div>
            <div style={{ textAlign: 'center', padding: '0.38rem 0.2rem', borderRadius: 12, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <p style={{ margin: 0, fontSize: '1.0rem', fontWeight: 900, color: '#fbbf24', fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>+{todayXP}</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.46rem', color: 'rgba(251,191,36,0.5)', fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>XP</p>
            </div>
          </div>

          {/* 7-day mini bar chart */}
          <div style={{ display: 'flex', gap: '0.22rem', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
            {weekDays.map((day, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div style={{ width: '100%', height: 20, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${day.pct}%` }}
                    transition={{ duration: 0.9, delay: i * 0.07, ease: 'easeOut' }}
                    style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: day.pct >= 80 ? `linear-gradient(180deg, #4ade80, #22d3ee)` : day.pct >= 40 ? `linear-gradient(180deg, #fbbf24, #fb923c)` : day.pct > 0 ? 'rgba(255,255,255,0.2)' : 'transparent', borderRadius: 4, boxShadow: day.pct >= 80 ? '0 0 6px rgba(74,222,128,0.5)' : 'none' }}
                  />
                </div>
                <span style={{ fontSize: '0.40rem', color: 'rgba(255,255,255,0.28)', fontFamily: "'Outfit', sans-serif", fontWeight: 700, textTransform: 'uppercase' }}>{day.label}</span>
              </div>
            ))}
          </div>

          {/* XP progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.38rem' }}>
            <span style={{ fontSize: '0.78rem', flexShrink: 0 }}>{levelInfo.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: '0.6rem', color: '#fbbf24', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>{levelInfo.name}</span>
                <span style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.22)', fontFamily: "'Outfit', sans-serif" }}>{xpTotal} XP</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, #fbbf24, #f97316)', borderRadius: 2, boxShadow: '0 0 8px rgba(251,191,36,0.6)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Bodhi Speaking Wave ────────────────────────────────────────────────────
function SpeakingWave() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '0 2px', height: 22 }}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          animate={{ scaleY: [0.35, 1.2, 0.35] }}
          transition={{ duration: 0.75, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
          style={{ width: 3, height: 18, borderRadius: 3, background: '#fbbf24', transformOrigin: 'center', flexShrink: 0 }}
        />
      ))}
    </div>
  );
}

// ─── Streak Flame ────────────────────────────────────────────────────────────
function StreakFlame({ count }: { count: number }) {
  if (count === 0) return null;
  const isMilestone = [3, 7, 14, 30, 100].includes(count);
  const color = count >= 100 ? '#c084fc' : count >= 30 ? '#f97316' : count >= 14 ? '#a78bfa' : count >= 7 ? '#fbbf24' : '#fb923c';
  const badge = count >= 100 ? 'DIVINE' : count >= 30 ? '30d' : count >= 14 ? '14d' : count >= 7 ? '7d' : '';
  return (
    <motion.span
      animate={isMilestone ? { scale: [1, 1.45, 1] } : {}}
      transition={{ duration: 0.55, ease: 'backOut' }}
      style={{ display: 'flex', alignItems: 'center', gap: 2, fontWeight: 900, fontFamily: "'Outfit', sans-serif" }}
    >
      <span style={{ fontSize: count >= 7 ? '1.05rem' : '0.95rem' }}>{count >= 100 ? '🔱' : '🔥'}</span>
      <span style={{ fontSize: '0.82rem', color }}>{count}</span>
      {badge && (
        <span style={{ fontSize: '0.42rem', padding: '0.04rem 0.26rem', borderRadius: 99, background: `${color}20`, border: `1px solid ${color}45`, color, fontWeight: 800, letterSpacing: '0.06em' }}>
          {badge}
        </span>
      )}
    </motion.span>
  );
}

// ─── Habit Row ───────────────────────────────────────────────────────────────
function HabitRow({ habit, isCompleted, isSkipped, streak }: {
  habit: HabitItem; isCompleted: boolean; isSkipped: boolean; streak: number;
}) {
  const color = LIFE_AREA_COLORS[habit.lifeArea] ?? '#a78bfa';
  const timeConf = TIME_SLOT_CONFIG[habit.category ?? 'anytime'] ?? TIME_SLOT_CONFIG.anytime;
  const isPending = !isCompleted && !isSkipped;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}

      style={{
        display: 'flex', alignItems: 'center', gap: 0,
        borderRadius: 16,
        background: isCompleted
          ? `linear-gradient(135deg, ${color}35, rgba(0,0,0,0.45))`
          : isPending
            ? `radial-gradient(ellipse at 28% 30%, ${color}22 0%, rgba(0,0,0,0.42) 80%)`
            : 'rgba(0,0,0,0.38)',
        border: `1.5px solid ${isCompleted ? color + '65' : isPending ? color + '45' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: isCompleted ? `0 4px 24px ${color}30, inset 0 1px 0 rgba(255,255,255,0.06)` : isPending ? `0 2px 18px ${color}22, inset 0 1px 0 rgba(255,255,255,0.04)` : 'inset 0 1px 0 rgba(255,255,255,0.03)',
        marginBottom: '0.48rem',
        opacity: isSkipped ? 0.3 : 1,
        cursor: 'default',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Vivid left accent strip */}
      <div style={{
        width: 4, alignSelf: 'stretch', flexShrink: 0,
        background: isCompleted ? color : isPending ? `linear-gradient(180deg, ${color}, ${color}55)` : `${color}45`,
        borderRadius: '16px 0 0 16px',
      }} />

      {/* Icon badge */}
      <div style={{
        margin: '0.7rem 0.65rem 0.7rem 0.75rem', width: 42, height: 42, borderRadius: 13, flexShrink: 0,
        background: `linear-gradient(135deg, ${color}28, ${color}10)`,
        border: `1.5px solid ${color}35`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.3rem', position: 'relative',
      }}>
        {habit.icon}
        {isCompleted && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            style={{ position: 'absolute', inset: 0, borderRadius: 13, background: `${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={20} style={{ color }} />
          </motion.div>
        )}
        {isPending && (
          <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.45, 0, 0.45] }} transition={{ duration: 2.5, repeat: Infinity }}
            style={{ position: 'absolute', inset: -2, borderRadius: 15, border: `1.5px solid ${color}50`, pointerEvents: 'none' }} />
        )}
      </div>


      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, paddingRight: '0.1rem' }}>
        <p style={{
          margin: 0, fontSize: '0.95rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif",
          color: isCompleted ? color : 'rgba(255,255,255,0.92)',
          textDecoration: isSkipped ? 'line-through' : 'none',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{habit.name}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: 3 }}>
          <span style={{
            fontSize: '0.6rem', padding: '0.1rem 0.42rem', borderRadius: 99,
            background: `${timeConf.color}18`, border: `1px solid ${timeConf.color}32`,
            color: timeConf.color, fontFamily: "'Outfit', sans-serif", fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', gap: 3,
          }}>
            <timeConf.Icon size={9} strokeWidth={2.4} />
            {timeConf.label}
          </span>
          {habit.scheduledTime && (
            <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.26)', fontFamily: "'Outfit', sans-serif" }}>{habit.scheduledTime}</span>
          )}
        </div>
      </div>

      {/* Streak + SmartLog nudge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', paddingRight: '0.6rem', flexShrink: 0 }}>
        <StreakFlame count={streak} />
        {isPending && (
          <span style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.22)', fontFamily: "'Outfit', sans-serif", fontWeight: 600, letterSpacing: '0.04em', textAlign: 'right', lineHeight: 1.3, maxWidth: 42 }}>Log above ↑</span>
        )}
      </div>

    </motion.div>
  );
}

// ─── Mood Log Panel ──────────────────────────────────────────────────────────
function MoodLogPanel({ onClose, onLog, bgImage }: {
  onClose: () => void;
  onLog: (mood: number, energy: number, tags: string[], note?: string) => void;
  bgImage: string;
}) {
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const TAGS = ['grateful', 'anxious', 'focused', 'calm', 'distracted', 'energised', 'tired', 'hopeful'];
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(2,1,10,0.93)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(20px)' }}
      onClick={onClose}
    >
      <motion.div
        onClick={e => e.stopPropagation()}
        initial={{ y: 60 }} animate={{ y: 0 }}
        style={{
          width: '100%', maxWidth: 480,
          position: 'relative', overflow: 'hidden',
          border: '1px solid rgba(168,85,247,0.28)',
          borderRadius: '24px 24px 0 0',
          padding: '1.75rem 1.4rem 2.5rem',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.6)',
        }}
      >
        {/* Nature bg */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url('${bgImage}')`, backgroundSize: 'cover', backgroundPosition: 'center top', filter: 'blur(2px) brightness(0.5) saturate(1.1)', zIndex: 0 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(4,2,16,0.22) 0%, rgba(4,2,16,0.68) 100%)', zIndex: 1 }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h3 style={{ margin: '0 0 0.15rem', color: '#fff', fontSize: '0.95rem', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>How are you right now?</h3>
          <p style={{ margin: '0 0 1.1rem', color: 'rgba(255,255,255,0.32)', fontSize: '0.7rem', fontFamily: "'Outfit', sans-serif" }}>A moment of honest self-check.</p>

          <p style={{ margin: '0 0 0.45rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mood</p>
          <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '1rem' }}>
            {MOOD_OPTIONS.map(m => (
              <motion.button key={m.value} whileTap={{ scale: 0.88 }} onClick={() => setMood(m.value)}
                style={{
                  flex: 1, padding: '0.5rem 0', borderRadius: 12, cursor: 'pointer',
                  background: mood === m.value ? `${m.color}22` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${mood === m.value ? m.color + '80' : 'rgba(255,255,255,0.07)'}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                }}>
                <span style={{ fontSize: '1.2rem' }}>{m.emoji}</span>
                <span style={{ fontSize: '0.48rem', color: mood === m.value ? m.color : 'rgba(255,255,255,0.32)', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>{m.label}</span>
              </motion.button>
            ))}
          </div>

          <p style={{ margin: '0 0 0.45rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase', letterSpacing: '0.1em' }}>Energy</p>
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
            {ENERGY_OPTIONS.map(e => (
              <motion.button key={e.value} whileTap={{ scale: 0.88 }} onClick={() => setEnergy(e.value)}
                style={{
                  flex: 1, padding: '0.42rem 0', borderRadius: 10, cursor: 'pointer', fontSize: '1.1rem',
                  background: energy === e.value ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${energy === e.value ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.07)'}`,
                }}>{e.emoji}</motion.button>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.32rem', marginBottom: '0.85rem' }}>
            {TAGS.map(t => (
              <motion.button key={t} whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                style={{
                  padding: '0.22rem 0.6rem', borderRadius: 999, cursor: 'pointer', fontSize: '0.65rem',
                  fontFamily: "'Outfit', sans-serif", fontWeight: 600,
                  background: selectedTags.includes(t) ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${selectedTags.includes(t) ? 'rgba(168,85,247,0.45)' : 'rgba(255,255,255,0.08)'}`,
                  color: selectedTags.includes(t) ? '#c084fc' : 'rgba(255,255,255,0.42)',
                }}>{t}</motion.button>
            ))}
          </div>

          <input
            placeholder="Note for today... (optional)"
            value={note} onChange={e => setNote(e.target.value)}
            style={{
              width: '100%', padding: '0.62rem 0.82rem', borderRadius: 10, marginBottom: '0.85rem',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
              color: '#fff', fontSize: '0.8rem', fontFamily: "'Outfit', sans-serif",
              outline: 'none', boxSizing: 'border-box',
            }}
          />

          <motion.button
            whileTap={{ scale: 0.97 }} disabled={!mood || !energy}
            onClick={() => { if (mood && energy) { onLog(mood, energy, selectedTags, note || undefined); onClose(); } }}
            style={{
              width: '100%', padding: '0.82rem', borderRadius: 13,
              background: mood && energy ? 'linear-gradient(135deg, #a855f7, #7c3aed)' : 'rgba(255,255,255,0.07)',
              border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.85rem',
              fontFamily: "'Outfit', sans-serif", cursor: mood && energy ? 'pointer' : 'default',
            }}
          >Log Check-in</motion.button>
        </div>{/* /zIndex layer */}
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function LifestylePanel({ globalBg, hideGreetingRow = false }: { globalBg?: string; hideGreetingRow?: boolean }) {
  const router = useRouter();
  const engine = useLifestyleEngine();
  const { user } = useOneSutraAuth();
  const { prakriti, vikriti, currentPhase, doshaOnboardingComplete, inBrahmaMuhurta } = useDoshaEngine();
  const { lang } = useLanguage();

  const [showMoodLog, setShowMoodLog] = useState(false);
  const [completedFlash, setCompletedFlash] = useState<string | null>(null);
  const [showAllHabits, setShowAllHabits] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [intentionIdx] = useState(() => Math.floor(Math.random() * DAILY_INTENTIONS.length));
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showGunaTracker, setShowGunaTracker] = useState(false);
  const [activeGunaTab, setActiveGunaTab] = useState<'guna' | 'dosha'>('guna');
  const [smartLogDoneIds, setSmartLogDoneIds] = useState<Set<string>>(readSmartLogDoneHabitIds);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [bodhiVoiceBubble, setBodhiVoiceBubble] = useState<{ text: string; isOptimalTime: boolean; habitName: string; habitIcon: string } | null>(null);
  const [bodhiSpeaking, setBodhiSpeaking] = useState(false);
  // ── Rhythm nudge state ─────────────────────────────────────────────────────────────────
  const [rhythmNudge, setRhythmNudge] = useState<{ text: string; type: 'morning' | 'midday' | 'evening' } | null>(null);
  const [milestoneCelebration, setMilestoneCelebration] = useState<{ days: number; label: typeof MILESTONE_LABEL[number] } | null>(null);
  const rhythmNudgeSentRef = useRef<Set<string>>(new Set());
  // todayDateKey forces full re-render at midnight so all "today" stats reset for the new day
  const [todayDateKey, setTodayDateKey] = useState(() => getISTDate());

  useEffect(() => {
    const refreshAll = () => {
      setSmartLogDoneIds(readSmartLogDoneHabitIds());
    };
    window.addEventListener('focus', refreshAll);
    window.addEventListener('daily-log-story-updated', refreshAll);
    window.addEventListener('habit-logged', refreshAll);
    window.addEventListener('storage', refreshAll);
    const timer = setInterval(refreshAll, 20_000);
    return () => {
      window.removeEventListener('focus', refreshAll);
      window.removeEventListener('daily-log-story-updated', refreshAll);
      window.removeEventListener('habit-logged', refreshAll);
      window.removeEventListener('storage', refreshAll);
      clearInterval(timer);
    };
  }, []);

  // Midnight reset — re-compute all "today" stats when the date rolls over
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 1, 0); // 1 second past midnight to ensure date has changed
    const ms = midnight.getTime() - now.getTime();
    const timer = setTimeout(() => {
      setTodayDateKey(getISTDate());
      setSmartLogDoneIds(readSmartLogDoneHabitIds());
    }, ms);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayDateKey]); // re-arm every day

  // ── Rhythm Nudge useEffect: morning / midday / evening proactive nudges ────────────────────
  useEffect(() => {
    if (!engine.profile?.onboardingComplete) return;
    const todayKey = getISTDate();
    const h = new Date().getHours();
    const score = engine.todayCompletionRate;
    const streakDays = Math.max(...Object.values(engine.streaks).map(s => s.currentStreak ?? 0), 0);
    const tier = getStreakTier(streakDays);
    const pendingCount = engine.activeHabits.filter(hab => !completedIds.has(hab.id) && !skippedIds.has(hab.id)).length;
    const firstPending = engine.activeHabits.find(hab => !completedIds.has(hab.id) && !skippedIds.has(hab.id));
    const topCompleted = engine.activeHabits.find(hab => completedIds.has(hab.id));
    const profileName2 = (() => {
      try {
        const cached = localStorage.getItem('onesutra_auth_v1');
        if (cached) { const p = JSON.parse(cached); if (p?.name && p.name !== 'Traveller') return p.name; }
      } catch { }
      return localStorage.getItem('vedic_user_name') || 'Mitra';
    })();

    const sendNudge = async (type: 'morning' | 'midday' | 'evening') => {
      const nudgeKey = `rhythm_nudge_${todayKey}_${type}`;
      if (rhythmNudgeSentRef.current.has(nudgeKey)) return;
      try { if (sessionStorage.getItem(nudgeKey)) return; } catch { }
      rhythmNudgeSentRef.current.add(nudgeKey);
      try { sessionStorage.setItem(nudgeKey, '1'); } catch { }
      try {
        const res = await fetch('/api/bodhi/rhythm-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type, userName: profileName2, pendingHabits: pendingCount,
            completedHabits: completedIds.size, disciplineScoreToday: Math.round(score),
            streakDays, streakTier: tier, prakriti: undefined,
            firstPendingHabit: firstPending ? `${firstPending.icon} ${firstPending.name}` : undefined,
            topCompletedHabit: topCompleted ? `${topCompleted.icon} ${topCompleted.name}` : undefined,
          }),
        });
        if (res.ok) {
          const { message } = await res.json();
          if (message) setRhythmNudge({ text: message, type });
        }
      } catch { /* silent */ }
    };

    // Morning check-in: 6–10 AM, if there are pending habits
    if (h >= 6 && h < 10 && pendingCount > 0) {
      sendNudge('morning');
    }
    // Midday nudge: if noon+ and score < 60%
    if (h >= 12 && h < 14 && score < 60 && pendingCount > 0) {
      sendNudge('midday');
    }
    // Evening summary: 8pm+, only if user has done at least 1 habit
    if (h >= 20 && completedIds.size > 0) {
      sendNudge('evening');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.todayCompletionRate, engine.profile?.onboardingComplete]);


  const [profileName] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      const cached = localStorage.getItem('onesutra_auth_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.name && parsed.name !== 'Traveller') return parsed.name;
      }
    } catch { }
    return localStorage.getItem('vedic_user_name') || '';
  });

  const hour = new Date().getHours();
  const firstName = profileName ? profileName.split(' ')[0] : '';
  const greetingWord = hour >= 3 && hour < 12 ? 'Good morning' : hour >= 12 && hour < 17 ? 'Good afternoon' : hour >= 17 && hour < 21 ? 'Good evening' : 'Good night';
  const smartGreeting = firstName ? `${greetingWord}, ${firstName}` : greetingWord;
  const greetingIconColor = hour >= 3 && hour < 7 ? '#fb923c' : hour >= 7 && hour < 17 ? '#fbbf24' : hour >= 17 && hour < 21 ? '#f97316' : '#818cf8';
  const todayLabel = new Date(todayDateKey).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const { completedIds, skippedIds } = engine.getTodayStatus();
  const effectiveCompletedIds = useMemo(
    () => new Set([...completedIds, ...smartLogDoneIds]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [completedIds.size, smartLogDoneIds.size]
  );
  const completionRate = engine.todayCompletionRate;
  const ringColor = completionRate >= 80 ? '#4ade80' : completionRate >= 50 ? '#fbbf24' : '#60a5fa';
  const levelInfo = getLevelFromXP(engine.xp.total);
  const nextLevel = getNextLevel(engine.xp.total);
  const todayXP = engine.xp.history.filter(h => h.date === getToday()).reduce((s, h) => s + h.xp, 0);

  const timeSlot = hour >= 3 && hour < 11 ? 'morning'
    : hour >= 11 && hour < 15 ? 'midday'
      : hour >= 15 && hour < 21 ? 'evening'
        : 'night';
  const SlotCfg = TIME_SLOT_CONFIG[timeSlot];
  const SlotIcon = SlotCfg.Icon;

  const isHabitNow = (habit: HabitItem) => {
    const cat = habit.category ?? 'anytime';
    if (cat === 'anytime') return true;
    if (cat === 'morning' && timeSlot === 'morning') return true;
    if (cat === 'midday' && timeSlot === 'midday') return true;
    if (cat === 'evening' && (timeSlot === 'evening' || timeSlot === 'night')) return true;
    if (cat === 'sacred' && timeSlot === 'morning') return true;
    if (cat === 'night' && timeSlot === 'night') return true;
    return false;
  };

  const allActiveHabits = engine.activeHabits;

  // Smart ordering: time-relevant NOW habits first, anytime next, other slots last
  const nowHabits = allActiveHabits.filter(h => {
    const c = h.category ?? 'anytime';
    return (c === timeSlot) || (c === 'sacred' && timeSlot === 'morning') || (c === 'evening' && timeSlot === 'night');
  });
  const anytimeHabits = allActiveHabits.filter(h => (h.category ?? 'anytime') === 'anytime');
  const otherHabits = allActiveHabits.filter(h => !nowHabits.includes(h) && !anytimeHabits.includes(h));
  const orderedHabits = [...nowHabits, ...anytimeHabits, ...otherHabits];

  const pendingNow = nowHabits.filter(h => !effectiveCompletedIds.has(h.id) && !skippedIds.has(h.id));
  const pendingAnytime = anytimeHabits.filter(h => !effectiveCompletedIds.has(h.id) && !skippedIds.has(h.id));
  const pendingOther = otherHabits.filter(h => !effectiveCompletedIds.has(h.id) && !skippedIds.has(h.id));
  const allDoneHabits = orderedHabits.filter(h => effectiveCompletedIds.has(h.id) || skippedIds.has(h.id));
  const sortedPendingNow = timeSlot === 'morning'
    ? [...pendingNow].sort((a, b) => (MORNING_PRACTICE_ORDER[a.id] ?? 99) - (MORNING_PRACTICE_ORDER[b.id] ?? 99))
    : pendingNow;
  const pendingNowCount = sortedPendingNow.length;
  const currentSlotSlotsToShow = timeSlot === 'morning' ? ['morning', 'sacred', 'anytime']
    : timeSlot === 'midday' ? ['midday', 'anytime']
      : timeSlot === 'evening' ? ['evening', 'anytime']
        : ['night', 'anytime'];
  const totalPending = allActiveHabits.filter(h => {
    const c = h.category ?? 'anytime';
    const inSlot = currentSlotSlotsToShow.includes(c);
    if (!inSlot) return false;
    return !effectiveCompletedIds.has(h.id) && !skippedIds.has(h.id);
  }).length;


  const triggerBodhiHabitVoice = useCallback(async (
    habit: HabitItem,
    nextHabit: HabitItem | null,
    completedSoFar: number,
  ) => {
    setBodhiSpeaking(true);
    setBodhiVoiceBubble({ text: '...', isOptimalTime: true, habitName: habit.name, habitIcon: habit.icon });

    // Compute enriched context
    const streakDays = engine.streaks[habit.id]?.currentStreak ?? 0;
    const allStreakDays = Math.max(...Object.values(engine.streaks).map(s => s.currentStreak ?? 0), 0);
    const isFirstHabitToday = completedSoFar === 1;

    // Check for streak milestone
    if (MILESTONE_DAYS.includes(allStreakDays) && isFirstHabitToday) {
      const ml = MILESTONE_LABEL[allStreakDays];
      if (ml) setMilestoneCelebration({ days: allStreakDays, label: ml });
    }

    // Timing context from habitWindows
    const loggedAtMs = Date.now();
    const logTime = getISTTimeStr(loggedAtMs);
    const todayISO = getISODateIST(loggedAtMs);
    const win = findHabitWindow(habit.id) ?? findHabitWindow(habit.name);
    const timingStatus = win ? getTimingStatus(win, loggedAtMs) : 'ideal';
    const lateStreak = win ? updateLateStreak(habit.id, timingStatus, todayISO) : 0;
    const morningMood = getMorningMood();

    try {
      const res = await fetch('/api/bodhi/habit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: profileName || 'friend',
          prakriti: prakriti?.combo ?? prakriti?.primary ?? '',
          vikruti: vikriti?.primary ?? '',
          mood: morningMood?.mood ?? '',
          habit_name: habit.name,
          log_time: logTime,
          ideal_start: win?.idealStart ?? '',
          ideal_end: win?.idealEnd ?? '',
          timing_status: timingStatus,
          late_streak: lateStreak,
          habit_streak: streakDays,
          dosha_effect: win?.doshaEffect ?? '',
          habit_benefit: win?.benefit ?? habit.description ?? '',
          duration_minutes: habit.targetValue ?? 0,
          time_section: win?.timeSection ?? (habit.category ?? 'flexible'),
        }),
      });
      const data = await res.json();
      const voiceMessage: string = data.response ?? data.voiceMessage ?? '';
      const isOptimalTime = timingStatus === 'ideal' || timingStatus === 'acceptable';
      setBodhiVoiceBubble({ text: voiceMessage, isOptimalTime, habitName: habit.name, habitIcon: habit.icon });
      // TTS playback
      try {
        const ttsRes = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: voiceMessage, voice: lang === 'hi' ? 'Kore' : 'Aoede' }),
        });
        if (ttsRes.ok) {
          const { audio, mimeType } = await ttsRes.json();
          if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
          const audioEl = new Audio(`data:${mimeType ?? 'audio/wav'};base64,${audio}`);
          audioRef.current = audioEl;
          audioEl.onended = () => {
            setBodhiSpeaking(false);
            setTimeout(() => setBodhiVoiceBubble(null), 2500);
          };
          await audioEl.play();
        } else {
          setBodhiSpeaking(false);
          setTimeout(() => setBodhiVoiceBubble(null), 4000);
        }
      } catch {
        setBodhiSpeaking(false);
        setTimeout(() => setBodhiVoiceBubble(null), 4000);
      }
    } catch {
      const fallbackText = lang === 'hi'
        ? 'अभ्यास दर्ज हुआ! आपका अग्नि मजबूत है — आगे बढ़ते रहें।'
        : 'Practice logged! Aapka Agni strong hai — keep going.';
      setBodhiVoiceBubble({ text: fallbackText, isOptimalTime: true, habitName: habit.name, habitIcon: habit.icon });
      setBodhiSpeaking(false);
      setTimeout(() => setBodhiVoiceBubble(null), 4000);
    }
  }, [prakriti, engine.activeHabits.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleComplete = useCallback((id: string) => {
    const habit = engine.activeHabits.find(h => h.id === id);
    engine.completeHabit(id);
    // Guaranteed cross-device Firestore write with non-stale user.uid
    logHabitAndSync(user?.uid, id);
    // Write to shared localStorage keys so SmartAnalyticsDashboard + SmartLogBubbles stay in sync
    writeToSharedSmartLog(id);
    if (habit) saveToDailyLogStory(id, habit.icon, habit.name, LIFE_AREA_COLORS[habit.lifeArea] ?? '#a78bfa');
    // Notify sibling components on this device — fire BOTH events for full coverage
    try { window.dispatchEvent(new CustomEvent('habit-logged')); } catch { }
    setCompletedFlash(id);
    if (habit) {
      saveToUnifiedLog(habit.icon, habit.name);
      // Determine next habit in sequence for Bodhi to mention
      const newDoneIds = new Set([...effectiveCompletedIds, id]);
      const slotsForSlot = timeSlot === 'morning' ? ['morning', 'sacred', 'anytime']
        : timeSlot === 'midday' ? ['midday', 'anytime']
          : timeSlot === 'evening' ? ['evening', 'anytime']
            : ['night', 'anytime'];
      const pendingAfter = engine.activeHabits.filter(h => {
        if (h.id === id) return false;
        const c = h.category ?? 'anytime';
        if (!slotsForSlot.includes(c)) return false;
        return !newDoneIds.has(h.id) && !skippedIds.has(h.id) && h.trackingType !== 'counter';
      });
      const sortedAfter = timeSlot === 'morning'
        ? [...pendingAfter].sort((a, b) => (MORNING_PRACTICE_ORDER[a.id] ?? 99) - (MORNING_PRACTICE_ORDER[b.id] ?? 99))
        : pendingAfter;
      const nextHabit = sortedAfter[0] ?? null;
      triggerBodhiHabitVoice(habit, nextHabit, effectiveCompletedIds.size + 1);
    }
    setTimeout(() => setCompletedFlash(null), 900);
  }, [engine, effectiveCompletedIds, skippedIds, timeSlot, triggerBodhiHabitVoice]);

  // Real-time insights
  const insights = useMemo(() => {
    const list: Array<{ icon: string; text: string; color: string; cta?: string; ctaHref?: string }> = [];

    if (completionRate >= 80)
      list.push({ icon: '🔥', text: `${completionRate}% of today's practices done — you're building something extraordinary.`, color: '#fbbf24' });
    else if (completionRate >= 50)
      list.push({ icon: '🌱', text: `Over halfway there. Each practice compounds with the next — keep going.`, color: '#4ade80' });
    else if (engine.activeHabits.length === 0)
      list.push({ icon: '✨', text: 'Your lifestyle canvas is blank — a beautiful beginning. Add your first practice below.', color: '#a78bfa' });
    else
      list.push({ icon: '🌅', text: 'The day holds infinite potential. Even one practice shifts everything that follows.', color: '#60a5fa' });

    if (prakriti && vikriti && vikriti.imbalanceLevel !== 'balanced') {
      const vPrimary = vikriti.primary;
      if (!vPrimary) return list;
      const info = DOSHA_INFO[vPrimary];
      list.push({ icon: info?.emoji ?? '🌿', text: `Your ${info?.name} is elevated. Bodhi Vaidya has a personalised guide for you now.`, color: '#fb923c', cta: 'Bodhi Vaidya →', ctaHref: '/lifestyle/bodhi-ayurveda' });
    }

    if (engine.todayMood?.mood != null && engine.todayMood.mood <= 2)
      list.push({ icon: '🌿', text: 'A breathing practice on a hard day creates more lasting change than ten on easy ones.', color: '#22d3ee', cta: 'Breathe →', ctaHref: '/pranayama' });
    if (engine.todayMood?.energy != null && engine.todayMood.energy >= 4)
      list.push({ icon: '⚡', text: 'High energy right now — this is your golden window for your deepest practice.', color: '#fbbf24', cta: 'Meditate →', ctaHref: '/dhyan-kshetra' });

    const maxStreak = Math.max(...Object.values(engine.streaks).map(s => s.currentStreak), 0);
    if (maxStreak >= 7) list.push({ icon: '🔱', text: `${maxStreak}-day streak — consistency is now woven into your identity.`, color: '#c084fc' });

    return list.slice(0, 3);
  }, [completionRate, engine, prakriti, vikriti]);

  const DOSHA_COLORS: Record<string, string> = { vata: '#a78bfa', pitta: '#fb923c', kapha: '#4ade80' };
  const doshaColor = prakriti ? (DOSHA_COLORS[prakriti.primary] ?? '#a78bfa') : '#a78bfa';

  // ── Nature background image (time-based, same pool as homepage) ─────────
  const NATURE_BG: Record<string, string[]> = {
    morning: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=75',
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&q=75',
    ],
    midday: [
      'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&q=75',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=75',
    ],
    evening: [
      'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=1200&q=75',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=75',
    ],
    night: [
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=75',
      'https://images.unsplash.com/photo-1475274047050-1d0c0975f9f1?w=1200&q=75',
    ],
  };
  const bgPool = NATURE_BG[timeSlot === 'night' ? 'night' : timeSlot] ?? NATURE_BG.morning;
  const computedBgImage = bgPool[Math.floor(Date.now() / (30 * 60_000)) % bgPool.length];
  const bgImage = globalBg || computedBgImage;

  // ── Week progress data ───────────────────────────────────────────────────
  const weekDays = useMemo(() => {
    const days: { label: string; pct: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2).toUpperCase();
      const logsForDay = engine.habitLogs.filter(l => l.date === dateStr && l.completed);
      const totalActive = engine.activeHabits.length;
      const pct = totalActive > 0 ? Math.round((logsForDay.length / totalActive) * 100) : 0;
      days.push({ label: dayLabel, pct: Math.min(100, pct) });
    }
    return days;
  }, [engine.habitLogs, engine.activeHabits.length]);

  // ── Not onboarded — show CTA ─────────────────────────────────────────────
  if (!engine.profile?.onboardingComplete) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        onClick={() => router.push('/bodhi-chat')}
        style={{ margin: '0 0.6rem 1rem', borderRadius: 24, cursor: 'pointer', overflow: 'hidden', position: 'relative', border: '1px solid rgba(167,139,250,0.22)', boxShadow: '0 16px 48px rgba(0,0,0,0.45)' }}
      >
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url('${bgImage}')`, backgroundSize: 'cover', backgroundPosition: 'center', transform: 'scale(1.06)', filter: 'blur(5px) brightness(0.28)' }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '1.5rem 1.3rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <motion.span animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 2.5, repeat: Infinity }} style={{ fontSize: '2.8rem', filter: 'drop-shadow(0 0 14px rgba(167,139,250,0.7))' }}>🪷</motion.span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 0.22rem', fontSize: '1.08rem', fontWeight: 800, color: '#c4b5fd', fontFamily: "'Outfit', sans-serif" }}>Begin Your Lifestyle Journey</p>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.45 }}>Discover your Prakriti · Build daily sadhana · Track growth</p>
          </div>
          <ChevronRight size={20} style={{ color: 'rgba(167,139,250,0.55)', flexShrink: 0 }} />
        </div>
      </motion.div>
    );
  }

  return (
    <div style={{ margin: '0 0.6rem 1.5rem' }}>

      {/* ── Streak Milestone Celebration Overlay ─────────────────────────── */}
      <AnimatePresence>
        {milestoneCelebration && (
          <motion.div
            key="milestone-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMilestoneCelebration(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 10000,
              background: 'rgba(2,1,12,0.94)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(28px)',
            }}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: 'calc(100vw - 3rem)', maxWidth: 380,
                background: `linear-gradient(160deg, ${milestoneCelebration.label.color}18, rgba(4,2,20,0.98))`,
                border: `1.5px solid ${milestoneCelebration.label.color}55`,
                borderRadius: 28, padding: '2rem 1.6rem',
                textAlign: 'center', boxShadow: `0 0 80px ${milestoneCelebration.label.color}20, 0 24px 72px rgba(0,0,0,0.7)`,
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.18, 1], rotate: [0, 8, -8, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: '4rem', marginBottom: '1rem', filter: `drop-shadow(0 0 24px ${milestoneCelebration.label.color})` }}
              >
                {milestoneCelebration.label.emoji}
              </motion.div>
              <p style={{ margin: '0 0 0.35rem', fontSize: '1.35rem', fontWeight: 900, color: '#fff', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.01em' }}>
                {milestoneCelebration.days} Days
              </p>
              <p style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 800, color: milestoneCelebration.label.color, fontFamily: "'Outfit', sans-serif" }}>
                {milestoneCelebration.label.title}
              </p>
              <p style={{ margin: '0 0 1.8rem', fontSize: '0.88rem', color: 'rgba(255,255,255,0.65)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.6 }}>
                {milestoneCelebration.label.subtitle}
              </p>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setMilestoneCelebration(null)}
                style={{
                  padding: '0.75rem 2.2rem', borderRadius: 999, border: 'none', cursor: 'pointer',
                  background: `linear-gradient(135deg, ${milestoneCelebration.label.color}, ${milestoneCelebration.label.color}99)`,
                  color: '#fff', fontWeight: 800, fontSize: '0.9rem', fontFamily: "'Outfit', sans-serif",
                  boxShadow: `0 8px 24px ${milestoneCelebration.label.color}40`,
                }}
              >
                Jai Ho 🙏
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Rhythm Nudge Bubble (morning / midday / evening) ─────────────── */}
      <AnimatePresence>
        {rhythmNudge && !bodhiVoiceBubble && (
          <motion.div
            key="rhythm-nudge"
            initial={{ opacity: 0, y: 60, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{
              position: 'fixed', bottom: 88, left: '50%', transform: 'translateX(-50%)',
              zIndex: 9997, width: 'calc(100vw - 1.8rem)', maxWidth: 470,
              background: 'linear-gradient(135deg, rgba(4,2,20,0.97), rgba(18,8,36,0.99))',
              border: `1.5px solid ${rhythmNudge.type === 'morning' ? 'rgba(251,191,36,0.5)' : rhythmNudge.type === 'midday' ? 'rgba(251,146,60,0.45)' : 'rgba(139,92,246,0.45)'}`,
              borderRadius: 22, padding: '0.95rem 1.1rem',
              backdropFilter: 'blur(28px)',
              boxShadow: '0 12px 48px rgba(0,0,0,0.75)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: 'radial-gradient(circle at 35% 30%, rgba(251,191,36,0.35), rgba(139,92,246,0.2) 65%, transparent)',
                border: '1.5px solid rgba(251,191,36,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
              }}>
                {rhythmNudge.type === 'morning' ? '🌅' : rhythmNudge.type === 'midday' ? '☀️' : '🌙'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 0.22rem', fontSize: '0.56rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: rhythmNudge.type === 'morning' ? '#fbbf24' : rhythmNudge.type === 'midday' ? '#fb923c' : '#a78bfa', fontFamily: "'Outfit', sans-serif" }}>
                  {rhythmNudge.type === 'morning' ? 'Morning Check-in' : rhythmNudge.type === 'midday' ? 'Midday Nudge' : 'Evening Summary'} · Bodhi
                </p>
                <p style={{ margin: 0, fontSize: '0.87rem', lineHeight: 1.55, fontFamily: "'Outfit', sans-serif", color: 'rgba(255,255,255,0.88)' }}>
                  {rhythmNudge.text}
                </p>
              </div>
              <button onClick={() => setRhythmNudge(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.28)', padding: 4, flexShrink: 0 }}>✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bodhi Voice Bubble ───────────────────────────────────────────── */}
      <AnimatePresence>
        {bodhiVoiceBubble && (

          <motion.div
            key="bodhi-voice-bubble"
            initial={{ opacity: 0, y: 60, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            style={{
              position: 'fixed',
              bottom: 88,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9998,
              width: 'calc(100vw - 1.8rem)',
              maxWidth: 470,
              background: 'linear-gradient(135deg, rgba(4,2,20,0.97), rgba(18,8,36,0.99))',
              border: `1.5px solid ${bodhiVoiceBubble.isOptimalTime ? 'rgba(251,191,36,0.5)' : 'rgba(251,146,60,0.45)'}`,
              borderRadius: 22,
              padding: '0.95rem 1.1rem',
              backdropFilter: 'blur(28px)',
              boxShadow: `0 12px 48px rgba(0,0,0,0.75), 0 0 48px ${bodhiVoiceBubble.isOptimalTime ? 'rgba(251,191,36,0.1)' : 'rgba(251,146,60,0.08)'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              {/* Bodhi orb */}
              <motion.div
                animate={bodhiSpeaking ? { boxShadow: ['0 0 0 2px rgba(251,191,36,0.3)', '0 0 0 6px rgba(251,191,36,0.15)', '0 0 0 2px rgba(251,191,36,0.3)'] } : {}}
                transition={{ duration: 0.9, repeat: Infinity }}
                style={{
                  width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                  background: 'radial-gradient(circle at 35% 30%, rgba(251,191,36,0.45) 0%, rgba(139,92,246,0.28) 65%, transparent 100%)',
                  border: `1.5px solid ${bodhiVoiceBubble.isOptimalTime ? 'rgba(251,191,36,0.65)' : 'rgba(251,146,60,0.55)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.15rem',
                }}
              >✦</motion.div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Status tags */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1rem', lineHeight: 1 }}>{bodhiVoiceBubble.habitIcon}</span>
                  <span style={{
                    fontSize: '0.52rem', padding: '0.1rem 0.4rem', borderRadius: 99,
                    background: 'rgba(74,222,128,0.2)', border: '1px solid rgba(74,222,128,0.45)',
                    color: '#4ade80', fontWeight: 800, fontFamily: "'Outfit', sans-serif", letterSpacing: '0.08em',
                  }}>✓ LOGGED</span>
                  {!bodhiVoiceBubble.isOptimalTime && (
                    <span style={{
                      fontSize: '0.52rem', padding: '0.1rem 0.4rem', borderRadius: 99,
                      background: 'rgba(251,146,60,0.18)', border: '1px solid rgba(251,146,60,0.4)',
                      color: '#fb923c', fontWeight: 800, fontFamily: "'Outfit', sans-serif",
                    }}>Off-time</span>
                  )}
                  {bodhiVoiceBubble.isOptimalTime && (
                    <span style={{
                      fontSize: '0.52rem', padding: '0.1rem 0.4rem', borderRadius: 99,
                      background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.38)',
                      color: '#fbbf24', fontWeight: 800, fontFamily: "'Outfit', sans-serif",
                    }}>✦ Optimal</span>
                  )}
                </div>
                {/* Bodhi message */}
                <p style={{
                  margin: 0, fontSize: '0.87rem', lineHeight: 1.55,
                  fontFamily: "'Outfit', sans-serif",
                  color: bodhiVoiceBubble.text === '...' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.9)',
                  fontStyle: bodhiVoiceBubble.text === '...' ? 'italic' : 'normal',
                }}>
                  {bodhiVoiceBubble.text === '...' ? (lang === 'hi' ? 'बोधि सुन रहा है...' : 'Bodhi sun raha hai...') : bodhiVoiceBubble.text}
                </p>
              </div>

              {/* Right — wave or close */}
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                {bodhiSpeaking ? (
                  <SpeakingWave />
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => { setBodhiVoiceBubble(null); if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.28)', padding: 4, display: 'flex', alignItems: 'center', fontSize: '0.75rem' }}
                  >✕</motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Completion flash ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {completedFlash && (
          <motion.div key="flash" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            style={{ position: 'fixed', top: '46%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 9999, pointerEvents: 'none', fontSize: '3rem', filter: 'drop-shadow(0 0 24px rgba(251,191,36,0.9))' }}>✨</motion.div>
        )}
      </AnimatePresence>

      {/* ── Mood Log Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showMoodLog && <MoodLogPanel onClose={() => setShowMoodLog(false)} onLog={(mood, energy, tags, note) => engine.logMood(mood, energy, tags, note)} bgImage={bgImage} />}
      </AnimatePresence>

      {/* ── Ayurvedic Intelligence Panel (Guna Tracker + Dosha Compass) ───── */}
      <AnimatePresence>
        {showGunaTracker && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowGunaTracker(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(2,1,10,0.92)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(20px)' }}
          >
            <motion.div
              onClick={e => e.stopPropagation()}
              initial={{ y: 100 }} animate={{ y: 0 }}
              style={{ width: '100%', maxWidth: 500, background: 'linear-gradient(160deg, rgba(251,191,36,0.07), rgba(6,3,18,0.98))', border: '1px solid rgba(251,191,36,0.18)', borderRadius: '28px 28px 0 0', padding: '1.5rem 1.4rem 2.5rem', maxHeight: '90vh', overflowY: 'auto' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>Ayurvedic Intelligence</h3>
                  <p style={{ margin: 0, fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>Guna Tracker · Dosha Compass</p>
                </div>
                <button onClick={() => setShowGunaTracker(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex' }}><X size={18} /></button>
              </div>

              {/* Tab switcher */}
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.2rem', padding: '0.22rem', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {(['guna', 'dosha'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveGunaTab(tab)}
                    style={{
                      flex: 1, padding: '0.42rem 0.6rem', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontSize: '0.78rem', fontWeight: 800, transition: 'all 0.2s',
                      background: activeGunaTab === tab ? (tab === 'guna' ? 'rgba(251,191,36,0.22)' : 'rgba(167,139,250,0.22)') : 'transparent',
                      color: activeGunaTab === tab ? (tab === 'guna' ? '#fbbf24' : '#c4b5fd') : 'rgba(255,255,255,0.35)',
                      boxShadow: activeGunaTab === tab ? (tab === 'guna' ? '0 0 12px rgba(251,191,36,0.18)' : '0 0 12px rgba(167,139,250,0.18)') : 'none',
                    }}
                  >
                    {tab === 'guna' ? '☯️ Guna Tracker' : '🧭 Dosha Compass'}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {activeGunaTab === 'guna' ? (
                <GunaTracker onClose={() => setShowGunaTracker(false)} minimal />
              ) : (
                <DoshaCompass />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          OUTER NATURE-FUSED GLASS CARD
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ borderRadius: 26, overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 72px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)' }}>

        {/* Nature background layer */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url('${bgImage}')`, backgroundSize: 'cover', backgroundPosition: 'center', transform: 'scale(1.07)', filter: 'blur(2px) brightness(0.68) saturate(1.15)', zIndex: 0 }} />
        {/* Overlay — exactly matches Smart Planner */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(4,2,16,0.06) 0%, rgba(4,2,16,0.28) 60%, rgba(4,2,16,0.42) 100%)', zIndex: 1 }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, padding: '1rem' }}>

          {/* ── SECTION 0 : Header Card — moved to top of page.tsx ── */}
          {false && <div>
            {/* ── CARD HERO TITLE ────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '1rem' }}>
              <motion.div
                animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.07, 1] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: '1.25rem', filter: 'drop-shadow(0 0 10px rgba(251,191,36,0.6))' }}
              >✦</motion.div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#fff', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.01em', lineHeight: 1 }}>Smart Ayur Planner</p>
                <p style={{ margin: 0, fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", marginTop: 2, letterSpacing: '0.05em' }}>Habits · Progress · Planner · Ayurveda</p>
              </div>
              <motion.span
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{ fontSize: '0.56rem', padding: '0.2rem 0.6rem', borderRadius: 99, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24', fontFamily: "'Outfit', sans-serif", fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}
              >Live</motion.span>
            </div>

            {/* Row 1: date + controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.68rem', color: 'rgba(255,255,255,0.38)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.04em' }}>{todayLabel}</p>
              <div style={{ display: 'flex', gap: '0.32rem', alignItems: 'center' }}>
                <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowMoodLog(true)}
                  style={{ padding: '0.25rem 0.6rem', borderRadius: 999, cursor: 'pointer', background: engine.todayMood ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.07)', border: `1px solid ${engine.todayMood ? 'rgba(168,85,247,0.45)' : 'rgba(255,255,255,0.1)'}`, color: engine.todayMood ? '#c084fc' : 'rgba(255,255,255,0.42)', fontSize: '0.7rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Heart size={10} />
                  {engine.todayMood ? (MOOD_OPTIONS.find(m => m.value === engine.todayMood!.mood)?.emoji ?? '😊') : 'Mood'}
                </motion.button>
                <motion.button whileTap={{ scale: 0.88 }} onClick={engine.toggleAdhdMode}
                  style={{ padding: '0.25rem 0.6rem', borderRadius: 999, cursor: 'pointer', background: engine.adhdMode ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.07)', border: `1px solid ${engine.adhdMode ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.1)'}`, color: engine.adhdMode ? '#fbbf24' : 'rgba(255,255,255,0.42)', fontSize: '0.7rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Zap size={10} fill={engine.adhdMode ? '#fbbf24' : 'none'} />
                  {engine.adhdMode ? 'Focus ON' : 'Focus'}
                </motion.button>
                {!showResetConfirm ? (
                  <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowResetConfirm(true)} title="Reset data"
                    style={{ padding: '0.25rem 0.4rem', borderRadius: 999, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center' }}>
                    <RotateCcw size={11} />
                  </motion.button>
                ) : (
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.38)', fontFamily: "'Outfit', sans-serif" }}>Reset?</span>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => { engine.resetHabitData(); setShowResetConfirm(false); }}
                      style={{ padding: '0.18rem 0.48rem', borderRadius: 99, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.38)', color: '#f87171', fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>Yes</motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowResetConfirm(false)}
                      style={{ padding: '0.18rem 0.48rem', borderRadius: 99, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.38)', fontSize: '0.62rem', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>No</motion.button>
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: greeting — hidden when page-level SmartAyuHeader is shown */}
            {!hideGreetingRow && (
              <div style={{ margin: '0 0 0.8rem', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                {/* Real Sun / Moon / Sunrise / Sunset SVG orb */}
                <motion.div
                  animate={{
                    boxShadow: [
                      `0 0 0 1px ${greetingIconColor}40, 0 0 18px ${greetingIconColor}55`,
                      `0 0 0 1px ${greetingIconColor}88, 0 0 36px ${greetingIconColor}bb`,
                      `0 0 0 1px ${greetingIconColor}40, 0 0 18px ${greetingIconColor}55`,
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    width: 54, height: 54, borderRadius: '50%', flexShrink: 0,
                    background: `radial-gradient(circle at 38% 32%, ${greetingIconColor}28 0%, transparent 70%)`,
                    border: `1px solid ${greetingIconColor}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {hour >= 3 && hour < 7 ? <RisingSunSVG size={44} /> : hour >= 7 && hour < 17 ? <RealSunSVG size={44} /> : hour >= 17 && hour < 21 ? <SunsetSVG size={44} /> : <RealMoonSVG size={44} />}
                </motion.div>
                <div>
                  <p style={{ margin: 0, fontSize: '1.28rem', fontWeight: 900, color: '#fff', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em', textShadow: '0 2px 12px rgba(0,0,0,0.4)', lineHeight: 1.1 }}>
                    {smartGreeting}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.68rem', color: `${greetingIconColor}cc`, fontFamily: "'Outfit', sans-serif", fontWeight: 600, letterSpacing: '0.06em', marginTop: '0.15rem' }}>
                    {timeSlot === 'morning' ? 'Brahma muhurta — begin your sadhana' : timeSlot === 'midday' ? 'Pitta noon — peak focus time' : timeSlot === 'evening' ? 'Vata sandhya — wind down gently' : 'Deep rest — honour your Ojas'}
                  </p>
                </div>
              </div>
            )}

            {/* Row 3: dosha phase strip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.52rem 0.8rem', borderRadius: 12, background: 'rgba(0,0,0,0.28)', border: `1px solid ${doshaColor}40`, backdropFilter: 'blur(10px)' }}>
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2.2, repeat: Infinity }}
                style={{ width: 8, height: 8, borderRadius: '50%', background: doshaColor, flexShrink: 0, boxShadow: `0 0 8px ${doshaColor}` }} />
              <span style={{ flex: 1, fontSize: '0.84rem', fontWeight: 700, color: 'rgba(255,255,255,0.82)', fontFamily: "'Outfit', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentPhase.label}{currentPhase.timeRange ? ` · ${currentPhase.timeRange}` : ''}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif", flexShrink: 0 }}>{currentPhase.quality}</span>
              {inBrahmaMuhurta && (
                <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }}
                  style={{ fontSize: '0.62rem', padding: '0.14rem 0.5rem', borderRadius: 99, background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.38)', color: '#fbbf24', fontFamily: "'Outfit', sans-serif", fontWeight: 700, flexShrink: 0 }}>
                  ✦ Brahma
                </motion.span>
              )}
            </div>
          </div>}

          {/* ── Streak Board ─────────────────────────────────────────────── */}
          {(() => {
            const activeStreakEntries = Object.entries(engine.streaks).filter(([, s]) => s.currentStreak >= 1);
            return (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
                style={{ marginBottom: '0.85rem', padding: '0.6rem 0.75rem', borderRadius: 14, background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.42)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>🔥 Streaks</span>
                  <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.22)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.06em' }}>
                    {activeStreakEntries.length > 0 ? 'keep the fire alive' : '7d 🔥 · 14d ⭐ · 30d 🏆 · 100d 💎'}
                  </span>
                </div>
                {activeStreakEntries.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.15rem 0' }}>
                    <span style={{ fontSize: '1.35rem' }}>🌱</span>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.73rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif" }}>Complete practices daily to ignite your streak</p>
                      <p style={{ margin: '0.1rem 0 0', fontSize: '0.58rem', color: 'rgba(255,255,255,0.22)', fontFamily: "'Outfit', sans-serif" }}>Every streak starts with a single day — begin today ✨</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.38rem', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
                    {activeStreakEntries
                      .sort(([, a], [, b]) => b.currentStreak - a.currentStreak)
                      .slice(0, 7)
                      .map(([habitId, streakData]) => {
                        const habit = engine.activeHabits.find(h => h.id === habitId);
                        if (!habit) return null;
                        const s = streakData.currentStreak;
                        const longest = streakData.longestStreak;
                        const sColor = s >= 30 ? '#f97316' : s >= 14 ? '#a78bfa' : s >= 7 ? '#fbbf24' : '#fb923c';
                        const trophy = s >= 100 ? '💎' : s >= 30 ? '🏆' : s >= 14 ? '⭐' : s >= 7 ? '✦' : null;
                        return (
                          <motion.div key={habitId} whileTap={{ scale: 0.92 }}
                            style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '0.38rem 0.55rem', borderRadius: 12, background: `radial-gradient(circle at 50% 20%, ${sColor}18, rgba(0,0,0,0.35))`, border: `1px solid ${sColor}30`, minWidth: 48, boxShadow: `0 2px 12px ${sColor}14` }}>
                            <span style={{ fontSize: '1rem' }}>{habit.icon}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <span style={{ fontSize: '0.62rem' }}>🔥</span>
                              <span style={{ fontSize: '0.82rem', fontWeight: 900, color: sColor, fontFamily: "'Outfit', sans-serif" }}>{s}</span>
                              {trophy && <span style={{ fontSize: '0.6rem', marginLeft: 1 }}>{trophy}</span>}
                            </div>
                            {s >= 7 && <span style={{ fontSize: '0.38rem', padding: '0.05rem 0.25rem', borderRadius: 99, background: `${sColor}20`, color: sColor, fontFamily: "'Outfit', sans-serif", fontWeight: 800, letterSpacing: '0.06em' }}>{s >= 30 ? '30d' : s >= 14 ? '14d' : '7d'}</span>}
                            {s < longest && <span style={{ fontSize: '0.35rem', color: 'rgba(255,255,255,0.2)', fontFamily: "'Outfit', sans-serif" }}>best {longest}</span>}
                          </motion.div>
                        );
                      })}
                  </div>
                )}
              </motion.div>
            );
          })()}


          {/* ── ONESUTRA 2.0 Widget Strip ─────────────────────────────────── */}

          <SutraOfDay compact />

          <DigitalMala compact />

          {/* ── SECTION 2 : Daily Intention ───────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            style={{ padding: '0.82rem 1rem', borderRadius: 14, marginBottom: '1rem', background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(251,191,36,0.28)', borderLeft: '3px solid rgba(251,191,36,0.72)', backdropFilter: 'blur(12px)' }}>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(255,255,255,0.68)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.6, fontStyle: 'italic' }}>
              &ldquo;{DAILY_INTENTIONS[intentionIdx]}&rdquo;
            </p>
          </motion.div>

          {/* ── SECTION 3 : Quick Links — Floating bubble orbs ──────────── */}
          <div style={{ display: 'flex', gap: '0.65rem', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '0.35rem', marginBottom: '1rem', paddingTop: '0.15rem' }}>
            {([
              { href: '/lifestyle/dosha-compass', label: 'Dosha', color: '#fbbf24', emoji: '🧭' },
              { href: '/lifestyle/panchakosha', label: 'Koshas', color: '#c084fc', emoji: '🪷' },
              { href: '/lifestyle/ahar', label: 'Āhāra', color: '#4ade80', emoji: '🌿' },
              { href: '/pranayama', label: 'Breathe', color: '#22d3ee', emoji: '🌬️' },
              { href: '/dhyan-kshetra', label: 'Meditate', color: '#a78bfa', emoji: '🧘' },
              { href: '/journal', label: 'Journal', color: '#34d399', emoji: '📓' },
              { href: '/bodhi-chat', label: 'Bodhi', color: '#fb923c', emoji: '✨' },
              { href: '/sadhana', label: 'Mantras', color: '#e879f9', emoji: '🕉️' },
            ] as { href: string; label: string; color: string; emoji: string }[]).map((link, i) => (
              <motion.div key={link.href}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 26 }}
                whileTap={{ scale: 0.86 }}
                onClick={() => router.push(link.href)}
                style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                <motion.div
                  animate={{
                    y: [0, -5, 0],
                    boxShadow: [
                      `0 0 0 1px ${link.color}28, 0 4px 18px rgba(0,0,0,0.4)`,
                      `0 0 0 1px ${link.color}55, 0 8px 26px ${link.color}30`,
                      `0 0 0 1px ${link.color}28, 0 4px 18px rgba(0,0,0,0.4)`,
                    ],
                  }}
                  transition={{ duration: 3.8 + i * 0.55, repeat: Infinity, ease: 'easeInOut', delay: i * 0.38 }}
                  style={{
                    width: 62, height: 62, borderRadius: '50%',
                    background: `radial-gradient(circle at 36% 28%, ${link.color}28 0%, rgba(4,2,18,0.55) 75%)`,
                    border: `1.5px solid ${link.color}42`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.65rem', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                  }}>
                  {link.emoji}
                </motion.div>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.68)', textAlign: 'center', fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap', letterSpacing: '0.03em', filter: `drop-shadow(0 0 4px ${link.color}55)` }}>{link.label}</span>
              </motion.div>
            ))}
          </div>


          {/* ── SECTION 5 : Ayurveda Grid ─────────────────────────────────── */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.55rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>🌿 Ayurveda</span>
              {prakriti && (
                <span style={{ fontSize: '0.68rem', padding: '0.18rem 0.58rem', borderRadius: 99, background: `${doshaColor}18`, border: `1px solid ${doshaColor}35`, color: doshaColor, fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                  {prakriti.combo.toUpperCase()}
                </span>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.52rem' }}>
              {([
                {
                  href: '/lifestyle/prakriti', color: '#a78bfa', label: doshaOnboardingComplete ? 'Prakriti' : 'Discover Prakriti', desc: doshaOnboardingComplete && prakriti ? `${prakriti.combo.toUpperCase()}` : 'Know your nature',
                  svg: (<svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M16 4C16 4 8 8 8 16C8 22 11.5 26 16 28C20.5 26 24 22 24 16C24 8 16 4 16 4Z" fill="#a78bfa" fillOpacity="0.18" stroke="#a78bfa" strokeWidth="1.4" strokeLinejoin="round" /><path d="M16 10C16 10 12 13 12 17C12 20 13.8 22 16 23C18.2 22 20 20 20 17C20 13 16 10 16 10Z" fill="#a78bfa" fillOpacity="0.35" /><circle cx="16" cy="17" r="2.5" fill="#a78bfa" fillOpacity="0.85" /></svg>)
                },
                {
                  href: '/lifestyle/dosha-compass', color: '#fbbf24', label: 'Dosha Compass', desc: doshaOnboardingComplete && prakriti ? `${prakriti.primary?.toUpperCase()} dominant` : 'Your tri-dosha map',
                  svg: (<svg width="28" height="28" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="12" fill="#fbbf2410" stroke="#fbbf24" strokeWidth="1.4" /><circle cx="16" cy="16" r="6" fill="#fbbf2418" /><text x="16" y="21" textAnchor="middle" fontSize="11" fill="#fbbf24" fontFamily="serif">ॐ</text><line x1="16" y1="4" x2="16" y2="8" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" /><line x1="16" y1="24" x2="16" y2="28" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.5" /><line x1="4" y1="16" x2="8" y2="16" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.5" /><line x1="24" y1="16" x2="28" y2="16" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.5" /></svg>)
                },
                {
                  href: '/lifestyle/panchakosha', color: '#c084fc', label: 'Panchakosha', desc: '5-layer wellness hub',
                  svg: (<svg width="28" height="28" viewBox="0 0 32 32" fill="none"><ellipse cx="16" cy="16" rx="13" ry="6" fill="none" stroke="#c084fc" strokeWidth="1" strokeOpacity="0.9" /><ellipse cx="16" cy="16" rx="10" ry="4.5" fill="none" stroke="#c084fc" strokeWidth="1" strokeOpacity="0.7" /><ellipse cx="16" cy="16" rx="7" ry="3" fill="none" stroke="#c084fc" strokeWidth="1" strokeOpacity="0.55" /><ellipse cx="16" cy="16" rx="4.5" ry="2" fill="none" stroke="#c084fc" strokeWidth="1" strokeOpacity="0.4" /><circle cx="16" cy="16" r="2" fill="#c084fc" fillOpacity="0.8" /></svg>)
                },
                {
                  href: '/lifestyle/ahar', color: '#4ade80', label: 'Āhāra Vigyan', desc: '6-Rasa food science',
                  svg: (<svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M16 4L19 12H28L21 17L24 26L16 21L8 26L11 17L4 12H13L16 4Z" fill="#4ade80" fillOpacity="0.15" stroke="#4ade80" strokeWidth="1.2" strokeLinejoin="round" /><circle cx="16" cy="16" r="4" fill="#4ade80" fillOpacity="0.5" /></svg>)
                },
                {
                  href: '/lifestyle/dinacharya', color: '#fbbf24', label: 'Dinacharya', desc: currentPhase.label,
                  svg: (<svg width="28" height="28" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="11" stroke="#fbbf24" strokeWidth="1.5" fill="#fbbf24" fillOpacity="0.07" /><path d="M16 8v8l5 3" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />{[0, 60, 120, 180, 240, 300].map((d, i) => (<line key={i} x1={16 + 9.5 * Math.cos((d - 90) * Math.PI / 180)} y1={16 + 9.5 * Math.sin((d - 90) * Math.PI / 180)} x2={16 + 11 * Math.cos((d - 90) * Math.PI / 180)} y2={16 + 11 * Math.sin((d - 90) * Math.PI / 180)} stroke="#fbbf24" strokeWidth={i % 3 === 0 ? 1.8 : 1} strokeOpacity={i % 3 === 0 ? 0.9 : 0.5} strokeLinecap="round" />))}</svg>)
                },
                {
                  href: '/lifestyle/bodhi-ayurveda', color: '#fb923c', label: 'Bodhi Vaidya', desc: 'Ayurvedic wisdom',
                  svg: (<svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M16 3L18.2 10.3H26L19.9 14.6L22.1 21.9L16 17.6L9.9 21.9L12.1 14.6L6 10.3H13.8L16 3Z" fill="#fb923c" fillOpacity="0.85" stroke="#fb923c" strokeWidth="0.8" strokeLinejoin="round" /><circle cx="16" cy="13.5" r="2.8" fill="#fff" fillOpacity="0.5" /></svg>)
                },
                {
                  href: '/lifestyle/ayurvedic-habits', color: '#4ade80', label: 'Niyama', desc: 'Dosha practices',
                  svg: (<svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M16 6C16 6 6 10 6 19C6 24 10 28 16 28C22 28 26 24 26 19C26 10 16 6 16 6Z" fill="#4ade80" fillOpacity="0.12" stroke="#4ade80" strokeWidth="1.4" strokeLinejoin="round" /><path d="M16 12C16 12 11 15 11 19C11 22 13 24 16 24C19 24 21 22 21 19C21 15 16 12 16 12Z" fill="#4ade80" fillOpacity="0.3" /><circle cx="16" cy="19" r="2.2" fill="#4ade80" fillOpacity="0.9" /></svg>)
                },
                {
                  href: '/pranayama', color: '#22d3ee', label: 'Pranayama', desc: 'Breath & vital energy',
                  svg: (<svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M6 16C6 16 10 10 16 10C22 10 26 16 26 16C26 16 22 22 16 22C10 22 6 16 6 16Z" fill="#22d3ee" fillOpacity="0.12" stroke="#22d3ee" strokeWidth="1.4" strokeLinejoin="round" /><circle cx="16" cy="16" r="4" fill="#22d3ee" fillOpacity="0.4" /><circle cx="16" cy="16" r="1.8" fill="#22d3ee" fillOpacity="0.9" /><path d="M16 4V9M16 23V28" stroke="#22d3ee" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.5" /></svg>)
                },

              ] as { href: string; color: string; label: string; desc: string; svg: React.ReactNode }[]).map(link => (
                <motion.button key={link.label} whileTap={{ scale: 0.95 }} onClick={() => router.push(link.href)}
                  style={{ padding: '0.88rem 0.92rem', borderRadius: 16, cursor: 'pointer', textAlign: 'left', background: 'rgba(0,0,0,0.25)', border: `1px solid ${link.color}40`, backdropFilter: 'blur(12px)', boxShadow: `0 4px 20px ${link.color}18` }}>
                  <div style={{ marginBottom: 6 }}>{link.svg}</div>
                  <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: link.color, fontFamily: "'Outfit', sans-serif" }}>{link.label}</p>
                  <p style={{ margin: 0, fontSize: '0.67rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>{link.desc}</p>
                </motion.button>
              ))}

              {/* Guna Tracker — full width button inside Ayurveda section */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { setActiveGunaTab('guna'); setShowGunaTracker(true); }}
                style={{ gridColumn: '1 / -1', padding: '0.88rem 0.92rem', borderRadius: 16, cursor: 'pointer', textAlign: 'left', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(251,191,36,0.4)', backdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', gap: '0.85rem' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="16" r="12" fill="rgba(251,191,36,0.1)" stroke="rgba(251,191,36,0.5)" strokeWidth="1.4" />
                    <text x="16" y="21" textAnchor="middle" fontSize="13" fill="rgba(251,191,36,0.9)" fontFamily="serif">☯</text>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#fbbf24', fontFamily: "'Outfit', sans-serif" }}>Guna Tracker</p>
                  {(() => {
                    const gunaToday = (engine as any).gunaLogs?.find((l: { date: string }) => l.date === getToday());
                    return (
                      <p style={{ margin: 0, fontSize: '0.67rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>
                        {gunaToday ? `Sattva ${gunaToday.sattva} · Rajas ${gunaToday.rajas} · Tamas ${gunaToday.tamas}` : 'Map Sattva · Rajas · Tamas · Dosha Compass'}
                      </p>
                    );
                  })()}
                </div>
                <ChevronRight size={14} style={{ color: '#fbbf24', opacity: 0.55, flexShrink: 0 }} />
              </motion.button>
            </div>
          </div>

          {/* ── SECTION 6 : Live Insights ─────────────────────────────────── */}
          {insights.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: '0.45rem' }}>
                <TrendingUp size={14} style={{ color: 'rgba(255,255,255,0.55)' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>Live Insights</span>
              </div>
              {insights.map((ins, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  style={{ padding: '0.78rem 0.9rem', borderRadius: 13, marginBottom: '0.4rem', background: `${ins.color}12`, border: `1px solid ${ins.color}30`, borderLeft: `3px solid ${ins.color}75` }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.72)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}>
                    <span style={{ marginRight: 5 }}>{ins.icon}</span>{ins.text}
                  </p>
                  {ins.cta && ins.ctaHref && (
                    <button onClick={() => router.push(ins.ctaHref!)} style={{ background: 'none', border: 'none', color: ins.color, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', padding: '0.22rem 0 0', fontFamily: "'Outfit', sans-serif" }}>
                      {ins.cta}
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* ── SECTION 7 : Achievements ──────────────────────────────────── */}
          {engine.badges.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>Achievements</span>
              <div style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '0.2rem', marginTop: '0.45rem' }}>
                {engine.badges.slice(0, 6).map(b => (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '0.32rem', padding: '0.3rem 0.68rem', borderRadius: 999, background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.5)', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.95rem' }}>{b.icon}</span>
                    <span style={{ fontSize: '0.68rem', color: '#fbbf24', fontWeight: 700, fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap' }}>{b.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SECTION 8.5 : Inline Smart Planner ───────────────────────── */}
          <InlineSmartPlanner />

          {/* ── SECTION 9 : Bodhi CTA ─────────────────────────────────────── */}
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push('/bodhi-chat')}
            style={{ width: '100%', padding: '0.95rem 1rem', borderRadius: 18, cursor: 'pointer', textAlign: 'left', background: 'linear-gradient(135deg, rgba(139,92,246,0.22), rgba(251,191,36,0.1))', border: '1px solid rgba(139,92,246,0.35)', display: 'flex', alignItems: 'center', gap: '0.8rem', boxSizing: 'border-box', backdropFilter: 'blur(12px)', boxShadow: '0 4px 24px rgba(139,92,246,0.18)' }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, background: 'radial-gradient(circle at 35% 30%, rgba(251,191,36,0.38) 0%, rgba(139,92,246,0.3) 60%, transparent 100%)', border: '1px solid rgba(251,191,36,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem' }}>✦</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'rgba(255,255,255,0.9)', fontFamily: "'Outfit', sans-serif" }}>Talk to Bodhi</p>
              <p style={{ margin: 0, fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>Check in · Plan your day · Ask anything</p>
            </div>
            <MessageCircle size={17} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
          </motion.button>

        </div>{/* /content */}
      </div>{/* /nature card */}
    </div>
  );
}

// ─── Inline Smart Planner Component ─────────────────────────────────────────
function InlineSmartPlanner() {
  const router = useRouter();
  const { tasks } = useDailyTasks();
  const setPendingMessage = useBodhiChatStore(s => s.setPendingMessage);
  const [collapsed, setCollapsed] = useState(false);

  const pendingCount = tasks.filter(t => !t.done).length;
  const doneCount = tasks.filter(t => t.done).length;

  const BODHI_PROMPTS: Array<{
    label: string;
    emoji: string;
    color: string;
    border: string;
    glow: string;
    message: string;
  }> = [
      {
        label: 'Task',
        emoji: '✅',
        color: '#4ade80',
        border: 'rgba(74,222,128,0.35)',
        glow: 'rgba(74,222,128,0.18)',
        message: "I have a new task I want to plan. [UI_EVENT: NEW_TASK]",
      },
      {
        label: 'Idea',
        emoji: '💡',
        color: '#fbbf24',
        border: 'rgba(251,191,36,0.35)',
        glow: 'rgba(251,191,36,0.18)',
        message: "I have an idea I want to explore and develop. [UI_EVENT: NEW_IDEA]",
      },
      {
        label: 'Challenge',
        emoji: '⚡',
        color: '#fb923c',
        border: 'rgba(251,146,60,0.35)',
        glow: 'rgba(251,146,60,0.18)',
        message: "I have a challenge I want to work through with you. [UI_EVENT: NEW_CHALLENGE]",
      },
    ];

  const handleBodhiPrompt = (msg: string) => {
    setPendingMessage(msg);
    router.push('/bodhi-chat');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      style={{ marginBottom: '1rem', borderRadius: 18, background: 'rgba(0,0,0,0.24)', border: '1px solid rgba(167,139,250,0.22)', backdropFilter: 'blur(14px)', overflow: 'hidden' }}
    >
      {/* Header */}
      <motion.div
        whileTap={{ scale: 0.99 }}
        onClick={() => setCollapsed(s => !s)}
        style={{ width: '100%', padding: '0.72rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.06)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Target size={14} style={{ color: '#a78bfa' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.06em', textTransform: 'uppercase' }}>Smart Planner</span>
          {pendingCount > 0 && (
            <span style={{ fontSize: '0.5rem', padding: '0.06rem 0.32rem', borderRadius: 99, background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.4)', color: '#c084fc', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
              {pendingCount} active
            </span>
          )}
          {doneCount > 0 && (
            <span style={{ fontSize: '0.5rem', padding: '0.06rem 0.32rem', borderRadius: 99, background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
              ✓ {doneCount} done
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={e => { e.stopPropagation(); router.push('/vedic-planner'); }}
            style={{ padding: '0.18rem 0.55rem', borderRadius: 99, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', color: '#c084fc', fontSize: '0.58rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap' }}
          >
            Full Planner →
          </motion.button>
          <ChevronDown size={13} style={{ color: 'rgba(255,255,255,0.35)', transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.22s', flexShrink: 0 }} />
        </div>
      </motion.div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0.85rem 0.9rem 1rem' }}>
              {/* Header text */}
              <p style={{ margin: '0 0 0.7rem', fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", fontStyle: 'italic', letterSpacing: '0.02em' }}>
                Talk to Bodhi — who will save it for you
              </p>

              {/* Elegant 3-button row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                {BODHI_PROMPTS.map((prompt) => (
                  <motion.button
                    key={prompt.label}
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => handleBodhiPrompt(prompt.message)}
                    style={{
                      position: 'relative', overflow: 'hidden',
                      padding: '0.75rem 0.5rem',
                      borderRadius: 14,
                      background: `radial-gradient(circle at 50% 20%, ${prompt.glow}, rgba(0,0,0,0.35) 70%)`,
                      border: `1px solid ${prompt.border}`,
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.28rem',
                      boxShadow: `0 4px 20px ${prompt.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    {/* Subtle top glow bar */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                      background: `linear-gradient(90deg, transparent, ${prompt.color}80, transparent)`,
                      borderRadius: '14px 14px 0 0',
                    }} />
                    <span style={{ fontSize: '1.3rem', filter: `drop-shadow(0 0 8px ${prompt.color}80)` }}>
                      {prompt.emoji}
                    </span>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 800, color: prompt.color,
                      fontFamily: "'Outfit', sans-serif", letterSpacing: '0.06em',
                      textShadow: `0 0 10px ${prompt.color}60`,
                    }}>
                      {prompt.label}
                    </span>
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


