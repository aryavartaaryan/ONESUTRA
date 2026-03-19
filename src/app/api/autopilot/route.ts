import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildAdaptiveSystemInstruction } from '@/lib/agents/emotionMiddleware';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

/**
 * POST /api/autopilot
 * Body: { prompt, systemInstruction? }
 * Returns: { text: string }
 *
 * Used by:
 * - Client-side callAutoPilot() in page.tsx (when chat is open)
 * - AutoPilotBackgroundService (global, when any page is open)
 */
export async function POST(req: NextRequest) {
    const { prompt, systemInstruction } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
        return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    const adaptive = buildAdaptiveSystemInstruction(systemInstruction, prompt);

    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        ...(adaptive.systemInstruction ? { systemInstruction: adaptive.systemInstruction } : {}),
        generationConfig: {
            maxOutputTokens: 200,
            temperature: 0.75,
        },
    });

    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const text = result.response.text().trim();
    if (!text) {
        return NextResponse.json({ text: "I'll get back to you! 🙏" });
    }
    const finalText = adaptive.shouldSuggestBreathing
        ? `${text}\n\nTry a 5-minute breathing reset: inhale for 4, hold 4, exhale for 6.`
        : text;

    return NextResponse.json({
        text: finalText,
        emotion: adaptive.emotion,
    });
    // Note: No try/catch — let Next.js surface the real error in logs
    // instead of silently returning a fallback that confuses users
}
