import type { Pot, Arrow, GS } from './types';
import { POT_ANCHORS } from './types';

const GRAVITY = 0.20;
let _potId = 1000;

// ── Pot position ──────────────────────────────────────────────────────────────
export function potCenterX(p: Pot) { return p.anchorX + Math.sin(p.angle) * p.ropeLen; }
export function potCenterY(p: Pot) { return p.anchorY + Math.cos(p.angle) * p.ropeLen; }

// ── Create pot wave ───────────────────────────────────────────────────────────
export function createPotWave(
    mode: 'GANITA' | 'SMRITI', answer: number, correctLabel: string,
    W: number, H: number, smritiCorrectSym?: number
): Pot[] {
    const anchorCount = Math.min(4, POT_ANCHORS.length);
    const shuffled = [...POT_ANCHORS].sort(() => Math.random() - 0.5).slice(0, anchorCount);

    return shuffled.map((anc, i) => {
        let label: string, isCorrect = false;
        const SYMS = ['❀', '🐚', '☸', '🔱', '🕉'];

        if (mode === 'GANITA') {
            if (i === 0) { label = correctLabel; isCorrect = true; }
            else {
                let d = answer + (Math.floor(Math.random() * 18) - 9);
                while (d === answer || d <= 0) d = answer + 1 + i * 2;
                label = String(d);
            }
        } else {
            if (i === 0) {
                label = SYMS[smritiCorrectSym!]; isCorrect = true;
            } else {
                let sym = Math.floor(Math.random() * 5);
                while (sym === smritiCorrectSym) sym = (sym + 1) % 5;
                label = SYMS[sym];
            }
        }
        return {
            id: _potId++,
            anchorX: anc.ax * W, anchorY: anc.ay * H, ropeLen: anc.ropeLen,
            angle: (Math.random() - 0.5) * 0.18, angleVel: 0,
            label, isCorrect, state: 'hanging', shatter: [],
        };
    });
}

// ── Pendulum update ───────────────────────────────────────────────────────────
export function updatePots(pots: Pot[], _dt: number) {
    pots.forEach(p => {
        if (p.state !== 'hanging') return;
        p.angleVel += -(GRAVITY / p.ropeLen) * Math.sin(p.angle) * 0.016;
        p.angleVel *= 0.994;
        p.angle += p.angleVel;
    });
}

export function updateShatter(pots: Pot[]) {
    pots.forEach(p => {
        if (p.state !== 'shattering') return;
        p.shatter.forEach(s => { s.x += s.vx; s.y += s.vy; s.vy += 0.35; s.life--; });
        p.shatter = p.shatter.filter(s => s.life > 0);
        if (p.shatter.length === 0) p.state = 'gone';
    });
}

export function createShatter(pot: Pot) {
    const cx = potCenterX(pot), cy = potCenterY(pot);
    for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * Math.PI * 2 + Math.random() * 0.25;
        const spd = 3.5 + Math.random() * 6;
        pot.shatter.push({ x: cx, y: cy, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 2, life: 24 + Math.floor(Math.random() * 14), maxLife: 38 });
    }
    pot.state = 'shattering';
}

