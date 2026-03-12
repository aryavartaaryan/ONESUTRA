'use client';
/**
 * sutra/page.tsx — Sutra Connect: Unified Messaging Hub
 * ─────────────────────────────────────────────────────────────────────────────
 * The complete implementation of the "iMessage model" for OneSUTRA:
 *
 *  ┌─────────────────────────────────────────────────────────────────────────┐
 *  │  NATIVE (Firestore)          + TELEGRAM (TDLib)                         │
 *  │  ──────────────────          ────────────────────────                   │
 *  │  Real-time onSnapshot   ←→   updateNewMessage events                   │
 *  │  useUnifiedMessages hook merges both into one chronological thread      │
 *  │  useSmartSend routes: NATIVE preferred, fallback TELEGRAM               │
 *  └─────────────────────────────────────────────────────────────────────────┘
 *
 *  Phases implemented:
 *   ✅ Phase 1: TelegramSyncModal auto-shown when telegram_synced === false
 *   ✅ Phase 2: Contact identity resolution on mount (dual-user detection)
 *   ✅ Phase 3: useUnifiedMessages — merged, sorted message thread
 *   ✅ Phase 4: SmartSend + network badge on bubbles + manual override toggle
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useOneSutraAuth } from '@/hooks/useOneSutraAuth';
import { useUnifiedMessages } from '@/hooks/useUnifiedMessages';
import { useSmartSend } from '@/hooks/useSmartSend';
import { useContactIdentityResolver } from '@/hooks/useContactIdentityResolver';
import { useSutraConnectStore, selectContact } from '@/stores/sutraConnectStore';
import { getTDLibClient } from '@/lib/tdlib';
import dynamic from 'next/dynamic';
import type { UnifiedMessage } from '@/lib/sutraConnect.types';

// Lazy-load the modal to keep initial bundle lean
const TelegramSyncModal = dynamic(
    () => import('@/components/SutraConnect/TelegramSyncModal'),
    { ssr: false }
);

// ─────────────────────────────────────────────────────────────────────────────
// DEMO CONTACT (replace with real contact selection UI in production)
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_CONTACT = {
    name: 'Arjun Sharma',
    phone: '+919876500001',  // Must match a contact in the store
    avatar: '☀️',
    badge: 'Sangha',
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function SutraConnectPage() {
    const { user } = useOneSutraAuth();
    const [showTelegramModal, setShowTelegramModal] = useState(false);
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    // ── Phase 2: Contact Identity Resolution ─────────────────────────────────
    const { syncAndResolve } = useContactIdentityResolver();
    const isTelegramSynced = useSutraConnectStore((s) => s.isTelegramSynced);
    const contact = useSutraConnectStore(selectContact(DEMO_CONTACT.phone));

    // ── Compute IDs for chat hooks ──────────────────────────────────────────
    const currentUserId = user?.uid ?? '';
    const currentUserName = user?.name ?? 'You';

    // Native chat ID (only valid for dual-users)
    const nativeChatId: string | null = contact?.is_onesutra_user && contact.onesutra_uid
        ? [currentUserId, contact.onesutra_uid].sort().join('_')
        : null;

    // TDLib chat ID (needs to be fetched on first connect; mocked for dev)
    const [tgChatId, setTgChatId] = useState<number | null>(null);

    // ── Phase 3: Unified message stream ──────────────────────────────────────
    const { messages } = useUnifiedMessages({
        contactPhone: DEMO_CONTACT.phone,
        currentUserId,
        currentUserName,
        nativeChatId,
        tgChatId,
    });

    // ── Phase 4: Smart Send ───────────────────────────────────────────────────
    const { sendMessage, isSending, override, setOverride, lastSendNetwork } = useSmartSend({
        contactPhone: DEMO_CONTACT.phone,
        currentUserId,
        currentUserName,
        nativeChatId,
        tgChatId,
    });

    // ── On mount: check telegram_synced from Firestore, init TDLib if synced ──
    useEffect(() => {
        if (!user?.uid) return;

        (async () => {
            try {
                const { getFirebaseFirestore } = await import('@/lib/firebase');
                const { doc, getDoc } = await import('firebase/firestore');
                const db = await getFirebaseFirestore();
                const snap = await getDoc(doc(db, 'onesutra_users', user.uid));
                const data = snap.data();

                if (!data?.telegram_synced) {
                    // Show sync modal: user hasn't linked Telegram yet
                    setShowTelegramModal(true);
                } else {
                    // Already synced — update Zustand store if not done yet
                    if (!isTelegramSynced) {
                        useSutraConnectStore.getState().setTelegramSynced(
                            data.telegram_user_id ?? '',
                            data.telegram_phone ?? ''
                        );
                    }
                    // Run contact identity resolution
                    await syncAndResolve();
                }
            } catch { /* offline — use cached store state */ }
        })();
    }, [user?.uid, isTelegramSynced, syncAndResolve]);

    // ── When telegram is synced, resolve TDLib chat ID for this contact ───────
    useEffect(() => {
        if (!isTelegramSynced || !contact?.telegram_user_id) return;

        (async () => {
            try {
                const tdlib = getTDLibClient();
                await tdlib.init();
                const chatId = await tdlib.getPrivateChatId(parseInt(contact.telegram_user_id, 10));
                setTgChatId(chatId);
            } catch { /* ignore */ }
        })();
    }, [isTelegramSynced, contact?.telegram_user_id]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = useCallback(() => {
        if (!input.trim() || isSending) return;
        sendMessage(input.trim());
        setInput('');
    }, [input, isSending, sendMessage]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div style={{
            minHeight: '100dvh',
            display: 'flex', flexDirection: 'column',
            background: 'linear-gradient(160deg, #0d0820 0%, #110b2d 40%, #0a0a18 100%)',
            position: 'relative',
            fontFamily: 'var(--font-body, Inter, sans-serif)',
        }}>
            {/* Ambient glow */}
            <div style={{
                position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 420, height: 180,
                background: 'radial-gradient(ellipse, rgba(109,40,217,0.18) 0%, transparent 70%)',
                filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0,
            }} />

            {/* ── HEADER ────────────────────────────────────────────────────────── */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 50,
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.85rem 1rem',
                background: 'rgba(13,8,32,0.82)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                borderBottom: '1px solid rgba(109,40,217,0.15)',
            }}>
                <Link href="/" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', textDecoration: 'none',
                }}>←</Link>

                {/* Contact avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #4c1d95, #7c3aed)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.1rem', border: '1.5px solid rgba(167,139,250,0.3)',
                    }}>{DEMO_CONTACT.avatar}</div>
                    <motion.div
                        animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.15, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                        style={{
                            position: 'absolute', bottom: 1, right: 1,
                            width: 9, height: 9, borderRadius: '50%',
                            background: 'rgba(109,40,217,0.9)',
                            border: '1.5px solid rgba(13,8,32,0.9)',
                        }}
                    />
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '0.95rem' }}>
                            {DEMO_CONTACT.name}
                        </span>
                        {contact?.is_onesutra_user && (
                            <span style={{
                                fontSize: '0.5rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                                color: 'rgba(167,139,250,0.9)', background: 'rgba(109,40,217,0.2)',
                                border: '1px solid rgba(109,40,217,0.35)', borderRadius: 999,
                                padding: '0.1rem 0.45rem',
                            }}>OneSUTRA</span>
                        )}
                        {isTelegramSynced && (
                            <span style={{
                                fontSize: '0.5rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                                color: 'rgba(29,161,242,0.9)', background: 'rgba(29,161,242,0.1)',
                                border: '1px solid rgba(29,161,242,0.25)', borderRadius: 999,
                                padding: '0.1rem 0.45rem',
                            }}>✈ Telegram</span>
                        )}
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.38)' }}>
                        {contact?.is_onesutra_user ? 'Native + Telegram · Unified' : 'Telegram only'}
                    </span>
                </div>

                {/* Telegram sync button — show if not linked */}
                {!isTelegramSynced && (
                    <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setShowTelegramModal(true)}
                        style={{
                            padding: '0.35rem 0.75rem',
                            background: 'rgba(29,161,242,0.15)',
                            border: '1px solid rgba(29,161,242,0.4)',
                            borderRadius: 999,
                            color: 'rgba(29,161,242,0.9)', fontSize: '0.7rem', fontWeight: 600,
                            cursor: 'pointer', whiteSpace: 'nowrap',
                        }}
                    >
                        ✈️ Link Telegram
                    </motion.button>
                )}
            </header>

            {/* ── MESSAGES AREA ─────────────────────────────────────────────────── */}
            <div style={{
                flex: 1, overflowY: 'auto',
                padding: '1.2rem 0.9rem 0.5rem',
                display: 'flex', flexDirection: 'column', gap: '0.55rem',
                position: 'relative', zIndex: 1,
            }}>
                {/* Day divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.25rem 0 0.5rem' }}>
                    <div style={{ flex: 1, height: 0.5, background: 'rgba(255,255,255,0.07)' }} />
                    <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em' }}>Today</span>
                    <div style={{ flex: 1, height: 0.5, background: 'rgba(255,255,255,0.07)' }} />
                </div>

                {/* Empty state */}
                {messages.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ textAlign: 'center', padding: '3rem 1rem', color: 'rgba(255,255,255,0.25)' }}
                    >
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', filter: 'grayscale(0.3)' }}>
                            {isTelegramSynced ? '🔗' : '💬'}
                        </div>
                        <p style={{ fontSize: '0.82rem', lineHeight: 1.6, margin: 0 }}>
                            {isTelegramSynced
                                ? 'Your unified inbox is ready.\nSend the first message.'
                                : 'Link Telegram above to see your full message history.'}
                        </p>
                    </motion.div>
                )}

                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <UnifiedBubble
                            key={msg.internal_id}
                            message={msg}
                        />
                    ))}
                </AnimatePresence>

                {/* Sending indicator */}
                {isSending && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <SpandanaWave network={lastSendNetwork ?? 'NATIVE'} />
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* ── SMART INPUT BAR ───────────────────────────────────────────────── */}
            <SmartInputBar
                input={input}
                onChange={setInput}
                onKeyDown={handleKeyDown}
                onSend={handleSend}
                isSending={isSending}
                override={override}
                onOverrideChange={setOverride}
                isDualUser={contact?.is_onesutra_user ?? false}
                isTelegramLinked={isTelegramSynced}
                lastSendNetwork={lastSendNetwork}
            />

            {/* ── TELEGRAM SYNC MODAL ───────────────────────────────────────────── */}
            <AnimatePresence>
                {showTelegramModal && user?.uid && (
                    <TelegramSyncModal
                        firebaseUid={user.uid}
                        onSuccess={async () => {
                            setShowTelegramModal(false);
                            await syncAndResolve();
                        }}
                        onDismiss={() => setShowTelegramModal(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// UnifiedBubble — Message bubble with network source badge
// ─────────────────────────────────────────────────────────────────────────────

function UnifiedBubble({ message }: { message: UnifiedMessage }) {
    const isMe = message.is_mine;

    // Network indicator config
    const networkConfig = {
        NATIVE: { icon: '●', color: '#a78bfa', label: 'OneSUTRA', glow: 'rgba(109,40,217,0.35)' },
        TELEGRAM: { icon: '✈', color: '#1da1f2', label: 'Telegram', glow: 'rgba(29,161,242,0.3)' },
    }[message.source_network];

    // Delivery status icons
    const deliveryIcon = {
        SENDING: '○',
        SENT: '✓',
        DELIVERED: '✓✓',
        READ: '✓✓',
        FAILED: '✗',
    }[message.delivery_status];

    const deliveryColor = message.delivery_status === 'FAILED'
        ? '#f87171'
        : message.delivery_status === 'READ'
            ? networkConfig.color
            : 'rgba(255,255,255,0.3)';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            style={{
                display: 'flex',
                justifyContent: isMe ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end', gap: '0.4rem',
            }}
        >
            {/* Avatar dot (other side only) */}
            {!isMe && (
                <div style={{
                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                    background: networkConfig.color, marginBottom: 6,
                    boxShadow: `0 0 6px ${networkConfig.glow}`,
                }} />
            )}

            <div style={{
                maxWidth: '75%',
                background: isMe
                    ? message.source_network === 'NATIVE'
                        ? 'rgba(109,40,217,0.25)'    // Purple for native
                        : 'rgba(29,161,242,0.2)'      // Blue for Telegram
                    : 'rgba(255,255,255,0.07)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: isMe
                    ? `1px solid ${message.source_network === 'NATIVE' ? 'rgba(167,139,250,0.3)' : 'rgba(29,161,242,0.3)'}`
                    : '1px solid rgba(255,255,255,0.09)',
                borderRadius: isMe ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                padding: '0.6rem 0.85rem 0.45rem',
                position: 'relative',
            }}>
                {/* Message text */}
                <p style={{
                    color: message.delivery_status === 'FAILED'
                        ? 'rgba(248,113,113,0.8)' : 'rgba(255,255,255,0.88)',
                    fontSize: '0.88rem', lineHeight: 1.5, margin: 0,
                    fontFamily: message.text.length > 60
                        ? "'Playfair Display', Georgia, serif"
                        : 'var(--font-body, Inter, sans-serif)',
                    fontStyle: message.delivery_status === 'SENDING' ? 'italic' : 'normal',
                    opacity: message.delivery_status === 'SENDING' ? 0.65 : 1,
                }}>{message.text}</p>

                {/* Footer: network badge + time + delivery status */}
                <div style={{
                    marginTop: '0.3rem',
                    display: 'flex', alignItems: 'center',
                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                    gap: '0.35rem',
                }}>
                    {/* ● Network source badge — the key feature */}
                    <span
                        title={networkConfig.label}
                        style={{
                            fontSize: '0.6rem',
                            color: networkConfig.color,
                            opacity: 0.85,
                            letterSpacing: '0.05em',
                        }}
                    >
                        {networkConfig.icon}
                    </span>

                    {/* Timestamp */}
                    <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.28)' }}>
                        {formatTime(message.timestamp)}
                    </span>

                    {/* Delivery tick (sender only) */}
                    {isMe && (
                        <span style={{ fontSize: '0.55rem', color: deliveryColor }}>
                            {deliveryIcon}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SmartInputBar — Input with network override toggle
// ─────────────────────────────────────────────────────────────────────────────

interface SmartInputBarProps {
    input: string;
    onChange: (v: string) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onSend: () => void;
    isSending: boolean;
    override: string;
    onOverrideChange: (o: 'AUTO' | 'NATIVE' | 'TELEGRAM') => void;
    isDualUser: boolean;
    isTelegramLinked: boolean;
    lastSendNetwork: 'NATIVE' | 'TELEGRAM' | null;
}

function SmartInputBar({
    input, onChange, onKeyDown, onSend, isSending,
    override, onOverrideChange, isDualUser, isTelegramLinked, lastSendNetwork,
}: SmartInputBarProps) {
    const [showOverride, setShowOverride] = useState(false);

    // The currently active send route (for button color)
    const activeRoute =
        override === 'TELEGRAM' ? 'TELEGRAM'
            : override === 'NATIVE' ? 'NATIVE'
                : isDualUser ? 'NATIVE'
                    : 'TELEGRAM';

    const routeColor = activeRoute === 'NATIVE' ? '#a78bfa' : '#1da1f2';
    const routeIcon = activeRoute === 'NATIVE' ? '●' : '✈';
    const routeLabel = activeRoute === 'NATIVE' ? 'Native' : 'Telegram';

    return (
        <div style={{
            position: 'sticky', bottom: 0, zIndex: 50,
            background: 'rgba(13,8,32,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,0.07)',
        }}>
            {/* ── OVERRIDE PILLS (shown when showOverride = true) ──────────────── */}
            <AnimatePresence>
                {showOverride && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{
                            display: 'flex', gap: '0.5rem', padding: '0.6rem 1rem 0',
                            overflow: 'hidden',
                        }}
                    >
                        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', alignSelf: 'center' }}>
                            Send via:
                        </span>
                        {(['AUTO', 'NATIVE', 'TELEGRAM'] as const).map((opt) => {
                            const isActive = override === opt;
                            const optColor = opt === 'TELEGRAM' ? '#1da1f2' : opt === 'NATIVE' ? '#a78bfa' : 'rgba(255,255,255,0.5)';
                            return (
                                <motion.button
                                    key={opt}
                                    whileTap={{ scale: 0.93 }}
                                    onClick={() => onOverrideChange(opt)}
                                    style={{
                                        padding: '0.25rem 0.65rem',
                                        borderRadius: 999, fontSize: '0.68rem', fontWeight: 600,
                                        background: isActive ? `${optColor}22` : 'rgba(255,255,255,0.05)',
                                        border: `1px solid ${isActive ? optColor : 'rgba(255,255,255,0.1)'}`,
                                        color: isActive ? optColor : 'rgba(255,255,255,0.4)',
                                        cursor: 'pointer', transition: 'all 0.15s',
                                    }}
                                >
                                    {opt === 'AUTO' ? '⚡ Auto' : opt === 'NATIVE' ? '● Native' : '✈ Telegram'}
                                </motion.button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── MAIN INPUT ROW ───────────────────────────────────────────────── */}
            <div style={{
                padding: '0.65rem 0.9rem 0.9rem',
                display: 'flex', gap: '0.5rem', alignItems: 'center',
            }}>
                {/* Network route indicator button (tap to show override options) */}
                <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setShowOverride((v) => !v)}
                    title={`Sending via ${routeLabel}. Tap to change.`}
                    style={{
                        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                        background: `${routeColor}18`,
                        border: `1px solid ${routeColor}44`,
                        color: routeColor, fontSize: '0.9rem',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                    }}
                >
                    {routeIcon}
                </motion.button>

                {/* Text input */}
                <div style={{ position: 'relative', flex: 1 }}>
                    <div style={{
                        position: 'absolute', inset: -8, borderRadius: 999,
                        background: `radial-gradient(ellipse, ${routeColor}18 0%, transparent 70%)`,
                        filter: 'blur(12px)', pointerEvents: 'none',
                    }} />
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder={`Message via ${routeLabel}…`}
                        style={{
                            position: 'relative', zIndex: 1,
                            width: '100%', boxSizing: 'border-box',
                            background: 'rgba(255,255,255,0.07)',
                            border: `1px solid ${routeColor}30`,
                            borderRadius: 999,
                            padding: '0.65rem 1.2rem',
                            color: 'rgba(255,255,255,0.88)',
                            fontSize: '0.88rem', fontWeight: 300, outline: 'none',
                        }}
                    />
                </div>

                {/* Send button */}
                <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.93 }}
                    onClick={onSend}
                    disabled={isSending || !input.trim()}
                    style={{
                        width: 44, height: 44, flexShrink: 0,
                        background: input.trim()
                            ? `linear-gradient(135deg, ${routeColor}bb, ${routeColor})`
                            : 'rgba(255,255,255,0.07)',
                        border: 'none', borderRadius: '50%',
                        color: 'rgba(255,255,255,0.92)', fontSize: '1rem',
                        cursor: input.trim() ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: input.trim() ? `0 4px 18px ${routeColor}44` : 'none',
                        transition: 'all 0.2s',
                    }}
                >
                    {isSending ? '⏳' : '✦'}
                </motion.button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SpandanaWave — "Typing" indicator branded to each network
// ─────────────────────────────────────────────────────────────────────────────

function SpandanaWave({ network }: { network: 'NATIVE' | 'TELEGRAM' }) {
    const color = network === 'NATIVE' ? 'rgba(167,139,250,0.8)' : 'rgba(29,161,242,0.8)';
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                padding: '0.4rem 0.75rem',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${color}33`,
                borderRadius: 12,
            }}
        >
            <span style={{ fontSize: '0.55rem', color: `${color}88`, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                Sending
            </span>
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                {[0, 1, 2, 3].map((i) => (
                    <motion.div
                        key={i}
                        animate={{ height: [3, 12, 3], opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
                        style={{ width: 2.5, borderRadius: 2, background: color }}
                    />
                ))}
            </div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function formatTime(ms: number): string {
    return new Date(ms).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true,
    });
}
