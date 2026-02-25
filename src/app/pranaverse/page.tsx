'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

// ════════════════════════════════════════════════════════
//  AURA CANVAS (in Profile Sheet)
// ════════════════════════════════════════════════════════
type Dosha = 'vata' | 'pitta' | 'kapha';

function drawAura(canvas: HTMLCanvasElement, dosha: Dosha, time: number) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;

    ctx.clearRect(0, 0, W, H);

    const baseColor = dosha === 'vata' ? '#9d4edd' : dosha === 'pitta' ? '#ff6b35' : '#40916c';
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.48);
    g.addColorStop(0, baseColor + '33');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    if (dosha === 'vata') {
        for (let a = 0; a < 4; a++) {
            ctx.beginPath();
            for (let i = 0; i < 80; i++) {
                const t = i / 80;
                const spiral = t * 4 + time * 0.7 + (a / 4) * Math.PI * 2;
                const r = t * W * 0.42 + Math.sin(time * 2 + a) * 4;
                const px = cx + Math.cos(spiral) * r;
                const py = cy + Math.sin(spiral) * r;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.strokeStyle = ['#9d4edd', '#c77dff', '#64b5f6', '#00d4ff'][a] + '66';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    if (dosha === 'pitta') {
        for (let r = 1; r < 5; r++) {
            const phase = (time * 1.8 + r * 0.6) % (Math.PI * 2);
            const rad = Math.max(1, (r / 5) * W * 0.44 + Math.sin(phase) * 5);
            ctx.beginPath();
            ctx.arc(cx, cy, rad, 0, Math.PI * 2);
            ctx.strokeStyle = ['#ff4500', '#ff6b35', '#ffd60a', '#e63946'][r % 4] + '55';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }

    if (dosha === 'kapha') {
        for (let b = 0; b < 4; b++) {
            const t = time * 0.22 + b * 1.4;
            const bx = cx + Math.cos(t) * W * 0.20;
            const by = cy + Math.sin(t * 0.7) * H * 0.20;
            const br = Math.max(2, W * (0.20 + 0.05 * Math.sin(t * 0.4)));
            const gb = ctx.createRadialGradient(bx, by, 0, bx, by, br);
            gb.addColorStop(0, ['#40916c', '#52b788', '#2166ac', '#1b4332'][b] + 'aa');
            gb.addColorStop(1, 'transparent');
            ctx.fillStyle = gb;
            ctx.beginPath();
            ctx.ellipse(bx, by, br, Math.max(2, br * 1.08), t * 0.2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Clip to circle
    ctx.globalCompositeOperation = 'destination-in';
    const clip = ctx.createRadialGradient(cx, cy, W * 0.28, cx, cy, W * 0.5);
    clip.addColorStop(0, 'rgba(0,0,0,1)');
    clip.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = clip;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
}

function AuraCanvas({ dosha }: { dosha: Dosha }) {
    const ref = useRef<HTMLCanvasElement>(null);
    const raf = useRef<number>(0);
    const t = useRef(0);

    useEffect(() => {
        const c = ref.current;
        if (!c) return;
        c.width = 180; c.height = 180;
        const loop = () => { t.current += 0.016; drawAura(c, dosha, t.current); raf.current = requestAnimationFrame(loop); };
        raf.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf.current);
    }, [dosha]);

    return <canvas ref={ref} className={styles.auraCanvas} />;
}

// ════════════════════════════════════════════════════════
//  VOICE WAVEFORM BARS
// ════════════════════════════════════════════════════════
const BAR_HEIGHTS = [0.35, 0.7, 0.55, 1.0, 0.8, 0.45, 0.65, 0.9, 0.5, 0.75, 1.0, 0.6, 0.85, 0.4, 0.7, 0.55, 0.9, 0.65, 0.45, 0.8, 0.35, 0.7, 0.6, 1.0];

function VoiceWave() {
    return (
        <div className={styles.waveBarRow}>
            {BAR_HEIGHTS.map((h, i) => (
                <div
                    key={i}
                    className={styles.waveBar}
                    style={{
                        height: `${h * 100}%`,
                        '--h': h * 2.2,
                        animationDelay: `${i * 0.05}s`,
                        animationDuration: `${0.9 + h * 0.6}s`,
                    } as React.CSSProperties}
                />
            ))}
        </div>
    );
}

// ════════════════════════════════════════════════════════
//  DATA
// ════════════════════════════════════════════════════════
interface User {
    id: number;
    handle: string;
    displayName: string;
    avatar: string;
    dosha: Dosha;
    roles: { label: string; chip: string }[];
    bio: string;
    badge: string;
    ringClass: string;
    avatarClass: string;
    resonances: number;
    seeds: number;
    days: number;
}

const USERS: User[] = [
    {
        id: 1, handle: '@Aryan.Creates', displayName: 'Aryan Sharma',
        avatar: '🧘', dosha: 'vata',
        roles: [
            { label: 'Founder', chip: styles.chipFounder },
            { label: 'Vibe Coder', chip: styles.chipCoder },
        ],
        bio: 'Building conscious tech at the intersection of Vedanta & software. Morning sadhana → late-night code → repeat.',
        badge: '🌱 Level 7 Seed', ringClass: styles.ringGold, avatarClass: styles.avatarGold,
        resonances: 4218, seeds: 892, days: 41,
    },
    {
        id: 2, handle: '@Lakshmi.Flow', displayName: 'Lakshmi Patel',
        avatar: '🌿', dosha: 'kapha',
        roles: [
            { label: 'Designer', chip: styles.chipDesigner },
            { label: 'Builder', chip: styles.chipBuilder },
        ],
        bio: 'UX Designer & Sacred Artist. I design products that feel like a deep breath. Nature is my mood board.',
        badge: '🪷 Level 6 Lotus', ringClass: styles.ringGreen, avatarClass: styles.avatarForest,
        resonances: 3105, seeds: 641, days: 33,
    },
    {
        id: 3, handle: '@Rishi.Dharma', displayName: 'Rishi Iyer',
        avatar: '🔮', dosha: 'pitta',
        roles: [
            { label: 'Professional', chip: styles.chipFounder },
            { label: 'Vedic Learner', chip: styles.chipDesigner },
        ],
        bio: 'Neuroscientist by day, Vedic astrology student by moonlight. Consciousness is the final frontier.',
        badge: '✦ Level 5 Star', ringClass: styles.ringPurple, avatarClass: styles.avatarCosmic,
        resonances: 2788, seeds: 503, days: 28,
    },
    {
        id: 4, handle: '@Nisha.Waves', displayName: 'Nisha Varma',
        avatar: '🌊', dosha: 'kapha',
        roles: [
            { label: 'Builder', chip: styles.chipBuilder },
            { label: 'Founder', chip: styles.chipFounder },
        ],
        bio: 'Sustainable tech founder. We make every byte count for the planet. 40% of our profits plant forests.',
        badge: '💎 Level 8 Crystal', ringClass: styles.ringBlue, avatarClass: styles.avatarOcean,
        resonances: 6540, seeds: 1240, days: 67,
    },
];

interface PostAction { lotus: boolean; cloud: boolean; prism: boolean; seed: boolean; }

interface Post {
    id: number;
    type: 'lapse' | 'voice' | 'reflect' | 'ocean';
    bgClass: string;
    tagClass: string;
    tagLabel: string;
    userId: number;
    caption: string;
    hashtags: string[];
    emoji?: string;
    lapseCaption?: string;
    voiceLines?: string[];
    quote?: string;
    quoteSource?: string;
    likes: number;
}

const POSTS: Post[] = [
    {
        id: 1, type: 'lapse', bgClass: styles.bgGolden, tagClass: styles.tagLapse, tagLabel: '📸 Lapse',
        userId: 1, caption: 'Watched the sun paint the whole sky. 90-minute golden hour time-lapse. This is why we wake up early. ✨',
        hashtags: ['#GoldenHour', '#Sadhana'], emoji: '🌅', lapseCaption: 'golden hour · 5:48 AM', likes: 1284,
    },
    {
        id: 2, type: 'voice', bgClass: styles.bgForest, tagClass: styles.tagVoice, tagLabel: '🎙️ Voice Note',
        userId: 2, caption: 'Recorded this thought mid-walk. Sharing my morning realization on stillness.',
        hashtags: ['#FlowState', '#Mindful'],
        voiceLines: [
            'When I stopped trying to be productive this morning, I realised that the creative downloads come',
            'not when you chase them — but when you become very, very still.',
        ],
        likes: 892,
    },
    {
        id: 3, type: 'reflect', bgClass: styles.bgCosmic, tagClass: styles.tagReflect, tagLabel: '✦ Reflection',
        userId: 3, caption: 'This line from Rumi has been living in my chest for three days now.',
        hashtags: ['#Vedanta', '#Rumi'], emoji: '🪐',
        quote: '"Yesterday I was clever, I wanted to change the world. Today I am wise, I am changing myself."',
        quoteSource: '— Rumi',
        likes: 3401,
    },
    {
        id: 4, type: 'ocean', bgClass: styles.bgOcean, tagClass: styles.tagOcean, tagLabel: '🌊 Moment',
        userId: 4, caption: '6 AM beach meditation. The ocean keeps the most honest rhythm.',
        hashtags: ['#Ocean', '#PranaVerse'], emoji: '🌊', likes: 2105,
    },
];

// ════════════════════════════════════════════════════════
//  POST COMPONENT
// ════════════════════════════════════════════════════════
function PostCard({ post, onUserClick }: { post: Post; onUserClick: (id: number) => void }) {
    const user = USERS.find(u => u.id === post.userId)!;
    const [actions, setActions] = useState<PostAction>({ lotus: false, cloud: false, prism: false, seed: false });
    const [likeCount, setLikeCount] = useState(post.likes);
    const [burst, setBurst] = useState(false);

    const tap = useCallback((k: keyof PostAction) => {
        setActions(prev => {
            const next = { ...prev, [k]: !prev[k] };
            if (k === 'lotus') { setLikeCount(c => prev.lotus ? c - 1 : c + 1); if (!prev.lotus) { setBurst(true); setTimeout(() => setBurst(false), 700); } }
            return next;
        });
    }, []);

    return (
        <div className={styles.post}>
            {/* Background */}
            <div className={post.bgClass} />
            {post.type === 'lapse' && <div className={styles.mist} />}
            <div className={styles.vignette} />

            {/* Top bar */}
            <div className={styles.topBar}>
                <span className={styles.wordmark}>The PranaVerse</span>
                <span className={`${styles.postTypeTag} ${post.tagClass}`}>{post.tagLabel}</span>
            </div>

            {/* Content */}
            {post.type === 'lapse' && (
                <div className={styles.lapseFrame}>
                    <div className={styles.polaroidStack}>
                        <div className={`${styles.polaroidCard}`} style={{ transform: 'rotate(-4deg)', position: 'absolute', top: -10, left: -12, right: 12, zIndex: 0, opacity: 0.55 }}>
                            <div className={styles.polaroidImg} style={{ background: 'linear-gradient(135deg, #a06020, #7a4010)' }}><span style={{ fontSize: '2.5rem' }}>🌄</span></div>
                            <p className={styles.polaroidCaption}>5:32 AM</p>
                        </div>
                        <div className={styles.polaroidCard} style={{ position: 'relative', zIndex: 1 }}>
                            <div className={styles.polaroidImg}><span style={{ fontSize: '3rem' }}>{post.emoji}</span></div>
                            <p className={styles.polaroidCaption}>{post.lapseCaption}</p>
                        </div>
                    </div>
                </div>
            )}

            {post.type === 'voice' && (
                <div className={styles.voiceCard}>
                    <div className={styles.voiceHeader}>
                        <div className={styles.voiceIcon}>🎙️</div>
                        <div>
                            <div className={styles.voiceTitle}>Voice Reflection · Morning Walk</div>
                            <div className={styles.voiceDuration}>2:14 · 🌿 Forest Mode</div>
                        </div>
                    </div>
                    <VoiceWave />
                    <div className={styles.transcriptCard}>
                        <p className={styles.transcriptLine}>
                            {post.voiceLines![0]} <strong>{post.voiceLines![1]}</strong>
                        </p>
                    </div>
                </div>
            )}

            {post.type === 'reflect' && (
                <div className={styles.reflectCard}>
                    <div className={styles.reflectSymbol}>{post.emoji}</div>
                    <p className={styles.reflectQuote}>{post.quote}</p>
                    <span className={styles.reflectSource}>{post.quoteSource}</span>
                </div>
            )}

            {post.type === 'ocean' && (
                <div className={styles.oceanFrame}>
                    <div className={styles.oceanEmoji}>{post.emoji}</div>
                    <p className={styles.oceanCaption}>
                        "The ocean doesn't apologise for its depth.<br />
                        Neither should you for yours."
                    </p>
                </div>
            )}

            {/* Growth Stack */}
            <div className={styles.growthStack}>
                {[
                    { k: 'lotus' as const, on: actions.lotus, onClass: styles.actionIconLotusOn, icon: actions.lotus ? '🪷' : '🌸', label: likeCount.toLocaleString() },
                    { k: 'cloud' as const, on: actions.cloud, onClass: '', icon: '☁️', label: '218' },
                    { k: 'prism' as const, on: actions.prism, onClass: styles.actionIconPrismOn, icon: actions.prism ? '💎' : '✦', label: 'Radiate' },
                    { k: 'seed' as const, on: actions.seed, onClass: styles.actionIconSeedOn, icon: actions.seed ? '🌱' : '🌿', label: actions.seed ? 'Planted' : 'Plant' },
                ].map(item => (
                    <div key={item.k} className={styles.actionItem} onClick={() => tap(item.k)}>
                        <div className={`${styles.actionIcon} ${item.on ? item.onClass : ''}`}>
                            {item.k === 'lotus' && burst && <div className={styles.petalBurst} />}
                            <span>{item.icon}</span>
                        </div>
                        <span className={styles.actionCount}>{item.label}</span>
                    </div>
                ))}
            </div>

            {/* Profile Zone */}
            <div className={styles.profileZone}>
                <div className={styles.profileRow} onClick={() => onUserClick(user.id)}>
                    <div className={styles.vibeRingWrap}>
                        <svg className={styles.vibeRingSvg} viewBox="0 0 66 66">
                            <circle className={`${styles.vibeRingCircle} ${user.ringClass}`} cx="33" cy="33" r="27" strokeDasharray="7 4" />
                        </svg>
                        <div className={`${styles.avatarCircle} ${user.avatarClass}`}>{user.avatar}</div>
                    </div>
                    <div className={styles.profileInfo}>
                        <span className={styles.handle}>{user.handle}</span>
                        <div className={styles.badge}>{user.badge}</div>
                    </div>
                </div>
                <p className={styles.captionText}>{post.caption}</p>
                <div className={styles.tagPills}>
                    {post.hashtags.map(h => <span key={h} className={styles.pill}>{h}</span>)}
                </div>
            </div>

            {/* Breath Bar */}
            <div className={styles.breathBar}>
                <div className={styles.breathFill} />
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════
//  USER PROFILE SHEET
// ════════════════════════════════════════════════════════
function ProfileSheet({ user, onClose }: { user: User; onClose: () => void }) {
    return (
        <>
            <div className={styles.overlay} onClick={onClose} />
            <div className={styles.profileSheet}>
                <div className={styles.sheetHandle} />
                <div className={styles.sheetProfile}>
                    <div className={styles.auraAvatarWrap}>
                        <AuraCanvas dosha={user.dosha} />
                    </div>
                    <div>
                        <div className={styles.sheetName}>{user.displayName}</div>
                        <div className={styles.sheetHandle}>{user.handle}</div>
                    </div>
                    <div className={styles.sheetRoles}>
                        {user.roles.map(r => (
                            <span key={r.label} className={`${styles.roleChip} ${r.chip}`}>{r.label}</span>
                        ))}
                    </div>
                </div>
                <p className={styles.sheetBio}>{user.bio}</p>
                <div className={styles.sheetStats}>
                    <div className={styles.statBox}>
                        <span className={styles.statVal}>{user.resonances.toLocaleString()}</span>
                        <span className={styles.statLbl}>Resonances</span>
                    </div>
                    <div className={styles.statBox}>
                        <span className={styles.statVal}>{user.seeds.toLocaleString()}</span>
                        <span className={styles.statLbl}>Seeds</span>
                    </div>
                    <div className={styles.statBox}>
                        <span className={styles.statVal}>{user.days}</span>
                        <span className={styles.statLbl}>Day Streak</span>
                    </div>
                </div>
                <button className={styles.resonateBtn}>🕉️ &nbsp;Send Resonance</button>
            </div>
        </>
    );
}

// ════════════════════════════════════════════════════════
//  MAIN PAGE
// ════════════════════════════════════════════════════════
export default function PranaVersePage() {
    const router = useRouter();

    const handleUserClick = useCallback((id: number) => {
        router.push(`/pranaverse/user/${id}`);
    }, [router]);

    return (
        <div className={styles.feed}>
            <div className={styles.snapScroll}>
                {POSTS.map(post => (
                    <PostCard key={post.id} post={post} onUserClick={handleUserClick} />
                ))}
            </div>
        </div>
    );
}
