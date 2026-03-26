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

// ── Main Component ─────────────────────────────────────────────────────────
export default function MagicSyncModule({ items: tasks, onToggle, onRemove, onAdd, onUpdate }: MagicSyncModuleProps) {
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [schedulingId, setSchedulingId] = useState<string | null>(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [aiAdvice, setAiAdvice] = useState<Record<string, string>>({});
    const [isGeneratingAdvice, setIsGeneratingAdvice] = useState<string | null>(null);
    const [filterDate, setFilterDate] = useState<string | null>(null);
    const [hoveredBubble, setHoveredBubble] = useState<number | null>(null);
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

    return (
        <div style={{
            width: '100%',
            display: 'flex', flexDirection: 'column', gap: '0.55rem',
            position: 'relative',
        }}>

            {/* ── SMART MANAGER PREMIUM GLASS CARD ── */}
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    position: 'relative',
                    borderRadius: 28,
                    padding: '1.25rem 1.1rem 1rem',
                    background: 'rgba(0, 0, 0, 0.08)',
                    backdropFilter: 'blur(2px) saturate(110%)',
                    WebkitBackdropFilter: 'blur(2px) saturate(110%)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden',
                }}
            >
                {/* Subtle shimmer — no dark ambient glow */}
                <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: 'radial-gradient(ellipse at 30% 0%, rgba(251, 191, 36, 0.06) 0%, transparent 50%)',
                }} />


                {/* ── SMART MANAGER HEADER ── */}
                <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
                    <div style={{ flex: 1 }}>
                        <h2 style={{
                            margin: 0, fontSize: 'clamp(0.58rem, 2.3vw, 0.74rem)',
                            fontWeight: 700, lineHeight: 1.3, letterSpacing: '0.14em',
                            color: '#fbbf24',
                            fontFamily: "'Inter', system-ui, sans-serif",
                            textTransform: 'uppercase',
                        }}>
                            <span style={{ marginRight: 6 }}>✦</span>
                            Add your tasks, Challenges & ideas
                        </h2>
                        <p style={{
                            margin: '0.4rem 0 0', fontSize: 'clamp(0.64rem, 2.7vw, 0.76rem)',
                            color: 'rgba(255, 255, 255, 0.65)',
                            fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                            letterSpacing: '0.02em',
                            fontWeight: 400,
                            fontStyle: 'italic',
                        }}>
                            Calm your mind · Your AI Sakha <span style={{ color: '#fbbf24', fontWeight: 500 }}>Bodhi</span> will advise and schedule it
                        </p>
                    </div>

                    {/* ── RIGHT ACTION COLUMN ── */}
                    {/* ── SMART PLANNER ACTION BUTTON ── */}
                    <Link href="/vedic-planner" style={{ textDecoration: 'none', flexShrink: 0 }}>
                        <motion.div
                            whileHover={{ scale: 1.05, y: -2, transition: { duration: 0.2 } }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '0.45rem 0.8rem',
                                borderRadius: 14,
                                position: 'relative', overflow: 'hidden',
                                cursor: 'pointer',
                                background: 'radial-gradient(ellipse at top left, rgba(251,191,36,0.2) 0%, rgba(10,15,30,0.6) 100%)',
                                backdropFilter: 'blur(16px) saturate(140%)',
                                WebkitBackdropFilter: 'blur(16px) saturate(140%)',
                                border: '1px solid rgba(251,191,36,0.35)',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.15)',
                            }}
                        >
                            <Calendar size={18} strokeWidth={2.5} style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 6px #fbbf24)' }} />
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
                                <span style={{
                                    fontSize: '0.50rem', fontWeight: 700,
                                    letterSpacing: '0.14em', textTransform: 'uppercase',
                                    color: 'rgba(255,255,255,0.7)',
                                    fontFamily: "'Inter', system-ui, sans-serif",
                                }}>Smart</span>
                                <span style={{
                                    fontSize: '0.65rem', fontWeight: 800,
                                    letterSpacing: '0.12em', textTransform: 'uppercase',
                                    color: '#fbbf24',
                                    fontFamily: "'Inter', system-ui, sans-serif",
                                }}>Planner</span>
                            </div>
                        </motion.div>
                    </Link>
                </div>

                {/* ── 2x2 GLASSY PILL GRID ── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.8rem',
                    marginBottom: '1.5rem',
                    zIndex: 2,
                    position: 'relative'
                }}>
                    {[
                        { key: 'Task', label: 'TASKS', count: categoryStats.find(c => c.key === 'Task')?.count ?? 0, icon: '✦', color: '#4ade80' },
                        { key: 'Challenge', label: 'CHALLENGES', count: categoryStats.find(c => c.key === 'Challenge')?.count ?? 0, icon: '⚡', color: '#fb923c' },
                        { key: 'Idea', label: 'IDEAS', count: categoryStats.find(c => c.key === 'Idea')?.count ?? 0, icon: '♦', color: '#fbbf24' },
                        { key: 'Issue', label: 'ISSUES', count: categoryStats.find(c => c.key === 'Issue')?.count ?? 0, icon: '🔺', color: '#f87171' },
                    ].map((b, i) => {
                        const isActive = expandedCategory === b.key;
                        return (
                            <motion.button
                                key={b.key}
                                onClick={() => handleCategoryClick(b.key)}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
                                whileHover={{ scale: 1.04, backgroundColor: 'rgba(255,255,255,0.08)' }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.45rem 0.65rem',
                                    borderRadius: '999px',
                                    background: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                                    border: isActive ? `1.5px solid ${b.color}50` : '1px solid rgba(255,255,255,0.15)',
                                    backdropFilter: 'blur(16px)',
                                    WebkitBackdropFilter: 'blur(16px)',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    boxShadow: isActive ? `0 0 15px ${b.color}20, inset 0 2px 5px rgba(255,255,255,0.1)` : 'inset 0 1px 1px rgba(255,255,255,0.1)',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ color: b.color, fontSize: '0.55rem', filter: `drop-shadow(0 0 5px ${b.color}40)` }}>{b.icon}</span>
                                    <span style={{
                                        color: '#ffffff',
                                        fontSize: '0.42rem',
                                        fontWeight: 700,
                                        letterSpacing: '0.12em',
                                        fontFamily: "'Inter', system-ui, sans-serif"
                                    }}>
                                        {b.label}
                                    </span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minWidth: '15px',
                                    height: '15px',
                                    borderRadius: '50%',
                                    background: b.count > 0 ? b.color : 'rgba(255,255,255,0.1)',
                                    color: b.count > 0 ? '#000000' : 'rgba(255,255,255,0.6)',
                                    fontSize: '0.42rem',
                                    fontWeight: 800,
                                    padding: '0 3px',
                                    boxShadow: b.count > 0 ? `0 0 8px ${b.color}60` : 'inset 0 1px 2px rgba(0,0,0,0.2)'
                                }}>
                                    {b.count}
                                </div>
                            </motion.button>
                        );
                    })}
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

                {/* ── Premium Input Bar ── */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 0.6rem',
                    borderRadius: 999,
                    background: 'rgba(255, 255, 255, 0.10)',
                    backdropFilter: 'blur(24px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                    border: '1.5px solid rgba(255, 255, 255, 0.20)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 6px 24px rgba(0, 0, 0, 0.35)',
                    position: 'relative', zIndex: 2,
                }}>
                    <input
                        ref={inputRef} type="text" value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        placeholder="Type a task — Sakha Bodhi will advise and schedule it..."
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none', outline: 'none',
                            color: 'rgba(255, 255, 255, 0.95)',
                            fontSize: '0.9rem', fontWeight: 400,
                            fontFamily: "'Inter', system-ui, sans-serif",
                            padding: '0.3rem 0.5rem',
                        }}
                    />

                    {/* BODHI Button */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => router.push('/bodhi-chat')}
                        style={{
                            background: 'rgba(251, 191, 36, 0.15)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(251, 191, 36, 0.30)',
                            borderRadius: 999,
                            padding: '0.4rem 0.8rem',
                            display: 'flex', alignItems: 'center', gap: 5,
                            cursor: 'pointer',
                            color: '#fbbf24',
                            fontSize: '0.6rem',
                            fontWeight: 600,
                            fontFamily: "'Inter', system-ui, sans-serif",
                            letterSpacing: '0.06em',
                            flexShrink: 0,
                        }}
                    >
                        <Sparkles size={12} />
                        BODHI
                    </motion.button>

                    {inputValue.trim() ? (
                        <motion.button
                            onClick={handleSubmit}
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ scale: 1.1 }}
                            style={{
                                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.95) 0%, rgba(245, 158, 11, 0.95) 100%)',
                                border: 'none',
                                borderRadius: 999,
                                padding: '0.65rem',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#000',
                                boxShadow: '0 4px 18px rgba(251, 191, 36, 0.45)',
                            }}
                        >
                            <Send size={18} />
                        </motion.button>
                    ) : null}
                </div>

                {/* Keyboard hint */}
                <div style={{
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
                    marginTop: '0.6rem',
                }}>
                    <span style={{
                        fontSize: '0.6rem', color: 'rgba(255, 255, 255, 0.40)',
                        fontFamily: "'Inter', system-ui, sans-serif",
                        letterSpacing: '0.05em',
                    }}>
                        Press Enter to submit · Click bubbles to view with AI advice
                    </span>
                </div>
            </motion.div >

            {/* Animation keyframes for spinning rings */}
            < style > {`
                @keyframes ring-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style >

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
