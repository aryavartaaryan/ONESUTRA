'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Search, MoreVertical, Phone, Video,
    Paperclip, Mic, Send, Smile, Moon, Zap, Leaf, BookOpen,
    Compass, ChevronRight, Check, CheckCheck, Volume2, Sparkles,
    MessageCircle, Users, Bot, Clock, Star,
} from 'lucide-react';
import Link from 'next/link';

// ── Time of day ──────────────────────────────────────────────────────────────
function getTOD() {
    const h = new Date().getHours();
    if (h >= 5 && h < 11) return { period: 'morning', bg: 'rgba(40,20,8,0.97)', accent: '#E8A030', glow: '200,130,30' };
    if (h >= 11 && h < 17) return { period: 'noon', bg: 'rgba(10,20,12,0.97)', accent: '#60C860', glow: '80,180,80' };
    if (h >= 17 && h < 21) return { period: 'evening', bg: 'rgba(25,10,40,0.97)', accent: '#A870E0', glow: '160,100,220' };
    return { period: 'night', bg: 'rgba(4,8,20,0.97)', accent: '#4A8EE8', glow: '60,120,220' };
}

// ── Dummy Data ────────────────────────────────────────────────────────────────
const CONTACTS = [
    {
        id: 'vaidya',
        name: 'Digital Vaidya',
        role: 'AI Agent · Ayurvedic Guide',
        avatar: '🤖',
        aura: '#E8A030',
        auraGlow: 'rgba(232,160,48,0.35)',
        status: 'active',
        statusLabel: 'Available',
        isAI: true,
        sentimentIcon: <Sparkles size={10} />,
        lastMsg: 'Your morning Pitta score is optimal. I recommend…',
        lastTime: '10:42 PM',
        unread: 3,
        online: true,
    },
    {
        id: 'priya',
        name: 'Dr. Priya Sharma',
        role: 'Integrative Medicine',
        avatar: '🌸',
        aura: '#60C860',
        auraGlow: 'rgba(80,180,80,0.30)',
        status: 'active',
        statusLabel: 'In deep work',
        isAI: false,
        sentimentIcon: <Leaf size={10} />,
        lastMsg: 'The Ayurvedic protocol I sent yesterday — start with the copper vessel water at 6am',
        lastTime: '9:28 PM',
        unread: 0,
        online: true,
    },
    {
        id: 'arjun',
        name: 'Arjun Mehta',
        role: 'Founder · Deep Work Partner',
        avatar: '⚡',
        aura: '#4A8EE8',
        auraGlow: 'rgba(60,120,220,0.28)',
        status: 'deepwork',
        statusLabel: 'Deep Work 🚫',
        isAI: false,
        sentimentIcon: <Zap size={10} />,
        lastMsg: 'Shall we continue the deep work session at 11? Silent protocol on',
        lastTime: '8:55 PM',
        unread: 1,
        online: false,
        silentSend: true,
    },
    {
        id: 'sacred',
        name: 'Sacred Circle',
        role: 'Group · 8 Members',
        avatar: '🕉',
        aura: '#C88040',
        auraGlow: 'rgba(200,128,64,0.28)',
        status: 'group',
        statusLabel: '8 members',
        isAI: false,
        sentimentIcon: <Star size={10} />,
        lastMsg: 'Rishikesh retreat dates confirmed — March 21 to 28 🏔',
        lastTime: '7:14 PM',
        unread: 5,
        online: false,
    },
    {
        id: 'kavya',
        name: 'Kavya Nair',
        role: 'Mindful Artist',
        avatar: '🌙',
        aura: '#8855BB',
        auraGlow: 'rgba(136,85,187,0.28)',
        status: 'dhyana',
        statusLabel: 'Dhyana Mode 🧘',
        isAI: false,
        sentimentIcon: <Moon size={10} />,
        lastMsg: 'Namaste 🙏 Will respond after my evening practice',
        lastTime: '6:02 PM',
        unread: 0,
        online: false,
    },
    {
        id: 'rishi',
        name: 'Rishi AI Coach',
        role: 'AI Agent · Life Architect',
        avatar: '🔮',
        aura: '#E860A0',
        auraGlow: 'rgba(220,80,150,0.28)',
        status: 'active',
        statusLabel: 'Available',
        isAI: true,
        sentimentIcon: <BookOpen size={10} />,
        lastMsg: 'Your weekly Sankalpa report is ready. 73% completion — excellent!',
        lastTime: '5:30 PM',
        unread: 0,
        online: true,
    },
];

