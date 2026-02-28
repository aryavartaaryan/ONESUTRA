'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import JustVibeLogo from '@/components/JustVibeLogo';
import PremiumHeader from '@/components/PremiumHeader/PremiumHeader';
import styles from './page.module.css';


// ════════════════════════════════════════════════════════
//  VIBE ENERGY BODY — generative animated avatar canvas
// ════════════════════════════════════════════════════════
type Dosha = 'vata' | 'pitta' | 'kapha';

function drawEnergyBody(canvas: HTMLCanvasElement, dosha: Dosha, time: number) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    ctx.clearRect(0, 0, W, H);

    // Colour palette by Prakriti
    const palette = {
        vata: ['#9d4edd', '#c77dff', '#64b5f6', '#7b2ff7'],
        pitta: ['#ff6b35', '#ffd60a', '#ff4500', '#ff9b00'],
        kapha: ['#40916c', '#52b788', '#2166ac', '#74c69d'],
    }[dosha];

    // Outer radiant aura
    const aura = ctx.createRadialGradient(cx, cy, 10, cx, cy, W * 0.48);
    aura.addColorStop(0, palette[0] + '22');
    aura.addColorStop(0.6, palette[1] + '11');
    aura.addColorStop(1, 'transparent');
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, W, H);

    // Breathing ring layers
    for (let ring = 0; ring < 4; ring++) {
        const phase = time * (0.4 + ring * 0.2) + ring * 0.8;
        const r = (W * 0.12 * (ring + 1)) + Math.sin(phase) * 6;
        const g = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r);
        g.addColorStop(0, 'transparent');
        g.addColorStop(0.5, palette[ring % palette.length] + '18');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(1, r), 0, Math.PI * 2);
        ctx.fill();
    }

    // Flowing energy tendrils
    if (dosha === 'vata') {
        for (let a = 0; a < 5; a++) {
            ctx.beginPath();
            for (let i = 0; i < 60; i++) {
                const t = i / 60;
                const angle = t * 4 + time * 0.6 + (a / 5) * Math.PI * 2;
                const rad = t * W * 0.42 + Math.sin(time * 1.5 + a) * 5;
                const x = cx + Math.cos(angle) * rad;
                const y = cy + Math.sin(angle) * rad;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = palette[a % palette.length] + '44';
            ctx.lineWidth = 1.2;
            ctx.stroke();
        }
    }
    if (dosha === 'pitta') {
        for (let r = 1; r < 6; r++) {
            const phase = (time * 2 + r * 0.9) % (Math.PI * 2);
            const rad = Math.max(1, (r / 6) * W * 0.42 + Math.sin(phase) * 7);
            ctx.beginPath();
            ctx.arc(cx, cy, rad, 0, Math.PI * 2);
            ctx.strokeStyle = palette[r % palette.length] + '40';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }
    if (dosha === 'kapha') {
        for (let b = 0; b < 5; b++) {
            const t = time * 0.2 + b * 1.3;
            const bx = cx + Math.cos(t) * W * 0.18;
            const by = cy + Math.sin(t * 0.75) * H * 0.18;
            const br = Math.max(2, W * (0.18 + 0.04 * Math.sin(t * 0.5)));
            const gb = ctx.createRadialGradient(bx, by, 0, bx, by, br);
            gb.addColorStop(0, palette[b % palette.length] + '88');
            gb.addColorStop(1, 'transparent');
            ctx.fillStyle = gb;
            ctx.beginPath();
            ctx.ellipse(bx, by, br, Math.max(2, br * 1.1), t * 0.15, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Central core — OM glyph using canvas text
    ctx.globalCompositeOperation = 'source-over';
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.12);
    coreGrad.addColorStop(0, palette[0] + 'cc');
    coreGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, W * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Clip to soft circle
    ctx.globalCompositeOperation = 'destination-in';
    const clip = ctx.createRadialGradient(cx, cy, W * 0.25, cx, cy, W * 0.5);
    clip.addColorStop(0, 'rgba(0,0,0,1)');
    clip.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = clip;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
}

function VibeAvatarBody({ dosha, size = 210 }: { dosha: Dosha; size?: number }) {
    const ref = useRef<HTMLCanvasElement>(null);
    const raf = useRef<number>(0);
    const t = useRef(0);
    useEffect(() => {
        const c = ref.current;
        if (!c) return;
        c.width = size; c.height = size;
        const loop = () => {
            t.current += 0.014;
            drawEnergyBody(c, dosha, t.current);
            raf.current = requestAnimationFrame(loop);
        };
        raf.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf.current);
    }, [dosha, size]);
    return <canvas ref={ref} style={{ borderRadius: '50%', width: size, height: size }} />;
}

// ════════════════════════════════════════════════════════
//  DATA
// ════════════════════════════════════════════════════════
const PROFILE = {
    name: 'Yogi Aryan',
    title: 'Sattvik Seeker',
    joined: 'Feb 2025',
    prakriti: 'Vata-Pitta',
    dosha: 'vata' as Dosha,
    vibeConnections: 247,
    doshas: [
        { name: 'Vāta', value: 55, color: '#7E57C2', element: 'Space & Air', trait: 'Creative, Quick, Inspired' },
        { name: 'Pitta', value: 35, color: '#FF8A65', element: 'Fire & Water', trait: 'Focused, Passionate, Leader' },
        { name: 'Kapha', value: 10, color: '#66BB6A', element: 'Earth & Water', trait: 'Stable, Nurturing, Patient' },
    ],
    personality: 'Your dominant Vāta gives you bursts of creative inspiration and quick thinking. Channel it with routine and grounding practices. Your Pitta fire drives ambition — balance it with cooling foods and evening walks.',
    badges: [
        { id: 'riser', label: 'Early Riser', emoji: '🌅', earned: true },
        { id: 'sattvik', label: 'Sattvik', emoji: '🌿', earned: true },
        { id: 'calm', label: 'Calm Mind', emoji: '🪷', earned: true },
        { id: 'decision', label: 'Decisive', emoji: '⚡', earned: true },
        { id: 'mindful', label: 'Mindful', emoji: '🧘', earned: true },
        { id: 'streak7', label: '7-Day Streak', emoji: '🔥', earned: true },
        { id: 'scholar', label: 'Vedic Scholar', emoji: '📜', earned: false },
        { id: 'sangha', label: 'Vibe Builder', emoji: '〰️', earned: false },
    ],
    stats: [
        { label: 'Days Active', value: '14', unit: 'days' },
        { label: 'Meditations', value: '22', unit: 'sessions' },
        { label: 'Habits Done', value: '68', unit: '%' },
        { label: 'Focus Hours', value: '31', unit: 'hrs' },
    ],
    weekProgress: [60, 80, 45, 90, 70, 55, 85],
    savedDristi: ['🌅', '🌿', '🪷', '🌊', '🌸', '🪐'],
    activeSankalps: [
        { text: 'Morning System reboot (15 mins mediation)', done: true },
        { text: 'Enter Deep Work 9 pm', done: false },
        { text: 'Unproductive apps disconnection', done: false },
        { text: 'Listen ragas at least one time morning,evening & Noon to improve productivity', done: false },
    ],
};

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function ProfilePage() {
    const [tab, setTab] = useState<'dosha' | 'badges' | 'progress'>('dosha');
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('pranav_has_started');
        localStorage.removeItem('vedic_user_name');
        router.push('/');
    };

    return (
        <main className={styles.page}>
            {/* Premium Sticky Header */}
            <PremiumHeader
                title="Your Sanctuary"
                subtitle="Prakriti · Vibe · Journey"
                rightSlot={
                    <button className={styles.logoutBtn} onClick={handleLogout} title="Log Out" style={{ margin: 0, padding: '6px 12px', fontSize: '0.7rem' }}>
                        <LogOut size={14} />
                        Exit
                    </button>
                }
            />

            <div className={styles.content}>
                {/* ── Vibe Avatar Body (Energy Body) ── */}
                <motion.div
                    className={styles.hero}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                    {/* Generative Energy Body avatar */}
                    <div className={styles.energyBodyWrap}>
                        <motion.div
                            className={styles.energyBodyBreath}
                            animate={{ scale: [1, 1.04, 1], opacity: [0.85, 1, 0.85] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <VibeAvatarBody dosha={PROFILE.dosha} size={110} />
                        </motion.div>
                        {/* OM overlay */}
                        <span className={styles.avatarOmOverlay}>ॐ</span>
                    </div>
                    <div className={styles.heroInfo}>
                        <h1 className={styles.heroName}>{PROFILE.name}</h1>
                        <span className={styles.heroTitle}>{PROFILE.title}</span>
                        <span className={styles.heroPrakriti}>Prakriti: {PROFILE.prakriti}</span>
                        <span className={styles.heroJoined}>Member since {PROFILE.joined}</span>
                        {/* Vibe Connections */}
                        <div className={styles.vibeConnections}>
                            <span className={styles.vibeConnectionsCount}>{PROFILE.vibeConnections}</span>
                            <span className={styles.vibeConnectionsLabel}>Vibe Connections</span>
                        </div>
                    </div>
                </motion.div>

                {/* ── Stats row ── */}
                <motion.div className={styles.statsRow}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                >
                    {PROFILE.stats.map(s => (
                        <div key={s.label} className={styles.statCard}>
                            <span className={styles.statValue}>{s.value}</span>
                            <span className={styles.statUnit}>{s.unit}</span>
                            <span className={styles.statLabel}>{s.label}</span>
                        </div>
                    ))}
                </motion.div>

                {/* ── Frosted-glass cards row ── */}
                <motion.div className={styles.sanctuaryCards}
                    initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
                >
                    {/* Active Sankalps */}
                    <div className={styles.sanctuaryCard} style={{ width: '100%' }}>
                        <span className={styles.sanctuaryCardTitle}>🪔 Active Sankalps</span>
                        <div className={styles.sankalpsListCompact}>
                            {PROFILE.activeSankalps.map((s, i) => (
                                <div key={i} className={`${styles.sankalpRow} ${s.done ? styles.sankalpDone : ''}`}>
                                    <span className={styles.sankalpCheck}>{s.done ? '✓' : '○'}</span>
                                    <span className={styles.sankalpText}>{s.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* ── Tabs ── */}
                <motion.div className={styles.tabs}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    {(['dosha', 'badges', 'progress'] as const).map(t => (
                        <button key={t}
                            className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
                            onClick={() => setTab(t)}
                        >
                            {t === 'dosha' ? '🧬 Your Body Type' : t === 'badges' ? '🏅 Your Badges' : '📊 Progress Analytics'}
                        </button>
                    ))}
                </motion.div>

                {/* ── Dosha tab ── */}
                {tab === 'dosha' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.tabContent}>
                        <p className={styles.doshaIntro}>Your Tridosha constitution — the ancient map of your being</p>
                        {PROFILE.doshas.map(d => (
                            <div key={d.name} className={styles.doshaRow}>
                                <div className={styles.doshaLabel}>
                                    <span className={styles.doshaName}>{d.name}</span>
                                    <span className={styles.doshaElement}>{d.element}</span>
                                </div>
                                <div className={styles.doshaBarTrack}>
                                    <motion.div className={styles.doshaBarFill} style={{ background: d.color }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${d.value}%` }}
                                        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
                                    />
                                </div>
                                <span className={styles.doshaPct}>{d.value}%</span>
                                <p className={styles.doshaTrait}>{d.trait}</p>
                            </div>
                        ))}
                        <div className={styles.personalityBox}>
                            <span className={styles.personalityLabel}>Your Prakriti Insight</span>
                            <p className={styles.personalityText}>{PROFILE.personality}</p>
                        </div>
                    </motion.div>
                )}

                {/* ── Badges tab ── */}
                {tab === 'badges' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.tabContent}>
                        <p className={styles.doshaIntro}>Badges earned through your conscious living journey</p>
                        <div className={styles.badgeGrid}>
                            {PROFILE.badges.map(b => (
                                <div key={b.id} className={`${styles.badge} ${!b.earned ? styles.badgeLocked : ''}`}>
                                    <span className={styles.badgeEmoji}>{b.emoji}</span>
                                    <span className={styles.badgeLabel}>{b.label}</span>
                                    {!b.earned && <span className={styles.badgeLock}>🔒</span>}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── Progress tab ── */}
                {tab === 'progress' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.tabContent}>
                        <div className={styles.chartSection}>
                            <p className={styles.chartTitle}>This Week's Wellness Score</p>
                            <div className={styles.chart}>
                                {PROFILE.weekProgress.map((pct, i) => (
                                    <div key={i} className={styles.chartCol}>
                                        <div className={styles.chartBarTrack}>
                                            <motion.div className={styles.chartBar}
                                                initial={{ height: 0 }}
                                                animate={{ height: `${pct}%` }}
                                                transition={{ delay: i * 0.07, duration: 0.6, ease: 'easeOut' }}
                                            />
                                        </div>
                                        <span className={styles.chartDay}>{DAYS[i]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── Settings / Logout Bottom ── */}
                <div className={styles.logoutWrapper}>
                    <button className={styles.logoutBtn} onClick={handleLogout} title="Log Out">
                        <LogOut size={18} />
                        Log Out
                    </button>
                </div>
            </div>
        </main>
    );
}
