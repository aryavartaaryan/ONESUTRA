'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, ImageIcon, Flame, Leaf, AlertTriangle, ChevronRight, Share2, RefreshCw } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface MealAnalysis {
  meal_identified: string;
  confidence: number;
  sattvic_score: number;
  agni_assessment: {
    impact: string;
    explanation: string;
  };
  shad_rasa: {
    madhura: { presence: string; note: string };
    amla: { presence: string; note: string };
    lavana: { presence: string; note: string };
    katu: { presence: string; note: string };
    tikta: { presence: string; note: string };
    kashaya: { presence: string; note: string };
    rasa_balance_insight: string;
  };
  dosha_impact: {
    vata: { effect: string; percentage: number; reasoning: string };
    pitta: { effect: string; percentage: number; reasoning: string };
    kapha: { effect: string; percentage: number; reasoning: string };
  };
  prakriti_compatibility: {
    overall_score: number;
    vata_score: number;
    pitta_score: number;
    kapha_score: number;
    summary: string;
  };
  guna_analysis: {
    dominant_guna: string;
    sattvic_elements: string[];
    rajasic_elements: string[];
    tamasic_elements: string[];
  };
  timing_analysis: {
    kala_alignment: string;
    reasoning: string;
    ritu_alignment: string;
    hunger_comment: string;
  };
  viruddha_ahara_check: {
    incompatibilities_found: boolean;
    items: string[];
  };
  insights: Array<{
    type: 'positive' | 'warning' | 'negative';
    title: string;
    body: string;
  }>;
  after_meal_protocol: string[];
  avoid_next_meal: string[];
  sakha_message: string;
}

export interface MealAnalyzeTrigger {
  mealId: string;
  mealLabel: string;
  mealEmoji: string;
  mealDetail: string;
  mealType: string; // 'Breakfast' | 'Lunch' | 'Dinner'
}

interface Props {
  trigger: MealAnalyzeTrigger;
  onClose: () => void;
  userId?: string;
  userName?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getSeason(): string {
  const m = new Date().getMonth() + 1;
  if (m <= 2)  return 'Shishira (Late Winter)';
  if (m <= 4)  return 'Vasanta (Spring)';
  if (m <= 6)  return 'Grishma (Summer)';
  if (m <= 8)  return 'Varsha (Monsoon)';
  if (m <= 10) return 'Sharad (Autumn)';
  return 'Hemanta (Early Winter)';
}

function getKala(): string {
  const h = new Date().getHours();
  if (h >= 6  && h < 10)  return 'Kapha Kala (6–10 AM)';
  if (h >= 10 && h < 14)  return 'Pitta Kala (10 AM–2 PM)';
  if (h >= 14 && h < 18)  return 'Vata Kala (2–6 PM)';
  if (h >= 18 && h < 22)  return 'Kapha Kala (6–10 PM)';
  if (h >= 22 || h < 2)   return 'Pitta Kala (10 PM–2 AM)';
  return 'Vata Kala (2–6 AM)';
}

function getTimestamp(): string {
  return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date());
}

function getPrakriti(): string {
  try {
    const d = JSON.parse(localStorage.getItem('onesutra_dosha_v1') ?? '{}');
    return d?.prakritiAssessment?.prakriti?.combo ?? d?.prakritiAssessment?.prakriti?.primary ?? 'Not assessed';
  } catch { return 'Not assessed'; }
}

async function compressImage(file: File, maxDim = 1024): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function saveMealAnalysisLocally(mealType: string, analysis: MealAnalysis, imageDataUrl: string) {
  try {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    const key = 'onesutra_meal_analysis_v1';
    const raw = JSON.parse(localStorage.getItem(key) ?? '{}');
    if (raw.date !== today) { raw.date = today; raw.meals = {}; }
    if (!raw.meals) raw.meals = {};
    const mealKey = mealType.toLowerCase();
    raw.meals[mealKey] = { analysis, imageDataUrl, analyzedAt: Date.now() };
    localStorage.setItem(key, JSON.stringify(raw));
    window.dispatchEvent(new CustomEvent('meal-analysis-updated'));
  } catch { /* ignore */ }
}

