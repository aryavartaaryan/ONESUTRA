/**
 * habitWindows.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Central registry of all 35+ Ayurvedic habits with:
 *   - Ideal & acceptable time windows
 *   - Dosha effects & core benefits
 *   - Timing status calculation
 *   - Late-streak persistence (localStorage)
 */

export type TimingStatus = 'ideal' | 'acceptable' | 'late' | 'early';
export type TimeSection   = 'morning' | 'noon' | 'evening' | 'flexible';

export interface HabitWindow {
  id: string;
  name: string;
  idealStart: string;        // "HH:MM" 24-h IST
  idealEnd: string;          // "HH:MM" 24-h IST
  acceptableStart?: string;  // if absent, use idealStart
  acceptableEnd?: string;    // if absent, means no acceptable window after ideal
  doshaEffect: string;
  benefit: string;
  durationMinutes: number;
  timeSection: TimeSection;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseHHMM(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function getISTTimeStr(ms?: number): string {
  const d = ms ? new Date(ms) : new Date();
  return d.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export function getISTDateStr(ms?: number): string {
  const d = ms ? new Date(ms) : new Date();
  return d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
}

export function getISODateIST(ms?: number): string {
  const d = ms ? new Date(ms) : new Date();
  const ist = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  return ist.toISOString().split('T')[0];
}

function loggedMinutes(ms: number): number {
  const d = new Date(ms);
  const istStr = d.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const [h, m] = istStr.replace('24:', '00:').split(':').map(Number);
  return h * 60 + m;
}

export function getTimingStatus(win: HabitWindow, loggedAtMs: number): TimingStatus {
  if (!win.idealStart || !win.idealEnd) return 'ideal';
  const logged  = loggedMinutes(loggedAtMs);
  const idealS  = parseHHMM(win.idealStart);
  const idealE  = parseHHMM(win.idealEnd);
  const accS    = win.acceptableStart ? parseHHMM(win.acceptableStart) : idealS;
  const accE    = win.acceptableEnd   ? parseHHMM(win.acceptableEnd)   : null;

  if (logged < accS)   return 'early';
  if (logged < idealS) return 'acceptable';
  if (logged <= idealE) return 'ideal';
  if (accE !== null && logged <= accE) return 'acceptable';
  return 'late';
}

// ─── Late-streak persistence ──────────────────────────────────────────────────

const LATE_STREAK_KEY = 'onesutra_habit_late_streak_v1';

export interface LateStreakEntry {
  streak: number;
  lastDate: string;
  lastStatus: TimingStatus;
}

export function loadLateStreaks(): Record<string, LateStreakEntry> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(LATE_STREAK_KEY) ?? '{}'); } catch { return {}; }
}

export function updateLateStreak(habitId: string, status: TimingStatus, today: string): number {
  if (typeof window === 'undefined') return 0;
  const all  = loadLateStreaks();
  const prev = all[habitId];
  const d    = new Date(today);
  d.setDate(d.getDate() - 1);
  const yesterday = d.toISOString().split('T')[0];

  let newStreak = 0;
  if (status === 'late') {
    newStreak = (prev?.lastDate === yesterday && prev?.lastStatus === 'late')
      ? (prev.streak + 1)
      : 1;
  }

  all[habitId] = { streak: newStreak, lastDate: today, lastStatus: status };
  try { localStorage.setItem(LATE_STREAK_KEY, JSON.stringify(all)); } catch { /* */ }
  return newStreak;
}

// ─── Habit Window Registry ─────────────────────────────────────────────────────

