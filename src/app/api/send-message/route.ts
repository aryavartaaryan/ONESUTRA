/**
 * POST /api/send-message
 *
 * Sender-Triggered Serverless Interceptor for SutraTalk Autopilot.
 * This is the ONLY route used for sending messages.
 *
 * Sequential flow (all within one Vercel function execution):
 *   1. Save sender's message to Firestore immediately
 *   2. Check if receiver has isAutopilotEnabled === true
 *   3. Infinite-loop guard: if incoming message isAiGenerated === true → STOP
 *   4. 15-message gate: fetch history, count msgs, STOP if < 15
 *   5. Format last 15–20 messages as context string
 *   6. Call Gemini 2.5 Flash with persona-cloning system prompt (awaited)
 *   7. Inject AI reply into Firestore with isAiGenerated: true
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SendMessageBody {
    senderId: string;
    senderName: string;
    receiverId: string;
    receiverName: string;
    text: string;
    chatId: string;      // deterministic: [uid1, uid2].sort().join('_')
    isAiGenerated?: boolean;
}

interface ChatMessage {
    id?: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: FirebaseFirestore.Timestamp;
    isAiGenerated: boolean;
}

// ─── Gemini Client ───────────────────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

// ─── Helper: Build the Persona-Cloning System Prompt ────────────────────────

function buildSystemPrompt(receiverName: string): string {
    return `You are the Autopilot digital twin for ${receiverName} on the platform OneSutra. Your purpose is to seamlessly maintain a conscious, authentic connection with the person you are chatting with, taking over because ${receiverName} is currently offline.

CRITICAL RULES:
1. Clone the Vibe: Analyze the provided chat history. Mirror ${receiverName}'s exact vocabulary, sentence length, tone, and use of specific emojis (like 🙏, ✨).
2. Contextual Awareness: You are receiving the last 15+ messages. Respond ONLY to the newest message, using the history purely for context so you do not repeat yourself.
3. Complete Identity Assumption: NEVER announce that you are an AI, a bot, or on autopilot. You ARE ${receiverName}.
4. Brevity: Keep responses concise (1 to 3 short sentences). This is a real-time chat interface, not an email.
5. Handling the Unknown: If asked about personal real-world events not present in the context window, use natural deflections (e.g., "I'm a bit tied up right now, remind me of the details later?" or "Let's talk about that properly when I'm fully back."). Do not hallucinate fake memories.`;
}

// ─── Helper: Fetch and Format Chat Context ───────────────────────────────────

async function fetchAndFormatContext(
    chatId: string,
    db: FirebaseFirestore.Firestore,
    senderName: string,
    receiverName: string
): Promise<{ formattedContext: string; totalCount: number }> {
    const messagesRef = db
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .orderBy('timestamp', 'asc');

    const snapshot = await messagesRef.get();
    const allMessages = snapshot.docs.map(doc => ({
        ...(doc.data() as ChatMessage),
        id: doc.id,
    }));

    const totalCount = allMessages.length;

    // Take last 20 messages for context
    const contextMessages = allMessages.slice(-20);

    const formattedContext = contextMessages
        .map(msg => {
            const name = msg.senderId === msg.senderId
                ? (msg.senderName || (msg.isAiGenerated ? receiverName : senderName))
                : receiverName;
            return `${msg.senderName}: ${msg.text}`;
        })
        .join('\n');

    return { formattedContext, totalCount };
}

// ─── Helper: Call Gemini 2.5 Flash ──────────────────────────────────────────

async function callGeminiAutopilot(
    receiverName: string,
    formattedContext: string,
    newestMessage: string
): Promise<string> {
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: buildSystemPrompt(receiverName),
        generationConfig: {
            maxOutputTokens: 200,
            temperature: 0.78,
        },
    });

    const prompt = `Here is the recent chat history:\n\n${formattedContext}\n\nThe newest message to respond to: "${newestMessage}"\n\nRespond as ${receiverName} — naturally, briefly, in-character.`;

    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const text = result.response.text().trim();
    return text || "I'll get back to you soon 🙏";
}

// ─── Main Route Handler ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    let body: SendMessageBody;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { senderId, senderName, receiverId, receiverName, text, chatId, isAiGenerated = false } = body;

    // Validate required fields
    if (!senderId || !receiverId || !text || !chatId) {
        return NextResponse.json(
            { error: 'Missing required fields: senderId, receiverId, text, chatId' },
            { status: 400 }
        );
    }

    const db = getAdminDb();

    // ── STEP 1: Save incoming message immediately ────────────────────────────
    const messagesRef = db.collection('chats').doc(chatId).collection('messages');
    const newMsgRef = messagesRef.doc(); // auto-ID

    await newMsgRef.set({
        senderId,
        senderName: senderName || 'Unknown',
        receiverId,
        text,
        timestamp: FieldValue.serverTimestamp(),
        isAiGenerated,
    });

    // Ensure the parent chat document exists (for listing chats)
    await db.collection('chats').doc(chatId).set(
        {
            participants: [senderId, receiverId],
            lastMessage: text,
            lastMessageAt: FieldValue.serverTimestamp(),
            lastSenderId: senderId,
        },
        { merge: true }
    );

    const savedMessageId = newMsgRef.id;

    // ── STEP 2: Check if receiver has Autopilot enabled ──────────────────────
    let autopilotEnabled = false;
    try {
        const receiverDoc = await db.collection('onesutra_users').doc(receiverId).get();
        if (receiverDoc.exists) {
            autopilotEnabled = receiverDoc.data()?.isAutopilotEnabled === true;
        }
    } catch (err) {
        console.error('[send-message] Failed to fetch receiver profile:', err);
    }

    if (!autopilotEnabled) {
        // Autopilot off — message delivered, we're done
        return NextResponse.json({ success: true, messageId: savedMessageId });
    }

    // ── STEP 3: Infinite-loop guard ──────────────────────────────────────────
    if (isAiGenerated === true) {
        console.log('[send-message] Autopilot skipped — incoming message is AI-generated (loop guard).');
        return NextResponse.json({ success: true, messageId: savedMessageId });
    }

    // ── STEP 4 & 5: 15-message gate + fetch context ──────────────────────────
    let formattedContext = '';
    let totalCount = 0;
    try {
        const result = await fetchAndFormatContext(chatId, db, senderName, receiverName);
        formattedContext = result.formattedContext;
        totalCount = result.totalCount;
    } catch (err) {
        console.error('[send-message] Failed to fetch chat context:', err);
        return NextResponse.json({ success: true, messageId: savedMessageId });
    }

    if (totalCount < 15) {
        console.log(`[send-message] Autopilot skipped — only ${totalCount}/15 messages in history.`);
        return NextResponse.json({ success: true, messageId: savedMessageId });
    }

    // ── STEP 6: Call Gemini 2.5 Flash ───────────────────────────────────────
    let aiReplyText = '';
    try {
        aiReplyText = await callGeminiAutopilot(receiverName, formattedContext, text);
    } catch (err) {
        console.error('[send-message] Gemini API call failed:', err);
        // Original message already delivered in Step 1 — do not crash the response
        return NextResponse.json({ success: true, messageId: savedMessageId });
    }

    // ── STEP 7: Inject AI reply as the receiver ──────────────────────────────
    try {
        const aiMsgRef = messagesRef.doc();
        await aiMsgRef.set({
            senderId: receiverId,
            senderName: receiverName || 'Unknown',
            receiverId: senderId,
            text: aiReplyText,
            timestamp: FieldValue.serverTimestamp(),
            isAiGenerated: true,
        });

        // Update parent chat document with AI reply as last message
        await db.collection('chats').doc(chatId).set(
            {
                lastMessage: aiReplyText,
                lastMessageAt: FieldValue.serverTimestamp(),
                lastSenderId: receiverId,
            },
            { merge: true }
        );
    } catch (err) {
        console.error('[send-message] Failed to save AI reply to Firestore:', err);
    }

    return NextResponse.json({ success: true, messageId: savedMessageId });
}
