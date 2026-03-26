/**
 * contextInjector.ts — Sakha Bodhi Tiered Memory Context Builder
 * ─────────────────────────────────────────────────────────────────
 * Queries Firestore across 3 tiers and formats the full LLM context:
 *
 *   Tier 0 — Session Metadata  : last seen timestamp, time-gap calculation
 *   Tier 1 — Short-Term Memory : last 20 raw conversation turns
 *   Tier 2 — Long-Term Insights: AI-summarized user profile + key moments
 *
 * This module is imported by useSakhaConversation.ts to build the
 * dynamic system prompt before every Gemini Live session.
 */

import { getFirebaseFirestore } from '@/lib/firebase';
import {
    doc,
    getDoc,
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    setDoc,
    serverTimestamp,
} from 'firebase/firestore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShortTermMessage {
    role: 'user' | 'bodhi';
    text: string;
    timestamp: number; // ms since epoch
}

export interface LongTermInsight {
    category: 'identity' | 'goal' | 'struggle' | 'milestone' | 'preference' | 'relationship' | 'health' | 'spiritual';
    insight: string;
    savedAt: number;
}

export interface BodhiMemoryContext {
    // Time-awareness
    currentTimeIST: string;        // "8:15 AM"
    lastSeenIST: string | null;    // "Yesterday at 9:00 PM" or null if first session
    timeSinceLastChat: string;     // "2 hours ago", "3 days ago", "Never spoken before"
    timeSinceLastChatMinutes: number; // Raw number for branching logic

    // Short-term (recent conversation flow)
    recentHistory: ShortTermMessage[];
    recentHistoryText: string;     // Pre-formatted for system prompt injection

    // Long-term (key user insights)
    longTermInsights: LongTermInsight[];
    longTermInsightsText: string;  // Pre-formatted for system prompt injection

    // Core memories (from core_memory subcollection + bodhi_memories field)
    coreMemories: string[];
}

// ─── Time Formatting Helpers ──────────────────────────────────────────────────

function formatISTTime(ms: number): string {
    return new Date(ms).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}

function formatTimeGap(diffMs: number): { label: string; minutes: number } {
    const minutes = Math.floor(diffMs / 60_000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);

    let label: string;
    if (minutes < 1) label = 'moments ago';
    else if (minutes < 60) label = `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    else if (hours < 24) label = `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    else if (days < 7) label = `${days} day${days !== 1 ? 's' : ''} ago`;
    else if (weeks < 5) label = `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    else label = `${months} month${months !== 1 ? 's' : ''} ago`;

    return { label, minutes };
}

// ─── Main Context Loader ──────────────────────────────────────────────────────

export async function loadBodhiContext(userId: string): Promise<BodhiMemoryContext> {
    const db = await getFirebaseFirestore();
    const now = Date.now();
    const nowIST = formatISTTime(now);

    // ── Tier 0: Session metadata & time gap ──────────────────────────────────
    const metaRef = doc(db, 'users', userId, 'bodhi_sessions', 'meta');
    const metaSnap = await getDoc(metaRef);
    const lastSeenMs: number | null = metaSnap.exists()
        ? (metaSnap.data()?.lastSeenAt?.toMillis?.() ?? null)
        : null;

    const { label: timeSinceLabel, minutes: timeSinceMinutes } = lastSeenMs
        ? formatTimeGap(now - lastSeenMs)
        : { label: 'Never spoken before', minutes: Infinity };

    const lastSeenIST = lastSeenMs ? formatISTTime(lastSeenMs) : null;

    // ── Tier 1: Short-term messages (last 20 turns) ──────────────────────────
    const stmSnap = await getDocs(
        query(
            collection(db, 'users', userId, 'short_term_messages'),
            orderBy('timestamp', 'desc'),
            limit(20)
        )
    );
    const recentHistory: ShortTermMessage[] = stmSnap.docs
        .map(d => d.data() as ShortTermMessage)
        .reverse(); // oldest-first for narrative order

    const recentHistoryText = recentHistory.length > 0
        ? recentHistory
            .map(m => `[${m.role === 'user' ? 'User' : 'Bodhi'}]: ${m.text}`)
            .join('\n')
        : 'No recent conversation history.';

    // ── Tier 2: Long-term insights ──────────────────────────────────────────
    const ltiSnap = await getDocs(
        query(
            collection(db, 'users', userId, 'long_term_insights'),
            orderBy('savedAt', 'desc'),
            limit(15)
        )
    );
    const longTermInsights: LongTermInsight[] = ltiSnap.docs.map(d => d.data() as LongTermInsight);

    const longTermInsightsText = longTermInsights.length > 0
        ? longTermInsights
            .map(i => `[${i.category.toUpperCase()}] ${i.insight}`)
            .join('\n')
        : 'No long-term insights stored yet.';

    // ── Core memories (from core_memory + legacy bodhi_memories) ────────────
    const [coreSnap, userSnap] = await Promise.all([
        getDocs(
            query(
                collection(db, 'users', userId, 'core_memory'),
                orderBy('createdAt', 'desc'),
                limit(25)
            )
        ),
        getDoc(doc(db, 'users', userId)),
    ]);
    const subcolFacts = coreSnap.docs.map(d => (d.data() as any).fact as string).filter(Boolean);
    const legacyFacts: string[] = userSnap.exists()
        ? (Array.isArray(userSnap.data()?.bodhi_memories) ? userSnap.data()!.bodhi_memories : [])
        : [];
    const coreMemories = Array.from(new Set([...subcolFacts, ...legacyFacts]));

    // ── Update lastSeenAt for next session gap calculation ───────────────────
    // Fire-and-forget — don't await so it doesn't slow session start
    setDoc(metaRef, { lastSeenAt: serverTimestamp() }, { merge: true }).catch(() => { });

    return {
        currentTimeIST: nowIST,
        lastSeenIST,
        timeSinceLastChat: timeSinceLabel,
        timeSinceLastChatMinutes: timeSinceMinutes,
        recentHistory,
        recentHistoryText,
        longTermInsights,
        longTermInsightsText,
        coreMemories,
    };
}

// ─── Save a Short-Term Message ────────────────────────────────────────────────

/**
 * Call this after EVERY Bodhi ↔ User exchange to keep short_term_messages fresh.
 * This is the raw, unprocessed turn log. The Cloud Function will summarize it.
 */
export async function saveShortTermMessage(
    userId: string,
    role: 'user' | 'bodhi',
    text: string
): Promise<void> {
    if (!userId || !text.trim()) return;
    const db = await getFirebaseFirestore();
    const { addDoc } = await import('firebase/firestore');
    await addDoc(collection(db, 'users', userId, 'short_term_messages'), {
        role,
        text: text.trim(),
        timestamp: Date.now(),
        summarized: false, // Cloud Function will flip this to true after summarization
    } as ShortTermMessage & { summarized: boolean });
}

// ─── Save a Long-Term Insight ─────────────────────────────────────────────────

/**
 * Call this when Bodhi detects a key user insight worth remembering permanently.
 * Use this for milestones, identity facts, major goals — NOT daily chit-chat.
 */
export async function saveLongTermInsight(
    userId: string,
    category: LongTermInsight['category'],
    insight: string
): Promise<void> {
    if (!userId || !insight.trim()) return;
    const db = await getFirebaseFirestore();
    const { addDoc } = await import('firebase/firestore');
    await addDoc(collection(db, 'users', userId, 'long_term_insights'), {
        category,
        insight: insight.trim(),
        savedAt: Date.now(),
    } as LongTermInsight);
}
