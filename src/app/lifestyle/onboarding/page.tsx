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

// ── Types ────────────────────────────────────────────────────────────────────

interface QuestionOption {
    id: string;
    label: string;
    desc?: string;
    icon?: React.ReactNode;
}

interface Step {
    id: string;
    section: 'personal' | 'ayurveda' | 'lifestyle' | 'companion';
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
        question: 'What shall we call you?',
        subtext: 'Your name will be held in sacred regard across OneSUTRA.',
        type: 'text',
        placeholder: 'Enter your name...',
    },
    {
        id: 'dob',
        section: 'personal',
        question: 'What is your date of birth?',
        subtext: 'Helps personalize your wellness journey and life insights.',
        type: 'date',
        placeholder: 'DD/MM/YYYY',
    },
    {
        id: 'age',
        section: 'personal',
        question: 'How many years have you graced this earth?',
        subtext: 'Age helps us calibrate your biological rhythms.',
        type: 'number',
        placeholder: 'Your age...',
    },
    {
        id: 'occupation',
        section: 'personal',
        question: 'What is your primary vocation?',
        subtext: 'This helps focus your productivity tools.',
        type: 'choice',
        options: [
            { id: 'student', label: 'Student', desc: 'Acquiring knowledge and wisdom' },
            { id: 'professional', label: 'Professional', desc: 'Building and creating in the world' },
            { id: 'creative', label: 'Creative/Artist', desc: 'Expressing the soul through art' },
            { id: 'entrepreneur', label: 'Entrepreneur', desc: 'Leading and innovating' },
            { id: 'home_maker', label: 'Home Maker', desc: 'Nurturing the sacred space' },
        ],
    },
    {
        id: 'gender',
        section: 'personal',
        question: 'How do you identify?',
        subtext: 'Your identity, your choice — we welcome everyone.',
        type: 'choice',
        options: [
            { id: 'male', label: '♂️ Male' },
            { id: 'female', label: '♀️ Female' },
            { id: 'non_binary', label: '⚧️ Non-Binary' },
            { id: 'prefer_not', label: '🤝 Prefer not to say' },
        ],
    },
    {
        id: 'appetite',
        section: 'ayurveda',
        question: 'How is your natural appetite?',
        subtext: 'A key indicator of your metabolic fire (Agni).',
        type: 'choice',
        options: [
            { id: 'skip', label: 'I skip meals easily', desc: 'Variable or low appetite' },
            { id: 'intense', label: 'I get "hangry" if I miss a meal', desc: 'Strong, intense appetite' },
        ],
    },
    {
        id: 'sleep',
        section: 'ayurveda',
        question: 'Describe your typical sleep pattern.',
        subtext: 'Reveals the quality of your rest and recovery.',
        type: 'choice',
        options: [
            { id: 'light', label: 'Light & easily disturbed', desc: 'Wake up often' },
            { id: 'deep', label: 'Deep & heavy', desc: 'Hard to wake up' },
            { id: 'insomnia', label: 'Takes time to fall asleep', desc: 'Active mind at night' },
        ],
    },
    {
        id: 'digestion',
        section: 'ayurveda',
        question: 'How is your digestion generally?',
        type: 'choice',
        options: [
            { id: 'regular', label: 'Regular & predictable', desc: 'Steady metabolic rate' },
            { id: 'irregular', label: 'Irregular/Slow', desc: 'Prone to heaviness or bloating' },
            { id: 'variable', label: 'Variable/Gassy', desc: 'Changes with stress or food' },
        ],
    },
    {
        id: 'health_challenges',
        section: 'ayurveda',
        question: 'Any current physical challenges?',
        subtext: 'Select all that apply.',
        type: 'multi-choice',
        options: [
            { id: 'joint_pain', label: 'Joint Pain' },
            { id: 'acidity', label: 'Acidity/Heat' },
            { id: 'fatigue', label: 'Frequent Fatigue' },
            { id: 'skin_issues', label: 'Skin Sensitivities' },
            { id: 'none', label: 'None Significant' },
        ],
    },
    {
        id: 'lifeAreas',
        section: 'lifestyle',
        question: 'Which areas do you wish to transform?',
        subtext: 'We will craft tools for these specific goals.',
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
        subtext: 'Help us identify your obstacles.',
        type: 'multi-choice',
        options: [
            { id: 'doom_scroll', label: 'Doom-scrolling' },
            { id: 'procrastinate', label: 'Procrastination' },
            { id: 'anxiety', label: 'Daily Anxiety' },
            { id: 'no_routine', label: 'Lack of Routine' },
            { id: 'burnout', label: 'Constant Burnout' },
        ],
    },
    {
        id: 'availableMinutes',
        section: 'lifestyle',
        question: 'How many minutes can you give daily?',
        subtext: 'Consistency is more important than duration.',
        type: 'choice',
        options: [
            { id: '5', label: '5 Minutes', desc: 'Micro-habits' },
            { id: '15', label: '15 Minutes', desc: 'Standard practice' },
            { id: '30', label: '30 Minutes', desc: 'Committed ritual' },
            { id: '60', label: '60+ Minutes', desc: 'Deep transformation' },
        ],
    },
    {
        id: 'buddyName',
        section: 'companion',
        question: 'Name your AI Companion',
        subtext: 'Your personal guide through OneSUTRA.',
        type: 'text',
        placeholder: 'e.g. Bodhi, Arya, Viveka...',
    },
    {
        id: 'buddyPersonality',
        section: 'companion',
        question: 'Choose your guide\'s personality',
        type: 'choice',
        options: [
            { id: 'wise_friend', label: 'Wise Friend', desc: 'Balanced and insightful' },
            { id: 'gentle_coach', label: 'Gentle Coach', desc: 'Warm and encouraging' },
            { id: 'tough_love', label: 'Tough Love', desc: 'Direct and disciplined' },
            { id: 'calm_monk', label: 'Calm Monk', desc: 'Serene and spacious' },
            { id: 'hype_person', label: 'Hype Person', desc: 'High energy and celebratory' },
        ],
    },
];

