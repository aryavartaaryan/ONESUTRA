'use client';

import React, {
    useState,
    useRef,
    useEffect,
    useMemo,
    useCallback,
} from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import HomeStoryBar from '@/components/PranaVerse/HomeStoryBar';
import { Tab } from '@/components/Resonance/ResonanceTypes';
import DharmaMap from '@/components/Resonance/DharmaMap';
import ResonanceNavBar from '@/components/Resonance/ResonanceNavBar';
import { useOneSutraAuth } from '@/hooks/useOneSutraAuth';
import SakhaBodhiOrb from '@/components/Dashboard/SakhaBodhiOrb';

// ════════════════════════════════════════════════════════
//  SACRED PORTAL DATA  (from Home / SacredPortalGrid)
// ════════════════════════════════════════════════════════
const SACRED_PORTALS = [
    { id: 'ai-acharya', title: 'AyurHealth', subtitle: 'AyurHealth', icon: '🌿', color: '#10b981', href: '/acharya-samvad', importance: 'AI Ayurvedacharya Pranav — Personalized Vedic healing, Prakruti analysis & Ayurvedic remedies available 24/7. The future of conscious healthcare.' },
    { id: 'gurukul', title: 'Gurukul', subtitle: 'World-Class Wisdom', icon: '🪔', color: '#f59e0b', href: '/vedic-sangrah', importance: "World's Premier Gurukul — AI, Mathematics & Modern Sciences blended with Bhagavat Gita, Upanishads, Sanskrit & Vedic wisdom. Plus Startup Support." },
    { id: 'dhyan', title: 'Meditate', subtitle: 'Energy Mantras & Stotras', icon: '🧘', color: '#3b82f6', href: '/dhyan-kshetra', importance: 'Curated Energy Mantras & Stotras — find inner stillness with healing frequencies. Guided meditations for body, mind and soul transformation.' },
    { id: 'outplugs', title: 'Inshorts', subtitle: 'Mindful News', icon: '📰', color: '#d946ef', href: '/outplugs', importance: 'Distraction-free mindful news through a conscious lens. Stay informed without noise or negativity polluting your mental space.' },
    { id: 'raag', title: 'Raag Music', subtitle: 'Resonances', icon: '🎵', color: '#38bdf8', href: '/project-leela', importance: 'Ancient Indian classical ragas scientifically matched to time of day — healing frequencies that align your body clock with the cosmos.' },
    { id: 'swadeshi', title: 'Swadeshi', subtitle: 'Pure Organics', icon: '🛍️', color: '#f97316', href: '/swadesi-product', importance: 'Pure Organics & sacred commerce — authentic Indian artisan products that honor tradition, empower craftsmen and support Bharat.' },
    { id: 'skills', title: 'Skills', subtitle: 'Upgrade & Transform', icon: '🎯', color: '#22d3ee', href: '/skills', importance: 'Upgrade & Transform — curated skill tracks from ancient Vedic arts to modern tech. AI, coding, finance, Sanskrit, yoga & more.' },
    { id: 'games', title: 'Games', subtitle: 'Productive Play', icon: '🎲', color: '#ec4899', href: '/vedic-games', importance: 'Productive Play — Vedic-inspired mindful games that sharpen your intellect while connecting your consciousness with ancient Indian wisdom.' },
    { id: 'pranaverse', title: 'PranaVerse', subtitle: 'Resonance Feeds & Network', icon: '✦', color: '#a78bfa', href: '/pranaverse', importance: 'Resonance Feeds & Network — the sacred conscious social network. Share your Prana, discover wisdom reels & raise collective vibration worldwide.' },
];


// ════════════════════════════════════════════════════════
//  VEDIC MANTRAS — overlaid on Reel cards
// ════════════════════════════════════════════════════════
const MANTRAS = [
    { sanskrit: 'ॐ नमः शिवाय', transliteration: 'Om Namah Shivaya', meaning: 'I bow to the inner self', color: '#c084fc' },
    { sanskrit: 'ॐ गं गणपतये नमः', transliteration: 'Om Gam Ganapataye Namah', meaning: 'Salutations to Ganesha, remover of obstacles', color: '#fbbf24' },
    { sanskrit: 'ॐ श्री महालक्ष्म्यै नमः', transliteration: 'Om Shri Mahalakshmyai Namah', meaning: 'Salutations to the divine abundance', color: '#f472b6' },
    { sanskrit: 'ॐ ह्रीं क्लीं महामायायै नमः', transliteration: 'Om Hreem Kleem Mahamayayai Namah', meaning: 'Salutations to the great cosmic illusion', color: '#60a5fa' },
    { sanskrit: 'असतो मा सद्गमय', transliteration: 'Asato Ma Sadgamaya', meaning: 'Lead me from untruth to truth', color: '#34d399' },
    { sanskrit: 'तमसो मा ज्योतिर्गमय', transliteration: 'Tamaso Ma Jyotirgamaya', meaning: 'Lead me from darkness to light', color: '#fde68a' },
    { sanskrit: 'ॐ मणि पद्मे हूँ', transliteration: 'Om Mani Padme Hum', meaning: 'The jewel in the lotus', color: '#a78bfa' },
    { sanskrit: 'सर्वे भवन्तु सुखिनः', transliteration: 'Sarve Bhavantu Sukhinah', meaning: 'May all beings be happy', color: '#86efac' },
];

// ════════════════════════════════════════════════════════
//  TIME-BASED UNSPLASH IMAGE POOLS
// ════════════════════════════════════════════════════════
const REEL_IMAGES = {
    morning: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=1067&fit=crop&q=80',
        'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=600&h=1067&fit=crop&q=80',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=1067&fit=crop&q=80',
        'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&h=1067&fit=crop&q=80',
        'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=600&h=1067&fit=crop&q=80',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=1067&fit=crop&q=80',
    ],
    day: [
        'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&h=1067&fit=crop&q=80',
        'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=600&h=1067&fit=crop&q=80',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=1067&fit=crop&q=80',
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&h=1067&fit=crop&q=80',
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=1067&fit=crop&q=80',
        'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=600&h=1067&fit=crop&q=80',
    ],
    evening: [
        'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=600&h=1067&fit=crop&q=80',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=1067&fit=crop&q=80',
        'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=600&h=1067&fit=crop&q=80',
        'https://images.unsplash.com/photo-1419833173245-f59e1b93f9ee?w=600&h=1067&fit=crop&q=80',
        'https://images.unsplash.com/photo-1507041957456-9c397ce39c7f?w=600&h=1067&fit=crop&q=80',
        'https://images.unsplash.com/photo-1472120435266-53107fd0c44a?w=600&h=1067&fit=crop&q=80',
    ],
    night: [
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=1067&fit=crop&q=80',
        'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=600&h=1067&fit=crop&q=80',
        'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=600&h=1067&fit=crop&q=80',
        'https://images.unsplash.com/photo-1532978379173-523e16f371f2?w=600&h=1067&fit=crop&q=80',
        'https://images.unsplash.com/photo-1475274047050-1d0c0975f9f1?w=600&h=1067&fit=crop&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=1067&fit=crop&q=80',
    ],
};

// Story bar data
const STORIES = [
    { id: 's1', label: 'Panchang', icon: '☀️', color: '#fbbf24', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)' },
    { id: 's2', label: 'Gurukul', icon: '🪔', color: '#f59e0b', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)' },
    { id: 's3', label: 'Bodhi', icon: '✨', color: '#14b8a6', gradient: 'linear-gradient(135deg,#0d9488,#0f766e)' },
    { id: 's4', label: 'Mantras', icon: '🤔', color: '#c084fc', gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)' },
    { id: 's5', label: 'Nature', icon: '🌿', color: '#4ade80', gradient: 'linear-gradient(135deg,#22c55e,#16a34a)' },
    { id: 's6', label: 'Cosmos', icon: '🌙', color: '#818cf8', gradient: 'linear-gradient(135deg,#6366f1,#4f46e5)' },
    { id: 's7', label: 'Wisdom', icon: '📿', color: '#f472b6', gradient: 'linear-gradient(135deg,#ec4899,#be185d)' },
];

