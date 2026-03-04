'use client';
// ─────────────────────────────────────────────────────────────────────────────
//  ReactionBar — PranaVerse's sacred take on social reactions
//  ✨ Vibe  |  🪬 Echo  |  🌐 Radiate
//  All counts backed by Firebase Firestore real-time onSnapshot
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useCallback } from 'react';
import { usePostReactions } from '@/hooks/usePostReactions';
import CommentSheet from './CommentSheet';
import ShareSheet from './ShareSheet';
import styles from './reactions.module.css';

interface ReactionBarProps {
    postId: string | number;
    caption: string;
    authorHandle: string;
    emoji?: string;
}

export default function ReactionBar({ postId, caption, authorHandle, emoji }: ReactionBarProps) {
    const {
        heartCount,
        commentCount,
        hasHearted,
        comments,
        loading,
        toggleHeart,
        addComment,
    } = usePostReactions(postId);

    const [showComments, setShowComments] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [ripple, setRipple] = useState(false);

    const handleVibe = useCallback(() => {
        toggleHeart();
        if (!hasHearted) {
            setRipple(true);
            setTimeout(() => setRipple(false), 600);
        }
    }, [toggleHeart, hasHearted]);

    function fmt(n: number): string {
        if (loading) return '…';
        if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k';
        return String(n);
    }

    return (
        <>
            <div className={styles.reactionBar}>

                {/* ── ✨ Vibe (Heart) ─────────────────────────── */}
                <button
                    className={`${styles.reactionBtn} ${styles.vibeBtn} ${hasHearted ? styles.active : ''}`}
                    onClick={handleVibe}
                    aria-label={hasHearted ? 'Remove Vibe' : 'Send Vibe'}
                >
                    {ripple && <span className={styles.vibeRipple} />}
                    <span className={styles.reactionIcon}>
                        {hasHearted ? '❤️‍🔥' : '🤍'}
                    </span>
                    <span className={styles.reactionCount}>{fmt(heartCount)}</span>
                    <span className={styles.reactionLabel}>{hasHearted ? 'Vibed' : 'Vibe'}</span>
                </button>

                {/* ── 🪬 Echo (Comment) ──────────────────────── */}
                <button
                    className={`${styles.reactionBtn} ${styles.echoBtn} ${showComments ? styles.active : ''}`}
                    onClick={() => setShowComments(true)}
                    aria-label="Open Echoes"
                >
                    <span className={styles.reactionIcon}>🪬</span>
                    <span className={styles.reactionCount}>{fmt(commentCount)}</span>
                    <span className={styles.reactionLabel}>Echo</span>
                </button>

                {/* ── ⚡ Radiate (Share) ─────────────────────── */}
                <button
                    className={`${styles.reactionBtn} ${styles.radiateBtn} ${showShare ? styles.active : ''}`}
                    onClick={() => setShowShare(true)}
                    aria-label="Radiate this vibe"
                >
                    <span className={styles.reactionIcon}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                            style={{
                                filter: showShare ? 'drop-shadow(0 0 5px rgba(255,200,80,0.9))' : 'none',
                                transition: 'filter 0.3s',
                            }}>
                            <circle cx="12" cy="12" r="2.5" fill={showShare ? '#FFD050' : 'currentColor'} />
                            <line x1="12" y1="3" x2="12" y2="6.5" stroke={showShare ? '#FFD050' : 'currentColor'} strokeWidth="2" strokeLinecap="round" />
                            <line x1="12" y1="17.5" x2="12" y2="21" stroke={showShare ? '#FFD050' : 'currentColor'} strokeWidth="2" strokeLinecap="round" />
                            <line x1="3" y1="12" x2="6.5" y2="12" stroke={showShare ? '#FFD050' : 'currentColor'} strokeWidth="2" strokeLinecap="round" />
                            <line x1="17.5" y1="12" x2="21" y2="12" stroke={showShare ? '#FFD050' : 'currentColor'} strokeWidth="2" strokeLinecap="round" />
                            <line x1="5.64" y1="5.64" x2="7.87" y2="7.87" stroke={showShare ? '#FFD050' : 'currentColor'} strokeWidth="1.6" strokeLinecap="round" />
                            <line x1="16.13" y1="16.13" x2="18.36" y2="18.36" stroke={showShare ? '#FFD050' : 'currentColor'} strokeWidth="1.6" strokeLinecap="round" />
                            <line x1="18.36" y1="5.64" x2="16.13" y2="7.87" stroke={showShare ? '#FFD050' : 'currentColor'} strokeWidth="1.6" strokeLinecap="round" />
                            <line x1="7.87" y1="16.13" x2="5.64" y2="18.36" stroke={showShare ? '#FFD050' : 'currentColor'} strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                    </span>
                    <span className={styles.reactionLabel}>Radiate</span>
                </button>

            </div>

            {/* ── Comment Sheet ─────────────────────────────── */}
            {showComments && (
                <CommentSheet
                    postCaption={caption}
                    commentCount={commentCount}
                    comments={comments}
                    onClose={() => setShowComments(false)}
                    onAddComment={addComment}
                />
            )}

            {/* ── Share Sheet ───────────────────────────────── */}
            {showShare && (
                <ShareSheet
                    postId={postId}
                    caption={caption}
                    authorHandle={authorHandle}
                    emoji={emoji}
                    onClose={() => setShowShare(false)}
                />
            )}
        </>
    );
}
