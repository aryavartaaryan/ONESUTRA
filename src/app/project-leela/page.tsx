'use client';

import dynamic from 'next/dynamic';

// R3F must be loaded client-side only — disable SSR entirely
const LeelaCanvas = dynamic(
    () => import('@/components/Leela/LeelaCanvas'),
    {
        ssr: false, loading: () => (
            <div style={{
                position: 'fixed', inset: 0,
                background: '#050010',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFD700', fontFamily: 'serif', flexDirection: 'column', gap: '1rem',
            }}>
                <div style={{ fontSize: '4rem', animation: 'omPulse 2s ease-in-out infinite' }}>ॐ</div>
                <p style={{ letterSpacing: '4px', fontSize: '0.8rem', opacity: 0.7, fontFamily: "'Cinzel', serif" }}>
                    AWAKENING THE NADI...
                </p>
                <style>{`@keyframes omPulse { 0%,100%{transform:scale(1)}50%{transform:scale(1.15)} }`}</style>
            </div>
        )
    }
);

export default function ProjectLeelaPage() {
    return <LeelaCanvas />;
}
