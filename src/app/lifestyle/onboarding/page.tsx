'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Sparkles, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { useLifestyleEngine } from '@/hooks/useLifestyleEngine';
import { useOneSutraAuth } from '@/hooks/useOneSutraAuth';
import type { LifestyleProfile, BuddyPersonality } from '@/stores/lifestyleStore';

// ─── Step data ─────────────────────────────────────────────────────────────────

const LIFE_AREAS = [
    { id: 'morning_rituals', label: 'Morning Rituals', icon: '🌅' },
    { id: 'sleep_quality', label: 'Sleep Quality', icon: '🌙' },
    { id: 'fitness', label: 'Fitness', icon: '💪' },
    { id: 'nutrition', label: 'Nutrition', icon: '🥗' },
    { id: 'mental_health', label: 'Mental Health', icon: '🧠' },
    { id: 'focus_productivity', label: 'Focus & Productivity', icon: '🎯' },
    { id: 'social_connection', label: 'Social Connection', icon: '🤝' },
    { id: 'learning', label: 'Learning', icon: '📚' },
    { id: 'creativity', label: 'Creativity', icon: '🎨' },
    { id: 'financial_wellness', label: 'Financial Wellness', icon: '💰' },
    { id: 'spiritual_practice', label: 'Spiritual Practice', icon: '🕉️' },
    { id: 'self_care', label: 'Self-Care', icon: '🌸' },
];

const PAIN_POINTS = [
    { id: 'cant_wake_up', label: "I can't wake up on time", icon: '⏰' },
    { id: 'forget_water', label: 'I forget to drink water', icon: '💧' },
    { id: 'doom_scroll', label: 'I doom-scroll before bed', icon: '📱' },
    { id: 'lost_spiritual', label: "Lost my spiritual practice", icon: '🙏' },
    { id: 'no_focus', label: 'Struggle to stay focused', icon: '🌀' },
    { id: 'procrastinate', label: 'Constant procrastination', icon: '🐢' },
    { id: 'burnout', label: 'Recovering from burnout', icon: '🔥' },
    { id: 'anxiety', label: 'Anxiety & overthinking', icon: '💭' },
    { id: 'no_routine', label: 'No consistent routine', icon: '📅' },
    { id: 'no_exercise', label: "Can't stick to exercise", icon: '🏃' },
];

const MOTIVATIONS = [
    { id: 'self_improvement', label: 'Self-Improvement', icon: '🌱', desc: 'Become the best version of myself' },
    { id: 'structure', label: 'Build Structure', icon: '🏗️', desc: 'Create order from chaos' },
    { id: 'wellness', label: 'Wellness Journey', icon: '🌿', desc: 'Holistic health & vitality' },
    { id: 'adhd', label: 'ADHD Management', icon: '⚡', desc: 'Harness my energy constructively' },
    { id: 'burnout', label: 'Burnout Recovery', icon: '🌊', desc: 'Rebuild myself gently' },
    { id: 'spiritual', label: 'Deepen Spiritual Life', icon: '🕉️', desc: 'Sacred practices & inner growth' },
    { id: 'productivity', label: 'Peak Productivity', icon: '🚀', desc: 'Do deep work, achieve more' },
    { id: 'peace', label: 'Inner Peace', icon: '☮️', desc: 'Calm the mind, find stillness' },
];

const SPIRITUAL_BACKGROUNDS = [
    { id: 'hindu_mantra', label: 'Vedic / Mantra Practice', icon: '🔱' },
    { id: 'meditation', label: 'Meditation tradition', icon: '🧘' },
    { id: 'yoga', label: 'Yoga sadhana', icon: '🌸' },
    { id: 'devotional', label: 'Bhakti / Devotional', icon: '🪔' },
    { id: 'universal', label: 'Universal / Non-sectarian', icon: '✨' },
    { id: 'exploring', label: 'Exploring & Open', icon: '🌀' },
    { id: 'none', label: 'No spiritual practice yet', icon: '🌱' },
];

