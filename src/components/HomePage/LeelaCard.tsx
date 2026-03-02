'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Waves, Moon, Layers } from 'lucide-react';

// ── Time-of-day Rāga metadata — changes the header dynamically ───────────────
const TOD_RAAG: Record<string, { label: string; sublabel: string; tag: string; accent: string; canvasPalette: string[] }> = {
    morning: {
        label: 'Rāga Bhairav · Golden Hour · 15 Min Leela',
        sublabel: 'Elevate Your Productivity — Ancient frequencies engineered to ignite focus. Awaken with the sound.',
        tag: '🌅 Dawn · Awaken',
        accent: 'rgba(255,185,60,0.95)',
        canvasPalette: ['255,185,60', '255,120,30', '200,140,0'],      // golden/amber — Muladhara sunrise
    },
    noon: {
        label: 'Rāga Bhimpalasi · Midday Power · 15 Min Leela',
        sublabel: 'Elevate Your Focus — Ancient frequencies engineered to sharpen attention. Surrender to the sound.',
        tag: '☀️ Noon · Power',
        accent: 'rgba(255,220,80,0.95)',
        canvasPalette: ['255,220,80', '200,180,20', '255,160,0'],      // bright gold
    },
    evening: {
        label: 'Rāga Yaman · Twilight Flow · 15 Min Leela',
        sublabel: 'Elevate Your Creativity — Ancient frequencies engineered to unlock creative flow. Surrender to the sound.',
        tag: '🌆 Dusk · Create',
        accent: 'rgba(180,130,255,0.95)',
        canvasPalette: ['180,100,255', '100,60,200', '220,80,180'],   // violet/lavender — Sahasrara
    },
    night: {
        label: 'Night Rāga · Deep Rest · Sacred Dark · 15 Min Leela',
        sublabel: 'Elevate Your Productivity — Ancient frequencies engineered to align your focus. Surrender to the sound.',
        tag: '🌙 Night · Rest',
        accent: 'rgba(80,160,255,0.95)',
        canvasPalette: ['40,100,220', '80,40,160', '0,160,200'],      // deep indigo/blue — Anahata night
    },
};

// Get current period from real-time hour
function getTimePeriod(): string {
    const h = new Date().getHours();
    if (h >= 5 && h < 11) return 'morning';
    if (h >= 11 && h < 17) return 'noon';
    if (h >= 17 && h < 21) return 'evening';
    return 'night';
}

// ── Track list — Leela Sparsha FIRST ─────────────────────────────────────────
const TRACKS = [
    {
        id: 'leela-sparsha',
        title: 'Leela · Sparsha',
        artist: 'Rāga Bhairav · 15 Min · First Contact',
        src: 'https://ik.imagekit.io/rcsesr4xf/sitar.mp3',
        stems: [
            { url: 'https://ik.imagekit.io/rcsesr4xf/sitar.mp3', vol: 0.85 },
            { url: 'https://ik.imagekit.io/rcsesr4xf/flute.mp3', vol: 0.55 },
            { url: 'https://ik.imagekit.io/rcsesr4xf/0m_chant.mp3', vol: 0.30 },
        ],
        isLeela: true,
        tag: '15 Min · Sparsha',
    },
    { id: 'gayatri', title: 'Gayatri Ghanpaath', artist: 'Vedic Chant', src: 'https://ik.imagekit.io/rcsesr4xf/gayatri-mantra-ghanpaath.mp3', tag: 'Mantra' },
    { id: 'lalitha', title: 'Lalitha Sahasranamam', artist: 'Devotional', src: 'https://ik.imagekit.io/rcsesr4xf/Lalitha-Sahasranamam.mp3', tag: 'Bhakti' },
    { id: 'shiva', title: 'Shiva Tandava Stotram', artist: 'Power Mantra', src: 'https://ik.imagekit.io/rcsesr4xf/Shiva-Tandav.mp3', tag: 'Śakti' },
    { id: 'brahma', title: 'Brahma Yagya', artist: 'Sacred Fire', src: 'https://ik.imagekit.io/rcsesr4xf/BrahmaYagya.mp3', tag: 'Ritual' },
    { id: 'agnihotra', title: 'Dainik Agnihotra', artist: 'Morning Ritual', src: 'https://ik.imagekit.io/aup4wh6lq/DainikAgnihotra.mp3?updatedAt=1771246817070', tag: 'Prāṇa' },
];

