'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Sankalp { id: string; text: string; done: boolean; }

interface PranaPill {
    id: string;
    text: string;
    icon: string;
    colorClass: string;
    accentColor: string;
    category: string;
    done: boolean;
}

interface MagicSyncModuleProps {
    items: Sankalp[];
    onToggle: (id: string) => void;
    onRemove: (id: string) => void;
    onAdd: (text: string) => void;
}

// ── Gemini 2.5 Flash agentic categorizer ────────────────────────────────────
let _apiKeyCache: string | null = null;

async function categorizeviaGemini(text: string): Promise<{ icon: string; category: string; colorClass: string; accentColor: string }> {
    // Instant keyword fallback (runs immediately while Gemini responds)
    const instant = keywordCategorize(text);

    try {
        // Fetch cached API key
        if (!_apiKeyCache) {
            const res = await fetch('/api/gemini-live-token', { method: 'POST' });
            if (!res.ok) return instant;
            const data = await res.json();
            _apiKeyCache = data.apiKey;
        }

        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(_apiKeyCache!);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `You are a task categorizer for a conscious productivity app. 
Categorize this task into ONE of these: DeepWork, Health, Connection, Creative, Spiritual, Rest.
Also choose the MOST appropriate emoji for this task. Reply in this exact format with NO extra text:
CATEGORY|EMOJI

Task: "${text}"`;

        const result = await model.generateContent(prompt);
        const raw = result.response.text().trim();
        const [cat, emoji] = raw.split('|');
        if (emoji && cat) {
            return mapCategoryToStyle(cat.trim(), emoji.trim());
        }
    } catch (_) {
        // Silently fall back to keyword
    }
    return instant;
}

function keywordCategorize(text: string): { icon: string; category: string; colorClass: string; accentColor: string } {
    const t = text.toLowerCase();
    if (t.includes('code') || t.includes('work') || t.includes('build') || t.includes('debug') || t.includes('write') || t.includes('project') || t.includes('meeting'))
        return mapCategoryToStyle('DeepWork', '💻');
    if (t.includes('meditat') || t.includes('breathe') || t.includes('yoga') || t.includes('pranayam') || t.includes('dhyan') || t.includes('mantra'))
        return mapCategoryToStyle('Spiritual', '🧘');
    if (t.includes('water') || t.includes('exercise') || t.includes('run') || t.includes('walk') || t.includes('eat') || t.includes('sleep') || t.includes('rest') || t.includes('health'))
        return mapCategoryToStyle('Health', '🌿');
    if (t.includes('call') || t.includes('email') || t.includes('meet') || t.includes('friend') || t.includes('family') || t.includes('message'))
        return mapCategoryToStyle('Connection', '🤝');
    if (t.includes('draw') || t.includes('design') || t.includes('music') || t.includes('art') || t.includes('guitar') || t.includes('paint'))
        return mapCategoryToStyle('Creative', '🎨');
    if (t.includes('gratitude') || t.includes('journal') || t.includes('read') || t.includes('book') || t.includes('study') || t.includes('learn'))
        return mapCategoryToStyle('Creative', '📖');
    return mapCategoryToStyle('Spiritual', '✨');
}

function mapCategoryToStyle(category: string, icon: string): { icon: string; category: string; colorClass: string; accentColor: string } {
    const cat = category.trim().toLowerCase();
    if (cat.includes('deep') || cat.includes('work')) return { icon, category: 'Deep Work', colorClass: 'blue', accentColor: 'rgba(96,165,250,0.85)' };
    if (cat.includes('health')) return { icon, category: 'Health', colorClass: 'green', accentColor: 'rgba(110,231,183,0.85)' };
    if (cat.includes('connect')) return { icon, category: 'Connection', colorClass: 'teal', accentColor: 'rgba(45,212,191,0.85)' };
    if (cat.includes('creat') || cat.includes('journal') || cat.includes('book')) return { icon, category: 'Creative', colorClass: 'purple', accentColor: 'rgba(196,181,253,0.85)' };
    if (cat.includes('spirit') || cat.includes('meditat') || cat.includes('dhyan')) return { icon, category: 'Spiritual', colorClass: 'gold', accentColor: 'rgba(251,191,36,0.85)' };
    if (cat.includes('rest') || cat.includes('sleep')) return { icon, category: 'Rest', colorClass: 'pink', accentColor: 'rgba(249,168,212,0.85)' };
    return { icon, category: 'Sattvic', colorClass: 'gold', accentColor: 'rgba(251,191,36,0.85)' };
}

