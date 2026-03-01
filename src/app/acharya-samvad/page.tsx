'use client';

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, Suspense } from 'react';
import styles from './digital-vaidya.module.css';
import { Mic, MicOff, PhoneOff, X } from 'lucide-react';
import { BilingualString, BilingualList } from '@/lib/types';
import translations from '@/lib/vaidya-translations.json';
import { useSearchParams } from 'next/navigation';
import TypewriterMessage from '@/components/TypewriterMessage';
import { useLanguage } from '@/context/LanguageContext';
import AcharyaGuruOrb, { OrbStatus } from '@/components/Dashboard/AcharyaGuruOrb';
import { useVaidyaVoiceCall } from '@/hooks/useVaidyaVoiceCall';
import { motion, AnimatePresence } from 'framer-motion';
import { useCircadianUnsplash } from '@/hooks/useCircadianUnsplash';

interface DiagnosisResult {
    diagnosis: BilingualString;
    rootCause: BilingualString;
    ahara: { title: string, en: string[], hi: string[] };
    vihara: { title: string, en: string[], hi: string[] };
    closing: BilingualString;
    doshaMeter: { vata: number, pitta: number, kapha: number };
}

interface Message {
    role: 'vaidya' | 'user';
    content: string;
    status?: 'sending' | 'sent' | 'error';
    isTyping?: boolean;
}

