'use client';
/**
 * AutoPilotBackgroundService
 *
 * Sits in the root layout. Listens to ALL chats the current user is in.
 * When a new incoming message arrives in any chat and AutoPilot is ON,
 * calls /api/autopilot, gets the Gemini reply, and writes it to Firestore.
 *
 * ✅ No firebase-admin  ✅ No new packages  ✅ Works across all pages
 * ❌ Requires app to be open on at least one device (use Firebase Cloud
 *    Functions for true background processing when all tabs are closed)
 */
import { useEffect, useRef } from 'react';

interface Props {
    userId: string | null;
    userName: string;
    isAutoPilotEnabled: boolean;
}

export default function AutoPilotBackgroundService({ userId, userName, isAutoPilotEnabled }: Props) {
    const processedIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!userId || !isAutoPilotEnabled || typeof window === 'undefined') return;

        let unsub: (() => void) | undefined;

        (async () => {
            try {
                const { getFirebaseFirestore } = await import('@/lib/firebase');
                const {
                    collection, query, where, orderBy, limit,
                    onSnapshot, addDoc, updateDoc, doc, setDoc, increment, serverTimestamp,
                } = await import('firebase/firestore');
                const db = await getFirebaseFirestore();

                // Listen to ALL messages across all chats where I'm a participant
                // Strategy: collectionGroup 'messages' where senderId != me AND needsAiReply = true
                const q = query(
                    collection(db, 'onesutra_autopilot_queue'),
                    where('recipientId', '==', userId),
                    where('processed', '==', false),
                    orderBy('createdAt', 'desc'),
                    limit(5),
                );

                unsub = onSnapshot(q, async (snap) => {
                    for (const change of snap.docChanges()) {
                        if (change.type !== 'added') continue;

                        const job = change.doc.data();
                        const jobId = change.doc.id;

                        // De-duplicate — never process same job twice
                        if (processedIds.current.has(jobId)) continue;
                        processedIds.current.add(jobId);

                        const { chatId, messageText, senderId, senderName } = job;

                        // Mark as in-progress immediately (prevents double-processing)
                        await updateDoc(change.doc.ref, { processed: true, processedAt: serverTimestamp() });

                        try {
                            // Get last 10 messages for context
                            const { getDocs, collection: col, orderBy: ob, limit: lim, query: q2 } = await import('firebase/firestore');
                            const ctxSnap = await getDocs(
                                q2(col(db, `onesutra_chats/${chatId}/messages`), ob('createdAt', 'desc'), lim(10))
                            );
                            const context = ctxSnap.docs
                                .reverse()
                                .map(d => `${d.data().senderName}: ${d.data().text}`)
                                .join('\n');

                            // Call Gemini via existing /api/autopilot
                            const res = await fetch('/api/autopilot', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    prompt: `You are an AI proxy for ${userName}. Reply to this message in their voice, max 2 sentences.\n\nChat context:\n${context}\n\nReply as ${userName}:`,
                                }),
                            });
                            const data = await res.json();
                            const aiText = data.text?.trim() || "I'll get back to you! 🙏";

                            // Write AI reply to Firestore
                            const now = serverTimestamp();
                            await addDoc(collection(db, `onesutra_chats/${chatId}/messages`), {
                                text: aiText,
                                senderId: userId,
                                senderName: `${userName} (AI)`,
                                sentBy: 'ai',
                                summarized: false,
                                createdAt: now,
                            });

                            // Update chat metadata
                            await setDoc(doc(db, 'onesutra_chats', chatId), {
                                lastMessage: {
                                    text: aiText,
                                    senderId: userId,
                                    senderName: `${userName} (AI)`,
                                    sentBy: 'ai',
                                    createdAt: now,
                                },
                                [`isAutoPilotActive.${userId}`]: true,
                            }, { merge: true });

                        } catch (err) {
                            console.warn('[AutoPilot] Reply failed for job', jobId, err);
                        }
                    }
                });
            } catch { /* silent — not signed in or no connection */ }
        })();

        return () => unsub?.();
    }, [userId, isAutoPilotEnabled, userName]);

    return null; // renders nothing
}
