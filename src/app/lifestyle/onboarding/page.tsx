'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    ChevronRight, ChevronLeft, Check, Sparkles,
    User, Heart, Zap, Target, Shield, Compass, Star,
    CloudRain, Flame, Leaf, Wind, Sun, Moon
} from 'lucide-react';
import { useLifestyleEngine } from '@/hooks/useLifestyleEngine';
import { useOneSutraAuth } from '@/hooks/useOneSutraAuth';
import type { LifestyleProfile, BuddyPersonality } from '@/stores/lifestyleStore';
import { useCircadianUnsplash } from '@/hooks/useCircadianUnsplash';
import { useLanguage } from '@/context/LanguageContext';
import { useGeminiTTS } from '@/hooks/useGeminiTTS';
import { useSpeechInput } from '@/hooks/useSpeechInput';

// ── Types ────────────────────────────────────────────────────────────────────

interface QuestionOption {
    id: string;
    label: string;
    desc?: string;
    icon?: React.ReactNode;
}

interface Step {
    id: string;
    section: 'personal' | 'lifestyle';
    question: string;
    subtext?: string;
    type: 'text' | 'choice' | 'multi-choice' | 'number' | 'date';
    options?: QuestionOption[];
    placeholder?: string;
}

// ── Questions Data ────────────────────────────────────────────────────────────

const ONBOARDING_STEPS: Step[] = [
    {
        id: 'name',
        section: 'personal',
        question: 'What is your name?',
        subtext: 'Your name will appear across OneSUTRA.',
        type: 'text',
        placeholder: 'Enter your name...',
    },
    {
        id: 'dob',
        section: 'personal',
        question: 'What is your date of birth?',
        subtext: 'Optional — you can skip this if you prefer.',
        type: 'date',
        placeholder: 'DD/MM/YYYY',
    },
    {
        id: 'occupation',
        section: 'personal',
        question: 'What do you do?',
        subtext: 'Helps focus your productivity tools.',
        type: 'choice',
        options: [
            { id: 'student', label: 'Student', desc: 'Learning and growing' },
            { id: 'professional', label: 'Professional', desc: 'Working in a job or career' },
            { id: 'creative', label: 'Creative / Artist', desc: 'Creative work or freelancing' },
            { id: 'entrepreneur', label: 'Entrepreneur', desc: 'Running a business' },
            { id: 'home_maker', label: 'Home Maker', desc: 'Managing home and family' },
        ],
    },
    {
        id: 'gender',
        section: 'personal',
        question: 'What is your gender?',
        subtext: 'We welcome everyone.',
        type: 'choice',
        options: [
            { id: 'male', label: '♂️ Male' },
            { id: 'female', label: '♀️ Female' },
            { id: 'non_binary', label: '⚧️ Non-Binary' },
            { id: 'prefer_not', label: '🤝 Prefer not to say' },
        ],
    },
    {
        id: 'lifeAreas',
        section: 'lifestyle',
        question: 'Which areas do you want to improve?',
        subtext: 'Select all that apply.',
        type: 'multi-choice',
        options: [
            { id: 'morning_rituals', label: 'Morning Rituals' },
            { id: 'sleep_quality', label: 'Sleep Quality' },
            { id: 'focus_productivity', label: 'Focus & Productivity' },
            { id: 'fitness', label: 'Physical Fitness' },
            { id: 'spiritual_practice', label: 'Spiritual Practice' },
            { id: 'mental_health', label: 'Mental Wellness' },
        ],
    },
    {
        id: 'painPoints',
        section: 'lifestyle',
        question: 'What gets in your way the most?',
        subtext: 'Select all that apply.',
        type: 'multi-choice',
        options: [
            { id: 'doom_scroll', label: 'Doom-scrolling' },
            { id: 'procrastinate', label: 'Procrastination' },
            { id: 'anxiety', label: 'Daily Anxiety' },
            { id: 'no_routine', label: 'Lack of Routine' },
            { id: 'burnout', label: 'Burnout' },
        ],
    },
    {
        id: 'availableMinutes',
        section: 'lifestyle',
        question: 'How many minutes can you give daily?',
        subtext: 'Consistency matters more than duration.',
        type: 'choice',
        options: [
            { id: '5', label: '5 Minutes', desc: 'Micro-habits' },
            { id: '15', label: '15 Minutes', desc: 'Daily practice' },
            { id: '30', label: '30 Minutes', desc: 'Committed routine' },
            { id: '60', label: '60+ Minutes', desc: 'Deep transformation' },
        ],
    },
];

// ── Hindi Translations ───────────────────────────────────────────────────────

