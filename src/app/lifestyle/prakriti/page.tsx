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
      { id: 'thin', label: 'Thin, Light & Bony', desc: 'Lean frame, hard to gain weight, prominent veins & joints; may be unusually tall or very short', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'medium', label: 'Medium, Athletic & Proportioned', desc: 'Moderate, symmetrical build, good muscle tone; gains and loses weight moderately', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'large', label: 'Large, Broad & Sturdy', desc: 'Solid, wide-set frame; tends to gain weight easily; impressive physical endurance', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'skin',
    section: 'prakriti',
    question: 'Your natural skin texture and tendency (without products)?',
    emoji: '🌸',
    answers: [
      { id: 'dry', label: 'Dry, Rough & Cool', desc: 'Prone to cracking, flaking or tight feeling; cold to touch; darkens quickly in sun', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'sensitive', label: 'Warm, Sensitive & Freckled', desc: 'Redness-prone, burns easily, may have moles/freckles; prone to rashes or inflammation', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'oily', label: 'Oily, Thick & Cool-Moist', desc: 'Lustrous, smooth, soft; ages slowly; prone to congestion but rarely dry', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'eyes',
    section: 'prakriti',
    question: 'Your natural eye characteristics?',
    subtext: 'Consider the size, luster and feel of your eyes — not screen-related dryness.',
    emoji: '👁️',
    answers: [
      { id: 'small_active', label: 'Small, Dry & Restless', desc: 'Smaller eyes that dart quickly; often feel dry or twitchy; dark lashes', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'sharp_light', label: 'Sharp, Penetrating & Light-Sensitive', desc: 'Intense gaze; light or grey/green colour; prone to light sensitivity or redness', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'large_calm', label: 'Large, Calm & Lustrous', desc: 'Beautiful expressive eyes; moist pleasant whites; slow to blink; dark and deep', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'hair',
    section: 'prakriti',
    question: 'Your natural hair type — as it grows without treatments?',
    emoji: '💇',
    answers: [
      { id: 'dry_frizzy', label: 'Dry, Fine & Frizzy', desc: 'Tangles easily, prone to split ends and breakage; lacks natural shine without oil', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'fine_oily', label: 'Straight, Fine & Silky', desc: 'Goes limp quickly; gets oily at roots; tends to grey or thin early in life', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'thick_wavy', label: 'Thick, Wavy & Lustrous', desc: 'Abundant, strong, naturally shiny and slow to grey; may be coarse', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'digestion',
    section: 'prakriti',
    question: 'Your typical digestion — as you have always experienced it?',
    emoji: '🔥',
    answers: [
      { id: 'irregular', label: 'Irregular & Unpredictable', desc: 'Bloating, gas after meals; sometimes fast, sometimes slow — hard to predict', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'sharp_fast', label: 'Sharp, Fast & Intense', desc: 'Strong appetite; digests quickly; gets irritable or headachy if meals are skipped', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'slow_steady', label: 'Slow, Steady & Reliable', desc: 'Low appetite in mornings; digests slowly but steadily; rarely has acidity', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'thirst',
    section: 'prakriti',
    question: 'Your natural thirst pattern?',
    emoji: '🫗',
    answers: [
      { id: 'variable_forget', label: 'Variable — Often Forgets to Drink', desc: 'Thirst is intermittent; often realizes too late they are dehydrated; dry mouth common', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'strong_regular', label: 'Strong & Regular — Craves Cool Water', desc: 'Frequently thirsty especially in heat; craves cool drinks; gets headaches without water', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'low_rarely', label: 'Low — Rarely Thirsty', desc: 'Can go long hours without water; prefers warm drinks; very rarely feels true thirst', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'sleep',
    section: 'prakriti',
    question: 'Your natural sleep pattern — without alarm or stress?',
    emoji: '🌙',
    answers: [
      { id: 'light', label: 'Light, Interrupted & Vivid Dreams', desc: 'Fall asleep easily but wake often; vivid or anxious dreams; feel unrested at times', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'moderate', label: 'Moderate — Fall Asleep Well', desc: 'Usually fall asleep well; may wake once around midnight; rarely oversleeps', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'deep_long', label: 'Deep, Long & Hard to Wake', desc: 'Love sleeping; sleep very heavily; wake up slowly and feel groggy without enough sleep', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'energy',
    section: 'prakriti',
    question: 'How does your energy naturally flow through the day?',
    emoji: '⚡',
    answers: [
      { id: 'bursts', label: 'Bursts & Crashes', desc: 'Intense energy spurts followed by sudden fatigue; enthusiasm fades quickly', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'intense_focused', label: 'Sustained, Intense & Focused', desc: 'Driven, purposeful energy throughout the day; can overdo it and burn out', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'steady_slow', label: 'Slow to Start, Then Steady All Day', desc: 'Needs time to warm up each morning but once going, maintains endurance all day', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'emotions',
    section: 'prakriti',
    question: 'Your natural emotional tendencies — when at your baseline?',
    emoji: '💭',
    answers: [
      { id: 'anxious_creative', label: 'Enthusiastic, Imaginative & Worry-Prone', desc: 'Creative spark, friendly, generous — but anxiety, indecision, and overthinking come naturally', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'ambitious_irritable', label: 'Ambitious, Disciplined & Intense', desc: 'Strong drive and leadership; but can become irritable, jealous or judgmental under pressure', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'calm_attached', label: 'Patient, Loving & Slow to Change', desc: 'Naturally calm, forgiving, devoted — but prone to attachment, possessiveness, and resistance to change', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'sweat',
    section: 'prakriti',
    question: 'Your natural perspiration pattern?',
    emoji: '💧',
    answers: [
      { id: 'minimal_dry', label: 'Minimal — Dry Skin Even in Heat', desc: 'Rarely sweats; skin stays dry; body feels cool; may get dehydrated easily', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'profuse_sharp', label: 'Profuse — Strong or Pungent Odor', desc: 'Sweats easily and heavily; strong or sharp odor; body runs warm at all times', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'moderate_mild', label: 'Moderate — Mild or Sweet Scent', desc: 'Sweats moderately with mild, pleasant scent; skin stays pleasantly moist', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'appetite',
    section: 'prakriti',
    question: 'Your natural appetite — how you experience hunger most of the time?',
    emoji: '🍽️',
    answers: [
      { id: 'variable', label: 'Variable — Changes Day to Day', desc: 'Sometimes ravenous, sometimes no interest in food; appetite is unpredictable', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'strong_intense', label: 'Strong & Punctual — Must Eat on Time', desc: 'Intense appetite at regular times; becomes irritable, shaky or headachy if meals are missed', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'low_consistent', label: 'Low & Consistent — Can Skip Easily', desc: 'Mild, consistent appetite; can easily skip meals without discomfort; prefers small amounts', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'bowel',
    section: 'prakriti',
    question: 'Your typical bowel movement pattern?',
    subtext: 'One of the most important Ayurvedic diagnostic indicators — be honest.',
    emoji: '🌿',
    answers: [
      { id: 'irregular', label: 'Irregular, Hard or Dry', desc: 'Often constipated; hard, dry or scanty stools; passes gas frequently', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'loose_frequent', label: 'Loose, Soft & Frequent', desc: 'Soft or loose stools, sometimes too frequent; may experience acidity or urgency', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'slow_once', label: 'Slow, Heavy & Once Daily', desc: 'Regular, well-formed, heavy stools; takes time but once a day, reliably complete', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'temperature',
    section: 'prakriti',
    question: 'Your natural body temperature preference?',
    emoji: '🌡️',
    answers: [
      { id: 'loves_warmth', label: 'Always Cold — Loves Warmth', desc: 'Cold hands and feet even in summer; hates cold weather and wind; loves warm baths, warm climates', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'loves_cool', label: 'Always Hot — Loves Cool', desc: 'Runs warm internally; prefers cool environments; dislikes heat, direct sun and stuffy rooms', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'loves_both', label: 'Adaptable — Dislikes Damp/Cold', desc: 'Neither extreme; copes well with most temperatures but dislikes excessive damp or cold', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'memory',
    section: 'prakriti',
    question: 'How is your memory and learning style?',
    emoji: '🧠',
    answers: [
      { id: 'quick_forget', label: 'Grasps Quickly, Forgets Quickly', desc: 'Excellent at absorbing new ideas fast but retention is short; needs repetition to hold information', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'sharp_focused', label: 'Sharp, Analytical & Retentive', desc: 'Focused, excellent long-term memory for facts and systems; learns through analysis and debate', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'slow_never_forget', label: 'Slow to Learn, Never Forgets', desc: 'Takes time to absorb new things, but once learned, never forgets; deeply reliable memory', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'voice',
    section: 'prakriti',
    question: 'Your natural voice quality and speech pace?',
    emoji: '🗣️',
    answers: [
      { id: 'fast_lots', label: 'Fast, Talkative & Sometimes Hoarse', desc: 'Speak quickly, jump between topics; voice may crack or go hoarse easily', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'precise_sharp', label: 'Clear, Sharp & Commanding', desc: 'Speak with authority and precision; persuasive, articulate, moderate pace', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'slow_melodious', label: 'Deep, Slow & Melodious', desc: 'Rich, pleasant voice; speak thoughtfully and unhurriedly; naturally calming to others', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'weather',
    section: 'prakriti',
    question: 'Which weather bothers you most physically?',
    emoji: '🌦️',
    answers: [
      { id: 'cold_wind', label: 'Cold & Windy', desc: 'Wind makes you anxious; cold makes you stiff and achy; dry weather cracks your skin and lips', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'heat_sun', label: 'Heat, Humidity & Direct Sun', desc: 'Overheat quickly; sunburns easily; feel irritable and inflamed in hot or humid weather', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'cold_damp', label: 'Cold, Damp & Cloudy', desc: 'Damp, grey weather makes you sluggish and heavy; prone to congestion and lethargy in winter', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'stress_response',
    section: 'prakriti',
    question: 'How do you naturally respond to stress?',
    emoji: '🌊',
    answers: [
      { id: 'anxious_overwhelmed', label: 'Anxious, Scattered & Freeze', desc: 'Worry, overthink, freeze or scatter in all directions; insomnia and fear under prolonged stress', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'irritable_intense', label: 'Irritable, Controlling & Push Harder', desc: 'Get angry or frustrated; take control; work harder; judgmental of self and others under stress', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'withdraw_avoid', label: 'Withdraw, Go Quiet & Comfort Eat', desc: 'Go quiet, sleep more, eat comforting foods; avoid the issue; may become depressed over time', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'joints',
    section: 'prakriti',
    question: 'Your joints, bones and physical build?',
    emoji: '🦴',
    answers: [
      { id: 'prominent_crack', label: 'Prominent, Cracking & Lean', desc: 'Joints crack audibly; large, knobby or bony joints on a lean frame; hypermobility possible', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'moderate_flexible', label: 'Moderate, Defined & Flexible', desc: 'Proportional joints with good muscle tone; moderately flexible; rarely stiff or creaky', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'large_padded', label: 'Large, Cushioned & Very Stable', desc: 'Broad joints with thick connective tissue; feel very stable; rarely crack; strong foundation', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
  {
    id: 'gait',
    section: 'prakriti',
    question: 'Your natural walking style and physical movement?',
    emoji: '🚶',
    answers: [
      { id: 'fast_irregular', label: 'Fast, Light & Irregular', desc: 'Walk quickly with light, irregular steps; change direction easily; fidget and gesture a lot', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'purposeful_brisk', label: 'Purposeful, Brisk & Direct', desc: 'Walk with intention and confidence; moderate-to-fast pace; movement is efficient and goal-oriented', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'slow_steady_graceful', label: 'Slow, Steady & Graceful', desc: 'Walk leisurely and deliberately; grounded and smooth movement; take wide, stable steps', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
];

const PRAKRITI_QUESTIONS_HI: QuizQuestion[] = [
  {
    id: 'body_frame', section: 'prakriti', question: 'आपका प्राकृतिक शारीरिक ढांचा — जैसा बचपन से है?', subtext: 'अपना स्वाभाविक ढांचा सोचें, वर्तमान वज़न नहीं।', emoji: '🪶',
    answers: [
      { id: 'thin', label: 'पतला, हल्का और हड्डीला', desc: 'दुबला, वज़न बढ़ाना कठिन; नसें और जोड़ उभरे हुए; असामान्य रूप से लंबे या बहुत छोटे हो सकते हैं', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'medium', label: 'मध्यम, एथलेटिक और संतुलित', desc: 'मध्यम, सममित बनावट; अच्छी मांसपेशियाँ; वज़न मध्यम गति से घटता-बढ़ता है', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'large', label: 'बड़ा, चौड़ा और मज़बूत', desc: 'ठोस, चौड़ा ढांचा; आसानी से वज़न बढ़ता है; शारीरिक सहनशक्ति उत्तम', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ]
  },
  {
    id: 'skin', section: 'prakriti', question: 'आपकी प्राकृतिक त्वचा की बनावट (बिना उत्पादों के)?', emoji: '🌸',
    answers: [
      { id: 'dry', label: 'शुष्क, खुरदरी और ठंडी', desc: 'फटने, छिलने या तंग महसूस होना; छूने पर ठंडी; धूप में जल्दी काली पड़ती है', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'sensitive', label: 'गर्म, संवेदनशील और झाईंदार', desc: 'लालिमा-प्रवण, जल्दी जलती है; झाईं और चकत्ते; सूजन और दाने की प्रवृत्ति', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'oily', label: 'तैलीय, मोटी और नम-ठंडी', desc: 'चमकदार, मुलायम, धीमे उम्र आती है; बंद रोमछिद्रों की प्रवृत्ति; शायद ही कभी शुष्क', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ]
  },
  {
    id: 'eyes', section: 'prakriti', question: 'आपकी आँखों की प्राकृतिक विशेषताएं?', subtext: 'आँखों का आकार, चमक और अनुभव सोचें — स्क्रीन की थकान नहीं।', emoji: '👁️',
    answers: [
      { id: 'small_active', label: 'छोटी, शुष्क और चंचल', desc: 'छोटी आँखें जो जल्दी घूमती हैं; अक्सर सूखी या फड़कती हैं; गहरी पलकें', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'sharp_light', label: 'तीखी, भेदी और प्रकाश-संवेदनशील', desc: 'तीव्र दृष्टि; हल्के, हरे या भूरे रंग की आँखें; प्रकाश-संवेदनशीलता या लालिमा', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'large_calm', label: 'बड़ी, शांत और चमकदार', desc: 'सुंदर भावपूर्ण आँखें; नम और प्रसन्न सफ़ेद भाग; धीमे पलकें झपकती हैं', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ]
  },
  {
    id: 'hair', section: 'prakriti', question: 'आपके बालों का प्राकृतिक प्रकार — बिना उपचार के?', emoji: '💇',
    answers: [
      { id: 'dry_frizzy', label: 'शुष्क, पतले और घुंघराले', desc: 'उलझने की प्रवृत्ति, दोमुंहे और टूटने का खतरा; बिना तेल के चमक नहीं आती', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'fine_oily', label: 'सीधे, पतले और रेशमी', desc: 'जल्दी झड़ते हैं; जड़ों में तेल; जल्दी सफ़ेद या पतले होने की प्रवृत्ति', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'thick_wavy', label: 'घने, लहरदार और चमकदार', desc: 'भरपूर, मज़बूत, स्वाभाविक चमक; देर से सफ़ेद होते हैं; मोटे हो सकते हैं', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ]
  },
  {
    id: 'digestion', section: 'prakriti', question: 'आपका सामान्य पाचन — जैसा हमेशा रहा है?', emoji: '🔥',
    answers: [
      { id: 'irregular', label: 'अनियमित और अप्रत्याशित', desc: 'भोजन के बाद गैस या फूलना; कभी तेज़, कभी धीमा — अनुमान लगाना कठिन', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'sharp_fast', label: 'तेज़, शीघ्र और तीव्र', desc: 'तीव्र भूख; जल्दी पचता; भोजन छूटने पर चिड़चिड़ापन या सिरदर्द', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'slow_steady', label: 'धीमा, स्थिर और भरोसेमंद', desc: 'सुबह कम भूख; धीमे लेकिन नियमित पाचन; अम्लपित्त शायद ही कभी', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ]
  },
  {
    id: 'thirst', section: 'prakriti', question: 'आपकी प्राकृतिक प्यास का पैटर्न?', emoji: '🫗',
    answers: [
      { id: 'variable_forget', label: 'परिवर्तनशील — अक्सर पीना भूल जाते हैं', desc: 'प्यास आती-जाती है; अक्सर देर से एहसास होता है; मुँह सूखना आम', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'strong_regular', label: 'तीव्र और नियमित — ठंडा पानी चाहिए', desc: 'बार-बार प्यास, खासकर गर्मी में; बिना पानी के सिरदर्द होता है', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'low_rarely', label: 'कम — बहुत कम प्यास लगती है', desc: 'घंटों बिना पानी रह सकते हैं; गर्म पेय पसंद; सच्ची प्यास बहुत कम लगती है', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ]
  },
  {
    id: 'sleep', section: 'prakriti', question: 'आपका प्राकृतिक नींद पैटर्न — बिना अलार्म या तनाव के?', emoji: '🌙',
    answers: [
      { id: 'light', label: 'हल्की, बाधित और सजीव सपने', desc: 'नींद आसानी से आती है पर बार-बार टूटती है; चिंताजनक या भावनात्मक सपने', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'moderate', label: 'मध्यम — नींद अच्छी आती है', desc: 'सामान्यतः अच्छी नींद; मध्यरात्रि में एक बार जाग सकते हैं', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'deep_long', label: 'गहरी, लंबी और उठना कठिन', desc: 'नींद बहुत पसंद; बहुत गहरी नींद; जागने में समय लगता है; कम नींद पर सुस्ती', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ]
  },
  {
    id: 'energy', section: 'prakriti', question: 'दिन में आपकी ऊर्जा कैसे प्रवाहित होती है?', emoji: '⚡',
    answers: [
      { id: 'bursts', label: 'उछाल और अचानक गिरावट', desc: 'तीव्र ऊर्जा के झटके फिर अचानक थकान; उत्साह जल्दी ठंडा पड़ जाता है', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'intense_focused', label: 'निरंतर, तीव्र और केंद्रित', desc: 'पूरे दिन प्रेरित रहते हैं; अति कर सकते हैं और जल सकते हैं', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'steady_slow', label: 'धीमी शुरुआत, फिर दिनभर स्थिर', desc: 'सुबह वार्म-अप समय लगता है; एक बार शुरू हो जाने पर दिनभर टिकाऊ', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ]
  },
  {
    id: 'emotions', section: 'prakriti', question: 'आपकी प्राकृतिक भावनात्मक प्रवृत्तियाँ — सामान्य स्थिति में?', emoji: '💭',
    answers: [
      { id: 'anxious_creative', label: 'उत्साही, कल्पनाशील और चिंता-प्रवण', desc: 'रचनात्मक, उदार, मिलनसार — पर चिंता, अनिर्णय और अत्यधिक सोचना स्वाभाविक है', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'ambitious_irritable', label: 'महत्वाकांक्षी, अनुशासित और तीव्र', desc: 'नेतृत्व और लक्ष्य की शक्ति — लेकिन दबाव में चिड़चिड़े और आलोचनात्मक हो सकते हैं', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'calm_attached', label: 'धैर्यशील, प्रेमपूर्ण और बदलाव से धीमे', desc: 'स्वाभाविक रूप से शांत, क्षमाशील, समर्पित — पर आसक्ति और बदलाव का विरोध', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ]
  },
  {
    id: 'sweat', section: 'prakriti', question: 'आपकी प्राकृतिक पसीने की प्रवृत्ति?', emoji: '💧',
    answers: [
      { id: 'minimal_dry', label: 'कम — गर्मी में भी शुष्क त्वचा', desc: 'शायद ही पसीना आता है; त्वचा सूखी रहती है; शरीर ठंडा; जल्दी निर्जलीकरण', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'profuse_sharp', label: 'अधिक — तेज़ या तीखी गंध', desc: 'आसानी से और भारी पसीना; तेज़ या तीखी गंध; शरीर हमेशा अंदर से गर्म', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'moderate_mild', label: 'मध्यम — हल्की या मीठी सुगंध', desc: 'मध्यम पसीना; हल्की, सुखद खुशबू; त्वचा सुखद नमी बनाए रखती है', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ]
  },
  {
    id: 'appetite', section: 'prakriti', question: 'आपकी प्राकृतिक भूख — जैसा अधिकतर होता है?', emoji: '🍽️',
    answers: [
      { id: 'variable', label: 'परिवर्तनशील — दिन पर निर्भर', desc: 'कभी बहुत भूखे, कभी खाने में बिल्कुल रुचि नहीं; भूख का अनुमान लगाना कठिन', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'strong_intense', label: 'तीव्र और समय पर — देर हुई तो कष्ट', desc: 'नियमित समय पर तीव्र भूख; भोजन छूटने पर कंपकंपी, चिड़चिड़ापन या सिरदर्द', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'low_consistent', label: 'कम और नियमित — आसानी से छोड़ सकते हैं', desc: 'हल्की, नियमित भूख; भोजन छोड़ना आसान; थोड़ा खाना पर्याप्त लगता है', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ]
  },
  {
    id: 'bowel', section: 'prakriti', question: 'आपका सामान्य मलत्याग पैटर्न?', subtext: 'यह आयुर्वेद में सबसे महत्वपूर्ण संकेतकों में से एक है — ईमानदार रहें।', emoji: '🌿',
    answers: [
      { id: 'irregular', label: 'अनियमित, कठोर या शुष्क', desc: 'अक्सर कब्ज़; कठोर, शुष्क या कम मात्रा में मल; बार-बार वायु पास होना', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'loose_frequent', label: 'ढीला, मुलायम और बार-बार', desc: 'मुलायम या ढीले मल, कभी बहुत बार; अम्लपित्त या तात्कालिकता संभव', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'slow_once', label: 'धीमा, भारी और दिन में एक बार', desc: 'नियमित, अच्छी तरह से बने, भारी मल; देर से होते हैं पर पूरे और भरोसेमंद', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ]
  },
  {
    id: 'temperature', section: 'prakriti', question: 'आपकी शरीर के तापमान की प्राथमिकता?', emoji: '🌡️',
    answers: [
      { id: 'loves_warmth', label: 'हमेशा ठंडे — गर्मी पसंद', desc: 'गर्मियों में भी ठंडे हाथ-पैर; ठंड और हवा नापसंद; गर्म स्नान और गर्म माहौल पसंद', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'loves_cool', label: 'हमेशा गर्म — ठंडक पसंद', desc: 'शरीर अंदर से गर्म रहता है; ठंडा वातावरण पसंद; धूप, उमस और बंद कमरों से परेशानी', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'loves_both', label: 'अनुकूलनीय — अत्यधिक नमी/ठंड नापसंद', desc: 'ज़्यादातर तापमान में सहज; अत्यधिक नमी या ठंड से परेशानी होती है', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ]
  },
  {
    id: 'memory', section: 'prakriti', question: 'आपकी याददाश्त और सीखने की शैली?', emoji: '🧠',
    answers: [
      { id: 'quick_forget', label: 'जल्दी सीखना, जल्दी भूलना', desc: 'नई बातें तेज़ी से समझते हैं पर याददाश्त कम; दोहराने से ही याद रहता है', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'sharp_focused', label: 'तीव्र, विश्लेषणात्मक और दीर्घकालिक', desc: 'केंद्रित; तथ्यों की उत्कृष्ट दीर्घकालिक स्मृति; विश्लेषण और बहस से सीखते हैं', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'slow_never_forget', label: 'धीमे सीखना, कभी नहीं भूलना', desc: 'समय लगता है पर एक बार सीखा तो हमेशा याद रहता है; अत्यंत विश्वसनीय स्मृति', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ]
  },
  {
    id: 'voice', section: 'prakriti', question: 'आपकी आवाज़ की गुणवत्ता और बोलने की गति?', emoji: '🗣️',
    answers: [
      { id: 'fast_lots', label: 'तेज़, बातूनी और कभी-कभी भर्राई', desc: 'जल्दी बोलते हैं, विषय बदलते हैं; आवाज़ जल्दी भर्रा या कर्कश हो सकती है', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'precise_sharp', label: 'स्पष्ट, तीखी और प्रभावशाली', desc: 'आत्मविश्वास के साथ बोलते हैं; प्रेरक, स्पष्ट और सटीक शब्द चुनते हैं', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'slow_melodious', label: 'गहरी, धीमी और मधुर', desc: 'समृद्ध, सुखद आवाज़; सोच-समझकर बोलते हैं; सुनने वाले को सुकून मिलता है', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ]
  },
  {
    id: 'weather', section: 'prakriti', question: 'कौन सा मौसम आपको सबसे ज़्यादा शारीरिक रूप से परेशान करता है?', emoji: '🌦️',
    answers: [
      { id: 'cold_wind', label: 'ठंडा और तूफ़ानी', desc: 'हवा से बेचैनी और चिंता; ठंड से जकड़न; शुष्क मौसम त्वचा और होंठ फटाता है', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'heat_sun', label: 'गर्मी, उमस और तेज़ धूप', desc: 'जल्दी गर्म होना; धूप से जलना; गर्म/उमस भरे मौसम में चिड़चिड़ापन और सूजन', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'cold_damp', label: 'ठंडा, नम और बादलों वाला', desc: 'ऐसे मौसम में सुस्त और भारी महसूस; सर्दियों में जमाव और आलस्य की प्रवृत्ति', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ]
  },
  {
    id: 'stress_response', section: 'prakriti', question: 'तनाव में आपकी प्राकृतिक प्रतिक्रिया?', emoji: '🌊',
    answers: [
      { id: 'anxious_overwhelmed', label: 'चिंतित, बिखरे और जम जाते हैं', desc: 'चिंता, अत्यधिक सोचना, ठहर जाना; लंबे तनाव में अनिद्रा और भय', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'irritable_intense', label: 'चिड़चिड़े, नियंत्रण लेते और और मेहनत करते', desc: 'क्रोध या निराशा; नियंत्रण लेते हैं; खुद और दूसरों पर आलोचनात्मक हो जाते हैं', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'withdraw_avoid', label: 'पीछे हटते, चुप रहते और खाकर सुकून', desc: 'चुप हो जाते हैं, ज़्यादा सोते हैं, आरामदायक खाना खाते हैं; मुद्दे से बचते हैं', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ]
  },
  {
    id: 'joints', section: 'prakriti', question: 'आपके जोड़, हड्डियाँ और शारीरिक ढांचा?', emoji: '🦴',
    answers: [
      { id: 'prominent_crack', label: 'उभरे, चटकने वाले और दुबले', desc: 'जोड़ आवाज़ करते हैं; बड़ी, उभरी हड्डियाँ दुबले ढांचे पर; अत्यधिक लचीलापन संभव', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'moderate_flexible', label: 'मध्यम, सुगठित और लचीले', desc: 'अच्छी मांसपेशियों के साथ संतुलित जोड़; मध्यम लचीलापन; कम चटकन', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'large_padded', label: 'बड़े, गद्देदार और बहुत स्थिर', desc: 'मोटे संयोजी ऊतक के साथ चौड़े जोड़; बहुत स्थिर; मज़बूत नींव; शायद ही चटकते', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ]
  },
  {
    id: 'gait', section: 'prakriti', question: 'आपकी प्राकृतिक चाल और शारीरिक गति?', emoji: '🚶',
    answers: [
      { id: 'fast_irregular', label: 'तेज़, हल्की और अनियमित', desc: 'हल्के, अनियमित कदमों से तेज़ चलते हैं; दिशा आसानी से बदलते हैं; हाथ-पैर हिलाते हैं', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'purposeful_brisk', label: 'उद्देश्यपूर्ण, तेज़ और सीधी', desc: 'आत्मविश्वास और लक्ष्य के साथ चलते हैं; मध्यम-तेज़ गति; कुशल और सीधे', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'slow_steady_graceful', label: 'धीमी, स्थिर और सुंदर', desc: 'इत्मीनान से और सोच-समझकर चलते हैं; स्थिर, सहज और सुंदर गति; चौड़े मज़बूत कदम', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
    ]
  },
];


const VIKRITI_QUESTIONS_HI: QuizQuestion[] = [
  {
    id: 'v_energy', section: 'vikriti', question: 'पिछले 2 हफ़्तों में आपकी ऊर्जा कैसी रही है?', emoji: '⚡',
    answers: [
      { id: 'v_scattered', label: 'बिखरी और चिंतित', desc: 'बेचैन, अनियमित, ध्यान केंद्रित करना कठिन', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'v_intense', label: 'तीव्र और अतिसक्रिय', desc: 'प्रेरित लेकिन चिड़चिड़े या सूजन महसूस', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'v_heavy', label: 'भारी और कम', desc: 'सुस्त, अप्रेरित, शुरू करना मुश्किल', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
      { id: 'v_balanced', label: 'संतुलित और स्थिर', desc: 'सामान्यतः स्थिर और अच्छा', doshaEffect: { vata: 1, pitta: 1, kapha: 1 } },
    ]
  },
  {
    id: 'v_digestion', section: 'vikriti', question: 'अभी आपका पाचन कैसा है?', emoji: '🔥',
    answers: [
      { id: 'v_bloated', label: 'फूला और अनियमित', desc: 'गैस, कब्ज़, अप्रत्याशित', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'v_acidic', label: 'अम्लीय और तेज़', desc: 'अम्लता, सीने में जलन, ढीले मल', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'v_slow_heavy', label: 'धीमा और भारी', desc: 'खाने के बाद भारीपन, मतली, धीमा पाचन', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
      { id: 'v_good', label: 'अच्छा और नियमित', desc: 'पाचन सामान्य लग रहा है', doshaEffect: { vata: 1, pitta: 1, kapha: 1 } },
    ]
  },
  {
    id: 'v_sleep', section: 'vikriti', question: 'हाल ही में आपकी नींद कैसी रही है?', emoji: '🌙',
    answers: [
      { id: 'v_insomnia', label: 'हल्की और बाधित', desc: 'नींद आने में कठिनाई, रात में जागना', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'v_waking_midnight', label: 'रात 10-2 बजे जागना', desc: 'आधी रात को सक्रिय मन, अधिक गर्मी', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'v_excessive', label: 'अत्यधिक और भारी', desc: 'बहुत ज़्यादा सोना, जागना मुश्किल, सुस्ती', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
      { id: 'v_normal_sleep', label: 'सामान्य और तरोताज़ा', desc: 'नींद अच्छी लग रही है', doshaEffect: { vata: 1, pitta: 1, kapha: 1 } },
    ]
  },
  {
    id: 'v_mood', section: 'vikriti', question: 'हाल ही में कौन सी भावनात्मक स्थिति सबसे अधिक है?', emoji: '💭',
    answers: [
      { id: 'v_anxiety', label: 'चिंता और घबराहट', desc: 'अधिक सोचना, डर, बेचैनी, बिखराव', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'v_anger', label: 'चिड़चिड़ापन और निराशा', desc: 'जल्दी क्रोध, अधीरता, आलोचना', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'v_lethargy', label: 'भारीपन और उदासी', desc: 'कम प्रेरणा, पीछे हटना, आसक्ति', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
      { id: 'v_content', label: 'अधिकतर संतुष्ट', desc: 'भावनात्मक रूप से स्थिर और ठीक', doshaEffect: { vata: 1, pitta: 1, kapha: 1 } },
    ]
  },
  {
    id: 'v_physical', section: 'vikriti', question: 'हाल ही में कोई शारीरिक लक्षण?', emoji: '🌿',
    answers: [
      { id: 'v_dry_cramps', label: 'शुष्कता, जोड़ दर्द, ऐंठन', desc: 'शुष्क त्वचा, कब्ज़, मांसपेशियों में तनाव', doshaEffect: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'v_inflammation', label: 'सूजन और त्वचा समस्याएँ', desc: 'चकत्ते, अम्लता, जलन', doshaEffect: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'v_congestion', label: 'कफ और वज़न बढ़ना', desc: 'बलगम, भारीपन, सूजन', doshaEffect: { vata: 0, pitta: 0, kapha: 2 } },
      { id: 'v_none', label: 'कोई विशेष नहीं', desc: 'शारीरिक रूप से ठीक महसूस हो रहा है', doshaEffect: { vata: 1, pitta: 1, kapha: 1 } },
    ]
  },
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
  const vikritiiQuestions = lang === 'hi' ? VIKRITI_QUESTIONS_HI : VIKRITI_QUESTIONS;

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
                      : <>✦ Now we check your <strong>Vikriti</strong> — how you feel <em>right now</em>, not how you always are. Answer based on the last 2 weeks.</>}
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
                      : <>✦ Answer as you have <strong>always been</strong> since birth — not how you are right now. Think of your natural, unchanging constitution.</>}
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
