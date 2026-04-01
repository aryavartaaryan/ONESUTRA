'use client';

/**
 * InviteCard.tsx — Viral Growth Engine for PranaVerse
 *
 * ARCHITECTURE:
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. DESIGN: "Aether-Glass" frosted glassmorphism, deep dark-mode twilight
 *    tones, glowing purple/cyan border, Bodhi-leaf spark icon.
 *
 * 2. SHARE ENGINE:
 *    - Primary: navigator.share() — triggers the mobile OS native share sheet
 *      (WhatsApp, Telegram, Messages etc.) with pre-filled text + link.
 *    - Fallback: navigator.clipboard.writeText() — copies link to clipboard.
 *    - If both fail: displays the link in the fallback toast.
 *
 * 3. INVITE LINK: dynamically constructed as:
 *    https://pranaverse.app/join/[slug]
 *    where slug = user display name lowercased and hyphenated.
 *    Falls back to 'you' for unauthenticated users.
 *
 * 4. DISMISSABLE: stored in sessionStorage — card stays hidden for the
 *    duration of the browser session once dismissed.
 *
 * USAGE:
 *    <InviteCard userName="Pranav" />
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ─────────────────────────────────────────────────────────────────────

interface InviteCardProps {
    /** User's display name from auth. Used to build the invite link slug. */
    userName?: string | null;
    /** Additional Tailwind/inline class for card wrapper positioning. */
    className?: string;
    /** Optional style overrides for the card wrapper. */
    style?: React.CSSProperties;
}

// ── Dismiss key — resets each page load (useState, not sessionStorage) ─────

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Slugify a display name into a URL-safe handle. */
function toSlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 32);
}

/** Build the personalised invite link. */
function buildInviteLink(userName?: string | null): string {
    const slug = userName ? toSlug(userName) : 'you';
    return `https://pranaverse.app/join/${slug}`;
}

/** Build the viral share payload with the dynamic link injected. */
function buildSharePayload(inviteLink: string): { title: string; text: string; url: string } {
    return {
        title: '🚀 PranaVerse — Social Media, Reimagined',
        text: `🚀 Social media is broken. Today, we fix it. Welcome to the PranaVerse.

I am thrilled to announce the official launch of PranaVerse—an ultra-modern social platform built entirely to upgrade our quality of life, health, and real connections.

Think of it as the wellness equivalent of the metaverse. Instead of endless, draining feeds, PranaVerse gives you an interactive "Aether Profile" to track your sleep, energy, and daily habits while connecting you with people on the exact same wavelength.

We've engineered our algorithms completely differently. Instead of hijacking your focus, our platform is specifically designed to increase your attention span. The high-quality feeds inside are curated to help you achieve a better work-life balance, recover from burnout, and optimize your sleep cycles. Plus, our ultra-smart AI buddy, Bodhi, is built right into the app to assist and guide you.

The app is officially live. We aren't building external groups; all of our founding members are connecting and growing together directly inside the platform.

Step inside, claim your username before it's taken, and secure your 3D Avatar right here:
👉 ${inviteLink}

Let's build a healthier digital world together! ⚡ Proudly Made in Bharat 🇮🇳`,
        url: inviteLink,
    };
}

// ── Bodhi Leaf / Spark Icon (inline SVG) ─────────────────────────────────────

