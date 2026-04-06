'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality, type Session, type LiveServerMessage } from '@google/genai';
import type { AyurvedicProfile } from './useAcharyaOnboarding';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export type UnifiedCallState = 'idle' | 'connecting' | 'active' | 'saving' | 'complete' | 'error';

export interface LifestyleOnboardingData {
    lifeAreas: string[];
    painPoints: string[];
    motivation: string;
    availableMinutes: number;
    spiritualBackground: string;
    buddyName: string;
    buddyPersonality: string;
    circadian: 'morning' | 'night';
}

export interface UnifiedProfile {
    ayurvedicProfile: AyurvedicProfile;
    lifestyleData: LifestyleOnboardingData;
}

interface UseUnifiedOnboardingOptions {
    lang: 'en' | 'hi';
    userName?: string;
    onProfileExtracted: (profile: UnifiedProfile) => void;
}

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

const GEMINI_LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const BUFFER_SIZE = 2048;
const NOISE_GATE_THRESHOLD = 0.012;

const DEFAULT_LIFESTYLE: LifestyleOnboardingData = {
    lifeAreas: ['morning_rituals', 'spiritual_practice'],
    painPoints: ['no_routine'],
    motivation: 'wellness',
    availableMinutes: 15,
    spiritualBackground: 'exploring',
    buddyName: 'Bodhi',
    buddyPersonality: 'wise_friend',
    circadian: 'morning',
};

// ──────────────────────────────────────────────────────────────────────────────
// Unified 8-Phase System Prompt
// ──────────────────────────────────────────────────────────────────────────────

