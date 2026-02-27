'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/* ─── Web Audio (shared singletons) ─────────────────────────────────────── */
let SHARED_ACTX: AudioContext | null = null;
const CONNECTED_SPD = new WeakSet<HTMLAudioElement>();
const ANALYSER_MAP_SPD = new WeakMap<HTMLAudioElement, AnalyserNode>();

/* ─── Time helpers ───────────────────────────────────────────────────────── */
function getHourFraction() {
    const now = new Date();
    return now.getHours() + now.getMinutes() / 60;
}

// Returns {r,g,b} triplets defining the sky gradient for current hour
function getSkyColors(hf: number) {
    if (hf >= 4 && hf < 6) {
        // Brahma Muhurta — deep indigo to purple dawn
        return {
            top: [0.02, 0.01, 0.08],
            mid: [0.10, 0.04, 0.22],
            hor: [0.28, 0.10, 0.30],
            waterTop: [0.06, 0.03, 0.14],
        };
    } else if (hf >= 6 && hf < 8) {
        // Sunrise — orange blaze
        return {
            top: [0.04, 0.05, 0.25],
            mid: [0.45, 0.18, 0.06],
            hor: [0.90, 0.45, 0.12],
            waterTop: [0.30, 0.12, 0.05],
        };
    } else if (hf >= 8 && hf < 12) {
        // Morning — warm blue
        return {
            top: [0.10, 0.25, 0.72],
            mid: [0.22, 0.48, 0.85],
            hor: [0.55, 0.72, 0.95],
            waterTop: [0.08, 0.20, 0.55],
        };
    } else if (hf >= 12 && hf < 15) {
        // Noon — bright azure
        return {
            top: [0.05, 0.20, 0.80],
            mid: [0.18, 0.45, 0.92],
            hor: [0.45, 0.68, 0.98],
            waterTop: [0.04, 0.18, 0.62],
        };
    } else if (hf >= 15 && hf < 17.5) {
        // Afternoon — golden blue
        return {
            top: [0.08, 0.18, 0.65],
            mid: [0.32, 0.40, 0.70],
            hor: [0.75, 0.52, 0.28],
            waterTop: [0.15, 0.12, 0.08],
        };
    } else if (hf >= 17.5 && hf < 19.5) {
        // Dusk — magenta/amber
        return {
            top: [0.08, 0.02, 0.24],
            mid: [0.48, 0.10, 0.28],
            hor: [0.88, 0.38, 0.10],
            waterTop: [0.22, 0.06, 0.10],
        };
    } else {
        // Night — deep midnight
        return {
            top: [0.020, 0.044, 0.079],
            mid: [0.040, 0.067, 0.157],
            hor: [0.055, 0.088, 0.200],
            waterTop: [0.02, 0.05, 0.14],
        };
    }
}

// Sun position: normalized x (0=E, 1=W) and height (0=horizon, 1=zenith)
function getSunPosition(hf: number): { nx: number; ny: number; visible: boolean } {
    if (hf < 5.5 || hf >= 19.5) return { nx: 0.5, ny: -0.1, visible: false };
    const nx = (hf - 5.5) / 14; // 0 at 5:30am, 1 at 7:30pm
    const ny = Math.sin(nx * Math.PI) * 0.92; // arc peak at noon
    return { nx, ny, visible: true };
}

/* ─── Shaders ────────────────────────────────────────────────────────────── */

// Sky gradient — uses 3 uniforms: top/mid/hor colors
const SKY_VERT = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
`;
const SKY_FRAG = `
  uniform vec3 uColorTop;
  uniform vec3 uColorMid;
  uniform vec3 uColorHor;
  uniform float uTime;
  uniform float uBass;
  varying vec2 vUv;
  void main() {
    float t = vUv.y;
    vec3 c = mix(uColorHor, mix(uColorMid, uColorTop, smoothstep(0.35,1.0,t)), smoothstep(0.0,0.40,t));
    // subtle aurora shimmer at night (low t = dark = night colors)
    float isNight = 1.0 - smoothstep(0.04,0.15, uColorTop.b - uColorTop.r);
    float aurora = sin(vUv.x * 5.0 + uTime * 0.12) * 0.5 + 0.5;
    aurora *= smoothstep(0.55, 0.75, t) * 0.025 * isNight * (1.0 + uBass);
    c += vec3(0.1, 0.25, 0.5) * aurora;
    gl_FragColor = vec4(c, 1.0);
  }