// ── Hindi Translations ───────────────────────────────────────────────────────

const ONBOARDING_STEPS_HI: Step[] = [
    {
        id: 'name',
        section: 'personal',
        question: 'हमें आपका नाम बताएँ?',
        subtext: 'OneSUTRA में आपका नाम सदा पवित्रता के साथ रखा जाएगा।',
        type: 'text',
        placeholder: 'अपना नाम लिखें...',
    },
    {
        id: 'dob',
        section: 'personal',
        question: 'आपकी जन्मतिथि क्या है?',
        subtext: 'आपकी wellness यात्रा को personalize करने में मदद करती है।',
        type: 'date',
        placeholder: 'DD/MM/YYYY',
    },
    {
        id: 'age',
        section: 'personal',
        question: 'आपने इस पृथ्वी पर कितने वर्ष बिताए हैं?',
        subtext: 'उम्र आपकी जैविक लय को समझने में मदद करती है।',
        type: 'number',
        placeholder: 'आपकी आयु...',
    },
    {
        id: 'occupation',
        section: 'personal',
        question: 'आपका मुख्य व्यवसाय क्या है?',
        subtext: 'यह आपके उत्पादकता उपकरणों को केंद्रित करने में मदद करता है।',
        type: 'choice',
        options: [
            { id: 'student', label: 'विद्यार्थी', desc: 'ज्ञान और बुद्धि अर्जित करना' },
            { id: 'professional', label: 'पेशेवर', desc: 'संसार में निर्माण और सृजन' },
            { id: 'creative', label: 'रचनात्मक/कलाकार', desc: 'कला के माध्यम से आत्मा को व्यक्त करना' },
            { id: 'entrepreneur', label: 'उद्यमी', desc: 'नेतृत्व और नवाचार' },
            { id: 'home_maker', label: 'गृहिणी', desc: 'पवित्र स्थान का पोषण' },
        ],
    },
    {
        id: 'gender',
        section: 'personal',
        question: 'आप खुद को कैसे पहचानते हैं?',
        subtext: 'आपकी पहचान, आपका चुनाव — हम सभी का स्वागत करते हैं।',
        type: 'choice',
        options: [
            { id: 'male', label: '♂️ पुरुष' },
            { id: 'female', label: '♀️ महिला' },
            { id: 'non_binary', label: '⚧️ नॉन-बाइनरी' },
            { id: 'prefer_not', label: '🤝 बताना नहीं चाहते' },
        ],
    },
    {
        id: 'appetite',
        section: 'ayurveda',
        question: 'आपकी प्राकृतिक भूख कैसी है?',
        subtext: 'आपकी चयापचय अग्नि (अग्नि) का एक प्रमुख संकेतक।',
        type: 'choice',
        options: [
            { id: 'skip', label: 'मैं आसानी से भोजन छोड़ देता/देती हूँ', desc: 'परिवर्तनशील या कम भूख' },
            { id: 'intense', label: 'भोजन छूटने पर मैं चिड़चिड़ा/ी हो जाता/जाती हूँ', desc: 'तीव्र, प्रबल भूख' },
        ],
    },
    {
        id: 'sleep',
        section: 'ayurveda',
        question: 'आपका सामान्य नींद का पैटर्न बताएँ।',
        subtext: 'आपके विश्राम और पुनर्प्राप्ति की गुणवत्ता को दर्शाता है।',
        type: 'choice',
        options: [
            { id: 'light', label: 'हल्की और आसानी से बाधित', desc: 'बार-बार जागना' },
            { id: 'deep', label: 'गहरी और भारी', desc: 'जागना मुश्किल होता है' },
            { id: 'insomnia', label: 'नींद आने में समय लगता है', desc: 'रात में सक्रिय मन' },
        ],
    },
    {
        id: 'digestion',
        section: 'ayurveda',
        question: 'आपका पाचन सामान्यतः कैसा है?',
        type: 'choice',
        options: [
            { id: 'regular', label: 'नियमित और पूर्वानुमानित', desc: 'स्थिर चयापचय दर' },
            { id: 'irregular', label: 'अनियमित/धीमा', desc: 'भारीपन या फूलने की प्रवृत्ति' },
            { id: 'variable', label: 'परिवर्तनशील/गैसयुक्त', desc: 'तनाव या भोजन से बदलता है' },
        ],
    },
    {
        id: 'health_challenges',
        section: 'ayurveda',
        question: 'वर्तमान शारीरिक चुनौतियाँ?',
        subtext: 'जो लागू हों, सभी चुनें।',
        type: 'multi-choice',
        options: [
            { id: 'joint_pain', label: 'जोड़ों का दर्द' },
            { id: 'acidity', label: 'अम्लता/गर्मी' },
            { id: 'fatigue', label: 'बार-बार थकान' },
            { id: 'skin_issues', label: 'त्वचा संवेदनशीलता' },
            { id: 'none', label: 'कोई विशेष नहीं' },
        ],
    },
    {
        id: 'lifeAreas',
        section: 'lifestyle',
        question: 'आप किन क्षेत्रों को बदलना चाहते हैं?',
        subtext: 'हम इन विशिष्ट लक्ष्यों के लिए उपकरण बनाएँगे।',
        type: 'multi-choice',
        options: [
            { id: 'morning_rituals', label: 'प्रातः अनुष्ठान' },
            { id: 'sleep_quality', label: 'नींद की गुणवत्ता' },
            { id: 'focus_productivity', label: 'फोकस और उत्पादकता' },
            { id: 'fitness', label: 'शारीरिक फिटनेस' },
            { id: 'spiritual_practice', label: 'आध्यात्मिक अभ्यास' },
            { id: 'mental_health', label: 'मानसिक कल्याण' },
        ],
    },
    {
        id: 'painPoints',
        section: 'lifestyle',
        question: 'आपकी राह में सबसे बड़ी बाधा क्या है?',
        subtext: 'हमें अपनी चुनौतियाँ पहचानने में मदद करें।',
        type: 'multi-choice',
        options: [
            { id: 'doom_scroll', label: 'अनंत स्क्रॉलिंग' },
            { id: 'procrastinate', label: 'टालमटोल' },
            { id: 'anxiety', label: 'दैनिक चिंता' },
            { id: 'no_routine', label: 'दिनचर्या का अभाव' },
            { id: 'burnout', label: 'निरंतर थकान' },
        ],
    },
    {
        id: 'availableMinutes',
        section: 'lifestyle',
        question: 'आप प्रतिदिन कितने मिनट दे सकते हैं?',
        subtext: 'अवधि से अधिक महत्वपूर्ण है निरंतरता।',
        type: 'choice',
        options: [
            { id: '5', label: '5 मिनट', desc: 'सूक्ष्म-आदतें' },
            { id: '15', label: '15 मिनट', desc: 'मानक अभ्यास' },
            { id: '30', label: '30 मिनट', desc: 'प्रतिबद्ध अनुष्ठान' },
            { id: '60', label: '60+ मिनट', desc: 'गहरा परिवर्तन' },
        ],
    },
    {
        id: 'buddyName',
        section: 'companion',
        question: 'अपने AI साथी का नाम दें',
        subtext: 'OneSUTRA में आपका व्यक्तिगत मार्गदर्शक।',
        type: 'text',
        placeholder: 'जैसे बोधि, आर्य, विवेक...',
    },
    {
        id: 'buddyPersonality',
        section: 'companion',
        question: 'अपने मार्गदर्शक का व्यक्तित्व चुनें',
        type: 'choice',
        options: [
            { id: 'wise_friend', label: 'बुद्धिमान मित्र', desc: 'संतुलित और अंतर्दृष्टिपूर्ण' },
            { id: 'gentle_coach', label: 'सौम्य कोच', desc: 'गर्मजोशी भरा और प्रोत्साहित करने वाला' },
            { id: 'tough_love', label: 'कठोर प्रेम', desc: 'सीधा और अनुशासित' },
            { id: 'calm_monk', label: 'शांत साधु', desc: 'शांत और विशाल चित्त' },
            { id: 'hype_person', label: 'ऊर्जावान मित्र', desc: 'उच्च ऊर्जा और उत्साही' },
        ],
    },
];

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

