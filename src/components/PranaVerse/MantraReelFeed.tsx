'use client';

import React, {
    useState,
    useRef,
    useEffect,
    useCallback,
    useMemo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════
//  MANTRA REEL DATASET — Each mantra fused with sacred image/video
// ═══════════════════════════════════════════════════════════
export interface MantraReel {
    id: string;
    name: string;              // Display name (English)
    nameHi: string;            // Display name (Hindi/Sanskrit)
    deity: string;             // e.g. "Shiva", "Vishnu"
    deityHi: string;
    mantraText: string;        // Sanskrit text to display on card
    transliteration: string;
    meaning: string;
    color: string;             // Accent color for UI
    secondColor: string;
    audioSrc: string;          // Audio source (local or CDN)
    videoSrc?: string;         // Optional video background
    imageBg: string;           // Fallback image background
    durationLabel: string;     // e.g. "8 min" or "45 min"
    isLong: boolean;           // long = show YouTube-style progress
    category: string;
    emoji: string;
}

const MANTRA_REELS: MantraReel[] = [
    {
        id: 'gayatri-deep',
        name: 'Gayatri Mantra',
        nameHi: 'गायत्री मंत्र (घनपाठ)',
        deity: 'Savitri — Divine Sun',
        deityHi: 'सविता — दिव्य सूर्य',
        mantraText: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं\nभर्गो देवस्य धीमहि\nधियो यो नः प्रचोदयात् ॥',
        transliteration: 'Om Bhur Bhuva Swah — Tat Savitur Varenyam',
        meaning: 'We meditate on the divine light of the Sun — may it illuminate our minds',
        color: '#fbbf24',
        secondColor: '#f97316',
        audioSrc: 'https://ik.imagekit.io/rcsesr4xf/gayatri-mantra-ghanpaath.mp3',
        videoSrc: '/Slide%20Videos/Dhyan2.mp4',
        imageBg: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1400&fit=crop&q=90',
        durationLabel: '~4 min',
        isLong: false,
        category: 'Vedic Mantra',
        emoji: '☀️',
    },
    {
        id: 'lalitha-sahasranamam',
        name: 'Lalitha Sahasranamam',
        nameHi: 'ललिता सहस्रनाम',
        deity: 'Lalitha — Divine Mother',
        deityHi: 'ललिता — दिव्य माता',
        mantraText: 'ॐ ऐं ह्रीं क्लीं\nत्रिपुरसुन्दर्यै नमः\nश्री महात्रिपुर सुन्दरी',
        transliteration: 'Om Aim Hreem Kleem — Tripurasundaryai Namah',
        meaning: 'A thousand names of the Divine Mother — the beautiful one of three cities',
        color: '#f472b6',
        secondColor: '#a21caf',
        audioSrc: 'https://ik.imagekit.io/rcsesr4xf/Lalitha-Sahasranamam.mp3',
        videoSrc: '/Slide%20Videos/kailash10.mp4',
        imageBg: 'https://images.unsplash.com/photo-1616587894288-82f7b65dd78f?w=800&h=1400&fit=crop&q=90',
        durationLabel: '~45 min',
        isLong: true,
        category: 'Stotra',
        emoji: '🌸',
    },
    {
        id: 'shiva-tandava',
        name: 'Shiva Tandava Stotram',
        nameHi: 'शिव तांडव स्तोत्रम्',
        deity: 'Mahadev — Lord Shiva',
        deityHi: 'महादेव — भगवान शिव',
        mantraText: 'जटाटवीगलज्जलप्रवाहपावितस्थले\nगलेऽवलम्ब्य लम्बितां भुजङ्गतुङ्गमालिकाम् ॥',
        transliteration: 'Jatatavigalajjala — Pravaha Pavita Sthale',
        meaning: 'With rivers flowing from his matted locks, wearing serpents as garland — Shiva dances',
        color: '#c084fc',
        secondColor: '#7c3aed',
        audioSrc: 'https://ik.imagekit.io/rcsesr4xf/Shiva-Tandav.mp3',
        videoSrc: '/Slide%20Videos/Shiva.mp4',
        imageBg: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&h=1400&fit=crop&q=90',
        durationLabel: '~8 min',
        isLong: false,
        category: 'Stotra',
        emoji: '🔱',
    },
    {
        id: 'vishnu-sahasranamam',
        name: 'Vishnu Sahasranamam',
        nameHi: 'विष्णु सहस्रनाम',
        deity: 'Vishnu — The Preserver',
        deityHi: 'विष्णु — पालक ईश्वर',
        mantraText: 'ॐ नमो भगवते वासुदेवाय\nविश्वं विष्णुर्वषट्कारो\nभूतभव्यभवत्प्रभुः ॥',
        transliteration: 'Om Namo Bhagavate Vasudevaya',
        meaning: 'A thousand names of Lord Vishnu who is the universe itself',
        color: '#38bdf8',
        secondColor: '#0369a1',
        audioSrc: 'https://ik.imagekit.io/aup4wh6lq/VISHNU%20SAHASRANAMAM%20_%20Madhubanti%20Bagchi%20%26%20Siddharth%20Bhavsar%20_%20Stotra%20For%20Peace%20%26%20Divine%20Blessings.mp4',
        videoSrc: 'https://ik.imagekit.io/aup4wh6lq/VISHNU%20SAHASRANAMAM%20_%20Madhubanti%20Bagchi%20%26%20Siddharth%20Bhavsar%20_%20Stotra%20For%20Peace%20%26%20Divine%20Blessings.mp4',
        imageBg: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=1400&fit=crop&q=90',
        durationLabel: '~52 min',
        isLong: true,
        category: 'Sahasranamam',
        emoji: '🪷',
    },
    {
        id: 'om-namah-shivaya',
        name: 'Om Namah Shivaya',
        nameHi: 'ॐ नमः शिवाय',
        deity: 'Shiva — The Inner Self',
        deityHi: 'शिव — अंतरात्मा',
        mantraText: 'ॐ नमः शिवाय\nनमः शिवाय\nशिवाय नमः ॥',
        transliteration: 'Om Namah Shivaya — I bow to the inner Self',
        meaning: 'I bow to Lord Shiva — the five elements, the inner self and universal consciousness',
        color: '#a78bfa',
        secondColor: '#4f46e5',
        audioSrc: '/Slide%20Videos/Om%20Namah%20Shivaay%F0%9F%99%8F%F0%9F%8F%BB%F0%9F%9B%95...%F0%9F%93%8D%F0%9F%93%8C%20Timbersaim%20Mahadev%20(%20Chota%20Kailash%20)%20..%23temple%20%23shiv%20%23shiva%20%23mahad.mp4',
        videoSrc: '/Slide%20Videos/Om%20Namah%20Shivaay%F0%9F%99%8F%F0%9F%8F%BB%F0%9F%9B%95...%F0%9F%93%8D%F0%9F%93%8C%20Timbersaim%20Mahadev%20(%20Chota%20Kailash%20)%20..%23temple%20%23shiv%20%23shiva%20%23mahad.mp4',
        imageBg: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&h=1400&fit=crop&q=90',
        durationLabel: '~5 min',
        isLong: false,
        category: 'Mantra',
        emoji: '🛕',
    },
    {
        id: 'shanti-path',
        name: 'Shanti Path',
        nameHi: 'शांति पाठ (21 ब्राह्मण)',
        deity: 'Universal Peace',
        deityHi: 'सर्वलोक शांति',
        mantraText: 'ॐ असतो मा सद्गमय ।\nतमसो मा ज्योतिर्गमय ।\nमृत्योर्मा अमृतं गमय ।\nॐ शान्तिः शान्तिः शान्तिः ॥',
        transliteration: 'Asato Ma Sadgamaya — Lead me from untruth to truth',
        meaning: 'Lead me from ignorance to truth, from darkness to light, from death to immortality',
        color: '#34d399',
        secondColor: '#059669',
        audioSrc: 'https://ik.imagekit.io/rcsesr4xf/shanti-path.mp3',
        videoSrc: '/Slide%20Videos/kailash11.mp4',
        imageBg: 'https://images.unsplash.com/photo-1455156218388-5e61b526818b?w=800&h=1400&fit=crop&q=90',
        durationLabel: '~10 min',
        isLong: false,
        category: 'Vedic Mantra',
        emoji: '✨',
    },
    {
        id: 'hanuman-chalisa',
        name: 'Hanuman Chalisa',
        nameHi: 'हनुमान चालीसा',
        deity: 'Hanuman — The Mighty',
        deityHi: 'हनुमान — बजरंगबली',
        mantraText: 'जय हनुमान ज्ञान गुण सागर ।\nजय कपीस तिहुँ लोक उजागर ॥\nराम दूत अतुलित बल धामा ।',
        transliteration: 'Jai Hanuman Gyan Gun Sagar — Glory to Hanuman',
        meaning: 'Victory to Hanuman, ocean of wisdom and virtue, the radiant one of the three worlds',
        color: '#f97316',
        secondColor: '#c2410c',
        audioSrc: '/audio/Powerful Hanuman Chalisa  HanuMan  Teja Sajja  Saicharan  Hanuman Jayanti Song  Jai Hanuman.mp3',
        videoSrc: '/Slide%20Videos/Dhyan7.mp4',
        imageBg: 'https://images.unsplash.com/photo-1609619385002-f40f1df9b7eb?w=800&h=1400&fit=crop&q=90',
        durationLabel: '~7 min',
        isLong: false,
        category: 'Chalisa',
        emoji: '🙏',
    },
    {
        id: 'dainik-agnihotra',
        name: 'Dainik Agnihotra',
        nameHi: 'दैनिक अग्निहोत्र',
        deity: 'Agni — Sacred Fire',
        deityHi: 'अग्नि — पावन अग्नि',
        mantraText: 'भूरग्नये स्वाहा ।\nभुवरग्नये स्वाहा ।\nस्वरग्नये स्वाहा ॥',
        transliteration: 'Bhur Agnaye Svaha — I offer to the sacred fire',
        meaning: 'Offering to the sacred fire of earth, sky and heaven — the daily ritual of purification',
        color: '#ef4444',
        secondColor: '#b91c1c',
        audioSrc: 'https://ik.imagekit.io/aup4wh6lq/DainikAgnihotra.mp3?updatedAt=1771246817070',
        videoSrc: '/Slide%20Videos/%E0%A4%AD%E0%A5%82%E0%A4%B0%E0%A4%97%E0%A5%8D%E0%A4%A8%E0%A4%AF%E0%A5%87%20%E0%A4%B8%E0%A5%8D%E0%A4%B5%E0%A4%BE%E0%A4%B9%E0%A4%BE.mp4',
        imageBg: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=1400&fit=crop&q=90',
        durationLabel: '~15 min',
        isLong: true,
        category: 'Vedic Ritual',
        emoji: '🔥',
    },
    {
        id: 'rudrashtakam',
        name: 'Rudrashtakam',
        nameHi: 'रुद्राष्टकम्',
        deity: 'Rudra — The Fierce Shiva',
        deityHi: 'रुद्र — भगवान शिव',
        mantraText: 'नमामीशमीशान निर्वाणरूपं\nविभुं व्यापकं ब्रह्मवेदस्वरूपम् ।\nनिजं निर्गुणं निर्विकल्पं निरीहं\nचिदाकाशामाकाशवासं भजेऽहम् ॥',
        transliteration: 'Namami Isham Ishan Nirvana Rupam',
        meaning: 'I bow to Shiva who is the essence of liberation, all-pervading and the form of Vedas',
        color: '#60a5fa',
        secondColor: '#1d4ed8',
        audioSrc: '/audio/Agam - Rudrashtakam  रदरषटकम  Most POWERFUL Shiva Mantras Ever  Lyrical Video  Shiv.mp3',
        videoSrc: '/Slide%20Videos/Kedar.mp4',
        imageBg: 'https://images.unsplash.com/photo-1455156218388-5e61b526818b?w=800&h=1400&fit=crop&q=90',
        durationLabel: '~8 min',
        isLong: false,
        category: 'Stotra',
        emoji: '🏔️',
    },
    {
        id: 'brahma-yagya',
        name: 'Brahma Yagya',
        nameHi: 'ब्रह्मयज्ञ',
        deity: 'Brahma — The Creator',
        deityHi: 'ब्रह्मा — सृष्टिकर्ता',
        mantraText: 'ॐ शन्नो मित्रः शं वरुणः ।\nशन्नो भवत्वर्यमा ।\nशन्न इन्द्रो बृहस्पतिः ॥',
        transliteration: 'Om Shanno Mitrah Sham Varunah',
        meaning: 'May the Sun be gracious to us, may Varuna be gracious — universal prayer for peace',
        color: '#fbbf24',
        secondColor: '#b45309',
        audioSrc: 'https://ik.imagekit.io/rcsesr4xf/BrahmaYagya.mp3',
        videoSrc: '/Slide%20Videos/Dhyan4.mp4',
        imageBg: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&h=1400&fit=crop&q=90',
        durationLabel: '~20 min',
        isLong: true,
        category: 'Vedic Yagya',
        emoji: '🪔',
    },
    {
        id: 'kaal-bhairav',
        name: 'Kaal Bhairav Ashtakam',
        nameHi: 'काल भैरव अष्टकम्',
        deity: 'Kaal Bhairav — Lord of Time',
        deityHi: 'काल भैरव — कालदेवता',
        mantraText: 'देवराजसेव्यमानपावनाङ्घ्रिपङ्कजं\nव्यालयज्ञसूत्रमिन्दुशेखरं कृपाकरम् ।\nनारदादियोगिवृन्दवन्दितं दिगम्बरं\nकाशिकापुराधिनाथकालभैरवं भजे ॥',
        transliteration: 'Devaraja Sevyamana Pavana Anghri Pankajam',
        meaning: 'I worship Kaal Bhairav of Kashi, worshipped by the king of gods, the Lord of Time',
        color: '#818cf8',
        secondColor: '#4f46e5',
        audioSrc: 'https://ik.imagekit.io/aup4wh6lq/Kaal%20Bhairav%20Ashtakam%20_%20Tanuku%20Sisters%20_%20@DivineDharohar.mp4',
        videoSrc: 'https://ik.imagekit.io/aup4wh6lq/Kaal%20Bhairav%20Ashtakam%20_%20Tanuku%20Sisters%20_%20@DivineDharohar.mp4',
        imageBg: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=1400&fit=crop&q=90',
        durationLabel: '~6 min',
        isLong: false,
        category: 'Ashtakam',
        emoji: '⏳',
    },
    {
        id: 'maheshvara-sutram',
        name: 'Maheshvara Sutram',
        nameHi: 'माहेश्वर सूत्रम्',
        deity: 'Maheshvara — Supreme Shiva',
        deityHi: 'महेश्वर — परम शिव',
        mantraText: 'अ इ उ ण् ।\nऋ ॡ क् ।\nए ओ ङ् ।\nऐ औ च् ।',
        transliteration: 'The Primal Sounds of Creation — 14 Maheshvara Sutras',
        meaning: 'The sacred sounds that Shiva produced from his cosmic drum at the beginning of creation',
        color: '#c084fc',
        secondColor: '#9333ea',
        audioSrc: 'https://ik.imagekit.io/aup4wh6lq/Most%20powerful%20Maheshvara%20Su%CC%84tram%20_%20the%20primal%20sound%20of%20creation.%E0%A4%AE%E0%A4%BE%E0%A4%B9%E0%A5%87%E0%A4%B6%E0%A5%8D%E0%A4%B5%E0%A4%B0%20%E0%A4%B8%E0%A5%82%E0%A4%A4%E0%A5%8D%E0%A4%B0%E0%A4%AE%E0%A5%8D%20_%20%E0%A4%9C%E0%A4%BF%E0%A4%B8%E0%A4%B8%E0%A5%87%20%E0%A4%B8%E0%A4%AE%E0%A5%8D%E0%A4%AA%E0%A5%82%E0%A4%B0%E0%A5%8D%E0%A4%A3.mp4',
        videoSrc: 'https://ik.imagekit.io/aup4wh6lq/Most%20powerful%20Maheshvara%20Su%CC%84tram%20_%20the%20primal%20sound%20of%20creation.%E0%A4%AE%E0%A4%BE%E0%A4%B9%E0%A5%87%E0%A4%B6%E0%A5%8D%E0%A4%B5%E0%A4%B0%20%E0%A4%B8%E0%A5%82%E0%A4%A4%E0%A5%8D%E0%A4%B0%E0%A4%AE%E0%A5%8D%20_%20%E0%A4%9C%E0%A4%BF%E0%A4%B8%E0%A4%B8%E0%A5%87%20%E0%A4%B8%E0%A4%AE%E0%A5%8D%E0%A4%AA%E0%A5%82%E0%A4%B0%E0%A5%8D%E0%A4%A3.mp4',
        imageBg: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=800&h=1400&fit=crop&q=90',
        durationLabel: '~3 min',
        isLong: false,
        category: 'Vedic Mantra',
        emoji: '🌀',
    },
];

// ═══════════════════════════════════════════════════════════
//  AUDIO WAVEFORM ANIMATION — Pure CSS, 5 bars
// ═══════════════════════════════════════════════════════════
function AudioWaveform({ playing, color }: { playing: boolean; color: string }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 3, height: 26,
            padding: '0 2px',
        }}>
            <style>{`
                @keyframes waveBar1 { 0%,100%{height:6px} 50%{height:22px} }
                @keyframes waveBar2 { 0%,100%{height:12px} 40%{height:8px} 70%{height:24px} }
                @keyframes waveBar3 { 0%,100%{height:18px} 35%{height:6px} 65%{height:22px} }
                @keyframes waveBar4 { 0%,100%{height:8px} 50%{height:20px} }
                @keyframes waveBar5 { 0%,100%{height:14px} 55%{height:6px} }
            `}</style>
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{
                    width: 3,
                    height: playing ? undefined : 6,
                    background: color,
                    borderRadius: 2,
                    opacity: playing ? 0.9 : 0.4,
                    animation: playing ? `waveBar${i} ${0.7 + i * 0.12}s ease-in-out ${i * 0.06}s infinite` : 'none',
                    transition: 'opacity 0.3s ease',
                    flexShrink: 0,
                }} />
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
//  FORMAT TIME
// ═══════════════════════════════════════════════════════════
function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ═══════════════════════════════════════════════════════════
//  SINGLE REEL CARD — Full-screen snap slot
// ═══════════════════════════════════════════════════════════
function MantraReelCard({
    reel,
    isActive,
    onPlayPause,
}: {
    reel: MantraReel;
    isActive: boolean;
    onPlayPause?: () => void;
}) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [loaded, setLoaded] = useState(false);
    const [showMantra, setShowMantra] = useState(false);
    const isVideoSrc = reel.videoSrc !== undefined;

    // When isActive changes — auto-play/pause audio
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isActive) {
            // Small delay so scroll settles
            const t = setTimeout(() => {
                audio.play().then(() => setPlaying(true)).catch(() => { });
                setShowMantra(true);
            }, 350);
            return () => clearTimeout(t);
        } else {
            audio.pause();
            setPlaying(false);
            setShowMantra(false);
        }
    }, [isActive]);

    // Sync video mute (bg videos always muted)
    useEffect(() => {
        const vid = videoRef.current;
        if (!vid) return;
        vid.muted = true;
        if (isActive) {
            vid.play().catch(() => { });
        } else {
            vid.pause();
        }
    }, [isActive]);

    const togglePlay = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (playing) {
            audio.pause();
            setPlaying(false);
        } else {
            audio.play().then(() => setPlaying(true)).catch(() => { });
        }
    }, [playing]);

    const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        if (!audio || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        audio.currentTime = pct * duration;
    }, [duration]);

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: '100dvh',
            scrollSnapAlign: 'start',
            overflow: 'hidden',
            background: '#000',
            flexShrink: 0,
        }}>
            {/* Background video or image */}
            {isVideoSrc ? (
                <video
                    ref={videoRef}
                    src={reel.videoSrc}
                    muted
                    loop
                    playsInline
                    preload={isActive ? 'auto' : 'none'}
                    style={{
                        position: 'absolute', inset: 0,
                        width: '100%', height: '100%',
                        objectFit: 'cover',
                        filter: 'brightness(0.55) saturate(1.2)',
                    }}
                />
            ) : (
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url(${reel.imageBg})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    filter: 'brightness(0.5) saturate(1.2)',
                    animation: isActive ? 'reelBgScale 30s ease-in-out infinite alternate' : 'none',
                }} />
            )}

            {/* Gradient overlays */}
            <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(
                    180deg,
                    rgba(0,0,0,0.65) 0%,
                    transparent 25%,
                    transparent 50%,
                    rgba(0,0,0,0.72) 80%,
                    rgba(0,0,0,0.94) 100%
                )`,
                pointerEvents: 'none',
            }} />

            {/* Accent color glow */}
            <div style={{
                position: 'absolute', inset: 0,
                background: `radial-gradient(ellipse at 50% 30%, ${reel.color}18 0%, transparent 60%)`,
                pointerEvents: 'none',
            }} />

            {/* TOP: Category + name badge */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                padding: '2.2rem 1.2rem 0.8rem',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.72) 0%, transparent 100%)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    {/* Category pill */}
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: `${reel.color}22`,
                        border: `1px solid ${reel.color}55`,
                        borderRadius: 999, padding: '0.22rem 0.8rem',
                        backdropFilter: 'blur(12px)',
                    }}>
                        <span style={{ fontSize: '0.85rem' }}>{reel.emoji}</span>
                        <span style={{
                            fontSize: '0.48rem', fontWeight: 800,
                            color: reel.color, letterSpacing: '0.12em',
                            textTransform: 'uppercase', fontFamily: "'Inter', sans-serif",
                            textShadow: `0 0 10px ${reel.color}99`,
                        }}>{reel.category}</span>
                    </div>

                    {/* Duration badge */}
                    <div style={{
                        background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 8, padding: '0.2rem 0.55rem',
                        fontSize: '0.48rem', color: 'rgba(255,255,255,0.75)',
                        fontFamily: "'Inter', sans-serif", fontWeight: 600,
                    }}>{reel.isLong ? '🎬 Long' : '⚡ Short'} · {reel.durationLabel}</div>
                </div>

                {/* Reel name */}
                <motion.h2
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{
                        fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
                        fontSize: 'clamp(1.15rem, 4.5vw, 1.6rem)',
                        fontWeight: 700,
                        color: '#fff',
                        margin: '0.6rem 0 0.1rem',
                        textShadow: `0 0 30px ${reel.color}66, 0 2px 8px rgba(0,0,0,0.8)`,
                        lineHeight: 1.2,
                    }}
                >
                    {reel.nameHi}
                </motion.h2>
                <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.54rem', color: reel.color,
                    fontWeight: 700, letterSpacing: '0.08em',
                    textTransform: 'uppercase', margin: 0,
                    textShadow: `0 0 12px ${reel.color}88`,
                }}>
                    {reel.deity}
                </p>
            </div>

            {/* CENTER: Sanskrit mantra text */}
            <AnimatePresence>
                {showMantra && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                        style={{
                            position: 'absolute',
                            top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center',
                            padding: '0 1.5rem',
                            width: '100%',
                            pointerEvents: 'none',
                        }}
                    >
                        {/* Glowing halo behind text */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: `radial-gradient(ellipse at 50% 50%, ${reel.color}22 0%, transparent 70%)`,
                            borderRadius: 24, filter: 'blur(20px)',
                        }} />

                        <p style={{
                            fontFamily: "'Noto Serif Devanagari', 'Mangal', serif",
                            fontSize: 'clamp(1.1rem, 4.5vw, 1.55rem)',
                            lineHeight: 1.7,
                            color: '#fff',
                            fontWeight: 700,
                            textShadow: `0 0 40px ${reel.color}99, 0 2px 16px rgba(0,0,0,0.95)`,
                            whiteSpace: 'pre-line',
                            margin: 0,
                            position: 'relative', zIndex: 1,
                        }}>
                            {reel.mantraText}
                        </p>

                        <p style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '0.58rem',
                            color: `${reel.color}cc`,
                            fontStyle: 'italic',
                            marginTop: '0.8rem',
                            letterSpacing: '0.04em',
                            textShadow: `0 0 12px ${reel.color}66`,
                            position: 'relative', zIndex: 1,
                        }}>
                            {reel.transliteration}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* BOTTOM: Audio Player Panel */}
            <div style={{
                position: 'absolute',
                bottom: 0, left: 0, right: 0,
                padding: '0.8rem 1.2rem calc(1.5rem + env(safe-area-inset-bottom))',
                background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 60%, transparent 100%)',
            }}>
                {/* Meaning */}
                <AnimatePresence>
                    {showMantra && (
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            style={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: '0.62rem',
                                color: 'rgba(255,255,255,0.65)',
                                fontStyle: 'italic',
                                lineHeight: 1.6,
                                marginBottom: '0.75rem',
                            }}
                        >
                            ✦ {reel.meaning}
                        </motion.p>
                    )}
                </AnimatePresence>

                {/* Glassmorphic player bar */}
                <div style={{
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    border: `1px solid ${reel.color}30`,
                    borderRadius: 20,
                    padding: '0.75rem 1rem',
                    boxShadow: `0 0 30px ${reel.color}22, 0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)`,
                }}>
                    {/* Waveform + time */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                        <AudioWaveform playing={playing} color={reel.color} />
                        <span style={{
                            fontSize: '0.5rem', color: 'rgba(255,255,255,0.55)',
                            fontFamily: "'Inter', sans-serif", fontWeight: 600,
                            letterSpacing: '0.05em',
                        }}>
                            {formatTime(currentTime)} / {reel.isLong ? reel.durationLabel : formatTime(duration)}
                        </span>
                    </div>

                    {/* Progress bar — seekable */}
                    <div
                        onClick={handleSeek}
                        style={{
                            height: 3, borderRadius: 99,
                            background: 'rgba(255,255,255,0.12)',
                            cursor: 'pointer', marginBottom: '0.75rem',
                            position: 'relative', overflow: 'hidden',
                        }}
                    >
                        <div style={{
                            height: '100%',
                            width: `${progress}%`,
                            background: `linear-gradient(90deg, ${reel.color}, ${reel.secondColor})`,
                            borderRadius: 99,
                            boxShadow: `0 0 8px ${reel.color}99`,
                            transition: 'width 0.5s linear',
                        }} />
                    </div>

                    {/* Controls row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {/* Name */}
                        <div>
                            <div style={{
                                fontSize: '0.62rem', fontWeight: 700, color: '#fff',
                                fontFamily: "'Inter', sans-serif", lineHeight: 1.2,
                            }}>{reel.name}</div>
                            <div style={{
                                fontSize: '0.48rem', color: reel.color,
                                fontFamily: "'Inter', sans-serif", fontWeight: 600, marginTop: 1,
                            }}>{reel.deityHi}</div>
                        </div>

                        {/* Play/Pause button */}
                        <motion.button
                            whileTap={{ scale: 0.88 }}
                            onClick={togglePlay}
                            style={{
                                width: 48, height: 48, borderRadius: '50%',
                                background: `linear-gradient(135deg, ${reel.color}dd, ${reel.secondColor}cc)`,
                                border: `1.5px solid ${reel.color}66`,
                                boxShadow: `0 0 24px ${reel.color}66, 0 4px 16px rgba(0,0,0,0.5)`,
                                color: '#fff', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.2rem',
                            }}
                        >
                            {playing ? '⏸' : '▶'}
                        </motion.button>

                        {/* Open in Dhyan Kendra */}
                        <Link href="/dhyan-kshetra" style={{ textDecoration: 'none' }}>
                            <motion.div
                                whileTap={{ scale: 0.93 }}
                                style={{
                                    padding: '0.4rem 0.75rem',
                                    background: `${reel.color}18`,
                                    border: `1px solid ${reel.color}44`,
                                    borderRadius: 99,
                                    fontSize: '0.46rem', color: reel.color, fontWeight: 700,
                                    fontFamily: "'Inter', sans-serif",
                                    letterSpacing: '0.06em',
                                    whiteSpace: 'nowrap',
                                    textShadow: `0 0 8px ${reel.color}66`,
                                }}
                            >
                                🧘 Dhyan →
                            </motion.div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Hidden audio element */}
            <audio
                ref={audioRef}
                src={reel.audioSrc}
                preload={isActive ? 'auto' : 'none'}
                onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
                onDurationChange={() => setDuration(audioRef.current?.duration || 0)}
                onLoadedData={() => setLoaded(true)}
                onEnded={() => setPlaying(false)}
            />

            <style>{`
                @keyframes reelBgScale {
                    0% { transform: scale(1.0); }
                    100% { transform: scale(1.06); }
                }
            `}</style>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
//  MANTRA REEL FEED — Full container with CSS scroll-snap
// ═══════════════════════════════════════════════════════════
export default function MantraReelFeed({ style }: { style?: React.CSSProperties }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeIdx, setActiveIdx] = useState(0);

    // IntersectionObserver to detect active reel
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const cards = container.querySelectorAll<HTMLDivElement>('[data-reel-card]');
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.55) {
                        const idx = Number(entry.target.getAttribute('data-reel-idx'));
                        setActiveIdx(idx);
                    }
                }
            },
            { root: container, threshold: 0.55 }
        );

        cards.forEach(card => observer.observe(card));
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                height: '100dvh',
                overflowY: 'scroll',
                scrollSnapType: 'y mandatory',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                position: 'relative',
                background: '#000',
                ...style,
            }}
        >
            {/* Vertical progress indicator (right side) */}
            <div style={{
                position: 'fixed',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                zIndex: 100,
                pointerEvents: 'none',
            }}>
                {MANTRA_REELS.map((r, i) => (
                    <div
                        key={r.id}
                        style={{
                            width: 3,
                            height: i === activeIdx ? 22 : 6,
                            borderRadius: 99,
                            background: i === activeIdx ? MANTRA_REELS[activeIdx].color : 'rgba(255,255,255,0.2)',
                            transition: 'all 0.35s ease',
                            boxShadow: i === activeIdx ? `0 0 8px ${MANTRA_REELS[activeIdx].color}` : 'none',
                        }}
                    />
                ))}
            </div>

            {MANTRA_REELS.map((reel, idx) => (
                <div
                    key={reel.id}
                    data-reel-card
                    data-reel-idx={idx}
                >
                    <MantraReelCard
                        reel={reel}
                        isActive={idx === activeIdx}
                    />
                </div>
            ))}
        </div>
    );
}

// Export the raw dataset for use in HomeStoryBar
export { MANTRA_REELS };
