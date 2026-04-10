/**
 * doshaService.ts — Core Ayurvedic Engine for ONESUTRA
 * The central intelligence layer powering all dosha-aware features.
 */

// ─── Core Dosha Types ──────────────────────────────────────────────────────────

export type Dosha = 'vata' | 'pitta' | 'kapha';
export type DoshaCombo = 'vata' | 'pitta' | 'kapha' | 'vata-pitta' | 'pitta-kapha' | 'vata-kapha' | 'tridoshic';
export type Season = 'vasanta' | 'grishma' | 'varsha' | 'sharad' | 'hemanta' | 'shishira';
export type DoshaPhase = 'brahma-muhurta' | 'kapha-morning' | 'pitta-midday' | 'vata-afternoon' | 'kapha-evening' | 'pitta-night';
export type Guna = 'sattva' | 'rajas' | 'tamas';

export interface DoshaScore {
  vata: number;
  pitta: number;
  kapha: number;
}

export interface Prakriti {
  primary: Dosha;
  secondary: Dosha | null;
  combo: DoshaCombo;
  scores: DoshaScore;
}

export interface Vikriti {
  primary: Dosha | null;
  scores: DoshaScore;
  imbalanceLevel: 'balanced' | 'mild' | 'moderate' | 'high';
}

export interface DoshaKala {
  phase: DoshaPhase;
  dominantDosha: Dosha;
  label: string;
  timeRange: string;
  quality: string;
  bestFor: string[];
  avoid: string[];
}

export interface RitucharayaSeason {
  id: Season;
  name: string;
  nameHi: string;
  months: number[];
  dominantDosha: Dosha;
  color: string;
  gradient: string;
  emoji: string;
  qualities: string[];
  focus: string;
  foodGuidance: string;
  foods: string[];
  movementGuidance: string;
  lifestyle: string[];
  doshaEffect: string;
  detox: string;
}

export interface DoshaRecommendation {
  wakeTime: string;
  sleepTime: string;
  oilForAbhyanga: string;
  yogaStyle: string;
  pranayama: string;
  morningDrink: string;
  breakfastGuide: string;
  lunchGuide: string;
  dinnerGuide: string;
  eveningPractice: string;
  exerciseIntensity: 'gentle' | 'moderate' | 'vigorous';
  meditationStyle: string;
  emotionalFocus: string;
}

// ─── Dosha Characteristics ─────────────────────────────────────────────────────

export const DOSHA_INFO: Record<Dosha, {
  name: string;
  elements: string;
  color: string;
  accentColor: string;
  emoji: string;
  governs: string[];
  imbalanceSigns: string[];
  strengths: string[];
  mantra: string;
  description: string;
}> = {
  vata: {
    name: 'Vata',
    elements: 'Air + Ether',
    color: '#7c3aed',
    accentColor: '#a78bfa',
    emoji: '🌬️',
    governs: ['Movement', 'Breath', 'Nervous system', 'Creativity', 'Circulation'],
    imbalanceSigns: ['Anxiety', 'Dry skin', 'Insomnia', 'Constipation', 'Scattered thinking', 'Joint pain'],
    strengths: ['Creative', 'Enthusiastic', 'Quick mind', 'Adaptable', 'Spiritual'],
    mantra: 'Om Vayu Namaha',
    description: 'You are the wind — light, quick, and forever in motion. Your mind dances between ideas, your body craves warmth, and your spirit longs for stillness amidst the flow.',
  },
  pitta: {
    name: 'Pitta',
    elements: 'Fire + Water',
    color: '#c2410c',
    accentColor: '#fb923c',
    emoji: '🔥',
    governs: ['Digestion', 'Metabolism', 'Intelligence', 'Ambition', 'Transformation'],
    imbalanceSigns: ['Inflammation', 'Acidity', 'Irritability', 'Skin rashes', 'Burnout', 'Perfectionism'],
    strengths: ['Sharp mind', 'Strong digestion', 'Leadership', 'Focus', 'Courage'],
    mantra: 'Om Agni Namaha',
    description: 'You are the fire — bright, focused, and transformative. You digest experience rapidly, lead with conviction, and your inner flame burns with purpose and intelligence.',
  },
  kapha: {
    name: 'Kapha',
    elements: 'Earth + Water',
    color: '#15803d',
    accentColor: '#4ade80',
    emoji: '🌿',
    governs: ['Structure', 'Immunity', 'Love', 'Stability', 'Memory'],
    imbalanceSigns: ['Weight gain', 'Lethargy', 'Depression', 'Congestion', 'Brain fog', 'Attachment'],
    strengths: ['Steady', 'Loving', 'Patient', 'Strong immunity', 'Deep memory', 'Loyal'],
    mantra: 'Om Prithvi Namaha',
    description: 'You are the earth — stable, nurturing, and deeply loving. Your presence brings calm to any room, your memory is long, and your loyalty is unshakeable.',
  },
};

