'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, Circle, ChevronDown, ChevronRight, Sparkles,
  ArrowLeft, RefreshCw, Info, Sun, Moon, Wind, Flame, Leaf,
} from 'lucide-react';
import { useDoshaEngine } from '@/hooks/useDoshaEngine';
import {
  DOSHA_INFO, getCurrentDoshaPhase,
  type Dosha, type DoshaPhase, type RitucharayaSeason,
} from '@/lib/doshaService';
import { useDoshaStore } from '@/stores/doshaStore';

// ─── Dinacharya Ritual Types ──────────────────────────────────────────────────

interface DinacharyaRitual {
  id: string;
  name: string;
  nameHi?: string;
  emoji: string;
  phase: DoshaPhase;
  doshaFocus: Dosha;
  durationMin: number;
  description: string;
  doshaVariants?: Partial<Record<Dosha, string>>;
  tags: string[];
  isBrahmaMuhurta?: boolean;
}

// ─── Full Ritual Library ───────────────────────────────────────────────────────

const ALL_RITUALS: DinacharyaRitual[] = [
  // Brahma Muhurta (2–6 AM)
  {
    id: 'bm_rise',
    name: 'Sacred Rising',
    nameHi: 'उत्थान',
    emoji: '🌟',
    phase: 'brahma-muhurta',
    doshaFocus: 'vata',
    durationMin: 2,
    description: 'Upon waking, observe your hands — Ayurveda prescribes this as the first act. See Lakshmi, Saraswati, and Govinda in your palms. Set your Sankalpa (intention) for the day.',
    doshaVariants: {
      vata: 'Rise gently by 5 AM — the softer end of Brahma Muhurta. Wrap yourself in warmth.',
      pitta: 'Rise by 4:30 AM. The pre-dawn stillness quiets your overactive mind before the world stimulates it.',
      kapha: 'Rise by 3:30–4 AM. This is your single most powerful practice — breaking the Kapha heaviness at its root.',
    },
    tags: ['morning', 'spiritual', 'intention'],
    isBrahmaMuhurta: true,
  },
  {
    id: 'bm_warm_water',
    name: 'Warm Water Ritual',
    nameHi: 'उष्ण जल',
    emoji: '🫗',
    phase: 'brahma-muhurta',
    doshaFocus: 'vata',
    durationMin: 3,
    description: 'Drink warm water upon waking — never cold. This awakens Agni gently and begins the morning cleansing.',
    doshaVariants: {
      vata: 'Plain warm water with a pinch of ginger — grounding and digestive.',
      pitta: 'Warm water with a few rose petals or coriander seeds — cooling and calming.',
      kapha: 'Warm water with fresh ginger and lemon — stimulating and Agni-kindling.',
    },
    tags: ['hydration', 'agni', 'cleansing'],
    isBrahmaMuhurta: true,
  },
  {
    id: 'bm_tongue',
    name: 'Tongue Observation',
    nameHi: 'जिह्वा निरीक्षण',
    emoji: '👅',
    phase: 'brahma-muhurta',
    doshaFocus: 'kapha',
    durationMin: 1,
    description: 'Observe your tongue in a mirror. White coating = Ama (toxins). Pink and clean = strong Agni. This is your daily health diagnostic.',
    tags: ['ama', 'agni', 'self-diagnosis'],
    isBrahmaMuhurta: true,
  },
  {
    id: 'bm_tongue_scraping',
    name: 'Tongue Scraping',
    nameHi: 'जिह्वा निर्लेखन',
    emoji: '🪥',
    phase: 'brahma-muhurta',
    doshaFocus: 'kapha',
    durationMin: 2,
    description: 'Use a copper or stainless scraper — 7 to 14 strokes. Removes Ama accumulated overnight, stimulates organ reflexes, improves taste and digestion.',
    tags: ['oral-care', 'ama', 'cleansing'],
    isBrahmaMuhurta: true,
  },
  {
    id: 'bm_meditation',
    name: 'Silent Meditation',
    nameHi: 'ध्यान',
    emoji: '🧘',
    phase: 'brahma-muhurta',
    doshaFocus: 'vata',
    durationMin: 15,
    description: 'The Brahma Muhurta is the most sattvic time for meditation — the mind is at its clearest, the environment at its purest. 15–20 minutes here is worth an hour at any other time.',
    doshaVariants: {
      vata: 'Warming visualization — golden light filling the body. Grounding, stabilizing imagery.',
      pitta: 'Cooling compassion meditation — moonlight, flowing water, open sky.',
      kapha: 'Energizing visualization — sunrise, peaks, activating breath imagery.',
    },
    tags: ['meditation', 'sattva', 'brahma-muhurta'],
    isBrahmaMuhurta: true,
  },
  {
    id: 'bm_pranayama',
    name: 'Pranayama',
    nameHi: 'प्राणायाम',
    emoji: '🌬️',
    phase: 'brahma-muhurta',
    doshaFocus: 'vata',
    durationMin: 10,
    description: 'Breath practice aligned with your dosha imbalance — the most direct tool for shifting energy.',
    doshaVariants: {
      vata: 'Anulom Vilom (alternate nostril) — calming, grounding, nervous system balancing. 10 min.',
      pitta: 'Shitali / Sheetkari (cooling breath through rolled tongue or teeth) — releases heat. 10 min.',
      kapha: 'Bhastrika / Kapalabhati (bellows breath) — stimulating, clearing, warming. 10 min.',
    },
    tags: ['pranayama', 'breath', 'dosha-specific'],
    isBrahmaMuhurta: true,
  },
  {
    id: 'bm_sankalpa',
    name: 'Sankalpa (Daily Intention)',
    nameHi: 'संकल्प',
    emoji: '📿',
    phase: 'brahma-muhurta',
    doshaFocus: 'vata',
    durationMin: 5,
    description: 'Set a clear, simple intention for the day — your Sankalpa. Write it in your journal or hold it in your heart during the first moments of waking.',
    tags: ['intention', 'journaling', 'sattva'],
    isBrahmaMuhurta: true,
  },

  // Kapha Morning (6–10 AM)
  {
    id: 'km_abhyanga',
    name: 'Abhyanga (Self-Oil Massage)',
    nameHi: 'अभ्यङ्ग',
    emoji: '🫙',
    phase: 'kapha-morning',
    doshaFocus: 'vata',
    durationMin: 15,
    description: 'Self-oil massage — one of Ayurveda\'s most powerful daily practices. Improves circulation, calms the nervous system, nourishes skin and joints.',
    doshaVariants: {
      vata: 'Warm sesame oil. Slow, loving strokes toward the heart. Daily. This is non-negotiable for Vata.',
      pitta: 'Coconut or sunflower oil. Moderate pace. 4x/week. Cooling and calming.',
      kapha: 'Warm mustard or sesame oil. Vigorous, brisk strokes. 2–3x/week. Stimulating.',
    },
    tags: ['abhyanga', 'self-care', 'vata'],
  },
  {
    id: 'km_yoga',
    name: 'Yoga / Movement',
    nameHi: 'व्यायाम',
    emoji: '🌸',
    phase: 'kapha-morning',
    doshaFocus: 'kapha',
    durationMin: 25,
    description: 'Movement during Kapha time clears the morning heaviness. Kapha time (6–10 AM) is the ideal exercise window for all doshas.',
    doshaVariants: {
      vata: 'Slow, grounding asanas. Gentle Sun Salutation. Avoid jumping or rushing. Warmth is key.',
      pitta: 'Cooling, non-competitive flows. Moon Salutation. Never bikram or hot yoga.',
      kapha: 'Vigorous, fast-paced. Dynamic Sun Salutations, standing poses, jogging. Kapha must sweat.',
    },
    tags: ['yoga', 'movement', 'exercise'],
  },
  {
    id: 'km_sunrise',
    name: 'Sunrise Awareness',
    nameHi: 'सूर्योदय दर्शन',
    emoji: '🌅',
    phase: 'kapha-morning',
    doshaFocus: 'pitta',
    durationMin: 3,
    description: 'Observe natural light within the first hour after waking. This synchronises your circadian rhythm with the natural cycle — the foundation of Dinacharya.',
    tags: ['circadian', 'nature', 'light'],
  },
  {
    id: 'km_breakfast',
    name: 'Dosha-Wise Breakfast',
    nameHi: 'प्रातः भोजन',
    emoji: '🥣',
    phase: 'kapha-morning',
    doshaFocus: 'vata',
    durationMin: 20,
    description: 'Eat breakfast mindfully — sitting, calm, no screens. Match your breakfast to your dosha for optimal Agni.',
    doshaVariants: {
      vata: 'Warm, oily, sweet. Spiced oatmeal, warm milk with dates, cooked fruit. Never cold or raw.',
      pitta: 'Cooling, moderate. Fresh fruits, mild porridge, coconut water. No spicy or sour.',
      kapha: 'Light, warm, spiced. Small portion, ginger tea, seasonal fruit. Avoid heavy dairy.',
    },
    tags: ['ahara', 'breakfast', 'agni'],
  },

  // Pitta Midday (10 AM – 2 PM)
  {
    id: 'pm_main_meal',
    name: 'Main Meal (Madhyahna Bhojana)',
    nameHi: 'मध्याह्न भोजन',
    emoji: '🍛',
    phase: 'pitta-midday',
    doshaFocus: 'pitta',
    durationMin: 30,
    description: 'Your Agni is strongest between 12–1 PM. This is when you must eat your largest, most nourishing meal of the day. Never skip this.',
    doshaVariants: {
      vata: 'Warm, well-cooked, grounding. Dal, rice with ghee, root vegetables. Eat slowly.',
      pitta: 'Balanced, cooling-to-moderate. Fresh sabzi, moderate spice, no excess sour or pungent.',
      kapha: 'Light and well-spiced. Smaller portion than you want. Avoid excess oil, rice, and sweet.',
    },
    tags: ['ahara', 'agni', 'main-meal'],
  },
  {
    id: 'pm_walk',
    name: 'Post-Meal Walk (Shatapavali)',
    nameHi: 'शतपावली',
    emoji: '🚶',
    phase: 'pitta-midday',
    doshaFocus: 'kapha',
    durationMin: 10,
    description: '100 steps after the main meal — a cornerstone Ayurvedic practice. Not a brisk walk — a gentle, mindful stroll that aids digestion without straining.',
    tags: ['digestion', 'movement', 'post-meal'],
  },
  {
    id: 'pm_deep_work',
    name: 'Deep Work / Focus Block',
    nameHi: 'एकाग्रता',
    emoji: '🎯',
    phase: 'pitta-midday',
    doshaFocus: 'pitta',
    durationMin: 90,
    description: 'Pitta time is peak cognitive performance. Use this window for your most demanding intellectual work, decisions, and creative output.',
    tags: ['focus', 'productivity', 'pitta'],
  },

  // Vata Afternoon (2–6 PM)
  {
    id: 'va_herbal_tea',
    name: 'Herbal Tea Ritual',
    nameHi: 'औषधीय चाय',
    emoji: '🍵',
    phase: 'vata-afternoon',
    doshaFocus: 'vata',
    durationMin: 5,
    description: 'A cup of dosha-appropriate herbal tea bridges digestion and the afternoon creative window.',
    doshaVariants: {
      vata: 'CCF tea (Cumin-Coriander-Fennel) or ginger tea — warming and digestive.',
      pitta: 'Mint, coriander, or rose tea — cooling and calming.',
      kapha: 'Ginger-tulsi tea — stimulating and energising.',
    },
    tags: ['herbs', 'digestion', 'ritual'],
  },
  {
    id: 'va_creative_work',
    name: 'Creative / Communication Work',
    nameHi: 'सृजन',
    emoji: '✍️',
    phase: 'vata-afternoon',
    doshaFocus: 'vata',
    durationMin: 60,
    description: 'Vata time is airy, communicative, and creative. Best for writing, brainstorming, calls, creative projects — not for heavy decisions.',
    tags: ['creativity', 'vata', 'communication'],
  },
  {
    id: 'va_afternoon_walk',
    name: 'Mindful Afternoon Walk',
    nameHi: 'सन्ध्या भ्रमण',
    emoji: '🌿',
    phase: 'vata-afternoon',
    doshaFocus: 'vata',
    durationMin: 15,
    description: 'A light walk in nature or barefoot on grass during the afternoon grounds the Vata energy and aids the transition to evening.',
    tags: ['movement', 'grounding', 'nature'],
  },

  // Kapha Evening (6–10 PM)
  {
    id: 'ke_light_dinner',
    name: 'Light Dinner (Sayam Bhojana)',
    nameHi: 'सायं भोजन',
    emoji: '🥣',
    phase: 'kapha-evening',
    doshaFocus: 'kapha',
    durationMin: 25,
    description: 'Your lightest meal of the day. Eaten by 7 PM — ideally by 6:30 PM for Kapha types. Let your body rest, not digest, all night.',
    doshaVariants: {
      vata: 'Warm, soupy, easy to digest. Khichdi (rice + dal) is ideal. Small serving of warm milk after.',
      pitta: 'Cooling, light. Vegetable soup, light dal. No excess sour or spice.',
      kapha: 'Very light. Warm soup or just khichdi. Very small portion. Done by 6:30 PM.',
    },
    tags: ['ahara', 'dinner', 'light'],
  },
  {
    id: 'ke_evening_walk',
    name: 'Evening Walk',
    nameHi: 'संध्या भ्रमण',
    emoji: '🌙',
    phase: 'kapha-evening',
    doshaFocus: 'kapha',
    durationMin: 20,
    description: 'A gentle evening walk under the open sky — aids digestion of dinner and transitions the body toward rest.',
    tags: ['movement', 'digestion', 'evening'],
  },
  {
    id: 'ke_screen_off',
    name: 'Screens Off',
    nameHi: 'विराम',
    emoji: '📴',
    phase: 'kapha-evening',
    doshaFocus: 'vata',
    durationMin: 1,
    description: 'One hour before sleep, all screens off. Blue light disrupts melatonin and agitates Vata. This single habit transforms sleep quality.',
    tags: ['sleep', 'digital-detox', 'vata'],
  },
  {
    id: 'ke_journaling',
    name: 'Evening Journal',
    nameHi: 'दिनान्त लेखन',
    emoji: '📓',
    phase: 'kapha-evening',
    doshaFocus: 'vata',
    durationMin: 10,
    description: 'Evening reflection: What nourished me today? What depleted me? Three things I am grateful for. Write until the mind is clear.',
    tags: ['journaling', 'reflection', 'gratitude'],
  },
  {
    id: 'ke_padabhyanga',
    name: 'Padabhyanga (Foot Massage)',
    nameHi: 'पादाभ्यङ्ग',
    emoji: '🦶',
    phase: 'kapha-evening',
    doshaFocus: 'vata',
    durationMin: 8,
    description: 'Warm oil on the soles of the feet before sleep — one of the most powerful Vata-pacifying and sleep-inducing practices. Takes 5–10 minutes.',
    doshaVariants: {
      vata: 'Warm sesame oil — deeply grounding and calming.',
      pitta: 'Coconut oil — cooling and relaxing.',
      kapha: 'Warm mustard oil — stimulating circulation.',
    },
    tags: ['sleep', 'vata', 'self-care'],
  },
  {
    id: 'ke_sleep_drink',
    name: 'Sleep Ritual Drink',
    nameHi: 'निद्रा पेय',
    emoji: '🥛',
    phase: 'kapha-evening',
    doshaFocus: 'vata',
    durationMin: 5,
    description: 'A warm, calming drink before sleep that supports deep rest and Ojas building.',
    doshaVariants: {
      vata: 'Warm milk with ashwagandha, nutmeg, and cardamom — deeply nourishing.',
      pitta: 'Warm water or mild cooling herbal tea (fennel, rose, chamomile).',
      kapha: 'Warm ginger-tulsi tea — light and stimulating enough to not increase heaviness.',
    },
    tags: ['sleep', 'ojas', 'nidra'],
  },
  {
    id: 'ke_lights_out',
    name: 'Lights Out by 10 PM',
    nameHi: 'शयन',
    emoji: '😴',
    phase: 'kapha-evening',
    doshaFocus: 'pitta',
    durationMin: 0,
    description: 'The Pitta cleanse begins at 10 PM. The body\'s internal fire begins repairing the liver, tissues, and metabolism. Being awake disrupts Agni and depletes Ojas.',
    tags: ['sleep', 'pitta', 'ojas', 'nidra'],
  },
];

