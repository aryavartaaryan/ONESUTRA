'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Check, Plus, X, Save, User, Briefcase,
  Heart, Leaf, Music, Camera, BookOpen, Coffee, Wind,
  Flame, Star, Sun, Zap, Edit3,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useOneSutraAuth } from '@/hooks/useOneSutraAuth';
import { getFirebaseFirestore } from '@/lib/firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import styles from './edit.module.css';

/* ── Preset hobby options ── */
const HOBBY_PRESETS = [
  { icon: '🧘', label: 'Yoga' },
  { icon: '🍳', label: 'Cooking' },
  { icon: '📸', label: 'Photography' },
  { icon: '🎵', label: 'Sacred Sounds' },
  { icon: '📖', label: 'Vedic Study' },
  { icon: '🌿', label: 'Pranayama' },
  { icon: '🏃', label: 'Running' },
  { icon: '✍️', label: 'Journaling' },
  { icon: '🎨', label: 'Art & Design' },
  { icon: '🌱', label: 'Gardening' },
  { icon: '🏔️', label: 'Trekking' },
  { icon: '🧪', label: 'Ayurvedic Herbs' },
  { icon: '☕', label: 'Morning Rituals' },
  { icon: '🎭', label: 'Theater' },
  { icon: '🌊', label: 'Swimming' },
  { icon: '🎯', label: 'Archery' },
  { icon: '🤝', label: 'Community Service' },
  { icon: '📚', label: 'Reading' },
  { icon: '🎤', label: 'Singing' },
  { icon: '🌸', label: 'Floral Arrangement' },
];

const PRAKRITI_OPTIONS = ['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha', 'Tri-Dosha'];

/* ── Lifestyle tags ── */
const LIFESTYLE_TAGS = [
  { emoji: '🌱', label: 'Holistic Living' },
  { emoji: '🏃‍♂️', label: 'Traveller' },
  { emoji: '🌿', label: 'Plant-Based' },
  { emoji: '☀️', label: 'Early Riser' },
  { emoji: '🧘', label: 'Meditator' },
  { emoji: '💚', label: 'Health Conscious' },
  { emoji: '🐾', label: 'Animal Lover' },
  { emoji: '📚', label: 'Lifelong Learner' },
  { emoji: '🌍', label: 'Global Citizen' },
  { emoji: '🦷', label: 'Nature Lover' },
];

