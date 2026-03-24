'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
    blue: { text: 'rgba(147,197,253,0.95)', border: 'rgba(96,165,250,0.30)', bg: 'rgba(30,64,175,0.15)', glow: 'rgba(96,165,250,0.18)' },
    green: { text: 'rgba(110,231,183,0.95)', border: 'rgba(52,211,153,0.30)', bg: 'rgba(6,78,59,0.15)', glow: 'rgba(52,211,153,0.18)' },
    teal: { text: 'rgba(94,234,212,0.95)', border: 'rgba(20,184,166,0.30)', bg: 'rgba(19,78,74,0.15)', glow: 'rgba(20,184,166,0.18)' },
    purple: { text: 'rgba(216,180,254,0.95)', border: 'rgba(167,139,250,0.30)', bg: 'rgba(88,28,135,0.15)', glow: 'rgba(167,139,250,0.18)' },
    gold: { text: 'rgba(252,211,77,0.95)', border: 'rgba(251,191,36,0.30)', bg: 'rgba(120,53,15,0.15)', glow: 'rgba(251,191,36,0.18)' },
    pink: { text: 'rgba(249,168,212,0.95)', border: 'rgba(244,114,182,0.30)', bg: 'rgba(131,24,67,0.15)', glow: 'rgba(244,114,182,0.18)' },
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
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button onClick={() => setViewDate(new Date(year, month - 1, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.40)', padding: 4, lineHeight: 0 }}><ChevronLeft size={14} /></button>
                <span style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', fontFamily: 'monospace' }}>{MONTHS[month]} {year}</span>
                <button onClick={() => setViewDate(new Date(year, month + 1, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.40)', padding: 4, lineHeight: 0 }}><ChevronRight size={14} /></button>
            </div>
            {/* Day labels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                {DAYS.map((d, i) => <span key={i} style={{ fontSize: '0.50rem', color: 'rgba(255,255,255,0.25)', textAlign: 'center', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{d}</span>)}
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
                                aspectRatio: '1', borderRadius: '50%', border: isToday ? '1.5px solid rgba(251,191,36,0.65)' : '1px solid transparent',
                                background: hasTasks ? 'rgba(251,191,36,0.15)' : 'transparent',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1,
                                padding: 0, position: 'relative',
                            }}>
                            <span style={{ fontSize: '0.58rem', color: isToday ? 'rgba(251,191,36,0.90)' : 'rgba(255,255,255,0.50)', fontWeight: isToday ? 700 : 400, fontFamily: 'monospace', lineHeight: 1 }}>{d}</span>
                            {hasTasks && <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(251,191,36,0.80)' }} />}
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
            style={{ background: 'rgba(8,6,20,0.96)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', border: `1px solid ${colors.border}`, borderRadius: 20, padding: '1rem 1.1rem', boxShadow: `0 8px 40px rgba(0,0,0,0.60), 0 0 20px ${colors.glow}`, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Clock size={13} style={{ color: colors.text }} />
                <p style={{ margin: 0, fontSize: '0.60rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: colors.text }}>When will you do this?</p>
                <button onClick={onSkip} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.30)', lineHeight: 0, padding: 2 }}><X size={13} /></button>
            </div>
            <p style={{ margin: 0, fontSize: '0.64rem', color: 'rgba(255,255,255,0.40)', fontStyle: 'italic' }}>Tasks with a set time are 3× more likely to get done.</p>

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
                    style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '0.36rem 0.9rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.64rem', outline: 'none', fontFamily: 'inherit' }} />
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
    const [filterDate, setFilterDate] = useState<string | null>(null);
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

    // ── Core submit (text or voice) ──────────────────────────────────────────
    const submitMessage = useCallback(async (overrideText?: string) => {
        const text = (overrideText ?? inputValue).trim();
        if (!text || bodhiState !== 'idle') return;
        setInputValue('');
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(55);

        const itemType = detectItemType(text);
        const isConversationalReply = chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'bodhi';

        // Save to task planner unless pure conversational reply with no actionable content
        let savedTaskId: string | null = null;
        if (!isConversationalReply || itemType !== 'task' || text.length > 12) {
            const instantStyle = keywordCategorize(text);
            const categoryOverride =
                itemType === 'challenge' ? 'Challenge' :
                    itemType === 'issue' ? 'Issue' :
                        itemType === 'idea' ? 'Idea' :
                            instantStyle.category;
            const iconOverride =
                itemType === 'challenge' ? '⚡' :
                    itemType === 'issue' ? '🔥' :
                        itemType === 'idea' ? '💡' :
                            instantStyle.icon;
            const newTask: TaskItem = {
                id: Date.now().toString(), text,
                ...instantStyle,
                icon: iconOverride,
                category: categoryOverride,
                done: false, createdAt: Date.now(),
            };
            onAdd(newTask);
            savedTaskId = newTask.id;
            if (!isConversationalReply) setSchedulingId(newTask.id);
            categorizeViaGemini(text).then(style => onUpdate(newTask.id, { ...style, category: categoryOverride }));
        }

        // Add user message to chat
        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text, ts: Date.now(), itemType, saved: !!savedTaskId };
        setChatHistory(prev => [...prev, userMsg]);

        // Activate Bodhi → think
        setBodhiState('thinking');
        try {
            const response = await bodhiChatResponse(text, [...chatHistory, userMsg], tasks, !!savedTaskId, itemType);
            const bodhiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'bodhi', text: response, ts: Date.now() };
            setChatHistory(prev => [...prev, bodhiMsg]);
            setBodhiState('speaking');
            speakWithTTS(response, () => setBodhiState('idle'));
        } catch {
            setBodhiState('idle');
        }
    }, [inputValue, bodhiState, chatHistory, tasks, onAdd, onUpdate]);

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

    const activeTasks = tasks.filter(t => !t.done && (!filterDate || t.scheduledDate === filterDate));
    const donePct = tasks.length > 0 ? Math.round((tasks.filter(t => t.done).length / tasks.length) * 100) : 0;

    return (
        <div style={{
            width: '100%', maxWidth: 700, margin: '0 auto',
            display: 'flex', flexDirection: 'column', gap: '0.80rem',
            padding: '0 0.8rem',
            position: 'relative',
        }}>

            {/* ── WORLD-CLASS COMMAND CENTRE HEADER ── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    position: 'relative',
                    borderRadius: 22,
                    padding: '1.1rem 1.2rem 1rem',
                    background: 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.13) 0%, rgba(251,191,36,0.07) 35%, rgba(129,140,248,0.05) 65%, transparent 100%)',
                    backdropFilter: 'blur(32px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(32px) saturate(200%)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    boxShadow: '0 0 40px rgba(251,191,36,0.06), 0 8px 40px rgba(0,0,0,0.22), inset 0 1.5px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                }}
            >
                {/* ── Water bubble: primary specular crescent (top-left) ── */}
                <div aria-hidden style={{ position: 'absolute', top: '4%', left: '8%', width: '55%', height: '32%', background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.52) 0%, rgba(255,255,255,0.18) 40%, transparent 100%)', borderRadius: '50%', transform: 'rotate(-22deg)', filter: 'blur(3px)', pointerEvents: 'none' }} />
                {/* ── Tiny bright specular dot (top-right) ── */}
                <div aria-hidden style={{ position: 'absolute', top: '10%', right: '20%', width: '10%', height: '8%', background: 'radial-gradient(circle, rgba(255,255,255,0.75) 0%, transparent 100%)', borderRadius: '50%', filter: 'blur(1px)', pointerEvents: 'none' }} />
                {/* ── Rim light (bottom) ── */}
                <div aria-hidden style={{ position: 'absolute', bottom: '4%', left: '18%', right: '18%', height: '6%', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.14), transparent)', borderRadius: '50%', filter: 'blur(2px)', pointerEvents: 'none' }} />
                {/* ── Jelly color aurora ── */}
                <div aria-hidden style={{ position: 'absolute', bottom: 0, left: '4%', right: '4%', height: '55%', background: 'radial-gradient(ellipse at center bottom, rgba(251,191,36,0.12) 0%, rgba(129,140,248,0.07) 45%, transparent 75%)', filter: 'blur(12px)', pointerEvents: 'none' }} />
                {/* ── Trapped micro-bubbles ── */}
                {[{ x: 18, y: 72, r: 3 }, { x: 72, y: 78, r: 2.2 }, { x: 48, y: 82, r: 1.6 }, { x: 85, y: 68, r: 2.6 }, { x: 8, y: 85, r: 1.8 }].map((b, i) => (
                    <div key={i} aria-hidden style={{ position: 'absolute', left: `${b.x}%`, top: `${b.y}%`, width: b.r * 2, height: b.r * 2, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.10) 50%, transparent 100%)', border: '0.5px solid rgba(255,255,255,0.28)', pointerEvents: 'none' }} />
                ))}

                {/* Top row: Title + Action buttons */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.6rem', marginBottom: '0.75rem', position: 'relative', zIndex: 1 }}>
                    {/* Left: Icon + Headline */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.7rem', minWidth: 0 }}>
                        {/* Pulsing brain icon */}
                        <motion.div
                            animate={{ scale: [1, 1.08, 1], boxShadow: ['0 0 12px rgba(251,191,36,0.25)', '0 0 22px rgba(251,191,36,0.50)', '0 0 12px rgba(251,191,36,0.25)'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            style={{
                                width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                                background: 'linear-gradient(145deg, rgba(251,191,36,0.20), rgba(217,119,6,0.15))',
                                border: '1px solid rgba(251,191,36,0.35)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <Brain size={18} style={{ color: '#fbbf24' }} />
                        </motion.div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.18rem' }}>
                                <Sparkles size={10} style={{ color: 'rgba(251,191,36,0.80)', flexShrink: 0 }} />
                                <span style={{
                                    fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.20em', textTransform: 'uppercase',
                                    color: 'rgba(251,191,36,0.70)', fontFamily: 'monospace', whiteSpace: 'nowrap',
                                }}>AI Life Command Centre</span>
                            </div>
                            <h3 style={{
                                margin: 0,
                                fontSize: 'clamp(0.88rem, 3.2vw, 1.05rem)',
                                fontWeight: 800, lineHeight: 1.25, letterSpacing: '-0.01em',
                                background: 'linear-gradient(120deg, #ffffff 0%, #fde68a 45%, #c4b5fd 100%)',
                                WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                            }}>
                                Manage your life, Challenges, Tasks and Issues.....
                            </h3>
                            <p style={{ margin: '0.18rem 0 0', fontSize: '0.60rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.45, fontStyle: 'italic' }}>
                                Bodhi AI will advise, categorise & schedule everything
                            </p>
                        </div>
                    </div>

                    {/* Right: Stats + Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', flexShrink: 0 }}>
                        {tasks.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.14rem' }}>
                                <span style={{ fontSize: '0.50rem', color: 'rgba(255,255,255,0.40)', fontWeight: 700, letterSpacing: '0.08em' }}>{tasks.filter(t => !t.done).length} active · {donePct}%</span>
                                <div style={{ width: 62, height: 3.5, borderRadius: 999, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                                    <motion.div
                                        animate={{ width: `${donePct}%` }}
                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                        style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #fbbf24, #a78bfa)' }}
                                    />
                                </div>
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            {/* PLANNER button — premium */}
                            <Link href="/vedic-planner" style={{ textDecoration: 'none' }}>
                                <motion.div
                                    whileHover={{ scale: 1.07, boxShadow: '0 0 28px rgba(251,191,36,0.60), 0 0 50px rgba(251,191,36,0.22)' }}
                                    whileTap={{ scale: 0.93 }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.28rem',
                                        padding: '0.38rem 0.80rem', borderRadius: 999,
                                        background: 'linear-gradient(135deg, rgba(251,191,36,0.28) 0%, rgba(217,119,6,0.20) 100%)',
                                        border: '1.5px solid rgba(251,191,36,0.55)',
                                        boxShadow: '0 0 16px rgba(251,191,36,0.22), inset 0 1px 0 rgba(255,255,255,0.12)',
                                        cursor: 'pointer', position: 'relative', overflow: 'hidden',
                                    }}
                                >
                                    <motion.div
                                        animate={{ x: ['-120%', '220%'] }}
                                        transition={{ duration: 2.2, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
                                        style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.20), transparent)', pointerEvents: 'none' }}
                                    />
                                    <LayoutGrid size={11} style={{ color: '#fbbf24', flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.54rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#fde68a', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                                        Planner
                                    </span>
                                </motion.div>
                            </Link>
                            {/* Calendar */}
                            <button onClick={() => setShowCalendar(s => !s)} style={{ background: showCalendar ? 'rgba(251,191,36,0.14)' : 'rgba(255,255,255,0.06)', border: showCalendar ? '1.5px solid rgba(251,191,36,0.40)' : '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '0.32rem 0.55rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.22rem' }}>
                                <Calendar size={11} style={{ color: showCalendar ? '#fbbf24' : 'rgba(255,255,255,0.42)' }} />
                                <span style={{ fontSize: '0.48rem', fontFamily: 'monospace', letterSpacing: '0.12em', textTransform: 'uppercase', color: showCalendar ? '#fbbf24' : 'rgba(255,255,255,0.35)' }}>Cal</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Category pills row */}
                <div style={{ display: 'flex', gap: '0.38rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
                    {[
                        { emoji: '✅', label: 'Tasks', color: '#4ade80', bg: 'rgba(74,222,128,0.10)', border: 'rgba(74,222,128,0.25)' },
                        { emoji: '⚡', label: 'Challenges', color: '#fb923c', bg: 'rgba(251,146,60,0.10)', border: 'rgba(251,146,60,0.25)' },
                        { emoji: '💡', label: 'Ideas', color: '#fbbf24', bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.25)' },
                        { emoji: '🔥', label: 'Issues', color: '#f87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.25)' },
                    ].map(p => (
                        <div key={p.label} style={{
                            display: 'flex', alignItems: 'center', gap: '0.22rem',
                            padding: '0.20rem 0.55rem', borderRadius: 999,
                            background: p.bg, border: `1px solid ${p.border}`,
                        }}>
                            <span style={{ fontSize: '0.62rem', lineHeight: 1 }}>{p.emoji}</span>
                            <span style={{ fontSize: '0.50rem', fontWeight: 700, letterSpacing: '0.10em', color: p.color, textTransform: 'uppercase', fontFamily: 'monospace' }}>{p.label}</span>
                        </div>
                    ))}
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.22)', fontStyle: 'italic', letterSpacing: '0.04em' }}>powered by Sakha Bodhi AI</span>
                    </div>
                </div>
            </motion.div>

            {/* ── Calendar (toggleable) ── */}
            <AnimatePresence>
                {showCalendar && (
                    <motion.div key="calendar" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} style={{ overflow: 'hidden' }}>
                        <MiniCalendar tasks={tasks} onDateSelect={d => { setFilterDate(prev => prev === d ? null : d); }} />
                        {filterDate && <p style={{ margin: '0.3rem 0 0', fontSize: '0.54rem', color: 'rgba(251,191,36,0.55)', fontFamily: 'monospace', letterSpacing: '0.10em', textAlign: 'center' }}>Showing: {filterDate} · tap again to clear</p>}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Schedule Prompt ── */}
            <AnimatePresence>
                {schedulingId && (() => {
                    const task = tasks.find(t => t.id === schedulingId);
                    return task ? (
                        <SchedulePrompt key={`sched-${schedulingId}`} pill={task}
                            onSchedule={(date, time) => handleSchedule(schedulingId, date, time)}
                            onSkip={() => setSchedulingId(null)} />
                    ) : null;
                })()}
            </AnimatePresence>

            {/* ── Bodhi Chat History ── */}
            <AnimatePresence>
                {chatHistory.length > 0 && (
                    <motion.div
                        key="chat"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{
                            overflow: 'hidden',
                            background: 'radial-gradient(ellipse at 30% 10%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
                            backdropFilter: 'blur(24px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                            borderRadius: 18,
                            border: '1px solid rgba(255,255,255,0.14)',
                            boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.18), 0 4px 20px rgba(0,0,0,0.15)',
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
                                            ? 'rgba(255,255,255,0.10)'
                                            : 'linear-gradient(135deg,rgba(251,191,36,0.14),rgba(217,119,6,0.10))',
                                        border: msg.role === 'user'
                                            ? '1px solid rgba(255,255,255,0.10)'
                                            : '1px solid rgba(251,191,36,0.22)',
                                        boxShadow: msg.role === 'bodhi' ? '0 0 12px rgba(251,191,36,0.08)' : 'none',
                                    }}>
                                        {msg.role === 'bodhi' && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.14rem' }}>
                                                <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }}>
                                                    <Sparkles size={8} style={{ color: 'rgba(251,191,36,0.65)' }} />
                                                </motion.div>
                                                <span style={{ fontSize: '0.46rem', fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(251,191,36,0.55)', textTransform: 'uppercase', fontFamily: 'monospace' }}>Sakha Bodhi</span>
                                            </div>
                                        )}
                                        <p style={{ margin: 0, fontSize: '0.72rem', lineHeight: 1.5, color: msg.role === 'bodhi' ? 'rgba(252,211,77,0.92)' : 'rgba(255,255,255,0.85)', fontStyle: msg.role === 'bodhi' ? 'italic' : 'normal' }}>{msg.text}</p>
                                        {msg.saved && msg.itemType && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.18rem' }}>
                                                <Check size={8} style={{ color: '#4ade80' }} />
                                                <span style={{ fontSize: '0.44rem', color: 'rgba(74,222,128,0.70)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'monospace' }}>Saved as {msg.itemType}</span>
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
                                                style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(251,191,36,0.60)' }}
                                            />
                                        ))}
                                    </div>
                                    <span style={{ fontSize: '0.50rem', color: 'rgba(251,191,36,0.50)', fontStyle: 'italic' }}>Bodhi is thinking…</span>
                                </motion.div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Bodhi Speaking Banner ── */}
            <AnimatePresence>
                {bodhiState === 'speaking' && (
                    <motion.div
                        key="speaking-banner"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.6rem',
                            padding: '0.55rem 0.9rem',
                            background: 'radial-gradient(ellipse at 25% 15%, rgba(255,255,255,0.14) 0%, rgba(251,191,36,0.08) 40%, transparent 100%)',
                            backdropFilter: 'blur(20px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                            border: '1px solid rgba(255,255,255,0.18)',
                            borderRadius: 14,
                            boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.22), 0 0 20px rgba(251,191,36,0.06), 0 4px 16px rgba(0,0,0,0.12)',
                            overflow: 'hidden',
                            position: 'relative',
                        }}
                    >
                        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                            {[0, 0.12, 0.24, 0.12, 0].map((d, i) => (
                                <motion.div key={i}
                                    animate={{ scaleY: [0.4, 1.4, 0.4] }}
                                    transition={{ duration: 0.9, repeat: Infinity, delay: d }}
                                    style={{ width: 3, height: 14, borderRadius: 2, background: 'rgba(251,191,36,0.70)', transformOrigin: 'center' }}
                                />
                            ))}
                        </div>
                        <span style={{ fontSize: '0.58rem', color: 'rgba(251,191,36,0.80)', fontStyle: 'italic', fontWeight: 500 }}>Bodhi is speaking… type your reply when done</span>
                        <button
                            onClick={() => { window.speechSynthesis?.cancel(); setBodhiState('idle'); }}
                            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.30)', lineHeight: 0, padding: 2, flexShrink: 0 }}
                        ><X size={12} /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Enhanced Input Bar ── */}
            <div style={{ position: 'relative' }}>
                {/* Typing glow */}
                <motion.div
                    animate={isTyping && bodhiState === 'idle' ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{ position: 'absolute', inset: -10, borderRadius: 999, background: 'radial-gradient(ellipse, rgba(251,146,60,0.16) 0%, transparent 70%)', filter: 'blur(12px)', pointerEvents: 'none', zIndex: 0 }}
                />
                {/* Bodhi speaking border pulse */}
                <motion.div
                    animate={bodhiState === 'speaking' ? { opacity: [0.3, 0.7, 0.3] } : { opacity: 0 }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                    style={{ position: 'absolute', inset: -2, borderRadius: 999, border: '1.5px solid rgba(251,191,36,0.40)', pointerEvents: 'none', zIndex: 0 }}
                />
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.3rem', background: 'radial-gradient(ellipse at 25% 30%, rgba(255,255,255,0.08) 0%, transparent 70%)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', borderRadius: 999, border: '1px solid rgba(255,255,255,0.12)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 4px 20px rgba(0,0,0,0.15)' }}>
                    {/* Mic toggle button */}
                    <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={toggleMic}
                        style={{
                            flexShrink: 0, width: 40, height: 40, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isListening
                                ? 'linear-gradient(135deg,rgba(248,113,113,0.28),rgba(239,68,68,0.18))'
                                : bodhiState === 'speaking' ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.06)',
                            border: isListening
                                ? '1.5px solid rgba(248,113,113,0.55)'
                                : bodhiState === 'speaking' ? '1px solid rgba(251,191,36,0.25)' : '1px solid rgba(255,255,255,0.10)',
                            cursor: 'pointer',
                            boxShadow: isListening ? '0 0 14px rgba(248,113,113,0.28)' : 'none',
                        }}
                    >
                        {isListening
                            ? <MicOff size={15} style={{ color: '#f87171' }} />
                            : <Mic size={15} style={{ color: bodhiState === 'speaking' ? 'rgba(251,191,36,0.55)' : 'rgba(255,255,255,0.40)' }} />
                        }
                    </motion.button>

                    {/* Text input */}
                    <div style={{ flex: 1, position: 'relative' }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                            onFocus={() => setIsTyping(true)}
                            onBlur={() => setIsTyping(false)}
                            placeholder={
                                isListening ? '🎙️ Listening...' :
                                    bodhiState === 'thinking' ? '✦ Bodhi is thinking...' :
                                        bodhiState === 'speaking' ? 'Bodhi is speaking — type your reply...' :
                                            'Type a task, challenge, idea or issue…'
                            }
                            style={{
                                width: '100%',
                                background: 'rgba(255,255,255,0.07)',
                                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                                border: `1.5px solid ${bodhiState === 'speaking' ? 'rgba(251,191,36,0.38)' :
                                    bodhiState === 'thinking' ? 'rgba(129,140,248,0.35)' :
                                        isListening ? 'rgba(248,113,113,0.45)' :
                                            isTyping ? 'rgba(251,146,60,0.42)' :
                                                'rgba(255,255,255,0.10)'
                                    }`,
                                borderRadius: 999,
                                padding: '0.70rem 3.2rem 0.70rem 1.2rem',
                                color: 'rgba(255,255,255,0.92)',
                                fontSize: '0.84rem', fontWeight: 300,
                                outline: 'none',
                                transition: 'border-color 0.3s ease',
                                boxSizing: 'border-box', fontFamily: 'inherit', letterSpacing: '0.01em',
                            }}
                        />
                        {/* Right indicator: state-aware Bodhi badge */}
                        <div style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '0.20rem', pointerEvents: 'none' }}>
                            {inputValue.trim() && bodhiState === 'idle' ? (
                                <motion.div
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                                    onClick={handleSubmit}
                                >
                                    <Send size={14} style={{ color: 'rgba(251,191,36,0.75)' }} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    animate={bodhiState !== 'idle' ? { scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] } : {}}
                                    transition={bodhiState !== 'idle' ? { duration: 1.2, repeat: Infinity } : {}}
                                >
                                    <Sparkles size={12} style={{
                                        color:
                                            bodhiState === 'speaking' ? '#fbbf24' :
                                                bodhiState === 'thinking' ? '#818cf8' :
                                                    isTyping ? 'rgba(251,191,36,0.65)' : 'rgba(255,255,255,0.18)'
                                    }} />
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Task Pills (2-column grid, vertical scroll, max 2 rows visible) ── */}
            <div style={{ position: 'relative' }}>
                {/* Bottom fade gradient for scroll hint */}
                {activeTasks.length > 4 && (
                    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 28, background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.80))', pointerEvents: 'none', zIndex: 2, borderRadius: '0 0 16px 16px' }} />
                )}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.48rem',
                    maxHeight: activeTasks.length > 4 ? 260 : 'none',
                    overflowY: activeTasks.length > 4 ? 'auto' : 'visible',
                    overflowX: 'hidden',
                    scrollBehavior: 'smooth',
                    WebkitOverflowScrolling: 'touch',
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                    paddingBottom: activeTasks.length > 4 ? 24 : 2,
                    paddingRight: 2,
                }}>
                    <style>{`
                        /* Hide scrollbar for task grid */
                        div::-webkit-scrollbar { display: none; }
                    `}</style>
                    <AnimatePresence mode="popLayout">
                        {activeTasks.map(task => {
                            const c = CM[task.colorClass] || CM.gold;
                            return (
                                <motion.div key={task.id} layout
                                    initial={{ opacity: 0, scale: 0.80, filter: 'blur(8px)' }}
                                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, scale: 0.72, boxShadow: '0 0 24px rgba(255,210,50,0.70)' }}
                                    transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.22rem',
                                        background: `radial-gradient(ellipse at 30% 18%, rgba(255,255,255,0.18) 0%, ${c.bg} 40%, transparent 100%)`,
                                        backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                                        border: '1px solid rgba(255,255,255,0.18)',
                                        boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.18)`,
                                        borderRadius: 16, padding: '0.55rem 0.65rem', position: 'relative', overflow: 'hidden', minWidth: 0,
                                    }}>
                                    {task.scheduledTime && (
                                        <div style={{ position: 'absolute', top: 5, right: 6, display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Clock size={7} style={{ color: c.text, opacity: 0.50 }} />
                                            <span style={{ fontSize: '0.42rem', color: c.text, opacity: 0.50, fontFamily: 'monospace' }}>{task.scheduledTime}</span>
                                        </div>
                                    )}
                                    {/* specular crescent */}
                                    <div aria-hidden style={{ position: 'absolute', top: '2%', left: '5%', width: '60%', height: '30%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.10) 50%, transparent 100%)', borderRadius: '50%', transform: 'rotate(-18deg)', filter: 'blur(2px)', pointerEvents: 'none' }} />
                                    <span style={{ fontSize: '1.0rem', position: 'relative', zIndex: 1 }}>{task.icon}</span>
                                    <span style={{ fontSize: '0.68rem', fontWeight: 500, lineHeight: 1.3, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', width: '100%', position: 'relative', zIndex: 1 }}>{task.text}</span>
                                    <span style={{ fontSize: '0.48rem', opacity: 0.38, color: c.text, letterSpacing: '0.06em', position: 'relative', zIndex: 1 }}>{task.category}</span>
                                    <button onClick={() => handleComplete(task)}
                                        style={{ marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 999, padding: '0.20rem 0', cursor: 'pointer', color: c.text, fontSize: '0.46rem', fontWeight: 700, fontFamily: 'inherit', letterSpacing: '0.10em', textTransform: 'uppercase', width: '100%', position: 'relative', zIndex: 1 }}>
                                        <Check size={8} /> Done
                                    </button>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                    {activeTasks.length === 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{ fontSize: '0.63rem', color: 'rgba(255,255,255,0.20)', fontStyle: 'italic', display: 'flex', alignItems: 'center', minHeight: 72, paddingLeft: '0.3rem', gridColumn: 'span 2' }}>
                            {filterDate ? `No tasks on ${filterDate}` : 'Your canvas is clear — type a task above ✨'}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
