import type { Firestore } from 'firebase-admin/firestore';
import type {
    MorningBriefingRequest,
    MorningBriefingResult,
    ToolExecutionContext,
} from '@/lib/agents/types';

export async function morningBriefingTool(
    db: Firestore,
    args: MorningBriefingRequest,
    ctx: ToolExecutionContext
): Promise<MorningBriefingResult> {
    const inboxSnap = await db
        .collection('users')
        .doc(args.userId)
        .collection('gmail_unread')
        .orderBy('receivedAt', 'desc')
        .limit(Math.max(3, Math.min(args.maxEmails ?? 12, 20)))
        .get();

    const contextSnap = await db.doc(`users/${args.userId}/runtime/state`).get();
    const runtime = contextSnap.exists ? contextSnap.data() : {};

    const topItems = inboxSnap.docs.slice(0, 5).map((doc, idx) => {
        const data = doc.data() as { subject?: string; snippet?: string; from?: string };
        const priority: 'high' | 'medium' | 'low' = idx === 0 ? 'high' : idx < 3 ? 'medium' : 'low';
        return {
            id: doc.id,
            subject: data.subject ?? `Unread update ${idx + 1}`,
            priority,
            snippet: data.snippet ?? `From ${data.from ?? 'unknown sender'}`,
        };
    });

    const calmNote = ctx.stressScore > 0.8 ? ' Start with 3 deep breaths before opening high-priority threads.' : '';
    const focusState = runtime?.brahmastraMode?.active ? ' Deep Focus mode is currently active.' : '';

    return {
        summary: `You have ${inboxSnap.size} unread emails. ${topItems.length} have been prioritized for immediate attention.${focusState}${calmNote}`,
        topItems,
    };
}
