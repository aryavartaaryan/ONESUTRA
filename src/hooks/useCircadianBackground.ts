'use client';

import { useState, useEffect } from 'react';

// ─── Vibe Phases ──────────────────────────────────────────────────────────────
export type VibeName = 'dawn' | 'day' | 'dusk' | 'night';

export interface VibePhase {
    name: VibeName;
    label: string;
    tagline: string;
    query: string;
    tint: string;          // overlay rgba value
    accentHex: string;     // for text/glow accents
    fallbackUrl: string;   // offline fallback
}

const PHASES: Record<VibeName, VibePhase> = {
    dawn: {
        name: 'dawn',
        label: 'Dawn',
        tagline: 'Brahma Muhurta · A new beginning rises',
        query: 'sunrise morning mist calm lake dawn',
        tint: 'rgba(10, 5, 25, 0.45)',
        accentHex: '#FFB86C',
        fallbackUrl:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1080&q=85&auto=format&fit=crop',
    },
    day: {
        name: 'day',
        label: 'Day',
        tagline: 'Madhyana · Active, Vibrant, Focused',
        query: 'majestic mountains green forest clear sky zen nature',
        tint: 'rgba(5, 15, 35, 0.38)',
        accentHex: '#64D8CB',
        fallbackUrl:
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080&q=85&auto=format&fit=crop',
    },
    dusk: {
        name: 'dusk',
        label: 'Dusk',
        tagline: 'Sandhya · Gratitude & reflection',
        query: 'sunset golden hour warm landscape twilight',
        tint: 'rgba(15, 5, 30, 0.50)',
        accentHex: '#FFD580',
        fallbackUrl:
            'https://images.unsplash.com/photo-1495344517868-8ebaf0a2044a?w=1080&q=85&auto=format&fit=crop',
    },
    night: {
        name: 'night',
        label: 'Night',
        tagline: 'Ratri · Infinite peace · Cosmic connection',
        query: 'night sky milky way dark forest moonlight stars',
        tint: 'rgba(0, 2, 12, 0.62)',
        accentHex: '#9B8CFF',
        fallbackUrl:
            'https://images.unsplash.com/photo-1532978379173-523e16f371f6?w=1080&q=85&auto=format&fit=crop',
    },
};

// ─── Alternative queries for the 'vedic' variant (home page) ─────────────────
const PHASES_VEDIC: Record<VibeName, { query: string; fallbackUrl: string }> = {
    dawn: {
        query: 'himalaya sunrise sacred temple morning golden spiritual',
        fallbackUrl: 'https://images.unsplash.com/photo-1565019011521-b0575b7d1e60?w=1080&q=85&auto=format&fit=crop',
    },
    day: {
        query: 'ancient temple india sun forest sacred vibrant',
        fallbackUrl: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1080&q=85&auto=format&fit=crop',
    },
    dusk: {
        query: 'ganga river ghats dusk golden india spiritual sunset',
        fallbackUrl: 'https://images.unsplash.com/photo-1537944434965-cf4679d1a598?w=1080&q=85&auto=format&fit=crop',
    },
    night: {
        query: 'india himalaya night stars milky way traditional lamp',
        fallbackUrl: 'https://images.unsplash.com/photo-1502209524164-acea936639a2?w=1080&q=85&auto=format&fit=crop',
    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getVibePhase(hourF: number): VibePhase {
    if (hourF >= 5 && hourF < 7) return PHASES.dawn;
    if (hourF >= 7 && hourF < 17) return PHASES.day;
    if (hourF >= 17 && hourF < 19) return PHASES.dusk;
    return PHASES.night;
}

const CACHE_KEY_PREFIX = 'circadian_bg_v2_';
const CACHE_TTL_MS = 90 * 60 * 1000; // 90 minutes

function getCached(key: string): string | null {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const { url, ts }: { url: string; ts: number } = JSON.parse(raw);
        if (Date.now() - ts < CACHE_TTL_MS) return url;
        localStorage.removeItem(key);
    } catch { /* ignore */ }
    return null;
}

function setCache(key: string, url: string) {
    try {
        localStorage.setItem(key, JSON.stringify({ url, ts: Date.now() }));
    } catch { /* ignore */ }
}

// ─── Main Hook ────────────────────────────────────────────────────────────────
export interface CircadianBackground {
    phase: VibePhase;
    imageUrl: string;
    loaded: boolean;
}

// Public Unsplash access key (read-only — safe to embed in client bundles)
const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY ?? '';

/**
 * variant = 'nature' (default) — lush nature/ocean for JustVibe
 * variant = 'vedic'  — sacred temples/Himalaya/Ganga for home page Mission card
 */
export function useCircadianBackground(variant: 'nature' | 'vedic' = 'nature'): CircadianBackground {
    const hour = new Date().getHours() + new Date().getMinutes() / 60;
    const phase = getVibePhase(hour);
    const vData = variant === 'vedic' ? PHASES_VEDIC[phase.name] : null;
    const cacheKey = `${CACHE_KEY_PREFIX}${variant}_${phase.name}`;
    const queryStr = vData?.query ?? phase.query;
    const fallback = vData?.fallbackUrl ?? phase.fallbackUrl;

    const [imageUrl, setImageUrl] = useState<string>(fallback);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function fetchImage() {
            // 1. Try cache first
            const cached = getCached(cacheKey);
            if (cached) {
                if (!cancelled) { setImageUrl(cached); setLoaded(true); }
                return;
            }

            // 2. Try Unsplash API
            if (UNSPLASH_ACCESS_KEY) {
                try {
                    const url = new URL('https://api.unsplash.com/photos/random');
                    url.searchParams.set('query', queryStr);
                    url.searchParams.set('orientation', 'portrait');
                    url.searchParams.set('content_filter', 'high');
                    url.searchParams.set('client_id', UNSPLASH_ACCESS_KEY);

                    const res = await fetch(url.toString());
                    if (res.ok) {
                        const data = await res.json();
                        const photoUrl: string =
                            data?.urls?.regular ?? data?.urls?.full ?? '';
                        if (photoUrl && !cancelled) {
                            setCache(cacheKey, photoUrl);
                            setImageUrl(photoUrl);
                            setLoaded(true);
                            return;
                        }
                    }
                } catch { /* fall through to hardcoded fallback */ }
            }

            // 3. Hardcoded fallback
            if (!cancelled) {
                setImageUrl(fallback);
                setLoaded(true);
            }
        }

        setLoaded(false);
        fetchImage();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase.name, variant]);

    return { phase, imageUrl, loaded };
}
