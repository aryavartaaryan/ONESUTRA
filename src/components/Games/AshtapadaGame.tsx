"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

// Ashtapada: simplified 8x8 race game. 2 tokens per player, reach center to win.
// Dice-based movement. Center zone = squares 27,28,35,36 (the 4 center squares).

const SIZE = 8;
const CENTER = new Set([27, 28, 35, 36]);

type Token = { row: number; col: number; done: boolean; };
type Player = { name: string; color: string; emoji: string; tokens: Token[] };

function initPlayers(): Player[] {
    return [
        { name: 'You', color: '#fbbf24', emoji: '🟡', tokens: [{ row: 0, col: 0, done: false }, { row: 0, col: 7, done: false }] },
        { name: 'Bot', color: '#f472b6', emoji: '🩷', tokens: [{ row: 7, col: 0, done: false }, { row: 7, col: 7, done: false }] },
    ];
}

function cellIdx(r: number, c: number) { return r * SIZE + c; }
function dist(r: number, c: number) { return Math.abs(r - 3.5) + Math.abs(c - 3.5); }

function bestMove(token: Token, steps: number): Token {
    // Move towards center greedily
    let { row, col } = token;
    for (let i = 0; i < steps; i++) {
        const dists = [
            [row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]
        ].filter(([r, c]) => r >= 0 && r < SIZE && c >= 0 && c < SIZE);
        const [nr, nc] = dists.sort((a, b) => dist(a[0], a[1]) - dist(b[0], b[1]))[0];
        row = nr; col = nc;
    }
    const done = CENTER.has(cellIdx(row, col));
    return { row, col, done };
}

export default function AshtapadaGame() {
    const [players, setPlayers] = useState<Player[]>(initPlayers());
    const [current, setCurrent] = useState(0);
    const [dice, setDice] = useState<number | null>(null);
    const [rolling, setRolling] = useState(false);
    const [selectedToken, setSelectedToken] = useState<number | null>(null);
    const [status, setStatus] = useState('Roll the dice to begin your journey!');
    const [winner, setWinner] = useState<Player | null>(null);

    const rollDice = () => {
        if (rolling || winner || current !== 0) return;
        setRolling(true);
        const d = Math.floor(Math.random() * 6) + 1;
        setDice(d);
        setStatus(`Rolled ${d}! Click a token to move it ${d} steps toward center`);
        setTimeout(() => setRolling(false), 300);
    };

    const moveToken = (tokenIdx: number) => {
        if (dice === null || current !== 0 || winner) return;
        const p = players[0];
        if (p.tokens[tokenIdx].done) return;

        const newToken = bestMove(p.tokens[tokenIdx], dice);
        const newTokens = p.tokens.map((t, i) => i === tokenIdx ? newToken : t);
        const newPlayers = players.map((pl, i) => i === 0 ? { ...pl, tokens: newTokens } : pl);

        setPlayers(newPlayers);
        setDice(null);
        setSelectedToken(null);

        const allDone = newTokens.every(t => t.done);
        if (allDone) { setWinner(p); setStatus('🏆 You reached the center! You Win!'); return; }
        if (newToken.done) setStatus(`One token reached Ashtapada center! ${newTokens.filter(t => !t.done).length} more to go!`);

        // Bot turn
        setTimeout(() => {
            const bd = Math.floor(Math.random() * 6) + 1;
            setStatus(`Bot rolled ${bd}...`);
            setTimeout(() => {
                const bot = newPlayers[1];
                const movableIdx = bot.tokens.findIndex(t => !t.done);
                if (movableIdx === -1) return;
                const movedToken = bestMove(bot.tokens[movableIdx], bd);
                const botTokens = bot.tokens.map((t, i) => i === movableIdx ? movedToken : t);
                const finalPlayers = newPlayers.map((pl, i) => i === 1 ? { ...pl, tokens: botTokens } : pl);
                setPlayers(finalPlayers);
                const botAllDone = botTokens.every(t => t.done);
                if (botAllDone) { setWinner(bot); setStatus('Bot reached the center! Bot Wins!'); }
                else {
                    setCurrent(0);
                    setStatus('Your turn! Roll the dice.');
                }
            }, 600);
        }, 700);
    };

    const reset = () => {
        setPlayers(initPlayers()); setCurrent(0); setDice(null); setRolling(false);
        setSelectedToken(null); setStatus('Roll the dice to begin your journey!'); setWinner(null);
    };

    // Board with tokens overlaid
    const board = Array(SIZE * SIZE).fill(null);
    players.forEach((p, pi) => {
        p.tokens.forEach((t) => {
            if (!t.done) board[cellIdx(t.row, t.col)] = pi;
        });
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '380px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
                    {players.map(p => (
                        <span key={p.name} style={{ color: p.color }}>
                            {p.emoji} {p.name}: {p.tokens.filter(t => t.done).length}/2 ✓
                        </span>
                    ))}
                </div>
                <button onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.78rem' }}>
                    <RefreshCw size={12} /> Reset
                </button>
            </div>

            {/* 8x8 Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '3px', background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                {board.map((occupant, idx) => {
                    const isCenter = CENTER.has(idx);
                    return (
                        <motion.div key={idx}
                            onClick={() => current === 0 && dice !== null && occupant === 0 && moveToken(players[0].tokens.findIndex((t, i) => !t.done && cellIdx(t.row, t.col) === idx))}
                            style={{
                                width: '36px', height: '36px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: isCenter ? 'rgba(251,191,36,0.15)' : (idx % 2 === 0) ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                                border: isCenter ? '1px solid rgba(251,191,36,0.4)' : '1px solid rgba(255,255,255,0.05)',
                                fontSize: '1.1rem', cursor: occupant === 0 && dice !== null ? 'pointer' : 'default',
                                transition: 'all 0.2s'
                            }}>
                            {isCenter && occupant === null ? <span style={{ fontSize: '0.5rem', color: 'rgba(251,191,36,0.6)' }}>★</span>
                                : occupant === 0 ? players[0].emoji
                                : occupant === 1 ? players[1].emoji
                                : null}
                        </motion.div>
                    );
                })}
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={status} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    style={{ padding: '0.7rem', borderRadius: '12px', background: winner ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.04)', color: winner ? '#fbbf24' : 'rgba(255,255,255,0.75)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>
                    {status}
                </motion.div>
            </AnimatePresence>

            {!winner && (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={rollDice} disabled={rolling || current !== 0 || dice !== null}
                    style={{ padding: '0.9rem', borderRadius: '14px', background: (rolling || current !== 0 || dice !== null) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: (rolling || current !== 0 || dice !== null) ? 'rgba(255,255,255,0.3)' : '#000', border: 'none', fontWeight: 800, cursor: (rolling || current !== 0 || dice !== null) ? 'not-allowed' : 'pointer', fontSize: '0.95rem' }}>
                    {dice !== null ? `🎲 Dice: ${dice} — Click a token ↑` : '🎲 Roll Dice'}
                </motion.button>
            )}
        </div>
    );
}
