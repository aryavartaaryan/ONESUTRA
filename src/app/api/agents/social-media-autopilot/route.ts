import { NextResponse } from 'next/server';
import { getSakhaBodhi } from '@/lib/agents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as {
            userId?: string;
            projectUpdate?: string;
            platform?: 'linkedin' | 'twitter' | 'both';
            userMessage?: string;
            lifeGoal?: 'Health' | 'Wealth' | 'Spiritual' | 'Work';
        };

        if (!body.userId || !body.projectUpdate) {
            return NextResponse.json(
                { error: 'Missing required fields: userId, projectUpdate' },
                { status: 400 }
            );
        }

        const sakha = getSakhaBodhi();
        const emotion = sakha.analyzeEmotion(body.userMessage ?? body.projectUpdate);

        const result = await sakha.routeTool({
            toolName: 'social_media_autopilot',
            args: {
                userId: body.userId,
                projectUpdate: body.projectUpdate,
                platform: body.platform,
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
        console.error('[Social Media API] Failed to execute social_media_autopilot', error);
        return NextResponse.json({ error: 'Failed to execute social_media_autopilot' }, { status: 500 });
    }
}
