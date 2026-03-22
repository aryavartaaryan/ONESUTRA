"use client";
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

// Aadu Puli Aattam: Goats (15) vs Tigers (3) on a grid
// Board positions: 25 nodes on a 5x5 cross-pattern grid
// Tigers capture by jumping over goats; Goats win by blocking all tiger moves

type Piece = 'tiger' | 'goat' | null;

// 5x5 board, but only valid positions matter (cross pattern)
const VALID = new Set([
    0,1,2,3,4,
    5,6,7,8,9,
    10,11,12,13,14,
    15,16,17,18,19,
    20,21,22,23,24
]);

// Adjacency: each node and its valid neighbors (straight + diagonal where applicable)
function buildAdj() {
    const adj: Record<number, number[]> = {};
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            const n = r * 5 + c;
            const neighbors: number[] = [];
            const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
            // Diagonal only on even-sum nodes (like real board)
            if ((r + c) % 2 === 0) dirs.push(...[[1,1],[1,-1],[-1,1],[-1,-1]] as number[][]);
            for (const [dr, dc] of dirs) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5) neighbors.push(nr * 5 + nc);
            }
            adj[n] = neighbors;
        }
    }
    return adj;
}
const ADJ = buildAdj();

const INIT_TIGERS = [0, 4, 24]; // start positions
const TOTAL_GOATS = 15;

interface State {
    board: Piece[];
    goatsPlaced: number;
    goatsCaptured: number;
    turn: 'goat' | 'tiger';
}

function init(): State {
    const board: Piece[] = Array(25).fill(null);
    INIT_TIGERS.forEach(p => { board[p] = 'tiger'; });
    return { board, goatsPlaced: 0, goatsCaptured: 0, turn: 'goat' };
}