// TOD video backgrounds matching the Leela page atmosphere
const TOD_VIDEOS: Record<string, string> = {
    morning: 'https://ik.imagekit.io/rcsesr4xf/nature-morning.mp4',
    noon: 'https://ik.imagekit.io/rcsesr4xf/nature-noon.mp4',
    evening: 'https://ik.imagekit.io/rcsesr4xf/nature-evening.mp4',
    night: 'https://ik.imagekit.io/rcsesr4xf/nature-night.mp4',
    _fallback: 'https://cdn.pixabay.com/video/2020/07/12/44940-439608654_large.mp4',
};

function fmtTime(s: number) {
    if (!s || isNaN(s)) return '--:--';
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// ── Leela Canvas — Mirrors the actual LeelaCanvas phase aesthetics ─────────────
// Phase palette is injected from TOD_RAAG to match what actually renders on /project-leela
// Morning   → Muladhara phase  (gold/amber/fire)
// Night     → Anahata phase    (deep indigo/blue/teal)
// Evening   → Sahasrara phase  (violet/cosmic purple)
function LeelaMinCanvas({ isPlaying, palette }: { isPlaying: boolean; palette: string[] }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);
    const t = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const [p0, p1, p2] = palette;

        const draw = () => {
            const W = canvas.width, H = canvas.height;
            const cx = W / 2, cy = H / 2;
            t.current += isPlaying ? 0.020 : 0.005;

            ctx.clearRect(0, 0, W, H);

            // ── Background gradient (matches Leela page deep dark) ──────────
            const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.75);
            bg.addColorStop(0, 'rgba(10,4,28,1)');
            bg.addColorStop(0.6, 'rgba(4,2,14,1)');
            bg.addColorStop(1, 'rgba(2,1,8,1)');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, W, H);

            // ── Outer nebula glow — changes with TOD palette ─────────────────
            const nebula = ctx.createRadialGradient(cx, cy, W * 0.10, cx, cy, W * 0.58);
            nebula.addColorStop(0, `rgba(${p0},${0.18 + Math.sin(t.current * 0.55) * 0.08})`);
            nebula.addColorStop(0.45, `rgba(${p1},${0.10 + Math.sin(t.current * 0.40) * 0.05})`);
            nebula.addColorStop(0.8, `rgba(${p2},0.04)`);
            nebula.addColorStop(1, 'transparent');
            ctx.fillStyle = nebula;
            ctx.beginPath();
            ctx.arc(cx, cy, W * 0.58, 0, Math.PI * 2);
            ctx.fill();

            // ── Star field (static micro-points like Leela canvas) ──────────
            if (t.current < 0.05) {
                // seed stars only once
                (canvas as HTMLCanvasElement & { _stars?: [number, number, number][] })._stars =
                    Array.from({ length: 40 }, () => [
                        Math.random() * W, Math.random() * H, Math.random() * 0.5 + 0.2
                    ]);
            }
            const stars = (canvas as HTMLCanvasElement & { _stars?: [number, number, number][] })._stars ?? [];
            stars.forEach(([sx, sy, sr]) => {
                ctx.beginPath();
                ctx.arc(sx, sy, sr, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${0.25 + Math.sin(t.current * 2 + sx) * 0.15})`;
                ctx.fill();
            });

            // ── 3 rotating geometric rings (Leela mandala phases) ───────────
            const rings = [
                { r: 0.40, petals: 6, speed: 0.30, dot: 0.030, col: p0, opacity: 0.55 },
                { r: 0.28, petals: 8, speed: -0.50, dot: 0.022, col: p1, opacity: 0.45 },
                { r: 0.17, petals: 12, speed: 0.80, dot: 0.014, col: p2, opacity: 0.38 },
            ];
            rings.forEach(({ r, petals, speed, dot, col, opacity }) => {
                const spd = isPlaying ? speed : speed * 0.18;
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(t.current * spd);
                // Connecting polygon
                ctx.beginPath();
                for (let i = 0; i <= petals; i++) {
                    const ang = (i / petals) * Math.PI * 2;
                    const x = Math.cos(ang) * W * r, y = Math.sin(ang) * W * r;
                    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }
                ctx.strokeStyle = `rgba(${col},${opacity * 0.25})`;
                ctx.lineWidth = 0.8;
                ctx.stroke();
                // Nodes
                for (let i = 0; i < petals; i++) {
                    const ang = (i / petals) * Math.PI * 2;
                    const x = Math.cos(ang) * W * r, y = Math.sin(ang) * W * r;
                    // glow
                    const g = ctx.createRadialGradient(x, y, 0, x, y, W * dot * 2.5);
                    g.addColorStop(0, `rgba(${col},${opacity})`);
                    g.addColorStop(1, 'transparent');
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.arc(x, y, W * dot * 2.5, 0, Math.PI * 2);
                    ctx.fill();
                    // solid dot
                    ctx.fillStyle = `rgba(${col},${opacity + 0.1})`;
                    ctx.beginPath();
                    ctx.arc(x, y, W * dot, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            });

            // ── Central orb — Leela OM pulsing core ─────────────────────────
            const pulse = 1 + Math.sin(t.current * 1.6) * (isPlaying ? 0.14 : 0.04);
            const sz = W * 0.13 * pulse;

            // outer glow bloom
            const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, sz * 2.8);
            bloom.addColorStop(0, `rgba(${p0},0.40)`);
            bloom.addColorStop(0.4, `rgba(${p1},0.15)`);
            bloom.addColorStop(1, 'transparent');
            ctx.fillStyle = bloom;
            ctx.beginPath();
            ctx.arc(cx, cy, sz * 2.8, 0, Math.PI * 2);
            ctx.fill();

            // core orb
            const orb = ctx.createRadialGradient(cx, cy, 0, cx, cy, sz);
            orb.addColorStop(0, 'rgba(255,252,230,1)');
            orb.addColorStop(0.3, `rgba(${p0},0.92)`);
            orb.addColorStop(0.7, `rgba(${p1},0.50)`);
            orb.addColorStop(1, 'transparent');
            ctx.fillStyle = orb;
            ctx.beginPath();
            ctx.arc(cx, cy, sz, 0, Math.PI * 2);
            ctx.fill();

            // OM symbol
            ctx.save();
            ctx.translate(cx, cy);
            ctx.fillStyle = `rgba(8,3,20,0.90)`;
            ctx.font = `bold ${W * 0.12}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('ॐ', 0, W * 0.01);
            ctx.restore();

            rafRef.current = requestAnimationFrame(draw);
        };

        rafRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(rafRef.current);
    }, [isPlaying, palette]);

    return (
        <canvas
            ref={canvasRef}
            width={240}
            height={240}
            style={{ width: '100%', height: '100%', display: 'block' }}
        />
    );
}