// ─── Phase Definitions ─────────────────────────────────────────────────────────

const PHASE_META: Record<DoshaPhase, {
  label: string;
  timeRange: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  tag: string;
  description: string;
}> = {
  'brahma-muhurta': {
    label: 'Brahma Muhurta',
    timeRange: '2 AM – 6 AM',
    color: '#fbbf24',
    bgColor: 'rgba(251,191,36,0.08)',
    borderColor: 'rgba(251,191,36,0.3)',
    icon: <Sparkles size={14} />,
    tag: 'Golden Hour',
    description: 'The most sattvic hours of the day — spiritually potent, mentally clear.',
  },
  'kapha-morning': {
    label: 'Kapha Morning',
    timeRange: '6 AM – 10 AM',
    color: '#4ade80',
    bgColor: 'rgba(74,222,128,0.06)',
    borderColor: 'rgba(74,222,128,0.2)',
    icon: <Leaf size={14} />,
    tag: 'Cleanse & Move',
    description: 'Ground the Kapha heaviness through movement and morning cleansing.',
  },
  'pitta-midday': {
    label: 'Pitta Midday',
    timeRange: '10 AM – 2 PM',
    color: '#fb923c',
    bgColor: 'rgba(251,146,60,0.07)',
    borderColor: 'rgba(251,146,60,0.22)',
    icon: <Flame size={14} />,
    tag: 'Fire & Focus',
    description: 'Peak Agni — eat your main meal, do your deepest work.',
  },
  'vata-afternoon': {
    label: 'Vata Afternoon',
    timeRange: '2 PM – 6 PM',
    color: '#a78bfa',
    bgColor: 'rgba(167,139,250,0.07)',
    borderColor: 'rgba(167,139,250,0.2)',
    icon: <Wind size={14} />,
    tag: 'Create & Connect',
    description: 'Airy creative energy — ideal for communication, art, and gentle movement.',
  },
  'kapha-evening': {
    label: 'Kapha Evening',
    timeRange: '6 PM – 10 PM',
    color: '#34d399',
    bgColor: 'rgba(52,211,153,0.06)',
    borderColor: 'rgba(52,211,153,0.18)',
    icon: <Moon size={14} />,
    tag: 'Wind Down',
    description: 'Ground into stillness — light dinner, gentle practices, and sacred sleep.',
  },
  'pitta-night': {
    label: 'Pitta Night',
    timeRange: '10 PM – 2 AM',
    color: '#f97316',
    bgColor: 'rgba(249,115,22,0.06)',
    borderColor: 'rgba(249,115,22,0.18)',
    icon: <Moon size={14} />,
    tag: 'Deep Repair',
    description: 'Internal Pitta fire — the body heals. Be asleep.',
  },
};

