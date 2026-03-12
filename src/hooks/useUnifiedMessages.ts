'use client';
/**
 * useUnifiedMessages.ts — Phase 3: Data Normalization & In-Memory Merging
 * ─────────────────────────────────────────────────────────────────────────────
 * This hook is the CORE of Sutra Connect's "iMessage model."
 * It simultaneously listens to:
 *   1. Firestore `onSnapshot` — for Native OneSUTRA messages
 *   2. TDLib `updateNewMessage` event — for incoming Telegram messages
 *
 * Both streams are normalised into the `UnifiedMessage` interface, merged into
 * a single array in the Zustand store, and sorted chronologically.
 *
 * IMPORTANT: This hook is chat-scoped. Mount one instance per open conversation.
 *
 * @param contactPhone  - E.164 phone number (used as thread key)
 * @param currentUser   - Firebase auth user (for "is_mine" detection)
 * @param nativeChatId  - Firestore chat doc ID (only if contact is a dual-user)
 * @param tgChatId      - TDLib numeric chat ID (always present if Telegram linked)
 */

import { useEffect, useRef } from 'react';
import type { Unsubscribe } from 'firebase/firestore';
import { getTDLibClient } from '@/lib/tdlib';
import { useSutraConnectStore, selectThread } from '@/stores/sutraConnectStore';
import type { UnifiedMessage, TDLibMessage, DeliveryStatus } from '@/lib/sutraConnect.types';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface UseUnifiedMessagesProps {
    contactPhone: string;
    currentUserId: string;
    currentUserName: string;
    nativeChatId: string | null;   // null if contact is Telegram-only
    tgChatId: number | null;       // null if Telegram not linked
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useUnifiedMessages({
    contactPhone,
    currentUserId,
    currentUserName,
    nativeChatId,
    tgChatId,
}: UseUnifiedMessagesProps) {
    const upsertMessages = useSutraConnectStore((s) => s.upsertMessages);

    // Track listeners for cleanup
    const firestoreUnsubRef = useRef<Unsubscribe | null>(null);
    const telegramUnsubRef = useRef<(() => void) | null>(null);

    // ── Subscribe to Native Firestore messages ─────────────────────────────────
    useEffect(() => {
        if (!nativeChatId || !currentUserId) return;

        let isMounted = true;

        (async () => {
            try {
                const { getFirebaseFirestore } = await import('@/lib/firebase');
                const { collection, query, orderBy, onSnapshot, limitToLast } =
                    await import('firebase/firestore');
                const db = await getFirebaseFirestore();

                const msgsRef = collection(db, 'onesutra_chats', nativeChatId, 'messages');
                const q = query(msgsRef, orderBy('createdAt', 'asc'), limitToLast(100));

                firestoreUnsubRef.current = onSnapshot(q, (snap) => {
                    if (!isMounted) return;

                    const nativeMsgs: UnifiedMessage[] = snap.docs.map((d) => {
                        const data = d.data();
                        const ts = data.createdAt;
                        const ms: number = ts?.toMillis
                            ? ts.toMillis()
                            : ts?.seconds
                                ? ts.seconds * 1000
                                : Date.now();

                        return normalizeNativeMessage(d.id, data, ms, currentUserId);
                    });

                    upsertMessages(contactPhone, nativeMsgs);
                });
            } catch (err) {
                console.error('[UnifiedMessages] Firestore subscription error:', err);
            }
        })();

        return () => {
            isMounted = false;
            firestoreUnsubRef.current?.();
            firestoreUnsubRef.current = null;
        };
    }, [nativeChatId, currentUserId, contactPhone, upsertMessages]);

    // ── Hydrate Telegram history on mount ─────────────────────────────────────
    useEffect(() => {
        if (!tgChatId) return;

        (async () => {
            try {
                const tdlib = getTDLibClient();
                if (!tdlib.isReady) return;

                const history = await tdlib.getChatHistory(tgChatId, 50);
                const tgMsgs: UnifiedMessage[] = history.map((msg) =>
                    normalizeTelegramMessage(msg, currentUserId, tgChatId)
                );

                if (tgMsgs.length > 0) {
                    upsertMessages(contactPhone, tgMsgs);
                }
            } catch (err) {
                console.error('[UnifiedMessages] TDLib history fetch error:', err);
            }
        })();
    }, [tgChatId, currentUserId, contactPhone, upsertMessages]);

    // ── Subscribe to TDLib real-time messages ─────────────────────────────────
    useEffect(() => {
        if (!tgChatId) return;

        const tdlib = getTDLibClient();

        const handler = (rawMsg: unknown) => {
            const msg = rawMsg as TDLibMessage;

            // Filter: only handle messages for THIS specific TDLib chat
            if (msg.chat_id !== tgChatId) return;

            const unified = normalizeTelegramMessage(msg, currentUserId, tgChatId);
            upsertMessages(contactPhone, [unified]);
        };

        telegramUnsubRef.current = tdlib.on('newMessage', handler);

        return () => {
            telegramUnsubRef.current?.();
            telegramUnsubRef.current = null;
        };
    }, [tgChatId, currentUserId, contactPhone, upsertMessages]);

    // Return the unified thread from the store
    const thread = useSutraConnectStore(selectThread(contactPhone));
    return { messages: thread };
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalization Functions — Phase 3 Core Logic
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalises a raw Firestore message document into the UnifiedMessage schema.
 * Source network is always 'NATIVE'.
 */
function normalizeNativeMessage(
    docId: string,
    data: Record<string, unknown>,
    timestampMs: number,
    currentUserId: string
): UnifiedMessage {
    const senderId = (data.senderId as string) ?? '';

    // Map Firestore delivery states to our unified enum
    let deliveryStatus: DeliveryStatus = 'SENT';
    if (data.readAt) deliveryStatus = 'READ';
    if (data.error) deliveryStatus = 'FAILED';

    return {
        internal_id: `NATIVE_${docId}`,
        source_network: 'NATIVE',
        timestamp: timestampMs,
        text: (data.text as string) ?? '',
        sender_id: senderId,
        sender_name: (data.senderName as string) ?? 'Member',
        delivery_status: deliveryStatus,
        is_mine: senderId === currentUserId,
        voice_note_url: (data.voiceNote as { url?: string })?.url,
        _raw_native: data,
    };
}

/**
 * Normalises a TDLib TDLibMessage into the UnifiedMessage schema.
 * Source network is always 'TELEGRAM'.
 */
function normalizeTelegramMessage(
    msg: TDLibMessage,
    currentTgUserId: string,
    chatId: number
): UnifiedMessage {
    // Extract text from TDLib's nested content structure
    let text = '';
    if (msg.content?.['@type'] === 'messageText') {
        text = msg.content.text?.text ?? '';
    } else if (msg.content?.caption) {
        text = msg.content.caption.text ?? '';
    } else {
        text = `[${msg.content?.['@type'] ?? 'Media'}]`;
    }

    // Map TDLib sending_state to our delivery enum
    let deliveryStatus: DeliveryStatus = 'SENT';
    if (msg.sending_state?.['@type'] === 'messageSendingStatePending') {
        deliveryStatus = 'SENDING';
    } else if (msg.sending_state?.['@type'] === 'messageSendingStateFailed') {
        deliveryStatus = 'FAILED';
    }

    const senderId = String(msg.sender_id?.user_id ?? chatId);

    return {
        internal_id: `TELEGRAM_${msg.id}`,
        source_network: 'TELEGRAM',
        timestamp: msg.date * 1000, // TDLib uses Unix seconds; convert to ms
        text,
        sender_id: senderId,
        sender_name: msg.is_outgoing ? 'You' : 'Contact', // Enriched in UI layer
        delivery_status: deliveryStatus,
        is_mine: msg.is_outgoing,
        _raw_telegram: msg,
    };
}
