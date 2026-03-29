'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ── Time helpers ───────────────────────────────────────────────────────────────
function getTimeSlot() {
    const h = new Date().getHours();
    if (h >= 5 && h < 11) return 'morning';
    if (h >= 11 && h < 17) return 'day';
    if (h >= 17 && h < 21) return 'evening';
    return 'night';
}

const BG_IMAGES: Record<string, string[]> = {
    morning: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1400&fit=crop&q=85',
        'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&h=1400&fit=crop&q=85',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=1400&fit=crop&q=85',
        'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=800&h=1400&fit=crop&q=85',
    ],
    day: [
        'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&h=1400&fit=crop&q=85',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=1400&fit=crop&q=85',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=1400&fit=crop&q=85',
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=1400&fit=crop&q=85',
    ],
    evening: [
        'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=800&h=1400&fit=crop&q=85',
        'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&h=1400&fit=crop&q=85',
        'https://images.unsplash.com/photo-1419833173245-f59e1b93f9ee?w=800&h=1400&fit=crop&q=85',
        'https://images.unsplash.com/photo-1472120435266-53107fd0c44a?w=800&h=1400&fit=crop&q=85',
    ],
    night: [
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=1400&fit=crop&q=85',
        'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=800&h=1400&fit=crop&q=85',
        'https://images.unsplash.com/photo-1532978379173-523e16f371f2?w=800&h=1400&fit=crop&q=85',
        'https://images.unsplash.com/photo-1475274047050-1d0c0975f9f1?w=800&h=1400&fit=crop&q=85',
    ],
};

// ── Video Story definitions ─────────────────────────────────────────────────
interface VideoStory {
    id: string;
    label: string;
    icon: string;
    color: string;
    gradient: string;
    ringColors: [string, string];
    videoSrc: string;
    thumbBg: string;
    description: string;
    isVideo: true;
}

interface StorySlide {
    id: string;
    bg: string;
    accent: string;
    content: React.ReactNode;
}

interface StoryGroup {
    id: string;
    label: string;
    icon: string;
    color: string;
    gradient: string;
    ringColors: [string, string];
    slides: StorySlide[];
    isVideo?: false;
}

type AnyGroup = StoryGroup | VideoStory;