export const COMBO_DESCRIPTIONS: Record<DoshaCombo, string> = {
  'vata': 'Pure Vata — rare and deeply creative. Your constitution is light, mobile, and spiritually sensitive.',
  'pitta': 'Pure Pitta — the archetypal leader. Sharp, focused, and transformative in everything you touch.',
  'kapha': 'Pure Kapha — the beloved protector. Stable, nurturing, and enduring through all of life\'s seasons.',
  'vata-pitta': 'Vata-Pitta — the inspired visionary. You combine creative lightning with focused fire, making you both imaginative and driven.',
  'pitta-kapha': 'Pitta-Kapha — the steady powerhouse. Fire gives you drive, earth gives you endurance. You build empires slowly and surely.',
  'vata-kapha': 'Vata-Kapha — the gentle dreamer. Air gives you creativity, earth gives you warmth. You are both inspiring and deeply caring.',
  'tridoshic': 'Tridoshic — the rare balanced one. All three doshas move in relative harmony within you. Maintain this balance with consistent Dinacharya.',
};

// ─── Ayurvedic Clock (Dosha Kala) ─────────────────────────────────────────────

export function getCurrentDoshaPhase(hour?: number): DoshaKala {
  const h = hour ?? new Date().getHours();

  if (h >= 2 && h < 6) {
    return {
      phase: 'brahma-muhurta',
      dominantDosha: 'vata',
      label: 'Brahma Muhurta',
      timeRange: '2 AM – 6 AM',
      quality: 'Sattvic, pure, spiritually elevated',
      bestFor: ['Meditation', 'Pranayama', 'Prayer', 'Mantra japa', 'Sacred reading', 'Intention setting'],
      avoid: ['Heavy food', 'Screens', 'Stimulants', 'Stress'],
    };
  } else if (h >= 6 && h < 10) {
    return {
      phase: 'kapha-morning',
      dominantDosha: 'kapha',
      label: 'Kapha Morning',
      timeRange: '6 AM – 10 AM',
      quality: 'Heavy, slow, grounded',
      bestFor: ['Movement', 'Cleansing', 'Warm breakfast', 'Exercise'],
      avoid: ['Heavy sleep', 'Lying in bed', 'Heavy dairy', 'Sweet foods'],
    };
  } else if (h >= 10 && h < 14) {
    return {
      phase: 'pitta-midday',
      dominantDosha: 'pitta',
      label: 'Pitta Midday',
      timeRange: '10 AM – 2 PM',
      quality: 'Fire, focus, peak digestion',
      bestFor: ['Main meal', 'Deep work', 'Important decisions', 'Focus tasks'],
      avoid: ['Skipping lunch', 'Overworking without breaks', 'Confrontations'],
    };
  } else if (h >= 14 && h < 18) {
    return {
      phase: 'vata-afternoon',
      dominantDosha: 'vata',
      label: 'Vata Period',
      timeRange: '2 PM – 6 PM',
      quality: 'Creative, communicative, airy',
      bestFor: ['Creative work', 'Communication', 'Light movement', 'Herbal tea'],
      avoid: ['Heavy snacking', 'Skipping meals', 'Overstimulation'],
    };
  } else if (h >= 18 && h < 22) {
    return {
      phase: 'kapha-evening',
      dominantDosha: 'kapha',
      label: 'Kapha Evening',
      timeRange: '6 PM – 10 PM',
      quality: 'Wind down, ground, rest',
      bestFor: ['Light dinner', 'Gentle walk', 'Journaling', 'Foot massage', 'Screen-free time'],
      avoid: ['Heavy meals', 'Stimulating content', 'Late exercise', 'Caffeine'],
    };
  } else {
    return {
      phase: 'pitta-night',
      dominantDosha: 'pitta',
      label: 'Pitta Night',
      timeRange: '10 PM – 2 AM',
      quality: 'Internal fire, cellular repair',
      bestFor: ['Deep sleep', 'Body\'s internal cleansing'],
      avoid: ['Being awake', 'Eating', 'Screens', 'Stimulants'],
    };
  }
}

