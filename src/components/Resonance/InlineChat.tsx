'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Smile, Phone, Video, MoreVertical } from 'lucide-react';
import { SutraUser } from '@/hooks/useUsers';
import { OneSutraUser } from '@/hooks/useOneSutraAuth';
import { useMessages, getChatId } from '@/hooks/useMessages';

const AVATAR_COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#14b8a6', '#f97316', '#22c55e', '#a855f7', '#f59e0b'];
const EMOJIS = ['🙏', '✨', '🌿', '🕉️', '🌸', '💛', '🔥', '🌟', '💫', '🌊', '🌺', '🎵', '🧘', '🌙', '☀️', '💜', '🙌', '👋', '❤️', '🌈', '🦋', '🍃', '🌻', '🛕', '🪷', '🌄', '🌅', '🎶', '🏔️', '🌾'];

const TIME_BGS = {
    // Beautiful, atmospheric nature backgrounds
    morning: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1080&q=80', // Sunrise forest/mountains
    afternoon: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1080&q=80', // Crisp green forest
    evening: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1080&q=80', // Golden sunset silhouette
    night: 'https://images.unsplash.com/photo-1532978379173-523e16f371f2?w=1080&q=80', // Starry night sky in nature
};

function getTimeOfDayBg() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return TIME_BGS.morning;
    if (h >= 12 && h < 17) return TIME_BGS.afternoon;
    if (h >= 17 && h < 20) return TIME_BGS.evening;
    return TIME_BGS.night;
}