const PHASE_ORDER: DoshaPhase[] = [
  'brahma-muhurta', 'kapha-morning', 'pitta-midday', 'vata-afternoon', 'kapha-evening', 'pitta-night',
];

// ─── Local Storage for daily check-offs ───────────────────────────────────────

const DINACHARYA_LOG_KEY = 'onesutra_dinacharya_log_v1';

function getDinacharyaLog(): Record<string, Record<string, boolean>> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(DINACHARYA_LOG_KEY) ?? '{}');
  } catch { return {}; }
}

function saveDinacharyaLog(log: Record<string, Record<string, boolean>>) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(DINACHARYA_LOG_KEY, JSON.stringify(log)); } catch { /* ignore */ }
}

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Ritual Row ────────────────────────────────────────────────────────────────

function RitualRow({ ritual, isCompleted, phaseColor, prakritiDosha, onToggle }: {
  ritual: DinacharyaRitual;
  isCompleted: boolean;
  phaseColor: string;
  prakritiDosha: Dosha | null;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const variantText = prakritiDosha && ritual.doshaVariants?.[prakritiDosha];

  return (
    <motion.div layout style={{ marginBottom: '0.45rem' }}>
      <motion.div
        onClick={onToggle}
        whileTap={{ scale: 0.98 }}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.8rem 0.9rem', borderRadius: 14,
          background: isCompleted
            ? `linear-gradient(120deg, ${phaseColor}15, rgba(255,255,255,0.03))`
            : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isCompleted ? phaseColor + '40' : 'rgba(255,255,255,0.08)'}`,
          cursor: 'pointer', transition: 'all 0.25s',
        }}
      >
        <motion.div style={{ flexShrink: 0 }}>
          {isCompleted ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
              <CheckCircle2 size={20} style={{ color: phaseColor }} />
            </motion.div>
          ) : (
            <Circle size={20} style={{ color: 'rgba(255,255,255,0.22)' }} />
          )}
        </motion.div>

        <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{ritual.emoji}</span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: isCompleted ? phaseColor : 'rgba(255,255,255,0.88)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.3 }}>
            {ritual.name}
            {ritual.nameHi && <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 400, marginLeft: '0.4rem', fontSize: '0.75rem' }}>{ritual.nameHi}</span>}
          </p>
          {ritual.durationMin > 0 && (
            <p style={{ margin: '0.1rem 0 0', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif' " }}>
              {ritual.durationMin} min
            </p>
          )}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(x => !x); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', padding: '2px', flexShrink: 0 }}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      </motion.div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ margin: '0.3rem 0 0 2.7rem', padding: '0.8rem', borderRadius: '0 0 12px 12px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${phaseColor}18`, borderTop: 'none' }}>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.62)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.6 }}>
                {ritual.description}
              </p>
              {variantText && (
                <div style={{ padding: '0.5rem 0.7rem', borderRadius: 8, background: `${phaseColor}12`, border: `1px solid ${phaseColor}30`, marginTop: '0.4rem' }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: phaseColor, fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}>
                    ✦ For your dosha: {variantText}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Phase Section ─────────────────────────────────────────────────────────────

function PhaseSection({ phase, rituals, completedIds, prakritiDosha, isCurrentPhase, onToggle }: {
  phase: DoshaPhase;
  rituals: DinacharyaRitual[];
  completedIds: Set<string>;
  prakritiDosha: Dosha | null;
  isCurrentPhase: boolean;
  onToggle: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const meta = PHASE_META[phase];
  const completedCount = rituals.filter(r => completedIds.has(r.id)).length;
  const phasePct = rituals.length > 0 ? Math.round((completedCount / rituals.length) * 100) : 0;

  return (
    <motion.div
      layout
      style={{
        marginBottom: '1rem', borderRadius: 18,
        border: `1px solid ${isCurrentPhase ? meta.borderColor : 'rgba(255,255,255,0.07)'}`,
        background: isCurrentPhase ? meta.bgColor : 'rgba(255,255,255,0.02)',
        overflow: 'hidden',
        boxShadow: isCurrentPhase ? `0 0 30px ${meta.color}10` : 'none',
      }}
    >
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          width: '100%', padding: '0.9rem 1rem', background: 'none', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.65rem',
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, flexShrink: 0, boxShadow: isCurrentPhase ? `0 0 8px ${meta.color}` : 'none' }} />
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: meta.color, fontFamily: "'Outfit', sans-serif" }}>{meta.label}</span>
            {isCurrentPhase && (
              <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem', borderRadius: 99, background: `${meta.color}25`, color: meta.color, fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                NOW
              </motion.span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>{meta.timeRange}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: completedCount === rituals.length && rituals.length > 0 ? meta.color : 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
            {completedCount}/{rituals.length}
          </span>
          {collapsed ? <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.25)' }} /> : <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.25)' }} />}
        </div>
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
            <div style={{ padding: '0 0.9rem 0.9rem' }}>
              <p style={{ margin: '0 0 0.8rem', fontSize: '0.73rem', color: 'rgba(255,255,255,0.38)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}>
                {meta.description}
              </p>
              {phasePct > 0 && phasePct < 100 && (
                <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, marginBottom: '0.7rem', overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${phasePct}%` }} transition={{ duration: 0.8 }}
                    style={{ height: '100%', borderRadius: 1, background: meta.color }} />
                </div>
              )}
              {rituals.map(r => (
                <RitualRow key={r.id} ritual={r} isCompleted={completedIds.has(r.id)} phaseColor={meta.color} prakritiDosha={prakritiDosha} onToggle={() => onToggle(r.id)} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Dosha Clock Widget ────────────────────────────────────────────────────────

function DoshaClockWidget({ currentPhase }: { currentPhase: DoshaPhase }) {
  const meta = PHASE_META[currentPhase];
  return (
    <div style={{ padding: '0.9rem 1rem', borderRadius: 16, background: meta.bgColor, border: `1px solid ${meta.borderColor}`, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${meta.color}20`, border: `1.5px solid ${meta.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color, flexShrink: 0 }}>
        {meta.icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: meta.color, fontFamily: "'Outfit', sans-serif" }}>{meta.label}</span>
          <span style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem', borderRadius: 99, background: `${meta.color}20`, color: meta.color, fontFamily: "'Outfit', sans-serif" }}>{meta.tag}</span>
        </div>
        <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.38)', fontFamily: "'Outfit', sans-serif" }}>{meta.timeRange} · {meta.description}</p>
      </div>
    </div>
  );
}

// ─── Seasonal Banner ───────────────────────────────────────────────────────────

function SeasonalBanner({ season }: { season: RitucharayaSeason }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const color = season.color;

  return (
    <motion.div
      layout
      style={{
        padding: '1rem', borderRadius: 20,
        background: season.gradient, border: `1px solid ${color}30`,
        marginBottom: '1.2rem', backdropFilter: 'blur(16px)',
        position: 'relative', overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: isExpanded ? '1rem' : '0' }}>
        <span style={{ fontSize: '2.2rem', flexShrink: 0 }}>{season.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>
              {season.name} <span style={{ color, fontSize: '0.85rem' }}>· {season.nameHi}</span>
            </p>
          </div>
          <p style={{ margin: '0.1rem 0 0', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif" }}>
            Seasonal Wisdom · {season.focus}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ background: 'none', border: 'none', color, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          {isExpanded ? 'Show Less' : 'Details'}
          <ChevronDown size={14} style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
        </motion.button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            {/* Qualities */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem', marginTop: '0.5rem' }}>
              {season.qualities.map((q: string) => (
                <span key={q} style={{ padding: '0.2rem 0.6rem', borderRadius: 99, fontSize: '0.62rem', background: `${color}15`, border: `1px solid ${color}30`, color, fontWeight: 700, letterSpacing: '0.02em' }}>
                  {q}
                </span>
              ))}
            </div>

            {/* Dosha Effect */}
            <div style={{ padding: '0.7rem 0.9rem', borderRadius: 12, background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '1rem' }}>
              <p style={{ margin: '0 0 4px', fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Energy Influence</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                {season.doshaEffect}
              </p>
            </div>

            {/* Foods & Lifestyle */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>🥗 Seasonal Foods</p>
                {season.foods.map((f: string) => (
                  <p key={f} style={{ margin: '0 0 4px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color, fontSize: '0.4rem' }}>●</span>{f}
                  </p>
                ))}
              </div>
              <div>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>🌿 Daily Practices</p>
                {season.lifestyle.map((l: string) => (
                  <p key={l} style={{ margin: '0 0 4px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color, fontSize: '0.4rem' }}>●</span>{l}
                  </p>
                ))}
              </div>
            </div>

            {/* Detox */}
            <div style={{ padding: '0.8rem 1rem', borderRadius: 14, background: `${color}12`, border: `1px solid ${color}35`, marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Sparkles size={12} style={{ color }} />
                <p style={{ margin: 0, fontSize: '0.62rem', color, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Seasonal Cleanse</p>
              </div>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.45 }}>
                {season.detox}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function DinacharyaPage() {
  const router = useRouter();
  const { prakriti, currentPhase, currentSeason, doshaOnboardingComplete } = useDoshaEngine();
  const store = useDoshaStore();

  const [completedIds, setCompletedIds] = useState<Record<string, boolean>>({});
  const today = getTodayKey();

  // Load today's log from localStorage
  useEffect(() => {
    const log = getDinacharyaLog();
    setCompletedIds(log[today] ?? {});
  }, [today]);

  const toggleRitual = useCallback((id: string) => {
    setCompletedIds(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      const allLogs = getDinacharyaLog();
      allLogs[today] = updated;
      saveDinacharyaLog(allLogs);

      // Update dosha store with today's log state
      const completedCount = Object.values(updated).filter(Boolean).length;
      store.updateDailyLog(today, { mealTiming: completedCount > 5 ? 80 : 50 });

      return updated;
    });
  }, [today, store]);

  const completedSet = useMemo(() => new Set(Object.keys(completedIds).filter(k => completedIds[k])), [completedIds]);

  const totalRituals = ALL_RITUALS.length;
  const completedCount = completedSet.size;
  const completionPct = Math.round((completedCount / totalRituals) * 100);

  const ritualsByPhase = useMemo(() => {
    return PHASE_ORDER.reduce((acc, phase) => {
      acc[phase] = ALL_RITUALS.filter(r => r.phase === phase);
      return acc;
    }, {} as Record<DoshaPhase, DinacharyaRitual[]>);
  }, []);

  if (!doshaOnboardingComplete) {
    return (
      <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #0a0a0f, #0f0a1a)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 3, repeat: Infinity }} style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🕉️</motion.div>
        <h2 style={{ margin: '0 0 0.8rem', fontSize: '1.4rem', fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>Discover Your Prakriti First</h2>
        <p style={{ margin: '0 0 2rem', fontSize: '0.88rem', color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.7, maxWidth: 320 }}>
          Your Dinacharya is personalised to your dosha constitution. Take the Prakriti assessment to unlock your custom daily routine.
        </p>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push('/lifestyle/prakriti')}
          style={{ padding: '0.9rem 2rem', borderRadius: 16, background: 'linear-gradient(135deg, rgba(124,58,237,0.5), rgba(168,85,247,0.4))', border: '1.5px solid rgba(167,139,250,0.4)', color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
          Begin Prakriti Discovery →
        </motion.button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #0a0a0f 0%, #0f0a1a 50%, #050d08 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.2rem 0.8rem', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 10, background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontFamily: "'Outfit', sans-serif", padding: '0.25rem' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>Dinacharya</p>
            <p style={{ margin: 0, fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', fontFamily: "'Outfit', sans-serif" }}>Daily Sacred Routine</p>
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: completionPct === 100 ? '#fbbf24' : 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif" }}>
            {completionPct}%
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.1rem 4rem' }}>

        {/* Dosha clock + prakriti badge */}
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.8rem', alignItems: 'center' }}>
          {prakriti && (
            <div style={{ padding: '0.3rem 0.7rem', borderRadius: 99, background: `${DOSHA_INFO[prakriti.primary].color}20`, border: `1px solid ${DOSHA_INFO[prakriti.primary].color}40`, display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
              <span style={{ fontSize: '0.85rem' }}>{DOSHA_INFO[prakriti.primary].emoji}</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: DOSHA_INFO[prakriti.primary].accentColor, fontFamily: "'Outfit', sans-serif" }}>{prakriti.combo.toUpperCase()}</span>
            </div>
          )}
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>
              {completedCount} of {totalRituals} rituals completed today
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden', marginBottom: '1rem' }}>
          <motion.div animate={{ width: `${completionPct}%` }} transition={{ duration: 0.8 }}
            style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #7c3aed, #fb923c, #4ade80)' }} />
        </div>

        {/* Dosha Clock */}
        <DoshaClockWidget currentPhase={currentPhase.phase} />

        {/* Seasonal Banner */}
        <SeasonalBanner season={currentSeason} />

        {/* Phase Sections */}
        {PHASE_ORDER.map(phase => (
          <PhaseSection
            key={phase}
            phase={phase}
            rituals={ritualsByPhase[phase] ?? []}
            completedIds={completedSet}
            prakritiDosha={prakriti?.primary ?? null}
            isCurrentPhase={currentPhase.phase === phase}
            onToggle={toggleRitual}
          />
        ))}

        {/* Completion celebration */}
        <AnimatePresence>
          {completionPct === 100 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ padding: '1.5rem', borderRadius: 20, background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(168,85,247,0.08))', border: '1px solid rgba(251,191,36,0.3)', textAlign: 'center', marginTop: '1rem' }}>
              <p style={{ margin: '0 0 0.4rem', fontSize: '2rem' }}>✦</p>
              <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24', fontFamily: "'Outfit', sans-serif" }}>Niyama Complete</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.6 }}>
                Every ritual observed. Your Ojas grows. Your Agni is bright.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Return to prakriti link */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button onClick={() => router.push('/lifestyle/prakriti')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.22)', fontSize: '0.72rem', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: '0.3rem', margin: '0 auto' }}>
            <RefreshCw size={11} /> Retake Prakriti Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
