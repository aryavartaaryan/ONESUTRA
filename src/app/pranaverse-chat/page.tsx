'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Send, Mic, MicOff, Leaf, Moon, ArrowLeft, Check, X, Search, Smile, Paperclip } from 'lucide-react';
import { useBodhiChatVoice } from '@/hooks/useBodhiChatVoice';
import { useOneSutraAuth } from '@/hooks/useOneSutraAuth';
import { useLanguage } from '@/context/LanguageContext';
import { useDailyTasks } from '@/hooks/useDailyTasks';
import { useUsers, SutraUser } from '@/hooks/useUsers';
import { useMessages, getChatId } from '@/hooks/useMessages';
import { FriendDoc } from '@/components/Resonance/ResonanceTypes';

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
function getTimeOfDay(): TimeOfDay {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'morning';
    if (h >= 12 && h < 17) return 'afternoon';
    if (h >= 17 && h < 21) return 'evening';
    return 'night';
}
function fmtTime(ts: number) { return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }); }

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

// Resonance-style seeker card — shows ALL users with status-aware action
type SeekerStatus = 'none' | 'sent' | 'received' | 'friends';
function SeekerCard({ u, status, isNature, onAdd, onAccept, onDecline, onChat }: {
    u: SutraUser; status: SeekerStatus; isNature: boolean;
    onAdd: () => void; onAccept: () => void; onDecline: () => void; onChat: () => void;
}) {
    const color = getAvatarColor(u.uid);
    const initials = getInitials(u.name);
    const [localSent, setLocalSent] = React.useState(false);
    const isSent = status === 'sent' || localSent;
    return (
        <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.65rem 1rem', margin: '0 0.5rem 0.35rem', borderRadius: 16, background: isNature ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.04)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: `1px solid ${status === 'received' ? 'rgba(249,115,22,0.22)' : status === 'friends' ? `${color}28` : 'rgba(255,255,255,0.07)'}`, cursor: status === 'friends' ? 'pointer' : 'default', transition: 'border-color 0.3s' }}
            onClick={status === 'friends' ? onChat : undefined}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: u.photoURL ? undefined : `radial-gradient(circle at 35% 28%,rgba(255,255,255,0.22) 0%,${color}65 100%)`, border: `2px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.88rem', fontWeight: 700, color: '#fff', overflow: 'hidden', boxShadow: `0 2px 14px ${color}22` }}>
                    {u.photoURL ? <img src={u.photoURL} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
                </div>
                {u.online && <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: '50%', background: '#4ade80', border: '2px solid rgba(5,2,22,0.85)', boxShadow: '0 0 6px rgba(74,222,128,0.8)' }} />}
            </div>
            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.90)', fontFamily: "'Outfit',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 118 }}>{u.name}</span>
                    {status === 'received' && <motion.span animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 1.8, repeat: Infinity }} style={{ padding: '1px 5px', borderRadius: 99, background: 'rgba(249,115,22,0.18)', border: '1px solid rgba(249,115,22,0.40)', fontSize: '0.38rem', fontWeight: 700, color: '#fb923c', letterSpacing: '0.10em', textTransform: 'uppercase', flexShrink: 0 }}>wants in</motion.span>}
                    {status === 'friends' && <span style={{ padding: '1px 5px', borderRadius: 99, background: `${color}22`, border: `1px solid ${color}40`, fontSize: '0.38rem', fontWeight: 700, color: color, letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>in circle</span>}
                </div>
                <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.32)', fontFamily: "'Outfit',sans-serif" }}>OneSuTra Seeker{u.online ? ' · ' : ''}{u.online ? <span style={{ color: '#4ade80' }}>online</span> : ''}</span>
            </div>
            {/* Action button */}
            {status === 'none' && !isSent && (
                <motion.button whileTap={{ scale: 0.84 }} onClick={e => { e.stopPropagation(); setLocalSent(true); onAdd(); }}
                    style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '0.38rem 0.80rem', borderRadius: 999, background: 'linear-gradient(135deg,rgba(251,191,36,0.22),rgba(217,119,6,0.16))', border: '1px solid rgba(251,191,36,0.42)', cursor: 'pointer', color: '#fbbf24', fontSize: '0.60rem', fontWeight: 700, fontFamily: "'Outfit',sans-serif", backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', whiteSpace: 'nowrap' }}>
                    ✦ Add
                </motion.button>
            )}
            {isSent && (
                <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3, padding: '0.36rem 0.72rem', borderRadius: 999, background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.22)', color: 'rgba(74,222,128,0.65)', fontSize: '0.58rem', fontWeight: 700, fontFamily: "'Outfit',sans-serif", whiteSpace: 'nowrap' }}>
                    ✓ Sent
                </span>
            )}
            {status === 'received' && (
                <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    <motion.button whileTap={{ scale: 0.85 }} onClick={e => { e.stopPropagation(); onAccept(); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '0.36rem 0.70rem', borderRadius: 999, background: 'rgba(74,222,128,0.18)', border: '1px solid rgba(74,222,128,0.44)', cursor: 'pointer', color: '#4ade80', fontSize: '0.60rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        <Check size={10} />Accept
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.85 }} onClick={e => { e.stopPropagation(); onDecline(); }}
                        style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.30)', cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={10} />
                    </motion.button>
                </div>
            )}
            {status === 'friends' && (
                <motion.button whileTap={{ scale: 0.88 }} onClick={e => { e.stopPropagation(); onChat(); }}
                    style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '0.36rem 0.72rem', borderRadius: 999, background: `${color}18`, border: `1px solid ${color}40`, cursor: 'pointer', color: color, fontSize: '0.60rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    💬 Chat
                </motion.button>
            )}
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

    // ── LEFT PANEL ────────────────────────────────────────────────────────────
    const leftPanel = (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ ...panelGlass, flexShrink: 0, padding: 'max(44px,calc(env(safe-area-inset-top) + 10px)) 1rem 0.75rem', borderBottom: isNature ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.07)', borderTop: 'none', borderLeft: 'none', borderRight: 'none', background: isNature ? 'rgba(0,0,0,0.12)' : 'rgba(6,3,18,0.96)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.push('/')} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}><ArrowLeft size={14} /></motion.button>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, fontFamily: "'Outfit',sans-serif", background: 'linear-gradient(120deg,#ffffff 0%,#fde68a 50%,#c4b5fd 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Pranaverse Chat</p>
                            <p style={{ margin: 0, fontSize: '0.46rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace' }}>Sacred Circle</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(74,222,128,0.10)', border: '1px solid rgba(74,222,128,0.22)', borderRadius: 999, padding: '0.2rem 0.5rem' }}>
                            <motion.div animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 5px rgba(74,222,128,0.8)' }} />
                            <span style={{ fontSize: '0.42rem', color: 'rgba(74,222,128,0.85)', fontWeight: 700, letterSpacing: '0.06em' }}>{allUsers.filter(u => u.online).length + 1} online</span>
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
                <div style={{ position: 'relative' }}>
                    <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.32)' }} />
                    <input value={seekerSearch} onChange={e => setSeekerSearch(e.target.value)} placeholder="Search seekers…" style={{ width: '100%', boxSizing: 'border-box', background: isNature ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 999, padding: '0.45rem 0.75rem 0.45rem 2rem', color: 'rgba(255,255,255,0.80)', fontSize: '0.75rem', outline: 'none', fontFamily: "'Outfit',sans-serif" }} />
                </div>
            </div>


            {/* ── ONE SINGLE SCROLL — everything below header unified ── */}
            <div className="singlescroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none' }}>

                {/* Story circles strip — horizontal swipe only */}
                <div style={{ padding: '0.65rem 1rem 0.5rem', borderBottom: isNature ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2.4, repeat: Infinity }} style={{ width: 5, height: 5, borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 5px rgba(251,191,36,0.8)' }} />
                            <span style={{ fontSize: '0.44rem', fontWeight: 800, color: 'rgba(255,255,255,0.40)', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'monospace' }}>⚡ Energy Circle</span>
                        </div>
                        <span style={{ fontSize: '0.40rem', color: 'rgba(251,191,36,0.50)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{acceptedFriends.length + 1} member{acceptedFriends.length !== 0 ? 's' : ''}</span>
                    </div>
                    <div className="circlebar" style={{ display: 'flex', gap: '0.65rem', overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                        <BodhiCircle active={activeId === 'bodhi'} unread={bodhiUnread} onClick={() => handleSelect('bodhi')} />
                        {acceptedFriends.map(u => (
                            <CircleAvatar key={u.uid} u={u} active={activeId === u.uid} onClick={() => handleSelect(u.uid)} />
                        ))}
                        {acceptedFriends.length === 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.09)', borderRadius: 12 }}>
                                <span style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.20)', fontFamily: "'Outfit',sans-serif" }}>Add seekers below ↓</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Bodhi card — always first ── */}
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

                    {/* Accepted friend cards — inline, no sub-scroll */}
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

                {/* ── Find Seekers ── */}
                <div style={{ marginTop: '0.7rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.1rem 0.4rem' }}>
                        <span style={{ fontSize: '0.70rem', fontWeight: 800, color: 'rgba(255,255,255,0.70)', fontFamily: "'Outfit',sans-serif" }}>Find Seekers</span>
                        <span style={{ fontSize: '0.40rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>{allUsers.length} in the verse</span>
                    </div>
                    <AnimatePresence>
                        {filteredUsers.map(u => {
                            let status: SeekerStatus = 'none';
                            if (acceptedFriendIds.has(u.uid)) status = 'friends';
                            else if (sentRequestUids.has(u.uid)) status = 'sent';
                            else if (pendingRequests.find(r => r.user.uid === u.uid)) status = 'received';
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
                            <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.22)', fontFamily: "'Outfit',sans-serif" }}>No seekers found</p>
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
                    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0.75rem 0.85rem 0.5rem', scrollbarWidth: 'none' }}>
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
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
                    <motion.div animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 4, repeat: Infinity }} style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.3))' }}>✦</motion.div>
                    <p style={{ fontSize: '0.92rem', fontWeight: 600, color: 'rgba(255,255,255,0.50)', fontFamily: "'Outfit',sans-serif" }}>Select a conversation</p>
                    <p style={{ fontSize: '0.64rem', color: 'rgba(255,255,255,0.25)', fontFamily: "'Outfit',sans-serif", lineHeight: 1.6 }}>Connect with your Sangha or talk to Sakha Bodhi, your AI friend</p>
                </div>
            )}
        </div>
    );

    // ── LAYOUT ────────────────────────────────────────────────────────────────
    return (
        <>
            <style>{`
                * { box-sizing: border-box; }
                input::placeholder { color: rgba(255,255,255,0.30) !important; }
            `}</style>

            {/* Background */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: isNature ? `url(${bgUrl}) center/cover no-repeat` : 'linear-gradient(160deg,#040210 0%,#080418 40%,#050312 100%)', transition: 'background-image 1.5s ease' }} />
            {isNature && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }} style={{ position: 'fixed', inset: 0, zIndex: 1, background: 'rgba(0,0,0,0.18)' }} />}
            {!isNature && <div style={{ position: 'fixed', inset: 0, zIndex: 1, background: 'radial-gradient(ellipse at 20% 10%,rgba(251,191,36,0.05) 0%,transparent 50%),radial-gradient(ellipse at 80% 80%,rgba(99,102,241,0.07) 0%,transparent 55%)' }} />}

            {/* App Shell */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 2, display: 'flex', fontFamily: "'Outfit',sans-serif" }}>
                {isMobile ? (
                    <>
                        <AnimatePresence mode="wait">
                            {mobileView === 'list' ? (
                                <motion.div key="list" initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} transition={{ duration: 0.25 }} style={{ width: '100%', height: '100%', ...panelGlass }}>
                                    {leftPanel}
                                </motion.div>
                            ) : (
                                <motion.div key="chat" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={{ duration: 0.25 }} style={{ width: '100%', height: '100%', ...panelGlass }}>
                                    {rightPanel}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                ) : (
                    <>
                        {/* Desktop: Left sidebar */}
                        <div style={{ width: 300, height: '100%', flexShrink: 0, ...panelGlass, borderRight: '1px solid rgba(255,255,255,0.08)', borderTop: 'none', borderBottom: 'none', borderLeft: 'none' }}>
                            {leftPanel}
                        </div>
                        {/* Desktop: Right chat area */}
                        <div style={{ flex: 1, height: '100%', ...panelGlass, borderTop: 'none', borderBottom: 'none', borderLeft: 'none', borderRight: 'none' }}>
                            {rightPanel}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