// ── Draw pots ─────────────────────────────────────────────────────────────────
export function drawPots(ctx: CanvasRenderingContext2D, pots: Pot[]) {
    pots.forEach(pot => {
        if (pot.state === 'gone') return;

        if (pot.state === 'shattering') {
            pot.shatter.forEach(p => {
                const a = p.life / p.maxLife;
                // Clay fragment
                ctx.fillStyle = `rgba(180,83,9,${a * 0.9})`;
                ctx.beginPath(); ctx.arc(p.x, p.y, 5 * a + 1.5, 0, Math.PI * 2); ctx.fill();
                // Gold sparkle for correct pots
                ctx.fillStyle = `rgba(251,191,36,${a * 0.6})`;
                ctx.beginPath(); ctx.arc(p.x + 2, p.y - 2, 3 * a, 0, Math.PI * 2); ctx.fill();
            });
            return;
        }

        const cx = potCenterX(pot), cy = potCenterY(pot);

        // Rope
        ctx.save();
        ctx.strokeStyle = '#6b3a1f'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(pot.anchorX, pot.anchorY); ctx.lineTo(cx, cy - 30); ctx.stroke();
        ctx.restore();

        // Pot glow halo
        if (pot.isCorrect) {
            const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 55);
            glow.addColorStop(0, 'rgba(251,191,36,0.45)');
            glow.addColorStop(1, 'rgba(251,191,36,0)');
            ctx.fillStyle = glow;
            ctx.beginPath(); ctx.arc(cx, cy, 55, 0, Math.PI * 2); ctx.fill();
        }

        // Pot body — LARGER for visibility
        const BW = 32, BH = 38;
        const bg = ctx.createRadialGradient(cx - 8, cy - 8, 4, cx, cy, BW + 6);
        if (pot.isCorrect) {
            bg.addColorStop(0, '#fde68a'); bg.addColorStop(0.4, '#f59e0b'); bg.addColorStop(1, '#78350f');
        } else {
            bg.addColorStop(0, '#d4a574'); bg.addColorStop(0.4, '#b45309'); bg.addColorStop(1, '#451a03');
        }
        // Belly
        ctx.fillStyle = bg;
        ctx.beginPath(); ctx.ellipse(cx, cy, BW, BH, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = pot.isCorrect ? '#f59e0b' : '#78350f'; ctx.lineWidth = 2;
        ctx.stroke();

        // Neck
        ctx.fillStyle = pot.isCorrect ? '#d97706' : '#92400e';
        ctx.fillRect(cx - 10, cy - BH - 12, 20, 14);
        // Lip
        ctx.beginPath(); ctx.ellipse(cx, cy - BH - 12, 14, 6, 0, 0, Math.PI * 2);
        ctx.fillStyle = pot.isCorrect ? '#b45309' : '#6b2f0f'; ctx.fill();
        // Label
        ctx.fillStyle = '#fff7ed'; ctx.font = `bold ${pot.label.length > 2 ? 13 : 16}px serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowBlur = 5; ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.fillText(pot.label, cx, cy + 2); ctx.shadowBlur = 0;
    });
}

// ── Draw arrows ───────────────────────────────────────────────────────────────
export function drawArrows(ctx: CanvasRenderingContext2D, arrows: Arrow[]) {
    arrows.forEach(a => {
        const ang = Math.atan2(a.vy, a.vx);
        ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(ang);
        // Trail glow
        ctx.strokeStyle = 'rgba(147,197,253,0.35)'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(20, 0); ctx.stroke();
        // Shaft
        ctx.strokeStyle = '#78350f'; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(18, 0); ctx.stroke();
        // Metal tip
        ctx.fillStyle = '#6b7280';
        ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(10, -4); ctx.lineTo(10, 4); ctx.closePath(); ctx.fill();
        // Feather
        ctx.fillStyle = '#fff8e7';
        ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(-17, -7); ctx.lineTo(-12, 0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#f97316';
        ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(-17, 7); ctx.lineTo(-12, 0); ctx.closePath(); ctx.fill();
        ctx.restore();
    });
}

// ── Arrow physics update ──────────────────────────────────────────────────────
export function updateArrows(arrows: Arrow[]) {
    arrows.forEach(a => { a.x += a.vx; a.y += a.vy; a.vy += 0.15; });
}

// ── Deepak Tratak screen ──────────────────────────────────────────────────────
export function drawTratak(
    ctx: CanvasRenderingContext2D, W: number, H: number,
    t: number, gs: GS, mouseX: number, mouseY: number
): { tipX: number; tipY: number } {
    ctx.fillStyle = '#0d0005'; ctx.fillRect(0, 0, W, H);
    const ambGrd = ctx.createRadialGradient(W / 2, H * 0.7, 0, W / 2, H * 0.7, H * 0.55);
    ambGrd.addColorStop(0, 'rgba(120,50,5,0.6)'); ambGrd.addColorStop(1, 'transparent');
    ctx.fillStyle = ambGrd; ctx.fillRect(0, 0, W, H);

    const lampX = W / 2, lampBaseY = H * 0.72;

    // Table surface
    ctx.fillStyle = '#5c2d0e';
    ctx.beginPath(); ctx.ellipse(lampX, lampBaseY + 8, 72, 16, 0, 0, Math.PI * 2); ctx.fill();

    // Lamp body (clay diya)
    const lampGrd = ctx.createLinearGradient(lampX - 38, lampBaseY - 24, lampX + 38, lampBaseY);
    lampGrd.addColorStop(0, '#d97706'); lampGrd.addColorStop(0.5, '#b45309'); lampGrd.addColorStop(1, '#78350f');
    ctx.fillStyle = lampGrd;
    ctx.beginPath();
    ctx.moveTo(lampX - 38, lampBaseY);
    ctx.bezierCurveTo(lampX - 40, lampBaseY - 14, lampX - 22, lampBaseY - 24, lampX, lampBaseY - 24);
    ctx.bezierCurveTo(lampX + 22, lampBaseY - 24, lampX + 40, lampBaseY - 14, lampX + 38, lampBaseY);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#92400e'; ctx.lineWidth = 1.5; ctx.stroke();

    // Spout
    ctx.fillStyle = '#92400e';
    ctx.beginPath(); ctx.moveTo(lampX + 28, lampBaseY - 16);
    ctx.lineTo(lampX + 46, lampBaseY - 22); ctx.lineTo(lampX + 44, lampBaseY - 12); ctx.lineTo(lampX + 24, lampBaseY - 8);
    ctx.closePath(); ctx.fill();

    // Oil pool glow
    const oilGrd = ctx.createRadialGradient(lampX, lampBaseY - 18, 2, lampX, lampBaseY - 18, 18);
    oilGrd.addColorStop(0, 'rgba(251,191,36,0.7)'); oilGrd.addColorStop(1, 'transparent');
    ctx.fillStyle = oilGrd; ctx.beginPath(); ctx.ellipse(lampX, lampBaseY - 18, 18, 7, 0, 0, Math.PI * 2); ctx.fill();

    // Wick
    ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(lampX, lampBaseY - 18); ctx.lineTo(lampX, lampBaseY - 26); ctx.stroke();

    // Flame
    const flk1 = Math.sin(t * 7.2) * 5 + Math.sin(t * 13.1) * 2.5;
    const flk2 = Math.sin(t * 5.9) * 3 + Math.sin(t * 10.8) * 2;
    const flameBase = lampBaseY - 26;
    const flameTipX = lampX + Math.sin(t * 3.5) * 4;
    const flameTipY = flameBase - 80;

    ctx.save(); ctx.shadowBlur = 30; ctx.shadowColor = '#f97316';
    // Outer flame
    ctx.beginPath();
    ctx.moveTo(lampX - 13, flameBase);
    ctx.bezierCurveTo(lampX - 18 + flk1, flameBase - 35, flameTipX - 10 + flk2, flameBase - 60, flameTipX, flameTipY);
    ctx.bezierCurveTo(flameTipX + 10 - flk2, flameBase - 60, lampX + 18 - flk1, flameBase - 35, lampX + 13, flameBase);
    ctx.closePath();
    const fOuter = ctx.createLinearGradient(lampX, flameBase, lampX, flameTipY);
    fOuter.addColorStop(0, '#f97316'); fOuter.addColorStop(0.6, '#fbbf24'); fOuter.addColorStop(1, '#fefce8');
    ctx.fillStyle = fOuter; ctx.fill();
    // Inner core
    ctx.beginPath();
    ctx.moveTo(lampX - 6, flameBase);
    ctx.bezierCurveTo(lampX - 8 + flk1 * .4, flameBase - 28, flameTipX - 4, flameBase - 55, flameTipX, flameTipY + 12);
    ctx.bezierCurveTo(flameTipX + 4, flameBase - 55, lampX + 8 - flk1 * .4, flameBase - 28, lampX + 6, flameBase);
    ctx.closePath();
    ctx.fillStyle = '#fef9c3'; ctx.fill();
    ctx.shadowBlur = 0; ctx.restore();

    // Focus circle at tip
    const focR = 22;
    const dist = Math.hypot(mouseX - flameTipX, mouseY - flameTipY);
    const inFocus = dist < focR;
    const pulse = 0.5 + 0.4 * Math.sin(t * 5);
    ctx.strokeStyle = inFocus ? `rgba(251,191,36,${pulse})` : `rgba(255,255,255,${pulse * 0.45})`;
    ctx.lineWidth = 2.5; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.arc(flameTipX, flameTipY, focR, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);

    // Progress arc
    const prog = gs.tratakFocusMsAcc / 15000;
    if (prog > 0) {
        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(flameTipX, flameTipY, focR + 9, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2); ctx.stroke();
    }

    // Instructions
    ctx.fillStyle = '#fef3c7'; ctx.font = '14px serif'; ctx.textAlign = 'center';
    ctx.fillText('Tratak — Hold your gaze on the flame', W / 2, H * 0.86);
    ctx.fillStyle = '#d97706'; ctx.font = '12px serif';
    const remaining = Math.ceil(Math.max(0, 15 - gs.tratakFocusMsAcc / 1000));
    ctx.fillText(`${remaining} seconds remaining`, W / 2, H * 0.90);

    // Reward
    if (gs.tratakPhase === 'REWARD') {
        ctx.save(); ctx.globalAlpha = Math.min(1, gs.tratakRewardTimer / 500);
        ctx.fillStyle = 'rgba(251,191,36,0.18)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fef3c7'; ctx.font = 'bold 22px serif'; ctx.textAlign = 'center';
        ctx.fillText('🪔  प्राण  +20  ✨', W / 2, H * 0.42);
        ctx.globalAlpha = 1; ctx.restore();
    }

    return { tipX: flameTipX, tipY: flameTipY };
}
