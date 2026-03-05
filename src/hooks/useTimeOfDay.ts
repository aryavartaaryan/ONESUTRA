'use client';

import { useState, useEffect } from 'react';

export type TimeOfDay = 'morning' | 'noon' | 'evening' | 'night';

export interface TimeOfDayInfo {
    period: TimeOfDay;
    hour: number;
    /** Greeting label for this period */
    label: string;
    /** Sanskrit name */
    sanskrit: string;
    /** Emoji representation */
    emoji: string;
    /** Raag title for productivity */
    raagTitle: string;
    /** Unsplash query for this period */
    query: string;
    /** Primary accent colour (hex) */
    accent: string;
}

// Phase map — exact same boundaries as useCircadianBackground:
//   3–7   morning  (Brahma Muhurta, Prabhata)
//   7–12  morning  (active morning)
//   12–16 noon     (Madhyahna)
//   16–21 evening  (Sandhya — closes the old 16:00-16:59 'night' gap)
//   21–3  night    (Ratri)
function classify(h: number): TimeOfDayInfo {
    if (h >= 3 && h < 7) return {
        period: 'morning', hour: h,
        label: 'Good Morning', sanskrit: 'शुभोदय',
        emoji: '🌅', raagTitle: 'Brahma Muhurta · Awaken Your Prana',
        query: 'sunrise misty mountains dewy forest golden',
        accent: '#fbbf24',
    };
    if (h >= 7 && h < 12) return {
        period: 'morning', hour: h,
        label: 'Good Morning', sanskrit: 'शुभ प्रभात',
        emoji: '🌄', raagTitle: 'Morning Raag · Sustain Your Flow',
        query: 'morning sunlight green hills forest calm',
        accent: '#fbbf24',
    };
    if (h >= 12 && h < 16) return {
        period: 'noon', hour: h,
        label: 'Shubh Madhyahna', sanskrit: 'शुभ मध्याह्न',
        emoji: '☀️', raagTitle: 'Noon Raag · Stay Focused',
        query: 'bright sky clear lake sunlit valley vibrant',
        accent: '#60a5fa',
    };
    if (h >= 16 && h < 21) return {
        period: 'evening', hour: h,
        label: 'Good Evening', sanskrit: 'शुभ सन्ध्या',
        emoji: '🪔', raagTitle: 'Sandhya Raag · Ease Into Stillness',
        query: 'golden hour sunset ocean rolling hills warm',
        accent: '#fb923c',
    };
    return {
        period: 'night', hour: h,
        label: 'Shubh Ratri', sanskrit: 'शुभ रात्रि',
        emoji: '🌙', raagTitle: 'Night Raag · Deep Rest · Sacred Dark',
        query: 'starry sky moonlight quiet landscape night',
        accent: '#818cf8',
    };
}

export function useTimeOfDay(): TimeOfDayInfo {
    const [info, setInfo] = useState<TimeOfDayInfo>(() => classify(new Date().getHours()));

    useEffect(() => {
        const update = () => setInfo(classify(new Date().getHours()));
        update();

        // Recalculate at the next 30-min boundary, then every 30 min
        const now = new Date();
        const msToNextSlot = (30 - (now.getMinutes() % 30)) * 60_000 - now.getSeconds() * 1000;
        let interval: ReturnType<typeof setInterval>;
        const timeout = setTimeout(() => {
            update();
            interval = setInterval(update, 30 * 60_000);
        }, msToNextSlot);

        return () => { clearTimeout(timeout); clearInterval(interval); };
    }, []);

    return info;
}
