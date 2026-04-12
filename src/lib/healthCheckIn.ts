/**
 * healthCheckIn.ts — Daily Ayurvedic Health Check-In System
 * Question bank, scoring logic, daily selector, skip tracking,
 * and rolling Vikruti calculator.
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface DoshaScore { vata: number; pitta: number; kapha: number; }

export interface CheckInOption {
  id: string;
  emoji: string;
  label: string;
  score: DoshaScore;
  skipable?: boolean; // for stool question etc.
}

export interface CheckInQuestion {
  id: string;
  category: 'agni' | 'sleep' | 'energy' | 'mind' | 'body' | 'seasonal';
  emoji: string;
  question: string;
  options: CheckInOption[];
  triggerKey?: string;   // key stored in yesterday's answers that activates this question
  triggerValue?: string; // value in yesterday's answer that triggers it
  doshaFocus?: 'vata' | 'pitta' | 'kapha'; // only shown when this dosha elevated
  season?: 'vata' | 'pitta' | 'kapha';    // only shown in this season
  weekday?: number; // 0=Sun…6=Sat — fixed rotation base question
}

export interface CheckInAnswer {
  questionId: string;
  optionId: string;
  score: DoshaScore;
}

export interface DailyCheckInRecord {
  date: string;
  answers: CheckInAnswer[];
  skipped: boolean;
  completedAt: number;
  vikrutiDelta: DoshaScore;
}

// ─── Storage Keys ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'onesutra_daily_checkin_v1';
const SKIP_KEY = 'onesutra_checkin_skip_v1';

// ─── Full Question Bank ────────────────────────────────────────────────────────

export const QUESTION_BANK: CheckInQuestion[] = [
  // ── AGNI ──────────────────────────────────────────────────────────────────
  {
    id: 'digestion_today',
    category: 'agni',
    emoji: '🔥',
    question: 'How was your digestion today?',
    weekday: 1, // Monday base question
    options: [
      { id: 'sharp_clean',  emoji: '🌟', label: 'Sharp and clean',        score: { vata: 0, pitta: 0, kapha: 0 } },
      { id: 'normal',       emoji: '😌', label: 'Normal, nothing unusual', score: { vata: 0, pitta: 0, kapha: 0 } },
      { id: 'heavy_bloated',emoji: '😮‍💨', label: 'Heavy or bloated',       score: { vata: 1, pitta: 0, kapha: 2 } },
      { id: 'burning_acid', emoji: '🔥', label: 'Burning or acidic',       score: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'gassy_irreg',  emoji: '💨', label: 'Gassy or irregular',      score: { vata: 2, pitta: 0, kapha: 1 } },
    ],
  },
  {
    id: 'appetite_morning',
    category: 'agni',
    emoji: '🦁',
    question: 'How was your appetite this morning?',
    weekday: 0, // Sunday base question
    options: [
      { id: 'strong',   emoji: '🦁', label: 'Strong — genuinely hungry',  score: { vata: 0, pitta: 0, kapha: 0 } },
      { id: 'mild',     emoji: '😐', label: 'Mild — could eat or skip',   score: { vata: 1, pitta: 0, kapha: 1 } },
      { id: 'no_appetite', emoji: '😶', label: 'No appetite at all',       score: { vata: 1, pitta: 0, kapha: 2 } },
      { id: 'nausea',   emoji: '🤢', label: 'Nauseous or unsettled',       score: { vata: 1, pitta: 1, kapha: 1 } },
    ],
  },
  {
    id: 'stool_today',
    category: 'agni',
    emoji: '✅',
    question: "How was your stool today? (Ayurveda\u2019s #1 signal)",
    options: [
      { id: 'well_formed', emoji: '✅', label: 'Well-formed, easy, complete', score: { vata: 0, pitta: 0, kapha: 0 } },
      { id: 'loose',       emoji: '💧', label: 'Loose or watery',             score: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'hard_dry',    emoji: '🪨', label: 'Hard, dry or incomplete',     score: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'skip_stool',  emoji: '⏭️', label: 'Skip this question',          score: { vata: 0, pitta: 0, kapha: 0 }, skipable: true },
    ],
  },
  // Follow-up for poor digestion yesterday
  {
    id: 'bloating_followup',
    category: 'agni',
    emoji: '😮‍💨',
    question: 'Did bloating continue after meals today?',
    triggerKey: 'digestion_today',
    triggerValue: 'heavy_bloated',
    options: [
      { id: 'yes_worse',  emoji: '😟', label: 'Yes, even worse today', score: { vata: 1, pitta: 0, kapha: 2 } },
      { id: 'same',       emoji: '😐', label: 'About the same',        score: { vata: 0, pitta: 0, kapha: 1 } },
      { id: 'bit_better', emoji: '😌', label: 'A bit better',          score: { vata: 0, pitta: 0, kapha: 0 } },
      { id: 'resolved',   emoji: '✅', label: 'Fully resolved',        score: { vata: 0, pitta: 0, kapha: 0 } },
    ],
  },

  // ── SLEEP ─────────────────────────────────────────────────────────────────
  {
    id: 'sleep_quality',
    category: 'sleep',
    emoji: '🌙',
    question: 'How did you sleep last night?',
    weekday: 2, // Tuesday base question
    options: [
      { id: 'deep_restful',   emoji: '🌙', label: 'Deep and restful',           score: { vata: 0, pitta: 0, kapha: 0 } },
      { id: 'okay_not_full',  emoji: '😶', label: 'Okay but not fully rested',  score: { vata: 1, pitta: 0, kapha: 0 } },
      { id: 'light_interrup', emoji: '🌀', label: 'Light, interrupted, dreams', score: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'very_poor',      emoji: '😫', label: 'Very poor — couldn\'t sleep', score: { vata: 2, pitta: 1, kapha: 0 } },
    ],
  },
  {
    id: 'sleep_time',
    category: 'sleep',
    emoji: '🕙',
    question: 'What time did you fall asleep last night?',
    options: [
      { id: 'before_10',    emoji: '🌿', label: 'Before 10 PM',      score: { vata: 0, pitta: 0, kapha: 0 } },
      { id: 'ten_eleven',   emoji: '🕙', label: '10–11 PM',          score: { vata: 0, pitta: 0, kapha: 0 } },
      { id: 'eleven_mid',   emoji: '🕚', label: '11 PM–12 AM',       score: { vata: 1, pitta: 1, kapha: 0 } },
      { id: 'after_mid',    emoji: '🌑', label: 'After midnight',    score: { vata: 2, pitta: 1, kapha: 0 } },
    ],
  },
  // Follow-up for poor sleep
  {
    id: 'energy_after_sleep',
    category: 'energy',
    emoji: '⚡',
    question: 'How is your energy this morning compared to yesterday?',
    triggerKey: 'sleep_quality',
    triggerValue: 'very_poor',
    options: [
      { id: 'worse_energy',  emoji: '😩', label: 'Worse — very drained',   score: { vata: 2, pitta: 0, kapha: 1 } },
      { id: 'same_energy',   emoji: '😐', label: 'About the same low',     score: { vata: 1, pitta: 0, kapha: 1 } },
      { id: 'better_energy', emoji: '😌', label: 'Slightly better',        score: { vata: 0, pitta: 0, kapha: 0 } },
    ],
  },

  // ── ENERGY ────────────────────────────────────────────────────────────────
  {
    id: 'energy_now',
    category: 'energy',
    emoji: '⚡',
    question: 'How is your energy right now?',
    weekday: 3, // Wednesday base question
    options: [
      { id: 'vibrant',   emoji: '✨', label: 'Vibrant and steady',       score: { vata: 0, pitta: 0, kapha: 0 } },
      { id: 'calm_ok',   emoji: '😌', label: 'Calm and adequate',        score: { vata: 0, pitta: 0, kapha: 0 } },
      { id: 'low_manag', emoji: '📉', label: 'Low but manageable',       score: { vata: 1, pitta: 0, kapha: 1 } },
      { id: 'exhausted', emoji: '😩', label: 'Exhausted or drained',     score: { vata: 2, pitta: 0, kapha: 2 } },
      { id: 'scattered', emoji: '🎢', label: 'Scattered — up and down',  score: { vata: 2, pitta: 1, kapha: 0 } },
    ],
  },
  {
    id: 'energy_dip',
    category: 'energy',
    emoji: '☀️',
    question: 'When did your energy dip today?',
    options: [
      { id: 'no_dip',        emoji: '☀️', label: 'No dip — steady all day',   score: { vata: 0, pitta: 0, kapha: 0 } },
      { id: 'after_lunch',   emoji: '🕑', label: 'After lunch (2–3 PM slump)', score: { vata: 0, pitta: 1, kapha: 2 } },
      { id: 'late_afternoon',emoji: '🕔', label: 'Late afternoon',             score: { vata: 1, pitta: 0, kapha: 1 } },
      { id: 'from_morning',  emoji: '🌅', label: 'From the moment I woke up', score: { vata: 2, pitta: 0, kapha: 2 } },
    ],
  },

  // ── MIND ──────────────────────────────────────────────────────────────────
  {
    id: 'mental_clarity',
    category: 'mind',
    emoji: '🧠',
    question: 'How is your mental clarity today?',
    weekday: 4, // Thursday base question
    options: [
      { id: 'sharp',     emoji: '💎', label: 'Sharp and focused',            score: { vata: 0, pitta: 0, kapha: 0 } },
      { id: 'some_cloud',emoji: '🌤️', label: 'Okay — some cloudiness',      score: { vata: 1, pitta: 0, kapha: 1 } },
      { id: 'foggy',     emoji: '🌫️', label: 'Foggy, slow to think',        score: { vata: 0, pitta: 0, kapha: 2 } },
      { id: 'scattered_m',emoji: '🌀', label: 'Scattered, can\'t concentrate', score: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'overwhelmed',emoji: '😤', label: 'Overwhelmed or anxious',      score: { vata: 2, pitta: 1, kapha: 0 } },
    ],
  },
  {
    id: 'emotions_today',
    category: 'mind',
    emoji: '💭',
    question: 'How are your emotions feeling today?',
    weekday: 5, // Friday base question
    options: [
      { id: 'calm_grnd',  emoji: '🌸', label: 'Calm and grounded',    score: { vata: 0, pitta: 0, kapha: 0 } },
      { id: 'happy_ener', emoji: '😄', label: 'Happy and energized',  score: { vata: 0, pitta: 0, kapha: 0 } },
      { id: 'low_withdr', emoji: '😔', label: 'Low or withdrawn',     score: { vata: 1, pitta: 0, kapha: 2 } },
      { id: 'irritable',  emoji: '😤', label: 'Irritable or frustrated', score: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'anxious',    emoji: '😰', label: 'Anxious or unsettled', score: { vata: 2, pitta: 1, kapha: 0 } },
    ],
  },

  // ── BODY ──────────────────────────────────────────────────────────────────
  {
    id: 'body_feeling',
    category: 'body',
    emoji: '🫀',
    question: 'How does your body feel physically?',
    weekday: 6, // Saturday base question
    options: [
      { id: 'light_ener',  emoji: '💪', label: 'Light and energized',     score: { vata: 0, pitta: 0, kapha: 0 } },
      { id: 'normal_body', emoji: '😐', label: 'Normal',                  score: { vata: 0, pitta: 0, kapha: 0 } },
      { id: 'heavy_slug',  emoji: '🏋️', label: 'Heavy or sluggish',       score: { vata: 0, pitta: 0, kapha: 2 } },
      { id: 'stiff_achy',  emoji: '🦴', label: 'Stiff or achy — joints',  score: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'inflamed',    emoji: '🔥', label: 'Inflamed or warm',         score: { vata: 0, pitta: 2, kapha: 0 } },
    ],
  },
  {
    id: 'skin_today',
    category: 'body',
    emoji: '🌸',
    question: 'How does your skin feel today?',
    weekday: 6, // Saturday also
    options: [
      { id: 'soft_clear',  emoji: '🌸', label: 'Soft and clear',          score: { vata: 0, pitta: 0, kapha: 0 } },
      { id: 'normal_skin', emoji: '😐', label: 'Normal',                  score: { vata: 0, pitta: 0, kapha: 0 } },
      { id: 'dry_rough',   emoji: '🏜️', label: 'Dry or rough',            score: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'oily',        emoji: '💦', label: 'Oily or congested',        score: { vata: 0, pitta: 0, kapha: 2 } },
      { id: 'sensitive',   emoji: '🔴', label: 'Sensitive or breaking out', score: { vata: 0, pitta: 2, kapha: 0 } },
    ],
  },
  {
    id: 'tongue_morning',
    category: 'body',
    emoji: '👅',
    question: 'How is your tongue this morning? (Check before brushing)',
    options: [
      { id: 'clean_pink',   emoji: '✨', label: 'Clean and pink',          score: { vata: 0, pitta: 0, kapha: 0 } },
      { id: 'thin_white',   emoji: '🤍', label: 'Thin white coating',      score: { vata: 1, pitta: 0, kapha: 0 } },
      { id: 'thick_yellow', emoji: '🟡', label: 'Thick yellow coating',    score: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'heavy_white',  emoji: '⬜', label: 'Heavy white coating',     score: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },

  // ── SEASONAL / CONTEXTUAL ─────────────────────────────────────────────────
  {
    id: 'weather_affect',
    category: 'seasonal',
    emoji: '🌡️',
    question: 'How is the weather affecting you today?',
    options: [
      { id: 'balanced',  emoji: '😌', label: 'Not at all — feeling balanced', score: { vata: 0, pitta: 0, kapha: 0 } },
      { id: 'cold_dry',  emoji: '🥶', label: 'Cold and dry — stiff or tight', score: { vata: 2, pitta: 0, kapha: 0 } },
      { id: 'hot',       emoji: '🥵', label: 'Hot — heated or irritable',     score: { vata: 0, pitta: 2, kapha: 0 } },
      { id: 'damp_heavy',emoji: '🌧️', label: 'Damp and heavy — slow',        score: { vata: 0, pitta: 0, kapha: 2 } },
    ],
    season: 'vata',
  },
  {
    id: 'water_intake',
    category: 'seasonal',
    emoji: '💧',
    question: 'How much water have you had so far today?',
    options: [
      { id: 'less_1',   emoji: '💧',    label: 'Less than 1 glass',  score: { vata: 2, pitta: 1, kapha: 0 } },
      { id: 'two_three',emoji: '💧💧',  label: '2–3 glasses',        score: { vata: 1, pitta: 0, kapha: 0 } },
      { id: 'four_six', emoji: '💧💧💧', label: '4–6 glasses',        score: { vata: 0, pitta: 0, kapha: 0 } },
      { id: 'seven_plus',emoji: '🌊',   label: '7+ glasses',         score: { vata: 0, pitta: 0, kapha: 0 } },
    ],
  },

  // ── DOSHA ADAPTIVE ────────────────────────────────────────────────────────
  {
    id: 'vata_check',
    category: 'mind',
    emoji: '🌬️',
    question: 'Is your mind feeling steady and grounded today?',
    doshaFocus: 'vata',
    options: [
      { id: 'grounded',   emoji: '🌳', label: 'Yes — calm and rooted',       score: { vata: 0, pitta: 0, kapha: 0 } },
      { id: 'some_airy',  emoji: '🍃', label: 'Somewhat — a bit restless',   score: { vata: 1, pitta: 0, kapha: 0 } },
      { id: 'scattered_v',emoji: '🌪️', label: 'No — very scattered or anxious', score: { vata: 2, pitta: 0, kapha: 0 } },
    ],
  },
  {
    id: 'pitta_check',
    category: 'mind',
    emoji: '🔥',
    question: 'Have you felt any heat, irritation, or inflammation today?',
    doshaFocus: 'pitta',
    options: [
      { id: 'no_heat',  emoji: '❄️', label: 'No — feeling cool and calm',    score: { vata: 0, pitta: 0, kapha: 0 } },
      { id: 'mild_heat',emoji: '🌤️', label: 'Mild — some impatience',       score: { vata: 0, pitta: 1, kapha: 0 } },
      { id: 'high_heat',emoji: '🔥', label: 'Yes — quite heated or irritable', score: { vata: 0, pitta: 2, kapha: 0 } },
    ],
  },
  {
    id: 'kapha_check',
    category: 'body',
    emoji: '🌿',
    question: 'Has your body felt heavy or slow to get moving today?',
    doshaFocus: 'kapha',
    options: [
      { id: 'light',       emoji: '🌸', label: 'No — light and moving well', score: { vata: 0, pitta: 0, kapha: 0 } },
      { id: 'some_heavy',  emoji: '🏋️', label: 'Somewhat — need more push',  score: { vata: 0, pitta: 0, kapha: 1 } },
      { id: 'very_heavy',  emoji: '🪨', label: 'Yes — very heavy and sluggish', score: { vata: 0, pitta: 0, kapha: 2 } },
    ],
  },
];

// ─── Weekly Base Question Map ──────────────────────────────────────────────────

const WEEKLY_BASE: Record<number, string> = {
  0: 'appetite_morning',    // Sunday
  1: 'digestion_today',     // Monday
  2: 'sleep_quality',       // Tuesday
  3: 'energy_now',          // Wednesday
  4: 'mental_clarity',      // Thursday
  5: 'emotions_today',      // Friday
  6: 'body_feeling',        // Saturday
};

// ─── Season Detection (India-centric) ─────────────────────────────────────────

function getCurrentSeason(): 'vata' | 'pitta' | 'kapha' {
  const month = new Date().getMonth(); // 0=Jan
  if (month >= 9 || month <= 1) return 'vata';  // Oct–Feb
  if (month >= 2 && month <= 5)  return 'kapha'; // Mar–Jun (spring)
  return 'pitta';                                  // Jul–Sep (monsoon/summer)
}

// ─── LocalStorage helpers ─────────────────────────────────────────────────────

export function loadCheckInHistory(): DailyCheckInRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch { return []; }
}

function saveCheckInHistory(records: DailyCheckInRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 90)));
  } catch { /* ignore */ }
}