/* ── Relationship / Social Identity tags ── */
const SOCIAL_TAGS = [
  { emoji: '💆', label: 'FamilyFirst' },
  { emoji: '🤝', label: 'CommunityBuilder' },
  { emoji: '🐔', label: 'Animal & Plant Lover' },
  { emoji: '🏡', label: 'HomeBody' },
  { emoji: '💛', label: 'Empath' },
  { emoji: '🌟', label: 'Visionary' },
  { emoji: '👨‍👩‍👧‍👦', label: 'FamilyMan' },
  { emoji: '🤘', label: 'SocialButterfly' },
];

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useOneSutraAuth();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profession, setProfession] = useState('');
  const [prakriti, setPrakriti] = useState('Vata-Pitta');
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [lifestyleTags, setLifestyleTags] = useState<string[]>([]);
  const [socialTags, setSocialTags] = useState<string[]>([]);
  const [customHobby, setCustomHobby] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<'identity' | 'rituals' | 'ayurveda'>('identity');

  /* Load existing profile data */
  useEffect(() => {
    if (!user?.uid) return;
    let unsub: (() => void) | undefined;
    (async () => {
      try {
        const db = await getFirebaseFirestore();
        if (!db) return;
        unsub = onSnapshot(doc(db, 'onesutra_users', user.uid), (snap) => {
          if (snap.exists()) {
            const d = snap.data();
            setDisplayName(d.displayName || d.name || '');
            setBio(d.bio || '');
            setProfession(d.profession || '');
            setPrakriti(d.prakriti || 'Vata-Pitta');
            setHobbies(Array.isArray(d.hobbies) ? d.hobbies : []);
            setLifestyleTags(Array.isArray(d.lifestyleTags) ? d.lifestyleTags : []);
            setSocialTags(Array.isArray(d.socialTags) ? d.socialTags : []);
          }
        });
      } catch { /* offline */ }
    })();
    return () => unsub?.();
  }, [user?.uid]);

  const toggleHobby = (label: string) => {
    setHobbies((prev) =>
      prev.includes(label) ? prev.filter((h) => h !== label) : [...prev, label]
    );
  };

  const addCustomHobby = () => {
    const trimmed = customHobby.trim();
    if (trimmed && !hobbies.includes(trimmed)) {
      setHobbies((prev) => [...prev, trimmed]);
    }
    setCustomHobby('');
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      const db = await getFirebaseFirestore();
      if (!db) return;
      await updateDoc(doc(db, 'onesutra_users', user.uid), {
        displayName: displayName.trim(),
        name: displayName.trim(),
        bio: bio.trim(),
        profession: profession.trim(),
        prakriti,
        hobbies,
        lifestyleTags,
        socialTags,
        updatedAt: new Date().toISOString(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Aura orbs */}
      <div className={styles.auraOrb1} />
      <div className={styles.auraOrb2} />

      {/* Header */}
      <header className={styles.header}>
        <button className={styles.headerBtn} onClick={() => router.back()}>
          <ChevronLeft size={20} />
        </button>
        <div className={styles.headerCenter}>
          <span className={styles.headerBrand}>Edit Profile</span>
          <span className={styles.headerSub}>Aether Identity</span>
        </div>
        <motion.button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={saving}
          whileTap={{ scale: 0.95 }}
          animate={saved ? { background: 'rgba(52,211,153,0.18)', borderColor: 'rgba(52,211,153,0.45)' } : {}}
        >
          {saved ? <><Check size={14} /> Saved</> : <><Save size={14} /> Save</>}
        </motion.button>
      </header>

      {/* Section Tabs */}
      <div className={styles.tabs}>
        {(['identity', 'rituals', 'ayurveda'] as const).map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeSection === tab ? styles.tabActive : ''}`}
            onClick={() => setActiveSection(tab)}
          >
            {tab === 'identity' && <User size={13} />}
            {tab === 'rituals' && <Heart size={13} />}
            {tab === 'ayurveda' && <Leaf size={13} />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        <AnimatePresence mode="wait">

          {/* ── IDENTITY TAB ── */}
          {activeSection === 'identity' && (
            <motion.div
              key="identity"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
            >
              <div className={styles.glassTile}>
                <div className={styles.tileLabel}>
                  <User size={14} color="#A78BFA" /> Display Name
                </div>
                <input
                  className={styles.input}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your sacred name…"
                  maxLength={40}
                />
                <div className={styles.charCount}>{displayName.length}/40</div>
              </div>

              <div className={styles.glassTile}>
                <div className={styles.tileLabel}>
                  <Edit3 size={14} color="#60A5FA" /> Bio
                </div>
                <textarea
                  className={styles.textarea}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share your essence, your journey, your dharma…"
                  maxLength={160}
                  rows={3}
                />
                <div className={styles.charCount}>{bio.length}/160</div>
              </div>

              <div className={styles.glassTile}>
                <div className={styles.tileLabel}>
                  <Briefcase size={14} color="#FBBF24" /> Profession / Craft
                </div>
                <input
                  className={styles.input}
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="e.g. Yoga Teacher, Digital Marketer, Healer…"
                  maxLength={80}
                />
                <div className={styles.hint}>Separate multiple roles with commas</div>
              </div>

              {/* Lifestyle Tags */}
              <div className={styles.glassTile}>
                <div className={styles.tileLabelRow}>
                  <div className={styles.tileLabel}>
                    <Leaf size={14} color="#34D399" /> Lifestyle Tags
                  </div>
                  <span className={styles.selectedCount}>{lifestyleTags.length} selected</span>
                </div>
                <div className={styles.hobbyGrid}>
                  {LIFESTYLE_TAGS.map((t) => {
                    const selected = lifestyleTags.includes(t.label);
                    return (
                      <motion.button
                        key={t.label}
                        className={`${styles.hobbyChip} ${selected ? styles.hobbyChipActive : ''}`}
                        onClick={() => setLifestyleTags(prev => selected ? prev.filter(x => x !== t.label) : [...prev, t.label])}
                        whileTap={{ scale: 0.93 }}
                      >
                        <span className={styles.hobbyIcon}>{t.emoji}</span>
                        <span className={styles.hobbyLabel}>{t.label}</span>
                        {selected && <Check size={10} className={styles.hobbyCheck} />}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Social Identity / Relationship Tags */}
              <div className={styles.glassTile}>
                <div className={styles.tileLabelRow}>
                  <div className={styles.tileLabel}>
                    <Heart size={14} color="#F472B6" /> Social Identity
                  </div>
                  <span className={styles.selectedCount}>{socialTags.length} selected</span>
                </div>
                <p className={styles.tileDesc}>How do you identify in community?</p>
                <div className={styles.hobbyGrid}>
                  {SOCIAL_TAGS.map((t) => {
                    const selected = socialTags.includes(t.label);
                    return (
                      <motion.button
                        key={t.label}
                        className={`${styles.hobbyChip} ${selected ? styles.hobbyChipActive : ''}`}
                        onClick={() => setSocialTags(prev => selected ? prev.filter(x => x !== t.label) : [...prev, t.label])}
                        whileTap={{ scale: 0.93 }}
                      >
                        <span className={styles.hobbyIcon}>{t.emoji}</span>
                        <span className={styles.hobbyLabel}>{t.label}</span>
                        {selected && <Check size={10} className={styles.hobbyCheck} />}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── RITUALS TAB ── */}
          {activeSection === 'rituals' && (
            <motion.div
              key="rituals"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
            >
              <div className={styles.glassTile}>
                <div className={styles.tileLabelRow}>
                  <div className={styles.tileLabel}>
                    <Heart size={14} color="#F472B6" /> My Rituals & Interests
                  </div>
                  <span className={styles.selectedCount}>{hobbies.length} selected</span>
                </div>
                <p className={styles.tileDesc}>Select what resonates with your Pranic frequency.</p>
                <div className={styles.hobbyGrid}>
                  {HOBBY_PRESETS.map((h) => {
                    const selected = hobbies.includes(h.label);
                    return (
                      <motion.button
                        key={h.label}
                        className={`${styles.hobbyChip} ${selected ? styles.hobbyChipActive : ''}`}
                        onClick={() => toggleHobby(h.label)}
                        whileTap={{ scale: 0.93 }}
                      >
                        <span className={styles.hobbyIcon}>{h.icon}</span>
                        <span className={styles.hobbyLabel}>{h.label}</span>
                        {selected && <Check size={10} className={styles.hobbyCheck} />}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Custom hobby input */}
                <div className={styles.customWrap}>
                  <div className={styles.tileLabel} style={{ marginBottom: 8 }}>
                    <Plus size={13} color="#34D399" /> Add Custom Ritual
                  </div>
                  <div className={styles.customRow}>
                    <input
                      className={styles.input}
                      value={customHobby}
                      onChange={(e) => setCustomHobby(e.target.value)}
                      placeholder="e.g. Sound healing, Cold plunge…"
                      maxLength={30}
                      onKeyDown={(e) => e.key === 'Enter' && addCustomHobby()}
                    />
                    <button className={styles.addBtn} onClick={addCustomHobby}>
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Custom hobbies not in preset */}
                {hobbies.filter((h) => !HOBBY_PRESETS.find((p) => p.label === h)).length > 0 && (
                  <div className={styles.customChips}>
                    {hobbies
                      .filter((h) => !HOBBY_PRESETS.find((p) => p.label === h))
                      .map((h) => (
                        <span key={h} className={styles.customChip}>
                          🌟 {h}
                          <button className={styles.removeChipBtn} onClick={() => toggleHobby(h)}>
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── AYURVEDA TAB ── */}
          {activeSection === 'ayurveda' && (
            <motion.div
              key="ayurveda"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
            >
              <div className={styles.glassTile}>
                <div className={styles.tileLabel}>
                  <Leaf size={14} color="#34D399" /> Your Prakriti (Body Constitution)
                </div>
                <p className={styles.tileDesc}>Your Ayurvedic dosha defines your natural rhythm and vitality pattern.</p>
                <div className={styles.prakritiGrid}>
                  {PRAKRITI_OPTIONS.map((p) => (
                    <motion.button
                      key={p}
                      className={`${styles.prakritiBtn} ${prakriti === p ? styles.prakritiBtnActive : ''}`}
                      onClick={() => setPrakriti(p)}
                      whileTap={{ scale: 0.95 }}
                    >
                      {prakriti === p && <Check size={11} />}
                      {p}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className={styles.glassTile} style={{ borderColor: 'rgba(245,158,11,0.14)' }}>
                <div className={styles.doshaInfo}>
                  <div className={styles.doshaEmoji}>
                    {prakriti.includes('Vata') ? '🌬️' : prakriti.includes('Pitta') ? '🔥' : '🌊'}
                  </div>
                  <div>
                    <div className={styles.doshaName}>{prakriti} Constitution</div>
                    <div className={styles.doshaDesc}>
                      {prakriti === 'Vata' && 'Creative, quick, light — governs movement and breath.'}
                      {prakriti === 'Pitta' && 'Sharp, intense, transformative — governs metabolism and fire.'}
                      {prakriti === 'Kapha' && 'Stable, grounded, nurturing — governs structure and fluids.'}
                      {prakriti === 'Vata-Pitta' && 'Energetic and driven — creative fire with swift movement.'}
                      {prakriti === 'Pitta-Kapha' && 'Strong and determined — transformative power with stability.'}
                      {prakriti === 'Vata-Kapha' && 'Fluid and intuitive — lightness grounded in deep calm.'}
                      {prakriti === 'Tri-Dosha' && 'Rare balanced constitution — harmony of all three forces.'}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Floating save button */}
      <motion.button
        className={styles.floatSaveBtn}
        onClick={handleSave}
        disabled={saving}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {saving ? (
          <div className={styles.spinner} style={{ width: 18, height: 18, borderWidth: 2 }} />
        ) : saved ? (
          <><Check size={16} /> Saved to Aether</>
        ) : (
          <><Save size={16} /> Save Changes</>
        )}
      </motion.button>
    </div>
  );
}
