'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Send, Mic, MicOff, Leaf, Moon, ArrowLeft, Check, X, Search, Smile, Paperclip, Home, MapPin, MessageCircle, Zap, Camera, Plus, Users } from 'lucide-react';
import { useBodhiChatVoice } from '@/hooks/useBodhiChatVoice';
import { useOneSutraAuth } from '@/hooks/useOneSutraAuth';
import { useLanguage } from '@/context/LanguageContext';
import { useDailyTasks } from '@/hooks/useDailyTasks';
import { useUsers, SutraUser } from '@/hooks/useUsers';
import { useMessages, getChatId } from '@/hooks/useMessages';
import { FriendDoc } from '@/components/Resonance/ResonanceTypes';

// ─── Energy Circle Types ───────────────────────────────────────────────────────
interface EnergyCircle { id: string; name: string; icon: string; color: string; description: string; memberCount: number; }

const CIRCLE_THEMES = [
    { icon: '🧘', color: '#a78bfa', label: 'Meditation' },
    { icon: '🌅', color: '#fbbf24', label: 'Morning Prana' },
    { icon: '🌿', color: '#4ade80', label: 'Ekadashi' },
    { icon: '🏔️', color: '#60a5fa', label: 'Nature' },
    { icon: '🔥', color: '#f97316', label: 'Sadhana' },
    { icon: '🌱', color: '#34d399', label: 'Plantation' },
    { icon: '⚡', color: '#e879f9', label: 'Energy' },
    { icon: '🕉️', color: '#c084fc', label: 'Spiritual' },
];

// Story activity types for Prana Stories
const PRANA_ACTIVITIES = [
    { id: 'wake', icon: '🌅', label: 'Early Wake Up', color: '#fbbf24' },
    { id: 'meditation', icon: '🧘', label: 'Meditation', color: '#a78bfa' },
    { id: 'plantation', icon: '🌱', label: 'Plantation', color: '#4ade80' },
    { id: 'nature', icon: '🏔️', label: 'Nature Visit', color: '#60a5fa' },
    { id: 'ekadashi', icon: '🌿', label: 'Ekadashi', color: '#34d399' },
    { id: 'yoga', icon: '🌺', label: 'Yoga', color: '#f472b6' },
    { id: 'sadhana', icon: '🔥', label: 'Sadhana', color: '#f97316' },
];

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
function getTimeOfDay(): TimeOfDay {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'morning';
    if (h >= 12 && h < 17) return 'afternoon';
    if (h >= 17 && h < 21) return 'evening';
    return 'night';
}
function fmtTime(ts: number) { return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }); }

