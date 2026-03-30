'use client';
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './reactions.module.css';

interface ShareSheetProps {
    postId: string | number;
    caption: string;
    authorHandle: string;
    emoji?: string;
    onClose: () => void;
}

function buildShareUrl(postId: string | number): string {
    if (typeof window === 'undefined') return '';
    // Always link directly to the specific reel page for immersive sharing
    return `${window.location.origin}/pranaverse/reel/${postId}`;
}

const SHARE_TARGETS = (url: string, text: string) => [
    {
        key: 'whatsapp',
        label: 'WhatsApp',
        icon: '💬',
        circleClass: styles.shareIconWhatsapp,
        href: `https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n\n🌟 Join PranaVerse — the world\'s most conscious social network\n' + url)}`,
    },
    {
        key: 'facebook',
        label: 'Facebook',
        icon: '👤',
        circleClass: styles.shareIconFacebook,
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
        key: 'twitter',
        label: 'Twitter / X',
        icon: '𝕏',
        circleClass: styles.shareIconTwitter,
        href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    },
    {
        key: 'copy',
        label: 'Copy Link',
        icon: '🔗',
        circleClass: styles.shareIconCopy,
        href: null,
    },
];

export default function ShareSheet({ postId, caption, authorHandle, emoji, onClose }: ShareSheetProps) {
    const [copied, setCopied] = useState(false);
    const shareUrl = buildShareUrl(postId);
    const shareText = `✨ "${caption}" — ${authorHandle} on PranaVerse`;

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            // Fallback for older browsers
            const el = document.createElement('textarea');
            el.value = shareUrl;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    }, [shareUrl]);

    const handleNativeShare = useCallback(async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title: 'PranaVerse', text: shareText, url: shareUrl });
                onClose();
            } catch { /* cancelled */ }
        }
    }, [shareUrl, shareText, onClose]);

    const targets = SHARE_TARGETS(shareUrl, shareText);

    return (
        <AnimatePresence>
            <motion.div
                className={styles.backdrop}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className={`${styles.sheet} ${styles.shareSheet}`}
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={styles.sheetHandle} />

                    <div className={styles.sheetHeader}>
                        <div>
                            <div className={styles.sheetTitle}>🌐 Radiate this Vibe</div>
                            <div className={styles.sheetSubtitle}>Spread conscious energy</div>
                        </div>
                        <button className={styles.sheetCloseBtn} onClick={onClose}>✕</button>
                    </div>

                    {/* Post preview */}
                    <div className={styles.sharePostPreview}>
                        <div className={styles.sharePostIcon}>{emoji || '✨'}</div>
                        <div className={styles.sharePostText}>
                            <span className={styles.sharePostAuthor}>{authorHandle}</span>
                            <span className={styles.sharePostCaption}>{caption}</span>
                        </div>
                    </div>

                    <div className={styles.shareDivider} style={{ marginTop: 14 }} />

                    {/* Share targets */}
                    <div className={styles.shareGrid}>
                        {targets.map((t) =>
                            t.href ? (
                                <a
                                    key={t.key}
                                    className={styles.shareTarget}
                                    href={t.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={onClose}
                                >
                                    <div className={`${styles.shareIconCircle} ${t.circleClass}`}>{t.icon}</div>
                                    <span className={styles.shareTargetLabel}>{t.label}</span>
                                </a>
                            ) : (
                                <button key={t.key} className={styles.shareTarget} onClick={handleCopy}>
                                    <div className={`${styles.shareIconCircle} ${t.circleClass}`}>{t.icon}</div>
                                    <span className={styles.shareTargetLabel}>{copied ? 'Copied!' : t.label}</span>
                                </button>
                            )
                        )}
                    </div>

                    {/* Native share on mobile */}
                    {typeof navigator !== 'undefined' && 'share' in navigator && (
                        <>
                            <div className={styles.shareDivider} />
                            <div style={{ padding: '8px 18px 2px' }}>
                                <button
                                    onClick={handleNativeShare}
                                    style={{
                                        width: '100%',
                                        padding: '11px',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        background: 'rgba(255,255,255,0.06)',
                                        color: 'rgba(255,255,255,0.75)',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        letterSpacing: '0.03em',
                                    }}
                                >
                                    ↗ More options…
                                </button>
                            </div>
                        </>
                    )}

                    {copied && (
                        <div className={styles.copySuccessMsg}>✓ Link copied to clipboard!</div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
