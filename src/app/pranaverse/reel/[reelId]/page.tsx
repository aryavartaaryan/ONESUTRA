'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useRouter } from 'next/navigation';

// ── Shared static data (mirrors pranaverse/page.tsx) ─────────────────────────
const MANTRAS = [
    { sanskrit: 'ॐ नमः शिवाय', transliteration: 'Om Namah Shivaya', meaning: 'I bow to the inner self', color: '#c084fc' },
    { sanskrit: 'ॐ गं गणपतये नमः', transliteration: 'Om Gam Ganapataye Namah', meaning: 'Salutations to Ganesha, remover of obstacles', color: '#fbbf24' },
    { sanskrit: 'ॐ श्री महालक्ष्म्यै नमः', transliteration: 'Om Shri Mahalakshmyai Namah', meaning: 'Salutations to the divine abundance', color: '#f472b6' },
    { sanskrit: 'असतो मा सद्गमय', transliteration: 'Asato Ma Sadgamaya', meaning: 'Lead me from untruth to truth', color: '#34d399' },
    { sanskrit: 'तमसो मा ज्योतिर्गमय', transliteration: 'Tamaso Ma Jyotirgamaya', meaning: 'Lead me from darkness to light', color: '#fde68a' },
    { sanskrit: 'ॐ मणि पद्मे हूँ', transliteration: 'Om Mani Padme Hum', meaning: 'The jewel in the lotus', color: '#a78bfa' },
    { sanskrit: 'सर्वे भवन्तु सुखिनः', transliteration: 'Sarve Bhavantu Sukhinah', meaning: 'May all beings be happy', color: '#86efac' },
];