export default function AaduPuliGame() {
    const [state, setState] = useState<State>(init());
    const [selected, setSelected] = useState<number | null>(null);
    const [message, setMessage] = useState('Place your goats on the board (15 total)');
    const [gameOver, setGameOver] = useState<'goat' | 'tiger' | null>(null);

    const checkWin = (s: State): 'goat' | 'tiger' | null => {
        if (s.goatsCaptured >= 5) return 'tiger';
        // Check if all tigers are blocked
        const tigerMoves = s.board.reduce((acc, p, pos) => {
            if (p !== 'tiger') return acc;
            const moves = ADJ[pos].filter(n => s.board[n] === null);
            const jumps = ADJ[pos].filter(n => {
                if (s.board[n] !== 'goat') return false;
                const dr = Math.floor(n/5) - Math.floor(pos/5);
                const dc = (n%5) - (pos%5);
                const land = (Math.floor(n/5)+dr)*5 + (n%5)+dc;
                return land >= 0 && land < 25 && s.board[land] === null;
            });
            return acc + moves.length + jumps.length;
        }, 0);
        if (tigerMoves === 0) return 'goat';
        return null;
    };

    const handleClick = (pos: number) => {
        if (gameOver) return;
        const s = state;

        if (s.turn === 'goat') {
            if (s.goatsPlaced < TOTAL_GOATS) {
                // Placing phase
                if (s.board[pos] !== null) return;
                const nb = [...s.board]; nb[pos] = 'goat';
                const ns: State = { ...s, board: nb, goatsPlaced: s.goatsPlaced + 1, turn: 'tiger' };
                const w = checkWin(ns);
                setState(ns); setGameOver(w);
                setMessage(w ? (w === 'goat' ? '🐐 Goats Win! Tigers are blocked!' : '🐯 Tigers Win! Too many goats captured!') : `Tiger turn. ${TOTAL_GOATS - ns.goatsPlaced} goats left to place.`);
                // Simple tiger bot
                if (!w) setTimeout(() => tigerMove(ns), 600);
            } else {
                // Moving phase
                if (selected === null) {
                    if (s.board[pos] !== 'goat') return;
                    setSelected(pos);
                    setMessage('Now click where to move the goat');
                } else {
                    if (ADJ[selected].includes(pos) && s.board[pos] === null) {
                        const nb = [...s.board]; nb[pos] = 'goat'; nb[selected] = null;
                        const ns: State = { ...s, board: nb, turn: 'tiger' };
                        setSelected(null);
                        const w = checkWin(ns);
                        setState(ns); setGameOver(w);
                        setMessage(w ? (w === 'goat' ? '🐐 Goats Win!' : '🐯 Tigers Win!') : 'Tiger turn...');
                        if (!w) setTimeout(() => tigerMove(ns), 600);
                    } else {
                        setSelected(pos === selected ? null : (s.board[pos] === 'goat' ? pos : selected));
                    }
                }
            }
        }
    };

    const tigerMove = (s: State) => {
        // Tiger bot: try to capture, else move randomly
        const tigers = s.board.map((p, i) => p === 'tiger' ? i : -1).filter(i => i >= 0);
        for (const pos of tigers) {
            for (const n of ADJ[pos]) {
                if (s.board[n] !== 'goat') continue;
                const dr = Math.floor(n/5) - Math.floor(pos/5);
                const dc = (n%5) - (pos%5);
                const land = (Math.floor(n/5)+dr)*5 + (n%5)+dc;
                if (land >= 0 && land < 25 && s.board[land] === null) {
                    const nb = [...s.board]; nb[land] = 'tiger'; nb[pos] = null; nb[n] = null;
                    const ns: State = { ...s, board: nb, goatsCaptured: s.goatsCaptured + 1, turn: 'goat' };
                    const w = checkWin(ns);
                    setState(ns); setGameOver(w);
                    setMessage(w ? (w === 'tiger' ? '🐯 Tigers Win! Captured 5 goats!' : '🐐 Goats Win!') : `Your turn. Goats captured: ${ns.goatsCaptured}`);
                    return;
                }
            }
        }
        // Pick random valid move
        for (const pos of tigers.sort(() => Math.random() - 0.5)) {
            const mvs = ADJ[pos].filter(n => s.board[n] === null);
            if (mvs.length > 0) {
                const dest = mvs[Math.floor(Math.random() * mvs.length)];
                const nb = [...s.board]; nb[dest] = 'tiger'; nb[pos] = null;
                const ns: State = { ...s, board: nb, turn: 'goat' };
                const w = checkWin(ns);
                setState(ns); setGameOver(w);
                setMessage(w ? (w === 'goat' ? '🐐 Goats Win!' : '🐯 Tigers Win!') : `Your turn. Goats placed: ${ns.goatsPlaced}/${TOTAL_GOATS}`);
                return;
            }
        }
        setState({ ...s, turn: 'goat' }); setMessage('Your turn');
    };

    const reset = () => { setState(init()); setSelected(null); setMessage('Place your goats on the board (15 total)'); setGameOver(null); };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '340px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem' }}>
                    <span style={{ color: '#fbbf24' }}>🐐 Goats: {state.goatsPlaced}/{TOTAL_GOATS}</span>
                    <span style={{ color: '#ef4444' }}>🐯 Captured: {state.goatsCaptured}/5</span>
                </div>
                <button onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.78rem' }}>
                    <RefreshCw size={12} /> Reset
                </button>
            </div>

            {/* 5x5 Board */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                {state.board.map((piece, pos) => (
                    <motion.div key={pos}
                        whileHover={!gameOver ? { scale: 1.1 } : {}}
                        whileTap={!gameOver ? { scale: 0.9 } : {}}
                        onClick={() => handleClick(pos)}
                        style={{
                            width: '52px', height: '52px', borderRadius: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: !gameOver ? 'pointer' : 'default',
                            background: selected === pos ? 'rgba(251,191,36,0.25)' : piece ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                            border: selected === pos ? '2px solid #fbbf24' : piece === 'tiger' ? '1px solid rgba(239,68,68,0.4)' : piece === 'goat' ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(255,255,255,0.05)',
                            fontSize: '1.4rem',
                            transition: 'all 0.15s'
                        }}>
                        {piece === 'tiger' ? '🐯' : piece === 'goat' ? '🐐' : '·'}
                    </motion.div>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={message} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    style={{ padding: '0.8rem', borderRadius: '12px', background: gameOver ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.04)', color: gameOver ? '#fbbf24' : 'rgba(255,255,255,0.75)', fontWeight: 600, fontSize: '0.85rem', textAlign: 'center' }}>
                    {message}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