// ── Video Story Data — ALL files from /Slide Videos/ ─────────────────────────
const VIDEO_STORIES: VideoStory[] = [
    {
        id: 'v-dhyan2', label: 'Dhyan', icon: '🧘', isVideo: true,
        color: '#818cf8', gradient: 'linear-gradient(135deg,#6366f1,#4f46e5)',
        ringColors: ['#fbbf24', '#fde68a'],
        videoSrc: '/Slide%20Videos/Dhyan2.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=200&h=200&fit=crop&q=80',
        description: 'Sacred Meditation',
    },
    {
        id: 'v-dhyan4', label: 'Praana', icon: '🌸', isVideo: true,
        color: '#f472b6', gradient: 'linear-gradient(135deg,#ec4899,#be185d)',
        ringColors: ['#fbbf24', '#f472b6'],
        videoSrc: '/Slide%20Videos/Dhyan4.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&h=200&fit=crop&q=80',
        description: 'Pranic Healing',
    },
    {
        id: 'v-dhyan5', label: 'Shakti', icon: '⚡', isVideo: true,
        color: '#fbbf24', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)',
        ringColors: ['#fbbf24', '#fde68a'],
        videoSrc: '/Slide%20Videos/Dhyan5.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&q=80',
        description: 'Divine Energy',
    },
    {
        id: 'v-dhyan7', label: 'Vayuu', icon: '🌀', isVideo: true,
        color: '#a78bfa', gradient: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
        ringColors: ['#fbbf24', '#a78bfa'],
        videoSrc: '/Slide%20Videos/Dhyan7.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&q=80',
        description: 'Breath & Flow',
    },
    {
        id: 'v-dhyan10', label: 'Bodhi', icon: '🌿', isVideo: true,
        color: '#4ade80', gradient: 'linear-gradient(135deg,#22c55e,#16a34a)',
        ringColors: ['#fbbf24', '#4ade80'],
        videoSrc: '/Slide%20Videos/Dhyan10.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=200&fit=crop&q=80',
        description: 'Awakening',
    },
    {
        id: 'v-dhyan11', label: 'Ananda', icon: '✨', isVideo: true,
        color: '#e879f9', gradient: 'linear-gradient(135deg,#d946ef,#a21caf)',
        ringColors: ['#fbbf24', '#e879f9'],
        videoSrc: '/Slide%20Videos/Dhyan11.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=200&h=200&fit=crop&q=80',
        description: 'Pure Bliss',
    },
    {
        id: 'v-kedar', label: 'Kedar', icon: '🏔️', isVideo: true,
        color: '#60a5fa', gradient: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
        ringColors: ['#fbbf24', '#60a5fa'],
        videoSrc: '/Slide%20Videos/Kedar.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1455156218388-5e61b526818b?w=200&h=200&fit=crop&q=80',
        description: 'Kedarnath Yatra',
    },
    {
        id: 'v-shiva', label: 'Shiva', icon: '🔱', isVideo: true,
        color: '#c084fc', gradient: 'linear-gradient(135deg,#9333ea,#7c3aed)',
        ringColors: ['#fbbf24', '#c084fc'],
        videoSrc: '/Slide%20Videos/Shiva.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=200&h=200&fit=crop&q=80',
        description: 'Mahadev Darshan',
    },
    {
        id: 'v-om-namah', label: 'Om Shiva', icon: '🛕', isVideo: true,
        color: '#f9a8d4', gradient: 'linear-gradient(135deg,#db2777,#be185d)',
        ringColors: ['#fbbf24', '#f9a8d4'],
        videoSrc: '/Slide%20Videos/Om%20Namah%20Shivaay%F0%9F%99%8F%F0%9F%8F%BB%F0%9F%9B%95...%F0%9F%93%8D%F0%9F%93%8C%20Timbersaim%20Mahadev%20(%20Chota%20Kailash%20)%20..%23temple%20%23shiv%20%23shiva%20%23mahad.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=200&h=200&fit=crop&q=80',
        description: 'Chota Kailash',
    },
    {
        id: 'v-sandhya', label: 'Sandhya', icon: '🌅', isVideo: true,
        color: '#fb923c', gradient: 'linear-gradient(135deg,#f97316,#ea580c)',
        ringColors: ['#fbbf24', '#fb923c'],
        videoSrc: '/Slide%20Videos/SandhyaMantra.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=200&h=200&fit=crop&q=80',
        description: 'Evening Mantra',
    },
    {
        id: 'v-sacred1', label: 'Sacred', icon: '🌺', isVideo: true,
        color: '#34d399', gradient: 'linear-gradient(135deg,#10b981,#059669)',
        ringColors: ['#fbbf24', '#34d399'],
        videoSrc: '/Slide%20Videos/SaveClip.App_AQNNfA3VTBjMRS0DKZ2tv3-vhevWxwrMPZKhPI1H9xoLpaHrHIJx3ci5R1abFzFby8aZYL9-YQ5vxtaHUmwHUzuh.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=200&h=200&fit=crop&q=80',
        description: 'Sacred Moment',
    },
    {
        id: 'v-sacred2', label: 'Darshan', icon: '🔮', isVideo: true,
        color: '#818cf8', gradient: 'linear-gradient(135deg,#6366f1,#4f46e5)',
        ringColors: ['#fbbf24', '#818cf8'],
        videoSrc: '/Slide%20Videos/SaveClip.App_AQO00LBqdJg_L4Nm4P8HiJPBZYaOlGFEgj32vsgzjb3hcuQ0xDkNYBSDdt7nymEfx9ATsU9C-A_Dcr0eSO5ZVDT0g9jiaWlZ3OpxDAI.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=200&h=200&fit=crop&q=80',
        description: 'Divine Darshan',
    },
    {
        id: 'v-sacred3', label: 'Bhakti', icon: '🙏', isVideo: true,
        color: '#fde68a', gradient: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
        ringColors: ['#fbbf24', '#fde68a'],
        videoSrc: '/Slide%20Videos/SaveClip.App_AQP8N4Skw0SXoFQ7nc9oyvI7KrnvzlivBE6xiEhoNFv-pNRCjmdED51KsXE3jxoDmGBwhbCCd-jS16GMLLWwlHBi.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=200&h=200&fit=crop&q=80',
        description: 'Devotion',
    },
    {
        id: 'v-sacred4', label: 'Aarti', icon: '🪔', isVideo: true,
        color: '#f97316', gradient: 'linear-gradient(135deg,#ea580c,#c2410c)',
        ringColors: ['#fbbf24', '#f97316'],
        videoSrc: '/Slide%20Videos/SaveClip.App_AQP9f7S1Rp42JmgD6FCdl2L7_ym9OeWZ8FJt6Qc0fjXcyoCNqU6QxXZzLiTjT-5v2-16R1mzx0VAsRzyVhf-vfybov5XARoPy6RCRP4.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=200&h=200&fit=crop&q=80',
        description: 'Sacred Aarti',
    },
    {
        id: 'v-kailash10', label: 'Kailash', icon: '🏔', isVideo: true,
        color: '#93c5fd', gradient: 'linear-gradient(135deg,#60a5fa,#3b82f6)',
        ringColors: ['#fbbf24', '#93c5fd'],
        videoSrc: '/Slide%20Videos/kailash10.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1455156218388-5e61b526818b?w=200&h=200&fit=crop&q=80',
        description: 'Sacred Peaks',
    },
    {
        id: 'v-kailash11', label: 'Himalaya', icon: '❄️', isVideo: true,
        color: '#bae6fd', gradient: 'linear-gradient(135deg,#0284c7,#0369a1)',
        ringColors: ['#fbbf24', '#bae6fd'],
        videoSrc: '/Slide%20Videos/kailash11.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=200&h=200&fit=crop&q=80',
        description: 'Himalayan Peaks',
    },
    {
        id: 'v-kailash2', label: 'Mansarovar', icon: '🌊', isVideo: true,
        color: '#38bdf8', gradient: 'linear-gradient(135deg,#0ea5e9,#0284c7)',
        ringColors: ['#fbbf24', '#38bdf8'],
        videoSrc: '/Slide%20Videos/kailash2.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=200&h=200&fit=crop&q=80',
        description: 'Sacred Lake',
    },
    {
        id: 'v-kaolash12', label: 'Shivling', icon: '⛰️', isVideo: true,
        color: '#c084fc', gradient: 'linear-gradient(135deg,#9333ea,#7c3aed)',
        ringColors: ['#fbbf24', '#c084fc'],
        videoSrc: '/Slide%20Videos/kaolash12.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=200&h=200&fit=crop&q=80',
        description: 'Shiv Dham',
    },
    {
        id: 'v-sunset', label: 'Sandhya', icon: '🌇', isVideo: true,
        color: '#fb923c', gradient: 'linear-gradient(135deg,#f97316,#ea580c)',
        ringColors: ['#fbbf24', '#fb923c'],
        videoSrc: '/Slide%20Videos/sunset.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=200&h=200&fit=crop&q=80',
        description: 'Sacred Sunset',
    },
    {
        id: 'v-bhuragni', label: 'Agni', icon: '🔥', isVideo: true,
        color: '#ef4444', gradient: 'linear-gradient(135deg,#dc2626,#b91c1c)',
        ringColors: ['#fbbf24', '#ef4444'],
        videoSrc: '/Slide%20Videos/%E0%A4%AD%E0%A5%82%E0%A4%B0%E0%A4%97%E0%A5%8D%E0%A4%A8%E0%A4%AF%E0%A5%87%20%E0%A4%B8%E0%A5%8D%E0%A4%B5%E0%A4%BE%E0%A4%B9%E0%A4%BE.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&h=200&fit=crop&q=80',
        description: 'Agni Mantra',
    },
    {
        id: 'v-sriyantra', label: 'Sri Yantra', icon: '🔺', isVideo: true,
        color: '#fbbf24', gradient: 'linear-gradient(135deg,#d97706,#b45309)',
        ringColors: ['#fbbf24', '#fde68a'],
        videoSrc: '/Slide%20Videos/%F0%9F%94%B1%20%E0%A4%B6%E0%A5%8D%E0%A4%B0%E0%A5%80%20%E0%A4%AF%E0%A4%82%E0%A4%A4%E0%A5%8D%E0%A4%B0%20%E2%80%94%20%E0%A4%B8%E0%A4%BF%E0%A4%B0%E0%A5%8D%E0%A4%AB%20%E0%A4%8F%E0%A4%95%20%E0%A4%AA%E0%A5%8D%E0%A4%B0%E0%A4%A4%E0%A5%80%E0%A4%95%20%E0%A4%A8%E0%A4%B9%E0%A5%80%E0%A4%82%E2%80%A6%E0%A4%AF%E0%A5%87%20%E0%A4%B9%E0%A5%88%20%E0%A4%9A%E0%A5%87%E0%A4%A4%E0%A4%A8%E0%A4%BE%20%E0%A4%95%E0%A4%BE%20Blueprint%E0%A5%A14%20%E0%A4%A4%E0%A5%8D%E0%A4%B0%E0%A4%BF%E0%A4%95%E0%A5%8B%E0%A4%A3%20%E2%80%94%20%E0%A4%B6%E0%A4%BF%E0%A4%B5%E0%A5%A45%20%E0%A4%A4%E0%A5%8D%E0%A4%B0%E0%A4%BF%E0%A4%95%E0%A5%8B%E0%A4%A3%20%E2%80%94%20%E0%A4%B6%E0%A4%95%E0%A5%8D%E0%A4%A4%E0%A4%BF%E0%A5%A4.mp4',
        thumbBg: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=200&h=200&fit=crop&q=80',
        description: 'Sacred Geometry',
    },
];

