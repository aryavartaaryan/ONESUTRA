'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

// ── Vedic Panchang computation ─────────────────────────────────────────────────
const TITHI = ['Pratipada', 'Dvitīyā', 'Tṛtīyā', 'Caturthī', 'Pañcamī', 'Ṣaṣṭhī', 'Saptamī', 'Aṣṭamī', 'Navamī', 'Daśamī', 'Ekādaśī', 'Dvādaśī', 'Trayodaśī', 'Caturdaśī', 'Paurṇimā / Amāvāsyā'];
const TITHI_HI = ['प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पञ्चमी', 'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी', 'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'पूर्णिमा / अमावस्या'];
const PAKSHA = ['Śukla Pakṣa', 'Kṛṣṇa Pakṣa'];
const PAKSHA_HI = ['शुक्ल पक्ष', 'कृष्ण पक्ष'];
const MASA = ['Caitra', 'Vaiśākha', 'Jyeṣṭha', 'Āṣāḍha', 'Śrāvaṇa', 'Bhādrapada', 'Āśvina', 'Kārtika', 'Mārgaśīrṣa', 'Pauṣa', 'Māgha', 'Phālguna'];
const MASA_HI = ['चैत्र', 'वैशाख', 'ज्येष्ठ', 'आषाढ', 'श्रावण', 'भाद्रपद', 'आश्विन', 'कार्तिक', 'मार्गशीर्ष', 'पौष', 'माघ', 'फाल्गुन'];
const VARA = ['Ravivāra', 'Somavāra', 'Maṅgalavāra', 'Budhavāra', 'Guruvāra', 'Śukravāra', 'Śanivāra'];
const VARA_HI = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];

function getPanchang(date: Date) {
    const newMoon = new Date('2000-01-06T18:14:00Z').getTime();
    const lunation = 29.53058867 * 86400000;
    const age = ((date.getTime() - newMoon) % lunation + lunation) % lunation;
    const ageIdx = Math.floor((age / lunation) * 30);
    const paksha = ageIdx < 15 ? 0 : 1;
    let tithiIdx = ageIdx % 15;
    let tithi = TITHI[tithiIdx];
    let tithiHi = TITHI_HI[tithiIdx];
    if (tithiIdx === 14) { tithi = paksha === 0 ? 'Paurṇimā' : 'Amāvāsyā'; tithiHi = paksha === 0 ? 'पूर्णिमा' : 'अमावस्या'; }
    const masaIdx = Math.floor((age / lunation * 12)) % 12;
    const vara = date.getDay();
    return { tithi, tithiHi, paksha: PAKSHA[paksha], pakshaHi: PAKSHA_HI[paksha], masa: MASA[masaIdx], masaHi: MASA_HI[masaIdx], vara: VARA[vara], varaHi: VARA_HI[vara] };
}

