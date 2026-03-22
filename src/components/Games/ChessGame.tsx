"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Chess, Move } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { RotateCcw } from 'lucide-react';

export default function ChessGame() {
    const [game, setGame] = useState(new Chess());
    const [difficulty, setDifficulty] = useState<'easy' | 'random'>('random');

    // We keep track of timeout to clear it heavily to prevent rapid memory leaks if component unmounts
    const moveTimeout = useRef<NodeJS.Timeout | null>(null);

    // Simple random bot implementation
    function makeBotMove(currentGame: Chess) {
        const possibleMoves = currentGame.moves();
        if (currentGame.isGameOver() || currentGame.isDraw() || possibleMoves.length === 0) return;

        const randomIndex = Math.floor(Math.random() * possibleMoves.length);
        const nextGame = new Chess(currentGame.fen());
        nextGame.move(possibleMoves[randomIndex]);
        setGame(nextGame);
    }

    function onDrop({ sourceSquare, targetSquare }: { sourceSquare: string, targetSquare: string | null }) {
        if (!targetSquare) return false;
        try {
            const nextGame = new Chess(game.fen());
            const moveInfo = {
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q', // auto-promote to Queen
            };

            const move = nextGame.move(moveInfo);
            // illegal move
            if (move === null) return false;

            setGame(nextGame);

            // Allow state to update locally, then trigger bot
            if (moveTimeout.current) clearTimeout(moveTimeout.current);
            moveTimeout.current = setTimeout(() => makeBotMove(nextGame), 400); // add a slight human delay

            return true;
        } catch (err) {
            return false;
        }
    }

    const resetGame = () => {
        if (moveTimeout.current) clearTimeout(moveTimeout.current);
        setGame(new Chess());
    };

    let status = 'Your Turn! Play as White.';
    if (game.isCheckmate()) {
        status = game.turn() === 'w' ? 'Checkmate. You lost!' : 'Checkmate. You won!';
    } else if (game.isDraw()) {
        status = 'Draw!';
    } else if (game.turn() === 'b') {
        status = 'Opponent is thinking...';
    }

    return (
        <div style={{
            padding: '1.5rem', background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1.2rem' }}>
                <h3 style={{ margin: 0, color: '#fbbf24', fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 'bold' }}>Shatranj</h3>
                <button
                    onClick={resetGame}
                    title="Reset Board"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                    <RotateCcw size={16} />
                </button>
            </div>

            <div style={{ width: '100%', maxWidth: '350px', background: 'rgba(0,0,0,0.5)', borderRadius: '6px', padding: '6px' }}>
                <Chessboard
                    options={{
                        position: game.fen(),
                        onPieceDrop: onDrop,
                        darkSquareStyle: { backgroundColor: '#779556' },
                        lightSquareStyle: { backgroundColor: '#ebecd0' },
                        animationDurationInMs: 200
                    }}
                />
            </div>

            <div style={{ marginTop: '1rem', fontSize: '0.85rem', fontWeight: '600', color: game.isCheckmate() ? '#ef4444' : '#a7f3d0', textAlign: 'center', height: '1.2rem' }}>
                {status}
            </div>
        </div>
    );
}
