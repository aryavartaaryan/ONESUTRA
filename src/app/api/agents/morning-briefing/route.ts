import { NextResponse } from 'next/server';
import { getSakhaBodhi } from '@/lib/agents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as {
            userId?: string;
            maxEmails?: number;
            lifeGoal?: 'Health' | 'Wealth' | 'Spiritual' | 'Work';
            userMessage?: string;
        };

        if (!body.userId) {
            return NextResponse.json({ error: 'Missing required field: userId' }, { status: 400 });
        }

        const sakha = getSakhaBodhi();
        const emotion = sakha.analyzeEmotion(body.userMessage ?? '');

        const result = await sakha.routeTool({
            toolName: 'morning_briefing',
            args: {
                userId: body.userId,
                maxEmails: body.maxEmails,
            },
            ctx: {
                userId: body.userId,
                lifeGoal: body.lifeGoal ?? 'Work',
                tone: emotion.suggestedTone,
                stressScore: emotion.stressScore,
            },
        });

        return NextResponse.json({ ok: true, emotion, result });
    } catch (error) {
        console.error('[Morning Briefing API] Failed to execute morning_briefing', error);
        return NextResponse.json({ error: 'Failed to execute morning_briefing' }, { status: 500 });
    }
}
