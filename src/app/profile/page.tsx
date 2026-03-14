'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, ChevronLeft, Star, Zap, Leaf, BookOpen, Heart, BarChart3, Edit2, Save, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCircadianBackground } from '@/hooks/useCircadianBackground';
import { useOneSutraAuth } from '@/hooks/useOneSutraAuth';
import { getFirebaseFirestore } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import styles from './page.module.css';

// ════════════════════════════════════════════════════════
//  TYPES & DEFAULTS
// ════════════════════════════════════════════════════════
type Dosha = 'vata' | 'pitta' | 'kapha';

interface UserProfileData {
    name: string;
    title: string;
    joined: string;
    prakriti: string; // e.g. "Vata-Pitta"
    dosha: Dosha;     // dominant dosha for visuals
    vibeConnections: number;
    // We'll keep these structure for now, populate from real data if available or defaults
    stats: Array<{ label: string; value: string | number; unit: string; icon: any }>;
    badges: Array<{ id: string; label: string; emoji: string; earned: boolean }>;
}

const DEFAULT_PROFILE: UserProfileData = {
    name: 'Traveller',
    title: 'Sattvik Seeker',
    joined: 'Just now',
    prakriti: 'Vata-Pitta',
    dosha: 'vata',
    vibeConnections: 0,
    stats: [
        { label: 'Days Active', value: '1', unit: 'day', icon: Star },
        { label: 'Meditations', value: '0', unit: 'sessions', icon: Heart },
        { label: 'Habits Done', value: '0', unit: '%', icon: Zap },
        { label: 'Focus Hours', value: '0', unit: 'hrs', icon: BarChart3 },
    ],
    badges: [
        { id: 'riser', label: 'Early Riser', emoji: '🌅', earned: false },
        { id: 'sattvik', label: 'Sattvik', emoji: '🌿', earned: false },
        { id: 'calm', label: 'Calm Mind', emoji: '🪷', earned: false },
    ],
};

function normalizeDosha(prakriti: string): Dosha {
    const lower = (prakriti || '').toLowerCase();
    if (lower.includes('vata')) return 'vata';
    if (lower.includes('pitta')) return 'pitta';
    if (lower.includes('kapha')) return 'kapha';
    return 'vata'; // detailed logic can be added later
}

