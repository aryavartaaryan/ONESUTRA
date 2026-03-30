'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    ArrowLeft, Sparkles, Brain, TrendingUp, Rocket, BookOpen,
    Flame, Star, ChevronRight, Users, Zap, Globe, Heart, Sun, Moon
} from 'lucide-react';

/* ─────────── DATA ─────────── */

const MODERN_SKILLS = [
    {
        icon: '🤖',
        title: 'Artificial Intelligence',
        subtitle: 'Machine Learning · GPT · Neural Nets',
        desc: 'Learn AI from scratch — prompt engineering, building AI products, automation & the future of work.',
        color: '#00d4ff',
        glow: 'rgba(0,212,255,0.3)',
        tag: 'Modern',
    },
    {
        icon: '📈',
        title: 'Financial Planning',
        subtitle: 'Wealth · Investing · Freedom',
        desc: 'Master personal finance, SIP investing, stock market wisdom, and building generational wealth.',
        color: '#fbbf24',
        glow: 'rgba(251,191,36,0.3)',
        tag: 'Modern',
    },
    {
        icon: '🚀',
        title: 'Startup Incubation',
        subtitle: 'Idea → Product → Market',
        desc: 'From ideation to launch — build your startup with mentorship, resources, and a community of builders.',
        color: '#f472b6',
        glow: 'rgba(244,114,182,0.3)',
        tag: 'Modern',
    },
    {
        icon: '🌐',
        title: 'Digital Marketing',
        subtitle: 'Brand · Reach · Monetize',
        desc: 'Build a powerful online presence. SEO, content marketing, social media growth & brand storytelling.',
        color: '#34d399',
        glow: 'rgba(52,211,153,0.3)',
        tag: 'Modern',
    },
    {
        icon: '💻',
        title: 'Technology & Coding',
        subtitle: 'Full Stack · Web3 · Cloud',
        desc: 'Learn to build real products. Web development, app development, blockchain, and cloud platforms.',
        color: '#a78bfa',
        glow: 'rgba(167,139,250,0.3)',
        tag: 'Modern',
    },
    {
        icon: '🧠',
        title: 'Leadership & Mindset',
        subtitle: 'Think · Lead · Inspire',
        desc: 'Ancient principles of Chanakya Niti + modern psychology to become a visionary leader.',
        color: '#fb923c',
        glow: 'rgba(251,146,60,0.3)',
        tag: 'Modern',
    },
];

const ANCIENT_WISDOM = [
    {
        icon: '📖',
        title: 'Bhagavad Gita',
        subtitle: 'श्रीमद्भगवद्गीता',
        desc: '18 chapters of eternal wisdom — karma yoga, dharma, and the art of living with purpose and detachment.',
        color: '#f59e0b',
        glow: 'rgba(245,158,11,0.3)',
        tag: 'Ancient',
        sanskrit: 'कर्मण्येवाधिकारस्ते',
    },
    {
        icon: '🕉️',
        title: 'Upanishads',
        subtitle: 'उपनिषद् — Brahma Vidya',
        desc: 'The secret science of consciousness — Atman, Brahman, and the ultimate reality of existence.',
        color: '#c084fc',
        glow: 'rgba(192,132,252,0.3)',
        tag: 'Ancient',
        sanskrit: 'अहम् ब्रह्मास्मि',
    },
    {
        icon: '🌞',
        title: 'Vedas',
        subtitle: 'ऋग्वेद · यजुर्वेद · सामवेद · अथर्ववेद',
        desc: 'The oldest knowledge on earth — rituals, science, cosmology, medicine, and the laws of the universe.',
        color: '#fcd34d',
        glow: 'rgba(252,211,77,0.3)',
        tag: 'Ancient',
        sanskrit: 'एको अहम् बहुस्याम',
    },
    {
        icon: '🪷',
        title: 'Sanskrit & Darshan',
        subtitle: 'देवभाषा · Philosophy',
        desc: 'Learn the language of the gods and the six schools of Indian philosophy — Nyaya, Vaisheshika, Vedanta & more.',
        color: '#6ee7b7',
        glow: 'rgba(110,231,183,0.3)',
        tag: 'Ancient',
        sanskrit: 'सत्यम् शिवम् सुन्दरम्',
    },
    {
        icon: '🔥',
        title: 'Yoga & Pranayama',
        subtitle: 'आत्म-शक्ति · Breathwork',
        desc: "Patanjali's Ashtanga Yoga, pranayama techniques, and the science of mastering body, breath, and mind.",
        color: '#f87171',
        glow: 'rgba(248,113,113,0.3)',
        tag: 'Ancient',
        sanskrit: 'योगः चित्तवृत्ति निरोधः',
    },
    {
        icon: '⚡',
        title: 'Chanakya Niti',
        subtitle: 'Arthashastra · Strategy',
        desc: 'Timeless political, ethical, and economic strategy from Acharya Chanakya — the original startup advisor.',
        color: '#38bdf8',
        glow: 'rgba(56,189,248,0.3)',
        tag: 'Ancient',
        sanskrit: 'शक्तस्य भूषणं क्षमा',
    },
];