export function isBrahmaMuhurta(): boolean {
  const h = new Date().getHours();
  const m = new Date().getMinutes();
  const totalMins = h * 60 + m;
  return totalMins >= 120 && totalMins < 360; // 2 AM to 6 AM
}

// ─── Seasonal Engine (Ritucharya) ──────────────────────────────────────────────

export const RITU_SEASONS: RitucharayaSeason[] = [
  {
    id: 'vasanta',
    name: 'Vasanta (Spring)',
    nameHi: 'वसन्त',
    months: [3, 4],
    dominantDosha: 'kapha',
    color: '#4ade80',
    gradient: 'linear-gradient(135deg, rgba(74,222,128,0.15), rgba(34,197,94,0.05))',
    emoji: '🌸',
    qualities: ['Warm & wet', 'Kapha melts', 'Prana surges', 'Renewal'],
    focus: 'Kapha detox — release winter heaviness',
    foodGuidance: 'Light, warm, bitter foods. Reduce sweets and dairy. Honey is ideal now.',
    foods: ['Bitter greens', 'Light grains', 'Honey', 'Ginger', 'Barley'],
    movementGuidance: 'Vigorous movement, brisk walking, energising yoga.',
    lifestyle: ['Sunrise yoga', 'Dry brushing', 'Reduce heavy foods', 'Daily oil massage'],
    doshaEffect: 'Kapha liquefies — detox, lighten diet, increase activity',
    detox: 'Gentle Kapha cleanse — dry fasting, light meals, nasya oil',
  },
  {
    id: 'grishma',
    name: 'Grishma (Summer)',
    nameHi: 'ग्रीष्म',
    months: [5, 6],
    dominantDosha: 'pitta',
    color: '#fb923c',
    gradient: 'linear-gradient(135deg, rgba(251,146,60,0.15), rgba(249,115,22,0.05))',
    emoji: '☀️',
    qualities: ['Hot & dry', 'Pitta rises', 'Agni high', 'Abundant energy'],
    focus: 'Pitta cooling — protect from heat and inflammation',
    foodGuidance: 'Cooling, sweet, hydrating foods. Coconut water, fresh fruits, buttermilk at noon.',
    foods: ['Sweet fruits', 'Coconut water', 'Cucumber', 'Milk', 'Cooling herbs'],
    movementGuidance: 'Gentle movement in cool morning hours. Avoid midday exertion.',
    lifestyle: ['Early morning exercise only', 'Cooling coconut oil massage', 'Moon bathing', 'Less exertion'],
    doshaEffect: 'Pitta aggravated — cool foods, reduce spice, avoid midday sun',
    detox: 'Pitta pacifying — rose water, coconut, sandalwood, cooling baths',
  },
  {
    id: 'varsha',
    name: 'Varsha (Monsoon)',
    nameHi: 'वर्षा',
    months: [7, 8],
    dominantDosha: 'vata',
    color: '#60a5fa',
    gradient: 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(59,130,246,0.05))',
    emoji: '🌧️',
    qualities: ['Wet & cloudy', 'Vata + Pitta', 'Weak Agni', 'Sluggish'],
    focus: 'Agni repair — strengthen digestive fire',
    foodGuidance: 'Warm cooked food only. No raw or cold food. Ginger, cumin, and rock salt strengthen Agni.',
    foods: ['Light grains', 'Warm soups', 'Old honey', 'Ginger lemon water'],
    movementGuidance: 'Gentle indoor movement. Avoid cold and damp exposure.',
    lifestyle: ['Avoid rain exposure', 'Digestive spices in every meal', 'Light exercise only', 'Rainy season naps ok'],
    doshaEffect: 'Vata rises, Agni decreases — eat warm, easily digestible foods',
    detox: 'Basti (oil enema) season — restore Ojas, strengthen Agni gradually',
  },
  {
    id: 'sharad',
    name: 'Sharad (Autumn)',
    nameHi: 'शरद्',
    months: [9, 10],
    dominantDosha: 'pitta',
    color: '#fbbf24',
    gradient: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.05))',
    emoji: '🍂',
    qualities: ['Warm days cool nights', 'Pitta pacifying', 'Clear skies', 'Festive'],
    focus: 'Pitta pacification — cooling practices before winter',
    foodGuidance: 'Cooling, sweet, bitter foods. Avoid excess pungent and sour.',
    foods: ['Sweet, light, bitter', 'Pomegranate', 'Grapes', 'Rice', 'Amla'],
    movementGuidance: 'Moderate movement. Cooling yoga. Avoid competition and heat.',
    lifestyle: ['Moonlight walks', 'Avoid sleeping in daytime', 'Cooling practices', 'Panchkarma ideal'],
    doshaEffect: 'Pitta pacified naturally — nourish with sweet fruits, maintain lightness',
    detox: 'Virechana (purgation) season — best time for Panchakarma home protocols',
  },
  {
    id: 'hemanta',
    name: 'Hemanta (Early Winter)',
    nameHi: 'हेमन्त',
    months: [11, 12],
    dominantDosha: 'kapha',
    color: '#818cf8',
    gradient: 'linear-gradient(135deg, rgba(129,140,248,0.15), rgba(99,102,241,0.05))',
    emoji: '🌾',
    qualities: ['Cold & slightly dry', 'Strong Agni', 'High energy', 'Grounding'],
    focus: 'Ojas building — nourish deep reserves',
    foodGuidance: 'Warm, oily, nourishing foods. Root vegetables, ghee, warm milk with spices.',
    foods: ['Nourishing oils', 'Sesame', 'Ghee', 'Root vegetables', 'Warm milk', 'Dates'],
    movementGuidance: 'Vigorous morning exercise. Abhyanga daily. Stay warm.',
    lifestyle: ['Vigorous exercise welcome', 'Sesame oil massage', 'Warm baths', 'Build strength'],
    doshaEffect: 'Agni strongest — eat more, build Ojas, strengthen the body',
    detox: 'Ojas building — nourishing foods, abhyanga, warm baths, rasayana herbs',
  },
  {
    id: 'shishira',
    name: 'Shishira (Deep Winter)',
    nameHi: 'शिशिर',
    months: [1, 2],
    dominantDosha: 'vata',
    color: '#a78bfa',
    gradient: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(139,92,246,0.05))',
    emoji: '❄️',
    qualities: ['Cold & windy', 'Vata rises', 'Dry', 'Inward energy'],
    focus: 'Vata warmth — ground and nourish against dryness',
    foodGuidance: 'Very warm, unctuous, heavy foods. Avoid cold and raw. Sesame, dates, warm soups.',
    foods: ['Heavy, oily, sour', 'Sesame', 'Urad dal', 'Wheat', 'Jaggery', 'Warm spiced milk'],
    movementGuidance: 'Warm, grounded movement. Avoid cold outdoor exercise. Hot oil massage essential.',
    lifestyle: ['Stay warm always', 'Extra abhyanga', 'Shorter meditation', 'Adequate sleep', 'Social warmth'],
    doshaEffect: 'Vata aggravated — warm, oily, heavy foods; routine is medicine',
    detox: 'Snehana (oleation) therapy — internal ghee, sesame oil internally + externally',
  },
];

