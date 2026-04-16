// ── Wellness Story System ────────────────────────────────────────────────────
// Habit-log stories shared by users; stored locally (24-hr TTL) + dispatched
// to HomeStoryBar via 'wellness-story-updated' CustomEvent.

export interface WellnessStory {
  id: string;
  habitId: string;
  habitName: string;
  emoji: string;
  storyText: string;
  imageDataUrl?: string;
  feeling?: string;
  feelingEmoji?: string;
  userName: string;
  userId?: string;     // Firebase UID — prevents cross-account bleed
  timestamp: number;   // Unix ms
  date: string;        // IST date YYYY-MM-DD — stories expire at midnight
  color: string;
  accentColor: string;
}

const STORE_KEY = 'onesutra_wellness_stories_v1';

function getTodayIST(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

export function getWellnessStories(userId?: string): WellnessStory[] {
  if (typeof window === 'undefined') return [];
  try {
    const today = getTodayIST();
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]') as WellnessStory[];
    // Expire at midnight (IST date match) — not 24h rolling window
    return raw.filter(s => {
      const sDate = s.date ?? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(s.timestamp));
      if (sDate !== today) return false;
      if (userId && s.userId && s.userId !== userId) return false;
      return true;
    });
  } catch { return []; }
}

export function saveWellnessStory(story: WellnessStory): void {
  if (typeof window === 'undefined') return;
  try {
    const storyWithDate = { ...story, date: story.date ?? getTodayIST() };
    const stories = getWellnessStories();
    const idx = stories.findIndex(s => s.habitId === storyWithDate.habitId);
    if (idx >= 0) stories.splice(idx, 1, storyWithDate);
    else stories.unshift(storyWithDate);
    localStorage.setItem(STORE_KEY, JSON.stringify(stories.slice(0, 15)));
    window.dispatchEvent(new CustomEvent('wellness-story-updated'));
  } catch { /* ignore */ }
}

export function deleteWellnessStory(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const stories = getWellnessStories().filter(s => s.id !== id);
    localStorage.setItem(STORE_KEY, JSON.stringify(stories));
    window.dispatchEvent(new CustomEvent('wellness-story-updated'));
  } catch { /* ignore */ }
}

// ── Habit background images ────────────────────────────────────────────────
export const HABIT_STORY_BG: Record<string, string> = {
  h_wake_early:          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1400&fit=crop&q=85',
  warm_water_morning:    'https://images.unsplash.com/photo-1564419320461-6870880221ad?w=800&h=1400&fit=crop&q=85',
  dant_manjan_bath:      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&h=1400&fit=crop&q=85',
  anulom_vilom:          'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&h=1400&fit=crop&q=85',
  kapalabhati:           'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&h=1400&fit=crop&q=85',
  meditation:            'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=1400&fit=crop&q=85',
  sunlight_morning:      'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&h=1400&fit=crop&q=85',
  gratitude_practice:    'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&h=1400&fit=crop&q=85',
  morning_meal:          'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=1400&fit=crop&q=85',
  main_meal_noon:        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=1400&fit=crop&q=85',
  shatapavali:           'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=1400&fit=crop&q=85',
  deep_work_afternoon:   'https://images.unsplash.com/photo-1484627147104-f5197bcd6651?w=800&h=1400&fit=crop&q=85',
  herbal_tea:            'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=1400&fit=crop&q=85',
  evening_walk:          'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&h=1400&fit=crop&q=85',
  light_dinner_early:    'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&h=1400&fit=crop&q=85',
  screen_free_hour:      'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&h=1400&fit=crop&q=85',
  journaling:            'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=800&h=1400&fit=crop&q=85',
  sleep_by_10:           'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&h=1400&fit=crop&q=85',
};
const DEFAULT_BG = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=1400&fit=crop&q=85';
export function getStoryBg(habitId: string) { return HABIT_STORY_BG[habitId] ?? DEFAULT_BG; }

// ── Habit accent colors [primary, accent] ──────────────────────────────────
export const HABIT_COLORS_MAP: Record<string, [string, string]> = {
  h_wake_early:        ['#fbbf24', '#f59e0b'],
  warm_water_morning:  ['#7dd3fc', '#0ea5e9'],
  dant_manjan_bath:    ['#34d399', '#10b981'],
  anulom_vilom:        ['#a78bfa', '#7c3aed'],
  kapalabhati:         ['#a78bfa', '#7c3aed'],
  meditation:          ['#c084fc', '#9333ea'],
  sunlight_morning:    ['#fbbf24', '#f59e0b'],
  gratitude_practice:  ['#fbbf24', '#f59e0b'],
  morning_meal:        ['#fb923c', '#f97316'],
  main_meal_noon:      ['#fb923c', '#f97316'],
  shatapavali:         ['#4ade80', '#22c55e'],
  deep_work_afternoon: ['#60a5fa', '#3b82f6'],
  herbal_tea:          ['#34d399', '#10b981'],
  evening_walk:        ['#a78bfa', '#7c3aed'],
  light_dinner_early:  ['#818cf8', '#6366f1'],
  screen_free_hour:    ['#818cf8', '#6366f1'],
  journaling:          ['#f472b6', '#ec4899'],
  sleep_by_10:         ['#60a5fa', '#3b82f6'],
};
export function getHabitColors(habitId: string): [string, string] {
  return HABIT_COLORS_MAP[habitId] ?? ['#a78bfa', '#7c3aed'];
}

