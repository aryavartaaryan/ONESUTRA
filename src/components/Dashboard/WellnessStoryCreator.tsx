'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Share2, Sparkles } from 'lucide-react';
import {
  type WellnessStory,
  saveWellnessStory,
  generateStoryText,
  FEELINGS,
  getStoryBg,
  getHabitColors,
} from '@/lib/wellnessStories';

// ── Image compression helper ───────────────────────────────────────────────
async function compressImage(file: File, maxDim = 900): Promise<string> {
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
        resolve(canvas.toDataURL('image/jpeg', 0.80));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Props ──────────────────────────────────────────────────────────────────
interface Props {
  habitId: string;
  habitName: string;
  habitEmoji: string;
  userName: string;
  userId?: string;
  onClose: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function WellnessStoryCreator({ habitId, habitName, habitEmoji, userName, userId, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [storyText, setStoryText] = useState(() => generateStoryText(habitId, habitName, userName));
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [feeling, setFeeling] = useState<string | null>(null);
  const [feelingEmoji, setFeelingEmoji] = useState<string | null>(null);
  const [step, setStep] = useState<'create' | 'sharing' | 'done'>('create');
  const fileRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const colors = getHabitColors(habitId);
  const bg = getStoryBg(habitId);

  useEffect(() => { setMounted(true); }, []);

  // Close on back button
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [onClose]);

  const pickPhoto = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { setImageDataUrl(await compressImage(file)); } catch { /* ignore */ }
    e.target.value = '';
  }, []);

  const handleShare = useCallback(async () => {
    setStep('sharing');
    const story: WellnessStory = {
      id: `ws-${habitId}-${Date.now()}`,
      habitId,
      habitName,
      emoji: habitEmoji,
      storyText,
      imageDataUrl: imageDataUrl ?? undefined,
      feeling: feeling ?? undefined,
      feelingEmoji: feelingEmoji ?? undefined,
      userName: (userName || 'friend').split(' ')[0],
      userId: userId ?? undefined,
      timestamp: Date.now(),
      date: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()),
      color: colors[0],
      accentColor: colors[1],
    };
    saveWellnessStory(story);
    await new Promise(r => setTimeout(r, 800));
    setStep('done');
    setTimeout(onClose, 1400);
  }, [habitId, habitName, habitEmoji, storyText, imageDataUrl, feeling, feelingEmoji, userName, colors, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="ws-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 10010,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}
      >
        <motion.div
          key="ws-sheet"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 32 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 520,
            borderRadius: '28px 28px 0 0',
            overflow: 'hidden', position: 'relative',
            maxHeight: '94dvh', display: 'flex', flexDirection: 'column',
          }}
        >
          {/* BG layer */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${imageDataUrl ?? bg})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            filter: 'brightness(0.32) saturate(1.1)',
          }} />
          {/* Gradient */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(180deg, ${colors[1]}2a 0%, rgba(4,2,20,0.88) 55%, rgba(4,2,20,0.97) 100%)`,
          }} />
          {/* Shimmer */}
          <motion.div
            animate={{ x: ['-120%', '220%'] }}
            transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 7, ease: 'easeInOut' }}
            style={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(105deg, transparent 30%, ${colors[0]}18 50%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />

          {/* Scrollable content */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '0.9rem', padding: '1.5rem 1.1rem 1.2rem', overflowY: 'auto' }}>

            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <motion.span
                  animate={{ scale: [1, 1.18, 1], rotate: [0, 8, -8, 0] }}
                  transition={{ duration: 2.8, repeat: Infinity }}
                  style={{ fontSize: '1.7rem', filter: `drop-shadow(0 0 14px ${colors[0]}99)` }}
                >
                  {habitEmoji}
                </motion.span>
                <div>
                  <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 900, color: colors[0], fontFamily: "'Outfit',sans-serif", letterSpacing: '0.06em' }}>
                    Share Wellness Story ✦
                  </p>
                  <p style={{ margin: 0, fontSize: '0.52rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit',sans-serif" }}>
                    {habitName} — just completed!
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}
              >
                <X size={13} />
              </button>
            </div>

            {/* Story caption */}
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${colors[0]}30`,
              borderRadius: 18, padding: '0.8rem 0.9rem',
              backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
            }}>
              <p style={{ margin: '0 0 0.3rem', fontSize: '0.43rem', fontWeight: 800, color: colors[0], fontFamily: "'Outfit',sans-serif", letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                Story caption (tap to edit)
              </p>
              <textarea
                value={storyText}
                onChange={e => setStoryText(e.target.value)}
                rows={4}
                style={{
                  width: '100%', background: 'transparent', border: 'none', outline: 'none',
                  color: 'rgba(255,255,255,0.85)', fontSize: '0.73rem',
                  fontFamily: "'Outfit',sans-serif", lineHeight: 1.6,
                  fontWeight: 500, resize: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Photo picker */}
            <div>
              <p style={{ margin: '0 0 0.45rem', fontSize: '0.43rem', fontWeight: 800, color: 'rgba(255,255,255,0.38)', fontFamily: "'Outfit',sans-serif", letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                Add a photo (optional)
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => fileRef.current?.click()}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      padding: '0.7rem 0.9rem', borderRadius: 16,
                      background: `${colors[0]}14`, border: `1.5px dashed ${colors[0]}55`,
                      cursor: 'pointer', color: colors[0],
                    }}
                  >
                    <Camera size={16} strokeWidth={2} />
                    <span style={{ fontSize: '0.44rem', fontWeight: 700, fontFamily: "'Outfit',sans-serif", whiteSpace: 'nowrap' }}>Camera</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => galleryRef.current?.click()}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      padding: '0.7rem 0.9rem', borderRadius: 16,
                      background: 'rgba(255,255,255,0.06)', border: '1.5px dashed rgba(255,255,255,0.22)',
                      cursor: 'pointer', color: 'rgba(255,255,255,0.55)',
                    }}
                  >
                    <span style={{ fontSize: '1rem', lineHeight: 1 }}>🖼️</span>
                    <span style={{ fontSize: '0.44rem', fontWeight: 700, fontFamily: "'Outfit',sans-serif", whiteSpace: 'nowrap' }}>Gallery</span>
                  </motion.button>
                </div>

                {imageDataUrl && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ width: 66, height: 66, borderRadius: 14, overflow: 'hidden', border: `2px solid ${colors[0]}60`, position: 'relative', flexShrink: 0 }}
                  >
                    <img src={imageDataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      onClick={() => setImageDataUrl(null)}
                      style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.75)', border: 'none', color: '#fff', fontSize: '0.55rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >✕</button>
                  </motion.div>
                )}

                {/* Hint text */}
                <p style={{ margin: 0, fontSize: '0.48rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit',sans-serif", lineHeight: 1.45 }}>
                  Share a selfie, nature shot, breakfast photo, or any moment of your wellness ritual 📸
                </p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={pickPhoto} style={{ display: 'none' }} />
              <input ref={galleryRef} type="file" accept="image/*" onChange={pickPhoto} style={{ display: 'none' }} />
            </div>

            {/* Feeling selector */}
            <div>
              <p style={{ margin: '0 0 0.45rem', fontSize: '0.43rem', fontWeight: 800, color: 'rgba(255,255,255,0.38)', fontFamily: "'Outfit',sans-serif", letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                How are you feeling right now?
              </p>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {FEELINGS.map(f => (
                  <motion.button
                    key={f.label}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => { setFeeling(f.label); setFeelingEmoji(f.emoji); }}
                    style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      padding: '0.52rem 0.15rem', borderRadius: 14,
                      background: feeling === f.label ? `${colors[0]}22` : 'rgba(255,255,255,0.04)',
                      border: `1.5px solid ${feeling === f.label ? colors[0] : 'rgba(255,255,255,0.1)'}`,
                      cursor: 'pointer', transition: 'border-color 0.18s, background 0.18s',
                      boxShadow: feeling === f.label ? `0 0 16px ${colors[0]}30` : 'none',
                    }}
                  >
                    <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>{f.emoji}</span>
                    <span style={{ fontSize: '0.4rem', color: feeling === f.label ? colors[0] : 'rgba(255,255,255,0.32)', fontFamily: "'Outfit',sans-serif", fontWeight: 700 }}>
                      {f.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Share / Done button */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={step === 'create' ? handleShare : undefined}
              disabled={step !== 'create'}
              style={{
                width: '100%', padding: '0.9rem',
                borderRadius: 20,
                background: step === 'done'
                  ? 'rgba(74,222,128,0.18)'
                  : `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
                border: step === 'done' ? '1.5px solid rgba(74,222,128,0.55)' : 'none',
                color: '#fff', fontSize: '0.85rem', fontWeight: 900,
                fontFamily: "'Outfit',sans-serif",
                cursor: step === 'create' ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: step === 'done' ? 'none' : `0 8px 32px ${colors[0]}45`,
                transition: 'background 0.3s, box-shadow 0.3s',
              }}
            >
              {step === 'done' ? (
                <><Sparkles size={15} /> Story Shared! Friends can see it ✦</>
              ) : step === 'sharing' ? (
                <>Sharing…</>
              ) : (
                <><Share2 size={15} /> Share Wellness Story</>
              )}
            </motion.button>

            {/* Skip */}
            {step === 'create' && (
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: '0.62rem', fontFamily: "'Outfit',sans-serif", cursor: 'pointer', textAlign: 'center', padding: '0.15rem' }}
              >
                Skip for now
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