// ── Story content helpers ────────────────────────────────────────────────────
const MANTRA_DATA = [
    { sanskrit: 'ॐ नमः शिवाय', roman: 'Om Namah Shivaya', meaning: 'I bow to Shiva — the inner self', color: '#c084fc' },
    { sanskrit: 'गायत्री मन्त्र', roman: 'Om Bhur Bhuva Swah…', meaning: 'We meditate on the divine light of the sun', color: '#fbbf24' },
    { sanskrit: 'ॐ मणि पद्मे हूँ', roman: 'Om Mani Padme Hum', meaning: 'The jewel in the lotus — compassion', color: '#a78bfa' },
    { sanskrit: 'असतो मा सद्गमय', roman: 'Asato Ma Sadgamaya', meaning: 'Lead me from untruth to truth', color: '#34d399' },
    { sanskrit: 'सर्वे भवन्तु सुखिनः', roman: 'Sarve Bhavantu Sukhinah', meaning: 'May all beings be happy', color: '#86efac' },
];
const PORTAL_DATA = [
    { title: 'ACHARYA', icon: '🌿', color: '#a855f7', href: '/acharya-samvad', desc: 'AI-powered Vedic wisdom guru — personalized spiritual guidance' },
    { title: 'MEDITATE', icon: '🧘', color: '#3b82f6', href: '/dhyan-kshetra', desc: 'Sacred mantras & guided meditations for inner stillness' },
    { title: 'INSHORTS', icon: '📰', color: '#d946ef', href: '/outplugs', desc: 'Distraction-free mindful news through a conscious lens' },
    { title: 'RAAG MUSIC', icon: '🎵', color: '#38bdf8', href: '/project-leela', desc: 'Classical ragas matched to the time of day' },
    { title: 'RESONANCE', icon: '🌐', color: '#8b5cf6', href: '/resonance', desc: 'Connect with conscious seekers & sacred stories' },
];
const WISDOM_QUOTES = [
    { text: '"The quiet mind is not empty — it is full of the universe."', source: 'Vedic Sutra' },
    { text: '"Yesterday I was clever. Today I am wise, I am changing myself."', source: 'Rumi' },
    { text: '"Let your actions be your temple. Let stillness be your prayer."', source: 'Bhagavad Gita' },
    { text: '"Rise before the sun, and the day belongs entirely to you."', source: 'Charaka Samhita' },
    { text: '"The moon does not fight. It waits. Patience is its mastery."', source: 'Vedic Wisdom' },
];

function useTimeImages() {
    const slot = getTimeSlot();
    const imgs = BG_IMAGES[slot];
    const day = new Date().getDate();
    return (offset = 0) => imgs[(day + offset) % imgs.length];
}

