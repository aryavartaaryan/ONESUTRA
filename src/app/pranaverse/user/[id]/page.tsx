'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import styles from './page.module.css';

// ── Dosha Canvas ─────────────────────────────────────────────
type Dosha = 'vata' | 'pitta' | 'kapha';

function drawAura(canvas: HTMLCanvasElement, dosha: Dosha, time: number) {
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2;
    ctx.clearRect(0, 0, W, H);
    const base = dosha === 'vata' ? '#9d4edd' : dosha === 'pitta' ? '#ff6b35' : '#40916c';
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.48);
    g.addColorStop(0, base + '44'); g.addColorStop(1, 'transparent');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (dosha === 'vata') { for (let a = 0; a < 5; a++) { ctx.beginPath(); for (let i = 0; i < 80; i++) { const t = i / 80, s = t * 4 + time * 0.8 + (a / 5) * Math.PI * 2, r = t * W * 0.44 + Math.sin(time * 2 + a) * 5, px = cx + Math.cos(s) * r, py = cy + Math.sin(s) * r; i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); } ctx.strokeStyle = ['#9d4edd', '#c77dff', '#64b5f6', '#00d4ff', '#b4aaff'][a] + '55'; ctx.lineWidth = 1; ctx.stroke(); } }
    if (dosha === 'pitta') { for (let r = 1; r < 6; r++) { const ph = (time * 1.8 + r * 0.6) % (Math.PI * 2), rad = Math.max(1, (r / 6) * W * 0.44 + Math.sin(ph) * 5); ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.strokeStyle = ['#ff4500', '#ff6b35', '#ffd60a', '#e63946', '#ff8c42'][r % 5] + '55'; ctx.lineWidth = 1.5; ctx.stroke(); } }
    if (dosha === 'kapha') { for (let b = 0; b < 5; b++) { const t = time * 0.22 + b * 1.4, bx = cx + Math.cos(t) * W * 0.20, by = cy + Math.sin(t * 0.7) * H * 0.20, br = Math.max(2, W * (0.20 + 0.05 * Math.sin(t * 0.4))); const gb = ctx.createRadialGradient(bx, by, 0, bx, by, br); gb.addColorStop(0, ['#40916c', '#52b788', '#2166ac', '#1b4332', '#48cae4'][b] + 'aa'); gb.addColorStop(1, 'transparent'); ctx.fillStyle = gb; ctx.beginPath(); ctx.ellipse(bx, by, br, Math.max(2, br * 1.08), t * 0.2, 0, Math.PI * 2); ctx.fill(); } }
    ctx.globalCompositeOperation = 'destination-in';
    const clip = ctx.createRadialGradient(cx, cy, W * 0.25, cx, cy, W * 0.5);
    clip.addColorStop(0, 'rgba(0,0,0,1)'); clip.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = clip; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
}

function AuraCanvas({ dosha, size = 180 }: { dosha: Dosha; size?: number }) {
    const ref = useRef<HTMLCanvasElement>(null);
    const raf = useRef<number>(0);
    const t = useRef(0);
    useEffect(() => {
        const c = ref.current; if (!c) return;
        c.width = size * 2; c.height = size * 2;
        const loop = () => { t.current += 0.016; drawAura(c, dosha, t.current); raf.current = requestAnimationFrame(loop); };
        raf.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf.current);
    }, [dosha, size]);
    return <canvas ref={ref} style={{ width: size, height: size, borderRadius: '50%' }} />;
}

