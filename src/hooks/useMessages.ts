'use client';
/**
 * useMessages — Real-time Firestore messages for OneSutra 1:1 chats
 *
 * chatId = [uid1, uid2].sort().join('_')
 * Collection: onesutra_chats/{chatId}/messages
 * Fields: { text, senderId, senderName, createdAt }
 */
import { useState, useEffect, useCallback } from 'react';
import type { Unsubscribe } from 'firebase/firestore';

export interface ChatMessage {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    createdAt: number; // ms timestamp (converted from Firestore Timestamp)
}

export function getChatId(uid1: string, uid2: string): string {
    return [uid1, uid2].sort().join('_');
}

export function useMessages(chatId: string | null, currentUserId: string | null) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!chatId || !currentUserId || typeof window === 'undefined') {
            setMessages([]);
            return;
        }
        setLoading(true);

        let unsub: Unsubscribe | null = null;

        (async () => {
            try {
                const { getFirebaseFirestore } = await import('@/lib/firebase');
                const { collection, query, orderBy, onSnapshot } = await import('firebase/firestore');
                const db = await getFirebaseFirestore();

                const msgsRef = collection(db, 'onesutra_chats', chatId, 'messages');
                const q = query(msgsRef, orderBy('createdAt', 'asc'));

                unsub = onSnapshot(q, (snap) => {
                    setMessages(snap.docs.map(d => {
                        const data = d.data();
                        const ts = data.createdAt;
                        // Convert Firestore Timestamp -> ms
                        const ms = ts?.toMillis ? ts.toMillis() : (ts?.seconds ? ts.seconds * 1000 : Date.now());
                        return {
                            id: d.id,
                            text: data.text ?? '',
                            senderId: data.senderId ?? '',
                            senderName: data.senderName ?? 'Traveller',
                            createdAt: ms,
                        };
                    }));
                    setLoading(false);
                }, () => setLoading(false));
            } catch {
                setLoading(false);
            }
        })();

        return () => { unsub?.(); };
    }, [chatId, currentUserId]);

    const sendMessage = useCallback(async (text: string, senderName: string) => {
        if (!text.trim() || !chatId || !currentUserId) return;
        try {
            const { getFirebaseFirestore } = await import('@/lib/firebase');
            const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
            const db = await getFirebaseFirestore();
            await addDoc(collection(db, 'onesutra_chats', chatId, 'messages'), {
                text: text.trim(),
                senderId: currentUserId,
                senderName,
                createdAt: serverTimestamp(),
            });
        } catch { /* silent */ }
    }, [chatId, currentUserId]);

    return { messages, loading, sendMessage };
}
