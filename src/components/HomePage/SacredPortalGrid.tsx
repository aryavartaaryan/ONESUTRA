'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, SkipBack, SkipForward } from 'lucide-react';

// ── Raag Modal ─────────────────────────────────────────────────────────────────
const TRACKS = [
    { title: "Raag Bhairav", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", time: "6–9 AM" },
    { title: "Raag Yaman", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", time: "6–9 AM" },
    { title: "Raag Malkauns", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", time: "6–9 PM" },
    { title: "Raag Darbari", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", time: "9 PM–12 AM" },
];
function RaagModal({ onClose }: { onClose: () => void }) {
    const audio = useRef<HTMLAudioElement | null>(null);
    const [playing, setPlaying] = useState(false);
    const [idx, setIdx] = useState(0);
    const [prog, setProg] = useState(0);
    useEffect(() => {
        const a = new Audio(); a.crossOrigin = 'anonymous';
        a.onended = () => setIdx(i => (i + 1) % TRACKS.length);
        a.ontimeupdate = () => setProg(a.duration ? a.currentTime / a.duration : 0);
        audio.current = a;
        const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', k);
        return () => { a.pause(); a.src = ''; window.removeEventListener('keydown', k); };
    }, [onClose]);
    useEffect(() => {
        const a = audio.current; if (!a) return;
        a.src = TRACKS[idx].src; a.load();
        if (playing) a.play().catch(() => setPlaying(false));
    }, [idx, playing]);
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', background: 'rgba(2,1,8,0.95)', backdropFilter: 'blur(24px)' }}>
            <div onClick={e => e.stopPropagation()} style={{ margin: 'auto', width: '88%', maxWidth: 360, background: 'linear-gradient(to bottom,rgba(192,132,252,0.15),transparent)', border: '1px solid rgba(192,132,252,0.3)', borderRadius: 22, padding: '1.75rem', textAlign: 'center', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
                <h2 style={{ margin: '0 0 0.3rem', color: '#fff', fontSize: '1.2rem' }}>{TRACKS[idx].title}</h2>
                <p style={{ color: '#c084fc', fontSize: '0.8rem', marginBottom: '1.2rem' }}>{TRACKS[idx].time}</p>
                <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, margin: '1.2rem 0', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${prog * 100}%`, background: '#c084fc', borderRadius: 2 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.4rem', alignItems: 'center' }}>
                    <button onClick={() => setIdx(i => (i - 1 + TRACKS.length) % TRACKS.length)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><SkipBack size={20} /></button>
                    <button onClick={() => { setPlaying(!playing); if (!playing) audio.current?.play(); else audio.current?.pause(); }}
                        style={{ width: 50, height: 50, borderRadius: '50%', background: '#c084fc', border: 'none', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        {playing ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: 3 }} />}
                    </button>
                    <button onClick={() => setIdx(i => (i + 1) % TRACKS.length)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><SkipForward size={20} /></button>
                </div>
            </div>
        </motion.div>
    );
}

// ── Orbit Items — 9 real features, clockwise from 12 o'clock ──────────────────
// Each maps to a crop region from the generated geode image sheets
// Image source + CSS background-position for sprite cropping
type OrbItem = {
    id: string; title: string; subtitle?: string; description?: string; href?: string; isModal?: boolean;
    color: string; glow: string; icon: string; shape: string;
};

const ORBIT_ITEMS: OrbItem[] = [
    { id: 'ai-acharya', title: 'AyurHealth', subtitle: 'Ayurvedic Guidance & Followup', description: 'Consult AI Ayurvedacharya Pranav — your personal Vedic health guide. Get Prakruti analysis, Ayurvedic remedies & sacred healing wisdom, available 24/7.', href: '/acharya-samvad', color: '#10b981', glow: '#059669', icon: '🌿✦', shape: '' },
    { id: 'dhyan', title: 'Meditate', subtitle: 'Energy Mantras & Stotras', description: 'Immerse in curated sacred mantras & guided meditations — find inner stillness with healing frequencies.', href: '/dhyan-kshetra', color: '#3b82f6', glow: '#2563eb', icon: '🧘', shape: '' },
    { id: 'outplugs', title: 'Inshorts', subtitle: 'Mindful News', description: 'Distraction-free mindful news — stay informed without the noise, curated through a conscious lens.', href: '/outplugs', color: '#d946ef', glow: '#a21caf', icon: '📰', shape: '' },
    { id: 'prana-raag', title: 'Raag Music', subtitle: 'Resonances', description: 'Ancient Indian classical ragas matched to the time of day — healing frequencies for every moment.', href: '/project-leela', color: '#38bdf8', glow: '#0284c7', icon: '🎵', shape: '' },
    { id: 'swadesi', title: 'Swadeshi', subtitle: 'Pure Organics', description: 'Discover authentic Indian artisan products — sacred commerce that honors tradition & empowers craftsmen.', href: '/swadesi-product', color: '#f97316', glow: '#ea580c', icon: '🛍️', shape: '' },
    { id: 'skills', title: 'Skills', subtitle: 'Upgrade & Transform', description: 'Unlock your potential with curated skill tracks — from ancient Vedic arts to modern tech. Learn, grow, and evolve with expert-guided paths tailored to your journey.', href: '/skills', color: '#22d3ee', glow: '#0891b2', icon: '🎯', shape: '' },
    { id: 'vedic-games', title: 'Games', subtitle: 'Productive Play', description: 'Vedic-inspired mindful games — sharpen your mind while connecting with ancient Indian wisdom.', href: '/vedic-games', color: '#ec4899', glow: '#be185d', icon: '🎲', shape: '' },
    {
        id: 'pranaverse',
        title: 'PranaVerse',
        subtitle: 'Resonance Feeds & Network',
        description: 'PranaVerse — the sacred conscious social network. Share your Prana, discover sacred wisdom reels, connect with seekers worldwide, and raise collective vibration.',
        href: '/pranaverse',
        color: '#a78bfa',
        glow: '#7c3aed',
        icon: '✦',
        shape: '',
    },
    { id: 'gurukul', title: 'Gurukul', subtitle: 'World-Class Wisdom', description: '🏛️ World\'s Premier Gurukul — AI, Mathematics & Modern Sciences + Bhagavat Gita, Upanishads, Sanskrit Vyakaran, Darshan & Vedic wisdom. We also provide Startup Support: ideas, product development & launch.', href: '/vedic-sangrah', color: '#f59e0b', glow: '#d97706', icon: '🪔✦', shape: '' },
    { id: 'lifestyle', title: 'Lifestyle', subtitle: 'Sacred Daily Practices', description: 'Your personalised AI-powered lifestyle sanctuary — habits, mantra sadhana, pranayama, journaling, mood tracking, streaks & your wise AI companion guiding every step of your sacred daily practice.', href: '/', color: '#c084fc', glow: '#9333ea', icon: '🌱', shape: '' },
    { id: 'ayurveda', title: 'Ayurveda', subtitle: 'Prakriti & Dosha OS', description: 'Discover your Ayurvedic body constitution (Prakriti), track daily rituals with the Dinacharya board, get dosha-aware habits, and chat with Bodhi Vaidya — your personal Ayurvedic wisdom guide.', href: '/lifestyle/prakriti', color: '#fb923c', glow: '#ea580c', icon: '🪷✦', shape: '' },
];


// ── Deterministic trapped air micro-bubbles per orb (SSR-safe) ───────────────
const MICRO_BUBBLES: { x: number; y: number; r: number }[][] = [
    [{ x: 24, y: 62, r: 3.2 }, { x: 68, y: 70, r: 2.4 }, { x: 45, y: 78, r: 1.8 }, { x: 72, y: 55, r: 1.5 }],
    [{ x: 30, y: 58, r: 2.8 }, { x: 62, y: 68, r: 2.2 }, { x: 52, y: 76, r: 3.0 }, { x: 22, y: 72, r: 1.6 }],
    [{ x: 35, y: 64, r: 2.5 }, { x: 58, y: 72, r: 3.2 }, { x: 74, y: 60, r: 1.8 }, { x: 28, y: 75, r: 2.0 }],
    [{ x: 42, y: 60, r: 3.0 }, { x: 26, y: 70, r: 2.0 }, { x: 62, y: 75, r: 2.6 }, { x: 70, y: 58, r: 1.4 }],
    [{ x: 20, y: 66, r: 2.6 }, { x: 55, y: 72, r: 3.4 }, { x: 72, y: 64, r: 2.0 }, { x: 38, y: 78, r: 1.8 }],
    [{ x: 32, y: 60, r: 3.0 }, { x: 60, y: 70, r: 2.2 }, { x: 48, y: 76, r: 2.8 }, { x: 75, y: 56, r: 1.6 }],
    [{ x: 26, y: 68, r: 2.4 }, { x: 62, y: 62, r: 3.2 }, { x: 44, y: 74, r: 2.0 }, { x: 70, y: 72, r: 1.8 }],
    [{ x: 38, y: 62, r: 2.8 }, { x: 22, y: 74, r: 2.2 }, { x: 66, y: 66, r: 3.0 }, { x: 54, y: 78, r: 1.5 }],
    [{ x: 28, y: 64, r: 3.4 }, { x: 56, y: 70, r: 2.0 }, { x: 70, y: 58, r: 2.6 }, { x: 40, y: 76, r: 1.8 }],
];

// ── Ultra-Transparent Prismatic Crystal Sacred Planet ───────────────────────
function GeodeOrb({ item, sz, idx }: { item: OrbItem; sz: number; idx: number }) {
    const d = sz * 1.24;
    const bubbles = MICRO_BUBBLES[idx % MICRO_BUBBLES.length];
    const subWords = (item.subtitle || '').split(' ');
    const mid = Math.ceil(subWords.length / 2);
    const line1 = subWords.slice(0, mid).join(' ');
    const line2 = subWords.slice(mid).join(' ');

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: sz * 0.09,
        }}>
            {/* ════ ULTRA-TRANSPARENT CRYSTAL BUBBLE ════ */}
            <div style={{
                width: d, height: d,
                borderRadius: '50%',
                position: 'relative',
                // Near-zero opacity base — pure glass effect
                background: [
                    `radial-gradient(circle at 30% 22%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 28%, transparent 60%)`,
                    `radial-gradient(circle at 70% 75%, ${item.color}22 0%, ${item.color}08 40%, transparent 70%)`,
                    `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 80%)`,
                ].join(','),
                backdropFilter: 'blur(28px) saturate(220%) brightness(1.25)',
                WebkitBackdropFilter: 'blur(28px) saturate(220%) brightness(1.25)',
                // Crystal-clear border with prismatic shimmer
                border: `1px solid rgba(255,255,255,0.30)`,
                boxShadow: [
                    `0 0 ${d * 0.5}px ${item.color}28`,                       // soft colored outer halo
                    `0 0 ${d * 0.18}px rgba(255,255,255,0.12)`,               // white rim glow
                    `0 ${d * 0.08}px ${d * 0.28}px rgba(0,0,0,0.38)`,        // subtle depth shadow
                    `inset 0 ${d * 0.06}px ${d * 0.22}px rgba(255,255,255,0.22)`,   // top inner light
                    `inset 0 -${d * 0.04}px ${d * 0.14}px ${item.color}18`,          // color aurora base
                    `inset 0 0 ${d * 0.40}px rgba(255,255,255,0.04)`,         // inner ambient
                ].join(','),
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                overflow: 'hidden',
                flexShrink: 0,
            }}>
                {/* ── Bright specular crescent (top-left) — hallmark of glass ── */}
                <div style={{
                    position: 'absolute',
                    top: '4%', left: '7%',
                    width: '52%', height: '36%',
                    background: 'radial-gradient(ellipse at 40% 40%, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.28) 38%, transparent 72%)',
                    borderRadius: '50%',
                    transform: 'rotate(-32deg)',
                    filter: 'blur(2px)',
                    pointerEvents: 'none',
                }} />

                {/* ── Sharp white specular sparkle dot ── */}
                <div style={{
                    position: 'absolute',
                    top: '9%', left: '16%',
                    width: '12%', height: '9%',
                    background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.4) 40%, transparent 100%)',
                    borderRadius: '50%',
                    filter: 'blur(0.5px)',
                    pointerEvents: 'none',
                }} />

                {/* ── Prismatic rainbow rim shimmer (thin arc along top edge) ── */}
                <div style={{
                    position: 'absolute',
                    top: '1%', left: '10%', right: '10%',
                    height: '18%',
                    background: `conic-gradient(from 180deg, ${item.color}55, rgba(255,180,255,0.25), rgba(100,220,255,0.30), rgba(255,240,100,0.20), ${item.color}55)`,
                    borderRadius: '50%',
                    filter: 'blur(3px)',
                    opacity: 0.7,
                    pointerEvents: 'none',
                }} />

                {/* ── Item-color aurora pool at bottom ── */}
                <div style={{
                    position: 'absolute', bottom: '-5%', left: '5%', right: '5%',
                    height: '55%',
                    background: `radial-gradient(ellipse at center bottom, ${item.color}30 0%, ${item.color}12 45%, transparent 80%)`,
                    filter: 'blur(10px)',
                    pointerEvents: 'none',
                }} />

                {/* ── Secondary soft reflection (bottom right) ── */}
                <div style={{
                    position: 'absolute',
                    bottom: '8%', right: '8%',
                    width: '30%', height: '22%',
                    background: 'radial-gradient(ellipse, rgba(255,255,255,0.14) 0%, transparent 80%)',
                    borderRadius: '50%',
                    filter: 'blur(3px)',
                    pointerEvents: 'none',
                }} />

                {/* ── Translucent trapped air micro-bubbles (crystal-clear) ── */}
                {bubbles.map((b, j) => (
                    <div key={j} style={{
                        position: 'absolute',
                        left: `${b.x}%`, top: `${b.y}%`,
                        width: b.r * 2, height: b.r * 2,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.70) 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
                        border: '0.5px solid rgba(255,255,255,0.38)',
                        boxShadow: `inset 0 0.5px 1.5px rgba(255,255,255,0.55), 0 0 ${b.r * 1.2}px rgba(255,255,255,0.10)`,
                        pointerEvents: 'none',
                    }} />
                ))}

                {/* ── Icon — premium SVGs for PranaVerse, AI Acharya, GuruKul; emoji for others ── */}
                {item.icon === '✦' ? (
                    /* ── PranaVerse: radiating orbit ── */
                    <svg width={sz * 0.48} height={sz * 0.48} viewBox="0 0 48 48" fill="none"
                        style={{ position: 'relative', zIndex: 2, filter: `drop-shadow(0 0 ${sz * 0.14}px ${item.color}) drop-shadow(0 0 ${sz * 0.07}px rgba(100,200,255,0.8))` }}>
                        <circle cx="24" cy="24" r="21" stroke={item.color} strokeWidth="0.7" strokeOpacity="0.45" strokeDasharray="3 2" />
                        <circle cx="24" cy="24" r="15" stroke={item.color} strokeWidth="1" strokeOpacity="0.65" />
                        <circle cx="24" cy="24" r="6.5" fill={`${item.color}55`} />
                        <circle cx="24" cy="24" r="4.5" fill={`${item.color}cc`} />
                        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, k) => {
                            const rad = deg * Math.PI / 180;
                            const x1 = 24 + Math.cos(rad) * 8;
                            const y1 = 24 + Math.sin(rad) * 8;
                            const x2 = 24 + Math.cos(rad) * (k % 2 === 0 ? 19 : 14);
                            const y2 = 24 + Math.sin(rad) * (k % 2 === 0 ? 19 : 14);
                            return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2}
                                stroke={item.color} strokeWidth={k % 2 === 0 ? "1.6" : "0.9"} strokeOpacity={k % 2 === 0 ? 1.0 : 0.6}
                                strokeLinecap="round" />;
                        })}
                        {[0, 90, 180, 270].map((deg, k) => {
                            const rad = deg * Math.PI / 180;
                            return <circle key={k} cx={24 + Math.cos(rad) * 22} cy={24 + Math.sin(rad) * 22} r="2" fill={item.color} fillOpacity="0.9" />;
                        })}
                        <circle cx="24" cy="24" r="2" fill="#fff" fillOpacity="1" />
                    </svg>
                ) : item.icon === '🌿✦' ? (
                    /* ── AI Ayurvedacharya Pranav: lotus-leaf healing mandala ── */
                    <svg width={sz * 0.50} height={sz * 0.50} viewBox="0 0 48 48" fill="none"
                        style={{ position: 'relative', zIndex: 2, filter: `drop-shadow(0 0 ${sz * 0.14}px ${item.color}) drop-shadow(0 0 ${sz * 0.08}px rgba(100,255,180,0.7))` }}>
                        <circle cx="24" cy="24" r="21" stroke={item.color} strokeWidth="0.7" strokeOpacity="0.45" strokeDasharray="2.5 2" />
                        {[0, 60, 120, 180, 240, 300].map((deg, k) => {
                            const rad = deg * Math.PI / 180;
                            const cx2 = 24 + Math.cos(rad) * 11;
                            const cy2 = 24 + Math.sin(rad) * 11;
                            return (
                                <ellipse key={k}
                                    cx={cx2} cy={cy2}
                                    rx="4.5" ry="7.5"
                                    fill={`${item.color}35`}
                                    stroke={item.color} strokeWidth="0.9" strokeOpacity="0.85"
                                    transform={`rotate(${deg + 90}, ${cx2}, ${cy2})`}
                                />
                            );
                        })}
                        <circle cx="24" cy="24" r="6" fill={`${item.color}55`} />
                        <circle cx="24" cy="24" r="4" fill={`${item.color}bb`} />
                        <line x1="24" y1="20" x2="24" y2="28" stroke="#fff" strokeWidth="1.6" strokeOpacity="0.95" strokeLinecap="round" />
                        <line x1="20" y1="24" x2="28" y2="24" stroke="#fff" strokeWidth="1.6" strokeOpacity="0.95" strokeLinecap="round" />
                        {[30, 90, 150, 210, 270, 330].map((deg, k) => {
                            const rad = deg * Math.PI / 180;
                            return <circle key={k} cx={24 + Math.cos(rad) * 20} cy={24 + Math.sin(rad) * 20}
                                r="1.4" fill={item.color} fillOpacity="0.88" />;
                        })}
                    </svg>
                ) : item.icon === '�✦' ? (
                    /* ── Ayurveda: lotus flower with tridosha mandala ── */
                    <svg width={sz * 0.50} height={sz * 0.50} viewBox="0 0 48 48" fill="none"
                        style={{ position: 'relative', zIndex: 2, filter: `drop-shadow(0 0 ${sz * 0.14}px ${item.color}) drop-shadow(0 0 ${sz * 0.08}px rgba(255,180,100,0.7))` }}>
                        <circle cx="24" cy="24" r="21" stroke={item.color} strokeWidth="0.7" strokeOpacity="0.4" strokeDasharray="2 3" />
                        {/* 8 lotus petals */}
                        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, k) => {
                            const rad = deg * Math.PI / 180;
                            const cx2 = 24 + Math.cos(rad) * 9;
                            const cy2 = 24 + Math.sin(rad) * 9;
                            return (
                                <ellipse key={k} cx={cx2} cy={cy2} rx="3.2" ry="6"
                                    fill={`${item.color}${k % 2 === 0 ? '55' : '30'}`}
                                    stroke={item.color} strokeWidth="0.8" strokeOpacity="0.9"
                                    transform={`rotate(${deg + 90}, ${cx2}, ${cy2})`}
                                />
                            );
                        })}
                        {/* Tridosha triangle (Vata/Pitta/Kapha) */}
                        <polygon points="24,13 32,30 16,30" fill="none" stroke={item.color} strokeWidth="1" strokeOpacity="0.7" />
                        <circle cx="24" cy="24" r="5.5" fill={`${item.color}44`} />
                        <circle cx="24" cy="24" r="3.5" fill={`${item.color}cc`} />
                        <circle cx="24" cy="24" r="1.5" fill="#fff" fillOpacity="0.95" />
                        {/* Outer dots */}
                        {[0, 60, 120, 180, 240, 300].map((deg, k) => {
                            const rad = deg * Math.PI / 180;
                            return <circle key={k} cx={24 + Math.cos(rad) * 18.5} cy={24 + Math.sin(rad) * 18.5}
                                r="1.2" fill={item.color} fillOpacity="0.75" />;
                        })}
                    </svg>
                ) : item.icon === '��✦' ? (
                    /* ── GuruKul: sacred lamp (diya) of knowledge ── */
                    <svg width={sz * 0.48} height={sz * 0.48} viewBox="0 0 48 48" fill="none"
                        style={{ position: 'relative', zIndex: 2, filter: `drop-shadow(0 0 ${sz * 0.14}px ${item.color}) drop-shadow(0 0 ${sz * 0.08}px rgba(255,210,80,0.7))` }}>
                        <circle cx="24" cy="24" r="21" stroke={item.color} strokeWidth="0.7" strokeOpacity="0.5" strokeDasharray="3 2" />
                        <path d="M14 29 Q14 34 24 34 Q34 34 34 29 Q34 24 24 24 Q14 24 14 29 Z"
                            fill={`${item.color}40`} stroke={item.color} strokeWidth="1.2" strokeOpacity="0.9" />
                        <line x1="24" y1="24" x2="24" y2="19" stroke={item.color} strokeWidth="1.4" strokeOpacity="1" strokeLinecap="round" />
                        <path d="M24 18 Q21.5 14.5 24 11 Q26.5 14.5 24 18 Z"
                            fill={`${item.color}ee`} />
                        <path d="M24 17 Q22.5 14.5 24 12.5 Q25.5 14.5 24 17 Z"
                            fill="#fff" fillOpacity="0.92" />
                        {[270, 240, 300, 210, 330].map((deg, k) => {
                            const rad = deg * Math.PI / 180;
                            const r0 = 10, r1 = k === 0 ? 15 : 13;
                            return <line key={k}
                                x1={24 + Math.cos(rad) * r0} y1={24 + Math.sin(rad) * r0}
                                x2={24 + Math.cos(rad) * r1} y2={24 + Math.sin(rad) * r1}
                                stroke={item.color} strokeWidth={k === 0 ? '1.4' : '0.9'}
                                strokeOpacity={k === 0 ? 1.0 : 0.65} strokeLinecap="round" />;
                        })}
                        {[0, 60, 120, 180, 240, 300].map((deg, k) => {
                            const rad = deg * Math.PI / 180;
                            return <circle key={k} cx={24 + Math.cos(rad) * 19} cy={24 + Math.sin(rad) * 19}
                                r="1.3" fill={item.color} fillOpacity="0.7" />;
                        })}
                    </svg>
                ) : (
                    <span style={{
                        fontSize: sz * 0.46,
                        position: 'relative', zIndex: 2,
                        filter: `drop-shadow(0 2px 8px rgba(0,0,0,0.5)) drop-shadow(0 0 ${sz * 0.12}px ${item.color}88)`,
                        lineHeight: 1,
                    }}>{item.icon}</span>
                )}

                {/* ── Subtitle inside — vibrant white text with strong glow ── */}
                {item.subtitle && (
                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        gap: 1, position: 'relative', zIndex: 2, padding: '0 4px',
                    }}>
                        <span style={{
                            fontSize: Math.max(8.5, sz * 0.148),
                            fontWeight: 700,
                            fontFamily: "'Outfit', sans-serif",
                            color: 'rgba(220,245,255,0.92)',
                            textAlign: 'center',
                            lineHeight: 1.18,
                            letterSpacing: '0.03em',
                            textShadow: `0 0 8px rgba(100,200,255,0.9), 0 0 18px ${item.color}88, 0 1px 4px rgba(0,0,0,0.7)`,
                        }}>{line1}</span>
                        {line2 && (
                            <span style={{
                                fontSize: Math.max(8.5, sz * 0.148),
                                fontWeight: 700,
                                fontFamily: "'Outfit', sans-serif",
                                color: 'rgba(180,225,255,0.82)',
                                textAlign: 'center',
                                lineHeight: 1.18,
                                letterSpacing: '0.03em',
                                textShadow: `0 0 6px rgba(80,180,255,0.8), 0 0 14px ${item.color}66, 0 1px 3px rgba(0,0,0,0.7)`,
                            }}>{line2}</span>
                        )}
                    </div>
                )}
            </div>

            {/* ════ TITLE — outside below the bubble — brighter with item-color glow ════ */}
            <span style={{
                fontSize: Math.max(8.5, sz * 0.165),
                fontWeight: 800,
                fontFamily: "'Outfit', sans-serif",
                color: item.color,
                letterSpacing: '0.04em',
                textAlign: 'center',
                textShadow: `0 0 12px ${item.color}99, 0 0 28px ${item.color}44, 0 1px 5px rgba(0,0,0,0.9)`,
                lineHeight: 1.15,
                whiteSpace: 'nowrap',
            }}>{item.title}</span>
        </div>
    );
}

// ── Gold tendril SVG overlay ──────────────────────────────────────────────────
function Tendrils({ S, rot }: { S: number; rot: number }) {
    const cx = S / 2, cy = S / 2;
    const orbitR = S * 0.43;
    const N = ORBIT_ITEMS.length;
    return (
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 6 }}
            viewBox={`0 0 ${S} ${S}`}>
            <defs>
                <filter id="tglow">
                    <feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                {ORBIT_ITEMS.map((item, i) => {
                    const deg = -90 + i * (360 / N) + rot;
                    const r = deg * Math.PI / 180;
                    return (
                        <linearGradient key={item.id} id={`t${i}`} gradientUnits="userSpaceOnUse"
                            x1={cx} y1={cy}
                            x2={cx + Math.cos(r) * orbitR} y2={cy + Math.sin(r) * orbitR}>
                            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.90" />
                            <stop offset="100%" stopColor={item.color} stopOpacity="0.45" />
                        </linearGradient>
                    );
                })}
            </defs>
            {ORBIT_ITEMS.map((item, i) => {
                const deg = -90 + i * (360 / N) + rot;
                const r = deg * Math.PI / 180;
                const x2 = cx + Math.cos(r) * orbitR;
                const y2 = cy + Math.sin(r) * orbitR;
                const mx = (cx + x2) / 2 + Math.cos(r + Math.PI / 2) * 20;
                const my = (cy + y2) / 2 + Math.sin(r + Math.PI / 2) * 20;
                return (
                    <path key={item.id}
                        d={`M ${cx} ${cy} Q ${mx} ${my} ${x2} ${y2}`}
                        fill="none" stroke={`url(#t${i})`} strokeWidth="1.4"
                        opacity="0.75" filter="url(#tglow)"
                    />
                );
            })}
        </svg>
    );
}

// ── Feature Detail Overlay (expands on bubble touch) ────────────────────────
function FeatureDetail({ item, onClose, onNavigate }: { item: OrbItem; onClose: () => void; onNavigate: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0 } }}
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 9998,
                background: 'rgba(2,1,10,0.97)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1rem',
            }}
        >
            <motion.div
                onClick={e => e.stopPropagation()}
                initial={{ scale: 0.7, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.7, opacity: 0, y: 30 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                style={{
                    width: '88%', maxWidth: 340,
                    background: `linear-gradient(160deg, ${item.color}15, rgba(255,255,255,0.05), ${item.color}0a)`,
                    backdropFilter: 'blur(32px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(32px) saturate(180%)',
                    border: `1px solid ${item.color}30`,
                    borderRadius: 28,
                    padding: '2rem 1.5rem',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: '0.85rem',
                    position: 'relative',
                    boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 60px ${item.glow}18`,
                }}
            >
                <button onClick={onClose} style={{
                    position: 'absolute', top: 14, right: 14,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '50%', width: 30, height: 30,
                    color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.85rem',
                }}>✕</button>

                <motion.span
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ fontSize: '3rem', filter: `drop-shadow(0 0 20px ${item.color}66)` }}
                >{item.icon}</motion.span>

                <h3 style={{
                    margin: 0, fontSize: '1.25rem', fontWeight: 700,
                    fontFamily: "'Outfit', sans-serif",
                    color: item.color,
                    letterSpacing: '0.04em',
                    textShadow: `0 0 16px ${item.color}44`,
                    textAlign: 'center',
                }}>{item.title}</h3>

                <p style={{
                    margin: 0, fontSize: '0.85rem', fontWeight: 500,
                    color: 'rgba(255,255,255,0.50)',
                    fontFamily: "'Outfit', sans-serif",
                    letterSpacing: '0.04em', textAlign: 'center',
                }}>{item.subtitle}</p>

                <div style={{
                    width: '60%', height: 1,
                    background: `linear-gradient(90deg, transparent, ${item.color}33, transparent)`,
                }} />

                <p style={{
                    margin: 0, fontSize: '0.82rem', fontWeight: 400,
                    color: 'rgba(255,255,255,0.68)',
                    fontFamily: "'Outfit', sans-serif",
                    lineHeight: 1.6, textAlign: 'center',
                    padding: '0 0.5rem',
                }}>{item.description}</p>

                <motion.button
                    onClick={onNavigate}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    style={{
                        marginTop: '0.3rem',
                        background: `linear-gradient(135deg, ${item.color}, ${item.glow})`,
                        border: 'none', borderRadius: 16,
                        padding: '0.7rem 1.8rem',
                        color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                        fontFamily: "'Outfit', sans-serif",
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                        cursor: 'pointer',
                        boxShadow: `0 4px 20px ${item.glow}44`,
                    }}
                >
                    Explore →
                </motion.button>
            </motion.div>
        </motion.div>
    );
}

// ── Orb click sound ─────────────────────────────────────────────────────────────
function playOrbClickSound() {
    if (typeof window === 'undefined') return;
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        [1047, 1319, 1568].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            g.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
            g.gain.linearRampToValueAtTime(0.14, ctx.currentTime + i * 0.08 + 0.02);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.32);
            osc.connect(g); g.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.08);
            osc.stop(ctx.currentTime + i * 0.08 + 0.34);
        });
        setTimeout(() => ctx.close(), 1000);
    } catch { /* silent */ }
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SacredPortalGrid() {
    const [raagOpen, setRaagOpen] = useState(false);
    const [expandedItem, setExpandedItem] = useState<OrbItem | null>(null);
    const [orbitSize, setOrbitSize] = useState(480);
    const [rotation, setRotation] = useState(0);
    const expandedItemRef = useRef<OrbItem | null>(null);
    expandedItemRef.current = expandedItem;

    // Notify page-level to hide nav bars; intercept back button to close popup
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('sacred-portal-change', { detail: { open: !!expandedItem } }));
        if (expandedItem) {
            window.history.pushState({ sacredPortalOpen: true }, '');
        }
    }, [expandedItem]);

    useEffect(() => {
        const onPop = () => setExpandedItem(null);
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, []);

    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter(); // For programmatic navigation
    const isPointerDown = useRef(false);
    const isDragging = useRef(false);
    const hasMoved = useRef(false);
    const isHovered = useRef(false);
    const startAngle = useRef(0);
    const lastAngle = useRef(0);
    const vel = useRef(0);
    const animRef = useRef<number>(0);

    // Responsive sizing
    useEffect(() => {
        const calc = () => setOrbitSize(Math.min(480, Math.max(280, window.innerWidth * 0.96)));
        calc();
        window.addEventListener('resize', calc);
        return () => window.removeEventListener('resize', calc);
    }, []);

    // Animation loop — auto-rotation + friction momentum after drag
    // Touch/pointer down anywhere = full stop; release = resume medium auto-spin
    useEffect(() => {
        const AUTO_SPEED = 0.18; // degrees per frame — medium speed spin
        const tick = () => {
            if (isPointerDown.current) {
                // Completely stop when user is touching
                vel.current = 0;
            } else if (!isDragging.current) {
                if (Math.abs(vel.current) > 0.05) {
                    // If user just released with momentum, decay it
                    vel.current *= 0.94;
                } else {
                    // Otherwise apply gentle continuous auto-rotation
                    vel.current = AUTO_SPEED;
                }
            }
            if (!isPointerDown.current && Math.abs(vel.current) > 0.001 && !expandedItemRef.current) {
                setRotation(r => (r + vel.current + 360) % 360);
            }
            animRef.current = requestAnimationFrame(tick);
        };
        animRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animRef.current);
    }, []);

    const getAngle = useCallback((cx: number, cy: number) => {
        const el = containerRef.current; if (!el) return 0;
        const rc = el.getBoundingClientRect();
        return Math.atan2(cy - (rc.top + rc.height / 2), cx - (rc.left + rc.width / 2)) * 180 / Math.PI;
    }, []);

    const onPD = useCallback((e: React.PointerEvent) => {
        // Stop rotation on ANY touch anywhere in the orbit component
        isPointerDown.current = true;
        isDragging.current = false;
        hasMoved.current = false;
        vel.current = 0;

        // Only initiate drag-rotation if touch is near the ring area
        const el = containerRef.current;
        if (!el) return;
        const rc = el.getBoundingClientRect();
        const dx = e.clientX - (rc.left + rc.width / 2);
        const dy = e.clientY - (rc.top + rc.height / 2);
        const dist = Math.hypot(dx, dy);
        const currentOrbitR = rc.width * 0.43;
        const currentOrbSize = Math.max(56, rc.width * 0.16);
        const minDragDist = currentOrbitR - currentOrbSize * 0.6;

        if (dist >= minDragDist) {
            const ang = getAngle(e.clientX, e.clientY);
            startAngle.current = ang;
            lastAngle.current = ang;
        }
    }, [getAngle]);

    const onPM = useCallback((e: React.PointerEvent) => {
        if (!isPointerDown.current) return;
        const cur = getAngle(e.clientX, e.clientY);

        let totalD = Math.abs(cur - startAngle.current);
        if (totalD > 180) totalD = Math.abs(totalD - 360);

        // If they drag more than 6 degrees, flag it as a drag (blocks clicks)
        if (totalD > 6.0) {
            isDragging.current = true;
            hasMoved.current = true;
        }

        let d = cur - lastAngle.current;
        if (d > 180) d -= 360; if (d < -180) d += 360;

        vel.current = d;
        setRotation(r => (r + d + 360) % 360);
        lastAngle.current = cur;
    }, [getAngle]);

    const onPU = useCallback(() => {
        isPointerDown.current = false;
        isDragging.current = false;
        // hasMoved stays true until next pointerDown so the click handler can read it
        setTimeout(() => { hasMoved.current = false; }, 50);
    }, []);

    const N = ORBIT_ITEMS.length;       // 9
    const orbitR = orbitSize * 0.43;
    const orbSize = Math.max(56, orbitSize * 0.16);
    // Platform image fills the inner orbit area completely
    const platformSize = orbitSize * 0.82;

    return (
        <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${orbitSize * 0.04}px 0`, userSelect: 'none' }}>

            {/* ── ORBIT SECTION ELEGANT TITLE ── */}
            <div style={{ textAlign: 'center', marginBottom: orbitSize * 0.06, width: '100%', padding: '0 1rem', position: 'relative', zIndex: 10, willChange: 'transform', transform: 'translateZ(0)' }}>
                <h2 style={{
                    margin: 0, fontSize: 'clamp(0.85rem, 3.5vw, 1.15rem)',
                    fontWeight: 700, letterSpacing: '0.15em',
                    color: '#fbbf24', textTransform: 'uppercase',
                    fontFamily: "'Inter', system-ui, sans-serif",
                    textShadow: '0 2px 15px rgba(251,191,36,0.3)',
                }}>
                    <span style={{ marginRight: 6 }}>✦</span>
                    Click any Dimension
                </h2>
                <p style={{
                    margin: '0.4rem 0 0', fontSize: 'clamp(0.75rem, 3vw, 1.05rem)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                    fontStyle: 'italic', letterSpacing: '0.04em'
                }}>
                    and Enhance your life
                </p>
            </div>

            <div style={{ position: 'relative', width: orbitSize, height: orbitSize, flexShrink: 0 }}>
                <div ref={containerRef}
                    style={{ position: 'absolute', inset: 0, touchAction: 'none', cursor: 'grab' }}
                    onPointerDown={onPD} onPointerMove={onPM} onPointerUp={onPU}
                    onPointerLeave={() => { onPU(); isHovered.current = false; }}
                    onPointerEnter={() => { isHovered.current = true; }}
                >

                    {/* ── PHOTOREALISTIC PLATFORM IMAGE (fixed/non-rotating center) ── */}
                    <div style={{
                        position: 'absolute',
                        left: '50%', top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: platformSize, height: platformSize,
                        zIndex: 8, pointerEvents: 'none',
                    }}>
                        {/* Outer glow behind platform */}
                        <motion.div
                            animate={{ opacity: [0.55, 0.85, 0.55], scale: [1, 1.06, 1] }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                            style={{
                                position: 'absolute', inset: '-12%',
                                background: 'radial-gradient(circle, rgba(251,191,36,0.35) 0%, rgba(180,110,0,0.15) 45%, transparent 72%)',
                                borderRadius: '50%', filter: 'blur(18px)',
                            }}
                        />
                        {/* The central OrbitImage — full fill, black background screened out */}
                        <img
                            src="/images/OneSUTRAOrbit.jpeg"
                            alt="OneSUTRA Orbit Platform"
                            style={{
                                width: '100%', height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'center',
                                borderRadius: '50%',
                                // screen blend removes the black JPEG background completely
                                mixBlendMode: 'screen',
                                // extra luminance contrast to make the lotus pop
                                filter: `brightness(1.35) contrast(1.12) saturate(1.25) drop-shadow(0 0 ${platformSize * 0.07}px rgba(251,191,36,0.9))`,
                                position: 'relative', zIndex: 1,
                            }}
                        />
                        {/* Decorative flame pulse on top */}
                        <motion.div
                            animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0.75, 0.4] }}
                            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                            style={{
                                position: 'absolute',
                                top: '16%', left: '50%',
                                transform: 'translateX(-50%)',
                                width: platformSize * 0.18, height: platformSize * 0.18,
                                background: 'radial-gradient(circle, rgba(255,160,30,0.75) 0%, transparent 70%)',
                                borderRadius: '50%', filter: 'blur(12px)', zIndex: 2,
                            }}
                        />
                    </div>

                    {/* Orbit track ring — glassy blue + golden halo fusion */}
                    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 4 }}
                        viewBox={`0 0 ${orbitSize} ${orbitSize}`}>
                        <defs>
                            <filter id="ringGlow">
                                <feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                            <filter id="blueGlow">
                                <feGaussianBlur stdDeviation="8" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                            <linearGradient id="orbitTrackGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="rgba(60,140,255,0.55)" />
                                <stop offset="40%" stopColor="rgba(120,200,255,0.35)" />
                                <stop offset="60%" stopColor="rgba(251,191,36,0.45)" />
                                <stop offset="100%" stopColor="rgba(60,140,255,0.55)" />
                            </linearGradient>
                        </defs>
                        {/* Wide nebula track band */}
                        <circle cx={orbitSize / 2} cy={orbitSize / 2} r={orbitR} fill="none"
                            stroke="rgba(40,100,220,0.18)" strokeWidth={orbSize * 0.9} />
                        {/* Main glowing orbit line */}
                        <circle cx={orbitSize / 2} cy={orbitSize / 2} r={orbitR} fill="none"
                            stroke="url(#orbitTrackGrad)" strokeWidth="2.2" filter="url(#ringGlow)" />
                        {/* Blue inner halo ring */}
                        <circle cx={orbitSize / 2} cy={orbitSize / 2} r={orbitR} fill="none"
                            stroke="rgba(80,160,255,0.55)" strokeWidth="1.0" filter="url(#blueGlow)" />
                        {/* Dashed inner guide */}
                        <circle cx={orbitSize / 2} cy={orbitSize / 2} r={orbitR - orbSize * 0.43} fill="none"
                            stroke="rgba(80,160,255,0.25)" strokeWidth="0.8" strokeDasharray="4 3" />
                        {/* Dashed outer guide */}
                        <circle cx={orbitSize / 2} cy={orbitSize / 2} r={orbitR + orbSize * 0.43} fill="none"
                            stroke="rgba(80,160,255,0.25)" strokeWidth="0.8" strokeDasharray="4 3" />
                    </svg>

                    {/* Gold tendril lines */}
                    <Tendrils S={orbitSize} rot={rotation} />

                    {/* 9 Photorealistic-style Geode Orbs */}
                    {ORBIT_ITEMS.map((item, i) => {
                        const deg = -90 + i * (360 / N) + rotation;
                        const rad = deg * Math.PI / 180;
                        const cx = orbitSize / 2 + Math.cos(rad) * orbitR;
                        const cy = orbitSize / 2 + Math.sin(rad) * orbitR;
                        return (
                            <div key={item.id} style={{ position: 'absolute', left: cx, top: cy, transform: 'translate(-50%, -50%)', zIndex: 20 }}>
                                <motion.div whileHover={{ scale: 1.18, filter: `drop-shadow(0 0 ${orbSize * 0.2}px ${item.color})` }} whileTap={{ scale: 0.90 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                                    {item.isModal
                                        ? <div onClick={() => { playOrbClickSound(); setRaagOpen(true); }} style={{ cursor: 'pointer' }}><GeodeOrb item={item} sz={orbSize} idx={i} /></div>
                                        : <div onClick={() => { if (!hasMoved.current) { playOrbClickSound(); setExpandedItem(item); } }} style={{ cursor: 'pointer' }}>
                                            <GeodeOrb item={item} sz={orbSize} idx={i} />
                                        </div>
                                    }
                                </motion.div>
                            </div>
                        );
                    })}
                </div>
                {/* Central scroll-passthrough: sibling of containerRef → its touchAction:pan-y is NOT
                overridden by containerRef's touchAction:none. Touches on center scroll the page;
                touches outside this circle (on the ring/planets) still reach containerRef for rotation. */}
                <div style={{
                    position: 'absolute', left: '50%', top: '50%',
                    transform: 'translate(-50%,-50%)',
                    width: (orbitSize * 0.43 - Math.max(56, orbitSize * 0.16) * 0.5) * 2,
                    height: (orbitSize * 0.43 - Math.max(56, orbitSize * 0.16) * 0.5) * 2,
                    borderRadius: '50%', touchAction: 'pan-y', zIndex: 30,
                    pointerEvents: 'auto',
                }} />
            </div>

            <AnimatePresence>
                {raagOpen && <RaagModal onClose={() => setRaagOpen(false)} />}
            </AnimatePresence>

            <AnimatePresence>
                {expandedItem && (
                    <FeatureDetail
                        item={expandedItem}
                        onClose={() => setExpandedItem(null)}
                        onNavigate={() => { if (expandedItem.href) router.push(expandedItem.href); setExpandedItem(null); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
