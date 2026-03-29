'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function SakhaBodhiCard({ onClick }: { onClick: () => void }) {
    return (
        <motion.div onClick={onClick} whileTap={{ scale: 0.97 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.9rem 1rem', background: 'linear-gradient(135deg,rgba(167,139,250,0.13) 0%,rgba(109,40,217,0.06) 100%)', borderRadius: 18, border: '1px solid rgba(167,139,250,0.28)', marginBottom: '0.65rem', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
            <div aria-hidden style={{ position: 'absolute', top: '-20%', right: '-5%', width: 80, height: 80, background: 'radial-gradient(circle,rgba(167,139,250,0.3) 0%,transparent 70%)', filter: 'blur(16px)', pointerEvents: 'none' }} />
            <motion.div animate={{ boxShadow: ['0 0 10px rgba(167,139,250,0.35)', '0 0 22px rgba(167,139,250,0.65)', '0 0 10px rgba(167,139,250,0.35)'] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: 50, height: 50, borderRadius: '50%', background: 'radial-gradient(circle at 35% 28%,rgba(255,255,255,0.42) 0%,rgba(167,139,250,0.75) 42%,rgba(109,40,217,0.9) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0, border: '2px solid rgba(167,139,250,0.55)' }}>🌟</motion.div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: '#e9d5ff' }}>Sakha Bodhi</p>
                    <span style={{ padding: '1px 6px', borderRadius: 99, background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.38)', fontSize: '0.5rem', fontWeight: 700, color: '#c4b5fd', letterSpacing: '0.1em', textTransform: 'uppercase' }}>AI Guru</span>
                    <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px rgba(74,222,128,0.8)' }} />
                </div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(167,139,250,0.6)' }}>Vedic wisdom · Sacred knowledge · Your conscious guide</p>
            </div>
            <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} style={{ color: 'rgba(167,139,250,0.5)', fontSize: '1.2rem', flexShrink: 0 }}>›</motion.span>
        </motion.div>
    );
}