export function getTodayRecord(): DailyCheckInRecord | null {
  const today = new Date().toISOString().split('T')[0];
  return loadCheckInHistory().find(r => r.date === today) ?? null;
}

export function saveTodayRecord(record: DailyCheckInRecord) {
  const history = loadCheckInHistory().filter(r => r.date !== record.date);
  saveCheckInHistory([record, ...history]);
}

export function shouldShowCheckIn(): boolean {
  if (typeof window === 'undefined') return false;
  const today = new Date().toISOString().split('T')[0];
  const existing = getTodayRecord();
  if (existing) return false; // already done today
  // Only show in the morning (before 11 AM) or all day if not yet done
  return true;
}

// ─── Skip Tracking ────────────────────────────────────────────────────────────

interface SkipRecord { dates: string[]; nudgeSent: boolean; }

export function loadSkipRecord(): SkipRecord {
  try {
    return JSON.parse(localStorage.getItem(SKIP_KEY) ?? '{"dates":[],"nudgeSent":false}');
  } catch { return { dates: [], nudgeSent: false }; }
}

export function recordSkip(): { consecutiveSkips: number; shouldNudge: boolean } {
  const today = new Date().toISOString().split('T')[0];
  const rec = loadSkipRecord();
  if (!rec.dates.includes(today)) rec.dates.push(today);
  rec.dates = rec.dates.slice(-7); // keep last 7 days only

  // Count consecutive skips from today backwards
  let consecutive = 0;
  const sorted = [...rec.dates].sort().reverse();
  for (let i = 0; i < sorted.length; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (sorted[i] === d.toISOString().split('T')[0]) consecutive++;
    else break;
  }

  const shouldNudge = consecutive >= 3 && !rec.nudgeSent;
  if (shouldNudge) rec.nudgeSent = true;
  localStorage.setItem(SKIP_KEY, JSON.stringify(rec));
  return { consecutiveSkips: consecutive, shouldNudge };
}