function AcharyaContent() {
    const searchParams = useSearchParams();
    const initialLang = (searchParams?.get('lang') as 'en' | 'hi') || 'hi';

    // ── Text chat state (UNTOUCHED) ──────────────────────────────────────────
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [sanitizedInput, setSanitizedInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<DiagnosisResult | null>(null);
    const { lang, toggleLanguage } = useLanguage();
    const bottomRef = useRef<HTMLDivElement>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // ── Circadian background ─────────────────────────────────────────────────
    const { imageUrl } = useCircadianUnsplash();

    // ── Inline voice engine ──────────────────────────────────────────────────
    const {
        callState, startCall, endCall,
        isMuted, toggleMute,
        transcript, isSpeaking,
    } = useVaidyaVoiceCall({ lang });
    const [zenMode, setZenMode] = useState(false);

    const orbStatus: OrbStatus =
        loading ? 'processing'
            : (callState === 'active' && isSpeaking) ? 'speaking'
                : (callState === 'active') ? 'listening'
                    : zenMode ? 'processing'
                        : 'idle';

    const handleAwakenAcharya = () => {
        setZenMode(true);
        setTimeout(() => startCall(), 120);
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([30, 50, 30]);
    };

    const handleEndSession = () => {
        endCall();
        setZenMode(false);
    };

    const t = translations[lang];

    const sanitizeText = useCallback((text: string): string => {
        if (!text) return '';
        let s = text.normalize('NFC');
        s = s.replace(/[\u200B-\u200D\uFEFF]/g, '');
        s = s.trim();
        s = s.replace(/\s+/g, ' ');
        return s;
    }, []);

    useEffect(() => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            setSanitizedInput(sanitizeText(input));
        }, 150);
        return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
    }, [input, sanitizeText]);

    const prevMessageCountRef = useRef(0);
    useLayoutEffect(() => {
        if (messages.length > prevMessageCountRef.current && prevMessageCountRef.current > 0) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
        prevMessageCountRef.current = messages.length;
    }, [messages]);

    const handleScrollToBottom = useCallback(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, []);

    const handleSend = async () => {
        const userMsg = sanitizeText(input);
        if (!userMsg) return;
        const optimisticMessage: Message = { role: 'user', content: userMsg, status: 'sending' };
        setMessages(prev => [...prev, optimisticMessage]);
        setInput('');
        setSanitizedInput('');
        setLoading(true);

        try {
            const messagesForAPI = [...messages, optimisticMessage]
                .filter(m => m.content && m.content.trim() && typeof m.content === 'string')
                .map(m => ({ role: m.role === 'vaidya' ? 'assistant' : 'user', content: m.content.trim() }));

            const userName = localStorage.getItem('pranav_user_name') || '';
            const res = await fetch('/api/digital-vaidya', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: messagesForAPI, language: lang, userName }),
            });

            if (!res.ok) throw new Error(`Vaidya connection failed: ${res.status}`);
            const data = await res.json();

            if (!data || (!data.activeVaidyaMessage && !data.vaidyaMessage)) throw new Error('Invalid response');

            setMessages(prev => prev.map((msg, idx) =>
                idx === prev.length - 1 && msg.status === 'sending' ? { ...msg, status: 'sent' } : msg
            ));

            const responseText = (data.activeVaidyaMessage || data.vaidyaMessage)?.[lang]
                || (data.activeVaidyaMessage || data.vaidyaMessage)?.['hi'] || '';
            if (responseText && responseText.trim() && responseText.toLowerCase() !== 'undefined') {
                setMessages(prev => [...prev, { role: 'vaidya', content: responseText.trim() }]);
            }
            if (data.isComplete && data.result) setResult(data.result);

        } catch (error: any) {
            setMessages(prev => prev.map((msg, idx) =>
                idx === prev.length - 1 && msg.status === 'sending' ? { ...msg, status: 'error' } : msg
            ));
            const errorMsg = lang === 'hi'
                ? 'क्षमा करें, ब्रह्मांडीय ऊर्जा अभी तीव्र है। कृपया कुछ क्षण प्रतीक्षा करें।'
                : 'Forgive me, the cosmic energies are intense. Please wait a moment.';
            setMessages(prev => [...prev, { role: 'vaidya', content: errorMsg }]);
        } finally {
            setLoading(false);
        }
    };

    const getText = (field: BilingualString | undefined) => {
        if (!field) return '';
        if (typeof field === 'string') return field;
        return field[lang] || field['en'] || '';
    };
    const getList = (field: any) => {
        if (!field) return [];
        if (Array.isArray(field)) return field;
        return field[lang] || field['en'] || [];
    };

    return (
        <div style={{ minHeight: '100dvh', position: 'relative', overflowX: 'hidden' }}>

            {/* ── Circadian nature background ── */}
            {imageUrl && (
                <img
                    src={imageUrl}
                    alt=""
                    style={{
                        position: 'fixed', inset: 0,
                        width: '100%', height: '100%',
                        objectFit: 'cover',
                        zIndex: -2,
                        opacity: 0.7,
                    }}
                />
            )}
            {/* Permanent dark gradient overlay */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: -1,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.60) 50%, #0A0A0A 100%)',
            }} />

            {/* ── ZEN MODE: Full-screen deep blur overlay ── */}
            <AnimatePresence>
                {zenMode && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 10,
                            backdropFilter: 'blur(28px)',
                            WebkitBackdropFilter: 'blur(28px)',
                            background: 'rgba(0,0,0,0.50)',
                            pointerEvents: 'none',
                        }}
                    />
                )}
            </AnimatePresence>

            {/* ── ZEN MODE: Orb-centered full-screen experience ── */}
            <AnimatePresence>
                {zenMode && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 30,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            gap: '2.5rem',
                        }}
                    >
                        {/* Hidden X exit button top-right */}
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.3 }}
                            whileHover={{ opacity: 0.9 }}
                            onClick={handleEndSession}
                            style={{
                                position: 'absolute', top: '1.5rem', right: '1.5rem',
                                background: 'none', border: 'none',
                                color: 'rgba(255,255,255,0.8)', cursor: 'pointer',
                                padding: '0.5rem',
                            }}
                        >
                            <X size={22} />
                        </motion.button>

                        {/* Cosmic orb in Zen Mode — 1.8x expansion handled inside component */}
                        <AcharyaGuruOrb
                            status={orbStatus}
                            zenMode={true}
                            sizePx={148}
                        />

                        {/* Status whisper — minimal, no transcript text */}
                        <motion.div
                            animate={{ opacity: [0.4, 0.85, 0.4] }}
                            transition={{ duration: callState === 'active' ? 1.5 : 3, repeat: Infinity }}
                            style={{
                                fontSize: '0.65rem', letterSpacing: '0.28em',
                                textTransform: 'uppercase',
                                color: 'rgba(165,180,252,0.72)',
                                fontFamily: 'monospace',
                                marginTop: '5rem',
                            }}
                        >
                            {callState === 'connecting' ? '· जुड़ रहे हैं ·'
                                : callState === 'active' && isSpeaking ? '· आचार्य वाणी ·'
                                    : callState === 'active' ? '· शुनियत · Listening ·'
                                        : callState === 'error' ? '· Error — tap × to exit ·'
                                            : '· जागृत · Awakening ·'}
                        </motion.div>

                        {/* Mute control (very subtle) */}
                        {callState === 'active' && (
                            <motion.button
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 0.55, y: 0 }}
                                whileHover={{ opacity: 0.9 }}
                                onClick={toggleMute}
                                style={{
                                    position: 'absolute', bottom: '3rem',
                                    background: 'rgba(255,255,255,0.06)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255,255,255,0.10)',
                                    borderRadius: 999, padding: '0.65rem 1.4rem',
                                    color: isMuted ? 'rgba(252,165,165,0.85)' : 'rgba(165,180,252,0.85)',
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    fontSize: '0.72rem', letterSpacing: '0.1em',
                                }}
                            >
                                {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                                <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                            </motion.button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── NORMAL MODE: Full page content ── */}
            <AnimatePresence>
                {!zenMode && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.4 }}
                        style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}
                    >
                        {/* ── Sri Yantra decorative background ── */}
                        <div className={styles.sriYantraLayer}>
                            <svg viewBox="0 0 100 100" fill="none" stroke="#C49102" strokeWidth="0.5" style={{ width: '100%', height: '100%' }}>
                                <circle cx="50" cy="50" r="48" opacity="0.3" />
                                <circle cx="50" cy="50" r="40" opacity="0.4" />
                                <path d="M50 2 L90 50 L50 98 L10 50 Z" opacity="0.3" />
                                <path d="M50 10 L85 50 L50 90 L15 50 Z" opacity="0.3" />
                                <circle cx="50" cy="50" r="5" fill="#C49102" opacity="0.2" />
                            </svg>
                        </div>

                        {/* ── Orb + Awaken Button Header ── */}
                        <div style={{
                            paddingTop: '3.5rem', paddingBottom: '0.5rem',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', gap: '1.2rem',
                            background: 'linear-gradient(to bottom, rgba(30,27,75,0.65) 0%, transparent 100%)',
                        }}>
                            <AcharyaGuruOrb
                                status={orbStatus}
                                zenMode={false}
                                sizePx={110}
                            />

                            {/* Awaken Acharya button */}
                            <motion.button
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={handleAwakenAcharya}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.7rem',
                                    padding: '0.65rem 1.8rem', borderRadius: 999,
                                    background: 'rgba(99,102,241,0.16)',
                                    border: '1px solid rgba(99,102,241,0.32)',
                                    color: 'rgba(199,210,254,0.90)',
                                    backdropFilter: 'blur(12px)',
                                    fontSize: '0.78rem', fontWeight: 600,
                                    letterSpacing: '0.18em', textTransform: 'uppercase',
                                    cursor: 'pointer', fontFamily: 'inherit',
                                }}
                            >
                                <Mic size={14} />
                                {lang === 'hi' ? 'आचार्य को जागृत करें' : 'Awaken Acharya'}
                            </motion.button>
                        </div>

                        {/* ── Decorative side panels ── */}
                        <div className={styles.mantraSidePanel} style={{ left: '2rem' }}>
                            <div className={styles.mantraPanelVertical}>
                                <span className={styles.mantraSanskrit}>
                                    "ॐ नमो भगवते महादर्शनाय वासुदेवाय धन्वंतराये |<br />
                                    अमृतकलश हस्ताय सर्वभय विनाशाय..."
                                </span>
                            </div>
                        </div>
                        <div className={styles.mantraSidePanel} style={{ right: '2rem' }}>
                            <div className={styles.mantraPanelVertical}>
                                <span className={styles.mantraSanskrit}>
                                    "योगेन चित्तस्य पदेन वाचां । मलं शरीरस्य च वैद्यकेन ॥"
                                </span>
                            </div>
                        </div>

                        {/* ── Main content layer ── */}
                        <div className={styles.contentLayer}>
                            {/* Language toggle header */}
                            <header className={styles.headerSection}>
                                <button onClick={toggleLanguage} className={styles.langToggle}>
                                    {lang === 'hi' ? 'English' : 'हिन्दी'}
                                </button>
                                <h1 className={styles.headerTitle}>
                                    {lang === 'hi' ? 'आचार्य संवाद' : 'Acharya Samvad'}
                                </h1>
                            </header>

                            {/* ── Chat display — completely untouched ── */}
                            <section className={styles.chatContainer}>
                                {!result ? (
                                    <div className={styles.manuscriptCard}>
                                        {messages.length === 0 && (
                                            <div className={styles.welcomeMessage}>
                                                <p className={styles.welcomeText}>
                                                    {lang === 'hi'
                                                        ? 'कैसे हो बेटाजी! आपको कोई भी स्वास्थ्य समस्या हो, आप यहाँ चैट पर लिखकर आयुर्वेद के अनुसार मुझसे स्वास्थ्य सलाह ले सकते हैं।'
                                                        : 'How are you, Beta! If you have any health concerns, you can message me here for Ayurvedic health advice.'}
                                                </p>
                                            </div>
                                        )}

                                        {messages
                                            .filter(msg => msg.content && msg.content.trim() && msg.content.toLowerCase() !== 'undefined')
                                            .map((msg, idx) => (
                                                <div key={idx} className={styles.messageWrapper}>
                                                    {msg.role === 'vaidya' ? (
                                                        <div className={styles.vaidyaMessage} lang="hi" dir="auto">
                                                            {idx === messages.length - 1 ? (
                                                                <TypewriterMessage
                                                                    content={msg.content || ''}
                                                                    speed={25}
                                                                    onUpdate={handleScrollToBottom}
                                                                />
                                                            ) : (msg.content || '')}
                                                        </div>
                                                    ) : (
                                                        <div className={styles.userMessage}>
                                                            "{msg.content || ''}"
                                                            {msg.status === 'sending' && (
                                                                <span className={styles.sendingIndicator}>
                                                                    {' '}({lang === 'hi' ? 'भेज रहे हैं...' : 'Sending...'})
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                        {loading && (
                                            <div className={styles.contemplating}>
                                                <div className={styles.diyaContainer}>
                                                    <div className={styles.diyaFlame} />
                                                    <div className={styles.diyaBase} />
                                                </div>
                                            </div>
                                        )}
                                        <div ref={bottomRef} />
                                    </div>
                                ) : (
                                    <div className={styles.resultSheet}>
                                        <h2 className={styles.resultTitle}>
                                            {lang === 'hi' ? 'परीक्षण का परिणाम' : 'Diagnosis Results'}
                                        </h2>
                                        <div className="mb-6">
                                            <h3 className="text-xl font-bold text-[#8A3324] mb-2">{lang === 'hi' ? 'निदान' : 'Diagnosis'}</h3>
                                            <p className="text-lg leading-relaxed">{getText(result.diagnosis)}</p>
                                        </div>
                                        <div className="mb-6">
                                            <h3 className="text-xl font-bold text-[#8A3324] mb-2">{lang === 'hi' ? 'मूल कारण' : 'Root Cause'}</h3>
                                            <p className="text-lg leading-relaxed">{getText(result.rootCause)}</p>
                                        </div>
                                        <div className="mt-8 text-left">
                                            <h3 style={{ color: '#C49102', fontFamily: 'var(--font-header)' }}>{t.dietLabel}</h3>
                                            <ul style={{ marginBottom: '2rem', paddingLeft: '1.5rem', color: '#5D4037' }}>
                                                {getList(result.ahara).map((item: string, i: number) => (
                                                    <li key={i} style={{ marginBottom: '0.5rem' }}>{item}</li>
                                                ))}
                                            </ul>
                                            <h3 style={{ color: '#C49102', fontFamily: 'var(--font-header)' }}>{t.routineLabel}</h3>
                                            <ul style={{ marginBottom: '2rem', paddingLeft: '1.5rem', color: '#5D4037' }}>
                                                {getList(result.vihara).map((item: string, i: number) => (
                                                    <li key={i} style={{ marginBottom: '0.5rem' }}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div style={{ marginTop: '2rem', fontStyle: 'italic', color: '#8A3324', fontSize: '1.2rem', textAlign: 'center' }}>
                                            "{getText(result.closing)}"
                                        </div>
                                        <div className="text-center mt-8">
                                            <button
                                                onClick={() => window.location.reload()}
                                                className={styles.submitButton}
                                                style={{ position: 'relative', border: '1px solid #C49102', padding: '0.5rem 2rem', borderRadius: '4px' }}
                                            >
                                                {lang === 'hi' ? 'नया परामर्श' : 'New Consultation'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* ── Input zone — completely untouched ── */}
                            {!result && (
                                <footer className={styles.inputZone}>
                                    <div className={styles.inputWrapper}>
                                        <textarea
                                            className={styles.goldInput}
                                            placeholder={lang === 'hi' ? 'अपनी समस्या यहाँ लिखें...' : 'Share your ailment here...'}
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && !e.shiftKey && !(e.nativeEvent as any).isComposing) {
                                                    e.preventDefault();
                                                    handleSend();
                                                }
                                            }}
                                            disabled={loading}
                                            rows={1}
                                            spellCheck={false}
                                            autoCorrect="off"
                                            autoCapitalize="none"
                                            autoComplete="off"
                                        />
                                        <button
                                            className={styles.submitButton}
                                            onClick={handleSend}
                                            disabled={loading || !sanitizedInput.trim()}
                                            aria-label={lang === 'hi' ? 'भेजें' : 'Send'}
                                        />
                                    </div>
                                    <div className={styles.footerDedication}>Dedicated to the Lineage of Ayurveda</div>
                                </footer>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function AcharyaSamvadPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', background: '#020617' }} />}>
            <AcharyaContent />
        </Suspense>
    );
}
