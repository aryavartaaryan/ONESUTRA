'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CelestialHeaderIcon() {
    const [isMounted, setIsMounted] = useState(false);
    const [isDaytime, setIsDaytime] = useState(true);

    useEffect(() => {
        setIsMounted(true);

        const checkTime = () => {
            const h = new Date().getHours();
            setIsDaytime(h >= 6 && h < 18);
        };

        checkTime();
        const interval = setInterval(checkTime, 60_000);
        return () => clearInterval(interval);
    }, []);

    // SSR placeholder — invisible but reserves layout space
    if (!isMounted) {
        return <div style={{ width: 28, height: 28, opacity: 0 }} />;
    }

    return (
        <div style={{ position: 'relative', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AnimatePresence mode="wait">
                {isDaytime ? (
                    <motion.span
                        key="sun"
                        initial={{ opacity: 0, rotate: -45, scale: 0.75 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: 45, scale: 0.75 }}
                        transition={{ duration: 1.4, ease: 'easeOut' }}
                        title="Daytime Prana"
                        style={{
                            position: 'absolute',
                            fontSize: '1.2rem',
                            filter: 'drop-shadow(0 0 14px rgba(252,211,77,0.85))',
                            lineHeight: 1,
                        }}
                    >
                        ☀️
                    </motion.span>
                ) : (
                    <motion.span
                        key="moon"
                        initial={{ opacity: 0, rotate: 45, scale: 0.75 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: -45, scale: 0.75 }}
                        transition={{ duration: 1.4, ease: 'easeOut' }}
                        title="Nighttime Rest"
                        style={{
                            position: 'absolute',
                            fontSize: '1.2rem',
                            filter: 'drop-shadow(0 0 14px rgba(224,231,255,0.65))',
                            lineHeight: 1,
                        }}
                    >
                        🌙
                    </motion.span>
                )}
            </AnimatePresence>
        </div>
    );
}
