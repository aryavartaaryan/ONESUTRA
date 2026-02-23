'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { GS, Mode, Screen } from './types';
import { SMRITI_SYMS } from './types';
import { getAudioCtx, startTanpura, stopTanpura, startRiver, playBird, playWhoosh, playShatter, playThud, playBell, startWind, stopWind, playVictoryMantra } from './audio';
import { drawScene, drawGuru, drawArcher, drawMotes, makeMotes, updateMotes, drawHUD, drawInstruction, preloadBg } from './draw-scene';
import { createPotWave, updatePots, updateShatter, createShatter, drawPots, drawArrows, updateArrows, potCenterX, potCenterY, drawTratak } from './draw-game';

// ── Math problem ───────────────────────────────────────────────────────────────
function genMath(): { answer: number; display: string } {
    const t = Math.floor(Math.random() * 4);
    if (t === 0) { const a = Math.floor(Math.random() * 20) + 5, b = Math.floor(Math.random() * 20) + 5; return { answer: a + b, display: `${a} + ${b} = ?` }; }
    if (t === 1) { const a = Math.floor(Math.random() * 30) + 20, b = Math.floor(Math.random() * 15) + 1; return { answer: a - b, display: `${a} − ${b} = ?` }; }
    if (t === 2) { const p: number[][] = [[3, 4], [4, 5], [6, 7], [4, 8], [3, 9], [5, 6]]; const [a, b] = p[Math.floor(Math.random() * p.length)]; return { answer: a * b, display: `${a} × ${b} = ?` }; }
    const p: number[][] = [[24, 4], [36, 6], [42, 7], [56, 8], [63, 9], [35, 5]]; const [a, b] = p[Math.floor(Math.random() * p.length)]; return { answer: a / b, display: `${a} ÷ ${b} = ?` };
}

function makeGS(mode: Mode, W: number, H: number): GS {
    return {
        t: 0, mode, score: 0, streak: 0, prana: 100, correctHits: 0,
        question: '', ganitiAnswer: 0,
        smritiSeq: [], smritiPhase: 'SHOW', smritiShot: 0, smritiShowTimer: 0,
        pots: [], arrows: [], motes: makeMotes(W, H),
        potId: 0, arrowId: 0, spawnTimer: 9999, modeTimer: 0,
        flashR: 0, flashG: 0, flashB: 0, flashA: 0, gameOver: false, guruBlink: 0,
        tratakPhase: 'NONE', tratakFocusMsAcc: 0, tratakRewardTimer: 0, tratakFocusLost: false, tratakIntroTimer: 0,
    };
}

