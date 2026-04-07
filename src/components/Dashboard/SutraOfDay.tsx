'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

// ─── Sutra Library ─────────────────────────────────────────────────────────────

const SUTRAS = [
    { text: 'Yogaś citta-vṛtti-nirodhaḥ', source: 'Yoga Sutras 1.2', translation: 'Yoga is the cessation of all fluctuations of the mind.', tradition: 'Patanjali' },
    { text: 'Hita-āhāra-vihārasya śāntasya priya-vādinaḥ  |  na ca sarvatra vākyasya manaḥ prīyate narāḥ  ||', source: 'Charaka Samhita, Sutrasthana', translation: 'One who eats wholesomely, lives harmoniously, speaks kindly — such a person is loved everywhere.', tradition: 'Charaka' },
    { text: 'Yadā yadā hi dharmasya glāniḥ bhavati Bhārata…', source: 'Bhagavad Gita 4.7', translation: 'Whenever dharma decays and unrighteousness rises, I manifest myself.', tradition: 'Krishna' },
    { text: 'Sarve bhavantu sukhinaḥ | Sarve santu nirāmayāḥ', source: 'Brihadaranyaka Upanishad', translation: 'May all beings be happy. May all beings be free from disease.', tradition: 'Vedic' },
    { text: 'Āhāra-śuddhau sattva-śuddhiḥ | sattva-śuddhau dhruvā smṛtiḥ', source: 'Chandogya Upanishad 7.26.2', translation: 'When food is pure, the mind becomes pure. When the mind is pure, memory becomes steady.', tradition: 'Upanishad' },
    { text: 'Swasthasya swasthya rakshanam, aturasya vikara prashamanam cha', source: 'Charaka Samhita, Sutra 30.26', translation: 'To protect the health of the healthy, and to alleviate the suffering of the diseased — this is the purpose of Ayurveda.', tradition: 'Charaka' },
    { text: 'Nityaṁ kāla-hita-āhāraḥ sukha-śīlī priyaṁ-vadaḥ', source: 'Ashtanga Hridayam', translation: 'One who takes foods appropriate to the season, in right quantity and at the right time — such a person lives in perfect health.', tradition: 'Vagbhata' },
    { text: 'Manasaḥ cintyamānasya kṣīyate āyuḥ', source: 'Charaka Samhita', translation: 'The life force diminishes when the mind is tormented with excessive worry and thought.', tradition: 'Charaka' },
    { text: 'Karmaṇyevādhikāraste mā phaleṣu kadācana', source: 'Bhagavad Gita 2.47', translation: 'You have the right to perform your duty, but never to the fruits of your action.', tradition: 'Krishna' },
    { text: 'Tat tvam asi', source: 'Chandogya Upanishad 6.8.7', translation: 'That thou art. The Atman within you is identical with Brahman, the universal consciousness.', tradition: 'Upanishad' },
    { text: 'Ahaṁ brahmāsmi', source: 'Brihadaranyaka Upanishad 1.4.10', translation: 'I am Brahman. Pure awareness identifying with the Absolute.', tradition: 'Upanishad' },
    { text: 'Dīrghamāyuḥ smṛtim medhāmarogyaṁ tarūṇam vayaḥ | prabhāvarṇaṁ svaraṁ ojaḥ tejaḥ puṣṭiṁ ca vindati ||', source: 'Charaka Samhita, Sutrasthana 5', translation: 'Oil massage bestows long life, excellent memory, sharp intellect, freedom from disease, youthful vitality, lustre, voice strength, Ojas, and nourishment.', tradition: 'Charaka' },
    { text: 'Prajñāparādho hi mūlaṁ rogāṇāṁ', source: 'Charaka Samhita', translation: 'The root of all disease is the mistake of the intellect — failing to see clearly, choosing wrongly.', tradition: 'Charaka' },
    { text: 'Samadoshah samāgniśca | samādhātu malakriyāh', source: 'Sushruta Samhita', translation: 'The one in whom the doshas are balanced, the digestive fire is balanced, and all tissues and elimination are in equilibrium — that person is truly healthy.', tradition: 'Sushruta' },
];

const TRADITION_COLORS: Record<string, string> = {
    Patanjali: '#a78bfa',
    Charaka: '#4ade80',
    Krishna: '#fbbf24',
    Vedic: '#fb923c',
    Upanishad: '#22d3ee',
    Vagbhata: '#f472b6',
    Sushruta: '#4ade80',
};

// ─── Component ─────────────────────────────────────────────────────────────────

interface SutraOfDayProps {
    compact?: boolean;
}

export default function SutraOfDay({ compact = false }: SutraOfDayProps) {
    // Pick a sutra deterministically by day of year
    const sutra = useMemo(() => {
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        return SUTRAS[dayOfYear % SUTRAS.length];
    }, []);

    const color = TRADITION_COLORS[sutra.tradition] ?? '#fbbf24';

    if (compact) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    padding: '0.85rem 1rem', borderRadius: 16, marginBottom: '0.75rem',
                    background: `${color}08`, border: `1px solid ${color}22`,
                    fontFamily: "'Outfit', sans-serif",
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <BookOpen size={12} style={{ color, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.55rem', fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sutra of the Day</span>
                </div>
                <p style={{ margin: '0 0 0.35rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, fontStyle: 'italic' }}>
                    "{sutra.translation}"
                </p>
                <p style={{ margin: 0, fontSize: '0.58rem', color: `${color}80`, fontWeight: 700 }}>— {sutra.source}</p>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                borderRadius: 22, padding: '1.2rem',
                background: `linear-gradient(135deg, ${color}12, rgba(0,0,0,0.2))`,
                border: `1.5px solid ${color}30`,
                backdropFilter: 'blur(20px)',
                boxShadow: `0 8px 32px ${color}10`,
                fontFamily: "'Outfit', sans-serif",
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ fontSize: '1.4rem' }}
                >📿</motion.div>
                <div>
                    <p style={{ margin: '0 0 1px', fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Sutra of the Day</p>
                    <p style={{ margin: 0, fontSize: '0.65rem', color, fontWeight: 700 }}>{sutra.tradition} · {sutra.source}</p>
                </div>
            </div>

            {/* Sanskrit */}
            <div style={{ padding: '0.7rem 0.85rem', borderRadius: 12, marginBottom: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#fff', fontWeight: 700, lineHeight: 1.6, letterSpacing: '0.02em' }}>
                    {sutra.text}
                </p>
            </div>

            {/* Translation */}
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.65, fontStyle: 'italic' }}>
                "{sutra.translation}"
            </p>

            {/* Tradition badge */}
            <span style={{
                display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.58rem',
                background: `${color}15`, border: `1px solid ${color}35`,
                color, fontWeight: 700, letterSpacing: '0.05em',
            }}>{sutra.tradition}</span>
        </motion.div>
    );
}