interface Festival { name: string; nameHi: string; emoji: string; description: string; color: string; }
function getTodayFestival(date: Date): Festival | null {
    const m = date.getMonth() + 1; const d = date.getDate();
    const FESTIVALS: { m: number; d: number; fest: Festival }[] = [
        { m: 1, d: 14, fest: { name: 'Makar Saṅkrānti', nameHi: 'मकर संक्रांति', emoji: '🌤️', description: 'The sun enters Capricorn — a day of light, harvest and new beginnings.', color: '255,165,30' } },
        { m: 2, d: 14, fest: { name: 'Vasanta Pañcamī', nameHi: 'वसंत पंचमी', emoji: '🌸', description: 'The goddess Sarasvatī is worshipped — invoke wisdom and the arts today.', color: '255,220,80' } },
        { m: 2, d: 26, fest: { name: 'Mahāśivarātri', nameHi: 'महाशिवरात्रि', emoji: '🕉️', description: 'The great night of Śiva — meditation, devotion and inner transformation.', color: '140,100,255' } },
        { m: 3, d: 14, fest: { name: 'Holī', nameHi: 'होली', emoji: '🎨', description: 'The festival of colours — celebrating the victory of devotion over ego.', color: '255,80,180' } },
        { m: 3, d: 25, fest: { name: 'Gudi Pādvā / Ugādi', nameHi: 'गुड़ी पड़वा', emoji: '🌅', description: 'Vedic New Year — the sky, the earth and your spirit begin fresh today.', color: '90,210,150' } },
        { m: 4, d: 6, fest: { name: 'Rāma Navamī', nameHi: 'राम नवमी', emoji: '🏹', description: 'Birthday of Śrī Rāma — the ideal of dharma, courage and compassion.', color: '255,140,30' } },
        { m: 5, d: 12, fest: { name: 'Akṣaya Tṛtīyā', nameHi: 'अक्षय तृतीया', emoji: '✨', description: 'The inexhaustible third — all auspicious actions begun today endure.', color: '255,200,60' } },
        { m: 7, d: 10, fest: { name: 'Guru Pūrṇimā', nameHi: 'गुरु पूर्णिमा', emoji: '🙏', description: 'Full moon of the Guru — honour all teachers who lit the path for you.', color: '255,200,100' } },
        { m: 8, d: 16, fest: { name: 'Rakṣā Bandhana', nameHi: 'रक्षा बंधन', emoji: '🪢', description: 'The sacred thread of protection — the bond of love between siblings.', color: '255,140,180' } },
        { m: 8, d: 20, fest: { name: 'Janmāṣṭamī', nameHi: 'जन्माष्टमी', emoji: '🦚', description: 'The birth of Śrī Kṛṣṇa — the divine playfulness and infinite love.', color: '80,160,255' } },
        { m: 10, d: 20, fest: { name: 'Dīpāvalī', nameHi: 'दीपावली', emoji: '🪔', description: 'The festival of lights — every lamp lit is a victory over inner darkness.', color: '255,200,60' } },
    ];
    return FESTIVALS.find(f => f.m === m && f.d === d)?.fest ?? null;
}

type WisdomItem = { id: string; sanskrit: string; transliteration: string; meaning: string; emoji: string; bg: string; };
const FALLBACK_WISDOM: WisdomItem[] = [
    { id: 'f1', sanskrit: 'ॐ नमः शिवाय', transliteration: 'Om Namah Shivaya', meaning: 'I bow to Shiva, the auspicious inner self.', emoji: '🔱', bg: 'linear-gradient(135deg,rgba(155,140,255,0.35),rgba(88,28,135,0.55))' },
    { id: 'f2', sanskrit: 'ॐ गं गणपतये नमः', transliteration: 'Om Gam Ganapataye Namah', meaning: 'Salutations to Ganesha, remover of obstacles.', emoji: '🐘', bg: 'linear-gradient(135deg,rgba(214,141,58,0.35),rgba(120,53,15,0.55))' },
    { id: 'f3', sanskrit: 'हरे राम हरे राम', transliteration: 'Hare Rama Hare Rama', meaning: 'Invoke Rama for joy, dharma and calmness.', emoji: '🪔', bg: 'linear-gradient(135deg,rgba(255,175,95,0.35),rgba(180,60,10,0.55))' },
    { id: 'f4', sanskrit: 'हरे कृष्ण हरे कृष्ण', transliteration: 'Hare Krishna Hare Krishna', meaning: 'Chant Krishna naam for devotion and bliss.', emoji: '🦚', bg: 'linear-gradient(135deg,rgba(100,216,203,0.35),rgba(6,78,59,0.55))' },
    { id: 'f5', sanskrit: 'गायत्री मन्त्र', transliteration: 'Om Bhur Bhuvah Svaha', meaning: 'May divine light awaken our intellect.', emoji: '☀️', bg: 'linear-gradient(135deg,rgba(251,191,36,0.35),rgba(120,80,0,0.55))' },
    { id: 'f6', sanskrit: 'लोकाः समस्ताः सुखिनो भवन्तु', transliteration: 'Lokah Samastah Sukhino Bhavantu', meaning: 'May all beings everywhere be happy and free.', emoji: '🌍', bg: 'linear-gradient(135deg,rgba(90,200,130,0.35),rgba(6,78,59,0.55))' },
    { id: 'f7', sanskrit: 'ॐ त्र्यम्बकं यजामहे', transliteration: 'Maha Mrityunjaya Mantra', meaning: 'Healing, protection and fearless life force.', emoji: '🌿', bg: 'linear-gradient(135deg,rgba(120,198,255,0.35),rgba(30,58,138,0.55))' },
];

