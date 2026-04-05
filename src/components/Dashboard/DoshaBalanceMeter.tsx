'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDoshaEngine } from '@/hooks/useDoshaEngine';
import { DOSHA_INFO, type Dosha } from '@/lib/doshaService';

interface DoshaBalanceMeterProps {
  compact?: boolean;
}

const DOSHA_ORDER: Dosha[] = ['vata', 'pitta', 'kapha'];

const COLORS: Record<Dosha, { primary: string; glow: string; bg: string }> = {
  vata:  { primary: '#a78bfa', glow: 'rgba(167,139,250,0.35)', bg: 'rgba(124,58,237,0.12)' },
  pitta: { primary: '#fb923c', glow: 'rgba(251,146,60,0.35)',  bg: 'rgba(194,65,12,0.12)'  },
  kapha: { primary: '#4ade80', glow: 'rgba(74,222,128,0.35)',  bg: 'rgba(21,128,61,0.12)'  },
};

const BALANCE_LABELS: Record<string, string> = {
  balanced: 'In Balance',
  mild: 'Mildly Elevated',
  moderate: 'Moderately Elevated',
  high: 'Significantly Elevated',
};

export default function DoshaBalanceMeter({ compact = false }: DoshaBalanceMeterProps) {
  const { prakriti, vikriti, rollingBalance } = useDoshaEngine();

  const total = rollingBalance.vata + rollingBalance.pitta + rollingBalance.kapha;

  const pcts = useMemo(() => ({
    vata: total > 0 ? Math.round((rollingBalance.vata / total) * 100) : 33,
    pitta: total > 0 ? Math.round((rollingBalance.pitta / total) * 100) : 33,
    kapha: total > 0 ? Math.round((rollingBalance.kapha / total) * 100) : 34,
  }), [rollingBalance, total]);

  const elevated = vikriti?.primary ?? null;
  const imbalanceLevel = vikriti?.imbalanceLevel ?? 'balanced';

  if (compact) {
    return (
      <div style={{ padding: '0.85rem 1rem', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
          <p style={{ margin: 0, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>
            Dosha Balance (7-day)
          </p>
          {elevated && (
            <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: 99, background: COLORS[elevated].bg, color: COLORS[elevated].primary, fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
              {DOSHA_INFO[elevated].emoji} {BALANCE_LABELS[imbalanceLevel]}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-end', height: 40 }}>
          {DOSHA_ORDER.map(d => (
            <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(pcts[d] / 100 * 36, 4)}px` }}
                transition={{ duration: 1, ease: 'easeOut', delay: DOSHA_ORDER.indexOf(d) * 0.15 }}
                style={{
                  width: '100%', borderRadius: 4,
                  background: COLORS[d].primary,
                  boxShadow: elevated === d ? `0 0 8px ${COLORS[d].glow}` : 'none',
                  opacity: elevated && elevated !== d ? 0.45 : 1,
                }}
              />
              <span style={{ fontSize: '0.6rem', color: COLORS[d].primary, fontFamily: "'Outfit', sans-serif", opacity: 0.8 }}>
                {DOSHA_INFO[d].emoji}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '1.2rem', borderRadius: 20,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>
            Dosha Balance Meter
          </p>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.68rem', color: 'rgba(255,255,255,0.22)', fontFamily: "'Outfit', sans-serif" }}>
            Based on your last 7 days of logs
          </p>
        </div>
        {prakriti && (
          <div style={{ padding: '0.3rem 0.65rem', borderRadius: 99, background: COLORS[prakriti.primary].bg, border: `1px solid ${COLORS[prakriti.primary].primary}40` }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: COLORS[prakriti.primary].primary, fontFamily: "'Outfit', sans-serif" }}>
              {DOSHA_INFO[prakriti.primary].emoji} {prakriti.combo.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Bar chart */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        {DOSHA_ORDER.map((d, i) => {
          const pct = pcts[d];
          const isElevated = elevated === d;
          const isDimmed = elevated && elevated !== d;
          return (
            <div key={d} style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.72rem', color: isDimmed ? 'rgba(255,255,255,0.3)' : COLORS[d].primary, fontFamily: "'Outfit', sans-serif", fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {DOSHA_INFO[d].emoji} {DOSHA_INFO[d].name}
                </span>
                <span style={{ fontSize: '0.72rem', color: isDimmed ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif" }}>{pct}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1.2, delay: i * 0.18, ease: 'easeOut' }}
                  style={{
                    height: '100%', borderRadius: 4,
                    background: COLORS[d].primary,
                    boxShadow: isElevated ? `0 0 10px ${COLORS[d].glow}` : 'none',
                    opacity: isDimmed ? 0.3 : 1,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Imbalance insight */}
      {elevated && imbalanceLevel !== 'balanced' && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '0.75rem 0.9rem', borderRadius: 12,
            background: COLORS[elevated].bg,
            border: `1px solid ${COLORS[elevated].primary}35`,
          }}
        >
          <p style={{ margin: '0 0 0.2rem', fontSize: '0.75rem', fontWeight: 700, color: COLORS[elevated].primary, fontFamily: "'Outfit', sans-serif" }}>
            {DOSHA_INFO[elevated].emoji} {DOSHA_INFO[elevated].name} is {BALANCE_LABELS[imbalanceLevel]}
          </p>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}>
            {DOSHA_INFO[elevated].imbalanceSigns.slice(0, 3).join(' · ')} — log your daily check-in to track this.
          </p>
        </motion.div>
      )}

      {imbalanceLevel === 'balanced' && (
        <div style={{ padding: '0.65rem 0.9rem', borderRadius: 12, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.18)' }}>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(251,191,36,0.8)', fontFamily: "'Outfit', sans-serif" }}>
            ✦ Your doshas are in relative balance. Maintain with consistent Dinacharya.
          </p>
        </div>
      )}
    </div>
  );
}
