"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

// Nikhilam: multiply numbers close to a base (10, 100)
// e.g., 98 × 97: base=100, deviation -2 and -3
// 98 - 3 = 95, (-2)×(-3) = 6 → answer = 9506
function generateQuestion(base: number) {
    const range = base <= 10 ? 3 : base <= 100 ? 9 : 15;
    let a, b;
    do {
        const da = Math.floor(Math.random() * range) + 1;
        const db = Math.floor(Math.random() * range) + 1;
        const signA = Math.random() > 0.4 ? -1 : 1;
        const signB = Math.random() > 0.4 ? -1 : 1;
        a = base + signA * da;
        b = base + signB * db;
    } while (a === b || a <= 0 || b <= 0);
    return { a, b, answer: a * b, base };
}

const BASES = [10, 100, 1000];

export default function NikhilamGame() {
    const [base, setBase] = useState(100);
    const [question, setQuestion] = useState(generateQuestion(100));
    const [input, setInput] = useState('');
    const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
    const [score, setScore] = useState(0);
    const [showHint, setShowHint] = useState(false);
    const [streak, setStreak] = useState(0);

    const newQuestion = () => {
        setQuestion(generateQuestion(base));
        setInput('');
        setResult(null);
        setShowHint(false);
    };

    useEffect(() => { newQuestion(); }, [base]);

    const check = () => {
        if (!input) return;
        const ans = parseInt(input, 10);
        const level = base === 10 ? 1 : base === 100 ? 2 : 3;
        if (ans === question.answer) {
            setResult('correct');
            setScore(s => s + level * (streak >= 2 ? 2 : 1));
            setStreak(s => s + 1);
        } else {
            setResult('wrong');
            setStreak(0);
        }
    };

    const { a, b, base: qBase } = question;
    const da = a - qBase;
    const db = b - qBase;
    const step1 = a + db; // or b + da
    const step2 = da * db;
    const digits = qBase === 10 ? 1 : qBase === 100 ? 2 : 3;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', maxWidth: '420px', width: '100%' }}>
            {/* Base selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {BASES.map(b => (
                        <button key={b} onClick={() => setBase(b)} style={{
                            padding: '0.3rem 0.8rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
                            background: base === b ? '#8b5cf6' : 'rgba(255,255,255,0.05)',
                            color: base === b ? '#fff' : 'rgba(255,255,255,0.5)',
                            border: base === b ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)'
                        }}>Base {b}</button>
                    ))}
                </div>
                <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem' }}>⭐ {score}</span>
            </div>

            {/* Question */}
            <motion.div key={`${a}${b}`} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                style={{ padding: '2rem', background: 'rgba(255,255,255,0.04)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Multiply using Nikhilam (Base {qBase}):</p>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#a78bfa', letterSpacing: '0.05em' }}>
                    {a} × {b}
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
                    Deviations: {da >= 0 ? '+' : ''}{da} and {db >= 0 ? '+' : ''}{db} from {qBase}
                </div>

                {showHint && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(139,92,246,0.08)', borderRadius: '10px', fontSize: '0.82rem', color: '#ddd6fe', textAlign: 'left', lineHeight: 1.7 }}>
                        <strong>Step 1:</strong> Cross add: {a} + ({db}) = <strong>{step1}</strong> (left part)<br />
                        <strong>Step 2:</strong> Multiply deviations: ({da}) × ({db}) = <strong>{step2}</strong><br />
                        <strong>Step 3:</strong> Combine: {step1} × {qBase} + {step2} = <strong>{question.answer}</strong>
                    </motion.div>
                )}
            </motion.div>

            <div style={{ display: 'flex', gap: '0.8rem' }}>
                <input
                    type="number" value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && check()}
                    placeholder="Your answer..."
                    style={{ flex: 1, padding: '0.8rem 1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '1.1rem', outline: 'none' }}
                />
                <button onClick={check} style={{ padding: '0.8rem 1.2rem', borderRadius: '12px', background: '#8b5cf6', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                    <Zap size={18} />
                </button>
            </div>

            <AnimatePresence mode="wait">
                {result && (
                    <motion.div key={result} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.8rem 1rem', borderRadius: '12px', background: result === 'correct' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: result === 'correct' ? '#86efac' : '#fca5a5', fontWeight: 600, fontSize: '0.9rem' }}>
                        {result === 'correct' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        {result === 'correct' ? 'Correct! Excellent mental math! 🧠' : `Wrong. Answer was: ${question.answer}`}
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button onClick={() => setShowHint(h => !h)}
                    style={{ flex: 1, padding: '0.6rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                    {showHint ? 'Hide Steps' : '💡 Show Steps'}
                </button>
                <button onClick={newQuestion}
                    style={{ flex: 1, padding: '0.6rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <RefreshCw size={14} /> Next
                </button>
            </div>
        </div>
    );
}
