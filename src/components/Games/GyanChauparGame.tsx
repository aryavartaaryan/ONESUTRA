"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dice1, RefreshCw } from 'lucide-react';

// Gyan Chaupar: Moralized Snakes & Ladders on a 10x10 grid (1-100)
// Virtues (Ladders) and Vices (Snakes) carry moral meanings

const LADDERS: Record<number, { to: number; virtue: string }> = {
    4:  { to: 14, virtue: 'Satya (Truth)' },
    9:  { to: 31, virtue: 'Daan (Charity)' },
    20: { to: 38, virtue: 'Tapasya (Penance)' },
    28: { to: 57, virtue: 'Ahimsa (Non-Violence)' },
    40: { to: 59, virtue: 'Bhakti (Devotion)' },
    63: { to: 81, virtue: 'Dhyan (Meditation)' },
    71: { to: 91, virtue: 'Gyaan (Knowledge)' },
    74: { to: 99, virtue: 'Moksha Dvar!' },
};

const SNAKES: Record<number, { to: number; vice: string }> = {
    17: { to: 7,  vice: 'Krodha (Anger)' },
    54: { to: 34, vice: 'Lobha (Greed)' },
    62: { to: 19, vice: 'Maya (Illusion)' },
    64: { to: 60, vice: 'Dambha (Pride)' },
    87: { to: 24, vice: 'Kama (Lust)' },
    92: { to: 73, vice: 'Matsarya (Envy)' },
    95: { to: 75, vice: 'Himsa (Violence)' },
    99: { to: 78, vice: 'Ahankara (Ego)' },
};

function rollDice() { return Math.floor(Math.random() * 6) + 1; }

interface Player { pos: number; name: string; color: string; emoji: string; }

export default function GyanChauparGame() {
    const [players, setPlayers] = useState<Player[]>([
        { pos: 0, name: 'You', color: '#fbbf24', emoji: '🧘' },
        { pos: 0, name: 'Bot', color: '#f472b6', emoji: '🤖' },
    ]);
    const [currentP, setCurrentP] = useState(0);
    const [lastRoll, setLastRoll] = useState<number | null>(null);
    const [event, setEvent] = useState<string | null>(null);
    const [rolling, setRolling] = useState(false);
    const [winner, setWinner] = useState<Player | null>(null);

    const doMove = (pIdx: number, current: Player[]) => {
        const die = rollDice();
        setLastRoll(die);
        const p = { ...current[pIdx] };
        let newPos = p.pos + die;
        let ev: string | null = null;

        if (newPos > 100) { newPos = p.pos; ev = `🎲 ${die} — Can't move! Need exact number.`; }
        else if (LADDERS[newPos]) {
            const l = LADDERS[newPos];
            ev = `🪜 ${l.virtue}! Climbed from ${newPos} → ${l.to}`;
            newPos = l.to;
        } else if (SNAKES[newPos]) {
            const s = SNAKES[newPos];
            ev = `🐍 Beware ${s.vice}! Slid from ${newPos} → ${s.to}`;
            newPos = s.to;
        } else {
            ev = `🎲 Rolled ${die}! Moved to ${newPos}`;
        }

        p.pos = newPos;
        const updated = current.map((pp, i) => i === pIdx ? p : pp);
        setPlayers(updated);
        setEvent(ev);

        if (newPos >= 100) { setWinner(p); return updated; }
        return updated;
    };

    const roll = () => {
        if (rolling || winner) return;
        setRolling(true);
        setTimeout(() => {
            const updated = doMove(currentP, players);
            if (!winner) {
                if (currentP === 0) {
                    // Bot's turn
                    setTimeout(() => {
                        doMove(1, updated);
                        setCurrentP(0);
                        setRolling(false);
                    }, 1000);
                } else {
                    setCurrentP(0);
                    setRolling(false);
                }
            } else {
                setRolling(false);
            }
        }, 400);
    };

    const reset = () => {
        setPlayers([
            { pos: 0, name: 'You', color: '#fbbf24', emoji: '🧘' },
            { pos: 0, name: 'Bot', color: '#f472b6', emoji: '🤖' },
        ]);
        setCurrentP(0); setLastRoll(null); setEvent(null); setRolling(false); setWinner(null);
    };

    // Render the 10x10 board
    const cells = Array.from({ length: 100 }, (_, i) => {
        const num = 100 - i; // top-left = 100, bottom-right = 1
        // Zigzag: even rows go right-to-left
        const row = Math.floor(i / 10);
        const col = i % 10;
        const actualCol = row % 2 === 0 ? col : 9 - col;
        const cellNum = (9 - row) * 10 + actualCol + 1;
        return cellNum;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '440px', width: '100%' }}>
            {/* Player positions */}
            <div style={{ display: 'flex', gap: '1rem' }}>
                {players.map(p => (
                    <div key={p.name} style={{ flex: 1, padding: '0.7rem', borderRadius: '12px', background: `${p.color}12`, border: `1px solid ${p.color}30`, textAlign: 'center' }}>
                        <div style={{ fontSize: '1.3rem' }}>{p.emoji}</div>
                        <div style={{ fontSize: '0.78rem', color: p.color, fontWeight: 700 }}>{p.name}</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>Square {p.pos || '–'}</div>
                    </div>
                ))}
            </div>

            {/* Mini board visualization */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '2px' }}>
                {cells.map(cellNum => {
                    const p0 = players[0].pos === cellNum;
                    const p1 = players[1].pos === cellNum;
                    const isLadder = LADDERS[cellNum];
                    const isSnake = SNAKES[cellNum];
                    return (
                        <div key={cellNum} style={{
                            width: '38px', height: '28px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isLadder ? 'rgba(34,197,94,0.15)' : isSnake ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.03)',
                            border: p0 || p1 ? '2px solid #fbbf24' : isLadder ? '1px solid rgba(34,197,94,0.3)' : isSnake ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.05)',
                            fontSize: '0.55rem', flexDirection: 'column', transition: 'all 0.3s'
                        }}>
                            {(p0 || p1) ? (p0 && p1 ? '🧘🤖' : p0 ? '🧘' : '🤖') : (isLadder ? '🪜' : isSnake ? '🐍' : <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.5rem' }}>{cellNum}</span>)}
                        </div>
                    );
                })}
            </div>

            {/* Event */}
            <AnimatePresence mode="wait">
                {event && (
                    <motion.div key={event} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ padding: '0.8rem', borderRadius: '12px', background: event.includes('🪜') ? 'rgba(34,197,94,0.1)' : event.includes('🐍') ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)', color: event.includes('🪜') ? '#86efac' : event.includes('🐍') ? '#fca5a5' : 'rgba(255,255,255,0.75)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>
                        {event}
                    </motion.div>
                )}
            </AnimatePresence>

            {winner ? (
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                    style={{ padding: '1rem', borderRadius: '16px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem' }}>🏆</div>
                    <div style={{ color: '#fbbf24', fontWeight: 800 }}>{winner.name} reached Moksha!</div>
                    <button onClick={reset} style={{ marginTop: '0.8rem', padding: '0.5rem 1.2rem', borderRadius: '10px', background: '#fbbf24', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Play Again</button>
                </motion.div>
            ) : (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={roll} disabled={rolling}
                    style={{ padding: '0.9rem', borderRadius: '14px', background: rolling ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: rolling ? 'rgba(255,255,255,0.4)' : '#000', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: rolling ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                    {rolling ? '...' : `🎲 Roll Dice ${lastRoll ? `(Last: ${lastRoll})` : ''}`}
                </motion.button>
            )}
        </div>
    );
}
