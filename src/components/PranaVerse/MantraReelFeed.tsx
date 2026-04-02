'use client';

import React, {
    useState,
    useRef,
    useEffect,
    useCallback,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════
//  MANTRA REEL DATASET
//  videoSrc = this IS a content video (plays as video reel)
//  no videoSrc = audio-only, uses imageBg + wave ring animation
// ═══════════════════════════════════════════════════════════
export interface MantraReel {
    id: string;
    name: string;
    nameHi: string;
    deity: string;
    deityHi: string;
    mantraText: string;
    transliteration: string;
    meaning: string;
    color: string;
    secondColor: string;
    audioSrc: string;
    videoSrc?: string;   // Only set when the reel IS a video
    imageBg: string;
    durationLabel: string;
    isLong: boolean;
    category: string;
    emoji: string;
}

export const MANTRA_REELS: MantraReel[] = [
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
        imageBg: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&h=1400&fit=crop&q=90',
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
        imageBg: 'https://images.unsplash.com/photo-1447433819943-74a20887a81e?w=800&h=1400&fit=crop&q=90',
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
        // This is a real content video — plays as video reel
        audioSrc: 'https://ik.imagekit.io/aup4wh6lq/VISHNU%20SAHASRANAMAM%20_%20Madhubanti%20Bagchi%20%26%20Siddharth%20Bhavsar%20_%20Stotra%20For%20Peace%20%26%20Divine%20Blessings.mp4',
        videoSrc: 'https://ik.imagekit.io/aup4wh6lq/VISHNU%20SAHASRANAMAM%20_%20Madhubanti%20Bagchi%20%26%20Siddharth%20Bhavsar%20_%20Stotra%20For%20Peace%20%26%20Divine%20Blessings.mp4',
        imageBg: 'https://images.unsplash.com/photo-1517816743773-6e0d765cdc96?w=800&h=1400&fit=crop&q=90',
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
        audioSrc: '/audio/Om%20Namah%20Shivaya.mp3',
        imageBg: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&h=1400&fit=crop&q=90',
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
        imageBg: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&h=1400&fit=crop&q=90',
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
        imageBg: 'https://images.unsplash.com/photo-1574169208507-84376144848b?w=800&h=1400&fit=crop&q=90',
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
        mantraText: 'नमामीशमीशान निर्वाणरूपं\nविभुं व्यापकं ब्रह्मवेदस्वरूपम् ।\nनिजं निर्गुणं निर्विकल्पं निरीहं\nचिदाकाशमाकाशवासं भजेऽहम् ॥',
        transliteration: 'Namami Isham Ishan Nirvana Rupam',
        meaning: 'I bow to Shiva who is the essence of liberation, all-pervading and the form of Vedas',
        color: '#60a5fa',
        secondColor: '#1d4ed8',
        audioSrc: '/audio/Agam - Rudrashtakam  रदरषटकम  Most POWERFUL Shiva Mantras Ever  Lyrical Video  Shiv.mp3',
        imageBg: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=1400&fit=crop&q=90',
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
        // This is a real content video
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
        imageBg: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=800&h=1400&fit=crop&q=90',
        durationLabel: '~3 min',
        isLong: false,
        category: 'Vedic Mantra',
        emoji: '🌀',
    },
    // ── Dhyan Kshetra exclusive items ──────────────────────────────────────────
    {
        id: 'guru-shishya',
        name: 'Guru Shishya Mantra',
        nameHi: 'गुरु शिष्य मंत्र',
        deity: 'Gurukul — Sacred Bond',
        deityHi: 'गुरुकुल — पवित्र बंधन',
        mantraText: 'ॐ सह नाववतु ।\nसह नौ भुनक्तु ।\nसह वीर्यं करवावहै ॥',
        transliteration: 'Om Saha Nau Avatu — May we be protected together',
        meaning: 'May we be protected together, nourished together and work with great energy together',
        color: '#fbbf24',
        secondColor: '#d97706',
        audioSrc: '/audio/Om_Sahana_Vavatu_Shanti_Mantra.mp3',
        imageBg: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=1400&fit=crop&q=90',
        durationLabel: '~5 min',
        isLong: false,
        category: 'Vedic Mantra',
        emoji: '🪔',
    },
    {
        id: 'agnihotra-shantipath',
        name: 'Agnihotra Shantipath',
        nameHi: 'अग्निहोत्र शांतिपाठ',
        deity: 'Agni — Universal Peace',
        deityHi: 'अग्नि — सर्वलोक शांति',
        mantraText: 'ॐ स्वस्ति न इन्द्रो वृद्धश्रवाः ।\nस्वस्ति नः पूषा विश्ववेदाः ।\nस्वस्ति नस्तार्क्ष्यो अरिष्टनेमिः ॥',
        transliteration: 'Om Svasti Na Indro — May great Indra bless us',
        meaning: 'May Indra bless us, may Pusha the Sun bless us — Vedic chants for universal peace and well-being',
        color: '#f97316',
        secondColor: '#c2410c',
        audioSrc: '/audio/Agnihotra_Shantipath_-_Vedic_Chants_for_Universal_Peace_and_Well-Being_part_2_(mp3.pm).mp3',
        imageBg: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=800&h=1400&fit=crop&q=90',
        durationLabel: '~12 min',
        isLong: false,
        category: 'Vedic Ritual',
        emoji: '🔥',
    },
    {
        id: 'rudri-path',
        name: 'Complete Rudri Path',
        nameHi: 'सम्पूर्ण रुद्री पाठ',
        deity: 'Rudra — 21 Brahmins Chanting',
        deityHi: 'रुद्र — 21 ब्राह्मण गायन',
        mantraText: 'नमस्ते रुद्र मन्यवे\nउतो त इषवे नमः ।\nनमस्ते अस्तु धन्वने\nबाहुभ्यामुत ते नमः ॥',
        transliteration: 'Namaste Rudra Manyave — Salutations to Rudra',
        meaning: 'Salutations to the fierce Rudra — complete Rudri Path chanted in sacred unison by 21 Brahmins',
        color: '#818cf8',
        secondColor: '#4f46e5',
        audioSrc: 'https://ik.imagekit.io/aup4wh6lq/Complete%20Rudri%20Path%20with%20Lyrics%20_%20Vedic%20Chanting%20by%2021%20Brahmins.mp4',
        videoSrc: 'https://ik.imagekit.io/aup4wh6lq/Complete%20Rudri%20Path%20with%20Lyrics%20_%20Vedic%20Chanting%20by%2021%20Brahmins.mp4',
        imageBg: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800&h=1400&fit=crop&q=90',
        durationLabel: '~1 hr',
        isLong: true,
        category: 'Vedic Chanting',
        emoji: '🏔️',
    },
    {
        id: 'shiv-shakti-energy',
        name: 'Shiv Shakti Energy',
        nameHi: 'शिव शक्ति ऊर्जा',
        deity: 'Shiva & Shakti — Cosmic Energy',
        deityHi: 'शिव-शक्ति — ब्रह्मांडीय ऊर्जा',
        mantraText: 'हर हर महादेव\nॐ नमः शिवाय\nशिव शक्ति ॐ ॥',
        transliteration: 'Har Har Mahadev — Feel the Divine Energy',
        meaning: 'Feel the divine cosmic energy of Shiva and Shakti flowing through you in every breath',
        color: '#a78bfa',
        secondColor: '#7c3aed',
        audioSrc: 'https://ik.imagekit.io/aup4wh6lq/Just%20feel%20the%20energy%20____Follow%20@fmccreators%20for%20more_%E0%A4%B9%E0%A4%B0%20%E0%A4%B9%E0%A4%B0%20%E0%A4%AE%E0%A4%B9%E0%A4%BE%E0%A4%A6%E0%A5%87%E0%A4%B5%20__%E0%A4%9C%E0%A4%AF%20%E0%A4%B6%E0%A4%82%E0%A4%95%E0%A4%B0%20___Do%20like.mp4',
        videoSrc: 'https://ik.imagekit.io/aup4wh6lq/Just%20feel%20the%20energy%20____Follow%20@fmccreators%20for%20more_%E0%A4%B9%E0%A4%B0%20%E0%A4%B9%E0%A4%B0%20%E0%A4%AE%E0%A4%B9%E0%A4%BE%E0%A4%A6%E0%A5%87%E0%A4%B5%20__%E0%A4%9C%E0%A4%AF%20%E0%A4%B6%E0%A4%82%E0%A4%95%E0%A4%B0%20___Do%20like.mp4',
        imageBg: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&h=1400&fit=crop&q=90',
        durationLabel: '~3 min',
        isLong: false,
        category: 'Shakti',
        emoji: '⚡',
    },
    {
        id: 'ardhanarishvara',
        name: 'Ardhanarishvara',
        nameHi: 'अर्धनारीश्वर',
        deity: 'Ardhanarishvara — Half Woman Lord',
        deityHi: 'अर्धनारीश्वर — शिव-शक्ति एकत्व',
        mantraText: 'ॐ अर्धनारीश्वराय नमः ।\nशिव शक्त्यात्मने नमः ।\nपरमशिवाय नमः ॥',
        transliteration: 'Om Ardhanarishvaraya Namah',
        meaning: 'The Lord who is half-woman — perfect synthesis of masculine and feminine cosmic energies',
        color: '#f472b6',
        secondColor: '#9333ea',
        audioSrc: 'https://ik.imagekit.io/aup4wh6lq/The%20_Lord%20who%20is%20half%20woman_%20signifies%20the%20perfect%20synthesis%20of%20masculine%20and%20feminine%20energies,.mp4',
        videoSrc: 'https://ik.imagekit.io/aup4wh6lq/The%20_Lord%20who%20is%20half%20woman_%20signifies%20the%20perfect%20synthesis%20of%20masculine%20and%20feminine%20energies,.mp4',
        imageBg: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&h=1400&fit=crop&q=90',
        durationLabel: '~2 min',
        isLong: false,
        category: 'Shakti Mantra',
        emoji: '🌸',
    },
    {
        id: 'shiv-swarnamala',
        name: 'Shiv Swarnamala Stuti',
        nameHi: 'शिव स्वर्णमाला स्तुति',
        deity: 'Mahadev — Golden Garland Hymn',
        deityHi: 'महादेव — स्वर्णमाला स्तुति',
        mantraText: 'ॐ नमः शिवाय शुभाय\nशङ्करप्रियाय स्वाहा\nशिव स्वर्णमाला स्तुति ॥',
        transliteration: 'Om Namah Shivaya Shubhaya — Shiv Swarnamala',
        meaning: 'The golden garland hymn to Lord Shiva — each verse a golden bead of pure devotion',
        color: '#fbbf24',
        secondColor: '#b45309',
        audioSrc: 'https://ik.imagekit.io/aup4wh6lq/Shiv%20Swarnamala%20Stuti%20_%E2%9D%A4%EF%B8%8F%20I%20Verse%20-%207%20_.Follow%20@aumm_namah_shivay%20for%20more%20%E2%9D%A4%EF%B8%8F%20.._mahadev%20_shiv.mp4',
        videoSrc: 'https://ik.imagekit.io/aup4wh6lq/Shiv%20Swarnamala%20Stuti%20_%E2%9D%A4%EF%B8%8F%20I%20Verse%20-%207%20_.Follow%20@aumm_namah_shivay%20for%20more%20%E2%9D%A4%EF%B8%8F%20.._mahadev%20_shiv.mp4',
        imageBg: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=1400&fit=crop&q=90',
        durationLabel: '~4 min',
        isLong: false,
        category: 'Stotra',
        emoji: '🏅',
    },
    {
        id: 'nad-chikitsa',
        name: 'Nad Chikitsa — Sound Healing',
        nameHi: 'नाद चिकित्सा',
        deity: 'Nada Brahman — Sound is God',
        deityHi: 'नादब्रह्म — ध्वनि ईश्वर है',
        mantraText: 'नाद ब्रह्म विश्वस्वरूपम् ।\nनाद से उत्पन्न जगत् ।\nनाद चिकित्सा — ध्वनि उपचार ॥',
        transliteration: 'Nada Brahma Vishvasvarupam — Sound is the form of God',
        meaning: 'Sound has power to heal — ancient wisdom of sound therapy and healing frequencies for the soul',
        color: '#22d3ee',
        secondColor: '#0891b2',
        audioSrc: 'https://ik.imagekit.io/aup4wh6lq/Most%20people%20don_t%20realize%20it,%20but%20sound%20has%20the%20power%20to%20heal%20-%20or%20harm.%20There_s%20a%20reason%20why%20an.mp4',
        videoSrc: 'https://ik.imagekit.io/aup4wh6lq/Most%20people%20don_t%20realize%20it,%20but%20sound%20has%20the%20power%20to%20heal%20-%20or%20harm.%20There_s%20a%20reason%20why%20an.mp4',
        imageBg: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=1400&fit=crop&q=90',
        durationLabel: '~3 min',
        isLong: false,
        category: 'Sound Healing',
        emoji: '🎶',
    },
    {
        id: 'mahadev-nav-varsh',
        name: 'Mahadev — Nav Varsh',
        nameHi: 'महादेव — नव वर्ष',
        deity: 'Mahadev — New Year Blessings',
        deityHi: 'महादेव — नव वर्ष आशीर्वाद',
        mantraText: 'हर हर महादेव\nनव वर्ष की हार्दिक\nशुभकामनाएं ॥',
        transliteration: 'Har Har Mahadev — Nav Varsh Shubhkamnaen',
        meaning: 'New Year blessings from Lord Shiva — may the new year bring divine light and transformation',
        color: '#f97316',
        secondColor: '#c2410c',
        audioSrc: 'https://ik.imagekit.io/aup4wh6lq/%E0%A4%86%E0%A4%AA%20%E0%A4%B8%E0%A4%AD%E0%A5%80%20%E0%A4%95%E0%A5%8B%20%E0%A4%A8%E0%A4%B5%20%E0%A4%B5%E0%A4%B0%E0%A5%8D%E0%A4%B7%20%E0%A4%95%E0%A5%80%20%E0%A4%B9%E0%A4%BE%E0%A4%B0%E0%A5%8D%E0%A4%A6%E0%A4%BF%E0%A4%95%20%E0%A4%AC%E0%A4%A7%E0%A4%BE%E0%A4%88%20%E0%A4%8F%E0%A4%B5%E0%A4%82%20%E0%A4%B6%E0%A5%81%E0%A4%AD%E0%A4%95%E0%A4%BE%E0%A4%AE%E0%A4%A8%E0%A4%BE%E0%A4%8F%E0%A4%81_%E0%A4%B9%E0%A4%B0%20%E0%A4%B9%E0%A4%B0%20%E0%A4%AE%E0%A4%B9%E0%A4%BE%E0%A4%A6%E0%A5%87%E0%A4%B5____.mp4',
        videoSrc: 'https://ik.imagekit.io/aup4wh6lq/%E0%A4%86%E0%A4%AA%20%E0%A4%B8%E0%A4%AD%E0%A5%80%20%E0%A4%95%E0%A5%8B%20%E0%A4%A8%E0%A4%B5%20%E0%A4%B5%E0%A4%B0%E0%A5%8D%E0%A4%B7%20%E0%A4%95%E0%A5%80%20%E0%A4%B9%E0%A4%BE%E0%A4%B0%E0%A5%8D%E0%A4%A6%E0%A4%BF%E0%A4%95%20%E0%A4%AC%E0%A4%A7%E0%A4%BE%E0%A4%88%20%E0%A4%8F%E0%A4%B5%E0%A4%82%20%E0%A4%B6%E0%A5%81%E0%A4%AD%E0%A4%95%E0%A4%BE%E0%A4%AE%E0%A4%A8%E0%A4%BE%E0%A4%8F%E0%A4%81_%E0%A4%B9%E0%A4%B0%20%E0%A4%B9%E0%A4%B0%20%E0%A4%AE%E0%A4%B9%E0%A4%BE%E0%A4%A6%E0%A5%87%E0%A4%B5____.mp4',
        imageBg: 'https://images.unsplash.com/photo-1471931452361-f5ff1faa15ad?w=800&h=1400&fit=crop&q=90',
        durationLabel: '~2 min',
        isLong: false,
        category: 'Celebration',
        emoji: '🎊',
    },
    {
        id: 'mahashivratri-special',
        name: 'Mahashivratri Special',
        nameHi: 'महाशिवरात्रि विशेष',
        deity: 'Shiva — The Great Night',
        deityHi: 'शिव — महारात्रि दर्शन',
        mantraText: 'ॐ नमः शिवाय\nमहाशिवरात्रि की\nहार्दिक शुभकामनाएं ॥',
        transliteration: 'Om Namah Shivaya — Mahashivratri Special',
        meaning: 'On the great night of Shiva, we offer salutations — transcend darkness and attain liberation',
        color: '#c084fc',
        secondColor: '#7c3aed',
        audioSrc: '/videos/mahashivratri_darshan.mp4',
        videoSrc: '/videos/mahashivratri_darshan.mp4',
        imageBg: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=1400&fit=crop&q=90',
        durationLabel: '~5 min',
        isLong: false,
        category: 'Festival',
        emoji: '🔱',
    },
    {
        id: 'shri-suktam',
        name: 'Shri Suktam',
        nameHi: 'श्री सूक्तम्',
        deity: 'Lakshmi — Goddess of Abundance',
        deityHi: 'लक्ष्मी — समृद्धि देवी',
        mantraText: 'हिरण्यवर्णां हरिणीं\nसुवर्णरजतस्रजाम् ।\nचन्द्रां हिरण्मयीं लक्ष्मीं\nजातवेदो म आवह ॥',
        transliteration: 'Hiranyavarnam Harineem — Golden Lakshmi come to me',
        meaning: 'O golden Lakshmi, wearing gold and silver garlands — bless us with divine abundance',
        color: '#fbbf24',
        secondColor: '#d97706',
        audioSrc: '/audio/Challakere_Brothers_vedic_chanting_-_Shri_suktam_(mp3.pm).mp3',
        imageBg: 'https://images.unsplash.com/photo-1600959907703-571a4f1f9fc4?w=800&h=1400&fit=crop&q=90',
        durationLabel: '~12 min',
        isLong: false,
        category: 'Suktam',
        emoji: '🪷',
    },
    {
        id: 'narayana-suktam',
        name: 'Narayana Suktam',
        nameHi: 'नारायण सूक्तम्',
        deity: 'Narayana — Universal Cosmic Prayer',
        deityHi: 'नारायण — ब्रह्मांड प्रार्थना',
        mantraText: 'ॐ सहस्रशीर्षा पुरुषः\nसहस्राक्षः सहस्रपात् ।\nस भूमिं विश्वतो वृत्वा\nअत्यतिष्ठद्दशाङ्गुलम् ॥',
        transliteration: 'Om Sahasrashirsha Purushah — The Universal Cosmic Being',
        meaning: 'The Universal Cosmic Person with a thousand heads and eyes — Narayana pervades the universe',
        color: '#38bdf8',
        secondColor: '#0369a1',
        audioSrc: '/audio/Anant_-_a_collection_of_vedic_chants_-_05._Narayana_Suktam_(mp3.pm).mp3',
        imageBg: 'https://images.unsplash.com/photo-1474418397713-003ec9403fe5?w=800&h=1400&fit=crop&q=90',
        durationLabel: '~15 min',
        isLong: false,
        category: 'Suktam',
        emoji: '🪷',
    },
    {
        id: 'virija-homa',
        name: 'Virija Homa Mantra',
        nameHi: 'विरजा होम मंत्र',
        deity: 'Agni — Sacred Fire Ritual',
        deityHi: 'अग्नि — यज्ञ अनुष्ठान',
        mantraText: 'ॐ विरजा होम मंत्र\nपावन अग्नि में\nआहुति समर्पण ॥',
        transliteration: 'Om Virija Homa Mantra — Sacred Fire Offering',
        meaning: 'The sacred Virija Homa fire ritual — purification through fire and sacred Vedic offerings',
        color: '#ef4444',
        secondColor: '#b91c1c',
        audioSrc: '/audio/Virija Homa Mantra  Uma Mohan  Promod Shanker  Times Music Spiritual.mp3',
        imageBg: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&h=1400&fit=crop&q=90',
        durationLabel: '~10 min',
        isLong: false,
        category: 'Vedic Ritual',
        emoji: '🪔',
    },
];

