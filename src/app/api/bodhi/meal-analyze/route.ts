/**
 * POST /api/bodhi/meal-analyze
 * ─────────────────────────────────────────────────────────────────────────────
 * Vaidya — OneSutra Ayurvedic Meal Intelligence
 * Accepts a meal photo (base64) + user context and returns a full JSON
 * Ayurvedic meal analysis using the Gemini Vision model.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface MealAnalyzeRequest {
  image_base64: string;       // base64 without data URI prefix
  mime_type?: string;         // default: image/jpeg
  user_prakriti: string;      // e.g. "Vata-Pitta"
  kala: string;               // e.g. "Kapha Kala (6–10 AM)"
  timestamp: string;          // e.g. "7:42 AM"
  season: string;             // e.g. "Shishira (late winter)"
  meal_type: string;          // Breakfast / Lunch / Dinner
  hunger_level: string;       // Not hungry / Mildly hungry / Hungry / Starving
  meal_description: string;   // User's typed description
  user_name?: string;
}

function buildSystemPrompt(ctx: MealAnalyzeRequest): string {
  return `You are Vaidya, the Ayurvedic food intelligence of OneSutra — an expert rooted in
Charaka Samhita, Ashtanga Hridayam, and Sushruta Samhita. Analyze the uploaded meal
photo and description with the depth of a classical Ayurvedic physician.

USER PRAKRITI: ${ctx.user_prakriti || 'Not assessed'}
CURRENT KALA: ${ctx.kala}
CURRENT TIME: ${ctx.timestamp}
SEASON (Ritu): ${ctx.season}
MEAL TYPE: ${ctx.meal_type}
HUNGER LEVEL: ${ctx.hunger_level}
MEAL DESCRIPTION: ${ctx.meal_description || 'Not provided — infer from image'}

═══════════════════════════════════════════════
ANALYSIS STRUCTURE — respond ONLY as valid JSON
═══════════════════════════════════════════════

{
  "meal_identified": "Name of the dish(es) detected",
  "confidence": 0,
  "sattvic_score": 0,
  "agni_assessment": {
    "impact": "Deepana | Sama | Manda | Vishama",
    "explanation": "2-3 sentences on how this meal affects digestive fire"
  },
  "shad_rasa": {
    "madhura": { "presence": "Dominant|Moderate|Mild|Absent", "note": "..." },
    "amla":    { "presence": "Dominant|Moderate|Mild|Absent", "note": "..." },
    "lavana":  { "presence": "Dominant|Moderate|Mild|Absent", "note": "..." },
    "katu":    { "presence": "Dominant|Moderate|Mild|Absent", "note": "..." },
    "tikta":   { "presence": "Dominant|Moderate|Mild|Absent", "note": "..." },
    "kashaya": { "presence": "Dominant|Moderate|Mild|Absent", "note": "..." },
    "rasa_balance_insight": "How the taste profile affects the user's prakriti"
  },
  "dosha_impact": {
    "vata":  { "effect": "Balancing|Aggravating|Neutral", "percentage": 0, "reasoning": "..." },
    "pitta": { "effect": "Balancing|Aggravating|Neutral", "percentage": 0, "reasoning": "..." },
    "kapha": { "effect": "Balancing|Aggravating|Neutral", "percentage": 0, "reasoning": "..." }
  },
  "prakriti_compatibility": {
    "overall_score": 0,
    "vata_score": 0,
    "pitta_score": 0,
    "kapha_score": 0,
    "summary": "2-3 sentences personalized to the user's prakriti"
  },
  "guna_analysis": {
    "dominant_guna": "Sattvic | Rajasic | Tamasic",
    "sattvic_elements": [],
    "rajasic_elements": [],
    "tamasic_elements": []
  },
  "timing_analysis": {
    "kala_alignment": "Ideal | Acceptable | Not Recommended",
    "reasoning": "Why this meal is or isn't suitable at this kala for this prakriti",
    "ritu_alignment": "How it aligns with the current season",
    "hunger_comment": "Based on hunger level, is the meal appropriate in quantity and nature"
  },
  "viruddha_ahara_check": {
    "incompatibilities_found": false,
    "items": []
  },
  "insights": [
    {
      "type": "positive | warning | negative",
      "title": "Short title",
      "body": "2-3 sentences with specific classical reference if applicable"
    }
  ],
  "after_meal_protocol": [
    "Walk 100 steps (Shatapavali) immediately after meal to aid Samana Vata...",
    "Sip warm water with rock salt after 20 minutes...",
    "...",
    "..."
  ],
  "avoid_next_meal": [],
  "sakha_message": "A warm, poetic 1-2 sentence insight in Hinglish that Sakha would say"
}

STRICT RULES:
- Cite specific Charaka or Ashtanga Hridayam chapters when making claims if you are confident.
- Never invent findings. If photo is unclear, lower confidence and note it.
- The after_meal_protocol must contain EXACTLY 4 items, time-specific (e.g. "immediately after", "20 minutes later").
- Personalize EVERY section to the user's prakriti — generic Ayurveda is not acceptable.
- insights must contain minimum 3 and maximum 5 items.
- Use "aap" (respectful) not "tum" in Hinglish text.
- sakha_message must be warm, poetic, conversational Hinglish — not formal.
- Respond ONLY with valid JSON. No markdown. No preamble. No trailing text.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Partial<MealAnalyzeRequest>;

    const {
      image_base64 = '',
      mime_type = 'image/jpeg',
      user_prakriti = 'Not assessed',
      kala = '',
      timestamp = '',
      season = '',
      meal_type = 'Meal',
      hunger_level = 'Hungry',
      meal_description = '',
      user_name = 'friend',
    } = body;

    if (!image_base64?.trim()) {
      return NextResponse.json({ error: 'image_base64 is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        topP: 0.9,
        responseMimeType: 'application/json',
      },
    });

    const ctx: MealAnalyzeRequest = {
      image_base64,
      mime_type,
      user_prakriti,
      kala,
      timestamp,
      season,
      meal_type,
      hunger_level,
      meal_description,
      user_name,
    };

    const result = await model.generateContent([
      buildSystemPrompt(ctx),
      {
        inlineData: {
          data: image_base64,
          mimeType: mime_type as 'image/jpeg' | 'image/png' | 'image/webp',
        },
      },
    ]);

    const raw = result.response.text().trim();

    let analysis: Record<string, unknown>;
    try {
      analysis = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json({ error: 'Vaidya could not parse the meal. Try a clearer photo.' }, { status: 422 });
      }
      analysis = JSON.parse(match[0]);
    }

    return NextResponse.json({ analysis, user_name });

  } catch (error) {
    console.error('[Meal Analyze] Error:', error);
    return NextResponse.json(
      { error: 'Vaidya is momentarily in dhyana. Please try again.' },
      { status: 500 }
    );
  }
}
