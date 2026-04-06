'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, Circle, SkipForward, Plus,
  ChevronRight, TrendingUp, Zap, RotateCcw, Heart, MessageCircle,
} from 'lucide-react';
import { useLifestyleEngine } from '@/hooks/useLifestyleEngine';
import { useDoshaEngine } from '@/hooks/useDoshaEngine';
import { DOSHA_INFO } from '@/lib/doshaService';
import { getLevelFromXP, getNextLevel, getToday, type HabitItem } from '@/stores/lifestyleStore';
import { useBodhiChatStore } from '@/stores/bodhiChatStore';

// ─── Constants ──────────────────────────────────────────────────────────────
const LIFE_AREA_COLORS: Record<string, string> = {
  mental: '#22d3ee', physical: '#4ade80', social: '#fb923c',
  professional: '#fbbf24', financial: '#a78bfa', spiritual: '#c084fc',
  creative: '#f472b6', sacred: '#fde68a',
};

const MOOD_OPTIONS = [
  { value: 5, emoji: '🥥', label: 'Radiant', color: '#fbbf24' },
  { value: 4, emoji: '🍓', label: 'Good', color: '#4ade80' },
  { value: 3, emoji: '🥑', label: 'Okay', color: '#60a5fa' },
  { value: 2, emoji: '🫐', label: 'Low', color: '#a78bfa' },
  { value: 1, emoji: '🍋', label: 'Hard', color: '#f87171' },
];

const ENERGY_OPTIONS = [
  { value: 5, emoji: '⚡', label: 'Electric' },
  { value: 4, emoji: '☀️', label: 'High' },
  { value: 3, emoji: '🌤️', label: 'Medium' },
  { value: 2, emoji: '🌙', label: 'Low' },
  { value: 1, emoji: '💤', label: 'Drained' },
];

const QUICK_LINKS = [
  { href: '/pranayama', icon: '🌬️', label: 'Breathe', color: '#22d3ee' },
  { href: '/sadhana', icon: '🕉️', label: 'Energy Mantras', color: '#c084fc' },
  { href: '/dhyan-kshetra', icon: '🧘', label: 'Meditate', color: '#a78bfa' },
  { href: '/journal', icon: '📖', label: 'Journal', color: '#34d399' },
  { href: '/bodhi-chat', icon: '✦', label: 'Bodhi', color: '#fbbf24' },
  { href: '/pranaverse', icon: '📊', label: 'Insights', color: '#fb923c' },
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

const TIME_SLOT_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  morning: { emoji: '🌅', label: 'Morning', color: '#fbbf24' },
  midday: { emoji: '☀️', label: 'Afternoon', color: '#fb923c' },
  evening: { emoji: '🌆', label: 'Evening', color: '#a78bfa' },
  night: { emoji: '🌙', label: 'Night', color: '#60a5fa' },
  sacred: { emoji: '🔱', label: 'Sacred', color: '#c084fc' },
  anytime: { emoji: '✦', label: 'Anytime', color: '#4ade80' },
};

const DAILY_INTENTIONS = [
  'Let today be a gentle unfolding — one step, one breath, one moment at a time.',
  'Begin with stillness. Everything flows from here.',
  'Progress, not perfection. Presence, not pressure.',
  'Each completed practice is a gift to your future self.',
  'What you water, grows. Water what matters today.',
  'You hold within you the capacity for extraordinary transformation.',
];

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

// ─── Streak Flame ────────────────────────────────────────────────────────────
function StreakFlame({ count }: { count: number }) {
  if (count === 0) return null;
  const color = count >= 30 ? '#f97316' : count >= 7 ? '#fbbf24' : '#fb923c';
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.82rem', color, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
      <span style={{ fontSize: '1rem' }}>🔥</span>{count}
    </span>
  );
}

