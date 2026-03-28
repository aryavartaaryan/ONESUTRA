'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, CheckCircle2, Mic, MicOff, Clock, Sparkles } from 'lucide-react';
import { useDailyTasks } from '@/hooks/useDailyTasks';
import { useOneSutraAuth } from '@/hooks/useOneSutraAuth';
import { useBodhiChatStore } from '@/stores/bodhiChatStore';
import { useBodhiChatVoice } from '@/hooks/useBodhiChatVoice';
import { useLanguage } from '@/context/LanguageContext';

// ─── Mood data ───────────────────────────────────────────────────────────────
const MOOD_EMOJIS = [
    { emoji: '😊', label: 'Happy', mood: 'HAPPY/JOYFUL', color: '#fbbf24' },
    { emoji: '😔', label: 'Sad', mood: 'SAD/LOW', color: '#818cf8' },
    { emoji: '😤', label: 'Stressed', mood: 'STRESSED/ANXIOUS', color: '#f87171' },
    { emoji: '🤩', label: 'Excited', mood: 'EXCITED/ENERGIZED', color: '#2dd4bf' },
    { emoji: '😴', label: 'Tired', mood: 'TIRED/DRAINED', color: '#94a3b8' },
    { emoji: '🎯', label: 'Focused', mood: 'FOCUSED/PRODUCTIVE', color: '#4ade80' },
    { emoji: '😕', label: 'Confused', mood: 'CONFUSED/STUCK', color: '#fb923c' },
    { emoji: '🙏', label: 'Grateful', mood: 'GRATEFUL/PEACEFUL', color: '#c4b5fd' },
];

async function saveMoodToFirebase(uid: string, emoji: string, mood: string): Promise<void> {
    try {
        const { getFirebaseFirestore } = await import('@/lib/firebase');
        const { doc, setDoc } = await import('firebase/firestore');
        const db = await getFirebaseFirestore();
        await setDoc(doc(db, 'users', uid), { current_mood: { emoji, mood, updatedAt: Date.now() } }, { merge: true });
    } catch { /* silent */ }
}

async function loadMoodFromFirebase(uid: string): Promise<{ emoji: string; mood: string } | null> {
    try {
        const { getFirebaseFirestore } = await import('@/lib/firebase');
        const { doc, getDoc } = await import('firebase/firestore');
        const db = await getFirebaseFirestore();
        const snap = await getDoc(doc(db, 'users', uid));
        if (!snap.exists()) return null;
        const m = snap.data()?.current_mood;
        if (m && Date.now() - m.updatedAt < 6 * 60 * 60 * 1000) return { emoji: m.emoji, mood: m.mood };
        return null;
    } catch { return null; }
}

// ─── Types ───────────────────────────────────────────────────────────────────
type IntentType = 'task' | 'idea' | 'challenge' | 'issue' | 'general';

interface ChatMessage {
    id: string;
    role: 'user' | 'bodhi';
    text: string;
    intent?: IntentType;
    savedItem?: { type: IntentType; text: string };
    timestamp: number;
}

// ─── Utils ────────────────────────────────────────────────────────────────────
function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getTimeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return 'earlier';
}


// ─── Chat bubble ──────────────────────────────────────────────────────────────
const INTENT_META: Record<IntentType, { icon: string; color: string; label: string } | null> = {
    task: { icon: '✅', color: '#fbbf24', label: 'Task saved' },
    idea: { icon: '💡', color: '#2dd4bf', label: 'Idea saved' },
    challenge: { icon: '⚡', color: '#fb923c', label: 'Challenge saved' },
    issue: { icon: '🔥', color: '#f87171', label: 'Issue saved' },
    general: null,
};

