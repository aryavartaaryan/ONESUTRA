'use client';
/**
 * GlobalAutoPilot — wraps the AutoPilotBackgroundService with auth.
 * Placed in root layout so it runs on every page.
 */
import { useEffect, useState } from 'react';
import AutoPilotBackgroundService from '@/components/AutoPilotBackgroundService';

export default function GlobalAutoPilot() {
    const [userId, setUserId] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>('User');
    const [isAutoPilotEnabled, setIsAutoPilotEnabled] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        (async () => {
            try {
                const { getFirebaseAuth } = await import('@/lib/firebase');
                const { onAuthStateChanged } = await import('firebase/auth');
                const auth = await getFirebaseAuth();

                onAuthStateChanged(auth, async (user) => {
                    if (!user) { setUserId(null); return; }
                    setUserId(user.uid);
                    setUserName((user.displayName ?? user.email ?? 'User').split(' ')[0]);

                    // Fetch AutoPilot preference from Firestore
                    try {
                        const { getFirebaseFirestore } = await import('@/lib/firebase');
                        const { doc, getDoc } = await import('firebase/firestore');
                        const db = await getFirebaseFirestore();
                        const snap = await getDoc(doc(db, 'onesutra_users', user.uid));
                        setIsAutoPilotEnabled(snap.data()?.isAutoPilotEnabled ?? false);
                    } catch { /* offline */ }
                });
            } catch { /* no auth */ }
        })();
    }, []);

    return (
        <AutoPilotBackgroundService
            userId={userId}
            userName={userName}
            isAutoPilotEnabled={isAutoPilotEnabled}
        />
    );
}
