'use client';
// ─────────────────────────────────────────────────────────────────────────────
//  usePostReactions  — real-time Firebase + optimistic updates (Instagram-style)
//  Tracks: Vibe (heart) · Echo (comment) · Plant (save/bookmark)
//  Optimistic: counts change instantly on tap, confirmed by server snapshot
//  Offline-safe: errors silently swallowed
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Unsubscribe } from 'firebase/firestore';

export interface Comment {
    id: string;
    text: string;
    userId: string;
    displayName: string;
    avatar: string;
    createdAt: number;
}

export interface ReactionsState {
    // Counts (all start at 0, grow with real interactions)
    heartCount: number;
    commentCount: number;
    plantCount: number;

    // User state
    hasHearted: boolean;
    hasPlanted: boolean;

    // Comments list (real-time)
    comments: Comment[];
    loading: boolean;

    // Actions
    toggleHeart: () => void;
    addComment: (text: string) => Promise<void>;
    togglePlant: () => void;
}

function getAnonUserId(): string {
    if (typeof window === 'undefined') return 'anon';
    let uid = localStorage.getItem('pranaverse_uid');
    if (!uid) {
        uid = 'user_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
        localStorage.setItem('pranaverse_uid', uid);
    }
    return uid;
}

function getDisplayName(): string {
    if (typeof window === 'undefined') return 'Traveller';
    return localStorage.getItem('vedic_user_name') || 'Traveller';
}

