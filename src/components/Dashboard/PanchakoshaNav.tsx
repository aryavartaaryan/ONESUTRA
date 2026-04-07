'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import styles from './PanchakoshaNav.module.css';

// ── Kosha layer definitions ────────────────────────────────────────────────────
const KOSHAS = [
  {
    id: 'anna',
    label: 'Annamaya',
    sub: 'Body · Food',
    symbol: '🌱',
    route: '/lifestyle/panchakosha',
    color: '#C9A84C',
    glow: 'rgba(201,168,76,0.45)',
    bg: 'rgba(139,105,20,0.18)',
    element: 'Earth',
    description: 'The physical body nourished by food. Āhāra, exercise & grounding.',
  },
  {
    id: 'prana',
    label: 'Prāṇamaya',
    sub: 'Energy · Breath',
    symbol: '🌊',
    route: '/pranayama',
    color: '#22D3EE',
    glow: 'rgba(34,211,238,0.45)',
    bg: 'rgba(8,145,178,0.18)',
    element: 'Water & Air',
    description: 'The vital sheath of prāṇa. Breathwork, rhythms & daily rituals.',
  },
  {
    id: 'mano',
    label: 'Manomaya',
    sub: 'Mind · Emotion',
    symbol: '🌸',
    route: '/bodhi-chat',
    color: '#F472B6',
    glow: 'rgba(244,114,182,0.45)',
    bg: 'rgba(190,24,93,0.18)',
    element: 'Water',
    description: 'The mental sheath. Emotions, memory & the quality of thought.',
  },
  {
    id: 'vijnana',
    label: 'Vijñānamaya',
    sub: 'Wisdom · Discernment',
    symbol: '✨',
    route: '/sadhana',
    color: '#D4AF37',
    glow: 'rgba(212,175,55,0.45)',
    bg: 'rgba(212,175,55,0.15)',
    element: 'Space',
    description: 'The wisdom sheath. Intellect, intuition & Vedic knowledge.',
  },
  {
    id: 'ananda',
    label: 'Ānandamaya',
    sub: 'Bliss · Pure Being',
    symbol: '🪷',
    route: '/dhyan-kshetra',
    color: '#A78BFA',
    glow: 'rgba(167,139,250,0.45)',
    bg: 'rgba(124,58,237,0.18)',
    element: 'Ether',
    description: 'The bliss sheath. Deep meditation, Samādhi & pure consciousness.',
  },
] as const;

// ── Component ──────────────────────────────────────────────────────────────────
export default function PanchakoshaNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [hoveredKosha, setHoveredKosha] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const activeKosha = KOSHAS.find(k => pathname?.startsWith(k.route)) ?? null;

  return (
    <>
      {/* ── Desktop: fixed left floating dock ── */}
      <div className={styles.desktopDock}>
        <motion.div
          className={styles.dockWrap}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Collapse/expand toggle */}
          <motion.button
            className={styles.dockToggle}
            onClick={() => setIsExpanded(v => !v)}
            whileTap={{ scale: 0.92 }}
            title={isExpanded ? 'Collapse Panchakosha Nav' : 'Expand Panchakosha Nav'}
          >
            <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
              {isExpanded ? '◂' : '▸'}
            </motion.span>
          </motion.button>

          {KOSHAS.map((kosha, idx) => {
            const isActive = activeKosha?.id === kosha.id;
            const isHovered = hoveredKosha === kosha.id;

            return (
              <motion.div
                key={kosha.id}
                className={styles.koshaItem}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + idx * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                onMouseEnter={() => setHoveredKosha(kosha.id)}
                onMouseLeave={() => setHoveredKosha(null)}
              >
                {/* Icon button */}
                <motion.div
                  className={styles.koshaBtn}
                  style={{
                    background: isActive ? kosha.bg : 'rgba(255,255,255,0.04)',
                    borderColor: isActive ? `${kosha.color}60` : 'rgba(255,255,255,0.09)',
                    boxShadow: isActive ? `0 0 16px ${kosha.glow}` : 'none',
                  }}
                  animate={isActive ? {
                    boxShadow: [`0 0 10px ${kosha.glow}`, `0 0 20px ${kosha.glow}`, `0 0 10px ${kosha.glow}`],
                  } : {}}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <motion.span
                    className={styles.koshaSymbol}
                    animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >{kosha.symbol}</motion.span>
                </motion.div>

                {/* Expanded label */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      className={styles.koshaLabel}
                      initial={{ opacity: 0, x: -8, width: 0 }}
                      animate={{ opacity: 1, x: 0, width: 'auto' }}
                      exit={{ opacity: 0, x: -8, width: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                      <p className={styles.koshaName} style={{ color: isActive ? kosha.color : 'rgba(255,255,255,0.65)' }}>{kosha.label}</p>
                      <p className={styles.koshaSub}>{kosha.sub}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Tooltip on hover (when collapsed) */}
                <AnimatePresence>
                  {isHovered && !isExpanded && (
                    <motion.div
                      className={styles.tooltip}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.18 }}
                      style={{ borderColor: `${kosha.color}40`, background: 'rgba(5,5,28,0.96)' }}
                    >
                      <p className={styles.tooltipTitle} style={{ color: kosha.color }}>{kosha.symbol} {kosha.label}</p>
                      <p className={styles.tooltipSub}>{kosha.element} · {kosha.sub}</p>
                      <p className={styles.tooltipDesc}>{kosha.description}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Active indicator line */}
                {isActive && (
                  <motion.div
                    className={styles.activeIndicator}
                    layoutId="kosha-active"
                    style={{ background: kosha.color }}
                  />
                )}
              </motion.div>
            );
          })}

          {/* Vertical thread connecting the koshas */}
          <div className={styles.dockThread} />
        </motion.div>
      </div>

      {/* ── Mobile: horizontal bottom strip above nav ── */}
      <motion.div
        className={styles.mobileStrip}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className={styles.stripScroll}>
          {KOSHAS.map((kosha) => {
            const isActive = activeKosha?.id === kosha.id;
            return (
              <motion.div
                key={kosha.id}
                className={styles.stripItem}
                style={{
                  background: isActive ? kosha.bg : 'rgba(255,255,255,0.04)',
                  borderColor: isActive ? `${kosha.color}55` : 'rgba(255,255,255,0.09)',
                  boxShadow: isActive ? `0 0 14px ${kosha.glow}` : 'none',
                }}
              >
                <span className={styles.stripSymbol}>{kosha.symbol}</span>
                <span className={styles.stripLabel} style={{ color: isActive ? kosha.color : 'rgba(255,255,255,0.4)' }}>
                  {kosha.label.split('maya')[0]}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}
