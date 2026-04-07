'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// ── Constants ──────────────────────────────────────────────────────────────────
const MALA_TOTAL   = 108;
const MERU_BEAD    = 108; // the guru bead at the end
const MILESTONE_BEADS = new Set([21, 40, 54, 108]); // habit formation, Yama, half-mala, full

function getMilestoneLabel(n: number): string | null {
  if (n === 21)  return '21 — Habit Born';
  if (n === 40)  return '40 — Tapas Forged';
  if (n === 54)  return '54 — Half Mālā';
  if (n === 108) return '108 — Pūrṇa Mālā ✨';
  return null;
}

// ── Read streak from ayurvedic habits localStorage ────────────────────────────
function readStreakFromStorage(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem('onesutra_ayur_habits_v1');
    if (!raw) return 0;
    const data = JSON.parse(raw) as Record<string, { streak?: number; completedDates?: string[] }>;
    let maxStreak = 0;
    Object.values(data).forEach(h => {
      const s = h.streak ?? 0;
      if (s > maxStreak) maxStreak = s;
    });
    return Math.min(maxStreak, MALA_TOTAL);
  } catch {
    return 0;
  }
}

// ── Bead component ─────────────────────────────────────────────────────────────
function Bead({ lit, isMilestone, isMeru, delay = 0 }: { lit: boolean; isMilestone: boolean; isMeru: boolean; delay?: number }) {
  const size  = isMeru ? 10 : isMilestone ? 7 : 5;
  const color = isMeru
    ? '#D4AF37'
    : isMilestone
      ? (lit ? '#fb923c' : 'rgba(255,255,255,0.14)')
      : (lit ? '#a78bfa' : 'rgba(255,255,255,0.09)');
  const glow  = isMeru
    ? 'rgba(212,175,55,0.8)'
    : isMilestone && lit
      ? 'rgba(251,146,60,0.7)'
      : lit
        ? 'rgba(167,139,250,0.5)'
        : 'none';

  return (
    <motion.div
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      style={{
        width: size, height: size,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
        boxShadow: glow !== 'none' ? `0 0 ${isMeru ? 10 : 6}px ${glow}` : 'none',
        transition: 'all 0.4s ease',
      }}
    />
  );
}

// ── Component ──────────────────────────────────────────────────────────────────
interface StreakMalaProps {
  streakOverride?: number;
}