const STARTUP_COMMUNITY = [
    { icon: '💡', stat: '500+', label: 'Startup Ideas Mentored' },
    { icon: '🏆', stat: '120+', label: 'Products Launched' },
    { icon: '🤝', stat: '10K+', label: 'Community Members' },
    { icon: '🌏', stat: '40+', label: 'Cities Represented' },
];

const TESTIMONIALS = [
    { name: 'Aryan K.', city: 'Mumbai', text: 'Gurukul taught me AI and Bhagavad Gita together — it literally changed my life path.' },
    { name: 'Priya S.', city: 'Bangalore', text: 'The startup incubation community helped me launch my first product in 60 days!' },
    { name: 'Rahul M.', city: 'Delhi', text: 'Learning Vedanta alongside financial planning gave me clarity wealth alone cannot buy.' },
];

/* ─────────── CARD COMPONENT ─────────── */

function SkillCard({ item, index }: { item: typeof MODERN_SKILLS[0] & { sanskrit?: string }; index: number }) {
    const [hovered, setHovered] = useState(false);
    return (
        <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08, duration: 0.5 }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: 'relative',
                background: hovered
                    ? `linear-gradient(135deg, rgba(255,255,255,0.07) 0%, ${item.glow} 100%)`
                    : 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                border: `1px solid ${hovered ? item.color : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '20px',
                padding: '1.6rem',
                cursor: 'pointer',
                transition: 'all 0.35s ease',
                boxShadow: hovered ? `0 0 30px ${item.glow}, 0 8px 32px rgba(0,0,0,0.4)` : '0 4px 16px rgba(0,0,0,0.2)',
                backdropFilter: 'blur(12px)',
                overflow: 'hidden',
            }}
        >
            {/* Tag pill */}
            <div style={{
                position: 'absolute', top: '1rem', right: '1rem',
                background: `${item.color}22`, border: `1px solid ${item.color}55`,
                borderRadius: '20px', padding: '2px 10px', fontSize: '0.65rem',
                color: item.color, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
                {item.tag}
            </div>

            <div style={{ fontSize: '2.4rem', marginBottom: '0.8rem', filter: hovered ? `drop-shadow(0 0 12px ${item.color})` : 'none', transition: 'filter 0.3s' }}>
                {item.icon}
            </div>

            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', margin: '0 0 0.25rem', fontFamily: "'Inter', sans-serif" }}>
                {item.title}
            </h3>
            <p style={{ color: item.color, fontSize: '0.75rem', fontWeight: 600, margin: '0 0 0.75rem', opacity: 0.9 }}>
                {item.subtitle}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                {item.desc}
            </p>

            {'sanskrit' in item && item.sanskrit && (
                <div style={{
                    marginTop: '1rem', padding: '0.5rem 0.75rem',
                    background: `${item.color}15`, borderLeft: `3px solid ${item.color}`,
                    borderRadius: '0 8px 8px 0', fontSize: '0.8rem',
                    color: item.color, fontStyle: 'italic', fontFamily: 'serif',
                }}>
                    {item.sanskrit}
                </div>
            )}

            <motion.div
                animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : -8 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1rem', color: item.color, fontSize: '0.8rem', fontWeight: 600 }}
            >
                <span>Explore</span><ChevronRight size={14} />
            </motion.div>
        </motion.div>
    );
}

/* ─────────── MAIN PAGE ─────────── */

export default function GurkulVedicSangrah() {
    const [activeTab, setActiveTab] = useState<'modern' | 'ancient' | 'startup'>('modern');

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(ellipse at 20% 0%, #1a0533 0%, #0d0d1a 40%, #000 100%)',
            fontFamily: "'Inter', sans-serif",
            color: '#fff',
            overflowX: 'hidden',
        }}>

            {/* ── Ambient background particles ── */}
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
                {[...Array(18)].map((_, i) => (
                    <motion.div key={i}
                        animate={{ y: [0, -30, 0], opacity: [0.1, 0.4, 0.1] }}
                        transition={{ duration: 4 + i * 0.7, repeat: Infinity, delay: i * 0.4 }}
                        style={{
                            position: 'absolute',
                            width: i % 3 === 0 ? '6px' : '4px', height: i % 3 === 0 ? '6px' : '4px',
                            borderRadius: '50%',
                            background: i % 2 === 0 ? '#f59e0b' : '#a78bfa',
                            left: `${5 + i * 5.5}%`, top: `${10 + (i * 13) % 80}%`,
                            boxShadow: `0 0 10px currentColor`,
                        }}
                    />
                ))}
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>

                {/* ── TOP NAV ── */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1.2rem 1.5rem 0',
                }}>
                    <Link href="/" style={{ textDecoration: 'none' }}>
                        <motion.div whileTap={{ scale: 0.92 }} style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '50px', padding: '0.5rem 1rem',
                            color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', fontWeight: 500,
                        }}>
                            <ArrowLeft size={16} /> Home
                        </motion.div>
                    </Link>
                    <div style={{
                        background: 'linear-gradient(90deg, #f59e0b, #a78bfa)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.05em',
                    }}>
                        🪔 GURUKUL
                    </div>
                </div>

                {/* ── HERO ── */}
                <div style={{ textAlign: 'center', padding: '3rem 1.5rem 2rem' }}>
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, type: 'spring' }}
                        style={{ marginBottom: '1.5rem' }}
                    >
                        {/* Golden Diya Icon */}
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <motion.div
                                animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
                                transition={{ duration: 2.5, repeat: Infinity }}
                                style={{
                                    position: 'absolute', inset: '-20px', borderRadius: '50%',
                                    background: 'radial-gradient(circle, rgba(245,158,11,0.2) 0%, transparent 70%)',
                                }}
                            />
                            <div style={{ fontSize: '4rem', lineHeight: 1, filter: 'drop-shadow(0 0 24px #f59e0b)' }}>🪔</div>
                        </div>
                    </motion.div>

                    <motion.h1
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.7 }}
                        style={{
                            fontSize: 'clamp(2rem, 7vw, 3.5rem)',
                            fontWeight: 900,
                            lineHeight: 1.15,
                            margin: '0 0 0.75rem',
                            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 30%, #a78bfa 70%, #818cf8 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.02em',
                        }}
                    >
                        गुरुकुल
                    </motion.h1>

                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        style={{ color: '#fbbf24', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.75rem' }}
                    >
                        Where Ancient Wisdom Meets Modern Mastery
                    </motion.p>

                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', maxWidth: '420px', margin: '0 auto 2rem', lineHeight: 1.7 }}
                    >
                        The world's premier Gurukul — teaching <strong style={{ color: '#00d4ff' }}>AI, Finance & Startups</strong> alongside the sacred knowledge of <strong style={{ color: '#fbbf24' }}>Bhagavad Gita, Upanishads & Vedas</strong>.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}
                    >
                        <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                            onClick={() => setActiveTab('startup')}
                            style={{
                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                border: 'none', borderRadius: '50px', padding: '0.75rem 1.8rem',
                                color: '#000', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
                                boxShadow: '0 0 20px rgba(245,158,11,0.4)',
                                display: 'flex', alignItems: 'center', gap: '6px',
                            }}
                        >
                            <Rocket size={16} /> Join Startup Community
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                            onClick={() => setActiveTab('ancient')}
                            style={{
                                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '50px', padding: '0.75rem 1.8rem',
                                color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '6px',
                            }}
                        >
                            <BookOpen size={16} /> Explore Ancient Wisdom
                        </motion.button>
                    </motion.div>
                </div>

                {/* ── STATS BAR ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{
                        display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap',
                        gap: '0.5rem', margin: '0 1rem 2.5rem',
                        background: 'linear-gradient(90deg, rgba(245,158,11,0.08), rgba(167,139,250,0.08))',
                        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '1.25rem 1rem',
                    }}
                >
                    {STARTUP_COMMUNITY.map((s, i) => (
                        <div key={i} style={{ textAlign: 'center', flex: '1 1 80px' }}>
                            <div style={{ fontSize: '1.4rem', marginBottom: '2px' }}>{s.icon}</div>
                            <div style={{
                                fontSize: '1.4rem', fontWeight: 900, lineHeight: 1,
                                background: 'linear-gradient(90deg, #fbbf24, #a78bfa)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            }}>{s.stat}</div>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', marginTop: '2px' }}>{s.label}</div>
                        </div>
                    ))}
                </motion.div>

                {/* ── DIVIDER QUOTE ── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    style={{ textAlign: 'center', padding: '0 1.5rem 2rem' }}
                >
                    <div style={{
                        display: 'inline-block', padding: '0.75rem 1.5rem',
                        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
                        borderRadius: '16px', maxWidth: '380px',
                    }}>
                        <p style={{ color: '#fbbf24', fontStyle: 'italic', fontSize: '0.9rem', margin: 0, fontFamily: 'serif', lineHeight: 1.6 }}>
                            "न हि ज्ञानेन सदृशं पवित्रमिह विद्यते"
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem', margin: '0.4rem 0 0' }}>
                            Nothing is as purifying as knowledge — Bhagavad Gita 4.38
                        </p>
                    </div>
                </motion.div>

                {/* ── TAB SWITCHER ── */}
                <div style={{ padding: '0 1rem', marginBottom: '1.75rem' }}>
                    <div style={{
                        display: 'flex', gap: '0.5rem',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '16px', padding: '0.4rem',
                    }}>
                        {([
                            { id: 'modern' as const, label: 'Modern Skills', icon: '🤖', color: '#00d4ff' },
                            { id: 'ancient' as const, label: 'Ancient Wisdom', icon: '🕉️', color: '#fbbf24' },
                            { id: 'startup' as const, label: 'Startup Hub', icon: '🚀', color: '#f472b6' },
                        ]).map(tab => (
                            <motion.button
                                key={tab.id}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    flex: 1, padding: '0.65rem 0.5rem', borderRadius: '12px', cursor: 'pointer',
                                    background: activeTab === tab.id
                                        ? `linear-gradient(135deg, ${tab.color}22, ${tab.color}11)`
                                        : 'transparent',
                                    border: activeTab === tab.id ? `1px solid ${tab.color}44` : '1px solid transparent',
                                    color: activeTab === tab.id ? tab.color : 'rgba(255,255,255,0.45)',
                                    fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.25s',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                                }}
                            >
                                <span style={{ fontSize: '1.1rem' }}>{tab.icon}</span>
                                <span style={{ lineHeight: 1.2 }}>{tab.label}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* ── CONTENT PANELS ── */}
                <AnimatePresence mode="wait">
                    {activeTab === 'modern' && (
                        <motion.div
                            key="modern"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                            transition={{ duration: 0.35 }}
                            style={{ padding: '0 1rem 2rem' }}
                        >
                            <div style={{ marginBottom: '1.25rem' }}>
                                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', margin: '0 0 0.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Brain size={20} color="#00d4ff" /> Modern Skills for the New World
                                </h2>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.83rem', margin: 0 }}>
                                    Practical, in-demand skills taught by industry practitioners & Gurukul mentors
                                </p>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                                {MODERN_SKILLS.map((item, i) => (
                                    <SkillCard key={i} item={item} index={i} />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'ancient' && (
                        <motion.div
                            key="ancient"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                            transition={{ duration: 0.35 }}
                            style={{ padding: '0 1rem 2rem' }}
                        >
                            <div style={{ marginBottom: '1.25rem' }}>
                                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', margin: '0 0 0.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Sun size={20} color="#fbbf24" /> Ancient Knowledge of the Rishis
                                </h2>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.83rem', margin: 0 }}>
                                    Timeless wisdom from Vedic seers — unlock the secrets of the universe within
                                </p>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                                {ANCIENT_WISDOM.map((item, i) => (
                                    <SkillCard key={i} item={item} index={i} />
                                ))}
                            </div>

                            {/* Quick links to existing Vedic content */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                style={{ marginTop: '1.5rem' }}
                            >
                                <h3 style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                    📚 Sacred Portals Inside Gurukul
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                                    {[
                                        { href: '/laghu-sandhya', icon: '✨', title: 'Laghu Sandhya', desc: 'Live Vedic ritual with Voice AI Acharya', color: '#fbbf24' },
                                        { href: '/vedic-sangrah', icon: '🔥', title: 'Vedic Mantra Sangrah', desc: 'Sandhya & Agnihotra mantras with meanings', color: '#f87171' },
                                        { href: '/jyotirlinga', icon: '☀️', title: '12 Jyotirlingas', desc: 'Sacred Shiva shrines and their glory', color: '#a78bfa' },
                                        { href: '/ancient-temples', icon: '🏛️', title: 'Ancient Temples', desc: "India's most ancient & magnificent temples", color: '#34d399' },
                                    ].map((link, i) => (
                                        <Link key={i} href={link.href} style={{ textDecoration: 'none' }}>
                                            <motion.div
                                                whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.06)' }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                                    padding: '0.9rem 1rem', borderRadius: '14px',
                                                    background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.07)`,
                                                    transition: 'all 0.25s',
                                                }}
                                            >
                                                <span style={{ fontSize: '1.5rem' }}>{link.icon}</span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{link.title}</div>
                                                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>{link.desc}</div>
                                                </div>
                                                <ChevronRight size={16} color={link.color} />
                                            </motion.div>
                                        </Link>
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {activeTab === 'startup' && (
                        <motion.div
                            key="startup"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                            transition={{ duration: 0.35 }}
                            style={{ padding: '0 1rem 2rem' }}
                        >
                            {/* Hero card */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{
                                    background: 'linear-gradient(135deg, rgba(244,114,182,0.12) 0%, rgba(167,139,250,0.12) 100%)',
                                    border: '1px solid rgba(244,114,182,0.25)', borderRadius: '24px',
                                    padding: '2rem 1.5rem', textAlign: 'center', marginBottom: '1.5rem',
                                    position: 'relative', overflow: 'hidden',
                                }}
                            >
                                <div style={{
                                    position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px',
                                    background: 'radial-gradient(circle, rgba(244,114,182,0.25) 0%, transparent 70%)',
                                    borderRadius: '50%',
                                }} />
                                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🚀</div>
                                <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.5rem', margin: '0 0 0.5rem' }}>
                                    Startup Incubation Hub
                                </h2>
                                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
                                    From a spark of an idea to a market-ready product — the Gurukul startup community fuels your entrepreneurial journey with Vedic wisdom and modern tools.
                                </p>
                                <motion.button
                                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                                    style={{
                                        background: 'linear-gradient(135deg, #f472b6, #a78bfa)',
                                        border: 'none', borderRadius: '50px', padding: '0.75rem 2rem',
                                        color: '#fff', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
                                        boxShadow: '0 0 24px rgba(244,114,182,0.35)',
                                    }}
                                >
                                    Apply for Incubation →
                                </motion.button>
                            </motion.div>

                            {/* Startup journey steps */}
                            <h3 style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                Your Startup Journey
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '2rem' }}>
                                {[
                                    { step: '01', icon: '💡', title: 'Idea Validation', desc: 'Find your dharmic mission. Validate with community feedback and market research.', color: '#fbbf24' },
                                    { step: '02', icon: '🧪', title: 'Product Development', desc: 'Build your MVP with AI tools, coding sprints, and Gurukul mentors by your side.', color: '#00d4ff' },
                                    { step: '03', icon: '📢', title: 'Go To Market', desc: 'Launch with digital marketing, storytelling, and the power of community backing.', color: '#f472b6' },
                                    { step: '04', icon: '🌱', title: 'Scale & Grow', desc: 'Attract investors, expand your team, and build a business with purpose and profit.', color: '#34d399' },
                                ].map((s, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        style={{
                                            display: 'flex', gap: '1rem', alignItems: 'flex-start',
                                            padding: '1rem', background: 'rgba(255,255,255,0.03)',
                                            border: `1px solid ${s.color}22`, borderRadius: '16px',
                                        }}
                                    >
                                        <div style={{
                                            minWidth: '36px', height: '36px', borderRadius: '10px',
                                            background: `${s.color}22`, border: `1px solid ${s.color}44`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.2rem',
                                        }}>
                                            {s.icon}
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                <span style={{ color: s.color, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em' }}>STEP {s.step}</span>
                                                <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{s.title}</span>
                                            </div>
                                            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Testimonials */}
                            <h3 style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                🌟 What Our Students Say
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {TESTIMONIALS.map((t, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 12 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        style={{
                                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                            borderRadius: '16px', padding: '1rem 1.25rem',
                                        }}
                                    >
                                        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 0.6rem', fontStyle: 'italic' }}>
                                            "{t.text}"
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{
                                                width: '28px', height: '28px', borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #f59e0b, #a78bfa)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.75rem', fontWeight: 700, color: '#000',
                                            }}>
                                                {t.name[0]}
                                            </div>
                                            <div>
                                                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.8rem' }}>{t.name}</div>
                                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>{t.city}</div>
                                            </div>
                                            <div style={{ marginLeft: 'auto' }}>
                                                {'★★★★★'.split('').map((s, si) => (
                                                    <span key={si} style={{ color: '#fbbf24', fontSize: '0.7rem' }}>{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── FUSION BANNER ── */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{
                        margin: '0 1rem 2rem',
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(167,139,250,0.15) 50%, rgba(0,212,255,0.1) 100%)',
                        border: '1px solid rgba(245,158,11,0.25)',
                        borderRadius: '24px', padding: '2rem 1.5rem', textAlign: 'center',
                        position: 'relative', overflow: 'hidden',
                    }}
                >
                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: '24px',
                        background: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.01) 20px, rgba(255,255,255,0.01) 21px)',
                    }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🕉️ ✦ 🤖</div>
                        <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.4rem', margin: '0 0 0.75rem' }}>
                            The Gurukul Difference
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.88rem', lineHeight: 1.7, margin: '0 0 1.5rem' }}>
                            We are the only institution where a student learns <span style={{ color: '#00d4ff', fontWeight: 700 }}>Machine Learning</span> in the morning and meditates on <span style={{ color: '#fbbf24', fontWeight: 700 }}>Brahma Sutras</span> in the evening. Where your startup pitch is refined by <span style={{ color: '#f472b6', fontWeight: 700 }}>Chanakya's Arthashastra</span>.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                            {[
                                { icon: '🧬', text: 'Holistic Curriculum' },
                                { icon: '🌅', text: 'Daily Sadhana' },
                                { icon: '💼', text: 'Career Ready' },
                                { icon: '🌺', text: 'Community Driven' },
                            ].map((f, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', fontWeight: 600 }}>
                                    <span>{f.icon}</span> {f.text}
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* ── FOOTER ENROLL CTA ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ padding: '0 1rem 3rem', textAlign: 'center' }}
                >
                    <div style={{
                        background: 'linear-gradient(135deg, #0f0f1f, #1a0533)',
                        border: '1px solid rgba(245,158,11,0.2)', borderRadius: '24px',
                        padding: '2rem 1.5rem',
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🪔</div>
                        <h3 style={{ color: '#fff', fontWeight: 900, fontSize: '1.3rem', margin: '0 0 0.5rem' }}>
                            Begin Your Journey
                        </h3>
                        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                            Join thousands of students who are mastering both worlds — the modern marketplace and the timeless universe within.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.04, boxShadow: '0 0 36px rgba(245,158,11,0.5)' }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                border: 'none', borderRadius: '50px', padding: '0.9rem 2.5rem',
                                color: '#000', fontWeight: 900, fontSize: '1rem', cursor: 'pointer',
                                boxShadow: '0 0 24px rgba(245,158,11,0.35)', letterSpacing: '0.03em',
                            }}
                        >
                            ✨ Enroll in Gurukul — Free
                        </motion.button>
                        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', marginTop: '0.75rem' }}>
                            No fees to begin. Learn at your own pace. Transform your life.
                        </p>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}
