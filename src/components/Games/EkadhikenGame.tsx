"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

// Ekadhiken Purven: squaring numbers ending in 5
// Rule: (n5)² = n*(n+1) followed by 25
// e.g., 35² => 3*4=12 → 1225
function generateQuestion(level: number) {
    const min = level === 1 ? 1 : level === 2 ? 4 : 9;
    const max = level === 1 ? 3 : level === 2 ? 9 : 19;
    const n = Math.floor(Math.random() * (max - min + 1)) + min;
    const number = n * 10 + 5;
    const answer = n * (n + 1) * 100 + 25;
    return { number, answer, n };
}

const LEVELS = [
    { label: 'Easy', desc: '15, 25, 35', color: '#22c55e' },
    { label: 'Medium', desc: '45–95', color: '#f59e0b' },
    { label: 'Hard', desc: '95–195', color: '#ef4444' }
];

export default function EkadhikenGame() {
    const [level, setLevel] = useState(1);
    const [question, setQuestion] = useState(generateQuestion(1));
    const [input, setInput] = useState('');
    const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [showHint, setShowHint] = useState(false);

    const newQuestion = () => {
        setQuestion(generateQuestion(level));
        setInput('');
        setResult(null);
        setShowHint(false);
    };

    useEffect(() => { newQuestion(); }, [level]);

    const check = () => {
        if (!input) return;
        const ans = parseInt(input, 10);
        if (ans === question.answer) {
            setResult('correct');
            setScore(s => s + (streak >= 2 ? 2 : 1) * level);
            setStreak(s => s + 1);
        } else {
            setResult('wrong');
            setStreak(0);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', maxWidth: '420px', width: '100%' }}>
            {/* Score / Level */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {LEVELS.map((l, i) => (
                        <button key={i} onClick={() => setLevel(i + 1)} style={{
                            padding: '0.3rem 0.8rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
                            background: level === i + 1 ? l.color : 'rgba(255,255,255,0.05)',
                            color: level === i + 1 ? '#000' : 'rgba(255,255,255,0.5)',
                            border: level === i + 1 ? `1px solid ${l.color}` : '1px solid rgba(255,255,255,0.1)'
                        }}>{l.label}</button>
                    ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.85rem', fontWeight: 700 }}>
                    <span style={{ color: '#fbbf24' }}>⭐ {score}</span>
                    {streak >= 2 && <span style={{ color: '#f472b6', fontSize: '0.75rem' }}>🔥 {streak} Streak</span>}
                </div>
            </div>

            {/* Question Card */}
            <motion.div key={question.number} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                style={{ padding: '2rem', background: 'rgba(255,255,255,0.04)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Calculate using Ekadhiken Purven:</p>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.05em' }}>
                    {question.number}²
                </div>

                {showHint && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(251,191,36,0.08)', borderRadius: '10px', fontSize: '0.85rem', color: '#fef3c7', textAlign: 'left' }}>
                        <strong>Hint:</strong> n = {question.n}, so n×(n+1) = {question.n}×{question.n + 1} = <strong>{question.n * (question.n + 1)}</strong><br />
                        Answer = {question.n * (question.n + 1)} followed by <strong>25</strong> = <strong>{question.answer}</strong>
                    </motion.div>
                )}
            </motion.div>

            {/* Input */}
            <div style={{ display: 'flex', gap: '0.8rem' }}>
                <input
                    type="number" value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && check()}
                    placeholder="Your answer..."
                    style={{ flex: 1, padding: '0.8rem 1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '1.1rem', outline: 'none' }}
                />
                <button onClick={check}
                    style={{ padding: '0.8rem 1.2rem', borderRadius: '12px', background: '#fbbf24', color: '#000', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                    <Zap size={18} />
                </button>
            </div>

            <AnimatePresence mode="wait">
                {result && (
                    <motion.div key={result} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.8rem 1rem', borderRadius: '12px', background: result === 'correct' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: result === 'correct' ? '#86efac' : '#fca5a5', fontWeight: 600, fontSize: '0.9rem' }}>
                        {result === 'correct' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        {result === 'correct' ? `Correct! +${(streak >= 2 ? 2 : 1) * level} points` : `Wrong. Answer: ${question.answer}`}
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button onClick={() => setShowHint(h => !h)}
                    style={{ flex: 1, padding: '0.6rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                    {showHint ? 'Hide Hint' : '💡 Show Hint'}
                </button>
                <button onClick={newQuestion}
                    style={{ flex: 1, padding: '0.6rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <RefreshCw size={14} /> Next Question
                </button>
            </div>
        </div>
    );
}