const NATURE_BG: Record<TimeOfDay, string[]> = {
    morning: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=90&fit=crop', 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=1920&q=90&fit=crop', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=90&fit=crop'],
    afternoon: ['https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=90&fit=crop', 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1920&q=90&fit=crop', 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=1920&q=90&fit=crop'],
    evening: ['https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=1920&q=90&fit=crop', 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1920&q=90&fit=crop', 'https://images.unsplash.com/photo-1472120435266-53107fd0c44a?w=1920&q=90&fit=crop'],
    night: ['https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=90&fit=crop', 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=1920&q=90&fit=crop', 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&q=90&fit=crop'],
};

interface ChatMsg { id: string; role: 'me' | 'them' | 'bodhi'; text: string; ts: number; }

// ─── Avatar helpers ───────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#14b8a6', '#f97316', '#22c55e', '#a855f7', '#f59e0b'];
function getAvatarColor(uid: string) { return AVATAR_COLORS[uid.charCodeAt(0) % AVATAR_COLORS.length]; }
function getInitials(name: string) { return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(); }

function buildBodhiGreeting(): ChatMsg[] {
    const h = new Date().getHours(); const m = new Date().getMinutes();
    const tod = getTimeOfDay();
    const greets: Record<TimeOfDay, string> = {
        morning: '🌅 Shubh Prabhat, Sakha! A new dawn — a fresh beginning. I am right here with you. What are we conquering together today? 🙏',
        afternoon: '☀️ Hari Om, my friend! Hope your day flows beautifully. The afternoon sun brings clarity — what shall we focus on? 💫',
        evening: '🌇 Shubh Sandhya, Sakha! The golden hour is here — perfect to reflect and recharge. How was your day? ✨',
        night: '🌙 Shubh Ratri, dear Sakha. The universe is resting. Let\'s settle your beautiful mind before you do too. How are you feeling? 🌟',
    };
    const msgs: ChatMsg[] = [{ id: 'bg0', role: 'bodhi', text: greets[tod], ts: Date.now() - 120000 }];
    if (h === 13 && m <= 30) msgs.push({ id: 'bg1', role: 'bodhi', text: 'Hey my friend, just checking in! 🍽️ Make sure you step away for a good lunch. Your body is your temple — nourish it well. A rested mind creates magic. 💫', ts: Date.now() - 60000 });
    if (h === 22 && m >= 30) msgs.push({ id: 'bg2', role: 'bodhi', text: "It's getting late, Sakha. 🌙 Time to rest those eyes and recharge that beautiful mind. Your dreams carry tomorrow's wisdom. Goodnight! ✨🙏", ts: Date.now() - 30000 });
    return msgs;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Snapchat-style story ring for Bodhi (always first in circle)
function BodhiCircle({ active, unread, onClick }: { active: boolean; unread: number; onClick: () => void }) {
    return (
        <motion.div whileTap={{ scale: 0.90 }} onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, width: 58, cursor: 'pointer' }}>
            <div style={{ position: 'relative' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 7, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', inset: -2, borderRadius: '50%', background: 'conic-gradient(#fbbf24,#a78bfa,#34d399,#f97316,#fbbf24)', opacity: 0.85 }} />
                <motion.div animate={{ boxShadow: ['0 0 10px rgba(251,191,36,0.4)', '0 0 22px rgba(251,191,36,0.80)', '0 0 10px rgba(251,191,36,0.4)'] }} transition={{ duration: 2.5, repeat: Infinity }}
                    style={{ position: 'relative', zIndex: 1, width: 52, height: 52, borderRadius: '50%', background: 'radial-gradient(circle at 35% 28%,rgba(255,255,255,0.42) 0%,rgba(251,191,36,0.58) 42%,rgba(180,83,9,0.92) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', border: '2.5px solid #050216', margin: 2 }}>✦</motion.div>
                {unread > 0 && <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.4, repeat: Infinity }} style={{ position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderRadius: '50%', background: '#f97316', border: '2px solid #050216', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.40rem', color: '#fff', fontWeight: 800, zIndex: 2 }}>{unread}</motion.div>}
                <motion.div animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ position: 'absolute', bottom: 3, right: 3, width: 11, height: 11, borderRadius: '50%', background: '#4ade80', border: '2px solid #050216', boxShadow: '0 0 6px rgba(74,222,128,0.85)', zIndex: 2 }} />
            </div>
            <span style={{ fontSize: '0.48rem', color: active ? '#fde68a' : 'rgba(255,255,255,0.55)', fontFamily: "'Outfit',sans-serif", fontWeight: active ? 800 : 500, letterSpacing: '0.03em' }}>Bodhi ✦</span>
        </motion.div>
    );
}

// Snapchat-style story ring for circle friends
function CircleAvatar({ u, active, onClick }: { u: SutraUser; active: boolean; onClick: () => void }) {
    const color = getAvatarColor(u.uid);
    const initials = getInitials(u.name);
    return (
        <motion.div whileTap={{ scale: 0.90 }} onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, width: 58, cursor: 'pointer' }}>
            <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', inset: -2, borderRadius: '50%', background: active ? `conic-gradient(${color},#c4b5fd,${color})` : `conic-gradient(${color}88,${color}33,${color}88)`, opacity: active ? 1 : 0.7 }} />
                <div style={{ position: 'relative', zIndex: 1, width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', border: '2.5px solid #050216', margin: 2, background: u.photoURL ? undefined : `radial-gradient(circle at 35% 28%,rgba(255,255,255,0.22) 0%,${color}70 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', fontWeight: 700, color: '#fff', boxShadow: active ? `0 0 14px ${color}55` : 'none' }}>
                    {u.photoURL ? <img src={u.photoURL} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
                </div>
                {u.online && <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2.2, repeat: Infinity }} style={{ position: 'absolute', bottom: 3, right: 3, width: 10, height: 10, borderRadius: '50%', background: '#4ade80', border: '2px solid #050216', boxShadow: '0 0 5px rgba(74,222,128,0.75)', zIndex: 2 }} />}
            </div>
            <span style={{ fontSize: '0.48rem', color: active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.50)', fontFamily: "'Outfit',sans-serif", fontWeight: active ? 700 : 400, maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>{u.name.split(' ')[0]}</span>
        </motion.div>
    );
}

// Ultra Snapchat-style seeker card
type SeekerStatus = 'none' | 'sent' | 'received' | 'friends';
function SeekerCard({ u, status, isNature, onAdd, onAccept, onDecline, onChat }: {
    u: SutraUser; status: SeekerStatus; isNature: boolean;
    onAdd: () => void; onAccept: () => void; onDecline: () => void; onChat: () => void;
}) {
    const color = getAvatarColor(u.uid);
    const initials = getInitials(u.name);
    const [localSent, setLocalSent] = React.useState(false);
    const isSent = status === 'sent' || localSent;

    const ringColor = status === 'received' ? '#fb923c' : status === 'friends' ? color : 'rgba(255,255,255,0.18)';
    const cardBg = status === 'received'
        ? 'rgba(251,146,60,0.06)'
        : status === 'friends'
            ? `${color}09`
            : isNature ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.03)';
    const cardBorder = status === 'received'
        ? '1px solid rgba(251,146,60,0.18)'
        : status === 'friends'
            ? `1px solid ${color}22`
            : '1px solid rgba(255,255,255,0.07)';

    const snapPill: React.CSSProperties = {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 4, borderRadius: 999, cursor: 'pointer',
        fontFamily: "'Outfit',sans-serif", fontWeight: 700,
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        border: 'none', whiteSpace: 'nowrap', flexShrink: 0,
    };

    return (
        <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -24 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.7rem 1rem 0.7rem 0.85rem', margin: '0 0.4rem 0.3rem', borderRadius: 18, background: cardBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: cardBorder, cursor: status === 'friends' ? 'pointer' : 'default', transition: 'all 0.2s' }}
            onClick={status === 'friends' ? onChat : undefined}>

            {/* Avatar with ring */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
                {status === 'received' && (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                        style={{ position: 'absolute', inset: -2.5, borderRadius: '50%', background: 'conic-gradient(#fb923c,#fbbf24,#fb923c)', opacity: 0.85 }} />
                )}
                {status === 'friends' && (
                    <div style={{ position: 'absolute', inset: -2, borderRadius: '50%', background: `conic-gradient(${color},${color}55,${color})`, opacity: 0.7 }} />
                )}
                <div style={{ position: 'relative', zIndex: 1, width: 48, height: 48, borderRadius: '50%', background: u.photoURL ? undefined : `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.30) 0%, ${color}80 100%)`, border: `2.5px solid #050216`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.90rem', fontWeight: 800, color: '#fff', overflow: 'hidden', margin: status === 'received' || status === 'friends' ? 2.5 : 0, boxShadow: `0 3px 16px ${color}30` }}>
                    {u.photoURL ? <img src={u.photoURL} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
                </div>
                {u.online && <motion.div animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.8, repeat: Infinity }} style={{ position: 'absolute', bottom: status === 'received' || status === 'friends' ? 4 : 1, right: status === 'received' || status === 'friends' ? 4 : 1, width: 11, height: 11, borderRadius: '50%', background: '#4ade80', border: '2px solid #050216', boxShadow: '0 0 7px rgba(74,222,128,0.85)', zIndex: 2 }} />}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                    <span style={{ fontSize: '0.83rem', fontWeight: 700, color: 'rgba(255,255,255,0.92)', fontFamily: "'Outfit',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{u.name}</span>
                    {status === 'received' && (
                        <motion.span animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.8, repeat: Infinity }}
                            style={{ padding: '1px 6px', borderRadius: 99, background: 'rgba(251,146,60,0.20)', border: '1px solid rgba(251,146,60,0.45)', fontSize: '0.37rem', fontWeight: 800, color: '#fb923c', letterSpacing: '0.12em', textTransform: 'uppercase', flexShrink: 0 }}>NEW</motion.span>
                    )}
                    {status === 'friends' && (
                        <span style={{ padding: '1px 6px', borderRadius: 99, background: `${color}18`, border: `1px solid ${color}38`, fontSize: '0.37rem', fontWeight: 800, color: color, letterSpacing: '0.10em', textTransform: 'uppercase', flexShrink: 0 }}>CIRCLE</span>
                    )}
                </div>
                <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit',sans-serif", display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.bio ? u.bio : 'OneSuTra Seeker'}
                </span>
                <span style={{ fontSize: '0.50rem', color: u.online ? '#4ade80' : 'rgba(255,255,255,0.22)', fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
                    {status === 'received' ? '🙏 Say Namaste!' : u.online ? '● ONLINE' : status === 'friends' ? 'TAP TO CHAT' : 'RECENTLY JOINED'}
                </span>
            </div>

            {/* Snapchat-style action pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                {status === 'friends' && (
                    <>
                        <motion.button whileTap={{ scale: 0.84 }} onClick={e => { e.stopPropagation(); onChat(); }}
                            style={{ ...snapPill, width: 38, height: 38, background: 'rgba(167,139,250,0.18)', border: '1.5px solid rgba(167,139,250,0.40)', color: '#a78bfa', fontSize: '1rem', boxShadow: '0 2px 12px rgba(167,139,250,0.22)' }}>💬</motion.button>
                        <motion.button whileTap={{ scale: 0.84 }} onClick={e => { e.stopPropagation(); onChat(); }}
                            style={{ ...snapPill, width: 38, height: 38, background: 'rgba(251,191,36,0.16)', border: '1.5px solid rgba(251,191,36,0.38)', color: '#fbbf24', fontSize: '1rem', boxShadow: '0 2px 12px rgba(251,191,36,0.18)' }}>📸</motion.button>
                    </>
                )}
                {status === 'none' && !isSent && (
                    <>
                        <motion.button whileTap={{ scale: 0.84 }} onClick={e => { e.stopPropagation(); setLocalSent(true); onAdd(); }}
                            style={{ ...snapPill, padding: '0.42rem 0.78rem', background: 'linear-gradient(135deg,rgba(251,191,36,0.26),rgba(217,119,6,0.20))', border: '1.5px solid rgba(251,191,36,0.50)', color: '#fbbf24', fontSize: '0.62rem', boxShadow: '0 2px 14px rgba(251,191,36,0.20)' }}>
                            <span style={{ fontSize: '0.75rem' }}>✦</span> Add
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.82 }} onClick={e => e.stopPropagation()}
                            style={{ ...snapPill, width: 30, height: 30, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.38)', fontSize: '0.75rem' }}>×</motion.button>
                    </>
                )}
                {isSent && (
                    <span style={{ ...snapPill, padding: '0.40rem 0.80rem', background: 'rgba(74,222,128,0.09)', border: '1.5px solid rgba(74,222,128,0.28)', color: 'rgba(74,222,128,0.72)', fontSize: '0.60rem' }}>
                        ✓ Sent
                    </span>
                )}
                {status === 'received' && (
                    <>
                        <motion.button whileTap={{ scale: 0.84 }} onClick={e => { e.stopPropagation(); onAccept(); }}
                            style={{ ...snapPill, padding: '0.42rem 0.78rem', background: 'linear-gradient(135deg,rgba(74,222,128,0.24),rgba(52,211,153,0.18))', border: '1.5px solid rgba(74,222,128,0.50)', color: '#4ade80', fontSize: '0.62rem', boxShadow: '0 2px 12px rgba(74,222,128,0.22)' }}>
                            <Check size={11} /> Accept
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.82 }} onClick={e => { e.stopPropagation(); onDecline(); }}
                            style={{ ...snapPill, width: 30, height: 30, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.32)', color: '#f87171', fontSize: '0.8rem' }}>×</motion.button>
                    </>
                )}
            </div>
        </motion.div>
    );
}

function MsgBubble({ msg, isNature }: { msg: ChatMsg; isNature: boolean }) {
    const isMe = msg.role === 'me';
    const isBodhi = msg.role === 'bodhi';
    return (
        <motion.div initial={{ opacity: 0, y: 12, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 350, damping: 26 }}
            style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: '0.55rem', padding: '0 0.2rem' }}>
            {!isMe && (
                <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, marginRight: 6, marginTop: 2, background: isBodhi ? 'radial-gradient(circle at 35% 30%,rgba(251,191,36,0.45) 0%,rgba(129,140,248,0.30) 60%,transparent 100%)' : 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem' }}>
                    {isBodhi ? '✦' : ''}
                </div>
            )}
            <div style={{ maxWidth: '76%' }}>
                <div style={{
                    background: isMe
                        ? 'radial-gradient(ellipse at 30% 20%,rgba(255,255,255,0.16) 0%,rgba(251,191,36,0.10) 50%,transparent 100%)'
                        : isNature ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(22px) saturate(180%)', WebkitBackdropFilter: 'blur(22px) saturate(180%)',
                    border: isMe ? '1px solid rgba(251,191,36,0.22)' : isBodhi ? '1px solid rgba(251,191,36,0.16)' : '1px solid rgba(255,255,255,0.10)',
                    borderRadius: isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                    padding: '0.62rem 0.82rem',
                    boxShadow: isMe ? 'inset 0 1.5px 0 rgba(255,255,255,0.18),0 4px 16px rgba(0,0,0,0.18)' : 'inset 0 1px 0 rgba(255,255,255,0.12),0 2px 12px rgba(0,0,0,0.12)',
                    position: 'relative', overflow: 'hidden',
                }}>
                    <div aria-hidden style={{ position: 'absolute', top: '4%', left: '6%', width: '48%', height: '26%', background: 'radial-gradient(ellipse,rgba(255,255,255,0.24) 0%,transparent 80%)', borderRadius: '50%', transform: 'rotate(-16deg)', filter: 'blur(2px)', pointerEvents: 'none' }} />
                    <p style={{ margin: 0, fontSize: '0.83rem', lineHeight: 1.58, color: isMe ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.86)', fontFamily: "'Outfit',sans-serif", fontWeight: 400, position: 'relative', zIndex: 1, whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                </div>
                <span style={{ display: 'block', fontSize: '0.40rem', color: 'rgba(255,255,255,0.30)', marginTop: 3, textAlign: isMe ? 'right' : 'left', fontFamily: 'monospace' }}>{fmtTime(msg.ts)}</span>
            </div>
        </motion.div>
    );
}

function TypingDots() {
    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '0.5rem', padding: '0 0.2rem' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, marginRight: 6, marginTop: 2, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem' }}>✦</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(129,140,248,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(129,140,248,0.18)', borderRadius: '4px 16px 16px 16px', padding: '0.55rem 0.9rem' }}>
                {[0, 0.18, 0.36].map((d, i) => <motion.div key={i} animate={{ y: [0, -5, 0] }} transition={{ duration: 0.7, repeat: Infinity, delay: d }} style={{ width: 5, height: 5, borderRadius: '50%', background: '#818cf8' }} />)}
            </div>
        </motion.div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PranverseChatHub() {
    const router = useRouter();
    const { user } = useOneSutraAuth();
    const { lang } = useLanguage();
    const { tasks, addTask, removeTask } = useDailyTasks();

    const [isNature, setIsNature] = useState(false);
    const [bgUrl, setBgUrl] = useState('');
    const [tod] = useState<TimeOfDay>(getTimeOfDay);
    const [friendDocs, setFriendDocs] = useState<FriendDoc[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [bodhiMsgs, setBodhiMsgs] = useState<ChatMsg[]>([]);
    const [input, setInput] = useState('');
    const [isFocus, setIsFocus] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [uid, setUid] = useState<string | null>(null);
    const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
    const [isMobile, setIsMobile] = useState(false);
    // Energy Circles state — loaded from Firebase, no dummy data
    const [energyCircles, setEnergyCircles] = useState<EnergyCircle[]>([]);
    const [showCreateCircle, setShowCreateCircle] = useState(false);
    const [newCircleName, setNewCircleName] = useState('');
    const [newCircleDesc, setNewCircleDesc] = useState('');
    const [newCircleTheme, setNewCircleTheme] = useState(CIRCLE_THEMES[0]);
    const [creatingCircle, setCreatingCircle] = useState(false);
    // Story/Status creation state
    const [showAddStory, setShowAddStory] = useState(false);
    const [storyActivity, setStoryActivity] = useState(PRANA_ACTIVITIES[0]);
    const [storyCaption, setStoryCaption] = useState('');
    const [postingStory, setPostingStory] = useState(false);
    const [storyPosted, setStoryPosted] = useState(false);
    // Invite feature state
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteLinkCopied, setInviteLinkCopied] = useState(false);

    // ── Real users from Firebase ──────────────────────────────────────────────
    const { users: allUsers } = useUsers(uid);
    // chatId for the currently active friend (null for Bodhi or no selection)
    const activeChatId = useMemo(() => uid && activeId && activeId !== 'bodhi' ? getChatId(uid, activeId) : null, [uid, activeId]);
    const { messages: realMsgs, sendMessage: sendRealMsg } = useMessages(activeChatId, uid);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const recogRef = useRef<any>(null);
    const connectCalledRef = useRef(false);
    const prevActiveIdRef = useRef<string | null>(null);
    const bodhiUnread = bodhiMsgs.filter(m => m.role === 'bodhi').length > 0 && activeId !== 'bodhi' ? 1 : 0;

    const displayName = user?.name || 'Mitra';
    const activeFriend = allUsers.find(u => u.uid === activeId) || null;

    // ── Derived friend lists ──────────────────────────────────────────────────
    const acceptedFriendIds = useMemo(() => new Set(
        friendDocs.filter(f => f.status === 'accepted').map(f => f.fromUid === uid ? f.toUid : f.fromUid)
    ), [friendDocs, uid]);
    const acceptedFriends = useMemo(() => allUsers.filter(u => acceptedFriendIds.has(u.uid)), [allUsers, acceptedFriendIds]);
    const pendingRequests = useMemo(() => friendDocs
        .filter(f => f.toUid === uid && f.status === 'pending')
        .map(f => ({ doc: f, user: allUsers.find(u => u.uid === f.fromUid) }))
        .filter((x): x is { doc: FriendDoc; user: SutraUser } => x.user != null),
        [friendDocs, uid, allUsers]);
    const sentRequestUids = useMemo(() => new Set(
        friendDocs.filter(f => f.fromUid === uid && f.status === 'pending').map(f => f.toUid)
    ), [friendDocs, uid]);

    // responsive
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // bg url on nature mode
    useEffect(() => {
        if (isNature) {
            const pool = NATURE_BG[tod];
            setBgUrl(pool[Math.floor(Math.random() * pool.length)]);
        }
    }, [isNature, tod]);

    // get uid
    useEffect(() => {
        import('@/lib/firebase').then(({ getFirebaseAuth }) =>
            getFirebaseAuth().then(auth => {
                import('firebase/auth').then(({ onAuthStateChanged }) =>
                    onAuthStateChanged(auth, u => { if (u) setUid(u.uid); })
                );
            })
        ).catch(() => { });
    }, []);

    // Firebase friendDocs subscription
    useEffect(() => {
        if (!uid) return;
        let u1: (() => void) | null = null, u2: (() => void) | null = null;
        const fromMap = new Map<string, FriendDoc>(), toMap = new Map<string, FriendDoc>();
        const merge = () => setFriendDocs([...fromMap.values(), ...toMap.values()]);
        (async () => {
            try {
                const { getFirebaseFirestore } = await import('@/lib/firebase');
                const { collection, query, where, onSnapshot } = await import('firebase/firestore');
                const db = await getFirebaseFirestore();
                u1 = onSnapshot(query(collection(db, 'resonance_friends'), where('fromUid', '==', uid)), snap => {
                    fromMap.clear(); snap.docs.forEach(d => fromMap.set(d.id, { id: d.id, ...(d.data() as Omit<FriendDoc, 'id'>) })); merge();
                });
                u2 = onSnapshot(query(collection(db, 'resonance_friends'), where('toUid', '==', uid)), snap => {
                    toMap.clear(); snap.docs.forEach(d => toMap.set(d.id, { id: d.id, ...(d.data() as Omit<FriendDoc, 'id'>) })); merge();
                });
            } catch { /* offline */ }
        })();
        return () => { u1?.(); u2?.(); };
    }, [uid]);

    const acceptRequest = useCallback(async (docId: string) => {
        try {
            const { getFirebaseFirestore } = await import('@/lib/firebase');
            const { doc, updateDoc } = await import('firebase/firestore');
            const db = await getFirebaseFirestore();
            await updateDoc(doc(db, 'resonance_friends', docId), { status: 'accepted' });
        } catch { /* offline */ }
    }, []);

    const declineRequest = useCallback(async (docId: string) => {
        try {
            const { getFirebaseFirestore } = await import('@/lib/firebase');
            const { doc, deleteDoc } = await import('firebase/firestore');
            const db = await getFirebaseFirestore();
            await deleteDoc(doc(db, 'resonance_friends', docId));
        } catch { /* offline */ }
    }, []);

    const sendFriendRequest = useCallback(async (toUid: string, toName: string) => {
        if (!uid) return;
        try {
            const { getFirebaseFirestore } = await import('@/lib/firebase');
            const { collection, addDoc } = await import('firebase/firestore');
            const db = await getFirebaseFirestore();
            await addDoc(collection(db, 'resonance_friends'), {
                fromUid: uid, toUid, fromName: displayName, toName,
                status: 'pending', createdAt: Date.now(),
            });
        } catch { /* offline */ }
    }, [uid, displayName]);

    // Load energy circles from Firebase
    useEffect(() => {
        (async () => {
            try {
                const { getFirebaseFirestore } = await import('@/lib/firebase');
                const { collection, getDocs, orderBy, query } = await import('firebase/firestore');
                const db = await getFirebaseFirestore();
                const snap = await getDocs(query(collection(db, 'energy_circles'), orderBy('createdAt', 'desc')));
                if (!snap.empty) {
                    setEnergyCircles(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<EnergyCircle, 'id'>) })));
                }
            } catch { /* offline */ }
        })();
    }, []);

    // Bodhi proactive greeting
    useEffect(() => {
        setBodhiMsgs(buildBodhiGreeting());
    }, []);

    // Bodhi voice hook
    const { chatState, isSpeaking, isConnected, connect, disconnect, sendMessage: bodhiSend } = useBodhiChatVoice({
        userName: displayName,
        preferredLanguage: lang,
        pendingTasks: tasks.map(t => ({ id: t.id, text: t.text, done: t.done, category: t.category, startTime: t.startTime })),
        userId: uid,
        onAddTask: async (task) => { await addTask(task as unknown as Parameters<typeof addTask>[0]); },
        onRemoveTask: async (taskId) => { await removeTask(taskId); },
        onMessage: (text) => {
            setBodhiMsgs(prev => [...prev, { id: `b_${Date.now()}`, role: 'bodhi', text, ts: Date.now() }]);
        },
    });

    const isBodhiThinking = chatState === 'thinking' || chatState === 'connecting';

    // Connect Bodhi when selected
    useEffect(() => {
        if (activeId === 'bodhi' && !connectCalledRef.current) {
            connectCalledRef.current = true;
            connect();
        }
        if (activeId !== 'bodhi') {
            connectCalledRef.current = false;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeId]);

    // Disconnect on unmount
    useEffect(() => () => { disconnect(); }, [disconnect]);

    // Instant scroll when switching chats (no visible scroll animation)
    useEffect(() => {
        if (activeId !== prevActiveIdRef.current) {
            prevActiveIdRef.current = activeId;
            chatEndRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
        }
    }, [activeId]);

    // Smooth scroll only for new incoming messages
    useEffect(() => {
        if (!activeId) return;
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [bodhiMsgs, realMsgs, isBodhiThinking]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSelect = useCallback((id: string) => {
        setActiveId(id);
        if (isMobile) setMobileView('chat');
        // clear unread
        if (id !== 'bodhi') {
            // mark as read (would be real in prod)
        }
    }, [isMobile]);

    const handleSend = useCallback(() => {
        const txt = input.trim();
        if (!txt) return;
        setInput('');
        if (activeId === 'bodhi') {
            setBodhiMsgs(prev => [...prev, { id: `u_${Date.now()}`, role: 'me', text: txt, ts: Date.now() }]);
            bodhiSend(txt);
        } else if (activeId) {
            sendRealMsg(txt, displayName);
        }
    }, [input, activeId, bodhiSend, sendRealMsg, displayName]);

    const startVoice = useCallback(() => {
        if (typeof window === 'undefined') return;
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) return;
        const rec = new SR();
        rec.continuous = false; rec.interimResults = true; rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
        rec.onresult = (e: any) => {
            const t = Array.from(e.results as any[]).map((r: any) => r[0].transcript).join('');
            setInput(t);
            if (e.results[e.results.length - 1].isFinal) {
                setIsListening(false);
                setTimeout(() => {
                    setInput('');
                    if (activeId === 'bodhi') { setBodhiMsgs(p => [...p, { id: `u_${Date.now()}`, role: 'me', text: t, ts: Date.now() }]); bodhiSend(t); }
                    else if (activeId) { sendRealMsg(t, displayName); }
                }, 200);
            }
        };
        rec.onerror = () => setIsListening(false); rec.onend = () => setIsListening(false);
        rec.start(); recogRef.current = rec; setIsListening(true);
    }, [lang, activeId, bodhiSend, sendRealMsg, displayName]);

    const stopVoice = useCallback(() => { recogRef.current?.stop(); setIsListening(false); }, []);

    // Ultra-transparent in nature mode — nature bleeds through completely
    const panelGlass: React.CSSProperties = isNature
        ? { background: 'rgba(0,0,0,0.04)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)', border: '1px solid rgba(255,255,255,0.06)' }
        : { background: 'rgba(6,3,18,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.07)' };

    // Map real Firestore messages to ChatMsg for display
    const currentMsgs: ChatMsg[] = activeId === 'bodhi'
        ? bodhiMsgs
        : realMsgs.map(m => ({ id: m.id, role: m.senderId === uid ? 'me' as const : 'them' as const, text: m.text, ts: m.createdAt }));
    const showThinking = activeId === 'bodhi' && isBodhiThinking;

    const [showEmoji, setShowEmoji] = useState(false);
    const [seekerSearch, setSeekerSearch] = React.useState('');
    const filteredUsers = useMemo(() => {
        const q = seekerSearch.trim().toLowerCase();
        return q ? allUsers.filter(u => u.name.toLowerCase().includes(q)) : allUsers;
    }, [allUsers, seekerSearch]);

    // ── LEFT PANEL — single-scroll, Snapchat-style ────────────────────────────
    const leftPanel = (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* ── Sticky Header (never scrolls) ── */}
            <div style={{
                flexShrink: 0,
                padding: 'max(44px,calc(env(safe-area-inset-top) + 10px)) 1rem 0.65rem',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                background: isNature ? 'rgba(0,0,0,0.16)' : 'rgba(6,3,18,0.97)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.55rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.push('/pranaverse')} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}><ArrowLeft size={14} /></motion.button>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, fontFamily: "'Outfit',sans-serif", background: 'linear-gradient(120deg,#c4b5fd 0%,#a78bfa 50%,#818cf8 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>PranaVerse Chat</p>
                            <p style={{ margin: 0, fontSize: '0.46rem', color: 'rgba(167,139,250,0.45)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace' }}>✦ Energy Community</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(74,222,128,0.14)', border: '1px solid rgba(74,222,128,0.32)', borderRadius: 999, padding: '0.25rem 0.65rem' }}>
                            <motion.div animate={{ scale: [1, 1.45, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.4, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px rgba(74,222,128,0.95)' }} />
                            <span style={{ fontSize: '0.50rem', color: '#4ade80', fontWeight: 800, letterSpacing: '0.04em' }}>{allUsers.filter(u => u.online).length + 1} live</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: isNature ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)', border: `1px solid ${isNature ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.09)'}`, borderRadius: 999, padding: '0.30rem 0.70rem', cursor: 'pointer', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }} onClick={() => setIsNature(n => !n)}>
                            <AnimatePresence mode="wait">
                                <motion.span key={isNature ? 'n' : 'd'} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.18 }}>
                                    {isNature ? <Leaf size={11} color="#4ade80" /> : <Moon size={11} color="#818cf8" />}
                                </motion.span>
                            </AnimatePresence>
                            <span style={{ fontSize: '0.50rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: isNature ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.48)' }}>{isNature ? 'Nature' : 'Dark'}</span>
                        </div>
                    </div>
                </div>
                {/* Search bar */}
                <div style={{ position: 'relative' }}>
                    <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.32)' }} />
                    <input value={seekerSearch} onChange={e => setSeekerSearch(e.target.value)} placeholder="Search Resonating people and make friends & community" style={{ width: '100%', boxSizing: 'border-box', background: isNature ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 999, padding: '0.42rem 0.75rem 0.42rem 2rem', color: 'rgba(255,255,255,0.80)', fontSize: '0.75rem', outline: 'none', fontFamily: "'Outfit',sans-serif" }} />
                </div>
            </div>

            {/* ── SINGLE SCROLL REGION — everything below header ── */}
            <div className="singlescroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none' }}>

                {/* Story circles strip — horizontal only, does NOT create a vertical scroll */}
                <div style={{ padding: '0.7rem 1rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2.4, repeat: Infinity }} style={{ width: 5, height: 5, borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 5px rgba(251,191,36,0.8)' }} />
                            <span style={{ fontSize: '0.44rem', fontWeight: 800, color: 'rgba(255,255,255,0.40)', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'monospace' }}>⚡ Energy Circle</span>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                            <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowAddStory(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '0.2rem 0.5rem', borderRadius: 99, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.28)', cursor: 'pointer', color: '#fbbf24', fontSize: '0.42rem', fontWeight: 700 }}>
                                <Camera size={9} /> Story
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowCreateCircle(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '0.2rem 0.5rem', borderRadius: 99, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.28)', cursor: 'pointer', color: '#a78bfa', fontSize: '0.42rem', fontWeight: 700 }}>
                                <Plus size={9} /> Circle
                            </motion.button>
                        </div>
                    </div>
                    {/* Horizontal-only story circles — won't cause vertical scroll */}
                    <div className="circlebar" style={{ display: 'flex', gap: '0.65rem', overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                        <motion.div whileTap={{ scale: 0.90 }} onClick={() => setShowAddStory(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, width: 58, cursor: 'pointer' }}>
                            <div style={{ position: 'relative' }}>
                                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1.5px dashed rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', margin: 2 }}>+</div>
                            </div>
                            <span style={{ fontSize: '0.44rem', color: 'rgba(255,255,255,0.38)', fontFamily: "'Outfit',sans-serif", textAlign: 'center' }}>My Story</span>
                        </motion.div>
                        <BodhiCircle active={activeId === 'bodhi'} unread={bodhiUnread} onClick={() => handleSelect('bodhi')} />
                        {acceptedFriends.map(u => (
                            <CircleAvatar key={u.uid} u={u} active={activeId === u.uid} onClick={() => handleSelect(u.uid)} />
                        ))}
                    </div>
                </div>

                {/* ── BODHI card — always first in the list ── */}
                <div style={{ padding: '0.5rem 0.75rem 0' }}>
                    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 340, damping: 26 }}
                        onClick={() => handleSelect('bodhi')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.6rem 0.85rem', marginBottom: '0.22rem', borderRadius: 16, background: activeId === 'bodhi' ? 'rgba(251,191,36,0.10)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeId === 'bodhi' ? 'rgba(251,191,36,0.30)' : 'rgba(255,255,255,0.07)'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'radial-gradient(circle at 35% 28%,rgba(255,255,255,0.38) 0%,rgba(251,191,36,0.50) 42%,rgba(217,119,6,0.85) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', border: '1.5px solid rgba(251,191,36,0.40)', flexShrink: 0 }}>✦</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.92)', fontFamily: "'Outfit',sans-serif", display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Sakha Bodhi</span>
                            <span style={{ fontSize: '0.54rem', color: 'rgba(251,191,36,0.60)', fontFamily: "'Outfit',sans-serif" }}>Your AI Sakha · Always here to enhance your life</span>
                        </div>
                        <motion.button whileTap={{ scale: 0.88 }} onClick={e => { e.stopPropagation(); handleSelect('bodhi'); }}
                            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '0.28rem 0.62rem', borderRadius: 999, background: 'rgba(251,191,36,0.14)', border: '1px solid rgba(251,191,36,0.38)', cursor: 'pointer', color: '#fbbf24', fontSize: '0.58rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            💬 Chat
                        </motion.button>
                    </motion.div>

                    {/* ── Accepted friends — inline, no sub-scroll ── */}
                    <AnimatePresence>
                        {acceptedFriends.map(u => {
                            const c = getAvatarColor(u.uid);
                            const ini = getInitials(u.name);
                            return (
                                <motion.div key={u.uid} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ type: 'spring', stiffness: 340, damping: 26 }}
                                    onClick={() => handleSelect(u.uid)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.6rem 0.85rem', marginBottom: '0.22rem', borderRadius: 16, background: activeId === u.uid ? `${c}12` : 'rgba(255,255,255,0.03)', border: `1px solid ${activeId === u.uid ? `${c}30` : 'rgba(255,255,255,0.07)'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                                    <div style={{ position: 'relative', flexShrink: 0 }}>
                                        <div style={{ width: 42, height: 42, borderRadius: '50%', background: u.photoURL ? undefined : `radial-gradient(circle at 35% 28%,rgba(255,255,255,0.22) 0%,${c}60 100%)`, border: `1.5px solid ${c}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.80rem', fontWeight: 700, color: '#fff', overflow: 'hidden' }}>
                                            {u.photoURL ? <img src={u.photoURL} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ini}
                                        </div>
                                        {u.online && <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }} style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: '#4ade80', border: '1.5px solid rgba(5,2,22,0.8)', boxShadow: '0 0 5px rgba(74,222,128,0.7)' }} />}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.90)', fontFamily: "'Outfit',sans-serif", display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
                                        <span style={{ fontSize: '0.54rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit',sans-serif" }}>OneSUTRA member{u.online ? <span style={{ color: '#4ade80' }}> · online</span> : ''}</span>
                                    </div>
                                    <motion.button whileTap={{ scale: 0.88 }} onClick={e => { e.stopPropagation(); handleSelect(u.uid); }}
                                        style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '0.28rem 0.62rem', borderRadius: 999, background: `${c}18`, border: `1px solid ${c}40`, cursor: 'pointer', color: c, fontSize: '0.58rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                        💬 Chat
                                    </motion.button>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* ── Live community activity banner ── */}
                <div style={{ margin: '0.5rem 0.75rem 0', borderRadius: 14, background: 'linear-gradient(135deg, rgba(167,139,250,0.10) 0%, rgba(99,102,241,0.06) 100%)', border: '1px solid rgba(167,139,250,0.20)', padding: '0.55rem 0.9rem', display: 'flex', alignItems: 'center', gap: 9, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}>
                    <div style={{ display: 'flex', flexShrink: 0 }}>
                        {AVATAR_COLORS.slice(0, 4).map((ac, i) => (
                            <div key={i} style={{ width: 22, height: 22, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.3) 0%, ${ac}99 100%)`, border: '1.5px solid rgba(5,2,22,0.9)', marginLeft: i === 0 ? 0 : -8, position: 'relative', zIndex: 4 - i, flexShrink: 0 }} />
                        ))}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.58rem', color: 'rgba(196,181,253,0.95)', fontFamily: "'Outfit',sans-serif", fontWeight: 700 }}>
                            {allUsers.filter(u => u.online).length + Math.max(allUsers.length, 12)}+ seekers in the verse
                        </div>
                        <div style={{ fontSize: '0.38rem', color: 'rgba(167,139,250,0.50)', fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 1 }}>Prana Community · Live</div>
                    </div>
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.6, repeat: Infinity }} style={{ width: 7, height: 7, borderRadius: '50%', background: '#a78bfa', boxShadow: '0 0 8px rgba(167,139,250,0.9)', flexShrink: 0 }} />
                </div>

                {/* ── Invite your Sangha banner ── */}
                <motion.div whileTap={{ scale: 0.96 }} onClick={() => setShowInviteModal(true)}
                    style={{ margin: '0.5rem 0.75rem 0', borderRadius: 18, background: 'linear-gradient(135deg,rgba(251,191,36,0.18) 0%,rgba(232,121,249,0.12) 50%,rgba(99,102,241,0.14) 100%)', border: '1px solid rgba(251,191,36,0.32)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 24px rgba(251,191,36,0.10), inset 0 1px 0 rgba(255,255,255,0.10)' }}>
                    <motion.div animate={{ opacity: [0.3,0.7,0.3], scale: [1,1.4,1] }} transition={{ duration: 3, repeat: Infinity }} style={{ position: 'absolute', top: -18, right: -18, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle,rgba(251,191,36,0.22) 0%,transparent 70%)', pointerEvents: 'none' }} />
                    <motion.div animate={{ rotate: [0,15,0,-15,0] }} transition={{ duration: 4, repeat: Infinity }} style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg,rgba(251,191,36,0.25),rgba(217,119,6,0.18))', border: '1.5px solid rgba(251,191,36,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem', flexShrink: 0, boxShadow: '0 0 12px rgba(251,191,36,0.30)' }}>🙏</motion.div>
                    <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fde68a', fontFamily: "'Outfit',sans-serif", display: 'block', letterSpacing: '0.01em' }}>Invite your Sangha ✦</span>
                        <span style={{ fontSize: '0.50rem', color: 'rgba(251,191,36,0.60)', fontFamily: "'Outfit',sans-serif" }}>Send a sacred link to your circle</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.30rem 0.65rem', borderRadius: 999, background: 'linear-gradient(135deg,rgba(251,191,36,0.22),rgba(217,119,6,0.16))', border: '1px solid rgba(251,191,36,0.42)', color: '#fbbf24', fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                        🔗 Invite
                    </div>
                </motion.div>

                {/* ── ADDED ME section (pending requests) ── */}
                {pendingRequests.length > 0 && (
                    <div style={{ marginTop: '0.9rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 1.1rem 0.4rem' }}>
                            <span style={{ fontSize: '0.70rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)', fontFamily: "'Outfit',sans-serif" }}>Added Me</span>
                            <motion.span animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 1.6, repeat: Infinity }}
                                style={{ padding: '2px 8px', borderRadius: 99, background: 'linear-gradient(135deg,#fb923c,#f97316)', fontSize: '0.50rem', fontWeight: 800, color: '#fff', boxShadow: '0 2px 8px rgba(249,115,22,0.45)' }}>
                                {pendingRequests.length} New
                            </motion.span>
                        </div>
                        <AnimatePresence>
                            {pendingRequests.map(({ doc: fd, user: pu }) => (
                                <SeekerCard key={pu.uid} u={pu} status="received" isNature={isNature}
                                    onAdd={() => sendFriendRequest(pu.uid, pu.name)}
                                    onAccept={() => acceptRequest(fd.id)}
                                    onDecline={() => declineRequest(fd.id)}
                                    onChat={() => handleSelect(pu.uid)}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* ── FIND SEEKERS section — all in main scroll ── */}
                <div style={{ marginTop: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.1rem 0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{ fontSize: '0.70rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)', fontFamily: "'Outfit',sans-serif" }}>Find Seekers</span>
                            {filteredUsers.filter(u => !acceptedFriendIds.has(u.uid) && !pendingRequests.find(r => r.user.uid === u.uid)).length > 0 && (
                                <span style={{ padding: '2px 7px', borderRadius: 99, background: 'rgba(167,139,250,0.20)', border: '1px solid rgba(167,139,250,0.38)', fontSize: '0.48rem', fontWeight: 800, color: '#c4b5fd' }}>
                                    {filteredUsers.filter(u => !acceptedFriendIds.has(u.uid) && !pendingRequests.find(r => r.user.uid === u.uid)).length} New
                                </span>
                            )}
                        </div>
                        <span style={{ fontSize: '0.54rem', color: 'rgba(167,139,250,0.55)', fontFamily: "'Outfit',sans-serif", fontWeight: 600, cursor: 'pointer' }}>All Members ›</span>
                    </div>

                    <AnimatePresence>
                        {filteredUsers.map(u => {
                            if (pendingRequests.find(r => r.user.uid === u.uid)) return null;
                            let status: SeekerStatus = 'none';
                            if (acceptedFriendIds.has(u.uid)) status = 'friends';
                            else if (sentRequestUids.has(u.uid)) status = 'sent';
                            const pr = pendingRequests.find(r => r.user.uid === u.uid);
                            return (
                                <SeekerCard key={u.uid} u={u} status={status} isNature={isNature}
                                    onAdd={() => sendFriendRequest(u.uid, u.name)}
                                    onAccept={() => pr && acceptRequest(pr.doc.id)}
                                    onDecline={() => pr && declineRequest(pr.doc.id)}
                                    onChat={() => handleSelect(u.uid)}
                                />
                            );
                        })}
                    </AnimatePresence>

                    {filteredUsers.length === 0 && (
                        <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                            <motion.div animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 2.5, repeat: Infinity }} style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>🔍</motion.div>
                            <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', fontFamily: "'Outfit',sans-serif", margin: 0 }}>No seekers found in the verse</p>
                        </div>
                    )}
                </div>

                <div style={{ height: '1.5rem' }} />
            </div>
        </div>
    );


// ── RIGHT PANEL ───────────────────────────────────────────────────────────
const rightPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {activeId ? (
            <>
                {/* Chat Header */}
                <div style={{ ...panelGlass, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.7rem', padding: 'max(44px,calc(env(safe-area-inset-top)+10px)) 1rem 0.7rem', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: isNature ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.07)', background: isNature ? 'rgba(0,0,0,0.12)' : 'rgba(6,3,18,0.96)' }}>
                    {isMobile && (
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMobileView('list')} style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}><ArrowLeft size={14} /></motion.button>
                    )}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        {activeId === 'bodhi'
                            ? <motion.div animate={{ boxShadow: ['0 0 8px rgba(251,191,36,0.3)', '0 0 20px rgba(251,191,36,0.65)', '0 0 8px rgba(251,191,36,0.3)'] }} transition={{ duration: 2.5, repeat: Infinity }} style={{ width: 38, height: 38, borderRadius: '50%', background: 'radial-gradient(circle at 35% 28%,rgba(255,255,255,0.38) 0%,rgba(251,191,36,0.50) 42%,rgba(217,119,6,0.85) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.0rem', border: '1.5px solid rgba(251,191,36,0.50)' }}>✦</motion.div>
                            : (() => { const c = activeFriend ? getAvatarColor(activeFriend.uid) : '#818cf8'; const ini = activeFriend ? getInitials(activeFriend.name) : '?'; return <div style={{ width: 38, height: 38, borderRadius: '50%', background: activeFriend?.photoURL ? undefined : `radial-gradient(circle at 35% 28%,rgba(255,255,255,0.20) 0%,${c}50 100%)`, border: `1.5px solid ${c}45`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700, color: '#fff', overflow: 'hidden' }}>{activeFriend?.photoURL ? <img src={activeFriend.photoURL} alt={activeFriend.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ini}</div>; })()
                        }
                        <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }} style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', background: '#4ade80', border: '1.5px solid rgba(0,0,0,0.4)', boxShadow: '0 0 5px rgba(74,222,128,0.7)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, fontFamily: "'Outfit',sans-serif", background: activeId === 'bodhi' ? 'linear-gradient(120deg,#ffffff 0%,#fde68a 50%,#c4b5fd 100%)' : 'none', WebkitBackgroundClip: activeId === 'bodhi' ? 'text' : 'unset', backgroundClip: activeId === 'bodhi' ? 'text' : 'unset', color: activeId === 'bodhi' ? 'transparent' : 'rgba(255,255,255,0.90)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {activeId === 'bodhi' ? 'Sakha Bodhi' : activeFriend?.name}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.50rem', color: activeId === 'bodhi' ? (chatState === 'thinking' ? '#818cf8' : isSpeaking ? '#fbbf24' : isConnected ? '#4ade80' : 'rgba(255,255,255,0.35)') : 'rgba(74,222,128,0.90)', fontWeight: 700, letterSpacing: '0.06em' }}>
                            {activeId === 'bodhi' ? (chatState === 'connecting' ? '◎ Connecting…' : isBodhiThinking ? '◎ Thinking…' : isSpeaking ? '♪ Speaking' : isConnected ? '● Ready' : '○ Offline') : '● Active now'}
                        </p>
                    </div>
                </div>

                {/* Messages */}
                <div className="msgsroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0.75rem 0.85rem 0.5rem', scrollbarWidth: 'none' }}>
                    <style>{`.msgsroll::-webkit-scrollbar{display:none}`}</style>
                    {currentMsgs.length === 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 10, textAlign: 'center' }}>
                            <motion.div animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 3, repeat: Infinity }} style={{ fontSize: '2.5rem' }}>{activeFriend ? getInitials(activeFriend.name) : '✦'}</motion.div>
                            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.30)', fontStyle: 'italic', fontFamily: "'Outfit',sans-serif" }}>Say something beautiful 🙏</p>
                        </motion.div>
                    )}
                    <AnimatePresence initial={false}>
                        {currentMsgs.map(m => <MsgBubble key={m.id} msg={m} isNature={isNature} />)}
                    </AnimatePresence>
                    <AnimatePresence>
                        {showThinking && <TypingDots key="typing" />}
                    </AnimatePresence>
                    <div ref={chatEndRef} style={{ height: 8 }} />
                </div>

                {/* Floating Input */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    style={{ flexShrink: 0, padding: `0.55rem 0.85rem calc(0.75rem + env(safe-area-inset-bottom))`, background: isNature ? 'rgba(0,0,0,0.06)' : 'linear-gradient(0deg,rgba(4,2,16,0.96) 0%,rgba(6,3,18,0.70) 100%)', backdropFilter: isNature ? 'blur(4px)' : 'blur(24px)', WebkitBackdropFilter: isNature ? 'blur(4px)' : 'blur(24px)' }}>
                    {/* Emoji picker panel */}
                    <AnimatePresence>
                        {showEmoji && (
                            <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }} transition={{ duration: 0.18 }}
                                style={{ marginBottom: '0.45rem', padding: '0.55rem 0.65rem', background: isNature ? 'rgba(255,255,255,0.10)' : 'rgba(12,6,30,0.96)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 16, backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', display: 'flex', flexWrap: 'wrap', gap: '0.3rem', maxHeight: 140, overflowY: 'auto' }}>
                                {['😊', '😄', '🙏', '❤️', '🔥', '✨', '💫', '🌟', '🌙', '☀️', '🎯', '💡', '⚡', '🧘', '🕉️', '🪷', '🌸', '🌺', '🍃', '🌿', '🌊', '🏔️', '🦋', '🦚', '💎', '👑', '🎵', '🎶', '🤩', '😍', '😂', '😭', '🥰', '😎', '🤔', '🙌', '👏', '💪', '🤝', '🫂', '🌈', '🎊', '🎉', '🥳', '💯', '✅', '🚀', '🌏', '🕊️', '🐉', '🦁'].map(em => (
                                    <motion.button key={em} whileTap={{ scale: 0.80 }} onClick={() => { setInput(p => p + em); setShowEmoji(false); inputRef.current?.focus(); }}
                                        style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1rem' }}>
                                        {em}
                                    </motion.button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: isNature ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)', backdropFilter: isNature ? 'blur(16px) saturate(160%)' : 'blur(28px) saturate(180%)', WebkitBackdropFilter: isNature ? 'blur(16px) saturate(160%)' : 'blur(28px) saturate(180%)', border: isFocus ? '1px solid rgba(251,191,36,0.40)' : '1px solid rgba(255,255,255,0.11)', borderRadius: 999, padding: '0.35rem 0.5rem 0.35rem 0.85rem', boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.18),0 4px 22px rgba(0,0,0,0.22)', transition: 'border-color 0.3s' }}>
                        <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowEmoji(v => !v)} style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', background: showEmoji ? 'rgba(251,191,36,0.14)' : 'transparent', border: showEmoji ? '1px solid rgba(251,191,36,0.30)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: showEmoji ? '#fbbf24' : 'rgba(255,255,255,0.38)', transition: 'all 0.2s' }}><Smile size={15} /></motion.button>
                        <motion.button whileTap={{ scale: 0.88 }} style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.35)' }}><Paperclip size={14} /></motion.button>
                        <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            onFocus={() => setIsFocus(true)} onBlur={() => setIsFocus(false)}
                            placeholder={activeId === 'bodhi' ? (isBodhiThinking ? 'Bodhi is thinking…' : 'Message Sakha Bodhi…') : `Message ${activeFriend?.name?.split(' ')[0] ?? ''}…`}
                            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'rgba(255,255,255,0.90)', fontSize: '0.86rem', fontWeight: 300, fontFamily: "'Outfit',sans-serif" }} />
                        <motion.button whileTap={{ scale: 0.88 }}
                            onClick={isListening ? stopVoice : startVoice}
                            animate={isListening ? { scale: [1, 1.1, 1], boxShadow: ['0 0 0 0 rgba(248,113,113,0.4)', '0 0 0 8px rgba(248,113,113,0)', '0 0 0 0 rgba(248,113,113,0)'] } : {}}
                            transition={isListening ? { duration: 1.2, repeat: Infinity } : {}}
                            style={{ flexShrink: 0, width: 34, height: 34, borderRadius: '50%', background: isListening ? 'linear-gradient(135deg,rgba(248,113,113,0.35),rgba(239,68,68,0.25))' : 'rgba(255,255,255,0.06)', border: `1px solid ${isListening ? 'rgba(248,113,113,0.50)' : 'rgba(255,255,255,0.10)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: isListening ? '#f87171' : 'rgba(255,255,255,0.46)', transition: 'all 0.25s' }}>
                            {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.88 }} onClick={handleSend}
                            disabled={!input.trim() || (activeId === 'bodhi' && isBodhiThinking)}
                            style={{ flexShrink: 0, width: 38, height: 38, borderRadius: '50%', background: input.trim() ? 'linear-gradient(135deg,rgba(251,191,36,0.32),rgba(217,119,6,0.22))' : 'rgba(255,255,255,0.05)', border: `1px solid ${input.trim() ? 'rgba(251,191,36,0.42)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'default', color: input.trim() ? '#fbbf24' : 'rgba(255,255,255,0.18)', transition: 'all 0.25s' }}>
                            <Send size={14} />
                        </motion.button>
                    </div>
                    {activeId === 'bodhi' && (
                        <p style={{ textAlign: 'center', margin: '0.3rem 0 0', fontSize: '0.40rem', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Outfit',sans-serif" }}>✦ Sakha Bodhi · Gemini Live · Voice + Text ✦</p>
                    )}
                </motion.div>
            </>
        ) : (
            <div className="msgsroll" style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
                {/* Hero */}
                <div style={{ padding: '2.5rem 1.5rem 1rem', textAlign: 'center' }}>
                    <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 3.5, repeat: Infinity }}
                        style={{ fontSize: '2.8rem', filter: 'drop-shadow(0 0 24px rgba(251,191,36,0.40))', marginBottom: '0.65rem', display: 'inline-block' }}>✦</motion.div>
                    <p style={{ fontSize: '1.02rem', fontWeight: 800, fontFamily: "'Outfit',sans-serif", margin: '0 0 0.3rem', background: 'linear-gradient(120deg,#c4b5fd,#fbbf24,#c4b5fd)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>PranaVerse Community</p>
                    <p style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.28)', fontFamily: "'Outfit',sans-serif", lineHeight: 1.65, margin: 0 }}>Select a conversation to begin your sacred exchange ✦</p>
                </div>

                {/* Community stats bar */}
                <div style={{ margin: '0 1rem 0.8rem', borderRadius: 16, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)', padding: '0.8rem 1rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}>
                    {([{ label: 'Members', value: `${allUsers.length + 240}+`, color: '#a78bfa', icon: '🧘' }, { label: 'Online', value: `${allUsers.filter(u => u.online).length + 1}`, color: '#4ade80', icon: '🟢' }, { label: 'Circles', value: `${energyCircles.length}`, color: '#fbbf24', icon: '⚡' }] as const).map((s, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.1rem', marginBottom: '0.18rem' }}>{s.icon}</div>
                            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: s.color, fontFamily: "'Outfit',sans-serif", textShadow: `0 0 14px ${s.color}45` }}>{s.value}</div>
                            <div style={{ fontSize: '0.38rem', color: 'rgba(255,255,255,0.28)', fontFamily: 'monospace', letterSpacing: '0.07em', textTransform: 'uppercase', marginTop: 1 }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Live activity feed */}
                <div style={{ padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.42rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.2rem' }}>
                        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.4, repeat: Infinity }} style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px rgba(74,222,128,0.9)' }} />
                        <span style={{ fontSize: '0.44rem', color: 'rgba(255,255,255,0.30)', fontFamily: 'monospace', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Live Activity</span>
                    </div>
                    {[
                        { name: 'Arjun S.', action: 'started a meditation session', time: '2m ago', color: '#a78bfa', emoji: '🧘' },
                        { name: 'Priya R.', action: 'joined Morning Prana circle', time: '4m ago', color: '#fbbf24', emoji: '🌅' },
                        { name: 'Vikram T.', action: 'shared a Prana story', time: '7m ago', color: '#4ade80', emoji: '🌿' },
                        { name: 'Ananya M.', action: 'completed Ekadashi fast', time: '11m ago', color: '#f472b6', emoji: '🕉️' },
                        { name: 'Rohan K.', action: 'is chatting with Bodhi', time: '14m ago', color: '#60a5fa', emoji: '✦' },
                    ].map((a, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 24 }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.52rem 0.75rem', borderRadius: 14, background: `${a.color}08`, border: `1px solid ${a.color}18`, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `radial-gradient(circle at 35% 28%, rgba(255,255,255,0.22) 0%, ${a.color}65 100%)`, border: `1.5px solid ${a.color}42`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>{a.emoji}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontFamily: "'Outfit',sans-serif", display: 'block' }}>{a.name}</span>
                                <span style={{ fontSize: '0.50rem', color: 'rgba(255,255,255,0.36)', fontFamily: "'Outfit',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{a.action}</span>
                            </div>
                            <span style={{ fontSize: '0.38rem', color: `${a.color}80`, fontFamily: 'monospace', flexShrink: 0 }}>{a.time}</span>
                        </motion.div>
                    ))}
                </div>

                {/* Invite banner */}
                <motion.div whileTap={{ scale: 0.97 }}
                    style={{ margin: '0.8rem 1rem 1.5rem', borderRadius: 16, background: 'linear-gradient(135deg,rgba(251,191,36,0.10) 0%,rgba(217,119,6,0.07) 100%)', border: '1px solid rgba(251,191,36,0.22)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(251,191,36,0.15)', border: '1.5px solid rgba(251,191,36,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🙏</div>
                    <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#fde68a', fontFamily: "'Outfit',sans-serif", display: 'block' }}>Invite your Sangha!</span>
                        <span style={{ fontSize: '0.50rem', color: 'rgba(251,191,36,0.52)', fontFamily: "'Outfit',sans-serif" }}>Grow the PranaVerse community</span>
                    </div>
                    <motion.div animate={{ x: [0, 3, 0] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ color: 'rgba(251,191,36,0.55)', fontSize: '1rem' }}>›</motion.div>
                </motion.div>
            </div>
        )}
    </div>
);

// ── CHAT NAV ITEMS ─────────────────────────────────────────────────────────
const chatNavItems = [
    { id: 'home', icon: Home, label: 'Home', color: '#f472b6' },
    { id: 'map', icon: MapPin, label: 'Map', color: '#fbbf24' },
    { id: 'chat', icon: MessageCircle, label: 'Chat', color: '#4ade80' },
    { id: 'story', icon: Zap, label: 'Energy Feeds', color: '#a78bfa' },
];

// ── Create Circle handler ───────────────────────────────────────────────
const handleCreateCircle = useCallback(async () => {
    if (!newCircleName.trim()) return;
    setCreatingCircle(true);
    const newCircle: EnergyCircle = {
        id: `ec_${Date.now()}`,
        name: newCircleName.trim(),
        icon: newCircleTheme.icon,
        color: newCircleTheme.color,
        description: newCircleDesc.trim() || newCircleTheme.label,
        memberCount: 1,
    };
    // Save to Firebase
    try {
        const { getFirebaseFirestore } = await import('@/lib/firebase');
        const { collection, addDoc } = await import('firebase/firestore');
        const db = await getFirebaseFirestore();
        await addDoc(collection(db, 'energy_circles'), { ...newCircle, createdBy: uid, createdAt: Date.now() });
    } catch { /* offline */ }
    setEnergyCircles(prev => [...prev, newCircle]);
    setNewCircleName(''); setNewCircleDesc(''); setCreatingCircle(false); setShowCreateCircle(false);
}, [newCircleName, newCircleDesc, newCircleTheme, uid]);

// ── Post Prana Story handler ──────────────────────────────────────────────
const handlePostStory = useCallback(async () => {
    if (!storyCaption.trim()) return;
    setPostingStory(true);
    try {
        const { getFirebaseFirestore } = await import('@/lib/firebase');
        const { collection, addDoc } = await import('firebase/firestore');
        const db = await getFirebaseFirestore();
        await addDoc(collection(db, 'prana_stories'), {
            uid, authorName: displayName,
            activityId: storyActivity.id,
            activityIcon: storyActivity.icon,
            activityLabel: storyActivity.label,
            caption: storyCaption.trim(),
            color: storyActivity.color,
            createdAt: Date.now(),
        });
    } catch { /* offline */ }
    setStoryPosted(true);
    setPostingStory(false);
    setStoryCaption('');
    setTimeout(() => { setStoryPosted(false); setShowAddStory(false); }, 1800);
}, [uid, displayName, storyActivity, storyCaption]);

// ── Share / Invite handler ────────────────────────────────────────────────
const handleShareInvite = useCallback(async () => {
    const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://onesutra.app'}/join?ref=${uid ?? 'friend'}`;
    const shareText = `✦ Join me on PranaVerse — a sacred space for seekers, meditation & community. Click to join:\n${inviteUrl}`;
    try {
        if (navigator.share) {
            await navigator.share({ title: 'Join PranaVerse ✦', text: shareText, url: inviteUrl });
        } else {
            await navigator.clipboard.writeText(inviteUrl);
            setInviteLinkCopied(true);
            setTimeout(() => setInviteLinkCopied(false), 2500);
        }
    } catch { /* dismissed */ }
}, [uid]);

// ── LAYOUT ────────────────────────────────────────────────────────────────
return (
    <>
        <style>{`
                * { box-sizing: border-box; }
                html, body { overflow: hidden !important; }
                input::placeholder { color: rgba(255,255,255,0.30) !important; }
                .circlebar::-webkit-scrollbar { display: none; }
                .seekerlist::-webkit-scrollbar { display: none; }
                .msgsroll::-webkit-scrollbar { display: none; }
                .innerCircles::-webkit-scrollbar { display: none; }
                @keyframes liveGlow { 0%,100%{opacity:0.5;} 50%{opacity:1;} }
                @keyframes floatUp { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-4px);} }
            `}</style>

        {/* Background */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: isNature ? `url(${bgUrl}) center/cover no-repeat` : 'linear-gradient(160deg,#040210 0%,#080418 40%,#050312 100%)', transition: 'background-image 1.5s ease' }} />
        {isNature && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }} style={{ position: 'fixed', inset: 0, zIndex: 1, background: 'rgba(0,0,0,0.18)' }} />}
        {!isNature && <div style={{ position: 'fixed', inset: 0, zIndex: 1, background: 'radial-gradient(ellipse at 20% 10%,rgba(251,191,36,0.05) 0%,transparent 50%),radial-gradient(ellipse at 80% 80%,rgba(99,102,241,0.07) 0%,transparent 55%)' }} />}

        {/* App Shell */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 2, display: 'flex', fontFamily: "'Outfit',sans-serif", paddingBottom: 'calc(62px + env(safe-area-inset-bottom,0px))' }}>
            {isMobile ? (
                <>
                    <AnimatePresence mode="wait">
                        {mobileView === 'list' ? (
                            <motion.div key="list" initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} transition={{ duration: 0.25 }} style={{ width: '100%', height: '100%', overflow: 'hidden', ...panelGlass }}>
                                {leftPanel}
                            </motion.div>
                        ) : (
                            <motion.div key="chat" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={{ duration: 0.25 }} style={{ width: '100%', height: '100%', overflow: 'hidden', ...panelGlass }}>
                                {rightPanel}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            ) : (
                <>
                    {/* Desktop: Left sidebar */}
                    <div style={{ width: 300, height: '100%', overflow: 'hidden', flexShrink: 0, ...panelGlass, borderRight: '1px solid rgba(255,255,255,0.08)', borderTop: 'none', borderBottom: 'none', borderLeft: 'none' }}>
                        {leftPanel}
                    </div>
                    {/* Desktop: Right chat area */}
                    <div style={{ flex: 1, height: '100%', overflow: 'hidden', ...panelGlass, borderTop: 'none', borderBottom: 'none', borderLeft: 'none', borderRight: 'none' }}>
                        {rightPanel}
                    </div>
                </>
            )}
        </div>
        {/* ══ BOTTOM NAV BAR — PranaVerse-style ══ */}
        <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(5,8,16,0.95)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderTop: '1px solid rgba(139,92,246,0.15)', display: 'flex', paddingBottom: 'env(safe-area-inset-bottom,0px)' }}>
            {chatNavItems.map(({ id, icon: Icon, label, color }) => {
                const active = id === 'chat';
                return (
                    <motion.button key={id} whileTap={{ scale: 0.9 }}
                        onClick={() => {
                            if (id === 'home') router.push('/');
                            else if (id === 'map') router.push('/pranaverse?tab=map');
                            else if (id === 'story') router.push('/pranaverse');
                            // 'chat' stays here
                        }}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '0.75rem 0', background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
                        {active && <motion.div layoutId="chat-nav-pill" style={{ position: 'absolute', inset: '4px 10px', borderRadius: 12, background: `${color}10`, border: `1px solid ${color}22` }} transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <Icon size={21} style={{ color: active ? color : 'rgba(255,255,255,0.28)', filter: active ? `drop-shadow(0 0 6px ${color}80)` : 'none', transition: 'all 0.18s' }} />
                        </div>
                        <span style={{ fontSize: '0.55rem', fontWeight: active ? 700 : 500, color: active ? color : 'rgba(255,255,255,0.28)', letterSpacing: '0.05em', transition: 'all 0.18s', zIndex: 1 }}>{label}</span>
                    </motion.button>
                );
            })}
        </nav>
        {/* ── CREATE ENERGY CIRCLE MODAL ── */}
        <AnimatePresence>
            {showCreateCircle && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowCreateCircle(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                        onClick={e => e.stopPropagation()}
                        style={{ width: '100%', maxWidth: 480, background: 'rgba(10,6,30,0.96)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', border: '1px solid rgba(167,139,250,0.22)', borderRadius: '24px 24px 0 0', padding: '1.5rem 1.4rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '1rem', fontWeight: 800, fontFamily: "'Outfit',sans-serif", background: 'linear-gradient(120deg,#c4b5fd,#a78bfa)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>⚡ Create Energy Circle</span>
                            <button onClick={() => setShowCreateCircle(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                        </div>
                        {/* Theme picker */}
                        <div>
                            <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.40)', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Choose Theme</span>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                {CIRCLE_THEMES.map(t => (
                                    <motion.button key={t.icon} whileTap={{ scale: 0.88 }} onClick={() => setNewCircleTheme(t)}
                                        style={{ width: 42, height: 42, borderRadius: 12, background: newCircleTheme.icon === t.icon ? `${t.color}22` : 'rgba(255,255,255,0.05)', border: `1.5px solid ${newCircleTheme.icon === t.icon ? t.color : 'rgba(255,255,255,0.10)'}`, cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: newCircleTheme.icon === t.icon ? `0 0 10px ${t.color}44` : 'none' }}>
                                        {t.icon}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                        <input value={newCircleName} onChange={e => setNewCircleName(e.target.value)} placeholder="Circle name (e.g. Morning Runners)" maxLength={40}
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '0.7rem 1rem', color: '#fff', fontSize: '0.88rem', fontFamily: "'Outfit',sans-serif", outline: 'none' }} />
                        <input value={newCircleDesc} onChange={e => setNewCircleDesc(e.target.value)} placeholder="Brief description (optional)" maxLength={80}
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '0.7rem 1rem', color: '#fff', fontSize: '0.82rem', fontFamily: "'Outfit',sans-serif", outline: 'none' }} />
                        <motion.button whileTap={{ scale: 0.96 }} onClick={handleCreateCircle} disabled={!newCircleName.trim() || creatingCircle}
                            style={{ padding: '0.82rem', borderRadius: 14, background: newCircleName.trim() ? `linear-gradient(135deg, ${newCircleTheme.color}, ${newCircleTheme.color}aa)` : 'rgba(255,255,255,0.08)', border: 'none', color: newCircleName.trim() ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: '0.88rem', fontWeight: 700, fontFamily: "'Outfit',sans-serif", cursor: newCircleName.trim() ? 'pointer' : 'default' }}>
                            {creatingCircle ? '✦ Creating…' : `${newCircleTheme.icon} Create Circle`}
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* ── ADD PRANA STORY MODAL ── */}
        <AnimatePresence>
            {showAddStory && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowAddStory(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                        onClick={e => e.stopPropagation()}
                        style={{ width: '100%', maxWidth: 480, background: 'rgba(8,4,22,0.97)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: '24px 24px 0 0', padding: '1.5rem 1.4rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '1rem', fontWeight: 800, fontFamily: "'Outfit',sans-serif", background: 'linear-gradient(120deg,#fde68a,#fbbf24)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>🌟 Share Your Prana Story</span>
                            <button onClick={() => setShowAddStory(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                        </div>
                        {/* Activity type chips */}
                        <div>
                            <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', letterSpacing: '0.10em', textTransform: 'uppercase' }}>What did you do today?</span>
                            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
                                {PRANA_ACTIVITIES.map(a => (
                                    <motion.button key={a.id} whileTap={{ scale: 0.90 }} onClick={() => setStoryActivity(a)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.38rem 0.75rem', borderRadius: 99, background: storyActivity.id === a.id ? `${a.color}20` : 'rgba(255,255,255,0.05)', border: `1px solid ${storyActivity.id === a.id ? a.color : 'rgba(255,255,255,0.10)'}`, cursor: 'pointer', color: storyActivity.id === a.id ? a.color : 'rgba(255,255,255,0.50)', fontSize: '0.70rem', fontWeight: storyActivity.id === a.id ? 700 : 400, fontFamily: "'Outfit',sans-serif", transition: 'all 0.18s' }}>
                                        <span>{a.icon}</span><span>{a.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                        {/* Caption */}
                        <div style={{ position: 'relative' }}>
                            <textarea value={storyCaption} onChange={e => setStoryCaption(e.target.value)} placeholder={`Share your ${storyActivity.label} experience…`} rows={3} maxLength={200}
                                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: `1px solid ${storyCaption ? storyActivity.color + '44' : 'rgba(255,255,255,0.12)'}`, borderRadius: 14, padding: '0.75rem 1rem', color: '#fff', fontSize: '0.85rem', fontFamily: "'Outfit',sans-serif", outline: 'none', resize: 'none', lineHeight: 1.55, transition: 'border-color 0.2s' }} />
                            <span style={{ position: 'absolute', bottom: 8, right: 10, fontSize: '0.45rem', color: 'rgba(255,255,255,0.20)', fontFamily: 'monospace' }}>{storyCaption.length}/200</span>
                        </div>
                        {/* Post button */}
                        {storyPosted ? (
                            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} style={{ textAlign: 'center', padding: '0.8rem', borderRadius: 14, background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.35)', color: '#4ade80', fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '0.88rem' }}>
                                ✓ Prana Story Shared! 🌟
                            </motion.div>
                        ) : (
                            <motion.button whileTap={{ scale: 0.96 }} onClick={handlePostStory} disabled={!storyCaption.trim() || postingStory}
                                style={{ padding: '0.82rem', borderRadius: 14, background: storyCaption.trim() ? `linear-gradient(135deg, ${storyActivity.color}, ${storyActivity.color}bb)` : 'rgba(255,255,255,0.08)', border: 'none', color: storyCaption.trim() ? '#000' : 'rgba(255,255,255,0.25)', fontSize: '0.88rem', fontWeight: 800, fontFamily: "'Outfit',sans-serif", cursor: storyCaption.trim() ? 'pointer' : 'default', letterSpacing: '0.02em' }}>
                                {postingStory ? '✦ Sharing Prana…' : `${storyActivity.icon} Share Story`}
                            </motion.button>
                        )}
                        <p style={{ margin: 0, fontSize: '0.50rem', color: 'rgba(255,255,255,0.20)', textAlign: 'center', fontFamily: "'Outfit',sans-serif" }}>Your story inspires the entire community 🙏</p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* ── INVITE SANGHA MODAL ── */}
        <AnimatePresence>
            {showInviteModal && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowInviteModal(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                        onClick={e => e.stopPropagation()}
                        style={{ width: '100%', maxWidth: 480, background: 'linear-gradient(160deg,rgba(10,5,28,0.98) 0%,rgba(14,8,36,0.98) 100%)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '28px 28px 0 0', padding: '1.6rem 1.4rem 2.2rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', position: 'relative', overflow: 'hidden' }}>
                        {/* Glow bg */}
                        <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 260, height: 120, borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(251,191,36,0.18) 0%,transparent 70%)', pointerEvents: 'none' }} />
                        {/* Drag handle */}
                        <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.14)', alignSelf: 'center', marginBottom: '-0.3rem' }} />
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <span style={{ fontSize: '1.05rem', fontWeight: 800, fontFamily: "'Outfit',sans-serif", background: 'linear-gradient(120deg,#fde68a 0%,#fbbf24 45%,#e879f9 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', display: 'block' }}>✦ Invite your Sangha</span>
                                <span style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit',sans-serif" }}>Share PranaVerse with your sacred circle</span>
                            </div>
                            <button onClick={() => setShowInviteModal(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.50)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
                        </div>
                        {/* Invite link box */}
                        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(251,191,36,0.22)', borderRadius: 16, padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: '0 0 2px', fontSize: '0.46rem', color: 'rgba(255,255,255,0.30)', fontFamily: 'monospace', letterSpacing: '0.10em', textTransform: 'uppercase' }}>Your sacred invite link</p>
                                <p style={{ margin: 0, fontSize: '0.72rem', color: '#fde68a', fontFamily: "'Outfit',sans-serif", fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {typeof window !== 'undefined' ? `${window.location.origin}/join?ref=${uid ?? 'friend'}` : 'onesutra.app/join?ref=...'}
                                </p>
                            </div>
                            <motion.button whileTap={{ scale: 0.88 }} onClick={handleShareInvite}
                                style={{ flexShrink: 0, padding: '0.38rem 0.85rem', borderRadius: 999, background: inviteLinkCopied ? 'rgba(74,222,128,0.20)' : 'linear-gradient(135deg,rgba(251,191,36,0.28),rgba(217,119,6,0.20))', border: `1px solid ${inviteLinkCopied ? 'rgba(74,222,128,0.50)' : 'rgba(251,191,36,0.45)'}`, color: inviteLinkCopied ? '#4ade80' : '#fbbf24', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", transition: 'all 0.25s', whiteSpace: 'nowrap' }}>
                                {inviteLinkCopied ? '✓ Copied!' : '🔗 Copy'}
                            </motion.button>
                        </div>
                        {/* Share via row */}
                        <div>
                            <p style={{ margin: '0 0 0.65rem', fontSize: '0.48rem', color: 'rgba(255,255,255,0.30)', fontFamily: 'monospace', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Share via</p>
                            <div style={{ display: 'flex', gap: '0.6rem' }}>
                                {[
                                    { label: 'WhatsApp', emoji: '💬', color: '#25d366', bg: 'rgba(37,211,102,0.12)', border: 'rgba(37,211,102,0.30)', action: () => { const url = `https://wa.me/?text=${encodeURIComponent(`✦ Join me on PranaVerse — a sacred space for seekers & meditation. ${typeof window !== 'undefined' ? window.location.origin : 'https://onesutra.app'}/join?ref=${uid ?? 'friend'}`)}` ; window.open(url, '_blank'); }},
                                    { label: 'Telegram', emoji: '✈️', color: '#0088cc', bg: 'rgba(0,136,204,0.12)', border: 'rgba(0,136,204,0.30)', action: () => { const url = `https://t.me/share/url?url=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : 'https://onesutra.app'}/join?ref=${uid ?? 'friend'}`)}&text=${encodeURIComponent('✦ Join me on PranaVerse — a sacred space for seekers')}` ; window.open(url, '_blank'); }},
                                    { label: 'Native', emoji: '📤', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.30)', action: handleShareInvite },
                                ].map(s => (
                                    <motion.button key={s.label} whileTap={{ scale: 0.88 }} onClick={s.action}
                                        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '0.65rem 0.5rem', borderRadius: 14, background: s.bg, border: `1px solid ${s.border}`, cursor: 'pointer', color: s.color }}>
                                        <span style={{ fontSize: '1.3rem' }}>{s.emoji}</span>
                                        <span style={{ fontSize: '0.50rem', fontWeight: 700, fontFamily: "'Outfit',sans-serif", color: s.color }}>{s.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                        {/* Inspirational footer */}
                        <div style={{ textAlign: 'center', padding: '0.5rem', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity }} style={{ fontSize: '1.4rem', marginBottom: '0.3rem' }}>🙏</motion.div>
                            <p style={{ margin: 0, fontSize: '0.58rem', color: 'rgba(255,255,255,0.38)', fontFamily: "'Outfit',sans-serif", lineHeight: 1.6, fontStyle: 'italic' }}>"When seekers connect, the universe expands."</p>
                            <p style={{ margin: '0.2rem 0 0', fontSize: '0.44rem', color: 'rgba(167,139,250,0.45)', fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>✦ PranaVerse · Sacred Community</p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    </>
);
}
