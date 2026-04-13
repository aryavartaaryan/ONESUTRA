/**
 * Shared Ayurvedic Habits Data Source
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth used by:
 *  1. SmartLogBubbles (home page bubble row)
 *  2. LifestylePanel  (home page "Your Log Progress" section)
 *  3. /lifestyle/ayurvedic-habits page
 *
 * Firestore key: `users/{uid}/habit_logs`  →  logHabitAndSync() writes here
 * LocalStorage fallback: `onesutra_ayur_habits_v1`
 */

export type AyurCategory = 'morning' | 'midday' | 'evening' | 'night' | 'anytime';

export interface AyurvedicHabit {
    id: string;
    name: string;
    nameHi: string;
    emoji: string;
    category: AyurCategory;
    targetMin: number;
    description: string;
    /** dosha balancing effect: negative = reduces, positive = aggravates */
    doshaEffect: { vata: number; pitta: number; kapha: number };
    bestFor: string[];
    tags: string[];
}

// ─── Full Ayurvedic Habits Library ───────────────────────────────────────────
export const AYURVEDIC_HABITS: AyurvedicHabit[] = [
    // ── Morning ──────────────────────────────────────────────────────────────
    { id: 'warm_water_morning', name: 'Ushapana (Warm Water)', nameHi: 'उषापान', emoji: '💧', category: 'morning', targetMin: 5, description: 'Drink 2–4 glasses of warm water upon waking. Flushes Ama and activates Agni for the day.', doshaEffect: { vata: -1, pitta: -1, kapha: -2 }, bestFor: ['kapha', 'vata'], tags: ['ama', 'agni', 'morning'] },
    { id: 'tongue_scraping', name: 'Tongue Scraping', nameHi: 'जिह्वा शोधन', emoji: '🪥', category: 'morning', targetMin: 2, description: 'Remove overnight Ama from tongue. 7–14 gentle strokes improve taste and digestion.', doshaEffect: { vata: -1, pitta: -1, kapha: -2 }, bestFor: ['kapha', 'pitta'], tags: ['oral', 'ama', 'morning'] },
    { id: 'abhyanga', name: 'Abhyanga (Self-Massage)', nameHi: 'अभ्यंग', emoji: '🫧', category: 'morning', targetMin: 15, description: 'Warm sesame oil self-massage before bath. Nourishes tissues, calms Vata, improves circulation.', doshaEffect: { vata: -3, pitta: -1, kapha: 0 }, bestFor: ['vata', 'pitta'], tags: ['ojas', 'vata', 'massage'] },
    { id: 'anulom_vilom', name: 'Anulom Vilom', nameHi: 'अनुलोम विलोम', emoji: '🌬️', category: 'morning', targetMin: 15, description: 'Alternate nostril pranayama — balances ida and pingala nadis. Reduces all Doshas.', doshaEffect: { vata: -2, pitta: -2, kapha: -1 }, bestFor: ['vata', 'pitta', 'kapha'], tags: ['pranayama', 'nadi', 'morning'] },
    { id: 'kapalabhati', name: 'Kapalabhati', nameHi: 'कपालभाति', emoji: '💨', category: 'morning', targetMin: 10, description: 'Skull-shining breath — powerful Kapha reducer. Energises the mind and purifies lungs.', doshaEffect: { vata: 1, pitta: 1, kapha: -3 }, bestFor: ['kapha'], tags: ['pranayama', 'kapha', 'energy'] },
    { id: 'meditation', name: 'Silent Meditation', nameHi: 'ध्यान', emoji: '🧘', category: 'morning', targetMin: 15, description: 'Morning meditation — ideally in Brahma Muhurta — reduces all three doshas and builds Ojas.', doshaEffect: { vata: -1, pitta: -1, kapha: -1 }, bestFor: ['vata', 'pitta', 'kapha'], tags: ['ojas', 'sattva', 'morning'] },
    { id: 'sunlight_morning', name: 'Morning Sunlight', nameHi: 'सूर्य दर्शन', emoji: '🌅', category: 'morning', targetMin: 5, description: 'Natural morning light synchronises your circadian rhythm with the Ayurvedic clock.', doshaEffect: { vata: -1, pitta: 0, kapha: -1 }, bestFor: ['vata', 'kapha'], tags: ['circadian', 'kapha', 'morning'] },

    // ── Midday ────────────────────────────────────────────────────────────────
    { id: 'main_meal_noon', name: 'Lunch (Main Meal)', nameHi: 'मध्याह्न भोजन', emoji: '🍛', category: 'midday', targetMin: 30, description: 'Largest meal between 12–1 PM when Agni is strongest. The foundation of Ayurvedic diet.', doshaEffect: { vata: -1, pitta: -2, kapha: 0 }, bestFor: ['pitta', 'vata'], tags: ['ahara', 'agni', 'timing'] },
    { id: 'deep_work_afternoon', name: 'Deep Work', nameHi: 'गहन कार्य', emoji: '🎯', category: 'midday', targetMin: 90, description: 'Focused, undistracted work during the Pitta peak — when mental clarity and concentration are highest. Channel the fire.', doshaEffect: { vata: 0, pitta: -1, kapha: -2 }, bestFor: ['kapha', 'pitta'], tags: ['productivity', 'focus', 'pitta'] },
    { id: 'shatapavali', name: 'Post-Meal Walk', nameHi: 'शतपावली', emoji: '🚶', category: 'midday', targetMin: 10, description: '100 gentle steps after the main meal — aids digestion without straining Agni.', doshaEffect: { vata: 0, pitta: -1, kapha: -1 }, bestFor: ['pitta', 'kapha'], tags: ['digestion', 'movement', 'pitta'] },

    // ── Evening ───────────────────────────────────────────────────────────────
    { id: 'light_dinner_early', name: 'Light Early Dinner', nameHi: 'सायं भोजन', emoji: '🥣', category: 'evening', targetMin: 20, description: 'Light dinner by 7 PM gives the body 12+ hours rest before breakfast — crucial for Ojas.', doshaEffect: { vata: -1, pitta: 0, kapha: -2 }, bestFor: ['kapha', 'vata'], tags: ['ahara', 'ojas', 'timing'] },
    { id: 'evening_walk', name: 'Evening Walk', nameHi: 'संध्या भ्रमण', emoji: '🌆', category: 'evening', targetMin: 20, description: 'Gentle 20-min walk in the evening reduces Pitta and Kapha accumulated during the day.', doshaEffect: { vata: 0, pitta: -2, kapha: -2 }, bestFor: ['pitta', 'kapha'], tags: ['movement', 'pitta', 'evening'] },
    { id: 'screen_free_hour', name: 'Digital Sunset', nameHi: 'स्क्रीन-मुक्त', emoji: '📵', category: 'evening', targetMin: 60, description: 'No screens 1 hour before bed. Preserves Ojas and ensures deep, Kapha-dominant sleep.', doshaEffect: { vata: -2, pitta: -2, kapha: 0 }, bestFor: ['vata', 'pitta'], tags: ['ojas', 'sleep', 'vata'] },
    { id: 'journaling', name: 'Reflective Journaling', nameHi: 'स्वाध्याय', emoji: '📓', category: 'evening', targetMin: 10, description: 'Evening reflection — process the day\'s experiences and release mental Ama before sleep.', doshaEffect: { vata: -1, pitta: -1, kapha: 0 }, bestFor: ['vata', 'pitta'], tags: ['svadhyaya', 'mind', 'evening'] },

    // ── Night ─────────────────────────────────────────────────────────────────
    { id: 'sleep_by_10', name: 'Sleep by 10 PM', nameHi: 'अपान काल', emoji: '🌙', category: 'night', targetMin: 0, description: 'Sleep during Kapha hours (10 PM–2 AM) ensures maximum Ojas restoration and deep repair.', doshaEffect: { vata: -2, pitta: 0, kapha: -3 }, bestFor: ['vata', 'kapha'], tags: ['ojas', 'kapha', 'sleep'] },

    // ── Anytime ───────────────────────────────────────────────────────────────
    { id: 'herbal_tea', name: 'Herbal Tea', nameHi: 'त्रिकटु चाय', emoji: '🍵', category: 'anytime', targetMin: 5, description: 'Cumin-Coriander-Fennel tea — tri-doshic digestive, reduces Ama and supports all three doshas.', doshaEffect: { vata: -1, pitta: -1, kapha: -1 }, bestFor: ['vata', 'pitta', 'kapha'], tags: ['herbs', 'digestion', 'tridoshic'] },
    { id: 'gratitude_practice', name: 'Gratitude Practice', nameHi: 'कृतज्ञता', emoji: '🙏', category: 'morning', targetMin: 5, description: 'Three genuine moments of gratitude each morning — programs Sattva into the nervous system.', doshaEffect: { vata: -1, pitta: -1, kapha: 0 }, bestFor: ['vata', 'pitta'], tags: ['sattva', 'svadhyaya', 'morning'] },
];

