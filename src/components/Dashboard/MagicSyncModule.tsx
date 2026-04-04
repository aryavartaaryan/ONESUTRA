'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBodhiChatStore } from '@/stores/bodhiChatStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clock, Check, X, ChevronRight, Brain, Calendar, ChevronLeft, LayoutGrid, Mic, MicOff, Send } from 'lucide-react';
import { getFirebaseAuth } from '@/lib/firebase';
import { getFirebaseFirestore } from '@/lib/firebase';

// ── Types ──────────────────────────────────────────────────────────────────
export interface Sankalp { id: string; text: string; done: boolean; }

export type ItemType = 'task' | 'challenge' | 'issue' | 'idea';
export type BodhiChatState = 'idle' | 'thinking' | 'speaking';

export interface ChatMessage {
    id: string;
    role: 'user' | 'bodhi';
    text: string;
    ts: number;
    itemType?: ItemType;
    saved?: boolean;
}

export interface TaskItem {
    id: string;
    text: string;
    icon: string;
    colorClass: string;
    accentColor: string;
    category: string;
    done: boolean;
    scheduledDate?: string;   // ISO date string  "2026-03-03"
    scheduledTime?: string;   // "3:00 PM"
    aiAdvice?: string;
    createdAt: number;        // epoch ms
    uid?: string;
}

interface MagicSyncModuleProps {
    items: TaskItem[];
    onToggle: (id: string) => void;
    onRemove: (id: string) => void;
    onAdd: (task: TaskItem) => void;
    onUpdate: (id: string, updates: Partial<TaskItem>) => void;
}

// ── Item type detection ────────────────────────────────────────────────────
function detectItemType(text: string): ItemType {
    const t = text.toLowerCase();
    if (t.match(/challeng|struggle|difficult|hard time|obstacle|facing|stuck on|can't figure|cannot figure/)) return 'challenge';
    if (t.match(/issue|bug|error|broken|not working|fails|crash|problem with|trouble with/)) return 'issue';
    if (t.match(/idea|what if|could we|imagine|concept|thinking about|want to create|what about|maybe we/)) return 'idea';
    return 'task';
}

// ── Bodhi system prompt helper ──────────────────────────────────────────────
async function bodhiChatResponse(
    userMessage: string,
    history: ChatMessage[],
    currentTasks: TaskItem[],
    itemSaved: boolean,
    itemType: ItemType
): Promise<string> {
    const apiKey = await fetchApiKey();
    if (!apiKey) return fallbackBodhiResponse(itemType);
    try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: 'gemini-2.5-flash' });
        const recentHistory = history.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'Bodhi'}: ${m.text}`).join('\n');
        const tasksList = currentTasks.filter(t => !t.done).slice(0, 5).map((t, i) => `${i + 1}. ${t.text} [${t.category}]`).join('\n') || '(None yet)';
        const prompt = `You are Sakha Bodhi — a warm, wise Vedic AI guide inside OneSUTRA Life OS.\n\nThe user just said: "${userMessage}"\n${itemSaved ? `→ This was saved as a ${itemType} in their life planner.` : ''}\n\nRecent conversation:\n${recentHistory || '(First message)'}\n\nUser's active items (${currentTasks.filter(t => !t.done).length} pending):\n${tasksList}\n\nYour response rules:\n- Max 2 short sentences (40 words max) — this is spoken via TTS\n- Be warm like a wise older sibling, never corporate\n- Acknowledge what they said specifically\n- If challenge: acknowledge difficulty, give a reframe\n- If issue: be practical and calming\n- If idea: be genuinely enthusiastic\n- If task: give one quick Vedic productivity tip\n- No markdown, no lists, speak naturally as if talking\n\nRespond as Bodhi:`;
        const result = await model.generateContent(prompt);
        return result.response.text().trim().replace(/[*_#`]/g, '').slice(0, 220);
    } catch { return fallbackBodhiResponse(itemType); }
}

function fallbackBodhiResponse(itemType: ItemType): string {
    if (itemType === 'challenge') return "Every challenge is a Guru in disguise. I've saved it — sit with it, then break it into one small first step.";
    if (itemType === 'issue') return "Noted and saved. Take a breath — most issues shrink after a clear mind and one direct action.";
    if (itemType === 'idea') return "Beautiful spark! I've captured this idea — let it breathe, revisit tomorrow with fresh eyes.";
    return "Saved with intention. Begin when you feel the first drop of energy, however small.";
}

// ── TTS helper ──────────────────────────────────────────────────────────────
function speakWithTTS(text: string, onEnd: () => void): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) { onEnd(); return; }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.90; utter.pitch = 1.05; utter.volume = 1;
    const setVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        const pick = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('male') && !v.name.includes('Zira'))
            || voices.find(v => v.lang === 'en-IN')
            || voices.find(v => v.lang.startsWith('en-US') && !v.name.includes('Zira'))
            || voices[0];
        if (pick) utter.voice = pick;
    };
    setVoice();
    utter.onend = onEnd; utter.onerror = onEnd;
    window.speechSynthesis.speak(utter);
}

// ── Gemini helpers ─────────────────────────────────────────────────────────
let _apiKeyCache: string | null = null;
async function fetchApiKey(): Promise<string | null> {
    if (_apiKeyCache) return _apiKeyCache;
    try { const r = await fetch('/api/gemini-live-token', { method: 'POST' }); if (!r.ok) return null; const d = await r.json(); _apiKeyCache = d.apiKey; return _apiKeyCache; } catch { return null; }
}

async function categorizeViaGemini(text: string) {
    const instant = keywordCategorize(text);
    try {
        const apiKey = await fetchApiKey(); if (!apiKey) return instant;
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: 'gemini-2.5-flash' });
        const raw = (await model.generateContent(`Categorize into ONE: DeepWork, Health, Connection, Creative, Spiritual, Rest. Reply ONLY as CATEGORY|EMOJI\nTask: "${text}"`)).response.text().trim();
        const [cat, emoji] = raw.split('|');
        if (emoji && cat) return mapCategoryToStyle(cat.trim(), emoji.trim());
    } catch { /* fallback */ }
    return instant;
}

async function getAIAdvice(text: string, category: string): Promise<string> {
    try {
        const apiKey = await fetchApiKey(); if (!apiKey) return localAdvice(category);
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: 'gemini-2.5-flash' });
        const advice = (await model.generateContent(
            `You are a calm Vedic productivity AI coach. Give ONE short actionable tip (max 20 words, specific, warm) for completing this task efficiently.\nTask: "${text}"\nCategory: ${category}`
        )).response.text().trim().replace(/[*_#`]/g, '').slice(0, 120);
        return advice;
    } catch { return localAdvice(category); }
}

function localAdvice(cat: string): string {
    const m: Record<string, string> = { 'Deep Work': 'Block 90 min. Start with the hardest part first — momentum is everything.', Health: 'Do it right after this session. The body moves when the mind clears first.', Spiritual: 'Morning practice compounds daily. Even 10 minutes reshapes your whole day.', Creative: 'Begin without judging. The muse always arrives after you start.', Connection: 'Be fully present — one genuine moment matters more than the perfect words.', Rest: 'Rest is Prāna recovery. Protect it like your most important meeting.' };
    return m[cat] || 'Begin now. Done imperfectly beats waiting for perfect conditions.';
}

function keywordCategorize(text: string) {
    const t = text.toLowerCase();
    if (t.match(/code|work|build|debug|report|project|meeting|email|review|call/)) return mapCategoryToStyle('DeepWork', '💻');
    if (t.match(/meditat|breathe|yoga|pranayam|dhyan|mantra|puja|aarti/)) return mapCategoryToStyle('Spiritual', '🧘');
    if (t.match(/water|exercise|run|walk|gym|eat|sleep|rest|health|cook|meal/)) return mapCategoryToStyle('Health', '🌿');
    if (t.match(/friend|family|message|connect|talk|birthday|visit/)) return mapCategoryToStyle('Connection', '🤝');
    if (t.match(/draw|design|music|art|guitar|paint|sketch|create/)) return mapCategoryToStyle('Creative', '🎨');
    if (t.match(/read|book|study|learn|journal|gratitude|reflect/)) return mapCategoryToStyle('Creative', '📖');
    return mapCategoryToStyle('Spiritual', '✨');

}

function mapCategoryToStyle(category: string, icon: string) {
    const cat = category.trim().toLowerCase();
    if (cat.includes('deep') || cat.includes('work')) return { icon, category: 'Deep Work', colorClass: 'blue', accentColor: 'rgba(96,165,250,0.85)' };
    if (cat.includes('health')) return { icon, category: 'Health', colorClass: 'green', accentColor: 'rgba(110,231,183,0.85)' };
    if (cat.includes('connect')) return { icon, category: 'Connection', colorClass: 'teal', accentColor: 'rgba(45,212,191,0.85)' };
    if (cat.includes('creat')) return { icon, category: 'Creative', colorClass: 'purple', accentColor: 'rgba(196,181,253,0.85)' };
    if (cat.includes('spirit') || cat.includes('meditat')) return { icon, category: 'Spiritual', colorClass: 'gold', accentColor: 'rgba(251,191,36,0.85)' };
    if (cat.includes('rest') || cat.includes('sleep')) return { icon, category: 'Rest', colorClass: 'pink', accentColor: 'rgba(249,168,212,0.85)' };
    return { icon, category: 'Intention', colorClass: 'gold', accentColor: 'rgba(251,191,36,0.85)' };
}

const CM: Record<string, { text: string; border: string; bg: string; glow: string }> = {
    blue: { text: '#60a5fa', border: 'rgba(96, 165, 250, 0.40)', bg: 'rgba(96, 165, 250, 0.15)', glow: 'rgba(96, 165, 250, 0.20)' },
    green: { text: '#4ade80', border: 'rgba(74, 222, 128, 0.40)', bg: 'rgba(74, 222, 128, 0.15)', glow: 'rgba(74, 222, 128, 0.20)' },
    teal: { text: '#2dd4bf', border: 'rgba(45, 212, 191, 0.40)', bg: 'rgba(45, 212, 191, 0.15)', glow: 'rgba(45, 212, 191, 0.20)' },
    purple: { text: '#a78bfa', border: 'rgba(167, 139, 250, 0.40)', bg: 'rgba(167, 139, 250, 0.15)', glow: 'rgba(167, 139, 250, 0.20)' },
    gold: { text: '#fbbf24', border: 'rgba(251, 191, 36, 0.40)', bg: 'rgba(251, 191, 36, 0.15)', glow: 'rgba(251, 191, 36, 0.20)' },
    pink: { text: '#f472b6', border: 'rgba(244, 114, 182, 0.40)', bg: 'rgba(244, 114, 182, 0.15)', glow: 'rgba(244, 114, 182, 0.20)' },
};

