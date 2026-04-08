/**
 * bodhiVoice.ts — Bodhi background voice for habit log announcements.
 * - Gemini Live TTS (Aoede voice), PCM streaming via AudioContext
 * - Language auto-detected from 'site-lang' in localStorage (default: 'hi')
 * - Messages are very brief: habit logged + benefit + next nudge (1-2 sentences)
 */

// ─── Language ─────────────────────────────────────────────────────────────────
function getLang(): 'en' | 'hi' {
    if (typeof localStorage === 'undefined') return 'hi';
    return localStorage.getItem('site-lang') === 'en' ? 'en' : 'hi';
}

export type TimeSlot = 'morning' | 'midday' | 'evening' | 'night';

export interface BodhiSpeakLogParams {
    habitIcon?: string;
    habitName: string;
    isLocked: boolean;
    lockReason?: string;
    prereqName?: string;
    timeSlot?: TimeSlot;
    isOnTime?: boolean;
}

export const BODHI_INJECT_KEY = 'bodhi_pending_inject';

// ─── Audio singleton ──────────────────────────────────────────────────────────
const OUTPUT_SAMPLE_RATE = 24000;
const BODHI_TTS_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';

let _ctx: AudioContext | null = null;
let _stop: (() => void) | null = null;

function getAudioCtx(): AudioContext {
    if (!_ctx || _ctx.state === 'closed') _ctx = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
    return _ctx;
}

// ─── Greetings ────────────────────────────────────────────────────────────────
function getSlotGreeting(slot?: TimeSlot): string {
    if (getLang() === 'en') {
        switch (slot) {
            case 'morning': return 'Good morning!';
            case 'midday': return 'Hey!';
            case 'evening': return 'Good evening!';
            case 'night': return 'Good night!';
            default: return 'Hey!';
        }
    }
    switch (slot) {
        case 'morning': return 'शुभ प्रभात!';
        case 'midday': return 'नमस्ते!';
        case 'evening': return 'शुभ संध्या!';
        case 'night': return 'शुभ रात्रि!';
        default: return 'नमस्ते!';
    }
}

// ─── Per-habit Ayurvedic benefits ────────────────────────────────────────────
const BENEFITS_HI: Record<string, string> = {
    wake: 'सर्केडियन रिदम सेट होती है।',
    bath: 'शरीर और ऊर्जा शुद्ध होती है।',
    breakfast: 'अग्नि सही समय पर जागती है।',
    breathwork: 'तंत्रिका तंत्र रीसेट होता है।',
    morning_light: 'मेलाटोनिन नियंत्रित होता है।',
    lunch: 'पित्त काल का श्रेष्ठ पोषण।',
    deep_work: 'पित्त की तीव्रता से फोकस मिलता है।',
    screen_break: 'आंखें और मन ताज़े होते हैं।',
    hydration: 'जल ही जीवन — प्राण सक्रिय।',
    workout: 'शरीर में ऊर्जा और हल्कापन आता है।',
    dinner: 'ओजस की रक्षा होती है।',
    digital_sunset: 'गहरी नींद के लिए मेलाटोनिन सुरक्षित।',
    brain_dump: 'आज का विचार कल की सिद्धि।',
    sleep: 'सेलुलर पुनर्जनन शुरू होता है।',
    gratitude: 'मन आनंद की ओर मुड़ता है।',
    dinner_night: 'रात्रि का सात्त्विक पोषण।',
    read: 'सोने से पहले मन को ज्ञान।',
    meditation: 'चित्त शांत और केंद्रित होता है।',
    pranayama: 'प्राण शक्ति बढ़ती है।',
    yoga: 'शरीर और मन का संतुलन।',
};