`;

// Realistic procedural Sun — bright disc with multiple glow layers + rays
const SUN_VERT = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const SUN_FRAG = `
  uniform float uTime;
  uniform float uEnergy;
  uniform vec3 uInnerColor;
  uniform vec3 uOuterColor;
  uniform float uHour;
  varying vec2 vUv;

  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 c = vUv - 0.5;
    float d = length(c);

    // Hard disc
    float disc = 1.0 - smoothstep(0.22, 0.26, d);

    // Limb darkening (edge is darker = photorealistic)
    float limb = 1.0 - pow(clamp(d / 0.24, 0.0, 1.0), 0.45);

    // Convection cell texture on disc
    float tx = sin(c.x * 80.0 + uTime * 0.3) * sin(c.y * 60.0 + uTime * 0.25) * 0.04;

    // Inner corona / chromosphere (tight ring just outside disc)
    float corona1 = smoothstep(0.38, 0.24, d) * smoothstep(0.22, 0.28, d) * 1.8;

    // Outer diffuse halo
    float halo = exp(-d * 6.5) * (0.55 + uEnergy * 0.35);

    // Solar rays (thin streak bloom)
    float rayCount = 12.0;
    float rayAngle = atan(c.y, c.x);
    float ray = max(0.0, sin(rayAngle * rayCount + uTime * 0.5));
    ray *= ray; // sharpen
    float rayFade = max(0.0, 1.0 - d * 4.2); // only beyond disc
    ray *= rayFade * smoothstep(0.24, 0.44, d) * (0.22 + uEnergy * 0.28);

    vec3 discColor = mix(uOuterColor, uInnerColor, limb) + limb * tx;
    vec3 glowColor = uOuterColor * halo;
    vec3 rayColor = mix(uOuterColor, vec3(1.0, 0.98, 0.88), 0.5) * ray;
    vec3 coronaColor = mix(uOuterColor, vec3(1.0), corona1 * 0.8);

    vec3 col = discColor * disc + glowColor + rayColor + coronaColor * (1.0 - disc);

    // Alpha: disc is solid, glow fades
    float alpha = disc + halo * 0.85 + ray * 0.6 + corona1 * 0.7;
    alpha = clamp(alpha, 0.0, 1.0);

    gl_FragColor = vec4(col, alpha);
  }
