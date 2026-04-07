'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useDoshaEngine } from '@/hooks/useDoshaEngine';
import styles from './DoshaCompass.module.css';

// ── Constants ──────────────────────────────────────────────────────────────────
const COLORS = {
  vata: { vivid: '#a78bfa', soft: '#E6E6FA', glow: 'rgba(167,139,250,0.45)', bg: 'rgba(124,58,237,0.12)' },
  pitta: { vivid: '#fb923c', soft: '#F7C59F', glow: 'rgba(251,146,60,0.45)', bg: 'rgba(194,65,12,0.12)' },
  kapha: { vivid: '#4ade80', soft: '#C8E6C9', glow: 'rgba(74,222,128,0.45)', bg: 'rgba(21,128,61,0.12)' },
};

const DOSHA_META = {
  vata: { label: 'Vāta', element: 'Space & Air', emoji: '🌬️', tip: 'Ground with warmth & routine' },
  pitta: { label: 'Pitta', element: 'Fire & Water', emoji: '🔥', tip: 'Cool with clarity & rest' },
  kapha: { label: 'Kapha', element: 'Earth & Water', emoji: '🌿', tip: 'Energise with movement' },
};

const PHASE_ICONS: Record<string, string> = {
  vata_morning: '🌅', pitta_midday: '☀️', kapha_evening: '🌙',
  vata_night: '🌃', pitta_afternoon: '⚡', kapha_morning: '🌱',
};