const MANTRA_DECOR = [
    { emoji: '🔱', bg: 'linear-gradient(135deg,rgba(155,140,255,0.35),rgba(88,28,135,0.55))' },
    { emoji: '🪔', bg: 'linear-gradient(135deg,rgba(255,175,95,0.35),rgba(180,60,10,0.55))' },
    { emoji: '🦚', bg: 'linear-gradient(135deg,rgba(100,216,203,0.35),rgba(6,78,59,0.55))' },
    { emoji: '☀️', bg: 'linear-gradient(135deg,rgba(251,191,36,0.35),rgba(120,80,0,0.55))' },
    { emoji: '🌿', bg: 'linear-gradient(135deg,rgba(120,198,255,0.35),rgba(30,58,138,0.55))' },
    { emoji: '✨', bg: 'linear-gradient(135deg,rgba(255,130,190,0.35),rgba(131,24,67,0.55))' },
    { emoji: '🙏', bg: 'linear-gradient(135deg,rgba(90,200,130,0.35),rgba(6,78,59,0.55))' },
    { emoji: '🕉️', bg: 'linear-gradient(135deg,rgba(214,141,58,0.35),rgba(120,53,15,0.55))' },
];

// ── Story data shape ───────────────────────────────────────────────────────────
interface Story {
    id: string;
    bubbleEmoji: string;
    bubbleLabel: string;
    gradientRing: string; // gradient for the ring
    content: React.ReactNode;
    bgGradient: string; // full-screen story background
}