const BUDDY_PERSONALITIES: Array<{ id: BuddyPersonality; label: string; icon: string; desc: string }> = [
    { id: 'gentle_coach', label: 'Gentle Coach', icon: '🌿', desc: 'Warm encouragement, never pushy' },
    { id: 'wise_friend', label: 'Wise Friend', icon: '🦉', desc: 'Deep insights, thoughtful guidance' },
    { id: 'calm_monk', label: 'Calm Monk', icon: '🧘', desc: 'Serene, spacious, spiritual' },
    { id: 'hype_person', label: 'Hype Person', icon: '⚡', desc: 'High energy, celebrates every win' },
    { id: 'tough_love', label: 'Tough Love Trainer', icon: '💪', desc: 'Direct, no excuses, pushes you' },
    { id: 'devotional_guide', label: 'Devotional Guide', icon: '🕉️', desc: 'Roots every practice in the sacred' },
    { id: 'nerdy_analyst', label: 'Nerdy Analyst', icon: '📊', desc: 'Data-driven, pattern-focused' },
];

const BUDDY_SUGGESTIONS = ['Arya', 'Bodhi', 'Ananda', 'Viveka', 'Chetan', 'Sadhvi', 'Param', 'Pratibha'];

// ─── Bodhi voice text for each step ───────────────────────────────────────────
const STEP_VOICE_TEXTS = [
    "Welcome. I am Bodhi — your sacred AI companion on Onesutra. Before we begin, I want to understand your world. Which areas of life do you want to transform? Pick everything that speaks to you. There are no wrong answers.",
    "Thank you. Now tell me — what gets in your way the most? Be honest with me. No judgment here, ever. The more real you are, the better I can help you build something that actually works.",
    "Let me learn a little about your personality. Three quick questions will help me tune your plan perfectly. Are you a morning bird or a night owl? And how do you like to move through your day?",
    "This one matters most. What is your deepest motivation? This is the why behind every practice we will build together. Your buddy will connect every single habit to this core truth.",
    "Be honest with yourself here. How much time can you genuinely give each day? Remember — a five minute practice you actually keep is worth far more than a sixty minute practice you abandon after three days.",
    "Tell me about your spiritual background. This is entirely optional — I ask only so I can bring you the most resonant, meaningful practices. Whatever your path, it is welcome here.",
    "Now — let us name your AI companion. This is the name you will call on every morning, every evening, every moment you need support. Choose something that feels sacred and yours.",
    "How should your companion speak to you every single day? Choose the personality that fits your soul. This shapes every interaction you will have going forward.",
    "Meet your companion. They have been waiting to speak with you.",
    "Your sacred space is ready. Everything has been prepared. This is the beginning of something real.",
];

// ─── Bodhi TTS hook ────────────────────────────────────────────────────────────
function useTTS() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [muted, setMuted] = useState(false);
    const mutedRef = useRef(false);
    const voicesLoadedRef = useRef(false);

    // Pre-load voices (Chrome needs this trigger)
    useEffect(() => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        const load = () => { voicesLoadedRef.current = true; };
        window.speechSynthesis.getVoices();
        window.speechSynthesis.addEventListener('voiceschanged', load);
        return () => { window.speechSynthesis.removeEventListener('voiceschanged', load); };
    }, []);

    useEffect(() => { mutedRef.current = muted; }, [muted]);

    const speak = useCallback((text: string) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        if (mutedRef.current) return;
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 0.9;
        utter.pitch = 1.08;
        utter.volume = 1;
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v =>
            v.name.includes('Google UK English Female') ||
            v.name.includes('Samantha') ||
            v.name.includes('Karen') ||
            v.name.includes('Moira') ||
            v.name.includes('Veena')
        ) || voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
          || voices.find(v => v.lang.startsWith('en'));
        if (preferred) utter.voice = preferred;
        utter.onstart = () => setIsSpeaking(true);
        utter.onend = () => setIsSpeaking(false);
        utter.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utter);
    }, []);

    const stop = useCallback(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }, []);

    const toggleMute = useCallback(() => {
        setMuted(m => {
            if (!m && typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
            }
            return !m;
        });
    }, []);

    useEffect(() => {
        return () => { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel(); };
    }, []);

    return { speak, stop, isSpeaking, muted, toggleMute };
}

