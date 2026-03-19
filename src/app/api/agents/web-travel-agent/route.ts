import { NextResponse } from 'next/server';
import { getSakhaBodhi } from '@/lib/agents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as {
            userId?: string;
            source?: string;
            destination?: string;
            date?: string;
            lifeGoal?: 'Health' | 'Wealth' | 'Spiritual' | 'Work';
            userMessage?: string;
        };

        if (!body.userId || !body.source || !body.destination || !body.date) {
            return NextResponse.json(
                { error: 'Missing required fields: userId, source, destination, date' },
                { status: 400 }
            );
        }

        const sakha = getSakhaBodhi();
        const emotion = sakha.analyzeEmotion(body.userMessage ?? '');

        const result = await sakha.routeTool({
            toolName: 'web_travel_agent',
            args: {
                userId: body.userId,
                source: body.source,
                destination: body.destination,
                date: body.date,
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
        console.error('[Web Travel API] Failed to execute web_travel_agent', error);
        return NextResponse.json({ error: 'Failed to execute web_travel_agent' }, { status: 500 });
    }
}
