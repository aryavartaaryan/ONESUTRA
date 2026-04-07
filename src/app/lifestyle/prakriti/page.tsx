'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, RefreshCw, Sparkles, Wind } from 'lucide-react';
import { useDoshaEngine } from '@/hooks/useDoshaEngine';
import { useGeminiTTS } from '@/hooks/useGeminiTTS';
import { DOSHA_INFO, generateDoshaStory, type Prakriti, type Vikriti } from '@/lib/doshaService';
import type { QuizAnswer } from '@/lib/doshaService';
import { useLanguage } from '@/context/LanguageContext';
import { useSpeechInput } from '@/hooks/useSpeechInput';

// ─── Quiz Question Data ────────────────────────────────────────────────────────

interface AnswerOption {
  id: string;
  label: string;
  desc?: string;
  doshaEffect: { vata: number; pitta: number; kapha: number };
}

interface QuizQuestion {
  id: string;
  section: 'prakriti' | 'vikriti' | 'lifestyle';
  question: string;
  subtext?: string;
  emoji: string;
  answers: AnswerOption[];
}

const PRAKRITI_QUESTIONS: QuizQuestion[] = [
  {
    id: 'body_frame',
    section: 'prakriti',
    question: 'Your natural body frame — as it has always been since childhood?',
    subtext: 'Think of your natural build, not current weight.',
    emoji: '🪶',
    answers: [
      { id: 'thin', label: 'Thin & Light', desc: 'Lean, hard to gain weight, prominent joints', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'medium', label: 'Medium & Athletic', desc: 'Moderate, well-proportioned, muscular', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'large', label: 'Large & Sturdy', desc: 'Broad, tends to gain weight easily, solid', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'skin',
    section: 'prakriti',
    question: 'Your natural skin texture (without products)?',
    emoji: '🌸',
    answers: [
      { id: 'dry', label: 'Dry & Rough', desc: 'Tends to crack, flake, or feel tight', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'sensitive', label: 'Sensitive & Warm', desc: 'Redness-prone, freckled, burns easily', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'oily', label: 'Oily & Smooth', desc: 'Thick, lustrous, ages slowly', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'hair',
    section: 'prakriti',
    question: 'Your natural hair type?',
    emoji: '💇',
    answers: [
      { id: 'dry_frizzy', label: 'Dry & Frizzy', desc: 'Fine, tangles easily, prone to breakage', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'fine_oily', label: 'Fine & Oily', desc: 'Straight, tends to go grey/thin early', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'thick_wavy', label: 'Thick & Wavy', desc: 'Abundant, lustrous, strong', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'digestion',
    section: 'prakriti',
    question: 'Your typical digestion pattern?',
    emoji: '🔥',
    answers: [
      { id: 'irregular', label: 'Irregular & Variable', desc: 'Sometimes fast, sometimes slow — hard to predict', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'sharp_fast', label: 'Sharp & Fast', desc: 'Strong appetite, digests quickly, gets hangry', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'slow_steady', label: 'Slow & Steady', desc: 'Low appetite, digests slowly but reliably', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'sleep',
    section: 'prakriti',
    question: 'Your natural sleep pattern?',
    emoji: '🌙',
    answers: [
      { id: 'light', label: 'Light & Disrupted', desc: 'Wake often, light sleeper, vivid dreams', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'moderate', label: 'Moderate & Medium', desc: 'Fall asleep well, wake occasionally', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'deep_long', label: 'Deep & Long', desc: 'Heavy sleeper, hard to wake, love to sleep', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'energy',
    section: 'prakriti',
    question: 'How does your energy naturally move through the day?',
    emoji: '⚡',
    answers: [
      { id: 'bursts', label: 'Bursts & Crashes', desc: 'Intense energy spurts, then sudden fatigue', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'intense_focused', label: 'Intense & Focused', desc: 'Sustained drive, can overdo it', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'steady_slow', label: 'Steady & Slow', desc: 'Takes time to start, but goes all day', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'emotions',
    section: 'prakriti',
    question: 'Your natural emotional tendencies?',
    emoji: '💭',
    answers: [
      { id: 'anxious_creative', label: 'Anxious & Creative', desc: 'Imaginative but worry-prone, sensitive', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'ambitious_irritable', label: 'Ambitious & Intense', desc: 'Goal-driven, can become irritable under pressure', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'calm_attached', label: 'Calm & Attached', desc: 'Easy-going, loving, but holds on too long', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'appetite',
    section: 'prakriti',
    question: 'Your natural appetite pattern?',
    emoji: '🍽️',
    answers: [
      { id: 'variable', label: 'Variable', desc: 'Sometimes starving, sometimes no interest in food', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'strong_intense', label: 'Strong & Intense', desc: 'Must eat on time — gets very uncomfortable if skipped', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'low_consistent', label: 'Low & Consistent', desc: 'Can skip meals easily, appetite is mild', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'bowel',
    section: 'prakriti',
    question: 'Your typical bowel movement pattern?',
    subtext: 'This is a key Ayurvedic indicator — be honest.',
    emoji: '🌿',
    answers: [
      { id: 'irregular', label: 'Irregular', desc: 'Sometimes constipated, hard or dry stools', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'loose_frequent', label: 'Loose & Frequent', desc: 'Soft, regular, sometimes too frequent', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'slow_once', label: 'Slow, Once Daily', desc: 'Regular, heavy, complete — though slow to happen', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'temperature',
    section: 'prakriti',
    question: 'Your temperature preference?',
    emoji: '🌡️',
    answers: [
      { id: 'loves_warmth', label: 'Loves Warmth', desc: 'Cold hands/feet, hate cold weather', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'loves_cool', label: 'Loves Cool', desc: 'Run hot, prefer cool environments', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'loves_both', label: 'Adaptable', desc: 'Generally comfortable in most temperatures', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'memory',
    section: 'prakriti',
    question: 'How is your memory and learning style?',
    emoji: '🧠',
    answers: [
      { id: 'quick_forget', label: 'Quick to Learn, Quick to Forget', desc: 'Pick things up fast but retention is short', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'sharp_focused', label: 'Sharp & Focused', desc: 'Excellent focused memory, analytical', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'slow_never_forget', label: 'Slow to Learn, Never Forgets', desc: 'Takes time but remembers everything permanently', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'speech',
    section: 'prakriti',
    question: 'Your natural speech pattern?',
    emoji: '🗣️',
    answers: [
      { id: 'fast_lots', label: 'Fast & Talkative', desc: 'Speak quickly, jump between topics, lots of words', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'precise_sharp', label: 'Precise & Direct', desc: 'Sharp, to the point, persuasive', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'slow_melodious', label: 'Slow & Melodious', desc: 'Soft, thoughtful, deliberate pace', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'weather',
    section: 'prakriti',
    question: 'Which weather bothers you most?',
    emoji: '🌦️',
    answers: [
      { id: 'cold_wind', label: 'Cold & Windy', desc: 'Wind and cold make you uncomfortable', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'heat_sun', label: 'Heat & Direct Sun', desc: 'Get overheated, sunburn easily', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'cold_damp', label: 'Cold & Damp', desc: 'Damp, cloudy weather makes you heavy', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'stress_response',
    section: 'prakriti',
    question: 'How do you naturally respond to stress?',
    emoji: '🌊',
    answers: [
      { id: 'anxious_overwhelmed', label: 'Anxious & Overwhelmed', desc: 'Worry, freeze, or scatter in all directions', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'irritable_intense', label: 'Irritable & Intense', desc: 'Get angry, push harder, take control', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'withdraw_avoid', label: 'Withdraw & Avoid', desc: 'Go quiet, sleep more, eat for comfort', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'joints',
    section: 'prakriti',
    question: 'Your joints and body build?',
    emoji: '🦴',
    answers: [
      { id: 'prominent_crack', label: 'Prominent & Cracking', desc: 'Joints crack, prominent bones, lean frame', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'moderate_flexible', label: 'Moderate & Flexible', desc: 'Well-proportioned, moderate flexibility', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'large_padded', label: 'Large & Well-Padded', desc: 'Broad, cushioned joints, stable frame', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
];

const PRAKRITI_QUESTIONS_HI: QuizQuestion[] = [
  { id: 'body_frame', section: 'prakriti', question: 'आपका प्राकृतिक शारीरिक ढांचा — जैसा बचपन से है?', subtext: 'अपना स्वाभाविक ढांचा सोचें, वर्तमान वज़न नहीं।', emoji: '🪶',
    answers: [
      { id: 'thin',   label: 'पतला और हल्का',    desc: 'दुबला, वज़न बढ़ाना कठिन, हड्डियाँ उभरी हुई', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'medium', label: 'मध्यम और एथलेटिक', desc: 'संतुलित, अच्छी बनावट, मांसपेशीय',         doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'large',  label: 'बड़ा और मज़बूत',     desc: 'चौड़ा, आसानी से वज़न बढ़ता है, ठोस',        doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ] },
  { id: 'skin', section: 'prakriti', question: 'आपकी प्राकृतिक त्वचा की बनावट (बिना उत्पादों के)?', emoji: '🌸',
    answers: [
      { id: 'dry',       label: 'शुष्क और खुरदरी',    desc: 'फटने, छिलने या तंग महसूस होने की प्रवृत्ति', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'sensitive', label: 'संवेदनशील और गर्म', desc: 'लालिमा-प्रवण, झाईं, जल्दी जलना',         doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'oily',      label: 'तैलीय और चिकनी',    desc: 'मोटी, चमकदार, उम्र धीमे आती है',          doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ] },
  { id: 'hair', section: 'prakriti', question: 'आपके बालों का प्राकृतिक प्रकार?', emoji: '💇',
    answers: [
      { id: 'dry_frizzy',  label: 'शुष्क और घुंघराले', desc: 'पतले, उलझने की प्रवृत्ति, टूटने का खतरा', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'fine_oily',   label: 'पतले और तैलीय',    desc: 'सीधे, जल्दी सफ़ेद/पतले होते हैं',         doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'thick_wavy',  label: 'घने और लहरदार',    desc: 'भरपूर, चमकदार, मज़बूत',                  doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ] },
  { id: 'digestion', section: 'prakriti', question: 'आपका सामान्य पाचन पैटर्न?', emoji: '🔥',
    answers: [
      { id: 'irregular',   label: 'अनियमित और परिवर्तनशील', desc: 'कभी तेज़, कभी धीमा — अप्रत्याशित',    doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'sharp_fast',  label: 'तेज़ और शीघ्र',         desc: 'तीव्र भूख, जल्दी पचता, भूख में चिड़चिड़ापन', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'slow_steady', label: 'धीमा और स्थिर',          desc: 'कम भूख, धीमे लेकिन भरोसेमंद पाचन',     doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ] },
  { id: 'sleep', section: 'prakriti', question: 'आपका प्राकृतिक नींद पैटर्न?', emoji: '🌙',
    answers: [
      { id: 'light',     label: 'हल्की और बाधित', desc: 'बार-बार जागना, हल्की नींद, जीवंत सपने', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'moderate',  label: 'मध्यम',           desc: 'नींद अच्छी आती है, कभी-कभी जागना',      doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'deep_long', label: 'गहरी और लंबी',   desc: 'गहरी नींद, जागना मुश्किल, नींद पसंद',  doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ] },
  { id: 'energy', section: 'prakriti', question: 'दिन में आपकी ऊर्जा कैसे प्रवाहित होती है?', emoji: '⚡',
    answers: [
      { id: 'bursts',          label: 'उछाल और गिरावट',       desc: 'तीव्र ऊर्जा के झटके, फिर अचानक थकान',   doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'intense_focused', label: 'तीव्र और केंद्रित',    desc: 'निरंतर प्रेरणा, अति कर सकते हैं',        doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'steady_slow',     label: 'स्थिर और धीमी',        desc: 'शुरू होने में समय, पर दिनभर चलते हैं', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ] },
  { id: 'emotions', section: 'prakriti', question: 'आपकी प्राकृतिक भावनात्मक प्रवृत्तियाँ?', emoji: '💭',
    answers: [
      { id: 'anxious_creative',   label: 'चिंतित और रचनात्मक', desc: 'कल्पनाशील लेकिन चिंता-प्रवण, संवेदनशील',    doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'ambitious_irritable',label: 'महत्वाकांक्षी और तीव्र', desc: 'लक्ष्य-उन्मुख, दबाव में चिड़चिड़े हो सकते हैं', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'calm_attached',      label: 'शांत और आसक्त',     desc: 'सहज, प्रेमपूर्ण, लेकिन ज़्यादा देर पकड़ते हैं', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ] },
  { id: 'appetite', section: 'prakriti', question: 'आपका प्राकृतिक भूख पैटर्न?', emoji: '🍽️',
    answers: [
      { id: 'variable',       label: 'परिवर्तनशील',      desc: 'कभी बहुत भूखे, कभी खाने में रुचि नहीं', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'strong_intense', label: 'तीव्र और प्रबल',  desc: 'समय पर खाना ज़रूरी — भोजन छोड़ना असहज',  doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'low_consistent', label: 'कम और नियमित',   desc: 'भोजन आसानी से छोड़ सकते हैं, हल्की भूख',  doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ] },
  { id: 'bowel', section: 'prakriti', question: 'आपका सामान्य मलत्याग पैटर्न?', subtext: 'यह एक महत्वपूर्ण आयुर्वेदिक संकेतक है — ईमानदारी से उत्तर दें।', emoji: '🌿',
    answers: [
      { id: 'irregular',    label: 'अनियमित',                desc: 'कभी-कभी कब्ज़, कठोर या शुष्क मल',          doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'loose_frequent',label: 'ढीला और बार-बार',      desc: 'मुलायम, नियमित, कभी-कभी बहुत बार',        doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'slow_once',    label: 'धीमा, दिन में एक बार', desc: 'नियमित, भारी, पूर्ण — हालांकि देर से',    doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ] },
  { id: 'temperature', section: 'prakriti', question: 'आपकी तापमान प्राथमिकता?', emoji: '🌡️',
    answers: [
      { id: 'loves_warmth', label: 'गर्मी पसंद',    desc: 'ठंडे हाथ/पैर, ठंड से नफ़रत',    doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'loves_cool',   label: 'ठंड पसंद',    desc: 'गर्मी लगती है, ठंडा वातावरण पसंद', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'loves_both',   label: 'अनुकूलनीय',   desc: 'ज़्यादातर तापमान में सहज',          doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ] },
  { id: 'memory', section: 'prakriti', question: 'आपकी याददाश्त और सीखने की शैली?', emoji: '🧠',
    answers: [
      { id: 'quick_forget',      label: 'जल्दी सीखना, जल्दी भूलना',  desc: 'चीज़ें जल्दी समझते हैं लेकिन याददाश्त कम', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'sharp_focused',     label: 'तीव्र और केंद्रित',         desc: 'उत्कृष्ट केंद्रित स्मृति, विश्लेषणात्मक',  doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'slow_never_forget', label: 'धीमे सीखना, कभी नहीं भूलना', desc: 'समय लेते हैं लेकिन सब हमेशा याद रहता है', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ] },
  { id: 'speech', section: 'prakriti', question: 'आपका प्राकृतिक बोलने का तरीका?', emoji: '🗣️',
    answers: [
      { id: 'fast_lots',      label: 'तेज़ और बातूनी',  desc: 'तेज़ बोलते हैं, विषय बदलते हैं, ज़्यादा शब्द', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'precise_sharp',  label: 'सटीक और प्रत्यक्ष', desc: 'तीखा, सीधा, प्रेरक',                          doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'slow_melodious', label: 'धीमा और मधुर',     desc: 'नरम, विचारशील, सुचिंतित',                    doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ] },
  { id: 'weather', section: 'prakriti', question: 'कौन सा मौसम आपको सबसे ज़्यादा परेशान करता है?', emoji: '🌦️',
    answers: [
      { id: 'cold_wind', label: 'ठंडा और तूफ़ानी', desc: 'हवा और ठंड से असहजता',           doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'heat_sun',  label: 'गर्मी और तेज़ धूप', desc: 'जल्दी गर्म होना, आसानी से जलना', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'cold_damp', label: 'ठंडा और नम',     desc: 'नम मौसम भारी और सुस्त लगता है',   doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ] },
  { id: 'stress_response', section: 'prakriti', question: 'तनाव में आपकी प्राकृतिक प्रतिक्रिया?', emoji: '🌊',
    answers: [
      { id: 'anxious_overwhelmed', label: 'चिंतित और अभिभूत', desc: 'चिंता, ठहराव, या सभी दिशाओं में बिखरना', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'irritable_intense',   label: 'चिड़चिड़ा और तीव्र', desc: 'क्रोध, अधिक प्रयास, नियंत्रण लेना',    doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'withdraw_avoid',      label: 'पीछे हटना और टालना', desc: 'चुप हो जाना, ज़्यादा सोना, खाकर सुकून', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ] },
  { id: 'joints', section: 'prakriti', question: 'आपके जोड़ और शरीर की बनावट?', emoji: '🦴',
    answers: [
      { id: 'prominent_crack',  label: 'उभरे हुए और चटकने वाले', desc: 'जोड़ चटकते हैं, हड्डियाँ उभरी, दुबला ढांचा', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'moderate_flexible',label: 'मध्यम और लचीले',         desc: 'अच्छी बनावट, मध्यम लचीलापन',              doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'large_padded',     label: 'बड़े और गद्देदार',         desc: 'चौड़े, गद्दीदार जोड़, स्थिर ढांचा',      doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ] },
];

const VIKRITI_QUESTIONS_HI: QuizQuestion[] = [
  { id: 'v_energy', section: 'vikriti', question: 'पिछले 2 हफ़्तों में आपकी ऊर्जा कैसी रही है?', emoji: '⚡',
    answers: [
      { id: 'v_scattered', label: 'बिखरी और चिंतित',   desc: 'बेचैन, अनियमित, ध्यान केंद्रित करना कठिन',   doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'v_intense',   label: 'तीव्र और अतिसक्रिय', desc: 'प्रेरित लेकिन चिड़चिड़े या सूजन महसूस',      doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'v_heavy',     label: 'भारी और कम',         desc: 'सुस्त, अप्रेरित, शुरू करना मुश्किल',         doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
      { id: 'v_balanced',  label: 'संतुलित और स्थिर',   desc: 'सामान्यतः स्थिर और अच्छा',                   doshaEffect: { vata: 1, pitta: 1, kapha: 1 } },
    ] },
  { id: 'v_digestion', section: 'vikriti', question: 'अभी आपका पाचन कैसा है?', emoji: '🔥',
    answers: [
      { id: 'v_bloated',    label: 'फूला और अनियमित',  desc: 'गैस, कब्ज़, अप्रत्याशित',                   doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'v_acidic',     label: 'अम्लीय और तेज़',    desc: 'अम्लता, सीने में जलन, ढीले मल',              doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'v_slow_heavy', label: 'धीमा और भारी',      desc: 'खाने के बाद भारीपन, मतली, धीमा पाचन',        doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
      { id: 'v_good',       label: 'अच्छा और नियमित',   desc: 'पाचन सामान्य लग रहा है',                     doshaEffect: { vata: 1, pitta: 1, kapha: 1 } },
    ] },
  { id: 'v_sleep', section: 'vikriti', question: 'हाल ही में आपकी नींद कैसी रही है?', emoji: '🌙',
    answers: [
      { id: 'v_insomnia',       label: 'हल्की और बाधित',      desc: 'नींद आने में कठिनाई, रात में जागना',        doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'v_waking_midnight',label: 'रात 10-2 बजे जागना',  desc: 'आधी रात को सक्रिय मन, अधिक गर्मी',         doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'v_excessive',      label: 'अत्यधिक और भारी',     desc: 'बहुत ज़्यादा सोना, जागना मुश्किल, सुस्ती',  doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
      { id: 'v_normal_sleep',   label: 'सामान्य और तरोताज़ा', desc: 'नींद अच्छी लग रही है',                      doshaEffect: { vata: 1, pitta: 1, kapha: 1 } },
    ] },
  { id: 'v_mood', section: 'vikriti', question: 'हाल ही में कौन सी भावनात्मक स्थिति सबसे अधिक है?', emoji: '💭',
    answers: [
      { id: 'v_anxiety',   label: 'चिंता और घबराहट',     desc: 'अधिक सोचना, डर, बेचैनी, बिखराव',          doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'v_anger',     label: 'चिड़चिड़ापन और निराशा', desc: 'जल्दी क्रोध, अधीरता, आलोचना',              doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'v_lethargy',  label: 'भारीपन और उदासी',     desc: 'कम प्रेरणा, पीछे हटना, आसक्ति',            doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
      { id: 'v_content',   label: 'अधिकतर संतुष्ट',      desc: 'भावनात्मक रूप से स्थिर और ठीक',            doshaEffect: { vata: 1, pitta: 1, kapha: 1 } },
    ] },
  { id: 'v_physical', section: 'vikriti', question: 'हाल ही में कोई शारीरिक लक्षण?', emoji: '🌿',
    answers: [
      { id: 'v_dry_cramps',    label: 'शुष्कता, जोड़ दर्द, ऐंठन', desc: 'शुष्क त्वचा, कब्ज़, मांसपेशियों में तनाव', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'v_inflammation',  label: 'सूजन और त्वचा समस्याएँ',   desc: 'चकत्ते, अम्लता, जलन',                       doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'v_congestion',    label: 'कफ और वज़न बढ़ना',           desc: 'बलगम, भारीपन, सूजन',                        doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
      { id: 'v_none',          label: 'कोई विशेष नहीं',             desc: 'शारीरिक रूप से ठीक महसूस हो रहा है',       doshaEffect: { vata: 1, pitta: 1, kapha: 1 } },
    ] },
];

const VIKRITI_QUESTIONS: QuizQuestion[] = [
  {
    id: 'v_energy',
    section: 'vikriti',
    question: 'How has your energy been in the last 2 weeks?',
    emoji: '⚡',
    answers: [
      { id: 'v_scattered', label: 'Scattered & Anxious', desc: 'Restless, irregular, hard to focus', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'v_intense', label: 'Intense & Overheated', desc: 'Driven but irritable or inflamed', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'v_heavy', label: 'Heavy & Low', desc: 'Sluggish, unmotivated, hard to start', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
      { id: 'v_balanced', label: 'Balanced & Steady', desc: 'Generally stable and good', doshaEffect: { vata: 1, pitta: 1, kapha: 1 } },
    ],
  },
  {
    id: 'v_digestion',
    section: 'vikriti',
    question: 'How is your digestion right now?',
    emoji: '🔥',
    answers: [
      { id: 'v_bloated', label: 'Bloated & Irregular', desc: 'Gas, constipation, unpredictable', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'v_acidic', label: 'Acidic & Sharp', desc: 'Acidity, heartburn, loose stools', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'v_slow_heavy', label: 'Slow & Heavy', desc: 'Heaviness after eating, nausea, slow digestion', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
      { id: 'v_good', label: 'Good & Regular', desc: 'Digestion feels normal', doshaEffect: { vata: 1, pitta: 1, kapha: 1 } },
    ],
  },
  {
    id: 'v_sleep',
    section: 'vikriti',
    question: 'How has your sleep been recently?',
    emoji: '🌙',
    answers: [
      { id: 'v_insomnia', label: 'Light & Disrupted', desc: 'Hard to fall asleep, waking at night, anxious dreams', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'v_waking_midnight', label: 'Waking 10PM–2AM', desc: 'Active mind at midnight, overheated', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'v_excessive', label: 'Excessive & Heavy', desc: 'Sleeping too much, hard to wake, groggy', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
      { id: 'v_normal_sleep', label: 'Normal & Refreshing', desc: 'Sleep feels good', doshaEffect: { vata: 1, pitta: 1, kapha: 1 } },
    ],
  },
  {
    id: 'v_mood',
    section: 'vikriti',
    question: 'What emotional pattern is most present for you lately?',
    emoji: '💭',
    answers: [
      { id: 'v_anxiety', label: 'Anxiety & Worry', desc: 'Overthinking, fear, restlessness, scattered', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'v_anger', label: 'Irritability & Frustration', desc: 'Short temper, impatience, judgment', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'v_lethargy', label: 'Heaviness & Sadness', desc: 'Low motivation, withdrawal, attachment', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
      { id: 'v_content', label: 'Mostly Content', desc: 'Emotionally stable and okay', doshaEffect: { vata: 1, pitta: 1, kapha: 1 } },
    ],
  },
  {
    id: 'v_physical',
    section: 'vikriti',
    question: 'Any physical symptoms you\'ve noticed recently?',
    emoji: '🌿',
    answers: [
      { id: 'v_dry_cramps', label: 'Dryness, Joint Pain, Cramps', desc: 'Dry skin, constipation, muscle tension', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'v_inflammation', label: 'Inflammation & Skin Issues', desc: 'Rashes, acidity, burning sensations', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'v_congestion', label: 'Congestion & Weight Gain', desc: 'Mucus, heaviness, swelling', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
      { id: 'v_none', label: 'None Significant', desc: 'Feeling physically okay', doshaEffect: { vata: 1, pitta: 1, kapha: 1 } },
    ],
  },
];

// ─── Bodhi Voice Texts ─────────────────────────────────────────────────────────

const RESULT_SPEAK = "Your Prakriti has been revealed. This is not a label — it is a doorway. Everything I will guide you with from this moment forward will be filtered through this understanding. You now have something most people never find: a map of your own nature.";
const RESULT_SPEAK_HI = "आपकी प्रकृति प्रकट हो गई है। यह एक लेबल नहीं है — यह एक द्वार है। अब से मैं आपको जो भी मार्गदर्शन दूंगा, वह इसी समझ से होकर गुज़रेगा। आपके पास अब वह है जो अधिकांश लोगों को कभी नहीं मिलता: अपनी प्रकृति का एक नक्शा।";

function getQuestionSpeakText(q: QuizQuestion): string {
  return q.question;
}


// ─── Sub-components ────────────────────────────────────────────────────────────

const DOSHA_THEME = {
  vata: { bg: 'rgba(124,58,237,0.15)', border: 'rgba(167,139,250,0.5)', text: '#a78bfa', icon: '🌬️' },
  pitta: { bg: 'rgba(194,65,12,0.15)', border: 'rgba(251,146,60,0.5)', text: '#fb923c', icon: '🔥' },
  kapha: { bg: 'rgba(21,128,61,0.15)', border: 'rgba(74,222,128,0.5)', text: '#4ade80', icon: '🌿' },
};

function AnswerCard({ answer, selected, onClick }: {
  answer: AnswerOption; selected: boolean; onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        width: '100%', padding: '1rem 1.1rem', borderRadius: 16,
        textAlign: 'left', cursor: 'pointer', marginBottom: '0.6rem',
        background: selected ? 'rgba(168,85,247,0.16)' : 'rgba(255,255,255,0.04)',
        border: `1.5px solid ${selected ? 'rgba(168,85,247,0.55)' : 'rgba(255,255,255,0.1)'}`,
        display: 'flex', alignItems: 'center', gap: '0.85rem',
        transition: 'all 0.22s',
        boxShadow: selected ? '0 0 24px rgba(168,85,247,0.12)' : 'none',
      }}
    >
      {/* Checkbox indicator — always visible */}
      <div style={{
        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
        border: `2px solid ${selected ? 'rgba(168,85,247,0.8)' : 'rgba(255,255,255,0.2)'}`,
        background: selected ? 'rgba(168,85,247,0.4)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
      }}>
        {selected && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>
            <Check size={12} style={{ color: '#c084fc' }} />
          </motion.div>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: selected ? '#c084fc' : 'rgba(255,255,255,0.88)', fontFamily: "'Outfit', sans-serif" }}>{answer.label}</p>
        {answer.desc && <p style={{ margin: '0.2rem 0 0', fontSize: '0.74rem', color: 'rgba(255,255,255,0.42)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.4 }}>{answer.desc}</p>}
      </div>
    </motion.button>
  );
}

function BodhiOrb({ isSpeaking, muted, onRespeak, onMuteToggle }: {
  isSpeaking: boolean; muted: boolean; onRespeak: () => void; onMuteToggle: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {isSpeaking && !muted && (
          <>
            <motion.div animate={{ scale: [1, 1.7, 1], opacity: [0.4, 0, 0.4] }} transition={{ duration: 1.8, repeat: Infinity }}
              style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: '1.5px solid rgba(251,191,36,0.5)' }} />
            <motion.div animate={{ scale: [1, 2.2, 1], opacity: [0.22, 0, 0.22] }} transition={{ duration: 1.8, repeat: Infinity, delay: 0.4 }}
              style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: '1px solid rgba(168,85,247,0.35)' }} />
          </>
        )}
        <motion.div animate={isSpeaking && !muted ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={{ duration: 0.6, repeat: isSpeaking && !muted ? Infinity : 0 }}
          onClick={onRespeak}
          style={{
            width: 44, height: 44, borderRadius: '50%', cursor: 'pointer',
            background: 'radial-gradient(circle at 35% 30%, rgba(251,191,36,0.6) 0%, rgba(139,92,246,0.5) 60%, transparent 100%)',
            border: '1.5px solid rgba(251,191,36,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
            boxShadow: isSpeaking && !muted ? '0 0 24px rgba(251,191,36,0.35)' : '0 0 10px rgba(139,92,246,0.2)',
          }}>✦</motion.div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {isSpeaking && !muted ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {[0, 1, 2, 3, 4].map(i => (
              <motion.div key={i} animate={{ scaleY: [0.3, 1, 0.3] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                style={{ width: 3, height: 16, borderRadius: 2, background: '#fbbf24', transformOrigin: 'bottom' }} />
            ))}
            <span style={{ fontSize: '0.7rem', color: 'rgba(251,191,36,0.7)', fontFamily: "'Outfit', sans-serif", marginLeft: 4 }}>Bodhi speaking…</span>
          </div>
        ) : (
          <button onClick={onRespeak} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', fontFamily: "'Outfit', sans-serif" }}>
            <RefreshCw size={11} /> Hear again
          </button>
        )}
        <button onClick={onMuteToggle} style={{ background: 'none', border: 'none', padding: '0.25rem', cursor: 'pointer', color: muted ? 'rgba(255,255,255,0.25)' : 'rgba(251,191,36,0.55)', fontSize: '0.7rem', fontFamily: "'Outfit', sans-serif" }}>
          {muted ? '🔇' : '🔊'}
        </button>
      </div>
    </div>
  );
}

function DoshaBar({ dosha, value, color }: { dosha: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom: '0.6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
        <span style={{ fontSize: '0.78rem', color: color, fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>{dosha}</span>
        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif" }}>{value}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 3, background: color }} />
      </div>
    </div>
  );
}

// ─── Result Screen ─────────────────────────────────────────────────────────────

function ResultScreen({ prakriti, vikriti, onContinue }: {
  prakriti: Prakriti; vikriti: Vikriti; onContinue: () => void;
}) {
  const info = DOSHA_INFO[prakriti.primary];
  const theme = DOSHA_THEME[prakriti.primary];
  const story = generateDoshaStory(prakriti, vikriti);
  const total = prakriti.scores.vata + prakriti.scores.pitta + prakriti.scores.kapha;
  const toPercent = (v: number) => Math.round((v / total) * 100);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ paddingBottom: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <motion.div
          initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          style={{
            width: 80, height: 80, borderRadius: '50%', margin: '0 auto 1.2rem',
            background: `radial-gradient(circle at 35% 30%, ${theme.bg} 0%, transparent 100%)`,
            border: `2px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem',
            boxShadow: `0 0 40px ${theme.bg}`,
          }}>{info.emoji}</motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <p style={{ margin: '0 0 0.3rem', fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>Your Prakriti (Birth Constitution)</p>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: theme.text, fontFamily: "'Outfit', sans-serif" }}>
            {prakriti.combo === 'tridoshic' ? 'Tridoshic' : prakriti.combo.toUpperCase()}
          </h1>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', fontFamily: "'Outfit', sans-serif" }}>{info.elements}</p>
        </motion.div>
      </div>

      <AnimatePresence>
        {revealed && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '1.2rem', marginBottom: '1.2rem', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ margin: '0 0 0.8rem', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>Dosha Balance</p>
              <DoshaBar dosha={`🌬️ Vata`} value={toPercent(prakriti.scores.vata)} color="#a78bfa" />
              <DoshaBar dosha={`🔥 Pitta`} value={toPercent(prakriti.scores.pitta)} color="#fb923c" />
              <DoshaBar dosha={`🌿 Kapha`} value={toPercent(prakriti.scores.kapha)} color="#4ade80" />
            </div>

            {vikriti.primary && vikriti.primary !== prakriti.primary && (
              <div style={{ background: `${DOSHA_THEME[vikriti.primary].bg}`, borderRadius: 14, padding: '1rem', marginBottom: '1.2rem', border: `1px solid ${DOSHA_THEME[vikriti.primary].border}` }}>
                <p style={{ margin: '0 0 0.3rem', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: DOSHA_THEME[vikriti.primary].text, fontFamily: "'Outfit', sans-serif" }}>Current Imbalance (Vikriti)</p>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'rgba(255,255,255,0.7)', fontFamily: "'Outfit', sans-serif" }}>
                  <strong style={{ color: DOSHA_THEME[vikriti.primary].text }}>{DOSHA_INFO[vikriti.primary].name}</strong> is currently elevated — {DOSHA_INFO[vikriti.primary].imbalanceSigns.slice(0, 2).join(', ')}.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
              {story.map((para, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.25 }}
                  style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '1rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', fontFamily: "'Outfit', sans-serif", fontStyle: i === 0 ? 'italic' : 'normal' }}>{para}</p>
                </motion.div>
              ))}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '1rem', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ margin: '0 0 0.6rem', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>Your Strengths</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {info.strengths.map(s => (
                  <span key={s} style={{ padding: '0.3rem 0.7rem', borderRadius: 20, background: theme.bg, border: `1px solid ${theme.border}`, fontSize: '0.75rem', color: theme.text, fontFamily: "'Outfit', sans-serif" }}>{s}</span>
                ))}
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onContinue}
              style={{
                width: '100%', padding: '1rem', borderRadius: 16, cursor: 'pointer', fontWeight: 700, fontSize: '1rem',
                background: `linear-gradient(135deg, ${theme.border}, rgba(168,85,247,0.5))`,
                border: 'none', color: '#fff', fontFamily: "'Outfit', sans-serif",
                boxShadow: `0 0 30px ${theme.bg}`,
              }}
            >
              Begin My Dinacharya Journey →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

type Phase = 'prakriti' | 'vikriti' | 'result';

export default function PrakritiQuizPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const {
    completePrakritiQuiz, completeVikritiiQuiz,
    doshaOnboardingComplete, prakritiAssessment, vikritiiAssessment,
  } = useDoshaEngine();
  const { speak, stop, isSpeaking, muted, toggleMute } = useGeminiTTS();

  // If the user has already completed onboarding, jump straight to the result
  const alreadyDone = doshaOnboardingComplete && !!prakritiAssessment && !!vikritiiAssessment;

  const [phase, setPhase] = useState<Phase>(() => alreadyDone ? 'result' : 'prakriti');
  // ── Mic / voice answer ──────────────────────────────────────────────────────
  const matchVoiceToOption = useCallback((transcript: string, options: AnswerOption[]) => {
    const t = transcript.toLowerCase();
    return options.find(o =>
      t.includes(o.label.toLowerCase()) ||
      t.includes(o.id.toLowerCase()) ||
      (o.desc && t.includes(o.desc.toLowerCase().slice(0, 10)))
    ) ?? null;
  }, []);

  const { isListening: micListening, startListening: micStart, stopListening: micStop, isSupported: micOk } = useSpeechInput({
    lang,
    onResult: (text) => {
      if (phase === 'prakriti') {
        const match = matchVoiceToOption(text, currentPrakritiQ.answers);
        if (match) selectPrakritiAnswer(match);
      } else if (phase === 'vikriti') {
        const match = matchVoiceToOption(text, currentVikritiiQ.answers);
        if (match) selectVikritiiAnswer(match);
      }
    },
  });

  const [prakritiStep, setPrakritiStep] = useState(0);
  const [vikritiiStep, setVikritiiStep] = useState(0);
  const [prakritiAnswers, setPrakritiAnswers] = useState<Record<string, string[]>>({});
  const [vikritiiAnswers, setVikritiiAnswers] = useState<Record<string, string[]>>({});
  // Pre-populate from stored assessments on first render if already done
  const [resultPrakriti, setResultPrakriti] = useState<Prakriti | null>(() => prakritiAssessment?.prakriti ?? null);
  const [resultVikriti, setResultVikriti] = useState<Vikriti | null>(() => vikritiiAssessment?.vikriti ?? null);
  const [isRetaking, setIsRetaking] = useState(false);

  const startRetake = useCallback(() => {
    setIsRetaking(true);
    setPhase('prakriti');
    setPrakritiStep(0);
    setVikritiiStep(0);
    setPrakritiAnswers({});
    setVikritiiAnswers({});
    setResultPrakriti(null);
    setResultVikriti(null);
  }, []);

  const prakritiQuestions = lang === 'hi' ? PRAKRITI_QUESTIONS_HI : PRAKRITI_QUESTIONS;
  const vikritiiQuestions  = lang === 'hi' ? VIKRITI_QUESTIONS_HI  : VIKRITI_QUESTIONS;

  const currentPrakritiQ = prakritiQuestions[prakritiStep];
  const currentVikritiiQ = vikritiiQuestions[vikritiiStep];

  const totalPrakritiSteps = prakritiQuestions.length;
  const totalVikritiiSteps = vikritiiQuestions.length;

  const prakritiProgress = (prakritiStep / totalPrakritiSteps) * 100;
  const vikritiiProgress = (vikritiiStep / totalVikritiiSteps) * 100;

  useEffect(() => {
    if (phase === 'prakriti' && currentPrakritiQ) {
      const t = setTimeout(() => speak(getQuestionSpeakText(currentPrakritiQ)), 500);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, prakritiStep]);

  useEffect(() => {
    if (phase === 'vikriti' && currentVikritiiQ) {
      const t = setTimeout(() => speak(getQuestionSpeakText(currentVikritiiQ)), 500);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, vikritiiStep]);

  useEffect(() => {
    if (phase === 'result') {
      const t = setTimeout(() => speak(lang === 'hi' ? RESULT_SPEAK_HI : RESULT_SPEAK), 800);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const selectPrakritiAnswer = useCallback((answer: AnswerOption) => {
    setPrakritiAnswers(prev => {
      const cur = prev[currentPrakritiQ.id] ?? [];
      const exists = cur.includes(answer.id);
      return {
        ...prev,
        [currentPrakritiQ.id]: exists
          ? cur.filter(id => id !== answer.id)
          : [...cur, answer.id],
      };
    });
  }, [currentPrakritiQ]);

  const selectVikritiiAnswer = useCallback((answer: AnswerOption) => {
    setVikritiiAnswers(prev => {
      const cur = prev[currentVikritiiQ.id] ?? [];
      const exists = cur.includes(answer.id);
      return {
        ...prev,
        [currentVikritiiQ.id]: exists
          ? cur.filter(id => id !== answer.id)
          : [...cur, answer.id],
      };
    });
  }, [currentVikritiiQ]);

  const buildAnswers = useCallback((
    questions: QuizQuestion[],
    selections: Record<string, string[]>
  ): QuizAnswer[] =>
    questions
      .filter(q => (selections[q.id] ?? []).length > 0)
      .map(q => {
        const ids = selections[q.id];
        const chosen = q.answers.filter(a => ids.includes(a.id));
        const count = chosen.length;
        const avgEffect = chosen.reduce(
          (acc, a) => ({
            vata: acc.vata + a.doshaEffect.vata / count,
            pitta: acc.pitta + a.doshaEffect.pitta / count,
            kapha: acc.kapha + a.doshaEffect.kapha / count,
          }),
          { vata: 0, pitta: 0, kapha: 0 }
        );
        return { questionId: q.id, answerId: ids.join(','), doshaEffect: avgEffect };
      })
  , []);

  const advancePrakriti = useCallback(() => {
    stop();
    if (prakritiStep < totalPrakritiSteps - 1) {
      setPrakritiStep(s => s + 1);
    } else {
      const answers = buildAnswers(prakritiQuestions, prakritiAnswers);
      const prakritiResult = completePrakritiQuiz(answers);
      setResultPrakriti(prakritiResult);
      setPhase('vikriti');
      setVikritiiStep(0);
    }
  }, [prakritiStep, totalPrakritiSteps, prakritiAnswers, completePrakritiQuiz, stop, buildAnswers, prakritiQuestions]);

  const savePrakritiToFirestore = useCallback(async (prakritiPrimary: string, prakritiCombo: string) => {
    try {
      const { getFirebaseAuth, getFirebaseFirestore } = await import('@/lib/firebase');
      const { onAuthStateChanged } = await import('firebase/auth');
      const { doc, setDoc } = await import('firebase/firestore');
      const auth = await getFirebaseAuth();
      const db = await getFirebaseFirestore();
      await new Promise<void>(resolve => {
        const unsub = onAuthStateChanged(auth, async (u) => {
          unsub();
          if (!u) { resolve(); return; }
          await Promise.all([
            setDoc(doc(db, 'users', u.uid), {
              'profile.prakriti': prakritiCombo,
              prakritiCompletedAt: Date.now(),
              doshaOnboardingComplete: true,
            }, { merge: true }),
            setDoc(doc(db, 'onesutra_users', u.uid), {
              prakriti: prakritiCombo,
              'ayurvedicProfile.prakriti': prakritiPrimary,
              doshaOnboardingComplete: true,
            }, { merge: true }),
          ]);
          resolve();
        });
      });
    } catch { /* offline — ok, localStorage has it */ }
  }, []);

  const advanceVikritii = useCallback(() => {
    stop();
    if (vikritiiStep < totalVikritiiSteps - 1) {
      setVikritiiStep(s => s + 1);
    } else {
      const answers = buildAnswers(vikritiiQuestions, vikritiiAnswers);
      const vikritiiResult = completeVikritiiQuiz(answers);
      setResultVikriti(vikritiiResult);
      setPhase('result');
      if (resultPrakriti) {
        savePrakritiToFirestore(resultPrakriti.primary, resultPrakriti.combo);
      }
    }
  }, [vikritiiStep, totalVikritiiSteps, vikritiiAnswers, completeVikritiiQuiz, stop, buildAnswers, resultPrakriti, savePrakritiToFirestore, vikritiiQuestions]);

  const currentPrakritiSelected = prakritiAnswers[currentPrakritiQ?.id] ?? [];
  const currentVikritiiSelected = vikritiiAnswers[currentVikritiiQ?.id] ?? [];

  const containerStyle: React.CSSProperties = {
    minHeight: '100dvh',
    background: 'linear-gradient(160deg, #0a0a0f 0%, #0f0a1a 40%, #0a1208 100%)',
    padding: '0',
    display: 'flex', flexDirection: 'column',
  };

  const headerStyle: React.CSSProperties = {
    padding: '1rem 1.2rem 0.8rem',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    position: 'sticky', top: 0, zIndex: 10,
    background: 'rgba(10,10,15,0.95)',
    backdropFilter: 'blur(12px)',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
          <button onClick={() => {
            if (phase === 'result') { router.back(); return; }
            if (phase === 'prakriti' && prakritiStep > 0) { stop(); setPrakritiStep(s => s - 1); }
            else if (phase === 'vikriti' && vikritiiStep > 0) { stop(); setVikritiiStep(s => s - 1); }
            else if (phase === 'vikriti' && vikritiiStep === 0) { setPhase('prakriti'); setPrakritiStep(totalPrakritiSteps - 1); }
            else router.back();
          }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontFamily: "'Outfit', sans-serif", padding: '0.25rem' }}>
            <ArrowLeft size={16} /> {lang === 'hi' ? 'वापस' : 'Back'}
          </button>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>
              {phase === 'prakriti'
                ? (lang === 'hi' ? 'प्रकृति खोज' : 'Prakriti Discovery')
                : phase === 'vikriti'
                  ? (lang === 'hi' ? 'विकृति जाँच' : 'Vikriti Check-in')
                  : (lang === 'hi' ? 'आपकी दोष कथा' : 'Your Dosha Story')}
            </p>
          </div>
          {/* Retake button — only shown on result screen for returning users */}
          {phase === 'result' && alreadyDone && !isRetaking ? (
            <button onClick={startRetake}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem', fontFamily: "'Outfit', sans-serif", padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <RefreshCw size={11} /> {lang === 'hi' ? 'पुनः लें' : 'Retake'}
            </button>
          ) : (
            <div style={{ width: 48 }} />
          )}
        </div>

        {phase !== 'result' && (
          <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${phase === 'prakriti' ? prakritiProgress : 50 + vikritiiProgress / 2}%` }}
              transition={{ duration: 0.4 }}
              style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #7c3aed, #fb923c)' }}
            />
          </div>
        )}
        {phase !== 'result' && (
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)', fontFamily: "'Outfit', sans-serif", textAlign: 'center' }}>
            {phase === 'prakriti'
              ? (lang === 'hi' ? `प्रश्न ${prakritiStep + 1} / ${totalPrakritiSteps}` : `Question ${prakritiStep + 1} of ${totalPrakritiSteps}`)
              : (lang === 'hi' ? `प्रश्न ${vikritiiStep + 1} / ${totalVikritiiSteps}` : `Question ${vikritiiStep + 1} of ${totalVikritiiSteps}`)}
          </p>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.2rem' }}>
        <AnimatePresence mode="wait">
          {phase === 'result' && resultPrakriti && resultVikriti ? (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <BodhiOrb isSpeaking={isSpeaking} muted={muted} onRespeak={() => speak(lang === 'hi' ? RESULT_SPEAK_HI : RESULT_SPEAK)} onMuteToggle={toggleMute} />
              <ResultScreen prakriti={resultPrakriti} vikriti={resultVikriti} onContinue={() => router.replace('/')} />
            </motion.div>
          ) : phase === 'vikriti' ? (
            <motion.div key={`vikriti-${vikritiiStep}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <BodhiOrb isSpeaking={isSpeaking} muted={muted} onRespeak={() => speak(getQuestionSpeakText(currentVikritiiQ))} onMuteToggle={toggleMute} />
              {vikritiiStep === 0 && (
                <div style={{ marginBottom: '1.2rem', padding: '0.9rem 1rem', background: 'rgba(251,191,36,0.06)', borderRadius: 14, border: '1px solid rgba(251,191,36,0.2)' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(251,191,36,0.75)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}>
                    {lang === 'hi'
                      ? <>✦ अब हम आपकी <strong>विकृति</strong> जाँचेंगे — आप <em>अभी</em> कैसा महसूस करते हैं, न कि हमेशा से। पिछले 2 हफ़्तों के आधार पर उत्तर दें।</>
                      : <>✦ Now we check your <strong>Vikriti</strong> — how you feel <em>right now</em>, not how you always are. Answer based on the last 2 weeks.</> }
                  </p>
                </div>
              )}
              <h2 style={{ margin: '0 0 0.4rem', fontSize: '1.15rem', fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif", lineHeight: 1.35 }}>
                {currentVikritiiQ.emoji} {currentVikritiiQ.question}
              </h2>
              {currentVikritiiQ.subtext && <p style={{ margin: '0 0 1rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.42)', fontFamily: "'Outfit', sans-serif" }}>{currentVikritiiQ.subtext}</p>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.04em' }}>{lang === 'hi' ? 'लागू सभी विकल्प चुनें' : 'Select all that apply'}</p>
                {micOk && (
                  <motion.button onClick={micListening ? micStop : micStart} whileTap={{ scale: 0.88 }}
                    animate={micListening ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                    transition={micListening ? { duration: 1, repeat: Infinity } : {}}
                    style={{ marginLeft: 'auto', background: micListening ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.07)', border: micListening ? '1.5px solid rgba(239,68,68,0.6)' : '1.5px solid rgba(255,255,255,0.14)', borderRadius: 20, padding: '0.22rem 0.7rem', cursor: 'pointer', fontSize: '0.68rem', color: micListening ? '#f87171' : 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap' }}>
                    {micListening ? '⏹ ' : '🎤 '}{micListening ? (lang === 'hi' ? 'सुन रहा है...' : 'Listening…') : (lang === 'hi' ? 'माइक से बोलें' : 'Speak answer')}
                  </motion.button>
                )}
              </div>
              <div style={{ marginBottom: '1.5rem', marginTop: '0.4rem' }}>
                {currentVikritiiQ.answers.map(a => (
                  <AnswerCard key={a.id} answer={a} selected={currentVikritiiSelected.includes(a.id)} onClick={() => selectVikritiiAnswer(a)} />
                ))}
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={advanceVikritii} disabled={currentVikritiiSelected.length === 0}
                style={{
                  width: '100%', padding: '1rem', borderRadius: 16, cursor: currentVikritiiSelected.length > 0 ? 'pointer' : 'not-allowed',
                  fontWeight: 700, fontSize: '1rem',
                  background: currentVikritiiSelected.length > 0 ? 'linear-gradient(135deg, rgba(251,146,60,0.4), rgba(168,85,247,0.4))' : 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${currentVikritiiSelected.length > 0 ? 'rgba(251,146,60,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: currentVikritiiSelected.length > 0 ? '#fff' : 'rgba(255,255,255,0.3)',
                  fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                }}>
                {vikritiiStep < totalVikritiiSteps - 1
                  ? <><span>{lang === 'hi' ? 'आगे बढ़ें' : 'Continue'}</span> <ArrowRight size={16} /></>
                  : <><Sparkles size={16} /><span>{lang === 'hi' ? 'मेरी दोष कथा प्रकट करें' : 'Reveal My Dosha Story'}</span></>}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div key={`prakriti-${prakritiStep}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <BodhiOrb isSpeaking={isSpeaking} muted={muted} onRespeak={() => speak(getQuestionSpeakText(currentPrakritiQ))} onMuteToggle={toggleMute} />
              {prakritiStep === 0 && (
                <div style={{ marginBottom: '1.2rem', padding: '0.9rem 1rem', background: 'rgba(168,85,247,0.07)', borderRadius: 14, border: '1px solid rgba(168,85,247,0.2)' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(167,139,250,0.8)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}>
                    {lang === 'hi'
                      ? <>✦ उत्तर वैसे दें जैसे आप <strong>जन्म से हमेशा रहे हैं</strong> — अभी नहीं। अपनी प्राकृतिक, अपरिवर्तनीय प्रकृति के बारे में सोचें।</>
                      : <>✦ Answer as you have <strong>always been</strong> since birth — not how you are right now. Think of your natural, unchanging constitution.</> }
                  </p>
                </div>
              )}
              <h2 style={{ margin: '0 0 0.4rem', fontSize: '1.15rem', fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif", lineHeight: 1.35 }}>
                {currentPrakritiQ.emoji} {currentPrakritiQ.question}
              </h2>
              {currentPrakritiQ.subtext && <p style={{ margin: '0 0 1rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.42)', fontFamily: "'Outfit', sans-serif" }}>{currentPrakritiQ.subtext}</p>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.04em' }}>{lang === 'hi' ? 'लागू सभी विकल्प चुनें' : 'Select all that apply'}</p>
                {micOk && (
                  <motion.button onClick={micListening ? micStop : micStart} whileTap={{ scale: 0.88 }}
                    animate={micListening ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                    transition={micListening ? { duration: 1, repeat: Infinity } : {}}
                    style={{ marginLeft: 'auto', background: micListening ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.07)', border: micListening ? '1.5px solid rgba(239,68,68,0.6)' : '1.5px solid rgba(255,255,255,0.14)', borderRadius: 20, padding: '0.22rem 0.7rem', cursor: 'pointer', fontSize: '0.68rem', color: micListening ? '#f87171' : 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap' }}>
                    {micListening ? '⏹ ' : '🎤 '}{micListening ? (lang === 'hi' ? 'सुन रहा है...' : 'Listening…') : (lang === 'hi' ? 'माइक से बोलें' : 'Speak answer')}
                  </motion.button>
                )}
              </div>
              <div style={{ marginBottom: '1.5rem', marginTop: '0.4rem' }}>
                {currentPrakritiQ.answers.map(a => (
                  <AnswerCard key={a.id} answer={a} selected={currentPrakritiSelected.includes(a.id)} onClick={() => selectPrakritiAnswer(a)} />
                ))}
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={advancePrakriti} disabled={currentPrakritiSelected.length === 0}
                style={{
                  width: '100%', padding: '1rem', borderRadius: 16, cursor: currentPrakritiSelected.length > 0 ? 'pointer' : 'not-allowed',
                  fontWeight: 700, fontSize: '1rem',
                  background: currentPrakritiSelected.length > 0 ? 'linear-gradient(135deg, rgba(124,58,237,0.5), rgba(168,85,247,0.4))' : 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${currentPrakritiSelected.length > 0 ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: currentPrakritiSelected.length > 0 ? '#fff' : 'rgba(255,255,255,0.3)',
                  fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                }}>
                {prakritiStep < totalPrakritiSteps - 1
                  ? <><span>{lang === 'hi' ? 'आगे बढ़ें' : 'Continue'}</span> <ArrowRight size={16} /></>
                  : <><Wind size={16} /><span>{lang === 'hi' ? 'विकृति जाँच शुरू करें' : 'Begin Vikriti Check-in'}</span></>}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