// ── Full conversation for each contact ───────────────────────────────────────
type Msg = {
    id: string; from: 'me' | 'them'; text?: string;
    time: string; type: 'text' | 'voice' | 'ai-insight' | 'reel';
    read?: boolean; silent?: boolean;
    voiceDuration?: string;
    voiceSentiment?: string;
    voiceTone?: 'calm' | 'energetic' | 'meditative';
    aiGlow?: boolean;
    reelTitle?: string;
    reelTag?: string;
};

const CONVERSATIONS: Record<string, Msg[]> = {
    vaidya: [
        { id: '1', from: 'them', type: 'ai-insight', aiGlow: true, text: 'ॐ Good evening, Traveller. I have completed your daily Dosha analysis.', time: '9:58 PM' },
        { id: '2', from: 'them', type: 'ai-insight', aiGlow: true, text: 'Your Pitta is elevated — typical for this hour. I recommend: Coconut water, avoid screens 1hr before sleep, and 10 min of Chandrakala breathing.', time: '9:58 PM' },
        { id: '3', from: 'me', type: 'text', text: 'Thank you. Can you send me the Chandrakala breathing guide?', time: '10:01 PM', read: true },
        { id: '4', from: 'them', type: 'reel', aiGlow: true, reelTitle: 'Chandrakala Pranayama', reelTag: '8 Min · Night Practice', text: 'Here is your personalized session. I have calibrated it to your current Pitta levels.', time: '10:02 PM' },
        { id: '5', from: 'me', type: 'text', text: 'That is exactly what I needed. You always know.', time: '10:04 PM', read: true },
        { id: '6', from: 'them', type: 'ai-insight', aiGlow: true, text: 'Your morning Pitta score is optimal. I recommend starting your day with Rāga Bhairav. I have queued it in your Leela player.', time: '10:42 PM' },
    ],
    priya: [
        { id: '1', from: 'them', type: 'text', text: 'Namaste! The lab reports came back — your Vitamin D and Magnesium look great now.', time: '8:40 PM' },
        { id: '2', from: 'me', type: 'text', text: 'That is wonderful news. The Ayurvedic protocol really worked!', time: '8:42 PM', read: true },
        { id: '3', from: 'them', type: 'voice', voiceDuration: '0:47', voiceSentiment: 'Warm, encouraging tone — patient update', voiceTone: 'calm', time: '8:55 PM' },
        { id: '4', from: 'me', type: 'text', text: 'I will follow that. Thank you so much Dr. Priya!', time: '9:00 PM', read: true },
        { id: '5', from: 'them', type: 'text', text: 'The Ayurvedic protocol I sent yesterday — start with the copper vessel water at 6am. It makes a significant difference within the first 10 days.', time: '9:28 PM' },
    ],
    arjun: [
        { id: '1', from: 'them', type: 'text', text: 'Hey! Locked in all morning. 4 hours of pure flow state. New record.', time: '2:14 PM' },
        { id: '2', from: 'me', type: 'text', text: 'That is epic. What was the focus stack?', time: '2:22 PM', read: true },
        { id: '3', from: 'them', type: 'voice', voiceDuration: '1:12', voiceSentiment: 'High energy, excited — sharing work insights', voiceTone: 'energetic', time: '2:30 PM' },
        { id: '4', from: 'me', type: 'text', silent: true, text: 'I will try that tomorrow morning with Leela playing in the background. Thanks for the blueprint!', time: '3:01 PM', read: false },
        { id: '5', from: 'them', type: 'text', text: 'Shall we continue the deep work session at 11? Silent protocol on', time: '8:55 PM' },
    ],
    sacred: [
        { id: '1', from: 'them', type: 'text', text: '🌙 Shubh Sandhya everyone! Excited to share — we crossed 500 members in the retreat waitlist.', time: '5:00 PM' },
        { id: '2', from: 'them', type: 'reel', reelTitle: 'Sacred Circle Intro', reelTag: 'Welcome Reel', text: 'For the new members joining today — here is our founding vision 🙏', time: '5:30 PM' },
        { id: '3', from: 'me', type: 'text', text: 'This is beautiful. So grateful to be part of this community.', time: '6:15 PM', read: true },
        { id: '4', from: 'them', type: 'text', text: 'Rishikesh retreat dates confirmed — March 21 to 28 🏔', time: '7:14 PM' },
    ],
    kavya: [
        { id: '1', from: 'me', type: 'text', text: 'Kavya, I saw your latest painting — it is transcendent.', time: '5:45 PM', read: true },
        { id: '2', from: 'them', type: 'voice', voiceDuration: '0:28', voiceSentiment: 'Calm, grateful, meditative', voiceTone: 'meditative', time: '5:58 PM' },
        { id: '3', from: 'them', type: 'text', text: 'Namaste 🙏 Will respond after my evening practice', time: '6:02 PM' },
    ],
    rishi: [
        { id: '1', from: 'them', type: 'ai-insight', aiGlow: true, text: 'Week 3 review complete. You maintained your morning Sadhana 6 out of 7 days. That is top 5% globally on the ReZo network.', time: '5:15 PM' },
        { id: '2', from: 'me', type: 'text', text: 'I missed Tuesday because of travel. Will do better.', time: '5:20 PM', read: true },
        { id: '3', from: 'them', type: 'ai-insight', aiGlow: true, text: 'Travel days count too. Next week, I will pre-load a 5-min travel version of your Sadhana. Adaptability is part of mastery.', time: '5:22 PM' },
        { id: '4', from: 'them', type: 'ai-insight', aiGlow: true, text: 'Your weekly Sankalpa report is ready. 73% completion — excellent!', time: '5:30 PM' },
    ],
};

