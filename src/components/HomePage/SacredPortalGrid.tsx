'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, SkipBack, SkipForward } from 'lucide-react';

// --- Raag Data ---
const TRACKS = [
    { title: "Raag Bhairav", time: "Morning (6 AM - 9 AM)", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", description: "Awakening & Devotion" },
    { title: "Raag Yaman", time: "Morning (6 AM - 9 AM)", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", description: "Peace & Contemplation" },
    { title: "Raag Malkauns", time: "Evening (6 PM - 9 PM)", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", description: "Calming & Meditative" },
    { title: "Raag Darbari", time: "Night (9 PM - Midnight)", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", description: "Deep & Majestic" },
];

const SACRED_META: Record<string, { name: string; p0: string; p1: string; accent: string }> = {
    BrahmaMuhurta: { name: 'Brahma Muhurta', p0: '147,197,253', p1: '59,130,246', accent: '#60a5fa' },
    Sunrise: { name: 'Sunrise (Pratahkala)', p0: '253,186,116', p1: '245,158,11', accent: '#fbbf24' },
    Morning: { name: 'Morning (Sangava)', p0: '252,211,77', p1: '234,179,8', accent: '#fcd34d' },
    Midday: { name: 'Midday (Madhyahna)', p0: '254,215,170', p1: '249,115,22', accent: '#fed7aa' },
    Afternoon: { name: 'Afternoon (Aparahna)', p0: '253,164,175', p1: '244,63,94', accent: '#fda4af' },
    Evening: { name: 'Evening (Sayankala)', p0: '249,168,212', p1: '225,29,72', accent: '#f9a8d4' },
    Sunset: { name: 'Sunset (Pradosha)', p0: '216,180,254', p1: '168,85,247', accent: '#c084fc' },
    Night: { name: 'Night (Ratri)', p0: '165,180,252', p1: '79,70,229', accent: '#818cf8' }
};

function getSacredTimePeriod(): string {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 6) return 'BrahmaMuhurta';
    if (hour >= 6 && hour < 8) return 'Sunrise';
    if (hour >= 8 && hour < 11) return 'Morning';
    if (hour >= 11 && hour < 13) return 'Midday';
    if (hour >= 13 && hour < 16) return 'Afternoon';
    if (hour >= 16 && hour < 18) return 'Evening';
    if (hour >= 18 && hour < 20) return 'Sunset';
    return 'Night';
}

function RaagModal({ onClose }: { onClose: () => void }) {
    const period = getSacredTimePeriod();
    const meta = SACRED_META[period] || SACRED_META['Night'];
    const { p0, accent } = meta;
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [playing, setPlaying] = useState(false);
    const [idx, setIdx] = useState(0);
    const [prog, setProg] = useState(0);

    useEffect(() => {
        const a = new Audio();
        a.crossOrigin = 'anonymous';
        a.onended = () => setIdx(i => (i + 1) % TRACKS.length);
        a.ontimeupdate = () => { setProg(a.duration ? a.currentTime / a.duration : 0); };
        audioRef.current = a;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => { a.pause(); a.src = ''; window.removeEventListener('keydown', onKey); };
    }, [onClose]);

    useEffect(() => {
        const a = audioRef.current; if (!a) return;
        a.src = TRACKS[idx].src; a.load();
        if (playing) a.play().catch(() => setPlaying(false));
    }, [idx, playing]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', background: 'rgba(2,1,8,0.95)', backdropFilter: 'blur(24px)' }}>
            <div onClick={e => e.stopPropagation()} style={{ margin: 'auto', width: '90%', maxWidth: '400px', background: `linear-gradient(to bottom, rgba(${p0},0.15), transparent)`, border: `1px solid rgba(${p0},0.3)`, borderRadius: '1.5rem', padding: '2rem', textAlign: 'center', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={24} /></button>
                <div style={{ width: 120, height: 120, margin: '0 auto 2rem', borderRadius: '50%', background: `conic-gradient(from 0deg, rgba(${p0},0.8), transparent, rgba(${p0},0.8))`, animation: 'spin 10s linear infinite', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px rgba(${p0},0.4)` }}>
                    <div style={{ width: '90%', height: '90%', borderRadius: '50%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>✦</div>
                </div>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem' }}>{TRACKS[idx].title}</h2>
                <p style={{ color: accent, marginTop: '0.5rem', marginBottom: '2rem' }}>{TRACKS[idx].time}</p>
                <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, margin: '2rem 0', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${prog * 100}%`, background: accent, borderRadius: 2 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', alignItems: 'center' }}>
                    <button onClick={() => setIdx(i => (i - 1 + TRACKS.length) % TRACKS.length)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><SkipBack size={24} /></button>
                    <button onClick={() => { setPlaying(!playing); if (!playing) audioRef.current?.play(); else audioRef.current?.pause(); }} style={{ width: 56, height: 56, borderRadius: '50%', background: accent, border: 'none', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        {playing ? <Pause size={28} /> : <Play size={28} style={{ marginLeft: 4 }} />}
                    </button>
                    <button onClick={() => setIdx(i => (i + 1) % TRACKS.length)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><SkipForward size={24} /></button>
                </div>
            </div>
        </motion.div>
    );
}

// --- Menu Items ---
const MENU_ITEMS = [
    { id: 'pranaverse', title: 'PranaVIBEs', icon: '🌀', href: '/pranaverse', color: '20,184,166' },
    { id: 'sutraconnect', title: 'SUTRAConnect', icon: '🪷', href: '/onesutra', color: '192,132,252' },
    { id: 'acharya', title: 'Guru', icon: 'ॐ', href: '/acharya-samvad', color: '165,180,252' },
    { id: 'dhyan', title: 'Dhyan', icon: '🕉️', href: '/dhyan-kshetra', color: '251,191,36' },
    { id: 'vedic-rasoi', title: 'Vedic Rasoi', icon: '🌿', href: '/vedic-rasoi', color: '163,230,53' },
    { id: 'outplugs', title: 'outPLUGS', icon: '✧', href: '/outplugs', color: '232,93,4' },
    { id: 'sutra-vibe', title: 'SutraVibe', icon: '🎵', isModal: true, color: '250,204,21' },
    { id: 'guru-gurukul', title: 'Guru-Gurukul', icon: '🏛️', href: '/guru-gurukul', color: '239,68,68' },
    { id: 'swadesi-product', title: 'Swadesi Product', icon: '🛍️', href: '/swadesi-product', color: '245,158,11' },
    { id: 'vedic-sangrah', title: 'Vedic-Sangrah', icon: '📚', href: '/vedic-sangrah', color: '56,189,248' },
    { id: 'vedic-games', title: 'Vedic Games', icon: '🎲', href: '/vedic-games', color: '236,72,153' }
];

function PortalSlot({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
            <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }} style={{ cursor: 'pointer' }}>
                {children}
            </motion.div>
        </Link>
    );
}

// Sparkle particle positions around the flame
const SPARKLES = [
    { x: -55, y: -55, size: 7, delay: 0, color: '#FFD700' },
    { x: 55, y: -65, size: 5, delay: 0.4, color: '#FF9E00' },
    { x: -70, y: 10, size: 6, delay: 0.8, color: '#FFD700' },
    { x: 70, y: 5, size: 4, delay: 1.2, color: '#FF6B00' },
    { x: -40, y: -90, size: 5, delay: 0.3, color: '#FFEA00' },
    { x: 40, y: -85, size: 6, delay: 0.7, color: '#FFB300' },
    { x: -80, y: -35, size: 4, delay: 1.0, color: '#FF9E00' },
    { x: 80, y: -30, size: 5, delay: 1.5, color: '#FFD700' },
    { x: 0, y: -100, size: 6, delay: 0.2, color: '#FFEA00' },
    { x: -30, y: 60, size: 4, delay: 0.9, color: '#FF6B00' },
    { x: 30, y: 65, size: 5, delay: 0.6, color: '#FFD700' },
    { x: -5, y: 75, size: 3, delay: 1.3, color: '#FF9E00' },
];

// --- Diwali Chirag Component ---
function ChiragCenter() {
    return (
        <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
        }}>
            {/* Lamp and Flame Container */}
            <div style={{ position: 'relative', width: '190px', height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                {/* ✨ SPARKLES around the flame */}
                {SPARKLES.map((s, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            scale: [0, 1.2, 0],
                            opacity: [0, 1, 0],
                            rotate: [0, 180, 360],
                        }}
                        transition={{
                            duration: 1.4 + (i % 4) * 0.3,
                            repeat: Infinity,
                            delay: s.delay,
                            ease: 'easeInOut',
                        }}
                        style={{
                            position: 'absolute',
                            left: `calc(50% + ${s.x}px)`,
                            top: `calc(40% + ${s.y}px)`,
                            width: s.size * 2,
                            height: s.size * 2,
                            zIndex: 5,
                            pointerEvents: 'none',
                        }}
                    >
                        {/* 4-pointed star sparkle */}
                        <svg width={s.size * 2} height={s.size * 2} viewBox="0 0 10 10">
                            <polygon
                                points="5,0 6,4 10,5 6,6 5,10 4,6 0,5 4,4"
                                fill={s.color}
                                style={{ filter: `drop-shadow(0 0 3px ${s.color})` }}
                            />
                        </svg>
                    </motion.div>
                ))}

                {/* Glow Behind Flame */}
                <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.95, 0.6] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ position: 'absolute', top: '10px', width: '160px', height: '160px', background: 'radial-gradient(circle, rgba(255,140,0,0.85) 0%, transparent 65%)', borderRadius: '50%', filter: 'blur(18px)', zIndex: 0 }}
                />

                {/* Flame Container */}
                <motion.div
                    style={{ position: 'relative', width: '54px', height: '96px', zIndex: 2, transformOrigin: 'bottom center', marginBottom: '-8px' }}
                    animate={{ rotate: [-2, 2, -1, 3, -1], scaleY: [1, 1.08, 0.92, 1.05, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
                >
                    {/* Outer Flame */}
                    <div style={{ position: 'absolute', width: '100%', height: '100%', background: '#ff7b00', borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', boxShadow: '0 0 40px #ff7b00, 0 0 70px #ff9e00' }} />
                    {/* Middle Flame */}
                    <div style={{ position: 'absolute', width: '70%', height: '80%', left: '15%', top: '20%', background: '#ffaa00', borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%' }} />
                    {/* Inner Flame */}
                    <div style={{ position: 'absolute', width: '40%', height: '50%', left: '30%', top: '45%', background: '#ffea00', borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%' }} />
                    {/* Wick */}
                    <div style={{ position: 'absolute', width: '5px', height: '22px', background: '#2d1810', bottom: '0', left: '24px', borderRadius: '4px' }} />
                </motion.div>

                {/* Highly Designed Mitti Ka Diya (Clay Lamp) SVG — Bigger */}
                <div style={{ position: 'relative', width: '190px', height: '105px', zIndex: 1, filter: 'drop-shadow(0px 18px 28px rgba(255, 90, 0, 0.75))' }}>
                    <svg viewBox="0 0 120 60" style={{ width: '100%', height: '100%', display: 'block' }}>
                        <defs>
                            <linearGradient id="clayGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#bd5b25" />
                                <stop offset="50%" stopColor="#9b4213" />
                                <stop offset="100%" stopColor="#5a2205" />
                            </linearGradient>
                            <linearGradient id="oilGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#ffca28" />
                                <stop offset="100%" stopColor="#f57f17" />
                            </linearGradient>
                        </defs>
                        <path d="M 10 20 C 10 55, 110 55, 110 20 Z" fill="url(#clayGradient)" stroke="#4a1a01" strokeWidth="1.5" />
                        <path d="M 25 30 Q 60 50 95 30" fill="none" stroke="#ffca28" strokeWidth="2" strokeDasharray="3 3" opacity="0.8" />
                        <path d="M 35 40 Q 60 55 85 40" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
                        <circle cx="60" cy="38" r="4" fill="#ffca28" opacity="0.9" />
                        <circle cx="45" cy="34" r="2.5" fill="#ffffff" opacity="0.8" />
                        <circle cx="75" cy="34" r="2.5" fill="#ffffff" opacity="0.8" />
                        <ellipse cx="60" cy="20" rx="53" ry="14" fill="#8d3209" stroke="#542004" strokeWidth="1.5" />
                        <ellipse cx="60" cy="20" rx="46" ry="10" fill="#6d2303" />
                        <ellipse cx="60" cy="21" rx="42" ry="7" fill="url(#oilGradient)" opacity="0.85" />
                        <ellipse cx="60" cy="21" rx="40" ry="6" fill="#ffe082" opacity="0.5" />
                        <path d="M 45 10 C 53 0, 67 0, 75 10" fill="#8d3209" />
                        <ellipse cx="60" cy="9" rx="12" ry="4" fill="#6d2303" />
                        <path d="M 15 22 C 15 40, 45 47, 60 47 C 75 47, 105 40, 105 22" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.15" />
                    </svg>
                </div>
            </div>

            {/* Cosmic Orbit Text */}
            <div style={{ marginTop: '0.35rem', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.95rem', letterSpacing: '0.48em', textTransform: 'uppercase', color: 'rgba(255, 190, 50, 0.95)', fontFamily: 'monospace', fontWeight: 800, textShadow: '0 0 18px rgba(255, 140, 0, 0.95)' }}>
                    Cosmic
                </p>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.95rem', letterSpacing: '0.48em', textTransform: 'uppercase', color: 'rgba(255, 190, 50, 0.95)', fontFamily: 'monospace', fontWeight: 800, textShadow: '0 0 18px rgba(255, 140, 0, 0.95)' }}>
                    Orbit
                </p>
            </div>
        </div>
    );
}

// Comet definitions — angle in degrees (direction of travel), starting from random edges
const COMETS = [
    { angle: 135, top: '-5%', left: '10%', size: 80, dur: 2.2, delay: 0.0, color: '#FFD700' },
    { angle: 150, top: '5%', left: '60%', size: 60, dur: 1.8, delay: 1.4, color: '#FF9E00' },
    { angle: 120, top: '15%', left: '-5%', size: 70, dur: 2.5, delay: 3.1, color: '#FFEA00' },
    { angle: 160, top: '-8%', left: '35%', size: 55, dur: 1.6, delay: 5.2, color: '#FFC107' },
    { angle: 140, top: '0%', left: '80%', size: 65, dur: 2.0, delay: 2.7, color: '#FF7B00' },
    { angle: 125, top: '8%', left: '25%', size: 75, dur: 2.8, delay: 4.5, color: '#FFD700' },
];

function DhoomKetur() {
    return (
        <>
            {COMETS.map((c, i) => {
                const rad = (c.angle * Math.PI) / 180;
                const dx = Math.cos(rad) * c.size * 6;
                const dy = Math.sin(rad) * c.size * 6;
                return (
                    <motion.div
                        key={i}
                        style={{
                            position: 'absolute',
                            top: c.top,
                            left: c.left,
                            width: c.size,
                            height: 2,
                            pointerEvents: 'none',
                            zIndex: 3,
                            transformOrigin: 'left center',
                            rotate: c.angle,
                            borderRadius: 99,
                            background: `linear-gradient(to right, ${c.color}, rgba(255,255,255,0.9), transparent)`,
                            boxShadow: `0 0 8px ${c.color}, 0 0 16px ${c.color}88`,
                            filter: `blur(0.5px)`,
                        }}
                        initial={{ x: 0, y: 0, opacity: 0, scaleX: 0 }}
                        animate={{
                            x: [0, dx],
                            y: [0, dy],
                            opacity: [0, 1, 1, 0],
                            scaleX: [0, 1, 1, 0.3],
                        }}
                        transition={{
                            duration: c.dur,
                            repeat: Infinity,
                            delay: c.delay,
                            repeatDelay: 5 + (i * 1.7),
                            ease: [0.2, 0, 1, 0.8],
                        }}
                    >
                        {/* Bright head of the comet */}
                        <motion.div style={{
                            position: 'absolute',
                            right: -5,
                            top: -4,
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: '#fff',
                            boxShadow: `0 0 10px 4px ${c.color}`,
                        }} />
                    </motion.div>
                );
            })}
        </>
    );
}

// --- Main Grid Component ---
export default function SacredPortalGrid() {
    const [raagOpen, setRaagOpen] = useState(false);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const handleResize = () => {
            setScale(Math.min(1, window.innerWidth / 760));
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const radius = 320;

    return (
        <div style={{ position: 'relative', width: '100%', minHeight: '800px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', overflow: 'visible' }}>
            <div style={{ position: 'relative', width: '620px', height: '620px', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${scale})` }}>
                {/* ☄️ Dhoom Ketur — background comets */}
                <DhoomKetur />

                <ChiragCenter />


                {/* The Rotating Orbit */}
                <motion.div
                    key={MENU_ITEMS.length} // Force re-mount on item change to keep parent & children animation synced
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                    style={{ position: 'absolute', inset: 0, borderRadius: '50%' }}
                >
                    {MENU_ITEMS.map((item, i) => {
                        const angle = (i * (360 / MENU_ITEMS.length)) * (Math.PI / 180);
                        const x = Math.cos(angle) * radius;
                        const y = Math.sin(angle) * radius;

                        const ItemContent = (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
                                <motion.div
                                    whileHover={{ scale: 1.15, boxShadow: `0 0 35px rgba(${item.color}, 0.9)` }}
                                    style={{
                                        width: 80, // Updated from 60 to 80
                                        height: 80, // Updated from 60 to 80
                                        borderRadius: '50%',
                                        flexShrink: 0,
                                        background: `radial-gradient(circle, rgba(${item.color},0.35) 0%, rgba(${item.color},0.05) 70%)`,
                                        border: `1.5px solid rgba(${item.color},0.5)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.6rem',
                                        boxShadow: `0 0 20px rgba(${item.color}, 0.3)`,
                                        backdropFilter: 'blur(10px)',
                                    }}
                                >
                                    {item.icon}
                                </motion.div>
                                <div style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    color: `rgba(${item.color}, 0.95)`,
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                    textShadow: `0 0 10px rgba(${item.color}, 0.8)`,
                                    whiteSpace: 'nowrap',
                                    textAlign: 'center',
                                    background: 'rgba(0, 0, 0, 0.45)',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    backdropFilter: 'blur(4px)',
                                    border: `1px solid rgba(${item.color}, 0.25)`
                                }}>
                                    {item.title}
                                </div>
                            </div>
                        );

                        return (
                            <motion.div
                                key={item.id}
                                style={{
                                    position: 'absolute',
                                    left: '50%',
                                    top: '50%',
                                    x, y,
                                    marginLeft: '-30px',
                                    marginTop: '-40px',
                                    zIndex: 20
                                }}
                            >
                                {/* Counter-rotation to keep icons upright */}
                                <motion.div
                                    initial={{ rotate: 0 }}
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                                >
                                    {item.isModal ? (
                                        <div onClick={() => setRaagOpen(true)} style={{ cursor: 'pointer' }}>
                                            {ItemContent}
                                        </div>
                                    ) : (
                                        <PortalSlot href={item.href || '#'}>
                                            {ItemContent}
                                        </PortalSlot>
                                    )}
                                </motion.div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>

            <AnimatePresence>
                {raagOpen && <RaagModal onClose={() => setRaagOpen(false)} />}
            </AnimatePresence>
        </div>
    );
}
