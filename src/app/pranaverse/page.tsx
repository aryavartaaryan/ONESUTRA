'use client';

import React, {
    useState,
    useRef,
    useEffect,
    useCallback,
    useMemo,
} from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import HomeStoryBar from '@/components/PranaVerse/HomeStoryBar';
import { useOneSutraAuth } from '@/hooks/useOneSutraAuth';
import { useUsers, SutraUser } from '@/hooks/useUsers';
import { Tab, FriendDoc, FriendStatus } from '@/components/Resonance/ResonanceTypes';
import FriendCard from '@/components/Resonance/FriendCard';
import SakhaBodhiCard from '@/components/Resonance/SakhaBodhiCard';
import InlineChat from '@/components/Resonance/InlineChat';
import DharmaMap from '@/components/Resonance/DharmaMap';
import ResonanceNavBar from '@/components/Resonance/ResonanceNavBar';
import { Search, Bell } from 'lucide-react';

// ════════════════════════════════════════════════════════
//  SACRED PORTAL DATA  (from Home / SacredPortalGrid)
// ════════════════════════════════════════════════════════
const SACRED_PORTALS = [
    { id: 'acharya', title: 'ACHARYA', subtitle: 'Awaken Guidance', icon: '🌿', color: '#a855f7', href: '/acharya-samvad' },
    { id: 'dhyan', title: 'MEDITATE', subtitle: 'Sacred Mantras', icon: '🧘', color: '#3b82f6', href: '/dhyan-kshetra' },
    { id: 'outplugs', title: 'INSHORTS', subtitle: 'Mindful News', icon: '📰', color: '#d946ef', href: '/outplugs' },
    { id: 'raag', title: 'RAAG MUSIC', subtitle: 'Resonances', icon: '🎵', color: '#38bdf8', href: '/project-leela' },
    { id: 'resonance', title: 'RESONANCE', subtitle: 'Sacred Circle', icon: '🌐', color: '#8b5cf6', href: '/resonance' },
    { id: 'rituals', title: 'RITUALS', subtitle: 'Sacred Practices', icon: '🛕', color: '#6366f1', href: '/vedic-sangrah' },
    { id: 'games', title: 'GAMES', subtitle: 'Mindful Play', icon: '🎲', color: '#ec4899', href: '/vedic-games' },
    { id: 'bodhi', title: 'SAKHA', subtitle: 'AI Companion', icon: '✨', color: '#14b8a6', href: '/bodhi-chat' },
    { id: 'journal', title: 'JOURNAL', subtitle: 'Sacred Diary', icon: '📓', color: '#f97316', href: '/journal' },
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
    { id: 's2', label: 'Bodhi', icon: '✨', color: '#14b8a6', gradient: 'linear-gradient(135deg,#0d9488,#0f766e)' },
    { id: 's3', label: 'Mantras', icon: '🪔', color: '#c084fc', gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)' },
    { id: 's4', label: 'Nature', icon: '🌿', color: '#4ade80', gradient: 'linear-gradient(135deg,#22c55e,#16a34a)' },
    { id: 's5', label: 'Cosmos', icon: '🌙', color: '#818cf8', gradient: 'linear-gradient(135deg,#6366f1,#4f46e5)' },
    { id: 's6', label: 'Rituals', icon: '🛕', color: '#fb923c', gradient: 'linear-gradient(135deg,#f97316,#ea580c)' },
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
    { id: 'acharya', label: 'Acharya', sublabel: 'Free Consult', color: '#4ade80', emoji: '\u{1F33F}', bg: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=1067&fit=crop&q=80' },
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

            {/* Bottom action strip — ❤️ and 😍 only */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '0.4rem 0.7rem 0.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                {/* Heart */}
                <button onClick={handleLike} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem' }}>
                    <motion.span animate={liked ? { scale: [1.4, 1] } : {}} style={{ fontSize: '1rem', filter: liked ? 'drop-shadow(0 0 6px rgba(255,100,100,0.8))' : 'none' }}>
                        {liked ? '❤️' : '🤍'}
                    </motion.span>
                    <span style={{ fontSize: '0.4rem', color: 'rgba(255,255,255,0.65)', fontFamily: "'Inter', sans-serif" }}>
                        {likeCount > 999 ? `${(likeCount / 1000).toFixed(1)}K` : likeCount}
                    </span>
                </button>

                {/* Play icon center indicator */}
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.6rem', marginLeft: 2 }}>▶</span>
                </div>

                {/* Love / 😍 */}
                <button onClick={handleLove} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem' }}>
                    <motion.span animate={loved ? { scale: [1.4, 1] } : {}} style={{ fontSize: '1rem', filter: loved ? 'drop-shadow(0 0 6px rgba(251,191,36,0.9))' : 'none' }}>
                        {loved ? '😍' : '🤩'}
                    </motion.span>
                    <span style={{ fontSize: '0.4rem', color: 'rgba(255,255,255,0.65)', fontFamily: "'Inter', sans-serif" }}>
                        {loveCount > 999 ? `${(loveCount / 1000).toFixed(1)}K` : loveCount}
                    </span>
                </button>
            </div>
        </motion.div>
    );
}

// ════════════════════════════════════════════════════════
//  PORTAL GRID CARD
// ════════════════════════════════════════════════════════
function PortalGridCard({ item }: { item: PortalItem }) {
    const [hovered, setHovered] = useState(false);

    return (
        <Link href={item.portal.href} style={{ textDecoration: 'none', display: 'block' }}>
            <motion.div
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => setHovered(false)}
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
                {/* Background image */}
                <img
                    src={item.imageUrl}
                    alt={item.portal.title}
                    loading="lazy"
                    style={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%',
                        objectFit: 'cover',
                        filter: 'brightness(0.45) saturate(0.7)',
                    }}
                />

                {/* Portal color tint overlay */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: `linear-gradient(to top, ${item.portal.color}88 0%, ${item.portal.color}22 50%, transparent 100%)`,
                }} />

                {/* Top portal tag */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    padding: '0.5rem 0.6rem 0.3rem',
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{
                        fontSize: '0.42rem', fontWeight: 700, color: item.portal.color,
                        letterSpacing: '0.14em', textTransform: 'uppercase',
                        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
                        padding: '0.18rem 0.5rem', borderRadius: 99,
                        border: `1px solid ${item.portal.color}44`,
                        fontFamily: "'Inter', sans-serif",
                    }}>✦ Sacred Portal</div>
                </div>

                {/* Center: icon + portal glow */}
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: '0.5rem',
                }}>
                    {/* Glowing orb */}
                    <motion.div
                        animate={{ scale: hovered ? [1, 1.15, 1] : [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            width: 56, height: 56,
                            borderRadius: '50%',
                            background: `radial-gradient(circle at 38% 32%, rgba(255,255,255,0.4) 0%, ${item.portal.color}88 50%, ${item.portal.color}44 100%)`,
                            backdropFilter: 'blur(12px)',
                            border: `1.5px solid ${item.portal.color}66`,
                            boxShadow: `0 0 30px ${item.portal.color}66, 0 0 60px ${item.portal.color}22`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.6rem',
                        }}
                    >{item.portal.icon}</motion.div>
                </div>

                {/* Bottom: portal name + CTA */}
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '0.7rem 0.6rem 0.65rem',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
                }}>
                    <span style={{
                        fontSize: 'clamp(0.65rem, 2vw, 0.8rem)',
                        fontWeight: 800, letterSpacing: '0.1em',
                        color: item.portal.color,
                        textShadow: `0 0 16px ${item.portal.color}88`,
                        textTransform: 'uppercase',
                        fontFamily: "'Inter', sans-serif",
                    }}>{item.portal.title}</span>
                    <span style={{
                        fontSize: 'clamp(0.42rem, 1.4vw, 0.52rem)',
                        color: 'rgba(255,255,255,0.6)',
                        letterSpacing: '0.04em',
                        fontFamily: "'Inter', sans-serif",
                    }}>{item.portal.subtitle}</span>
                    {/* Enter Portal CTA */}
                    <motion.div
                        animate={hovered ? { scale: 1.06 } : { scale: 1 }}
                        style={{
                            marginTop: '0.2rem',
                            padding: '0.22rem 0.7rem',
                            borderRadius: 99,
                            background: `linear-gradient(135deg, ${item.portal.color}cc, ${item.portal.color})`,
                            color: '#fff',
                            fontSize: '0.42rem',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            fontFamily: "'Inter', sans-serif",
                            boxShadow: `0 4px 14px ${item.portal.color}55`,
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

                {/* Action row — ❤️ and 😍 only */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginTop: '0.4rem',
                }}>
                    <button
                        onClick={e => { e.stopPropagation(); setLiked(l => !l); setLikeCount(c => liked ? c - 1 : c + 1); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                    >
                        <span style={{ fontSize: '0.9rem' }}>{liked ? '❤️' : '🤍'}</span>
                        <span style={{ fontSize: '0.4rem', color: 'rgba(255,255,255,0.6)', fontFamily: "'Inter', sans-serif" }}>
                            {likeCount > 999 ? `${(likeCount / 1000).toFixed(1)}K` : likeCount}
                        </span>
                    </button>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '0.55rem', marginLeft: 2 }}>▶</span>
                    </div>
                    <button
                        onClick={e => { e.stopPropagation(); setLoved((l: boolean) => !l); setLoveCount((c: number) => loved ? c - 1 : c + 1); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                    >
                        <span style={{ fontSize: '0.9rem' }}>{loved ? '😍' : '🤩'}</span>
                        <span style={{ fontSize: '0.4rem', color: 'rgba(255,255,255,0.6)', fontFamily: "'Inter', sans-serif" }}>
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
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>{liked ? '❤️' : '🤍'}</span>
                    <span style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.7)', fontFamily: "'Inter', sans-serif" }}>
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
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>{loved ? '😍' : '🤩'}</span>
                    <span style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.7)', fontFamily: "'Inter', sans-serif" }}>
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
}: {
    items: (ReelItem | ResonanceItem)[];
    initialIndex: number;
    onClose: () => void;
}) {
    const [current, setCurrent] = useState(initialIndex);
    const [liked, setLiked] = useState<Set<number>>(new Set());
    const [saved, setSaved] = useState<Set<number>>(new Set());
    const [muted, setMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const dragY = useMotionValue(0);
    const opacity = useTransform(dragY, [-200, 0, 200], [0, 1, 0]);
    const dragStartY = useRef(0);

    const item = items[current];

    // ESC key close
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    // Arrow key navigation
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp') setCurrent(c => Math.max(0, c - 1));
            if (e.key === 'ArrowDown') setCurrent(c => Math.min(items.length - 1, c + 1));
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [items.length]);

    // Auto play video
    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        v.muted = muted;
        v.play().catch(() => { });
        return () => { try { v.pause(); } catch { } };
    }, [current, muted]);

    const goNext = useCallback(() => setCurrent(c => Math.min(items.length - 1, c + 1)), [items.length]);
    const goPrev = useCallback(() => setCurrent(c => Math.max(0, c - 1)), []);

    // Wheel / touch swipe to navigate
    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (e.deltaY > 40) goNext();
        else if (e.deltaY < -40) goPrev();
    }, [goNext, goPrev]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        dragStartY.current = e.touches[0].clientY;
    }, []);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        const diff = dragStartY.current - e.changedTouches[0].clientY;
        if (diff > 60) goNext();
        else if (diff < -60) goPrev();
    }, [goNext, goPrev]);

    const toggleLike = () => setLiked(s => { const n = new Set(s); n.has(current) ? n.delete(current) : n.add(current); return n; });
    const toggleSave = () => setSaved(s => { const n = new Set(s); n.has(current) ? n.delete(current) : n.add(current); return n; });

    // Prevent background scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        <motion.div
            ref={containerRef}
            style={{
                position: 'fixed', inset: 0, zIndex: 9998,
                background: '#000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -80, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.25, 0.8, 0.25, 1] }}
                    style={{
                        width: '100%', height: '100%',
                        maxWidth: 420, position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Video or Image background */}
                    {item.type === 'reel' && item.localVideoSrc ? (
                        <video
                            ref={videoRef}
                            src={item.localVideoSrc}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                            loop muted={muted} playsInline autoPlay
                        />
                    ) : (
                        <img
                            src={item.type === 'reel' ? item.imageUrl : item.story.bg}
                            alt=""
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    )}

                    {/* Gradient */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.1) 100%)',
                    }} />

                    {/* Top bar */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0,
                        padding: '1rem 1rem 0.5rem',
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        zIndex: 10,
                    }}>
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem', color: 'rgba(251,191,36,0.95)', fontWeight: 600 }}>
                            PranaVerse
                        </span>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => setMuted(m => !m)} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 36, height: 36, color: '#fff', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {muted ? '🔇' : '🔊'}
                            </button>
                            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 36, height: 36, color: '#fff', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                ×
                            </button>
                        </div>
                    </div>

                    {/* Mantra center */}
                    <div style={{
                        position: 'absolute', bottom: '18%', left: '1rem', right: '4rem',
                        zIndex: 10,
                    }}>
                        {item.type === 'reel' ? (
                            <>
                                <p style={{
                                    fontFamily: "'Cormorant Garamond', 'Noto Serif Devanagari', serif",
                                    fontSize: 'clamp(1.3rem, 5vw, 1.75rem)',
                                    fontWeight: 600,
                                    color: item.mantra.color,
                                    textShadow: `0 0 30px ${item.mantra.color}88`,
                                    marginBottom: '0.4rem',
                                    lineHeight: 1.3,
                                }}>{item.mantra.sanskrit}</p>
                                <p style={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: 'clamp(0.65rem, 2.5vw, 0.85rem)',
                                    color: 'rgba(255,255,255,0.8)',
                                    fontStyle: 'italic',
                                    letterSpacing: '0.04em',
                                }}>{item.mantra.transliteration}</p>
                                <p style={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: 'clamp(0.55rem, 2vw, 0.72rem)',
                                    color: 'rgba(255,255,255,0.55)',
                                    marginTop: '0.2rem',
                                }}>{item.mantra.meaning}</p>
                            </>
                        ) : (
                            <>
                                <div style={{
                                    fontSize: '0.65rem', color: item.story.color, fontWeight: 800,
                                    letterSpacing: '0.12em', textTransform: 'uppercase',
                                    marginBottom: '0.4rem',
                                    fontFamily: "'Inter', sans-serif",
                                    textShadow: `0 0 12px ${item.story.color}88`,
                                }}>{item.story.sublabel}</div>
                                <p style={{
                                    fontFamily: "'Playfair Display', Georgia, serif",
                                    fontSize: 'clamp(1.4rem, 6vw, 2rem)',
                                    fontWeight: 700,
                                    color: '#fff',
                                    textShadow: '0 2px 16px rgba(0,0,0,0.8)',
                                    marginBottom: (item.story as any).mantra ? '0.5rem' : '0',
                                    lineHeight: 1.2,
                                }}>{item.story.label}</p>
                                {(item.story as any).mantra && (
                                    <p style={{
                                        fontFamily: "'Noto Serif Devanagari', serif",
                                        fontSize: 'clamp(0.85rem, 3vw, 1.1rem)',
                                        color: `${item.story.color}cc`,
                                        textShadow: `0 0 20px ${item.story.color}66`,
                                        lineHeight: 1.5,
                                    }}>{(item.story as any).mantra}</p>
                                )}
                            </>
                        )}
                    </div>

                    {/* Right action sidebar — glassmorphism */}
                    <div style={{
                        position: 'absolute', right: '0.75rem', bottom: '15%',
                        display: 'flex', flexDirection: 'column', gap: '1.25rem',
                        alignItems: 'center', zIndex: 10,
                    }}>
                        {[
                            { icon: liked.has(current) ? '❤️' : '🤍', label: item.likes.toLocaleString(), action: toggleLike },
                            { icon: '💬', label: 'Comment', action: () => { } },
                            { icon: saved.has(current) ? '🔖' : '📌', label: 'Save', action: toggleSave },
                            { icon: '↗️', label: 'Share', action: () => { } },
                        ].map((btn, i) => (
                            <motion.button
                                key={i}
                                whileTap={{ scale: 0.85 }}
                                onClick={btn.action}
                                style={{
                                    background: 'rgba(0,0,0,0.45)',
                                    backdropFilter: 'blur(16px)',
                                    WebkitBackdropFilter: 'blur(16px)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: 16,
                                    width: 46, height: 46,
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer',
                                    gap: 2,
                                }}
                            >
                                <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{btn.icon}</span>
                                <span style={{ fontSize: '0.38rem', color: 'rgba(255,255,255,0.65)', fontFamily: "'Inter', sans-serif" }}>
                                    {i === 0 ? (liked.has(current) ? '❤️' : item.likes.toLocaleString()) : btn.label}
                                </span>
                            </motion.button>
                        ))}
                    </div>

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
//  MAIN PAGE EXPORT
// ════════════════════════════════════════════════════════