`;

// Spandana water vertex shader with cymatic dampening
const WATER_VERT = `
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uAmplitude;
  varying vec2 vUv;
  varying float vDisplace;
  varying vec3 vWorldNormal;

  float spandana(vec2 pos, float amp, float k, float omega, float decay) {
    float r = length(pos);
    if (r < 0.001) return 0.0;
    return amp * sin(k * r - omega * uTime) * exp(-decay * r) * (1.0 - smoothstep(3.5, 7.0, r));
  }

  void main() {
    vUv = uv;
    vec3 pos = position;
    vec2 c = pos.xz;

    float amp = uAmplitude * (0.15 + uBass * 1.5 + uMid * 0.5);
    float d1 = spandana(c, amp, 3.8, 2.2, 0.18);
    float d2 = spandana(c, amp * 0.42, 6.18, 3.5, 0.24);
    float d3 = spandana(c, amp * 0.20, 10.5, 5.8, 0.30);
    float total = d1 + d2 + d3;
    pos.y += total;
    vDisplace = total;

    float eps = 0.06;
    float dx = spandana(c + vec2(eps,0.), amp, 3.8, 2.2, 0.18) - total;
    float dz = spandana(c + vec2(0.,eps), amp, 3.8, 2.2, 0.18) - total;
    vec3 n = normalize(vec3(-dx/eps, 1.0, -dz/eps));
    vWorldNormal = normalMatrix * n;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const WATER_FRAG = `
  uniform float uTime;
  uniform float uBass;
  uniform float uEnergy;
  uniform vec3 uDeepColor;
  uniform vec3 uSurfaceColor;
  uniform vec3 uReflectColor;
  uniform float uIsNight;
  varying vec2 vUv;
  varying float vDisplace;
  varying vec3 vWorldNormal;

  void main() {
    float nDotV = abs(dot(normalize(vWorldNormal), vec3(0.,1.,0.)));
    float fresnel = pow(1.0 - nDotV, 2.5);
    vec3 base = mix(uDeepColor, uSurfaceColor, fresnel * 0.6 + uBass * 0.12);

    // Moon/sun reflection column (centered, widening toward bottom)
    float reflX = 0.5 + sin(uTime * 0.15) * 0.015;
    float dist = abs(vUv.x - reflX);
    float stripW = 0.05 + (1.0 - vUv.y) * 0.10;
    float strip = smoothstep(stripW, 0.0, dist);
    float shimmer = 0.5 + 0.5 * sin(vUv.y * 50.0 - uTime * 3.0 + vDisplace * 10.0);
    strip *= shimmer;

    vec3 col = base + uReflectColor * strip * (0.32 + uBass * 0.22);

    // Crest glow
    float crest = max(0.0, vDisplace * 4.0);
    col += mix(vec3(0.3,0.5,0.95), vec3(0.9,0.6,0.3), 1.0 - uIsNight) * crest * uEnergy * 0.55;

    // Edge vignette
    float vign = smoothstep(0.0,0.3,vUv.x) * smoothstep(1.0,0.7,vUv.x);
    col = mix(uDeepColor * 0.2, col, vign * 0.9 + 0.1);

    gl_FragColor = vec4(col, 0.97);
  }
`;

// Star shaders
const STAR_VERT = `
  attribute float aSize;
  attribute float aPhase;
  uniform float uTime;
  uniform float uVisibility;
  varying float vAlpha;
  void main() {
    float twinkle = 0.42 + 0.58 * sin(uTime * 0.7 + aPhase);
    vAlpha = twinkle * uVisibility;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * twinkle * (220.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const STAR_FRAG = `
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.04, d) * vAlpha;
    gl_FragColor = vec4(0.98, 0.97, 0.94, alpha);
  }
