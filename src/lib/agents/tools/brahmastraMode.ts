import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import type {
    BrahmastraRequest,
    BrahmastraResult,
    CalendarEventDocument,
    ToolExecutionContext,
} from '@/lib/agents/types';
import { AgentMemoryStore } from '@/lib/agents/memoryStore';

function isNonEssentialMeeting(event: CalendarEventDocument): boolean {
    if (event.essential === false) return true;
    if ((event.priorityScore ?? 1) < 0.55) return true;
    const title = event.title.toLowerCase();
    return /sync|standup|catch.?up|optional|check.?in/.test(title);
}

export async function brahmastraModeTool(
    db: Firestore,
    args: BrahmastraRequest,
    _ctx: ToolExecutionContext
): Promise<BrahmastraResult> {
    const memoryStore = new AgentMemoryStore(db);
    const focusWindowMinutes = Math.max(30, Math.min(args.minutes ?? 120, 240));

    const eventsRef = db.collection('users').doc(args.userId).collection('calendar_events');
    const nowIso = new Date().toISOString();
    const snapshot = await eventsRef
        .where('status', '==', 'scheduled')
        .where('startAt', '>=', nowIso)
        .limit(20)
        .get();

    const impactedMeetingIds: string[] = [];

    if (!args.dryRun) {
        const batch = db.batch();

        for (const doc of snapshot.docs) {
            const data = doc.data() as CalendarEventDocument;
            if (!isNonEssentialMeeting(data)) continue;

            impactedMeetingIds.push(doc.id);
            batch.set(
                doc.ref,
                {
                    status: 'reschedule_proposed',
                    updatedAt: Timestamp.now(),
                    updatedBy: 'sakha_bodhi.brahmastra_mode',
                    rescheduleReason: 'Deep Focus Window',
                },
                { merge: true }
            );
        }

        await batch.commit();
    } else {
        for (const doc of snapshot.docs) {
            const data = doc.data() as CalendarEventDocument;
            if (isNonEssentialMeeting(data)) impactedMeetingIds.push(doc.id);
        }
    }

    const userStatePath = await memoryStore.setBrahmastraState({
        userId: args.userId,
        active: true,
        focusWindowMinutes,
        reason: args.reason,
        impactedMeetingIds,
    });

    return {
        activated: true,
        focusWindowMinutes,
        cancelledOrRescheduledCount: impactedMeetingIds.length,
        impactedMeetingIds,
        userStatePath,
        summary:
            impactedMeetingIds.length > 0
                ? `Brahmastra Mode active. ${impactedMeetingIds.length} non-essential meetings moved to reschedule queue.`
                : 'Brahmastra Mode active. No non-essential meetings were found in the upcoming schedule.',
    };
}
