'use client';
/**
 * useMessages — Extended with sentBy, voiceNote, and AutoPilot interception
 */
import { useState, useEffect, useCallback } from 'react';
import type { Unsubscribe } from 'firebase/firestore';

export interface VoiceNote {
    url: string;        // Firebase Storage download URL
    durationSec: number;
    transcript?: string;          // Full transcript text
    words?: WordToken[];          // Word-level timing for tap-to-seek
}

export interface WordToken {
    word: string;
    startSec: number;
    endSec: number;
}

export interface ChatMessage {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    createdAt: number;
    sentBy?: 'user' | 'ai';          // 'ai' = AutoPilot generated
    voiceNote?: VoiceNote;           // present for Dhvani audio messages
    deliveryMode?: 'normal' | 'soft' | 'dawn';
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
                        const ms = ts?.toMillis ? ts.toMillis() : (ts?.seconds ? ts.seconds * 1000 : Date.now());
                        return {
                            id: d.id,
                            text: data.text ?? '',
                            senderId: data.senderId ?? '',
                            senderName: data.senderName ?? 'Traveller',
                            createdAt: ms,
                            sentBy: data.sentBy,
                            voiceNote: data.voiceNote,
                            deliveryMode: data.deliveryMode,
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

    const sendMessage = useCallback(async (
        text: string,
        senderName: string,
        extras?: { sentBy?: 'user' | 'ai'; voiceNote?: VoiceNote; deliveryMode?: string }
    ) => {
        if ((!text.trim() && !extras?.voiceNote) || !chatId || !currentUserId) return;
        try {
            const { getFirebaseFirestore } = await import('@/lib/firebase');
            const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
            const db = await getFirebaseFirestore();
            const payload: Record<string, unknown> = {
                text: text.trim(),
                senderId: currentUserId,
                senderName,
                createdAt: serverTimestamp(),
            };
            if (extras?.sentBy) payload.sentBy = extras.sentBy;
            if (extras?.voiceNote) payload.voiceNote = extras.voiceNote;
            if (extras?.deliveryMode) payload.deliveryMode = extras.deliveryMode;

            await addDoc(collection(db, 'onesutra_chats', chatId, 'messages'), payload);
        } catch { /* silent */ }
    }, [chatId, currentUserId]);

    return { messages, loading, sendMessage };
}