export default function StreakMala({ streakOverride }: StreakMalaProps) {
  const [streak, setStreak] = useState(0);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  useEffect(() => {
    if (streakOverride !== undefined) { setStreak(streakOverride); return; }
    setStreak(readStreakFromStorage());
    const handler = () => setStreak(readStreakFromStorage());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [streakOverride]);

  const nextMilestone = useMemo(() => {
    const milestones = [21, 40, 54, 108];
    return milestones.find(m => m > streak) ?? null;
  }, [streak]);

  const pct = Math.round((streak / MALA_TOTAL) * 100);

  // Build bead rows: wrap 108 beads across ~18 per row
  const BEADS_PER_ROW = 18;
  const rows = useMemo(() => {
    const beads = Array.from({ length: MALA_TOTAL }, (_, i) => i + 1);
    const result: number[][] = [];
    for (let i = 0; i < beads.length; i += BEADS_PER_ROW) {
      result.push(beads.slice(i, i + BEADS_PER_ROW));
    }
    return result;
  }, []);

  return (
    <div style={{
      margin: '0 0.75rem 1.4rem',
      padding: '0.9rem 1rem',
      borderRadius: 20,
      background: 'rgba(8,6,22,0.72)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(167,139,250,0.18)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background mandala hint */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `radial-gradient(circle at 90% 50%, rgba(167,139,250,0.06) 0%, transparent 60%)`,
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.7rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <motion.span
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
              style={{ fontSize: '1rem', lineHeight: 1 }}
            >📿</motion.span>
            <div>
              <p style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>Tapas Mālā</p>
              <p style={{ margin: 0, fontFamily: "'Cormorant Garamond', serif", fontSize: '0.62rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.28)', lineHeight: 1.4 }}>108 days of sacred practice</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <motion.p
              key={streak}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: '1.4rem', fontWeight: 900, color: streak >= 108 ? '#D4AF37' : '#a78bfa', lineHeight: 1 }}
            >{streak}</motion.p>
            <p style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: '0.55rem', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.05em' }}>/ 108 days</p>
          </div>
        </div>

        {/* Mala bead grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: '0.7rem' }}>
          {rows.map((row, rowIdx) => (
            <div key={rowIdx} style={{ display: 'flex', gap: 3, alignItems: 'center', justifyContent: 'flex-start' }}>
              {row.map((beadNum) => {
                const lit = beadNum <= streak;
                const isMilestone = MILESTONE_BEADS.has(beadNum);
                const isMeru = beadNum === MALA_TOTAL;
                const milestoneLabel = getMilestoneLabel(beadNum);

                return (
                  <div
                    key={beadNum}
                    style={{ position: 'relative' }}
                    onMouseEnter={() => milestoneLabel ? setShowTooltip(`${beadNum}`) : undefined}
                    onMouseLeave={() => setShowTooltip(null)}
                  >
                    <Bead
                      lit={lit}
                      isMilestone={isMilestone}
                      isMeru={isMeru}
                      delay={lit ? beadNum * 0.006 : 0}
                    />
                    {/* Milestone glow ring */}
                    {isMilestone && lit && (
                      <motion.div
                        style={{
                          position: 'absolute', inset: -3, borderRadius: '50%',
                          border: `1px solid ${beadNum === 108 ? '#D4AF37' : '#fb923c'}55`,
                          pointerEvents: 'none',
                        }}
                        animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.2, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}
                    {/* Milestone tooltip */}
                    {showTooltip === `${beadNum}` && milestoneLabel && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
                          background: 'rgba(5,3,20,0.95)', border: '1px solid rgba(212,175,55,0.4)',
                          borderRadius: 10, padding: '0.3rem 0.55rem',
                          whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 20,
                          fontFamily: "'Outfit', sans-serif", fontSize: '0.60rem', fontWeight: 700,
                          color: '#D4AF37',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                        }}
                      >{milestoneLabel}</motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginBottom: '0.6rem' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.4, ease: 'easeOut', delay: 0.5 }}
            style={{
              height: '100%', borderRadius: 2,
              background: streak >= 108
                ? 'linear-gradient(90deg, #D4AF37, #fb923c, #a78bfa)'
                : 'linear-gradient(90deg, #a78bfa, #c084fc)',
              boxShadow: streak >= 108 ? '0 0 12px rgba(212,175,55,0.6)' : '0 0 8px rgba(167,139,250,0.4)',
            }}
          />
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ margin: 0, fontFamily: "'Cormorant Garamond', serif", fontSize: '0.65rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.35)' }}>
            {streak === 0
              ? 'Begin your practice today.'
              : streak >= 108
                ? '✦ Pūrṇa Mālā complete. You have transcended.'
                : nextMilestone
                  ? `${nextMilestone - streak} days to the next milestone`
                  : `${pct}% of the sacred 108`}
          </p>
          <span style={{
            fontFamily: "'Outfit', sans-serif", fontSize: '0.58rem', fontWeight: 700,
            color: streak >= 108 ? '#D4AF37' : 'rgba(167,139,250,0.7)',
          }}>{pct}%</span>
        </div>

        {/* Completion bloom */}
        {streak >= 108 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0.7, 1, 0.7], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', inset: 0, borderRadius: 20, pointerEvents: 'none',
              background: 'radial-gradient(circle at center, rgba(212,175,55,0.12) 0%, transparent 70%)',
              border: '1px solid rgba(212,175,55,0.35)',
            }}
          />
        )}
      </div>
    </div>
  );
}