// ── Firebase Firestore helpers ─────────────────────────────────────────────
// (Removed local load/save/delete logic, handled by useDailyTasks hook globally)

// ── Time suggestions ───────────────────────────────────────────────────────
function getTimeSuggestions() {
    const h = new Date().getHours();
    if (h < 9) return ['8:00 AM', '9:00 AM', '11:00 AM', 'This evening'];
    if (h < 13) return ['1:00 PM', '3:00 PM', '5:00 PM', 'Tomorrow AM'];
    if (h < 17) return ['5:00 PM', '7:00 PM', '9:00 PM', 'Tomorrow AM'];
    return ['9:00 PM', 'Tomorrow AM', 'Tomorrow PM', 'This weekend'];
}

// ── Mini Calendar ──────────────────────────────────────────────────────────
function MiniCalendar({ tasks, onDateSelect }: { tasks: TaskItem[]; onDateSelect: (iso: string) => void }) {
    const [viewDate, setViewDate] = useState(() => new Date());
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    const year = viewDate.getFullYear(), month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // build task map
    const taskDates = new Set(tasks.filter(t => t.scheduledDate).map(t => t.scheduledDate));
    const days: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <div style={{ background: 'rgba(20, 20, 30, 0.50)', border: '1px solid rgba(251, 191, 36, 0.25)', borderRadius: 18, padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', backdropFilter: 'blur(16px)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button onClick={() => setViewDate(new Date(year, month - 1, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255, 255, 255, 0.50)', padding: 4, lineHeight: 0 }}><ChevronLeft size={14} /></button>
                <span style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255, 255, 255, 0.80)', textTransform: 'uppercase', fontFamily: 'monospace' }}>{MONTHS[month]} {year}</span>
                <button onClick={() => setViewDate(new Date(year, month + 1, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255, 255, 255, 0.50)', padding: 4, lineHeight: 0 }}><ChevronRight size={14} /></button>
            </div>
            {/* Day labels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                {DAYS.map((d, i) => <span key={i} style={{ fontSize: '0.50rem', color: 'rgba(251, 191, 36, 0.60)', textAlign: 'center', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{d}</span>)}
            </div>
            {/* Day grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
                {days.map((d, i) => {
                    if (!d) return <div key={i} />;
                    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const isToday = iso === todayStr;
                    const hasTasks = taskDates.has(iso);
                    return (
                        <button key={iso} onClick={() => onDateSelect(iso)}
                            style={{
                                aspectRatio: '1', borderRadius: '50%', border: isToday ? '1.5px solid rgba(251, 191, 36, 0.80)' : '1px solid transparent',
                                background: hasTasks ? 'rgba(251, 191, 36, 0.25)' : 'transparent',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1,
                                padding: 0, position: 'relative',
                            }}>
                            <span style={{ fontSize: '0.58rem', color: isToday ? '#fbbf24' : 'rgba(255, 255, 255, 0.70)', fontWeight: isToday ? 700 : 400, fontFamily: 'monospace', lineHeight: 1 }}>{d}</span>
                            {hasTasks && <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#fbbf24' }} />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ── Schedule Prompt ────────────────────────────────────────────────────────
function SchedulePrompt({ pill, onSchedule, onSkip }: { pill: TaskItem; onSchedule: (date: string, time: string) => void; onSkip: () => void }) {
    const colors = CM[pill.colorClass] || CM.gold;
    const suggestions = getTimeSuggestions();
    const [custom, setCustom] = useState('');
    const [selDate, setSelDate] = useState(new Date().toISOString().slice(0, 10));
    const [showCal, setShowCal] = useState(false);

    return (
        <motion.div initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ background: 'rgba(20, 20, 30, 0.60)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', border: `1px solid ${colors.border}`, borderRadius: 20, padding: '1rem 1.1rem', boxShadow: `0 8px 40px rgba(0, 0, 0, 0.4), 0 0 20px ${colors.glow}`, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Clock size={13} style={{ color: colors.text }} />
                <p style={{ margin: 0, fontSize: '0.60rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: colors.text }}>When will you do this?</p>
                <button onClick={onSkip} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255, 255, 255, 0.40)', lineHeight: 0, padding: 2 }}><X size={13} /></button>
            </div>
            <p style={{ margin: 0, fontSize: '0.64rem', color: 'rgba(255, 255, 255, 0.60)', fontStyle: 'italic' }}>Tasks with a set time are 3× more likely to get done.</p>

            {/* Date selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button onClick={() => setShowCal(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 999, padding: '0.30rem 0.75rem', cursor: 'pointer', color: colors.text, fontSize: '0.60rem', fontWeight: 600, fontFamily: 'inherit' }}>
                    <Calendar size={10} /> {selDate === new Date().toISOString().slice(0, 10) ? 'Today' : selDate}
                </button>
            </div>
            <AnimatePresence>
                {showCal && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                    <MiniCalendar tasks={[]} onDateSelect={d => { setSelDate(d); setShowCal(false); }} />
                </motion.div>}
            </AnimatePresence>

            {/* Time pills */}
            <div style={{ display: 'flex', gap: '0.38rem', flexWrap: 'wrap' }}>
                {suggestions.map(t => (
                    <button key={t} onClick={() => onSchedule(selDate, t)} style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 999, padding: '0.30rem 0.70rem', cursor: 'pointer', color: colors.text, fontSize: '0.62rem', fontWeight: 600, fontFamily: 'inherit' }}>{t}</button>
                ))}
            </div>

            {/* Custom */}
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <input type="text" placeholder="Or type a time…" value={custom} onChange={e => setCustom(e.target.value)} onKeyDown={e => e.key === 'Enter' && custom.trim() && onSchedule(selDate, custom.trim())}
                    style={{ flex: 1, background: 'rgba(255, 255, 255, 0.10)', border: `1px solid ${colors.border}`, borderRadius: 999, padding: '0.36rem 0.9rem', color: 'rgba(255, 255, 255, 0.90)', fontSize: '0.64rem', outline: 'none', fontFamily: 'inherit' }} />
                {custom.trim() && <button onClick={() => onSchedule(selDate, custom.trim())} style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 999, padding: '0.36rem 0.70rem', cursor: 'pointer', color: colors.text, fontSize: '0.60rem', fontWeight: 700, fontFamily: 'inherit' }}>Set <ChevronRight size={9} style={{ display: 'inline', verticalAlign: 'middle' }} /></button>}
            </div>
        </motion.div>
    );
}

// ── DraggableBubble component ──────────────────────────────────────────────
interface DraggableBubbleProps {
    bubbleKey: string;
    label: string;
    emoji: string;
    count: number;
    left: string;
    top: string;
    size: number;
    floatAnim: string;
    color: string;    // background tint rgba
    glare: string;    // glare rgba
    isPlanner?: boolean;
    index: number;
    dropZoneRef: React.RefObject<HTMLDivElement>;
    onDrop: (label: string, isPlanner: boolean) => void;
    onCategoryClick?: (key: string) => void;
    isActive: boolean;
}

function DraggableBubble({
    bubbleKey, label, emoji, count, left, top, size, floatAnim,
    color, glare, isPlanner = false, index, dropZoneRef, onDrop, onCategoryClick, isActive,
}: DraggableBubbleProps) {
    const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isOverDrop, setIsOverDrop] = useState(false);
    const dragRef = useRef<{ startX: number; startY: number; startLeft: number; startTop: number } | null>(null);
    const elemRef = useRef<HTMLDivElement>(null);

    const checkOverDropZone = useCallback((clientX: number, clientY: number) => {
        if (!dropZoneRef.current) return false;
        const dz = dropZoneRef.current.getBoundingClientRect();
        return clientX >= dz.left && clientX <= dz.right && clientY >= dz.top && clientY <= dz.bottom;
    }, [dropZoneRef]);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (!elemRef.current) return;
        e.preventDefault();
        elemRef.current.setPointerCapture(e.pointerId);
        const rect = elemRef.current.getBoundingClientRect();
        setIsDragging(true);
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startLeft: rect.left + rect.width / 2,
            startTop: rect.top + rect.height / 2,
        };
        setPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }, []);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging || !dragRef.current) return;
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        setPos({ x: dragRef.current.startLeft + dx, y: dragRef.current.startTop + dy });
        setIsOverDrop(checkOverDropZone(e.clientX, e.clientY));
    }, [isDragging, checkOverDropZone]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        if (!isDragging) return;
        setIsDragging(false);
        setIsOverDrop(false);
        const overDrop = checkOverDropZone(e.clientX, e.clientY);
        // Animate back to original position
        setPos(null);
        dragRef.current = null;
        if (overDrop) {
            onDrop(label, isPlanner);
        } else {
            // Small click = category expand
            const moved = dragRef.current ? Math.abs((e.clientX - (dragRef.current as any).startX)) + Math.abs((e.clientY - (dragRef.current as any).startY)) : 0;
            if (moved < 8 && onCategoryClick && !isPlanner) {
                onCategoryClick(bubbleKey);
            }
        }
    }, [isDragging, checkOverDropZone, onDrop, label, isPlanner, onCategoryClick, bubbleKey]);

    const handleClick = useCallback(() => {
        if (!isDragging && onCategoryClick && !isPlanner) {
            onCategoryClick(bubbleKey);
        }
    }, [isDragging, onCategoryClick, isPlanner, bubbleKey]);

    const lines = label.split('\n');

    const bubbleStyle: React.CSSProperties = pos
        ? {
            position: 'fixed',
            left: pos.x,
            top: pos.y,
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            width: size,
            height: size,
            cursor: 'grabbing',
        }
        : {
            position: 'absolute',
            left,
            top,
            transform: 'translate(-50%, -50%)',
            animation: `${floatAnim} ${3.5 + index * 0.7}s ease-in-out infinite`,
            zIndex: isActive ? 10 : 2,
            width: size,
            height: size,
            cursor: 'grab',
        };

    const borderColor = isOverDrop ? 'rgba(251,191,36,0.9)' : 'rgba(255,255,255,0.28)';
    const bgBase = isActive
        ? `radial-gradient(150% 150% at 30% 20%, rgba(255,255,255,0.42) 0%, ${color.replace('0.35', '0.22')} 40%, rgba(0,0,0,0.40) 100%)`
        : `radial-gradient(150% 150% at 30% 20%, rgba(255,255,255,0.30) 0%, ${color} 45%, rgba(0,0,0,0.30) 100%)`;

    return (
        <div
            ref={elemRef}
            className="drag-bubble"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onClick={handleClick}
            style={{
                ...bubbleStyle,
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: bgBase,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: `1.5px solid ${borderColor}`,
                boxShadow: isOverDrop
                    ? `inset 0 0 20px rgba(255,255,255,0.5), 0 0 0 4px rgba(251,191,36,0.4), 0 10px 35px rgba(251,191,36,0.35)`
                    : isActive
                        ? `inset 0 0 20px rgba(255,255,255,0.35), inset 5px 5px 20px rgba(255,255,255,0.25), inset -5px -5px 20px rgba(0,0,0,0.35), 0 8px 30px rgba(0,0,0,0.4)`
                        : `inset 0 0 14px rgba(255,255,255,0.25), inset 4px 4px 16px rgba(255,255,255,0.20), inset -4px -4px 16px rgba(0,0,0,0.20), 0 6px 20px rgba(0,0,0,0.30)`,
                transition: isDragging ? 'none' : 'box-shadow 0.3s ease, border-color 0.3s ease',
                userSelect: 'none',
                touchAction: 'none',
            }}
        >
            {/* Top specular glare */}
            <div style={{
                position: 'absolute', top: '8%', left: '14%',
                width: '46%', height: '32%',
                background: `linear-gradient(160deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 100%)`,
                borderRadius: '50%',
                transform: 'rotate(-22deg)',
                pointerEvents: 'none',
            }} />
            {/* Bottom inner glow */}
            <div style={{
                position: 'absolute', bottom: '10%', right: '12%',
                width: '35%', height: '22%',
                background: `radial-gradient(ellipse, ${glare} 0%, transparent 70%)`,
                borderRadius: '50%',
                pointerEvents: 'none',
                opacity: 0.5,
            }} />

            {/* Emoji */}
            <span style={{ fontSize: size > 70 ? '1.3rem' : '1.05rem', lineHeight: 1, zIndex: 2, pointerEvents: 'none', marginBottom: 2 }}>{emoji}</span>

            {/* Label lines */}
            {lines.map((line, li) => (
                <span key={li} style={{
                    fontSize: size > 72 ? '0.42rem' : '0.37rem',
                    fontWeight: 800,
                    color: '#fff',
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                    textShadow: '0 1px 4px rgba(0,0,0,0.7)',
                    zIndex: 2,
                    lineHeight: 1.25,
                    textAlign: 'center',
                    pointerEvents: 'none',
                }}>{line}</span>
            ))}

            {/* Count badge */}
            {!isPlanner && count > 0 && (
                <div style={{
                    position: 'absolute', top: 2, right: 2,
                    background: 'rgba(251,191,36,0.95)',
                    borderRadius: '50%',
                    width: 16, height: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.45rem', fontWeight: 800, color: '#000',
                    zIndex: 3, boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                    pointerEvents: 'none',
                }}>{count}</div>
            )}

            {/* Planner star indicator */}
            {isPlanner && (
                <span style={{
                    position: 'absolute', bottom: 6, fontSize: '0.5rem',
                    color: 'rgba(167,139,250,0.9)', zIndex: 3, pointerEvents: 'none',
                }}>✦ vedic</span>
            )}
        </div>
    );
}