// ─── Ayurvedic ID → Lifestyle store h_* ID (for logHabitAndSync) ─────────────
export const AYUR_TO_H_ID: Record<string, string> = {
    warm_water_morning: 'h_warm_water',
    tongue_scraping: 'h_tongue_scraping',
    abhyanga: 'h_bathing',
    anulom_vilom: 'h_pranayama',
    kapalabhati: 'h_pranayama',
    meditation: 'h_morning_meditation',
    sunlight_morning: 'h_morning_sunlight',
    main_meal_noon: 'h_breakfast',
    deep_work_afternoon: 't_deep_work',
    shatapavali: 'h_walk',
    herbal_tea: 'h_water',
    evening_walk: 'h_walk',
    screen_free_hour: 'h_digital_sunset',
    sleep_by_10: 'h_sleep_early',
    journaling: 'h_brain_dump',
    gratitude_practice: 'h_gratitude',
};

// ─── Reverse: h_* ID → Ayurvedic habit ID ────────────────────────────────────
export const H_ID_TO_AYUR: Record<string, string> = {
    h_warm_water: 'warm_water_morning',
    h_tongue_scraping: 'tongue_scraping',
    h_bathing: 'abhyanga',
    h_pranayama: 'anulom_vilom',
    h_morning_meditation: 'meditation',
    h_morning_sunlight: 'sunlight_morning',
    h_breakfast: 'main_meal_noon',
    t_deep_work: 'deep_work_afternoon',
    h_walk: 'shatapavali',
    h_water: 'herbal_tea',
    h_digital_sunset: 'screen_free_hour',
    h_sleep_early: 'sleep_by_10',
    h_brain_dump: 'journaling',
    h_gratitude: 'gratitude_practice',
};

