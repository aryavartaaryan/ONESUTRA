'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';

export default function DharmaMap() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '3rem 2rem', textAlign: 'center', gap: '1.5rem', minHeight: '60vh' }}>
            <motion.div animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, rgba(251,191,36,0.4) 0%, rgba(251,191,36,0.08) 60%, transparent 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(251,191,36,0.3)', boxShadow: '0 0 40px rgba(251,191,36,0.2)' }}>
                <Compass size={44} style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.6))' }} />
            </motion.div>
            <div>
                <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', fontFamily: "'Playfair Display',Georgia,serif", letterSpacing: '0.04em' }}>Dharma Compass</h2>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: 260 }}>Discover conscious seekers near you — sacred locations, spiritual events & community gatherings.</p>
            </div>
            <div style={{ padding: '0.6rem 1.4rem', borderRadius: 99, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(251,191,36,0.7)', textTransform: 'uppercase' }}>Coming Soon</div>
        </div>
    );
}