// ─── Habit Row ───────────────────────────────────────────────────────────────
function HabitRow({ habit, isCompleted, isSkipped, streak, isNow, onComplete, onSkip }: {
  habit: HabitItem; isCompleted: boolean; isSkipped: boolean; streak: number;
  isNow: boolean;
  onComplete: () => void; onSkip: () => void;
}) {
  const color = LIFE_AREA_COLORS[habit.lifeArea] ?? '#a78bfa';
  const timeConf = TIME_SLOT_CONFIG[habit.category ?? 'anytime'] ?? TIME_SLOT_CONFIG.anytime;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      whileTap={{ scale: !isCompleted && !isSkipped ? 0.96 : 1 }}
      onClick={() => { if (!isCompleted && !isSkipped) onComplete(); }}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.8rem',
        padding: '1rem 1.05rem', borderRadius: 18,
        background: isCompleted
          ? `linear-gradient(120deg, ${color}28, rgba(255,255,255,0.05))`
          : isNow
            ? 'linear-gradient(120deg, rgba(255,255,255,0.09), rgba(255,255,255,0.04))'
            : 'rgba(255,255,255,0.055)',
        border: `1px solid ${isCompleted ? color + '55' : isNow ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)'}`,
        boxShadow: isCompleted
          ? `0 2px 20px ${color}25, inset 0 1px 0 rgba(255,255,255,0.08)`
          : isNow
            ? '0 2px 16px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.06)'
            : '0 1px 6px rgba(0,0,0,0.15)',
        marginBottom: '0.5rem',
        opacity: isSkipped ? 0.35 : 1,
        cursor: isCompleted || isSkipped ? 'default' : 'pointer',
        transition: 'all 0.22s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {isNow && !isCompleted && !isSkipped && (
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', pointerEvents: 'none', zIndex: 0 }}
        />
      )}
      {isCompleted ? (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }} style={{ flexShrink: 0, zIndex: 1 }}>
          <CheckCircle2 size={26} style={{ color }} />
        </motion.div>
      ) : (
        <div style={{ flexShrink: 0, zIndex: 1, position: 'relative' }}>
          <Circle size={26} style={{ color: isNow ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)' }} />
          {isNow && !isSkipped && (
            <motion.div
              animate={{ scale: [1, 1.6, 1], opacity: [0.45, 0, 0.45] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.22)', pointerEvents: 'none' }}
            />
          )}
        </div>
      )}
      <span style={{ fontSize: '1.35rem', flexShrink: 0, zIndex: 1 }}>{habit.icon}</span>
      <div style={{ flex: 1, minWidth: 0, zIndex: 1 }}>
        <p style={{
          margin: 0, fontSize: '1.0rem', fontWeight: 700,
          fontFamily: "'Outfit', sans-serif",
          color: isCompleted ? color : 'rgba(255,255,255,0.9)',
          textDecoration: isSkipped ? 'line-through' : 'none',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{habit.name}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: 3 }}>
          <span style={{ fontSize: '0.63rem', padding: '0.1rem 0.42rem', borderRadius: 99, background: `${timeConf.color}16`, border: `1px solid ${timeConf.color}28`, color: timeConf.color, fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
            {timeConf.emoji} {timeConf.label}
          </span>
          {habit.scheduledTime && (
            <span style={{ fontSize: '0.63rem', color: 'rgba(255,255,255,0.28)', fontFamily: "'Outfit', sans-serif" }}>{habit.scheduledTime}</span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', zIndex: 1 }}>
        <StreakFlame count={streak} />
        {!isCompleted && !isSkipped && (
          <button
            onClick={e => { e.stopPropagation(); onSkip(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.16)', padding: '2px', flexShrink: 0 }}
          >
            <SkipForward size={15} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Mood Log Panel ──────────────────────────────────────────────────────────
function MoodLogPanel({ onClose, onLog }: {
  onClose: () => void;
  onLog: (mood: number, energy: number, tags: string[], note?: string) => void;
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
          background: 'linear-gradient(160deg, rgba(168,85,247,0.1), rgba(6,3,18,0.98))',
          border: '1px solid rgba(168,85,247,0.2)',
          borderRadius: '24px 24px 0 0',
          padding: '1.75rem 1.4rem 2.5rem',
        }}
      >
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
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function LifestylePanel() {
  const router = useRouter();
  const engine = useLifestyleEngine();
  const { prakriti, vikriti, currentPhase, doshaOnboardingComplete, inBrahmaMuhurta } = useDoshaEngine();
  const setPendingMessage = useBodhiChatStore(s => s.setPendingMessage);

  const [showMoodLog, setShowMoodLog] = useState(false);
  const [completedFlash, setCompletedFlash] = useState<string | null>(null);
  const [showAllHabits, setShowAllHabits] = useState(false);
  const [intentionIdx] = useState(() => Math.floor(Math.random() * DAILY_INTENTIONS.length));
  const [showResetConfirm, setShowResetConfirm] = useState(false);
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
  const namasteGreeting = firstName ? `Namaste, ${firstName}` : 'Namaste 🙏';
  const greetingEmoji = hour < 12 ? '🌅' : hour < 17 ? '☀️' : hour < 21 ? '🌆' : '🌙';
  const todayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const { completedIds, skippedIds } = engine.getTodayStatus();
  const completionRate = engine.todayCompletionRate;
  const ringColor = completionRate >= 80 ? '#4ade80' : completionRate >= 50 ? '#fbbf24' : '#60a5fa';
  const levelInfo = getLevelFromXP(engine.xp.total);
  const nextLevel = getNextLevel(engine.xp.total);
  const todayXP = engine.xp.history.filter(h => h.date === getToday()).reduce((s, h) => s + h.xp, 0);

  const timeSlot = (hour >= 3 && hour < 11 ? 'morning'
    : hour >= 11 && hour < 15 ? 'midday'
      : hour >= 15 && hour < 21 ? 'evening'
        : 'night') as 'morning' | 'midday' | 'evening' | 'night';

  const isHabitNow = (habit: HabitItem) => {
    const cat = (habit.category ?? 'anytime') as string;
    if (cat === 'anytime') return true;
    if (cat === 'morning' && timeSlot === 'morning') return true;
    if (cat === 'midday' && timeSlot === 'midday') return true;
    if (cat === 'evening' && (timeSlot === 'evening' || timeSlot === 'night')) return true;
    if (cat === 'sacred' && timeSlot === 'morning') return true;
    if (cat === 'night' && timeSlot === 'night') return true;
    return false;
  };

  const allActiveHabits = engine.activeHabits;

  const displayHabits = engine.adhdMode && !showAllHabits
    ? allActiveHabits.filter(h => !completedIds.has(h.id) && !skippedIds.has(h.id)).slice(0, 3)
    : allActiveHabits;

  const handleComplete = useCallback((id: string) => {
    const habit = engine.activeHabits.find(h => h.id === id);
    engine.completeHabit(id);
    setCompletedFlash(id);
    if (habit) {
      const HABIT_PROMPTS = [
        `What wisdom does Ayurveda offer about ${habit.name}? Keep it to one powerful sentence.`,
        `How does ${habit.name} serve my ${habit.lifeArea} energy today?`,
        `What shifts in my body-mind when I consistently do ${habit.name}?`,
        `Connect ${habit.name} to the Vedic understanding of daily rhythm — briefly.`,
        `What is the deeper purpose of ${habit.name} in a conscious life?`,
      ];
      const prompt = HABIT_PROMPTS[Math.floor(Date.now() / 1000) % HABIT_PROMPTS.length];
      const catStr = habit.category as string;
      const habitTimeCtx = catStr === 'morning' ? 'morning' : catStr === 'midday' ? 'afternoon' : catStr === 'evening' ? 'evening' : catStr === 'night' ? 'night' : catStr === 'sacred' ? 'sacred morning' : 'anytime';
      const msg = `✅ I just completed my ${habitTimeCtx} habit: ${habit.icon} ${habit.name}${habit.scheduledTime ? ` (scheduled: ${habit.scheduledTime})` : ''}. This is a ${habitTimeCtx} practice from my ${habit.lifeArea} life area. ${prompt} [UI_EVENT: HABIT_LOGGED]`;
      setPendingMessage(msg);
      setTimeout(() => {
        setCompletedFlash(null);
        router.push('/bodhi-chat');
      }, 650);
    } else {
      setTimeout(() => setCompletedFlash(null), 900);
    }
  }, [engine, setPendingMessage, router]);

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

  // ── Not onboarded — show CTA ─────────────────────────────────────────────
  if (!engine.profile?.onboardingComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => router.push('/bodhi-chat')}
        style={{
          margin: '0 0.75rem 1rem', padding: '1.4rem 1.3rem', borderRadius: 22, cursor: 'pointer',
          background: 'linear-gradient(135deg, rgba(124,58,237,0.14), rgba(251,146,60,0.08))',
          border: '1.5px solid rgba(167,139,250,0.28)',
          display: 'flex', alignItems: 'center', gap: '1rem',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 4px 24px rgba(124,58,237,0.14)',
        }}
      >
        <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2.5, repeat: Infinity }} style={{ fontSize: '2.6rem', filter: 'drop-shadow(0 0 14px rgba(167,139,250,0.65))' }}>🪷</motion.span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 0.22rem', fontSize: '1.05rem', fontWeight: 800, color: '#c4b5fd', fontFamily: "'Outfit', sans-serif" }}>Begin Your Lifestyle Journey</p>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.45 }}>Set up your profile, discover your Prakriti, and start your daily sadhana.</p>
        </div>
        <ChevronRight size={22} style={{ color: 'rgba(167,139,250,0.5)', flexShrink: 0 }} />
      </motion.div>
    );
  }

  return (
    <div style={{ margin: '0 0.75rem 1.5rem' }}>

      {/* ── Completion flash ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {completedFlash && (
          <motion.div
            key="flash"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{ position: 'fixed', top: '46%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 9999, pointerEvents: 'none', fontSize: '2.8rem', filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.8))' }}
          >✨</motion.div>
        )}
      </AnimatePresence>

      {/* ── Mood Log Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showMoodLog && (
          <MoodLogPanel
            onClose={() => setShowMoodLog(false)}
            onLog={(mood, energy, tags, note) => engine.logMood(mood, energy, tags, note)}
          />
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 0 — Header: Date + Greeting + Focus + Reset
      ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.04em' }}>{todayLabel}</p>
          <p style={{ margin: '3px 0 0', fontSize: '1.22rem', fontWeight: 900, color: '#fff', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}>
            {greetingEmoji} {namasteGreeting}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: 2 }}>
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowMoodLog(true)}
            style={{
              padding: '0.3rem 0.72rem', borderRadius: 999, cursor: 'pointer',
              background: engine.todayMood ? 'rgba(168,85,247,0.18)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${engine.todayMood ? 'rgba(168,85,247,0.45)' : 'rgba(255,255,255,0.1)'}`,
              color: engine.todayMood ? '#c084fc' : 'rgba(255,255,255,0.4)',
              fontSize: '0.72rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif",
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
            <Heart size={11} />
            {engine.todayMood ? (MOOD_OPTIONS.find(m => m.value === engine.todayMood!.mood)?.emoji ?? '😊') : 'Mood'}
          </motion.button>
          <motion.button whileTap={{ scale: 0.88 }} onClick={engine.toggleAdhdMode}
            style={{
              padding: '0.3rem 0.72rem', borderRadius: 999, cursor: 'pointer',
              background: engine.adhdMode ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${engine.adhdMode ? 'rgba(251,191,36,0.48)' : 'rgba(255,255,255,0.1)'}`,
              color: engine.adhdMode ? '#fbbf24' : 'rgba(255,255,255,0.4)',
              fontSize: '0.72rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif",
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
            <Zap size={11} fill={engine.adhdMode ? '#fbbf24' : 'none'} />
            {engine.adhdMode ? 'Focus ON' : 'Focus'}
          </motion.button>
          {!showResetConfirm ? (
            <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowResetConfirm(true)}
              title="Reset all practice data" style={{
                padding: '0.3rem 0.48rem', borderRadius: 999, cursor: 'pointer',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center',
              }}>
              <RotateCcw size={12} />
            </motion.button>
          ) : (
            <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif" }}>Reset?</span>
              <motion.button whileTap={{ scale: 0.9 }}
                onClick={() => { engine.resetHabitData(); setShowResetConfirm(false); }}
                style={{ padding: '0.22rem 0.55rem', borderRadius: 99, background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
                Yes
              </motion.button>
              <motion.button whileTap={{ scale: 0.9 }}
                onClick={() => setShowResetConfirm(false)}
                style={{ padding: '0.22rem 0.55rem', borderRadius: 99, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
                No
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1 — Daily Intention
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: '1rem 1.15rem', borderRadius: 16, marginBottom: '1rem',
          background: 'linear-gradient(135deg, rgba(251,191,36,0.13), rgba(168,85,247,0.08))',
          border: '1px solid rgba(251,191,36,0.28)', borderLeft: '3px solid rgba(251,191,36,0.7)',
          backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
          boxShadow: '0 2px 20px rgba(251,191,36,0.1), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.95rem', color: 'rgba(255,255,255,0.72)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.6, fontStyle: 'italic' }}>
          &ldquo;{DAILY_INTENTIONS[intentionIdx]}&rdquo;
        </p>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2 — Dosha Phase Strip + Mood
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.75rem 1rem', borderRadius: 14, marginBottom: '1rem',
          background: `linear-gradient(135deg, ${doshaColor}0f, rgba(255,255,255,0.03))`,
          border: `1px solid ${doshaColor}30`,
          backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
          boxShadow: `0 2px 16px ${doshaColor}18, inset 0 1px 0 rgba(255,255,255,0.05)`,
        }}
      >
        <motion.div
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          style={{ width: 9, height: 9, borderRadius: '50%', background: doshaColor, flexShrink: 0, boxShadow: `0 0 10px ${doshaColor}` }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)', fontFamily: "'Outfit', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentPhase.label}{currentPhase.timeRange ? ` · ${currentPhase.timeRange}` : ''}
          </p>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.32)', fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>{currentPhase.quality}</p>
        </div>
        {inBrahmaMuhurta && (
          <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }}
            style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: 99, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.32)', color: 'rgba(251,191,36,0.9)', fontFamily: "'Outfit', sans-serif", fontWeight: 700, flexShrink: 0 }}>
            ✦ Brahma
          </motion.span>
        )}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3 — Progress Ring + Stats
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.07 }}
        style={{
          display: 'flex', alignItems: 'center', gap: '1rem',
          padding: '1.2rem 1.1rem', borderRadius: 20, marginBottom: '1rem',
          background: `linear-gradient(135deg, ${ringColor}12, rgba(255,255,255,0.04))`,
          border: `1px solid ${ringColor}28`,
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          boxShadow: `0 4px 28px ${ringColor}14, inset 0 1px 0 rgba(255,255,255,0.07)`,
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <ProgressRing pct={completionRate} size={112} stroke={9} color={ringColor} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#fff', lineHeight: 1, fontFamily: "'Outfit', sans-serif" }}>{completionRate}%</span>
            <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>Today</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '0.4rem' }}>
            <div>
              <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#fff', fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>{completedIds.size}/{engine.activeHabits.length}</p>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>Practices</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: ringColor, fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>{engine.consistencyScore}</p>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>7-Day Score</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#fbbf24', fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>+{todayXP}</p>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>XP Today</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.32rem' }}>
            <span style={{ fontSize: '1.1rem' }}>{levelInfo.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>{levelInfo.name}</span>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>{engine.xp.total} XP</span>
              </div>
              {nextLevel && (
                <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(((engine.xp.total - levelInfo.minXP) / (nextLevel.minXP - levelInfo.minXP)) * 100)}%` }}
                    transition={{ duration: 1.1, ease: 'easeOut' }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, #fbbf24, #f97316)', borderRadius: 2 }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3.5 — Prakriti Wisdom Card
      ═══════════════════════════════════════════════════════════════════ */}
      {prakriti && doshaOnboardingComplete && PRAKRITI_INFO[prakriti.primary] && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            padding: '1.1rem 1.2rem', borderRadius: 20, marginBottom: '1rem',
            background: `linear-gradient(135deg, ${doshaColor}15, rgba(255,255,255,0.03))`,
            border: `1px solid ${doshaColor}38`,
            borderLeft: `3px solid ${doshaColor}80`,
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            boxShadow: `0 4px 24px ${doshaColor}18, inset 0 1px 0 rgba(255,255,255,0.06)`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.65rem' }}>
            <span style={{ fontSize: '1.4rem' }}>{PRAKRITI_INFO[prakriti.primary].icon}</span>
            <div>
              <p style={{ margin: 0, fontSize: '0.68rem', color: doshaColor, fontWeight: 800, fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Your Prakriti · {prakriti.combo.toUpperCase()}
              </p>
            </div>
          </div>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.65, fontStyle: 'italic' }}>
            {PRAKRITI_INFO[prakriti.primary].essence}
          </p>
          <p style={{ margin: '0 0 0.45rem', fontSize: '0.65rem', color: 'rgba(255,255,255,0.32)', fontWeight: 800, fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Where you naturally excel
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.32rem' }}>
            {PRAKRITI_INFO[prakriti.primary].strengths.map(s => (
              <span key={s} style={{ padding: '0.25rem 0.65rem', borderRadius: 99, background: `${doshaColor}12`, border: `1px solid ${doshaColor}25`, fontSize: '0.72rem', color: doshaColor, fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>
                {s}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 5 — Quick Action Links
      ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', gap: '0.52rem', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '0.25rem', marginBottom: '1rem' }}>
        {QUICK_LINKS.map(link => (
          <motion.button
            key={link.href}
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push(link.href)}
            style={{
              flexShrink: 0, padding: '0.72rem 0.85rem', borderRadius: 16,
              background: `linear-gradient(135deg, ${link.color}1c, ${link.color}0a)`,
              border: `1px solid ${link.color}42`,
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              minWidth: 70, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              boxShadow: `0 2px 14px ${link.color}14`,
            }}
          >
            <span style={{ fontSize: '1.6rem' }}>{link.icon}</span>
            <span style={{ fontSize: '0.72rem', color: link.color, fontWeight: 700, fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap' }}>{link.label}</span>
          </motion.button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 6 — Today's Habits
      ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: '1rem' }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>
              ✦ Today&#39;s Habits
            </span>
            <span style={{
              fontSize: '0.62rem', padding: '0.12rem 0.48rem', borderRadius: 99,
              background: `${TIME_SLOT_CONFIG[timeSlot].color}18`,
              border: `1px solid ${TIME_SLOT_CONFIG[timeSlot].color}30`,
              color: TIME_SLOT_CONFIG[timeSlot].color,
              fontFamily: "'Outfit', sans-serif", fontWeight: 700,
            }}>
              {TIME_SLOT_CONFIG[timeSlot].emoji} Now
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
            {engine.adhdMode && allActiveHabits.filter(h => !completedIds.has(h.id) && !skippedIds.has(h.id)).length > 3 && (
              <button onClick={() => setShowAllHabits(!showAllHabits)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
                {showAllHabits ? 'less ↑' : `+${allActiveHabits.length - 3} more`}
              </button>
            )}
            <motion.button
              whileTap={{ scale: 0.92 }}
              animate={{ boxShadow: ['0 0 0px rgba(251,191,36,0)', '0 0 14px rgba(251,191,36,0.4)', '0 0 0px rgba(251,191,36,0)'] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              onClick={() => router.push('/lifestyle/habits')}
              style={{
                background: 'linear-gradient(135deg, rgba(251,191,36,0.22), rgba(251,191,36,0.1))',
                border: '1.5px solid rgba(251,191,36,0.55)',
                borderRadius: 999, padding: '0.32rem 0.9rem', color: '#fbbf24',
                fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
                fontFamily: "'Outfit', sans-serif",
                backdropFilter: 'blur(10px)',
              }}>
              <Plus size={13} /> Add your habits
            </motion.button>
          </div>
        </div>

        {/* Tap-to-complete hint */}
        {displayHabits.length > 0 && displayHabits.some(h => !completedIds.has(h.id) && !skippedIds.has(h.id)) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.38rem', marginBottom: '0.7rem', paddingLeft: '0.15rem' }}
          >
            <motion.span
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              style={{ fontSize: '0.8rem', lineHeight: 1 }}>👆</motion.span>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", fontStyle: 'italic', letterSpacing: '0.01em' }}>
              Tap any habit to mark complete — Bodhi celebrates with you
            </span>
          </motion.div>
        )}

        {/* Habit list rows */}
        {displayHabits.length === 0 ? (
          <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/lifestyle/habits')}
            style={{ textAlign: 'center', padding: '2.2rem 1rem', border: '1.5px dashed rgba(251,191,36,0.2)', borderRadius: 18, cursor: 'pointer', background: 'rgba(251,191,36,0.025)' }}
          >
            <p style={{ margin: '0 0 0.5rem', fontSize: '2.4rem' }}>🌱</p>
            <p style={{ margin: '0 0 0.85rem', color: 'rgba(255,255,255,0.42)', fontSize: '0.92rem', fontFamily: "'Outfit', sans-serif" }}>
              {engine.activeHabits.length === 0 ? 'No habits yet — start building your lifestyle system.' : 'All habits complete — beautiful day! ✨'}
            </p>
            {engine.activeHabits.length === 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.42rem 1.1rem', borderRadius: 99, background: 'rgba(251,191,36,0.14)', border: '1px solid rgba(251,191,36,0.38)', color: '#fbbf24', fontSize: '0.8rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
                <Plus size={13} /> Add your first habit
              </span>
            )}
          </motion.div>
        ) : (
          <div>
            {displayHabits.map(habit => (
              <HabitRow
                key={habit.id}
                habit={habit}
                isCompleted={completedIds.has(habit.id)}
                isSkipped={skippedIds.has(habit.id)}
                streak={engine.getHabitStreak(habit.id)}
                isNow={isHabitNow(habit)}
                onComplete={() => handleComplete(habit.id)}
                onSkip={() => engine.skipHabit(habit.id, 'skipped for today')}
              />
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 8 — Ayurvedic Hub Grid
      ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.52rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'rgba(255,255,255,0.72)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>Ayurveda</span>
          {prakriti && (
            <div style={{ padding: '0.22rem 0.62rem', borderRadius: 99, background: `${doshaColor}14`, border: `1px solid ${doshaColor}28` }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: doshaColor, fontFamily: "'Outfit', sans-serif" }}>
                {prakriti.combo.toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
          {[
            { href: '/lifestyle/prakriti', icon: '🪷', label: doshaOnboardingComplete ? 'Prakriti' : 'Discover Prakriti', color: '#a78bfa', desc: doshaOnboardingComplete && prakriti ? `${prakriti.combo.toUpperCase()} constitution` : 'Know your nature' },
            { href: '/lifestyle/dinacharya', icon: '🕐', label: 'Dinacharya', color: '#fbbf24', desc: `${currentPhase.label}` },
            { href: '/lifestyle/bodhi-ayurveda', icon: '✦', label: 'Bodhi Vaidya', color: '#fb923c', desc: 'Ayurvedic wisdom chat' },
            { href: '/lifestyle/ayurvedic-habits', icon: '🌿', label: 'Niyama Habits', color: '#4ade80', desc: 'Dosha-tagged practices' },
          ].map(link => (
            <motion.button key={link.label} whileTap={{ scale: 0.96 }} onClick={() => router.push(link.href)}
              style={{
                padding: '1rem 1.05rem', borderRadius: 18, cursor: 'pointer', textAlign: 'left',
                background: `linear-gradient(135deg, ${link.color}18, ${link.color}08)`,
                border: `1px solid ${link.color}38`,
                backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                boxShadow: `0 2px 18px ${link.color}12`,
              }}>
              <span style={{ fontSize: '1.4rem', display: 'block', marginBottom: 5 }}>{link.icon}</span>
              <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: link.color, fontFamily: "'Outfit', sans-serif" }}>{link.label}</p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.35, marginTop: 3 }}>{link.desc}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 9 — Real-time Insights
      ═══════════════════════════════════════════════════════════════════ */}
      {insights.length > 0 && (
        <div style={{ marginBottom: '0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.5rem' }}>
            <TrendingUp size={16} style={{ color: 'rgba(255,255,255,0.7)' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'rgba(255,255,255,0.72)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>
              Live Insights
            </span>
          </div>
          {insights.map((ins, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                padding: '0.9rem 1rem', borderRadius: 14, marginBottom: '0.45rem',
                background: `linear-gradient(135deg, ${ins.color}14, rgba(0,0,0,0.15))`,
                border: `1px solid ${ins.color}35`,
                borderLeft: `3px solid ${ins.color}80`,
                boxShadow: `0 2px 14px ${ins.color}12`,
              }}
            >
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.55 }}>
                <span style={{ marginRight: 6, fontSize: '1.05rem' }}>{ins.icon}</span>{ins.text}
              </p>
              {ins.cta && ins.ctaHref && (
                <button onClick={() => router.push(ins.ctaHref!)}
                  style={{ background: 'none', border: 'none', color: ins.color, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', padding: '0.28rem 0 0', fontFamily: "'Outfit', sans-serif" }}>
                  {ins.cta}
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Recent Achievements ────────────────────────────────────────── */}
      {engine.badges.length > 0 && (
        <div style={{ marginTop: '0.2rem', marginBottom: '0.8rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>Achievements</span>
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '0.25rem', marginTop: '0.55rem' }}>
            {engine.badges.slice(0, 6).map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '0.38rem', padding: '0.35rem 0.75rem', borderRadius: 999, background: 'rgba(251,191,36,0.30)', border: '1px solid rgba(251,191,36,0.65)', flexShrink: 0, boxShadow: '0 1px 10px rgba(251,191,36,0.25)' }}>
                <span style={{ fontSize: '1.05rem' }}>{b.icon}</span>
                <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700, fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap' }}>{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 10 — Talk to Bodhi CTA
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => router.push('/bodhi-chat')}
        style={{
          width: '100%', padding: '1rem 1.1rem', borderRadius: 18, cursor: 'pointer', textAlign: 'left',
          background: 'linear-gradient(135deg, rgba(139,92,246,0.16), rgba(251,191,36,0.08))',
          border: '1px solid rgba(139,92,246,0.28)',
          display: 'flex', alignItems: 'center', gap: '0.85rem',
          boxSizing: 'border-box', backdropFilter: 'blur(14px)',
        }}
      >
        <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, background: 'radial-gradient(circle at 35% 30%, rgba(251,191,36,0.35) 0%, rgba(139,92,246,0.25) 60%, transparent 100%)', border: '1px solid rgba(251,191,36,0.32)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>✦</div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'rgba(255,255,255,0.88)', fontFamily: "'Outfit', sans-serif" }}>Talk to Bodhi</p>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)', fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>Check in · Plan your day · Ask anything</p>
        </div>
        <MessageCircle size={18} style={{ color: 'rgba(255,255,255,0.22)', flexShrink: 0 }} />
      </motion.button>

    </div>
  );
}