// ── Page Component ────────────────────────────────────────────────────────────

export default function OnboardingPage() {
    const router = useRouter();
    const { user } = useOneSutraAuth();
    const { completeOnboarding, profile } = useLifestyleEngine();
    const { imageUrl: bgUrl } = useCircadianUnsplash();

    const { lang, setLang } = useLanguage();
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [phase, setPhase] = useState<'language' | 'intro' | 'questions' | 'saving' | 'complete'>('language');

    // Gate: redirect already-onboarded users
    useEffect(() => {
        const localDone = typeof window !== 'undefined' && localStorage.getItem('acharya_onboarding_done') === 'true';
        if (localDone || profile?.onboardingComplete) {
            router.replace('/');
        }
    }, [profile?.onboardingComplete, router]);

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
        if (step.type === 'text' || step.type === 'number' || step.type === 'date') return val && String(val).trim().length > 0;
        return !!val;
    }, [step, answers]);

    const handleNext = useCallback(async () => {
        if (currentStep < stepsData.length - 1) {
            setCurrentStep(s => s + 1);
        } else {
            setPhase('saving');
            const ayurvedicProfile = {
                name: answers.name,
                age: answers.age,
                dob: answers.dob,
                gender: answers.gender,
                prakriti: answers.appetite === 'intense' ? 'Pitta' : 'Vata', // Simple mapping for now
                vikriti: '',
                doshas: '',
                diseases: answers.health_challenges?.join(', ') || 'None',
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
                buddyName: answers.buddyName || 'Bodhi',
                buddyPersonality: (answers.buddyPersonality as BuddyPersonality) || 'wise_friend',
                onboardingComplete: true,
            };

            await saveProfileToFirestore(ayurvedicProfile);
            await completeOnboarding(lifestyleProfile);
            localStorage.setItem('acharya_onboarding_done', 'true');

            setPhase('complete');
            setTimeout(() => router.push('/'), 3000);
        }
    }, [currentStep, answers, completeOnboarding, router]);

    const handleBack = useCallback(() => {
        if (currentStep > 0) setCurrentStep(s => s - 1);
        else setPhase('intro');
    }, [currentStep]);

    const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

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

                {/* Intro Phase — ultra-modern */}
                {phase === 'intro' && (
                    <motion.div
                        key="intro-phase"
                        initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                        style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: 'clamp(2.2rem,6vw,3.2rem) 1.5rem clamp(1.8rem,4vw,2.4rem)', overflow: 'hidden' }}
                    >
                        {/* Ambient glow orbs */}
                        <motion.div animate={{ scale: [1,1.38,1], opacity: [0.32,0.62,0.32] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} style={{ position: 'absolute', top: '-8%', right: '-22%', width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.40) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
                        <motion.div animate={{ scale: [1,1.42,1], opacity: [0.25,0.52,0.25] }} transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut', delay: 2.2 }} style={{ position: 'absolute', bottom: '2%', left: '-22%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,155,40,0.35) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
                        <motion.div animate={{ scale: [1,1.28,1], opacity: [0.18,0.42,0.18] }} transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }} style={{ position: 'absolute', top: '42%', left: '4%', width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.22) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

                        {/* ── TOP: Badge + 6-feature chip grid ── */}
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.62rem', position: 'relative', zIndex: 2 }}>
                            <motion.div
                                initial={{ y: -18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.10, type: 'spring', stiffness: 280, damping: 24 }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.34)', borderRadius: 999, padding: '0.32rem 1rem' }}
                            >
                                <motion.span animate={{ opacity: [1,0.3,1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: 5, height: 5, borderRadius: '50%', background: '#a78bfa', display: 'inline-block', boxShadow: '0 0 7px #a78bfa' }} />
                                <span style={{ fontSize: '0.56rem', color: '#c4b5fd', fontWeight: 700, letterSpacing: '0.17em', textTransform: 'uppercase' }}>Where ancient wisdom meets your era</span>
                            </motion.div>

                            {/* Social media broken callout */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.16, type: 'spring', stiffness: 260, damping: 22 }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 999, padding: '0.32rem 1.1rem' }}
                            >
                                <span style={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500, letterSpacing: '0.04em', textDecoration: 'line-through' }}>{lang === 'hi' ? 'social media टूटा हुआ है' : 'social media is broken'}</span>
                                <span style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.15)', display: 'inline-block' }} />
                                <span style={{ fontSize: '0.56rem', color: '#4ade80', fontWeight: 800, letterSpacing: '0.08em' }}>{lang === 'hi' ? 'हमने fix किया ✦' : 'we fixed it ✦'}</span>
                            </motion.div>

                            {/* Row 1 */}
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                {[
                                    { icon: '🔥', text: 'Streak Engine', color: '#fb923c' },
                                    { icon: '🤖', text: '24/7 AI Buddy', color: '#818cf8' },
                                    { icon: '📸', text: 'Nature Feed', color: '#22d3ee' },
                                ].map((chip, i) => (
                                    <motion.div key={chip.text} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.18 + i * 0.08, type: 'spring', stiffness: 320, damping: 22 }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.24rem', background: `${chip.color}13`, border: `1px solid ${chip.color}32`, borderRadius: 999, padding: '0.25rem 0.65rem' }}>
                                        <span style={{ fontSize: '0.65rem' }}>{chip.icon}</span>
                                        <span style={{ fontSize: '0.55rem', color: chip.color, fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{chip.text}</span>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Row 2 */}
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                {[
                                    { icon: '🎵', text: 'Healing Mantras', color: '#e879f9' },
                                    { icon: '📅', text: 'Life Manager', color: '#4ade80' },
                                    { icon: '⚡', text: 'Sangha', color: '#fbbf24' },
                                ].map((chip, i) => (
                                    <motion.div key={chip.text} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.42 + i * 0.08, type: 'spring', stiffness: 320, damping: 22 }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.24rem', background: `${chip.color}13`, border: `1px solid ${chip.color}32`, borderRadius: 999, padding: '0.25rem 0.65rem' }}>
                                        <span style={{ fontSize: '0.65rem' }}>{chip.icon}</span>
                                        <span style={{ fontSize: '0.55rem', color: chip.color, fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{chip.text}</span>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Health monitors strip */}
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.62 }}
                                style={{ display: 'flex', gap: '0.28rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 360 }}
                            >
                                {[
                                    { icon: '💗', label: lang === 'hi' ? 'Health OS' : 'Health OS' },
                                    { icon: '📈', label: lang === 'hi' ? 'Progress' : 'Progress' },
                                    { icon: '🥗', label: lang === 'hi' ? 'Diet' : 'Diet' },
                                    { icon: '😴', label: lang === 'hi' ? 'Sleep' : 'Sleep' },
                                    { icon: '💼', label: lang === 'hi' ? 'Work' : 'Work' },
                                    { icon: '🧘', label: lang === 'hi' ? 'Stress' : 'Stress' },
                                ].map((m) => (
                                    <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: '0.18rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 999, padding: '0.18rem 0.52rem' }}>
                                        <span style={{ fontSize: '0.58rem' }}>{m.icon}</span>
                                        <span style={{ fontSize: '0.46rem', color: 'rgba(255,255,255,0.50)', fontWeight: 600, letterSpacing: '0.06em' }}>{m.label}</span>
                                    </div>
                                ))}
                            </motion.div>
                        </div>

                        {/* ── CENTRE: Headline + mini showcase cards + stats ── */}
                        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', width: '100%' }}>
                            <motion.h1
                                initial={{ y: 32, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.40, duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
                                style={{ fontSize: 'clamp(1.9rem, 7.8vw, 2.9rem)', fontWeight: 900, lineHeight: 1.12, marginBottom: '0.55rem', letterSpacing: '-0.028em' }}
                            >
                                {lang === 'hi' ? (
                                    <>
                                        <span style={{ color: '#fff' }}>तुम्हारा </span>
                                        <span style={{ background: 'linear-gradient(130deg, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>vibe</span>
                                        <span style={{ color: '#fff' }}>,</span>
                                        <br />
                                        <span style={{ color: '#fff' }}>तुम्हारा </span>
                                        <span style={{ background: 'linear-gradient(130deg, #a78bfa, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>universe</span>
                                    </>
                                ) : (
                                    <>
                                        <span style={{ color: '#fff' }}>Your </span>
                                        <span style={{ background: 'linear-gradient(130deg, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>vibe</span>
                                        <span style={{ color: '#fff' }}>.</span>
                                        <br />
                                        <span style={{ color: '#fff' }}>Your </span>
                                        <span style={{ background: 'linear-gradient(130deg, #a78bfa, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>universe</span>
                                        <span style={{ color: 'rgba(255,255,255,0.9)' }}>.</span>
                                    </>
                                )}
                            </motion.h1>

                            <motion.p
                                initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.58 }}
                                style={{ fontSize: 'clamp(0.76rem, 2.1vw, 0.88rem)', color: 'rgba(255,255,255,0.46)', maxWidth: 300, margin: '0 auto 1rem', lineHeight: 1.72 }}
                            >
                                {lang === 'hi'
                                    ? 'तुम्हारा social rebuilt हुआ · 24/7 AI · Vedic healing mantras + stotras · Life OS · Health, diet, sleep, stress, work monitor — सब कुछ एक जगह।'
                                    : 'Your social, rebuilt. 24/7 AI buddy. Vedic healing mantras & stotras. Life OS. Health, diet, sleep, stress & work monitor — all yours.'}
                            </motion.p>

                            {/* Mini feature showcase — 3 glass cards */}
                            <motion.div
                                initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.70 }}
                                style={{ display: 'flex', gap: '0.48rem', justifyContent: 'center', marginBottom: '1rem' }}
                            >
                                {[
                                    { icon: '📸', title: 'Nature Feed', sub: lang === 'hi' ? 'travel vibes' : 'travel vibes', grad: 'rgba(34,211,238,0.09)', border: 'rgba(34,211,238,0.26)', glow: '#22d3ee' },
                                    { icon: '🎵', title: lang === 'hi' ? 'Mantras' : 'Mantras', sub: lang === 'hi' ? 'heal vibrations' : 'heal vibrations', grad: 'rgba(232,121,249,0.09)', border: 'rgba(232,121,249,0.26)', glow: '#e879f9' },
                                    { icon: '📅', title: 'Life OS', sub: lang === 'hi' ? 'daily win' : 'daily win', grad: 'rgba(74,222,128,0.09)', border: 'rgba(74,222,128,0.26)', glow: '#4ade80' },
                                    { icon: '🤖', title: 'AI 24/7', sub: lang === 'hi' ? 'always on' : 'always on', grad: 'rgba(129,140,248,0.09)', border: 'rgba(129,140,248,0.26)', glow: '#818cf8' },
                                ].map((card, i) => (
                                    <motion.div
                                        key={card.title}
                                        initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.72 + i * 0.07, type: 'spring', stiffness: 260, damping: 20 }}
                                        style={{ flex: 1, padding: '0.55rem 0.3rem', borderRadius: '0.85rem', background: card.grad, border: `1px solid ${card.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.18rem', boxShadow: `0 4px 16px ${card.glow}18` }}
                                    >
                                        <span style={{ fontSize: '1rem', lineHeight: 1 }}>{card.icon}</span>
                                        <span style={{ fontSize: '0.50rem', color: '#fff', fontWeight: 700, letterSpacing: '0.03em', lineHeight: 1.2 }}>{card.title}</span>
                                        <span style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.38)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{card.sub}</span>
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* Social proof stats */}
                            <motion.div
                                initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.85 }}
                                style={{ display: 'flex', justifyContent: 'center', gap: '1.8rem' }}
                            >
                                {[
                                    { num: '10K+', label: lang === 'hi' ? 'Legends' : 'Legends' },
                                    { num: '24/7', label: lang === 'hi' ? 'AI Buddy' : 'AI Buddy' },
                                    { num: '∞', label: lang === 'hi' ? 'Stotras' : 'Stotras' },
                                ].map((s) => (
                                    <div key={s.label} style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24', lineHeight: 1, letterSpacing: '-0.01em' }}>{s.num}</div>
                                        <div style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.34)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '0.2rem' }}>{s.label}</div>
                                    </div>
                                ))}
                            </motion.div>
                        </div>

                        {/* ── BOTTOM: CTA ── */}
                        <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.72rem' }}>
                            <motion.button
                                initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.96, type: 'spring', stiffness: 240, damping: 22 }}
                                whileHover={{ scale: 1.035, boxShadow: '0 14px 44px rgba(200,155,40,0.58)' }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setPhase('questions')}
                                style={{ width: '100%', padding: '1.22rem 2rem', borderRadius: '2rem', background: 'linear-gradient(132deg, #b8860b 0%, #fbbf24 52%, #f59e0b 100%)', color: '#030110', fontWeight: 800, fontSize: '1.08rem', cursor: 'pointer', border: 'none', boxShadow: '0 8px 34px rgba(200,155,40,0.44)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', letterSpacing: '-0.01em' }}
                            >
                                <motion.div
                                    animate={{ x: ['-130%', '230%'] }}
                                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.4 }}
                                    style={{ position: 'absolute', top: 0, bottom: 0, width: '36%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.48), transparent)', pointerEvents: 'none' }}
                                />
                                <span>{lang === 'hi' ? 'यात्रा प्रारंभ करें' : 'Begin Your Journey'}</span>
                                <span style={{ fontSize: '1.1rem', fontWeight: 900 }}>→</span>
                            </motion.button>

                            <motion.p
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.18 }}
                                style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.26)', letterSpacing: '0.14em', textTransform: 'uppercase' }}
                            >
                                {lang === 'hi' ? '⏱ 3 मिनट  ·  🔒 निजी  ·  ✦ अभी शुरू करें' : '⏱ 3 min  ·  🔒 Private  ·  ✦ Start now'}
                            </motion.p>
                        </div>
                    </motion.div>
                )}

                {/* Questions Phase */}
                {phase === 'questions' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', padding: '1.5rem' }}
                    >
                        {/* Progress Bar */}
                        <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginBottom: '1.5rem', marginTop: '1rem', flexShrink: 0 }}>
                            <motion.div
                                initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                                style={{ height: '100%', background: '#c89b28', borderRadius: 2, boxShadow: '0 0 10px #c89b28' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                <span>{step.section}</span>
                                <span>{currentStep + 1} / {stepsData.length}</span>
                            </div>
                        </div>

                        {/* Question Card — scrollable on small screens */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '1rem' }}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStep}
                                    initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
                                    transition={{ duration: 0.4 }}
                                    style={{ width: '100%', maxWidth: 500, paddingTop: '0.5rem' }}
                                >
                                    <h2 style={{ fontSize: 'clamp(1.35rem, 5vw, 2rem)', color: '#fff', fontWeight: 600, marginBottom: '0.5rem', textAlign: 'center', fontFamily: 'Georgia, serif' }}>
                                        {step.question}
                                    </h2>
                                    {step.subtext && (
                                        <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1.25rem', textAlign: 'center' }}>
                                            {step.subtext}
                                        </p>
                                    )}

                                    {/* Input Types */}
                                    {step.type === 'text' && (
                                        <input
                                            autoFocus
                                            type="text"
                                            value={answers[step.id] || ''}
                                            onChange={(e) => handleAnswer(step.id, e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && canContinue && handleNext()}
                                            placeholder={step.placeholder}
                                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '1rem', padding: '1.2rem', color: '#fff', fontSize: '1.2rem', outline: 'none', textAlign: 'center' }}
                                        />
                                    )}

                                    {step.type === 'date' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
                                            <input
                                                autoFocus
                                                type="date"
                                                value={answers[step.id] || ''}
                                                onChange={(e) => handleAnswer(step.id, e.target.value)}
                                                max={new Date().toISOString().split('T')[0]}
                                                style={{
                                                    width: '100%', background: 'rgba(255,255,255,0.07)',
                                                    border: '1px solid rgba(255,255,255,0.22)', borderRadius: '1rem',
                                                    padding: '1.2rem', color: '#fff', fontSize: '1.1rem',
                                                    outline: 'none', textAlign: 'center', colorScheme: 'dark' as const,
                                                }}
                                            />
                                            {answers[step.id] && (
                                                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', fontFamily: "'Outfit',sans-serif" }}>
                                                    🎂 {new Date(answers[step.id]).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {step.type === 'number' && (
                                        <input
                                            autoFocus
                                            type="number"
                                            value={answers[step.id] || ''}
                                            onChange={(e) => handleAnswer(step.id, e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && canContinue && handleNext()}
                                            placeholder={step.placeholder}
                                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '1rem', padding: '1.2rem', color: '#fff', fontSize: '1.2rem', outline: 'none', textAlign: 'center' }}
                                        />
                                    )}

                                    {(step.type === 'choice' || step.type === 'multi-choice') && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {step.options?.map(opt => {
                                                const isSelected = step.type === 'multi-choice'
                                                    ? (answers[step.id] || []).includes(opt.id)
                                                    : answers[step.id] === opt.id;
                                                return (
                                                    <motion.button
                                                        key={opt.id}
                                                        whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.1)' }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => handleAnswer(step.id, opt.id, step.type === 'multi-choice')}
                                                        style={{
                                                            width: '100%', padding: '1.2rem', borderRadius: '1.2rem',
                                                            background: isSelected ? 'rgba(200,155,40,0.15)' : 'rgba(255,255,255,0.05)',
                                                            border: `1.5px solid ${isSelected ? '#c89b28' : 'rgba(255,255,255,0.1)'}`,
                                                            color: '#fff', textAlign: 'left', cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                                        }}
                                                    >
                                                        <div>
                                                            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{opt.label}</div>
                                                            {opt.desc && <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>{opt.desc}</div>}
                                                        </div>
                                                        {isSelected && <Check size={20} color="#c89b28" />}
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Navigation Footer — always pinned */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(3,1,16,0.7)', backdropFilter: 'blur(12px)', marginTop: '0.25rem' }}>
                            <button
                                onClick={handleBack}
                                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
                            >
                                <ChevronLeft size={18} /> {lang === 'hi' ? 'वापस' : 'Back'}
                            </button>
                            <motion.button
                                disabled={!canContinue}
                                whileHover={canContinue ? { scale: 1.05 } : {}}
                                whileTap={canContinue ? { scale: 0.95 } : {}}
                                onClick={handleNext}
                                style={{
                                    padding: '1rem 2.5rem', borderRadius: '2.5rem',
                                    background: canContinue ? 'linear-gradient(135deg, #c89b28, #fbbf24)' : 'rgba(255,255,255,0.1)',
                                    color: canContinue ? '#030110' : 'rgba(255,255,255,0.3)',
                                    fontWeight: 700, fontSize: '1rem', border: 'none',
                                    cursor: canContinue ? 'pointer' : 'default',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    opacity: canContinue ? 1 : 0.5, transition: 'all 0.3s',
                                }}
                            >
                                {currentStep === stepsData.length - 1
                                    ? (lang === 'hi' ? 'यात्रा पूर्ण करें' : 'Complete Journey')
                                    : (lang === 'hi' ? 'अगला प्रश्न' : 'Next Question')}
                                <ChevronRight size={18} />
                            </motion.button>
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