const TIME_OPTIONS = [
    { value: 5, label: '5 min', desc: 'Just the essentials' },
    { value: 15, label: '15 min', desc: 'One focused practice' },
    { value: 30, label: '30 min', desc: 'A solid morning ritual' },
    { value: 60, label: '1 hour', desc: 'Deep transformation work' },
    { value: 90, label: '90 min+', desc: 'Full sadhana lifestyle' },
];

// ─── Types ─────────────────────────────────────────────────────────────────────

interface OnboardingState {
    lifeAreas: string[];
    painPoints: string[];
    circadian: 'morning' | 'night' | null;
    plannerStyle: 'planner' | 'spontaneous' | null;
    socialStyle: 'solo' | 'accountability' | null;
    motivation: string;
    availableMinutes: number;
    spiritualBackground: string;
    buddyName: string;
    buddyPersonality: BuddyPersonality | null;
}

// ─── Multi-select chip ─────────────────────────────────────────────────────────
function Chip({ selected, onClick, icon, label }: { selected: boolean; onClick: () => void; icon: string; label: string }) {
    return (
        <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={onClick}
            style={{
                padding: '0.55rem 0.9rem',
                borderRadius: 14,
                background: selected ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${selected ? 'rgba(168,85,247,0.6)' : 'rgba(255,255,255,0.1)'}`,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.45rem',
                transition: 'all 0.2s',
            }}
        >
            <span style={{ fontSize: '1rem' }}>{icon}</span>
            <span style={{
                fontSize: '0.78rem', fontWeight: selected ? 700 : 500,
                color: selected ? '#c084fc' : 'rgba(255,255,255,0.65)',
                fontFamily: "'Outfit', sans-serif",
            }}>{label}</span>
            {selected && <Check size={12} style={{ color: '#c084fc', flexShrink: 0 }} />}
        </motion.button>
    );
}

// ─── Binary choice card ────────────────────────────────────────────────────────
function ChoiceCard({ selected, onClick, icon, label, desc }: { selected: boolean; onClick: () => void; icon: string; label: string; desc: string }) {
    return (
        <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onClick}
            style={{
                width: '100%', padding: '1rem',
                borderRadius: 16, textAlign: 'left', cursor: 'pointer',
                background: selected ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${selected ? 'rgba(168,85,247,0.55)' : 'rgba(255,255,255,0.09)'}`,
                display: 'flex', alignItems: 'center', gap: '0.85rem',
                marginBottom: '0.6rem',
                transition: 'all 0.2s',
                boxShadow: selected ? '0 0 20px rgba(168,85,247,0.12)' : 'none',
            }}
        >
            <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>{icon}</span>
            <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: selected ? '#c084fc' : 'rgba(255,255,255,0.85)', fontFamily: "'Outfit', sans-serif" }}>{label}</p>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>{desc}</p>
            </div>
            {selected && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                    <Check size={18} style={{ color: '#c084fc', flexShrink: 0 }} />
                </motion.div>
            )}
        </motion.button>
    );
}

