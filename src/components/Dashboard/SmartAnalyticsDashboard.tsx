'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getTodayLogStory, type DailyLogEntry } from '@/components/Dashboard/SmartLogBubbles';
import { useLifestyleEngine } from '@/hooks/useLifestyleEngine';
import { getLevelFromXP, getToday } from '@/stores/lifestyleStore';

export default function SmartAnalyticsDashboard({ globalBg }: { globalBg?: string }) {
  const [logStory, setLogStory] = useState<DailyLogEntry[]>([]);
  const [mounted, setMounted] = useState(false);
  const engine = useLifestyleEngine();

  useEffect(() => {
    setMounted(true);
    setLogStory(getTodayLogStory());
    const refresh = () => setLogStory(getTodayLogStory());
    window.addEventListener('focus', refresh);
    window.addEventListener('daily-log-story-updated', refresh);
    const timer = setInterval(refresh, 20_000);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('daily-log-story-updated', refresh);
      clearInterval(timer);
    };
  }, []);

  if (!mounted) return null;

  const { completedIds } = engine.getTodayStatus();
  const completionRate = engine.todayCompletionRate;
  const levelInfo = getLevelFromXP(engine.xp.total);
  const today = getToday();
  const todayXP = engine.xp.history.filter(h => h.date === today).reduce((s, h) => s + h.xp, 0);
  const habitsDone = engine.activeHabits.filter(h => completedIds.has(h.id));
  const maxStreak =
    engine.activeHabits.length > 0
      ? Math.max(0, ...engine.activeHabits.map(h => engine.getHabitStreak(h.id)))
      : 0;
  const ringColor = completionRate >= 80 ? '#4ade80' : completionRate >= 50 ? '#fbbf24' : '#60a5fa';
  const totalLogged = logStory.length + habitsDone.length;

  if (totalLogged === 0 && !engine.todayMood) return null;

  const stats = [
    { label: 'Logged', value: String(totalLogged), sub: 'activities', color: '#4ade80' },
    { label: 'Habits', value: `${Math.round(completionRate)}%`, sub: 'complete', color: ringColor },
    { label: 'XP', value: todayXP > 0 ? `+${todayXP}` : '0', sub: 'earned', color: '#fbbf24' },
    { label: 'Streak', value: maxStreak > 0 ? `${maxStreak}🔥` : '—', sub: 'days', color: '#fb923c' },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.5 }}
      style={{
        margin: '0 0.6rem 1.2rem',
        borderRadius: 26,
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid rgba(251,191,36,0.18)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      {/* Background */}
      {globalBg && (
        <div
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url('${globalBg}')`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            transform: 'scale(1.07)',
            filter: 'blur(2px) brightness(0.45) saturate(1.1)',
            zIndex: 0,
          }}
        />
      )}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(4,2,16,0.18) 0%, rgba(4,2,16,0.75) 100%)',
          zIndex: 1,
        }}
      />

      <div style={{ position: 'relative', zIndex: 2, padding: '0.9rem 1rem' }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.78rem' }}>
          <motion.span
            animate={{ opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 2.8, repeat: Infinity }}
            style={{ fontSize: '0.9rem' }}
          >📊</motion.span>
          <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#fbbf24', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>
            Today&apos;s Analytics
          </span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(251,191,36,0.3), transparent)' }} />
          {engine.todayMood && (
            <span style={{ fontSize: '1.1rem' }}>
              {['😢', '😔', '😐', '😊', '🤩'][engine.todayMood.mood - 1]}
            </span>
          )}
        </div>

        {/* ── Stats Grid ─────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.38rem', marginBottom: '0.85rem' }}>
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              style={{
                textAlign: 'center',
                padding: '0.52rem 0.2rem',
                borderRadius: 14,
                background: `${stat.color}10`,
                border: `1px solid ${stat.color}22`,
              }}
            >
              <p style={{ margin: 0, fontSize: '0.98rem', fontWeight: 900, color: stat.color, fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>
                {stat.value}
              </p>
              <p style={{ margin: '3px 0 0', fontSize: '0.44rem', color: 'rgba(255,255,255,0.28)', fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {stat.sub}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ── Smart Log Timeline (newest → oldest) ───────────────────────── */}
        {logStory.length > 0 && (
          <div style={{ marginBottom: habitsDone.length > 0 ? '0.72rem' : 0 }}>
            <p style={{ margin: '0 0 0.4rem', fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>
              ⚡ Smart Log · Newest First
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.28rem' }}>
              {[...logStory].reverse().map((entry, i) => {
                const timeStr = new Date(entry.loggedAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit', minute: '2-digit', hour12: true,
                });
                return (
                  <motion.div
                    key={`${entry.id}_timeline`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.55rem',
                      padding: '0.4rem 0.62rem', borderRadius: 12,
                      background: `${entry.color}0d`,
                      border: `1px solid ${entry.color}20`,
                    }}
                  >
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>{entry.icon}</span>
                    <p style={{ flex: 1, margin: 0, fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.86)', fontFamily: "'Outfit', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.label}
                    </p>
                    <span style={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.28)', fontFamily: "'Outfit', sans-serif", flexShrink: 0 }}>
                      {timeStr}
                    </span>
                    <span style={{ fontSize: '0.52rem', padding: '0.06rem 0.3rem', borderRadius: 99, background: `${entry.color}22`, color: entry.color, fontFamily: "'Outfit', sans-serif", fontWeight: 800, flexShrink: 0 }}>
                      ✓
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Habits Done Chips ──────────────────────────────────────────── */}
        {habitsDone.length > 0 && (
          <div>
            <p style={{ margin: '0 0 0.4rem', fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>
              🌿 Ayur Habits Done
            </p>
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
              {habitsDone.map(h => (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '0.25rem 0.55rem', borderRadius: 99,
                    background: 'rgba(74,222,128,0.1)',
                    border: '1px solid rgba(74,222,128,0.25)',
                  }}
                >
                  <span style={{ fontSize: '0.82rem' }}>{h.icon}</span>
                  <span style={{ fontSize: '0.6rem', color: '#4ade80', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                    {h.name}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Level + XP Footer ─────────────────────────────────────────── */}
        {levelInfo && (
          <div style={{ marginTop: '0.72rem', padding: '0.45rem 0.7rem', borderRadius: 11, background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.16)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1rem' }}>{levelInfo.icon}</span>
            <p style={{ margin: 0, flex: 1, fontSize: '0.7rem', fontWeight: 800, color: '#fbbf24', fontFamily: "'Outfit', sans-serif" }}>
              {levelInfo.name}
            </p>
            <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.24)', fontFamily: "'Outfit', sans-serif" }}>
              {engine.xp.total} XP total
            </span>
          </div>
        )}

      </div>
    </motion.div>
  );
}
