'use client';

import { useEffect, useRef } from 'react';

/**
 * SacredCanvas — A lightweight Leela-style animated background.
 * Light sattvik palette: ivory · saffron · sage · lavender dust.
 * Animations: breathing mandalic rings, floating orbs, drifting petals,
 * slow sacred-geometry rotation — all canvas-based, zero DOM overhead.
 */
export default function SacredCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;

        let raf = 0;
        let W = 0, H = 0;

        const resize = () => {
            W = canvas.width = window.innerWidth;
            H = canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // ── Orbs ──────────────────────────────────────────────────────────────────
        type Orb = { x: number; y: number; r: number; vx: number; vy: number; hue: number; alpha: number; phase: number };
        const ORB_COLORS = [
            [38, 80, 96],   // saffron-amber hsl
            [120, 25, 88],  // sage mist
            [270, 30, 90],  // lavender dust
            [45, 70, 94],   // golden cream
            [20, 60, 92],   // warm peach
        ];
        const orbs: Orb[] = Array.from({ length: 9 }, (_, i) => ({
            x: Math.random() * W,
            y: Math.random() * H,
            r: 80 + Math.random() * 160,
            vx: (Math.random() - 0.5) * 0.22,
            vy: (Math.random() - 0.5) * 0.18,
            hue: ORB_COLORS[i % ORB_COLORS.length][0],
            alpha: 0.06 + Math.random() * 0.07,
            phase: Math.random() * Math.PI * 2,
        }));

        // ── Petals ────────────────────────────────────────────────────────────────
        type Petal = { x: number; y: number; size: number; angle: number; drift: number; speed: number; opacity: number };
        const petals: Petal[] = Array.from({ length: 18 }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            size: 3 + Math.random() * 5,
            angle: Math.random() * Math.PI * 2,
            drift: (Math.random() - 0.5) * 0.5,
            speed: 0.12 + Math.random() * 0.2,
            opacity: 0.08 + Math.random() * 0.12,
        }));

        // ── Sacred ring params ────────────────────────────────────────────────────
        const rings = [
            { r: 0.25, speed: 0.0004, w: 0.7, alpha: 0.06 },
            { r: 0.35, speed: -0.0003, w: 0.5, alpha: 0.05 },
            { r: 0.46, speed: 0.00025, w: 0.4, alpha: 0.04 },
            { r: 0.58, speed: -0.0002, w: 0.35, alpha: 0.035 },
        ];

        let angle = 0;
        let t = 0;

        const draw = () => {
            raf = requestAnimationFrame(draw);
            t += 0.008;
            angle += 0.00018;

            ctx.clearRect(0, 0, W, H);

            // ── 1. Soft orbs ──────────────────────────────────────────────────────
            orbs.forEach(o => {
                o.x += o.vx;
                o.y += o.vy;
                if (o.x < -o.r) o.x = W + o.r;
                if (o.x > W + o.r) o.x = -o.r;
                if (o.y < -o.r) o.y = H + o.r;
                if (o.y > H + o.r) o.y = -o.r;

                const pulse = o.alpha * (0.85 + 0.15 * Math.sin(t * 0.6 + o.phase));
                const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
                g.addColorStop(0, `hsla(${o.hue},55%,88%,${pulse})`);
                g.addColorStop(1, `hsla(${o.hue},40%,96%,0)`);
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
                ctx.fill();
            });

            // ── 2. Sacred concentric rings (rotating) ─────────────────────────────
            const cx = W / 2, cy = H / 2;
            const baseR = Math.min(W, H);

            rings.forEach((ring, ri) => {
                const rr = baseR * ring.r;
                const segments = 6 + ri * 2; // hexagonal / octagonal
                const step = (Math.PI * 2) / segments;
                const rot = angle * ring.speed * 1000 + ri * (Math.PI / segments);

                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(rot);

                // dotted ring
                ctx.beginPath();
                for (let i = 0; i < segments; i++) {
                    const a = i * step;
                    const x = Math.cos(a) * rr;
                    const y = Math.sin(a) * rr;
                    ctx.moveTo(x + 2.5, y);
                    ctx.arc(x, y, 2.2, 0, Math.PI * 2);
                }
                ctx.fillStyle = `rgba(201,123,58,${ring.alpha})`;
                ctx.fill();

                // connecting arcs between dots
                ctx.beginPath();
                ctx.arc(0, 0, rr, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(201,123,58,${ring.alpha * 0.5})`;
                ctx.lineWidth = ring.w;
                ctx.setLineDash([4, 18]);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.restore();
            });

            // ── 3. Inner OM pulse circle ───────────────────────────────────────────
            const omPulse = 0.5 + 0.5 * Math.sin(t * 0.5);
            const omR = baseR * (0.06 + omPulse * 0.015);
            const omG = ctx.createRadialGradient(cx, cy, 0, cx, cy, omR);
            omG.addColorStop(0, `rgba(255,200,100,${0.18 + omPulse * 0.10})`);
            omG.addColorStop(0.5, `rgba(255,160,60,${0.08 + omPulse * 0.06})`);
            omG.addColorStop(1, 'rgba(255,160,60,0)');
            ctx.fillStyle = omG;
            ctx.beginPath();
            ctx.arc(cx, cy, omR * 2.8, 0, Math.PI * 2);
            ctx.fill();

            // ── 4. Floating petals ────────────────────────────────────────────────
            petals.forEach(p => {
                p.y -= p.speed;
                p.x += p.drift;
                p.angle += 0.008;
                if (p.y < -20) { p.y = H + 20; p.x = Math.random() * W; }

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle);
                ctx.beginPath();
                // simple teardrop petal shape
                ctx.moveTo(0, -p.size);
                ctx.bezierCurveTo(p.size * 0.8, -p.size * 0.4, p.size * 0.5, p.size * 0.6, 0, p.size);
                ctx.bezierCurveTo(-p.size * 0.5, p.size * 0.6, -p.size * 0.8, -p.size * 0.4, 0, -p.size);
                ctx.fillStyle = `rgba(255,160,60,${p.opacity})`;
                ctx.fill();
                ctx.restore();
            });
        };

        draw();
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0,
            }}
        />
    );
}