// ── Story Bubble component ─────────────────────────────────────────────────────
function StoryBubble({ story, index, isViewed, onClick }: {
    story: Story; index: number; isViewed: boolean; onClick: () => void;
}) {
    return (
        <motion.button
            onClick={onClick}
            initial={{ opacity: 0, scale: 0.7, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            whileTap={{ scale: 0.90 }}
            style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.30rem',
                background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem 0.1rem',
                flexShrink: 0, minWidth: 64,
            }}
            aria-label={`Open ${story.bubbleLabel} story`}
        >
            {/* Ring + Avatar */}
            <div style={{
                padding: isViewed ? 2.5 : 2.5,
                borderRadius: '50%',
                background: isViewed
                    ? 'rgba(255,255,255,0.12)'
                    : story.gradientRing,
                boxShadow: isViewed ? 'none' : `0 0 14px rgba(251,191,36,0.40)`,
                transition: 'all 0.4s ease',
            }}>
                {/* Inner white gap ring */}
                <div style={{
                    padding: 2,
                    borderRadius: '50%',
                    background: 'rgba(8,6,20,0.95)',
                }}>
                    <motion.div
                        animate={isViewed ? {} : { boxShadow: ['0 0 0 0 transparent', `0 0 18px rgba(251,191,36,0.55)`, '0 0 0 0 transparent'] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: index * 0.3 }}
                        style={{
                            width: 52, height: 52, borderRadius: '50%',
                            background: isViewed ? 'rgba(255,255,255,0.06)' : story.bgGradient,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.55rem',
                            filter: isViewed ? 'grayscale(0.7) brightness(0.6)' : 'none',
                        }}
                    >
                        {story.bubbleEmoji}
                    </motion.div>
                </div>
            </div>

            {/* Label */}
            <span style={{
                fontSize: '0.46rem', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: isViewed ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.72)',
                fontFamily: 'monospace', textAlign: 'center', lineHeight: 1.2,
                maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
                {story.bubbleLabel}
            </span>
        </motion.button>
    );
}

// ── Full-Screen Story Viewer ───────────────────────────────────────────────────
function StoryViewer({
    stories, startIndex, onClose,
}: {
    stories: Story[]; startIndex: number; onClose: (viewedUpTo: number) => void;
}) {
    const [current, setCurrent] = useState(startIndex);
    const [progress, setProgress] = useState(0);
    const [paused, setPaused] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const STORY_DURATION = 5000; // 5 seconds per story
    const TICK = 50;

    const goNext = useCallback(() => {
        if (current < stories.length - 1) {
            setCurrent(c => c + 1);
            setProgress(0);
        } else {
            onClose(stories.length - 1);
        }
    }, [current, stories.length, onClose]);

    const goPrev = useCallback(() => {
        if (current > 0) { setCurrent(c => c - 1); setProgress(0); }
    }, [current]);

    useEffect(() => {
        setProgress(0);
    }, [current]);

    useEffect(() => {
        if (paused) return;
        intervalRef.current = setInterval(() => {
            setProgress(p => {
                if (p >= 100) { goNext(); return 0; }
                return p + (TICK / STORY_DURATION) * 100;
            });
        }, TICK);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [paused, current, goNext]);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose(current);
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [current, goNext, goPrev, onClose]);

    const story = stories[current];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{
                position: 'fixed', inset: 0, zIndex: 9100,
                background: 'rgba(0,0,0,0.94)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={() => onClose(current)}
        >
            {/* Story Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={story.id}
                    initial={{ opacity: 0, scale: 0.94, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.04, y: -16 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    onClick={e => e.stopPropagation()}
                    style={{
                        position: 'relative',
                        width: 'min(420px, 94vw)',
                        height: 'min(700px, 88vh)',
                        borderRadius: 24,
                        overflow: 'hidden',
                        background: story.bgGradient,
                        boxShadow: '0 32px 80px rgba(0,0,0,0.80)',
                    }}
                >
                    {/* Background gradient overlay */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 30%, transparent 60%, rgba(0,0,0,0.70) 100%)',
                        zIndex: 1,
                    }} />

                    {/* ── Progress bars ── */}
                    <div style={{
                        position: 'absolute', top: 14, left: 14, right: 14,
                        display: 'flex', gap: 4, zIndex: 10,
                    }}>
                        {stories.map((s, i) => (
                            <div key={s.id} style={{
                                flex: 1, height: 2.5, borderRadius: 999,
                                background: 'rgba(255,255,255,0.22)',
                                overflow: 'hidden',
                            }}>
                                <motion.div
                                    style={{
                                        height: '100%', borderRadius: 999,
                                        background: 'rgba(255,255,255,0.92)',
                                    }}
                                    animate={{ width: i < current ? '100%' : i === current ? `${progress}%` : '0%' }}
                                    transition={{ duration: i === current ? 0 : 0.15 }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* ── Header row ── */}
                    <div style={{
                        position: 'absolute', top: 28, left: 16, right: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        zIndex: 10,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: story.bgGradient,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1rem', border: '2px solid rgba(255,255,255,0.35)',
                            }}>
                                {story.bubbleEmoji}
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.60rem', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
                                    {story.bubbleLabel}
                                </p>
                                <p style={{ margin: 0, fontSize: '0.44rem', color: 'rgba(255,255,255,0.50)', fontFamily: 'monospace', letterSpacing: '0.12em' }}>
                                    OneSUTRA · Daily Insight
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => onClose(current)}
                            style={{
                                background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.20)',
                                borderRadius: '50%', width: 30, height: 30,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: '#fff',
                            }}
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {/* ── Story content ── */}
                    <div style={{
                        position: 'absolute', inset: 0, zIndex: 5,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        padding: '5rem 1.8rem 3.5rem',
                    }}>
                        {story.content}
                    </div>

                    {/* ── Tap zones (left = prev, right = next) ── */}
                    <div
                        onClick={goPrev}
                        onMouseEnter={() => setPaused(true)}
                        onMouseLeave={() => setPaused(false)}
                        style={{ position: 'absolute', top: 0, left: 0, width: '35%', height: '100%', zIndex: 8, cursor: 'pointer' }}
                    />
                    <div
                        onClick={goNext}
                        onMouseEnter={() => setPaused(true)}
                        onMouseLeave={() => setPaused(false)}
                        style={{ position: 'absolute', top: 0, right: 0, width: '65%', height: '100%', zIndex: 8, cursor: 'pointer' }}
                    />

                    {/* Story counter bottom */}
                    <div style={{
                        position: 'absolute', bottom: 18, left: 0, right: 0,
                        display: 'flex', justifyContent: 'center', zIndex: 10,
                    }}>
                        <span style={{
                            fontSize: '0.46rem', color: 'rgba(255,255,255,0.40)',
                            fontFamily: 'monospace', letterSpacing: '0.18em',
                        }}>
                            {current + 1} / {stories.length}
                        </span>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Prev / Next Story nav dots */}
            {current > 0 && (
                <button onClick={e => { e.stopPropagation(); goPrev(); }} style={{
                    position: 'absolute', left: 'clamp(8px,3vw,28px)', top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: '50%', width: 36, height: 36,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', cursor: 'pointer', fontSize: '1.1rem', zIndex: 9200,
                }}>‹</button>
            )}
            {current < stories.length - 1 && (
                <button onClick={e => { e.stopPropagation(); goNext(); }} style={{
                    position: 'absolute', right: 'clamp(8px,3vw,28px)', top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: '50%', width: 36, height: 36,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', cursor: 'pointer', fontSize: '1.1rem', zIndex: 9200,
                }}>›</button>
            )}
        </motion.div>
    );
}