export function usePostReactions(postId: string | number): ReactionsState {
    const pid = String(postId);
    const userId = useRef(getAnonUserId());

    // ── Server-confirmed state ────────────────────────────────────────────────
    const [heartCount, setHeartCount] = useState(0);
    const [commentCount, setCommentCount] = useState(0);
    const [plantCount, setPlantCount] = useState(0);
    const [hasHearted, setHasHearted] = useState(false);
    const [hasPlanted, setHasPlanted] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);

    // ── Optimistic deltas ─────────────────────────────────────────────────────
    const [optHeart, setOptHeart] = useState(0);
    const [optHasHearted, setOptHasHearted] = useState<boolean | null>(null);
    const [optPlant, setOptPlant] = useState(0);
    const [optHasPlanted, setOptHasPlanted] = useState<boolean | null>(null);

    // ── Firebase subscriptions ─────────────────────────────────────────────────
    useEffect(() => {
        if (typeof window === 'undefined') return;
        setOptHeart(0); setOptHasHearted(null);
        setOptPlant(0); setOptHasPlanted(null);
        setLoading(true);

        let unsubPost: Unsubscribe | null = null;
        let unsubHeart: Unsubscribe | null = null;
        let unsubPlant: Unsubscribe | null = null;
        let unsubComments: Unsubscribe | null = null;

        (async () => {
            try {
                const { getFirebaseFirestore } = await import('@/lib/firebase');
                const {
                    doc, collection, onSnapshot, setDoc, getDoc,
                    addDoc, updateDoc, increment, serverTimestamp,
                    query, orderBy,
                } = await import('firebase/firestore');

                const db = await getFirebaseFirestore();
                const postRef = doc(db, 'pranaverse_posts', pid);

                // Ensure the document exists with all zero counts
                const snap = await getDoc(postRef).catch(() => null);
                if (snap && !snap.exists()) {
                    await setDoc(postRef, { heartCount: 0, commentCount: 0, plantCount: 0 }).catch(() => null);
                }

                // ── Live aggregate counts (single subscription) ───────────────
                unsubPost = onSnapshot(postRef, (s) => {
                    const d = s.data();
                    // Always clamp to >=0 — guards against stale bad Firestore writes
                    setHeartCount(Math.max(0, d?.heartCount ?? 0));
                    setCommentCount(Math.max(0, d?.commentCount ?? 0));
                    setPlantCount(Math.max(0, d?.plantCount ?? 0));
                    setLoading(false);
                    // Only clear optimistic once server value has propagated
                    setOptHeart(0); setOptHasHearted(null);
                    setOptPlant(0); setOptHasPlanted(null);
                }, () => setLoading(false));

                // ── Current user's heart state ────────────────────────────────
                const heartRef = doc(db, 'pranaverse_posts', pid, 'hearts', userId.current);
                unsubHeart = onSnapshot(heartRef, (s) => setHasHearted(s.exists()), () => null);

                // ── Current user's plant state ────────────────────────────────
                const plantRef = doc(db, 'pranaverse_posts', pid, 'plants', userId.current);
                unsubPlant = onSnapshot(plantRef, (s) => setHasPlanted(s.exists()), () => null);

                // ── Live comments (newest at bottom, like Instagram) ───────────
                const commentsRef = collection(db, 'pranaverse_posts', pid, 'comments');
                const q = query(commentsRef, orderBy('createdAt', 'asc'));
                unsubComments = onSnapshot(q, (qs) => {
                    setComments(qs.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Comment, 'id'>) })));
                }, () => null);

            } catch {
                setLoading(false);
            }
        })();

        return () => {
            unsubPost?.(); unsubHeart?.(); unsubPlant?.(); unsubComments?.();
        };
    }, [pid]);

    // ── Toggle Vibe (heart) — optimistic ─────────────────────────────────────
    const toggleHeart = useCallback(() => {
        const currentlyHearted = optHasHearted !== null ? optHasHearted : hasHearted;
        const delta = currentlyHearted ? -1 : 1;
        setOptHasHearted(!currentlyHearted);
        setOptHeart(prev => prev + delta);

        (async () => {
            try {
                const { getFirebaseFirestore } = await import('@/lib/firebase');
                const { doc, deleteDoc, setDoc, serverTimestamp, increment } = await import('firebase/firestore');
                const db = await getFirebaseFirestore();
                const heartRef = doc(db, 'pranaverse_posts', pid, 'hearts', userId.current);
                const postRef = doc(db, 'pranaverse_posts', pid);
                if (currentlyHearted) {
                    await deleteDoc(heartRef);
                    // Use setDoc+merge so it works even if doc doesn't exist yet
                    await setDoc(postRef, { heartCount: increment(-1) }, { merge: true });
                } else {
                    await setDoc(heartRef, { userId: userId.current, createdAt: serverTimestamp() }, { merge: true });
                    // Only touch heartCount — never reset other counts
                    await setDoc(postRef, { heartCount: increment(1) }, { merge: true });
                }
            } catch {
                setOptHasHearted(null); setOptHeart(0);
            }
        })();
    }, [pid, hasHearted, optHasHearted]);

    // ── Toggle Plant (save/bookmark) — optimistic ─────────────────────────────
    const togglePlant = useCallback(() => {
        const currentlyPlanted = optHasPlanted !== null ? optHasPlanted : hasPlanted;
        const delta = currentlyPlanted ? -1 : 1;
        setOptHasPlanted(!currentlyPlanted);
        setOptPlant(prev => prev + delta);

        (async () => {
            try {
                const { getFirebaseFirestore } = await import('@/lib/firebase');
                const { doc, deleteDoc, setDoc, serverTimestamp, increment } = await import('firebase/firestore');
                const db = await getFirebaseFirestore();
                const plantRef = doc(db, 'pranaverse_posts', pid, 'plants', userId.current);
                const postRef = doc(db, 'pranaverse_posts', pid);
                if (currentlyPlanted) {
                    await deleteDoc(plantRef);
                    await setDoc(postRef, { plantCount: increment(-1) }, { merge: true });
                } else {
                    await setDoc(plantRef, { userId: userId.current, createdAt: serverTimestamp() }, { merge: true });
                    // Only touch plantCount — never reset other counts
                    await setDoc(postRef, { plantCount: increment(1) }, { merge: true });
                }
            } catch {
                setOptHasPlanted(null); setOptPlant(0);
            }
        })();
    }, [pid, hasPlanted, optHasPlanted]);

    // ── Add Echo (comment) ────────────────────────────────────────────────────
    const addComment = useCallback(async (text: string) => {
        if (!text.trim()) return;
        try {
            const { getFirebaseFirestore } = await import('@/lib/firebase');
            const { doc, collection, addDoc, setDoc, serverTimestamp, increment } = await import('firebase/firestore');
            const db = await getFirebaseFirestore();
            await addDoc(collection(db, 'pranaverse_posts', pid, 'comments'), {
                text: text.trim(),
                userId: userId.current,
                displayName: getDisplayName(),
                avatar: '🧘',
                createdAt: serverTimestamp(),
            });
            // Only touch commentCount — never reset other counts
            await setDoc(doc(db, 'pranaverse_posts', pid), { commentCount: increment(1) }, { merge: true });
        } catch { /* silent */ }
    }, [pid]);

    return {
        // Math.max(0) ensures we never display negative counts in UI
        heartCount: Math.max(0, heartCount + optHeart),
        commentCount: Math.max(0, commentCount),
        plantCount: Math.max(0, plantCount + optPlant),
        hasHearted: optHasHearted !== null ? optHasHearted : hasHearted,
        hasPlanted: optHasPlanted !== null ? optHasPlanted : hasPlanted,
        comments,
        loading,
        toggleHeart,
        addComment,
        togglePlant,
    };
}