// ── Voice Waveform Component ──────────────────────────────────────────────────
function VoiceWaveform({ tone, isPlaying }: { tone: 'calm' | 'energetic' | 'meditative'; isPlaying: boolean }) {
    const bars = 28;
    const colors = {
        calm: ['#60C860', '#4A8EE8', '#60C860'],
        energetic: ['#E8A030', '#E86030', '#E8A030'],
        meditative: ['#A870E0', '#6040A0', '#A870E0'],
    };
    const [c1, c2] = colors[tone];
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 28 }}>
            {Array.from({ length: bars }).map((_, i) => {
                const h = 4 + Math.sin(i * 0.6) * 10 + Math.cos(i * 1.1) * 6;
                return (
                    <motion.div
                        key={i}
                        animate={isPlaying ? { scaleY: [1, 1.4 + Math.random() * 0.8, 1] } : { scaleY: 1 }}
                        transition={{ duration: 0.5 + i * 0.03, repeat: isPlaying ? Infinity : 0, ease: 'easeInOut' }}
                        style={{
                            width: 3, height: Math.max(4, h), borderRadius: 999,
                            background: `linear-gradient(180deg, ${c1}, ${c2})`,
                            opacity: 0.75 + Math.sin(i * 0.4) * 0.25,
                            transformOrigin: 'center',
                        }}
                    />
                );
            })}
        </div>
    );
}

