'use client';
/**
 * useNewMessageAlert — Listens globally for NEW incoming unread messages
 * and returns the latest alert so the home page can auto-trigger Bodhi.
 *
 * Works by watching each chat document in Firestore. On the very first
 * snapshot it records the current state (so page-load messages don't
 * appear as "new"). Any subsequent update with a fresher timestamp AND
 * the sender is NOT the current user AND there is an unread count fires
 * the alert.
 */
import { useState, useEffect, useRef } from 'react';
import { useUsers } from './useUsers';
import { getChatId } from './useMessages';

export interface MessageAlert {
    name: string;       // sender display name
    messageText: string;
    uid: string;        // sender uid
    chatId: string;
}

export function useNewMessageAlert(userId: string | null): {
    alert: MessageAlert | null;
    clearAlert: () => void;
} {
    const { users: realUsers } = useUsers(userId);
    const realContacts = realUsers.filter(
        u => u.uid !== 'ai_vaidya' && u.uid !== 'ai_rishi'
    );
    const [alert, setAlert] = useState<MessageAlert | null>(null);

    // chatId → last message timestamp we've seen
    const lastSeenRef = useRef<Map<string, number>>(new Map());

    // Stable serialised key so Effect only re-runs when the contact list changes
    const contactsKey = realContacts.map(c => c.uid).sort().join(',');

    useEffect(() => {
        if (!userId || realContacts.length === 0 || typeof window === 'undefined') return;

        const unsubs: Array<() => void> = [];

        (async () => {
            try {
                const { getFirebaseFirestore } = await import('@/lib/firebase');
                const { doc, onSnapshot } = await import('firebase/firestore');
                const db = await getFirebaseFirestore();

                realContacts.forEach(contact => {
                    const chatId = getChatId(userId, contact.uid);
                    let isFirstSnapshot = true;

                    const unsub = onSnapshot(doc(db, 'onesutra_chats', chatId), snap => {
                        const data = snap.data();

                        // On first snapshot just record the baseline; never alert.
                        if (isFirstSnapshot) {
                            isFirstSnapshot = false;
                            if (data) {
                                const ts = data.lastMessage?.createdAt;
                                const at: number = ts?.toMillis
                                    ? ts.toMillis()
                                    : ts?.seconds
                                        ? ts.seconds * 1000
                                        : Date.now();
                                lastSeenRef.current.set(chatId, at);
                            }
                            return;
                        }

                        if (!data) return;

                        const ts = data.lastMessage?.createdAt;
                        const lastAt: number = ts?.toMillis
                            ? ts.toMillis()
                            : ts?.seconds
                                ? ts.seconds * 1000
                                : 0;

                        const senderId: string = data.lastMessage?.senderId ?? '';
                        const unreadCount: number = data.unreadCounts?.[userId] ?? 0;
                        const lastSeen = lastSeenRef.current.get(chatId) ?? 0;

                        if (
                            senderId !== userId &&   // message is FROM someone else
                            unreadCount > 0 &&        // there is an unread count
                            lastAt > lastSeen &&       // timestamp is newer than what we saw
                            lastAt > 0
                        ) {
                            const messageText: string = data.lastMessage?.text ?? '';
                            setAlert({ name: contact.name, messageText, uid: contact.uid, chatId });
                        }

                        lastSeenRef.current.set(chatId, Math.max(lastSeen, lastAt));
                    });

                    unsubs.push(unsub);
                });
            } catch { /* Firestore unavailable — silently ignore */ }
        })();

        return () => unsubs.forEach(u => u());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, contactsKey]);

    const clearAlert = () => setAlert(null);

    return { alert, clearAlert };
}
