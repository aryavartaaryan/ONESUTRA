/**
 * pollTelegram.ts
 * 
 * LOCAL TESTING ONLY:
 * Telegram Webhooks do not work on `localhost`. Since you are testing the app locally,
 * run this script to instantly poll the Telegram API for new /start messages and 
 * save the chat IDs directly to your Firebase Firestore just like the webhook would!
 * 
 * Run with: npx ts-node scripts/pollTelegram.ts
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';
// Load from both env files just in case
dotenv.config({ path: resolve(__dirname, '../.env') });
dotenv.config({ path: resolve(__dirname, '../../.env.local') });

import * as admin from 'firebase-admin';

// Initialize Firebase using .env.local's FIREBASE_SERVICE_ACCOUNT_JSON
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!serviceAccountJson) {
    console.error("❌ Need FIREBASE_SERVICE_ACCOUNT_JSON to run the local poller.");
    process.exit(1);
}
let serviceAccount: any;
try {
    serviceAccount = JSON.parse(serviceAccountJson);
} catch (e) {
    console.error("❌ FIREBASE_SERVICE_ACCOUNT_JSON is malformed.");
}

if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
    console.error("❌ Need TELEGRAM_BOT_TOKEN to run the local poller.");
    process.exit(1);
}

let lastUpdateId = 0;

async function poll() {
    try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`);
        const data = await res.json();

        if (data.ok && data.result.length > 0) {
            for (const update of data.result) {
                lastUpdateId = update.update_id;

                const msg = update.message;
                if (!msg || !msg.text) continue;

                if (msg.text.startsWith('/start ')) {
                    const parts = msg.text.split(' ');
                    const userId = parts[1];
                    const chatId = msg.from?.id?.toString();

                    if (userId && chatId) {
                        console.log(`\n🎉 Caught deep link! User: ${userId} -> Chat: ${chatId}`);

                        // Sync to integrations schema
                        await db.collection('users').doc(userId).collection('integrations').doc('main').set({
                            oauth: {
                                telegram: {
                                    connected: true,
                                    chatId: chatId,
                                    connectedAt: new Date().toISOString()
                                }
                            }
                        }, { merge: true });

                        // Sync to omni-agent schema
                        await db.collection('onesutra_users').doc(userId).set({
                            telegramChatId: chatId
                        }, { merge: true });

                        console.log(`✅ Saved to Firebase Firestore! The omni-agent is ready to talk.`);

                        // Send welcome message
                        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                chat_id: chatId,
                                text: "Local Test: सखा बोधी से जुड़ने के लिए धन्यवाद! आपका अकाउंट लिंक हो गया है। 🚀"
                            })
                        });
                    }
                }
            }
        }
    } catch (e) {
        console.error("Polling error:", e);
    }

    // Schedule next poll immediately
    setTimeout(poll, 1000);
}

console.log("=========================================");
console.log("🚀 Telegram Deep-Link Poller Started...");
console.log("Listening for /start <uid> commands.");
console.log("=========================================");
poll();
