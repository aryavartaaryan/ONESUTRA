'use client';
/**
 * useChats — Listens to the high-level chat metadata documents.
 * Each doc in onesutra_chats/{chatId} holds:
 *   lastMessage { text, senderId, senderName, createdAt }
 *   unreadCounts { [userId]: number }
 *   isAutoPilotActive { [userId]: boolean }
 *   vibe: 'URGENT' | 'CALM' | 'DEEP' | null
 *   tatvaSummary: string | null   (AI 6-word summary)
 */
import { useState, useEffect } from 'react';
import type { Unsubscribe } from 'firebase/firestore';

export interface ChatMeta {
    chatId: string;
    lastMessageText: string;
    lastMessageSenderId: string;
    lastMessageAt: number;
    unreadCount: number;        // for the current user
    isAutoPilotActive: boolean; // current user has AutoPilot on for this chat
    vibe: 'URGENT' | 'CALM' | 'DEEP' | null;
    tatvaSummary: string | null;
}

/**
 * Returns a map of chatId → ChatMeta for any chats the currentUser is in.
 * chatIds: list of chatIds to watch (derived from contact list).
 */
export function useChats(chatIds: string[], currentUserId: string | null): Map<string, ChatMeta> {
    const [chatMap, setChatMap] = useState<Map<string, ChatMeta>>(new Map());

    useEffect(() => {
        if (!currentUserId || chatIds.length === 0 || typeof window === 'undefined') {
            setChatMap(new Map());
            return;
        }

        const unsubs: Unsubscribe[] = [];

        (async () => {
            try {
                const { getFirebaseFirestore } = await import('@/lib/firebase');
                const { doc, onSnapshot } = await import('firebase/firestore');
                const db = await getFirebaseFirestore();

                chatIds.forEach(chatId => {
                    const unsub = onSnapshot(doc(db, 'onesutra_chats', chatId), (snap) => {
                        const data = snap.data();
                        if (!data) return;

                        const ts = data.lastMessage?.createdAt;
                        const lastAt = ts?.toMillis ? ts.toMillis() : (ts?.seconds ? ts.seconds * 1000 : 0);

                        const meta: ChatMeta = {
                            chatId,
                            lastMessageText: data.lastMessage?.text ?? '',
                            lastMessageSenderId: data.lastMessage?.senderId ?? '',
                            lastMessageAt: lastAt,
                            unreadCount: data.unreadCounts?.[currentUserId] ?? 0,
                            isAutoPilotActive: data.isAutoPilotActive?.[currentUserId] ?? false,
                            vibe: data.vibe ?? null,
                            tatvaSummary: data.tatvaSummary ?? null,
                        };

                        setChatMap(prev => new Map(prev).set(chatId, meta));
                    });
                    unsubs.push(unsub);
                });
            } catch { /* no chat docs yet — normal */ }
        })();

        return () => unsubs.forEach(u => u());
    }, [JSON.stringify(chatIds), currentUserId]); // eslint-disable-line react-hooks/exhaustive-deps

    return chatMap;
}
