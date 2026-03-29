'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Check, X, MessageCircle } from 'lucide-react';
import { SutraUser } from '@/hooks/useUsers';
import { FriendStatus } from './ResonanceTypes';

const AVATAR_COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#14b8a6', '#f97316', '#22c55e', '#a855f7', '#f59e0b'];

export default function FriendCard({ user: u, status, onAdd, onAccept, onDecline, onChat, isRequest = false }: {
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