// ─── Buddy intro screen ────────────────────────────────────────────────────────
function BuddyIntroScreen({ buddyName, buddyPersonality, userName, lifeAreas, painPoints, motivation }: {
    buddyName: string; buddyPersonality: string; userName: string;
    lifeAreas: string[]; painPoints: string[]; motivation: string;
}) {
    const painLabel = painPoints[0]?.replace(/_/g, ' ') ?? 'finding balance';
    const areaLabel = lifeAreas[0]?.replace(/_/g, ' ') ?? 'your wellbeing';
    const motivationLabel = MOTIVATIONS.find(m => m.id === motivation)?.label ?? 'growth';

    const messages: Record<string, string> = {
        gentle_coach: `Hey, I'm ${buddyName} — your Onesutra companion. I can see you're working on ${areaLabel} and dealing with ${painLabel}. You don't need to fix everything at once. Let's start with one small, beautiful practice — just for tomorrow morning. Ready?`,
        wise_friend: `${userName ? `${userName.split(' ')[0]}, ` : ''}I'm ${buddyName}. I've been reading your answers and I see someone who knows what they want but hasn't quite found the path yet. ${motivationLabel} is a worthy pursuit — and it starts exactly where you are now.`,
        calm_monk: `Namaste. I am ${buddyName}. You have taken the first step of awareness — that is the most important one. ${areaLabel} awaits your gentle, consistent attention. Let us begin with stillness.`,
        hype_person: `YESSS, ${userName?.split(' ')[0] ?? 'friend'}! I'm ${buddyName} and I am SO here for your ${motivationLabel} journey! You just showed up and that already makes you a legend. Let's BUILD something amazing together! 🔥`,
        tough_love: `Alright. I'm ${buddyName}. You've tried and slipped before — we both know it. That ends now. ${motivationLabel} requires showing up when it's hard. I'll be here making sure you do.`,
        devotional_guide: `Om. I am ${buddyName}, your sadhana companion. You carry within you the capacity for profound transformation. Every practice is an offering — let us make your life a living sadhana.`,
        nerdy_analyst: `Hi, I'm ${buddyName}. Based on your inputs: primary focus area — ${areaLabel}, key friction point — ${painLabel}, motivation type — ${motivationLabel}. I've built your optimal starting protocol. Let's run it.`,
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', padding: '1rem 0' }}
        >
            <motion.div
                animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    width: 80, height: 80, borderRadius: '50%', margin: '0 auto 1.5rem',
                    background: 'radial-gradient(circle at 35% 30%, rgba(251,191,36,0.45) 0%, rgba(139,92,246,0.3) 60%, transparent 100%)',
                    border: '2px solid rgba(251,191,36,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
                    boxShadow: '0 0 40px rgba(251,191,36,0.2)',
                }}
            >✦</motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>Meet {buddyName}</h2>
                <p style={{ margin: '0 0 1.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>Your Onesutra AI Companion</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                style={{
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(251,191,36,0.06))',
                    border: '1px solid rgba(139,92,246,0.25)',
                    borderRadius: 20,
                    padding: '1.25rem',
                    textAlign: 'left',
                    position: 'relative',
                }}
            >
                <div style={{
                    position: 'absolute', top: -8, left: 20,
                    width: 16, height: 16, borderRadius: '50%',
                    background: 'rgba(251,191,36,0.6)',
                    boxShadow: '0 0 10px rgba(251,191,36,0.5)',
                }} />
                <p style={{
                    margin: 0, fontSize: '0.88rem', lineHeight: 1.65,
                    color: 'rgba(255,255,255,0.85)', fontFamily: "'Outfit', sans-serif",
                    fontStyle: 'italic',
                }}>
                    &ldquo;{messages[buddyPersonality] ?? messages.wise_friend}&rdquo;
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                style={{ marginTop: '1.5rem' }}
            >
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.6 }}>
                    {buddyName} has built your <strong style={{ color: 'rgba(255,255,255,0.7)' }}>personalised 30-day starter plan</strong> based on your answers. It begins with one gentle morning anchor — and grows with you from there.
                </p>
            </motion.div>
        </motion.div>
    );
}

