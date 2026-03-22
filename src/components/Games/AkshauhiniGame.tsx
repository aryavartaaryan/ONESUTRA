"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';

// Akshauhini Battle Formations: Mental puzzles about ancient Vyuh formations
// Player must identify the formation from clues, or solve spatial challenges

type Puzzle = {
    id: string;
    name: string;
    sanskrit: string;
    description: string;
    grid: string[]; // visual representation using emojis/chars
    clue: string;
    options: string[];
    answer: string;
    explanation: string;
};

const PUZZLES: Puzzle[] = [
    {
        id: 'chakra',
        name: 'Chakravyuh',
        sanskrit: 'चक्रव्यूह',
        description: 'Identify this famous spiral battle formation used in Mahabharata',
        grid: [
            '⬛🔵🔵🔵⬛',
            '🔵⬛⬛⬛🔵',
            '🔵⬛⭐⬛🔵',
            '🔵⬛⬛⬛🔵',
            '⬛🔵🔵🔵⬛',
        ],
        clue: 'This formation looks like a revolving wheel / disc. Soldiers stand in circular layers. To enter, one must spiral inward — but escaping without knowing the technique is impossible!',
        options: ['Chakravyuh (Wheel)', 'Padmavyuh (Lotus)', 'Garudavyuh (Eagle)', 'Krauñchavyuh (Heron)'],
        answer: 'Chakravyuh (Wheel)',
        explanation: 'Chakravyuh (चक्रव्यूह) = Disc formation. Abhimanyu of Mahabharata entered it alone but could not escape because he only knew how to break in, not break out. It teaches the importance of complete knowledge!'
    },
    {
        id: 'padma',
        name: 'Padmavyuh',
        sanskrit: 'पद्मव्यूह',
        description: 'What pattern does this Lotus formation resemble?',
        grid: [
            '⬛⬛🌸⬛⬛',
            '⬛🌸🌸🌸⬛',
            '🌸🌸⭐🌸🌸',
            '⬛🌸🌸🌸⬛',
            '⬛⬛🌸⬛⬛',
        ],
        clue: 'This formation is shaped like a blooming flower with petals spreading outward from a central commander.',
        options: ['Chakravyuh (Wheel)', 'Padmavyuh (Lotus)', 'Vajravyuh (Diamond)', 'Makarvyuh (Crocodile)'],
        answer: 'Padmavyuh (Lotus)',
        explanation: 'Padmavyuh (पद्मव्यूह) = Lotus formation. The commander stays at the center (the ⭐), protected by multiple layers of soldiers like lotus petals. Krishna himself used this formation!'
    },
    {
        id: 'garuda',
        name: 'Garudavyuh',
        sanskrit: 'गरुड़व्यूह',
        description: 'This formation is named after the divine eagle of Lord Vishnu',
        grid: [
            '⬛⬛🦅⬛⬛',
            '⬛🦅🦅🦅⬛',
            '🦅🦅⭐🦅🦅',
            '⬛🦅⬛🦅⬛',
            '⬛🦅⬛🦅⬛',
        ],
        clue: 'This V-shaped formation has a pointed front (like a beak) and wide wings behind that sweep around to surround the enemy.',
        options: ['Padmavyuh (Lotus)', 'Shakatavyuh (Cart)', 'Garudavyuh (Eagle)', 'Sarpavyuh (Serpent)'],
        answer: 'Garudavyuh (Eagle)',
        explanation: 'Garudavyuh (गरुड़व्यूह) = Eagle/Kite formation. The frontline is narrow and sharp, while flanks spread wide like wings. Used to pierce enemy center and surround from sides. Excellent for aggressive offense!'
    },
    {
        id: 'suchi',
        name: 'Suchivyuh',
        sanskrit: 'सूचीव्यूह',
        description: 'What does this thin, sharp needle formation do?',
        grid: [
            '⬛⬛⭐⬛⬛',
            '⬛⬛⚔️⬛⬛',
            '⬛⬛⚔️⬛⬛',
            '⬛⬛⚔️⬛⬛',
            '⬛⬛⚔️⬛⬛',
        ],
        clue: 'Suchi means needle in Sanskrit. This formation concentrates all forces into one thin, super-strong line to pierce deep.',
        options: ['Garudavyuh (Eagle)', 'Suchivyuh (Needle)', 'Mandal (Circle)', 'Vajravyuh (Diamond)'],
        answer: 'Suchivyuh (Needle)',
        explanation: 'Suchivyuh (सूचीव्यूह) = Needle formation. All warriors march in a single file — extremely powerful penetration but very vulnerable from the sides. Used when the enemy has a weak center point!'
    },
];