// ─── Colour maps ──────────────────────────────────────────────────────────────
const DOSHA_COLORS = { vata: '#818cf8', pitta: '#fb923c', kapha: '#4ade80' };
const AGNI_COLORS: Record<string, string> = {
  Deepana: '#4ade80', Sama: '#fbbf24', Manda: '#fb923c', Vishama: '#f87171',
};
const ALIGN_COLORS: Record<string, string> = {
  Ideal: '#4ade80', Acceptable: '#fbbf24', 'Not Recommended': '#f87171',
};
const INSIGHT_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  positive: { bg: 'rgba(74,222,128,0.10)', border: 'rgba(74,222,128,0.35)', icon: '🌿' },
  warning:  { bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.35)', icon: '⚠️' },
  negative: { bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.35)', icon: '🔴' },
};
const RASA_LABELS: Record<string, string> = {
  madhura: 'Sweet 🍯', amla: 'Sour 🍋', lavana: 'Salty 🧂',
  katu: 'Pungent 🌶', tikta: 'Bitter 🌿', kashaya: 'Astringent 🍃',
};
const RASA_COLORS: Record<string, string> = {
  Dominant: '#fbbf24', Moderate: '#a78bfa', Mild: '#38bdf8', Absent: 'rgba(255,255,255,0.18)',
};
const HUNGER_OPTIONS = [
  { label: 'Not Hungry', emoji: '😌', value: 'Not hungry' },
  { label: 'Mildly', emoji: '🙂', value: 'Mildly hungry' },
  { label: 'Hungry', emoji: '😋', value: 'Hungry' },
  { label: 'Starving', emoji: '🤤', value: 'Starving' },
];

// ─── Sattvic Arc ──────────────────────────────────────────────────────────────
function SattvicArc({ score }: { score: number }) {
  const r = 36; const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 70 ? '#4ade80' : score >= 45 ? '#fbbf24' : '#f87171';
  return (
    <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
      <svg width={88} height={88} viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={44} cy={44} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={8} />
        <circle cx={44} cy={44} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1.1rem', fontWeight: 900, color, fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", fontWeight: 700, letterSpacing: '0.05em', lineHeight: 1.2, textAlign: 'center' }}>SATTVIC</span>
      </div>
    </div>
  );
}