// ── Sound helpers ─────────────────────────────────────────────────────────
function playDropSound() {
    if (typeof window === 'undefined') return;
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        [880, 1046].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
            gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
            gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.38);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.08); osc.stop(ctx.currentTime + i * 0.08 + 0.40);
        });
        setTimeout(() => ctx.close(), 900);
    } catch { /* silently ignore */ }
}

function playOrbitSound() {
    try {
        if (typeof window === 'undefined') return;
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.3);
        setTimeout(() => ctx.close(), 500);
    } catch { /* ignored */ }
}

function playSubmitSound() {
    try {
        if (typeof window === 'undefined') return;
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
        freqs.forEach((f, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.1);
            gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
            gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.1 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.4);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.1); osc.stop(ctx.currentTime + i * 0.1 + 0.5);
        });
        setTimeout(() => ctx.close(), 1000);
    } catch { /* ignored */ }
}

// ── Main Component ─────────────────────────────────────────────────────────
// ── Inline Draggable Bubble Subcomponent ──
const InlineBubble = ({ b, index, dropZoneRef, dropHighlight, setDropHighlight, inputValue, setInputValue, inputRef, setPendingMessage, handleCategoryClick, router, setActiveLayer, onLogTap }: any) => {
    const isPlanner = !!b.isPlanner;
    const [burstKey, setBurstKey] = useState<number>(0);
    const [isBursting, setIsBursting] = useState(false);
    const bRef = useRef<HTMLDivElement>(null);
    const startRef = useRef<{ cx: number; cy: number; bx: number; by: number } | null>(null);
    const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [ghostBursting, setGhostBursting] = useState(false);

    const checkOver = (cx: number, cy: number) => {
        if (!dropZoneRef.current) return false;
        const r = dropZoneRef.current.getBoundingClientRect();
        return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
    };

    const onPtrDown = (e: React.PointerEvent) => {
        if (!bRef.current) return;
        e.preventDefault();
        bRef.current.setPointerCapture(e.pointerId);
        const r = bRef.current.getBoundingClientRect();
        startRef.current = { cx: e.clientX, cy: e.clientY, bx: r.left + r.width / 2, by: r.top + r.height / 2 };
        setIsDragging(true);
        setDragPos({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
        playOrbitSound();
    };

    const onPtrMove = (e: React.PointerEvent) => {
        if (!isDragging || !startRef.current) return;
        const dx = e.clientX - startRef.current.cx;
        const dy = e.clientY - startRef.current.cy;
        setDragPos({ x: startRef.current.bx + dx, y: startRef.current.by + dy });
        setDropHighlight(checkOver(e.clientX, e.clientY));
    };

    const onPtrUp = (e: React.PointerEvent) => {
        if (!isDragging || !startRef.current) return;
        const over = checkOver(e.clientX, e.clientY);
        const totalMove = Math.abs(e.clientX - startRef.current.cx) + Math.abs(e.clientY - startRef.current.cy);
        setIsDragging(false);
        if (!over) setDragPos(null);
        startRef.current = null;
        setDropHighlight(false);

        if (over) {
            setIsBursting(true);
            setBurstKey(k => k + 1);
            setTimeout(() => setIsBursting(false), 600);
            // Snap ghost to exact pointer position so burst fires at the drop zone, not at the offset bubble-center
            setDragPos({ x: e.clientX, y: e.clientY });
            setGhostBursting(true);
            setTimeout(() => { setDragPos(null); setGhostBursting(false); }, 400);

            if (isPlanner) {
                router.push('/vedic-planner');
                return;
            }
            try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                [880, 1046.5].forEach((freq, fi) => {
                    const osc = ctx.createOscillator(); const g = ctx.createGain();
                    osc.type = 'sine'; osc.frequency.value = freq;
                    g.gain.setValueAtTime(0, ctx.currentTime + fi * 0.09);
                    g.gain.linearRampToValueAtTime(0.18, ctx.currentTime + fi * 0.09 + 0.025);
                    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + fi * 0.09 + 0.38);
                    osc.connect(g); g.connect(ctx.destination);
                    osc.start(ctx.currentTime + fi * 0.09); osc.stop(ctx.currentTime + fi * 0.09 + 0.40);
                });
                setTimeout(() => ctx.close(), 1000);
            } catch { /* silent */ }

            const msg = b.logMsg || `${b.label}: `;
            setInputValue(msg);
            setDropHighlight(true);
            setTimeout(() => setDropHighlight(false), 900);
            setTimeout(() => {
                inputRef.current?.focus();
                setPendingMessage(msg);
                router.push('/bodhi-chat');
            }, 650);
        } else if (totalMove < 10 && b.isFolder) {
            setActiveLayer(b.isFolder);
        } else if (totalMove < 10 && isPlanner) {
            router.push('/vedic-planner');
        } else if (totalMove < 10 && b.isLog && onLogTap) {
            setIsBursting(true);
            setBurstKey(k => k + 1);
            setTimeout(() => setIsBursting(false), 450);
            setDragPos({ x: e.clientX, y: e.clientY });
            setGhostBursting(true);
            setTimeout(() => { setDragPos(null); setGhostBursting(false); }, 400);
            onLogTap(b);
        } else if (totalMove < 10) {
            // Tap: burst at tap point → open Bodhi chat with label pre-filled
            setIsBursting(true);
            setBurstKey(k => k + 1);
            setTimeout(() => setIsBursting(false), 450);
            setDragPos({ x: e.clientX, y: e.clientY });
            setGhostBursting(true);
            setTimeout(() => { setDragPos(null); setGhostBursting(false); }, 400);
            try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                [880, 1046.5].forEach((freq, fi) => {
                    const osc = ctx.createOscillator(); const g = ctx.createGain();
                    osc.type = 'sine'; osc.frequency.value = freq;
                    g.gain.setValueAtTime(0, ctx.currentTime + fi * 0.09);
                    g.gain.linearRampToValueAtTime(0.18, ctx.currentTime + fi * 0.09 + 0.025);
                    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + fi * 0.09 + 0.38);
                    osc.connect(g); g.connect(ctx.destination);
                    osc.start(ctx.currentTime + fi * 0.09); osc.stop(ctx.currentTime + fi * 0.09 + 0.40);
                });
                setTimeout(() => ctx.close(), 1000);
            } catch { /* silent */ }
            const msg = b.logMsg || `${b.label}: `;
            setPendingMessage(msg);
            playSubmitSound();
            setTimeout(() => router.push('/bodhi-chat'), 450);
        }
    };

    const isOverDrop = dropHighlight && !!dragPos;

    const bubbleEl = (
        <div ref={bRef} className="ms-drag-bubble" onPointerDown={onPtrDown} onPointerMove={onPtrMove} onPointerUp={onPtrUp}
            style={{
                width: b.size, height: b.size, marginBottom: -b.arcY, borderRadius: '50%', position: 'relative', flexShrink: 0,
                animationName: dragPos ? 'none' : b.anim, animationDuration: `${b.dur + index * 0.4}s`, animationDelay: `${index * 0.55}s`,
                animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite',
                opacity: (isBursting || isDragging) ? 0 : 1, transition: 'opacity 0.15s ease',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: isOverDrop ? `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.60) 0%, rgba(251,191,36,0.45) 50%, rgba(251,191,36,0.15) 100%)` : `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.38) 0%, ${b.bg} 52%, rgba(0,0,0,0.25) 100%)`,
                backdropFilter: 'blur(14px) saturate(180%)', WebkitBackdropFilter: 'blur(14px) saturate(180%)',
                border: isOverDrop ? '2px solid rgba(251,191,36,0.95)' : '1.5px solid rgba(255,255,255,0.28)',
                boxShadow: isOverDrop ? `inset 0 0 22px rgba(255,255,255,0.55), 0 0 0 5px rgba(251,191,36,0.30), 0 10px 36px rgba(251,191,36,0.40)` : `inset 0 0 15px rgba(255,255,255,0.22), inset 4px 4px 14px rgba(255,255,255,0.16), inset -4px -4px 14px rgba(0,0,0,0.18), 0 7px 24px rgba(0,0,0,0.32)`,
                userSelect: 'none', touchAction: 'none',
            }}
        >
            <div style={{ position: 'absolute', top: '7%', left: '13%', width: '48%', height: '30%', background: 'linear-gradient(155deg, rgba(255,255,255,0.80) 0%, rgba(255,255,255,0) 100%)', borderRadius: '50%', transform: 'rotate(-22deg)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '36%', height: '22%', background: `radial-gradient(ellipse, ${b.glare} 0%, transparent 70%)`, borderRadius: '50%', pointerEvents: 'none', opacity: 0.55 }} />
            <span style={{ fontSize: b.size > 68 ? '1.4rem' : '1.1rem', lineHeight: 1, pointerEvents: 'none', zIndex: 2, marginBottom: 2 }}>{b.emoji}</span>
            <span style={{ fontSize: b.size > 68 ? '0.39rem' : '0.34rem', fontWeight: 900, color: '#fff', letterSpacing: '0.07em', textTransform: 'uppercase', textShadow: `0 1px 5px rgba(0,0,0,0.75)`, zIndex: 2, lineHeight: 1.2, textAlign: 'center', pointerEvents: 'none' }}>
                {b.label}
                {isPlanner && <><br /><span style={{ opacity: 0.75, fontStyle: 'italic', fontWeight: 600 }}>PLANNER</span></>}
            </span>
            {!isPlanner && b.count > 0 && <div style={{ position: 'absolute', top: 1, right: 1, width: 15, height: 15, borderRadius: '50%', background: `linear-gradient(135deg, ${b.color} 0%, ${b.color}bb 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.40rem', fontWeight: 900, color: '#000', zIndex: 3, boxShadow: `0 2px 6px ${b.color}80`, border: '1px solid rgba(255,255,255,0.4)', pointerEvents: 'none' }}>{b.count}</div>}
            {isPlanner && <span style={{ position: 'absolute', bottom: 6, fontSize: '0.32rem', color: 'rgba(196,181,253,0.95)', fontStyle: 'italic', letterSpacing: '0.05em', zIndex: 3, pointerEvents: 'none' }}>✦ vedic</span>}
            {isBursting && <div key={burstKey} style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2.5px solid rgba(251,191,36,0.8)', animation: 'msBurstRing 0.55s ease-out forwards', pointerEvents: 'none' }} />}
        </div>
    );

    return (
        <React.Fragment>
            {bubbleEl}
            {dragPos && (isDragging || ghostBursting) && (
                <div style={{ position: 'fixed', left: dragPos.x, top: dragPos.y, transform: ghostBursting ? 'translate(-50%, -50%) scale(1.9)' : 'translate(-50%, -50%)', opacity: ghostBursting ? 0 : 1, transition: ghostBursting ? 'transform 0.38s ease-out, opacity 0.38s ease-out' : 'none', width: b.size, height: b.size, borderRadius: '50%', zIndex: 9999, background: (isOverDrop || ghostBursting) ? `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.60) 0%, rgba(251,191,36,0.45) 50%, rgba(251,191,36,0.15) 100%)` : `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.38) 0%, ${b.bg} 52%, rgba(0,0,0,0.25) 100%)`, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: (isOverDrop || ghostBursting) ? '2px solid rgba(251,191,36,0.95)' : '1.5px solid rgba(255,255,255,0.28)', boxShadow: ghostBursting ? `0 0 0 10px rgba(251,191,36,0.15), 0 0 50px rgba(251,191,36,0.50)` : isOverDrop ? `0 0 0 5px rgba(251,191,36,0.25), 0 10px 36px rgba(251,191,36,0.45)` : `0 12px 40px rgba(0,0,0,0.45)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'grabbing', pointerEvents: 'none' }}>
                    <div style={{ position: 'absolute', top: '7%', left: '13%', width: '48%', height: '30%', background: 'linear-gradient(155deg, rgba(255,255,255,0.80) 0%, rgba(255,255,255,0) 100%)', borderRadius: '50%', transform: 'rotate(-22deg)' }} />
                    <span style={{ fontSize: b.size > 68 ? '1.4rem' : '1.1rem', lineHeight: 1, zIndex: 2 }}>{b.emoji}</span>
                    <span style={{ fontSize: '0.36rem', fontWeight: 900, color: '#fff', letterSpacing: '0.07em', textTransform: 'uppercase', textShadow: '0 1px 5px rgba(0,0,0,0.75)', zIndex: 2 }}>{b.label}</span>
                </div>
            )}
        </React.Fragment>
    );
};

