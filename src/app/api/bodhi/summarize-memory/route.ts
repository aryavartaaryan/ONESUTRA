/**
 * POST /api/bodhi/summarize-memory
 * ─────────────────────────────────────────────────────────────────────────────
 * Next.js Server-Side Memory Summarizer for Sakha Bodhi.
 * Replaces the Firebase Cloud Function (which needs Blaze plan) with an
 * on-demand API route that runs on the Next.js Edge/Node runtime — FREE.
 *
 * HOW IT'S TRIGGERED:
 *   Called by useSakhaConversation after a conversation session ends or when
 *   the app loads, if there are >= BATCH_SIZE unsummarized short_term_messages.
 *
 * WHAT IT DOES:
 *   1. Reads unsummarized short_term_messages for the user from Firestore.
 *   2. Every BATCH_SIZE messages: sends to Gemini Flash for insight extraction.
 *   3. Writes long-term insights to users/{uid}/long_term_insights.
 *   4. Marks processed messages as summarized=true.
 *   5. Prunes short_term_messages beyond 100 to keep collection lean.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import * as admin from 'firebase-admin';

// ── Firebase Admin SDK (lazy init) ────────────────────────────────────────────
function getAdminDb(): admin.firestore.Firestore {
    if (!admin.apps.length) {
        const svcAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON!);
        admin.initializeApp({
            credential: admin.credential.cert(svcAccount),
        });
    }
    return admin.firestore();
}

const BATCH_SIZE = 15; // Summarize when >= N messages are unsummarized

// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json();
        if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

        const db = getAdminDb();
        const stmRef = db.collection(`users/${userId}/short_term_messages`);

        // ── Step 1: Count unsummarized messages ────────────────────────────────
        const unsumSnap = await stmRef.where('summarized', '==', false).orderBy('timestamp', 'asc').get();
        const unsumCount = unsumSnap.size;

        if (unsumCount < BATCH_SIZE) {
            return NextResponse.json({
                status: 'skipped',
                message: `Only ${unsumCount}/${BATCH_SIZE} messages — not enough to summarize yet.`,
            });
        }

        // ── Step 2: Build transcript from the batch ────────────────────────────
        const batchDocs = unsumSnap.docs.slice(0, BATCH_SIZE);
        const transcript = batchDocs
            .map(d => {
                const data = d.data();
                return `[${data.role === 'user' ? 'User' : 'Bodhi'}]: ${data.text}`;
            })
            .join('\n');

        // ── Step 3: Gemini Flash — extract long-term insights ──────────────────
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        insights: {
                            type: SchemaType.ARRAY,
                            description: 'Long-term insights about the user extracted from the conversation',
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    category: {
                                        type: SchemaType.STRING,
                                        format: 'enum',
                                        enum: ['identity', 'goal', 'struggle', 'milestone', 'preference', 'relationship', 'health', 'spiritual'],
                                    },
                                    insight: {
                                        type: SchemaType.STRING,
                                        description: 'A concise third-person fact: "User is preparing for CAT exam", "User wakes at 5 AM for Sadhana"',
                                    },
                                },
                                required: ['category', 'insight'],
                            },
                        },
                    },
                    required: ['insights'],
                },
            },
        });

        const prompt = `You are an AI memory analyst for a spiritual AI companion named Sakha Bodhi.
Analyze this conversation excerpt and extract ONLY meaningful long-term facts about the USER.

CONVERSATION:
${transcript}

RULES:
- Extract facts about: identity, beliefs, goals, struggles, milestones, preferences, relationships, health habits, spiritual practices.
- Write in third-person: "User is...", "User wants to...", "User struggles with..."
- DO NOT hallucinate. Only extract what is clearly stated.
- Return empty insights array if nothing meaningful is found.
- Keep each insight under 20 words.`;

        const result = await model.generateContent(prompt);
        const json = JSON.parse(result.response.text());
        const insights: Array<{ category: string; insight: string }> = json.insights ?? [];

        // ── Step 4: Write insights to long_term_insights ──────────────────────
        if (insights.length > 0) {
            const ltiRef = db.collection(`users/${userId}/long_term_insights`);
            const batch = db.batch();
            for (const insight of insights) {
                batch.set(ltiRef.doc(), {
                    category: insight.category,
                    insight: insight.insight,
                    savedAt: Date.now(),
                    source: 'nextjs_summarizer',
                });
            }
            await batch.commit();
        }

        // ── Step 5: Mark messages as summarized ───────────────────────────────
        const markBatch = db.batch();
        batchDocs.forEach(d => markBatch.update(d.ref, { summarized: true }));
        await markBatch.commit();

        // ── Step 6: Prune beyond 100 messages ────────────────────────────────
        const allSnap = await stmRef.orderBy('timestamp', 'asc').get();
        if (allSnap.size > 100) {
            const toDelete = allSnap.docs.slice(0, allSnap.size - 100);
            const pruneBatch = db.batch();
            toDelete.forEach(d => pruneBatch.delete(d.ref));
            await pruneBatch.commit();
        }

        return NextResponse.json({
            status: 'success',
            insightsSaved: insights.length,
            messagesProcessed: batchDocs.length,
        });

    } catch (error) {
        console.error('[Bodhi Memory Summarizer] Error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
