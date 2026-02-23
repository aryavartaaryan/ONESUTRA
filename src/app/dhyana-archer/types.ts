// ── Raga Bhopali: Sa Re Ga Pa Dha (C D E G A) — two octaves ──────────────────
export const RAGA_BHOPALI = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 784.0, 880.0];

// Vedic symbols for Smriti mode
export const SMRITI_SYMS = ['❀', '🐚', '☸', '🔱', '🕉'];
export const SMRITI_LABELS = ['Lotus', 'Conch', 'Chakra', 'Trishul', 'Om'];

// Pot anchor positions (as fractions of canvas W, H)
export const POT_ANCHORS: { ax: number; ay: number; ropeLen: number }[] = [
    { ax: 0.23, ay: 0.23, ropeLen: 80 },
    { ax: 0.29, ay: 0.33, ropeLen: 70 },
    { ax: 0.24, ay: 0.43, ropeLen: 65 },
    { ax: 0.76, ay: 0.24, ropeLen: 78 },
    { ax: 0.71, ay: 0.35, ropeLen: 72 },
];

export type Mode = 'GANITA' | 'SMRITI';
export type Screen = 'MENU' | 'PLAYING' | 'TRATAK' | 'GAMEOVER';

export interface ShatterParticle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; }
export interface Pot {
    id: number;
    anchorX: number; anchorY: number; ropeLen: number;
    angle: number; angleVel: number;          // pendulum physics
    label: string; isCorrect: boolean;
    state: 'hanging' | 'shattering' | 'gone';
    shatter: ShatterParticle[];
}
export interface Arrow { id: number; x: number; y: number; vx: number; vy: number; }
export interface Mote { x: number; y: number; vx: number; vy: number; alpha: number; r: number; }

export interface GS {
    t: number;              // cumulative time (seconds)
    mode: Mode;
    score: number; streak: number; prana: number;
    correctHits: number;   // resets every 7 → trigger Tratak
    question: string; ganitiAnswer: number;
    smritiSeq: number[]; smritiPhase: 'SHOW' | 'SHOOT'; smritiShot: number; smritiShowTimer: number;
    pots: Pot[]; arrows: Arrow[]; motes: Mote[];
    potId: number; arrowId: number;
    spawnTimer: number; modeTimer: number;
    flashR: number; flashG: number; flashB: number; flashA: number;
    gameOver: boolean;
    guruBlink: number;     // timer to show guru speech
    // Tratak
    tratakPhase: 'NONE' | 'INTRO' | 'FOCUS' | 'REWARD';
    tratakFocusMsAcc: number;
    tratakRewardTimer: number;
    tratakFocusLost: boolean;
    tratakIntroTimer: number;
}
