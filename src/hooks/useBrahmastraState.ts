'use client';

import { useEffect, useState } from 'react';

export interface BrahmastraStateSnapshot {
    active: boolean;
    focusWindowMinutes: number;
    impactedMeetings: number;
    reason?: string;
}

export function useBrahmastraState(userId: string | null | undefined) {
    const [state, setState] = useState<BrahmastraStateSnapshot>({
        active: false,
        focusWindowMinutes: 120,
        impactedMeetings: 0,
    });

    useEffect(() => {
        if (!userId) {
            setState({ active: false, focusWindowMinutes: 120, impactedMeetings: 0 });
            return;
        }

        let unsub: (() => void) | undefined;

        (async () => {
            try {
                const { getFirebaseFirestore } = await import('@/lib/firebase');
                const { doc, onSnapshot } = await import('firebase/firestore');
                const db = await getFirebaseFirestore();
                const ref = doc(db, 'users', userId, 'runtime', 'state');

                unsub = onSnapshot(ref, (snap) => {
                    if (!snap.exists()) {
                        setState({ active: false, focusWindowMinutes: 120, impactedMeetings: 0 });
                        return;
                    }

                    const data = snap.data() as {
                        brahmastraMode?: {
                            active?: boolean;
                            reason?: string;
                            startedAt?: { seconds?: number };
                            endAt?: { seconds?: number };
                            impactedMeetingIds?: string[];
                        };
                    };

                    const mode = data?.brahmastraMode;
                    const startSec = mode?.startedAt?.seconds ?? 0;
                    const endSec = mode?.endAt?.seconds ?? 0;
                    const focusWindowMinutes =
                        startSec > 0 && endSec > startSec ? Math.max(1, Math.round((endSec - startSec) / 60)) : 120;

                    setState({
                        active: Boolean(mode?.active),
                        focusWindowMinutes,
                        impactedMeetings: (mode?.impactedMeetingIds ?? []).length,
                        reason: mode?.reason,
                    });
                });
            } catch (error) {
                console.warn('[BrahmastraState] Unable to attach runtime listener', error);
            }
        })();

        return () => {
            if (unsub) unsub();
        };
    }, [userId]);

    return state;
}