// ════════════════════════════════════════════════════════
//  VIBE ENERGY BODY — generative animated avatar canvas
// ════════════════════════════════════════════════════════
function drawEnergyBody(canvas: HTMLCanvasElement, dosha: Dosha, time: number) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    ctx.clearRect(0, 0, W, H);

    const palette = {
        vata: ['#9d4edd', '#c77dff', '#64b5f6', '#7b2ff7'],
        pitta: ['#ff6b35', '#ffd60a', '#ff4500', '#ff9b00'],
        kapha: ['#40916c', '#52b788', '#2166ac', '#74c69d'],
    }[dosha] || ['#9d4edd', '#c77dff', '#64b5f6', '#7b2ff7'];

    const aura = ctx.createRadialGradient(cx, cy, 10, cx, cy, W * 0.48);
    aura.addColorStop(0, palette[0] + '22');
    aura.addColorStop(0.6, palette[1] + '11');
    aura.addColorStop(1, 'transparent');
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, W, H);

    for (let ring = 0; ring < 4; ring++) {
        const phase = time * (0.4 + ring * 0.2) + ring * 0.8;
        const r = (W * 0.12 * (ring + 1)) + Math.sin(phase) * 6;
        const g = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r);
        g.addColorStop(0, 'transparent');
        g.addColorStop(0.5, palette[ring % palette.length] + '18');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(1, r), 0, Math.PI * 2);
        ctx.fill();
    }

    if (dosha === 'vata') {
        for (let a = 0; a < 5; a++) {
            ctx.beginPath();
            for (let i = 0; i < 60; i++) {
                const t = i / 60;
                const angle = t * 4 + time * 0.6 + (a / 5) * Math.PI * 2;
                const rad = t * W * 0.42 + Math.sin(time * 1.5 + a) * 5;
                const x = cx + Math.cos(angle) * rad;
                const y = cy + Math.sin(angle) * rad;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = palette[a % palette.length] + '44';
            ctx.lineWidth = 1.2;
            ctx.stroke();
        }
    }
    if (dosha === 'pitta') {
        for (let r = 1; r < 6; r++) {
            const phase = (time * 2 + r * 0.9) % (Math.PI * 2);
            const rad = Math.max(1, (r / 6) * W * 0.42 + Math.sin(phase) * 7);
            ctx.beginPath();
            ctx.arc(cx, cy, rad, 0, Math.PI * 2);
            ctx.strokeStyle = palette[r % palette.length] + '40';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }
    if (dosha === 'kapha') {
        for (let b = 0; b < 5; b++) {
            const t = time * 0.2 + b * 1.3;
            const bx = cx + Math.cos(t) * W * 0.18;
            const by = cy + Math.sin(t * 0.75) * H * 0.18;
            const br = Math.max(2, W * (0.18 + 0.04 * Math.sin(t * 0.5)));
            const gb = ctx.createRadialGradient(bx, by, 0, bx, by, br);
            gb.addColorStop(0, palette[b % palette.length] + '88');
            gb.addColorStop(1, 'transparent');
            ctx.fillStyle = gb;
            ctx.beginPath();
            ctx.ellipse(bx, by, br, Math.max(2, br * 1.1), t * 0.15, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.globalCompositeOperation = 'source-over';
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.12);
    coreGrad.addColorStop(0, palette[0] + 'cc');
    coreGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, W * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'destination-in';
    const clip = ctx.createRadialGradient(cx, cy, W * 0.25, cx, cy, W * 0.5);
    clip.addColorStop(0, 'rgba(0,0,0,1)');
    clip.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = clip;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
}

function VibeAvatarBody({ dosha, size = 110 }: { dosha: Dosha; size?: number }) {
    const ref = useRef<HTMLCanvasElement>(null);
    const raf = useRef<number>(0);
    const t = useRef(0);
    useEffect(() => {
        const c = ref.current;
        if (!c) return;
        c.width = size; c.height = size;
        const loop = () => {
            t.current += 0.014;
            drawEnergyBody(c, dosha, t.current);
            raf.current = requestAnimationFrame(loop);
        };
        raf.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf.current);
    }, [dosha, size]);
    return <canvas ref={ref} style={{ borderRadius: '50%', width: size, height: size }} />;
}

// ════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════
export default function ProfilePage() {
    const { user } = useOneSutraAuth();
    const router = useRouter();
    const { imageUrl, loaded } = useCircadianBackground('vedic');
    
    // State
    const [profile, setProfile] = useState<UserProfileData>(DEFAULT_PROFILE);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    
    // Form State
    const [editForm, setEditForm] = useState({
        name: '',
        title: '',
        prakriti: '',
    });

    // Fetch data using onSnapshot for real-time updates
    useEffect(() => {
        if (!user) {
            // Not logged in -> maybe redirect? For now show default "Traveller"
            setIsLoading(false);
            return;
        }

        let unsubscribe = () => {};

        const fetchProfile = async () => {
            try {
                const db = await getFirebaseFirestore();
                const userDocRef = doc(db, 'onesutra_users', user.uid);
                
                unsubscribe = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        
                        // Merge with defaults
                        setProfile(prev => ({
                            ...prev,
                            name: data.name || user.name || 'Traveller',
                            title: data.title || 'Sattvik Seeker',
                            joined: data.joined || 'Feb 2025', // Should format this if it's a timestamp
                            prakriti: data.prakriti || 'Vata-Pitta',
                            dosha: normalizeDosha(data.prakriti || 'Vata'),
                            vibeConnections: data.vibeConnections || 0,
                            // If stats exist in doc, use them, else defaults
                            stats: data.stats ? data.stats.map((s: any) => ({
                                ...s,
                                icon: ({ 'Star': Star, 'Heart': Heart, 'Zap': Zap, 'BarChart3': BarChart3 } as any)[s.iconName] || Star // Map string icon names if stored
                            })) : DEFAULT_PROFILE.stats
                        }));
                        
                        // Sync edit form with fetched data initially
                        if (!isEditing) {
                             setEditForm({
                                name: data.name || user.name || '',
                                title: data.title || 'Sattvik Seeker',
                                prakriti: data.prakriti || 'Vata-Pitta',
                            });
                        }

                    } else {
                        // User exists in Auth but no doc -> Create placeholder or just show Auth name
                        const initialData = {
                            name: user.name || 'Traveller',
                            title: 'Sattvik Seeker',
                            prakriti: 'Vata-Pitta'
                        };
                        setProfile(prev => ({
                            ...prev,
                            ...initialData
                        }));
                        setEditForm(initialData);
                    }
                    setIsLoading(false);
                });
            } catch (error) {
                console.error("Error fetching profile:", error);
                setIsLoading(false);
            }
        };

        fetchProfile();

        return () => unsubscribe();
    }, [user, isEditing]); // Refetch if user changes. isEditing dependency ensures form sync logic works correctly if data updates while not editing.


    const handleSave = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const db = await getFirebaseFirestore();
            const userRef = doc(db, 'onesutra_users', user.uid);
            
            // Check if doc exists first, if not setDoc (merge), else updateDoc
            const snap = await getDoc(userRef);
            
            const updates = {
                name: editForm.name,
                title: editForm.title,
                prakriti: editForm.prakriti,
                updatedAt: new Date().toISOString()
            };

            if (snap.exists()) {
                await updateDoc(userRef, updates);
            } else {
                await setDoc(userRef, {
                    ...updates,
                    joined: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                    email: user.email // Store email for reference
                });
            }
            
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to save profile", err);
            alert("Failed to save changes. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        // localStorage.removeItem('pranav_has_started');
        // localStorage.removeItem('vedic_user_name');
        // Actually sign out if possible via auth context, but for now just clear local and redirect
        router.push('/');
    };

    // Calculate display dosha from current form state if editing, else profile
    const displayDosha = isEditing ? normalizeDosha(editForm.prakriti) : profile.dosha;

    return (
        <>
            {/* ── Circadian nature background ── */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 0,
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                transition: 'opacity 1.5s ease',
                opacity: loaded ? 1 : 0,
            }} aria-hidden />
            {/* Gradient scrim */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 1,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.48) 0%, rgba(0,0,0,0.78) 100%)',
                pointerEvents: 'none',
            }} aria-hidden />

            <main className={styles.page}>

                {/* ── Sticky Top Bar ── */}
                <motion.header
                    className={styles.topBar}
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    <button className={styles.backBtn} onClick={() => router.back()} aria-label="Go back">
                        <ChevronLeft size={20} strokeWidth={1.8} />
                    </button>
                    <div className={styles.topBarCenter}>
                        <span className={styles.topBarTitle}>Sanctuary</span>
                        <span className={styles.topBarSub}>Your Conscious Space</span>
                    </div>
                    
                    <div className={styles.topActions} style={{display:'flex', gap:'12px', alignItems:'center'}}>
                         {/* Edit Toggle */}
                        {user && !isEditing ? (
                            <button 
                                className={styles.iconBtn} 
                                onClick={() => setIsEditing(true)} 
                                title="Edit Profile"
                                style={{background:'rgba(255,255,255,0.1)', border:'none', borderRadius:'50%', width:'36px', height:'36px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', cursor:'pointer'}}
                            >
                                <Edit2 size={16} strokeWidth={1.8} />
                            </button>
                        ) : user && (
                            <div style={{display:'flex', gap:'8px'}}>
                                <button 
                                    onClick={() => setIsEditing(false)} 
                                    style={{background:'rgba(255,50,50,0.2)', border:'none', borderRadius:'50%', width:'36px', height:'36px', display:'flex', alignItems:'center', justifyContent:'center', color:'#ffcccc', cursor:'pointer'}}
                                >
                                    <X size={18} />
                                </button>
                                <button 
                                    onClick={handleSave} 
                                    style={{background:'rgba(50,255,100,0.2)', border:'none', borderRadius:'50%', width:'36px', height:'36px', display:'flex', alignItems:'center', justifyContent:'center', color:'#ccffcc', cursor:'pointer'}}
                                >
                                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={18} />}
                                </button>
                            </div>
                        )}

                        <button className={styles.logoutBtn} onClick={handleLogout} title="Log Out">
                            <LogOut size={16} strokeWidth={1.8} />
                        </button>
                    </div>
                </motion.header>

                <div className={styles.content}>

                    {/* ── Hero: Energy Avatar + Name ── */}
                    <motion.div
                        className={styles.hero}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                    >
                        <div className={styles.energyBodyWrap}>
                            <motion.div
                                className={styles.energyBodyBreath}
                                animate={{ scale: [1, 1.04, 1], opacity: [0.85, 1, 0.85] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <VibeAvatarBody dosha={displayDosha} size={110} />
                            </motion.div>
                            <span className={styles.avatarOmOverlay}>ॐ</span>
                        </div>
                        
                        <div className={styles.heroInfo}>
                            {isEditing ? (
                                <div className={styles.editForm} style={{display:'flex', flexDirection:'column', gap:'8px', width:'100%'}}>
                                    <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                                        <label style={{fontSize:'10px', color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.5px'}}>Name</label>
                                        <input 
                                            type="text" 
                                            value={editForm.name}
                                            onChange={(e) => setEditForm(prev => ({...prev, name: e.target.value}))}
                                            placeholder="Your Name"
                                            style={{background:'rgba(255,255,255,0.1)', border:'none', color:'white', padding:'8px 12px', borderRadius:'8px', fontSize:'16px', outline:'none'}}
                                        />
                                    </div>
                                    <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                                        <label style={{fontSize:'10px', color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.5px'}}>Title</label>
                                        <input 
                                            type="text" 
                                            value={editForm.title}
                                            onChange={(e) => setEditForm(prev => ({...prev, title: e.target.value}))}
                                            placeholder="Example: Searcher, Yogi"
                                            style={{background:'rgba(255,255,255,0.1)', border:'none', color:'white', padding:'8px 12px', borderRadius:'8px', fontSize:'14px', outline:'none'}}
                                        />
                                    </div>
                                    <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                                        <label style={{fontSize:'10px', color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.5px'}}>Prakriti</label>
                                        <select 
                                            value={editForm.prakriti}
                                            onChange={(e) => setEditForm(prev => ({...prev, prakriti: e.target.value}))}
                                            style={{background:'rgba(255,255,255,0.1)', border:'none', color:'white', padding:'8px 12px', borderRadius:'8px', fontSize:'14px', outline:'none', appearance:'none'}}
                                        >
                                            <option value="Vata" style={{color:'black'}}>Vata</option>
                                            <option value="Pitta" style={{color:'black'}}>Pitta</option>
                                            <option value="Kapha" style={{color:'black'}}>Kapha</option>
                                            <option value="Vata-Pitta" style={{color:'black'}}>Vata-Pitta</option>
                                            <option value="Pitta-Kapha" style={{color:'black'}}>Pitta-Kapha</option>
                                            <option value="Kapha-Vata" style={{color:'black'}}>Kapha-Vata</option>
                                            <option value="Tridoshic" style={{color:'black'}}>Tridoshic</option>
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h1 className={styles.heroName}>{isLoading ? '...' : profile.name}</h1>
                                    <span className={styles.heroTitle} style={{opacity:0.8}}>{profile.title}</span>
                                    <span className={styles.heroPrakriti} style={{marginTop:'4px', display:'inline-block', padding:'4px 10px', background:'rgba(255,255,255,0.1)', borderRadius:'12px', fontSize:'12px', letterSpacing:'0.5px'}}>
                                        Prakriti · <span style={{fontWeight:600}}>{profile.prakriti}</span>
                                    </span>
                                </>
                            )}
                            
                            <span className={styles.heroJoined} style={{marginTop:'12px', fontSize:'11px', opacity:0.4}}>Member since {profile.joined}</span>
                            
                            {!isEditing && (
                                <div className={styles.vibeConnections} style={{marginTop:'16px', display:'flex', flexDirection:'column', alignItems:'center', gap:'2px'}}>
                                    <span className={styles.vibeCount} style={{fontWeight:'700', fontSize:'20px', color:'#a5d8ff'}}>{profile.vibeConnections}</span>
                                    <span className={styles.vibeLabel} style={{fontSize:'10px', opacity:0.6, textTransform:'uppercase', letterSpacing:'1px'}}>Vibe Connections</span>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* ── Stats bento row ── */}
                    <motion.div
                        className={styles.statsRow}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.12, ease: 'easeOut' }}
                    >
                        {profile.stats.map((s, i) => {
                            const Icon = s.icon;
                            return (
                                <div key={s.label} className={styles.statCard}>
                                    {Icon && <Icon size={16} strokeWidth={1.6} className={styles.statIcon} />}
                                    <span className={styles.statValue}>{s.value}</span>
                                    <span className={styles.statUnit}>{s.unit}</span>
                                    <span className={styles.statLabel}>{s.label}</span>
                                </div>
                            );
                        })}
                    </motion.div>

                    {/* Tabs Placeholder - could be expanded later */}
                    <motion.div
                        className={styles.tabs}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                         {/* Content for tabs like Badges, History etc can go here */}
                    </motion.div>

                </div>
            </main>
        </>
    );
}