export function clearSkipStreak() {
  const rec = loadSkipRecord();
  rec.nudgeSent = false; // reset nudge so it can fire again in future
  localStorage.setItem(SKIP_KEY, JSON.stringify(rec));
}

// ─── Question Selector — 3 Logics ─────────────────────────────────────────────

export function selectTodayQuestions(rollingVikruti?: DoshaScore): CheckInQuestion[] {
  const weekday = new Date().getDay();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const history = loadCheckInHistory();
  const yesterdayRecord = history.find(r => r.date === yesterdayStr);
  const season = getCurrentSeason();

  const selected = new Set<string>();
  const questions: CheckInQuestion[] = [];

  const addQ = (id: string) => {
    if (selected.has(id)) return;
    const q = QUESTION_BANK.find(q => q.id === id);
    if (q) { selected.add(id); questions.push(q); }
  };

  // ── Logic 1: Fixed weekly base question ───────────────────────────────────
  const baseId = WEEKLY_BASE[weekday];
  if (baseId) addQ(baseId);

  // ── Logic 2: Yesterday's answer triggered follow-up ───────────────────────
  if (yesterdayRecord && !yesterdayRecord.skipped) {
    const yesterdayAnswerMap: Record<string, string> = {};
    for (const a of yesterdayRecord.answers) {
      yesterdayAnswerMap[a.questionId] = a.optionId;
    }
    for (const q of QUESTION_BANK) {
      if (questions.length >= 4) break;
      if (q.triggerKey && q.triggerValue) {
        if (yesterdayAnswerMap[q.triggerKey] === q.triggerValue) {
          addQ(q.id);
        }
      }
    }
  }

  // ── Logic 3: Dosha/Season adaptive ───────────────────────────────────────
  if (rollingVikruti && questions.length < 5) {
    const dominant = Object.entries(rollingVikruti).sort((a, b) => b[1] - a[1])[0];
    if (dominant && dominant[1] > 35) {
      const focusDosha = dominant[0] as 'vata' | 'pitta' | 'kapha';
      const adaptiveQ = QUESTION_BANK.find(q => q.doshaFocus === focusDosha && !selected.has(q.id));
      if (adaptiveQ) addQ(adaptiveQ.id);
    }
  }

  // Season adaptive (fill to 4 if still short)
  if (questions.length < 4) {
    const seasonQ = QUESTION_BANK.find(q => q.season === season && !selected.has(q.id));
    if (seasonQ) addQ(seasonQ.id);
  }

  // Fill to 3–4 with relevant standbys if still short
  const standbys = ['sleep_quality', 'energy_now', 'digestion_today', 'emotions_today', 'mental_clarity'];
  for (const id of standbys) {
    if (questions.length >= 4) break;
    addQ(id);
  }

  return questions.slice(0, 5);
}

