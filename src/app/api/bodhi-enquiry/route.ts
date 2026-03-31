import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'] as const;

export async function POST(req: Request) {
    if (!process.env.GEMINI_API_KEY) {
        console.error('[BodhiEnquiry] GEMINI_API_KEY not set');
        return NextResponse.json({ reply: 'Bodhi is not configured. Please contact support 🙏' }, { status: 500 });
    }

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
            bio ? `- Bio: "${bio}"` : null,
            `- Member since: ${joinedDate}`,
            profession ? `- Profession: ${profession}` : null,
            hobbies ? `- Hobbies & Rituals: ${hobbies}` : null,
            interests ? `- Interests: ${interests}` : null,
            lifestyleTags ? `- Lifestyle: ${lifestyleTags}` : null,
            socialTags ? `- Social style: ${socialTags}` : null,
        ].filter(Boolean).join('\n');

        const isFriendMode = mode === 'add_friend';

        const roleInstructions = isFriendMode
            ? `Help the asker decide if they want to add ${targetName} as a friend. Highlight their positive energy, shared interests and good reasons to connect. Be warm, Gen-Z casual. 2-3 sentences max.`
            : `Share warm, insightful observations about ${name}'s wellness journey based on the profile data above. Explain what their Prakriti (${prakriti}) means for their personality and how it shapes their daily energy. Be spiritual, genuine, and concise — 3-4 sentences max.`;

        const systemInstruction = `You are Sakha Bodhi ✦ — the wise, warm AI companion on OneSUTRA, a conscious living platform.

You are being asked about a fellow member. Here is their real profile data:
${profileLines}

Your role this session: ${roleInstructions}

RULES — never break these:
1. Only use facts from the profile above. Do NOT fabricate or guess details.
2. Use ✦ symbol once or twice naturally for warmth.
3. Respond in English only.
4. If the profile has limited data, give rich Ayurvedic insight about their ${prakriti} Prakriti type.
5. Never refuse or say you cannot help. Always give a meaningful, warm answer.
6. Keep it SHORT — max 4 sentences. Punchy, real, insightful.
7. Never use markdown formatting (no asterisks, no headers). Plain natural speech only.`;

        const historyText = (history || [])
            .slice(-6)
            .map((m: { role: string; text: string }) =>
                `${m.role === 'user' ? 'SEEKER' : 'BODHI'}: ${m.text}`)
            .join('\n');

        const userPrompt = historyText
            ? `CONVERSATION SO FAR:\n${historyText}\n\nSEEKER: ${message.trim()}\n\nBODHI:`
            : `SEEKER: ${message.trim()}\n\nBODHI:`;

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        let lastError: unknown;
        for (const modelName of MODELS) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction,
                    generationConfig: {
                        temperature: 0.82,
                        maxOutputTokens: 300,
                    },
                });
                const result = await model.generateContent(userPrompt);
                const reply = result.response.text().trim();
                if (reply) {
                    console.log(`[BodhiEnquiry] ✅ Reply from ${modelName}`);
                    return NextResponse.json({ reply });
                }
            } catch (err) {
                lastError = err;
                console.warn(`[BodhiEnquiry] ${modelName} failed:`, (err as Error)?.message ?? err);
            }
        }

        throw lastError ?? new Error('All models returned empty');
    } catch (error: unknown) {
        console.error('[BodhiEnquiry] Final error:', (error as Error)?.message ?? error);
        return NextResponse.json(
            { reply: 'Bodhi is reflecting deeply... please ask again in a moment 🙏 ✦' },
            { status: 500 }
        );
    }
}