export function getCurrentSeason(): RitucharayaSeason {
  const month = new Date().getMonth() + 1;
  return RITU_SEASONS.find(s => s.months.includes(month)) ?? RITU_SEASONS[0];
}

// ─── Prakriti Calculator ───────────────────────────────────────────────────────

export function calculatePrakriti(scores: DoshaScore): Prakriti {
  const total = scores.vata + scores.pitta + scores.kapha;
  if (total === 0) {
    return { primary: 'vata', secondary: null, combo: 'vata', scores };
  }

  const normalized = {
    vata: (scores.vata / total) * 100,
    pitta: (scores.pitta / total) * 100,
    kapha: (scores.kapha / total) * 100,
  };

  const sorted = (['vata', 'pitta', 'kapha'] as Dosha[]).sort(
    (a, b) => normalized[b] - normalized[a]
  );

  const primary = sorted[0];
  const secondPct = normalized[sorted[1]];
  const primaryPct = normalized[sorted[0]];

  const allClose = Math.max(...Object.values(normalized)) - Math.min(...Object.values(normalized)) < 15;
  if (allClose) {
    return { primary, secondary: null, combo: 'tridoshic', scores };
  }

  const hasSecondary = secondPct >= 25 && primaryPct - secondPct < 25;
  const secondary = hasSecondary ? sorted[1] : null;

  let combo: DoshaCombo;
  if (!secondary) {
    combo = primary;
  } else {
    const pair = [primary, secondary].sort().join('-') as DoshaCombo;
    combo = pair;
  }

  return { primary, secondary, combo, scores };
}

