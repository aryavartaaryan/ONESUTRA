import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// ── Streak Tier Definitions ───────────────────────────────────────────────────
function getStreakTier(days: number): string {
    if (days >= 180) return 'Ancient Grove';
    if (days >= 84) return 'Forest';
    if (days >= 21) return 'Tree';
    if (days >= 7) return 'Sapling';
    return 'Seed';
}

// ── Ayurvedic Milestone Messages ─────────────────────────────────────────────
const MILESTONE_MESSAGES: Record<number, string> = {
    7: 'In Ayurveda, a full week is your body completing one dhatu (tissue) cycle. Your cells have literally been touched by this routine. You are a Sapling now — roots beginning to form.',
    21: 'The ancient teachers said it takes 21 days to begin forming a new samskara — a groove in the mind and body. You have crossed that threshold. Your practice is becoming your nature.',
    84: 'You have lived this routine across one full Ritucharya cycle — a complete seasonal shift. This is no longer a habit. This is who you are.',
    180: 'Six months. A complete prakriti transformation cycle. The shastras say that sustained sadhana of 6 months reshapes the very fabric of your being. You are an Ancient Grove.',
};

export async function POST(request: NextRequest) {
    try {
        const {
            type,
            userName,
            pendingHabits,
            completedHabits,
            disciplineScoreToday,
            disciplineScoreYesterday,
            weeklyAvgScore,
            streakDays,
            prakriti,
            currentDoshaImbalance,
            prakritiBalanceScore,
            firstPendingHabit,
            topCompletedHabit,
        }: {
            type: 'morning' | 'midday' | 'evening' | 'milestone';
            userName: string;
            pendingHabits: number;
            completedHabits: number;
            disciplineScoreToday: number;
            disciplineScoreYesterday?: number;
            weeklyAvgScore?: number;
            streakDays: number;
            prakriti?: string;
            currentDoshaImbalance?: string;
            prakritiBalanceScore?: number;
            firstPendingHabit?: string;
            topCompletedHabit?: string;
        } = await request.json();

        const apiKey = process.env.GEMINI_API_KEY;
        const firstName = userName?.split(' ')[0] || 'Mitra';
        const tier = getStreakTier(streakDays);
        const milestoneMsg = MILESTONE_MESSAGES[streakDays] ?? null;

        if (!apiKey) {
            const fallbacks: Record<string, string> = {
                morning: `Good morning, ${firstName}. Your discipline score starts fresh today. Let's begin — start with ${firstPendingHabit ?? 'your first habit'}.`,
                midday: `${firstName}, you're at ${disciplineScoreToday}% today. Your ${pendingHabits} pending habits are still open — even completing 2 now keeps your streak alive.`,
                evening: `Today's score: ${disciplineScoreToday}% — ${tier} tier, ${streakDays} days strong. ${topCompletedHabit ? `Strong today: ${topCompletedHabit}.` : ''} Rest well tonight.`,
                milestone: milestoneMsg ?? `${streakDays} days, ${firstName}. ${tier} tier reached. Your practice is real.`,
            };
            return NextResponse.json({ message: fallbacks[type] ?? fallbacks.morning });
        }

        let prompt = '';

        if (type === 'milestone' && milestoneMsg) {
            prompt = `You are Bodhi — the OneSutra AI Buddy. The user just crossed a major streak milestone. Write ONE warm, Ayurvedic celebration message.

User: ${firstName}
Streak days: ${streakDays}
Tier reached: ${tier}
Ayurvedic milestone meaning: ${milestoneMsg}
Prakriti: ${prakriti ?? 'unknown'}
Current dosha imbalance: ${currentDoshaImbalance ?? 'balanced'}

Write 2–3 sentences. Start with the day count. Use the Ayurvedic milestone meaning. Be genuinely moved — this is a real achievement. No markdown. No lists.`;
        } else if (type === 'morning') {
            prompt = `You are Bodhi — the OneSutra AI Buddy. Write a warm, sacred morning check-in for this user.

User: ${firstName}
Discipline score today (so far): ${disciplineScoreToday}%
Yesterday's score: ${disciplineScoreYesterday ?? 'unknown'}%
Weekly average: ${weeklyAvgScore ?? 'unknown'}%
Pending habits today: ${pendingHabits}
First pending habit to start with: ${firstPendingHabit ?? 'their first morning habit'}
Streak: ${streakDays} days (${tier} tier)
Prakriti: ${prakriti ?? 'unknown'}
Current dosha imbalance: ${currentDoshaImbalance ?? 'unknown'}

Write 2–3 sentences. Reference yesterday's score briefly if good ('building on yesterday's X%') or encouragingly if low. Name the first habit to start with and WHY it matters specifically for their prakriti/imbalance. End with a sense of sacred possibility — morning energy, not just task management. No markdown. No lists.`;
        } else if (type === 'midday') {
            prompt = `You are Bodhi — the OneSutra AI Buddy. The user's morning discipline score is lower than ideal. Write a gentle, non-judgmental midday catch-up nudge.

User: ${firstName}
Current discipline score: ${disciplineScoreToday}%
Pending habits remaining: ${pendingHabits}
Completed so far: ${completedHabits}
Streak: ${streakDays} days (${tier} tier)
Prakriti: ${prakriti ?? 'unknown'}
Current dosha imbalance: ${currentDoshaImbalance ?? 'unknown'}

It is Pitta time (10 AM–2 PM) — peak Agni and mental focus window.
Write 2–3 sentences. Be encouraging, NOT guilt-inducing. Show them the projected score if they complete 2 habits now. Reference that Pitta time is actually ideal for getting things done. Keep the streak alive angle without pressure. No markdown. No lists.`;
        } else {
            // evening
            prompt = `You are Bodhi — the OneSutra AI Buddy. Write a warm evening summary for the user.

User: ${firstName}
Today's discipline score: ${disciplineScoreToday}%
Streak: ${streakDays} days (${tier} tier)
Top habit completed today: ${topCompletedHabit ?? 'multiple practices'}
Prakriti: ${prakriti ?? 'unknown'}
Current dosha imbalance: ${currentDoshaImbalance ?? 'unknown'}
Prakriti balance score: ${prakritiBalanceScore ?? 'unknown'}/100

It is evening — Kapha time (6–10 PM). The body is winding down.
Write 2–4 sentences. Announce the discipline score and streak warmly. Celebrate the top habit specifically. Give ONE personalised tip for tomorrow based on their prakriti/imbalance. End with a sense of rest being earned. No markdown. No lists.`;
        }

        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{ parts: [{ text: prompt }] }],
            config: { temperature: 0.8, maxOutputTokens: 140 },
        });

        let message = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
        message = message.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}\s/g, '').replace(/\n+/g, ' ').trim();

        if (!message || message.length < 10) {
            const fallbacks: Record<string, string> = {
                morning: `Good morning, ${firstName}. Start with ${firstPendingHabit ?? 'your first habit'} — ${pendingHabits} practices await you today.`,
                midday: `${firstName}, you're at ${disciplineScoreToday}% — there's still time to complete 1–2 habits and protect your ${streakDays}-day ${tier} streak.`,
                evening: `Today: ${disciplineScoreToday}% — ${streakDays} days, ${tier} tier. ${topCompletedHabit ? topCompletedHabit + ' was your anchor today.' : ''} Rest well.`,
                milestone: `${streakDays} days, ${firstName}. ${tier} tier. ${milestoneMsg ?? 'Your practice is real.'}`,
            };
            message = fallbacks[type] ?? fallbacks.morning;
        }

        return NextResponse.json({ message });
    } catch (err) {
        console.error('[RhythmCheck]', err);
        return NextResponse.json({ message: 'Your practice is alive — every day you show up, your ojas grows.' });
    }
}