export default function DhyanaArcher() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gsRef = useRef<GS | null>(null);
    const rafRef = useRef<number>(0);
    const lastTRef = useRef<number>(0);
    const mouseXRef = useRef<number>(300);
    const mouseYRef = useRef<number>(400);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const tanpuraRef = useRef<{ oscs: OscillatorNode[]; gain: GainNode } | null>(null);
    const riverRef = useRef<{ src: ScriptProcessorNode; gain: GainNode } | null>(null);
    const birdTimerRef = useRef<number>(1500);
    const windRef = useRef<GainNode | null>(null);

    const [screen, setScreen] = useState<Screen>('MENU');
    const [finalScore, setFinalScore] = useState(0);
    const [initMode, setInitMode] = useState<Mode>('GANITA');

    const getCtx = useCallback(() => getAudioCtx(audioCtxRef), []);

    const startAmbience = useCallback(() => {
        const c = getCtx();
        if (!tanpuraRef.current) tanpuraRef.current = startTanpura(c);
        if (!riverRef.current) riverRef.current = startRiver(c);
    }, [getCtx]);

    const stopAmbience = useCallback(() => {
        const c = audioCtxRef.current; if (!c) return;
        if (tanpuraRef.current) { stopTanpura(c, tanpuraRef.current); tanpuraRef.current = null; }
        if (riverRef.current) { riverRef.current.gain.gain.setValueAtTime(0, c.currentTime); riverRef.current = null; }
    }, []);

    // ── Spawn helpers (mutate gs only, no React state) ─────────────────────────
    const spawnGanita = useCallback((gs: GS, W: number, H: number) => {
        const { answer, display } = genMath();
        gs.ganitiAnswer = answer; gs.question = display; gs.guruBlink = 5000;
        gs.pots = createPotWave('GANITA', answer, String(answer), W, H);
        gs.spawnTimer = 0;
    }, []);

    const spawnSmritiWave = useCallback((gs: GS, W: number, H: number) => {
        const sym = gs.smritiSeq[gs.smritiShot];
        if (sym === undefined) return;
        gs.pots = createPotWave('SMRITI', 0, '', W, H, sym);
        gs.spawnTimer = 0;
    }, []);

    const newSmritiCycle = useCallback((gs: GS, W: number, H: number) => {
        gs.smritiSeq = Array.from({ length: 3 }, () => Math.floor(Math.random() * 5));
        gs.smritiPhase = 'SHOW'; gs.smritiShot = 0; gs.smritiShowTimer = 0;
        gs.pots = []; gs.arrows = []; gs.spawnTimer = 0;
    }, []);

    // ── Game loop ──────────────────────────────────────────────────────────────
    const gameLoop = useCallback((ts: number) => {
        const canvas = canvasRef.current; const gs = gsRef.current;
        if (!canvas || !gs) return;
        const ctx = canvas.getContext('2d'); if (!ctx) return;

        const dt = Math.min(ts - lastTRef.current, 50);
        lastTRef.current = ts;
        gs.t += dt / 1000;
        const W = canvas.width, H = canvas.height;

        // Game over
        if (gs.gameOver) { setFinalScore(gs.score); setScreen('GAMEOVER'); stopAmbience(); return; }

        // Bird sounds
        birdTimerRef.current -= dt;
        if (birdTimerRef.current <= 0) { birdTimerRef.current = 2800 + Math.random() * 3500; playBird(getCtx()); }

        // ══ TRATAK ═══════════════════════════════════════════════════════════════
        if (gs.tratakPhase !== 'NONE') {
            const { tipX, tipY } = drawTratak(ctx, W, H, gs.t, gs, mouseXRef.current, mouseYRef.current);

            if (gs.tratakPhase === 'INTRO') {
                gs.tratakIntroTimer += dt;
                // Draw "Tratak begins" text
                ctx.fillStyle = 'rgba(251,191,36,' + Math.min(1, gs.tratakIntroTimer / 1000) + ')';
                ctx.font = 'bold 18px serif'; ctx.textAlign = 'center';
                ctx.fillText('🪔  Deepak Tratak  🪔', W / 2, H * 0.2);
                if (gs.tratakIntroTimer > 1800) gs.tratakPhase = 'FOCUS';
            } else if (gs.tratakPhase === 'FOCUS') {
                const dist = Math.hypot(mouseXRef.current - tipX, mouseYRef.current - tipY);
                const inFocus = dist < 22;
                if (inFocus) {
                    gs.tratakFocusMsAcc += dt; gs.tratakFocusLost = false;
                    if (windRef.current) { stopWind(getCtx(), windRef.current); windRef.current = null; }
                } else {
                    gs.tratakFocusLost = true;
                    if (!windRef.current) windRef.current = startWind(getCtx());
                }
                if (gs.tratakFocusMsAcc >= 15000) {
                    playBell(getCtx());
                    if (windRef.current) { stopWind(getCtx(), windRef.current); windRef.current = null; }
                    gs.tratakPhase = 'REWARD'; gs.prana = Math.min(100, gs.prana + 20); gs.tratakRewardTimer = 0;
                }
            } else if (gs.tratakPhase === 'REWARD') {
                gs.tratakRewardTimer += dt;
                if (gs.tratakRewardTimer > 2400) {
                    gs.tratakPhase = 'NONE'; gs.tratakFocusMsAcc = 0; gs.tratakFocusLost = false; gs.correctHits = 0;
                    gs.pots = []; gs.arrows = []; gs.spawnTimer = 9999; // trigger immediate spawn
                    if (gs.mode === 'GANITA') spawnGanita(gs, W, H);
                    else newSmritiCycle(gs, W, H);
                }
            }
            rafRef.current = requestAnimationFrame(gameLoop); return;
        }

        // ══ PLAYING ═══════════════════════════════════════════════════════════════

        // Mode rotate every 35s
        gs.modeTimer += dt;
        if (gs.modeTimer > 35000) {
            gs.modeTimer = 0; gs.pots = []; gs.arrows = [];
            gs.mode = gs.mode === 'GANITA' ? 'SMRITI' : 'GANITA';
            if (gs.mode === 'GANITA') spawnGanita(gs, W, H);
            else newSmritiCycle(gs, W, H);
        }

        // Smriti show phase timer
        if (gs.mode === 'SMRITI' && gs.smritiPhase === 'SHOW') {
            gs.smritiShowTimer += dt;
            if (gs.smritiShowTimer > 2800) { gs.smritiPhase = 'SHOOT'; spawnSmritiWave(gs, W, H); }
        }

        // Spawn GANITA wave when board empty
        if (gs.mode === 'GANITA') {
            const allGone = gs.pots.length > 0 && gs.pots.every(p => p.state === 'gone');
            if (gs.pots.length === 0 || allGone) {
                gs.spawnTimer += dt;
                if (gs.spawnTimer > 1200) spawnGanita(gs, W, H);
            }
        }

        // Update physics
        updateMotes(gs.motes, W, H);
        updatePots(gs.pots, dt);
        updateShatter(gs.pots);
        updateArrows(gs.arrows);
        gs.arrows = gs.arrows.filter(a => a.y < H + 30);
        gs.guruBlink = Math.max(0, gs.guruBlink - dt);
        if (gs.flashA > 0) gs.flashA = Math.max(0, gs.flashA - 0.020);

        // ── Collision detection ─────────────────────────────────────────────────
        for (let ai = gs.arrows.length - 1; ai >= 0; ai--) {
            const arrow = gs.arrows[ai];
            for (let pi = 0; pi < gs.pots.length; pi++) {
                const pot = gs.pots[pi]; if (pot.state !== 'hanging') continue;
                const cx = potCenterX(pot), cy = potCenterY(pot);
                if (Math.hypot(arrow.x - cx, arrow.y - cy) < 40) {
                    gs.arrows.splice(ai, 1);
                    if (pot.isCorrect) {
                        createShatter(pot);
                        playShatter(getCtx(), cy, H);
                        gs.score += 10 + gs.streak * 4; gs.streak++; gs.prana = Math.min(100, gs.prana + 4);
                        gs.correctHits++;
                        gs.flashR = 251; gs.flashG = 191; gs.flashB = 36; gs.flashA = 0.14;

                        if (gs.mode === 'SMRITI') {
                            gs.smritiShot++;
                            if (gs.smritiShot >= gs.smritiSeq.length) {
                                // Full sequence done — bonus + victory mantra
                                gs.score += 25; gs.prana = Math.min(100, gs.prana + 6);
                                playVictoryMantra(getCtx()); // 🕉 Om Shanti chant
                                setTimeout(() => { if (gsRef.current) newSmritiCycle(gsRef.current, W, H); }, 700);
                            } else {
                                // Next symbol in sequence
                                setTimeout(() => { if (gsRef.current) spawnSmritiWave(gsRef.current, W, H); }, 600);
                            }
                        }

                        // Trigger Tratak
                        if (gs.correctHits >= 7) {
                            gs.tratakPhase = 'INTRO'; gs.tratakIntroTimer = 0;
                            gs.tratakFocusMsAcc = 0; gs.pots = []; gs.arrows = [];
                        }
                    } else {
                        pot.angleVel += (Math.random() > 0.5 ? 1 : -1) * 0.22;
                        playThud(getCtx());
                        gs.streak = 0; gs.prana = Math.max(0, gs.prana - 14);
                        gs.flashR = 239; gs.flashG = 68; gs.flashB = 68; gs.flashA = 0.18;
                    }
                    if (gs.prana <= 0) gs.gameOver = true;
                    break;
                }
            }
        }

        // ══ DRAW ══════════════════════════════════════════════════════════════════
        drawScene(ctx, W, H, gs.t);
        drawMotes(ctx, gs.motes);
        if (gs.flashA > 0) { ctx.fillStyle = `rgba(${gs.flashR},${gs.flashG},${gs.flashB},${gs.flashA})`; ctx.fillRect(0, 0, W, H); }
        drawPots(ctx, gs.pots);
        drawArrows(ctx, gs.arrows);
        drawGuru(ctx, W, H, gs.mode === 'GANITA' ? gs.question : '', gs.guruBlink);
        drawArcher(ctx, W, H, mouseXRef.current, mouseYRef.current);

        // Smriti sequence parchment overlay
        if (gs.mode === 'SMRITI' && gs.smritiPhase === 'SHOW') {
            ctx.save();
            const bx = W / 2 - 140, by = H / 2 - 58, bw = 280, bh = 96;
            const pg = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
            pg.addColorStop(0, 'rgba(254,243,199,0.92)'); pg.addColorStop(1, 'rgba(253,230,138,0.92)');
            ctx.fillStyle = pg; ctx.strokeStyle = '#92400e'; ctx.lineWidth = 2.5; ctx.shadowBlur = 14; ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 10); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
            ctx.font = '44px serif'; ctx.textAlign = 'center';
            gs.smritiSeq.forEach((idx, i) => ctx.fillText(SMRITI_SYMS[idx], W / 2 + (i - 1) * 72, H / 2 + 10));
            ctx.font = 'bold 11px serif'; ctx.fillStyle = '#7c2d12';
            ctx.fillText('📜  Memorise the sacred order', W / 2, H / 2 + 50);
            ctx.restore();
        }
        if (gs.mode === 'SMRITI' && gs.smritiPhase === 'SHOOT') {
            const sym = gs.smritiSeq[gs.smritiShot];
            if (sym !== undefined) drawInstruction(ctx, W, H, `Shoot:  ${SMRITI_SYMS[sym]}   (${gs.smritiShot + 1} / ${gs.smritiSeq.length})`);
        }
        if (gs.mode === 'GANITA' && gs.question) {
            drawInstruction(ctx, W, H, gs.question);
        }

        drawHUD(ctx, W, H, gs);
        rafRef.current = requestAnimationFrame(gameLoop);
    }, [getCtx, stopAmbience, spawnGanita, spawnSmritiWave, newSmritiCycle]);

    // ── Start ──────────────────────────────────────────────────────────────────
    const startGame = useCallback((mode: Mode) => {
        cancelAnimationFrame(rafRef.current);
        preloadBg(); // Preload the photorealistic Gurukul background
        const canvas = canvasRef.current; if (!canvas) return;
        canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
        const W = canvas.width, H = canvas.height;
        const gs = makeGS(mode, W, H);
        gsRef.current = gs;
        mouseXRef.current = W * 0.14; mouseYRef.current = H * 0.82;
        if (mode === 'GANITA') spawnGanita(gs, W, H);
        else newSmritiCycle(gs, W, H);
        lastTRef.current = performance.now();
        setInitMode(mode); setScreen('PLAYING');
        startAmbience();
        rafRef.current = requestAnimationFrame(gameLoop);
    }, [gameLoop, startAmbience, spawnGanita, newSmritiCycle]);

    // ── Shoot ──────────────────────────────────────────────────────────────────
    const shoot = useCallback(() => {
        const gs = gsRef.current; const canvas = canvasRef.current;
        if (!gs || !canvas || gs.gameOver || gs.tratakPhase !== 'NONE') return;
        const ax = canvas.width * 0.14, ay = canvas.height * 0.82;
        const angle = Math.atan2(mouseYRef.current - ay, mouseXRef.current - ax);
        const spd = 14;
        gs.arrows.push({ id: gs.arrowId++, x: ax, y: ay, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd });
        playWhoosh(getCtx());
    }, [getCtx]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); shoot(); } };
        window.addEventListener('keydown', onKey);
        return () => { window.removeEventListener('keydown', onKey); cancelAnimationFrame(rafRef.current); stopAmbience(); };
    }, [shoot, stopAmbience]);

    const onMM = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const r = canvasRef.current?.getBoundingClientRect(); if (!r) return;
        mouseXRef.current = e.clientX - r.left; mouseYRef.current = e.clientY - r.top;
    };
    const onTM = (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const r = canvasRef.current?.getBoundingClientRect(); if (!r) return;
        mouseXRef.current = e.touches[0].clientX - r.left; mouseYRef.current = e.touches[0].clientY - r.top;
    };

    const btnBase: React.CSSProperties = { padding: '12px 30px', borderRadius: 12, border: '1.5px solid #d97706', background: 'rgba(217,119,6,0.14)', color: '#fef3c7', fontSize: '1rem', cursor: 'pointer', fontFamily: 'serif', letterSpacing: '0.06em' };
    const overlay: React.CSSProperties = { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 20, fontFamily: 'serif' };

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#0a0005', position: 'relative', overflow: 'hidden' }}>

            {screen === 'MENU' && (
                <div style={{ ...overlay, background: 'radial-gradient(ellipse at center, #2d1a00 0%, #0a0005 100%)' }}>
                    <div style={{ fontSize: 56 }}>🏹</div>
                    <h1 style={{ fontSize: '2.4rem', color: '#fbbf24', margin: '8px 0 4px', textShadow: '0 0 28px #f97316, 0 0 60px #f9731640', letterSpacing: '0.07em' }}>DHYANA ARCHER</h1>
                    <p style={{ color: '#d97706', letterSpacing: '0.22em', fontSize: '0.75rem', marginBottom: 8 }}>THE GURUKUL EDITION</p>
                    <p style={{ color: '#78350f', fontSize: '0.8rem', maxWidth: 310, textAlign: 'center', lineHeight: 1.8, marginBottom: 32 }}>
                        Learn under the ancient banyan trees.<br />
                        Every 7 correct shots summons <strong style={{ color: '#fbbf24' }}>Deepak Tratak</strong> — the flame meditation.
                    </p>
                    <div style={{ display: 'flex', gap: 18 }}>
                        {(['GANITA', 'SMRITI'] as Mode[]).map(m => (
                            <button key={m} onClick={() => startGame(m)} style={btnBase}>
                                {m === 'GANITA' ? '∑  Ganita' : '❋  Smriti'}
                            </button>
                        ))}
                    </div>
                    <p style={{ color: '#3c1c08', fontSize: '0.68rem', marginTop: 38 }}>Move mouse to aim  •  Click or SPACE to shoot</p>
                </div>
            )}

            {screen === 'GAMEOVER' && (
                <div style={{ ...overlay, background: 'rgba(0,0,0,0.9)' }}>
                    <div style={{ fontSize: 56 }}>🕉️</div>
                    <h2 style={{ color: '#fbbf24', fontSize: '2rem', margin: '16px 0 6px', textShadow: '0 0 20px #f97316' }}>पराजय</h2>
                    <p style={{ color: '#92400e', marginBottom: 4 }}>Your Prana is exhausted, dear Sadhaka.</p>
                    <p style={{ color: '#fbbf24', fontSize: '1.6rem', marginBottom: 28 }}>Score: {finalScore}</p>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => startGame(initMode)} style={btnBase}>▶ Play Again</button>
                        <button onClick={() => setScreen('MENU')} style={{ ...btnBase, borderColor: '#78350f', color: '#d97706' }}>⌂ Menu</button>
                    </div>
                </div>
            )}

            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
                onMouseMove={onMM} onTouchMove={onTM} onClick={shoot} onTouchEnd={shoot} />
        </div>
    );
}
