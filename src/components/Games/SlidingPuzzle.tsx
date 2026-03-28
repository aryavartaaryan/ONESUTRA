"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function SlidingPuzzle() {
  const SIZE = 3;
  const WIN_STATE = [1, 2, 3, 4, 5, 6, 7, 8, 0];
  const [tiles, setTiles] = useState<number[]>(WIN_STATE);
  const [isWon, setIsWon] = useState(false);

  useEffect(() => {
    // Basic shuffle: Since doing true random shuffle might result in an unsolvable 8-puzzle,
    // we make N valid random moves backward from the sorted state to guarantee solvability.
    const currentTiles = [...WIN_STATE];
    let emptyIndex = 8;
    for (let i = 0; i < 100; i++) {
        const row = Math.floor(emptyIndex / SIZE);
        const col = emptyIndex % SIZE;
        const validMoves = [];
        if (row > 0) validMoves.push(emptyIndex - SIZE); // up
        if (row < SIZE - 1) validMoves.push(emptyIndex + SIZE); // down
        if (col > 0) validMoves.push(emptyIndex - 1); // left
        if (col < SIZE - 1) validMoves.push(emptyIndex + 1); // right
        
        const move = validMoves[Math.floor(Math.random() * validMoves.length)];
        // swap
        [currentTiles[emptyIndex], currentTiles[move]] = [currentTiles[move], currentTiles[emptyIndex]];
        emptyIndex = move;
    }
    setTiles(currentTiles);
  }, []);

  const moveTile = (index: number) => {
    if (isWon) return;
    const emptyIndex = tiles.indexOf(0);
    const row = Math.floor(index / SIZE);
    const col = index % SIZE;
    const empRow = Math.floor(emptyIndex / SIZE);
    const empCol = emptyIndex % SIZE;

    if (Math.abs(row - empRow) + Math.abs(col - empCol) === 1) {
      const newTiles = [...tiles];
      [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];
      setTiles(newTiles);
      if (newTiles.join(",") === WIN_STATE.join(",")) {
        setIsWon(true);
      }
    }
  };

  return (
    <div style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
      <h3 style={{ margin: '0 0 1.2rem', color: '#fbbf24', fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 'bold' }}>Sattvik Sliding Puzzle</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', width: '220px', margin: '0 auto' }}>
        {tiles.map((t, index) => (
          <motion.div
            layout
            key={t}
            onClick={() => moveTile(index)}
            whileHover={t !== 0 ? { scale: 1.05 } : {}}
            whileTap={t !== 0 ? { scale: 0.95 } : {}}
            style={{
              width: '68px', height: '68px', 
              background: t === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', fontWeight: '700', borderRadius: '12px', 
              cursor: t === 0 ? 'default' : 'pointer',
              border: t === 0 ? 'none' : '1px solid rgba(255, 255, 255, 0.25)',
              color: '#fef3c7',
              boxShadow: t === 0 ? 'none' : 'inset 0 2px 4px rgba(255,255,255,0.1)'
            }}
          >
            {t !== 0 && t}
          </motion.div>
        ))}
      </div>
      
      {isWon && (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ color: '#a7f3d0', marginTop: '1.2rem', fontWeight: '700', letterSpacing: '0.05em' }}
        >
            ✨ Puzzle Solved! ✨
        </motion.div>
      )}
    </div>
  );
}