// ── Build story slides from data ───────────────────────────────────────────────
function buildPanchangStory(festival: Festival | null): Story {
    const today = new Date();
    const p = getPanchang(today);
    const dateStr = today.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

    return {
        id: 'panchang',
        bubbleEmoji: festival ? festival.emoji : '🌙',
        bubbleLabel: festival ? festival.name.split('/')[0].trim().slice(0, 8) : 'Panchang',
        gradientRing: 'conic-gradient(#fbbf24, #f97316, #ec4899, #a855f7, #3b82f6, #fbbf24)',
        bgGradient: festival
            ? `linear-gradient(160deg, rgba(${festival.color},0.55) 0%, rgba(10,5,30,0.95) 100%)`
            : 'linear-gradient(160deg,rgba(120,53,15,0.60),rgba(10,5,30,0.95))',
        content: (
            <div style={{ textAlign: 'center', width: '100%' }}>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <p style={{ margin: '0 0 0.35rem', fontSize: '0.46rem', letterSpacing: '0.28em', fontFamily: 'monospace', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(251,191,36,0.80)' }}>
                        ✦ Pañcāṅga · {dateStr}
                    </p>
                </motion.div>
                {festival && (
                    <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
                        style={{ marginBottom: '1rem', background: `rgba(${festival.color},0.18)`, border: `1px solid rgba(${festival.color},0.45)`, borderRadius: 14, padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '1.4rem' }}>{festival.emoji}</span>
                        <div style={{ textAlign: 'left' }}>
                            <p style={{ margin: 0, fontSize: '0.46rem', color: `rgba(${festival.color},0.85)`, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'monospace' }}>Today · Festival</p>
                            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display', Georgia, serif" }}>{festival.name}</p>
                        </div>
                    </motion.div>
                )}
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    style={{ margin: '0 0 1rem', fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(1.2rem,4vw,1.5rem)', fontWeight: 700, color: '#fff', lineHeight: 1.2, textShadow: '0 2px 20px rgba(251,191,36,0.50)' }}>
                    {p.pakshaHi} · {p.tithiHi}
                </motion.p>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.32rem', alignItems: 'center' }}>
                    {[
                        { label: 'Vāra', value: p.vara, hi: p.varaHi },
                        { label: 'Tithi', value: p.tithi, hi: p.tithiHi },
                        { label: 'Pakṣa', value: p.paksha, hi: p.pakshaHi },
                        { label: 'Māsa', value: p.masa, hi: p.masaHi },
                    ].map(row => (
                        <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '0.28rem 0.8rem', width: '100%', maxWidth: 280 }}>
                            <span style={{ width: 36, flexShrink: 0, fontSize: '0.42rem', letterSpacing: '0.14em', fontFamily: 'monospace', textTransform: 'uppercase', color: 'rgba(251,191,36,0.55)' }}>{row.label}</span>
                            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.80)', fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic' }}>{row.value}</span>
                            <span style={{ fontSize: '0.58rem', color: 'rgba(251,191,36,0.55)', fontFamily: 'monospace', marginLeft: 'auto' }}>{row.hi}</span>
                        </div>
                    ))}
                </motion.div>
                {festival && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
                        style={{ margin: '1rem 0 0', fontSize: '0.66rem', color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', lineHeight: 1.6 }}>
                        {festival.description}
                    </motion.p>
                )}
            </div>
        ),
    };
}