// ─── Vikriti Calculator ────────────────────────────────────────────────────────

export function calculateVikriti(scores: DoshaScore): Vikriti {
  const total = scores.vata + scores.pitta + scores.kapha;
  const maxScore = Math.max(scores.vata, scores.pitta, scores.kapha);
  const maxPct = total > 0 ? (maxScore / total) * 100 : 0;

  let imbalanceLevel: Vikriti['imbalanceLevel'] = 'balanced';
  if (maxPct > 60) imbalanceLevel = 'high';
  else if (maxPct > 50) imbalanceLevel = 'moderate';
  else if (maxPct > 42) imbalanceLevel = 'mild';

  const primary =
    imbalanceLevel !== 'balanced'
      ? (['vata', 'pitta', 'kapha'] as Dosha[]).sort((a, b) => scores[b] - scores[a])[0]
      : null;

  return { primary, scores, imbalanceLevel };
}

// ─── Recommendations Generator ─────────────────────────────────────────────────

export function getDoshaRecommendations(prakriti: Prakriti, vikriti?: Vikriti): DoshaRecommendation {
  const dominant = vikriti?.primary ?? prakriti.primary;

  const recs: Record<Dosha, DoshaRecommendation> = {
    vata: {
      wakeTime: '5:00 AM',
      sleepTime: '9:30 PM',
      oilForAbhyanga: 'Warm sesame oil',
      yogaStyle: 'Slow, grounding, warming asanas. Gentle Sun Salutation. Floor poses.',
      pranayama: 'Anulom Vilom (alternate nostril breathing) — 10 min',
      morningDrink: 'Warm water with a pinch of ginger and a drop of ghee',
      breakfastGuide: 'Warm, oily, sweet. Spiced oatmeal, warm milk with dates, cooked fruits.',
      lunchGuide: 'Warm, nourishing, well-cooked. Dal, rice, ghee, root vegetables.',
      dinnerGuide: 'Warm, soupy, easy to digest. Khichdi or light dal. Early (by 7 PM).',
      eveningPractice: 'Padabhyanga (warm sesame oil on feet). Warm milk with nutmeg and cardamom.',
      exerciseIntensity: 'gentle',
      meditationStyle: 'Warming visualization. Grounding mantra. Silence with earth imagery.',
      emotionalFocus: 'Ground anxiety with warmth, routine, and stillness. Avoid overthinking.',
    },
    pitta: {
      wakeTime: '4:30 AM',
      sleepTime: '10:00 PM',
      oilForAbhyanga: 'Cooling coconut or sunflower oil',
      yogaStyle: 'Cooling, non-competitive. Moon Salutation. Gentle flows. No hot yoga.',
      pranayama: 'Shitali / Sheetkari (cooling breath) — 10 min',
      morningDrink: 'Cool rose-petal water or coriander-infused water',
      breakfastGuide: 'Cooling, moderate. Fresh fruits, coconut water, mild porridge. Avoid spicy.',
      lunchGuide: 'Largest meal. Cooling, sweet, bitter. Fresh sabzi, rice, cooling chutneys.',
      dinnerGuide: 'Light and cooling. Avoid excess spice, fermented foods, or sour dishes.',
      eveningPractice: 'Padabhyanga (coconut oil). Cooling tea (mint, coriander). No screens.',
      exerciseIntensity: 'moderate',
      meditationStyle: 'Cooling visualization — moonlight, rivers, open sky. Compassion meditation.',
      emotionalFocus: 'Release perfectionism. Channel fire into service, not control.',
    },
    kapha: {
      wakeTime: '3:30 AM',
      sleepTime: '10:00 PM',
      oilForAbhyanga: 'Warm mustard or sesame oil, vigorous strokes',
      yogaStyle: 'Energising, vigorous, fast-paced. Sun Salutation at speed. Standing poses.',
      pranayama: 'Bhastrika / Kapalabhati (bellows breath) — 10 min',
      morningDrink: 'Warm water with ginger, lemon, and a touch of honey',
      breakfastGuide: 'Light, warm, spiced. Small portion. Ginger tea. Avoid heavy dairy and sweets.',
      lunchGuide: 'Moderate, light, well-spiced. Avoid excess oil and sweet.',
      dinnerGuide: 'Very light. Warm soup or kitchari. Small portion. By 6:30 PM.',
      eveningPractice: 'Padabhyanga (mustard oil). Stimulating evening walk. No heavy meal.',
      exerciseIntensity: 'vigorous',
      meditationStyle: 'Energizing visualization — sunrise, mountain peaks. Active mantra repetition.',
      emotionalFocus: 'Break through inertia. Movement is medicine. Act without waiting for motivation.',
    },
  };

  return recs[dominant];
}