function ChatBubble({ msg, isLive = false, showTimestamp = true }: { msg: ChatMessage; isLive?: boolean; showTimestamp?: boolean }) {
    const isUser = msg.role === 'user';
    const meta = msg.intent ? INTENT_META[msg.intent] : null;
    const [showFullTime, setShowFullTime] = useState(false);
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '0.65rem', padding: '0 0.25rem' }}
        >
            {!isUser && (
                <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginRight: 8, marginTop: 2,
                    background: 'radial-gradient(circle at 35% 30%, rgba(251,191,36,0.45) 0%, rgba(129,140,248,0.30) 60%, transparent 100%)',
                    border: '1px solid rgba(255,255,255,0.20)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem',
                }}>✦</div>
            )}
            <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', gap: '0.22rem', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                {/* Intent tag */}
                {!isUser && meta && (
                    <span style={{ fontSize: '0.48rem', fontWeight: 700, color: meta.color, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'monospace', marginLeft: 2 }}>
                        {meta.icon} {meta.label} detected
                    </span>
                )}
                <div style={{
                    background: isUser
                        ? 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.14) 0%, rgba(251,191,36,0.09) 50%, transparent 100%)'
                        : 'radial-gradient(ellipse at 25% 20%, rgba(255,255,255,0.11) 0%, rgba(129,140,248,0.07) 55%, transparent 100%)',
                    backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    border: isUser ? '1px solid rgba(251,191,36,0.22)' : '1px solid rgba(255,255,255,0.12)',
                    borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                    padding: '0.70rem 0.90rem',
                    boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.18), 0 4px 18px rgba(0,0,0,0.18)',
                    position: 'relative', overflow: 'hidden',
                }}>
                    <div aria-hidden style={{ position: 'absolute', top: '3%', left: '6%', width: '50%', height: '28%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.28) 0%, transparent 80%)', borderRadius: '50%', transform: 'rotate(-18deg)', filter: 'blur(2px)', pointerEvents: 'none' }} />
                    <p style={{ margin: 0, fontSize: '0.84rem', lineHeight: 1.6, color: isUser ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.88)', fontFamily: "'Outfit', sans-serif", fontWeight: 400, position: 'relative', zIndex: 1, whiteSpace: 'pre-wrap' }}>
                        {msg.text}
                        {isLive && <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.9, repeat: Infinity }} style={{ color: 'rgba(251,191,36,0.85)', marginLeft: 3 }}>▋</motion.span>}
                    </p>
                </div>
                {/* Saved badge */}
                {msg.savedItem && (
                    <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'flex', alignItems: 'center', gap: '0.22rem', marginLeft: 2 }}>
                        <CheckCircle2 size={10} style={{ color: '#4ade80' }} />
                        <span style={{ fontSize: '0.44rem', color: 'rgba(74,222,128,0.75)', letterSpacing: '0.10em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                            Saved to Planner as {msg.savedItem.type}
                        </span>
                    </motion.div>
                )}
                
                {/* Timestamp */}
                {showTimestamp && (
                    <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        onClick={() => setShowFullTime(!showFullTime)}
                        style={{ 
                            fontSize: '0.40rem', 
                            color: 'rgba(255,255,255,0.35)', 
                            letterSpacing: '0.06em',
                            fontFamily: 'monospace',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                        }}
                    >
                        <Clock size={8} />
                        {showFullTime ? formatTime(msg.timestamp) : getTimeAgo(msg.timestamp)}
                    </motion.span>
                )}
            </div>
        </motion.div>
    );
}