function buildWisdomStory(card: WisdomItem, index: number): Story {
    const rings = [
        'conic-gradient(#a855f7,#ec4899,#f97316,#a855f7)',
        'conic-gradient(#3b82f6,#06b6d4,#10b981,#3b82f6)',
        'conic-gradient(#f59e0b,#ef4444,#ec4899,#f59e0b)',
        'conic-gradient(#14b8a6,#6366f1,#8b5cf6,#14b8a6)',
        'conic-gradient(#f97316,#fbbf24,#a3e635,#f97316)',
        'conic-gradient(#ec4899,#a855f7,#6366f1,#ec4899)',
        'conic-gradient(#10b981,#06b6d4,#3b82f6,#10b981)',
    ];
    const labels = ['Om Shiva', 'Ganesh', 'Rama Nam', 'Krishna', 'Gayatri', 'Lokah', 'Mrityunjaya'];

    return {
        id: card.id,
        bubbleEmoji: card.emoji,
        bubbleLabel: labels[index % labels.length],
        gradientRing: rings[index % rings.length],
        bgGradient: card.bg,
        content: (
            <div style={{ textAlign: 'center', width: '100%' }}>
                <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                    style={{ fontSize: '3.5rem', display: 'block', marginBottom: '1.2rem', filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.40))' }}>
                    {card.emoji}
                </motion.span>
                <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
                    style={{ margin: '0 0 0.5rem', fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(1.0rem,3.5vw,1.35rem)', fontWeight: 700, color: '#fff', lineHeight: 1.25, textShadow: '0 2px 20px rgba(0,0,0,0.80)' }}>
                    {card.sanskrit}
                </motion.p>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.26 }}
                    style={{ margin: '0 0 1.2rem', fontSize: '0.52rem', letterSpacing: '0.18em', fontFamily: 'monospace', color: 'rgba(251,191,36,0.85)', textTransform: 'uppercase' }}>
                    {card.transliteration}
                </motion.p>
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(12px)', borderRadius: 16, padding: '0.9rem 1.2rem', border: '1px solid rgba(255,255,255,0.10)' }}>
                    <p style={{ margin: 0, fontSize: 'clamp(0.68rem,2.2vw,0.82rem)', color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, fontStyle: 'italic' }}>
                        {card.meaning}
                    </p>
                </motion.div>
            </div>
        ),
    };
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function DailyInsightsCarousel() {
    const today = new Date();
    const festival = getTodayFestival(today);
    const [wisdomCards, setWisdomCards] = useState<WisdomItem[]>(FALLBACK_WISDOM);
    const [viewedStories, setViewedStories] = useState<Set<number>>(new Set());
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    // Build all stories
    const panchangStory = buildPanchangStory(festival);
    const wisdomStories = wisdomCards.map((c, i) => buildWisdomStory(c, i));
    const allStories: Story[] = [panchangStory, ...wisdomStories];

    // Fetch live mantras
    useEffect(() => {
        let active = true;
        const fetchMantras = async () => {
            try {
                const res = await fetch('/api/mantra?count=7', { cache: 'no-store' });
                if (!res.ok) return;
                const data = await res.json();
                const items = Array.isArray(data?.items) ? data.items : [data];
                const mapped: WisdomItem[] = items.map((item: unknown, idx: number) => {
                    const row = (item && typeof item === 'object') ? item as Record<string, unknown> : {};
                    const decor = MANTRA_DECOR[idx % MANTRA_DECOR.length];
                    const sanskrit = String(row.sanskrit || '').trim();
                    const meaning = String(row.meaning || '').trim();
                    if (!sanskrit) return null;
                    return { id: `live-${idx}`, sanskrit, transliteration: String(row.deity || `Verse ${idx + 1}`), meaning: meaning || 'Translation unavailable.', emoji: decor.emoji, bg: decor.bg };
                }).filter(Boolean) as WisdomItem[];
                if (active && mapped.length > 0) setWisdomCards(mapped);
            } catch { /* silent fallback */ }
        };
        fetchMantras();
        return () => { active = false; };
    }, []);

    const handleBubbleClick = (index: number) => setOpenIndex(index);
    const handleClose = (viewedUpTo: number) => {
        setViewedStories(prev => {
            const next = new Set(prev);
            // Mark as viewed up to viewedUpTo (the story index in allStories)
            next.add(openIndex ?? 0);
            return next;
        });
        setOpenIndex(null);
    };

    return (
        <>
            {/* ── Instagram Stories Bubbles Strip ── */}
            <section aria-label="Daily Insights Stories" style={{ padding: '0.3rem 0 0.2rem' }}>
                {/* Header row */}
                <div style={{ paddingLeft: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.45rem', letterSpacing: '0.28em', fontFamily: 'monospace', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(251,191,36,0.55)' }}>
                        ✦ Daily Insights
                    </span>
                    {festival && (
                        <motion.span initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                            style={{ fontSize: '0.44rem', letterSpacing: '0.12em', fontFamily: 'monospace', color: `rgba(${festival.color},0.85)`, background: `rgba(${festival.color},0.12)`, border: `1px solid rgba(${festival.color},0.28)`, borderRadius: 999, padding: '0.12rem 0.45rem', textTransform: 'uppercase' }}>
                            {festival.emoji} {festival.name}
                        </motion.span>
                    )}
                </div>

                {/* Bubbles row */}
                <div style={{
                    display: 'flex', gap: '0.1rem', overflowX: 'auto', paddingLeft: '0.75rem', paddingRight: '0.75rem',
                    paddingBottom: '0.4rem', WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory',
                    msOverflowStyle: 'none', scrollbarWidth: 'none',
                }}>
                    {allStories.map((story, i) => (
                        <StoryBubble
                            key={story.id}
                            story={story}
                            index={i}
                            isViewed={viewedStories.has(i)}
                            onClick={() => handleBubbleClick(i)}
                        />
                    ))}
                </div>
            </section>

            {/* ── Full-screen Story Viewer ── */}
            <AnimatePresence>
                {openIndex !== null && (
                    <StoryViewer
                        stories={allStories}
                        startIndex={openIndex}
                        onClose={handleClose}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
