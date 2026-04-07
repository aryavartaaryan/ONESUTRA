'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Search, Check, X, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useLifestyleEngine } from '@/hooks/useLifestyleEngine';
import type { HabitItem, LifeArea, HabitCategory, TrackingType } from '@/stores/lifestyleStore';

// ─── Habit Template Library ─────────────────────────────────────────────────────

interface HabitTemplate {
    id: string;
    name: string;
    icon: string;
    category: HabitCategory;
    lifeArea: LifeArea;
    trackingType: TrackingType;
    targetValue?: number;
    color: string;
    description: string;
    frequency: 'daily' | 'weekdays' | 'weekends';
}

const HABIT_LIBRARY: HabitTemplate[] = [
    // Morning
    { id: 't_wake_early', name: 'Wake Before 6am', icon: '🌅', category: 'morning', lifeArea: 'mental', trackingType: 'checkbox', color: '#fbbf24', description: 'Start the day with Brahma muhurta — the most potent time', frequency: 'daily' },
    { id: 't_tongue_scrape', name: 'Tongue Scraping', icon: '✨', category: 'morning', lifeArea: 'physical', trackingType: 'checkbox', color: '#4ade80', description: 'Ayurvedic oral detox each morning', frequency: 'daily' },
    { id: 't_oil_pull', name: 'Oil Pulling', icon: '💛', category: 'morning', lifeArea: 'physical', trackingType: 'duration', targetValue: 15, color: '#fde68a', description: '15 min Ayurvedic oral detox with sesame oil', frequency: 'daily' },
    { id: 't_cold_shower', name: 'Cold Shower', icon: '🚿', category: 'morning', lifeArea: 'physical', trackingType: 'checkbox', color: '#22d3ee', description: 'Activate the nervous system with cold water', frequency: 'daily' },
    { id: 't_sun_gaze', name: 'Sunrise Watching', icon: '☀️', category: 'morning', lifeArea: 'spiritual', trackingType: 'duration', targetValue: 5, color: '#f97316', description: 'Watch the first light — 5 min gentle sun exposure', frequency: 'daily' },
    { id: 't_morning_pages', name: 'Morning Pages', icon: '📝', category: 'morning', lifeArea: 'mental', trackingType: 'duration', targetValue: 15, color: '#a78bfa', description: '3 pages of free-flow stream of consciousness', frequency: 'daily' },
    { id: 't_lemon_water', name: 'Warm Lemon Water', icon: '🍋', category: 'morning', lifeArea: 'physical', trackingType: 'checkbox', color: '#fde68a', description: 'Alkalise and hydrate upon waking', frequency: 'daily' },
    { id: 't_affirmations', name: 'Affirmations', icon: '💬', category: 'morning', lifeArea: 'mental', trackingType: 'counter', targetValue: 5, color: '#c084fc', description: 'Speak 5 affirmations aloud with conviction', frequency: 'daily' },
    { id: 't_stretch', name: 'Morning Stretch', icon: '🌸', category: 'morning', lifeArea: 'physical', trackingType: 'duration', targetValue: 10, color: '#f472b6', description: '10 min gentle stretching to wake the body', frequency: 'daily' },

    // Spiritual / Sacred
    { id: 't_meditation', name: 'Meditation', icon: '🧘', category: 'sacred', lifeArea: 'spiritual', trackingType: 'duration', targetValue: 10, color: '#a78bfa', description: 'Daily sitting meditation practice', frequency: 'daily' },
    { id: 't_mantra', name: 'Mantra Japa', icon: '🕉️', category: 'sacred', lifeArea: 'spiritual', trackingType: 'counter', targetValue: 108, color: '#c084fc', description: 'Daily mantra repetition — 108 times', frequency: 'daily' },
    { id: 't_pranayama', name: 'Pranayama', icon: '🌬️', category: 'sacred', lifeArea: 'spiritual', trackingType: 'duration', targetValue: 10, color: '#22d3ee', description: 'Conscious breathing practice', frequency: 'daily' },
    { id: 't_journaling', name: 'Spiritual Journal', icon: '📔', category: 'sacred', lifeArea: 'spiritual', trackingType: 'checkbox', color: '#fde68a', description: 'Reflect on your inner journey', frequency: 'daily' },
    { id: 't_gratitude', name: 'Gratitude Practice', icon: '🙏', category: 'morning', lifeArea: 'spiritual', trackingType: 'counter', targetValue: 3, color: '#fb923c', description: 'Write 3 genuine things you\'re grateful for', frequency: 'daily' },
    { id: 't_nature', name: 'Time in Nature', icon: '🌳', category: 'anytime', lifeArea: 'spiritual', trackingType: 'duration', targetValue: 20, color: '#4ade80', description: 'Mindful time outdoors — barefoot if possible', frequency: 'daily' },

    // Physical
    { id: 't_exercise', name: 'Exercise', icon: '💪', category: 'anytime', lifeArea: 'physical', trackingType: 'duration', targetValue: 30, color: '#4ade80', description: 'Any form of physical movement', frequency: 'daily' },
    { id: 't_yoga', name: 'Yoga Asanas', icon: '🌺', category: 'morning', lifeArea: 'physical', trackingType: 'duration', targetValue: 20, color: '#f472b6', description: 'Daily yoga practice', frequency: 'daily' },
    { id: 't_walk', name: 'Walk 10,000 Steps', icon: '🚶', category: 'anytime', lifeArea: 'physical', trackingType: 'numeric', targetValue: 10000, color: '#4ade80', description: 'Hit your daily step goal', frequency: 'daily' },
    { id: 't_water', name: 'Drink 2L Water', icon: '💧', category: 'anytime', lifeArea: 'physical', trackingType: 'numeric', targetValue: 8, color: '#60a5fa', description: 'Track glasses of water throughout the day', frequency: 'daily' },
    { id: 't_no_sugar', name: 'No Added Sugar', icon: '🚫', category: 'anytime', lifeArea: 'physical', trackingType: 'checkbox', color: '#f87171', description: 'Avoid added sugars for the day', frequency: 'daily' },
    { id: 't_sleep_early', name: 'Sleep by 10:30pm', icon: '🌙', category: 'evening', lifeArea: 'physical', trackingType: 'checkbox', color: '#818cf8', description: 'Honour your body\'s natural sleep cycle', frequency: 'daily' },
    { id: 't_no_phone_bed', name: 'No Phone in Bed', icon: '📵', category: 'evening', lifeArea: 'physical', trackingType: 'checkbox', color: '#a78bfa', description: 'No screens 30 min before sleep', frequency: 'daily' },

    // Mental / Focus
    { id: 't_read', name: 'Read 30 Minutes', icon: '📚', category: 'anytime', lifeArea: 'mental', trackingType: 'duration', targetValue: 30, color: '#60a5fa', description: 'Daily reading — books, not feeds', frequency: 'daily' },
    { id: 't_deep_work', name: 'Deep Work Block', icon: '🎯', category: 'midday', lifeArea: 'professional', trackingType: 'duration', targetValue: 90, color: '#fbbf24', description: 'Focused, undistracted work session', frequency: 'weekdays' },
    { id: 't_no_social', name: 'Social Media Fast', icon: '🔕', category: 'anytime', lifeArea: 'mental', trackingType: 'checkbox', color: '#f87171', description: 'No social media scrolling today', frequency: 'daily' },
    { id: 't_learning', name: 'Learn Something New', icon: '🧠', category: 'anytime', lifeArea: 'mental', trackingType: 'duration', targetValue: 20, color: '#22d3ee', description: 'Study, course, or skill-building', frequency: 'daily' },
    { id: 't_plan_day', name: 'Plan the Day', icon: '📋', category: 'morning', lifeArea: 'professional', trackingType: 'checkbox', color: '#fbbf24', description: 'Set your top 3 priorities for the day', frequency: 'weekdays' },
    { id: 't_review_day', name: 'Evening Review', icon: '🔍', category: 'evening', lifeArea: 'mental', trackingType: 'checkbox', color: '#a78bfa', description: 'Review what went well and what to improve', frequency: 'daily' },

    // Social / Relationships
    { id: 't_connect', name: 'Connect with Someone', icon: '🤝', category: 'anytime', lifeArea: 'social', trackingType: 'checkbox', color: '#fb923c', description: 'Reach out to a friend or family member', frequency: 'daily' },
    { id: 't_compliment', name: 'Give a Genuine Compliment', icon: '💝', category: 'anytime', lifeArea: 'social', trackingType: 'checkbox', color: '#f472b6', description: 'Offer sincere appreciation to someone', frequency: 'daily' },
    { id: 't_digital_detox', name: 'Digital Sunset', icon: '🌅', category: 'evening', lifeArea: 'social', trackingType: 'checkbox', color: '#fbbf24', description: 'No screens after 9pm', frequency: 'daily' },

    // Financial
    { id: 't_expenses', name: 'Track Expenses', icon: '💰', category: 'evening', lifeArea: 'financial', trackingType: 'checkbox', color: '#4ade80', description: 'Log all spending for today', frequency: 'daily' },
    { id: 't_save', name: 'Automatic Savings', icon: '🏦', category: 'anytime', lifeArea: 'financial', trackingType: 'checkbox', color: '#fbbf24', description: 'Pay yourself first — transfer to savings', frequency: 'weekdays' },
    { id: 't_no_impulse', name: 'No Impulse Purchases', icon: '🛑', category: 'anytime', lifeArea: 'financial', trackingType: 'checkbox', color: '#f87171', description: 'Ask "do I truly need this?" before buying', frequency: 'daily' },

    // Creative
    { id: 't_create', name: 'Create Something', icon: '🎨', category: 'anytime', lifeArea: 'creative', trackingType: 'duration', targetValue: 20, color: '#f472b6', description: 'Draw, write, make music, or build', frequency: 'daily' },
    { id: 't_write', name: 'Write 500 Words', icon: '✍️', category: 'anytime', lifeArea: 'creative', trackingType: 'numeric', targetValue: 500, color: '#a78bfa', description: 'Any form of creative or reflective writing', frequency: 'daily' },

    // Evening
    { id: 't_wind_down', name: 'Wind-Down Ritual', icon: '🕯️', category: 'evening', lifeArea: 'mental', trackingType: 'duration', targetValue: 15, color: '#818cf8', description: 'Prepare body and mind for sleep', frequency: 'daily' },
    { id: 't_nighttime_journal', name: 'Nighttime Reflection', icon: '🌙', category: 'evening', lifeArea: 'mental', trackingType: 'checkbox', color: '#c084fc', description: 'Reflect on 3 wins and 1 learning from today', frequency: 'daily' },
];