// ─── Vikruti Scoring ──────────────────────────────────────────────────────────

export function scoreAnswers(answers: CheckInAnswer[]): DoshaScore {
  const total: DoshaScore = { vata: 0, pitta: 0, kapha: 0 };
  for (const a of answers) {
    total.vata  += a.score.vata;
    total.pitta += a.score.pitta;
    total.kapha += a.score.kapha;
  }
  return total;
}

export function computeRollingVikruti(days = 7): DoshaScore {
  const history = loadCheckInHistory();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const recent = history.filter(r => new Date(r.date) >= cutoff && !r.skipped);

  if (recent.length === 0) return { vata: 33, pitta: 33, kapha: 34 };

  const totals: DoshaScore = { vata: 0, pitta: 0, kapha: 0 };
  for (const r of recent) {
    totals.vata  += r.vikrutiDelta.vata;
    totals.pitta += r.vikrutiDelta.pitta;
    totals.kapha += r.vikrutiDelta.kapha;
  }
  const sum = totals.vata + totals.pitta + totals.kapha;
  if (sum === 0) return { vata: 33, pitta: 33, kapha: 34 };
  return {
    vata:  Math.round((totals.vata  / sum) * 100),
    pitta: Math.round((totals.pitta / sum) * 100),
    kapha: Math.round((totals.kapha / sum) * 100),
  };
}

export function getElevatedDosha(vikruti: DoshaScore): 'vata' | 'pitta' | 'kapha' | 'balanced' {
  const max = Math.max(vikruti.vata, vikruti.pitta, vikruti.kapha);
  if (max < 40) return 'balanced';
  if (vikruti.vata === max) return 'vata';
  if (vikruti.pitta === max) return 'pitta';
  return 'kapha';
}