// ── Slide content components ─────────────────────────────────────────────────
function MantraSlideContent({ m }: { m: typeof MANTRA_DATA[0] }) {
    return (
        <div style={{ padding: '0 2rem', textAlign: 'center' }}>
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                style={{ fontSize: '4.5rem', marginBottom: '1.2rem', filter: `drop-shadow(0 0 30px ${m.color})` }}>🪔</motion.div>
            <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
                style={{ fontFamily: "'Cormorant Garamond','Noto Serif Devanagari',serif", fontSize: 'clamp(1.6rem,6vw,2.2rem)', fontWeight: 600, color: m.color, textShadow: `0 0 30px ${m.color}88`, lineHeight: 1.3, marginBottom: '0.8rem' }}
            >{m.sanskrit}</motion.p>
            <motion.p initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
                style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', fontStyle: 'italic', letterSpacing: '0.04em', marginBottom: '0.5rem' }}
            >{m.roman}</motion.p>
            <motion.p initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
                style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)' }}
            >{m.meaning}</motion.p>
        </div>
    );
}
function WisdomSlideContent({ q }: { q: typeof WISDOM_QUOTES[0] }) {
    return (
        <div style={{ padding: '0 1.5rem', textAlign: 'center' }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring' }}
                style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>✦</motion.div>
            <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(1.2rem,4.5vw,1.5rem)', fontWeight: 500, color: 'rgba(255,255,255,0.92)', textShadow: '0 0 30px rgba(251,191,36,0.3)', lineHeight: 1.55, marginBottom: '1rem', fontStyle: 'italic' }}
            >{q.text}</motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
                style={{ fontSize: '0.7rem', color: 'rgba(251,191,36,0.65)', letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >— {q.source}</motion.p>
        </div>
    );
}
function PortalSlideContent({ p }: { p: typeof PORTAL_DATA[0] }) {
    return (
        <div style={{ padding: '0 1.5rem', textAlign: 'center', width: '100%' }}>
            <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
                style={{ width: 90, height: 90, borderRadius: '50%', margin: '0 auto 1.2rem', background: `radial-gradient(circle at 38% 32%, rgba(255,255,255,0.35) 0%, ${p.color}88 50%, ${p.color}44 100%)`, border: `2px solid ${p.color}66`, boxShadow: `0 0 40px ${p.color}66, 0 0 80px ${p.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}
            >{p.icon}</motion.div>
            <h3 style={{ color: p.color, fontFamily: "'Inter',sans-serif", fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.12em', textShadow: `0 0 20px ${p.color}88`, marginBottom: '0.5rem' }}>{p.title}</h3>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: '1.5rem', padding: '0 0.5rem' }}>{p.desc}</p>
            <Link href={p.href} style={{ textDecoration: 'none' }}>
                <motion.div whileTap={{ scale: 0.96 }} style={{ display: 'inline-block', padding: '0.65rem 2rem', borderRadius: 99, background: `linear-gradient(135deg, ${p.color}, ${p.color}bb)`, color: '#fff', fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.06em', textTransform: 'uppercase', boxShadow: `0 6px 24px ${p.color}55` }}>Enter Portal →</motion.div>
            </Link>
        </div>
    );
}

// ── Video Bubble — shows live video preview through circular window ───────────
function VideoBubble({ story, isViewed, idx }: { story: VideoStory; isViewed: boolean; idx: number }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        v.muted = true;
        v.playsInline = true;
        // Start playing from a random time for visual variety
        v.currentTime = (idx * 7) % 30;
        v.play().catch(() => { });
    }, [idx]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
            {/* Live video preview */}
            <video
                ref={videoRef}
                src={story.videoSrc}
                style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: 'cover', objectPosition: 'center',
                    filter: isViewed ? 'grayscale(0.6) brightness(0.55)' : 'brightness(0.88) saturate(1.1)',
                }}
                muted playsInline loop autoPlay
            />
            {/* Subtle dark gradient from bottom */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.55) 100%)',
                borderRadius: '50%',
            }} />
            {/* Icon overlay center  */}
            <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 2,
            }}>
                <span style={{ fontSize: '1.1rem', filter: `drop-shadow(0 0 8px ${story.color})`, opacity: isViewed ? 0.5 : 1 }}>{story.icon}</span>
            </div>
            {/* Small play badge */}
            {!isViewed && (
                <div style={{
                    position: 'absolute', bottom: 2, right: 2,
                    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
                    borderRadius: '50%', width: 14, height: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.3)',
                }}>
                    <span style={{ fontSize: '0.35rem', marginLeft: 1, color: '#fff' }}>▶</span>
                </div>
            )}
        </div>
    );
}

// ── Full-Screen VIDEO Story Viewer ────────────────────────────────────────────
function VideoStoryViewer({ story, allVideoStories, startIdx, onClose, onFinished }: {
    story: VideoStory; allVideoStories: VideoStory[]; startIdx: number;
    onClose: () => void;
    onFinished?: () => void; // called after last video — to chain into image stories
}) {
    const [currentIdx, setCurrentIdx] = useState(startIdx);
    const [progress, setProgress] = useState(0);
    const [muted, setMuted] = useState(false);
    const [heartActive, setHeartActive] = useState(false);
    const [loveActive, setLoveActive] = useState(false);
    const [heartCount, setHeartCount] = useState(842);
    const [loveCount, setLoveCount] = useState(315);
    const videoRef = useRef<HTMLVideoElement>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const progressRef = useRef(0);
    const VIDEO_DURATION = 30000;

    const current = allVideoStories[currentIdx];

    const clearTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

    const goNext = useCallback(() => {
        clearTimer(); setProgress(0); progressRef.current = 0;
        if (currentIdx < allVideoStories.length - 1) {
            setCurrentIdx(i => i + 1);
        } else {
            // After last video — chain into image stories if handler provided, else close
            if (onFinished) onFinished();
            else onClose();
        }
    }, [currentIdx, allVideoStories.length, onClose, onFinished]);

    const goPrev = useCallback(() => {
        clearTimer(); setProgress(0); progressRef.current = 0;
        if (currentIdx > 0) setCurrentIdx(i => i - 1);
    }, [currentIdx]);

    useEffect(() => {
        clearTimer();
        progressRef.current = 0;
        setProgress(0);
        const tick = 100;
        timerRef.current = setInterval(() => {
            const v = videoRef.current;
            if (v && v.duration) {
                const pct = (v.currentTime / v.duration) * 100;
                progressRef.current = pct;
                setProgress(pct);
                if (pct >= 99) goNext();
            } else {
                progressRef.current += (tick / VIDEO_DURATION) * 100;
                setProgress(progressRef.current);
                if (progressRef.current >= 100) goNext();
            }
        }, tick);
        return clearTimer;
    }, [currentIdx, goNext]);

    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        v.muted = muted;
        v.currentTime = 0;
        v.play().catch(() => { });
    }, [currentIdx, muted]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose, goNext, goPrev]);

    if (!current) return null;

    const fmtCount = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '')}k` : String(n);

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 10001, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
            <style>{`
                @keyframes goldPulse{0%,100%{opacity:0.7}50%{opacity:1}}
                @keyframes shimmerRing{0%{filter:hue-rotate(0deg) brightness(1.1)}100%{filter:hue-rotate(30deg) brightness(1.3)}}
                @keyframes reactionPop{0%{transform:scale(1)}40%{transform:scale(1.45)}70%{transform:scale(0.9)}100%{transform:scale(1)}}
            `}</style>
            <motion.div
                key={currentIdx}
                initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3 }}
                style={{ position: 'relative', width: '100%', maxWidth: 480, height: '100vh', overflow: 'hidden' }}
            >
                <video
                    ref={videoRef}
                    src={current.videoSrc}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    muted={muted} playsInline autoPlay loop
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.75) 0%, transparent 28%, transparent 60%, rgba(0,0,0,0.82) 100%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center 65%, ${current.color}18 0%, transparent 65%)`, pointerEvents: 'none' }} />

                {/* ── Progress bars ── */}
                <div style={{ position: 'absolute', top: 14, left: 12, right: 12, display: 'flex', gap: 3, zIndex: 20 }}>
                    {allVideoStories.map((_, i) => (
                        <div key={i} style={{ flex: 1, height: 2.5, background: 'rgba(255,255,255,0.22)', borderRadius: 2, overflow: 'hidden' }}>
                            <motion.div style={{
                                height: '100%',
                                background: `linear-gradient(90deg, ${current.color}, #fbbf24)`,
                                width: i < currentIdx ? '100%' : i === currentIdx ? `${Math.min(progress, 100)}%` : '0%',
                                borderRadius: 2,
                            }} />
                        </div>
                    ))}
                </div>

                {/* ── Header ── */}
                <div style={{ position: 'absolute', top: 26, left: 14, right: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 42, height: 42, borderRadius: '50%',
                            background: current.gradient,
                            border: `2px solid ${current.color}88`,
                            boxShadow: `0 0 16px ${current.color}88`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.2rem', overflow: 'hidden', position: 'relative',
                        }}>
                            <video src={current.videoSrc} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} muted playsInline autoPlay loop />
                            <span style={{ position: 'relative', zIndex: 1 }}>{current.icon}</span>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', fontFamily: "'Inter',sans-serif", textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}>{current.label}</div>
                            <div style={{ fontSize: '0.58rem', color: `${current.color}cc`, letterSpacing: '0.06em', fontFamily: "'Inter',sans-serif" }}>{current.description} · PranaVerse</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setMuted(m => !m)} style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 36, height: 36, color: '#fff', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{muted ? '🔇' : '🔊'}</button>
                        <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 36, height: 36, color: '#fff', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>
                </div>

                {/* ── Bottom info overlay ── */}
                <div style={{ position: 'absolute', bottom: '10%', left: '1rem', right: '5.5rem', zIndex: 20 }}>
                    <motion.div key={`info-${currentIdx}`} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', border: `1px solid ${current.color}44`, borderRadius: 99, padding: '0.2rem 0.7rem', marginBottom: '0.6rem' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: current.color, boxShadow: `0 0 8px ${current.color}` }} />
                            <span style={{ fontSize: '0.52rem', color: current.color, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Inter',sans-serif" }}>✦ Sacred Video · PranaVerse</span>
                        </div>
                        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(1.6rem,6vw,2.2rem)', fontWeight: 600, color: '#fff', textShadow: '0 2px 20px rgba(0,0,0,0.8)', marginBottom: '0.3rem', lineHeight: 1.2 }}>{current.label}</h2>
                        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.72)', fontStyle: 'italic', letterSpacing: '0.03em' }}>{current.description}</p>
                    </motion.div>
                </div>

                {/* ── Right action bar — ❤️ and 😍 only ── */}
                <div style={{ position: 'absolute', right: '0.75rem', bottom: '14%', display: 'flex', flexDirection: 'column', gap: '1.1rem', alignItems: 'center', zIndex: 20 }}>
                    {/* Heart reaction */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <motion.button
                            whileTap={{ scale: 0.82 }}
                            onClick={() => {
                                setHeartActive(a => !a);
                                setHeartCount(c => heartActive ? c - 1 : c + 1);
                            }}
                            style={{
                                background: heartActive ? 'rgba(239,68,68,0.25)' : 'rgba(0,0,0,0.45)',
                                backdropFilter: 'blur(12px)',
                                border: heartActive ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.15)',
                                borderRadius: 16, width: 48, height: 48,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', fontSize: '1.35rem',
                                animation: heartActive ? 'reactionPop 0.4s ease' : 'none',
                            }}
                        >
                            {heartActive ? '❤️' : '🤍'}
                        </motion.button>
                        <span style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.65)', fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>{fmtCount(heartCount)}</span>
                    </div>
                    {/* Love / Adore reaction */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <motion.button
                            whileTap={{ scale: 0.82 }}
                            onClick={() => {
                                setLoveActive(a => !a);
                                setLoveCount(c => loveActive ? c - 1 : c + 1);
                            }}
                            style={{
                                background: loveActive ? 'rgba(251,191,36,0.22)' : 'rgba(0,0,0,0.45)',
                                backdropFilter: 'blur(12px)',
                                border: loveActive ? '1px solid rgba(251,191,36,0.55)' : '1px solid rgba(255,255,255,0.15)',
                                borderRadius: 16, width: 48, height: 48,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', fontSize: '1.35rem',
                                animation: loveActive ? 'reactionPop 0.4s ease' : 'none',
                            }}
                        >
                            {loveActive ? '😍' : '🤩'}
                        </motion.button>
                        <span style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.65)', fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>{fmtCount(loveCount)}</span>
                    </div>
                </div>

                {/* ── Tap zones ── */}
                <div onClick={goPrev} style={{ position: 'absolute', left: 0, top: 0, width: '38%', height: '100%', zIndex: 15, cursor: 'pointer' }} />
                <div onClick={goNext} style={{ position: 'absolute', right: 0, top: 0, width: '38%', height: '100%', zIndex: 15, cursor: 'pointer' }} />

                {/* ── Story dots ── */}
                <div style={{ position: 'absolute', bottom: '5%', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4, zIndex: 20, maxWidth: '80vw', flexWrap: 'nowrap', overflow: 'hidden' }}>
                    {allVideoStories.slice(Math.max(0, currentIdx - 4), currentIdx + 5).map((s, i) => {
                        const realIdx = i + Math.max(0, currentIdx - 4);
                        return (
                            <button key={s.id} onClick={() => { setCurrentIdx(realIdx); setProgress(0); progressRef.current = 0; }} style={{ width: realIdx === currentIdx ? 18 : 5, height: 5, borderRadius: 3, background: realIdx === currentIdx ? '#fbbf24' : 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer', transition: 'all 0.25s', padding: 0, flexShrink: 0 }} />
                        );
                    })}
                </div>
            </motion.div>
        </motion.div>
    );
}