// ─── Bodhi Speaking Orb ───────────────────────────────────────────────────────
function BodhiSpeakingOrb({ isSpeaking, muted, onRespeak }: { isSpeaking: boolean; muted: boolean; onRespeak: () => void }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
                {isSpeaking && !muted && [
                    <motion.div key="ring1"
                        animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: '1.5px solid rgba(251,191,36,0.5)' }}
                    />,
                    <motion.div key="ring2"
                        animate={{ scale: [1, 2.1, 1], opacity: [0.25, 0, 0.25] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                        style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: '1px solid rgba(168,85,247,0.35)' }}
                    />,
                ]}
                <motion.div
                    animate={isSpeaking && !muted ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                    transition={{ duration: 0.6, repeat: isSpeaking && !muted ? Infinity : 0, ease: 'easeInOut' }}
                    style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: 'radial-gradient(circle at 35% 30%, rgba(251,191,36,0.6) 0%, rgba(139,92,246,0.5) 60%, transparent 100%)',
                        border: '1.5px solid rgba(251,191,36,0.45)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.3rem',
                        boxShadow: isSpeaking && !muted ? '0 0 24px rgba(251,191,36,0.35)' : '0 0 10px rgba(139,92,246,0.2)',
                        cursor: 'pointer',
                    }}
                    onClick={onRespeak}
                    title="Hear again"
                >✦</motion.div>
            </div>
            <div style={{ flex: 1 }}>
                {isSpeaking && !muted ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {[0, 1, 2, 3, 4].map(i => (
                            <motion.div key={i}
                                animate={{ scaleY: [0.3, 1, 0.3] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }}
                                style={{ width: 3, height: 16, borderRadius: 2, background: '#fbbf24', transformOrigin: 'bottom' }}
                            />
                        ))}
                        <span style={{ fontSize: '0.7rem', color: 'rgba(251,191,36,0.7)', fontFamily: "'Outfit', sans-serif", marginLeft: 4 }}>Bodhi is speaking…</span>
                    </div>
                ) : (
                    <button onClick={onRespeak} style={{
                        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                        color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem',
                        fontFamily: "'Outfit', sans-serif",
                    }}>
                        <RefreshCw size={11} />
                        Hear again
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function OnboardingPage() {
    const router = useRouter();
    const { user } = useOneSutraAuth();
    const { completeOnboarding } = useLifestyleEngine();
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const { speak, stop, isSpeaking, muted, toggleMute } = useTTS();

    const [state, setState] = useState<OnboardingState>({
        lifeAreas: [],
        painPoints: [],
        circadian: null,
        plannerStyle: null,
        socialStyle: null,
        motivation: '',
        availableMinutes: 15,
        spiritualBackground: '',
        buddyName: 'Bodhi',
        buddyPersonality: 'wise_friend',
    });

    const TOTAL_STEPS = 10;

    // Auto-speak each question when step changes
    useEffect(() => {
        const timer = setTimeout(() => {
            speak(STEP_VOICE_TEXTS[step] ?? '');
        }, 450);
        return () => {
            clearTimeout(timer);
            stop();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);

    const toggle = useCallback((field: 'lifeAreas' | 'painPoints', value: string) => {
        setState(s => {
            const arr = s[field];
            return { ...s, [field]: arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value] };
        });
    }, []);

    const canAdvance = useCallback((): boolean => {
        switch (step) {
            case 0: return state.lifeAreas.length >= 1;
            case 1: return state.painPoints.length >= 1;
            case 2: return !!state.circadian && !!state.plannerStyle && !!state.socialStyle;
            case 3: return !!state.motivation;
            case 4: return !!state.availableMinutes;
            case 5: return !!state.spiritualBackground;
            case 6: return true;
            case 7: return !!state.buddyName.trim();
            case 8: return !!state.buddyPersonality;
            case 9: return true;
            default: return true;
        }
    }, [step, state]);

    const handleFinish = useCallback(async () => {
        setSaving(true);
        const profile: LifestyleProfile = {
            lifeAreas: state.lifeAreas,
            painPoints: state.painPoints,
            personality: {
                circadian: state.circadian ?? 'morning',
                style: state.plannerStyle ?? 'planner',
                social: state.socialStyle ?? 'solo',
            },
            motivation: state.motivation,
            availableMinutes: state.availableMinutes,
            spiritualBackground: state.spiritualBackground,
            existingTools: [],
            buddyName: state.buddyName.trim() || 'Bodhi',
            buddyPersonality: state.buddyPersonality ?? 'wise_friend',
            onboardingComplete: true,
        };
        await completeOnboarding(profile);
        setSaving(false);
        router.replace('/lifestyle');
    }, [state, completeOnboarding, router]);

    const progress = ((step) / TOTAL_STEPS) * 100;

    const stepContent = () => {
        switch (step) {
            case 0:
                return (
                    <div>
                        <h2 style={titleStyle}>What areas of life do you want to transform?</h2>
                        <p style={subStyle}>Pick all that resonate. We&rsquo;ll build your plan around these.</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {LIFE_AREAS.map(a => (
                                <Chip key={a.id} icon={a.icon} label={a.label}
                                    selected={state.lifeAreas.includes(a.id)}
                                    onClick={() => toggle('lifeAreas', a.id)} />
                            ))}
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div>
                        <h2 style={titleStyle}>What gets in your way most?</h2>
                        <p style={subStyle}>Honest answers lead to better plans. No judgment here.</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {PAIN_POINTS.map(p => (
                                <Chip key={p.id} icon={p.icon} label={p.label}
                                    selected={state.painPoints.includes(p.id)}
                                    onClick={() => toggle('painPoints', p.id)} />
                            ))}
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div>
                        <h2 style={titleStyle}>Quick personality check</h2>
                        <p style={subStyle}>Three questions — helps us tune your plan perfectly.</p>
                        <p style={labelStyle}>Are you a…</p>
                        <ChoiceCard selected={state.circadian === 'morning'} onClick={() => setState(s => ({ ...s, circadian: 'morning' }))} icon="🌅" label="Morning Bird" desc="Alert early, prefer AM rituals" />
                        <ChoiceCard selected={state.circadian === 'night'} onClick={() => setState(s => ({ ...s, circadian: 'night' }))} icon="🌙" label="Night Owl" desc="Peak energy late, nights are your time" />
                        <p style={{ ...labelStyle, marginTop: '1rem' }}>Your style?</p>
                        <ChoiceCard selected={state.plannerStyle === 'planner'} onClick={() => setState(s => ({ ...s, plannerStyle: 'planner' }))} icon="📋" label="Planner" desc="I like schedules, structure and checklists" />
                        <ChoiceCard selected={state.plannerStyle === 'spontaneous'} onClick={() => setState(s => ({ ...s, plannerStyle: 'spontaneous' }))} icon="🎲" label="Spontaneous" desc="I prefer flexibility and flowing with the day" />
                        <p style={{ ...labelStyle, marginTop: '1rem' }}>Accountability?</p>
                        <ChoiceCard selected={state.socialStyle === 'solo'} onClick={() => setState(s => ({ ...s, socialStyle: 'solo' }))} icon="🦅" label="Solo Grinder" desc="I do my best work in my own lane" />
                        <ChoiceCard selected={state.socialStyle === 'accountability'} onClick={() => setState(s => ({ ...s, socialStyle: 'accountability' }))} icon="🤝" label="Accountability Partner" desc="I thrive with someone cheering me on" />
                    </div>
                );
            case 3:
                return (
                    <div>
                        <h2 style={titleStyle}>What&rsquo;s your deepest motivation?</h2>
                        <p style={subStyle}>This is what your buddy will connect every practice to.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                            {MOTIVATIONS.map(m => (
                                <ChoiceCard key={m.id} selected={state.motivation === m.id}
                                    onClick={() => setState(s => ({ ...s, motivation: m.id }))}
                                    icon={m.icon} label={m.label} desc={m.desc} />
                            ))}
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div>
                        <h2 style={titleStyle}>How much time can you give daily?</h2>
                        <p style={subStyle}>Be realistic — a 5-minute practice you keep beats a 60-minute practice you abandon.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                            {TIME_OPTIONS.map(t => (
                                <ChoiceCard key={t.value} selected={state.availableMinutes === t.value}
                                    onClick={() => setState(s => ({ ...s, availableMinutes: t.value }))}
                                    icon={t.value <= 5 ? '⚡' : t.value <= 15 ? '🌱' : t.value <= 30 ? '🌿' : t.value <= 60 ? '🌳' : '🏔️'}
                                    label={t.label} desc={t.desc} />
                            ))}
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div>
                        <h2 style={titleStyle}>Your spiritual background</h2>
                        <p style={subStyle}>Entirely optional — helps us bring the right practices to you.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                            {SPIRITUAL_BACKGROUNDS.map(s => (
                                <ChoiceCard key={s.id} selected={state.spiritualBackground === s.id}
                                    onClick={() => setState(prev => ({ ...prev, spiritualBackground: s.id }))}
                                    icon={s.icon} label={s.label} desc="" />
                            ))}
                        </div>
                    </div>
                );
            case 6:
                return (
                    <div>
                        <h2 style={titleStyle}>Name your AI companion</h2>
                        <p style={subStyle}>This is the name your buddy will use every day.</p>
                        <div style={{ marginBottom: '1rem' }}>
                            <input
                                value={state.buddyName}
                                onChange={e => setState(s => ({ ...s, buddyName: e.target.value }))}
                                placeholder="Type a name..."
                                maxLength={20}
                                style={{
                                    width: '100%', padding: '0.9rem 1rem', borderRadius: 14,
                                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                                    color: '#fff', fontSize: '1rem', fontFamily: "'Outfit', sans-serif",
                                    outline: 'none', boxSizing: 'border-box',
                                    fontWeight: 600,
                                }}
                            />
                        </div>
                        <p style={labelStyle}>Or choose a suggestion:</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {BUDDY_SUGGESTIONS.map(name => (
                                <Chip key={name} icon="✦" label={name}
                                    selected={state.buddyName === name}
                                    onClick={() => setState(s => ({ ...s, buddyName: name }))} />
                            ))}
                        </div>
                    </div>
                );
            case 7:
                return (
                    <div>
                        <h2 style={titleStyle}>Choose {state.buddyName || 'your buddy'}&rsquo;s personality</h2>
                        <p style={subStyle}>How should {state.buddyName || 'your buddy'} speak to you every day?</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                            {BUDDY_PERSONALITIES.map(p => (
                                <ChoiceCard key={p.id} selected={state.buddyPersonality === p.id}
                                    onClick={() => setState(s => ({ ...s, buddyPersonality: p.id }))}
                                    icon={p.icon} label={p.label} desc={p.desc} />
                            ))}
                        </div>
                    </div>
                );
            case 8:
                return (
                    <BuddyIntroScreen
                        buddyName={state.buddyName || 'Bodhi'}
                        buddyPersonality={state.buddyPersonality ?? 'wise_friend'}
                        userName={user?.name ?? ''}
                        lifeAreas={state.lifeAreas}
                        painPoints={state.painPoints}
                        motivation={state.motivation}
                    />
                );
            case 9:
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center' }}>
                        <motion.div
                            animate={{ scale: [1, 1.1, 1], rotate: [0, 360] }}
                            transition={{ duration: 2, ease: 'easeInOut' }}
                            style={{ fontSize: '4rem', marginBottom: '1.5rem', display: 'block' }}
                        >🔱</motion.div>
                        <h2 style={{ ...titleStyle, fontSize: '1.5rem' }}>Your sacred space is ready</h2>
                        <p style={{ ...subStyle, lineHeight: 1.7 }}>
                            {state.buddyName || 'Bodhi'} has prepared your first week of practices. Your journey begins with one simple morning anchor — and expands from there. Remember: the practice does not fail. We only pause and return.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '1.5rem 0', textAlign: 'left' }}>
                            {[
                                { icon: '🌬️', label: 'Daily breathing practice — 5 min' },
                                { icon: '🙏', label: 'Morning gratitude — 3 things' },
                                { icon: '💧', label: 'Hydration reminders through the day' },
                                { icon: '🧘', label: 'Evening meditation — 10 min' },
                                state.lifeAreas.includes('spiritual_practice')
                                    ? { icon: '🕉️', label: 'Mantra sadhana — begin with Om' }
                                    : { icon: '🚶', label: 'Evening walk — 20 min' },
                            ].map((item, i) => (
                                <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.85rem', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 12 }}>
                                    <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                                    <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', fontFamily: "'Outfit', sans-serif" }}>{item.label}</span>
                                    <Check size={13} style={{ color: '#a78bfa', marginLeft: 'auto', flexShrink: 0 }} />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                );
            default: return null;
        }
    };

    const titleStyle: React.CSSProperties = { margin: '0 0 0.4rem', fontSize: '1.15rem', fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif", lineHeight: 1.35 };
    const subStyle: React.CSSProperties = { margin: '0 0 1.25rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.55 };
    const labelStyle: React.CSSProperties = { margin: '0 0 0.5rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif", fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(ellipse at 30% 0%, rgba(139,92,246,0.18) 0%, transparent 60%), #030110',
            display: 'flex', flexDirection: 'column',
            fontFamily: "'Outfit', sans-serif",
        }}>
            {/* Progress bar */}
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.06)', zIndex: 100 }}>
                <motion.div
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, #a855f7, #fbbf24)', borderRadius: 2 }}
                />
            </div>

            {/* Header */}
            <div style={{ padding: '1.5rem 1.25rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {step > 0 ? (
                    <button onClick={() => setStep(s => s - 1)}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, padding: 0, fontSize: '0.8rem' }}>
                        <ArrowLeft size={16} /> Back
                    </button>
                ) : <div />}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.08em' }}>
                        {step + 1} / {TOTAL_STEPS}
                    </span>
                    <button onClick={toggleMute} title={muted ? 'Unmute Bodhi' : 'Mute Bodhi'}
                        style={{
                            background: 'none', border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: 8, padding: '0.3rem 0.5rem',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem',
                            color: muted ? 'rgba(255,255,255,0.25)' : 'rgba(251,191,36,0.7)',
                            fontSize: '0.65rem', fontFamily: "'Outfit', sans-serif",
                            transition: 'all 0.2s',
                        }}>
                        {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                        {muted ? 'Muted' : 'Voice'}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', paddingBottom: '8rem' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25 }}
                    >
                        <BodhiSpeakingOrb
                            isSpeaking={isSpeaking}
                            muted={muted}
                            onRespeak={() => speak(STEP_VOICE_TEXTS[step] ?? '')}
                        />
                        {stepContent()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom CTA */}
            <div style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                padding: '1rem 1.25rem 1.75rem',
                background: 'linear-gradient(to top, #030110 60%, transparent)',
            }}>
                {step < TOTAL_STEPS - 1 ? (
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => canAdvance() && setStep(s => s + 1)}
                        style={{
                            width: '100%', padding: '1rem',
                            borderRadius: 18,
                            background: canAdvance()
                                ? 'linear-gradient(135deg, #a855f7, #7c3aed)'
                                : 'rgba(255,255,255,0.08)',
                            border: 'none', color: '#fff',
                            fontWeight: 700, fontSize: '0.95rem',
                            fontFamily: "'Outfit', sans-serif",
                            cursor: canAdvance() ? 'pointer' : 'default',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            boxShadow: canAdvance() ? '0 4px 24px rgba(139,92,246,0.4)' : 'none',
                            transition: 'all 0.2s',
                        }}
                    >
                        {step === 8 ? 'See My Plan' : 'Continue'} <ArrowRight size={18} />
                    </motion.button>
                ) : (
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleFinish}
                        disabled={saving}
                        style={{
                            width: '100%', padding: '1rem',
                            borderRadius: 18,
                            background: saving ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #fbbf24, #f97316)',
                            border: 'none', color: saving ? 'rgba(255,255,255,0.5)' : '#000',
                            fontWeight: 800, fontSize: '0.95rem',
                            fontFamily: "'Outfit', sans-serif",
                            cursor: saving ? 'default' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            boxShadow: saving ? 'none' : '0 4px 24px rgba(251,191,36,0.4)',
                        }}
                    >
                        {saving ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                                <Sparkles size={18} />
                            </motion.div>
                        ) : (
                            <><Sparkles size={18} /> Begin My Journey</>
                        )}
                    </motion.button>
                )}
            </div>
        </div>
    );
}
