'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Star, BookOpen, Sparkles, ChevronRight } from 'lucide-react';
import { useLifestyleEngine } from '@/hooks/useLifestyleEngine';
import { getToday } from '@/stores/lifestyleStore';

// ─── Journal prompts ────────────────────────────────────────────────────────────

const MORNING_PROMPTS = [
    'What is the one thing that, if done today, would make everything else easier?',
    'Who am I choosing to be today? What is one small way I can embody that?',
    'What is a limiting belief I am releasing today, and what replaces it?',
    'If I were fully at peace right now, what would I focus on today?',
    'What would make today feel truly alive, not just productive?',
    'What am I grateful for right now, in this exact moment?',
    'What is my body telling me it needs today?',
    'If this day were a gift to my future self, what would I put in it?',
];

const EVENING_PROMPTS = [
    'What happened today that I am genuinely proud of, no matter how small?',
    'Where did I feel most alive today? And least alive?',
    'What did I learn — about the world, about myself?',
    'Where did I resist, and what was underneath that resistance?',
    'Who showed up for me today? Who did I show up for?',
    'What would I do differently tomorrow?',
    'What emotion am I carrying from today that I need to release before sleep?',
    'If today was a chapter in my story, what was its title?',
];

const FREE_PROMPTS = [
    'What is on my heart right now that I have not said out loud?',
    'What would I write if no one would ever read this?',
    'What is the most honest thing I can say about where I am in life right now?',
    'What am I afraid of? What is actually true about that fear?',
    'Describe a version of your life one year from now that feels absolutely right.',
    'What is a conversation you need to have — with yourself or someone else?',
    'What would you tell the 15-year-old version of you?',
    'Where in your life are you playing small, and why?',
];

// ─── Journal Entry Form ─────────────────────────────────────────────────────────

