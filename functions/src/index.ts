/**
 * SUTRAtalk — Firebase Cloud Functions
 *
 * Feature 1: AI Chat Twin  (onDocumentCreated → Gemini Flash)
 * Feature 3: Action Items  (onDocumentCreated counter → Gemini Pro JSON)
 * Feature 4: Sakha Bodhi Memory Summarizer  (Tiered Memory Architecture)
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

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 4: Sakha Bodhi Memory Summarizer — Tiered Memory Architecture
// ─────────────────────────────────────────────────────────────────────────────
//
// WHEN IT FIRES:
//   Every time a new document is written to users/{userId}/short_term_messages.
//   But it only runs the heavy Gemini pass every STM_BATCH_SIZE (15) messages
//   to keep costs low while still keeping memory fresh.
//
// WHAT IT DOES:
//   1. Counts unsummarized short_term_messages for the user.
//   2. Every 15 messages: sends the batch to Gemini Flash for extraction.
//   3. Gemini returns structured long-term insights (identity, goal, struggle, etc.)
//   4. Writes each insight to users/{userId}/long_term_insights.
//   5. Marks all processed messages as summarized=true.
//   6. Prunes short_term_messages beyond 100 to keep the collection lean.
//
// DATA FLOW:
//   short_term_messages ──► Cloud Function ──► Gemini Flash ──► long_term_insights
//                                         └──► marks summarized=true
//                                         └──► prunes old messages > 100
//
// ─────────────────────────────────────────────────────────────────────────────

const STM_BATCH_SIZE = 15; // Summarize every N new messages

export const summarizeBodhiMemory = functions.firestore.onDocumentCreated(
    "users/{userId}/short_term_messages/{msgId}",
    async (event: functions.firestore.FirestoreEvent<functions.firestore.QueryDocumentSnapshot | undefined, { userId: string; msgId: string }>) => {
        const userId = event.params.userId;

        // ── Step 1: Count unsummarized messages ────────────────────────────────
        const stmRef = db.collection(`users/${userId}/short_term_messages`);
        const unsumSnap0 = await stmRef.where("summarized", "==", false).get();
        const unsumCount = unsumSnap0.size;

        // Only proceed when we hit the batch threshold
        if (unsumCount < STM_BATCH_SIZE) return;

        // ── Step 2: Fetch the batch of unsummarized messages ───────────────────
        const unsumSnap = await stmRef
            .where("summarized", "==", false)
            .orderBy("timestamp", "asc")
            .limit(STM_BATCH_SIZE)
            .get();

        if (unsumSnap.empty) return;

        const transcript = unsumSnap.docs
            .map((d) => {
                const data = d.data();
                return `[${data.role === "user" ? "User" : "Bodhi"}]: ${data.text}`;
            })
            .join("\n");

        // ── Step 3: Send to Gemini Flash for insight extraction ────────────────
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        insights: {
                            type: SchemaType.ARRAY,
                            description: "List of long-term insights extracted from the conversation",
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    category: {
                                        type: SchemaType.STRING,
                                        format: "enum",
                                        enum: ["identity", "goal", "struggle", "milestone", "preference", "relationship", "health", "spiritual"],
                                        description: "Category of the insight",
                                    },
                                    insight: {
                                        type: SchemaType.STRING,
                                        description: "A concise, third-person fact about the user. e.g. 'User is building an app called OneSUTRA' or 'User wakes at 5 AM for Sadhana'",
                                    },
                                },
                                required: ["category", "insight"],
                            },
                        },
                    },
                    required: ["insights"],
                },
            },
        });

        const prompt = `You are an AI memory analyst for a spiritual AI companion named Sakha Bodhi.
Analyze this conversation excerpt and extract ONLY meaningful long-term facts about the USER.

CONVERSATION:
${transcript}

EXTRACTION RULES:
- Extract facts about: identity, beliefs, goals, struggles, milestones, preferences, relationships, health habits, spiritual practices.
- Write each insight in third-person about the user: "User is...", "User wants to...", "User struggles with..."
- DO NOT extract facts about Bodhi or generic pleasantries.
- DO NOT hallucinate. Only extract what is clearly stated.
- Return an empty insights array if there is nothing meaningful.
- Keep each insight under 20 words.`;

        let insights: Array<{ category: string; insight: string }> = [];
        try {
            const result = await model.generateContent(prompt);
            const json = JSON.parse(result.response.text());
            insights = json.insights ?? [];
        } catch (e) {
            functions.logger.warn("[Bodhi Memory] Gemini extraction failed", e);
        }

        // ── Step 4: Write long-term insights to Firestore ──────────────────────
        if (insights.length > 0) {
            const ltiRef = db.collection(`users/${userId}/long_term_insights`);
            const writeBatch = db.batch();
            for (const insight of insights) {
                writeBatch.set(ltiRef.doc(), {
                    category: insight.category,
                    insight: insight.insight,
                    savedAt: Date.now(),
                    source: "auto_summarizer",
                });
            }
            await writeBatch.commit();
            functions.logger.info(`[Bodhi Memory] ✅ Saved ${insights.length} long-term insights for user ${userId}`);
        }

        // ── Step 5: Mark processed messages as summarized ──────────────────────
        const markBatch = db.batch();
        unsumSnap.docs.forEach((d) => markBatch.update(d.ref, { summarized: true }));
        await markBatch.commit();

        // ── Step 6: Prune old messages beyond 100 ─────────────────────────────
        // This keeps the collection lean and prevents Firestore read costs from growing.
        const allSnap = await stmRef.orderBy("timestamp", "asc").get();
        if (allSnap.size > 100) {
            const toDelete = allSnap.docs.slice(0, allSnap.size - 100);
            const pruneBatch = db.batch();
            toDelete.forEach((d) => pruneBatch.delete(d.ref));
            await pruneBatch.commit();
            functions.logger.info(`[Bodhi Memory] 🗑️ Pruned ${toDelete.length} old messages for user ${userId}`);
        }
    }
);
