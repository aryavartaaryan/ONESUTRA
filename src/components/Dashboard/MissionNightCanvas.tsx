'use client';

/*
  MissionNightCanvas — Lighter R3F canvas for "The Mission" (Sankalpa) slide.
  Always shows the real-time sky, with floating light particles (intentions rising).
  No audio dependency — fully idle, meditative.
*/

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/* ── Time helpers ────────────────────────────────────────────────────────── */
function getHourFraction() {
    const now = new Date();
    return now.getHours() + now.getMinutes() / 60;
}

function getSkyUniforms(hf: number) {
    if (hf >= 4 && hf < 6) return { top: [0.02, 0.01, 0.08], mid: [0.10, 0.04, 0.22], hor: [0.28, 0.10, 0.30] };
    if (hf >= 6 && hf < 8) return { top: [0.04, 0.05, 0.25], mid: [0.45, 0.18, 0.06], hor: [0.90, 0.45, 0.12] };
    if (hf >= 8 && hf < 12) return { top: [0.10, 0.25, 0.72], mid: [0.22, 0.48, 0.85], hor: [0.55, 0.72, 0.95] };
    if (hf >= 12 && hf < 15) return { top: [0.05, 0.20, 0.80], mid: [0.18, 0.45, 0.92], hor: [0.45, 0.68, 0.98] };
    if (hf >= 15 && hf < 17.5) return { top: [0.08, 0.18, 0.65], mid: [0.32, 0.40, 0.70], hor: [0.75, 0.52, 0.28] };
    if (hf >= 17.5 && hf < 19.5) return { top: [0.08, 0.02, 0.24], mid: [0.48, 0.10, 0.28], hor: [0.88, 0.38, 0.10] };
    return { top: [0.020, 0.044, 0.079], mid: [0.040, 0.067, 0.157], hor: [0.055, 0.088, 0.200] };
}

/* ── Sky shader ──────────────────────────────────────────────────────────── */
const SKY_V = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const SKY_F = `
  uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHor; uniform float uTime;
  varying vec2 vUv;
  void main() {
    float t = vUv.y;
    vec3 c = mix(uHor, mix(uMid, uTop, smoothstep(0.35,1.0,t)), smoothstep(0.0,0.40,t));
    // Night aurora shimmer
    float isNight = step(0.05, (uTop.b - uTop.r));
    float aurora = sin(vUv.x * 4.0 + uTime * 0.10) * 0.5 + 0.5;
    aurora *= smoothstep(0.6,0.8,t) * 0.022 * isNight;
    c += vec3(0.1,0.25,0.5) * aurora;
    gl_FragColor = vec4(c, 1.0);
  }
`;

/* ── Particle / intention light shader ──────────────────────────────────── */
const PART_V = `
  attribute float aPhase;
  attribute float aSpeed;
  uniform float uTime;
  varying float vAlpha;
  void main() {
    float t = mod(uTime * aSpeed + aPhase, 1.0); // 0→1 lifecycle
    vec3 pos = position;
    pos.y += t * 6.0;          // float upward
    pos.x += sin(uTime * 0.4 + aPhase * 6.28) * 0.4; // gentle sway
    float fadeIn  = smoothstep(0.0, 0.15, t);
    float fadeOut = smoothstep(1.0, 0.75, t);
    vAlpha = fadeIn * fadeOut * 0.72;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (1.2 + sin(aPhase * 5.0) * 0.6) * (140.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const PART_F = `
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5,0.02,d) * vAlpha;
    gl_FragColor = vec4(0.85, 0.92, 1.0, alpha);
  }