// ════════════════════════════════════════════════════════
//  RESONANCE PAGE STORIES → Pranaverse Reel Cards
// ════════════════════════════════════════════════════════
const RESONANCE_STORIES = [
    { id: 'gayatri', label: 'Gayatri Mantra', sublabel: 'Mother of Vedas', color: '#fbbf24', emoji: '\u{1F31E}', bg: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=600&h=1067&fit=crop&q=80', mantra: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं', featured: true },
    { id: 'om_namah', label: 'Om Namah Shivaya', sublabel: 'Panchakshara', color: '#a78bfa', emoji: '\u{1F549}', bg: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&h=1067&fit=crop&q=80', mantra: 'ॐ नमः शिवाय' },
    { id: 'mahamrityunjaya', label: 'Mahamrityunjaya', sublabel: 'Conqueror of Death', color: '#f97316', emoji: '\u{1F525}', bg: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&h=1067&fit=crop&q=80', mantra: 'ॐ त्र्यम्बकं यजामहे' },
    { id: 'hanuman', label: 'Hanuman Chalisa', sublabel: 'Bajrangbali', color: '#ef4444', emoji: '\u{1F34A}', bg: 'https://images.unsplash.com/photo-1609619385002-f40f1df9b7eb?w=600&h=1067&fit=crop&q=80', mantra: 'जय हनुमान ज्ञान गुण सागर' },
    { id: 'ganesha', label: 'Ganesha Vandana', sublabel: 'Vighnaharta', color: '#f59e0b', emoji: '\u{1F418}', bg: 'https://images.unsplash.com/photo-1600959907703-571a4f1f9fc4?w=600&h=1067&fit=crop&q=80', mantra: 'ॐ गं गणपतये नमः' },
    { id: 'krishna', label: 'Hare Krishna', sublabel: 'Maha Mantra', color: '#06b6d4', emoji: '\u{1FA77}', bg: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=1067&fit=crop&q=80', mantra: 'हरे राम हरे राम राम राम हरे हरे' },
    { id: 'durga', label: 'Durga Stuti', sublabel: 'Shakti Mantra', color: '#ec4899', emoji: '\u{1F6E1}', bg: 'https://images.unsplash.com/photo-1604607053579-ac6a2a40e77c?w=600&h=1067&fit=crop&q=80', mantra: 'ॐ दुं दुर्गायै नमः' },
    { id: 'saraswati', label: 'Saraswati Vandana', sublabel: 'Goddess of Knowledge', color: '#ffffff', emoji: '\u{1F3B5}', bg: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&h=1067&fit=crop&q=80', mantra: 'ॐ ऐं ह्रीं क्लीं महासरस्वत्यै नमः' },
    { id: 'asato', label: 'Asato Ma', sublabel: 'Shanti Mantra', color: '#c4b5fd', emoji: '✨', bg: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=600&h=1067&fit=crop&q=80', mantra: 'ॐ असतो मा सद्गमय' },
    { id: 'vedic', label: 'Vedic Wisdom', sublabel: 'Ancient Knowledge', color: '#d8b4fe', emoji: '\u{1F4DC}', bg: 'https://images.unsplash.com/photo-1510531704581-5b2870972060?w=600&h=1067&fit=crop&q=80', mantra: 'सर्वे भवन्तु सुखिनः' },
    { id: 'dhyan', label: 'Dhyan', sublabel: 'Meditation', color: '#22d3ee', emoji: '\u{1F9D8}', bg: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=600&h=1067&fit=crop&q=80' },
    { id: 'ai-acharya', label: 'AI Ayurvedacharya', sublabel: 'Pranav · Free Consult', color: '#4ade80', emoji: '\u{1F33F}', bg: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=1067&fit=crop&q=80' },
    // ── Gurukul: World-Class Modern + Ancient Wisdom + Startup Support ──
    { id: 'gurukul-vision', label: 'World Premier Gurukul', sublabel: 'Modern Skills • Ancient Wisdom • Startup Support', color: '#fbbf24', emoji: '\u{1F3DB}', bg: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&h=1067&fit=crop&q=80', mantra: 'ज्ञानं परमं बलम् — Knowledge is Supreme Power' },
    { id: 'gurukul-modern', label: 'AI & Modern Sciences', sublabel: 'Vedic Mathematics • Coding • AI • Engineering', color: '#60a5fa', emoji: '\u{1F916}', bg: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=600&h=1067&fit=crop&q=80', mantra: 'आर्टिफिशियल इंटेलिजेन्स + वेदिक ज्ञान' },
    { id: 'gurukul-startup', label: 'Startup Support', sublabel: 'Ideas • Product Dev • Launch • Scale', color: '#4ade80', emoji: '\u{1F680}', bg: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&h=1067&fit=crop&q=80', mantra: 'उद्यमेन हि सिध्यन्ति कार्याणि — Success by Effort' },
    { id: 'gurukul-gita', label: 'Bhagavat Gita', sublabel: 'Divine Song of Eternal Dharma', color: '#fbbf24', emoji: '\u{1F4D6}', bg: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=1067&fit=crop&q=80', mantra: 'न त्वं शोचितुमर्हसि — Thou shalt not grieve' },
    { id: 'gurukul-upanishad', label: 'Upanishads', sublabel: 'Supreme Vedantic Wisdom', color: '#f97316', emoji: '\u{1F549}', bg: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=1067&fit=crop&q=80', mantra: 'तत् त्वमसि — Thou art That' },
    { id: 'gurukul-sanskrit', label: 'Sanskrit Vyakaran', sublabel: 'Language of the Gods', color: '#c084fc', emoji: '\u{1FAB7}', bg: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=600&h=1067&fit=crop&q=80', mantra: 'अहं ब्रह्मास्मि — I am Brahman' },
    { id: 'gurukul-darshan', label: 'Darshan Shastra', sublabel: 'Six Schools of Indian Philosophy', color: '#f472b6', emoji: '\u{1F52D}', bg: 'https://images.unsplash.com/photo-1475274047050-1d0c0975f9f1?w=600&h=1067&fit=crop&q=80', mantra: 'सत्चिदानन्द — Truth, Consciousness, Bliss' },
    { id: 'sunrise', label: 'Sunrise', sublabel: 'Pratah Kaal', color: '#fbbf24', emoji: '\u{1F304}', bg: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=1067&fit=crop&q=80' },
    { id: 'sunset', label: 'Sunset', sublabel: 'Sandhya', color: '#fb923c', emoji: '\u{1F305}', bg: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=600&h=1067&fit=crop&q=80' },
    { id: 'himalaya', label: 'Himalaya', sublabel: 'Sacred Peaks', color: '#93c5fd', emoji: '\u{1F3D4}', bg: 'https://images.unsplash.com/photo-1455156218388-5e61b526818b?w=600&h=1067&fit=crop&q=80' },
    { id: 'ganga', label: 'Ganga', sublabel: 'Sacred River', color: '#60a5fa', emoji: '\u{1F30A}', bg: 'https://images.unsplash.com/photo-1545420333-5c5fe6fc5a33?w=600&h=1067&fit=crop&q=80' },
    { id: 'lotus', label: 'Lotus', sublabel: 'Padma Pushpa', color: '#f9a8d4', emoji: '\u{1FAB7}', bg: 'https://images.unsplash.com/photo-1616587894288-82f7b65dd78f?w=600&h=1067&fit=crop&q=80' },
    { id: 'temple', label: 'Mandir', sublabel: 'Sacred Temple', color: '#fde68a', emoji: '\u{1F6D5}', bg: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&h=1067&fit=crop&q=80' },
    { id: 'yoga', label: 'Yoga', sublabel: 'Union of Soul', color: '#34d399', emoji: '\u{1F9D8}', bg: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=1067&fit=crop&q=80' },
    { id: 'ayurveda', label: 'Ayurveda', sublabel: 'Science of Life', color: '#a3e635', emoji: '\u{1F33F}', bg: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&h=1067&fit=crop&q=80' },
    { id: 'nature', label: 'Prakriti', sublabel: 'Earth Soul', color: '#34d399', emoji: '\u{1F332}', bg: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=1067&fit=crop&q=80' },
    { id: 'swadeshi', label: 'Swadeshi', sublabel: 'Sacred Market', color: '#fb923c', emoji: '\u{1F6CD}', bg: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=600&h=1067&fit=crop&q=80' },
];

// ════════════════════════════════════════════════════════
//  TYPES
// ════════════════════════════════════════════════════════
type TimeSlot = 'morning' | 'day' | 'evening' | 'night';
type FeedItemType = 'reel' | 'portal' | 'resonance';

interface ReelItem {
    id: string;
    type: 'reel';
    imageUrl: string;
    mantra: typeof MANTRAS[0];
    likes: number;
    views: string;
    localVideoSrc?: string;
}

interface PortalItem {
    id: string;
    type: 'portal';
    portal: typeof SACRED_PORTALS[0];
    imageUrl: string;
}

interface ResonanceItem {
    id: string;
    type: 'resonance';
    story: typeof RESONANCE_STORIES[0];
    likes: number;
    views: string;
}

type FeedItem = ReelItem | PortalItem | ResonanceItem;

// ════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════
function getTimeSlot(): TimeSlot {
    const h = new Date().getHours();
    if (h >= 5 && h < 11) return 'morning';
    if (h >= 11 && h < 17) return 'day';
    if (h >= 17 && h < 21) return 'evening';
    return 'night';
}

// Local Dhyan videos from existing app
const LOCAL_VIDEOS = [
    '/Slide%20Videos/Dhyan2.mp4',
    '/Slide%20Videos/Dhyan4.mp4',
    '/Slide%20Videos/Dhyan5.mp4',
    '/Slide%20Videos/Dhyan7.mp4',
    '/Slide%20Videos/Dhyan10.mp4',
    '/Slide%20Videos/Dhyan11.mp4',
    '/Slide%20Videos/Kedar.mp4',
    '/Slide%20Videos/Shiva.mp4',
    '/Slide%20Videos/sunset.mp4',
    '/Flash%20Videos/kailash.mp4',
    '/Flash%20Videos/kailash2.mp4',
];

function buildMixedFeed(timeSlot: TimeSlot): FeedItem[] {
    const images = REEL_IMAGES[timeSlot];
    const items: FeedItem[] = [];
    let imgIdx = 0;
    let mantraIdx = 0;
    let portalIdx = 0;
    let videoIdx = 0;

    // Pattern: 2 reels → 1 portal → 3 reels → 1 portal → repeat
    const pattern = [2, 1, 3, 1, 2, 1, 3, 1];
    let typeQueue: Array<'reel' | 'portal'> = [];
    for (const count of pattern) {
        for (let i = 0; i < count; i++) {
            typeQueue.push(typeQueue.length % 6 === 2 || typeQueue.length % 6 === 5 ? 'portal' : 'reel');
        }
    }
    // Simpler: just manually produce 20 feed items
    const ratioReels = [0, 1, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14, 16, 17, 18];
    const ratioPortals = [3, 7, 11, 15, 19];

    for (let i = 0; i < 20; i++) {
        if (ratioPortals.includes(i)) {
            const portal = SACRED_PORTALS[portalIdx % SACRED_PORTALS.length];
            items.push({
                id: `portal-${i}`,
                type: 'portal',
                portal,
                imageUrl: images[(imgIdx++) % images.length],
            });
            portalIdx++;
        } else {
            const isVideo = videoIdx < LOCAL_VIDEOS.length;

            // Pseudo-random based on index to avoid SSR hydration mismatches
            const pseudoRandomLikes = (i * 347) % 3000;
            const pseudoRandomViews = (i * 19) % 90;

            items.push({
                id: `reel-${i}`,
                type: 'reel',
                imageUrl: images[(imgIdx++) % images.length],
                mantra: MANTRAS[mantraIdx % MANTRAS.length],
                likes: 800 + pseudoRandomLikes,
                views: `${10 + pseudoRandomViews}K`,
                localVideoSrc: isVideo ? LOCAL_VIDEOS[videoIdx % LOCAL_VIDEOS.length] : undefined,
            });
            mantraIdx++;
            videoIdx++;
        }
    }
    return items;
}

// Append all Resonance story cards at the end of the feed
function buildResonanceFeedItems(): ResonanceItem[] {
    return RESONANCE_STORIES.map((s, i) => ({
        id: `resonance-${s.id}`,
        type: 'resonance' as const,
        story: s,
        likes: Math.floor(1200 + i * 340 + 80),
        views: `${Math.floor(15 + i * 7)}K`,
    }));
}

// ════════════════════════════════════════════════════════
//  REEL GRID CARD  (StoryBar replaced by HomeStoryBar)
// ════════════════════════════════════════════════════════
// NOTE: Story bar is now rendered by <HomeStoryBar /> imported above.

function _StoryBar_REMOVED() {
    const [viewed, setViewed] = useState<Set<string>>(new Set());
    const [activeStory, setActiveStory] = useState<typeof STORIES[0] | null>(null);

    return (
        <>
            <div style={{
                display: 'flex',
                gap: '0.75rem',
                padding: '0.75rem 1rem 0.5rem',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 100%)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                flexShrink: 0,
                zIndex: 40,
                position: 'relative',
            }}>
                <style>{`
          .story-bar::-webkit-scrollbar { display: none; }
          @keyframes storyPulse {
            0%,100% { box-shadow: 0 0 0 2px #fbbf24, 0 0 12px 2px rgba(251,191,36,0.5); }
            50%      { box-shadow: 0 0 0 2.5px #fde68a, 0 0 20px 4px rgba(251,191,36,0.7); }
          }
          @keyframes ringFloat {
            0%,100%{transform:translateY(0) scale(1);}
            50%{transform:translateY(-4px) scale(1.04);}
          }
        `}</style>

                {/* "Add Story" avatar */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                    <div style={{
                        width: 52, height: 52, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1.5px dashed rgba(255,255,255,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.3rem', cursor: 'pointer',
                    }}>+</div>
                    <span style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>Your Story</span>
                </div>

                {STORIES.map((story, i) => {
                    const isViewed = viewed.has(story.id);
                    return (
                        <motion.div
                            key={story.id}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', flexShrink: 0, cursor: 'pointer' }}
                            whileTap={{ scale: 0.93 }}
                            onClick={() => { setActiveStory(story); setViewed(v => new Set([...v, story.id])); }}
                            initial={{ opacity: 0, scale: 0.7, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: i * 0.06, type: 'spring', stiffness: 280, damping: 20 }}
                        >
                            {/* Ring */}
                            <div style={{
                                width: 58, height: 58,
                                borderRadius: '50%',
                                padding: 2,
                                background: isViewed ? 'rgba(255,255,255,0.12)' : `conic-gradient(${story.color} 0deg, #fde68a 180deg, ${story.color} 360deg)`,
                                animation: isViewed ? 'none' : `storyPulse 3s ease-in-out ${i * 0.4}s infinite, ringFloat ${3.5 + i * 0.3}s ease-in-out ${i * 0.2}s infinite`,
                            }}>
                                <div style={{
                                    width: '100%', height: '100%',
                                    borderRadius: '50%',
                                    border: '2px solid #000',
                                    background: story.gradient,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.35rem',
                                    filter: isViewed ? 'grayscale(0.5) brightness(0.7)' : 'none',
                                }}>
                                    {story.icon}
                                </div>
                            </div>
                            <span style={{
                                fontSize: '0.52rem',
                                color: isViewed ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.85)',
                                fontFamily: "'Inter', sans-serif",
                                fontWeight: 600,
                                letterSpacing: '0.04em',
                                textAlign: 'center',
                                maxWidth: 52,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>{story.label}</span>
                        </motion.div>
                    );
                })}
            </div>

            {/* Story Viewer */}
            <AnimatePresence>
                {activeStory && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setActiveStory(null)}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 9999,
                            background: 'rgba(0,0,0,0.96)',
                            backdropFilter: 'blur(20px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <motion.div
                            onClick={e => e.stopPropagation()}
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                            style={{
                                width: '92vw', maxWidth: 360, height: '75vh', maxHeight: 640,
                                borderRadius: 28,
                                background: activeStory.gradient,
                                position: 'relative', overflow: 'hidden',
                                boxShadow: `0 40px 120px rgba(0,0,0,0.7), 0 0 60px ${activeStory.color}44`,
                            }}
                        >
                            <div style={{
                                position: 'absolute', inset: 0,
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                gap: '1rem',
                            }}>
                                <motion.div
                                    animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                    style={{ fontSize: '5rem', filter: `drop-shadow(0 0 30px ${activeStory.color})` }}
                                >
                                    {activeStory.icon}
                                </motion.div>
                                <h2 style={{
                                    fontSize: '2rem', fontWeight: 800, color: '#fff',
                                    fontFamily: "'Cormorant Garamond', serif",
                                    textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                }}>{activeStory.label}</h2>
                                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', textAlign: 'center', padding: '0 2rem' }}>
                                    ✨ Tap anywhere to close
                                </p>
                            </div>
                            <button
                                onClick={() => setActiveStory(null)}
                                style={{
                                    position: 'absolute', top: 16, right: 16,
                                    background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '50%', width: 34, height: 34,
                                    color: '#fff', cursor: 'pointer', fontSize: '1rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >×</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// ════════════════════════════════════════════════════════
//  REEL GRID CARD
// ════════════════════════════════════════════════════════
function ReelGridCard({ item, onClick }: { item: ReelItem; onClick: () => void }) {
    const [liked, setLiked] = useState(false);
    const [loved, setLoved] = useState(false);
    const [likeCount, setLikeCount] = useState(item.likes);
    const [loveCount, setLoveCount] = useState(Math.floor(item.likes * 0.42));

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        setLiked(l => !l);
        setLikeCount(c => liked ? c - 1 : c + 1);
    };
    const handleLove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setLoved(l => !l);
        setLoveCount(c => loved ? c - 1 : c + 1);
    };

    return (
        <motion.div
            onClick={onClick}
            whileTap={{ scale: 0.97 }}
            style={{
                position: 'relative',
                aspectRatio: '9/16',
                overflow: 'hidden',
                cursor: 'pointer',
                borderRadius: 0,
                background: '#0a0a0a',
            }}
        >
            {item.localVideoSrc ? (
                <video
                    src={item.localVideoSrc}
                    muted
                    autoPlay
                    loop
                    playsInline
                    poster={item.imageUrl}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
            ) : (
                <img
                    src={item.imageUrl}
                    alt="Sacred nature"
                    loading="lazy"
                    style={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%',
                        objectFit: 'cover', objectPosition: 'center',
                    }}
                />
            )}

            {/* Gradient overlay — bottom → top dark */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.08) 100%)',
                pointerEvents: 'none',
            }} />

            {/* Top status bar */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                padding: '0.5rem 0.6rem 0.3rem',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{
                    fontSize: '0.45rem', fontWeight: 700, letterSpacing: '0.12em',
                    color: 'rgba(251,191,36,0.9)', textTransform: 'uppercase',
                    fontFamily: "'Inter', sans-serif",
                    background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)',
                    padding: '0.18rem 0.5rem', borderRadius: 99,
                    border: '1px solid rgba(251,191,36,0.25)',
                }}>▶ PranaVerse</div>
                <div style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.5)' }}>{item.views} views</div>
            </div>

            {/* Mantra overlay — center */}
            <div style={{
                position: 'absolute', bottom: '22%', left: '0.6rem', right: '0.6rem',
                textAlign: 'center',
                pointerEvents: 'none',
            }}>
                <p style={{
                    fontFamily: "'Cormorant Garamond', 'Noto Serif Devanagari', serif",
                    fontSize: 'clamp(0.9rem, 3vw, 1.15rem)',
                    fontWeight: 600,
                    color: item.mantra.color,
                    textShadow: `0 0 20px ${item.mantra.color}88, 0 2px 8px rgba(0,0,0,0.9)`,
                    lineHeight: 1.3,
                    marginBottom: '0.2rem',
                }}>{item.mantra.sanskrit}</p>
                <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 'clamp(0.45rem, 1.5vw, 0.58rem)',
                    color: 'rgba(255,255,255,0.75)',
                    letterSpacing: '0.06em',
                    textShadow: '0 1px 6px rgba(0,0,0,0.9)',
                    fontStyle: 'italic',
                }}>{item.mantra.meaning}</p>
            </div>

            {/* Bottom action strip — glass-encircled icons */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '0.55rem 0.9rem 0.75rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)',
            }}>
                {/* Heart — glass encircled */}
                <button onClick={handleLike} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: 0 }}>
                    <motion.div
                        animate={liked ? { scale: [1, 1.38, 0.9, 1.08, 1], rotate: [0, -6, 4, -2, 0] } : { scale: 1 }}
                        transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: liked ? 'rgba(237,73,86,0.18)' : 'rgba(255,255,255,0.11)',
                            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                            border: liked ? '1px solid rgba(237,73,86,0.45)' : '1px solid rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: liked ? '0 3px 14px rgba(237,73,86,0.3)' : '0 3px 12px rgba(0,0,0,0.4)',
                            transition: 'all 0.25s',
                        }}
                    >
                        <svg width="17" height="17" viewBox="0 0 24 24"
                            fill={liked ? '#ed4956' : 'none'}
                            stroke={liked ? '#ed4956' : 'rgba(255,255,255,0.95)'}
                            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                            style={{ filter: liked ? 'drop-shadow(0 0 5px rgba(237,73,86,0.5))' : 'none', display: 'block' }}>
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                    </motion.div>
                    <span style={{ fontSize: '0.47rem', color: liked ? '#ed4956' : 'rgba(255,255,255,0.82)', fontFamily: "'Inter', sans-serif", fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.85)' }}>
                        {likeCount > 999 ? `${(likeCount / 1000).toFixed(1)}K` : likeCount}
                    </span>
                </button>

                {/* Play indicator */}
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.11)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1.5px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 12px rgba(0,0,0,0.5)' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 2 }}><polygon points="5 3 19 12 5 21 5 3" /></svg>
                </div>

                {/* Bookmark / Save — glass encircled */}
                <button onClick={handleLove} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: 0 }}>
                    <motion.div
                        animate={loved ? { scale: [1, 1.38, 0.9, 1.08, 1], rotate: [0, 18, -10, 5, 0] } : { scale: 1 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: loved ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.11)',
                            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                            border: loved ? '1px solid rgba(251,191,36,0.45)' : '1px solid rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: loved ? '0 3px 14px rgba(251,191,36,0.3)' : '0 3px 12px rgba(0,0,0,0.4)',
                            transition: 'all 0.25s',
                        }}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24"
                            fill={loved ? '#fbbf24' : 'none'}
                            stroke={loved ? '#fbbf24' : 'rgba(255,255,255,0.95)'}
                            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                            style={{ filter: loved ? 'drop-shadow(0 0 5px rgba(251,191,36,0.5))' : 'none', display: 'block' }}>
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                    </motion.div>
                    <span style={{ fontSize: '0.47rem', color: loved ? '#fbbf24' : 'rgba(255,255,255,0.82)', fontFamily: "'Inter', sans-serif", fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.85)' }}>
                        {loveCount > 999 ? `${(loveCount / 1000).toFixed(1)}K` : loveCount}
                    </span>
                </button>
            </div>
        </motion.div>
    );
}

// ════════════════════════════════════════════════════════
//  PORTAL GRID CARD — Elegant with Importance Text
// ════════════════════════════════════════════════════════
function PortalGridCard({ item }: { item: PortalItem }) {
    const p = item.portal as typeof SACRED_PORTALS[0];

    return (
        <Link href={p.href} style={{ textDecoration: 'none', display: 'block' }}>
            <motion.div
                whileTap={{ scale: 0.97 }}
                style={{
                    position: 'relative',
                    aspectRatio: '9/16',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    borderRadius: 0,
                    background: '#050505',
                }}
            >
                {/* Background image with deep dim */}
                <img
                    src={item.imageUrl}
                    alt={p.title}
                    loading="lazy"
                    style={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%',
                        objectFit: 'cover',
                        filter: 'brightness(0.28) saturate(0.5)',
                    }}
                />

                {/* Colour aurora overlay */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: `radial-gradient(ellipse at 50% 40%, ${p.color}30 0%, ${p.color}10 45%, transparent 75%)`,
                    pointerEvents: 'none',
                }} />

                {/* Bottom gradient */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: `linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.1) 100%)`,
                    pointerEvents: 'none',
                }} />

                {/* Top portal tag */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    padding: '0.5rem 0.6rem 0.3rem',
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{
                        fontSize: '0.42rem', fontWeight: 700, color: p.color,
                        letterSpacing: '0.14em', textTransform: 'uppercase',
                        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
                        padding: '0.18rem 0.5rem', borderRadius: 99,
                        border: `1px solid ${p.color}44`,
                        fontFamily: "'Inter', sans-serif",
                    }}>✦ OneSUTRA Portal</div>
                </div>

                {/* Center: premium glassmorphic orb */}
                <div style={{
                    position: 'absolute', top: '22%', left: '50%', transform: 'translateX(-50%)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                }}>
                    {/* Outer pulsing ring */}
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.45, 0.8, 0.45] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            width: 72, height: 72, borderRadius: '50%', position: 'absolute',
                            border: `1.5px solid ${p.color}55`,
                            boxShadow: `0 0 32px ${p.color}44`,
                        }}
                    />
                    {/* Inner glass orb */}
                    <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            width: 60, height: 60, borderRadius: '50%',
                            background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.28) 0%, ${p.color}77 55%, ${p.color}33 100%)`,
                            backdropFilter: 'blur(16px)',
                            border: `1px solid ${p.color}66`,
                            boxShadow: `0 0 28px ${p.color}66, 0 8px 28px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.22)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.7rem',
                        }}
                    >
                        {p.icon === '✦' ? (
                            <span style={{ color: p.color, fontSize: '1.3rem', fontWeight: 900, filter: `drop-shadow(0 0 8px ${p.color})` }}>✦</span>
                        ) : p.icon}
                    </motion.div>
                </div>

                {/* Bottom content area: title + subtitle + importance + CTA */}
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '0.75rem 0.65rem 0.8rem',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.28rem',
                }}>
                    {/* Title */}
                    <span style={{
                        fontSize: 'clamp(0.75rem, 2.5vw, 0.95rem)',
                        fontWeight: 800, letterSpacing: '0.04em',
                        color: p.color,
                        textShadow: `0 0 20px ${p.color}99`,
                        fontFamily: "'Outfit', sans-serif",
                        textAlign: 'center',
                    }}>{p.title}</span>

                    {/* Subtitle pill */}
                    <span style={{
                        fontSize: 'clamp(0.4rem, 1.2vw, 0.5rem)',
                        color: `${p.color}cc`,
                        letterSpacing: '0.06em',
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 600,
                        background: `${p.color}18`,
                        border: `1px solid ${p.color}33`,
                        borderRadius: 99,
                        padding: '0.12rem 0.5rem',
                        textAlign: 'center',
                    }}>{p.subtitle}</span>

                    {/* Divider */}
                    <div style={{ width: '60%', height: '0.5px', background: `linear-gradient(90deg, transparent, ${p.color}55, transparent)`, margin: '0.1rem 0' }} />

                    {/* Importance text */}
                    <p style={{
                        fontSize: 'clamp(0.38rem, 1.1vw, 0.46rem)',
                        color: 'rgba(255,255,255,0.65)',
                        fontFamily: "'Inter', sans-serif",
                        lineHeight: 1.55,
                        textAlign: 'center',
                        padding: '0 0.2rem',
                        margin: 0,
                        fontStyle: 'italic',
                    }}>{(p as any).importance}</p>

                    {/* Enter CTA */}
                    <motion.div
                        whileTap={{ scale: 0.95 }}
                        style={{
                            marginTop: '0.2rem',
                            padding: '0.28rem 0.85rem',
                            borderRadius: 99,
                            background: `linear-gradient(135deg, ${p.color}cc, ${p.color})`,
                            color: '#fff',
                            fontSize: '0.42rem',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            fontFamily: "'Inter', sans-serif",
                            boxShadow: `0 4px 16px ${p.color}66`,
                        }}
                    >Enter Portal →</motion.div>
                </div>
            </motion.div>
        </Link>
    );
}



