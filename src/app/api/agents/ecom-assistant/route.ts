import { NextResponse } from 'next/server';
import { getSakhaBodhi } from '@/lib/agents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as {
            userId?: string;
            query?: string;
            lifeGoal?: 'Health' | 'Wealth' | 'Spiritual' | 'Work';
            userMessage?: string;
        };

        if (!body.userId || !body.query) {
            return NextResponse.json({ error: 'Missing required fields: userId, query' }, { status: 400 });
        }

        const sakha = getSakhaBodhi();
        const emotion = sakha.analyzeEmotion(body.userMessage ?? body.query);

        const result = await sakha.routeTool({
            toolName: 'ecom_assistant',
            args: {
                userId: body.userId,
                query: body.query,
            },
            ctx: {
                userId: body.userId,
                lifeGoal: body.lifeGoal ?? 'Wealth',
                tone: emotion.suggestedTone,
                stressScore: emotion.stressScore,
            },
        });

        return NextResponse.json({ ok: true, emotion, result });
    } catch (error) {
        console.error('[Ecom Assistant API] Failed to execute ecom_assistant', error);
        return NextResponse.json({ error: 'Failed to execute ecom_assistant' }, { status: 500 });
    }
}
