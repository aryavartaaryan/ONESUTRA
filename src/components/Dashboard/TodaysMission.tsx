'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCircadianBackground } from '@/hooks/useCircadianBackground';
import { useHalfHourImage } from '@/hooks/useHalfHourImage';
import styles from './TodaysMission.module.css';

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
    variant = 'nature',
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

    // In Home Page (not full screen), use classic circadian.
    // In Reels (full screen), use our stunning 30-min Unsplash wallpapers.
    const circadian = useCircadianBackground(variant);
    const halfHour = useHalfHourImage();
    const imageUrl = isFullScreen ? halfHour.imageUrl : circadian.imageUrl;
    const loaded = isFullScreen ? halfHour.loaded : circadian.loaded;

    const add = () => {
        if (!draft.trim()) return;
        onAdd(draft.trim());
        setDraft('');
        setAdding(false);
    };

    const cardContent = (
        <div
            className={isFullScreen ? styles.innerCard : ''}
            onClick={e => e.stopPropagation()}
        >
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.headerIcon}>🪔</div>
                    <div className={styles.titles}>
                        <span className={`${styles.title} ${isFullScreen ? styles.titleFull : ''}`}>
                            {isFullScreen ? "Today's Sankalpa" : "Today's Sankalpa"}
                        </span>
                        <span className={`${styles.subtext} ${isFullScreen ? styles.subtextFull : ''}`}>
                            {isMounted ? done : 0}/{isMounted ? (items.length || 1) : 1} intentions fulfilled
                        </span>
                    </div>
                </div>
                {!adding && (
                    <button className={styles.addBtn} onClick={() => setAdding(true)} aria-label="Add Sankalpa">
                        +
                    </button>
                )}
            </div>

            <div className={styles.list}>
                <AnimatePresence initial={false}>
                    {isMounted && items.map(item => (
                        <motion.div
                            key={item.id}
                            className={`${styles.item} ${isFullScreen ? styles.itemFull : ''} ${item.done ? styles.itemDone : ''}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                            transition={{ duration: 0.2 }}
                            layout
                        >
                            <button
                                className={styles.checkBtn}
                                onClick={() => onToggle(item.id)}
                            >
                                <span className={styles.checkIcon}>✓</span>
                            </button>
                            <span className={`${styles.text} ${isFullScreen ? styles.textFull : ''}`}>{item.text}</span>
                            <button className={styles.removeBtn} onClick={() => onRemove(item.id)}>×</button>
                        </motion.div>
                    ))}
                </AnimatePresence>

                <AnimatePresence>
                    {adding && (
                        <motion.div
                            className={styles.addRow}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <input
                                className={styles.addInput}
                                placeholder="E.g., Drink 8 glasses of water 💧"
                                value={draft}
                                onChange={e => setDraft(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') add(); if (e.key === 'Escape') setAdding(false); }}
                                autoFocus
                            />
                            <button className={styles.addConfirm} onClick={add}>+</button>
                            <button className={styles.addCancel} onClick={() => { setAdding(false); setDraft(''); }}>✕</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );

    if (isFullScreen) {
        return (
            <div className="relative w-full h-[calc(100vh-80px)] snap-center shrink-0 overflow-hidden" onClick={onExpand}>
                {/* 1. The Background Image */}
                <motion.img
                    src={imageUrl}
                    className="absolute inset-0 w-full h-full object-cover z-0"
                    alt="Nature Background"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: loaded ? 1 : 0 }}
                    transition={{ duration: 1.5 }}
                />

                {/* 2. The Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1C1A17]/95 via-[#1C1A17]/50 to-transparent z-10" />

                {/* 3. The Content (Pushed to the bottom) */}
                <div className="relative z-20 w-full h-full flex flex-col justify-end px-5 pb-24" onClick={(e) => e.stopPropagation()}>
                    <div className="mb-4">
                        <h2 className="text-3xl text-orange-300 font-serif mb-1">Today's Sankalpa</h2>
                        <p className="text-white/70 text-sm font-medium">{isMounted ? done : 0}/{isMounted ? (items.length || 1) : 1} intentions fulfilled</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <AnimatePresence initial={false}>
                            {isMounted && items.map(item => (
                                <motion.div
                                    key={item.id}
                                    className={`flex items-center p-4 rounded-2xl gap-3 transition-all duration-200 border ${item.done ? 'bg-white/5 border-white/5' : 'bg-white/10 backdrop-blur-md border-white/10'}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                    transition={{ duration: 0.2 }}
                                    layout
                                >
                                    <button
                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${item.done ? 'bg-[#D68D3A] border-[#D68D3A]' : 'bg-transparent border-[#D8D2C4]'}`}
                                        onClick={() => onToggle(item.id)}
                                    >
                                        <span className={`text-white text-xs font-bold transition-all duration-200 ${item.done ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>✓</span>
                                    </button>
                                    <span className={`font-medium flex-1 text-sm transition-colors duration-200 ${item.done ? 'text-white/40 line-through decoration-white/30' : 'text-white tracking-wide drop-shadow-md'}`}>{item.text}</span>
                                    <button className="bg-transparent border-none text-white/40 text-lg p-1 hover:text-[#E26D5A] hover:opacity-100 transition-opacity" onClick={() => onRemove(item.id)}>×</button>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        <AnimatePresence>
                            {adding && (
                                <motion.div
                                    className="flex gap-2 items-center py-1 mt-1"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <input
                                        className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl font-sans text-[0.95rem] text-white outline-none placeholder:text-white/50 shadow-inner"
                                        placeholder="E.g., Drink 8 glasses of water 💧"
                                        value={draft}
                                        onChange={e => setDraft(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') add(); if (e.key === 'Escape') setAdding(false); }}
                                        autoFocus
                                    />
                                    <button className="w-[48px] h-[48px] rounded-2xl bg-[#D68D3A] text-white flex items-center justify-center font-bold text-xl shadow-[0_4px_12px_rgba(214,141,58,0.3)] transition-transform active:scale-95" onClick={add}>+</button>
                                    <button className="bg-transparent border-none text-white/50 font-bold ml-1 cursor-pointer hover:text-white" onClick={() => { setAdding(false); setDraft(''); }}>✕</button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!adding && (
                            <div className="mt-2 flex">
                                <button className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-xl font-light border border-white/10 cursor-pointer backdrop-blur-md transition-all active:scale-95" onClick={() => setAdding(true)} aria-label="Add Sankalpa">
                                    +
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex justify-center animate-bounce text-white/50 text-xs tracking-widest uppercase font-medium">
                        ↑ Swipe up for vibes
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container} onClick={onExpand}>
            {cardContent}
        </div>
    );
}