// ── SVG helpers ────────────────────────────────────────────────────────────────
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function sectorPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const s = polarToCartesian(cx, cy, r, startDeg);
  const e = polarToCartesian(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)} Z`;
}

function donutArcPath(cx: number, cy: number, rOuter: number, rInner: number, startDeg: number, endDeg: number): string {
  const gap = 2.5;
  const sOuter = polarToCartesian(cx, cy, rOuter, startDeg + gap);
  const eOuter = polarToCartesian(cx, cy, rOuter, endDeg - gap);
  const sInner = polarToCartesian(cx, cy, rInner, startDeg + gap);
  const eInner = polarToCartesian(cx, cy, rInner, endDeg - gap);
  const sweep = endDeg - startDeg - gap * 2;
  const large = sweep > 180 ? 1 : 0;
  return [
    `M ${sOuter.x.toFixed(2)} ${sOuter.y.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${eOuter.x.toFixed(2)} ${eOuter.y.toFixed(2)}`,
    `L ${eInner.x.toFixed(2)} ${eInner.y.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${sInner.x.toFixed(2)} ${sInner.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function DoshaCompass() {
  const router = useRouter();
  const { prakriti, vikriti, currentPhase, rollingBalance, doshaOnboardingComplete, metrics } = useDoshaEngine();
  const [expanded, setExpanded] = useState(false);

  const total = rollingBalance.vata + rollingBalance.pitta + rollingBalance.kapha;
  const pcts = useMemo(() => ({
    vata: total > 0 ? (rollingBalance.vata / total) * 100 : 33.33,
    pitta: total > 0 ? (rollingBalance.pitta / total) * 100 : 33.33,
    kapha: total > 0 ? (rollingBalance.kapha / total) * 100 : 33.34,
  }), [rollingBalance, total]);

  // ── Build SVG donut arc angles ──────────────────────────────────────────────
  const vataDeg = (pcts.vata / 100) * 360;
  const pittaDeg = (pcts.pitta / 100) * 360;
  const kaphaDeg = (pcts.kapha / 100) * 360;

  const sectors = [
    { dosha: 'vata' as const, start: 0, end: vataDeg },
    { dosha: 'pitta' as const, start: vataDeg, end: vataDeg + pittaDeg },
    { dosha: 'kapha' as const, start: vataDeg + pittaDeg, end: vataDeg + pittaDeg + kaphaDeg },
  ];

  const primary = prakriti?.primary ?? null;
  const dominant = primary ? COLORS[primary] : COLORS.pitta;
  const imbalance = vikriti?.imbalanceLevel ?? 'balanced';

  // ── Radar chart points for Vikriti view ────────────────────────────────────
  const cx = 80, cy = 80, maxR = 55;
  const radarAxes = [
    { label: 'Vāta', deg: -90, key: 'vata' as const },
    { label: 'Pitta', deg: 30, key: 'pitta' as const },
    { label: 'Kapha', deg: 150, key: 'kapha' as const },
  ];

  const prakritPts = radarAxes.map(a => {
    const frac = prakriti ? (a.key === prakriti.primary ? 0.9 : a.key === prakriti.secondary ? 0.55 : 0.22) : 0.33;
    return polarToCartesian(cx, cy, maxR * frac, a.deg);
  });
  const vikritiPts = radarAxes.map(a => {
    const frac = vikriti ? (a.key === vikriti.primary ? Math.min(0.9, 0.6 + (vikriti.imbalanceLevel === 'high' ? 0.3 : vikriti.imbalanceLevel === 'moderate' ? 0.2 : 0.1)) : a.key === (vikriti as any).secondary ? 0.5 : 0.25) : 0.33;
    return polarToCartesian(cx, cy, maxR * frac, a.deg);
  });

  const radarGrid = [0.25, 0.5, 0.75, 1].map(frac => ({
    pts: radarAxes.map(a => polarToCartesian(cx, cy, maxR * frac, a.deg)),
  }));

  const prakritPath = prakritPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
  const vikritiPath = vikritiPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';

  if (!doshaOnboardingComplete) {
    return (
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        onClick={() => router.push('/lifestyle/prakriti')}
        style={{ cursor: 'pointer', borderColor: 'rgba(212,175,55,0.35)', boxShadow: '0 0 28px rgba(212,175,55,0.12)' }}
      >
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <motion.span animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} style={{ fontSize: '1.4rem' }}>🧭</motion.span>
            <span className={styles.title}>Dosha Compass</span>
          </div>
          <span className={styles.badge} style={{ background: 'rgba(212,175,55,0.14)', color: '#D4AF37', borderColor: 'rgba(212,175,55,0.35)' }}>Uncalibrated</span>
        </div>
        <p className={styles.setupCta}>Discover your Ayurvedic constitution — tap to take the Prakriti quiz and awaken your living compass.</p>
        <motion.div
          className={styles.setupBtn}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
        >Begin Prakriti Assessment →</motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        borderColor: `${dominant.vivid}30`,
        boxShadow: `0 4px 32px ${dominant.glow}, 0 1px 0 rgba(255,255,255,0.08) inset`,
      }}
    >
      {/* Ambient dosha glow */}
      <motion.div
        className={styles.ambientGlow}
        animate={{ opacity: [0.15, 0.3, 0.15], scale: [1, 1.08, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: `radial-gradient(circle at 50% 30%, ${dominant.glow} 0%, transparent 68%)` }}
      />

      {/* Header row */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <motion.span animate={{ rotate: [0, 12, -12, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} style={{ fontSize: '1.3rem' }}>🧭</motion.span>
          <span className={styles.title}>Dosha Compass</span>
          {imbalance !== 'balanced' && (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={styles.imbalanceDot}
              style={{ background: dominant.vivid, boxShadow: `0 0 8px ${dominant.glow}` }}
            />
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          {currentPhase && (
            <span className={styles.phaseBadge}>
              {PHASE_ICONS[`${currentPhase.dominantDosha}_${currentPhase.label?.toLowerCase().replace(/\s+/g, '_')}`] ?? '⏱'} {currentPhase.label}
            </span>
          )}
          <motion.button
            className={styles.expandBtn}
            onClick={() => setExpanded(v => !v)}
            whileTap={{ scale: 0.92 }}
            aria-label={expanded ? 'Collapse' : 'Expand to Vikriti Radar'}
          >
            {expanded ? '▲' : '▼'}
          </motion.button>
        </div>
      </div>

      {/* Main content: Compass + Sidebar */}
      <div className={styles.body}>

        {/* ── Animated SVG Donut Compass ── */}
        <div className={styles.compassWrap}>
          <svg viewBox="0 0 200 200" className={styles.compassSvg}>
            <defs>
              {Object.entries(COLORS).map(([k, c]) => (
                <filter key={k} id={`glow-${k}`} x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                  <feColorMatrix in="blur" type="saturate" values="2" result="sat" />
                  <feMerge><feMergeNode in="sat" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              ))}
            </defs>

            {/* Outer ring grid */}
            {[86, 68, 50].map(r => (
              <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            ))}

            {/* Donut sectors */}
            {sectors.map(({ dosha, start, end }) => (
              <motion.path
                key={dosha}
                d={donutArcPath(100, 100, 84, 52, start, end)}
                fill={COLORS[dosha].vivid}
                opacity={primary && primary !== dosha ? 0.38 : 0.88}
                filter={`url(#glow-${dosha})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: primary && primary !== dosha ? 0.38 : 0.88 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            ))}

            {/* Center circle */}
            <circle cx="100" cy="100" r="38" fill="rgba(5,5,28,0.82)" />
            <motion.circle
              cx="100" cy="100" r="36"
              fill="none"
              stroke={dominant.vivid}
              strokeWidth="1"
              strokeDasharray="6 4"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: '100px 100px' }}
            />

            {/* Om symbol in center */}
            <text x="100" y="107" textAnchor="middle" fontSize="22" fill={dominant.vivid} fontFamily="serif" opacity="0.9">ॐ</text>

            {/* Dosha vertex labels */}
            {[
              { label: 'V', angle: -30, dosha: 'vata' as const },
              { label: 'P', angle: 90, dosha: 'pitta' as const },
              { label: 'K', angle: 210, dosha: 'kapha' as const },
            ].map(({ label, angle, dosha }) => {
              const pt = polarToCartesian(100, 100, 96, angle);
              return (
                <text key={dosha} x={pt.x} y={pt.y + 4} textAnchor="middle"
                  fontSize="9" fontWeight="700" fill={COLORS[dosha].vivid}
                  fontFamily="'Outfit', sans-serif" letterSpacing="0.04em"
                >{label}</text>
              );
            })}

            {/* Dominant dosha ring pulse */}
            <motion.circle
              cx="100" cy="100" r="84"
              fill="none"
              stroke={dominant.vivid}
              strokeWidth="1.5"
              animate={{ opacity: [0.25, 0.55, 0.25], r: [84, 86, 84] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>
        </div>

        {/* ── Right: Dosha stats ── */}
        <div className={styles.statsPanel}>
          <div className={styles.prakritiBadge} style={{ background: dominant.bg, borderColor: `${dominant.vivid}50`, color: dominant.vivid }}>
            <span style={{ fontSize: '1rem' }}>{primary ? DOSHA_META[primary].emoji : '🪷'}</span>
            <div>
              <p className={styles.prakritiLabel}>{prakriti?.combo.toUpperCase() ?? 'ASSESSING'}</p>
              <p className={styles.prakritiSub}>{primary ? DOSHA_META[primary].element : 'Awaiting data'}</p>
            </div>
          </div>

          <div className={styles.barGroup}>
            {(['vata', 'pitta', 'kapha'] as const).map((d) => (
              <div key={d} className={styles.barRow}>
                <span className={styles.barLabel} style={{ color: COLORS[d].vivid }}>{DOSHA_META[d].emoji}</span>
                <div className={styles.barTrack}>
                  <motion.div
                    className={styles.barFill}
                    initial={{ width: 0 }}
                    animate={{ width: `${pcts[d]}%` }}
                    transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
                    style={{
                      background: COLORS[d].vivid,
                      boxShadow: primary === d ? `0 0 8px ${COLORS[d].glow}` : 'none',
                      opacity: primary && primary !== d ? 0.4 : 1,
                    }}
                  />
                </div>
                <span className={styles.barPct} style={{ color: COLORS[d].vivid }}>{Math.round(pcts[d])}%</span>
              </div>
            ))}
          </div>

          {primary && (
            <p className={styles.tip} style={{ color: `${dominant.vivid}cc` }}>
              {DOSHA_META[primary].tip}
            </p>
          )}

          <motion.button
            className={styles.deepDiveBtn}
            style={{ borderColor: `${dominant.vivid}55`, color: dominant.vivid, background: dominant.bg }}
            onClick={() => router.push('/lifestyle/prakriti')}
            whileHover={{ scale: 1.03, boxShadow: `0 0 18px ${dominant.glow}` }}
            whileTap={{ scale: 0.96 }}
          >
            View My Prakriti →
          </motion.button>
        </div>
      </div>

      {/* ── Vikriti Radar — Expanded ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className={styles.radarSection}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.radarDivider} />
            <p className={styles.radarTitle}>Vikṛti Radar <span className={styles.radarSub}>— Current Imbalance</span></p>
            <div className={styles.radarWrap}>
              <svg viewBox="0 0 160 160" className={styles.radarSvg}>
                {/* Grid rings */}
                {radarGrid.map((g, gi) => (
                  <polygon key={gi}
                    points={g.pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
                    fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.8"
                  />
                ))}
                {/* Axis lines */}
                {radarAxes.map(a => {
                  const tip = polarToCartesian(cx, cy, maxR, a.deg);
                  return <line key={a.key} x1={cx} y1={cy} x2={tip.x.toFixed(1)} y2={tip.y.toFixed(1)} stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />;
                })}
                {/* Prakriti polygon */}
                <polygon
                  points={prakritPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
                  fill={primary ? COLORS[primary].vivid + '22' : 'rgba(212,175,55,0.12)'}
                  stroke={primary ? COLORS[primary].vivid : '#D4AF37'}
                  strokeWidth="1.5"
                  strokeDasharray="3 2"
                />
                {/* Vikriti polygon */}
                {vikriti && vikriti.primary && (
                  <motion.polygon
                    points={vikritiPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
                    fill={COLORS[vikriti.primary].vivid + '30'}
                    stroke={COLORS[vikriti.primary].vivid}
                    strokeWidth="2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                {/* Axis labels */}
                {radarAxes.map(a => {
                  const lpt = polarToCartesian(cx, cy, maxR + 12, a.deg);
                  return <text key={a.key} x={lpt.x.toFixed(1)} y={lpt.y.toFixed(1)} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill={COLORS[a.key].vivid} fontFamily="'Outfit', sans-serif" fontWeight="700">{a.label}</text>;
                })}
              </svg>

              {/* Radar legend */}
              <div className={styles.radarLegend}>
                <div className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: primary ? COLORS[primary].vivid : '#D4AF37', opacity: 0.6 }} />
                  <span className={styles.legendText}>Prakṛti (constitution)</span>
                </div>
                {vikriti && vikriti.primary && (
                  <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: COLORS[vikriti.primary].vivid }} />
                    <span className={styles.legendText}>{`Vikṛti — ${vikriti.imbalanceLevel} ${DOSHA_META[vikriti.primary].label}`}</span>
                  </div>
                )}
                {!vikriti && (
                  <div className={styles.legendItem}>
                    <span className={styles.legendText} style={{ color: 'rgba(212,175,55,0.7)' }}>✦ Doshas in relative balance</span>
                  </div>
                )}

                {metrics && (
                  <div className={styles.metricsRow}>
                    <div className={styles.metricChip}>
                      <span className={styles.metricEmoji}>🔥</span>
                      <span className={styles.metricVal}>{Math.round(metrics.agni)}%</span>
                      <span className={styles.metricKey}>Agni</span>
                    </div>
                    <div className={styles.metricChip}>
                      <span className={styles.metricEmoji}>✨</span>
                      <span className={styles.metricVal}>{Math.round(metrics.ojas)}%</span>
                      <span className={styles.metricKey}>Ojas</span>
                    </div>
                    <div className={styles.metricChip}>
                      <span className={styles.metricEmoji}>💧</span>
                      <span className={styles.metricVal}>{Math.round(metrics.ama)}%</span>
                      <span className={styles.metricKey}>Āma</span>
                    </div>
                  </div>
                )}

                <motion.button
                  className={styles.vikritiBtn}
                  onClick={() => router.push('/lifestyle/prakriti')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >Update Vikṛti Check-in</motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
