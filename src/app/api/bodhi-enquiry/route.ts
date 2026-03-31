import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'] as const;

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function isRetryable(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const e = error as { message?: string; code?: string; cause?: { code?: string } };
    const msg = `${e.message ?? ''} ${e.cause?.code ?? ''}`.toLowerCase();
    return msg.includes('connect timeout') || msg.includes('fetch failed') ||
        msg.includes('socket hang up') || msg.includes('econnreset') || msg.includes('etimedout') ||
        msg.includes('503') || msg.includes('overloaded');
}

export async function POST(req: Request) {
    try {
        const { targetName, targetProfile, history, message, mode } = await req.json();

        if (!message?.trim()) {
            return NextResponse.json({ error: 'Missing message' }, { status: 400 });
        }

        const prakriti = targetProfile?.prakriti || 'Unknown';
        const bio = targetProfile?.bio || '';
        const joinedDate = targetProfile?.joinedDate || 'Recently';
        const interests = (targetProfile?.interests || []).join(', ') || '';
        const hobbies = (targetProfile?.hobbies || []).join(', ') || '';
        const profession = targetProfile?.profession || '';
        const lifestyleTags = (targetProfile?.lifestyleTags || []).join(', ') || '';
        const socialTags = (targetProfile?.socialTags || []).join(', ') || '';
        const name = targetProfile?.name || targetName;

        const profileLines = [
            `- Name: ${name}`,
            `- Ayurvedic Prakriti: ${prakriti}`,
            bio ? `- Bio: ${bio}` : null,
            `- Member since: ${joinedDate}`,
            profession ? `- Profession: ${profession}` : null,
            hobbies ? `- Hobbies & Rituals: ${hobbies}` : null,
            interests ? `- Interests: ${interests}` : null,
            lifestyleTags ? `- Lifestyle: ${lifestyleTags}` : null,
            socialTags ? `- Social style: ${socialTags}` : null,
        ].filter(Boolean).join('\n');

        const isFriendMode = mode === 'add_friend';

        const roleInstructions = isFriendMode
            ? `Help the asker decide if they want to add ${targetName} as a friend. Highlight shared interests and positive reasons to connect. Be friendly and Gen-Z casual. Keep it 2-3 sentences max.`
            : `Share warm, insightful observations about this person's wellness journey based on their profile. Explain what their Prakriti (${prakriti}) means for their personality and how it shapes their energy. Be spiritual yet concise (3-4 sentences max).`;

        const systemContext = `You are Bodhi (Sakha Bodhi) ✦ — the warm, wise AI companion on OneSUTRA, a conscious living platform.

You are being asked about a fellow member named "${targetName}". Their real profile data:
${profileLines}

Instructions: ${roleInstructions}

CRITICAL RULES:
- Only discuss details present in the profile above. Do NOT fabricate.  
- Use ✦ occasionally to add warmth.
- Respond in English only.
- If the profile is minimal, share warm insights about their Prakriti type.
- Never say you cannot help. Always give a meaningful, warm answer.
- Keep responses short and punchy — maximum 4 sentences.`;

        const historyText = (history || [])
            .slice(-6)
            .map((m: { role: string; text: string }) =>
                `${m.role === 'user' ? 'SEEKER' : 'BODHI'}: ${m.text}`)
            .join('\n');

        const userPrompt = historyText
            ? `CONVERSATION SO FAR:\n${historyText}\n\nSEEKER: ${message.trim()}\n\nBODHI:`
            : `SEEKER: ${message.trim()}\n\nBODHI:`;

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

        let lastError: unknown;
        for (const modelName of MODELS) {
            for (let attempt = 0; attempt < 2; attempt++) {
                try {
                    const response = await ai.models.generateContent({
                        model: modelName,
                        contents: userPrompt,
                        config: {
                            systemInstruction: systemContext,
                            temperature: 0.78,
                            maxOutputTokens: 280,
                        },
                    });
                    const reply = (response.text ?? '').trim();
                    if (reply) {
                        console.log(`[BodhiEnquiry] ✅ Got reply from ${modelName}`);
                        return NextResponse.json({ reply });
                    }
                } catch (err) {
                    lastError = err;
                    console.warn(`[BodhiEnquiry] Attempt ${attempt + 1} with ${modelName} failed:`, err);
                    if (isRetryable(err) && attempt === 0) {
                        await sleep(900);
                        continue;
                    }
                    break;
                }
            }
        }

        throw lastError;
    } catch (error: unknown) {
        console.error('[BodhiEnquiry API] Final error:', error);
        return NextResponse.json(
            { reply: 'I\'m unable to connect right now. Please try again soon 🙏 ✦' },
            { status: 500 }
        );
    }
}
