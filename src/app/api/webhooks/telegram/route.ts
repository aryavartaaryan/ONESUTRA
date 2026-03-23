import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Safety checks for Telegram payloads
        const message = body.message;
        if (!message || !message.text) {
            return NextResponse.json({ ok: true });
        }

        // We only care about /start deep links
        if (!message.text.startsWith('/start ')) {
            return NextResponse.json({ ok: true });
        }

        const parts = message.text.split(' ');
        if (parts.length < 2) {
            return NextResponse.json({ ok: true });
        }

        // The user.uid passed from the app
        const userId = parts[1];
        const chatId = message.from?.id?.toString();

        if (!userId || !chatId) {
            return NextResponse.json({ ok: true });
        }

        const adminDb = getAdminDb();

        // 1. Sync exactly what the Hub expects (integrations/main)
        const integrationRef = adminDb.collection('users').doc(userId).collection('integrations').doc('main');
        await integrationRef.set({
            oauth: {
                telegram: {
                    connected: true,
                    chatId: chatId,
                    connectedAt: new Date().toISOString()
                }
            }
        }, { merge: true });

        // 2. Sync to the omni-agent user root so the LLM has quick access to it
        const userRef = adminDb.collection('onesutra_users').doc(userId);
        await userRef.set({
            telegramChatId: chatId
        }, { merge: true });

        // 3. Send a welcome confirmation text back (Optional but UX friendly!)
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (botToken) {
            const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: "सखा बोधी से जुड़ने के लिए धन्यवाद! आपका अकाउंट सफलतापूर्वक लिंक हो गया है। मैं यहाँ आपके जीवन प्रबंधन में सहायता के लिए मौजूद हूँ। \n\n— Sakha Bodhi (OneSUTRA)"
                })
            });
        }

        return NextResponse.json({ ok: true, synced: true });

    } catch (e: any) {
        console.error('Telegram Webhook error:', e);
        // Telegram ignores 500s and retries, so returning 200 with ok: false avoids spam if we fail.
        return NextResponse.json({ ok: false, error: e.message });
    }
}
