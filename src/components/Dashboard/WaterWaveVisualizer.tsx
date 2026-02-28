'use client';

import React, { useEffect, useRef } from 'react';

interface Props {
    audioRef: React.RefObject<HTMLAudioElement | null>;
    playing: boolean;
    height?: number;
    accentColor?: string;
}

interface Star { x: number; y: number; r: number; phase: number; speed: number; }
interface Drop { cx: number; amp: number; k: number; omega: number; age: number; decay: number; }

let STARS: Star[] = [];
let SHARED_ACTX: AudioContext | null = null;
const CONNECTED = new WeakSet<HTMLAudioElement>();
const ANALYSER_MAP = new WeakMap<HTMLAudioElement, AnalyserNode>();

function avg(d: Uint8Array<ArrayBuffer>, a: number, b: number) {
    if (b <= a) return 0;
    let s = 0; for (let i = a; i < b; i++) s += d[i]; return s / (b - a);
}
function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function getLunarAge(): number {
    const newMoon = new Date('2000-01-06T18:14:00Z').getTime();
    const lunation = 29.53058867 * 86400000;
    const age = ((Date.now() - newMoon) % lunation + lunation) % lunation;
    return (age / lunation) * 29.53;
}

/* ─── Photorealistic 3D Sun ──────────────────────────────────────────────── */
function drawSun3D(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, energy: number, t: number, hf: number) {
    ctx.save();

    /* Colors vary by time of day */
    let innerC: [number, number, number] = [255, 252, 228];
    let midC: [number, number, number] = [255, 210, 60];
    let outerC: [number, number, number] = [255, 150, 20];
    let coronaA = 0.30;

    if (hf < 7) { // sunrise — orange-red
        innerC = [255, 220, 130]; midC = [255, 110, 30]; outerC = [200, 45, 0]; coronaA = 0.45;
    } else if (hf < 9) { // early morning — warm gold
        innerC = [255, 240, 170]; midC = [255, 170, 40]; outerC = [220, 100, 5]; coronaA = 0.38;
    } else if (hf >= 11 && hf < 15) { // noon — white-gold
        innerC = [255, 254, 242]; midC = [255, 230, 80]; outerC = [240, 180, 10]; coronaA = 0.22;
    } else if (hf >= 16) { // late afternoon / sunset
        innerC = [255, 230, 140]; midC = [255, 120, 30]; outerC = [200, 48, 0]; coronaA = 0.46;
    }

    /* 1. Wide diffuse atmospheric halo */
    const halo = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 4.0);
    halo.addColorStop(0, `rgba(${outerC[0]},${outerC[1]},${outerC[2]},${coronaA + energy * 0.15})`);
    halo.addColorStop(0.35, `rgba(${outerC[0]},${outerC[1]},${outerC[2]},${coronaA * 0.35})`);
    halo.addColorStop(1, `rgba(${outerC[0]},${outerC[1]},${outerC[2]},0)`);
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(cx, cy, r * 4.0, 0, Math.PI * 2); ctx.fill();

    /* 2. Solar rays */
    const rayCount = 14;
    for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2 + t * 0.18;
        const rayLen = r * (1.5 + 0.3 * Math.sin(t * 1.4 + i * 1.3) + energy * 0.6);
        const alpha = (0.12 + energy * 0.20) * (0.55 + 0.45 * Math.sin(t * 0.6 + i));
        ctx.strokeStyle = `rgba(${midC[0]},${midC[1]},${midC[2]},${alpha})`;
        ctx.lineWidth = 1.0 + energy * 1.8;
        ctx.shadowBlur = 10 + energy * 14; ctx.shadowColor = `rgba(${outerC[0]},${outerC[1]},${outerC[2]},0.5)`;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * r * 0.94, cy + Math.sin(angle) * r * 0.94);
        ctx.lineTo(cx + Math.cos(angle) * rayLen, cy + Math.sin(angle) * rayLen);
        ctx.stroke();
    }
    ctx.shadowBlur = 0;

    /* 3. Corona ring (chromosphere) */
    const corona = ctx.createRadialGradient(cx, cy, r * 0.90, cx, cy, r * 1.45);
    corona.addColorStop(0, `rgba(${outerC[0]},${outerC[1]},${outerC[2]},${0.55 + energy * 0.25})`);
    corona.addColorStop(0.5, `rgba(${outerC[0]},${outerC[1]},${outerC[2]},${0.20 + energy * 0.12})`);
    corona.addColorStop(1, `rgba(${outerC[0]},${outerC[1]},${outerC[2]},0)`);
    ctx.fillStyle = corona;
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.45, 0, Math.PI * 2); ctx.fill();

    /* 4. Sun disc with sphere shading (limb darkening) */
    ctx.shadowBlur = 36 + energy * 30;
    ctx.shadowColor = `rgba(${outerC[0]},${outerC[1]},${outerC[2]},0.80)`;
    const disc = ctx.createRadialGradient(cx - r * 0.28, cy - r * 0.28, 0, cx, cy, r);
    disc.addColorStop(0.0, `rgb(${innerC[0]},${innerC[1]},${innerC[2]})`);
    disc.addColorStop(0.40, `rgb(${midC[0]},${midC[1]},${midC[2]})`);
    disc.addColorStop(0.80, `rgb(${outerC[0]},${outerC[1]},${outerC[2]})`);
    disc.addColorStop(1.0, `rgb(${Math.max(0, outerC[0] - 50)},${Math.max(0, outerC[1] - 50)},${Math.max(0, outerC[2] - 20)})`);
    ctx.fillStyle = disc;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    /* 5. Subtle specular glint on disc surface */
    const glint = ctx.createRadialGradient(cx - r * 0.38, cy - r * 0.34, 0, cx - r * 0.38, cy - r * 0.34, r * 0.42);
    glint.addColorStop(0, `rgba(255,255,255,${0.22 + energy * 0.08})`);
    glint.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glint;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
}

