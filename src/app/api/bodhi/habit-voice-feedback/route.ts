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
  afternoon: {
    optimalHours: [14, 15, 16, 17, 18],
    window: '2–6 PM (Vata kaal)',
    rationale: 'Vata time — gentle practices anchor scattered energy',
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

// ── Dosha-specific coaching tone ─────────────────────────────────────────────
const DOSHA_COACHING: Record<string, string> = {
  vata: 'User has Vata prakriti or elevated Vata. They need grounding, warmth, and reassurance. Connect the habit to stability, nervous system calm, and anchoring scattered energy. Use words like "grounding", "anchored", "warm", "steady".',
  pitta: 'User has Pitta prakriti or elevated Pitta. They respond to precision and purpose. Connect the habit to focus, intensity used wisely, and cooling the fire. Warn gently if sustained intensity might aggravate Pitta. Use words like "sharp", "purposeful", "cool", "channelled".',
  kapha: 'User has Kapha prakriti or elevated Kapha. They need energising and motivating. Connect the habit to lightness, movement, and breaking inertia. Be enthusiastic. Use words like "light", "moving", "alive", "energised".',
};

// ── Time-of-day colour ────────────────────────────────────────────────────────
const TIME_OF_DAY_CONTEXT: Record<string, string> = {
  'pre-dawn': 'It is Brahma Muhurta (2–6 AM) — the most sacred window. If the user is awake and practising now, celebrate it. This hour is called the creator\'s hour — mind is clearest, most receptive.',
  morning: 'It is Kapha time (6–10 AM). Morning habits exist to break through Kapha\'s heaviness. Every practice now is clearing overnight Ama and activating Agni for the whole day.',
  midday: 'It is Pitta time (10 AM–2 PM). Peak digestion and mental focus. Deep work and important decisions belong here. Agni is at its strongest.',
  afternoon: 'It is the first Vata window (2–6 PM). Energy naturally fluctuates — this is normal. Gentle encouragement. Even 5 minutes of stillness helps anchor Vata energy.',
  evening: 'It is the second Kapha window (6–10 PM). The body wants to slow and wind down. Guide toward completion, rest, and evening rituals.',
  night: 'It is the second Pitta window (10 PM–2 AM). The body is doing deep cellular repair and liver detox. The best practice now is sleep. Gently note this if they are logging late.',
};

export async function POST(request: NextRequest) {
  let language: 'en' | 'hi' = 'hi';
  try {
    const body = await request.json();
    language = (body.language === 'en') ? 'en' : 'hi';
    const {
      habitName,
      habitIcon,
      habitCategory,
      habitLifeArea,
      prakriti,
      currentDoshaImbalance,
      nextHabitName,
      nextHabitIcon,
      completedCount,
      totalHabits,
      streakDays,
      streakTier,
      disciplineScoreToday,
      disciplineScoreYesterday,
      isFirstHabitToday,
      prakritiBalanceScore,
      currentTimeOfDay,
    }: {
      habitName: string;
      habitIcon: string;
      habitCategory: string;
      habitLifeArea: string;
      prakriti?: string;
      currentDoshaImbalance?: string;
      nextHabitName?: string | null;
      nextHabitIcon?: string | null;
      completedCount: number;
      totalHabits: number;
      streakDays?: number;
      streakTier?: string;
      disciplineScoreToday?: number;
      disciplineScoreYesterday?: number;
      isFirstHabitToday?: boolean;
      prakritiBalanceScore?: number;
      currentTimeOfDay?: string;
    } = body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        voiceMessage: language === 'hi' ? 'अभ्यास पूर्ण! जारी रखें।' : 'Practice logged! Keep going.',
        isOptimalTime: true,
      });
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

    // ── Derive time-of-day window ──
    const derivedTimeOfDay = currentTimeOfDay ?? (
      h >= 2 && h < 6 ? 'pre-dawn'
        : h >= 6 && h < 10 ? 'morning'
          : h >= 10 && h < 14 ? 'midday'
            : h >= 14 && h < 18 ? 'afternoon'
              : h >= 18 && h < 22 ? 'evening'
                : 'night'
    );

    const timingInfo = AYUR_TIMING[habitCategory] ?? AYUR_TIMING.anytime;
    const isOptimalTime = timingInfo.optimalHours.includes(h);
    const doshaCoaching = DOSHA_COACHING[prakriti?.toLowerCase() ?? ''] ?? '';
    const timeCtx = TIME_OF_DAY_CONTEXT[derivedTimeOfDay] ?? '';

    const remaining = totalHabits - completedCount;
    const allDone = remaining <= 0;

    // ── Streak milestone check ──
    const isMilestoneDay = [7, 21, 84, 180].includes(streakDays ?? 0);
    const isExceptionalScore = (disciplineScoreToday ?? 0) >= 90;
    const shouldMentionStreak = isFirstHabitToday || isMilestoneDay || isExceptionalScore;

    const prompt = `You are Bodhi — the OneSutra AI Buddy. A warm, wise Ayurveda-grounded companion. You speak like a knowledgeable friend, not a health app.

═══════════════════════════════════════
USER CONTEXT
═══════════════════════════════════════
Logged habit: ${habitIcon} ${habitName} (category: ${habitCategory}, life area: ${habitLifeArea})
Current IST time: ${istTime} (hour: ${h}) — Time of day: ${derivedTimeOfDay}
Optimal Ayurvedic window: ${timingInfo.window} — Timed correctly: ${isOptimalTime ? 'YES' : 'NO (off-window)'}
Ayurvedic rationale: ${timingInfo.rationale}

User prakriti (constitution): ${prakriti ?? 'unknown'}
Current dosha imbalance: ${currentDoshaImbalance ?? 'unknown'}
Prakriti balance score: ${prakritiBalanceScore ?? 'unknown'}/100

Today's progress: ${completedCount} of ${totalHabits} habits done
Discipline score today: ${disciplineScoreToday ?? 'unknown'}%
Discipline score yesterday: ${disciplineScoreYesterday ?? 'unknown'}%
Is this the first habit logged today: ${isFirstHabitToday ? 'YES' : 'NO'}

Streak: ${streakDays ?? 0} days (${streakTier ?? 'Seed'} tier)
Is this a streak milestone day: ${isMilestoneDay ? 'YES — ' + streakTier + ' tier reached!' : 'NO'}

${nextHabitName ? `Next habit to suggest: ${nextHabitIcon ?? ''} ${nextHabitName}` : allDone ? 'ALL HABITS DONE FOR TODAY' : 'No specific next habit — encourage continuation'}

═══════════════════════════════════════
DOSHA COACHING FRAMEWORK
═══════════════════════════════════════
${doshaCoaching}

CURRENT TIME CONTEXT:
${timeCtx}

═══════════════════════════════════════
YOUR RESPONSE STRUCTURE (MANDATORY)
═══════════════════════════════════════

Write exactly 3–5 sentences max. No bullet points. Conversational speech only. No markdown.

You MUST include ALL FOUR of these in your response:

1. CONFIRMATION (1 sentence): Acknowledge the habit specifically. Name it. Make it feel real. NEVER just say "logged" or "done".

2. WHY IT MATTERS FOR THIS USER (1–2 sentences): Connect THIS habit to their prakriti (${prakriti ?? 'unknown'}) and their current imbalance (${currentDoshaImbalance ?? 'unknown'}). Tell them what this specific practice is doing for their body or mind right now.

3. WHAT TO DO NEXT (1 sentence): Either name the next habit + ideal timing, or give a complementary action that amplifies this one. If all done, celebrate genuinely.

4. STREAK / MOMENTUM NOTE (1 sentence, ONLY if momentum is meaningful): Include ONLY if: it's their first habit of the day (${isFirstHabitToday ? 'YES — include this' : 'NO — skip this'}), OR a streak milestone was reached today (${isMilestoneDay ? 'YES — ' + streakDays + ' days! Include this with Ayurvedic milestone language' : 'NO — skip this'}), OR their score is exceptional (${isExceptionalScore ? 'YES — score is ' + disciplineScoreToday + '%! Acknowledge discipline' : 'NO — skip this'}).

If timing is off-window: mention the better window briefly in 3–4 words.

If the user is logging at Brahma Muhurta (pre-dawn): celebrate that they are awake in the creator's hour.

EXAMPLES OF GOOD RESPONSES (study these):
- "Tongue cleaning done — your agni thanks you. This removes the ama that built up overnight, so your digestion starts clean today. Up next: warm water, then oil pulling — ideally within the next 10 minutes while you're still in morning mode."
- "Morning sun — Vata's best medicine. For you, this 10 minutes is regulating your nervous system and circadian rhythm, which directly calms the anxiety patterns your elevated Vata creates. Next is breakfast — your agni is primed right now, best window is within 30 minutes."
- "Deep work locked in — that's your Pitta putting its focus to good use. Since your Pitta is currently elevated, set a hard stop at 90 minutes and take a short walk before your next session — sustained mental intensity without breaks aggravates Pitta over time."

DO NOT use markdown. DO NOT use bullet points. Pure warm, conversational speech only. Max 5 sentences total.

${language === 'hi' ? 'LANGUAGE INSTRUCTION (MANDATORY): Respond ENTIRELY in Hindi using Devanagari script. Write in warm, conversational Hindi as a knowledgeable friend would speak. You may naturally use Sanskrit/Ayurvedic terms (like Agni, Vata, Pitta, Kapha, Ojas, Ama, Prakriti) as they are widely understood — but all other words must be in Hindi.' : ''}`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ parts: [{ text: prompt }] }],
      config: { temperature: 0.75, maxOutputTokens: 160 },
    });

    let voiceMessage = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

    // Sanitise — strip markdown artifacts
    voiceMessage = voiceMessage
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    // Fallback if empty or too short
    if (!voiceMessage || voiceMessage.length < 10) {
      const doshaWord = currentDoshaImbalance ?? prakriti ?? (language === 'hi' ? 'आपके दोषा' : 'your dosha');
      if (language === 'hi') {
        voiceMessage = nextHabitName
          ? `${habitName} — बहुत बढ़िया! यह आपके ${doshaWord} संतुलन को सच में पोषित करता है। अगला अभ्यास: ${nextHabitName}.`
          : allDone
            ? `आज के सभी अभ्यास पूर्ण — यह दुर्लभ अनुशासन है। आपका ${doshaWord} संतुलन दिन-प्रतिदिन बन रहा है।`
            : `${habitName} पूर्ण — इसी लय को बनाए रखें।`;
      } else {
        voiceMessage = nextHabitName
          ? `${habitName} — well done. This nourishes your ${doshaWord} balance in a real way. Up next: ${nextHabitName}.`
          : allDone
            ? `Every habit done today — that's rare discipline. Your ${doshaWord} balance is being actively built, day by day.`
            : `${habitName} done — keep the rhythm going.`;
      }
    }

    return NextResponse.json({ voiceMessage, isOptimalTime });
  } catch (err) {
    console.error('[HabitVoiceFeedback]', err);
    return NextResponse.json({
      voiceMessage: language === 'hi'
        ? 'अभ्यास लॉग हुआ! हर अभ्यास आपके प्राकृति संतुलन को मजबूत करता है — जारी रखें।'
        : 'Practice logged! Every habit you complete is building your prakriti balance — keep going.',
      isOptimalTime: true,
    });
  }
}
