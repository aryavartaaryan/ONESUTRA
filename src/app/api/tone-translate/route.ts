/**
 * SUTRAtalk — Tone Translator API
 * Feature 2: Real-Time Tone & Sentiment Translation
 *
 * POST /api/tone-translate
 * Body: { text: string, tone: 'professional' | 'empathetic' | 'direct' | 'deescalate' }
 * Returns: { transformed: string }
 *
 * Uses Gemini 2.5 Flash for <800ms turnaround.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// ── Per-tone system prompts (precision-engineered to prevent hallucination) ──
const TONE_PROMPTS: Record<string, string> = {
    professional: `You are a tone adjustment assistant. Rewrite the user's message to sound professional and polished.
STRICT RULES:
- Preserve 100% of the original meaning. Do NOT add or remove facts.
- Use formal language, avoid slang, emojis, or contractions.
- Keep the same message length (±20%).
- Return ONLY the rewritten text. No explanations, no quotes, no preamble.`,

    empathetic: `You are a tone adjustment assistant. Rewrite the user's message to be warm, empathetic, and emotionally intelligent.
STRICT RULES:
- Preserve 100% of the original meaning. Do NOT add or remove facts.
- Acknowledge the other person's feelings. Use inclusive language ("we", "together").
- Keep the same message length (±20%).
- Return ONLY the rewritten text. No explanations, no quotes, no preamble.`,

    direct: `You are a tone adjustment assistant. Rewrite the user's message to be clear, concise, and direct.
STRICT RULES:
- Preserve 100% of the original meaning. Do NOT add or remove facts.
- Cut filler words. Lead with the main point. Use active voice.
- Aim for 30% fewer words while keeping all key information.
- Return ONLY the rewritten text. No explanations, no quotes, no preamble.`,

    deescalate: `You are a tone adjustment assistant. Rewrite the user's message to de-escalate tension and promote calm dialogue.
STRICT RULES:
- Preserve 100% of the original meaning. Do NOT add or remove facts.
- Remove charged language, soften absolutes ("always/never" → "sometimes/often").
- Use "I" statements. Avoid blame. Be respectful but firm.
- Keep the same message length (±20%).
- Return ONLY the rewritten text. No explanations, no quotes, no preamble.`,
};

export async function POST(req: Request) {
    try {
        const { text, tone } = await req.json();

        if (!text || typeof text !== "string" || text.trim().length === 0) {
            return NextResponse.json({ error: "text is required" }, { status: 400 });
        }

        const systemInstruction = TONE_PROMPTS[tone];
        if (!systemInstruction) {
            return NextResponse.json({ error: "Invalid tone. Use: professional, empathetic, direct, deescalate" }, { status: 400 });
        }

        // Gemini Flash — optimized for speed
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction,
        });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text }] }],
            generationConfig: {
                maxOutputTokens: 300,
                temperature: 0.4, // low temp = more deterministic, less hallucination
                topP: 0.9,
            },
        });

        const transformed = result.response.text().trim();

        return NextResponse.json({ transformed }, { status: 200 });
    } catch (err) {
        console.error("[tone-translate]", err);
        return NextResponse.json({ error: "Translation failed" }, { status: 500 });
    }
}
