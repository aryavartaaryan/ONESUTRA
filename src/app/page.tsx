'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import HeroSection from '@/components/HomePage/HeroSection';
import ConsciousGateway from '@/components/HomePage/ConsciousGateway';
import AuthModal from '@/components/HomePage/AuthModal';
import GayatriMantraSection from '@/components/GayatriMantraSection/GayatriMantraSection';
import VoiceCallModal from '@/components/VoiceCallModal';
import WisdomTicker from '@/components/Dashboard/WisdomTicker';
import AbountModal from '@/components/Dashboard/AboutModal';
import UserProfile from '@/components/Dashboard/UserProfile';
import SacredPortalGrid from '@/components/HomePage/SacredPortalGrid';
import ConsciousManifesto from '@/components/HomePage/ConsciousManifesto';
import SacredCanvas from '@/components/SacredCanvas/SacredCanvas';
import SakhaBodhiOrb from '@/components/Dashboard/SakhaBodhiOrb';

import EphemeralGreeting from '@/components/HomePage/EphemeralGreeting';
import StickyTopNav from '@/components/HomePage/StickyTopNav';
import StickyFeedbackButton from '@/components/StickyFeedbackButton';
import MagicSyncModule from '@/components/Dashboard/MagicSyncModule';

import BrahmastraFocusCard from '@/components/Dashboard/BrahmastraFocusCard';
import UpgradeDonateCard from '@/components/Dashboard/UpgradeDonateCard';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';
import { useOneSutraAuth } from '@/hooks/useOneSutraAuth';
import { useDailyTasks } from '@/hooks/useDailyTasks';
import { useEnergyProtector } from '@/hooks/useEnergyProtector';
import { useBrahmastraState } from '@/hooks/useBrahmastraState';

import { useLanguage } from '@/context/LanguageContext';
import homeStyles from './vedic-home.module.css';
import dashStyles from './dashboard.module.css';
import styles from './page.module.css';
import sakhaStyles from '@/components/Dashboard/SakhaBodhiOrb.module.css';

// ─── Greeting helpers ─────────────────────────────────────────────────────────
function buildGreeting(lang: 'en' | 'hi', h: number) {
  const isNight = h < 3 || h >= 21;
  const en = isNight
    ? { emoji: '🌙', text: 'Shubh Ratri', period: 'Night Blessings' }
    : h < 12
      ? { emoji: '🙏', text: 'Shubhodaya', period: 'Morning Blessings' }
      : h < 16
        ? { emoji: '☀️', text: 'Shubh Madhyahna', period: 'Midday Blessings' }
        : { emoji: '🪔', text: 'Shubh Sandhya', period: 'Evening Blessings' };

  const hi = isNight
    ? { emoji: '🌙', text: 'शुभ रात्रि', period: 'रात्रि विश्राम' }
    : h < 12
      ? { emoji: '🙏', text: 'शुभोदय', period: 'शुभ प्रभात' }
      : h < 16
        ? { emoji: '☀️', text: 'शुभ मध्याह्न', period: 'मध्याह्न वंदना' }
        : { emoji: '🪔', text: 'शुभ सन्ध्या', period: 'सन्ध्या वंदना' };

  return lang === 'hi' ? hi : en;
}

const easeIO = 'easeInOut' as const;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.7, ease: easeIO },
});

// ─── Panchang helpers ─────────────────────────────────────────────────────────
const VARA_EN = ['Ravivāra', 'Somavāra', 'Maṅgalavāra', 'Budhavāra', 'Guruvāra', 'Śukravāra', 'Śanivāra'];
const PAKSHA_EN = ['Śukla Pakṣa', 'Kṛṣṇa Pakṣa'];
const TITHI_EN = [
  'Pratipada', 'Dvitīyā', 'Tṛtīyā', 'Caturthī', 'Pañcamī', 'Ṣaṣṭhī', 'Saptamī',
  'Aṣṭamī', 'Navamī', 'Daśamī', 'Ekādaśī', 'Dvādaśī', 'Trayodaśī', 'Caturdaśī', 'Pūrṇimā',
];
const VARA_HI = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
const PAKSHA_HI = ['शुक्ल पक्ष', 'कृष्ण पक्ष'];
const TITHI_HI = [
  'प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पञ्चमी', 'षष्ठी', 'सप्तमी',
  'अष्टमी', 'नवमी', 'दशमी', 'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'पूर्णिमा',
];

