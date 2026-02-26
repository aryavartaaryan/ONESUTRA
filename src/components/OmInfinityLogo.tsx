'use client';

import React, { useId } from 'react';

interface Props {
    size?: number;
    className?: string;
}

/**
 * OmInfinityLogo — Brand identity of Vedic Vibes
 *
 * Design concept:
 *   • The infinity lemniscate (∞) forms the outer body — representing eternal cycles
 *   • The OM glyph (ॐ) sits at the crossover center — representing the primordial sound
 *   • Together: "Sound that flows through eternity"
 *
 * The path is a mathematical lemniscate of Bernoulli, polished in SVG with a
 * radial-gold gradient stroke and a soft glow filter.
 */
export default function OmInfinityLogo({ size = 120, className = '' }: Props) {
    const uid = useId();                     // unique per instance → no SVG ID clashes
    const id = uid.replace(/:/g, '');      // strip colons React adds (invalid in SVG ids)
    const W = size;
    const H = size * 0.55;
    const cx = W / 2;
    const cy = H / 2;
    const scl = W * 0.36; // infinity loop scale

    // Pre-compute lemniscate points as SVG path
    const N = 200;
    const points: string[] = [];
    for (let i = 0; i <= N; i++) {
        const t = (i / N) * Math.PI * 2;
        const den = 1 + Math.sin(t) * Math.sin(t);
        const x = cx + (scl * Math.cos(t)) / den;
        const y = cy + (scl * Math.sin(t) * Math.cos(t)) / den;
        points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`);
    }
    const dPath = points.join(' ') + ' Z';

    return (
        <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="Vedic Vibes — Om Infinity Logo"
        >
            <defs>
                {/* Golden gradient along the lemniscate */}
                <linearGradient id={`${id}-gold`} x1="0%" y1="50%" x2="100%" y2="50%">
                    <stop offset="0%" stopColor="#D4860A" stopOpacity="0.95" />
                    <stop offset="22%" stopColor="#F0C040" stopOpacity="1.00" />
                    <stop offset="48%" stopColor="#FFFADC" stopOpacity="1.00" />
                    <stop offset="75%" stopColor="#F0C040" stopOpacity="1.00" />
                    <stop offset="100%" stopColor="#D4860A" stopOpacity="0.95" />
                </linearGradient>

                {/* Radial for the OM glyph */}
                <radialGradient id={`${id}-om`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFFADC" stopOpacity="1.00" />
                    <stop offset="55%" stopColor="#F0C040" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#D4860A" stopOpacity="0.80" />
                </radialGradient>

                {/* Glow / blur filter */}
                <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="2.2" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                {/* Outer glow halo */}
                <filter id={`${id}-halo`} x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="4.5" result="blur" />
                    <feColorMatrix type="matrix"
                        values="1 0.8 0 0 0  0.8 0.6 0 0 0  0 0 0.2 0 0  0 0 0 0.5 0"
                        result="colored" />
                    <feMerge>
                        <feMergeNode in="colored" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* ── Halo glow behind the whole logo ── */}
            <path
                d={dPath}
                stroke={`url(#${id}-gold)`}
                strokeWidth={W * 0.025}
                opacity={0.25}
                filter={`url(#${id}-halo)`}
            />

            {/* ── Main infinity lemniscate ── */}
            <path
                d={dPath}
                stroke={`url(#${id}-gold)`}
                strokeWidth={W * 0.022}
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={`url(#${id}-glow)`}
            />

            {/* ── OM glyph at crossover center ── */}
            <text
                x={cx}
                y={cy + H * 0.08}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={H * 0.52}
                fill={`url(#${id}-om)`}
                filter={`url(#${id}-glow)`}
                fontFamily="serif"
                fontWeight="bold"
            >
                ॐ
            </text>
        </svg>
    );
}