const LIFE_AREA_COLORS: Record<string, string> = {
    mental: '#22d3ee', physical: '#4ade80', social: '#fb923c',
    professional: '#fbbf24', financial: '#4ade80',
    spiritual: '#c084fc', creative: '#f472b6', sacred: '#fde68a',
};

const CATEGORY_LABELS: Record<string, string> = {
    morning: '🌅 Morning', midday: '☀️ Midday', evening: '🌙 Evening',
    anytime: '✦ Anytime', sacred: '🕉️ Sacred',
};

// ─── Custom Habit Form ──────────────────────────────────────────────────────────

interface CustomHabitForm {
    name: string;
    icon: string;
    category: HabitCategory;
    lifeArea: LifeArea;
    trackingType: TrackingType;
    targetValue: string;
    color: string;
    scheduledTime: string;
    frequency: 'daily' | 'weekdays' | 'weekends';
}

const ICON_OPTIONS = ['🌅', '🧘', '💪', '📚', '🙏', '💧', '🌿', '🔥', '⚡', '🎯', '🎨', '🌸', '✍️', '🌬️', '🕉️', '🏃', '🍎', '💡', '🌙', '⭐', '🦁', '🌊', '🎵', '🔱', '📿', '🕯️', '🌺', '🦋', '💫', '🌟'];

