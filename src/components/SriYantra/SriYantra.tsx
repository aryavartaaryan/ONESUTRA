import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import styles from './SriYantra.module.css';

export const SriYantraSVG = ({ className }: { className?: string }) => {
    const goldStroke = "rgba(212, 175, 55, 0.65)";   // deep gold
    const brightGold = "rgba(255, 215, 0,  0.80)";   // bright gold
    const roseGold = "rgba(255, 160, 80, 0.55)";   // saffron-rose
    const sapphire = "rgba(80,  120, 255, 0.45)";  // celestial blue accent

    return (
        <svg viewBox="0 0 200 200" className={className}>
            <defs>
                {/* Gold glow filter */}
                <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                {/* Stronger outer glow */}
                <filter id="outerGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="big" />
                    <feMerge>
                        <feMergeNode in="big" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                {/* Gold gradient for triangles */}
                <linearGradient id="triGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#FFD700" stopOpacity="1.0" />
                    <stop offset="100%" stopColor="#FF9933" stopOpacity="0.8" />
                </linearGradient>
                {/* Petal gradient */}
                <linearGradient id="petalGrad16" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#B8860B" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#FFD700" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="petalGrad8" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF9933" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#FFD700" stopOpacity="1.0" />
                </linearGradient>
                {/* Bindu radial gradient */}
                <radialGradient id="binduGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                    <stop offset="35%" stopColor="#FFD700" stopOpacity="1" />
                    <stop offset="70%" stopColor="#FF9933" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#FF4500" stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* ── 1. Bhupura (outer square gate) — gold ring, very slow drift ── */}
            <motion.g
                fill="none" stroke={goldStroke} strokeWidth="0.7"
                filter="url(#goldGlow)"
                animate={{ opacity: [0.7, 1.0, 0.7] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            >
                <path d="M10 10 L190 10 L190 190 L10 190 Z" />
                <path d="M22 22 L178 22 L178 178 L22 178 Z" />
                <path d="M30 30 L170 30 L170 170 L30 170 Z" />
                {/* 4 T-gates */}
                {[0, 90, 180, 270].map(angle => (
                    <g key={`gate-${angle}`} transform={`rotate(${angle} 100 100)`}>
                        <path d="M85 5 L85 22 L115 22 L115 5" strokeWidth="0.9" />
                    </g>
                ))}
            </motion.g>

            {/* ── 2. 16-petal lotus — clockwise slow ── */}
            <motion.g
                animate={{ rotate: 360 }}
                transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
                style={{ originX: "100px", originY: "100px" }}
                fill="none" stroke="url(#petalGrad16)" strokeWidth="0.9"
                filter="url(#goldGlow)"
            >
                {[...Array(16)].map((_, i) => {
                    const a = (i * Math.PI * 2) / 16;
                    const a2 = ((i + 1) * Math.PI * 2) / 16;
                    const rIn = 58, rOut = 67;
                    return (
                        <path
                            key={`p16-${i}`}
                            d={`M${100 + Math.cos(a) * rIn} ${100 + Math.sin(a) * rIn}
                                Q${100 + Math.cos((a + a2) / 2) * rOut * 1.15} ${100 + Math.sin((a + a2) / 2) * rOut * 1.15}
                                ${100 + Math.cos(a2) * rIn} ${100 + Math.sin(a2) * rIn}`}
                        />
                    );
                })}
            </motion.g>

            {/* ── 3. 8-petal lotus — counter-clockwise, slightly faster ── */}
            <motion.g
                animate={{ rotate: -360 }}
                transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                style={{ originX: "100px", originY: "100px" }}
                fill="none" stroke="url(#petalGrad8)" strokeWidth="1.2"
                filter="url(#goldGlow)"
            >
                {[...Array(8)].map((_, i) => {
                    const a = ((i * Math.PI * 2) / 8) + Math.PI / 8;
                    const a2 = (((i + 1) * Math.PI * 2) / 8) + Math.PI / 8;
                    const rIn = 46, rOut = 58;
                    return (
                        <path
                            key={`p8-${i}`}
                            d={`M${100 + Math.cos(a) * rIn} ${100 + Math.sin(a) * rIn}
                                Q${100 + Math.cos((a + a2) / 2) * rOut * 1.25} ${100 + Math.sin((a + a2) / 2) * rOut * 1.25}
                                ${100 + Math.cos(a2) * rIn} ${100 + Math.sin(a2) * rIn}`}
                        />
                    );
                })}
            </motion.g>

            {/* ── 4. Sapphire protection ring (slowly sweeping) ── */}
            <motion.circle
                cx="100" cy="100" r="72"
                fill="none"
                stroke={sapphire}
                strokeWidth="0.5"
                strokeDasharray="4 6"
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                style={{ originX: "100px", originY: "100px" }}
                filter="url(#goldGlow)"
            />

            {/* ── 5. Nine interlocking triangles — breathing sacred geometry ── */}
            <motion.g
                animate={{ scale: [1, 1.035, 1], opacity: [0.75, 1, 0.75] }}
                transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                style={{ originX: "100px", originY: "100px" }}
                fill="none"
                stroke="url(#triGrad)"
                strokeWidth="1.3"
                filter="url(#goldGlow)"
            >
                {/* 5 downward (Shakti) triangles */}
                <path d="M100 155 L148 68 L52 68 Z" />
                <path d="M100 142 L138 82 L62 82 Z" />
                <path d="M100 130 L126 94 L74 94 Z" />
                <path d="M100 120 L114 102 L86 102 Z" />
                <path d="M100 110 L107 107 L93 107 Z" />

                {/* 4 upward (Shiva) triangles */}
                <path d="M100 45  L148 132 L52 132 Z" />
                <path d="M100 58  L135 118 L65 118 Z" />
                <path d="M100 70  L124 106 L76 106 Z" />
                <path d="M100 82  L114  97 L86  97 Z" />
            </motion.g>

            {/* ── 6. Innermost triangle — slower independent breath ── */}
            <motion.g
                animate={{ rotate: [0, 3, -3, 0], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                style={{ originX: "100px", originY: "100px" }}
                fill="none" stroke={brightGold} strokeWidth="1.8"
                filter="url(#outerGlow)"
            >
                <path d="M100 90 L110 108 L90 108 Z" />
            </motion.g>

            {/* ── 7. Pulsing Bindu (central dot) ── */}
            <motion.circle
                cx="100" cy="100" r="4"
                fill="url(#binduGrad)"
                filter="url(#outerGlow)"
                animate={{
                    r: [3.5, 6, 3.5],
                    opacity: [0.9, 1, 0.9]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* ── 8. Roseate halo ring (slowest, outermost accent) ── */}
            <motion.circle
                cx="100" cy="100" r="82"
                fill="none"
                stroke={roseGold}
                strokeWidth="0.4"
                strokeDasharray="2 8"
                animate={{ rotate: -360 }}
                transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
                style={{ originX: "100px", originY: "100px" }}
            />
        </svg>
    );
};

export default function SriYantra() {
    return (
        <div className={styles.container}>
            <div className={styles.energyField}>
                <div className={styles.nebula} />
                <div className={styles.nebulaGold} />
            </div>

            <div className={styles.geometryWrapper}>
                <SriYantraSVG className={styles.mainSvg} />

                {/* Authentic core overlay — gentle breath pulse */}
                <motion.div
                    className={styles.authenticOverlay}
                    animate={{ opacity: [0.25, 0.55, 0.25], scale: [0.98, 1.02, 0.98] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                >
                    <Image
                        src="/sri-yantra-authentic.png?v=20260208"
                        alt="Sacred Core"
                        width={300}
                        height={300}
                        priority
                        unoptimized
                        className={styles.coreImage}
                    />
                </motion.div>
            </div>
        </div>
    );
}