/* ─── Photorealistic 3D Moon (from previous — keeping it) ────────────────── */
function drawMoon3D(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, energy: number, lunarAge: number) {
    ctx.save();
    const halo = ctx.createRadialGradient(cx, cy, r * 0.65, cx, cy, r * 3.2);
    halo.addColorStop(0, `rgba(220,205,150,${0.14 + energy * 0.10})`);
    halo.addColorStop(0.4, `rgba(200,186,130,${0.07 + energy * 0.05})`);
    halo.addColorStop(1, 'rgba(180,165,110,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(cx, cy, r * 3.2, 0, Math.PI * 2); ctx.fill();

    ctx.beginPath(); ctx.arc(cx, cy, r + 0.5, 0, Math.PI * 2); ctx.clip();

    // Dark side — visible, dark grey-blue
    ctx.fillStyle = 'rgb(14,16,24)';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

    const phase = lunarAge / 29.53;
    ctx.save();
    if (phase < 0.5) {
        const waxX = r * Math.cos(Math.PI * (1 - 2 * phase));
        ctx.beginPath();
        ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2);
        const ex = Math.abs(waxX);
        ctx.ellipse(cx, cy, ex < 1 ? 1 : ex, r, 0, Math.PI / 2, -Math.PI / 2, true);
        ctx.closePath(); ctx.clip();
    } else {
        const wanX = r * Math.cos(Math.PI * (2 * phase - 1));
        ctx.beginPath();
        ctx.arc(cx, cy, r, Math.PI / 2, -Math.PI / 2);
        const ex = Math.abs(wanX);
        ctx.ellipse(cx, cy, ex < 1 ? 1 : ex, r, 0, -Math.PI / 2, Math.PI / 2, true);
        ctx.closePath(); ctx.clip();
    }

    const litGrad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.30, 0, cx, cy, r);
    litGrad.addColorStop(0.0, '#f9f0c8'); litGrad.addColorStop(0.30, '#e8dba0');
    litGrad.addColorStop(0.65, '#c8be80'); litGrad.addColorStop(0.88, '#9e9060');
    litGrad.addColorStop(1.0, '#605830');
    ctx.fillStyle = litGrad;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

    const maria = [
        { rx: -0.18, ry: -0.12, rw: 0.28, rh: 0.22 }, { rx: 0.08, ry: -0.05, rw: 0.18, rh: 0.15 },
        { rx: -0.05, ry: 0.18, rw: 0.22, rh: 0.16 }, { rx: 0.20, ry: 0.10, rw: 0.14, rh: 0.12 },
    ];
    ctx.globalAlpha = 0.20;
    for (const m of maria) {
        const mg = ctx.createRadialGradient(cx + m.rx * r, cy + m.ry * r, 0, cx + m.rx * r, cy + m.ry * r, m.rw * r);
        mg.addColorStop(0, 'rgba(60,52,28,0.85)'); mg.addColorStop(1, 'rgba(60,52,28,0)');
        ctx.fillStyle = mg;
        ctx.beginPath(); ctx.ellipse(cx + m.rx * r, cy + m.ry * r, m.rw * r, m.rh * r, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    const spec = ctx.createRadialGradient(cx - r * 0.55, cy - r * 0.45, 0, cx - r * 0.55, cy - r * 0.45, r * 0.45);
    spec.addColorStop(0, `rgba(255,252,230,${0.18 + energy * 0.10})`); spec.addColorStop(1, 'rgba(255,252,230,0)');
    ctx.fillStyle = spec; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    const rimGrad = ctx.createRadialGradient(cx, cy, r * 0.82, cx, cy, r);
    rimGrad.addColorStop(0, 'rgba(100,95,70,0)');
    rimGrad.addColorStop(0.7, `rgba(80,76,55,${0.08 + energy * 0.04})`);
    rimGrad.addColorStop(1, `rgba(60,58,42,${0.14 + energy * 0.05})`);
    ctx.fillStyle = rimGrad; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

function dropY(drop: Drop, nx: number): number {
    const dx = Math.abs(nx - drop.cx);
    const r = dx * drop.k - drop.omega * drop.age * 0.05;
    const env = Math.exp(-drop.decay * drop.age);
    return (drop.amp * Math.sin(r) + drop.amp * 0.45 * Math.sin(2.2 * r - 1.1) * Math.exp(-drop.decay * drop.age * 1.6)) * env;
}

/* ─────────────────────────────────────────────────────────────────────────── */
export default function WaterWaveVisualizer({ audioRef, playing, height = 600, accentColor = '#FFD580' }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataRef = useRef<Uint8Array<ArrayBuffer>>(new Uint8Array(2048) as Uint8Array<ArrayBuffer>);
    const timeRef = useRef(0);
    const dropsRef = useRef<Drop[]>([]);
    const prevBassRef = useRef(0);
    const synthRef = useRef({ bass: 0, mid: 0, treble: 0 });
    // Instantaneous peak for transient detection
    const peakRef = useRef(0);
    const peakDecayRef = useRef(0);
    // Whether the render loop is alive (needed for visibility resume)
    const loopAliveRef = useRef(false);
    const playingRef = useRef(playing);
    // Holds the latest tick function so the visibility handler can restart it
    const tickRef = useRef<() => void>(() => { });

    /* ── Stars ───────────────────────────────────────────────────────────── */
    useEffect(() => {
        if (STARS.length === 0) {
            STARS = Array.from({ length: 100 }, () => ({
                x: Math.random(), y: Math.random() * 0.52,
                r: 0.5 + Math.random() * 1.6,
                phase: Math.random() * Math.PI * 2,
                speed: 0.15 + Math.random() * 0.7,
            }));
        }
    }, []);

    /* ── Audio setup ─────────────────────────────────────────────────────── */
    useEffect(() => {
        if (!audioRef.current) return;
        const audio = audioRef.current;
        if (CONNECTED.has(audio)) {
            const cached = ANALYSER_MAP.get(audio);
            if (cached) analyserRef.current = cached;
            dataRef.current = new Uint8Array(analyserRef.current!.frequencyBinCount) as Uint8Array<ArrayBuffer>;
            return;
        }
        try {
            if (!audio.crossOrigin) audio.crossOrigin = 'anonymous';
            if (!SHARED_ACTX) {
                SHARED_ACTX = new (window.AudioContext || (window as any).webkitAudioContext)();
                (window as any).__sharedActx = SHARED_ACTX;
            }
            const source = SHARED_ACTX.createMediaElementSource(audio);
            const an = SHARED_ACTX.createAnalyser();
            // fftSize 4096 → 2048 bins → finer frequency resolution for sa-re-ga-ma tracking
            an.fftSize = 4096;
            // 0.72 smoothing (was 0.92): reacts in ~3 frames instead of ~12 — tight beat following
            an.smoothingTimeConstant = 0.72;
            source.connect(an); an.connect(SHARED_ACTX.destination);
            analyserRef.current = an;
            dataRef.current = new Uint8Array(an.frequencyBinCount) as Uint8Array<ArrayBuffer>;
            CONNECTED.add(audio); ANALYSER_MAP.set(audio, an);
        } catch (e) { console.warn('[WaterWave]', e); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ── AudioContext resume on playing ─────────────────────────────────── */
    useEffect(() => {
        playingRef.current = playing;
        if (playing && SHARED_ACTX?.state === 'suspended') SHARED_ACTX.resume().catch(() => { });
    }, [playing]);

    /* ── Page Visibility API — resume RAF + AudioContext when returning ── */
    useEffect(() => {
        const onVisible = () => {
            if (document.hidden) return;
            // Resume browser-suspended AudioContext
            if (SHARED_ACTX?.state === 'suspended') {
                SHARED_ACTX.resume().catch(() => { });
            }
            // Restart render loop if it died while the tab was hidden
            if (!loopAliveRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = requestAnimationFrame(tickRef.current);
                loopAliveRef.current = true;
            }
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, []);

    /* ── Render loop ─────────────────────────────────────────────────────── */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;

        const hour = new Date().getHours();
        const min = new Date().getMinutes();
        const hourF = hour + min / 60;
        const isNight = hourF < 5.5 || hourF >= 19.5;
        const isDawn = hourF >= 5.5 && hourF < 7.5;
        const isMorning = hourF >= 7.5 && hourF < 12;
        const isNoon = hourF >= 12 && hourF < 15;
        const isAfternoon = hourF >= 15 && hourF < 17.5;
        const isDusk = hourF >= 17.5 && hourF < 19.5;

        const sunNormX = isNight ? -1 : clamp01((hourF - 5.5) / 14);
        const sunArcY = isNight ? -1 : 0.72 - 0.50 * Math.sin(sunNormX * Math.PI);
        const lunarAge = getLunarAge();

        const tick = () => {
            tickRef.current = tick; // keep tickRef always up-to-date
            loopAliveRef.current = true;
            const W = canvas.width;
            const H = canvas.height;
            // Use ref so visibility API restart reads the current playing state
            const isPlaying = playingRef.current;
            const t = (timeRef.current += isPlaying ? 0.018 : 0.003);
            const an = analyserRef.current;
            const d = dataRef.current;

            /* ── 5-Band Mantric Frequency Analysis ─────────────────────────
               With fftSize 4096 we have 2048 bins. At ~44100 Hz sample rate,
               each bin covers ≈21.5 Hz. Band ranges are tuned for:
               sub-bass  (20–80 Hz)   — tabla / mridangam body
               bass      (80–300 Hz)  — dhol / bass tanpura
               vocal-mid (300–2kHz)   — mantra syllables, sitar
               presence  (2–6kHz)     — consonants, harmonics, flute
               air       (6–12kHz)    — cymbals, shimmer, breath
            ─────────────────────────────────────────────────────────────── */
            let subBass = 0, bass = 0, vocalMid = 0, presence = 0, air = 0;

            if (an && isPlaying) {
                an.getByteFrequencyData(d);
                const L = d.length;
                // Bin boundaries (L = 2048 bins for fftSize 4096 at 44.1kHz)
                subBass = avg(d, 0, Math.floor(L * 0.013)) / 255; // ~0–80 Hz
                bass = avg(d, Math.floor(L * 0.013), Math.floor(L * 0.060)) / 255; // ~80–300 Hz
                vocalMid = avg(d, Math.floor(L * 0.060), Math.floor(L * 0.240)) / 255; // ~300–1200 Hz
                presence = avg(d, Math.floor(L * 0.240), Math.floor(L * 0.480)) / 255; // ~1.2–4 kHz
                air = avg(d, Math.floor(L * 0.480), Math.floor(L * 0.720)) / 255; // ~4–9 kHz
            } else if (isPlaying) {
                // Synthetic fallback: organic mantra-rhythm simulation
                const s = synthRef.current;
                s.bass = clamp01(s.bass + (Math.sin(t * 1.4) * 0.5 + 0.5) * 0.07 - 0.025);
                s.mid = clamp01(s.mid + (Math.sin(t * 2.1 + 1.2) * 0.5 + 0.5) * 0.06 - 0.022);
                s.treble = clamp01(s.treble + (Math.sin(t * 3.5 + 2.4) * 0.5 + 0.5) * 0.05 - 0.018);
                subBass = s.bass * 0.6; bass = s.bass; vocalMid = s.mid; presence = s.mid * 0.7; air = s.treble;
            }

            // Combined energy weighted toward low-end (drives wave height)
            const energy = subBass * 0.30 + bass * 0.35 + vocalMid * 0.20 + presence * 0.10 + air * 0.05;

            /* ── Instantaneous Peak / Transient Detection ───────────────────
               Tracks the loudest momentary peak and decays it quickly.
               When live energy exceeds the decaying peak, it fires a transient
               boost — this creates the SHARP upward wave spike on every beat,
               tabla stroke, or mantra syllable onset.
            ─────────────────────────────────────────────────────────────── */
            const rawPeak = Math.max(subBass, bass, vocalMid);
            peakDecayRef.current = Math.max(0, peakDecayRef.current - 0.018);
            const transient = Math.max(0, rawPeak - peakRef.current);
            if (rawPeak > peakRef.current) {
                peakRef.current = rawPeak;
                peakDecayRef.current = 1.0; // flash full
            } else {
                peakRef.current = Math.max(0, peakRef.current - 0.04);
            }
            // peakBoost: 0 normally, spikes to ~1 on a sharp onset, decays in ~30 frames
            const peakBoost = peakDecayRef.current * transient * 6.0;

            /* Drops on bass transient */
            const bassRise = bass - prevBassRef.current;
            if (isPlaying && bass > 0.22 && bassRise > 0.055) {
                for (let i = 0; i < (bassRise > 0.12 ? 2 : 1); i++) {
                    dropsRef.current.push({
                        cx: 0.1 + Math.random() * 0.80,
                        amp: 0.08 + bass * 0.28 + Math.random() * 0.08,
                        k: 14 + Math.random() * 12, omega: 5 + Math.random() * 5,
                        age: 0, decay: 0.012 + Math.random() * 0.012,
                    });
                    if (dropsRef.current.length > 14) dropsRef.current.shift();
                }
            }
            prevBassRef.current = bass;
            dropsRef.current = dropsRef.current.filter(dp => { dp.age++; return Math.exp(-dp.decay * dp.age) > 0.01; });

            ctx.clearRect(0, 0, W, H);

            /* ═══ SKY ═════════════════════════════════════════════════════ */
            const horizonY = H * 0.50;
            const skyH = horizonY;
            const skyGrad = ctx.createLinearGradient(0, 0, 0, skyH);

            if (isNight) {
                skyGrad.addColorStop(0, `hsl(234,72%,${4 + bass * 2}%)`);
                skyGrad.addColorStop(0.5, `hsl(228,62%,${9 + vocalMid * 3}%)`);
                skyGrad.addColorStop(1, `hsl(218,55%,${15 + bass * 3}%)`);
            } else if (isDawn) {
                skyGrad.addColorStop(0, `hsl(250,56%,${12 + bass * 5}%)`);
                skyGrad.addColorStop(0.35, `hsl(280,50%,${18 + vocalMid * 5}%)`);
                skyGrad.addColorStop(0.65, `hsl(20,65%,${30 + air * 6}%)`);
                skyGrad.addColorStop(1, `hsl(38,68%,${44 + vocalMid * 4}%)`);
            } else if (isMorning) {
                skyGrad.addColorStop(0, `hsl(212,64%,${18 + bass * 6}%)`);
                skyGrad.addColorStop(0.55, `hsl(205,54%,${26 + vocalMid * 5}%)`);
                skyGrad.addColorStop(1, `hsl(200,48%,${33 + air * 4}%)`);
            } else if (isNoon) {
                skyGrad.addColorStop(0, `hsl(206,66%,${22 + bass * 7}%)`);
                skyGrad.addColorStop(0.55, `hsl(200,60%,${30 + vocalMid * 5}%)`);
                skyGrad.addColorStop(1, `hsl(195,54%,${36 + air * 3}%)`);
            } else if (isAfternoon) {
                skyGrad.addColorStop(0, `hsl(212,58%,${20 + bass * 6}%)`);
                skyGrad.addColorStop(0.45, `hsl(28,50%,${28 + vocalMid * 5}%)`);
                skyGrad.addColorStop(1, `hsl(42,54%,${40 + bass * 4}%)`);
            } else if (isDusk) {
                skyGrad.addColorStop(0, `hsl(262,46%,${10 + bass * 4}%)`);
                skyGrad.addColorStop(0.35, `hsl(300,42%,${16 + vocalMid * 5}%)`);
                skyGrad.addColorStop(0.62, `hsl(20,70%,${28 + air * 7}%)`);
                skyGrad.addColorStop(1, `hsl(44,66%,${42 + vocalMid * 5}%)`);
            } else {
                skyGrad.addColorStop(0, `hsl(236,64%,${5 + bass * 3}%)`);
                skyGrad.addColorStop(1, `hsl(222,54%,${12 + vocalMid * 3}%)`);
            }
            ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, W, skyH);

            /* ── Stars ─────────────────────────────────────────────────── */
            const starVis = isNight ? 1 : isDawn ? 0.42 : isDusk ? 0.32 : 0;
            if (starVis > 0) {
                STARS.forEach(s => {
                    const tw = 0.45 + 0.55 * Math.sin(t * s.speed * 0.6 + s.phase);
                    const a = starVis * (0.28 + tw * 0.68);
                    ctx.shadowBlur = s.r > 1.2 ? 3 : 0;
                    ctx.shadowColor = `rgba(255, 220, 140, ${a * 0.6})`;
                    ctx.beginPath();
                    ctx.arc(s.x * W, s.y * skyH * 0.94, s.r * (0.72 + tw * 0.38), 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 222, 148, ${Math.min(1, a)})`;
                    ctx.fill();
                });
                ctx.shadowBlur = 0;
            }

            /* ── 3D Sun (daytime) ─────────────────────────────────────── */
            if (!isNight && sunArcY >= 0) {
                const srSize = W * (isDawn || isDusk ? 0.082 : isNoon ? 0.054 : 0.066);
                const srX = W * lerp(0.06, 0.94, sunNormX);
                const srY = skyH * sunArcY;
                if (isDawn || isDusk || hourF < 8 || hourF > 16.5) {
                    const hGlow = ctx.createRadialGradient(srX, skyH, 0, srX, skyH, W * 0.55);
                    const hA = isDawn || isDusk ? 0.35 : 0.18;
                    hGlow.addColorStop(0, `rgba(255,110,35,${hA + energy * 0.15})`);
                    hGlow.addColorStop(0.45, `rgba(255,75,18,${hA * 0.38})`);
                    hGlow.addColorStop(1, 'rgba(200,38,0,0)');
                    ctx.fillStyle = hGlow;
                    ctx.beginPath(); ctx.arc(srX, skyH, W * 0.55, 0, Math.PI * 2); ctx.fill();
                }
                drawSun3D(ctx, srX, srY, srSize * (1 + energy * 0.10), energy, t, hourF);
            }

            /* ── 3D Moon ──────────────────────────────────────────────── */
            if (isNight || isDusk || isDawn) {
                const vis = isNight ? 1 : 0.58;
                const phase = lunarAge / 29.53;
                if (phase > 0.03 && phase < 0.97) {
                    const mR = W * 0.058 * (1 + energy * 0.06) * vis;
                    const mX = W * (isNight ? 0.5 + 0.28 * Math.sin(hourF * 0.4 - 1.0) : 0.74);
                    const mY = skyH * (isNight ? 0.20 + 0.10 * Math.cos(hourF * 0.5) : 0.28);
                    ctx.globalAlpha = vis;
                    drawMoon3D(ctx, mX, mY, mR, energy, lunarAge);
                    ctx.globalAlpha = 1;
                }
            }

            /* ═══ WATER ════════════════════════════════════════════════ */
            const waterTop = skyH;

            const oceanGrad = ctx.createLinearGradient(0, waterTop, 0, H);
            if (isNight || isDusk || isDawn) {
                oceanGrad.addColorStop(0, `hsl(218,68%,${13 + bass * 10}%)`);
                oceanGrad.addColorStop(0.30, `hsl(222,62%,${9 + vocalMid * 6}%)`);
                oceanGrad.addColorStop(0.65, `hsl(226,58%,${6 + air * 4}%)`);
                oceanGrad.addColorStop(1, `hsl(232,55%,${3 + energy * 2}%)`);
            } else if (isMorning || isNoon) {
                oceanGrad.addColorStop(0, `hsl(200,72%,${20 + bass * 14}%)`);
                oceanGrad.addColorStop(0.40, `hsl(210,65%,${12 + vocalMid * 8}%)`);
                oceanGrad.addColorStop(1, `hsl(220,58%,${4 + energy * 4}%)`);
            } else {
                oceanGrad.addColorStop(0, `hsl(210,65%,${16 + bass * 12}%)`);
                oceanGrad.addColorStop(0.40, `hsl(218,60%,${10 + vocalMid * 7}%)`);
                oceanGrad.addColorStop(1, `hsl(225,55%,${4 + energy * 3}%)`);
            }
            ctx.fillStyle = oceanGrad; ctx.fillRect(0, waterTop, W, H - waterTop);

            /* ── Horizon Crest — Mantric Fourier Wave ────────────────────
               Each harmonic is driven by a different frequency band so the
               wave literally dances in anatomically correct sync with the mantra.
               peakBoost creates the sharp "pluck" on every tabla / syllable hit.
            ─────────────────────────────────────────────────────────────── */
            const crestBaseY = waterTop;
            const crestPath: number[] = [];
            for (let px = 0; px <= W; px += 2) {
                const nx = px / W;
                let y = crestBaseY;

                // Edge window — tapers to 0 at sides (like a bounded string)
                const edgeDamp = 1.0 - Math.pow(Math.abs(nx - 0.5) * 2, 2.5);

                let harmonicSum = 0;

                // H1 — Sub-bass swell (tabla body / mridangam low-end)
                harmonicSum += Math.sin(nx * Math.PI * 2.0 - t * 1.5) *
                    (0.038 + subBass * 0.18 + peakBoost * 0.06);

                // H2 — Bass punch (dhol / bass tanpura stroke)
                harmonicSum += Math.sin(nx * Math.PI * 3.5 - t * 2.1 + 0.8) *
                    (0.022 + bass * 0.17 + peakBoost * 0.07);

                // H3 — Vocal mid (mantra syllable carrier — sa, re, ga)
                harmonicSum += Math.sin(nx * Math.PI * 5.2 - t * 2.8 + 1.2) *
                    (0.016 + vocalMid * 0.14);

                // H4 — Presence (sitar harmonics, consonant attack)
                harmonicSum += Math.sin(nx * Math.PI * 8.4 - t * 3.5 + 2.4) *
                    (presence * 0.11);

                // H5 — Air (flute breath, cymbal shimmer, overtones)
                harmonicSum += Math.sin(nx * Math.PI * 14.0 - t * 4.5 + 3.1) *
                    (air * 0.09);

                // Direct FFT micro-ripple — every frequency bin visible as tiny wave
                const fftIdx = Math.floor(nx * (d.length * 0.40));
                const fftVal = (an && isPlaying) ? (d[fftIdx] / 255.0) : 0;
                const microRipple = Math.sin(nx * Math.PI * 32.0 - t * 6.0) * (fftVal * 0.07);

                // Global scale: 1.35 base + peakBoost kicks it up to 1.80 on a hard beat
                const globalScale = 1.35 + peakBoost * 0.45;

                y += (harmonicSum + microRipple) * H * edgeDamp * globalScale;

                // Physical drop ripples
                for (const dp of dropsRef.current) y += dropY(dp, nx) * H * 0.045;

                crestPath.push(y);
            }

            // Soft underbelly shadow of the crest
            ctx.beginPath();
            ctx.moveTo(0, H);
            for (let i = 0; i < crestPath.length; i++) {
                const px = i * 2;
                i === 0 ? ctx.moveTo(0, crestPath[i] + 14) : ctx.lineTo(px, crestPath[i] + 14);
            }
            ctx.lineTo(W, H); ctx.closePath();
            const shadowGrad = ctx.createLinearGradient(0, waterTop, 0, waterTop + 30);
            shadowGrad.addColorStop(0, `rgba(5,18,45,0.88)`);
            shadowGrad.addColorStop(1, `rgba(5,18,45,0)`);
            ctx.fillStyle = shadowGrad; ctx.fill();

            // Outer glowing crest line — width and glow driven by bass + peak
            ctx.beginPath();
            for (let i = 0; i < crestPath.length; i++) {
                const px = i * 2;
                i === 0 ? ctx.moveTo(0, crestPath[i]) : ctx.lineTo(px, crestPath[i]);
            }
            ctx.shadowBlur = 22 + bass * 40 + peakBoost * 28;
            ctx.shadowColor = `rgba(255, 240, 180, ${0.65 + energy * 0.30 + peakBoost * 0.25})`;
            ctx.strokeStyle = `rgba(255, 248, 220, ${0.82 + energy * 0.15})`;
            ctx.lineWidth = 2.5 + bass * 5.0 + peakBoost * 3.5;
            ctx.stroke();

            // Inner bright white core
            ctx.beginPath();
            for (let i = 0; i < crestPath.length; i++) {
                const px = i * 2;
                i === 0 ? ctx.moveTo(0, crestPath[i]) : ctx.lineTo(px, crestPath[i]);
            }
            ctx.shadowBlur = 10 + bass * 20 + peakBoost * 14;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.95)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.98)';
            ctx.lineWidth = 1.2 + bass * 2.5 + peakBoost * 1.8;
            ctx.stroke();
            ctx.shadowBlur = 0;

            /* Celestial reflection column in water */
            {
                const refX = isNight
                    ? W * (0.5 + 0.28 * Math.sin(hourF * 0.4 - 1.0))
                    : W * lerp(0.06, 0.94, sunNormX);
                const refW = W * (0.04 + energy * 0.04);
                const refGrad = ctx.createLinearGradient(refX, waterTop, refX, H);
                const refA = (isNight ? 0.20 : 0.16) + energy * 0.12;
                refGrad.addColorStop(0, isNight ? `rgba(230,208,92,${refA})` : `rgba(255,200,70,${refA})`);
                refGrad.addColorStop(0.5, isNight ? `rgba(190,165,65,${refA * 0.22})` : `rgba(255,180,55,${refA * 0.22})`);
                refGrad.addColorStop(1, 'transparent');
                ctx.save();
                ctx.beginPath();
                ctx.rect(refX - refW * 3.5, waterTop, refW * 7, H - waterTop);
                ctx.clip();
                const nSteps = 36;
                ctx.beginPath(); ctx.moveTo(refX - refW, waterTop);
                for (let i = 0; i <= nSteps; i++) {
                    const fy = waterTop + (i / nSteps) * (H - waterTop);
                    const widen = (i / nSteps) * refW * 2.2;
                    const rpl = Math.sin(t * 2.0 + i * 0.6) * widen * 0.28;
                    ctx.lineTo(refX + rpl + widen * 0.5, fy);
                }
                for (let i = nSteps; i >= 0; i--) {
                    const fy = waterTop + (i / nSteps) * (H - waterTop);
                    const widen = (i / nSteps) * refW * 2.2;
                    const rpl = Math.sin(t * 2.0 + i * 0.6 + Math.PI) * widen * 0.28;
                    ctx.lineTo(refX + rpl - widen * 0.5, fy);
                }
                ctx.closePath(); ctx.fillStyle = refGrad; ctx.fill();
                ctx.restore();
            }

            /* ── Elliptical caustic patches ──────────────────────────── */
            const patchCount = 18;
            for (let i = 0; i < patchCount; i++) {
                const nx = (i * 0.6180339887 + 0.08) % 0.96;
                const depthT = (i * 0.618 * 0.37 + 0.1) % 1.0;
                const py = waterTop + depthT * (H - waterTop) * 0.90 + 18;
                const pWidth = W * (0.038 + (1 - depthT) * 0.045 + Math.sin(t * 0.22 + i) * 0.008);
                const pHeight = pWidth * (0.22 + (1 - depthT) * 0.10);
                const drift = Math.sin(t * 0.18 + i * 1.4) * W * 0.025;
                const a = (0.055 + (1 - depthT) * 0.055) * (0.6 + 0.4 * Math.sin(t * 0.28 + i * 1.3));
                const pg = ctx.createRadialGradient(nx * W + drift, py, 0, nx * W + drift, py, pWidth);
                pg.addColorStop(0, `rgba(120,190,255,${a})`);
                pg.addColorStop(0.5, `rgba(90,155,220,${a * 0.5})`);
                pg.addColorStop(1, 'transparent');
                ctx.fillStyle = pg;
                ctx.beginPath();
                ctx.ellipse(nx * W + drift, py, pWidth, pHeight, Math.sin(t * 0.12 + i) * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }

            /* ── Depth vignette ──────────────────────────────────────── */
            const fog = ctx.createLinearGradient(0, H * 0.75, 0, H);
            fog.addColorStop(0, 'rgba(1,5,18,0)');
            fog.addColorStop(1, `rgba(0,3,12,${0.42 + bass * 0.06})`);
            ctx.fillStyle = fog; ctx.fillRect(0, H * 0.75, W, H - H * 0.75);

            rafRef.current = requestAnimationFrame(tick);
        };

        loopAliveRef.current = true;
        rafRef.current = requestAnimationFrame(tick);
        return () => {
            cancelAnimationFrame(rafRef.current);
            loopAliveRef.current = false;
        };
    }, [playing, accentColor]);

    return (
        <canvas
            ref={canvasRef}
            width={800}
            height={1600}
            style={{ width: '100%', height: `${height}px`, display: 'block' }}
        />
    );
}