function BodhiSparkIcon({ color = '#a78bfa' }: { color?: string }) {
    return (
        <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
        >
            {/* Glowing halo */}
            <circle cx="16" cy="16" r="14" fill={`${color}18`} />
            <circle cx="16" cy="16" r="10" fill={`${color}22`} />

            {/* Bodhi leaf shape */}
            <path
                d="M16 6 C10 6 6 10.5 6 16 C6 20 8 23 12 24.5 C13 25 14.5 25.5 16 25.5 C17.5 25.5 19 25 20 24.5 C24 23 26 20 26 16 C26 10.5 22 6 16 6 Z"
                fill={`${color}30`}
                stroke={color}
                strokeWidth="1.2"
            />

            {/* Central vein */}
            <line
                x1="16" y1="8"
                x2="16" y2="24"
                stroke={`${color}cc`}
                strokeWidth="0.9"
                strokeLinecap="round"
            />

            {/* Lateral veins */}
            <path
                d="M16 13 Q12 14 10 16 M16 13 Q20 14 22 16 M16 17 Q12 18 10 20 M16 17 Q20 18 22 20"
                stroke={`${color}88`}
                strokeWidth="0.7"
                strokeLinecap="round"
                fill="none"
            />

            {/* Spark particles */}
            <circle cx="16" cy="4" r="1.5" fill={color} opacity="0.85" />
            <circle cx="28" cy="10" r="1" fill={color} opacity="0.65" />
            <circle cx="4" cy="22" r="1" fill={color} opacity="0.55" />
            <circle cx="27" cy="24" r="0.8" fill="#22d3ee" opacity="0.8" />
        </svg>
    );
}

// ── Toast sub-component ───────────────────────────────────────────────────────

