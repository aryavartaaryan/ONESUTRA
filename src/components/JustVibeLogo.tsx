import React from 'react';

interface JustVibeLogoProps {
    size?: number;
    className?: string;
}

/**
 * JustVibe Logo — a slightly tilted infinity ∞ symbol with a fluid liquid-wave feel.
 * Left loop: radiant Spanda Gold (#D4A017)
 * Right loop: deep Flow Blue (#1E3A5F)
 */
export default function JustVibeLogo({ size = 52, className = '' }: JustVibeLogoProps) {
    const w = size * 2.2;
    const h = size;
    const goldId = `jv-gold-${Math.random().toString(36).slice(2, 7)}`;
    const blueId = `jv-blue-${Math.random().toString(36).slice(2, 7)}`;
    const filterId = `jv-glow-${Math.random().toString(36).slice(2, 7)}`;

    return (
        <svg
            width={w}
            height={h}
            viewBox="0 0 110 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={{ transform: 'rotate(-8deg)', display: 'inline-block' }}
            aria-label="Just Vibe logo"
        >
            <defs>
                {/* Spanda Gold gradient — left loop */}
                <linearGradient id={goldId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F0C040" />
                    <stop offset="50%" stopColor="#D4A017" />
                    <stop offset="100%" stopColor="#A37010" />
                </linearGradient>

                {/* Flow Blue gradient — right loop */}
                <linearGradient id={blueId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2E6BA8" />
                    <stop offset="50%" stopColor="#1E3A5F" />
                    <stop offset="100%" stopColor="#0D1E35" />
                </linearGradient>

                {/* Soft glow filter */}
                <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Left loop — Gold (Spanda) */}
            <path
                d="M55 25
           C55 14 46 6 35 6
           C24 6 15 14 15 25
           C15 36 24 44 35 44
           C46 44 55 36 55 25Z"
                stroke={`url(#${goldId})`}
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
                filter={`url(#${filterId})`}
                opacity="0.95"
            />

            {/* Right loop — Blue (Flow) */}
            <path
                d="M55 25
           C55 36 64 44 75 44
           C86 44 95 36 95 25
           C95 14 86 6 75 6
           C64 6 55 14 55 25Z"
                stroke={`url(#${blueId})`}
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
                filter={`url(#${filterId})`}
                opacity="0.95"
            />

            {/* Center crossing highlight — gentle shimmer */}
            <circle cx="55" cy="25" r="3.5" fill="#F0C040" opacity="0.7" />
        </svg>
    );
}