function JournalWriteForm({
    type, prompts, onSave, onCancel,
}: {
    type: 'morning' | 'evening' | 'free';
    prompts: string[];
    onSave: (content: string, tags: string[]) => void;
    onCancel: () => void;
}) {
    const [content, setContent] = useState('');
    const [usedPrompt, setUsedPrompt] = useState(() => prompts[Math.floor(Math.random() * prompts.length)]);
    const [isStarred, setIsStarred] = useState(false);
    const TAGS = ['growth', 'gratitude', 'clarity', 'challenge', 'emotion', 'insight', 'relationship', 'work', 'spiritual', 'health'];
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const colorMap = { morning: '#fbbf24', evening: '#818cf8', free: '#4ade80' };
    const color = colorMap[type];
    const iconMap = { morning: '🌅', evening: '🌙', free: '✍️' };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: '1rem 0' }}>

            {/* Type badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.2rem' }}>{iconMap[type]}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color, fontFamily: "'Outfit', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {type === 'morning' ? 'Morning Pages' : type === 'evening' ? 'Evening Reflection' : 'Free Writing'}
                </span>
            </div>

            {/* Prompt card */}
            <div style={{
                padding: '1rem', borderRadius: 14, marginBottom: '1rem',
                background: `${color}0c`, border: `1px solid ${color}28`,
                borderLeft: `3px solid ${color}66`,
            }}>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>Today&rsquo;s prompt</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.78)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.6, fontStyle: 'italic' }}>
                    &ldquo;{usedPrompt}&rdquo;
                </p>
                <button
                    onClick={() => setUsedPrompt(prompts[Math.floor(Math.random() * prompts.length)])}
                    style={{ background: 'none', border: 'none', color, fontSize: '0.65rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif", cursor: 'pointer', padding: '0.35rem 0 0', letterSpacing: '0.05em' }}>
                    Different prompt ↻
                </button>
            </div>

            {/* Writing area */}
            <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Begin writing... let it flow without editing. This space is yours."
                rows={10}
                autoFocus
                style={{
                    width: '100%', padding: '1rem', borderRadius: 14,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', fontSize: '0.88rem', fontFamily: "'Georgia', serif",
                    resize: 'none', outline: 'none', boxSizing: 'border-box',
                    lineHeight: 1.8, marginBottom: '1rem',
                    caretColor: color,
                }}
            />

            {/* Word count */}
            <p style={{ margin: '0 0 0.85rem', fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)', fontFamily: "'Outfit', sans-serif", textAlign: 'right' }}>
                {content.trim().split(/\s+/).filter(Boolean).length} words
            </p>

            {/* Tags */}
            <div style={{ marginBottom: '1rem' }}>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>Tags (optional)</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {TAGS.map(t => (
                        <motion.button key={t} whileTap={{ scale: 0.88 }}
                            onClick={() => setSelectedTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])}
                            style={{
                                padding: '0.25rem 0.6rem', borderRadius: 999, cursor: 'pointer', fontSize: '0.65rem',
                                fontFamily: "'Outfit', sans-serif", fontWeight: 600,
                                background: selectedTags.includes(t) ? `${color}18` : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${selectedTags.includes(t) ? color + '55' : 'rgba(255,255,255,0.09)'}`,
                                color: selectedTags.includes(t) ? color : 'rgba(255,255,255,0.4)',
                            }}>{t}</motion.button>
                    ))}
                </div>
            </div>

            {/* Star toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => setIsStarred(!isStarred)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: 0 }}>
                    <Star size={16} style={{ color: isStarred ? '#fbbf24' : 'rgba(255,255,255,0.2)', fill: isStarred ? '#fbbf24' : 'none' }} />
                    <span style={{ fontSize: '0.72rem', color: isStarred ? '#fbbf24' : 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>Star this entry</span>
                </motion.button>
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', gap: '0.6rem' }}>
                <motion.button whileTap={{ scale: 0.96 }} onClick={onCancel}
                    style={{ flex: 1, padding: '0.85rem', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif", cursor: 'pointer' }}>
                    Cancel
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => content.trim() && onSave(content.trim(), selectedTags)}
                    disabled={!content.trim()}
                    style={{
                        flex: 2, padding: '0.85rem', borderRadius: 12,
                        background: content.trim() ? `linear-gradient(135deg, ${color}, ${color}88)` : 'rgba(255,255,255,0.08)',
                        border: 'none', color: content.trim() ? '#000' : 'rgba(255,255,255,0.3)',
                        fontWeight: 800, fontSize: '0.88rem', fontFamily: "'Outfit', sans-serif",
                        cursor: content.trim() ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    }}>
                    <Sparkles size={15} /> Save Entry
                </motion.button>
            </div>
        </motion.div>
    );
}

// ─── Entry Card ─────────────────────────────────────────────────────────────────

function EntryCard({ entry, onClick }: { entry: { id: string; type: string; date: string; content: string; isStarred?: boolean; tags?: string[] }; onClick: () => void }) {
    const colorMap: Record<string, string> = { morning: '#fbbf24', evening: '#818cf8', free: '#4ade80' };
    const color = colorMap[entry.type] ?? '#a78bfa';
    const preview = entry.content.slice(0, 120) + (entry.content.length > 120 ? '…' : '');

    return (
        <motion.div whileTap={{ scale: 0.98 }} onClick={onClick}
            style={{ padding: '0.9rem 1rem', borderRadius: 14, background: `${color}08`, border: `1px solid ${color}22`, marginBottom: '0.6rem', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, color, fontFamily: "'Outfit', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>{entry.type}</span>
                    {entry.isStarred && <Star size={12} style={{ color: '#fbbf24', fill: '#fbbf24' }} />}
                </div>
                <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', fontFamily: "'Outfit', sans-serif" }}>{entry.date}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)', fontFamily: "'Georgia', serif", lineHeight: 1.6 }}>{preview}</p>
            {entry.tags && entry.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {entry.tags.slice(0, 3).map(t => (
                        <span key={t} style={{ padding: '0.15rem 0.45rem', borderRadius: 999, fontSize: '0.58rem', background: `${color}14`, color, fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>{t}</span>
                    ))}
                </div>
            )}
        </motion.div>
    );
}

// ─── Full Entry View ────────────────────────────────────────────────────────────

function FullEntryView({ entry, onClose }: { entry: { id: string; type: string; date: string; content: string; isStarred?: boolean; tags?: string[] }; onClose: () => void }) {
    const colorMap: Record<string, string> = { morning: '#fbbf24', evening: '#818cf8', free: '#4ade80' };
    const color = colorMap[entry.type] ?? '#a78bfa';

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(2,1,10,0.97)', overflowY: 'auto', padding: '1.5rem 1.25rem 4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, padding: 0, fontSize: '0.8rem', fontFamily: "'Outfit', sans-serif" }}>
                    <ArrowLeft size={16} /> Back
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.62rem', color, fontWeight: 700, fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase', letterSpacing: '0.1em' }}>{entry.type}</span>
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', fontFamily: "'Outfit', sans-serif" }}>· {entry.date}</span>
                </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.92rem', color: 'rgba(255,255,255,0.8)', fontFamily: "'Georgia', serif", lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{entry.content}</p>
            {entry.tags && entry.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
                    {entry.tags.map(t => (
                        <span key={t} style={{ padding: '0.25rem 0.65rem', borderRadius: 999, fontSize: '0.65rem', background: `${color}14`, color, fontFamily: "'Outfit', sans-serif", fontWeight: 600, border: `1px solid ${color}33` }}>{t}</span>
                    ))}
                </div>
            )}
        </motion.div>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function JournalPage() {
    const router = useRouter();
    const { journalEntries, saveJournalEntry } = useLifestyleEngine();
    const [writeMode, setWriteMode] = useState<'morning' | 'evening' | 'free' | null>(null);
    const [viewEntry, setViewEntry] = useState<typeof journalEntries[0] | null>(null);
    const [filter, setFilter] = useState<'all' | 'morning' | 'evening' | 'free' | 'starred'>('all');
    const [savedFlash, setSavedFlash] = useState(false);

    const today = getToday();
    const todayEntries = journalEntries.filter(e => e.date === today);

    const handleSave = useCallback((content: string, tags: string[]) => {
        if (!writeMode) return;
        saveJournalEntry({ type: writeMode, content, tags, prompts: [] });
        setWriteMode(null);
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 3000);
    }, [writeMode, saveJournalEntry]);

    const filteredEntries = journalEntries.filter(e => {
        if (filter === 'all') return true;
        if (filter === 'starred') return e.isStarred;
        return e.type === filter;
    });

    const getPrompts = (type: 'morning' | 'evening' | 'free') => {
        if (type === 'morning') return MORNING_PROMPTS;
        if (type === 'evening') return EVENING_PROMPTS;
        return FREE_PROMPTS;
    };

    const WRITE_OPTIONS = [
        { type: 'morning' as const, label: 'Morning Pages', icon: '🌅', desc: 'Set the tone for the day', color: '#fbbf24' },
        { type: 'evening' as const, label: 'Evening Reflection', icon: '🌙', desc: 'Process and integrate the day', color: '#818cf8' },
        { type: 'free' as const, label: 'Free Write', icon: '✍️', desc: 'Stream of consciousness', color: '#4ade80' },
    ];

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(ellipse at 20% 0%, rgba(74,222,128,0.07) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(168,85,247,0.07) 0%, transparent 50%), #030110',
            paddingBottom: '4rem',
            fontFamily: "'Outfit', sans-serif",
        }}>
            <AnimatePresence>
                {viewEntry && <FullEntryView entry={viewEntry} onClose={() => setViewEntry(null)} />}
            </AnimatePresence>

            {/* Header */}
            <div style={{ padding: '1.25rem 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button onClick={() => writeMode ? setWriteMode(null) : router.back()}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, padding: 0 }}>
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>Sacred Journal</h1>
                    <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>
                        {journalEntries.length} {journalEntries.length === 1 ? 'entry' : 'entries'} · {todayEntries.length} today
                    </p>
                </div>
            </div>

            <div style={{ padding: '1.25rem' }}>
                {/* Save flash */}
                <AnimatePresence>
                    {savedFlash && (
                        <motion.div key="flash" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            style={{ padding: '0.75rem 1rem', borderRadius: 12, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Sparkles size={14} style={{ color: '#4ade80' }} />
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontFamily: "'Outfit', sans-serif" }}>Entry saved. Words are seeds. 🌱</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {/* Write mode */}
                    {writeMode && (
                        <motion.div key="write" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <JournalWriteForm type={writeMode} prompts={getPrompts(writeMode)} onSave={handleSave} onCancel={() => setWriteMode(null)} />
                        </motion.div>
                    )}

                    {/* Main view */}
                    {!writeMode && (
                        <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {/* Write options */}
                            <div style={{ marginBottom: '1.25rem' }}>
                                <p style={{ margin: '0 0 0.65rem', fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.12em', textTransform: 'uppercase' }}>Begin writing</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {WRITE_OPTIONS.map(opt => {
                                        const doneToday = todayEntries.some(e => e.type === opt.type);
                                        return (
                                            <motion.div key={opt.type} whileTap={{ scale: 0.97 }}
                                                onClick={() => setWriteMode(opt.type)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.85rem',
                                                    padding: '0.9rem 1rem', borderRadius: 16,
                                                    background: `${opt.color}0a`, border: `1px solid ${opt.color}28`, cursor: 'pointer',
                                                }}>
                                                <span style={{ fontSize: '1.4rem' }}>{opt.icon}</span>
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontFamily: "'Outfit', sans-serif" }}>{opt.label}</p>
                                                    <p style={{ margin: 0, fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>{opt.desc}</p>
                                                </div>
                                                {doneToday ? (
                                                    <span style={{ fontSize: '0.62rem', color: opt.color, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>✓ done</span>
                                                ) : (
                                                    <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.2)' }} />
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Past entries */}
                            {journalEntries.length > 0 && (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                                        <p style={{ margin: 0, fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.12em', textTransform: 'uppercase' }}>Past entries</p>
                                    </div>

                                    {/* Filter tabs */}
                                    <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem', scrollbarWidth: 'none' }}>
                                        {(['all', 'morning', 'evening', 'free', 'starred'] as const).map(f => (
                                            <motion.button key={f} whileTap={{ scale: 0.88 }}
                                                onClick={() => setFilter(f)}
                                                style={{ flexShrink: 0, padding: '0.28rem 0.65rem', borderRadius: 999, cursor: 'pointer', background: filter === f ? 'rgba(168,85,247,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${filter === f ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.08)'}`, color: filter === f ? '#c084fc' : 'rgba(255,255,255,0.38)', fontSize: '0.63rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif", textTransform: 'capitalize' }}>{f}</motion.button>
                                        ))}
                                    </div>

                                    {filteredEntries.length === 0 ? (
                                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', fontFamily: "'Outfit', sans-serif", textAlign: 'center', padding: '1.5rem' }}>No entries here yet.</p>
                                    ) : (
                                        filteredEntries.map(entry => (
                                            <EntryCard key={entry.id} entry={entry} onClick={() => setViewEntry(entry)} />
                                        ))
                                    )}
                                </div>
                            )}

                            {journalEntries.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                                    <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📔</p>
                                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', fontFamily: "'Outfit', sans-serif", lineHeight: 1.6 }}>
                                        Your sacred journal awaits its first words.<br />Every great life begins with someone writing down their truth.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
