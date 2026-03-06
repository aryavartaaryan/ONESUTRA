/**
 * POST /api/send-notification — FCM Trigger
 *
 * Queries Firestore for the receiver's FCM tokens and sends via FCM HTTP v1.
 * Automatically removes stale tokens on registration errors.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, cert, getApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

function getAdminApp() {
    if (getApps().length > 0) return getApp();
    const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!json) throw new Error('[FCM] FIREBASE_SERVICE_ACCOUNT_JSON not set');
    const sa = JSON.parse(json);
    return initializeApp({ credential: cert(sa) });
}

export async function POST(req: NextRequest) {
    try {
        const { senderId, senderName, receiverId, messageText, chatId } = await req.json();

        if (!senderId || !senderName || !receiverId || !messageText || !chatId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (senderId === receiverId) {
            return NextResponse.json({ success: true, sent: 0, skipped: 'self' });
        }

        const app = getAdminApp();
        const db = getFirestore(app);
        const messaging = getMessaging(app);

        // Fetch receiver's FCM tokens from Firestore
        const userSnap = await db.collection('onesutra_users').doc(receiverId).get();
        if (!userSnap.exists) {
            console.log(`[FCM] User ${receiverId} not found in onesutra_users collection`);
            return NextResponse.json({ success: true, sent: 0, reason: 'user-not-found' });
        }

        const fcmTokens: string[] = userSnap.data()?.fcmTokens ?? [];
        console.log(`[FCM] Found ${fcmTokens.length} tokens for user ${receiverId}`);

        if (fcmTokens.length === 0) {
            return NextResponse.json({ success: true, sent: 0, reason: 'no-tokens' });
        }

        const chatUrl = `/onesutra?chat=${chatId}&contact=${senderId}`;

        const results = await Promise.allSettled(
            fcmTokens.map(async (token) => {
                try {
                    await messaging.send({
                        token,
                        notification: {
                            title: senderName,
                            body: messageText.length > 100
                                ? messageText.slice(0, 97) + '…'
                                : messageText,
                        },
                        data: {
                            senderId,
                            senderName,
                            messageText: messageText.slice(0, 200),
                            chatId,
                            chatUrl,
                        },
                        webpush: {
                            notification: {
                                icon: '/images/OurLogo.png',
                                badge: '/images/OurLogo.png',
                                tag: chatId,
                                renotify: true,
                            },
                            fcmOptions: { link: chatUrl },
                        },
                    });
                    return { token, status: 'sent' };
                } catch (err: any) {
                    const code: string = err?.errorInfo?.code ?? err?.code ?? '';
                    console.error(`[FCM] Token send failed: ${code}`, token.slice(0, 20));
                    if (
                        code === 'messaging/registration-token-not-registered' ||
                        code === 'messaging/invalid-registration-token' ||
                        code === 'messaging/invalid-argument'
                    ) {
                        await db.collection('onesutra_users').doc(receiverId).update({
                            fcmTokens: FieldValue.arrayRemove(token),
                        });
                        return { token, status: 'removed-stale' };
                    }
                    throw err;
                }
            })
        );

        const sent = results.filter(r => r.status === 'fulfilled' && (r.value as any).status === 'sent').length;
        const removed = results.filter(r => r.status === 'fulfilled' && (r.value as any).status === 'removed-stale').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        if (failed > 0) {
            results
                .filter(r => r.status === 'rejected')
                .forEach(r => console.error('[FCM] Rejected:', (r as PromiseRejectedResult).reason));
        }

        console.log(`[FCM] sent=${sent} removed=${removed} failed=${failed} → receiver=${receiverId}`);
        return NextResponse.json({ success: true, sent, removed, failed });

    } catch (err: any) {
        console.error('[FCM] send-notification fatal error:', err.message ?? err);
        return NextResponse.json({ error: 'Internal error', details: err.message }, { status: 500 });
    }
}
