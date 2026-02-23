import type { GS, Mote } from './types';

// ─── Background image cache ───────────────────────────────────────────────────
let bgImage: HTMLImageElement | null = null;
let bgLoaded = false;

export function preloadBg() {
    if (bgImage) return;
    bgImage = new window.Image();
    bgImage.src = '/gurukul_bg.png';
    bgImage.onload = () => { bgLoaded = true; };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCENE — photorealistic image as background + hand-painted overlays
// ═══════════════════════════════════════════════════════════════════════════════
export function drawScene(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
    if (bgLoaded && bgImage) {
        // Draw image covering full canvas
        ctx.drawImage(bgImage, 0, 0, W, H);
        // Subtle warm overlay to give a unified warm tone
        const warmOverlay = ctx.createLinearGradient(0, 0, 0, H);
        warmOverlay.addColorStop(0, 'rgba(255,180,30,0.07)');
        warmOverlay.addColorStop(0.5, 'rgba(255,150,0,0.04)');
        warmOverlay.addColorStop(1, 'rgba(0,0,0,0.25)');
        ctx.fillStyle = warmOverlay; ctx.fillRect(0, 0, W, H);
    } else {
        // Fallback gradient while image loads
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#c4b5fd'); sky.addColorStop(0.4, '#fde68a'); sky.addColorStop(1, '#78350f');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    }

    // Golden god-rays (subtle animated light beams through canopy)
    ctx.save();
    ctx.globalAlpha = 0.06 + 0.025 * Math.sin(t * 1.1);
    ctx.globalCompositeOperation = 'screen';
    const rays = [
        [W * 0.25, 0, W * 0.10, H, W * 0.30, H],
        [W * 0.38, 0, W * 0.22, H, W * 0.44, H],
        [W * 0.50, 0, W * 0.36, H, W * 0.52, H],
    ];
    rays.forEach(([x0, y0, x1, y1, x2, y2]) => {
        const rg = ctx.createLinearGradient(x0, y0, (x1 + x2) / 2, y1);
        rg.addColorStop(0, 'rgba(255,220,100,0.9)');
        rg.addColorStop(1, 'rgba(255,220,100,0)');
        ctx.fillStyle = rg; ctx.beginPath();
        ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.closePath(); ctx.fill();
    });
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.restore();

    // Dust motes drawn below in drawMotes()
}

// ── Guru figure (photorealistic painted style) ────────────────────────────────
export function drawGuru(ctx: CanvasRenderingContext2D, W: number, H: number, text: string, blink: number) {
    const gx = W * 0.82, gy = H * 0.86;
    const sc = H * 0.18;

    // Drop shadow
    ctx.save(); ctx.shadowBlur = 20; ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 5;

    // Long saffron robe
    const robe = ctx.createLinearGradient(gx - sc * 0.28, gy - sc * 0.95, gx + sc * 0.28, gy);
    robe.addColorStop(0, '#fb923c'); robe.addColorStop(0.45, '#f97316'); robe.addColorStop(1, '#7c2d12');
    ctx.fillStyle = robe;
    ctx.beginPath();
    ctx.moveTo(gx - sc * 0.28, gy);
    ctx.bezierCurveTo(gx - sc * 0.32, gy - sc * 0.2, gx - sc * 0.24, gy - sc * 0.85, gx - sc * 0.12, gy - sc * 0.92);
    ctx.lineTo(gx + sc * 0.12, gy - sc * 0.92);
    ctx.bezierCurveTo(gx + sc * 0.24, gy - sc * 0.85, gx + sc * 0.32, gy - sc * 0.2, gx + sc * 0.28, gy);
    ctx.closePath(); ctx.fill();
    // Robe fold lines
    ctx.strokeStyle = '#c2410c'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.moveTo(gx - sc * 0.08, gy - sc * 0.75); ctx.quadraticCurveTo(gx + sc * 0.02, gy - sc * 0.5, gx - sc * 0.05, gy - sc * 0.2); ctx.stroke();
    ctx.globalAlpha = 1;

    // Neck & upper robe wrap
    ctx.fillStyle = '#ea580c';
    ctx.beginPath(); ctx.ellipse(gx, gy - sc * 0.85, sc * 0.1, sc * 0.08, 0, 0, Math.PI * 2); ctx.fill();

    // Head
    const headGrad = ctx.createRadialGradient(gx - sc * 0.04, gy - sc * 1.07, sc * 0.02, gx, gy - sc * 1.05, sc * 0.15);
    headGrad.addColorStop(0, '#e2b48a'); headGrad.addColorStop(1, '#c2844e');
    ctx.fillStyle = headGrad;
    ctx.beginPath(); ctx.arc(gx, gy - sc * 1.05, sc * 0.155, 0, Math.PI * 2); ctx.fill();

    // White shoulder-length hair
    ctx.fillStyle = '#f5f5f0';
    ctx.beginPath(); ctx.arc(gx, gy - sc * 1.08, sc * 0.175, 0, Math.PI); ctx.fill();
    ctx.beginPath(); ctx.ellipse(gx - sc * 0.14, gy - sc * 0.97, sc * 0.06, sc * 0.12, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(gx + sc * 0.14, gy - sc * 0.97, sc * 0.06, sc * 0.12, 0.3, 0, Math.PI * 2); ctx.fill();

    // Long flowing beard
    ctx.beginPath();
    ctx.moveTo(gx - sc * 0.1, gy - sc * 0.96);
    ctx.bezierCurveTo(gx - sc * 0.18, gy - sc * 0.7, gx - sc * 0.12, gy - sc * 0.5, gx - sc * 0.02, gy - sc * 0.52);
    ctx.bezierCurveTo(gx + sc * 0.02, gy - sc * 0.52, gx + sc * 0.12, gy - sc * 0.5, gx + sc * 0.10, gy - sc * 0.96);
    ctx.closePath(); ctx.fill();
    // Beard strands
    ctx.strokeStyle = '#e8e8e3'; ctx.lineWidth = 1; ctx.globalAlpha = 0.7;
    for (let i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.moveTo(gx + i * sc * 0.05, gy - sc * 0.9);
        ctx.bezierCurveTo(gx + i * sc * 0.07, gy - sc * 0.75, gx + i * sc * 0.05, gy - sc * 0.6, gx + i * sc * 0.03, gy - sc * 0.55); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Eyes
    ctx.fillStyle = '#3d2000';
    ctx.beginPath(); ctx.ellipse(gx - sc * 0.055, gy - sc * 1.06, sc * 0.018, sc * 0.013, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(gx + sc * 0.055, gy - sc * 1.06, sc * 0.018, sc * 0.013, 0, 0, Math.PI * 2); ctx.fill();
    // Eye whites
    ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.ellipse(gx - sc * 0.052, gy - sc * 1.062, sc * 0.014, sc * 0.009, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(gx + sc * 0.058, gy - sc * 1.062, sc * 0.014, sc * 0.009, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    // Forehead tilak
    ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.ellipse(gx, gy - sc * 1.13, sc * 0.012, sc * 0.022, 0, 0, Math.PI * 2); ctx.fill();

    // Folded hands
    ctx.fillStyle = '#d4a574';
    ctx.beginPath(); ctx.ellipse(gx, gy - sc * 0.62, sc * 0.09, sc * 0.07, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#b8894a'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(gx - sc * 0.05, gy - sc * 0.66); ctx.lineTo(gx - sc * 0.18, gy - sc * 0.78); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(gx + sc * 0.05, gy - sc * 0.66); ctx.lineTo(gx + sc * 0.18, gy - sc * 0.78); ctx.stroke();

    // Rudraksha mala (beads)
    ctx.save(); ctx.strokeStyle = '#6b3a0a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(gx, gy - sc * 0.82, sc * 0.12, -Math.PI * 0.75, Math.PI * 1.75); ctx.stroke();
    for (let i = 0; i < 8; i++) {
        const a = -Math.PI * 0.75 + i * (Math.PI * 2.5 / 8);
        ctx.fillStyle = '#7c3a0a';
        ctx.beginPath(); ctx.arc(gx + sc * 0.12 * Math.cos(a), (gy - sc * 0.82) + sc * 0.12 * Math.sin(a), sc * 0.012, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; ctx.restore();

    // Speech bubble (parchment style)
    if (text && blink > 0) {
        const bw = Math.max(130, text.length * 7.8 + 28), bh = 38;
        const bx = gx - bw / 2, by = gy - sc * 1.55;
        const alpha = Math.min(1, blink / 500);
        ctx.save(); ctx.globalAlpha = alpha;
        // Parchment bg
        const pg = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
        pg.addColorStop(0, '#fef9c3'); pg.addColorStop(1, '#fde68a');
        ctx.fillStyle = pg; ctx.strokeStyle = '#92400e'; ctx.lineWidth = 2; ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(251,191,36,0.5)';
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 6); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
        // Parchment crinkle
        ctx.strokeStyle = 'rgba(146,64,14,0.3)'; ctx.lineWidth = 0.8;
        for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(bx + 4, by + i * 9); ctx.lineTo(bx + bw - 4, by + i * 9); ctx.stroke(); }
        // Pointer
        ctx.fillStyle = '#fde68a'; ctx.strokeStyle = '#92400e'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(gx - 8, by + bh); ctx.lineTo(gx + 8, by + bh); ctx.lineTo(gx, by + bh + 12); ctx.closePath(); ctx.fill(); ctx.stroke();
        // Text
        ctx.fillStyle = '#7c2d12'; ctx.font = 'bold 12px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(text, gx, by + bh / 2);
        ctx.restore();
    }
}

// ── Arjuna archer (photorealistic warrior) ────────────────────────────────────
export function drawArcher(ctx: CanvasRenderingContext2D, W: number, H: number, mouseX: number, mouseY: number) {
    const ax = W * 0.13, ay = H * 0.88;
    const sc = H * 0.18;
    const angle = Math.atan2(mouseY - (ay - sc * 0.6), mouseX - ax);

    ctx.save(); ctx.shadowBlur = 16; ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 6;

    // Kneeling ground leg
    ctx.fillStyle = '#c2410c';
    ctx.beginPath(); ctx.moveTo(ax - sc * 0.28, ay); ctx.lineTo(ax - sc * 0.35, ay - sc * 0.25);
    ctx.lineTo(ax + sc * 0.02, ay - sc * 0.25); ctx.lineTo(ax + sc * 0.08, ay); ctx.closePath(); ctx.fill();

    // Back/upright leg
    ctx.fillStyle = '#ea580c';
    ctx.beginPath(); ctx.moveTo(ax - sc * 0.05, ay); ctx.lineTo(ax - sc * 0.1, ay - sc * 0.45);
    ctx.lineTo(ax + sc * 0.18, ay - sc * 0.45); ctx.lineTo(ax + sc * 0.22, ay); ctx.closePath(); ctx.fill();

    // White dhoti
    const dhoti = ctx.createLinearGradient(ax - sc * 0.22, ay - sc * 0.1, ax + sc * 0.2, ay);
    dhoti.addColorStop(0, '#fff7ed'); dhoti.addColorStop(1, '#fed7aa');
    ctx.fillStyle = dhoti;
    ctx.beginPath(); ctx.ellipse(ax - sc * 0.04, ay - sc * 0.06, sc * 0.22, sc * 0.14, 0, 0, Math.PI * 2); ctx.fill();
    // Dhoti fold lines
    ctx.strokeStyle = 'rgba(180,120,60,0.4)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ax - sc * 0.18, ay - sc * 0.04); ctx.lineTo(ax + sc * 0.1, ay - sc * 0.14); ctx.stroke();

    // Torso (bare-chested warrior, golden complexion)
    const torsoGrad = ctx.createLinearGradient(ax - sc * 0.18, ay - sc * 0.9, ax + sc * 0.18, ay - sc * 0.3);
    torsoGrad.addColorStop(0, '#c2905e'); torsoGrad.addColorStop(0.5, '#d4a574'); torsoGrad.addColorStop(1, '#b87842');
    ctx.fillStyle = torsoGrad;
    ctx.beginPath(); ctx.ellipse(ax, ay - sc * 0.65, sc * 0.17, sc * 0.28, 0.08, 0, Math.PI * 2); ctx.fill();
    // Muscle definition
    ctx.strokeStyle = 'rgba(150,100,40,0.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ax - sc * 0.05, ay - sc * 0.82); ctx.lineTo(ax - sc * 0.08, ay - sc * 0.52); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ax + sc * 0.05, ay - sc * 0.82); ctx.lineTo(ax + sc * 0.08, ay - sc * 0.52); ctx.stroke();
    // Chest plate / uttariya
    ctx.fillStyle = 'rgba(251,191,36,0.35)'; ctx.strokeStyle = 'rgba(217,119,6,0.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(ax - sc * 0.1, ay - sc * 0.82, sc * 0.2, sc * 0.14, 4); ctx.fill(); ctx.stroke();

    // Quiver on back
    ctx.fillStyle = '#92400e';
    ctx.beginPath(); ctx.roundRect(ax + sc * 0.1, ay - sc * 0.82, sc * 0.07, sc * 0.38, [4, 4, 2, 2]); ctx.fill();
    ctx.strokeStyle = '#6b2f0f'; ctx.lineWidth = 1; ctx.stroke();
    for (let i = 0; i < 4; i++) { // Arrows in quiver
        ctx.strokeStyle = '#7c3a08'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(ax + sc * 0.125 + i * sc * 0.015, ay - sc * 0.82); ctx.lineTo(ax + sc * 0.118 + i * sc * 0.015, ay - sc * 0.55); ctx.stroke();
        ctx.fillStyle = '#6b7280'; ctx.beginPath(); ctx.arc(ax + sc * 0.125 + i * sc * 0.015, ay - sc * 0.84, 2, 0, Math.PI * 2); ctx.fill();
    }

    // Head
    const headGrad = ctx.createRadialGradient(ax - sc * 0.05, ay - sc * 1.08, sc * 0.02, ax, ay - sc * 1.05, sc * 0.155);
    headGrad.addColorStop(0, '#dba870'); headGrad.addColorStop(1, '#b87842');
    ctx.fillStyle = headGrad;
    ctx.beginPath(); ctx.arc(ax, ay - sc * 1.05, sc * 0.155, 0, Math.PI * 2); ctx.fill();
    // Dark warrior hair tied up
    ctx.fillStyle = '#1c1917';
    ctx.beginPath(); ctx.arc(ax, ay - sc * 1.17, sc * 0.10, 0, Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(ax + sc * 0.03, ay - sc * 1.24, sc * 0.055, 0, Math.PI * 2); ctx.fill();
    // Golden crown / kirita
    ctx.fillStyle = '#fbbf24'; ctx.strokeStyle = '#d97706'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ax - sc * 0.10, ay - sc * 1.15); ctx.lineTo(ax - sc * 0.08, ay - sc * 1.25); ctx.lineTo(ax, ay - sc * 1.3); ctx.lineTo(ax + sc * 0.08, ay - sc * 1.25); ctx.lineTo(ax + sc * 0.10, ay - sc * 1.15); ctx.stroke();
    ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(ax, ay - sc * 1.31, sc * 0.024, 0, Math.PI * 2); ctx.fill();
    // Face features
    ctx.fillStyle = '#3d2000'; ctx.beginPath(); ctx.ellipse(ax - sc * 0.052, ay - sc * 1.06, sc * 0.016, sc * 0.012, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(ax + sc * 0.052, ay - sc * 1.06, sc * 0.016, sc * 0.012, 0, 0, Math.PI * 2); ctx.fill();
    // Earring
    ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(ax - sc * 0.155, ay - sc * 1.04, sc * 0.018, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ax + sc * 0.155, ay - sc * 1.04, sc * 0.018, 0, Math.PI * 2); ctx.fill();

    ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

    // ── Bow arm ────────────────────────────────────────────────────────────────
    ctx.save();
    ctx.translate(ax, ay - sc * 0.65);
    ctx.rotate(angle);
    // Arm (forearm extended forward)
    ctx.strokeStyle = '#c2905e'; ctx.lineWidth = sc * 0.07;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sc * 0.65, 0); ctx.stroke();
    // Hand gripping bow
    ctx.fillStyle = '#b87842'; ctx.beginPath(); ctx.arc(sc * 0.65, 0, sc * 0.045, 0, Math.PI * 2); ctx.fill();
    // Bamboo bow — beautiful layered arc
    const bowX = sc * 0.65;
    ctx.save();
    // Shadow bow
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(bowX + 2, 2, sc * 0.30, -Math.PI * 0.62, Math.PI * 0.62); ctx.stroke();
    // Main bow (bamboo gradient)
    const bowGrad = ctx.createLinearGradient(bowX, -sc * 0.32, bowX, sc * 0.32);
    bowGrad.addColorStop(0, '#78350f'); bowGrad.addColorStop(0.3, '#a16207'); bowGrad.addColorStop(0.7, '#92400e'); bowGrad.addColorStop(1, '#78350f');
    ctx.strokeStyle = bowGrad; ctx.lineWidth = 5.5;
    ctx.beginPath(); ctx.arc(bowX, 0, sc * 0.30, -Math.PI * 0.62, Math.PI * 0.62); ctx.stroke();
    // Bow tip reinforcements
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
    const b1x = bowX + sc * 0.30 * Math.cos(-Math.PI * 0.62), b1y = sc * 0.30 * Math.sin(-Math.PI * 0.62);
    const b2x = bowX + sc * 0.30 * Math.cos(Math.PI * 0.62), b2y = sc * 0.30 * Math.sin(Math.PI * 0.62);
    ctx.beginPath(); ctx.arc(b1x, b1y, sc * 0.02, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(b2x, b2y, sc * 0.02, 0, Math.PI * 2); ctx.stroke();
    // Bowstring
    ctx.strokeStyle = '#f5f5dc'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(b1x, b1y); ctx.lineTo(b2x, b2y); ctx.stroke();
    // Arrow nocked on string
    ctx.strokeStyle = '#78350f'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -sc * 0.02); ctx.lineTo(bowX - sc * 0.02, 0); ctx.stroke();
    ctx.fillStyle = '#6b7280';
    ctx.beginPath(); ctx.moveTo(bowX - sc * 0.02, 0); ctx.lineTo(bowX - sc * 0.1, -sc * 0.03); ctx.lineTo(bowX - sc * 0.1, sc * 0.03); ctx.closePath(); ctx.fill();
    ctx.restore(); ctx.restore();

    // ── Draw-back arm ──────────────────────────────────────────────────────────
    ctx.save();
    ctx.translate(ax, ay - sc * 0.65);
    ctx.rotate(angle);
    // Upper arm back
    ctx.strokeStyle = '#c2905e'; ctx.lineWidth = sc * 0.065;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-sc * 0.28, -sc * 0.07); ctx.stroke();
    // Forearm draw-back
    ctx.beginPath(); ctx.moveTo(-sc * 0.28, -sc * 0.07); ctx.lineTo(-sc * 0.12, sc * 0.06); ctx.stroke();
    // Draw hand at string
    ctx.fillStyle = '#b87842';
    ctx.beginPath(); ctx.arc(-sc * 0.12, sc * 0.06, sc * 0.04, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.restore(); // final restore for shadow context
}

// ── Dust motes ────────────────────────────────────────────────────────────────
export function drawMotes(ctx: CanvasRenderingContext2D, motes: Mote[]) {
    motes.forEach(m => {
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,210,80,${m.alpha})`; ctx.fill();
    });
}
export function makeMotes(W: number, H: number): Mote[] {
    return Array.from({ length: 55 }, () => ({
        x: Math.random() * W, y: H * 0.15 + Math.random() * H * 0.65,
        r: Math.random() * 1.8 + 0.4,
        vx: (Math.random() - 0.5) * 0.2, vy: -(Math.random() * 0.28 + 0.06),
        alpha: Math.random() * 0.5 + 0.1,
    }));
}
export function updateMotes(motes: Mote[], W: number, H: number) {
    motes.forEach(m => {
        m.x += m.vx; m.y += m.vy;
        if (m.y < H * 0.08) { m.y = H * 0.88; m.x = Math.random() * W; }
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HUD — Unfurling scroll + ornate energy bar
// ═══════════════════════════════════════════════════════════════════════════════
export function drawHUD(ctx: CanvasRenderingContext2D, W: number, H: number, gs: GS) {
    // ── Top scroll unfurled ────────────────────────────────────────────────────
    const scrollH = 48, sw = W;
    // Parchment main body
    const scrollGrad = ctx.createLinearGradient(0, 0, sw, scrollH);
    scrollGrad.addColorStop(0, '#fef9c3'); scrollGrad.addColorStop(0.5, '#fde68a'); scrollGrad.addColorStop(1, '#fef3c7');
    ctx.fillStyle = scrollGrad; ctx.beginPath(); ctx.rect(0, 0, sw, scrollH); ctx.fill();
    // Top and bottom roll edges (thick brown)
    ctx.fillStyle = '#92400e';
    ctx.fillRect(0, 0, sw, 6);
    ctx.fillRect(0, scrollH - 6, sw, 6);
    // Scroll roll caps (left and right cylinders)
    const capR = scrollH / 2;
    [[0, capR], [sw, capR]].forEach(([px, py]) => {
        const cg = ctx.createRadialGradient(px, py, 2, px, py, capR);
        cg.addColorStop(0, '#d97706'); cg.addColorStop(0.5, '#92400e'); cg.addColorStop(1, '#5c2d0e');
        ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(px, py, capR, 0, Math.PI * 2); ctx.fill();
        // Highlight
        ctx.fillStyle = 'rgba(255,200,80,0.3)'; ctx.beginPath(); ctx.arc(px - capR * 0.2, py - capR * 0.2, capR * 0.35, 0, Math.PI * 2); ctx.fill();
    });
    // Parchment crinkle lines
    ctx.strokeStyle = 'rgba(146,64,14,0.2)'; ctx.lineWidth = 0.8;
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(capR, i * 12); ctx.lineTo(sw - capR, i * 12); ctx.stroke(); }

    // Mode label (calligraphic)
    ctx.fillStyle = '#7c2d12'; ctx.font = 'bold 13px serif'; ctx.textAlign = 'left';
    ctx.fillText(gs.mode === 'GANITA' ? '∑ GANITA' : '❋ SMRITI', capR + 10, 26);

    // Streak
    if (gs.streak >= 3) { ctx.fillStyle = '#c2410c'; ctx.font = 'bold 12px serif'; ctx.fillText(`🔥 ${gs.streak}×`, capR + 10, 41); }

    // ── Ornate energy (Prana) bar ──────────────────────────────────────────────
    const bw = Math.min(W * 0.48, 220), barX = (W - bw) / 2;
    // Wooden frame
    const frameGrad = ctx.createLinearGradient(barX - 6, 10, barX + bw + 6, 28);
    frameGrad.addColorStop(0, '#92400e'); frameGrad.addColorStop(0.5, '#b45309'); frameGrad.addColorStop(1, '#92400e');
    ctx.fillStyle = frameGrad; ctx.beginPath(); ctx.roundRect(barX - 6, 10, bw + 12, 22, 5); ctx.fill();
    // Ornate corners
    [[barX - 6, 10], [barX + bw + 6, 10], [barX - 6, 32], [barX + bw + 6, 32]].forEach(([cx, cy]) => {
        ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
    });
    // Inner trough
    ctx.fillStyle = '#3c1c08'; ctx.beginPath(); ctx.roundRect(barX, 14, bw, 14, 3); ctx.fill();
    // Glowing energy fill
    if (gs.prana > 0) {
        const energyFill = ctx.createLinearGradient(barX, 0, barX + bw, 0);
        energyFill.addColorStop(0, '#4ade80'); energyFill.addColorStop(0.5, '#fbbf24'); energyFill.addColorStop(1, '#ef4444');
        ctx.fillStyle = energyFill; ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(251,191,36,0.8)';
        ctx.beginPath(); ctx.roundRect(barX, 14, (gs.prana / 100) * bw, 14, 3); ctx.fill(); ctx.shadowBlur = 0;
    }
    // Prana label
    ctx.fillStyle = '#fde68a'; ctx.font = 'bold 10px serif'; ctx.textAlign = 'center';
    ctx.fillText('प्राण', W / 2, 44);

    // Score (right side of scroll)
    ctx.fillStyle = '#7c2d12'; ctx.font = 'bold 16px serif'; ctx.textAlign = 'right';
    ctx.fillText(`✦ ${gs.score}`, W - capR - 10, 28);

    // ── Tratak dot cycle (7 dots) ──────────────────────────────────────────────
    const dotSpacing = 15, dotR = 4.5, dotCount = 7;
    const dotsX = (W - (dotCount * dotSpacing)) / 2;
    for (let i = 0; i < dotCount; i++) {
        const filled = i < (gs.correctHits % 7);
        ctx.beginPath(); ctx.arc(dotsX + i * dotSpacing + dotR, 42, dotR, 0, Math.PI * 2);
        ctx.fillStyle = filled ? '#d97706' : 'rgba(120,60,14,0.5)'; ctx.fill();
        if (filled) { ctx.shadowBlur = 5; ctx.shadowColor = '#fbbf24'; ctx.fill(); ctx.shadowBlur = 0; }
        ctx.strokeStyle = '#92400e'; ctx.lineWidth = 1; ctx.stroke();
    }
}

// ── Bottom parchment instruction ──────────────────────────────────────────────
export function drawInstruction(ctx: CanvasRenderingContext2D, W: number, H: number, text: string) {
    if (!text) return;
    const pw = Math.max(180, text.length * 8 + 40), ph = 32, px = (W - pw) / 2, py = H - ph - 12;
    // Aged parchment
    const pg = ctx.createLinearGradient(px, py, px + pw, py + ph);
    pg.addColorStop(0, '#fef3c7'); pg.addColorStop(0.5, '#fde68a'); pg.addColorStop(1, '#fef3c7');
    ctx.fillStyle = pg; ctx.strokeStyle = '#92400e'; ctx.lineWidth = 1.5; ctx.shadowBlur = 6; ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 6); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
    // Ragged parchment edge effect
    ctx.strokeStyle = 'rgba(146,64,14,0.25)'; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(px + 4, py + 10); ctx.lineTo(px + pw - 4, py + 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px + 4, py + 22); ctx.lineTo(px + pw - 4, py + 22); ctx.stroke();
    // Text
    ctx.fillStyle = '#7c2d12'; ctx.font = 'bold 13px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, py + ph / 2);
}
