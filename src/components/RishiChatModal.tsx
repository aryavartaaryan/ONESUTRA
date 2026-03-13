'use client';

import React, { useState, useRef, useCallback, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Mic, MicOff, PhoneOff, BookOpen, Send } from 'lucide-react';
import styles from './RishiChatModal.module.css';
import TypewriterMessage from './TypewriterMessage';
import { useRishiVoiceCall } from '@/hooks/useRishiVoiceCall';
import { useLanguage } from '@/context/LanguageContext';

// ── Rishi data ────────────────────────────────────────────────────────────────

export interface RishiInfo {
    id: string;
    name: string;
    nameEn: string;
    title: string;
    titleEn: string;
    symbol: string;
    color: string;
    bgGradient: string;
}

export const RISHIS: RishiInfo[] = [
    {
        id: 'veda-vyasa',
        name: 'वेद व्यास',
        nameEn: 'Veda Vyasa',
        title: 'महाभारत रचयिता',
        titleEn: 'Composer of Mahabharata',
        symbol: '📖',
        color: '#FFD700',
        bgGradient: 'radial-gradient(circle, rgba(255,215,0,0.18) 0%, transparent 70%)',
    },
    {
        id: 'valmiki',
        name: 'महर्षि वाल्मीकि',
        nameEn: 'Maharshi Valmiki',
        title: 'आदिकवि',
        titleEn: 'First Poet — Ramayana',
        symbol: '🏹',
        color: '#FF8C42',
        bgGradient: 'radial-gradient(circle, rgba(255,140,66,0.18) 0%, transparent 70%)',
    },
    {
        id: 'patanjali',
        name: 'महर्षि पतंजलि',
        nameEn: 'Maharshi Patanjali',
        title: 'योगसूत्र रचयिता',
        titleEn: 'Yoga Sutras — Ashtanga',
        symbol: '🧘',
        color: '#A78BFA',
        bgGradient: 'radial-gradient(circle, rgba(167,139,250,0.18) 0%, transparent 70%)',
    },
    {
        id: 'sushruta',
        name: 'महर्षि सुश्रुत',
        nameEn: 'Maharshi Sushruta',
        title: 'शल्य चिकित्सा जनक',
        titleEn: 'Father of Surgery',
        symbol: '⚕️',
        color: '#34D399',
        bgGradient: 'radial-gradient(circle, rgba(52,211,153,0.18) 0%, transparent 70%)',
    },
    {
        id: 'charaka',
        name: 'महर्षि चरक',
        nameEn: 'Maharshi Charaka',
        title: 'आयुर्वेद महाचार्य',
        titleEn: 'Pillar of Ayurveda',
        symbol: '🌿',
        color: '#F87171',
        bgGradient: 'radial-gradient(circle, rgba(248,113,113,0.18) 0%, transparent 70%)',
    },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
    role: 'rishi' | 'user';
    content: string;
    isTyping?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface RishiChatModalProps {
    rishi: RishiInfo;
    onClose: () => void;
}

export default function RishiChatModal({ rishi, onClose }: RishiChatModalProps) {
    const { lang } = useLanguage();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const prevCountRef = useRef(0);

    const {
        callState, startCall, endCall,
        isMuted, toggleMute,
        isSpeaking,
        error: voiceError,
    } = useRishiVoiceCall({ rishiId: rishi.id, lang });

    // Scroll on new message
    useLayoutEffect(() => {
        if (messages.length > prevCountRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
        prevCountRef.current = messages.length;
    }, [messages]);

    // Auto-resize textarea
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
    };

    // ── Send message ──────────────────────────────────────────────────────────
    const sendMessage = useCallback(async (text?: string, isIntro = false) => {
        const userText = (text ?? input).trim();
        if (!userText && !isIntro) return;

        const userMsg: ChatMessage = {
            role: 'user',
            content: isIntro
                ? (lang === 'hi' ? '🙏 अपना परिचय दें' : '🙏 Please introduce yourself')
                : userText,
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        if (textAreaRef.current) textAreaRef.current.style.height = 'auto';
        setLoading(true);

        try {
            const res = await fetch('/api/rishi-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rishiId: rishi.id,
                    messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
                    language: lang,
                    isIntro,
                }),
            });
            if (!res.ok) throw new Error('Failed to reach the sage');
            const data = await res.json();
            if (data.rishiMessage) {
                setMessages(prev => [...prev, { role: 'rishi', content: data.rishiMessage }]);
            }
        } catch {
            setMessages(prev => [...prev, {
                role: 'rishi',
                content: lang === 'hi'
                    ? 'क्षमा करें, संपर्क में बाधा आई। कृपया पुनः प्रयास करें।'
                    : 'Forgive me, the connection was disturbed. Please try again.',
            }]);
        } finally {
            setLoading(false);
        }
    }, [input, messages, rishi.id, lang]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !(e.nativeEvent as KeyboardEvent).isComposing) {
            e.preventDefault();
            sendMessage();
        }
    };

    const voiceStatusText =
        callState === 'connecting' ? (lang === 'hi' ? '· जुड़ रहे हैं ·' : '· Connecting ·')
            : callState === 'active' && isSpeaking ? (lang === 'hi' ? '· ऋषि वाणी ·' : '· Sage Speaking ·')
                : callState === 'active' ? (lang === 'hi' ? '· सुन रहे हैं ·' : '· Listening ·')
                    : callState === 'error' ? '· Error ·'
                        : '';

    return (
        <>
            {/* Backdrop */}
            <motion.div
                key="rishi-backdrop"
                className={styles.backdrop}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                key="rishi-modal"
                className={styles.modal}
                initial={{ opacity: 0, scale: 0.8, x: '-50%', y: '-40%' }}
                animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
                exit={{ opacity: 0, scale: 0.9, x: '-50%', y: '-40%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            >
                {/* Handle (optional now, since it's an alert-like box) */}
                <div className={styles.handle} style={{ display: 'none' }} />

                {/* Header */}
                <div className={styles.header}>
                    <div
                        className={styles.rishiAvatar}
                        style={{ background: rishi.bgGradient }}
                    >
                        <span style={{ fontSize: '1.4rem' }}>{rishi.symbol}</span>
                    </div>
                    <div className={styles.headerInfo}>
                        <h2 className={styles.rishiName} style={{ color: rishi.color }}>
                            {lang === 'hi' ? rishi.name : rishi.nameEn}
                        </h2>
                        <p className={styles.rishiTitle}>
                            {lang === 'hi' ? rishi.title : rishi.titleEn}
                        </p>
                    </div>
                    <div className={styles.headerActions}>
                        <button className={styles.iconBtn} onClick={onClose} aria-label="Close">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Voice call bar */}
                <div className={styles.voiceArea}>
                    {callState === 'idle' || callState === 'disconnected' || callState === 'error' ? (
                        <button
                            className={styles.voiceBtn}
                            onClick={startCall}
                        >
                            <Mic size={13} />
                            {lang === 'hi' ? 'वाणी से बात करें' : 'Talk by Voice'}
                        </button>
                    ) : (
                        <>
                            <div className={styles.voicePulse} />
                            <span className={styles.voiceStatus}>{voiceStatusText}</span>
                            {callState === 'active' && (
                                <button className={styles.muteBtn} onClick={toggleMute}>
                                    {isMuted ? <MicOff size={11} /> : <Mic size={11} />}
                                    <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                                </button>
                            )}
                            <button
                                className={`${styles.voiceBtn} ${styles.voiceBtnActive}`}
                                style={{ marginLeft: 'auto' }}
                                onClick={endCall}
                            >
                                <PhoneOff size={13} />
                                {lang === 'hi' ? 'समाप्त' : 'End'}
                            </button>
                        </>
                    )}
                    {voiceError && callState === 'error' && (
                        <span style={{ fontSize: '0.65rem', color: 'rgba(252,165,165,0.7)', marginLeft: '0.5rem' }}>
                            {voiceError}
                        </span>
                    )}
                </div>

                {/* Chat area */}
                <div className={styles.chatArea}>
                    {messages.length === 0 && (
                        <div className={styles.welcomeState}>
                            <div className={styles.welcomeSymbol}>{rishi.symbol}</div>
                            <p className={styles.welcomeText}>
                                {lang === 'hi'
                                    ? `${rishi.name} से संवाद करें`
                                    : `Converse with ${rishi.nameEn}`
                                }
                            </p>
                        </div>
                    )}

                    {/* Intro button */}
                    <button
                        className={styles.introBtn}
                        onClick={() => sendMessage(undefined, true)}
                        disabled={loading}
                        style={{ borderColor: `${rishi.color}55`, color: rishi.color }}
                    >
                        <BookOpen size={12} />
                        {lang === 'hi' ? 'परिचय सुनें' : 'Self Introduction'}
                    </button>

                    {/* Messages */}
                    {messages.map((msg, idx) => (
                        <div key={idx} className={styles.msgWrap}>
                            {msg.role === 'rishi' ? (
                                <div
                                    className={styles.rishiMsg}
                                    style={{ borderLeftColor: rishi.color + '99' }}
                                    lang="hi"
                                    dir="auto"
                                >
                                    {idx === messages.length - 1 ? (
                                        <TypewriterMessage
                                            content={msg.content}
                                            speed={22}
                                            onUpdate={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })}
                                        />
                                    ) : msg.content}
                                </div>
                            ) : (
                                <div className={styles.userMsg}>{msg.content}</div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className={styles.thinkingWrap}>
                            <div className={styles.dot} />
                            <div className={styles.dot} />
                            <div className={styles.dot} />
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className={styles.inputArea}>
                    <div className={styles.inputRow}>
                        <textarea
                            ref={textAreaRef}
                            className={styles.textInput}
                            placeholder={
                                lang === 'hi'
                                    ? `${rishi.name} से कुछ पूछें...`
                                    : `Ask ${rishi.nameEn} something...`
                            }
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            rows={1}
                            spellCheck={false}
                            autoCorrect="off"
                            autoCapitalize="none"
                            autoComplete="off"
                        />
                        <button
                            className={styles.sendBtn}
                            onClick={() => sendMessage()}
                            disabled={loading || !input.trim()}
                            style={{
                                background: input.trim()
                                    ? `rgba(196, 145, 2, 0.75)`
                                    : 'rgba(255,255,255,0.06)'
                            }}
                            aria-label={lang === 'hi' ? 'भेजें' : 'Send'}
                        >
                            <Send size={15} color={input.trim() ? '#0d0804' : 'rgba(255,255,255,0.3)'} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    );
}
