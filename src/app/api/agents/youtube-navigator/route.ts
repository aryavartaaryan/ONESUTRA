import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface YtSearchVideo {
    videoId?: string;
    title?: string;
}

function buildEmbedUrl(videoId: string): string {
    return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1`;
}

export async function POST(req: Request) {
    const fallbackMessage = 'Failed to search YouTube. Ask the user to try a different keyword.';

    try {
        const body = (await req.json()) as { query?: string };
        const query = (body.query ?? '').trim();

        if (!query) {
            return NextResponse.json({ error: 'Missing required field: query' }, { status: 400 });
        }

        const ytSearchModule = await import('yt-search');
        const ytSearch = (ytSearchModule.default ?? ytSearchModule) as (q: string) => Promise<{ videos?: YtSearchVideo[] }>;
        const search = await ytSearch(query);
        const topVideo = (search.videos ?? []).find((video) => typeof video.videoId === 'string' && video.videoId.length > 0);

        if (topVideo?.videoId) {
            return NextResponse.json({
                ok: true,
                result: {
                    action: 'OPEN_WEBVIEW',
                    url: buildEmbedUrl(topVideo.videoId),
                    title: `${topVideo.title ?? query} · YouTube`,
                    notes: 'Top relevant video found and ready in embedded player.',
                },
            });
        }

        return NextResponse.json({
            ok: false,
            message: fallbackMessage,
            result: null,
        });
    } catch (error) {
        console.error('[YouTube Navigator API] Failed to resolve video:', error);
        return NextResponse.json({
            ok: false,
            message: fallbackMessage,
            result: null,
        });
    }
}
