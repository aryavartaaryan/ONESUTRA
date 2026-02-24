'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ──────────────────────────────────────────────────────────────────────────────
// RAGA BHOPALI — Sa Re Ga Pa Dha (C D E G A) in two octaves
// Usage: yToFreq(orbY, canvasHeight) snaps to nearest scale degree.
// High on screen = index near top = higher pitch.
// ──────────────────────────────────────────────────────────────────────────────
const RAGA_BHOPALI = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 784.0, 880.0];

// Vedic symbols for Smriti mode
const SMRITI_SYMBOLS = ['🪷', '🐚', '☸️', '🔱', '🕉️'];

// Ekagrata word pools
const SATYA_WORDS = ['Sat', 'Chit', 'Ananda', 'Shanti', 'Ahimsa', 'Moksha', 'Dharma', 'Brahma'];
const MAYA_WORDS = ['Krodha', 'Lobha', 'Moha', 'Mada', 'Dvesha', 'Ahamkara', 'Bhaya', 'Matsara'];

type Mode = 'GANITA' | 'SMRITI' | 'EKAGRATA';

interface Orb {
    id: number; x: number; y: number;
    vx: number; vy: number;
    label: string; isCorrect: boolean;
    radius: number; glowColor: string;
}

interface Arrow {
    id: number; x: number; y: number; vy: number;
}

interface Particle {
    x: number; y: number; r: number; vx: number; vy: number; alpha: number; color: string;
}

// ── All game state lives here — NO React useState in the loop ──────────────
interface GS {
    mode: Mode;
    score: number; streak: number; prana: number;
    isMoksha: boolean; accuracyWindow: number[]; // 1=hit 0=miss sliding window
    question: string; ganitiAnswer: number;
    smritiSeq: number[]; smritiPhase: 'SHOW' | 'SHOOT'; smritiShot: number; smritiTimer: number;
    orbs: Orb[]; arrows: Arrow[]; particles: Particle[];
    spawnTimer: number; modeTimer: number;
    flashR: number; flashG: number; flashB: number; flashA: number;
    orbId: number; arrowId: number;
    flutePlaying: boolean; tablaPlaying: boolean;
    gameOver: boolean;
}

function makeGS(mode: Mode, w: number, h: number): GS {
    return {
        mode, score: 0, streak: 0, prana: 100,
        isMoksha: false, accuracyWindow: [],
        question: '', ganitiAnswer: 0,
        smritiSeq: [], smritiPhase: 'SHOW', smritiShot: 0, smritiTimer: 0,
        orbs: [], arrows: [], particles: makeParticles(w, h),
        spawnTimer: 0, modeTimer: 0,
        flashR: 0, flashG: 0, flashB: 0, flashA: 0,
        orbId: 0, arrowId: 0,
        flutePlaying: false, tablaPlaying: false,
        gameOver: false,
    };
}

function makeParticles(w: number, h: number): Particle[] {
    return Array.from({ length: 70 }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 2 + 0.4,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -(Math.random() * 0.25 + 0.08),
        alpha: Math.random() * 0.5 + 0.15,
        color: ['#a78bfa', '#818cf8', '#fbbf24', '#c4b5fd', '#e879f9'][Math.floor(Math.random() * 5)],
    }));
}

// ── Math problem generator ────────────────────────────────────────────────────
function genMath(): { question: string; answer: number } {
    const pick = Math.floor(Math.random() * 4);
    if (pick === 0) {
        const a = Math.floor(Math.random() * 20) + 5;
        const b = Math.floor(Math.random() * 20) + 5;
        return { question: `${a} + ${b}`, answer: a + b };
    }
    if (pick === 1) {
        const a = Math.floor(Math.random() * 30) + 20;
        const b = Math.floor(Math.random() * 15) + 1;
        return { question: `${a} − ${b}`, answer: a - b };
    }
    if (pick === 2) {
        const pairs: [number, number][] = [[3, 4], [4, 5], [6, 7], [4, 8], [3, 9], [5, 6], [2, 14], [3, 12]];
        const [a, b] = pairs[Math.floor(Math.random() * pairs.length)];
        return { question: `${a} × ${b}`, answer: a * b };
    }
    const divPairs: [number, number][] = [[24, 4], [36, 6], [42, 7], [56, 8], [63, 9], [48, 6], [72, 9], [35, 5]];
    const [da, db] = divPairs[Math.floor(Math.random() * divPairs.length)];
    return { question: `${da} ÷ ${db}`, answer: da / db };
}

