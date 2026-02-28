'use client';

/**
 * useReelsFeed — Unified data pipeline for the PranaVerse Vibes feed.
 *
 * Returns a typed, flat array of ReelItems where:
 *   - Index 0 is always the 'sankalpa' interactive checklist reel
 *   - Indices 1–N are the mantra audio reels
 *
 * Future: video and flash reel types can be inserted by extending REEL_TRACKS.
 */

export type ReelItem =
    | { id: string; type: 'sankalpa' }
    | {
        id: string;
        type: 'mantra';
        src: string;
        dualSrc?: string;
        title: string;
        likes: number;
        /** If true, audio continues playing when the user scrolls past this reel */
        persistAudio?: boolean;
    };

const MANTRA_TRACKS: Omit<ReelItem & { type: 'mantra' }, 'type'>[] = [
    {
        id: 'fusion', title: 'SuperFusion', likes: 1008,
        src: 'https://ik.imagekit.io/rcsesr4xf/flute.mp3?updatedAt=1771983487495',
        dualSrc: 'https://ik.imagekit.io/rcsesr4xf/sitar.mp3?updatedAt=1771983562343',
        persistAudio: false,
    },
    {
        id: 'gayatri', title: 'Gayatri Ghanpaath', likes: 248,
        src: 'https://ik.imagekit.io/rcsesr4xf/gayatri-mantra-ghanpaath.mp3',
        persistAudio: false,
    },
    {
        id: 'lalitha', title: 'Lalitha Sahasranamam', likes: 312,
        src: 'https://ik.imagekit.io/rcsesr4xf/Lalitha-Sahasranamam.mp3',
        persistAudio: false,
    },
    {
        id: 'shiva', title: 'Shiva Tandava Stotram', likes: 521,
        src: 'https://ik.imagekit.io/rcsesr4xf/Shiva-Tandav.mp3',
        persistAudio: true,  // Shiva Tandava continues as ambient background
    },
    {
        id: 'brahma', title: 'Brahma Yagya', likes: 189,
        src: 'https://ik.imagekit.io/aup4wh6lq/BrahmaYagya.mp3',
        persistAudio: false,
    },
    {
        id: 'shanti', title: 'Shanti Path', likes: 403,
        src: 'https://ik.imagekit.io/rcsesr4xf/shanti-path.mp3',
        persistAudio: true,  // Shanti Path continues as ambient background
    },
    {
        id: 'dainik', title: 'Dainik Agnihotra', likes: 167,
        src: 'https://ik.imagekit.io/aup4wh6lq/DainikAgnihotra.mp3?updatedAt=1771246817070',
        persistAudio: false,
    },
];

/** Build the full ordered feed: sankalpa first, then mantras */
export function buildReelsFeed(): ReelItem[] {
    const sankalpa: ReelItem = { id: 'sankalpa-0', type: 'sankalpa' };

    const mantras: ReelItem[] = MANTRA_TRACKS.map(t => ({
        ...t,
        type: 'mantra' as const,
    }));

    return [sankalpa, ...mantras];
}

/** Convenience hook (returns a memoized constant — no API calls) */
export function useReelsFeed(): ReelItem[] {
    // Static — no need for useState/useEffect since the feed doesn't change at runtime
    return buildReelsFeed();
}
