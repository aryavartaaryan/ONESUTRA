import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';
import type {
    AgentTransitionDocument,
    DharmaTaskDocument,
    LifeGoalCategory,
} from '@/lib/agents/types';

const USERS_COLLECTION = 'users';

export class AgentMemoryStore {
    constructor(private readonly db: Firestore) {}

    async createDharmaTask(input: {
        userId: string;
        title: string;
        description?: string;
        lifeGoal: LifeGoalCategory;
        priority?: DharmaTaskDocument['priority'];
        toolName?: string;
        metadata?: Record<string, unknown>;
    }): Promise<DharmaTaskDocument> {
        const ref = this.db.collection(USERS_COLLECTION).doc(input.userId).collection('dharma_tasks').doc();
        const now = Timestamp.now();

        const task: DharmaTaskDocument = {
            id: ref.id,
            userId: input.userId,
            title: input.title,
            description: input.description,
            lifeGoal: input.lifeGoal,
            status: 'queued',
            priority: input.priority ?? 'high',
            source: 'sakha_bodhi',
            toolName: input.toolName,
            metadata: input.metadata,
            createdAt: now,
            updatedAt: now,
        };

        await ref.set(task);
        return task;
    }

    async updateTaskStatus(params: {
        userId: string;
        taskId: string;
        status: DharmaTaskDocument['status'];
        metadata?: Record<string, unknown>;
    }): Promise<void> {
        const ref = this.db.collection(USERS_COLLECTION).doc(params.userId).collection('dharma_tasks').doc(params.taskId);

        await ref.set(
            {
                status: params.status,
                metadata: params.metadata ?? FieldValue.delete(),
                updatedAt: Timestamp.now(),
            },
            { merge: true }
        );
    }

    async logTransition(transition: Omit<AgentTransitionDocument, 'createdAt'>): Promise<void> {
        await this.db
            .collection(USERS_COLLECTION)
            .doc(transition.userId)
            .collection('agent_transitions')
            .add({
                ...transition,
                createdAt: Timestamp.now(),
            });
    }

    async setBrahmastraState(params: {
        userId: string;
        active: boolean;
        focusWindowMinutes: number;
        reason?: string;
        impactedMeetingIds?: string[];
    }): Promise<string> {
        const path = `${USERS_COLLECTION}/${params.userId}/runtime/state`;
        const ref = this.db.doc(path);
        const now = Timestamp.now();
        const endAt = Timestamp.fromMillis(now.toMillis() + params.focusWindowMinutes * 60 * 1000);

        await ref.set(
            {
                brahmastraMode: {
                    active: params.active,
                    reason: params.reason ?? 'Deep focus ritual',
                    startedAt: now,
                    endAt,
                    impactedMeetingIds: params.impactedMeetingIds ?? [],
                },
                interruptionShield: params.active,
                updatedAt: now,
            },
            { merge: true }
        );

        return path;
    }
}
