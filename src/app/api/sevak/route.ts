import { NextRequest, NextResponse } from 'next/server';
import { streamText, type CoreMessage, type StreamTextResult } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebaseAdmin';
import personality from '@/lib/sevak-personality.json';

const MAX_CONTEXT_MESSAGES = 10;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 450;

type LanguageMode = 'hi' | 'en' | 'mixed';

interface SevakRequestBody {
    message: string;
    pageContext?: string;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    isFirstMessage?: boolean;
    userId?: string;
    chatId?: string;
}

interface FirestoreChatMessage {
    role: 'user' | 'assistant';
    content: string;
    createdAt: FirebaseFirestore.Timestamp;
    source: 'sevak';
}

const geminiApiKey = process.env.GEMINI_API_KEY ?? '';
const google = createGoogleGenerativeAI({ apiKey: geminiApiKey });

// Detect language from user input
function detectLanguage(text: string): LanguageMode {
    const hindiChars = text.match(/[\u0900-\u097F]/g);
    const englishChars = text.match(/[a-zA-Z]/g);

    const hindiCount = hindiChars ? hindiChars.length : 0;
    const englishCount = englishChars ? englishChars.length : 0;

    if (hindiCount > englishCount * 2) return 'hi';
    if (englishCount > hindiCount * 2) return 'en';
    return 'mixed';
}

// Build system prompt based on personality config
function buildSystemPrompt(userLanguage: LanguageMode, pageContext?: string): string {
    const langInstruction = {
        hi: 'Reply in Shuddh Hindi or Hinglish. Use Devanagari script where appropriate.',
        en: 'Reply in clear, peaceful English with occasional Sanskrit/Hindi terms.',
        mixed: 'Reply in a natural mix of Hindi and English (Hinglish), matching the user\'s style.'
    };

    return `You are "${personality.identity.name}", ${personality.identity.role}.
Your purpose: ${personality.identity.purpose}

IDENTITY & TONE:
- Always begin first interactions with: ${personality.greetings.first_interaction.join(' OR ')}
- Address users as "Seeker" or "Aatman"
- Your tone is: ${personality.tone_guidelines.style}
- Use phrases like: ${personality.phrases.teaching_reference.join(', ')}
- Humble service: ${personality.phrases.humble_service.join(', ')}

LANGUAGE:
${langInstruction[userLanguage]}

VEDIC VOCABULARY (use these terms):
${Object.entries(personality.vocabulary).map(([eng, vedic]) => `- ${eng} → ${vedic}`).join('\n')}

DOMAIN KNOWLEDGE:
1. DIET: ${personality.domains.diet.focus}
   - Provide Dosha-based food recommendations
   - Suggest recipes from the Vedic Rasoi
   
2. YOGA/MEDITATION: ${personality.domains.yoga.focus}
   - Suggest specific Asanas or Dhyana techniques
   - Guide breathing exercises (Pranayama)
   
3. AYURVEDA: ${personality.domains.ayurveda.focus}
   - Explain Dosha imbalances
   - Provide holistic wellness guidance

CONSTRAINTS:
- If asked medical questions beyond website scope: "${personality.phrases.medical_boundary}"
- If you don't know: "${personality.phrases.unknown}"
- NEVER use: ${personality.tone_guidelines.avoid.join(', ')}
- Stay within the domains of Diet, Yoga, and Ayurveda

${pageContext ? `\nCURRENT PAGE CONTEXT:\n${pageContext}\n\nUse this context to answer questions about "this page" or "this recipe".` : ''}

Remember: You are a humble Sevak, devoted to serving seekers on their path to wellness.`;
}

function isRateLimitError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const maybe = error as { statusCode?: number; status?: number; message?: string };
    if (maybe.statusCode === 429 || maybe.status === 429) return true;
    return typeof maybe.message === 'string' && maybe.message.includes('429');
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function toCoreMessages(messages: Array<{ role: 'user' | 'assistant'; content: string }>): CoreMessage[] {
    return messages
        .filter((m) => typeof m.content === 'string' && m.content.trim().length > 0)
        .map((m) => ({
            role: m.role,
            content: m.content,
        }));
}