`;

/* ── Star shader (lightweight) ───────────────────────────────────────────── */
const STAR_V = `attribute float aSize; attribute float aPhase; uniform float uTime; uniform float uVis; varying float vA;
void main() { float tw = 0.4+0.6*sin(uTime*0.7+aPhase); vA=tw*uVis; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=aSize*tw*(200./-mv.z); gl_Position=projectionMatrix*mv; }`;
const STAR_F = `varying float vA; void main() { vec2 c=gl_PointCoord-0.5; if(length(c)>0.5)discard; float a=smoothstep(0.5,0.05,length(c))*vA; gl_FragColor=vec4(0.98,0.97,0.94,a); }`;

const STAR_N = 1200;
function buildStarGeo() {
    const p = new Float32Array(STAR_N * 3), s = new Float32Array(STAR_N), ph = new Float32Array(STAR_N);
    for (let i = 0; i < STAR_N; i++) {
        const theta = Math.random() * Math.PI * 2, phi = Math.acos(Math.random() * 0.55 + 0.05), r = 70 + Math.random() * 20;
        p[i * 3] = r * Math.sin(phi) * Math.cos(theta); p[i * 3 + 1] = r * Math.cos(phi); p[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        s[i] = 0.5 + Math.random() * 1.8; ph[i] = Math.random() * Math.PI * 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(s, 1));
    g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
    return g;
}

const PART_N = 80;
function buildParticleGeo() {
    const p = new Float32Array(PART_N * 3), ph = new Float32Array(PART_N), sp = new Float32Array(PART_N);
    for (let i = 0; i < PART_N; i++) {
        p[i * 3] = (Math.random() - 0.5) * 9; p[i * 3 + 1] = -1 + Math.random() * 2; p[i * 3 + 2] = (Math.random() - 0.5) * 4;
        ph[i] = Math.random(); sp[i] = 0.06 + Math.random() * 0.12;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
    g.setAttribute('aSpeed', new THREE.BufferAttribute(sp, 1));
    return g;
}

/* ── Scene ───────────────────────────────────────────────────────────────── */
function MissionScene() {
    const { camera } = useThree();
    const hf = useMemo(() => getHourFraction(), []);
    const skyC = useMemo(() => getSkyUniforms(hf), [hf]);
    const isNight = hf < 5.5 || hf >= 19.5;
    const isDawnDusk = (hf >= 5.5 && hf < 7.5) || (hf >= 17.5 && hf < 19.5);
    const starVis = isNight ? 1 : isDawnDusk ? 0.4 : 0;

    useEffect(() => {
        camera.position.set(0, 2, 8);
        camera.lookAt(0, 1, 0);
    }, [camera]);

    const skyRef = useRef<THREE.Mesh>(null);
    const starRef = useRef<THREE.Points>(null);
    const partRef = useRef<THREE.Points>(null);

    const skyMat = useMemo(() => new THREE.ShaderMaterial({
        vertexShader: SKY_V, fragmentShader: SKY_F,
        side: THREE.BackSide, depthWrite: false,
        uniforms: {
            uTop: { value: new THREE.Color(...(skyC.top as [number, number, number])) },
            uMid: { value: new THREE.Color(...(skyC.mid as [number, number, number])) },
            uHor: { value: new THREE.Color(...(skyC.hor as [number, number, number])) },
            uTime: { value: 0 },
        },
    }), [skyC]);

    const starGeo = useMemo(() => buildStarGeo(), []);
    const starMat = useMemo(() => new THREE.ShaderMaterial({
        vertexShader: STAR_V, fragmentShader: STAR_F,
        uniforms: { uTime: { value: 0 }, uVis: { value: starVis } },
        transparent: true, depthWrite: false,
    }), [starVis]);

    const partGeo = useMemo(() => buildParticleGeo(), []);
    const partMat = useMemo(() => new THREE.ShaderMaterial({
        vertexShader: PART_V, fragmentShader: PART_F,
        uniforms: { uTime: { value: 0 } },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }), []);

    useFrame(({ clock }) => {
        const t = clock.elapsedTime;
        if (skyRef.current) (skyRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
        if (starRef.current) (starRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
        if (partRef.current) (partRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
    });

    return (
        <>
            <mesh ref={skyRef}><sphereGeometry args={[90, 24, 24]} /><primitive object={skyMat} attach="material" /></mesh>
            {starVis > 0 && <points ref={starRef} geometry={starGeo}><primitive object={starMat} attach="material" /></points>}
            <points ref={partRef} geometry={partGeo}><primitive object={partMat} attach="material" /></points>
            <ambientLight intensity={0.04} color="#a0c0ff" />
        </>
    );
}

export default function MissionNightCanvas() {
    return (
        <Canvas
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            gl={{ antialias: false, alpha: false, powerPreference: 'low-power' }}
            camera={{ fov: 60, near: 0.1, far: 150 }}
            dpr={[1, 1.2]}
        >
            <MissionScene />
        </Canvas>
    );
}