export default function InlineChat({ chatWith, currentUser, onBack }: { chatWith: SutraUser; currentUser: OneSutraUser; onBack: () => void }) {
    const chatId = getChatId(currentUser.uid, chatWith.uid);
    const { messages } = useMessages(chatId, currentUser.uid);
    const [text, setText] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    const [bgImage, setBgImage] = useState(TIME_BGS.night);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const colorIdx = chatWith.uid.charCodeAt(0) % AVATAR_COLORS.length;
    const avatarBg = AVATAR_COLORS[colorIdx];
    const initials = chatWith.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

    useEffect(() => {
        setBgImage(getTimeOfDayBg());
        const interval = setInterval(() => {
            setBgImage(getTimeOfDayBg());
        }, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

    const sendMsg = useCallback(async () => {
        const msg = text.trim(); if (!msg) return;
        setText(''); setShowEmoji(false);
        try {
            const { getFirebaseFirestore } = await import('@/lib/firebase');
            const { collection, addDoc, doc, setDoc, serverTimestamp, increment } = await import('firebase/firestore');
            const db = await getFirebaseFirestore();
            await addDoc(collection(db, 'onesutra_chats', chatId, 'messages'), {
                text: msg, senderId: currentUser.uid, senderName: currentUser.name,
                createdAt: serverTimestamp(), sentBy: 'user', deliveryMode: 'normal',
            });
            await setDoc(doc(db, 'onesutra_chats', chatId), {
                lastMessage: { text: msg, senderId: currentUser.uid, senderName: currentUser.name, sentBy: 'user', createdAt: serverTimestamp() },
                [`unreadCounts.${chatWith.uid}`]: increment(1),
            }, { merge: true });
        } catch { /* offline */ }
    }, [text, chatId, currentUser, chatWith.uid]);

    return (
        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', flexDirection: 'column', backgroundColor: '#050810', fontFamily: "'Inter',system-ui,sans-serif", overflow: 'hidden' }}>

            {/* Dynamic Nature Background */}
            <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <AnimatePresence mode="wait">
                    <motion.img
                        key={bgImage}
                        src={bgImage}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </AnimatePresence>
                {/* Gradient overlays to ensure readability while maintaining vibrant nature feel */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(5,8,16,0.65) 0%, rgba(5,8,16,0.3) 20%, rgba(5,8,16,0.3) 70%, rgba(5,8,16,0.85) 100%)' }} />
                {/* Spiritual ambient glow */}
                <div style={{ position: 'absolute', top: 0, left: '25%', width: '150%', height: '150%', background: `radial-gradient(circle at 50% 10%, ${avatarBg}15 0%, transparent 60%)`, filter: 'blur(40px)', transform: 'translateX(-20%)' }} />
            </div>

            {/* Premium Header */}
            <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', background: 'rgba(5,8,16,0.4)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingTop: 'calc(0.85rem + env(safe-area-inset-top, 0px))' }}>
                <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.9)', flexShrink: 0 }}><ArrowLeft size={18} strokeWidth={2.5} /></motion.button>

                {chatWith.photoURL
                    ? <img src={chatWith.photoURL} alt={chatWith.name} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: `2px solid rgba(255,255,255,0.8)`, flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }} />
                    : <div style={{ width: 42, height: 42, borderRadius: '50%', background: `linear-gradient(135deg, ${avatarBg}cc, ${avatarBg})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: '#fff', border: `2px solid rgba(255,255,255,0.8)`, flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>{initials}</div>}

                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: '0.02em' }}>{chatWith.name}</p>
                    <p style={{ margin: '1px 0 0', fontSize: '0.7rem', color: chatWith.online ? '#4ade80' : 'rgba(255,255,255,0.6)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {chatWith.online && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px rgba(74,222,128,0.8)' }} />}
                        {chatWith.online ? 'Online now' : 'OneSUTRA Seeker'}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Video size={18} /></button>
                    <button style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Phone size={18} /></button>
                </div>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', zIndex: 1, scrollbarWidth: 'none' }}>
                {messages.length === 0 && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, paddingTop: '4rem', gap: '1rem' }}>
                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>🌱</div>
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 0.25rem', color: '#fff', fontSize: '1.2rem', fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 700 }}>Sacred Connection</h3>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', margin: 0, maxWidth: 220, lineHeight: 1.5 }}>Begin a conscious conversation immersed in nature.</p>
                        </div>
                    </motion.div>
                )}
                {messages.map((msg, index) => {
                    const isMe = msg.senderId === currentUser.uid;
                    const prevMsg = index > 0 ? messages[index - 1] : null;
                    const isConsecutive = prevMsg && prevMsg.senderId === msg.senderId;
                    const timeStr = new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

                    return (
                        <motion.div key={msg.id} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                            style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8, marginTop: isConsecutive ? -4 : 0 }}>
                            {!isMe && (
                                <div style={{ width: 28, height: 28, flexShrink: 0, visibility: isConsecutive ? 'hidden' : 'visible' }}>
                                    {chatWith.photoURL
                                        ? <img src={chatWith.photoURL} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} />
                                        : <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: `linear-gradient(135deg, ${avatarBg}cc, ${avatarBg})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>{initials.charAt(0)}</div>}
                                </div>
                            )}
                            <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: 4 }}>
                                <div style={{
                                    padding: '0.75rem 1.1rem',
                                    borderRadius: isMe
                                        ? `20px 20px ${isConsecutive ? '20px' : '4px'} 20px`
                                        : `20px 20px 20px ${isConsecutive ? '20px' : '4px'}`,
                                    background: isMe ? 'rgba(251, 191, 36, 0.9)' : 'rgba(255,255,255,0.15)',
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)',
                                    color: isMe ? '#451a03' : '#fff',
                                    fontSize: '0.92rem',
                                    lineHeight: 1.45,
                                    wordBreak: 'break-word',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                                    border: isMe ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.2)',
                                    fontWeight: 500
                                }}>{msg.text}</div>
                                {!isConsecutive && <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', paddingInline: 6, fontWeight: 500 }}>{timeStr}</span>}
                            </div>
                        </motion.div>
                    );
                })}
                <div ref={bottomRef} style={{ height: 10 }} />
            </div>

            {/* Emoji panel */}
            <AnimatePresence>
                {showEmoji && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '1rem', background: 'rgba(5,8,16,0.6)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.1)', maxHeight: 180, overflowY: 'auto', position: 'relative', zIndex: 10 }}>
                        {EMOJIS.map(e => (
                            <motion.button key={e} whileTap={{ scale: 0.8 }} onClick={() => { setText(t => t + e); inputRef.current?.focus(); }}
                                style={{ fontSize: '1.6rem', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', lineHeight: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>{e}</motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Input Pill */}
            <div style={{ position: 'relative', zIndex: 10, padding: '0.75rem 1rem', paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 28, padding: '0.4rem', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowEmoji(s => !s)}
                        style={{ width: 40, height: 40, borderRadius: '50%', background: showEmoji ? 'rgba(251,191,36,0.2)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, border: 'none' }}>
                        <Smile size={22} style={{ color: showEmoji ? '#fbbf24' : 'rgba(255,255,255,0.8)' }} />
                    </motion.button>

                    <textarea
                        ref={inputRef}
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                        placeholder="Chant your thoughts..."
                        maxLength={500}
                        rows={1}
                        style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '0.95rem', outline: 'none', fontFamily: "'Inter',system-ui,sans-serif", resize: 'none', minHeight: 40, padding: '0.65rem 0.2rem', fontWeight: 500 }}
                    />

                    <motion.button whileTap={{ scale: 0.9 }} onClick={sendMsg} disabled={!text.trim()}
                        style={{ width: 40, height: 40, borderRadius: '50%', background: text.trim() ? '#fbbf24' : 'rgba(255,255,255,0.1)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: text.trim() ? 'pointer' : 'default', flexShrink: 0, boxShadow: text.trim() ? '0 4px 16px rgba(251,191,36,0.4)' : 'none', transition: 'background 0.2s' }}>
                        <Send size={18} style={{ color: text.trim() ? '#451a03' : 'rgba(255,255,255,0.4)', marginLeft: 2 }} />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}