const CHAT_BGS = {
    // Beautiful, atmospheric nature backgrounds for chat tab
    morning: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1080&q=80',
    day: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1080&q=80',
    evening: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1080&q=80',
    night: 'https://images.unsplash.com/photo-1532978379173-523e16f371f2?w=1080&q=80',
};

export default function PranaversePage() {
    const router = useRouter();
    const { user: currentUser } = useOneSutraAuth();
    const { users } = useUsers(currentUser?.uid);

    const [activeTab, setActiveTab] = useState<Tab>('story');
    const [friendDocs, setFriendDocs] = useState<FriendDoc[]>([]);

    useEffect(() => {
        if (!currentUser?.uid) return;
        const uid = currentUser.uid;
        let unsub1: (() => void) | null = null;
        let unsub2: (() => void) | null = null;
        const fromDocs = new Map<string, FriendDoc>();
        const toDocs = new Map<string, FriendDoc>();
        const merge = () => setFriendDocs([...fromDocs.values(), ...toDocs.values()]);
        (async () => {
            try {
                const { getFirebaseFirestore } = await import('@/lib/firebase');
                const { collection, query, where, onSnapshot } = await import('firebase/firestore');
                const db = await getFirebaseFirestore();
                unsub1 = onSnapshot(query(collection(db, 'resonance_friends'), where('fromUid', '==', uid)), snap => {
                    fromDocs.clear();
                    snap.docs.forEach(d => fromDocs.set(d.id, { id: d.id, ...(d.data() as Omit<FriendDoc, 'id'>) }));
                    merge();
                });
                unsub2 = onSnapshot(query(collection(db, 'resonance_friends'), where('toUid', '==', uid)), snap => {
                    toDocs.clear();
                    snap.docs.forEach(d => toDocs.set(d.id, { id: d.id, ...(d.data() as Omit<FriendDoc, 'id'>) }));
                    merge();
                });
            } catch { /* offline */ }
        })();
        return () => { unsub1?.(); unsub2?.(); };
    }, [currentUser?.uid]);

    const sendRequest = useCallback(async (target: SutraUser) => {
        if (!currentUser) return;
        try {
            const { getFirebaseFirestore } = await import('@/lib/firebase');
            const { collection, addDoc } = await import('firebase/firestore');
            const db = await getFirebaseFirestore();
            await addDoc(collection(db, 'resonance_friends'), {
                fromUid: currentUser.uid, toUid: target.uid,
                fromName: currentUser.name, fromPhoto: currentUser.photoURL ?? null,
                toName: target.name, status: 'pending',
                createdAt: Date.now(),
            });
        } catch { /* offline */ }
    }, [currentUser]);
    const [chatWith, setChatWith] = useState<SutraUser | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

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
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: '1.15rem', fontWeight: 600,
                                background: 'linear-gradient(90deg, #fbbf24, #fde68a, #f59e0b, #fbbf24)',
                                backgroundSize: '200% auto',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                animation: 'textShimmer 4s linear infinite',
                            }}>PranaVerse</div>
                            <div style={{ fontSize: '0.45rem', color: 'rgba(251,191,36,0.55)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                                {timeLabel}
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

                            {/* ── SECTION LABEL ── */}
                            <div style={{
                                padding: '0.5rem 1rem 0.3rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}>
                                <span style={{
                                    fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em',
                                    color: 'rgba(251,191,36,0.7)', textTransform: 'uppercase',
                                }}>
                                    ✦ Sacred Feed — Reels & Portals
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

                    {activeTab === 'chat' && (
                        <motion.div key="chat-view" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

                            {/* Dynamic Nature Background for Chat Tab */}
                            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
                                <img src={CHAT_BGS[timeSlot]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.95)' }} />
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(5,8,16,0.5) 0%, rgba(5,8,16,0.15) 40%, rgba(5,8,16,0.3) 70%, rgba(5,8,16,0.8) 100%)' }} />
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,8,16,0.1)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }} />
                            </div>

                            <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', paddingTop: '4rem', paddingBottom: '7.5rem', paddingInline: '1rem', zIndex: 1, scrollbarWidth: 'none' }}>
                                {/* Header / Search */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h1 style={{ margin: '0 0 1rem', fontSize: '1.8rem', fontWeight: 900, color: '#fff', fontFamily: "'Cormorant Garamond', serif", letterSpacing: '0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Conscious Seekers</h1>
                                    <div style={{ position: 'relative' }}>
                                        <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)' }} />
                                        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search resonance circle..." style={{ width: '100%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 20, padding: '0.85rem 1rem 0.85rem 2.8rem', color: '#fff', fontSize: '0.9rem', outline: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }} />
                                    </div>
                                </div>

                                {/* Sakha Bodhi AI Card */}
                                <SakhaBodhiCard onClick={() => router.push('/bodhi-chat')} />

                                {/* Discover Seekers (Non-friends) */}
                                {users.length > 0 && <div style={{ marginTop: '1.8rem' }} />}
                                {users.map(u => {
                                    const rel = friendDocs.find(f => f.toUid === u.uid || f.fromUid === u.uid);
                                    if (rel?.status === 'accepted') return null; // Accepted friends go to Spiritual Circle

                                    let status: FriendStatus = 'none';
                                    if (rel?.status === 'pending') {
                                        status = rel.fromUid === currentUser?.uid ? 'sent' : 'received';
                                    }
                                    return (
                                        <FriendCard key={u.uid} user={u} status={status} onAdd={() => sendRequest(u)} />
                                    );
                                })}

                                {/* Spiritual Circle */}
                                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '2.5rem 0 0.85rem', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>Spiritual Circle</p>
                                {users.map(u => {
                                    const rel = friendDocs.find(f => f.toUid === u.uid || f.fromUid === u.uid);
                                    if (rel?.status !== 'accepted') return null; // Only accepted friends
                                    return (
                                        <FriendCard key={u.uid} user={u} status="friends" onChat={() => setChatWith(u)} />
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'map' && (
                        <motion.div key="map-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <DharmaMap />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ══ RESONANCE NAV BAR ══ */}
                <ResonanceNavBar activeTab={activeTab} setActiveTab={setActiveTab} badgeCount={0} />

                {/* ══ INLINE CHAT OVERLAY ══ */}
                <AnimatePresence>
                    {chatWith && currentUser && (
                        <InlineChat chatWith={chatWith} currentUser={currentUser} onBack={() => setChatWith(null)} />
                    )}
                </AnimatePresence>

                {/* ══ FULLSCREEN REEL MODAL ══ */}
                <AnimatePresence>
                    {modalOpen && (
                        <FullscreenReelModal
                            items={swipeableItems}
                            initialIndex={modalStartIdx}
                            onClose={() => setModalOpen(false)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}
