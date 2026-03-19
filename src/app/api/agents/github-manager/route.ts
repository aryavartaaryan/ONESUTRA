import { NextResponse } from 'next/server';
import { getSakhaBodhi } from '@/lib/agents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as {
            userId?: string;
            owner?: string;
            repo?: string;
            maxPulls?: number;
            userMessage?: string;
            lifeGoal?: 'Health' | 'Wealth' | 'Spiritual' | 'Work';
        };

        if (!body.userId || !body.owner || !body.repo) {
            return NextResponse.json(
                { error: 'Missing required fields: userId, owner, repo' },
                { status: 400 }
            );
        }

        const sakha = getSakhaBodhi();
        const emotion = sakha.analyzeEmotion(body.userMessage ?? '');

        const result = await sakha.routeTool({
            toolName: 'github_manager',
            args: {
                userId: body.userId,
                owner: body.owner,
                repo: body.repo,
                maxPulls: body.maxPulls,
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
        console.error('[GitHub Manager API] Failed to execute github_manager', error);
        return NextResponse.json({ error: 'Failed to execute github_manager' }, { status: 500 });
    }
}
