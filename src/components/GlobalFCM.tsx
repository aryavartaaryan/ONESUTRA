'use client';

import React, { useState, useCallback } from 'react';
import { useOneSutraAuth } from '@/hooks/useOneSutraAuth';
import { useFCMToken } from '@/hooks/useFCMToken';
import { useFCMForeground, type FCMToastPayload } from '@/hooks/useFCMForeground';
import { FCMToast } from '@/components/FCMToast';

/**
 * GlobalFCM ensures push notifications are listened to regardless of
 * the current route the user is on (e.g., HomePage, VedicRasoi, Settings).
 */
export default function GlobalFCM() {
    const { user } = useOneSutraAuth();
    const [fcmToast, setFcmToast] = useState<FCMToastPayload | null>(null);

    // Register device token on auth
    useFCMToken(user?.uid ?? null);

    // Foreground message handler (WhatsApp-style suppression)
    // Here we pass null for activeChatId because we don't know the route state,
    // so any incoming notification while the app is open should theoretically toast.
    const handleFCMToast = useCallback((payload: FCMToastPayload) => {
        // If the URL contains onesutra, we might want to suppress it if it's the active chat,
        // but for global, we'll let the user tap it to navigate if desired.
        setFcmToast(payload);
    }, []);

    useFCMForeground(null, handleFCMToast);

    if (!fcmToast) return null;

    return (
        <FCMToast
            senderName={fcmToast.senderName}
            messageText={fcmToast.messageText}
            chatUrl={fcmToast.chatUrl}
            onDismiss={() => setFcmToast(null)}
        />
    );
}