// ════════════════════════════════════════════════════════
//  RESONANCE REEL CARD — exact Resonance page look & feel as a 9:16 reel
// ════════════════════════════════════════════════════════
function ResonanceReelCard({ item, onClick }: { item: ResonanceItem; onClick: () => void }) {
    const s = item.story;
    const [liked, setLiked] = React.useState(false);
    const [loved, setLoved] = React.useState(false);
    const [likeCount, setLikeCount] = React.useState(item.likes);
    const [loveCount, setLoveCount] = React.useState(Math.floor(item.likes * 0.38));
    const hasMantras = !!(s as any).mantra;

    return (
        <motion.div
            onClick={onClick}
            whileTap={{ scale: 0.97 }}
            style={{
                position: 'relative',
                aspectRatio: '9/16',
                overflow: 'hidden',
                cursor: 'pointer',
                borderRadius: 0,
                background: '#0a0c1e',
            }}
        >
            {/* Background image - same as Resonance page grid cards */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${s.bg})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                opacity: hasMantras ? 0.45 : 0.82,
            }} />

            {/* Resonance page gradient overlay */}
            <div style={{
                position: 'absolute', inset: 0,
                background: hasMantras
                    ? `linear-gradient(160deg,${s.color}18 0%,rgba(0,0,0,0.7) 60%,rgba(0,0,0,0.88) 100%)`
                    : `linear-gradient(180deg,rgba(0,0,0,0.04) 0%,rgba(0,0,0,0.65) 70%,rgba(0,0,0,0.88) 100%)`,
            }} />

            {/* Animated color ring border - same as resonance grid cards */}
            <motion.div
                animate={{ opacity: [0.4, 0.85, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute', inset: 0,
                    boxShadow: `inset 0 0 0 1.5px ${s.color}55`,
                    pointerEvents: 'none',
                }}
            />

            {/* Top tag: Resonance origin badge */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                padding: '0.5rem 0.6rem 0.3rem',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.65) 0%, transparent 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{
                    fontSize: '0.42rem', fontWeight: 700, color: s.color,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(8px)',
                    padding: '0.18rem 0.5rem', borderRadius: 99,
                    border: `1px solid ${s.color}44`,
                    fontFamily: "'Inter', sans-serif",
                }}>✦ Sacred Mantras</div>
                <span style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.45)' }}>{item.views} views</span>
            </div>

            {/* Emoji - top corner (Resonance style) */}
            <div style={{
                position: 'absolute', top: hasMantras ? 36 : 28, left: hasMantras ? 10 : 'auto', right: hasMantras ? 'auto' : 9,
                fontSize: hasMantras ? '1.5rem' : '1.25rem',
                filter: `drop-shadow(0 0 10px ${s.color}80)`,
                zIndex: 2,
            }}>{s.emoji}</div>

            {/* Bottom content - Resonance style: sublabel + label + mantra */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '0.65rem 0.75rem 0.55rem',
                background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 100%)',
            }}>
                {/* Sublabel (PANCHAKSHARA, BAJRANGBALI etc.) */}
                <div style={{
                    fontSize: '0.5rem', color: s.color, fontWeight: 800,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    marginBottom: '0.2rem',
                    fontFamily: "'Inter', sans-serif",
                    textShadow: `0 0 12px ${s.color}88`,
                }}>{s.sublabel}</div>

                {/* Title (Gayatri Mantra, Om Namah Shivaya etc.) */}
                <div style={{
                    fontSize: 'clamp(0.75rem, 2.5vw, 0.95rem)', color: '#fff', fontWeight: 700,
                    fontFamily: "'Playfair Display', Georgia, serif",
                    marginBottom: hasMantras ? '0.35rem' : '0.25rem',
                    lineHeight: 1.2,
                    textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                }}>{s.label}</div>

                {/* Sanskrit mantra line (Resonance exact style) */}
                {hasMantras && (
                    <div style={{
                        fontSize: 'clamp(0.6rem, 2vw, 0.75rem)',
                        color: `${s.color}cc`,
                        fontFamily: "'Noto Serif Devanagari', serif",
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const,
                        textShadow: `0 0 16px ${s.color}66`,
                    }}>{(s as any).mantra}</div>
                )}

                {/* Action row — polished SVG icons */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginTop: '0.4rem',
                }}>
                    <button
                        onClick={e => { e.stopPropagation(); setLiked(l => !l); setLikeCount(c => liked ? c - 1 : c + 1); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0 }}
                    >
                        <motion.div animate={liked ? { scale: [1, 1.42, 0.9, 1.08, 1] } : { scale: 1 }} transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}>
                            <svg width="18" height="18" viewBox="0 0 24 24"
                                fill={liked ? '#ed4956' : 'none'}
                                stroke={liked ? '#ed4956' : 'rgba(255,255,255,0.88)'}
                                strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"
                                style={{ filter: liked ? 'drop-shadow(0 0 5px rgba(237,73,86,0.55))' : 'none', display: 'block' }}>
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                        </motion.div>
                        <span style={{ fontSize: '0.42rem', color: liked ? '#ed4956' : 'rgba(255,255,255,0.7)', fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                            {likeCount > 999 ? `${(likeCount / 1000).toFixed(1)}K` : likeCount}
                        </span>
                    </button>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 2 }}><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    </div>
                    <button
                        onClick={e => { e.stopPropagation(); setLoved((l: boolean) => !l); setLoveCount((c: number) => loved ? c - 1 : c + 1); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0 }}
                    >
                        <motion.div animate={loved ? { scale: [1, 1.42, 0.9, 1.08, 1], rotate: [0, 15, -8, 4, 0] } : { scale: 1 }} transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}>
                            <svg width="18" height="18" viewBox="0 0 24 24"
                                fill={loved ? '#fbbf24' : 'none'}
                                stroke={loved ? '#fbbf24' : 'rgba(255,255,255,0.88)'}
                                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                style={{ filter: loved ? 'drop-shadow(0 0 7px rgba(251,191,36,0.9))' : 'drop-shadow(0 1px 3px rgba(0,0,0,0.85))', display: 'block' }}>
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                        </motion.div>
                        <span style={{ fontSize: '0.42rem', color: loved ? '#fbbf24' : 'rgba(255,255,255,0.7)', fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                            {loveCount > 999 ? `${(loveCount / 1000).toFixed(1)}K` : loveCount}
                        </span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

// ════════════════════════════════════════════════════════
//  GAYATRI MANTRA HERO CARD — full-width top of feed
// ════════════════════════════════════════════════════════
function GayatriHeroCard({ onClick }: { onClick: () => void }) {
    const g = RESONANCE_STORIES[0]; // Gayatri Mantra
    const [liked, setLiked] = React.useState(false);
    const [loved, setLoved] = React.useState(false);
    const [likeCount, setLikeCount] = React.useState(18240);
    const [loveCount, setLoveCount] = React.useState(9830);

    return (
        <motion.div
            onClick={onClick}
            whileTap={{ scale: 0.985 }}
            style={{
                position: 'relative',
                gridColumn: '1 / -1', // spans both columns
                width: '100%',
                aspectRatio: '16/9',
                overflow: 'hidden',
                cursor: 'pointer',
                background: '#050510',
            }}
        >
            {/* Background image */}
            <img
                src={g.bg}
                alt="Gayatri Mantra"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }}
            />

            {/* Rich golden overlay */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(160deg, rgba(251,191,36,0.18) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.92) 100%)',
            }} />
            <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse at 50% 40%, rgba(251,191,36,0.22) 0%, transparent 65%)',
            }} />

            {/* Shimmer border */}
            <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute', inset: 0,
                    boxShadow: 'inset 0 0 0 1.5px rgba(251,191,36,0.45)',
                    pointerEvents: 'none',
                }}
            />

            {/* Top badge */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                padding: '0.6rem 0.8rem 0.3rem',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <motion.div
                    animate={{ opacity: [0.85, 1, 0.85] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                        fontSize: '0.45rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
                        color: '#fbbf24', fontFamily: "'Inter', sans-serif",
                        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)',
                        padding: '0.2rem 0.65rem', borderRadius: 99,
                        border: '1px solid rgba(251,191,36,0.4)',
                        boxShadow: '0 0 12px rgba(251,191,36,0.35)',
                    }}
                >✦ Featured</motion.div>
                <span style={{ fontSize: '0.4rem', color: 'rgba(255,255,255,0.45)', fontFamily: "'Inter', sans-serif" }}>98K views</span>
            </div>

            {/* Sun emoji */}
            <motion.div
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.12, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute', top: '0.75rem', right: '0.75rem',
                    fontSize: '1.6rem', filter: 'drop-shadow(0 0 16px rgba(251,191,36,0.9))',
                    zIndex: 2,
                }}
            >{g.emoji}</motion.div>

            {/* Center content */}
            <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', padding: '0 1.2rem',
            }}>
                <motion.p
                    initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                    style={{
                        fontSize: '0.5rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase',
                        color: '#fbbf24', fontFamily: "'Inter', sans-serif",
                        textShadow: '0 0 20px rgba(251,191,36,0.7)',
                        marginBottom: '0.3rem',
                    }}
                >Mother of Vedas</motion.p>
                <motion.h2
                    initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                    style={{
                        fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                        fontSize: 'clamp(1.3rem, 5vw, 2rem)', fontWeight: 700,
                        color: '#fff', textShadow: '0 2px 24px rgba(0,0,0,0.8)',
                        marginBottom: '0.4rem', lineHeight: 1.15,
                    }}
                >Gayatri Mantra</motion.h2>
                <motion.p
                    initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.45 }}
                    style={{
                        fontFamily: "'Noto Serif Devanagari', serif",
                        fontSize: 'clamp(0.55rem, 2vw, 0.75rem)',
                        color: 'rgba(251,191,36,0.88)',
                        textShadow: '0 0 20px rgba(251,191,36,0.5)',
                        lineHeight: 1.6,
                    }}
                >{g.mantra}</motion.p>
            </div>

            {/* Bottom actions */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '0.5rem 0.8rem 0.6rem',
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <button onClick={e => { e.stopPropagation(); setLiked(l => !l); setLikeCount(c => liked ? c - 1 : c + 1); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', padding: 0 }}>
                    <motion.div animate={liked ? { scale: [1, 1.45, 0.88, 1.1, 1], rotate: [0, -6, 4, -2, 0] } : { scale: 1 }} transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] }}>
                        <svg width="22" height="22" viewBox="0 0 24 24"
                            fill={liked ? '#ed4956' : 'none'}
                            stroke={liked ? '#ed4956' : 'rgba(255,255,255,0.92)'}
                            strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"
                            style={{ filter: liked ? 'drop-shadow(0 0 6px rgba(237,73,86,0.55))' : 'none', display: 'block' }}>
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                    </motion.div>
                    <span style={{ fontSize: '0.45rem', color: liked ? '#ed4956' : 'rgba(255,255,255,0.78)', fontFamily: "'Inter', sans-serif", fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.85)' }}>
                        {likeCount > 999 ? `${(likeCount / 1000).toFixed(1)}K` : likeCount}
                    </span>
                </button>

                <div style={{
                    padding: '0.3rem 1rem', borderRadius: 99, fontSize: '0.48rem', fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    background: 'linear-gradient(135deg, #fbbf24cc, #f59e0b)',
                    color: '#000', fontFamily: "'Inter', sans-serif",
                    boxShadow: '0 4px 16px rgba(251,191,36,0.45)',
                }}>▶ Watch Now</div>

                <button onClick={e => { e.stopPropagation(); setLoved(l => !l); setLoveCount(c => loved ? c - 1 : c + 1); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', padding: 0 }}>
                    <motion.div animate={loved ? { scale: [1, 1.45, 0.88, 1.1, 1], rotate: [0, 20, -10, 5, 0] } : { scale: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
                        <svg width="22" height="22" viewBox="0 0 24 24"
                            fill={loved ? '#fbbf24' : 'none'}
                            stroke={loved ? '#fbbf24' : 'rgba(255,255,255,0.92)'}
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            style={{ filter: loved ? 'drop-shadow(0 0 10px rgba(251,191,36,0.95))' : 'drop-shadow(0 1px 5px rgba(0,0,0,0.9))', display: 'block' }}>
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                    </motion.div>
                    <span style={{ fontSize: '0.45rem', color: loved ? '#fbbf24' : 'rgba(255,255,255,0.78)', fontFamily: "'Inter', sans-serif", fontWeight: 700, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.85))' }}>
                        {loveCount > 999 ? `${(loveCount / 1000).toFixed(1)}K` : loveCount}
                    </span>
                </button>
            </div>
        </motion.div>
    );
}

// ════════════════════════════════════════════════════════
function FullscreenReelModal({
    items,
    initialIndex,
    onClose,
    authorName = 'Mitra',
}: {
    items: (ReelItem | ResonanceItem)[];
    initialIndex: number;
    onClose: () => void;
    authorName?: string;
}) {
    const currentAuthorName = authorName;
    const [current, setCurrent] = useState(initialIndex);
    const [muted, setMuted] = useState(true);
    const [liked, setLiked] = useState<Set<string>>(new Set());
    const [liveLikes, setLiveLikes] = useState<Record<string, number>>({});
    const [liveComments, setLiveCmts] = useState<Record<string, number>>({});
    const [showComments, setShowCmts] = useState(false);
    const [comments, setComments] = useState<Array<{ id: string; text: string; author: string; ts: number }>>([]);
    const [commentText, setCommentText] = useState('');
    const [posting, setPosting] = useState(false);
    const [heartFlash, setHeartFlash] = useState(false);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const dragStartY = useRef(0);
    const lastTap = useRef(0);
    const cmtUnsub = useRef<(() => void) | null>(null);
    const dragY = useMotionValue(0);
    const opacity = useTransform(dragY, [-200, 0, 200], [0, 1, 0]);

    const item = items[current];
    const reelId = item.id;
    const isLiked = liked.has(reelId);
    const likes = liveLikes[reelId] ?? 0;
    const cmtCount = liveComments[reelId] ?? 0;

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);

    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowUp') setCurrent(c => Math.max(0, c - 1));
            if (e.key === 'ArrowDown') setCurrent(c => Math.min(items.length - 1, c + 1));
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose, items.length]);

    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        v.muted = muted;
        v.play().catch(() => { });
        return () => { try { v.pause(); } catch { } };
    }, [current, muted]);

    // ── Firebase: real-time likes ──────────────────────────────────────────────
    useEffect(() => {
        let unsub: (() => void) | null = null;
        (async () => {
            try {
                const { getFirebaseFirestore } = await import('@/lib/firebase');
                const { doc, onSnapshot, setDoc, getDoc } = await import('firebase/firestore');
                const db = await getFirebaseFirestore();
                const ref = doc(db, 'pranaverse_reels', reelId);
                const _initSnap = await getDoc(ref);
                if (!_initSnap.exists()) await setDoc(ref, { likes: 0, comments: 0 });
                unsub = onSnapshot(ref, snap => {
                    if (snap.exists()) setLiveLikes(p => ({ ...p, [reelId]: snap.data().likes ?? 0 }));
                });
            } catch { /* offline */ }
        })();
        return () => { unsub?.(); };
    }, [reelId, item.likes]);

    // ── Firebase: real-time comments (only when sheet is open) ────────────────
    useEffect(() => {
        if (!showComments) { cmtUnsub.current?.(); cmtUnsub.current = null; return; }
        (async () => {
            try {
                const { getFirebaseFirestore } = await import('@/lib/firebase');
                const { collection, query, orderBy, onSnapshot } = await import('firebase/firestore');
                const db = await getFirebaseFirestore();
                const q = query(collection(db, 'pranaverse_reels', reelId, 'comments'), orderBy('ts', 'asc'));
                cmtUnsub.current = onSnapshot(q, snap => {
                    setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as { id: string; text: string; author: string; ts: number })));
                    setLiveCmts(p => ({ ...p, [reelId]: snap.size }));
                });
            } catch { /* offline */ }
        })();
        return () => { cmtUnsub.current?.(); cmtUnsub.current = null; };
    }, [showComments, reelId]);

    // ── Navigation ────────────────────────────────────────────────────────────
    const goNext = useCallback(() => { setShowCmts(false); setCurrent(c => Math.min(items.length - 1, c + 1)); }, [items.length]);
    const goPrev = useCallback(() => { setShowCmts(false); setCurrent(c => Math.max(0, c - 1)); }, []);
    const handleWheel = useCallback((e: React.WheelEvent) => { if (e.deltaY > 40) goNext(); else if (e.deltaY < -40) goPrev(); }, [goNext, goPrev]);
    const handleTouchStart = useCallback((e: React.TouchEvent) => { dragStartY.current = e.touches[0].clientY; }, []);
    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        const diff = dragStartY.current - e.changedTouches[0].clientY;
        if (diff > 60) goNext(); else if (diff < -60) goPrev();
    }, [goNext, goPrev]);

    // ── Like ──────────────────────────────────────────────────────────────────
    const triggerLike = useCallback(async () => {
        if (liked.has(reelId)) return;
        setLiked(s => { const n = new Set(s); n.add(reelId); return n; });
        setHeartFlash(true);
        setTimeout(() => setHeartFlash(false), 850);
        try {
            const { getFirebaseFirestore } = await import('@/lib/firebase');
            const { doc, setDoc, increment } = await import('firebase/firestore');
            const db = await getFirebaseFirestore();
            await setDoc(doc(db, 'pranaverse_reels', reelId), { likes: increment(1) }, { merge: true });
        } catch { /* offline */ }
    }, [reelId, liked]);

    // ── Double-tap detect ─────────────────────────────────────────────────────
    const handleScreenTap = useCallback(() => {
        const now = Date.now();
        if (now - lastTap.current < 300) triggerLike();
        lastTap.current = now;
    }, [triggerLike]);

    // ── Comment post ──────────────────────────────────────────────────────────
    const postComment = useCallback(async () => {
        if (!commentText.trim() || posting) return;
        setPosting(true);
        const text = commentText.trim();
        setCommentText('');
        try {
            const { getFirebaseFirestore } = await import('@/lib/firebase');
            const { collection, addDoc } = await import('firebase/firestore');
            const db = await getFirebaseFirestore();
            await addDoc(collection(db, 'pranaverse_reels', reelId, 'comments'), { text, author: currentAuthorName, ts: Date.now() });
        } catch { /* offline */ }
        setPosting(false);
    }, [commentText, posting, reelId]);

    // ── Share ─────────────────────────────────────────────────────────────────
    const handleShare = useCallback(async () => {
        const url = `${window.location.origin}/pranaverse/reel/${reelId}`;
        const title = item.type === 'reel' ? item.mantra.sanskrit : item.story.label;
        if (typeof navigator !== 'undefined' && navigator.share) {
            try { await navigator.share({ title: `🕉️ ${title} — ONE SUTRA`, text: 'Sacred wisdom from PranaVerse', url }); } catch { /* dismissed */ }
        } else {
            try { navigator.clipboard.writeText(url); } catch { /* no clipboard */ }
        }
    }, [reelId, item]);

    return (
        <motion.div
            style={{ position: 'fixed', inset: 0, zIndex: 9998, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onWheel={handleWheel} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
            onClick={handleScreenTap}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -80, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.25, 0.8, 0.25, 1] }}
                    style={{ width: '100%', height: '100dvh', position: 'relative', overflow: 'hidden' }}
                >
                    {/* ── Media background ── */}
                    {item.type === 'reel' && item.localVideoSrc ? (
                        <video ref={videoRef} src={item.localVideoSrc}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                            loop muted={muted} playsInline autoPlay />
                    ) : (
                        <img src={item.type === 'reel' ? item.imageUrl : item.story.bg} alt=""
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}

                    {/* ── Premium cinematic gradients ── */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.62) 0%, transparent 32%)', zIndex: 1, pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '42%', background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.32) 60%, transparent 100%)', zIndex: 2, pointerEvents: 'none' }} />

                    {/* ── Top bar ── */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 'max(env(safe-area-inset-top),1rem) 1rem 0.5rem', background: 'linear-gradient(180deg,rgba(0,0,0,0.72) 0%,transparent 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 }}>
                        <span style={{ fontFamily: "'Inter','Outfit',sans-serif", fontSize: '1.1rem', color: 'rgba(167,139,250,0.97)', fontWeight: 800, letterSpacing: '0.04em', filter: 'drop-shadow(0 1px 6px rgba(0,0,0,0.7))' }}>PranaVerse</span>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button onClick={e => { e.stopPropagation(); setMuted(m => !m); }}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.8))' }}>
                                {muted ? (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
                                ) : (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
                                )}
                            </button>
                            <button onClick={e => { e.stopPropagation(); onClose(); }}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.8))' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* ── Content area (bottom-left) ── */}
                    <div style={{ position: 'absolute', left: '1rem', bottom: '6.5rem', maxWidth: '70%', zIndex: 20, display: 'flex', flexDirection: 'column', gap: '0.38rem' }}>
                        {item.type === 'reel' ? (
                            <>
                                <p style={{ fontFamily: "'Cormorant Garamond','Noto Serif Devanagari',serif", fontSize: 'clamp(1.45rem,5.5vw,1.95rem)', fontWeight: 700, color: item.mantra.color, textShadow: `0 0 40px ${item.mantra.color}99, 0 0 80px ${item.mantra.color}44, 0 2px 12px rgba(0,0,0,0.95)`, lineHeight: 1.22, margin: 0, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))' }}>{item.mantra.sanskrit}</p>
                                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 'clamp(0.68rem,2.5vw,0.88rem)', color: 'rgba(255,255,255,0.94)', fontStyle: 'italic', letterSpacing: '0.04em', margin: 0, filter: 'drop-shadow(0 1px 6px rgba(0,0,0,0.95))' }}>{item.mantra.transliteration}</p>
                                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 'clamp(0.55rem,2vw,0.72rem)', color: 'rgba(255,255,255,0.68)', margin: 0, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.95))' }}>{item.mantra.meaning}</p>
                            </>
                        ) : (
                            <>
                                <div style={{ fontSize: '0.62rem', color: item.story.color, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'Inter',sans-serif", textShadow: `0 0 16px ${item.story.color}99`, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.9))' }}>{item.story.sublabel}</div>
                                <p style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 'clamp(1.45rem,6vw,2.1rem)', fontWeight: 700, color: '#fff', textShadow: '0 2px 20px rgba(0,0,0,0.95)', margin: 0, lineHeight: 1.18, filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.7))' }}>{item.story.label}</p>
                                {(item.story as any).mantra && <p style={{ fontFamily: "'Noto Serif Devanagari',serif", fontSize: 'clamp(0.85rem,3vw,1.1rem)', color: `${item.story.color}ee`, textShadow: `0 0 24px ${item.story.color}77`, lineHeight: 1.5, margin: 0, filter: 'drop-shadow(0 1px 6px rgba(0,0,0,0.85))' }}>{(item.story as any).mantra}</p>}
                            </>
                        )}
                    </div>

                    {/* ── Floating Action Bar — Instagram/TikTok glass-encircled icons ── */}
                    <div style={{ position: 'absolute', right: '0.875rem', bottom: '7rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', zIndex: 20 }} onClick={e => e.stopPropagation()}>

                        {/* ❤️ Heart — Instagram style */}
                        <motion.button whileTap={{ scale: 0.82 }} onClick={e => { e.stopPropagation(); triggerLike(); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', padding: 0 }}>
                            <motion.div
                                animate={isLiked ? { scale: [1, 1.35, 0.9, 1.08, 1], rotate: [0, -8, 5, -2, 0] } : { scale: 1, rotate: 0 }}
                                transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
                                style={{
                                    width: 52, height: 52, borderRadius: '50%',
                                    background: isLiked ? 'rgba(237,73,86,0.18)' : 'rgba(255,255,255,0.11)',
                                    backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                                    border: isLiked ? '1.5px solid rgba(237,73,86,0.5)' : '1.5px solid rgba(255,255,255,0.22)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: isLiked
                                        ? '0 4px 22px rgba(237,73,86,0.32), inset 0 1px 0 rgba(255,255,255,0.12)'
                                        : '0 4px 18px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
                                    transition: 'background 0.28s, border-color 0.28s, box-shadow 0.28s',
                                }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24"
                                    fill={isLiked ? '#ed4956' : 'none'}
                                    stroke={isLiked ? '#ed4956' : 'rgba(255,255,255,0.95)'}
                                    strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"
                                    style={{ filter: isLiked ? 'drop-shadow(0 0 6px rgba(237,73,86,0.55))' : 'none', display: 'block' }}>
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                            </motion.div>
                            <span style={{ fontSize: '0.68rem', color: isLiked ? '#ed4956' : 'rgba(255,255,255,0.92)', fontFamily: "'Inter',sans-serif", fontWeight: 700, letterSpacing: '0.01em', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                                {likes > 999 ? `${(likes / 1000).toFixed(1)}K` : likes}
                            </span>
                        </motion.button>

                        {/* 💬 Comment */}
                        <motion.button whileTap={{ scale: 0.82 }} onClick={e => { e.stopPropagation(); setShowCmts(v => !v); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', padding: 0 }}>
                            <motion.div
                                animate={showComments ? { scale: [1, 1.15, 0.95, 1.05, 1] } : { scale: 1 }}
                                transition={{ duration: 0.38 }}
                                style={{
                                    width: 52, height: 52, borderRadius: '50%',
                                    background: showComments ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.11)',
                                    backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                                    border: showComments ? '1.5px solid rgba(167,139,250,0.5)' : '1.5px solid rgba(255,255,255,0.22)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: showComments
                                        ? '0 4px 22px rgba(167,139,250,0.28), inset 0 1px 0 rgba(255,255,255,0.12)'
                                        : '0 4px 18px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
                                    transition: 'background 0.28s, border-color 0.28s, box-shadow 0.28s',
                                }}
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24"
                                    fill="none"
                                    stroke={showComments ? '#a78bfa' : 'rgba(255,255,255,0.95)'}
                                    strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"
                                    style={{ display: 'block' }}>
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                            </motion.div>
                            <span style={{ fontSize: '0.68rem', color: showComments ? '#a78bfa' : 'rgba(255,255,255,0.92)', fontFamily: "'Inter',sans-serif", fontWeight: 700, letterSpacing: '0.01em', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                                {cmtCount}
                            </span>
                        </motion.button>

                        {/* 📤 Share */}
                        <motion.button whileTap={{ scale: 0.82 }} onClick={e => { e.stopPropagation(); handleShare(); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', padding: 0 }}>
                            <div style={{
                                width: 52, height: 52, borderRadius: '50%',
                                background: 'rgba(255,255,255,0.11)',
                                backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                                border: '1.5px solid rgba(255,255,255,0.22)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 18px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
                            }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', transform: 'translateX(1px)' }}>
                                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                            </div>
                            <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.92)', fontFamily: "'Inter',sans-serif", fontWeight: 700, letterSpacing: '0.01em', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Share</span>
                        </motion.button>
                    </div>

                    {/* ── Center heart flash on double-tap ── */}
                    <AnimatePresence>
                        {heartFlash && (
                            <motion.div
                                initial={{ scale: 0.3, opacity: 0.95 }}
                                animate={{ scale: [0.3, 1.5, 1.2], opacity: [0.95, 1, 0] }}
                                transition={{ duration: 0.75, ease: 'easeOut' }}
                                style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 35, pointerEvents: 'none' }}>
                                <svg width="120" height="120" viewBox="0 0 24 24" fill="#ed4956" style={{ filter: 'drop-shadow(0 0 24px rgba(237,73,86,0.72)) drop-shadow(0 0 52px rgba(237,73,86,0.38))' }}>
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── Comment bottom sheet ── */}
                    <AnimatePresence>
                        {showComments && (
                            <motion.div
                                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                                transition={{ type: 'spring', stiffness: 340, damping: 34 }}
                                onClick={e => e.stopPropagation()}
                                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '62%', background: 'rgba(6,6,14,0.93)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', borderTop: '1px solid rgba(139,92,246,0.28)', borderRadius: '22px 22px 0 0', display: 'flex', flexDirection: 'column', zIndex: 40 }}
                            >
                                <div style={{ padding: '0.8rem 1.2rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                                    <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                                        Comments{cmtCount > 0 ? ` (${cmtCount})` : ''}
                                    </span>
                                    <button onClick={() => setShowCmts(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1 }}>×</button>
                                </div>
                                <div style={{ flex: 1, overflowY: 'auto', padding: '0.6rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {comments.length === 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem', opacity: 0.5 }}>
                                            <span style={{ fontSize: '2rem' }}>🕉️</span>
                                            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter',sans-serif", textAlign: 'center' }}>Be the first to share sacred thoughts</p>
                                        </div>
                                    ) : comments.map(c => (
                                        <div key={c.id} style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>🙏</div>
                                            <div>
                                                <div style={{ fontSize: '0.62rem', color: '#a78bfa', fontFamily: "'Inter',sans-serif", fontWeight: 700, marginBottom: '0.15rem' }}>{c.author}</div>
                                                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)', fontFamily: "'Inter',sans-serif", lineHeight: 1.5 }}>{c.text}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ padding: '0.65rem 1rem 1rem', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                                    <input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && postComment()}
                                        placeholder="Add a comment..."
                                        style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 99, padding: '0.55rem 1rem', color: '#fff', fontSize: '0.78rem', fontFamily: "'Inter',sans-serif", outline: 'none' }} />
                                    <motion.button whileTap={{ scale: 0.92 }} onClick={postComment} disabled={!commentText.trim() || posting}
                                        style={{ background: commentText.trim() ? 'linear-gradient(135deg,#8b5cf6,#ec4899)' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 99, padding: '0.55rem 1.1rem', color: '#fff', fontSize: '0.75rem', fontWeight: 700, fontFamily: "'Inter',sans-serif", cursor: commentText.trim() ? 'pointer' : 'default', whiteSpace: 'nowrap' as const }}>
                                        Post
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Swipe hint */}
                    <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            position: 'absolute', bottom: '6%', left: '50%', transform: 'translateX(-50%)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
                            zIndex: 10, pointerEvents: 'none',
                        }}
                    >
                        <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif", letterSpacing: '0.05em' }}>
                            ↑ Swipe for next mantra
                        </span>
                    </motion.div>

                    {/* Index indicator */}
                    <div style={{
                        position: 'absolute', top: '50%', right: '0.35rem',
                        transform: 'translateY(-50%)',
                        display: 'flex', flexDirection: 'column', gap: 3, zIndex: 10,
                    }}>
                        {items.slice(Math.max(0, current - 2), current + 3).map((_, i) => (
                            <div key={i} style={{
                                width: 3, height: i + Math.max(0, current - 2) === current ? 18 : 6,
                                borderRadius: 2,
                                background: i + Math.max(0, current - 2) === current ? '#fff' : 'rgba(255,255,255,0.3)',
                                transition: 'all 0.25s',
                            }} />
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Prev / Next nav buttons (desktop) */}
            <button
                onClick={goPrev}
                style={{
                    position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '50%', width: 44, height: 44,
                    color: '#fff', cursor: 'pointer', fontSize: '1.2rem',
                    display: current === 0 ? 'none' : 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 10,
                }}
            >↑</button>
            <button
                onClick={goNext}
                style={{
                    position: 'absolute', top: '50%', right: 16, transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '50%', width: 44, height: 44,
                    color: '#fff', cursor: 'pointer', fontSize: '1.2rem',
                    display: current === items.length - 1 ? 'none' : 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 10,
                }}
            >↓</button>
        </motion.div>
    );
}

// ════════════════════════════════════════════════════════
//  MAIN PAGE EXPORT (wrapped in Suspense for useSearchParams)
// ════════════════════════════════════════════════════════
import { Suspense } from 'react';

function AuraSpaceInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user: currentUser } = useOneSutraAuth();
    const displayUserName = currentUser?.name || 'Mitra';

    const [activeTab, setActiveTab] = useState<Tab>('story');
    const [isSakhaActive, setIsSakhaActive] = useState(false);
    const [isAwakening, setIsAwakening] = useState(false);
    const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

    const handleBodhiAwaken = () => {
        unlockAudio();
        setIsAwakening(true);
        setTimeout(() => {
            setIsSakhaActive(true);
            setIsAwakening(false);
        }, 900);
    };

    const unlockAudio = () => {
        if (isAudioUnlocked || typeof window === 'undefined') return;
        try {
            const utterance = new SpeechSynthesisUtterance('');
            utterance.volume = 0;
            window.speechSynthesis.speak(utterance);
        } catch (_) { /* noop */ }
        setIsAudioUnlocked(true);
    };

    const [timeSlot] = useState<TimeSlot>(() => getTimeSlot());
    const feedItems = useMemo(() => [
        ...buildMixedFeed(timeSlot),
        ...buildResonanceFeedItems(),
    ], [timeSlot]);

    // We filter out portals so the modal can swipe through all reels + resonance seamlessly
    const swipeableItems = useMemo(
        () => feedItems.filter((f): f is (ReelItem | ResonanceItem) => f.type === 'reel' || f.type === 'resonance'),
        [feedItems]
    );

    const [modalOpen, setModalOpen] = useState(false);
    const [modalStartIdx, setModalStartIdx] = useState(0);
    const [headerVisible, setHeaderVisible] = useState(true);
    const lastScrollY = useRef(0);

    const openReel = useCallback((feedItem: ReelItem | ResonanceItem) => {
        const idx = swipeableItems.findIndex(r => r.id === feedItem.id);
        setModalStartIdx(Math.max(0, idx));
        setModalOpen(true);
    }, [swipeableItems]);

    // Deep-link: auto-open reel from shared URL (?post=reel-id or /reel/id)
    useEffect(() => {
        const postId = searchParams?.get('post') || searchParams?.get('reel');
        if (!postId || swipeableItems.length === 0) return;
        const idx = swipeableItems.findIndex(r => r.id === postId);
        if (idx >= 0) {
            setModalStartIdx(idx);
            setModalOpen(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, swipeableItems.length]);

    // Scroll-hide header
    useEffect(() => {
        const el = document.getElementById('pv-scroll-container');
        if (!el) return;
        const handler = () => {
            const y = el.scrollTop;
            setHeaderVisible(y <= lastScrollY.current || y < 60);
            lastScrollY.current = y;
        };
        el.addEventListener('scroll', handler, { passive: true });
        return () => el.removeEventListener('scroll', handler);
    }, []);

    const timeLabel = { morning: '🌅 Morning Prana', day: '☀️ Midday Prana', evening: '🪔 Sandhya Prana', night: '🌙 Ratri Prana' }[timeSlot];
    const timeColor = { morning: '#fbbf24', day: '#f97316', evening: '#c084fc', night: '#818cf8' }[timeSlot];
    const timeSub = { morning: 'Rise · Align · Radiate', day: 'Focus · Flow · Create', evening: 'Reflect · Restore · Release', night: 'Rest · Dream · Dissolve' }[timeSlot];

    return (
        <>
            {/* Google fonts */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: #000; }
        #pv-scroll-container::-webkit-scrollbar { display: none; }
        @keyframes pranaFloat { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-5px);} }
        @keyframes portalGlow { 0%,100%{opacity:0.6;} 50%{opacity:1;} }
        @keyframes textShimmer {
          0%{background-position:-200% center}
          100%{background-position:200% center}
        }
        .pv-header-fade-in { animation: pvHeaderIn 0.3s ease forwards; }
        .pv-header-fade-out { animation: pvHeaderOut 0.3s ease forwards; }
        @keyframes pvHeaderIn { from{transform:translateY(-100%);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes pvHeaderOut { from{transform:translateY(0);opacity:1} to{transform:translateY(-100%);opacity:0} }
      `}</style>

            <div style={{
                position: 'fixed', inset: 0,
                display: 'flex', flexDirection: 'column',
                background: '#000',
                fontFamily: "'Inter', sans-serif",
                overflow: 'hidden',
            }}>
                {/* ══ FLOATING HEADER ══ */}
                <motion.div
                    animate={{ y: headerVisible ? 0 : -100, opacity: headerVisible ? 1 : 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    style={{
                        position: 'absolute', top: 0, left: 0, right: 0,
                        zIndex: 50,
                        padding: '0.6rem 1rem 0.4rem',
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 80%, transparent 100%)',
                        backdropFilter: 'blur(16px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Link href="/" style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.14)',
                            color: 'rgba(255,255,255,0.8)',
                            textDecoration: 'none', fontSize: '1rem',
                        }}>←</Link>
                        <div>
                            <div style={{
                                fontFamily: "'Inter', 'Outfit', sans-serif",
                                fontSize: '1.15rem', fontWeight: 800,
                                background: 'linear-gradient(90deg, #c4b5fd, #a78bfa, #818cf8, #c4b5fd)',
                                backgroundSize: '200% auto',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                animation: 'textShimmer 4s linear infinite',
                                letterSpacing: '0.02em',
                            }}>PranaVerse</div>
                            <div style={{ fontSize: '0.45rem', color: 'rgba(167,139,250,0.65)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                                ⚡ Energy Circle
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['🔥', '〰️', '🔔'].map((icon, i) => (
                            <button key={i} style={{
                                background: 'rgba(255,255,255,0.07)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '50%', width: 32, height: 32,
                                cursor: 'pointer', fontSize: '0.85rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>{icon}</button>
                        ))}
                    </div>
                </motion.div>

                {/* ══ CONDITIONAL CONTENT BY TAB ══ */}
                <AnimatePresence mode="wait">
                    {activeTab === 'story' && (
                        <motion.div
                            key="story-feed"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            id="pv-scroll-container"
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                scrollbarWidth: 'none',
                                paddingTop: '3.5rem', // header clearance
                            }}
                        >
                            {/* ── STORY BAR ── */}
                            <HomeStoryBar />

                            {/* ── MORNING PRANA BANNER ── */}
                            <div style={{
                                margin: '0.55rem 1rem 0.2rem',
                                borderRadius: 16,
                                background: `linear-gradient(120deg, ${timeColor}12 0%, rgba(0,0,0,0) 60%)`,
                                border: `1px solid ${timeColor}28`,
                                padding: '0.55rem 0.9rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                backdropFilter: 'blur(12px)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{
                                        width: 6, height: 6, borderRadius: '50%',
                                        background: timeColor,
                                        boxShadow: `0 0 8px ${timeColor}`,
                                        flexShrink: 0,
                                        animation: 'pranaFloat 2s ease-in-out infinite',
                                    }} />
                                    <div>
                                        <div style={{
                                            fontSize: '0.62rem', fontWeight: 800, color: timeColor,
                                            letterSpacing: '0.08em', textTransform: 'uppercase',
                                            fontFamily: "'Outfit', sans-serif",
                                            textShadow: `0 0 12px ${timeColor}60`,
                                        }}>{timeLabel}</div>
                                        <div style={{
                                            fontSize: '0.40rem', color: `${timeColor}80`,
                                            letterSpacing: '0.10em', textTransform: 'uppercase',
                                            fontFamily: "'Inter', sans-serif", marginTop: 1,
                                        }}>{timeSub}</div>
                                    </div>
                                </div>
                                <div style={{
                                    fontSize: '0.38rem', fontWeight: 700,
                                    color: `${timeColor}60`, letterSpacing: '0.1em',
                                    textTransform: 'uppercase', fontFamily: "'Inter', sans-serif",
                                    background: `${timeColor}10`, border: `1px solid ${timeColor}22`,
                                    borderRadius: 99, padding: '0.18rem 0.55rem',
                                }}>LIVE ✦</div>
                            </div>

                            {/* ── SECTION LABEL ── */}
                            <div style={{
                                padding: '0.5rem 1rem 0.3rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}>
                                <span style={{
                                    fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em',
                                    color: 'rgba(251,191,36,0.7)', textTransform: 'uppercase',
                                }}>
                                    ✦ Energy Feeds — Reels & Portals
                                </span>
                                <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)' }}>{feedItems.length} items</span>
                            </div>

                            {/* ── SHORTS-STYLE GRID ── */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '1px',
                                width: '100%',
                                padding: 0,
                            }}>
                                {/* ── GAYATRI MANTRA HERO — full-width first card ── */}
                                <GayatriHeroCard onClick={() => {
                                    const gayatriItem = swipeableItems.find(i => i.type === 'resonance' && (i as ResonanceItem).story.id === 'gayatri');
                                    if (gayatriItem) openReel(gayatriItem as ResonanceItem);
                                }} />
                                {feedItems.map((item) =>
                                    item.type === 'reel' ? (
                                        <ReelGridCard
                                            key={item.id}
                                            item={item}
                                            onClick={() => openReel(item)}
                                        />
                                    ) : item.type === 'resonance' ? (
                                        <ResonanceReelCard
                                            key={item.id}
                                            item={item}
                                            onClick={() => openReel(item)}
                                        />
                                    ) : (
                                        <PortalGridCard key={item.id} item={item} />
                                    )
                                )}
                            </div>

                            {/* Bottom padding for nav bar */}
                            <div style={{ height: '5rem' }} />
                        </motion.div>
                    )}

                    {activeTab === 'map' && (
                        <motion.div key="map-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <DharmaMap />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ══ RESONANCE NAV BAR ══ */}
                <ResonanceNavBar activeTab={activeTab} setActiveTab={(tab) => { if (tab === 'chat') { router.push('/pranaverse-chat'); } else if (tab === 'home') { router.push('/'); } else { setActiveTab(tab); } }} badgeCount={0} />

                {/* ══ FLOATING SAKHA BODHI — Elegant Cosmic Companion ══ */}
                <AnimatePresence>
                    {!isSakhaActive && (
                        <motion.div
                            key="pv-sakha-trigger"
                            style={{ position: 'fixed', bottom: 88, right: 20, zIndex: 1100 }}
                            initial={{ opacity: 0, scale: 0.3, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.2, y: 20 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.6 }}
                        >
                            {/* Label */}
                            <motion.span
                                animate={{ opacity: [0.6, 1, 0.6] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                style={{
                                    position: 'absolute', bottom: '108%', left: '50%',
                                    transform: 'translateX(-50%)', marginBottom: 4,
                                    fontSize: 8, fontWeight: 800, letterSpacing: '0.18em',
                                    textTransform: 'uppercase',
                                    background: 'linear-gradient(90deg, #22d3ee, #a78bfa, #22d3ee)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontFamily: 'system-ui, sans-serif', whiteSpace: 'nowrap',
                                    pointerEvents: 'none',
                                    filter: 'drop-shadow(0 1px 4px rgba(34,211,238,0.55))',
                                }}>Sakha Bodhi</motion.span>

                            {/* Outer cosmic radiation */}
                            <motion.div
                                animate={{ scale: [1, 1.32, 1], opacity: [0.28, 0.10, 0.28] }}
                                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                                style={{
                                    position: 'absolute', inset: -20,
                                    borderRadius: '50%',
                                    background: 'radial-gradient(circle, rgba(34,211,238,0.38) 0%, rgba(139,92,246,0.20) 50%, transparent 78%)',
                                    filter: 'blur(12px)',
                                    pointerEvents: 'none',
                                }}
                            />

                            {/* Mid rotating sacred geometry ring */}
                            <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                                style={{
                                    position: 'absolute', inset: -7,
                                    borderRadius: '50%',
                                    border: '1px dashed rgba(251,191,36,0.5)',
                                    pointerEvents: 'none',
                                }}
                            />

                            {/* Inner soft violet-teal aura */}
                            <motion.div
                                animate={{ scale: [1, 1.10, 1], opacity: [0.7, 0.28, 0.7] }}
                                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                                style={{
                                    position: 'absolute', inset: -4,
                                    borderRadius: '50%',
                                    background: 'radial-gradient(circle, rgba(139,92,246,0.30) 0%, rgba(34,211,238,0.22) 60%, transparent 85%)',
                                    filter: 'blur(5px)',
                                    pointerEvents: 'none',
                                }}
                            />

                            {/* Three orbiting energy particles */}
                            {([0, 120, 240] as number[]).map((deg, i) => (
                                <motion.div
                                    key={i}
                                    animate={{ rotate: [deg, deg + 360] }}
                                    transition={{ duration: 5 + i * 0.7, repeat: Infinity, ease: 'linear' }}
                                    style={{ position: 'absolute', inset: -14, borderRadius: '50%', pointerEvents: 'none' }}
                                >
                                    <div style={{
                                        position: 'absolute', top: '50%', left: '50%',
                                        width: 4, height: 4, borderRadius: '50%',
                                        background: i === 0 ? '#fbbf24' : i === 1 ? '#22d3ee' : '#a78bfa',
                                        boxShadow: `0 0 7px ${i === 0 ? '#fbbf24' : i === 1 ? '#22d3ee' : '#a78bfa'}`,
                                        transform: 'translate(-50%, -50%) translateX(34px)',
                                    }} />
                                </motion.div>
                            ))}

                            {/* Core button — Sakha Bodhi as meditating cosmic figure */}
                            <motion.button
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
                                onClick={() => handleBodhiAwaken()}
                                aria-label="Awaken Sakha Bodhi"
                                title="Awaken Sakha Bodhi — Your Cosmic Companion"
                                style={{
                                    width: 62, height: 62,
                                    borderRadius: '50%',
                                    border: '1.5px solid rgba(34,211,238,0.52)',
                                    background: 'radial-gradient(circle at 38% 30%, rgba(120,200,255,0.22) 0%, rgba(18,28,95,0.92) 45%, rgba(4,7,38,0.97) 100%)',
                                    boxShadow: '0 0 0 1px rgba(34,211,238,0.18), 0 6px 28px rgba(14,116,144,0.55), 0 0 48px rgba(34,211,238,0.20), inset 0 1px 0 rgba(255,255,255,0.18)',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    backdropFilter: 'blur(8px)',
                                    WebkitBackdropFilter: 'blur(8px)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Burst rings on awakening */}
                                {isAwakening && [0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ scale: 0.6, opacity: 0.9 }}
                                        animate={{ scale: 2.6 + i * 0.8, opacity: 0 }}
                                        transition={{ duration: 0.7 + i * 0.15, ease: 'easeOut', delay: i * 0.10 }}
                                        style={{
                                            position: 'absolute', inset: 0,
                                            borderRadius: '50%',
                                            border: `${2 - i * 0.4}px solid ${i === 0 ? '#fbbf24' : i === 1 ? '#22d3ee' : '#a78bfa'}`,
                                            pointerEvents: 'none',
                                        }}
                                    />
                                ))}
                                {/* Inner radiance pulse */}
                                <motion.div
                                    animate={isAwakening
                                        ? { opacity: [0.3, 1, 0.8], scale: [0.7, 1.4, 1.2] }
                                        : { opacity: [0.3, 0.6, 0.3], scale: [0.7, 1.1, 0.7] }
                                    }
                                    transition={isAwakening
                                        ? { duration: 0.8, ease: 'easeOut' }
                                        : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
                                    }
                                    style={{
                                        position: 'absolute', inset: 0, borderRadius: '50%',
                                        background: isAwakening
                                            ? 'radial-gradient(circle at center, rgba(251,191,36,0.8) 0%, rgba(34,211,238,0.4) 55%, transparent 80%)'
                                            : 'radial-gradient(circle at center, rgba(139,92,246,0.45) 0%, rgba(34,211,238,0.18) 55%, transparent 80%)',
                                        pointerEvents: 'none',
                                    }}
                                />
                                {/* Meditating Sakha Bodhi — eyes closed (calm) or open (awakening) */}
                                <svg width="38" height="42" viewBox="0 0 40 44" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'relative', zIndex: 2 }}>
                                    {/* Divine halo — blazing on awakening */}
                                    <circle cx="20" cy="12" r="9.5" fill={isAwakening ? 'rgba(255,215,0,0.25)' : 'rgba(255,215,0,0.07)'} />
                                    <circle cx="20" cy="12" r="7.5" fill="none" stroke={isAwakening ? 'rgba(255,215,0,0.9)' : 'rgba(255,215,0,0.38)'} strokeWidth={isAwakening ? '1.2' : '0.7'} strokeDasharray={isAwakening ? '3 1' : '2.5 1.5'} />
                                    {/* Head */}
                                    <circle cx="20" cy="12" r="5" fill={isAwakening ? 'rgba(255,255,255,1)' : 'rgba(220,245,255,0.95)'} />
                                    {/* Eyes — closed when calm, open and luminous when awakening */}
                                    {isAwakening ? (
                                        <>
                                            {/* Open eyes — radiant */}
                                            <ellipse cx="18" cy="11.8" rx="1.3" ry="1.1" fill="#0f172a" />
                                            <circle cx="18" cy="11.8" r="0.5" fill="#22d3ee" />
                                            <ellipse cx="22" cy="11.8" rx="1.3" ry="1.1" fill="#0f172a" />
                                            <circle cx="22" cy="11.8" r="0.5" fill="#22d3ee" />
                                            {/* Third-eye blazing */}
                                            <ellipse cx="20" cy="10.2" rx="1.8" ry="1.1" fill="#FFD700" opacity="0.95" />
                                            <circle cx="20" cy="10.2" r="0.7" fill="#fff" />
                                        </>
                                    ) : (
                                        <>
                                            {/* Closed eyes — meditative */}
                                            <path d="M17 12 Q18 11 19 12" stroke="rgba(80,120,160,0.7)" strokeWidth="0.7" fill="none" strokeLinecap="round" />
                                            <path d="M21 12 Q22 11 23 12" stroke="rgba(80,120,160,0.7)" strokeWidth="0.7" fill="none" strokeLinecap="round" />
                                            {/* Ajna — third eye chakra */}
                                            <ellipse cx="20" cy="10.8" rx="1.5" ry="0.9" fill="#FFD700" />
                                            <circle cx="20" cy="10.8" r="0.55" fill="rgba(255,255,255,0.95)" />
                                        </>
                                    )}
                                    {/* Neck */}
                                    <rect x="17.8" y="17" width="4.4" height="2.8" rx="1.5" fill="rgba(210,240,255,0.88)" />
                                    {/* Torso */}
                                    <path d="M 14 30 L 15.5 20 Q 20 18.5 24.5 20 L 26 30 Z" fill={isAwakening ? 'rgba(220,245,255,1)' : 'rgba(190,230,255,0.88)'} />
                                    {/* Arms */}
                                    <path d="M 15.5 24 Q 12 26.5 11 30" stroke="rgba(190,230,255,0.88)" strokeWidth="2.8" strokeLinecap="round" fill="none" />
                                    <circle cx="11" cy="30" r="2.3" fill="rgba(190,230,255,0.78)" />
                                    <path d="M 24.5 24 Q 28 26.5 29 30" stroke="rgba(190,230,255,0.88)" strokeWidth="2.8" strokeLinecap="round" fill="none" />
                                    <circle cx="29" cy="30" r="2.3" fill="rgba(190,230,255,0.78)" />
                                    {/* Lotus legs */}
                                    <path d="M 7 37 Q 13 32.5 20 33.5 Q 27 32.5 33 37 Q 30 41.5 20 42 Q 10 41.5 7 37 Z" fill="rgba(170,220,255,0.82)" />
                                    {/* Sushumna nadi */}
                                    <line x1="20" y1="19.5" x2="20" y2="30" stroke={isAwakening ? 'rgba(251,191,36,0.9)' : 'rgba(100,220,255,0.45)'} strokeWidth={isAwakening ? '1.2' : '0.7'} />
                                    {/* Anahata */}
                                    <circle cx="20" cy="23.5" r="1.1" fill={isAwakening ? '#fbbf24' : 'rgba(100,220,255,0.9)'} />
                                    {/* Sahasrara — crown */}
                                    <circle cx="20" cy="7" r={isAwakening ? '2.5' : '1.8'} fill={isAwakening ? 'rgba(251,191,36,0.9)' : 'rgba(167,139,250,0.55)'} />
                                </svg>
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ══ SAKHA BODHI ORB OVERLAY ══ */}
                <AnimatePresence>
                    {isSakhaActive && (
                        <SakhaBodhiOrb
                            key="pv-sakha-orb"
                            userName={currentUser?.name || 'Mitra'}
                            userId={null}
                            sankalpaItems={[]}
                            onSankalpaUpdate={() => { }}
                            onDismiss={() => setIsSakhaActive(false)}
                        />
                    )}
                </AnimatePresence>

                {/* ══ FULLSCREEN REEL MODAL ══ */}
                <AnimatePresence>
                    {modalOpen && (
                        <FullscreenReelModal
                            items={swipeableItems}
                            initialIndex={modalStartIdx}
                            onClose={() => setModalOpen(false)}
                            authorName={displayUserName}
                        />
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}

export default function PranaversePage() {
    return (
        <Suspense fallback={<div style={{ background: '#000', minHeight: '100dvh' }} />}>
            <AuraSpaceInner />
        </Suspense>
    );
}