// ─── Dosha-Aware Notification Texts ───────────────────────────────────────────

export function getBrahmaMuhurtaGreeting(dosha: Dosha): string {
  const greetings: Record<Dosha, string> = {
    vata: 'Brahma Muhurta is now. The pre-dawn stillness belongs to you, Vata friend. Rise gently into the sacred quiet.',
    pitta: 'Brahma Muhurta is here. The world is still. Your Pitta mind is at its clearest now — rise and receive this gift.',
    kapha: 'Brahma Muhurta calls. This is your most powerful practice, Kapha — rising now breaks the heaviness that holds you. Rise.',
  };
  return greetings[dosha];
}

export function getDoshaClockMessage(phase: DoshaPhase, dosha: Dosha): string {
  const messages: Record<DoshaPhase, string> = {
    'brahma-muhurta': 'The most sacred hours of the day. Meditate, breathe, set your sankalpa.',
    'kapha-morning': `Kapha time — move your body. Your ${dosha === 'kapha' ? 'Kapha needs this most' : 'morning practice anchors everything that follows'}.`,
    'pitta-midday': 'Your Agni is strongest now — make this your main meal and deepest focus work.',
    'vata-afternoon': 'Creative Vata energy — ideal for inspired work, light movement, and herbal tea.',
    'kapha-evening': 'Wind down. Light dinner. Screens off. Your body is preparing for deep repair.',
    'pitta-night': 'Pitta cleanse begins. Your liver is working. Be asleep — your Ojas depends on it.',
  };
  return messages[phase];
}

