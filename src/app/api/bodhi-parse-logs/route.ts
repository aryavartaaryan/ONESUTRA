import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'] as const;

const SYSTEM_PROMPT = `You are a lean Data Extraction Agent for a wellness logging system called "Bodhi Logs" on OneSUTRA.

Your ONLY job: Parse the user's free-text input into structured JSON log entries.

AVAILABLE CATEGORIES:
- dhyana: Meditation, breathwork, pranayama, Anulom Vilom, Kapalbhati, mindfulness
- aahar: Meals, food eaten, dietary choices, snacks, drinks (non-water)
- nidra_wake: Waking up time in the morning
- nidra_sleep: Going to sleep time, bedtime, sleep duration/quality
- swadhyaya: Reading, journaling, learning, studying, self-study
- ekagra: Deep work, focused coding, concentrated study/work sessions
- sankalpa: Challenges overcome, problems solved, obstacles cleared
- spurana: New ideas, creative insights, brainstorming
- upavasa: Fasting, intermittent fasting start/end
- vyayama: Gym, yoga asana, running, walking, pushups, any physical exercise
- arogya: Feeling unwell, sickness, health complaints
- bhava: Mood check-in, emotional state, energy level description
- pratyahara: Digital detox, time away from screens/phone
- kritagyata: Gratitude expression, thankfulness
- hydration: Water intake, fluid tracking
- custom: Anything that doesn't fit above categories

OUTPUT FORMAT — strict JSON array:
[
  {
    "category": "<category_id>",
    "action": "<short 3-8 word summary>",
    "duration": "<if mentioned, e.g. '15 min', '6 hours'>",
    "quality": "<if mentioned, e.g. 'good', 'groggy', 'energized'>",
    "details": "<any extra context in 1 line>",
    "time": "<if mentioned, e.g. '6:30 AM', 'morning'>"
  }
]

RULES:
1. ALWAYS return valid JSON array. No markdown, no explanation, no extra text.
2. One input can produce MULTIPLE entries if the user mentions multiple activities.
3. If input is ambiguous, pick the best-fit category.
4. Keep "action" short and clear in English.
5. Support Hindi/Hinglish input — translate to English for action field.
6. If nothing is parseable, return: [{"category":"custom","action":"General note","details":"<user input>"}]
7. Never return empty array.`;

export async function POST(req: Request) {
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ entries: [{ category: 'custom', action: 'Log noted', details: 'AI not configured' }] }, { status: 200 });
    }

    try {
        const { message } = await req.json();
        if (!message?.trim()) {
            return NextResponse.json({ error: 'Missing message' }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const userPrompt = `Parse this wellness log entry:\n"${message.trim()}"`;

        let lastError: unknown;
        for (const modelName of MODELS) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: SYSTEM_PROMPT,
                    generationConfig: {
                        temperature: 0.15,
                        maxOutputTokens: 800,
                        responseMimeType: 'application/json',
                    },
                });
                const result = await model.generateContent(userPrompt);
                const raw = result.response.text().trim();

                // Parse the JSON response
                const entries = JSON.parse(raw);
                if (Array.isArray(entries) && entries.length > 0) {
                    console.log(`[BodhiParseLogs] ✅ Parsed ${entries.length} entries via ${modelName}`);
                    return NextResponse.json({ entries });
                }
            } catch (err) {
                lastError = err;
                console.warn(`[BodhiParseLogs] ${modelName} failed:`, (err as Error)?.message ?? err);
            }
        }

        throw lastError ?? new Error('All models failed');
    } catch (error: unknown) {
        console.error('[BodhiParseLogs] Error:', (error as Error)?.message ?? error);
        return NextResponse.json({
            entries: [{ category: 'custom', action: 'Log noted', details: 'Could not parse — saved as-is' }]
        }, { status: 200 });
    }
}
