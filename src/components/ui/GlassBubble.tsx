'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GlassBubbleProps {
  children: React.ReactNode;
  width?: number | string;
  height?: number;
  className?: string;
  onClick?: () => void;
  delay?: number;
  glowColor?: string;
  isEllipse?: boolean;
}

export default function GlassBubble({
  children,
  width = 85,
  height = 70,
  className = '',
  onClick,
  delay = 0,
  glowColor = 'rgba(45, 212, 191, 0.5)',
  isEllipse = false,
}: GlassBubbleProps) {
  const widthValue = typeof width === 'number' ? `${width}px` : width;
  const borderRadius = isEllipse ? '50% / 40%' : '50%';

  return (
    <motion.div
      className={className}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.03 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay * 0.05 }}
      onClick={onClick}
      style={{
        position: 'relative',
        width: widthValue,
        height: `${height}px`,
        borderRadius: borderRadius,
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0,
        background: `radial-gradient(ellipse at center, ${glowColor} 0%, transparent 70%)`,
        padding: '3px',
      }}
    >
      {/* Outer glow ring */}
      <div style={{
        position: 'absolute',
        inset: '-4px',
        borderRadius: borderRadius,
        background: `radial-gradient(ellipse at center, ${glowColor} 0%, transparent 70%)`,
        zIndex: -1,
        filter: 'blur(8px)',
      }} />
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: borderRadius,
          background: `
            radial-gradient(circle at 30% 30%, rgba(0, 255, 255, 0.6) 0%, transparent 50%),
            radial-gradient(circle at 70% 70%, rgba(0, 200, 255, 0.4) 0%, transparent 50%),
            linear-gradient(135deg, rgba(0, 150, 200, 0.9) 0%, rgba(0, 80, 120, 0.95) 50%, rgba(0, 40, 80, 0.98) 100%)
          `,
          border: '2px solid rgba(0, 255, 255, 0.5)',
          boxShadow: `
            inset -8px -8px 20px rgba(0, 0, 0, 0.7),
            inset 8px 8px 20px rgba(255, 255, 255, 0.25),
            0 8px 25px rgba(0, 0, 0, 0.6),
            0 0 40px ${glowColor}
          `,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Large specular highlight - top left */}
        <div
          style={{
            position: 'absolute',
            top: '8%',
            left: '12%',
            width: '40%',
            height: '25%',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.5) 40%, transparent 100%)',
            filter: 'blur(1px)',
            transform: 'rotate(-20deg)',
          }}
        />

        {/* Secondary highlight */}
        <div
          style={{
            position: 'absolute',
            top: '25%',
            left: '8%',
            width: '20%',
            height: '12%',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.6)',
            filter: 'blur(2px)',
          }}
        />

        {/* Small bright dot */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '20%',
            width: '8%',
            height: '5%',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 1)',
            filter: 'blur(0.5px)',
            boxShadow: '0 0 4px rgba(255, 255, 255, 0.8)',
          }}
        />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {children}
        </div>
      </div>
    </motion.div>
  );
}
