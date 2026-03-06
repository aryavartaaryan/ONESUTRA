'use client';
/**
 * useFCMForeground — Phase 3: Foreground Message Handling
 *
 * Listens for FCM messages when the app is in the foreground.
 * - If the user is already in the active chat with the sender → suppress notification (WhatsApp-style).
 * - Otherwise → show in-app toast via the provided callback.
 *
 * @param activeContactUid - UID of the chat the user is currently viewing (null if not in chat).
 * @param onToast - callback invoked with { senderName, messageText, chatUrl } to display a toast.
 */
import { useEffect } from 'react';

export interface FCMToastPayload {
    senderName: string;
    messageText: string;
    chatUrl: string;
    senderId: string;
}

export function useFCMForeground(
    activeContactUid: string | null,
    onToast: (payload: FCMToastPayload) => void
) {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        let unsub: (() => void) | null = null;

        (async () => {
            try {
                const { onMessage } = await import('firebase/messaging');
                const { getFirebaseMessaging } = await import('@/lib/firebase');
                const messaging = await getFirebaseMessaging();

                unsub = onMessage(messaging, (payload) => {
                    const data = payload.data ?? {};
                    const notification = payload.notification ?? {};

                    const senderId = data.senderId || '';
                    const senderName = notification.title || data.senderName || 'Someone';
                    const messageText = notification.body || data.messageText || '…';
                    const chatUrl = data.chatUrl || '/onesutra';

                    // WhatsApp-style suppression: already viewing that exact chat
                    if (senderId && senderId === activeContactUid) return;

                    // Otherwise display a toast
                    onToast({ senderName, messageText, chatUrl, senderId });
                });
            } catch {
                // FCM unsupported — silently skip
            }
        })();

        return () => { unsub?.(); };
    }, [activeContactUid, onToast]);
}