// ── Auto-generated story text ──────────────────────────────────────────────
export function generateStoryText(habitId: string, habitName: string, userName: string): string {
  const n = (userName || 'friend').split(' ')[0];
  const t = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const map: Record<string, string> = {
    h_wake_early:        `${n} has risen with the sun at ${t}! Starting the sacred day in Brahma Muhurta. Early rising is the foundation of Ayurvedic wellness. 🌅`,
    warm_water_morning:  `${n} completed Ushapana at ${t} — 2–4 glasses of warm water to flush overnight Ama and kindle Agni. Simple, powerful, ancient! 💧`,
    dant_manjan_bath:    `${n} freshened up at ${t}! Ayurvedic Dant Manjan done, natural water bath complete — Bhoota Shuddhi is a go. Body and mind rebooted! 🌿`,
    anulom_vilom:        `${n} completed Pranayama at ${t} — Ida and Pingala nadis balanced. The breath is the bridge between body and soul. 🌬️`,
    kapalabhati:         `${n} powered through Kapalabhati at ${t} — skull-shining breath! Lungs purified, Agni ignited for the day. 💨`,
    meditation:          `${n} just completed Meditation & Workout at ${t}! Mind stilled, body energised. The ultimate morning recharge. 🧘`,
    sunlight_morning:    `${n} absorbed Surya Shakti at ${t}! Morning light — circadian rhythm synced with the cosmos. Nature's most powerful medicine. ☀️`,
    gratitude_practice:  `${n} practised gratitude at ${t} — 3 genuine moments of Sattva rewiring the nervous system toward joy. 🙏`,
    morning_meal:        `${n} had a mindful Ayurvedic breakfast at ${t} — nourishing Agni gently before the Pitta peak. Wellness starts at the table! 🥣`,
    main_meal_noon:      `${n} honoured Pitta peak with the main meal at ${t}! Agni is strongest now — ate with gratitude and mindfulness. 🍱`,
    shatapavali:         `${n} completed Shatapavali at ${t} — 100 gentle steps aiding digestion after the meal. Ancient wisdom in action! 🚶`,
    deep_work_afternoon: `${n} entered deep flow state at ${t} — Pitta clarity channelled into focused, meaningful work. 💼`,
    herbal_tea:          `${n} had Ayurvedic CCF herbal tea at ${t}! Cumin-coriander-fennel — the tri-doshic Ama-reducing ritual. 🍵`,
    evening_walk:        `${n} completed the Sandhya walk at ${t} — 20 min grounding Vata, reducing Pitta, building Ojas. 🌿`,
    light_dinner_early:  `${n} had a light early dinner at ${t}! Eating light gives the body 12+ hours for Ojas restoration. 🌙`,
    screen_free_hour:    `${n} started Digital Sunset at ${t} — screens off, Ojas protected. Deep sleep incoming! ✨`,
    journaling:          `${n} completed evening Svadhyaya at ${t} — mental Ama released through writing. Clear mind for deep rest. 📝`,
    sleep_by_10:         `${n} is going to sleep at ${t}! Kapha hours — sacred window for maximum Ojas and cellular repair. 🌙`,
  };
  return map[habitId] ?? `${n} completed ${habitName} at ${t}! Another step on the Ayurvedic wellness journey. ✦`;
}

// ── Feeling options ────────────────────────────────────────────────────────
export const FEELINGS = [
  { emoji: '😊', label: 'Great' },
  { emoji: '😌', label: 'Calm' },
  { emoji: '💪', label: 'Energised' },
  { emoji: '🌟', label: 'Inspired' },
  { emoji: '🙏', label: 'Grateful' },
] as const;

// ── Firestore Wellness Story Sync ─────────────────────────────────────────
// Collection: 'wellness_stories' (top-level — all users' stories visible to all)
// This makes the wellness story section a real social feed across devices.
const FS_COLLECTION = 'wellness_stories';

export async function saveWellnessStoryToFirestore(story: WellnessStory): Promise<void> {
  try {
    const { getFirebaseFirestore } = await import('./firebase');
    const { doc, setDoc } = await import('firebase/firestore');
    const db = await getFirebaseFirestore();
    // Strip imageDataUrl if it's very large to stay within Firestore's 1 MB doc limit.
    // The local copy on the creator's device keeps the full-quality image.
    const payload: Record<string, unknown> = { ...story };
    if (typeof story.imageDataUrl === 'string' && story.imageDataUrl.length > 700_000) {
      delete payload.imageDataUrl;
    }
    await setDoc(doc(db, FS_COLLECTION, story.id), payload);
  } catch { /* offline — local state already saved */ }
}

export async function deleteWellnessStoryFromFirestore(id: string): Promise<void> {
  try {
    const { getFirebaseFirestore } = await import('./firebase');
    const { doc, deleteDoc } = await import('firebase/firestore');
    const db = await getFirebaseFirestore();
    await deleteDoc(doc(db, FS_COLLECTION, id));
  } catch { /* ignore */ }
}

// Real-time listener for ALL users' wellness stories for a given IST date.
// Returns an unsubscribe function.
export function subscribeToWellnessStories(
  date: string,
  onUpdate: (stories: WellnessStory[]) => void
): () => void {
  let unsubFn: () => void = () => {};
  (async () => {
    try {
      const { getFirebaseFirestore } = await import('./firebase');
      const { collection, query, where, onSnapshot } = await import('firebase/firestore');
      const db = await getFirebaseFirestore();
      unsubFn = onSnapshot(
        query(collection(db, FS_COLLECTION), where('date', '==', date)),
        (snap) => {
          const stories = snap.docs
            .map(d => d.data() as WellnessStory)
            .sort((a, b) => b.timestamp - a.timestamp);
          onUpdate(stories);
        }
      );
    } catch { /* ignore — Firestore unavailable offline */ }
  })();
  return () => unsubFn();
}