// ── Color map ─────────────────────────────────────────────────────────────────
const COLOR_MAP: Record<string, { text: string; border: string; bg: string }> = {
    blue: { text: 'rgba(147,197,253,0.95)', border: 'rgba(96,165,250,0.30)', bg: 'rgba(30,64,175,0.15)' },
    green: { text: 'rgba(110,231,183,0.95)', border: 'rgba(52,211,153,0.30)', bg: 'rgba(6,78,59,0.15)' },
    teal: { text: 'rgba(94,234,212,0.95)', border: 'rgba(20,184,166,0.30)', bg: 'rgba(19,78,74,0.15)' },
    purple: { text: 'rgba(216,180,254,0.95)', border: 'rgba(167,139,250,0.30)', bg: 'rgba(88,28,135,0.15)' },
    gold: { text: 'rgba(252,211,77,0.95)', border: 'rgba(251,191,36,0.30)', bg: 'rgba(120,53,15,0.15)' },
    pink: { text: 'rgba(249,168,212,0.95)', border: 'rgba(244,114,182,0.30)', bg: 'rgba(131,24,67,0.15)' },
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function MagicSyncModule({ items, onToggle, onRemove, onAdd }: MagicSyncModuleProps) {
    const [inputValue, setInputValue] = useState('');
    const [pills, setPills] = useState<PranaPill[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync props items → pills on mount
    useEffect(() => {
        const initialPills: PranaPill[] = items.map(item => {
            const style = keywordCategorize(item.text);
            return { ...item, icon: style.icon, colorClass: style.colorClass, accentColor: style.accentColor, category: style.category };
        });
        setPills(initialPills);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleKeyDown = useCallback(async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Enter' || !inputValue.trim()) return;
        const text = inputValue.trim();
        setInputValue('');

        // Haptic feedback
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);

        // Optimistic pill with keyword fallback (instant)
        const instantStyle = keywordCategorize(text);
        const newPill: PranaPill = {
            id: Date.now().toString(),
            text,
            ...instantStyle,
            done: false,
        };

        setPills(prev => [newPill, ...prev]);
        onAdd(text);

        // Upgrade with Gemini categorization in background
        categorizeviaGemini(text).then(style => {
            setPills(prev => prev.map(p => p.id === newPill.id ? { ...p, ...style } : p));
        });
    }, [inputValue, onAdd]);

    const handlePillTap = (pill: PranaPill) => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([20, 30, 20]);
        if (pill.done) {
            // Already done — remove
            setPills(prev => prev.filter(p => p.id !== pill.id));
            onRemove(pill.id);
        } else {
            // Mark done
            setPills(prev => prev.map(p => p.id === pill.id ? { ...p, done: true } : p));
            onToggle(pill.id);
            // Remove from list after glow fades
            setTimeout(() => {
                setPills(prev => prev.filter(p => p.id !== pill.id));
            }, 700);
        }
    };

    const donePct = pills.length > 0 ? Math.round((pills.filter(p => p.done).length / pills.length) * 100) : 0;

    return (
        <div style={{
            width: '100%',
            maxWidth: 680,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.7rem',
            padding: '0 0.8rem',
            maxHeight: '25vh',
            overflow: 'hidden',
        }}>
            {/* ── Header row ─────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(251,191,36,0.70)' }}>
                        ⟐ SYNC ENGINE
                    </span>
                </div>
                {pills.length > 0 && (
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                        {pills.filter(p => p.done).length}/{pills.length} aligned · {donePct}%
                    </span>
                )}
            </div>

            {/* ── Magic Input ────────────────────────── */}
            <motion.div layout style={{ position: 'relative' }} className="group">
                {/* Glow aura behind input */}
                <motion.div
                    animate={isTyping ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    style={{
                        position: 'absolute', inset: -10,
                        borderRadius: 999,
                        background: 'radial-gradient(ellipse, rgba(251,146,60,0.22) 0%, transparent 70%)',
                        filter: 'blur(14px)',
                        pointerEvents: 'none',
                        zIndex: 0,
                    }}
                />
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                    placeholder="What is your primary intention today?"
                    style={{
                        position: 'relative', zIndex: 1,
                        width: '100%',
                        background: 'rgba(255,255,255,0.08)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: `1px solid ${isTyping ? 'rgba(251,146,60,0.45)' : 'rgba(255,255,255,0.14)'}`,
                        borderRadius: 999,
                        padding: '0.7rem 3.5rem 0.7rem 1.4rem',
                        color: 'rgba(255,255,255,0.92)',
                        fontSize: '0.88rem',
                        fontWeight: 300,
                        letterSpacing: '0.01em',
                        outline: 'none',
                        transition: 'border-color 0.3s ease, background 0.3s ease',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit',
                    }}
                />
                {/* SYNC label inside input */}
                <span style={{
                    position: 'absolute', right: '1.1rem', top: '50%', transform: 'translateY(-50%)',
                    fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.18em',
                    color: 'rgba(255,255,255,0.22)', pointerEvents: 'none', zIndex: 2,
                    textTransform: 'uppercase',
                }}>SYNC</span>
            </motion.div>

            {/* ── Prana Pills (horizontal wrap) ──────── */}
            <motion.div
                layout
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.45rem',
                    alignItems: 'flex-start',
                    minHeight: pills.length > 0 ? 28 : 0,
                    overflow: 'hidden',
                }}
            >
                <AnimatePresence mode="popLayout">
                    {pills.filter(p => !p.done).map(pill => {
                        const colors = COLOR_MAP[pill.colorClass] || COLOR_MAP.gold;
                        return (
                            <motion.button
                                key={pill.id}
                                layout
                                initial={{ opacity: 0, scale: 0.7, y: -12, filter: 'blur(8px)' }}
                                animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, scale: 0.7, filter: 'blur(12px)', boxShadow: '0 0 20px rgba(255,200,50,0.6)' }}
                                transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                                onClick={() => handlePillTap(pill)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                    background: colors.bg,
                                    backdropFilter: 'blur(12px)',
                                    WebkitBackdropFilter: 'blur(12px)',
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: 999,
                                    padding: '0.28rem 0.75rem 0.28rem 0.55rem',
                                    cursor: 'pointer',
                                    color: colors.text,
                                    fontSize: '0.72rem',
                                    fontWeight: 500,
                                    letterSpacing: '0.01em',
                                    fontFamily: 'inherit',
                                    whiteSpace: 'nowrap' as const,
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                <span style={{ fontSize: '0.85rem' }}>{pill.icon}</span>
                                <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {pill.text}
                                </span>
                                <span style={{ opacity: 0.45, fontSize: '0.62rem', marginLeft: 2 }}>×</span>
                            </motion.button>
                        );
                    })}
                </AnimatePresence>

                {pills.length === 0 && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.25)', fontStyle: 'italic', paddingLeft: '0.3rem' }}
                    >
                        Type an intention above and press Enter to sync it
                    </motion.span>
                )}
            </motion.div>
        </div>
    );
}
