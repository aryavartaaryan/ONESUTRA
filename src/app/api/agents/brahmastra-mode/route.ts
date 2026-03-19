import { NextResponse } from 'next/server';
import { getSakhaBodhi } from '@/lib/agents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as {
            userId?: string;
            reason?: string;
            minutes?: number;
            dryRun?: boolean;
            lifeGoal?: 'Health' | 'Wealth' | 'Spiritual' | 'Work';
            userMessage?: string;
        };

        if (!body.userId) {
            return NextResponse.json({ error: 'Missing required field: userId' }, { status: 400 });
        }

        const sakha = getSakhaBodhi();
        const emotion = sakha.analyzeEmotion(body.userMessage ?? body.reason ?? '');

        const result = await sakha.routeTool({
            toolName: 'brahmastra_mode',
            args: {
                userId: body.userId,
                reason: body.reason,
                minutes: body.minutes,
                dryRun: body.dryRun,
            },
            ctx: {
                userId: body.userId,
                lifeGoal: body.lifeGoal ?? 'Work',
                tone: emotion.suggestedTone,
                stressScore: emotion.stressScore,
            },
        });

        return NextResponse.json({
            ok: true,
            emotion,
            result,
        });
    } catch (error) {
        console.error('[Brahmastra API] Failed to execute brahmastra_mode', error);
        return NextResponse.json({ error: 'Failed to execute brahmastra_mode' }, { status: 500 });
    }
}
