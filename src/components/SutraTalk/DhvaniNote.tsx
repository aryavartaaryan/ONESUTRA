'use client';
/**
 * DhvaniNote — Interactive voice note bubble.
 * Records audio → uploads to Firebase Storage → transcribes via Gemini.
 * Renders waveform + transcript with word-tap-to-seek.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Play, Pause, Loader2 } from 'lucide-react';
import type { VoiceNote, WordToken } from '@/hooks/useMessages';

// ── Recorder component (shows inside input bar) ────────────────────────────────
interface RecorderProps {
    accent: string;
    chatId: string;
    userId: string;
    userName: string;
    onSend: (note: VoiceNote, text: string) => void;
    onCancel: () => void;
}

export function DhvaniRecorder({ accent, onSend, onCancel, chatId, userId }: RecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [energy, setEnergy] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const mediaRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const rafRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const ctx = new AudioContext();
            const src = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            src.connect(analyser);
            analyserRef.current = analyser;

            const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            chunksRef.current = [];
            mr.ondataavailable = e => chunksRef.current.push(e.data);
            mr.start(100);
            mediaRef.current = mr;
            startTimeRef.current = Date.now();
            setIsRecording(true);
            setDuration(0);

            timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
            const tick = () => {
                if (!analyserRef.current) return;
                const data = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(data);
                const avg = data.reduce((a, b) => a + b, 0) / data.length;
                setEnergy(Math.min(1, avg / 80));
                rafRef.current = requestAnimationFrame(tick);
            };
            rafRef.current = requestAnimationFrame(tick);
        } catch { /* mic denied */ onCancel(); }
    }, [onCancel]);

    const stopAndProcess = useCallback(async () => {
        if (!mediaRef.current) return;
        cancelAnimationFrame(rafRef.current);
        if (timerRef.current) clearInterval(timerRef.current);

        const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000);

        await new Promise<void>(resolve => {
            mediaRef.current!.onstop = () => resolve();
            mediaRef.current!.stop();
            mediaRef.current!.stream.getTracks().forEach(t => t.stop());
        });

        setIsRecording(false);
        setIsProcessing(true);

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });

        try {
            // 1. Upload to Firebase Storage
            const { getStorage, ref: storageRef, uploadBytes, getDownloadURL } = await import('firebase/storage');
            const { getApp } = await import('firebase/app');
            const storage = getStorage(getApp());
            const path = `voiceNotes/${chatId}_${Date.now()}.webm`;
            const fileRef = storageRef(storage, path);
            await uploadBytes(fileRef, blob);
            const url = await getDownloadURL(fileRef);

            // 2. Transcribe with Gemini
            const base64 = await new Promise<string>((res) => {
                const reader = new FileReader();
                reader.onloadend = () => res((reader.result as string).split(',')[1]);
                reader.readAsDataURL(blob);
            });

            const txRes = await fetch('/api/transcribe-audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioBase64: base64, mimeType: 'audio/webm' }),
            });
            const txData = await txRes.json();

            onSend({
                url,
                durationSec,
                transcript: txData.transcript ?? '',
                words: txData.words ?? [],
            }, txData.transcript ?? '');
        } catch {
            onSend({ url: '', durationSec, transcript: 'Voice note', words: [] }, 'Voice note');
        } finally {
            setIsProcessing(false);
        }
    }, [chatId, onSend]);

    const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    if (isProcessing) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'rgba(255,255,255,0.55)' }} />
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>Transcribing…</span>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            {!isRecording ? (
                <>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={startRecording}
                        style={{ width: 38, height: 38, borderRadius: '50%', background: `${accent}22`, border: `1px solid ${accent}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: accent, flexShrink: 0 }}>
                        <Mic size={16} />
                    </motion.button>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>Hold to record a voice note</span>
                    <button onClick={onCancel} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>Cancel</button>
                </>
            ) : (
                <>
                    {/* Waveform bars */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                        {Array.from({ length: 24 }).map((_, i) => (
                            <motion.div key={i}
                                animate={{ scaleY: [1, 1 + energy * (0.5 + Math.sin(i * 0.8) * 0.5), 1] }}
                                transition={{ duration: 0.35 + i * 0.02, repeat: Infinity, ease: 'easeInOut' }}
                                style={{ width: 3, height: Math.max(4, 8 + Math.sin(i * 0.6) * 6), borderRadius: 999, background: `linear-gradient(180deg, ${accent}, ${accent}55)`, transformOrigin: 'center' }}
                            />
                        ))}
                    </div>

                    <span style={{ fontSize: '0.8rem', color: accent, fontFamily: 'monospace', flexShrink: 0 }}>{fmt(duration)}</span>

                    <motion.button whileTap={{ scale: 0.88 }} onClick={stopAndProcess}
                        style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(239,68,68,0.25)', border: '1px solid rgba(239,68,68,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#f87171', flexShrink: 0 }}>
                        <Square size={14} fill="#f87171" />
                    </motion.button>
                </>
            )}
        </div>
    );
}

// ── Playback bubble (rendered for received/sent voice messages) ────────────────
interface PlaybackProps {
    note: VoiceNote;
    accent: string;
    isMe: boolean;
}

export function DhvaniPlayback({ note, accent, isMe }: PlaybackProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const audio = new Audio(note.url);
        audioRef.current = audio;
        audio.ontimeupdate = () => setProgress(audio.currentTime / (audio.duration || 1));
        audio.onended = () => { setPlaying(false); setProgress(0); };
        return () => { audio.pause(); };
    }, [note.url]);

    const togglePlay = () => {
        const a = audioRef.current;
        if (!a) return;
        if (playing) { a.pause(); setPlaying(false); }
        else { a.play(); setPlaying(true); }
    };

    const seekToWord = (w: WordToken) => {
        if (audioRef.current) {
            audioRef.current.currentTime = w.startSec;
            audioRef.current.play();
            setPlaying(true);
        }
    };

    const barColor = isMe ? 'rgba(255,255,255,0.6)' : `${accent}`;

    return (
        <div style={{ minWidth: 200, maxWidth: 300 }}>
            {/* Waveform + controls row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={togglePlay} style={{ width: 34, height: 34, borderRadius: '50%', background: isMe ? 'rgba(255,255,255,0.18)' : `${accent}22`, border: `1px solid ${isMe ? 'rgba(255,255,255,0.35)' : `${accent}44`}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: isMe ? 'white' : accent, flexShrink: 0 }}>
                    {playing ? <Pause size={14} /> : <Play size={14} />}
                </button>

                {/* Static waveform bars with progress overlay */}
                <div style={{ flex: 1, position: 'relative', height: 32, display: 'flex', alignItems: 'center', gap: 2 }}>
                    {Array.from({ length: 30 }).map((_, i) => {
                        const h = Math.max(4, 8 + Math.sin(i * 0.5) * 10 + Math.cos(i * 0.9) * 5);
                        const played = i / 30 < progress;
                        return (
                            <div key={i} style={{ width: 3, height: h, borderRadius: 999, background: played ? barColor : `${barColor}44`, transition: 'background 0.1s' }} />
                        );
                    })}
                </div>

                <span style={{ fontSize: '0.62rem', color: isMe ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.35)', fontFamily: 'monospace', flexShrink: 0 }}>
                    {String(Math.floor(note.durationSec / 60)).padStart(2, '0')}:{String(note.durationSec % 60).padStart(2, '0')}
                </span>
            </div>

            {/* Transcript */}
            {note.transcript && (
                <div style={{ marginTop: '0.5rem', paddingTop: '0.4rem', borderTop: `1px solid ${isMe ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)'}` }}>
                    <p style={{ margin: '0 0 0.3rem', fontSize: '0.5rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: isMe ? 'rgba(255,255,255,0.35)' : `${accent}88`, fontFamily: 'monospace' }}>
                        ✦ Transcript
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.15rem 0.22rem' }}>
                        {note.words && note.words.length > 0 ? (
                            note.words.map((w, i) => (
                                <motion.span
                                    key={i}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => seekToWord(w)}
                                    style={{
                                        fontSize: '0.78rem',
                                        color: isMe ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.65)',
                                        cursor: 'pointer',
                                        padding: '0.05rem 0.2rem',
                                        borderRadius: 4,
                                        transition: 'background 0.12s',
                                        userSelect: 'none',
                                    }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${accent}22`; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                                >
                                    {w.word}
                                </motion.span>
                            ))
                        ) : (
                            <span style={{ fontSize: '0.78rem', color: isMe ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                                {note.transcript}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
