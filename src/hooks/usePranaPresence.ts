'use client';
/**
 * usePranaPresence — Firestore-based typing presence.
 * Writes to onesutra_chats/{chatId}/presence/{userId} while user is typing.
 * Reads remote user's presence to show the Prana breathing indicator.
 */
import { useState, useEffect, useCallback, useRef } from 'react';

export function usePranaPresence(chatId: string | null, myId: string | null, remoteId: string | null) {
    const [remoteIsPresent, setRemoteIsPresent] = useState(false);
    const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Listen to remote user presence
    useEffect(() => {
        if (!chatId || !remoteId || typeof window === 'undefined') return;
        let unsub: (() => void) | null = null;

        (async () => {
            try {
                const { getFirebaseFirestore } = await import('@/lib/firebase');
                const { doc, onSnapshot } = await import('firebase/firestore');
                const db = await getFirebaseFirestore();
                unsub = onSnapshot(
                    doc(db, 'onesutra_chats', chatId, 'presence', remoteId),
                    (snap) => setRemoteIsPresent(snap.exists() && snap.data()?.active === true)
                );
            } catch { /* no presence doc yet is fine */ }
        })();

        return () => { unsub?.(); };
    }, [chatId, remoteId]);

    // Publish my own presence (call on input focus/change)
    const markTyping = useCallback(async () => {
        if (!chatId || !myId) return;
        try {
            const { getFirebaseFirestore } = await import('@/lib/firebase');
            const { doc, setDoc, deleteDoc } = await import('firebase/firestore');
            const db = await getFirebaseFirestore();
            const ref = doc(db, 'onesutra_chats', chatId, 'presence', myId);
            await setDoc(ref, { active: true, updatedAt: Date.now() });

            // Auto-clear after 5s of no typing
            if (clearTimer.current) clearTimeout(clearTimer.current);
            clearTimer.current = setTimeout(() => deleteDoc(ref).catch(() => { }), 5000);
        } catch { /* ignore */ }
    }, [chatId, myId]);

    const clearTyping = useCallback(async () => {
        if (!chatId || !myId) return;
        if (clearTimer.current) clearTimeout(clearTimer.current);
        try {
            const { getFirebaseFirestore } = await import('@/lib/firebase');
            const { doc, deleteDoc } = await import('firebase/firestore');
            const db = await getFirebaseFirestore();
            await deleteDoc(doc(db, 'onesutra_chats', chatId, 'presence', myId));
        } catch { /* ignore */ }
    }, [chatId, myId]);

    return { remoteIsPresent, markTyping, clearTyping };
}