export default function AkshauhiniGame() {
    const [puzzleIdx, setPuzzleIdx] = useState(0);
    const [answered, setAnswered] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [total, setTotal] = useState(0);

    const puzzle = PUZZLES[puzzleIdx];

    const answer = (choice: string) => {
        if (answered !== null) return;
        setAnswered(choice);
        setTotal(t => t + 1);
        if (choice === puzzle.answer) setScore(s => s + 1);
    };

    const next = () => {
        setAnswered(null);
        setPuzzleIdx(i => (i + 1) % PUZZLES.length);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', maxWidth: '440px', width: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
                    Formation {puzzleIdx + 1}/{PUZZLES.length}
                </div>
                <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.85rem' }}>
                    ⭐ {score}/{total} correct
                </div>
            </div>

            {/* Puzzle Card */}
            <AnimatePresence mode="wait">
                <motion.div key={puzzle.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>IDENTIFY THIS FORMATION</div>
                        <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: '#fbbf24' }}>{puzzle.description}</div>
                    </div>

                    {/* Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                        {puzzle.grid.map((row, ri) => (
                            <div key={ri} style={{ display: 'flex', gap: '4px' }}>
                                {row.split('').filter(c => c !== ' ').map((cell, ci) => (
                                    <div key={ci} style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                                        {cell === '⬛' ? null : cell}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Clue */}
                    <div style={{ padding: '0.8rem', background: 'rgba(167,139,250,0.06)', borderRadius: '12px', border: '1px solid rgba(167,139,250,0.15)', fontSize: '0.82rem', color: '#c4b5fd', lineHeight: 1.6 }}>
                        💡 <strong>Clue:</strong> {puzzle.clue}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {puzzle.options.map(opt => {
                    const isChosen = answered === opt;
                    const isCorrect = opt === puzzle.answer;
                    let bg = 'rgba(255,255,255,0.04)';
                    let border = '1px solid rgba(255,255,255,0.08)';
                    let color = 'rgba(255,255,255,0.8)';
                    if (answered !== null) {
                        if (isCorrect) { bg = 'rgba(34,197,94,0.12)'; border = '1px solid rgba(34,197,94,0.4)'; color = '#86efac'; }
                        else if (isChosen) { bg = 'rgba(239,68,68,0.1)'; border = '1px solid rgba(239,68,68,0.3)'; color = '#fca5a5'; }
                    }
                    return (
                        <motion.button key={opt} whileHover={answered === null ? { scale: 1.01, x: 4 } : {}} whileTap={answered === null ? { scale: 0.98 } : {}}
                            onClick={() => answer(opt)}
                            style={{ padding: '0.8rem 1rem', borderRadius: '12px', background: bg, border, color, cursor: answered === null ? 'pointer' : 'default', fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.6rem', textAlign: 'left', transition: 'all 0.2s' }}>
                            {answered !== null && isCorrect && <CheckCircle size={16} />}
                            {answered !== null && isChosen && !isCorrect && <XCircle size={16} />}
                            {opt}
                        </motion.button>
                    );
                })}
            </div>

            {/* Explanation */}
            <AnimatePresence>
                {answered !== null && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0 }}>
                        <div style={{ padding: '1rem', borderRadius: '14px', background: answered === puzzle.answer ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: answered === puzzle.answer ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(239,68,68,0.2)' }}>
                            <div style={{ fontWeight: 700, color: answered === puzzle.answer ? '#86efac' : '#fca5a5', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                                {answered === puzzle.answer ? '✅ Correct!' : '❌ Not quite!'}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.65 }}>{puzzle.explanation}</div>
                        </div>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={next}
                            style={{ marginTop: '0.8rem', width: '100%', padding: '0.8rem', borderRadius: '12px', background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
                            Next Formation →
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