// ── Audio ────────────────────────────────────────────────────────────────────
function yToFreq(y: number, h: number): number {
    const ratio = 1 - y / h;
    const idx = Math.min(Math.floor(ratio * RAGA_BHOPALI.length), RAGA_BHOPALI.length - 1);
    return RAGA_BHOPALI[idx];
}

function playSitar(ctx: AudioContext, y: number, h: number, correct: boolean) {
    const freq = yToFreq(y, h);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(correct ? freq : freq * 0.78, ctx.currentTime);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.8);
}

function startFlute(ctx: AudioContext): { osc: OscillatorNode; gain: GainNode } {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 261.63; // Sa drone
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 2);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start();
    return { osc, gain };
}

function stopFlute(ctx: AudioContext, gain: GainNode, osc: OscillatorNode) {
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
    setTimeout(() => { try { osc.stop(); } catch (_) { } }, 1600);
}

function playTablaHit(ctx: AudioContext) {
    const bufSz = Math.floor(ctx.sampleRate * 0.12);
    const buf = ctx.createBuffer(1, bufSz, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSz; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSz, 9);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass'; bpf.frequency.value = 180; bpf.Q.value = 3;
    const g = ctx.createGain(); g.gain.value = 0.45;
    src.connect(bpf); bpf.connect(g); g.connect(ctx.destination);
    src.start();
}

// ── Spawn helpers ─────────────────────────────────────────────────────────────
function spawnGanita(gs: GS, w: number) {
    const { ganitiAnswer: answer } = gs;
    const distractors = new Set<number>();
    while (distractors.size < 4) {
        const d = answer + Math.floor(Math.random() * 22) - 11;
        if (d !== answer && d > 0) distractors.add(d);
    }
    const labels = [answer, ...Array.from(distractors)].sort(() => Math.random() - 0.5);
    const speed = gs.isMoksha ? 1.7 : 1.05;
    labels.forEach((label, i) => {
        gs.orbs.push({
            id: gs.orbId++,
            x: 55 + (i / labels.length) * (w - 110),
            y: -45, vx: (Math.random() - 0.5) * 0.4,
            vy: speed + Math.random() * 0.4,
            label: String(label),
            isCorrect: label === answer,
            radius: 30,
            glowColor: label === answer ? '#a78bfa' : '#475569',
        });
    });
}

function spawnSmriti(gs: GS, w: number) {
    if (gs.smritiPhase !== 'SHOOT') return;
    const nextIdx = gs.smritiShot;
    if (nextIdx >= gs.smritiSeq.length) return;
    const correct = gs.smritiSeq[nextIdx];
    const distractors: number[] = [];
    while (distractors.length < 3) {
        const d = Math.floor(Math.random() * SMRITI_SYMBOLS.length);
        if (d !== correct && !distractors.includes(d)) distractors.push(d);
    }
    const labels = [correct, ...distractors].sort(() => Math.random() - 0.5);
    const speed = gs.isMoksha ? 1.6 : 1.0;
    labels.forEach((symIdx, i) => {
        gs.orbs.push({
            id: gs.orbId++,
            x: 55 + (i / labels.length) * (w - 110),
            y: -45, vx: (Math.random() - 0.5) * 0.35,
            vy: speed + Math.random() * 0.35,
            label: SMRITI_SYMBOLS[symIdx],
            isCorrect: symIdx === correct,
            radius: 33, glowColor: symIdx === correct ? '#fbbf24' : '#64748b',
        });
    });
}

