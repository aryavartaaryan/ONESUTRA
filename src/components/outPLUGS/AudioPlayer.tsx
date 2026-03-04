'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioPlayerProps {
    audioUrl?: string;
    accentColor?: string;
}

const BAR_COUNT = 5;

export default function AudioPlayer({ audioUrl, accentColor = '#55efc4' }: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [playing, setPlaying] = useState(false);
    const [bars, setBars] = useState<number[]>(Array(BAR_COUNT).fill(0.3));
    const animFrame = useRef<number | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const ctxRef = useRef<AudioContext | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            audioRef.current?.pause();
            if (animFrame.current) cancelAnimationFrame(animFrame.current);
            ctxRef.current?.close();
        };
    }, []);

    const tick = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const chunk = Math.floor(data.length / BAR_COUNT);
        const newBars = Array.from({ length: BAR_COUNT }, (_, i) => {
            const slice = data.slice(i * chunk, (i + 1) * chunk);
            const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
            return Math.max(0.15, avg / 255);
        });
        setBars(newBars);
        animFrame.current = requestAnimationFrame(tick);
    };

    // Simulated bars when no real analyser (audio URL is placeholder)
    const simulatedTick = () => {
        setBars(Array.from({ length: BAR_COUNT }, () => 0.2 + Math.random() * 0.7));
        animFrame.current = requestAnimationFrame(() =>
            setTimeout(() => { if (playing) simulatedTick(); }, 120)
        );
    };

    const toggle = async () => {
        if (!audioUrl) {
            // Simulate audio for demo
            setPlaying(p => {
                const next = !p;
                if (next) {
                    setTimeout(simulatedTick, 0);
                } else {
                    if (animFrame.current) cancelAnimationFrame(animFrame.current);
                    setBars(Array(BAR_COUNT).fill(0.3));
                }
                return next;
            });
            return;
        }

        if (!audioRef.current) {
            audioRef.current = new Audio(audioUrl);
            audioRef.current.onended = () => { setPlaying(false); setBars(Array(BAR_COUNT).fill(0.3)); };

            // Try Web Audio API for visualizer
            try {
                const ctx = new AudioContext();
                ctxRef.current = ctx;
                const source = ctx.createMediaElementSource(audioRef.current);
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 64;
                source.connect(analyser);
                analyser.connect(ctx.destination);
                analyserRef.current = analyser;
            } catch (_) { /* fallback: no visualizer */ }
        }

        if (playing) {
            audioRef.current.pause();
            if (animFrame.current) cancelAnimationFrame(animFrame.current);
            setBars(Array(BAR_COUNT).fill(0.3));
            setPlaying(false);
        } else {
            await audioRef.current.play().catch(() => { });
            if (analyserRef.current) tick();
            else simulatedTick();
            setPlaying(true);
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Visualizer bars */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 22 }}>
                {bars.map((h, i) => (
                    <motion.div
                        key={i}
                        animate={{ scaleY: playing ? h : 0.3 }}
                        transition={{ duration: 0.12, ease: 'easeOut' }}
                        style={{
                            width: 3, height: 22, originY: 1, borderRadius: 2,
                            background: `linear-gradient(to top, ${accentColor}33, ${accentColor})`,
                            opacity: playing ? 0.9 : 0.35,
                        }}
                    />
                ))}
            </div>

            {/* Play button */}
            <motion.button
                onClick={toggle}
                whileTap={{ scale: 0.88 }}
                animate={playing ? {
                    boxShadow: [
                        `0 0 0 0 ${accentColor}66`,
                        `0 0 0 8px ${accentColor}00`,
                        `0 0 0 0 ${accentColor}66`,
                    ],
                } : { boxShadow: `0 0 12px ${accentColor}44` }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: playing ? `${accentColor}22` : `${accentColor}15`,
                    border: `1.5px solid ${accentColor}55`,
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: accentColor, fontSize: '0.9rem',
                }}
            >
                {playing ? '⏸' : '▶'}
            </motion.button>
        </div>
    );
}
