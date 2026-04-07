'use client';
import { useState, useRef, useCallback, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
type SpeechLang = 'hi' | 'en';

interface UseSpeechInputOptions {
    lang?: SpeechLang;
    onResult?: (transcript: string) => void;
    onError?: (err: string) => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useSpeechInput({ lang = 'en', onResult, onError }: UseSpeechInputOptions = {}) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<any>(null);
    const onResultRef = useRef(onResult);
    const onErrorRef = useRef(onError);

    useEffect(() => { onResultRef.current = onResult; }, [onResult]);
    useEffect(() => { onErrorRef.current = onError; }, [onError]);

    const isSupported = typeof window !== 'undefined' &&
        !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);

    const startListening = useCallback(() => {
        if (!isSupported) {
            onErrorRef.current?.('Speech recognition not supported in this browser.');
            return;
        }
        if (isListening) return;

        const SR = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SR();
        recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;

        recognition.onstart = () => setIsListening(true);

        recognition.onresult = (event: any) => {
            const text = event.results?.[0]?.[0]?.transcript ?? '';
            setTranscript(text);
            onResultRef.current?.(text);
        };

        recognition.onerror = (event: any) => {
            setIsListening(false);
            onErrorRef.current?.(event.error ?? 'Speech error');
        };

        recognition.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, [isListening, isSupported, lang]);

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
    }, []);

    useEffect(() => {
        return () => { recognitionRef.current?.abort(); };
    }, []);

    return { isListening, transcript, startListening, stopListening, isSupported };
}