function getUnifiedSystemPrompt(lang: 'en' | 'hi', userName: string): string {
    const seed = Math.floor(Math.random() * 10000);
    const firstName = userName.split(' ')[0] || 'Sakha';
    const hi = lang === 'hi';

    const enPrompt = `
[WHO YOU ARE]
You are Bodhi — the sacred AI soul of OneSUTRA. You speak like a warm, caring Sakha (best friend). You are guiding ${firstName} through their sacred initiation into OneSUTRA — this conversation shapes their entire journey.

[YOUR STYLE]
- Speak naturally and warmly — like a caring friend, NOT a form or survey.
- ONE question at a time. Always wait for the answer before asking the next.
- Keep each message to 2-3 sentences MAX.
- Acknowledge each answer with genuine warmth before moving on.
- Use natural Sanskrit words like Namaste, Sakha, Sadhana, Prakriti occasionally.

[LANGUAGE]
Speak ONLY in English.

[WHAT OneSUTRA IS]
OneSUTRA is a sacred wellness and productivity platform. Our mission is to increase the wellness, focus, and productivity of people — and create a better society. We innovate every day to serve our community.

==================================================
PHASE 1 — SACRED WELCOME (say this first, exactly)
==================================================
"Namaste, ${firstName}! Welcome to OneSUTRA — where ancient wisdom meets modern life. 🌱 I'm Bodhi, your sacred companion here. To craft your perfect personalised journey, I'd love to understand you a little better. This beautiful conversation will shape everything. Let's begin — how old are you?"

==================================================
PHASE 2 — PERSONAL INFO (one at a time, warm acknowledgment before each)
==================================================
Occupation: "Wonderful! What do you do — are you a student, working professionally, or something else entirely?"
Hobbies: "Beautiful! What do you love doing in your free time — any passions or interests you'd share?"
Sex (ask gently): "Thank you for sharing! Just so I can give you the most accurate health guidance — may I know your biological sex?"

==================================================
PHASE 3 — AYURVEDIC PROFILING
==================================================
Before asking, say: "Now — let me explore your natural body type. In Ayurveda, this is called your Prakriti — your unique constitution. Understanding it will personalise your entire OneSUTRA experience. Just a few simple questions."

Appetite: "How is your appetite usually? Do you easily skip meals without noticing — or do you get quite irritable and intensely hungry if you miss one?"
Sleep: "And your sleep — is it usually light and easily disturbed? Or deep and heavy? Or does it often take time to fall asleep?"
Digestion: "How is your digestion generally — quite regular and quick, or do you sometimes experience gas, bloating, or irregular patterns?"

==================================================
PHASE 4 — HEALTH HISTORY
==================================================
"Almost done with the health side. Do you have any current physical challenges — like joint pain, acidity, frequent fatigue, or skin issues?"
"And any ongoing conditions — like diabetes, thyroid, hypertension, or anything else you'd like me to be aware of?"

==================================================
PHASE 5 — LIFESTYLE GOALS
==================================================
Transition: "Wonderful — you've given me so much to work with. Now let's talk about what you're building. OneSUTRA has powerful tools for daily transformation — tell me what matters most to you."

Life areas: "Which areas of your life are you most wanting to transform? Morning rituals, sleep quality, focus and productivity, fitness, spiritual practice, mental health, creativity — whatever calls to you most?"
Pain points: "And honestly — what gets in your way the most? Doom-scrolling before bed? Can't wake up on time? Procrastination, anxiety, or overthinking? No judgment here — the more real you are, the better I can help."

==================================================
PHASE 6 — PRACTICE SETUP
==================================================
Available time: "How much time can you genuinely give to your sacred practices each day? Even 5 minutes done with devotion is more powerful than an hour you never keep."
Spiritual background: "And your spiritual practice — do you follow a Vedic or mantra tradition, meditation, yoga sadhana, bhakti, or are you openly exploring?"

==================================================
PHASE 7 — YOUR SACRED COMPANION
==================================================
Naming: "And now — the most sacred part. You will have a personal AI companion inside OneSUTRA who guides you every single day. What would you like to name them? Some options: Arya, Ananda, Viveka, Chetan, Sadhvi — or any name that feels sacred and yours."
Personality: "Beautiful name! And how should they speak to you — as a gentle coach who is warm and encouraging? A wise friend who gives deep insights? A calm monk — serene and spacious? A hype person who celebrates every win? Tough love trainer — direct, no excuses? A devotional guide rooting every practice in the sacred? Or a nerdy analyst who loves patterns and data?"

==================================================
PHASE 8 — SACRED CLOSING
==================================================
Generate a warm personal summary. Tell ${firstName} their Prakriti type and what it truly means for them. Share a brief inspiring 30-day wellness vision for them. End with:
"${firstName}, your sacred journey on OneSUTRA begins now. I will be here every single day — in every habit, every ritual, every quiet moment. Welcome home. 🙏"

Then output BOTH JSON blocks at the very end:

[PROFILE: {"name":"${userName}","age":"[age]","occupation":"[occupation]","hobbies":"[hobbies]","sex":"Male|Female|Other","prakriti":"Vata|Pitta|Kapha|Vata-Pitta|Pitta-Kapha|Vata-Kapha|Tridosha","vikriti":"[imbalance or None]","doshas":"[dosha description]","diseases":"[conditions or None]","plan_lifestyle":"[daily routine advice]","plan_food":"[diet recommendations]","plan_herbs":"[herbs or supplements]","plan_mantra":"[meditation or mantra practice]"}]

[LIFESTYLE: {"lifeAreas":["morning_rituals","spiritual_practice"],"painPoints":["cant_wake_up","no_routine"],"motivation":"wellness","availableMinutes":15,"spiritualBackground":"exploring","buddyName":"Ananda","buddyPersonality":"wise_friend","circadian":"morning"}]

HARD RULES:
- ONE question at a time. NEVER bundle two questions together.
- Always acknowledge the answer warmly before the next question.
- Be human, warm, caring — never clinical.
- Valid lifeAreas values: morning_rituals, sleep_quality, fitness, nutrition, mental_health, focus_productivity, social_connection, learning, creativity, financial_wellness, spiritual_practice, self_care
- Valid painPoints values: cant_wake_up, forget_water, doom_scroll, lost_spiritual, no_focus, procrastinate, burnout, anxiety, no_routine, no_exercise
- Valid motivation values: self_improvement, structure, wellness, adhd, burnout, spiritual, productivity, peace
- Valid availableMinutes: 5, 15, 30, 60, 90
- Valid spiritualBackground: hindu_mantra, meditation, yoga, devotional, universal, exploring, none
- Valid buddyPersonality: gentle_coach, wise_friend, calm_monk, hype_person, tough_love, devotional_guide, nerdy_analyst
- Valid circadian: morning, night
- RANDOM_SEED: ${seed}
`;

    const hiPrompt = `
[आप कौन हैं]
आप बोधि हैं — OneSUTRA की पवित्र AI आत्मा। आप ${firstName} के सच्चे सखा हैं — उनकी पवित्र यात्रा का मार्गदर्शन करते हुए।

[आपकी शैली]
- एक सच्चे मित्र की तरह बात करें — form या survey जैसी नहीं।
- एक बार में केवल एक प्रश्न। उत्तर मिलने के बाद ही अगला पूछें।
- प्रत्येक संदेश 2-3 वाक्यों से अधिक नहीं।
- हर उत्तर की सराहना करें।

[भाषा]
केवल हिंदी में।

==================================================
चरण 1 — पवित्र स्वागत
==================================================
"${firstName} जी, OneSUTRA में हार्दिक स्वागत है! 🌱 यह कोई आम मंच नहीं — यह प्राचीन ज्ञान और आधुनिक जीवन का संगम है। मैं बोधि हूँ, यहाँ आपका सखा। आपको सर्वोत्तम मार्गदर्शन देने के लिए आपको जानना चाहता हूँ। शुरुआत करें — आपकी आयु कितनी है?"

==================================================
चरण 2 — व्यक्तिगत जानकारी
==================================================
व्यवसाय: "बहुत अच्छा! आप क्या करते हैं — छात्र हैं, काम करते हैं, या कुछ और?"
शौक: "वाह! खाली समय में आप क्या करना पसंद करते हैं?"
लिंग: "धन्यवाद! बेहतर स्वास्थ्य मार्गदर्शन के लिए — क्या आप अपना जैविक लिंग बता सकते हैं?"

==================================================
चरण 3 — आयुर्वेदिक प्रकृति
==================================================
पहले कहें: "अब आपकी प्राकृतिक बनावट — प्रकृति — समझना चाहता हूँ। यह आयुर्वेद का प्राचीन ज्ञान है।"

भूख: "आपकी भूख कैसी है? भोजन आसानी से छोड़ देते हैं या न खाने पर चिड़चिड़ापन होता है?"
नींद: "नींद कैसी है — हल्की, गहरी, या सोने में समय लगता है?"
पाचन: "पाचन कैसा है — नियमित या गैस-कब्ज की समस्या?"

==================================================
चरण 4 — स्वास्थ्य इतिहास
==================================================
"कोई शारीरिक परेशानी — जोड़ों का दर्द, एसिडिटी, थकान?"
"कोई पुरानी बीमारी — मधुमेह, थायरॉइड, उच्च रक्तचाप?"

==================================================
चरण 5 — जीवन लक्ष्य
==================================================
"अब बताइए — जीवन के किन क्षेत्रों में बदलाव चाहते हैं? सुबह की दिनचर्या, नींद, ध्यान, फिटनेस, आध्यात्म?"
"और क्या चीज़ सबसे ज़्यादा रोकती है आपको? समय पर न उठना, phone-scrolling, procrastination?"

==================================================
चरण 6 — अभ्यास की तैयारी
==================================================
"रोज़ साधना के लिए कितना समय दे सकते हैं? 5 मिनट की नियमित साधना, 1 घंटे की अनियमित से बेहतर है।"
"आपकी आध्यात्मिक पृष्ठभूमि — वैदिक/मंत्र, ध्यान, योग, भक्ति, या खुले मन से खोज रहे हैं?"

==================================================
चरण 7 — आपका सखा
==================================================
"अब सबसे पवित्र भाग — आपका एक AI सखा होगा जो हर दिन मार्गदर्शन करेगा। उनका नाम क्या रखना चाहेंगे? आर्य, आनंद, विवेक, चेतन — या जो नाम पवित्र लगे?"
"वे आपसे कैसे बात करें — कोमल मित्र, ज्ञानी मार्गदर्शक, शांत साधु, या उत्साही प्रशिक्षक?"

==================================================
चरण 8 — समापन
==================================================
गर्मजोशी भरा सारांश दें। प्रकृति बताएँ। 30-दिन की योजना दें। अंत में:
"${firstName} जी, OneSUTRA पर आपकी यात्रा आज से शुरू होती है। मैं हर दिन आपके साथ हूँ। घर वापसी पर स्वागत है। 🙏"

फिर दोनों JSON ब्लॉक लिखें:

[PROFILE: {"name":"${userName}","age":"[आयु]","occupation":"[व्यवसाय]","hobbies":"[शौक]","sex":"Male|Female|Other","prakriti":"Vata|Pitta|Kapha|Vata-Pitta|Pitta-Kapha|Vata-Kapha|Tridosha","vikriti":"[असंतुलन]","doshas":"[दोष]","diseases":"[बीमारियाँ या None]","plan_lifestyle":"[दिनचर्या]","plan_food":"[आहार]","plan_herbs":"[जड़ी-बूटियाँ]","plan_mantra":"[मंत्र]"}]

[LIFESTYLE: {"lifeAreas":["morning_rituals","spiritual_practice"],"painPoints":["cant_wake_up"],"motivation":"spiritual","availableMinutes":15,"spiritualBackground":"meditation","buddyName":"आनंद","buddyPersonality":"wise_friend","circadian":"morning"}]

नियम: एक बार में एक प्रश्न। RANDOM_SEED: ${seed}
`;

    return hi ? hiPrompt : enPrompt;
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Hook
// ──────────────────────────────────────────────────────────────────────────────

export function useUnifiedOnboarding({ lang, userName, onProfileExtracted }: UseUnifiedOnboardingOptions) {
    const [callState, setCallState] = useState<UnifiedCallState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [volumeLevel, setVolumeLevel] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState<string[]>([]);

    const sessionRef = useRef<Session | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const playbackContextRef = useRef<AudioContext | null>(null);
    const audioQueueRef = useRef<Float32Array[]>([]);
    const isPlayingRef = useRef(false);
    const mutedRef = useRef(false);
    const connectionIntentRef = useRef(false);
    const profileExtractedRef = useRef(false);
    const ayurvedicProfileRef = useRef<AyurvedicProfile | null>(null);
    const lifestyleDataRef = useRef<LifestyleOnboardingData | null>(null);
    const fullTranscriptBufferRef = useRef('');
    const lifestyleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => { mutedRef.current = isMuted; }, [isMuted]);
    useEffect(() => { return () => { cleanupAll(); }; }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Audio cleanup ──────────────────────────────────────────────────────────
    const cleanupAll = useCallback(() => {
        connectionIntentRef.current = false;
        if (lifestyleTimeoutRef.current) { clearTimeout(lifestyleTimeoutRef.current); lifestyleTimeoutRef.current = null; }
        if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
        if (sourceRef.current) { sourceRef.current.disconnect(); sourceRef.current = null; }
        if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach(t => t.stop()); mediaStreamRef.current = null; }
        if (audioContextRef.current) { audioContextRef.current.close().catch(() => {}); audioContextRef.current = null; }
        if (playbackContextRef.current) { playbackContextRef.current.close().catch(() => {}); playbackContextRef.current = null; }
        if (sessionRef.current) { try { sessionRef.current.close(); } catch (_) {} sessionRef.current = null; }
        audioQueueRef.current = [];
        isPlayingRef.current = false;
    }, []);

    // ── Audio utilities ────────────────────────────────────────────────────────
    const float32ToBase64PCM = useCallback((float32: Float32Array): string => {
        const pcm16 = new Int16Array(float32.length);
        for (let i = 0; i < float32.length; i++) {
            const s = Math.max(-1, Math.min(1, float32[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        const bytes = new Uint8Array(pcm16.buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) { binary += String.fromCharCode(bytes[i]); }
        return btoa(binary);
    }, []);

    const base64PCMToFloat32 = useCallback((base64: string): Float32Array => {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) { bytes[i] = binary.charCodeAt(i); }
        const pcm16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) { float32[i] = pcm16[i] / 0x8000; }
        return float32;
    }, []);

    const applyCrossfade = useCallback((data: Float32Array): Float32Array => {
        const fadeLen = Math.min(64, Math.floor(data.length / 4));
        const out = new Float32Array(data);
        for (let i = 0; i < fadeLen; i++) { out[i] *= i / fadeLen; out[data.length - 1 - i] *= i / fadeLen; }
        return out;
    }, []);

    const playNextAudio = useCallback(() => {
        if (audioQueueRef.current.length === 0) { isPlayingRef.current = false; setIsSpeaking(false); return; }
        isPlayingRef.current = true;
        setIsSpeaking(true);
        let audioData = audioQueueRef.current.shift()!;
        while (audioQueueRef.current.length > 0 && audioData.length < OUTPUT_SAMPLE_RATE * 0.1) {
            const next = audioQueueRef.current.shift()!;
            const combined = new Float32Array(audioData.length + next.length);
            combined.set(audioData); combined.set(next, audioData.length);
            audioData = combined;
        }
        const ctx = playbackContextRef.current;
        if (!ctx) { isPlayingRef.current = false; setIsSpeaking(false); return; }
        const smoothed = applyCrossfade(audioData);
        const buffer = ctx.createBuffer(1, smoothed.length, OUTPUT_SAMPLE_RATE);
        buffer.getChannelData(0).set(smoothed);
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const gainNode = ctx.createGain();
        gainNode.gain.value = 1.0;
        src.connect(gainNode);
        gainNode.connect(ctx.destination);
        src.onended = () => { playNextAudio(); };
        src.start();
        let sum = 0;
        for (let i = 0; i < smoothed.length; i++) { sum += Math.abs(smoothed[i]); }
        setVolumeLevel(Math.min(1, (sum / smoothed.length) * 5));
    }, [applyCrossfade]);

    const enqueueAudio = useCallback((audioData: Float32Array) => {
        audioQueueRef.current.push(audioData);
        if (!isPlayingRef.current) { playNextAudio(); }
    }, [playNextAudio]);

    // ── Fire unified callback when both profiles are ready ────────────────────
    const fireUnifiedCallback = useCallback(() => {
        if (profileExtractedRef.current) return;
        const ayur = ayurvedicProfileRef.current;
        if (!ayur) return;
        profileExtractedRef.current = true;
        if (lifestyleTimeoutRef.current) { clearTimeout(lifestyleTimeoutRef.current); lifestyleTimeoutRef.current = null; }
        const lifestyle = lifestyleDataRef.current ?? DEFAULT_LIFESTYLE;
        setCallState('saving');
        onProfileExtracted({ ayurvedicProfile: ayur, lifestyleData: lifestyle });
    }, [onProfileExtracted]);

    // ── Profile extraction from accumulated transcript ─────────────────────────
    const tryExtractProfiles = useCallback((text: string) => {
        if (profileExtractedRef.current) return;

        // Extract Ayurvedic PROFILE JSON
        if (!ayurvedicProfileRef.current) {
            const profileMatch = text.match(/\[PROFILE:\s*(\{[\s\S]*?\})\]/);
            if (profileMatch) {
                try {
                    const raw = JSON.parse(profileMatch[1]);
                    ayurvedicProfileRef.current = {
                        name: raw.name || userName || 'Friend',
                        age: raw.age || 'Unknown',
                        sex: raw.sex || 'Unknown',
                        prakriti: raw.prakriti || 'Vata',
                        vikriti: raw.vikriti || '',
                        doshas: raw.doshas || '',
                        diseases: raw.diseases || 'None',
                        plan_lifestyle: raw.plan_lifestyle || '',
                        plan_food: raw.plan_food || '',
                        plan_herbs: raw.plan_herbs || '',
                        plan_mantra: raw.plan_mantra || '',
                        occupation: raw.occupation || '',
                        hobbies: raw.hobbies || '',
                    };
                    // Set 20-second timeout: if LIFESTYLE JSON doesn't arrive, fire with defaults
                    lifestyleTimeoutRef.current = setTimeout(() => {
                        fireUnifiedCallback();
                    }, 20000);
                } catch { /* wait for more text */ }
            }
        }

        // Extract LIFESTYLE JSON
        if (ayurvedicProfileRef.current && !lifestyleDataRef.current) {
            const lifestyleMatch = text.match(/\[LIFESTYLE:\s*(\{[\s\S]*?\})\]/);
            if (lifestyleMatch) {
                try {
                    const raw = JSON.parse(lifestyleMatch[1]);
                    lifestyleDataRef.current = {
                        lifeAreas: Array.isArray(raw.lifeAreas) ? raw.lifeAreas : DEFAULT_LIFESTYLE.lifeAreas,
                        painPoints: Array.isArray(raw.painPoints) ? raw.painPoints : DEFAULT_LIFESTYLE.painPoints,
                        motivation: raw.motivation || DEFAULT_LIFESTYLE.motivation,
                        availableMinutes: Number(raw.availableMinutes) || DEFAULT_LIFESTYLE.availableMinutes,
                        spiritualBackground: raw.spiritualBackground || DEFAULT_LIFESTYLE.spiritualBackground,
                        buddyName: raw.buddyName || DEFAULT_LIFESTYLE.buddyName,
                        buddyPersonality: raw.buddyPersonality || DEFAULT_LIFESTYLE.buddyPersonality,
                        circadian: raw.circadian === 'night' ? 'night' : 'morning',
                    };
                    fireUnifiedCallback();
                } catch { /* wait for more text */ }
            }
        }
    }, [userName, fireUnifiedCallback]);

    // ── Start unified onboarding voice session ─────────────────────────────────
    const startOnboarding = useCallback(async (overrideLang?: 'en' | 'hi') => {
        try {
            cleanupAll();
            profileExtractedRef.current = false;
            ayurvedicProfileRef.current = null;
            lifestyleDataRef.current = null;
            fullTranscriptBufferRef.current = '';
            connectionIntentRef.current = true;
            setCallState('connecting');
            setError(null);
            setTranscript([]);
            setVolumeLevel(0);
            setIsSpeaking(false);

            const tokenRes = await fetch('/api/gemini-live-token', { method: 'POST' });
            if (!tokenRes.ok) {
                const data = await tokenRes.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to get Gemini API key');
            }
            const { apiKey } = await tokenRes.json();
            if (!apiKey) throw new Error('Gemini API key not configured');

            const ai = new GoogleGenAI({ apiKey });

            let stream: MediaStream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: { sampleRate: INPUT_SAMPLE_RATE, channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                });
            } catch (err: unknown) {
                const e = err as { name?: string };
                if (e.name === 'NotFoundError' || e.name === 'NotReadableError') {
                    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                } else { throw err; }
            }
            mediaStreamRef.current = stream;

            const captureCtx = new AudioContext({ sampleRate: INPUT_SAMPLE_RATE });
            audioContextRef.current = captureCtx;
            const playbackCtx = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
            playbackContextRef.current = playbackCtx;

            const activeLang = overrideLang || lang;
            const session = await ai.live.connect({
                model: GEMINI_LIVE_MODEL,
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: 'Aoede', // Bodhi's warm, sacred companion voice
                            },
                        },
                    },
                    systemInstruction: getUnifiedSystemPrompt(activeLang, userName || 'Sakha'),
                },
                callbacks: {
                    onopen: () => {
                        if (connectionIntentRef.current) { setCallState('active'); }
                    },
                    onmessage: (message: LiveServerMessage) => {
                        const msg = message as unknown as Record<string, unknown>;
                        const serverContent = msg.serverContent as Record<string, unknown> | undefined;

                        if (serverContent?.modelTurn) {
                            const modelTurn = serverContent.modelTurn as { parts?: Array<Record<string, unknown>> };
                            for (const part of (modelTurn.parts ?? [])) {
                                const inlineData = part.inlineData as { data?: string } | undefined;
                                if (inlineData?.data) {
                                    enqueueAudio(base64PCMToFloat32(inlineData.data));
                                }
                                if (typeof part.text === 'string' && part.text) {
                                    fullTranscriptBufferRef.current += part.text;
                                    tryExtractProfiles(fullTranscriptBufferRef.current);
                                    const displayText = part.text
                                        .replace(/\[PROFILE:[\s\S]*?\]/g, '')
                                        .replace(/\[LIFESTYLE:[\s\S]*?\]/g, '')
                                        .trim();
                                    if (displayText) {
                                        setTranscript(prev => [...prev.slice(-20), `🪷 ${displayText}`]);
                                    }
                                }
                            }
                        }

                        if ((serverContent as Record<string, unknown>)?.turnComplete) {
                            tryExtractProfiles(fullTranscriptBufferRef.current);
                            setIsSpeaking(false);
                        }
                        if ((serverContent as Record<string, unknown>)?.interrupted) {
                            audioQueueRef.current = [];
                            setIsSpeaking(false);
                        }
                    },
                    onerror: (e: unknown) => {
                        const err = e as { message?: string };
                        setError(err?.message || 'Connection error');
                        setCallState('error');
                    },
                    onclose: () => {
                        if (!profileExtractedRef.current) { setCallState('idle'); }
                    },
                },
            });

            if (!connectionIntentRef.current) { session.close(); return; }
            sessionRef.current = session;

            // Trigger Bodhi's opening welcome
            try {
                await session.sendClientContent({
                    turns: [{ role: 'user', parts: [{ text: 'Start.' }] }],
                    turnComplete: true,
                });
            } catch { /* non-fatal */ }

            // Microphone capture
            const source = captureCtx.createMediaStreamSource(stream);
            sourceRef.current = source;
            const processor = captureCtx.createScriptProcessor(BUFFER_SIZE, 1, 1);
            processorRef.current = processor;
            let silenceCounter = 0;

            processor.onaudioprocess = (audioEvent) => {
                if (mutedRef.current || !sessionRef.current) return;
                const inputData = audioEvent.inputBuffer.getChannelData(0);
                let audioData: Float32Array;
                if (captureCtx.sampleRate !== INPUT_SAMPLE_RATE) {
                    const ratio = captureCtx.sampleRate / INPUT_SAMPLE_RATE;
                    const newLength = Math.round(inputData.length / ratio);
                    audioData = new Float32Array(newLength);
                    for (let i = 0; i < newLength; i++) {
                        audioData[i] = inputData[Math.min(Math.floor(i * ratio), inputData.length - 1)];
                    }
                } else {
                    audioData = new Float32Array(inputData);
                }
                let sumSq = 0;
                for (let i = 0; i < audioData.length; i++) { sumSq += audioData[i] * audioData[i]; }
                const rms = Math.sqrt(sumSq / audioData.length);
                if (!isPlayingRef.current) { setVolumeLevel(Math.min(1, rms * 12)); }
                const isSpeech = rms > NOISE_GATE_THRESHOLD;
                if (!isSpeech) { silenceCounter++; if (silenceCounter % 4 !== 0) return; } else { silenceCounter = 0; }
                const base64 = float32ToBase64PCM(audioData);
                try {
                    session.sendRealtimeInput({ audio: { data: base64, mimeType: 'audio/pcm;rate=16000' } });
                } catch { /* session closed */ }
            };

            source.connect(processor);
            processor.connect(captureCtx.destination);

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Connection error. Please try again.';
            setError(msg);
            setCallState('error');
            cleanupAll();
        }
    }, [lang, cleanupAll, base64PCMToFloat32, float32ToBase64PCM, enqueueAudio, tryExtractProfiles, userName]);

    // ── Send text fallback ─────────────────────────────────────────────────────
    const sendTextMessage = useCallback((text: string) => {
        if (!text.trim() || callState !== 'active' || !sessionRef.current) return;
        setTranscript(prev => [...prev.slice(-20), `🙏 ${text.trim()}`]);
        try {
            sessionRef.current.sendClientContent({
                turns: [{ role: 'user', parts: [{ text: text.trim() }] }],
                turnComplete: true,
            });
        } catch { /* session may have closed */ }
    }, [callState]);

    const endOnboarding = useCallback(() => {
        cleanupAll();
        setCallState('idle');
        setIsSpeaking(false);
        setError(null);
    }, [cleanupAll]);

    const toggleMute = useCallback(() => { setIsMuted(prev => !prev); }, []);

    return {
        callState, error, isMuted, toggleMute,
        volumeLevel, isSpeaking, transcript,
        startOnboarding, sendTextMessage, endOnboarding,
    };
}
