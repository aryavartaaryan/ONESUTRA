import type {
    SocialMediaAutopilotRequest,
    SocialMediaAutopilotResult,
    ToolExecutionContext,
} from '@/lib/agents/types';

function buildLinkedInPost(update: string): string {
    return [
        'Today at OneSUTRA, we shipped a meaningful step forward.',
        update,
        'Our north star remains simple: build technology that improves inner clarity and outer execution.',
        'Grateful to the team for holding both speed and soul in the same sprint.',
        '#OneSUTRA #SpiritualTech #BuildInPublic #AIProduct'
    ].join('\n\n');
}

function buildTwitterPost(update: string): string {
    const core = `OneSUTRA update: ${update}`;
    const tail = ' Building spiritual-tech that feels human, focused, and useful. #OneSUTRA #AI';
    const joined = `${core}${tail}`;
    return joined.length > 280 ? `${joined.slice(0, 276)}...` : joined;
}

export async function socialMediaAutopilotTool(
    args: SocialMediaAutopilotRequest,
    _ctx: ToolExecutionContext
): Promise<SocialMediaAutopilotResult> {
    const platform = args.platform ?? 'both';
    const result: SocialMediaAutopilotResult = {
        visualDirection:
            'Use saffron-amber gradients, sacred geometry overlays, and clean monospaced accent labels for a spiritual-tech aesthetic.',
    };

    if (platform === 'linkedin' || platform === 'both') {
        result.linkedinPost = buildLinkedInPost(args.projectUpdate);
    }

    if (platform === 'twitter' || platform === 'both') {
        result.twitterPost = buildTwitterPost(args.projectUpdate);
    }

    return result;
}