// ── Reel Card In Chat ─────────────────────────────────────────────────────────
function ReelCard({ title, tag, accent }: { title: string; tag: string; accent: string }) {
    return (
        <div style={{
            background: `rgba(0,0,0,0.35)`,
            border: `1px solid ${accent}33`,
            borderRadius: 12, overflow: 'hidden',
            width: 200, marginTop: 6,
        }}>
            <div style={{
                height: 90, width: '100%',
                background: `linear-gradient(135deg, rgba(0,0,0,0.6), ${accent}22)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem',
            }}>🎵</div>
            <div style={{ padding: '0.5rem 0.7rem' }}>
                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontFamily: "'Playfair Display', serif" }}>{title}</p>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.58rem', color: accent, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace' }}>{tag}</p>
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function OneSutraPage() {
    const tod = getTOD();
    const [view, setView] = useState<'list' | 'chat'>('list');
    const [activeContact, setActiveContact] = useState<typeof CONTACTS[0] | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [input, setInput] = useState('');
    const [isSilent, setIsSilent] = useState(false);
    const [fabOpen, setFabOpen] = useState(false);
    const [playingVoice, setPlayingVoice] = useState<string | null>(null);
    const [messages, setMessages] = useState<Msg[]>([]);
    const [isTypingAI, setIsTypingAI] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeContact) setMessages(CONVERSATIONS[activeContact.id] ?? []);
    }, [activeContact]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTypingAI]);

    const openChat = (c: typeof CONTACTS[0]) => {
        setActiveContact(c);
        setView('chat');
    };

    const sendMessage = () => {
        if (!input.trim()) return;
        const newMsg: Msg = {
            id: Date.now().toString(), from: 'me', type: 'text',
            text: input.trim(), time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            read: false, silent: isSilent,
        };
        setMessages(p => [...p, newMsg]);
        setInput('');

        // Simulate AI reply
        if (activeContact?.isAI) {
            setIsTypingAI(true);
            setTimeout(() => {
                setIsTypingAI(false);
                setMessages(p => [...p, {
                    id: Date.now().toString() + '_ai', from: 'them', type: 'ai-insight', aiGlow: true,
                    text: 'I understand. Let me analyse this and provide a thoughtful response aligned with your current energetic state and Vedic constitution.',
                    time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                }]);
            }, 2200);
        }
    };

    const filtered = CONTACTS.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastMsg.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const CHIPS = activeContact?.isAI
        ? ['Send a Mantra 🕉', 'Analyse my Dosha', 'Summarise this']
        : ['Namaste 🙏', 'Schedule a call', 'Send a blessing'];

    // ── Background gradient (TOD-adaptive) ────────────────────────────────────
    const bgStyle: React.CSSProperties = {
        position: 'fixed', inset: 0, zIndex: -1,
        background: view === 'chat'
            ? `radial-gradient(ellipse at 30% 20%, rgba(${tod.glow},0.12) 0%, transparent 60%), ${tod.bg}`
            : tod.bg,
    };

    return (
        <div style={{ minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif", color: 'white', overflowX: 'hidden' }}>
            <div style={bgStyle} />

            {/* ── Subtle mandala watermark ── */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none',
                backgroundImage: `radial-gradient(circle at 50% 50%, rgba(${tod.glow},0.04) 0%, transparent 70%)`,
            }} />

            <AnimatePresence mode="wait">

                {/* ════════════════════════════════════════════════════════════════════
            CHAT LIST — "The Sutra Stream"
        ════════════════════════════════════════════════════════════════════ */}
                {view === 'list' && (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -60 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', maxWidth: 680, margin: '0 auto' }}
                    >
                        {/* ── Glass Header ── */}
                        <div style={{
                            position: 'sticky', top: 0, zIndex: 100,
                            background: 'rgba(6,4,18,0.72)', backdropFilter: 'blur(32px)',
                            WebkitBackdropFilter: 'blur(32px)',
                            borderBottom: `1px solid rgba(${tod.glow},0.12)`,
                            padding: '0.85rem 1.1rem 0.6rem',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Link href="/" style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 0 }}>
                                        <ArrowLeft size={18} strokeWidth={1.8} />
                                    </Link>
                                    {/* Om glyph with glow */}
                                    <span style={{
                                        fontSize: '1.4rem', lineHeight: 1,
                                        filter: `drop-shadow(0 0 12px rgba(${tod.glow},0.65))`,
                                        color: tod.accent,
                                    }}>ॐ</span>
                                    <div>
                                        <h1 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, fontFamily: "'Playfair Display', serif", color: 'white', letterSpacing: '-0.01em' }}>
                                            OneSUTRA
                                        </h1>
                                        <p style={{ margin: 0, fontSize: '0.58rem', color: `rgba(${tod.glow},0.75)`, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                                            Conscious Messenger
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <button style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.55)' }}>
                                        <Compass size={15} />
                                    </button>
                                    <button style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.55)' }}>
                                        <MoreVertical size={15} />
                                    </button>
                                </div>
                            </div>

                            {/* Soft indent search bar */}
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <Search size={14} style={{ position: 'absolute', left: '0.85rem', color: 'rgba(255,255,255,0.28)', pointerEvents: 'none' }} />
                                <input
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search conversations, people, mantras…"
                                    style={{
                                        width: '100%', padding: '0.6rem 1rem 0.6rem 2.4rem',
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: 20, color: 'rgba(255,255,255,0.8)',
                                        fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit',
                                        boxSizing: 'border-box',
                                        transition: 'border-color 0.2s',
                                    }}
                                />
                            </div>

                            {/* Category tabs */}
                            <div style={{ display: 'flex', gap: 6, marginTop: '0.6rem', overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
                                {['All', 'AI Agents', 'People', 'Groups', 'Dhyana'].map((tab, i) => (
                                    <button key={tab} style={{
                                        flexShrink: 0, padding: '0.28rem 0.75rem',
                                        background: i === 0 ? `rgba(${tod.glow},0.18)` : 'rgba(255,255,255,0.05)',
                                        border: i === 0 ? `1px solid rgba(${tod.glow},0.35)` : '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: 999, color: i === 0 ? tod.accent : 'rgba(255,255,255,0.42)',
                                        fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.04em',
                                        fontFamily: 'inherit',
                                    }}>{tab}</button>
                                ))}
                            </div>
                        </div>

                        {/* ── Contact List ── */}
                        <div style={{ flex: 1, padding: '0.4rem 0 6rem' }}>
                            {filtered.map((c, idx) => (
                                <motion.div
                                    key={c.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.06, duration: 0.4, ease: 'easeOut' }}
                                    onClick={() => openChat(c)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 14,
                                        padding: '0.9rem 1.2rem',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                                        transition: 'background 0.18s',
                                    }}
                                    whileHover={{ background: 'rgba(255,255,255,0.04)' }}
                                    whileTap={{ background: 'rgba(255,255,255,0.07)' }}
                                >
                                    {/* Avatar with aura */}
                                    <div style={{ position: 'relative', flexShrink: 0 }}>
                                        <div style={{
                                            width: 50, height: 50, borderRadius: '50%',
                                            background: `radial-gradient(circle, ${c.auraGlow} 0%, rgba(0,0,0,0.4) 100%)`,
                                            border: `2px solid ${c.aura}`,
                                            boxShadow: `0 0 18px ${c.auraGlow}, 0 0 6px ${c.auraGlow}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.4rem',
                                        }}>{c.avatar}</div>
                                        {c.online && (
                                            <div style={{
                                                position: 'absolute', bottom: 2, right: 2,
                                                width: 10, height: 10, borderRadius: '50%',
                                                background: '#44DD44',
                                                border: '2px solid rgba(6,4,18,1)',
                                                boxShadow: '0 0 6px rgba(60,220,60,0.60)',
                                            }} />
                                        )}
                                        {c.status === 'dhyana' && (
                                            <div style={{
                                                position: 'absolute', bottom: 1, right: 1,
                                                fontSize: '0.7rem', lineHeight: 1,
                                            }}>🧘</div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{ fontSize: '0.92rem', fontWeight: 600, fontFamily: "'Playfair Display', serif", color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.01em' }}>
                                                    {c.name}
                                                </span>
                                                {c.isAI && (
                                                    <span style={{ fontSize: '0.52rem', padding: '0.1rem 0.4rem', background: `rgba(${tod.glow},0.18)`, border: `1px solid rgba(${tod.glow},0.30)`, borderRadius: 999, color: tod.accent, letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'monospace' }}>AI</span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                                                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.28)', fontFamily: 'monospace' }}>{c.lastTime}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, flex: 1 }}>
                                                {/* Sentiment icon */}
                                                <span style={{ color: c.aura, flexShrink: 0 }}>{c.sentimentIcon}</span>
                                                <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.38)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {c.lastMsg}
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, marginLeft: 8 }}>
                                                {c.silentSend && <span title="Silent send" style={{ fontSize: '0.65rem' }}>⏳</span>}
                                                {c.unread > 0 && (
                                                    <span style={{
                                                        minWidth: 20, height: 20, borderRadius: 999, padding: '0 5px',
                                                        background: c.isAI ? tod.accent : '#44DD44',
                                                        color: 'black', fontSize: '0.65rem', fontWeight: 800,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>{c.unread}</span>
                                                )}
                                            </div>
                                        </div>
                                        <p style={{ margin: '0.18rem 0 0', fontSize: '0.62rem', color: c.aura, opacity: 0.65, fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                                            {c.statusLabel}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* ── FAB — Bindu Sphere ── */}
                        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.2rem', zIndex: 200 }}>
                            <AnimatePresence>
                                {fabOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 20, scale: 0.8 }}
                                        style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end', marginBottom: 12 }}
                                    >
                                        {[
                                            { icon: <MessageCircle size={16} />, label: 'New Chat' },
                                            { icon: <Bot size={16} />, label: 'Consult AI Vaidya' },
                                            { icon: <Users size={16} />, label: 'New Group' },
                                        ].map(({ icon, label }) => (
                                            <button key={label} onClick={() => setFabOpen(false)} style={{
                                                display: 'flex', alignItems: 'center', gap: 8,
                                                padding: '0.55rem 1rem', borderRadius: 999,
                                                background: 'rgba(10,6,28,0.92)', backdropFilter: 'blur(20px)',
                                                border: `1px solid rgba(${tod.glow},0.30)`,
                                                color: tod.accent, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                                                fontFamily: 'inherit', whiteSpace: 'nowrap',
                                                boxShadow: `0 4px 24px rgba(0,0,0,0.5)`,
                                            }}>
                                                {icon} {label}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <motion.button
                                onClick={() => setFabOpen(f => !f)}
                                animate={{ rotate: fabOpen ? 45 : 0, scale: [1, 1.06, 1] }}
                                transition={{ scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }}
                                style={{
                                    width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
                                    background: `radial-gradient(circle at 35% 35%, rgba(${tod.glow},0.9), rgba(${tod.glow},0.5))`,
                                    boxShadow: `0 0 28px rgba(${tod.glow},0.55), 0 4px 20px rgba(0,0,0,0.4)`,
                                    color: 'white', fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                                aria-label="New conversation"
                            >
                                <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>✦</span>
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* ════════════════════════════════════════════════════════════════════
            CHAT VIEW — "The Sanctum"
        ════════════════════════════════════════════════════════════════════ */}
                {view === 'chat' && activeContact && (
                    <motion.div
                        key="chat"
                        initial={{ opacity: 0, x: 60 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 60 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', maxWidth: 680, margin: '0 auto' }}
                    >
                        {/* ── Chat Header ── */}
                        <div style={{
                            position: 'sticky', top: 0, zIndex: 100,
                            background: 'rgba(6,4,18,0.78)', backdropFilter: 'blur(32px)',
                            WebkitBackdropFilter: 'blur(32px)',
                            borderBottom: `1px solid rgba(${tod.glow},0.12)`,
                            padding: '0.75rem 1rem',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', lineHeight: 0, padding: '4px' }}>
                                    <ArrowLeft size={20} strokeWidth={2} />
                                </button>

                                <div style={{ position: 'relative' }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: '50%',
                                        border: `2px solid ${activeContact.aura}`,
                                        boxShadow: `0 0 14px ${activeContact.auraGlow}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.2rem', background: `radial-gradient(circle, ${activeContact.auraGlow}, rgba(0,0,0,0.4))`,
                                    }}>{activeContact.avatar}</div>
                                    {activeContact.online && <div style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', background: '#44DD44', border: '2px solid rgba(6,4,18,1)', boxShadow: '0 0 5px rgba(60,220,60,0.6)' }} />}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, fontFamily: "'Playfair Display', serif", color: 'white', letterSpacing: '-0.01em' }}>
                                            {activeContact.name}
                                        </h2>
                                        {activeContact.isAI && (
                                            <span style={{ fontSize: '0.52rem', padding: '0.1rem 0.38rem', background: `rgba(${tod.glow},0.18)`, border: `1px solid rgba(${tod.glow},0.30)`, borderRadius: 999, color: tod.accent, letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'monospace' }}>AI</span>
                                        )}
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.67rem', color: activeContact.online ? '#44DD44' : 'rgba(255,255,255,0.35)', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                                        {activeContact.statusLabel} · {activeContact.role}
                                    </p>
                                </div>

                                {/* Glass pill call buttons */}
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: 'rgba(255,255,255,0.65)', fontSize: '0.7rem', fontFamily: 'inherit' }}>
                                        <Phone size={13} /> <span style={{ display: 'none', ['@media (min-width: 400px)' as never]: { display: 'inline' } }}>Call</span>
                                    </button>
                                    <button style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: 'rgba(255,255,255,0.65)', fontSize: '0.7rem', fontFamily: 'inherit' }}>
                                        <Video size={13} /> <span style={{ display: 'none', ['@media (min-width: 400px)' as never]: { display: 'inline' } }}>Video</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── Messages ── */}
                        <div style={{ flex: 1, padding: '1rem 1rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', overflowY: 'auto', minHeight: 0 }}>
                            {messages.map((msg, i) => {
                                const isMe = msg.from === 'me';
                                const contact = activeContact;
                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ delay: i * 0.04, duration: 0.3, ease: 'easeOut' }}
                                        style={{
                                            display: 'flex',
                                            flexDirection: isMe ? 'row-reverse' : 'row',
                                            alignItems: 'flex-end', gap: 8,
                                        }}
                                    >
                                        {/* Avatar (their side only) */}
                                        {!isMe && (
                                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: `radial-gradient(circle, ${contact.auraGlow}, rgba(0,0,0,0.4))`, border: `1.5px solid ${contact.aura}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>
                                                {contact.avatar}
                                            </div>
                                        )}

                                        <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: 4 }}>

                                            {/* Voice message */}
                                            {msg.type === 'voice' && (
                                                <div style={{
                                                    background: isMe
                                                        ? `linear-gradient(135deg, rgba(${tod.glow},0.25), rgba(${tod.glow},0.12))`
                                                        : 'rgba(255,255,255,0.07)',
                                                    backdropFilter: 'blur(16px)',
                                                    border: `1px solid ${isMe ? `rgba(${tod.glow},0.30)` : 'rgba(255,255,255,0.10)'}`,
                                                    borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                    padding: '0.7rem 0.85rem',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <button
                                                            onClick={() => setPlayingVoice(playingVoice === msg.id ? null : msg.id)}
                                                            style={{ width: 32, height: 32, borderRadius: '50%', background: tod.accent, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                                        >
                                                            {playingVoice === msg.id ? <span>⏸</span> : <span>▶</span>}
                                                        </button>
                                                        <VoiceWaveform tone={msg.voiceTone ?? 'calm'} isPlaying={playingVoice === msg.id} />
                                                        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace', flexShrink: 0 }}>{msg.voiceDuration}</span>
                                                    </div>
                                                    {msg.voiceSentiment && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: '0.45rem' }}>
                                                            <Sparkles size={9} style={{ color: tod.accent, flexShrink: 0 }} />
                                                            <p style={{ margin: 0, fontSize: '0.62rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.38)', letterSpacing: '0.02em' }}>AI: {msg.voiceSentiment}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Reel card */}
                                            {msg.type === 'reel' && msg.reelTitle && (
                                                <div>
                                                    {msg.text && (
                                                        <div style={{
                                                            background: msg.aiGlow ? `rgba(${tod.glow},0.10)` : 'rgba(255,255,255,0.07)',
                                                            border: `1px solid ${msg.aiGlow ? `rgba(${tod.glow},0.22)` : 'rgba(255,255,255,0.10)'}`,
                                                            borderRadius: '18px 18px 18px 4px', padding: '0.65rem 0.85rem',
                                                            marginBottom: 4,
                                                        }}>
                                                            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.55, color: 'rgba(255,255,255,0.88)' }}>{msg.text}</p>
                                                        </div>
                                                    )}
                                                    <ReelCard title={msg.reelTitle} tag={msg.reelTag ?? ''} accent={tod.accent} />
                                                </div>
                                            )}

                                            {/* Text bubble */}
                                            {(msg.type === 'text' || msg.type === 'ai-insight') && msg.text && (
                                                <div style={{
                                                    background: isMe
                                                        ? `linear-gradient(135deg, rgba(${tod.glow},0.30) 0%, rgba(${tod.glow},0.12) 100%)`
                                                        : msg.aiGlow
                                                            ? 'rgba(255,255,255,0.06)'
                                                            : 'rgba(255,255,255,0.07)',
                                                    backdropFilter: 'blur(16px)',
                                                    WebkitBackdropFilter: 'blur(16px)',
                                                    border: isMe
                                                        ? `1px solid rgba(${tod.glow},0.32)`
                                                        : msg.aiGlow
                                                            ? `1px solid rgba(${tod.glow},0.25)`
                                                            : '1px solid rgba(255,255,255,0.09)',
                                                    borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                    padding: '0.65rem 0.9rem',
                                                    boxShadow: msg.aiGlow && !isMe ? `0 0 20px rgba(${tod.glow},0.12)` : undefined,
                                                }}>
                                                    {/* AI glow indicator */}
                                                    {msg.aiGlow && !isMe && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: '0.3rem' }}>
                                                            <Sparkles size={9} style={{ color: tod.accent }} />
                                                            <span style={{ fontSize: '0.55rem', color: tod.accent, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700 }}>AI Agent</span>
                                                        </div>
                                                    )}
                                                    <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.58, color: 'rgba(255,255,255,0.90)' }}>
                                                        {msg.text}
                                                    </p>
                                                    {/* Silent send indicator */}
                                                    {msg.silent && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: '0.25rem' }}>
                                                            <Moon size={9} style={{ color: 'rgba(255,255,255,0.28)' }} />
                                                            <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace' }}>Silent send</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Time + read receipt */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <span style={{ fontSize: '0.60rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>{msg.time}</span>
                                                {isMe && (
                                                    <span style={{ color: msg.read ? tod.accent : 'rgba(255,255,255,0.28)', lineHeight: 0 }}>
                                                        {msg.read ? <CheckCheck size={12} /> : <Check size={12} />}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}

                            {/* AI typing indicator */}
                            {isTypingAI && (
                                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: `radial-gradient(circle, ${activeContact.auraGlow}, rgba(0,0,0,0.4))`, border: `1.5px solid ${activeContact.aura}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>
                                        {activeContact.avatar}
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '18px 18px 18px 4px', padding: '0.75rem 1rem', display: 'flex', gap: 5, alignItems: 'center' }}>
                                        {[0, 1, 2].map(i => (
                                            <motion.div key={i} animate={{ y: [0, -5, 0] }} transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }} style={{ width: 7, height: 7, borderRadius: '50%', background: tod.accent, opacity: 0.7 }} />
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            <div ref={bottomRef} />
                        </div>

                        {/* ── Action Chips + Input ── */}
                        <div style={{
                            position: 'sticky', bottom: 0,
                            background: 'rgba(6,4,18,0.85)', backdropFilter: 'blur(28px)',
                            WebkitBackdropFilter: 'blur(28px)',
                            borderTop: `1px solid rgba(${tod.glow},0.10)`,
                            padding: '0.6rem 0.9rem 0.9rem',
                        }}>
                            {/* Action chips */}
                            <div style={{ display: 'flex', gap: 7, marginBottom: '0.65rem', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
                                {CHIPS.map(chip => (
                                    <motion.button
                                        key={chip}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => setInput(chip.replace(/[🕉🙏]/g, '').trim())}
                                        style={{
                                            flexShrink: 0, padding: '0.32rem 0.75rem',
                                            background: 'rgba(255,255,255,0.06)',
                                            border: `1px solid rgba(${tod.glow},0.22)`,
                                            borderRadius: 999, color: 'rgba(255,255,255,0.62)',
                                            fontSize: '0.73rem', cursor: 'pointer', fontFamily: 'inherit',
                                            whiteSpace: 'nowrap', letterSpacing: '0.01em',
                                        }}
                                    >{chip}</motion.button>
                                ))}
                            </div>

                            {/* Input row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                {/* Silent send toggle */}
                                <button
                                    onClick={() => setIsSilent(s => !s)}
                                    title={isSilent ? 'Silent mode ON — won&apos;t disturb' : 'Normal send'}
                                    style={{
                                        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                                        background: isSilent ? `rgba(${tod.glow},0.18)` : 'rgba(255,255,255,0.06)',
                                        border: `1px solid ${isSilent ? `rgba(${tod.glow},0.40)` : 'rgba(255,255,255,0.10)'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: isSilent ? tod.accent : 'rgba(255,255,255,0.38)',
                                    }}
                                >
                                    <Moon size={14} />
                                </button>

                                {/* Attachment */}
                                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.40)', lineHeight: 0, padding: 4, flexShrink: 0 }}>
                                    <Paperclip size={18} strokeWidth={1.8} />
                                </button>

                                {/* Text input */}
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <input
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                        placeholder={isSilent ? '🌙 Silent message — will not notify…' : 'Message…'}
                                        style={{
                                            width: '100%', padding: '0.7rem 1rem',
                                            background: 'rgba(255,255,255,0.07)',
                                            border: `1px solid rgba(${tod.glow},0.18)`,
                                            borderRadius: 999, color: 'rgba(255,255,255,0.88)',
                                            fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit',
                                            boxSizing: 'border-box',
                                            transition: 'border-color 0.2s',
                                        }}
                                    />
                                </div>

                                {/* Emoji */}
                                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.38)', lineHeight: 0, padding: 4, flexShrink: 0 }}>
                                    <Smile size={18} strokeWidth={1.8} />
                                </button>

                                {/* Send OR Mic */}
                                {input.trim() ? (
                                    <motion.button
                                        onClick={sendMessage}
                                        whileTap={{ scale: 0.88 }}
                                        whileHover={{ scale: 1.07 }}
                                        style={{
                                            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                                            background: `radial-gradient(circle at 35% 35%, rgba(${tod.glow},0.95), rgba(${tod.glow},0.55))`,
                                            border: 'none', cursor: 'pointer', lineHeight: 0,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: `0 0 18px rgba(${tod.glow},0.45)`,
                                            color: 'white',
                                        }}
                                    >
                                        <Send size={17} strokeWidth={2} />
                                    </motion.button>
                                ) : (
                                    <motion.button
                                        whileTap={{ scale: 0.88 }}
                                        whileHover={{ scale: 1.07 }}
                                        style={{
                                            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                                            background: `radial-gradient(circle at 35% 35%, rgba(${tod.glow},0.90), rgba(${tod.glow},0.50))`,
                                            border: 'none', cursor: 'pointer', lineHeight: 0,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: `0 0 20px rgba(${tod.glow},0.50)`,
                                            color: 'white',
                                        }}
                                    >
                                        <Mic size={18} strokeWidth={2} />
                                    </motion.button>
                                )}
                            </div>

                            {isSilent && (
                                <p style={{ margin: '0.45rem 0 0', fontSize: '0.62rem', color: `rgba(${tod.glow},0.55)`, textAlign: 'center', fontStyle: 'italic', letterSpacing: '0.02em' }}>
                                    🌙 Mindful Delivery — recipient will not be disturbed
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