function CustomHabitSheet({ onClose, onSave }: { onClose: () => void; onSave: (habit: HabitItem) => void }) {
    const [form, setForm] = useState<CustomHabitForm>({
        name: '', icon: '⭐', category: 'morning', lifeArea: 'mental',
        trackingType: 'checkbox', targetValue: '', color: '#a78bfa',
        scheduledTime: '', frequency: 'daily',
    });
    const [step, setStep] = useState(0);

    const update = (k: keyof CustomHabitForm, v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSave = () => {
        if (!form.name.trim()) return;
        const habit: HabitItem = {
            id: `custom_${Date.now()}`,
            name: form.name.trim(),
            icon: form.icon,
            category: form.category,
            lifeArea: form.lifeArea,
            trackingType: form.trackingType,
            targetValue: form.targetValue ? Number(form.targetValue) : undefined,
            color: LIFE_AREA_COLORS[form.lifeArea] ?? '#a78bfa',
            scheduledTime: form.scheduledTime || undefined,
            frequency: form.frequency,
            isActive: true,
            createdAt: Date.now(),
        };
        onSave(habit);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(2,1,10,0.95)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(20px)' }}>
            <motion.div
                onClick={e => e.stopPropagation()}
                initial={{ y: 80 }} animate={{ y: 0 }}
                style={{
                    width: '100%', maxWidth: 480,
                    background: 'linear-gradient(160deg, rgba(168,85,247,0.1), rgba(6,3,18,0.98))',
                    border: '1px solid rgba(168,85,247,0.2)', borderRadius: '28px 28px 0 0',
                    padding: '1.75rem 1.5rem 2.5rem',
                    maxHeight: '90vh', overflowY: 'auto',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>Create Custom Habit</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={18} /></button>
                </div>

                {/* Name */}
                <div style={{ marginBottom: '1rem' }}>
                    <p style={labelStyle}>Habit name</p>
                    <input value={form.name} onChange={e => update('name', e.target.value)}
                        placeholder="e.g. Morning Journaling"
                        style={{ width: '100%', padding: '0.8rem', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.9rem', fontFamily: "'Outfit', sans-serif", outline: 'none', boxSizing: 'border-box' }} />
                </div>

                {/* Icon picker */}
                <div style={{ marginBottom: '1rem' }}>
                    <p style={labelStyle}>Pick an icon</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {ICON_OPTIONS.map(ic => (
                            <motion.button key={ic} whileTap={{ scale: 0.85 }} onClick={() => update('icon', ic)}
                                style={{ width: 40, height: 40, borderRadius: 10, border: `1.5px solid ${form.icon === ic ? 'rgba(168,85,247,0.6)' : 'rgba(255,255,255,0.1)'}`, background: form.icon === ic ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.04)', cursor: 'pointer', fontSize: '1.2rem' }}>
                                {ic}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Category */}
                <div style={{ marginBottom: '1rem' }}>
                    <p style={labelStyle}>When?</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {(Object.entries(CATEGORY_LABELS) as [HabitCategory, string][]).map(([cat, label]) => (
                            <motion.button key={cat} whileTap={{ scale: 0.9 }} onClick={() => update('category', cat)}
                                style={{ padding: '0.4rem 0.75rem', borderRadius: 10, background: form.category === cat ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${form.category === cat ? 'rgba(168,85,247,0.45)' : 'rgba(255,255,255,0.1)'}`, color: form.category === cat ? '#c084fc' : 'rgba(255,255,255,0.5)', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif", cursor: 'pointer' }}>{label}</motion.button>
                        ))}
                    </div>
                </div>

                {/* Life Area */}
                <div style={{ marginBottom: '1rem' }}>
                    <p style={labelStyle}>Life area</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {(['mental', 'physical', 'spiritual', 'professional', 'social', 'financial', 'creative'] as LifeArea[]).map(area => (
                            <motion.button key={area} whileTap={{ scale: 0.9 }} onClick={() => update('lifeArea', area)}
                                style={{
                                    padding: '0.4rem 0.75rem', borderRadius: 10, cursor: 'pointer',
                                    background: form.lifeArea === area ? `${LIFE_AREA_COLORS[area]}22` : 'rgba(255,255,255,0.04)',
                                    border: `1px solid ${form.lifeArea === area ? LIFE_AREA_COLORS[area] + '55' : 'rgba(255,255,255,0.1)'}`,
                                    color: form.lifeArea === area ? LIFE_AREA_COLORS[area] : 'rgba(255,255,255,0.5)',
                                    fontSize: '0.72rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif",
                                    textTransform: 'capitalize',
                                }}>{area}</motion.button>
                        ))}
                    </div>
                </div>

                {/* Tracking type */}
                <div style={{ marginBottom: '1rem' }}>
                    <p style={labelStyle}>How to track?</p>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {([['checkbox', 'Done/Not Done'], ['counter', 'Count'], ['duration', 'Duration (min)'], ['numeric', 'Number']] as [TrackingType, string][]).map(([type, label]) => (
                            <motion.button key={type} whileTap={{ scale: 0.9 }} onClick={() => update('trackingType', type)}
                                style={{ flex: 1, padding: '0.45rem 0', borderRadius: 10, background: form.trackingType === type ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${form.trackingType === type ? 'rgba(168,85,247,0.45)' : 'rgba(255,255,255,0.1)'}`, color: form.trackingType === type ? '#c084fc' : 'rgba(255,255,255,0.45)', fontSize: '0.62rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif", cursor: 'pointer' }}>{label}</motion.button>
                        ))}
                    </div>
                </div>

                {/* Target value (if applicable) */}
                {form.trackingType !== 'checkbox' && (
                    <div style={{ marginBottom: '1rem' }}>
                        <p style={labelStyle}>Target {form.trackingType === 'duration' ? '(minutes)' : form.trackingType === 'counter' ? '(count)' : '(number)'}</p>
                        <input type="number" value={form.targetValue} onChange={e => update('targetValue', e.target.value)}
                            placeholder="e.g. 10"
                            style={{ width: '100%', padding: '0.7rem', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.9rem', fontFamily: "'Outfit', sans-serif", outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                )}

                {/* Frequency */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <p style={labelStyle}>Frequency</p>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {(['daily', 'weekdays', 'weekends'] as const).map(freq => (
                            <motion.button key={freq} whileTap={{ scale: 0.9 }} onClick={() => update('frequency', freq)}
                                style={{ flex: 1, padding: '0.5rem 0', borderRadius: 10, background: form.frequency === freq ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${form.frequency === freq ? 'rgba(168,85,247,0.45)' : 'rgba(255,255,255,0.1)'}`, color: form.frequency === freq ? '#c084fc' : 'rgba(255,255,255,0.45)', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif", cursor: 'pointer', textTransform: 'capitalize' }}>{freq}</motion.button>
                        ))}
                    </div>
                </div>

                <motion.button whileTap={{ scale: 0.97 }}
                    onClick={handleSave}
                    disabled={!form.name.trim()}
                    style={{
                        width: '100%', padding: '1rem', borderRadius: 14,
                        background: form.name.trim() ? 'linear-gradient(135deg, #a855f7, #7c3aed)' : 'rgba(255,255,255,0.08)',
                        border: 'none', color: '#fff', fontWeight: 800, fontSize: '0.9rem',
                        fontFamily: "'Outfit', sans-serif", cursor: form.name.trim() ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    }}>
                    <Plus size={16} /> Add Habit
                </motion.button>
            </motion.div>
        </motion.div>
    );
}

const labelStyle: React.CSSProperties = {
    margin: '0 0 0.5rem', fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)',
    fontFamily: "'Outfit', sans-serif", fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
};

// ─── Habit Row (manage view) ────────────────────────────────────────────────────

function ManageHabitRow({ habit, streak, onToggle, onDelete }: {
    habit: HabitItem; streak: number; onToggle: () => void; onDelete: () => void;
}) {
    const color = LIFE_AREA_COLORS[habit.lifeArea] ?? '#a78bfa';
    return (
        <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}
            style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 0.9rem', borderRadius: 14,
                background: habit.isActive ? `${color}08` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${habit.isActive ? color + '28' : 'rgba(255,255,255,0.06)'}`,
                marginBottom: '0.5rem', opacity: habit.isActive ? 1 : 0.5,
                transition: 'all 0.2s',
            }}>
            <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{habit.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '0.86rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', fontFamily: "'Outfit', sans-serif" }}>{habit.name}</p>
                <p style={{ margin: '1px 0 0', fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>
                    {CATEGORY_LABELS[habit.category]} · {habit.lifeArea}
                    {streak > 0 ? ` · 🔥${streak}` : ''}
                </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <motion.button whileTap={{ scale: 0.88 }} onClick={onToggle}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: habit.isActive ? color : 'rgba(255,255,255,0.25)', padding: 4 }}>
                    {habit.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </motion.button>
                <motion.button whileTap={{ scale: 0.88 }} onClick={onDelete}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: 4 }}>
                    <Trash2 size={14} />
                </motion.button>
            </div>
        </motion.div>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function HabitsPage() {
    const router = useRouter();
    const { habits, streaks, addHabit, updateHabit, removeHabit } = useLifestyleEngine();
    const [isMounted, setIsMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<'library' | 'my_habits'>('library');
    const [showCustomForm, setShowCustomForm] = useState(false);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

    const myHabitIds = new Set(habits.map(h => h.id));

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleAddFromLibrary = useCallback((template: HabitTemplate) => {
        const habit: HabitItem = {
            ...template,
            isActive: true,
            createdAt: Date.now(),
        };
        addHabit(habit);
        setAddedIds(prev => new Set([...prev, template.id]));
    }, [addHabit]);

    const handleCustomSave = useCallback((habit: HabitItem) => {
        addHabit(habit);
        setShowCustomForm(false);
    }, [addHabit]);

    const filteredTemplates = HABIT_LIBRARY.filter(t => {
        const matchesSearch = search === '' || t.name.toLowerCase().includes(search.toLowerCase());
        const matchesCat = categoryFilter === 'all' || t.category === categoryFilter || t.lifeArea === categoryFilter;
        return matchesSearch && matchesCat;
    });

    const categoriesForFilter = [
        { id: 'all', label: 'All' },
        { id: 'morning', label: '🌅 Morning' },
        { id: 'sacred', label: '🕉️ Sacred' },
        { id: 'physical', label: '💪 Physical' },
        { id: 'mental', label: '🧠 Mental' },
        { id: 'evening', label: '🌙 Evening' },
        { id: 'professional', label: '🎯 Work' },
        { id: 'social', label: '🤝 Social' },
        { id: 'financial', label: '💰 Financial' },
        { id: 'creative', label: '🎨 Creative' },
    ];

    if (!isMounted) return null;

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(ellipse at 25% 0%, rgba(251,191,36,0.08) 0%, transparent 55%), #030110',
            paddingBottom: '5rem',
            fontFamily: "'Outfit', sans-serif",
        }}>
            <AnimatePresence>
                {showCustomForm && (
                    <CustomHabitSheet onClose={() => setShowCustomForm(false)} onSave={handleCustomSave} />
                )}
            </AnimatePresence>

            {/* Header */}
            <div style={{ padding: '1.25rem 1.25rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button onClick={() => router.back()}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, padding: 0 }}>
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>Habit Library</h1>
                        <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>{habits.filter(h => h.isActive).length} active practices</p>
                    </div>
                </div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowCustomForm(true)}
                    style={{
                        padding: '0.45rem 0.85rem', borderRadius: 12,
                        background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.28)',
                        color: '#fbbf24', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif",
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                    <Plus size={13} /> Custom
                </motion.button>
            </div>

            <div style={{ padding: '1rem 1.25rem 0' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setActiveTab('library')}
                        style={{ flex: 1, padding: '0.5rem', borderRadius: 10, background: activeTab === 'library' ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${activeTab === 'library' ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.08)'}`, color: activeTab === 'library' ? '#fbbf24' : 'rgba(255,255,255,0.45)', fontSize: '0.75rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif", cursor: 'pointer' }}>
                        Browse Library
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setActiveTab('my_habits')}
                        style={{ flex: 1, padding: '0.5rem', borderRadius: 10, background: activeTab === 'my_habits' ? 'rgba(168,85,247,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${activeTab === 'my_habits' ? 'rgba(168,85,247,0.35)' : 'rgba(255,255,255,0.08)'}`, color: activeTab === 'my_habits' ? '#c084fc' : 'rgba(255,255,255,0.45)', fontSize: '0.75rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif", cursor: 'pointer' }}>
                        My Habits ({habits.length})
                    </motion.button>
                </div>

                {/* Library tab */}
                {activeTab === 'library' && (
                    <AnimatePresence mode="wait">
                        <motion.div key="library" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {/* Search */}
                            <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search habits..."
                                    style={{ width: '100%', padding: '0.65rem 0.65rem 0.65rem 2rem', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem', fontFamily: "'Outfit', sans-serif", outline: 'none', boxSizing: 'border-box' }} />
                            </div>

                            {/* Category filter */}
                            <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '0.75rem', scrollbarWidth: 'none' }}>
                                {categoriesForFilter.map(c => (
                                    <motion.button key={c.id} whileTap={{ scale: 0.88 }}
                                        onClick={() => setCategoryFilter(c.id)}
                                        style={{ flexShrink: 0, padding: '0.3rem 0.65rem', borderRadius: 999, cursor: 'pointer', background: categoryFilter === c.id ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${categoryFilter === c.id ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.08)'}`, color: categoryFilter === c.id ? '#fbbf24' : 'rgba(255,255,255,0.4)', fontSize: '0.65rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{c.label}</motion.button>
                                ))}
                            </div>

                            {filteredTemplates.map((template, i) => {
                                const alreadyAdded = myHabitIds.has(template.id) || addedIds.has(template.id);
                                const color = LIFE_AREA_COLORS[template.lifeArea] ?? '#a78bfa';
                                return (
                                    <motion.div key={template.id}
                                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                                            padding: '0.8rem 0.9rem', borderRadius: 14,
                                            background: alreadyAdded ? `${color}08` : 'rgba(255,255,255,0.03)',
                                            border: `1px solid ${alreadyAdded ? color + '25' : 'rgba(255,255,255,0.07)'}`,
                                            marginBottom: '0.5rem',
                                        }}>
                                        <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{template.icon}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: 0, fontSize: '0.86rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', fontFamily: "'Outfit', sans-serif" }}>{template.name}</p>
                                            <p style={{ margin: '2px 0 0', fontSize: '0.65rem', color: 'rgba(255,255,255,0.32)', fontFamily: "'Outfit', sans-serif" }}>{template.description.slice(0, 55)}…</p>
                                        </div>
                                        <motion.button
                                            whileTap={{ scale: 0.85 }}
                                            onClick={() => !alreadyAdded && handleAddFromLibrary(template)}
                                            style={{
                                                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                                background: alreadyAdded ? `${color}22` : 'rgba(255,255,255,0.06)',
                                                border: `1px solid ${alreadyAdded ? color + '44' : 'rgba(255,255,255,0.12)'}`,
                                                cursor: alreadyAdded ? 'default' : 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: alreadyAdded ? color : 'rgba(255,255,255,0.5)',
                                            }}>
                                            {alreadyAdded ? <Check size={14} /> : <Plus size={14} />}
                                        </motion.button>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>
                )}

                {/* My Habits tab */}
                {activeTab === 'my_habits' && (
                    <AnimatePresence mode="wait">
                        <motion.div key="my" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {habits.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                                    <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🌱</p>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontFamily: "'Outfit', sans-serif", marginBottom: '1rem' }}>Your habit list is empty. Browse the library to add practices.</p>
                                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setActiveTab('library')}
                                        style={{ padding: '0.6rem 1.25rem', borderRadius: 12, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24', fontSize: '0.8rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif", cursor: 'pointer' }}>
                                        Browse Library →
                                    </motion.button>
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {habits.map(habit => (
                                        <ManageHabitRow key={habit.id}
                                            habit={habit}
                                            streak={streaks[habit.id]?.currentStreak ?? 0}
                                            onToggle={() => updateHabit(habit.id, { isActive: !habit.isActive })}
                                            onDelete={() => removeHabit(habit.id)}
                                        />
                                    ))}
                                </AnimatePresence>
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