// ─── Time-slot mapping ────────────────────────────────────────────────────────
export type TimeSlot = 'morning' | 'midday' | 'evening' | 'night';

export function getCurrentTimeSlot(): TimeSlot {
    const h = new Date().getHours();
    if (h >= 3 && h < 11) return 'morning';
    if (h >= 11 && h < 15) return 'midday';
    if (h >= 15 && h < 21) return 'evening';
    return 'night';
}

/** Return Ayurvedic habits relevant for the given time slot (including anytime). */
export function getHabitsForSlot(slot: TimeSlot): AyurvedicHabit[] {
    return AYURVEDIC_HABITS.filter(h => {
        if (h.category === 'anytime') return true;
        if (slot === 'morning' && (h.category === 'morning')) return true;
        if (slot === 'midday' && h.category === 'midday') return true;
        if (slot === 'evening' && h.category === 'evening') return true;
        if (slot === 'night' && (h.category === 'night' || h.category === 'evening')) return true;
        return false;
    });
}

// ─── LocalStorage persistence key (shared across all screens) ────────────────
export const AYUR_LOG_STORAGE_KEY = 'onesutra_ayur_habits_v1';

export interface AyurHabitLogEntry {
    date: string;          // YYYY-MM-DD
    completedIds: string[]; // array of AyurvedicHabit.id
}

export function loadAyurHabitLogs(): AyurHabitLogEntry[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(AYUR_LOG_STORAGE_KEY) ?? '[]'); } catch { return []; }
}

export function saveAyurHabitLogs(logs: AyurHabitLogEntry[]): void {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(AYUR_LOG_STORAGE_KEY, JSON.stringify(logs)); } catch { }
}

export function getTodayAyurCompletedIds(): Set<string> {
    const today = new Date().toISOString().split('T')[0];
    const logs = loadAyurHabitLogs();
    const todayLog = logs.find(l => l.date === today);
    return new Set(todayLog?.completedIds ?? []);
}

export function setAyurHabitCompleted(habitId: string): void {
    const today = new Date().toISOString().split('T')[0];
    const logs = loadAyurHabitLogs();
    const existing = logs.find(l => l.date === today);
    if (existing) {
        if (!existing.completedIds.includes(habitId)) {
            existing.completedIds.push(habitId);
        }
    } else {
        logs.unshift({ date: today, completedIds: [habitId] });
    }
    saveAyurHabitLogs(logs);
}