// ═══════════════════════════════════════════════════════════
//  AUDIO WAVEFORM — 5 animated bars (same as Dhyan Kshetra)
// ═══════════════════════════════════════════════════════════
function AudioWaveform({ playing, color }: { playing: boolean; color: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 26, padding: '0 2px' }}>
            <style>{`
                @keyframes waveBar1 { 0%,100%{height:6px} 50%{height:22px} }
                @keyframes waveBar2 { 0%,100%{height:12px} 40%{height:8px} 70%{height:24px} }
                @keyframes waveBar3 { 0%,100%{height:18px} 35%{height:6px} 65%{height:22px} }
                @keyframes waveBar4 { 0%,100%{height:8px} 50%{height:20px} }
                @keyframes waveBar5 { 0%,100%{height:14px} 55%{height:6px} }
                @keyframes waveRing1 { 0%,100%{transform:scale(1);opacity:0.55} 50%{transform:scale(1.08);opacity:0.35} }
                @keyframes waveRing2 { 0%,100%{transform:scale(1);opacity:0.44} 50%{transform:scale(1.13);opacity:0.26} }
                @keyframes waveRing3 { 0%,100%{transform:scale(1);opacity:0.28} 50%{transform:scale(1.17);opacity:0.15} }
                @keyframes waveRing4 { 0%,100%{transform:scale(1);opacity:0.18} 50%{transform:scale(1.21);opacity:0.09} }
                @keyframes waveRing5 { 0%,100%{transform:scale(1);opacity:0.10} 50%{transform:scale(1.26);opacity:0.05} }
                @keyframes orbPulse   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.07)} }
                @keyframes reelBgScale { 0%{transform:scale(1.0)} 100%{transform:scale(1.06)} }
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

function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ═══════════════════════════════════════════════════════════
//  SINGLE REEL CARD
// ═══════════════════════════════════════════════════════════
function MantraReelCard({ reel, isActive, reelIndex }: { reel: MantraReel; isActive: boolean; reelIndex: number }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showMantra, setShowMantra] = useState(false);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(800 + (reelIndex * 347) % 3000);

    // Auto-play/pause when active changes
    useEffect(() => {
        if (reel.videoSrc) {
            const vid = videoRef.current;
            if (!vid) return;
            if (isActive) {
                const t = setTimeout(() => {
                    vid.muted = false;
                    vid.play()
                        .then(() => setPlaying(true))
                        .catch(() => {
                            vid.muted = true;
                            vid.play().then(() => setPlaying(true)).catch(() => { });
                        });
                    setShowMantra(true);
                }, 350);
                return () => clearTimeout(t);
            } else {
                vid.pause();
                setPlaying(false);
                setShowMantra(false);
            }
        } else {
            const audio = audioRef.current;
            if (!audio) return;
            if (isActive) {
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
        }
    }, [isActive, reel.videoSrc]);

    const togglePlay = useCallback(() => {
        if (reel.videoSrc) {
            const vid = videoRef.current;
            if (!vid) return;
            if (playing) { vid.pause(); setPlaying(false); }
            else { vid.play().then(() => setPlaying(true)).catch(() => { }); }
        } else {
            const audio = audioRef.current;
            if (!audio) return;
            if (playing) { audio.pause(); setPlaying(false); }
            else { audio.play().then(() => setPlaying(true)).catch(() => { }); }
        }
    }, [playing, reel.videoSrc]);

    const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        if (reel.videoSrc) {
            const vid = videoRef.current;
            if (!vid || !duration) return;
            vid.currentTime = ratio * duration;
        } else {
            const audio = audioRef.current;
            if (!audio || !duration) return;
            audio.currentTime = ratio * duration;
        }
    }, [duration, reel.videoSrc]);

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div style={{
            position: 'relative', width: '100%', height: '100dvh',
            scrollSnapAlign: 'start', overflow: 'hidden',
            background: '#000', flexShrink: 0,
        }}>
            {/* ── BACKGROUND ── */}
            {reel.videoSrc ? (
                // Video content reel — play fullscreen with audio
                <video
                    ref={videoRef}
                    src={reel.videoSrc}
                    loop playsInline
                    preload={isActive ? 'auto' : 'none'}
                    onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                    onDurationChange={() => setDuration(videoRef.current?.duration || 0)}
                    onEnded={() => setPlaying(false)}
                    style={{
                        position: 'absolute', inset: 0,
                        width: '100%', height: '100%',
                        objectFit: 'cover',
                        filter: 'brightness(0.48) saturate(1.2)',
                    }}
                />
            ) : (
                // Audio reel — image background + sacred wave rings
                <>
                    <div style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: `url(${reel.imageBg})`,
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        filter: 'brightness(0.38) saturate(1.35)',
                        animation: isActive ? 'reelBgScale 30s ease-in-out infinite alternate' : 'none',
                    }} />

                    {/* Sacred wave ring visualization */}
                    {isActive && (
                        <div style={{
                            position: 'absolute', inset: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            pointerEvents: 'none',
                        }}>
                            {[0, 1, 2, 3, 4].map((i) => (
                                <div key={i} style={{
                                    position: 'absolute',
                                    width: `${100 + i * 65}px`,
                                    height: `${100 + i * 65}px`,
                                    borderRadius: '50%',
                                    border: `${Math.max(0.5, 2 - i * 0.35)}px solid ${reel.color}`,
                                    opacity: playing ? (0.55 - i * 0.10) : (0.15 - i * 0.02),
                                    animation: playing
                                        ? `waveRing${i + 1} ${1.8 + i * 0.5}s ease-in-out ${i * 0.22}s infinite`
                                        : 'none',
                                    transition: 'opacity 0.7s ease',
                                    boxShadow: playing ? `0 0 ${16 + i * 8}px ${reel.color}44` : 'none',
                                }} />
                            ))}

                            {/* Center emoji orb */}
                            <div style={{
                                width: 84, height: 84, borderRadius: '50%',
                                background: `radial-gradient(circle at 38% 32%, ${reel.color}55 0%, ${reel.color}18 55%, transparent 80%)`,
                                border: `1.5px solid ${reel.color}66`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '2.2rem',
                                boxShadow: `0 0 40px ${reel.color}55, 0 0 80px ${reel.color}22`,
                                animation: playing ? 'orbPulse 2.5s ease-in-out infinite' : 'none',
                                transition: 'box-shadow 0.7s ease',
                            }}>
                                {reel.emoji}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Gradient overlays */}
            <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(180deg, rgba(0,0,0,0.65) 0%, transparent 28%, transparent 52%, rgba(0,0,0,0.75) 80%, rgba(0,0,0,0.95) 100%)`,
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', inset: 0,
                background: `radial-gradient(ellipse at 50% 30%, ${reel.color}14 0%, transparent 60%)`,
                pointerEvents: 'none',
            }} />

            {/* ── TOP HEADER ── */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                padding: '2.2rem 1.2rem 0.8rem',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.72) 0%, transparent 100%)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: `${reel.color}20`, border: `1px solid ${reel.color}50`,
                        borderRadius: 999, padding: '0.22rem 0.8rem',
                        backdropFilter: 'blur(12px)',
                    }}>
                        <span style={{ fontSize: '0.85rem' }}>{reel.emoji}</span>
                        <span style={{
                            fontSize: '0.48rem', fontWeight: 800, color: reel.color,
                            letterSpacing: '0.12em', textTransform: 'uppercase',
                            fontFamily: "'Inter', sans-serif",
                            textShadow: `0 0 10px ${reel.color}99`,
                        }}>{reel.category}</span>
                    </div>
                    <div style={{
                        background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 8, padding: '0.2rem 0.55rem',
                        fontSize: '0.48rem', color: 'rgba(255,255,255,0.75)',
                        fontFamily: "'Inter', sans-serif", fontWeight: 600,
                    }}>{reel.isLong ? '🎬 Long' : '⚡ Short'} · {reel.durationLabel}</div>
                </div>

                <motion.h2
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{
                        fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
                        fontSize: 'clamp(1.15rem, 4.5vw, 1.6rem)',
                        fontWeight: 700, color: '#fff',
                        margin: '0.6rem 0 0.1rem',
                        textShadow: `0 0 30px ${reel.color}55, 0 2px 8px rgba(0,0,0,0.8)`,
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

            {/* ── CENTER: Sanskrit text (shown when playing) ── */}
            <AnimatePresence>
                {showMantra && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                        style={{
                            position: 'absolute',
                            top: '50%', left: 0, right: 0,
                            transform: 'translateY(-50%)',
                            textAlign: 'center',
                            padding: '0 1.8rem',
                            width: '100%',
                            boxSizing: 'border-box' as const,
                            pointerEvents: 'none',
                            overflow: 'hidden',
                        }}
                    >
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: `radial-gradient(ellipse at 50% 50%, ${reel.color}18 0%, transparent 70%)`,
                            borderRadius: 24, filter: 'blur(20px)',
                        }} />
                        <p style={{
                            fontFamily: "'Noto Serif Devanagari', 'Mangal', serif",
                            fontSize: 'clamp(1.1rem, 4.5vw, 1.55rem)',
                            lineHeight: 1.7, color: '#fff', fontWeight: 700,
                            textShadow: `0 0 40px ${reel.color}99, 0 2px 16px rgba(0,0,0,0.95)`,
                            whiteSpace: 'pre-line', margin: 0, position: 'relative', zIndex: 1,
                        }}>
                            {reel.mantraText}
                        </p>
                        <p style={{
                            fontFamily: "'Inter', sans-serif", fontSize: '0.58rem',
                            color: `${reel.color}cc`, fontStyle: 'italic',
                            marginTop: '0.8rem', letterSpacing: '0.04em',
                            textShadow: `0 0 12px ${reel.color}66`,
                            position: 'relative', zIndex: 1,
                        }}>
                            {reel.transliteration}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── BOTTOM: Player panel ── */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '0.8rem 1.2rem calc(1.5rem + env(safe-area-inset-bottom))',
                background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 60%, transparent 100%)',
            }}>
                <AnimatePresence>
                    {showMantra && (
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            style={{
                                fontFamily: "'Inter', sans-serif", fontSize: '0.62rem',
                                color: 'rgba(255,255,255,0.65)', fontStyle: 'italic',
                                lineHeight: 1.6, marginBottom: '0.75rem',
                            }}
                        >
                            ✦ {reel.meaning}
                        </motion.p>
                    )}
                </AnimatePresence>

                {/* Glassmorphic player */}
                <div style={{
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    border: `1px solid ${reel.color}28`,
                    borderRadius: 20, padding: '0.75rem 1rem',
                    boxShadow: `0 0 30px ${reel.color}18, 0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)`,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                        <AudioWaveform playing={playing} color={reel.color} />
                        <span style={{
                            fontSize: '0.5rem', color: 'rgba(255,255,255,0.55)',
                            fontFamily: "'Inter', sans-serif", fontWeight: 600, letterSpacing: '0.05em',
                        }}>
                            {formatTime(currentTime)} / {reel.isLong ? reel.durationLabel : formatTime(duration)}
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div
                        onClick={handleSeek}
                        style={{
                            height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.12)',
                            cursor: 'pointer', marginBottom: '0.75rem',
                            position: 'relative', overflow: 'hidden',
                        }}
                    >
                        <div style={{
                            height: '100%', width: `${progress}%`,
                            background: `linear-gradient(90deg, ${reel.color}, ${reel.secondColor})`,
                            borderRadius: 99, boxShadow: `0 0 8px ${reel.color}99`,
                            transition: 'width 0.5s linear',
                        }} />
                    </div>

                    {/* Mantra title — above controls, never shifts button */}
                    <div style={{ marginBottom: '0.55rem' }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#fff', fontFamily: "'Inter', sans-serif", lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {reel.name}
                        </div>
                        <div style={{ fontSize: '0.46rem', color: reel.color, fontFamily: "'Inter', sans-serif", fontWeight: 600, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {reel.deityHi}
                        </div>
                    </div>

                    {/* Controls — fixed 3-column, no text that shifts positions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <AudioWaveform playing={playing} color={reel.color} />

                        {/* ══ World-class glass play/pause button ══ */}
                        <motion.button
                            whileTap={{ scale: 0.86 }}
                            onClick={togglePlay}
                            animate={playing ? {
                                boxShadow: [
                                    `0 0 0 0px ${reel.color}60, 0 0 28px ${reel.color}55, 0 10px 40px rgba(0,0,0,0.55), inset 0 1.5px 0 rgba(255,255,255,0.40), inset 0 -1px 0 rgba(0,0,0,0.14)`,
                                    `0 0 0 8px ${reel.color}00, 0 0 40px ${reel.color}66, 0 10px 40px rgba(0,0,0,0.55), inset 0 1.5px 0 rgba(255,255,255,0.40), inset 0 -1px 0 rgba(0,0,0,0.14)`,
                                ]
                            } : {
                                boxShadow: `0 0 0 1px ${reel.color}30, 0 0 18px ${reel.color}35, 0 8px 28px rgba(0,0,0,0.45), inset 0 1.5px 0 rgba(255,255,255,0.30), inset 0 -1px 0 rgba(0,0,0,0.12)`
                            }}
                            transition={playing ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
                            style={{
                                width: 62, height: 62, borderRadius: '50%',
                                background: 'rgba(255,255,255,0.04)',
                                backdropFilter: 'blur(40px) saturate(220%)',
                                WebkitBackdropFilter: 'blur(40px) saturate(220%)',
                                border: `1px solid rgba(255,255,255,0.18)`,
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                position: 'relative', overflow: 'hidden',
                                flexShrink: 0,
                            }}
                        >
                            {/* Glass specular highlight */}
                            <div style={{ position: 'absolute', top: '6%', left: '12%', width: '55%', height: '32%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.42) 0%, transparent 80%)', borderRadius: '50%', transform: 'rotate(-20deg)', pointerEvents: 'none' }} />
                            {/* Bottom rim shadow */}
                            <div style={{ position: 'absolute', bottom: '5%', left: '15%', width: '70%', height: '18%', background: 'radial-gradient(ellipse, rgba(0,0,0,0.22) 0%, transparent 80%)', borderRadius: '50%', pointerEvents: 'none' }} />
                            {/* Color tint glow */}
                            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(circle at 50% 60%, ${reel.color}28 0%, transparent 70%)`, pointerEvents: 'none' }} />
                            {/* ── SVG Play / Pause icon ── */}
                            <motion.svg
                                key={playing ? 'pause' : 'play'}
                                initial={{ scale: 0.6, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.6, opacity: 0 }}
                                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                                width="26" height="26" viewBox="0 0 24 24"
                                fill="rgba(255,255,255,0.96)"
                                style={{ position: 'relative', zIndex: 2, filter: `drop-shadow(0 0 8px ${reel.color}cc)`, marginLeft: playing ? 0 : '2px' }}
                            >
                                {playing ? (
                                    /* Pause: two rounded rectangles */
                                    <>
                                        <rect x="5" y="4" width="4.5" height="16" rx="2" />
                                        <rect x="14.5" y="4" width="4.5" height="16" rx="2" />
                                    </>
                                ) : (
                                    /* Play: solid rounded triangle */
                                    <path d="M6 4.5v15a1.2 1.2 0 0 0 1.85 1.01l11.6-7.5a1.2 1.2 0 0 0 0-2.02L7.85 3.49A1.2 1.2 0 0 0 6 4.5z" />
                                )}
                            </motion.svg>
                        </motion.button>

                        <Link href="/dhyan-kshetra" style={{ textDecoration: 'none' }}>
                            <motion.div
                                whileTap={{ scale: 0.93 }}
                                style={{
                                    padding: '0.4rem 0.75rem',
                                    background: `${reel.color}18`, border: `1px solid ${reel.color}44`,
                                    borderRadius: 99, fontSize: '0.46rem', color: reel.color,
                                    fontWeight: 700, fontFamily: "'Inter', sans-serif",
                                    letterSpacing: '0.06em', whiteSpace: 'nowrap',
                                    textShadow: `0 0 8px ${reel.color}66`,
                                }}
                            >
                                🧘 Dhyan →
                            </motion.div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── RIGHT REACTION SIDEBAR (Instagram/Reels style) ── */}
            <div style={{
                position: 'absolute', right: '0.75rem', bottom: '13rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.4rem',
                zIndex: 30,
            }} onClick={e => e.stopPropagation()}>
                {/* ❤️ Like with burst particles */}
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* Burst particles — 8-directional SVG hearts */}
                    <AnimatePresence>
                        {liked && [0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
                            <motion.div
                                key={`lb-${deg}`}
                                initial={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
                                animate={{
                                    x: Math.cos((deg * Math.PI) / 180) * 36,
                                    y: Math.sin((deg * Math.PI) / 180) * 36,
                                    opacity: 0, scale: 1.3,
                                }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.55, ease: 'easeOut', delay: i * 0.03 }}
                                style={{ position: 'absolute', top: 12, left: 12, pointerEvents: 'none', zIndex: 20 }}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="#ed4956"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {/* Expanding glow ring */}
                    <AnimatePresence>
                        {liked && (
                            <motion.div
                                key="lring"
                                initial={{ scale: 0.6, opacity: 0.9 }}
                                animate={{ scale: 2.6, opacity: 0 }}
                                exit={{}}
                                transition={{ duration: 0.48, ease: 'easeOut' }}
                                style={{ position: 'absolute', top: 0, left: 0, width: 48, height: 48, borderRadius: '50%', border: '2px solid rgba(237,73,86,0.8)', pointerEvents: 'none', zIndex: 15 }}
                            />
                        )}
                    </AnimatePresence>
                    <motion.button
                        whileTap={{ scale: 0.82 }}
                        onClick={() => { setLiked(l => !l); setLikeCount(c => liked ? c - 1 : c + 1); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: 0 }}
                    >
                        <motion.div
                            animate={liked ? { scale: [1, 1.4, 0.88, 1.1, 1], rotate: [0, -8, 5, -2, 0] } : { scale: 1 }}
                            transition={{ duration: 0.45 }}
                            style={{
                                width: 48, height: 48, borderRadius: '50%',
                                background: liked ? 'rgba(237,73,86,0.2)' : 'rgba(0,0,0,0.45)',
                                backdropFilter: 'blur(16px)',
                                border: liked ? '1.5px solid rgba(237,73,86,0.55)' : '1.5px solid rgba(255,255,255,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: liked ? '0 4px 20px rgba(237,73,86,0.32), 0 0 0 4px rgba(237,73,86,0.08)' : '0 4px 14px rgba(0,0,0,0.5)',
                            }}
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24"
                                fill={liked ? '#ed4956' : 'none'}
                                stroke={liked ? '#ed4956' : 'rgba(255,255,255,0.92)'}
                                strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"
                                style={{ filter: liked ? 'drop-shadow(0 0 6px rgba(237,73,86,0.9))' : 'none', transition: 'filter 0.3s' }}>
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                        </motion.div>
                        <span style={{ fontSize: '0.62rem', color: liked ? '#ed4956' : 'rgba(255,255,255,0.85)', fontFamily: "'Inter',sans-serif", fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                            {likeCount > 999 ? `${(likeCount / 1000).toFixed(1)}K` : likeCount}
                        </span>
                    </motion.button>
                </div>

                {/* 💬 Comment */}
                <motion.button
                    whileTap={{ scale: 0.82 }}
                    onClick={() => { }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: 0 }}
                >
                    <div style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(16px)',
                        border: '1.5px solid rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                    }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                            stroke="rgba(255,255,255,0.92)" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                    </div>
                    <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.85)', fontFamily: "'Inter',sans-serif", fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                        108
                    </span>
                </motion.button>

                {/* 📤 Share */}
                <motion.button
                    whileTap={{ scale: 0.82 }}
                    onClick={async () => {
                        const url = `${window.location.origin}/pranaverse?mantra=${reel.id}`;
                        if (typeof navigator !== 'undefined' && navigator.share) {
                            try { await navigator.share({ title: `🕉️ ${reel.name} — ONE SUTRA`, text: reel.meaning, url }); } catch { }
                        } else {
                            try { navigator.clipboard.writeText(url); } catch { }
                        }
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: 0 }}
                >
                    <div style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(16px)',
                        border: '1.5px solid rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                    }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.92)" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'translateX(1px)' }}>
                            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </div>
                    <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.85)', fontFamily: "'Inter',sans-serif", fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>Share</span>
                </motion.button>
            </div>

            {/* Hidden audio — only for audio-only reels */}
            {!reel.videoSrc && (
                <audio
                    ref={audioRef}
                    src={reel.audioSrc}
                    preload={isActive ? 'auto' : 'none'}
                    onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
                    onDurationChange={() => setDuration(audioRef.current?.duration || 0)}
                    onEnded={() => setPlaying(false)}
                />
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
//  MANTRA REEL FEED — CSS scroll-snap container
// ═══════════════════════════════════════════════════════════
export default function MantraReelFeed({ style, startIndex = 0, onClose }: { style?: React.CSSProperties; startIndex?: number; onClose?: () => void }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeIdx, setActiveIdx] = useState(startIndex);
    const scrolledToStart = useRef(false);

    // Scroll to startIndex on first mount
    useEffect(() => {
        if (scrolledToStart.current || !containerRef.current || startIndex === 0) return;
        scrolledToStart.current = true;
        const cards = containerRef.current.querySelectorAll<HTMLDivElement>('[data-reel-card]');
        if (cards[startIndex]) {
            cards[startIndex].scrollIntoView({ behavior: 'instant' as ScrollBehavior });
        }
    }, [startIndex]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const cards = container.querySelectorAll<HTMLDivElement>('[data-reel-card]');
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.55) {
                        setActiveIdx(Number(entry.target.getAttribute('data-reel-idx')));
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
                height: '100dvh', overflowY: 'scroll',
                scrollSnapType: 'y mandatory', scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                position: 'relative', background: '#000',
                ...style,
            }}
        >
            {/* Close button when used as overlay */}
            {onClose && (
                <button
                    onClick={onClose}
                    style={{
                        position: 'fixed', top: 'max(18px, env(safe-area-inset-top))', left: 16,
                        zIndex: 200, background: 'rgba(0,0,0,0.55)',
                        backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.22)',
                        borderRadius: '50%', width: 42, height: 42, color: '#fff',
                        cursor: 'pointer', fontSize: '1rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 18px rgba(0,0,0,0.6)',
                    }}
                >
                    ✕
                </button>
            )}

            {/* Right-side progress dots */}
            <div style={{
                position: 'fixed', right: 12, top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex', flexDirection: 'column', gap: 6,
                zIndex: 100, pointerEvents: 'none',
            }}>
                {MANTRA_REELS.map((r, i) => (
                    <div key={r.id} style={{
                        width: 3, height: i === activeIdx ? 22 : 6, borderRadius: 99,
                        background: i === activeIdx ? MANTRA_REELS[activeIdx].color : 'rgba(255,255,255,0.2)',
                        transition: 'all 0.35s ease',
                        boxShadow: i === activeIdx ? `0 0 8px ${MANTRA_REELS[activeIdx].color}` : 'none',
                    }} />
                ))}
            </div>

            {MANTRA_REELS.map((reel, idx) => (
                <div key={reel.id} data-reel-card data-reel-idx={idx}>
                    <MantraReelCard reel={reel} isActive={idx === activeIdx} reelIndex={idx} />
                </div>
            ))}
        </div>
    );
}