function spawnEkagrata(gs: GS, w: number) {
    const isTruth = Math.random() > 0.38;
    const pool = isTruth ? SATYA_WORDS : MAYA_WORDS;
    const label = pool[Math.floor(Math.random() * pool.length)];
    const speed = gs.isMoksha ? 1.8 : 1.1;
    gs.orbs.push({
        id: gs.orbId++,
        x: 50 + Math.random() * (w - 100),
        y: -45, vx: (Math.random() - 0.5) * 0.7,
        vy: speed + Math.random() * 0.5,
        label, isCorrect: isTruth,
        radius: 36, glowColor: isTruth ? '#34d399' : '#f87171',
    });
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function DhyanaArcher() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gsRef = useRef<GS | null>(null);
    const rafRef = useRef<number>(0);
    const lastTRef = useRef<number>(0);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const fluteRef = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);
    const tablaTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const mouseXRef = useRef<number>(300);

    // React state ONLY for overlays — never touched inside the game loop
    const [screen, setScreen] = useState<'MENU' | 'PLAYING' | 'GAMEOVER'>('MENU');
    const [finalScore, setFinalScore] = useState(0);
    const [startMode, setStartMode] = useState<Mode>('GANITA');

    // ── Audio context (lazy) ───────────────────────────────────────────────────
    const getAudioCtx = useCallback(() => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
        return audioCtxRef.current;
    }, []);

    // ── Tabla management ──────────────────────────────────────────────────────
    const startTabla = useCallback(() => {
        if (tablaTimerRef.current) return;
        const ctx = getAudioCtx();
        playTablaHit(ctx);
        tablaTimerRef.current = setInterval(() => playTablaHit(ctx), 500);
    }, [getAudioCtx]);

    const stopTabla = useCallback(() => {
        if (tablaTimerRef.current) { clearInterval(tablaTimerRef.current); tablaTimerRef.current = null; }
    }, []);

    // ── Mode switch helper (runs inside game loop, mutates gsRef only) ─────────
    const switchMode = useCallback((gs: GS, next: Mode, w: number, h: number) => {
        gs.mode = next;
        gs.orbs = [];
        gs.arrows = [];
        gs.spawnTimer = 0;
        gs.modeTimer = 0;
        if (next === 'SMRITI') {
            gs.smritiSeq = Array.from({ length: 3 }, () => Math.floor(Math.random() * SMRITI_SYMBOLS.length));
            gs.smritiPhase = 'SHOW';
            gs.smritiShot = 0;
            gs.smritiTimer = 0;
        } else if (next === 'GANITA') {
            const { question, answer } = genMath();
            gs.question = question; gs.ganitiAnswer = answer;
        }
    }, []);

    // ── GAME LOOP — pure canvas, reads/writes gsRef only ─────────────────────
    const gameLoop = useCallback((timestamp: number) => {
        const canvas = canvasRef.current;
        const gs = gsRef.current;
        if (!canvas || !gs) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dt = Math.min(timestamp - lastTRef.current, 50); // clamp to 50ms max
        lastTRef.current = timestamp;
        const W = canvas.width, H = canvas.height;

        // ── Game over check ───────────────────────────────────────────────────
        if (gs.gameOver) {
            setFinalScore(gs.score);
            setScreen('GAMEOVER');
            return; // stop the loop
        }

        // ── Mode rotation every 28s ───────────────────────────────────────────
        gs.modeTimer += dt;
        if (gs.modeTimer > 28000) {
            const modes: Mode[] = ['GANITA', 'SMRITI', 'EKAGRATA'];
            const next = modes.filter(m => m !== gs.mode)[Math.floor(Math.random() * 2)];
            switchMode(gs, next, W, H);
        }

        // ── Smriti flash timer ────────────────────────────────────────────────
        if (gs.mode === 'SMRITI' && gs.smritiPhase === 'SHOW') {
            gs.smritiTimer += dt;
            if (gs.smritiTimer > 2800) {
                gs.smritiPhase = 'SHOOT';
                gs.spawnTimer = 2000; // trigger spawn immediately
            }
        }

        // ── Spawn ─────────────────────────────────────────────────────────────
        gs.spawnTimer += dt;
        if (gs.mode === 'GANITA') {
            if (gs.spawnTimer > 2200 && gs.orbs.length === 0) {
                gs.spawnTimer = 0;
                const { question, answer } = genMath();
                gs.question = question; gs.ganitiAnswer = answer;
                spawnGanita(gs, W);
            }
        } else if (gs.mode === 'SMRITI') {
            if (gs.spawnTimer > 2000 && gs.orbs.length === 0 && gs.smritiPhase === 'SHOOT') {
                gs.spawnTimer = 0;
                spawnSmriti(gs, W);
            }
        } else { // EKAGRATA
            if (gs.spawnTimer > 1400 && gs.orbs.length < 5) {
                gs.spawnTimer = 0;
                spawnEkagrata(gs, W);
            }
        }

        // ── Update particles ──────────────────────────────────────────────────
        gs.particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if (p.y < 0) { p.y = H; p.x = Math.random() * W; }
        });

        // ── Update orbs ───────────────────────────────────────────────────────
        gs.orbs = gs.orbs.filter(o => {
            o.y += o.vy; o.x += o.vx;
            o.x = Math.max(o.radius, Math.min(W - o.radius, o.x));
            return o.y < H + 60;
        });

        // ── Collisions ────────────────────────────────────────────────────────
        const actx = audioCtxRef.current;
        let clearAll = false;
        gs.arrows = gs.arrows.filter(arrow => {
            arrow.y += arrow.vy;
            if (arrow.y < 0) return false;
            for (const orb of gs.orbs) {
                const dx = arrow.x - orb.x, dy = arrow.y - orb.y;
                if (dx * dx + dy * dy < (orb.radius + 8) ** 2) {
                    // Sound
                    if (actx) playSitar(actx, orb.y, H, orb.isCorrect);

                    if (gs.mode === 'GANITA') {
                        // Any hit clears the wave — one shot per question
                        clearAll = true;
                        if (orb.isCorrect) {
                            gs.score += 10 + gs.streak * 3;
                            gs.streak++;
                            gs.prana = Math.min(100, gs.prana + 5);
                            gs.accuracyWindow.push(1);
                            gs.flashR = 167; gs.flashG = 139; gs.flashB = 250; gs.flashA = 0.18;
                        } else {
                            gs.streak = 0;
                            gs.prana = Math.max(0, gs.prana - 15);
                            gs.accuracyWindow.push(0);
                            gs.flashR = 248; gs.flashG = 113; gs.flashB = 113; gs.flashA = 0.28;
                        }
                    } else if (gs.mode === 'SMRITI') {
                        if (orb.isCorrect) {
                            clearAll = true;
                            gs.smritiShot++;
                            gs.flashR = 167; gs.flashG = 139; gs.flashB = 250; gs.flashA = 0.18;
                            if (gs.smritiShot >= gs.smritiSeq.length) {
                                gs.score += 30 + gs.streak * 5;
                                gs.streak++;
                                gs.prana = Math.min(100, gs.prana + 8);
                                gs.accuracyWindow.push(1);
                                // New sequence
                                gs.smritiSeq = Array.from({ length: 3 }, () => Math.floor(Math.random() * SMRITI_SYMBOLS.length));
                                gs.smritiPhase = 'SHOW';
                                gs.smritiShot = 0;
                                gs.smritiTimer = 0;
                            }
                        } else {
                            gs.streak = 0;
                            gs.prana = Math.max(0, gs.prana - 15);
                            gs.accuracyWindow.push(0);
                            gs.flashR = 248; gs.flashG = 113; gs.flashB = 113; gs.flashA = 0.28;
                        }
                    } else { // EKAGRATA
                        if (orb.isCorrect) {
                            gs.score += 10 + gs.streak * 2;
                            gs.streak++;
                            gs.prana = Math.min(100, gs.prana + 4);
                            gs.accuracyWindow.push(1);
                            gs.flashR = 52; gs.flashG = 211; gs.flashB = 153; gs.flashA = 0.12;
                        } else {
                            gs.streak = 0;
                            gs.prana = Math.max(0, gs.prana - 12);
                            gs.accuracyWindow.push(0);
                            gs.flashR = 248; gs.flashG = 113; gs.flashB = 113; gs.flashA = 0.22;
                        }
                    }

                    // Keep window at last 20 shots for accuracy tracking
                    if (gs.accuracyWindow.length > 20) gs.accuracyWindow.shift();

                    // Flute at streak >= 3
                    if (gs.streak >= 3 && !gs.flutePlaying && actx) {
                        gs.flutePlaying = true;
                        fluteRef.current = startFlute(actx);
                    } else if (gs.streak < 3 && gs.flutePlaying && actx && fluteRef.current) {
                        gs.flutePlaying = false;
                        stopFlute(actx, fluteRef.current.gain, fluteRef.current.osc);
                        fluteRef.current = null;
                    }

                    // Moksha: 90%+ accuracy in last 20 shots
                    const acc = gs.accuracyWindow.length > 5
                        ? gs.accuracyWindow.reduce((a, b) => a + b, 0) / gs.accuracyWindow.length
                        : 1;
                    if (acc >= 0.9 && !gs.isMoksha) {
                        gs.isMoksha = true;
                        startTabla();
                    } else if (acc < 0.7 && gs.isMoksha) {
                        gs.isMoksha = false;
                        stopTabla();
                    }

                    // Game over check
                    if (gs.prana <= 0) gs.gameOver = true;

                    return false; // remove arrow
                }
            }
            return true;
        });

        if (clearAll) {
            gs.orbs = [];
            gs.arrows = [];
            gs.spawnTimer = -900; // pause before next wave
        }

        // ── DRAW ──────────────────────────────────────────────────────────────
        // Background
        if (gs.isMoksha) {
            const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, H);
            bg.addColorStop(0, '#3b1605'); bg.addColorStop(0.5, '#180800'); bg.addColorStop(1, '#0a0010');
            ctx.fillStyle = bg;
        } else {
            const bg = ctx.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#02000f'); bg.addColorStop(0.6, '#080010'); bg.addColorStop(1, '#120025');
            ctx.fillStyle = bg;
        }
        ctx.fillRect(0, 0, W, H);

        // Flash
        if (gs.flashA > 0) {
            ctx.fillStyle = `rgba(${gs.flashR},${gs.flashG},${gs.flashB},${gs.flashA})`;
            ctx.fillRect(0, 0, W, H);
            gs.flashA = Math.max(0, gs.flashA - 0.025);
        }

        // Particles
        gs.particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2, '0');
            ctx.fill();
        });

        // Faint mandala
        if (!gs.isMoksha) {
            ctx.save();
            ctx.translate(W / 2, H / 2);
            ctx.globalAlpha = 0.035;
            for (let i = 0; i < 8; i++) {
                ctx.rotate(Math.PI / 4);
                ctx.beginPath(); ctx.arc(0, 65, 28, 0, Math.PI * 2);
                ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 1; ctx.stroke();
            }
            ctx.globalAlpha = 1; ctx.restore();
        }

        // Orbs
        gs.orbs.forEach(orb => {
            ctx.save();
            ctx.shadowBlur = 22; ctx.shadowColor = orb.glowColor;
            ctx.beginPath(); ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
            const og = ctx.createRadialGradient(orb.x - orb.radius * .3, orb.y - orb.radius * .3, 2, orb.x, orb.y, orb.radius);
            og.addColorStop(0, '#1e1b4b'); og.addColorStop(1, '#0d0b1a');
            ctx.fillStyle = og; ctx.fill();
            ctx.strokeStyle = orb.glowColor; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${orb.radius > 32 ? 18 : 14}px monospace`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(orb.label, orb.x, orb.y);
            ctx.restore();
        });

        // Arrows
        gs.arrows.forEach(arrow => {
            ctx.save();
            ctx.fillStyle = '#fbbf24'; ctx.shadowBlur = 14; ctx.shadowColor = '#fbbf24';
            ctx.beginPath();
            ctx.moveTo(arrow.x, arrow.y);
            ctx.lineTo(arrow.x - 3, arrow.y + 16);
            ctx.lineTo(arrow.x + 3, arrow.y + 16);
            ctx.closePath(); ctx.fill();
            ctx.restore();
        });

        // Bow
        const bx = mouseXRef.current, by = H - 54;
        ctx.save();
        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3; ctx.shadowBlur = 20; ctx.shadowColor = '#fbbf24';
        ctx.beginPath(); ctx.arc(bx, by, 26, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1; ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(bx + 26 * Math.cos(Math.PI * 1.15), by + 26 * Math.sin(Math.PI * 1.15));
        ctx.lineTo(bx + 26 * Math.cos(Math.PI * 1.85), by + 26 * Math.sin(Math.PI * 1.85));
        ctx.stroke();
        ctx.restore();

        // Prana bar
        const bw = Math.min(W - 40, 280), bx2 = (W - bw) / 2;
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath(); ctx.roundRect(bx2, 13, bw, 9, 4); ctx.fill();
        if (gs.prana > 0) {
            const pg = ctx.createLinearGradient(bx2, 0, bx2 + bw, 0);
            pg.addColorStop(0, '#22d3ee'); pg.addColorStop(0.5, '#a78bfa'); pg.addColorStop(1, '#f472b6');
            ctx.fillStyle = pg; ctx.shadowBlur = 5; ctx.shadowColor = '#a78bfa';
            ctx.beginPath(); ctx.roundRect(bx2, 13, (gs.prana / 100) * bw, 9, 4); ctx.fill();
            ctx.shadowBlur = 0;
        }

        // HUD text
        ctx.fillStyle = 'rgba(167,139,250,0.85)'; ctx.font = '10px monospace'; ctx.textAlign = 'left';
        const modeLabel = gs.mode === 'GANITA' ? '✦ GANITA' : gs.mode === 'SMRITI' ? '✦ SMRITI' : '✦ EKAGRATA';
        ctx.fillText(modeLabel, 10, 11);
        ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'right';
        ctx.fillText(`✦ ${gs.score}`, W - 10, 13);
        if (gs.streak >= 3) {
            ctx.fillStyle = '#f472b6'; ctx.font = '11px monospace';
            ctx.fillText(`🔥 ${gs.streak}×`, W - 10, 29);
        }

        // Moksha banner
        if (gs.isMoksha) {
            ctx.save();
            ctx.fillStyle = 'rgba(251,191,36,0.1)'; ctx.fillRect(0, H / 2 - 20, W, 40);
            ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 13px serif'; ctx.textAlign = 'center';
            ctx.fillText('✨  MOKSHA STATE — FLOW IS WITH YOU  ✨', W / 2, H / 2 + 5);
            ctx.restore();
        }

        // Mode-specific overlays
        if (gs.mode === 'GANITA' && gs.question) {
            ctx.save(); ctx.font = 'bold 22px serif'; ctx.textAlign = 'center';
            ctx.fillStyle = '#e0e7ff'; ctx.shadowBlur = 12; ctx.shadowColor = '#a78bfa';
            ctx.fillText(`${gs.question} = ?`, W / 2, H / 2);
            ctx.shadowBlur = 0; ctx.restore();
        }
        if (gs.mode === 'SMRITI') {
            if (gs.smritiPhase === 'SHOW') {
                ctx.save(); ctx.font = '40px serif'; ctx.textAlign = 'center';
                gs.smritiSeq.forEach((idx, i) => ctx.fillText(SMRITI_SYMBOLS[idx], W / 2 + (i - 1) * 62, H / 2));
                ctx.font = 'bold 11px monospace'; ctx.fillStyle = '#c4b5fd'; ctx.fillText('MEMORISE THE SEQUENCE', W / 2, H / 2 + 52);
                ctx.restore();
            } else {
                const nxt = gs.smritiSeq[gs.smritiShot];
                if (nxt !== undefined) {
                    ctx.save(); ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
                    ctx.fillStyle = '#fbbf24';
                    ctx.fillText(`Shoot: ${SMRITI_SYMBOLS[nxt]}  (${gs.smritiShot + 1}/${gs.smritiSeq.length})`, W / 2, H / 2);
                    ctx.restore();
                }
            }
        }
        if (gs.mode === 'EKAGRATA') {
            ctx.save(); ctx.font = '12px serif'; ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(148,163,184,0.4)';
            ctx.fillText('Shoot SATYA  •  Avoid MAYA', W / 2, H - 80);
            ctx.restore();
        }

        rafRef.current = requestAnimationFrame(gameLoop);
    }, [switchMode, startTabla, stopTabla]); // ← stable deps only, no state deps

    // ── START / STOP ──────────────────────────────────────────────────────────
    const startGame = useCallback((mode: Mode) => {
        cancelAnimationFrame(rafRef.current);
        stopTabla();
        if (fluteRef.current && audioCtxRef.current) {
            stopFlute(audioCtxRef.current, fluteRef.current.gain, fluteRef.current.osc);
            fluteRef.current = null;
        }
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        const W = canvas.width, H = canvas.height;

        const gs = makeGS(mode, W, H);
        mouseXRef.current = W / 2;
        if (mode === 'GANITA') {
            const { question, answer } = genMath();
            gs.question = question; gs.ganitiAnswer = answer;
        } else if (mode === 'SMRITI') {
            gs.smritiSeq = Array.from({ length: 3 }, () => Math.floor(Math.random() * SMRITI_SYMBOLS.length));
        }
        gsRef.current = gs;
        lastTRef.current = performance.now();
        setScreen('PLAYING');
        setStartMode(mode);
        rafRef.current = requestAnimationFrame(gameLoop);
    }, [gameLoop, stopTabla]);

    const handleReset = useCallback(() => {
        cancelAnimationFrame(rafRef.current);
        stopTabla();
        gsRef.current = null;
        setScreen('MENU');
    }, [stopTabla]);

    // ── Input ────────────────────────────────────────────────────────────────
    const shoot = useCallback(() => {
        const gs = gsRef.current;
        const canvas = canvasRef.current;
        if (!gs || !canvas || gs.gameOver) return;
        gs.arrows.push({
            id: gs.arrowId++,
            x: mouseXRef.current,
            y: canvas.height - 54,
            vy: -11,
        });
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); shoot(); } };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [shoot]);

    useEffect(() => { return () => { cancelAnimationFrame(rafRef.current); stopTabla(); }; }, [stopTabla]);

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const r = canvasRef.current?.getBoundingClientRect();
        if (r) mouseXRef.current = e.clientX - r.left;
    };
    const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const r = canvasRef.current?.getBoundingClientRect();
        if (r) mouseXRef.current = e.touches[0].clientX - r.left;
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div style={{ width: '100vw', height: '100vh', background: '#02000f', position: 'relative', overflow: 'hidden' }}>

            {/* MENU */}
            {screen === 'MENU' && (
                <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', zIndex: 20,
                    background: 'radial-gradient(ellipse at center,#0d0020 0%,#02000f 100%)', fontFamily: 'serif',
                }}>
                    <div style={{ fontSize: 52 }}>🏹</div>
                    <h1 style={{ fontSize: '2.2rem', color: '#fbbf24', margin: '8px 0 4px', textShadow: '0 0 30px #fbbf24', letterSpacing: '0.06em' }}>
                        DHYANA ARCHER
                    </h1>
                    <p style={{ color: '#a78bfa', letterSpacing: '0.22em', fontSize: '0.78rem', marginBottom: 36 }}>THE GANDHARVA EDITION</p>
                    <p style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: 28, textAlign: 'center', maxWidth: 300, lineHeight: 1.7 }}>
                        Every correct hit plays a note in Raga Bhopali.<br />
                        Achieve flow to enter <strong style={{ color: '#fbbf24' }}>Moksha State</strong>.
                    </p>
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
                        {(['GANITA', 'SMRITI', 'EKAGRATA'] as Mode[]).map(m => (
                            <button key={m} onClick={() => startGame(m)} style={{
                                padding: '12px 26px', borderRadius: 12, border: '1.5px solid #a78bfa',
                                background: 'rgba(167,139,250,0.07)', color: '#e0e7ff',
                                fontSize: '0.9rem', cursor: 'pointer', letterSpacing: '0.1em',
                                fontFamily: 'serif', transition: 'all 0.25s',
                            }}>
                                {m === 'GANITA' ? '∑ GANITA' : m === 'SMRITI' ? '❋ SMRITI' : '◉ EKAGRATA'}
                            </button>
                        ))}
                    </div>
                    <p style={{ color: '#334155', fontSize: '0.68rem', marginTop: 40 }}>MOVE mouse to aim  •  CLICK or SPACE to shoot</p>
                </div>
            )}

            {/* GAME OVER */}
            {screen === 'GAMEOVER' && (
                <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', zIndex: 20,
                    background: 'rgba(0,0,0,0.88)', fontFamily: 'serif',
                }}>
                    <div style={{ fontSize: 56 }}>🕉️</div>
                    <h2 style={{ color: '#fbbf24', fontSize: '2rem', margin: '16px 0 6px', textShadow: '0 0 20px #fbbf24' }}>PRANA DEPLETED</h2>
                    <p style={{ color: '#94a3b8', marginBottom: 6 }}>Your journey ends here, Sadhaka.</p>
                    <p style={{ color: '#a78bfa', fontSize: '1.6rem', marginBottom: 4 }}>Score: {finalScore}</p>
                    <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                        <button onClick={() => startGame(startMode)} style={{
                            padding: '12px 30px', borderRadius: 12, border: '1.5px solid #a78bfa',
                            background: 'rgba(167,139,250,0.1)', color: '#e0e7ff',
                            fontSize: '1rem', cursor: 'pointer', fontFamily: 'serif',
                        }}>▶ Play Again</button>
                        <button onClick={handleReset} style={{
                            padding: '12px 30px', borderRadius: 12, border: '1.5px solid #fbbf24',
                            background: 'rgba(251,191,36,0.08)', color: '#fbbf24',
                            fontSize: '1rem', cursor: 'pointer', fontFamily: 'serif',
                        }}>⌂ Menu</button>
                    </div>
                </div>
            )}

            {/* CANVAS — always mounted */}
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                onClick={shoot}
                onTouchEnd={shoot}
            />
        </div>
    );
}