const ONBOARDING_STEPS_HI: Step[] = [
    {
        id: 'name',
        section: 'personal',
        question: 'आपका नाम क्या है?',
        subtext: 'आपका नाम OneSUTRA में दिखाया जाएगा।',
        type: 'text',
        placeholder: 'अपना नाम लिखें...',
    },
    {
        id: 'dob',
        section: 'personal',
        question: 'आपकी जन्म तारीख क्या है?',
        subtext: 'चाहें तो बता सकते हैं, या छोड़ सकते हैं।',
        type: 'date',
        placeholder: 'DD/MM/YYYY',
    },
    {
        id: 'occupation',
        section: 'personal',
        question: 'आप क्या काम करते हैं?',
        subtext: 'आपके उत्पादकता उपकरणों को केंद्रित करने में मदद करता है।',
        type: 'choice',
        options: [
            { id: 'student', label: 'विद्यार्थी', desc: 'पढ़ाई और सीखना' },
            { id: 'professional', label: 'नौकरीपेशा', desc: 'किसी पद या करियर में काम' },
            { id: 'creative', label: 'रचनात्मक / कलाकार', desc: 'रचनात्मक या फ्रीलांस काम' },
            { id: 'entrepreneur', label: 'उद्यमी', desc: 'व्यवसाय चलाना' },
            { id: 'home_maker', label: 'गृहिणी', desc: 'घर और परिवार संभालना' },
        ],
    },
    {
        id: 'gender',
        section: 'personal',
        question: 'आपका लिंग क्या है?',
        subtext: 'हम सभी का स्वागत करते हैं।',
        type: 'choice',
        options: [
            { id: 'male', label: '♂️ पुरुष' },
            { id: 'female', label: '♀️ महिला' },
            { id: 'non_binary', label: '⚧️ नॉन-बाइनरी' },
            { id: 'prefer_not', label: '🤝 बताना नहीं चाहते' },
        ],
    },
    {
        id: 'lifeAreas',
        section: 'lifestyle',
        question: 'आप किन क्षेत्रों में सुधार चाहते हैं?',
        subtext: 'जो लागू हों सभी चुनें।',
        type: 'multi-choice',
        options: [
            { id: 'morning_rituals', label: 'सुबह की दिनचर्या' },
            { id: 'sleep_quality', label: 'नींद की गुणवत्ता' },
            { id: 'focus_productivity', label: 'फोकस और उत्पादकता' },
            { id: 'fitness', label: 'शारीरिक फिटनेस' },
            { id: 'spiritual_practice', label: 'आध्यात्मिक अभ्यास' },
            { id: 'mental_health', label: 'मानसिक स्वास्थ्य' },
        ],
    },
    {
        id: 'painPoints',
        section: 'lifestyle',
        question: 'आपकी सबसे बड़ी बाधा क्या है?',
        subtext: 'जो लागू हो चुनें।',
        type: 'multi-choice',
        options: [
            { id: 'doom_scroll', label: 'फोन पर बहुत समय' },
            { id: 'procrastinate', label: 'टालमटोल' },
            { id: 'anxiety', label: 'चिंता' },
            { id: 'no_routine', label: 'दिनचर्या नहीं है' },
            { id: 'burnout', label: 'थकान' },
        ],
    },
    {
        id: 'availableMinutes',
        section: 'lifestyle',
        question: 'आप रोज़ कितने मिनट दे सकते हैं?',
        subtext: 'निरंतरता अवधि से अधिक ज़रूरी है।',
        type: 'choice',
        options: [
            { id: '5', label: '5 मिनट', desc: 'छोटी आदतें' },
            { id: '15', label: '15 मिनट', desc: 'दैनिक अभ्यास' },
            { id: '30', label: '30 मिनट', desc: 'नियमित दिनचर्या' },
            { id: '60', label: '60+ मिनट', desc: 'गहरा बदलाव' },
        ],
    },
];

// ── Section metadata for elegant badges ──────────────────────────────────────

const SECTION_META: Record<string, { label: string; labelHi: string; color: string; bg: string; border: string }> = {
    personal:   { label: 'Personal',  labelHi: 'व्यक्तिगत', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.35)' },
    lifestyle:  { label: 'Lifestyle', labelHi: 'जीवनशैली', color: '#f472b6', bg: 'rgba(244,114,182,0.12)', border: 'rgba(244,114,182,0.35)' },
};

// ── Save Function ─────────────────────────────────────────────────────────────

async function saveProfileToFirestore(profile: any): Promise<void> {
    try {
        const { getFirebaseAuth, getFirebaseFirestore } = await import('@/lib/firebase');
        const { onAuthStateChanged } = await import('firebase/auth');
        const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
        const auth = await getFirebaseAuth();
        const db = await getFirebaseFirestore();
        await new Promise<void>((resolve) => {
            const unsub = onAuthStateChanged(auth, async (user) => {
                if (user) {
                    unsub();
                    try {
                        await setDoc(doc(db, 'users', user.uid), {
                            profile: { ...profile, savedAt: serverTimestamp() },
                            hasCompletedOnboarding: true,
                            onboardingCompleted: true,
                        }, { merge: true });
                        // Also write key identity fields to onesutra_users so profile page can display them
                        await setDoc(doc(db, 'onesutra_users', user.uid), {
                            dob: profile.dob || null,
                            gender: profile.gender || null,
                            occupation: profile.occupation || null,
                            age: profile.age || null,
                            prakriti: profile.prakriti || null,
                            joinedDate: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
                        }, { merge: true });
                    } catch { /* silent */ }
                    resolve();
                } else { unsub(); resolve(); }
            });
        });
    } catch { /* silent */ }
}

// ── MicButton ─────────────────────────────────────────────────────────────────

function MicButton({ isListening, onToggle }: { isListening: boolean; onToggle: () => void }) {
    return (
        <motion.button
            onClick={onToggle}
            whileTap={{ scale: 0.88 }}
            animate={isListening ? { scale: [1, 1.12, 1] } : { scale: 1 }}
            transition={isListening ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } : {}}
            style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                width: 38, height: 38, borderRadius: '50%',
                background: isListening ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.07)',
                border: isListening ? '1.5px solid rgba(239,68,68,0.65)' : '1.5px solid rgba(255,255,255,0.14)',
                color: isListening ? '#f87171' : 'rgba(255,255,255,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: isListening ? '0 0 14px rgba(239,68,68,0.28)' : 'none',
                transition: 'all 0.22s', fontSize: 16,
            }}
        >
            {isListening ? '⏹' : '🎤'}
        </motion.button>
    );
}

// ── Page Component ────────────────────────────────────────────────────────────

