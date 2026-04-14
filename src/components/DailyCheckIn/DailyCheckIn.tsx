'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  type CheckInQuestion,
  type CheckInAnswer,
  type DailyCheckInRecord,
  selectTodayQuestions,
  scoreAnswers,
  computeRollingVikruti,
  getElevatedDosha,
  saveTodayRecord,
  recordSkip,
  clearSkipStreak,
} from '@/lib/healthCheckIn';
import {
  getMorningMood,
  setMorningMoodStorage,
  type MorningMoodKey,
} from '@/components/MoodGarden/MorningMoodCards';
import { useGeminiTTS } from '@/hooks/useGeminiTTS';
import { useLanguage } from '@/context/LanguageContext';

// ─── Hindi Translations ────────────────────────────────────────────────────────
const MOOD_CARDS_HI = [
  { key: 'blooming'    as MorningMoodKey, emoji: '🌸', label: 'खिलते हुए',   doshaSignal: 'आनंदित · ऊर्जावान · संतुलित',      bodhiLine: 'इस भाव में एक सुंदर दिन छुपा है — आइए इसे सम्मान दें।',      accentColor: '#fb923c', gradient: 'linear-gradient(160deg, rgba(251,146,60,0.45) 0%, rgba(244,114,182,0.30) 100%)', bgImage: 'https://images.unsplash.com/photo-1490750967868-88df5691cc34?w=600&q=75&fit=crop', moodValue: 5 },
  { key: 'gentle_leaf' as MorningMoodKey, emoji: '🍃', label: 'कोमल',        doshaSignal: 'शांत · निर्मल · वात संतुलित',        bodhiLine: 'स्थिर और स्पष्ट। शुरुआत के लिए सबसे अच्छी जगह।',            accentColor: '#4ade80', gradient: 'linear-gradient(160deg, rgba(74,222,128,0.38) 0%, rgba(52,211,153,0.25) 100%)',   bgImage: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&q=75&fit=crop', moodValue: 4 },
  { key: 'storm_cloud' as MorningMoodKey, emoji: '🌩️', label: 'तूफानी',      doshaSignal: 'चिंतित · बिखरा हुआ · वात उच्च',    bodhiLine: 'तूफान गुजर जाएगा। आज हम धीरे-धीरे चलेंगे।',               accentColor: '#a78bfa', gradient: 'linear-gradient(160deg, rgba(167,139,250,0.38) 0%, rgba(99,102,241,0.25) 100%)',  bgImage: 'https://images.unsplash.com/photo-1504608524841-42584120d693?w=600&q=75&fit=crop', moodValue: 2 },
  { key: 'bright_sun'  as MorningMoodKey, emoji: '🔥', label: 'तीव्र',        doshaSignal: 'प्रेरित · तीव्र · पित्त उच्च',      bodhiLine: 'वह आग शक्ति है। इसे सही दिशा में लगाते हैं।',              accentColor: '#fbbf24', gradient: 'linear-gradient(160deg, rgba(251,191,36,0.42) 0%, rgba(245,158,11,0.28) 100%)',   bgImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=75&fit=crop', moodValue: 4 },
  { key: 'heavy_stone' as MorningMoodKey, emoji: '🪨', label: 'भारी',         doshaSignal: 'सुस्त · कम ऊर्जा · कफ उच्च',       bodhiLine: 'भारी सुबह जानकारी है, असफलता नहीं। आज छोटे-छोटे कदम।',    accentColor: '#94a3b8', gradient: 'linear-gradient(160deg, rgba(100,116,139,0.40) 0%, rgba(71,85,105,0.28) 100%)',   bgImage: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=600&q=75&fit=crop', moodValue: 2 },
];

const Q_HI: Record<string, { question: string; options: Record<string, string> }> = {
  digestion_today:  { question: 'आज आपका पाचन कैसा था?',         options: { sharp_clean: 'तेज और स्वच्छ', normal: 'सामान्य, कुछ असामान्य नहीं', heavy_bloated: 'भारी या फूला हुआ', burning_acid: 'जलन या एसिडिटी', gassy_irreg: 'गैस या अनियमित' } },
  appetite_morning: { question: 'आज सुबह आपकी भूख कैसी थी?',     options: { strong: 'तेज — सच में भूख लगी', mild: 'हल्की — खा भी सकता था या छोड़ भी', no_appetite: 'बिल्कुल भूख नहीं', nausea: 'जी मिचला रहा था' } },
  stool_today:      { question: 'आज मल कैसा था? (आयुर्वेद का #1 संकेत)', options: { well_formed: 'सुडौल, आसान, पूर्ण', loose: 'ढीला या पानी जैसा', hard_dry: 'कठोर, सूखा या अधूरा', skip_stool: 'यह प्रश्न छोड़ें' } },
  bloating_followup:{ question: 'क्या खाने के बाद आज भी पेट फूला रहा?', options: { yes_worse: 'हां, आज और भी बुरा', same: 'लगभग वैसा ही', bit_better: 'थोड़ा बेहतर', resolved: 'पूरी तरह ठीक' } },
  sleep_quality:    { question: 'कल रात आपकी नींद कैसी थी?',       options: { deep_restful: 'गहरी और आरामदायक', okay_not_full: 'ठीक, पर पूरी तरह तरोताजा नहीं', light_interrup: 'हल्की, बाधित, सपने', very_poor: 'बहुत खराब — सो नहीं पाया' } },
  sleep_time:       { question: 'कल रात आप कितने बजे सोए?',         options: { before_10: 'रात 10 बजे से पहले', ten_eleven: 'रात 10–11 बजे', eleven_mid: 'रात 11–12 बजे', after_mid: 'आधी रात के बाद' } },
  energy_after_sleep:{ question: 'कल की तुलना में आज सुबह ऊर्जा कैसी है?', options: { worse_energy: 'बदतर — बहुत थका हुआ', same_energy: 'लगभग उतनी ही कम', better_energy: 'थोड़ा बेहतर' } },
  energy_now:       { question: 'अभी आपकी ऊर्जा कैसी है?',           options: { vibrant: 'जीवंत और स्थिर', calm_ok: 'शांत और पर्याप्त', low_manag: 'कम पर संभाल सकता हूं', exhausted: 'थका हुआ या निढाल', scattered: 'बिखरी हुई — ऊपर-नीचे' } },
  energy_dip:       { question: 'आज आपकी ऊर्जा कब गिरी?',            options: { no_dip: 'गिरी नहीं — पूरे दिन स्थिर', after_lunch: 'दोपहर के बाद (2–3 बजे)', late_afternoon: 'देर शाम', from_morning: 'सुबह उठते ही' } },
  mental_clarity:   { question: 'आज आपकी मानसिक स्पष्टता कैसी है?', options: { sharp: 'तेज और केंद्रित', some_cloud: 'ठीक — कुछ धुंधलापन', foggy: 'धुंधला, सोचने में धीमा', scattered_m: 'बिखरा हुआ, ध्यान नहीं', overwhelmed: 'अभिभूत या चिंतित' } },
  emotions_today:   { question: 'आज आपकी भावनाएं कैसी हैं?',         options: { calm_grnd: 'शांत और स्थिर', happy_ener: 'खुश और ऊर्जावान', low_withdr: 'उदास या एकाकी', irritable: 'चिड़चिड़ा या निराश', anxious: 'चिंतित या बेचैन' } },
  body_feeling:     { question: 'शारीरिक रूप से शरीर कैसा महसूस हो रहा है?', options: { light_ener: 'हल्का और ऊर्जावान', normal_body: 'सामान्य', heavy_slug: 'भारी या सुस्त', stiff_achy: 'जोड़ों में कड़ापन या दर्द', inflamed: 'सूजन या गर्मी' } },
  skin_today:       { question: 'आज आपकी त्वचा कैसी है?',             options: { soft_clear: 'मुलायम और साफ', normal_skin: 'सामान्य', dry_rough: 'सूखी या रूखी', oily: 'तैलीय या बंद रोमछिद्र', sensitive: 'संवेदनशील या मुंहासे' } },
  tongue_morning:   { question: 'आज सुबह जीभ कैसी है? (ब्रश से पहले देखें)', options: { clean_pink: 'साफ और गुलाबी', thin_white: 'पतली सफेद परत', thick_yellow: 'मोटी पीली परत', heavy_white: 'भारी सफेद परत' } },
  weather_affect:   { question: 'आज मौसम आपको कैसे प्रभावित कर रहा है?', options: { balanced: 'बिल्कुल नहीं — संतुलित', cold_dry: 'ठंडा और सूखा — कड़ापन', hot: 'गर्म — जलन या चिड़चिड़ाहट', damp_heavy: 'नम और भारी — सुस्त' } },
  water_intake:     { question: 'आज अब तक कितना पानी पिया?',           options: { less_1: '1 गिलास से कम', two_three: '2–3 गिलास', four_six: '4–6 गिलास', seven_plus: '7 या उससे ज्यादा' } },
  vata_check:       { question: 'क्या आज मन स्थिर और ज़मीन से जुड़ा महसूस हो रहा है?', options: { grounded: 'हां — शांत और जड़ से जुड़ा', some_airy: 'कुछ हद तक — थोड़ा बेचैन', scattered_v: 'नहीं — बहुत बिखरा या चिंतित' } },
  pitta_check:      { question: 'क्या आज कोई गर्मी, जलन या सूजन महसूस हुई?', options: { no_heat: 'नहीं — शांत और ठंडा', mild_heat: 'हल्की — कुछ अधीरता', high_heat: 'हां — काफी गर्म या चिड़चिड़ा' } },
  kapha_check:      { question: 'क्या आज शरीर भारी या धीमा लग रहा है?',  options: { light: 'नहीं — हल्का और अच्छी तरह चल रहा', some_heavy: 'कुछ हद तक — और धक्के की जरूरत', very_heavy: 'हां — बहुत भारी और सुस्त' } },
};

const UI_HI = {
  header:      'दैनिक आरोग्य जांच',
  skip:        'छोड़ें',
  greeting_am: 'शुभ प्रभात',
  greeting_pm: 'नमस्कार',
  greeting_ev: 'शुभ संध्या',
  moodPrompt:  'आज आपका अंतर-उद्यान कैसा महसूस कर रहा है?',
  transitioning: 'स्वास्थ्य प्रश्नों की ओर...',
  bodhiSpeaking: 'बोधि बोल रहे हैं…',
  bodhiTag:    'बोधि · दैनिक आयुर्वेदिक जांच',
  nextBtn:     'आगे →',
  seeReading:  'मेरी रीडिंग देखें →',
  loading:     'बोधि आपके उत्तर पढ़ रहे हैं…',
  beginDay:    'मेरा दिन शुरू करें →',
  balanced:    'आज आप संतुलित हैं',
  vataHigh:    'आज वात बढ़ा हुआ है',
  pittaHigh:   'आज पित्त बढ़ा हुआ है',
  kaphaHigh:   'आज कफ बढ़ा हुआ है',
};

// ─── Mood Card Data (inline so DailyCheckIn is self-contained) ─────────────────
interface MoodCard {
  key: MorningMoodKey;
  emoji: string;
  label: string;
  doshaSignal: string;
  bodhiLine: string;
  accentColor: string;
  gradient: string;
  bgImage: string;
  moodValue: number;
}

const MOOD_CARDS: MoodCard[] = [
  {
    key: 'blooming', emoji: '🌸', label: 'Blooming',
    doshaSignal: 'Joyful · Energized · Balanced',
    bodhiLine: 'A beautiful day lives inside that feeling — let\'s honor it.',
    accentColor: '#fb923c',
    gradient: 'linear-gradient(160deg, rgba(251,146,60,0.45) 0%, rgba(244,114,182,0.30) 100%)',
    bgImage: 'https://images.unsplash.com/photo-1490750967868-88df5691cc34?w=600&q=75&fit=crop',
    moodValue: 5,
  },
  {
    key: 'gentle_leaf', emoji: '🍃', label: 'Gentle',
    doshaSignal: 'Calm · Peaceful · Vata balanced',
    bodhiLine: 'Still and clear. The best place to begin from.',
    accentColor: '#4ade80',
    gradient: 'linear-gradient(160deg, rgba(74,222,128,0.38) 0%, rgba(52,211,153,0.25) 100%)',
    bgImage: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&q=75&fit=crop',
    moodValue: 4,
  },
  {
    key: 'storm_cloud', emoji: '🌩️', label: 'Stormy',
    doshaSignal: 'Anxious · Scattered · Vata elevated',
    bodhiLine: 'The storm will pass. We move gently today.',
    accentColor: '#a78bfa',
    gradient: 'linear-gradient(160deg, rgba(167,139,250,0.38) 0%, rgba(99,102,241,0.25) 100%)',
    bgImage: 'https://images.unsplash.com/photo-1504608524841-42584120d693?w=600&q=75&fit=crop',
    moodValue: 2,
  },
  {
    key: 'bright_sun', emoji: '🔥', label: 'Intense',
    doshaSignal: 'Driven · Intense · Pitta elevated',
    bodhiLine: 'That fire is power. Let\'s channel it well.',
    accentColor: '#fbbf24',
    gradient: 'linear-gradient(160deg, rgba(251,191,36,0.42) 0%, rgba(245,158,11,0.28) 100%)',
    bgImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=75&fit=crop',
    moodValue: 4,
  },
  {
    key: 'heavy_stone', emoji: '🪨', label: 'Heavy',
    doshaSignal: 'Sluggish · Low · Kapha elevated',
    bodhiLine: 'Heavy mornings are information, not failure. Small steps today.',
    accentColor: '#94a3b8',
    gradient: 'linear-gradient(160deg, rgba(100,116,139,0.40) 0%, rgba(71,85,105,0.28) 100%)',
    bgImage: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=600&q=75&fit=crop',
    moodValue: 2,
  },
];

// ─── Props ─────────────────────────────────────────────────────────────────────
interface DailyCheckInProps {
  userName?: string;
  prakriti?: string;
  onComplete: () => void;
  onSkip: () => void;
}

// ─── Dosha Palette ─────────────────────────────────────────────────────────────
const DOSHA_PALETTE = {
  vata:    { color: '#a78bfa', glow: 'rgba(167,139,250,0.35)', bg: 'rgba(124,58,237,0.12)' },
  pitta:   { color: '#fb923c', glow: 'rgba(251,146,60,0.35)',  bg: 'rgba(194,65,12,0.12)'  },
  kapha:   { color: '#4ade80', glow: 'rgba(74,222,128,0.35)',  bg: 'rgba(21,128,61,0.12)'  },
  balanced:{ color: '#fbbf24', glow: 'rgba(251,191,36,0.35)',  bg: 'rgba(120,90,5,0.12)'   },
};

const CAT_COLOR: Record<string, string> = {
  agni: '#fb923c', sleep: '#a78bfa', energy: '#fbbf24',
  mind: '#22d3ee', body: '#4ade80', seasonal: '#60a5fa',
};

// ─── Voice lines ───────────────────────────────────────────────────────────────
function buildOpeningLine(firstName: string): string {
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${greeting}, ${firstName}. How does your inner garden feel today?`;
}

function buildTransitionLine(): string {
  return 'Good. Now let me ask you a few quick questions. Your answers help me guide you better today.';
}

// ─── Answer Option Card ────────────────────────────────────────────────────────
function OptionCard({
  option, selected, onClick,
}: { option: CheckInQuestion['options'][0]; selected: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      style={{
        width: '100%', padding: '0.9rem 1rem', borderRadius: 16,
        textAlign: 'left', cursor: 'pointer', marginBottom: '0.55rem',
        background: selected ? 'rgba(168,85,247,0.16)' : 'rgba(255,255,255,0.04)',
        border: `1.5px solid ${selected ? 'rgba(168,85,247,0.6)' : 'rgba(255,255,255,0.1)'}`,
        display: 'flex', alignItems: 'center', gap: '0.9rem',
        boxShadow: selected ? '0 0 22px rgba(168,85,247,0.14)' : 'none',
        transition: 'all 0.18s',
      }}
    >
      <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{option.emoji}</span>
      <span style={{
        fontSize: '0.92rem', fontWeight: selected ? 700 : 500,
        color: selected ? '#c084fc' : 'rgba(255,255,255,0.88)',
        fontFamily: "'Outfit', sans-serif",
      }}>{option.label}</span>
      {selected && (
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          style={{
            marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(168,85,247,0.5)', border: '2px solid rgba(168,85,247,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: '0.6rem', color: '#fff' }}>✓</span>
        </motion.div>
      )}
    </motion.button>
  );
}

// ─── Bodhi Orb ─────────────────────────────────────────────────────────────────
function BodhiOrb({ isSpeaking, muted, onMuteToggle, lang = 'en' }: {
  isSpeaking: boolean; muted: boolean; onMuteToggle: () => void; lang?: 'en' | 'hi';
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1.4rem' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {isSpeaking && !muted && (
          <>
            <motion.div animate={{ scale: [1, 1.7, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: '1.5px solid rgba(251,191,36,0.5)' }} />
            <motion.div animate={{ scale: [1, 2.2, 1], opacity: [0.22, 0, 0.22] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: 0.4 }}
              style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: '1px solid rgba(168,85,247,0.35)' }} />
          </>
        )}
        <motion.div
          animate={isSpeaking && !muted ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={{ duration: 0.6, repeat: isSpeaking && !muted ? Infinity : 0 }}
          style={{
            width: 44, height: 44, borderRadius: '50%', cursor: 'pointer',
            background: 'radial-gradient(circle at 35% 30%, rgba(251,191,36,0.6) 0%, rgba(139,92,246,0.5) 60%, transparent 100%)',
            border: '1.5px solid rgba(251,191,36,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
            boxShadow: isSpeaking && !muted ? '0 0 24px rgba(251,191,36,0.35)' : '0 0 10px rgba(139,92,246,0.2)',
          }}>✦</motion.div>
      </div>
      <div style={{ flex: 1 }}>
        {isSpeaking && !muted ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {[0, 1, 2, 3].map(i => (
              <motion.div key={i} animate={{ scaleY: [0.3, 1, 0.3] }}
                transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.1 }}
                style={{ width: 3, height: 14, borderRadius: 2, background: '#fbbf24', transformOrigin: 'bottom' }} />
            ))}
            <span style={{ fontSize: '0.68rem', color: 'rgba(251,191,36,0.7)', fontFamily: "'Outfit', sans-serif", marginLeft: 4 }}>
              {lang === 'hi' ? UI_HI.bodhiSpeaking : 'Bodhi speaking…'}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif" }}>
            {lang === 'hi' ? UI_HI.bodhiTag : 'Bodhi · Daily Ayurvedic Check-in'}
          </span>
        )}
      </div>
      <button onClick={onMuteToggle} style={{ background: 'none', border: 'none', padding: '0.25rem', cursor: 'pointer', color: muted ? 'rgba(255,255,255,0.2)' : 'rgba(251,191,36,0.55)', fontSize: '0.8rem', fontFamily: "'Outfit', sans-serif" }}>
        {muted ? '🔇' : '🔊'}
      </button>
    </div>
  );
}

// ─── Result Screen ─────────────────────────────────────────────────────────────
function ResultScreen({
  elevatedDosha, insight, isSpeaking, muted, onMuteToggle, onDone, lang = 'en',
}: {
  elevatedDosha: string; insight: string;
  isSpeaking: boolean; muted: boolean; onMuteToggle: () => void; onDone: () => void;
  lang?: 'en' | 'hi';
}) {
  const palette = DOSHA_PALETTE[elevatedDosha as keyof typeof DOSHA_PALETTE] ?? DOSHA_PALETTE.balanced;
  const doshaEmoji = { vata: '🌬️', pitta: '🔥', kapha: '🌿', balanced: '✦' };
  const doshaLabel = lang === 'hi'
    ? (elevatedDosha === 'balanced' ? UI_HI.balanced : elevatedDosha === 'vata' ? UI_HI.vataHigh : elevatedDosha === 'pitta' ? UI_HI.pittaHigh : UI_HI.kaphaHigh)
    : (elevatedDosha === 'balanced' ? 'You are balanced today' : `${elevatedDosha.charAt(0).toUpperCase() + elevatedDosha.slice(1)} elevated today`);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '1rem 0' }}>
      <motion.div
        initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.1 }}
        style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 1.2rem',
          background: `radial-gradient(circle at 38% 32%, ${palette.bg} 0%, transparent 75%)`,
          border: `2px solid ${palette.color}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', boxShadow: `0 0 36px ${palette.glow}`,
        }}>
        {doshaEmoji[elevatedDosha as keyof typeof doshaEmoji] ?? '✦'}
      </motion.div>

      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ margin: '0 0 0.4rem', fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: palette.color, fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>
        {doshaLabel}
      </motion.p>

      <BodhiOrb isSpeaking={isSpeaking} muted={muted} onMuteToggle={onMuteToggle} lang={lang} />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        style={{
          padding: '1.1rem 1.2rem', borderRadius: 18, marginBottom: '1.4rem',
          background: palette.bg, border: `1px solid ${palette.color}35`,
          textAlign: 'left',
        }}>
        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.88)', fontFamily: "'Outfit', sans-serif", fontStyle: 'italic' }}>
          &ldquo;{insight || '…'}&rdquo;
        </p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        whileTap={{ scale: 0.97 }}
        onClick={onDone}
        style={{
          width: '100%', padding: '1rem', borderRadius: 16, cursor: 'pointer',
          fontWeight: 700, fontSize: '1rem', fontFamily: "'Outfit', sans-serif",
          background: `linear-gradient(135deg, ${palette.color}55, rgba(139,92,246,0.45))`,
          border: `1px solid ${palette.color}45`, color: '#fff',
          boxShadow: `0 0 28px ${palette.glow}`,
        }}>
        {lang === 'hi' ? UI_HI.beginDay : 'Begin My Day →'}
      </motion.button>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function DailyCheckIn({ userName = 'friend', prakriti = '', onComplete, onSkip }: DailyCheckInProps) {
  const firstName = userName.split(' ')[0] || 'friend';
  const { speak, stop, isSpeaking, muted, toggleMute } = useGeminiTTS();
  const { lang } = useLanguage();
  const activeMoodCards = lang === 'hi' ? MOOD_CARDS_HI : MOOD_CARDS;

  // Always start at mood phase — gate only shows when daily check-in is pending,
  // so mood picker should always be the first screen of the unified flow.
  const [phase, setPhase] = useState<'mood' | 'questions' | 'result'>('mood');

  // Mood phase state
  const [selectedMood, setSelectedMood] = useState<MorningMoodKey | null>(null);
  const [moodBodhiLine, setMoodBodhiLine] = useState<string | null>(null);

  // Questions phase state
  const [questions, setQuestions] = useState<CheckInQuestion[]>([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Result phase state
  const [insight, setInsight] = useState('');
  const [elevatedDosha, setElevatedDosha] = useState<string>('balanced');
  const [loadingInsight, setLoadingInsight] = useState(false);

  const hasSpokenOpening = useRef(false);

  // Init questions on mount
  useEffect(() => {
    const rolling = computeRollingVikruti(7);
    setQuestions(selectTodayQuestions(rolling));
  }, []);

  // Speak opening line once
  useEffect(() => {
    if (hasSpokenOpening.current) return;
    hasSpokenOpening.current = true;
    const h = new Date().getHours();
    const hiGreet = h < 12 ? UI_HI.greeting_am : h < 17 ? UI_HI.greeting_pm : UI_HI.greeting_ev;
    const line = phase === 'mood'
      ? (lang === 'hi' ? `${hiGreet}, ${firstName}। ${UI_HI.moodPrompt}` : buildOpeningLine(firstName))
      : (lang === 'hi' ? `स्वागत है, ${firstName}। शुरू करने से पहले कुछ स्वास्थ्य प्रश्न।` : `Welcome back, ${firstName}. A few quick health questions before we begin.`);
    const t = setTimeout(() => speak(line), 700);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Speak question when step changes
  useEffect(() => {
    if (phase !== 'questions' || !questions[step]) return;
    const spokenQ = lang === 'hi'
      ? (Q_HI[questions[step].id]?.question ?? questions[step].question)
      : questions[step].question;
    const t = setTimeout(() => speak(spokenQ), 350);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, phase, lang]);

  // ── Mood selection ──────────────────────────────────────────────────────────
  const handleMoodSelect = useCallback((card: MoodCard) => {
    if (selectedMood) return;
    setSelectedMood(card.key);
    setMoodBodhiLine(card.bodhiLine);
    setMorningMoodStorage(card.key, card.moodValue);
    stop();
    // Brief pause to show Bodhi response, then slide to questions
    setTimeout(() => {
      stop();
      speak(lang === 'hi'
        ? 'अच्छा। अब मैं आपसे कुछ स्वास्थ्य प्रश्न पूछता हूं। आपके उत्तर आज मुझे आपको बेहतर मार्गदर्शन देने में मदद करेंगे।'
        : buildTransitionLine());
    }, 400);
    setTimeout(() => {
      stop();
      setPhase('questions');
      setStep(0);
    }, 2400);
  }, [selectedMood, stop, speak]);

  // ── Health question handling ────────────────────────────────────────────────
  const currentQ = questions[step];
  const qText = currentQ ? (lang === 'hi' ? (Q_HI[currentQ.id]?.question ?? currentQ.question) : currentQ.question) : '';
  const getOptLabel = (qId: string, optId: string, fallback: string) =>
    lang === 'hi' ? (Q_HI[qId]?.options[optId] ?? fallback) : fallback;
  const selectedOption = currentQ ? (answers[currentQ.id] ?? null) : null;
  const totalSteps = questions.length;
  const progressPct = totalSteps > 0 ? Math.round(((step) / totalSteps) * 100) : 0;
  const catColor = currentQ ? (CAT_COLOR[currentQ.category] ?? '#fbbf24') : '#fbbf24';

  const handleSelectOption = useCallback((qId: string, optId: string) => {
    setAnswers(prev => ({ ...prev, [qId]: optId }));
  }, []);

  const handleNext = useCallback(async () => {
    stop();
    if (step < totalSteps - 1) {
      setStep(s => s + 1);
      return;
    }
    // ── Last question answered — score + get insight ──────────────────────────
    const checkInAnswers: CheckInAnswer[] = questions.map(q => {
      const optId = answers[q.id] ?? '';
      const opt = q.options.find(o => o.id === optId);
      return { questionId: q.id, optionId: optId, score: opt?.score ?? { vata: 0, pitta: 0, kapha: 0 } };
    }).filter(a => a.optionId !== '');

    const delta = scoreAnswers(checkInAnswers);
    const today = new Date().toISOString().split('T')[0];
    const record: DailyCheckInRecord = {
      date: today, answers: checkInAnswers, skipped: false,
      completedAt: Date.now(), vikrutiDelta: delta,
    };
    saveTodayRecord(record);
    clearSkipStreak();

    const rolling = computeRollingVikruti(7);
    const dominant = getElevatedDosha(rolling);
    setElevatedDosha(dominant);
    setPhase('result');

    const keySymptoms = checkInAnswers
      .filter(a => a.score.vata > 1 || a.score.pitta > 1 || a.score.kapha > 1)
      .map(a => questions.find(q => q.id === a.questionId)?.options.find(o => o.id === a.optionId)?.label ?? '')
      .filter(Boolean).slice(0, 3);

    const todayMood = getMorningMood();

    setLoadingInsight(true);
    try {
      const res = await fetch('/api/bodhi/daily-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName, elevatedDosha: dominant,
          vikrutiVata: rolling.vata, vikrutiPitta: rolling.pitta, vikrutiKapha: rolling.kapha,
          keySymptoms, prakriti, mood: todayMood?.mood ?? '',
          lang,
        }),
      });
      const data = await res.json();
      const msg: string = data.insight ?? '';
      setInsight(msg);
      if (msg) setTimeout(() => speak(msg), 400);
    } catch {
      const fallbacks: Record<string, Record<string, string>> = {
        en: {
          vata:    `Your Vata is asking for warmth today, ${firstName}. Move gently and eat something nourishing.`,
          pitta:   `Some heat in the system today — let your practices cool things down, ${firstName}.`,
          kapha:   `The body wants to move, ${firstName}. Even one brisk action will shift the heaviness.`,
          balanced:`You're in good balance today, ${firstName}. Keep this rhythm alive.`,
        },
        hi: {
          vata:    `${firstName}, आज वात शांति मांग रहा है। गर्म और पोषक भोजन लें, धीरे चलें।`,
          pitta:   `${firstName}, आज थोड़ी गर्मी है तंत्र में — ठंडे पानी से चेहरा धोएं और गहरी सांस लें।`,
          kapha:   `${firstName}, शरीर हिलना चाहता है — एक छोटा सा कदम भी भारीपन को हटा देगा।`,
          balanced:`${firstName}, आज आप संतुलित हैं। इस लय को बनाए रखें — यही आपकी ताकत है।`,
        },
      };
      const langFallbacks = fallbacks[lang] ?? fallbacks.en;
      const fb = langFallbacks[dominant] ?? langFallbacks.balanced;
      setInsight(fb);
      setTimeout(() => speak(fb), 400);
    } finally {
      setLoadingInsight(false);
    }
  }, [step, totalSteps, questions, answers, stop, speak, userName, firstName, prakriti]);

  // ── Skip ────────────────────────────────────────────────────────────────────
  const handleSkip = useCallback(() => {
    stop();
    // Save mood as gentle if not yet picked
    if (!getMorningMood()) setMorningMoodStorage('gentle_leaf', 4);
    const { shouldNudge } = recordSkip();
    if (shouldNudge) {
      fetch('/api/bodhi/daily-checkin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName, skipNudge: true, lang }),
      }).then(r => r.json()).then(data => { if (data.insight) speak(data.insight); }).catch(() => {});
    }
    onSkip();
  }, [stop, speak, userName, onSkip]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'linear-gradient(160deg, #060410 0%, #0a0a1a 45%, #040d08 100%)',
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* Ambient glow */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 20% 10%, rgba(139,92,246,0.09) 0%, transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(251,191,36,0.07) 0%, transparent 55%)' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, width: '100%', margin: '0 auto', padding: '0 1.1rem calc(env(safe-area-inset-bottom, 0px) + 96px)', display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>

        {/* ── Sticky header ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 'max(env(safe-area-inset-top), 1rem)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1rem' }}>🌿</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              {lang === 'hi' ? UI_HI.header : 'Daily Ārogya Check-in'}
            </span>
          </div>
          {/* Step counter for questions */}
          {phase === 'questions' && (
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)' }}>
              {step + 1} / {totalSteps}
            </span>
          )}
          {/* Skip button — always visible except result */}
          {phase !== 'result' && (
            <button onClick={handleSkip} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.22)', fontSize: '0.7rem', padding: '0.3rem 0.5rem' }}>
              {lang === 'hi' ? UI_HI.skip : 'Skip'}
            </button>
          )}
        </div>

        {/* ── Progress bar (questions only) ─────────────────────────────────── */}
        {phase === 'questions' && (
          <div style={{ marginBottom: '1.2rem' }}>
            <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <motion.div animate={{ width: `${progressPct}%` }} transition={{ duration: 0.4 }}
                style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${catColor}, rgba(139,92,246,0.7))` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.3rem' }}>
              <span style={{ fontSize: '0.6rem', color: catColor, fontWeight: 700 }}>
                {currentQ?.category?.toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* ── Phase content ──────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">

          {/* ── MOOD PHASE — Nature cards ──────────────────────────────────── */}
          {phase === 'mood' && (
            <motion.div key="mood"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '0.5rem' }}>

              {/* Bodhi orb + greeting */}
              <BodhiOrb isSpeaking={isSpeaking} muted={muted} onMuteToggle={toggleMute} lang={lang} />

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
                style={{ textAlign: 'center', marginBottom: '1.6rem' }}>
                <p style={{ margin: '0 0 0.3rem', fontSize: '1.2rem', fontWeight: 900, color: 'rgba(255,255,255,0.92)', lineHeight: 1.3 }}>
                  {(() => { const h = new Date().getHours(); return lang === 'hi' ? (h < 12 ? UI_HI.greeting_am : h < 17 ? UI_HI.greeting_pm : UI_HI.greeting_ev) : (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'); })()}, {firstName} 🙏
                </p>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'rgba(255,255,255,0.42)', fontStyle: 'italic' }}>
                  {lang === 'hi' ? UI_HI.moodPrompt : 'How does your inner garden feel today?'}
                </p>
              </motion.div>

              {/* 5 nature cards */}
              <div style={{ display: 'flex', gap: '0.45rem', width: '100%', justifyContent: 'center', marginBottom: '1.2rem' }}>
                {activeMoodCards.map((card, i) => {
                  const isSelected = selectedMood === card.key;
                  const isDimmed = selectedMood !== null && !isSelected;
                  return (
                    <motion.button key={card.key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: isDimmed ? 0.35 : 1, y: 0, scale: isSelected ? 1.06 : 1 }}
                      transition={{ delay: 0.32 + i * 0.055, duration: isSelected ? 0.28 : 0.42, ease: [0.22, 1, 0.36, 1] }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => handleMoodSelect(card)}
                      style={{
                        position: 'relative', overflow: 'hidden', borderRadius: 18,
                        border: 'none', cursor: 'pointer', background: 'transparent', padding: 0,
                        flex: 1, aspectRatio: '0.6',
                        outline: `2px solid ${isSelected ? card.accentColor : 'transparent'}`,
                        outlineOffset: isSelected ? 3 : 0,
                        boxShadow: isSelected ? `0 0 28px ${card.accentColor}55, 0 6px 20px rgba(0,0,0,0.5)` : '0 3px 14px rgba(0,0,0,0.4)',
                      }}>
                      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url('${card.bgImage}')`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.58) saturate(1.15)' }} />
                      <div style={{ position: 'absolute', inset: 0, background: card.gradient }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(4,2,16,0.75) 0%, transparent 55%)' }} />
                      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', padding: '0.5rem 0.25rem 0.6rem' }}>
                        <motion.span animate={isSelected ? { scale: [1, 1.28, 1.1] } : {}} transition={{ duration: 0.42 }}
                          style={{ fontSize: '1.55rem', marginBottom: '0.22rem', filter: isSelected ? `drop-shadow(0 0 8px ${card.accentColor})` : 'none' }}>
                          {card.emoji}
                        </motion.span>
                        <span style={{ fontSize: '0.58rem', fontWeight: 700, color: isSelected ? card.accentColor : 'rgba(255,255,255,0.78)', textAlign: 'center', lineHeight: 1.2, textShadow: '0 1px 4px rgba(0,0,0,0.6)', transition: 'color 0.22s' }}>
                          {card.label}
                        </span>
                      </div>
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                            style={{ position: 'absolute', top: 6, right: 6, width: 17, height: 17, borderRadius: '50%', background: card.accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '0.5rem', color: '#000', fontWeight: 900 }}>✓</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </div>

              {/* Bodhi one-liner after selection */}
              <AnimatePresence>
                {moodBodhiLine && (
                  <motion.div initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                    style={{ padding: '0.85rem 1.1rem', borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', textAlign: 'center', backdropFilter: 'blur(10px)', marginBottom: '0.8rem' }}>
                    <p style={{ margin: '0 0 0.25rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.84)', fontStyle: 'italic', lineHeight: 1.6 }}>"{moodBodhiLine}"</p>
                    <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>— Bodhi</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dosha signal */}
              <AnimatePresence>
                {selectedMood && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    style={{ margin: '0 0 0.5rem', fontSize: '0.62rem', color: MOOD_CARDS.find(c => c.key === selectedMood)?.accentColor ?? 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', textAlign: 'center' }}>
                    {MOOD_CARDS.find(c => c.key === selectedMood)?.doshaSignal}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Transitioning hint */}
              {selectedMood && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                  style={{ textAlign: 'center', marginTop: '0.3rem' }}>
                  <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.28)' }}>
                    {lang === 'hi' ? UI_HI.transitioning : 'Moving to health questions…'}
                  </span>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── QUESTIONS PHASE ─────────────────────────────────────────────── */}
          {phase === 'questions' && currentQ && (
            <motion.div key={`q-${step}`}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.26 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

              <BodhiOrb isSpeaking={isSpeaking} muted={muted} onMuteToggle={toggleMute} lang={lang} />

              <div style={{ marginBottom: '1.3rem' }}>
                <span style={{ fontSize: '2rem' }}>{currentQ.emoji}</span>
                <h2 style={{ margin: '0.5rem 0 0', fontSize: '1.1rem', fontWeight: 800, color: '#fff', lineHeight: 1.35 }}>
                  {qText}
                </h2>
              </div>

              <div style={{ flex: 1 }}>
                {currentQ.options.map(opt => (
                  <OptionCard
                    key={opt.id}
                    option={{ ...opt, label: getOptLabel(currentQ.id, opt.id, opt.label) }}
                    selected={selectedOption === opt.id}
                    onClick={() => handleSelectOption(currentQ.id, opt.id)}
                  />
                ))}
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={handleNext} disabled={!selectedOption}
                style={{
                  width: '100%', marginTop: '1rem', padding: '0.95rem', borderRadius: 16,
                  cursor: selectedOption ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '0.95rem',
                  background: selectedOption ? `linear-gradient(135deg, ${catColor}55, rgba(139,92,246,0.45))` : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${selectedOption ? catColor + '45' : 'rgba(255,255,255,0.1)'}`,
                  color: selectedOption ? '#fff' : 'rgba(255,255,255,0.3)', transition: 'all 0.2s',
                }}>
                {step < totalSteps - 1 ? (lang === 'hi' ? UI_HI.nextBtn : 'Next →') : (lang === 'hi' ? UI_HI.seeReading : 'See My Reading →')}
              </motion.button>
            </motion.div>
          )}

          {/* ── RESULT PHASE ────────────────────────────────────────────────── */}
          {phase === 'result' && (
            <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {loadingInsight ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', paddingTop: '3rem' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(251,191,36,0.3)', borderTop: '2px solid #fbbf24' }} />
                  <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>
                    {lang === 'hi' ? UI_HI.loading : 'Bodhi is reading your answers…'}
                  </span>
                </div>
              ) : (
                <ResultScreen elevatedDosha={elevatedDosha} insight={insight}
                  isSpeaking={isSpeaking} muted={muted} onMuteToggle={toggleMute} onDone={onComplete} lang={lang} />
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
}
