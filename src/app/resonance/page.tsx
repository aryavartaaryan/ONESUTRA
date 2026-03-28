'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, MessageCircle, BookOpen, UserPlus, Check, X, Bell, Users, Compass, Send, Smile, Search } from 'lucide-react';
import { useOneSutraAuth } from '@/hooks/useOneSutraAuth';
import type { OneSutraUser } from '@/hooks/useOneSutraAuth';
import { useUsers } from '@/hooks/useUsers';
import type { SutraUser } from '@/hooks/useUsers';
import { useMessages, getChatId } from '@/hooks/useMessages';

// ─── Story data — Sacred moments + all mantras ───────────────────────────────
const RESONANCE_STORIES = [
    { id: 'gayatri', label: 'Gayatri Mantra', sublabel: 'Mother of Vedas', color: '#fbbf24', emoji: '\u{1F31E}', bg: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400&h=700&fit=crop&q=80', mantra: '\u0913\u0902 \u092d\u0942\u0930\u094d\u092d\u0941\u0935\u0903 \u0938\u094d\u0935\u0903 \u0924\u0924\u094d\u0938\u0935\u093f\u0924\u0941\u0930\u094d\u0935\u0930\u0947\u0923\u094d\u092f\u0902', featured: true },
    { id: 'om_namah', label: 'Om Namah Shivaya', sublabel: 'Panchakshara', color: '#a78bfa', emoji: '\u{1F549}', bg: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&h=700&fit=crop&q=80', mantra: '\u0913\u0902 \u0928\u092e\u0903 \u0936\u093f\u0935\u093e\u092f' },
    { id: 'mahamrityunjaya', label: 'Mahamrityunjaya', sublabel: 'Conqueror of Death', color: '#f97316', emoji: '\u{1F525}', bg: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400&h=700&fit=crop&q=80', mantra: '\u0913\u0902 \u0924\u094d\u0930\u092f\u092e\u094d\u092c\u0915\u0902 \u092f\u091c\u093e\u092e\u0939\u0947' },
    { id: 'hanuman', label: 'Hanuman Chalisa', sublabel: 'Bajrangbali', color: '#ef4444', emoji: '\u{1F34A}', bg: 'https://images.unsplash.com/photo-1609619385002-f40f1df9b7eb?w=400&h=700&fit=crop&q=80', mantra: '\u091c\u092f \u0939\u0928\u0941\u092e\u093e\u0928 \u091c\u094d\u091e\u093e\u0928 \u0917\u0941\u0923 \u0938\u093e\u0917\u0930' },
    { id: 'ganesha', label: 'Ganesha Vandana', sublabel: 'Vighnaharta', color: '#f59e0b', emoji: '\u{1F418}', bg: 'https://images.unsplash.com/photo-1600959907703-571a4f1f9fc4?w=400&h=700&fit=crop&q=80', mantra: '\u0913\u0902 \u0917\u0902 \u0917\u0923\u092a\u0924\u092f\u0947 \u0928\u092e\u0903' },
    { id: 'krishna', label: 'Hare Krishna', sublabel: 'Maha Mantra', color: '#06b6d4', emoji: '\u{1FA77}', bg: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=700&fit=crop&q=80', mantra: '\u0939\u0930\u0947 \u0930\u093e\u092e \u0939\u0930\u0947 \u0930\u093e\u092e \u0930\u093e\u092e \u0930\u093e\u092e \u0939\u0930\u0947 \u0939\u0930\u0947' },
    { id: 'durga', label: 'Durga Stuti', sublabel: 'Shakti Mantra', color: '#ec4899', emoji: '\u{1F6E1}', bg: 'https://images.unsplash.com/photo-1604607053579-ac6a2a40e77c?w=400&h=700&fit=crop&q=80', mantra: '\u0913\u0902 \u0926\u0941\u0902 \u0926\u0941\u0930\u094d\u0917\u093e\u092f\u0948 \u0928\u092e\u0903' },
    { id: 'saraswati', label: 'Saraswati Vandana', sublabel: 'Goddess of Knowledge', color: '#ffffff', emoji: '\u{1F3B5}', bg: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=700&fit=crop&q=80', mantra: '\u0913\u0902 \u0910\u0902 \u0939\u094d\u0930\u0940\u0902 \u0915\u094d\u0932\u0940\u0902 \u092e\u0939\u093e\u0938\u0930\u0938\u094d\u0935\u0924\u094d\u092f\u0948 \u0928\u092e\u0903' },
    { id: 'asato', label: 'Asato Ma', sublabel: 'Shanti Mantra', color: '#c4b5fd', emoji: '\u2728', bg: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&h=700&fit=crop&q=80', mantra: '\u0913\u0902 \u0905\u0938\u0924\u094b \u092e\u093e \u0938\u0926\u094d\u0917\u092e\u092f' },
    { id: 'dhyan', label: 'Dhyan', sublabel: 'Meditation', color: '#22d3ee', emoji: '\u{1F9D8}', bg: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=400&h=700&fit=crop&q=80' },
    { id: 'acharya', label: 'Acharya', sublabel: 'Free Consult', color: '#4ade80', emoji: '\u{1F33F}', bg: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=700&fit=crop&q=80' },
    { id: 'sunrise', label: 'Sunrise', sublabel: 'Pratah Kaal', color: '#fbbf24', emoji: '\u{1F304}', bg: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=700&fit=crop&q=80' },
    { id: 'sunset', label: 'Sunset', sublabel: 'Sandhya', color: '#fb923c', emoji: '\u{1F305}', bg: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400&h=700&fit=crop&q=80' },
    { id: 'himalaya', label: 'Himalaya', sublabel: 'Sacred Peaks', color: '#93c5fd', emoji: '\u{1F3D4}', bg: 'https://images.unsplash.com/photo-1455156218388-5e61b526818b?w=400&h=700&fit=crop&q=80' },
    { id: 'ganga', label: 'Ganga', sublabel: 'Sacred River', color: '#60a5fa', emoji: '\u{1F30A}', bg: 'https://images.unsplash.com/photo-1545420333-5c5fe6fc5a33?w=400&h=700&fit=crop&q=80' },
    { id: 'lotus', label: 'Lotus', sublabel: 'Padma Pushpa', color: '#f9a8d4', emoji: '\u{1FAB7}', bg: 'https://images.unsplash.com/photo-1616587894288-82f7b65dd78f?w=400&h=700&fit=crop&q=80' },
    { id: 'temple', label: 'Mandir', sublabel: 'Sacred Temple', color: '#fde68a', emoji: '\u{1F6D5}', bg: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=700&fit=crop&q=80' },
    { id: 'yoga', label: 'Yoga', sublabel: 'Union of Soul', color: '#34d399', emoji: '\u{1F9D8}', bg: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=700&fit=crop&q=80' },
    { id: 'ayurveda', label: 'Ayurveda', sublabel: 'Science of Life', color: '#a3e635', emoji: '\u{1F33F}', bg: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=700&fit=crop&q=80' },
    { id: 'nature', label: 'Prakriti', sublabel: 'Earth Soul', color: '#34d399', emoji: '\u{1F332}', bg: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=700&fit=crop&q=80' },
    { id: 'swadeshi', label: 'Swadeshi', sublabel: 'Sacred Market', color: '#fb923c', emoji: '\u{1F6CD}', bg: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&h=700&fit=crop&q=80' },
    { id: 'vedic', label: 'Vedic Wisdom', sublabel: 'Ancient Knowledge', color: '#d8b4fe', emoji: '\u{1F4DC}', bg: 'https://images.unsplash.com/photo-1510531704581-5b2870972060?w=400&h=700&fit=crop&q=80', mantra: '\u0938\u0930\u094d\u0935\u0947 \u092d\u0935\u0928\u094d\u0924\u0941 \u0938\u0941\u0916\u093f\u0928\u0903' },
];

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'story' | 'chat' | 'map';
type ChatView = 'contacts' | 'chat';
type FriendStatus = 'none' | 'sent' | 'received' | 'friends';

const AVATAR_COLORS = ['#8b5cf6','#ec4899','#3b82f6','#14b8a6','#f97316','#22c55e','#a855f7','#f59e0b'];
const EMOJIS = ['🙏','✨','🌿','🕉️','🌸','💛','🔥','🌟','💫','🌊','🌺','🎵','🧘','🌙','☀️','💜','🙌','👋','❤️','🌈','🦋','🍃','🌻','🛕','🪷','🌄','🌅','🎶','🏔️','🌾'];

interface FriendDoc {
    id: string;
    fromUid: string;
    toUid: string;
    fromName: string;
    fromPhoto: string | null;
    toName: string;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: number;
}

// ─── Story Bubble ─────────────────────────────────────────────────────────────
function StoryBubble({ story, idx, onClick }: { story: typeof RESONANCE_STORIES[0]; idx: number; onClick: () => void }) {
    return (
        <motion.button
            onClick={onClick}
            whileTap={{ scale: 0.92 }}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24, delay: idx * 0.05 }}
            style={{ flexShrink: 0, width: 76, height: 104, background: 'none', border: 'none', padding: 0, cursor: 'pointer', position: 'relative', borderRadius: 18, overflow: 'hidden' }}
        >
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${story.bg})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 18 }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: 'linear-gradient(180deg,rgba(0,0,0,0.05) 0%,rgba(0,0,0,0.5) 70%,rgba(0,0,0,0.75) 100%)' }} />
            <motion.div animate={{ opacity: [0.6,1,0.6] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute', inset: 0, borderRadius: 18, boxShadow: `inset 0 0 0 2px ${story.color}80, 0 0 12px ${story.color}40`, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 28, height: 28, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55) 0%, ${story.color}60 60%, rgba(0,0,0,0.1) 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, boxShadow: `0 2px 8px rgba(0,0,0,0.4), 0 0 10px ${story.color}50`, border: '1.5px solid rgba(255,255,255,0.4)' }}>{story.emoji}</div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '4px 5px 6px', background: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(8px)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '0.38rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: story.color, lineHeight: 1.2, marginBottom: 1 }}>{story.sublabel}</div>
                <div style={{ fontSize: '0.45rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{story.label}</div>
            </div>
        </motion.button>
    );
}

// ─── Full-screen Story Viewer ─────────────────────────────────────────────────
function StoryViewer({ stories, startIdx, onClose }: { stories: typeof RESONANCE_STORIES; startIdx: number; onClose: () => void }) {
    const [idx, setIdx] = useState(startIdx);
    const [progress, setProgress] = useState(0);
    const story = stories[idx];

    useEffect(() => {
        setProgress(0);
        let elapsed = 0;
        const timer = setInterval(() => {
            elapsed += 80;
            const pct = Math.min((elapsed / 6000) * 100, 100);
            setProgress(pct);
            if (pct >= 100) { clearInterval(timer); idx < stories.length - 1 ? setIdx(i => i + 1) : onClose(); }
        }, 80);
        return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idx]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div onClick={e => e.stopPropagation()} initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                style={{ position: 'relative', width: '100%', height: '100dvh', maxWidth: 430, overflow: 'hidden', background: '#000' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${story.bg})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.82)' }} />
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg,${story.color}25 0%,transparent 40%,rgba(0,0,0,0.6) 100%)` }} />
                <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', gap: 3, zIndex: 20 }}>
                    {stories.map((_, i) => (
                        <div key={i} style={{ flex: 1, height: 2.5, borderRadius: 2, background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: '#fff', width: i < idx ? '100%' : i === idx ? `${progress}%` : '0%' }} />
                        </div>
                    ))}
                </div>
                <motion.button whileTap={{ scale: 0.88 }} onClick={e => { e.stopPropagation(); onClose(); }}
                    style={{ position: 'absolute', top: 28, right: 12, width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', zIndex: 20 }}>
                    <X size={15} />
                </motion.button>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 2rem', textAlign: 'center', zIndex: 1 }}>
                    <motion.div animate={{ scale: [1,1.12,1], y: [0,-12,0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }} style={{ fontSize: 'clamp(3rem,12vw,5rem)', marginBottom: '1.2rem', filter: `drop-shadow(0 0 24px ${story.color}80)` }}>{story.emoji}</motion.div>
                    <h2 style={{ fontSize: 'clamp(1.4rem,5.5vw,2.2rem)', fontWeight: 800, color: '#fff', margin: '0 0 0.4rem', fontFamily: "'Playfair Display',Georgia,serif", textShadow: `0 0 40px ${story.color}60` }}>{story.label}</h2>
                    <p style={{ fontSize: '0.9rem', color: `${story.color}cc`, fontStyle: 'italic', margin: '0 0 1.2rem' }}>{story.sublabel}</p>
                    {(story as any).mantra && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
                            style={{ background: `linear-gradient(135deg,${story.color}18,rgba(0,0,0,0.4))`, backdropFilter: 'blur(12px)', border: `1px solid ${story.color}35`, borderRadius: 16, padding: '0.85rem 1.2rem', maxWidth: 320 }}>
                            <p style={{ margin: '0 0 0.4rem', fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: story.color }}>Sacred Mantra</p>
                            <p style={{ margin: 0, fontSize: '1rem', color: '#fff', fontFamily: "'Noto Serif Devanagari',serif", lineHeight: 1.7, textShadow: `0 0 20px ${story.color}50` }}>{(story as any).mantra}</p>
                        </motion.div>
                    )}
                </div>
                <div onClick={e => { e.stopPropagation(); idx > 0 ? setIdx(i => i - 1) : onClose(); }} style={{ position: 'absolute', left: 0, top: 60, bottom: 60, width: '28%', zIndex: 15, cursor: 'pointer' }} />
                <div onClick={e => { e.stopPropagation(); idx < stories.length - 1 ? setIdx(i => i + 1) : onClose(); }} style={{ position: 'absolute', right: 0, top: 60, bottom: 60, width: '28%', zIndex: 15, cursor: 'pointer' }} />
            </motion.div>
        </motion.div>
    );
}

// ─── Snapchat-Style Friend Card ───────────────────────────────────────────────
function FriendCard({ user: u, status, onAdd, onAccept, onDecline, onChat, isRequest = false }: {
    user: SutraUser; status: FriendStatus; onAdd?: () => void; onAccept?: () => void; onDecline?: () => void; onChat?: () => void; isRequest?: boolean;
}) {
    const initials = (u.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const colorIdx = u.uid.charCodeAt(0) % AVATAR_COLORS.length;
    const avatarBg = AVATAR_COLORS[colorIdx];

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.5rem' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
                {u.photoURL ? (
                    <img src={u.photoURL} alt={u.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${avatarBg}60` }} />
                ) : (
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.35) 0%, ${avatarBg}80 50%, ${avatarBg}40 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: '#fff', border: `2px solid ${avatarBg}60`, boxShadow: `0 0 12px ${avatarBg}40` }}>{initials}</div>
                )}
                {u.online && <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#22c55e', border: '2px solid #0d0820', boxShadow: '0 0 6px rgba(34,197,94,0.8)' }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: 'rgba(255,255,255,0.92)', fontFamily: "'Inter',system-ui,sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</p>
                <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)', fontFamily: "'Inter',system-ui,sans-serif" }}>{u.bio ? u.bio.slice(0, 28) : 'OneSUTRA member'}</p>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {isRequest ? (
                    <>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={onAccept} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(34,197,94,0.18)', border: '1.5px solid rgba(34,197,94,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#22c55e' }}><Check size={16} /></motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={onDecline} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}><X size={16} /></motion.button>
                    </>
                ) : status === 'none' ? (
                    <motion.button whileTap={{ scale: 0.9 }} onClick={onAdd}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.45rem 0.9rem', borderRadius: 99, background: 'rgba(251,191,36,0.15)', border: '1.5px solid rgba(251,191,36,0.45)', cursor: 'pointer', color: '#fbbf24', fontSize: '0.75rem', fontWeight: 700 }}>
                        <UserPlus size={13} /> Add
                    </motion.button>
                ) : status === 'sent' ? (
                    <div style={{ padding: '0.45rem 0.9rem', borderRadius: 99, background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', fontWeight: 600 }}>Sent</div>
                ) : status === 'friends' ? (
                    <motion.button whileTap={{ scale: 0.9 }} onClick={onChat}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.45rem 0.9rem', borderRadius: 99, background: 'rgba(139,92,246,0.18)', border: '1.5px solid rgba(139,92,246,0.45)', color: '#c4b5fd', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                        <MessageCircle size={12} /> Chat
                    </motion.button>
                ) : null}
            </div>
        </motion.div>
    );
}

// ─── Sakha Bodhi AI Card ──────────────────────────────────────────────────────
function SakhaBodhiCard({ onClick }: { onClick: () => void }) {
    return (
        <motion.div onClick={onClick} whileTap={{ scale: 0.97 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.9rem 1rem', background: 'linear-gradient(135deg,rgba(167,139,250,0.13) 0%,rgba(109,40,217,0.06) 100%)', borderRadius: 18, border: '1px solid rgba(167,139,250,0.28)', marginBottom: '0.65rem', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
            <div aria-hidden style={{ position: 'absolute', top: '-20%', right: '-5%', width: 80, height: 80, background: 'radial-gradient(circle,rgba(167,139,250,0.3) 0%,transparent 70%)', filter: 'blur(16px)', pointerEvents: 'none' }} />
            <motion.div animate={{ boxShadow: ['0 0 10px rgba(167,139,250,0.35)','0 0 22px rgba(167,139,250,0.65)','0 0 10px rgba(167,139,250,0.35)'] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: 50, height: 50, borderRadius: '50%', background: 'radial-gradient(circle at 35% 28%,rgba(255,255,255,0.42) 0%,rgba(167,139,250,0.75) 42%,rgba(109,40,217,0.9) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0, border: '2px solid rgba(167,139,250,0.55)' }}>🌟</motion.div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: '#e9d5ff' }}>Sakha Bodhi</p>
                    <span style={{ padding: '1px 6px', borderRadius: 99, background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.38)', fontSize: '0.5rem', fontWeight: 700, color: '#c4b5fd', letterSpacing: '0.1em', textTransform: 'uppercase' }}>AI Guru</span>
                    <motion.div animate={{ scale: [1,1.3,1], opacity: [0.7,1,0.7] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px rgba(74,222,128,0.8)' }} />
                </div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(167,139,250,0.6)' }}>Vedic wisdom · Sacred knowledge · Your conscious guide</p>
            </div>
            <motion.span animate={{ x: [0,4,0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} style={{ color: 'rgba(167,139,250,0.5)', fontSize: '1.2rem', flexShrink: 0 }}>›</motion.span>
        </motion.div>
    );
}

// ─── Inline Chat ──────────────────────────────────────────────────────────────
function InlineChat({ chatWith, currentUser, onBack }: { chatWith: SutraUser; currentUser: OneSutraUser; onBack: () => void }) {
    const chatId = getChatId(currentUser.uid, chatWith.uid);
    const { messages } = useMessages(chatId, currentUser.uid);
    const [text, setText] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const colorIdx = chatWith.uid.charCodeAt(0) % AVATAR_COLORS.length;
    const avatarBg = AVATAR_COLORS[colorIdx];
    const initials = chatWith.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

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
        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', background: '#050810', fontFamily: "'Inter',system-ui,sans-serif" }}>
            {/* BG */}
            <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=25&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.04 }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(5,8,16,0.96) 0%,rgba(5,8,16,0.88) 50%,rgba(5,8,16,0.96) 100%)' }} />
                <div style={{ position: 'absolute', top: 0, left: '25%', width: 220, height: 220, background: `radial-gradient(circle,${avatarBg}18 0%,transparent 70%)`, filter: 'blur(40px)' }} />
            </div>
            {/* Header */}
            <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', background: 'rgba(5,8,16,0.93)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(139,92,246,0.15)' }}>
                <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', flexShrink: 0 }}><ArrowLeft size={15} /></motion.button>
                {chatWith.photoURL
                    ? <img src={chatWith.photoURL} alt={chatWith.name} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${avatarBg}60`, flexShrink: 0 }} />
                    : <div style={{ width: 38, height: 38, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%,rgba(255,255,255,0.35) 0%,${avatarBg}80 50%,${avatarBg}50 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#fff', border: `2px solid ${avatarBg}60`, flexShrink: 0 }}>{initials}</div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chatWith.name}</p>
                    <p style={{ margin: '1px 0 0', fontSize: '0.65rem', color: chatWith.online ? '#4ade80' : 'rgba(255,255,255,0.35)' }}>{chatWith.online ? '● Online now' : '● OneSUTRA'}</p>
                </div>
            </div>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative', zIndex: 1 }}>
                {messages.length === 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, paddingTop: '4rem', gap: '0.75rem', opacity: 0.4 }}>
                        <div style={{ fontSize: '2.8rem' }}>🙏</div>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', textAlign: 'center', margin: 0 }}>Begin your conscious conversation</p>
                    </div>
                )}
                {messages.map(msg => {
                    const isMe = msg.senderId === currentUser.uid;
                    const timeStr = new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                    return (
                        <motion.div key={msg.id} initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 6 }}>
                            {!isMe && (chatWith.photoURL
                                ? <img src={chatWith.photoURL} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginBottom: 4 }} />
                                : <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${avatarBg}80`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: '#fff', flexShrink: 0, marginBottom: 4 }}>{initials.charAt(0)}</div>)}
                            <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: 3 }}>
                                <div style={{ padding: '0.6rem 0.9rem', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: isMe ? 'linear-gradient(135deg,#8b5cf6 0%,#6d28d9 100%)' : 'rgba(255,255,255,0.09)', color: '#fff', fontSize: '0.88rem', lineHeight: 1.5, wordBreak: 'break-word', boxShadow: isMe ? '0 2px 14px rgba(109,40,217,0.4)' : '0 1px 4px rgba(0,0,0,0.3)', border: isMe ? 'none' : '1px solid rgba(255,255,255,0.07)' }}>{msg.text}</div>
                                <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.25)', paddingInline: 4 }}>{timeStr}</span>
                            </div>
                        </motion.div>
                    );
                })}
                <div ref={bottomRef} />
            </div>
            {/* Emoji panel */}
            <AnimatePresence>
                {showEmoji && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
                        style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0.6rem 1rem', background: 'rgba(8,10,24,0.97)', borderTop: '1px solid rgba(255,255,255,0.06)', maxHeight: 130, overflowY: 'auto', position: 'relative', zIndex: 2 }}>
                        {EMOJIS.map(e => (
                            <motion.button key={e} whileTap={{ scale: 0.82 }} onClick={() => { setText(t => t + e); inputRef.current?.focus(); }}
                                style={{ fontSize: '1.45rem', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 3px', lineHeight: 1 }}>{e}</motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Input bar */}
            <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 8, padding: '0.65rem 0.85rem', background: 'rgba(5,8,16,0.96)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingBottom: 'calc(0.65rem + env(safe-area-inset-bottom,0px))' }}>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowEmoji(s => !s)}
                    style={{ width: 36, height: 36, borderRadius: '50%', background: showEmoji ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.06)', border: `1px solid ${showEmoji ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    <Smile size={16} style={{ color: showEmoji ? '#a78bfa' : 'rgba(255,255,255,0.5)' }} />
                </motion.button>
                <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                    placeholder="Type a message… 🙏" maxLength={500}
                    style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 22, padding: '0.6rem 1rem', color: '#fff', fontSize: '0.88rem', outline: 'none', fontFamily: "'Inter',system-ui,sans-serif" }} />
                <motion.button whileTap={{ scale: 0.9 }} onClick={sendMsg} disabled={!text.trim()}
                    style={{ width: 36, height: 36, borderRadius: '50%', background: text.trim() ? 'linear-gradient(135deg,#8b5cf6,#6d28d9)' : 'rgba(255,255,255,0.05)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: text.trim() ? 'pointer' : 'default', flexShrink: 0, boxShadow: text.trim() ? '0 2px 14px rgba(109,40,217,0.5)' : 'none' }}>
                    <Send size={14} style={{ color: text.trim() ? '#fff' : 'rgba(255,255,255,0.2)', marginLeft: 1 }} />
                </motion.button>
            </div>
        </motion.div>
    );
}

// ─── Map Placeholder ──────────────────────────────────────────────────────────
function DharmaMap() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '3rem 2rem', textAlign: 'center', gap: '1.5rem' }}>
            <motion.div animate={{ scale: [1,1.08,1], rotate: [0,5,-5,0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, rgba(251,191,36,0.4) 0%, rgba(251,191,36,0.08) 60%, transparent 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(251,191,36,0.3)', boxShadow: '0 0 40px rgba(251,191,36,0.2)' }}>
                <Compass size={44} style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.6))' }} />
            </motion.div>
            <div>
                <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', fontFamily: "'Playfair Display',Georgia,serif", letterSpacing: '0.04em' }}>Dharma Compass</h2>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: 260 }}>Discover conscious seekers near you — sacred locations, spiritual events & community gatherings.</p>
            </div>
            <div style={{ padding: '0.6rem 1.4rem', borderRadius: 99, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(251,191,36,0.7)', textTransform: 'uppercase' }}>Coming Soon</div>
        </div>
    );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ResonancePage() {
    const { user, signIn } = useOneSutraAuth();
    const router = useRouter();
    const { users } = useUsers(user?.uid ?? null);
    const [activeTab, setActiveTab] = useState<Tab>('chat');
    const [chatView, setChatView] = useState<ChatView>('contacts');
    const [chatWith, setChatWith] = useState<SutraUser | null>(null);
    const [storyIdx, setStoryIdx] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [friendDocs, setFriendDocs] = useState<FriendDoc[]>([]);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // ── Subscribe to all friend docs involving current user (two queries merged) ────
    useEffect(() => {
        if (!user?.uid) return;
        const uid = user.uid;
        let unsub1: (() => void) | null = null;
        let unsub2: (() => void) | null = null;
        const fromDocs = new Map<string, FriendDoc>();
        const toDocs = new Map<string, FriendDoc>();
        const merge = () => setFriendDocs([...fromDocs.values(), ...toDocs.values()]);
        (async () => {
            try {
                const { getFirebaseFirestore } = await import('@/lib/firebase');
                const { collection, query, where, onSnapshot } = await import('firebase/firestore');
                const db = await getFirebaseFirestore();
                unsub1 = onSnapshot(query(collection(db, 'resonance_friends'), where('fromUid', '==', uid)), snap => {
                    fromDocs.clear();
                    snap.docs.forEach(d => fromDocs.set(d.id, { id: d.id, ...(d.data() as Omit<FriendDoc,'id'>) }));
                    merge();
                });
                unsub2 = onSnapshot(query(collection(db, 'resonance_friends'), where('toUid', '==', uid)), snap => {
                    toDocs.clear();
                    snap.docs.forEach(d => toDocs.set(d.id, { id: d.id, ...(d.data() as Omit<FriendDoc,'id'>) }));
                    merge();
                });
            } catch { /* offline */ }
        })();
        return () => { unsub1?.(); unsub2?.(); };
    }, [user?.uid]);

    const getFriendStatus = useCallback((targetUid: string): FriendStatus => {
        const doc = friendDocs.find(d => (d.fromUid === user?.uid && d.toUid === targetUid) || (d.toUid === user?.uid && d.fromUid === targetUid));
        if (!doc) return 'none';
        if (doc.status === 'accepted') return 'friends';
        if (doc.status === 'pending' && doc.fromUid === user?.uid) return 'sent';
        if (doc.status === 'pending' && doc.toUid === user?.uid) return 'received';
        return 'none';
    }, [friendDocs, user?.uid]);

    const sendRequest = useCallback(async (target: SutraUser) => {
        if (!user) return;
        setActionLoading(target.uid);
        try {
            const { getFirebaseFirestore } = await import('@/lib/firebase');
            const { collection, addDoc } = await import('firebase/firestore');
            const db = await getFirebaseFirestore();
            await addDoc(collection(db, 'resonance_friends'), {
                fromUid: user.uid, toUid: target.uid,
                fromName: user.name, fromPhoto: user.photoURL ?? null,
                toName: target.name, status: 'pending',
                createdAt: Date.now(),
            });
        } catch { /* offline */ } finally { setActionLoading(null); }
    }, [user]);

    const respondRequest = useCallback(async (docId: string, accept: boolean) => {
        setActionLoading(docId);
        try {
            const { getFirebaseFirestore } = await import('@/lib/firebase');
            const { doc, updateDoc, deleteDoc } = await import('firebase/firestore');
            const db = await getFirebaseFirestore();
            if (accept) { await updateDoc(doc(db, 'resonance_friends', docId), { status: 'accepted' }); }
            else { await deleteDoc(doc(db, 'resonance_friends', docId)); }
        } catch { /* offline */ } finally { setActionLoading(null); }
    }, []);

    // Derived lists
    const incomingRequests = friendDocs.filter(d => d.status === 'pending' && d.toUid === user?.uid);
    const friendUids = new Set(friendDocs.filter(d => d.status === 'accepted').map(d => d.fromUid === user?.uid ? d.toUid : d.fromUid));
    const q = search.toLowerCase();
    const filteredUsers = users.filter(u => u.name.toLowerCase().includes(q) || (u.bio ?? '').toLowerCase().includes(q));
    const friendsList = filteredUsers.filter(u => friendUids.has(u.uid));
    const othersList = filteredUsers.filter(u => !friendUids.has(u.uid));

    const openChat = (u: SutraUser) => { setChatWith(u); setChatView('chat'); };
    const closeChat = () => { setChatView('contacts'); setChatWith(null); };

    return (
        <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#050810', position: 'relative', fontFamily: "'Inter',system-ui,sans-serif", overflow: 'hidden' }}>
            <style>{`.res-scroll::-webkit-scrollbar{display:none}.res-scroll{-ms-overflow-style:none;scrollbar-width:none}`}</style>

            {/* ── Natural background ── */}
            <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=40&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center top', opacity: 0.07 }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(5,8,16,0.93) 0%,rgba(5,8,16,0.82) 40%,rgba(5,8,16,0.90) 75%,rgba(5,8,16,0.98) 100%)' }} />
                <div style={{ position: 'absolute', top: '-5%', left: '50%', transform: 'translateX(-50%)', width: 520, height: 220, background: 'radial-gradient(ellipse,rgba(139,92,246,0.14) 0%,transparent 70%)', filter: 'blur(40px)' }} />
                <div style={{ position: 'absolute', bottom: '10%', right: '-10%', width: 280, height: 280, background: 'radial-gradient(circle,rgba(251,191,36,0.08) 0%,transparent 70%)', filter: 'blur(30px)' }} />
            </div>

            {/* ── TOP NAV ── */}
            <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(5,8,16,0.82)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(139,92,246,0.18)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', flexShrink: 0 }}>
                    <ArrowLeft size={16} />
                </Link>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, background: 'linear-gradient(120deg,#fff 0%,#c4b5fd 45%,#a78bfa 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', letterSpacing: '0.1em' }}>RESONANCE</h1>
                    <p style={{ margin: 0, fontSize: '0.58rem', color: 'rgba(167,139,250,0.5)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Conscious Circle</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {incomingRequests.length > 0 && (
                        <div style={{ position: 'relative' }}>
                            <Bell size={18} style={{ color: 'rgba(255,255,255,0.55)' }} />
                            <div style={{ position: 'absolute', top: -3, right: -3, width: 14, height: 14, borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.48rem', fontWeight: 800, color: '#fff', border: '1.5px solid #050810' }}>{incomingRequests.length}</div>
                        </div>
                    )}
                    {!user && (
                        <motion.button whileTap={{ scale: 0.94 }} onClick={signIn} style={{ padding: '0.4rem 0.85rem', borderRadius: 99, background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#c4b5fd', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>Sign In</motion.button>
                    )}
                </div>
            </header>

            {/* ── CONTENT ── */}
            <main style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1, paddingBottom: '5rem' }}>
                <AnimatePresence mode="wait">
                    {activeTab === 'story' && (
                        <motion.div key="story" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }}>

                            {/* ── Story Circles Row (top) ── */}
                            <div className="res-scroll" style={{ display: 'flex', gap: 8, padding: '10px 14px 8px', overflowX: 'auto', overflowY: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                {RESONANCE_STORIES.map((s, i) => <StoryBubble key={s.id} story={s} idx={i} onClick={() => setStoryIdx(i)} />)}
                            </div>

                            <div style={{ padding: '0.85rem 0.9rem 0' }}>

                                {/* ── Featured Story (Hero Card) ── */}
                                {(() => {
                                    const hero = RESONANCE_STORIES[0];
                                    return (
                                        <motion.button whileTap={{ scale: 0.985 }} onClick={() => setStoryIdx(0)}
                                            style={{ position: 'relative', width: '100%', height: 200, borderRadius: 22, overflow: 'hidden', border: 'none', padding: 0, cursor: 'pointer', background: 'transparent', marginBottom: '0.85rem', display: 'block' }}>
                                            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${hero.bg})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.8)' }} />
                                            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg,${hero.color}30 0%,transparent 50%,rgba(0,0,0,0.7) 100%)` }} />
                                            <motion.div animate={{ opacity: [0.4,0.9,0.4] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                                style={{ position: 'absolute', inset: 0, borderRadius: 22, boxShadow: `inset 0 0 0 2px ${hero.color}60, 0 0 30px ${hero.color}20`, pointerEvents: 'none' }} />
                                            <div style={{ position: 'absolute', top: 14, left: 14, padding: '3px 10px', borderRadius: 99, background: 'rgba(251,191,36,0.22)', border: '1px solid rgba(251,191,36,0.5)', fontSize: '0.55rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.15em', textTransform: 'uppercase' }}>✦ Featured</div>
                                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.85rem 1rem' }}>
                                                <div style={{ fontSize: '0.7rem', color: hero.color, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>{hero.sublabel}</div>
                                                <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 800, fontFamily: "'Playfair Display',Georgia,serif", marginBottom: (hero as any).mantra ? 5 : 0 }}>{hero.label}</div>
                                                {(hero as any).mantra && <div style={{ fontSize: '0.78rem', color: `${hero.color}cc`, fontFamily: "'Noto Serif Devanagari',serif", lineHeight: 1.4 }}>{(hero as any).mantra}</div>}
                                            </div>
                                            <div style={{ position: 'absolute', top: 12, right: 14, fontSize: '2rem', filter: `drop-shadow(0 0 12px ${hero.color}90)` }}>{hero.emoji}</div>
                                        </motion.button>
                                    );
                                })()}

                                {/* ── Sacred Mantras ── */}
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.65rem' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#a78bfa' }}>Sacred Mantras</div>
                                        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(167,139,250,0.3),transparent)' }} />
                                        <div style={{ fontSize: '0.8rem' }}>🕉️</div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                                        {RESONANCE_STORIES.filter(s => (s as any).mantra).map((s, i) => (
                                            <motion.button key={s.id} whileTap={{ scale: 0.96 }} onClick={() => setStoryIdx(RESONANCE_STORIES.indexOf(s))}
                                                style={{ position: 'relative', height: 200, borderRadius: 18, overflow: 'hidden', border: 'none', padding: 0, cursor: 'pointer', background: '#0a0c1e' }}>
                                                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${s.bg})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.45 }} />
                                                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg,${s.color}18 0%,rgba(0,0,0,0.7) 60%,rgba(0,0,0,0.85) 100%)` }} />
                                                <motion.div animate={{ opacity: [0.4,0.85,0.4] }} transition={{ duration: 2.5+i*0.3, repeat: Infinity, ease: 'easeInOut' }}
                                                    style={{ position: 'absolute', inset: 0, borderRadius: 18, boxShadow: `inset 0 0 0 1.5px ${s.color}55`, pointerEvents: 'none' }} />
                                                <div style={{ position: 'absolute', top: 10, left: 10, fontSize: '1.5rem', filter: `drop-shadow(0 0 10px ${s.color}80)` }}>{s.emoji}</div>
                                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.65rem 0.75rem' }}>
                                                    <div style={{ fontSize: '0.55rem', color: s.color, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>{s.sublabel}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 700, fontFamily: "'Playfair Display',serif", marginBottom: 4, lineHeight: 1.2 }}>{s.label}</div>
                                                    <div style={{ fontSize: '0.65rem', color: `${s.color}cc`, fontFamily: "'Noto Serif Devanagari',serif", lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{(s as any).mantra}</div>
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* ── Sacred Moments ── */}
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.65rem' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#34d399' }}>Sacred Moments</div>
                                        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(52,211,153,0.3),transparent)' }} />
                                        <div style={{ fontSize: '0.8rem' }}>🌿</div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                                        {RESONANCE_STORIES.filter(s => !(s as any).mantra && s.id !== 'gayatri').map((s, i) => (
                                            <motion.button key={s.id} whileTap={{ scale: 0.96 }} onClick={() => setStoryIdx(RESONANCE_STORIES.indexOf(s))}
                                                style={{ position: 'relative', height: 160, borderRadius: 18, overflow: 'hidden', border: 'none', padding: 0, cursor: 'pointer', background: 'transparent' }}>
                                                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${s.bg})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.82)' }} />
                                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,0.04) 0%,rgba(0,0,0,0.62) 100%)' }} />
                                                <motion.div animate={{ opacity: [0.4,0.8,0.4] }} transition={{ duration: 3+i*0.35, repeat: Infinity, ease: 'easeInOut' }}
                                                    style={{ position: 'absolute', inset: 0, borderRadius: 18, boxShadow: `inset 0 0 0 1.5px ${s.color}45`, pointerEvents: 'none' }} />
                                                <div style={{ position: 'absolute', top: 9, right: 9, fontSize: '1.25rem', filter: `drop-shadow(0 0 7px ${s.color}70)` }}>{s.emoji}</div>
                                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.55rem 0.7rem' }}>
                                                    <div style={{ fontSize: '0.54rem', color: s.color, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>{s.sublabel}</div>
                                                    <div style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{s.label}</div>
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'chat' && (
                        <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} style={{ padding: '1rem' }}>
                            {/* Search bar */}
                            <div style={{ position: 'relative', marginBottom: '1rem' }}>
                                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conscious seekers…" style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '0.65rem 1rem 0.65rem 2.2rem', color: '#fff', fontSize: '0.86rem', outline: 'none', fontFamily: "'Inter',system-ui,sans-serif", boxSizing: 'border-box' }} />
                            </div>

                            {/* Sakha Bodhi AI — always visible */}
                            <p style={{ margin: '0 0 0.5rem', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.55)' }}>AI Companion</p>
                            <SakhaBodhiCard onClick={() => router.push('/bodhi-chat')} />

                            {!user ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2.5rem 1rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '2.5rem' }}>🌐</div>
                                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.45)', fontSize: '0.88rem' }}>Sign in to connect with conscious seekers</p>
                                    <motion.button whileTap={{ scale: 0.94 }} onClick={signIn} style={{ padding: '0.75rem 2rem', borderRadius: 99, background: 'linear-gradient(135deg,rgba(139,92,246,0.25),rgba(109,40,217,0.15))', border: '1.5px solid rgba(139,92,246,0.5)', color: '#c4b5fd', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}>Sign In with Google</motion.button>
                                </div>
                            ) : (
                                <>
                                    {/* Incoming Friend Requests */}
                                    <AnimatePresence>
                                        {incomingRequests.length > 0 && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginBottom: '1.25rem', overflow: 'hidden' }}>
                                                <p style={{ margin: '0 0 0.6rem', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    Friend Requests
                                                    <span style={{ background: '#ef4444', color: '#fff', borderRadius: 99, padding: '1px 7px', fontSize: '0.58rem', fontWeight: 800 }}>{incomingRequests.length}</span>
                                                </p>
                                                {incomingRequests.map(req => (
                                                    <FriendCard key={req.id} user={{ uid: req.fromUid, name: req.fromName, photoURL: req.fromPhoto }} status="received" isRequest
                                                        onAccept={() => respondRequest(req.id, true)} onDecline={() => respondRequest(req.id, false)} />
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Friends — can Chat */}
                                    {friendsList.length > 0 && (
                                        <div style={{ marginBottom: '1.25rem' }}>
                                            <p style={{ margin: '0 0 0.6rem', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4ade80' }}>
                                                My Circle ✦ {friendsList.length}
                                            </p>
                                            {friendsList.map(u => (
                                                <FriendCard key={u.uid} user={u} status="friends" onChat={() => openChat(u)} />
                                            ))}
                                        </div>
                                    )}

                                    {/* All users — Add button */}
                                    <div>
                                        <p style={{ margin: '0 0 0.6rem', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.55)' }}>
                                            Conscious Seekers {othersList.length > 0 && `· ${othersList.length}`}
                                        </p>
                                        {othersList.length === 0 && !search && (
                                            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'rgba(255,255,255,0.22)', fontSize: '0.82rem' }}>All seekers are in your circle 🙏</div>
                                        )}
                                        {othersList.map(u => (
                                            <FriendCard key={u.uid} user={u} status={getFriendStatus(u.uid)}
                                                onAdd={() => sendRequest(u)} onChat={() => openChat(u)} />
                                        ))}
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'map' && (
                        <motion.div key="map" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <DharmaMap />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* ── BOTTOM NAV: Map | Chat | Story (Snapchat order) ── */}
            <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(5,8,16,0.95)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderTop: '1px solid rgba(139,92,246,0.15)', display: 'flex', paddingBottom: 'env(safe-area-inset-bottom,0px)' }}>
                {([
                    { id: 'map', icon: MapPin, label: 'Map', color: '#fbbf24' },
                    { id: 'chat', icon: MessageCircle, label: 'Chat', color: '#4ade80', badge: incomingRequests.length },
                    { id: 'story', icon: BookOpen, label: 'Story', color: '#a78bfa' },
                ] as Array<{ id: Tab; icon: React.ElementType; label: string; color: string; badge?: number }>).map(({ id, icon: Icon, label, color, badge }) => {
                    const active = activeTab === id;
                    return (
                        <motion.button key={id} whileTap={{ scale: 0.9 }} onClick={() => setActiveTab(id as Tab)}
                            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '0.75rem 0', background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
                            {active && <motion.div layoutId="nav-pill" style={{ position: 'absolute', inset: '4px 10px', borderRadius: 12, background: `${color}10`, border: `1px solid ${color}22` }} transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <Icon size={21} style={{ color: active ? color : 'rgba(255,255,255,0.28)', filter: active ? `drop-shadow(0 0 6px ${color}80)` : 'none', transition: 'all 0.18s' }} />
                                {badge !== undefined && badge > 0 && (
                                    <div style={{ position: 'absolute', top: -4, right: -5, minWidth: 13, height: 13, borderRadius: 99, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.42rem', fontWeight: 800, color: '#fff', border: '1.5px solid #050810', padding: '0 2px' }}>{badge}</div>
                                )}
                            </div>
                            <span style={{ fontSize: '0.62rem', fontWeight: active ? 700 : 500, color: active ? color : 'rgba(255,255,255,0.28)', letterSpacing: '0.05em', transition: 'all 0.18s', zIndex: 1 }}>{label}</span>
                        </motion.button>
                    );
                })}
            </nav>

            {/* ── Story Viewer overlay ── */}
            <AnimatePresence>
                {storyIdx !== null && (
                    <StoryViewer stories={RESONANCE_STORIES} startIdx={storyIdx} onClose={() => setStoryIdx(null)} />
                )}
            </AnimatePresence>

            {/* ── Inline Chat overlay (slide from right) ── */}
            <AnimatePresence>
                {chatView === 'chat' && chatWith && user && (
                    <InlineChat chatWith={chatWith} currentUser={user} onBack={closeChat} />
                )}
            </AnimatePresence>
        </div>
    );
}