// ── User Data ────────────────────────────────────────────────
const USERS = [
    {
        id: '1', handle: '@Aryan.Creates', displayName: 'Aryan Sharma',
        avatar: '🧘', dosha: 'vata' as Dosha,
        roles: ['Founder', 'Vibe Coder', 'Product Designer'],
        bio: 'Building conscious tech at the intersection of Vedanta & software engineering.\nMorning sadhana → late-night code → repeat. Believer in slow mornings and deep work.',
        badge: '🌱 Level 7 Seed', ringColor: '#ffd060',
        location: 'Bengaluru, India 🇮🇳', joined: 'Feb 2025',
        resonances: 4218, seeds: 892, days: 41, posts: 67,
        auraColor: 'linear-gradient(135deg,#2d1202,#4a2c0a)',
        posts_preview: [
            { emoji: '🌅', bg: 'linear-gradient(135deg,#2d1a06,#4a2c0a)', type: '📸 Lapse' },
            { emoji: '🧘', bg: 'linear-gradient(135deg,#0f0614,#1a0b2e)', type: '✦ Reflect' },
            { emoji: '💻', bg: 'linear-gradient(135deg,#030c10,#061522)', type: '🎙️ Voice' },
        ],
    },
    {
        id: '2', handle: '@Lakshmi.Flow', displayName: 'Lakshmi Patel',
        avatar: '🌿', dosha: 'kapha' as Dosha,
        roles: ['Conscious Designer', 'Builder', 'Nature Seeker'],
        bio: 'UX & Sacred Artist. I design products that feel like a deep breath.\nNature is my mood board. Earth is the brief.',
        badge: '🪷 Level 6 Lotus', ringColor: '#52e89a',
        location: 'Mumbai, India 🇮🇳', joined: 'Dec 2024',
        resonances: 3105, seeds: 641, days: 33, posts: 48,
        auraColor: 'linear-gradient(135deg,#050e05,#0b1a0a)',
        posts_preview: [
            { emoji: '🌿', bg: 'linear-gradient(135deg,#050e05,#0b1a0a)', type: '📸 Lapse' },
            { emoji: '🎨', bg: 'linear-gradient(135deg,#0a0314,#18062a)', type: '✦ Reflect' },
            { emoji: '🌱', bg: 'linear-gradient(135deg,#03100a,#061e10)', type: '🎙️ Voice' },
        ],
    },
    {
        id: '3', handle: '@Rishi.Dharma', displayName: 'Rishi Iyer',
        avatar: '🔮', dosha: 'pitta' as Dosha,
        roles: ['Neuroscientist', 'Vedic Learner', 'Professional'],
        bio: 'Neuroscientist by day, Vedic astrology student by moonlight.\nConsciousness is the final frontier. Connecting ancient maps to modern minds.',
        badge: '✦ Level 5 Star', ringColor: '#c77dff',
        location: 'Chennai, India 🇮🇳', joined: 'Jan 2025',
        resonances: 2788, seeds: 503, days: 28, posts: 39,
        auraColor: 'linear-gradient(135deg,#05020f,#0e0820)',
        posts_preview: [
            { emoji: '🪐', bg: 'linear-gradient(135deg,#05020f,#0e0820)', type: '✦ Reflect' },
            { emoji: '🌙', bg: 'linear-gradient(135deg,#08040f,#120818)', type: '📸 Lapse' },
            { emoji: '🔮', bg: 'linear-gradient(135deg,#0a0412,#180624)', type: '🎙️ Voice' },
        ],
    },
    {
        id: '4', handle: '@Nisha.Waves', displayName: 'Nisha Varma',
        avatar: '🌊', dosha: 'kapha' as Dosha,
        roles: ['Sustainable Founder', 'Builder', 'Ocean Keeper'],
        bio: 'Sustainable tech founder. Every byte we write counts for the planet.\n40% of profits fund reforestation. Flow > grind.',
        badge: '💎 Level 8 Crystal', ringColor: '#60d4f8',
        location: 'Goa, India 🇮🇳', joined: 'Oct 2024',
        resonances: 6540, seeds: 1240, days: 67, posts: 112,
        auraColor: 'linear-gradient(135deg,#020a12,#041525)',
        posts_preview: [
            { emoji: '🌊', bg: 'linear-gradient(135deg,#020a12,#041525)', type: '🌊 Moment' },
            { emoji: '🌿', bg: 'linear-gradient(135deg,#030c08,#061810)', type: '📸 Lapse' },
            { emoji: '💎', bg: 'linear-gradient(135deg,#04080f,#071220)', type: '✦ Reflect' },
        ],
    },
];

