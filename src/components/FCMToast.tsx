'use client';
/**
 * FCMToast — Phase 3: In-App Foreground Notification Toast
 *
 * A premium animated toast that appears when a new message arrives
 * and the user is not in that specific chat. Click to navigate.
 * Auto-dismisses after 5 seconds with a smooth slide-out.
 */
import React, { useState, useEffect, useCallback } from 'react';

interface FCMToastProps {
    senderName: string;
    messageText: string;
    chatUrl: string;
    onDismiss: () => void;
}

export function FCMToast({ senderName, messageText, chatUrl, onDismiss }: FCMToastProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Trigger enter animation on mount
        const showTimer = setTimeout(() => setVisible(true), 30);
        // Auto-dismiss after 5 s
        const hideTimer = setTimeout(() => {
            setVisible(false);
            setTimeout(onDismiss, 350); // wait for slide-out animation
        }, 5000);
        return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
    }, [onDismiss]);

    const handleClick = useCallback(() => {
        setVisible(false);
        setTimeout(() => {
            onDismiss();
            window.location.href = chatUrl;
        }, 300);
    }, [chatUrl, onDismiss]);

    const handleDismiss = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setVisible(false);
        setTimeout(onDismiss, 350);
    }, [onDismiss]);

    return (
        <div
            onClick={handleClick}
            style={{
                position: 'fixed',
                top: '1rem',
                right: '1rem',
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem 1.1rem',
                borderRadius: '1rem',
                background: 'rgba(15, 15, 30, 0.92)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(99,102,241,0.1)',
                cursor: 'pointer',
                maxWidth: '320px',
                minWidth: '260px',
                transform: visible ? 'translateX(0)' : 'translateX(calc(100% + 1.5rem))',
                opacity: visible ? 1 : 0,
                transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
            }}
        >
            {/* Avatar circle */}
            <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                fontSize: '1rem', fontWeight: 700, color: '#fff',
            }}>
                {senderName.charAt(0).toUpperCase()}
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: '0.78rem', fontWeight: 700,
                    color: 'rgba(199,210,254,0.95)',
                    letterSpacing: '0.02em',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    {senderName}
                </div>
                <div style={{
                    fontSize: '0.73rem',
                    color: 'rgba(165,180,252,0.75)',
                    marginTop: '0.15rem',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    {messageText}
                </div>
            </div>

            {/* Progress bar */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: '2px', borderRadius: '0 0 1rem 1rem',
                background: 'rgba(99,102,241,0.2)',
                overflow: 'hidden',
            }}>
                <div style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                    animation: 'fcm-progress 5s linear forwards',
                }} />
            </div>

            {/* Dismiss ×  */}
            <button
                onClick={handleDismiss}
                style={{
                    background: 'none', border: 'none',
                    color: 'rgba(165,180,252,0.5)',
                    cursor: 'pointer', fontSize: '1rem',
                    lineHeight: 1, padding: '0.2rem',
                    flexShrink: 0,
                }}
                aria-label="Dismiss notification"
            >
                ×
            </button>

            <style>{`@keyframes fcm-progress { from { width: 100%; } to { width: 0%; } }`}</style>
        </div>
    );
}