export default function OnboardingPage() {
    const router = useRouter();
    const { user } = useOneSutraAuth();
    const { completeOnboarding, profile } = useLifestyleEngine();
    const { imageUrl: bgUrl } = useCircadianUnsplash();

    const { lang, setLang } = useLanguage();
    const { speak, stop, isSpeaking, muted, toggleMute } = useGeminiTTS();
    const { isListening, startListening, stopListening, isSupported: micSupported } = useSpeechInput({
        lang,
        onResult: (text) => {
            if (!step) return;
            if (step.type === 'text') { handleAnswer(step.id, text); }
            else if (step.type === 'number') { const n = text.replace(/[^0-9]/g, ''); if (n) handleAnswer(step.id, n); }
        },
    });
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [phase, setPhase] = useState<'language' | 'intro' | 'questions' | 'saving' | 'complete'>('language');

    // Gate: redirect already-onboarded users
    // ── Test email always shows onboarding (for QA) ───────────────────────────
    const isTestEmail = user?.email === 'aryavartaaryan9@gmail.com';
    useEffect(() => {
        if (isTestEmail) {
            // Always clear cache for test account so onboarding shows every login
            localStorage.removeItem('acharya_onboarding_done');
            return;
        }
        const uid = user?.uid;
        const localDone = typeof window !== 'undefined' && uid
            ? localStorage.getItem('acharya_onboarding_done') === uid
            : false;
        if (localDone || profile?.onboardingComplete) {
            router.replace('/');
        }
    }, [profile?.onboardingComplete, router, user?.uid, isTestEmail]);

    // Handle answer update
    const handleAnswer = useCallback((field: string, value: any, isMulti = false) => {
        setAnswers(prev => {
            if (isMulti) {
                const current = prev[field] || [];
                const updated = current.includes(value)
                    ? current.filter((v: any) => v !== value)
                    : [...current, value];
                return { ...prev, [field]: updated };
            }
            return { ...prev, [field]: value };
        });
    }, []);

    const stepsData = lang === 'hi' ? ONBOARDING_STEPS_HI : ONBOARDING_STEPS;
    const step = stepsData[currentStep];
    const canContinue = useMemo(() => {
        if (!step) return false;
        const val = answers[step.id];
        if (step.type === 'multi-choice') return val && val.length > 0;
        if (step.type === 'date') {
            if (!val) return false;
            const p = String(val).split('-');
            return p.length === 3 && p[0].length === 4 && p[1].length > 0 && p[2].length > 0 && parseInt(p[1]) >= 1 && parseInt(p[2]) >= 1;
        }
        if (step.type === 'text' || step.type === 'number') return val && String(val).trim().length > 0;
        return !!val;
    }, [step, answers]);

    const handleNext = useCallback(async () => {
        if (currentStep < stepsData.length - 1) {
            setCurrentStep(s => s + 1);
        } else {
            setPhase('saving');
            const dobStr = answers.dob as string | undefined;
            const autoAge = dobStr ? (() => {
                const [y, m, d] = dobStr.split('-').map(Number);
                if (!y || !m || !d) return undefined;
                const today = new Date();
                let age = today.getFullYear() - y;
                if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--;
                return age > 0 ? age : undefined;
            })() : undefined;
            const ayurvedicProfile = {
                name: answers.name,
                age: autoAge,
                dob: dobStr,
                gender: answers.gender,
                prakriti: '',
                vikriti: '',
                doshas: '',
                diseases: 'None',
                plan_lifestyle: '',
                plan_food: '',
                plan_herbs: '',
                plan_mantra: '',
                occupation: answers.occupation,
                hobbies: '',
            };

            const lifestyleProfile: LifestyleProfile = {
                lifeAreas: answers.lifeAreas,
                painPoints: answers.painPoints,
                personality: {
                    circadian: 'morning',
                    style: 'planner',
                    social: 'solo',
                },
                motivation: 'wellness',
                availableMinutes: Number(answers.availableMinutes),
                spiritualBackground: '',
                existingTools: [],
                buddyName: 'Bodhi',
                buddyPersonality: 'wise_friend' as BuddyPersonality,
                onboardingComplete: true,
            };

            await saveProfileToFirestore(ayurvedicProfile);
            await completeOnboarding(lifestyleProfile);
            if (user?.uid) localStorage.setItem('acharya_onboarding_done', user.uid);

            setPhase('complete');
            setTimeout(() => router.push('/lifestyle/prakriti'), 3000);
        }
    }, [currentStep, stepsData, answers, completeOnboarding, router]);

    const handleBack = useCallback(() => {
        if (currentStep > 0) setCurrentStep(s => s - 1);
        else setPhase('intro');
    }, [currentStep]);

    // Speak question when step changes (questions phase only)
    useEffect(() => {
        if (phase !== 'questions' || !step) return;
        const t = setTimeout(() => speak(step.question), 400);
        return () => { clearTimeout(t); stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, currentStep]);

    const progress = ((currentStep + 1) / stepsData.length) * 100;

    return (
        <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#030110', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

            {/* Background */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{
                    position: 'absolute', inset: 0, zIndex: 0,
                    backgroundImage: bgUrl ? `url(${bgUrl})` : 'none',
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    filter: 'brightness(0.3) saturate(1.2)',
                    transition: 'backgroundImage 1s ease',
                }}
            />
            <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'radial-gradient(circle at center, transparent 0%, rgba(3,1,16,0.85) 100%)' }} />

            {/* Language Selection Phase */}
            <AnimatePresence>
                {phase === 'language' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}
                    >
                        {/* Glow orbs for language screen */}
                        <motion.div animate={{ scale: [1,1.3,1], opacity: [0.28,0.55,0.28] }} transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }} style={{ position: 'absolute', top: '-10%', right: '-18%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.38) 0%, transparent 70%)', pointerEvents: 'none' }} />
                        <motion.div animate={{ scale: [1,1.4,1], opacity: [0.22,0.48,0.22] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }} style={{ position: 'absolute', bottom: '-5%', left: '-18%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,155,40,0.32) 0%, transparent 70%)', pointerEvents: 'none' }} />

                        {/* App wordmark */}
                        <motion.div
                            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 24 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', position: 'relative', zIndex: 2 }}
                        >
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.34)', borderRadius: 999, padding: '0.34rem 1rem' }}>
                                <motion.span animate={{ opacity: [1,0.3,1] }} transition={{ duration: 1.8, repeat: Infinity }} style={{ width: 5, height: 5, borderRadius: '50%', background: '#a78bfa', display: 'inline-block', boxShadow: '0 0 6px #a78bfa' }} />
                                <span style={{ fontSize: '0.58rem', color: '#c4b5fd', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>OneSUTRA</span>
                            </div>
                        </motion.div>

                        <motion.h1
                            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
                            style={{ fontSize: 'clamp(1.7rem, 5.5vw, 2.4rem)', fontWeight: 900, marginBottom: '0.4rem', letterSpacing: '-0.025em', position: 'relative', zIndex: 2 }}
                        >
                            <span style={{ color: '#fff' }}>Choose </span>
                            <span style={{ background: 'linear-gradient(130deg, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Your</span>
                            <span style={{ color: '#fff' }}> Language</span>
                        </motion.h1>
                        <motion.p
                            initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.38 }}
                            style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.45)', marginBottom: '0.3rem', position: 'relative', zIndex: 2 }}
                        >
                            अपनी भाषा चुनें
                        </motion.p>
                        <motion.p
                            initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.48 }}
                            style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.28)', marginBottom: '2rem', maxWidth: 300, position: 'relative', zIndex: 2, letterSpacing: '0.02em', lineHeight: 1.6 }}
                        >
                            Bodhi speaks to you in this language everywhere in the app.
                        </motion.p>

                        {isTestEmail && (
                            <motion.button
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                                onClick={() => router.replace('/')}
                                style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '0.38rem 1.2rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', cursor: 'pointer', marginBottom: '0.6rem', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.04em' }}
                            >
                                Skip (dev)
                            </motion.button>
                        )}

                        <motion.div
                            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
                            style={{ display: 'flex', gap: '1.2rem', width: '100%', maxWidth: 420 }}
                        >
                            {/* English Card */}
                            <motion.button
                                whileHover={{ scale: 1.04, background: 'rgba(255,255,255,0.10)' }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => { setLang('en'); setPhase('intro'); }}
                                style={{
                                    flex: 1, padding: '2rem 1.2rem', borderRadius: '1.5rem',
                                    background: lang === 'en' ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.05)',
                                    border: `2px solid ${lang === 'en' ? 'rgba(167,139,250,0.70)' : 'rgba(255,255,255,0.12)'}`,
                                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem',
                                    boxShadow: lang === 'en' ? '0 0 30px rgba(167,139,250,0.25)' : 'none',
                                    transition: 'all 0.25s',
                                }}
                            >
                                <span style={{ fontSize: '3rem', lineHeight: 1 }}>🇬🇧</span>
                                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif' }}>English</span>
                                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>Bodhi speaks in English</span>
                            </motion.button>

                            {/* Hindi Card */}
                            <motion.button
                                whileHover={{ scale: 1.04, background: 'rgba(255,255,255,0.10)' }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => { setLang('hi'); setPhase('intro'); }}
                                style={{
                                    flex: 1, padding: '2rem 1.2rem', borderRadius: '1.5rem',
                                    background: lang === 'hi' ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.05)',
                                    border: `2px solid ${lang === 'hi' ? 'rgba(251,191,36,0.65)' : 'rgba(255,255,255,0.12)'}`,
                                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem',
                                    boxShadow: lang === 'hi' ? '0 0 30px rgba(251,191,36,0.20)' : 'none',
                                    transition: 'all 0.25s',
                                }}
                            >
                                <span style={{ fontSize: '3rem', lineHeight: 1 }}>🇮🇳</span>
                                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif' }}>हिन्दी</span>
                                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>बोधि हिन्दी में बात करेगा</span>
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}

                {/* Intro Phase — Life OS Redesign */}
                {phase === 'intro' && (
                    <motion.div
                        key="intro-phase"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        style={{ position: 'absolute', inset: 0, zIndex: 10, overflowY: 'auto', overflowX: 'hidden' }}
                    >
                        {/* Ambient glow orbs */}
                        <motion.div animate={{ scale: [1,1.4,1], opacity: [0.2,0.38,0.2] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} style={{ position: 'fixed', top: '-10%', right: '-20%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.30) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
                        <motion.div animate={{ scale: [1,1.45,1], opacity: [0.12,0.28,0.12] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 3 }} style={{ position: 'fixed', bottom: '0', left: '-20%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,155,40,0.26) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

                        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

                            {/* ══════════════════════════════════════════════════
                                NATURE IMAGE HERO — full bleed at top
                            ══════════════════════════════════════════════════ */}
                            <motion.div
                                initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05, duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
                                style={{ width: '100%', height: 210, position: 'relative', overflow: 'hidden', flexShrink: 0 }}
                            >
                                {bgUrl ? (
                                    <img src={bgUrl} alt="Nature" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.5) brightness(0.72)', transform: 'scale(1.04)' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0a1628 0%, #0d1f3c 40%, #071a14 100%)' }} />
                                )}
                                {/* Bottom-to-dark fade */}
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(3,1,16,0.10) 0%, rgba(3,1,16,0.05) 35%, rgba(3,1,16,0.65) 75%, rgba(3,1,16,1) 100%)' }} />
                                {/* Side vignette */}
                                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(3,1,16,0.55) 100%)' }} />

                                {/* OneSUTRA badge — top-left */}
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.45, type: 'spring', stiffness: 260 }}
                                    style={{ position: 'absolute', top: 18, left: 16, display: 'inline-flex', alignItems: 'center', gap: '0.38rem', background: 'rgba(3,1,16,0.52)', border: '1px solid rgba(167,139,250,0.38)', borderRadius: 999, padding: '0.28rem 0.85rem', backdropFilter: 'blur(12px)' }}
                                >
                                    <motion.span animate={{ opacity: [1,0.25,1] }} transition={{ duration: 1.6, repeat: Infinity }} style={{ width: 5, height: 5, borderRadius: '50%', background: '#a78bfa', display: 'inline-block', boxShadow: '0 0 6px #a78bfa' }} />
                                    <span style={{ fontSize: '0.60rem', color: '#c4b5fd', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase' }}>OneSUTRA</span>
                                </motion.div>

                                {/* Ancient wisdom pill — top-right */}
                                <motion.div
                                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.55, type: 'spring' }}
                                    style={{ position: 'absolute', top: 18, right: 16, display: 'inline-flex', alignItems: 'center', gap: '0.28rem', background: 'rgba(3,1,16,0.45)', border: '1px solid rgba(251,191,36,0.28)', borderRadius: 999, padding: '0.26rem 0.75rem', backdropFilter: 'blur(10px)' }}
                                >
                                    <span style={{ fontSize: '0.48rem', color: 'rgba(251,191,36,0.85)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Ancient Wisdom · Modern Era</span>
                                </motion.div>

                                {/* Life OS label — bottom-left of image */}
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.65, duration: 0.6 }}
                                    style={{ position: 'absolute', bottom: 22, left: 16 }}
                                >
                                    <div style={{ fontSize: '0.46rem', color: 'rgba(255,255,255,0.38)', letterSpacing: '0.20em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Life Operating System</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        {['Streak', 'Pranic Feed', 'Health', 'Log'].map((t, i) => (
                                            <span key={t} style={{ fontSize: '0.40rem', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.06em' }}>{t}{i < 3 ? ' ·' : ''}</span>
                                        ))}
                                    </div>
                                </motion.div>
                            </motion.div>

                            {/* ══════════════════════════════════════════════════
                                MAIN CONTENT
                            ══════════════════════════════════════════════════ */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 1.4rem 2.2rem', position: 'relative', zIndex: 2 }}>

                                {/* ── THE STATEMENT — Social Media Broken → We Fixed It ── */}
                                <motion.div
                                    initial={{ y: 22, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.28, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                                    style={{ width: '100%', textAlign: 'center', marginTop: '1.4rem', marginBottom: '0.3rem' }}
                                >
                                    {/* Strikethrough — broken */}
                                    <div style={{ fontSize: 'clamp(0.95rem, 3.8vw, 1.25rem)', fontWeight: 700, color: 'rgba(255,255,255,0.20)', letterSpacing: '-0.01em', textDecoration: 'line-through', textDecorationColor: 'rgba(239,68,68,0.45)', textDecorationThickness: '2px', lineHeight: 1.2, marginBottom: '0.5rem' }}>
                                        Social Media is Broken.
                                    </div>
                                    {/* Divider with WE FIXED IT */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.7rem', marginBottom: '0.6rem' }}>
                                        <div style={{ flex: 1, maxWidth: 55, height: 1, background: 'linear-gradient(to right, transparent, rgba(74,222,128,0.45))' }} />
                                        <span style={{ fontSize: '0.58rem', color: '#4ade80', fontWeight: 900, letterSpacing: '0.14em', textShadow: '0 0 12px rgba(74,222,128,0.6)' }}>WE FIXED IT</span>
                                        <div style={{ flex: 1, maxWidth: 55, height: 1, background: 'linear-gradient(to left, transparent, rgba(74,222,128,0.45))' }} />
                                    </div>
                                    {/* App name — large */}
                                    <h1 style={{ fontSize: 'clamp(2.2rem, 9vw, 3.2rem)', fontWeight: 900, lineHeight: 1.05, margin: 0, letterSpacing: '-0.035em' }}>
                                        <span style={{ color: '#fff' }}>One</span>
                                        <span style={{ background: 'linear-gradient(130deg, #fbbf24 10%, #f59e0b 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>SUTRA</span>
                                    </h1>
                                </motion.div>

                                {/* ── LIFE OS POSITIONING ── */}
                                <motion.div
                                    initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.42, duration: 0.58 }}
                                    style={{ textAlign: 'center', marginBottom: '1.5rem', maxWidth: 310 }}
                                >
                                    <p style={{ fontSize: 'clamp(0.82rem, 2.8vw, 0.95rem)', fontWeight: 600, color: 'rgba(255,255,255,0.72)', lineHeight: 1.5, margin: '0 0 0.4rem', letterSpacing: '-0.01em' }}>
                                        Not an app.{' '}
                                        <span style={{ background: 'linear-gradient(130deg, #a78bfa, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                            A complete Life Operating System.
                                        </span>
                                    </p>
                                    <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.32)', lineHeight: 1.65, margin: 0 }}>
                                        {lang === 'hi'
                                            ? 'Streak · Pranic Feeds · Health Monitor · Daily Log · Social — सब एक जगह।'
                                            : 'Streak · Pranic Feeds · Health Monitor · Daily Log · Social — all in one place.'}
                                    </p>
                                </motion.div>

                                {/* ── FEATURE CARDS — 3×2 premium grid ── */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.52 }}
                                    style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.52rem', width: '100%', marginBottom: '0.9rem' }}
                                >
                                    {[
                                        { icon: '🔥', en: 'Streak',          hi: 'Streak',         subEn: 'Daily wins',      subHi: 'दैनिक जीत',    color: '#fb923c', grad: 'rgba(251,146,60,0.08)',  border: 'rgba(251,146,60,0.22)'  },
                                        { icon: '🌿', en: 'Pranic Feed',     hi: 'Pranic Feed',    subEn: 'Nature vibes',    subHi: 'प्रकृति vibes', color: '#22d3ee', grad: 'rgba(34,211,238,0.08)',  border: 'rgba(34,211,238,0.22)'  },
                                        { icon: '💗', en: 'Health Monitor',  hi: 'Health Monitor', subEn: 'Track wellness',  subHi: 'स्वास्थ्य',     color: '#f472b6', grad: 'rgba(244,114,182,0.08)', border: 'rgba(244,114,182,0.22)' },
                                        { icon: '📔', en: 'Daily Log',       hi: 'Daily Log',      subEn: 'Life tracking',   subHi: 'जीवन ट्रैक',   color: '#818cf8', grad: 'rgba(129,140,248,0.08)', border: 'rgba(129,140,248,0.22)' },
                                        { icon: '🎵', en: 'Healing Mantras', hi: 'वैदिक मंत्र',    subEn: 'Vedic healing',   subHi: 'वैदिक उपचार',  color: '#e879f9', grad: 'rgba(232,121,249,0.08)', border: 'rgba(232,121,249,0.22)' },
                                        { icon: '🤖', en: 'AI Bodhi',        hi: 'AI बोधि',        subEn: '24/7 guidance',   subHi: 'हमेशा साथ',    color: '#4ade80', grad: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.22)'  },
                                    ].map((f, i) => (
                                        <motion.div key={f.en}
                                            initial={{ scale: 0.84, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: 0.54 + i * 0.06, type: 'spring', stiffness: 300, damping: 22 }}
                                            style={{ padding: '0.88rem 0.38rem 0.72rem', borderRadius: '1rem', background: f.grad, border: `1px solid ${f.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', boxShadow: `0 4px 20px ${f.color}10` }}
                                        >
                                            <span style={{ fontSize: '1.3rem', lineHeight: 1, filter: `drop-shadow(0 0 8px ${f.color}55)` }}>{f.icon}</span>
                                            <span style={{ fontSize: '0.50rem', color: '#fff', fontWeight: 700, letterSpacing: '0.02em', textAlign: 'center', lineHeight: 1.3 }}>{lang === 'hi' ? f.hi : f.en}</span>
                                            <span style={{ fontSize: '0.40rem', color: f.color, letterSpacing: '0.05em', textAlign: 'center', opacity: 0.88 }}>{lang === 'hi' ? f.subHi : f.subEn}</span>
                                        </motion.div>
                                    ))}
                                </motion.div>

                                {/* ── HEALTH TRACKING STRIP ── */}
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.76 }}
                                    style={{ display: 'flex', gap: '0.26rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1.3rem' }}
                                >
                                    {[
                                        { icon: '📊', label: 'Health Tracking' },
                                        { icon: '😴', label: 'Sleep' },
                                        { icon: '🥗', label: 'Diet' },
                                        { icon: '💼', label: 'Work' },
                                        { icon: '🧘', label: 'Stress' },
                                        { icon: '📈', label: 'Progress' },
                                    ].map(m => (
                                        <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: '0.18rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 999, padding: '0.18rem 0.52rem' }}>
                                            <span style={{ fontSize: '0.55rem' }}>{m.icon}</span>
                                            <span style={{ fontSize: '0.43rem', color: 'rgba(255,255,255,0.36)', fontWeight: 600, letterSpacing: '0.06em' }}>{m.label}</span>
                                        </div>
                                    ))}
                                </motion.div>

                                {/* ── STATS ── */}
                                <motion.div
                                    initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.86 }}
                                    style={{ display: 'flex', justifyContent: 'center', gap: '2.2rem', marginBottom: '1.8rem' }}
                                >
                                    {[
                                        { num: '10K+', en: 'LEGENDS',  hi: 'साधक'   },
                                        { num: '24/7',  en: 'AI BODHI', hi: 'AI साथी' },
                                        { num: '∞',     en: 'STOTRAS',  hi: 'स्तोत्र'  },
                                    ].map(s => (
                                        <div key={s.en} style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24', lineHeight: 1, letterSpacing: '-0.02em' }}>{s.num}</div>
                                            <div style={{ fontSize: '0.44rem', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: '0.22rem' }}>{lang === 'hi' ? s.hi : s.en}</div>
                                        </div>
                                    ))}
                                </motion.div>

                                {/* ── CTA BUTTON ── */}
                                <div style={{ width: '100%', maxWidth: 400 }}>
                                    <motion.button
                                        initial={{ y: 28, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.96, type: 'spring', stiffness: 240, damping: 22 }}
                                        whileHover={{ scale: 1.035, boxShadow: '0 16px 48px rgba(200,155,40,0.60)' }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => setPhase('questions')}
                                        style={{ width: '100%', padding: '1.22rem 2rem', borderRadius: '2rem', background: 'linear-gradient(132deg, #b8860b 0%, #fbbf24 52%, #f59e0b 100%)', color: '#030110', fontWeight: 800, fontSize: '1.08rem', cursor: 'pointer', border: 'none', boxShadow: '0 8px 34px rgba(200,155,40,0.44)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', letterSpacing: '-0.01em' }}
                                    >
                                        <motion.div
                                            animate={{ x: ['-130%', '230%'] }}
                                            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.4 }}
                                            style={{ position: 'absolute', top: 0, bottom: 0, width: '36%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.50), transparent)', pointerEvents: 'none' }}
                                        />
                                        <span>{lang === 'hi' ? 'यात्रा प्रारंभ करें' : 'Begin Your Journey'}</span>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 900 }}>→</span>
                                    </motion.button>

                                    <motion.p
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.18 }}
                                        style={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.14em', textTransform: 'uppercase', textAlign: 'center', marginTop: '0.85rem' }}
                                    >
                                        {lang === 'hi' ? '⏱ 3 मिनट  ·  🔒 निजी  ·  ✦ अभी शुरू करें' : '⏱ 3 min  ·  🔒 Private  ·  ✦ Start now'}
                                    </motion.p>
                                </div>

                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Questions Phase — Elegant Redesign */}
                {phase === 'questions' && step && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column' }}
                    >
                        {/* ── Top: Segmented progress + section badge ── */}
                        <div style={{ padding: '3rem 1.6rem 0.8rem', flexShrink: 0, position: 'relative', zIndex: 2 }}>
                            {/* Segmented progress dots */}
                            <div style={{ display: 'flex', gap: 4, marginBottom: '1rem' }}>
                                {stepsData.map((_, i) => (
                                    <motion.div key={i}
                                        animate={{
                                            background: i < currentStep ? '#c89b28' : i === currentStep ? '#fbbf24' : 'rgba(255,255,255,0.1)',
                                            boxShadow: i === currentStep ? '0 0 10px rgba(200,155,40,0.7)' : 'none',
                                        }}
                                        transition={{ duration: 0.35 }}
                                        style={{ flex: 1, height: i === currentStep ? 4 : 3, borderRadius: 2 }}
                                    />
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <motion.span
                                    key={step.section}
                                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                    style={{
                                        padding: '0.22rem 0.8rem', borderRadius: 999,
                                        background: SECTION_META[step.section]?.bg || 'rgba(255,255,255,0.08)',
                                        border: `1px solid ${SECTION_META[step.section]?.border || 'rgba(255,255,255,0.15)'}`,
                                        fontSize: '0.58rem', color: SECTION_META[step.section]?.color || '#fff',
                                        fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase',
                                    }}
                                >
                                    {lang === 'hi' ? SECTION_META[step.section]?.labelHi : SECTION_META[step.section]?.label}
                                </motion.span>
                                <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)', fontVariantNumeric: 'tabular-nums' }}>
                                    {currentStep + 1}<span style={{ margin: '0 3px', opacity: 0.4 }}>/</span>{stepsData.length}
                                </span>
                            </div>
                        </div>

                        {/* ── Scrollable body ── */}
                        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 1.6rem', position: 'relative', zIndex: 2 }}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStep}
                                    initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }}
                                    transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
                                    style={{ paddingTop: '1.4rem', paddingBottom: '1rem' }}
                                >
                                    {/* ── Bodhi Voice Orb ── */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '1.1rem' }}>
                                        <motion.button
                                            onClick={() => speak(step.question)}
                                            whileTap={{ scale: 0.88 }}
                                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', position: 'relative', flexShrink: 0 }}
                                        >
                                            <motion.div
                                                animate={isSpeaking ? { scale: [1, 1.22, 1], opacity: [0.55, 0.95, 0.55] } : { scale: 1, opacity: 0.5 }}
                                                transition={{ duration: 1.4, repeat: isSpeaking ? Infinity : 0, ease: 'easeInOut' }}
                                                style={{ position: 'absolute', inset: -4, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,155,40,0.45) 0%, transparent 70%)', pointerEvents: 'none' }}
                                            />
                                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(200,155,40,0.12)', border: '1.5px solid rgba(200,155,40,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, position: 'relative' }}>
                                                🪬
                                            </div>
                                        </motion.button>
                                        <span style={{ fontSize: '0.7rem', color: isSpeaking ? 'rgba(200,155,40,0.85)' : 'rgba(255,255,255,0.22)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.05em', transition: 'color 0.3s' }}>
                                            {isSpeaking ? (lang === 'hi' ? 'बोधि बोल रहा है...' : 'Bodhi speaking…') : (lang === 'hi' ? 'सुनने के लिए टैप करें' : 'Tap to hear')}
                                        </span>
                                        <button onClick={toggleMute} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.7rem', color: 'rgba(255,255,255,0.22)', padding: '0.2rem 0.4rem', borderRadius: 6 }}>
                                            {muted ? '🔇' : '🔊'}
                                        </button>
                                    </div>

                                    {/* Question text */}
                                    <h2 style={{
                                        fontSize: 'clamp(1.5rem, 5.8vw, 2.1rem)', fontWeight: 800,
                                        color: '#fff', lineHeight: 1.22,
                                        marginBottom: step.subtext ? '0.6rem' : '2rem',
                                        fontFamily: 'Georgia, serif', letterSpacing: '-0.022em',
                                    }}>
                                        {step.question}
                                    </h2>
                                    {step.subtext && (
                                        <p style={{ fontSize: '0.87rem', color: 'rgba(255,255,255,0.38)', marginBottom: '2rem', lineHeight: 1.6 }}>
                                            {step.subtext}
                                        </p>
                                    )}

                                    {/* ── Text Input ── */}
                                    {step.type === 'text' && (
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                autoFocus type="text"
                                                value={answers[step.id] || ''}
                                                onChange={e => handleAnswer(step.id, e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && canContinue && handleNext()}
                                                placeholder={step.placeholder}
                                                style={{
                                                    width: '100%', padding: '1.35rem 3.6rem 1.35rem 1.4rem',
                                                    borderRadius: '1.3rem',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: answers[step.id] ? '1.5px solid rgba(200,155,40,0.6)' : '1.5px solid rgba(255,255,255,0.11)',
                                                    color: '#fff', fontSize: '1.35rem', fontWeight: 700,
                                                    textAlign: 'center', outline: 'none',
                                                    boxShadow: answers[step.id] ? '0 0 28px rgba(200,155,40,0.14), inset 0 1px 0 rgba(255,255,255,0.05)' : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                                                    transition: 'all 0.25s', fontFamily: 'system-ui, sans-serif',
                                                    boxSizing: 'border-box',
                                                }}
                                            />
                                            {micSupported && (
                                                <MicButton isListening={isListening} onToggle={isListening ? stopListening : startListening} />
                                            )}
                                        </div>
                                    )}

                                    {/* ── Number Input ── */}
                                    {step.type === 'number' && (
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                autoFocus type="number" inputMode="numeric"
                                                value={answers[step.id] || ''}
                                                onChange={e => handleAnswer(step.id, e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && canContinue && handleNext()}
                                                placeholder={step.placeholder}
                                                style={{
                                                    width: '100%', padding: '1.4rem 3.6rem 1.4rem 1.4rem',
                                                    borderRadius: '1.3rem',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: answers[step.id] ? '1.5px solid rgba(200,155,40,0.6)' : '1.5px solid rgba(255,255,255,0.11)',
                                                    color: '#fbbf24', fontSize: '2.8rem', fontWeight: 800,
                                                    textAlign: 'center', outline: 'none',
                                                    boxShadow: answers[step.id] ? '0 0 28px rgba(200,155,40,0.14)' : 'none',
                                                    transition: 'all 0.25s', fontFamily: 'system-ui, sans-serif',
                                                    letterSpacing: '-0.03em', boxSizing: 'border-box',
                                                }}
                                            />
                                            {micSupported && (
                                                <MicButton isListening={isListening} onToggle={isListening ? stopListening : startListening} />
                                            )}
                                        </div>
                                    )}

                                    {/* ── Date Input — 3-field custom ── */}
                                    {step.type === 'date' && (() => {
                                        const raw = answers[step.id] || '';
                                        const parts = raw.split('-');
                                        const yyyy = parts[0] || '';
                                        const mm   = parts[1] || '';
                                        const dd   = parts[2] || '';
                                        const setDatePart = (yi: string, mi: string, di: string) => {
                                            handleAnswer(step.id, `${yi}-${mi}-${di}`);
                                        };
                                        const inputStyle: React.CSSProperties = {
                                            width: '100%', padding: '1.1rem 0.4rem',
                                            borderRadius: '1.1rem', background: 'rgba(255,255,255,0.05)',
                                            border: '1.5px solid rgba(255,255,255,0.1)',
                                            color: '#fff', fontSize: '1.75rem', fontWeight: 800,
                                            textAlign: 'center', outline: 'none',
                                            fontFamily: 'system-ui, sans-serif',
                                            transition: 'border-color 0.2s',
                                        };
                                        return (
                                            <div>
                                                <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-end' }}>
                                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                                        <div style={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                                            {lang === 'hi' ? 'दिन' : 'Day'}
                                                        </div>
                                                        <input type="number" inputMode="numeric" placeholder="DD" min={1} max={31}
                                                            value={dd}
                                                            onChange={e => setDatePart(yyyy, mm, e.target.value.slice(0,2))}
                                                            style={{ ...inputStyle, borderColor: dd ? 'rgba(200,155,40,0.5)' : 'rgba(255,255,255,0.1)' }}
                                                        />
                                                    </div>
                                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                                        <div style={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                                            {lang === 'hi' ? 'माह' : 'Month'}
                                                        </div>
                                                        <input type="number" inputMode="numeric" placeholder="MM" min={1} max={12}
                                                            value={mm}
                                                            onChange={e => setDatePart(yyyy, e.target.value.slice(0,2), dd)}
                                                            style={{ ...inputStyle, borderColor: mm ? 'rgba(200,155,40,0.5)' : 'rgba(255,255,255,0.1)' }}
                                                        />
                                                    </div>
                                                    <div style={{ flex: 1.6, textAlign: 'center' }}>
                                                        <div style={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                                            {lang === 'hi' ? 'वर्ष' : 'Year'}
                                                        </div>
                                                        <input type="number" inputMode="numeric" placeholder="YYYY" min={1900} max={new Date().getFullYear()}
                                                            value={yyyy}
                                                            onChange={e => setDatePart(e.target.value.slice(0,4), mm, dd)}
                                                            style={{ ...inputStyle, borderColor: yyyy.length === 4 ? 'rgba(200,155,40,0.5)' : 'rgba(255,255,255,0.1)' }}
                                                        />
                                                    </div>
                                                </div>
                                                {yyyy.length === 4 && mm && dd && (
                                                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                                        style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.82rem', color: 'rgba(200,155,40,0.75)', fontWeight: 600 }}>
                                                        🎂 {(() => { try { return new Date(`${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return ''; } })()}
                                                    </motion.div>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    {/* ── Choice / Multi-Choice ── */}
                                    {(step.type === 'choice' || step.type === 'multi-choice') && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                            {step.options?.map((opt, i) => {
                                                const isSelected = step.type === 'multi-choice'
                                                    ? (answers[step.id] || []).includes(opt.id)
                                                    : answers[step.id] === opt.id;
                                                return (
                                                    <motion.button
                                                        key={opt.id}
                                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.055, duration: 0.28 }}
                                                        whileTap={{ scale: 0.984 }}
                                                        onClick={() => handleAnswer(step.id, opt.id, step.type === 'multi-choice')}
                                                        style={{
                                                            width: '100%', padding: '1.05rem 1.25rem',
                                                            borderRadius: '1.25rem', textAlign: 'left', cursor: 'pointer',
                                                            background: isSelected
                                                                ? 'linear-gradient(130deg, rgba(200,155,40,0.16) 0%, rgba(251,191,36,0.06) 100%)'
                                                                : 'rgba(255,255,255,0.035)',
                                                            border: `1.5px solid ${isSelected ? 'rgba(200,155,40,0.65)' : 'rgba(255,255,255,0.09)'}`,
                                                            boxShadow: isSelected ? '0 0 22px rgba(200,155,40,0.14), inset 0 0 18px rgba(200,155,40,0.04)' : 'none',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                            transition: 'all 0.22s',
                                                        }}
                                                    >
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{
                                                                fontSize: '0.97rem', fontWeight: 700,
                                                                color: isSelected ? '#fbbf24' : 'rgba(255,255,255,0.88)',
                                                                letterSpacing: '-0.01em', fontFamily: 'system-ui, sans-serif',
                                                            }}>
                                                                {opt.label}
                                                            </div>
                                                            {opt.desc && (
                                                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.33)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                                                                    {opt.desc}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div style={{
                                                            width: 22, height: 22, flexShrink: 0, marginLeft: '0.8rem',
                                                            borderRadius: step.type === 'multi-choice' ? 7 : '50%',
                                                            border: `2px solid ${isSelected ? '#fbbf24' : 'rgba(255,255,255,0.18)'}`,
                                                            background: isSelected ? 'linear-gradient(135deg, #c89b28, #fbbf24)' : 'transparent',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            transition: 'all 0.2s',
                                                        }}>
                                                            {isSelected && <Check size={13} color="#030110" strokeWidth={3} />}
                                                        </div>
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* ── Navigation Footer ── */}
                        <div style={{
                            padding: '0.8rem 1.6rem 2.6rem', flexShrink: 0, position: 'relative', zIndex: 2,
                            background: 'linear-gradient(to top, rgba(3,1,16,0.95) 60%, transparent)',
                        }}>
                            <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'stretch' }}>
                                <button onClick={handleBack} style={{
                                    padding: '0.95rem 1.1rem', borderRadius: '1.2rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                                    fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap',
                                }}>
                                    <ChevronLeft size={16} />
                                    {lang === 'hi' ? 'वापस' : 'Back'}
                                </button>
                                <motion.button
                                    disabled={!canContinue}
                                    whileHover={canContinue ? { scale: 1.025 } : {}}
                                    whileTap={canContinue ? { scale: 0.975 } : {}}
                                    onClick={handleNext}
                                    style={{
                                        flex: 1, padding: '1rem 1.4rem', borderRadius: '1.2rem',
                                        background: canContinue
                                            ? 'linear-gradient(135deg, #b8860b 0%, #fbbf24 55%, #f59e0b 100%)'
                                            : 'rgba(255,255,255,0.06)',
                                        color: canContinue ? '#030110' : 'rgba(255,255,255,0.2)',
                                        fontWeight: 800, fontSize: '1rem', border: 'none',
                                        cursor: canContinue ? 'pointer' : 'default',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
                                        boxShadow: canContinue ? '0 6px 28px rgba(200,155,40,0.42)' : 'none',
                                        transition: 'all 0.28s', letterSpacing: '-0.01em',
                                    }}
                                >
                                    {currentStep === stepsData.length - 1
                                        ? (lang === 'hi' ? '✦ यात्रा पूर्ण करें' : '✦ Complete Journey')
                                        : (lang === 'hi' ? 'आगे बढ़ें' : 'Continue')}
                                    {currentStep !== stepsData.length - 1 && <ChevronRight size={18} />}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Saving / Loading Phase */}
                {phase === 'saving' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(3,1,16,0.9)', backdropFilter: 'blur(20px)' }}
                    >
                        <motion.div
                            animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            style={{ fontSize: '3rem', color: '#c89b28', marginBottom: '2rem' }}
                        >
                            <Sparkles size={60} />
                        </motion.div>
                        <h2 style={{ fontSize: '1.5rem', color: '#fff', fontWeight: 600 }}>{lang === 'hi' ? 'आपकी पवित्र यात्रा तैयार हो रही है...' : 'Crafting your sacred journey...'}</h2>
                        <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem' }}>{lang === 'hi' ? 'एक पल रुकिए।' : 'One moment please.'}</p>
                    </motion.div>
                )}

                {/* Complete Phase */}
                {phase === 'complete' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}
                    >
                        <motion.div
                            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                            style={{ width: 100, height: 100, borderRadius: '50%', background: '#c89b28', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#030110', marginBottom: '2rem', boxShadow: '0 0 50px rgba(200,155,40,0.5)' }}
                        >
                            <Check size={60} strokeWidth={3} />
                        </motion.div>
                        <h2 style={{ fontSize: '2.5rem', color: '#fff', fontWeight: 700, fontFamily: 'Georgia, serif', marginBottom: '1rem' }}>{lang === 'hi' ? 'यात्रा सम्पन्न' : 'Journey Complete'}</h2>
                        <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', maxWidth: 450, lineHeight: 1.6, marginBottom: '3rem' }}>
                            {lang === 'hi'
                                ? `आपका प्रोफ़ाइल बन गया है। OneSUTRA परिवार में आपका स्वागत है, ${answers.name}। आपकी यात्रा अभी शुरू होती है।`
                                : `Your profile has been created. Welcome to the OneSUTRA family, ${answers.name}. Your journey begins now.`}
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => router.push('/')}
                            style={{ padding: '1rem 3rem', borderRadius: '3rem', background: 'linear-gradient(135deg, #c89b28, #fbbf24)', color: '#030110', fontWeight: 700, fontSize: '1.1rem', border: 'none', cursor: 'pointer' }}
                        >
                            {lang === 'hi' ? 'OneSUTRA में प्रवेश करें' : 'Enter OneSUTRA'}
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
