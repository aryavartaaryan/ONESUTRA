'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NewsItem } from '@/data/outplugs-news';

interface SutraLayerProps {
    item: NewsItem;
}

type ChipKey = 'simpleWords' | 'historicalContext' | 'impact';

const CHIPS: { key: ChipKey; label: string; emoji: string }[] = [
    { key: 'simpleWords', label: 'Explain Simply', emoji: '💡' },
    { key: 'historicalContext', label: 'History', emoji: '📜' },
    { key: 'impact', label: 'Impact on Me', emoji: '🎯' },
];

const panelVariants = {
    hidden: { y: '100%', opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: 'spring' as const, stiffness: 320, damping: 32 },
    },
    exit: {
        y: '100%',
        opacity: 0,
        transition: { duration: 0.28, ease: 'easeIn' as const },
    },
};

export default function SutraLayer({ item }: SutraLayerProps) {
    const [activeChip, setActiveChip] = useState<ChipKey | null>(null);

    const handleChip = (key: ChipKey) => {
        setActiveChip(prev => (prev === key ? null : key));
    };

    return (
        <div style={{ position: 'relative' }}>
            {/* Chip Row */}
            <div style={{
                display: 'flex', gap: '0.5rem',
                overflowX: 'auto', paddingBottom: '0.25rem',
                scrollbarWidth: 'none',
            }}>
                {CHIPS.map(chip => {
                    const isActive = activeChip === chip.key;
                    return (
                        <motion.button
                            key={chip.key}
                            onClick={() => handleChip(chip.key)}
                            whileTap={{ scale: 0.94 }}
                            style={{
                                flexShrink: 0,
                                display: 'flex', alignItems: 'center', gap: '0.3rem',
                                padding: '0.4rem 0.85rem',
                                borderRadius: 9999,
                                border: `1px solid ${isActive ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)'}`,
                                background: isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                cursor: 'pointer', whiteSpace: 'nowrap',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <span style={{ fontSize: '0.8rem' }}>{chip.emoji}</span>
                            <span style={{
                                fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.02em',
                                color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                                fontFamily: 'var(--font-header)',
                            }}>
                                {chip.label}
                            </span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Slide-Up Context Panel */}
            <AnimatePresence mode="wait">
                {activeChip && (
                    <motion.div
                        key={activeChip}
                        variants={panelVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        style={{
                            position: 'absolute', bottom: '110%', left: 0, right: 0,
                            background: 'rgba(5,10,40,0.88)',
                            backdropFilter: 'blur(28px)',
                            WebkitBackdropFilter: 'blur(28px)',
                            border: '1px solid rgba(255,255,255,0.14)',
                            borderRadius: 20,
                            padding: '1.1rem 1.1rem 1rem',
                            boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
                            zIndex: 20,
                        }}
                    >
                        {/* Handle bar */}
                        <div style={{
                            width: 36, height: 3.5,
                            background: 'rgba(255,255,255,0.2)',
                            borderRadius: 9999, margin: '0 auto 0.85rem',
                        }} />

                        {/* Title */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginBottom: '0.65rem',
                        }}>
                            <span style={{
                                fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                                color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-header)',
                            }}>
                                {CHIPS.find(c => c.key === activeChip)?.emoji} {CHIPS.find(c => c.key === activeChip)?.label}
                            </span>
                            <motion.button
                                whileTap={{ scale: 0.88 }}
                                onClick={() => setActiveChip(null)}
                                style={{
                                    width: 26, height: 26, borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                ✕
                            </motion.button>
                        </div>

                        <p style={{
                            color: 'rgba(255,255,255,0.82)',
                            fontSize: '0.875rem', lineHeight: 1.65,
                            fontFamily: "'Playfair Display', Georgia, serif",
                            fontWeight: 400,
                            margin: 0,
                        }}>
                            {item.sutraLayer[activeChip]}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
