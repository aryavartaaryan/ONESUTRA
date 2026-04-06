'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

const BODHI_TTS_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';
const OUTPUT_SAMPLE_RATE = 24000;

/**
 * useGeminiTTS — Bodhi voice via Gemini Live (identical model + Aoede voice + PCM pipeline
 * as Bodhi Chat). Drop-in replacement for useTTS on the Prakriti quiz page.
 * Falls back to browser speechSynthesis if the Live session fails.
 */
export function useGeminiTTS() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [muted, setMuted] = useState(false);
    const mutedRef = useRef(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionRef = useRef<any>(null);
    // Persistent AudioContext — created once, never closed mid-session
    const playbackCtxRef = useRef<AudioContext | null>(null);
    const audioQueueRef = useRef<Float32Array[]>([]);
    const isPlayingRef = useRef(false);
    const stoppedRef = useRef(false);
    // Generation counter — incremented on every stop(), used to invalidate
    // stale speak() calls and stale onended callbacks
    const speakGenRef = useRef(0);
    const audioGenRef = useRef(0);

    // ── Ensure AudioContext exists and is running ──────────────────────────────
    const getAudioCtx = useCallback((): AudioContext => {
        if (!playbackCtxRef.current || playbackCtxRef.current.state === 'closed') {
            playbackCtxRef.current = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
        }
        return playbackCtxRef.current;
    }, []);

    // Cleanup AudioContext on unmount only
    useEffect(() => {
        return () => {
            if (playbackCtxRef.current) {
                playbackCtxRef.current.close().catch(() => { /* ignore */ });
                playbackCtxRef.current = null;
            }
        };
    }, []);

    // ── PCM helpers (same as useBodhiChatVoice) ───────────────────────────────
    const base64PCMToFloat32 = useCallback((b64: string): Float32Array => {
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const pcm16 = new Int16Array(bytes.buffer);
        const f32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) f32[i] = pcm16[i] / 0x8000;
        return f32;
    }, []);

    const applyCrossfade = useCallback((data: Float32Array): Float32Array => {
        const fadeLen = Math.min(64, Math.floor(data.length / 4));
        const out = new Float32Array(data);
        for (let i = 0; i < fadeLen; i++) {
            const t = i / fadeLen;
            out[i] *= t;
            out[data.length - 1 - i] *= t;
        }
        return out;
    }, []);

    const playNextAudio = useCallback(() => {
        const myAudioGen = audioGenRef.current;
        if (stoppedRef.current || audioQueueRef.current.length === 0) {
            isPlayingRef.current = false;
            if (!stoppedRef.current) setIsSpeaking(false);
            return;
        }

        const ctx = playbackCtxRef.current;
        if (!ctx || ctx.state === 'closed') {
            isPlayingRef.current = false;
            setIsSpeaking(false);
            return;
        }

        // Resume suspended context (browser autoplay policy) then retry
        if (ctx.state === 'suspended') {
            ctx.resume().then(() => {
                if (!stoppedRef.current && audioGenRef.current === myAudioGen) playNextAudio();
            }).catch(() => {
                isPlayingRef.current = false;
                setIsSpeaking(false);
            });
            return;
        }

        isPlayingRef.current = true;
        setIsSpeaking(true);

        let chunk = audioQueueRef.current.shift()!;
        while (audioQueueRef.current.length > 0 && chunk.length < OUTPUT_SAMPLE_RATE * 0.1) {
            const next = audioQueueRef.current.shift()!;
            const merged = new Float32Array(chunk.length + next.length);
            merged.set(chunk); merged.set(next, chunk.length);
            chunk = merged;
        }

        try {
            const smoothed = applyCrossfade(chunk);
            const buf = ctx.createBuffer(1, smoothed.length, OUTPUT_SAMPLE_RATE);
            buf.getChannelData(0).set(smoothed);
            const src = ctx.createBufferSource();
            src.buffer = buf;
            const gain = ctx.createGain();
            gain.gain.value = 1.0;
            src.connect(gain);
            gain.connect(ctx.destination);
            // Only continue chain if this generation is still active
            src.onended = () => {
                if (audioGenRef.current === myAudioGen) playNextAudio();
                else { isPlayingRef.current = false; }
            };
            src.start();
        } catch {
            isPlayingRef.current = false;
            setIsSpeaking(false);
        }
    }, [applyCrossfade]);

    const enqueueAudio = useCallback((data: Float32Array) => {
        audioQueueRef.current.push(data);
        if (!isPlayingRef.current) playNextAudio();
    }, [playNextAudio]);

    // ── Cleanup Live session only (keep AudioContext alive) ───────────────────
    const cleanupSession = useCallback(() => {
        stoppedRef.current = true;
        speakGenRef.current++;   // invalidate any pending speak() async chain
        audioGenRef.current++;   // invalidate any pending onended callbacks
        if (sessionRef.current) {
            try { sessionRef.current.close(); } catch { /* ignore */ }
            sessionRef.current = null;
        }
        audioQueueRef.current = [];
        isPlayingRef.current = false;
        setIsSpeaking(false);
        // Suspend AudioContext briefly to immediately silence the currently-playing
        // audio chunk (same pattern as useBodhiChatVoice tool-call interruption)
        const ctx = playbackCtxRef.current;
        if (ctx && ctx.state === 'running') {
            ctx.suspend().catch(() => { /* ignore */ });
            setTimeout(() => ctx.resume().catch(() => { /* ignore */ }), 80);
        }
    }, []);

    // ── Fallback (browser TTS) ────────────────────────────────────────────────
    const fallbackSpeak = useCallback((text: string) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.88; u.pitch = 1.0; u.volume = 1;
        const voices = window.speechSynthesis.getVoices();
        const preferred =
            voices.find(v => v.name.includes('Samantha')) ||
            voices.find(v => v.name.includes('Karen')) ||
            voices.find(v => v.name.includes('Google UK English Female')) ||
            voices.find(v => v.lang.startsWith('en'));
        if (preferred) u.voice = preferred;
        u.onstart = () => setIsSpeaking(true);
        u.onend = () => setIsSpeaking(false);
        u.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(u);
    }, []);

    // ── stop() ────────────────────────────────────────────────────────────────
    const stop = useCallback(() => {
        cleanupSession();
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }, [cleanupSession]);

    // ── speak() — opens a one-shot Gemini Live session for TTS ───────────────
    const speak = useCallback(async (text: string) => {
        if (!text?.trim() || mutedRef.current) return;
        stop();
        stoppedRef.current = false;
        const myGen = speakGenRef.current; // snapshot after stop() incremented it

        // Create/get AudioContext SYNCHRONOUSLY before any async ops.
        // This maximises the chance of capturing the browser's user-gesture
        // activation context (needed to avoid autoplay suspension).
        const ctx = getAudioCtx();
        // Non-blocking resume attempt while potentially in gesture context
        ctx.resume().catch(() => { /* ignore */ });

        try {
            const tokenRes = await fetch('/api/gemini-live-token', { method: 'POST' });
            if (!tokenRes.ok) throw new Error('Token fetch failed');
            const { apiKey } = await tokenRes.json();
            if (!apiKey) throw new Error('No API key');

            if (stoppedRef.current || speakGenRef.current !== myGen || mutedRef.current) return;

            const { GoogleGenAI, Modality } = await import('@google/genai');
            const ai = new GoogleGenAI({ apiKey });

            const session = await ai.live.connect({
                model: BODHI_TTS_MODEL,
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } },
                    },
                    systemInstruction: 'You are Bodhi — a warm, calm Ayurvedic guide conducting a Prakriti discovery quiz. The user will send you a quiz question. Your ONLY job is to ask that question to the user in a warm, natural, elaborated way — 1 to 2 sentences maximum. Rephrase it as if you are personally asking the user. Do NOT answer the question. Do NOT explain Ayurveda. Do NOT add any extra information. Just ask the question warmly and directly.',
                },
                callbacks: {
                    onopen: () => { /* connection confirmed */ },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onmessage: (message: any) => {
                        if (stoppedRef.current || speakGenRef.current !== myGen || mutedRef.current) return;
                        const parts = message?.serverContent?.modelTurn?.parts ?? [];
                        for (const part of parts) {
                            if (part?.inlineData?.data) {
                                enqueueAudio(base64PCMToFloat32(part.inlineData.data));
                            }
                        }
                        if (message?.serverContent?.turnComplete) {
                            try { sessionRef.current?.close(); } catch { /* ignore */ }
                            sessionRef.current = null;
                        }
                    },
                    onerror: () => {
                        sessionRef.current = null;
                        if (!stoppedRef.current && speakGenRef.current === myGen && !mutedRef.current) fallbackSpeak(text);
                    },
                    onclose: () => { sessionRef.current = null; },
                },
            });

            if (stoppedRef.current || speakGenRef.current !== myGen || mutedRef.current) { session.close(); return; }
            sessionRef.current = session;

            // Send text AFTER connect resolves (same pattern as useRishiVoiceCall)
            try {
                session.sendClientContent({
                    turns: [{ role: 'user', parts: [{ text: `Ask me this question warmly: "${text}"` }] }],
                    turnComplete: true,
                });
            } catch { /* ignore */ }

        } catch {
            if (!stoppedRef.current && !mutedRef.current) fallbackSpeak(text);
        }
    }, [stop, getAudioCtx, enqueueAudio, base64PCMToFloat32, fallbackSpeak]);

    // ── toggleMute ────────────────────────────────────────────────────────────
    const toggleMute = useCallback(() => {
        setMuted(m => {
            const next = !m;
            mutedRef.current = next;
            if (next) stop();
            return next;
        });
    }, [stop]);

    return { speak, stop, isSpeaking, muted, toggleMute };
}
