'use client';

/**
 * MorningMoodCards.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 1 — Morning nature card mood picker.
 *
 * Replaces the emoji picker with 5 illustrated nature cards shown once each
 * morning. Bodhi replies with one warm sentence per card. The selection is
 * persisted in localStorage (key: onesutra_morning_mood_v2) and exposed via
 * getMorningMood() / shouldShowMorningCard() helpers.
 *
 * MoodKey maps directly to the Bodhi habit-log "mood" field in the system prompt.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types & constants ────────────────────────────────────────────────────────

export type MorningMoodKey =
  | 'blooming'
  | 'gentle_leaf'
  | 'storm_cloud'
  | 'bright_sun'
  | 'heavy_stone';

interface MoodCard {
  key: MorningMoodKey;
  emoji: string;
  label: string;
  doshaSignal: string;
  bodhiLine: string;
  accentColor: string;
  gradient: string;
  bgImage: string;
  moodValue: number; // maps to existing 1-5 mood scale
}

const MOOD_CARDS: MoodCard[] = [
  {
    key: 'blooming',
    emoji: '🌸',
    label: 'Blooming',
    doshaSignal: 'Joyful · Energized · Balanced',
    bodhiLine: 'A beautiful day lives inside that feeling — let\'s honor it.',
    accentColor: '#fb923c',
    gradient: 'linear-gradient(160deg, rgba(251,146,60,0.45) 0%, rgba(244,114,182,0.30) 100%)',
    bgImage: 'https://images.unsplash.com/photo-1490750967868-88df5691cc34?w=600&q=75&fit=crop',
    moodValue: 5,
  },
  {
    key: 'gentle_leaf',
    emoji: '🍃',
    label: 'Gentle',
    doshaSignal: 'Calm · Peaceful · Vata balanced',
    bodhiLine: 'Still and clear. The best place to begin from.',
    accentColor: '#4ade80',
    gradient: 'linear-gradient(160deg, rgba(74,222,128,0.38) 0%, rgba(52,211,153,0.25) 100%)',
    bgImage: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&q=75&fit=crop',
    moodValue: 4,
  },
  {
    key: 'storm_cloud',
    emoji: '🌩️',
    label: 'Stormy',
    doshaSignal: 'Anxious · Scattered · Vata elevated',
    bodhiLine: 'The storm will pass. We move gently today.',
    accentColor: '#a78bfa',
    gradient: 'linear-gradient(160deg, rgba(167,139,250,0.38) 0%, rgba(99,102,241,0.25) 100%)',
    bgImage: 'https://images.unsplash.com/photo-1504608524841-42584120d693?w=600&q=75&fit=crop',
    moodValue: 2,
  },
  {
    key: 'bright_sun',
    emoji: '🔥',
    label: 'Intense',
    doshaSignal: 'Driven · Intense · Pitta elevated',
    bodhiLine: 'That fire is power. Let\'s channel it well.',
    accentColor: '#fbbf24',
    gradient: 'linear-gradient(160deg, rgba(251,191,36,0.42) 0%, rgba(245,158,11,0.28) 100%)',
    bgImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=75&fit=crop',
    moodValue: 4,
  },
  {
    key: 'heavy_stone',
    emoji: '🪨',
    label: 'Heavy',
    doshaSignal: 'Sluggish · Low · Kapha elevated',
    bodhiLine: 'Heavy mornings are information, not failure. Small steps today.',
    accentColor: '#94a3b8',
    gradient: 'linear-gradient(160deg, rgba(100,116,139,0.40) 0%, rgba(71,85,105,0.28) 100%)',
    bgImage: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=600&q=75&fit=crop',
    moodValue: 2,
  },
];

// ─── localStorage helpers ─────────────────────────────────────────────────────

const MOOD_KEY = 'onesutra_morning_mood_v2';

function getTodayIST(): string {
  return new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
}

export function getMorningMood(): { mood: MorningMoodKey; moodValue: number; date: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = JSON.parse(localStorage.getItem(MOOD_KEY) ?? 'null');
    if (stored?.date === getTodayIST()) return stored;
    return null;
  } catch { return null; }
}

export function setMorningMoodStorage(mood: MorningMoodKey, moodValue: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MOOD_KEY, JSON.stringify({ mood, moodValue, date: getTodayIST() }));
    window.dispatchEvent(new CustomEvent('onesutra-morning-mood-updated'));
  } catch { /* */ }
}