// ─── Ojas / Agni / Ama Estimators ─────────────────────────────────────────────

export interface AyurvedicMetrics {
  agni: number;       // 0-100
  ama: number;        // 0-100 (lower is better)
  ojas: number;       // 0-100
  agniLabel: string;
  amaLabel: string;
  ojasLabel: string;
}

export function estimateAyurvedicMetrics(params: {
  habitCompletionRate: number;
  sleepQuality: number;
  mealTiming: number;
  tongueCoating: 'clean' | 'slight' | 'heavy';
  energyLevel: number;
}): AyurvedicMetrics {
  const { habitCompletionRate, sleepQuality, mealTiming, tongueCoating, energyLevel } = params;

  const tongueScore = tongueCoating === 'clean' ? 100 : tongueCoating === 'slight' ? 60 : 20;

  const agni = Math.round(
    mealTiming * 0.35 + sleepQuality * 0.25 + habitCompletionRate * 0.2 + tongueScore * 0.2
  );

  const ama = Math.round(
    100 - (tongueScore * 0.4 + habitCompletionRate * 0.3 + mealTiming * 0.3)
  );

  const ojas = Math.round(
    energyLevel * 0.3 + sleepQuality * 0.3 + habitCompletionRate * 0.25 + (agni / 100) * 0.15 * 100
  );

  const agniLabel =
    agni >= 75 ? 'Bright & Strong' : agni >= 50 ? 'Moderate' : agni >= 30 ? 'Weakened' : 'Depleted';
  const amaLabel =
    ama <= 20 ? 'Minimal' : ama <= 40 ? 'Mild' : ama <= 65 ? 'Moderate' : 'High';
  const ojasLabel =
    ojas >= 75 ? 'Radiant' : ojas >= 50 ? 'Good' : ojas >= 30 ? 'Building' : 'Low';

  return { agni, ama, ojas, agniLabel, amaLabel, ojasLabel };
}

// ─── Spice / Food Wisdom ───────────────────────────────────────────────────────

export interface SpiceWisdom {
  name: string;
  sanskrit: string;
  emoji: string;
  effect: string;
  doshaEffect: { vata: number; pitta: number; kapha: number };
  bestUse: string;
}

