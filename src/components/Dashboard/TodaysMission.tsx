'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DAILY_QUOTE = {
    text: "Stillness is the language God speaks. Everything else is a bad translation.",
    author: "Eckhart Tolle",
};

export interface Sankalp { id: string; text: string; done: boolean; }

export interface TodaysMissionProps {
    items: Sankalp[];
    onToggle: (id: string) => void;
    onRemove: (id: string) => void;
    onAdd: (text: string) => void;
    variant?: 'vedic' | 'nature';
    isFullScreen?: boolean;
    onExpand?: () => void;
}

export default function TodaysMission({
    items,
    onToggle,
    onRemove,
    onAdd,
    isFullScreen = false,
    onExpand,
}: TodaysMissionProps) {
    const [draft, setDraft] = useState('');
    const [adding, setAdding] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const done = items.filter(s => s.done).length;

    const add = () => {
        if (!draft.trim()) return;
        onAdd(draft.trim());
        setDraft('');
        setAdding(false);
    };

    return (
        <div
            className={`relative w-full overflow-hidden rounded-none ${isFullScreen ? 'h-full' : 'h-[calc(100vh-80px)]'}`}
            onClick={onExpand}
        >
            {/* 1. Full-Bleed Background Image */}
            <img
                src="https://picsum.photos/1080/1920?nature,calm"
                className="absolute inset-0 w-full h-full object-cover z-0 rounded-none pointer-events-none"
                alt="Nature Background"
            />

            {/* 2. Delicate Top Insight */}
            <div className="absolute top-0 left-0 w-full z-20 pt-16 px-8 flex flex-col items-center bg-gradient-to-b from-black/50 to-transparent pb-10 pointer-events-none">
                <div className="text-white/80 text-center">
                    <p className="font-serif italic text-sm md:text-base leading-relaxed drop-shadow-md">
                        "{DAILY_QUOTE.text}"
                    </p>
                    <p className="text-[10px] tracking-widest uppercase mt-3 text-white/50">{DAILY_QUOTE.author}</p>
                </div>
            </div>

            {onExpand && (
                <button
                    className="absolute top-16 right-6 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center text-xl z-30"
                    onClick={onExpand}
                    aria-label="Exit full screen"
                >
                    ✕
                </button>
            )}

            {/* Swipe Up Cue if full-screen */}
            {isFullScreen && (
                <div className="absolute top-[40%] left-0 w-full flex flex-col items-center gap-1 z-10 pointer-events-none opacity-80">
                    <span className="text-white text-lg animate-bounce drop-shadow-md">↑</span>
                    <span className="font-sans text-[0.65rem] text-white/80 tracking-widest uppercase font-medium drop-shadow-md">Scroll for Vibes</span>
                </div>
            )}

            {/* 3. Bottom Anchored Sankalpa */}
            <div
                className="absolute bottom-0 left-0 w-full z-20 px-5 pb-24 bg-gradient-to-t from-[#14120E] via-[#14120E]/90 to-transparent pt-16"
                onClick={e => e.stopPropagation()} // prevent expanding when tapping tasks
            >
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h2 className="text-2xl text-orange-300 font-serif font-medium flex items-center gap-2 drop-shadow-md">
                            <span className="text-xl drop-shadow-md">🪔</span> Today's Sankalpa
                        </h2>
                        <p className="text-white/50 text-sm mt-1 drop-shadow-sm">
                            {isMounted ? done : 0}/{isMounted ? (items.length || 1) : 1} intentions fulfilled
                        </p>
                    </div>
                    {!adding && (
                        <button
                            className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-xl font-light hover:bg-orange-200 transition-colors shadow-lg"
                            onClick={() => setAdding(true)}
                        >
                            +
                        </button>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <AnimatePresence initial={false}>
                        {isMounted && items.map(item => (
                            <motion.div
                                key={item.id}
                                className={`flex items-center p-3 rounded-2xl gap-3 transition-all ${item.done
                                        ? 'bg-white/5 text-white/40 border border-transparent'
                                        : 'bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg'
                                    }`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                transition={{ duration: 0.2 }}
                                layout
                            >
                                <button
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${item.done ? 'bg-orange-400 border-orange-400' : 'border-[#D8D2C4] bg-transparent'
                                        }`}
                                    onClick={() => onToggle(item.id)}
                                >
                                    <motion.span
                                        className="text-white text-xs font-bold drop-shadow-sm"
                                        initial={false}
                                        animate={{ opacity: item.done ? 1 : 0, scale: item.done ? 1 : 0.5 }}
                                    >✓</motion.span>
                                </button>
                                <span className={`flex-1 font-sans text-[0.95rem] font-medium transition-colors ${item.done ? 'line-through decoration-white/30' : 'drop-shadow-sm'
                                    }`}>
                                    {item.text}
                                </span>
                                <button
                                    className="text-[#CFC9BE] hover:text-[#E26D5A] text-xl px-2 opacity-50 hover:opacity-100 transition-opacity"
                                    onClick={() => onRemove(item.id)}
                                >
                                    ×
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    <AnimatePresence>
                        {adding && (
                            <motion.div
                                className="flex items-center gap-2 py-2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <input
                                    className="flex-1 bg-white/10 backdrop-blur-xl border border-white/30 p-3 rounded-2xl font-sans text-[0.95rem] text-white placeholder-white/60 outline-none focus:border-white/60 shadow-lg"
                                    placeholder="E.g., Drink 8 glasses of water 💧"
                                    value={draft}
                                    onChange={e => setDraft(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') add(); if (e.key === 'Escape') setAdding(false); }}
                                    autoFocus
                                />
                                <button className="w-11 h-11 rounded-2xl bg-orange-400 text-white font-bold text-xl flex items-center justify-center hover:bg-orange-500 transition-colors shadow-lg" onClick={add}>+</button>
                                <button className="bg-transparent border-none text-white/50 font-bold ml-1 cursor-pointer hover:text-white" onClick={() => { setAdding(false); setDraft(''); }}>✕</button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