export default function LeelaCard() {
    const [period] = useState(() => getTimePeriod());
    const raagMeta = TOD_RAAG[period];

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const stemsRef = useRef<HTMLAudioElement[]>([]);

    const [isPlaying, setIsPlaying] = useState(false);
    const [idx, setIdx] = useState(0);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [videoError, setVideoError] = useState(false);

    const track = TRACKS[idx];
    const isLeela = !!track.isLeela;
    const videoSrc = videoError ? TOD_VIDEOS._fallback : (TOD_VIDEOS[period] ?? TOD_VIDEOS._fallback);

    // Bootstrap single audio element
    useEffect(() => {
        const a = new Audio();
        a.crossOrigin = 'anonymous';
        a.preload = 'metadata';
        a.onended = () => setIdx(i => (i + 1) % TRACKS.length);
        a.ontimeupdate = () => {
            setCurrentTime(a.currentTime);
            setProgress(a.duration ? a.currentTime / a.duration : 0);
        };
        a.onloadedmetadata = () => setDuration(a.duration);
        audioRef.current = a;
        return () => {
            a.pause(); a.src = '';
            stemsRef.current.forEach(s => { s.pause(); s.src = ''; });
            stemsRef.current = [];
        };
    }, []);

    // Load track on index change
    useEffect(() => {
        const wasPlaying = isPlaying;
        stemsRef.current.forEach(s => { s.pause(); s.src = ''; });
        stemsRef.current = [];
        setProgress(0); setCurrentTime(0); setDuration(0);

        const a = audioRef.current; if (!a) return;
        if (isLeela && track.stems) {
            a.pause(); a.src = '';
            const stems = track.stems.map(({ url, vol }) => {
                const el = new Audio(url);
                el.crossOrigin = 'anonymous';
                el.loop = true;
                el.volume = vol;
                el.preload = 'metadata';
                return el;
            });
            stemsRef.current = stems;
            stems[0].ontimeupdate = () => {
                setCurrentTime(stems[0].currentTime);
                setProgress(stems[0].duration ? stems[0].currentTime / stems[0].duration : 0);
            };
            stems[0].onloadedmetadata = () => setDuration(stems[0].duration);
            if (wasPlaying) stems.forEach(el => el.play().catch(() => setIsPlaying(false)));
        } else {
            a.src = TRACKS[idx].src; a.loop = false; a.load();
            a.onended = () => setIdx(i => (i + 1) % TRACKS.length);
            if (wasPlaying) a.play().catch(() => setIsPlaying(false));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idx]);

    // Unified play/pause
    const togglePlayback = useCallback(() => {
        setIsPlaying(prev => {
            const next = !prev;
            if (next) {
                videoRef.current?.play().catch(() => { });
                if (isLeela && stemsRef.current.length > 0) {
                    stemsRef.current.forEach(el => el.play().catch(() => setIsPlaying(false)));
                } else {
                    audioRef.current?.play().catch(() => setIsPlaying(false));
                }
            } else {
                videoRef.current?.pause();
                if (isLeela && stemsRef.current.length > 0) {
                    stemsRef.current.forEach(el => el.pause());
                } else {
                    audioRef.current?.pause();
                }
            }
            return next;
        });
    }, [isLeela]);

    useEffect(() => {
        if (!videoRef.current) return;
        if (isPlaying) videoRef.current.play().catch(() => { });
        else videoRef.current.pause();
    }, [isPlaying]);

    const prev = useCallback(() => setIdx(i => (i - 1 + TRACKS.length) % TRACKS.length), []);
    const next = useCallback(() => setIdx(i => (i + 1) % TRACKS.length), []);

    const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (isLeela) {
            stemsRef.current.forEach(el => {
                if (!el.duration) return;
                const rect = e.currentTarget.getBoundingClientRect();
                el.currentTime = ((e.clientX - rect.left) / rect.width) * el.duration;
            });
        } else {
            const a = audioRef.current; if (!a || !a.duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            a.currentTime = ((e.clientX - rect.left) / rect.width) * a.duration;
        }
    }, [isLeela]);

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    if (isMobile) {
        return (
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-sm mx-auto flex flex-col rounded-[2rem] backdrop-blur-2xl bg-[#0a0a0e]/90 border border-white/10 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] my-6"
            >
                {/* 1. Top Visual Area */}
                <div className="relative w-full h-56 bg-black/50 overflow-hidden">
                    {/* Video backdrop */}
                    <video
                        ref={videoRef}
                        src={videoSrc}
                        autoPlay muted loop playsInline disablePictureInPicture
                        onError={() => setVideoError(true)}
                        style={{
                            position: 'absolute', inset: 0, zIndex: 0,
                            width: '100%', height: '100%', objectFit: 'cover',
                            opacity: isLeela ? 0.35 : 0.65,
                            transform: isPlaying ? 'scale(1.08)' : 'scale(1.01)',
                            transition: 'transform 10s ease-out, opacity 1.4s ease',
                        }}
                    />
                    {/* Dark gradient base */}
                    <div style={{
                        position: 'absolute', inset: 0, zIndex: 1,
                        background: `radial-gradient(ellipse at center, transparent 0%, rgba(4,2,14,0.6) 100%)`
                    }} />
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', zIndex: 1,
                        background: `linear-gradient(to top, rgba(10,10,14,1), transparent)`,
                    }} />
                    {/* Leela Mandala Canvas */}
                    {isLeela && (
                        <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
                            <LeelaMinCanvas isPlaying={isPlaying} palette={raagMeta.canvasPalette} />
                        </div>
                    )}

                    {/* Meta floating tag top-right */}
                    <div className="absolute top-4 right-4 z-10 backdrop-blur-md bg-black/40 border rounded-full px-3 py-1 flex items-center gap-2"
                        style={{ borderColor: `rgba(${raagMeta.canvasPalette[0]},0.3)` }}>
                        <Moon size={12} style={{ color: raagMeta.accent }} />
                        <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: raagMeta.accent }}>{raagMeta.tag}</span>
                    </div>
                </div>

                {/* 2. Content & Controls Area */}
                <div className="flex flex-col p-6 gap-5 bg-[#0a0a0e]">

                    {/* Typography Header */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden text-[10px] tracking-[0.2em] uppercase font-bold whitespace-nowrap"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', color: raagMeta.accent }}>
                            <span>{raagMeta.label}</span>
                        </div>
                        <h3 className="text-2xl font-serif text-white tracking-wide mt-1 truncate">{track.title}</h3>
                        <p className="text-xs text-white/50 font-sans line-clamp-2 mt-1 leading-relaxed">
                            {raagMeta.sublabel}
                        </p>
                    </div>

                    {/* Progress Bar Area */}
                    <div className="flex flex-col gap-2 mt-2">
                        <div className="w-full h-1 bg-white/10 rounded-full relative" onClick={seek} style={{ cursor: 'pointer' }}>
                            <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-300"
                                style={{
                                    width: `${progress * 100}%`,
                                    background: `linear-gradient(90deg, rgba(${raagMeta.canvasPalette[0]},0.60), rgba(${raagMeta.canvasPalette[0]},1.00))`
                                }}
                            />
                            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full transition-all duration-300"
                                style={{
                                    left: `${progress * 100}%`,
                                    transform: 'translate(-50%, -50%)',
                                    boxShadow: `0 0 10px 2px rgba(${raagMeta.canvasPalette[0]},0.8)`
                                }}
                            />
                        </div>
                        <div className="flex justify-between w-full text-[10px] text-white/40 font-mono">
                            <span>{fmtTime(currentTime)}</span>
                            <span>{fmtTime(duration)}</span>
                        </div>
                    </div>

                    {/* Playback Controls Area */}
                    <div className="flex items-center justify-center gap-8 relative mt-1">
                        <button onClick={prev} className="text-white/60 hover:text-white transition"><SkipBack size={24} strokeWidth={1.5} /></button>

                        <button
                            onClick={togglePlayback}
                            className="w-16 h-16 flex items-center justify-center rounded-full border text-white hover:scale-105 transition shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                            style={{
                                background: isPlaying
                                    ? `linear-gradient(145deg, rgba(${raagMeta.canvasPalette[0]},0.70), rgba(${raagMeta.canvasPalette[1]},0.45))`
                                    : 'rgba(255,255,255,0.1)',
                                borderColor: isPlaying ? `rgba(${raagMeta.canvasPalette[0]},0.90)` : 'rgba(255,255,255,0.2)'
                            }}
                        >
                            {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                        </button>

                        <button onClick={next} className="text-white/60 hover:text-white transition"><SkipForward size={24} strokeWidth={1.5} /></button>
                    </div>

                    {/* Footer Watermark */}
                    {isLeela && (
                        <div className="w-full flex justify-center mt-2">
                            <span className="text-[9px] tracking-[0.3em] uppercase flex items-center gap-1 justify-center" style={{ color: `rgba(${raagMeta.canvasPalette[0]},0.6)` }}>
                                <Layers size={10} /> 3 Stems Sakha Bodhi
                            </span>
                        </div>
                    )}
                </div>
            </motion.section>
        );
    }

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{
                position: 'relative',
                maxWidth: 900,
                margin: '1rem auto 2rem',
                width: 'calc(100% - 2rem)',
                borderRadius: '2rem',
                overflow: 'hidden',
                minHeight: 'clamp(280px, 42vw, 360px)',
                border: `1px solid rgba(${raagMeta.canvasPalette[0]},0.22)`,
                boxShadow: `
                    0 8px 60px rgba(0,0,0,0.70),
                    0 0 0 1px rgba(${raagMeta.canvasPalette[0]},0.08),
                    0 0 80px rgba(${raagMeta.canvasPalette[0]},0.07)
                `,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'stretch',
            }}
        >
            {/* ── Glass base ── */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 0,
                background: 'rgba(4,2,14,0.92)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
            }} />

            {/* ── Top shimmer line ── */}
            <div style={{
                position: 'absolute', top: 0, left: '8%', right: '8%', height: 1, zIndex: 2,
                background: `linear-gradient(90deg, transparent, rgba(${raagMeta.canvasPalette[0]},0.70), rgba(${raagMeta.canvasPalette[1]},0.45), transparent)`,
            }} />

            {/* ════ LEFT — Album Art Panel (40%) ════ */}
            <div style={{
                position: 'relative',
                width: '40%',
                flexShrink: 0,
                overflow: 'hidden',
                background: 'rgba(2,1,8,1)',
            }}>
                {/* Video backdrop */}
                <video
                    ref={videoRef}
                    src={videoSrc}
                    autoPlay muted loop playsInline disablePictureInPicture
                    onError={() => setVideoError(true)}
                    style={{
                        position: 'absolute', inset: 0, zIndex: 0,
                        width: '100%', height: '100%', objectFit: 'cover',
                        opacity: isLeela ? 0.28 : 0.58,
                        transform: isPlaying ? 'scale(1.08)' : 'scale(1.01)',
                        transition: 'transform 10s ease-out, opacity 1.4s ease',
                    }}
                />
                {/* Deep vignette */}
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 1,
                    background: `linear-gradient(
                        to right,
                        rgba(4,2,14,0.10) 0%,
                        rgba(4,2,14,0.85) 100%
                    )`,
                }} />
                {/* Bottom gradient to hide video edge */}
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', zIndex: 1,
                    background: `linear-gradient(to top, rgba(4,2,14,0.80), transparent)`,
                }} />
                {/* Leela Mandala Canvas */}
                {isLeela && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
                        <LeelaMinCanvas isPlaying={isPlaying} palette={raagMeta.canvasPalette} />
                    </div>
                )}
                {/* Blend edge into right panel */}
                <div style={{
                    position: 'absolute', top: 0, right: 0, bottom: 0, width: 64, zIndex: 3,
                    background: 'linear-gradient(to right, transparent, rgba(4,2,14,0.95))',
                    pointerEvents: 'none',
                }} />
            </div>

            {/* ════ RIGHT — Info + Controls (60%) ════ */}
            <div style={{
                flex: 1,
                position: 'relative', zIndex: 3,
                display: 'flex', flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 'clamp(1rem,3vw,1.6rem) clamp(1rem,3vw,1.8rem)',
                minWidth: 0,
            }}>

                {/* ── SECTION A: Track identity ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.28rem' }}>

                    {/* Eyebrow — raag + period */}
                    <p style={{
                        margin: 0,
                        fontSize: 'clamp(0.55rem, 1.4vw, 0.65rem)',
                        letterSpacing: '0.22em', textTransform: 'uppercase',
                        fontFamily: 'monospace', fontWeight: 700,
                        color: raagMeta.accent,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                        {raagMeta.label}
                    </p>

                    {/* Title — the BIG headline */}
                    <h3 style={{
                        margin: 0,
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: 'clamp(1.05rem, 3.2vw, 1.38rem)',
                        fontWeight: 700, color: '#FFFFFF',
                        lineHeight: 1.15, letterSpacing: '-0.02em',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{track.title}</h3>

                    {/* Artist */}
                    <p style={{
                        margin: 0,
                        fontSize: 'clamp(0.68rem, 1.6vw, 0.76rem)',
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                        fontFamily: 'monospace',
                        color: 'rgba(255,255,255,0.48)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{track.artist}</p>

                    {/* Tagline — italic serif */}
                    <p style={{
                        margin: '0.3rem 0 0',
                        fontSize: 'clamp(0.78rem, 2vw, 0.90rem)',
                        fontStyle: 'italic',
                        color: 'rgba(255,255,255,0.55)',
                        lineHeight: 1.55, letterSpacing: '0.005em',
                        fontFamily: "'Playfair Display', Georgia, serif",
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                    }}>{raagMeta.sublabel}</p>
                </div>

                {/* ── SECTION B: Track selector + TOD tag ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.38rem', alignItems: 'center' }}>
                        {TRACKS.map((tr, i) => (
                            <button key={tr.id} onClick={() => { setIdx(i); setIsPlaying(true); }}
                                style={{
                                    width: i === idx ? 24 : 8, height: 8, borderRadius: 999,
                                    background: i === idx
                                        ? `rgba(${raagMeta.canvasPalette[0]},0.95)`
                                        : 'rgba(255,255,255,0.22)',
                                    border: 'none', cursor: 'pointer', padding: 0,
                                    transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)',
                                }}
                                aria-label={tr.title}
                            />
                        ))}
                    </div>
                    <span style={{
                        fontSize: 'clamp(0.55rem,1.4vw,0.64rem)',
                        letterSpacing: '0.14em', fontWeight: 700,
                        textTransform: 'uppercase', fontFamily: 'monospace',
                        color: raagMeta.accent,
                        background: `rgba(${raagMeta.canvasPalette[0]},0.12)`,
                        border: `1px solid rgba(${raagMeta.canvasPalette[0]},0.30)`,
                        borderRadius: 999, padding: '0.25rem 0.70rem',
                        whiteSpace: 'nowrap', flexShrink: 0,
                    }}>{raagMeta.tag}</span>
                </div>

                {/* ── SECTION C: Progress bar ── */}
                <div>
                    <div onClick={seek} style={{
                        width: '100%', height: 5, borderRadius: 999,
                        background: 'rgba(255,255,255,0.10)',
                        cursor: 'pointer', position: 'relative',
                    }}>
                        <div style={{
                            height: '100%', borderRadius: 999,
                            width: `${progress * 100}%`,
                            background: `linear-gradient(90deg,
                                rgba(${raagMeta.canvasPalette[0]},0.60),
                                rgba(${raagMeta.canvasPalette[0]},1.00)
                            )`,
                            position: 'relative',
                            transition: 'width 0.25s linear',
                        }}>
                            <div style={{
                                position: 'absolute', right: -6, top: '50%',
                                transform: 'translateY(-50%)',
                                width: 14, height: 14, borderRadius: '50%',
                                background: '#FFFFFF',
                                boxShadow: `0 0 12px 3px rgba(${raagMeta.canvasPalette[0]},0.85)`,
                            }} />
                        </div>
                    </div>
                    <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        marginTop: '0.32rem',
                        fontSize: 'clamp(0.58rem,1.4vw,0.64rem)',
                        color: 'rgba(255,255,255,0.38)',
                        letterSpacing: '0.10em', fontFamily: 'monospace',
                    }}>
                        <span>{fmtTime(currentTime)}</span>
                        <span>{fmtTime(duration)}</span>
                    </div>
                </div>

                {/* ── SECTION D: Playback controls — the hero row ── */}
                <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '1.4rem',
                }}>
                    {/* ◀ PREV */}
                    <motion.button
                        onClick={prev}
                        whileHover={{ scale: 1.10, background: 'rgba(255,255,255,0.18)' }}
                        whileTap={{ scale: 0.90 }}
                        style={{
                            width: 44, height: 44, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.10)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            border: '1.5px solid rgba(255,255,255,0.28)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: 'rgba(255,255,255,0.88)', lineHeight: 0,
                            boxShadow: '0 2px 16px rgba(0,0,0,0.40)',
                            transition: 'border 0.2s',
                        }}
                        aria-label="Previous"
                    >
                        <SkipBack size={18} strokeWidth={2.2} />
                    </motion.button>

                    {/* ▶ / ⏸  PLAY — 64px hero */}
                    <motion.button
                        onClick={togglePlayback}
                        whileTap={{ scale: 0.88 }}
                        whileHover={{ scale: 1.07 }}
                        animate={isPlaying ? {
                            boxShadow: [
                                `0 0 0 0   rgba(${raagMeta.canvasPalette[0]},0.55)`,
                                `0 0 0 18px rgba(${raagMeta.canvasPalette[0]},0.00)`,
                                `0 0 0 0   rgba(${raagMeta.canvasPalette[0]},0.55)`,
                            ],
                        } : {
                            boxShadow: '0 6px 28px rgba(0,0,0,0.55)',
                        }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            width: 64, height: 64, borderRadius: '50%',
                            /* Paused: solid frosted white — impossible to miss */
                            /* Playing: rich accent gradient */
                            background: isPlaying
                                ? `linear-gradient(145deg,
                                    rgba(${raagMeta.canvasPalette[0]},0.70),
                                    rgba(${raagMeta.canvasPalette[1]},0.45))`
                                : 'linear-gradient(145deg, rgba(255,255,255,0.32), rgba(255,255,255,0.14))',
                            backdropFilter: 'blur(24px)',
                            WebkitBackdropFilter: 'blur(24px)',
                            border: isPlaying
                                ? `2.5px solid rgba(${raagMeta.canvasPalette[0]},0.90)`
                                : '2.5px solid rgba(255,255,255,0.65)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                            color: isPlaying ? raagMeta.accent : '#FFFFFF',
                            transition: 'background 0.4s ease, border-color 0.4s ease, color 0.4s ease',
                        }}
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isPlaying
                            ? <Pause size={24} fill="currentColor" />
                            : <Play size={24} fill="currentColor" style={{ marginLeft: 3 }} />}
                    </motion.button>

                    {/* ▶▶ NEXT */}
                    <motion.button
                        onClick={next}
                        whileHover={{ scale: 1.10, background: 'rgba(255,255,255,0.18)' }}
                        whileTap={{ scale: 0.90 }}
                        style={{
                            width: 44, height: 44, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.10)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            border: '1.5px solid rgba(255,255,255,0.28)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: 'rgba(255,255,255,0.88)', lineHeight: 0,
                            boxShadow: '0 2px 16px rgba(0,0,0,0.40)',
                            transition: 'border 0.2s',
                        }}
                        aria-label="Next"
                    >
                        <SkipForward size={18} strokeWidth={2.2} />
                    </motion.button>

                    {/* 3 Stems badge — only for Leela tracks */}
                    {isLeela && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Waves size={13} style={{ color: `rgba(${raagMeta.canvasPalette[0]},0.80)` }} />
                            <span style={{
                                fontSize: 'clamp(0.56rem,1.4vw,0.62rem)',
                                letterSpacing: '0.14em', fontFamily: 'monospace',
                                textTransform: 'uppercase',
                                color: `rgba(${raagMeta.canvasPalette[0]},0.80)`,
                            }}>3 Stems</span>
                        </div>
                    )}
                </div>

            </div>
        </motion.section>
    );
}
