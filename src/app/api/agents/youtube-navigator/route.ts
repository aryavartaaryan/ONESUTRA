import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function extractFirstVideoId(xml: string): string | null {
    const idMatch = xml.match(/<yt:videoId>([a-zA-Z0-9_-]{11})<\/yt:videoId>/i);
    if (idMatch?.[1]) return idMatch[1];

    const linkMatch = xml.match(/<link>https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})<\/link>/i);
    if (linkMatch?.[1]) return linkMatch[1];

    return null;
}

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as { query?: string };
        const query = (body.query ?? '').trim();

        if (!query) {
            return NextResponse.json({ error: 'Missing required field: query' }, { status: 400 });
        }

        const feedUrl = `https://www.youtube.com/feeds/videos.xml?search_query=${encodeURIComponent(query)}`;
        const feedRes = await fetch(feedUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/atom+xml,text/xml;q=0.9,*/*;q=0.8' },
            cache: 'no-store',
        });

        let videoId: string | null = null;
        if (feedRes.ok) {
            const xml = await feedRes.text();
            videoId = extractFirstVideoId(xml);
        }

        if (videoId) {
            const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
            return NextResponse.json({
                ok: true,
                result: {
                    action: 'OPEN_WEBVIEW',
                    url: embedUrl,
                    title: `${query} · YouTube`,
                    notes: 'Top relevant video found and ready in embedded player.',
                },
            });
        }

        const searchEmbedUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}`;
        return NextResponse.json({
            ok: true,
            result: {
                action: 'OPEN_WEBVIEW',
                url: searchEmbedUrl,
                title: `${query} · YouTube`,
                notes: 'Exact video could not be resolved from feed; opening embeddable search player.',
            },
        });
    } catch (error) {
        console.error('[YouTube Navigator API] Failed to resolve video:', error);
        return NextResponse.json({ error: 'Failed to execute youtube_navigator' }, { status: 500 });
    }
}
