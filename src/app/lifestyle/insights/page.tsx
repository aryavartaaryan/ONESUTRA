'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Flame, Activity } from 'lucide-react';
import { useLifestyleEngine } from '@/hooks/useLifestyleEngine';
import { getNextLevel, LEVELS } from '@/stores/lifestyleStore';

// ─── Heatmap ─────────────────────────────────────────────────────────────────

function StreakHeatmap({ logs, color }: { logs: Array<{ date: string }>; color: string }) {
    const today = new Date();
    const cells = useMemo(() => {
        const logDates = new Set(logs.map(l => l.date));
        const result: Array<{ date: string; active: boolean; isToday: boolean }> = [];
        for (let i = 90; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            result.push({ date: dateStr, active: logDates.has(dateStr), isToday: i === 0 });
        }
        return result;
    }, [logs]);

    const weeks: typeof cells[] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    return (
        <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
            <div style={{ display: 'flex', gap: 3, minWidth: 'max-content' }}>
                {weeks.map((week, wi) => (
                    <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {week.map(cell => (
                            <motion.div key={cell.date}
                                whileTap={{ scale: 0.85 }}
                                title={cell.date}
                                style={{
                                    width: 13, height: 13, borderRadius: 3,
                                    background: cell.active ? color : 'rgba(255,255,255,0.06)',
                                    border: cell.isToday ? `1.5px solid ${color}` : 'none',
                                    boxShadow: cell.active ? `0 0 4px ${color}55` : 'none',
                                    transition: 'background 0.2s',
                                }} />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Radar Chart ──────────────────────────────────────────────────────────────

function RadarChart({ data }: { data: Array<{ label: string; value: number; color: string }> }) {
    const size = 200;
    const cx = size / 2;
    const cy = size / 2;
    const r = 75;
    const n = data.length;

    const angleStep = (2 * Math.PI) / n;
    const points = data.map((d, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const dist = (d.value / 100) * r;
        return { x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist };
    });
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

    const gridLevels = [0.25, 0.5, 0.75, 1.0];

    return (
        <svg width={size} height={size} style={{ overflow: 'visible' }}>
            {/* Grid */}
            {gridLevels.map(lvl => {
                const pts = data.map((_, i) => {
                    const a = i * angleStep - Math.PI / 2;
                    return `${cx + Math.cos(a) * r * lvl},${cy + Math.sin(a) * r * lvl}`;
                }).join(' ');
                return <polygon key={lvl} points={pts} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />;
            })}

            {/* Axis lines */}
            {data.map((_, i) => {
                const a = i * angleStep - Math.PI / 2;
                return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(a) * r} y2={cy + Math.sin(a) * r} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />;
            })}

            {/* Data shape */}
            <motion.path initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
                d={pathD} fill="rgba(168,85,247,0.18)" stroke="#a855f7" strokeWidth={1.5} />

            {/* Labels */}
            {data.map((d, i) => {
                const a = i * angleStep - Math.PI / 2;
                const lx = cx + Math.cos(a) * (r + 18);
                const ly = cy + Math.sin(a) * (r + 18);
                return (
                    <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                        style={{ fontSize: 9, fill: d.color, fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                        {d.label}
                    </text>
                );
            })}

            {/* Dots */}
            {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={3} fill={data[i].color} />
            ))}
        </svg>
    );
}

// ─── Mood Trend Chart ─────────────────────────────────────────────────────────

function MoodTrendLine({ moods }: { moods: Array<{ date: string; score: number }> }) {
    const recent = moods.slice(-30);
    if (recent.length < 2) return <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', fontFamily: "'Outfit', sans-serif", textAlign: 'center', padding: '1rem' }}>Need more mood data to display trend.</p>;

    const w = 280, h = 70;
    const min = Math.min(...recent.map(m => m.score));
    const max = Math.max(...recent.map(m => m.score));
    const range = max - min || 1;

    const pts = recent.map((m, i) => {
        const x = (i / (recent.length - 1)) * w;
        const y = h - ((m.score - min) / range) * (h - 10) - 5;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={w} height={h} style={{ overflow: 'visible' }}>
            <defs>
                <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c084fc" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={`M ${pts} L ${w},${h} L 0,${h} Z`} fill="url(#moodGrad)" />
            <motion.polyline initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: 'easeOut' }}
                points={pts} fill="none" stroke="#c084fc" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                style={{ pathLength: 1 }} />
        </svg>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string | number; sub?: string; color: string }) {
    const safeValue = (typeof value === 'number' && isNaN(value)) ? '0' : value;
    return (
        <div style={{ padding: '1rem 1rem', borderRadius: 18, background: `${color}0e`, border: `1px solid ${color}28`, flex: 1, minWidth: 0 }}>
            <p style={{ margin: '0 0 0.3rem', fontSize: '1.3rem' }}>{icon}</p>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color, fontFamily: "'Outfit', sans-serif", lineHeight: 1.1 }}>{safeValue}</p>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.68rem', color: 'rgba(255,255,255,0.42)', fontFamily: "'Outfit', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
            {sub && <p style={{ margin: '0.15rem 0 0', fontSize: '0.65rem', color: 'rgba(255,255,255,0.28)', fontFamily: "'Outfit', sans-serif" }}>{sub}</p>}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InsightsPage() {
    const router = useRouter();
    const {
        habits, habitLogs, streaks, moodLogs, mantraSessions, breathingSessions,
        meditationSessions, journalEntries, profile, xp,
    } = useLifestyleEngine();

    const today = new Date().toISOString().split('T')[0];

    // ── Compute stats ──────────────────────────────────────────────────────────

    const totalHabitLogs = habitLogs.length;
    const longestStreak = Object.values(streaks).reduce((m, s) => Math.max(m, s.longestStreak ?? 0), 0);
    const bestStreakHabit = Object.entries(streaks).reduce((best, [id, s]) => {
        if (!best || (s.longestStreak ?? 0) > (best[1].longestStreak ?? 0)) return [id, s] as const;
        return best;
    }, null as null | readonly [string, (typeof streaks)[string]]);

    const avgMood = moodLogs.length > 0
        ? (moodLogs.reduce((s, m) => s + m.mood, 0) / moodLogs.length).toFixed(1)
        : '–';

    const totalMinutesMeditated = meditationSessions.reduce((a, s) => a + (s.durationMinutes ?? 0), 0);
    const totalMinutesBreathing = breathingSessions.reduce((a, s) => a + (s.durationMinutes ?? 0), 0);
    const totalMantraReps = mantraSessions.reduce((a, s) => a + (s.repetitionCount ?? 0), 0);
    const journalWordCount = journalEntries.reduce((a, e) => a + (e.content ?? '').split(/\s+/).filter(Boolean).length, 0);

    // ── Life area scores (out of 100) ─────────────────────────────────────────
    const last30Days = new Set(
        habitLogs
            .filter(l => {
                const d = new Date(l.loggedAt);
                const diff = (Date.now() - d.getTime()) / 86400000;
                return diff <= 30 && l.completed;
            })
            .map(l => l.habitId)
    );

    const lifeAreaScores = useMemo(() => {
        const areas: Record<string, { total: number; done: number }> = {};
        habits.forEach(h => {
            if (!areas[h.lifeArea]) areas[h.lifeArea] = { total: 0, done: 0 };
            areas[h.lifeArea].total += 30;
        });
        habitLogs.filter(l => {
            const diff = (Date.now() - new Date(l.loggedAt).getTime()) / 86400000;
            return diff <= 30 && l.completed;
        }).forEach(l => {
            const habit = habits.find(h => h.id === l.habitId);
            if (habit && areas[habit.lifeArea]) areas[habit.lifeArea].done++;
        });
        return Object.entries(areas).map(([area, { total, done }]) => ({
            label: area.charAt(0).toUpperCase() + area.slice(1).slice(0, 5),
            value: total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 20,
            color: ({
                mental: '#22d3ee', physical: '#4ade80', spiritual: '#c084fc',
                social: '#fb923c', professional: '#fbbf24',
                financial: '#4ade80', creative: '#f472b6',
            } as Record<string, string>)[area] ?? '#a78bfa',
        }));
    }, [habits, habitLogs]);

    // ── Habit completion last 7 days ──────────────────────────────────────────
    const last7DayStats = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dateStr = d.toISOString().split('T')[0];
            const done = habitLogs.filter(l => l.date === dateStr && l.completed).length;
            const total = habits.filter(h => h.isActive).length;
            return { date: dateStr, day: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d.getDay()], done, total, pct: total > 0 ? done / total : 0 };
        });
    }, [habitLogs, habits]);

    // ── Mood over time ────────────────────────────────────────────────────────
    const moodTimeline = useMemo(() => {
        return moodLogs.slice(-30).map(m => ({ date: m.date, score: m.mood }));
    }, [moodLogs]);

    // ── All-time logs for heatmap ─────────────────────────────────────────────
    const allCompletionDates = useMemo(() => habitLogs.filter(l => l.completed), [habitLogs]);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(ellipse at 70% 0%, rgba(168,85,247,0.1) 0%, transparent 55%), #030110',
            paddingBottom: '4rem',
            fontFamily: "'Outfit', sans-serif",
        }}>
            {/* Header */}
            <div style={{ padding: '1.25rem 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button onClick={() => router.back()}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, padding: 0 }}>
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>Insights</h1>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif" }}>Your 90-day practice mirror</p>
                </div>
            </div>

            <div style={{ padding: '1.25rem' }}>

                {/* ── Real-time today strip ─────────────────────────────── */}
                {profile?.onboardingComplete && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
                    {[
                      { label: 'Today XP', value: `+${xp?.history?.filter(h => h.date === today).reduce((s, h) => s + (h.xp ?? 0), 0) ?? 0}`, color: '#fbbf24', icon: '⭐' },
                      { label: 'Done Today', value: `${habitLogs.filter(l => l.date === today && l.completed).length}/${habits.filter(h => h.isActive).length}`, color: '#4ade80', icon: '✅' },
                      { label: 'Level', value: xp?.level ?? 1, color: '#c084fc', icon: '🏅' },
                      { label: 'Total XP', value: (xp?.total ?? 0).toLocaleString(), color: '#a78bfa', icon: '💎' },
                    ].map(s => (
                      <div key={s.label} style={{ flexShrink: 0, padding: '0.72rem 1rem', borderRadius: 14, background: `${s.color}10`, border: `1px solid ${s.color}28`, textAlign: 'center', minWidth: 80 }}>
                        <p style={{ margin: '0 0 2px', fontSize: '1.2rem' }}>{s.icon}</p>
                        <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: s.color, fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>{s.value}</p>
                        <p style={{ margin: '3px 0 0', fontSize: '0.65rem', color: 'rgba(255,255,255,0.38)', fontFamily: "'Outfit', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Top stats row */}
                <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
                    <StatCard icon="🔥" label="Best Streak" value={longestStreak} sub={bestStreakHabit ? habits.find(h => h.id === bestStreakHabit[0])?.name?.slice(0, 14) : undefined} color="#f97316" />
                    <StatCard icon="✅" label="Total Logs" value={totalHabitLogs} color="#4ade80" />
                    <StatCard icon="😊" label="Avg Mood" value={avgMood} sub="out of 5" color="#c084fc" />
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem' }}>
                    <StatCard icon="🧘" label="Min Meditated" value={isNaN(totalMinutesMeditated) ? 0 : totalMinutesMeditated} color="#a78bfa" />
                    <StatCard icon="🙏" label="Mantra Reps" value={isNaN(totalMantraReps) ? '0' : totalMantraReps.toLocaleString()} color="#fbbf24" />
                    <StatCard icon="✍️" label="Words Written" value={isNaN(journalWordCount) ? '0' : journalWordCount.toLocaleString()} color="#4ade80" />
                </div>

                {/* XP / Level */}
                {xp && (
                    <div style={{ padding: '1rem 1.1rem', borderRadius: 16, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.22)', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <span style={{ fontSize: '1.4rem' }}>⭐</span>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>Level {xp.level}</p>
                                    <p style={{ margin: 0, fontSize: '0.68rem', color: 'rgba(255,255,255,0.38)', fontFamily: "'Outfit', sans-serif" }}>{(xp.total ?? 0).toLocaleString()} XP total</p>
                                </div>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#c084fc', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                                {getNextLevel(xp.total) ? `${(getNextLevel(xp.total)!.minXP - xp.total)} XP to next` : 'Max Level 🏆'}
                            </p>
                        </div>
                        <div style={{ height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (() => { const nl = getNextLevel(xp.total); const pl = nl ? LEVELS.find((_, i) => LEVELS[i + 1]?.minXP === nl.minXP) : null; const base = pl?.minXP ?? 0; const range = (nl?.minXP ?? xp.total + 1) - base; return range > 0 ? ((xp.total - base) / range) * 100 : 100; })())}%` }}
                                transition={{ duration: 1.2, ease: 'easeOut' }}
                                style={{ height: '100%', background: 'linear-gradient(90deg, #a855f7, #7c3aed)', borderRadius: 4 }}
                            />
                        </div>
                    </div>
                )}

                {/* 7-day bar chart */}
                <div style={{ padding: '1rem', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.25rem' }}>
                    <p style={{ margin: '0 0 0.85rem', fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.48)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.12em', textTransform: 'uppercase' }}>7-Day Completion</p>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', height: 60 }}>
                        {last7DayStats.map(day => (
                            <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: Math.max(4, day.pct * 52) }}
                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                    style={{
                                        width: '100%', borderRadius: 4,
                                        background: day.pct > 0.7 ? '#4ade80' : day.pct > 0.4 ? '#fbbf24' : 'rgba(255,255,255,0.12)',
                                        boxShadow: day.pct > 0.7 ? '0 0 8px rgba(74,222,128,0.4)' : 'none',
                                    }} />
                                <p style={{ margin: 0, fontSize: '0.58rem', color: day.date === today ? '#c084fc' : 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif", fontWeight: day.date === today ? 800 : 400 }}>{day.day}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 90-day heatmap */}
                <div style={{ padding: '1rem', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.25rem' }}>
                    <p style={{ margin: '0 0 0.85rem', fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.48)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.12em', textTransform: 'uppercase' }}>90-Day Activity Map</p>
                    <StreakHeatmap logs={allCompletionDates} color="#a855f7" />
                </div>

                {/* Life area radar */}
                {lifeAreaScores.length >= 3 && (
                    <div style={{ padding: '1rem', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.25rem' }}>
                        <p style={{ margin: '0 0 0.85rem', fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.48)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.12em', textTransform: 'uppercase' }}>Life Balance Radar — Last 30 Days</p>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <RadarChart data={lifeAreaScores} />
                        </div>
                    </div>
                )}

                {/* Mood trend */}
                {moodTimeline.length > 2 && (
                    <div style={{ padding: '1rem', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                            <p style={{ margin: 0, fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.12em', textTransform: 'uppercase' }}>Mood Trend — 30 Days</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Activity size={12} style={{ color: '#c084fc' }} />
                                <span style={{ fontSize: '0.62rem', color: '#c084fc', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>avg {avgMood}/5</span>
                            </div>
                        </div>
                        <MoodTrendLine moods={moodTimeline} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' }}>
                            <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.2)', fontFamily: "'Outfit', sans-serif" }}>30d ago</span>
                            <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.2)', fontFamily: "'Outfit', sans-serif" }}>today</span>
                        </div>
                    </div>
                )}

                {/* Streak breakdown */}
                {Object.keys(streaks).length > 0 && (
                    <div style={{ padding: '1rem', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <p style={{ margin: '0 0 0.85rem', fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.48)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.12em', textTransform: 'uppercase' }}>Active Streaks</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {Object.entries(streaks)
                                .filter(([, s]) => s.currentStreak > 0)
                                .sort(([, a], [, b]) => b.currentStreak - a.currentStreak)
                                .slice(0, 8)
                                .map(([habitId, s]) => {
                                    const habit = habits.find(h => h.id === habitId);
                                    if (!habit) return null;
                                    return (
                                        <div key={habitId} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{habit.icon}</span>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>{habit.name}</p>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                                                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${Math.min(100, (s.currentStreak / 40) * 100)}%`, background: '#f97316', borderRadius: 2 }} />
                                                    </div>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f97316', fontFamily: "'Outfit', sans-serif", flexShrink: 0 }}>🔥{s.currentStreak}</span>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {habits.length === 0 && habitLogs.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', marginTop: '2rem' }}>
                        <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📊</p>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', fontFamily: "'Outfit', sans-serif", lineHeight: 1.7 }}>
                            Your insights will bloom here as you build your practice.<br />Start with one habit and log it for 7 days.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
