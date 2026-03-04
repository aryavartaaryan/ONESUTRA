'use client';
/**
 * ToneBar — Feature 2: Real-Time Tone Translator
 *
 * Appears below the message input. User taps a vibe chip → Gemini Flash
 * transforms the draft text → preview animates in → approve or cancel.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, X, Loader2 } from 'lucide-react';

interface ToneBarProps {
    /** Current draft text in the input box */
    draft: string;
    /** Accent colour from the circadian theme */
    accent: string;
    /** Called with approved text so the parent can set the input value */
    onApprove: (text: string) => void;
}

const TONES = [
    { id: 'professional', label: '💼 Professional', color: '#60B4FF' },
    { id: 'empathetic', label: '💛 Empathetic', color: '#FFD166' },
    { id: 'direct', label: '⚡ Direct', color: '#6EE7B7' },
    { id: 'deescalate', label: '🕊️ De-escalate', color: '#D8B4FE' },
] as const;

type ToneId = typeof TONES[number]['id'];

export default function ToneBar({ draft, accent, onApprove }: ToneBarProps) {
    const [loading, setLoading] = useState<ToneId | null>(null);
    const [preview, setPreview] = useState<{ tone: ToneId; text: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (!draft.trim()) return null; // hide when input is empty

    async function applyTone(toneId: ToneId) {
        if (loading) return;
        setError(null);
        setPreview(null);
        setLoading(toneId);

        try {
            const res = await fetch('/api/tone-translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: draft, tone: toneId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Translation failed');
            setPreview({ tone: toneId, text: data.transformed });
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed');
        } finally {
            setLoading(null);
        }
    }

    function approve() {
        if (preview) {
            onApprove(preview.text);
            setPreview(null);
        }
    }

    function cancel() {
        setPreview(null);
        setError(null);
    }

    const activeTone = preview ? TONES.find((t) => t.id === preview.tone) : null;

    return (
        <div style={{ marginBottom: '0.45rem' }}>
            {/* ── Vibe chips ── */}
            <AnimatePresence mode="wait">
                {!preview && (
                    <motion.div
                        key="chips"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.18 }}
                        style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2, alignItems: 'center' }}
                    >
                        <Sparkles size={12} style={{ color: `${accent}88`, flexShrink: 0 }} />
                        {TONES.map((t) => {
                            const isLoading = loading === t.id;
                            return (
                                <motion.button
                                    key={t.id}
                                    whileTap={{ scale: 0.94 }}
                                    onClick={() => applyTone(t.id)}
                                    disabled={!!loading}
                                    style={{
                                        flexShrink: 0,
                                        display: 'flex', alignItems: 'center', gap: 5,
                                        padding: '0.26rem 0.65rem',
                                        borderRadius: 999,
                                        background: isLoading ? `${t.color}22` : 'rgba(255,255,255,0.05)',
                                        border: `1px solid ${isLoading ? t.color : 'rgba(255,255,255,0.10)'}`,
                                        color: isLoading ? t.color : 'rgba(255,255,255,0.55)',
                                        fontSize: '0.68rem', fontWeight: 500,
                                        cursor: loading ? 'wait' : 'pointer',
                                        fontFamily: "'Inter', sans-serif",
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.18s ease',
                                    }}
                                >
                                    {isLoading
                                        ? <Loader2 size={11} style={{ animation: 'spin 0.8s linear infinite' }} />
                                        : null}
                                    {t.label}
                                </motion.button>
                            );
                        })}
                    </motion.div>
                )}

                {/* ── AI preview + approve / cancel ── */}
                {preview && activeTone && (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            padding: '0.6rem 0.85rem',
                            borderRadius: 14,
                            background: `${activeTone.color}12`,
                            border: `1px solid ${activeTone.color}44`,
                            backdropFilter: 'blur(16px)',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: '0 0 0.3rem', fontSize: '0.56rem', color: activeTone.color, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                                    {activeTone.label} — AI suggestion
                                </p>
                                <p style={{ margin: 0, fontSize: '0.84rem', color: 'rgba(255,255,255,0.88)', lineHeight: 1.55, fontFamily: "'Inter', sans-serif" }}>
                                    {preview.text}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                {/* Approve */}
                                <motion.button
                                    whileTap={{ scale: 0.88 }}
                                    onClick={approve}
                                    title="Use this"
                                    style={{ width: 30, height: 30, borderRadius: '50%', background: `${activeTone.color}30`, border: `1px solid ${activeTone.color}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: activeTone.color }}
                                >
                                    <Check size={14} />
                                </motion.button>
                                {/* Cancel */}
                                <motion.button
                                    whileTap={{ scale: 0.88 }}
                                    onClick={cancel}
                                    title="Keep original"
                                    style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.45)' }}
                                >
                                    <X size={14} />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Error */}
                {error && (
                    <motion.p
                        key="error"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ margin: 0, fontSize: '0.65rem', color: '#FF6B6B', fontFamily: "'Inter', sans-serif" }}
                    >
                        ⚠️ {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}