export function shouldShowMorningCard(): boolean {
  return getMorningMood() === null;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface MorningMoodCardsProps {
  userName?: string;
  onSelect: (mood: MorningMoodKey, moodValue: number) => void;
  onDismiss?: () => void;
}

export default function MorningMoodCards({ userName, onSelect, onDismiss }: MorningMoodCardsProps) {
  const [selected, setSelected] = useState<MorningMoodKey | null>(null);
  const [bodhiLine, setBodhiLine] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const firstName = userName?.split(' ')[0] || 'friend';

  useEffect(() => {
    // Pre-load first image to avoid layout flash
    const img = new Image();
    img.onload = () => setImagesLoaded(true);
    img.src = MOOD_CARDS[0].bgImage;
  }, []);

  const handleSelect = (card: MoodCard) => {
    if (selected) return; // prevent double-tap
    setSelected(card.key);
    setBodhiLine(card.bodhiLine);
    setMorningMoodStorage(card.key, card.moodValue);

    setTimeout(() => {
      setLeaving(true);
      setTimeout(() => onSelect(card.key, card.moodValue), 480);
    }, 2400);
  };

  const handleSkip = () => {
    setMorningMoodStorage('gentle_leaf', 4);
    onDismiss?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(4,2,16,0.97)',
        backdropFilter: 'blur(24px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem 1.1rem 2rem',
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* ── Bodhi greeting ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{ textAlign: 'center', marginBottom: '1.75rem' }}
      >
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
          padding: '0.35rem 0.9rem', borderRadius: 99,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '0.8rem',
        }}>
          <span style={{ fontSize: '0.95rem' }}>🌿</span>
          <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Bodhi — Morning Check-in</span>
        </div>
        <p style={{
          margin: '0 0 0.35rem',
          fontSize: '1.15rem', fontWeight: 800,
          color: 'rgba(255,255,255,0.92)',
          lineHeight: 1.3,
        }}>
          Good morning, {firstName}. 🙏
        </p>
        <p style={{
          margin: 0, fontSize: '0.84rem',
          color: 'rgba(255,255,255,0.42)',
          fontStyle: 'italic',
        }}>
          How does your inner garden feel today?
        </p>
      </motion.div>

      {/* ── 5 Nature Cards ─────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: '0.55rem',
        width: '100%', maxWidth: 460,
        justifyContent: 'center',
      }}>
        {MOOD_CARDS.map((card, i) => {
          const isSelected = selected === card.key;
          const isDimmed = selected !== null && !isSelected;

          return (
            <motion.button
              key={card.key}
              initial={{ opacity: 0, y: 22 }}
              animate={{
                opacity: isDimmed ? 0.38 : 1,
                y: 0,
                scale: isSelected ? 1.05 : 1,
              }}
              transition={{
                delay: 0.36 + i * 0.06,
                duration: isSelected ? 0.3 : 0.42,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileTap={{ scale: 0.93 }}
              onClick={() => handleSelect(card)}
              style={{
                position: 'relative', overflow: 'hidden',
                borderRadius: 20, border: 'none', cursor: 'pointer',
                background: 'transparent', padding: 0,
                flex: 1, aspectRatio: '0.62',
                outline: `2px solid ${isSelected ? card.accentColor : 'transparent'}`,
                outlineOffset: isSelected ? 3 : 0,
                boxShadow: isSelected ? `0 0 32px ${card.accentColor}55, 0 8px 24px rgba(0,0,0,0.5)` : '0 4px 16px rgba(0,0,0,0.4)',
                transition: 'outline 0.25s, box-shadow 0.25s',
              }}
            >
              {/* Background nature image */}
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url('${card.bgImage}')`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                filter: 'brightness(0.6) saturate(1.15)',
              }} />

              {/* Gradient mood overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: card.gradient,
              }} />

              {/* Bottom fade */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(4,2,16,0.75) 0%, transparent 55%)',
              }} />

              {/* Card content */}
              <div style={{
                position: 'relative', zIndex: 2,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'flex-end',
                height: '100%', padding: '0.55rem 0.3rem 0.65rem',
              }}>
                <motion.span
                  animate={isSelected ? { scale: [1, 1.25, 1.1] } : {}}
                  transition={{ duration: 0.45 }}
                  style={{ fontSize: '1.65rem', marginBottom: '0.28rem', filter: isSelected ? `drop-shadow(0 0 8px ${card.accentColor})` : 'none' }}
                >
                  {card.emoji}
                </motion.span>
                <span style={{
                  fontSize: '0.6rem', fontWeight: 700,
                  color: isSelected ? card.accentColor : 'rgba(255,255,255,0.78)',
                  textAlign: 'center', lineHeight: 1.25,
                  textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                  transition: 'color 0.25s',
                }}>
                  {card.label}
                </span>
              </div>

              {/* Selected checkmark */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      position: 'absolute', top: 7, right: 7,
                      width: 18, height: 18, borderRadius: '50%',
                      background: card.accentColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: '0.55rem', color: '#000', fontWeight: 900 }}>✓</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* ── Bodhi's one-sentence response ──────────────────────── */}
      <AnimatePresence>
        {bodhiLine && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            style={{
              marginTop: '1.6rem',
              padding: '0.9rem 1.25rem',
              borderRadius: 18,
              background: 'rgba(255,255,255,0.055)',
              border: '1px solid rgba(255,255,255,0.13)',
              maxWidth: 340, textAlign: 'center',
              backdropFilter: 'blur(10px)',
            }}
          >
            <p style={{
              margin: '0 0 0.3rem', fontSize: '0.86rem',
              color: 'rgba(255,255,255,0.84)',
              fontStyle: 'italic', lineHeight: 1.6,
            }}>
              "{bodhiLine}"
            </p>
            <span style={{
              fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              — Bodhi
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dosha signal hint ────────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              marginTop: '0.75rem', fontSize: '0.62rem',
              color: MOOD_CARDS.find(c => c.key === selected)?.accentColor ?? 'rgba(255,255,255,0.3)',
              letterSpacing: '0.06em', textAlign: 'center',
            }}
          >
            {MOOD_CARDS.find(c => c.key === selected)?.doshaSignal}
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Skip link ───────────────────────────────────────────── */}
      {!selected && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          onClick={handleSkip}
          style={{
            marginTop: '1.6rem',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.2)', fontSize: '0.72rem',
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          Skip for now
        </motion.button>
      )}
    </motion.div>
  );
}