const RESONANCE_STORIES = [
    { id: 'gayatri', label: 'Gayatri Mantra', sublabel: 'Mother of Vedas', color: '#fbbf24', bg: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=600&h=1067&fit=crop&q=80', mantra: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं' },
    { id: 'om_namah', label: 'Om Namah Shivaya', sublabel: 'Panchakshara', color: '#a78bfa', bg: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&h=1067&fit=crop&q=80', mantra: 'ॐ नमः शिवाय' },
    { id: 'mahamrityunjaya', label: 'Mahamrityunjaya', sublabel: 'Conqueror of Death', color: '#f97316', bg: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&h=1067&fit=crop&q=80', mantra: 'ॐ त्र्यम्बकं यजामहे' },
    { id: 'hanuman', label: 'Hanuman Chalisa', sublabel: 'Bajrangbali', color: '#ef4444', bg: 'https://images.unsplash.com/photo-1607988795691-3d0147b43231?w=600&h=1067&fit=crop&q=80', mantra: 'जय हनुमान ज्ञान गुण सागर' },
    { id: 'ganesha', label: 'Ganesha Vandana', sublabel: 'Vighnaharta', color: '#f59e0b', bg: 'https://images.unsplash.com/photo-1600959907703-571a4f1f9fc4?w=600&h=1067&fit=crop&q=80', mantra: 'ॐ गं गणपतये नमः' },
    { id: 'krishna', label: 'Hare Krishna', sublabel: 'Maha Mantra', color: '#06b6d4', bg: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=1067&fit=crop&q=80', mantra: 'हरे राम हरे राम राम राम हरे हरे' },
    { id: 'durga', label: 'Durga Stuti', sublabel: 'Shakti Mantra', color: '#ec4899', bg: 'https://images.unsplash.com/photo-1604607053579-ac6a2a40e77c?w=600&h=1067&fit=crop&q=80', mantra: 'ॐ दुं दुर्गायै नमः' },
    { id: 'saraswati', label: 'Saraswati Vandana', sublabel: 'Goddess of Knowledge', color: '#ffffff', bg: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&h=1067&fit=crop&q=80', mantra: 'ॐ ऐं ह्रीं क्लीं महासरस्वत्यै नमः' },
    { id: 'asato', label: 'Asato Ma', sublabel: 'Shanti Mantra', color: '#c4b5fd', bg: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=600&h=1067&fit=crop&q=80', mantra: 'ॐ असतो मा सद्गमय' },
    { id: 'himalaya', label: 'Himalaya', sublabel: 'Sacred Peaks', color: '#93c5fd', bg: 'https://images.unsplash.com/photo-1455156218388-5e61b526818b?w=600&h=1067&fit=crop&q=80' },
    { id: 'ganga', label: 'Ganga', sublabel: 'Sacred River', color: '#60a5fa', bg: 'https://images.unsplash.com/photo-1545420333-5c5fe6fc5a33?w=600&h=1067&fit=crop&q=80' },
    { id: 'sunrise', label: 'Sunrise', sublabel: 'Pratah Kaal', color: '#fbbf24', bg: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=1067&fit=crop&q=80' },
    { id: 'yoga', label: 'Yoga', sublabel: 'Union of Soul', color: '#34d399', bg: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=1067&fit=crop&q=80' },
];

const REEL_IMAGES = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=1067&fit=crop&q=80',
    'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=600&h=1067&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&h=1067&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=1067&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&h=1067&fit=crop&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=1067&fit=crop&q=80',
    'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=600&h=1067&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&h=1067&fit=crop&q=80',
];

function resolveReel(reelId: string) {
    const resonance = RESONANCE_STORIES.find(s => s.id === reelId);
    if (resonance) {
        return {
            id: resonance.id,
            type: 'resonance' as const,
            imageUrl: resonance.bg,
            label: resonance.label,
            sublabel: resonance.sublabel,
            color: resonance.color,
            mantra: (resonance as any).mantra as string | undefined,
            likes: 1247 + parseInt(resonance.id.charCodeAt(0).toString()) * 83,
        };
    }
    const idx = parseInt(reelId.replace(/\D/g, ''), 10) || 0;
    const mantra = MANTRAS[idx % MANTRAS.length];
    return {
        id: reelId,
        type: 'reel' as const,
        imageUrl: REEL_IMAGES[idx % REEL_IMAGES.length],
        label: mantra.sanskrit,
        sublabel: mantra.transliteration,
        color: mantra.color,
        mantra: mantra.sanskrit,
        meaning: mantra.meaning,
        transliteration: mantra.transliteration,
        likes: 800 + idx * 137,
    };
}

// ── Google Auth Gate Overlay ─────────────────────────────────────────────────
function AuthGate({ reel, onAuthSuccess }: { reel: ReturnType<typeof resolveReel>; onAuthSuccess: () => void }) {
    const [signing, setSigning] = useState(false);
    const [error, setError] = useState('');

    const handleGoogleSignIn = async () => {
        setSigning(true);
        setError('');
        try {
            const { getFirebaseAuth } = await import('@/lib/firebase');
            const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
            const auth = await getFirebaseAuth();
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            await signInWithPopup(auth, provider);
            onAuthSuccess();
        } catch (e: any) {
            if (e?.code !== 'auth/popup-closed-by-user') {
                setError('Sign-in failed. Please try again.');
            }
        } finally {
            setSigning(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                position: 'absolute', inset: 0, zIndex: 50,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'flex-end',
                paddingBottom: '2.5rem',
            }}
        >
            {/* Frost overlay */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(4,2,18,0.97) 0%, rgba(4,2,18,0.88) 35%, rgba(4,2,18,0.55) 65%, rgba(4,2,18,0.22) 100%)',
                backdropFilter: 'blur(8px) saturate(120%)',
                WebkitBackdropFilter: 'blur(8px) saturate(120%)',
            }} />

            {/* Content card */}
            <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 280, damping: 26, delay: 0.2 }}
                style={{
                    position: 'relative', zIndex: 1,
                    width: '90%', maxWidth: 340,
                    background: 'rgba(10,6,30,0.88)',
                    backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
                    border: '1px solid rgba(167,139,250,0.22)',
                    borderRadius: 28,
                    padding: '2rem 1.6rem 1.8rem',
                    boxShadow: '0 0 60px rgba(167,139,250,0.10), 0 24px 80px rgba(0,0,0,0.6)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                }}
            >
                {/* Animated OM */}
                <motion.div
                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    style={{ fontSize: '2.5rem', filter: `drop-shadow(0 0 18px ${reel.color})` }}
                >
                    ✦
                </motion.div>

                <div style={{ textAlign: 'center' }}>
                    <p style={{
                        margin: 0, fontSize: '1.05rem', fontWeight: 800,
                        fontFamily: "'Outfit', sans-serif",
                        background: 'linear-gradient(120deg, #c4b5fd 0%, #a78bfa 50%, #818cf8 100%)',
                        WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                        lineHeight: 1.3,
                    }}>
                        This Sacred Reel awaits you
                    </p>
                    <p style={{
                        margin: '0.4rem 0 0', fontSize: '0.72rem',
                        color: 'rgba(255,255,255,0.50)',
                        fontFamily: "'Outfit', sans-serif", lineHeight: 1.55,
                    }}>
                        Join <span style={{ color: '#fbbf24', fontWeight: 700 }}>OneSutra</span> — the world's most conscious social network — to experience the full PranaVerse
                    </p>
                </div>

                {/* Reel preview chip */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: `${reel.color}12`, border: `1px solid ${reel.color}30`,
                    borderRadius: 99, padding: '0.35rem 0.85rem',
                }}>
                    <span style={{ fontSize: '0.7rem', color: reel.color, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                        🎬 {reel.label}
                    </span>
                </div>

                {/* Google Sign-In Button */}
                <motion.button
                    whileTap={{ scale: 0.96 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={handleGoogleSignIn}
                    disabled={signing}
                    style={{
                        width: '100%', padding: '0.82rem 1.2rem',
                        borderRadius: 14,
                        background: signing
                            ? 'rgba(255,255,255,0.06)'
                            : 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(240,240,255,0.92) 100%)',
                        border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                        cursor: signing ? 'not-allowed' : 'pointer',
                        boxShadow: signing ? 'none' : '0 4px 24px rgba(255,255,255,0.15)',
                        transition: 'all 0.2s',
                    }}
                >
                    {!signing && (
                        <svg width="18" height="18" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.29-8.16 2.29-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                    )}
                    {signing && (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid rgba(167,139,250,0.4)', borderTopColor: '#a78bfa' }}
                        />
                    )}
                    <span style={{
                        fontSize: '0.88rem', fontWeight: 700,
                        color: signing ? 'rgba(255,255,255,0.5)' : '#1a1a2e',
                        fontFamily: "'Outfit', sans-serif",
                        letterSpacing: '0.01em',
                    }}>
                        {signing ? 'Connecting to OneSutra…' : 'Continue with Google'}
                    </span>
                </motion.button>

                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                        style={{ margin: 0, fontSize: '0.65rem', color: '#f87171', fontFamily: "'Outfit', sans-serif", textAlign: 'center' }}
                    >
                        {error}
                    </motion.p>
                )}

                <p style={{
                    margin: 0, fontSize: '0.53rem',
                    color: 'rgba(255,255,255,0.22)',
                    fontFamily: "'Outfit', sans-serif", textAlign: 'center', lineHeight: 1.55,
                }}>
                    By joining, you enter a conscious community committed to wellness, wisdom & rising energy 🌟
                </p>
            </motion.div>
        </motion.div>
    );
}

// ── Single-Reel Immersive Page ────────────────────────────────────────────────
export default function SharedReelPage({ params }: { params: { reelId: string } }) {
    const router = useRouter();
    const reel = resolveReel(params.reelId);

    // ── Auth state ─────────────────────────────────────────────────────────────
    const [authChecked, setAuthChecked] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const { getFirebaseAuth } = await import('@/lib/firebase');
                const { onAuthStateChanged } = await import('firebase/auth');
                const auth = await getFirebaseAuth();
                const unsub = onAuthStateChanged(auth, (user) => {
                    setIsLoggedIn(!!user);
                    setAuthChecked(true);
                });
                return () => unsub();
            } catch {
                setAuthChecked(true); // offline fallback — show gate
            }
        })();
    }, []);

    // ── Reel state ────────────────────────────────────────────────────────────
    const [muted, setMuted] = useState(true);
    const [liked, setLiked] = useState(false);
    const [liveLikes, setLiveLikes] = useState(reel.likes);
    const [showComments, setShowCmts] = useState(false);
    const [comments, setComments] = useState<Array<{ id: string; text: string; author: string; ts: number }>>([]);
    const [commentText, setCommentText] = useState('');
    const [posting, setPosting] = useState(false);
    const [heartFlash, setHeartFlash] = useState(false);

    const lastTap = useRef(0);
    const cmtUnsub = useRef<(() => void) | null>(null);
    const dragY = useMotionValue(0);

    // Body scroll lock
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    // ESC to go back
    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === 'Escape') router.push('/pranaverse'); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [router]);

    // Device back button — always return to PranaVerse, not unknown history entry
    useEffect(() => {
        window.history.pushState({ reelView: true }, '');
        const handlePop = () => { router.push('/pranaverse'); };
        window.addEventListener('popstate', handlePop);
        return () => window.removeEventListener('popstate', handlePop);
    }, [router]);

    // Firebase: real-time likes (only when logged in)
    useEffect(() => {
        if (!isLoggedIn) return;
        let unsub: (() => void) | null = null;
        (async () => {
            try {
                const { getFirebaseFirestore } = await import('@/lib/firebase');
                const { doc, onSnapshot, setDoc } = await import('firebase/firestore');
                const db = await getFirebaseFirestore();
                const ref = doc(db, 'pranaverse_reels', reel.id);
                await setDoc(ref, { likes: reel.likes }, { merge: true });
                unsub = onSnapshot(ref, snap => {
                    if (snap.exists()) setLiveLikes(snap.data().likes ?? reel.likes);
                });
            } catch { /* offline */ }
        })();
        return () => { unsub?.(); };
    }, [reel.id, reel.likes, isLoggedIn]);

    // Firebase: real-time comments
    useEffect(() => {
        if (!showComments || !isLoggedIn) { cmtUnsub.current?.(); cmtUnsub.current = null; return; }
        (async () => {
            try {
                const { getFirebaseFirestore } = await import('@/lib/firebase');
                const { collection, query, orderBy, onSnapshot } = await import('firebase/firestore');
                const db = await getFirebaseFirestore();
                const q = query(collection(db, 'pranaverse_reels', reel.id, 'comments'), orderBy('ts', 'asc'));
                cmtUnsub.current = onSnapshot(q, snap => {
                    setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as { id: string; text: string; author: string; ts: number })));
                });
            } catch { /* offline */ }
        })();
        return () => { cmtUnsub.current?.(); cmtUnsub.current = null; };
    }, [showComments, reel.id, isLoggedIn]);

    const handleTap = useCallback(() => {
        if (!isLoggedIn) return;
        const now = Date.now();
        if (now - lastTap.current < 300) triggerLike();
        lastTap.current = now;
    }, [isLoggedIn]);

    const triggerLike = useCallback(async () => {
        if (liked || !isLoggedIn) return;
        setLiked(true);
        setHeartFlash(true);
        setLiveLikes(l => l + 1);
        setTimeout(() => setHeartFlash(false), 850);
        try {
            const { getFirebaseFirestore } = await import('@/lib/firebase');
            const { doc, setDoc, increment } = await import('firebase/firestore');
            const db = await getFirebaseFirestore();
            await setDoc(doc(db, 'pranaverse_reels', reel.id), { likes: increment(1) }, { merge: true });
        } catch { /* offline */ }
    }, [liked, reel.id, isLoggedIn]);

    const postComment = useCallback(async () => {
        if (!commentText.trim() || posting || !isLoggedIn) return;
        setPosting(true);
        const text = commentText.trim();
        setCommentText('');
        try {
            const { getFirebaseFirestore } = await import('@/lib/firebase');
            const { getFirebaseAuth } = await import('@/lib/firebase');
            const { collection, addDoc } = await import('firebase/firestore');
            const db = await getFirebaseFirestore();
            const auth = await getFirebaseAuth();
            const author = auth.currentUser?.displayName || 'Sadhak';
            await addDoc(collection(db, 'pranaverse_reels', reel.id, 'comments'), { text, author, ts: Date.now() });
        } catch { /* offline */ }
        setPosting(false);
    }, [commentText, posting, reel.id, isLoggedIn]);

    const handleShare = useCallback(async () => {
        const url = `${window.location.origin}/pranaverse/reel/${reel.id}`;
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({
                    title: `🕉️ ${reel.label} — PranaVerse`,
                    text: '✨ Experience this sacred reel — join the world\'s most conscious social network',
                    url,
                });
            } catch { /* dismissed */ }
        } else {
            try { navigator.clipboard.writeText(url); } catch { /* no clipboard */ }
        }
    }, [reel]);

    const cmtCount = comments.length;
    const showGate = authChecked && !isLoggedIn;

    // ── Loading skeleton ───────────────────────────────────────────────────────
    if (!authChecked) {
        return (
            <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
                <motion.div
                    animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ fontSize: '2.5rem', filter: `drop-shadow(0 0 20px ${reel.color})` }}
                >
                    ✦
                </motion.div>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', fontFamily: "'Outfit', sans-serif" }}>
                    Loading PranaVerse…
                </p>
            </div>
        );
    }

    return (
        <motion.div
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={handleTap}
        >
            {/* ── Full-screen media ── */}
            <div style={{ position: 'relative', width: '100%', height: '100%', maxWidth: 420, overflow: 'hidden' }}>
                <img src={reel.imageUrl} alt={reel.label}
                    style={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%',
                        objectFit: 'cover',
                        filter: showGate ? 'blur(3px) brightness(0.55)' : 'none',
                        transition: 'filter 0.6s ease',
                    }}
                />

                {/* Cinematic gradients */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.12) 45%, rgba(0,0,0,0.38) 100%)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 55%, rgba(0,0,0,0.5) 100%)' }} />

                {/* ── Top bar (only when logged in) ── */}
                {isLoggedIn && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '1rem 1rem 0.5rem', background: 'linear-gradient(180deg,rgba(0,0,0,0.65) 0%,transparent 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                            <button onClick={e => { e.stopPropagation(); router.back(); }}
                                style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '50%', width: 36, height: 36, color: '#fff', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
                            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.15rem', color: 'rgba(251,191,36,0.95)', fontWeight: 600, letterSpacing: '0.04em' }}>PranaVerse</span>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setMuted(m => !m); }}
                            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '50%', width: 36, height: 36, color: '#fff', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {muted ? '🔇' : '🔊'}
                        </button>
                    </div>
                )}

                {/* ── Text overlay (visible even behind gate as teaser) ── */}
                <div style={{ position: 'absolute', bottom: showGate ? '62%' : '17%', left: '1rem', right: showGate ? '1rem' : '5rem', zIndex: 20, transition: 'bottom 0.5s ease' }}>
                    {reel.type === 'resonance' ? (
                        <>
                            <div style={{ fontSize: '0.65rem', color: reel.color, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.4rem', fontFamily: "'Inter',sans-serif", textShadow: `0 0 12px ${reel.color}88` }}>{reel.sublabel}</div>
                            <p style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 'clamp(1.4rem,6vw,2rem)', fontWeight: 700, color: '#fff', textShadow: '0 2px 16px rgba(0,0,0,0.8)', marginBottom: reel.mantra ? '0.5rem' : '0', lineHeight: 1.2 }}>{reel.label}</p>
                            {reel.mantra && <p style={{ fontFamily: "'Noto Serif Devanagari',serif", fontSize: 'clamp(0.85rem,3vw,1.1rem)', color: `${reel.color}cc`, textShadow: `0 0 20px ${reel.color}66`, lineHeight: 1.5 }}>{reel.mantra}</p>}
                        </>
                    ) : (
                        <>
                            <p style={{ fontFamily: "'Cormorant Garamond','Noto Serif Devanagari',serif", fontSize: 'clamp(1.3rem,5vw,1.75rem)', fontWeight: 600, color: reel.color, textShadow: `0 0 30px ${reel.color}88`, marginBottom: '0.4rem', lineHeight: 1.3 }}>{reel.label}</p>
                            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 'clamp(0.65rem,2.5vw,0.85rem)', color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', letterSpacing: '0.04em' }}>{(reel as any).transliteration}</p>
                            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 'clamp(0.55rem,2vw,0.72rem)', color: 'rgba(255,255,255,0.55)', marginTop: '0.2rem' }}>{(reel as any).meaning}</p>
                        </>
                    )}
                    {/* ONE SUTRA CTA for logged-in visitors */}
                    {isLoggedIn && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                            style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.35)', borderRadius: 99, padding: '0.4rem 0.9rem', cursor: 'pointer' }}
                            onClick={e => { e.stopPropagation(); router.push('/pranaverse'); }}>
                            <span style={{ fontSize: '0.62rem', color: '#fbbf24', fontFamily: "'Inter',sans-serif", fontWeight: 700, letterSpacing: '0.05em' }}>🕉️ Explore PranaVerse →</span>
                        </motion.div>
                    )}
                </div>

                {/* ── Right action sidebar (logged in only) ── */}
                {isLoggedIn && (
                    <div style={{ position: 'absolute', right: '0.75rem', bottom: '18%', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', zIndex: 20 }}>
                        {/* Heart */}
                        <motion.button whileTap={{ scale: 0.8 }} onClick={e => { e.stopPropagation(); triggerLike(); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                            <motion.div animate={liked ? { scale: [1, 1.38, 1] } : { scale: 1 }} transition={{ duration: 0.32 }}
                                style={{ width: 50, height: 50, borderRadius: 18, background: liked ? 'rgba(239,68,68,0.22)' : 'rgba(0,0,0,0.50)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', border: `1.5px solid ${liked ? 'rgba(239,68,68,0.55)' : 'rgba(255,255,255,0.18)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="23" height="23" viewBox="0 0 24 24" fill={liked ? '#ef4444' : 'none'} stroke={liked ? '#ef4444' : 'rgba(255,255,255,0.9)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                            </motion.div>
                            <span style={{ fontSize: '0.56rem', color: liked ? '#ef4444' : 'rgba(255,255,255,0.78)', fontFamily: "'Inter',sans-serif", fontWeight: 700 }}>
                                {liveLikes > 999 ? `${(liveLikes / 1000).toFixed(1)}K` : liveLikes}
                            </span>
                        </motion.button>

                        {/* Comment */}
                        <motion.button whileTap={{ scale: 0.8 }} onClick={e => { e.stopPropagation(); setShowCmts(v => !v); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 50, height: 50, borderRadius: 18, background: showComments ? 'rgba(139,92,246,0.22)' : 'rgba(0,0,0,0.50)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', border: `1.5px solid ${showComments ? 'rgba(139,92,246,0.55)' : 'rgba(255,255,255,0.18)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={showComments ? '#8b5cf6' : 'rgba(255,255,255,0.9)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                            </div>
                            <span style={{ fontSize: '0.56rem', color: showComments ? '#8b5cf6' : 'rgba(255,255,255,0.78)', fontFamily: "'Inter',sans-serif", fontWeight: 700 }}>
                                {cmtCount > 0 ? cmtCount : 'Comment'}
                            </span>
                        </motion.button>

                        {/* Share */}
                        <motion.button whileTap={{ scale: 0.8 }} onClick={e => { e.stopPropagation(); handleShare(); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 50, height: 50, borderRadius: 18, background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', border: '1.5px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                            </div>
                            <span style={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.78)', fontFamily: "'Inter',sans-serif", fontWeight: 700 }}>Share</span>
                        </motion.button>
                    </div>
                )}

                {/* ── Center heart flash ── */}
                <AnimatePresence>
                    {heartFlash && (
                        <motion.div
                            initial={{ scale: 0.3, opacity: 0.95 }}
                            animate={{ scale: [0.3, 1.5, 1.2], opacity: [0.95, 1, 0] }}
                            transition={{ duration: 0.75, ease: 'easeOut' }}
                            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 35, pointerEvents: 'none' }}>
                            <svg width="120" height="120" viewBox="0 0 24 24" fill="#ef4444" style={{ filter: 'drop-shadow(0 0 32px rgba(239,68,68,0.85)) drop-shadow(0 0 70px rgba(239,68,68,0.45))' }}>
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Comment bottom sheet ── */}
                <AnimatePresence>
                    {showComments && isLoggedIn && (
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
                            onClick={e => e.stopPropagation()}
                            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '62%', background: 'rgba(6,6,14,0.93)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', borderTop: '1px solid rgba(139,92,246,0.28)', borderRadius: '22px 22px 0 0', display: 'flex', flexDirection: 'column', zIndex: 40 }}
                        >
                            <div style={{ padding: '0.8rem 1.2rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>Comments{cmtCount > 0 ? ` (${cmtCount})` : ''}</span>
                                <button onClick={() => setShowCmts(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1 }}>×</button>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '0.6rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {comments.length === 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem', opacity: 0.5 }}>
                                        <span style={{ fontSize: '2rem' }}>🕉️</span>
                                        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter',sans-serif", textAlign: 'center' }}>Be the first to share sacred thoughts</p>
                                    </div>
                                ) : comments.map(c => (
                                    <div key={c.id} style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>🙏</div>
                                        <div>
                                            <div style={{ fontSize: '0.62rem', color: '#a78bfa', fontFamily: "'Inter',sans-serif", fontWeight: 700, marginBottom: '0.15rem' }}>{c.author}</div>
                                            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)', fontFamily: "'Inter',sans-serif", lineHeight: 1.5 }}>{c.text}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ padding: '0.65rem 1rem 1rem', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                                <input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && postComment()}
                                    placeholder="Add a sacred comment..."
                                    style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 99, padding: '0.55rem 1rem', color: '#fff', fontSize: '0.78rem', fontFamily: "'Inter',sans-serif", outline: 'none' }} />
                                <motion.button whileTap={{ scale: 0.92 }} onClick={postComment} disabled={!commentText.trim() || posting}
                                    style={{ background: commentText.trim() ? 'linear-gradient(135deg,#8b5cf6,#ec4899)' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 99, padding: '0.55rem 1.1rem', color: '#fff', fontSize: '0.75rem', fontWeight: 700, fontFamily: "'Inter',sans-serif", cursor: commentText.trim() ? 'pointer' : 'default', whiteSpace: 'nowrap' as const }}>
                                    Post
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Swipe hint (logged in only) ── */}
                {isLoggedIn && (
                    <div style={{ position: 'absolute', bottom: '5.5%', left: '50%', transform: 'translateX(-50%)', zIndex: 20, pointerEvents: 'none' }}>
                        <span style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Inter',sans-serif", letterSpacing: '0.05em' }}>Double-tap to like · Tap share to spread wisdom</span>
                    </div>
                )}

                {/* ── Google Auth Gate Overlay ── */}
                <AnimatePresence>
                    {showGate && (
                        <AuthGate
                            reel={reel}
                            onAuthSuccess={() => setIsLoggedIn(true)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
