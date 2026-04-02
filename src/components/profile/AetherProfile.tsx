'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Settings, Share2, User, Lock,
  UserPlus, MessageCircle, Moon, TrendingUp, Activity,
  Zap, Award, BookOpen, Camera, Leaf, Music, Coffee, Heart, Wind,
  Globe, Users, Star, Bell, PlusCircle, Eye, Repeat2,
  Flame, Sparkles, Bot, Sun, Edit2, Home, X as XIcon, MapPin, LogOut,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useOneSutraAuth } from '@/hooks/useOneSutraAuth';
import { getFirebaseFirestore } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, getDocs, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import styles from './AetherProfile.module.css';
import InviteCard from '@/components/PranaVerse/InviteCard';

// ══════════════════════════════════════════════════════════
//  HUMAN AVATAR — Gender-aware realistic portrait (Gen Z style)
// ══════════════════════════════════════════════════════════
function HumanAvatarSVG({ gender = 'male' }: { gender?: 'male' | 'female' }) {
  const isMale = gender !== 'female';
  return (
    <svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" className={styles.avatarSvg}>
      <defs>
        <radialGradient id="avSkin" cx="38%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#EDBC8A" />
          <stop offset="55%" stopColor="#D49560" />
          <stop offset="100%" stopColor="#B87040" />
        </radialGradient>
        <radialGradient id="avFaceShadow" cx="50%" cy="50%" r="50%">
          <stop offset="52%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(70,35,10,0.28)" />
        </radialGradient>
        <linearGradient id="avHair" x1="35%" y1="0%" x2="65%" y2="100%">
          <stop offset="0%" stopColor="#2E1A0E" />
          <stop offset="100%" stopColor="#120804" />
        </linearGradient>
        <linearGradient id="avHairSheen" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(120,70,30,0.0)" />
          <stop offset="42%" stopColor="rgba(180,100,45,0.38)" />
          <stop offset="100%" stopColor="rgba(120,70,30,0.0)" />
        </linearGradient>
        <linearGradient id="avClothM" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#1a2540" />
          <stop offset="100%" stopColor="#0d1525" />
        </linearGradient>
        <linearGradient id="avClothF" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#3D1A42" />
          <stop offset="100%" stopColor="#1E0C22" />
        </linearGradient>
        <radialGradient id="avBg" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="rgba(20,50,90,0.5)" />
          <stop offset="100%" stopColor="rgba(5,10,20,0.9)" />
        </radialGradient>
        <radialGradient id="avRimLight" cx="50%" cy="50%" r="50%">
          <stop offset="58%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(80,160,255,0.18)" />
        </radialGradient>
        <radialGradient id="avIrisL" cx="35%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#5B8AAA" />
          <stop offset="100%" stopColor="#1A2C3A" />
        </radialGradient>
        <radialGradient id="avCheekL" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={isMale ? 'rgba(210,130,90,0.18)' : 'rgba(230,140,110,0.28)'} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="avCheekR" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={isMale ? 'rgba(210,130,90,0.18)' : 'rgba(230,140,110,0.28)'} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="avNeck" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D49560" />
          <stop offset="100%" stopColor="#B87040" />
        </linearGradient>
        <radialGradient id="avEarring" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#FFE680" />
          <stop offset="100%" stopColor="#C8960A" />
        </radialGradient>
      </defs>

      {/* Background */}
      <circle cx="100" cy="120" r="120" fill="url(#avBg)" />

      {/* BODY / Clothing — gender specific */}
      {isMale ? (
        <>
          {/* Modern hoodie body */}
          <path d="M16,240 L16,186 Q18,165 50,156 L84,146 Q91,141 100,141 Q109,141 116,146 L150,156 Q182,165 184,186 L184,240 Z" fill="url(#avClothM)" />
          {/* Hood collar detail */}
          <path d="M84,146 Q92,160 100,163 Q108,160 116,146" fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="2.5" />
          {/* Center seam */}
          <path d="M100,163 L100,210" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />
          {/* Front pocket */}
          <rect x="80" y="192" width="40" height="24" rx="7" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          {/* Shoulder fabric */}
          <ellipse cx="38" cy="176" rx="30" ry="14" fill="rgba(255,255,255,0.04)" />
          <ellipse cx="162" cy="176" rx="30" ry="14" fill="rgba(255,255,255,0.04)" />
        </>
      ) : (
        <>
          {/* Feminine top */}
          <path d="M20,240 L20,190 Q22,170 52,161 L86,151 Q92,146 100,146 Q108,146 114,151 L148,161 Q178,170 180,190 L180,240 Z" fill="url(#avClothF)" />
          {/* Elegant neckline */}
          <path d="M86,151 Q100,173 114,151" fill="none" stroke="rgba(255,200,230,0.18)" strokeWidth="2" />
          {/* Fabric shimmer */}
          <path d="M55,185 Q100,178 145,185" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" strokeLinecap="round" />
          {/* Collar accent */}
          <path d="M88,155 Q94,165 100,167 Q106,165 112,155" fill="none" stroke="rgba(230,180,220,0.12)" strokeWidth="1.5" />
        </>
      )}

      {/* NECK */}
      <path d={isMale
        ? "M88,134 L86,153 Q93,160 100,161 Q107,160 114,153 L112,134 Q106,144 100,146 Q94,144 88,134 Z"
        : "M89,135 L87,154 Q93,161 100,162 Q107,161 113,154 L111,135 Q106,145 100,147 Q94,145 89,135 Z"}
        fill="url(#avNeck)" />
      <path d="M89,135 L88,151 Q91,147 89,135 Z" fill="rgba(80,40,10,0.18)" />
      <path d="M111,135 L112,151 Q109,147 111,135 Z" fill="rgba(80,40,10,0.18)" />

      {/* HEAD — slightly different proportions by gender */}
      <ellipse cx="100" cy={isMale ? 85 : 86} rx={isMale ? 50 : 47} ry={isMale ? 53 : 51} fill="url(#avSkin)" />
      <ellipse cx="100" cy={isMale ? 85 : 86} rx={isMale ? 50 : 47} ry={isMale ? 53 : 51} fill="url(#avFaceShadow)" />

      {/* HAIR — completely different by gender */}
      {isMale ? (
        <>
          {/* Modern fade/undercut — very short sides, textured top */}
          <ellipse cx="100" cy="44" rx="48" ry="23" fill="url(#avHair)" />
          {/* Hairline front */}
          <path d="M55,63 Q60,50 100,38 Q140,50 145,63 Q130,50 100,42 Q70,50 55,63 Z" fill="url(#avHair)" />
          {/* Short fade sides — barely visible */}
          <path d="M51,66 Q47,78 49,104 Q55,90 59,77 Q55,70 51,66 Z" fill="#1A0E06" opacity="0.85" />
          <path d="M149,66 Q153,78 151,104 Q145,90 141,77 Q145,70 149,66 Z" fill="#1A0E06" opacity="0.85" />
          {/* Top texture — swept forward slightly */}
          <path d="M68,50 Q82,40 96,44" stroke="rgba(130,72,32,0.42)" strokeWidth="2.8" fill="none" strokeLinecap="round" />
          <path d="M74,45 Q88,35 104,40" stroke="rgba(130,72,32,0.32)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M82,41 Q96,32 112,37" stroke="rgba(130,72,32,0.22)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          {/* Hair sheen */}
          <ellipse cx="94" cy="42" rx="24" ry="9" fill="url(#avHairSheen)" />
        </>
      ) : (
        <>
          {/* Long flowing hair — behind the head, flowing to shoulders */}
          <path d="M53,70 Q44,92 42,132 Q44,162 50,182 Q58,190 64,174 Q58,154 56,128 Q55,98 60,76 Z" fill="url(#avHair)" opacity="0.96" />
          <path d="M147,70 Q156,92 158,132 Q156,162 150,182 Q142,190 136,174 Q142,154 144,128 Q145,98 140,76 Z" fill="url(#avHair)" opacity="0.96" />
          {/* Top hair mass */}
          <ellipse cx="100" cy="46" rx="50" ry="25" fill="url(#avHair)" />
          {/* Hairline */}
          <path d="M54,66 Q58,48 100,36 Q142,48 146,66 Q130,52 100,43 Q70,52 54,66 Z" fill="url(#avHair)" />
          {/* Center part */}
          <path d="M100,38 L100,54" stroke="rgba(180,110,50,0.20)" strokeWidth="1.8" strokeLinecap="round" />
          {/* Hair wave highlights */}
          <path d="M53,92 Q49,116 51,142" stroke="rgba(130,72,32,0.22)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M147,92 Q151,116 149,142" stroke="rgba(130,72,32,0.22)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M72,42 Q86,36 100,40" stroke="rgba(160,92,42,0.38)" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Hair sheen */}
          <ellipse cx="92" cy="44" rx="26" ry="10" fill="url(#avHairSheen)" />
        </>
      )}

      {/* EARS */}
      <ellipse cx="51" cy={isMale ? 87 : 88} rx="7" ry="10" fill="#C99060" />
      <path d={`M53,${isMale ? 82 : 83} Q57,${isMale ? 87 : 88} 53,${isMale ? 93 : 94}`} fill="none" stroke="rgba(100,55,20,0.35)" strokeWidth="1.5" />
      <ellipse cx="149" cy={isMale ? 87 : 88} rx="7" ry="10" fill="#C99060" />
      <path d={`M147,${isMale ? 82 : 83} Q143,${isMale ? 87 : 88} 147,${isMale ? 93 : 94}`} fill="none" stroke="rgba(100,55,20,0.35)" strokeWidth="1.5" />

      {/* Male: small gold earring stud on left ear */}
      {isMale && (
        <>
          <circle cx="51" cy={96} r="3.2" fill="url(#avEarring)" opacity="0.90" />
          <circle cx="51" cy={96} r="1.4" fill="#FFE88A" opacity="0.80" />
        </>
      )}

      {/* EYEBROWS — slightly different by gender */}
      {isMale ? (
        <>
          <path d="M70,72 Q81,66 92,70" stroke="#2A1508" strokeWidth="3.0" fill="none" strokeLinecap="round" />
          <path d="M108,70 Q119,66 130,72" stroke="#2A1508" strokeWidth="3.0" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          {/* Thinner, slightly arched brows */}
          <path d="M70,72 Q82,65 93,70" stroke="#2A1508" strokeWidth="2.0" fill="none" strokeLinecap="round" />
          <path d="M107,70 Q118,65 130,72" stroke="#2A1508" strokeWidth="2.0" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* EYES */}
      {/* Left eye */}
      <ellipse cx="81" cy={isMale ? 80 : 81} rx="12" ry={isMale ? 8.2 : 9.5} fill="white" />
      <ellipse cx="81" cy={isMale ? 80 : 81} rx="7.2" ry="7.2" fill="url(#avIrisL)" />
      <circle cx="81" cy={isMale ? 80 : 81} r="4.0" fill="#101820" />
      <circle cx="83.5" cy={isMale ? 77.5 : 78.5} r="2.2" fill="white" opacity="0.92" />
      <circle cx="79" cy={isMale ? 82 : 83} r="1" fill="white" opacity="0.42" />
      <path d={`M69,${isMale ? 80 : 81} Q81,${isMale ? 70 : 70} 93,${isMale ? 80 : 81}`} fill="none" stroke="rgba(30,15,5,0.65)" strokeWidth="2" strokeLinecap="round" />
      {/* Female longer upper lashes */}
      {!isMale && (
        <>
          <path d="M71,79 L69,75" stroke="#1E0E04" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M75,76 L74,72" stroke="#1E0E04" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M81,75 L81,70" stroke="#1E0E04" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M87,76 L88,72" stroke="#1E0E04" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M91,79 L93,75" stroke="#1E0E04" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
      {/* Right eye */}
      <ellipse cx="119" cy={isMale ? 80 : 81} rx="12" ry={isMale ? 8.2 : 9.5} fill="white" />
      <ellipse cx="119" cy={isMale ? 80 : 81} rx="7.2" ry="7.2" fill="url(#avIrisL)" />
      <circle cx="119" cy={isMale ? 80 : 81} r="4.0" fill="#101820" />
      <circle cx="121.5" cy={isMale ? 77.5 : 78.5} r="2.2" fill="white" opacity="0.92" />
      <circle cx="117" cy={isMale ? 82 : 83} r="1" fill="white" opacity="0.42" />
      <path d={`M107,${isMale ? 80 : 81} Q119,${isMale ? 70 : 70} 131,${isMale ? 80 : 81}`} fill="none" stroke="rgba(30,15,5,0.65)" strokeWidth="2" strokeLinecap="round" />
      {!isMale && (
        <>
          <path d="M109,79 L107,75" stroke="#1E0E04" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M113,76 L112,72" stroke="#1E0E04" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M119,75 L119,70" stroke="#1E0E04" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M125,76 L126,72" stroke="#1E0E04" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M129,79 L131,75" stroke="#1E0E04" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}

      {/* NOSE */}
      <path d="M100,89 L97,103" fill="none" stroke="rgba(130,65,25,0.26)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M100,89 L103,103" fill="none" stroke="rgba(130,65,25,0.26)" strokeWidth="1.8" strokeLinecap="round" />
      <ellipse cx="95.5" cy="105" rx="5.2" ry="3.8" fill="rgba(125,65,25,0.12)" />
      <ellipse cx="104.5" cy="105" rx="5.2" ry="3.8" fill="rgba(125,65,25,0.12)" />
      <path d="M100,85 Q99,91 99,97" fill="none" stroke="rgba(255,210,165,0.09)" strokeWidth="3" strokeLinecap="round" />

      {/* MOUTH */}
      <path d={isMale
        ? "M87,116 Q94,111 100,113 Q106,111 113,116"
        : "M88,117 Q95,112 100,114 Q105,112 112,117"}
        fill={isMale ? '#B87050' : '#C97880'} opacity="0.78" />
      <path d={isMale ? "M87,116 Q100,127 113,116" : "M88,117 Q100,129 112,117"}
        fill={isMale ? '#CE9070' : '#E09090'} opacity="0.52" />
      <path d={isMale ? "M88,116 Q100,126 112,116" : "M89,117 Q100,128 111,117"}
        fill="none" stroke="rgba(140,60,30,0.36)" strokeWidth="1" />
      <ellipse cx="100" cy={isMale ? 120 : 121} rx="8" ry="3" fill="rgba(255,200,165,0.09)" />
      <circle cx={isMale ? 86 : 87} cy={isMale ? 116 : 117} r="1.8" fill="rgba(130,60,25,0.22)" />
      <circle cx={isMale ? 114 : 113} cy={isMale ? 116 : 117} r="1.8" fill="rgba(130,60,25,0.22)" />

      {/* FACE HIGHLIGHTS */}
      <ellipse cx="91" cy="62" rx="19" ry="11" fill="rgba(255,230,200,0.12)" />
      <ellipse cx="70" cy="96" rx="14" ry="9" fill="url(#avCheekL)" />
      <ellipse cx="130" cy="96" rx="14" ry="9" fill="url(#avCheekR)" />
      <ellipse cx="100" cy="100" rx="5" ry="4" fill="rgba(255,210,175,0.08)" />
      <ellipse cx="100" cy="129" rx="11" ry="6" fill="rgba(255,215,180,0.08)" />

      {/* Male: subtle stubble around jaw */}
      {isMale && (
        <>
          <path d="M82,120 Q100,128 118,120" fill="none" stroke="rgba(50,25,10,0.10)" strokeWidth="3" />
          <ellipse cx="100" cy="124" rx="20" ry="7" fill="rgba(50,25,10,0.06)" />
        </>
      )}

      {/* Female: bindi on forehead */}
      {!isMale && (
        <>
          <circle cx="100" cy="65" r="3.8" fill="#CC2200" opacity="0.88" />
          <circle cx="100" cy="65" r="2.2" fill="#FF5533" opacity="0.72" />
          <circle cx="100" cy="65" r="1.1" fill="#FFB8A0" opacity="0.90" />
        </>
      )}

      {/* RIM LIGHT edge glow */}
      <ellipse cx="100" cy={isMale ? 85 : 86} rx={isMale ? 50 : 47} ry={isMale ? 53 : 51} fill="url(#avRimLight)" />
    </svg>
  );
}

// ══════════════════════════════════════════════════════════
//  VITALITY RING — Animated SVG Progress Ring
// ══════════════════════════════════════════════════════════
// 7 Chakra colors (Root → Crown)
const CHAKRA_COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#6366F1', '#A855F7'];

function VitalityRing({ score = 78, size = 200 }: { score?: number; size?: number }) {
  const strokeW = 7;
  const radius = (size - strokeW * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - score / 100);
  // Chakra dots at 7 equally-spaced positions on the outer edge
  const chakraRadius = radius + strokeW / 2 + 5;

  return (
    <svg
      width={size}
      height={size}
      className={styles.vitalityRingSvg}
      style={{ transform: 'rotate(-90deg)' }}
    >
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="45%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <filter id="ringGlow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={strokeW}
      />
      {/* Progress arc */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#ringGrad)"
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: dashOffset }}
        transition={{ duration: 1.8, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
        filter="url(#ringGlow)"
      />
      {/* 7 Chakra dots */}
      {CHAKRA_COLORS.map((color, i) => {
        const angle = (i / 7) * Math.PI * 2;
        const cx = size / 2 + chakraRadius * Math.cos(angle);
        const cy = size / 2 + chakraRadius * Math.sin(angle);
        return (
          <motion.circle
            key={i}
            cx={cx}
            cy={cy}
            r={4}
            fill={color}
            filter="url(#ringGlow)"
            initial={{ opacity: 0, r: 0 }}
            animate={{ opacity: [0.6, 1, 0.6], r: 4 }}
            transition={{ delay: 0.8 + i * 0.1, duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        );
      })}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════
//  AYURVEDIC RADAR CHART — SVG Polar/Spider Chart
// ══════════════════════════════════════════════════════════
function AyurvedicRadarChart({ prakriti = 'Vata-Pitta' }: { prakriti?: string }) {
  const SIZE = 220;
  const CX = 110, CY = 110, MAX_R = 78;

  const axes = [
    { label: 'Agni', sub: 'Digestive Fire', value: 0.78, color: '#F59E0B' },
    { label: 'Nidra', sub: 'Sleep', value: 0.65, color: '#60A5FA' },
    { label: 'Sattva', sub: 'Mental Clarity', value: 0.82, color: '#A78BFA' },
    { label: 'Bala', sub: 'Physical Vitality', value: 0.71, color: '#34D399' },
    { label: 'Bhava', sub: 'Emotional Flow', value: 0.68, color: '#F472B6' },
    { label: 'Ojas', sub: 'Life Force', value: 0.75, color: '#14B8A6' },
  ];

  const n = axes.length;
  const angles = axes.map((_, i) => (i * Math.PI * 2) / n - Math.PI / 2);

  const pt = (angle: number, r: number) => ({
    x: CX + r * Math.cos(angle),
    y: CY + r * Math.sin(angle),
  });

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';

  const dataPoints = angles.map((a, i) => pt(a, MAX_R * axes[i].value));
  const dataPath = toPath(dataPoints);

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ width: '100%', maxWidth: 220, overflow: 'visible' }}>
      <defs>
        <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.40" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.25" />
        </linearGradient>
        <filter id="radarGlow">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1.0].map((lvl) => (
        <polygon
          key={lvl}
          points={angles.map((a) => {
            const p = pt(a, MAX_R * lvl);
            return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
          }).join(' ')}
          fill="none"
          stroke={lvl === 1.0 ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.05)'}
          strokeWidth={lvl === 1.0 ? 1 : 0.8}
        />
      ))}

      {/* Axis lines */}
      {angles.map((a, i) => {
        const end = pt(a, MAX_R);
        return (
          <line
            key={i}
            x1={CX} y1={CY}
            x2={end.x.toFixed(1)} y2={end.y.toFixed(1)}
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={1}
          />
        );
      })}

      {/* Data fill polygon */}
      <motion.path
        d={dataPath}
        fill="url(#radarFill)"
        stroke="#8B5CF6"
        strokeWidth={1.8}
        strokeLinejoin="round"
        filter="url(#radarGlow)"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1], delay: 0.4 }}
        style={{ transformOrigin: `${CX}px ${CY}px` }}
      />

      {/* Data point dots */}
      {dataPoints.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x.toFixed(1)}
          cy={p.y.toFixed(1)}
          r={3.8}
          fill={axes[i].color}
          filter="url(#radarGlow)"
          initial={{ opacity: 0, r: 0 }}
          animate={{ opacity: 1, r: 3.8 }}
          transition={{ delay: 0.6 + i * 0.07, duration: 0.3 }}
        />
      ))}

      {/* Center dot */}
      <circle cx={CX} cy={CY} r={3} fill="rgba(139,92,246,0.6)" />

      {/* Axis labels */}
      {angles.map((a, i) => {
        const labelR = MAX_R + 24;
        const lp = pt(a, labelR);
        return (
          <g key={i}>
            <text
              x={lp.x.toFixed(1)}
              y={lp.y.toFixed(1)}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.82)"
              fontSize={8.5}
              fontWeight={700}
              fontFamily="Inter, sans-serif"
            >
              {axes[i].label}
            </text>
            <text
              x={lp.x.toFixed(1)}
              y={(parseFloat(lp.y.toFixed(1)) + 11).toFixed(1)}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.35)"
              fontSize={6.5}
              fontFamily="Inter, sans-serif"
            >
              {axes[i].sub}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════
//  MOOD FLOW CHART — SVG smooth area chart
// ══════════════════════════════════════════════════════════
function MoodFlowChart() {
  const W = 300, H = 88;
  const PAD = { t: 8, b: 22, l: 8, r: 8 };
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const vals = [62, 55, 74, 68, 82, 77, 85];

  const xS = (i: number) => PAD.l + (i / (days.length - 1)) * plotW;
  const yS = (v: number) => PAD.t + plotH - ((v - 40) / 60) * plotH;

  // Smooth cubic bezier path
  const linePath = vals.reduce((acc, v, i) => {
    const x = xS(i), y = yS(v);
    if (i === 0) return `M${x},${y}`;
    const px = xS(i - 1), py = yS(vals[i - 1]);
    const cx1 = (px + x) / 2, cy1 = py;
    const cx2 = (px + x) / 2, cy2 = y;
    return `${acc} C${cx1},${cy1} ${cx2},${cy2} ${x},${y}`;
  }, '');

  const areaPath = `${linePath} L${xS(vals.length - 1)},${H - PAD.b} L${xS(0)},${H - PAD.b} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      <defs>
        <linearGradient id="moodAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
        </linearGradient>
        <filter id="moodGlow">
          <feGaussianBlur stdDeviation="1.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Area fill */}
      <path d={areaPath} fill="url(#moodAreaGrad)" />
      {/* Line */}
      <motion.path
        d={linePath}
        fill="none"
        stroke="#3B82F6"
        strokeWidth={2}
        strokeLinecap="round"
        filter="url(#moodGlow)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
      />
      {/* Data dots */}
      {vals.map((v, i) => (
        <motion.circle
          key={i}
          cx={xS(i)}
          cy={yS(v)}
          r={3}
          fill="#3B82F6"
          filter="url(#moodGlow)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6 + i * 0.08 }}
        />
      ))}
      {/* Highest value label */}
      {(() => {
        const maxIdx = vals.indexOf(Math.max(...vals));
        return (
          <g>
            <rect
              x={xS(maxIdx) - 14}
              y={yS(vals[maxIdx]) - 18}
              width={28}
              height={14}
              rx={7}
              fill="rgba(59,130,246,0.25)"
            />
            <text
              x={xS(maxIdx)}
              y={yS(vals[maxIdx]) - 8}
              textAnchor="middle"
              fill="#93C5FD"
              fontSize={7.5}
              fontWeight={700}
              fontFamily="Inter, sans-serif"
            >
              {vals[maxIdx]}%
            </text>
          </g>
        );
      })()}
      {/* Day labels */}
      {days.map((d, i) => (
        <text
          key={i}
          x={xS(i)}
          y={H - 5}
          textAnchor="middle"
          fill="rgba(255,255,255,0.28)"
          fontSize={7.5}
          fontFamily="Inter, sans-serif"
        >
          {d}
        </text>
      ))}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════
//  SLEEP WAVE — SVG sleep stage visualization
// ══════════════════════════════════════════════════════════
function SleepWaveSVG() {
  const W = 300, H = 54;
  const stages = [
    { y: 0.2, label: 'awake' },
    { y: 0.5, label: 'light' },
    { y: 0.5, label: 'light' },
    { y: 0.8, label: 'deep' },
    { y: 0.9, label: 'deep' },
    { y: 0.85, label: 'deep' },
    { y: 0.65, label: 'rem' },
    { y: 0.55, label: 'rem' },
    { y: 0.75, label: 'deep' },
    { y: 0.8, label: 'deep' },
    { y: 0.6, label: 'rem' },
    { y: 0.5, label: 'light' },
    { y: 0.3, label: 'light' },
    { y: 0.15, label: 'awake' },
  ];

  const pts = stages.map((s, i) => ({
    x: (i / (stages.length - 1)) * W,
    y: s.y * (H - 8) + 4,
    label: s.label,
  }));

  const wavePath = pts.reduce((acc, p, i) => {
    if (i === 0) return `M${p.x},${p.y}`;
    const prev = pts[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `${acc} C${cx},${prev.y} ${cx},${p.y} ${p.x},${p.y}`;
  }, '');

  const areaPath = `${wavePath} L${W},${H} L0,${H} Z`;

  const stageColors: Record<string, string> = {
    deep: '#818CF8',
    rem: '#60A5FA',
    light: '#34D399',
    awake: '#F87171',
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      <defs>
        <linearGradient id="sleepWaveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#818CF8" stopOpacity="0.50" />
          <stop offset="100%" stopColor="#818CF8" stopOpacity="0.03" />
        </linearGradient>
        <filter id="waveGlow">
          <feGaussianBlur stdDeviation="1.2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d={areaPath} fill="url(#sleepWaveGrad)" />
      <motion.path
        d={wavePath}
        fill="none"
        stroke="#818CF8"
        strokeWidth={2}
        strokeLinecap="round"
        filter="url(#waveGlow)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.6, ease: 'easeOut' }}
      />
      {/* Stage dots */}
      {pts.filter((_, i) => i % 3 === 0).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={stageColors[p.label] || '#818CF8'} />
      ))}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════
//  POST CHANNEL ROW — single postable channel (like Snapchat story row)
// ══════════════════════════════════════════════════════════
interface PostChannelProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  accent: string;
  onClick?: () => void;
}
function PostChannelRow({ icon, iconBg, title, subtitle, badge, badgeColor, accent, onClick }: PostChannelProps) {
  return (
    <motion.button
      className={styles.postChannelRow}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className={styles.postChannelIcon} style={{ background: iconBg, boxShadow: `0 0 12px ${accent}30` }}>
        {icon}
      </div>
      <div className={styles.postChannelInfo}>
        <span className={styles.postChannelTitle}>{title}</span>
        <span className={styles.postChannelSub}>{subtitle}</span>
      </div>
      {badge && (
        <span className={styles.postChannelBadge} style={{ color: badgeColor, borderColor: `${badgeColor}40`, background: `${badgeColor}12` }}>
          {badge}
        </span>
      )}
      <span className={styles.postChannelArrow} style={{ color: accent }}>›</span>
    </motion.button>
  );
}

// ══════════════════════════════════════════════════════════
//  SANGHA MEMBER ROW — real user data aware
// ══════════════════════════════════════════════════════════
interface SanghaItemProps {
  photoURL?: string | null;
  name: string;
  tag: string;
  accent: string;
  online?: boolean;
  onClick?: () => void;
}
function SanghaItem({ photoURL, name, tag, accent, online, onClick }: SanghaItemProps) {
  const initials = name.split(' ').map((w: string) => w[0] || '').join('').slice(0, 2).toUpperCase();
  return (
    <div className={styles.sanghaItem} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className={styles.sanghaAvatar} style={{
        background: photoURL ? 'transparent' : `radial-gradient(circle at 35% 30%,rgba(255,255,255,0.2),${accent}60)`,
        position: 'relative', overflow: 'hidden', fontSize: photoURL ? undefined : '0.68rem',
      }}>
        {photoURL
          ? <img src={photoURL} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          : initials}
        {online && <span style={{ position: 'absolute', bottom: 1, right: 1, width: 8, height: 8, borderRadius: '50%', background: '#4ade80', border: '1.5px solid #08041a' }} />}
      </div>
      <div className={styles.sanghaInfo}>
        <span className={styles.sanghaName}>{name}</span>
        <span className={styles.sanghaTag} style={{ color: accent }}>{tag}</span>
      </div>
      <button className={styles.sanghaConnectBtn} style={{ borderColor: `${accent}50`, color: accent }}>
        <MessageCircle size={12} />
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  BODHI ENQUIRY MODAL — Ask Bodhi + Add Friend flow
// ══════════════════════════════════════════════════════════
type BodhiMode = 'enquiry' | 'add_friend';

interface BodhiEnquiryModalProps {
  targetName: string;
  targetProfile: ProfileDoc | null;
  targetUid?: string;
  senderUid?: string;
  senderName?: string;
  onClose: () => void;
  mode?: BodhiMode;
  onFriendRequestSent?: () => void;
}

function BodhiEnquiryModal({ targetName, targetProfile, targetUid, senderUid, senderName, onClose, mode = 'enquiry', onFriendRequestSent }: BodhiEnquiryModalProps) {
  const buildInitialMsg = () => {
    const hobbies = targetProfile?.hobbies;
    const profession = targetProfile?.profession;
    if (mode === 'add_friend') {
      const parts: string[] = [];
      if (profession) parts.push(`works as ${profession}`);
      if (targetProfile?.prakriti) parts.push(`${targetProfile.prakriti} energy`);
      if (hobbies?.length) parts.push(`loves ${hobbies.slice(0, 3).join(', ')}`);
      const snippet = parts.length ? parts.join(' · ') : 'a fellow seeker on the conscious path';
      return `Yo! I'm Bodhi ✦ Quick vibe check before you add ${targetName} 👀\n\n${snippet}${targetProfile?.bio ? `\n\n"${targetProfile.bio}"` : ''}\n\nLooks like solid energy to vibe with! Wanna send them a friend request? 🤝`;
    }
    return `Namaste ✦ I can share insights about ${targetName}'s journey — their ${targetProfile?.prakriti || 'Prakriti'}, lifestyle, and how you might vibe together. What would you like to know?`;
  };

  const [messages, setMessages] = useState<Array<{ role: 'user' | 'bodhi'; text: string }>>([{ role: 'bodhi', text: buildInitialMsg() }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [frSending, setFrSending] = useState(false);
  const [frSent, setFrSent] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const voiceEnabledRef = useRef(true);
  const speakRef = useRef<((text: string) => void) | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // keep voiceEnabledRef in sync
  useEffect(() => { voiceEnabledRef.current = voiceEnabled; }, [voiceEnabled]);

  // ── 1. stopSpeech — defined first so all other callbacks can depend on it ──
  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // ── 2. speak — TTS via Web Speech API ──────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/✦/g, '').replace(/🙏|🌟|🤝|👀|🌱|🕊️/g, '').trim();
    if (!clean) return;
    const utt = new SpeechSynthesisUtterance(clean);
    utt.rate = 0.92;
    utt.pitch = 1.05;
    utt.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => /google.*english|samantha|karen|moira|daniel|ava/i.test(v.name))
      || voices.find(v => v.lang.startsWith('en'));
    if (preferred) utt.voice = preferred;
    utt.onstart = () => setIsSpeaking(true);
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utt);
  }, []);

  // keep speakRef in sync so closures (onresult) always call latest speak
  useEffect(() => { speakRef.current = speak; }, [speak]);

  // stop speech when modal unmounts
  useEffect(() => { return () => stopSpeech(); }, [stopSpeech]);

  // ── 3. startListening / stopListening — SpeechRecognition mic input ─────────
  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    stopSpeech();
    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = 'en-IN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setIsListening(true);
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setIsListening(false);
      setInput('');
      if (transcript.trim()) {
        setMessages(prev => [...prev, { role: 'user', text: transcript.trim() }]);
        setLoading(true);
        fetch('/api/bodhi-enquiry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: transcript.trim(), targetName, targetProfile, history: [], mode }),
        })
          .then(r => r.json())
          .then(data => {
            const replyText = data.reply || 'I am here with you ✦';
            setMessages(prev => [...prev, { role: 'bodhi', text: replyText }]);
            if (voiceEnabledRef.current) speakRef.current?.(replyText);
          })
          .catch(() => {
            setMessages(prev => [...prev, { role: 'bodhi', text: 'Bodhi is reflecting… please try again 🙏 ✦' }]);
          })
          .finally(() => setLoading(false));
      }
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    rec.start();
  }, [stopSpeech, targetName, targetProfile, mode]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  // cleanup mic + speech on unmount
  useEffect(() => { return () => { recognitionRef.current?.abort(); stopSpeech(); }; }, [stopSpeech]);

  const quickQuestions = mode === 'add_friend'
    ? [`What's ${targetName} like?`, 'Common interests?', 'Their vibe?', 'Should I add them?']
    : [`What is ${targetName}'s Prakriti?`, 'How can we connect?', 'Common interests?', 'Their wellness journey'];

  const send = useCallback(async (messageText: string) => {
    if (!messageText.trim() || loading) return;
    stopSpeech();
    const userMsg = messageText.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const resp = await fetch('/api/bodhi-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          targetName: targetName,
          targetProfile: targetProfile,
          history: messages.slice(-4),
          mode: mode
        }),
      });

      const data = await resp.json();
      const replyText = data.reply || "I am here with you. What would you like to know? ✦";
      setMessages(prev => [...prev, { role: 'bodhi', text: replyText }]);
      if (voiceEnabled) speak(replyText);
    } catch (error) {
      console.error('[BodhiEnquiry] Error:', error);
      const fallback = "I'm having a bit of trouble connecting to the cosmic flow right now. Please try asking me again in a moment 🙏 ✦";
      setMessages(prev => [...prev, { role: 'bodhi', text: fallback }]);
      if (voiceEnabled) speak(fallback);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, targetName, targetProfile, mode, voiceEnabled, speak, stopSpeech]);

  const handleFriendRequest = async () => {
    if (!senderUid || !targetUid || frSending || frSent) return;
    setFrSending(true);
    try {
      const db = await getFirebaseFirestore();
      await addDoc(collection(db, 'friend_requests'), {
        from: senderUid,
        to: targetUid,
        fromName: senderName || 'Someone',
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      await addDoc(collection(db, 'notifications'), {
        userId: targetUid,
        type: 'friend_request',
        from: senderUid,
        fromName: senderName || 'Someone',
        message: `${senderName || 'Someone'} wants to be your friend on OneSUTRA! 🙏`,
        read: false,
        createdAt: serverTimestamp(),
      });
      setFrSent(true);
      setMessages(prev => [...prev, { role: 'bodhi', text: `Friend request sent to ${targetName}! ✦ Once they accept, you can chat and vibe together on PranaVerse 🌟` }]);
      setTimeout(() => { onFriendRequestSent?.(); onClose(); }, 2400);
    } catch {
      setMessages(prev => [...prev, { role: 'bodhi', text: "Oops, couldn't send the request. Try again in a sec 🙏" }]);
    } finally {
      setFrSending(false);
    }
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const accentColor = mode === 'add_friend' ? '#34d399' : '#a78bfa';
  const accentBg = mode === 'add_friend' ? 'radial-gradient(circle at 35% 30%, #34d399, #059669)' : 'radial-gradient(circle at 35% 30%, #a78bfa, #6d28d9)';
  const accentGlow = mode === 'add_friend' ? 'rgba(52,211,153,0.45)' : 'rgba(167,139,250,0.45)';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 34 }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 520, height: mode === 'add_friend' ? '78vh' : '82vh', background: 'linear-gradient(160deg,rgba(5,2,16,0.99) 0%,rgba(10,5,26,0.99) 100%)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', border: `1px solid ${mode === 'add_friend' ? 'rgba(52,211,153,0.28)' : 'rgba(167,139,250,0.22)'}`, borderRadius: '26px 26px 0 0', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}
      >
        {/* Ambient glow */}
        <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 280, height: 120, borderRadius: '50%', background: `radial-gradient(ellipse,${mode === 'add_friend' ? 'rgba(52,211,153,0.18)' : 'rgba(167,139,250,0.18)'} 0%,transparent 70%)`, pointerEvents: 'none' }} />
        {/* Header */}
        <div style={{ padding: '1rem 1.2rem 0.8rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '0.8rem', position: 'relative', zIndex: 1 }}>
          {/* Bodhi avatar with speaking pulse ring */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {isSpeaking && (
              <motion.div
                animate={{ scale: [1, 1.35, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute', inset: -5, borderRadius: '50%', border: `2px solid ${accentColor}`, pointerEvents: 'none' }}
              />
            )}
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', boxShadow: isSpeaking ? `0 0 22px ${accentGlow}` : `0 0 18px ${accentGlow}` }}>✦</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.90rem', fontWeight: 800, color: accentColor, fontFamily: "'Outfit',sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mode === 'add_friend' ? `Add ${targetName} as Friend?` : `Ask Bodhi about ${targetName}`}</div>
            <div style={{ fontSize: '0.46rem', color: isSpeaking ? accentColor : 'rgba(255,255,255,0.28)', fontFamily: 'monospace', letterSpacing: '0.10em', textTransform: 'uppercase', transition: 'color 0.3s' }}>{isSpeaking ? '🔊 BODHI IS SPEAKING…' : mode === 'add_friend' ? 'BODHI · FRIEND CONNECT · AI INTRO' : 'SAKHA BODHI · AI COMPANION · SACRED INSIGHTS'}</div>
          </div>
          {/* Voice toggle */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => { if (voiceEnabled) { stopSpeech(); setVoiceEnabled(false); } else { setVoiceEnabled(true); } }}
            title={voiceEnabled ? 'Mute Bodhi voice' : 'Unmute Bodhi voice'}
            style={{ background: voiceEnabled ? `rgba(167,139,250,0.14)` : 'rgba(255,255,255,0.05)', border: `1px solid ${voiceEnabled ? 'rgba(167,139,250,0.34)' : 'rgba(255,255,255,0.10)'}`, borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.85rem', flexShrink: 0, transition: 'all 0.2s' }}
          >{voiceEnabled ? '🔊' : '🔇'}</motion.button>
          <button onClick={() => { stopSpeech(); onClose(); }} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '1rem', flexShrink: 0 }}>✕</button>
        </div>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: '0.5rem', alignItems: 'flex-end' }}>
              {m.role === 'bodhi' && (
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0, boxShadow: `0 0 10px ${accentGlow}` }}>✦</div>
              )}
              <div style={{ maxWidth: '78%', padding: '0.65rem 1rem', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: m.role === 'user' ? 'linear-gradient(135deg,rgba(251,191,36,0.22),rgba(217,119,6,0.15))' : mode === 'add_friend' ? 'rgba(52,211,153,0.10)' : 'rgba(167,139,250,0.12)', border: m.role === 'user' ? '1px solid rgba(251,191,36,0.32)' : mode === 'add_friend' ? '1px solid rgba(52,211,153,0.22)' : '1px solid rgba(167,139,250,0.22)', fontSize: '0.80rem', color: m.role === 'user' ? '#fde68a' : 'rgba(255,255,255,0.88)', fontFamily: "'Outfit',sans-serif", lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>✦</div>
              <div style={{ padding: '0.65rem 1rem', borderRadius: '18px 18px 18px 4px', background: mode === 'add_friend' ? 'rgba(52,211,153,0.10)' : 'rgba(167,139,250,0.12)', border: `1px solid ${mode === 'add_friend' ? 'rgba(52,211,153,0.22)' : 'rgba(167,139,250,0.22)'}` }}>
                <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.3, repeat: Infinity }} style={{ fontSize: '0.78rem', color: accentColor, fontFamily: "'Outfit',sans-serif" }}>Bodhi is thinking… ✦</motion.span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        {/* Quick questions */}
        <div style={{ padding: '0.5rem 1rem 0.4rem', display: 'flex', gap: '0.4rem', overflowX: 'auto', flexShrink: 0 }}>
          {quickQuestions.map((q, i) => (
            <button key={i} onClick={() => send(q)} disabled={loading}
              style={{ flexShrink: 0, padding: '0.30rem 0.70rem', borderRadius: 99, background: mode === 'add_friend' ? 'rgba(52,211,153,0.10)' : 'rgba(167,139,250,0.10)', border: mode === 'add_friend' ? '1px solid rgba(52,211,153,0.24)' : '1px solid rgba(167,139,250,0.24)', color: accentColor, fontSize: '0.60rem', fontFamily: "'Outfit',sans-serif", cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
              {q}
            </button>
          ))}
        </div>
        {/* Input */}
        <div style={{ padding: '0.5rem 1rem 0.4rem', display: 'flex', gap: '0.5rem', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          {/* Mic button */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={isListening ? stopListening : startListening}
            disabled={loading}
            animate={isListening ? { scale: [1, 1.08, 1], boxShadow: ['0 0 0 0 rgba(248,113,113,0.4)', '0 0 0 7px rgba(248,113,113,0)', '0 0 0 0 rgba(248,113,113,0)'] } : {}}
            transition={isListening ? { duration: 1.1, repeat: Infinity } : {}}
            style={{ width: 36, height: 36, borderRadius: '50%', background: isListening ? 'linear-gradient(135deg,rgba(248,113,113,0.35),rgba(239,68,68,0.25))' : 'rgba(255,255,255,0.06)', border: isListening ? '1px solid rgba(248,113,113,0.55)' : '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: loading ? 'default' : 'pointer', color: isListening ? '#f87171' : 'rgba(255,255,255,0.45)', flexShrink: 0, fontSize: '0.85rem' }}
          >{isListening ? '🔴' : '🎙️'}</motion.button>
          <input
            value={isListening ? '🎙️ Listening…' : input}
            onChange={e => !isListening && setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !isListening && send(input)}
            placeholder={`Ask about ${targetName}… or tap 🎙️`}
            style={{ flex: 1, background: isListening ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.06)', border: isListening ? '1px solid rgba(248,113,113,0.28)' : '1px solid rgba(255,255,255,0.12)', borderRadius: 99, padding: '0.60rem 1.1rem', color: isListening ? '#f87171' : '#fff', fontSize: '0.82rem', fontFamily: "'Outfit',sans-serif", outline: 'none', transition: 'all 0.2s' }}
          />
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => send(input)}
            disabled={!input.trim() || loading || isListening}
            style={{ width: 38, height: 38, borderRadius: '50%', background: input.trim() && !isListening ? `linear-gradient(135deg,${accentColor},${mode === 'add_friend' ? '#059669' : '#7c3aed'})` : 'rgba(255,255,255,0.06)', border: 'none', cursor: input.trim() && !isListening ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.95rem', flexShrink: 0, boxShadow: input.trim() && !isListening ? `0 0 12px ${accentGlow}` : 'none', transition: 'all 0.2s' }}>
            ➤
          </motion.button>
        </div>
        {/* ── Friend Request CTA — only in add_friend mode ── */}
        {mode === 'add_friend' && (
          <div style={{ padding: '0.5rem 1rem calc(0.8rem + env(safe-area-inset-bottom))', flexShrink: 0 }}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleFriendRequest}
              disabled={frSending || frSent}
              style={{ width: '100%', padding: '0.85rem', borderRadius: 14, background: frSent ? 'rgba(52,211,153,0.15)' : 'linear-gradient(135deg,#34d399,#059669)', border: frSent ? '1px solid rgba(52,211,153,0.4)' : 'none', color: '#fff', fontFamily: "'Outfit',sans-serif", fontSize: '0.88rem', fontWeight: 700, cursor: frSent ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: frSent ? 'none' : '0 4px 20px rgba(52,211,153,0.35)', transition: 'all 0.2s' }}
            >
              {frSent ? '✅ Friend Request Sent!' : frSending ? '⏳ Sending…' : `🤝 Send Friend Request to ${targetName}`}
            </motion.button>
          </div>
        )}
        {/* ── Enquiry mode: bottom padding ── */}
        {mode === 'enquiry' && <div style={{ height: 'calc(0.5rem + env(safe-area-inset-bottom))' }} />}
      </motion.div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════
//  INTEGRATIONS SECTION — private, only for own profile
// ══════════════════════════════════════════════════════════
function IntegrationsSection() {
  const router = useRouter();
  const integrations = [
    { id: 'google', emoji: '📅', label: 'Google Calendar', sub: 'Sync your sadhana & habit schedule', color: '#34D399', action: () => router.push('/profile?connect=google') },
    { id: 'telegram', emoji: '✈️', label: 'Bodhi on Telegram', sub: 'Chat with Sakha Bodhi via Telegram', color: '#60A5FA', action: () => { if (typeof window !== 'undefined') window.open('https://t.me/SakhaBodhiBot', '_blank'); } },
    { id: 'whatsapp', emoji: '💬', label: 'WhatsApp Community', sub: 'Wellness reminders & circle updates', color: '#4ade80', action: () => { if (typeof window !== 'undefined') window.open('https://wa.me/', '_blank'); } },
    { id: 'notifications', emoji: '🔔', label: 'Push Notifications', sub: 'Stay in flow with prana reminders', color: '#A78BFA', action: () => router.push('/profile?connect=notifications') },
  ];
  return (
    <motion.div
      className={styles.sectionBlock}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.72 }}
    >
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>My Integrations</span>
        <span style={{ padding: '2px 8px', borderRadius: 99, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.28)', color: '#fbbf24', fontSize: '0.38rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Lock size={8} /> PRIVATE
        </span>
      </div>
      <div className={styles.channelList}>
        {integrations.map(itg => (
          <motion.button key={itg.id} className={styles.postChannelRow} whileTap={{ scale: 0.98 }} onClick={itg.action}>
            <div className={styles.postChannelIcon} style={{ background: `${itg.color}18`, boxShadow: `0 0 10px ${itg.color}22`, fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {itg.emoji}
            </div>
            <div className={styles.postChannelInfo}>
              <span className={styles.postChannelTitle}>{itg.label}</span>
              <span className={styles.postChannelSub}>{itg.sub}</span>
            </div>
            <span className={styles.postChannelArrow} style={{ color: itg.color }}>›</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════
//  MINI RING — compact circular progress
// ══════════════════════════════════════════════════════════
function MiniRing({ value, color, size = 54, label }: { value: number; color: string; size?: number; label: string }) {
  const sw = 5; const r = (size - sw * 2) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={sw} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ * (1 - value / 100) }}
          transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1], delay: 0.4 }} />
        <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="middle"
          style={{ transform: 'rotate(90deg)', transformOrigin: `${size / 2}px ${size / 2}px` }}
          fill="rgba(255,255,255,0.85)" fontSize={10} fontWeight={800} fontFamily="Outfit,sans-serif">{value}</text>
      </svg>
      <span style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════
interface ProfileDoc {
  name?: string;
  prakriti?: string;
  title?: string;
  photoURL?: string | null;
  vibeConnections?: number;
  handle?: string;
  joinedDate?: string;
  bio?: string;
  sex?: string;
  gender?: 'male' | 'female';
  interests?: string[];
  hobbies?: string[];
  profession?: string;
  lifestyleTags?: string[];
  socialTags?: string[];
}

interface RealFriend {
  uid: string;
  name: string;
  photoURL?: string | null;
  online?: boolean;
  prakriti?: string;
}

const SANGHA_TAGS = ['#Mindfulness', '#PlantBased', '#EarlyRiser', '#Pranayama', '#Ayurveda', '#Meditation', '#VedicStudy'];
const SANGHA_ACCENTS = ['#A78BFA', '#34D399', '#F59E0B', '#22D3EE', '#F472B6', '#60A5FA', '#FB923C'];

export default function AetherProfile({ viewedUid, autoEnquire }: { viewedUid?: string; autoEnquire?: boolean } = {}) {
  const { user, loading: authLoading } = useOneSutraAuth();
  const router = useRouter();

  const targetUid = viewedUid || user?.uid;
  const isOwnProfile = !viewedUid || viewedUid === user?.uid;

  const [activeView, setActiveView] = useState<'main' | 'metrics'>('main');
  const [profileDoc, setProfileDoc] = useState<ProfileDoc | null>(null);
  const [wellnessScore] = useState(78);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [realSangha, setRealSangha] = useState<RealFriend[]>([]);
  const [showBodhiEnquiry, setShowBodhiEnquiry] = useState(false);
  const [bodhiMode, setBodhiMode] = useState<BodhiMode>('enquiry');
  type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';
  const [friendStatus, setFriendStatus] = useState<FriendStatus>('none');
  const [friendStatusLoading, setFriendStatusLoading] = useState(true);

  // Auto-open Bodhi enquiry if navigated with ?enquire=true
  useEffect(() => {
    if (autoEnquire && !isOwnProfile) setShowBodhiEnquiry(true);
  }, [autoEnquire, isOwnProfile]);

  // Load profile doc for target user
  useEffect(() => {
    if (!targetUid) return;
    let unsub: (() => void) | null = null;
    (async () => {
      try {
        const db = await getFirebaseFirestore();
        const ref = doc(db, 'onesutra_users', targetUid);
        unsub = onSnapshot(ref, (snap) => {
          if (snap.exists()) {
            const data = snap.data() as ProfileDoc;
            setProfileDoc(data);
            const g = data.gender || (data.sex === 'female' || data.sex === 'F' ? 'female' : 'male');
            setGender(g as 'male' | 'female');
          }
        });
      } catch { /* offline */ }
    })();
    return () => unsub?.();
  }, [targetUid]);

  // Check friend status with viewed user
  useEffect(() => {
    if (isOwnProfile || !user?.uid || !viewedUid) { setFriendStatusLoading(false); return; }
    (async () => {
      try {
        const db = await getFirebaseFirestore();
        const [sentSnap, receivedSnap, friendSnap] = await Promise.all([
          getDocs(query(collection(db, 'friend_requests'), where('from', '==', user.uid), where('to', '==', viewedUid), where('status', '==', 'pending'))),
          getDocs(query(collection(db, 'friend_requests'), where('from', '==', viewedUid), where('to', '==', user.uid), where('status', '==', 'pending'))),
          getDocs(query(collection(db, 'resonance_friends'), where('users', 'array-contains', user.uid), where('status', '==', 'accepted'))),
        ]);
        const isFriend = friendSnap.docs.some(d => (d.data().users as string[]).includes(viewedUid));
        if (isFriend) { setFriendStatus('friends'); }
        else if (!sentSnap.empty) { setFriendStatus('pending_sent'); }
        else if (!receivedSnap.empty) { setFriendStatus('pending_received'); }
        else { setFriendStatus('none'); }
      } catch { /* offline */ }
      setFriendStatusLoading(false);
    })();
  }, [user?.uid, viewedUid, isOwnProfile]);

  // Load real Sangha from resonance_friends (only for own profile)
  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      try {
        const db = await getFirebaseFirestore();
        const q = query(
          collection(db, 'resonance_friends'),
          where('users', 'array-contains', user.uid),
          where('status', '==', 'accepted')
        );
        const snap = await getDocs(q);
        const friends: RealFriend[] = [];
        for (const friendDoc of snap.docs) {
          const data = friendDoc.data();
          const otherUid = (data.users as string[]).find((u: string) => u !== user.uid);
          if (!otherUid) continue;
          const uSnap = await getDoc(doc(db, 'onesutra_users', otherUid));
          if (uSnap.exists()) {
            const ud = uSnap.data();
            friends.push({ uid: otherUid, name: ud.name || 'Seeker', photoURL: ud.photoURL, online: ud.online, prakriti: ud.prakriti });
          }
        }
        setRealSangha(friends);
      } catch { /* offline */ }
    })();
  }, [user?.uid]);

  const displayName = profileDoc?.name || user?.name || 'Sadhaka';
  const handle = profileDoc?.handle || (displayName.toLowerCase().replace(/\s+/g, '') + '_onesutra');
  const photoURL = isOwnProfile ? (profileDoc?.photoURL || user?.photoURL) : profileDoc?.photoURL;
  const prakriti = profileDoc?.prakriti || 'Vata-Pitta';
  const connections = profileDoc?.vibeConnections ?? 0;
  const joinedLabel = profileDoc?.joinedDate || 'Feb 2025';
  const bio = (profileDoc as any)?.bio || '';

  const doshaInfo = prakriti?.includes('Pitta')
    ? { insight: 'Your Air-Fire constitution thrives with cooling foods, breathwork, and structured mornings.' }
    : prakriti?.includes('Kapha')
      ? { insight: 'Your Earth-Water nature shines with morning movement, warm spices, and sunlight.' }
      : { insight: 'Your Air-Ether nature needs grounding foods, warm oils, and consistent sleep.' };

  const sanghaToShow = realSangha.length > 0 ? realSangha.slice(0, 5) : [];

  if (authLoading && !profileDoc) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingWrap}>
          <div className={styles.loadingSpinner} />
          <span className={styles.loadingText}>Awakening profile…</span>
        </div>
      </div>
    );
  }

  // If no profile exists after loading, show error or empty state
  if (!authLoading && !profileDoc && !viewedUid) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingWrap}>
          <span className={styles.loadingText}>Profile not found.</span>
          <button onClick={() => router.back()} className={styles.headerBtn} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>

      {/* ════ AMBIENT AURA ORBS ════ */}
      <div className={styles.auraOrb1} />
      <div className={styles.auraOrb2} />
      <div className={styles.auraOrb3} />

      {/* ════════════════════════════════════════
          HEADER — PranaVerse · Aether Identity
      ════════════════════════════════════════ */}
      <header className={styles.header}>
        <button className={styles.headerBtn} onClick={() => router.back()} aria-label="Back">
          <ChevronLeft size={20} />
        </button>
        <div className={styles.headerCenter}>
          <span className={styles.headerBrand}>PranaVerse</span>
          <span className={styles.headerSub}>Aether Identity</span>
        </div>
        <div className={styles.headerRight}>
          {isOwnProfile && (
            <button className={styles.headerBtn} onClick={() => router.push('/profile/edit')} aria-label="Edit Profile">
              <Edit2 size={16} />
            </button>
          )}
          {isOwnProfile && (
            <button
              className={styles.headerBtn}
              aria-label="Sign Out"
              onClick={async () => {
                try {
                  const { getAuth, signOut } = await import('firebase/auth');
                  await signOut(getAuth());
                  router.push('/');
                } catch { /* offline */ }
              }}
              style={{ color: 'rgba(239,68,68,0.85)' }}
            >
              <LogOut size={16} />
            </button>
          )}
          <button className={styles.headerBtn} onClick={() => router.back()} aria-label="Close">
            <XIcon size={16} />
          </button>
        </div>
      </header>

      {/* ════════════════════════════════════════
          HERO — Vitality Ring + Identity (no animation delay = no blank gap)
      ════════════════════════════════════════ */}
      <section className={styles.heroSection}>
        <div className={styles.saffronAura} />
        <div className={styles.goldAuraPulse} />
        <div className={styles.energyAuraRing} />
        <div className={styles.energyAuraRing2} />
        <div className={styles.avatarRingWrap}>
          <div className={`${styles.particleOrb} ${styles.particleOrb1}`} />
          <div className={`${styles.particleOrb} ${styles.particleOrb2}`} />
          <div className={`${styles.particleOrb} ${styles.particleOrb3}`} />
          <div className={`${styles.particleOrb} ${styles.particleOrb4}`} />
          <div className={styles.vitalityRingAbsolute}>
            <VitalityRing score={wellnessScore} size={168} />
          </div>
          <div className={styles.avatarCircle}>
            {photoURL
              ? <img src={photoURL} alt={displayName} className={styles.avatarPhoto} />
              : <HumanAvatarSVG gender={gender} />}
          </div>
          <div className={styles.vitalityChip}>
            <Zap size={9} color="#000" />
            <span>{wellnessScore}</span>
          </div>
        </div>

        {/* ── Identity: visible immediately, NO animation delay ── */}
        <div className={styles.identitySection}>
          <h1 className={styles.userName}>{displayName}</h1>
          <span className={styles.userHandle}>@{handle}</span>
          {bio ? <p className={styles.userBio}>{bio}</p> : null}

          {/* Profession + Prakriti badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 6 }}>
            {profileDoc?.profession && (
              <span style={{ fontSize: '0.68rem', color: '#FCD34D', fontWeight: 700, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.22)', borderRadius: 99, padding: '3px 10px' }}>💼 {profileDoc.profession}</span>
            )}
            <span style={{ fontSize: '0.68rem', color: '#A78BFA', fontWeight: 700, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.26)', borderRadius: 99, padding: '3px 10px' }}>✦ {prakriti}</span>
          </div>

          {/* Lifestyle Tags */}
          <div className={styles.lifestyleTags}>
            {profileDoc?.lifestyleTags && profileDoc.lifestyleTags.length > 0
              ? profileDoc.lifestyleTags.slice(0, 3).map((tag, i) => (
                <span key={i} className={styles.lifestyleTag} style={{ background: 'rgba(52,211,153,0.12)', color: '#34D399', border: '1px solid rgba(52,211,153,0.22)' }}>{tag}</span>
              ))
              : (
                <>
                  <span className={styles.lifestyleTag} style={{ background: 'rgba(52,211,153,0.12)', color: '#34D399', border: '1px solid rgba(52,211,153,0.22)' }}>🌱 Holistic Living</span>
                  <span className={styles.lifestyleTag} style={{ background: 'rgba(245,158,11,0.10)', color: '#FBBF24', border: '1px solid rgba(245,158,11,0.22)' }}>🕊️ Conscious Seeker</span>
                </>
              )
            }
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          IDENTITY CARD — CTA + Stats only (no opacity animation delay)
      ════════════════════════════════════════ */}
      <motion.div
        className={styles.identityCard}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
      >

        {/* CTA Buttons */}
        <div className={styles.ctaRow}>
          {isOwnProfile ? (
            <>
              <button className={styles.ctaPrimary} onClick={() => setActiveView(activeView === 'metrics' ? 'main' : 'metrics')}>
                <Activity size={14} /> My Account
              </button>
              <button className={styles.ctaSecondary} onClick={() => router.push('/pranaverse')}>
                <Globe size={14} /> PranaVerse
              </button>
            </>
          ) : (
            <>
              {friendStatus === 'friends' ? (
                <motion.button whileTap={{ scale: 0.96 }} className={styles.ctaPrimary} style={{ background: 'linear-gradient(135deg,rgba(52,211,153,0.22),rgba(5,150,105,0.18))', border: '1px solid rgba(52,211,153,0.38)', color: '#34d399' }} onClick={() => router.push(`/pranaverse-chat?uid=${viewedUid}`)}>
                  <MessageCircle size={14} /> Message
                </motion.button>
              ) : friendStatus === 'pending_sent' ? (
                <motion.button className={styles.ctaSecondary} style={{ opacity: 0.7, cursor: 'default' }} disabled>
                  ⏳ Request Sent
                </motion.button>
              ) : friendStatus === 'pending_received' ? (
                <motion.button whileTap={{ scale: 0.96 }} className={styles.ctaPrimary} style={{ background: 'linear-gradient(135deg,rgba(52,211,153,0.22),rgba(5,150,105,0.18))', border: '1px solid rgba(52,211,153,0.38)', color: '#34d399' }} onClick={async () => {
                  // Accept friend request
                  try {
                    const db = await getFirebaseFirestore();
                    const snap = await getDocs(query(collection(db, 'friend_requests'), where('from', '==', viewedUid), where('to', '==', user!.uid), where('status', '==', 'pending')));
                    for (const d of snap.docs) { await addDoc(collection(db, 'resonance_friends'), { users: [user!.uid, viewedUid], status: 'accepted', createdAt: serverTimestamp() }); await addDoc(collection(db, 'notifications'), { userId: viewedUid, type: 'friend_accepted', from: user!.uid, fromName: user?.name || 'Someone', message: `${user?.name || 'Someone'} accepted your friend request! 🎉`, read: false, createdAt: serverTimestamp() }); }
                    setFriendStatus('friends');
                  } catch { /* offline */ }
                }}>
                  ✅ Accept Friend
                </motion.button>
              ) : (
                <motion.button whileTap={{ scale: 0.96 }} className={styles.ctaPrimary} disabled={friendStatusLoading} onClick={() => { setBodhiMode('add_friend'); setShowBodhiEnquiry(true); }}>
                  <UserPlus size={14} /> Add Friend
                </motion.button>
              )}
            </>
          )}
        </div>

        {/* Stats Strip */}
        <div className={styles.statsStrip}>
          <div className={styles.statCell}>
            <span className={styles.statNumLabel}>{connections}</span>
            <span className={styles.statCellLabel}>Connections</span>
          </div>
          <div className={styles.statCell}>
            <span className={styles.statNumLabel}>{wellnessScore}</span>
            <span className={styles.statCellLabel}>Network Impact</span>
          </div>
          <div className={styles.statCell}>
            <span className={styles.statNumLabel} style={{ fontSize: '0.68rem' }}>🌿 Wellness</span>
            <span className={styles.statCellLabel}>Current Goal</span>
          </div>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════
          AETHER-GLASS DASHBOARD TILES
      ════════════════════════════════════════ */}
      <div className={styles.tilesSection}>
        <div className={styles.tilesSectionTitle}>
          <span className={styles.tilesDivider} />
          ✦ Aether Dashboard
          <span className={styles.tilesDivider} />
        </div>

        <div className={styles.tilesGrid}>

          {/* ── TILE A: Professional & Social Identity ── */}
          <motion.div
            className={styles.glassTile}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.28 }}
          >
            <div className={styles.tileHeader}>
              <div className={styles.tileTitle}>
                <div className={styles.tileIconWrap} style={{ background: 'rgba(245,158,11,0.14)' }}>💼</div>
                <div>
                  <div>Identity & Craft</div>
                  <div className={styles.tileSub}>Profession · Relationships</div>
                </div>
              </div>
            </div>
            <div className={styles.tagChipsWrap}>
              {profileDoc?.profession
                ? profileDoc.profession.split(',').map((p: string) => p.trim()).filter(Boolean).map((p: string, i: number) => (
                  <span key={i} className={styles.tagChip} style={{ background: 'rgba(245,158,11,0.10)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.18)' }}>💼 {p}</span>
                ))
                : <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)', fontFamily: "'Outfit',sans-serif" }}>{isOwnProfile ? 'Add your profession in edit profile' : 'No profession listed'}</span>
              }
            </div>
            {profileDoc?.socialTags && profileDoc.socialTags.length > 0 ? (
              <div style={{ marginTop: 8 }} className={styles.tagChipsWrap}>
                {profileDoc.socialTags.slice(0, 4).map((tag: string, i: number) => (
                  <span key={i} className={styles.tagChip} style={{ background: 'rgba(52,211,153,0.10)', color: '#6EE7B7', border: '1px solid rgba(52,211,153,0.18)' }}>#{tag}</span>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 8 }} className={styles.tagChipsWrap}>
                <span className={styles.tagChip} style={{ background: 'rgba(52,211,153,0.10)', color: '#6EE7B7', border: '1px solid rgba(52,211,153,0.18)' }}>#CommunityBuilder</span>
              </div>
            )}
          </motion.div>

          {/* ── TILE B: Rituals (Hobbies & Interests) ── */}
          <motion.div
            className={styles.glassTile}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.34 }}
          >
            <div className={styles.tileHeader}>
              <div className={styles.tileTitle}>
                <div className={styles.tileIconWrap} style={{ background: 'rgba(167,139,250,0.14)' }}>✨</div>
                <div>
                  <div>{isOwnProfile ? 'My Rituals' : `${displayName}'s Rituals`}</div>
                  <div className={styles.tileSub}>Hobbies & Interests</div>
                </div>
              </div>
              {isOwnProfile && (
                <button className={styles.tileEditBtn} onClick={() => router.push('/profile/edit')}>
                  <Edit2 size={11} />
                </button>
              )}
            </div>
            <div className={styles.ritualGrid}>
              {profileDoc?.hobbies && profileDoc.hobbies.length > 0
                ? profileDoc.hobbies.slice(0, 6).map((h: string, i: number) => {
                  const hobbyIcons: Record<string, string> = { 'Yoga': '🧘', 'Cooking': '🍳', 'Photography': '📸', 'Sacred Sounds': '🎵', 'Vedic Study': '📖', 'Pranayama': '🌿', 'Running': '🏃', 'Journaling': '✍️', 'Art & Design': '🎨', 'Gardening': '🌱', 'Trekking': '🏔️', 'Reading': '📚', 'Singing': '🎤', 'Meditation': '🧘', 'Swimming': '🌊', 'Archery': '🎯' };
                  return (
                    <div key={i} className={styles.ritualItem}>
                      <span className={styles.ritualIcon}>{hobbyIcons[h] || '🌟'}</span>
                      <span className={styles.ritualLabel}>{h}</span>
                    </div>
                  );
                })
                : isOwnProfile
                  ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '0.8rem 0', color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem', fontFamily: "'Outfit',sans-serif" }}>
                      No rituals yet — <button onClick={() => router.push('/profile/edit')} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', fontSize: '0.68rem', textDecoration: 'underline' }}>add yours</button>
                    </div>
                  ) : (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '0.8rem 0', color: 'rgba(255,255,255,0.28)', fontSize: '0.68rem', fontFamily: "'Outfit',sans-serif" }}>
                      {displayName} hasn't shared rituals yet 🙏
                    </div>
                  )
              }
            </div>
          </motion.div>

          {/* ── TILE B2: Pranic Intelligence — Ayurvedic blueprint (public, all profiles) ── */}
          <motion.div
            className={`${styles.glassTile} ${styles.glassTileWide}`}
            style={{ borderColor: 'rgba(167,139,250,0.20)' }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.37 }}
          >
            <div className={styles.tileHeader}>
              <div className={styles.tileTitle}>
                <div className={styles.tileIconWrap} style={{ background: 'rgba(167,139,250,0.16)' }}>🪬</div>
                <div>
                  <div>Pranic Intelligence</div>
                  <div className={styles.tileSub}>Ayurvedic Blueprint · {prakriti}</div>
                </div>
              </div>
            </div>

            {/* Dosha badges */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {[
                { label: 'Vata 🌬️', desc: 'Air & Ether — Movement & Creativity', color: '#60A5FA', active: prakriti.includes('Vata') },
                { label: 'Pitta 🔥', desc: 'Fire & Water — Transformation & Clarity', color: '#F59E0B', active: prakriti.includes('Pitta') },
                { label: 'Kapha 🌊', desc: 'Earth & Water — Stability & Nourishment', color: '#34D399', active: prakriti.includes('Kapha') },
              ].map(d => (
                <span key={d.label} style={{
                  fontSize: '0.62rem', fontWeight: d.active ? 700 : 400,
                  color: d.active ? d.color : 'rgba(255,255,255,0.28)',
                  background: d.active ? `rgba(${d.color === '#60A5FA' ? '96,165,250' : d.color === '#F59E0B' ? '245,158,11' : '52,211,153'},0.12)` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${d.active ? d.color + '44' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 99, padding: '3px 9px', fontFamily: "'Outfit',sans-serif",
                }}>{d.label}</span>
              ))}
            </div>

            {/* Pranic vitals: Agni, Ojas, Tejas, Sattva */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', marginBottom: 10 }}>
              {[
                { label: 'Agni', icon: '🔥', desc: 'Digestive Fire', val: 76, color: '#F59E0B' },
                { label: 'Ojas', icon: '💎', desc: 'Vital Essence', val: 72, color: '#14B8A6' },
                { label: 'Tejas', icon: '✨', desc: 'Radiant Intelligence', val: 80, color: '#FCD34D' },
                { label: 'Sattva', icon: '🕊️', desc: 'Mental Clarity', val: 83, color: '#A78BFA' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.60rem', color: item.color, fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>{item.icon} {item.label} <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>· {item.desc}</span></span>
                    <span style={{ fontSize: '0.58rem', color: item.color, fontWeight: 700 }}>{item.val}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                    <motion.div style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg,${item.color}60,${item.color})`, boxShadow: `0 0 6px ${item.color}55` }}
                      initial={{ width: '0%' }} animate={{ width: `${item.val}%` }} transition={{ duration: 1.1, ease: 'easeOut', delay: 0.5 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Guna balance + Chakra alignment */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 120, padding: '7px 10px', background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.14)', borderRadius: 12 }}>
                <div style={{ fontSize: '0.55rem', color: '#A78BFA', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 5, fontFamily: "'Outfit',sans-serif" }}>GUNA BALANCE</div>
                {[
                  { label: 'Sattva ✨', val: 65, color: '#A78BFA' },
                  { label: 'Rajas ⚡', val: 22, color: '#F59E0B' },
                  { label: 'Tamas 🌑', val: 13, color: '#60A5FA' },
                ].map(g => (
                  <div key={g.label} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                    <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.45)', width: 60, fontFamily: "'Outfit',sans-serif" }}>{g.label}</span>
                    <div style={{ flex: 1, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.07)' }}>
                      <motion.div style={{ height: '100%', borderRadius: 99, background: g.color }}
                        initial={{ width: '0%' }} animate={{ width: `${g.val}%` }} transition={{ duration: 1, delay: 0.6 }} />
                    </div>
                    <span style={{ fontSize: '0.50rem', color: g.color, fontWeight: 700 }}>{g.val}%</span>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, minWidth: 120, padding: '7px 10px', background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.14)', borderRadius: 12 }}>
                <div style={{ fontSize: '0.55rem', color: '#60A5FA', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 5, fontFamily: "'Outfit',sans-serif" }}>CHAKRA ALIGNMENT</div>
                {[
                  { label: 'Sahasrara 👑', color: '#A78BFA' },
                  { label: 'Ajna 👁️', color: '#818CF8' },
                  { label: 'Vishuddha 🗣️', color: '#22D3EE' },
                  { label: 'Anahata 💚', color: '#34D399' },
                  { label: 'Manipura ☀️', color: '#FBBF24' },
                ].map((c, i) => (
                  <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.color, boxShadow: `0 0 5px ${c.color}88`, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.45)', fontFamily: "'Outfit',sans-serif" }}>{c.label}</span>
                    {i < 2 && <span style={{ fontSize: '0.46rem', color: c.color, marginLeft: 'auto', fontWeight: 700 }}>Active</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Prakriti insight */}
            <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, fontSize: '0.60rem', color: 'rgba(255,255,255,0.50)', fontStyle: 'italic', fontFamily: "'Outfit',sans-serif", lineHeight: 1.55 }}>
              ✦ {doshaInfo.insight}
            </div>
          </motion.div>

          {/* ── TILE C: Recent Community Activities (full-width) ── */}
          <motion.div
            className={`${styles.glassTile} ${styles.glassTileWide}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.40 }}
          >
            <div className={styles.tileHeader}>
              <div className={styles.tileTitle}>
                <div className={styles.tileIconWrap} style={{ background: 'rgba(52,211,153,0.12)' }}>⚡</div>
                <div>
                  <div>Community Activities</div>
                  <div className={styles.tileSub}>Recent Prana engagement</div>
                </div>
              </div>
            </div>
            <div className={styles.activityFeed}>
              {[
                { icon: '🕉️', bg: 'rgba(167,139,250,0.14)', text: 'Completed 7-day Pranayama challenge', time: '2h ago' },
                { icon: '💬', bg: 'rgba(52,211,153,0.12)', text: 'Shared insight in PranaVerse community', time: '5h ago' },
                { icon: '⭐', bg: 'rgba(245,158,11,0.12)', text: 'Received Seeker of the Week recognition', time: '1d ago' },
                { icon: '🌱', bg: 'rgba(96,165,250,0.10)', text: 'Joined Holistic Living Sangha circle', time: '2d ago' },
              ].map((a, i) => (
                <div key={i} className={styles.activityItem}>
                  <div className={styles.activityDot} style={{ background: a.bg }}>{a.icon}</div>
                  <div style={{ flex: 1 }}>
                    <span className={styles.activityText}>{a.text}</span>
                    <span className={styles.activityTime}>{a.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── TILE D: Inner Mirror — Private Vitals (own profile) ── */}
          {isOwnProfile && (
            <motion.div
              className={styles.glassTile}
              style={{ borderColor: 'rgba(129,140,248,0.18)' }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.46 }}
            >
              <div className={styles.tileHeader}>
                <div className={styles.tileTitle}>
                  <div className={styles.tileIconWrap} style={{ background: 'rgba(129,140,248,0.14)' }}>🔮</div>
                  <div>
                    <div>Inner Mirror</div>
                    <div className={styles.tileSub}>Private Vitals</div>
                  </div>
                </div>
                <span className={styles.privateBadge}><Lock size={8} /> Private</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.42)' }}>🌙 Sleep · Last night</span>
                  <span className={styles.sleepBadge}>7h 22m</span>
                </div>
                <div className={styles.sleepWaveContainer}><SleepWaveSVG /></div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.42)' }}>😊 Mood · 7 Days</span>
                  <span className={styles.moodTrend}><TrendingUp size={9} /> +18%</span>
                </div>
                <div className={styles.moodChartContainer}><MoodFlowChart /></div>
              </div>
            </motion.div>
          )}

          {/* ── TILE E: Ayurvedic Blueprint — Private (own profile) ── */}
          {isOwnProfile && (
            <motion.div
              className={styles.glassTile}
              style={{ borderColor: 'rgba(245,158,11,0.18)' }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.52 }}
            >
              <div className={styles.tileHeader}>
                <div className={styles.tileTitle}>
                  <div className={styles.tileIconWrap} style={{ background: 'rgba(245,158,11,0.14)' }}>🌸</div>
                  <div>
                    <div>Ayurvedic Blueprint</div>
                    <div className={styles.tileSub}>{prakriti} · Pranic Intelligence</div>
                  </div>
                </div>
                <span className={styles.privateBadge}><Lock size={8} /> Private</span>
              </div>
              <div className={styles.radarWrap}>
                <AyurvedicRadarChart prakriti={prakriti} />
              </div>
              <div className={styles.metricsInsight}>{doshaInfo.insight}</div>
              {/* Dosha percentage breakdown */}
              {(() => {
                const vata = prakriti.includes('Vata') ? (prakriti === 'Vata' ? 60 : prakriti === 'Tri-Dosha' ? 33 : 42) : (prakriti.includes('Pitta') ? 18 : 20);
                const pitta = prakriti.includes('Pitta') ? (prakriti === 'Pitta' ? 60 : prakriti === 'Tri-Dosha' ? 33 : 42) : 20;
                const kapha = 100 - vata - pitta;
                return (
                  <>
                    <div className={styles.doshaBars} style={{ margin: '8px 0 2px' }}>
                      <motion.div className={styles.doshaBarVata} initial={{ width: 0 }} animate={{ width: `${vata}%` }} transition={{ duration: 1.2, delay: 0.4 }} />
                      <motion.div className={styles.doshaBarPitta} initial={{ width: 0 }} animate={{ width: `${pitta}%` }} transition={{ duration: 1.2, delay: 0.55 }} />
                      <motion.div className={styles.doshaBarKapha} initial={{ width: 0 }} animate={{ width: `${kapha}%` }} transition={{ duration: 1.2, delay: 0.7 }} />
                    </div>
                    <div className={styles.doshaBarLabels}>
                      <span className={styles.doshaBarLabel} style={{ color: '#60A5FA' }}>Vata {vata}%</span>
                      <span className={styles.doshaBarLabel} style={{ color: '#F59E0B' }}>Pitta {pitta}%</span>
                      <span className={styles.doshaBarLabel} style={{ color: '#34D399' }}>Kapha {kapha}%</span>
                    </div>
                  </>
                );
              })()}
              {[
                { label: 'Agni 🔥', value: 78, color: '#F59E0B' },
                { label: 'Ojas 💎', value: 75, color: '#14B8A6' },
                { label: 'Sattva ✨', value: 82, color: '#A78BFA' },
              ].map((item) => (
                <div key={item.label} className={styles.scoreBarRow}>
                  <span className={styles.scoreBarLabel}>{item.label}</span>
                  <div className={styles.scoreBarTrack}>
                    <motion.div
                      className={styles.scoreBarFill}
                      style={{ background: `linear-gradient(90deg,${item.color}80,${item.color})`, boxShadow: `0 0 6px ${item.color}55` }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 1.1, ease: 'easeOut', delay: 0.5 }}
                    />
                  </div>
                  <span className={styles.scoreBarValue}>{item.value}</span>
                </div>
              ))}
            </motion.div>
          )}

        </div>
      </div>

      {/* ════════════════════════════════════════
          EXPANDED METRICS PANEL (My Account view)
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {isOwnProfile && activeView === 'metrics' && (
          <motion.div
            className={styles.metricsPanel}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <div className={styles.privacyBadge}>
              <Lock size={10} />
              Private · Only you can see this
            </div>
            <div className={styles.metricsCard}>
              <div className={styles.metricsCardHeader}>
                <span className={styles.metricsCardIcon}>⚡</span>
                <div>
                  <div className={styles.metricsCardTitle}>Ayurvedic Intelligence</div>
                  <div className={styles.metricsCardSub}>Biological rhythm · {prakriti}</div>
                </div>
              </div>
              <div className={styles.radarWrap}>
                <AyurvedicRadarChart prakriti={prakriti} />
              </div>
              <div className={styles.metricsInsight}>{doshaInfo.insight}</div>
              {[
                { label: 'Agni 🔥', value: 78, color: '#F59E0B' },
                { label: 'Sattva ✨', value: 82, color: '#A78BFA' },
                { label: 'Ojas 💎', value: 75, color: '#14B8A6' },
                { label: 'Nidra 🌙', value: 65, color: '#60A5FA' },
              ].map((item) => (
                <div key={item.label} className={styles.scoreBarRow}>
                  <span className={styles.scoreBarLabel}>{item.label}</span>
                  <div className={styles.scoreBarTrack}>
                    <motion.div
                      className={styles.scoreBarFill}
                      style={{ background: `linear-gradient(90deg,${item.color}80,${item.color})`, boxShadow: `0 0 6px ${item.color}55` }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 1.1, ease: 'easeOut', delay: 0.3 }}
                    />
                  </div>
                  <span className={styles.scoreBarValue}>{item.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.metricsCard}>
              <div className={styles.metricsCardHeader}>
                <span className={styles.metricsCardIcon}>📈</span>
                <div>
                  <div className={styles.metricsCardTitle}>Mood Flow · 7 Days</div>
                  <div className={styles.metricsCardSub}>Emotional wellness trend</div>
                </div>
                <span className={styles.moodTrend}><TrendingUp size={10} /> +18%</span>
              </div>
              <div className={styles.moodChartContainer}><MoodFlowChart /></div>
            </div>
            <div className={styles.metricsCard} style={{ borderColor: 'rgba(129,140,248,0.2)' }}>
              <div className={styles.metricsCardHeader}>
                <span className={styles.metricsCardIcon}>🌙</span>
                <div>
                  <div className={styles.metricsCardTitle}>Sleep &amp; Recovery</div>
                  <div className={styles.metricsCardSub}>Last night · 7h 22m</div>
                </div>
                <span className={styles.sleepBadge}>Good</span>
              </div>
              <div className={styles.sleepWaveContainer}><SleepWaveSVG /></div>
              <div className={styles.sleepMetrics}>
                {[{ v: '28%', l: 'Deep Sleep' }, { v: '84', l: 'Rest Score' }, { v: '22%', l: 'REM' }, { v: '11:04', l: 'Lights Out' }].map((s) => (
                  <div key={s.l} className={styles.sleepMetric}>
                    <span className={styles.sleepMetricValue}>{s.v}</span>
                    <span className={styles.sleepMetricLabel}>{s.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════
          VITALITY REPLAY
      ════════════════════════════════════════ */}
      <motion.div
        className={styles.replayCard}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.58 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className={styles.replayLeft}>
          <div className={styles.replayIconWrap}>
            <Repeat2 size={18} color="#F59E0B" />
          </div>
          <div className={styles.replayInfo}>
            <span className={styles.replayTitle}>Vitality Replay</span>
            <span className={styles.replaySub}>{isOwnProfile ? 'See how many seekers engaged with your wellness posts' : `See ${displayName}'s wellness journey highlights`}</span>
          </div>
        </div>
        <span className={styles.replayArrow}>›</span>
      </motion.div>

      {/* ════════════════════════════════════════
          BODHI AI COMPANION CARD
      ════════════════════════════════════════ */}
      <motion.div
        className={styles.bodhiCard}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.62 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => { if (isOwnProfile) { router.push('/acharya-samvad'); } else { setBodhiMode('enquiry'); setShowBodhiEnquiry(true); } }}
      >
        <div className={styles.bodhiLeft}>
          <div className={styles.bodhiIconWrap}>
            <Bot size={18} color="#A78BFA" />
          </div>
          <div className={styles.bodhiInfo}>
            <span className={styles.bodhiTitle}>{isOwnProfile ? 'Sakha Bodhi' : `Ask Bodhi about ${displayName}`}</span>
            <span className={styles.bodhiSub}>{isOwnProfile ? 'Your AI companion for daily life management' : 'Get AI insights about this seeker\'s journey ✦'}</span>
          </div>
        </div>
        <span className={styles.bodhiActive}>{isOwnProfile ? 'Active' : '✦ Ask'}</span>
      </motion.div>

      {/* ════════════════════════════════════════
          POST TO — Channels (own profile only)
      ════════════════════════════════════════ */}
      {isOwnProfile && (
        <motion.div
          className={styles.sectionBlock}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.66 }}
        >
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Post to…</span>
            <button className={styles.newPostBtn} onClick={() => router.push('/pranaverse')}>
              <PlusCircle size={14} />
              New Post
            </button>
          </div>
          <div className={styles.channelList}>
            <PostChannelRow
              icon={<Sparkles size={16} color="#F59E0B" />}
              iconBg="rgba(245,158,11,0.15)"
              title="PranaVerse"
              subtitle="Reach all seekers on OneSUTRA!"
              badge="High Prana"
              badgeColor="#F59E0B"
              accent="#F59E0B"
            />
            <PostChannelRow
              icon={<Users size={16} color="#14B8A6" />}
              iconBg="rgba(20,184,166,0.14)"
              title="My Circle"
              subtitle="Just for your connections"
              accent="#14B8A6"
            />
            <PostChannelRow
              icon={<Globe size={16} color="#A78BFA" />}
              iconBg="rgba(167,139,250,0.14)"
              title="My Circle · Public"
              subtitle="Connections, followers and everyone"
              accent="#A78BFA"
            />
          </div>
        </motion.div>
      )}

      {/* ════════════════════════════════════════
          MY SANGHA — Real friends from Firebase
      ════════════════════════════════════════ */}
      <motion.div
        className={styles.sectionBlock}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.70 }}
      >
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>{isOwnProfile ? 'My Sangha' : `${displayName}'s Circle`}</span>
          {isOwnProfile && (
            <button className={styles.addSanghaBtn} style={{ maxWidth: '65%', whiteSpace: 'normal', textAlign: 'left', lineHeight: 1.25, padding: '0.4rem 0.7rem' }} onClick={() => router.push('/pranaverse-chat')}>
              <UserPlus size={13} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.52rem' }}>🚀 Social media is broken — we fix it. Invite your friends to PranaVerse, your complete Life Management System with healthy feeds, AI automation & real connections.</span>
            </button>
          )}
        </div>
        <div className={styles.sanghaList}>
          {sanghaToShow.length > 0 ? (
            sanghaToShow.map((f, i) => (
              <SanghaItem
                key={f.uid}
                photoURL={f.photoURL}
                name={f.name}
                tag={SANGHA_TAGS[i % SANGHA_TAGS.length]}
                accent={SANGHA_ACCENTS[i % SANGHA_ACCENTS.length]}
                online={f.online}
                onClick={() => router.push(`/profile/${f.uid}`)}
              />
            ))
          ) : (
            <div style={{ padding: '1rem 0.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.28)', fontSize: '0.72rem', fontFamily: "'Outfit',sans-serif", lineHeight: 1.5 }}>
              {isOwnProfile ? 'No connections yet — start building your Sangha! 🙏' : 'This seeker\'s circle is private 🙏'}
            </div>
          )}
        </div>
        <button className={styles.viewAllBtn} onClick={() => router.push('/pranaverse-chat')}>
          {isOwnProfile ? 'View all connections →' : 'Connect in PranaVerse →'}
        </button>
      </motion.div>

      {/* ════════════════════════════════════════
          LIFESTYLE & VIBES — Habit Chips
      ════════════════════════════════════════ */}
      <motion.div
        className={styles.sectionBlock}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.74 }}
      >
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Lifestyle &amp; Vibes</span>
          {isOwnProfile && (
            <button className={styles.newPostBtn} onClick={() => router.push('/profile/edit')}>
              <Edit2 size={11} /> Edit
            </button>
          )}
        </div>
        <div className={styles.habitsGrid}>
          {(() => {
            const CHIP_PALETTE = [
              { bg: 'rgba(251,146,60,0.12)', color: '#FB923C', border: 'rgba(251,146,60,0.22)' },
              { bg: 'rgba(52,211,153,0.10)', color: '#34D399', border: 'rgba(52,211,153,0.20)' },
              { bg: 'rgba(245,158,11,0.10)', color: '#FCD34D', border: 'rgba(245,158,11,0.20)' },
              { bg: 'rgba(167,139,250,0.10)', color: '#A78BFA', border: 'rgba(167,139,250,0.20)' },
              { bg: 'rgba(96,165,250,0.10)', color: '#60A5FA', border: 'rgba(96,165,250,0.20)' },
              { bg: 'rgba(6,182,212,0.10)', color: '#22D3EE', border: 'rgba(6,182,212,0.20)' },
              { bg: 'rgba(244,114,182,0.10)', color: '#F472B6', border: 'rgba(244,114,182,0.20)' },
              { bg: 'rgba(239,68,68,0.10)', color: '#F87171', border: 'rgba(239,68,68,0.20)' },
              { bg: 'rgba(234,179,8,0.10)', color: '#EAB308', border: 'rgba(234,179,8,0.20)' },
              { bg: 'rgba(180,83,9,0.15)', color: '#D97706', border: 'rgba(180,83,9,0.20)' },
            ];
            const combined: string[] = [
              ...(profileDoc?.lifestyleTags || []),
              ...(profileDoc?.hobbies || []),
            ];
            const tags = combined.length > 0 ? combined.slice(0, 10) : [
              '#Mindfulness', '#PlantBased', '#EarlyRiser', '#Pranayama',
              '#Ayurveda', '#Meditation', '#VedicStudy', '#MorningRitual',
            ];
            return tags.map((label, i) => {
              const p = CHIP_PALETTE[i % CHIP_PALETTE.length];
              return (
                <span key={i} className={styles.habitChip} style={{ background: p.bg, color: p.color, border: `1px solid ${p.border}` }}>
                  {label.startsWith('#') ? label : `#${label.replace(/\s+/g, '')}`}
                </span>
              );
            });
          })()}
        </div>
      </motion.div>

      {/* ════════════════════════════════════════
          INTEGRATIONS — own profile only (private)
      ════════════════════════════════════════ */}
      {isOwnProfile && <IntegrationsSection />}

      {/* ════════════════════════════════════════
          INVITE CARD — show on own profile to drive viral growth
      ════════════════════════════════════════ */}
      {isOwnProfile && (
        <InviteCard
          userName={user?.name}
          style={{ margin: '0 0 0.5rem' }}
        />
      )}

      {/* ════════════════════════════════════════
          BOTTOM NAV
      ════════════════════════════════════════ */}
      <nav className={styles.bottomNav}>
        <button className={styles.navItem} onClick={() => router.push('/')}>
          <Home size={20} />
          <span>Home</span>
        </button>
        <button className={styles.navItem} onClick={() => router.push('/pranaverse')}>
          <Globe size={20} />
          <span>Discover</span>
        </button>
        <button className={`${styles.navItem} ${styles.navItemActive}`}>
          <User size={20} />
          <span>Profile</span>
        </button>
        <button className={styles.navItem} onClick={() => router.push('/profile?settings=1')}>
          <Settings size={20} />
          <span>Settings</span>
        </button>
      </nav>

      {/* ════════════════════════════════════════
          BODHI ENQUIRY MODAL
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {showBodhiEnquiry && (
          <BodhiEnquiryModal
            key="bodhi-enquiry"
            targetName={displayName}
            targetProfile={profileDoc}
            targetUid={viewedUid}
            senderUid={user?.uid}
            senderName={user?.name}
            mode={bodhiMode}
            onClose={() => { setShowBodhiEnquiry(false); setBodhiMode('enquiry'); }}
            onFriendRequestSent={() => setFriendStatus('pending_sent')}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
