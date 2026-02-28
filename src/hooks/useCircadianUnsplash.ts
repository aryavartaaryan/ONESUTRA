'use client';

import { useState, useEffect } from 'react';

/**
 * Returns the appropriate Unsplash search query based on the current hour.
 * These queries are carefully chosen to match the Sattvic, calming aesthetic.
 */
function getCircadianQuery(hour: number): string {
    if (hour >= 5 && hour < 11) return 'sunrise,mist,mountains,calm,golden';
    if (hour >= 11 && hour < 16) return 'forest,sunlight,zen,clear,nature';
    if (hour >= 16 && hour < 19) return 'sunset,golden hour,peaceful,dusk';
    return 'night sky,stars,moonlight,dark nature,calm';
}

/**
 * Fetches a random vertical nature photo from Unsplash that matches the
 * current time of day. Results are cached in sessionStorage by 30-min slot
 * so we don't burn API quota on every render.
 *
 * Falls back to the curated hard-coded images if the API call fails.
 */
const FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-5QgIjaBsZ2c?w=1080&h=1920&fit=crop&q=80',
    'https://images.unsplash.com/photo-eOpewngf68w?w=1080&h=1920&fit=crop&q=80',
    'https://images.unsplash.com/photo-v7daTKlZzaw?w=1080&h=1920&fit=crop&q=80',
    'https://images.unsplash.com/photo-z1d-RpsBQTI?w=1080&h=1920&fit=crop&q=80',
];

export function useCircadianUnsplash() {
    const [imageUrl, setImageUrl] = useState<string>('');
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const fetchImage = async () => {
            const now = new Date();
            const hour = now.getHours();
            const slotKey = `circadian_img_${Math.floor(Date.now() / (30 * 60 * 1000))}`;

            // 1. Check session cache first
            try {
                const cached = sessionStorage.getItem(slotKey);
                if (cached) {
                    setImageUrl(cached);
                    return;
                }
            } catch { /* ignore incognito storage errors */ }

            // 2. Try Unsplash API
            const query = getCircadianQuery(hour);
            const apiKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

            if (apiKey) {
                try {
                    const res = await fetch(
                        `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=portrait&content_filter=high`,
                        { headers: { Authorization: `Client-ID ${apiKey}` } }
                    );
                    if (res.ok) {
                        const data = await res.json();
                        // Use high-quality portrait URL, 1080×1920
                        const url: string = data?.urls?.full
                            ? `${data.urls.full}&w=1080&h=1920&fit=crop&q=85`
                            : data?.urls?.regular ?? '';

                        if (url) {
                            setImageUrl(url);
                            try { sessionStorage.setItem(slotKey, url); } catch { /* ignore */ }
                            return;
                        }
                    }
                } catch { /* fall through to fallback */ }
            }

            // 3. Fallback to curated images
            const seed = Math.floor(Date.now() / (30 * 60 * 1000));
            setImageUrl(FALLBACK_IMAGES[seed % FALLBACK_IMAGES.length]);
        };

        fetchImage();

        // Re-fetch every 30 minutes
        const interval = setInterval(fetchImage, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Mark loaded when the image actually renders
    useEffect(() => {
        if (!imageUrl) return;
        setLoaded(false);
        const img = new Image();
        img.onload = () => setLoaded(true);
        img.onerror = () => setLoaded(true); // show what we have even on error
        img.src = imageUrl;
    }, [imageUrl]);

    return { imageUrl, loaded, query: typeof window !== 'undefined' ? getCircadianQuery(new Date().getHours()) : '' };
}