`;

const STAR_COUNT = 2200;

function buildStarGeo() {
    const pos = new Float32Array(STAR_COUNT * 3);
    const sizes = new Float32Array(STAR_COUNT);
    const phases = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 0.6 + 0.05);
        const r = 78 + Math.random() * 18;
        pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = r * Math.cos(phi);
        pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        sizes[i] = 0.5 + Math.random() * 2.2;
        phases[i] = Math.random() * Math.PI * 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    return geo;
}

/* ─── Internal R3F Scene ─────────────────────────────────────────────────── */
interface SceneProps {
    audioRef: React.RefObject<HTMLAudioElement | null>;
    playing: boolean;
    accentColor: string;
}

function NightLakeScene({ audioRef, playing, accentColor }: SceneProps) {
    const { camera } = useThree();

    // Time-of-day snapshot (computed once per mount; stable during a session)
    const hf = useMemo(() => getHourFraction(), []);
    const skyColors = useMemo(() => getSkyColors(hf), [hf]);
    const sunPos = useMemo(() => getSunPosition(hf), [hf]);

    // Is it night-ish?
    const isNight = useMemo(() => hf < 5.5 || hf >= 19.5, [hf]);
    const isDawn = useMemo(() => hf >= 5.5 && hf < 7.5, [hf]);
    const isDusk = useMemo(() => hf >= 17.5 && hf < 19.5, [hf]);
    const starVisibility = useMemo(() => isNight ? 1 : isDawn || isDusk ? 0.45 : 0, [isNight, isDawn, isDusk]);

    // Camera angle
    useEffect(() => {
        (camera as THREE.PerspectiveCamera).fov = 55;
        (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
        camera.position.set(0, 3.2, 9);
        camera.lookAt(0, -0.5, -1);
    }, [camera]);

    // Audio
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataRef = useRef<Uint8Array<ArrayBuffer>>(new Uint8Array(1024) as Uint8Array<ArrayBuffer>);
    const smoothBass = useRef(0);
    const smoothMid = useRef(0);
    const smoothEnergy = useRef(0);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (CONNECTED_SPD.has(audio)) {
            const cached = ANALYSER_MAP_SPD.get(audio);
            if (cached) { analyserRef.current = cached; dataRef.current = new Uint8Array(cached.frequencyBinCount) as Uint8Array<ArrayBuffer>; }
            return;
        }
        try {
            if (!audio.crossOrigin) audio.crossOrigin = 'anonymous';
            if (!SHARED_ACTX) {
                SHARED_ACTX = new (window.AudioContext || (window as any).webkitAudioContext)();
                (window as any).__sharedActx = SHARED_ACTX;
            }
            const source = SHARED_ACTX.createMediaElementSource(audio);
            const an = SHARED_ACTX.createAnalyser();
            an.fftSize = 2048;
            an.smoothingTimeConstant = 0.95; // heavy smoothing = fluid Spandana ripples
            source.connect(an);
            an.connect(SHARED_ACTX.destination);
            analyserRef.current = an;
            dataRef.current = new Uint8Array(an.frequencyBinCount) as Uint8Array<ArrayBuffer>;
            CONNECTED_SPD.add(audio);
            ANALYSER_MAP_SPD.set(audio, an);
        } catch (e) {
            console.warn('[SpandanaLake] Web Audio:', e);
        }
    }, []); // eslint-disable-line

    useEffect(() => {
        if (playing && SHARED_ACTX?.state === 'suspended') SHARED_ACTX.resume().catch(() => { });
    }, [playing]);

    // Materials
    const skyMat = useMemo(() => new THREE.ShaderMaterial({
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
            uColorTop: { value: new THREE.Color(...(skyColors.top as [number, number, number])) },
            uColorMid: { value: new THREE.Color(...(skyColors.mid as [number, number, number])) },
            uColorHor: { value: new THREE.Color(...(skyColors.hor as [number, number, number])) },
            uTime: { value: 0 },
            uBass: { value: 0 },
        },
    }), [skyColors]);

    const starGeo = useMemo(() => buildStarGeo(), []);
    const starMat = useMemo(() => new THREE.ShaderMaterial({
        vertexShader: STAR_VERT,
        fragmentShader: STAR_FRAG,
        uniforms: { uTime: { value: 0 }, uVisibility: { value: starVisibility } },
        transparent: true,
        depthWrite: false,
    }), [starVisibility]);

    // Sun color based on hour
    const sunInnerColor = useMemo(() => {
        if (hf < 8 || (hf >= 17.5 && hf < 19)) return new THREE.Color(1.0, 0.88, 0.60); // sunrise/set: warm gold
        if (hf >= 11 && hf < 15) return new THREE.Color(1.0, 0.98, 0.92); // noon: white-gold
        return new THREE.Color(1.0, 0.94, 0.72); // general morning/afternoon
    }, [hf]);

    const sunOuterColor = useMemo(() => {
        if (hf < 8 || (hf >= 17.5 && hf < 19)) return new THREE.Color(0.95, 0.42, 0.08); // orange
        if (hf >= 11 && hf < 15) return new THREE.Color(1.0, 0.85, 0.30); // bright yellow
        return new THREE.Color(1.0, 0.70, 0.18); // amber
    }, [hf]);

    const sunMat = useMemo(() => new THREE.ShaderMaterial({
        vertexShader: SUN_VERT,
        fragmentShader: SUN_FRAG,
        uniforms: {
            uTime: { value: 0 },
            uEnergy: { value: 0 },
            uInnerColor: { value: sunInnerColor },
            uOuterColor: { value: sunOuterColor },
            uHour: { value: hf },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    }), [sunInnerColor, sunOuterColor, hf]);

    // Sun world position
    const sunWorldPos = useMemo(() => {
        if (!sunPos.visible) return null;
        // Map nx [0,1] across the sky X from -12 to +12
        // Map ny [0,1] up the sky Y from 0 to 20 (zenith)
        const x = (sunPos.nx - 0.5) * 24;
        const y = 2 + sunPos.ny * 18;
        const z = -40; // far back in sky
        return new THREE.Vector3(x, y, z);
    }, [sunPos]);

    // Sun size: larger at sunrise/set (closer to horizon = atmospheric magnification)
    const sunSize = useMemo(() => {
        if (!sunPos.visible) return 0;
        const base = sunPos.ny < 0.12 ? 6.0 : sunPos.ny > 0.75 ? 3.5 : 4.5;
        return base;
    }, [sunPos]);

    // Accent color for water surface highlight
    const accentVec = useMemo(() => {
        const h = accentColor.replace('#', '');
        const int = parseInt(h.length === 3 ? h.split('').map((c: string) => c + c).join('') : h, 16);
        return new THREE.Color(((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255);
    }, [accentColor]);

    // Reflect color: moon shimmer at night, sun shimmer during day
    const reflectColor = useMemo(() => isNight
        ? new THREE.Color(0.82, 0.78, 0.62)  // warm moon gold
        : new THREE.Color(sunOuterColor.r, sunOuterColor.g * 0.85, sunOuterColor.b * 0.4), // sun shimmer
        [isNight, sunOuterColor]);

    const waterMat = useMemo(() => new THREE.ShaderMaterial({
        vertexShader: WATER_VERT,
        fragmentShader: WATER_FRAG,
        uniforms: {
            uTime: { value: 0 },
            uBass: { value: 0 },
            uMid: { value: 0 },
            uEnergy: { value: 0 },
            uAmplitude: { value: 0.30 },
            uDeepColor: { value: new THREE.Color(...(skyColors.waterTop as [number, number, number])) },
            uSurfaceColor: { value: new THREE.Color(0.12, 0.22, 0.52) },
            uReflectColor: { value: reflectColor },
            uIsNight: { value: isNight ? 1.0 : 0.0 },
        },
        transparent: true,
    }), [skyColors, reflectColor, isNight]);

    // Refs for animation
    const skyRef = useRef<THREE.Mesh>(null);
    const starsRef = useRef<THREE.Points>(null);
    const sunRef = useRef<THREE.Mesh>(null);
    const waterRef = useRef<THREE.Mesh>(null);

    useFrame(({ clock }) => {
        const t = clock.elapsedTime;

        // Audio read
        let rawBass = 0, rawMid = 0;
        const an = analyserRef.current;
        if (an && playing) {
            an.getByteFrequencyData(dataRef.current);
            const L = dataRef.current.length;
            const bassEnd = Math.floor(L * 0.04);
            const midEnd = Math.floor(L * 0.22);
            let bs = 0, ms = 0;
            for (let i = 0; i < bassEnd; i++) bs += dataRef.current[i];
            for (let i = bassEnd; i < midEnd; i++) ms += dataRef.current[i];
            rawBass = bs / bassEnd / 255;
            rawMid = ms / (midEnd - bassEnd) / 255;
        } else {
            // Idle gentle ripple
            rawBass = 0.04 + 0.025 * Math.sin(t * 0.42);
            rawMid = 0.03 + 0.018 * Math.sin(t * 0.65 + 1.3);
        }

        // Heavy smoothing for fluid water
        smoothBass.current += (rawBass - smoothBass.current) * 0.06;
        smoothMid.current += (rawMid - smoothMid.current) * 0.05;
        smoothEnergy.current = smoothBass.current * 0.62 + smoothMid.current * 0.38;

        const b = smoothBass.current;
        const m = smoothMid.current;
        const e = smoothEnergy.current;

        // Sky
        if (skyRef.current) {
            const su = (skyRef.current.material as THREE.ShaderMaterial).uniforms;
            su.uTime.value = t;
            su.uBass.value = b;
        }
        // Stars twinkle
        if (starsRef.current) {
            const su = (starsRef.current.material as THREE.ShaderMaterial).uniforms;
            su.uTime.value = t;
        }
        // Sun pulse with energy
        if (sunRef.current) {
            const su = (sunRef.current.material as THREE.ShaderMaterial).uniforms;
            su.uTime.value = t;
            su.uEnergy.value = e;
            // Very subtle scale pulse — breathing
            const pulse = 1 + e * 0.06 + 0.015 * Math.sin(t * 0.8);
            sunRef.current.scale.setScalar(pulse);
        }
        // Water
        if (waterRef.current) {
            const wu = (waterRef.current.material as THREE.ShaderMaterial).uniforms;
            wu.uTime.value = t;
            wu.uBass.value = b;
            wu.uMid.value = m;
            wu.uEnergy.value = e;
        }
    });

    return (
        <>
            {/* Sky dome */}
            <mesh ref={skyRef}>
                <sphereGeometry args={[95, 32, 32]} />
                <primitive object={skyMat} attach="material" />
            </mesh>

            {/* Stars (visible at night / dusk / dawn) */}
            {starVisibility > 0 && (
                <points ref={starsRef} geometry={starGeo}>
                    <primitive object={starMat} attach="material" />
                </points>
            )}

            {/* Realistic Sun (daytime only) — billboard plane with shader */}
            {sunPos.visible && sunWorldPos && (
                <mesh ref={sunRef} position={sunWorldPos}>
                    <planeGeometry args={[sunSize, sunSize]} />
                    <primitive object={sunMat} attach="material" />
                </mesh>
            )}

            {/* Atmospheric horizon glow at sunrise/sunset */}
            {(hf >= 5.5 && hf < 8.5) || (hf >= 16.5 && hf < 20) ? (
                <mesh position={[sunWorldPos ? sunWorldPos.x : 0, -1, -30]} rotation={[-Math.PI / 2 + 0.25, 0, 0]}>
                    <planeGeometry args={[60, 20]} />
                    <meshBasicMaterial
                        color={hf < 10 ? new THREE.Color(0.85, 0.35, 0.05) : new THREE.Color(0.9, 0.28, 0.08)}
                        transparent
                        opacity={0.22}
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
            ) : null}

            {/* Water lake plane */}
            <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, -1]}>
                <planeGeometry args={[18, 18, 144, 144]} />
                <primitive object={waterMat} attach="material" />
            </mesh>

            {/* Subtle ambient + directional light */}
            <ambientLight intensity={isNight ? 0.03 : 0.08} color={isNight ? '#9ab0ff' : '#fff8e0'} />
            {sunPos.visible && sunWorldPos && (
                <directionalLight
                    position={sunWorldPos}
                    intensity={0.12 + smoothEnergy.current * 0.06}
                    color={hf < 9 || hf > 17 ? '#ffb060' : '#fff8d0'}
                />
            )}
        </>
    );
}

/* ─── Public export ──────────────────────────────────────────────────────── */
interface SpandanaLakeProps {
    audioRef: React.RefObject<HTMLAudioElement | null>;
    playing: boolean;
    accentColor?: string;
}

export default function SpandanaLake({ audioRef, playing, accentColor = '#88AAFF' }: SpandanaLakeProps) {
    return (
        <Canvas
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            gl={{ antialias: false, alpha: false, powerPreference: 'low-power' }}
            camera={{ fov: 55, near: 0.1, far: 200 }}
            dpr={[1, 1.5]}
        >
            <NightLakeScene audioRef={audioRef} playing={playing} accentColor={accentColor} />
        </Canvas>
    );
}