// ── Full-Screen IMAGE Story Viewer (existing groups) ──────────────────────────
const SLIDE_DURATION = 7000;
function StoryViewer({ groups, startGroupIdx, onClose }: { groups: StoryGroup[]; startGroupIdx: number; onClose: () => void }) {
    const [gIdx, setGIdx] = useState(startGroupIdx);
    const [sIdx, setSIdx] = useState(0);
    const [progress, setProgress] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const progressRef = useRef(0);
    const group = groups[gIdx];
    const slide = group?.slides[sIdx];
    const totalSlides = group?.slides.length ?? 1;

    const clearTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };
    const goNext = useCallback(() => {
        clearTimer(); setProgress(0); progressRef.current = 0;
        if (sIdx < totalSlides - 1) setSIdx(s => s + 1);
        else if (gIdx < groups.length - 1) { setGIdx(g => g + 1); setSIdx(0); }
        else onClose();
    }, [sIdx, totalSlides, gIdx, groups.length, onClose]);
    const goPrev = useCallback(() => {
        clearTimer(); setProgress(0); progressRef.current = 0;
        if (sIdx > 0) setSIdx(s => s - 1);
        else if (gIdx > 0) { setGIdx(g => g - 1); setSIdx(0); }
    }, [sIdx, gIdx]);

    useEffect(() => {
        clearTimer(); progressRef.current = 0; setProgress(0);
        const tick = 80;
        timerRef.current = setInterval(() => {
            progressRef.current += (tick / SLIDE_DURATION) * 100;
            setProgress(progressRef.current);
            if (progressRef.current >= 100) goNext();
        }, tick);
        return clearTimer;
    }, [gIdx, sIdx, goNext]);

    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose, goNext, goPrev]);

    useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);

    if (!group || !slide) return null;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AnimatePresence mode="wait">
                <motion.div key={`${gIdx}-${sIdx}`} initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3 }}
                    style={{ position: 'relative', width: '100%', maxWidth: 480, height: '100vh', overflow: 'hidden' }}>
                    <img src={slide.bg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.45) 70%, rgba(0,0,0,0.88) 100%)' }} />
                    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center 65%, ${slide.accent}22 0%, transparent 65%)` }} />
                    {/* Progress bars */}
                    <div style={{ position: 'absolute', top: 14, left: 12, right: 12, display: 'flex', gap: 4, zIndex: 20 }}>
                        {group.slides.map((_, i) => (
                            <div key={i} style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.25)', borderRadius: 2, overflow: 'hidden' }}>
                                <motion.div style={{ height: '100%', background: `linear-gradient(90deg,${group.color},#fbbf24)`, width: i < sIdx ? '100%' : i === sIdx ? `${Math.min(progress, 100)}%` : '0%', borderRadius: 2 }} />
                            </div>
                        ))}
                    </div>
                    {/* Header */}
                    <div style={{ position: 'absolute', top: 28, left: 14, right: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: group.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', boxShadow: `0 0 16px ${group.color}66`, border: '2px solid rgba(255,255,255,0.35)' }}>{group.icon}</div>
                            <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', fontFamily: "'Inter',sans-serif" }}>{group.label}</div>
                                <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.55)' }}>{sIdx + 1} of {totalSlides}</div>
                            </div>
                        </div>
                        <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 36, height: 36, color: '#fff', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>
                    {/* Content */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                        <AnimatePresence mode="wait">
                            <motion.div key={`c-${gIdx}-${sIdx}`} initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -24, opacity: 0 }} transition={{ duration: 0.32 }} style={{ width: '100%', marginTop: '3rem' }}>
                                {slide.content}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    {/* Group dots */}
                    <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 20 }}>
                        {groups.map((g, i) => (
                            <button key={g.id} onClick={() => { setGIdx(i); setSIdx(0); }} style={{ width: i === gIdx ? 20 : 6, height: 6, borderRadius: 3, background: i === gIdx ? '#fff' : 'rgba(255,255,255,0.35)', border: 'none', cursor: 'pointer', transition: 'all 0.25s', padding: 0 }} />
                        ))}
                    </div>
                    <div onClick={goPrev} style={{ position: 'absolute', left: 0, top: 0, width: '40%', height: '100%', zIndex: 15, cursor: 'pointer' }} />
                    <div onClick={goNext} style={{ position: 'absolute', right: 0, top: 0, width: '40%', height: '100%', zIndex: 15, cursor: 'pointer' }} />
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
}