export const KITCHEN_PHARMACY: SpiceWisdom[] = [
  { name: 'Ginger', sanskrit: 'Ardraka / Shunti', emoji: '🫚', effect: 'Kindles Agni, digestive fire', doshaEffect: { vata: -1, pitta: 1, kapha: -1 }, bestUse: 'Warm water in morning, with meals for digestion' },
  { name: 'Turmeric', sanskrit: 'Haridra', emoji: '🟡', effect: 'Anti-inflammatory, purifying', doshaEffect: { vata: -1, pitta: 0, kapha: -1 }, bestUse: 'Golden milk, dal, vegetables — small amounts' },
  { name: 'Cumin', sanskrit: 'Jiraka', emoji: '🌿', effect: 'Tri-doshic digestive', doshaEffect: { vata: -1, pitta: -1, kapha: -1 }, bestUse: 'Temper in ghee, CCF tea for digestion' },
  { name: 'Cardamom', sanskrit: 'Ela', emoji: '💚', effect: 'Digestive, breath-freshening', doshaEffect: { vata: -1, pitta: -1, kapha: 0 }, bestUse: 'Warm milk, tea, sweets — digestive support' },
  { name: 'Fennel', sanskrit: 'Shatapushpa', emoji: '🌿', effect: 'Cooling, digestive, Pitta-pacifying', doshaEffect: { vata: -1, pitta: -1, kapha: 0 }, bestUse: 'CCF tea, after meals for bloating' },
  { name: 'Black Pepper', sanskrit: 'Maricha', emoji: '⚫', effect: 'Kindles Agni, Kapha-clearing', doshaEffect: { vata: 0, pitta: 1, kapha: -1 }, bestUse: 'With most foods, especially Kapha types' },
  { name: 'Cinnamon', sanskrit: 'Tvak', emoji: '🪵', effect: 'Warming, circulation, Vata-Kapha pacifying', doshaEffect: { vata: -1, pitta: 0, kapha: -1 }, bestUse: 'Morning tea, warm milk, oatmeal' },
  { name: 'Ajwain', sanskrit: 'Ajamoda', emoji: '🌱', effect: 'Powerful digestive, Vata-Kapha remedy', doshaEffect: { vata: -1, pitta: 1, kapha: -1 }, bestUse: 'With heavy foods, bloating, cold season' },
  { name: 'Asafoetida (Hing)', sanskrit: 'Hingu', emoji: '🟤', effect: 'Most powerful Vata-digestive remedy', doshaEffect: { vata: -2, pitta: 1, kapha: -1 }, bestUse: 'Small pinch in dal and vegetables for gas' },
  { name: 'Coriander', sanskrit: 'Dhanyaka', emoji: '🌱', effect: 'Cooling, digestive, tri-doshic in balance', doshaEffect: { vata: -1, pitta: -1, kapha: -1 }, bestUse: 'CCF tea, in cooking, fresh for garnish' },
];

// ─── Dosha Quiz Scoring Map ────────────────────────────────────────────────────

export interface QuizAnswer {
  questionId: string;
  answerId: string;
  doshaEffect: DoshaScore;
}

export function aggregateQuizScores(answers: QuizAnswer[]): DoshaScore {
  return answers.reduce(
    (acc, a) => ({
      vata: acc.vata + a.doshaEffect.vata,
      pitta: acc.pitta + a.doshaEffect.pitta,
      kapha: acc.kapha + a.doshaEffect.kapha,
    }),
    { vata: 0, pitta: 0, kapha: 0 }
  );
}

// ─── Daily Dosha Story Generator ──────────────────────────────────────────────

export function generateDoshaStory(prakriti: Prakriti, vikriti: Vikriti): string[] {
  const p = prakriti.primary;
  const v = vikriti.primary;
  const season = getCurrentSeason();

  const para1 = `You are ${prakriti.combo === 'tridoshic' ? 'a rare tridoshic being' : `a ${prakriti.combo.replace('-', '-').toUpperCase()} constitution`} — ${COMBO_DESCRIPTIONS[prakriti.combo]} ${DOSHA_INFO[p].description}`;

  const para2 = v
    ? `Right now, your ${DOSHA_INFO[v].name} is running elevated. This manifests as ${DOSHA_INFO[v].imbalanceSigns.slice(0, 3).join(', ')}. This is not permanent — it is a signal. Your body is asking for ${v === 'vata' ? 'warmth, routine, and stillness' : v === 'pitta' ? 'cooling, rest, and release of control' : 'movement, lightness, and stimulation'}.`
    : `Your current state (Vikriti) is relatively close to your birth constitution — a sign that your lifestyle is largely in harmony. Continue building on this foundation with consistent Dinacharya.`;

  const para3 = `We are in ${season.name} — ${season.focus}. ${season.foodGuidance} Your Dinacharya is being customised for both your Prakriti and this season.`;

  return [para1, para2, para3];
}
