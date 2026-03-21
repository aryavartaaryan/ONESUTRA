/**
 * SUTRAtalk — Firebase Cloud Functions
 *
 * Feature 1: AI Chat Twin  (onDocumentCreated → Gemini Flash)
 * Feature 3: Action Items  (onDocumentCreated counter → Gemini Pro JSON)
 *
 * Deploy: firebase deploy --only functions
 */

import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

admin.initializeApp();
const db = admin.firestore();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Derive chatId from message path onesutra_chats/{chatId}/messages/{msgId} */
function chatIdFromPath(path: string): string {
    return path.split("/")[1];
}

/** Parse "uid1_uid2" chatId to get the other participant's uid */
function otherUid(chatId: string, myUid: string): string {
    return chatId.split("_").find((u) => u !== myUid) ?? "";
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 1: AI Chat Twin — onDocumentCreated
// Triggers on every new human message in any 1-on-1 chat.
// If the *recipient* has isAutoPilotEnabled=true, Gemini Flash replies in their voice.
// ─────────────────────────────────────────────────────────────────────────────
export const onMessageCreated = functions.firestore.onDocumentCreated(
    "onesutra_chats/{chatId}/messages/{msgId}",
    async (event) => {
        const snap = event.data;
        if (!snap) return;

        const msg = snap.data();
        const chatId = event.params.chatId;

        // 🔒 Prevent infinite loop — never react to AI-generated messages
        if (msg.sentBy === "ai") return;

        const senderId: string = msg.senderId;
        const recipientId = otherUid(chatId, senderId);
        if (!recipientId) return;

        const chatRef = db.collection("onesutra_chats").doc(chatId);

        // ── STEP A: Update lastMessage + increment unread count ────────────────────
        const chatSnap = await chatRef.get();
        const chatData = chatSnap.data() ?? {};
        const approxNewUnread: number = (Number(chatData.unreadCounts?.[recipientId]) || 0) + 1;

        await chatRef.set({
            lastMessage: {
                text: msg.text ?? "",
                senderId,
                senderName: msg.senderName ?? "Traveller",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            [`unreadCounts.${recipientId}`]: admin.firestore.FieldValue.increment(1),
            messageCount: admin.firestore.FieldValue.increment(1),
        }, { merge: true });

        // ── STEP B: Vibe Classification ────────────────────────────────────────────
        const vibeModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        try {
            const vibeResult = await vibeModel.generateContent(
                `Analyze this message: "${msg.text}"\n\nClassify its energy into exactly one of: URGENT, CALM, DEEP.\nRules: URGENT = requires immediate action or high-stress. CALM = friendly, standard, positive. DEEP = philosophical, complex, or emotional.\nRespond with ONLY the single category word, nothing else.`
            );
            const vibe = vibeResult.response.text().trim().toUpperCase();
            if (["URGENT", "CALM", "DEEP"].includes(vibe)) {
                await chatRef.set({ vibe }, { merge: true });
            }
        } catch (e) {
            functions.logger.warn("Vibe classification failed", e);
        }

        // ── STEP C: Tatva Snippet — only if unread is likely above threshold ───────
        if (approxNewUnread > 2) {
            try {
                const recentMsgs = await db
                    .collection(`onesutra_chats/${chatId}/messages`)
                    .orderBy("createdAt", "desc")
                    .limit(5)
                    .get();

                const thread = recentMsgs.docs
                    .reverse()
                    .map((d) => `${d.data().senderName}: ${d.data().text}`)
                    .join("\n");

                const tatvModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                const tatvResult = await tatvModel.generateContent(
                    `Summarize this short chat thread in MAXIMUM 6 words. Sound natural and informative. Do not use quotes.\n\nThread:\n${thread}`
                );
                const tatvaSummary = tatvResult.response.text().trim();
                await chatRef.set({ tatvaSummary }, { merge: true });
            } catch (e) {
                functions.logger.warn("Tatva summary failed", e);
            }
        }

        // ── STEP D: AutoPilot Reply ────────────────────────────────────────────────
        const recipientDoc = await db.collection("onesutra_users").doc(recipientId).get();
        if (!recipientDoc.exists) return;

        const recipientData = recipientDoc.data()!;
        if (!recipientData.isAutoPilotEnabled) return;

        // Mark AutoPilot as active on chat doc
        await chatRef.set({ [`isAutoPilotActive.${recipientId}`]: true }, { merge: true });

        // ── RAG-style context: last 20 messages by the recipient ──────────────────
        const contextSnap = await db
            .collection(`onesutra_chats/${chatId}/messages`)
            .where("senderId", "==", recipientId)
            .orderBy("createdAt", "desc")
            .limit(20)
            .get();

        const styleContext = contextSnap.docs
            .map((d) => d.data().text as string)
            .reverse()
            .join("\n");

        const autoPilotNote = recipientData.autoPilotContext ?? "";

        // ── Call Gemini Flash ─────────────────────────────────────────────────────
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const systemInstruction = `You are an AI proxy for ${recipientData.name}.
You must reply to incoming messages in EXACTLY their conversational style.

STYLE CONTEXT (${recipientData.name}'s past messages — learn their tone):
---
${styleContext || "No past messages yet — be warm and casual."}
---
${autoPilotNote ? `ADDITIONAL STYLE NOTES FROM USER: ${autoPilotNote}` : ""}

STRICT RULES:
- Reply ONLY based on what you know from the context. Do NOT invent facts.
- Keep replies SHORT — max 2 sentences (match their usual message length).
- Match their emoji usage, capitalization, and punctuation style exactly.
- Never reveal you are an AI unless directly asked.
- If you are unsure how to respond authentically, reply: "I'll get back to you!"`;

        const result = await model.generateContent({
            systemInstruction,
            contents: [{ role: "user", parts: [{ text: msg.text }] }],
            generationConfig: { maxOutputTokens: 200, temperature: 0.7 },
        });

        const aiText = result.response.text().trim();
        if (!aiText) return;

        // ── Write AI reply to Firestore ───────────────────────────────────────────
        await db.collection(`onesutra_chats/${chatId}/messages`).add({
            text: aiText,
            senderId: recipientId,
            senderName: `${recipientData.name} (AI)`,
            sentBy: "ai",
            tone: "original",
            summarized: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Update lastMessage for AI reply
        await chatRef.set({
            lastMessage: {
                text: aiText,
                senderId: recipientId,
                senderName: `${recipientData.name} (AI)`,
                sentBy: "ai",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            },
        }, { merge: true });

        functions.logger.info(`✅ Chat Twin replied for ${recipientData.name} in ${chatId}`);
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 3: Action Item Extraction
// Triggers when messageCount on a chat doc crosses a multiple of 10.
// Sends unsummarized messages to Gemini Pro with strict JSON schema.
// ─────────────────────────────────────────────────────────────────────────────
export const extractActionItems = functions.firestore.onDocumentUpdated(
    "onesutra_chats/{chatId}",
    async (event) => {
        const after = event.data?.after.data();
        const before = event.data?.before.data();
        if (!after || !before) return;

        const count = after.messageCount ?? 0;
        const prevCount = before.messageCount ?? 0;

        // Only trigger every 10 new messages
        if (Math.floor(count / 10) <= Math.floor(prevCount / 10)) return;

        const chatId = event.params.chatId;

        // Fetch all unsummarized messages
        const unsummarized = await db
            .collection(`onesutra_chats/${chatId}/messages`)
            .where("summarized", "==", false)
            .orderBy("createdAt", "asc")
            .limit(50)
            .get();

        if (unsummarized.empty) return;

        const transcript = unsummarized.docs
            .map((d) => {
                const data = d.data();
                return `[${data.senderName}]: ${data.text}`;
            })
            .join("\n");

        // ── Gemini Pro with strict JSON schema output ─────────────────────────────
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash", // Use Flash since Pro may not be available; swap to gemini-2.5-pro when available
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        tasks: {
                            type: SchemaType.ARRAY,
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    id: { type: SchemaType.STRING },
                                    who: { type: SchemaType.STRING },
                                    what: { type: SchemaType.STRING },
                                    deadline: { type: SchemaType.STRING, description: "ISO date or 'unspecified'" },
                                    status: { type: SchemaType.STRING, enum: ["pending", "done"] },
                                },
                                required: ["id", "who", "what", "deadline", "status"],
                            },
                        },
                    },
                    required: ["tasks"],
                },
            },
        });

        const prompt = `You are a task extraction AI. Analyze this conversation and extract ONLY concrete action items — things someone explicitly agreed or was asked to do.

CONVERSATION:
${transcript}

RULES:
- Extract only clear action items (commitments, assignments, requests with an owner).
- If no clear deadline is mentioned, use "unspecified".
- Generate a short unique id for each task (e.g. "task_1", "task_2").
- Set status to "pending" for all new tasks.
- Return an empty tasks array if there are no action items.
- Do NOT hallucinate tasks that were not explicitly mentioned.`;

        const result = await model.generateContent(prompt);
        const json = JSON.parse(result.response.text());

        if (!json.tasks || json.tasks.length === 0) {
            // Still mark messages as summarized to avoid reprocessing
        } else {
            // Merge with existing dashboard tasks
            const dashRef = db.doc(`onesutra_chats/${chatId}/dashboard/main`);
            const dashSnap = await dashRef.get();
            const existingTasks = dashSnap.exists ? (dashSnap.data()?.tasks ?? []) : [];

            const allTasks = [...existingTasks, ...json.tasks];

            await dashRef.set({
                tasks: allTasks,
                lastProcessedAt: admin.firestore.FieldValue.serverTimestamp(),
                messageCount: count,
            }, { merge: true });

            functions.logger.info(`✅ Extracted ${json.tasks.length} tasks for chat ${chatId}`);
        }

        // Mark all fetched messages as summarized
        const batch = db.batch();
        unsummarized.docs.forEach((d) => batch.update(d.ref, { summarized: true }));
        await batch.commit();
    }
);
