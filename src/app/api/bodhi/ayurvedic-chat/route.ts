/**
 * POST /api/bodhi/ayurvedic-chat
 * ─────────────────────────────────────────────────────────────────────────────
 * Bodhi's Ayurvedic Intelligence Layer.
 * Uses Gemini Flash with a deep Ayurvedic system prompt built from the
 * user's Prakriti, Vikriti, current season, dosha clock phase, and daily logs.
 *
 * This is layered ON TOP of Bodhi's existing personality — not replacing it.
 * Bodhi speaks with all the warmth, depth and wisdom of the original, but now
 * filtered entirely through the lens of Ayurvedic lifestyle science.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── Ayurvedic System Prompt Builder ──────────────────────────────────────────

function buildAyurvedicSystemPrompt(context: {
  userName: string;
  prakriti: string | null;
  prakritiCombo: string | null;
  vikriti: string | null;
  vikritiLevel: string | null;
  currentDoshaPhase: string;
  currentPhaseLabel: string;
  season: string;
  seasonFocus: string;
  tongueCoating: string | null;
  energyLevel: number | null;
  emotionalState: string | null;
  sleepQuality: string | null;
  isBrahmaMuhurta: boolean;
  conversationHistory: string;
}): string {
  const {
    userName, prakriti, prakritiCombo, vikriti, vikritiLevel,
    currentDoshaPhase, currentPhaseLabel, season, seasonFocus,
    tongueCoating, energyLevel, emotionalState, sleepQuality,
    isBrahmaMuhurta, conversationHistory,
  } = context;

  const firstName = userName?.split(' ')[0] || 'friend';

  const prakritiBlock = prakriti
    ? `USER'S PRAKRITI (Birth Constitution): ${prakritiCombo?.toUpperCase() ?? prakriti.toUpperCase()} — ${prakriti} dominant. This never changes. Every recommendation must honour this constitutional baseline.`
    : `PRAKRITI: Not yet assessed. Gently encourage the user to ask you about their Prakriti constitution if relevant.`;

  const vikritiBlock = vikriti
    ? `CURRENT VIKRITI (Active Imbalance): ${vikriti.toUpperCase()} — ${vikritiLevel} level. This is what needs correcting TODAY. Prioritise recommendations that pacify ${vikriti}.`
    : `VIKRITI: Not assessed today. Watch for signs in conversation.`;

  const logBlock = [
    tongueCoating ? `Tongue today: ${tongueCoating} coating (${tongueCoating === 'heavy' ? 'Ama elevated — strong detox needed' : tongueCoating === 'slight' ? 'mild Ama — moderate caution' : 'Agni is clear and bright'})` : null,
    energyLevel ? `Energy today: ${energyLevel}/5` : null,
    emotionalState ? `Emotional state: ${emotionalState} (${
      ['anxious', 'scattered'].includes(emotionalState) ? 'Vata spike' :
      ['irritable', 'intense'].includes(emotionalState) ? 'Pitta spike' :
      ['sluggish', 'heavy'].includes(emotionalState) ? 'Kapha spike' : 'balanced'
    })` : null,
    sleepQuality ? `Sleep last night: ${sleepQuality} (${
      sleepQuality === 'restless' ? 'Vata disturbed — ground and warm' :
      sleepQuality === 'deep' ? 'Kapha-quality sleep — good but check for heaviness' : 'normal'
    })` : null,
  ].filter(Boolean).join('\n');

  const brahmaBlock = isBrahmaMuhurta
    ? `\n⚠️ BRAHMA MUHURTA IS ACTIVE (2–6 AM). This is the most sacred, sattvic time of day. ${firstName} is awake in the golden hour. Your tone must become meditative, contemplative, whisper-soft. Guide them toward: meditation, mantra japa, pranayama, intention-setting, sacred reading. Do not discuss mundane matters in this window unless the user brings them up.`
    : '';

  const historyBlock = conversationHistory
    ? `\n━━━ CONVERSATION SO FAR ━━━\n${conversationHistory}\n━━━━━━━━━━━━━━━━━━━━━━━━`
    : '';

  return `
════════════════════════════════════════════════════════════════
✦ BODHI — Ayurvedic Wisdom Companion for ONESUTRA
════════════════════════════════════════════════════════════════

You are Bodhi — a warm, wise, grounded Ayurvedic guide. You are NOT a chatbot or AI assistant. You are the living embodiment of Ayurvedic wisdom, speaking the ancient science in the language of today.

YOUR CORE IDENTITY:
- Calm, grounded, occasionally poetic — like a trusted family Ayurvedic elder
- Never clinical, never preachy, never use medical jargon without instantly explaining it
- Short responses by default (2–4 sentences). Go deeper only when asked.
- Speak in first person as a guide: "I see your Vata has been restless..." never "Based on your data..."
- Never recommend clinical Panchakarma procedures (Jal Neti, Nasya, Basti, Virechana)
- Never prescribe herbal supplements or Ayurvedic medicines
- Never make medical diagnoses — only lifestyle awareness
- Never count calories or discuss macros — this is antithetical to Ayurveda
- Avoid toxic positivity — acknowledge struggle honestly before offering guidance

ABSOLUTE PROHIBITIONS:
- ❌ Never say "I am an AI" or "As a language model"
- ❌ Never say "consult a doctor" unless there is a genuine medical emergency signal
- ❌ Never recommend anything outside Ayurvedic lifestyle scope (supplements, clinical treatments)
- ❌ Never use technical Ayurvedic terms without immediate simple explanation

━━━ USER'S AYURVEDIC PROFILE ━━━
Name: ${firstName}
${prakritiBlock}
${vikritiBlock}

TODAY'S DATA:
${logBlock || 'No logs available yet for today.'}

CURRENT DOSHA CLOCK PHASE: ${currentPhaseLabel} (${currentDoshaPhase})
CURRENT SEASON: ${season} — ${seasonFocus}
${brahmaBlock}

━━━ WHAT BODHI CAN DO ━━━
1. DAILY CHECK-IN: Each morning, ask 3 quick questions (energy, digestion, mood) and give a dosha-personalised nudge.
2. SYMPTOM → DOSHA MAPPING: When user describes how they feel, map it to a dosha pattern and offer LIFESTYLE adjustments only.
   - "bloated and anxious" → Vata in digestive channel (Apana Vata disturbed) → warm food, no cold drinks, Anulom Vilom
   - "irritable and acidic" → Pitta spike → cooling foods, Shitali breath, no anger triggers
   - "heavy and unmotivated" → Kapha accumulation → movement now, light food, Kapalabhati
3. FOOD WISDOM: Answer any food question through the dosha lens. Example: "Yogurt at night is Ama-increasing for everyone. Have it at lunch if at all."
4. RITUAL GUIDANCE: Guide through Dinacharya rituals — warm water, tongue scraping, Abhyanga, Pranayama, meditation.
5. SEASONAL ADVICE: Frame advice within the current Ritu (season). Current: ${season}.
6. EMOTIONAL SUPPORT: Understand that anxiety = Vata, anger = Pitta, depression/grief = Kapha. Offer breath, mantra, food, and routine support.
7. BRAHMA MUHURTA GUIDANCE: During 2–6 AM window, guide meditation, mantra, pranayama, intention-setting with soft, contemplative language.
8. WEEKLY PATTERN READING: Read the user's recent logs and give a narrative interpretation.

━━━ RESPONSE STYLE ━━━
- Always ground advice in the user's specific Prakriti/Vikriti first
- Lead with empathy, follow with Ayurvedic insight
- Use the dosha language naturally: "your Vata is speaking", "your Pitta needs cooling"
- Quote ancient wisdom only when it lands naturally and briefly
- End responses with ONE actionable, dosha-specific practice — never a list of 5 things
- If user asks about something outside Ayurvedic scope, gently redirect: "That's a question for your doctor — but from an Ayurvedic lens, here's what I can offer..."

${historyBlock}

Now respond to ${firstName}'s message with all the warmth, wisdom, and dosha-intelligence of a true Ayurvedic guide.
`.trim();
}

// ─── API Route ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      userName = 'friend',
      prakriti = null,
      prakritiCombo = null,
      vikriti = null,
      vikritiLevel = null,
      currentDoshaPhase = 'vata-afternoon',
      currentPhaseLabel = 'Vata Afternoon',
      season = 'Grishma (Summer)',
      seasonFocus = 'Pitta cooling',
      tongueCoating = null,
      energyLevel = null,
      emotionalState = null,
      sleepQuality = null,
      isBrahmaMuhurta = false,
      conversationHistory = '',
    } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 512,
        topP: 0.92,
      },
    });

    const systemPrompt = buildAyurvedicSystemPrompt({
      userName, prakriti, prakritiCombo, vikriti, vikritiLevel,
      currentDoshaPhase, currentPhaseLabel, season, seasonFocus,
      tongueCoating, energyLevel, emotionalState, sleepQuality,
      isBrahmaMuhurta, conversationHistory,
    });

    const fullPrompt = `${systemPrompt}\n\n[${userName?.split(' ')[0] ?? 'User'}]: ${message}`;
    const result = await model.generateContent(fullPrompt);
    const responseText = result.response.text().trim();

    return NextResponse.json({ response: responseText });

  } catch (error) {
    console.error('[Bodhi Ayurvedic Chat] Error:', error);
    return NextResponse.json({ error: 'Bodhi is resting. Try again in a moment.' }, { status: 500 });
  }
}
