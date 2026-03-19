'use client';

import { useEffect, useRef } from 'react';

interface UseEnergyProtectorOptions {
    enabled?: boolean;
    breakAfterMs?: number;
    onBreakSuggested?: () => void;
    voiceInterrupt?: boolean;
}

export function useEnergyProtector({
    enabled = true,
    breakAfterMs = 2 * 60 * 60 * 1000,
    onBreakSuggested,
    voiceInterrupt = true,
}: UseEnergyProtectorOptions = {}) {
    const activeMsRef = useRef(0);
    const lastTickRef = useRef<number | null>(null);
    const notifiedRef = useRef(false);

    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        const dayKey = `energy_protector_break_${new Date().toISOString().slice(0, 10)}`;
        notifiedRef.current = localStorage.getItem(dayKey) === '1';

        const onVisibleTick = () => {
            const now = Date.now();
            if (document.hidden) {
                lastTickRef.current = now;
                return;
            }

            if (lastTickRef.current !== null) {
                const delta = Math.max(0, now - lastTickRef.current);
                activeMsRef.current += Math.min(delta, 60_000);
            }
            lastTickRef.current = now;

            if (!notifiedRef.current && activeMsRef.current >= breakAfterMs) {
                notifiedRef.current = true;
                localStorage.setItem(dayKey, '1');

                if (voiceInterrupt && 'speechSynthesis' in window) {
                    const u = new SpeechSynthesisUtterance(
                        'Sakha reminder. You have been in deep work for two hours. Please take a mindful five minute break and breathe.'
                    );
                    u.rate = 0.95;
                    u.pitch = 1.0;
                    u.volume = 0.9;
                    window.speechSynthesis.cancel();
                    window.speechSynthesis.speak(u);
                }

                onBreakSuggested?.();
            }
        };

        lastTickRef.current = Date.now();
        const interval = window.setInterval(onVisibleTick, 15_000);
        const onVisibility = () => onVisibleTick();

        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('focus', onVisibility);
        window.addEventListener('mousemove', onVisibility);
        window.addEventListener('keydown', onVisibility);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('focus', onVisibility);
            window.removeEventListener('mousemove', onVisibility);
            window.removeEventListener('keydown', onVisibility);
        };
    }, [enabled, breakAfterMs, onBreakSuggested, voiceInterrupt]);
}