// ─── Bodhi Orb ────────────────────────────────────────────────────────────────
function BodhiMiniOrb({ thinking, speaking }: { thinking: boolean; speaking: boolean }) {
    const orbAnim = thinking
        ? { scale: [1, 1.02, 0.98, 1], transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' as const } }
        : speaking
            ? { scale: [1, 1.08, 0.95, 1.05, 1], transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' as const } }
            : { scale: [1, 1.04, 1], transition: { duration: 7, repeat: Infinity, ease: 'easeInOut' as const } };

    return (
        <div style={{ position: 'relative', width: 64, height: 64 }}>
            {speaking && [0, 1, 2].map(i => (
                <motion.div key={i}
                    animate={{ scale: [1, 1.8 + i * 0.3], opacity: [0.35, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.42, ease: 'easeOut' }}
                    style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid rgba(251,191,36,0.45)' }}
                />
            ))}
            {thinking && [0, 1].map(i => (
                <motion.div key={i}
                    animate={{ scale: [1, 1.5 + i * 0.2], opacity: [0.25, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.55, ease: 'easeOut' }}
                    style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(129,140,248,0.40)' }}
                />
            ))}
            <motion.div animate={orbAnim} style={{
                width: 64, height: 64, borderRadius: '50%', position: 'relative',
                background: 'radial-gradient(circle at 36% 26%, rgba(255,255,255,0.32) 0%, rgba(251,191,36,0.18) 28%, rgba(129,140,248,0.14) 55%, rgba(99,102,241,0.10) 80%, transparent 100%)',
                backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1.5px solid rgba(255,255,255,0.22)',
                boxShadow: '0 0 26px rgba(251,191,36,0.18), 0 8px 24px rgba(0,0,0,0.30), inset 0 2px 0 rgba(255,255,255,0.28)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
                <div aria-hidden style={{ position: 'absolute', top: '7%', left: '10%', width: '52%', height: '34%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.18) 45%, transparent 100%)', borderRadius: '50%', transform: 'rotate(-25deg)', filter: 'blur(2.5px)' }} />
                <div aria-hidden style={{ position: 'absolute', bottom: 0, left: '5%', right: '5%', height: '55%', background: 'radial-gradient(ellipse at center bottom, rgba(251,191,36,0.18) 0%, rgba(129,140,248,0.10) 45%, transparent 75%)', filter: 'blur(6px)' }} />
                <span style={{ fontSize: '1.3rem', position: 'relative', zIndex: 2, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }}>✦</span>
            </motion.div>
        </div>
    );
}

// ─── Voice Input Button ───────────────────────────────────────────────────────
function VoiceInputButton({ 
    isListening, 
    onStart, 
    onStop, 
    disabled 
}: { 
    isListening: boolean; 
    onStart: () => void; 
    onStop: () => void;
    disabled?: boolean;
}) {
    return (
        <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={isListening ? onStop : onStart}
            disabled={disabled}
            animate={isListening ? { 
                scale: [1, 1.1, 1],
                boxShadow: [
                    '0 0 0 0 rgba(248,113,113,0.4)',
                    '0 0 0 8px rgba(248,113,113,0)',
                    '0 0 0 0 rgba(248,113,113,0)'
                ]
            } : {}}
            transition={isListening ? { duration: 1.2, repeat: Infinity } : {}}
            style={{ 
                flexShrink: 0, 
                width: 36, 
                height: 36, 
                borderRadius: '50%', 
                background: isListening 
                    ? 'linear-gradient(135deg, rgba(248,113,113,0.35), rgba(239,68,68,0.25))' 
                    : 'rgba(255,255,255,0.06)', 
                border: isListening 
                    ? '1px solid rgba(248,113,113,0.50)' 
                    : '1px solid rgba(255,255,255,0.10)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: disabled ? 'default' : 'pointer', 
                color: isListening ? '#f87171' : 'rgba(255,255,255,0.50)', 
                transition: 'all 0.25s',
                position: 'relative',
            }}
        >
            {isListening ? <MicOff size={15} /> : <Mic size={15} />}
            {isListening && (
                <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    style={{
                        position: 'absolute',
                        inset: -4,
                        borderRadius: '50%',
                        border: '2px solid rgba(248,113,113,0.3)',
                    }}
                />
            )}
        </motion.button>
    );
}

// ─── Animated Background ────────────────────────────────────────────────────
function AnimatedBackground({ chatState }: { chatState: string }) {
    const getGradient = () => {
        switch (chatState) {
            case 'connecting':
                return 'radial-gradient(ellipse at 20% 10%, rgba(129,140,248,0.12) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(99,102,241,0.15) 0%, transparent 55%)';
            case 'thinking':
                return 'radial-gradient(ellipse at 50% 30%, rgba(129,140,248,0.15) 0%, transparent 60%), radial-gradient(ellipse at 20% 70%, rgba(174,175,255,0.10) 0%, transparent 50%)';
            case 'speaking':
                return 'radial-gradient(ellipse at 30% 20%, rgba(251,191,36,0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(253,224,71,0.10) 0%, transparent 55%)';
            case 'error':
                return 'radial-gradient(ellipse at 50% 50%, rgba(248,113,113,0.08) 0%, transparent 60%)';
            default:
                return 'radial-gradient(ellipse at 20% 10%, rgba(251,191,36,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(99,102,241,0.08) 0%, transparent 55%)';
        }
    };

    return (
        <motion.div 
            initial={false}
            animate={{ background: getGradient() }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            style={{ 
                position: 'fixed', 
                inset: 0, 
                zIndex: 0, 
            }} 
        />
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BodhiChatPage() {
    const router = useRouter();
    const { user } = useOneSutraAuth();
    const { lang } = useLanguage();
    const { tasks, addTask, removeTask } = useDailyTasks();
    const { pendingMessage, clearPendingMessage } = useBodhiChatStore();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTypingFocus, setIsTypingFocus] = useState(false);
    const [uid, setUid] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [keyboardHint, setKeyboardHint] = useState(false);
    const [selectedMoodEmoji, setSelectedMoodEmoji] = useState<string>('');
    const [selectedMoodLabel, setSelectedMoodLabel] = useState<string>('');

    const inputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const pendingSentRef = useRef(false);
    const greetedRef = useRef(false);
    const connectCalledRef = useRef(false);
    const recognitionRef = useRef<any>(null);

    const displayName = user?.name || 'Mitra';
    const pendingCount = tasks.filter(t => !t.done && t.category !== 'Idea' && t.category !== 'Challenge').length;

    // ── Bodhi Chat Voice (Gemini Live) ────────────────────────────────────────
    const { chatState, isSpeaking, isConnected, connect, disconnect, sendMessage: bodhiSend } = useBodhiChatVoice({
        userName: displayName,
        preferredLanguage: lang,
        pendingTasks: tasks.map(t => ({ id: t.id, text: t.text, done: t.done, category: t.category, startTime: t.startTime })),
        userId: uid,
        userMood: selectedMoodEmoji ? `${selectedMoodEmoji} ${selectedMoodLabel}` : '',
        onAddTask: async (task) => { await addTask(task as unknown as Parameters<typeof addTask>[0]); },
        onRemoveTask: async (taskId) => { await removeTask(taskId); },
        onMessage: (text) => {
            const bodhiMsg: ChatMessage = {
                id: `b_${Date.now()}`,
                role: 'bodhi',
                text,
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, bodhiMsg]);
        },
    });

    const isThinking = chatState === 'thinking' || chatState === 'connecting';

    // Core send function - defined before voice input handlers
    const sendMessage = useCallback((text: string) => {
        if (!text.trim() || isThinking) return;
        const userMsg: ChatMessage = { id: `u_${Date.now()}`, role: 'user', text: text.trim(), timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        bodhiSend(text.trim());
    }, [isThinking, bodhiSend]);

    // Voice input handlers
    const startVoiceInput = useCallback(() => {
        if (typeof window === 'undefined') return;
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) {
            alert('Speech recognition not supported in this browser');
            return;
        }
        const rec = new SR();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
        rec.onresult = (e: any) => {
            const transcript = Array.from(e.results as any[]).map((r: any) => r[0].transcript).join('');
            setInputValue(transcript);
            if (e.results[e.results.length - 1].isFinal) {
                setIsListening(false);
                setTimeout(() => sendMessage(transcript), 200);
            }
        };
        rec.onerror = () => setIsListening(false);
        rec.onend = () => setIsListening(false);
        rec.start();
        recognitionRef.current = rec;
        setIsListening(true);
    }, [lang, sendMessage]);

    const stopVoiceInput = useCallback(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
    }, []);

    // handleSubmit must be defined before keyboard shortcuts useEffect
    const handleSubmit = useCallback(() => {
        const t = inputValue.trim();
        if (!t || isThinking) return;
        sendMessage(t);
    }, [inputValue, isThinking, sendMessage]);

    // Get UID + load mood
    useEffect(() => {
        Promise.all([import('@/lib/firebase'), import('firebase/auth')]).then(
            ([{ getFirebaseAuth }, { onAuthStateChanged }]) => {
                getFirebaseAuth().then(auth => {
                    onAuthStateChanged(auth, async (u) => {
                        if (u) {
                            setUid(u.uid);
                            const saved = await loadMoodFromFirebase(u.uid);
                            if (saved) {
                                setSelectedMoodEmoji(saved.emoji);
                                const found = MOOD_EMOJIS.find(m => m.mood === saved.mood);
                                setSelectedMoodLabel(found?.label ?? '');
                            }
                        }
                    });
                });
            }
        ).catch(() => { });
    }, []);

    // Handle mood selection — emoji appears in chat and is sent to Bodhi
    const handleMoodSelect = useCallback((emoji: string, label: string, mood: string) => {
        if (selectedMoodEmoji === emoji) {
            // Deselect — just clear state, no new message
            setSelectedMoodEmoji('');
            setSelectedMoodLabel('');
            if (uid) saveMoodToFirebase(uid, '', '');
        } else {
            setSelectedMoodEmoji(emoji);
            setSelectedMoodLabel(label);
            if (uid) saveMoodToFirebase(uid, emoji, mood);
            // Add emoji as a user chat bubble
            const moodMsg: ChatMessage = {
                id: `mood_${Date.now()}`,
                role: 'user',
                text: emoji,
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, moodMsg]);
            // Send to Bodhi with mood context so it can respond
            bodhiSend(`${emoji} (I am feeling ${label})`);
        }
    }, [selectedMoodEmoji, uid, bodhiSend]);

    // Connect to Gemini Live on mount (once)
    useEffect(() => {
        if (connectCalledRef.current) return;
        connectCalledRef.current = true;
        connect();
    }, [connect]);

    // Send pending message from homepage once connected
    useEffect(() => {
        if (!pendingMessage || pendingSentRef.current || chatState !== 'ready') return;
        pendingSentRef.current = true;
        const msg = pendingMessage;
        clearPendingMessage();
        setTimeout(() => sendMessage(msg), 600);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingMessage, chatState]);

    // Auto-scroll
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    // Cleanup on unmount
    useEffect(() => () => { disconnect(); stopVoiceInput(); }, [disconnect, stopVoiceInput]);

    // Keyboard shortcuts - handleSubmit logic inlined to avoid dependency cycle
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                const t = inputValue.trim();
                if (t && !isThinking) {
                    const userMsg: ChatMessage = { id: `u_${Date.now()}`, role: 'user', text: t, timestamp: Date.now() };
                    setMessages(prev => [...prev, userMsg]);
                    setInputValue('');
                    bodhiSend(t);
                }
            }
            if (e.key === 'Escape') {
                if (inputValue) { setInputValue(''); inputRef.current?.focus(); }
                else if (isListening) stopVoiceInput();
            }
            if (e.ctrlKey || e.metaKey) setKeyboardHint(true);
        };
        const handleKeyUp = (e: KeyboardEvent) => { if (!e.ctrlKey && !e.metaKey) setKeyboardHint(false); };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
    }, [inputValue, isThinking, isListening, bodhiSend]);

    // State labels and constants (moved after all hook definitions)
    const stateLabel = chatState === 'connecting' ? '◎ Connecting…' : isThinking ? '◎ Thinking…' : isSpeaking ? '♪ Speaking' : isConnected ? '● Ready' : '○ Offline';
    const stateColor = chatState === 'connecting' ? '#818cf8' : isThinking ? '#818cf8' : isSpeaking ? '#fbbf24' : isConnected ? '#4ade80' : 'rgba(255,255,255,0.35)';
    const bottomNavClearance = 72;

    return (
        <>
            <div style={{ 
                position: 'fixed', 
                inset: 0, 
                zIndex: -1, 
                background: 'linear-gradient(160deg, rgba(4,2,16,0.98) 0%, rgba(8,4,24,0.97) 40%, rgba(6,3,18,0.98) 100%)' 
            }} />
            <AnimatedBackground chatState={chatState} />

            <div style={{ position: 'fixed', inset: 0, zIndex: 1, display: 'flex', flexDirection: 'column', maxWidth: 700, margin: '0 auto' }}>

                {/* Header */}
                <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                    style={{ flexShrink: 0, display: 'flex', alignItems: 'center', padding: 'max(44px, calc(env(safe-area-inset-top) + 10px)) 12px 10px', gap: '0.5rem', background: 'linear-gradient(180deg, rgba(4,2,16,0.95) 0%, rgba(6,3,18,0.65) 70%, transparent 100%)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', position: 'relative', zIndex: 10 }}>
                    <motion.button whileTap={{ scale: 0.88 }} onClick={() => { disconnect(); router.push('/'); }}
                        style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.75)' }}>
                        <ArrowLeft size={16} />
                    </motion.button>
                    <BodhiMiniOrb thinking={isThinking} speaking={isSpeaking} />
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        <span style={{ fontSize: 'clamp(0.9rem, 4vw, 1.05rem)', fontWeight: 800, fontFamily: "'Outfit', sans-serif", background: 'linear-gradient(120deg, #ffffff 0%, #fde68a 50%, #c4b5fd 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Sakha Bodhi</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.06rem' }}>
                            <span style={{ fontSize: 'clamp(0.42rem, 1.8vw, 0.50rem)', color: stateColor, fontWeight: 700, letterSpacing: '0.06em', transition: 'color 0.3s', whiteSpace: 'nowrap' }}>{stateLabel}</span>
                            <span style={{ fontSize: 'clamp(0.38rem, 1.6vw, 0.45rem)', color: 'rgba(255,255,255,0.28)', whiteSpace: 'nowrap' }}>Life Manager AI</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                        {pendingCount > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.18rem', background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.22)', borderRadius: 999, padding: '0.20rem 0.4rem' }}>
                                <CheckCircle2 size={9} style={{ color: '#fbbf24' }} />
                                <span style={{ fontSize: 'clamp(0.38rem, 1.5vw, 0.46rem)', color: 'rgba(251,191,36,0.85)', fontWeight: 700, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{pendingCount}</span>
                            </div>
                        )}
                        <motion.button whileTap={{ scale: 0.90 }} onClick={() => router.push('/vedic-planner')}
                            style={{ fontSize: '0.46rem', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', background: 'rgba(129,140,248,0.10)', border: '1px solid rgba(129,140,248,0.24)', borderRadius: 999, padding: '0.28rem 0.60rem', color: 'rgba(129,140,248,0.85)', cursor: 'pointer', fontFamily: 'inherit' }}>
                            Planner ↗
                        </motion.button>
                    </div>
                </motion.header>

                {/* Chat area */}
                <div className="bodhi-chat-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0.5rem 0.75rem 0.65rem', scrollbarWidth: 'none' }}>
                    <style>{`.bodhi-chat-scroll::-webkit-scrollbar{display:none}`}</style>

                    {messages.length === 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 240, gap: '0.8rem', textAlign: 'center', padding: '2rem' }}>
                            <motion.div animate={{ scale: [1, 1.07, 1], opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 3, repeat: Infinity }}>
                                <BodhiMiniOrb thinking={false} speaking={false} />
                            </motion.div>
                            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.32)', fontStyle: 'italic', fontFamily: "'Outfit', sans-serif", lineHeight: 1.6 }}>
                                {chatState === 'connecting' ? 'Bodhi se jud raha hoon…' : chatState === 'error' ? 'Connection mein takleef — retry karein' : 'बोधि सुनने के लिए तैयार है…'}
                            </p>
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                transition={{ delay: 1 }}
                                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                <Sparkles size={12} style={{ color: 'rgba(251,191,36,0.50)' }} />
                                <span style={{ fontSize: '0.60rem', color: 'rgba(255,255,255,0.40)', fontFamily: "'Outfit', sans-serif" }}>
                                    Try: Voice input, Ctrl+Enter to send, Esc to clear
                                </span>
                            </motion.div>
                        </motion.div>
                    )}

                    <AnimatePresence initial={false}>
                        {messages.map(msg => <ChatBubble key={msg.id} msg={msg} />)}
                    </AnimatePresence>

                    <AnimatePresence>
                        {isThinking && (
                            <motion.div key="thinking" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '0.55rem', padding: '0 0.25rem' }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginRight: 8, marginTop: 2, background: 'radial-gradient(circle at 35% 30%, rgba(251,191,36,0.35) 0%, rgba(129,140,248,0.25) 60%, transparent 100%)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>✦</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(129,140,248,0.07)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(129,140,248,0.18)', borderRadius: '4px 18px 18px 18px', padding: '0.60rem 1rem' }}>
                                    {[0, 0.18, 0.36].map((d, i) => (
                                        <motion.div key={i} animate={{ y: [0, -5, 0] }} transition={{ duration: 0.7, repeat: Infinity, delay: d }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8' }} />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div ref={chatEndRef} style={{ height: 8 }} />
                </div>

                {/* Input bar */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
                    style={{ flexShrink: 0, padding: `0.6rem 0.75rem calc(${bottomNavClearance}px + 0.75rem + env(safe-area-inset-bottom))`, background: 'linear-gradient(0deg, rgba(4,2,16,0.96) 0%, rgba(6,3,18,0.72) 70%, transparent 100%)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>

                    {/* Keyboard shortcut hint */}
                    <AnimatePresence>
                        {keyboardHint && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                style={{
                                    position: 'absolute',
                                    top: -24,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: 999,
                                    padding: '4px 12px',
                                    fontSize: '0.40rem',
                                    color: 'rgba(255,255,255,0.50)',
                                    fontFamily: 'monospace',
                                    letterSpacing: '0.05em',
                                    zIndex: 20,
                                }}
                            >
                                Ctrl+Enter to send • Esc to clear
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(28px) saturate(180%)', WebkitBackdropFilter: 'blur(28px) saturate(180%)', border: isTypingFocus ? '1px solid rgba(251,191,36,0.38)' : '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '0.38rem 0.55rem 0.38rem 1rem', boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.18), 0 4px 24px rgba(0,0,0,0.22)', transition: 'border-color 0.3s', overflow: 'visible' }}>
                        {/* Voice input button */}
                        <VoiceInputButton 
                            isListening={isListening} 
                            onStart={startVoiceInput} 
                            onStop={stopVoiceInput}
                            disabled={isThinking}
                        />
                        
                        <input ref={inputRef} type="text" value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey && !isThinking) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                            onFocus={() => setIsTypingFocus(true)}
                            onBlur={() => setIsTypingFocus(false)}
                            disabled={isThinking || isListening}
                            placeholder={
                                isListening 
                                    ? (lang === 'en' ? 'Listening... speak now' : 'सुन रहा हूँ... बोलिए') :
                                    chatState === 'connecting' ? 'Bodhi jud raha hai…' :
                                        isThinking ? 'Bodhi soch raha hai…' :
                                            isSpeaking ? 'Bodhi bol raha hai…' :
                                                (lang === 'en' ? 'Task, idea, challenge, or anything…' : 'कार्य, विचार, चुनौती या कुछ भी लिखें…')
                            }
                            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: isListening ? '#fbbf24' : 'rgba(255,255,255,0.90)', fontSize: '0.88rem', fontWeight: 300, fontFamily: "'Outfit', sans-serif", letterSpacing: '0.01em' }}
                        />
                        <motion.button whileTap={{ scale: 0.88 }} onClick={handleSubmit} disabled={!inputValue.trim() || isThinking || isListening}
                            style={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', background: inputValue.trim() && !isThinking && !isListening ? 'linear-gradient(135deg, rgba(251,191,36,0.32), rgba(217,119,6,0.22))' : 'rgba(255,255,255,0.05)', border: inputValue.trim() && !isThinking && !isListening ? '1px solid rgba(251,191,36,0.42)' : '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: inputValue.trim() && !isThinking && !isListening ? 'pointer' : 'default', color: inputValue.trim() && !isThinking && !isListening ? '#fbbf24' : 'rgba(255,255,255,0.20)', transition: 'all 0.25s' }}>
                            <Send size={15} />
                        </motion.button>
                    </div>

                    {/* Quick chips */}
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.45rem', overflowX: 'auto', paddingBottom: '0.1rem', scrollbarWidth: 'none' }}>
                        <style>{`.chips-scroll::-webkit-scrollbar{display:none}`}</style>
                        {[
                            { label: 'Add Task', icon: '✅', prompt: 'I need to ' },
                            { label: 'New Idea', icon: '💡', prompt: 'I have an idea: ' },
                            { label: 'Challenge', icon: '⚡', prompt: "I'm facing: " },
                            { label: 'Issue', icon: '🔥', prompt: "There's an issue: " },
                            { label: 'Pending', icon: '📋', prompt: 'What are my pending tasks?' },
                        ].map(chip => (
                            <motion.button key={chip.label} whileTap={{ scale: 0.92 }}
                                onClick={() => { setInputValue(chip.prompt); inputRef.current?.focus(); }}
                                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.22rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 999, padding: '0.25rem 0.65rem', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
                                <span style={{ fontSize: '0.58rem' }}>{chip.icon}</span>
                                <span style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.58)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{chip.label}</span>
                            </motion.button>
                        ))}
                    </div>

                    {/* Mood emoji picker */}
                    <div style={{ marginTop: '0.45rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.28rem' }}>
                            <span style={{ fontSize: '0.40rem', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.10em', textTransform: 'uppercase', fontFamily: 'monospace' }}>Mood</span>
                            {selectedMoodEmoji && (
                                <span style={{ fontSize: '0.40rem', color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>
                                    — Bodhi knows you're feeling {selectedMoodLabel}
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.32rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
                            {MOOD_EMOJIS.map(m => (
                                <motion.button
                                    key={m.emoji}
                                    whileTap={{ scale: 0.80 }}
                                    animate={{ scale: selectedMoodEmoji === m.emoji ? 1.14 : 1 }}
                                    transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                                    onClick={(e) => { e.stopPropagation(); handleMoodSelect(m.emoji, m.label, m.mood); }}
                                    title={m.label}
                                    style={{
                                        flexShrink: 0,
                                        width: 34,
                                        height: 34,
                                        borderRadius: '50%',
                                        background: selectedMoodEmoji === m.emoji ? `${m.color}28` : 'rgba(255,255,255,0.05)',
                                        border: selectedMoodEmoji === m.emoji ? `1.5px solid ${m.color}80` : '1px solid rgba(255,255,255,0.08)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        fontSize: '1rem',
                                        transition: 'background 0.2s, border 0.2s',
                                        boxShadow: selectedMoodEmoji === m.emoji ? `0 0 10px ${m.color}55` : 'none',
                                    }}
                                >
                                    {m.emoji}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    <p style={{ textAlign: 'center', margin: '0.32rem 0 0', fontSize: '0.43rem', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>
                        ✦ Bodhi · Gemini Live Audio · Text + Voice ✦
                    </p>
                </motion.div>
            </div>
        </>
    );
}
