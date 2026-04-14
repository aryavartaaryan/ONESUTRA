import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

const SYSTEM_PROMPT_EN = `You are Bodhi — a warm, wise Ayurvedic guide.
The user has just completed their daily morning health check-in.
Based on their answers, give ONE short spoken insight (2–3 sentences max, ≤45 words).

Rules:
- Name the elevated dosha naturally: Vata → "restless energy / wind in the system", Pitta → "heat / fire in the system", Kapha → "heaviness / earth energy".
- Always end with ONE specific, gentle action for today.
- Speak warmly, like a caring teacher — not clinical.
- Never say "your Vikruti". Never use technical Ayurvedic jargon without brief explanation.
- If balanced: celebrate briefly, encourage continuation.
- Speak ONLY in warm, natural English.
- NEVER output more than 3 sentences.`;

const SYSTEM_PROMPT_HI = `आप बोधि हैं — एक गर्मजोशी से भरे, बुद्धिमान आयुर्वेदिक मार्गदर्शक।
उपयोगकर्ता ने अभी अपनी दैनिक सुबह की स्वास्थ्य जांच पूरी की है।
उनके उत्तरों के आधार पर, एक छोटी सी बोली गई अंतर्दृष्टि दें (2–3 वाक्य, ≤45 शब्द)।

नियम:
- बढ़े हुए दोष को स्वाभाविक रूप से नाम दें: वात → "मन में बेचैनी / वायु की अधिकता", पित्त → "शरीर में गर्मी / अग्नि", कफ → "भारीपन / धरती ऊर्जा"।
- हमेशा एक विशिष्ट, सौम्य कार्य के साथ समाप्त करें।
- एक देखभाल करने वाले शिक्षक की तरह गर्मजोशी से बोलें — clinical न हों।
- "Vikruti" शब्द का उपयोग न करें।
- संतुलित होने पर: संक्षेप में उत्सव मनाएं, निरंतरता प्रोत्साहित करें।
- केवल हिंदी (देवनागरी) में बोलें।
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
      lang = 'en',
    } = body;

    const firstName = (userName ?? 'friend').split(' ')[0];
    const isHindi = lang === 'hi';

    // Skip nudge — short, warm message when user skipped 3 days in a row
    if (skipNudge) {
      const nudgeText = isHindi
        ? `${firstName}, आपने कुछ दिनों से जांच छोड़ी है — कोई दबाव नहीं। एक उत्तर भी मुझे आपको बेहतर मार्गदर्शन देने में मदद करता है। जब भी तैयार हों, मैं यहाँ हूँ।`
        : `${firstName}, you've skipped the check-in a few days — no pressure at all. Even one answer helps me guide you better. Whenever you're ready, I'm here.`;
      return NextResponse.json({ insight: nudgeText });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ insight: buildFallbackInsight(elevatedDosha, userName, isHindi) });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.82, maxOutputTokens: 120, topP: 0.9 },
    });

    const SYSTEM_PROMPT = isHindi ? SYSTEM_PROMPT_HI : SYSTEM_PROMPT_EN;
    const symptomsText = keySymptoms.length > 0
      ? (isHindi ? `आज के मुख्य संकेत: ${keySymptoms.join(', ')}.` : `Key signals today: ${keySymptoms.join(', ')}.`)
      : '';
    const dominantPercent = Math.max(vikrutiVata, vikrutiPitta, vikrutiKapha);
    const prompt = `${SYSTEM_PROMPT}

User: ${firstName}
Prakriti (birth constitution): ${prakriti || 'unknown'}
Today's Vikruti reading: Vata ${vikrutiVata}% · Pitta ${vikrutiPitta}% · Kapha ${vikrutiKapha}%
Elevated dosha today: ${elevatedDosha} (${dominantPercent}%)
${symptomsText}

${isHindi ? 'अब बोधि की सुबह की अंतर्दृष्टि बोलें — गर्मजोशी से, संक्षिप्त, कार्यात्मक:' : "Speak Bodhi's morning insight now — warm, short, actionable:"}`;

    const result = await model.generateContent(prompt);
    const insight = result.response.text().trim();

    return NextResponse.json({ insight });
  } catch (err) {
    console.error('[daily-checkin] error:', err);
    const { elevatedDosha = 'balanced', userName = 'friend', lang = 'en' } = await req.json().catch(() => ({}));
    return NextResponse.json({ insight: buildFallbackInsight(elevatedDosha, userName, lang === 'hi') });
  }
}

function buildFallbackInsight(dosha: string, userName: string, isHindi = false): string {
  const name = (userName ?? 'friend').split(' ')[0];
  if (isHindi) {
    switch (dosha) {
      case 'vata':
        return `${name}, आज वात शांति मांग रहा है। गर्म भोजन लें, धीरे चलें और मन को विश्राम दें।`;
      case 'pitta':
        return `${name}, आज तंत्र में थोड़ी गर्मी है — ठंडा पानी पिएं और जल्दबाजी से बचें।`;
      case 'kapha':
        return `${name}, शरीर हिलना चाहता है — एक छोटी सी सक्रियता से भारीपन हट जाएगा।`;
      default:
        return `${name}, आज आप संतुलित हैं। यह लय बनाए रखें — आपकी नियमितता ही आपकी शक्ति है।`;
    }
  }
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