function Toast({ message, visible }: { message: string; visible: boolean }) {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    key="toast"
                    initial={{ opacity: 0, y: 12, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.94 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                    style={{
                        position: 'fixed',
                        bottom: 'calc(env(safe-area-inset-bottom) + 80px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 10600,
                        pointerEvents: 'none',
                        background: 'rgba(10, 5, 30, 0.92)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(167,139,250,0.35)',
                        borderRadius: 999,
                        padding: '0.55rem 1.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 8px 32px rgba(139,92,246,0.3)',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <span style={{ fontSize: '1rem' }}>✅</span>
                    <span style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: '#e2d9f3',
                        letterSpacing: '0.02em',
                    }}>
                        {message}
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function InviteCard({ userName, className, style }: InviteCardProps) {
    const [dismissed, setDismissed] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [toastMsg, setToastMsg] = useState('');
    const [toastVisible, setToastVisible] = useState(false);

    const inviteLink = buildInviteLink(userName);

    // ── Show toast helper ─────────────────────────────────────────────────
    const showToast = useCallback((msg: string) => {
        setToastMsg(msg);
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 3200);
    }, []);

    // ── Share handler — Web Share API → clipboard → inline toast ─────────
    const handleInvite = useCallback(async () => {
        if (isSharing) return;
        setIsSharing(true);

        const payload = buildSharePayload(inviteLink);

        try {
            // 1️⃣ Try native Web Share API (works on mobile browsers, Safari, Chrome Android)
            if (typeof navigator !== 'undefined' && navigator.share) {
                await navigator.share({
                    title: payload.title,
                    text: payload.text,
                    url: payload.url,
                });
                // Native share sheet was opened — success (no toast needed)
                setIsSharing(false);
                return;
            }

            // 2️⃣ Fallback: copy invite link to clipboard
            if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(inviteLink);
                showToast('Invite link copied to clipboard! ✨');
                setIsSharing(false);
                return;
            }

            // 3️⃣ Last resort: execCommand (legacy browsers)
            const el = document.createElement('textarea');
            el.value = inviteLink;
            el.style.position = 'absolute';
            el.style.left = '-9999px';
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            showToast('Invite link copied! ✨');
        } catch (err: unknown) {
            // User cancelled share sheet — no error needed
            if ((err as Error)?.name !== 'AbortError') {
                showToast(`Share: ${inviteLink}`);
            }
        } finally {
            setIsSharing(false);
        }
    }, [inviteLink, isSharing, showToast]);


    if (dismissed) return <Toast message={toastMsg} visible={toastVisible} />;

    return (
        <>
            {/* ── Toast notification ────────────────────────────────────── */}
            <Toast message={toastMsg} visible={toastVisible} />

            {/* ── Card ─────────────────────────────────────────────────── */}
            <motion.div
                key="invite-card"
                initial={{ opacity: 0, y: 18, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26, delay: 0.1 }}
                className={className}
                style={{
                    position: 'relative',
                    borderRadius: 22,
                    padding: '1.25rem 1.25rem 1.4rem',
                    margin: '1rem 0.75rem',
                    /* Aether-Glass: deep dark twilight with frosted glass */
                    background: 'linear-gradient(135deg, rgba(14,6,42,0.94) 0%, rgba(8,3,26,0.96) 100%)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    /* Glowing gradient border */
                    border: '1px solid transparent',
                    backgroundClip: 'padding-box',
                    boxShadow: [
                        '0 0 0 1px rgba(139,92,246,0.35)',
                        '0 0 0 2px rgba(34,211,238,0.10)',
                        '0 8px 40px rgba(88,28,135,0.35)',
                        '0 32px 80px rgba(0,0,0,0.45)',
                        'inset 0 1px 0 rgba(255,255,255,0.08)',
                    ].join(', '),
                    overflow: 'hidden',
                    ...style,
                }}
            >
                {/* ── Ambient background glow ───────────────────────────── */}
                <div
                    aria-hidden
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: [
                            'radial-gradient(ellipse at 15% 20%, rgba(139,92,246,0.22) 0%, transparent 55%)',
                            'radial-gradient(ellipse at 85% 80%, rgba(34,211,238,0.12) 0%, transparent 45%)',
                        ].join(', '),
                        pointerEvents: 'none',
                    }}
                />

                {/* ── Dismiss (X) button — reappears on next page load ─── */}
                <button
                    onClick={() => setDismissed(true)}
                    aria-label="Dismiss invite card"
                    style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        zIndex: 10,
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.16)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'rgba(255,255,255,0.55)',
                        fontSize: '0.75rem',
                        lineHeight: 1,
                        padding: 0,
                        transition: 'background 0.15s',
                    }}
                >
                    ✕
                </button>

                {/* ── Header row: icon + "PranaVerse" badge ─────────────── */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                    position: 'relative',
                    zIndex: 1,
                }}>
                    {/* Glowing icon orb */}
                    <motion.div
                        animate={{
                            boxShadow: [
                                '0 0 16px rgba(167,139,250,0.5), 0 0 40px rgba(139,92,246,0.2)',
                                '0 0 28px rgba(167,139,250,0.8), 0 0 60px rgba(139,92,246,0.3)',
                                '0 0 16px rgba(167,139,250,0.5), 0 0 40px rgba(139,92,246,0.2)',
                            ],
                        }}
                        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            background: 'radial-gradient(circle at 38% 32%, rgba(167,139,250,0.3) 0%, rgba(10,5,30,0.9) 70%)',
                            border: '1px solid rgba(167,139,250,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <BodhiSparkIcon color="#a78bfa" />
                    </motion.div>

                    {/* Brand badge */}
                    <div>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: 'rgba(139,92,246,0.12)',
                            border: '1px solid rgba(139,92,246,0.28)',
                            borderRadius: 999,
                            padding: '0.14rem 0.6rem',
                            marginBottom: '0.2rem',
                        }}>
                            <span style={{ fontSize: '0.55rem' }}>✦</span>
                            <span style={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: '0.52rem',
                                fontWeight: 700,
                                letterSpacing: '0.12em',
                                color: '#a78bfa',
                                textTransform: 'uppercase',
                            }}>
                                PranaVerse
                            </span>
                        </div>

                        {/* "Made in Bharat" pill */}
                        <div style={{
                            fontSize: '0.5rem',
                            color: 'rgba(255,255,255,0.38)',
                            fontFamily: "'Inter', sans-serif",
                            letterSpacing: '0.05em',
                        }}>
                            ⚡ Proudly Made in Bharat 🇮🇳
                        </div>
                    </div>
                </div>

                {/* ── Headline ─────────────────────────────────────────── */}
                <h3 style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 'clamp(1.05rem, 4vw, 1.3rem)',
                    fontWeight: 800,
                    color: '#fff',
                    margin: '0 0 0.55rem',
                    lineHeight: 1.25,
                    letterSpacing: '-0.01em',
                    position: 'relative',
                    zIndex: 1,
                    /* Subtle glow on the headline */
                    textShadow: '0 0 40px rgba(167,139,250,0.35)',
                }}>
                    🚀 Social Media Is Broken. We Fix It.
                </h3>

                {/* ── Divider ───────────────────────────────────────────── */}
                <div style={{
                    width: '100%',
                    height: 1,
                    background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.3), rgba(34,211,238,0.2), transparent)',
                    marginBottom: '0.75rem',
                    position: 'relative',
                    zIndex: 1,
                }} />

                {/* ── Subtext ───────────────────────────────────────────── */}
                <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 'clamp(0.72rem, 2.8vw, 0.82rem)',
                    color: 'rgba(220,210,255,0.75)',
                    margin: '0 0 1.2rem',
                    lineHeight: 1.65,
                    letterSpacing: '0.01em',
                    position: 'relative',
                    zIndex: 1,
                }}>
                    Welcome to{' '}
                    <span style={{ color: '#a78bfa', fontWeight: 600 }}>PranaVerse</span>
                    {' '}— your complete{' '}
                    <span style={{ color: '#22d3ee', fontWeight: 600 }}>Life Management System</span>.
                    {' '}Enhanced, simplified & automated — not addictive.
                    Healthy feeds, healthy connections, and AI that works{' '}
                    <span style={{ color: '#86efac', fontWeight: 600 }}>for you, not against you</span>.
                    Invite your circle — free them today. ✨
                </p>

                {/* ── CTA Button ────────────────────────────────────────── */}
                <motion.button
                    whileHover={{
                        scale: 1.03,
                        boxShadow: [
                            '0 0 0 1px rgba(167,139,250,0.6)',
                            '0 8px 40px rgba(139,92,246,0.55)',
                            '0 0 80px rgba(139,92,246,0.2)',
                        ].join(', '),
                    }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                    onClick={handleInvite}
                    disabled={isSharing}
                    aria-label="Invite friends to PranaVerse"
                    style={{
                        width: '100%',
                        padding: '0.85rem 1.2rem',
                        borderRadius: 999,
                        /* Premium gradient pill */
                        background: isSharing
                            ? 'rgba(139,92,246,0.3)'
                            : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 45%, #4f46e5 100%)',
                        border: '1px solid rgba(167,139,250,0.45)',
                        boxShadow: [
                            '0 0 0 1px rgba(167,139,250,0.28)',
                            '0 6px 28px rgba(109,40,217,0.45)',
                            'inset 0 1px 0 rgba(255,255,255,0.15)',
                        ].join(', '),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        cursor: isSharing ? 'default' : 'pointer',
                        position: 'relative',
                        zIndex: 1,
                        overflow: 'hidden',
                    }}
                >
                    {/* Button shimmer layer */}
                    {!isSharing && (
                        <motion.div
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                                pointerEvents: 'none',
                            }}
                        />
                    )}

                    <span style={{ fontSize: '1rem' }}>
                        {isSharing ? '⏳' : '✨'}
                    </span>
                    <span style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 'clamp(0.8rem, 3vw, 0.92rem)',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        color: '#fff',
                        textShadow: '0 1px 8px rgba(0,0,0,0.4)',
                    }}>
                        {isSharing ? 'Opening Share…' : 'Invite to PranaVerse'}
                    </span>
                </motion.button>

                {/* ── Invite link hint ──────────────────────────────────── */}
                <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.54rem',
                    color: 'rgba(255,255,255,0.25)',
                    textAlign: 'center',
                    margin: '0.65rem 0 0',
                    letterSpacing: '0.04em',
                    position: 'relative',
                    zIndex: 1,
                    wordBreak: 'break-all',
                }}>
                    {inviteLink}
                </p>
            </motion.div>
        </>
    );
}
