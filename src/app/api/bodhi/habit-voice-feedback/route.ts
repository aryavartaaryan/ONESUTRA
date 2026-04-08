import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// ── Ayurvedic timing windows per habit category ───────────────────────────────
const AYUR_TIMING: Record<string, { optimalHours: number[]; window: string; rationale: string }> = {
  morning: {
    optimalHours: [5, 6, 7, 8, 9, 10],
    window: '5–10 AM (Kapha kaal)',
    rationale: 'morning rituals cleanse overnight Ama and activate Agni',
  },
  sacred: {
    optimalHours: [3, 4, 5, 6],
    window: '3–6 AM (Brahma Muhurta)',
    rationale: 'the most sattvic hours for spiritual practices — mind is clearest',
  },
  midday: {
    optimalHours: [11, 12, 13, 14],
    window: '11 AM–2 PM (Pitta kaal)',
    rationale: 'peak Agni supports main meal and deep work',
  },
  evening: {
    optimalHours: [17, 18, 19, 20],
    window: '5–8 PM (Vata-Kapha sandhya)',
    rationale: 'evening practices calm Vata and prepare the body for rest',
  },
  night: {
    optimalHours: [20, 21, 22],
    window: '8–10 PM (pre-sleep Kapha)',
    rationale: 'night rituals build Ojas and deepen sleep quality',
  },
  anytime: {
    optimalHours: Array.from({ length: 24 }, (_, i) => i),
    window: 'anytime',
    rationale: 'this practice is beneficial at any hour',
  },
};

// ── Dosha-specific voice personality nudges ───────────────────────────────────
const DOSHA_NUDGE: Record<string, string> = {
  vata: 'Vata constitution needs grounding and routine — praise consistency warmly.',
  pitta: 'Pitta constitution thrives on challenge — acknowledge their discipline precisely.',
  kapha: 'Kapha constitution needs energising — be enthusiastic and motivating.',
};

export async function POST(request: NextRequest) {
  try {
    const {
      habitName,
      habitIcon,
      habitCategory,
      habitLifeArea,
      prakriti,
      nextHabitName,
      nextHabitIcon,
      completedCount,
      totalHabits,
    }: {
      habitName: string;
      habitIcon: string;
      habitCategory: string;
      habitLifeArea: string;
      prakriti?: string;
      nextHabitName?: string | null;
      nextHabitIcon?: string | null;
      completedCount: number;
      totalHabits: number;
    } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ voiceMessage: 'Practice logged! Keep going.', isOptimalTime: true });
    }

    // ── Determine current IST hour ──
    const istStr = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      hour12: false,
    });
    const h = parseInt(istStr, 10) % 24;
    const istTime = new Date().toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const timingInfo = AYUR_TIMING[habitCategory] ?? AYUR_TIMING.anytime;
    const isOptimalTime = timingInfo.optimalHours.includes(h);
    const doshaNote = DOSHA_NUDGE[prakriti ?? ''] ?? '';

    const remaining = totalHabits - completedCount;
    const allDone = remaining <= 0;

    const prompt = `You are Bodhi — a warm, wise Ayurvedic guide speaking directly to a sadhaka. Be extremely concise.

LOGGED PRACTICE: ${habitIcon} ${habitName} (category: ${habitCategory}, life area: ${habitLifeArea})
CURRENT IST TIME: ${istTime} (hour ${h})
OPTIMAL AYURVEDIC WINDOW: ${timingInfo.window}
IS OPTIMAL TIME: ${isOptimalTime ? 'YES — perfect timing!' : 'NO — outside optimal window'}
AYURVEDIC RATIONALE: ${timingInfo.rationale}
USER PRAKRITI: ${prakriti ?? 'unknown'}
${doshaNote}
TODAY'S PROGRESS: ${completedCount} of ${totalHabits} practices done
${nextHabitName ? `NEXT PRACTICE TO SUGGEST: ${nextHabitIcon} ${nextHabitName}` : allDone ? 'ALL DONE FOR THIS SLOT — celebrate!' : 'No specific next habit — encourage general continuation'}

TASK: Write exactly 1–2 short sentences (MAX 35 words total) that Bodhi speaks aloud. Rules:
1. First: acknowledge the logged practice with a specific Ayurvedic insight (e.g. what it cleanses, activates, or builds).
2. If timing is NOT optimal: gently note the better time window in 3–4 words.
3. End with: what to do next (name the next habit if given, or celebrate if all done).
4. Language: Hinglish (natural Hindi-English mix like "Agni strong hoga", "Ojas badhega"). Warm but crisp.
5. NO markdown, NO lists, NO explanations. Pure conversational speech only.`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ parts: [{ text: prompt }] }],
      config: { temperature: 0.7, maxOutputTokens: 80 },
    });

    let voiceMessage = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

    // Sanitise — strip markdown artifacts
    voiceMessage = voiceMessage
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    // Fallback if empty or too long
    if (!voiceMessage || voiceMessage.length < 5) {
      voiceMessage = nextHabitName
        ? `${habitName} logged — Agni activated! Ab ${nextHabitName} karo.`
        : allDone
        ? `Shabash! Aaj ka sadhana complete — aap ne apne Ojas ki raksha ki.`
        : `${habitName} logged — well done! Keep your practice alive.`;
    }

    return NextResponse.json({ voiceMessage, isOptimalTime });
  } catch (err) {
    console.error('[HabitVoiceFeedback]', err);
    return NextResponse.json({
      voiceMessage: 'Practice logged! Aapka Agni strong hai — keep going.',
      isOptimalTime: true,
    });
  }
}
