"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, ChevronRight } from 'lucide-react';

type Trick = {
    id: string;
    title: string;
    color: string;
    emoji: string;
    steps: string[];
    reveal: (input: number) => string;
    inputLabel: string;
    inputNote: string;
};

const TRICKS: Trick[] = [
    {
        id: 'age',
        title: 'Age Guesser',
        color: '#f472b6',
        emoji: '🎂',
        inputLabel: "Enter your final number",
        inputNote: "Think of your age, follow steps, tell me the result!",
        steps: [
            "Think of your age (keep it secret!)",
            "Multiply it by 2",
            "Add 10",
            "Multiply the result by 5",
            "Subtract 50",
            "What's your final number?"
        ],
        reveal: (n) => `Your age is ${n - 50}! 🎉`
    },
    {
        id: 'number',
        title: 'Number Oracle',
        color: '#a78bfa',
        emoji: '🔮',
        inputLabel: "Tell me your final number",
        inputNote: "Think of any number 1–20, follow the steps!",
        steps: [
            "Think of any number (1 to 20)",
            "Multiply it by 3",
            "Add 6",
            "Divide by 3",
            "Subtract your original number",
            "What is your result?"
        ],
        reveal: (n) => {
            if (n === 2) return `You're thinking of... your result is 2! The universe always brings you to 2! 🌌`;
            return `Your result is ${n}. (Hint: try again — it should always be 2!) ✨`;
        }
    },
    {
        id: 'birth',
        title: 'Birthday Magic',
        color: '#fbbf24',
        emoji: '✨',
        inputLabel: "Enter your final number",
        inputNote: "Enter your birth month (1–12), follow the steps!",
        steps: [
            "Think of your birth month (1=Jan, 12=Dec)",
            "Multiply it by 5",
            "Add 7",
            "Multiply by 4",
            "Add 13",
            "Multiply by 5",
            "Add the day you were born (1–31)",
            "What's your final number?"
        ],
        reveal: (n) => {
            const adjusted = n - 555;
            const month = Math.floor(adjusted / 100);
            const day = adjusted % 100;
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                return `You were born on ${day} ${months[month - 1]}! 🎊`;
            }
            return `Your birthday is encoded in that number! 🎉`;
        }
    }
];

export default function MathMagicGame() {
    const [activeTrick, setActiveTrick] = useState<Trick>(TRICKS[0]);
    const [step, setStep] = useState<'select' | 'play' | 'result'>('select');
    const [input, setInput] = useState('');
    const [revelation, setRevelation] = useState('');

    const startTrick = (t: Trick) => {
        setActiveTrick(t);
        setStep('play');
        setInput('');
        setRevelation('');
    };

    const reveal = () => {
        const n = parseInt(input);
        if (isNaN(n)) return;
        setRevelation(activeTrick.reveal(n));
        setStep('result');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', maxWidth: '420px', width: '100%' }}>
            <AnimatePresence mode="wait">
                {step === 'select' && (
                    <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', margin: '0 0 1rem', fontSize: '0.9rem' }}>
                            Choose your magic trick:
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {TRICKS.map(t => (
                                <motion.button key={t.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => startTrick(t)}
                                    style={{ padding: '1rem 1.2rem', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${t.color}30`, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left' }}>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${t.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                                        {t.emoji}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, color: t.color }}>{t.title}</div>
                                        <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>{t.inputNote}</div>
                                    </div>
                                    <ChevronRight size={18} style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.3)' }} />
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {step === 'play' && (
                    <motion.div key="play" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                            <button onClick={() => setStep('select')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.4rem 0.8rem', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.8rem' }}>← Back</button>
                            <span style={{ fontWeight: 700, color: activeTrick.color, fontSize: '1rem' }}>{activeTrick.emoji} {activeTrick.title}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {activeTrick.steps.map((s, i) => (
                                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                                    style={{ padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: `1px solid ${activeTrick.color}20`, display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                                    <span style={{ color: activeTrick.color, fontWeight: 700, minWidth: '1.5rem', fontSize: '0.85rem' }}>{i + 1}.</span>
                                    <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem' }}>{s}</span>
                                </motion.div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
                            <input type="number" value={input} onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && reveal()}
                                placeholder={activeTrick.inputLabel}
                                style={{ flex: 1, padding: '0.8rem 1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '1rem', outline: 'none' }}
                            />
                            <button onClick={reveal}
                                style={{ padding: '0.8rem 1.2rem', borderRadius: '12px', background: activeTrick.color, color: '#000', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                                <Sparkles size={18} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 'result' && (
                    <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                        <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: 2 }}
                            style={{ padding: '2rem', background: `${activeTrick.color}15`, borderRadius: '20px', border: `2px solid ${activeTrick.color}50`, textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{activeTrick.emoji}</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: activeTrick.color, lineHeight: 1.6 }}>{revelation}</div>
                            <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                                This is Vedic Math — ancient Indian wisdom made magical! 🙏
                            </div>
                        </motion.div>
                        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
                            <button onClick={() => setStep('play')}
                                style={{ flex: 1, padding: '0.7rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                                Try Again
                            </button>
                            <button onClick={() => { setStep('select'); setInput(''); }}
                                style={{ flex: 1, padding: '0.7rem', borderRadius: '12px', background: activeTrick.color, color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                                <RefreshCw size={14} /> New Trick
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