async function loadRecentFirestoreContext(userId: string, chatId: string): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
    const db = getAdminDb();
    const snap = await db
        .collection('users')
        .doc(userId)
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .orderBy('createdAt', 'desc')
        .limit(MAX_CONTEXT_MESSAGES)
        .get();

    return snap.docs
        .map((d) => d.data() as Partial<FirestoreChatMessage>)
        .filter((m): m is Pick<FirestoreChatMessage, 'role' | 'content'> =>
            (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
        )
        .reverse();
}

async function persistConversationTurn(userId: string, chatId: string, userText: string, assistantText: string): Promise<void> {
    const db = getAdminDb();
    const messagesRef = db.collection('users').doc(userId).collection('chats').doc(chatId).collection('messages');
    const chatRef = db.collection('users').doc(userId).collection('chats').doc(chatId);

    const now = Timestamp.now();
    const userPayload: FirestoreChatMessage = {
        role: 'user',
        content: userText,
        createdAt: now,
        source: 'sevak',
    };
    const assistantPayload: FirestoreChatMessage = {
        role: 'assistant',
        content: assistantText,
        createdAt: now,
        source: 'sevak',
    };

    const batch = db.batch();
    batch.set(messagesRef.doc(), userPayload);
    batch.set(messagesRef.doc(), assistantPayload);
    batch.set(
        chatRef,
        {
            updatedAt: now,
            lastMessage: assistantText,
            lastRole: 'assistant',
            messageCount: FieldValue.increment(2),
        },
        { merge: true }
    );

    await batch.commit();
}

async function buildStreamWithRetry(params: {
    systemPrompt: string;
    messages: CoreMessage[];
    onFinish: (assistantText: string) => void;
}): Promise<StreamTextResult<Record<string, never>, string>> {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            return streamText({
                model: google('gemini-2.0-flash-exp'),
                system: params.systemPrompt,
                messages: params.messages,
                temperature: 0.6,
                onFinish: ({ text }) => {
                    params.onFinish(text ?? '');
                },
            });
        } catch (error) {
            if (!isRateLimitError(error) || attempt === MAX_RETRIES) throw error;
            await sleep(RETRY_DELAY_MS * (attempt + 1));
        }
    }

    throw new Error('Unable to initialize streamText after retries');
}

export async function POST(request: NextRequest) {
    try {
        if (!geminiApiKey) {
            return NextResponse.json({ error: 'Gemini API key is missing on server' }, { status: 500 });
        }

        const { message, pageContext, conversationHistory, userId, chatId } = await request.json() as SevakRequestBody;

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        const safeMessage = message.trim();
        if (!safeMessage) {
            return NextResponse.json(
                { error: 'Message cannot be empty' },
                { status: 400 }
            );
        }

        const userLanguage = detectLanguage(message);
        const systemPrompt = buildSystemPrompt(userLanguage, pageContext);

        let contextMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
        if (userId && chatId) {
            try {
                contextMessages = await loadRecentFirestoreContext(userId, chatId);
            } catch (error) {
                console.warn('[sevak] Failed to load Firestore context, using request history fallback', error);
            }
        }

        if (contextMessages.length === 0 && Array.isArray(conversationHistory)) {
            contextMessages = conversationHistory
                .filter((m): m is { role: 'user' | 'assistant'; content: string } =>
                    (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
                )
                .slice(-MAX_CONTEXT_MESSAGES);
        }

        const coreMessages = toCoreMessages([
            ...contextMessages,
            { role: 'user', content: safeMessage },
        ]);

        const streamResult = await buildStreamWithRetry({
            systemPrompt,
            messages: coreMessages,
            onFinish: (assistantText) => {
                if (!userId || !chatId || !assistantText.trim()) return;
                void persistConversationTurn(userId, chatId, safeMessage, assistantText.trim()).catch((error) => {
                    console.error('[sevak] Failed to persist conversation turn:', error);
                });
            },
        });

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const text of streamResult.textStream) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                    }
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error: any) {
        console.error('Sevak API Error:', error);
        const isRateLimited = isRateLimitError(error);
        return NextResponse.json(
            {
                error: isRateLimited
                    ? 'Sevak is receiving too many requests. Please retry in a few seconds.'
                    : 'The path to wisdom is temporarily obscured. Please try again.',
                details: error?.message || 'Unknown error'
            },
            { status: isRateLimited ? 429 : 500 }
        );
    }
}
