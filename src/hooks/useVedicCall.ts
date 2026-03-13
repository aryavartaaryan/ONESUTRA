'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type CallState = 'idle' | 'connecting' | 'active' | 'disconnected' | 'error';

interface UseVedicCallReturn {
    callState: CallState;
    startCall: () => Promise<void>;
    endCall: () => void;
    resetToIdle: () => void;
    error: string | null;
    isMuted: boolean;
    toggleMute: () => void;
    volumeLevel: number;
}

// Simple Web Speech API–based call: voice → text (SpeechRecognition)
// and text → voice (SpeechSynthesis), no external Vapi backend.

export function useVedicCall(): UseVedicCallReturn {
    const [callState, setCallState] = useState<CallState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [volumeLevel, setVolumeLevel] = useState(0);

    const recognitionRef = useRef<any | null>(null);

    // Helper: speak text using Web Speech API
    const speak = useCallback((text: string) => {
        if (typeof window === 'undefined') return;
        const synth = window.speechSynthesis;
        if (!synth) return;
        const utterance = new SpeechSynthesisUtterance(text);
        synth.speak(utterance);
    }, []);

    // Stop recognition instance
    const stopRecognition = useCallback(() => {
        try {
            if (recognitionRef.current) {
                recognitionRef.current.onresult = null;
                recognitionRef.current.onerror = null;
                recognitionRef.current.onend = null;
                recognitionRef.current.stop();
            }
        } catch {
            // ignore
        }
        recognitionRef.current = null;
    }, []);

    useEffect(() => {
        return () => {
            stopRecognition();
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, [stopRecognition]);

    const startCall = useCallback(async () => {
        if (typeof window === 'undefined') {
            setError('Web Speech API is only available in the browser');
            setCallState('error');
            return;
        }

        const SpeechRecognition: any =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setError('Web Speech API (SpeechRecognition) not supported in this browser');
            setCallState('error');
            return;
        }

        try {
            stopRecognition();
            setError(null);
            setCallState('connecting');

            const recognition = new SpeechRecognition();
            recognition.lang = 'en-US';
            recognition.continuous = true;
            recognition.interimResults = false;

            recognition.onresult = (event: any) => {
                if (!event.results || !event.results[0] || !event.results[0][0]) return;
                const text: string = event.results[0][0].transcript;
                console.log('[VedicCall] User said:', text);

                // Fake volume bump on each phrase so the visualizer animates a bit
                setVolumeLevel(0.7);
                setTimeout(() => setVolumeLevel(0.1), 400);

                // Echo back what user said (demo). You can later
                // route this text to any API and speak the response.
                if (!isMuted) {
                    speak(`You said: ${text}`);
                }
            };

            recognition.onerror = (e: any) => {
                const errCode: string | undefined = e?.error;

                // Common benign errors we don't want to spam as "real" errors
                const benignErrors = new Set<string | undefined>([
                    'no-speech',
                    'aborted',
                    'audio-capture',
                    undefined,
                ]);

                if (benignErrors.has(errCode)) {
                    // Treat as a normal end of call without loud console.error
                    setCallState('disconnected');
                    return;
                }

                console.warn('[VedicCall] SpeechRecognition error:', e);
                setError(errCode || 'Speech recognition error');
                setCallState('error');
            };

            recognition.onend = () => {
                // When user stops speaking or recognition ends, mark as disconnected
                if (callState === 'active') {
                    setCallState('disconnected');
                }
            };

            recognitionRef.current = recognition;
            recognition.start();
            setCallState('active');
        } catch (e: any) {
            console.error('[VedicCall] Failed to start recognition:', e);
            setError(e?.message || 'Failed to start call');
            setCallState('error');
        }
    }, [callState, isMuted, speak, stopRecognition]);

    const endCall = useCallback(() => {
        stopRecognition();
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setCallState('disconnected');
    }, [stopRecognition]);

    const resetToIdle = useCallback(() => {
        stopRecognition();
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setCallState('idle');
        setError(null);
        setIsMuted(false);
        setVolumeLevel(0);
    }, [stopRecognition]);

    const toggleMute = useCallback(() => {
        setIsMuted((prev) => !prev);
    }, []);

    return {
        callState,
        startCall,
        endCall,
        resetToIdle,
        error,
        isMuted,
        toggleMute,
        volumeLevel,
    };
}
