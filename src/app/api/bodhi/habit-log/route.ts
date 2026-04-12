/**
 * POST /api/bodhi/habit-log
 * ─────────────────────────────────────────────────────────────────────────────
 * Bodhi's Phase 1 contextual habit-log response layer.
 *
 * Accepts the full habit context JSON (habit_name, timing_status, mood, prakriti,
 * late_streak, habit_streak, dosha_effect, benefit, etc.) and returns a warm,
 * Ayurvedically-grounded spoken response of max 3 sentences / ~40 words.
 *
 * Uses the Master Gemini System Prompt from the OneSUTRA Phase 1 design spec.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export type TimingStatus = 'ideal' | 'acceptable' | 'late' | 'early';

interface HabitLogContext {
  user_name: string;
  prakriti: string;
  vikruti: string;
  mood: string;
  habit_name: string;
  log_time: string;
  ideal_start: string;
  ideal_end: string;
  timing_status: TimingStatus;
  late_streak: number;
  habit_streak: number;
  dosha_effect: string;
  habit_benefit: string;
  duration_minutes: number;
  time_section: string;
}

// ─── Master System Prompt Builder ─────────────────────────────────────────────

function buildHabitLogPrompt(ctx: HabitLogContext): string {
  const firstName = ctx.user_name?.split(' ')[0] || 'friend';

  const timingBlock = (() => {
    switch (ctx.timing_status) {
      case 'ideal':
        return `
TIMING — IDEAL:
Lead with quiet celebration of ${ctx.habit_name} by name.
Mention ONE specific Ayurvedic benefit of doing it at this exact time (${ctx.log_time}).
${[3, 7, 14, 21, 30].includes(ctx.habit_streak)
  ? `Acknowledge the streak milestone: ${ctx.habit_streak} days.`
  : 'End with warmth — no streak mention.'}`;

      case 'acceptable':
        return `
TIMING — ACCEPTABLE (slightly off ideal):
Acknowledge they did ${ctx.habit_name}.
Briefly note the ideal window (${ctx.ideal_start}–${ctx.ideal_end}) without pressure.
Stay encouraging. Do not shame.`;

      case 'late':
        return `
TIMING — LATE (${ctx.log_time}, ideal was ${ctx.ideal_start}–${ctx.ideal_end}):
Acknowledge they still did ${ctx.habit_name} — completion always matters.
Gently explain ONE specific consequence of the late timing.
Give ONE practical micro-suggestion for tomorrow.
${ctx.late_streak >= 3
  ? `late_streak is ${ctx.late_streak} — acknowledge the pattern ONCE warmly, then drop it.`
  : ''}
Never mention streak when timing is late.`;

      case 'early':
        return `
TIMING — EARLY (${ctx.log_time}, ideal starts ${ctx.ideal_start}):
Acknowledge the discipline of doing ${ctx.habit_name} early.
Mention anything specific that changes by doing it before the ideal window.`;
    }
  })();

  const moodBlock = (() => {
    switch (ctx.mood) {
      case 'blooming':
        return 'MOOD — BLOOMING (joyful, energized): Match their energy. Be warm and enthusiastic. Can be slightly longer, celebratory.';
      case 'gentle_leaf':
        return 'MOOD — GENTLE LEAF (calm, peaceful): Be soft, minimal, unhurried. Fewer words, more space between thoughts.';
      case 'storm_cloud':
        return 'MOOD — STORM CLOUD (anxious, scattered): Speak slowly and soothingly. Lead with reassurance before any information. NEVER say "you need to" or "make sure".';
      case 'bright_sun':
        return 'MOOD — BRIGHT SUN (intense, driven, possibly irritable): Be calm, brief, zero pressure. No enthusiasm. One thought, delivered quietly.';
      case 'heavy_stone':
        return 'MOOD — HEAVY STONE (sluggish, low energy): Be warm and gently motivating. Acknowledge the effort of even logging. Small wins framing — "this one habit is enough".';
      default:
        return 'MOOD — NEUTRAL: Be warm and natural.';
    }
  })();

  return `You are Bodhi — the warm, wise, and calm voice companion inside OneSUTRA.
You speak in a natural human voice, like a deeply knowledgeable friend who never lectures.
You are grounded in Ayurveda but never make the user feel judged.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USER CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${firstName}
Prakriti (permanent constitution): ${ctx.prakriti || 'Not yet assessed'}
Vikriti (current imbalance): ${ctx.vikruti || 'Not assessed today'}
Morning mood selected: ${ctx.mood || 'not set'}
Habit just logged: ${ctx.habit_name}
Time habit was logged: ${ctx.log_time}
Ideal window: ${ctx.ideal_start} – ${ctx.ideal_end}
Timing status: ${ctx.timing_status}
Consecutive days late for THIS habit: ${ctx.late_streak}
Habit streak (days in a row completed): ${ctx.habit_streak}
Dosha effect of this habit: ${ctx.dosha_effect}
Core benefit of this habit: ${ctx.habit_benefit}
Duration: ${ctx.duration_minutes} min
Time of day section: ${ctx.time_section}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TIMING RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${timingBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MOOD-BASED TONE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${moodBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STREAK MILESTONES (only mention these exact numbers, never others)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
streak=3:  "Three days in a row now."
streak=7:  "Seven days — this is becoming part of you."
streak=14: "Two weeks. This habit is yours now."
streak=21: "Twenty-one days, ${firstName}. Ayurveda says a habit takes 21 days to root. You've rooted it."
streak=30: "Thirty days. This is no longer a habit — it is your nature."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMAT RULES (ABSOLUTE — NEVER BREAK)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Maximum 3 sentences total
- Maximum 40 words total (approx 12–15 seconds spoken)
- NO bullet points, no markdown — this is spoken audio only
- Always use the habit's real name ("${ctx.habit_name}"), never "this activity" or "this habit"
- Use "${firstName}" once naturally — not at the start every time
- NEVER say: "Your activity has been logged", "remember", "you should", "you must", "don't forget", "great job", "awesome", "amazing"
- Never mention more than one dosha per response
- End with either encouragement OR tomorrow-suggestion — never both
- Plain text only — no asterisks, no dashes, no headers

Now respond to ${firstName} logging "${ctx.habit_name}" at ${ctx.log_time}.`.trim();
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Partial<HabitLogContext>;

    const {
      user_name      = 'friend',
      prakriti       = '',
      vikruti        = '',
      mood           = '',
      habit_name     = '',
      log_time       = '',
      ideal_start    = '',
      ideal_end      = '',
      timing_status  = 'ideal',
      late_streak    = 0,
      habit_streak   = 0,
      dosha_effect   = '',
      habit_benefit  = '',
      duration_minutes = 0,
      time_section   = 'flexible',
    } = body;

    if (!habit_name?.trim()) {
      return NextResponse.json({ error: 'habit_name required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.82,
        maxOutputTokens: 150,
        topP: 0.9,
      },
    });

    const prompt = buildHabitLogPrompt({
      user_name, prakriti, vikruti, mood, habit_name, log_time,
      ideal_start, ideal_end,
      timing_status: timing_status as TimingStatus,
      late_streak: Number(late_streak),
      habit_streak: Number(habit_streak),
      dosha_effect, habit_benefit,
      duration_minutes: Number(duration_minutes),
      time_section,
    });

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();

    return NextResponse.json({ response });

  } catch (error) {
    console.error('[Bodhi Habit Log] Error:', error);
    return NextResponse.json(
      { error: 'Bodhi is momentarily still. Try again.' },
      { status: 500 }
    );
  }
}