export const HABIT_WINDOWS: HabitWindow[] = [
  // ── Morning rituals ──────────────────────────────────────────────────────────
  {
    id: 'wake_before_6',
    name: 'Wake Before 6 AM',
    idealStart: '04:30', idealEnd: '06:00',
    acceptableStart: '04:30', acceptableEnd: '06:30',
    doshaEffect: 'Vata ↓, Kapha ↓↓',
    benefit: 'Aligns with Brahma Muhurta — the most sattvic hours for Ojas building and mental clarity',
    durationMinutes: 0,
    timeSection: 'morning',
  },
  {
    id: 'warm_water_morning',
    name: 'Warm Water on Rising',
    idealStart: '05:00', idealEnd: '06:20',
    acceptableStart: '05:00', acceptableEnd: '08:00',
    doshaEffect: 'Vata ↓, Kapha ↓',
    benefit: 'Flushes overnight Ama and activates Agni before the digestive fire has to carry anything heavier',
    durationMinutes: 3,
    timeSection: 'morning',
  },
  {
    id: 'tongue_scraping',
    name: 'Tongue Scraping',
    idealStart: '05:30', idealEnd: '07:00',
    acceptableStart: '05:30', acceptableEnd: '08:00',
    doshaEffect: 'Kapha ↓↓, Pitta ↓',
    benefit: 'Removes overnight Ama, stimulates organ meridians and restores taste sensitivity',
    durationMinutes: 2,
    timeSection: 'morning',
  },
  {
    id: 'oil_pulling',
    name: 'Oil Pulling',
    idealStart: '05:30', idealEnd: '07:30',
    acceptableStart: '05:30', acceptableEnd: '09:00',
    doshaEffect: 'Kapha ↓↓, Vata ↓',
    benefit: 'Draws bacteria and oral Ama from tissues — the deepest Kapha and toxin cleanse of the morning routine',
    durationMinutes: 15,
    timeSection: 'morning',
  },
  {
    id: 'abhyanga',
    name: 'Abhyanga (Oil Massage)',
    idealStart: '06:00', idealEnd: '07:30',
    acceptableStart: '06:00', acceptableEnd: '09:00',
    doshaEffect: 'Vata ↓↓, Pitta ↓',
    benefit: 'Nourishes the nervous system and calms the Vata mind before the day takes hold',
    durationMinutes: 15,
    timeSection: 'morning',
  },
  {
    id: 'kapalabhati',
    name: 'Kapalabhati',
    idealStart: '06:00', idealEnd: '08:00',
    acceptableStart: '06:00', acceptableEnd: '09:00',
    doshaEffect: 'Kapha ↓↓, Agni ↑',
    benefit: 'Rapid bellows breathing clears Kapha, strengthens Agni and energises every system in the body',
    durationMinutes: 5,
    timeSection: 'morning',
  },
  {
    id: 'anulom_vilom',
    name: 'Anulom Vilom',
    idealStart: '06:00', idealEnd: '08:00',
    acceptableStart: '06:00', acceptableEnd: '09:00',
    doshaEffect: 'Vata ↓↓, Pitta ↓',
    benefit: 'Balances prana across both nadis, calms anxiety and clears the mind before any creative or focused work',
    durationMinutes: 10,
    timeSection: 'morning',
  },
  {
    id: 'pranayama',
    name: 'Pranayama',
    idealStart: '06:00', idealEnd: '08:00',
    acceptableStart: '06:00', acceptableEnd: '09:00',
    doshaEffect: 'Vata ↓, Pitta ↓',
    benefit: 'Shifts the nervous system into coherence — the most direct lever for dosha balance available each morning',
    durationMinutes: 10,
    timeSection: 'morning',
  },
  {
    id: 'meditation',
    name: 'Silent Meditation',
    idealStart: '04:30', idealEnd: '08:00',
    acceptableStart: '04:30', acceptableEnd: '09:00',
    doshaEffect: 'Vata ↓, Pitta ↓, Kapha ↓',
    benefit: 'Builds Ojas — the subtle essence of vitality — and reduces all three doshas simultaneously',
    durationMinutes: 15,
    timeSection: 'morning',
  },
  {
    id: 'sunlight_morning',
    name: 'Morning Sunlight',
    idealStart: '06:00', idealEnd: '08:00',
    acceptableStart: '06:00', acceptableEnd: '09:30',
    doshaEffect: 'Vata ↓, Kapha ↓',
    benefit: 'Synchronises the circadian rhythm with the Ayurvedic clock — the biological foundation of natural melatonin',
    durationMinutes: 5,
    timeSection: 'morning',
  },
  {
    id: 'morning_stretch',
    name: 'Morning Stretch',
    idealStart: '06:00', idealEnd: '08:30',
    acceptableStart: '06:00', acceptableEnd: '09:30',
    doshaEffect: 'Vata ↓, Kapha ↓',
    benefit: 'Opens the body after overnight stillness and moves Apana Vata back into healthy downward flow',
    durationMinutes: 10,
    timeSection: 'morning',
  },
  {
    id: 't_lemon_water',
    name: 'Warm Lemon Water',
    idealStart: '05:00', idealEnd: '06:30',
    acceptableStart: '05:00', acceptableEnd: '08:30',
    doshaEffect: 'Kapha ↓, Agni ↑',
    benefit: 'Activates liver enzymes and flushes bile — the fastest way to kindle Agni before the first meal',
    durationMinutes: 2,
    timeSection: 'morning',
  },
  {
    id: 't_gratitude',
    name: 'Gratitude Practice',
    idealStart: '06:00', idealEnd: '09:00',
    acceptableStart: '06:00', acceptableEnd: '10:00',
    doshaEffect: 'Pitta ↓, Vata ↓',
    benefit: 'Shifts the mind from Rajas to Sattva — the quietest and most lasting anti-Pitta practice available',
    durationMinutes: 5,
    timeSection: 'morning',
  },
  {
    id: 't_mantra',
    name: 'Mantra Japa',
    idealStart: '05:00', idealEnd: '08:00',
    acceptableStart: '05:00', acceptableEnd: '10:00',
    doshaEffect: 'Vata ↓, Pitta ↓',
    benefit: 'Repetition in Brahma Muhurta plants the mantra vibration deepest into the nervous system and cells',
    durationMinutes: 15,
    timeSection: 'morning',
  },
  {
    id: 't_breakfast',
    name: 'Breakfast',
    idealStart: '07:00', idealEnd: '08:30',
    acceptableStart: '07:00', acceptableEnd: '09:30',
    doshaEffect: 'Vata ↓, Agni ↑',
    benefit: 'Breaking the fast while Agni is building — before Pitta peak — ensures full nutrient absorption',
    durationMinutes: 20,
    timeSection: 'morning',
  },
  {
    id: 't_deep_work',
    name: 'Deep Work Block',
    idealStart: '08:00', idealEnd: '12:00',
    acceptableStart: '08:00', acceptableEnd: '13:00',
    doshaEffect: 'Pitta ↑ (productive), Kapha ↓',
    benefit: 'Pitta clarity peaks between 10 AM–12 PM — the sharpest window for complex cognitive and strategic work',
    durationMinutes: 90,
    timeSection: 'morning',
  },
  {
    id: 't_learning',
    name: 'Learn Something New',
    idealStart: '08:00', idealEnd: '12:00',
    acceptableStart: '08:00', acceptableEnd: '14:00',
    doshaEffect: 'Pitta ↑ (sharpened), Kapha ↓',
    benefit: 'New information absorbed during Pitta time integrates more deeply due to peak neural plasticity',
    durationMinutes: 20,
    timeSection: 'morning',
  },

  // ── Noon rituals ─────────────────────────────────────────────────────────────
  {
    id: 'main_meal_noon',
    name: 'Main Meal at Noon',
    idealStart: '12:00', idealEnd: '13:00',
    acceptableStart: '11:30', acceptableEnd: '14:00',
    doshaEffect: 'Pitta ↓↓, Vata ↓',
    benefit: 'Agni is strongest at noon — eating here ensures complete digestion and prevents Ama formation',
    durationMinutes: 30,
    timeSection: 'noon',
  },
  {
    id: 'shatapavali',
    name: 'Post-Meal Walk',
    idealStart: '12:30', idealEnd: '13:30',
    acceptableStart: '12:30', acceptableEnd: '14:30',
    doshaEffect: 'Kapha ↓, Pitta ↓',
    benefit: 'Activates the vagus nerve and aids peristalsis without depleting the Agni still processing the meal',
    durationMinutes: 10,
    timeSection: 'noon',
  },
  {
    id: 'herbal_tea',
    name: 'CCF Herbal Tea',
    idealStart: '14:00', idealEnd: '16:00',
    acceptableStart: '13:00', acceptableEnd: '17:00',
    doshaEffect: 'Vata ↓, Pitta ↓, Kapha ↓',
    benefit: 'Cumin-Coriander-Fennel is tri-doshic — reduces Ama, supports digestion, and bridges the Vata afternoon',
    durationMinutes: 5,
    timeSection: 'noon',
  },

  // ── Flexible / all-day ───────────────────────────────────────────────────────
  {
    id: 't_water',
    name: 'Drink 2L Water',
    idealStart: '06:00', idealEnd: '19:00',
    doshaEffect: 'Vata ↓, Pitta ↓',
    benefit: 'Hydration throughout the day prevents Vata depletion and keeps Pitta from overheating the tissues',
    durationMinutes: 0,
    timeSection: 'flexible',
  },
  {
    id: 't_walk',
    name: 'Walk 10,000 Steps',
    idealStart: '06:00', idealEnd: '20:00',
    doshaEffect: 'Kapha ↓↓, Vata ↑ (healthy movement)',
    benefit: 'Daily movement is the single most effective Kapha-clearing practice — prevents stagnation at every level',
    durationMinutes: 45,
    timeSection: 'flexible',
  },
  {
    id: 't_yoga',
    name: 'Exercise / Yoga',
    idealStart: '06:00', idealEnd: '10:00',
    acceptableStart: '06:00', acceptableEnd: '19:00',
    doshaEffect: 'Kapha ↓↓, Vata ↑ (healthy)',
    benefit: 'Movement in Kapha morning time clears heaviness and primes all three doshas for the day ahead',
    durationMinutes: 30,
    timeSection: 'morning',
  },
  {
    id: 't_read',
    name: 'Read 30 Minutes',
    idealStart: '07:00', idealEnd: '09:00',
    acceptableStart: '07:00', acceptableEnd: '22:00',
    doshaEffect: 'Pitta ↑ (directed), Kapha ↓',
    benefit: 'Focused reading during Pitta morning plants new understanding at the deepest level of retention',
    durationMinutes: 30,
    timeSection: 'flexible',
  },
  {
    id: 't_nature',
    name: 'Time in Nature',
    idealStart: '06:00', idealEnd: '09:00',
    acceptableStart: '06:00', acceptableEnd: '19:00',
    doshaEffect: 'Vata ↓, Pitta ↓',
    benefit: 'Direct contact with natural elements grounds Vata and reduces cortisol — the body resets its baseline',
    durationMinutes: 20,
    timeSection: 'flexible',
  },
  {
    id: 't_no_social',
    name: 'Social Media Fast',
    idealStart: '05:00', idealEnd: '23:59',
    doshaEffect: 'Vata ↓↓, Pitta ↓',
    benefit: 'Eliminating social media removes the primary source of Rajas and scattered Vata energy from the nervous system',
    durationMinutes: 0,
    timeSection: 'flexible',
  },
  {
    id: 't_connect',
    name: 'Connect with Someone',
    idealStart: '06:00', idealEnd: '22:00',
    doshaEffect: 'Vata ↓, Pitta ↓',
    benefit: 'Meaningful connection activates the ventral vagal system — the most effective anti-stress mechanism available',
    durationMinutes: 10,
    timeSection: 'flexible',
  },
  {
    id: 't_create',
    name: 'Create Something',
    idealStart: '06:00', idealEnd: '23:00',
    doshaEffect: 'Vata ↑ (healthy expression)',
    benefit: 'Creative output channels Vata energy productively — unexpressed creativity becomes restlessness and anxiety',
    durationMinutes: 20,
    timeSection: 'flexible',
  },

  // ── Evening rituals ───────────────────────────────────────────────────────────
  {
    id: 'light_dinner_early',
    name: 'Light Early Dinner',
    idealStart: '18:00', idealEnd: '19:30',
    acceptableStart: '18:00', acceptableEnd: '20:00',
    doshaEffect: 'Kapha ↓↓, Vata ↓',
    benefit: 'Finishing dinner before 7 PM gives the body 12+ hours of digestive rest — the foundation of Ojas renewal',
    durationMinutes: 20,
    timeSection: 'evening',
  },
  {
    id: 'evening_walk',
    name: 'Evening Walk',
    idealStart: '18:00', idealEnd: '19:30',
    acceptableStart: '18:00', acceptableEnd: '20:30',
    doshaEffect: 'Vata ↓, Pitta ↓, Kapha ↓',
    benefit: 'Gentle movement under open sky aids dinner digestion and transitions the nervous system toward rest',
    durationMinutes: 20,
    timeSection: 'evening',
  },
  {
    id: 't_expenses',
    name: 'Track Expenses',
    idealStart: '20:00', idealEnd: '22:00',
    acceptableStart: '18:00', acceptableEnd: '23:00',
    doshaEffect: 'Pitta ↓ (reduces financial anxiety)',
    benefit: 'Evening awareness of finances prevents the low-grade Pitta anxiety that disrupts sleep and morning clarity',
    durationMinutes: 10,
    timeSection: 'evening',
  },
  {
    id: 't_review_day',
    name: 'Evening Review',
    idealStart: '20:00', idealEnd: '22:00',
    acceptableStart: '20:00', acceptableEnd: '22:30',
    doshaEffect: 'Pitta ↓, Vata ↓',
    benefit: 'Processing the day\'s Pitta intensity prevents it from cycling in the mind during sleep as mental Ama',
    durationMinutes: 10,
    timeSection: 'evening',
  },
  {
    id: 'journaling',
    name: 'Evening Journal',
    idealStart: '20:30', idealEnd: '22:00',
    acceptableStart: '20:00', acceptableEnd: '22:30',
    doshaEffect: 'Vata ↓, Pitta ↓',
    benefit: 'Writing clears mental Ama — the toxic thought residue of the day — before it enters sleep and disturbs Ojas',
    durationMinutes: 10,
    timeSection: 'evening',
  },
  {
    id: 'screen_free_hour',
    name: 'Screen-Free Hour',
    idealStart: '21:00', idealEnd: '22:00',
    acceptableStart: '20:30', acceptableEnd: '22:00',
    doshaEffect: 'Vata ↓↓, Pitta ↓',
    benefit: 'Blue light disrupts melatonin and agitates Vata — 60 minutes of darkness is the prerequisite for deep sleep',
    durationMinutes: 60,
    timeSection: 'evening',
  },
  {
    id: 'ke_wind_down',
    name: 'Wind-Down Ritual',
    idealStart: '21:00', idealEnd: '22:00',
    acceptableStart: '21:00', acceptableEnd: '22:30',
    doshaEffect: 'Vata ↓↓, Pitta ↓',
    benefit: 'A consistent wind-down sequence signals the nervous system that deep Pitta repair time is beginning',
    durationMinutes: 15,
    timeSection: 'evening',
  },
  {
    id: 'padabhyanga',
    name: 'Padabhyanga (Foot Oil)',
    idealStart: '21:00', idealEnd: '22:00',
    acceptableStart: '21:00', acceptableEnd: '22:30',
    doshaEffect: 'Vata ↓↓, Pitta ↓',
    benefit: 'Warm oil on the feet grounds the nervous system more deeply than any other single Vata-pacifying practice',
    durationMinutes: 8,
    timeSection: 'evening',
  },
  {
    id: 'sleep_by_10',
    name: 'Sleep by 10 PM',
    idealStart: '21:45', idealEnd: '22:15',
    acceptableStart: '21:45', acceptableEnd: '22:45',
    doshaEffect: 'Pitta ↓↓, Vata ↓',
    benefit: 'The Pitta repair cycle begins at 10 — the liver and metabolism need you asleep to do their deepest work',
    durationMinutes: 0,
    timeSection: 'evening',
  },
];

// ─── Lookup helpers ────────────────────────────────────────────────────────────

export function findHabitWindow(idOrName: string): HabitWindow | null {
  const norm = (s: string) =>
    s.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '').trim();
  return (
    HABIT_WINDOWS.find(w => w.id === idOrName) ??
    HABIT_WINDOWS.find(w => w.id === norm(idOrName)) ??
    HABIT_WINDOWS.find(w => w.name.toLowerCase() === idOrName.toLowerCase()) ??
    null
  );
}