// ── Main HomeStoryBar ─────────────────────────────────────────────────────────
export default function HomeStoryBar() {
    const getImg = useTimeImages();
    const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
    const [activeGroupIdx, setActiveGroupIdx] = useState<number | null>(null);
    const [activeVideoIdx, setActiveVideoIdx] = useState<number | null>(null);
    const [tasks, setTasks] = useState<Array<{ text: string; done: boolean }>>([]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('vedic_sankalpa');
            if (raw) setTasks(JSON.parse(raw));
        } catch { /* ignore */ }
    }, []);

    // Build image story groups
    const imageGroups: StoryGroup[] = [
        {
            id: 'panchang', label: 'Panchang', icon: '☀️', color: '#fbbf24',
            gradient: 'linear-gradient(135deg,#f59e0b,#d97706)',
            ringColors: ['#fbbf24', '#fde68a'],
            slides: [
                { id: 'p1', bg: getImg(0), accent: '#fbbf24', content: <WisdomSlideContent q={{ text: `Today is ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}. Begin with gratitude.`, source: 'Vedic Calendar' }} /> },
                { id: 'p2', bg: getImg(1), accent: '#fde68a', content: <WisdomSlideContent q={WISDOM_QUOTES[0]} /> },
            ],
        },
        {
            id: 'mantras', label: 'Mantras', icon: '🪔', color: '#c084fc',
            gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)',
            ringColors: ['#fbbf24', '#e879f9'],
            slides: MANTRA_DATA.map((m, i) => ({ id: `m${i}`, bg: getImg(i), accent: m.color, content: <MantraSlideContent m={m} /> })),
        },
        {
            id: 'wisdom', label: 'Wisdom', icon: '📿', color: '#f472b6',
            gradient: 'linear-gradient(135deg,#ec4899,#be185d)',
            ringColors: ['#fbbf24', '#fbcfe8'],
            slides: WISDOM_QUOTES.map((q, i) => ({ id: `w${i}`, bg: getImg(i % 4), accent: '#f472b6', content: <WisdomSlideContent q={q} /> })),
        },
        ...PORTAL_DATA.slice(0, 4).map((portal, pi) => ({
            id: `portal-${portal.title}`, label: portal.title, icon: portal.icon, color: portal.color,
            gradient: `linear-gradient(135deg,${portal.color},${portal.color}99)`,
            ringColors: [portal.color, '#fbbf24'] as [string, string],
            slides: [{ id: `portal-${pi}-s1`, bg: getImg(pi), accent: portal.color, content: <PortalSlideContent p={portal} /> }],
        })),
    ];

    const openImageGroup = (idx: number) => {
        setActiveGroupIdx(idx);
        setViewedIds(v => new Set([...v, imageGroups[idx].id]));
        window.history.pushState({ pvStory: true }, '');
    };
    const openVideoStory = (idx: number) => {
        setActiveVideoIdx(idx);
        setViewedIds(v => new Set([...v, VIDEO_STORIES[idx].id]));
        window.history.pushState({ pvStory: true }, '');
    };

    useEffect(() => {
        if (activeGroupIdx === null && activeVideoIdx === null) return;
        const handler = () => { setActiveGroupIdx(null); setActiveVideoIdx(null); };
        window.addEventListener('popstate', handler);
        return () => window.removeEventListener('popstate', handler);
    }, [activeGroupIdx, activeVideoIdx]);

    return (
        <>
            <style>{`
                @keyframes goldenRingPulse{
                    0%,100%{box-shadow:0 0 0 0px rgba(251,191,36,0),0 0 16px 3px rgba(251,191,36,0.35);}
                    50%{box-shadow:0 0 0 2.5px rgba(251,191,36,0.9),0 0 28px 6px rgba(251,191,36,0.5);}
                }
                @keyframes videoRingPulse{
                    0%,100%{box-shadow:0 0 0 0px rgba(251,191,36,0),0 0 20px 4px rgba(251,191,36,0.4);}
                    50%{box-shadow:0 0 0 3px rgba(251,191,36,1),0 0 36px 8px rgba(251,191,36,0.65);}
                }
                @keyframes storyBubbleFloat{0%,100%{transform:translateY(0);}50%{transform:translateY(-4px);}}
                @keyframes videoShimmer{
                    0%,100%{opacity:0.85}50%{opacity:1}
                }
                .pvStoryBarScroll::-webkit-scrollbar{display:none;}
                .pvVideoRingWrapper{transition:transform 0.18s ease;}
                .pvVideoRingWrapper:active{transform:scale(0.91)!important;}
            `}</style>

            <div className="pvStoryBarScroll" style={{
                display: 'flex', gap: '0.65rem',
                padding: '0.75rem 0.85rem 0.65rem',
                overflowX: 'auto', scrollbarWidth: 'none',
                background: 'linear-gradient(180deg,rgba(0,0,0,0.94) 0%,rgba(0,0,0,0.6) 100%)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(251,191,36,0.06)',
                flexShrink: 0, alignItems: 'flex-start',
            }}>
                {/* "Add Story" */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                    <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1.5px dashed rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', cursor: 'pointer' }}>+</div>
                    <span style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em' }}>Your Story</span>
                </div>

                {/* ── VIDEO STORY BUBBLES (first!) ── */}
                {VIDEO_STORIES.map((story, idx) => {
                    const isViewed = viewedIds.has(story.id);
                    return (
                        <motion.div
                            key={story.id}
                            className="pvVideoRingWrapper"
                            initial={{ opacity: 0, scale: 0.7, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: idx * 0.04, type: 'spring', stiffness: 300, damping: 22 }}
                            onClick={() => openVideoStory(idx)}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
                                flexShrink: 0, cursor: 'pointer',
                                animation: isViewed ? 'none' : `storyBubbleFloat ${3.8 + idx * 0.35}s ease-in-out ${idx * 0.12}s infinite`,
                            }}
                        >
                            {/* Outer gold glow ring */}
                            <div style={{
                                width: 68, height: 68, borderRadius: '50%',
                                padding: 3,
                                background: isViewed
                                    ? 'rgba(255,255,255,0.08)'
                                    : `conic-gradient(#fbbf24 0deg, #fde68a 90deg, ${story.color} 180deg, #fde68a 270deg, #fbbf24 360deg)`,
                                animation: isViewed ? 'none' : `videoRingPulse 2.4s ease-in-out ${idx * 0.22}s infinite, videoShimmer 3s ease-in-out ${idx * 0.18}s infinite`,
                                flexShrink: 0,
                                position: 'relative',
                            }}>
                                {/* Inner black border separator */}
                                <div style={{
                                    width: '100%', height: '100%', borderRadius: '50%',
                                    border: '2.5px solid #000',
                                    overflow: 'hidden',
                                    filter: isViewed ? 'grayscale(0.6) brightness(0.55)' : 'none',
                                }}>
                                    <VideoBubble story={story} isViewed={isViewed} idx={idx} />
                                </div>
                                {/* Video indicator badge */}
                                {!isViewed && (
                                    <div style={{
                                        position: 'absolute', bottom: -1, right: -1,
                                        background: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
                                        borderRadius: '50%', width: 16, height: 16,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '2px solid #000',
                                        boxShadow: '0 0 8px rgba(251,191,36,0.8)',
                                    }}>
                                        <span style={{ fontSize: '0.35rem', color: '#000', fontWeight: 800, marginLeft: 1 }}>▶</span>
                                    </div>
                                )}
                            </div>
                            <span style={{
                                fontSize: '0.48rem', fontFamily: "'Inter',sans-serif", fontWeight: 700,
                                color: isViewed ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.88)',
                                letterSpacing: '0.04em', textAlign: 'center',
                                maxWidth: 66, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>{story.label}</span>
                        </motion.div>
                    );
                })}

                {/* Divider between video and image stories */}
                <div style={{ width: 1, height: 58, background: 'rgba(251,191,36,0.12)', flexShrink: 0, alignSelf: 'center' }} />

                {/* ── IMAGE STORY BUBBLES ── */}
                {imageGroups.map((group, idx) => {
                    const isViewed = viewedIds.has(group.id);
                    return (
                        <motion.div
                            key={group.id}
                            initial={{ opacity: 0, scale: 0.7, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: (idx + VIDEO_STORIES.length) * 0.04, type: 'spring', stiffness: 280, damping: 20 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openImageGroup(idx)}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
                                flexShrink: 0, cursor: 'pointer',
                                animation: isViewed ? 'none' : `storyBubbleFloat ${3.5 + idx * 0.4}s ease-in-out ${idx * 0.15}s infinite`,
                            }}
                        >
                            <div style={{
                                '--rc': group.color,
                                '--rc2': group.color + '55',
                                width: 60, height: 60, borderRadius: '50%', padding: 3,
                                background: isViewed
                                    ? 'rgba(255,255,255,0.1)'
                                    : `conic-gradient(${group.ringColors[0]} 0deg, ${group.ringColors[1]} 180deg, ${group.ringColors[0]} 360deg)`,
                                animation: isViewed ? 'none' : `goldenRingPulse ${2.8 + idx * 0.3}s ease-in-out ${idx * 0.25}s infinite`,
                                flexShrink: 0,
                            } as React.CSSProperties}>
                                <div style={{
                                    width: '100%', height: '100%', borderRadius: '50%', border: '2.5px solid #000',
                                    background: group.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.35rem',
                                    filter: isViewed ? 'grayscale(0.5) brightness(0.65)' : 'none',
                                }}>{group.icon}</div>
                            </div>
                            <span style={{
                                fontSize: '0.48rem', fontFamily: "'Inter',sans-serif", fontWeight: 600,
                                color: isViewed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.82)',
                                letterSpacing: '0.04em', textAlign: 'center',
                                maxWidth: 58, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>{group.label}</span>
                        </motion.div>
                    );
                })}
            </div>

            {/* Full-screen video viewer */}
            <AnimatePresence>
                {activeVideoIdx !== null && (
                    <VideoStoryViewer
                        story={VIDEO_STORIES[activeVideoIdx]}
                        allVideoStories={VIDEO_STORIES}
                        startIdx={activeVideoIdx}
                        onClose={() => setActiveVideoIdx(null)}
                        onFinished={() => {
                            // Chain seamlessly into image story groups
                            setActiveVideoIdx(null);
                            openImageGroup(0);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Full-screen image story viewer */}
            <AnimatePresence>
                {activeGroupIdx !== null && (
                    <StoryViewer
                        groups={imageGroups}
                        startGroupIdx={activeGroupIdx}
                        onClose={() => setActiveGroupIdx(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