function getLunarInfo(date: Date) {
  const newMoon = new Date('2000-01-06T18:14:00Z').getTime();
  const lunation = 29.53058867 * 86400000;
  const age = ((date.getTime() - newMoon) % lunation + lunation) % lunation;
  const idx = Math.floor((age / lunation) * 30);
  return { paksha: idx >= 15 ? 1 : 0, tithi: idx % 15 };
}

function fmt12h(h: number, m: number) {
  const p = h >= 12 ? 'PM' : 'AM';
  return { time: `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')}`, period: p };
}



export default function Home() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const { user } = useOneSutraAuth();
  const userName = user?.name || null;
  const [userId, setUserId] = useState<string | null>(null); // Firebase UID for greeting dedup
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSakhaActive, setIsSakhaActive] = useState(false);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [showBreakNotice, setShowBreakNotice] = useState(false);

  const brahmastraState = useBrahmastraState(userId);

  useEnergyProtector({
    enabled: hasStarted,
    onBreakSuggested: () => {
      setShowBreakNotice(true);
      unlockAudio();
      setIsSakhaActive(true);
    },
    voiceInterrupt: true,
  });

  useEffect(() => {
    if (!showBreakNotice) return;
    const t = setTimeout(() => setShowBreakNotice(false), 10000);
    return () => clearTimeout(t);
  }, [showBreakNotice]);



  // ── Audio Unlock (satisfies browser autoplay gate on first gesture) ────────
  const unlockAudio = () => {
    if (isAudioUnlocked || typeof window === 'undefined') return;
    try {
      const utterance = new SpeechSynthesisUtterance('');
      utterance.volume = 0;
      window.speechSynthesis.speak(utterance);
    } catch (_) { /* noop — unlocking best-effort */ }
    setIsAudioUnlocked(true);
  };
  const [greeting, setGreeting] = useState<{ emoji: string; text: string; period: string } | null>(null);
  const { lang, toggleLanguage } = useLanguage();

  // ── useTimeOfDay (unconditional — Rules of Hooks) ────────────────────────────
  const tod = useTimeOfDay();
  // TRUE during morning (5-11) and evening (17-21) — meditation / focus hours
  const isMeditationHour = tod.period === 'morning' || tod.period === 'evening';

  // ── Curated landscape-only image pools (no portraits, no single subjects) ────
  const BG_POOLS: Record<string, string[]> = {
    morning: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=80', // misty mountain range
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1400&q=80', // mountain lake at dawn
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1400&q=80', // sunrise forest
    ],
    noon: [
      'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1400&q=80', // aerial valley & meadow
      'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=1400&q=80', // sunlit mountain stream
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1400&q=80', // enchanted woodland
    ],
    evening: [
      'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=1400&q=80', // dramatic sunset coast
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1400&q=80', // golden hour canyon
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1400&q=80', // sunset mountain silhouette
    ],
    night: [
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1400&q=80', // milky way mountains
      'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=1400&q=80', // starry night sky
      'https://images.unsplash.com/photo-1475274047050-1d0c0975f9f1?w=1400&q=80', // night lake reflection
    ],
  };
  const slot = Math.floor(Date.now() / (30 * 60_000));
  const pool = BG_POOLS[tod.period] ?? BG_POOLS.morning;
  const globalBg = pool[slot % pool.length];


  // ── Sankalpa/Mission state — unified via Firebase ───────────────
  const { tasks: sankalpaItems, addTask, updateTask, toggleTaskDone, removeTask } = useDailyTasks();



  useEffect(() => {
    const started = localStorage.getItem('pranav_has_started');
    const stored = localStorage.getItem('vedic_user_name');
    if (started === 'true' || stored) setHasStarted(true);
    setIsLoading(false);

    // ── Fetch Firebase UID for greeting deduplication ────────────────────────
    Promise.all([
      import('@/lib/firebase'),
      import('firebase/auth'),
    ]).then(([{ getFirebaseAuth }, { onAuthStateChanged }]) => {
      getFirebaseAuth().then(auth => {
        onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser) setUserId(firebaseUser.uid);
        });
      });
    }).catch(() => { /* Firebase not available in ssr */ });
  }, []);

  // Auto-dismiss splash after 12 seconds (handled inside the component itself)


  useEffect(() => {
    const handler = () => setIsAboutOpen(true);
    window.addEventListener('openAboutModal', handler);
    return () => window.removeEventListener('openAboutModal', handler);
  }, []);

  useEffect(() => {
    const handler = () => setIsProfileOpen(true);
    window.addEventListener('openProfileModal', handler);
    return () => window.removeEventListener('openProfileModal', handler);
  }, []);

  useEffect(() => {
    setGreeting(buildGreeting(lang, new Date().getHours()));
  }, [lang]);

  useEffect(() => {
    if (hasStarted) {
      document.documentElement.classList.add('app-zoomed');
    } else {
      document.documentElement.classList.remove('app-zoomed');
    }
  }, [hasStarted]);

  const handleBeginJourney = () => { localStorage.setItem('pranav_has_started', 'true'); setHasStarted(true); };
  const handleAuthSuccess = (name: string) => { handleBeginJourney(); };
  const displayName = userName || 'Traveller';

  if (isLoading) return null;

  // ── Conscious OS Gateway ─────────────────────────────────────────────────────
  if (!hasStarted) return (
    <ConsciousGateway
      onSuccess={(name: string) => handleAuthSuccess(name)}
      onGuest={handleBeginJourney}
    />
  );

  // ── Grounding Pad Dashboard ──────────────────────────────────────────────
  return (
    <>
      {/* 3-second cinematic entrance overlay — shown only once per user per day */}
      <EphemeralGreeting displayName={displayName} userId={userId} />

      {/* Fixed full-page circadian nature background — Pranaverse-style time-based */}
      <div
        key={globalBg}
        style={{
          position: 'fixed', inset: 0, zIndex: -10,
          backgroundImage: `url(${globalBg})`,
          backgroundSize: 'cover', backgroundPosition: 'center top',
          animation: 'bgFadeIn 1.8s ease forwards',
        }}
        aria-hidden
      />
      {/* Cinematic dark vignette overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: -9,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.20) 35%, rgba(0,0,0,0.50) 100%)',
        pointerEvents: 'none',
      }} aria-hidden />
      <style>{`
        @keyframes bgFadeIn {
          from { opacity: 0; transform: scale(1.04); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <main className={dashStyles.dashboardPage} style={{ position: 'relative', zIndex: 2, background: 'transparent' }}>

        {showBreakNotice && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            style={{
              position: 'fixed',
              top: 14,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1200,
              padding: '10px 14px',
              borderRadius: 999,
              background: 'rgba(18, 37, 31, 0.92)',
              border: '1px solid rgba(252, 201, 120, 0.35)',
              color: 'rgba(255, 241, 214, 0.96)',
              fontSize: 13,
              letterSpacing: '0.02em',
              boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
              backdropFilter: 'blur(6px)',
            }}
          >
            Energy Protector: 2-hour focus complete. Sakha recommends a mindful 5-minute break.
          </motion.div>
        )}

        {/* ══ FIXED TOP NAV ══ */}
        <StickyTopNav />

        {/* ══ Advanced Protocol + SAMKALP — Merged when active ══ */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            marginTop: '0.65rem',
            position: 'relative',
            ...(brahmastraState.active ? {
              background: 'linear-gradient(180deg,rgba(255,80,10,0.06) 0%,transparent 40%)',
              borderRadius: '1.4rem',
              border: '1px solid rgba(255,100,30,0.15)',
              padding: '0.5rem 0 0.5rem',
              boxShadow: '0 0 40px rgba(255,80,10,0.08)',
            } : {}),
          }}
        >
          <BrahmastraFocusCard
            active={brahmastraState.active}
            focusWindowMinutes={brahmastraState.focusWindowMinutes}
            impactedMeetings={brahmastraState.impactedMeetings}
            subtitle={
              brahmastraState.reason
                ? `Current mantra: ${brahmastraState.reason}`
                : 'Silence the noise. Guard the inner fire.'
            }
          />

          <div style={{ marginTop: brahmastraState.active ? '0.35rem' : '0.8rem' }}>
            <MagicSyncModule
              items={sankalpaItems}
              onToggle={toggleTaskDone}
              onRemove={removeTask}
              onAdd={addTask}
              onUpdate={updateTask}
            />
          </div>
        </motion.div>


        <div className={dashStyles.dashboardGrid}>

          {/* LEFT SIDEBAR */}
          <aside className={dashStyles.sidebarLeft}>
            <motion.div {...fadeUp(0.22)}><WisdomTicker /></motion.div>
          </aside>

          {/* CENTER FEED */}
          <div className={dashStyles.feedCenter}>

            {/* Sacred Portal Grid */}
            <SacredPortalGrid />

            {/* Conscious OS Manifesto — philosophical bridge */}
            <ConsciousManifesto />

            {/* Gayatri Mantra section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.7, ease: easeIO }}
            >
              <GayatriMantraSection />
            </motion.div>
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className={dashStyles.sidebarRight}>
            <UpgradeDonateCard />
          </aside>
        </div>

      </main>

      {/* ══ SAKHA BODHI — "Pranic Spark" Floating Trigger ══ */}
      <AnimatePresence>
        {!isSakhaActive && (
          <motion.div
            key="sakha-trigger"
            style={{ position: 'fixed', bottom: 90, right: 22, zIndex: 1000 }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.3 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          >
            {/* Label */}
            <motion.span
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', bottom: '108%', left: '50%',
                transform: 'translateX(-50%)', marginBottom: 4,
                fontSize: 8, fontWeight: 800, letterSpacing: '0.18em',
                textTransform: 'uppercase',
                background: 'linear-gradient(90deg, #22d3ee, #a78bfa, #22d3ee)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                fontFamily: 'system-ui, sans-serif', whiteSpace: 'nowrap',
                pointerEvents: 'none',
                filter: 'drop-shadow(0 1px 4px rgba(34,211,238,0.55))',
              }}>Sakha Bodhi</motion.span>

            {/* Outer cosmic radiation */}
            <motion.div
              animate={{ scale: [1, 1.32, 1], opacity: [0.28, 0.10, 0.28] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', inset: -20, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(34,211,238,0.38) 0%, rgba(139,92,246,0.20) 50%, transparent 78%)',
                filter: 'blur(12px)', pointerEvents: 'none', willChange: 'transform, opacity',
              }}
            />

            {/* Mid rotating sacred geometry ring */}
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute', inset: -7, borderRadius: '50%',
                border: '1px dashed rgba(251,191,36,0.5)', pointerEvents: 'none', willChange: 'transform',
              }}
            />

            {/* Inner soft violet-teal aura */}
            <motion.div
              animate={{ scale: [1, 1.10, 1], opacity: [0.7, 0.28, 0.7] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              style={{
                position: 'absolute', inset: -4, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(139,92,246,0.30) 0%, rgba(34,211,238,0.22) 60%, transparent 85%)',
                filter: 'blur(5px)', pointerEvents: 'none', willChange: 'transform, opacity',
              }}
            />

            {/* Three orbiting energy particles */}
            {([0, 120, 240] as number[]).map((deg, i) => (
              <motion.div
                key={i}
                animate={{ rotate: [deg, deg + 360] }}
                transition={{ duration: 5 + i * 0.7, repeat: Infinity, ease: 'linear' }}
                style={{ position: 'absolute', inset: -14, borderRadius: '50%', pointerEvents: 'none', willChange: 'transform' }}
              >
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  width: 4, height: 4, borderRadius: '50%',
                  background: i === 0 ? '#fbbf24' : i === 1 ? '#22d3ee' : '#a78bfa',
                  boxShadow: `0 0 7px ${i === 0 ? '#fbbf24' : i === 1 ? '#22d3ee' : '#a78bfa'}`,
                  transform: 'translate(-50%, -50%) translateX(34px)',
                }} />
              </motion.div>
            ))}

            {/* Core button — Sakha Bodhi as meditating cosmic figure */}
            <motion.button
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
              onClick={() => { unlockAudio(); setIsSakhaActive(true); }}
              aria-label="Open Sakha Bodhi AI companion"
              title="Awaken Sakha Bodhi — Your Cosmic Companion"
              style={{
                width: 62, height: 62, borderRadius: '50%',
                border: '1.5px solid rgba(34,211,238,0.52)',
                background: 'radial-gradient(circle at 38% 30%, rgba(120,200,255,0.22) 0%, rgba(18,28,95,0.92) 45%, rgba(4,7,38,0.97) 100%)',
                boxShadow: '0 0 0 1px rgba(34,211,238,0.18), 0 6px 28px rgba(14,116,144,0.55), 0 0 48px rgba(34,211,238,0.20), inset 0 1px 0 rgba(255,255,255,0.18)',
                cursor: 'pointer', position: 'relative',
                backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              }}
            >
              {/* Inner radiance pulse */}
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.7, 1.1, 0.7] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'radial-gradient(circle at center, rgba(139,92,246,0.45) 0%, rgba(34,211,238,0.18) 55%, transparent 80%)',
                  pointerEvents: 'none',
                }}
              />
              {/* Meditating Sakha Bodhi — SVG yogi figure */}
              <svg width="38" height="42" viewBox="0 0 40 44" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'relative', zIndex: 2 }}>
                {/* Divine halo */}
                <circle cx="20" cy="12" r="9.5" fill="rgba(255,215,0,0.07)" />
                <circle cx="20" cy="12" r="7.5" fill="none" stroke="rgba(255,215,0,0.38)" strokeWidth="0.7" strokeDasharray="2.5 1.5" />
                {/* Head */}
                <circle cx="20" cy="12" r="5" fill="rgba(220,245,255,0.95)" />
                {/* Ajna — third eye chakra */}
                <ellipse cx="20" cy="10.8" rx="1.5" ry="0.9" fill="#FFD700" />
                <circle cx="20" cy="10.8" r="0.55" fill="rgba(255,255,255,0.95)" />
                {/* Neck */}
                <rect x="17.8" y="17" width="4.4" height="2.8" rx="1.5" fill="rgba(210,240,255,0.88)" />
                {/* Torso */}
                <path d="M 14 30 L 15.5 20 Q 20 18.5 24.5 20 L 26 30 Z" fill="rgba(190,230,255,0.88)" />
                {/* Left arm to knee */}
                <path d="M 15.5 24 Q 12 26.5 11 30" stroke="rgba(190,230,255,0.88)" strokeWidth="2.8" strokeLinecap="round" fill="none" />
                <circle cx="11" cy="30" r="2.3" fill="rgba(190,230,255,0.78)" />
                {/* Right arm to knee */}
                <path d="M 24.5 24 Q 28 26.5 29 30" stroke="rgba(190,230,255,0.88)" strokeWidth="2.8" strokeLinecap="round" fill="none" />
                <circle cx="29" cy="30" r="2.3" fill="rgba(190,230,255,0.78)" />
                {/* Lotus seated legs */}
                <path d="M 7 37 Q 13 32.5 20 33.5 Q 27 32.5 33 37 Q 30 41.5 20 42 Q 10 41.5 7 37 Z" fill="rgba(170,220,255,0.82)" />
                {/* Sushumna nadi — spine channel */}
                <line x1="20" y1="19.5" x2="20" y2="30" stroke="rgba(100,220,255,0.45)" strokeWidth="0.7" />
                {/* Anahata — heart chakra */}
                <circle cx="20" cy="23.5" r="1.1" fill="rgba(100,220,255,0.9)" />
                {/* Sahasrara — crown glow */}
                <circle cx="20" cy="7" r="1.8" fill="rgba(167,139,250,0.55)" />
              </svg>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ SAKHA BODHI — Orb Overlay ══ */}
      <AnimatePresence>
        {isSakhaActive && (
          <SakhaBodhiOrb
            key="sakha-orb"
            userName={displayName || 'Mitra'}
            userId={userId}
            sankalpaItems={sankalpaItems}
            // onSankalpaUpdate is a no-op: Firestore onSnapshot (via useDailyTasks) is the
            // single source of truth. All writes go exclusively through onAddTask / onRemoveTask.
            onSankalpaUpdate={() => { }}
            onAddTask={addTask}
            onRemoveTask={removeTask}
            onDismiss={() => setIsSakhaActive(false)}
          />
        )}
      </AnimatePresence>

      {/* MODALS */}
      <VoiceCallModal isOpen={isCallModalOpen} onClose={() => setIsCallModalOpen(false)} />
      <AbountModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <UserProfile isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} userName={userName} />

      {/* Sticky Feedback Button */}
      <StickyFeedbackButton />

      {/* ══ HOME BOTTOM NAV BAR ══ */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0.55rem 0.5rem calc(0.55rem + env(safe-area-inset-bottom))', background: 'rgba(6,3,18,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {([
          { id: 'home', emoji: '⌂', label: 'Home', href: null },
          { id: 'feed', emoji: '✦', label: 'Feed', href: '/pranaverse' },
          { id: 'map', emoji: '🗺️', label: 'Map', href: '/pranaverse?tab=map' },
          { id: 'chat', emoji: '💬', label: 'Chat', href: '/pranaverse-chat' },
        ] as const).map(item => {
          const active = item.id === 'home';
          return (
            <motion.button key={item.id} whileTap={{ scale: 0.9 }}
              onClick={() => { if (item.href) window.location.href = item.href; }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: item.href ? 'pointer' : 'default', padding: '0.3rem 0.8rem' }}>
              <span style={{ fontSize: '1.15rem', filter: active ? 'drop-shadow(0 0 6px #a78bfa)' : 'none', opacity: active ? 1 : 0.45 }}>{item.emoji}</span>
              <span style={{ fontSize: '0.42rem', fontWeight: 700, color: active ? '#a78bfa' : 'rgba(255,255,255,0.35)', fontFamily: "'Outfit',sans-serif", letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.label}</span>
            </motion.button>
          );
        })}
      </nav>
    </>
  );
}