// ─── Dosha Bar ────────────────────────────────────────────────────────────────
function DoshaBar({ label, effect, pct, color }: { label: string; effect: string; pct: number; color: string }) {
  const effectColor = effect === 'Balancing' ? '#4ade80' : effect === 'Aggravating' ? '#f87171' : '#a78bfa';
  return (
    <div style={{ marginBottom: '0.55rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.22rem' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 800, color, fontFamily: "'Outfit', sans-serif" }}>{label}</span>
        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: effectColor, fontFamily: "'Outfit', sans-serif" }}>{effect}</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MealAnalyzerSheet({ trigger, onClose, userName = 'friend' }: Props) {
  const [mounted, setMounted]         = useState(false);
  const [step, setStep]               = useState<'prompt' | 'hunger' | 'analyzing' | 'result' | 'error'>('prompt');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64]   = useState<string>('');
  const [imageMime, setImageMime]       = useState<string>('image/jpeg');
  const [hunger, setHunger]           = useState<string>('Hungry');
  const [description, setDescription] = useState<string>(trigger.mealDetail ?? '');
  const [analysis, setAnalysis]       = useState<MealAnalysis | null>(null);
  const [errorMsg, setErrorMsg]       = useState<string>('');
  const [shareStep, setShareStep]     = useState(false);
  const [copied, setCopied]           = useState(false);
  const cameraRef  = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const handleFile = useCallback(async (file: File) => {
    try {
      const { base64, mimeType } = await compressImage(file);
      const previewUrl = `data:${mimeType};base64,${base64}`;
      setImageDataUrl(previewUrl);
      setImageBase64(base64);
      setImageMime(mimeType);
      setStep('hunger');
    } catch { setErrorMsg('Could not read image. Try another.'); setStep('error'); }
  }, []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }, [handleFile]);

  const runAnalysis = useCallback(async () => {
    if (!imageBase64) return;
    setStep('analyzing');
    try {
      const res = await fetch('/api/bodhi/meal-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: imageBase64,
          mime_type: imageMime,
          user_prakriti: getPrakriti(),
          kala: getKala(),
          timestamp: getTimestamp(),
          season: getSeason(),
          meal_type: trigger.mealType,
          hunger_level: hunger,
          meal_description: description || trigger.mealDetail,
          user_name: userName,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Analysis failed'); }
      const data = await res.json();
      setAnalysis(data.analysis);
      saveMealAnalysisLocally(trigger.mealType, data.analysis, imageDataUrl ?? '');
      setStep('result');
    } catch (e: unknown) {
      setErrorMsg((e instanceof Error) ? e.message : 'Vaidya is momentarily in dhyana.');
      setStep('error');
    }
  }, [imageBase64, imageMime, hunger, description, trigger, userName, imageDataUrl]);

  const shareAsStory = useCallback(async () => {
    if (!analysis || !imageDataUrl) return;
    setShareStep(true);

    const canvas = document.createElement('canvas');
    canvas.width = 1080; canvas.height = 1920;
    const ctx2d = canvas.getContext('2d')!;

    // Gradient background
    const grad = ctx2d.createLinearGradient(0, 0, 0, 1920);
    grad.addColorStop(0, '#0a0414'); grad.addColorStop(0.5, '#130826'); grad.addColorStop(1, '#060210');
    ctx2d.fillStyle = grad; ctx2d.fillRect(0, 0, 1080, 1920);

    // Meal image
    const img = new Image();
    img.onload = () => {
      const imgAspect = img.width / img.height;
      const drawW = 1080; const drawH = drawW / imgAspect;
      ctx2d.save(); ctx2d.globalAlpha = 0.55; ctx2d.drawImage(img, 0, 0, drawW, Math.min(drawH, 860)); ctx2d.restore();
      // Overlay gradient
      const overlay = ctx2d.createLinearGradient(0, 500, 0, 860);
      overlay.addColorStop(0, 'rgba(10,4,20,0)'); overlay.addColorStop(1, 'rgba(10,4,20,1)');
      ctx2d.fillStyle = overlay; ctx2d.fillRect(0, 500, 1080, 360);

      // Title
      ctx2d.font = "bold 72px 'Outfit', sans-serif"; ctx2d.fillStyle = '#fbbf24';
      ctx2d.fillText('✦ Vaidya Analysis', 80, 940);
      ctx2d.font = "600 52px 'Outfit', sans-serif"; ctx2d.fillStyle = 'rgba(255,255,255,0.85)';
      ctx2d.fillText(analysis.meal_identified?.slice(0, 34) ?? '', 80, 1010);

      // Sattvic
      ctx2d.font = "bold 44px 'Outfit', sans-serif"; ctx2d.fillStyle = '#4ade80';
      ctx2d.fillText(`Sattvic Score: ${analysis.sattvic_score}/100`, 80, 1080);
      ctx2d.font = "500 40px 'Outfit', sans-serif"; ctx2d.fillStyle = '#a78bfa';
      ctx2d.fillText(`${trigger.mealType} · ${getKala()}`, 80, 1135);

      // Sakha message
      ctx2d.font = "italic 500 38px 'Outfit', sans-serif"; ctx2d.fillStyle = 'rgba(255,255,255,0.7)';
      const words = (analysis.sakha_message ?? '').split(' ');
      let line = ''; let y = 1220;
      for (const word of words) {
        const test = line + word + ' ';
        if (ctx2d.measureText(test).width > 920 && line !== '') {
          ctx2d.fillText(line.trim(), 80, y); line = word + ' '; y += 52;
        } else { line = test; }
      }
      if (line.trim()) ctx2d.fillText(line.trim(), 80, y);

      // Branding
      ctx2d.font = "bold 42px 'Outfit', sans-serif"; ctx2d.fillStyle = '#fbbf24';
      ctx2d.fillText('✦ OneSUTRA', 80, 1850);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'meal-vaidya.jpg', { type: 'image/jpeg' });
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: `${trigger.mealType} Analysis — Vaidya`, text: analysis.sakha_message });
        } else {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'meal-vaidya.jpg'; a.click();
        }
        setShareStep(false);
      }, 'image/jpeg', 0.92);
    };
    img.src = imageDataUrl;
  }, [analysis, imageDataUrl, trigger]);

  const copyToClipboard = useCallback(async () => {
    if (!analysis) return;
    const text = `🌿 ${trigger.mealType} Analysis — OneSutra Vaidya\n\nMeal: ${analysis.meal_identified}\nSattvic Score: ${analysis.sattvic_score}/100\nAgni: ${analysis.agni_assessment.impact}\n\n${analysis.sakha_message}`;
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2200); } catch { /* ignore */ }
  }, [analysis, trigger]);

  if (!mounted) return null;

  // ── Portal content ──────────────────────────────────────────────────────────
  const content = (
    <AnimatePresence>
      <motion.div
        key="meal-analyzer-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column' }}
      >
        {/* ── STEP: PROMPT ── */}
        {step === 'prompt' && (
          <motion.div key="prompt" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(180deg, #1a0836 0%, #07020f 100%)', borderRadius: '28px 28px 0 0', padding: '1.2rem 1.2rem 2.2rem', border: '1px solid rgba(251,191,36,0.18)', borderBottom: 'none' }}>
            <div style={{ width: 40, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.14)', margin: '0 auto 1.2rem' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '1.35rem' }}>{trigger.mealEmoji}</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fbbf24', fontFamily: "'Outfit', sans-serif" }}>{trigger.mealType} Logged ✦</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif" }}>Let Vaidya analyze your meal for deeper insights</p>
              </div>
              <motion.button whileTap={{ scale: 0.8 }} onClick={onClose}
                style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={15} color="rgba(255,255,255,0.45)" />
              </motion.button>
            </div>

            {/* Bodhi invite card */}
            <div style={{ borderRadius: 20, background: 'linear-gradient(135deg, rgba(251,191,36,0.10), rgba(167,139,250,0.08))', border: '1.5px solid rgba(251,191,36,0.22)', padding: '1rem', marginBottom: '1.1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.65rem' }}>
                <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2.4, repeat: Infinity }}
                  style={{ width: 44, height: 44, borderRadius: 14, background: 'radial-gradient(circle at 35% 35%, rgba(251,191,36,0.4), rgba(139,92,246,0.25))', border: '1.5px solid rgba(251,191,36,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                  🔬
                </motion.div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.83rem', fontWeight: 800, color: 'rgba(255,255,255,0.9)', fontFamily: "'Outfit', sans-serif" }}>Share your meal photo</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#a78bfa', fontFamily: "'Outfit', sans-serif", fontStyle: 'italic' }}>Vaidya will read your meal through Ayurvedic eyes</p>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}>
                Get Dosha impact · Shad Rasa profile · Agni assessment · Timing alignment · After-meal protocol — personalized to your Prakriti.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <motion.button whileTap={{ scale: 0.93 }}
                onClick={() => cameraRef.current?.click()}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', padding: '0.85rem 0.5rem', borderRadius: 18, background: 'rgba(251,191,36,0.10)', border: '1.5px solid rgba(251,191,36,0.3)', cursor: 'pointer' }}>
                <Camera size={22} color="#fbbf24" />
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fbbf24', fontFamily: "'Outfit', sans-serif" }}>Camera</span>
                <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>Take photo now</span>
              </motion.button>
              <motion.button whileTap={{ scale: 0.93 }}
                onClick={() => galleryRef.current?.click()}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', padding: '0.85rem 0.5rem', borderRadius: 18, background: 'rgba(167,139,250,0.10)', border: '1.5px solid rgba(167,139,250,0.3)', cursor: 'pointer' }}>
                <ImageIcon size={22} color="#a78bfa" />
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#a78bfa', fontFamily: "'Outfit', sans-serif" }}>Gallery</span>
                <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>Choose from photos</span>
              </motion.button>
            </div>

            <motion.button whileTap={{ scale: 0.96 }} onClick={onClose}
              style={{ width: '100%', padding: '0.62rem', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>
              Skip — I'll analyze later
            </motion.button>

            <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onFileChange} style={{ display: 'none' }} />
            <input ref={galleryRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
          </motion.div>
        )}

        {/* ── STEP: HUNGER + CONFIRM ── */}
        {step === 'hunger' && (
          <motion.div key="hunger" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(180deg, #1a0836 0%, #07020f 100%)', borderRadius: '28px 28px 0 0', padding: '1.2rem 1.2rem 2.2rem', border: '1px solid rgba(167,139,250,0.18)', borderBottom: 'none', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ width: 40, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.14)', margin: '0 auto 1rem' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 900, color: '#a78bfa', fontFamily: "'Outfit', sans-serif" }}>Before Vaidya Analyzes…</span>
              <motion.button whileTap={{ scale: 0.8 }} onClick={onClose}
                style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={13} color="rgba(255,255,255,0.4)" />
              </motion.button>
            </div>

            {/* Image preview */}
            {imageDataUrl && (
              <div style={{ borderRadius: 20, overflow: 'hidden', marginBottom: '1rem', aspectRatio: '16/9', position: 'relative' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageDataUrl} alt="meal" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }} />
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => setStep('prompt')}
                  style={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.75rem', borderRadius: 99, background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: '0.62rem', color: 'rgba(255,255,255,0.75)', fontFamily: "'Outfit', sans-serif" }}>
                  <RefreshCw size={11} /> Retake
                </motion.button>
              </div>
            )}

            {/* Hunger */}
            <p style={{ margin: '0 0 0.55rem', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.06em', textTransform: 'uppercase' }}>Hunger Level</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', marginBottom: '0.9rem' }}>
              {HUNGER_OPTIONS.map(opt => (
                <motion.button key={opt.value} whileTap={{ scale: 0.88 }} onClick={() => setHunger(opt.value)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.22rem', padding: '0.55rem 0.3rem', borderRadius: 14, background: hunger === opt.value ? 'rgba(251,191,36,0.16)' : 'rgba(255,255,255,0.04)', border: `1.5px solid ${hunger === opt.value ? 'rgba(251,191,36,0.55)' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
                  <span style={{ fontSize: '1.1rem' }}>{opt.emoji}</span>
                  <span style={{ fontSize: '0.52rem', fontWeight: 700, color: hunger === opt.value ? '#fbbf24' : 'rgba(255,255,255,0.45)', fontFamily: "'Outfit', sans-serif", textAlign: 'center', lineHeight: 1.2 }}>{opt.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Description */}
            <p style={{ margin: '0 0 0.45rem', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.06em', textTransform: 'uppercase' }}>Add details (optional)</p>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="E.g. 'Poha with coconut chutney and chai…'"
              rows={2}
              style={{ width: '100%', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', fontFamily: "'Outfit', sans-serif", fontSize: '0.75rem', padding: '0.65rem 0.8rem', resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: '1rem' }}
            />

            <motion.button whileTap={{ scale: 0.96 }} onClick={runAnalysis}
              style={{ width: '100%', padding: '0.85rem', borderRadius: 18, background: 'linear-gradient(135deg, #fbbf24, #f97316)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: '0.88rem', color: '#07020f', boxShadow: '0 6px 28px rgba(251,191,36,0.35)' }}>
              ✦ Invoke Vaidya&apos;s Analysis
              <ChevronRight size={18} />
            </motion.button>
          </motion.div>
        )}

        {/* ── STEP: ANALYZING ── */}
        {step === 'analyzing' && (
          <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', gap: '1.4rem' }}>
            {imageDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <div style={{ width: 140, height: 140, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(251,191,36,0.4)', boxShadow: '0 0 40px rgba(251,191,36,0.25)' }}>
                <img src={imageDataUrl} alt="meal" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
              style={{ width: 52, height: 52, borderRadius: '50%', border: '3px solid rgba(251,191,36,0.15)', borderTopColor: '#fbbf24', position: imageDataUrl ? 'relative' : 'static', marginTop: imageDataUrl ? -24 : 0 }} />
            <div style={{ textAlign: 'center' }}>
              <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
                style={{ margin: '0 0 0.3rem', fontSize: '0.95rem', fontWeight: 800, color: '#fbbf24', fontFamily: "'Outfit', sans-serif" }}>
                Vaidya is reading your meal…
              </motion.p>
              <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.55 }}>
                Analyzing Dosha impact, Shad Rasa,<br />Agni alignment & Timing suitability
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.5rem' }}>
              {['Prakriti', 'Agni', 'Rasa', 'Kala'].map((lbl, i) => (
                <motion.div key={lbl} animate={{ opacity: [0.25, 1, 0.25] }} transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.32 }}
                  style={{ padding: '0.28rem 0.65rem', borderRadius: 99, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.28)', fontSize: '0.58rem', color: '#a78bfa', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                  {lbl}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── STEP: ERROR ── */}
        {step === 'error' && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', gap: '1rem' }}>
            <span style={{ fontSize: '2.5rem' }}>🙏</span>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#f87171', fontFamily: "'Outfit', sans-serif", textAlign: 'center' }}>Vaidya could not complete the analysis</p>
            <p style={{ margin: 0, fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', fontFamily: "'Outfit', sans-serif", textAlign: 'center', lineHeight: 1.55 }}>{errorMsg}</p>
            <motion.button whileTap={{ scale: 0.94 }} onClick={() => setStep('prompt')}
              style={{ marginTop: '0.5rem', padding: '0.7rem 1.8rem', borderRadius: 14, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.35)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 800, color: '#fbbf24', fontFamily: "'Outfit', sans-serif" }}>
              Try Again
            </motion.button>
            <motion.button whileTap={{ scale: 0.94 }} onClick={onClose}
              style={{ padding: '0.5rem 1.4rem', borderRadius: 14, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>
              Close
            </motion.button>
          </motion.div>
        )}

        {/* ── STEP: RESULT ── */}
        {step === 'result' && analysis && (
          <motion.div key="result" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

            {/* Fixed header */}
            <div style={{ position: 'sticky', top: 0, zIndex: 2, background: 'rgba(7,2,15,0.96)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: '0.85rem 1.1rem 0.7rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>🔬</span>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 900, color: '#fbbf24', fontFamily: "'Outfit', sans-serif", lineHeight: 1.2 }}>Vaidya&apos;s Analysis</p>
                    <p style={{ margin: 0, fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif" }}>{trigger.mealType} · {getKala()}</p>
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.8 }} onClick={onClose}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={15} color="rgba(255,255,255,0.45)" />
                </motion.button>
              </div>
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, padding: '0.85rem 1.1rem 1.4rem' }}>

              {/* ── Hero: image + meal name + sattvic ── */}
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', marginBottom: '1.1rem', padding: '0.85rem', borderRadius: 20, background: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(167,139,250,0.06))', border: '1px solid rgba(251,191,36,0.18)' }}>
                {imageDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageDataUrl} alt="meal" style={{ width: 76, height: 76, borderRadius: 16, objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(251,191,36,0.25)' }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 900, color: 'rgba(255,255,255,0.95)', fontFamily: "'Outfit', sans-serif" }}>{analysis.meal_identified}</span>
                    <span style={{ fontSize: '0.5rem', padding: '0.1rem 0.45rem', borderRadius: 99, background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.35)', color: '#4ade80', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>{analysis.confidence}% Sure</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.58rem', padding: '0.12rem 0.5rem', borderRadius: 99, background: `${AGNI_COLORS[analysis.agni_assessment?.impact] ?? '#fbbf24'}22`, border: `1px solid ${AGNI_COLORS[analysis.agni_assessment?.impact] ?? '#fbbf24'}55`, color: AGNI_COLORS[analysis.agni_assessment?.impact] ?? '#fbbf24', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
                      🔥 Agni: {analysis.agni_assessment?.impact}
                    </span>
                    <span style={{ fontSize: '0.58rem', padding: '0.12rem 0.5rem', borderRadius: 99, background: `${ALIGN_COLORS[analysis.timing_analysis?.kala_alignment] ?? '#fbbf24'}22`, border: `1px solid ${ALIGN_COLORS[analysis.timing_analysis?.kala_alignment] ?? '#fbbf24'}55`, color: ALIGN_COLORS[analysis.timing_analysis?.kala_alignment] ?? '#fbbf24', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
                      🕐 {analysis.timing_analysis?.kala_alignment}
                    </span>
                  </div>
                </div>
                <SattvicArc score={analysis.sattvic_score} />
              </div>

              {/* ── Prakriti Compatibility ── */}
              <div style={{ marginBottom: '0.85rem', padding: '0.85rem', borderRadius: 18, background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.18)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#a78bfa', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.05em' }}>⚖️ PRAKRITI COMPATIBILITY</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 900, color: analysis.prakriti_compatibility?.overall_score >= 70 ? '#4ade80' : analysis.prakriti_compatibility?.overall_score >= 45 ? '#fbbf24' : '#f87171', fontFamily: "'Outfit', sans-serif" }}>{analysis.prakriti_compatibility?.overall_score}/100</span>
                </div>
                <DoshaBar label="Vata" effect={analysis.dosha_impact?.vata?.effect} pct={analysis.dosha_impact?.vata?.percentage} color={DOSHA_COLORS.vata} />
                <DoshaBar label="Pitta" effect={analysis.dosha_impact?.pitta?.effect} pct={analysis.dosha_impact?.pitta?.percentage} color={DOSHA_COLORS.pitta} />
                <DoshaBar label="Kapha" effect={analysis.dosha_impact?.kapha?.effect} pct={analysis.dosha_impact?.kapha?.percentage} color={DOSHA_COLORS.kapha} />
                <p style={{ margin: '0.55rem 0 0', fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}>{analysis.prakriti_compatibility?.summary}</p>
              </div>

              {/* ── Agni Assessment ── */}
              <div style={{ marginBottom: '0.85rem', padding: '0.85rem', borderRadius: 18, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.16)' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#fbbf24', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>🔥 AGNI ASSESSMENT</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <Flame size={16} color={AGNI_COLORS[analysis.agni_assessment?.impact] ?? '#fbbf24'} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: AGNI_COLORS[analysis.agni_assessment?.impact] ?? '#fbbf24', fontFamily: "'Outfit', sans-serif" }}>{analysis.agni_assessment?.impact}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.55 }}>{analysis.agni_assessment?.explanation}</p>
              </div>

              {/* ── Shad Rasa ── */}
              <div style={{ marginBottom: '0.85rem', padding: '0.85rem', borderRadius: 18, background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.14)' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#22d3ee', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.05em', display: 'block', marginBottom: '0.65rem' }}>🌿 SHAD RASA (SIX TASTES)</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginBottom: '0.65rem' }}>
                  {(Object.entries(analysis.shad_rasa ?? {}) as [string, {presence: string; note: string}][])
                    .filter(([k]) => k !== 'rasa_balance_insight')
                    .map(([rasa, val]) => (
                      <div key={rasa} style={{ padding: '0.45rem', borderRadius: 12, background: `${RASA_COLORS[val.presence]}22`, border: `1px solid ${RASA_COLORS[val.presence]}44`, textAlign: 'center' }}>
                        <p style={{ margin: '0 0 2px', fontSize: '0.55rem', fontWeight: 700, color: RASA_COLORS[val.presence], fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>{val.presence}</p>
                        <p style={{ margin: 0, fontSize: '0.5rem', color: 'rgba(255,255,255,0.45)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.2 }}>{RASA_LABELS[rasa]}</p>
                      </div>
                    ))
                  }
                </div>
                <p style={{ margin: 0, fontSize: '0.63rem', color: 'rgba(255,255,255,0.45)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5, fontStyle: 'italic' }}>{analysis.shad_rasa?.rasa_balance_insight}</p>
              </div>

              {/* ── Guna Analysis ── */}
              <div style={{ marginBottom: '0.85rem', padding: '0.85rem', borderRadius: 18, background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.14)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#4ade80', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.05em' }}>✨ GUNA (QUALITY)</span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: analysis.guna_analysis?.dominant_guna === 'Sattvic' ? '#4ade80' : analysis.guna_analysis?.dominant_guna === 'Rajasic' ? '#fbbf24' : '#f87171', fontFamily: "'Outfit', sans-serif" }}>{analysis.guna_analysis?.dominant_guna}</span>
                </div>
                {analysis.guna_analysis?.sattvic_elements?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.3rem' }}>
                    {analysis.guna_analysis.sattvic_elements.map((el, i) => (
                      <span key={i} style={{ fontSize: '0.52rem', padding: '0.1rem 0.45rem', borderRadius: 99, background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>{el}</span>
                    ))}
                  </div>
                )}
                {analysis.guna_analysis?.rajasic_elements?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.3rem' }}>
                    {analysis.guna_analysis.rajasic_elements.map((el, i) => (
                      <span key={i} style={{ fontSize: '0.52rem', padding: '0.1rem 0.45rem', borderRadius: 99, background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.28)', color: '#fbbf24', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>{el}</span>
                    ))}
                  </div>
                )}
                {analysis.guna_analysis?.tamasic_elements?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {analysis.guna_analysis.tamasic_elements.map((el, i) => (
                      <span key={i} style={{ fontSize: '0.52rem', padding: '0.1rem 0.45rem', borderRadius: 99, background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.28)', color: '#f87171', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>{el}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Timing Analysis ── */}
              <div style={{ marginBottom: '0.85rem', padding: '0.85rem', borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.05em', display: 'block', marginBottom: '0.55rem' }}>🕐 TIMING & SEASON</span>
                <p style={{ margin: '0 0 0.3rem', fontSize: '0.63rem', color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}>{analysis.timing_analysis?.reasoning}</p>
                <p style={{ margin: '0 0 0.3rem', fontSize: '0.63rem', color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}>{analysis.timing_analysis?.ritu_alignment}</p>
                <p style={{ margin: 0, fontSize: '0.63rem', color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5, fontStyle: 'italic' }}>{analysis.timing_analysis?.hunger_comment}</p>
              </div>

              {/* ── Viruddha Ahara ── */}
              {analysis.viruddha_ahara_check?.incompatibilities_found && (
                <div style={{ marginBottom: '0.85rem', padding: '0.85rem', borderRadius: 18, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.22)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.55rem' }}>
                    <AlertTriangle size={14} color="#f87171" />
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#f87171', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.05em' }}>VIRUDDHA AHARA (INCOMPATIBILITIES)</span>
                  </div>
                  {analysis.viruddha_ahara_check.items.map((item, i) => (
                    <p key={i} style={{ margin: i > 0 ? '0.25rem 0 0' : 0, fontSize: '0.63rem', color: 'rgba(248,113,113,0.8)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}>• {item}</p>
                  ))}
                </div>
              )}

              {/* ── Insights ── */}
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.05em', display: 'block', marginBottom: '0.55rem' }}>💡 VAIDYA&apos;S INSIGHTS</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.85rem' }}>
                {(analysis.insights ?? []).map((ins, i) => {
                  const ic = INSIGHT_COLORS[ins.type] ?? INSIGHT_COLORS.positive;
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                      style={{ padding: '0.7rem 0.85rem', borderRadius: 15, background: ic.bg, border: `1px solid ${ic.border}` }}>
                      <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.9rem', flexShrink: 0, lineHeight: 1 }}>{ic.icon}</span>
                        <div>
                          <p style={{ margin: '0 0 0.18rem', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.88)', fontFamily: "'Outfit', sans-serif" }}>{ins.title}</p>
                          <p style={{ margin: 0, fontSize: '0.62rem', color: 'rgba(255,255,255,0.45)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}>{ins.body}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* ── After-Meal Protocol ── */}
              <div style={{ marginBottom: '0.85rem', padding: '0.85rem', borderRadius: 18, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.16)' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#38bdf8', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.05em', display: 'block', marginBottom: '0.6rem' }}>📋 AFTER-MEAL PROTOCOL</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {(analysis.after_meal_protocol ?? []).map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.55rem', alignItems: 'flex-start' }}>
                      <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(56,189,248,0.18)', border: '1px solid rgba(56,189,248,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.52rem', color: '#38bdf8', fontWeight: 900, fontFamily: "'Outfit', sans-serif", flexShrink: 0 }}>{i + 1}</span>
                      <p style={{ margin: 0, fontSize: '0.63rem', color: 'rgba(255,255,255,0.55)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}>{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Avoid Next Meal ── */}
              {(analysis.avoid_next_meal ?? []).length > 0 && (
                <div style={{ marginBottom: '0.85rem', padding: '0.85rem', borderRadius: 18, background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.14)' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#f87171', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>🚫 AVOID AT NEXT MEAL</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {analysis.avoid_next_meal.map((item, i) => (
                      <span key={i} style={{ fontSize: '0.58rem', padding: '0.18rem 0.55rem', borderRadius: 99, background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>{item}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Sakha Message (Bodhi) ── */}
              <div style={{ marginBottom: '1.2rem', padding: '0.95rem 1rem', borderRadius: 20, background: 'linear-gradient(135deg, rgba(251,191,36,0.10), rgba(167,139,250,0.08))', border: '1.5px solid rgba(251,191,36,0.24)' }}>
                <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                  <motion.div animate={{ boxShadow: ['0 0 0 2px rgba(251,191,36,0.3)', '0 0 0 7px rgba(251,191,36,0.08)', '0 0 0 2px rgba(251,191,36,0.3)'] }} transition={{ duration: 1.8, repeat: Infinity }}
                    style={{ width: 38, height: 38, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, rgba(251,191,36,0.45), rgba(139,92,246,0.25))', border: '2px solid rgba(251,191,36,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                    ✦
                  </motion.div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem', fontSize: '0.55rem', color: '#fbbf24', fontWeight: 800, fontFamily: "'Outfit', sans-serif", letterSpacing: '0.06em' }}>SAKHA BODHI SAYS</p>
                    <p style={{ margin: 0, fontSize: '0.73rem', color: 'rgba(255,255,255,0.78)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.55, fontStyle: 'italic' }}>
                      &ldquo;{analysis.sakha_message}&rdquo;
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Share buttons ── */}
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <motion.button whileTap={{ scale: 0.94 }} onClick={shareAsStory}
                  disabled={shareStep}
                  style={{ flex: 1, padding: '0.82rem', borderRadius: 18, background: 'linear-gradient(135deg, #fbbf24, #f97316)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: '0.78rem', color: '#07020f', boxShadow: '0 4px 24px rgba(251,191,36,0.3)', opacity: shareStep ? 0.65 : 1 }}>
                  {shareStep ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#07020f' }} /> : <Share2 size={15} />}
                  {shareStep ? 'Creating…' : 'Share as Story'}
                </motion.button>
                <motion.button whileTap={{ scale: 0.94 }} onClick={copyToClipboard}
                  style={{ padding: '0.82rem', borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 48 }}>
                  <span style={{ fontSize: '0.7rem' }}>{copied ? '✓' : '📋'}</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

// ── Hidden canvas for story generation ──────────────────────────────────────
// (keep ref for future direct canvas use)
