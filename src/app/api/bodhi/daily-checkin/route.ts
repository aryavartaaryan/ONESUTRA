import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `You are Bodhi — a warm, wise Ayurvedic guide.
The user has just completed their daily morning health check-in.
Based on their answers, give ONE short spoken insight (2–3 sentences max, ≤45 words).

Rules:
- Name the elevated dosha naturally: Vata → "restless energy / wind in the system", Pitta → "heat / fire in the system", Kapha → "heaviness / earth energy".
- Always end with ONE specific, gentle action for today.
- Speak warmly, like a caring teacher — not clinical.
- Never say "your Vikruti". Never use technical Ayurvedic jargon without brief explanation.
- If balanced: celebrate briefly, encourage continuation.
- Language: mix Hindi terms naturally if user seems Hindi-speaking, otherwise plain English.
- NEVER output more than 3 sentences.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userName = 'friend',
      elevatedDosha = 'balanced',
      vikrutiVata = 33,
      vikrutiPitta = 33,
      vikrutiKapha = 34,
      keySymptoms = [] as string[],
      prakriti = '',
      skipNudge = false,
    } = body;

    // Skip nudge — short, warm message when user skipped 3 days in a row
    if (skipNudge) {
      const nudgeText = `${userName.split(' ')[0]}, you've skipped the check-in a few days — no pressure at all. Even one answer helps me guide you better. Whenever you're ready, I'm here.`;
      return NextResponse.json({ insight: nudgeText });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ insight: buildFallbackInsight(elevatedDosha, userName) });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.82, maxOutputTokens: 120, topP: 0.9 },
    });

    const symptomsText = keySymptoms.length > 0 ? `Key signals today: ${keySymptoms.join(', ')}.` : '';
    const dominantPercent = Math.max(vikrutiVata, vikrutiPitta, vikrutiKapha);
    const prompt = `${SYSTEM_PROMPT}

User: ${userName.split(' ')[0]}
Prakriti (birth constitution): ${prakriti || 'unknown'}
Today's Vikruti reading: Vata ${vikrutiVata}% · Pitta ${vikrutiPitta}% · Kapha ${vikrutiKapha}%
Elevated dosha today: ${elevatedDosha} (${dominantPercent}%)
${symptomsText}

Speak Bodhi's morning insight now — warm, short, actionable:`;

    const result = await model.generateContent(prompt);
    const insight = result.response.text().trim();

    return NextResponse.json({ insight });
  } catch (err) {
    console.error('[daily-checkin] error:', err);
    const { elevatedDosha = 'balanced', userName = 'friend' } = await req.json().catch(() => ({}));
    return NextResponse.json({ insight: buildFallbackInsight(elevatedDosha, userName) });
  }
}

function buildFallbackInsight(dosha: string, userName: string): string {
  const name = (userName ?? 'friend').split(' ')[0];
  switch (dosha) {
    case 'vata':
      return `${name}, your Vata is asking for warmth and stillness today. Move gently, eat something warm, and let your mind rest between tasks.`;
    case 'pitta':
      return `Some heat in the system today, ${name} — your practices will help cool things down. Stay hydrated and avoid rushing.`;
    case 'kapha':
      return `The body wants to move, ${name} — even small actions will shift the heaviness. Start with one brisk activity and let momentum build.`;
    default:
      return `You're in good balance today, ${name}. Keep the rhythm going — your consistency is building real strength.`;
  }
}
