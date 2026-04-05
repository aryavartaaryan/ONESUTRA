'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Play, Pause, RotateCcw, CheckCircle2, Flame, Plus, Trophy } from 'lucide-react';
import { useLifestyleEngine } from '@/hooks/useLifestyleEngine';
import { getToday } from '@/stores/lifestyleStore';

// ─── Mantra Library ─────────────────────────────────────────────────────────────

interface MantraItem {
    id: string;
    name: string;
    deity?: string;
    text: string;
    transliteration: string;
    meaning: string;
    benefit: string;
    color: string;
    icon: string;
    standardMala: number;
    category: 'universal' | 'healing' | 'abundance' | 'protection' | 'liberation' | 'devotional' | 'shakti' | 'mantra_yoga';
    audioNote?: string;
    challengeDays: 40 | 48 | 100;
}

const MANTRAS: MantraItem[] = [
    {
        id: 'om',
        name: 'Om / Aum',
        text: 'ॐ',
        transliteration: 'Om',
        meaning: 'The primordial sound — the vibration of the universe',
        benefit: 'All-pervading calm, presence, and alignment with the cosmos',
        color: '#fbbf24',
        icon: '🔱',
        standardMala: 108,
        category: 'universal',
        challengeDays: 40,
        audioNote: 'Chant a single, long sustained vowel: A-U-M',
    },
    {
        id: 'gayatri',
        name: 'Gayatri Mantra',
        deity: 'Savitri (Solar Intelligence)',
        text: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्',
        transliteration: 'Om Bhur Bhuvaḥ Svaḥ Tat Savitur Vareṇyaṃ Bhargo Devasya Dhīmahi Dhiyo Yo Naḥ Pracodayāt',
        meaning: 'We meditate upon the divine radiance of the Sun — may it illuminate our intellect',
        benefit: 'Awakens intelligence, purifies the mind, connects to the Sun\'s wisdom',
        color: '#f97316',
        icon: '☀️',
        standardMala: 108,
        category: 'universal',
        challengeDays: 40,
        audioNote: 'Most powerful at sunrise. Count with your right hand on a mala.',
    },
    {
        id: 'maha_mrityunjaya',
        name: 'Maha Mrityunjaya',
        deity: 'Shiva',
        text: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय माऽमृतात्',
        transliteration: 'Om Tryambakaṃ Yajāmahe Sugandhiṃ Puṣṭivardhanam Urvārukamiva Bandhanān Mṛtyormukṣīya Māmṛtāt',
        meaning: 'We worship the three-eyed Shiva — free us from death\'s bondage into liberation',
        benefit: 'Healing, protection, overcoming fear and illness, liberation from suffering',
        color: '#a78bfa',
        icon: '🕉️',
        standardMala: 108,
        category: 'healing',
        challengeDays: 40,
        audioNote: 'Chant 11 or 108 times daily. Highly effective during illness and transitions.',
    },
    {
        id: 'om_namah_shivaya',
        name: 'Om Namah Shivaya',
        deity: 'Shiva',
        text: 'ॐ नमः शिवाय',
        transliteration: 'Om Namaḥ Śivāya',
        meaning: 'Salutation to Shiva — the auspicious, the destroyer of ego',
        benefit: 'Inner transformation, ego dissolution, deep peace and surrender',
        color: '#818cf8',
        icon: '⛰️',
        standardMala: 108,
        category: 'devotional',
        challengeDays: 40,
        audioNote: 'The five syllables Na-Ma-Shi-Va-Ya correspond to the five elements.',
    },
    {
        id: 'soham',
        name: 'So\'Ham',
        text: 'सोऽहम्',
        transliteration: 'So\'Ham',
        meaning: '"I am That" — the identity of the individual self with the universal self',
        benefit: 'Self-realisation, dissolving the separation between self and consciousness',
        color: '#22d3ee',
        icon: '∞',
        standardMala: 108,
        category: 'liberation',
        challengeDays: 40,
        audioNote: '"So" is the sound of the inhale. "Ham" is the sound of the exhale. Breathe with it.',
    },
    {
        id: 'om_shri_ganeshaya',
        name: 'Om Shri Ganeshaya Namah',
        deity: 'Ganesha',
        text: 'ॐ श्री गणेशाय नमः',
        transliteration: 'Om Śrī Gaṇeśāya Namaḥ',
        meaning: 'Salutation to Ganesha, remover of obstacles',
        benefit: 'Clears obstacles from new beginnings, bestows wisdom and auspicious start',
        color: '#fde68a',
        icon: '🐘',
        standardMala: 108,
        category: 'abundance',
        challengeDays: 40,
        audioNote: 'Chant at the beginning of any new endeavour — new project, new month, new day.',
    },
    {
        id: 'lokah_samastah',
        name: 'Lokah Samastah',
        text: 'लोकाः समस्ताः सुखिनो भवन्तु',
        transliteration: 'Lokāḥ Samastāḥ Sukhino Bhavantu',
        meaning: 'May all beings everywhere be happy and free',
        benefit: 'Cultivates universal compassion and opens the heart',
        color: '#4ade80',
        icon: '🌍',
        standardMala: 108,
        category: 'universal',
        challengeDays: 40,
        audioNote: 'Often used as a closing prayer in yoga practice. Feel the expansion in your chest.',
    },
    {
        id: 'aham_brahmasmi',
        name: 'Aham Brahmasmi',
        text: 'अहं ब्रह्मास्मि',
        transliteration: 'Ahaṃ Brahmāsmi',
        meaning: '"I am Brahman" — one of the four Mahavakyas (great sayings)',
        benefit: 'Direct realisation of unity consciousness, dissolving the sense of separation',
        color: '#c084fc',
        icon: '🌌',
        standardMala: 108,
        category: 'liberation',
        challengeDays: 48,
        audioNote: 'Sit in stillness after chanting. Let the silence speak.',
    },
    {
        id: 'om_sri_durgayai',
        name: 'Om Sri Durgayai Namah',
        deity: 'Durga (Divine Mother)',
        text: 'ॐ श्री दुर्गायै नमः',
        transliteration: 'Om Śrī Durgāyai Namaḥ',
        meaning: 'Salutation to Durga, the invincible divine mother',
        benefit: 'Protection, courage, strength in adversity, divine feminine power',
        color: '#f472b6',
        icon: '🔱',
        standardMala: 108,
        category: 'shakti',
        challengeDays: 40,
        audioNote: 'Especially powerful during Navratri. Channel fierce, loving protection.',
    },
    {
        id: 'om_shri_lakshmiyai',
        name: 'Om Shri Lakshmiyai Namah',
        deity: 'Lakshmi',
        text: 'ॐ श्री लक्ष्म्यै नमः',
        transliteration: 'Om Śrī Lakṣmyai Namaḥ',
        meaning: 'Salutation to Lakshmi, goddess of abundance and beauty',
        benefit: 'Attracts abundance, prosperity, harmony, and inner wealth',
        color: '#fbbf24',
        icon: '🌸',
        standardMala: 108,
        category: 'abundance',
        challengeDays: 40,
        audioNote: 'Friday is auspicious for Lakshmi mantra. Clean your space before practice.',
    },
];