export default function PranaVerseUserProfile() {
    const params = useParams();
    const router = useRouter();
    const user = USERS.find(u => u.id === String(params.id));
    const [resonated, setResonated] = useState(false);

    if (!user) {
        return (
            <div style={{ minHeight: '100dvh', background: '#0a0806', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,230,160,0.7)', fontFamily: 'Inter,sans-serif' }}>
                User not found · <Link href="/pranaverse" style={{ color: '#ffd060', marginLeft: 8 }}>Back to Feed</Link>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Background */}
            <div className={styles.pageBg} style={{ background: user.auraColor }} />
            <div className={styles.pageBgOverlay} />

            {/* Back button */}
            <button className={styles.backBtn} onClick={() => router.back()}>
                ← Feed
            </button>

            {/* Hero section */}
            <div className={styles.hero}>
                {/* Aura Avatar */}
                <div className={styles.auraWrap}>
                    <div className={styles.auraGlowRing} style={{ boxShadow: `0 0 0 3px ${user.ringColor}44, 0 0 40px ${user.ringColor}22` }} />
                    <AuraCanvas dosha={user.dosha} size={130} />
                </div>

                <div className={styles.heroName}>{user.displayName}</div>
                <div className={styles.heroHandle}>{user.handle}</div>

                {/* Roles */}
                <div className={styles.roles}>
                    {user.roles.map(r => (
                        <span key={r} className={styles.roleChip} style={{ borderColor: `${user.ringColor}44`, color: user.ringColor, background: `${user.ringColor}12` }}>
                            {r}
                        </span>
                    ))}
                </div>

                {/* Location + badge */}
                <div className={styles.metaRow}>
                    <span className={styles.metaItem}>📍 {user.location}</span>
                    <span className={styles.metaItem}>📅 {user.joined}</span>
                    <span className={styles.metaBadge}>{user.badge}</span>
                </div>
            </div>

            {/* Bio */}
            <div className={styles.section}>
                <p className={styles.bio}>{user.bio}</p>
            </div>

            {/* Stats */}
            <div className={styles.statsGrid}>
                {[
                    { val: user.resonances.toLocaleString(), lbl: 'Resonances', emoji: '🕉️' },
                    { val: user.seeds.toLocaleString(), lbl: 'Seeds', emoji: '🌱' },
                    { val: user.days, lbl: 'Day Streak', emoji: '🔥' },
                    { val: user.posts, lbl: 'Posts', emoji: '✦' },
                ].map(s => (
                    <div key={s.lbl} className={styles.statBox}>
                        <span className={styles.statEmoji}>{s.emoji}</span>
                        <span className={styles.statVal}>{s.val}</span>
                        <span className={styles.statLbl}>{s.lbl}</span>
                    </div>
                ))}
            </div>

            {/* Post previews */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>Recent Flow</div>
                <div className={styles.postGrid}>
                    {user.posts_preview.map((p, i) => (
                        <div key={i} className={styles.postThumb} style={{ background: p.bg }}>
                            <span className={styles.postThumbEmoji}>{p.emoji}</span>
                            <span className={styles.postThumbType}>{p.type}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Resonate CTA */}
            <div className={styles.ctaWrap}>
                <button
                    className={`${styles.resonateBtn} ${resonated ? styles.resonateBtnDone : ''}`}
                    onClick={() => setResonated(r => !r)}
                    style={resonated ? { borderColor: `${user.ringColor}55`, boxShadow: `0 0 24px ${user.ringColor}22` } : {}}
                >
                    {resonated ? `✦ Resonating with ${user.displayName.split(' ')[0]}` : `🕉️  Send Resonance`}
                </button>
                <Link href="/pranaverse" className={styles.backLink}>← Back to Feed</Link>
            </div>
        </div>
    );
}