const BENEFITS_EN: Record<string, string> = {
    wake: 'Circadian rhythm aligned.',
    bath: 'Body and energy field cleansed.',
    breakfast: 'Agni fueled at its peak.',
    breathwork: 'Nervous system reset.',
    morning_light: 'Melatonin regulated.',
    lunch: 'Best nourishment of the Pitta window.',
    deep_work: 'Peak focus from Pitta energy.',
    screen_break: 'Eyes and mind refreshed.',
    hydration: 'Prana flowing — water is life.',
    workout: 'Lightness and energy in the body.',
    dinner: 'Ojas protected.',
    digital_sunset: 'Melatonin preserved for deep sleep.',
    brain_dump: 'Today\'s thought becomes tomorrow\'s achievement.',
    sleep: 'Cellular regeneration begins.',
    gratitude: 'Brain rewired toward joy.',
    dinner_night: 'Final sattvic nourishment of the night.',
    read: 'Mind nourished with wisdom.',
    meditation: 'Mind calm and centered.',
    pranayama: 'Prana expanded.',
    yoga: 'Body and mind balanced.',
};

function getHabitBenefit(name: string): string {
    const key = name.toLowerCase().replace(/[^a-z]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    return getLang() === 'en' ? (BENEFITS_EN[key] ?? '') : (BENEFITS_HI[key] ?? '');
}

// ─── Message builders — very brief ────────────────────────────────────────────
function buildSuccessMessage(p: BodhiSpeakLogParams): string {
    const g = getSlotGreeting(p.timeSlot);
    const b = getHabitBenefit(p.habitName);
    if (getLang() === 'en') {
        return b
            ? `${g} ${p.habitName} logged! ${b} Keep going!`
            : `${g} ${p.habitName} logged! Well done!`;
    }
    return b
        ? `${g} ${p.habitName} लॉग हुआ! ${b} अगला अभ्यास करें!`
        : `${g} ${p.habitName} लॉग हुआ! शाबाश!`;
}

function buildLockedMessage(p: BodhiSpeakLogParams): string {
    const g = getSlotGreeting(p.timeSlot);
    const prereq = p.prereqName ?? (getLang() === 'en' ? 'the previous habit' : 'पिछला अभ्यास');
    const b = getHabitBenefit(p.habitName);
    if (getLang() === 'en') {
        return b
            ? `${g} ${p.habitName} is locked. ${b} Complete ${prereq} first.`
            : `${g} ${p.habitName} is locked. Complete ${prereq} first.`;
    }
    return b
        ? `${g} ${p.habitName} लॉक है। ${b} पहले ${prereq} पूरा करें।`
        : `${g} ${p.habitName} लॉक है। पहले ${prereq} पूरा करें।`;
}

function buildAllDoneMessage(slot?: TimeSlot): string {
    const g = getSlotGreeting(slot);
    if (getLang() === 'en') return `${g} All done! Amazing practice today!`;
    const s = slot === 'morning' ? 'प्रातःकाल' : slot === 'midday' ? 'मध्याह्न' : slot === 'evening' ? 'सांध्यकाल' : 'रात्रि';
    return `${g} ${s} के सभी अभ्यास पूरे! जय हो!`;
}

// ─── Gemini Live speaker ──────────────────────────────────────────────────────
async function speakViaGeminiLive(text: string): Promise<void> {
    if (typeof window === 'undefined') return;
    if (_stop) { _stop(); _stop = null; }

    let stopped = false;
    let session: { close: () => void } | null = null;
    const queue: Float32Array[] = [];
    let isPlaying = false;
    let ctx: AudioContext | null = null;

    _stop = () => {
        stopped = true;
        if (session) { try { session.close(); } catch { /* ignore */ } session = null; }
        queue.length = 0;
        isPlaying = false;
        if (ctx && ctx.state !== 'closed') ctx.suspend().catch(() => { /* ignore */ });
    };

    window.dispatchEvent(new CustomEvent<{ speaking: boolean }>('bodhi-log-speaking', { detail: { speaking: true } }));
    const doneSpeaking = () => window.dispatchEvent(new CustomEvent<{ speaking: boolean }>('bodhi-log-speaking', { detail: { speaking: false } }));

    const base64ToFloat32 = (b64: string): Float32Array => {
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const pcm16 = new Int16Array(bytes.buffer);
        const f32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) f32[i] = pcm16[i] / 0x8000;
        return f32;
    };

    const playNext = () => {
        if (stopped || queue.length === 0) { isPlaying = false; if (!stopped) doneSpeaking(); return; }
        if (!ctx || ctx.state === 'closed') { isPlaying = false; doneSpeaking(); return; }
        if (ctx.state === 'suspended') {
            ctx.resume().then(() => { if (!stopped) playNext(); }).catch(() => { isPlaying = false; doneSpeaking(); });
            return;
        }
        isPlaying = true;
        let chunk = queue.shift()!;
        while (queue.length > 0 && chunk.length < OUTPUT_SAMPLE_RATE * 0.1) {
            const next = queue.shift()!;
            const merged = new Float32Array(chunk.length + next.length);
            merged.set(chunk); merged.set(next, chunk.length);
            chunk = merged;
        }
        try {
            const fade = Math.min(64, Math.floor(chunk.length / 4));
            for (let i = 0; i < fade; i++) { const t = i / fade; chunk[i] *= t; chunk[chunk.length - 1 - i] *= t; }
            const buf = ctx.createBuffer(1, chunk.length, OUTPUT_SAMPLE_RATE);
            buf.getChannelData(0).set(chunk);
            const src = ctx.createBufferSource();
            src.buffer = buf;
            src.connect(ctx.destination);
            src.onended = () => { if (!stopped) playNext(); else isPlaying = false; };
            src.start();
        } catch { isPlaying = false; doneSpeaking(); }
    };

    const enqueue = (data: Float32Array) => { queue.push(data); if (!isPlaying) playNext(); };

    const lang = getLang();
    const systemInstruction = lang === 'en'
        ? 'You are Bodhi, a warm Ayurvedic guide. Speak the given message naturally in English — warm, caring, very brief (1-2 sentences max). Do not add anything beyond what is given.'
        : 'आप बोधि हैं — गर्मजोशी से भरे आयुर्वेदिक मार्गदर्शक। दिया गया संदेश हिंदी में स्वाभाविक रूप से बोलें — संक्षिप्त, गर्म, अधिकतम 1-2 वाक्य। जो दिया है उससे अधिक कुछ न जोड़ें।';

    try {
        const tokenRes = await fetch('/api/gemini-live-token', { method: 'POST' });
        if (!tokenRes.ok) throw new Error('token');
        const { apiKey } = await tokenRes.json();
        if (!apiKey || stopped) throw new Error('no key');

        ctx = getAudioCtx();
        ctx.resume().catch(() => { /* ignore */ });

        const { GoogleGenAI, Modality } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });

        const liveSession = await ai.live.connect({
            model: BODHI_TTS_MODEL,
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } } },
                systemInstruction,
            },
            callbacks: {
                onopen: () => { /* connected */ },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onmessage: (msg: any) => {
                    if (stopped) return;
                    const parts = msg?.serverContent?.modelTurn?.parts ?? [];
                    for (const part of parts) {
                        if (part?.inlineData?.data) enqueue(base64ToFloat32(part.inlineData.data));
                    }
                    if (msg?.serverContent?.turnComplete) {
                        try { liveSession?.close(); } catch { /* ignore */ }
                    }
                },
                onerror: () => doneSpeaking(),
                onclose: () => { /* done */ },
            },
        });

        if (stopped) { liveSession.close(); doneSpeaking(); return; }
        session = liveSession;
        liveSession.sendClientContent({ turns: [{ role: 'user', parts: [{ text }] }], turnComplete: true });
    } catch {
        doneSpeaking();
    }
}

// ─── Public API ───────────────────────────────────────────────────────────────
export function bodhiSpeakLog(params: BodhiSpeakLogParams): void {
    const message = params.isLocked ? buildLockedMessage(params) : buildSuccessMessage(params);
    try { sessionStorage.setItem(BODHI_INJECT_KEY, params.habitName); } catch { /* ignore */ }
    speakViaGeminiLive(message).catch(() => { /* ignore */ });
}

export function bodhiSpeakAllDone(timeSlot?: TimeSlot): void {
    try { sessionStorage.setItem(BODHI_INJECT_KEY, getLang() === 'en' ? 'All done!' : 'सब पूरा!'); } catch { /* ignore */ }
    speakViaGeminiLive(buildAllDoneMessage(timeSlot)).catch(() => { /* ignore */ });
}

export function stopBodhiSpeak(): void {
    if (_stop) { _stop(); _stop = null; }
}
