'use client';

import { useEffect, useRef } from 'react';
import { useSutraConnectStore } from '@/stores/sutraConnectStore';
import { getTelegramMessagingService } from '@/lib/telegramMessaging';
import type { UnifiedMessage } from '@/lib/sutraConnect.types';

export function GlobalTelegramListener() {
    const contactMap = useSutraConnectStore((s) => s.contactMap);
    const upsertMessages = useSutraConnectStore((s) => s.upsertMessages);
    const incrementUnread = useSutraConnectStore((s) => s.incrementUnread);
    const isTelegramSynced = useSutraConnectStore((s) => s.isTelegramSynced);

    // Build reverse map: telegramUserId -> phone
    // We memoize this inside the effect or just compute it. 
    // Since contactMap can change, we ref it.
    const contactMapRef = useRef(contactMap);
    useEffect(() => {
        contactMapRef.current = contactMap;
    }, [contactMap]);

    useEffect(() => {
        if (!isTelegramSynced) return;

        const telegramService = getTelegramMessagingService();
        if (!telegramService.isReady) return;

        console.log('[GlobalTelegramListener] 🎧 Starting global listener');

        const handleNewMessage = (msg: UnifiedMessage) => {
            console.log('[GlobalTelegramListener] 📨 Received message:', msg.internal_id);

            // Find the contact phone
            // If it's incoming, sender_id is the contact.
            // If it's outgoing, we need to know who it is sent TO. 
            // UnifiedMessage from normalizeMessage puts 'sender_id' as the other person?
            // Let's check normalizeMessage in telegramMessaging.ts.
            
            // In normalizeMessage:
            // const senderId = String(msg.senderId?.value ?? ...);
            // const isMine = senderId === this.currentUserId || msg.out === true;
            // return { sender_id: senderId ... }
            
            // If isMine (outgoing), sender_id is ME. We need the recipient ID (peerId).
            // normalizeMessage seems to set sender_id to the generic sender.
            // If I send a message, sender_id is ME. The message doesn't contain recipient ID in the UnifiedMessage interface explicitly?
            // UnifiedMessage has `sender_id` and `sender_name`.
            
            // Wait, looking at `normalizeMessage`:
            // const senderId = String(msg.senderId?.value ?? ...);
            // It extracts the SENDER.
            
            // For OUTGOING messages, we need to know the CHAT (peer).
            // `normalizeMessage` receives `msg` which is the raw GramJS message.
            // `_raw_telegram` saves it.
            
            let contactTelegramId: string | undefined;

            if (msg.is_mine) {
                // Outgoing: peerId is the contact
                const raw = msg._raw_telegram as any;
                contactTelegramId = String(raw.peerId?.userId?.value ?? '');
            } else {
                // Incoming: sender_id is the contact
                contactTelegramId = msg.sender_id;
            }

            if (!contactTelegramId) return;

            // Find phone from contactMap
            let phone: string | undefined;
            for (const [p, entry] of Object.entries(contactMapRef.current)) {
                if (entry.telegram_user_id === contactTelegramId) {
                    phone = p;
                    break;
                }
            }
            
            console.log(`[GlobalTelegramListener] Mapped ${contactTelegramId} to phone ${phone}`);

            if (phone) {
                // Update messages
                upsertMessages(phone, [msg]);

                // Update unread count if incoming
                if (!msg.is_mine) {
                    incrementUnread(phone);
                }
            }
        };

        const unsubscribe = telegramService.addMessageListener(handleNewMessage);
        return () => {
            unsubscribe();
        };

    }, [isTelegramSynced, upsertMessages, incrementUnread]); // We use ref for contactMap to avoid re-subscribing often

    return null; // This component renders nothing
}
