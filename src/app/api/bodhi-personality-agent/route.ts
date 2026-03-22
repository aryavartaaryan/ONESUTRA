import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

interface SankalpaTask {
    done?: boolean;
    text?: string;
}

// ── Rate Limiting / Debounce Constants ──────────────────────────────────────
// Only analyze if it's been at least 12 hours since the last analysis, Or if it's the very first time.
const DEBOUNCE_MS = 12 * 60 * 60 * 1000;
const GEMINI_MAX_ATTEMPTS = 2;
const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash'] as const;

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableGeminiNetworkError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    const err = error as {
        message?: string;
        code?: string;
        cause?: { message?: string; code?: string };
    };

    const message = `${err.message ?? ''} ${err.cause?.message ?? ''}`.toLowerCase();
    const code = `${err.code ?? ''} ${err.cause?.code ?? ''}`;

    return (
        code.includes('UND_ERR_CONNECT_TIMEOUT') ||
        code.includes('ETIMEDOUT') ||
        code.includes('ECONNRESET') ||
        message.includes('connect timeout') ||
        message.includes('fetch failed') ||
        message.includes('socket hang up')
    );
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // Use server-safe Firestore (no IndexedDB/browser persistence)
        const { getServerFirestore } = await import('@/lib/firebaseServer');
        const { doc, getDoc, collection, query, orderBy, limit, getDocs, setDoc } = await import('firebase/firestore');

        const db = getServerFirestore();
        const userRef = doc(db, 'users', userId);

        // 1. Check if we really need to run (debounce)
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const userData = userDoc.data();
        const lastAnalysisTime = userData?.bodhi_last_personality_analysis_time || 0;

        if (Date.now() - lastAnalysisTime < DEBOUNCE_MS) {
            console.log(`[Personality Agent] Skipping analysis for ${userId} (debounced)`);
            return NextResponse.json({ status: 'skipped', reason: 'debounced' });
        }

        // 2. Fetch the most recent 100 lines of the full transcript
        const transcriptQuery = query(
            collection(db, 'users', userId, 'bodhi_full_transcript'),
            orderBy('timestamp', 'desc'),
            limit(100)
        );
        const transcriptSnap = await getDocs(transcriptQuery);

        if (transcriptSnap.empty) {
            return NextResponse.json({ status: 'skipped', reason: 'no_transcript' });
        }

        // Docs are returned newest-first because of desc order, let's reverse to chronological
        const recentTranscripts = [...transcriptSnap.docs]
            .reverse()
            .map(d => d.data())
            .map(t => `${t.role.toUpperCase()}: ${t.text}`)
            .join('\n');

        // 3. Fetch user's current tasks to add context
        const tasks = (userData?.sankalpa_items ?? []) as SankalpaTask[];
        const taskContext = tasks.length > 0
            ? `\nCURRENT TASKS:\n${tasks.map((t) => `- [${t.done ? 'DONE' : 'PENDING'}] ${t.text ?? 'Untitled Task'}`).join('\n')}`
            : '';

        // 4. Run Gemini 2.5 Flash to generate the personality summary
        if (!process.env.GEMINI_API_KEY) {
            console.warn('[Personality Agent] GEMINI_API_KEY missing');
            return NextResponse.json({ status: 'skipped', reason: 'missing_api_key' });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const systemPrompt = `You are Bodhi's internal Personality Analysis Agent.
Your job is to read the raw conversation logs between Bodhi (an AI companion) and the User, and generate a concise, highly insightful "Personality Profile" for the User.

This profile will be injected back into Bodhi's system prompt to help Bodhi communicate better in the future.

Rules for the summary:
1. MAX 1 PARAGRAPH (4-5 sentences). Be extremely dense and concise.
2. Focus ONLY on actionable behavioral insights, communication style, emotional state, patterns, and preferences.
3. Ignore generic small talk. Look for: How do they talk? What stresses them? What do they love? How should Bodhi approach them?
4. Write it in English, but you can reference Hindi words if they use them frequently.
5. Format it as direct instructions to Bodhi. Example: "The user is highly driven but currently stressed about career. They prefer direct, structured answers with no fluff. They enjoy deep philosophical references."`;

        const userPrompt = `Here is the recent transcript and context for the user.\n\nTRANSCRIPT:\n${recentTranscripts}\n${taskContext}\n\nGenerate the updated Personality Profile.`;

        console.log(`[Personality Agent] Generating profile for ${userId}...`);

        let response: Awaited<ReturnType<typeof ai.models.generateContent>> | null = null;
        let lastGeminiError: unknown = null;
        let usedModel: (typeof GEMINI_MODELS)[number] | null = null;

        for (const [modelIndex, modelName] of GEMINI_MODELS.entries()) {
            for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS; attempt++) {
                try {
                    response = await ai.models.generateContent({
                        model: modelName,
                        contents: userPrompt,
                        config: {
                            systemInstruction: systemPrompt,
                            temperature: 0.7,
                        }
                    });
                    usedModel = modelName;
                    break;
                } catch (err) {
                    lastGeminiError = err;
                    const retryable = isRetryableGeminiNetworkError(err);
                    const isLastAttemptForModel = attempt === GEMINI_MAX_ATTEMPTS;
                    const hasFallbackModel = modelIndex < GEMINI_MODELS.length - 1;

                    if (!retryable) {
                        throw err;
                    }

                    if (isLastAttemptForModel) {
                        if (!hasFallbackModel) {
                            throw err;
                        }

                        console.warn(
                            `[Personality Agent] ${modelName} timed out after ${GEMINI_MAX_ATTEMPTS} attempts. Switching to fallback model...`
                        );
                        break;
                    }

                    const backoffMs = 1200 * attempt;
                    console.warn(
                        `[Personality Agent] ${modelName} attempt ${attempt} failed with network timeout. Retrying in ${backoffMs}ms...`
                    );
                    await sleep(backoffMs);
                }
            }

            if (response) {
                break;
            }
        }

        if (!response) {
            throw lastGeminiError ?? new Error('Gemini request failed');
        }

        const newProfile = response.text;

        if (!newProfile) {
            throw new Error('Gemini returned an empty profile');
        }

        // 5. Save back to Firestore
        await setDoc(userRef, {
            bodhi_personality_profile: newProfile,
            bodhi_last_personality_analysis_time: Date.now()
        }, { merge: true });

        console.log(`[Personality Agent] Successfully updated profile for ${userId} using ${usedModel ?? 'unknown_model'}`);

        return NextResponse.json({ status: 'success', profileLength: newProfile.length });

    } catch (error) {
        console.error('[Personality Agent] Error:', error);
        return NextResponse.json({
            status: 'skipped',
            reason: 'internal_error',
            message: 'Personality analysis failed safely. The main session can continue.',
        });
    }
}