const CATEGORY_COLORS: Record<string, string> = {
    universal: '#fbbf24',
    healing: '#a78bfa',
    abundance: '#4ade80',
    protection: '#f97316',
    liberation: '#22d3ee',
    devotional: '#818cf8',
    shakti: '#f472b6',
    mantra_yoga: '#c084fc',
};

const MALA_COUNT = 108;

// ─── Mala Counter Component ─────────────────────────────────────────────────────

function MalaCounter({
    mantra, onComplete,
}: {
    mantra: MantraItem; onComplete: (malaCount: number, repCount: number, intention: string) => void;
}) {
    const [count, setCount] = useState(0);
    const [malasDone, setMalasDone] = useState(0);
    const [intention, setIntention] = useState('');
    const [showIntention, setShowIntention] = useState(true);
    const [showComplete, setShowComplete] = useState(false);
    const [vibrateFn, setVibrateFn] = useState<(() => void) | null>(null);

    useEffect(() => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            setVibrateFn(() => () => navigator.vibrate(20));
        }
    }, []);

    const handleBead = useCallback(() => {
        vibrateFn?.();
        setCount(c => {
            const next = c + 1;
            if (next >= MALA_COUNT) {
                setMalasDone(m => m + 1);
                setTimeout(() => setCount(0), 200);
                return MALA_COUNT;
            }
            return next;
        });
    }, [vibrateFn]);

    const totalReps = malasDone * MALA_COUNT + count;
    const progress = (count / MALA_COUNT) * 100;

    if (showIntention) {
        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '1rem 0' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '2.5rem' }}>{mantra.icon}</span>
                    <h3 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1.1rem', fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>{mantra.name}</h3>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif" }}>Set an intention before you begin</p>
                </div>
                <div style={{
                    padding: '1rem',
                    borderRadius: 16,
                    background: `${mantra.color}10`,
                    border: `1px solid ${mantra.color}30`,
                    marginBottom: '1.25rem',
                }}>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 800, color: mantra.color, fontFamily: "'Outfit', sans-serif", textAlign: 'center', letterSpacing: '0.02em' }}>{mantra.text}</p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif", textAlign: 'center', fontStyle: 'italic' }}>{mantra.transliteration}</p>
                </div>
                <textarea
                    placeholder="My intention for this practice... (optional)"
                    value={intention}
                    onChange={e => setIntention(e.target.value)}
                    rows={3}
                    style={{
                        width: '100%', padding: '0.8rem', borderRadius: 12,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff', fontSize: '0.85rem', fontFamily: "'Outfit', sans-serif",
                        resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: '1.25rem',
                    }}
                />
                <motion.button whileTap={{ scale: 0.96 }}
                    onClick={() => setShowIntention(false)}
                    style={{
                        width: '100%', padding: '0.9rem', borderRadius: 14,
                        background: `linear-gradient(135deg, ${mantra.color}, ${mantra.color}88)`,
                        border: 'none', color: '#000', fontWeight: 800, fontSize: '0.9rem',
                        fontFamily: "'Outfit', sans-serif", cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    }}>
                    <Play size={16} style={{ marginLeft: 2 }} /> Begin Japa
                </motion.button>
            </motion.div>
        );
    }

    if (showComplete) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6 }}
                    style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🙏</motion.div>
                <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.2rem', fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>Japa Complete</h3>
                <p style={{ margin: '0 0 0.25rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontFamily: "'Outfit', sans-serif" }}>{totalReps} repetitions · {malasDone} mala{malasDone !== 1 ? 's' : ''}</p>
                {intention && (
                    <p style={{ margin: '0 0 1.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", fontStyle: 'italic' }}>Intention: {intention}</p>
                )}
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>Sit in stillness for a moment — let the vibration settle.</p>
                <motion.button whileTap={{ scale: 0.96 }}
                    onClick={() => onComplete(malasDone, totalReps, intention)}
                    style={{
                        marginTop: '1.5rem', width: '100%', padding: '0.9rem', borderRadius: 14,
                        background: `linear-gradient(135deg, ${mantra.color}, ${mantra.color}88)`,
                        border: 'none', color: '#000', fontWeight: 800, fontSize: '0.9rem',
                        fontFamily: "'Outfit', sans-serif", cursor: 'pointer',
                    }}>
                    Save Practice ✓
                </motion.button>
            </motion.div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            {/* Mala progress ring */}
            <div style={{ position: 'relative' }}>
                <svg width={220} height={220} style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx={110} cy={110} r={95} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
                    <motion.circle
                        cx={110} cy={110} r={95} fill="none"
                        stroke={mantra.color} strokeWidth={8} strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 95}
                        animate={{ strokeDashoffset: 2 * Math.PI * 95 * (1 - progress / 100) }}
                        transition={{ duration: 0.15 }}
                        style={{ filter: `drop-shadow(0 0 8px ${mantra.color}88)` }}
                    />
                </svg>
                {/* Tap button */}
                <motion.button
                    whileTap={{ scale: 0.93 }}
                    onClick={handleBead}
                    style={{
                        position: 'absolute', inset: 0,
                        borderRadius: '50%',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                    }}
                >
                    <span style={{ fontSize: '1.8rem', transform: 'rotate(90deg)' }}>{mantra.icon}</span>
                    <p style={{ margin: 0, fontSize: '2.2rem', fontWeight: 900, color: '#fff', fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>{count}</p>
                    <p style={{ margin: 0, fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.1em' }}>TAP EACH BEAD</p>
                </motion.button>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '1.5rem', textAlign: 'center' }}>
                <div>
                    <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: mantra.color, fontFamily: "'Outfit', sans-serif" }}>{malasDone}</p>
                    <p style={{ margin: 0, fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>Malas</p>
                </div>
                <div>
                    <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>{totalReps}</p>
                    <p style={{ margin: 0, fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>Total Reps</p>
                </div>
                <div>
                    <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', fontFamily: "'Outfit', sans-serif" }}>{MALA_COUNT - count}</p>
                    <p style={{ margin: 0, fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>Remaining</p>
                </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '1rem' }}>
                <motion.button whileTap={{ scale: 0.88 }}
                    onClick={() => { setCount(0); setMalasDone(0); }}
                    style={{ padding: '0.6rem 1.2rem', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: 5 }}>
                    <RotateCcw size={14} /> Reset
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }}
                    onClick={() => setShowComplete(true)}
                    disabled={totalReps === 0}
                    style={{
                        padding: '0.6rem 1.5rem', borderRadius: 12,
                        background: totalReps > 0 ? `linear-gradient(135deg, ${mantra.color}, ${mantra.color}88)` : 'rgba(255,255,255,0.06)',
                        border: 'none',
                        color: totalReps > 0 ? '#000' : 'rgba(255,255,255,0.3)',
                        cursor: totalReps > 0 ? 'pointer' : 'default',
                        fontSize: '0.8rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif",
                        display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                    <CheckCircle2 size={14} /> Done
                </motion.button>
            </div>

            {/* Mantra text reminder */}
            <div style={{
                padding: '0.75rem 1rem', borderRadius: 12,
                background: `${mantra.color}0a`, border: `1px solid ${mantra.color}22`,
                width: '100%', boxSizing: 'border-box', textAlign: 'center',
            }}>
                <p style={{ margin: '0 0 2px', fontSize: '0.9rem', color: mantra.color, fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>{mantra.text}</p>
                <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", fontStyle: 'italic' }}>{mantra.transliteration}</p>
            </div>
        </div>
    );
}

// ─── Mantra Card ────────────────────────────────────────────────────────────────

function MantraCard({ mantra, streak, onClick }: { mantra: MantraItem; streak: number; onClick: () => void }) {
    return (
        <motion.div
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            style={{
                padding: '1rem',
                borderRadius: 18,
                background: `${mantra.color}0c`,
                border: `1px solid ${mantra.color}28`,
                marginBottom: '0.65rem',
                cursor: 'pointer',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <div style={{
                    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                    background: `${mantra.color}18`, border: `1px solid ${mantra.color}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
                }}>{mantra.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'rgba(255,255,255,0.88)', fontFamily: "'Outfit', sans-serif" }}>{mantra.name}</p>
                        {streak > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.65rem', color: '#f97316', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                                🔥{streak}
                            </span>
                        )}
                    </div>
                    <p style={{ margin: '2px 0 4px', fontSize: '0.85rem', fontWeight: 700, color: mantra.color, fontFamily: "'Outfit', sans-serif" }}>{mantra.text.slice(0, 20)}{mantra.text.length > 20 ? '…' : ''}</p>
                    <p style={{ margin: 0, fontSize: '0.68rem', color: 'rgba(255,255,255,0.38)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}>{mantra.meaning.slice(0, 70)}…</p>
                </div>
            </div>
            <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{
                    padding: '0.2rem 0.55rem', borderRadius: 999, fontSize: '0.58rem',
                    background: `${CATEGORY_COLORS[mantra.category] ?? '#888'}18`,
                    color: CATEGORY_COLORS[mantra.category] ?? '#888',
                    fontFamily: "'Outfit', sans-serif", fontWeight: 700, textTransform: 'capitalize',
                    border: `1px solid ${CATEGORY_COLORS[mantra.category] ?? '#888'}33`,
                }}>{mantra.category}</span>
                <span style={{
                    padding: '0.2rem 0.55rem', borderRadius: 999, fontSize: '0.58rem',
                    background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)',
                    fontFamily: "'Outfit', sans-serif",
                }}>108 beads · {mantra.challengeDays}-day challenge</span>
            </div>
        </motion.div>
    );
}

// ─── Challenge Status ───────────────────────────────────────────────────────────

function ChallengeStatus({ mantraId, mantraName, mantraColor, challengeDays, streak, startDate }: {
    mantraId: string; mantraName: string; mantraColor: string;
    challengeDays: number; streak: number; startDate: string | null;
}) {
    const pct = Math.min(100, (streak / challengeDays) * 100);
    return (
        <div style={{
            padding: '0.9rem 1rem', borderRadius: 14, marginBottom: '0.65rem',
            background: `${mantraColor}0c`, border: `1px solid ${mantraColor}22`,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', fontFamily: "'Outfit', sans-serif" }}>{mantraName}</p>
                <span style={{ fontSize: '0.7rem', color: mantraColor, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{streak}/{challengeDays}</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <motion.div
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    style={{ height: '100%', background: mantraColor, borderRadius: 2 }}
                />
            </div>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>
                {challengeDays - streak > 0 ? `${challengeDays - streak} days to complete` : '🏆 Challenge complete!'}
                {startDate ? ` · Started ${startDate}` : ''}
            </p>
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function SadhanaPage() {
    const router = useRouter();
    const { logMantraSession, mantraStreaks, mantraSessions, updateMantraStreak } = useLifestyleEngine();
    const [activeTab, setActiveTab] = useState<'library' | 'challenges' | 'history'>('library');
    const [selectedMantra, setSelectedMantra] = useState<MantraItem | null>(null);
    const [inSession, setInSession] = useState(false);
    const [justSaved, setJustSaved] = useState(false);
    const [filter, setFilter] = useState<string>('all');

    const today = getToday();
    const todaySessions = mantraSessions.filter(s => s.date === today);
    const activeChallenges = Object.values(mantraStreaks).filter(s => s.challengeActive && (s.currentStreak < (s.challengeDays ?? 40)));

    const handleSessionComplete = useCallback((malaCount: number, repCount: number, intention: string) => {
        if (!selectedMantra) return;
        logMantraSession({
            mantraId: selectedMantra.id,
            mantraName: selectedMantra.name,
            malaCount,
            repetitionCount: repCount,
            durationMinutes: Math.ceil(repCount / 20),
            intention: intention || undefined,
        });
        setJustSaved(true);
        setInSession(false);
        setSelectedMantra(null);
        setTimeout(() => setJustSaved(false), 3000);
    }, [selectedMantra, logMantraSession]);

    const startChallenge = useCallback((mantra: MantraItem) => {
        const existing = mantraStreaks[mantra.id];
        updateMantraStreak({
            mantraId: mantra.id,
            currentStreak: existing?.currentStreak ?? 0,
            longestStreak: existing?.longestStreak ?? 0,
            lastCompletedDate: existing?.lastCompletedDate ?? null,
            totalSessions: existing?.totalSessions ?? 0,
            totalRepetitions: existing?.totalRepetitions ?? 0,
            challengeActive: true,
            challengeStartDate: today,
            challengeDays: mantra.challengeDays,
        });
    }, [mantraStreaks, updateMantraStreak, today]);

    const categories = ['all', ...Array.from(new Set(MANTRAS.map(m => m.category)))];
    const displayMantras = filter === 'all' ? MANTRAS : MANTRAS.filter(m => m.category === filter);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(ellipse at 30% 0%, rgba(192,132,252,0.12) 0%, transparent 55%), radial-gradient(ellipse at 70% 100%, rgba(251,191,36,0.07) 0%, transparent 55%), #030110',
            paddingBottom: '4rem',
            fontFamily: "'Outfit', sans-serif",
        }}>
            {/* Header */}
            <div style={{ padding: '1.25rem 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                    onClick={() => {
                        if (inSession) { setInSession(false); return; }
                        if (selectedMantra) { setSelectedMantra(null); return; }
                        router.back();
                    }}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, padding: 0 }}>
                    <ArrowLeft size={18} />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>Mantra Sadhana</h1>
                    <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.08em' }}>
                        {todaySessions.length > 0
                            ? `${todaySessions.reduce((a, s) => a + s.repetitionCount, 0)} repetitions today`
                            : 'Sacred mantra library'}
                    </p>
                </div>
                {activeChallenges.length > 0 && (
                    <div style={{
                        padding: '0.25rem 0.65rem', borderRadius: 999,
                        background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)',
                        display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                        <Flame size={12} style={{ color: '#fbbf24' }} />
                        <span style={{ fontSize: '0.65rem', color: '#fbbf24', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{activeChallenges.length} active</span>
                    </div>
                )}
            </div>

            <AnimatePresence mode="wait">
                {/* ── Success toast ─────────────────────────────────────────── */}
                {justSaved && (
                    <motion.div key="toast"
                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        style={{ margin: '1rem 1.25rem 0', padding: '0.85rem 1rem', borderRadius: 14, background: 'rgba(192,132,252,0.12)', border: '1px solid rgba(192,132,252,0.3)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <CheckCircle2 size={18} style={{ color: '#c084fc', flexShrink: 0 }} />
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', fontFamily: "'Outfit', sans-serif" }}>Practice logged. Jai Ho 🙏</p>
                    </motion.div>
                )}

                {/* ── Japa session ──────────────────────────────────────────── */}
                {selectedMantra && inSession && (
                    <motion.div key="japa"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ padding: '1.5rem 1.25rem' }}>
                        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                            <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif" }}>Japa Meditation</h2>
                        </div>
                        <MalaCounter mantra={selectedMantra} onComplete={handleSessionComplete} />
                    </motion.div>
                )}

                {/* ── Mantra detail ─────────────────────────────────────────── */}
                {selectedMantra && !inSession && (
                    <motion.div key="detail"
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        style={{ padding: '1.5rem 1.25rem' }}>

                        {/* Header card */}
                        <div style={{
                            padding: '1.25rem', borderRadius: 20,
                            background: `${selectedMantra.color}10`, border: `1px solid ${selectedMantra.color}30`,
                            marginBottom: '1rem', textAlign: 'center',
                        }}>
                            <span style={{ fontSize: '2.5rem' }}>{selectedMantra.icon}</span>
                            <h2 style={{ margin: '0.5rem 0 0.2rem', fontSize: '1.15rem', fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>{selectedMantra.name}</h2>
                            {selectedMantra.deity && (
                                <p style={{ margin: '0 0 0.85rem', fontSize: '0.72rem', color: selectedMantra.color, fontFamily: "'Outfit', sans-serif", fontWeight: 700, letterSpacing: '0.08em' }}>Deity: {selectedMantra.deity}</p>
                            )}
                            <p style={{ margin: '0 0 0.75rem', fontSize: '1.3rem', fontWeight: 800, color: selectedMantra.color, fontFamily: "'Outfit', sans-serif", lineHeight: 1.5, letterSpacing: '0.02em' }}>{selectedMantra.text}</p>
                            <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', fontFamily: "'Outfit', sans-serif", fontStyle: 'italic' }}>{selectedMantra.transliteration}</p>
                        </div>

                        <div style={{ padding: '1rem', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '0.75rem' }}>
                            <p style={{ margin: '0 0 0.4rem', fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.12em', textTransform: 'uppercase' }}>Meaning</p>
                            <p style={{ margin: '0 0 0.85rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.72)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.6 }}>{selectedMantra.meaning}</p>
                            <p style={{ margin: '0 0 0.4rem', fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.12em', textTransform: 'uppercase' }}>Benefit</p>
                            <p style={{ margin: '0 0 0.85rem', fontSize: '0.82rem', color: selectedMantra.color, fontFamily: "'Outfit', sans-serif", lineHeight: 1.6, fontWeight: 600 }}>{selectedMantra.benefit}</p>
                            {selectedMantra.audioNote && (
                                <>
                                    <p style={{ margin: '0 0 0.4rem', fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.12em', textTransform: 'uppercase' }}>Practice Note</p>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.6, fontStyle: 'italic' }}>{selectedMantra.audioNote}</p>
                                </>
                            )}
                        </div>

                        {/* Challenge section */}
                        {!mantraStreaks[selectedMantra.id]?.challengeActive && (
                            <div style={{ padding: '1rem', borderRadius: 14, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                                    <Trophy size={16} style={{ color: '#fbbf24', flexShrink: 0 }} />
                                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', fontFamily: "'Outfit', sans-serif" }}>{selectedMantra.challengeDays}-Day Challenge</p>
                                </div>
                                <p style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}>
                                    Commit to chanting this mantra daily for {selectedMantra.challengeDays} days. A {selectedMantra.challengeDays}-day sadhana creates a permanent shift in your energy field.
                                </p>
                                <motion.button whileTap={{ scale: 0.95 }}
                                    onClick={() => startChallenge(selectedMantra)}
                                    style={{
                                        padding: '0.5rem 1rem', borderRadius: 10,
                                        background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.35)',
                                        color: '#fbbf24', fontSize: '0.75rem', fontWeight: 700,
                                        fontFamily: "'Outfit', sans-serif", cursor: 'pointer',
                                    }}>Start Challenge →</motion.button>
                            </div>
                        )}

                        <motion.button whileTap={{ scale: 0.97 }}
                            onClick={() => setInSession(true)}
                            style={{
                                width: '100%', padding: '1rem', borderRadius: 16,
                                background: `linear-gradient(135deg, ${selectedMantra.color}, ${selectedMantra.color}88)`,
                                border: 'none', color: '#000', fontWeight: 800, fontSize: '0.95rem',
                                fontFamily: "'Outfit', sans-serif", cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                boxShadow: `0 4px 24px ${selectedMantra.color}44`,
                            }}>
                            <Play size={18} style={{ marginLeft: 2 }} /> Begin Japa
                        </motion.button>
                    </motion.div>
                )}

                {/* ── Main view ─────────────────────────────────────────────── */}
                {!selectedMantra && (
                    <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ padding: '1.25rem' }}>

                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
                            {(['library', 'challenges', 'history'] as const).map(tab => (
                                <motion.button key={tab} whileTap={{ scale: 0.9 }}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        flex: 1, padding: '0.5rem 0', borderRadius: 10,
                                        background: activeTab === tab ? 'rgba(192,132,252,0.15)' : 'rgba(255,255,255,0.04)',
                                        border: `1px solid ${activeTab === tab ? 'rgba(192,132,252,0.45)' : 'rgba(255,255,255,0.08)'}`,
                                        color: activeTab === tab ? '#c084fc' : 'rgba(255,255,255,0.45)',
                                        fontSize: '0.72rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif",
                                        cursor: 'pointer', textTransform: 'capitalize',
                                    }}>{tab}</motion.button>
                            ))}
                        </div>

                        {/* Library tab */}
                        {activeTab === 'library' && (
                            <>
                                {/* Category filter */}
                                <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '0.85rem', scrollbarWidth: 'none' }}>
                                    {categories.map(cat => (
                                        <motion.button key={cat} whileTap={{ scale: 0.88 }}
                                            onClick={() => setFilter(cat)}
                                            style={{
                                                flexShrink: 0, padding: '0.3rem 0.7rem', borderRadius: 999, cursor: 'pointer',
                                                background: filter === cat ? 'rgba(192,132,252,0.15)' : 'rgba(255,255,255,0.04)',
                                                border: `1px solid ${filter === cat ? 'rgba(192,132,252,0.4)' : 'rgba(255,255,255,0.08)'}`,
                                                color: filter === cat ? '#c084fc' : 'rgba(255,255,255,0.4)',
                                                fontSize: '0.65rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif",
                                                textTransform: 'capitalize',
                                            }}>{cat}</motion.button>
                                    ))}
                                </div>
                                {displayMantras.map((mantra, i) => (
                                    <motion.div key={mantra.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                                        <MantraCard
                                            mantra={mantra}
                                            streak={mantraStreaks[mantra.id]?.currentStreak ?? 0}
                                            onClick={() => setSelectedMantra(mantra)}
                                        />
                                    </motion.div>
                                ))}
                            </>
                        )}

                        {/* Challenges tab */}
                        {activeTab === 'challenges' && (
                            <div>
                                {activeChallenges.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                                        <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🏆</p>
                                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontFamily: "'Outfit', sans-serif" }}>No active challenges yet. Start one from the library.</p>
                                    </div>
                                ) : (
                                    activeChallenges.map(s => {
                                        const m = MANTRAS.find(m => m.id === s.mantraId);
                                        return m ? (
                                            <ChallengeStatus key={s.mantraId}
                                                mantraId={s.mantraId} mantraName={m.name}
                                                mantraColor={m.color} challengeDays={s.challengeDays ?? 40}
                                                streak={s.currentStreak} startDate={s.challengeStartDate ?? null}
                                            />
                                        ) : null;
                                    })
                                )}
                            </div>
                        )}

                        {/* History tab */}
                        {activeTab === 'history' && (
                            <div>
                                {mantraSessions.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                                        <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📿</p>
                                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontFamily: "'Outfit', sans-serif" }}>Your japa history will appear here.</p>
                                    </div>
                                ) : (
                                    mantraSessions.slice(0, 30).map(session => (
                                        <div key={session.id} style={{ padding: '0.75rem 0.9rem', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: '0.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                            <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{MANTRAS.find(m => m.id === session.mantraId)?.icon ?? '🕉️'}</span>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', fontFamily: "'Outfit', sans-serif" }}>{session.mantraName}</p>
                                                <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>{session.malaCount} mala · {session.repetitionCount} reps</p>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)', fontFamily: "'Outfit', sans-serif", flexShrink: 0 }}>{session.date}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
