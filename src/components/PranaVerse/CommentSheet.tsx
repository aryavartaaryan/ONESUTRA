'use client';
/**
 * CommentSheet — Instagram-grade real-time Echo bottom sheet
 * - position:fixed, renders over everything at z-index 900
 * - Input visible above bottom nav (uses safe-area + extra padding)
 * - Real-time Firebase comments via onSnapshot
 */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Comment } from '@/hooks/usePostReactions';

interface CommentSheetProps {
    postCaption: string;
    commentCount: number;
    comments: Comment[];
    onClose: () => void;
    onAddComment: (text: string) => Promise<void>;
}

function timeAgo(createdAt: number | { seconds: number } | null | undefined): string {
    if (!createdAt) return 'just now';
    const ts = typeof createdAt === 'number' ? createdAt : (createdAt.seconds ?? 0) * 1000;
    if (!ts) return 'just now';
    const diff = Date.now() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
}

const AVATARS = ['🧘', '🌺', '🪷', '🌙', '✨', '🌊', '🕊️', '🌿'];
function getAvatar(userId: string): string {
    let h = 0;
    for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) & 0xffffffff;
    return AVATARS[Math.abs(h) % AVATARS.length];
}

export default function CommentSheet({ postCaption, commentCount, comments, onClose, onAddComment }: CommentSheetProps) {
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [comments.length]);

    useEffect(() => {
        const t = setTimeout(() => inputRef.current?.focus(), 450);
        return () => clearTimeout(t);
    }, []);

    const handleSend = async () => {
        const trimmed = text.trim();
        if (!trimmed || sending) return;
        setSending(true);
        setText('');
        await onAddComment(trimmed);
        setSending(false);
        inputRef.current?.focus();
    };

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const hasText = text.trim().length > 0;

    const dayName = typeof window !== 'undefined' ? new Date().toLocaleDateString('en-US', { weekday: 'long' }) : "Today's";

    return (
        <>
        <style>{`.cs-vibes-input::placeholder { color: rgba(255,255,255,0.52) !important; font-style: italic; letter-spacing: 0.01em; }`}</style>
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                key="echo-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0, zIndex: 900,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(5px)',
                    WebkitBackdropFilter: 'blur(5px)',
                }}
            >
                {/* Sheet */}
                <motion.div
                    key="echo-sheet"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 0.9 }}
                    onClick={e => e.stopPropagation()}
                    style={{
                        position: 'absolute',
                        /* leaves 25% of screen visible at top so user sees content */
                        top: '25%', bottom: 0, left: 0, right: 0,
                        background: 'rgba(10, 6, 22, 0.98)',
                        backdropFilter: 'blur(32px)',
                        WebkitBackdropFilter: 'blur(32px)',
                        borderTopLeftRadius: 22,
                        borderTopRightRadius: 22,
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderBottom: 'none',
                        boxShadow: '0 -16px 60px rgba(0,0,0,0.7)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                    }}
                >
                    {/* Top gradient accent */}
                    <div style={{
                        position: 'absolute', top: 0, left: '25%', right: '25%', height: 1,
                        background: 'linear-gradient(to right, transparent, rgba(45,212,191,0.8), rgba(244,114,182,0.8), transparent)',
                        borderRadius: 1,
                    }} />

                    {/* Drag handle */}
                    <div style={{
                        width: 40, height: 4, borderRadius: 2,
                        background: 'rgba(255,255,255,0.22)',
                        margin: '12px auto 0', flexShrink: 0,
                    }} />

                    {/* Header */}
                    <div style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 18px 10px',
                        borderBottom: '1px solid rgba(255,255,255,0.07)',
                        flexShrink: 0,
                    }}>
                        <div>
                            <div style={{
                                fontFamily: "'Outfit', sans-serif", fontWeight: 700,
                                fontSize: '1rem', color: '#fff', letterSpacing: '-0.01em',
                            }}>Echoes</div>
                            <div style={{
                                fontFamily: "'Outfit', sans-serif", fontSize: '0.72rem',
                                color: 'rgba(255,255,255,0.42)', marginTop: 2,
                            }}>
                                {commentCount > 0
                                    ? `${commentCount} echo${commentCount !== 1 ? 'es' : ''} · live`
                                    : 'Be the first to echo · live'
                                }
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: '50%', width: 32, height: 32,
                                color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem',
                                cursor: 'pointer', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                            }}
                        >✕</button>
                    </div>

                    {/* Comment list */}
                    <div
                        ref={listRef}
                        style={{
                            flex: 1, overflowY: 'auto', padding: '6px 0',
                            scrollbarWidth: 'none',
                        }}
                    >
                        {comments.length === 0 ? (
                            <div style={{
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                height: '100%', gap: '0.7rem',
                                color: 'rgba(255,255,255,0.3)',
                            }}>
                                <span style={{ fontSize: '2rem', opacity: 0.45 }}>🌊</span>
                                <span style={{
                                    fontFamily: "'Outfit', sans-serif", fontSize: '0.85rem',
                                    textAlign: 'center', padding: '0 2rem',
                                }}>
                                    No echoes yet — send the first ripple
                                </span>
                            </div>
                        ) : (
                            comments.map((c, idx) => (
                                <motion.div
                                    key={c.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.22, delay: idx === comments.length - 1 ? 0 : 0 }}
                                    style={{
                                        display: 'flex', gap: '0.7rem',
                                        padding: '9px 18px', alignItems: 'flex-start',
                                    }}
                                >
                                    <div style={{
                                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                        background: 'linear-gradient(135deg, rgba(45,212,191,0.22), rgba(244,114,182,0.18))',
                                        border: '1px solid rgba(45,212,191,0.28)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.05rem',
                                    }}>
                                        {getAvatar(c.userId)}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem' }}>
                                            <span style={{
                                                fontFamily: "'Outfit', sans-serif", fontWeight: 700,
                                                fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)',
                                            }}>{c.displayName}</span>
                                            <span style={{
                                                fontFamily: "'Outfit', sans-serif", fontSize: '0.64rem',
                                                color: 'rgba(255,255,255,0.3)',
                                            }}>{timeAgo(c.createdAt as unknown as number)}</span>
                                        </div>
                                        <div style={{
                                            fontFamily: "'Outfit', sans-serif", fontSize: '0.88rem',
                                            color: 'rgba(255,255,255,0.84)', lineHeight: 1.45,
                                            marginTop: 3, wordBreak: 'break-word',
                                        }}>{c.text}</div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>

                    {/* ── Input area ── sits above bottom nav ── */}
                    <div style={{
                        flexShrink: 0,
                        padding: '10px 14px',
                        /* Safe area + extra 64px to clear bottom nav */
                        paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 12px))',
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(6,3,16,0.92)',
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                    }}>
                        {/* User avatar */}
                        <div style={{
                            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                            background: 'linear-gradient(135deg, rgba(45,212,191,0.28), rgba(244,114,182,0.22))',
                            border: '1px solid rgba(45,212,191,0.28)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1rem',
                        }}>🧘</div>

                        {/* Input pill */}
                        <div style={{
                            flex: 1, display: 'flex', alignItems: 'center',
                            background: 'rgba(255,255,255,0.08)',
                            border: `1px solid ${hasText ? 'rgba(45,212,191,0.5)' : 'rgba(255,255,255,0.12)'}`,
                            borderRadius: 28,
                            padding: '0 6px 0 16px',
                            gap: '0.4rem',
                            transition: 'border-color 0.25s',
                        }}>
                            <input
                                ref={inputRef}
                                value={text}
                                onChange={e => setText(e.target.value)}
                                onKeyDown={handleKey}
                                className="cs-vibes-input"
                                placeholder={`Write your vibes & ${dayName}'s experience…`}
                                maxLength={300}
                                style={{
                                    flex: 1, background: 'none', border: 'none', outline: 'none',
                                    fontFamily: "'Outfit', sans-serif", fontSize: '0.92rem',
                                    color: 'rgba(255,255,255,0.92)',
                                    padding: '11px 0',
                                    caretColor: '#2DD4BF',
                                }}
                            />

                            {/* Send button */}
                            <motion.button
                                whileTap={{ scale: 0.85 }}
                                onClick={handleSend}
                                disabled={!hasText || sending}
                                style={{
                                    background: hasText
                                        ? 'linear-gradient(135deg, #2DD4BF, #F472B6)'
                                        : 'transparent',
                                    border: 'none', borderRadius: '50%',
                                    width: 36, height: 36, flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: hasText ? 'pointer' : 'default',
                                    transition: 'background 0.25s',
                                    opacity: sending ? 0.7 : 1,
                                }}
                            >
                                {sending ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                                        style={{
                                            width: 16, height: 16,
                                            border: '2px solid rgba(255,255,255,0.7)',
                                            borderTopColor: 'transparent', borderRadius: '50%',
                                        }}
                                    />
                                ) : (
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                                        <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"
                                            stroke={hasText ? 'white' : 'rgba(255,255,255,0.3)'}
                                            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
        </>
    );
}
