"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Info } from 'lucide-react';

// Pallanguzhi: simplified 2-row Mancala with 7 pits per player
// Standard rules: 6 seeds per pit; sow counter-clockwise; capture opposite pit when landing on empty
const PITS = 7;
const SEEDS_PER_PIT = 6;

function initBoard() {
    return {
        top: Array(PITS).fill(SEEDS_PER_PIT),    // opponent pits (indices 0..6, displayed right to left)
        bottom: Array(PITS).fill(SEEDS_PER_PIT),  // player pits
        topStore: 0,
        bottomStore: 0,
    };
}

type Board = ReturnType<typeof initBoard>;

export default function PallanguzhiGame() {
    const [board, setBoard] = useState<Board>(initBoard());
    const [currentPlayer, setCurrentPlayer] = useState<'bottom' | 'top'>('bottom');
    const [status, setStatus] = useState('Your Turn — click a pit to sow');
    const [gameOver, setGameOver] = useState(false);
    const [lastMoved, setLastMoved] = useState<number | null>(null);

    const checkGameOver = (b: Board) => {
        const bottomEmpty = b.bottom.every(s => s === 0);
        const topEmpty = b.top.every(s => s === 0);
        if (bottomEmpty || topEmpty) {
            // Sweep remaining seeds to respective stores
            const nb = { ...b };
            nb.topStore += nb.top.reduce((a, c) => a + c, 0);
            nb.bottomStore += nb.bottom.reduce((a, c) => a + c, 0);
            nb.top = Array(PITS).fill(0);
            nb.bottom = Array(PITS).fill(0);
            setBoard(nb);
            setGameOver(true);
            if (nb.bottomStore > nb.topStore) setStatus(`🎉 You win! ${nb.bottomStore} vs ${nb.topStore}`);
            else if (nb.topStore > nb.bottomStore) setStatus(`Bot wins! ${nb.topStore} vs ${nb.bottomStore}`);
            else setStatus("It's a tie!");
            return true;
        }
        return false;
    };

    const sow = (row: 'bottom' | 'top', pitIdx: number, boardState: Board): Board => {
        const nb = {
            top: [...boardState.top],
            bottom: [...boardState.bottom],
            topStore: boardState.topStore,
            bottomStore: boardState.bottomStore
        };
        let seeds = nb[row][pitIdx];
        nb[row][pitIdx] = 0;

        let r = row;
        let i = pitIdx;

        while (seeds > 0) {
            // Move counter-clockwise: bottom goes left, then switch rows to top going right
            if (r === 'bottom') {
                i--;
                if (i < 0) { 
                    nb.bottomStore++;
                    seeds--;
                    if (seeds === 0) break;
                    r = 'top'; i = 0;
                    continue;
                }
            } else {
                i++;
                if (i >= PITS) {
                    nb.topStore++;
                    seeds--;
                    if (seeds === 0) break;
                    r = 'bottom'; i = PITS - 1;
                    continue;
                }
            }
            nb[r][i]++;
            seeds--;
        }

        // Capture: if landing in empty pit on own side, and opposite has seeds
        if (r === row && nb[r][i] === 1) {
            const opp = r === 'bottom' ? 'top' : 'bottom';
            if (nb[opp][i] > 0) {
                if (r === 'bottom') nb.bottomStore += nb[opp][i] + 1;
                else nb.topStore += nb[opp][i] + 1;
                nb[opp][i] = 0;
                nb[r][i] = 0;
            }
        }

        return nb;
    };

    const handlePitClick = (pitIdx: number) => {
        if (gameOver || currentPlayer !== 'bottom') return;
        if (board.bottom[pitIdx] === 0) return;

        setLastMoved(pitIdx);
        const nb = sow('bottom', pitIdx, board);
        setBoard(nb);
        if (!checkGameOver(nb)) {
            setCurrentPlayer('top');
            setStatus('Bot is thinking...');
        }
    };

    // Bot AI: simple — pick pit with most seeds
    useEffect(() => {
        if (currentPlayer !== 'top' || gameOver) return;
        const timer = setTimeout(() => {
            const best = board.top.reduce((bi, s, i) => s > board.top[bi] ? i : bi, 0);
            if (board.top[best] === 0) { setCurrentPlayer('bottom'); setStatus('Your Turn'); return; }
            const nb = sow('top', best, board);
            setBoard(nb);
            setLastMoved(null);
            if (!checkGameOver(nb)) {
                setCurrentPlayer('bottom');
                setStatus('Your Turn — click a pit to sow');
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [currentPlayer, gameOver, board]);

    const reset = () => { setBoard(initBoard()); setCurrentPlayer('bottom'); setStatus('Your Turn — click a pit to sow'); setGameOver(false); setLastMoved(null); };

    const pitColor = (seeds: number, active: boolean) => {
        if (seeds === 0) return 'rgba(255,255,255,0.02)';
        if (active) return 'rgba(251,191,36,0.2)';
        return 'rgba(255,255,255,0.07)';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', maxWidth: '460px', width: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Mancala • 7 pits each side</div>
                <button onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.78rem' }}>
                    <RefreshCw size={12} /> Restart
                </button>
            </div>

            {/* Board */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Scores */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                    <span style={{ color: '#f472b6' }}>Bot Store: <strong style={{ color: '#f472b6' }}>{board.topStore}</strong></span>
                    <span style={{ color: '#fbbf24' }}>Your Store: <strong style={{ color: '#fbbf24' }}>{board.bottomStore}</strong></span>
                </div>

                {/* Top pits (bot) - displayed reversed */}
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    {[...board.top].reverse().map((seeds, dispIdx) => {
                        const pitIdx = PITS - 1 - dispIdx;
                        return (
                            <div key={pitIdx} style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(244,114,182,0.08)', border: '1px solid rgba(244,114,182,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f9a8d4' }}>{seeds}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Bottom pits (player) */}
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    {board.bottom.map((seeds, pitIdx) => (
                        <motion.div key={pitIdx}
                            whileHover={seeds > 0 && currentPlayer === 'bottom' && !gameOver ? { scale: 1.1 } : {}}
                            whileTap={seeds > 0 && currentPlayer === 'bottom' && !gameOver ? { scale: 0.95 } : {}}
                            onClick={() => handlePitClick(pitIdx)}
                            animate={lastMoved === pitIdx ? { scale: [1, 1.15, 1] } : {}}
                            style={{
                                width: '48px', height: '48px', borderRadius: '50%',
                                background: pitColor(seeds, lastMoved === pitIdx),
                                border: seeds > 0 && currentPlayer === 'bottom' ? '2px solid rgba(251,191,36,0.4)' : '1px solid rgba(255,255,255,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: seeds > 0 && currentPlayer === 'bottom' && !gameOver ? 'pointer' : 'default',
                                transition: 'background 0.2s, border 0.2s'
                            }}>
                            <span style={{ fontSize: '1rem', fontWeight: 800, color: seeds > 0 ? '#fef3c7' : 'rgba(255,255,255,0.2)' }}>{seeds}</span>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Status */}
            <AnimatePresence mode="wait">
                <motion.div key={status} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    style={{ textAlign: 'center', padding: '0.8rem', borderRadius: '12px', background: gameOver ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.04)', color: gameOver ? '#fbbf24' : 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: '0.9rem' }}>
                    {status}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
