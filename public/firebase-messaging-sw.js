/**
 * firebase-messaging-sw.js — Service Worker for FCM Background Messages
 *
 * IMPORTANT: This is a static file in /public — it has NO access to Next.js
 * environment variables. Config values must be hardcoded directly here.
 * These are all NEXT_PUBLIC_ values, so they are safe to commit.
 */

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: 'AIzaSyDopRnKjDoy724qfo71YDi7eRSvOkdDrVI',
    authDomain: 'pranav-samadhaan.firebaseapp.com',
    projectId: 'pranav-samadhaan',
    storageBucket: 'pranav-samadhaan.firebasestorage.app',
    messagingSenderId: '475392538883',
    appId: '1:475392538883:web:f611e48e6a7dc72e731136',
});

const messaging = firebase.messaging();

// ── Background message handler ────────────────────────────────────────────────
messaging.onBackgroundMessage((payload) => {
    const { notification, data } = payload;

    const title = notification?.title || data?.senderName || 'New Message on SutraTalk';
    const body = notification?.body || data?.messageText || '…';
    const chatUrl = data?.chatUrl || '/onesutra';

    self.registration.showNotification(title, {
        body,
        icon: '/images/OurLogo.png',
        badge: '/images/OurLogo.png',
        tag: data?.chatId || 'sutratalk-msg',  // collapse same-chat notifications
        renotify: true,
        data: { chatUrl },
        vibrate: [200, 100, 200],
    });
});

// ── Notification click → deep-link into the correct chat ─────────────────────
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const chatUrl = event.notification.data?.chatUrl || '/onesutra';
    const targetUrl = new URL(chatUrl, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Focus existing tab if already open
            for (const client of clientList) {
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new tab
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