export default function MagicSyncModule({ items: tasks, onToggle, onRemove, onAdd, onUpdate }: MagicSyncModuleProps) {
    const [activeLayer, setActiveLayer] = useState<'root' | 'work' | 'logs'>('root');
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [schedulingId, setSchedulingId] = useState<string | null>(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [aiAdvice, setAiAdvice] = useState<Record<string, string>>({});
    const [isGeneratingAdvice, setIsGeneratingAdvice] = useState<string | null>(null);
    const [dropHighlight, setDropHighlight] = useState(false);
    const [activeLogBubble, setActiveLogBubble] = useState<any | null>(null);
    const [filterDate, setFilterDate] = useState<string | null>(null);
    // ── Mini Task Summary ───────────────────────────────────────────────────
    const TaskSummary = () => {
        const pending = tasks.filter(t => !t.done);
        const urgent = pending.filter(t => t.category === 'Issue' || t.category === 'Challenge').length;

        if (pending.length === 0) return null;

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: 'rgba(0,0,0,0.40)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 12,
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    zIndex: 5,
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24' }}>{pending.length}</span>
                    <span style={{ fontSize: '0.50rem', color: 'rgba(255,255,255,0.50)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending</span>
                </div>
                {urgent > 0 && (
                    <div style={{
                        width: 1,
                        height: 24,
                        background: 'rgba(255,255,255,0.10)'
                    }} />
                )}
                {urgent > 0 && (
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f87171' }}>{urgent}</span>
                        <span style={{ fontSize: '0.50rem', color: 'rgba(255,255,255,0.50)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Urgent</span>
                    </div>
                )}
            </motion.div>
        );
    };
    const dropZoneRef = useRef<HTMLDivElement>(null);
    const moduleRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // ── Bodhi Conversation State ──────────────────────────────────────────────
    const [bodhiState, setBodhiState] = useState<BodhiChatState>('idle');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const submitRef = useRef<(text: string) => void>(() => { });

    // Auto-scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, bodhiState]);

    // Stop TTS on unmount
    useEffect(() => {
        return () => { if (typeof window !== 'undefined') window.speechSynthesis?.cancel(); };
    }, []);

    // ── Mic (STT) helpers ────────────────────────────────────────────────────
    const startListening = useCallback(() => {
        if (typeof window === 'undefined') return;
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) return;
        const rec = new SR();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = 'en-IN';
        rec.onresult = (e: any) => {
            const transcript = Array.from(e.results as any[]).map((r: any) => r[0].transcript).join('');
            setInputValue(transcript);
            if (e.results[e.results.length - 1].isFinal) {
                setIsListening(false);
                submitRef.current(transcript);
            }
        };
        rec.onerror = () => setIsListening(false);
        rec.onend = () => setIsListening(false);
        rec.start();
        recognitionRef.current = rec;
        setIsListening(true);
    }, []);

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
    }, []);

    const toggleMic = useCallback(() => {
        if (isListening) stopListening();
        else startListening();
    }, [isListening, startListening, stopListening]);

    const router = useRouter();
    const setPendingMessage = useBodhiChatStore(s => s.setPendingMessage);

    // ── Core submit: intercept → persist → route to /bodhi-chat ─────────────
    const submitMessage = useCallback((overrideText?: string) => {
        const text = (overrideText ?? inputValue).trim();
        if (!text) return;
        setInputValue('');
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(55);
        playSubmitSound();
        setPendingMessage(text);
        router.push('/bodhi-chat');
    }, [inputValue, setPendingMessage, router]);

    const handleSubmit = useCallback(() => submitMessage(), [submitMessage]);
    // Keep ref current so STT handler always calls latest version
    useEffect(() => { submitRef.current = (t: string) => submitMessage(t); }, [submitMessage]);

    const handleSchedule = useCallback((taskId: string, date: string, time: string) => {
        onUpdate(taskId, { scheduledDate: date, scheduledTime: time });
        setSchedulingId(null);
    }, [onUpdate]);

    const handleComplete = useCallback((task: TaskItem) => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([20, 30, 20]);
        onToggle(task.id);
        setTimeout(() => {
            onRemove(task.id);
        }, 700);
    }, [onToggle, onRemove]);

    // AI Advice generator for categories
    const generateAIAdvice = useCallback(async (category: string, items: TaskItem[]) => {
        if (items.length === 0) return;
        setIsGeneratingAdvice(category);

        const adviceMap: Record<string, string[]> = {
            Task: [
                "Prioritize by urgency. Start with what matters most today.",
                "Break large tasks into small steps. Progress builds momentum.",
                "Time-block your focus. Deep work creates flow.",
                "Progress over perfection. Each step counts.",
            ],
            Challenge: [
                "Challenges are growth in disguise. Embrace them.",
                "Break challenges into milestones. Celebrate small wins.",
                "You're stronger than you know. Trust yourself.",
                "Every obstacle is a teacher. Learn and rise.",
            ],
            Idea: [
                "Capture ideas immediately. Best ones come unexpectedly!",
                "Connect unrelated ideas. Innovation lives at intersections.",
                "Let ideas breathe. Clarity often comes with time.",
                "Your creativity is infinite. Trust the process.",
            ],
            Issue: [
                "Every problem has a solution. Breathe and approach calmly.",
                "Ask 'why' five times to find the root cause.",
                "Stepping back often brings the clarity you need.",
                "Transform problems into opportunities. You have this!",
            ],
        };

        const advices = adviceMap[category] || ["You're doing great! Keep moving forward with peace."];
        const randomAdvice = advices[Math.floor(Math.random() * advices.length)];

        await new Promise(resolve => setTimeout(resolve, 600));

        setAiAdvice(prev => ({ ...prev, [category]: randomAdvice }));
        setIsGeneratingAdvice(null);
    }, []);

    const handleCategoryClick = useCallback((category: string) => {
        if (expandedCategory === category) {
            setExpandedCategory(null);
        } else {
            setExpandedCategory(category);
            const categoryItems = tasks.filter(t => t.category === category && !t.done);
            if (categoryItems.length > 0 && !aiAdvice[category]) {
                generateAIAdvice(category, categoryItems);
            }
        }
    }, [expandedCategory, tasks, aiAdvice, generateAIAdvice]);

    // Task / Challenge / Idea / Wellness are shown as Stories in the top nav — exclude them from the dashboard grid
    const STORY_CATEGORIES = ['Task', 'Challenge', 'Idea', 'Wellness'];
    const activeTasks = tasks.filter(t => !t.done && !STORY_CATEGORIES.includes(t.category) && (!filterDate || t.scheduledDate === filterDate));
    const donePct = tasks.length > 0 ? Math.round((tasks.filter(t => t.done).length / tasks.length) * 100) : 0;

    const categoryStats = [
        { key: 'Task', emoji: '✅', label: 'Tasks', color: '#4ade80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.30)' },
        { key: 'Challenge', emoji: '⚡', label: 'Challenges', color: '#fb923c', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.30)' },
        { key: 'Idea', emoji: '💡', label: 'Ideas', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.30)' },
        { key: 'Issue', emoji: '🔥', label: 'Issues', color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.30)' },
    ].map(c => ({ ...c, count: tasks.filter(t => !t.done && t.category === c.key).length }));

    // ── Bubble drag-to-input logic ─────────────────────────────────────────
    const handleBubbleDrop = useCallback((label: string, isPlanner: boolean) => {
        if (isPlanner) {
            router.push('/vedic-planner');
            return;
        }
        playDropSound();
        setDropHighlight(true);
        const displayText = `${label}: `;
        setInputValue(displayText);
        inputRef.current?.focus();
        setTimeout(() => setDropHighlight(false), 1200);
        // Set pending message and navigate to bodhi chat after brief delay
        setTimeout(() => {
            setPendingMessage(displayText);
            router.push('/bodhi-chat');
        }, 700);
    }, [router, setPendingMessage]);

    return (
        <div ref={moduleRef} style={{
            width: '100%',
            display: 'flex', flexDirection: 'column', gap: '0.25rem',
            position: 'relative',
        }}>

            {/* ── SMART MANAGER PREMIUM GLASS CARD ── */}
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    position: 'relative',
                    borderRadius: 24,
                    padding: '0.4rem 0.8rem 0.4rem',
                    background: 'transparent',
                    backdropFilter: 'none',
                    WebkitBackdropFilter: 'none',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: 'none',
                    overflow: 'visible',
                }}
            >
                <TaskSummary />
                {/* Subtle shimmer */}
                <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 24, overflow: 'hidden',
                    background: 'radial-gradient(ellipse at 30% 0%, rgba(251, 191, 36, 0.04) 0%, transparent 50%)',
                }} />

                {/* ── SMART MANAGER HEADER ── */}
                <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
                    <div style={{ flex: 1 }}>
                        <h2 style={{
                            margin: 0, fontSize: '0.85rem',
                            fontWeight: 700, lineHeight: 1.2, letterSpacing: '0.12em',
                            color: '#fbbf24',
                            fontFamily: "'Inter', system-ui, sans-serif",
                            textTransform: 'uppercase',
                        }}>
                            <span style={{ marginRight: 6 }}>✦</span>
                            Smart Life Planner
                        </h2>
                        <p style={{
                            margin: '0.2rem 0 0', fontSize: '0.68rem',
                            color: 'rgba(255, 255, 255, 0.45)',
                            fontFamily: "'Inter', system-ui, sans-serif",
                            letterSpacing: '0.01em',
                            fontWeight: 400,
                            fontStyle: 'italic',
                        }}>
                            AI Sakha <span style={{ color: '#fbbf24', fontWeight: 600 }}>Bodhi</span> advises &amp; schedules
                        </p>
                    </div>
                    {/* CAL Button */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setShowCalendar(!showCalendar)}
                        style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.14)',
                            borderRadius: 10,
                            padding: '0.34rem 0.72rem',
                            display: 'flex', alignItems: 'center', gap: 5,
                            cursor: 'pointer',
                            color: 'rgba(255, 255, 255, 0.50)',
                            fontSize: '0.54rem',
                            fontWeight: 500,
                            fontFamily: "'Inter', system-ui, sans-serif",
                            letterSpacing: '0.08em',
                            flexShrink: 0,
                        }}
                    >
                        <Calendar size={12} />
                        CAL
                    </motion.button>
                </div>


                {/* ── BUBBLE ARENA + DROP BAR ── */}
                <style>{`
                    @keyframes msFloat0{0%,100%{transform:translateY(0px) rotate(0deg)}35%{transform:translateY(-8px) rotate(1.2deg)}70%{transform:translateY(-3px) rotate(-0.6deg)}}
                    @keyframes msFloat1{0%,100%{transform:translateY(0px) rotate(0deg)}42%{transform:translateY(-10px) rotate(-1.5deg)}72%{transform:translateY(-2px) rotate(0.8deg)}}
                    @keyframes msFloat2{0%,100%{transform:translateY(0px) rotate(0deg)}28%{transform:translateY(-6px) rotate(2deg)}74%{transform:translateY(-9px) rotate(-1deg)}}
                    @keyframes msFloat3{0%,100%{transform:translateY(0px) rotate(0deg)}55%{transform:translateY(-7px) rotate(-1.8deg)}82%{transform:translateY(-3px) rotate(1deg)}}
                    @keyframes msFloat4{0%,100%{transform:translateY(0px) rotate(0deg)}32%{transform:translateY(-5px) rotate(1.3deg)}65%{transform:translateY(-11px) rotate(-0.7deg)}}
                    @keyframes msBurstRing{0%{transform:scale(1);opacity:0.9}100%{transform:scale(3.5);opacity:0}}
                    @keyframes msBarPulse{0%,100%{box-shadow:0 0 0 0 rgba(251,191,36,0.5),inset 0 1px 0 rgba(255,255,255,0.2)}50%{box-shadow:0 0 0 8px rgba(251,191,36,0.08),inset 0 1px 0 rgba(255,255,255,0.2)}}
                    .ms-drag-bubble{touch-action:none;cursor:grab;}
                    .ms-drag-bubble:active{cursor:grabbing!important;}
                    @keyframes msGlowPulse{0%,100%{box-shadow:0 0 10px rgba(251,191,36,0.1)}50%{box-shadow:0 0 25px rgba(251,191,36,0.4)}}
                `}</style>

                {/* Drag hint */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.5 }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: '1.5rem', position: 'relative', zIndex: 3 }}
                >
                    <motion.span animate={{ x: [0, 8, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} style={{ fontSize: '1.2rem' }}>👇</motion.span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fbbf24', fontStyle: 'italic', fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: '0.04em', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                        Touch bubbles → Transform your life — Bodhi guides
                    </span>
                    <motion.span animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }} style={{ fontSize: '1.2rem' }}>✨</motion.span>
                </motion.div>

                {/* ── Arc orbit container ── */}
                <div
                    style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '0.8rem', marginTop: '0.3rem' }}
                    onPointerMove={useCallback((e: React.PointerEvent<HTMLDivElement>) => {
                        if (!dropZoneRef.current) return;
                        const r = dropZoneRef.current.getBoundingClientRect();
                        const over = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
                        setDropHighlight(over);
                    }, [])}
                    onPointerLeave={useCallback(() => setDropHighlight(false), [])}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.2rem', padding: '0 0.5rem', marginBottom: '1.5rem' }}>
                        {/* Time Context Logic for Logging */}
                        {(() => {
                            const h = new Date().getHours();
                            let timeLogs: any[] = [];
                            if (h >= 5 && h < 12) {
                                timeLogs = [
                                    { key: 'LogWake', label: 'Rise & Shine!', emoji: '🌅', logMsg: 'I woke up this morning [UI_EVENT: MORNING_LOGS_CLICKED]', subOptions: [{ icon: '⚡', label: '5 AM sharp', detail: 'woke up at 5 AM sharp' }, { icon: '🌄', label: '6–7 AM', detail: 'woke up around 6–7 AM' }, { icon: '☀️', label: '~8 AM', detail: 'woke up around 8 AM' }, { icon: '😅', label: 'A bit late', detail: 'woke up a bit late today' }], color: '#fde047', bg: 'rgba(253,224,71,0.3)', glare: 'rgba(253,224,71,0.6)', anim: 'msFloat4', dur: 4.5, size: 68, arcY: -18, isLog: true },
                                    { key: 'LogBreakfast', label: 'Morning Fuel!', emoji: '🍳', logMsg: 'I had breakfast today [UI_EVENT: MORNING_LOGS_CLICKED]', subOptions: [{ icon: '🥣', label: 'Oats & fruits', detail: 'had oats with fruits' }, { icon: '🫓', label: 'Parathas', detail: 'had parathas this morning' }, { icon: '🍳', label: 'Eggs', detail: 'had eggs for breakfast' }, { icon: '🍵', label: 'Just chai', detail: 'just had chai today' }], color: '#fed7aa', bg: 'rgba(254,215,170,0.3)', glare: 'rgba(254,215,170,0.6)', anim: 'msFloat2', dur: 4.1, size: 66, arcY: -12, isLog: true },
                                    { key: 'LogMeditate', label: 'Breathwork Done?', emoji: '🧘', logMsg: 'I did morning breathwork [UI_EVENT: MORNING_LOGS_CLICKED]', subOptions: [{ icon: '⏱️', label: '5 min reset', detail: '5 minute breathing reset done' }, { icon: '🕐', label: '10 min flow', detail: '10 minute pranayama done' }, { icon: '✨', label: '20+ min deep', detail: 'full 20+ minute breathwork session' }, { icon: '📅', label: 'Will do later', detail: 'planning breathwork later today' }], color: '#67e8f9', bg: 'rgba(103,232,249,0.3)', glare: 'rgba(103,232,249,0.5)', anim: 'msFloat0', dur: 3.2, size: 70, arcY: -28, isLog: true },
                                ];
                            } else if (h >= 12 && h < 16) {
                                timeLogs = [
                                    { key: 'LogLunch', label: "Lunch O'Clock!", emoji: '🍱', logMsg: 'I had lunch today [UI_EVENT: NOON_LOGS_CLICKED]', subOptions: [{ icon: '🍚', label: 'Dal rice', detail: 'had dal rice for lunch' }, { icon: '🫓', label: 'Roti sabzi', detail: 'had roti and sabzi' }, { icon: '🥗', label: 'Light salad', detail: 'had a light salad' }, { icon: '🍕', label: 'Outside food', detail: 'ate outside or ordered in' }, { icon: '⏭️', label: 'Skipped it', detail: 'skipped lunch today' }], color: '#86efac', bg: 'rgba(134,239,172,0.3)', glare: 'rgba(134,239,172,0.6)', anim: 'msFloat1', dur: 3.5, size: 74, arcY: -22, isLog: true },
                                    { key: 'LogDeepWork', label: 'Deep Sprint?', emoji: '🎯', logMsg: 'I completed a deep work session [UI_EVENT: NOON_LOGS_CLICKED]', subOptions: [{ icon: '⏰', label: '1 hour', detail: '1 hour focused deep work sprint' }, { icon: '🕑', label: '2 hours', detail: '2 hour deep work block done' }, { icon: '🔥', label: 'Still in flow!', detail: 'still in deep flow state right now' }, { icon: '😵', label: 'Struggled today', detail: 'struggled to focus today' }], color: '#4ade80', bg: 'rgba(74,222,128,0.3)', glare: 'rgba(74,222,128,0.6)', anim: 'msFloat2', dur: 4.1, size: 66, arcY: -15, isLog: true },
                                ];
                            } else if (h >= 16 && h < 20) {
                                timeLogs = [
                                    { key: 'LogWorkout', label: 'Physicals & Games 💪', emoji: '🏋️', logMsg: 'I worked out today [UI_EVENT: EVENING_LOGS_CLICKED]', subOptions: [{ icon: '🏋️', label: 'Gym session', detail: 'full gym session done' }, { icon: '🏃', label: 'Evening run', detail: 'went for an evening run' }, { icon: '🧘', label: 'Yoga flow', detail: 'yoga flow session done' }, { icon: '🚶', label: 'Walk', detail: 'took an evening walk' }, { icon: '🏠', label: 'Home workout', detail: 'home workout session done' }], color: '#f87171', bg: 'rgba(248,113,113,0.3)', glare: 'rgba(248,113,113,0.6)', anim: 'msFloat0', dur: 3.8, size: 70, arcY: -20, isLog: true },
                                    { key: 'LogDinner', label: 'Dinner Served!', emoji: '🍽️', logMsg: 'I had dinner tonight [UI_EVENT: EVENING_LOGS_CLICKED]', subOptions: [{ icon: '🥗', label: 'Light & clean', detail: 'had a light clean dinner' }, { icon: '🍚', label: 'Full meal', detail: 'had a full dinner meal' }, { icon: '🫓', label: 'Roti sabzi', detail: 'had roti and sabzi for dinner' }, { icon: '⏭️', label: 'Skipping', detail: 'skipping dinner tonight' }], color: '#fdba74', bg: 'rgba(253,186,116,0.3)', glare: 'rgba(253,186,116,0.6)', anim: 'msFloat3', dur: 3.8, size: 66, arcY: -15, isLog: true },
                                    { key: 'LogMeditate', label: 'Eve Meditate', emoji: '🧘', logMsg: 'I did evening meditation [UI_EVENT: EVENING_LOGS_CLICKED]', subOptions: [{ icon: '⏱️', label: '5 min calm', detail: '5 minute evening calm down' }, { icon: '🕐', label: '15 min deep', detail: '15 minute deep meditation' }, { icon: '📿', label: 'Mantra', detail: 'mantra meditation session done' }], color: '#67e8f9', bg: 'rgba(103,232,249,0.3)', glare: 'rgba(103,232,249,0.5)', anim: 'msFloat4', dur: 4.0, size: 64, arcY: -18, isLog: true },
                                ];
                            } else {
                                timeLogs = [
                                    { key: 'LogDinner', label: 'Dinner Time!', emoji: '🌙', logMsg: 'I had dinner tonight [UI_EVENT: NIGHT_LOGS]', subOptions: [{ icon: '🥗', label: 'Light meal', detail: 'had a light dinner tonight' }, { icon: '🍚', label: 'Full dinner', detail: 'had a full dinner meal' }, { icon: '⏭️', label: 'Skipping', detail: 'skipping dinner tonight' }], color: '#fdba74', bg: 'rgba(253,186,116,0.3)', glare: 'rgba(253,186,116,0.6)', anim: 'msFloat3', dur: 3.8, size: 62, arcY: -15, isLog: true },
                                    { key: 'LogSleep', label: 'Rest Mode On', emoji: '💤', logMsg: 'Going to sleep now, goodnight [UI_EVENT: NIGHT_LOGS]', subOptions: [{ icon: '🌙', label: 'Before 10 PM', detail: 'early sleep before 10 PM tonight' }, { icon: '🕙', label: '10–11 PM', detail: 'sleeping around 10–11 PM' }, { icon: '🌃', label: '~Midnight', detail: 'sleeping around midnight tonight' }, { icon: '🦉', label: 'Night owl', detail: 'very late night, past midnight' }], color: '#c4b5fd', bg: 'rgba(196,181,253,0.3)', glare: 'rgba(196,181,253,0.6)', anim: 'msFloat0', dur: 4.5, size: 70, arcY: -25, isLog: true },
                                    { key: 'LogGratitude', label: 'Grateful Today?', emoji: '🙏', logMsg: 'I am feeling grateful today [UI_EVENT: NIGHT_LOGS]', subOptions: [{ icon: '✨', label: '3 good things', detail: 'named 3 things I am grateful for' }, { icon: '🙏', label: 'Short prayer', detail: 'said a short prayer of gratitude' }, { icon: '💛', label: 'Just felt it', detail: 'felt deep gratitude in my heart' }], color: '#fbbf24', bg: 'rgba(251,191,36,0.3)', glare: 'rgba(251,191,36,0.6)', anim: 'msFloat2', dur: 4.0, size: 64, arcY: -10, isLog: true },
                                ];
                            }

                            const activeLogs = timeLogs;

                            let currentBubbles: any[] = [];
                            if (activeLayer === 'root') {
                                currentBubbles = [
                                    { key: 'FolderWork', label: 'WORK', emoji: '💼', count: 0, color: '#3b82f6', bg: 'rgba(59,130,246,0.32)', glare: 'rgba(59,130,246,0.85)', anim: 'msFloat1', dur: 4.2, size: 76, arcY: -5, isFolder: 'work' },
                                    { key: 'FolderLogs', label: 'LOGS', emoji: '📝', count: 0, color: '#f59e0b', bg: 'rgba(245,158,11,0.32)', glare: 'rgba(245,158,11,0.85)', anim: 'msFloat2', dur: 3.8, size: 76, arcY: 8, isFolder: 'logs' },
                                    { key: 'Planner', label: 'SMART', emoji: '🗓️', count: 0, color: '#a78bfa', bg: 'rgba(167,139,250,0.40)', glare: 'rgba(167,139,250,0.85)', anim: 'msFloat4', dur: 4.0, size: 88, arcY: -15, isPlanner: true },
                                ];
                            } else if (activeLayer === 'work') {
                                currentBubbles = [
                                    { key: 'BackRoot', label: 'BACK', emoji: '⬅️', count: 0, color: '#9ca3af', bg: 'rgba(156,163,175,0.4)', glare: 'rgba(156,163,175,0.7)', anim: 'msFloat0', dur: 3.5, size: 58, arcY: -4, isFolder: 'root' },
                                    { key: 'Task', label: 'TASKS', emoji: '✅', count: categoryStats.find(c => c.key === 'Task')?.count ?? 0, color: '#4ade80', bg: 'rgba(74,222,128,0.32)', glare: 'rgba(74,222,128,0.65)', anim: 'msFloat1', dur: 3.8, size: 70, arcY: -6 },
                                    { key: 'Challenge', label: 'CHALLENGE', emoji: '⚡', count: categoryStats.find(c => c.key === 'Challenge')?.count ?? 0, color: '#fb923c', bg: 'rgba(251,146,60,0.32)', glare: 'rgba(251,146,60,0.65)', anim: 'msFloat2', dur: 4.3, size: 64, arcY: 10 },
                                    { key: 'Idea', label: 'IDEA', emoji: '💡', count: categoryStats.find(c => c.key === 'Idea')?.count ?? 0, color: '#fbbf24', bg: 'rgba(251,191,36,0.32)', glare: 'rgba(251,191,36,0.70)', anim: 'msFloat3', dur: 3.5, size: 78, arcY: -14 },
                                    { key: 'Issue', label: 'ISSUE', emoji: '🔥', count: categoryStats.find(c => c.key === 'Issue')?.count ?? 0, color: '#f87171', bg: 'rgba(248,113,113,0.32)', glare: 'rgba(248,113,113,0.65)', anim: 'msFloat4', dur: 4.7, size: 62, arcY: 8 },
                                ];
                            } else if (activeLayer === 'logs') {
                                currentBubbles = [
                                    { key: 'BackRoot', label: 'BACK', emoji: '⬅️', count: 0, color: '#9ca3af', bg: 'rgba(156,163,175,0.4)', glare: 'rgba(156,163,175,0.7)', anim: 'msFloat0', dur: 3.5, size: 58, arcY: -4, isFolder: 'root' },
                                    ...activeLogs,
                                ];
                            }

                            return (
                                <div style={{
                                    display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
                                    gap: '0.25rem', marginBottom: '0.2rem',
                                    position: 'relative', zIndex: 4,
                                    flexWrap: 'nowrap',
                                }}>
                                    <AnimatePresence mode="popLayout">
                                        {currentBubbles.map((b, i) => (
                                            <motion.div
                                                key={b.key}
                                                initial={{ opacity: 0, scale: 0.6, y: 15 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.6, y: 15 }}
                                                transition={{ duration: 0.25, delay: i * 0.05, ease: 'easeOut' }}
                                            >
                                                <InlineBubble
                                                    b={b} index={i}
                                                    dropZoneRef={dropZoneRef} dropHighlight={dropHighlight} setDropHighlight={setDropHighlight}
                                                    inputValue={inputValue} setInputValue={setInputValue} inputRef={inputRef}
                                                    setPendingMessage={setPendingMessage} handleCategoryClick={handleCategoryClick} router={router}
                                                    setActiveLayer={setActiveLayer}
                                                    onLogTap={b.isLog ? setActiveLogBubble : undefined}
                                                />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            );
                        })()}

                        {/* ── Log sub-option panel — appears on log bubble tap ── */}
                        <AnimatePresence>
                            {activeLogBubble && (
                                <motion.div
                                    key={activeLogBubble.key + '_panel'}
                                    initial={{ opacity: 0, y: -10, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                                    style={{
                                        margin: '0 0 0.4rem',
                                        padding: '0.65rem 0.75rem 0.55rem',
                                        background: `radial-gradient(ellipse at 20% 0%, ${activeLogBubble.bg}, rgba(6,3,18,0.92))`,
                                        backdropFilter: 'blur(20px)',
                                        WebkitBackdropFilter: 'blur(20px)',
                                        border: `1px solid ${activeLogBubble.color}45`,
                                        borderRadius: 18,
                                        boxShadow: `0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px ${activeLogBubble.color}18`,
                                        position: 'relative', zIndex: 5,
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.32rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: '1rem', lineHeight: 1 }}>{activeLogBubble.emoji}</span>
                                            <span style={{ fontSize: '0.50rem', fontWeight: 800, color: activeLogBubble.color, letterSpacing: '0.09em', textTransform: 'uppercase', fontFamily: "'Inter', system-ui, sans-serif", filter: `drop-shadow(0 0 6px ${activeLogBubble.color}70)` }}>
                                                {activeLogBubble.label}
                                            </span>
                                            <span style={{ fontSize: '0.40rem', color: 'rgba(255,255,255,0.38)', fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: '0.04em' }}>— tap to log ✦</span>
                                        </div>
                                        <button onClick={() => setActiveLogBubble(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.32)', fontSize: '0.9rem', padding: '0 4px', lineHeight: 1, flexShrink: 0 }}>✕</button>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                        {(activeLogBubble.subOptions || []).map((sub: any, si: number) => (
                                            <motion.button
                                                key={sub.label}
                                                initial={{ opacity: 0, x: -6 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: si * 0.04, type: 'spring', stiffness: 400, damping: 28 }}
                                                whileTap={{ scale: 0.86 }}
                                                onClick={() => {
                                                    const msg = `${activeLogBubble.logMsg} — ${sub.detail}`;
                                                    setPendingMessage(msg);
                                                    setActiveLogBubble(null);
                                                    router.push('/bodhi-chat');
                                                }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 5,
                                                    background: 'rgba(255,255,255,0.07)',
                                                    border: `1px solid ${activeLogBubble.color}38`,
                                                    borderRadius: 999,
                                                    padding: '0.27rem 0.62rem 0.27rem 0.40rem',
                                                    cursor: 'pointer',
                                                    backdropFilter: 'blur(10px)',
                                                    WebkitBackdropFilter: 'blur(10px)',
                                                    boxShadow: `0 2px 10px ${activeLogBubble.color}12`,
                                                }}
                                            >
                                                <span style={{ fontSize: '0.82rem', lineHeight: 1 }}>{sub.icon}</span>
                                                <span style={{ fontSize: '0.43rem', fontWeight: 600, color: 'rgba(255,255,255,0.78)', letterSpacing: '0.03em', whiteSpace: 'nowrap', fontFamily: "'Inter', system-ui, sans-serif" }}>{sub.label}</span>
                                            </motion.button>
                                        ))}
                                        <motion.button
                                            initial={{ opacity: 0, x: -6 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: (activeLogBubble.subOptions?.length || 0) * 0.04 }}
                                            whileTap={{ scale: 0.86 }}
                                            onClick={() => {
                                                setPendingMessage(activeLogBubble.logMsg);
                                                setActiveLogBubble(null);
                                                router.push('/bodhi-chat');
                                            }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 4,
                                                background: 'transparent',
                                                border: '1px dashed rgba(255,255,255,0.18)',
                                                borderRadius: 999,
                                                padding: '0.27rem 0.60rem',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <span style={{ fontSize: '0.43rem', fontWeight: 600, color: 'rgba(255,255,255,0.38)', fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: '0.03em' }}>✏️ Tell Bodhi</span>
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── Centered narrow drop zone input bar ── */}
                        <motion.div
                            ref={dropZoneRef}
                            animate={dropHighlight
                                ? { borderColor: 'rgba(251,191,36,0.80)', boxShadow: '0 0 0 4px rgba(251,191,36,0.18), 0 6px 28px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.25)', background: 'rgba(251,191,36,0.06)' }
                                : { borderColor: 'rgba(255,255,255,0.17)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 6px 24px rgba(0,0,0,0.38)', background: 'rgba(255,255,255,0.05)' }
                            }
                            transition={{ duration: 0.22 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.3rem',
                                padding: '0.35rem 0.45rem',
                                borderRadius: 999,
                                width: '92%',
                                maxWidth: 340,
                                backdropFilter: 'blur(12px) saturate(140%)',
                                WebkitBackdropFilter: 'blur(12px) saturate(140%)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                position: 'relative', zIndex: 3,
                                animation: dropHighlight ? 'msBarPulse 1s ease-in-out infinite' : 'none',
                            }}
                        >
                            {/* Icon */}
                            <motion.span
                                animate={dropHighlight ? { scale: [1, 1.5, 1], rotate: [0, 20, -20, 0] } : { scale: 1, rotate: 0 }}
                                transition={{ duration: 0.45 }}
                                style={{ fontSize: '0.95rem', flexShrink: 0, lineHeight: 1 }}
                            >
                                {dropHighlight ? '✨' : '🎯'}
                            </motion.span>

                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                placeholder="Drop bubble or type task..."
                                style={{
                                    flex: 1, minWidth: 0,
                                    background: 'transparent',
                                    border: 'none', outline: 'none',
                                    color: dropHighlight ? '#fbbf24' : 'rgba(255,255,255,0.92)',
                                    fontSize: '0.80rem', fontWeight: 400,
                                    fontFamily: "'Inter', system-ui, sans-serif",
                                    padding: '0.22rem 0.3rem',
                                    transition: 'color 0.25s ease',
                                }}
                            />

                            {/* BODHI btn */}
                            <motion.button
                                whileTap={{ scale: 0.94 }}
                                whileHover={{ scale: 1.06 }}
                                onClick={() => router.push('/bodhi-chat')}
                                style={{
                                    background: 'rgba(251,191,36,0.12)',
                                    backdropFilter: 'blur(8px)',
                                    border: '1px solid rgba(251,191,36,0.28)',
                                    borderRadius: 999,
                                    padding: '0.32rem 0.65rem',
                                    display: 'flex', alignItems: 'center', gap: 4,
                                    cursor: 'pointer',
                                    color: '#fbbf24',
                                    fontSize: '0.58rem',
                                    fontWeight: 700,
                                    fontFamily: "'Inter', system-ui, sans-serif",
                                    letterSpacing: '0.08em',
                                    flexShrink: 0,
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <Sparkles size={10} />
                                BODHI
                            </motion.button>

                            {/* Send btn */}
                            <AnimatePresence>
                                {inputValue.trim() && (
                                    <motion.button
                                        key="send"
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={handleSubmit}
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(251,191,36,0.95) 0%, rgba(245,158,11,0.95) 100%)',
                                            border: 'none', borderRadius: 999,
                                            padding: '0.55rem',
                                            cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#000',
                                            boxShadow: '0 4px 16px rgba(251,191,36,0.48)',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <Send size={14} />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Footer hint */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.08rem' }}>
                            <span style={{ fontSize: '0.48em', color: 'rgba(255,255,255,0.40)', fontStyle: 'italic', fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: '0.02em' }}>
                                Drag bubble → bar · or type · Enter to send to Bodhi
                            </span>
                        </div>
                    </div>

                    <AnimatePresence>
                        {expandedCategory && (() => {
                            const categoryItems = tasks.filter(t => t.category === expandedCategory && !t.done);
                            const categoryConfig = [
                                { key: 'Task', label: 'Tasks', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)' },
                                { key: 'Challenge', label: 'Challenges', color: '#fb923c', bg: 'rgba(251, 146, 60, 0.15)' },
                                { key: 'Idea', label: 'Ideas', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' },
                                { key: 'Issue', label: 'Issues', color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)' },
                            ].find(c => c.key === expandedCategory);

                            return (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                    style={{
                                        overflow: 'hidden',
                                        marginBottom: '0.85rem',
                                    }}
                                >
                                    <div style={{
                                        background: 'rgba(20, 20, 35, 0.40)',
                                        backdropFilter: 'blur(20px) saturate(160%)',
                                        borderRadius: 20,
                                        border: `1px solid ${categoryConfig?.color || '#fbbf24'}40`,
                                        padding: '1rem',
                                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
                                    }}>
                                        {/* Header */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Brain size={18} style={{ color: categoryConfig?.color || '#fbbf24' }} />
                                                <span style={{
                                                    fontSize: '0.75rem', fontWeight: 700,
                                                    color: categoryConfig?.color || '#fbbf24',
                                                    letterSpacing: '0.08em', textTransform: 'uppercase',
                                                    fontFamily: "'Inter', system-ui, sans-serif",
                                                }}>{categoryConfig?.label}</span>
                                                <span style={{
                                                    fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.50)',
                                                    fontFamily: "'Inter', system-ui, sans-serif",
                                                }}>({categoryItems.length})</span>
                                            </div>
                                            <button
                                                onClick={() => setExpandedCategory(null)}
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    color: 'rgba(255, 255, 255, 0.50)', padding: 4,
                                                }}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>

                                        {/* AI Advice Section */}
                                        <div style={{
                                            background: 'rgba(251, 191, 36, 0.10)',
                                            borderRadius: 12,
                                            padding: '0.75rem',
                                            marginBottom: '0.75rem',
                                            border: '1px solid rgba(251, 191, 36, 0.25)',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                <Sparkles size={14} style={{ color: '#fbbf24' }} />
                                                <span style={{
                                                    fontSize: '0.6rem', fontWeight: 700, color: '#fbbf24',
                                                    letterSpacing: '0.1em', textTransform: 'uppercase',
                                                    fontFamily: "'Inter', system-ui, sans-serif",
                                                }}>AI Sakha Bodhi Advice</span>
                                            </div>

                                            {isGeneratingAdvice === expandedCategory ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ display: 'flex', gap: 3 }}>
                                                        {[0, 0.15, 0.3].map(d => (
                                                            <motion.div key={d}
                                                                animate={{ y: [0, -4, 0] }}
                                                                transition={{ duration: 0.6, repeat: Infinity, delay: d }}
                                                                style={{ width: 5, height: 5, borderRadius: '50%', background: '#fbbf24' }}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span style={{
                                                        fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.70)',
                                                        fontStyle: 'italic',
                                                    }}>Bodhi is generating wisdom...</span>
                                                </div>
                                            ) : (
                                                <p style={{
                                                    margin: 0, fontSize: '0.72rem', lineHeight: 1.5,
                                                    color: 'rgba(255, 255, 255, 0.90)',
                                                    fontStyle: 'italic',
                                                }}>{aiAdvice[expandedCategory] || "Click to receive personalized guidance from your AI Sakha."}</p>
                                            )}
                                        </div>

                                        {/* Items List */}
                                        {categoryItems.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {categoryItems.map((item, idx) => (
                                                    <motion.div
                                                        key={item.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '0.6rem',
                                                            padding: '0.6rem 0.75rem',
                                                            background: 'rgba(255, 255, 255, 0.06)',
                                                            borderRadius: 12,
                                                            border: '1px solid rgba(255, 255, 255, 0.10)',
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '1rem' }}>{item.icon || '✨'}</span>
                                                        <span style={{
                                                            flex: 1, fontSize: '0.75rem',
                                                            color: 'rgba(255, 255, 255, 0.90)',
                                                            lineHeight: 1.4,
                                                        }}>{item.text}</span>
                                                        <button
                                                            onClick={() => handleComplete(item)}
                                                            style={{
                                                                background: categoryConfig?.bg || 'rgba(251, 191, 36, 0.15)',
                                                                border: `1px solid ${categoryConfig?.color || '#fbbf24'}40`,
                                                                borderRadius: 999,
                                                                padding: '0.35rem 0.7rem',
                                                                cursor: 'pointer',
                                                                color: categoryConfig?.color || '#fbbf24',
                                                                fontSize: '0.55rem',
                                                                fontWeight: 700,
                                                                letterSpacing: '0.06em',
                                                                textTransform: 'uppercase',
                                                                display: 'flex', alignItems: 'center', gap: 4,
                                                            }}
                                                        >
                                                            <Check size={10} />
                                                            Done
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{
                                                textAlign: 'center', padding: '1.5rem',
                                                color: 'rgba(255, 255, 255, 0.50)',
                                            }}>
                                                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>✨</span>
                                                <span style={{ fontSize: '0.7rem' }}>No {categoryConfig?.label.toLowerCase()} yet. Add one below!</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })()}
                    </AnimatePresence>
                </div>

            </motion.div>


            {/* ── Calendar (toggleable) ── */}
            <AnimatePresence>
                {
                    showCalendar && (
                        <motion.div key="calendar" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} style={{ overflow: 'hidden' }}>
                            <MiniCalendar tasks={tasks} onDateSelect={d => { setFilterDate(prev => prev === d ? null : d); }} />
                            {filterDate && <p style={{ margin: '0.3rem 0 0', fontSize: '0.54rem', color: 'rgba(251,191,36,0.55)', fontFamily: 'monospace', letterSpacing: '0.10em', textAlign: 'center' }}>Showing: {filterDate} · tap again to clear</p>}
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* ── Schedule Prompt ── */}
            <AnimatePresence>
                {
                    schedulingId && (() => {
                        const task = tasks.find(t => t.id === schedulingId);
                        return task ? (
                            <SchedulePrompt key={`sched-${schedulingId}`} pill={task}
                                onSchedule={(date, time) => handleSchedule(schedulingId, date, time)}
                                onSkip={() => setSchedulingId(null)} />
                        ) : null;
                    })()
                }
            </AnimatePresence >

            {/* ── Chat History ── */}
            <AnimatePresence>
                {
                    chatHistory.length > 0 && (
                        <motion.div
                            key="chat"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{
                                overflow: 'hidden',
                                background: 'rgba(20, 20, 30, 0.45)',
                                backdropFilter: 'blur(24px) saturate(180%)',
                                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                                borderRadius: 18,
                                border: '1px solid rgba(251, 191, 36, 0.20)',
                                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
                            }}
                        >
                            <div style={{
                                display: 'flex', flexDirection: 'column', gap: '0.45rem',
                                padding: '0.75rem',
                                maxHeight: 220, overflowY: 'auto',
                                scrollbarWidth: 'none',
                            }}>
                                {chatHistory.map(msg => (
                                    <motion.div key={msg.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.30 }}
                                        style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
                                    >
                                        <div style={{
                                            maxWidth: '82%',
                                            padding: '0.42rem 0.80rem',
                                            borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                            background: msg.role === 'user'
                                                ? 'rgba(251, 191, 36, 0.20)'
                                                : 'rgba(255, 255, 255, 0.12)',
                                            border: msg.role === 'user'
                                                ? '1px solid rgba(251, 191, 36, 0.35)'
                                                : '1px solid rgba(255, 255, 255, 0.20)',
                                            boxShadow: msg.role === 'bodhi' ? '0 2px 8px rgba(0, 0, 0, 0.2)' : 'none',
                                        }}>
                                            {msg.role === 'bodhi' && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.14rem' }}>
                                                    <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }}>
                                                        <Sparkles size={8} style={{ color: '#fbbf24' }} />
                                                    </motion.div>
                                                    <span style={{ fontSize: '0.46rem', fontWeight: 700, letterSpacing: '0.18em', color: '#fbbf24', textTransform: 'uppercase', fontFamily: 'monospace' }}>Sakha Bodhi</span>
                                                </div>
                                            )}
                                            <p style={{ margin: 0, fontSize: '0.72rem', lineHeight: 1.5, color: 'rgba(255, 255, 255, 0.95)', fontStyle: msg.role === 'bodhi' ? 'italic' : 'normal' }}>{msg.text}</p>
                                            {msg.saved && msg.itemType && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.18rem' }}>
                                                    <Check size={8} style={{ color: '#4ade80' }} />
                                                    <span style={{ fontSize: '0.44rem', color: 'rgba(74, 222, 128, 0.90)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'monospace' }}>Saved as {msg.itemType}</span>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                                {/* Bodhi thinking indicator */}
                                {bodhiState === 'thinking' && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.65rem' }}
                                    >
                                        <div style={{ display: 'flex', gap: 3 }}>
                                            {[0, 0.18, 0.36].map(d => (
                                                <motion.div key={d}
                                                    animate={{ y: [0, -4, 0] }}
                                                    transition={{ duration: 0.7, repeat: Infinity, delay: d }}
                                                    style={{ width: 5, height: 5, borderRadius: '50%', background: '#fbbf24' }}
                                                />
                                            ))}
                                        </div>
                                        <span style={{ fontSize: '0.50rem', color: '#fbbf24', fontStyle: 'italic' }}>Bodhi is thinking…</span>
                                    </motion.div>
                                )}
                                <div ref={chatEndRef} />
                            </div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* ── Speaking Banner ── */}
            <AnimatePresence>
                {
                    bodhiState === 'speaking' && (
                        <motion.div
                            key="speaking-banner"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.6rem',
                                padding: '0.55rem 0.9rem',
                                background: 'rgba(20, 20, 30, 0.55)',
                                backdropFilter: 'blur(20px) saturate(180%)',
                                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                                border: '1px solid rgba(251, 191, 36, 0.30)',
                                borderRadius: 14,
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                                overflow: 'hidden',
                                position: 'relative',
                            }}
                        >
                            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                                {[0, 0.12, 0.24, 0.12, 0].map((d, i) => (
                                    <motion.div key={i}
                                        animate={{ scaleY: [0.4, 1.4, 0.4] }}
                                        transition={{ duration: 0.9, repeat: Infinity, delay: d }}
                                        style={{ width: 3, height: 14, borderRadius: 2, background: '#fbbf24', transformOrigin: 'center' }}
                                    />
                                ))}
                            </div>
                            <span style={{ fontSize: '0.58rem', color: '#fbbf24', fontStyle: 'italic', fontWeight: 500 }}>Bodhi is speaking… type your reply when done</span>
                            <button
                                onClick={() => { window.speechSynthesis?.cancel(); setBodhiState('idle'); }}
                                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255, 255, 255, 0.40)', lineHeight: 0, padding: 2, flexShrink: 0 }}
                            ><X size={12} /></button>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* ── Active Items Bubble Grid ── */}
            {
                activeTasks.length > 0 && (
                    <div style={{ position: 'relative' }}>
                        {activeTasks.length > 4 && (
                            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 28, background: 'linear-gradient(to bottom, transparent, rgba(20, 20, 30, 0.80))', pointerEvents: 'none', zIndex: 2, borderRadius: '0 0 18px 18px' }} />
                        )}
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '0.45rem',
                            maxHeight: activeTasks.length > 4 ? 250 : 'none',
                            overflowY: activeTasks.length > 4 ? 'auto' : 'visible',
                            scrollbarWidth: 'none', paddingBottom: activeTasks.length > 4 ? 24 : 0,
                        }}>
                            <AnimatePresence mode="popLayout">
                                {activeTasks.map((task, idx) => {
                                    const c = CM[task.colorClass] || CM.gold;
                                    const CAT_META: Record<string, { color: string; emoji: string; doneLabel: string }> = {
                                        Issue: { color: '#f87171', emoji: '🔥', doneLabel: 'Resolved' },
                                        Wellness: { color: '#34d399', emoji: '🌿', doneLabel: 'Done' },
                                        default: { color: c.text, emoji: task.icon || '✅', doneLabel: 'Done' },
                                    };
                                    const meta = CAT_META[task.category] ?? CAT_META.default;
                                    const catColor = meta.color;
                                    const catEmoji = task.icon || meta.emoji;
                                    return (
                                        <motion.div key={task.id} layout
                                            initial={{ opacity: 0, scale: 0.72, y: 18, filter: 'blur(10px)' }}
                                            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                                            exit={{ opacity: 0, scale: 0.65, y: -12, filter: 'blur(8px)' }}
                                            transition={{ type: 'spring', stiffness: 340, damping: 26, delay: idx * 0.04 }}
                                            style={{
                                                display: 'flex', flexDirection: 'column', gap: '0.25rem',
                                                position: 'relative', overflow: 'hidden',
                                                borderRadius: 16, padding: '0.62rem 0.70rem',
                                                background: `linear-gradient(145deg, rgba(255, 255, 255, 0.12) 0%, ${c.bg} 100%)`,
                                                backdropFilter: 'blur(16px)',
                                                WebkitBackdropFilter: 'blur(16px)',
                                                border: `1px solid ${c.border}`,
                                                boxShadow: `0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.20)`,
                                                minWidth: 0,
                                            }}>
                                            {/* Header row */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', position: 'relative', zIndex: 1 }}>
                                                <span style={{ fontSize: '0.82rem' }}>{catEmoji}</span>
                                                <span style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.10em', color: c.text, textTransform: 'uppercase', fontFamily: 'monospace' }}>{task.category}</span>
                                                {task.scheduledTime && <span style={{ marginLeft: 'auto', fontSize: '0.44rem', color: c.text, opacity: 0.85, fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 2 }}><Clock size={7} />{task.scheduledTime}</span>}
                                            </div>
                                            {/* Task text */}
                                            <span style={{ fontSize: '0.74rem', fontWeight: 500, lineHeight: 1.4, color: 'rgba(255, 255, 255, 0.95)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', width: '100%', position: 'relative', zIndex: 1, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{task.text}</span>
                                            {/* Actions */}
                                            <div style={{ display: 'flex', gap: '0.22rem', width: '100%', marginTop: 4, position: 'relative', zIndex: 1 }}>
                                                <button onClick={() => handleComplete(task)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 999, padding: '0.22rem 0', cursor: 'pointer', color: c.text, fontSize: '0.50rem', fontWeight: 600, fontFamily: 'inherit', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                                    <Check size={8} /> {meta.doneLabel}
                                                </button>
                                                <button onClick={() => setSchedulingId(task.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.10)', border: `1px solid ${c.border}`, borderRadius: 999, padding: '0.22rem 0.42rem', cursor: 'pointer', color: c.text }}>
                                                    <Clock size={8} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
