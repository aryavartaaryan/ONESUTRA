'use client';
/**
 * useFCMToken — Phase 1: Token Management
 *
 * Requests notification permission, fetches the FCM device token, saves it
 * to Firestore onesutra_users/{uid}.fcmTokens (array, deduped via arrayUnion).
 * Call once in your authenticated root component.
 */
import { useEffect } from 'react';
import { saveOrUpdateFCMToken } from '@/lib/firebase';

export function useFCMToken(uid: string | null) {
    useEffect(() => {
        if (!uid || typeof window === 'undefined') return;

        async function setup() {
            try {
                // 1. Check / request permission — returns 'granted' immediately if already allowed
                const permission = await Notification.requestPermission();
                console.log('[FCM-TOKEN] Notification permission:', permission);
                if (permission !== 'granted') {
                    console.warn('[FCM-TOKEN] Permission not granted, aborting');
                    return;
                }

                // 2. Check VAPID key
                const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
                console.log('[FCM-TOKEN] VAPID key present:', !!vapidKey, vapidKey?.slice(0, 10));
                if (!vapidKey) {
                    console.error('[FCM-TOKEN] NEXT_PUBLIC_FIREBASE_VAPID_KEY is missing!');
                    return;
                }

                // 3. Lazy-load FCM
                const { getToken } = await import('firebase/messaging');
                const { getFirebaseMessaging } = await import('@/lib/firebase');
                const messaging = await getFirebaseMessaging();
                console.log('[FCM-TOKEN] Messaging initialized');

                // 4. Register service worker
                const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                await navigator.serviceWorker.ready;
                console.log('[FCM-TOKEN] Service worker registered:', swReg.scope);

                // 5. Get FCM token
                const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swReg });
                console.log('[FCM-TOKEN] Token received:', token ? token.slice(0, 30) + '...' : 'EMPTY');

                if (token && uid) {
                    await saveOrUpdateFCMToken(uid, token);
                    console.log('[FCM-TOKEN] ✅ Token saved to onesutra_users/' + uid);
                } else {
                    console.warn('[FCM-TOKEN] No token returned from getToken()');
                }
            } catch (err) {
                console.error('[FCM-TOKEN] ❌ Token setup failed:', err);
            }
        }

        setup();
    }, [uid]);
}
